# Lab 6 Part D — Controlled defect exercise (TA-assigned)

Issue #64 | Product Team: TH-001_P3 LoungCheu | UAT Team: TH-005_P5 ApprovalFlow

> **นี่คือแบบฝึกหัดที่ TA กำหนด ไม่ใช่ defect จาก UAT จริง.** UAT ของทีมคู่บน `v1.0.1-uat` (`0b2cc80`) ไม่พบ defect และตัดสิน **Accepted** (EV-D-01) — release นั้นแยกจาก exercise นี้. Commit ที่มี defect อยู่บน branch และใน CI เท่านั้น **ไม่เคย deploy**

## 1. ที่มา

| รายการ | ค่า |
|---|---|
| ผู้กำหนดโจทย์ | TA (อีเมล 25 พ.ย. 2026 21:04, EV-TA-01) |
| เหตุผล | Lab 6 ไม่มี accepted defect จริง → ต้องทำ controlled exercise ที่ TA/อาจารย์กำหนด (handout ห้ามทีมสร้าง defect/finding เอง) |
| Accepted baseline (ไม่แตะ) | `v1.0.1-uat` / `0b2cc80` / revision `scccd8b05-00009-vvq` — Accepted 25 พ.ย. 15:29 |
| Branch | `fix/64-lab6-duplicate-registration` จาก `lab6-staging` (`cdc05bd`) |

## 2. Defect report

| Field | ค่า |
|---|---|
| ID | LAB6-CX-01 (Issue #64) |
| Product owner / team | TH-001_P3 LoungCheu — jetanin (M1), i3artuf (M2) |
| Reporter | TA-assigned controlled exercise (อีเมล EV-TA-01); reproduce และบันทึกโดย i3artuf. **ไม่ใช่ finding จากทีม UAT** — ทีมคู่ไม่ได้รายงาน defect ใดใน UAT จริง |
| Summary | Participant คนเดิมสร้าง registration ACTIVE ของกิจกรรมเดิมได้มากกว่าหนึ่งรายการ เมื่อส่ง `POST /api/events/{id}/registrations` ซ้ำผ่าน API |
| Version ที่มี defect | commit `97268f4` (branch เท่านั้น; ไม่มี tag, ไม่มี revision) |
| Requirement / AC ที่ละเมิด | **BR-04** หนึ่ง registration record ต่อ user/event; **FR-06**; **NFR-04** duplicate concurrent request ของผู้ใช้เดียวกันสร้าง record เดียว; **AC-13** (TEST-16) ลงซ้ำได้ 409 ALREADY_REGISTERED โดย record/count/registered_at เดิม; **AC-17** (TEST-21); UAT-02; SRS scenario 5 |
| Preconditions / data | กิจกรรม PUBLISHED ก่อน deadline, capacity ≥ 2; Participant A login แล้ว (session + CSRF token) และมี ACTIVE ในกิจกรรมนี้ 1 รายการ. ข้อมูลเป็น synthetic ทั้งหมด: automated test สร้าง organizer/participant/event สุ่ม UUID ใน `loungcheu_test` (ไม่ใช้บัญชีหรือข้อมูลจริง) |
| Steps | 1. A ส่ง `POST /api/events/{id}/registrations` (CSRF ถูกต้อง) → 201 <br> 2. A ส่งคำขอเดิมซ้ำโดยตรงผ่าน API (ไม่ผ่านปุ่มใน UI) <br> 3. ตรวจ registration ของ A ในกิจกรรม และ `active_count` / `available_seats` |
| Expected | ขั้น 2 ได้ `409 ALREADY_REGISTERED`; ไม่มี record ใหม่; มี ACTIVE ของ A แค่ 1; จำนวนที่นั่งไม่เปลี่ยน; `registered_at` เดิม |
| Actual (`97268f4`) | ขั้น 2 ได้ **201** และสร้าง record ใหม่ → A มี ACTIVE 2 รายการ, ที่นั่งว่างลดลงอีก 1. ที่ capacity 1 คำขอซ้ำถูกปฏิเสธด้วยเหตุผลผิด (`EVENT_FULL` แทน `ALREADY_REGISTERED`). คำขอพร้อมกันของคนเดียวได้ `[201, 201]` |
| Defect vs feature request | **Defect** — ขัดพฤติกรรมที่ระบุไว้แล้วใน Sprint 1 contract (AC-13/AC-17, BR-04) ไม่ใช่ความสามารถใหม่ |
| Evidence | [01-repro-defect.log](evidence/controlled-exercise/01-repro-defect.log) — TEST-16 (capacity 1, 2) และ TEST-21 FAIL บน `97268f4` |

## 3. Triage

| Field | การตัดสิน |
|---|---|
| Classification | **Accepted defect** — พฤติกรรมขัด BR-04 และ AC-13/AC-17 ของ Sprint 1 โดยตรง ไม่ใช่ enhancement |
| Severity | **Critical** — ข้อมูลเสียความถูกต้อง (record ซ้ำที่กฎห้าม) และที่นั่งถูกใช้เกินจริง ทำให้ Participant คนอื่นลงทะเบียนไม่ได้ทั้งที่ควรได้ |
| Priority | แก้ก่อน release ถัดไป; ห้าม release/deploy จนกว่าแก้และ retest ผ่าน |
| Root cause | ระบบกันซ้ำสองชั้นถูกเอาออกทั้งคู่: (1) `registrations/service.ts` ไม่ตรวจ registration เดิมก่อน insert; (2) migration `202611250001_lab6_exercise_drop_registration_unique` ลบ unique index `(event_id, participant_id)` ที่เป็น guard ชั้น DB |
| Fix plan | RED test ใหม่ระดับ API ที่ตรวจ 409, ACTIVE = 1 และ `active_count`/`available_seats` ไม่เปลี่ยน → คืนการตรวจใน service และเอา migration ที่ลบ unique index ออก (migration นี้ไม่เคยรันบน production) → regression เต็ม |
| Owner / Reviewer | i3artuf (fix) / jetanin (review) |
| Fix status | RED ✓ (local + CI run 45661984995 แดง) → GREEN ✓ `37d5be4` (LAB6-CX-01 ผ่าน, Vitest 169/169); teammate review และ merge ผ่าน PR #65/#69/#70; release [PR #68](https://github.com/jetanin/LoungCheu/pull/68) บน `main` ที่ `6f49d32`, tag `v2.0.1-lab6`, deploy/smoke SUCCESS ([run 45685620954](https://github.com/jetanin/LoungCheu/actions/runs/45685620954)); independent retest โดย Nantakorn (TH-005_P5) 26 พ.ย. 2026 19:56–20:28 Asia/Bangkok: PASS และยืนยัน Sprint 1 ยังคง Accepted; [ผลและที่มาของหลักฐาน](evidence/controlled-exercise/retest-results.md) |
| Disposition | Fix ใน exercise นี้ (Critical → ต้องแก้และให้ทีม UAT retest ก่อนปิด); ไม่กระทบผลตัดสิน Accepted ของ `v1.0.1-uat` เพราะ defect ไม่เคยอยู่ใน release ที่ทดสอบ |
| แจ้งทีมคู่ | แจ้งก่อน deploy ผ่านกลุ่ม IG วันที่ 26 พ.ย. 2026 00:34 Asia/Bangkok (EV-0-05); ส่งคำขอ independent retest แล้ววันที่ 26 พ.ย. 2026 02:38 Asia/Bangkok (EV-D-02) สำหรับ corrected release `v2.0.1-lab6` / `6f49d32`; ได้รับภาพ B/C และข้อความผลของ Nantakorn ที่อินทร์ถ่ายทอดแล้ว ดู §5 |
| Retest | TH-005_P5: B1–B5, C1–C3 และ UAT-02 PASS ตามรายงาน Nantakorn; ภาพชุดนี้รองรับ B/C ส่วน UAT-02 และคำตัดสินยืนยันจากข้อความทีมคู่ ไม่ใช่ผลที่ผู้แก้เอกสารรันแทน |

## 4. Version table

| ขั้น | Commit / tag | Revision | สถานะ |
|---|---|---|---|
| Accepted baseline | `v1.0.1-uat` / `0b2cc80` | `scccd8b05-00009-vvq` | Accepted (EV-D-01) |
| Docs-only release หลัง UAT | `71e9ba5` (#62) | (deploy docs เท่านั้น ไม่เปลี่ยนแอป) | — |
| Defect commit | `97268f4` | ไม่ deploy | branch + CI เท่านั้น |
| RED test commit | `fe31120` | ไม่ deploy | CI [45661984995](https://github.com/jetanin/LoungCheu/actions/runs/45661984995) **failure**: 5 failed / 164 passed (LAB6-CX-01, TEST-16 ×2, TEST-21, events F-02/F-03) |
| GREEN fix commit | `37d5be4` | ไม่ deploy | local: LAB6-CX-01 PASS, Vitest 169/169; CI [45662403825](https://github.com/jetanin/LoungCheu/actions/runs/45662403825) บน `d812ce2` (= `37d5be4` + docs) **success**: Vitest 169/169, Playwright 37/37 |
| Fixed release on main | [`v2.0.1-lab6`](https://github.com/jetanin/LoungCheu/releases/tag/v2.0.1-lab6) / `6f49d327e8e709fc716b9eeb60591ea4fd692fc9` ([PR #68](https://github.com/jetanin/LoungCheu/pull/68)) | `scccd8b05-00012-msg` | [Deploy run 45685620954](https://github.com/jetanin/LoungCheu/actions/runs/45685620954) SUCCESS; readiness ที่ผู้ใช้แคป 26 พ.ย. 2026 11:04:31 Asia/Bangkok: HTTP 200, ready, db connected, version ตรง release SHA; [หลักฐาน](evidence/controlled-exercise/README.md) |
| UAT retest | `v2.0.1-lab6` / `6f49d327e8e709fc716b9eeb60591ea4fd692fc9` | `scccd8b05-00012-msg` | Nantakorn (TH-005_P5), 26 พ.ย. 2026 19:56–20:28 Asia/Bangkok: PASS; Sprint 1 ยังคง Accepted ตามข้อความทีมคู่; [ผล/หลักฐาน](evidence/controlled-exercise/retest-results.md) |

## 4.1 RED / GREEN evidence

| ID | ขั้น | Commit | Command | ผล |
|---|---|---|---|---|
| CX-E01 | Repro defect | `97268f4` | `npx vitest run server/tests/integration/registration.test.ts` | 3 failed / 14 passed — [01-repro-defect.log](evidence/controlled-exercise/01-repro-defect.log) |
| CX-E02 | RED (local) | `97268f4` + test ใหม่ (= `fe31120`) | `npx vitest run server/tests/integration/registration.test.ts -t LAB6-CX-01` | 1 failed: `expected 201 to be 409` — [02-red-lab6-cx-01.log](evidence/controlled-exercise/02-red-lab6-cx-01.log) |
| CX-E03 | RED (CI) | `fe31120` | GitHub Actions `test-and-docker` run 45661984995 | failure, 5 failed / 164 passed — [02b-ci-red-run-45661984995.log](evidence/controlled-exercise/02b-ci-red-run-45661984995.log) |
| CX-E04 | GREEN (local) | `fe31120` + fix (= `37d5be4`) | `npx vitest run server/tests/integration/registration.test.ts -t LAB6-CX-01` | 1 passed — [03-green-lab6-cx-01.log](evidence/controlled-exercise/03-green-lab6-cx-01.log) |
| CX-E06 | GREEN + regression (CI) | `d812ce2` | GitHub Actions `test-and-docker` run 45662403825 | success — Vitest 16 files 169/169, Playwright 37 passed, Docker build ✓ |
| CX-E05 | Regression (local) | `37d5be4` | `npx vitest run` | 16 files, 169/169 passed — [04-regression-vitest.log](evidence/controlled-exercise/04-regression-vitest.log) |
| CX-E07 | Fixed deploy + smoke | `6f49d32` | Deploy demo run 45685620954 | SUCCESS, revision `scccd8b05-00012-msg`; ภาพ Summary ระบุ Vitest 265/265 และ read-only smoke ผ่าน — [05-fixed-deploy-summary.png](evidence/controlled-exercise/05-fixed-deploy-summary.png) |
| CX-E08 | Public readiness (ผู้ใช้รันและแคป) | `6f49d32` | `curl.exe -i https://scccd8b05-4d7hbszvwq-as.a.run.app/api/ready` | HTTP 200, ready, db connected, version ตรง SHA เต็ม; 26 พ.ย. 2026 11:04:31 Asia/Bangkok — [06-fixed-readiness.png](evidence/controlled-exercise/06-fixed-readiness.png) |
| CX-E09 | Release tag | `v2.0.1-lab6` → `6f49d32` | ผู้ใช้ `git fetch origin`; ตรวจ annotated tag ผ่าน GitHub API | Tag มีบน origin และชี้ fixed release SHA ตรง readiness — [07-fixed-release-tag.png](evidence/controlled-exercise/07-fixed-release-tag.png) |

Test `LAB6-CX-01` ไม่ถูกแก้ระหว่าง RED กับ GREEN (เทียบได้ด้วย `git diff fe31120 37d5be4 -- server/tests`)

## 5. Independent retest (ทีม UAT)

ส่งให้ TH-005_P5: version ที่แก้แล้ว + ขั้นตอน reproduce ใน §2 (ส่งคำขอลงทะเบียนซ้ำผ่าน API โดยตรง) และขอให้ re-run UAT-02 (เคสที่เกี่ยวกับ duplicate) บน revision ใหม่

เอกสารที่ส่งให้ทีมคู่: [retest-controlled-exercise.md](retest-controlled-exercise.md) (console script ยิง API ซ้ำ 1 ครั้ง + พร้อมกัน 2 ครั้ง, ตรวจใน UI, re-run UAT-02)

| Tester | Version / revision | ผลจริง | หลักฐาน | ผลตัดสิน |
|---|---|---|---|---|
| Nantakorn / TH-005_P5; 26 พ.ย. 2026 19:56–20:28 Asia/Bangkok | `v2.0.1-lab6` / `6f49d327e8e709fc716b9eeb60591ea4fd692fc9`; `scccd8b05-00012-msg` | B1 version ตรง; B2 409 ALREADY_REGISTERED; B3 409 ทั้งคู่; B4 active 1/available 2 ก่อนและหลัง; B5=1; C1 ว่าง 2/3 ACTIVE 1; C2 กิจกรรมครั้งเดียว; C3 roster หนึ่งแถว ACTIVE 1/3; UAT-02 PASS ทุกขั้นตามข้อความทีมคู่ | [ผลละเอียดและภาพ 08–11](evidence/controlled-exercise/retest-results.md), [ข้อความผลที่อินทร์ถ่ายทอด](evidence/controlled-exercise/12-partner-retest-report.txt) | Retest PASS; Sprint 1 remains Accepted บน revision นี้ตามคำยืนยัน Nantakorn |

ผลตัดสินต้องมาจากทีม UAT เท่านั้น (Lab 6 §3.4)

หลักฐานคำตัดสิน: **EV-D-03** (retest result chat ตามที่ผู้ใช้ระบุ) — [ข้อความของ Nantakorn ที่อินทร์ถ่ายทอด](evidence/controlled-exercise/12-partner-retest-report.txt). ข้อความนี้ไม่ใช่ภาพแชตต้นฉบับ; ภาพ console และ C1–C3 ที่ได้รับภายหลังรวมไว้ใน [ผล retest](evidence/controlled-exercise/retest-results.md) แล้ว
