import { test, expect, type Page } from '@playwright/test';
import { createDatabaseClient } from '../../server/src/db/client.js';
import { readTestDatabaseUrl } from '../../server/src/config/database-url.js';
import { bangkokTime } from '../../client/src/features/events/model.js';
import { fillEventTime } from './event-form.js';

async function login(page: Page, username: string) {
  await page.goto('/login');
  await page.getByLabel('ชื่อผู้ใช้').fill(username);
  await page.getByLabel('รหัสผ่าน', { exact: true }).fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
  await expect(page).toHaveURL(/\/events$/);
}

async function own(page: Page, reference: string) {
  const response = await page.request.get(`/api/my/registrations/${reference}`);
  expect(response.status()).toBe(200);
  return (await response.json()).data;
}

async function confirmAction(page: Page, label: string, accept: boolean) {
  const dialog = page.waitForEvent('dialog');
  const clicked = page.getByRole('button', { name: label, exact: true }).click();
  const confirmation = await dialog;
  expect(confirmation.type()).toBe('confirm');
  expect(confirmation.message()).toContain('ยืนยัน');
  if (accept) await confirmation.accept(); else await confirmation.dismiss();
  await clicked;
}

test('TEST-43: real cancel/re-login/full/reactivate/roster/close journey preserves identity and history', async ({ page, browser }) => {
  test.setTimeout(90_000);
  page.setDefaultTimeout(10_000);
  const db = createDatabaseClient(readTestDatabaseUrl(process.env.TEST_DATABASE_URL));
  const aContext = await browser.newContext(), bContext = await browser.newContext();
  const a = await aContext.newPage(), b = await bContext.newPage();
  a.setDefaultTimeout(10_000); b.setDefaultTimeout(10_000);
  let cancelRequests = 0, closeRequests = 0;
  a.on('request', request => {
    if (request.method() === 'POST' && request.url().endsWith('/cancel')) cancelRequests++;
  });
  page.on('request', request => {
    if (request.method() === 'POST' && request.url().endsWith('/close')) closeRequests++;
  });
  try {
    await login(page, 'organizer.a');
    await page.goto('/organizer/events/new');
    const title = `F06 browser lifecycle ${Date.now()}`;
    for (const [label, value] of [['ชื่อกิจกรรม', title], ['รายละเอียด', 'TEST-43 real lifecycle'], ['สถานที่', 'Bangkok'], ['จำนวนที่นั่ง', '1']]) {
      await page.getByLabel(label, { exact: true }).fill(value);
    }
    await fillEventTime(page, 'ปิดรับลงทะเบียน', '2099-01-01T09:00');
    await fillEventTime(page, 'เริ่มกิจกรรม', '2099-01-01T10:00');
    await fillEventTime(page, 'สิ้นสุดกิจกรรม', '2099-01-01T11:00');
    await page.getByRole('button', { name: 'บันทึก DRAFT', exact: true }).click();
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    const eventId = page.url().split('/').pop()!;
    await page.getByRole('button', { name: 'เผยแพร่กิจกรรม', exact: true }).click();
    await expect(page.getByText('PUBLISHED', { exact: true })).toBeVisible();

    await login(a, 'participant.a'); await login(b, 'participant.b');
    await a.goto(`/events/${eventId}`);
    const registered = a.waitForResponse(response => response.url().endsWith(`/events/${eventId}/registrations`) && response.request().method() === 'POST');
    await a.getByRole('button', { name: 'ลงทะเบียน', exact: true }).click();
    expect((await registered).status()).toBe(201);
    const success = a.getByRole('status').filter({ hasText: 'ลงทะเบียนสำเร็จ' });
    await expect(success).toBeVisible();
    const reference = await success.locator('strong').innerText();
    const first = await own(a, reference);
    await a.goto(`/my/registrations/${reference}`);
    await expect(a.getByText('ACTIVE', { exact: true })).toBeVisible();
    const firstTime = () => a.locator('dt').filter({ hasText: /^ลงทะเบียนครั้งแรกเมื่อ$/ }).locator('+ dd');
    await expect(firstTime()).toHaveText(bangkokTime(first.registered_at));
    await confirmAction(a, 'ยกเลิกการลงทะเบียน', false);
    expect(cancelRequests).toBe(0);
    expect((await own(a, reference)).status).toBe('ACTIVE');
    await confirmAction(a, 'ยกเลิกการลงทะเบียน', true);
    await expect(a.getByText('CANCELLED', { exact: true })).toBeVisible();
    expect(cancelRequests).toBe(1);
    const cancelled = await own(a, reference);
    expect(cancelled).toMatchObject({ id: reference, status: 'CANCELLED', registered_at: first.registered_at });
    expect(cancelled.cancelled_at).toMatch(/^\d{4}-/);
    await expect(a.locator('dt').filter({ hasText: /^ยกเลิกเมื่อ$/ }).locator('+ dd')).toHaveText(bangkokTime(cancelled.cancelled_at));
    await a.setViewportSize({ width: 390, height: 844 });
    await a.screenshot({ path: '.local/verification/f06-browser-cancelled-mobile.png', fullPage: true });
    console.log('F06_BROWSER cancelled and screenshot saved');
    await a.reload();
    await expect(a.getByText('CANCELLED', { exact: true })).toBeVisible();
    const loggedOut = a.waitForResponse(response => response.url().endsWith('/api/auth/logout') && response.request().method() === 'POST');
    await a.getByRole('button', { name: 'ออกจากระบบ', exact: true }).click();
    expect((await loggedOut).status()).toBe(204);
    await expect(a).toHaveURL(/\/login$/);
    expect((await a.request.get('/api/auth/me')).status()).toBe(401);
    await login(a, 'participant.a');
    await a.goto('/my/registrations');
    await a.getByRole('link', { name: title, exact: true }).click();
    await expect(a).toHaveURL(new RegExp(`/my/registrations/${reference}$`));
    await expect(a.getByText('CANCELLED', { exact: true })).toBeVisible();
    await expect(firstTime()).toHaveText(bangkokTime(first.registered_at));
    console.log('F06_BROWSER re-login preserved cancelled registration');

    // B takes precisely the seat A returned. A's cancelled record must not be
    // treated as a first registration, or offer reactivation while full.
    await b.goto(`/events/${eventId}`);
    await expect(b.getByText('ว่าง 1 / 1 ที่นั่ง', { exact: true })).toBeVisible();
    await b.getByRole('button', { name: 'ลงทะเบียน', exact: true }).click();
    const bSuccess = b.getByRole('status').filter({ hasText: 'ลงทะเบียนสำเร็จ' });
    await expect(bSuccess).toBeVisible();
    const bReference = await bSuccess.locator('strong').innerText();
    await a.goto(`/events/${eventId}`);
    await expect(a.getByText('คุณยกเลิกการลงทะเบียนแล้ว ขณะนี้กิจกรรมเต็ม', { exact: true })).toBeVisible();
    await expect(a.getByRole('button', { name: 'ลงทะเบียนใหม่', exact: true })).toHaveCount(0);
    await b.goto(`/my/registrations/${bReference}`);
    await confirmAction(b, 'ยกเลิกการลงทะเบียน', true);
    await expect(b.getByText('CANCELLED', { exact: true })).toBeVisible();
    console.log('F06_BROWSER second participant returned seat');
    await a.getByRole('button', { name: 'รีเฟรชที่นั่ง', exact: true }).click();
    const reactivated = a.waitForResponse(response => response.url().endsWith(`/events/${eventId}/registrations`) && response.request().method() === 'POST');
    await a.getByRole('button', { name: 'ลงทะเบียนใหม่', exact: true }).click();
    expect((await reactivated).status()).toBe(200);
    await expect(a.getByRole('status').filter({ hasText: 'ลงทะเบียนสำเร็จ' })).toContainText(reference);
    expect(await own(a, reference)).toMatchObject({ id: reference, status: 'ACTIVE', registered_at: first.registered_at, cancelled_at: null });
    await a.goto(`/my/registrations/${reference}`);
    await expect(firstTime()).toHaveText(bangkokTime(first.registered_at));
    await expect(a.getByText('ยกเลิกเมื่อ', { exact: true })).toHaveCount(0);
    console.log('F06_BROWSER reactivated original reference');

    await page.getByRole('link', { name: 'ดูรายชื่อผู้ลงทะเบียน', exact: true }).click();
    await expect(page.getByRole('columnheader', { name: 'ลงทะเบียนครั้งแรกเมื่อ' })).toBeVisible();
    await expect(page.getByRole('row')).toHaveCount(3);
    const row = page.getByRole('row').filter({ has: page.getByRole('cell', { name: reference, exact: true }) });
    await expect(row).toContainText('ACTIVE');
    await expect(row).toContainText(bangkokTime(first.registered_at));
    await page.getByRole('link', { name: 'กลับรายละเอียดกิจกรรม', exact: true }).click();
    await confirmAction(page, 'ปิดรับกิจกรรม', false);
    expect(closeRequests).toBe(0);
    await expect(page.getByText('PUBLISHED', { exact: true })).toBeVisible();
    await confirmAction(page, 'ปิดรับกิจกรรม', true);
    await expect(page.getByText('CLOSED', { exact: true })).toBeVisible();
    expect(closeRequests).toBe(1);
    await expect(page.getByRole('button', { name: 'ปิดรับกิจกรรม', exact: true })).toHaveCount(0);
    await page.reload();
    await expect(page.getByText('CLOSED', { exact: true })).toBeVisible();
    await a.reload();
    await expect(a.getByText('CLOSED', { exact: true })).toBeVisible();
    await expect(a.getByRole('button', { name: 'ยกเลิกการลงทะเบียน', exact: true })).toHaveCount(0);
    await b.goto(`/events/${eventId}`);
    await expect(b.getByText('คุณยกเลิกการลงทะเบียนแล้ว กิจกรรมนี้ปิดรับลงทะเบียนแล้ว', { exact: true })).toBeVisible();
    await expect(b.getByRole('button', { name: 'ลงทะเบียนใหม่', exact: true })).toHaveCount(0);
    await b.screenshot({ path: '.local/verification/f06-browser-closed.png', fullPage: true });

    // Read-only DB assertions on this UI-created event; no fixtures or writes
    // bypass the real HTTP journey, and no history endpoint is introduced.
    const records = await db.registration.findMany({ where: { eventId }, include: { history: { orderBy: { occurredAt: 'asc' } } } });
    expect(records).toHaveLength(2);
    const aRecord = records.find(record => record.id === reference)!;
    expect(aRecord.registeredAt.toISOString()).toBe(first.registered_at);
    expect(aRecord.cancelledAt).toBeNull();
    expect(aRecord.history.map(entry => entry.action)).toEqual(['REGISTERED', 'CANCELLED', 'REACTIVATED']);
    expect(aRecord.history.every(entry => entry.actorId === aRecord.participantId)).toBe(true);
    expect(records.find(record => record.id === bReference)!.history.map(entry => entry.action)).toEqual(['REGISTERED', 'CANCELLED']);
    expect(records.filter(record => record.status === 'ACTIVE')).toHaveLength(1);
    expect((await db.event.findUniqueOrThrow({ where: { id: eventId } })).status).toBe('CLOSED');
  } catch (error) {
    console.error('F06_BROWSER failure before cleanup:', error instanceof Error ? error.message : String(error));
    console.error('F06_BROWSER participant A visible state:', await a.locator('main').innerText().catch(() => 'unavailable'));
    console.error('F06_BROWSER participant B visible state:', await b.locator('main').innerText().catch(() => 'unavailable'));
    throw error;
  } finally {
    await Promise.all([aContext.close(), bContext.close(), db.$disconnect()]);
  }
});
