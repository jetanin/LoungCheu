# Historical — Registration PR description ก่อนรวม #2

ข้อความด้านล่างเป็น snapshot ของ #3 ก่อน Event integration ผลปัจจุบันของ feature/events merge working tree (04106ff + ada659b) คือ 141 Vitest / 32 Chromium PASS รวม real create/publish/register journey ดู [combined record](../events/consistency-review.md) Issue #4/teammate review/release ยัง pending

เพิ่ม Registration เป็น extension ของ staging `6e8a24c` โดยใช้ Authentication/session/CSRF, React app shell, API client, Prisma naming และ package scripts ของเพื่อนเป็นฐาน ผู้เข้าร่วมที่ Login จริงลงทะเบียนผ่าน transaction ที่ lock Event ก่อนตรวจ deadline → duplicate → capacity จน commit

Refs #3 — FR-06, AC-12–17, TEST-15–21, BR-03–07/10/14

## Changes

- Mount registration router/service ใน createApp เดิม ใช้ requireAuth/requireRole/CSRF เดิม ไม่มี runtime auth bypass หรือ app harness แยก
- คง auth migration/User/users แล้วเพิ่ม migration ต่อสำหรับ Event foundation/Registration ด้วย camelCase ORM และ snake_case DB
- Registration UI อยู่ใน App ของเพื่อนและ reuse client/src/lib/api.ts; loading/conflict/availability/network-timeout/account isolation
- เก็บฐาน Docker legacy ไว้ ใช้ app/test databases แยกบน instance เดียวกับ scripts ของ staging

## Validation

- db:generate/typecheck/build: passed
- npm test: 110 passed รวม auth suite เดิมและ Registration กับ real Login/cookies/CSRF บน PostgreSQL Docker
- test:built: 3 passed; test:local-db: passed
- test:e2e: 7 passed (auth browser regression ของเพื่อน)
- Dependency audit: 0 vulnerabilities
- Browser regression/attempts และผลล่าสุด: docs/registration/verification.md

## Remaining integration

Event Management (#2) ยังไม่มีใน staging ชุดนี้ จึงยังรอ event read/create/publish/list APIs และต้องประสาน Event schema foundation กับเจ้าของ #2 ส่วน Registration Views (#4) เป็นงานถัดไป Complete UI journey/restart/teammate review/release ยังไม่อ้างผ่าน จึงใช้ Refs #3 แทนปิด Issue อัตโนมัติ

Merge resolution/ผลทดสอบยังเป็น working tree ให้เติม commit จริงหลังผู้ใช้ stage/commit/rerun checks
