# F-02 / Issue #2 verification

ทดสอบและ audit 6 พฤศจิกายน 2026 (Asia/Bangkok) บน `feature/events` working tree จาก parent `6e8a24c45e66eb4b8df9939d5cb364c316948af4` ยังไม่ commit Full regression รอบ overview ผ่าน **74 Vitest / 26 browser**; ล่าสุดปรับความกว้างช่องวัน/เวลาให้ตรงกัน ตรวจ focused create/publish/shared-detail journey **1 PASS** และ typecheck/build PASS ดู [latest alignment manifest](evidence/time-alignment/manifest.json) และ [full regression manifest](evidence/overview/manifest.json); ผลรอบก่อนเก็บเป็น historical evidence

FR-03–05, FR-08 เฉพาะ own event list และ AC-06–11 implement แล้ว รอ teammate review/integration/release ไม่อ้าง Product DoD ของ Sprint 1 ทั้งระบบ

## TDD และผลรัน

เขียน integration tests ก่อน Event module และ browser tests ก่อน UI/App composition โดยใช้ PostgreSQL จริงและ Login/session/CSRF จริง:

| Run | ผล / หลักฐาน |
|---|---|
| API RED ก่อน implement | 8 tests FAIL ตาม behavior ที่ยังไม่มี: create/read/publish ได้ ROUTE_NOT_FOUND, auth/role matrix ไม่ผ่าน และไม่มี row lock; [api-red.log](evidence/api-red.log) |
| API GREEN หลัง implement | 8 tests PASS; [api-green.log](evidence/api-green.log) |
| UI RED ก่อน UI composition | 5 tests FAIL: ไม่มี owner navigation/list loading/RegistrationAction; [ui-red.log](evidence/ui-red.log) |
| ก่อน audit `npm test` | 64 PASS: Event integration 10, Auth integration 31, existing unit 23; historical [tests-green.log](evidence/tests-green.log) |
| ก่อน audit browser | 13 PASS: Auth regression 7 + Event/composition 6; historical [ui-green.log](evidence/ui-green.log) |
| Full regression ก่อนเปลี่ยนลำดับ: `npm.cmd test` | **74 PASS, 0 FAIL/SKIP**, native exit 0: Event integration 14, Auth integration 31, existing unit 23 + Event model unit 6; [schedule-ui/tests-green.log](evidence/schedule-ui/tests-green.log) |
| Full regression ก่อนเปลี่ยนลำดับ: `npm.cmd run test:e2e` | **22 PASS, 0 FAIL/SKIP**, native exit 0: Auth regression 7 + Event/composition/audit 15 รวม date/time split, timezone panel, minute increment และ responsive centered form; [schedule-ui/ui-green.log](evidence/schedule-ui/ui-green.log) |
| ก่อน overview: focused browser `-g 'Organizer creates'` | **1 PASS, 0 FAIL/SKIP**, native exit 0; ตรวจลำดับ DOM/visual บน desktop/mobile และ create→preview→publish→shared detail; [schedule-order/ui-green.log](evidence/schedule-order/ui-green.log) |
| ล่าสุด full `npm.cmd test` หลัง overview | **74 PASS, 0 FAIL/SKIP**, native exit 0; [overview/tests-green.log](evidence/overview/tests-green.log) |
| ล่าสุด full `npm.cmd run test:e2e` หลัง overview | **26 PASS, 0 FAIL/SKIP**, native exit 0: Auth 7 + Event/composition/audit 15 + overview 4; [overview/ui-green.log](evidence/overview/ui-green.log) |
| ล่าสุด focused browser หลังปรับความกว้าง `-g 'Organizer creates'` | **1 PASS, 0 FAIL/SKIP**, native exit 0; ตรวจตำแหน่ง/ความกว้าง date/time ทั้งสามแถวบน desktop/mobile และ create→publish→shared detail; [time-alignment/ui-green.log](evidence/time-alignment/ui-green.log) |
| `npm run db:generate` | PASS, Prisma 7.10.1 สร้าง client จาก shared schema |
| `npm run db:migrate:test` | PASS, test DB มี auth/registration_extension แล้ว ไม่มี pending migration |
| ล่าสุด `npm.cmd run typecheck` | PASS server/client/tools; [time-alignment/typecheck.log](evidence/time-alignment/typecheck.log) |
| ล่าสุด `npm.cmd run build` | PASS client/server; [time-alignment/build.log](evidence/time-alignment/build.log) |
| Compiled smoke รอบ overview | PASS 3 assertions (SPA, DB health/version, unknown API JSON 404); [overview/built-smoke.log](evidence/overview/built-smoke.log) |

หลัง initial GREEN เพิ่ม assertions เรื่อง system fields, EmptyInput/input-scope precedence, sorting ties, read deadline equality และ concurrent committed snapshot แล้วรัน regression ใหม่เป็น 64 tests Browser final เพิ่มการรอ refresh จบจริง และ transient refresh failure ในทั้งสาม RegistrationAction states

รอบก่อน audit พบ publish/refresh race จึงเพิ่ม browser test ให้ delayed DRAFT response กลับมาหลัง publish สำเร็จ ได้ RED ที่ expected PUBLISHED หาย ([publish-refresh-red.log](evidence/publish-refresh-red.log)) แล้วแก้ generation ของ reads เมื่อ publish เริ่ม/สำเร็จ GREEN 13 browser tests ของรอบนั้นรวม regression นี้ ต่อมา audit เพิ่ม coverage และแก้ปัญหาอีกชุดตาม [audit record](audit.md) เป็นผลล่าสุด 74/22

UI follow-up ตาม feedback ผู้ใช้: เปลี่ยน native datetime-local จาก step=0.001 เป็น 60 วินาที ให้เลือกวัน/ชั่วโมง/นาที และจัด form max-width 800px กึ่งกลางแนวนอน เพิ่ม assertions ใน journey เดิมก่อนแก้ ได้ [RED](evidence/form-ui/ui-red.log) ว่า center เยื้อง 158px และ increment ได้ .001 วินาที แล้ว [GREEN](evidence/form-ui/ui-green.log) ตรวจ increment หนึ่งนาทีทั้งสามช่อง, center บน desktop/mobile และไม่เกิด horizontal overflow จำนวน runner cases ยัง 22 เท่าเดิม ภาพ [desktop](evidence/form-ui/desktop.png) / [mobile](evidence/form-ui/mobile.png) มาจาก journey ที่ทดสอบ validation; API ยังคงรับ fractional 0–3 หลักและคืน UTC millisecond ตาม BR-14

Layout follow-up ตามภาพอ้างอิงผู้ใช้: แยก native date/time inputs ในแต่ละแถว เริ่ม/สิ้นสุดอยู่ซ้าย และ GMT+07:00/กรุงเทพมหานคร/Asia/Bangkok อยู่ขวา โดยคงสีเขียว/ขาว วันปิดรับอยู่แถวล่าง มือถือย้าย timezone ลงใต้สองแถวแรก `EventSchedule.tsx` รวม date/time เป็น Bangkok wall time ก่อน validation/ส่งผ่าน API เดิม [RED](evidence/schedule-ui/ui-red.log) ยืนยันว่าเดิมไม่มี date input แยก จากนั้น full browser รอบแรก 21 pass/1 fail จากการอ่าน bounding boxes คนละครั้งระหว่าง native focus scroll ([attempt](evidence/schedule-ui/ui-first-attempt.log)); แก้ test ให้อ่านตำแหน่งคู่กันใน DOM snapshot เดียว แล้ว full [GREEN](evidence/schedule-ui/ui-green.log) 22 pass รวม UTC serialization/readback และ late-create abort journey ภาพ [latest desktop](evidence/schedule-ui/desktop.png) / [latest mobile](evidence/schedule-ui/mobile.png) เป็นสถานะใน validation journey

Organizer overview ตามภาพอ้างอิง: เพิ่ม `/organizer` เป็น optional presentation ของ own event list ภายใต้ F-02/FR-08 (own list) ใช้ API/schema/permission เดิม แสดง total ทุกสถานะรวม CLOSED, DRAFT เท่านั้น และ PUBLISHED เท่านั้น พร้อมสามรายการแรกตาม server own-list order ใช้การ์ดฉบับร่างแทนยอดผู้ลงทะเบียนในภาพเพื่อไม่เพิ่ม registration/attendance summary ของ F-05/F-09 Login ยังไป `/events`; shared/owner list/detail เดิมยังใช้ได้และ RegistrationAction ไม่เปลี่ยน

เขียน `tests/e2e/overview.spec.ts` ก่อน implement ได้ [RED 4 fail](evidence/overview/ui-red.log) จาก navigation/page ที่ยังไม่มี แล้ว full [GREEN 26 pass](evidence/overview/ui-green.log) รวม 4 tests ใหม่: (1) empty state/active nav/CTA และ mobile overflow (2) count/order/ownership จาก real Login/create/publish/own-list APIs บน PostgreSQL แยก owner B และตรวจ reload/focus/เส้นทางเดิม (3) loading/error/retry โดยไม่แสดง 0/empty ก่อนมีข้อมูล และ 401 ล้างข้อมูล (4) Participant ไม่มีเมนู overview และเข้าหน้าไม่ได้ Empty/loading/error cases ใช้ mocked owner-read response เฉพาะ UI; real-count test ใช้ DB จริงและไม่ reset fixtures จึงมีจำนวนสะสมจากการทดสอบก่อน ตัวเลขในภาพไม่ใช่ข้อมูลฐานแอป ภาพ [empty desktop](evidence/overview/empty-desktop.png), [empty mobile](evidence/overview/empty-mobile.png), [populated](evidence/overview/populated.png) ตรวจแล้ว

## AC / STS actual coverage

Alignment follow-up: ลบการขยายช่องปิดรับลงทะเบียนเต็มแถว และให้ timezone อยู่ขวาครอบทั้งสามแถวเพื่อให้ date/time ทุกแถวมีตำแหน่ง/ความกว้างเดียวกัน เพิ่ม geometry assertions ใน journey เดิม ได้ [RED](evidence/time-alignment/ui-red.log) ว่าความกว้างต่างกัน 184px แล้ว [GREEN](evidence/time-alignment/ui-green.log) ทั้ง desktop/mobile ภาพ [desktop](evidence/time-alignment/desktop.png) / [mobile](evidence/time-alignment/mobile.png) รอบนี้เปลี่ยนเฉพาะ markup/CSS จึงตรวจ focused journey/typecheck/build โดยไม่ rerun full 74/26 suite

Order follow-up: เรียงช่องเป็นปิดรับลงทะเบียน → เริ่มกิจกรรม → สิ้นสุดกิจกรรม ทั้ง DOM order และ visual order บน desktop/mobile โดย timezone อยู่ข้างแถวเริ่ม/สิ้นสุดบน desktop และอยู่หลังทั้งสามแถวบน mobile เพิ่ม assertion ใน journey เดิมก่อนแก้ ได้ [RED](evidence/schedule-order/ui-red.log) แล้ว [GREEN](evidence/schedule-order/ui-green.log); รูป [desktop](evidence/schedule-order/desktop.png) / [mobile](evidence/schedule-order/mobile.png) รอบนี้เปลี่ยนเฉพาะ markup/CSS order จึงรัน focused journey/typecheck/build โดยไม่ rerun full 74/22 suite

| AC / TEST | Actual assertion |
|---|---|
| AC-06 / TEST-07 | API สร้าง normalized DRAFT owner จาก session ตรวจ DB/readback; browser สร้างแล้ว reload owner detail |
| AC-07 / TEST-08 | required ทุก field, strict string/integer types, unknown/system fields, Unicode code-point max/max+1, blank trimmed, capacity 0/-1/fraction/1001/string/boolean และ valid 1/1000, malformed/non-JSON/non-object; invalid ไม่ insert |
| AC-07,11 / TEST-08,36 | timestamps offset Z/+07:00, fractional 0–3 หลัก, reject >3/missing offset/invalid calendar/time/offset; closes=starts allowed, ends=starts rejected, past DRAFT allowed, UTC millisecond output |
| AC-08 / TEST-09,10 | owner publish และ shared visibility, PUBLISHED/CLOSED ทั้งก่อน/ที่/หลัง deadline ได้ INVALID_TRANSITION ก่อนเวลา; DRAFT deadline -1ms ผ่าน, equality/+1ms ไม่ผ่านและ DB/status/updated_at คงเดิม |
| AC-08 / TEST-10 lock | connection แยกถือ Event lock รอให้ pg_stat_activity ยืนยัน backend รอ lock แล้วเลื่อน injected server clock ถึง deadline ก่อนปล่อย lock ได้ DEADLINE_PASSED; concurrent publish สำเร็จครั้งเดียว |
| AC-09 / TEST-11 | shared ไม่คืน DRAFT (detail 404) และตรวจ exact SharedEvent fields; owner list เฉพาะตน; shared starts_at ASC/id ASC และ owner created_at DESC/id ASC พร้อม ties; ACTIVE จริง, CANCELLED exclusion, full/closed/expired availability |
| AC-09 / TEST-11 snapshots | separate concurrent writer ทำ capacity/Registration commits แบบ atomic สลับ (capacity=1,count=0)/(capacity=2,count=1); 16 detail/list read cycles ต้องคง available=1 และ fields/counts สอดคล้องกัน |
| AC-10 / TEST-12,13 | anonymous ทุก protected route 401; Participant owner routes 403; owner อื่น detail/publish 404; UUID/path/EmptyInput/spoof fields 400; missing/wrong CSRF/cross-origin 403; auth→role→CSRF→input→scope; rejected requests ไม่เปลี่ยน event |
| AC-11 / TEST-14 | browser field validation, pending create ปิดปุ่ม, list loading/empty/error/retry, missing detail, past DRAFT publish conflict; UI จริงใช้ test DB ไม่มี mock ใน create→preview→publish→shared detail journey |
| AC-11 / TEST-36 | read registration_open ด้วย server clock -1ms/equality/+1ms; browser ป้อน Bangkok 2099-01-02 00:30 แล้ว API คืน 2099-01-01T17:30:00.000Z และ UI แสดง 2 ม.ค. 2642 00:30 + Asia/Bangkok |
| F-02/#3 composition | 3 browser tests pending/success/uncertain อยู่ครบระหว่าง slow focus refresh, manual refresh จน response จบ และ failed refresh; ไม่มี automatic mutation retry |

Actual files: `server/tests/integration/events.test.ts`, `client/src/features/events/model.test.ts`, `tests/e2e/{events,events-audit}.spec.ts`; Auth regression อยู่ไฟล์เดิม ไม่มีเปลี่ยน expectations เพื่อให้ผ่าน Audit เพิ่ม exact OwnerEvent field assertions, negative-offset/leap-day normalization ทุก timestamp field, current-role/inactive/expiry/rotated-CSRF และ app-recreation persistence

## Environment / ข้อจำกัด

- Node 22.16.0, Windows/PowerShell, dependencies จาก lockfile เดิม ไม่มีติดตั้ง/อัปเกรด package
- API/DB tests ใช้ `readTestDatabaseUrl` ที่บังคับชื่อ `loungcheu_test`; ใช้ injected fixed t0=2026-11-06T03:00:00.000Z สำหรับ domain boundaries, network/session จริง ไม่มี runtime auth bypass
- test migrations เคย apply foundation ไว้แล้ว Source ตรง Git blob ของ #3 ทุก byte (LF); applied checksum ตรงกับเนื้อหาเดียวกันเมื่อ checkout เป็น CRLF ตาม core.autocrlf=true ของเครื่อง (raw hashes ทั้งสองแบบอยู่ใน manifest) การตรวจ raw LF hash ครั้งแรกไม่ตรงจึงตรวจแยก line endings และยืนยันได้ว่าไม่มีเนื้อหาต่าง ไม่แก้ migration/DB history ไม่มี reset/drop ฐานแอปหรือฐานทดสอบ Event integration cleanup เฉพาะ fixture ids ของ suite; browser fixtures อยู่ใน test DB
- sandbox ทำให้ tsx ล้ม `uv_os_get_passwd ENOMEM`; migrate/browser จึงรันนอก sandbox หลังได้รับ approval นี่เป็น environment attempt ไม่ใช่ business-rule RED
- พอร์ต 5173 มีแอปเดิมใช้อยู่ จึงใช้ `$env:E2E_WEB_PORT='5183'; $env:E2E_API_PORT='3011'` ก่อน `npm run test:e2e` โดยไม่หยุดแอปเดิม Default config ยังคง 5173/3001
- Windows npm.ps1 เคยกิน flag `-g` ทำให้ focused test ไม่ได้เริ่ม (npm child server error); เปลี่ยนใช้ npm.cmd ส่วน stderr NO_COLOR warnings ทำให้ PowerShell/Tee wrapper อาจรายงาน failure แม้ tests ผ่าน จึงบันทึก `$LASTEXITCODE` ของ native npm.cmd โดยตรงใน final browser log
- 3 RegistrationAction composition tests mock เฉพาะ SharedEvent/registration responses เพื่อทดสอบ lifecycle ของ host ใช้ Login จริง; **ไม่ได้ทดสอบ backend #3 ร่วมกัน** backend Registration ยังต้องรวมจากเพื่อน ดู [integration](integration.md)
- Audit จำลอง network/late responses/403/404/401 เพื่อทดสอบ UI โดยใช้ real Login/session และ real create/publish เมื่อทดสอบ mutation success ไม่ใช้ mock เพื่ออ้างว่า backend permission ถูกต้อง ส่วน backend permission/validation/transaction ใช้ real PostgreSQL API integration แยกต่างหาก
- มี automated Chromium journey และ screenshots: [latest owner detail](evidence/audit/owner.png), [latest shared detail](evidence/audit/shared.png) จาก final audit run (ต้นฉบับ `.local/verification/events-{owner,shared}.png`; ภาพเดิมก่อน audit ยังอยู่ evidence/owner.png และ shared.png) ยังไม่มี independent manual UAT, mobile/browser matrix, clean-machine reproduction, process restart persistence หรือ release/deploy test; reload/createApp recreation ไม่ใช่ process restart proof
- Historical RED/attempts คงไว้ Final GREEN ไม่เปลี่ยนสถานะงาน #3/#4/#5 ที่ยังไม่ได้รวม และไม่อ้าง full Sprint 1 acceptance ผ่าน
