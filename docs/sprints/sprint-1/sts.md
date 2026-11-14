# Part E — Software Test Specification, Sprint 1

เอกสาร LC-S1-STS | Documentation baseline v0.5 | 5 พฤศจิกายน 2026

**Current coverage — 10 พ.ย.2026:** TEST-01–30/36 มี automated coverage ตาม F-01–05 รวม own read/re-login/roster journey; Vitest159/Chromium37/typecheck/build/smoke3 PASS บน 3313288 (committed/pushed RV-01–03) ดู [source/results](../../registration/views-verification.md). TEST-31/35 มีเพียง app recreation subset; independent restart/reproduction และ TEST-34/process acceptance ยังไม่ยืนยัน TEST-32/33มีautomatederror/accesschecks ไม่อ้าง exhaustive manualmatrix

## 1. Environment และ fixtures

- Vitest เป็น runner สำหรับ unit และ API/database integration; Supertest เรียก Express app โดยตรง ใช้ cookie agents แยกผู้ใช้และขอ CSRF token ตาม session
- Unit tests ตรวจ validation/service logic; API integration ใช้ Prisma กับ PostgreSQL จริง ไม่ mock data layer เพื่ออ้าง persistence/authorization
- React component tests ใช้ React Testing Library/jsdom ของ #3 (ติดตั้งแล้ว); Playwright รวม Auth/Event/audit/overview/consistency และ real Event→Registration journey; Vitest มี Event model validation/time และ RegistrationAction/RegistrationPage component tests
- ทดสอบ auth ด้วย cookie jar/session lifecycle จริง; หลัง Login ที่ regenerate session ต้องขอ CSRF token ใหม่ ห้ามแก้ session store ตรง ๆ เพื่อข้าม authentication ใน end-to-end auth tests

- ใช้ test database PostgreSQL แยกจาก demo/deployment; config ปัจจุบันใช้ instance 5432 เดียวกันสำหรับ app/test โดยแยก database Unit tests ใช้ clock ที่ควบคุมได้ ไม่ต้องเปิด cluster 55432 เก่า
- PA/PB/PC = active Participants; OA/OB = active Organizers; IX = inactive account ทั้งหมด synthetic
- เวลาอ้างอิง `t0 = 2026-11-06T03:00:00.000Z` (10:00 Bangkok) เป็น fixed fixture time ไม่ใช้วันที่จริงตัดสิน test
- EOPEN: owner OA, PUBLISHED, capacity=2, closes=t0+1h, starts=t0+2h, ends=t0+4h, ไม่มี registrations
- ELAST: เหมือน EOPEN แต่ capacity=1; EDRAFT: DRAFT; ECLOSED: CLOSED; EFULL: capacity=1 มี ACTIVE ของ PB
- แต่ละ test ใช้ independent fixtures และ reset controlled clock; Event suite ใช้ UUID เฉพาะแต่ละกรณีและ cleanup เฉพาะ ids ที่สร้างหลัง suite โดยไม่ reset ข้อมูลทั้งฐาน; permission tests ใช้ valid CSRF token เพื่อแยกจาก CSRF failure
- Domain IDs ใช้ UUID ตาม contracts; ทดสอบ malformed path ด้วย authorized session เพื่อแยก validation จาก auth/role rejection Schema assertions อ้าง contracts v0.5 รวม nested event/participant และไม่คืน field ลับ
- Domain clock/DB timestamps ใช้ millisecond; test boundary ใช้ deadline-1 ms, deadline และ deadline+1 ms; input precision เกิน 3 หลักต้องถูกปฏิเสธ ไม่ปัดลงให้ผ่าน
- สำหรับ expiry ใช้ time control ตาม server/session mechanism; ไม่ sleep รอจริง 2 ชั่วโมง
- Concurrency ใช้ separate connections/transactions และ start barrier; commit fixtures ก่อนเริ่ม requests, join แล้วอ่าน committed state จาก connection ใหม่ ไม่ครอบทุก request ด้วย uncommitted fixture transaction เดียวหรือ mock lock

## 2. Planned test cases

ระดับ API/DB ด้านล่างหมายถึง automated integration กับ PostgreSQL จริง ส่วน Unit คือ validation/service logic; F-01 มี browser E2E แล้ว ส่วน cross-feature journeys ที่ยังไม่ implement คงเป็น PLANNED

| Test ID / AC | ระดับ | Preconditions / input | Action | Expected result |
|---|---|---|---|---|
| TEST-01 / AC-01 | API/DB | PA/OA active; anonymous session ก่อน Login; valid CSRF | Login แต่ละ role แล้ว /me | 200, role ตรง DB, authenticated session identifier ใหม่ต่างจากก่อน Login |
| TEST-02 / AC-02 | API/DB | Anonymous/pre-auth CSRF; missing/empty/wrong-type/unknown fields รวม role ปลอม; unknown username/wrong password/IX/NUL username; outer spaces และ case ต่าง | Login แยก cases ตาม trim/case-sensitive seed | invalid input=400 INVALID_INPUT; credentials/inactive/NUL username=401 INVALID_CREDENTIALS generic; case ต่างไม่ตรง seed=401; trimmed username ตรงและ password ถูก=200; failure ไม่สร้าง authenticated session |
| TEST-03 / AC-03 | API/DB | PA/OA sessions และ anonymous client | เรียก /me แต่ละ session | Identity ตรงผู้ใช้และ schema; anonymous=401 AUTH_REQUIRED ไม่มี private payload |
| TEST-04 / AC-04 | API/DB | PA/OA Login แยก cases แล้ว copy cookie; valid CSRF; อีก case anonymous | Logout แล้วใช้ cookie เก่ากับ /me/protected API; anonymous เรียก Logout | Logout=204/no body; cookie เก่า/anonymous=401 AUTH_REQUIRED; server session invalidate และ cookie ถูก clear |
| TEST-05 / AC-05 | API/DB + config | Seed accounts และ production cookie config; Login pre-auth session; mutation ใช้ active authorized session | ตรวจ hash/cookie; Login/mutation ด้วย CSRF ถูก/ผิด/ขาด รวม token เก่าหลัง Login และ Origin ผิด | Salt/hash ต่างเมื่อ password เดียวกันและ verify ได้; HttpOnly/SameSite/Secure ตาม environment; valid token ผ่าน, ผิด/ขาด/เก่า/Origin ผิด=403 CSRF_FAILED ไม่เปลี่ยน domain data; bootstrap หลัง Login ให้ token ที่ใช้กับ session ใหม่ได้ |
| TEST-06 / AC-03 | API/DB | PA Login ที่ t0 | เรียก /me ที่ก่อน t0+2h และที่ expiry; แยกกรณี user ถูก disable ระหว่าง session | ก่อน expiry ใช้ได้; ที่/หลัง expiry หรือ inactive=401 |
| TEST-07 / AC-06 | API/DB | OA และ input event valid | Create แล้ว read ผ่าน own detail | 201 DRAFT, owner OA, fields ตรง input/UTC; DB/readback ตรงกัน |
| TEST-08 / AC-07 | Unit + API/DB | capacity=0,-1,1.5,1001/string/boolean; valid 1/1000; strings ว่างหลัง trim/ผิด type, Thai/emoji code-point boundaries, max-length JSON surrogate escapes, NUL/unpaired surrogate; malformed JSON/non-object/unknown fields; invalid date/offset/precision/ordering | Validate/POST แยก cases รวม closes=starts, minute ISO with offset และ fraction 0–3 หลัก | invalid=400 INVALID_INPUT ไม่มี insert; valid Unicode boundaries ผ่านทั้ง literal UTF-8/escaped JSON; normalization ตรง BR-01 ไม่ coercion capacity/ปัด timestamps/แทน invalid text เงียบ ๆ |
| TEST-09 / AC-08 | API/DB | OA owns valid EDRAFT ก่อน closes | Publish แล้วอ่านใหม่/ตรวจ DB | 200 PUBLISHED; shared list มองเห็น; owner คงเดิม |
| TEST-10 / AC-08 | API/DB | PUBLISHED/CLOSED ทั้งก่อน/หลัง closes; DRAFT ที่ closes=t0 หรือก่อน t0 | Publish แต่ละ fixture | status ไม่ใช่ DRAFT=409 INVALID_TRANSITION แม้ deadline ผ่าน; DRAFT ที่/หลัง closes=409 DEADLINE_PASSED; status/updated_at เดิม |
| TEST-11 / AC-09 | API/DB | OA/OB มี DRAFT/PUBLISHED/CLOSED; open/full/deadline fixtures และ starts_at/created_at ties | Shared list/detail และ OA own list | SharedEvent ไม่มี DRAFT/private roster (DRAFT detail=404); OwnerEvent เฉพาะ OA; sort ตรง contract; available_seats/count และ registration_open ตรง state/time/seats |
| TEST-12 / AC-10 | API/DB | Anonymous/PA; valid CSRF เมื่อจำเป็น | เรียก create, publish, own list/detail และ shared list/detail ที่ protected | anonymous=401 AUTH_REQUIRED; PA owner routes=403 ROLE_FORBIDDEN; shared สำหรับ PA ใช้ได้; DB ไม่เปลี่ยน |
| TEST-13 / AC-10 | API/DB | OB เรียก OA own detail/publish; OA ส่ง organizer_id/status ปลอม | เรียก endpoints โดยตรง | OB=404 EVENT_NOT_FOUND; unexpected fields=400 INVALID_INPUT; owner/status ไม่ถูก spoof |
| TEST-14 / AC-11 | E2E + manual UI | Organizer form; list ว่าง; slow/failing network; real session ถูกยกเลิกและ received401 เก่าตามหลัง newer network failure | Submit/browse/retry/refresh owner/shared detail; แยก late read401 หลัง Login บัญชีใหม่ | Field errors/loading/empty/retry ชัด; received401 ของ mounted session ล้าง private data และกลับ Login; response ของบัญชีเก่าไม่ทำให้บัญชีใหม่หลุด |
| TEST-15 / AC-12 | API/DB | PA, EOPEN, t0 | Register แล้ว query DB และอ่านผ่าน my endpoint | 201 ACTIVE ของ PA; registered_at server time; DB count=1; persisted reference อ่านได้ |
| TEST-16 / AC-13 | API/DB | PA มี ACTIVE ใน PUBLISHED ก่อน deadline; แยก case ที่ยังมีที่นั่งและ capacity เต็มจาก PA เอง | Register ซ้ำ | 409 ALREADY_REGISTERED แม้เต็มด้วย; record/count/registered_at เดิม ไม่สร้างเพิ่ม |
| TEST-17 / AC-14 | API/DB | PA และ EFULL | Register | 409 EVENT_FULL; ไม่มี PA registration; count ยัง 1 |
| TEST-18 / AC-15 | Unit + API/DB | PA; DRAFT/CLOSED และ deadline-1 ms/เท่ากับ/+1 ms; closed/expired cases รวม PA ลงแล้วและเต็มด้วย; อีก case รอ lock แล้ว advance clock ถึง deadline | Register แยก fixtures; ใช้ separate connection/barrier สำหรับ lock wait | DRAFT=404 EVENT_NOT_FOUND; CLOSED/expired=409 REGISTRATION_CLOSED ก่อน duplicate/full ไม่มี insert; -1 ms เมื่อมีที่นั่ง=201; ได้ lock ที่ deadline ต้อง reject |
| TEST-19 / AC-16 | API/DB | Anonymous/OA; PA ส่ง participant_id/status/registered_at ปลอม | Register โดยตรง | anonymous=401 AUTH_REQUIRED; OA=403 ROLE_FORBIDDEN; spoof=400 INVALID_INPUT; DB ทุกกรณีไม่เปลี่ยน |
| TEST-20 / AC-17 | API/DB concurrency | PA/PB, ELAST, valid independent sessions/connections | สอง request register พร้อม barrier แล้วอ่าน DB หลัง commit | response set {201,409 EVENT_FULL}; ACTIVE count=1; มีผู้ชนะคนเดียว ไม่มี partial write |
| TEST-21 / AC-17 | API/DB concurrency | PA สอง client sessions, EOPEN capacity=2 | Register พร้อมกันใน event เดียวกัน | response set {201,409 ALREADY_REGISTERED}; pair PA/event มี record=1; count=1 |
| TEST-22 / AC-18 | API/DB | PA/PB มี registrations คนละ event | PA เรียก own list/detail แล้วเทียบ DB | ได้เฉพาะ PA, fields/ordering ตรง DB ไม่คืนข้อมูล PB |
| TEST-23 / AC-19 | API/DB | PA/PB, OA, anonymous | PA เรียก detail ของ PB; OA/anonymous เรียก list/detail | cross-user=404 REGISTRATION_NOT_FOUND; OA=403 ROLE_FORBIDDEN; anonymous=401 AUTH_REQUIRED; ไม่มี private data |
| TEST-24 / AC-18 | E2E | PA ลงทะเบียนสำเร็จ | Refresh, Logout, Login ใหม่, เปิด own detail | Record reference/event/status เดิมอ่านจาก server ได้ |
| TEST-25 / AC-20 | E2E + manual UI | PA ไม่มี registrations; เคยมีหน้า private ของ session ก่อน | เปิดหน้า empty; จำลอง fetch failure/session change | ข้อความ empty, link เลือกกิจกรรม, error/retry; ไม่แสดงข้อมูลของ session ก่อน |
| TEST-26 / AC-21 | API/DB | OA owns EOPEN และอีก event; PA/PB records แยก event | OA เรียก roster EOPEN | เฉพาะ records EOPEN; active_count ตรง DB; ลำดับ registered_at และ id |
| TEST-27 / AC-22 | API/DB | OB/PA/anonymous เรียก OA roster | GET owner roster โดยตรง | OB=404 EVENT_NOT_FOUND; PA=403 ROLE_FORBIDDEN; anonymous=401 AUTH_REQUIRED; ไม่มี participant list ใน body |
| TEST-28 / AC-21 | API/DB + UI | OA owns event ไม่มี registration | เปิด roster | 200 data.registrations=[] และ data.active_count=0; UI empty state |
| TEST-29 / AC-23 | API/DB | OA เปิด roster count=0; PA ลงทะเบียน event เดียวกัน | OA reload roster | data.active_count=1 และ registrations มี participant.display_name ของ PA/reference; ไม่คืน hash/session/credential |
| TEST-30 / AC-24 | E2E | Clean seed, OA/PA แยก browser contexts | OA create/publish → PA register/readback → OA roster | ทั้ง journey สำเร็จผ่าน UI/API/DB และ reference/count ตรงกัน |
| TEST-31 / AC-25 | Manual integration | Released local build, PostgreSQL แยกจาก process, saved registration ID | หยุด/เริ่ม web process โดยไม่ reset DB แล้ว Login/read own/roster | Record ID/status/count เดิม; บันทึกคำสั่งจริง เวลาและ commit |
| TEST-32 / AC-26 | API/DB | 400/401/403/404/409 samples; malformed/missing UUID ของ event/registration; unknown API; injected dependency failure ใน test app ด้วย production error config | ตรวจ error schema/code และ private fields; ไม่มี public test-only endpoint | UUID ผิด=400 INVALID_INPUT; valid missing record=404 ตาม resource; unknown API=404 ROUTE_NOT_FOUND; unexpected failure=500 INTERNAL_ERROR generic; code/message strings, fields map<string,string[]>; ไม่คืน secrets/SQL/traceback |
| TEST-33 / AC-26 | E2E | PA duplicate/full fixture และ PA พยายาม owner action | ทำ rejected journey และเข้าหน้า/endpoint ผิดสิทธิ์ | ผู้ใช้เห็นเหตุผล/ขั้นตอนต่อ; backend ตอบตาม contract; DB count ไม่เพิ่ม |
| TEST-34 / AC-27 | Manual document/process review | Submitted release และหลักฐานจริง | ตรวจ AC/test refs, TDD, Issues #1–4/board, reviews/integration/release, baseline Git history และ limitations | IDs/versions/commit sequence สอดคล้อง; 2 completed Issue/PR chains และ board URL/status/date ครบ; failed/skipped/incomplete เปิดเผย; authors ไม่ approve เอง |
| TEST-35 / AC-25 | Manual reproduction | Environment ใหม่/clean DB; teammate ที่ไม่ใช่ driver; private demo credentials | ทำตาม README ที่ implement แล้ว migrate/seed/build/run/test และ normal journey | ทำซ้ำได้โดยไม่แก้ source; เก็บ actual commands/result/tester/commit; หากขั้นตอนไม่มีให้นับ INCOMPLETE |
| TEST-36 / AC-11 | Unit + E2E | ISO timestamps offsets ต่างกันแต่ instant เดียวกัน; fractions 0–3 หลัก; Bangkok midnight boundary | Normalize/read API/render UI และทดสอบ deadline-1 ms/เท่ากับ/+1 ms | เก็บ UTC millisecond, output YYYY-MM-DDTHH:mm:ss.SSSZ ตรง instant; UI Bangkok ระบุ timezone และวันถูก; acceptance ใช้ server clock เดียวกัน |

## 3. Execution / TDD protocol

1. ระบุ tested commit, runtime/dependency/DB versions, environment/fixtures/time และ commands
2. รัน type-check/build, unit/API/DB/concurrency และ selected browser E2E; แยก manual UI/restart/clean reproduction
3. เก็บ pass/fail/skipped counts; ตรวจ assertions/failures และเติม actual file/name/result/commit ใน traceability
4. Meaningful rule work เช่น TEST-16/20/27: เก็บ intended assertion red ก่อน implement/correct → green และ regression พร้อม versions; environment/syntax error ไม่ใช่ red ของ business rule
5. คง failed/skipped/incomplete results พร้อมเหตุผล; planned IDs ไม่ใช่จำนวน tests ที่ runner ผ่านจริง

## 4. Actual execution summary

10 พ.ย.2026: Current committed/pushed source คือ 3313288; current results ในตารางนี้และ [verification](../../registration/views-verification.md), retained historical failures แยกไว้ตามวันที่

| ประเภท | ผลปัจจุบัน | Actual command / file / commit |
|---|---|---|
| Unit/API/DB/concurrency | 15 files / 159 PASS, 0 FAIL/SKIP, real PostgreSQL17.11/Node22.23.2 | npm test; [vitest.log](../../registration/evidence/review-fixes/vitest.log); 3313288 |
| Browser E2E | Focused2 PASS, full37 PASS, 0 FAIL/SKIP; includes corrected account switch, real own read/re-login/roster and existing viewport regressions | npm run test:e2e, ports5197/3027 DB55433; [e2e.log](../../registration/evidence/review-fixes/e2e.log); 3313288 |
| Manual restart/reproduction/UI | Independent teammate/OS-process restart NOT VERIFIED | Automated app recreation and full UI journey pass; not independent clean setup/UAT or process restart |
| Process review | PARTIAL: PR #7/#10 approved by i3artuf and merged staging; recorded application results remain at3313288 | [12 November review/merge snapshots](../../deliverable-1/evidence/review-merge-20261112/README.md); final board, independent acceptance and reviewed main release still pending |
