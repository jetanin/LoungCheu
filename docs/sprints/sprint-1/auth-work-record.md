# Issue #1 — Authentication / F-01 work record

เริ่มงาน 6 พฤศจิกายน 2026 (Asia/Bangkok); contracts/STS baseline v0.5

GitHub check ก่อน coding: [PR #5](https://github.com/jetanin/LoungCheu/pull/5) author i3artuf, approved by jetanin ที่ `f5339b9` ([substantive review](https://github.com/jetanin/LoungCheu/pull/5#pullrequestreview-5789144536)), merged `5395942` เมื่อ 00:26:37; remote staging ตรงเครื่อง ไม่มี open PR ที่พบ Issue #1 open ไม่มี body หรือ assignee ส่วน branch `feature/auth` เริ่มที่ `5395942` และยังไม่ได้ push

## Scope สำหรับ Issue #1 / PR

- F-01 / FR-01–02, BR-06–07, NFR-01–02,06; [AC-01–05 / contract](contracts.md#f-01--authentication-identity-และ-logout), [TEST-01–06 / STS](sts.md)
- Setup npm workspaces, React/TypeScript/Vite/Bootstrap, Express/TypeScript, PostgreSQL/Prisma, pinned dependencies/lockfile, safe config และ versioned migrations
- Synthetic/idempotent user seed (PA/PB/PC/OA/OB/IX); demo password จาก private environment เท่านั้น
- Salted scrypt; pre-auth CSRF; Login regenerate session; /me อ่าน user/role/is_active จาก backend; fixed 2h expiry; Logout destroy/clear cookie
- Login UI, identity/role, pending/errors, refresh/logout/expired-session private-state clearing
- Unit/API integration ใช้ PostgreSQL จริง; browser E2E แยกจาก server expiry proof

F-02–05, registration domain/concurrency, integrated release และ teammate clean reproduction ยังอยู่นอกผลส่งมอบของ #1; ไม่ปิด Issue/ย้าย Done จนผ่าน DoD/review/release

## Test/evidence identification

ผลจริงและ logs อยู่ใน [auth evidence](../../deliverable-1/evidence/auth/README.md) ผลที่รันกับ working tree ต้องระบุ parent commit และ SHA256 manifest; ห้ามเรียก parent commit ว่า tested implementation commit เพราะโค้ดยังไม่ commit

Consistency review หลัง app DB migration: source/config ทั้ง 45 ไฟล์ตรงกับ latest `local-db-migrated` manifest, local Markdown targets ครบ, private env ยังถูก Git ignore และไม่มี root runtime/template ซ้ำ รอบนี้แก้เฉพาะเอกสารเรื่อง template placeholders/สถานะ browser suite และชี้แจงว่า STS บังคับแยก test database แต่ไม่บังคับแยก PostgreSQL instance/port 55432; ไม่ได้ rerun tests และไม่ได้ย้าย DB ผลรันล่าสุดยังอ้าง logs เดิม 54 unit/API + 7 browser PASS

TDD เก็บ source ของ auth guard ก่อน/หลัง พร้อม intended expiry assertion, command, exit code และ red/green logs ส่วน setup/compiler/environment failures เก็บแยก ไม่ใช่ business-rule red

ตรวจซ้ำก่อน PR เมื่อ 6 พ.ย.: แก้ stale session response, JSON charset error, DB URL/test-target validation, SPA fallback ใน hidden directory, expired session cleanup และ fixture isolation พร้อมผลแดงก่อนแก้และผลเขียวล่าสุด ดู [pre-PR review](auth-pre-pr-review.md); unit/API 54 PASS, browser 7 PASS, build/typecheck/compiled smoke PASS และ clean dependency install ตรวจแล้วโดย Codex (ยังไม่ใช่ teammate reproduction)

## Review/release ที่ยังต้องทำ

ผู้ใช้สั่งใช้ PostgreSQL instance 5432 เดียว: สร้าง/migrate `loungcheu_test`, เปลี่ยน private `.env.test`, รัน 54 unit/API + 7 browser cases และ app/built smoke ผ่านแล้ว หยุด cluster 55432 โดยเก็บ data directory/old config ไว้ และ fingerprint ยืนยัน User rows ทั้ง 6 ในฐานแอปไม่เปลี่ยน ดู [single-instance record](single-instance-db.md)

ผู้ใช้ยืนยันเปลี่ยน layout เป็น `server/client` และใช้ app DB `loung-cheu-database` ของตนเอง References/scripts/lockfile/docs เปลี่ยนตามแล้ว หลังผู้ใช้แก้ private connection และสั่งรัน migration/testing: migrate/seed สำเร็จบน `localhost:5432`, local app smoke ผ่าน health/Login/Identity/Logout สอง role และลบ root `.env.example` ที่ซ้ำแล้ว ดู [layout/local DB record](server-client-local-db.md) ส่วน test DB ยังคงแยกต่างหาก

Issue #1 ยังไม่มี confirmed assignee; assignments ใน sprint plan เป็นข้อเสนอ ยังไม่ได้ส่งข้อความหรือแก้ GitHub Issue/PR จากรอบนี้ Feature PR ต้อง target `sprint-1-staging`, แนบผลทดสอบจริง/limitations, ให้ teammate review ตาม DoD ก่อน merge และ release เข้า main ไม่มีการอ้าง AI review เป็น teammate approval
