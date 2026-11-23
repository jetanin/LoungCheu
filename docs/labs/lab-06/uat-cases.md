# Lab 6 — Sprint 1 UAT cases (LoungCheu)

Product Team: TH-001_P3 (Jetanin Naitho, Paphangkorn Luanseng)
UAT Team: TH-005_P5 (Napat Utbuawong, Nanthakorn Pinsupaporn)
Release under test: tag `v1.0.1-uat`. URL, commit, deployed revision, setup and cleanup are in `handoff.md` in this folder (added once the release is deployed)
Scope: Sprint 1 features F-01–F-05, acceptance criteria in [Sprint 1 contracts](../../sprints/sprint-1/contracts.md)

## How to use this file

- Run the cases in this order: **UAT-01 → UAT-04 → UAT-05**, because UAT-04 and UAT-05 reuse the event and registration that UAT-01 creates. UAT-02, UAT-03, UAT-06 and UAT-07 are independent and can run at any time.
- Every case creates its own events. Start each title with `[UAT-xx-<your initials>]` (for example `[UAT-01-NU] ...`) so your data never collides with other testers or with demo data.
- `D` means the day you run the test. All times are Asia/Bangkok (the form already uses Bangkok time).
- Account labels only are listed here. Passwords were sent privately.
- Write what you actually see in the "Actual" column of the results sheet. If a step cannot be executed, mark the case **BLOCKED** and write why.
- In UAT-01 you record two IDs that later cases need:
  - **EVENT-01** = the event ID at the end of the URL `/organizer/events/<EVENT-01>`
  - **REG-01** = the reference number (เลขอ้างอิง) shown after participant.a registers

| Account label | Role | Display name |
|---|---|---|
| `organizer.a` | ORGANIZER | Organizer A |
| `organizer.b` | ORGANIZER | Organizer B |
| `participant.a` | PARTICIPANT | Participant A |
| `participant.b` | PARTICIPANT | Participant B |
| `participant.c` | PARTICIPANT | Participant C |
| `inactive.x` | PARTICIPANT (deactivated) | Inactive X |

## Coverage

| Case | Required category (Lab 6 §3.1) | Feature | Acceptance criteria |
|---|---|---|---|
| UAT-01 | Normal domain journey | F-01, F-02, F-03, F-04, F-05 | AC-06, AC-08, AC-09, AC-12, AC-18, AC-21, AC-24 |
| UAT-02 | Business rule / boundary (duplicate + capacity) | F-03, F-05 | AC-13, AC-14, AC-21 |
| UAT-03 | Business rule / boundary (deadline) | F-02, F-03 | AC-08, AC-15 |
| UAT-04 | Forbidden role / ownership | F-02, F-04, F-05 | AC-10, AC-19, AC-22, AC-26 |
| UAT-05 | State / history / persistence | F-01, F-04, F-05 | AC-04, AC-18, AC-23 |
| UAT-06 | Authentication rules | F-01 | AC-01, AC-02 |
| UAT-07 | Input validation boundary | F-02 | AC-07, AC-11 |

Out of scope for this UAT (Sprint 2/3, not delivered): cancel / re-register / close event (F-06), edit event or capacity (F-07), check-in and attendance (F-08), attendance summary (F-09). Concurrent last-seat registration (AC-17) cannot be done reliably by hand and is covered by automated tests TEST-20/21.

Sprint 1 criteria not exercised by these manual cases, and why:

| AC | Reason | Covered by |
|---|---|---|
| AC-03 | `/me` API responses, not visible as a UI step (UAT-05 step 3 shows the effect) | TEST-03, TEST-06 |
| AC-05 | Password hashing and CSRF/Origin checks are API-level | TEST-05 |
| AC-16 | Spoofed participant/status fields need crafted API requests | TEST-19 |
| AC-17 | Simultaneous last-seat requests | TEST-20, TEST-21 |
| AC-20 | Empty state / failed-fetch retry needs a fresh account or a forced network error | TEST-25 |
| AC-25 | Restart and redeploy persistence was shown in Lab 5 | TEST-31, TEST-35 |
| AC-27 | Process criterion (traceability), not product behaviour | TEST-34 |

---

## UAT-01 — Organizer publishes an event, participant registers, organizer sees the roster

- **AC:** AC-06, AC-08, AC-09, AC-12, AC-18, AC-21, AC-24
- **Purpose:** The main Sprint 1 journey works end to end through the real UI and the data is saved.
- **Roles:** `organizer.a`, `participant.a`
- **Preconditions:** Nobody is logged in. Use one browser window; log out between roles.
- **Synthetic inputs:**

| Field | Value |
|---|---|
| ชื่อกิจกรรม | `[UAT-01-<initials>] Intro to Git` |
| รายละเอียด | `UAT normal journey` |
| สถานที่ | `Room 301` |
| จำนวนที่นั่ง | `2` |
| ปิดรับลงทะเบียน | D+2, 10:00 |
| เริ่มกิจกรรม | D+3, 09:00 |
| สิ้นสุดกิจกรรม | D+3, 12:00 |

- **Steps and expected results:**

| # | Action | Expected result |
|---|---|---|
| 1 | Log in as `organizer.a` | Lands on `/events`. Header shows **Organizer A**. Page says **สวัสดี Organizer A** and **ผู้จัดกิจกรรม** |
| 2 | Click **กิจกรรมของฉัน** → **สร้างกิจกรรม**, fill in the inputs above, click **บันทึก DRAFT** | Goes to `/organizer/events/<id>`. Status badge **DRAFT**. Text **ตัวอย่างกิจกรรม · กิจกรรมนี้จะปรากฏในรายการทั่วไปหลังเผยแพร่**. Shows **ว่าง 2 / 2 ที่นั่ง**. Copy the ID in the URL → this is **EVENT-01** |
| 3 | Log out, log in as `participant.a`, look at **กิจกรรมทั้งหมด** | The `[UAT-01-…]` event is **not** listed (DRAFT is not public) |
| 4 | Log out, log in as `organizer.a`, open EVENT-01 from **กิจกรรมของฉัน**, click **เผยแพร่กิจกรรม** | Status changes to **PUBLISHED**. The publish button disappears and **ดูหน้ากิจกรรมทั่วไป** appears |
| 5 | Log out, log in as `participant.a`, open **กิจกรรมทั้งหมด** | The event card shows **PUBLISHED**, **ว่าง 2 / 2 ที่นั่ง · เปิดรับลงทะเบียน** |
| 6 | Open the event, click **ลงทะเบียน** | Green box **ลงทะเบียนสำเร็จ เลขอ้างอิง: <id>**. Copy the ID → this is **REG-01** |
| 7 | Click **ดูรายการของฉัน** | `/my/registrations` lists the event with status **ACTIVE** and **เลขอ้างอิง: REG-01** |
| 8 | Log out, log in as `organizer.a`, open EVENT-01, click **ดูรายชื่อผู้ลงทะเบียน** | Shows **ลงทะเบียน ACTIVE 1 / 2 คน**. Table has one row: REG-01, **Participant A**, **ACTIVE** |

---

## UAT-02 — Duplicate registration is rejected and a full event takes no more registrations

- **AC:** AC-13, AC-14, AC-21
- **Purpose:** Check the duplicate rule and the capacity boundary (exactly at capacity, then one more).
- **Roles:** `organizer.a`, `participant.a`, `participant.b`, `participant.c`
- **Preconditions:** None (independent case).
- **Synthetic inputs:** Same as UAT-01, with title `[UAT-02-<initials>] Capacity check` and **จำนวนที่นั่ง = 2**.
- **Steps and expected results:**

| # | Action | Expected result |
|---|---|---|
| 1 | As `organizer.a`: create the event and click **เผยแพร่กิจกรรม** | Status **PUBLISHED**, **ว่าง 2 / 2 ที่นั่ง** |
| 2 | As `participant.a`: open the event, click **ลงทะเบียน** | **ลงทะเบียนสำเร็จ** with a reference number |
| 3 | Still as `participant.a`: reload the page (F5) and click **ลงทะเบียน** again | Warning **คุณลงทะเบียนกิจกรรมนี้แล้ว ตรวจสอบได้ในรายการของฉัน**. The page shows **ว่าง 1 / 2 ที่นั่ง** and **ลงทะเบียน ACTIVE 1 คน** (unchanged) |
| 4 | Open **รายการลงทะเบียนของฉัน** | This event appears **once only** |
| 5 | As `participant.b`: open the event, click **ลงทะเบียน** | **ลงทะเบียนสำเร็จ**. After reload: **ว่าง 0 / 2 ที่นั่ง** |
| 6 | As `participant.c`: open the event | Text **กิจกรรมนี้ไม่เปิดรับลงทะเบียน หรือไม่มีที่นั่งว่าง**. The **ลงทะเบียน** button is disabled. The card in **กิจกรรมทั้งหมด** shows **ว่าง 0 / 2 ที่นั่ง · ยังไม่เปิดรับ / ปิดรับแล้ว** |
| 7 | As `organizer.a`: open **ดูรายชื่อผู้ลงทะเบียน** | **ลงทะเบียน ACTIVE 2 / 2 คน**. Exactly two rows: Participant A and Participant B. No Participant C |

---

## UAT-03 — Registration deadline is enforced

- **AC:** AC-08, AC-15
- **Purpose:** No registration after the closing time, and an organizer cannot publish after the deadline.
- **Roles:** `organizer.a`, `participant.c`
- **Preconditions:** None (independent case). This case needs about 6 minutes of waiting.
- **Synthetic inputs:** Let `T` = current time rounded **up** to the next minute.

| Event | ชื่อกิจกรรม | ปิดรับลงทะเบียน | เริ่มกิจกรรม | สิ้นสุดกิจกรรม | ที่นั่ง |
|---|---|---|---|---|---|
| A | `[UAT-03A-<initials>] Deadline register` | D, T+4 min | D+1, 09:00 | D+1, 12:00 | 5 |
| B | `[UAT-03B-<initials>] Deadline publish` | D, T+2 min | D+1, 09:00 | D+1, 12:00 | 5 |

- **Steps and expected results:**

| # | Action | Expected result |
|---|---|---|
| 1 | As `organizer.a`: create event A and publish it **immediately** | Status **PUBLISHED** |
| 2 | Create event B and **do not** publish it | Status **DRAFT** |
| 3 | As `participant.c`: open event A **before** its closing time | **ที่นั่งว่าง 5 ที่**, **ลงทะเบียน** button enabled. Do **not** click it |
| 4 | Wait until the closing time of event A has passed (+1 minute), then click **รีเฟรชที่นั่ง** | Text **กิจกรรมนี้ไม่เปิดรับลงทะเบียน หรือไม่มีที่นั่งว่าง**. Button disabled. **ลงทะเบียน ACTIVE 0 คน** |
| 5 | Open **รายการลงทะเบียนของฉัน** | Event A is not listed |
| 6 | As `organizer.a`: after event B's closing time has passed, open event B and click **เผยแพร่กิจกรรม** | Warning **เลยกำหนดปิดรับลงทะเบียนแล้ว**. After **ลองใหม่**/reload the status is still **DRAFT** |

---

## UAT-04 — Users cannot see or use other people's records

- **AC:** AC-10, AC-19, AC-22, AC-26
- **Purpose:** Ownership and role rules protect events, rosters and registrations. A rejected attempt must not reveal data or change anything.
- **Roles:** `organizer.b`, `participant.a`, `participant.b`, `organizer.a`
- **Preconditions:** UAT-01 finished. You have **EVENT-01** and **REG-01**. Replace `<URL>` with the app URL from the handoff.
- **Steps and expected results:**

| # | Action | Expected result |
|---|---|---|
| 1 | Log in as `organizer.b`. Open **กิจกรรมของฉัน** | The `[UAT-01-…]` event is **not** listed |
| 2 | Type `<URL>/organizer/events/EVENT-01` in the address bar | Warning **ไม่พบกิจกรรมนี้**. No event details are shown. There is no publish button |
| 3 | Type `<URL>/organizer/events/EVENT-01/registrations` | Warning **ไม่พบกิจกรรมนี้**. **No** names, reference numbers or count are shown |
| 4 | Log out, log in as `participant.b`. Type `<URL>/my/registrations/REG-01` | Warning **ไม่พบรายการลงทะเบียนนี้**. Participant A's data is not shown |
| 5 | Open **รายการลงทะเบียนของฉัน** | REG-01 / the `[UAT-01-…]` event is **not** in Participant B's list |
| 6 | Log out, log in as `participant.a`. Type `<URL>/organizer/events` | Heading **ไม่มีสิทธิ์ใช้งาน**. The organizer menu items **ภาพรวม** and **กิจกรรมของฉัน** are not in the menu |
| 7 | Type `<URL>/organizer/events/EVENT-01/registrations` | Heading **เฉพาะผู้จัดกิจกรรมเท่านั้นที่ดูรายชื่อได้**. No roster |
| 8 | Log out, log in as `organizer.a`. Type `<URL>/my/registrations` | Heading **เฉพาะผู้เข้าร่วมเท่านั้นที่ดูรายการลงทะเบียนได้** |
| 9 | **State check:** still as `organizer.a`, open EVENT-01 → **ดูรายชื่อผู้ลงทะเบียน** | Same as UAT-01 step 8: **ACTIVE 1 / 2 คน**, one row (Participant A, ACTIVE). Nothing changed |

---

## UAT-05 — Saved registration survives logout, re-login and reload

- **AC:** AC-04, AC-18, AC-23
- **Purpose:** Data is stored in the database, not only in the page or session. Logging out really ends access.
- **Roles:** `participant.a`, `organizer.a`
- **Preconditions:** UAT-01 finished (REG-01 exists). Write down the **ลงทะเบียนเมื่อ** time of REG-01 from `/my/registrations/REG-01` before step 1.
- **Steps and expected results:**

| # | Action | Expected result |
|---|---|---|
| 1 | As `participant.a`, open `/my/registrations/REG-01`, then click **ออกจากระบบ** | Goes to the login page |
| 2 | Press the browser **Back** button. If Back is greyed out (the app replaces history on logout) or it leaves the site, type `<URL>/my/registrations` in the address bar instead | The login page is shown (a short **กำลังตรวจสอบการเข้าสู่ระบบ…** message may appear first). Registration data is **not** shown |
| 3 | Close the browser completely. Open a new browser window (or a private window), go to `<URL>/my/registrations` | Asked to log in |
| 4 | Log in as `participant.a`, open **รายการลงทะเบียนของฉัน** | The `[UAT-01-…]` event is listed with status **ACTIVE**, the same **เลขอ้างอิง REG-01** and the same **ลงทะเบียนเมื่อ** time as before |
| 5 | Log out, log in as `organizer.a`, open EVENT-01 → **ดูรายชื่อผู้ลงทะเบียน**, then press F5 | **ACTIVE 1 / 2 คน**, row REG-01 / Participant A, same time as before |

---

## UAT-06 — Login accepts valid users and rejects everyone else

- **AC:** AC-01, AC-02
- **Purpose:** Only active users with the correct password can log in, and the error does not reveal which part was wrong.
- **Roles:** `participant.a`, `organizer.a`, `inactive.x`, and an unknown username
- **Preconditions:** None (independent case). Nobody is logged in.
- **Steps and expected results:**

| # | Action | Expected result |
|---|---|---|
| 1 | Click **เข้าสู่ระบบ** with both fields empty | Under the fields: **กรุณากรอกชื่อผู้ใช้** and **กรุณากรอกรหัสผ่าน**. Still on the login page |
| 2 | Username `participant.a`, password `wrong-password-1` | Red box **ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง**. Password field is cleared. Not logged in |
| 3 | Username `nobody.uat`, password `wrong-password-1` | Same message **ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง** (no hint that the user does not exist) |
| 4 | Username `inactive.x` with the password sent privately | Same message **ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง**. Not logged in |
| 5 | Log in as `participant.a` with the correct password | Header **Participant A**, subtitle **ผู้เข้าร่วมกิจกรรม**, menu has **รายการลงทะเบียนของฉัน** and **กิจกรรมทั้งหมด** only |
| 6 | Log out, log in as `organizer.a` | Header **Organizer A**, subtitle **ผู้จัดกิจกรรม**, menu has **ภาพรวม**, **กิจกรรมทั้งหมด**, **กิจกรรมของฉัน** |

---

## UAT-07 — Invalid event input is rejected and nothing is saved

- **AC:** AC-07, AC-11
- **Purpose:** Field rules and limits on the create form. Valid boundary values are accepted.
- **Roles:** `organizer.a`
- **Preconditions:** None (independent case). Logged in as `organizer.a`, on **กิจกรรมของฉัน** → **สร้างกิจกรรม**. Start each step from the valid inputs of UAT-01 (title `[UAT-07-<initials>] Validation`) and change only the field mentioned.
- **Steps and expected results:**

Steps 1–5 stay on the same form. In each step, first put back the valid value from the previous step, then change only the field named, then click **บันทึก DRAFT**.

| # | Action | Expected result |
|---|---|---|
| 1 | Fill all fields with the valid inputs, then clear ชื่อกิจกรรม (or type only spaces). Click **บันทึก DRAFT** | Under the title: **กรุณากรอก 1–120 ตัวอักษร**. Stays on the form, no event page opens |
| 2 | Put the title back. Set จำนวนที่นั่ง = `0`. Click **บันทึก DRAFT** | **จำนวนที่นั่งต้องเป็นจำนวนเต็ม 1–1000**. Stays on the form |
| 3 | Set จำนวนที่นั่ง = `1001`. Click **บันทึก DRAFT** | **จำนวนที่นั่งต้องเป็นจำนวนเต็ม 1–1000**. Stays on the form |
| 4 | Set จำนวนที่นั่ง back to `2`. Set ปิดรับลงทะเบียน = D+3 10:00 (after the start time D+3 09:00). Click **บันทึก DRAFT** | **เวลาปิดรับต้องไม่หลังเวลาเริ่ม**. Stays on the form |
| 5 | Set ปิดรับลงทะเบียน back to D+2 10:00. Set สิ้นสุดกิจกรรม = D+3 08:00 (before the start time). Click **บันทึก DRAFT** | **เวลาสิ้นสุดต้องหลังเวลาเริ่ม**. Stays on the form |
| 6 | Leave the form and open **กิจกรรมของฉัน** | No `[UAT-07-…]` event appears (steps 1–5 saved nothing) |
| 7 | On **กิจกรรมของฉัน**, click **สร้างกิจกรรม** again. Fill all valid inputs of UAT-01 with title `[UAT-07-<initials>] Validation` and จำนวนที่นั่ง = `1000`. Click **บันทึก DRAFT** | Goes to `/organizer/events/<id>`. Status **DRAFT**, **ว่าง 1000 / 1000 ที่นั่ง**. Leave it as DRAFT (do not publish) |

---

## Results sheet (UAT Team fills this in)

| Case | Tester (name / team) | Date-time (Bangkok) | Tested version (`/api/ready` → version) | Inputs actually used | Actual result | PASS / FAIL / BLOCKED | Evidence ID |
|---|---|---|---|---|---|---|---|
| UAT-01 | | | | | | | |
| UAT-02 | | | | | | | |
| UAT-03 | | | | | | | |
| UAT-04 | | | | | | | |
| UAT-05 | | | | | | | |
| UAT-06 | | | | | | | |
| UAT-07 | | | | | | | |

Name evidence files `EV-<case>-<step>_<short-note>_<YYYY-MM-DDTHHMM>.png`, for example `EV-UAT04-9_state-unchanged_2026-11-24T1410.png`, and put that name in the Evidence ID column.

Please take a screenshot for every case, and for every rejected action also take a screenshot that shows the protected data was not changed (for example UAT-04 step 9).
