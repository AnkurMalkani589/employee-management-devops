/**
 * Shell QA runner - drives the *installed* Chrome over CDP.
 *
 * Why this exists: the shared browser-automation skill hardcodes
 * `chromium.executablePath()` (a Playwright-downloaded Chromium) which Windows
 * Application Control blocks on this machine. The installed Chrome/Edge launch
 * fine, so this runner launches that instead and talks CDP to it.
 *
 * No application code is imported or modified - it only loads the running app
 * over HTTP and asserts/inspects it.
 *
 * Usage (from frontend/, so `patchright` resolves):
 *   node ../scripts/qa/shell_qa.mjs <baseUrl> [--shots <dir>]
 */

import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
// Resolve patchright from the frontend workspace (where it is installed) rather
// than from this script's own directory.
const require = createRequire(resolve(HERE, '../../frontend/package.json'));
const CHROME = 'C:/Users/Ankur/AppData/Local/Google/Chrome/Application/chrome.exe';
const PORT = 9411;

const BASE = process.argv[2] || 'http://127.0.0.1:8080';
const shotArg = process.argv.indexOf('--shots');
const SHOT_DIR = shotArg > -1 ? process.argv[shotArg + 1] : null;

function log(o) {
  console.log(JSON.stringify(o, null, 2));
}

async function main() {
  let chromium;
  try {
    ({ chromium } = require('patchright'));
  } catch (e) {
    log({ error: 'patchright not resolvable from cwd', detail: String(e) });
    return 2;
  }

  // Launch the installed Chrome detached, then connect over CDP.
  const profile = resolve(process.env.TEMP || '/tmp', `qa-chrome-${Date.now()}`);
  mkdirSync(profile, { recursive: true });

  // Launch the installed Chrome directly (no shell needed). The installed
  // browser is allowed to execute, unlike the WDAC-blocked Playwright Chromium.
  // Async + detached: Chrome is long-lived, so we must not block on it.
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
    { stdio: 'ignore', detached: true },
  );
  child.unref();

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
    log({ error: 'could not connect to chrome CDP', port: PORT });
    return 4;
  }

  const context = browser.contexts()[0] || (await browser.newContext());
  const page = context.pages()[0] || (await context.newPage());

  const consoleErrors = [];
  const failedRequests = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200));
  });
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`.slice(0, 200)));
  page.on('requestfailed', (r) => failedRequests.push(`${r.method()} ${r.url()} ${r.failure()?.errorText}`));

  const report = { base: BASE, browser: browser.version?.(), layouts: {}, layering: null };

  // Prefer dark for the visual pass so screenshots reflect the cinematic design
  // language. Emulated at the browser level BEFORE navigation so the theme hook
  // reads it on first mount. QA-only; the application is unchanged.
  await page.emulateMedia({ colorScheme: 'dark' });

  await page.goto(`${BASE}/#/${process.env.QA_ROUTE || 'dashboard'}`, {
    waitUntil: 'networkidle',
    timeout: 30000,
  });
  await page.waitForTimeout(900);

  // ---- Dashboard-specific assertions (real data + structure) ----
  // Scroll each metric into view first: the counters animate on viewport entry
  // (IntersectionObserver), so a top-of-page read would legitimately see 0.
  await page.evaluate(async () => {
    const metrics = [...document.querySelectorAll('.metric')];
    for (const m of metrics) {
      m.scrollIntoView({ block: 'center' });
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 700));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1800);

  report.dashboard = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const hero = q('.cc-hero__title');
    const metrics = document.querySelectorAll('.metric');
    const activity = document.querySelectorAll('.activity__item');
    const statusRows = document.querySelectorAll('.status-row');
    const svgs = document.querySelectorAll('.wf-map__svg');
    const dist = document.querySelectorAll('.dist__seg');
    return {
      heroText: hero ? hero.innerText.replace(/\s+/g, ' ').trim() : null,
      heroVisible: !!hero && hero.getBoundingClientRect().height > 0,
      metricCount: metrics.length,
      // Animated counters should have settled on a real number.
      metricValues: [...metrics].map((m) => m.querySelector('.metric__value')?.innerText.trim()),
      activityCount: activity.length,
      statusRowCount: statusRows.length,
      hasWorkforceMap: svgs.length > 0,
      // Every hub label is a real department name from the API.
      mapLabels: [...document.querySelectorAll('.wf-map__label')].map((t) => t.textContent),
      distributionSegments: dist.length,
      // No placeholder/em-dash metrics left over from loading.
      stillLoading: !!q('.metric__skeleton'),
    };
  });

  // Confirm the health panel shows real endpoint values (not fabricated).
  report.platformStatus = await page.evaluate(async () => {    try {
      const res = await fetch('/api/health');
      const body = await res.json();
      const text = document.querySelector('.cc-hero, .command-center')?.innerText || '';
      return {
        apiStatus: body.status,
        apiDatabase: body.database,
        apiVersion: body.version,
        showsOperational: /Operational/i.test(text),
        showsDatabase: /Database/i.test(text),
      };
    } catch (e) {
      return { error: String(e) };
    }
  });

  // Layering + structure snapshot (what a browser check must confirm).
  report.layering = await page.evaluate(() => {
    const ambient = document.querySelector('.ambient');
    const content = document.querySelector('.ambient-content');
    const shell = document.querySelector('.app-shell');
    const header = document.querySelector('.app-header');
    const el = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
    return {
      ambientExists: !!ambient,
      contentExists: !!content,
      shellDisplay: shell ? getComputedStyle(shell).display : null,
      contentDisplay: content ? getComputedStyle(content).display : null,
      contentColumns: content ? getComputedStyle(content).gridTemplateColumns : null,
      ambientZ: ambient ? getComputedStyle(ambient).zIndex : null,
      contentZ: content ? getComputedStyle(content).zIndex : null,
      ambientAnim: ambient ? getComputedStyle(ambient.querySelector('.ambient__glow--a')).animationName : null,
      headerBackdrop: header ? getComputedStyle(header).backdropFilter : null,
      topElementIsAmbient: !!el?.closest('.ambient'),
      topElementWithinContent: !!el?.closest('.ambient-content'),
    };
  });

  const sizes = [
    ['1440', 1440, 900],
    ['1280', 1280, 800],
    ['1024', 1024, 768],
    ['768', 768, 1024],
    ['390', 390, 844],
    ['360', 360, 800],
  ];

  if (SHOT_DIR) mkdirSync(SHOT_DIR, { recursive: true });

  for (const [name, w, h] of sizes) {
    await page.setViewportSize({ width: w, height: h });
    // eslint-disable-next-line no-await-in-loop
    await page.waitForTimeout(300);
    // eslint-disable-next-line no-await-in-loop
    const info = await page.evaluate(() => {
      const doc = document.documentElement;
      const header = document.querySelector('.app-header');
      const actions = document.querySelector('.app-header__actions');
      const crumb = document.querySelector('.app-header__crumb');
      const a = actions?.getBoundingClientRect();
      const c = crumb?.getBoundingClientRect();
      return {
        overflow: doc.scrollWidth - doc.clientWidth,
        headerHeight: header ? Math.round(header.getBoundingClientRect().height) : null,
        headerCollision: a && c ? c.right > a.left + 1 : false,
      };
    });
    report.layouts[name] = info;
    if (SHOT_DIR) {
      // eslint-disable-next-line no-await-in-loop
      await page.screenshot({ path: `${SHOT_DIR}/shell-${name}.png` });
    }
  }

  // Reduced-motion check: ambient animation must be disabled.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload({ waitUntil: 'networkidle' });
  report.reducedMotionAmbientAnim = await page.evaluate(() => {
    const g = document.querySelector('.ambient__glow--a');
    return g ? getComputedStyle(g).animationName : null;
  });

  report.consoleErrors = consoleErrors;
  report.failedRequests = failedRequests;
  await browser.close();

  log(report);
  return consoleErrors.length === 0 && failedRequests.length === 0 ? 0 : 1;
}

main()
  .then((code) => process.exit(code))
  .catch((e) => {
    log({ error: 'runner crashed', detail: String(e) });
    process.exit(10);
  });
