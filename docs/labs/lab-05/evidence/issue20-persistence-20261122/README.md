# Issue #20 — restart and redeploy persistence evidence, 22 November 2026

Status: **C-05 record-retention checks passed in the supplied restart and redeploy evidence**: the original event and ACTIVE registration remain present after a new instance starts on the same revision and after a separate successful deployment to a new revision. This is the persistence result for these retained records, not completion of all Issue #20 submission work or C-01–C-06. The direct Actions run URL is verified below. Remaining: publish/link the evidence through the reviewed PR flow and complete the final submission checklist. Images were supplied by the operator and inspected when preparing this record; no GCP operation or database change was performed by the documentation agent.

Use only course project `cpe-se-course-2026`, region `asia-southeast1`, service `scccd8b05`. [Issue #20](https://github.com/jetanin/LoungCheu/issues/20). Keep this evidence separate from the historical [Issue #17 deployment round](../issue17-live-20261121/README.md).

## Source and running deployment observations

The local documentation source and deployed app version are different identifiers and must not be substituted for one another.

| Observation | Value transcribed from the supplied screenshot | Evidence |
| --- | --- | --- |
| Local branch | `doc/20-lab5-submission` | [Local source](before/00-local-source.png) |
| Local source HEAD | `9c562d56b333ca878a056f34763192ec3e7e6fdb` | [Local source](before/00-local-source.png) |
| Local working tree at capture | No modified/untracked paths printed; upstream shown as `origin/lab5-staging` | [Local source](before/00-local-source.png) |
| Public origin | `https://scccd8b05-4d7hbszvwq-as.a.run.app` | [Readiness](before/05-before-readiness.png), [service describe](before/04-before-cloud-run.png) |
| Readiness response | `status=ready`, `db=connected`; curl returned JSON, but the screenshot does not print an HTTP status line | [Readiness](before/05-before-readiness.png) |
| App-reported version | `0a2f8bd5540b3db5f7e05fc79fc59e5ae51fd099` | [Readiness](before/05-before-readiness.png) |
| Latest ready revision | `scccd8b05-00005-5xj` | [Service describe](before/04-before-cloud-run.png) |
| Traffic | 100% to `scccd8b05-00005-5xj`, `latestRevision: true` | [Service describe](before/04-before-cloud-run.png) |
| Revision creation time | `2026-11-22T11:16:49.886910Z` (18:16:49.886910 Asia/Bangkok) | [Revision describe](before/06-before-revision-image.png) |
| Revision image | `asia-southeast1-docker.pkg.dev/cpe-se-course-2026/scccd8b05/scccd8b05@sha256:28b5b4fa72bf910369db8f544242cbdde240cff89afee0c0ddbff395d2806e1b` | [Revision describe](before/06-before-revision-image.png) |
| Resolved image digest | `sha256:28b5b4fa72bf910369db8f544242cbdde240cff89afee0c0ddbff395d2806e1b`; spec image and status.imageDigest agree in the capture | [Revision describe](before/06-before-revision-image.png) |

Capture timing matters: the supplied readiness file is named `Screenshot 2026-11-22 181945.png`; the activity/registration images are around 20:04–20:06 and service/revision images around 20:07–20:08. File names are operator capture labels, not independent server timestamps. The registration itself shows 20:05:51 Asia/Bangkok. These are observations at different points, not proof of an uninterrupted instance or a completed restart. The later [restart preflight readiness](before/08-immediately-before-restart-readiness.png), [revision](before/09-before-restart-revision.png) and [configuration](before/10-before-restart-service-config.png) now document the same app version and serving revision before the scaling operation. The readiness command prints 14:05:55 UTC; the screenshot filename is not used as its execution timestamp. Before the separate redeploy, capture the current state again if any other release has intervened. No source-build attestation or tag-to-image mapping is inferred from APP_VERSION alone.

## Persistent records to follow

| Field | Baseline value |
| --- | --- |
| Event name | `L5-C05-20261122-A` |
| Event ID | `1a3914aa-774f-4d13-bd38-105fd08462cd` |
| Organizer | `organizer.a` / Organizer A |
| Description | `Persistence evidence for application restart and redeployment.` |
| Location | `CPE KMUTT` |
| Event status | `PUBLISHED` |
| Capacity | 5 |
| Available / active registrations before registration | 5/5 available; 0 active |
| Available / active registrations after registration | 4/5 available; 1 active |
| Registration closes | 24 November 2026, 23:59 Asia/Bangkok |
| Event starts | 25 November 2026, 09:00 Asia/Bangkok |
| Event ends | 25 November 2026, 12:00 Asia/Bangkok |
| Participant | `participant.a` / Participant A |
| Registration ID / reference | `dd47235f-be9f-46ed-830a-4d49586cf1e2` |
| Registration status | `ACTIVE` |
| Registration time displayed by app | 22 November 2026, 20:05:51 Asia/Bangkok |

- [Public event](https://scccd8b05-4d7hbszvwq-as.a.run.app/events/1a3914aa-774f-4d13-bd38-105fd08462cd)
- [Organizer event](https://scccd8b05-4d7hbszvwq-as.a.run.app/organizer/events/1a3914aa-774f-4d13-bd38-105fd08462cd)
- [My registrations](https://scccd8b05-4d7hbszvwq-as.a.run.app/my/registrations)

These routes may require the appropriate login. The event ID and registration reference must stay identical after each test. Recreating the same title, resetting/reseeding the database or replacing the registration is not evidence that the original records survived. A successful new login alone is not the persistence result.

## Before / after comparison

| Check | Before test | After application restart | After redeploy |
| --- | --- | --- | --- |
| Event ID | `1a3914aa-774f-4d13-bd38-105fd08462cd` | `1a3914aa-774f-4d13-bd38-105fd08462cd` — unchanged | `1a3914aa-774f-4d13-bd38-105fd08462cd` — unchanged |
| Event name | `L5-C05-20261122-A` | `L5-C05-20261122-A` — unchanged | `L5-C05-20261122-A` — unchanged |
| Event status | `PUBLISHED` | `PUBLISHED` | `PUBLISHED` |
| Registration ID | `dd47235f-be9f-46ed-830a-4d49586cf1e2` | `dd47235f-be9f-46ed-830a-4d49586cf1e2` — unchanged | `dd47235f-be9f-46ed-830a-4d49586cf1e2` — unchanged |
| Registration status | `ACTIVE` | `ACTIVE` | `ACTIVE` |
| Available seats / active count | 4/5; 1 active | 4/5; 1 active — unchanged | 4/5; 1 active — unchanged |
| App-reported version | `0a2f8bd5540b3db5f7e05fc79fc59e5ae51fd099` in retained readiness capture | `0a2f8bd5540b3db5f7e05fc79fc59e5ae51fd099` — unchanged | `f8fa8c9519f7196bdf6a8f8a002384e7cbb4089c` — new release |
| Serving revision | `scccd8b05-00005-5xj` in retained service capture | `scccd8b05-00005-5xj` — unchanged; 100% traffic | `scccd8b05-00006-68j` — new; 100% traffic |
| Image digest | `sha256:28b5b4fa72bf910369db8f544242cbdde240cff89afee0c0ddbff395d2806e1b` | Same immutable revision; digest retained from baseline revision describe, not independently re-described after restart | `sha256:33365920b8babb6d9842319e32bd19434b2394fc3e9f8f37be24d0277ee7b6ca` — CLI spec image and status.imageDigest agree |
| Evidence of the actual lifecycle event | Baseline only | Scale 0 succeeded → auto restored → startup log at `2026-11-22T14:45:57.268504Z` on the same revision | Successful Deploy demo screenshot after PR #35; new revision created at `2026-11-22T15:40:12.608973Z` |

## Baseline screenshot index

### Local documentation branch and source

The screenshot records the local branch/source and a clean working tree at that point. It is not the deployed app SHA.

![Local documentation branch and source SHA](before/00-local-source.png)

### Event form

Organizer A filled the name, description, capacity and future registration/event times.

![Persistence activity form](before/01a-event-form.png)

### Draft created

The draft has the event ID to be tracked; it has not been published at this step.

![Persistence activity draft](before/01b-event-draft.png)

### Organizer published the event

The same event is PUBLISHED with 5/5 seats available and zero active registrations.

![Published persistence activity before registration](before/01-before-organizer-event.png)

### Participant before registration

Participant A sees the same event and the registration action.

![Participant viewing the persistence event before registration](before/02a-participant-before-registration.png)

### Registration succeeded

Participant A receives reference `dd47235f-be9f-46ed-830a-4d49586cf1e2`; availability changes to 4/5 with one active registration.

![Persistence event registration succeeded](before/02-before-registration-success.png)

### My registrations

The same registration reference is ACTIVE for `L5-C05-20261122-A`. Other activities visible on the page are not the records used for this C-05 test.

![Baseline active registration and reference](before/03-before-my-registrations.png)

### Service and traffic

The actual service describe output records latestReadyRevisionName and 100% traffic.

![Cloud Run baseline service and traffic](before/04-before-cloud-run.png)

### Database readiness and deployed app version

This readiness capture precedes the activity creation. Refresh it before beginning the lifecycle test rather than claiming it was captured after registration.

![Readiness JSON before the persistence lifecycle test](before/05-before-readiness.png)

### Revision and immutable image

The supplied revision describe output records creationTimestamp, full image reference and imageDigest.

![Baseline revision creation time and immutable image](before/06-before-revision-image.png)

## Evidence and submission checklist

- [x] Local source/branch and a separate deployed-app readiness version captured.
- [x] Dedicated event created/published; event ID retained.
- [x] Participant registered; exact registration reference and ACTIVE state retained.
- [x] Baseline revision/traffic/image digest captured.
- [x] Preflight screenshots retain readiness/version and the serving revision for the restart test: [readiness](before/08-immediately-before-restart-readiness.png), [revision](before/09-before-restart-revision.png), [service configuration](before/10-before-restart-service-config.png).
- Event separation: the restart evidence retains revision `00005-5xj`; the later release evidence shows new revision `00006-68j`. No teammate-coordination message is retained, so coordination itself is not asserted as verified.
- [x] Scale-to-zero/restore and a new-instance startup on the same revision are captured, followed by the original same-ID event and ACTIVE registration; see the restart result below. A zero-instance metric screenshot is not retained, so no direct observed counter/continuous instance count is claimed.
- [x] Separate redeploy captured under `after-redeploy/`: successful Actions screenshot, new revision/image/version and the original same-ID event and ACTIVE registration.
- [x] Comparison table completed for both restart and redeploy; original Event ID and Registration ID match the baseline in both rounds.
- [x] Direct Actions URL verified via GitHub API: [Deploy demo run 45039170919](https://github.com/jetanin/LoungCheu/actions/runs/45039170919), workflow run #5, push to main, completed/success, head `f8fa8c9519f7196bdf6a8f8a002384e7cbb4089c` matching the retained readiness/Actions image.
- [ ] Link the resulting evidence in Issue #20 and the final submission through the team's reviewed PR/release flow. Existing C-01–C-04/C-06 evidence must be assessed separately; this baseline does not establish those results.

Do not store passwords, SESSION_SECRET/DATABASE_URL values, cookies or tokens in screenshots/logs. No visible secret value was identified in the supplied baseline images. This documentation update does not run tests against the live database, reset data, change Cloud Run, deploy an image, commit, push or close Issue #20. The scaling operations in the supplied screenshots were executed by the operator, separately from this documentation work.

## Restart result — 22 November 2026

**Result: original business records retained after a captured instance-replacement/restart sequence on the same revision. The separate redeploy result is now recorded below.**

| Evidence | Observation |
| --- | --- |
| Preflight | App `0a2f8bd5540b3db5f7e05fc79fc59e5ae51fd099`, DB connected, revision `scccd8b05-00005-5xj`, traffic 100% |
| Stop operation | Operator ran `gcloud run services update ... --scaling=0`; command succeeded at `2026-11-22 14:40:08 UTC` (21:40:08 Asia/Bangkok) |
| Restore operation | Operator ran `--scaling=auto`; update succeeded; screenshot does not print an execution timestamp |
| New instance | Cloud Logging records `Starting new instance. Reason: AUTOSCALING` at `2026-11-22T14:45:57.268504Z` (21:45:57.268504 Asia/Bangkok), on the same revision |
| Earlier startup | The same log capture also contains `2026-11-22T14:05:55.565450Z`; this is earlier than the stop and is not presented as the post-restart startup |
| Readiness after restore | `ready`, `db=connected`, same app version |
| Revision after restore | `scccd8b05-00005-5xj`, 100% traffic; no new revision is claimed for this event |
| Original event | Event URL contains `1a3914aa-774f-4d13-bd38-105fd08462cd`; same title, PUBLISHED, capacity 5, availability 4/5 and 1 active registration |
| Original registration | Detail URL and reference contain `dd47235f-be9f-46ed-830a-4d49586cf1e2`; ACTIVE for the same event, original registration time 22 November 2026 20:05:51 Asia/Bangkok |

Scope: the retained evidence combines a successful scale-to-zero command, a successful restore, a later startup on the same revision, DB readiness and unchanged record IDs. There is no screenshot of the instance-count metric at zero and no before/after instanceId pair, so those specific observations are not asserted. This is not redeploy evidence or a new API write test. The app/DB were not reset or reseeded as part of the documented restart sequence.

### Restart preflight

![Assigned project, region, service and public URL](before/07-restart-test-settings.png)

![Preflight DB readiness and app version](before/08-immediately-before-restart-readiness.png)

![Revision recorded before restart](before/09-before-restart-revision.png)

![Preflight service configuration and traffic](before/10-before-restart-service-config.png)

### Stop and restore

![Scale-to-zero command succeeded](after-restart/01-scale-to-zero.png)

![Automatic scaling restored](after-restart/03-restore-auto-scaling.png)

![Readiness after service restore](after-restart/04-readiness.png)

### Same revision, new instance

![Same ready revision and 100 percent traffic](after-restart/05-same-revision.png)

![New-instance startup after scale-to-zero and restore](after-restart/06-instance-startup.png)

### Original records after restart

![Original event remains published with four of five seats available](after-restart/07-original-event.png)

![Original registration reference remains active](after-restart/08-original-registration.png)

The separate redeploy result below now verifies the same record IDs again. The restart result alone was not counted as both lifecycle events; Issue #20 submission/review tasks remain separate.

## Redeploy preflight — 22 November 2026

**Historical pre-redeploy observation.** The four images below record the state before the later deployment; see the separate redeploy result below. These four supplied images were inspected after the restart result had been recorded. They still show the same application version and revision, so they are a preflight observation rather than evidence of a new release.

| Check | Observation |
| --- | --- |
| Project / region / service | `cpe-se-course-2026` / `asia-southeast1` / `scccd8b05` |
| Public origin | `https://scccd8b05-4d7hbszvwq-as.a.run.app` |
| Readiness execution time | `2026-11-22 15:01:19 UTC` = 22:01:19 Asia/Bangkok, from the printed `date -u` output |
| Readiness | `ready`, `db=connected` |
| App-reported version | `0a2f8bd5540b3db5f7e05fc79fc59e5ae51fd099` |
| BEFORE_REDEPLOY_REVISION | `scccd8b05-00005-5xj` |
| Traffic | 100% to the same revision, `latestRevision: true` |

The original event and registration had just been verified in the [restart result](#restart-result--22-november-2026); these four CLI images do not independently re-query the business records. If another release or data change intervenes before the coordinated test, repeat the preflight and retain the actual new starting state.

![Pre-redeploy assigned settings](before/11-before-redeploy-settings.png)

![Pre-redeploy readiness and timestamp](before/12-before-redeploy-readiness.png)

![Revision saved before redeploy](before/13-before-redeploy-revision.png)

![Pre-redeploy serving revision and traffic](before/14-before-redeploy-service-config.png)

The subsequent Actions screenshot is titled “Merge pull request #35 from jetanin/lab5-staging” and the post-deployment captures show a new revision and retained records. See the redeploy result below. The preflight images remain historical and are not relabelled as after-deployment evidence. This documentation edit performs no release or GCP change.

## Redeploy result — 22 November 2026

**Result: the original event and registration remain after a separate deployment to a new revision. Combined with the restart record above, the retained-record persistence check for C-05 passes.** This does not close Issue #20 or prove every final submission criterion.

| Check | Actual retained evidence |
| --- | --- |
| Actions result | `Deploy demo` Success, triggered via push on main; screenshot titled `Merge pull request #35 from jetanin/lab5-staging`, workflow run number #5 |
| Test summary | 16 test files and 168 tests passed in the displayed Vitest summary; test/deploy jobs are green |
| Release commit | `f8fa8c9519f7196bdf6a8f8a002384e7cbb4089c` in Actions Image commit and public readiness version |
| Release PR | [PR #35](https://github.com/jetanin/LoungCheu/pull/35), as identified by the Actions screenshot title; review/merge metadata was not independently fetched in this documentation update |
| Previous serving revision | `scccd8b05-00005-5xj`, retained in the preflight captures |
| New serving revision | `scccd8b05-00006-68j` in Actions and actual service/revision describe output |
| Traffic | 100% to `scccd8b05-00006-68j`, latestRevision=true |
| New revision creation | `2026-11-22T15:40:12.608973Z` = 22:40:12.608973 Asia/Bangkok |
| CLI revision image digest | `sha256:33365920b8babb6d9842319e32bd19434b2394fc3e9f8f37be24d0277ee7b6ca`; spec image and status.imageDigest agree |
| Actions Summary digest | A separate digest starting `sha256:bb3d1ca…` is visible in the screenshot. It is not silently substituted for the CLI digest. Index/child-manifest membership has not been independently inspected for this release, so no exact digest-equivalence claim is made here |
| Readiness and smoke | Public JSON reports ready, db=connected and the new release version; Actions Summary reports read-only smoke passed and Rollback=false |
| Original event | Event ID `1a3914aa-774f-4d13-bd38-105fd08462cd`, title `L5-C05-20261122-A`, PUBLISHED, capacity 5, 4/5 available, 1 active registration |
| Original registration | Reference/detail URL `dd47235f-be9f-46ed-830a-4d49586cf1e2`, ACTIVE; event details and original registration time 22 November 2026 20:05:51 Asia/Bangkok retained |
| Direct Actions run URL | [Deploy demo run 45039170919](https://github.com/jetanin/LoungCheu/actions/runs/45039170919); GitHub API confirms run #5, push/main, completed/success, head `f8fa8c9519f7196bdf6a8f8a002384e7cbb4089c`; run created `2026-11-22T15:35:34Z` (run creation, not revision creation time) |

The immutable revision, changed app version, deployment screenshot and original record IDs establish the observed redeploy/retention sequence. This evidence does not claim an API-level write/rejection test, a complete build attestation, or an independently inspected index-to-child digest mapping for this new release. No data reset or replacement of the tracked records is shown or asserted. The workflow may run its normal migration/non-destructive seed; unchanged record IDs and registration time distinguish retention from creating replacement records.

### Deployment run and summary

![Successful Deploy demo after release PR 35, including test and deployment summary](after-redeploy/01-deployment-run.png)

### Changed ready revision

The “recorded before” value printed in this screenshot is a label copied from the retained preflight evidence. The after value is obtained from a live service describe call; the actual old value is independently visible in the preflight images.

![Recorded previous revision and actual new ready revision](after-redeploy/03-new-revision.png)

### Traffic and image digest

![New revision, creation time, traffic and immutable image digest](after-redeploy/04-new-revision-traffic-digest.png)

### Readiness and new release version

![DB-connected readiness reporting the new release commit](after-redeploy/05-readiness.png)

### Original event after redeploy

![Same event ID still published with four of five seats available](after-redeploy/06-original-event.png)

### Original registration after redeploy

![Same registration reference still active with the original registration time](after-redeploy/07-original-registration.png)

Remaining submission work: link this complete persistence evidence in Issue #20, publish the updated document through the team's reviewed PR/release flow and incorporate it in the final Lab 5 submission. The direct Actions run above is now verified against the retained release SHA. Assess C-01–C-04/C-06 against their own evidence; a single deploy screenshot and this C-05 result do not establish all of them. Keep Issue #20 open until its remaining submission requirements are satisfied.
