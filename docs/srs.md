# Part A — Software Requirements Specification

เอกสาร: LC-SRS | Version 0.2 | 4 พฤศจิกายน 2026 | Stack กำหนดแล้ว; business baseline เสนอเพื่อทบทวนก่อนพัฒนา

## 1. ปัญหาและเป้าหมาย

ชมรมหรือหน่วยงานในมหาวิทยาลัยต้องการเผยแพร่กิจกรรมที่มีที่นั่งจำกัด ป้องกันการลงทะเบียนซ้ำหรือเกินความจุ ตรวจรายชื่อ และบันทึกการเข้าร่วม LoungCheu รวมกระบวนการเหล่านี้ไว้ในระบบเดียว โดยผู้จัดแต่ละคนจัดการได้เฉพาะกิจกรรมของตน และผู้เข้าร่วมเข้าถึงรายละเอียดการลงทะเบียนของตนเท่านั้น

เป้าหมายของผลิตภัณฑ์คือให้ผู้จัดสร้าง/เผยแพร่กิจกรรม ผู้เข้าร่วมลงทะเบียนหรือยกเลิกตามกติกา ผู้จัดเช็กชื่อ และดูสรุปยอดลงทะเบียน/เข้าร่วมได้อย่างถูกต้องและตรวจสอบย้อนหลังได้

## 2. Actors และความรับผิดชอบ

| Actor | ความรับผิดชอบ/สิทธิ์ |
|---|---|
| Participant | ดูกิจกรรมที่เผยแพร่ ลงทะเบียน ดูประวัติของตน และยกเลิกก่อนปิดรับ |
| Organizer | สร้างและเผยแพร่กิจกรรมของตน ดูรายชื่อ ปิดรับ ปรับรายละเอียด/ความจุ เช็กชื่อ และดูรายงานของตน |
| ผู้ไม่มี session | เข้าหน้า Login และขอ CSRF token ได้ แต่ใช้ข้อมูลกิจกรรม/ข้อมูลส่วนตัวผ่าน API ไม่ได้ |

หนึ่งบัญชีมีหนึ่ง role ใน baseline นี้ ไม่มี Admin UI การเตรียมบัญชีเป็นงาน seed ของผู้ดูแลสภาพแวดล้อม ไม่ใช่ role ของผลิตภัณฑ์

## 3. Scope

In scope: บัญชี demo, session login/logout, role/ownership enforcement, กิจกรรมมีความจุจำกัด, ลงทะเบียน/ยกเลิก, การปิดรับ, เช็กชื่อ และสรุปยอดต่อกิจกรรม

Out of scope: self-registration, reset password, email verification, หลาย role ต่อบัญชี, หลาย Organizer ร่วมเป็นเจ้าของกิจกรรม, ซื้อบัตร/ชำระเงิน, waitlist, QR code, email/SMS, file upload, ระบบอนุมัติกิจกรรม, recurring event และ external calendar integration

ไม่มีการรับประกันตัวบุคคลหน้างานด้วยเทคโนโลยี Organizer ตรวจตัวผู้เข้าร่วมก่อนกดเช็กชื่อเอง ใช้ข้อมูลสังเคราะห์ในการสาธิต

### Technology constraints ที่ผู้ใช้กำหนด

- Frontend: React + TypeScript + Vite + Bootstrap
- Backend: Node.js + Express + TypeScript
- Database/data access: PostgreSQL + Prisma
- Architecture: REST-style APIs
- Testing: Vitest + Supertest เป็นชุดหลัก; selected automated browser E2E เสนอใช้ Playwright เพิ่ม
- Workflow: Git/GitHub Projects, main/dev/feature branches, Pull Requests และ peer review; `dev` รับบท sprint staging ตามข้อกำหนด D1

รายละเอียด deployment/session/transaction ตาม System SDS เป็น design ของทีม ต้องทดสอบจริง ไม่ใช่สิ่งที่ stack ทำให้อัตโนมัติ

## 4. คำศัพท์และสถานะ

- FR: ความสามารถของระบบ; BR: กฎธุรกิจ; NFR: คุณภาพ/ข้อจำกัดที่ตรวจวัดได้
- Event: กิจกรรมหนึ่งครั้ง มี Organizer เจ้าของหนึ่งคน
- Event status: `DRAFT` → `PUBLISHED` → `CLOSED`; ไม่เปิดกลับใน baseline
- Registration status: `ACTIVE` หรือ `CANCELLED` (การยกเลิกเริ่ม Sprint 2)
- Check-in: ค่า `checked_in_at` บน registration เริ่ม Sprint 3
- Active count: จำนวน registration ที่ status = ACTIVE รวมผู้ที่เช็กชื่อแล้ว
- AC: Acceptance Criterion; STS: Software Test Specification; DoD: Definition of Done

กิจกรรม PUBLISHED ที่เลย registration deadline ยังเป็น PUBLISHED ได้ แต่ถือว่าปิดรับตามเวลาที่ตรวจบน server จึงไม่ต้องมี cron job การ CLOSED โดยผู้จัดเป็นการปิดรับก่อนกำหนด ไม่ใช่ยกเลิกกิจกรรม

## 5. Functional Requirements

| ID | ข้อกำหนดที่สังเกตผลได้ | Sprint |
|---|---|---:|
| FR-01 | ผู้ใช้ที่ active Login ด้วย username/password ได้ และข้อมูลผิดต้องไม่สร้าง authenticated session | 1 |
| FR-02 | ผู้ใช้เรียกดู identity/role ของตนและ Logout เพื่อยกเลิก session ปัจจุบันได้ | 1 |
| FR-03 | Organizer สร้างกิจกรรม DRAFT พร้อมรายละเอียด เวลา วันปิดรับ และความจุได้ | 1 |
| FR-04 | Organizer เผยแพร่ DRAFT ของตนที่ผ่าน validation ได้ | 1 |
| FR-05 | ผู้ใช้ที่ Login ดูรายการและรายละเอียดกิจกรรม PUBLISHED/CLOSED ได้ โดยไม่เปิดเผยรายชื่อผู้ลงทะเบียน | 1 |
| FR-06 | Participant ลงทะเบียนกิจกรรมที่เปิดรับได้ และได้รับเลขอ้างอิงที่บันทึกในฐานข้อมูล | 1 |
| FR-07 | Participant ดูรายการ/รายละเอียดการลงทะเบียนของตน พร้อมสถานะและกิจกรรมที่เกี่ยวข้องได้ | 1 |
| FR-08 | Organizer ดูรายการกิจกรรมของตนและรายชื่อผู้ลงทะเบียนพร้อมยอด ACTIVE ของกิจกรรมนั้นได้ | 1 |
| FR-09 | Participant ยกเลิก ACTIVE ของตนก่อนปิดรับได้ และที่นั่งกลับมาใช้ได้ | 2 |
| FR-10 | Organizer ปิดรับกิจกรรม PUBLISHED ของตนได้โดยไม่ลบรายการลงทะเบียนเดิม | 2 |
| FR-11 | Organizer แก้ DRAFT ได้ครบทุกช่อง และแก้ชื่อ คำอธิบาย สถานที่ หรือความจุของ PUBLISHED ได้ตามกฎ | 2 |
| FR-12 | Participant ที่เคยยกเลิกลงทะเบียนใหม่ได้เมื่อกิจกรรมยังเปิดรับและมีที่นั่ง | 2 |
| FR-13 | Organizer เช็กชื่อผู้มี ACTIVE registration ในกิจกรรมของตนภายในช่วงกิจกรรมได้ | 3 |
| FR-14 | Participant ดูสถานะการเช็กชื่อของตนได้ | 3 |
| FR-15 | Organizer ดูยอด ACTIVE, CANCELLED, checked-in และอัตราเข้าร่วมของกิจกรรมตนได้ | 3 |

## 6. Business Rules

| ID | กฎและผลเมื่อไม่ผ่าน |
|---|---|
| BR-01 | capacity ต้องเป็นจำนวนเต็ม 1–1,000; title 1–120 ตัวอักษรหลัง trim, description 1–2,000, location 1–200; ช่องจำเป็นว่างไม่ได้ |
| BR-02 | `registration_closes_at <= starts_at < ends_at`; เผยแพร่ได้เมื่อ closes_at อยู่ในอนาคตเทียบเวลา server |
| BR-03 | ลงทะเบียนได้เมื่อ status=PUBLISHED และ `server_now < registration_closes_at`; ที่เท่ากับ deadline ต้องปฏิเสธ |
| BR-04 | ผู้ใช้หนึ่งคนมี registration record ต่อกิจกรรมได้หนึ่ง record และมี ACTIVE ได้ไม่เกินหนึ่ง; Sprint 2 ลงทะเบียนใหม่โดยใช้ record เดิม |
| BR-05 | ACTIVE count ต้องไม่เกิน capacity แม้คำขอเข้าพร้อมกัน; คำขอที่แพ้ต้องไม่เพิ่ม record/กินที่นั่ง |
| BR-06 | Participant เข้าถึงและเปลี่ยนเฉพาะ registration ของตน และไม่มีสิทธิ์จัดการกิจกรรม/รายชื่อ |
| BR-07 | Organizer จัดการกิจกรรม รายชื่อ เช็กชื่อ และรายงานเฉพาะกิจกรรมตน; ไม่มีสิทธิ์ใช้ฟังก์ชันลงทะเบียนของ Participant |
| BR-08 | Participant ยกเลิกได้เฉพาะ ACTIVE ก่อน deadline และเมื่อ event=PUBLISHED; เรียกซ้ำกับ CANCELLED ต้องปฏิเสธโดยไม่มีผลข้างเคียง |
| BR-09 | Event transition ที่อนุญาตคือ DRAFT→PUBLISHED→CLOSED เท่านั้น; CLOSED แก้ไขหรือเปิดกลับไม่ได้ใน baseline |
| BR-10 | ลด capacity ไม่ต่ำกว่า ACTIVE count; ลงทะเบียน/ยกเลิก/ปรับความจุ/ปิดรับต้องประสาน transaction บน event เดียวกัน |
| BR-11 | PUBLISHED แก้เวลา/วันปิดรับ/เจ้าของไม่ได้; owner กำหนดจาก session ไม่รับจาก client; ไม่มี hard delete ผ่านผลิตภัณฑ์ |
| BR-12 | Check-in ได้เฉพาะ ACTIVE และ `starts_at <= server_now <= ends_at`; CLOSED ยังเช็กชื่อได้ภายในช่วงงาน; เช็กชื่อซ้ำไม่สร้างการเข้าร่วมซ้ำ |
| BR-13 | อัตราเข้าร่วม = checked-in / ACTIVE × 100 ปัดทศนิยม 2 ตำแหน่ง; ถ้า ACTIVE=0 แสดง 0.00%; ไม่รวม CANCELLED ในตัวหาร |
| BR-14 | ทุกเวลาเก็บเป็น UTC; API รับ ISO 8601 ที่มี offset; UI แสดง Asia/Bangkok และระบุเขตเวลา; ใช้ server clock ตัดสินกฎ |

## 7. Non-Functional Requirements และวิธีตรวจ

| ID | เป้าหมายที่วัดได้ | วิธีตรวจ / Sprint |
|---|---|---|
| NFR-01 | API protected ต้องปฏิเสธทุกกรณีไม่มี session, role ผิด และ ownership ผิดใน access matrix โดยไม่ส่งข้อมูลที่ป้องกัน | Automated API integration tests / 1 และ regression ทุก Sprint |
| NFR-02 | หลัง Logout session เดิมใช้ endpoint protected ไม่ได้; session หมดอายุภายใน 2 ชั่วโมงนับจาก Login; ไม่เก็บรหัสผ่าน plaintext; production cookie เป็น HttpOnly/Secure/SameSite=Lax | Session/expiry/hash tests และ config check / 1; HTTPS deployment check / Lab 5 |
| NFR-03 | Demo registration ยังอ่านได้และ active count ไม่เปลี่ยนหลัง restart แอป; เมื่อ deploy ต้องอยู่หลัง restart/redeploy ด้วย | Real PostgreSQL integration และ manual restart test / 1; deployment persistence / Lab 5 |
| NFR-04 | คำขอผู้ใช้ต่างกัน 2 คำขอพร้อมกันแย่งที่นั่งสุดท้าย ต้องสำเร็จ 1 และถูกปฏิเสธ 1; duplicate concurrent request ของผู้ใช้เดียวกันสร้าง record เดียว | Separate connections/transactions บน PostgreSQL จริง / 1 |
| NFR-05 | จากฐานข้อมูล demo ใหม่ อีกคนติดตั้งตาม README/migration/seed และทำ critical journey ได้ครบ โดยไม่ต้องแก้ source | Reproduction checklist / 1; Docker fresh build / Lab 5 |
| NFR-06 | Error API ต้องมี code/message ที่คงรูปแบบและไม่แสดง traceback, password, session ID หรือ SQL; UI แสดง loading/empty/validation/error ตามที่ออกแบบ | Negative API tests และ UI checklist / 1 |
| NFR-07 | Relevant PRs มี build/test required checks และ failed check ไม่เข้าสู่เส้นทาง release ปกติ; deploy version ตรง main release | CI gate demonstration + deployed version check / Lab 5 และคงไว้ |
| NFR-08 | ทุก Sprint 1 AC มี planned test และตอนส่งมี actual test/manual record ที่ระบุผลกับ commit; requirement คงเหลือมี Sprint รับผิดชอบ | Traceability review / 1; ปรับทุก checkpoint |
| NFR-09 | ผู้ทดสอบภายนอกทีมทำ UAT อย่างน้อย 4 กรณี (normal/rule/access/persistence) พร้อม tester/version และ re-test accepted defect อย่างน้อย 1 รายการตาม Lab 6 | Independent UAT records / Lab 6; final re-test ตามผลกระทบ |

ไม่ได้ตั้ง performance SLA ที่ไม่มีหลักฐานรองรับ หากทีมเพิ่มเป้าหมาย latency ภายหลังต้องกำหนด workload/environment และวิธีวัดก่อนอ้างว่าผ่าน

## 8. เส้นทางใช้งานหลักและข้อผิดพลาด

1. Organizer Login แล้วสร้าง DRAFT ที่ capacity=2 และกำหนดวันเวลาที่ถูกต้อง
2. Organizer Publish แล้ว Participant เห็นรายละเอียดโดยไม่มีข้อมูลผู้ลงทะเบียนคนอื่น
3. Participant A ลงทะเบียนสำเร็จและเปิดรายการของตนใหม่จากข้อมูลฐานข้อมูล
4. Organizer เห็น A ใน roster และ ACTIVE count=1
5. A ลงทะเบียนซ้ำถูกปฏิเสธโดย count คงเดิม
6. B ลงทะเบียนได้จนเต็ม จากนั้น C ถูกปฏิเสธ
7. Participant เรียก API ผู้จัดได้ 403; Organizer B เปิด roster ของ Organizer A ได้ 404

เส้นทางอื่นของผลิตภัณฑ์เต็ม: Participant ยกเลิกก่อนปิดรับ → ที่นั่งคืน → ลงใหม่; Organizer ปิดรับ/ปรับความจุ → เช็กชื่อในช่วงกิจกรรม → ดูสรุป

## 9. สมมติฐานและการยอมรับ baseline

ขอบเขตนี้ไม่มีจำนวนฟีเจอร์ขั้นต่ำที่อ้างขึ้นเอง กำหนดให้เทียบความลึกกับ Theme 3: เผยแพร่กิจกรรม ลงทะเบียน ดูข้อมูลตามสิทธิ์ คุม capacity/duplicate รวม concurrency และ persistence

รายละเอียดที่โจทย์ไม่ได้กำหนด เช่น กติกายกเลิก ช่วงเช็กชื่อ และเวลา session เป็นข้อเสนอทีมใน [Decision log](decisions.md) ต้องทบทวนก่อน implement หากเปลี่ยนต้องแก้เอกสาร/AC/STS/traceability ที่เกี่ยวข้องและบันทึกเหตุผล ไม่ลบ requirement เพื่อปกปิดงานคงเหลือ
