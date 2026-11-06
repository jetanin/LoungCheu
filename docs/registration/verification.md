# F-03 — actual verification

## Current integration with staging (6 พ.ย. 2026)

ฐาน `6e8a24c` จาก origin/sprint-1-staging ขณะบันทึกยังเป็น merge working tree ที่ผู้ใช้จะ stage/commit เอง

- db:generate/typecheck/build: PASS ตาม scripts ของเพื่อน; Vite 6.4.5/React 19.3.1/Bootstrap 5.3.8 ของ staging
- `npm test`: **9 files / 110 passed / 0 failed/skipped**, 09:54:57 Asia/Bangkok; 62 unit/HTTP/UI + 31 auth integration + 17 registration integration
- Registration integration ใช้ HTTP Login/session cookie/fresh CSRF ของเพื่อนจริง เพิ่ม token rotation/logout/inactive/absolute-expiry checks ไม่ inject auth guards ใน DB suite
- Concurrency/lock-wait ใช้ PostgreSQL จริงและ independent connections บน events; ORM camelCase และ DB snake_case ตาม staging
- Migrate/seed: PASS Docker app DB loung-cheu-database และ test DB loungcheu_test ที่ 5432 โดยเก็บฐานเก่าไว้
- test:built: PASS 3 checks; test:local-db: PASS health/anonymous/both-role Login/Identity/Logout
- Dependency audit: 0 vulnerabilities
- `npm run test:e2e`: **7 passed (10.9s)** หลังติดตั้ง Chromium ตรง Playwright เป็น browser regression ของ auth เดิม ยังไม่ใช่ full registration UI journey

Environment เป็น Node 24.15.0 ของเครื่อง ขณะที่ package ของเพื่อนประกาศ Node >=22.16 <23 จึงมี EBADENGINE warning; คง runtime policy ของ staging ยังไม่อ้าง clean reproduction บน Node 22 ในรอบนี้

Attempts: Docker Desktop เริ่มไม่ได้จาก dockerInference socket; ผู้ใช้แก้ให้รันได้แล้วจึงทำ DB checks ต่อ Empty legacy migration directories ทำให้ migrate ครั้งแรก P3015; นำ directories ว่างออกแล้ว migrations ทั้งสอง DB ผ่าน Browser regression ครั้งแรก fail ก่อนเข้า assertions เพราะยังไม่มี Chromium binary รุ่นที่ตรง Playwright; ติดตั้งและ rerun ผ่านทั้ง 7 tests แล้ว

ยังรอ #2 Event APIs และ #4 views เพื่อทำ complete UI journey/restart/teammate acceptance ส่วน unit router tests ยังคง isolated harness ตามปกติ

---

## Historical record — ก่อนใช้ staging เป็น base

เนื้อหาด้านล่างเป็นผลของโครงเดิม ไม่ใช่ runtime/commands ปัจจุบัน SHA และคำว่า unchanged ใน TDD record อ้าง snapshot ณ เวลานั้น หลัง merge ปรับ assertions ให้ตรวจ error.code ของ error class เพื่อน

วันที่ 6 พ.ย. 2026 (Asia/Bangkok) | ทำงานบน `feature/registration`, base `dafbf4f`

ทดสอบ working tree ที่ยังไม่ commit เพราะผู้ใช้จะรัน Git/GitHub commands เอง ต้องเติม commit จริงหลัง commit และยืนยัน checks บน revision นั้นก่อนส่งรายงาน

Environment: Windows, Node 24.15.0, npm 11.11.0, Docker 29.2.1, PostgreSQL 17.11 จาก `postgres:17-alpine`; Prisma 7.10.1 + adapter-pg, Vitest 5.1.0, React 19.2.0, Vite 8.3.6, Bootstrap 5.3.8; dependency tree ตาม package-lock.json

## Results

| Command / evidence | Actual result |
|---|---|
| `npm run generate` | PASS, Prisma 7.10.1 client generated |
| `npm run typecheck` | PASS, server/client source, tests และ config |
| `npm run build` | PASS, server TypeScript และ client Vite production build (18 transformed modules) |
| `npm test` | PASS: 4 files, 39 tests, 0 failed/skipped (02:07:52 Bangkok) |
| `npm run test:db` | PASS: 1 file, 15 tests, 0 failed/skipped (02:03:32 Bangkok); PostgreSQL จริงบน Docker |
| `npm run migrate -w server` | PASS ทั้ง local และ test DB; migration deploy ซ้ำตอบ no pending migrations |
| Final dependency installation audit | 0 vulnerabilities (354 packages audited) |
| `docker compose ps` | db และ db-test healthy; loopback ports 5432 และ 55433 |
| Vite dev HTTP smoke | `/`, `/events/{UUID}`, `/src/main.tsx`, `/src/features/registrations/RegistrationPage.tsx` ตอบ HTTP 200 |
| Backend startup follow-up | `npm run start -w server` เปิด listener ที่ 127.0.0.1:3000; POST registration ตอบ 401 AUTH_REQUIRED เมื่อยังไม่ได้เชื่อม #1; typecheck/backend build ผ่าน |

Build artifacts: client/dist/index.html + Bootstrap CSS bundle + JS bundle; server/dist มี module build และ server.js ซึ่งเปิด listener ด้วย guards ที่ปฏิเสธคำขอไว้จนกว่า #1 จะเชื่อม auth จริง HTTP smoke เป็นการตรวจ serve/transform เท่านั้น ไม่ใช่ browser E2E

## Traceability สำหรับ #3

| AC / planned TEST | Actual file/test | Coverage / limitation |
|---|---|---|
| AC-12 / TEST-15 | server/tests/integration/registration.test.ts — persists session-owned ACTIVE and exact post-lock timestamp | API 201/schema, trusted identity, committed DB readback; own GET ผ่าน #4 ยังรอ |
| AC-13 / TEST-16 | integration — rejects duplicate with unchanged record at capacity 1/2; unit rules — reports duplicate before capacity | PASS record/reference/count/time ไม่เปลี่ยน และ duplicate มาก่อน full |
| AC-14 / TEST-17 | integration — rejects full event without inserting a loser | PASS ผู้แพ้ไม่มี record |
| AC-15 / TEST-18 | integration — DRAFT/CLOSED/missing, offsets -1/0/+1 ms, expired duplicate/full, clock crosses deadline while waiting | PASS scope/open precedence และอ่าน clock หลัง PostgreSQL lock จริง |
| AC-16 / TEST-19 | integration — rejects role, missing identity, CSRF, Origin, spoofing; server/tests/unit/registration-router.test.ts | PASS boundary/DB no-write โดย **inject auth/CSRF guards**; real session integration ยังรอ #1 |
| AC-17 / TEST-20/21 | integration — allocates exactly one last seat; inserts only one concurrent registration for same participant | PASS distinct clients/pool connections, external held-row barrier, ตรวจ pg_stat_activity ว่าทั้งคู่รอ Lock ก่อน release; count=1 |
| F-03 UI / AC-26 ส่วนที่เกี่ยวข้อง | client/src/features/registrations/RegistrationAction.test.tsx; RegistrationPage.test.tsx | PASS pending clicks, success/ref, conflict/availability, auth expiry, timeout/network ambiguity, token fetch failure, stale-response/account isolation และ page fetch/retry |
| TEST-32 ส่วน error contract | server/tests/unit/registration-router.test.ts | PASS malformed JSON/UUID/body/spoofing/auth→role→CSRF→input order และ generic 500 ไม่มี SQL |

Concurrency ใช้ Prisma pools แยก max=1 ต่อ client และ observer connection ใหม่จาก transaction ผู้ลงทะเบียน Fixtures commit ก่อนเริ่ม race ไม่ใช้ mocked locks และไม่ครอบทุก request ด้วย fixture transaction เดียว

## TDD red → green

1. เขียน `server/tests/unit/registration-rules.test.ts` ก่อนเติม implementation; เริ่มจาก functions สองตัวที่ไม่ตรวจอะไร
2. รัน `npm test -- --reporter=verbose` วันที่ 6 พ.ย. 2026 เวลา 01:49:22: **6 failed / 2 passed (8)** ด้วย Vitest 3.2.4 Assertions ล้มด้วย `expected [Function] to throw an error` สำหรับ missing/DRAFT, CLOSED, deadline 0/+1 ms, duplicate และ full นี่เป็น business-rule red ไม่ใช่ syntax/environment failure
3. เติมกฎใน rules.ts และ transaction service; suite เดิม 8 tests ผ่านใน green รวมอยู่ใน 39 tests ล่าสุด
4. อัปเดต dependencies หลัง red ให้เป็น stable versions ที่ audit ไม่พบช่องโหว่; tests ของกฎทั้ง 8 ข้อไม่ได้เปลี่ยน

SHA-256 ของ red source snapshot ที่วัดก่อนเติม implementation:

```text
server/src/modules/registrations/rules.ts
580AF50C95D0B9A8E684AB2343029F3AF703A51B60CE150188CF5DA5D4C7BA24

server/tests/unit/registration-rules.test.ts (unchanged test source)
38579B20FB06112FB9CBEDBAF179B3D7E6403CA944431CB6B78D2700AC5980D4
```

Red implementation ตอนนั้น:

```typescript
export interface RegistrationEvent {
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  registration_closes_at: Date;
  capacity: number;
}

export function assertRegistrationOpen(event: RegistrationEvent | null, now: Date): void {
  // TDD starting point: rules will be added after running the regression cases.
}

export function assertSeatAvailable(alreadyRegistered: boolean, count: number, capacity: number): void {
}
```

นี่เป็น execution record + source snapshot ใน working tree ไม่มี red/green commits แยกให้ยืนยัน อย่าอ้างว่าเป็น Git commit-sequence evidence ครบตาม DoD

## Failures ที่พบระหว่างพัฒนา

- Sandbox ปฏิเสธ npm/Prisma engine DNS, Docker named pipe และ localhost connections (EACCES) จึง rerun ด้วยสิทธิ์ที่อนุมัติ; checks รอบสุดท้ายผ่านนอก sandbox ตามที่จำเป็น
- ช่วงก่อน generate Prisma client typecheck ไม่ผ่าน; generate แล้วและตรวจใหม่ผ่าน
- Dependency รุ่นแรกมี advisories; เปลี่ยนเป็น Prisma 7.10.1/Vitest 5.1.0 และ dependency audit ล่าสุดเป็น 0

ไม่มีการนับ failures ของ environment เป็น TDD red

## Not executed / incomplete

- Actual session login/logout/expiry/CSRF integration ของ #1
- Full event-create/publish/register/own-list/roster journey และ #4 Registration Views
- Browser E2E/visual QA, manual web-process restart และ teammate clean reproduction
- Teammate review, GitHub PR/board evidence, tested commit/release และ Product DoD completion

AI assistance: Codex เขียน source/tests/เอกสารและรัน commands ที่ระบุ ผลข้างต้นเป็นผลที่สังเกตจริงใน session นี้ ยังไม่ใช่ independent teammate acceptance
