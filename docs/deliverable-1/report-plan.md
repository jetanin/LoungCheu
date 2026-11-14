# Deliverable 1 — Report & PDF Assembly Guide

Documentation baseline v1.0 | พฤศจิกายน 2026 | แผนและสารบัญรวมสำหรับจัดส่ง Deliverable 1

ส่ง PDF เดียวต่อทีมผ่าน LEB2 รวม 80 คะแนน หน้าต้นระบุสมาชิก, Theme/Context, Repository URL, Submitted application tag/commit และสารบัญนำทาง (Navigation Table)

## 1. Project & Submission Metadata

| ข้อมูล | รายละเอียด |
|---|---|
| **Course** | CPE 334 Software Engineering (Semester 1/2026) |
| **Deliverable** | Project Deliverable 1 — Engineering baseline and working Sprint 1 |
| **Team Members** | 1. Jetanin Naitho (ID: 67070501011)<br>2. Paphangkorn Luanseng (ID: 67070501083) |
| **Theme / Context** | LoungCheu — Community Event & Workshop Management Platform with Atomic Registration |
| **Repository URL** | https://github.com/jetanin/LoungCheu |
| **Target Release Tag** | `v1.0.0-sprint-1` (Merged staging candidate: `97a5b91`) |

## 2. Navigation & Structure (Parts A–F)

| Part | หัวข้อ | คะแนน | แหล่งเอกสารอ้างอิง | ขอบเขต / IDs ที่เกี่ยวข้อง |
|---|---|---:|---|---|
| **A** | SRS and Product Scope | 10 | [`docs/srs.md`](../srs.md), [`docs/decisions.md`](../decisions.md) | FR-01–15, BR-01–14, NFR-01–09, Stakeholders, Actors |
| **B** | Feature Inventory & Traceability | 10 | [`docs/features.md`](../features.md), [`docs/traceability.md`](../traceability.md) | F-01–09, System Responsibilities, Requirements Mapping |
| **C** | System-Level SDS | 15 | [`docs/system-sds.md`](../system-sds.md) | Stack Architecture, ERD/Data Models, API Contracts, RBAC Matrix |
| **D** | Three-Sprint Plan | 5 | [`docs/sprints/plan.md`](../sprints/plan.md) | Sprint 1–3 Goals, Feature Allocation, Dependencies |
| **E** | Sprint 1 Engineering Contracts | 20 | [`docs/sprints/sprint-1/contracts.md`](../sprints/sprint-1/contracts.md), [`sts.md`](../sprints/sprint-1/sts.md), [`README.md`](../sprints/sprint-1/README.md) | AC-01–27, TEST-01–36, DoD-01–10 |
| **F** | Working Sprint 1 & Verification | 20 | [`docs/deliverable-1/evidence-register.md`](evidence-register.md), [`traceability.md`](../traceability.md) | EV-01–12, PR Chains (#7, #10), 159 Vitest, 37 E2E, Contributions |

---

## 3. Checklist ก่อนการ Compile เล่มและ Release

- [x] **Metadata ครบถ้วน:** ชื่อ นศ., รหัส นศ., Theme, GitHub URL, Target Release Tag
- [ ] **Parts A–E baseline verification:** เนื้อหาครอบคลุมตาม master specs พร้อม architectural decisions และ changelog
- [x] **Sprint 1 Engineering Contracts & STS:** ครอบคลุมทุก AC และจับคู่กับ Test ID ชัดเจน
- [x] **Recorded automated tests:** 159 Vitest/37 Chromium, 0 fail/skip ที่ source3313288 ตาม logs; ไม่ใช่ release-linked rerun
- [x] **PR & Teammate Review Evidence:** มีครบ 2 chains (PR #7 และ PR #10) โดยมีข้อเสนอแนะเชิงเทคนิคและการตรวจรับจริง
- [x] **Contribution Table:** ระบุสัดส่วนงานของ Jetanin และ Paphangkorn ตรงตาม commit history
- [ ] **Final safe-data review:** ตรวจ secrets/token/password ของ submitted report/release ก่อนส่ง
- [ ] **Release PR Merge:** Merge `sprint-1-staging` เข้า `main` และ push tag `v1.0.0-sprint-1`
- [ ] **PDF Export:** รวมเล่ม A–F เป็นไฟล์ PDF เดียวส่งเข้า LEB2

**Acceptance limits:** GAP-02 OPEN; OS-process restart/independent clean reproduction และ main release acceptance ยังไม่มีหลักฐานครบ. PR #7/#10 review/staging merge ไม่ใช่ Product DoD ทั้งชุดผ่าน. Target tagv1.0.0-sprint-1 เป็นแผน ไม่ใช่ accepted release.
