# LoungCheu — Lab 5 Deployment

## สถานะและขอบเขต

เอกสารฉบับแรกสำหรับ **Issue #14 — Prepare LoungCheu for cloud deployment** วันที่ 15 พฤศจิกายน 2026 ใช้ accepted Sprint 1 baseline `0853ce2d3ed7e17fcc76d47a1838a3ec4d5bdb51` (`v1.0.0-sprint-1`) เป็นฐาน ไม่อ้างว่า deploy บน GCP หรือทำ persistence proof สำเร็จแล้ว

Branch งาน: `refactor/14-lab5-cloud-ready` → reviewed PR เข้า `lab5-staging` → release PR เข้า `main` ผู้เขียน PR ต้องให้เพื่อน review ไม่ approve ตัวเอง Issues/PRs ใช้ label `lab5` และ project board

อ้างอิง: `01_SE_Lab_5_updated.pdf` §4, §7–9, §12 และ `03_Student-Guide-GCP-Deployment-and+CI+CD-V1_1.pdf` Ep.0–2 ไฟล์จาก `02_lab5-starter-kit.zip` เป็น templates สำหรับขั้นถัดไป

## Stack และการปรับจากตัวอย่าง

| ส่วน | ใช้จริง |
| --- | --- |
| Runtime/package | Node `>=22.16.0 <23`, npm workspaces `server`/`client`, root `package-lock.json` |
| Frontend | React/Vite, output `client/dist`, API แบบ relative `/api` และ same-origin cookies |
| Backend | Express/TypeScript, output `server/dist/server.js` |
| Persistence | PostgreSQL, Prisma 7 ผ่าน `@prisma/adapter-pg`; sessions ใช้ `connect-pg-simple` ใน PostgreSQL |
| Local DB | `compose.yaml`: PostgreSQL 17 พร้อม named volume `db-data`; หรือ PostgreSQL ที่ติดตั้งอยู่แล้ว |
| Tests | Vitest, real PostgreSQL DB `loungcheu_test`, Playwright และ compiled-app smoke |
| Cloud/CI ที่วางแผน | Cloud Run, Cloud SQL PostgreSQL, Artifact Registry, Secret Manager, GitHub Actions/WIF; ยังไม่ได้ provision ใน Issue #14 |

ความต่างจาก TokTickIT: ใช้ Node 22 แทน 24, ติดตั้ง workspace จาก root, start `server.js` แทน `index.js`, login ด้วย **username + CSRF + session cookie** ไม่ใช่ email ไม่มี `/api/categories` และไม่มี admin bootstrap/password-change feature แบบตัวอย่าง จึงไม่เพิ่ม feature นั้นเพียงเพื่อใช้ kit

Production Express เสิร์ฟ `client/dist` ผ่าน path relative จาก server ต้องรักษา layout นี้ใน image Root Dockerfile/Compose app service เป็นงาน Issue #15; CI เป็น Issue #16 ยังไม่มีผล clean-clone container หรือ CI run ให้ใช้อ้างอิงในฉบับนี้

## Cloud-ready checklist (Guide Episode 2)

| จุดตรวจ | พฤติกรรม/หลักฐานในโค้ด |
| --- | --- |
| ข้อมูลนอก container | User/Event/Registration อยู่ PostgreSQL; ไม่พบ runtime uploads หรือการเขียน business data ลง filesystem ไม่ต้องเพิ่มระบบ uploads |
| Seed | password มาจาก `DEMO_SEED_PASSWORD` ไม่มี default/ไม่ print credential; demo events/registrations เดิมถูกข้าม รันด้วยคำสั่งแยก ไม่ทำทุก boot |
| ไม่มี dev auth shortcuts | login ตรวจ password; middleware ตรวจ session/current role กับ DB ไม่มี requester selector/header สำหรับข้าม login ใน production |
| Durable sessions | PostgreSQL table `sessions` จาก migrations; stable `SESSION_SECRET` ใช้ข้าม instances/releases; session expiry ยังมีผลตามปกติ |
| Port/address | อ่าน `PORT`, production bind `0.0.0.0`, local development bind `127.0.0.1`; startup ไม่ได้ migrate/seed อัตโนมัติ |
| Readiness | `/api/ready` query DB, ตอบ 200 เมื่อพร้อม และ 503 เมื่อ query ล้มเหลวโดยไม่เผย driver error |

Seed ปกติสร้างเฉพาะ username ที่ยังไม่มี ไม่เปลี่ยน password hash, display name, role หรือ active flag ของบัญชีเดิม แม้เปลี่ยน `DEMO_SEED_PASSWORD` และไม่เปิดบัญชีที่เคยปิดกลับมา การสร้างพร้อมกันใช้ unique username และ skipDuplicates เพื่อไม่เขียนทับบัญชีที่เพิ่งถูกสร้าง

Tests/E2E ใช้ `scripts/test-fixtures.ts` แยกจาก production seed เพื่อตั้งค่า fixtures ใหม่ ก่อนเขียนจะ query ชื่อ database ที่เชื่อมต่อจริงและยอมรับเฉพาะ `loungcheu_test` เท่านั้น ห้ามใช้ test reset กับ application/live DB หากบัญชี demo เดิมถูกปิดหรือเปลี่ยน role จนใช้สร้าง sample events ไม่ได้ event seed จะรายงาน error แทนการแก้บัญชีกลับให้อัตโนมัติ

การมี DB-backed state ในโค้ดเป็น prerequisite ของ R-04 ยังไม่ใช่ C-05 ต้องทดสอบ record จริงหลัง application restart และ redeploy บน GCP ในขั้น 8

## Environment variables

อย่าใส่ค่าลับจริงในเอกสาร, Git, image, logs, screenshots หรือ agent chat ตัวอย่างที่มี `REPLACE`/`<...>` ต้องใส่ค่าจริงเฉพาะไฟล์ส่วนตัวก่อนรัน Secrets ที่ฝังใน Vite output จะเป็นข้อมูลสาธารณะ แอป client ปัจจุบันไม่ต้องใช้ secret/build-time API URL

### Server runtime และ seed

คัดลอก `server/.env.example` เป็น `server/.env` เมื่อยังไม่มีไฟล์นั้น คำสั่ง npm workspace รันจาก `server/` จึงอ่านไฟล์นี้ผ่าน dotenv หากรัน `node` เองต้องกำหนด environment ให้ครบหรือใช้ working directory ให้ถูก บน cloud ให้ inject environment/secret ที่ runtime

| Variable | Purpose / required / default | Secret? | แหล่งค่า |
| --- | --- | --- | --- |
| `DATABASE_URL` | ต้องมี PostgreSQL URL พร้อม host/DB name; ใช้ทั้ง Prisma และ session Pool | ใช่ | local `server/.env`; cloud secret ที่ผู้ดูแลจัดการ |
| `SESSION_SECRET` | ต้องมีอย่างน้อย 32 characters ไม่ใช่ placeholder; เก็บค่าเดิมข้าม releases | ใช่ | ค่าสุ่มส่วนตัว / cloud secret |
| `APP_ORIGIN` | ต้องมี HTTP(S) origin ตรง browser ไม่มี path/trailing slash; production ต้อง HTTPS | ไม่ | local `http://127.0.0.1:5173`; cloud ใช้ service HTTPS origin จริง |
| `PORT` | integer 1–65535; default 3000; port ที่ runtime กำหนดต้องตรง container/service config | ไม่ | local env / Cloud Run runtime config |
| `NODE_ENV` | `development`, `test`, `production`; ไม่ตั้งถือเป็น development | ไม่ | local env; cloud ตั้ง production |
| `SESSION_COOKIE_SECURE` | `true`/`false`, default false; production บังคับ true | ไม่ | local false; HTTPS production true |
| `APP_VERSION` | release identifier, default `local`; cloud ต้องเป็น full deployed main SHA | ไม่ | local env; release pipeline inject ตาม image |
| `DEMO_SEED_PASSWORD` | ต้องมีเมื่อ seed/local auth smoke; ไม่จำเป็นต่อ server startup | ใช่ | private env / secret เฉพาะ migration/seed job ที่จำเป็น |

Encode reserved characters ใน username/password ของ DATABASE_URL ให้ถูกต้อง production ต้องมี DB ที่เข้าถึงได้จากทั้ง Prisma adapter และ `pg` session Pool วิธี Cloud SQL socket/connection string จะเติมหลังเลือกและทดสอบจริงใน first deployment ไม่ใช้ local credentials บน cloud

### Test และ development tooling

| Variable | Purpose / default | Secret? | แหล่งค่า |
| --- | --- | --- | --- |
| `TEST_DATABASE_URL` | ต้องชี้ DB ชื่อ **`loungcheu_test`**; ไม่มี fallback ไป app DB; suites reset/delete fixtures | ใช่ถ้าเป็น credentials จริง | root `.env.test` จาก `.env.test.example` หรือ process env ใน disposable CI |
| `E2E_PASSWORD` | Playwright สุ่มให้แต่ละ run หากไม่ตั้ง; ใช้ seed บัญชีเฉพาะ test DB | ใช่ระหว่าง run | Playwright config หรือ private process env; ไม่ต้องกำหนดเองตามปกติ |
| `E2E_WEB_PORT` | Playwright frontend port, default 5173 | ไม่ | process env ก่อนเรียก Playwright |
| `E2E_API_PORT` | Playwright API port, default 3001 | ไม่ | process env ก่อนเรียก Playwright |
| `UI_REVIEW_PHASE` | โฟลเดอร์ผล visual E2E ใต้ `.local/ui-review`, default `after`; test tooling เท่านั้น | ไม่ | process env ก่อนเรียก Playwright |
| `API_PROXY_TARGET` | Vite dev `/api` proxy, default `http://127.0.0.1:3000`; Playwright กำหนดตาม E2E_API_PORT | ไม่ | process env ของ Vite; ไม่ใช้ใน production build |
| `POSTGRES_PASSWORD` | Compose local app DB password, fallback `local_only`; ไม่ใช่ค่า production | ใช่เมื่อใช้ credential ส่วนตัว | process env หรือ root `.env` ที่ Compose อ่าน; ต้องตรง DATABASE_URL |
| `POSTGRES_PORT` | host port ของ Compose app DB, default 5432 | ไม่ | process env หรือ private Compose `.env`; เปลี่ยนหากชน DB เดิม |

อย่าใส่ E2E overrides ไว้ใน `.env.test` แล้วคาดว่า Playwright config จะโหลดให้ ใช้ process env โดยตรง Test fixture ports/origins และ app origins ต้องไม่ปนกัน ส่วน `POSTGRES_USER`/`POSTGRES_DB` ใน Compose เดิมเป็น config ของ DB image ในไฟล์ Compose ไม่ใช่ตัวแปรที่แอปอ่าน

## Local setup และคำสั่งที่ทำซ้ำได้

คำสั่งต่อไปนี้ใช้ PowerShell จาก root repo พร้อม Node 22 และ PostgreSQL ที่ใช้งานได้ ไม่มีคำสั่งนี้ทำหน้าที่ตั้ง GCP หากมี `.env` เดิมอย่าคัดลอกทับ ให้แก้เฉพาะค่าที่จำเป็นด้วยตัวเอง

```powershell
cd C:\Kmutt\Senior\CPE334\Final\LoungCheu
npm ci
# ทำเฉพาะไฟล์ที่ยังไม่มี แล้วใส่ค่าจริงส่วนตัวใน IDE
if (-not (Test-Path server/.env)) { Copy-Item server/.env.example server/.env }
if (-not (Test-Path .env.test)) { Copy-Item .env.test.example .env.test }
npm run db:generate
```

ต้องมี application database แยกจาก `loungcheu_test` ที่ migrate แล้ว หากใช้ PostgreSQL เดิมของตนเอง ให้คนตรวจ target/สิทธิ์ก่อนสร้างหรือ migrate database สำหรับ app และ test ไม่จำเป็นต้องสร้าง PostgreSQL instance เพิ่ม

หากเลือก Compose DB เดิมและไม่ได้ใช้ PostgreSQL service อื่น ใช้ `docker compose up -d db` โดยต้องกำหนด app URL ให้ตรง user/password/port/DB (`loung-cheu-database`) ใน Compose ก่อน หาก port 5432 มี DB เดิมอยู่ ให้ใช้ instance เดิมหรือเลือก `POSTGRES_PORT` อื่น ไม่หยุด/ลบฐานข้อมูลเก่าเพื่อแก้ชน port

### Migrate และ seed (คนตรวจ target ก่อนรัน)

```powershell
# อ่าน DATABASE_URL จาก server/.env ต้องเป็น app DB ที่ตั้งใจใช้
npm run db:migrate
# กำหนด DEMO_SEED_PASSWORD ส่วนตัวก่อน ไม่ใส่ password ในคำสั่งที่บันทึกไว้
npm run db:seed
```

บัญชี demo: `participant.a`, `participant.b`, `participant.c`, `organizer.a`, `organizer.b` และ `inactive.x` (บัญชีสุดท้าย login ไม่ได้) password มาจากค่าที่ส่งเข้า seed เท่านั้น ส่งต่อให้ผู้ทดสอบผ่านช่องทางส่วนตัว

### Test และ build

ตรวจ `TEST_DATABASE_URL` ว่าชี้เฉพาะ `loungcheu_test` ก่อนรัน การรัน tests จะเปลี่ยน fixtures ในฐานนี้ ห้ามใช้ URL ของ live DB แม้เปลี่ยนชื่อให้ผ่าน validator อย่ารัน Vitest/E2E พร้อมกันเพราะใช้ DB เดียวกัน

```powershell
npm run db:migrate:test
npm run typecheck
npm test
npm run build
npm run test:built
# เมื่อต้องรัน E2E ครั้งแรกและยังไม่มี browser
npx playwright install chromium
# ถ้า dev server ใช้ port เดิมอยู่ ใช้ ports แยก
$env:E2E_WEB_PORT = '5183'
$env:E2E_API_PORT = '3011'
npm run test:e2e
```

Linux CI ใช้ `npx playwright install --with-deps chromium` เมื่อต้องติดตั้ง OS dependencies ด้วย `test:built` import compiled app ทดสอบด้วย Supertest และ test DB จึงไม่ใช่หลักฐาน OS-process restart หรือ Cloud Run HTTPS production login

`npm run db:setup:test` เป็นตัวช่วยเดิมที่อาจสร้าง `loungcheu_test` จาก credentials ของ app และเขียน root `.env.test` ใช้ได้หลังคนตรวจ local target เท่านั้น ไม่จำเป็นหากเตรียม DB/test env ไว้แล้ว และไม่ควรเรียกกับ production credentials

### Run

```powershell
# local development: Vite UI 5173 และ API 3000
npm run dev
# compiled production server: หลัง build และ inject production env ถูกต้อง
npm start
```

Production ต้อง `NODE_ENV=production`, `SESSION_COOKIE_SECURE=true` และ `APP_ORIGIN=https://<actual-service-origin>` แอป trust proxy หนึ่งชั้นตาม Cloud Run และ bind `0.0.0.0:$PORT` อย่าปิดข้อบังคับ HTTPS เพื่อให้ local Docker ผ่าน การตรวจ production cookie/login บน network จริงเป็นงาน Docker/GCP ถัดไป ใช้ dev URL `http://127.0.0.1:5173/login` เฉพาะ development

## Endpoints และ release identification

| Request | ผล |
| --- | --- |
| `GET /api/health` | behavior เดิม: query DB แล้ว 200 `{data:{status:"ok",version:APP_VERSION}}`; dependency error เป็น generic 500 |
| `GET /api/ready` | query DB แล้ว 200 `{data:{status:"ready",db:"connected",version:APP_VERSION}}`; query fail เป็น 503 `{data:{status:"not_ready",version:APP_VERSION}}` โดยไม่เผย SQL/credentials |
| `GET /login` | built SPA เมื่อ production และมี `client/dist`; development เปิดผ่าน Vite |
| `GET /api/auth/csrf` → `POST /api/auth/login` | login ใช้ cookie jar, X-CSRF-Token, username/password; token เปลี่ยนหลัง login |

Health/readiness ไม่ต้อง login; `/api/ready` อยู่ก่อน session middleware จึงไม่อ่าน session store แม้ request มี signed session cookie และยังตอบ 503 เมื่อ query DB ล้มเหลวโดยไม่สร้าง cookie Responses ใต้ `/api` เป็น `Cache-Control: no-store` API ที่ไม่มีอยู่ยังเป็น JSON 404 ไม่ควรได้รับ SPA HTML

หลัง deploy ให้เทียบ `data.version` กับ **main SHA ของ image ที่ deploy จริง**, pipeline run และ Cloud Run revision/image digest เมื่อ rollback ต้องใช้ version ของ image เก่า ไม่ใช่ SHA ของ workflow ที่กด rollback

## GCP resources — รอ first deployment

| รายการ | ค่าที่ตรวจยืนยันแล้ว |
| --- | --- |
| GCP access/project/billing | TBD — ยังไม่ตรวจยืนยัน; ผู้ใช้กำลังขอสิทธิ์มหาวิทยาลัย ให้ยืนยันช่องทางกับ TA ตาม handout §4.4 |
| Project ID / region | TBD — ยังไม่ยืนยัน |
| Artifact Registry / image path | TBD — ยังไม่สร้างหรือยืนยัน |
| Cloud Run service / public URL | TBD — ยังไม่ deploy ใน Issue #14 |
| Cloud SQL instance / database / connection | TBD — ยังไม่สร้างหรือยืนยัน |
| Runtime SA / deployer SA / WIF provider | TBD — ยังไม่สร้างหรือยืนยัน |
| Runtime/seed secret resource names | TBD — ให้คนตั้งค่าจริงและบันทึกเฉพาะชื่อ ห้ามบันทึก secret value |
| Running release SHA / revision | TBD — ยังไม่มีผล live verification |

ก่อนเปิด resource ให้คนอ่าน gcloud commands และผล IAM/billing/DB ตาม handout §9 Agent ไม่เปลี่ยนรายการเหล่านี้เอง Budget alert เป็น recommended และไม่ใช่ spending cap

## Release procedure — แผนที่ต้องทำให้ใช้งานได้ในขั้น 4–7

1. สร้าง Issue/branch จาก `lab5-staging` ล่าสุด ทำงานพร้อม tests เปิด PR เข้า `lab5-staging` ติด `lab5` และให้เพื่อน review แบบระบุสิ่งที่ตรวจ
2. เมื่อ relevant build/tests ผ่านและ approvals ครบ จึง merge; เปิด release PR `lab5-staging → main` รอ checks/review อีกครั้ง ห้ามข้าม required checks
3. First deployment ทำจาก reviewed main ผ่านขั้นตอนที่คนตรวจแล้ว ส่วน accepted releases ถัดไปต้องผ่าน deploy pipeline จาก main
4. Pipeline ที่จะทำ: CI → build/push image full main SHA → migrate DB ด้วย image ที่ตรวจแล้ว → deploy → read-only smoke → บันทึก SHA/digest/revision/URL ถ้า migration ล้มเหลวต้องไม่ปล่อย service ใหม่
5. ตรวจ `/api/ready`, `/api/health` และ release version แล้วตรวจ live sign-in/domain journey; เก็บ run/PR links และผลจริง
6. พิสูจน์ persistence แยกเหตุการณ์ restart และ redeploy ด้วย record เดิม ไม่ reset/reseed record ทดแทน

ยังไม่สามารถทำ release end-to-end ตามแผนนี้ได้จนกว่า Docker/CI/cloud/pipeline พร้อม จะเติม workflow filenames, exact deployment commands, resources และ run links หลังตรวจจริง ไม่ใช้คำอธิบายแผนนี้แทนหลักฐาน C-01–C-06

## Verification ของ Issue #14

ผล local verification วันที่ 15 พฤศจิกายน 2026: รอบแรกของ Issue #14 ใช้ baseline SHA ด้านบน รอบแก้ readiness/session และ seed ใช้ working tree บน `3472f7c` (commit ก่อนแก้ follow-up) ยังไม่มี commit สำหรับ follow-up นี้ ห้ามอ้างว่า tested source เป็น release ที่ deploy แล้ว

| Command/check | ผลจริง |
| --- | --- |
| Read-only DB preflight ก่อน tests | เชื่อมและตรวจ `current_database()` เป็น `loungcheu_test` โดยไม่แสดง credentials |
| `npm run typecheck` | PASS ทั้ง workspaces และ tools |
| `npm test` | PASS 16 files / 167 tests รวม readiness พร้อม signed cookie/session store failure, create-only seed, concurrent seed และ guard ของ test fixtures |
| `npm run build` | client/server build output พร้อมใช้งาน; compiled readiness ผ่าน smoke ด้านล่าง |
| `npm run test:built` | PASS 4 checks: SPA `/login`, DB health/version, readiness และ unknown API JSON 404 |
| `npm run test:e2e` | PASS 37 Chromium tests ที่ ports 5183/3011 รวม login/domain journeys หลังใช้ test-only fixture reset |
| `git diff --check` | PASS สำหรับ tracked changes |

Browser E2E รอบ follow-up: sandbox run เริ่ม server ไม่ได้เพราะ Windows `uv_os_get_passwd` error ก่อนเริ่ม browser tests จึงรันใหม่ภายนอก sandbox หลังได้รับอนุญาตและผ่าน 37 tests ผล local checks นี้ไม่ใช่ผล live HTTPS login, clean-clone Docker หรือ OS-process restart ต้องตรวจในขั้นถัดไป

- ตรวจ config/PORT/listen, DB sessions, seed และไม่มี runtime file persistence จากโค้ด
- Tests ของ readiness ต้องครอบคลุม DB available/unavailable, 503 และไม่เผย error detail
- Tests เดิมต้องยังตรวจ secure cookie และ session หลัง recreate app ได้
- GCP public workflow, clean-clone Docker, CI gate และ live restart/redeploy: ยังไม่ทำ เป็นงาน Issues ถัดไป

หลังส่ง Lab 5 ให้คง service/repository public จนผู้สอนประกาศจบการตรวจ ห้าม teardown หรือหยุด DB ทันทีหลังส่ง PDF
