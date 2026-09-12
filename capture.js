// capture.js — drive the running coach web build and capture screenshots
// NOTE: No mock/seed data is injected. The app starts empty ("start from now");
// heart rate shows "—" unless a real device source provides it.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'screenshots');
fs.mkdirSync(OUT, { recursive: true });

const shot = async (page, name) => {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file });
  console.log('  saved', name);
};

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
  });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  const logs = [];
  page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', e => logs.push(`[pageerror] ${e.message}`));

  try {
    console.log('1) open app (no seed — real/empty state)');
    await page.goto('http://localhost:8081/', { waitUntil: 'load' });
    await page.waitForSelector('text=Run Coach AI', { timeout: 20000 });
    await shot(page, '01-login.png');

    console.log('2) login');
    const inputs = page.locator('input');
    await inputs.nth(0).fill('user');
    await inputs.nth(1).fill('password');
    await page.click('text=Sign In', { force: true });
    await page.waitForSelector('text=Welcome back', { timeout: 15000 });
    await new Promise(r => setTimeout(r, 800));
    await shot(page, '02-dashboard.png');

    console.log('3) history tab (empty — no mock data)');
    await page.click('text=History', { force: true });
    await page.waitForTimeout(1200);
    await shot(page, '03-history.png');

    console.log('4) training tab -> configure');
    await page.click('text=Home', { force: true });
    await page.waitForTimeout(500);
    await page.click('text=Training', { force: true });
    await page.waitForSelector('text=Configure Session', { timeout: 10000 });
    await page.waitForTimeout(500);
    await shot(page, '04-configure.png');

    console.log('5) achievements screen (via See All)');
    await page.click('text=Home', { force: true });
    await page.waitForTimeout(500);
    await page.click('text=See All', { force: true });
    await page.waitForTimeout(1500);
    await shot(page, '05-achievements.png');

    console.log('6) settings tab (browser back would leave the SPA, so reload instead)');
    await page.goto('http://localhost:8081/', { waitUntil: 'load' });
    await page.waitForSelector('text=Welcome back', { timeout: 20000 });
    await page.click('text=Settings', { force: true });
    await page.waitForSelector('text=Personal Details', { timeout: 15000 });
    await page.waitForTimeout(800);
    await shot(page, '06-settings.png');

    console.log('7) active run (HR shows "—", distance starts at 0.00 on the web build)');
    await page.click('text=Home', { force: true });
    await page.waitForTimeout(600);
    await page.click('text=Training', { force: true });
    await page.waitForSelector('text=Configure Session', { timeout: 15000 });
    await page.click('text=Generate My Workout', { force: true });
    await page.waitForTimeout(4000);
    await shot(page, '07-activerun.png');

  } catch (e) {
    console.error('SCRIPT ERROR:', e.message);
    await shot(page, 'error-state.png').catch(() => {});
  }

  console.log('\n--- console/page logs ---');
  console.log(logs.slice(-40).join('\n'));

  await browser.close();
  console.log('\nDONE. Screenshots in', OUT);
})();
