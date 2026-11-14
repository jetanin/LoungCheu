# Part F — Working Sprint 1 Evidence Register

**Historical Event UI run — 6 พ.ย. 2026:** 145 Vitest / 35 Chromium, typecheck/build/compiled smoke PASS รวม typography/layout/state checks ที่1280/390/320px ดู [current UI evidence](../events/visual-consistency.md) ผล141/32 และ seed follow-up ด้านล่างเป็น historical runs

**Seed follow-up (6 พ.ย.):** full Vitest **145 PASS** รวม seed integration ใหม่4 และ typecheck PASS; 141/32 ใน feature audit ด้านล่างเป็นรอบก่อนเพิ่ม seed โดย Chromium/build ไม่ได้ rerun รอบ seed ดู [latest seed results](../events/demo-seed.md) ไม่มี AC/scope ใหม่

Documentation baseline v0.5 | 5 พฤศจิกายน 2026
**Evidence update — 14 พ.ย. 2026:** PR #7/#10 ได้ teammate review โดย i3artuf และ merge เข้า sprint-1-staging แล้ว ตาม snapshot 12 พ.ย.; PR #10 reviewed head `0bd3468`, merge `97a5b91` (10 พ.ย. 16:26:11 Asia/Bangkok). ผล 159 Vitest / 37 Chromium / typecheck / build / compiled smoke 3 PASS เป็นผลรัน 8 พ.ย. ของ source ที่ commit เป็น `3313288`; รอบแก้เอกสารนี้ไม่ได้รันทดสอบแอปใหม่. OS-process restart, independent clean reproduction/UAT และ reviewed main release ยังขาดหลักฐาน; GAP-02 ยัง OPEN และ Product DoD ยังไม่ครบ. [Review/merge evidence](evidence/review-merge-20261112/README.md). Baseline FR/BR/NFR/AC ไม่เปลี่ยน; F-06–09 อยู่ Sprint 2/3

## 1. Release identification

| รายการ | ค่า |
|---|---|
| Repository | https://github.com/jetanin/LoungCheu |
| Sprint staging | sprint-1-staging (current commit: 97a5b91) |
| GitHub project board URL / captured status/date | https://github.com/users/jetanin/projects/10/views/1 (final board status/date NOT VERIFIED; ต้องแนบ snapshot ก่อนอ้างว่า Done) |
| Documentation history | [Changelog](../changelog.md) |
| Target main release tag/commit | `v1.0.0-sprint-1` เป็น target เท่านั้น; staging candidate `97a5b91`; ยังไม่มี accepted main release/tag |
| Runtime/dependency/DB versions | Node 22.23.2 / PostgreSQL 17.11 (isolated Docker 55433); versions ของ recorded execution 8 พ.ย. ที่ source3313288; source and log hashes in [manifest](../registration/evidence/review-fixes/manifest.json) |
| Environment / execution date / tester | Recorded automated execution: Windows, isolated PostgreSQL 55433, 8 พ.ย. 2026 Asia/Bangkok, source3313288 ตาม manifest/logs; ยังไม่มี independent teammate restart/clean reproduction record |

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


### Actual test excerpts — EV-07 / EV-08

คัดตรงจาก Git commit `331328812092c04db84859c4ca00e9a6aa70b0fe`; recorded execution 8 พ.ย. 2026: full Vitest159 PASS/0 FAIL/0 SKIP ตาม [vitest.log](../registration/evidence/review-fixes/vitest.log). โค้ดด้านล่างเป็น test bodies จริง; imports/fixtures/helpers คงอยู่ใน source file ไม่ใช่ standalone scripts. รอบแก้เอกสารนี้ไม่ได้รัน tests ใหม่.

Domain fixture สร้าง PUBLISHED capacity1 และ race helper ใช้ separate PostgreSQL connections/row-lock barrier; role test ใช้ login/session จริงและ fixture references. error helper ตรวจ status และ exact error envelope.

**AC-17 / BR-05, BR-10** — `server/tests/integration/registration.test.ts` — `allocates exactly one last seat across separate connections (TEST-20)`

```ts
  it('allocates exactly one last seat across separate connections (TEST-20)', async () => {
    const event = await fixture(1);
    let responses: request.Response[] = [];
    await race(event.id, 2, async () => {
      responses = await Promise.all([post(app(a), event.id).send({}), post(app(b, participantB), event.id).send({})]);
    });
    expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(responses.find((r) => r.status === 409)!.body.error.code).toBe('EVENT_FULL');
    const records = await db.registration.findMany({ where: { eventId: event.id } });
    expect(records).toHaveLength(1);
    expect(records[0].id).toBe(responses.find((r) => r.status === 201)!.body.data.id);
  });
```

**AC-19, AC-22, AC-26** — `server/tests/integration/registration-views.test.ts` — `TEST-23/27/32: enforces auth → role → input → ownership without private data`

```ts
it('TEST-23/27/32: enforces auth → role → input → ownership without private data', async () => {
  const pa = await login(participant), oa = await login(owner), ob = await login(otherOwner);
  const ownPaths = ['/api/my/registrations', `/api/my/registrations/${references[0]}`];
  const roster = `/api/organizer/events/${events[0]}/registrations`;
  for (const path of [...ownPaths, roster]) error(await request(runtime.app).get(path), 401, 'AUTH_REQUIRED');
  for (const path of ownPaths) error(await oa.agent.get(path), 403, 'ROLE_FORBIDDEN');
  error(await pa.agent.get(`/api/my/registrations/${references[2]}`), 404, 'REGISTRATION_NOT_FOUND');
  error(await pa.agent.get(`/api/my/registrations/${randomUUID()}`), 404, 'REGISTRATION_NOT_FOUND');
  error(await pa.agent.get('/api/my/registrations/invalid'), 400, 'INVALID_INPUT');
  error(await oa.agent.get('/api/my/registrations/invalid'), 403, 'ROLE_FORBIDDEN');
  error(await ob.agent.get(roster), 404, 'EVENT_NOT_FOUND');
  error(await pa.agent.get(roster), 403, 'ROLE_FORBIDDEN');
  error(await oa.agent.get('/api/organizer/events/invalid/registrations'), 400, 'INVALID_INPUT');
  error(await oa.agent.get(`/api/organizer/events/${randomUUID()}/registrations`), 404, 'EVENT_NOT_FOUND');
});
```

## 4. Issue/PR/integration evidence

ตารางนี้เก็บ 2 implementation Issue/PR chains ที่มี teammate approval และ staging merge snapshots; main release และ final board ยัง NOT VERIFIED

| Field | Chain 1: #3 / F-03 | Chain 2: #4 / F-04–05 |
|---|---|---|
| Requirement / AC / Test | FR-06 / AC-12–17 / TEST-15–21 | FR-07–08 / AC-18–23 / TEST-22–29 |
| Issue | [#3 Registration](https://github.com/jetanin/LoungCheu/issues/3) | [#4 Registration Views](https://github.com/jetanin/LoungCheu/issues/4) |
| Contract/test-design commit / วันที่ | — | — |
| Feature branch จาก sprint-1-staging / author / pair participants | — | feature/registration-views from events@9fcbfc8 (not direct staging); implementation eeafc31; PR author jetanin; pair participants not verified |
| PR เข้า staging / teammate reviewer | [PR #7](https://github.com/jetanin/LoungCheu/pull/7); i3artuf APPROVED 6 พ.ย.22:02:53 Bangkok; reviewed9f8c4e3 | [PR #10](https://github.com/jetanin/LoungCheu/pull/10); i3artuf APPROVED 10 พ.ย.16:25:38 Bangkok; reviewed0bd3468 |
| Specific review finding หรือเหตุผลอนุมัติ / การแก้ / tests | Reviewer ตรวจ authentication/deadline/duplicate/capacity/concurrency/UI errors และระบุ tests passed | Reviewer ตรวจ ownership/minimal fields/roster snapshot/role guards และแก้ account-switch session helper; ระบุ unit/integration/browser journeys passed; รายละเอียดใน JSON snapshots |
| Staging integration checks / merge commit | Merge ada659b0c6889e22e2d4ae8cc84ceb076d4da97e; 6 พ.ย.22:03:06 Bangkok | Merge97a5b9173ec6b0a53a7759f683b440ec49eae396; 10 พ.ย.16:26:11 Bangkok; reviewer reports checks passed; ไม่มีการอ้าง159/37เป็น rerun ที่ merge commit |
| Reviewed release PR เข้า main / release tag/commit | — | Not verified; no release acceptance claimed |

EV-10: ตาราง chains พร้อม readable GitHub/history evidence
EV-11: board URL, captured final status/date และ release reference
EV-10: feature teammate review/staging merge ของสอง chains มี [snapshot evidence](evidence/review-merge-20261112/README.md) แล้ว; main release acceptance ยังไม่มีหลักฐาน. EV-11 final board captured status/date และ release reference ยัง NOT VERIFIED. Snapshotเก่าเก็บเป็น historical records ไม่ใช่ current PR state

## 5. Setup/reproduction — EV-12

| ขั้นตอน | Actual commands / outcome |
|---|---|
| Dependencies/runtime และ safe environment examples | npm workspaces, pinned packages/lockfile; templates คือ server/.env.example และ root .env.test.example; root .env.example ที่ซ้ำลบแล้ว; clean npm ci copy ผ่าน; [README](../../README.md#local-setup--issue-1--f-01) และ pre-PR record |
| Database creation/migrations และ synthetic seed/private demo access | Historical automated execution 8 พ.ย. ใช้ isolated PostgreSQL ที่ 127.0.0.1:55433/loungcheu_test ตาม [manifest](../registration/evidence/review-fixes/manifest.json). Current setup ใช้ `npm run db:migrate`, `npm run db:setup:test`, `npm run db:migrate:test`, `npm run db:seed` ตาม README; เป็นขั้นตอนที่ต้องรัน ไม่ใช่ผล clean reproduction รอบใหม่ |
| Build/run/test และ normal journey | Recorded 8 พ.ย. ที่ source3313288: Vitest159/159 PASS, Playwright37/37 PASS, typecheck/build/smoke3 PASS; ไม่ใช่ rerun ที่ staging97a5b91 หรือ submitted release |
| Teammate clean reproduction: tester/date/commit/result | NOT VERIFIED: ยังไม่มี independent clean reproduction record ที่ผูก tester/date/commit/commands/actual results; TEST-31/35 และ DOD-05 ยัง PARTIAL |

นำขั้นตอนจริงจาก README implementation มาสรุปใน PDF โดยไม่ใส่ secrets

### Setup commands from README

รันที่ repository root หลังติดตั้ง Node22 ตาม engines และเตรียม PostgreSQL/app database, private `server/.env` จาก template พร้อม DATABASE_URL/SESSION_SECRET/APP_ORIGIN/DEMO_SEED_PASSWORD. Test database ต้องแยกจาก app DB. `db:setup:test` ต้องใช้ instance ที่เปิดอยู่และสิทธิ์สร้าง test database หรือเตรียมเองตาม README; ไม่ใช่คำสั่งเปิด PostgreSQL.

```sh
npm ci
npm run db:generate
npm run db:migrate
npm run db:setup:test
npm run db:migrate:test
npm run db:seed
npm run dev
```

```sh
npm run typecheck
npm test
npm run build
npm run test:built
npm run test:e2e
```

รายการนี้เป็นขั้นตอนจาก README/package.json ไม่ใช่หลักฐาน clean reproduction ที่รันผ่านรอบนี้; TEST-31/35 ยังต้องมี tester/date/revision/actual results. เก็บ credentials เป็น private environment/handoff ไม่ใส่ในรายงาน.

## 6. Contributions / AI use

| สมาชิก | Design/implementation/tests/review/integration ที่ทำจริง (ตาม Git history) | Evidence |
|---|---|---|
| M1: Jetanin Naitho 67070501011 | Registration (#3), own registrations/roster (#4); review of peer features recorded in Part F | PR #7/#10 author jetanin; teammate review by i3artuf; retained review snapshots |
| M2: Paphangkorn Luanseng 67070501083 | Authentication (#1), Event Management (#2); teammate review of #3/#4 | PR #7/#10 substantive reviews by i3artuf; reviewed source and timestamps in snapshots |

AI ใช้ Codex ช่วย implementation/tests/audit, แก้ review findings, รัน checks และจัดเอกสาร/หลักฐานตาม work records และ [Changelog](../changelog.md). ทีมรับผิดชอบเข้าใจ code/tests และตรวจรับผ่าน substantive teammate review: i3artuf ตรวจ PR #7/#10 ตามกฎ/ownership/transactions/assertions พร้อมเหตุผลอนุมัติใน snapshots. ผล159/37 เป็น automated execution ที่ recorded source3313288; ไม่ใช่ independent clean reproduction/UAT และไม่แทน release acceptance

## 7. Remaining work / limitations

| ID | สถานะ | รายละเอียด |
|---|---|---|
| GAP-01 | CLOSED for implementation/feature review/staging merge: F-04/F-05 implemented; PR #10 reviewed at0bd3468 and merged97a5b91 | Review/merge snapshots bind approved source; release acceptance tracked in GAP-03; no new execution claimed |
| GAP-02 | OPEN: automated own-list/roster journey and app recreation PASS; OS-process restart and independent clean reproduction/UAT missing; DOD-05 PARTIAL | Capture actual tester/date/tested revision/commands and persisted reference/status/count across process restart and independent clean setup; do not close from app recreation or AI execution |
| GAP-03 | PARTIAL: PR #7/#10 approved and merged staging; reviewed main release and release-linked acceptance evidence missing | Review/test submitted release and retain release PR/commit/results; no inferred board state or release PASS |
| GAP-04 | Final metadata/review/contribution verification และ release reference | สมาชิกตรวจข้อมูลและเติมตามงานจริง |
| GAP-05 | Self-contained PDF / page numbers | ประกอบหลังมีหลักฐาน |

เมื่อมี execution failures ให้เพิ่ม defect/failed/skipped records พร้อมผลกระทบและ next action
