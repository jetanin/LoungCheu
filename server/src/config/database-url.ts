export function readDatabaseUrl(value: string | undefined): string {
  let parsed: URL;
  try { parsed = new URL(value ?? ''); }
  catch { throw new Error('DATABASE_URL must be a PostgreSQL URL with a host and database name'); }
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol) || !parsed.hostname || parsed.pathname.length <= 1 || parsed.hash) {
    throw new Error('DATABASE_URL must be a PostgreSQL URL with a host and database name');
  }
  return value!;
}

export function readTestDatabaseUrl(value: string | undefined): string {
  let url: string;
  try { url = readDatabaseUrl(value); }
  catch { throw new Error('Set TEST_DATABASE_URL to a PostgreSQL URL for the separate database loungcheu_test (see README)'); }
  const parsed = new URL(url);
  if (parsed.pathname !== '/loungcheu_test') {
    throw new Error('TEST_DATABASE_URL must name the separate database loungcheu_test (see README)');
  }
  return url;
}
