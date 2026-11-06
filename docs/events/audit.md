# F-02 spec / consistency audit

6 พฤศจิกายน 2026 (Asia/Bangkok) · working tree `feature/events` จาก `6e8a24c` · ยังไม่ commit/push/merge

ตรวจต่อจากผลเดิม 64 Vitest / 13 browser โดยรักษา diff เดิมทั้งหมด เทียบ `docs/{srs,system-sds,traceability}.md`, Sprint 1 contracts/STS, schema/migration, Event/Auth composition, API/UI tests และเอกสารส่งงาน พบข้อผิดพลาดที่ coverage เดิมยังตรวจไม่ถึง ผลเดิมเป็น historical run ไม่ใช่หลักฐานว่าครอบคลุมทุก race ใน UI

## Findings และการแก้

| Finding | ผลกระทบ / spec | การแก้และหลักฐาน |
|---|---|---|
| A-01 — publish 403/404 ยังแสดง cached DRAFT | สูง: SDS UI/NFR-06 ระบุไม่แสดงข้อมูลนอกสิทธิ์ แต่ mutation failure คง title/description/action บนหน้า | ล้าง record และ invalidate pending reads; เพิ่ม scope version ป้องกัน pending publish 200 คืนข้อมูลหลัง read 403/404 เช่นกัน `events-audit.spec.ts` ตรวจทั้งสองทิศทางและทั้งสอง HTTP statuses |
| A-02 — background /auth/me failure unmount RegistrationAction | สูง: focus ที่ network ล้มเหลวล้าง identity และแทนทั้งหน้า ทำ pending/success/uncertain หาย ขัด requirement จุดเชื่อม #3 | transient background failure แสดง warning/retry ภายใน shell โดยคง component เดิม; 3 lifecycle tests ตรวจ focus/manual refresh/read failure/identity failure/retry จน response จบ |
| A-03 — 401 เก่าถูก network failure ใหม่กลบ | สูง: request generation อย่างเดียวไม่พอเมื่อแยก transient failure ออกจาก rejection | ใช้ session epoch แยก Login/Logout แต่ละรอบ; 401 ของ current epoch ล้าง private state แม้ request ใหม่กว่าเพียงเชื่อมต่อไม่ได้ ขณะที่ response ของบัญชีก่อนหน้าไม่มีผลต่อ session ใหม่; เพิ่ม `a definitive session 401...` และรัน Auth race/restore/logout tests เดิม |
| A-04 — create/publish callbacks ข้ามบัญชี | สูง: create สำเร็จช้าหลัง Logout/Login คนอื่นเปลี่ยน route ของบัญชีใหม่; publish 401 ช้าล้างบัญชีใหม่ | EventForm/EventPage guard lifecycle และ abort mutation เมื่อ unmount; API client mutate รับ optional AbortSignal ครอบ CSRF bootstrap และ POST; browser ใช้ late real create 201 และ delayed publish 401 ตรวจ abort + บัญชีใหม่ยังอยู่ |
| A-05 — publish conflict ไม่ refresh event | กลาง: SDS ระบุอธิบาย conflict และดึง availability ล่าสุด แต่หน้าค้าง DRAFT หากอีก tab publish แล้ว | หลัง 409 อ่านใหม่โดยรักษา rejection message เดิม ไม่ retry mutation; browser publish ผ่าน API อีกครั้งก่อนกด UI แล้วต้องเห็น PUBLISHED พร้อมเหตุผล conflict |
| A-06 — frontend calendar validation ไม่ตรง backend | กลาง: Date.parse ยอม 29 ก.พ. ในปีไม่ leap / 30 ก.พ. / 31 เม.ย. และปีที่ API เก็บ/คืนไม่ได้ | round-trip Bangkok wall time และตรวจ UTC year range ตรง API; unit RED 5 fail/1 pass → GREEN 6 pass รวม leap day/millisecond/midnight |
| A-07 — SharedEvent type อนุญาต DRAFT และอ่าน public เป็น OwnerEvent | กลาง: type ไม่ตรง contracts แม้ backend runtime filter ถูกต้อง | SharedEvent.status เหลือ PUBLISHED/CLOSED; OwnerEvent เพิ่ม DRAFT ผ่าน Omit; EventView เป็น union และ EventPage ไม่อ้าง owner fields ของ public payload; ตรวจด้วย typecheck และ exact API field assertions |
| A-08 — trailing slash route ที่ shell ยอมรับใช้ไม่ได้ | กลาง: shell รับ /events/{id}/ และ /organizer/events/new/ แต่ EventPage ส่ง id ที่มี slash ไป API | normalize suffix ก่อนแยก id; browser ตรวจ owner detail/create ที่ลงท้าย slash |
| A-09 — เอกสาร current state ไม่ตรงกัน | กลาง: README ยังบอกไม่มี Event APIs, SDS source layout ยัง planned, Product DoD/evidence register ยังบอกขาด F-02 และไม่เคยทดสอบ concurrency; auth row ยัง review pending ทั้งที่ merged แล้ว | อัปเดต current summaries/links และแยก F-02 coverage ออกจาก Registration/roster/release gaps โดยเก็บ historical Auth records และผลรันเดิมไว้ |

## API / database review

ไม่พบข้อผิดพลาดใน Event service/router/input ตามขอบเขตที่ตรวจ จึงไม่เปลี่ยน backend domain logic หรือ shared schema/migration เพิ่ม assertions ฝั่ง integration เพื่อทวนสอบจุดที่เทสเดิมยังไม่ครอบคลุม:

- หก endpoints ใช้ auth → role → CSRF → input → scope/domain ตาม contract; GET shared ไม่ใช้ role restriction; owner routes ใช้ current session/current role และ scoped query; unauthorized/not found ไม่คืน record
- input required ทั้งเจ็ด field, strict types, trimmed Unicode code-point lengths, integer capacity 1–1000, ไม่รับ owner/status/system fields; invalid ไม่ insert
- ตรวจ calendar/offset/precision ใน timestamp ทั้งสาม field รวม negative offset และ leap day ที่ normalize เป็น UTC millisecond; DRAFT เก็บอดีตและ closes=starts ได้
- publish ใช้ transaction/parameterized Event row lock อ่าน clock หลัง lock, scope ก่อน domain, status ก่อน deadline, equality ปฏิเสธ; failed publish คง event/updated_at เดิม; concurrent publish สำเร็จครั้งเดียว
- SharedEvent/OwnerEvent exact required fields บน detail/list, CLOSED shared detail อ่านได้ทั้งสอง role, DRAFT shared 404, own list ไม่มี event คนอื่น; sorting ties ทั้งสองแบบ
- ACTIVE counts จาก relation จริง, CANCELLED ไม่นับ; available_seats/registration_open ตรง status/clock/count; REPEATABLE READ สำหรับ list/detail ให้ snapshot เดียวกัน มี concurrent writer/read assertions; publish ถือ Event lock ตาม lock order ร่วม #3
- เพิ่ม Event endpoint tests ของ token หลัง Login rotation, current role/inactive และ absolute expiry; test สร้าง createApp ใหม่ด้วย secret/database เดิมแล้วใช้ cookie เดิมอ่าน DRAFT ได้ การนี้เป็น app-recreation test ไม่ใช่ process restart/UAT
- ตรวจ schema และ `202611060002_registration_extension` เทียบ Git blob ของ #3 และ checksum LF/CRLF ใน test DB ไม่แก้ migration หรือ history; ไม่มี reset/drop/migrate ฐานแอป

## TDD / verification record

- [UI RED](evidence/audit/ui-red.log): 9 fail / 1 pass ก่อนแก้ A-01/02/04/05/08
- [Session race RED](evidence/audit/session-race-red.log): 1 fail ก่อนแก้ A-03
- [Form RED](evidence/audit/model-red.log): 5 fail / 1 pass ก่อนแก้ A-06; [GREEN](evidence/audit/model-green.log): 6 pass
- typecheck ครั้งแรกหลังเพิ่ม unit test พบ inferred body type ไม่มี starts_at; แก้ timestamp fields เป็น required typed keys แล้วรัน typecheck/build ใหม่ ข้อนี้เป็น compile correction ไม่ใช่ business-rule RED
- ผล regression ล่าสุดและคำสั่งใน [verification](verification.md); tested source/runtime/DB ใน [audit manifest](evidence/audit/manifest.json) ใช้ source hash เพราะยังไม่ commit

## ขอบเขตที่ยังต้องตรวจตอนรวมงาน

Backend Registration จาก #3 ยังไม่ได้รวม; RegistrationAction และ adapter คงเนื้อหาเดิมจากเพื่อนทุก byte Lifecycle tests ใช้ mock สำหรับ registration outcome เพื่อทดสอบ host ไม่ใช่ proof ของ Registration backend รวมจริง Full publish→register→own list→roster, last-seat/duplicate ของ #3, manual process restart, independent UAT, teammate review/reproduction และ release/deploy ยังไม่อ้างว่าผ่าน ดู [integration dependencies](integration.md)
