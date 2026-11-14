import { test, expect, type Page } from '@playwright/test';
import { fillEventTime } from './event-form.js';

async function login(page: Page, username = 'organizer.a') {
  await page.goto('/login');
  await page.getByLabel('ชื่อผู้ใช้').fill(username); await page.getByLabel('รหัสผ่าน', { exact: true }).fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click(); await expect(page).toHaveURL(/\/events$/);
}

test('TEST-07/09/14/36 Organizer creates, previews, publishes; Participant browses persisted shared detail', async ({ page, browser }) => {
  await login(page);
  await page.getByRole('link', { name: 'กิจกรรมของฉัน', exact: true }).click();
  await page.getByRole('link', { name: 'สร้างกิจกรรม', exact: true }).click();
  const formCard = page.locator('section').filter({ has: page.getByRole('heading', { name: 'สร้างกิจกรรม', exact: true }) });
  const cardBounds = await formCard.boundingBox(), mainBounds = await page.locator('main').boundingBox();
  expect.soft(Math.abs(cardBounds!.x + cardBounds!.width / 2 - mainBounds!.x - mainBounds!.width / 2)).toBeLessThanOrEqual(1);
  await expect(formCard.locator('fieldset legend')).toHaveText(['ปิดรับลงทะเบียน', 'เริ่มกิจกรรม', 'สิ้นสุดกิจกรรม']);
  const checkScheduleOrder = async () => {
    const rows = await formCard.locator('fieldset').evaluateAll(elements => elements.map(element => {
      const date = element.querySelector('input[type="date"]')!.getBoundingClientRect();
      const time = element.querySelector('input[type="time"]')!.getBoundingClientRect();
      return { top: element.getBoundingClientRect().top, dateX: date.x, dateWidth: date.width, timeX: time.x, timeWidth: time.width };
    }));
    expect(rows[0].top).toBeLessThan(rows[1].top); expect(rows[1].top).toBeLessThan(rows[2].top);
    for (const row of rows.slice(1)) for (const key of ['dateX', 'dateWidth', 'timeX', 'timeWidth'] as const) {
      expect(Math.abs(row[key] - rows[0][key])).toBeLessThanOrEqual(1);
    }
  };
  await checkScheduleOrder();
  // Exercise the native input's increment: ordinary event entry should advance
  // by one minute, rather than exposing seconds/milliseconds in the picker.
  for (const label of ['เริ่มกิจกรรม', 'สิ้นสุดกิจกรรม', 'ปิดรับลงทะเบียน']) {
    const date = page.getByLabel(`วันที่${label}`, { exact: true });
    const field = page.getByLabel(`เวลา${label}`, { exact: true });
    await date.fill('2099-01-01');
    await field.fill('09:00');
    await field.evaluate((element: HTMLInputElement) => element.stepUp());
    await expect.soft(field).toHaveValue('09:01');
    // Read both rects together: native focus can scroll the page between two
    // separate boundingBox calls when the schedule is below the viewport.
    const { dateBounds, timeBounds } = await date.evaluate(element => {
      const dateBounds = element.getBoundingClientRect();
      const timeBounds = element.parentElement!.querySelector('input[type="time"]')!.getBoundingClientRect();
      return { dateBounds: { x: dateBounds.x, y: dateBounds.y, width: dateBounds.width }, timeBounds: { x: timeBounds.x, y: timeBounds.y } };
    });
    expect(timeBounds.x).toBeGreaterThan(dateBounds.x + dateBounds.width);
    expect(Math.abs(timeBounds.y - dateBounds.y)).toBeLessThanOrEqual(1);
    await field.clear(); await date.clear();
  }
  const timezone = page.getByLabel('เขตเวลากิจกรรม', { exact: true });
  await expect(timezone).toContainText('GMT+07:00'); await expect(timezone).toContainText('กรุงเทพมหานคร');
  const dateBounds = await page.getByLabel('วันที่เริ่มกิจกรรม', { exact: true }).boundingBox(), timezoneBounds = await timezone.boundingBox();
  expect(timezoneBounds!.x).toBeGreaterThan(dateBounds!.x + dateBounds!.width);
  await page.getByRole('button', { name: 'บันทึก DRAFT' }).click();
  await expect(page.getByText('กรุณากรอก 1–120 ตัวอักษร')).toBeVisible();
  const title = `E2E Event ${Date.now()}`;
  await page.getByLabel('ชื่อกิจกรรม', { exact: true }).fill(title);
  await page.getByLabel('รายละเอียด', { exact: true }).fill('กิจกรรมทดสอบภาษาไทย 🌱');
  await page.getByLabel('สถานที่', { exact: true }).fill('บางมด');
  await page.getByLabel('จำนวนที่นั่ง', { exact: true }).fill('2');
  // Bangkok midnight boundary on a future date, independent of host timezone.
  await fillEventTime(page, 'เริ่มกิจกรรม', '2099-01-02T00:30');
  await fillEventTime(page, 'สิ้นสุดกิจกรรม', '2099-01-02T01:30');
  await fillEventTime(page, 'ปิดรับลงทะเบียน', '2099-01-01T23:30');
  await page.screenshot({ path: '.local/verification/events-create-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await checkScheduleOrder();
  const mobileBounds = await formCard.boundingBox();
  expect.soft(Math.abs(mobileBounds!.x + mobileBounds!.width / 2 - 195)).toBeLessThanOrEqual(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: '.local/verification/events-create-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.route('**/api/organizer/events', async route => {
    if (route.request().method() === 'POST') await new Promise(resolve => setTimeout(resolve, 300));
    await route.continue();
  });
  await page.getByRole('button', { name: 'บันทึก DRAFT' }).click();
  await expect(page.getByRole('button', { name: 'กำลังบันทึก…' })).toBeDisabled();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  await expect(page.getByText('DRAFT', { exact: true })).toBeVisible();
  await expect(page.getByText('Asia/Bangkok', { exact: false }).first()).toBeVisible();
  await expect(page.getByTestId('starts-at')).toContainText('00:30');
  await expect(page.getByTestId('starts-at')).toContainText('2 ม.ค. 2642');
  const id = page.url().split('/').pop()!;
  expect((await page.request.get(`/api/events/${id}`)).status()).toBe(404);
  await page.getByRole('button', { name: 'เผยแพร่กิจกรรม', exact: true }).click();
  await expect(page.getByText('PUBLISHED', { exact: true })).toBeVisible();
  await page.reload(); await expect(page.getByRole('heading', { name: title })).toBeVisible();
  const context = await browser.newContext(), participant = await context.newPage();
  await login(participant, 'participant.a');
  await participant.getByRole('link', { name: title, exact: true }).click();
  await expect(participant.getByRole('heading', { name: title })).toBeVisible();
  await expect(participant.getByText('กิจกรรมทดสอบภาษาไทย 🌱')).toBeVisible();
  await expect(participant.getByText('ว่าง 2 / 2 ที่นั่ง')).toBeVisible();
  await expect(participant.getByRole('button', { name: 'เผยแพร่กิจกรรม' })).toHaveCount(0);
  const data = (await (await participant.request.get(`/api/events/${id}`)).json()).data;
  expect(data.starts_at).toBe('2099-01-01T17:30:00.000Z');
  await page.screenshot({ path: '.local/verification/events-owner.png', fullPage: true });
  await participant.screenshot({ path: '.local/verification/events-shared.png', fullPage: true });
  await context.close();
});

test('TEST-14 list loading, empty, failure and retry; detail 404 and publish conflict', async ({ page }) => {
  await login(page);
  await page.route('**/api/events', async route => { await new Promise(resolve => setTimeout(resolve, 250)); await route.fulfill({ json: { data: [] } }); });
  await page.reload(); await expect(page.getByText('กำลังโหลดกิจกรรม…', { exact: true })).toBeVisible();
  await expect(page.getByText('ยังไม่มีกิจกรรม')).toBeVisible();
  await page.unroute('**/api/events');
  await page.route('**/api/events', route => route.abort());
  await page.reload(); await expect(page.getByRole('alert')).toContainText('โหลดข้อมูลไม่สำเร็จ');
  await page.unroute('**/api/events');
  await page.getByRole('button', { name: 'ลองใหม่', exact: true }).click();
  await expect(page.getByText('โหลดข้อมูลไม่สำเร็จ')).toHaveCount(0);
  await page.goto('/events/00000000-0000-4000-8000-000000000000');
  await expect(page.getByRole('alert')).toContainText('ไม่พบกิจกรรมนี้');
  const token = (await (await page.request.get('/api/auth/csrf')).json()).data.csrf_token;
  const response = await page.request.post('/api/organizer/events', { headers: { 'X-CSRF-Token': token }, data: {
    title: 'Past draft', description: 'past', location: 'Bangkok', capacity: 1,
    starts_at: '2020-01-01T01:00:00Z', ends_at: '2020-01-01T02:00:00Z', registration_closes_at: '2020-01-01T00:00:00Z' } });
  expect(response.status()).toBe(201); const id = (await response.json()).data.id;
  await page.goto(`/organizer/events/${id}`);
  // Server owns the boundary; even an old preview must handle a rejected publish.
  await page.getByRole('button', { name: 'เผยแพร่กิจกรรม', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('เลยกำหนดปิดรับลงทะเบียนแล้ว');
  await expect(page.getByText('DRAFT', { exact: true })).toBeVisible();
});

test('TEST-09/14 an older availability refresh cannot overwrite a successful publish', async ({ page }) => {
  await login(page);
  const token = (await (await page.request.get('/api/auth/csrf')).json()).data.csrf_token;
  const created = await page.request.post('/api/organizer/events', { headers: { 'X-CSRF-Token': token }, data: {
    title: 'Publish refresh race', description: 'Fixture', location: 'Bangkok', capacity: 1,
    starts_at: '2099-01-02T01:00:00Z', ends_at: '2099-01-02T02:00:00Z', registration_closes_at: '2099-01-02T00:00:00Z' } });
  expect(created.status()).toBe(201); const old = (await created.json()).data;
  await page.goto(`/organizer/events/${old.id}`); await expect(page.getByText('DRAFT', { exact: true })).toBeVisible();
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route(`**/api/organizer/events/${old.id}`, async route => { await gate; await route.fulfill({ json: { data: old } }); });
  await page.getByRole('button', { name: 'รีเฟรชที่นั่ง', exact: true }).click();
  await expect(page.getByText('กำลังรีเฟรชกิจกรรม…')).toBeVisible();
  await page.getByRole('button', { name: 'เผยแพร่กิจกรรม', exact: true }).click();
  await expect(page.getByText('PUBLISHED', { exact: true })).toBeVisible();
  const response = page.waitForResponse(r => r.url().endsWith(`/api/organizer/events/${old.id}`));
  release(); await response;
  await expect(page.getByText('กำลังรีเฟรชกิจกรรม…')).toHaveCount(0);
  await expect(page.getByText('PUBLISHED', { exact: true })).toBeVisible();
});

for (const outcome of ['pending', 'success', 'uncertain'] as const) test(`F-02/#3 focus and availability refresh preserve RegistrationAction ${outcome}`, async ({ page }) => {
  await login(page, 'participant.a');
  const id = '22222222-2222-4222-8222-222222222222';
  await page.route(`**/api/events/${id}`, async route => { await new Promise(resolve => setTimeout(resolve, 150)); await route.fulfill({ json: { data: { id, title: 'Registration integration seam', description: 'Fixture', location: 'Bangkok', capacity: 2,
    starts_at: '2099-01-01T17:30:00.000Z', ends_at: '2099-01-01T18:30:00.000Z', registration_closes_at: '2099-01-01T16:30:00.000Z',
    status: 'PUBLISHED', active_count: 0, available_seats: 2, registration_open: true } } }); });
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route(`**/api/events/${id}/registrations`, async route => {
    if (outcome === 'pending') await gate;
    if (outcome === 'uncertain') await route.abort();
    else await route.fulfill({ status: 201, json: { data: { id: 'registration-reference', event_id: id, status: 'ACTIVE', registered_at: '2026-11-06T03:00:00.000Z' } } });
  });
  await page.goto(`/events/${id}`);
  await page.getByRole('button', { name: 'ลงทะเบียน', exact: true }).click();
  const state = outcome === 'pending' ? page.getByRole('button', { name: 'กำลังลงทะเบียน…' }) : outcome === 'success' ? page.getByText('registration-reference') : page.getByText('ยังยืนยันผลไม่ได้', { exact: false });
  await expect(state).toBeVisible();
  for (const trigger of ['focus', 'button']) {
    const response = page.waitForResponse(r => r.url().endsWith(`/api/events/${id}`));
    if (trigger === 'focus') await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    else await page.getByRole('button', { name: 'รีเฟรชที่นั่ง', exact: true }).click();
    await expect(page.getByText('กำลังรีเฟรชกิจกรรม…')).toBeVisible();
    await expect(state).toBeVisible();
    await response; await expect(page.getByText('กำลังรีเฟรชกิจกรรม…')).toHaveCount(0);
    await expect(state).toBeVisible();
  }
  await page.unroute(`**/api/events/${id}`);
  await page.route(`**/api/events/${id}`, route => route.abort());
  await page.getByRole('button', { name: 'รีเฟรชที่นั่ง', exact: true }).click();
  await expect(page.getByText('โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่')).toBeVisible();
  await expect(state).toBeVisible();
  // Identity polling is part of the same focus refresh. A temporary /me
  // outage must not destroy the registration outcome either.
  await page.route('**/api/auth/me', route => route.abort());
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByText('ตรวจสอบการเข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่')).toBeVisible();
  await expect(state).toBeVisible();
  await page.unroute('**/api/auth/me');
  await page.getByRole('button', { name: 'ตรวจสอบอีกครั้ง', exact: true }).click();
  await expect(page.getByText('ตรวจสอบการเข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่')).toHaveCount(0);
  await expect(state).toBeVisible();
  if (outcome === 'pending') { await expect(state).toBeDisabled(); release(); await expect(page.getByText('registration-reference')).toBeVisible(); }
});
