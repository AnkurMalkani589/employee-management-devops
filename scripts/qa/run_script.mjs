/**
 * Focused QA runner for the phase verification script.
 *
 * Same launch strategy as shell_qa.mjs (installed Chrome over CDP, because the
 * Playwright-downloaded Chromium is blocked by Application Control), but runs
 * an arbitrary script module and reaps Chrome on exit.
 *
 * Usage: node scripts/qa/run_script.mjs <scriptPath> [baseUrl]
 */

import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const require = createRequire(resolve(HERE, '../../frontend/package.json'));

const CHROME = 'C:/Users/Ankur/AppData/Local/Google/Chrome/Application/chrome.exe';
const PORT = 9461;

const scriptPath = process.argv[2];
const BASE = process.argv[3] || 'http://127.0.0.1:8080';

if (!scriptPath) {
  console.error('usage: node scripts/qa/run_script.mjs <scriptPath> [baseUrl]');
  process.exit(2);
}

function killChrome() {
  try {
    const { execFileSync } = require('node:child_process');
    execFileSync(
      'powershell',
      [
        '-NoProfile',
        '-Command',
        `Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" | Where-Object { $_.CommandLine -like '*${PORT}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`,
      ],
      { stdio: 'ignore', timeout: 15000 },
    );
  } catch {
    /* best effort */
  }
}

async function main() {
  const { chromium } = require('patchright');

  const profile = resolve(process.env.TEMP || '/tmp', `qa-script-${Date.now()}`);
  mkdirSync(profile, { recursive: true });

  const child = spawn(
    CHROME,
    [
      '--headless=new',
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${profile}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      '--hide-scrollbars',
      'about:blank',
    ],
    { stdio: 'ignore' },
  );

  process.on('exit', () => {
    try {
      if (!child.killed) child.kill();
    } catch {
      /* gone */
    }
    killChrome();
  });

  let browser;
  for (let i = 0; i < 30; i += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      browser = await chromium.connectOverCDP(`http://127.0.0.1:${PORT}`);
      break;
    } catch {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  if (!browser) {
    console.log(JSON.stringify({ error: 'could not connect to chrome CDP' }, null, 2));
    killChrome();
    return 4;
  }

  const context = browser.contexts()[0] || (await browser.newContext());
  const page = context.pages()[0] || (await context.newPage());
  await page.emulateMedia({ colorScheme: 'dark' });

  const consoleErrors = [];
  const failedRequests = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200));
  });
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`.slice(0, 200)));
  page.on('requestfailed', (r) =>
    failedRequests.push(`${r.method()} ${r.url()} ${r.failure()?.errorText}`),
  );

  const mod = await import(pathToFileURL(resolve(scriptPath)).href);
  const result = await mod.default(page, { base: BASE });

  await browser.close().catch(() => { });
  killChrome();

  console.log(JSON.stringify({ result, consoleErrors, failedRequests }, null, 2));
  return consoleErrors.length === 0 && failedRequests.length === 0 ? 0 : 1;
}

main()
  .then((code) => process.exit(code))
  .catch((e) => {
    console.log(JSON.stringify({ error: String(e) }, null, 2));
    killChrome();
    process.exit(10);
  });