# Repository variables read by .github/workflows/deploy.yml. Nothing here is secret.
locals {
  github_variables = {
    GCP_PROJECT_ID               = local.project_id
    GCP_REGION                   = local.region
    GCP_WIF_PROVIDER             = google_iam_workload_identity_pool_provider.github.name
    GCP_DEPLOYER_SERVICE_ACCOUNT = google_service_account.deployer.email
    GCP_RUNTIME_SERVICE_ACCOUNT  = google_service_account.runtime.email
    WEB_URL                      = "https://${local.web_domain}"
    API_URL                      = "https://${local.api_domain}"
    # A leading dot widens the session cookie to both subdomains.
    COOKIE_DOMAIN = ".${local.web_domain}"
    # Must be run.app URLs, not custom domains: they are the ID token audience.
    AI_SERVICE_URL = google_cloud_run_v2_service.app["ai"].uri
    CRAWL4AI_URL   = google_cloud_run_v2_service.crawl4ai.uri
    GEMINI_MODEL   = "gemini-3.1-flash-lite"
    LANGFUSE_HOST  = "https://jp.cloud.langfuse.com"
    S3_ENDPOINT   = "https://2b4ccec120d284d624dec0ebfddc9848.r2.cloudflarestorage.com"
    S3_REGION     = "auto"
    S3_BUCKET     = "quinchool-uploads"
    # Sentry DSNs are public; the client one ships to every browser.
    SENTRY_DSN             = "https://11948d72a55bc4b9e9e7ba45537d9b45@o4509361321082880.ingest.us.sentry.io/4509361326063616"
    NEXT_PUBLIC_SENTRY_DSN = "https://11948d72a55bc4b9e9e7ba45537d9b45@o4509361321082880.ingest.us.sentry.io/4509361326063616"
    SENTRY_ORG             = "quinch-ia"
    SENTRY_PROJECT         = "quinchool"
  }
}

resource "github_repository" "quinchool" {
  name         = local.github_repo
  description  = "All-in-one Toolkit"
  homepage_url = "http://quinchool.quinchy.dev/"
  visibility   = "public"
  topics       = ["fastapi", "google-cloud-platform", "neondb", "nestjs", "nextjs", "prisma"]

  has_issues      = true
  has_projects    = true
  has_wiki        = false
  has_discussions = false

  allow_merge_commit          = true
  allow_squash_merge          = true
  allow_rebase_merge          = true
  allow_auto_merge            = false
  allow_update_branch         = false
  delete_branch_on_merge      = false
  squash_merge_commit_title   = "COMMIT_OR_PR_TITLE"
  squash_merge_commit_message = "COMMIT_MESSAGES"

  archive_on_destroy = true

  lifecycle {
    prevent_destroy = true
  }
}

# Direct pushes to main stay allowed; main just can't be deleted.
resource "github_repository_ruleset" "protect_main" {
  name        = "Protect main"
  repository  = github_repository.quinchool.name
  target      = "branch"
  enforcement = "active"

  conditions {
    ref_name {
      include = ["~DEFAULT_BRANCH"]
      exclude = []
    }
  }

  rules {
    deletion = true
  }
}

resource "github_actions_variable" "deploy" {
  for_each      = local.github_variables
  repository    = github_repository.quinchool.name
  variable_name = each.key
  value         = each.value
}
