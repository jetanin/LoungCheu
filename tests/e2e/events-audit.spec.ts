import { test, expect, type Page, type Route } from '@playwright/test';
import { fillEventTime } from './event-form.js';

async function signIn(page: Page, username = 'organizer.a', initial = true) {
  if (initial) await page.goto('/login');
  await page.getByLabel('ชื่อผู้ใช้').fill(username);
  await page.getByLabel('รหัสผ่าน', { exact: true }).fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
  await expect(page).toHaveURL(/\/events$/);
}
async function draft(page: Page) {
  const token = (await (await page.request.get('/api/auth/csrf')).json()).data.csrf_token;
  const response = await page.request.post('/api/organizer/events', { headers: { 'X-CSRF-Token': token }, data: {
    title: `Audit draft ${Date.now()}`, description: 'Private draft description', location: 'Bangkok', capacity: 2,
    starts_at: '2099-01-02T01:00:00Z', ends_at: '2099-01-02T02:00:00Z', registration_closes_at: '2099-01-02T00:00:00Z' } });
  expect(response.status()).toBe(201); return (await response.json()).data;
}
const settle = (page: Page) => page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));

for (const status of [403, 404]) test(`TEST-14 publish ${status} removes cached private record even if an old refresh returns later`, async ({ page }) => {
  await signIn(page); const event = await draft(page);
  await page.goto(`/organizer/events/${event.id}`); await expect(page.getByRole('heading', { name: event.title })).toBeVisible();
  let older!: Route, seen!: () => void;
  const requested = new Promise<void>(resolve => { seen = resolve; });
  await page.route(`**/api/organizer/events/${event.id}`, route => { older = route; seen(); });
  await page.getByRole('button', { name: 'รีเฟรชที่นั่ง', exact: true }).click(); await requested;
  await page.route(`**/api/organizer/events/${event.id}/publish`, route => route.fulfill({ status, json: { error: {
    code: status === 403 ? 'ROLE_FORBIDDEN' : 'EVENT_NOT_FOUND', message: status === 403 ? 'ไม่มีสิทธิ์ใช้งาน' : 'ไม่พบกิจกรรมนี้', fields: {} } } }));
  await page.getByRole('button', { name: 'เผยแพร่กิจกรรม', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText(status === 403 ? 'ไม่มีสิทธิ์ใช้งาน' : 'ไม่พบกิจกรรมนี้');
  const delivered = page.waitForResponse(r => r.url().endsWith(`/api/organizer/events/${event.id}`));
  await older.fulfill({ json: { data: event } }); await delivered; await settle(page);
  await expect(page.getByRole('heading', { name: event.title })).toHaveCount(0);
  await expect(page.getByText(event.description, { exact: true })).toHaveCount(0);
});

for (const status of [403, 404]) test(`TEST-14 read ${status} cannot be overwritten by an earlier publish success`, async ({ page }) => {
  await signIn(page); const event = await draft(page);
  await page.goto(`/organizer/events/${event.id}`); await expect(page.getByText('DRAFT', { exact: true })).toBeVisible();
  let held!: Route, payload: unknown, ready!: () => void;
  const captured = new Promise<void>(resolve => { ready = resolve; });
  await page.route(`**/api/organizer/events/${event.id}/publish`, async route => {
    const response = await route.fetch(); expect(response.status()).toBe(200); payload = await response.json(); held = route; ready();
  });
  await page.getByRole('button', { name: 'เผยแพร่กิจกรรม', exact: true }).click(); await captured;
  await page.route(`**/api/organizer/events/${event.id}`, route => route.fulfill({ status, json: { error: {
    code: status === 403 ? 'ROLE_FORBIDDEN' : 'EVENT_NOT_FOUND', message: status === 403 ? 'ไม่มีสิทธิ์ใช้งาน' : 'ไม่พบกิจกรรมนี้', fields: {} } } }));
  await page.getByRole('button', { name: 'รีเฟรชที่นั่ง', exact: true }).click();
  await expect(page.getByRole('heading', { name: event.title })).toHaveCount(0);
  const delivered = page.waitForResponse(r => r.url().endsWith(`/api/organizer/events/${event.id}/publish`));
  await held.fulfill({ status: 200, json: payload }); await delivered; await settle(page);
  await expect(page.getByRole('heading', { name: event.title })).toHaveCount(0);
  await expect(page.getByRole('alert')).toContainText(status === 403 ? 'ไม่มีสิทธิ์ใช้งาน' : 'ไม่พบกิจกรรมนี้');
});

test('TEST-09/14 publish conflict explains rejection and refreshes the committed event status', async ({ page }) => {
  await signIn(page); const event = await draft(page);
  await page.goto(`/organizer/events/${event.id}`); await expect(page.getByText('DRAFT', { exact: true })).toBeVisible();
  const token = (await (await page.request.get('/api/auth/csrf')).json()).data.csrf_token;
  expect((await page.request.post(`/api/organizer/events/${event.id}/publish`, { headers: { 'X-CSRF-Token': token }, data: {} })).status()).toBe(200);
  await page.getByRole('button', { name: 'เผยแพร่กิจกรรม', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('เผยแพร่ได้เฉพาะกิจกรรม DRAFT');
  await expect(page.getByText('PUBLISHED', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'เผยแพร่กิจกรรม', exact: true })).toHaveCount(0);
});

test('TEST-14 a late create success cannot navigate the next signed-in account to the previous owner record', async ({ page }) => {
  await signIn(page); await page.goto('/organizer/events/new');
  for (const [label, value] of [['ชื่อกิจกรรม', 'Delayed create'], ['รายละเอียด', 'Private form'], ['สถานที่', 'Bangkok'], ['จำนวนที่นั่ง', '2']]) await page.getByLabel(label, { exact: true }).fill(value);
  await fillEventTime(page, 'เริ่มกิจกรรม', '2099-01-02T01:00');
  await fillEventTime(page, 'สิ้นสุดกิจกรรม', '2099-01-02T02:00');
  await fillEventTime(page, 'ปิดรับลงทะเบียน', '2099-01-01T23:00');
  let held!: Route, payload: unknown, ready!: () => void;
  const captured = new Promise<void>(resolve => { ready = resolve; });
  await page.route('**/api/organizer/events', async route => {
    if (route.request().method() !== 'POST') return route.continue();
    const response = await route.fetch(); expect(response.status()).toBe(201); payload = await response.json(); held = route; ready();
  });
  await page.getByRole('button', { name: 'บันทึก DRAFT', exact: true }).click(); await captured;
  await page.getByRole('button', { name: 'ออกจากระบบ', exact: true }).click();
  await signIn(page, 'organizer.b', false);
  await expect.poll(() => held.request().failure()?.errorText).toBeTruthy();
  await held.fulfill({ status: 201, json: payload }); await settle(page);
  await expect(page).toHaveURL(/\/events$/);
  await expect(page.getByRole('heading', { name: 'สวัสดี Organizer B' })).toBeVisible();
});

test('TEST-14 a late publish 401 cannot clear the next account session', async ({ page }) => {
  await signIn(page); const event = await draft(page);
  await page.goto(`/organizer/events/${event.id}`); await expect(page.getByText('DRAFT', { exact: true })).toBeVisible();
  let held!: Route, ready!: () => void;
  const captured = new Promise<void>(resolve => { ready = resolve; });
  await page.route(`**/api/organizer/events/${event.id}/publish`, route => { held = route; ready(); });
  await page.getByRole('button', { name: 'เผยแพร่กิจกรรม', exact: true }).click(); await captured;
  await page.getByRole('button', { name: 'ออกจากระบบ', exact: true }).click();
  await signIn(page, 'organizer.b', false);
  await expect.poll(() => held.request().failure()?.errorText).toBeTruthy();
  await held.fulfill({ status: 401, json: { error: { code: 'AUTH_REQUIRED', message: 'กรุณาเข้าสู่ระบบ', fields: {} } } });
  await settle(page);
  await expect(page).toHaveURL(/\/events$/); await expect(page.getByRole('heading', { name: 'สวัสดี Organizer B' })).toBeVisible();
});

test('TEST-14 canonical detail and create routes work with a trailing slash', async ({ page }) => {
  await signIn(page); const event = await draft(page);
  await page.goto(`/organizer/events/${event.id}/`); await expect(page.getByRole('heading', { name: event.title })).toBeVisible();
  await page.goto('/organizer/events/new/'); await expect(page.getByRole('button', { name: 'บันทึก DRAFT', exact: true })).toBeVisible();
});

test('TEST-14 a definitive session 401 still wins over a later temporary identity failure', async ({ page }) => {
  await signIn(page, 'participant.a');
  let old!: Route, seen!: () => void;
  const captured = new Promise<void>(resolve => { seen = resolve; });
  await page.route('**/api/auth/me', route => {
    if (!old) { old = route; seen(); return; }
    return route.abort();
  });
  await page.evaluate(() => window.dispatchEvent(new Event('focus'))); await captured;
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByText('ตรวจสอบการเข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่')).toBeVisible();
  await old.fulfill({ status: 401, json: { error: { code: 'AUTH_REQUIRED', message: 'กรุณาเข้าสู่ระบบ', fields: {} } } });
  await expect(page).toHaveURL(/\/login$/); await expect(page.getByText('Participant A')).toHaveCount(0);
});
