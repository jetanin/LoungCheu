# Part B — Requirements, Features และ Verification Traceability

Documentation baseline v0.5 | 5 พฤศจิกายน 2026

**สถานะ: F-01 มี implementation/test evidence บน feature/auth; รอ review/integration/release** `—` = ยังไม่มี actual evidence; V2/V3 เป็น verification targets สำหรับ elaboration ก่อน implementation ส่วน Sprint 1 ใช้ AC/TEST ตาม contracts/STS ผล F-01 ดู [auth evidence](deliverable-1/evidence/auth/README.md); tested source เป็น working tree พร้อม SHA256 ไม่ใช่ parent commit

## 1. Functional requirements

| Requirement | Feature / responsibility | Sprint | AC หรือ verification target | Planned tests | Actual file/test/result/commit |
|---|---|---:|---|---|---|
| FR-01 | F-01 | 1 | AC-01–02,05 | TEST-01,02,05 | server/tests/integration/auth.test.ts + server/tests/unit/password.test.ts; API/unit PASS; [latest pre-PR results](sprints/sprint-1/auth-pre-pr-review.md) |
| FR-02 | F-01 | 1 | AC-03–04 | TEST-03,04,06 | server/tests/integration/auth.test.ts; API/DB PASS รวม fixed expiry/disabled/logout; [source/result](deliverable-1/evidence/auth/README.md) |
| FR-03 | F-02 | 1 | AC-06–07,10–11 | TEST-07,08,12–14,36 | — |
| FR-04 | F-02 | 1 | AC-08,10 | TEST-09,10,12,13 | — |
| FR-05 | F-02 | 1 | AC-09,11 | TEST-11,14,36 | — |
| FR-06 | F-03 | 1 | AC-12–17 | TEST-15–21 | — |
| FR-07 | F-04 | 1 | AC-18–20 | TEST-22–25 | — |
| FR-08 | F-02,F-05 | 1 | AC-09,21–23 | TEST-11,26–29 | — |
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
| BR-01 | F-02,F-07 | 1/2 | AC-07: strict types/trim/code-point lengths; V2-03 | TEST-08; เพิ่ม tests editing ใน S2 | — |
| BR-02 | F-02,F-07 | 1/2 | AC-07–08; V2-03 | TEST-08–10 | — |
| BR-03 | F-03,F-06 | 1/2 | AC-15; V2-01,02,04 | TEST-18 และ S2 lifecycle cases | — |
| BR-04 | F-03,F-06 | 1/2 | AC-13,17; V2-04: lifecycle fields/history | TEST-16,21 และ S2 reactivation cases | — |
| BR-05 | F-03,F-06,F-07 | 1/2 | AC-14,17; V2-01,03,04 | TEST-17,20 และ S2 concurrent mutations | — |
| BR-06 | F-01,F-03,F-04,F-06,F-08 | 1/2/3 | AC-16,19; V2-01,04; V3-02 | TEST-19,23; regression เมื่อเพิ่ม endpoints | PARTIAL: F-01 cross-session isolation/current-role middleware PASS; registration/ownership endpoints ยัง pending |
| BR-07 | F-01,F-02,F-03,F-05–09 | 1/2/3 | AC-10,16,22; V2-02,03; V3-01,03 | TEST-12,13,19,27 และ future owner tests | PARTIAL: F-01 middleware current-role PASS; event/roster ownership matrix ยัง pending |
| BR-08 | F-06 | 2 | V2-01: deadline equality/closed/already cancelled | กำหนดใน S2 STS | — |
| BR-09 | F-02,F-06 | 1/2 | AC-08; V2-02: close ซ้ำ/เปิดกลับไม่ได้ | TEST-09,10 และ S2 close tests | — |
| BR-10 | F-03,F-06,F-07 | 1/2 | AC-17; V2-01–04: interleaved transactions | TEST-20,21 และ S2 capacity/cancel/close races | — |
| BR-11 | F-02,F-06,F-07 | 1/2 | AC-10; V2-03: immutable owner/published times | TEST-13 และ S2 edit restrictions | — |
| BR-12 | F-08 | 3 | V3-01: time bounds, ACTIVE-only, CLOSED และ duplicate=409 ALREADY_CHECKED_IN โดยข้อมูลเดิมไม่เปลี่ยน | กำหนดใน S3 STS | — |
| BR-13 | F-09 | 3 | V3-03: current-status counts หลัง reactivate, cancelled exclusion, zero count และ rounding; history ไม่ใช่ตัวนับ summary | กำหนดใน S3 STS | — |
| BR-14 | SYS-DATA,F-02,F-03,F-06,F-07,F-08 | 1/2/3 | AC-07,11,15; V2-01,03; V3-01: UTC millisecond, input precision และ clock หลัง event lock | TEST-08,18,36 และ future time-boundary tests | — |

## 3. Non-functional requirements

| Requirement | Responsibility | Establish / verify | AC / target | Planned verification | Actual measurement/result/version |
|---|---|---|---|---|---|
| NFR-01 | SYS-AUTH,F-01–09 | S1 และทุก Sprint | AC-03,10,16,19,22 | TEST-03,06,12,13,19,23,27 และ future endpoint matrix | F-01 session/current-active/current-role PASS; resource/ownership matrix ยัง pending; [auth evidence](deliverable-1/evidence/auth/README.md) |
| NFR-02 | SYS-AUTH,F-01 | S1; HTTPS config Lab 5 | AC-01,03–05 | TEST-01,03–06; deployment cookie check | F-01 API/DB/unit + browser 7 cases PASS รวม cookie config/rotation/expiry/logout/UI response ordering; deployed HTTPS NOT EXECUTED |
| NFR-03 | SYS-DATA,F-02–05 | S1; redeploy Lab 5 | AC-06,12,18,23,25 | TEST-07,15,22,29,31; Lab 5 persistence | — |
| NFR-04 | SYS-DATA,F-03 | S1; regression S2 | AC-17 | TEST-20,21 และ S2 race expansion | — |
| NFR-05 | SYS-DELIVERY | S1; Docker Lab 5 | AC-25 | TEST-35; fresh Docker build ใน Lab 5 | PARTIAL: F-01 clean npm dependency install/generate/build/test ตรวจโดย Codex; fresh machine/DB และ teammate TEST-35 ยัง pending |
| NFR-06 | SYS-UX,ทุก feature | S1 และต่อเนื่อง | AC-11,20,26 | TEST-14,25,32,33,36 | PARTIAL: F-01 errors/loading/retry/stale-response UI PASS; cross-feature cases ยัง pending |
| NFR-07 | SYS-DELIVERY | Lab 5; ทุก release หลังจากนั้น | CI gate / deployed version target | Controlled failed check + protected release path + version check | — |
| NFR-08 | SYS-QA | S1; D2; Final | AC-27 | TEST-34; baseline-to-final verification audit | PARTIAL: baseline review/versioning และ auth TDD/source manifests มีแล้ว; feature/release review และ full process audit ยัง pending |
| NFR-09 | SYS-QA | Lab 6; Final re-tests | Independent UAT target | 4 UAT cases, accepted defect fix และ partner re-test | — |

## 4. Sprint 1 AC → planned/actual verification

| AC | Feature | Planned tests | Implementation | Actual test file/name | Result / commit |
|---|---|---|---|---|---|
| AC-01 | F-01 | TEST-01 | IMPLEMENTED / review pending | server/tests/integration/auth.test.ts: TEST-01/03 rotates session (PA/OA) | API/DB PASS; [working-tree source/results](deliverable-1/evidence/auth/README.md) |
| AC-02 | F-01 | TEST-02 | IMPLEMENTED / review pending | auth.test.ts: TEST-02 invalid bodies, malformed JSON, generic errors, trim/exact password | API/DB PASS; working tree ตาม auth evidence |
| AC-03 | F-01 | TEST-03,06 | IMPLEMENTED / review pending | auth.test.ts: TEST-01/03 Identity/isolation/tampered cookie/app recreation, TEST-06 expiry/disabled; auth.spec.ts stale-response/page restore | API/DB/browser PASS; expiry/UI race red→green ตาม auth evidence |
| AC-04 | F-01 | TEST-04 | IMPLEMENTED / review pending | auth.test.ts: TEST-04 session destruction / clear cookie (PA/OA), EmptyInput | API/DB PASS; working tree ตาม auth evidence |
| AC-05 | F-01 | TEST-05 | IMPLEMENTED / review pending | auth.test.ts: TEST-05 CSRF/origin/rotation/non-sliding/Secure; unit/password.test.ts, config.test.ts | API/DB/unit PASS; deployment cookie check ยังไม่รัน |
| AC-06 | F-02 | TEST-07 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-07 | F-02 | TEST-08 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-08 | F-02 | TEST-09,10 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-09 | F-02 | TEST-11 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-10 | F-02 | TEST-12,13 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-11 | F-02 | TEST-14,36 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-12 | F-03 | TEST-15 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-13 | F-03 | TEST-16 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-14 | F-03 | TEST-17 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-15 | F-03 | TEST-18 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-16 | F-03 | TEST-19 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-17 | F-03 | TEST-20,21 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-18 | F-04 | TEST-22,24 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-19 | F-04 | TEST-23 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-20 | F-04 | TEST-25 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-21 | F-05 | TEST-26,28 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-22 | F-05 | TEST-27 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-23 | F-05 | TEST-29 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-24 | Cross-feature | TEST-30 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-25 | Cross-feature | TEST-31,35 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-26 | Cross-feature | TEST-32,33 | PARTIAL / F-01 foundation | auth.test.ts errors/schema/unknown-API/generic dependency failure; auth.spec.ts errors/retry | F-01 subset PASS; resource UUID/conflict matrix และ TEST-33 ยัง NOT EXECUTED |
| AC-27 | SYS-QA | TEST-34 | PARTIAL / process pending | baseline review + auth TDD/pre-PR records | Baseline/history verified; feature/main release chains และ full TEST-34 ยัง pending |

## 5. Coverage gaps และการอัปเดต

FR/BR/NFR มี allocation ครบ; F-01 มี actual execution coverage แล้ว (54 unit/API, 7 browser, typecheck/build/compiled smoke ตาม [pre-PR review](sprints/sprint-1/auth-pre-pr-review.md)) ส่วน resource/domain/concurrency/integration/release ยัง pending ผลปัจจุบันระบุ working-tree SHA256/parent เพราะยังไม่ commit; เติม implementation commit ก่อน PR และเก็บ FAIL/SKIPPED/INCOMPLETE พร้อมเหตุผล Sprint 2/3 เพิ่ม contracts/AC/STS ก่อน implementation
