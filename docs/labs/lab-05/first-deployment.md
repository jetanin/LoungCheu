# Issue #17: course-managed first deployment

Status: **adapted offline for the course portal; not deployed and no C-04 evidence yet**. Use only project `cpe-se-course-2026`, region `asia-southeast1`, and team `scccd8b05`. This supersedes the earlier owner-provisioned first-deployment instructions. Keep Issue #17 open until the actual app works on its public URL and its C-04 evidence is recorded.

## Portal resource status and main repository review

These are separate activities. The assigned prefix/names are known from the downloaded team kit; **the team's current portal provisioning status has not been checked in this PR**. Do not infer either Resources ready or not provisioned from that kit.

1. **Resource status, independent of the Git merge:** sign in to the course portal with the registered Gmail and confirm team `scccd8b05`. Check Activate & status first. If activation has never been requested, Activate once using the Lab 5 route when available, or Resources only while repository changes are reviewed. If provisioning is already in progress, wait and return later. If Resources ready, do not Activate again. Record the actual status/time from the portal in the evidence.
2. **Code review and merge:** let the latest head of PR #24 pass CI and receive teammate review, merge into `lab5-staging`, then review/merge the release PR into `main` with passing CI. Deploy automation is parked, so this merge does not run deployment.
3. **Repository review on main:** after the code is on main, refresh the portal's Lab 5 repository review and verify the reviewed main SHA. An earlier review of `0853ce2` cannot see files that existed only on staging. Rechecking the repo is not a reason to request resource activation twice.
4. **Manual deployment:** only after Resources ready, required session-secret setup and a clean reviewed main checkout, preview and run the first deployment manually as below. Resources ready alone is not app deployment or C-04 evidence.

The downloaded `lab5-starter-kit-scccd8b05` supplies the correct resource names and three entry-point filenames. Its remaining TokTickIT commands required adaptation: use `db:seed`, `DEMO_SEED_PASSWORD`, session-based auth, the workspace Dockerfile and LoungCheu's actual smoke interface. Do not overwrite the application's Dockerfile or `ci-docker.yml` with unrelated templates.

## Assigned resources

| Resource | Name |
| --- | --- |
| Project / region | `cpe-se-course-2026` / `asia-southeast1` |
| Cloud Run service | `scccd8b05` |
| Migration job | `scccd8b05-migrate` |
| Registry/image | `asia-southeast1-docker.pkg.dev/cpe-se-course-2026/scccd8b05/scccd8b05` |
| Portal database secret | `scccd8b05-database-url` |
| Portal demo-password secret | `scccd8b05-demo-password` |
| Session-secret reference (default) | `scccd8b05-app-secret-1:1` |

The scripts only describe exact team resources and update the existing job/service. They never list the shared project, enable APIs, create SQL/IAM/secrets, change public access or run teardown. Existing service account, Cloud SQL attachment and unrelated env/secret bindings are preserved. `--update-env-vars` and `--update-secrets` change only named entries. Credit and infrastructure are shared; do not create another database.

## Prepare the session secret once

LoungCheu requires `SESSION_SECRET` with at least 32 private random characters. It must remain stable across releases so sessions survive. The kit's admin password is not a replacement for this secret.

Use one of the five assigned app-secret slots. The default is slot 1, version 1. If that slot already contains another application secret, choose a free slot; do not overwrite or repurpose it. Use the portal Project Kit's hidden-input secret command if available, or have the TA help add the value to that exact slot. A Cloud Shell alternative, **only after confirming slot 1 is unused**, generates a value directly into Secret Manager without printing it:

```bash
python3 -c 'import secrets; print(secrets.token_hex(32))' | gcloud secrets versions add scccd8b05-app-secret-1 --data-file=- --project=cpe-se-course-2026
```

This future cloud-changing command was not run during preparation. Record only the returned version number, never the secret value. If the version is not 1 or another slot is used, set the non-secret reference before preview/deploy:

```bash
export SESSION_SECRET_REF=scccd8b05-app-secret-3:2
```

For GitHub, set the same reference as variable `SESSION_SECRET_REF` in environment `demo`; the workflow defaults to slot 1 version 1. Use the runtime access arranged by the course; actual slot readiness/access has not been verified by this PR. If binding/access is denied, send the exact team secret name and error to the TA; do not modify shared-project IAM or reveal the secret.

## Preview and offline tests

In Bash (Cloud Shell/Git Bash), from the repository root:

```bash
python3 -m unittest discover -s deploy/tests -v
bash -n deploy/deploy.sh
bash -n deploy/release.sh
DRY_RUN=1 bash deploy/deploy.sh
```

Python on Windows CMD/PowerShell works too:

```text
python -m unittest discover -s deploy/tests -v
python deploy/first_deploy.py
```

The Python preview invokes no external commands and uses a zero SHA/digest and sample URL when no commit is supplied. It does not deploy or print secret values. `first_deploy.py` remains a compatibility entry point but now delegates to course-only update logic in `course_cloud.py`. Legacy arbitrary-project/owner-resource JSON configurations are rejected; `gcp.example.json` now contains the course names and secret references only.

## First deployment after review and merge to main

Before running: portal resources ready; session slot initialized; correct registered Gmail; clean reviewed `main` containing these scripts; Docker and gcloud available (Cloud Shell has them). In Cloud Shell, authenticate as that Gmail if necessary, select the course project and use a clean clone of reviewed main. Do not copy a local `.env` or credentials into the image.

```bash
gcloud config set project cpe-se-course-2026
git status --short --branch
DRY_RUN=1 bash deploy/deploy.sh
DRY_RUN=0 bash deploy/deploy.sh
```

The last command is a real build/push/migration/service update; run it only after reviewing the plan. It was not run during preparation. The sequence is:

1. Check the main source SHA and clean checkout; describe only `scccd8b05` and `scccd8b05-migrate` to obtain the existing HTTPS URL.
2. Build the existing root Dockerfile for linux/amd64 and push a full-commit-SHA tag to the team registry using Docker. Cloud Build submission is not used.
3. Resolve the exact team image to a validated sha256 digest. Update the existing migration job with `npm run db:migrate && npm run db:seed` and map `DEMO_SEED_PASSWORD` to the portal demo secret. Run one task with no retry and wait. A failed migration stops service update.
4. Update the existing service with that same digest, port 3000, `node dist/server.js`, production mode, all-interface binding, secure cookies, actual `APP_ORIGIN`, `APP_VERSION` and the session secret reference. Keep other portal env/secrets unchanged. Use min instances 0 and max 1, then send traffic to the latest revision.
5. Verify revision readiness and run the read-only smoke against the actual URL and image commit. Save a non-secret receipt in ignored `.local/course-deploy-receipt.json`. A failed smoke does not produce a successful receipt.

The DB URL value is owned by the portal. This application uses it in Prisma and pg sessions. If readiness/migration reports an incompatible URL/socket shape, share only the sanitized error and ask the TA to verify the format; never print or copy the secret value into evidence. No app DB credentials are constructed in these scripts.

The startup command contains no seed/migration; those run only in the separate job. Seed preserves existing accounts and business records. A failed build/migration/smoke may leave an image/job/revision for inspection; do not reset the database or run teardown to hide a failure.

## Deploy workflow parked until Issue #19 (Episode 7)

`.github/workflows/deploy.yml` is retained as a parked draft using the kit name `Deploy demo` and environment `demo`. It has **no push trigger**, and **both jobs are guarded with `if: ${{ false }}`**, so even manual dispatch cannot authenticate, build, migrate or deploy in #17. A skipped/parked run is not deployment evidence. First deployment remains the manual `deploy/deploy.sh` procedure in Episode 5.

In a separate reviewed #19 change, after manual first deployment and #18 prerequisites, configure the portal's `GCP_PROJECT_ID`, `GCP_REGION`, `WIF_PROVIDER`, `WIF_SERVICE_ACCOUNT` and session-secret reference in environment `demo`, restore main-only trigger/job conditions, then prove the normal CI → build/push → migrate → update → smoke path and rollback path. The prepared smoke command includes **`--expected-commit "$IMAGE_TAG"`**. Do not merely remove the false guard without restoring CI-success/main restrictions. No WIF JSON key is needed. Neither this parked workflow nor WIF has been proven live by this PR.

## Finish Issue #17

These follow-up tasks may happen after the code PR/release PR is merged, but must happen before closing #17. Check/Activate the actual team resources in the portal, run first deployment manually from reviewed main, and after a successful real deployment retain the source SHA, image digest, revision, service URL, sanitized command output and smoke result. Then manually sign in on the public URL using LoungCheu usernames such as `organizer.a` and `participant.a`, create/publish/register an event and show a rule/access rejection with URL-visible screenshots. Obtain the portal demo-secret credentials only through the course's private channel/TA if needed; do not use the kit's example email login or print the password. That is the remaining C-04 evidence. CI/merge-gate C-02, repeatable release C-06 and GCP persistence C-05 stay separate.

Resources ready, a preview, or a successful mocked test does not close #17. No public app success is claimed by this offline adaptation. Keep repository and service available through grading.

## Evidence

See [shared-course offline evidence](evidence/issue17-shared-cloud/README.md) for the actual commands/output and exact working-tree source hashes. Earlier owner-provisioned tests in `evidence/issue17-offline` are historical and do not validate this new course workflow.
