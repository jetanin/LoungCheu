import { defineConfig } from '@playwright/test';
import { randomBytes } from 'node:crypto';
process.env.E2E_PASSWORD ??= randomBytes(24).toString('hex');
const webPort = process.env.E2E_WEB_PORT ?? '5173', apiPort = process.env.E2E_API_PORT ?? '3001';
export default defineConfig({
  testDir: './tests/e2e', fullyParallel: false, workers: 1,
  use: { baseURL: `http://127.0.0.1:${webPort}`, browserName: 'chromium' },
  reporter: [['list']],
  webServer: [
    { command: 'node --import tsx scripts/e2e-server.ts', url: `http://127.0.0.1:${apiPort}/api/health`, reuseExistingServer: false },
    { command: `npm run dev -w client -- --port ${webPort} --strictPort`, url: `http://127.0.0.1:${webPort}`, env: { API_PROXY_TARGET: `http://127.0.0.1:${apiPort}` }, reuseExistingServer: false },
  ],
});
