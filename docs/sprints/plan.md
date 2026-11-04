# Part D — Three-Sprint Plan

Version 0.2 | 4 พฤศจิกายน 2026 | Stack ยืนยันแล้ว; แผนงานไม่ใช่บันทึกงานที่เสร็จแล้ว

| Sprint | เป้าหมาย / Features | Dependencies | ผลที่ต้องได้ / Checkpoint |
|---|---|---|---|
| 1: baseline และ domain slice | F-01–05: Login, create/publish/list event, registration, own records, roster | Stack ตามผู้ใช้; ทีม review scope, Prisma data model, contracts/STS ก่อน coding | Local release บน main, Vitest/Supertest และ selected UI tests, peer-reviewed integration; D1 วันที่ 8 พ.ย. |
| 2: core expansion | F-06–07: cancellation/reactivation/close และ editing/capacity rules | Accepted Sprint 1, shared locking convention; ผล Lab 5/6 | ทุกฟีเจอร์ S2 ครบและ release แยกอ้างอิงได้; D2 วันที่ 29 พ.ย. |
| 3: completion และ hardening | F-08–09: check-in, own attendance status และ summary; regression/UAT re-tests | F-04–07, contract/STS ก่อน coding | มีอย่างน้อย 1 workflow/rule implement และ test จริงใน D2; ครบทั้งหมด Final วันที่ 13 ธ.ค. |

Sprint 2/3 ไม่ได้มีแค่ปรับ UI แต่เพิ่ม lifecycle จริงและกฎร่วมกับข้อมูลเดิม ต้องคง regression จาก Sprint 1 และ traceability ทุก requirement

## งาน Sprint 1 และการแบ่งงานเสนอ

Stack: React/TypeScript/Vite/Bootstrap, Express/TypeScript, PostgreSQL/Prisma; Vitest unit/API integration ร่วมกับ Supertest และ PostgreSQL จริง Browser E2E เสนอ Playwright เพิ่มตาม STS

### Initial GitHub Projects / four-Issue plan

ตารางนี้เป็นแผน ยังไม่ได้สร้าง Issues จริง จำนวน 4 มาจาก workflow ในภาพอ้างอิงที่ระบุบริบท Lab; รวม feature ที่เกี่ยวข้องเป็น Issue เดียวได้และเปิด defect/change Issues เพิ่มตามความจำเป็น

| Planned Issue (ไม่ใช่ GitHub ID จริง) | Features / ผลลัพธ์ | Branch ที่เสนอ |
|---|---|---|
| LC-PLAN-01 | F-01: session auth, CSRF, account seed และ access foundation | feature/auth |
| LC-PLAN-02 | F-02: Prisma event model, create/publish/browse และ owner list | feature/events |
| LC-PLAN-03 | F-03: registration และ duplicate/capacity/concurrency tests | feature/registration |
| LC-PLAN-04 | F-04/F-05: own records และ owner roster รวม journey/reproduction evidence | feature/registration-views |

แตก `feature/*` จาก `dev` → PR เข้า `dev` ให้เพื่อนรีวิว → รัน integration/system/acceptance checks บน `dev` → reviewed release PR จาก `dev` เข้า `main` → บันทึก tag/commit แต่ละ Sprint ดังนั้น `dev` ทำหน้าที่ sprint staging/integration โดยไม่ต้องเพิ่ม branch ชื่อ sprint-1 แยก

GitHub Projects status ที่เสนอ: Backlog → Ready (contract/test design พร้อม) → In Progress → In Review → Done (accepted ตาม DoD) ตรวจ actual authors/reviewers/commit ก่อนเปลี่ยน Done

ใช้ M1/M2 เป็นชื่อชั่วคราวจนทีมใส่ชื่อจริง ไม่ใช่หลักฐานการมีส่วนร่วม

| งาน | Driver ที่เสนอ | Reviewer ที่เสนอ | Dependency / ผลลัพธ์ |
|---|---|---|---|
| ทบทวน SRS/feature inventory/plan | M1+M2 | ตรวจร่วมกัน | Scope, decisions และ theme ยืนยันแล้ว |
| F-01 auth และ session tests | M1 | M2 | Reviewed contract ก่อน implement |
| F-02 create/publish/browse | M2 | M1 | F-01 และ DB foundation |
| F-03 registration และ race tests | M1+M2 pair | คนที่ไม่ใช่ author หลักตรวจ PR; pair work ต้องระบุจริง | F-02, PostgreSQL transaction |
| F-04 own registration UI/API/tests | M1 | M2 | F-03 |
| F-05 owner roster UI/API/tests | M2 | M1 | F-03 |
| Integration/reproduction/report | M1+M2 | Review release PR โดยผู้ไม่ใช่ author | Build/test/review evidence และ PDF |

หาก pair ทำทั้งคู่จนไม่มี independent teammate review ที่ชัดเจน ต้องแยกช่วง author/reviewer และบันทึกว่าใครตรวจอะไร ผู้เขียน PR ไม่ approve งานตนเอง ทั้งคู่ต้องอธิบาย requirements/design/test/deployment ได้

## วันที่เป้าหมาย Sprint 1

| วัน | ผลลัพธ์ที่วางแผน |
|---|---|
| 4 พ.ย. | Baseline/decision review, contracts/STS, Issues และ test design |
| 5 พ.ย. | F-01/F-02 พร้อม tests และ review |
| 6 พ.ย. | F-03–05, concurrency/access tests และ review |
| 7 พ.ย. | Integration, local release, restart/reproduction, รวบรวมหลักฐาน/PDF |
| 8 พ.ย. | ตรวจ Parts A–F เลขหน้าและ release reference ส่งก่อน 23:59 |

## งานต่อเนื่องและ Labs

| กำหนด | งาน / ข้อผูกพัน |
|---|---|
| 9–15 พ.ย. | Lab 5: Docker, CI gate, pipeline, GCP และ data persistence; เริ่ม contracts S2 |
| 16–22 พ.ย. | S2 implementation และ Lab 6: UAT 4 กรณี, triage, accepted defect fix และ independent re-test |
| 23–29 พ.ย. | ปิด S2, ทำ S3 contracts ครบและ implement/test progress จริง, Lab 7 approved maintenance change, D2 deployed candidate |
| 1–11 ธ.ค. | ช่วงสอบ; เผื่อเฉพาะงานคงเหลือขอบเขตชัดเจน ไม่วาง main workflows ไว้สองวันท้าย |
| ไม่เกิน 13 ธ.ค. | S3 ครบ, final regression/UAT re-tests, final deployment, PDF และ demo video |

Lab 7 ต้องเป็นการเปลี่ยน behavior/rule ที่ทำแล้วและได้รับอนุมัติ ไม่ใช้ฟีเจอร์ baseline ที่ยังไม่ได้ทำมาแทน maintenance exercise ต้องเก็บ failing changed-behavior test ก่อนแก้ พร้อม regression/review/redeploy และ 5 metrics ที่มีช่วงเวลา/แหล่งข้อมูลจริง

## Completion / scope control

- Sprint 1 exit criteria ตาม [DoD](sprint-1/README.md); ไม่ต้องมี GCP/Docker/CI เสร็จใน D1
- D2 ต้องไม่เลื่อน required S2 features ไป S3 เพื่อทำให้สถานะดูเสร็จโดยไม่บันทึก scope revision ที่อนุมัติ
- งาน S3 คงเหลือใน D2 ต้องระบุ Feature/AC, owner จริง, dependency, next action และวันเสร็จ
- ทุก Sprint ติดตาม issue → contract → tests → reviewed PR → staging integration → main release และหลักฐานผลตาม commit
