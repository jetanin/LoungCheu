# LoungCheu — ระบบลงทะเบียนกิจกรรมและเช็กชื่อ

Documentation baseline v0.5 | ปรับปรุง 5 พฤศจิกายน 2026
Deliverable 1: ส่ง 8 พฤศจิกายน 2026 เวลา 23:59 (Asia/Bangkok)

**สถานะ: baseline v0.5 รับแล้วผ่าน [PR #5](https://github.com/jetanin/LoungCheu/pull/5)** F-01 รวมใน sprint-1-staging แล้ว (`6e8a24c`); F-02 มี implementation/tests บน `feature/events` รอ review/integration/release; F-03–09 ยังไม่รวมใน branch นี้ ยังไม่มี application release บน main ผล F-01 เดิมดู [auth pre-PR review](docs/sprints/sprint-1/auth-pre-pr-review.md)

Layout ปัจจุบันใช้ `server/client`; app DB `loung-cheu-database` และ test DB `loungcheu_test` ใช้ PostgreSQL instance เดียวที่ `localhost:5432` โดยแยก database กัน ทั้ง app auth smoke และชุดทดสอบผ่านแล้ว ดู [single-instance record](docs/sprints/sprint-1/single-instance-db.md)

6 พ.ย. 2026: branch `feature/events` มี F-02 APIs/UI และ tests แล้วจาก staging ที่รวม Auth (`6e8a24c`) ดู [ผลทดสอบจริง](docs/events/verification.md) และ [shared migration/จุดเชื่อม #3](docs/events/integration.md) ยังไม่ commit/review/release; backend Registration ยังไม่รวม จึงยังไม่สามารถยืนยันผลลงทะเบียนจากหน้ารายละเอียดบน branch นี้

F-02 ใช้คำสั่ง generate/migrate/build/test ด้านล่างชุดเดิม Shared migration คือ `202611060002_registration_extension` จาก #3 ใช้ migration เดิมร่วมกัน ห้ามเพิ่ม migration สร้าง events ซ้ำ การตรวจรอบนี้ migrate เฉพาะ test DB; เมื่อนำไปใช้กับ app DB ให้ใช้ `npm run db:migrate` ตามขั้นตอนเดิม Routes เริ่มที่ `/events` และ Organizer ไป `/organizer/events` เพื่อสร้าง DRAFT/preview/publish เวลา form และ detail เป็น Asia/Bangkok หากพอร์ต dev เดิมใช้อยู่ ให้กำหนด `E2E_WEB_PORT=5183` และ `E2E_API_PORT=3011` สำหรับ browser tests

Organizer มีแท็บ **ภาพรวม** ที่ `/organizer` พร้อมจำนวนกิจกรรมของตนทั้งหมด/ฉบับร่าง/เผยแพร่ และสามกิจกรรมล่าสุดจาก own event API เดิม หน้านี้เป็น F-02 UI presentation; Login ยังไป `/events` และไม่มี Participant/attendance report เพิ่ม

ระบบกิจกรรมภายในมหาวิทยาลัยสำหรับ Participant และ Organizer ครอบคลุมการเผยแพร่ ลงทะเบียน ยกเลิก เช็กชื่อ และรายงานการเข้าร่วม

## ทีมและ repository

| สมาชิก | ชื่อ / รหัส |
|---|---|
| M1 | Jetanin Naitho — 67070501011 |
| M2 | Paphangkorn Luanseng — 67070501083 |

| ข้อมูลส่งงาน | ค่า |
|---|---|
| Theme | 3 — ใช้สิทธิ์จากรหัส M2 ที่ลงท้าย 3 |
| Repository | https://github.com/jetanin/LoungCheu |
| Submitted application tag/commit | ยังไม่มี |

## Stack และ workflow

| Area | Technology |
|---|---|
| Frontend | React + TypeScript + Vite + Bootstrap |
| Backend | Node.js + Express + TypeScript; REST JSON |
| Database | PostgreSQL + Prisma |
| Testing | Vitest + Supertest; Playwright สำหรับ selected browser E2E |
| Workflow | GitHub Issues/Projects, feature branches, PRs และ teammate review |

Sprint 1 ใช้ `feature/* → sprint-1-staging → main` ทุก feature PR ต้องมีเพื่อน review และทดสอบรวมก่อน release PR เข้า main ดู Issues #1–4, project board และ baseline integration ใน [Sprint plan](docs/sprints/plan.md)

## เอกสาร Deliverable 1

| Part | คะแนน | เอกสาร |
|---|---:|---|
| A | 10 | [SRS](docs/srs.md) |
| B | 10 | [Features](docs/features.md), [Traceability](docs/traceability.md) |
| C | 15 | [System SDS](docs/system-sds.md) |
| D | 5 | [Three-sprint plan](docs/sprints/plan.md) |
| E | 20 | [Sprint 1 / DoD](docs/sprints/sprint-1/README.md), [Contracts](docs/sprints/sprint-1/contracts.md), [STS](docs/sprints/sprint-1/sts.md) |
| F | 20 | [Evidence register](docs/deliverable-1/evidence-register.md), [Submission checklist](docs/deliverable-1/report-plan.md) |

[Decisions / review record](docs/decisions.md) เก็บเหตุผลและคำถามคงค้าง; [Changelog](docs/changelog.md) เก็บ revision/commit history และ AI-use declaration

## การใช้งานและส่งงาน

1. ทีมตรวจ scope/design/contracts แล้ว version เอกสารก่อน implementation
2. พัฒนาและทดสอบตาม Issue/AC เก็บ TDD red→green สำหรับกฎสำคัญ และ teammate review
3. เติม actual test file/name, command, result และ tested commit ใน traceability/evidence
4. Release บน main พร้อม setup/migration/seed/build/run/test instructions
5. รวมเนื้อหา Parts A–F และหลักฐานลง PDF เดียว พร้อมสารบัญ/เลขหน้า ส่งผ่าน LEB2

Docker/CI/CD/GCP ต้องเสร็จใน Lab 5 ส่วน D1 ต้องมี local release และแผน deployment

## Local setup — Issue #1 / F-01

ใช้ Node.js **22.16.0** (รองรับ 22.x ตั้งแต่ 22.16.0), npm **11.11.0**, PostgreSQL **17**; dependency versions pin ใน package.json และ package-lock.json รันคำสั่งต่อไปนี้จาก repository root

```powershell
npm ci
```

หากใช้ PostgreSQL ที่สร้างเองในเครื่อง ให้ตั้ง `DATABASE_URL` ใน `server/.env` ไปยัง **`loung-cheu-database`** โดยใช้ host/port/user/password จริงของ service Template ใช้ placeholders ให้แทนค่าตามเครื่อง; app DB ปัจจุบันใช้ `localhost:5432` และ schema `public` จากนั้นรัน `npm run db:generate` และ `npm run db:migrate` เก็บฐาน `loungcheu_test` แยกสำหรับ tests เสมอ

เมื่อ `server/.env` เชื่อมต่อฐานแอปได้แล้ว `npm run db:setup:test` จะสร้าง `loungcheu_test` บน instance เดียวกันถ้ายังไม่มี และตั้ง private `.env.test` โดยใช้ host/port/credentials เดียวกันพร้อมเปลี่ยนชื่อ database เท่านั้น คำสั่งไม่แก้ `server/.env` และสำรอง `.env.test` เดิมใน `.local/test-env-before-single-instance.env` เมื่อมีไฟล์เดิม ต้องมีสิทธิ์สร้าง database หรือให้ผู้ดูแลสร้าง test DB และเตรียม `.env.test` เองตาม template

```powershell
npm run db:generate
npm run db:migrate
npm run db:setup:test
npm run db:migrate:test
```

หากใช้ PostgreSQL ของตนเอง (รวม macOS/Linux) ให้สร้าง empty database สำหรับแอปและอีก database ชื่อ `loungcheu_test` ที่แยกต่างหาก คัดลอก `server/.env.example` เป็น `server/.env` และ `.env.test.example` เป็น `.env.test`; ใส่ connection URLs/SESSION_SECRET จริงในไฟล์ local เท่านั้น `APP_ORIGIN` ต้องตรง origin ของ browser แบบไม่มี trailing slash และ production ต้อง HTTPS/secure cookie

ตำแหน่ง config: server/Prisma/seed ใช้ `server/.env` เพราะ npm workspace รันจาก `server/`; Vitest/E2E/test migration ใช้ `.env.test` ที่ root Template ที่ต้องใช้มี `server/.env.example` และ `.env.test.example` ไม่มี runtime `.env` หรือ template `.env.example` ซ้ำที่ root ฝั่ง client ไม่อ่าน DB/session/seed secrets การตรวจ test target ใช้ชื่อ database ใน URL จริง จึงไม่รับ URL ของ dev ที่เพียงใส่คำว่า `loungcheu_test` ใน query string

Seed รับ password ผ่าน environment แบบ private ไม่มี default และไม่ print credentials กำหนด `DEMO_SEED_PASSWORD` ใน `server/.env` ก่อน seed และใช้ค่าเดียวกันสำหรับ local auth smoke รอบ setup นี้เตรียมค่าสุ่มไว้ในไฟล์ local แล้ว; อ่านค่าใน IDE เพื่อใช้กับบัญชี demo โดยไม่ส่งรหัสผ่านในแชต หากเปลี่ยนค่าให้รัน seed อีกครั้งเพื่ออัปเดต hash

```powershell
npm run db:seed
npm run dev
```

เปิด **http://127.0.0.1:5173/login** (ใช้ hostname นี้ให้ตรง APP_ORIGIN) API port 3000; Vite proxy `/api` ไป backend บัญชีสังเคราะห์: `participant.a`, `participant.b`, `participant.c`, `organizer.a`, `organizer.b`, `inactive.x` โดยบัญชีสุดท้าย Login ไม่ได้ Password ใช้ค่าที่ส่งเข้า seed ผ่าน private handoff; seed ทำซ้ำแล้วคง IDs และ hash เดิมเมื่อ password ไม่เปลี่ยน ห้ามใส่ demo password/session secret ใน Git หรือ PDF

```powershell
npm run typecheck
npm test
npm run build
```

Unit/API suite ใช้ PostgreSQL จริงจาก `TEST_DATABASE_URL` และ reset users/sessions เฉพาะ `loungcheu_test`; อย่ารันพร้อม E2E ที่ใช้ฐานข้อมูลเดียวกัน `npm test` ต้องมี test DB ที่ migrate แล้ว และจะ fail ถ้า config ขาด ไม่รายงาน skip เป็น pass

### Tests กับ PostgreSQL ที่ติดตั้งอยู่

ตาม baseline ของโปรเจกต์ [DOD-02/DOD-06](docs/sprints/sprint-1/README.md) ต้องมี executed tests และ meaningful TDD; [STS](docs/sprints/sprint-1/sts.md) กำหนดให้ API integration ใช้ PostgreSQL จริงและแยก test database จาก demo/deployment การมี PostgreSQL ช่วยให้รัน persistence/session tests ได้ ส่วน test code ตรวจว่า Login/Logout/expiry/CSRF/permissions ทำงานตาม AC

จำเป็นต้องแยก **database** สำหรับ fixtures ที่ reset ข้อมูล ปัจจุบันใช้ PostgreSQL **instance เดียวกัน** ที่ 5432: app DB `loung-cheu-database` และ test DB `loungcheu_test` โดย `.env.test` ชี้ฐาน tests และ migrate ด้วย `npm run db:migrate:test`

Cluster 55432 เดิมหยุดแล้วและไม่ใช้ใน workflow ปัจจุบัน `scripts/local-db.ps1` เป็น compatibility wrapper สำหรับ setup test database บน instance ที่ตั้งใน `server/.env` เท่านั้น ไม่มีการ init/start/stop PostgreSQL เพิ่ม Vitest/Supertest/Playwright เป็นเครื่องมือที่ทีมเลือกและบันทึกใน baseline ผลล่าสุดหลัง F-02 audit คือ 74 Vitest / 26 browser ผ่าน ดู [verification](docs/events/verification.md) ข้อกำหนดหลักคือ coverage ตาม AC และหลักฐานรันจริง ไม่ใช่จำนวน runner cases ตายตัว

```powershell
npx playwright install chromium
npm run test:e2e
```

E2E เปิด server/Vite บน ports 3001/5173 โดย default และ seed password สุ่มเฉพาะ process ลง test DB จึงต้องให้ ports ว่าง หรือกำหนด E2E_API_PORT/E2E_WEB_PORT เพื่อใช้ 3011/5183 ชุดทดสอบครอบคลุม Auth เดิมและ Event create/preview/publish/browse รวม permission/conflict/late-response/session-focus races; proof ของ server expiry อยู่ใน API integration แยกต่างหาก หน้า `/events` มี identity/role และรายการกิจกรรมแล้ว ยังไม่รวม Registration backend/own records/roster ของ #3–4

ตรวจ compiled artifacts หลัง build ด้วย `npm run test:built`; ผลล่าสุดอยู่ใน [Event verification](docs/events/verification.md) และ [spec audit](docs/events/audit.md) ส่วน [auth pre-PR review](docs/sprints/sprint-1/auth-pre-pr-review.md) เป็นประวัติ F-01 Source snapshots/ผลแดงเดิมเป็นประวัติของแต่ละ version ไม่ใช่ผลของ working tree ล่าสุด

หลัง migrate/seed และ build แล้ว ใช้ `npm run test:local-db` เพื่อตรวจ app DB จริงจาก `server/.env`: health, anonymous rejection และ Login/Identity/Logout ของ Participant/Organizer คำสั่งนี้ใช้ demo accounts ที่ seed ไว้และไม่ reset/delete ข้อมูลผู้ใช้ ส่วน unit/API/E2E ชุดหลักยังใช้ test DB แยก ห้ามเปลี่ยน `.env.test` ให้ชี้ฐานแอป

Express serve frontend build แบบ same-origin ใน production หลังตั้ง environment จริง: `NODE_ENV=production`, `APP_ORIGIN=https://...`, `SESSION_COOKIE_SECURE=true`, DATABASE_URL, SESSION_SECRET, PORT, APP_VERSION แล้วรัน `npm start` ตั้งค่า reverse proxy ให้ตรง deployment ก่อนใช้จริง การ deploy ยังไม่ได้ทดสอบในงาน #1

PostgreSQL ใช้ service เดิมของเครื่องที่ 5432 ข้อมูล cluster 55432 เก่ายังคงอยู่ใน `.local/postgres` สำหรับ rollback แต่ไม่ต้องเปิดเพื่อรันแอปหรือ tests

## เอกสารอ้างอิง

- `group_work_specs_v1.pdf` (15 หน้า): Theme assignment หน้า 4, Theme 3 หน้า 5, Sprint/workflow หน้า 9–11, checkpoints/Labs หน้า 12–15
- `project_deliverable_1_v1.pdf` (8 หน้า): Parts A–E หน้า 1–4, working Sprint 1 และ submission/evidence หน้า 5–8

ใช้ master กำหนดขอบเขต และ handout D1 กำหนดเนื้อหา PDF ไฟล์ต้นทางแจกแยกจาก repository; รายละเอียด handout D2/Final/Labs ให้ตรวจเพิ่มเมื่อได้รับ
