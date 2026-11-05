# Decisions, Assumptions และ Review Record

Documentation baseline v0.5 | 5 พฤศจิกายน 2026

ตารางนี้เป็น design ที่เสนอให้ทีมตรวจรับ รายการที่ระบุว่ายืนยันแล้วคือ stack และชื่อ branch; ประวัติ revision/commit ดู [Changelog](changelog.md)

| ID | การตัดสินใจ / สมมติฐาน | เหตุผล |
|---|---|---|
| DEC-01 | กิจกรรมภายในมหาวิทยาลัย; ชื่อ LoungCheu | จำกัดโดเมนและใช้ข้อมูลสังเคราะห์ |
| DEC-02 | React/TypeScript/Vite/Bootstrap, Express/TypeScript, PostgreSQL/Prisma และ REST JSON; stack ยืนยันแล้ว | แยก UI/API/data ชัดเจนและ deploy same-origin ได้ |
| DEC-03 | หนึ่งบัญชีมีหนึ่ง role; ใช้ seeded demo accounts | เพียงพอสำหรับ workflow โดยไม่เพิ่ม account administration |
| DEC-04 | Session อายุ 2 ชั่วโมงจาก Login; mutations ใช้ CSRF token | Logout invalidate ฝั่ง server ได้ |
| DEC-05 | Login ก่อนดูรายการกิจกรรม | ใช้ access policy เดียวกับข้อมูลลงทะเบียน |
| DEC-06 | UTC millisecond ใน DB/API; UI Asia/Bangkok; ตรวจ deadline หลังได้ event lock | ป้องกัน timezone/lock-wait boundary ผิด; format ตาม BR-14 |
| DEC-07 | ยกเลิกก่อน deadline และ event=PUBLISHED เท่านั้น | คงรายชื่อเมื่อปิดรับแล้ว |
| DEC-08 | หนึ่ง record ต่อ user/event; registered_at เป็นเวลาลงครั้งแรก; S2 cancel ตั้ง cancelled_at และ reactivate ล้าง cancelled_at พร้อมเก็บ history | ป้องกันซ้ำและรักษา timestamp สำหรับ backfill/history |
| DEC-09 | Lock Event ก่อนตรวจ count/ทำ seat mutations ใน transaction | คุม last-seat race และ capacity changes |
| DEC-10 | capacity 1–1,000; string lengths นับ Unicode code points หลัง trim; CLOSED ไม่เปิดกลับ/แก้ Event fields; ไม่มี delete | ใช้ validation เดียวกันทั้ง UI/API และคงข้อมูลอ้างอิง |
| DEC-11 | Organizer กดเช็กชื่อช่วงเริ่ม–จบ; ซ้ำตอบ 409 ALREADY_CHECKED_IN คงข้อมูลเดิม | ไม่ต้องใช้ QR และไม่สร้าง attendance ซ้ำ |
| DEC-12 | API prefix /api; identity/role จาก session | ป้องกัน client spoofing |
| DEC-13 | Vitest/Supertest, GitHub Projects และ Issues #1–4 ตาม sprint plan | จำนวน Issues เป็นแผนทีม; เพิ่ม setup/fix/change Issues ได้ |
| DEC-14 | express-session + PostgreSQL store, salted scrypt hash; เสนอ Playwright สำหรับ E2E | รองรับ session lifecycle และ browser journey |
| DEC-15 | sprint-1-staging เป็น integration branch; feature PRs กลับ staging ก่อน release PR เข้า main; ชื่อ branch ยืนยันแล้ว | รวมงานและให้เพื่อนตรวจทุก PR; baseline integration ตาม sprint plan |
| DEC-16 | Summary นับสถานะปัจจุบัน; lifecycle history นับเหตุการณ์แยก | Reactivate ลด CANCELLED และเพิ่ม ACTIVE; ไม่สะสมจำนวนครั้ง cancel ใน summary |
| DEC-17 | UUID และ named schemas; validation/error code/precedence ตาม System SDS และ feature contracts | ให้ UI/API/tests ใช้ contract เดียวกัน; ownership ยังตรวจบน backend |

## คำถามและสถานะ

| ID | สถานะ / ข้อสรุป | งานถัดไป |
|---|---|---|
| Q-01 | Resolved: Theme 3 จาก M2 รหัสลงท้าย 3 ตาม master หน้า 4 | ทีมตรวจ metadata ก่อนส่ง |
| Q-02 | ชื่อ/รหัส/repo ระบุใน README; ทีมแจ้งว่ามี Issues #1–4; assignment/board ยังรอยืนยัน | ตรวจ Issue scopes/assignees เติม board URL และ contribution ตามจริง |
| Q-03 | Resolved: stack ตาม DEC-02/13 | Pin runtime/dependency versions ตอน implement |
| Q-04 | Pending: ทีมตรวจรับ business/design decisions | ตรวจ BR-08,11–14, DEC-04/06/08/11/14/16/17 และ AC/STS |
| Q-05 | Pending: GCP resources/persistence ตาม Lab 5 | ยืนยัน deployment components ก่อน deploy |
| Q-06 | Master หน้า 13: Final video ≤10 นาที (8 คะแนน), summary ≤1 หน้า (2 คะแนน) | ตรวจ Final handout เพิ่ม; ถ้าขัดกันบันทึกแหล่งและถาม TA |
| Q-07 | Pending: local docs baseline กับ staging ไม่มี common ancestor ในรอบตรวจนี้ | Fetch/check อีกครั้ง; หากยังต่าง root นำเอกสารเข้า branch ใหม่จาก staging ตาม sprint plan ก่อน PR |

## Teammate baseline review

| Revision | Reviewer / วันที่ | Document commit / PR | ข้อเสนอแนะและผลตัดสินใจ |
|---|---|---|---|
| v0.5 | PENDING | PENDING | PENDING |

บันทึก reviewer จริง สิ่งที่ตรวจ DEC/BR/AC/Test ที่กระทบ และผล accepted/changes requested ถ้าร่วมเขียน ให้ระบุ contribution และส่วนที่ตรวจข้ามกัน ผู้เขียน PR ไม่ approve งานตนเอง การตรวจโดย Codex เป็น AI assistance ตาม changelog
