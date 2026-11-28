import { test, expect, type Page } from '@playwright/test';
import { config } from 'dotenv';
import { createDatabaseClient } from '../../server/src/db/client.js';
import { readTestDatabaseUrl } from '../../server/src/config/database-url.js';
import { fillEventTime } from './event-form.js';

config({ path: '.env.test', quiet: true });

async function openCreate(page: Page) {
  await page.goto('/login');
  await page.getByLabel('ชื่อผู้ใช้').fill('organizer.a');
  await page.getByLabel('รหัสผ่าน').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
  await expect(page).toHaveURL(/\/events$/);
  await page.goto('/organizer/events/new');
  for (const [label, value] of [['รายละเอียด', 'd'], ['สถานที่', 'l'], ['จำนวนที่นั่ง', '2']]) {
    await page.getByLabel(label, { exact: true }).fill(value);
  }
  await fillEventTime(page, 'ปิดรับลงทะเบียน', '2099-06-01T09:00');
  await fillEventTime(page, 'เริ่มกิจกรรม', '2099-06-01T10:00');
  await fillEventTime(page, 'สิ้นสุดกิจกรรม', '2099-06-01T12:00');
}
async function cleanup(id?: string) {
  if (!id) return;
  const db = createDatabaseClient(readTestDatabaseUrl(process.env.TEST_DATABASE_URL));
  try {
    expect(await db.$queryRaw`SELECT current_database() AS name`).toEqual([{ name: 'loungcheu_test' }]);
    await db.event.delete({ where: { id } });
  } finally { await db.$disconnect(); }
}
async function readTitle(page: Page, id: string, title: string) {
  const response = await page.request.get(`/api/organizer/events/${id}`);
  expect(response.status()).toBe(200);
  expect((await response.json()).data).toMatchObject({ title, description: 'd', location: 'l' });
}

// Coverage addition on the implemented CR-01, not a new requirement or RED claim.
for (const title of ['  abc  ', '  🌱🌱🌱  ']) test(`INT-02/05 CR-01 trims real browser create/PATCH: ${title.trim()}`, async ({ page }) => {
  let id: string | undefined;
  try {
    await openCreate(page);
    await page.getByLabel('ชื่อกิจกรรม', { exact: true }).fill(title);
    const createdReply = page.waitForResponse(r => new URL(r.url()).pathname === '/api/organizer/events' && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'บันทึก DRAFT', exact: true }).click();
    const created = await createdReply;
    const data = (await created.json()).data;
    id = data?.id;
    expect(created.status()).toBe(201);
    expect(created.request().postDataJSON()).toMatchObject({ title: title.trim() });
    expect(id).toBeTruthy();
    await expect(page).toHaveURL(new RegExp(`/organizer/events/${id}$`));
    await readTitle(page, id!, title.trim());

    await page.getByRole('link', { name: 'แก้ไขกิจกรรม', exact: true }).click();
    const editedTitle = title.trim() === 'abc' ? '🌱🌱🌱' : 'abc';
    await page.getByLabel('ชื่อกิจกรรม', { exact: true }).fill(`  ${editedTitle}  `);
    const editedReply = page.waitForResponse(r => r.url().endsWith(`/api/organizer/events/${id}`) && r.request().method() === 'PATCH');
    await page.getByRole('button', { name: 'บันทึกการแก้ไข', exact: true }).click();
    const edited = await editedReply;
    expect(edited.status()).toBe(200);
    expect(edited.request().postDataJSON()).toEqual({ title: editedTitle });
    await expect(page).toHaveURL(new RegExp(`/organizer/events/${id}$`));
    await page.reload();
    await expect(page.getByRole('heading', { name: editedTitle, exact: true })).toBeVisible();
    await readTitle(page, id!, editedTitle);
  } finally { await cleanup(id); }
});

test('INT-03 CR-01 browser rejects 121 emoji and saves exactly 120 after trim', async ({ page }) => {
  let id: string | undefined;
  try {
    await openCreate(page);
    let posts = 0;
    page.on('request', r => { if (new URL(r.url()).pathname === '/api/organizer/events' && r.method() === 'POST') posts++; });
    await page.getByLabel('ชื่อกิจกรรม', { exact: true }).fill('🌱'.repeat(121));
    await page.getByRole('button', { name: 'บันทึก DRAFT', exact: true }).click();
    await expect(page.getByText('กรุณากรอก 3–120 ตัวอักษร', { exact: true })).toBeVisible();
    expect(posts).toBe(0);
    const title = '🌱'.repeat(120);
    await page.getByLabel('ชื่อกิจกรรม', { exact: true }).fill(`  ${title}  `);
    const createdReply = page.waitForResponse(r => new URL(r.url()).pathname === '/api/organizer/events' && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'บันทึก DRAFT', exact: true }).click();
    const created = await createdReply;
    id = (await created.json()).data?.id;
    expect(created.status()).toBe(201);
    expect(created.request().postDataJSON()).toMatchObject({ title });
    expect(posts).toBe(1);
    await expect(page).toHaveURL(new RegExp(`/organizer/events/${id}$`));
    await page.reload();
    await readTitle(page, id!, title);
  } finally { await cleanup(id); }
});
