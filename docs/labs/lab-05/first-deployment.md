# Issue #17: course-managed first deployment

Status: **manual first deployment and smoke passed; business journeys reported passed; C-04 evidence capture is incomplete**. Use only project `cpe-se-course-2026`, region `asia-southeast1`, team `scccd8b05`. Keep #17 open until the remaining evidence is attached.

## Live deployment record — 21 November 2026

The first manual deployment is reachable at [https://scccd8b05-4d7hbszvwq-as.a.run.app](https://scccd8b05-4d7hbszvwq-as.a.run.app) ([login](https://scccd8b05-4d7hbszvwq-as.a.run.app/login)). This record separates independently collected public/GitHub results from the operator's Cloud Shell output and browser test reports. It does not claim a live automatic deployment pipeline.

| Check | Actual evidence / remaining limitation |
| --- | --- |
| Portal Resources ready time | [Portal screenshot](evidence/issue17-live-20261121/screenshots/13-team-resources.png) shows Resources ready, 6/6 complete and completion time 14:20:02 Thailand time; the date is not visible. Do not Activate again to collect a date. |
| Portal repository review | Operator screenshot reviewed main `87c77af07bfbb7f2b4e0d9ada4b69cd79a5c6b5f`; timestamp not captured. The Starter Kit layout warning is not a deployment failure. |
| Merge sequence | [PR #24](https://github.com/jetanin/LoungCheu/pull/24) merged into `lab5-staging` at 2026-11-20 23:18:57 +07; merge `5a6b3b5445c47fb56d2a97c1a007c314003a1070`. [PR #25](https://github.com/jetanin/LoungCheu/pull/25) merged into `main` at 2026-11-21 13:42:42 +07; merge `87c77af07bfbb7f2b4e0d9ada4b69cd79a5c6b5f`. |
| Release identification | Public `/api/ready` independently returned HTTP 200, `status=ready`, `db=connected`, `version=87c77af07bfbb7f2b4e0d9ada4b69cd79a5c6b5f`; see [raw response](evidence/issue17-live-20261121/readiness.json). This confirms the app's reported APP_VERSION, not an independently verified image/source binding. |
| Migration + seed | Operator reported successful execution [`scccd8b05-migrate-cbp4k`](https://console.cloud.google.com/run/jobs/executions/details/asia-southeast1/scccd8b05-migrate-cbp4k?project=670075229477), 1/1 complete. Command: `npm run db:migrate && npm run db:seed`. |
| Completion time | Operator supplied `2026-11-21T12:05:47.291764Z` (19:05:47.291764 +07); the [Cloud Shell screenshot](evidence/issue17-live-20261121/screenshots/15-cloud-run-cli.png) confirms this completion time belongs to the execution above. This is not the portal-ready or service deployment timestamp. |
| Session secret | Operator's command returned `Created version [1] of the secret [scccd8b05-app-secret-1]`. Intended runtime reference: `scccd8b05-app-secret-1:1`; no secret value retained. |
| Smoke | Operator output: PASS `/api/ready`, `/api/health`, `/login`, `/api/events`, `/api/not-a-real-route`; command `python3 deploy/smoke_test.py "$SERVICE_URL" --expected-commit "$SHA"`. Exact shell variable values were not printed in that transcript. |
| Manual business journey | Operator confirmed organizer login/create/publish PASS; participant view/register PASS; inactive account login rejected. Earlier login problem was reported; operator later confirmed normal use. Resolution details were not supplied; [screenshots now show the journeys](evidence/issue17-live-20261121/README.md#c-04-screenshot-gallery). |
| Revision / immutable image | Operator described `scccd8b05-00002-72x`; spec image and status.imageDigest agree on `sha256:d5a94a9d6a6f1cbd9ce93789d1f0bcf4af15062f56ca9ca523a1dd80c7a0f5b1`; see [revision output](evidence/issue17-live-20261121/revision.yaml). [Cloud Shell screenshot](evidence/issue17-live-20261121/screenshots/15-cloud-run-cli.png) confirms this is latestReadyRevisionName and receives 100% traffic. |
| C-04 screenshots | [16 supplied screenshots and captions](evidence/issue17-live-20261121/README.md#c-04-screenshot-gallery): URL-visible login, organizer create/publish and participant registration for Test2, inactive rejection, Cloud Run Console/CLI and portal status. Refreshed screenshots inspected on 22 November 2026; release-tag/index/manifest mapping is now captured in image 16; the operator confirmed posting the evidence comment to Issue #17 on 22 November 2026; the exact comment permalink was not supplied or independently checked. No independently attested build provenance is claimed. |

The real procedure used individual Cloud Shell commands: Docker build/push with a commit tag, update the existing migration job with portal DB/demo-password secret references, execute with `--wait`, add session-secret version 1, update the existing service with DB/session references, port 3000, production/origin/version settings, move traffic to latest, and smoke-test. The operator has supplied revision/digest output but not a complete build/push command transcript or source-to-image provenance yet; do not present the offline receipt as this deployment's receipt.

See the [live evidence index and C-04 checklist](evidence/issue17-live-20261121/README.md) and [Issue #17](https://github.com/jetanin/LoungCheu/issues/17). Issue #17 remains open while the evidence fields/screenshots are incomplete. #18 merge-gate/WIF proof, #19 automation/rollback and #20 persistence/report work are outside this change.

## Portal resource status and main repository review

These are separate activities. The team resources have supported a successful live migration and reachable app. The portal Resources ready screenshot records completion at 14:20:02 Thailand time but no date; see the live record above without inferring the calendar date.

1. **Resource status, independent of the Git merge:** sign in to the course portal with the registered Gmail and confirm team `scccd8b05`. Check Activate & status first. If activation has never been requested, Activate once using the Lab 5 route when available, or Resources only while repository changes are reviewed. If provisioning is already in progress, wait and return later. If Resources ready, do not Activate again. Record the actual status/time from the portal in the evidence.
2. **Code review and merge:** PR #24 and release PR #25 have merged with passing matching-head CI; see the live record and [CI evidence](ci.md). For future changes, use teammate review and passing CI through `lab5-staging` then `main`. Deploy automation is parked, so this merge does not run deployment.
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

This command was not run during offline preparation. In the live session the operator created version 1 using an equivalent direct-to-Secret-Manager random generator; see the live record. Record only the returned version number, never the secret value. If the version is not 1 or another slot is used, set the non-secret reference before preview/deploy:

```bash
export SESSION_SECRET_REF=scccd8b05-app-secret-3:2
```

For GitHub, set the same reference as variable `SESSION_SECRET_REF` in environment `demo`; the workflow defaults to slot 1 version 1. Use the runtime access arranged by the course; the operator confirmed version 1 creation and a successful live app smoke. Runtime binding details await service/revision evidence. If binding/access is denied, send the exact team secret name and error to the TA; do not modify shared-project IAM or reveal the secret.

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

The last command is a real build/push/migration/service update; run it only after reviewing the plan. It was not run during offline preparation; the operator subsequently used individual Cloud Shell commands as recorded above, rather than demonstrating an end-to-end wrapper run. The wrapper sequence is:

1. Check the main source SHA and clean checkout; describe only `scccd8b05` and `scccd8b05-migrate` to obtain the existing HTTPS URL.
2. Build the existing root Dockerfile for linux/amd64 and push a full-commit-SHA tag to the team registry using Docker. Cloud Build submission is not used.
3. Resolve the exact team image to a validated sha256 digest. Update the existing migration job with `npm run db:migrate && npm run db:seed` and map `DEMO_SEED_PASSWORD` to the portal demo secret. Run one task with no retry and wait. A failed migration stops service update.
4. Update the existing service with that same digest, port 3000, `node dist/server.js`, production mode, all-interface binding, secure cookies, actual `APP_ORIGIN`, `APP_VERSION` and the session secret reference. Keep other portal env/secrets unchanged. Use min instances 0 and max 1, then send traffic to the latest revision.
5. Verify revision readiness and run the read-only smoke against the actual URL and image commit. Save a non-secret receipt in ignored `.local/course-deploy-receipt.json`. A failed smoke does not produce a successful receipt.

The DB URL value is owned by the portal. This application uses it in Prisma and pg sessions. If readiness/migration reports an incompatible URL/socket shape, share only the sanitized error and ask the TA to verify the format; never print or copy the secret value into evidence. No app DB credentials are constructed in these scripts.

The startup command contains no seed/migration; those run only in the separate job. Seed preserves existing accounts and business records. A failed build/migration/smoke may leave an image/job/revision for inspection; do not reset the database or run teardown to hide a failure.

## Deploy workflow parked until Issue #19 (Episode 7)

`.github/workflows/deploy.yml` is retained as a parked draft using the kit name `Deploy demo` and environment `demo`. It has **no push trigger**, and **both jobs are guarded with `if: ${{ false }}`**, so even manual dispatch cannot authenticate, build, migrate or deploy in #17. A skipped/parked run is not deployment evidence. First deployment was performed manually with individual Cloud Shell commands under Episode 5; the wrapper is a documented equivalent procedure, not a claimed executed receipt.

In a separate reviewed #19 change, after manual first deployment and #18 prerequisites, configure the portal's `GCP_PROJECT_ID`, `GCP_REGION`, `WIF_PROVIDER`, `WIF_SERVICE_ACCOUNT` and session-secret reference in environment `demo`, restore main-only trigger/job conditions, then prove the normal CI → build/push → migrate → update → smoke path and rollback path. The prepared smoke command includes **`--expected-commit "$IMAGE_TAG"`**. Do not merely remove the false guard without restoring CI-success/main restrictions. No WIF JSON key is needed. Neither this parked workflow nor WIF has been proven live by this PR.

## Finish Issue #17

These follow-up tasks may happen after the code PR/release PR is merged, but must happen before closing #17. Check/Activate the actual team resources in the portal, run first deployment manually from reviewed main, and after a successful real deployment retain the source SHA, image digest, revision, service URL, sanitized command output and smoke result. The operator has now reported passing login/business/rejection checks; their refreshed screenshots and exact revision/digest/traffic are now recorded in the gallery. Retain build/source evidence and attach the set directly to the Issue. For reproducibility, manually sign in on the public URL using LoungCheu usernames such as `organizer.a` and `participant.a`, create/publish/register an event and show a rule/access rejection with URL-visible screenshots. Obtain the portal demo-secret credentials only through the course's private channel/TA if needed; do not use the kit's example email login or print the password. That is the remaining C-04 evidence. CI/merge-gate C-02, repeatable release C-06 and GCP persistence C-05 stay separate.

Resources ready, a preview, or a successful mocked test does not close #17. Live readiness/smoke and operator-reported journeys are now recorded above; URL-visible screenshots, revision/digest and traffic evidence are retained; tag/index/manifest mapping is now captured; the operator confirmed posting the evidence comment to Issue #17 on 22 November 2026; the exact comment permalink was not supplied or independently checked. No independently attested source/build provenance is claimed. Keep repository and service available through grading.

## Evidence

See [shared-course offline evidence](evidence/issue17-shared-cloud/README.md) for the actual commands/output and exact working-tree source hashes. Earlier owner-provisioned tests in `evidence/issue17-offline` are historical and do not validate this new course workflow.

## C-04 screenshots

See the [screenshot gallery with 16 images and captions](evidence/issue17-live-20261121/README.md#c-04-screenshot-gallery). The refreshed app images show the public URL and the gallery includes Cloud Run Console/CLI. Release-tag/index/manifest mapping is documented in image 16. The operator confirmed the direct Issue evidence comment on 22 November 2026; review/merge and final Issue status remain follow-up items; this does not claim Issue #17 is closed.

## Release tag and image identity

[Image 16](evidence/issue17-live-20261121/screenshots/16-image-tag-digest.png) verifies tag `87c77af07bfbb7f2b4e0d9ada4b69cd79a5c6b5f` → OCI index `sha256:e4054b99bf312ef871bd08e4c660599961da94638397d0d90954ee8a01ea5397` → linux/amd64 manifest `sha256:d5a94a9d6a6f1cbd9ce93789d1f0bcf4af15062f56ca9ca523a1dd80c7a0f5b1`. This child digest matches revision `scccd8b05-00002-72x` in [revision.yaml](evidence/issue17-live-20261121/revision.yaml); [service output](evidence/issue17-live-20261121/screenshots/15-cloud-run-cli.png) records 100% traffic to that revision. This is tag-to-deployed-image identity evidence, not an independently attested build from source. The operator confirmed posting the direct Issue #17 evidence comment on 22 November 2026. The exact comment permalink was not supplied or independently checked; review/merge and final Issue/project status are not marked complete by this edit.
