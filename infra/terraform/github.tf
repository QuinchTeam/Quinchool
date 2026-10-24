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
    # Sentry DSNs are public; the client one ships to every browser.
    SENTRY_DSN             = "https://11948d72a55bc4b9e9e7ba45537d9b45@o4509361321082880.ingest.us.sentry.io/4509361326063616"
    NEXT_PUBLIC_SENTRY_DSN = "https://11948d72a55bc4b9e9e7ba45537d9b45@o4509361321082880.ingest.us.sentry.io/4509361326063616"
    SENTRY_ORG             = "quinch-ia"
    SENTRY_PROJECT         = "quinchool"
  }
}

resource "github_actions_variable" "deploy" {
  for_each      = local.github_variables
  repository    = local.github_repo
  variable_name = each.key
  value         = each.value
}
