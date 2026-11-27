# LoungCheu — Retest request for the Lab 6 controlled exercise

For: TH-005_P5 ApprovalFlow (UAT Team) | From: TH-001_P3 LoungCheu (Product Team) | Issue #64

## 1. Why we are asking

Your UAT of LoungCheu `v1.0.1-uat` found no defects and you gave **Accepted** (EV-D-01). Thank you. Because there was no real defect, the TA assigned us a **controlled defect exercise**. We put the defect into a separate branch only and **never deployed it**. Then we fixed it through the normal process (RED test, GREEN fix, review, CI, release, deploy).

The TA requires the UAT Team to **independently retest the corrected behaviour on the new deployed revision** and record the result. That is all we need from you. You do not need to look for the defect.

**The defect (only on our branch):** the same Participant could create more than one ACTIVE registration for the same event by sending the register request again **directly to the API**.

**Correct behaviour (what you check):** the repeated request is rejected with `409 ALREADY_REGISTERED`, no new registration is created, and the seat count does not change.

**Linked requirement:** AC-13, AC-17, BR-04 (Sprint 1 contract). Related UAT case: **UAT-02**.

## 2. Release to test

| Item | Value |
|---|---|
| App URL | https://scccd8b05-4d7hbszvwq-as.a.run.app/ |
| Corrected release | [`v2.0.1-lab6`](https://github.com/jetanin/LoungCheu/releases/tag/v2.0.1-lab6) / `6f49d327e8e709fc716b9eeb60591ea4fd692fc9` (release [PR #68](https://github.com/jetanin/LoungCheu/pull/68)) |
| Cloud Run revision | `scccd8b05-00012-msg` |
| Deployment | [Deploy demo run 45685620954](https://github.com/jetanin/LoungCheu/actions/runs/45685620954), SUCCESS; [release evidence](evidence/controlled-exercise/README.md) |
| Version check | Open `/api/ready`. Its `data` must show `"status":"ready"`, `"db":"connected"` and `"version":"6f49d327e8e709fc716b9eeb60591ea4fd692fc9"`. If the version is different, stop and tell us before sending the register requests. |

**Note:** this revision also includes our Sprint 2 features (cancel/re-register, close event, edit event). They do not change the duplicate rule. Please test only the steps below.

## 3. Accounts

Same accounts and password as the original UAT handoff (password sent by IG DM, never in the group, GitHub or your report). You need `organizer.a`, `participant.a` and `participant.b`.

## 4. Steps

Use a desktop browser (Chrome or Edge). Write down the date/time and tester name for each part.

### Part A — Set up an event (UI)

| # | Action | Expected result |
|---|---|---|
| A1 | Log in as `organizer.a`. Create an event with title `[RT-CX-<your initials>] Duplicate retest`, **จำนวนที่นั่ง = 3**, closing time at least 1 hour from now. Click **เผยแพร่กิจกรรม**. Log out. | Status **PUBLISHED**, **ว่าง 3 / 3 ที่นั่ง** |
| A2 | Log in as `participant.a`. Open the event and click **ลงทะเบียน**. | **ลงทะเบียนสำเร็จ**. After reload: **ว่าง 2 / 3 ที่นั่ง** |

### Part B — Send the register request again directly to the API (browser console)

Stay logged in as `participant.a` on the LoungCheu site.

1. Press **F12** → open the **Console** tab. If Chrome asks, type `allow pasting` and press Enter.
2. Paste the script below. **Change only the `TITLE` line** to your event title from A1. Press Enter.

```js
const TITLE = '[RT-CX-XX] Duplicate retest'; // <-- change to your title
const call = async (url, init) => { const r = await fetch(url, init); return { status: r.status, body: await r.json().catch(() => null) }; };
const ready = (await call('/api/ready')).body.data;
const ev = (await call('/api/events')).body.data.find((e) => e.title === TITLE);
if (!ev) throw new Error('Event not found - check TITLE');
const csrf = (await call('/api/auth/csrf')).body.data.csrf_token;
const register = () => call(`/api/events/${ev.id}/registrations`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf }, body: '{}' });
const seats = async () => { const d = (await call(`/api/events/${ev.id}`)).body.data; return `active ${d.active_count} / available ${d.available_seats}`; };
const mine = async () => (await call('/api/my/registrations')).body.data.filter((r) => r.event.id === ev.id && r.status === 'ACTIVE').length;
const before = await seats();
const repeat = await register();
const burst = await Promise.all([register(), register()]);
console.table({
  version: ready.version,
  seats_before: before,
  repeat_status: `${repeat.status} ${repeat.body?.error?.code ?? ''}`,
  burst_statuses: burst.map((r) => `${r.status} ${r.body?.error?.code ?? ''}`).join(', '),
  seats_after: await seats(),
  my_active_registrations_for_event: await mine(),
  checked_at: new Date().toString(),
});
```

3. Take a screenshot of the table.

| # | Check in the table | Expected result |
|---|---|---|
| B1 | `version` | Same commit as in section 2 |
| B2 | `repeat_status` (one repeated request) | `409 ALREADY_REGISTERED` |
| B3 | `burst_statuses` (two requests sent at the same time) | `409 ALREADY_REGISTERED, 409 ALREADY_REGISTERED` |
| B4 | `seats_before` and `seats_after` | Both `active 1 / available 2` (unchanged) |
| B5 | `my_active_registrations_for_event` | `1` |

The script only reads data and sends the same register request the **ลงทะเบียน** button sends. It uses your own logged-in session. It does not print or send your password.

### Part C — Confirm in the UI

| # | Action | Expected result |
|---|---|---|
| C1 | As `participant.a`: reload the event page | **ว่าง 2 / 3 ที่นั่ง**, **ลงทะเบียน ACTIVE 1 คน** |
| C2 | Open **รายการลงทะเบียนของฉัน** | The event appears **once only** |
| C3 | As `organizer.a`: open **ดูรายชื่อผู้ลงทะเบียน** for the event | **ลงทะเบียน ACTIVE 1 / 3 คน**, one row: Participant A |

### Part D — Re-run UAT-02

Run **UAT-02** from the original UAT cases again on this revision, with a new title such as `[UAT-02-RT-<initials>] Capacity check`. Record PASS/FAIL per step as before.

## 5. What to send back (IG group)

- Tester name(s), date/time and timezone, tested version (`v2.0.1-lab6 / 6f49d32`; record the full SHA from `/api/ready` with the evidence)
- PASS/FAIL for B1–B5, C1–C3 and UAT-02, with the actual result if anything differs
- Screenshots: the console table (Part B) and C1–C3. **Do not show passwords.**
- Your decision for this retest: **PASS** or **FAIL**, and whether your Sprint 1 decision for LoungCheu stays **Accepted** on this revision

If anything fails or is unclear, report it as a normal UAT finding and we will triage it.
