# LoungCheu — Lab 5 Deployment

> Current course setup (21 November 2026): use only project `cpe-se-course-2026`, region `asia-southeast1` and team `scccd8b05`. The portal provisions infrastructure/IAM. Follow [course-managed first deployment](first-deployment.md); the earlier owner-provisioned instructions are superseded. Use the existing resource names with describe/update, preserve portal env/secrets, and do not create another DB or run teardown. Manual deployment/smoke now passed; operator-reported business journeys passed. URL-visible capacity restriction is captured; restricted Guide 5.7 detail views are documented using functional portal/deploy/migration/readiness evidence without claiming inventory/IAM inspection. [Supplemental Issue #17 evidence comment](https://github.com/jetanin/LoungCheu/issues/17#issuecomment-7077742818) was posted at `2026-11-22T10:21:45Z` (`2026-11-22 17:21:45 +07`), as returned by the GitHub API. It links the new resource/capacity/scaling images directly at evidence commit `c36f477012eb8856e67bc7c5364a9667a56fc2c3`; its body and all listed image paths were verified. Remaining: PR #27 CI/review/merge into lab5-staging, a reviewed release PR into main, and final link/status checks.

> Current #19 workflow configuration: push to `main` triggers `Deploy demo`; its deploy job waits for CI and runs only on main. This enables automated release but does not itself prove a successful WIF/deploy/C-06 run.

## สถานะและขอบเขต

เอกสารนี้เริ่มใน **Issue #14 — Prepare LoungCheu for cloud deployment** วันที่ 15 พฤศจิกายน 2026 จาก accepted Sprint 1 baseline `0853ce2d3ed7e17fcc76d47a1838a3ec4d5bdb51` (`v1.0.0-sprint-1`) และเพิ่มผล Docker ของ Issue #15 กับผล CI บน PR #23 ของ Issue #16 ภายหลัง ปัจจุบันมีผล manual deployment และ smoke บน GCP แล้วตามหลักฐานรอบจริงด้านล่าง ส่วน GCP persistence proof ยังไม่ทำ

เส้นทาง branch: งานของแต่ละ Issue → reviewed PR เข้า `lab5-staging` → release PR เข้า `main` ผู้เขียน PR ต้องให้เพื่อน review ไม่ approve ตัวเอง Issues/PRs ใช้ label `lab5` และ project board; Issue #14 ใช้ `refactor/14-lab5-cloud-ready`

สถานะ label และประวัติ CI ตาม R-10 ตรวจไว้ใน [R-10 audit](evidence/r10-label-history.md); ใช้ลิงก์ GitHub จริงตรวจซ้ำก่อนอ้างว่าผ่าน

อ้างอิง: `01_SE_Lab_5_updated.pdf` §4, §7–9, §12 และ `03_Student-Guide-GCP-Deployment-and+CI+CD-V1_1.pdf` Ep.0–4 ไฟล์จาก `02_lab5-starter-kit.zip` เป็น templates ที่ต้องปรับให้ตรงแอป

## Stack และการปรับจากตัวอย่าง

| ส่วน | ใช้จริง |
| --- | --- |
| Runtime/package | Node `>=22.16.0 <23`, npm workspaces `server`/`client`, root `package-lock.json` |
| Frontend | React/Vite, output `client/dist`, API แบบ relative `/api` และ same-origin cookies |
| Backend | Express/TypeScript, output `server/dist/server.js` |
| Persistence | PostgreSQL, Prisma 7 ผ่าน `@prisma/adapter-pg`; sessions ใช้ `connect-pg-simple` ใน PostgreSQL |
| Local DB | `compose.yaml` สำหรับ PostgreSQL เดิม; `compose.docker.yaml` สำหรับ Docker app+DB ที่แยก project/volume ตาม Issue #15 |
| Tests | Vitest, real PostgreSQL DB `loungcheu_test`, Playwright และ compiled-app smoke |
| CI/Cloud | PR #24 → `lab5-staging` และ PR #25 → `main` merge แล้วพร้อม CI ผ่านตรง head; manual migration/smoke ผ่านและผู้ใช้รายงาน business journeys ผ่าน; ภาพ URL และ capacity restriction มีแล้ว; runtime IAM/รายชื่อ secrets ตรวจรายละเอียดไม่ได้ด้วยสิทธิ์นักศึกษาและไม่อ้างว่าตรวจผ่าน; เหลือแนบภาพใหม่ใน Issue และ PR #27 review/merge; workflow ปัจจุบันรวม #19 แล้ว: push เข้า main เริ่ม Deploy demo หลัง CI ผ่าน; ผล live automation ต้องอ้าง run จริงแยกจาก manual #17 |

ความต่างจาก TokTickIT: ใช้ Node 22 แทน 24, ติดตั้ง workspace จาก root, start `server.js` แทน `index.js`, login ด้วย **username + CSRF + session cookie** ไม่ใช่ email ไม่มี `/api/categories` และไม่มี admin bootstrap/password-change feature แบบตัวอย่าง จึงไม่เพิ่ม feature นั้นเพียงเพื่อใช้ kit

Production Express เสิร์ฟ `client/dist` ผ่าน path relative จาก server ต้องรักษา layout นี้ใน image Dockerfile และ local Compose ของ Issue #15 พร้อมคำสั่ง/ผลตรวจอยู่ใน [docker.md](docker.md) ส่วน CI เป็นงาน Issue #16

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
| `DATABASE_URL` | ต้องมี PostgreSQL URL พร้อม host/DB name; ใช้ทั้ง Prisma และ session Pool; Prisma config ต้องอ่านตัวแปรนี้แม้ตอน generate | ใช่สำหรับ DB จริง | local `server/.env`; cloud secret ที่ผู้ดูแลจัดการ; CI ตั้งค่าใช้ PostgreSQL test service ชั่วคราวเท่านั้น |
| `SESSION_SECRET` | ต้องมีอย่างน้อย 32 characters ไม่ใช่ placeholder; เก็บค่าเดิมข้าม releases | ใช่ | ค่าสุ่มส่วนตัว / cloud secret |
| `APP_ORIGIN` | ต้องมี HTTP(S) origin ตรง browser ไม่มี path/trailing slash; production ต้อง HTTPS | ไม่ | local `http://127.0.0.1:5173`; cloud ใช้ service HTTPS origin จริง |
| `PORT` | integer 1–65535; default 3000; port ที่ runtime กำหนดต้องตรง container/service config | ไม่ | local env / Cloud Run runtime config |
| `HOST` | bind address: `127.0.0.1`, `0.0.0.0`, `::`; default local loopback/production all interfaces; production ไม่รับ loopback | ไม่ | local Docker ตั้ง `0.0.0.0`; cloud ไม่ต้อง override |
| `NODE_ENV` | `development`, `test`, `production`; ไม่ตั้งถือเป็น development | ไม่ | local env; cloud ตั้ง production |
| `SESSION_COOKIE_SECURE` | `true`/`false`, default false; production บังคับ true | ไม่ | local false; HTTPS production true |
| `APP_VERSION` | release identifier, default `local`; cloud ต้องเป็น full deployed main SHA | ไม่ | local env; release pipeline inject ตาม image |
| `DEMO_SEED_PASSWORD` | ต้องมีเมื่อ seed/local auth smoke; ไม่จำเป็นต่อ server startup | ใช่ | private env / secret เฉพาะ migration/seed job ที่จำเป็น |

Encode reserved characters ใน username/password ของ DATABASE_URL ให้ถูกต้อง production ต้องมี DB ที่เข้าถึงได้จากทั้ง Prisma adapter และ `pg` session Pool live migration และ readiness ยืนยันการเชื่อม DB แล้ว; เก็บ reference ของ portal แทนการเผย connection string ไม่ใช้ local credentials บน cloud

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

### Local Docker Compose configuration

`compose.docker.yaml` อ่านค่าจาก `.env.docker` ที่สร้างตาม `.env.docker.example`; ค่านี้ใช้เฉพาะ local stack แยกจาก `server/.env` และ CI รายละเอียดการใช้งานอยู่ใน [docker.md](docker.md)

| Variable | Purpose / required / default | Secret? | แหล่งค่า |
| --- | --- | --- | --- |
| `DOCKER_DB_PASSWORD` | จำเป็นสำหรับ PostgreSQL local stack และ URL ที่ส่งให้ migrate/server; ต้องเป็นค่าที่ปลอดภัยใน URL | ใช่ | `.env.docker` ที่สร้างโดย `scripts/setup-docker-env.mjs` หรือเติมเองจาก example |
| `DOCKER_SESSION_SECRET` | จำเป็นสำหรับ session ของ local stack; เก็บค่าเดิมเมื่อ down/up | ใช่ | `.env.docker` จาก setup helper หรือเติมเอง |
| `DOCKER_DEMO_PASSWORD` | จำเป็นสำหรับ seed และ local Docker smoke; ไม่ reset บัญชีเดิม | ใช่ | `.env.docker` จาก setup helper หรือเติมเอง |
| `DOCKER_WEB_PORT` | พอร์ต frontend บน loopback; default 5173; ใช้สร้าง `APP_ORIGIN` ใน Compose ด้วย | ไม่ | `.env.docker` หรือค่า default ใน Compose |
| `DOCKER_API_PORT` | พอร์ต API บน loopback; default 3000 | ไม่ | `.env.docker` หรือค่า default ใน Compose |
| `APP_VERSION` | ตัวระบุ image/release ของ local stack; default `local-docker`; สำหรับ cloud ใช้ full main SHA | ไม่ | `.env.docker` หรือค่า default ใน Compose; cloud release pipeline |

## Local setup และคำสั่งที่ทำซ้ำได้

สำหรับ clean Docker setup โดยไม่ต้องติดตั้ง PostgreSQL/npm dependencies บน host ให้ใช้ [Docker setup และผลทดสอบ Issue #15](docker.md) คำสั่งด้านล่างเป็นทางเลือกสำหรับรันโดยตรงบน host

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

## GCP resources — verified manual first deployment (#17)

The following is the real #17 manual deployment record, not an inference from the #19 workflow. The public app, release version, migration, revision/digest and screenshots remain historical evidence for that deployment.

Issue #17 ปรับเป็น course-managed kit ทีม `scccd8b05` ตาม [first-deployment.md](first-deployment.md) ตารางนี้บันทึกชื่อที่ได้รับจาก kit ในช่วงเตรียมโค้ด ไม่ใช่สถานะ GCP ปัจจุบันหรือหลักฐาน C-04/C-06; ให้ใช้ผล deployment และ revision จริงของแต่ละ release ยืนยันสถานะล่าสุด ไม่สร้าง billing/IAM/DB เอง

| รายการ | ค่า/สถานะ ณ ตอนเตรียม Issue #17 |
| --- | --- |
| Portal Resources ready time | [Portal screenshot](evidence/issue17-live-20261121/screenshots/13-team-resources.png) shows Resources ready, 6/6 complete and completion time 14:20:02 Thailand time; the date is not visible. Do not Activate again to collect a date. |
| Portal repository review | Operator screenshot reviewed main `87c77af07bfbb7f2b4e0d9ada4b69cd79a5c6b5f`; timestamp not captured. The Starter Kit layout warning is not a deployment failure. |
| Merge sequence | [PR #24](https://github.com/jetanin/LoungCheu/pull/24) merged into `lab5-staging` at 2026-11-20 23:18:57 +07; merge `5a6b3b5445c47fb56d2a97c1a007c314003a1070`. [PR #25](https://github.com/jetanin/LoungCheu/pull/25) merged into `main` at 2026-11-21 13:42:42 +07; merge `87c77af07bfbb7f2b4e0d9ada4b69cd79a5c6b5f`. |
| Release identification | Public `/api/ready` independently returned HTTP 200, `status=ready`, `db=connected`, `version=87c77af07bfbb7f2b4e0d9ada4b69cd79a5c6b5f`; see [raw response](evidence/issue17-live-20261121/readiness.json). This confirms the app's reported APP_VERSION, not an independently verified image/source binding. |
| Migration + seed | Operator reported successful execution [`scccd8b05-migrate-cbp4k`](https://console.cloud.google.com/run/jobs/executions/details/asia-southeast1/scccd8b05-migrate-cbp4k?project=670075229477), 1/1 complete. Command: `npm run db:migrate && npm run db:seed`. |
| Completion time | Operator supplied `2026-11-21T12:05:47.291764Z` (19:05:47.291764 +07); the [Cloud Shell screenshot](evidence/issue17-live-20261121/screenshots/15-cloud-run-cli.png) confirms this completion time belongs to the execution above. This is not the portal-ready or service deployment timestamp. |
| Session secret | Operator's command returned `Created version [1] of the secret [scccd8b05-app-secret-1]`. Intended runtime reference: `scccd8b05-app-secret-1:1`; no secret value retained. |
| Smoke | Operator output: PASS `/api/ready`, `/api/health`, `/login`, `/api/events`, `/api/not-a-real-route`; command `python3 deploy/smoke_test.py "$SERVICE_URL" --expected-commit "$SHA"`. Exact shell variable values were not printed in that transcript. |
| Manual business journey | Operator confirmed organizer login/create/publish PASS; participant view/register PASS; generic login rejection reported (inactive cause not independently established). The explicit rule/access evidence is now the full-capacity UI restriction for Participant B; no direct API rejection is claimed. Earlier login problem was reported; operator later confirmed normal use. Resolution details were not supplied; [screenshots now show the journeys](evidence/issue17-live-20261121/README.md#c-04-screenshot-gallery). |
| Revision / immutable image | Operator described `scccd8b05-00002-72x`; spec image and status.imageDigest agree on `sha256:d5a94a9d6a6f1cbd9ce93789d1f0bcf4af15062f56ca9ca523a1dd80c7a0f5b1`; see [revision output](evidence/issue17-live-20261121/revision.yaml). [Cloud Shell screenshot](evidence/issue17-live-20261121/screenshots/15-cloud-run-cli.png) confirms this is latestReadyRevisionName and receives 100% traffic. |
| C-04 screenshots | [25 supplied screenshots and captions](evidence/issue17-live-20261121/README.md#c-04-screenshot-gallery): URL-visible login, organizer create/publish and participant registration for Test2, supplementary generic login failure, explicit capacity restriction for One Participant, Cloud Run Console/CLI, Cloud SQL, runtime identity, registry and student IAM/secret access limitations. Refreshed screenshots inspected on 22 November 2026; release-tag/index/manifest mapping is now captured in image 16; [Supplemental Issue #17 evidence comment](https://github.com/jetanin/LoungCheu/issues/17#issuecomment-7077742818) was posted at `2026-11-22T10:21:45Z` (`2026-11-22 17:21:45 +07`), as returned by the GitHub API. It links the new resource/capacity/scaling images directly at evidence commit `c36f477012eb8856e67bc7c5364a9667a56fc2c3`; its body and all listed image paths were verified. No independently attested build provenance is claimed. |

ตรวจ/Activate เฉพาะทีมผ่าน portal ด้วย Gmail ที่ลงทะเบียน ไม่สร้าง infrastructure/IAM/DB เอง และไม่กด Activate ซ้ำระหว่างสร้างหรือเมื่อ Resources ready แล้ว ตรวจชื่อ resource จาก Team resources ก่อนใช้ describe/update; หากติดสิทธิ์ให้แจ้ง TA ตามประกาศใหม่ของรายวิชา

See the [live evidence index and C-04 checklist](evidence/issue17-live-20261121/README.md) and [Issue #17](https://github.com/jetanin/LoungCheu/issues/17). [Supplemental Issue #17 evidence comment](https://github.com/jetanin/LoungCheu/issues/17#issuecomment-7077742818) was posted at `2026-11-22T10:21:45Z` (`2026-11-22 17:21:45 +07`), as returned by the GitHub API. It links the new resource/capacity/scaling images directly at evidence commit `c36f477012eb8856e67bc7c5364a9667a56fc2c3`; its body and all listed image paths were verified. Issue #17 remains pending PR #27 CI/review/merge into lab5-staging, the reviewed release PR into main and final link/status checks. Restricted runtime-IAM/secret-inventory inspection is documented as unavailable with student permissions, not marked PASS and not a standalone review blocker. Do not block Episode 5 solely on full build provenance or the missing portal calendar date. #18 merge-gate/WIF proof, #19 automation/rollback and #20 persistence/report work are outside this change.

## Release procedure — Issue #19 / Guide Episode 7

Prerequisites: complete Episode 5 manual first deployment and Episode 6 `demo` environment/main merge gate. Confirm the actual service, job, image path and `SESSION_SECRET_REF` with the portal before merging the #19 release PR. `demo` provides `GCP_PROJECT_ID`, `GCP_REGION`, `WIF_PROVIDER`, `WIF_SERVICE_ACCOUNT`; if the session secret uses a non-default assigned slot/version, also set `SESSION_SECRET_REF`. Never place secret values in this file or the workflow. The #17 [manual first-deployment instructions](first-deployment.md) remain the historical procedure for that first release.

### First deployment history (#17)

- The automatic [run 44882261079](https://github.com/jetanin/LoungCheu/actions/runs/44882261079) on `49aa64543a3c5a3f6f4f46b37a6e6a59b65e05a4` **failed**. Earlier migration execution `scccd8b05-migrate-8qszm` also failed. Neither is successful first-deployment evidence; the underlying error was not supplied.
- `21ef6543c2c495e773ab89dd6f002dbe45c10286` subsequently changed the workflow to manual triggering. Later, at the operator's request, both workflow edits were removed from main history with a guarded force update back to `87c77af07bfbb7f2b4e0d9ada4b69cd79a5c6b5f`; the historical failed run above remains the event reference. The current documentation/evidence branch is [doc/17-first-deployment-evidence](https://github.com/jetanin/LoungCheu/tree/doc/17-first-deployment-evidence); this is not claimed to preserve those historical workflow commits. At that historical #17 baseline the deploy draft had no push trigger and disabled jobs. The current #19 workflow in this checkout enables automatic main releases after successful CI; this historical event is not a statement about the current remote main configuration. A failure or skipped run does not establish a successful deployment.
- PR #24 → `lab5-staging` and PR #25 → `main` are complete with passing CI; see [exact heads/runs](ci.md#pr-24-and-release-pr-25-verified-merge-and-ci).
- Manual release used the course project and existing team resources; no additional SQL/IAM provisioning is claimed. Runtime DB connection passed readiness. Portal-ready time, traffic/latestReadyRevisionName and Cloud Run Console/resource screenshots are now captured; only the portal completion time-of-day is visible, without a date. Release-tag/index/manifest mapping is captured in image 16; full build provenance is not imposed as an additional Episode 5 completion requirement.
- The operator reports updating [Issue #17](https://github.com/jetanin/LoungCheu/issues/17) with the public URL and new sanitized C-04 screenshots; tag/image/revision mapping is retained in the live evidence. Before closure, finish the reviewed evidence/release PR flow and verify the links. Do not overwrite `issue17-shared-cloud`: its 28 tests are offline historical evidence.
- Automated release/rollback (#19), required-check proof (#18), and restart/redeploy persistence plus final LEB2 PDF (#20) are separate tasks. This #17 resolution updates documentation/evidence only; it preserves the #19 workflow already present in the checkout without modifying it.

### Automatic release steps (#19)

1. Sync `lab5-staging` with the latest `main` merge commit, then create a feature branch from staging. Make the change and run relevant local checks. For #19, the change enables `.github/workflows/deploy.yml`; `ci-docker.yml`, `deploy/release.sh` and `deploy/smoke_test.py` are already project-specific and should not be overwritten with starter-kit copies.
2. Push the feature branch and open a `lab5`-labelled PR into `lab5-staging`, linked to its Issue. Wait for `CI & Docker Build / test-and-docker` on the current head to pass and obtain a specific teammate review. Merge the PR only after those gates pass; the author does not approve their own PR.
3. Open the release PR with base `main` and compare `lab5-staging`. Wait for the required CI check and teammate review again, then merge. A push to `main` starts `Deploy demo` automatically; no one runs `deploy/deploy.sh` for this release. The `test` job reuses `ci-docker.yml`, and `deploy` waits for it and only runs on `main`.
4. In `Deploy demo`, confirm the test job passed, WIF authentication succeeded without a key, the root Docker image was pushed with the full merge commit SHA, the migration job succeeded before Cloud Run service update, and the read-only smoke step passed. The run Summary records image commit, digest, revision and public URL. This smoke checks LoungCheu's `/api/ready`, `/api/health`, `/login` and anonymous API responses; it does not prove an authenticated domain journey. Record C-04 login/business screenshots separately.
5. Open the public URL. In Google Cloud Console, check the newest Cloud Run revision has 100% traffic and its image digest matches the run Summary; check the migration job's latest execution succeeded and Artifact Registry has the same full SHA tag. On the public `/api/health` and `/api/ready`, `data.version` must equal that deployed image SHA. Save direct PR/run links and these release identifiers for C-06 and the Lab 5 PDF evidence index.
6. To prove repeatability (Guide 7.7), sync staging with main again, create a second branch, make a small browser-visible change, run tests, and repeat the reviewed feature PR and release PR. The second merge into main must start a green `Deploy demo` run automatically; refresh the public URL and confirm the change and a newer Cloud Run revision. A first green deployment alone does not finish Episode 7.
7. For R-04/C-05, check separately that a record survives both application restart and redeploy; do not replace it with reseeded data. This is the persistence check after the release proof.

If a release fails, open the first red Actions step and then the Cloud Run job/revision logs as needed. Fix the cause through the reviewed PR path. An offline test or a parked/skipped run is not C-06 evidence. A manual `workflow_dispatch` is available only for `main`; a non-empty `image_tag` is reserved for an existing full-SHA team image and skips the build/migration in `release.sh`. Record rollback separately from the normal two automatic releases.

Docker พร้อมและผ่าน C-03 แล้วตามหลักฐานด้านล่าง ส่วน release end-to-end ของ #19 ต้องเติม actual PR/run links, SHA, digest, revision และ URL หลังตรวจจริง ไม่ใช้คำอธิบายแผนนี้แทนหลักฐาน C-06

ประวัติ #16/#17 ณ ตอนเตรียมโค้ด: Issue #16 มี [PR #23](https://github.com/jetanin/LoungCheu/pull/23) เข้า `lab5-staging`; [Actions run แรก](https://github.com/jetanin/LoungCheu/actions/runs/43740436556) ล้มเหลวตอน Prisma generation แล้ว [run หลังแก้](https://github.com/jetanin/LoungCheu/actions/runs/43741684848) ผ่านทุกขั้นบน commit `774d28f` ตาม [CI verification](ci.md) ต่อมา Issue #17 เพิ่มสคริปต์ `deploy/` สำหรับ manual first deployment และ offline checks ตาม [first-deployment.md](first-deployment.md) ส่วน release pipeline อัตโนมัติเป็นงาน #19; ผล live ให้ยืนยันจากหลักฐานของแต่ละ Issue ไม่อนุมานจากประวัติ offline นี้

## Issue #17: historical checklist from the code-review stage

รายการด้านล่างเป็นแผนที่บันทึกไว้ขณะ PR #24 ยังอยู่ระหว่างรีวิว ไม่ใช่รายงานสถานะปัจจุบันของ portal, service หรือ Issue #17 และไม่ใช่หลักฐานว่า first deployment ยังไม่เกิดขึ้น ผลจริงต้องอ้างจาก Issue #17/PR และ live deployment evidence โดยตรง ดูลำดับ [portal/main/manual deployment](first-deployment.md#portal-resource-status-and-main-repository-review)

1. ให้ CI ของ head ล่าสุดใน [PR #24](https://github.com/jetanin/LoungCheu/pull/24/checks) ผ่าน และให้เพื่อน review/merge เข้า lab5-staging จากนั้น release PR เข้า main พร้อม CI/review โดยไม่ deploy อัตโนมัติ
2. ใช้ Gmail ที่ลงทะเบียนเข้า portal ตรวจทรัพยากรทีม; ถ้ายังไม่ Activate ให้ทำครั้งเดียว ถ้ากำลังสร้างให้รอ ถ้า Resources ready แล้วไม่ Activate ซ้ำ
3. หลังโค้ดเข้า main ให้ portal ตรวจ repo/main SHA ใหม่แยกจากสถานะ provisioning และเตรียม session-secret reference ที่ตรงกับ slot ของทีม
4. รัน first deployment ด้วยมือจาก clean reviewed main; migration ต้องผ่านก่อน update service
5. ทดสอบ public URL, /api/ready, login และเส้นทางใช้งานจริง/กฎหรือสิทธิ์ แล้วเติม URL, source SHA, image digest, revision, ผล smoke และภาพพร้อม caption ในเอกสาร/Issue จึงปิด #17

ผล 28 tests ใน shared-course evidence เป็นผล offline ของ working tree ที่ระบุ hashes ไว้ ไม่ใช่ PR CI ของ commit ใหม่ ใช้ Actions run ที่สัมพันธ์กับ head ล่าสุดของแต่ละ PR เป็นหลักฐาน PR CI; หลัง push ทุกครั้งต้องตรวจใหม่ ไม่ใช้ผลก่อน commit แทน

## Verification ของ Issue #14 (ผลรอบก่อน)

ผล local verification วันที่ 15 พฤศจิกายน 2026: รอบแรกของ Issue #14 ใช้ baseline SHA ด้านบน รอบแก้ readiness/session และ seed ใช้ working tree บน `3472f7c` (commit ก่อนแก้ follow-up) ขณะบันทึกผลยังไม่มี commit สำหรับ follow-up นี้ จึงเป็นผล working tree ในเวลานั้น ไม่ใช่ release ที่ deploy แล้ว; ผล C-03 ที่ระบุ tested commit ชัดเจนอยู่ในหัวข้อ Issue #15 ด้านล่าง

| Command/check | ผลจริง |
| --- | --- |
| Read-only DB preflight ก่อน tests | เชื่อมและตรวจ `current_database()` เป็น `loungcheu_test` โดยไม่แสดง credentials |
| `npm run typecheck` | PASS ทั้ง workspaces และ tools |
| `npm test` | PASS 16 files / 167 tests รวม readiness พร้อม signed cookie/session store failure, create-only seed, concurrent seed และ guard ของ test fixtures |
| `npm run build` | client/server build output พร้อมใช้งาน; compiled readiness ผ่าน smoke ด้านล่าง |
| `npm run test:built` | PASS 4 checks: SPA `/login`, DB health/version, readiness และ unknown API JSON 404 |
| `npm run test:e2e` | PASS 37 Chromium tests ที่ ports 5183/3011 รวม login/domain journeys หลังใช้ test-only fixture reset |
| `git diff --check` | PASS สำหรับ tracked changes |

Browser E2E รอบ follow-up: sandbox run เริ่ม server ไม่ได้เพราะ Windows `uv_os_get_passwd` error ก่อนเริ่ม browser tests จึงรันใหม่ภายนอก sandbox หลังได้รับอนุญาตและผ่าน 37 tests ผลรอบ Issue #14 นี้ไม่ครอบคลุม live HTTPS login, clean-clone Docker หรือ OS-process restart; ต่อมา Issue #15 ทดสอบ clean-clone Docker และ local container recreation แล้วตามหลักฐาน C-03 ด้านล่าง ส่วน public GCP HTTPS/restart/redeploy ยังต้องตรวจในขั้นถัดไป

- ตรวจ config/PORT/listen, DB sessions, seed และไม่มี runtime file persistence จากโค้ด
- Tests ของ readiness ต้องครอบคลุม DB available/unavailable, 503 และไม่เผย error detail
- Tests เดิมต้องยังตรวจ secure cookie และ session หลัง recreate app ได้
## Verification ของ Issue #15 — C-03 ปัจจุบัน

- **PASS:** fresh remote clone ที่ commit `54fd6603594a7a2e0327aad93624796b61903cc5` build ด้วย `--no-cache --pull` และรันกับฐานข้อมูลใหม่แยกได้ โดยใช้ค่าตาม `.env.docker.example` ที่เติมเป็น private configuration; ไม่คัดลอก dependencies, build output, secret หรือ DB volume เดิม
- เก็บคำสั่ง, output, exit codes, tested commit, image ID และผลตรวจ source clean ใน [ดัชนีหลักฐาน C-03](evidence/c03-20261115-54fd660/README.md), [transcript](evidence/c03-20261115-54fd660/transcript.log) และ [manifest](evidence/c03-20261115-54fd660/manifest.json)
- ทดสอบ login/domain workflow และ local down/up แล้ว record กับ registration เดิมยังอยู่; รายละเอียดอยู่ใน [docker.md](docker.md#c-03-fresh-clone-evidence-15-november-2026)
- GCP public workflow มีผลรายงานในหลักฐาน #17 รอบจริงข้างบน; required-check merge gate (C-02) และ GCP live restart/redeploy ยังไม่ทำ เป็นงาน Issues ถัดไป; PR CI ของ Issue #16 ผ่านแล้วตามหัวข้อด้านบน หลักฐาน local C-03 นี้ไม่ใช่หลักฐาน GCP C-04/C-05 หรือ pipeline C-06

หลังส่ง Lab 5 ให้คง service/repository public จนผู้สอนประกาศจบการตรวจ ห้าม teardown หรือหยุด DB ทันทีหลังส่ง PDF

## C-04 screenshots

See the [screenshot gallery with 25 images and captions](evidence/issue17-live-20261121/README.md#c-04-screenshot-gallery). The refreshed app images show the public URL and the gallery includes Cloud Run Console/CLI. Release-tag/index/manifest mapping is documented in image 16. [Supplemental Issue #17 evidence comment](https://github.com/jetanin/LoungCheu/issues/17#issuecomment-7077742818) was posted at `2026-11-22T10:21:45Z` (`2026-11-22 17:21:45 +07`), as returned by the GitHub API. It links the new resource/capacity/scaling images directly at evidence commit `c36f477012eb8856e67bc7c5364a9667a56fc2c3`; its body and all listed image paths were verified. Review/merge and final Issue status remain follow-up items; this does not claim Issue #17 is closed.

## Release tag and image identity

[Image 16](evidence/issue17-live-20261121/screenshots/16-image-tag-digest.png) verifies tag `87c77af07bfbb7f2b4e0d9ada4b69cd79a5c6b5f` → OCI index `sha256:e4054b99bf312ef871bd08e4c660599961da94638397d0d90954ee8a01ea5397` → linux/amd64 manifest `sha256:d5a94a9d6a6f1cbd9ce93789d1f0bcf4af15062f56ca9ca523a1dd80c7a0f5b1`. This child digest matches revision `scccd8b05-00002-72x` in [revision.yaml](evidence/issue17-live-20261121/revision.yaml); [service output](evidence/issue17-live-20261121/screenshots/15-cloud-run-cli.png) records 100% traffic to that revision. This is tag-to-deployed-image identity evidence, not an independently attested build from source. [Supplemental Issue #17 evidence comment](https://github.com/jetanin/LoungCheu/issues/17#issuecomment-7077742818) was posted at `2026-11-22T10:21:45Z` (`2026-11-22 17:21:45 +07`), as returned by the GitHub API. It links the new resource/capacity/scaling images directly at evidence commit `c36f477012eb8856e67bc7c5364a9667a56fc2c3`; its body and all listed image paths were verified. Review/merge and final Issue/project status are not marked complete by this edit.

## Capacity restriction and resource verification follow-up

The [One Participant capacity sequence](evidence/issue17-live-20261121/README.md#capacity-restriction--one-participant) is the primary explicit restriction evidence: organizer publishes one seat, Participant A fills it, and Participant B sees 0/1 seats with an unavailable/full message and disabled registration button. This proves the UI restriction; no direct API rejection test is claimed. The generic inactive-login screenshot is supplementary and does not establish the account's disabled state independently.

The [Guide 5.7 resource record](evidence/issue17-live-20261121/README.md#guide-57-resource-checks-and-access-limitations) captures Cloud SQL RUNNABLE with storageAutoResize=false, the runtime service account name and the Docker repository. Student IAM/Secret Manager inventory reads are denied; runtime grants and inventory remain unverified because student detail access is denied. Portal, successful deploy/migration and readiness are used only as functional evidence; inaccessible detail screens alone do not block PR review. No IAM/resource changes were made by this documentation update.

Images 17–23 (including 20a/20b/20c) were added after the initial evidence set. [Supplemental Issue #17 evidence comment](https://github.com/jetanin/LoungCheu/issues/17#issuecomment-7077742818) was posted at `2026-11-22T10:21:45Z` (`2026-11-22 17:21:45 +07`), as returned by the GitHub API. It links the new resource/capacity/scaling images directly at evidence commit `c36f477012eb8856e67bc7c5364a9667a56fc2c3`; its body and all listed image paths were verified. Complete PR #27 CI/review/merge into lab5-staging, a reviewed release PR into main and final link/status checks before marking Done. TA clarification can be recorded if obtained; inaccessible detail screens alone are not a review blocker. A full attested build or a portal calendar date is not an additional completion condition imposed here.

## Scope of functional evidence and student access

บัญชีนักศึกษาไม่มีสิทธิ์ดูรายละเอียดบางรายการ จึงอ้างอิง portal, ผล deploy, migration และ readiness แทน โดยไม่อ้างว่าได้ตรวจรายการ API, รายชื่อ secrets หรือ IAM grants ครบแล้ว การเข้าถึงหน้าที่ถูกจำกัดสิทธิ์ไม่เป็นเงื่อนไขขวางการรีวิว PR เพียงอย่างเดียว

- **Database:** portal แสดงการเตรียมฐานข้อมูล, migration/seed สำเร็จ และ `/api/ready` ตอบ `db=connected` จึงยืนยันว่าแอปเชื่อมและใช้ฐานข้อมูลได้ ไม่อ้างว่าเปิดตรวจหน้ารายชื่อ database แล้ว
- **Enabled APIs:** Resources ready และผล deployment/migration/readiness เป็นหลักฐานเชิงการทำงานของเส้นทางที่ใช้ ไม่ได้ตรวจรายการ enabled APIs ทีละตัว และไม่สรุปว่าทุก API ถูกเปิด
- **Min instances:** สคริปต์/คำสั่ง deploy ที่จัดเตรียมตั้ง `0`; [ผล CLI จริง](evidence/issue17-live-20261121/screenshots/23-min-instances-config.png) ไม่พบ `minScale` ทั้งระดับ service และ revision template จึงสอดคล้องกับค่าเริ่มต้น 0 ตาม [เอกสาร Cloud Run](https://docs.cloud.google.com/run/docs/configuring/min-instances) เป็นการอ่าน configuration ผ่าน CLI ไม่ได้อ้างว่าเห็นค่า 0 ใน Console หรือวัดจำนวน instance ที่กำลังรันอยู่
- **Secret Manager / IAM:** [ภาพ Secret Manager](evidence/issue17-live-20261121/screenshots/21-secret-manager-access.png) แสดง `secretmanager.secrets.list` ถูกปฏิเสธ และ [ภาพ IAM](evidence/issue17-live-20261121/screenshots/22-iam-access.png) แสดงว่าอ่าน project IAM policy ไม่ได้ จึงระบุว่า **ตรวจรายละเอียดไม่ได้ด้วยสิทธิ์นักศึกษา** ไม่ติ๊กว่า inventory/grants ตรวจผ่าน ไม่สรุปว่า secrets หรือ runtime permissions ไม่มี และไม่ใช้การเข้าหน้ารายละเอียดไม่ได้เป็นเหตุขวาง PR review เพียงอย่างเดียว ผล portal/deploy/migration/readiness เป็นหลักฐานเชิงการทำงานตามขอบเขตที่ตรวจได้

เพิ่ม[คอมเมนต์หลักฐานชุดใหม่ใน Issue #17](https://github.com/jetanin/LoungCheu/issues/17#issuecomment-7077742818) แล้ว ครอบคลุมภาพ 17–23 รวม 20a/20b/20c; GitHub API ยืนยันเวลาสร้าง `2026-11-22T10:21:45Z` (`2026-11-22 17:21:45 +07`) และตรวจลิงก์ภาพในคอมเมนต์แล้ว งานคงเหลือคือให้ [PR #27](https://github.com/jetanin/LoungCheu/pull/27) ผ่าน CI/review และ merge เข้า lab5-staging จากนั้น release PR เข้า main ตาม flow ทีม ตรวจลิงก์ก่อนอัปเดต Issue/project เป็น Done ไม่บังคับให้ขยายสิทธิ์ใน shared project เพื่อถ่ายภาพ และไม่ใช้ build provenance เต็มรูปแบบหรือวันที่ portal เป็นเหตุค้างโดยลำพัง

## Min instances and restricted-access evidence

- **Min instances:** [image 23](evidence/issue17-live-20261121/screenshots/23-min-instances-config.png) is actual `gcloud run services describe` output. It does not contain service-level `run.googleapis.com/minScale` or revision-template `autoscaling.knative.dev/minScale`. Together with [Cloud Run's documented minimum-instance defaults](https://docs.cloud.google.com/run/docs/configuring/min-instances), this supports the default minimum of 0 without claiming an explicit Console value. The visible `maxScale` values are maximum limits, not minimum instances. This does not measure live instance count.
- **Secret Manager:** [image 21](evidence/issue17-live-20261121/screenshots/21-secret-manager-access.png) shows `PERMISSION_DENIED` for `secretmanager.secrets.list`. Inventory inspection is unavailable to the student, not marked PASS; it does not imply missing secret resources or runtime access failure.
- **IAM:** [image 22](evidence/issue17-live-20261121/screenshots/22-iam-access.png) shows the student cannot read project IAM policy. [Image 18](evidence/issue17-live-20261121/screenshots/18-runtime-service-account.png) identifies the runtime account but does not enumerate its grants. IAM inspection is not marked PASS.

บัญชีนักศึกษามีข้อจำกัดในการดูรายละเอียด จึงใช้ portal, ผล deploy/migration และ readiness เป็นหลักฐานเชิงการทำงานแทน โดยไม่อ้างว่าตรวจ inventory/IAM grants ครบแล้ว ข้อจำกัด read access นี้ไม่เป็นเหตุขวางการรีวิว PR เพียงอย่างเดียว; เพิ่ม[คอมเมนต์หลักฐานชุดใหม่](https://github.com/jetanin/LoungCheu/issues/17#issuecomment-7077742818) แล้ว โดยเวลา GitHub API คือ `2026-11-22T10:21:45Z` (`2026-11-22 17:21:45 +07`); งานคงเหลือคือ PR #27 ผ่าน CI/review/merge เข้า lab5-staging ตามด้วย release PR เข้า main และตรวจลิงก์ก่อนเปลี่ยนสถานะ Done

## Issue #17 comment records

- Initial text-only record: [comment 7063132101](https://github.com/jetanin/LoungCheu/issues/17#issuecomment-7063132101), created `2026-11-21T13:14:58Z`. Its pending-image notes and old branch link are historical; do not count it as the later screenshot submission.
- Supplemental record with direct pinned image links: [Supplemental Issue #17 evidence comment](https://github.com/jetanin/LoungCheu/issues/17#issuecomment-7077742818) was posted at `2026-11-22T10:21:45Z` (`2026-11-22 17:21:45 +07`), as returned by the GitHub API. It links the new resource/capacity/scaling images directly at evidence commit `c36f477012eb8856e67bc7c5364a9667a56fc2c3`; its body and all listed image paths were verified.

The initial and new evidence sets are now distinguished and dated from GitHub metadata. PR #27/release review and merge, final link checks and Done/Close remain separate tasks. IAM/Secret Manager/API detail inspection is still limited as documented; no inventory/grants/API PASS is asserted.
