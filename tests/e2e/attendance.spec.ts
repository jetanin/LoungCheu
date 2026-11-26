import { randomUUID } from 'node:crypto';
import { test, expect, type Page } from '@playwright/test';
import { createDatabaseClient } from '../../server/src/db/client.js';
import { readTestDatabaseUrl } from '../../server/src/config/database-url.js';
import { bangkokTime } from '../../client/src/features/events/model.js';

test.use({ screenshot: 'only-on-failure' });

async function login(page: Page, username: string) {
  await page.goto('/login');
  await page.getByLabel('ชื่อผู้ใช้').fill(username);
  await page.getByLabel('รหัสผ่าน', { exact: true }).fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
  await expect(page).toHaveURL(/\/events$/);
}

test('TEST-59: real check-in confirmation/cancel, roster reload and own attendance survive logout/login', async ({ page, browser }) => {
  test.setTimeout(60_000);
  const db = createDatabaseClient(readTestDatabaseUrl(process.env.TEST_DATABASE_URL), 1);
  const participantContext = await browser.newContext(), participant = await participantContext.newPage();
  const eventId = randomUUID(), reference = randomUUID(), title = `F08 attendance ${Date.now()}`;
  let created = false, mutations = 0;
  const snapshot = async () => ({
    event: await db.event.findUniqueOrThrow({ where: { id: eventId } }),
    records: await db.registration.findMany({ where: { eventId }, orderBy: { id: 'asc' } }),
    history: await db.registrationHistory.findMany({ where: { registration: { eventId } }, orderBy: { id: 'asc' } }),
  });
  page.on('request', req => { if (req.method() === 'POST' && req.url().endsWith(`/registrations/${reference}/check-in`)) mutations++; });
  try {
    expect(await db.$queryRaw`SELECT current_database() AS name`).toEqual([{ name: 'loungcheu_test' }]);
    const [oa, pa, pb, pc] = await Promise.all(['organizer.a', 'participant.a', 'participant.b', 'participant.c']
      .map(username => db.user.findUniqueOrThrow({ where: { username } })));
    // Synthetic in-progress fixture; the mutation and all observed UI reads use
    // real HTTP/DB. No response routing or browser clock override is used.
    const t0 = Date.now() - 3 * 3_600_000;
    await db.event.create({ data: { id: eventId, organizerId: oa.id, title, description: 'TEST-59 real attendance UI',
      location: 'Synthetic room', capacity: 5, status: 'PUBLISHED', createdAt: new Date(t0), updatedAt: new Date(t0),
      registrationClosesAt: new Date(t0 + 3_600_000), startsAt: new Date(t0 + 2 * 3_600_000), endsAt: new Date(t0 + 4 * 3_600_000) } });
    created = true;
    for (const account of [pa, pb, pc]) {
      const cancelled = account.id === pc.id;
      await db.registration.create({ data: { ...(account.id === pa.id ? { id: reference } : {}), eventId, participantId: account.id,
        status: cancelled ? 'CANCELLED' : 'ACTIVE', registeredAt: new Date(t0), cancelledAt: cancelled ? new Date(t0 + 30 * 60_000) : null,
        history: { create: [ { actorId: account.id, action: 'REGISTERED', occurredAt: new Date(t0) },
          ...(cancelled ? [{ actorId: account.id, action: 'CANCELLED' as const, occurredAt: new Date(t0 + 30 * 60_000) }] : []) ] } } });
    }
    const before = await snapshot();
    await login(page, 'organizer.a'); await login(participant, 'participant.a');
    const apiRoster = await page.request.get(`/api/organizer/events/${eventId}/registrations`);
    expect(apiRoster.status()).toBe(200); expect((await apiRoster.json()).data.checked_in_count).toBe(0);
    await page.goto(`/organizer/events/${eventId}/registrations`);
    const row = page.getByRole('row').filter({ has: page.getByRole('cell', { name: reference, exact: true }) });
    await expect(row.getByRole('cell', { name: pa.displayName, exact: true })).toBeVisible();
    const action = row.getByRole('button', { name: 'เช็กชื่อ', exact: true });
    await expect(action).toBeVisible(); // RED: baseline roster has no attendance action.

    async function confirm(accept: boolean) {
      let message = '';
      page.once('dialog', async dialog => {
        message = dialog.message(); expect(dialog.type()).toBe('confirm');
        if (accept) await dialog.accept(); else await dialog.dismiss();
      });
      await action.click(); expect(message).toBe(`ยืนยันเช็กชื่อ ${pa.displayName}?`);
    }
    await confirm(false);
    expect(mutations).toBe(0); expect(await snapshot()).toEqual(before);
    const pending = page.waitForResponse(response => response.request().method() === 'POST'
      && response.url().endsWith(`/registrations/${reference}/check-in`));
    await confirm(true);
    const checked = await pending; expect(checked.status()).toBe(200);
    const stamp = (await checked.json()).data.checked_in_at as string;
    expect(mutations).toBe(1);
    await expect(row).toContainText(`เช็กชื่อแล้ว ${bangkokTime(stamp)}`);
    await expect(action).toHaveCount(0);
    await expect(page.getByText('เช็กชื่อแล้ว 1 / ACTIVE 2 คน', { exact: true })).toBeVisible();
    await page.reload();
    await expect(row).toContainText(`เช็กชื่อแล้ว ${bangkokTime(stamp)}`);
    await page.screenshot({ path: '.local/verification/f08-browser-roster.png', fullPage: true });
    await participant.goto(`/my/registrations/${reference}`);
    await expect(participant.getByText(`เช็กชื่อแล้วเมื่อ ${bangkokTime(stamp)}`, { exact: true })).toBeVisible();
    await participant.getByRole('button', { name: 'ออกจากระบบ', exact: true }).click();
    await expect(participant).toHaveURL(/\/login$/);
    await login(participant, 'participant.a'); await participant.goto('/my/registrations');
    const card = participant.getByRole('article').filter({ has: participant.getByRole('link', { name: title, exact: true }) });
    await expect(card).toContainText(`เช็กชื่อแล้วเมื่อ ${bangkokTime(stamp)}`);
    await card.getByRole('link', { name: title, exact: true }).click();
    await participant.reload();
    await expect(participant.getByText(`เช็กชื่อแล้วเมื่อ ${bangkokTime(stamp)}`, { exact: true })).toBeVisible();
    await participant.screenshot({ path: '.local/verification/f08-browser-own-detail.png', fullPage: true });
    const after = await snapshot();
    expect(after.event).toEqual(before.event); expect(after.history).toEqual(before.history);
    expect(after.records).toEqual(before.records.map(record => record.id === reference
      ? { ...record, checkedInAt: new Date(stamp), checkedInById: oa.id } : record));
    expect(mutations).toBe(1);
    console.info('F08_BROWSER', JSON.stringify({ result: 'verified', mutationCount: mutations, activeCount: 2, checkedInCount: 1,
      timestamp: stamp, reloadedRoster: true, freshParticipantLogin: true, ownListAndDetail: true, historyUnchanged: true }));
  } finally {
    try {
      await participantContext.close();
      if (created) await db.$transaction(async tx => {
        await tx.registrationHistory.deleteMany({ where: { registration: { eventId } } });
        await tx.registration.deleteMany({ where: { eventId } }); await tx.event.delete({ where: { id: eventId } });
      });
    } finally { await db.$disconnect(); }
  }
});
