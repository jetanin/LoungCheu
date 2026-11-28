# #87 verification plan - expected outcomes

Actual local outcomes are in results.json; deployed cases remain NOT_EXECUTED.

Owner Jetanin / reviewer Paphangkorn. The listed values are expected outcomes,
not observed results. #100 defines the contract; keep its AC/TEST IDs.

## Fixtures

- Local: disposable Docker DB 55433; automated fixtures may insert an old `ab`
  title directly to represent pre-CR records. Keep local insertion out of live
  API/deployment evidence.
- NEW: owned DRAFT created on the combined version; valid starts/ends/closes and
  positive capacity. Use a descriptive synthetic name for persistent live data.
- LEGACY: owned, editable DRAFT or PUBLISHED with stored title `ab`, created
  before the rule change. Record its ID and state. Do not select a real user's
  event or a CLOSED event for an expected successful edit.
- FLOW: synthetic PUBLISHED with registration still open, capacity 1, zero ACTIVE
  and two participant accounts, for the full/duplicate rejection path.
- Run one isolated invalid-title attempt per case, with all unrelated fields
  valid and valid session/CSRF for validation cases. Native form validation is
  not a substitute for a direct API denial test.

| Case | Phase | AC / TEST | Steps / input | Expected result |
|---|---|---|---|---|
| INT-01 | local | AC-07 / TEST-08 | Owner create form: `ab`, then two emoji `🌱🌱` | New title error `กรุณากรอก 3–120 ตัวอักษร`; no create request |
| INT-02 | local | AC-07 / TEST-08 | Owner create `  abc  ` and three emoji `🌱🌱🌱`, one isolated fixture each | Requests use normalized text; real API 201; own detail readback matches |
| INT-03 | local | AC-07 / TEST-08 | Create 120 emoji then try 121 code points | 120 succeeds; 121 rejected without insertion; code points rather than UTF-16 units |
| INT-04 | local | AC-37/40 / TEST-48/52 | Edit NEW title to `ab` / `🌱🌱` | New field error; no PATCH; stored row unchanged |
| INT-05 | local | AC-37/40 / TEST-48/52 | Edit NEW title to `  abc  ` / `🌱🌱🌱` | Real PATCH 200; trimmed title; owner/shared readback and reload match |
| INT-06 | local | AC-37/40 / TEST-48/52 | Open LEGACY edit form, change only capacity to 4 | PATCH has only capacity, omits title; 200; after reload title still `ab` and capacity 4 |
| INT-07 | local | AC-07/37 / TEST-08/48 | Direct POST and PATCH with title `ab`, valid organizer/CSRF | 400 INVALID_INPUT; fields.title exactly new message; no insert/partial update |
| INT-08 | local | AC-10/40 / TEST-12/13/51 | Short-title write anonymous, participant, missing/wrong CSRF; other organizer with VALID title | 401/403/CSRF403 precede title validation; foreign owner with valid title gets 404; no domain mutation |
| INT-09 | local | AC-06–24,34–40 | Preserved create/publish/register/own/roster; legacy publish/register; full/duplicate rejection | Normal persisted references/counts; rejection leaves counts unchanged; description/location rules remain unchanged |
| LIVE-01 | deployed | NFR-07 / #87 | Compare /api/ready version to full main merge SHA | HTTPS200, ready, DBconnected, exact SHA; retain Date and run timestamp |
| LIVE-02 | deployed | AC-07 / TEST-08 | Synthetic create UI: invalid `ab`/two emoji then valid padded title | UI rejects invalid without request; valid API201 and normalized persisted readback |
| LIVE-03 | deployed | AC-37/40 / TEST-48/52 | Edit synthetic owned event: invalid then valid title | Invalid does not persist; valid PATCH200; reload/GET retains new title |
| LIVE-04 | deployed | AC-37/40 / TEST-48/52 | Eligible pre-deployment LEGACY: change only capacity | PATCH omits title; saved capacity; title unchanged; BLOCKED if no eligible record |
| LIVE-05 | deployed | AC-10/19/22/40 | Anonymous/participant attempt organizer write; cross-owner valid request / private reference | Backend contract401/403/404; no data changes; do not expose private bodies |
| LIVE-06 | deployed | AC-12–14/18/21 | FLOW: A registers; own/roster read; duplicate A request and full B request | Persisted reference and ACTIVE1; duplicate409 ALREADY_REGISTERED; full409 EVENT_FULL; ACTIVE remains1 |

Choose valid schedules relative to actual server time. API status/body evidence
comes from the real browser Network response or a safe authenticated API client;
do not paste tokens into reports. For every rejection capture both the rejection
and the unchanged-data observation where applicable.

## Persistence across an actual operation

Readback after save proves persistence/readback only. To claim restart/redeploy:
select/prepare synthetic records before the actual expected operation; record
same IDs/title/capacity/registration fields with before revision/time; perform
the reviewed planned deployment operation; read the same records afterwards and
record after revision/time. Do not trigger an extra production redeploy merely
to fill a screenshot. Legacy values cannot be created through CR-01 create.
If this additional operation was not observed, state that limit explicitly.

For live LEGACY, record all affected data before editing and use a synthetic
owned record; restoring capacity, if needed, must still respect current ACTIVE.

## Evidence naming

Use `EV-L7-I-01_INT-01_<action>_<YYYYMMDDTHHMMSS+0700>.png` for integration;
use `EV-L7-R-xx` for release checks. Keep original timestamps. The JSON template
contains actual_result=null and status=NOT_EXECUTED until the case is run.
