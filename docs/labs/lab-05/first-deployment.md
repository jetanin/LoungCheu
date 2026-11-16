# Issue #17: first deployment preparation (offline)

Status: **prepared and checked offline; no GCP deployment and no C-04 evidence yet**. Branch `deploy/17-lab5-first-deployment` starts from `lab5-staging` after PR #23. Submit the work as `Part of #17`, keep #17 open, and get a teammate review. No GCP CLI command has been executed while preparing this change.

## What is implemented

| File | Behavior |
| --- | --- |
| `deploy/gcp.example.json` | Non-secret resource names and pinned numeric Secret Manager versions; no credential values |
| `deploy/first_deploy.py` | Default offline plan. Future explicit execution checks reviewed clean main and prepared resources, builds an image, resolves its digest, runs a migration/seed job, then creates a private Cloud Run service |
| `deploy/smoke_test.py` | Read-only GET checks for real LoungCheu API envelopes, ready/health DB/version, SPA login, anonymous access rejection and JSON API 404 |
| `deploy/tests/` | Mocked gcloud/HTTP tests; no credentials, cloud resources or production database |
| `.gcloudignore` | Excludes local secrets, dependencies, build output, keys, logs and local evidence from Cloud Build source uploads |
| `.github/workflows/ci-docker.yml` | Runs the Python offline tests after checkout, before application checks; no GCP authentication |

Python scripts use only the standard library and work from CMD, PowerShell or Linux. The example kit's shell scripts create billing-related infrastructure and IAM bindings. This adaptation deliberately leaves those steps to the owner, and does not copy TokTickIT's admin bootstrap, categories endpoint, email login or bearer-token assumptions.

## Do now, without GCP

From the repository root:

```text
python -m unittest discover -s deploy/tests -v
git rev-parse HEAD
python deploy/first_deploy.py --config deploy/gcp.example.json --commit FULL_40_CHARACTER_SHA_FROM_ABOVE
```

Replace the last placeholder with the full Git SHA. The default plan invokes **no subprocess at all**, not even a gcloud describe. Its zero-filled image digest and example run.app URL are display placeholders; do not copy those plan commands for execution. No SDK, login, credit or network is needed for these two Python checks. The mocked execution tests additionally verify that a failed build/migration prevents service deployment and that secret values/driver errors are not printed.

## Owner prerequisites after credits arrive

Use the actual project approved for this course. Follow Guide Ep. 1/5 and handout guidance, reviewing billing, IAM and database commands personally before running them. The preparation script does **not** enable APIs, create IAM roles/keys, create a paid database, change DB passwords, write secret values or grant public access.

Prepare and record:

1. Active project/billing credit; APIs for Cloud Run, Cloud SQL Admin, Artifact Registry, Cloud Build and Secret Manager; budget alert and cost controls reviewed by the owner.
2. A Docker-format Artifact Registry repository in the configured region and Cloud Build identity able to build/push there. Build submission and storage access permissions depend on the project's configured build identity; inspect those rather than assuming a legacy account.
3. A running Cloud SQL PostgreSQL instance in that region, an application database/user and a compatible connection URL. The runtime identity needs Cloud SQL Client access. Use Cloud Run's `/cloudsql/PROJECT:REGION:INSTANCE` Unix socket attachment; do not point DATABASE_URL at localhost TCP inside the container.
4. A runtime service account belonging to this project, permission for the deploying owner to act as it, and secret accessor access scoped to the required secrets. No downloaded service-account JSON keys are needed.
5. Three **different**, enabled Secret Manager secrets, each pinned to a numeric version: the database URL, a stable random session secret (at least 32 characters), and the demo-account seed password. Only the job gets the demo password; only the service gets the session secret; both get the database URL. Do not paste secret values into Git, evidence or agent chat.

For the socket URL, this application's validator requires a hostname, while the pg/Prisma connection uses the socket query parameter. A **placeholder format only** is:

```text
postgresql://DB_USER:URL_ENCODED_PASSWORD@localhost/DB_NAME?host=%2Fcloudsql%2FPROJECT%3AREGION%3AINSTANCE
```

Encode reserved username/password characters before entering the value privately in Secret Manager. Confirm the actual connection using the migration job and readiness on GCP; an offline test cannot prove Cloud SQL connectivity or IAM.

Copy `deploy/gcp.example.json` to ignored `.local/gcp.json`, fill actual resource names/secret references and preview again. Never put values such as DATABASE_URL/passwords in this JSON. It must use exactly the example keys. `max_instances` defaults to 1 and accepts at most 3; database connection limits must be reviewed before raising it. The reference `:1` means the owner must set the actual existing secret version; `latest` is rejected to avoid a moving secret reference.

## First deployment after review and merge to main

The release to main and real GCP setup are still pending. Once prerequisites are ready, run from a **clean, reviewed main checkout** containing these scripts, and pass its exact full SHA:

```text
python deploy/first_deploy.py --config .local/gcp.json --commit REVIEWED_MAIN_SHA
python deploy/first_deploy.py --config .local/gcp.json --commit REVIEWED_MAIN_SHA --execute --confirm-project ACTUAL_PROJECT_ID
```

The second command is a future cloud-changing action for the owner; it was **not run** for this preparation. Every gcloud call has an explicit project and resource location. Execution order:

1. Check clean main/commit, Docker repository, running regional SQL instance, runtime identity and enabled pinned secrets. Refuse an existing service: this script is for first deployment, not routine releases.
2. Cloud Build submits the root Dockerfile and tags it with the reviewed commit. Resolve the digest and use **that exact immutable image** for both the job and service. Source upload uses `.gcloudignore`.
3. Deploy a single-task, no-retry Cloud Run job, with the Cloud SQL attachment, and run `npm run db:migrate && npm run db:seed`. Wait for completion. A failed job stops service creation. Normal app startup does not seed/migrate.
4. Deploy the service privately, with production mode, secure cookies, all-interface PORT 3000, min instances 0, configured max instances, and only secret references. An initial non-public bootstrap origin is replaced immediately with the canonical HTTPS origin returned by Cloud Run.
5. Wait for the latest revision to be ready and write `.local/first-deploy-receipt.json` with project, source commit, image digest, revision and URL. The receipt explicitly says public access and smoke are pending. It is not a C-04 success certificate.

If a command fails after a resource was created, inspect that step in Cloud Console before retrying. Do not delete the database, reseed/reset data or overwrite passwords to hide a failure. In particular, if the private service already exists after a partial attempt, inspect/fix it under a reviewed procedure; this script refuses to silently turn into an update/release tool. Automated rollback and ordinary release CI/CD belong to #19.

## Public access, smoke and C-04 (still pending)

The owner must separately review and open public invocation for the intended service in Cloud Run, respecting any university project policy. The script does not grant `allUsers` or bypass the invoker IAM check. If policy blocks public access, ask the TA rather than weakening project policy.

After public access is approved, run:

```text
python deploy/smoke_test.py https://ACTUAL_SERVICE.run.app --expected-commit REVIEWED_MAIN_SHA
```

The smoke uses only GET requests, no credentials and no login/business writes. It validates the expected deployed commit, follows no redirects, retries transient cold starts, and omits response bodies from failure output. HTTP is rejected except explicit local tests using `--allow-local-http` with `127.0.0.1`.

Then perform C-04 manually on the real URL: sign in, complete LoungCheu's main event/registration journey, and show one rule rejection or access restriction. Record URL-visible screenshots with captions, tested commit, Cloud Run revision/digest and command/run results. Do not show credentials. Update the resource table in deployment.md with confirmed names/URL and link this evidence before closing #17. Keep C-05 (GCP restart/redeploy persistence) and C-06 (repeatable release pipeline) separate.

## Verification record

Offline test results and the exact source hashes for this uncommitted preparation are retained in [Issue #17 offline evidence](evidence/issue17-offline/README.md). They prove the plan/default guards and simulated behavior, not GCP CLI compatibility, actual IAM, Cloud SQL connectivity, a public URL or C-04. The updated GitHub workflow has not been pushed/run by this change yet.

## Primary references checked

- [gcloud Cloud Run job deployment](https://docs.cloud.google.com/sdk/gcloud/reference/run/jobs/deploy)
- [gcloud Cloud Run service deployment](https://docs.cloud.google.com/sdk/gcloud/reference/run/deploy)
- [Cloud Build submission and ignore-file](https://docs.cloud.google.com/sdk/gcloud/reference/builds/submit)
- [Artifact Registry image describe](https://docs.cloud.google.com/sdk/gcloud/reference/artifacts/docker/images/describe)
- [Cloud SQL connection from Cloud Run](https://docs.cloud.google.com/sql/docs/postgres/connect-run)
