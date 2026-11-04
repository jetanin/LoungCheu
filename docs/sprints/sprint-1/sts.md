# Part E — Software Test Specification, Sprint 1

เอกสาร LC-S1-STS | Version 0.2 | 4 พฤศจิกายน 2026

**ทุก TEST-01–36 มีสถานะ PLANNED / NOT EXECUTED; actual file/name, execution commit และผลยังไม่มี** ข้อมูลในตารางคือ input/action/expected result เพื่อเตรียม implement test ไม่ใช่ assertion ที่รันแล้ว

## 1. Environment และ fixtures

- Vitest เป็น runner สำหรับ unit และ API/database integration; Supertest เรียก Express app โดยตรง ใช้ cookie agents แยกผู้ใช้และขอ CSRF token ตาม session
- Unit tests ตรวจ validation/service logic; API integration ใช้ Prisma กับ PostgreSQL จริง ไม่ mock data layer เพื่ออ้าง persistence/authorization
- React component tests เสนอ Vitest + React Testing Library; selected browser E2E เสนอ Playwright เพิ่ม (ยังไม่มี test implementation)
- ทดสอบ auth ด้วย cookie jar/session lifecycle จริง; หลัง Login ที่ regenerate session ต้องขอ CSRF token ใหม่ ห้ามแก้ session store ตรง ๆ เพื่อข้าม authentication ใน end-to-end auth tests

- ใช้ test database PostgreSQL แยกจาก demo/deployment; unit tests ใช้ clock ที่ควบคุมได้
- PA/PB/PC = active Participants; OA/OB = active Organizers; IX = inactive account ทั้งหมด synthetic
- เวลาอ้างอิง `t0 = 2026-11-06T03:00:00Z` (10:00 Bangkok) เป็น fixed fixture time ไม่ใช้วันที่จริงตัดสิน test
- EOPEN: owner OA, PUBLISHED, capacity=2, closes=t0+1h, starts=t0+2h, ends=t0+4h, ไม่มี registrations
- ELAST: เหมือน EOPEN แต่ capacity=1; EDRAFT: DRAFT; ECLOSED: CLOSED; EFULL: capacity=1 มี ACTIVE ของ PB
- ทุก test reset fixture เป็นอิสระ; permission tests ใช้ valid CSRF token เพื่อแยกจาก CSRF failure
- สำหรับ expiry ใช้ time control ตาม backend/session mechanism; ไม่ sleep รอจริง 2 ชั่วโมง
- Concurrency test ต้องใช้ separate DB connections/transactions และ start barrier ปล่อยคำขอพร้อมกัน จากนั้น join และอ่านผล committed state จาก connection ใหม่ ห้ามใช้ mock lock หรือ in-memory database แทน

## 2. Planned test cases

ระดับ API/DB ด้านล่างหมายถึง automated integration กับ PostgreSQL จริง ส่วน Unit คือ validation/service logic; E2E คือ browser journey ที่จะ implement ภายหลัง

| Test ID / AC | ระดับ | Preconditions / input | Action | Expected result |
|---|---|---|---|---|
| TEST-01 / AC-01 | API/DB | PA/OA active; anonymous session ก่อน Login; valid CSRF | Login แต่ละ role แล้ว /me | 200, role ตรง DB, authenticated session identifier ใหม่ต่างจากก่อน Login |
| TEST-02 / AC-02 | API/DB | missing fields; unknown username; wrong password; IX | Login แยก parameterized cases | missing=400; credential/inactive=401 ด้วย generic message; ไม่มี authenticated session |
| TEST-03 / AC-03 | API/DB | PA session และ anonymous client | เรียก /me ทั้งสองกรณี | PA ได้เฉพาะ id/name/role ของตน; anonymous=401 และไม่มี private payload |
| TEST-04 / AC-04 | API/DB | PA Login แล้ว copy session cookie; valid CSRF | Logout แล้วเรียก /me และ protected API ด้วย cookie เดิม | 204; เก่าใช้ไม่ได้ 401; session ฝั่ง server invalidate |
| TEST-05 / AC-05 | API/DB + config | Seed account และ production cookie config; valid/invalid/no CSRF | ตรวจ hash/cookie attributes; ส่ง Login และ representative mutation ด้วย token ผิด/ขาด | hash verify ได้และไม่เท่า plaintext; HttpOnly/SameSite/Secure ตาม environment; invalid/no CSRF=403 ไม่มี mutation |
| TEST-06 / AC-03 | API/DB | PA Login ที่ t0 | เรียก /me ที่ก่อน t0+2h และที่ expiry; แยกกรณี user ถูก disable ระหว่าง session | ก่อน expiry ใช้ได้; ที่/หลัง expiry หรือ inactive=401 |
| TEST-07 / AC-06 | API/DB | OA และ input event valid | Create แล้ว read ผ่าน own detail | 201 DRAFT, owner OA, fields ตรง input/UTC; DB/readback ตรงกัน |
| TEST-08 / AC-07 | Unit + API/DB | capacity=0,-1,1.5,1001; valid boundaries 1/1000; empty fields; max lengths/เกิน; offset missing; closes>starts; starts>=ends | Validate และ POST แยก cases | invalid=400/ไม่มี insert; valid boundary ผ่าน; ไม่ยอมแปลง float เป็นจำนวนเต็มเงียบ ๆ |
| TEST-09 / AC-08 | API/DB | OA owns valid EDRAFT ก่อน closes | Publish แล้วอ่านใหม่/ตรวจ DB | 200 PUBLISHED; shared list มองเห็น; owner คงเดิม |
| TEST-10 / AC-08 | API/DB | PUBLISHED/CLOSED; DRAFT ที่ closes เท่ากับ t0/ก่อน t0 | เรียก publish แต่ละ fixture | 409 INVALID_TRANSITION หรือ DEADLINE_PASSED ตามกรณี; DB status เดิม |
| TEST-11 / AC-09 | API/DB | OA/OB มี DRAFT/PUBLISHED/CLOSED และมี registrations | Shared list/detail และ OA own list | Shared ไม่เห็น DRAFT/ไม่คืน roster; own list เฉพาะ OA; ordering และ available_seats ตรง fixtures |
| TEST-12 / AC-10 | API/DB | Anonymous/PA; valid CSRF เมื่อจำเป็น | เรียก create, publish, own list/detail และ shared list/detail ที่ protected | anonymous=401; PA owner routes=403; shared สำหรับ PA ใช้ได้; DB ไม่เปลี่ยน |
| TEST-13 / AC-10 | API/DB | OB เรียก OA own detail/publish; OA ส่ง organizer_id/status ปลอม | เรียก endpoints โดยตรง | OB=404 ไม่เปิดเผย event private; unexpected fields=400; owner/status ไม่ถูก spoof |
| TEST-14 / AC-11 | E2E + manual UI | Organizer form; list ว่าง; slow/failing network จำลอง | Submit invalid, valid; browse empty/loading/error states | Field errors ชัด, loading/ปุ่มป้องกันกดซ้ำ, empty มีทางไปต่อ, retry ไม่แสดง stale private data |
| TEST-15 / AC-12 | API/DB | PA, EOPEN, t0 | Register แล้ว query DB และอ่านผ่าน my endpoint | 201 ACTIVE ของ PA; registered_at server time; DB count=1; persisted reference อ่านได้ |
| TEST-16 / AC-13 | API/DB | PA มี ACTIVE ใน EOPEN | Register event เดิมอีกครั้ง | 409 ALREADY_REGISTERED; record/count/registered_at เดิม ไม่สร้างเพิ่ม |
| TEST-17 / AC-14 | API/DB | PA และ EFULL | Register | 409 EVENT_FULL; ไม่มี PA registration; count ยัง 1 |
| TEST-18 / AC-15 | Unit + API/DB | PA; EDRAFT/ECLOSED; EOPEN ที่ก่อน deadline 1 microsecond, เท่ากับ deadline, หลัง deadline | Register แยก fixtures/clock | DRAFT=404; CLOSED/เท่ากับ/หลัง deadline=409 REGISTRATION_CLOSED; ก่อน deadline=201 เมื่อมีที่นั่ง |
| TEST-19 / AC-16 | API/DB | Anonymous/OA; PA ส่ง participant_id/status/registered_at ปลอม | Register โดยตรง | anonymous=401; OA=403; spoof=400; DB ทุกกรณีไม่เปลี่ยน |
| TEST-20 / AC-17 | API/DB concurrency | PA/PB, ELAST, valid independent sessions/connections | สอง request register พร้อม barrier แล้วอ่าน DB หลัง commit | response set {201,409 EVENT_FULL}; ACTIVE count=1; มีผู้ชนะคนเดียว ไม่มี partial write |
| TEST-21 / AC-17 | API/DB concurrency | PA สอง client sessions, EOPEN capacity=2 | Register พร้อมกันใน event เดียวกัน | response set {201,409 ALREADY_REGISTERED}; pair PA/event มี record=1; count=1 |
| TEST-22 / AC-18 | API/DB | PA/PB มี registrations คนละ event | PA เรียก own list/detail แล้วเทียบ DB | ได้เฉพาะ PA, fields/ordering ตรง DB ไม่คืนข้อมูล PB |
| TEST-23 / AC-19 | API/DB | PA/PB, OA, anonymous | PA เรียก detail ของ PB; OA/anonymous เรียก list/detail | cross-user=404; OA=403; anonymous=401; ไม่มี private data |
| TEST-24 / AC-18 | E2E | PA ลงทะเบียนสำเร็จ | Refresh, Logout, Login ใหม่, เปิด own detail | Record reference/event/status เดิมอ่านจาก server ได้ |
| TEST-25 / AC-20 | E2E + manual UI | PA ไม่มี registrations; เคยมีหน้า private ของ session ก่อน | เปิดหน้า empty; จำลอง fetch failure/session change | ข้อความ empty, link เลือกกิจกรรม, error/retry; ไม่แสดงข้อมูลของ session ก่อน |
| TEST-26 / AC-21 | API/DB | OA owns EOPEN และอีก event; PA/PB records แยก event | OA เรียก roster EOPEN | เฉพาะ records EOPEN; active_count ตรง DB; ลำดับ registered_at และ id |
| TEST-27 / AC-22 | API/DB | OB/PA/anonymous เรียก OA roster | GET owner roster โดยตรง | OB=404; PA=403; anonymous=401; ไม่มี participant list ใน body |
| TEST-28 / AC-21 | API/DB + UI | OA owns event ไม่มี registration | เปิด roster | 200 empty array/count=0 และ UI empty state |
| TEST-29 / AC-23 | API/DB | OA เปิด roster count=0; PA ลงทะเบียน event เดียวกัน | OA reload roster | count=1 และ PA display_name/reference; ไม่คืน hash/session/credential |
| TEST-30 / AC-24 | E2E | Clean seed, OA/PA แยก browser contexts | OA create/publish → PA register/readback → OA roster | ทั้ง journey สำเร็จผ่าน UI/API/DB และ reference/count ตรงกัน |
| TEST-31 / AC-25 | Manual integration | Released local build, PostgreSQL แยกจาก process, saved registration ID | หยุด/เริ่ม web process โดยไม่ reset DB แล้ว Login/read own/roster | Record ID/status/count เดิม; บันทึกคำสั่งจริง เวลาและ commit |
| TEST-32 / AC-26 | API/DB | Samples 400/401/403/404/409 จาก tests ก่อนหน้า; production error config | ตรวจ response schema และ sensitive keys/text | error.code/message/fields ถูกโครงสร้าง; ไม่มี password/session ID/hash/SQL/traceback และไม่มี private data เมื่อปฏิเสธ |
| TEST-33 / AC-26 | E2E | PA duplicate/full fixture และ PA พยายาม owner action | ทำ rejected journey และเข้าหน้า/endpoint ผิดสิทธิ์ | ผู้ใช้เห็นเหตุผล/ขั้นตอนต่อ; backend ตอบตาม contract; DB count ไม่เพิ่ม |
| TEST-34 / AC-27 | Manual document/process review | Submitted release และหลักฐานที่เกิดจริง | ตรวจทุก AC, actual test refs, TDD red/green, Issues/PR/review/integration/release, limitations | IDs/versions สอดคล้อง; planned ไม่อ้าง PASS; failed/skipped/incomplete เปิดเผย; authors ไม่ approve เอง |
| TEST-35 / AC-25 | Manual reproduction | Environment ใหม่/clean DB; teammate ที่ไม่ใช่ driver; private demo credentials | ทำตาม README ที่ implement แล้ว migrate/seed/build/run/test และ normal journey | ทำซ้ำได้โดยไม่แก้ source; เก็บ actual commands/result/tester/commit; หากขั้นตอนไม่มีให้นับ INCOMPLETE |
| TEST-36 / AC-11 | Unit + E2E | ISO timestamps offsets ต่างกันแต่ instant เดียวกัน; Bangkok midnight boundary | Normalize/read API/render UI และทดสอบ deadline | เก็บ UTC ถูก, UI Bangkok ระบุ timezone และวันถูก; acceptance ใช้ server clock เดียวกัน |

## 3. Test execution protocol

1. บันทึก release commit, dependency/runtime/DB versions, environment, fixture/time และ command จริง
2. รัน TypeScript checks, Vite frontend build, backend TypeScript build และ Vitest/Supertest suite; concurrency ใช้ real PostgreSQL transactions/connections และ Supertest clients แยก session ไม่ใช้ Prisma mock หรือ test wrapper ที่ทำให้ lock behavior ต่างจากจริง
3. รัน selected browser E2E ด้วย isolated user contexts และ manual restart/reproduction
4. สรุปจำนวน pass/fail/skipped ของ automated และผล manual แยกกัน ห้ามเอา planned cases มานับเป็น automated tests ที่มีแล้ว
5. เมื่อ test fail ตรวจ assertion/setup และแก้สาเหตุ ห้าม disable/ลด assertion เพื่อให้ดูผ่าน
6. อัปเดต traceability กับ actual path/test name, ผล, execution version และ evidence ID

## 4. Meaningful TDD evidence ที่วางแผน

ตัวอย่างที่เหมาะ: TEST-16 duplicate, TEST-20 last-seat และ TEST-27 ownership ให้เขียน intended behavior test ก่อน → รันเห็น expected assertion fail เนื่องจากยังไม่มี behavior/ยังผิด → implement/correct → รัน green และ regression เก็บคำสั่ง ผลล้มเหลว/ผ่าน พร้อม test/implementation commits จริง

Syntax error, missing dependency หรือ DB ต่อไม่ได้ไม่ใช่หลักฐานว่ากฎธุรกิจ fail ตามที่ตั้งใจ แก้ environment ก่อนเก็บ red evidence ไม่สร้างหรือแก้ประวัติย้อนหลังเพื่อให้ดูเป็น TDD

## 5. Actual execution summary

| ประเภท | ผลปัจจุบัน | Actual command / file / commit |
|---|---|---|
| Unit/API/DB/concurrency | NOT EXECUTED | ยังไม่มี test implementation |
| Browser E2E | NOT EXECUTED | ยังไม่มีแอปหรือ browser suite |
| Manual restart/reproduction/UI | NOT EXECUTED | ยังไม่มี runnable release |
| Process review | NOT EXECUTED | ยังไม่มี review/Issue/PR/release history |

STS มี planned IDs 36 รายการ หนึ่ง ID อาจมีหลาย parameterized cases จำนวน automated tests จริงต้องอ่านจาก runner output หลัง implement ไม่ถือว่า “36 tests ผ่าน”
