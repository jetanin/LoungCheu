# Part E — Sprint 1 Engineering Baseline และ Product DoD

**Evidence update — 14 พ.ย. 2026:** PR #7/#10 ได้ teammate review โดย i3artuf และ merge เข้า sprint-1-staging แล้ว ตาม snapshot 12 พ.ย.; PR #10 reviewed head `0bd3468`, merge `97a5b91` (10 พ.ย. 16:26:11 Asia/Bangkok). ผล 159 Vitest / 37 Chromium / typecheck / build / compiled smoke 3 PASS เป็นผลรัน 8 พ.ย. ของ source ที่ commit เป็น `3313288`; รอบแก้เอกสารนี้ไม่ได้รันทดสอบแอปใหม่. OS-process restart, independent clean reproduction/UAT และ reviewed main release ยังขาดหลักฐาน; GAP-02 ยัง OPEN และ Product DoD ยังไม่ครบ. [Review/merge evidence](../../deliverable-1/evidence/review-merge-20261112/README.md). Baseline FR/BR/NFR/AC ไม่เปลี่ยน; F-06–09 อยู่ Sprint 2/3

**Historical Event UI run — 6 พ.ย. 2026:** 145 Vitest / 35 Chromium, typecheck/build/compiled smoke PASS รวม typography/layout/state checks ที่1280/390/320px ดู [current UI evidence](../../events/visual-consistency.md) ผล141/32 และ seed follow-up ด้านล่างเป็น historical runs

**Seed follow-up (6 พ.ย.):** full Vitest **145 PASS** รวม seed integration ใหม่4 และ typecheck PASS; 141/32 ใน feature audit ด้านล่างเป็นรอบก่อนเพิ่ม seed โดย Chromium/build ไม่ได้ rerun รอบ seed ดู [latest seed results](../../events/demo-seed.md) ไม่มี AC/scope ใหม่

Documentation baseline v0.5 | 5 พฤศจิกายน2026 | Source3313288; execution8พ.ย./revision reconciliation10พ.ย.ใน Issue #4 verification; Sprint1 ยังไม่ผ่าน Product DoD ทั้งชุด

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

DOD-01/02/04 มี automated F-01–05 evidence ตาม [recorded source/results](../../registration/views-verification.md); meaningful TDD และ failed attempts คงไว้ตามวันที่เดิม ไม่ใช้ environment errors เป็น domain RED. DOD-05 ยัง PARTIAL: app recreation ผ่าน แต่ OS-process restart/independent clean reproduction ยังขาดหลักฐาน. DOD-07 ยัง PARTIAL: PR #7/#10 approved และ merged staging แล้ว แต่ reviewed main release ยังขาดหลักฐาน. GAP-02 ยัง OPEN; ไม่ประกาศ Product DoD ทั้งชุดผ่าน. DOD-10 ใช้ตาม checkpoint ตั้งแต่ Lab 5; AI execution/review ไม่แทน independent acceptance.

## Review gate ก่อนรับ implementation

ผู้รีวิวต้องตรวจ linked requirements, input validation, backend role/ownership, transaction boundary, test assertions, errors และผลต่อข้อมูลเดิม อธิบายสิ่งที่ตรวจหรือเหตุผลอนุมัติอย่างเจาะจง ไม่ใช้เพียงข้อความ “LGTM” เป็นหลักฐาน substantive review
