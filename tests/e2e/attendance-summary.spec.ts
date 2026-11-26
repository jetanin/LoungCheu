import { test, expect, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { createDatabaseClient } from '../../server/src/db/client.js';
import { readTestDatabaseUrl } from '../../server/src/config/database-url.js';

// F-09 TEST-64 / AC-50 (E2E part, Chromium, real server and DB).
// The F-08 check-in endpoint and UI do not exist yet, so the "check in another participant" step
// writes the same columns F-08 writes (checked_in_at, checked_in_by_id = owner). Replace that step
// with the real check-in UI once F-08 lands.
async function login(page: Page, username: string) {
  await page.goto('/login');
  await page.getByLabel('ชื่อผู้ใช้').fill(username);
  await page.getByLabel('รหัสผ่าน', { exact: true }).fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
  await expect(page).toHaveURL(/\/events$/);
}
const tile = (page: Page, label: string) => page.locator('.summary-item').filter({ has: page.getByText(label, { exact: true }) }).locator('dd');

test('TEST-64: owner opens ดูสรุปผล, sees DB-matching values, refreshes after a check-in; participant is refused', async ({ page, browser }) => {
  test.setTimeout(60_000);
  page.setDefaultTimeout(10_000);
  const db = createDatabaseClient(readTestDatabaseUrl(process.env.TEST_DATABASE_URL));
  const eventId = randomUUID();
  const participantContext = await browser.newContext();
  try {
    const user = async (username: string) => (await db.user.findUniqueOrThrow({ where: { username } })).id;
    const [oa, pa, pb, pc] = await Promise.all(['organizer.a', 'participant.a', 'participant.b', 'participant.c'].map(user));
    const before = new Date(Date.now() - 60_000);
    await db.event.create({ data: { id: eventId, organizerId: oa, title: `F09 summary E2E ${Date.now()}`, description: 'TEST-64 synthetic',
      location: 'KMUTT', capacity: 5, status: 'PUBLISHED', registrationClosesAt: new Date('2099-01-01T02:00:00.000Z'),
      startsAt: new Date('2099-01-01T03:00:00.000Z'), endsAt: new Date('2099-01-01T05:00:00.000Z'), createdAt: before, updatedAt: before } });
    for (const [participantId, status, checked] of [[pa, 'ACTIVE', true], [pb, 'ACTIVE', false], [pc, 'CANCELLED', false]] as const) {
      await db.registration.create({ data: { eventId, participantId, status, registeredAt: before,
        cancelledAt: status === 'CANCELLED' ? before : null, ...(checked ? { checkedInAt: before, checkedInById: oa } : {}),
        history: { create: [{ actorId: participantId, action: 'REGISTERED', occurredAt: before },
          ...(status === 'CANCELLED' ? [{ actorId: participantId, action: 'CANCELLED' as const, occurredAt: before }] : [])] } } });
    }

    await login(page, 'organizer.a');
    await page.goto(`/organizer/events/${eventId}`);
    await page.getByRole('link', { name: 'ดูสรุปผล', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/organizer/events/${eventId}/summary$`));
    await expect(page.getByRole('heading', { name: 'สรุปผลการเข้าร่วม' })).toBeVisible();
    await expect(tile(page, 'ลงทะเบียนอยู่ (ACTIVE)')).toHaveText('2');
    await expect(tile(page, 'ยกเลิก (CANCELLED)')).toHaveText('1');
    await expect(tile(page, 'เช็กชื่อแล้ว')).toHaveText('1');
    await expect(tile(page, 'อัตราเข้าร่วม')).toHaveText('50.00%');
    await expect(page.getByText('เช็กชื่อแล้ว 1 จาก ACTIVE 2 คน', { exact: true })).toBeVisible();
    await expect(page.getByText(/^ข้อมูล ณ /)).toBeVisible();
    // The page shows exactly what the API returns.
    const api = (await (await page.request.get(`/api/organizer/events/${eventId}/summary`)).json()).data;
    expect(api).toMatchObject({ active_count: 2, cancelled_count: 1, checked_in_count: 1, attendance_rate: '50.00' });

    // Another participant is checked in (F-08 columns), then the owner refreshes the summary.
    await db.registration.updateMany({ where: { eventId, participantId: pb }, data: { checkedInAt: new Date(), checkedInById: oa } });
    await expect(tile(page, 'เช็กชื่อแล้ว')).toHaveText('1'); // no auto-refresh
    await page.getByRole('button', { name: 'รีเฟรชสรุป', exact: true }).click();
    await expect(tile(page, 'เช็กชื่อแล้ว')).toHaveText('2');
    await expect(tile(page, 'อัตราเข้าร่วม')).toHaveText('100.00%');
    await expect(page.getByText('เช็กชื่อแล้ว 2 จาก ACTIVE 2 คน', { exact: true })).toBeVisible();

    await page.getByRole('link', { name: 'กลับรายละเอียดกิจกรรม', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/organizer/events/${eventId}$`));

    // A participant opening the summary URL gets no values; the API refuses with 403.
    const participant = await participantContext.newPage();
    participant.setDefaultTimeout(10_000);
    await login(participant, 'participant.a');
    await participant.goto(`/organizer/events/${eventId}/summary`);
    await expect(participant.getByRole('alert')).toContainText('เฉพาะผู้จัดกิจกรรม');
    await expect(participant.locator('.summary-item')).toHaveCount(0);
    expect((await participant.request.get(`/api/organizer/events/${eventId}/summary`)).status()).toBe(403);
  } finally {
    await db.registrationHistory.deleteMany({ where: { registration: { eventId } } });
    await db.registration.deleteMany({ where: { eventId } });
    await db.event.deleteMany({ where: { id: eventId } });
    await Promise.all([participantContext.close(), db.$disconnect()]);
  }
});
