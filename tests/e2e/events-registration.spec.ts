import { test, expect, type Page } from '@playwright/test';
import { fillEventTime } from './event-form.js';

async function login(page: Page, username: string) {
  await page.goto('/login'); await page.getByLabel('ชื่อผู้ใช้').fill(username);
  await page.getByLabel('รหัสผ่าน', { exact: true }).fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
  await expect(page).toHaveURL(/\/events$/);
}

test('real #1/#2/#3 journey: publish, register across focus refresh, keep reference and reject stale full attempt', async ({ page, browser }) => {
  await login(page, 'organizer.a'); await page.goto('/organizer/events/new');
  const title = `Integrated event ${Date.now()}`;
  for (const [label, value] of [['ชื่อกิจกรรม', title], ['รายละเอียด', 'รวมกิจกรรมและลงทะเบียนจริง 🌱'], ['สถานที่', 'บางมด'], ['จำนวนที่นั่ง', '1']]) {
    await page.getByLabel(label, { exact: true }).fill(value);
  }
  await fillEventTime(page, 'ปิดรับลงทะเบียน', '2099-01-01T09:00');
  await fillEventTime(page, 'เริ่มกิจกรรม', '2099-01-01T10:00');
  await fillEventTime(page, 'สิ้นสุดกิจกรรม', '2099-01-01T11:00');
  await page.getByRole('button', { name: 'บันทึก DRAFT', exact: true }).click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  const id = page.url().split('/').pop()!;
  expect((await page.request.get(`/api/events/${id}`)).status()).toBe(404);
  await page.getByRole('button', { name: 'เผยแพร่กิจกรรม', exact: true }).click();
  await expect(page.getByText('PUBLISHED', { exact: true })).toBeVisible();

  const aContext = await browser.newContext(), bContext = await browser.newContext();
  try {
    const a = await aContext.newPage(), b = await bContext.newPage();
    await login(a, 'participant.a'); await login(b, 'participant.b');
    for (const participant of [a, b]) {
      await participant.getByRole('link', { name: title, exact: true }).click();
      await expect(participant.getByRole('button', { name: 'ลงทะเบียน', exact: true })).toBeEnabled();
    }
    let release!: () => void, committed!: () => void, postCount = 0;
    const held = new Promise<void>(resolve => { release = resolve; });
    const saved = new Promise<void>(resolve => { committed = resolve; });
    // Forward to the real service/DB, holding only the response in transit.
    await a.route(`**/api/events/${id}/registrations`, async route => {
      postCount++;
      const response = await route.fetch(); expect(response.status()).toBe(201);
      committed(); await held; await route.fulfill({ response });
    });
    await a.getByRole('button', { name: 'ลงทะเบียน', exact: true }).click(); await saved;
    try {
      await a.evaluate(() => window.dispatchEvent(new Event('focus')));
      await expect(a.getByText('ลงทะเบียน ACTIVE 1 คน', { exact: true })).toBeVisible();
      await expect(a.getByRole('button', { name: 'กำลังลงทะเบียน…', exact: true })).toBeDisabled();
    } finally { release(); }
    const success = a.getByRole('status').filter({ hasText: 'ลงทะเบียนสำเร็จ' });
    await expect(success).toBeVisible();
    const reference = await success.locator('strong').innerText();
    expect(reference).toMatch(/^[0-9a-f-]{36}$/i);
    await a.getByRole('button', { name: 'รีเฟรชที่นั่ง', exact: true }).click();
    await a.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect(success).toContainText(reference); expect(postCount).toBe(1);
    await a.screenshot({ path: '.local/verification/combined-registration-success.png', fullPage: true });

    // Participant B saw the last seat before A committed. The real service
    // rejects the stale attempt and the host refreshes counts without remounting.
    await b.getByRole('button', { name: 'ลงทะเบียน', exact: true }).click();
    await expect(b.getByRole('alert')).toContainText('กิจกรรมเต็มแล้ว');
    await expect(b.getByText('ว่าง 0 / 1 ที่นั่ง', { exact: true })).toBeVisible();
    await expect(b.getByRole('button', { name: 'ลงทะเบียน', exact: true })).toBeDisabled();
    await a.unroute(`**/api/events/${id}/registrations`);
    const token = (await (await a.request.get('/api/auth/csrf')).json()).data.csrf_token;
    const duplicate = await a.request.post(`/api/events/${id}/registrations`, { headers: { 'X-CSRF-Token': token }, data: {} });
    expect(duplicate.status()).toBe(409); expect((await duplicate.json()).error.code).toBe('ALREADY_REGISTERED');
    await page.getByRole('button', { name: 'รีเฟรชที่นั่ง', exact: true }).click();
    await expect(page.getByText('ลงทะเบียน ACTIVE 1 คน', { exact: true })).toBeVisible();
    for (const participant of [a, b, page]) {
      const shared = (await (await participant.request.get(`/api/events/${id}`)).json()).data;
      expect(shared).toMatchObject({ active_count: 1, available_seats: 0, registration_open: false });
      expect(Object.keys(shared)).toHaveLength(12);
    }
    await a.reload();
    await expect(a.getByText('ลงทะเบียน ACTIVE 1 คน', { exact: true })).toBeVisible();
    await expect(a.getByRole('button', { name: 'ลงทะเบียน', exact: true })).toBeDisabled();
  } finally { await aContext.close(); await bContext.close(); }
});
