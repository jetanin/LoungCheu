# LoungCheu
CPE334-Project (Event Registration)

Issue #3 / F-03: atomic event registration ตาม documentation baseline v0.5 (อ่านจาก branch `docs/deliverable-1-baseline`, commit `f5339b9`)

โครงสร้างใช้ **client/** สำหรับ frontend และ **server/** สำหรับ backend ตามข้อตกลงทีม

| ส่วน | Stack |
|---|---|
| Frontend | React 19.2, TypeScript 5.9, Vite 8.3, Bootstrap 5.3 |
| Backend | Node.js, Express 5.3, TypeScript |
| Database | PostgreSQL 17 บน Docker, Prisma 7.10 + PostgreSQL adapter |
| Tests | Vitest 5.1, Supertest, React Testing Library; concurrency ใช้ PostgreSQL จริง |

พัฒนา/ตรวจบน Node 24.15.0, npm 11.11.0, PostgreSQL 17.11; dependency versions ถูก pin ใน package files/lockfile

## ขอบเขต branch นี้

- `POST /api/events/{id}/registrations`: role/input checks, event lock, deadline, duplicate, capacity และ persisted reference
- RegistrationAction และหน้า frontend `/events/{id}` สำหรับลงทะเบียน โดยอ่าน identity/event ผ่าน APIs ของ #1/#2
- Schema/migrations พื้นฐานตาม SDS, Docker databases แยก local/test, tests และหลักฐาน TDD

Authentication (#1) และ Event Management (#2) ยังเป็นงานเพื่อน: branch นี้ไม่มี login/session implementation, seed demo accounts หรือ create/publish/list APIs หน้า `/login`, `/events`, `/my/registrations` ต้องเชื่อมกับงานทีม; Registration Views (#4) เป็นงานถัดไป **ยังไม่ใช่แอปที่ทำ journey รวมได้ครบ**

## ติดตั้งและฐานข้อมูล

รัน PowerShell ที่ root ของ repository; ต้องมี Node >=22.12 และเปิด Docker Desktop ก่อน

```powershell
npm ci
npm run generate
docker compose --profile test up -d --wait
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env
npm run migrate -w server
```

`db`: `127.0.0.1:5432/loungcheu`, volume ถาวร `db-data`; `db-test`: `127.0.0.1:55433/loungcheu_test`, tmpfs แยกทิ้งได้เมื่อ container หยุด ต้อง migrate test DB ใหม่หลังเริ่มใหม่

ค่ารหัสผ่านใน Compose เป็นข้อมูลสังเคราะห์สำหรับ local เท่านั้น ถ้าเปลี่ยน `POSTGRES_PASSWORD`/`POSTGRES_PORT` ให้ปรับ `server/.env` ให้ตรง ห้ามใส่ secrets ของ backend ในตัวแปร `VITE_*`

## รัน frontend ด้วย Vite

```powershell
npm run dev
```

เปิด `http://localhost:5173` หรือ `/events/{event UUID}`; Vite proxy `/api` ไป `API_PROXY_TARGET` (ค่าเริ่มต้น `http://localhost:3000`) โดยคง Origin เพื่อให้ backend ตรวจ CSRF ได้ ตั้ง `APP_ORIGIN=http://localhost:5173` ใน auth backend ให้ตรงกับ origin ที่เปิดจริง

เมื่อ #1/#2 ยังไม่เชื่อม หน้า root เปิดได้ แต่หน้า registration จะแสดง error/retry หาก backend ไม่พร้อม ไม่มี mock login หรือ test identity ใน production entry

```powershell
npm run typecheck
npm run build
npm run preview
```

Frontend build อยู่ `client/dist` เพื่อให้ Express ของแอปรวม serve แบบ same-origin; backend module build อยู่ `server/dist` Preview ที่ port 4173 มี API proxy เช่นกัน และต้องตั้ง auth `APP_ORIGIN` ให้ตรงหากทดสอบผ่าน preview

## ทดสอบ

```powershell
npm test
$env:TEST_DATABASE_URL = 'postgresql://loungcheu:test_only@127.0.0.1:55433/loungcheu_test?schema=public'
$env:DATABASE_URL = $env:TEST_DATABASE_URL
npm run migrate -w server
npm run test:db
Remove-Item Env:DATABASE_URL
```

`npm test`: unit/HTTP boundary/React component tests; `npm run test:db`: API + persistence + lock-wait + last-seat/duplicate race ผ่านคนละ PostgreSQL connections โดยมี lock barrier จริง ไม่ skip เงียบหากไม่มี test DB และจะปฏิเสธ DB name ที่ไม่ลงท้าย `_test` Fixtures ใช้ UUID เฉพาะรอบและ cleanup เฉพาะ records ที่สร้าง

ผลล่าสุด 6 พ.ย. 2026: **39 + 15 = 54 tests passed**, typecheck/build ผ่าน; ดู [ผลทดสอบและข้อจำกัด](docs/registration/verification.md) และ [จุดเชื่อมต่อกับเพื่อน](docs/registration/integration.md)

การทดสอบ API ของ #3 inject guards เฉพาะ tests เพื่อแยกจาก #1 จึงยังไม่ถือว่าผ่าน real session/CSRF integration หรือ browser E2E ของแอปรวม

## Git / review

Branch `feature/registration` → draft PR เข้า `sprint-1-staging`, อ้าง #3 และรอเพื่อน review/integration ก่อนปิด Issue ใช้ [PR body](docs/registration/pr.md) ได้ ไม่มีการ commit/push/เปิด PR อัตโนมัติ

AI assistance: Codex สร้างโค้ด/tests/เอกสารใน branch นี้และรัน checks ที่บันทึกไว้ ทีมยังต้อง review integration และบันทึก commit จริงก่อนส่งงาน
