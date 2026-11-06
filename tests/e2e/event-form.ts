import type { Page } from '@playwright/test';

export async function fillEventTime(page: Page, label: string, local: string) {
  const [date, time] = local.split('T');
  await page.getByLabel(`วันที่${label}`, { exact: true }).fill(date);
  await page.getByLabel(`เวลา${label}`, { exact: true }).fill(time);
}
