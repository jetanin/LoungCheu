# Part F — Working Sprint 1 และ Evidence Register

Version 0.1 | 4 พฤศจิกายน 2026

**ยังไม่มี working application, test execution, GitHub Issues/PRs, teammate review หรือ release หลักฐานทั้งหมดด้านล่างมีสถานะ MISSING / NOT EXECUTED** จัดเตรียมโครงบันทึกเพื่อเก็บข้อมูลจริงภายหลัง ไม่ใช่รายงานผลการทำงานที่เสร็จแล้ว

## 1. Release identification

| รายการ | ค่า |
|---|---|
| Repository URL | รอทีมกรอก |
| Sprint staging branch | วางแผนใช้ dev เป็น integration branch; ยังไม่มี branch/merge evidence |
| Submitted main commit / tag | ยังไม่มี release |
| Runtime / dependency / DB versions | ยังไม่เลือก/pin/execute |
| Test environment / execution date | ยังไม่ execute |
| ผู้พัฒนา / ผู้รีวิว / ผู้ทดสอบ | รอชื่อและการทำงานจริง |

## 2. Program demonstration scenarios

ทุก scenario ต้องแนบภาพจริงที่อ่านได้ role/fixture/version และ expected/actual result ภาพปุ่มซ่อนอย่างเดียวไม่พิสูจน์ backend permission; แสดง API/test/DB หลักฐานตามที่เกี่ยวข้อง

| Evidence | Feature / AC | Role และ starting conditions | ขั้นตอนที่ต้องทำ | Expected | Actual / version |
|---|---|---|---|---|---|
| EV-01 | F-01–05 / AC-01,06,08,12,18,21,24 | OA/PA seed; valid future event | OA Login/create/publish → PA Login/register/read saved detail → OA roster | ID/participant/count ตรงข้อมูลบันทึกจริง | MISSING / — |
| EV-02 | F-03 / AC-13–15 | PA ลงแล้ว หรือ event full/deadline fixture | ส่ง duplicate/full/closed request และตรวจ DB count ก่อน–หลัง | API 409 ตามกรณี, ไม่มี record เพิ่ม | MISSING / — |
| EV-03 | F-01,F-02,F-04,F-05 / AC-04,10,19,22 | PA/PB/OA/OB | Logout แล้วใช้ session เก่า; PA เรียก owner API; OB เปิด OA roster; PA เปิด PB registration | 401/403/404 ตาม contract, ไม่คืน private data | MISSING / — |
| EV-04 | Cross-feature / AC-25 | Saved registration และ app/DB แยก process | Restart app แล้ว Login/read own/roster จาก DB | Record/reference/count คงอยู่ | MISSING / — |

### Caption template ต่อภาพ/ชุดภาพ

- Evidence / Feature / AC IDs: รอกรอก
- Role และข้อมูลตั้งต้นที่สังเคราะห์: รอกรอก
- Steps: รอการทำงานจริง
- Expected result: อ้าง contract
- Actual result: NOT EXECUTED
- Tested commit / exception จาก release หลัก: ยังไม่มี
- Screenshot หรือ output ที่แนบใน PDF: ยังไม่มี

## 3. Build/test results

| Evidence | สิ่งที่ต้องบันทึก | Actual command | ผล / counts / commit |
|---|---|---|---|
| EV-05 | TypeScript checks, Vite/Express build และ Vitest/Supertest รวม Prisma/PostgreSQL integration/concurrency | ยังไม่มีคำสั่งที่ implement แล้ว | NOT EXECUTED; counts ยังไม่มี |
| EV-06 | Selected browser E2E และ manual checks แยกจาก automated | ยังไม่มี | NOT EXECUTED |
| EV-07 | Domain-rule actual test excerpt เช่น TEST-16/20: setup + assertions + execution result | ยังไม่มี test source | MISSING |
| EV-08 | Access-rule actual test excerpt เช่น TEST-23/27: setup + assertions + execution result | ยังไม่มี test source | MISSING |
| EV-09 | Meaningful TDD red และ green พร้อม test/implementation versions | ยังไม่มี | MISSING |

ต้องแนบ output จริงที่อ่าน pass/fail/skipped ได้และตรง commit ไม่แต่ง terminal output ไม่อ้างว่ามี test files จาก STS เพียงอย่างเดียว ใช้ AC result table ใน traceability เป็นตารางผลหลักและเติม actual path/test name ในทุกแถว

## 4. สอง Issue/PR chains ที่ต้องเก็บ

| Field | Chain 1 ที่เสนอ: F-03 duplicate/capacity | Chain 2 ที่เสนอ: F-05 owner roster |
|---|---|---|
| Requirement / contract / test | FR-06, AC-12–17, TEST-15–21 | FR-08, AC-21–23, TEST-26–29 |
| Issue ID / วันที่ | ยังไม่มี | ยังไม่มี |
| Contract/test-design commit ก่อน implementation | ยังไม่มี | ยังไม่มี |
| Feature branch จาก dev (sprint integration) | ยังไม่มี | ยังไม่มี |
| Author / pair participants | ยังไม่มี | ยังไม่มี |
| PR เข้า dev (sprint integration) | ยังไม่มี | ยังไม่มี |
| Teammate reviewer / substantive finding | ยังไม่มี | ยังไม่มี |
| Review/แก้ไข/ผลทดสอบ | ยังไม่มี | ยังไม่มี |
| dev merge/integration checks | ยังไม่มี | ยังไม่มี |
| Reviewed release PR dev → main | ยังไม่มี | ยังไม่มี |
| Release tag/commit / วันที่ | ยังไม่มี | ยังไม่มี |

EV-10: แนบ chain table พร้อมภาพ/ประวัติ GitHub ที่อ่าน IDs/dates/review ได้ EV-11: final board status และ release reference ยัง MISSING ทั้งคู่ ไม่สร้าง Issue/PR ปลอมเพื่อเติมตาราง

## 5. Setup และ reproduction summary ที่ต้องเติม

อ้าง design ใน System SDS แต่เมื่อมีแอปต้องใส่คำสั่งจริงต่อไปนี้ พร้อมผลที่เพื่อนทำตามแล้ว:

| ขั้นตอน | Actual instruction / outcome |
|---|---|
| Runtime/dependency installation | ยังไม่มี executable project |
| Safe environment configuration | Names เสนอใน SDS; ยังไม่มี .env.example ของแอป |
| Database creation/migration | ยังไม่มี migration |
| Synthetic seed และ private demo access | ยังไม่มี seed; ห้ามกรอก real passwords ใน PDF/Git |
| Build/run/test commands | ยังไม่มี |
| Teammate clean reproduction | NOT EXECUTED; EV-12 |

Cloud URL/Docker/CI pipeline ยังไม่ใช่สิ่งที่ต้องเสร็จใน D1 แต่ design ต้องรองรับ การระบุว่าไม่ครบในตอนนี้ไม่ได้แทนหลักฐาน local release ที่ D1 ต้องมี

## 6. Contribution table

| สมาชิก | งานเอกสาร/การตัดสินใจจริง | Coding/tests/review/integration จริง | Evidence |
|---|---|---|---|
| M1: รอชื่อ/รหัส | รอทีมตรวจทานและระบุ contribution จริง | ยังไม่มี | — |
| M2: รอชื่อ/รหัส | รอทีมตรวจทานและระบุ contribution จริง | ยังไม่มี | — |

AI-use declaration อยู่ใน changelog; เพิ่มงานที่ AI ช่วยจริงในอนาคต และบันทึกการตรวจรับของมนุษย์ ไม่ต้องแนบ prompt transcript ยาว

## 7. Known limitations / remaining work

| ID | ประเภท | สถานะและผลกระทบ | Next action |
|---|---|---|---|
| GAP-01 | Required implementation missing | F-01–05 ทั้งหมดยังไม่ implement; ยังไม่เป็น working Sprint 1 | พัฒนาตาม contracts หลัง baseline review |
| GAP-02 | Required verification missing | ไม่มี automated/manual execution หรือ TDD evidence | Implement/run tests และเก็บ results/versions |
| GAP-03 | Required process missing | ไม่มี Issues/PR/review/integration/release history ที่ยืนยันได้ | ดำเนิน workflow จริงตั้งแต่เริ่ม coding |
| GAP-04 | Submission metadata missing | ชื่อ/รหัส/repo/theme eligibility ยังไม่ยืนยัน | สมาชิกทั้งคู่เติมและตรวจ |
| GAP-05 | Submission packaging pending | ยังไม่มี self-contained PDF และเลขหน้าจริง | ประกอบรายงานหลังมีหลักฐานจริง |

รายการข้างต้นคือ required work ที่ยังไม่ทำ ไม่เรียกว่า technical debt เพื่อกลบความไม่ครบ ไม่มี defect ที่ค้นพบจาก execution ณ ตอนนี้เพราะยังไม่ได้ทดสอบ ไม่ได้หมายความว่าระบบปราศจาก defect
