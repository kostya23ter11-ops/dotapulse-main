#!/usr/bin/env node
/**
 * Copies app env vars from dotapulse → dotapulse-main on Vercel.
 * Run after: vercel link --project dotapulse && vercel env pull .env.dotapulse --environment=production
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const sourceFiles = [
  join(root, '.env.dotapulse.dev'),
  join(root, '.env.dotapulse'),
];
const TARGET_PROJECT = 'dotapulse-main';
const PRODUCTION_URL = 'https://dotapulse-main.vercel.app';

const COPY_KEYS = [
  'AUTH_SECRET',
  'STEAM_API_KEY',
  'GROQ_API_KEY',
  'CRON_SECRET',
];

function parseEnvFile(path) {
  const result = new Map();
  if (!existsSync(path)) return result;
  const text = readFileSync(path, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (value) result.set(key, value);
  }
  return result;
}

function mergeSources() {
  const merged = new Map();
  for (const file of sourceFiles) {
    for (const [k, v] of parseEnvFile(file)) {
      if (!merged.has(k) || v.length > (merged.get(k)?.length || 0)) {
        merged.set(k, v);
      }
    }
  }
  return merged;
}

function pushVercelEnv(name, value, environments) {
  const vercelBin = join(root, 'node_modules', 'vercel', 'dist', 'index.js');
  for (const env of environments) {
    const result = spawnSync(
      process.execPath,
      [vercelBin, 'env', 'add', name, env, '--force'],
      { cwd: root, input: `${value}\n`, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    if (result.status !== 0) {
      throw new Error(
        `${name} (${env}): ${(result.stderr || result.stdout || '').trim()}`
      );
    }
    console.log(`✓ ${name} → ${TARGET_PROJECT} / ${env}`);
  }
}

// Link to target project
const link = spawnSync(
  process.execPath,
  [join(root, 'node_modules', 'vercel', 'dist', 'index.js'), 'link', '--project', TARGET_PROJECT, '--yes'],
  { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
);
if (link.status !== 0) {
  console.error('Failed to link dotapulse-main:', link.stderr || link.stdout);
  process.exit(1);
}
console.log(`Linked to ${TARGET_PROJECT}\n`);

const vars = mergeSources();
const missing = COPY_KEYS.filter((k) => !vars.get(k));
if (missing.length) {
  console.error('Missing values in pulled files:', missing.join(', '));
  console.error('Sensitive vars may be hidden — add them manually in Vercel dashboard.');
}

for (const key of COPY_KEYS) {
  const value = vars.get(key);
  if (!value) {
    console.log(`△ skip ${key} (empty in source pull)`);
    continue;
  }
  const envs =
    key === 'GROQ_API_KEY' || key === 'CRON_SECRET'
      ? ['production', 'preview']
      : ['production', 'preview', 'development'];
  pushVercelEnv(key, value, envs);
}

pushVercelEnv('NEXT_PUBLIC_BASE_URL', PRODUCTION_URL, [
  'production',
  'preview',
  'development',
]);

// Update local .env.local (preserve localhost URL)
const envLocalPath = join(root, '.env.local');
if (existsSync(envLocalPath)) {
  let local = readFileSync(envLocalPath, 'utf8');
  const upsert = (content, key, val) => {
    const line = `${key}=${val}`;
    const re = new RegExp(`^${key}=.*$`, 'm');
    return re.test(content) ? content.replace(re, line) : `${content.trimEnd()}\n${line}\n`;
  };
  for (const key of COPY_KEYS) {
    const v = vars.get(key);
    if (v) local = upsert(local, key, v);
  }
  local = upsert(local, 'NEXT_PUBLIC_BASE_URL', 'http://localhost:3000');
  writeFileSync(envLocalPath, local, 'utf8');
  console.log('\n✓ .env.local updated (keys copied, BASE_URL kept as localhost)');
}

console.log('\nDone. Run: npm run deploy');