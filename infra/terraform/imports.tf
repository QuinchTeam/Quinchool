# Adopts the resources created by hand before Terraform. Import blocks are
# no-ops once a resource is in state; delete this file after the first apply.

import {
  to = google_storage_bucket.tfstate
  id = "quinchool-tfstate"
}

import {
  to = google_artifact_registry_repository.quinchool
  id = "projects/${local.project_id}/locations/${local.region}/repositories/quinchool"
}

import {
  for_each = local.secrets
  to       = google_secret_manager_secret.secrets[each.key]
  id       = "projects/${local.project_id}/secrets/${each.key}"
}

import {
  to = google_service_account.deployer
  id = "projects/${local.project_id}/serviceAccounts/quinchool-deployer@${local.project_id}.iam.gserviceaccount.com"
}

import {
  to = google_service_account.runtime
  id = "projects/${local.project_id}/serviceAccounts/quinchool-runtime@${local.project_id}.iam.gserviceaccount.com"
}

import {
  to = google_iam_workload_identity_pool.github
  id = "projects/${local.project_id}/locations/global/workloadIdentityPools/github"
}

import {
  to = google_iam_workload_identity_pool_provider.github
  id = "projects/${local.project_id}/locations/global/workloadIdentityPools/github/providers/github"
}

import {
  for_each = local.app_services
  to       = google_cloud_run_v2_service.app[each.key]
  id       = "projects/${local.project_id}/locations/${local.region}/services/quinchool-${each.key}"
}

import {
  to = google_cloud_run_v2_service.crawl4ai
  id = "projects/${local.project_id}/locations/${local.region}/services/quinchool-crawl4ai"
}

import {
  for_each = local.domains
  to       = google_cloud_run_domain_mapping.domains[each.key]
  id       = "locations/${local.region}/namespaces/${local.project_id}/domainmappings/${each.value}"
}

import {
  for_each = local.github_variables
  to       = github_actions_variable.deploy[each.key]
  id       = "${local.github_repo}:${each.key}"
}
