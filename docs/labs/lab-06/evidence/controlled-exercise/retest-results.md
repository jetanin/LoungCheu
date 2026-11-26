# Independent retest — LAB6-CX-01

| Item | Recorded value |
|---|---|
| Tester | Nantakorn / TH-005_P5 ApprovalFlow |
| Execution window | 26 November 2026, 19:56–20:28 Asia/Bangkok, as reported by the tester |
| Release | `v2.0.1-lab6` / `6f49d327e8e709fc716b9eeb60591ea4fd692fc9` |
| Revision | `scccd8b05-00012-msg` |
| Instructions | [retest-controlled-exercise.md](../../retest-controlled-exercise.md) |
| Retest decision | **PASS**, reported by Nantakorn |
| Acceptance decision | Tester confirms Sprint 1 remains **Accepted** on this revision; this is not independent acceptance of all Sprint 2 features |

## Source and evidence limits

[12-partner-retest-report.txt](12-partner-retest-report.txt) transcribes
Nantakorn's result message posted directly in the IG group **CPE334_Lab**
(**EV-D-03**, original result-chat screenshot). Nantakorn also sent the console
and C1–C3 screenshots in the same group on 26 November 2026 at 20:48
Asia/Bangkok (**EV-D-04**, message carrying the screenshots). Those four original
JPEGs are retained here as images 08–11. The text transcription and the original
chat screenshots are distinct evidence items.

Images 08–11 were copied without resizing, cropping or alteration. Their
SHA-256 values and original attachment filenames are in
[retest-image-map.csv](retest-image-map.csv). The console displays the full
release SHA, the duplicate results, counts and a check time of approximately
20:10 Asia/Bangkok on 26 November; the execution window above comes from the
tester, not from filesystem timestamps. The UI screenshots show local screen
clock times around 20:13–20:16 on the same date.

## Actual results

| Check | Actual observed / reported result | Result | Evidence |
|---|---|---|---|
| B1 version | Console version is `6f49d327e8e709fc716b9eeb60591ea4fd692fc9`, matching the fixed release | PASS | [11: console](11-retest-api-console.jpg) |
| B2 single repeat | `409 ALREADY_REGISTERED` | PASS | [11: console](11-retest-api-console.jpg) |
| B3 concurrent repeats | Both responses are `409 ALREADY_REGISTERED` | PASS | [11: console](11-retest-api-console.jpg) |
| B4 seats unchanged | `seats_before` and `seats_after` both show `active 1 / available 2` | PASS | [11: console](11-retest-api-console.jpg) |
| B5 own ACTIVE count | `my_active_registrations_for_event` is `1` | PASS | [11: console](11-retest-api-console.jpg) |
| C1 public event | Participant A views `[RT-CX-NP] Duplicate retest`, PUBLISHED, available 2/3, ACTIVE 1 | PASS | [08: public event](08-retest-event-seats.jpg) |
| C2 own list | The matching duplicate-retest event appears once, ACTIVE, reference `567e69c3-0d3e-4191-847b-0fbc92f51395`; the browser search shows 1/1 match | PASS | [09: own list](09-retest-own-registration.jpg) |
| C3 owner roster | ACTIVE 1/3; one Participant A row with the same reference as the own list | PASS | [10: roster](10-retest-organizer-roster.jpg) |
| UAT-02 repeat | Nantakorn reports every step PASS for `[UAT-02-RT-NP]`; reports disabled register button after registration and immediate seat updates | PASS (tester report) | [12: partner report](12-partner-retest-report.txt); no separate UAT-02 step screenshots supplied in this set |

The red HTTP 409 entries in DevTools are the expected rejection of duplicate
requests; the console table confirms the `ALREADY_REGISTERED` error code.

## Retained data and review

The tester reports retaining `[RT-CX-NP] Duplicate retest` and
`[UAT-02-RT-NP] Capacity check`. No cleanup, deletion or data reset was performed
by this documentation update. The older `[UAT-02-NP] Capacity check` card visible
in image 09 is not treated as screenshot proof of the newly reported UAT-02
retest.

The report and B/C screenshots are ready for teammate review. UAT-02 is supported
by Nantakorn's result message (EV-D-03); the four images 08–11 support B/C and do
not depict every UAT-02 step. Cite EV-D-03 for the result and acceptance decision
and EV-D-04 for delivery of images 08–11 in the Lab 6/D2 evidence index. PR
review/CI and the Issue #64/#44 closure checklist remain separate actions.
