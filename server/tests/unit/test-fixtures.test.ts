import { describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { resetTestUsers } from '../../../scripts/test-fixtures.js';

describe('disposable test fixture guard', () => {
  it('refuses to mutate accounts when the connected database is not loungcheu_test', async () => {
    const upsert = vi.fn();
    const db = { $queryRaw: vi.fn().mockResolvedValue([{ name: 'application_database' }]), user: { upsert } } as unknown as PrismaClient;
    await expect(resetTestUsers(db, 'test-only-password')).rejects.toThrow('only reset accounts in loungcheu_test');
    expect(upsert).not.toHaveBeenCalled();
  });
});
