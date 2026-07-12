import { execSync } from 'child_process';

console.log('1. Deploying to production...');
const output = execSync('vercel deploy --prod --yes', { encoding: 'utf-8' });
console.log(output);

const urlMatch = output.match(/https:\/\/dotapulse-[a-z0-9]+-kostya23ter11-ops-projects\.vercel\.app/);
if (!urlMatch) {
  console.error('Could not find deployment URL');
  process.exit(1);
}

const deployUrl = urlMatch[0];
console.log(`2. Promoting ${deployUrl} to dotapulse.ru...`);
execSync(`vercel promote ${deployUrl} --yes`, { stdio: 'inherit' });

console.log('\nDone! dotapulse.ru is live.');
