import { test, expect, type Page, type Route } from '@playwright/test';
import { fillEventTime } from './event-form.js';

async function login(page: Page) {
  await page.goto('/login'); await page.getByLabel('ชื่อผู้ใช้').fill('organizer.a');
  await page.getByLabel('รหัสผ่าน', { exact: true }).fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click(); await expect(page).toHaveURL(/\/events$/);
}

test('F-02 consistency: field errors follow corrected values and dependent time ordering', async ({ page }) => {
  await login(page); await page.goto('/organizer/events/new');
  await page.getByRole('button', { name: 'บันทึก DRAFT', exact: true }).click();
  for (const [label, value] of [['ชื่อกิจกรรม', `Validated ${Date.now()}`], ['รายละเอียด', 'รายละเอียด 🌱'], ['สถานที่', 'บางมด'], ['จำนวนที่นั่ง', '2']]) {
    const field = page.getByLabel(label, { exact: true });
    await expect(field).toHaveAttribute('aria-invalid', 'true'); await field.fill(value);
    await expect(field).toHaveAttribute('aria-invalid', 'false');
  }
  await page.getByLabel('วันที่ปิดรับลงทะเบียน', { exact: true }).fill('2099-01-01');
  await expect(page.getByLabel('เวลาปิดรับลงทะเบียน', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  await page.getByLabel('เวลาปิดรับลงทะเบียน', { exact: true }).fill('23:30');
  await fillEventTime(page, 'เริ่มกิจกรรม', '2099-01-02T00:30');
  await fillEventTime(page, 'สิ้นสุดกิจกรรม', '2099-01-02T01:30');
  await expect(page.locator('form [aria-invalid="true"]')).toHaveCount(0);
  await fillEventTime(page, 'เริ่มกิจกรรม', '2099-01-02T02:30');
  await expect(page.getByText('เวลาสิ้นสุดต้องหลังเวลาเริ่ม', { exact: true })).toBeVisible();
  await fillEventTime(page, 'สิ้นสุดกิจกรรม', '2099-01-02T03:30');
  await expect(page.getByText('เวลาสิ้นสุดต้องหลังเวลาเริ่ม', { exact: true })).toHaveCount(0);
  await fillEventTime(page, 'ปิดรับลงทะเบียน', '2099-01-02T03:30');
  await expect(page.getByText('เวลาปิดรับต้องไม่หลังเวลาเริ่ม', { exact: true })).toBeVisible();
  await fillEventTime(page, 'ปิดรับลงทะเบียน', '2099-01-02T02:30');
  await expect(page.locator('form [aria-invalid="true"]')).toHaveCount(0);
  await page.screenshot({ path: '.local/verification/consistency-valid-form.png', fullPage: true });
  await page.getByRole('button', { name: 'บันทึก DRAFT', exact: true }).click();
  await expect(page.getByText('DRAFT', { exact: true })).toBeVisible();
});

test('F-02 consistency: CLOSED totals and forbidden refresh discard older private overview data', async ({ page }) => {
  await login(page); const owner = (await (await page.request.get('/api/auth/me')).json()).data.id;
  const events = ['DRAFT', 'PUBLISHED', 'CLOSED'].map((status, i) => ({ id: `11111111-1111-4111-8111-${String(i + 1).padStart(12, '0')}`,
    title: `Private overview ${status}`, description: 'Private', location: 'Bangkok', capacity: 2, status, organizer_id: owner,
    starts_at: '2099-01-02T00:00:00.000Z', ends_at: '2099-01-02T01:00:00.000Z', registration_closes_at: '2099-01-01T00:00:00.000Z',
    created_at: `2026-11-0${3 - i}T00:00:00.000Z`, updated_at: '2026-11-03T00:00:00.000Z', active_count: 0, available_seats: 2, registration_open: status === 'PUBLISHED' }));
  let phase: 'ready' | 'held' | 'forbidden' = 'ready', held!: Route, seen!: () => void;
  const captured = new Promise<void>(resolve => { seen = resolve; });
  await page.route('**/api/organizer/events', route => {
    if (phase === 'ready') return route.fulfill({ json: { data: events } });
    if (phase === 'held') { held = route; seen(); return; }
    return route.fulfill({ status: 403, json: { error: { code: 'ROLE_FORBIDDEN', message: 'ไม่มีสิทธิ์ใช้งาน', fields: {} } } });
  });
  await page.goto('/organizer');
  for (const [name, value] of [['กิจกรรมทั้งหมด', '3'], ['ฉบับร่าง', '1'], ['กิจกรรมเผยแพร่', '1']]) await expect(page.getByRole('article', { name, exact: true }).getByText(value, { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Private overview CLOSED', exact: true })).toBeVisible();
  phase = 'held'; await page.evaluate(() => window.dispatchEvent(new Event('focus'))); await captured;
  phase = 'forbidden'; await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByRole('alert')).toContainText('ไม่มีสิทธิ์ใช้งาน');
  await held.fulfill({ json: { data: events } });
  await expect(page.getByRole('link', { name: 'Private overview DRAFT', exact: true })).toHaveCount(0);
  await expect(page.getByRole('article', { name: 'กิจกรรมทั้งหมด', exact: true }).getByText('3', { exact: true })).toHaveCount(0);
});
