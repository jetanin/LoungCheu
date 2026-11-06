# Part B — Requirements, Features และ Verification Traceability

**UI consistency follow-up:** ล่าสุด 145 Vitest / 35 Chromium, typecheck/build/compiled smoke PASS รวม typography/layout/state checks ที่1280/390/320px ดู [current UI evidence](events/visual-consistency.md) ผล141/32 และ seed follow-up ด้านล่างเป็น historical runs

**Seed follow-up (6 พ.ย.):** full Vitest **145 PASS** รวม seed integration ใหม่4 และ typecheck PASS; 141/32 ใน feature audit ด้านล่างเป็นรอบก่อนเพิ่ม seed โดย Chromium/build ไม่ได้ rerun รอบ seed ดู [latest seed results](events/demo-seed.md) ไม่มี AC/scope ใหม่

Documentation baseline v0.5 | 5 พฤศจิกายน 2026

Implementation/results อ้าง merge working tree บน feature/events: HEAD 04106ff + sprint-1-staging@ada659b รวม Event Management (#2) กับ Registration (#3) แล้ว ยังไม่มี merge commit ดู [combined verification](events/consistency-review.md) และ source manifest; historical evidence แยกในเอกสารเดิม

**สถานะ: F-01/F-02/F-03 รวมและทดสอบบน feature/events แล้ว รอ teammate review/merge commit/release; F-04/F-05 ยังไม่รวม** ผล feature consistency 141 Vitest + 32 Chromium + typecheck/build/compiled smoke PASS; [combined verification](events/consistency-review.md) ระบุข้อจำกัด ไม่อ้าง Product DoD ทั้ง Sprint 1; `—` = ไม่มี actual evidence; V2/V3 ยังเป็น verification targets

## 1. Functional requirements

| Requirement | Feature / responsibility | Sprint | AC หรือ verification target | Planned tests | Actual file/test/result/commit |
|---|---|---:|---|---|---|
| FR-01 | F-01 | 1 | AC-01–02,05 | TEST-01,02,05 | server/tests/integration/auth.test.ts + server/tests/unit/password.test.ts; API/unit PASS; [latest pre-PR results](sprints/sprint-1/auth-pre-pr-review.md) |
| FR-02 | F-01 | 1 | AC-03–04 | TEST-03,04,06 | server/tests/integration/auth.test.ts; API/DB PASS รวม fixed expiry/disabled/logout; [source/result](deliverable-1/evidence/auth/README.md) |
| FR-03 | F-02 | 1 | AC-06–07,10–11 | TEST-07,08,12–14,36 | events.test.ts + events.spec.ts PASS; [F-02 evidence](events/verification.md) |
| FR-04 | F-02 | 1 | AC-08,10 | TEST-09,10,12,13 | events.test.ts publish/deadline/lock/permissions PASS; [evidence](events/verification.md) |
| FR-05 | F-02 | 1 | AC-09,11 | TEST-11,14,36 | events.test.ts shared fields/visibility/sort/counts/snapshot + events.spec.ts browse/time PASS; [evidence](events/verification.md) |
| FR-06 | F-03 | 1 | AC-12–17 | TEST-15–21 | registration.test.ts 17 PASS + events.test.ts combined DB readback + events-registration.spec.ts real journey PASS; [combined verification](events/consistency-review.md); own GET รอ Issue #4 |
| FR-07 | F-04 | 1 | AC-18–20 | TEST-22–25 | — |
| FR-08 | F-02,F-05 | 1 | AC-09,21–23 | TEST-11,26–29 | PARTIAL: F-02 own list/scoped detail + Organizer overview จาก own list PASS; F-05 roster TEST-26–29 NOT EXECUTED |
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
| BR-06 | F-01,F-03,F-04,F-06,F-08 | 1/2/3 | AC-16,19; V2-01,04; V3-02 | TEST-19,23; regression เมื่อเพิ่ม endpoints | PARTIAL: F-01 session/current role + F-03 session-owned registration/spoof rejection PASS; F-04 ownership/future endpoints pending |
| BR-07 | F-01,F-02,F-03,F-05–09 | 1/2/3 | AC-10,16,22; V2-02,03; V3-01,03 | TEST-12,13,19,27 และ future owner tests | PARTIAL: F-01 middleware + F-02 event role/ownership matrix PASS; roster/other features pending |
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
| NFR-01 | SYS-AUTH,F-01–09 | S1 และทุก Sprint | AC-03,10,16,19,22 | TEST-03,06,12,13,19,23,27 และ future endpoint matrix | F-01/F-02/F-03 real session/current user/role/CSRF + Event ownership PASS; F-04/F-05 pending; [combined verification](events/consistency-review.md) |
| NFR-02 | SYS-AUTH,F-01 | S1; HTTPS config Lab 5 | AC-01,03–05 | TEST-01,03–06; deployment cookie check | F-01 API/DB/unit + browser 7 cases PASS รวม cookie config/rotation/expiry/logout/UI response ordering; deployed HTTPS NOT EXECUTED |
| NFR-03 | SYS-DATA,F-02–05 | S1; redeploy Lab 5 | AC-06,12,18,23,25 | TEST-07,15,22,29,31; Lab 5 persistence | PARTIAL: recreate createApp คง Event/session/Registration reference และ counts ผ่าน DB เดิม; OS process restart/redeploy pending |
| NFR-04 | SYS-DATA,F-03 | S1; regression S2 | AC-17 | TEST-20,21 และ S2 race expansion | registration.test.ts last-seat/duplicate races PASS บน real PostgreSQL separate connections + observed lock barrier; [combined verification](events/consistency-review.md) |
| NFR-05 | SYS-DELIVERY | S1; Docker Lab 5 | AC-25 | TEST-35; fresh Docker build ใน Lab 5 | PARTIAL: F-01 clean npm dependency install/generate/build/test ตรวจโดย Codex; fresh machine/DB และ teammate TEST-35 ยัง pending |
| NFR-06 | SYS-UX,ทุก feature | S1 และต่อเนื่อง | AC-11,20,26 | TEST-14,25,32,33,36 | PARTIAL: F-01–03 UX/lifecycle/domain error subset + measured typography/layout at1280/390/320 PASS; F-04/F-05/full matrix pending; [current UI evidence](events/visual-consistency.md) |
| NFR-07 | SYS-DELIVERY | Lab 5; ทุก release หลังจากนั้น | CI gate / deployed version target | Controlled failed check + protected release path + version check | — |
| NFR-08 | SYS-QA | S1; D2; Final | AC-27 | TEST-34; baseline-to-final verification audit | PARTIAL: baseline review/versioning และ auth TDD/source manifests มีแล้ว; feature/release review และ full process audit ยัง pending |
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
| AC-11 | F-02 | TEST-14,36 | IMPLEMENTED / review pending | events/events-audit/consistency/visual-consistency.spec.ts UI states, typography/layout, session races; model/API time tests | 145 Vitest/35 Chromium + typecheck/build/smoke PASS; [current UI evidence](events/visual-consistency.md); independent UAT NOT EXECUTED |
| AC-12 | F-03 | TEST-15 | API/DB/browser implemented; own GET รอ #4 | registration.test.ts + events.test.ts composition + events-registration.spec.ts | PASS session-owned ACTIVE/reference readback/recreation + real UI success; full own-list acceptance pending |
| AC-13 | F-03 | TEST-16 | IMPLEMENTED | registration.test.ts — rejects duplicate at capacity 1/2 | PASS / combined regression PASS; merge commit pending |
| AC-14 | F-03 | TEST-17 | IMPLEMENTED | registration.test.ts — rejects full without loser insert | PASS / combined regression PASS; merge commit pending |
| AC-15 | F-03 | TEST-18 | IMPLEMENTED | registration.test.ts — scope/deadline boundaries/lock-wait clock | PASS / combined regression PASS; merge commit pending |
| AC-16 | F-03 | TEST-19 | IMPLEMENTED with staging auth | registration.test.ts — real session/role/CSRF/Origin/spoofing/expiry | PASS / combined regression PASS; merge commit pending |
| AC-17 | F-03 | TEST-20,21 | IMPLEMENTED | registration.test.ts — PostgreSQL last-seat/duplicate races | PASS / combined regression PASS; merge commit pending |
| AC-18 | F-04 | TEST-22,24 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-19 | F-04 | TEST-23 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-20 | F-04 | TEST-25 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-21 | F-05 | TEST-26,28 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-22 | F-05 | TEST-27 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-23 | F-05 | TEST-29 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-24 | Cross-feature | TEST-30 | PARTIAL / F-01–03 | events-registration.spec.ts create/publish/register/reference/count | PASS subset; own GET/list/roster ของ Issue #4 ยังไม่รวม จึงไม่อ้าง full TEST-30/AC-24 ผ่าน |
| AC-25 | Cross-feature | TEST-31,35 | PARTIAL / app recreation only | events.test.ts recreate createApp อ่าน session/Event/Registration reference/count เดิม | Automated subset PASS; manual process restart/clean reproduction/full TEST-31,35 NOT EXECUTED |
| AC-26 | Cross-feature | TEST-32,33 | PARTIAL / F-01–03 | auth/events/registration integration + registration-router tests + browser error/retry/full conflict | F-01–03 subset PASS; F-04/F-05/full matrix pending; [combined verification](events/consistency-review.md) |
| AC-27 | SYS-QA | TEST-34 | PARTIAL / process pending | baseline review + auth TDD/pre-PR records | Baseline/history verified; feature/main release chains และ full TEST-34 ยัง pending |

## 5. Coverage gaps และการอัปเดต

FR/BR/NFR มี allocation ครบ; F-01/F-02/F-03 actual execution รวม 141 Vitest, 32 Chromium, typecheck/build/compiled smoke PASS ตาม [combined verification](events/consistency-review.md) และ working-tree source manifest บน parents 04106ff + ada659b ยังรอ Issue #4 (F-04 own GET/list/detail, F-05 roster), process restart, independent UAT/reproduction, teammate review และ release ห้ามอ้าง full Sprint 1 acceptance หรือ parent SHA แทน tested working tree; คง historical failures/TDD ไว้ Sprint 2/3 เพิ่ม contracts/AC/STS ก่อน implementation
