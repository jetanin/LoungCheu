# Issue #2 + #3 — integration / consistency verification

**Historical integration record:** ผล 140/29 ด้านล่างเป็นก่อน re-audit; ผลปัจจุบัน **141 Vitest / 32 Chromium** และ source manifest ดู [consistency review](consistency-review.md) ข้อความ/manifest เดิมเก็บเพื่อยืนยัน source/results ของรอบนั้น ไม่ใช่ source ปัจจุบัน

## Historical — initial #2/#3 merge verification

6 พฤศจิกายน 2026 (Asia/Bangkok) · `feature/events` · merge working tree: HEAD `04106ff` + incoming `sprint-1-staging@ada659b` (Registration ผ่าน PR #7 ตาม local Git) ยังไม่มี merge commit และไม่มี commit/push/GitHub write โดย Codex รอบนี้

## การแก้ conflict และขอบเขต

- `client/src/app/App.tsx`: ใช้ Auth/session epoch, navigation และ EventPage/EventOverview ของ #2; shared detail render RegistrationAction ของ #3 โดยตรง ไม่เพิ่ม RegistrationPage อีกชุดใน route เดียวกัน
- `server/src/app.ts`: mount Event router และ Registration router ร่วมกันหลัง Auth routes และก่อน unknown-API fallback ใช้ session/current role/CSRF/error envelope/clock เดียวกัน
- `docs/traceability.md`: เก็บผล F-02 และ F-03 ทั้งคู่ แยก actual coverage ออกจาก F-04/F-05 ที่ยังไม่มี
- schema และ `202611060002_registration_extension` คงเนื้อหา/ชื่อจาก shared foundation ไม่มี migration ใหม่ ไม่มีแก้ migration ที่ apply แล้ว RegistrationAction/API/service/rules และ host tests ของ #3 คง implementation เดิม

My Registrations/own GET และ roster เป็น **Issue #4 (F-04/F-05)** ยังไม่รวม ลิงก์ `/my/registrations` ใน success/uncertain/duplicate action ยังเป็น dependency นี้ ไม่อ้างว่า full Sprint 1 journey หรือ Product DoD ผ่าน

## Consistency findings และ TDD

| Finding | ก่อนแก้ / expected | การแก้และหลักฐาน |
|---|---|---|
| Form field errors ค้างหลังแก้ค่า | aria-invalid ยัง true; ควรตรวจค่าปัจจุบันรวม time ordering | หลัง submit ครั้งแรก revalidate เมื่อแก้ค่า โดยไม่ล้าง mutation/uncertain warning; consistency.spec.ts ผ่าน |
| API ปฏิเสธ ISO timestamp ระดับนาทีพร้อม offset | 400 แทน 201 เช่น `2028-02-29T00:30+07:00` | อนุญาต HH:mm และ optional :ss[.SSS]; offset ยัง required, ไม่มี fractional minutes/เกิน 3 digits; output UTC :ss.SSSZ |
| NUL / unpaired UTF-16 surrogate | 500 หรือ driver แทนตัวอักษรเงียบ ๆ | client/server ปฏิเสธด้วย field error/400 INVALID_INPUT ก่อน DB; Thai/paired emoji ผ่าน ไม่เปลี่ยน BR-01 length limits |
| CLOSED totals และ late overview read หลัง 403 | ต้องนับ CLOSED ใน total แต่ไม่ใช่ PUBLISHED; response เก่าต้องไม่คืน private data | เพิ่ม assertions; พฤติกรรมเดิมผ่าน ไม่เปลี่ยน implementation |

เขียน tests ก่อนแก้: [validation-red.log](evidence/combined-integration/validation-red.log) บน combined code ก่อนแก้ input/model: **5 failed / 20 passed** (2 API + 3 client cases) สำหรับสองบั๊ก validation ข้างต้น ส่วน [ui-red.log](evidence/combined-integration/ui-red.log) จาก isolated export ของ `04106ff` ก่อนเริ่ม merge: **1 failed / 1 passed** แสดง stale form error และ overview case ที่ผ่านอยู่แล้ว ไม่ใช่ environment failure และไม่มี TDD commits แยก

## ผลรันจริงล่าสุด

| Command | Actual result / evidence |
|---|---|
| `npm.cmd run db:generate` | PASS Prisma 7.10.1; [log](evidence/combined-integration/generate.log) |
| `npm.cmd run db:migrate:test` | PASS: 2 migrations, no pending migrations; เฉพาะ loungcheu_test; [log](evidence/combined-integration/migrate-test.log) |
| `npm.cmd run typecheck` | PASS server/client/tests/tools; [log](evidence/combined-integration/typecheck.log) |
| `npm.cmd run build` | PASS Vite client + TypeScript server; [log](evidence/combined-integration/build.log) |
| `npm.cmd test` | **11 files / 140 passed / 0 failed/skipped**, native exit 0; [log](evidence/combined-integration/vitest.log) |
| `npm.cmd run test:e2e` | **29 passed / 0 failed/skipped**, 37.9s, native exit 0; Chromium ports 5183/3011; [log](evidence/combined-integration/e2e.log) |
| `npm.cmd run test:built` | **3 passed**, production build SPA/health/unknown-API checks; [log](evidence/combined-integration/built-smoke.log) |

`npm test` รวม Auth 31, Event integration 17, Registration integration 17 และ existing unit/client component tests ทั้งหมด (รวม 140) ใช้ real PostgreSQL/Login/session/CSRF การแข่งที่นั่ง/duplicate และ clock หลัง row lock ยังคง tests เดิมของ #3 ไม่ mock DB/transaction

เพิ่ม API composition test ใน `events.test.ts`: create DRAFT → shared404 → publish → register → read DB reference/session owner/time → duplicate409/full409 → recreate createApp ด้วย DB เดิม → owner/shared list/detail คืน capacity=1/ACTIVE=1/available=0/open=false และ record/reference เดิม ไม่ใช่การ restart OS process

เพิ่ม `tests/e2e/events-registration.spec.ts`: Organizer สร้าง/publish จริง Participant A/B เปิดก่อนที่นั่งเต็ม ส่ง registration ไป real service/DB โดยถือเฉพาะ HTTP response ไว้ ตรวจ focus refresh ระหว่าง pending แล้วปล่อย success/reference จากนั้น manual/focus refresh คง success และ POST เพียงครั้งเดียว B ลงทะเบียนจาก stale page ได้ EVENT_FULL พร้อม availability ใหม่ A duplicate API ได้ ALREADY_REGISTERED และ owner/shared counts ตรงกันหลัง reload ดู [success screenshot](evidence/combined-integration/registration-success.png)

Browser รวม Auth 7 + Event/audit/overview/composition เดิม 19 + consistency 2 + real integrated journey 1 รูป [corrected form](evidence/combined-integration/validated-form.png) ใช้ date/time เรียงปิดรับ → เริ่ม → สิ้นสุด กึ่งกลางและ timezone ตามเดิม 3 lifecycle tests เดิมยังจำลอง pending/success/uncertain เพื่อทดสอบ network ambiguity; real combined test แยกยืนยัน backend จริง ไม่อ้าง own registrations page ว่าใช้งานได้

## Environment และข้อจำกัด

Windows/PowerShell, Node 22.16.0, npm 11.11.0, PostgreSQL 17.6; lockfile รวม dependencies ของ #3 (RTL/jsdom มีติดตั้งอยู่แล้ว) ไม่อัปเกรด dependencies ในรอบนี้ ดู [source manifest](evidence/combined-integration/manifest.json) สำหรับ working-tree SHA256 และ merge parents SHA ของ parent เพียงอย่างเดียวไม่ระบุ source ที่ทดสอบ

ใช้ฐาน `loungcheu_test` แยกจากแอปเท่านั้น ไม่ reset/drop/migrate/seed ฐานแอป ชุด Vitest และ browser รันตามลำดับเพื่อไม่ให้ seed/session ทับกัน API suite cleanup เฉพาะ fixtures; browser fixtures คงใน test DB ไม่มีการหยุด dev server เดิม

Migrate/Chromium รันนอก sandbox ตามสิทธิ์ที่อนุมัติ เนื่องจาก tsx user lookup บน Windows; NO_COLOR/FORCE_COLOR และ PowerShell stderr wrapper เป็น warnings ดู native exit code 0 ไม่ใช่ test failure Logs แปลงเป็น UTF-8/LF และตัด trailing whitespace โดยคงข้อความผลรัน UI RED มาจากสำเนา F-02 ส่วน GREEN ทั้งชุดมาจาก merge working tree ปัจจุบัน

ยังไม่ได้ทำ independent Chrome/manual UAT, process restart/redeploy persistence, clean-machine teammate reproduction, own-list/roster journey, teammate approval หรือ release CI/main Git state ยังคง merge pending commit ตามคำสั่งผู้ใช้

AI assistance: Codex ตรวจ conflicts/spec/source, เขียน regression tests/แก้ validation/composition และอัปเดตผลที่รันจริง ไม่ใช่ teammate acceptance
