import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';
import { readTestDatabaseUrl } from '../../src/config/database-url.js';

export const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
export interface CommandResult { code: number | null; stdout: string; stderr: string; }

// This helper intentionally cannot create/drop databases on the original 5432
// target or an arbitrary remote server. It only owns random test names on the
// disposable Docker instance explicitly chosen by the user, or the repository's
// ephemeral PostgreSQL service while running inside GitHub Actions.
export async function withLifecycleDatabase<T>(work: (url: string, name: string) => Promise<T>): Promise<T> {
  const base = new URL(readTestDatabaseUrl(process.env.TEST_DATABASE_URL));
  const loopback = ['127.0.0.1', 'localhost'].includes(base.hostname);
  const approvedDocker = loopback && base.port === '55433';
  const githubService = loopback && (base.port || '5432') === '5432'
    && process.env.GITHUB_ACTIONS === 'true' && process.env.CI === 'true';
  if (!approvedDocker && !githubService) {
    throw new Error('Lifecycle disposable databases require Docker:55433 or the ephemeral GitHub Actions PostgreSQL service');
  }
  const name = `loungcheu_test_f06_${randomUUID().replaceAll('-', '')}`;
  if (!/^loungcheu_test_f06_[a-f0-9]{32}$/.test(name)) throw new Error('Invalid disposable database name');
  const admin = new Pool({ connectionString: base.href });
  let created = false;
  try {
    const actual = await admin.query('SELECT current_database() AS name');
    if (actual.rows[0]?.name !== 'loungcheu_test') throw new Error('Unexpected administrative test database');
    await admin.query(`CREATE DATABASE "${name}"`); created = true;
    const url = new URL(base); url.pathname = `/${name}`;
    return await work(url.href, name);
  } finally {
    try {
      // No FORCE: a leaked connection should fail the test, not be hidden.
      if (created) {
        const deadline = Date.now() + 3_000;
        while (Date.now() < deadline) {
          const active = await admin.query('SELECT COUNT(*)::int AS n FROM pg_stat_activity WHERE datname=$1', [name]);
          if (active.rows[0].n === 0) break;
          await new Promise(resolve => setTimeout(resolve, 25));
        }
        await admin.query(`DROP DATABASE "${name}"`);
      }
    } finally { await admin.end(); }
  }
}

export function runNode(args: string[], databaseUrl: string, extraEnv: Record<string, string> = {}): Promise<CommandResult> {
  return new Promise((resolveResult, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: repoRoot, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, DATABASE_URL: databaseUrl, NO_COLOR: '1', ...extraEnv },
    });
    let stdout = '', stderr = '', timedOut = false;
    const timeout = setTimeout(() => { timedOut = true; child.kill('SIGTERM'); }, 60_000);
    child.stdout.on('data', chunk => { stdout += String(chunk); });
    child.stderr.on('data', chunk => { stderr += String(chunk); });
    child.once('error', error => { clearTimeout(timeout); reject(error); });
    child.once('close', code => {
      clearTimeout(timeout);
      if (timedOut) reject(new Error('Lifecycle verification child command timed out'));
      else resolveResult({ code, stdout, stderr });
    });
  });
}

export async function deployLifecycleMigrations(databaseUrl: string, sprint1Only = false) {
  let config = join(repoRoot, 'server/prisma.config.ts'), temporary: string | undefined;
  const verificationRoot = resolve(repoRoot, '.local/verification');
  try {
    if (sprint1Only) {
      await mkdir(verificationRoot, { recursive: true });
      temporary = await mkdtemp(join(verificationRoot, 'f06-migrations-'));
      const migrations = join(temporary, 'migrations'); await mkdir(migrations);
      for (const name of ['202611060001_auth', '202611060002_registration_extension']) {
        await mkdir(join(migrations, name));
        await copyFile(join(repoRoot, 'server/prisma/migrations', name, 'migration.sql'), join(migrations, name, 'migration.sql'));
      }
      await writeFile(join(migrations, 'migration_lock.toml'), 'provider = "postgresql"\n');
      config = join(temporary, 'config.ts');
      await writeFile(config, `import { defineConfig, env } from 'prisma/config';\nexport default defineConfig({ schema: ${JSON.stringify(join(repoRoot, 'server/prisma/schema.prisma'))}, migrations: { path: ${JSON.stringify(migrations)} }, datasource: { url: env('DATABASE_URL') } });\n`);
    }
    return await runNode([join(repoRoot, 'node_modules/prisma/build/index.js'), 'migrate', 'deploy', '--config', config], databaseUrl);
  } finally {
    if (temporary) {
      const target = resolve(temporary);
      if (dirname(target) !== verificationRoot || !target.startsWith(join(verificationRoot, 'f06-migrations-'))) {
        throw new Error('Refusing to remove a path outside the owned verification directory');
      }
      await rm(target, { recursive: true, force: true });
    }
  }
}

export async function requireLifecycleMigrations(databaseUrl: string, sprint1Only = false) {
  const result = await deployLifecycleMigrations(databaseUrl, sprint1Only);
  if (result.code !== 0) throw new Error(`Lifecycle migration failed:\n${result.stdout}\n${result.stderr}`);
  return result;
}
