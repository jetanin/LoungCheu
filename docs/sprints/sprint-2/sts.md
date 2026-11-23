# Sprint 2 — Software Test Specification (F-06, F-07)

เอกสาร LC-S2-STS | v0.3 (draft for review) | 24 พฤศจิกายน 2026

Contract: [contracts.md](contracts.md) ทุก test ต้องเขียนและ commit ให้ **fail ก่อน** implementation (RED) แล้วจึง implement ให้ผ่าน (GREEN) เก็บ SHA ทั้งสองจังหวะเป็นหลักฐาน TDD (D2 §3.2)

## 1. Environment และ fixtures

ใช้ environment, runner (Vitest + Supertest, React Testing Library, Playwright), PostgreSQL test database, controlled clock และบัญชี PA/PB/PC/OA/OB/IX ตาม [Sprint 1 STS §1](../sprint-1/sts.md) ไม่เปลี่ยน

Fixtures เพิ่มเติม (เวลาอ้างอิง `t0 = 2026-11-06T03:00:00.000Z` เหมือน Sprint 1):

| Fixture | Owner | Status | Capacity | ACTIVE | เวลา |
|---|---|---|---|---|---|
| EDRAFT2 | OA | DRAFT | 5 | 0 | closes=t0+1h, starts=t0+2h, ends=t0+4h |
| EPUB2 | OA | PUBLISHED | 3 | 2 (PA, PB) | เหมือน EDRAFT2 |
| EFULL2 | OA | PUBLISHED | 1 | 1 (PB) | เหมือน EDRAFT2 |
| ECLOSED2 | OA | CLOSED | 5 | 1 (PA) | เหมือน EDRAFT2 |

"ข้อมูลไม่เปลี่ยน" หมายถึงอ่าน Event row ใหม่จาก connection ใหม่แล้วทุก field รวม `updated_at` เท่าค่าก่อน request และจำนวน Registration เท่าเดิม

## 2. F-06 test cases (TEST-37–TEST-44)

สถานะ: **planned / ยังไม่ได้เขียนหรือรัน tests ในหัวข้อนี้** ต้องผ่าน review/merge พร้อม F-06 contract ก่อน implementation #47 ส่วน TEST-45–52 ของ F-07 คงเดิม

### Fixtures และวิธีตรวจ F-06

- ใช้ clock ที่ควบคุมได้และ fixtures เดิม; เพิ่ม `ECANCEL2` ของ OA, PUBLISHED, capacity=1, ACTIVE=1 (PA), available_seats=0 (เต็มก่อน cancel) และ `ECYCLE2` ของ OA, PUBLISHED, capacity=1, CANCELLED=1 (PA), ACTIVE=0 เวลาตาม EDRAFT2
- CANCELLED fixture มี registered_at=t0−2h, cancelled_at=t0−1h และ history REGISTERED/CANCELLED ที่ actor=PA ตามเวลา; ACTIVE fixtures มี REGISTERED history หลัง migration ทุก case เริ่มใหม่และบันทึก IDs/timestamps/count/history ก่อนส่งคำขอ
- ตรวจ state จาก connection ใหม่หลัง commit: Event ทุก field รวม updated_at; Registration ทุก field โดยเฉพาะ id/registered_at/cancelled_at/status; history ทุกแถวรวม actor/action/occurred_at; active_count/available_seats เทียบ DB ไม่ดูเพียง HTTP status
- Permission/input/domain tests ใช้ valid CSRF ของบัญชีที่ทดสอบ ยกเว้นกรณีตั้งใจตรวจ CSRF/Origin; ใช้ UUID ถูกต้องแต่เป็นของผู้อื่นเพื่อแยก 404 scope ออกจาก 400 path
- Race tests ใช้ PostgreSQL จริง separate sessions/connections และ Event lock barrier; ควบคุมการได้ lock ให้ครอบทั้งสองลำดับ ไม่ใช้ Promise.all อย่างเดียวอ้างว่าได้ทั้งสองลำดับ ทำซ้ำแต่ละกลุ่ม ≥20 รอบโดย fixture ใหม่ และ join ทุก transaction ก่อน assert
- ใน race ให้เทียบกับผลของ operation ที่ชนะ ไม่ยืนยันว่าฐานทั้งหมดไม่เปลี่ยนเมื่อมีคู่แข่งสำเร็จ; คำขอที่แพ้ต้องไม่เพิ่ม state/history ของตัวเอง

### Test cases

| Test ID / AC | ระดับ | Preconditions / input | Action | Expected result |
|---|---|---|---|---|
| TEST-37 / AC-28 | API/DB | PA/PB, ECANCEL2 ที่ t0 เต็มจาก PA (capacity=1, ACTIVE=1); valid sessions/CSRF; จด reference/registered_at/history เดิม | PB register ก่อน cancel → PA POST own cancel → GET own list/detail และ OA roster → PB register อีกครั้ง | ก่อน cancel: PB ได้ 409 EVENT_FULL, ไม่มี Registration/history ของ PB และ ACTIVE=1/available_seats=0; cancel=200 CANCELLED, cancelled_at=t0, reference/registered_at เดิม, ACTIVE count 1→0 และ available_seats 0→1 โดย Event.updated_at เดิม; เพิ่ม CANCELLED history 1 แถว actor=PA/time=t0; own list/detail ยังมี CANCELLED และ roster ยังคงแถวเดิม; หลัง cancel: PB ได้ 201 ACTIVE พร้อม REGISTERED history 1 แถว, ACTIVE=1/available_seats=0 เทียบ DB ยืนยันว่าใช้ที่นั่งที่ cancel คืน |
| TEST-38 / AC-29 | API/DB | PA, ECYCLE2 ที่ t0; อีก case PA ไม่เคยมี record ใน event ใหม่ที่เปิดรับ | register/reactivate → cancel ที่ t0+1 min → reactivate ที่ t0+2 min; แยก case create ใหม่ | reactivate=200 ACTIVE id/registered_at เดิมและ cancelled_at=null, ACTIVE count 0→1; cycle ถัดไป reuse id เดิม โดย history เพิ่ม CANCELLED/REACTIVATED อย่างละ 1 พร้อม actor/time ถูก; unique pair ยัง 1 record; case ใหม่=201 ACTIVE และ REGISTERED history 1 แถว ไม่เปลี่ยน response/duplicate behaviour เดิมนอกจาก cancelled_at ที่เพิ่ม |
| TEST-39 / AC-30 | API/DB | OA, EPUB2 แยก fixture สำหรับก่อน/ที่/หลัง deadline; จด Event/registrations/history/count | POST close → GET own/shared detail, PA own detail และ OA roster; close ซ้ำ และ close EDRAFT2 แยก case | close PUBLISHED=200 CLOSED แม้ deadline ผ่าน, owner/capacity/เวลา/created_at เดิม updated_at=clock หลัง lock, registration_open=false; Registration/history/ACTIVE count เดิมและอ่านได้; close ซ้ำ/DRAFT=409 INVALID_TRANSITION ไม่เปลี่ยน timestamp/history; close ไม่ append RegistrationHistory |
| TEST-40 / AC-28–31 | Unit + API/DB | แยก ACTIVE/CANCELLED กับ PUBLISHED/DRAFT/CLOSED/full fixtures และ valid sessions; ควบคุม clock | (a) cancel/reactivate ที่ deadline−1 ms, deadline, +1 ms (b) cancel ซ้ำก่อน deadline และหลัง deadline (c) reactivate เต็ม/ACTIVE ซ้ำแม้เต็ม (d) register DRAFT, CLOSED/expired ที่ทั้ง duplicate/full (e) ทุก endpoint: ไม่มี body/{} และ invalid null/array/primitive/malformed JSON/unknown หรือ spoof fields/เกิน parser budget | (a) −1 ms สำเร็จเมื่ออื่นครบ, ที่/+1 ms=REGISTRATION_CLOSED (b) ก่อน=ALREADY_CANCELLED, หลัง=REGISTRATION_CLOSED (c) CANCELLED เต็ม=EVENT_FULL คง cancelled_at, ACTIVE=ALREADY_REGISTERED (d) DRAFT=404 EVENT_NOT_FOUND, CLOSED/expired=REGISTRATION_CLOSED ก่อน duplicate/full (e) ไม่มี body/{} ผ่าน input เมื่อ domain ถูก, invalid=400 INVALID_INPUT ไม่เขียนข้อมูล; ไม่รับ participant/status/timestamp จาก client; รวม invalid UUID ก่อน record scope และ payload ผิดก่อน domain ทุก rejection ไม่มี state/timestamp/history เปลี่ยน |
| TEST-41 / AC-32 | API/DB | OA/OB/PA/PB/anonymous; ECANCEL2/ECYCLE2; CSRF ผูก session; body={} และ valid IDs | matrix cancel: anonymous/OA/PB→PA record/PA UUID ไม่มีจริง; register: anonymous/OA; close: anonymous/PA/OB→OA event/OA UUID ไม่มีจริง; แยก valid-role request ที่ CSRF ขาด/ผิดและ Origin ผิด | anonymous=401; wrong role=403 ROLE_FORBIDDEN; foreign/missing Registration=404 REGISTRATION_NOT_FOUND; foreign/missing Event=404 EVENT_NOT_FOUND; CSRF/Origin=403 CSRF_FAILED ก่อน input/scope; error schema ไม่เผยข้อมูลส่วนตัว/SQL; state/history ไม่เปลี่ยน |
| TEST-42 / AC-29,31,33 | API/DB concurrency | แยก fixtures เปิดรับและช่วงเวลาเหมาะกับแต่ละ race; sessions/connections/barrier ตามด้านบน | (a) cancel ของ record เดียวกันพร้อมกัน (b) reactivate ของคนเดียวกันพร้อมกัน (c) PA reactivate กับ PB create แย่งที่นั่งสุดท้าย (d) OA close แข่งกับ create/reactivate/cancel แยกกลุ่มและทั้งสองลำดับ lock (e) ถือ Event lock แล้วเลื่อน clock จาก deadline−1 ms ถึง deadline ก่อนปล่อย cancel/reactivate | (a) 200 หนึ่ง, ALREADY_CANCELLED หนึ่ง, CANCELLED history เพิ่มแค่ 1 (b) 200 หนึ่ง, ALREADY_REGISTERED หนึ่ง, REACTIVATED เพิ่มแค่ 1 (c) สำเร็จหนึ่ง (200 หรือ 201 ตามผู้ชนะ) อีกคำขอ EVENT_FULL, ACTIVE≤capacity และ loser ไม่มี state/history เพิ่ม (d) close ก่อน: mutation=REGISTRATION_CLOSED; mutation ก่อนเมื่อยังไม่ถึง deadline: ทั้งคู่สำเร็จ, CLOSED เก็บผล mutation และ history นั้นไว้ (e) REGISTRATION_CLOSED ไม่มี transition; ทุกกลุ่มไม่มี duplicate pair/history, deadlock/500 |
| TEST-43 / AC-28–30,32 | Component + E2E (Chromium) | OA/PA/PB contexts แยก, สร้าง/publish ผ่าน UI, เริ่ม ACTIVE ของ PA; mock error เฉพาะ component และใช้ server/DB จริงสำหรับ E2E | cancel confirmation (ปฏิเสธและยืนยัน) → ดู CANCELLED/time → refresh/re-login → re-register → ดู reference/time เดิม → OA refresh roster → close confirmation → refresh participant; component ทดสอบ busy,409,401,network uncertainty และ GET own-list lookup ที่สำเร็จ/ล้มเหลว/เปลี่ยน session หรือ event | ปฏิเสธ dialog ไม่ส่ง mutation; ยืนยันแล้ว UI/DB state/count ตรง; own list/detail และ roster แสดง registered_at ด้วย label ลงทะเบียนครั้งแรกเมื่อ เหมือนกันและค่าครั้งแรกคงเดิม; cancelled_at แสดงเฉพาะ CANCELLED, reactivate ใช้ ref เดิม; หน้ากิจกรรมเลือก record จาก GET /api/my/registrations ด้วย event.id, แยก ACTIVE/CANCELLED/ไม่พบได้และไม่มี endpoint lookup ใหม่; roster ไม่เพิ่มแถวซ้ำ; CLOSED ไม่มี cancel/re-register/close ที่ใช้งานได้; 409 ภาษาไทย+refresh, 401 ล้าง private data, own-read error ไม่ถูกตีความว่าไม่เคยลงทะเบียนและ response เก่าไม่ทับ session/event ใหม่, timeout ไม่ retry mutation อัตโนมัติ; reload/re-login อ่าน persisted state ได้ |
| TEST-44 / AC-33 | Migration integration + API/DB cross-feature | (a) disposable DB ที่มี migration S1 และ ACTIVE records พร้อม refs/times เดิม (b) test DB ที่ migrate S2 แล้ว (c) EPUB2 สำหรับ F-06×F-07 เมื่อ #48 พร้อม | (a) migrate deploy → query → migrate deploy ซ้ำ (b) inject history-write failure ผ่าน test dependency/transaction ใน create/cancel/reactivate แยก case; ไม่มี public fault endpoint (c) cancel PA: ACTIVE 2→1 แล้ว OA PATCH capacity=1 → PA reactivate → OA PATCH capacity=2 → PA reactivate | (a) refs/status/registered_at เดิม, cancelled_at=null, REGISTERED backfill หนึ่งแถวต่อ record actor=participant/time=registered_at; migrate ซ้ำไม่เพิ่ม history และมี FK/unique/index ตาม contract; legacy CANCELLED ที่ไม่มีเวลาให้ migration หยุดอย่างชัดเจน (b) HTTP 500 INTERNAL_ERROR แบบ generic และ rollback state/history ทั้งหมด แม้ new record/count ก็ไม่เพิ่ม (c) ลด capacity เป็น 1 ได้ 200, reactivate ขณะเต็มได้ 409 EVENT_FULL คง CANCELLED; เพิ่ม capacity เป็น 2 ได้ 200 แล้ว reactivate ได้ 200 ด้วย id เดิม, ACTIVE=2; หาก #48 ยังไม่พร้อมระบุ cross-feature ส่วนนี้ pending ห้ามนับ PASS/DoD ครบ; close แล้ว PATCH ตรวจที่ TEST-47 แห่งเดียวตาม cross-feature table |

TEST-44 ใช้ disposable test database เท่านั้น ห้าม downgrade/reset ฐาน application หรือ production เพื่อทดสอบ migration และต้องเก็บคำสั่ง/เวอร์ชันก่อนและหลังจริง เก็บ assertion ของ history ทั้งกรณีสำเร็จและ rollback; API/UI ไม่เปิดเผย history หรือเพิ่ม endpoint สำหรับ tests

## 3. F-07 test cases (TEST-45–TEST-52)

| Test ID / AC | ระดับ | Preconditions / input | Action | Expected result |
|---|---|---|---|---|
| TEST-45 / AC-34 | API/DB | OA, EDRAFT2; patch ทุก 7 field ด้วยค่าที่ถูก (ลำดับเวลาใหม่ยังถูก) | PATCH แล้ว GET own detail | 200 OwnerEvent ค่าตรงกับ patch (เวลาเป็น UTC `.SSSZ`); organizer_id/status/created_at เดิม; updated_at > ค่าเดิม; GET own detail ใน request ใหม่ได้ค่าที่แก้ |
| TEST-46 / AC-35 | API/DB | OA, EPUB2 | (a) patch title/description/location/capacity=4 (b) patch `starts_at` อย่างเดียว (c) patch title + `ends_at` (d) patch `registration_closes_at` เท่าค่าเดิม | (a) 200 และทั้ง GET /api/events/{id} และ GET /api/events เห็นค่าใหม่, available_seats=2 (b)(c)(d) 409 FIELD_NOT_EDITABLE ข้อมูลไม่เปลี่ยน (ใน (c) title ก็ไม่เปลี่ยน) |
| TEST-47 / AC-36 | API/DB | OA, ECLOSED2 | patch title | 409 EVENT_NOT_EDITABLE ข้อมูลไม่เปลี่ยน |
| TEST-48 / AC-37 | Unit + API/DB | OA, EDRAFT2 | ส่งทีละกรณี: `{}`; ไม่มี body; title=`"   "`; title 121 code points; description 2001; location 201; capacity 0, 1001, `"5"`, 2.5, `true`, `null`; `starts_at` ไม่มี offset / เศษวินาที 4 หลัก; มี `id` / `organizer_id` / `status` / `created_at` / `foo`; DRAFT patch `registration_closes_at` = starts+1 ms; DRAFT patch `ends_at` = starts | ทุกกรณี 400 INVALID_INPUT และข้อมูลไม่เปลี่ยน; boundary ที่ถูก (title 120, description 2000, location 200 code points, capacity 1 และ 1000, closes=starts) ได้ 200 |
| TEST-49 / AC-38 | API/DB | OA, EPUB2 (ACTIVE=2) และ EFULL2 | (a) EPUB2 capacity=2 (b) EPUB2 capacity=1 (c) EFULL2 capacity=2 แล้ว PC ลงทะเบียน | (a) 200, available_seats=0 (b) 409 CAPACITY_BELOW_ACTIVE ข้อมูลไม่เปลี่ยน (c) 200 แล้ว PC ได้ 201 ACTIVE count=2 |
| TEST-50 / AC-39 | API/DB concurrency | EPUB2 capacity=3, ACTIVE=2 | separate connections + start barrier: OA ลด capacity เป็น 2 พร้อมกับ PC ลงทะเบียน; ทำซ้ำ ≥ 20 รอบ สร้าง fixture ใหม่ทุกรอบและสลับลำดับเริ่ม | ทุกรอบหลัง join: ACTIVE count ≤ capacity; ผลเป็นได้แค่ (PATCH 200 + register 409 EVENT_FULL) หรือ (register 201 + PATCH 409 CAPACITY_BELOW_ACTIVE); ไม่มี deadlock/500 |
| TEST-51 / AC-40 | API/DB | EPUB2; body = `{ "title": "<ค่าที่ถูกต้อง>" }` ทุกกรณี | PATCH แบบ anonymous; PA; OB; OA ไม่มี CSRF; OA path `not-a-uuid`; OA UUID ที่ไม่มีจริง | 401 AUTH_REQUIRED; 403 ROLE_FORBIDDEN; 404 EVENT_NOT_FOUND; 403 CSRF_FAILED; 400 INVALID_INPUT; 404 EVENT_NOT_FOUND; ข้อมูลไม่เปลี่ยนทุกกรณี |
| TEST-52 / AC-40 | Component + E2E (Chromium) | OA; สร้าง DRAFT/PUBLISHED ผ่าน UI, CLOSED จาก fixture (หรือปิดผ่าน F-06 เมื่อพร้อม); PUBLISHED มี ACTIVE ≥ 1 | เปิดหน้ารายละเอียด → แก้ไข → เปลี่ยนค่า → บันทึก → reload; กรณี PUBLISHED และ capacity ต่ำกว่า ACTIVE | ฟอร์มเติมค่าเดิม; PUBLISHED ช่องเวลา disabled พร้อมข้อความ; CLOSED ไม่มีปุ่มแก้ไข; capacity ต่ำกว่า ACTIVE แล้วกดบันทึก เห็นข้อความ 409 ภาษาไทย, คำอธิบาย ACTIVE อัปเดต และค่าที่พิมพ์ยังอยู่; บันทึกสำเร็จ reload แล้วเห็นค่าใหม่ทั้งหน้า owner และหน้าทั่วไป; ปุ่มบันทึกปิดเมื่อไม่มีการเปลี่ยนแปลง |

## 4. Regression

ทุก PR เข้า `sprint-2-staging` ต้องรัน automated tests เดิมทั้งหมด (TEST-01–TEST-30, TEST-32, TEST-33, TEST-36; TEST-31/34/35 เป็น manual ทำตอนเตรียม release) ผ่าน CI `test-and-docker` และรายงานจำนวน passed/failed/skipped ตามจริงใน PR

## Revision history

ใช้กฎเดียวกับ [contracts.md](contracts.md#revision-history): แก้หลัง baseline ต้องเพิ่มแถวพร้อมเหตุผล ไม่เขียนทับ

| Version | วันที่ | การเปลี่ยนแปลง | เหตุผล | ผู้เขียน |
|---|---|---|---|---|
| 0.1 | 23 พ.ย. 2026 | fixtures และ F-07 TEST-45–52; F-06 รอ M1 | ฉบับแรกก่อน implementation | M2 |
| 0.2 | 23 พ.ย. 2026 | เพิ่ม fixtures/protocol และ F-06 TEST-37–44 ผูก AC-28–33; F-07 IDs/เนื้อหาคงเดิม | เติมส่วน #46 ก่อนเริ่ม #47 ให้ครอบ lifecycle/history, deadline/lock races, migration และ integration กับ #48 | M1 |
| 0.3 | 24 พ.ย. 2026 | TEST-37 ใช้กิจกรรมเต็มและตรวจ EVENT_FULL ก่อน cancel/201 หลัง cancel; TEST-43 ตรวจ label/GET lookup; TEST-44 แก้ถ้อยคำและให้ close×PATCH อยู่ TEST-47 แห่งเดียว | แก้ข้อเสนอแนะก่อน approve PR #56 ให้พิสูจน์การคืนที่นั่งจริงและไม่ซ้ำขอบเขต tests | M1 |
