# LoungCheu — ระบบลงทะเบียนกิจกรรมและเช็กชื่อ

**Issue #4 — 8 พ.ย. 2026:** F-04/F-05 commit แล้วที่ eeafc313220fa9feda633b89cab8c4b90cb86f9e บน feature/registration-views; RV-01–03 เป็น working-tree patch ที่ยังไม่ commit/push รอบนี้ Focused browser2/Vitest159/typecheck/build/smoke3 PASS; full Chromium37 PASS ดู [ผลและ source manifest](docs/registration/views-verification.md) PR #10 เป็น Draft เข้า sprint-1-staging ไม่มี review/merge จาก GitHub ที่ตรวจ8พ.ย.

**Historical Event UI run — 6 พ.ย. 2026:** 145 Vitest / 35 Chromium, typecheck/build/compiled smoke PASS รวม typography/layout/state checks ที่1280/390/320px ดู [current UI evidence](docs/events/visual-consistency.md) ผล141/32 และ seed follow-up ด้านล่างเป็น historical runs

Documentation baseline v0.5 | ปรับปรุง 5 พฤศจิกายน 2026
Deliverable 1: ส่ง 8 พฤศจิกายน 2026 เวลา 23:59 (Asia/Bangkok)

**สถานะปัจจุบัน:** own registrations/roster implement ใน eeafc31 แล้ว ดู [Draft PR #10](https://github.com/jetanin/LoungCheu/pull/10) และ [current verification](docs/registration/views-verification.md); teammate review, staging integration และ release acceptance ยังต้องมีหลักฐานแยก ผล Event เดิมด้านล่างเป็น historical records

Layout ปัจจุบันใช้ `server/client`; app DB `loung-cheu-database` และ test DB `loungcheu_test` ใช้ PostgreSQL instance เดียวที่ `localhost:5432` โดยแยก database กัน ทั้ง app auth smoke และชุดทดสอบผ่านแล้ว ดู [single-instance record](docs/sprints/sprint-1/single-instance-db.md)

6 พ.ย. 2026: feature/events รวม Event APIs/UI และ Registration backend/tests แล้ว หน้ารายละเอียดใช้ RegistrationAction โดยตรง สามารถสร้าง DRAFT → publish → Participant ลงทะเบียนและรับเลขอ้างอิงจริงได้ ดู [ผลทดสอบรวม](docs/events/consistency-review.md) และ [composition](docs/events/integration.md) Own Registrations/roster เพิ่มแล้วใน eeafc31 ตาม current verification; การทดสอบวันที่6พ.ย. นี้เป็นประวัติก่อน F-04/F-05

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

### Registration extension — Issue #3

Registration จาก sprint-1-staging@ada659b รวมกับ F-02 แล้ว ใช้ auth/session/CSRF, React App/API client และ clock เดียวกัน เปิด POST /api/events/{id}/registrations ร่วมกับ GET detail และ create/publish/list ของ Event module ไม่มี auth bypass หรือ server แยก

Prisma ใช้ camelCase และ map เป็น users/events/registrations Shared migration `202611060002_registration_extension` ใช้ร่วมกันทั้ง #2/#3 โดยไม่สร้าง users/sessions/events/enums ซ้ำ ยังไม่มี My Registrations/roster ของ Issue #4 (F-04/F-05)

`npm test` รวม Auth/Event/Registration และ client unit/component tests (145 PASS หลังเพิ่ม seed integration; [demo seed verification](docs/events/demo-seed.md)); `npm run test:registration` รันเฉพาะ Registration DB suite, `npm test -w server` รัน server unit/HTTP และ `npm run test:db -w server` รันทุก server integration ดู [จุดเชื่อม](docs/events/integration.md), [ผลทดสอบรวม](docs/events/consistency-review.md) และ [ผล #3 เดิม](docs/registration/verification.md)

### PostgreSQL Docker สำหรับ branch นี้

```powershell
docker compose up -d --wait db
```

ตั้ง private `server/.env` ให้ตรง container เช่น `DATABASE_URL=postgresql://loungcheu:local_only@localhost:5432/loung-cheu-database` แล้วใช้ scripts migrate/setup-test/seed ด้านล่าง App/test ใช้ Docker instance เดียวที่ 5432 แต่คนละ database; db-test profile เดิมที่ 55433 ไม่ใช้ใน workflow ปัจจุบัน

Historical setup ของ #3 สร้าง loung-cheu-database ใหม่และเก็บ loungcheu เก่าไว้; merge audit รอบนี้ใช้เฉพาะ loungcheu_test ไม่เปลี่ยนฐานแอป Private credentials อยู่ใน server/.env เท่านั้น ถ้าใช้ Docker volume ที่มี migration history จากโครงเก่า ให้เลือกฐานใหม่หรือวางแผนย้ายข้อมูลก่อน migrate

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

`npm run db:seed` เพิ่มกิจกรรม `[DEMO]` 6 รายการและ registration ตัวอย่าง 4 รายการด้วย: เปิดรับ React Workshop, เต็ม, เลย deadline, DRAFT, CLOSED และกิจกรรมของ organizer.b เวลาเป็นวันข้างหน้าจากวัน seed ครั้งแรกตาม Asia/Bangkok รันซ้ำข้าม Event เดิม ไม่ทับกิจกรรม/ที่นั่ง/เลขอ้างอิงที่ลองใช้งานแล้ว รายละเอียดและผลจริงอยู่ใน [demo seed](docs/events/demo-seed.md)

ลอง Login `participant.a` → กิจกรรมทั้งหมด → `[DEMO] React Workshop เริ่มสร้างเว็บด้วยกัน` เพื่อลงทะเบียน หรือ Login `organizer.a` → กิจกรรมของฉัน เพื่อ preview/publish DRAFT ได้ Seed รอบนี้เพิ่มข้อมูลในฐานแอปตามคำขอผู้ใช้ และตรวจว่ากิจกรรมเดิมยังคงอยู่

Seed follow-up: full Vitest **145 PASS** (รวม seed integration ใหม่4) และ typecheck PASS; ผล **32 Chromium/build** ใน consistency review เป็นรอบก่อนเพิ่ม seed ซึ่งไม่ได้ rerun UI/build รอบนี้ ดู [seed verification](docs/events/demo-seed.md)

```powershell
npm run typecheck
npm test
npm run build
```

Unit/API suite ใช้ PostgreSQL จริงจาก `TEST_DATABASE_URL` และ reset users/sessions เฉพาะ `loungcheu_test`; อย่ารันพร้อม E2E ที่ใช้ฐานข้อมูลเดียวกัน `npm test` ต้องมี test DB ที่ migrate แล้ว และจะ fail ถ้า config ขาด ไม่รายงาน skip เป็น pass

### Tests กับ PostgreSQL ที่ติดตั้งอยู่

ตาม baseline ของโปรเจกต์ [DOD-02/DOD-06](docs/sprints/sprint-1/README.md) ต้องมี executed tests และ meaningful TDD; [STS](docs/sprints/sprint-1/sts.md) กำหนดให้ API integration ใช้ PostgreSQL จริงและแยก test database จาก demo/deployment การมี PostgreSQL ช่วยให้รัน persistence/session tests ได้ ส่วน test code ตรวจว่า Login/Logout/expiry/CSRF/permissions ทำงานตาม AC

จำเป็นต้องแยก **database** สำหรับ fixtures ที่ reset ข้อมูล ปัจจุบันใช้ PostgreSQL **instance เดียวกัน** ที่ 5432: app DB `loung-cheu-database` และ test DB `loungcheu_test` โดย `.env.test` ชี้ฐาน tests และ migrate ด้วย `npm run db:migrate:test`

Cluster 55432 เดิมหยุดแล้วและไม่ใช้ใน workflow ปัจจุบัน `scripts/local-db.ps1` เป็น compatibility wrapper สำหรับ setup test database บน instance ที่ตั้งใน `server/.env` เท่านั้น ไม่มีการ init/start/stop PostgreSQL เพิ่ม Vitest/Supertest/Playwright เป็นเครื่องมือที่ทีมเลือกและบันทึกใน baseline ผล feature consistency หลังรวม #2/#3 คือ 141 Vitest / 32 Chromium ผ่านก่อนเพิ่ม seed; ล่าสุด full Vitest รวม seed เป็น 145 PASS ดู [combined verification](docs/events/consistency-review.md) ข้อกำหนดหลักคือ coverage ตาม AC และหลักฐานรันจริง ไม่ใช่จำนวน runner cases ตายตัว

```powershell
npx playwright install chromium
npm run test:e2e
```

E2E เปิด server/Vite บน ports 3001/5173 โดย default และ seed password สุ่มเฉพาะ process ลง test DB จึงต้องให้ ports ว่าง หรือกำหนด E2E_API_PORT/E2E_WEB_PORT เพื่อใช้ 3011/5183 ชุดทดสอบครอบคลุม Auth/Event/Registration รวม create/publish/register, permissions/conflicts/late-response/session-focus races; proof ของ server expiry อยู่ใน API integration แยกต่างหาก Own records/roster มีใน Issue #4 แล้ว; current results ดู docs/registration/views-verification.md

ตรวจ compiled artifacts หลัง build ด้วย `npm run test:built`; ผลล่าสุดอยู่ใน [Event verification](docs/events/verification.md) และ [spec audit](docs/events/audit.md) ส่วน [auth pre-PR review](docs/sprints/sprint-1/auth-pre-pr-review.md) เป็นประวัติ F-01 Source snapshots/ผลแดงเดิมเป็นประวัติของแต่ละ version ไม่ใช่ผลของ working tree ล่าสุด

หลัง migrate/seed และ build แล้ว ใช้ `npm run test:local-db` เพื่อตรวจ app DB จริงจาก `server/.env`: health, anonymous rejection และ Login/Identity/Logout ของ Participant/Organizer คำสั่งนี้ใช้ demo accounts ที่ seed ไว้และไม่ reset/delete ข้อมูลผู้ใช้ ส่วน unit/API/E2E ชุดหลักยังใช้ test DB แยก ห้ามเปลี่ยน `.env.test` ให้ชี้ฐานแอป

Express serve frontend build แบบ same-origin ใน production หลังตั้ง environment จริง: `NODE_ENV=production`, `APP_ORIGIN=https://...`, `SESSION_COOKIE_SECURE=true`, DATABASE_URL, SESSION_SECRET, PORT, APP_VERSION แล้วรัน `npm start` ตั้งค่า reverse proxy ให้ตรง deployment ก่อนใช้จริง การ deploy ยังไม่ได้ทดสอบในงาน #1

PostgreSQL ใช้ service เดิมของเครื่องที่ 5432 ข้อมูล cluster 55432 เก่ายังคงอยู่ใน `.local/postgres` สำหรับ rollback แต่ไม่ต้องเปิดเพื่อรันแอปหรือ tests

## เอกสารอ้างอิง

- `group_work_specs_v1.pdf` (15 หน้า): Theme assignment หน้า 4, Theme 3 หน้า 5, Sprint/workflow หน้า 9–11, checkpoints/Labs หน้า 12–15
- `project_deliverable_1_v1.pdf` (8 หน้า): Parts A–E หน้า 1–4, working Sprint 1 และ submission/evidence หน้า 5–8

ใช้ master กำหนดขอบเขต และ handout D1 กำหนดเนื้อหา PDF ไฟล์ต้นทางแจกแยกจาก repository; รายละเอียด handout D2/Final/Labs ให้ตรวจเพิ่มเมื่อได้รับ
