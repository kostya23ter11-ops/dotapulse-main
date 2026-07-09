#!/usr/bin/env node
/**
 * Creates .env.local from .env.example and generates AUTH_SECRET + CRON_SECRET.
 * Usage:
 *   node scripts/setup-env.mjs              # local only
 *   node scripts/setup-env.mjs --vercel     # also push secrets to Vercel (production/preview/development)
 */

import { randomBytes } from 'node:crypto';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const envLocal = join(root, '.env.local');
const envExample = join(root, '.env.example');

const PRODUCTION_URL = 'https://dotapulse-main.vercel.app';
const pushToVercel = process.argv.includes('--vercel');

function generateSecret(bytes = 48) {
  return randomBytes(bytes).toString('base64');
}

function upsertLine(content, key, value) {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, 'm');
  if (pattern.test(content)) {
    return content.replace(pattern, line);
  }
  return `${content.trimEnd()}\n${line}\n`;
}

function ensureEnvLocal() {
  if (existsSync(envLocal)) {
    console.log('.env.local already exists — updating generated secrets only.');
    return readFileSync(envLocal, 'utf8');
  }

  if (!existsSync(envExample)) {
    console.error('Missing .env.example');
    process.exit(1);
  }

  copyFileSync(envExample, envLocal);
  console.log('Created .env.local from .env.example');
  return readFileSync(envLocal, 'utf8');
}

function pushVercelEnv(name, value, environments = ['production', 'preview', 'development']) {
  const vercelBin = join(root, 'node_modules', 'vercel', 'dist', 'index.js');
  if (!existsSync(vercelBin)) {
    console.error('Vercel CLI not found. Run: npm install');
    process.exit(1);
  }

  for (const env of environments) {
    const result = spawnSync(
      process.execPath,
      [vercelBin, 'env', 'add', name, env, '--force'],
      {
        cwd: root,
        input: `${value}\n`,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      }
    );

    if (result.status !== 0) {
      const err = (result.stderr || result.stdout || '').trim();
      console.error(`Failed to set ${name} (${env}): ${err}`);
      process.exit(1);
    }
    console.log(`Vercel: ${name} → ${env}`);
  }
}

let content = ensureEnvLocal();

const placeholders = new Set([
  'replace_with_long_random_string_32plus_chars',
  'super_random_string_here',
  'your_steam_api_key_here',
  'your_groq_api_key_here',
]);

function resolveSecret(key, minBytes) {
  const existing = content.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim();
  if (existing && !placeholders.has(existing)) {
    return existing;
  }
  return generateSecret(minBytes);
}

const authSecret = resolveSecret('AUTH_SECRET', 48);
const cronSecret = resolveSecret('CRON_SECRET', 32);

content = upsertLine(content, 'AUTH_SECRET', authSecret);
content = upsertLine(content, 'CRON_SECRET', cronSecret);

content = upsertLine(content, 'NEXT_PUBLIC_BASE_URL', 'http://localhost:3000');
writeFileSync(envLocal, content, 'utf8');

console.log('\nLocal .env.local ready.');
console.log(`  AUTH_SECRET      = ${authSecret.slice(0, 8)}… (${authSecret.length} chars)`);
console.log(`  CRON_SECRET      = ${cronSecret.slice(0, 8)}…`);
console.log('  NEXT_PUBLIC_BASE_URL = http://localhost:3000');
console.log('\nFill manually in .env.local:');
console.log('  STEAM_API_KEY  → https://steamcommunity.com/dev/apikey');
console.log('  GROQ_API_KEY   → https://console.groq.com/keys');
console.log('  KV_*           → Vercel Dashboard → Storage → KV (optional)');

if (pushToVercel) {
  console.log('\nPushing to Vercel (dotapulse-main)…');
  pushVercelEnv('AUTH_SECRET', authSecret);
  pushVercelEnv('CRON_SECRET', cronSecret);
  pushVercelEnv('NEXT_PUBLIC_BASE_URL', PRODUCTION_URL);
  console.log(`\nDone. Production URL: ${PRODUCTION_URL}`);
  console.log('Add STEAM_API_KEY and GROQ_API_KEY in Vercel → Settings → Environment Variables.');
  console.log('Then redeploy: npm run deploy');
}