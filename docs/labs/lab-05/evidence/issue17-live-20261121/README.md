# Issue #17 live deployment evidence — 21 November 2026

Status: manual migration and smoke passed; operator reports live role/business journeys passed. C-04 evidence capture is **incomplete**, so do not close Issue #17 yet.

This is a new live-evidence round. `../issue17-shared-cloud` and `../issue17-offline` remain untouched historical offline records. No secret values, passwords, cookies or tokens belong in this directory.

## Retained evidence and provenance

- [Public readiness response](readiness.json): independently fetched HTTP 200 at the recorded UTC time. The app reports DB connected and APP_VERSION `87c77af07bfbb7f2b4e0d9ada4b69cd79a5c6b5f`; revision/image binding still needs confirmation.
- [Operator transcript excerpts](operator-transcript.log): exact success excerpts supplied in this chat; not a full independently captured Cloud Shell session. Shell variable values were not printed.
- [GitHub merge/CI snapshot](github-record.json): selected public API metadata, collected 21 November 2026, exact source heads, merge commits and Actions conclusions.
- Public app: https://scccd8b05-4d7hbszvwq-as.a.run.app/login
- Issue: https://github.com/jetanin/LoungCheu/issues/17
- PR #24: https://github.com/jetanin/LoungCheu/pull/24
- Release PR #25: https://github.com/jetanin/LoungCheu/pull/25

## Browser results reported by the operator

Organizer: login, create and publish passed. Participant: view and register passed. Inactive account: login rejected. An earlier login error was reported; later operator confirmation supersedes the failing status, without establishing a specific root cause/fix. Screenshots have not yet been supplied.

## Still needed for C-04 / Issue completion

- [ ] Portal Resources ready screenshot and observed time (not inferred from successful deployment).
- [x] Operator-supplied revision `scccd8b05-00002-72x` and matching spec/status image digest `sha256:d5a94a9d6a6f1cbd9ce93789d1f0bcf4af15062f56ca9ca523a1dd80c7a0f5b1`: [revision output](revision.yaml).
- [ ] Confirm service latestReadyRevisionName/traffic points to that revision and retain image/source SHA association evidence.
- [ ] Confirm `completionTime: 2026-11-21T12:05:47.291764Z` belongs to `scccd8b05-migrate-cbp4k`; timestamp was supplied separately by operator.
- [ ] Screenshot of public app/login with URL visible; no password shown.
- [ ] Organizer create/publish and participant registration screenshots, identifying the same activity.
- [ ] Inactive login rejection screenshot (additional business-rule/authorization rejection if required by the assessed journey).
- [ ] Cloud Run/relevant team resource screenshots with credentials removed.
- [ ] Attach URL/screenshots and release metadata directly to Issue #17 and cross-link this record; then update the Issue/project status.

## Collect missing non-secret release metadata in Cloud Shell

```bash
gcloud run services describe scccd8b05 --project=cpe-se-course-2026 --region=asia-southeast1 --format='yaml(status.latestReadyRevisionName,status.traffic)'
gcloud run jobs executions describe scccd8b05-migrate-cbp4k --project=cpe-se-course-2026 --region=asia-southeast1 --format='yaml(status.completionTime,status.succeededCount)'
```

Use the returned ready revision name in:

```bash
gcloud run revisions describe ACTUAL_READY_REVISION --project=cpe-se-course-2026 --region=asia-southeast1 --format='yaml(metadata.name,spec.containers[0].image,status.imageDigest)'
```

These collection commands have not been run by the documentation agent. Do not copy example/zero digests into evidence. #18/#19/#20 proof remains outside this update; include this C-04 set again in the final LEB2 submission under #20.
