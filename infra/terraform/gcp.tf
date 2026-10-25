locals {
  apis = toset([
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "secretmanager.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    # Workload Identity Federation runs on these three.
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "sts.googleapis.com",
    # Observability (docs/architecture/observability.md).
    "telemetry.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com",
    "cloudtrace.googleapis.com",
  ])

  # Values are added by hand (`gcloud secrets versions add`), never in Terraform,
  # so they stay out of state. Every name deploy.yml mounts must exist.
  secrets = toset([
    "database-url",
    "better-auth-secret",
    "s3-access-key-id",
    "s3-secret-access-key",
    "gemini-api-key",
    "cloudflare-account-id",
    "cloudflare-api-token",
    "openrouter-api-key",
    "groq-api-key",
    "langfuse-public-key",
    "langfuse-secret-key",
    "sentry-auth-token",
  ])

  deployer_roles = toset([
    "roles/run.admin",
    "roles/artifactregistry.writer",
  ])

  runtime_roles = toset([
    "roles/secretmanager.secretAccessor",
    "roles/telemetry.writer",
    "roles/serviceusage.serviceUsageConsumer",
  ])

  # Built from this repo and deployed by .github/workflows/deploy.yml.
  app_services = toset(["ai", "api", "web"])

  domains = {
    web = local.web_domain
    api = local.api_domain
  }
}

resource "google_project_service" "apis" {
  for_each           = local.apis
  service            = each.key
  disable_on_destroy = false
}

resource "google_storage_bucket" "tfstate" {
  name                        = "quinchool-tfstate"
  location                    = local.region
  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_artifact_registry_repository" "quinchool" {
  location      = local.region
  repository_id = "quinchool"
  format        = "DOCKER"

  # Storage past 0.5 GB is billed; keep only recent images per service.
  cleanup_policy_dry_run = false

  cleanup_policies {
    id     = "keep-recent"
    action = "KEEP"

    most_recent_versions {
      keep_count = 3
    }
  }

  cleanup_policies {
    id     = "delete-rest"
    action = "DELETE"

    condition {
      tag_state = "ANY"
    }
  }
}

# Docker Hub pull-through cache for upstream images such as crawl4ai.
resource "google_artifact_registry_repository" "dockerhub" {
  location      = local.region
  repository_id = "dockerhub"
  format        = "DOCKER"
  mode          = "REMOTE_REPOSITORY"

  remote_repository_config {
    docker_repository {
      public_repository = "DOCKER_HUB"
    }
  }
}


resource "google_secret_manager_secret" "secrets" {
  for_each  = local.secrets
  secret_id = each.key

  replication {
    auto {}
  }

  lifecycle {
    prevent_destroy = true
  }
}

# GitHub Actions deploys as `deployer`; every service runs as `runtime`.

resource "google_service_account" "deployer" {
  account_id = "quinchool-deployer"
}

resource "google_service_account" "runtime" {
  account_id = "quinchool-runtime"
}

resource "google_project_iam_member" "deployer" {
  for_each = local.deployer_roles
  project  = local.project_id
  role     = each.key
  member   = google_service_account.deployer.member
}

resource "google_project_iam_member" "runtime" {
  for_each = local.runtime_roles
  project  = local.project_id
  role     = each.key
  member   = google_service_account.runtime.member
}

# Build-time only: the web build uploads Sentry source maps.
resource "google_secret_manager_secret_iam_member" "deployer_sentry" {
  secret_id = google_secret_manager_secret.secrets["sentry-auth-token"].id
  role      = "roles/secretmanager.secretAccessor"
  member    = google_service_account.deployer.member
}

# The deployer has to act as the runtime account to deploy services that use it.
resource "google_service_account_iam_member" "deployer_acts_as_runtime" {
  service_account_id = google_service_account.runtime.name
  role               = "roles/iam.serviceAccountUser"
  member             = google_service_account.deployer.member
}

# Workload Identity Federation: keyless auth from GitHub Actions.

resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "github"
}

resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github"
  # Stops any other repository from minting tokens for this project. Do not drop it.
  attribute_condition = "assertion.repository == \"${local.github_owner}/${local.github_repo}\""
  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
  }

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

resource "google_service_account_iam_member" "github_deploys_as_deployer" {
  service_account_id = google_service_account.deployer.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${local.github_owner}/${local.github_repo}"
}

# ponytail: deploy.yml owns image, env, secrets, sidecar and sizing. Terraform only
# makes sure the service exists (placeholder image on a fresh project) and wires IAM.
resource "google_cloud_run_v2_service" "app" {
  for_each = local.app_services
  name     = "quinchool-${each.key}"
  location = local.region

  template {
    service_account = google_service_account.runtime.email

    # Named so deploy.yml can add the OTel sidecar next to it.
    containers {
      name  = "app"
      image = "us-docker.pkg.dev/cloudrun/container/hello"
    }
  }

  lifecycle {
    ignore_changes = all
  }
}

# Upstream image, not built from this repo, so Terraform owns it fully.
resource "google_cloud_run_v2_service" "crawl4ai" {
  name     = "quinchool-crawl4ai"
  location = local.region

  template {
    service_account = google_service_account.runtime.email
    timeout         = "300s"

    containers {
      # Pulled through the Docker Hub proxy; mirror.gcr.io does not carry this tag.
      image = "${local.region}-docker.pkg.dev/${local.project_id}/${google_artifact_registry_repository.dockerhub.repository_id}/unclecode/crawl4ai:0.8.0"

      ports {
        container_port = 11235
      }

      resources {
        cpu_idle          = true
        startup_cpu_boost = false
        limits = {
          cpu    = "1"
          memory = "2Gi"
        }
      }
    }
  }

  lifecycle {
    ignore_changes = [client, client_version]
  }
}

# The browser calls web and api directly.
resource "google_cloud_run_v2_service_iam_member" "public" {
  for_each = toset(["web", "api"])
  name     = google_cloud_run_v2_service.app[each.key].name
  location = local.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Private: only the runtime account calls these, with an ID token.
resource "google_cloud_run_v2_service_iam_member" "ai_invoker" {
  name     = google_cloud_run_v2_service.app["ai"].name
  location = local.region
  role     = "roles/run.invoker"
  member   = google_service_account.runtime.member
}

resource "google_cloud_run_v2_service_iam_member" "crawl4ai_invoker" {
  name     = google_cloud_run_v2_service.crawl4ai.name
  location = local.region
  role     = "roles/run.invoker"
  member   = google_service_account.runtime.member
}

resource "google_cloud_run_domain_mapping" "domains" {
  for_each = local.domains
  name     = each.value
  location = local.region

  metadata {
    namespace = local.project_id
  }

  spec {
    route_name = google_cloud_run_v2_service.app[each.key].name
  }

  lifecycle {
    prevent_destroy = true
    # Import leaves this empty, and any change forces a replace.
    ignore_changes = [spec[0].certificate_mode]
  }
}
