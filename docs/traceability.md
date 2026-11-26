# Part B — Requirements, Features และ Verification Traceability

**F-06 reconciliation — 24 พ.ย. 2026:** implementation/local verification บน `feature/47-f06` ถึง user-supplied source `ba89488079a2c884735a18642dbd7487b6872559`; ดู [Sprint 2 completion](sprints/sprint-2/README.md). ผล Sprint 1 ด้านล่างเป็น historical evidence; F-06 มี actual process-restart แล้ว แต่ CI/review/release/independent UAT และ TEST-44(c) ยังไม่ถือว่าผ่าน

**Sprint 2 release — 26 พ.ย. 2026:** F-06/F-07 release บน main เป็น `v2.0.0-sprint-2` (`c0faf24`, release PR #67 approved โดย i3artuf, merge 26 พ.ย. 00:45 Asia/Bangkok). CI run [45666007554](https://github.com/jetanin/LoungCheu/actions/runs/45666007554) บน release head `0643806` (tree เดียวกับ `c0faf24`): Vitest 25 files 264/264, Playwright 39/39, 0 failed/skipped. Deploy run 45668146212 รัน test บน `c0faf24` ซ้ำ (264/264, 39/39) แล้ว migrate → revision `scccd8b05-00011-fvb`, `/api/ready` version = `c0faf24`. คอลัมน์ Accepted release ของ AC-28–AC-40 อ้าง release นี้; ไม่ใช่ independent UAT ของ Sprint 2 (ยังไม่มี). Main ปัจจุบัน `v2.0.1-lab6` (`6f49d32`) ไม่เปลี่ยนโค้ดแอป

**F-07 / staging update — 25 พ.ย. 2026 (ประวัติ):** F-06 (PR #59 `24ebf07`), F-07 (PR #57 `582a60d`) และ cross-feature TEST-44(c)/47/52 (PR #60 `128c35c`) review และ merge เข้า sprint-2-staging แล้ว CI `test-and-docker` ผ่านทุก PR; Sprint 2 release บน main ยัง pending. ข้อความ 24 พ.ย. ด้านบนคงไว้เป็นประวัติ

**Current evidence reconciliation — 14 พ.ย. 2026:** PR #7/#10 ได้ teammate review โดย i3artuf และ merge เข้า sprint-1-staging แล้ว ตาม snapshot 12 พ.ย.; PR #10 reviewed head `0bd3468`, merge `97a5b91` (10 พ.ย. 16:26:11 Asia/Bangkok). ผล 159 Vitest / 37 Chromium / typecheck / build / compiled smoke 3 PASS เป็นผลรัน 8 พ.ย. ของ source ที่ commit เป็น `3313288`; รอบแก้เอกสารนี้ไม่ได้รันทดสอบแอปใหม่. OS-process restart, independent clean reproduction/UAT และ reviewed main release ยังขาดหลักฐาน; GAP-02 ยัง OPEN และ Product DoD ยังไม่ครบ. [Review/merge evidence](deliverable-1/evidence/review-merge-20261112/README.md). Baseline FR/BR/NFR/AC ไม่เปลี่ยน; F-06–09 อยู่ Sprint 2/3

**Historical Event UI run — 6 พ.ย. 2026:** 145 Vitest / 35 Chromium, typecheck/build/compiled smoke PASS รวม typography/layout/state checks ที่1280/390/320px ดู [current UI evidence](events/visual-consistency.md) ผล141/32 และ seed follow-up ด้านล่างเป็น historical runs

**Seed follow-up (6 พ.ย.):** full Vitest **145 PASS** รวม seed integration ใหม่4 และ typecheck PASS; 141/32 ใน feature audit ด้านล่างเป็นรอบก่อนเพิ่ม seed โดย Chromium/build ไม่ได้ rerun รอบ seed ดู [latest seed results](events/demo-seed.md) ไม่มี AC/scope ใหม่

Documentation baseline v1.0 | พฤศจิกายน 2026

ผล159/37 ในตารางอ้าง recorded source3313288; merge commit ที่ระบุคือ workflow evidence ไม่ใช่ tested commit ของผลนั้น. AC-25/26/27 ยัง PARTIAL ตามขอบเขตหลักฐาน

Historical F-01–03 execution: parents 04106ff + ada659b ตาม [combined verification](events/consistency-review.md); F-04/F-05 รวมใน PR #10 และ merge เข้า staging commit `97a5b91`.

**สถานะ:** F-01–05 รวมเข้าสู่ `sprint-1-staging` ครบถ้วน พร้อมสำหรับการเปิด Release PR เข้าสู่ `main` ภายใต้แท็ก `v1.0.0-sprint-1`

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
| FR-09 | F-06 | 2 | AC-28,31,32: own cancel/คืนที่นั่ง/deadline | TEST-37,40–43 | Local API/DB/UI/browser PASS; cancellation.ts + lifecycle tests; [F-06 completion](sprints/sprint-2/README.md); **26 พ.ย.:** TEST-37–52 ที่เกี่ยวข้อง PASS ใน CI ของ release `v2.0.0-sprint-2` (`c0faf24`; run 45666007554 และ deploy run 45668146212) |
| FR-10 | F-06 | 2 | AC-30–32: owner close และคง registrations/history | TEST-39–43 | Local API/DB/UI/browser PASS; events service.close + lifecycle tests; [F-06 completion](sprints/sprint-2/README.md); **26 พ.ย.:** TEST-37–52 ที่เกี่ยวข้อง PASS ใน CI ของ release `v2.0.0-sprint-2` (`c0faf24`; run 45666007554 และ deploy run 45668146212) |
| FR-11 | F-07 | 2 | AC-34–40 (V2-03): owner edit ตาม status; capacity ไม่ต่ำกว่า active แม้มี concurrent registration | TEST-45–52 | event-edit.test.ts + event-patch.test.ts + EventEdit.test.tsx + event-edit.spec.ts; reviewed/merged sprint-2-staging, CI PASS (PR #57 `582a60d`, PR #60 `128c35c`); [F-07 completion](sprints/sprint-2/README.md#f-07-completion-record); **26 พ.ย.:** TEST-37–52 ที่เกี่ยวข้อง PASS ใน CI ของ release `v2.0.0-sprint-2` (`c0faf24`; run 45666007554 และ deploy run 45668146212) |
| FR-12 | F-06 | 2 | AC-29,31,33: reactivate reference/first time เดิมและ history | TEST-38,40,42–44 | Local PASS สำหรับ reactivate/races/44(a,b) และ TEST-44(c) ([cross-feature evidence](sprints/sprint-2/evidence/f07-cross-feature/README.md)); [F-06 completion](sprints/sprint-2/README.md); **26 พ.ย.:** TEST-37–52 ที่เกี่ยวข้อง PASS ใน CI ของ release `v2.0.0-sprint-2` (`c0faf24`; run 45666007554 และ deploy run 45668146212) |
| FR-13 | F-08 | 3 | V3-01: owner check-in ACTIVE ในช่วงกิจกรรม; reject invalid/duplicate/cross-owner | TEST-53–58, TEST-65–66 ตาม S3 STS | TEST-55 / AC-43 local PASS 3/3 ([RED/GREEN](sprints/sprint-3/evidence/f08-check-in-green/README.md)); TEST-54 PASS 9/9 ([boundaries](sprints/sprint-3/evidence/f08-boundaries/README.md)); TEST-56/57 PASS 25 API + 5 unit ([access](sprints/sprint-3/evidence/f08-access/README.md)); TEST-58 PASS 20 races + clock-after-lock ([concurrency](sprints/sprint-3/evidence/f08-concurrency/README.md)); TEST-66 actual process restart PASS ([persistence](sprints/sprint-3/evidence/f08-restart/README.md)). UI ยังไม่ครบ F-08 |
| FR-14 | F-08 | 3 | V3-02: own attendance status ผ่านหน้า F-04 | TEST-53, TEST-57, TEST-59, TEST-66 ตาม S3 STS | [Own attendance API RED/GREEN](sprints/sprint-3/evidence/f08-own-green/README.md): TEST-53 + MyRegistrationS3 local PASS 3/3; own list/detail คืนเวลาเดียวกับ roster หรือ null และไม่เปิดเผย actor. [TEST-57](sprints/sprint-3/evidence/f08-access/README.md) ยืนยัน foreign own detail/roster ถูกปฏิเสธ; [TEST-66](sprints/sprint-3/evidence/f08-restart/README.md) อ่านค่าตรงเดิมหลัง actual compiled server restart และ fresh logins. TEST-59 UI ยังไม่ครบ |
| FR-15 | F-09 | 3 | V3-03: totals ของสถานะปัจจุบัน/rate ตรง DB รวม reactivate และ 0 denominator; owner scope | กำหนด detailed STS ก่อน F-09 coding | — |

## 2. Business rules

| Requirement | Feature | Sprint | AC / verification | Planned tests | Actual result/version |
|---|---|---|---|---|---|
| BR-01 | F-02,F-07 | 1/2 | AC-07: strict types/trim/code-point lengths; V2-03 | TEST-08; TEST-48 (S2 edit) | F-02 create validation PASS; F-07 TEST-48 edit validation (trim/code-point/type/unknown field) PASS ใน CI PR #57/#60; **26 พ.ย.:** TEST-37–52 ที่เกี่ยวข้อง PASS ใน CI ของ release `v2.0.0-sprint-2` (`c0faf24`; run 45666007554 และ deploy run 45668146212) |
| BR-02 | F-02,F-07 | 1/2 | AC-07–08; V2-03 | TEST-08–10; TEST-48 (S2 edit) | F-02 ordering/past DRAFT/publish boundary PASS; F-07 TEST-48 DRAFT ค่ารวมผิดลำดับ = 400 PASS ใน CI PR #57/#60; **26 พ.ย.:** TEST-37–52 ที่เกี่ยวข้อง PASS ใน CI ของ release `v2.0.0-sprint-2` (`c0faf24`; run 45666007554 และ deploy run 45668146212) |
| BR-03 | F-03,F-06 | 1/2 | AC-15; V2-01,02,04 | TEST-18 และ S2 lifecycle cases | F-03 PASS; F-06 TEST-40/42 deadline/precedence/post-lock clock local PASS; F-07 outside this result; **26 พ.ย.:** TEST-37–52 ที่เกี่ยวข้อง PASS ใน CI ของ release `v2.0.0-sprint-2` (`c0faf24`; run 45666007554 และ deploy run 45668146212) |
| BR-04 | F-03,F-06 | 1/2 | AC-13,17; V2-04: lifecycle fields/history | TEST-16,21 และ S2 reactivation cases | F-03 PASS; F-06 TEST-38/42 reference/history/duplicate races local PASS; **26 พ.ย.:** TEST-37–52 ที่เกี่ยวข้อง PASS ใน CI ของ release `v2.0.0-sprint-2` (`c0faf24`; run 45666007554 และ deploy run 45668146212) |
| BR-05 | F-03,F-06,F-07 | 1/2 | AC-14,17; V2-01,03,04 | TEST-17,20 และ S2 concurrent mutations | F-03 PASS; F-06 TEST-37/42 local PASS; F-07 capacity integration TEST-44(c) local PASS ([cross-feature evidence](sprints/sprint-2/evidence/f07-cross-feature/README.md)); **26 พ.ย.:** TEST-37–52 ที่เกี่ยวข้อง PASS ใน CI ของ release `v2.0.0-sprint-2` (`c0faf24`; run 45666007554 และ deploy run 45668146212) |
| BR-06 | F-01,F-03,F-04,F-06,F-08 | 1/2/3 | AC-16,19; V2-01,04; V3-02 | TEST-19,23; regression เมื่อเพิ่ม endpoints | S1 PASS: current session/role + session-owned creation and own-read scope; registration-views.test.ts TEST-23, focused browser foreign-reference denial; 3313288. F-06 TEST-41 access matrix local PASS; S3 pending; **26 พ.ย.:** TEST-37–52 ที่เกี่ยวข้อง PASS ใน CI ของ release `v2.0.0-sprint-2` (`c0faf24`; run 45666007554 และ deploy run 45668146212) |
| BR-07 | F-01,F-02,F-03,F-05–09 | 1/2/3 | AC-10,16,22; V2-02,03; V3-01,03 | TEST-12,13,19,27 และ future owner tests | S1 PASS: event/roster owner scope and role matrix; registration-views.test.ts TEST-27 (foreign Organizer404/Participant403/anonymous401). 3313288; F-06 close TEST-41 owner scope local PASS; F-07 TEST-51 edit owner scope (Organizer อื่น 404/Participant 403/anonymous 401) PASS ใน CI PR #57/#60; S3 pending; **26 พ.ย.:** TEST-37–52 ที่เกี่ยวข้อง PASS ใน CI ของ release `v2.0.0-sprint-2` (`c0faf24`; run 45666007554 และ deploy run 45668146212) |
| BR-08 | F-06 | 2 | AC-28,31: deadline equality/closed/already cancelled | TEST-37,40,42 | API/DB boundaries/precedence/post-lock clock PASS; [F-06 evidence](sprints/sprint-2/README.md); **26 พ.ย.:** TEST-37–52 ที่เกี่ยวข้อง PASS ใน CI ของ release `v2.0.0-sprint-2` (`c0faf24`; run 45666007554 และ deploy run 45668146212) |
| BR-09 | F-02,F-06 | 1/2 | AC-08; V2-02: close ซ้ำ/เปิดกลับไม่ได้ | TEST-09,10 และ S2 close tests | F-02 PASS; F-06 TEST-39/40 close/transitions local PASS; **26 พ.ย.:** TEST-37–52 ที่เกี่ยวข้อง PASS ใน CI ของ release `v2.0.0-sprint-2` (`c0faf24`; run 45666007554 และ deploy run 45668146212) |
| BR-10 | F-03,F-06,F-07 | 1/2 | AC-17; V2-01–04: interleaved transactions | TEST-20,21 และ S2 capacity/cancel/close races | F-03 PASS; F-06 TEST-42 real PostgreSQL observed-lock races local PASS; F-07 TEST-50 capacity ลด × ลงทะเบียนที่นั่งสุดท้าย 20 รอบ (separate connections) PASS ใน CI PR #57/#60; **26 พ.ย.:** TEST-37–52 ที่เกี่ยวข้อง PASS ใน CI ของ release `v2.0.0-sprint-2` (`c0faf24`; run 45666007554 และ deploy run 45668146212) |
| BR-11 | F-02,F-06,F-07 | 1/2 | AC-10; V2-03: immutable owner/published times | TEST-13 และ S2 edit restrictions | F-02 session owner/spoof rejection PASS; F-07 TEST-46/47 (PUBLISHED เวลาแก้ไม่ได้ 409 FIELD_NOT_EDITABLE, CLOSED 409 EVENT_NOT_EDITABLE) และ TEST-48 system field 400 PASS ใน CI PR #57/#60; **26 พ.ย.:** TEST-37–52 ที่เกี่ยวข้อง PASS ใน CI ของ release `v2.0.0-sprint-2` (`c0faf24`; run 45666007554 และ deploy run 45668146212) |
| BR-12 | F-08 | 3 | V3-01: time bounds, ACTIVE-only, CLOSED และ duplicate=409 ALREADY_CHECKED_IN โดยข้อมูลเดิมไม่เปลี่ยน | TEST-54, TEST-55, TEST-58 | Local PASS: [boundaries/CLOSED/edited schedule](sprints/sprint-3/evidence/f08-boundaries/README.md), [CANCELLED/duplicate](sprints/sprint-3/evidence/f08-check-in-green/README.md), [concurrent duplicate/clock-after-lock](sprints/sprint-3/evidence/f08-concurrency/README.md); ยังไม่ใช่ release acceptance |
| BR-13 | F-09 | 3 | V3-03: current-status counts หลัง reactivate, cancelled exclusion, zero count และ rounding; history ไม่ใช่ตัวนับ summary | กำหนดใน S3 STS | — |
| BR-14 | SYS-DATA,F-02,F-03,F-06,F-07,F-08 | 1/2/3 | AC-07,11,15; V2-01,03; V3-01: UTC millisecond, input precision และ clock หลัง event lock | TEST-08,18,36 และ future time-boundary tests | F-02 minute/second ISO offsets/precision/UTC/Bangkok + F-02/F-03 clock-after-lock/deadline equality PASS; F-06 TEST-40/42 clock/UTC boundaries local PASS; F-07 TEST-45/48 UTC `.SSSZ` readback และเศษวินาทีเกิน 3 หลัก = 400 PASS ใน CI PR #57/#60; S3 outside this result; **26 พ.ย.:** TEST-37–52 ที่เกี่ยวข้อง PASS ใน CI ของ release `v2.0.0-sprint-2` (`c0faf24`; run 45666007554 และ deploy run 45668146212) |

## 3. Non-functional requirements

| Requirement | Responsibility | Establish / verify | AC / target | Planned verification | Actual measurement/result/version |
|---|---|---|---|---|---|
| NFR-01 | SYS-AUTH,F-01–09 | S1 และทุก Sprint | AC-03,10,16,19,22 | TEST-03,06,12,13,19,23,27 และ future endpoint matrix | S1 API/DB PASS includes F-04/F-05 TEST-23/27 privacy/role/ownership; focused browser foreign-reference/wrong-role PASS. 3313288; future endpoint/deployment checks pending |
| NFR-02 | SYS-AUTH,F-01 | S1; HTTPS config Lab 5 | AC-01,03–05 | TEST-01,03–06; deployment cookie check | F-01 API/DB/unit + browser 7 cases PASS รวม cookie config/rotation/expiry/logout/UI response ordering; deployed HTTPS NOT EXECUTED |
| NFR-03 | SYS-DATA,F-02–05,F-08 | S1; redeploy Lab 5; S2–3 | AC-06,12,18,23,25,41,45 | TEST-07,15,22,29,31,43,66; Lab 5 persistence | recreate createApp คง Event/session/Registration reference และ counts; Lab 5 #20 event/registration คงเดิมหลัง Cloud Run restart/redeploy (`scccd8b05-00005-5xj` → `scccd8b05-00006-68j`) ([Lab 5](labs/lab-05/evidence/issue20-persistence-20261122/README.md)); TEST-43 S2 process restart; TEST-66 F-08 local PASS: actual compiled server สอง PID, checked_in_at/actor/roster/own reads คงเดิมหลัง fresh logins ([evidence](sprints/sprint-3/evidence/f08-restart/README.md)). TEST-59 UI และ release Sprint 3 verification ยัง planned |
| NFR-04 | SYS-DATA,F-03,F-08 | S1; regression S2; S3 | AC-17, AC-46 concurrency portion | TEST-20,21; S2 race expansion; TEST-58 | registration.test.ts last-seat/duplicate races PASS บน real PostgreSQL separate connections + observed lock barrier ([S1 evidence](events/consistency-review.md)); F-08 TEST-58 local PASS 20 rounds, two runtimes/two clocks, A/B win 10 each, winner timestamp preserved; clock-after-lock rejection PASS ([S3 evidence](sprints/sprint-3/evidence/f08-concurrency/README.md)) |
| NFR-05 | SYS-DELIVERY | S1; Docker Lab 5 | AC-25 | TEST-35; fresh Docker build ใน Lab 5 | PARTIAL: F-01 clean npm dependency install/generate/build/test ตรวจโดย Codex; fresh machine/DB และ teammate TEST-35 ยัง pending |
| NFR-06 | SYS-UX,ทุก feature | S1 และต่อเนื่อง | AC-11,20,26 | TEST-14,25,32,33,36 | F-01–05 automated UI/error/retry/private-data lifecycle coverage PASS, including RegistrationViews.test.tsx and focused registration-views.spec.ts; manual/independent browser-device matrix remains pending; [current evidence](registration/views-verification.md) |
| NFR-07 | SYS-DELIVERY | Lab 5; ทุก release หลังจากนั้น | CI gate / deployed version target | Controlled failed check + protected release path + version check | — |
| NFR-08 | SYS-QA | S1; D2; Final | AC-27 | TEST-34; baseline-to-final verification audit | PARTIAL: recorded source/results aligned; PR #7/#10 teammate approvals and staging merges evidenced in [snapshot reconciliation](deliverable-1/evidence/review-merge-20261112/README.md); final board/main release and full process acceptance pending |
| NFR-09 | SYS-QA | Lab 6; Final re-tests | Independent UAT target | 4 UAT cases, accepted defect fix และ partner re-test | **25 พ.ย. 2026:** ทีม TH-005_P5 ทดสอบ 7 เคส (ครบ 4 หมวด) บน `v1.0.1-uat`/`0b2cc80` ผ่าน 7/7 ไม่มี finding ผลตัดสิน Accepted ([ผลของทีมคู่](https://github.com/AlphabetCG/approvalflow/pull/38)); ไม่มี accepted defect ให้ re-test → รอ controlled defect exercise จาก TA (Lab 6) |

## 4. Sprint 1 AC → planned/actual verification

| AC | Feature | Planned tests | Implementation | Actual test file/name | Result / commit |
|---|---|---|---|---|---|
| AC-01 | F-01 | TEST-01 | IMPLEMENTED / Auth base merged | server/tests/integration/auth.test.ts: TEST-01/03 rotates session (PA/OA) | API/DB PASS; [working-tree source/results](deliverable-1/evidence/auth/README.md) |
| AC-02 | F-01 | TEST-02 | IMPLEMENTED / Auth base + consistency fix | auth.test.ts invalid bodies/malformed JSON, generic errors รวม NUL username, trim/exact password | API/DB PASS; [current RED→GREEN](events/consistency-review.md) |
| AC-03 | F-01 | TEST-03,06 | IMPLEMENTED / Auth base + Event host | auth.test.ts identity/isolation/cookie/app recreation/expiry/disabled; auth.spec.ts races/page restore; events-audit.spec.ts mounted-session401/next-account guard | API/DB/browser PASS; [current evidence](events/consistency-review.md) |
| AC-04 | F-01 | TEST-04 | IMPLEMENTED / Auth base merged | auth.test.ts: TEST-04 session destruction / clear cookie (PA/OA), EmptyInput | API/DB PASS; working tree ตาม auth evidence |
| AC-05 | F-01 | TEST-05 | IMPLEMENTED / Auth base merged | auth.test.ts: TEST-05 CSRF/origin/rotation/non-sliding/Secure; unit/password.test.ts, config.test.ts | API/DB/unit PASS; deployment cookie check ยังไม่รัน |
| AC-06 | F-02 | TEST-07 | IMPLEMENTED / STAGED (feature review evidenced) | events.test.ts create/readback; events.spec.ts create/preview/reload | API/DB/browser PASS; [working-tree evidence](events/verification.md) |
| AC-07 | F-02 | TEST-08 | IMPLEMENTED / STAGED (feature review evidenced) | events.test.ts strict schema/Unicode lengths + escaped JSON max lengths/capacity/time; model.test.ts | API/DB/unit PASS; [current evidence](events/consistency-review.md) |
| AC-08 | F-02 | TEST-09,10 | IMPLEMENTED / STAGED (feature review evidenced) | events.test.ts publish/status/deadline/lock wait/concurrent publish | API/DB/browser PASS; [evidence](events/verification.md) |
| AC-09 | F-02 | TEST-11 | IMPLEMENTED / STAGED (feature review evidenced) | events.test.ts fields/visibility/sorting ties/ACTIVE/snapshot race; overview.spec.ts real owner-list counts/recent order/isolation | API/DB/browser PASS; [evidence](events/verification.md) |
| AC-10 | F-02 | TEST-12,13 | IMPLEMENTED / STAGED (feature review evidenced) | events.test.ts auth/role/CSRF/input/scope matrix | API/DB PASS; [evidence](events/verification.md) |
| AC-11 | F-02 | TEST-14,36 | IMPLEMENTED / STAGED (feature review evidenced) | events/events-audit/consistency/visual-consistency.spec.ts UI states, typography/layout, session races; model/API time tests | Current source3313288:159 Vitest/37 Chromium + typecheck/build/smoke PASS; [current evidence](registration/views-verification.md); independent UAT NOT EXECUTED |
| AC-12 | F-03 | TEST-15 | IMPLEMENTED / STAGED | registration.test.ts + events.test.ts composition + events-registration.spec.ts | PASS session-owned ACTIVE/reference readback/recreation + real UI success; own-list automated journey PASS at3313288; independent acceptance pending |
| AC-13 | F-03 | TEST-16 | IMPLEMENTED / STAGED | registration.test.ts — rejects duplicate at capacity 1/2 | PASS / PR #7 merge commit `ada659b` |
| AC-14 | F-03 | TEST-17 | IMPLEMENTED / STAGED | registration.test.ts — rejects full without loser insert | PASS / PR #7 merge commit `ada659b` |
| AC-15 | F-03 | TEST-18 | IMPLEMENTED / STAGED | registration.test.ts — scope/deadline boundaries/lock-wait clock | PASS / PR #7 merge commit `ada659b` |
| AC-16 | F-03 | TEST-19 | IMPLEMENTED / STAGED | registration.test.ts — real session/role/CSRF/Origin/spoofing/expiry | PASS / PR #7 merge commit `ada659b` |
| AC-17 | F-03 | TEST-20,21 | IMPLEMENTED / STAGED | registration.test.ts — PostgreSQL last-seat/duplicate races | PASS / PR #7 merge commit `ada659b` |
| AC-18 | F-04 | TEST-22,24 | IMPLEMENTED / STAGED | registration-views.test.ts own schemas/order/re-login/recreation; registration-views.spec.ts | API/DB/E2E PASS; PR #10 merge commit `97a5b91` |
| AC-19 | F-04 | TEST-23 | IMPLEMENTED / STAGED | registration-views.test.ts cross-user/auth/role/UUID matrix | API/DB PASS; PR #10 merge commit `97a5b91` |
| AC-20 | F-04 | TEST-25 | IMPLEMENTED / STAGED | RegistrationViews.test.tsx empty/error/retry/account-change/late reads | UI tests PASS; PR #10 merge commit `97a5b91` |
| AC-21 | F-05 | TEST-26,28 | IMPLEMENTED / STAGED | registration-views.test.ts minimal sorted roster/ACTIVE count/empty DRAFT; RegistrationViews.test.tsx | API/DB/UI tests PASS; PR #10 merge commit `97a5b91` |
| AC-22 | F-05 | TEST-27 | IMPLEMENTED / STAGED | registration-views.test.ts foreign owner/role/anonymous/errors | API/DB PASS; PR #10 merge commit `97a5b91` |
| AC-23 | F-05 | TEST-29 | IMPLEMENTED / STAGED | registration-views.test.ts fresh registration/count DB equality; RegistrationViews.test.tsx refresh | API/DB/UI tests PASS; PR #10 merge commit `97a5b91` |
| AC-24 | Cross-feature | TEST-30 | IMPLEMENTED / STAGED | registration-views.spec.ts real publish/register/own read/re-login/roster journey | Focused & full Playwright E2E 37/37 PASS; PR #10 merge commit `97a5b91` |
| AC-25 | Cross-feature | TEST-31,35 | PARTIAL | events.test.ts recreate createApp อ่าน session/Event/Registration reference/count เดิม; Lab 5 #20 restart/redeploy บน Cloud Run ([หลักฐาน](labs/lab-05/evidence/issue20-persistence-20261122/README.md)) | Automated subset PASS; Cloud Run restart/redeploy คง record เดิม PASS 22 พ.ย. 2026 (release `f8fa8c9`, หลักฐาน manual ไม่ใช่การรัน TEST-31 ครบ); clean reproduction TEST-35 NOT EXECUTED |
| AC-26 | Cross-feature | TEST-32,33 | PARTIAL / F-01–05 automated subset | auth/events/registration/registration-views integration + registration-router/RegistrationViews tests + browser error/retry/full conflict/foreign reference/wrong-role access | F-01–05 API/DB access/error schemas and UI wrong-role/foreign/retry checks PASS; no claim of exhaustive manual/full matrix; 3313288 |
| AC-27 | SYS-QA | TEST-34 | PARTIAL / process acceptance pending | baseline review + auth TDD/pre-PR records + PR #7/#10 review/merge snapshots | Substantive teammate approvals/staging merges evidenced; final board, independent acceptance and reviewed main release pending |

## 5. Sprint 2 F-06 AC/NFR → executed verification — 24 พฤศจิกายน 2026

รายละเอียด source/ไฟล์/ผลแต่ละรอบอยู่ใน [completion](sprints/sprint-2/README.md); SHAs เป็นข้อมูลจากผู้ใช้ และ accepted release ยัง pending ทุกแถว → **26 พ.ย.:** release แล้วทุกแถวเป็น `v2.0.0-sprint-2` (`c0faf24`) (CI 264/264 + 39/39)

| AC | Tests | Implemented / executed result | Accepted release |
|---|---|---|---|
| AC-28 | TEST-37,40,43 | cancel/คืนที่นั่ง/own timestamps: API/DB/UI/Chromium local PASS | `v2.0.0-sprint-2` (`c0faf24`) |
| AC-29 | TEST-38,40,42,43 | reactivate reference/first time เดิม, history และ last-seat/duplicate races local PASS | `v2.0.0-sprint-2` (`c0faf24`) |
| AC-30 | TEST-39,40,43 | close ก่อน/ที่/หลัง deadline, preserve registrations/history, CLOSED UI local PASS | `v2.0.0-sprint-2` (`c0faf24`) |
| AC-31 | TEST-40,42 | precedence/input/boundaries และ clock หลัง lock local PASS | `v2.0.0-sprint-2` (`c0faf24`) |
| AC-32 | TEST-41,43 | access/CSRF/Origin/error envelope; confirmation/busy/retry/409/401/stale responses local PASS | `v2.0.0-sprint-2` (`c0faf24`) |
| AC-33 | TEST-42,44 | races/migration/fresh seed/atomic rollback และ TEST-44(c) cancel×capacity edit local PASS ([cross-feature evidence](sprints/sprint-2/evidence/f07-cross-feature/README.md)); review/CI pending → **25 พ.ย.:** PR #60 review แล้ว CI ผ่าน merge `128c35c` | `v2.0.0-sprint-2` (`c0faf24`) |

| NFR / linked tests | F-06 actual verification | Limits |
|---|---|---|
| NFR-01 → TEST-41 | lifecycle API + hardening access matrix; UI private data rejection | ไม่รับรอง F-07/S3 endpoints |
| NFR-03 → TEST-43 | Chromium reload/re-login และ actual compiled backend restart 2 รอบ/3 PIDs บน DB เดิม | ไม่แทน deployed restart/redeploy หรือ independent clean reproduction; Sprint 1 historical GAP-02 ไม่ปิดอัตโนมัติ |
| NFR-04 → TEST-42 | 160 real PostgreSQL lock races ใน 8 กลุ่ม ×20 รอบ | F-07 capacity race แยกเป็น TEST-50 (ดูตาราง F-07 ด้านล่าง) |
| NFR-05 → TEST-44(a) | actual S1→S2 migrations, fresh migrate→seed, repeat/concurrent seed history | local disposable DB ไม่ใช่ fresh-machine teammate acceptance |
| NFR-06 → TEST-41/43 | API error envelope และ UI error/uncertainty/retry/privacy local PASS | independent device/UAT matrix pending |

Latest source supplied before final reconciliation: `ba89488079a2c884735a18642dbd7487b6872559`; [final local logs](sprints/sprint-2/evidence/f06-final/README.md). ไม่อ้าง CI/review/merge/release ผ่าน และไม่เปลี่ยน F-07 design/results จากผล F-06

### Sprint 2 F-07 AC → executed verification — อัปเดต 25 พฤศจิกายน 2026

F-07 (#48) implement ใน PR #57 (head `9eb9afb`, merge `582a60d` เข้า sprint-2-staging, review โดย jetanin, CI `test-and-docker` SUCCESS [run 45347142610](https://github.com/jetanin/LoungCheu/actions/runs/45347142610)); TEST-47/52 เปลี่ยนเป็นปิดกิจกรรมผ่าน F-06 จริงใน PR #60 (head `2e6ddc2`, merge `128c35c`, review โดย jetanin, CI SUCCESS [run 45380720656](https://github.com/jetanin/LoungCheu/actions/runs/45380720656): Vitest 264/264, Playwright 39/39). รายละเอียดอยู่ใน [F-07 completion](sprints/sprint-2/README.md#f-07-completion-record)

| AC | Tests | Implemented / executed result | Accepted release |
|---|---|---|---|
| AC-34 | TEST-45 | DRAFT แก้ได้ทุก field, อ่านกลับตรง, owner/status/created_at คงเดิม; CI PASS | `v2.0.0-sprint-2` (`c0faf24`) |
| AC-35 | TEST-46 | PUBLISHED แก้ title/description/location/capacity ได้; field เวลา 409 FIELD_NOT_EDITABLE ข้อมูลไม่เปลี่ยน; CI PASS | `v2.0.0-sprint-2` (`c0faf24`) |
| AC-36 | TEST-47 | CLOSED (ปิดผ่าน F-06 จริง) 409 EVENT_NOT_EDITABLE ข้อมูลไม่เปลี่ยน; CI PASS | `v2.0.0-sprint-2` (`c0faf24`) |
| AC-37 | TEST-48 | EventPatch ผิดรูปแบบ/system/unknown field และ DRAFT ผิดลำดับเวลา = 400 ข้อมูลไม่เปลี่ยน (unit + API/DB); CI PASS | `v2.0.0-sprint-2` (`c0faf24`) |
| AC-38 | TEST-49 | capacity = ACTIVE ได้, ACTIVE−1 = 409 CAPACITY_BELOW_ACTIVE, เพิ่ม capacity แล้วลงทะเบียนต่อได้; CI PASS | `v2.0.0-sprint-2` (`c0faf24`) |
| AC-39 | TEST-50 | ลด capacity × ลงทะเบียนที่นั่งสุดท้าย 20 รอบ คนละ connection: ACTIVE ≤ capacity เสมอ; CI PASS | `v2.0.0-sprint-2` (`c0faf24`) |
| AC-40 | TEST-51, TEST-52 | API access 401/403/404/CSRF 403; UI ฟอร์มเติมค่าเดิม/เวลา disabled เมื่อ PUBLISHED/ไม่มีปุ่มเมื่อ CLOSED/error ภาษาไทย/reload เห็นค่าใหม่ (component + Chromium); CI PASS | `v2.0.0-sprint-2` (`c0faf24`) |

| NFR / linked tests | F-07 actual verification | Limits |
|---|---|---|
| NFR-04 → TEST-50 | ลด capacity × ลงทะเบียน 20 รอบบน PostgreSQL จริง, ยืนยันว่ารอ lock จริงผ่าน `pg_stat_activity` | ยังไม่ได้ทดสอบบน deployed environment |
| NFR-01 → TEST-51 | edit endpoint access matrix + CSRF | ครอบคลุมเฉพาะ PATCH edit |

### Sprint 3 F-08 storage/seed verification — 27 พฤศจิกายน 2026

งานย่อยของ #50 บน `feature/50-f08-migration`: RED commit ที่ Jetanin Naitho ระบุ `ba4cb6e0ff369e5a573fe97240214832f24b534d` → GREEN working changes สำหรับ migration `202611270001_registration_attendance` และ demo seed ยังรอ commit/CI/review/merge ไม่ใช่ผล AC-41–46 ครบ และยังไม่เพิ่ม check-in API/UI

| Requirement / design | Executed verification | Result / scope |
|---|---|---|
| NFR-05, F-08 DoD 4 → TEST-65(a) | S2→S3 ผ่าน real Prisma migration CLI บน DB แยก; ACTIVE/CANCELLED/history/refs/timestamps เดิมคงอยู่, attendance เริ่ม null, migrate ซ้ำ | Local PASS; ไม่ใช่ teammate fresh-machine reproduction |
| NFR-05 → TEST-65(b) | Actual seed entry point, attendance demo ACTIVE 2/checked-in 1, REGISTERED history ครบ, repeated/concurrent seed คงข้อมูลเช็กชื่อที่แก้ | Local PASS |
| F-08 data constraints → TEST-65(c) | CHECK pair/ACTIVE-only และ FK ทดสอบ INSERT/UPDATE; valid/null pair และ millisecond precision; referenced checker ลบไม่ได้ | Local PASS |
| FR-13–14 / AC-41–46 | ขั้นนี้เพิ่ม storage เท่านั้น | Check-in service/API, own/roster serializers, UI และ TEST-66 เป็นงานถัดไป; ไม่อ้าง accepted release |

[TEST-65 GREEN และ regression evidence](sprints/sprint-3/evidence/f08-migration-green/README.md): focused 8/8, Vitest 273/273, typecheck/build และ compiled smoke ผ่าน บน Docker test instance พอร์ต 55433; source TEST-65 เดิมไม่เปลี่ยนระหว่าง RED/GREEN

## 6. Coverage gaps และการอัปเดต

24 พ.ย. 2026 staging integration: ผู้ใช้เริ่ม merge origin/sprint-2-staging เข้า feature/47-f06 และรวม F-07 implementation แล้วใน working tree; ดู [ผลรัน F-06/F-07 หลังแก้ conflict](sprints/sprint-2/evidence/f06-staging-merge/README.md). ผลนี้แยกจาก F-06-only/เก่า และไม่ปิด TEST-44(c), independent acceptance หรือ release gates อัตโนมัติ; ผู้ใช้ยังต้อง commit merge และทำ PR workflow

FR/BR/NFR allocation คง baseline เดิม; automated results159/37/typecheck/build/smoke3 อ้าง recorded source3313288 ตาม [verification](registration/views-verification.md). PR #7/#10 approved/merged staging แล้วตาม snapshot12พ.ย. ผลนี้ไม่ใช่ release-linked rerun. OS-process restart, independent clean reproduction/UAT, final board และ reviewed main release acceptance ยัง pending; GAP-02 OPEN และ Product DoD ยังไม่ครบ
