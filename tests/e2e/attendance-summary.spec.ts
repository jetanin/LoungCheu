import { test, expect, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { createDatabaseClient } from '../../server/src/db/client.js';
import { readTestDatabaseUrl } from '../../server/src/config/database-url.js';

// F-09 TEST-64 / AC-50 (E2E part, Chromium, real server and DB).
// The event is in progress (starts 1 h ago, ends in 1 h on the real server clock), so the owner
// checks in another participant through the real F-08 roster UI (PR #79) in a second tab.
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
    const now = Date.now(), before = new Date(now - 3 * 3_600_000);
    await db.event.create({ data: { id: eventId, organizerId: oa, title: `F09 summary E2E ${now}`, description: 'TEST-64 synthetic',
      location: 'KMUTT', capacity: 5, status: 'PUBLISHED', registrationClosesAt: new Date(now - 2 * 3_600_000),
      startsAt: new Date(now - 3_600_000), endsAt: new Date(now + 3_600_000), createdAt: before, updatedAt: before } });
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

    // The owner checks in Participant B on the roster (real F-08 UI and API) in a second tab.
    const roster = await page.context().newPage();
    roster.setDefaultTimeout(10_000);
    await roster.goto(`/organizer/events/${eventId}/registrations`);
    const row = roster.getByRole('row').filter({ has: roster.getByRole('cell', { name: 'Participant B', exact: true }) });
    roster.once('dialog', dialog => void dialog.accept());
    await row.getByRole('button', { name: 'เช็กชื่อ', exact: true }).click();
    await expect(row).toContainText('เช็กชื่อแล้ว');
    const stored = await db.registration.findFirstOrThrow({ where: { eventId, participantId: pb } });
    expect(stored.checkedInById).toBe(oa);
    await roster.close();
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
