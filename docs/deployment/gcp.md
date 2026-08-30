# Deploying to Google Cloud Run

Four services, all on Cloud Run:

| Service              | Image                | Public? | Talks to             |
| -------------------- | -------------------- | ------- | -------------------- |
| `quinchool-web`      | `apps/web/Dockerfile`| yes     | the API, from the browser |
| `quinchool-api`      | `apps/api/Dockerfile`| yes     | Cloud SQL, the AI service |
| `quinchool-ai`       | `apps/ai/Dockerfile` | no      | crawl4ai, LLM providers |
| `quinchool-crawl4ai` | `unclecode/crawl4ai` | no      | the open web         |

Only the two services the browser touches are public. The AI service and
crawl4ai sit behind Cloud Run IAM, and their callers attach an ID token —
`authorizationHeader()` in `apps/api/src/shared/clients/ai/ai-client.ts` and
`_authorization_header()` in `apps/ai/app/lib/scraping/crawl4ai.py`. Both are
no-ops against an `http://` URL, so local development is unchanged.

Everything below is one-time setup. After it, `.github/workflows/deploy.yml`
builds and deploys all three repo services on every push to `main`.

## 1. Project and APIs

```sh
export PROJECT_ID=quinchool
export REGION=asia-southeast1

gcloud config set project "$PROJECT_ID"
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  iamcredentials.googleapis.com
```

## 2. Artifact Registry

The workflow pushes to `$REGION-docker.pkg.dev/$PROJECT_ID/quinchool/<service>`.

```sh
gcloud artifacts repositories create quinchool \
  --repository-format=docker \
  --location="$REGION"
```

## 3. Cloud SQL for PostgreSQL

The schema uses pgvector (`packages/prisma/migrations/20260802000000_enable_pgvector`),
which Cloud SQL supports on Postgres 15+.

```sh
gcloud sql instances create quinchool \
  --database-version=POSTGRES_17 \
  --region="$REGION" \
  --edition=ENTERPRISE \
  --tier=db-g1-small \
  --storage-size=10GB \
  --availability-type=ZONAL

gcloud sql databases create quinchool --instance=quinchool
gcloud sql users create quinchool --instance=quinchool --password=<password>
```

This is the cheapest instance that runs the schema — roughly USD 25–30/month,
and it is the one line here that costs real money whether or not anyone uses
the app. `db-g1-small` is shared-core; move up to `db-custom-2-7680` if it
starts thrashing. Do not pass a `db-perf-optimized-*` tier: those are Enterprise
Plus only and are rejected with `--edition=ENTERPRISE`.

The API reaches it over the Cloud SQL unix socket attached by
`--add-cloudsql-instances`, so `DATABASE_URL` uses the `host=` form:

```
postgresql://quinchool:<password>@localhost/quinchool?host=/cloudsql/<PROJECT_ID>:<REGION>:quinchool
```

Migrations are not run from CI — the database has no public IP, so CI cannot
reach it. The API container runs `prisma migrate deploy` at boot instead
(`apps/api/Dockerfile`); concurrent instances are safe because `migrate deploy`
takes an advisory lock.

## 4. Secrets

```sh
for name in \
  database-url better-auth-secret \
  gemini-api-key cloudflare-account-id cloudflare-api-token \
  openrouter-api-key groq-api-key \
  langfuse-public-key langfuse-secret-key
do
  printf '%s' "<value>" | gcloud secrets create "$name" --data-file=-
done
```

`better-auth-secret` should be 32+ random bytes: `openssl rand -base64 32`.

Providers are optional — a model falls through to the next provider its config
lists — but every secret named in `deploy.yml` must exist, or the deploy fails.
Create the ones you are not using with an empty value.

## 5. Service accounts

Two: one GitHub Actions authenticates as, one the services run as.

```sh
gcloud iam service-accounts create quinchool-deployer
gcloud iam service-accounts create quinchool-runtime

DEPLOYER="quinchool-deployer@$PROJECT_ID.iam.gserviceaccount.com"
RUNTIME="quinchool-runtime@$PROJECT_ID.iam.gserviceaccount.com"

for role in roles/run.admin roles/artifactregistry.writer; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$DEPLOYER" --role="$role"
done

# The deployer has to act as the runtime account to deploy services that use it.
gcloud iam service-accounts add-iam-policy-binding "$RUNTIME" \
  --member="serviceAccount:$DEPLOYER" \
  --role=roles/iam.serviceAccountUser

for role in roles/cloudsql.client roles/secretmanager.secretAccessor; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$RUNTIME" --role="$role"
done
```

One runtime account for all four services keeps this short. Split it per
service if you want tighter blast radius.

## 6. Workload Identity Federation

Keyless auth from GitHub Actions — no service account JSON key anywhere.

```sh
gcloud iam workload-identity-pools create github --location=global

gcloud iam workload-identity-pools providers create-oidc github \
  --location=global \
  --workload-identity-pool=github \
  --issuer-uri=https://token.actions.githubusercontent.com \
  --attribute-mapping='google.subject=assertion.sub,attribute.repository=assertion.repository' \
  --attribute-condition='assertion.repository == "<owner>/quinchool"'

PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')

gcloud iam service-accounts add-iam-policy-binding "$DEPLOYER" \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/attributes.repository/<owner>/quinchool"
```

The `attribute-condition` is what stops any other repository from minting
tokens for this project. Do not drop it.

## 7. crawl4ai

Not built from this repo — it is the upstream image, deployed once by hand. It
listens on 11235 and needs shared memory for Chromium.

```sh
gcloud run deploy quinchool-crawl4ai \
  --image=unclecode/crawl4ai:0.8.0 \
  --region="$REGION" \
  --service-account="$RUNTIME" \
  --port=11235 \
  --memory=4Gi \
  --cpu=2 \
  --timeout=300 \
  --no-allow-unauthenticated
```

## 8. Let the callers in

Private services still need their caller granted `run.invoker`.

```sh
gcloud run services add-iam-policy-binding quinchool-ai \
  --region="$REGION" --member="serviceAccount:$RUNTIME" --role=roles/run.invoker

gcloud run services add-iam-policy-binding quinchool-crawl4ai \
  --region="$REGION" --member="serviceAccount:$RUNTIME" --role=roles/run.invoker
```

Run this after the first deploy has created `quinchool-ai`.

## 9. GitHub repository variables

`deploy.yml` reads everything from repository *variables* (Settings → Secrets
and variables → Actions → Variables). Nothing here is secret — the actual
secrets live in Secret Manager and are mounted by Cloud Run.

| Variable | Where the value comes from |
| --- | --- |
| `GCP_PROJECT_ID` | You chose it in step 1. `gcloud config get-value project` |
| `GCP_REGION` | You chose it in step 1, e.g. `asia-southeast1`. `gcloud run regions list` |
| `GCP_WIF_PROVIDER` | `gcloud iam workload-identity-pools providers describe github --location=global --workload-identity-pool=github --format='value(name)'` |
| `GCP_DEPLOYER_SERVICE_ACCOUNT` | `quinchool-deployer@$PROJECT_ID.iam.gserviceaccount.com` |
| `GCP_RUNTIME_SERVICE_ACCOUNT` | `quinchool-runtime@$PROJECT_ID.iam.gserviceaccount.com` |
| `CLOUD_SQL_INSTANCE` | `gcloud sql instances describe quinchool --format='value(connectionName)'` |
| `WEB_URL` | The domain you map in step 10, e.g. `https://quinchool.quinchy.dev` |
| `API_URL` | The domain you map in step 10, e.g. `https://api.quinchool.quinchy.dev` |
| `AI_SERVICE_URL` | Only exists after the first deploy: `gcloud run services describe quinchool-ai --region=$REGION --format='value(status.url)'` |
| `CRAWL4AI_URL` | `gcloud run services describe quinchool-crawl4ai --region=$REGION --format='value(status.url)'` |
| `COOKIE_DOMAIN` | `WEB_URL`'s host with a leading dot, e.g. `.quinchool.quinchy.dev` |
| `GEMINI_MODEL` | `gemini-3.1-flash-lite` (the default in `apps/ai/app/core/config.py`) |

`AI_SERVICE_URL` and `CRAWL4AI_URL` must be the service's own `run.app` URL,
not a custom domain: it is the ID token audience Cloud Run checks against.

`API_URL` is used three ways — the web app's `NEXT_PUBLIC_API_URL` build arg,
better-auth's `baseURL`, and the browser's fetch target — so a mismatch shows up
as CORS or cookie failures rather than a build error.

There is one ordering wrinkle: `AI_SERVICE_URL` does not exist until the AI
service has been deployed once, and the API refuses to boot without it
(`env.ts` requires a URL). So the first workflow run deploys `ai` and `web`
and fails on `api`. Fill in `AI_SERVICE_URL` from that run, do the step 8
invoker grant, and re-run — the second run goes green. Every run after that is
a normal three-service deploy.

## 10. Domains

```sh
gcloud beta run domain-mappings create --service=quinchool-web \
  --domain=quinchool.quinchy.dev --region="$REGION"

gcloud beta run domain-mappings create --service=quinchool-api \
  --domain=api.quinchool.quinchy.dev --region="$REGION"
```

Add the DNS records it prints. Domain mappings are not available in every
region; where they are not, put a global external Application Load Balancer
with a serverless NEG in front instead.

The two subdomains share a registrable domain, so the session cookie is
same-site and `SameSite=Lax` still sends it. What it does *not* do by default is
reach the web app's middleware, which reads the cookie itself
(`apps/web/src/proxy.ts`) — hence `COOKIE_DOMAIN`, which widens the cookie to
the shared parent. Leave it unset locally.

## 11. Password reset email

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
