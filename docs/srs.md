# Part A — Software Requirements Specification

เอกสาร LC-SRS | Documentation v0.6 (CR-01, 27 พฤศจิกายน 2026) | baseline v0.5 | 5 พฤศจิกายน 2026

## 1. ปัญหาและเป้าหมาย

ชมรมหรือหน่วยงานในมหาวิทยาลัยต้องการเผยแพร่กิจกรรมที่มีที่นั่งจำกัด ป้องกันการลงทะเบียนซ้ำหรือเกินความจุ ตรวจรายชื่อ และบันทึกการเข้าร่วม LoungCheu รวมกระบวนการเหล่านี้ไว้ในระบบเดียว โดยผู้จัดแต่ละคนจัดการได้เฉพาะกิจกรรมของตน และผู้เข้าร่วมเข้าถึงรายละเอียดการลงทะเบียนของตนเท่านั้น

เป้าหมายของผลิตภัณฑ์คือให้ผู้จัดสร้าง/เผยแพร่กิจกรรม ผู้เข้าร่วมลงทะเบียนหรือยกเลิกตามกติกา ผู้จัดเช็กชื่อ และดูสรุปยอดลงทะเบียน/เข้าร่วมได้อย่างถูกต้องและตรวจสอบย้อนหลังได้

## 2. Actors และความรับผิดชอบ

| Actor | ความรับผิดชอบ/สิทธิ์ |
|---|---|
| Participant | ดูกิจกรรมที่เผยแพร่ ลงทะเบียน ดูรายการ/สถานะของตน และยกเลิกก่อนปิดรับ |
| Organizer | สร้างและเผยแพร่กิจกรรมของตน ดูรายชื่อ ปิดรับ ปรับรายละเอียด/ความจุ เช็กชื่อ และดูรายงานของตน |
| ผู้ไม่มี session | เข้าหน้า Login และขอ CSRF token ได้ แต่ใช้ข้อมูลกิจกรรม/ข้อมูลส่วนตัวผ่าน API ไม่ได้ |

หนึ่งบัญชีมีหนึ่ง role ใน baseline นี้ ไม่มี Admin UI การเตรียมบัญชีเป็นงาน seed ของผู้ดูแลสภาพแวดล้อม ไม่ใช่ role ของผลิตภัณฑ์

## 3. Scope

In scope: บัญชี demo, session login/logout, role/ownership enforcement, กิจกรรมมีความจุจำกัด, ลงทะเบียน/ยกเลิก, การปิดรับ, เช็กชื่อ และสรุปยอดต่อกิจกรรม

Out of scope: self-registration, reset password, email verification, หลาย role ต่อบัญชี, หลาย Organizer ร่วมเป็นเจ้าของกิจกรรม, ซื้อบัตร/ชำระเงิน, waitlist, QR code, email/SMS, file upload, ระบบอนุมัติกิจกรรม, recurring event และ external calendar integration

ไม่มีการรับประกันตัวบุคคลหน้างานด้วยเทคโนโลยี Organizer ตรวจตัวผู้เข้าร่วมก่อนกดเช็กชื่อเอง ใช้ข้อมูลสังเคราะห์ในการสาธิต

### Technology และ workflow

- Frontend: React 19.3.1 + TypeScript + Vite + Bootstrap 5.3.8
- Backend: Node.js + Express + TypeScript
- Database/data access: PostgreSQL + Prisma
- Architecture: REST-style APIs
- Testing: Vitest + Supertest เป็นชุดหลัก; ใช้ Playwright สำหรับ selected automated browser E2E ของ F-01/F-02 และ audit regressions แล้ว (execution update 6 พ.ย. 2026; [ผลจริง](events/verification.md)). **อัปเดต 25 พ.ย. 2026:** Playwright (Chromium) ครอบคลุม F-01–F-07 แล้ว; CI `test-and-docker` รัน Vitest + Playwright ทุก PR ที่เข้า staging branch และ main
- Workflow: GitHub Issues/Projects, feature/* → sprint-1-staging → main พร้อม teammate review ตาม DEC-15. **อัปเดต 25 พ.ย. 2026:** ใช้ integration branch ต่อ sprint/lab (`sprint-2-staging`, `lab6-staging`, `sprint-3-staging`) ตามรูปแบบเดียวกัน; release บน main ติด tag (`v1.0.0-sprint-1`, `v1.0.1-uat`)
- Deployment (เพิ่ม 25 พ.ย. 2026): Docker image deploy บน GCP Cloud Run ผ่าน GitHub Actions เมื่อ push เข้า main; ตรวจ version ที่ deploy ด้วย `/api/ready` (Lab 5)

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
| FR-11 | Organizer แก้ DRAFT ของตนได้ทุกช่องใน EventInput (ไม่รวม id/owner/status/system fields) และแก้ชื่อ คำอธิบาย สถานที่ หรือความจุของ PUBLISHED ได้ตามกฎ | 2 |
| FR-12 | Participant ที่เคยยกเลิกลงทะเบียนใหม่ได้เมื่อกิจกรรมยังเปิดรับและมีที่นั่ง | 2 |
| FR-13 | Organizer เช็กชื่อผู้มี ACTIVE registration ในกิจกรรมของตนภายในช่วงกิจกรรมได้ | 3 |
| FR-14 | Participant ดูสถานะการเช็กชื่อของตนได้ | 3 |
| FR-15 | Organizer ดูยอด ACTIVE, CANCELLED, checked-in และอัตราเข้าร่วมของกิจกรรมตนได้ | 3 |

## 6. Business Rules

| ID | กฎและผลเมื่อไม่ผ่าน |
|---|---|
| BR-01 | capacity เป็น JSON integer 1–1,000 ไม่ coercion string/boolean; title **3–120** (CR-01 v0.6; เดิม 1–120), description 1–2,000, location 1–200 Unicode code points หลัง trim; ทุกช่องต้องเป็น string และว่างไม่ได้; title ของกิจกรรมที่บันทึกก่อน CR-01 ไม่ถูกตรวจย้อนหลังและไม่แก้อัตโนมัติ |
| BR-02 | `registration_closes_at <= starts_at < ends_at`; เผยแพร่ได้เมื่อ closes_at อยู่ในอนาคตเทียบเวลา server |
| BR-03 | ลงทะเบียนได้เมื่อ status=PUBLISHED และ `server_now < registration_closes_at`; ที่เท่ากับ deadline ต้องปฏิเสธ |
| BR-04 | หนึ่ง registration record ต่อ user/event; S2 reactivate record เดิมโดยคง registered_at ครั้งแรก ล้าง cancelled_at และ append history; ไม่สร้าง ACTIVE ซ้ำ |
| BR-05 | ACTIVE count ต้องไม่เกิน capacity แม้คำขอเข้าพร้อมกัน; คำขอที่แพ้ต้องไม่เพิ่ม record/กินที่นั่ง |
| BR-06 | Participant เข้าถึงและเปลี่ยนเฉพาะ registration ของตน และไม่มีสิทธิ์จัดการกิจกรรม/รายชื่อ |
| BR-07 | Organizer จัดการกิจกรรม รายชื่อ เช็กชื่อ และรายงานเฉพาะกิจกรรมตน; ไม่มีสิทธิ์ใช้ฟังก์ชันลงทะเบียนของ Participant |
| BR-08 | Participant ยกเลิกได้เฉพาะ ACTIVE ก่อน deadline และเมื่อ event=PUBLISHED; เรียกซ้ำกับ CANCELLED ต้องปฏิเสธโดยไม่มีผลข้างเคียง |
| BR-09 | Event transition คือ DRAFT→PUBLISHED→CLOSED; CLOSED ห้ามแก้ Event fields/เปิดกลับ แต่ check-in บน Registration ทำได้ตาม BR-12 |
| BR-10 | ลด capacity ไม่ต่ำกว่า ACTIVE count; ลงทะเบียน/ยกเลิก/ปรับความจุ/ปิดรับต้องประสาน transaction บน event เดียวกัน |
| BR-11 | owner immutable ทุกสถานะและกำหนดจาก session; PUBLISHED แก้เวลา/วันปิดรับไม่ได้; id/status/system fields ไม่รับผ่าน edit input และไม่มี hard delete ผ่านผลิตภัณฑ์ |
| BR-12 | Check-in ได้เฉพาะ ACTIVE และ `starts_at <= server_now <= ends_at`; CLOSED ยังเช็กชื่อได้ภายในช่วงงาน; เช็กชื่อซ้ำปฏิเสธ 409 ALREADY_CHECKED_IN โดยไม่เปลี่ยน checked_in_at/checked_in_by_id หรือยอดเข้าร่วม |
| BR-13 | ACTIVE/CANCELLED นับ record ตามสถานะปัจจุบันของ event; checked-in นับ ACTIVE ที่ checked_in_at ไม่เป็น null; reactivate ย้ายยอด CANCELLED ไป ACTIVE ไม่สะสมจำนวนครั้ง cancel ใน summary; อัตราเข้าร่วม = checked-in / ACTIVE × 100 ปัดทศนิยม 2 ตำแหน่ง ถ้า ACTIVE=0 แสดง 0.00%; lifecycle history แยกจากยอดปัจจุบัน |
| BR-14 | ทุกเวลาเก็บ UTC ความละเอียด millisecond; API รับ ISO 8601 ที่มี offset และเศษวินาที 0–3 หลัก คืน UTC แบบ YYYY-MM-DDTHH:mm:ss.SSSZ; input ละเอียดกว่า 3 หลักปฏิเสธ 400 ไม่ปัดเงียบ ๆ; UI Asia/Bangkok ระบุเขตเวลา; ใช้ server clock และตรวจเวลาของ event/registration mutations ภายใน transaction หลังได้ Event lock |

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

## 8. เส้นทางใช้งานหลักและข้อผิดพลาด

1. Organizer Login แล้วสร้าง DRAFT ที่ capacity=2 และกำหนดวันเวลาที่ถูกต้อง
2. Organizer Publish แล้ว Participant เห็นรายละเอียดโดยไม่มีข้อมูลผู้ลงทะเบียนคนอื่น
3. Participant A ลงทะเบียนสำเร็จและเปิดรายการของตนใหม่จากข้อมูลฐานข้อมูล
4. Organizer เห็น A ใน roster และ ACTIVE count=1
5. A ลงทะเบียนซ้ำถูกปฏิเสธโดย count คงเดิม
6. B ลงทะเบียนได้จนเต็ม จากนั้น C ถูกปฏิเสธ
7. Participant เรียก API ผู้จัดได้ 403; Organizer B เปิด roster ของ Organizer A ได้ 404

เส้นทางอื่นของผลิตภัณฑ์เต็ม: Participant ยกเลิกก่อนปิดรับ → ที่นั่งคืน → ลงใหม่; Organizer ปิดรับ/ปรับความจุ → เช็กชื่อในช่วงกิจกรรม → ดูสรุป

## 9. Assumptions และ scope changes

รายละเอียดที่ทีมเลือกเอง เช่น session อายุ 2 ชั่วโมง capacity สูงสุด และกติกายกเลิก/check-in อยู่ใน [Decisions](decisions.md) การเปลี่ยนกฎต้องปรับ AC/STS/traceability และบันทึกเหตุผลใน [Changelog](changelog.md)

## 10. สถานะเทียบผลิตภัณฑ์ปัจจุบัน — 27 พฤศจิกายน 2026

ข้อความ FR/BR/NFR ด้านบนยังเป็น baseline v0.5 ที่ teammate อนุมัติ ไม่มีการเปลี่ยนข้อกำหนดที่อนุมัติแล้วหลังจากนั้น ยกเว้น BR-01 title ตาม CR-01 (v0.6, #84) ซึ่งแก้ contract แล้วแต่ยังไม่ implement/test/deploy สถานะในส่วนนี้จึงยังเป็นของกฎเดิม title 1–120 ส่วนนี้บอกเพียงว่าแต่ละ FR อยู่ขั้นไหนของผลิตภัณฑ์จริง หลักฐานรายละเอียดอยู่ใน [traceability](traceability.md)

| FR | Feature | สถานะ ณ 26 พ.ย. 2026 |
|---|---|---|
| FR-01–FR-08 | F-01–F-05 | Implemented และ tested; release บน main tag `v1.0.0-sprint-1` แล้วแก้ CI ใน `v1.0.1-uat` (`0b2cc80`); independent UAT โดยทีม TH-005_P5 ผ่าน 7/7 เคส ผลตัดสิน **Accepted** 25 พ.ย. 2026; AC-25 และ AC-27 ยัง Partial verification (ขาด TEST-35 และ final TEST-34) |
| FR-09, FR-10, FR-12 | F-06 | Implemented, tested, teammate-reviewed และ merge เข้า `sprint-2-staging` (PR #59, #60) CI ผ่าน; release บน main เป็น release `v2.0.0-sprint-2` (`c0faf24`, PR #67) deploy revision `scccd8b05-00011-fvb` |
| FR-11 | F-07 | Implemented, tested, teammate-reviewed และ merge เข้า `sprint-2-staging` (PR #57, #60) CI ผ่าน; release บน main เป็น release `v2.0.0-sprint-2` (`c0faf24`, PR #67) deploy revision `scccd8b05-00011-fvb` |
| FR-13, FR-14 | F-08 | Implemented, tested, teammate-reviewed และ merge เข้า `sprint-3-staging` (PR #78, #79, #80) CI ผ่าน; release บน main เป็น `v3.0.0-sprint-3` (`3f80759`, PR #81) deploy revision `scccd8b05-00013-nwj` |
| FR-15 | F-09 | Implemented, tested, teammate-reviewed และ merge เข้า `sprint-3-staging` (PR #75) CI ผ่าน; release บน main เป็น `v3.0.0-sprint-3` (`3f80759`, PR #81) deploy revision `scccd8b05-00013-nwj` |

ประเด็นที่บันทึกไว้ (ไม่แก้ข้อความ baseline):

- **BR-13 การปัดเศษ:** baseline ระบุแค่ "ปัดทศนิยม 2 ตำแหน่ง"; DEC-18 (ร่าง Sprint 3, Issue #49) เสนอปัดครึ่งขึ้น (half-up) ด้วยจำนวนเต็ม จะปรับข้อความ BR-13 เมื่อ contract Sprint 3 ผ่าน review. **อัปเดต 27 พ.ย.:** contract Sprint 3 ผ่าน review ใน PR #71 (26 พ.ย.) และ F-09 ใช้ DEC-18 ตาม AC-48 (TEST-61 PASS, release `v3.0.0-sprint-3`); ข้อความ BR-13 ใน baseline คงเดิม DEC-18 เป็นการกำหนดรายละเอียดที่ test ได้ ไม่ใช่การเปลี่ยน requirement
- **NFR-09 re-test accepted defect:** UAT Lab 6 ไม่พบ defect จึงไม่มี accepted defect ให้ re-test; ตาม Lab 6 ทีมขอ controlled defect exercise จาก TA แทน — NFR-09 ส่วน re-test ยังไม่ครบจนกว่าจะทำ exercise นั้น. **อัปเดต 27 พ.ย.:** ทำแล้ว — LAB6-CX-01 (#64) release `v2.0.1-lab6` และ independent retest PASS 26 พ.ย. 2026 (Nantakorn, TH-005_P5); independent UAT ของ Sprint 2–3 ยังไม่มี
