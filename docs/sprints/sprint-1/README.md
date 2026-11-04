# Part E — Sprint 1 Engineering Baseline และ Product DoD

Version 0.1 | 4 พฤศจิกายน 2026 | สถานะ: PLANNED, ยังไม่ review/implement/execute

## Sprint goal

ผู้จัดสร้าง/เผยแพร่กิจกรรมที่จำกัดที่นั่ง ผู้เข้าร่วม Login ลงทะเบียนและอ่านผลที่ persist แล้ว ผู้จัดอ่าน roster ได้ โดย backend ป้องกัน role/ownership violation และป้องกัน duplicate/over-capacity รวมคำขอพร้อมกัน

Scope คือ F-01–05; ยังไม่มี cancel/reactivate, close action, edit published event, check-in หรือ summary report ใน Sprint 1 การบันทึก event ที่ status=CLOSED เพื่อ negative test ทำผ่าน fixture ไม่ได้แปลว่ามี Close UI แล้ว

## เอกสารที่เป็น contract ก่อน implement

- [Feature contracts](contracts.md): พฤติกรรม UI/API/data และ AC ของ F-01–05
- [Software Test Specification](sts.md): TEST-01–36 และ trace ไป AC
- [SRS](../../srs.md), [System SDS](../../system-sds.md), [Traceability](../../traceability.md)

ก่อนเริ่ม coding ให้สมาชิกทั้งคู่ยืนยัน baseline, สร้าง Issue อ้าง IDs และบันทึก revision/commit จริงของ contract ถ้ากฎเปลี่ยนให้แก้ AC/STS และ changelog พร้อมเหตุผล

## Product Definition of Done

| ID | เงื่อนไข | หลักฐานที่ต้องตรวจ |
|---|---|---|
| DOD-01 | Feature ทำงานตามทุก AC ที่รับใน Sprint พร้อม normal/negative/boundary cases | AC results และ program demonstrations |
| DOD-02 | Unit/API/database และ selected UI/E2E tests รันจริง ไม่ใช้ stub/mock-only แทน persistence/access | Actual file/name, commands, pass/fail/skipped counts, commit |
| DOD-03 | Last-seat/duplicate race รักษา DB invariant | PostgreSQL multi-connection tests และ DB count |
| DOD-04 | Login/Logout/expiry และ backend roles/ownership ใช้งานได้ | Session และ access tests ไม่ใช่แค่ซ่อนปุ่ม |
| DOD-05 | Data ยังอยู่เมื่อ restart แอป และ setup/seed ทำซ้ำได้ | Restart/reproduction record โดยเพื่อนร่วมทีม |
| DOD-06 | เก็บ meaningful TDD สำหรับกฎ เช่น last-seat/duplicate | Intended assertion แดงก่อน implementation/correction และเขียวหลัง พร้อม versions |
| DOD-07 | Issue/branch/PR ได้ teammate review ที่มีเนื้อหา แล้ว integration tests/acceptance ผ่านก่อน release main | GitHub IDs, authors/reviewers, review content, merge/release commit |
| DOD-08 | SRS/SDS/contracts/traceability/README อัปเดตตรงกับ release | Document revision และ baseline review |
| DOD-09 | ระบุ limitations/failed/skipped/incomplete งานและไม่ใส่ secrets ใน Git/PDF | Defect register และ safe access review |
| DOD-10 | ตั้งแต่ Lab 5 เป็นต้นไปมี CI gate, Docker/GCP version และ post-deploy verification; final มี independent acceptance และส่งมอบครบ | Pipeline/deployment/UAT records ตาม checkpoint; D1 ส่วนนี้เป็น PLANNED ไม่อ้างผ่าน |

ณ วันที่ร่างเอกสารนี้ DOD-01–09 ยังไม่มี execution/completion evidence และ DOD-10 ยังไม่ถึง implementation checkpoint เอกสารเพียงอย่างเดียวไม่ทำให้ feature เสร็จ

## Review gate ก่อนรับ implementation

ผู้รีวิวต้องตรวจ linked requirements, input validation, backend role/ownership, transaction boundary, test assertions, errors และผลต่อข้อมูลเดิม อธิบายสิ่งที่ตรวจหรือเหตุผลอนุมัติอย่างเจาะจง ไม่ใช้เพียงข้อความ “LGTM” เป็นหลักฐาน substantive review
