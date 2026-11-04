# Part B — Requirements, Features และ Verification Traceability

Version 0.1 | 4 พฤศจิกายน 2026

**สถานะทั้ง baseline: PLANNED** ทุก requirement มี allocation แต่ยังไม่มี implementation/actual test result ในตารางนี้ `—` หมายถึงยังไม่มีหลักฐาน ไม่ใช่ PASS สำหรับ Sprint 2/3 ใช้ verification target เป็นแผนระดับระบบ ยังไม่อ้างว่ามี detailed contracts/executable tests แล้ว

## 1. Functional requirements

| Requirement | Feature / responsibility | Sprint | AC หรือ verification target | Planned tests | Actual file/test/result/commit |
|---|---|---:|---|---|---|
| FR-01 | F-01 | 1 | AC-01–02,05 | TEST-01,02,05 | — |
| FR-02 | F-01 | 1 | AC-03–04 | TEST-03,04,06 | — |
| FR-03 | F-02 | 1 | AC-06–07,10–11 | TEST-07,08,12–14,36 | — |
| FR-04 | F-02 | 1 | AC-08,10 | TEST-09,10,12,13 | — |
| FR-05 | F-02 | 1 | AC-09,11 | TEST-11,14,36 | — |
| FR-06 | F-03 | 1 | AC-12–17 | TEST-15–21 | — |
| FR-07 | F-04 | 1 | AC-18–20 | TEST-22–25 | — |
| FR-08 | F-02,F-05 | 1 | AC-09,21–23 | TEST-11,26–29 | — |
| FR-09 | F-06 | 2 | V2-01: own ACTIVE cancel ก่อนปิดรับ คืนที่นั่ง; invalid cancel ไม่เปลี่ยนข้อมูล | กำหนด detailed STS ก่อน F-06 coding | — |
| FR-10 | F-06 | 2 | V2-02: owner close และ reject register ต่อ โดยคง registration เดิม | กำหนด detailed STS ก่อน F-06 coding | — |
| FR-11 | F-07 | 2 | V2-03: owner edit ตาม status; capacity ไม่ต่ำกว่า active แม้มี concurrent registration | กำหนด detailed STS ก่อน F-07 coding | — |
| FR-12 | F-06 | 2 | V2-04: reactivate record เดิมโดยตรวจ capacity/deadline และเก็บ history | กำหนด detailed STS ก่อน F-06 coding | — |
| FR-13 | F-08 | 3 | V3-01: owner check-in ACTIVE ในช่วงกิจกรรม; reject invalid/duplicate/cross-owner | กำหนด detailed STS ก่อน F-08 coding | — |
| FR-14 | F-08,F-04 | 3 | V3-02: own attendance status เท่านั้น | กำหนด detailed STS ก่อน F-08 coding | — |
| FR-15 | F-09 | 3 | V3-03: totals/rate ตรง DB รวม 0 denominator; owner scope | กำหนด detailed STS ก่อน F-09 coding | — |

## 2. Business rules

| Requirement | Feature | Sprint | AC / verification | Planned tests | Actual result/version |
|---|---|---|---|---|---|
| BR-01 | F-02,F-07 | 1/2 | AC-07; V2-03 | TEST-08; เพิ่ม tests editing ใน S2 | — |
| BR-02 | F-02,F-07 | 1/2 | AC-07–08; V2-03 | TEST-08–10 | — |
| BR-03 | F-03,F-06 | 1/2 | AC-15; V2-01,02,04 | TEST-18 และ S2 lifecycle cases | — |
| BR-04 | F-03,F-06 | 1/2 | AC-13,17; V2-04 | TEST-16,21 และ S2 reactivation cases | — |
| BR-05 | F-03,F-06,F-07 | 1/2 | AC-14,17; V2-01,03,04 | TEST-17,20 และ S2 concurrent mutations | — |
| BR-06 | F-01,F-03,F-04,F-06,F-08 | 1/2/3 | AC-16,19; V2-01,04; V3-02 | TEST-19,23; regression เมื่อเพิ่ม endpoints | — |
| BR-07 | F-01,F-02,F-03,F-05–09 | 1/2/3 | AC-10,16,22; V2-02,03; V3-01,03 | TEST-12,13,19,27 และ future owner tests | — |
| BR-08 | F-06 | 2 | V2-01: deadline equality/closed/already cancelled | กำหนดใน S2 STS | — |
| BR-09 | F-02,F-06 | 1/2 | AC-08; V2-02: close ซ้ำ/เปิดกลับไม่ได้ | TEST-09,10 และ S2 close tests | — |
| BR-10 | F-03,F-06,F-07 | 1/2 | AC-17; V2-01–04: interleaved transactions | TEST-20,21 และ S2 capacity/cancel/close races | — |
| BR-11 | F-02,F-07 | 1/2 | AC-10; V2-03: immutable owner/published times | TEST-13 และ S2 edit restrictions | — |
| BR-12 | F-08 | 3 | V3-01: time bounds, ACTIVE-only, duplicate and CLOSED behavior | กำหนดใน S3 STS | — |
| BR-13 | F-09 | 3 | V3-03: cancelled exclusion, zero count และ rounding | กำหนดใน S3 STS | — |
| BR-14 | SYS-DATA,F-02,F-03,F-06,F-08 | 1/2/3 | AC-07,11,15; V2-01; V3-01 | TEST-08,18,36 และ future time-boundary tests | — |

## 3. Non-functional requirements

| Requirement | Responsibility | Establish / verify | AC / target | Planned verification | Actual measurement/result/version |
|---|---|---|---|---|---|
| NFR-01 | SYS-AUTH, ทุก protected feature | S1 และทุก Sprint | AC-03,10,16,19,22 | TEST-03,06,12,13,19,23,27 และ future endpoint matrix | — |
| NFR-02 | SYS-AUTH,F-01 | S1; HTTPS config Lab 5 | AC-01,03–05 | TEST-01,03–06; deployment cookie check | — |
| NFR-03 | SYS-DATA,F-02–05 | S1; redeploy Lab 5 | AC-06,12,18,23,25 | TEST-07,15,22,29,31; Lab 5 persistence | — |
| NFR-04 | SYS-DATA,F-03 | S1; regression S2 | AC-17 | TEST-20,21 และ S2 race expansion | — |
| NFR-05 | SYS-DELIVERY | S1; Docker Lab 5 | AC-25 | TEST-35; fresh Docker build ใน Lab 5 | — |
| NFR-06 | SYS-UX,ทุก feature | S1 และต่อเนื่อง | AC-11,20,26 | TEST-14,25,32,33,36 | — |
| NFR-07 | SYS-DELIVERY | Lab 5; ทุก release หลังจากนั้น | CI gate / deployed version target | Controlled failed check + protected release path + version check | — |
| NFR-08 | SYS-QA | S1; D2; Final | AC-27 | TEST-34; baseline-to-final verification audit | — |
| NFR-09 | SYS-QA | Lab 6; Final re-tests | Independent UAT target | 4 UAT cases, accepted defect fix และ partner re-test | — |

## 4. Sprint 1 AC → planned/actual verification

| AC | Feature | Planned tests | Implementation | Actual test file/name | Result / commit |
|---|---|---|---|---|---|
| AC-01 | F-01 | TEST-01 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-02 | F-01 | TEST-02 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-03 | F-01 | TEST-03,06 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-04 | F-01 | TEST-04 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-05 | F-01 | TEST-05 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-06 | F-02 | TEST-07 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-07 | F-02 | TEST-08 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-08 | F-02 | TEST-09,10 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-09 | F-02 | TEST-11 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-10 | F-02 | TEST-12,13 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-11 | F-02 | TEST-14,36 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-12 | F-03 | TEST-15 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-13 | F-03 | TEST-16 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-14 | F-03 | TEST-17 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-15 | F-03 | TEST-18 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-16 | F-03 | TEST-19 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-17 | F-03 | TEST-20,21 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-18 | F-04 | TEST-22,24 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-19 | F-04 | TEST-23 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-20 | F-04 | TEST-25 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-21 | F-05 | TEST-26,28 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-22 | F-05 | TEST-27 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-23 | F-05 | TEST-29 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-24 | Cross-feature | TEST-30 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-25 | Cross-feature | TEST-31,35 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-26 | Cross-feature | TEST-32,33 | NOT IMPLEMENTED | — | NOT EXECUTED / — |
| AC-27 | SYS-QA | TEST-34 | PROCESS NOT EXECUTED | — | NOT EXECUTED / — |

## 5. Coverage gaps และการอัปเดต

Allocation coverage: FR-01–15, BR-01–14 และ NFR-01–09 มี feature/responsibility และ Sprint/verification target ครบ แต่ execution coverage ปัจจุบันยังไม่มีทั้งหมด Sprint 2/3 ต้องเพิ่ม detailed contracts/AC/STS ก่อน implement ไม่ใช้ target V2/V3 เป็นผลผ่าน

เมื่อมี test implementation ให้เติมชื่อไฟล์/ชื่อ test จริง หาก test หนึ่งครอบคลุมหลาย AC ให้ระบุ assertions ที่เกี่ยวข้อง ไม่อ้าง green test ที่ไม่ได้ตรวจ requirement นั้น งานที่ FAIL/SKIPPED/INCOMPLETE ต้องเก็บผลพร้อมเหตุผล ไม่ลบแถว
