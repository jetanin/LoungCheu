# Lab 6 — UAT handoff (LoungCheu)

From: Product Team TH-001_P3 (Jetanin Naitho, Paphangkorn Luanseng)
To: UAT Team TH-005_P5 (Napat Utbuawong, Nanthakorn Pinsupaporn)
Test cases: [uat-cases.md](uat-cases.md)

## 1. Release under test

| Item | Value |
|---|---|
| App URL | https://scccd8b05-4d7hbszvwq-as.a.run.app/ |
| Release tag | `v1.0.1-uat` |
| Commit | `0b2cc804f298a28041d9ba9c7ec05d2cf64e4e08` |
| Cloud Run service / revision | `scccd8b05` / `scccd8b05-00009-vvq` |
| Deployed | 23 Nov 2026, 19:56 (Bangkok), deploy run [45178195916](https://github.com/jetanin/LoungCheu/actions/runs/45178195916) |
| Baseline | `v1.0.0-sprint-1` plus the Lab 5 delivery changes. This release adds only CI and Lab 6 documents; the app code is the same as `8fa788b` |

**Check the version before every test session.** Open https://scccd8b05-4d7hbszvwq-as.a.run.app/api/ready. It should show `"status":"ready"`, `"db":"connected"` and `"version":"0b2cc804f298a28041d9ba9c7ec05d2cf64e4e08"`. Write the tested version as `v1.0.1-uat / 0b2cc80` (tag / first 7 characters of `version`) in the results sheet and in every finding you report. If the version is different, stop and tell us, because it means a new release was deployed.

We will not deploy anything during the UAT window without telling you first in the IG group.

## 2. Scope

In scope (Sprint 1, features F-01 to F-05):

- F-01 Log in / log out and roles
- F-02 Organizer creates a DRAFT event, publishes it; everyone browses published events
- F-03 Participant registers (duplicate, deadline and capacity rules)
- F-04 Participant's own registration list and detail
- F-05 Organizer's roster with ACTIVE count

Out of scope (Sprint 2 and 3 work, not delivered in this release): cancel and re-register, close an event (F-06), edit an event or its capacity (F-07), check-in and attendance (F-08), attendance summary (F-09). If you notice that one of these is missing, it is expected and is not a defect. If you think it should exist, report it as a **feature request**.

Criteria that are covered by automated tests rather than manual cases are listed in [uat-cases.md](uat-cases.md#coverage).

## 3. Accounts

| Account label | Role | Display name | Used in |
|---|---|---|---|
| `organizer.a` | ORGANIZER | Organizer A | UAT-01 to UAT-07 |
| `organizer.b` | ORGANIZER | Organizer B | UAT-04 |
| `participant.a` | PARTICIPANT | Participant A | UAT-01, 02, 04, 05, 06 |
| `participant.b` | PARTICIPANT | Participant B | UAT-02, 04 |
| `participant.c` | PARTICIPANT | Participant C | UAT-02, 03 |
| `inactive.x` | PARTICIPANT (deactivated, must not log in) | Inactive X | UAT-06 |

All six accounts use the same password. **It is not written in this repository.** We send it to you by private message on IG. Please do not post it in the group, in GitHub issues or in your report.

## 4. Data setup

- No setup is needed. The accounts above already exist.
- Every case creates its own events. Start each title with `[UAT-xx-<your initials>]`, for example `[UAT-01-NU] Intro to Git`, so your data is easy to find and never mixes with ours.
- Data you will see that is not yours:
  - `[DEMO] ...` events are demo data loaded at deployment (open, full, past deadline, DRAFT, CLOSED and another organizer's event). Do not register for them during the cases; they are not part of any expected result.
  - `[DRY-...]` events are from our own dry run on 23 Nov. `participant.a` and `participant.b` already have registrations for some of them. The cases only look at your own `[UAT-...]` events, so these do not affect the results.
  - Other events may appear in **กิจกรรมทั้งหมด** from other users. Ignore them.
- Run **UAT-01 → UAT-04 → UAT-05** in that order (they share EVENT-01 and REG-01). UAT-02, 03, 06 and 07 can run at any time. UAT-03 needs about 6 minutes of waiting.
- Two testers can run cases at the same time, but do not both use the same participant account on the same event at once, because UAT-02 counts seats.

## 5. Cleanup and reset

- No cleanup is needed. Sprint 1 has no delete function, and the title prefix keeps your events separate.
- We will not reset the production database, because that would erase your evidence. If you need a clean start for a case, create a new event with a new title (for example `[UAT-02-NU-2] Capacity check`) and write that in the "Inputs actually used" column.
- After the final decision we leave the data in place as evidence.

## 6. How to report a finding

1. Open https://github.com/jetanin/LoungCheu/issues/new/choose and pick **UAT finding (Lab 6)**. The form asks for the tested version, case ID, steps, expected and actual result, severity and evidence.
2. Use one issue per finding. Say whether it is a **defect** (the release does not meet the case or acceptance criterion) or a **feature request** (something new that is outside the scope above).
3. Attach screenshots. Do not include the password in any screenshot.
4. Post the issue link in the IG group so we see it quickly.

If you cannot open GitHub issues, send the same fields in the IG group and we will copy them into an issue and reply with the link.

## 7. Schedule (agreed in the IG group)

| When | What |
|---|---|
| Tue 24 Nov, 12:00 | This handoff and the password are sent |
| Wed 25 Nov, 12:00 | UAT Team sends results and findings |
| Wed 25 Nov, 20:00 | Product Team sends triage decisions for every finding |
| Thu 26 Nov | Fixes (if any) deployed with a new tag; UAT Team retests and gives the final decision |

**How to send results:** copy the results sheet at the end of [uat-cases.md](uat-cases.md#results-sheet-uat-team-fills-this-in) into your own document, fill it in, and send it with the evidence files in the IG group by the Wed 25 Nov deadline. Findings go to GitHub issues as in section 6.

Final decision options (given by the UAT Team only): **Accepted**, **Accepted with documented minor limitations**, or **Not Accepted**, with tester names, tested version, date and reason.

## 8. Contacts

| Name | GitHub | Role in this UAT |
|---|---|---|
| Jetanin Naitho | `jetanin` | Product Team, triage and fixes |
| Paphangkorn Luanseng | `i3artuf` | Product Team, UAT cases and handoff |

Questions about a case: ask in the IG group. Please ask rather than guess when an expected result is unclear.
