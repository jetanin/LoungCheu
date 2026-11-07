# Part E — Sprint 1 Engineering Baseline และ Product DoD

7 พ.ย. 2026: F-04/F-05 implement แล้วบน `feature/registration-views`; API/DB/unit/UI159 PASS และ typecheck/build PASS ดู [current Issue #4 results](../../registration/views-verification.md) สำหรับ browser status และข้อจำกัด Product DoD ยังรอ teammate review/reproduction, process restart, UAT และ release ผลและข้อความ pending Issue #4 ด้านล่างเป็น historical records

**UI consistency follow-up:** ล่าสุด 145 Vitest / 35 Chromium, typecheck/build/compiled smoke PASS รวม typography/layout/state checks ที่1280/390/320px ดู [current UI evidence](../../events/visual-consistency.md) ผล141/32 และ seed follow-up ด้านล่างเป็น historical runs

**Seed follow-up (6 พ.ย.):** full Vitest **145 PASS** รวม seed integration ใหม่4 และ typecheck PASS; 141/32 ใน feature audit ด้านล่างเป็นรอบก่อนเพิ่ม seed โดย Chromium/build ไม่ได้ rerun รอบ seed ดู [latest seed results](../../events/demo-seed.md) ไม่มี AC/scope ใหม่

Documentation baseline v0.5 | 5 พฤศจิกายน 2026 | Execution update 6 พ.ย.: F-01/F-02/F-03 รวมและทดสอบบน feature/events merge working tree ดู [combined verification](../../events/consistency-review.md); Sprint 1 ยังไม่ผ่าน Product DoD ทั้งชุด

## Sprint goal

ผู้จัดสร้าง/เผยแพร่กิจกรรมที่จำกัดที่นั่ง ผู้เข้าร่วม Login ลงทะเบียนและอ่านผลที่ persist แล้ว ผู้จัดอ่าน roster ได้ โดย backend ป้องกัน role/ownership violation และป้องกัน duplicate/over-capacity รวมคำขอพร้อมกัน

Scope: F-01–05; cancel/reactivate/close/edit อยู่ S2 และ check-in/summary อยู่ S3 ค่า CLOSED ใน Sprint 1 tests เตรียมผ่าน fixture

## เอกสารที่เป็น contract ก่อน implement

- [Feature contracts](contracts.md): พฤติกรรม UI/API/data และ AC ของ F-01–05
- [Software Test Specification](sts.md): TEST-01–36 และ trace ไป AC
- [SRS](../../srs.md), [System SDS](../../system-sds.md), [Traceability](../../traceability.md)

Version contracts/STS ก่อน implementation และดำเนิน reviewed integration ตาม [Sprint plan](../plan.md) ประวัติเอกสารดู [Changelog](../../changelog.md)

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

DOD-01/02/04/06/08/09 มีหลักฐานส่วน F-01–03 ใน [combined verification](../../events/consistency-review.md): Event permission/publish/snapshot, Registration last-seat/duplicate concurrency และ real UI lifecycle/journey รวม 141 Vitest/32 Chromium PASS แต่ DOD ทั้ง Sprint ยังไม่ complete: ขาด F-04/F-05 (Issue #4), full own-list/roster journey, process restart, teammate review/reproduction และ main release; DOD-10 ตรวจตั้งแต่ Lab 5 ไม่ถือว่า AI review แทน teammate approval

## Review gate ก่อนรับ implementation

ผู้รีวิวต้องตรวจ linked requirements, input validation, backend role/ownership, transaction boundary, test assertions, errors และผลต่อข้อมูลเดิม อธิบายสิ่งที่ตรวจหรือเหตุผลอนุมัติอย่างเจาะจง ไม่ใช้เพียงข้อความ “LGTM” เป็นหลักฐาน substantive review
