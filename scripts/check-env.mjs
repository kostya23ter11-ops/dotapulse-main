#!/usr/bin/env node
/**
 * Validates required/recommended environment variables.
 * Loads .env.local when present (Next.js convention).
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const envLocal = join(root, '.env.local');

function loadDotEnv(path) {
  if (!existsSync(path)) return;
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
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadDotEnv(envLocal);

const isProd = process.argv.includes('--production');
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || '';

const checks = [
  {
    key: 'AUTH_SECRET',
    required: true,
    validate: (v) => v.length >= 32,
    hint: '≥32 chars. Generate: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64\'))"',
  },
  {
    key: 'NEXT_PUBLIC_BASE_URL',
    required: isProd,
    validate: (v) => {
      if (v.endsWith('/')) return false;
      if (isProd) return /^https:\/\/[^/]+/.test(v);
      return /^https?:\/\/[^/]+/.test(v);
    },
    hint: isProd
      ? 'Production: https://dotapulse-main.vercel.app (no trailing slash)'
      : 'Local: http://localhost:3000',
  },
  {
    key: 'STEAM_API_KEY',
    required: false,
    validate: (v) => v.length >= 10 && !v.includes('your_steam'),
    hint: 'https://steamcommunity.com/dev/apikey — player names & Steam login enrichment',
  },
  {
    key: 'GROQ_API_KEY',
    required: false,
    validate: (v) => v.startsWith('gsk_') || (v.length >= 20 && !v.includes('your_groq')),
    hint: 'https://console.groq.com/keys — AI chat & news enrichment',
  },
  {
    key: 'CRON_SECRET',
    required: isProd,
    validate: (v) => v.length >= 16 && !v.includes('super_random'),
    hint: 'Protects /api/cron/refresh-news. Vercel sends Bearer token automatically.',
  },
  {
    key: 'KV_REST_API_URL',
    required: false,
    pairedWith: 'KV_REST_API_TOKEN',
    validate: (v) => v.startsWith('https://'),
    hint: 'Vercel KV — shared cache & rate limits across serverless instances',
  },
  {
    key: 'KV_REST_API_TOKEN',
    required: false,
    pairedWith: 'KV_REST_API_URL',
    validate: (v) => v.length >= 10,
    hint: 'Pair with KV_REST_API_URL',
  },
];

let errors = 0;
let warnings = 0;

console.log(isProd ? 'Checking production env…\n' : 'Checking local env…\n');

for (const check of checks) {
  const raw = (process.env[check.key] || '').trim();
  const placeholder =
    !raw ||
    raw.includes('your_') ||
    raw.includes('replace_with') ||
    raw.includes('super_random');

  let ok = !placeholder && check.validate(raw);

  if (check.pairedWith) {
    const pair = (process.env[check.pairedWith] || '').trim();
    if ((raw && !pair) || (!raw && pair)) {
      ok = false;
    }
    if (!raw && !pair) {
      console.log(`○ ${check.key} — optional (not set, using in-memory fallback)`);
      continue;
    }
  }

  if (ok) {
    console.log(`✓ ${check.key}`);
    continue;
  }

  const msg = `${check.required ? '✗' : '△'} ${check.key}${raw && !placeholder ? ' (invalid value)' : ' (missing)'}`;
  console.log(msg);
  console.log(`  → ${check.hint}`);
  if (check.required) errors += 1;
  else warnings += 1;
}

if (isProd && baseUrl && baseUrl !== 'https://dotapulse-main.vercel.app') {
  console.log(`△ NEXT_PUBLIC_BASE_URL is "${baseUrl}" — on Vercel use https://dotapulse-main.vercel.app`);
  warnings += 1;
}

console.log('');
if (errors > 0) {
  console.log(`Failed: ${errors} required variable(s) missing.`);
  process.exit(1);
}

if (warnings > 0) {
  console.log(`OK with ${warnings} recommendation(s) to fill.`);
} else {
  console.log('All checks passed.');
}