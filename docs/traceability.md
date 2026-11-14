# Part B — Requirements, Features และ Verification Traceability

**Current evidence reconciliation — 14 พ.ย. 2026:** PR #7/#10 ได้ teammate review โดย i3artuf และ merge เข้า sprint-1-staging แล้ว ตาม snapshot 12 พ.ย.; PR #10 reviewed head `0bd3468`, merge `97a5b91` (10 พ.ย. 16:26:11 Asia/Bangkok). ผล 159 Vitest / 37 Chromium / typecheck / build / compiled smoke 3 PASS เป็นผลรัน 8 พ.ย. ของ source ที่ commit เป็น `3313288`; รอบแก้เอกสารนี้ไม่ได้รันทดสอบแอปใหม่. OS-process restart, independent clean reproduction/UAT และ reviewed main release ยังขาดหลักฐาน; GAP-02 ยัง OPEN และ Product DoD ยังไม่ครบ. [Review/merge evidence](deliverable-1/evidence/review-merge-20261112/README.md). Baseline FR/BR/NFR/AC ไม่เปลี่ยน; F-06–09 อยู่ Sprint 2/3

**Historical Event UI run — 6 พ.ย. 2026:** 145 Vitest / 35 Chromium, typecheck/build/compiled smoke PASS รวม typography/layout/state checks ที่1280/390/320px ดู [current UI evidence](events/visual-consistency.md) ผล141/32 และ seed follow-up ด้านล่างเป็น historical runs

**Seed follow-up (6 พ.ย.):** full Vitest **145 PASS** รวม seed integration ใหม่4 และ typecheck PASS; 141/32 ใน feature audit ด้านล่างเป็นรอบก่อนเพิ่ม seed โดย Chromium/build ไม่ได้ rerun รอบ seed ดู [latest seed results](events/demo-seed.md) ไม่มี AC/scope ใหม่

Documentation baseline v0.5 | 5 พฤศจิกายน 2026

Historical F-01–03 execution: parents04106ff + ada659b ตาม [combined verification](events/consistency-review.md); F-04/F-05 เริ่มที่eeafc31 และ RV-01–03 รวมใน committed/pushed3313288 แล้ว ผลปัจจุบันอ้าง source3313288 โดยแยก execution record8พ.ย.กับ revision reconciliation10พ.ย.

**สถานะ:** F-01–05 implement บน branch นี้; F-04/F-05 และ review fixes อยู่ใน committed/pushed3313288 ดู [PR10](https://github.com/jetanin/LoungCheu/pull/10). Automated coverage ผ่าน แต่ไม่ใช่ staging/main acceptance; V2/V3 ยังเป็น targets

## 1. Functional requirements

| Requirement | Feature / responsibility | Sprint | AC หรือ verification target | Planned tests | Actual file/test/result/commit |
|---|---|---:|---|---|---|
| FR-01 | F-01 | 1 | AC-01–02,05 | TEST-01,02,05 | server/tests/integration/auth.test.ts + server/tests/unit/password.test.ts; API/unit PASS; [latest pre-PR results](sprints/sprint-1/auth-pre-pr-review.md) |
| FR-02 | F-01 | 1 | AC-03–04 | TEST-03,04,06 | server/tests/integration/auth.test.ts; API/DB PASS รวม fixed expiry/disabled/logout; [source/result](deliverable-1/evidence/auth/README.md) |
| FR-03 | F-02 | 1 | AC-06–07,10–11 | TEST-07,08,12–14,36 | events.test.ts + events.spec.ts PASS; [F-02 evidence](events/verification.md) |
| FR-04 | F-02 | 1 | AC-08,10 | TEST-09,10,12,13 | events.test.ts publish/deadline/lock/permissions PASS; [evidence](events/verification.md) |
| FR-05 | F-02 | 1 | AC-09,11 | TEST-11,14,36 | events.test.ts shared fields/visibility/sort/counts/snapshot + events.spec.ts browse/time PASS; [evidence](events/verification.md) |
| FR-06 | F-03 | 1 | AC-12–17 | TEST-15–21 | registration.test.ts 17 cases + combined event/registration journey; own GET readback implemented in registration-views.test.ts; [current results](registration/views-verification.md) |
| FR-07 | F-04 | 1 | AC-18–20 | TEST-22–25 | 3313288: own API/DB/UI and focused browser readback/re-login PASS; [source/results](registration/views-verification.md) |
| FR-08 | F-02,F-05 | 1 | AC-09,21–23 | TEST-11,26–29 | F-02 own events + eeafc31 F-05 scoped roster/count/order/refresh API/DB/UI and focused real browser PASS; [source/results](registration/views-verification.md) |
| FR-09 | F-06 | 2 | V2-01: own ACTIVE cancel ก่อนปิดรับ คืนที่นั่ง; invalid cancel ไม่เปลี่ยนข้อมูล | กำหนด detailed STS ก่อน F-06 coding | — |
| FR-10 | F-06 | 2 | V2-02: owner close และ reject register ต่อ โดยคง registration เดิม | กำหนด detailed STS ก่อน F-06 coding | — |
| FR-11 | F-07 | 2 | V2-03: owner edit ตาม status; capacity ไม่ต่ำกว่า active แม้มี concurrent registration | กำหนด detailed STS ก่อน F-07 coding | — |
| FR-12 | F-06 | 2 | V2-04: reactivate record เดิม ตรวจ capacity/deadline คง registered_at ล้าง cancelled_at และ append history | กำหนด detailed STS ก่อน F-06 coding | — |
| FR-13 | F-08 | 3 | V3-01: owner check-in ACTIVE ในช่วงกิจกรรม; reject invalid/duplicate/cross-owner | กำหนด detailed STS ก่อน F-08 coding | — |
| FR-14 | F-08 | 3 | V3-02: own attendance status ผ่านหน้า F-04 | กำหนด detailed STS ก่อน F-08 coding | — |
| FR-15 | F-09 | 3 | V3-03: totals ของสถานะปัจจุบัน/rate ตรง DB รวม reactivate และ 0 denominator; owner scope | กำหนด detailed STS ก่อน F-09 coding | — |

## 2. Business rules

| Requirement | Feature | Sprint | AC / verification | Planned tests | Actual result/version |
|---|---|---|---|---|---|
| BR-01 | F-02,F-07 | 1/2 | AC-07: strict types/trim/code-point lengths; V2-03 | TEST-08; เพิ่ม tests editing ใน S2 | F-02 create validation PASS; editing S2 pending |
| BR-02 | F-02,F-07 | 1/2 | AC-07–08; V2-03 | TEST-08–10 | F-02 ordering/past DRAFT/publish boundary PASS |
| BR-03 | F-03,F-06 | 1/2 | AC-15; V2-01,02,04 | TEST-18 และ S2 lifecycle cases | F-03 status/deadline/equality/post-lock clock PASS; S2 pending |
| BR-04 | F-03,F-06 | 1/2 | AC-13,17; V2-04: lifecycle fields/history | TEST-16,21 และ S2 reactivation cases | F-03 duplicate/unique-pair races PASS; S2 reactivation/history pending |
| BR-05 | F-03,F-06,F-07 | 1/2 | AC-14,17; V2-01,03,04 | TEST-17,20 และ S2 concurrent mutations | F-03 full/last-seat race + consistent Event ACTIVE counts PASS; S2 pending |
| BR-06 | F-01,F-03,F-04,F-06,F-08 | 1/2/3 | AC-16,19; V2-01,04; V3-02 | TEST-19,23; regression เมื่อเพิ่ม endpoints | S1 PASS: current session/role + session-owned creation and own-read scope; registration-views.test.ts TEST-23, focused browser foreign-reference denial; 3313288. S2/S3 endpoints pending |
| BR-07 | F-01,F-02,F-03,F-05–09 | 1/2/3 | AC-10,16,22; V2-02,03; V3-01,03 | TEST-12,13,19,27 และ future owner tests | S1 PASS: event/roster owner scope and role matrix; registration-views.test.ts TEST-27 (foreign Organizer404/Participant403/anonymous401). 3313288; S2/S3 pending |
| BR-08 | F-06 | 2 | V2-01: deadline equality/closed/already cancelled | กำหนดใน S2 STS | — |
| BR-09 | F-02,F-06 | 1/2 | AC-08; V2-02: close ซ้ำ/เปิดกลับไม่ได้ | TEST-09,10 และ S2 close tests | F-02 DRAFT publish/status precedence PASS; S2 close pending |
| BR-10 | F-03,F-06,F-07 | 1/2 | AC-17; V2-01–04: interleaved transactions | TEST-20,21 และ S2 capacity/cancel/close races | F-03 PostgreSQL separate-connection last-seat/duplicate races PASS; S2 pending |
| BR-11 | F-02,F-06,F-07 | 1/2 | AC-10; V2-03: immutable owner/published times | TEST-13 และ S2 edit restrictions | F-02 session owner/spoof rejection PASS; S2 edit restrictions pending |
| BR-12 | F-08 | 3 | V3-01: time bounds, ACTIVE-only, CLOSED และ duplicate=409 ALREADY_CHECKED_IN โดยข้อมูลเดิมไม่เปลี่ยน | กำหนดใน S3 STS | — |
| BR-13 | F-09 | 3 | V3-03: current-status counts หลัง reactivate, cancelled exclusion, zero count และ rounding; history ไม่ใช่ตัวนับ summary | กำหนดใน S3 STS | — |
| BR-14 | SYS-DATA,F-02,F-03,F-06,F-07,F-08 | 1/2/3 | AC-07,11,15; V2-01,03; V3-01: UTC millisecond, input precision และ clock หลัง event lock | TEST-08,18,36 และ future time-boundary tests | F-02 minute/second ISO offsets/precision/UTC/Bangkok + F-02/F-03 clock-after-lock/deadline equality PASS; future mutations pending |

## 3. Non-functional requirements

| Requirement | Responsibility | Establish / verify | AC / target | Planned verification | Actual measurement/result/version |
|---|---|---|---|---|---|
| NFR-01 | SYS-AUTH,F-01–09 | S1 และทุก Sprint | AC-03,10,16,19,22 | TEST-03,06,12,13,19,23,27 และ future endpoint matrix | S1 API/DB PASS includes F-04/F-05 TEST-23/27 privacy/role/ownership; focused browser foreign-reference/wrong-role PASS. 3313288; future endpoint/deployment checks pending |
| NFR-02 | SYS-AUTH,F-01 | S1; HTTPS config Lab 5 | AC-01,03–05 | TEST-01,03–06; deployment cookie check | F-01 API/DB/unit + browser 7 cases PASS รวม cookie config/rotation/expiry/logout/UI response ordering; deployed HTTPS NOT EXECUTED |
| NFR-03 | SYS-DATA,F-02–05 | S1; redeploy Lab 5 | AC-06,12,18,23,25 | TEST-07,15,22,29,31; Lab 5 persistence | PARTIAL: recreate createApp คง Event/session/Registration reference และ counts ผ่าน DB เดิม; OS process restart/redeploy pending |
| NFR-04 | SYS-DATA,F-03 | S1; regression S2 | AC-17 | TEST-20,21 และ S2 race expansion | registration.test.ts last-seat/duplicate races PASS บน real PostgreSQL separate connections + observed lock barrier; [combined verification](events/consistency-review.md) |
| NFR-05 | SYS-DELIVERY | S1; Docker Lab 5 | AC-25 | TEST-35; fresh Docker build ใน Lab 5 | PARTIAL: F-01 clean npm dependency install/generate/build/test ตรวจโดย Codex; fresh machine/DB และ teammate TEST-35 ยัง pending |
| NFR-06 | SYS-UX,ทุก feature | S1 และต่อเนื่อง | AC-11,20,26 | TEST-14,25,32,33,36 | F-01–05 automated UI/error/retry/private-data lifecycle coverage PASS, including RegistrationViews.test.tsx and focused registration-views.spec.ts; manual/independent browser-device matrix remains pending; [current evidence](registration/views-verification.md) |
| NFR-07 | SYS-DELIVERY | Lab 5; ทุก release หลังจากนั้น | CI gate / deployed version target | Controlled failed check + protected release path + version check | — |
| NFR-08 | SYS-QA | S1; D2; Final | AC-27 | TEST-34; baseline-to-final verification audit | PARTIAL: recorded source/results aligned; PR #7/#10 teammate approvals and staging merges evidenced in [snapshot reconciliation](deliverable-1/evidence/review-merge-20261112/README.md); final board/main release and full process acceptance pending |
| NFR-09 | SYS-QA | Lab 6; Final re-tests | Independent UAT target | 4 UAT cases, accepted defect fix และ partner re-test | — |

## 4. Sprint 1 AC → planned/actual verification

| AC | Feature | Planned tests | Implementation | Actual test file/name | Result / commit |
|---|---|---|---|---|---|
| AC-01 | F-01 | TEST-01 | IMPLEMENTED / Auth base merged | server/tests/integration/auth.test.ts: TEST-01/03 rotates session (PA/OA) | API/DB PASS; [working-tree source/results](deliverable-1/evidence/auth/README.md) |
| AC-02 | F-01 | TEST-02 | IMPLEMENTED / Auth base + consistency fix | auth.test.ts invalid bodies/malformed JSON, generic errors รวม NUL username, trim/exact password | API/DB PASS; [current RED→GREEN](events/consistency-review.md) |
| AC-03 | F-01 | TEST-03,06 | IMPLEMENTED / Auth base + Event host | auth.test.ts identity/isolation/cookie/app recreation/expiry/disabled; auth.spec.ts races/page restore; events-audit.spec.ts mounted-session401/next-account guard | API/DB/browser PASS; [current evidence](events/consistency-review.md) |
| AC-04 | F-01 | TEST-04 | IMPLEMENTED / Auth base merged | auth.test.ts: TEST-04 session destruction / clear cookie (PA/OA), EmptyInput | API/DB PASS; working tree ตาม auth evidence |
| AC-05 | F-01 | TEST-05 | IMPLEMENTED / Auth base merged | auth.test.ts: TEST-05 CSRF/origin/rotation/non-sliding/Secure; unit/password.test.ts, config.test.ts | API/DB/unit PASS; deployment cookie check ยังไม่รัน |
| AC-06 | F-02 | TEST-07 | IMPLEMENTED / review pending | events.test.ts create/readback; events.spec.ts create/preview/reload | API/DB/browser PASS; [working-tree evidence](events/verification.md) |
| AC-07 | F-02 | TEST-08 | IMPLEMENTED / review pending | events.test.ts strict schema/Unicode lengths + escaped JSON max lengths/capacity/time; model.test.ts | API/DB/unit PASS; [current evidence](events/consistency-review.md) |
| AC-08 | F-02 | TEST-09,10 | IMPLEMENTED / review pending | events.test.ts publish/status/deadline/lock wait/concurrent publish | API/DB/browser PASS; [evidence](events/verification.md) |
| AC-09 | F-02 | TEST-11 | IMPLEMENTED / review pending | events.test.ts fields/visibility/sorting ties/ACTIVE/snapshot race; overview.spec.ts real owner-list counts/recent order/isolation | API/DB/browser PASS; [evidence](events/verification.md) |
| AC-10 | F-02 | TEST-12,13 | IMPLEMENTED / review pending | events.test.ts auth/role/CSRF/input/scope matrix | API/DB PASS; [evidence](events/verification.md) |
| AC-11 | F-02 | TEST-14,36 | IMPLEMENTED / review pending | events/events-audit/consistency/visual-consistency.spec.ts UI states, typography/layout, session races; model/API time tests | Current source3313288:159 Vitest/37 Chromium + typecheck/build/smoke PASS; [current evidence](registration/views-verification.md); independent UAT NOT EXECUTED |
| AC-12 | F-03 | TEST-15 | API/DB/browser implemented; own GET รอ #4 | registration.test.ts + events.test.ts composition + events-registration.spec.ts | PASS session-owned ACTIVE/reference readback/recreation + real UI success; full own-list acceptance pending |
| AC-13 | F-03 | TEST-16 | IMPLEMENTED | registration.test.ts — rejects duplicate at capacity 1/2 | PASS / combined regression PASS; merge commit pending |
| AC-14 | F-03 | TEST-17 | IMPLEMENTED | registration.test.ts — rejects full without loser insert | PASS / combined regression PASS; merge commit pending |
| AC-15 | F-03 | TEST-18 | IMPLEMENTED | registration.test.ts — scope/deadline boundaries/lock-wait clock | PASS / combined regression PASS; merge commit pending |
| AC-16 | F-03 | TEST-19 | IMPLEMENTED with staging auth | registration.test.ts — real session/role/CSRF/Origin/spoofing/expiry | PASS / combined regression PASS; merge commit pending |
| AC-17 | F-03 | TEST-20,21 | IMPLEMENTED | registration.test.ts — PostgreSQL last-seat/duplicate races | PASS / combined regression PASS; merge commit pending |
| AC-18 | F-04 | TEST-22,24 | IMPLEMENTED / review pending | registration-views.test.ts own schemas/order/re-login/recreation; registration-views.spec.ts | API/DB PASS; [browser/source results](registration/views-verification.md); 3313288 (committed/pushed RV-01–03) |
| AC-19 | F-04 | TEST-23 | IMPLEMENTED / review pending | registration-views.test.ts cross-user/auth/role/UUID matrix | API/DB PASS; 3313288 (committed/pushed RV-01–03) |
| AC-20 | F-04 | TEST-25 | IMPLEMENTED / review pending | RegistrationViews.test.tsx empty/error/retry/account-change/late reads | UI tests PASS; [browser/source results](registration/views-verification.md); 3313288 (committed/pushed RV-01–03) |
| AC-21 | F-05 | TEST-26,28 | IMPLEMENTED / review pending | registration-views.test.ts minimal sorted roster/ACTIVE count/empty DRAFT; RegistrationViews.test.tsx | API/DB/UI tests PASS; 3313288 (committed/pushed RV-01–03) |
| AC-22 | F-05 | TEST-27 | IMPLEMENTED / review pending | registration-views.test.ts foreign owner/role/anonymous/errors | API/DB PASS; 3313288 (committed/pushed RV-01–03) |
| AC-23 | F-05 | TEST-29 | IMPLEMENTED / review pending | registration-views.test.ts fresh registration/count DB equality; RegistrationViews.test.tsx refresh | API/DB/UI tests PASS; 3313288 (committed/pushed RV-01–03) |
| AC-24 | Cross-feature | TEST-30 | IMPLEMENTED / focused automated journey PASS; review pending | registration-views.spec.ts real publish/register/own read/re-login/roster journey | Focused corrected source suite2 PASS includes full real journey; full Chromium37 PASS; 3313288, not independent UAT; [results](registration/views-verification.md) |
| AC-25 | Cross-feature | TEST-31,35 | PARTIAL / app recreation only | events.test.ts recreate createApp อ่าน session/Event/Registration reference/count เดิม | Automated subset PASS; manual process restart/clean reproduction/full TEST-31,35 NOT EXECUTED |
| AC-26 | Cross-feature | TEST-32,33 | PARTIAL / F-01–05 automated subset | auth/events/registration/registration-views integration + registration-router/RegistrationViews tests + browser error/retry/full conflict/foreign reference/wrong-role access | F-01–05 API/DB access/error schemas and UI wrong-role/foreign/retry checks PASS; no claim of exhaustive manual/full matrix; 3313288 |
| AC-27 | SYS-QA | TEST-34 | PARTIAL / process acceptance pending | baseline review + auth TDD/pre-PR records + PR #7/#10 review/merge snapshots | Substantive teammate approvals/staging merges evidenced; final board, independent acceptance and reviewed main release pending |

## 5. Coverage gaps และการอัปเดต

FR/BR/NFR allocation คง baseline เดิม; automated results159/37/typecheck/build/smoke3 อ้าง recorded source3313288 ตาม [verification](registration/views-verification.md). PR #7/#10 approved/merged staging แล้วตาม snapshot12พ.ย. ผลนี้ไม่ใช่ release-linked rerun. OS-process restart, independent clean reproduction/UAT, final board และ reviewed main release acceptance ยัง pending; GAP-02 OPEN และ Product DoD ยังไม่ครบ
