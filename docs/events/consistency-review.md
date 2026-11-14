# Consistency re-audit — Auth / Events / Registration

6 พฤศจิกายน 2026 (Asia/Bangkok) · `feature/events` merge working tree: HEAD `04106ff` + MERGE_HEAD `ada659b` ไม่เหลือ conflict ไม่มี commit/push รอบนี้ ผลเดิม 140 Vitest / 29 Chromium อยู่ใน [historical combined record](combined-integration.md); ผลปัจจุบัน **141 Vitest / 32 Chromium PASS** อ้าง [working-tree manifest](evidence/consistency-review/manifest.json)

## ขอบเขตที่ตรวจ

เทียบ SRS FR-01–06/FR-08 เฉพาะ own Event list, BR-01–07/09–11/14 และ AC-01–17 ที่ implement ใน #1–#3 กับ contracts/STS/traceability ตรวจ App/Login/EventPage/EventForm/EventOverview/EventSchedule/API clients, Auth/session/role/CSRF/error handler, Event input/router/service, Registration router/rules/service, schema/migrations, startup/config/scripts และ current documentation summaries ไม่พบ AGENTS.md ที่เกี่ยวข้อง ไม่ใช่ acceptance ของ F-04/F-05 หรือ Sprint 2/3 ที่ยังไม่ implement

## Findings → fixes (tests ก่อนแก้)

| ID / severity | ก่อนแก้ / ผลที่ต้องได้ | การแก้ / regression |
|---|---|---|
| C-01 / high | Event read 401 เก่าถูก generation guard ทิ้งเมื่อ refresh ใหม่กว่าเจอ network error ทำให้ private Event ยังแสดงทั้งที่ session ถูกยกเลิก | EventPage รับ definitive 401 ของ mounted session ก่อน non-auth generation guard ล้าง data/invalidate reads/publish scope แล้วกลับ Login; mounted guard กัน response ของบัญชีเก่ากระทบบัญชีใหม่ |
| C-02 / medium | Event strings 120/2000/200 code points ถูกต้อง แต่ JSON surrogate escapes ใช้ ~28 KiB เกิน parser 16 KiB ได้ 400 แทน 201 | ใช้ JSON parser helper เดิมที่มี content-type/strict/error checks กับ Event budget 32 KiB; Auth คง 16 KiB, Registration คง 1 KiB; ไม่เพิ่ม length/type allowance ตาม BR-01 |
| C-03 / medium | non-empty username ที่มี NUL ทำให้ DB query ตอบ 500 แทน generic INVALID_CREDENTIALS | username แบบนี้เป็น unknown account เพราะ PostgreSQL TEXT เก็บไม่ได้ ไม่ query ค่านี้ แต่ยัง verify password กับ dummy scrypt hash และคืน 401 ข้อความเดียวกับ wrong/unknown/inactive ไม่สร้าง authenticated session |

ไม่มีการแก้ RegistrationAction/api/service/rules ของ #3, schema หรือ migration ไม่เพิ่ม edit/close/cancel/check-in/own registrations/roster

TDD actual evidence:

- [API RED](evidence/consistency-review/api-red.log): **1 failed / 17 passed** — valid Unicode JSON escapes ได้ 400 แทน 201; ไม่ใช่ syntax/environment failure
- [Auth RED](evidence/consistency-review/auth-red.log): **1 failed / 30 filtered/skipped** ใน focused run — username NUL ได้ 500 แทน 401; full regression ด้านล่างไม่มี skipped
- [UI RED](evidence/consistency-review/ui-red.log): **2 failed** — owner/shared Event UI ค้างที่ detail หลัง received 401 เมื่อมี newer network failure
- GREEN รันทั้งชุดโดยไม่ลด assertions ของเดิม พร้อมเพิ่ม browser guard ว่า late Event read 401 ของ Organizer A ไม่ทำให้ Organizer B ที่ Login แล้วหลุด ไม่มี red/green commits แยก

## ผลทดสอบจริงล่าสุด

| Command | Actual / evidence |
|---|---|
| `npm.cmd test` | **11 files / 141 passed / 0 failed/skipped**, 23.86s, native exit 0; [log](evidence/consistency-review/vitest.log) |
| `npm.cmd run test:e2e` (ports 5183/3011) | **32 passed / 0 failed/skipped**, 45.7s, Chromium native exit 0; [log](evidence/consistency-review/e2e.log) |
| `npm.cmd run typecheck` | PASS server/client/tests/tools; [log](evidence/consistency-review/typecheck.log) |
| `npm.cmd run build` | PASS client Vite + server TypeScript; [log](evidence/consistency-review/build.log) |
| `npm.cmd run test:built` | PASS 3 checks: compiled SPA, DB health/version, unknown-API JSON; [log](evidence/consistency-review/built-smoke.log) |
| Prisma generation / test migration | **ไม่ได้ rerun รอบนี้**: schema/migration ไม่มีเปลี่ยน, hashes ตรง shared incoming #3; รอบรวมเดิม generate/migrate:test PASS มี 2 migrations/no pending ดู [previous results](combined-integration.md) |

Vitest ประกอบด้วย Auth integration 31 (เพิ่ม NUL cases ใน generic-error test เดิม), Event integration 18, Registration integration 17 และ existing server/client unit/component 75 รวม 141 PostgreSQL จริงทั้งหมดที่อ้าง API/DB ใช้ Login/session/CSRF ไม่มี auth bypass E2E เพิ่ม 3 cases จากเดิม 29: owner/shared received-401 precedence และ old-account read guard

Regression เดิมยังผ่าน: strict required/type/trimmed Unicode lengths/capacity/time; DRAFT visibility/ownership/CSRF/Origin; server sorting/exact response fields; publish status-before-deadline/equality/post-lock clock/concurrent publish; ACTIVE-only counts/availability จาก committed snapshot; registration duplicate/full/deadline/last-seat races; real create→publish→register/reference/count journey; pending/success/uncertain คงอยู่ระหว่าง refresh/focus รวม transient error; centered form/date-time order/timezone และ responsive checks เดิม

## Code / spec / document consistency

- Event → Registration lock order เดียวกัน; row locks/clock/rejections และ return หลัง commit คงเดิม Owner มาจาก session; shared เฉพาะ PUBLISHED/CLOSED ไม่มี roster/private fields
- Input offset/fraction/ordering และ UTC millisecond output ตรงกัน; UI ป้อนเวลาระดับนาทีและตีความ Asia/Bangkok โดยไม่ใช้ host timezone Length นับ Unicode code points หลัง trim; valid JSON escaped representation ต้องอ่านกลับได้ครบ ไม่เปลี่ยนข้อความ/ปัด timestamp
- Auth/session epoch กับ mounted Event session rejection ใช้แนวเดียวกัน; stale non-auth reads ยังทิ้งตาม generation และ transient errors ยังไม่ unmount RegistrationAction
- ปรับ current README/features/SDS/contracts/STS/traceability/evidence register และ integration docs เป็น 141/32 โดยเก็บ original 140/29 และ F-02/#3 historical evidence พร้อมป้าย historical ไม่อ้าง parent SHA เป็น tested source ของ working tree

## Environment / limitations

Windows, Node 22.16.0, npm 11.11.0, PostgreSQL 17.6 บน `loungcheu_test` เท่านั้น ไม่ reset/drop/migrate/seed ฐานแอป ไม่หยุด dev server เดิม API/Vitest และ E2E รันตามลำดับเพื่อไม่ให้ test seed/session ทับกัน Chromium รันนอก sandbox ตามสิทธิ์ที่อนุมัติ Log warnings ของ NO_COLOR/FORCE_COLOR/PowerShell ไม่ใช่ assertion failure Logs แปลง UTF-8/LF และลบ trailing whitespace โดยคงเนื้อหาผลรัน

ไม่มี dependency/schema/migration เปลี่ยน จึงไม่ install/generate/migrate ซ้ำ Screenshot/UI assertions ชุดเดิม rerun ผ่าน แต่ไม่มี independent manual Chrome/UAT/browser matrix, OS process restart/redeploy หรือ teammate clean reproduction รอบนี้ ยังรอ **Issue #4 (F-04 My Registrations/own GET + F-05 roster)**; `/my/registrations` ยังเป็นลิงก์รอ implementation ไม่อ้าง full Sprint 1 acceptance, teammate approval หรือ release ผ่าน

AI assistance: Codex ตรวจ source/spec, เขียน regression ก่อนแก้ และรัน commands/อัปเดตเอกสารตามผลจริง ไม่ใช่ independent teammate review
