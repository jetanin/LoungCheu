import { test, expect, type Page, type Route } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const phase = process.env.UI_REVIEW_PHASE ?? 'after';
const output = `.local/ui-review/${phase}`;
async function login(page: Page, username: string) {
  await page.goto('/login');
  await page.getByLabel('ชื่อผู้ใช้').fill(username);
  await page.getByLabel('รหัสผ่าน', { exact: true }).fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
  await expect(page).toHaveURL(/\/events$/);
}

for (const width of [1280, 390, 320]) test(`visual consistency: page hierarchy, branding, controls and layout at ${width}px`, async ({ page }) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width, height: 900 });
  mkdirSync(output, { recursive: true });
  const records: Record<string, unknown>[] = [];
  let baseline: { x: number; y: number; width: number; height: number } | null = null;
  async function inspect(name: string, ready: string, panel = false) {
    await expect(page.getByRole('heading', { name: ready, exact: true })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `${output}/${width}-${name}.png`, fullPage: true });
    const metrics = await page.evaluate(() => {
      const rect = (element: Element) => { const r = element.getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height }; };
      const style = (element: Element) => { const s = getComputedStyle(element); return { font: s.fontFamily, size: parseFloat(s.fontSize), weight: s.fontWeight, height: element.getBoundingClientRect().height, background: s.backgroundColor }; };
      const logo = document.querySelector('.brand-mark')!, brand = document.querySelector('.brand')!;
      const headings = [...document.querySelectorAll('main h1')];
      const panel = document.querySelector('main article.card') ?? document.querySelector('main section.card');
      return { logo: rect(logo), logoStyle: style(logo), brand: style(brand), headings: headings.map(style),
        body: style(document.body), controls: [...document.querySelectorAll('main input.form-control')].map(style),
        labels: [...document.querySelectorAll('main .form-label, main fieldset legend, main .event-details dt')].map(style),
        cardTitles: [...document.querySelectorAll('main .event-card-title, main .event-item-title')].map(style),
        footer: style(document.querySelector('footer')!),
        primary: [...document.querySelectorAll('main .btn-primary, main .btn-success')].map(style),
        main: rect(document.querySelector('main')!), panel: panel ? rect(panel) : null,
        panelColor: panel ? getComputedStyle(panel).backgroundColor : null,
        scrollWidth: document.documentElement.scrollWidth, viewport: innerWidth };
    });
    records.push({ page: name, ...metrics });
    expect.soft(metrics.headings, `${name}: one page h1`).toHaveLength(1);
    expect.soft(metrics.headings[0]?.size, `${name}: page heading size`).toBe(width < 576 ? 24 : 28);
    expect.soft(metrics.headings[0]?.weight, `${name}: heading weight`).toBe('700');
    expect.soft(metrics.body.size, `${name}: base text`).toBe(16);
    expect.soft(metrics.brand.size, `${name}: wordmark size`).toBe(20);
    expect.soft(metrics.brand.height, `${name}: single-line brand`).toBe(36);
    expect.soft(metrics.logoStyle.size, `${name}: mark lettering`).toBe(14);
    expect.soft(metrics.logo.width, `${name}: logo width`).toBe(36);
    expect.soft(metrics.logo.height, `${name}: logo height`).toBe(36);
    expect.soft(metrics.scrollWidth, `${name}: no horizontal overflow`).toBeLessThanOrEqual(metrics.viewport);
    if (!baseline) baseline = metrics.logo;
    for (const key of ['x', 'y', 'width', 'height'] as const) expect.soft(Math.abs(metrics.logo[key] - baseline[key]), `${name}: stable logo ${key}`).toBeLessThanOrEqual(1);
    for (const control of metrics.controls) {
      expect.soft(control.font, `${name}: input font family`).toBe(metrics.body.font);
      expect.soft(control.size, `${name}: input text`).toBe(16);
      expect.soft(control.height, `${name}: input height`).toBe(44);
      expect.soft(control.background, `${name}: white input surface`).toBe('rgb(255, 255, 255)');
    }
    for (const label of metrics.labels) expect.soft(label.size, `${name}: field label size`).toBe(14);
    for (const title of metrics.cardTitles) expect.soft(title.size, `${name}: card title size`).toBe(18);
    expect.soft(metrics.footer.size, `${name}: footer text size`).toBe(14);
    for (const button of metrics.primary) {
      expect.soft(button.size, `${name}: primary text`).toBe(16);
      expect.soft(button.height, `${name}: minimum action height`).toBeGreaterThanOrEqual(44);
      expect.soft(button.background, `${name}: primary colour`).toBe('rgb(18, 107, 86)');
    }
    if (panel && metrics.panel) expect.soft(Math.abs(metrics.panel.x + metrics.panel.width / 2 - metrics.main.x - metrics.main.width / 2), `${name}: centered panel`).toBeLessThanOrEqual(1);
    if (metrics.panel) expect.soft(metrics.panelColor, `${name}: white card surface`).toBe('rgb(255, 255, 255)');
    writeFileSync(`${output}/${width}-metrics.json`, JSON.stringify(records, null, 2));
  }

  await page.goto('/login'); await inspect('login', 'ลงชื่อ แล้วไปด้วยกัน', true);
  await login(page, 'organizer.a');
  const csrf = (await (await page.request.get('/api/auth/csrf')).json()).data.csrf_token;
  const create = async (title: string) => {
    const r = await page.request.post('/api/organizer/events', { headers: { 'X-CSRF-Token': csrf }, data: {
      title, description: 'ออกแบบบริการที่ตอบโจทย์ชุมชน แลกเปลี่ยนความคิดและเรียนรู้ร่วมกัน\nเปิดรับนักศึกษาทุกชั้นปี', location: 'ห้องเรียนรู้ร่วมกัน อาคาร B', capacity: 3,
      starts_at: '2099-01-02T09:00:00+07:00', ends_at: '2099-01-02T12:00:00+07:00', registration_closes_at: '2099-01-01T18:00:00+07:00' } });
    expect(r.status()).toBe(201); return (await r.json()).data;
  };
  const draft = await create('กิจกรรมชมรมที่กำลังเตรียม');
  const created = await create('เวิร์กช็อปออกแบบบริการเพื่อชุมชน');
  const publication = await page.request.post(`/api/organizer/events/${created.id}/publish`, { headers: { 'X-CSRF-Token': csrf }, data: {} });
  expect(publication.status()).toBe(200); const published = (await publication.json()).data;
  const shared = (await (await page.request.get(`/api/events/${published.id}`)).json()).data;
  // Keep visual examples compact; API creation/detail/registration remain real.
  let ownerRead: 'ready' | 'empty' | 'loading' | 'error' = 'ready', held: Route | undefined;
  await page.route('**/api/organizer/events', route => {
    if (ownerRead === 'loading') { held = route; return; }
    if (ownerRead === 'error') return route.abort();
    return route.fulfill({ json: { data: ownerRead === 'empty' ? [] : [published, draft] } });
  });
  await page.route('**/api/events', route => route.fulfill({ json: { data: [shared] } }));

  await page.goto('/organizer'); await inspect('overview', 'สวัสดี Organizer A');
  await page.goto('/organizer/events'); await inspect('owner-list', 'กิจกรรมของฉัน');
  ownerRead = 'empty'; await page.goto('/organizer');
  await expect(page.getByText('ยังไม่มีกิจกรรมที่สร้าง', { exact: true })).toBeVisible();
  await inspect('overview-empty', 'สวัสดี Organizer A');
  await page.goto('/organizer/events'); await expect(page.getByText('ยังไม่มีกิจกรรม', { exact: false })).toBeVisible();
  await inspect('owner-list-empty', 'กิจกรรมของฉัน');
  ownerRead = 'loading'; await page.goto('/organizer/events');
  await expect(page.getByText('กำลังโหลดกิจกรรม…', { exact: true })).toBeVisible();
  await inspect('owner-list-loading', 'กิจกรรมของฉัน');
  ownerRead = 'ready'; await held!.fulfill({ json: { data: [published, draft] } });
  await expect(page.getByRole('link', { name: published.title, exact: true })).toBeVisible();
  ownerRead = 'error'; await page.goto('/organizer/events');
  await expect(page.getByRole('alert')).toContainText('โหลดข้อมูลไม่สำเร็จ');
  await inspect('owner-list-error', 'กิจกรรมของฉัน'); ownerRead = 'ready';
  await page.goto('/organizer/events/new'); await inspect('create', 'สร้างกิจกรรม', true);
  await page.getByRole('button', { name: 'บันทึก DRAFT', exact: true }).click();
  await expect(page.getByText('กรุณากรอก 1–120 ตัวอักษร')).toBeVisible();
  await inspect('create-invalid', 'สร้างกิจกรรม', true);
  await page.goto(`/organizer/events/${draft.id}`); await inspect('draft-detail', draft.title, true);
  await page.goto(`/organizer/events/${published.id}`); await inspect('owner-detail', published.title, true);
  await page.getByRole('button', { name: 'ออกจากระบบ', exact: true }).click();
  // Wait for Logout to finish before a full navigation can abort its POST.
  await expect(page.getByRole('heading', { name: 'ลงชื่อ แล้วไปด้วยกัน', exact: true })).toBeVisible();
  await login(page, 'participant.a');
  await inspect('shared-list', 'สวัสดี Participant A');
  await page.goto('/events/'); await inspect('shared-list-slash', 'กิจกรรมในมหาวิทยาลัย');
  await page.goto(`/events/${published.id}`); await inspect('shared-detail', published.title, true);
  await page.goBack(); await expect(page).toHaveURL(/\/events\/?$/);
  await page.getByRole('link', { name: published.title, exact: true }).click();
  await expect(page.getByRole('heading', { name: published.title, exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'ลงทะเบียน', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'ลงทะเบียนสำเร็จ' })).toBeVisible();
  await page.getByRole('button', { name: 'รีเฟรชที่นั่ง', exact: true }).click();
  await inspect('registration-success', published.title, true);
  await expect(page.getByRole('link', { name: 'กลับรายการกิจกรรม', exact: true })).toHaveCount(0);
  await page.goto('/organizer'); await inspect('forbidden', 'ไม่มีสิทธิ์ใช้งาน', true);
  await page.goto('/events/00000000-0000-4000-8000-000000000000');
  await expect(page.getByRole('alert')).toContainText('ไม่พบกิจกรรมนี้');
  await inspect('missing', 'รายละเอียดกิจกรรม');

  // Maximum-length data must remain readable without breaking narrow layouts.
  await page.route(`**/api/events/${published.id}`, route => route.fulfill({ json: { data: { ...shared,
    title: 'A'.repeat(120), description: 'B'.repeat(2000), location: 'C'.repeat(200) } } }));
  await page.goto(`/events/${published.id}`); await expect(page.getByRole('heading', { name: 'A'.repeat(120) })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.route('**/api/auth/me', route => route.fulfill({ json: { data: { id: 'visual-participant', role: 'PARTICIPANT', display_name: 'ชื่อผู้ใช้ที่ยาวมาก'.repeat(6) } } }));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.locator('header')).toContainText('ชื่อผู้ใช้ที่ยาวมาก');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `${output}/${width}-long-content.png`, fullPage: false });
});
