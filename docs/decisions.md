# Decisions, Assumptions และคำถามคงค้าง

Version 0.2 | 4 พฤศจิกายน 2026

ผู้ใช้ยืนยัน technology stack ตามภาพเมื่อ 4 พฤศจิกายน 2026 แล้ว (DEC-02, DEC-13) ส่วน business/design decisions อื่นยังเป็นข้อเสนอ ไม่มีการอ้างว่าอาจารย์/TA อนุมัติหรือทีม review แล้ว

| ID | ข้อเสนอ/สมมติฐาน | เหตุผลและผลกระทบ | สถานะ |
|---|---|---|---|
| DEC-01 | ใช้บริบทกิจกรรมภายในมหาวิทยาลัย; ชื่อ LoungCheu | จำกัดโดเมนและใช้ข้อมูลสังเคราะห์ได้ | เสนอ |
| DEC-02 | React + TypeScript + Vite + Bootstrap; Node.js + Express + TypeScript; PostgreSQL + Prisma; REST-style APIs | ใช้ stack ตามภาพที่ผู้ใช้กำหนด แทนข้อเสนอเดิม; แยก frontend/backend source แต่ deploy same-origin ได้ | ยืนยันโดยผู้ใช้ 4 พ.ย. 2026 |
| DEC-03 | หนึ่ง user มีหนึ่ง role; ไม่สมัครบัญชีผ่าน UI | Seed demo accounts เพียงพอสำหรับ Sprint 1 ตามโจทย์ | เสนอ |
| DEC-04 | Session auth อายุ 2 ชั่วโมงหลัง Login; CSRF protection สำหรับคำขอเปลี่ยนข้อมูล | รองรับ Logout ที่ invalidate session ฝั่ง server โดยตรง | เสนอ |
| DEC-05 | Login ก่อนดูรายการกิจกรรมทั้งหมด | ลดกรณี anonymous; ไม่ลดข้อบังคับเผยแพร่ให้ Participant เห็น | เสนอ |
| DEC-06 | เวลา UTC ใน DB, Asia/Bangkok ใน UI | ชัดเจนสำหรับ deadline และขอบเขตเวลา | เสนอ |
| DEC-07 | Participant ยกเลิกก่อน deadline และ event=PUBLISHED เท่านั้น | ป้องกันแก้รายชื่อหลังปิดรับ; แจ้งกฎบน UI | เสนอ |
| DEC-08 | Registration record เดียวต่อ user/event; ยกเลิกแล้ว activate record เดิมพร้อม lifecycle history | ป้องกันซ้ำ; ทำให้ต้องเพิ่ม history ใน Sprint 2 และเปลี่ยน duplicate branch ของ F-03 อย่างมีประวัติ | เสนอ |
| DEC-09 | Lock event row ก่อนตรวจ count และก่อน mutation ที่กระทบสิทธิ์รับที่นั่ง | คุม last-seat race และประสานกับ cancellation/capacity change | เสนอ |
| DEC-10 | จำกัด capacity 1–1,000; ไม่เปิด event CLOSED กลับ; ไม่มี delete | ขอบเขตทีมสองคน; คงข้อมูลอ้างอิงไว้ | เสนอ |
| DEC-11 | เช็กชื่อด้วยปุ่ม Organizer ระหว่างเริ่มถึงจบกิจกรรม ไม่มี QR | ครอบคลุม attendance โดยไม่เพิ่มการจัดการ token/อุปกรณ์ | เสนอ |
| DEC-12 | เลือก API JSON prefix /api; UI ไม่รับ user ID/role เพื่อใช้เป็นตัวตน | Backend ใช้ session และ query scope เป็นหลัก | เสนอ |
| DEC-13 | Vitest + Supertest; GitHub Projects; feature/* → dev → main พร้อม peer review; เริ่มแผน 4 Issues | dev ใช้เป็น sprint integration branch; 4 Issues เป็น initial work breakdown ตามภาพ ไม่ห้ามเปิด fix Issues เพิ่ม | ยืนยันเครื่องมือ/workflow ตามผู้ใช้; การแบ่ง Issue เป็นแผน |
| DEC-14 | Express server-side session บน PostgreSQL, scrypt password hashing และ CSRF token; เสนอ Playwright เพิ่มสำหรับ browser E2E | แทนกลไก framework ของข้อเสนอเดิม โดยคง AC/security behavior เดิม | เสนอ implementation design; ยังไม่ทดสอบ |

## Open questions ก่อนพัฒนา

| ID | คำถาม | ผู้รับผิดชอบ | ผลต่อเอกสาร |
|---|---|---|---|
| Q-01 | สมาชิกคนใดมีเลขท้ายรหัส 3 เพื่อใช้ Theme 3 ตามโจทย์? | สมาชิกทั้งคู่ | ยืนยัน theme ก่อน baseline review |
| Q-02 | ชื่อ/รหัสสมาชิก Repository URL และชื่อผู้พัฒนา/ผู้รีวิวแต่ละงานคืออะไร? | ทีม | README, sprint plan, evidence |
| Q-03 (resolved) | ผู้ใช้กำหนด React/Express/TypeScript/PostgreSQL/Prisma และ Vitest/Supertest แล้ว | ผู้ใช้ 4 พ.ย. 2026 | ปรับ System SDS, auth contracts, STS และ workflow แล้ว; versions/lockfile กำหนดตอน implement |
| Q-04 | สมาชิกทั้งคู่ยอมรับกติกายกเลิก/เช็กชื่อ/แก้เวลาแล้วหรือยัง? | ทีม; ถ้าสงสัยถาม TA | SRS BR-08,11–12 และ contracts ใน Sprint 2/3 |
| Q-05 | GCP resource และ DB persistence จัดให้ผ่านวิธีใดใน Lab 5? | ทีมตาม handout Lab 5 | ปรับ deployment design ก่อน deploy |
| Q-06 | Final video ใช้เพดาน 4 หรือ 10 นาที และ rubric 10 หรือ 8+2? | ทีมถามอาจารย์/TA ก่อน Final | ไม่กระทบ D1; ยังไม่สรุปเองว่าอนุมัติเกณฑ์ใด |

## Baseline review record

| Version | Reviewer | วันที่ | ข้อเสนอแนะ / การตัดสินใจ |
|---|---|---|---|
| 0.1 | ยังไม่ได้ระบุ | ยังไม่ได้ review | เตรียมเอกสารแล้ว แต่ไม่มีการอนุมัติหรือการตรวจจากเพื่อนร่วมทีม |
| 0.2 | ผู้ใช้ยืนยันเฉพาะ stack ผ่านข้อความในแชต | 4 พ.ย. 2026 | ปรับตามภาพ; ไม่ใช่ teammate review ของ design/implementation ทั้งชุด |

ทุก revision ต้องระบุ requirement/AC/test ที่กระทบและเหตุผล การย้าย required feature ข้าม Sprint ต้องมี scope revision ที่ทีมยืนยัน และเมื่อกระทบ baseline ที่รายวิชากำหนดต้องบันทึกการอนุมัติที่เกี่ยวข้อง
