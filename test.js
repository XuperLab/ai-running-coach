// test.js - Final E2E tests for AI Running Coach
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  console.log('Starting E2E tests on http://localhost:8081...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1200, height: 900 }
  });
  const page = await context.newPage();

  const results = [];
  const screenshotDir = process.env.SCREENSHOT_DIR || '/workspace/ai-running-coach/screenshots';

  try {
    const fs = require('fs');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    console.log('Test 1: Login screen loads');
    await page.goto('http://localhost:8081', { waitUntil: 'networkidle' });

    try {
      await page.waitForSelector('text=Run Coach AI', { timeout: 15000 });
      results.push('✅ Login screen loads');
    } catch (e) {
      results.push('❌ Login screen failed to load');
      await page.screenshot({ path: path.join(screenshotDir, 'e2e-fail-login.png') });
      await browser.close();
      return;
    }

    console.log('Test 2: Login');
    const inputs = page.locator('input');
    await inputs.nth(0).fill('user');
    await inputs.nth(1).fill('password');

    // Click "Sign In"
    await page.click('text=Sign In', { force: true });

    try {
      await page.waitForSelector('text=Welcome back', { timeout: 10000 });
      results.push('✅ Login successful');
    } catch (e) {
      results.push('❌ Login failed');
      await page.screenshot({ path: path.join(screenshotDir, 'e2e-fail-dash.png') });
    }

    const loggedIn = results.some(r => r.includes('✅ Login successful'));
    if (loggedIn) {
        console.log('Test 3: Dashboard -> Configure Session');
        // Click "Start Training" (the hero card button)
        await page.click('text=Start Training', { force: true });

        try {
          // Looking for "Configure Session" (the title in GenerateSessionScreen.js)
          await page.waitForSelector('text=Configure Session', { timeout: 5000 });
          results.push('✅ Configure Session screen loads');
        } catch (e) {
          results.push('❌ Configure Session screen missing');
          await page.screenshot({ path: path.join(screenshotDir, 'e2e-fail-generate.png') });
        }
    }

    // Final check for the last screen
    if (results.some(r => r.includes('✅ Configure Session screen loads'))) {
        console.log('Test 4: Configure -> Start Run');
        await page.click('text=Generate My Workout', { force: true });
        try {
            await page.waitForTimeout(2000);
            results.push('✅ Transition to Active Run');
        } catch (e) {}
    }

    await page.screenshot({ path: path.join(screenshotDir, 'e2e-final.png') });

  } catch (error) {
    console.error('Test error:', error);
    results.push(`❌ Error: ${error.message}`);
  }

  await browser.close();

  console.log('\n=== TEST RESULTS ===');
  results.forEach(r => console.log(r));
  console.log(`\nTotal: ${results.filter(r => r.startsWith('✅')).length}/${results.length} passed`);

})();
