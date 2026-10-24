# Deploying to Google Cloud Run

Four services, all on Cloud Run:

| Service              | Image                 | Public? | Talks to                  |
| -------------------- | --------------------- | ------- | ------------------------- |
| `quinchool-web`      | `apps/web/Dockerfile` | yes     | the API, from the browser |
| `quinchool-api`      | `apps/api/Dockerfile` | yes     | NeonDB, the AI service    |
| `quinchool-ai`       | `apps/ai/Dockerfile`  | no      | crawl4ai, LLM providers   |
| `quinchool-crawl4ai` | `unclecode/crawl4ai`  | no      | the open web              |

Only the two services the browser touches are public. The AI service and
crawl4ai sit behind Cloud Run IAM, and their callers attach an ID token —
`authorizationHeader()` in `apps/api/src/shared/clients/ai/ai-client.ts` and
`_authorization_header()` in `apps/ai/app/lib/scraping/crawl4ai.py`. Both are
no-ops against an `http://` URL, so local development is unchanged.

## Who owns what

| Thing                                                                                                                                        | Owner                                          |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| APIs, Artifact Registry, secret names, service accounts, IAM, Workload Identity Federation, crawl4ai, domain mappings, GitHub repo variables | `infra/terraform/`                             |
| Image, env vars, mounted secrets, sizing and OTel sidecar of `web`, `api`, `ai`                                                              | `.github/workflows/deploy.yml`, on every push  |
| Secret values                                                                                                                                | By hand, `gcloud secrets versions add`         |
| Database                                                                                                                                     | NeonDB, outside GCP; its URL is `database-url` |

Terraform creates the three app services with a placeholder image and then
ignores them (`ignore_changes = all`), so it never fights the deploy workflow.

## Running Terraform

Needs `gcloud`, `terraform` (1.7+) and `gh`, all logged in.

```sh
gcloud auth application-default login
export GITHUB_TOKEN=$(gh auth token)

cd infra/terraform
terraform init
terraform plan
terraform apply
```

Read the plan before applying. Secrets, domain mappings and the state bucket
have `prevent_destroy`, so a plan that would replace them fails instead.

State lives in the `quinchool-tfstate` GCS bucket. On a brand-new project,
create it once before `terraform init`:

```sh
gcloud storage buckets create gs://quinchool-tfstate \
  --location=asia-southeast1 --uniform-bucket-level-access
```

Then add every secret value, since the deploy fails if a mounted secret has no
version. Create the ones you are not using with an empty value.

```sh
printf '%s' "<value>" | gcloud secrets versions add <name> --data-file=-
```

`better-auth-secret` should be 32+ random bytes: `openssl rand -base64 32`.

## Notes

`AI_SERVICE_URL` and `CRAWL4AI_URL` must be the service's own `run.app` URL,
not a custom domain: it is the ID token audience Cloud Run checks against.
Terraform reads them straight from the services.

`API_URL` is used three ways — the web app's `NEXT_PUBLIC_API_URL` build arg,
better-auth's `baseURL`, and the browser's fetch target — so a mismatch shows up
as CORS or cookie failures rather than a build error.

The two subdomains share a registrable domain, so the session cookie is
same-site and `SameSite=Lax` still sends it. What it does _not_ do by default is
reach the web app's middleware, which reads the cookie itself
(`apps/web/src/proxy.ts`) — hence `COOKIE_DOMAIN`, which widens the cookie to
the shared parent. Leave it unset locally.

Domain mappings print DNS records on creation; add them at the DNS provider.
They are not available in every region; where they are not, put a global
external Application Load Balancer with a serverless NEG in front instead.

`SENTRY_AUTH_TOKEN` is stored as the `sentry-auth-token` secret. The deployer
reads it only during the web build to upload source maps; BuildKit mounts it as
a secret so it never lands in image history.

Migrations are not run from CI. The API container runs `prisma migrate deploy`
at boot (`apps/api/Dockerfile`); concurrent instances are safe because
`migrate deploy` takes an advisory lock.

## Password reset email

`sendResetPassword` in `apps/api/src/core/auth/better-auth.ts` still logs the
reset link to stdout instead of sending it. In production that link lands in
Cloud Logging, visible to anyone with log access. Wire up a real sender before
letting users reach the forgot-password flow.

## Smoke test before the first deploy

Builds are the slowest thing to get wrong in CI, so build them locally first:

```sh
docker build -f apps/api/Dockerfile -t quinchool-api .
docker build -f apps/ai/Dockerfile -t quinchool-ai .
docker build -f apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:3001 -t quinchool-web .
```
