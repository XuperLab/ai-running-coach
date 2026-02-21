// test.js - End-to-end tests for AI Running Coach
const { chromium } = require('playwright');

(async () => {
  console.log('Starting E2E tests...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1200, height: 900 }
  });
  const page = await context.newPage();
  
  const results = [];
  
  try {
    // Test 1: Login screen loads
    console.log('Test 1: Login screen loads');
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    
    if (await page.content().then(c => c.includes('LOGIN'))) {
      results.push('✅ Login screen loads');
    } else {
      results.push('❌ Login screen failed to load');
      await browser.close(); return;
    }
    
    // Test 2: Login
    console.log('Test 2: Login');
    const inputs = await page.locator('input');
    await inputs.nth(0).fill('user');
    await inputs.nth(1).fill('password');
    
    // Attempt login by pressing Enter key on the password field
    await inputs.nth(1).press('Enter');
    await page.waitForTimeout(4000);
    
    if (await page.content().then(c => c.includes('START RUN'))) {
      results.push('✅ Login successful (via Enter key)');
    } else {
      // Last try: click anything that says LOGIN
      await page.click('div[role="button"]:has-text("LOGIN")', { force: true }).catch(() => {});
      await page.waitForTimeout(4000);
      if (await page.content().then(c => c.includes('START RUN'))) {
        results.push('✅ Login successful (via role click)');
      } else {
        results.push('❌ Login failed');
        await page.screenshot({ path: '/tmp/e2e-fail-dash.png' });
      }
    }
    
    if (await page.content().then(c => c.includes('START RUN'))) {
        // Test 3: Dashboard -> Generate
        console.log('Test 3: Dashboard -> Generate');
        await page.click('text=START RUN', { force: true });
        await page.waitForTimeout(2000);
        
        if (await page.content().then(c => c.includes('Generate Session'))) {
          results.push('✅ Generate Session screen loads');
        } else {
          results.push('❌ Generate Session screen missing');
        }
    }
    
    // Take final screenshot
    await page.screenshot({ path: '/tmp/e2e-final.png' });
    
  } catch (error) {
    console.error('Test error:', error);
    results.push(`❌ Error: ${error.message}`);
  }
  
  await browser.close();
  
  console.log('\n=== TEST RESULTS ===');
  results.forEach(r => console.log(r));
  console.log(`\nTotal: ${results.filter(r => r.startsWith('✅')).length}/${results.length} passed`);
  
})();
