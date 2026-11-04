# LoungCheu — ระบบลงทะเบียนกิจกรรมและเช็กชื่อ

ชุดเอกสาร Deliverable 1 รายวิชา CPE334 ภาคเรียน 1/2026  
จัดทำ: 4 พฤศจิกายน 2026 | กำหนดส่ง: 8 พฤศจิกายน 2026 เวลา 23:59 (Asia/Bangkok)

**สถานะ: Documentation baseline v0.2 สำหรับตรวจทานก่อนพัฒนา ยืนยัน stack ตามผู้ใช้แล้ว ยังไม่มีแอป โค้ด การทดสอบที่รันแล้ว หรือ release ที่ยืนยันได้**

บริบทที่เสนอคือระบบกิจกรรมภายในมหาวิทยาลัย ใช้สองบทบาท Participant และ Organizer เอกสารนี้เป็นข้อเสนอการออกแบบของทีม ไม่ใช่หลักฐานว่าอาจารย์อนุมัติแล้ว

## Technology stack ที่กำหนด

| Area | Technology |
|---|---|
| Frontend | React + TypeScript + Vite + Bootstrap |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + Prisma |
| Architecture | REST-style APIs |
| Testing | Vitest + Supertest; เสนอ Playwright เพิ่มสำหรับ selected browser E2E |
| Workflow | Git, GitHub Projects, main/dev/feature branches, Pull Requests และ peer review |

ใช้ `dev` เป็น sprint staging/integration branch และ `main` เป็น accepted release วางแผนเริ่ม 4 Issues สำหรับ Sprint 1 โดยหนึ่ง Issue อาจครอบคลุมหลาย feature ภาพอ้างอิงระบุ four Issues ในบริบท Lab จึงใช้เป็น initial work breakdown ไม่ใช่เพดานห้ามเปิด defect/fix Issues เพิ่ม

## สมาชิกและข้อมูลส่งงาน

| รายการ                                 | ค่า                                               |
| :------------------------------------- | :------------------------------------------------ |
| สมาชิก 1 / รหัสนักศึกษา                | Jetanin Naitho 67070501011                        |
| สมาชิก 2 / รหัสนักศึกษา                | Paphangkorn Luanseng 67070501083                  |
| หัวข้อ                                 | Theme 3: Event Registration and Attendance System |
| สิทธิ์เลือก Theme ตามเลขท้ายรหัสสมาชิก | 67070501083                                       |
| Repository URL                         | https://github.com/jetanin/LoungCheu              |
| Submitted tag / commit                 | ยังไม่มี release                                  |
| ผู้ทบทวน baseline                      | รอเพื่อนร่วมทีมตรวจทาน                            |

## เอกสารตามเกณฑ์ Deliverable 1

| Part | คะแนน | เอกสาร                                                                                                                                                     |
| ---- | ----: | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A    |    10 | [SRS](docs/srs.md)                                                                                                                                         |
| B    |    10 | [Feature inventory](docs/features.md), [Traceability](docs/traceability.md)                                                                                |
| C    |    15 | [System-Level SDS](docs/system-sds.md)                                                                                                                     |
| D    |     5 | [แผน 3 Sprint](docs/sprints/plan.md)                                                                                                                       |
| E    |    20 | [Sprint 1 overview และ DoD](docs/sprints/sprint-1/README.md), [Feature contracts](docs/sprints/sprint-1/contracts.md), [STS](docs/sprints/sprint-1/sts.md) |
| F    |    20 | [Evidence register](docs/deliverable-1/evidence-register.md), [แผนประกอบรายงาน](docs/deliverable-1/report-plan.md)                                         |

อ่าน [Decisions และคำถามคงค้าง](docs/decisions.md) และ [Change log](docs/changelog.md) ร่วมด้วย

## วิธีใช้ชุดเอกสาร

1. สมาชิกทั้งคู่ตรวจ SRS ขอบเขต Sprint และสมมติฐาน แล้วบันทึกการทบทวนจริง
2. ใช้ stack ที่ผู้ใช้กำหนด ตรวจ contracts และรายละเอียด design ก่อนสร้าง Issues/เริ่ม implement
3. พัฒนาตาม contract ที่ version ไว้ เก็บ test แดงก่อนและเขียวหลังสำหรับกฎสำคัญ
4. เติม actual test file/name, ผลรัน และ commit ใน traceability/evidence ตามสิ่งที่เกิดขึ้นจริง
5. รวมเอกสารและหลักฐานลง PDF เดียว Parts A–F ใส่เลขหน้าจริงหลังจัดหน้า แล้วส่งผ่าน LEB2

ตอนนี้ยังไม่มีคำสั่ง build/run/test ของแอปที่ยืนยันว่ารันได้ ข้อความใน STS เป็นแผนทดสอบ ไม่ใช่ผลทดสอบ ห้ามแทนค่า PLANNED ด้วย PASS จนมี execution evidence

## ขอบเขตงานรอบนี้

จัดทำเฉพาะเอกสาร ไม่สร้าง source code, database, test implementation, commit, Issue, PR, cloud deployment หรือ PDF ส่งงานฉบับสุดท้าย Part F จึงเป็นทะเบียนหลักฐานที่ต้องเติมภายหลัง

## เอกสารต้นทาง

- `../group_work_specs_v1.pdf`: ขอบเขตผลิตภัณฑ์ Theme 3, กระบวนการพัฒนา และ Labs 5–7
- `../project_deliverable_1_v1.pdf`: เกณฑ์ Parts A–F และรูปแบบส่ง Deliverable 1
- `../project_deliverable_2_v1.pdf`: ขอบเขตความต่อเนื่อง Sprint 2/3
- `../project_final_delivery_v1.pdf`: ผลลัพธ์และการส่งมอบสุดท้าย

เอกสารประกอบ Deliverable 1 กำหนดให้เนื้อหาเต็มอยู่ใน PDF จึงเตรียมเนื้อหาเต็มใน Markdown ก่อน ยังไม่ถือว่าไฟล์ Markdown ชุดนี้เป็นการส่งงานที่ครบถ้วน
