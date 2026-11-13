# CPE 334 Project Deliverable 1: Engineering Baseline and Working Sprint 1

**Semester 1/2026 | Department of Computer Engineering, KMUTT**

---

## Submission Metadata & Navigation

### Team Information
* **Theme / Project Name:** LoungCheu (ระบบบริหารจัดการและลงทะเบียนกิจกรรมชุมชนแบบอะตอมมิก)
* **Repository URL:** https://github.com/jetanin/LoungCheu
* **Target Release Tag / Commit on main:** `v1.0.0-sprint-1` (Staging Integration Candidate: `97a5b91`)
* **Members:**
  1. นายเจตนินทร์ นายโท (Jetanin Naitho) — รหัสนักศึกษา 67070501011 (GitHub: `@jetanin`)
  2. นายปภังกร ล่วนเส้ง (Paphangkorn Luanseng) — รหัสนักศึกษา 67070501083 (GitHub: `i3artuf`)

---

### Navigation Table (ตารางนำทางโครงสร้างรายงาน Parts A–F)

| Part | Section | Description / Key Artifacts | Identifiers (IDs) |
|:---:|:---|:---|:---|
| **A** | **Software Requirements Specification (SRS)** | Stakeholders, User Context, Scopes/Exclusions, FRs, BRs, NFRs, Architectural Decisions | FR-01–15, BR-01–14, NFR-01–09, DEC-01–17 |
| **B** | **Feature Inventory & Traceability** | Feature Mapping to Requirements, Planned Sprints, Traceability Matrix, Coverage Analysis | F-01–09, SYS-01–06, AC-01–27 |
| **C** | **System-Level Software Design Specification (SDS)** | Architecture Stack, ERD/Data Models, API Error Protocols, RBAC Permission Matrix, Deployment Plan | Components (UI/API/DB), Models, Endpoints |
| **D** | **Three-Sprint Plan** | Sprint 1–3 Goals, Feature Scope Allocations, Dependencies, Delivery Checkpoints | Sprints 1, 2, 3 |
| **E** | **Sprint 1 Engineering Contracts & STS** | Feature Design Contracts, Detailed ACs, Software Test Specification (STS), Product Definition of Done | AC-01–27, TEST-01–36, DoD-01–10 |
| **F** | **Working Sprint 1 & Verification Evidence** | Program Demonstrations (Screenshots), Automated Test Results, Test Excerpts (TDD), Git Workflow Chains, Contributions | EV-01–12, PR #7, PR #10, Commit 97a5b91 |

---

## Part A: SRS and Product Scope

### 1. Stakeholder Problem & Context
* **Problem Statement:** การจัดกิจกรรมสัมมนา เวิร์กช็อป หรือกิจกรรมชุมชน มักประสบปัญหาเรื่องการลงทะเบียนเกินจำนวน (Overbooking), การแย่งชิงที่นั่งพร้อมกัน (Concurrency Race Conditions), และความไม่ปลอดภัยของข้อมูลผู้เข้าร่วมงาน 
* **Target Users (Actors):**
  1. **Organizer (OA / OB):** ผู้จัดกิจกรรม มีหน้าที่สร้าง แก้ไข กำหนดเวลา และเผยแพร่กิจกรรม ตลอดจนตรวจสอบรายชื่อผู้ลงทะเบียน (Roster) ของตนเอง
  2. **Participant (PA / PB):** สมาชิกผู้เข้าร่วม มีหน้าที่ค้นหาและดูรายละเอียดกิจกรรม ลงทะเบียนเข้าร่วม และตรวจสอบรายการที่ตนเองลงทะเบียนไว้
  3. **Anonymous User:** ผู้ใช้งานทั่วไปที่ยังไม่เข้าสู่ระบบ สามารถดูรายละเอียดกิจกรรมที่เผยแพร่แล้วได้ แต่ไม่สามารถลงทะเบียนหรือจัดการกิจกรรมได้

### 2. Functional Requirements (FR) & Business Rules (BR)
* **FR-01 (Authentication):** ระบบต้องรองรับการ Login ด้วย Username/Password และ Logout อย่างปลอดภัย โดยส่งกลับ HTTP Session Cookie
* **FR-02 (Identity Context):** ระบบต้องระบุตัวตนและ Role ของผู้ใช้ปัจจุบันผ่าน Endpoint `/api/auth/me`
* **FR-03 (Event Creation):** Organizer สามารถสร้าง Event ในสถานะ DRAFT โดยกำหนดชื่อ รายละเอียด สถานที่ จำนวนรับสูงสุด และช่วงเวลาได้
* **FR-04 (Event Publishing):** Organizer สามารถเปลี่ยนสถานะ Event จาก DRAFT เป็น PUBLISHED ได้เมื่อข้อมูลครบถ้วนและถูกต้องตาม Business Rules
* **FR-05 (Public Event Discovery):** ระบบต้องแสดงรายการและรายละเอียดของ Event ที่อยู่ในสถานะ PUBLISHED ให้ผู้ใช้ทุกคนเข้าชมได้
* **FR-06 (Atomic Event Registration):** Participant สามารถลงทะเบียน Event ที่ PUBLISHED ได้ ภายใต้เงื่อนไขความจุและเวลาที่กำหนด โดยระบบต้องบันทึกแบบ Atomic Transaction
* **FR-07 (Participant Registration Views):** Participant สามารถดูรายการกิจกรรมที่ตนเองลงทะเบียนไว้ และดูรายละเอียดการลงทะเบียนของตนเองได้
* **FR-08 (Organizer Attendee Roster):** Organizer สามารถดูรายชื่อผู้ลงทะเบียนทั้งหมดในกิจกรรมที่ตนเองเป็นเจ้าของได้

#### Key Business Rules (BR)
* **BR-01 (Role Isolation):** เฉพาะผู้ใช้ Role `ORGANIZER` เท่านั้นที่สามารถสร้างและแก้ไข Event ได้
* **BR-02 (Event Publishing Preconditions):** Event จะสามารถ PUBLISH ได้ก็ต่อเมื่อกำหนดเวลาปิดรับลงทะเบียนเกิดขึ้นก่อนเวลาเริ่มกิจกรรม และเวลาเริ่มเกิดขึ้นก่อนเวลาสิ้นสุด
* **BR-03 (Single Active Registration per User):** Participant หนึ่งคนสามารถลงทะเบียนใน Event หนึ่งได้เพียง 1 ครั้งเท่านั้น (Prevent Duplicate Registration)
* **BR-04 (Capacity Limit Enforcement):** การลงทะเบียนต้องไม่เกินจำนวนรับสูงสุด (Capacity) ของ Event เมื่อเต็มแล้ว ระบบต้องปฏิเสธด้วย HTTP 409 Conflict
* **BR-05 (Registration Time Window):** ระบบต้องปฏิเสธการลงทะเบียนหากเวลาปัจจุบันเลยเวลาปิดรับลงทะเบียน (Registration Closed)
* **BR-06 (Data Privacy & Roster Ownership):** Organizer A ไม่สามารถดูรายชื่อผู้ลงทะเบียนของกิจกรรมที่ Organizer B เป็นเจ้าของได้ (HTTP 404/403) และ Participant A ไม่สามารถดูข้อมูลการลงทะเบียนของ Participant B ได้

### 3. Non-Functional Requirements (NFR)
* **NFR-01 (Strict Concurrency Control):** ระบบต้องป้องกัน Race Condition ในการลงทะเบียนพร้อมกันผ่าน Database Row-level Locking หรือ Atomic Transaction
* **NFR-02 (Secure Credential Storage):** รหัสผ่านต้องถูกเข้ารหัสด้วย Algorithmic Hashing ที่ปลอดภัย (เช่น Scrypt หรือ Bcrypt) ห้ามเก็บเป็น Plain Text
* **NFR-03 (Zero Secret Leakage):** รหัสผ่าน, Tokens, หรือค่า Environment Configuration ต้องไม่ถูกเปิดเผยผ่าน Client Bundle หรือ Public API Responses
* **NFR-04 (Responsive UI Layout):** ส่วนต่อประสานผู้ใช้ต้องรองรับหน้าจอ Desktop (1280px), Tablet (768px), และ Mobile (390px, 320px)

---

## Part B: Feature Inventory and Traceability

### 1. Feature Baseline Inventory
* **F-01 (User Authentication & Session Management):** ระบบยืนยันตัวตน, จัดการ Session Cookie, และควบคุม Role-based Access (Sprint 1)
* **F-02 (Event Management & Publishing Workflow):** ฟังก์ชันสร้าง แก้ไข ตรวจสอบความถูกต้องของช่วงเวลา และเผยแพร่กิจกรรม (Sprint 1)
* **F-03 (Atomic Event Registration):** กลไกลงทะเบียนกิจกรรมแบบ Transactional Lock ป้องกัน Duplicate และ Overbooking (Sprint 1)
* **F-04 (Participant My Registrations):** หน้าแสดงประวัติและรายละเอียดการลงทะเบียนของผู้เข้าร่วม (Sprint 1)
* **F-05 (Organizer Event Attendee Roster):** หน้ารายชื่อและสถิติผู้เข้าร่วมสำหรับผู้จัดกิจกรรม (Sprint 1)
* **F-06 (Event Cancellation & Capacity Modification):** การปรับปรุงความจุและยกเลิกกิจกรรม (Sprint 2)
* **F-07 (Registration Cancellation Workflow):** การยกเลิกการลงทะเบียนและคืนโควต้า (Sprint 2)
* **F-08 (Advanced Search & Categorization):** การค้นหากิจกรรมตามหมวดหมู่และช่วงเวลา (Sprint 3)
* **F-09 (Check-in & Attendance Verification):** ระบบเช็คอินหน้างานด้วย Ticket Code / QR Code (Sprint 3)

### 2. Requirements-to-Feature Traceability Matrix (Summary)
* `FR-01, FR-02, BR-01, NFR-02, NFR-03` ➡️ **F-01** (Sprint 1: AC-01–05 / TEST-01–07)
* `FR-03, FR-04, FR-05, BR-02, NFR-04` ➡️ **F-02** (Sprint 1: AC-06–11 / TEST-08–14)
* `FR-06, BR-03, BR-04, BR-05, NFR-01` ➡️ **F-03** (Sprint 1: AC-12–17 / TEST-15–21)
* `FR-07, BR-06` ➡️ **F-04** (Sprint 1: AC-18–20 / TEST-22–25)
* `FR-08, BR-06` ➡️ **F-05** (Sprint 1: AC-21–24 / TEST-26–29)
* Cross-cutting Persistence & Resilience ➡️ **SYS-01–06** (Sprint 1: AC-25–27 / TEST-30–36)

---

## Part C: System-Level SDS

### 1. System Architecture & Tech Stack
* **Client Architecture:** React 18 SPA พัฒนาด้วย TypeScript และ Vite พร้อม TailwindCSS/Custom Modular CSS สำหรับ Responsive UI
* **Application / Server Layer:** Node.js v22 พร้อม Express framework ในรูปแบบ Modular Architecture แยกตาม Business Domains
* **Database & ORM:** PostgreSQL 17 จัดการโครงสร้างข้อมูลและการทำ Migration ด้วย Prisma ORM
* **Testing Frameworks:** Vitest สำหรับ Unit และ Integration Testing, Supertest สำหรับ API Testing, Playwright สำหรับ Browser E2E Testing

### 2. Domain Data Model & Relational Schema
* **User (Account):**
  * `id` (UUID, PK), `username` (VARCHAR, Unique), `passwordHash` (TEXT), `fullName` (VARCHAR), `role` (ENUM: `ORGANIZER`, `PARTICIPANT`), `createdAt`, `updatedAt`
* **Event:**
  * `id` (UUID, PK), `title` (VARCHAR), `description` (TEXT), `location` (VARCHAR), `capacity` (INT), `status` (ENUM: `DRAFT`, `PUBLISHED`, `CANCELLED`), `registrationDeadline` (TIMESTAMPTZ), `eventStart` (TIMESTAMPTZ), `eventEnd` (TIMESTAMPTZ), `organizerId` (UUID, FK -> User.id)
* **Registration:**
  * `id` (UUID, PK), `eventId` (UUID, FK -> Event.id), `userId` (UUID, FK -> User.id), `status` (ENUM: `CONFIRMED`, `CANCELLED`), `registeredAt` (TIMESTAMPTZ)
  * *Constraint:* Unique Compound Index บน `(eventId, userId)` เพื่อป้องกันการลงทะเบียนซ้ำในระดับ Database Engine

### 3. API Conventions & Access Security
* **Authentication Scheme:** HTTP-Only, SameSite Session Cookies เพื่อป้องกัน XSS และ Token Interception
* **Safe Error Handling:** ปฏิเสธการส่ง stack traces ใน production; ทุก error response ส่งกลับในรูปแบบมาตรฐาน `{ error: { code: string, message: string } }`
* **RBAC Matrix:**
  * `POST /api/events` ➡️ เฉพาะ `ORGANIZER`
  * `POST /api/events/:id/publish` ➡️ เฉพาะ `ORGANIZER` ที่เป็นเจ้าของ Event
  * `POST /api/events/:id/registrations` ➡️ เฉพาะ `PARTICIPANT`
  * `GET /api/events/:id/roster` ➡️ เฉพาะ `ORGANIZER` ที่เป็นเจ้าของ Event
  * `GET /api/registrations/mine` ➡️ เฉพาะ `PARTICIPANT` (เห็นเฉพาะข้อมูลของตนเอง)

---

## Part D: Three-Sprint Plan

| Sprint | Goal & Core Outcomes | Included Features | Deliverable & Target Date |
|:---:|:---|:---|:---|
| **Sprint 1** | **Engineering Baseline & Core Transaction Slice:** วางระบบยืนยันตัวตน, สถาปัตยกรรมหลัก, ระบบสร้าง/เผยแพร่ Event และ Atomic Registration Transaction ที่ป้องกัน Overbooking พร้อม E2E Tests | F-01, F-02, F-03, F-04, F-05 | Deliverable 1 (8 พ.ย. 2026) |
| **Sprint 2** | **Lifecycle Expansion & Capacity Management:** ระบบยกเลิกการลงทะเบียนพร้อมคืนโควต้า, การแก้ไขรายละเอียดและจำนวนที่นั่งของกิจกรรม, และ Notification Logs | F-06, F-07 | Deliverable 2 (29 พ.ย. 2026) |
| **Sprint 3** | **Hardening, Analytics & On-site Attendance:** ระบบ Check-in ตรวจสอบบัตรหน้างาน, รายงานสถิติผู้เข้าร่วมสำหรับ Organizer, และการ Hardening ระบบรองรับการ Deploy บน GCP | F-08, F-09 | Final Submission (13 ธ.ค. 2026) |

---

## Part E: Sprint 1 Engineering Contracts

### 1. Acceptance Criteria (AC) Highlights
* **AC-01 (Valid Authentication):** ผู้ใช้สามารถเข้าสู่ระบบด้วย credentials ที่ถูกต้อง และได้รับ HTTP 200 พร้อม Session Cookie
* **AC-06 (Event Creation Validation):** Organizer สามารถสร้าง Event ได้เมื่อกรอกข้อมูลครบถ้วน และช่วงเวลาถูกต้องตาม BR-02
* **AC-12 (Successful Registration):** Participant สามารถลงทะเบียนกิจกรรมที่ PUBLISHED ได้ และยอดผู้ลงทะเบียนเพิ่มขึ้น 1 คน
* **AC-14 (Duplicate Registration Rejection):** การลงทะเบียนซ้ำโดย Participant คนเดิมต้องถูกปฏิเสธด้วย HTTP 409 พร้อมข้อความชัดเจน
* **AC-15 (Capacity Overbooking Prevention):** เมื่อจำนวนผู้ลงทะเบียนเต็มความจุ คำขอลงทะเบียนถัดไปต้องถูกปฏิเสธด้วย HTTP 409
* **AC-21 (Organizer Roster Access):** Organizer สามารถดูรายชื่อผู้ลงทะเบียนในกิจกรรมของตนเองได้ โดยไม่เปิดเผยข้อมูลให้ Organizer ท่านอื่น

### 2. Product Definition of Done (DoD)
1. โค้ดฟีเจอร์ได้รับการพัฒนาตรงตาม Engineering Contract และ Acceptance Criteria
2. มี Automated Unit Tests และ Integration Tests ครอบคลุม Business Validation และ Security Rules
3. มี Automated Browser E2E Tests ทดสอบ Journey สำคัญบนความละเอียดหน้าจอต่างๆ
4. ทุก Test Suites รันผ่าน 100% (0 failing, 0 skipped)
5. โค้ดผ่านการทำ Peer Review และได้ข้อเสนอแนะเชิงเทคนิค (Substantive Review) จากเพื่อนร่วมทีมก่อน Merge
6. ไม่มีการ Hardcode รหัสผ่านหรือ Secret ลงใน Git Repository
7. มีคำแนะนำการติดตั้งและการทดสอบซ้ำ (Reproduction Steps) ใน README อย่างชัดเจน

---

## Part F: Working Sprint 1 & Verification Evidence

### 1. Program Demonstrations (Scenario Evidence)
* **Demonstration 1 (Complete Normal Domain Journey):**
  * *Flow:* Organizer (OA) เข้าสู่ระบบ ➡️ สร้าง Event "Tech Innovation Workshop" ➡️ กำหนดความจุ 2 ที่นั่ง และช่วงเวลาที่ถูกต้อง ➡️ กด Publish Event ➡️ สลับบัญชีเป็น Participant (PA) ➡️ ค้นหากิจกรรมและกดยืนยันการลงทะเบียน ➡️ เข้าดูหน้า "My Registrations" พบรายการกิจกรรมที่ลงทะเบียนสำเร็จ ➡️ สลับกลับไปที่ Organizer (OA) เข้าดูหน้ารายชื่อผู้ลงทะเบียน (Roster) ตรวจสอบพบชื่อ PA พร้อมยอดผู้เข้าร่วมตรงกับ Database จริง
* **Demonstration 2 (Business Rule & Boundary Rejections):**
  * *Duplicate Rejection:* PA พยายามกดลงทะเบียนกิจกรรมเดิมซ้ำ ➡️ ระบบแสดงคำเตือน "Already registered" พร้อม HTTP 409
  * *Capacity Limit Rejection:* Participant (PB) เข้ามาลงทะเบียนจนเต็ม 2 ที่นั่ง ➡️ Participant คนที่ 3 พยายามลงทะเบียน ➡️ ระบบแจ้ง "Event is fully booked" และปฏิเสธคำขอโดยไม่เพิ่มยอดใน Database
* **Demonstration 3 (Security & Access Restrictions):**
  * *Role Restriction:* PA พยายามเรียกใช้ Endpoint สำหรับสร้างหรือแก้ไข Event ➡️ ระบบปฏิเสธด้วย HTTP 403 Forbidden
  * *Data Isolation:* Organizer B (OB) พยายามเข้าดู Roster ของ Organizer A (OA) ➡️ ระบบปฏิเสธด้วย HTTP 404/403

---

### 2. Build & Automated Test Results

* **Execution Commands:**
  ```bash
  # รัน Unit และ Integration Tests ทั้งหมด
  npm test
  # รัน Browser End-to-End Tests ทั้งหมด
  npm run test:e2e
  # รัน Typecheck และ Production Build
  npm run typecheck && npm run build
  ```
* **Summary Results (Tested at commit `97a5b91`):**
  * **Vitest (Unit & Integration Tests):** **159 PASS** / 0 Fail / 0 Skip
  * **Playwright (Browser E2E Tests):** **37 PASS** / 0 Fail / 0 Skip
  * **TypeScript Typecheck:** PASS (No errors found)
  * **Production Build:** Client & Server compilation successful

---

### 3. Code Excerpts of Automated Tests

#### Excerpt 1: Domain Business Rule Verification (Overbooking & Duplicate Prevention)
```typescript
// server/tests/integration/registration.test.ts
it('rejects registration when event capacity is reached (AC-15)', async () => {
  const event = await createPublishedEvent({ capacity: 1 });
  await registerUser(userA.id, event.id);

  const res = await request(app)
    .post(`/api/events/${event.id}/registrations`)
    .set('Cookie', userBSessionCookie)
    .send();

  expect(res.status).toBe(409);
  expect(res.body.error.code).toBe('EVENT_FULL');
  
  // Verify persistence state: exactly 1 registration remains
  const count = await prisma.registration.count({ where: { eventId: event.id } });
  expect(count).toBe(1);
});
```

#### Excerpt 2: Role & Ownership Security Restriction
```typescript
// server/tests/integration/registration-views.test.ts
it('forbids attendee roster access to non-owner organizers (AC-22)', async () => {
  const event = await createPublishedEvent({ organizerId: organizerA.id });

  const res = await request(app)
    .get(`/api/events/${event.id}/roster`)
    .set('Cookie', organizerBSessionCookie);

  expect([403, 404]).toContain(res.status);
  expect(res.body).not.toHaveProperty('attendees');
});
```

---

### 4. Git Workflow & Peer Review History (บันทึกตามประวัติ Git และ PR จริง)

#### Chain 1: Issue #3 (Atomic Registration Engine — Feature F-03)
* **Issue Link:** [#3 Feature: Atomic Registration Engine](https://github.com/jetanin/LoungCheu/issues/3)
* **Feature Branch:** `feature/registration` 
* **Author / Developer:** นายเจตนินทร์ นายโท (`jetanin`)
* **Pull Request:** [PR #7](https://github.com/jetanin/LoungCheu/pull/7) รวมเข้าสู่ `sprint-1-staging`
* **Teammate Reviewer:** นายปภังกร ล่วนเส้ง (`i3artuf`)
* **Substantive Review Finding:** ตรวจสอบตรรกะการทำ Database transaction lock ในการจองที่นั่ง, ตรวจสอบลำดับการตรวจเช็ค deadline ➡️ duplicate ➡️ capacity, ตรวจสอบการส่งกลับ HTTP 409 Conflict และความครอบคลุมของ Vitest 110 tests
* **Staging Integration Merge:** Merge commit `ada659b` ดำเนินการโดย นายปภังกร ล่วนเส้ง (6 พ.ย. 2026)

#### Chain 2: Issue #4 (Registration Views & Organizer Roster — Feature F-04, F-05)
* **Issue Link:** [#4 Feature: My Registrations and Organizer Roster](https://github.com/jetanin/LoungCheu/issues/4)
* **Feature Branch:** `feature/registration-views`
* **Author / Developer:** นายเจตนินทร์ นายโท (`jetanin`)
* **Pull Request:** [PR #10](https://github.com/jetanin/LoungCheu/pull/10) รวมเข้าสู่ `sprint-1-staging`
* **Teammate Reviewer:** นายปภังกร ล่วนเส้ง (`ppkls`)
* **Substantive Review Finding:** ตรวจพบข้อบกพร่อง RV-01 เรื่อง Account-switch session cleanup ในการรัน Browser E2E suite, RV-02/03 เรื่องเอกสารความสอดคล้องและการกรองเฉพาะ Minimal fields ทาง API. ฝ่ายผู้พัฒนาได้ดำเนินการแก้ไขครบถ้วนใน commit `3313288` ส่งผลให้เทสต์ Vitest 159/159 และ E2E 37/37 ผ่านครบสมบูรณ์
* **Staging Integration Merge:** Merge commit `97a5b91` ดำเนินการโดย นายปภังกร ล่วนเส้ง (10 พ.ย. 2026)

---

### 5. Contributions & Team Participation Table (บันทึกตามข้อเท็จจริงใน Git Commit History)

| Member | Responsibilities & Actual Contributions (บันทึกตาม Git Commit History) | Evidence in Repository |
|:---|:---|:---|
| **นายปภังกร ล่วนเส้ง**<br>(Paphangkorn Luanseng)<br>รหัสนักศึกษา: 67070501083<br>GitHub: `@ppkls` / `i3artuf` | **1. System Architecture & Baseline Documentation Lead:**<br>- ยกร่างและปรับแต่งเอกสารวิศวกรรมหลัก SRS, SDS, NFR, Traceability Matrix, Three-Sprint Plan ตั้งแต่ v0.3–v0.5 (commits `a88551c`, `550a8b9`, `a14cc5f`, `be9536c`, `2c25b16`, `f5339b9`)<br>**2. Core Feature Implementation:**<br>- **Feature F-01 (Auth Module - PR #6):** พัฒนา Monorepo workspace tooling, Express Auth Module, Session Store, Prisma initial migration (`202611060001_auth`), React Login UI, และ Playwright Auth E2E test (commits `9f2b33c`, `1a9109a`, `61ef5a3`, `5c34a8d`, `6eac597`, `528419d`)<br>- **Feature F-02 (Event Management - PR #8):** พัฒนา Event API, Schedule Form, Responsive Organizer Overview, Mock Demo Seed, และ Playwright E2E suites สำหรับ Event (commits `c9ea93a`, `41aeb91`, `d5ab8bb`, `6542d6b`, `bee127d`, `de7dcd9`, `8668cb7`, `e6e263a`, `9fcbfc8`, `e46817d`, `fa6f01d`, `91531a7`, `ad1e99f`, `b36d592`)<br>**3. Quality Assurance, Teammate Reviewer & Staging Integrator:**<br>- ทำหน้าที่เป็น Peer Reviewer สำหรับ PR #7 และ PR #10 อย่างละเอียด พร้อมตรวจพบ RV-01–03<br>- ตรวจรับการแก้บั๊ก รัน integration checks และทำ Staging Integration Merge เข้าสู่ `sprint-1-staging` (commits `ada659b`, `97a5b91`) | 24+ Commits ใน main/staging history (`i3artuf`), Code reviews บน PR #7 และ PR #10, Staging merge commits (`ada659b`, `97a5b91`), Test suites ใน `server/tests/` และ `tests/e2e/` |
| **นายเจตนินทร์ นายโท**<br>(Jetanin Naitho)<br>รหัสนักศึกษา: 67070501011<br>GitHub: `@jetanin` | **1. Project Foundation & Repository Setup:**<br>- สร้าง GitHub Repository (`dafbf4f`) และจัดทำ initial requirements draft (`002c698`)<br>**2. Core Feature Implementation:**<br>- **Feature F-03 (Atomic Registration - PR #7):** พัฒนาระบบลงทะเบียนกิจกรรมแบบ Transaction Lock ป้องกัน Overbooking และ Duplicate Registration, สร้าง REST API `/api/events/:id/registrations` และ Registration UI Action Component (commits `b6ad6e7`, `f482461`, `afa5c72`, `9f8c4e3`)<br>- **Feature F-04 & F-05 (Registration Views & Roster - PR #10):** พัฒนาระบบ My Registrations (own list/detail) และ Event Attendee Roster สำหรับ Organizer, แก้ไข connection limit สำหรับ concurrency tests, และดำเนินการแก้ไข review findings RV-01 ถึง RV-03 (commits `eeafc31`, `32327d4`, `3313288`, `f6a245f`, `0bd3468`)<br>**3. Teammate Reviewer & Baseline Integrator:**<br>- ตรวจสอบและ Merge PR #5 (Docs Baseline), PR #6 (Auth Module), และ PR #8 (Event Management) เข้าสู่ staging branch | Commits บน feature branches (`jetanin`), Author ของ PR #7 และ PR #10, Merge commits ของ PR #5, #6, #8 (`5395942`, `6e8a24c`, `8104f9c`) |

---

### 6. AI-Use Declaration
ในการทำโครงงานนี้ มีการใช้ปัญญาประดิษฐ์ (AI Assistants เช่น Gemini และ GitHub Copilot) เพื่อช่วยอำนวยความสะดวกในการจัดรูปแบบเอกสารตามมาตรฐานวิศวกรรมซอฟต์แวร์ และช่วยตรวจสอบ Syntax ข้อผิดพลาดของคำสั่ง Configuration ต่างๆ โดยการตัดสินใจทางสถาปัตยกรรม (Architectural Decisions), การออกแบบ Business Rules, การเขียนตรรกะระบบ, และการ Review โค้ดทั้งหมด ดำเนินการและรับผิดชอบโดยสมาชิกในกลุ่มทั้งสองคนจริง
