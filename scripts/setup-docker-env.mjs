import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';

const port = (name, fallback) => {
  const value = process.env[name] ?? fallback;
  if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 65535) throw new Error(`Invalid ${name}`);
  return value;
};
const values = {
  DOCKER_DB_PASSWORD: randomBytes(24).toString('hex'),
  DOCKER_SESSION_SECRET: randomBytes(48).toString('hex'),
  DOCKER_DEMO_PASSWORD: randomBytes(24).toString('hex'),
  DOCKER_WEB_PORT: port('DOCKER_WEB_PORT', '5173'),
  DOCKER_API_PORT: port('DOCKER_API_PORT', '3000'),
  APP_VERSION: 'local-docker',
};
try {
  writeFileSync('.env.docker', Object.entries(values).map(([key, value]) => `${key}=${value}`).join('\n') + '\n', { flag: 'wx', mode: 0o600 });
  console.log('Created private .env.docker. Open it locally for demo credentials; do not share its contents.');
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
  console.log('Kept existing .env.docker unchanged.');
}
