# Sprint 2 — Software Test Specification (F-06, F-07)

เอกสาร LC-S2-STS | v0.1 (draft for review) | 23 พฤศจิกายน 2026

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

> M1 เขียน ใช้ fixtures ข้างบนหรือเพิ่มเองได้

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
