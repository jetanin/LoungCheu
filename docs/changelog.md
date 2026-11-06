# Document Change Log

Documentation baseline v0.5 | 5 พฤศจิกายน 2026

| Version | วันที่ | เปลี่ยนแปลง |
|---|---|---|
| 0.1 | 4 พ.ย. 2026 | ร่าง SRS, features/traceability, system design, Sprint plan, contracts/STS/DoD และ evidence templates |
| 0.2 | 4 พ.ย. 2026 | กำหนด React/Express/TypeScript/PostgreSQL/Prisma, Vitest/Supertest และแผน 4 Issues |
| 0.3 | 5 พ.ย. 2026 | ตรวจ PDF ทั้งสองฉบับ; ปรับ metadata, API schemas/UUID และ DEC-06/11/15–17; revise AC-07/15, TEST-08/18/32/36; staging เปลี่ยนจากแผน dev ผ่าน sprint-1 มาเป็น sprint-1-staging |
| 0.4 | 5 พ.ย. 2026 | ย่อข้อความซ้ำ/ประวัติสนทนา; รวม revision history ไว้ที่นี่; ใช้ version เดียวทั้งชุด; แก้ FR-11, feature dependencies/mappings, API schemas/statuses, UI detail route, permission matrix และ STS ให้ตรงกัน โดยคง IDs และขอบเขต features |
| 0.5 | 5 พ.ย. 2026 | ตรวจ PDF/baseline ซ้ำ; ผูก Issues #1–4, assignment และ board/Done; เพิ่ม planned layout; แก้แผน baseline PR เพราะ local Git roots ต่างกัน; ชี้แจง BR-01/04/09/14, error schema/precedence และ AC/STS ที่เกี่ยวข้อง; แก้ traceability และ .gitignore โดยคง IDs |

## Git และ review history

UI consistency follow-up หลัง demo seed — ตรวจ Login/overview/owner/shared/create/detail และ states ที่1280/390/320px ด้วย TDD RED3 → final35 Chromium PASS; รวม145 Vitest/typecheck/build/compiled smoke3 PASS ใช้ shared typography/panels/controls, แก้logoและLogoutแตกบรรทัด, primary CTAสีเขียว, status/labels/cardsให้ตรงกัน, 1 h1 และ trailing slash greeting, คงการถอดกลับรายการกิจกรรมและทดสอบ browser Back ไม่มีAPI/schema/migration/#3 internals/app-data changes เก็บ initial visual review/first-attempt helper failure ตามจริง ดู [record](events/visual-consistency.md) ยังไม่commit/push

6 พ.ย. 2026 — ตามคำขอ seed ข้อมูล: เพิ่ม6 Event scenarios/4 ACTIVE examples ใน CLIเดิม วันที่คำนวณตาม Bangkok; create-only transaction/advisory lock และ rerun คงข้อมูลที่แก้/ลงทะเบียนแล้ว TDD RED4 → GREEN4; full Vitest145/typecheck PASS Seed ฐานแอป loung-cheu-database ตามคำขอเพิ่ม Event6/Registration4 และตรวจ Eventเดิม1/Userเดิม6คงเดิม; rerunข้าม6 ไม่มีrecordเปลี่ยน Browser32/buildเป็นผลก่อนseed ไม่ rerun ไม่มีschema/migration/commit/push ดู [record](events/demo-seed.md)

6 พ.ย. 2026 — Consistency re-audit ของ #1–#3 หลังรวม: เขียน RED tests ก่อนแก้ Event received-401 ที่ถูก newer network failure กลบ, valid max Unicode JSON escapes เกิน parser budget และ Login username NUL ได้ 500 แทน generic401 เพิ่ม mounted-session guard, Event parser 32 KiB โดย Auth คง16 KiB/Registrationคง1 KiB และ dummy-hash rejection คง #3 internals/schema/migrations ผลเต็ม 141 Vitest + 32 Chromium + typecheck/build/compiled smoke3 PASS อัปเดต current docs/traceability และเก็บ 140/29 เป็น historical ดู [record](events/consistency-review.md) ยังไม่ commit/push; Issue #4/manual UAT/restart/review/release pending

6 พ.ย. 2026 — ผู้ใช้ commit F-02 ถึง 04106ff และเริ่ม merge sprint-1-staging@ada659b (รวม #3) บน feature/events; Codex แก้ App/createApp/traceability conflicts คง RegistrationAction internals/shared migration เดิม และแก้ consistency ด้วย TDD: live form errors, minute ISO offsets, NUL/unpaired Unicode ก่อน DB เพิ่ม combined API/recreation/UI journey ผล 140 Vitest + 29 Chromium + generate/test migration/typecheck/build/compiled smoke PASS อัปเดตเอกสาร/traceabilityตามผลจริง ไม่มี commit/push โดย Codex; Issue #4/UAT/process restart/review/release ยัง pending ดู [combined record](events/combined-integration.md) รายการก่อนหน้าด้านล่างเป็น historical results

6 พ.ย. 2026 — Issue #2/F-02 บน `feature/events` working tree จาก staging `6e8a24c`: reuse schema/migration foundation ของ `feature/registration` โดยไม่เปลี่ยนชื่อ/เนื้อหา เพิ่ม Event APIs/UI ด้วย TDD, row-lock publish, committed snapshot counts, strict validation/ownership และ RegistrationAction host ที่รักษาสถานะขณะ refresh ผล 64 Vitest + 13 browser PASS พร้อม generate/test-migrate/typecheck/build/built smoke ไม่มี commit/push/merge; ไม่อ้าง Registration backend/full Sprint 1 journey หรือ independent UAT ดู [verification](events/verification.md) และ [integration dependencies](events/integration.md)

6 พ.ย. 2026 — Follow-up F-02 spec audit: พบและแก้ cached record หลัง 403/404, background identity failure ที่ unmount RegistrationAction, session/mutation responses ข้ามบัญชี, publish conflict ไม่ refresh, frontend calendar rollover, SharedEvent type และ trailing slash เพิ่ม TDD RED/coverage และแก้ current summaries ที่ยังขัดกัน ผลล่าสุด 74 Vitest + 22 browser PASS พร้อม typecheck/build/built smoke ดู [audit findings](events/audit.md) และ [latest source/results](events/verification.md) ไม่เปลี่ยน Event backend/schema/migration หรือ RegistrationAction internals

6 พ.ย. 2026 — F-02 form UI feedback: ใช้ native date/time picker ระดับนาทีแทน millisecond และจัด form กึ่งกลางแนวนอน เพิ่ม TDD assertions ใน journey เดิมสำหรับ native increment ทั้งสามช่อง, desktop/mobile center และ overflow; 74 Vitest / 22 browser + typecheck/build/built smoke PASS ดู [latest verification](events/verification.md) API timestamp precision contract คงเดิม

6 พ.ย. 2026 — F-02 schedule layout ตามภาพอ้างอิง: เพิ่ม EventSchedule แยกวันที่/เวลาเป็นแถวและ timezone panel ด้านขวา คงสีเดิม ย้าย panel ลงบนมือถือ ใช้ date/time values รวมเป็น Bangkok timestamp ผ่าน validation/API เดิม ปรับ browser helpers/assertions และเก็บ RED/attempt/GREEN; ผลล่าสุด 74 Vitest / 22 browser + typecheck/build/built smoke PASS ดู [verification](events/verification.md)

6 พ.ย. 2026 — F-02 เรียงช่องใหม่เป็นปิดรับลงทะเบียน→เริ่มกิจกรรม→สิ้นสุดกิจกรรม โดยคง date/time split และสีเดิม เพิ่ม DOM/visual order assertions บน desktop/mobile ด้วย TDD RED→GREEN; focused create/publish/shared-detail journey 1 PASS และ typecheck/build PASS Full 74/22 suite เป็นผลรอบก่อนการเรียงช่อง ดู [verification](events/verification.md)

6 พ.ย. 2026 — F-02 optional Organizer overview `/organizer` ตามภาพอ้างอิง: ใช้ own event list เดิมสำหรับจำนวน Event ทั้งหมด/DRAFT/PUBLISHED, 3 รายการล่าสุด, empty state และลิงก์ Create/ดูทั้งหมด คงสีเดิมและ Auth Login `/events`; ใช้ฉบับร่างแทนยอดผู้ลงทะเบียนเพื่อคงขอบเขต Event UI ไม่มี API/schema/roster/attendance report เพิ่ม TDD browser RED 4 fail → full GREEN 26 pass; 74 Vitest, typecheck/build/compiled smoke PASS ดู [verification](events/verification.md)

6 พ.ย. 2026 — F-02 align ช่องวัน/เวลาทั้งสามแถวให้กว้างเท่ากัน และขยาย timezone panel อยู่ขวาของทั้งชุด คงสี/ลำดับเดิม TDD geometry RED→GREEN ใน focused create/publish journey 1 PASS บน desktop/mobile พร้อม typecheck/build PASS; full 74/26 เป็นผลรอบ overview ก่อนหน้า ดู [verification](events/verification.md)

| รายการ | สถานะ |
|---|---|
| v0.2 snapshot | commit `002c6982f40defd42657a2419b0a17329cb34069` วันที่ 4 พ.ย. 2026 |
| v0.1 | ไม่มี Git revision แยกที่ยืนยันได้ |
| v0.3–0.5 | บันทึกใน documentation history ถึง `f5339b9`; baseline merge เข้า staging `5395942` ผ่าน PR #5 |
| Teammate review | jetanin APPROVED baseline v0.5; รายละเอียด/วันที่/ลิงก์ใน [Decisions](decisions.md) |
| Setup/F-01 — 6 พ.ย. 2026 | Working tree บน `feature/auth` จาก `5395942`; ยังไม่ commit/push/เปิด feature PR; ผลรันและ SHA256 source versions อยู่ใน [auth evidence](deliverable-1/evidence/auth/README.md) |
| F-01 pre-PR review — 6 พ.ย. 2026 | แก้ session-response race/page restore, JSON charset 400, DB URL/test target validation, SPA fallback ใน hidden ancestor, session cleanup และ fixture isolation; current 54 unit/API + 7 browser PASS; clean dependency install/build/smoke ตรวจจริง ดู [pre-PR review](sprints/sprint-1/auth-pre-pr-review.md); ไม่เปลี่ยน AC baseline และไม่อ้าง teammate approval |
| Layout/local DB — 6 พ.ย. 2026 | ผู้ใช้ยืนยัน `server/client`; ปรับ workspace names/scripts/imports/config/ignore/lockfile/docs และทดสอบซ้ำ 54 unit/API + 7 browser PASS พร้อม typecheck/build/compiled smoke; app DB ใหม่ `loung-cheu-database` ยังรอ role authentication จึงยังไม่ migrate/seed ดู [record](sprints/sprint-1/server-client-local-db.md) |
| App DB migration/env cleanup — 6 พ.ย. 2026 | ผู้ใช้แก้ connection แล้วและสั่งรัน: migrate `202611060001_auth`/seed บน `loung-cheu-database` สำเร็จ, เพิ่ม `test:local-db` ตรวจ actual app DB และสอง-role auth lifecycle, rerun suites/build/typecheck; ลบ root `.env.example` ที่ซ้ำ เก็บ `server/.env` กับ root `.env.test` แยกหน้าที่ รหัส demo อยู่เฉพาะไฟล์ local; ผลก่อนหน้านี้เป็น historical evidence |
| Single PostgreSQL instance — 6 พ.ย. 2026 | ตามคำสั่งผู้ใช้ ย้าย test DB ไป localhost:5432 ที่เดียวกับแอปโดยแยกชื่อ database; เพิ่ม db:setup:test, เปลี่ยน local-db.ps1 เป็น wrapper ที่ไม่ start cluster, migrate/rerun suites ผ่าน, หยุด 55432 และเก็บข้อมูลเดิม; ตรวจ User rows ของแอปไม่เปลี่ยน ดู [record](sprints/sprint-1/single-instance-db.md) |
| Application release | ยังไม่มี |
| Registration extension — 6 พ.ย. 2026 | ใช้ staging `6e8a24c` เป็นฐานและต่อ F-03 กับ auth/session/CSRF/App/API client ของเพื่อน เพิ่ม additive Event/Registration migration; 110 Vitest + 7 auth browser tests ผ่าน พร้อม build/typecheck/built/app-DB smoke; เก็บฐานเก่าและใช้ฐาน Docker ใหม่ ดู [current verification](registration/verification.md); merge working tree รอผู้ใช้ stage/commit และเพื่อน review |

เมื่อเปลี่ยน baseline ให้บันทึกเหตุผล IDs ที่กระทบ และ revision ก่อน implementation เก็บผลทดสอบ/review ตาม commit จริง; การย้ายขอบเขตที่กระทบข้อกำหนดรายวิชาต้องมีการตกลงที่เกี่ยวข้อง

## AI-use declaration

ใช้ Codex ช่วยอ่าน PDF ร่าง/ปรับเอกสาร วิเคราะห์ design และตรวจ IDs/links/traceability; ตั้งแต่ 6 พ.ย. 2026 ช่วย setup workspace, เขียน implementation/tests ของ F-01/F-02 และ audit/แก้ไขพร้อมเก็บผลรันจริงตาม [auth work record](sprints/sprint-1/auth-work-record.md) และ [F-02 audit](events/audit.md) ทีมรับผิดชอบตรวจรับและเข้าใจ code/tests และทำ teammate review เอง ผลที่ยังไม่รันไม่ถือว่าผ่าน
