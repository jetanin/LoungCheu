import { describe, it, expect } from 'vitest';
import { readConfig } from '../../src/config/env.js';
const valid = { DATABASE_URL: 'postgresql://localhost/loungcheu_test', SESSION_SECRET: 'x'.repeat(48), APP_ORIGIN: 'http://127.0.0.1:5173' };
describe('F-01 config', () => {
  it('accepts local HTTP and requires explicit secure HTTPS in production', () => {
    expect(readConfig(valid).cookieSecure).toBe(false);
    expect(() => readConfig({ ...valid, NODE_ENV: 'production' })).toThrow();
    expect(readConfig({ ...valid, NODE_ENV: 'production', SESSION_COOKIE_SECURE: 'true', APP_ORIGIN: 'https://example.test' }).cookieSecure).toBe(true);
  });
  it.each([{ SESSION_SECRET: 'short' }, { DATABASE_URL: 'sqlite:file' }, { DATABASE_URL: 'postgresql://' }, { DATABASE_URL: 'postgresql://localhost/' }, { APP_ORIGIN: 'https://example.test/path' },
    { SESSION_COOKIE_SECURE: 'yes' }, { PORT: '1.5' }, { PORT: '0' }, { NODE_ENV: 'typo' }])('rejects invalid config %j', change => {
    expect(() => readConfig({ ...valid, ...change })).toThrow();
  });
});
