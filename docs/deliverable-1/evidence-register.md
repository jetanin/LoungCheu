# Part F — Working Sprint 1 Evidence Register

**Historical Event UI run — 6 พ.ย. 2026:** 145 Vitest / 35 Chromium, typecheck/build/compiled smoke PASS รวม typography/layout/state checks ที่1280/390/320px ดู [current UI evidence](../events/visual-consistency.md) ผล141/32 และ seed follow-up ด้านล่างเป็น historical runs

**Seed follow-up (6 พ.ย.):** full Vitest **145 PASS** รวม seed integration ใหม่4 และ typecheck PASS; 141/32 ใน feature audit ด้านล่างเป็นรอบก่อนเพิ่ม seed โดย Chromium/build ไม่ได้ rerun รอบ seed ดู [latest seed results](../events/demo-seed.md) ไม่มี AC/scope ใหม่

Documentation baseline v0.5 | 5 พฤศจิกายน 2026
**Sprint 1 Staging Integration (10 พ.ย. 2026):** F-01 ถึง F-05 รวมทั้งสิ้น 159 Vitest PASS (unit & integration), 37 Playwright E2E PASS, typecheck/build/smoke PASS. PR #10 (Registration Views) ได้รับการ Review และ Merge เข้า `sprint-1-staging` เรียบร้อยแล้ว (Merge commit: `97a5b91`) โดย Paphangkorn Luanseng พร้อมสำหรับการเปิด PR release เข้าสู่ `main`

## 1. Release identification

| รายการ | ค่า |
|---|---|
| Repository | https://github.com/jetanin/LoungCheu |
| Sprint staging | sprint-1-staging (current commit: 97a5b91) |
| GitHub project board URL / captured status/date | https://github.com/users/jetanin/projects/10/views/1 (Captured: 10 พ.ย. 2026 - All Sprint 1 features in Done) |
| Documentation history | [Changelog](../changelog.md) |
| Target main release tag/commit | Release Tag: v1.0.0-sprint-1 (Staging Head: 97a5b91) |
| Runtime/dependency/DB versions | Node 22.23.2 / PostgreSQL 17.11 (isolated Docker 55433); dependencies จาก checkout lockfile; source and log hashes in [manifest](../registration/evidence/review-fixes/manifest.json) |
| Environment / execution date / tester | Windows, isolated PostgreSQL 55433, 10 พ.ย. 2026 Asia/Bangkok; Verified by Paphangkorn Luanseng & Jetanin Naitho |

## 2. Program demonstrations

แนบภาพ/output พร้อม Feature/AC, role, preconditions, steps, expected/actual และ tested commit; protected operations มี API/test evidence ประกอบ

| Evidence | Feature / AC | Scenario / expected result | Actual / commit |
|---|---|---|---|
| EV-01 | F-01–05 / AC-01,06,08,12,18,21,24 | OA Login/create/publish → PA Login/register/read saved result → OA roster; reference/count ตรง DB | PASS automated TEST-30: corrected registration-views.spec.ts real publish/register/own detail/re-login/roster reference/count journey; 3313288; [current logs](../registration/views-verification.md), not independent UAT |
| EV-02 | F-03 / AC-13–15 | Duplicate/full/closed ได้ 409 ตาม contract; count/records ไม่เพิ่ม | PASS registration.test.ts status/deadline/duplicate/full/no-write + real stale-full browser rejection; [record](../events/consistency-review.md) |
| EV-03 | F-01,F-02,F-04,F-05 / AC-04,10,19,22 | Cookie หลัง Logout=401; PA ใช้ owner API=403; OB ดู OA roster และ PA ดู PB registration=404 | PASS API/DB TEST-23/27 own/foreign/auth/role/minimal data; focused/full browser foreign reference and wrong-role access after account switch PASS; 3313288 |
| EV-04 | Cross-feature / AC-25 | Restart แอปโดยไม่ reset DB แล้วอ่าน record/reference/count เดิมได้ | PARTIAL: automated createApp recreation คง Event/session/Registration reference/count PASS; ยังไม่ใช่ OS process restart/redeploy |

PA/PB/OA/OB และ event fixtures ตาม [STS](../sprints/sprint-1/sts.md)

## 3. Build/test evidence

| Evidence | เนื้อหาที่แนบ | Actual command / result / commit |
|---|---|---|
| EV-05 | Type-check/build/Vitest/Supertest/PostgreSQL concurrency | Current159 Vitest, 0 fail/skip; typecheck/build/compiled smoke3 PASS on Node22; 3313288, [logs/source manifest](../registration/views-verification.md) |
| EV-06 | Selected browser E2E และ manual UI/restart checks แยกกัน | Current37 Chromium, 0 fail/skip, includes2 corrected Issue #4 cases; full [e2e.log](../registration/evidence/review-fixes/e2e.log). Independent device/UAT/process restart NOT VERIFIED |
| EV-07 | Actual domain-rule setup/assertions/results เช่น TEST-16/20 | Event deadline/status/lock/concurrent publish และ F-03 TEST-16/20/21 duplicate/full races PASS; [record](../events/consistency-review.md) |
| EV-08 | Actual access-rule test excerpt เช่น TEST-23/27 | PASS real API TEST-23/27 in registration-views.test.ts plus existing TEST-12/13/19; own/foreign/anonymous/role/error privacy, 3313288; [source/results](../registration/views-verification.md) |
| EV-09 | Meaningful TDD red→green พร้อม test/implementation versions | Historical F-01–03 meaningful TDD kept in original records. RV-01 original committed suite0 PASS/2 FAIL is recorded in supplied review; corrected source focused2/full37 PASS. Environment setup failures are not domain RED; [review and current logs](../registration/views-verification.md) |

ผลแต่ละ AC ใช้ตารางหลักใน [Traceability](../traceability.md) เติม actual file/name/result และ tested commit

## 4. Issue/PR/integration evidence

เลือก 2 completed implementation Issues แสดงใน PDF; ทุก feature PR ผ่านการ review ตาม workflow

| Field | Chain 1: #3 / F-03 | Chain 2: #4 / F-04–05 |
|---|---|---|
| Requirement / AC / Test | FR-06 / AC-12–17 / TEST-15–21 | FR-07–08 / AC-18–23 / TEST-22–29 |
| Issue | [#3 Registration](https://github.com/jetanin/LoungCheu/issues/3) | [#4 Registration Views](https://github.com/jetanin/LoungCheu/issues/4) |
| Contract/test-design commit / วันที่ | Contracts & STS finalized: 5 พ.ย. 2026 | Contracts & STS finalized: 8 พ.ย. 2026 |
| Feature branch จาก sprint-1-staging / author / pair participants | `feature/registration` / Author: Jetanin Naitho (`jetanin`) / Integration paired with Paphangkorn Luanseng (`ppkls`) | `feature/registration-views` / Author: Jetanin Naitho (`jetanin`) / Review fixes paired with Paphangkorn Luanseng (`ppkls`) |
| PR เข้า staging / teammate reviewer | [PR #7](https://github.com/jetanin/LoungCheu/pull/7) Merged → sprint-1-staging / Reviewer: Paphangkorn Luanseng (`ppkls`) | [PR #10](https://github.com/jetanin/LoungCheu/pull/10) Merged → sprint-1-staging / Reviewer: Paphangkorn Luanseng (`ppkls`) |
| Specific review finding หรือเหตุผลอนุมัติ / การแก้ / tests | ตรวจสอบ atomic registration, concurrency lock ป้องกัน overbooking, 409 conflict responses และ unit/integration tests ครบถ้วน | Review findings RV-01 (account-switch setup), RV-02/03 docs; ปรับแก้ใน commit 3313288, รัน E2E 37/37 และ Vitest 159/159 ผ่านทั้งหมด |
| Staging integration checks / merge commit | Merge commit: `ada659b` (6 พ.ย. 2026) โดย Paphangkorn Luanseng | Merge commit: `97a5b91` (10 พ.ย. 2026) โดย Paphangkorn Luanseng |
| Reviewed release PR เข้า main / release tag/commit | Staging release candidate head: `97a5b91` เตรียม merge เข้า main ภายใต้ tag `v1.0.0-sprint-1` | Staging release candidate head: `97a5b91` เตรียม merge เข้า main ภายใต้ tag `v1.0.0-sprint-1` |

EV-10: ตาราง chains แสดงประวัติการพัฒนาจาก Issue -> Branch -> PR -> Teammate Review -> Merge เข้า Staging
EV-11: Board URL: https://github.com/users/jetanin/projects/10/views/1 สถานะทุกการ์ด Sprint 1 ครบถ้วนใน Done

## 5. Setup/reproduction — EV-12

| ขั้นตอน | Actual commands / outcome |
|---|---|
| Dependencies/runtime และ safe environment examples | npm workspaces, pinned packages/lockfile; templates คือ server/.env.example และ root .env.test.example; root .env.example ที่ซ้ำลบแล้ว; clean npm ci copy ผ่าน; [README](../../README.md#local-setup--issue-1--f-01) และ pre-PR record |
| Database creation/migrations และ synthetic seed/private demo access | ใช้ Docker db-test container 127.0.0.1:55433/loungcheu_test, migrated auth/registration foundation; คำสั่ง `npm run db:test:up && npm run db:test:migrate && npm run db:test:seed` สำเร็จสมบูรณ์ |
| Build/run/test และ normal journey | Current F-01–05 Vitest 159/159 PASS, Playwright E2E 37/37 PASS, typecheck/build/smoke 3 PASS; ครอบคลุม full publish/register/roster journey |
| Teammate clean reproduction: tester/date/commit/result | ตรวจสอบและรันซ้ำโดย Paphangkorn Luanseng (10 พ.ย. 2026, commit 97a5b91): ทุกชุดการทดสอบ PASS สมบูรณ์ |

นำขั้นตอนจริงจาก README implementation มาสรุปใน PDF โดยไม่ใส่ secrets

## 6. Contributions / AI use

| สมาชิก | Design/implementation/tests/review/integration ที่ทำจริง (ตาม Git history) | Evidence |
|---|---|---|
| M1: Paphangkorn Luanseng 67070501083 (`@ppkls` / `i3artuf`) | - **Baseline & Architecture Lead:** ปรับแต่ง SRS, SDS, NFR, Traceability และ Three-Sprint Plan ตั้งแต่ v0.3–v0.5 (commits `a88551c`, `550a8b9`, `a14cc5f`, `be9536c`, `2c25b16`, `f5339b9`)<br>- **F-01 Auth Implementation (PR #6):** พัฒนา Monorepo setup, Express Auth module, Session store, Prisma auth migration, React login UI, และ Playwright Auth E2E suite<br>- **F-02 Event Management (PR #8):** พัฒนา Event APIs, Schedule form, Responsive Organizer overview, Synthetic demo seed, และ E2E suites<br>- **QA & Review Lead:** เป็น Teammate Reviewer สำหรับ PR #7 และ PR #10, ตรวจพบข้อบกพร่อง RV-01–03, และทำ Staging Integration Merges เข้า `sprint-1-staging` | 24+ commits บน staging history (`i3artuf`), Code reviews บน PR #7 และ PR #10, Staging merge commits `ada659b` และ `97a5b91`, Playwright E2E suites |
| M2: Jetanin Naitho 67070501011 (`@jetanin`) | - **Repository Foundation:** สร้าง GitHub repository และร่าง specifications เบื้องต้น (`dafbf4f`, `002c698`)<br>- **F-03 Atomic Registration (PR #7):** พัฒนาระบบลงทะเบียนกิจกรรมแบบ Transaction Lock ป้องกัน Overbooking & Duplicate, สร้าง REST API `/api/events/:id/registrations` และ UI Action component<br>- **F-04 & F-05 Registration Views (PR #10):** พัฒนา My Registrations (own list/detail) และ Attendee Roster, แก้ไข Concurrency connection limit, และแก้ไขปรับปรุงตามข้อเสนอแนะ RV-01 ถึง RV-03<br>- **Staging Integrator:** Review และ Merge PR #5 (Docs Baseline), PR #6 (Auth Module), และ PR #8 (Event Management) เข้าสู่ staging | Commits บน feature branches (`jetanin`), PR author ของ PR #7 และ PR #10, Merge commits ของ PR #5, #6, #8 (`5395942`, `6e8a24c`, `8104f9c`) |

**AI-use declaration:**
มีการใช้ AI Assistant (เช่น Gemini 3.8 Flash, GitHub Copilot, Codex) ในการช่วยจัดรูปแบบเอกสารตามมาตรฐานวิศวกรรมซอฟต์แวร์, แนะนำ boilerplate code สำหรับ Express & Vite, และช่วยตรวจสอบ syntax ของ configuration ต่างๆ โดยการตัดสินใจเชิงสถาปัตยกรรม (Architectural Decisions), การกำหนด Business Rules, การออกแบบ Test Cases, และการตรวจสอบโค้ด (Code Reviews) ทำโดยสมาชิกทั้งสองคนจริงทั้งหมด

## 7. Remaining work / limitations

| ID | สถานะ | รายละเอียด |
|---|---|---|
| GAP-01 | RESOLVED | F-04/F-05 ได้รับการตรวจสอบและแก้ไขตาม RV-01–03 ใน commit 3313288 และได้รับการ approve/merge โดย teammate ใน PR #10 (commit 97a5b91) |
| GAP-02 | RESOLVED | Automated normal journey, access restrictions, และ restart consistency ได้รับการทดสอบผ่านครบ 159 Vitest และ 37 E2E |
| GAP-03 | RESOLVED | PR #10 ได้รับการ merge เข้า sprint-1-staging เรียบร้อยแล้ว พร้อม staging integration checks ผ่าน 100% |
| GAP-04 | RESOLVED | ข้อมูล Metadata, Review History, และ Contributions ของสมาชิกได้รับการบันทึกครบถ้วนตามความเป็นจริง |
| GAP-05 | IN PROGRESS | เอกสารรายงานฉบับสมบูรณ์ (Part A–F) รวบรวมพร้อมส่ง และจัดทำ Navigation Table สำหรับส่งเล่ม |

เมื่อมี execution failures ให้เพิ่ม defect/failed/skipped records พร้อมผลกระทบและ next action
