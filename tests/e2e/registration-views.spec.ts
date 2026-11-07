import { test, expect, type Page } from '@playwright/test';
import { fillEventTime } from './event-form.js';

test.beforeEach(async ({ page }) => {
  page.on('pageerror', error => console.error('Browser script error:', error.message));
  page.on('requestfailed', request => {
    if (request.failure()?.errorText.includes('ACCESS_DENIED')) console.error('Browser network denied:', new URL(request.url()).pathname);
  });
});

async function login(page: Page, username: string) {
  await page.goto('/login');
  await page.getByLabel('ชื่อผู้ใช้').fill(username);
  await page.getByLabel('รหัสผ่าน', { exact: true }).fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
  await expect(page).toHaveURL(/\/events$/);
}

test('TEST-24/29/30: real publish → register → own detail/re-login → owner roster journey', async ({ page, browser }) => {
  await login(page, 'organizer.a');
  await page.goto('/organizer/events/new');
  const title = `Issue 4 journey ${Date.now()}`;
  for (const [label, value] of [['ชื่อกิจกรรม', title], ['รายละเอียด', 'Registration views journey'], ['สถานที่', 'Campus'], ['จำนวนที่นั่ง', '3']]) {
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
  await page.getByRole('link', { name: 'ดูรายชื่อผู้ลงทะเบียน', exact: true }).click();
  await expect(page.getByText('ยังไม่มีผู้ลงทะเบียน', { exact: true })).toBeVisible();
  const context = await browser.newContext();
  try {
    const participant = await context.newPage();
    await login(participant, 'participant.a');
    await participant.goto(`/events/${eventId}`);
    await participant.getByRole('button', { name: 'ลงทะเบียน', exact: true }).click();
    const success = participant.getByRole('status').filter({ hasText: 'ลงทะเบียนสำเร็จ' });
    await expect(success).toBeVisible();
    const reference = await success.locator('strong').innerText();
    await participant.getByRole('link', { name: 'ดูรายการของฉัน', exact: true }).click();
    await participant.getByRole('link', { name: title, exact: true }).click();
    await expect(participant).toHaveURL(new RegExp(`/my/registrations/${reference}$`));
    await expect(participant.getByText(reference, { exact: true })).toBeVisible();
    await participant.reload();
    await expect(participant.getByText(reference, { exact: true })).toBeVisible();
    await participant.getByRole('button', { name: 'ออกจากระบบ', exact: true }).click();
    await expect(participant).toHaveURL(/\/login$/);
    await login(participant, 'participant.a');
    await participant.goto(`/my/registrations/${reference}`);
    await expect(participant.getByRole('heading', { name: title })).toBeVisible();
    await expect(participant.getByText(reference, { exact: true })).toBeVisible();
    await participant.setViewportSize({ width: 390, height: 844 });
    await participant.screenshot({ path: '.local/verification/issue-4-own-detail.png', fullPage: true });
    await expect(participant.getByText('เวลาประเทศไทย (Asia/Bangkok)', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'รีเฟรชรายชื่อ', exact: true }).click();
    await expect(page.getByRole('cell', { name: reference, exact: true })).toBeVisible();
    const roster = (await (await page.request.get(`/api/organizer/events/${eventId}/registrations`)).json()).data;
    expect(roster.active_count).toBe(1);
    await expect(page.getByRole('cell', { name: roster.registrations[0].participant.display_name, exact: true })).toBeVisible();
    await page.screenshot({ path: '.local/verification/issue-4-roster.png', fullPage: true });
    await login(participant, 'participant.b');
    await participant.goto(`/my/registrations/${reference}`);
    await expect(participant.getByRole('alert')).toContainText('ไม่พบรายการลงทะเบียนนี้');
    await expect(participant.getByRole('heading', { name: title })).toHaveCount(0);
  } finally { await context.close(); }
});

test('TEST-25: own list empty/error/retry, session rejection and wrong-role direct access', async ({ page }) => {
  await login(page, 'participant.c');
  let reject = false;
  await page.route('**/api/my/registrations', route => route.fulfill({ status: reject ? 500 : 200, contentType: 'application/json',
    body: JSON.stringify(reject ? { error: { code: 'INTERNAL_ERROR', message: 'ลองโหลดใหม่', fields: {} } } : { data: [] }) }));
  await page.getByRole('link', { name: 'รายการลงทะเบียนของฉัน', exact: true }).click();
  await expect(page.getByText('ยังไม่มีรายการลงทะเบียน', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'เลือกกิจกรรม', exact: true })).toHaveAttribute('href', '/events');
  reject = true;
  await page.getByRole('button', { name: 'รีเฟรชรายการ', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('ลองโหลดใหม่');
  reject = false;
  await page.getByRole('button', { name: 'ลองใหม่', exact: true }).click();
  await expect(page.getByText('ยังไม่มีรายการลงทะเบียน', { exact: true })).toBeVisible();
  await page.unroute('**/api/my/registrations');
  await page.route('**/api/my/registrations', route => route.fulfill({ status: 401, contentType: 'application/json',
    body: JSON.stringify({ error: { code: 'AUTH_REQUIRED', message: 'กรุณาเข้าสู่ระบบ', fields: {} } }) }));
  await page.getByRole('button', { name: 'รีเฟรชรายการ', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.unroute('**/api/my/registrations');
  await login(page, 'organizer.b');
  await page.goto('/my/registrations');
  await expect(page.getByRole('alert')).toContainText('เฉพาะผู้เข้าร่วม');
  await expect(page.getByRole('link', { name: 'รายการลงทะเบียนของฉัน', exact: true })).toHaveCount(0);
});
