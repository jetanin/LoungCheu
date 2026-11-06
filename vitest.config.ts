import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';
config({ path: '.env.test', override: false, quiet: true });
export default defineConfig({
  test: {
    include: ['server/tests/**/*.test.ts', 'client/src/**/*.test.{ts,tsx}'],
    fileParallelism: false,
    testTimeout: 15000,
    hookTimeout: 30000,
    environment: 'node',
  },
});
