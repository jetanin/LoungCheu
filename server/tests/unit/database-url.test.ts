import { describe, it, expect } from 'vitest';
import { readDatabaseUrl, readTestDatabaseUrl } from '../../src/config/database-url.js';

describe('database target validation', () => {
  it('accepts an explicit PostgreSQL target and its public-schema test URL', () => {
    const url = 'postgresql://example:synthetic@127.0.0.1:55432/loungcheu_test?schema=public';
    expect(readDatabaseUrl(url)).toBe(url);
    expect(readTestDatabaseUrl(url)).toBe(url);
  });
  it.each([undefined, '', 'postgresql://', 'postgresql://localhost/', 'sqlite://localhost/loungcheu_test',
    'postgresql://localhost/loungcheu_dev', 'postgresql://localhost/loungcheu_dev?marker=/loungcheu_test',
    'postgresql://localhost/loungcheu_test#fragment'])('refuses an invalid or non-test database %j', value => {
    expect(() => readTestDatabaseUrl(value)).toThrow();
  });
});
