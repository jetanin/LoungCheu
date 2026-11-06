# UI layout / typography consistency

ตรวจ current #1–#3 routes บน `feature/events` merge working tree (HEAD `04106ff` + incoming `ada659b`) หลัง demo seed และคำขอเอา “กลับรายการกิจกรรม” ออก เวลารัน/working-tree SHA256 อยู่ใน [manifest](evidence/visual-consistency/manifest.json) ยังไม่ commit/push

## Findings และการปรับ

| จุดที่ตรวจ | Before | After |
|---|---|---|
| Header / logo บน 320px | brand แตกเป็น 2 บรรทัด สูง66px และ Logout ตัดคำ | brand inline flex สูง36px/ไม่แตกบรรทัด; ชื่อบัญชี/Logout เรียงขวาบนมือถือ และชื่อยาวใช้ ellipsis พร้อม title |
| Page headings | desktop32px/weight500 เกือบทุกหน้า แต่ overview28px/700; mobile Bootstrap RFS ให้ขนาดต่างกัน | desktop28px/mobile24px/weight700 จาก scale เดียว |
| Shared list hierarchy | `/events` มี2 h1; `/events/` ไม่มี greeting | 1 page h1 และ section h2; ทั้งสอง URL แสดงโครงเดียวกัน |
| Login vs Event form | input/action Login20px/48px, Event16px/38px | input/body/action16px, input44px และ actionอย่างน้อย44px |
| Labels / status | text labels16px แต่ date legends14px; status badgesหลายขนาด | form/display labelsและmetadata14px; status pill12px และสีเดียวกันตามสถานะ |
| Registration CTA | Bootstrap blue ต่างจากปุ่มสร้าง/บันทึกสีเขียว | primary actions ใช้ #126b56 ผ่าน shared CSS โดยไม่แก้ RegistrationAction internals |
| Panels / spacing | create centered800px แต่ detail ชิดซ้าย/max860px; padding24/48px ต่างกัน | create/detail centered max800px, Login max496px; panel padding32px desktop/20px mobile |
| Mobile / states | rows/status/actions และข้อความยาวไม่มีรูปแบบร่วม | action row wrap, overview row stack บนมือถือ, หัวข้อ/รายละเอียด/เลขอ้างอิงยาว wrap; empty/loading/error/403/404 ใช้ type/surface เดียวกัน |

รักษาโทนเขียว/พื้นหลังอ่อน/การ์ดขาวเดิม ใช้ system font stack เดิม ไม่โหลด font/asset ใหม่ ไม่เปลี่ยน Auth/API/domain rules วันที่ยังเป็น Bangkok และฟอร์มเรียงปิดรับ → เริ่ม → สิ้นสุดเหมือนเดิม Date/time อยู่คู่กันตั้งแต่360px; ต่ำกว่า360px แยกแนวตั้งเพื่ออ่านค่าได้เต็ม ช่องทั้งสามแถวยังใช้ grid เดียวกัน

Common classes อยู่ใน `client/src/styles/app.css`: `page-title`, `section-title`, `page-panel`, `page-heading`, `event-status`, `event-meta` และ shared controls/theme; App/Login/Event pages ใช้ชุดเดียวกัน Issue #4 สามารถ reuse classes เหล่านี้เมื่อ implement views

## Type / sizing reference

| Role | Size / treatment |
|---|---|
| Logo mark / wordmark | 36×36px mark, lettering14px; wordmark20px/700 |
| Page title | 28px desktop / 24px mobile, 700 |
| Section / card title | 20px / 18px |
| Body / inputs / normal actions | 16px |
| Form/display labels / metadata / footer | 14px |
| Status / timezone caption | 12px |
| Dashboard numeric value | 32px |
| Inputs / primary action targets | 44px / minimum44px; compact header Logout36px |

ใช้ลำดับขนาดตามบทบาทของข้อความ เพื่อให้ heading/label/body ที่ทำหน้าที่เหมือนกันตรงกันข้ามหน้า

## Browser coverage / actual results

`tests/e2e/visual-consistency.spec.ts` วัดที่ **1280, 390, 320px**: Login, overview, own list, overview empty, list empty/loading/error, create/invalid, DRAFT preview, owner published detail, shared list/canonical trailing slash, shared detail, registration success, forbidden และ missing detail รวม **17 contexts × 3 widths = 51 rendered contexts** และ stress cases ข้อความยาว/ชื่อบัญชียาวอีก3 viewport checks

ตรวจ computed font sizes/weights/families, logo position/size/brand wrapping, white card/input surfaces, control heights, label/card-title/footer sizes, primary colour, panel centering และ horizontal overflow มี real Login/create/publish/register; list payloads กรองให้เหลือ fixtures เพื่อให้ภาพกระชับ ส่วน empty/loading/error/long-text/long-name ใช้ mock เฉพาะ UI reads ไม่ใช่หลักฐาน backend permission/count accuracy

- [RED](evidence/visual-consistency/red.log): 3 viewport cases failed ก่อนปรับ มี measured baseline ใน [1280](evidence/visual-consistency/before-1280-metrics.json), [390](evidence/visual-consistency/before-390-metrics.json), [320](evidence/visual-consistency/before-320-metrics.json)
- [Initial focused measurements](evidence/visual-consistency/green.log): 3 pass แต่ยังเป็น intermediate รอบนั้น visual review พบ card/input background ที่รับสี body มา จึงคืน white surface และเพิ่ม assertions; ไม่ใช่ผล final
- [First full attempt](evidence/visual-consistency/first-full-attempt.log): 34 pass / 1 timeout เทสใหม่ navigate Login ก่อน Logout POST จบ จึงแก้ helper ให้รอ Login screen ก่อน navigation ไม่ลด assertions หรือเพิ่ม timeout
- [Final Chromium](evidence/visual-consistency/e2e.log): **35 passed / 0 failed/skipped**, 53.8s, native exit0; เดิม32 + viewport tests3 ตรวจ browser Back ได้และไม่มี “กลับรายการกิจกรรม” กลับมา Pending/success/uncertain และ session races เดิมผ่านครบ
- [Vitest](evidence/visual-consistency/vitest.log): **12 files / 145 passed / 0 failed/skipped**, native exit0
- [Typecheck](evidence/visual-consistency/typecheck.log) / [build](evidence/visual-consistency/build.log): PASS; [compiled smoke](evidence/visual-consistency/built-smoke.log): **3 passed**

Final metrics: [desktop](evidence/visual-consistency/after-1280-metrics.json), [390px](evidence/visual-consistency/after-390-metrics.json), [320px](evidence/visual-consistency/after-320-metrics.json) ทุก normal/state page มี1 h1, brand height36px และ card white; font h1 เป็น28/24/24px ตาม viewport

## Selected screenshots

| Context | Before | After |
|---|---|---|
| Desktop create | [before](evidence/visual-consistency/before-desktop-create.png) | [after](evidence/visual-consistency/after-desktop-create.png) |
| Mobile 320px overview/header | [before](evidence/visual-consistency/before-mobile-overview.png) | [after](evidence/visual-consistency/after-mobile-overview.png) |
| Mobile shared detail | [before](evidence/visual-consistency/before-mobile-detail.png) | [after](evidence/visual-consistency/after-mobile-detail.png) |

ภาพและ measurements ครบอยู่ใน `.local/ui-review/{before,after}` พร้อม samples [desktop overview](evidence/visual-consistency/after-desktop-overview.png) / [mobile success](evidence/visual-consistency/after-mobile-success.png) ภาพตัวแทนหลังแก้ตรวจด้วยสายตาแล้วเพิ่มเติมจาก automated metrics

## Scope / limitations

ใช้ PostgreSQL `loungcheu_test` เท่านั้น ไม่มี app DB writes/reset/drop, dependency/schema/migration changes หรือแก้ไฟล์ภายใน #3 Backend และ seed คงเดิม ไม่สร้าง My Registrations/roster ของ Issue #4 ภาพ viewport เป็น Chromium simulation ไม่ใช่ independent physical-device/browser-matrix UAT/restart/redeploy/teammate acceptance

Baseline geometry ปรับให้เทียบพิกัดหน้าเอกสาร (รวม scroll offset) ก่อนเก็บ RED เพื่อไม่เอาการเลื่อนหน้ามาอ้างเป็น logo misalignment Logs แปลง UTF-8/LF/ตัด trailing whitespace โดยคงผลรัน Historical 145/32 หลัง seed ยังคงเป็นหลักฐานของรอบนั้น; รอบนี้เป็น actual 145/35 AI assistance: Codex ตรวจ/ปรับ source และรันทดสอบ ไม่มี commit/push
