import { defineConfig } from '@playwright/test';
import { randomBytes } from 'node:crypto';
process.env.E2E_PASSWORD ??= randomBytes(24).toString('hex');
export default defineConfig({
  testDir: './tests/e2e', fullyParallel: false, workers: 1,
  use: { baseURL: 'http://127.0.0.1:5173', browserName: 'chromium' },
  reporter: [['list']],
  webServer: [
    { command: 'npx tsx scripts/e2e-server.ts', url: 'http://127.0.0.1:3001/api/health', reuseExistingServer: false },
    { command: 'npm run dev -w client -- --port 5173 --strictPort', url: 'http://127.0.0.1:5173', env: { API_PROXY_TARGET: 'http://127.0.0.1:3001' }, reuseExistingServer: false },
  ],
});
