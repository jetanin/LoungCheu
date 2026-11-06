# Deliverable 1 — PDF Assembly Checklist

Documentation baseline v0.5 | 5 พฤศจิกายน 2026 | คู่มือภายในสำหรับประกอบรายงาน

ส่ง PDF เดียวต่อทีมผ่าน LEB2 ภายใน 8 พฤศจิกายน 2026 เวลา 23:59 รวม 80 คะแนน ไม่มี fixed page limit หน้าต้นระบุสมาชิก Theme/context, repository URL, submitted application tag/commit และสารบัญพร้อมเลขหน้าจริง

## Contents / navigation

| Part | คะแนน | เนื้อหาเต็มจาก | IDs | หน้า PDF |
|---|---:|---|---|---|
| A | 10 | SRS และ decisions ที่เกี่ยวข้อง | FR-01–15, BR-01–14, NFR-01–09 | รอจัดหน้า |
| B | 10 | Feature inventory และ traceability | F-01–09, SYS responsibilities | รอจัดหน้า |
| C | 15 | System SDS | Architecture/data/UI/API/access/deployment | รอจัดหน้า |
| D | 5 | Three-sprint plan | Sprint 1–3 | รอจัดหน้า |
| E | 20 | Sprint 1 overview/DoD, contracts และ STS | AC-01–27, TEST-01–36, DOD-01–10 | รอจัดหน้า |
| F | 20 | Evidence register และ actual results ใน traceability | EV-01–12, Issue/PR/release IDs | รอจัดหน้า |

ใช้เลขหน้าอ้างอิงภายใน PDF; repository เก็บเอกสาร/source/tests ให้ตรวจซ้ำได้ ส่วนคู่มือไฟล์นี้ใช้จัดงาน ไม่ต้องแนบคำอธิบายวิธีประกอบรายงานทั้งหมด

## Final checks

- [ ] Metadata ถูกต้อง; submitted tag/commit เป็น working release บน main
- [ ] Parts A–E อยู่ใน PDF ครบ รวม decisions และ revision history ที่เกี่ยวข้อง
- [ ] ภาพ normal journey + persisted retrieval + rule rejection + login/logout/access restriction มี role, preconditions, steps, expected/actual และ tested commit
- [ ] Build/test commands และ readable output ระบุ pass/fail/skipped และ tested commit
- [ ] ทุก Sprint 1 AC มี planned test, actual file/name และ result; automated/manual แยกกัน
- [ ] Actual automated test excerpts 2 กรณี: domain rule และ role/ownership พร้อม setup/assertion/results
- [ ] TDD red→green ระบุ intended behavior และ versions
- [ ] 2 completed Issue/PR chains มี substantive reviews และ integration เข้า staging/main
- [ ] Board URL/final status/date, release reference, contributions และ AI-use declaration อยู่ใน PDF
- [ ] Setup/migration/seed/build/run/test summary ทำซ้ำได้; demo access ส่งอย่างปลอดภัย
- [ ] ระบุ failed/skipped/incomplete work และ limitations
- [ ] สารบัญ/เลขหน้า/ภาพ/ตารางอ่านได้; repository accessible และไม่มี secrets

D1 ใช้ local release; completed Docker/CI/CD/GCP และ separate video ยังไม่ต้องส่ง ดูแหล่งข้อกำหนดใน [README](../../README.md)
