# Sprint 3 — Software Test Specification (F-08, F-09)

เอกสาร LC-S3-STS | v0.3 (test design + local F-08 results) | 27 พฤศจิกายน 2026

Contract: [contracts.md](contracts.md) ทุก test ต้องเขียนและ commit ให้ **fail ก่อน** implementation (RED) แล้วจึง implement ให้ผ่าน (GREEN) เก็บ SHA ทั้งสองจังหวะ

สถานะ: **F-08 implemented และ tested (local)** ตาม [หลักฐานและ TDD trace](evidence/f08-ui-green/README.md); ยังไม่ใช่ผล CI/teammate acceptance/release. ผล F-09 ไม่อยู่ใน implementation #50 นี้

## 1. Environment และ fixtures

ใช้ environment, runner (Vitest + Supertest, React Testing Library, Playwright), PostgreSQL test database, controlled clock และบัญชี PA/PB/PC/OA/OB/IX ตาม [Sprint 1 STS §1](../sprint-1/sts.md) ไม่เปลี่ยน

เวลาอ้างอิง `t0 = 2026-11-06T03:00:00.000Z`; ทุก fixture มี closes=t0+1h, starts=t0+2h, ends=t0+4h เว้นแต่ระบุ

| Fixture | Owner | Status | Capacity | Registrations |
|---|---|---|---|---|
| ECHECK3 | OA | PUBLISHED | 5 | PA ACTIVE, PB ACTIVE, PC CANCELLED (cancelled_at=t0+30 min) |
| ECLOSED3 | OA | CLOSED | 5 | PA ACTIVE |
| EOTHER3 | OB | PUBLISHED | 5 | PA ACTIVE |
| ESUM3 | OA | PUBLISHED | 5 | PA ACTIVE เช็กชื่อแล้ว (ใส่ใน DB: checked_in_at=t0+2h10m, checked_in_by_id=OA), PB ACTIVE, PC CANCELLED |
| ELIFE3 | OA | PUBLISHED | 5 | PA ACTIVE, PB ACTIVE, PC CANCELLED; ใช้ clock=t0+10 min (ก่อน deadline) สำหรับ lifecycle |
| ERATE3 | OA | PUBLISHED | 32 | ACTIVE 32 คน (participant สังเคราะห์ที่สร้างใน fixture) เช็กชื่อ 1 คน |
| EDRAFT3 | OA | DRAFT | 5 | ไม่มี |

Registration ทุก record มี REGISTERED history ตาม F-06 CANCELLED มี CANCELLED history ด้วย

"ข้อมูลไม่เปลี่ยน" หมายถึงอ่านจาก connection ใหม่แล้ว Registration ทุก field (status, registered_at, cancelled_at, checked_in_at, checked_in_by_id), จำนวน history และ Event ทุก field รวม updated_at เท่าค่าก่อน request

## 2. F-08 test cases (TEST-53–TEST-59, TEST-65–TEST-66)

| Test ID / AC | ระดับ | Preconditions / input | Action | Expected result |
|---|---|---|---|---|
| TEST-53 / AC-41 | API/DB | OA, ECHECK3, clock=t0+2h30m | POST check-in ของ PA → GET roster → GET own detail ของ PA | 200 RosterEntryS3 checked_in_at=t0+2h30m; DB checked_in_by_id=OA; status/registered_at เดิม, Event.updated_at เดิม, history ไม่เพิ่ม; roster checked_in_count=1 และแถว PA มี checked_in_at; PA own detail เห็น checked_in_at เดียวกัน |
| TEST-54 / AC-42 | API/DB | ECHECK3 fixture ใหม่ทุก case; ECLOSED3 | check-in PA ที่ clock = (a) starts−1 ms (b) starts (c) ends (d) ends+1 ms (e) ECLOSED3 ที่ t0+3h (f) DRAFT ที่แก้เวลาด้วย F-07 แล้ว publish เช็กชื่อตามเวลาใหม่ | (a)(d) 409 CHECK_IN_NOT_OPEN ข้อมูลไม่เปลี่ยน (b)(c)(e) 200 (f) ใช้ starts/ends ใหม่ ไม่ใช่ค่าก่อนแก้ |
| TEST-55 / AC-43 | API/DB | ECHECK3; T1=t0+3h, T2=t0+3h5m (ยังอยู่ในช่วง starts–ends) | (a) check-in PC (CANCELLED) ที่ T1 (b) check-in PA ครั้งแรกที่ clock=T1 แล้วเลื่อน clock เป็น T2 ก่อนส่งครั้งที่สอง (c) check-in PC ที่ clock=ends+1 ms | (a) 409 REGISTRATION_NOT_ACTIVE (b) ครั้งแรก 200 checked_in_at=T1; ครั้งที่สอง 409 ALREADY_CHECKED_IN และ DB ยังเป็น checked_in_at=T1, checked_in_by_id=OA, Event.updated_at และ roster checked_in_count เดิม (ถ้าเขียนทับจะเห็น T2) (c) 409 CHECK_IN_NOT_OPEN (เวลาตรวจก่อนสถานะ); ทุก rejection ข้อมูลไม่เปลี่ยน |
| TEST-56 / AC-44 | Unit + API/DB | OA, ECHECK3, clock=t0+3h | eventId หรือ registrationId=`not-a-uuid`; body `null`, `[]`, `"x"`, `{"checked_in_at":"…"}`, `{"status":"ACTIVE"}`, เกิน 1 KiB, JSON ผิดรูป; ไม่มี body และ `{}` | input ผิดทั้งหมด 400 INVALID_INPUT ข้อมูลไม่เปลี่ยน; ไม่มี body และ `{}` ได้ 200 |
| TEST-57 / AC-44, AC-45 | API/DB | ECHECK3, EOTHER3; clock=t0+3h; body={} | check-in PA ของ ECHECK3 โดย anonymous, PA, PB, OB; OA ด้วย registrationId ของ EOTHER3; OA ด้วย eventId ไม่มีจริง; OA ไม่มี CSRF และ CSRF ผิด; GET own detail ของ PA โดย PB; GET roster โดย PA และ OB | 401 AUTH_REQUIRED; 403 ROLE_FORBIDDEN (PA เช็กชื่อตัวเองก็ 403); 403; 404 EVENT_NOT_FOUND; 404 REGISTRATION_NOT_FOUND; 404 EVENT_NOT_FOUND; 403 CSRF_FAILED ทั้งคู่; 404 REGISTRATION_NOT_FOUND; 403 และ 404; response ไม่เปิดเผยชื่อ/เวลาของผู้อื่น; ข้อมูลไม่เปลี่ยนทุกกรณี |
| TEST-58 / AC-46 | API/DB concurrency | ECHECK3 fixture ใหม่ทุกรอบ; separate connections + Event lock barrier; (a) runtime A ใช้ clock T1=t0+3h, runtime B ใช้ clock T2=t0+3h5m; (b) clock=t0+3h | (a) OA ส่ง check-in PA สองคำขอพร้อมกัน สลับลำดับได้ lock ทำ ≥20 รอบ (b) ถือ Event lock ไว้แล้วเลื่อน clock ไป ends+1 ms ก่อนปล่อยคำขอ check-in | (a) ทุกรอบ 200 หนึ่ง + 409 ALREADY_CHECKED_IN หนึ่ง; checked_in_at เท่ากับ clock ของ runtime ที่ได้ 200 (T1 หรือ T2) และไม่ถูกแทนด้วย clock ของฝั่งที่ได้ 409; ไม่มี deadlock/500 (b) 409 CHECK_IN_NOT_OPEN ข้อมูลไม่เปลี่ยน |
| TEST-59 / AC-45, AC-46 | Component + E2E (Chromium) | Component: mock API; E2E: server/DB จริงพร้อมกิจกรรมที่อยู่ในช่วงเช็กชื่อ OA/PA context แยก | OA เปิด roster → กดเช็กชื่อ → ยกเลิก dialog → กดใหม่แล้วยืนยัน → reload; PA เปิด own list และ own detail → logout/login → เปิดอีกครั้ง; component: busy, 409 แต่ละ code, 401, 403/404, network timeout, นอกช่วงเวลา, CANCELLED | ยกเลิก dialog ไม่ส่ง POST; ยืนยันแล้วแถวเป็น "เช็กชื่อแล้ว {เวลา}" ยอดเพิ่มและคงอยู่หลัง reload; PA เห็น "เช็กชื่อแล้วเมื่อ …" หลัง re-login; ระหว่างส่งปุ่ม disabled และส่งครั้งเดียว; 409 แสดงข้อความภาษาไทยตามตารางแล้วโหลด roster ใหม่; 401 ล้างข้อมูลไปหน้า login; 403/404 ล้าง roster; timeout ไม่ retry เอง; นอกช่วงเวลาและ CANCELLED ไม่มีปุ่ม |
| TEST-65 / NFR-05, DoD 4 | Migration integration (disposable DB แยก: Docker:55433 หรือ PostgreSQL service ของ CI แบบเดียวกับ TEST-44) | (a) DB ที่ migrate ถึง S2 (`202611240001`) มี ACTIVE/CANCELLED พร้อม history, cancelled_at, registered_at (b) DB ว่าง (c) DB หลัง S3 migration | (a) apply migration S3 (b) migrate → seed → seed ซ้ำ และ seed พร้อมกัน 2 process (c) INSERT/UPDATE ที่มีเฉพาะ checked_in_at หรือเฉพาะ checked_in_by_id; ตั้ง checked_in บน CANCELLED; checked_in_by_id ที่ไม่มี user | (a) ทุก field และจำนวน history เดิมไม่เปลี่ยน, สองคอลัมน์ใหม่เป็น null ทุก record (b) มีกิจกรรม `[DEMO]` เช็กชื่อตาม contract (ACTIVE 2 เช็กชื่อแล้ว 1); seed ซ้ำ/พร้อมกันไม่สร้างซ้ำและไม่ทับค่าเช็กชื่อ (c) ถูก CHECK หรือ FK ปฏิเสธทุกกรณี ข้อมูลเดิมไม่เปลี่ยน |
| TEST-66 / NFR-03, AC-41, AC-45 | Process restart integration (compiled backend จริงบน DB เดิม แบบเดียวกับ TEST-43) | ECHECK3, clock=t0+3h; OA และ PA login | OA check-in PA → หยุด backend process → เริ่ม process ใหม่ (PID ใหม่) บน DB เดิม → OA login ใหม่แล้ว GET roster; PA login ใหม่แล้ว GET own detail | checked_in_at และ checked_in_by_id ใน DB เท่าก่อนหยุด; roster checked_in_count=1 และแถว PA มี checked_in_at เดิม; PA own detail เห็น checked_in_at เดิม; PID ก่อน/หลังต่างกัน |

## 3. F-09 test cases (TEST-60–TEST-64)

| Test ID / AC | ระดับ | Preconditions / input | Action | Expected result |
|---|---|---|---|---|
| TEST-60 / AC-47 | API/DB | OA, ESUM3; ELIFE3 | (a) GET summary ของ ESUM3 (b) ELIFE3: PC reactivate → PB cancel → PB reactivate แล้ว GET summary หลังแต่ละขั้น | (a) active=2, cancelled=1, checked_in=1 (CANCELLED ไม่นับ), rate="50.00" ตรงกับ COUNT จาก DB (b) active/cancelled = 3/0 → 2/1 → 3/0; ไม่สะสมจำนวนครั้ง cancel แม้ history ของ PB มี CANCELLED |
| TEST-61 / AC-48 | Unit + API/DB | ฟังก์ชันคำนวณ rate และ ERATE3 | unit: (2,3), (1,3), (1,32), (3,3), (0,5), (0,0), (1,8); API: GET summary ของ ERATE3 | unit: "66.67", "33.33", "3.13", "100.00", "0.00", "0.00", "12.50"; API ERATE3 rate="3.13" (half-up ไม่ใช่ banker's rounding) และเป็น string 2 ตำแหน่ง |
| TEST-62 / AC-49 | API/DB | ECHECK3 clock=t0+3h; EDRAFT3 | GET summary → check-in PA → GET summary; GET summary ของ EDRAFT3 | checked_in 0→1, rate "0.00"→"50.00", generated_at = clock; EDRAFT3 status=DRAFT ทุกยอด 0 rate="0.00" |
| TEST-63 / AC-50 | API/DB | ESUM3, EOTHER3 | GET summary โดย anonymous, PA, OB (ของ OA), OA กับ eventId ไม่มีจริง, OA กับ `not-a-uuid` | 401; 403 ROLE_FORBIDDEN; 404 EVENT_NOT_FOUND; 404; 400 INVALID_INPUT; error ไม่มียอดหรือข้อมูลกิจกรรม |
| TEST-64 / AC-50 | Component + E2E (Chromium) | Component: mock API; E2E: OA กับกิจกรรมที่มี ACTIVE/CANCELLED/เช็กชื่อแล้ว | OA เปิดรายละเอียด → ดูสรุปผล → เช็กชื่ออีกคนในอีกแท็บ → รีเฟรชสรุป; component: loading, ACTIVE=0, error+retry, 401, 403/404 | แสดง 4 ยอดและ rate ตรง API; รีเฟรชแล้วยอดเปลี่ยน; loading ไม่แสดง 0 ก่อนได้ข้อมูล; ACTIVE=0 แสดง 0.00% พร้อมข้อความ; error มีปุ่มลองใหม่; 401 ไป login; 403/404 ล้างข้อมูล |

## 4. Regression

ทุก PR เข้า `sprint-3-staging` ต้องรัน automated tests เดิมทั้งหมดของ Sprint 1–2 ผ่าน CI `test-and-docker` และรายงาน passed/failed/skipped ตามจริงใน PR; tests ที่อ้าง RosterEntry/MyRegistration ปรับ expected schema เฉพาะ field ที่เพิ่มโดยไม่ลด assertion เดิม

## 5. Local F-08 results — 27 พฤศจิกายน 2026

ผู้รับผิดชอบ: เจตนินทร์ นายโท (M1). Source ของรอบ UI GREEN คือ RED commit `54deba90eb510cf0626066367464f2ecc1bfc6bb` + working-tree implementation; ต้องใส่ GREEN SHA หลัง commit ใน D2. API/UI tests ใช้ Docker:55433; component ใช้ mock API; browser/restart ใช้ real backend/DB ตามหลักฐานแต่ละชุด

| Tests | Actual local result | Evidence |
|---|---|---|
| TEST-53 + MyRegistrationS3 | 3/3 PASS | [own API](evidence/f08-own-green/README.md) |
| TEST-54 | 9/9 PASS | [boundaries](evidence/f08-boundaries/README.md) |
| TEST-55 | 3/3 PASS | [check-in rule](evidence/f08-check-in-green/README.md) |
| TEST-56/57 | 25 API + 5 router unit PASS | [access/input](evidence/f08-access/README.md) |
| TEST-58 | 20 races + 1 clock-after-lock PASS | [concurrency](evidence/f08-concurrency/README.md) |
| TEST-59 | 21 component + 1 real Chromium journey PASS | [UI GREEN](evidence/f08-ui-green/README.md) |
| TEST-65 | 8/8 PASS | [migration/seed/constraints](evidence/f08-migration-green/README.md) |
| TEST-66 | 1/1 PASS, actual compiled process restart | [persistence](evidence/f08-restart/README.md) |

Final regression: Vitest 34 files, 361/361 PASS; Chromium 40/40 PASS; typecheck/build และ compiled smoke 4/4 PASS ([logs](evidence/f08-ui-green/README.md)). เวลา TEST-66 และ Chromium เป็น fixture window รอบ real server clock เพื่อใช้ process จริง; domain boundary/race ใช้ controlled clocks ตาม design. Additional verification บน behavior ที่มีอยู่ผ่านตั้งแต่รันครั้งแรกและไม่ได้อ้าง RED ใหม่; separate RED/GREEN ของ implementation slices อยู่ใน TDD trace. ผล local ไม่ปิด #50 หรือแทน CI/review/merge/deploy

## Revision history

ใช้กฎเดียวกับ [contracts.md](contracts.md#revision-history)

| Version | วันที่ | การเปลี่ยนแปลง | เหตุผล | ผู้เขียน |
|---|---|---|---|---|
| 0.1 | 24 พ.ย. 2026 | fixtures, F-08 TEST-53–59 และ F-09 TEST-60–64 | ฉบับแรกก่อน implementation #50 | M2 |
| 0.2 | 26 พ.ย. 2026 | TEST-55(b) ใช้ T1 แล้ว T2 ก่อนส่งซ้ำ; TEST-58(a) สอง runtime คนละ clock; เพิ่ม TEST-65 (migration/constraints) และ TEST-66 (backend restart) | Review PR #71 โดย jetanin: clock เดียวกันจับการเขียนทับ timestamp ไม่ได้; migration และ NFR-03 หลัง restart ไม่มี test design. แก้ก่อนเริ่ม implementation #50 | M2 |
| 0.3 | 27 พ.ย. 2026 | เพิ่ม local F-08 result/evidence map และอัปเดตสถานะ; เก็บ expected cases/design เดิม | #50 มี implementation และผลรันจริงแล้ว; ไม่ใช่ F-09/CI/release acceptance | M1 |
