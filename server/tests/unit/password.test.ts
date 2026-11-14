import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../../src/modules/accounts/password.js';
describe('TEST-05 salted scrypt', () => {
  it('uses independent salts, stores parameters, preserves password spaces and rejects a wrong password', async () => {
    const password = ' synthetic passphrase ';
    const a = await hashPassword(password), b = await hashPassword(password);
    expect(a).not.toBe(b);
    expect(a).toMatch(/^scrypt\$16384\$8\$1\$[a-f0-9]{32}\$[a-f0-9]{128}$/);
    expect(await verifyPassword(password, a)).toBe(true);
    expect(await verifyPassword(password.trim(), a)).toBe(false);
    expect(await verifyPassword('wrong', a)).toBe(false);
  });
  it.each(['', 'plaintext', 'scrypt$999999999$8$1$ab$ab'])('rejects unsupported or malformed hash %j', async stored => {
    expect(await verifyPassword('anything', stored)).toBe(false);
  });
});
