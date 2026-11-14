import { test, expect, type Page, type Route } from '@playwright/test';

async function login(page: Page, username = 'organizer.a') {
  await page.goto('/login'); await page.getByLabel('ชื่อผู้ใช้').fill(username);
  await page.getByLabel('รหัสผ่าน', { exact: true }).fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
  await expect(page).toHaveURL(/\/events$/);
}
async function create(page: Page, title: string) {
  const token = (await (await page.request.get('/api/auth/csrf')).json()).data.csrf_token;
  const response = await page.request.post('/api/organizer/events', { headers: { 'X-CSRF-Token': token }, data: {
    title, description: 'Overview test fixture', location: 'บางมด', capacity: 2,
    registration_closes_at: '2099-01-01T00:00:00Z', starts_at: '2099-01-02T00:00:00Z', ends_at: '2099-01-02T01:00:00Z' } });
  expect(response.status()).toBe(201); return { event: (await response.json()).data, token };
}

test('F-02 overview empty state, active navigation and create entry work on desktop and mobile', async ({ page }) => {
  await login(page);
  await page.route('**/api/organizer/events', route => route.fulfill({ json: { data: [] } }));
  await page.getByRole('link', { name: 'ภาพรวม', exact: true }).click();
  await expect(page).toHaveURL(/\/organizer$/);
  await expect(page.getByRole('link', { name: 'ภาพรวม', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('heading', { name: 'สวัสดี Organizer A', exact: true })).toBeVisible();
  for (const name of ['กิจกรรมทั้งหมด', 'ฉบับร่าง', 'กิจกรรมเผยแพร่']) await expect(page.getByRole('article', { name, exact: true }).getByText('0', { exact: true })).toBeVisible();
  await expect(page.getByText('ยังไม่มีกิจกรรมที่สร้าง', { exact: true })).toBeVisible();
  await page.screenshot({ path: '.local/verification/overview-empty-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: '.local/verification/overview-empty-mobile.png', fullPage: true });
  await page.getByRole('link', { name: 'สร้างกิจกรรมแรก', exact: true }).click();
  await expect(page).toHaveURL(/\/organizer\/events\/new$/);
  await expect(page.getByRole('heading', { name: 'สร้างกิจกรรม', exact: true })).toBeVisible();
});

test('F-02 overview uses real owner-list counts/order, excludes another owner and preserves all-list/detail routes', async ({ page, browser }) => {
  await login(page); const prefix = `Overview ${Date.now()}`;
  const draft = await create(page, `${prefix} draft`), published = await create(page, `${prefix} published`);
  const latest = await create(page, `${prefix} latest`);
  expect((await page.request.post(`/api/organizer/events/${published.event.id}/publish`, { headers: { 'X-CSRF-Token': published.token }, data: {} })).status()).toBe(200);
  const other = await browser.newContext(), otherPage = await other.newPage();
  await login(otherPage, 'organizer.b'); const hidden = await create(otherPage, `${prefix} private B`); await other.close();
  const events = (await (await page.request.get('/api/organizer/events')).json()).data as { id: string; title: string; status: string }[];
  await page.getByRole('link', { name: 'ภาพรวม', exact: true }).click();
  for (const [name, value] of [['กิจกรรมทั้งหมด', events.length], ['ฉบับร่าง', events.filter(e => e.status === 'DRAFT').length], ['กิจกรรมเผยแพร่', events.filter(e => e.status === 'PUBLISHED').length]] as const) {
    await expect(page.getByRole('article', { name, exact: true }).getByText(String(value), { exact: true })).toBeVisible();
  }
  const recent = page.getByRole('region', { name: 'กิจกรรมของฉัน', exact: true });
  await expect(recent.locator('li h3 a')).toHaveText(events.slice(0, 3).map(e => e.title));
  await expect(page.getByText(hidden.event.title, { exact: true })).toHaveCount(0);
  await page.reload(); await expect(page).toHaveURL(/\/organizer$/);
  await expect(page.getByRole('heading', { name: 'สวัสดี Organizer A', exact: true })).toBeVisible();
  await expect(recent.locator('li h3 a')).toHaveText(events.slice(0, 3).map(e => e.title));
  const refreshed = page.waitForResponse(response => response.url().endsWith('/api/organizer/events'));
  await page.evaluate(() => window.dispatchEvent(new Event('focus'))); await refreshed;
  await expect(page.getByText('กำลังรีเฟรชภาพรวมกิจกรรม…', { exact: true })).toHaveCount(0);
  await expect(recent.locator('li h3 a')).toHaveText(events.slice(0, 3).map(e => e.title));
  await expect(page).toHaveURL(/\/organizer$/);
  await page.screenshot({ path: '.local/verification/overview-populated.png', fullPage: true });
  await page.getByRole('link', { name: 'ดูทั้งหมด', exact: true }).click();
  await expect(page).toHaveURL(/\/organizer\/events$/);
  await page.getByRole('link', { name: latest.event.title, exact: true }).click();
  await expect(page.getByRole('heading', { name: latest.event.title, exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'กิจกรรมทั้งหมด', exact: true }).click();
  await expect(page).toHaveURL(/\/events$/);
  await expect(page.getByRole('link', { name: published.event.title, exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: draft.event.title, exact: true })).toHaveCount(0);
});

test('F-02 overview distinguishes loading/error from zero and retries; 401 clears private overview', async ({ page }) => {
  await login(page); let held!: Route, seen!: () => void;
  const captured = new Promise<void>(resolve => { seen = resolve; });
  await page.route('**/api/organizer/events', route => { held = route; seen(); });
  await page.getByRole('link', { name: 'ภาพรวม', exact: true }).click(); await captured;
  await expect(page.getByText('กำลังโหลดภาพรวมกิจกรรม…', { exact: true })).toBeVisible();
  await expect(page.getByRole('article', { name: 'กิจกรรมทั้งหมด', exact: true }).getByText('0', { exact: true })).toHaveCount(0);
  await expect(page.getByText('ยังไม่มีกิจกรรมที่สร้าง', { exact: true })).toHaveCount(0);
  await held.abort(); await expect(page.getByRole('alert')).toContainText('โหลดภาพรวมไม่สำเร็จ');
  await page.unroute('**/api/organizer/events');
  await page.route('**/api/organizer/events', route => route.fulfill({ json: { data: [] } }));
  await page.getByRole('button', { name: 'ลองใหม่', exact: true }).click();
  await expect(page.getByText('ยังไม่มีกิจกรรมที่สร้าง', { exact: true })).toBeVisible();
  await page.unroute('**/api/organizer/events');
  await page.route('**/api/organizer/events', route => route.fulfill({ status: 401, json: { error: { code: 'AUTH_REQUIRED', message: 'กรุณาเข้าสู่ระบบ', fields: {} } } }));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page).toHaveURL(/\/login$/); await expect(page.getByText('Organizer A', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('article', { name: 'กิจกรรมทั้งหมด', exact: true })).toHaveCount(0);
});

test('F-02 Participant keeps shared browsing and cannot open Organizer overview', async ({ page }) => {
  await login(page, 'participant.a');
  await expect(page.getByRole('link', { name: 'ภาพรวม', exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'กิจกรรมของฉัน', exact: true })).toHaveCount(0);
  await page.goto('/organizer'); await expect(page.getByRole('alert')).toContainText('ไม่มีสิทธิ์ใช้งาน');
  await expect(page.getByRole('link', { name: 'สร้างกิจกรรม', exact: true })).toHaveCount(0);
  expect((await page.request.get('/api/organizer/events')).status()).toBe(403);
});
