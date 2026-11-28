import { test, expect, type Browser, type Page } from '@playwright/test';
import { config } from 'dotenv';
import { randomUUID } from 'node:crypto';
import { createDatabaseClient } from '../../server/src/db/client.js';
import { readTestDatabaseUrl } from '../../server/src/config/database-url.js';
import { fillEventTime } from './event-form.js';

// F-07 Edit event — Sprint 2 STS TEST-52 (E2E, Chromium), AC-40.
config({ path: '.env.test', quiet: true });

async function login(page: Page, username: string) {
  await page.goto('/login');
  await page.getByLabel('ชื่อผู้ใช้').fill(username);
  await page.getByLabel('รหัสผ่าน', { exact: true }).fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
  await expect(page).toHaveURL(/\/events$/);
}
// A Participant in a separate browser context registers through the real API.
async function register(browser: Browser, username: string, eventId: string) {
  const context = await browser.newContext(), page = await context.newPage();
  await login(page, username);
  const token = (await (await page.request.get('/api/auth/csrf')).json()).data.csrf_token as string;
  const response = await page.request.post(`/api/events/${eventId}/registrations`, { headers: { 'X-CSRF-Token': token }, data: {} });
  expect(response.status()).toBe(201);
  return page;
}

test('CR-01 TEST-52 edits capacity on a real legacy short-title event without revalidating title', async ({ page }) => {
  const db = createDatabaseClient(readTestDatabaseUrl(process.env.TEST_DATABASE_URL));
  const eventId = randomUUID();
  let created = false;
  try {
    expect(await db.$queryRaw`SELECT current_database() AS name`).toEqual([{ name: 'loungcheu_test' }]);
    const owner = await db.user.findUniqueOrThrow({ where: { username: 'organizer.a' } });
    // Direct DB fixture models a Sprint 1 event that the new create API cannot produce.
    await db.event.create({ data: { id: eventId, organizerId: owner.id, title: 'ab', description: 'Legacy title fixture',
      location: 'KMUTT', capacity: 3, status: 'DRAFT', registrationClosesAt: new Date('2099-05-01T02:00:00Z'),
      startsAt: new Date('2099-05-01T03:00:00Z'), endsAt: new Date('2099-05-01T05:00:00Z') } });
    created = true;

    await login(page, 'organizer.a');
    await page.goto(`/organizer/events/${eventId}/edit`);
    await expect(page.getByLabel('ชื่อกิจกรรม', { exact: true })).toHaveValue('ab');
    await page.getByLabel('จำนวนที่นั่ง', { exact: true }).fill('4');
    const patch = page.waitForRequest(request => request.url().endsWith(`/api/organizer/events/${eventId}`) && request.method() === 'PATCH');
    const response = page.waitForResponse(reply => reply.url().endsWith(`/api/organizer/events/${eventId}`) && reply.request().method() === 'PATCH');
    await page.getByRole('button', { name: 'บันทึกการแก้ไข' }).click();
    expect((await patch).postDataJSON()).toEqual({ capacity: 4 });
    expect((await response).status()).toBe(200);
    await expect(page).toHaveURL(new RegExp(`/organizer/events/${eventId}$`));
    await page.reload();
    await expect(page.getByRole('heading', { name: 'ab' })).toBeVisible();
    const read = await page.request.get(`/api/organizer/events/${eventId}`);
    expect(read.status()).toBe(200);
    expect((await read.json()).data).toMatchObject({ title: 'ab', capacity: 4 });
    expect(await db.event.findUniqueOrThrow({ where: { id: eventId }, select: { title: true, capacity: true } })).toEqual({ title: 'ab', capacity: 4 });
  } finally {
    if (created) await db.event.delete({ where: { id: eventId } });
    await db.$disconnect();
  }
});

test('TEST-52 / AC-40 Organizer edits DRAFT and PUBLISHED events; CLOSED has no edit', async ({ page, browser }) => {
  await login(page, 'organizer.a');
  await page.goto('/organizer/events/new');
  const title = `F-07 edit ${Date.now()}`;
  for (const [label, value] of [['ชื่อกิจกรรม', title], ['รายละเอียด', 'ทดสอบแก้ไขกิจกรรม'], ['สถานที่', 'บางมด'], ['จำนวนที่นั่ง', '3']]) {
    await page.getByLabel(label, { exact: true }).fill(value);
  }
  await fillEventTime(page, 'ปิดรับลงทะเบียน', '2099-03-01T09:00');
  await fillEventTime(page, 'เริ่มกิจกรรม', '2099-03-01T10:00');
  await fillEventTime(page, 'สิ้นสุดกิจกรรม', '2099-03-01T12:00');
  await page.getByRole('button', { name: 'บันทึก DRAFT' }).click();
  await expect(page).toHaveURL(/\/organizer\/events\/[0-9a-f-]{36}$/);
  const eventId = new URL(page.url()).pathname.split('/').pop()!;
  const save = page.getByRole('button', { name: 'บันทึกการแก้ไข' });

  // DRAFT: every field editable, form prefilled, save disabled until a change.
  await expect(page.getByRole('link', { name: 'แก้ไขกิจกรรม' })).toBeVisible();
  await page.getByRole('link', { name: 'แก้ไขกิจกรรม' }).click();
  await expect(page).toHaveURL(new RegExp(`/organizer/events/${eventId}/edit$`));
  await expect(page.getByLabel('ชื่อกิจกรรม', { exact: true })).toHaveValue(title);
  await expect(page.getByLabel('จำนวนที่นั่ง', { exact: true })).toHaveValue('3');
  await expect(page.getByLabel('เวลาเริ่มกิจกรรม', { exact: true })).toHaveValue('10:00');
  await expect(save).toBeDisabled();
  await page.getByLabel('ชื่อกิจกรรม', { exact: true }).fill(`${title} แก้แล้ว`);
  await fillEventTime(page, 'สิ้นสุดกิจกรรม', '2099-03-01T13:00');
  await save.click();
  await expect(page).toHaveURL(new RegExp(`/organizer/events/${eventId}$`));
  await expect(page.getByText('บันทึกการแก้ไขแล้ว')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: `${title} แก้แล้ว` })).toBeVisible();
  await expect(page.locator('.event-details dd').nth(2)).toContainText('13:00:00');

  // PUBLISHED with ACTIVE >= 1: time fields disabled; capacity floor explained.
  await page.getByRole('button', { name: 'เผยแพร่กิจกรรม' }).click();
  await expect(page.locator('.event-detail .event-status')).toHaveText('PUBLISHED');
  const participantA = await register(browser, 'participant.a', eventId);
  await page.goto(`/organizer/events/${eventId}/edit`);
  await expect(page.getByText('เผยแพร่แล้ว แก้เวลาไม่ได้')).toBeVisible();
  for (const label of ['เริ่มกิจกรรม', 'สิ้นสุดกิจกรรม', 'ปิดรับลงทะเบียน']) {
    await expect(page.getByLabel(`วันที่${label}`, { exact: true })).toBeDisabled();
    await expect(page.getByLabel(`เวลา${label}`, { exact: true })).toBeDisabled();
  }
  await expect(page.getByText('มีผู้ลงทะเบียน ACTIVE 1 คน ตั้งได้ไม่ต่ำกว่า 1')).toBeVisible();

  // Another Participant registers while the form is open: capacity 1 is now below ACTIVE.
  await (await register(browser, 'participant.b', eventId)).context().close();
  const capacity = page.getByLabel('จำนวนที่นั่ง', { exact: true });
  await capacity.fill('1');
  await save.click();
  await expect(page.getByRole('alert')).toContainText('จำนวนที่นั่งต้องไม่น้อยกว่าผู้ลงทะเบียน ACTIVE ปัจจุบัน (2 คน)');
  await expect(page.getByText('มีผู้ลงทะเบียน ACTIVE 2 คน ตั้งได้ไม่ต่ำกว่า 2')).toBeVisible();
  await expect(capacity).toHaveValue('1');

  // Correct the value and save; owner and shared pages show it after reload.
  await capacity.fill('5');
  await page.getByLabel('สถานที่', { exact: true }).fill('ห้องประชุมใหม่');
  await save.click();
  await expect(page).toHaveURL(new RegExp(`/organizer/events/${eventId}$`));
  await page.reload();
  await expect(page.getByText('ว่าง 3 / 5 ที่นั่ง')).toBeVisible();
  await expect(page.locator('.event-details dd').first()).toHaveText('ห้องประชุมใหม่');
  await participantA.goto(`/events/${eventId}`);
  await expect(participantA.getByRole('heading', { name: `${title} แก้แล้ว` })).toBeVisible();
  await expect(participantA.getByText('ว่าง 3 / 5 ที่นั่ง')).toBeVisible();
  await expect(participantA.locator('.event-details dd').first()).toHaveText('ห้องประชุมใหม่');

  // F-06 × F-07: the owner closes this same event through the real F-06 UI; then there is no edit
  // button, the edit URL does not offer a form, and the edited values survive the close.
  await page.goto(`/organizer/events/${eventId}`);
  const dialog = page.waitForEvent('dialog');
  const clicked = page.getByRole('button', { name: 'ปิดรับกิจกรรม', exact: true }).click();
  await (await dialog).accept();
  await clicked;
  await expect(page.locator('.event-detail .event-status')).toHaveText('CLOSED');
  await page.reload();
  await expect(page.locator('.event-detail .event-status')).toHaveText('CLOSED');
  await expect(page.getByRole('link', { name: 'แก้ไขกิจกรรม' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: `${title} แก้แล้ว` })).toBeVisible();
  await expect(page.locator('.event-details dd').first()).toHaveText('ห้องประชุมใหม่');
  await page.goto(`/organizer/events/${eventId}/edit`);
  await expect(page.getByText('กิจกรรมนี้ปิดแล้ว แก้ไขไม่ได้')).toBeVisible();
  await expect(save).toHaveCount(0);
  await participantA.context().close();
});
