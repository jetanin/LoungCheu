# Deliverable 1 — แผนประกอบรายงาน PDF

Version 0.1 | 4 พฤศจิกายน 2026 | เอกสารนี้เป็นคู่มือประกอบรายงาน ยังไม่ใช่ final submission PDF

ส่ง PDF เดียวต่อทีมผ่าน LEB2 ก่อน 8 พฤศจิกายน 2026 เวลา 23:59 รวม 80 คะแนน ไม่มี fixed page limit เอกสารต้นทางและ code/tests คงไว้ใน repository ด้วย ลิงก์ภายนอกไม่แทนเอกสารที่ต้องอยู่ใน PDF

## 1. Cover และ navigation

หน้าต้นต้องใส่ชื่อ/รหัสสมาชิกทั้งสอง Theme 3 และบริบทชื่อ LoungCheu, Repository URL และ immutable release tag/commit เมื่อมี release จริง

| Part | คะแนน | นำเนื้อหาฉบับเต็มจาก | IDs ที่สำคัญ | หน้า PDF |
|---|---:|---|---|---|
| A | 10 | docs/srs.md | FR-01–15, BR-01–14, NFR-01–09 | กำหนดหลังจัดหน้า |
| B | 10 | docs/features.md + docs/traceability.md | F-01–09, SYS responsibilities | กำหนดหลังจัดหน้า |
| C | 15 | docs/system-sds.md | Architecture, entities, access matrix | กำหนดหลังจัดหน้า |
| D | 5 | docs/sprints/plan.md | Sprint 1–3 และ checkpoint | กำหนดหลังจัดหน้า |
| E | 20 | docs/sprints/sprint-1/README.md + contracts.md + sts.md | AC-01–27, TEST-01–36, DOD-01–10 | กำหนดหลังจัดหน้า |
| F | 20 | evidence-register.md ที่เติมผลจริง และ actual results ใน traceability | EV-01–12, release/Issue/PR IDs จริง | กำหนดหลังจัดหน้า |

นำ decision log, changelog/AI-use และ review record ใส่ในส่วนที่อ้างหรือ appendix ภายใน PDF เดียว ไม่ใส่แค่ลิงก์ Markdown ให้ grader เปิดเอง เลขหน้าและ page ranges ต้องมาจาก PDF ที่จัดหน้าจริง ไม่คาดเดาไว้ล่วงหน้า

## 2. Submission checklist

- [ ] ชื่อ/รหัสสมาชิก Theme eligibility และ Repository URL ถูกต้อง
- [ ] ทีมยืนยันขอบเขต/stack/กติกา และเอกสารอธิบาย behavior ที่ release จริง
- [ ] Parts A–E มีเนื้อหาเต็ม รวมทุก Sprint 1 contract/AC/STS/DoD
- [ ] F-01–05 implement และมี complete normal domain journey ไม่ใช่แค่ Login
- [ ] มี persisted retrieval, rule rejection และ backend role/ownership evidence
- [ ] มี build/test commands, actual output, pass/fail/skipped counts และ tested commit
- [ ] ทุก Sprint 1 AC เชื่อม planned test และ actual file/test/result/manual record
- [ ] แนบ actual automated test excerpts 2 กรณี: domain rule และ access restriction
- [ ] มี meaningful TDD red/green กับ versions จริง
- [ ] มี completed Issue/PR chains 2 ชุดและ substantive teammate reviews
- [ ] มี staging integration/release PR เข้า main, tag/commit และ board status จริง
- [ ] มี local setup/migration/seed และ clean reproduction summary
- [ ] ระบุ contributions, AI-use และ known incomplete/failed/skipped work ตามจริง
- [ ] ไม่ใส่ production secrets/real passwords ใน PDF/Git
- [ ] ภาพ/ตาราง/แผนภาพอ่านได้ในขนาดปกติ และ navigation มีเลขหน้าจริง
- [ ] Submitted release ยังเข้าถึงได้ และ later commits ไม่แทน assessed version เงียบ ๆ

Checklist ทั้งหมดเริ่มต้นเป็น unchecked เพราะยังไม่มีการตรวจรับจริง ชุด Markdown นี้เป็นเนื้อหาเริ่มต้นสำหรับเอกสาร ไม่ทำให้ D1 ครบ 80 คะแนนโดยไม่มี implementation/evidence

## 3. การจัดหลักฐานให้กระชับ

ใช้ screenshots เป็นชุด journey พร้อม caption: Feature/AC, role, preconditions, steps, expected/actual และ commit อ้างเลขหน้าภายในรายงานแทนการวางภาพซ้ำ ตาราง traceability ฉบับเต็มใส่ครั้งเดียวและ cross-reference ส่วนที่เกี่ยวข้อง

แยก automated result ออกจาก manual check อย่างชัดเจน ตัวอย่าง test excerpt แสดง setup/assertion ที่สำคัญพร้อมผลรัน ไม่ dump source ทั้งไฟล์หรือเขียน pseudocode ให้ดูเหมือน execution evidence

## 4. สิ่งที่ยังไม่ต้องส่งใน D1

ยังไม่ต้องมี separate demo video, deployed GCP URL, completed Docker setup หรือ CI/CD pipeline แต่ต้องมีแผน deployment และ local release/test evidence ตาม Parts C/F Lab 5 รับช่วง deployment จาก Sprint 1
