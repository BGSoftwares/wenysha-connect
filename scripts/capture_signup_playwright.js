const { chromium } = require('playwright');

(async () => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
  const signupUrl = `${baseUrl}/signup`;
  const captured = { request: null, response: null };

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('request', (req) => {
    try {
      if (req.method() === 'POST' && req.url().includes('/auth/signup/')) {
        captured.request = {
          url: req.url(),
          method: req.method(),
          headers: req.headers(),
          postData: req.postData(),
        };
        console.log('Captured request:', captured.request.url);
      }
    } catch (e) {
      console.error('request capture error', e);
    }
  });

  page.on('response', async (res) => {
    try {
      if (res.request().method() === 'POST' && res.url().includes('/auth/signup/')) {
        const body = await res.text().catch(() => '');
        captured.response = {
          status: res.status(),
          url: res.url(),
          body,
        };
        console.log('Captured response:', captured.response.status, captured.response.url);
      }
    } catch (e) {
      console.error('response capture error', e);
    }
  });

  await page.goto(signupUrl, { waitUntil: 'domcontentloaded' });

  // Fill form fields using placeholders
  await page.fill('input[placeholder="Enter your full name"]', process.env.FULL_NAME || 'UI Tester');
  const email = process.env.EMAIL || `ui_test_${Date.now()}@example.com`;
  await page.fill('input[placeholder="you@example.com"]', email);
  await page.fill('input[placeholder="Create a password"]', process.env.PASSWORD || 'Testpass123');
  await page.fill('input[placeholder="Confirm your password"]', process.env.PASSWORD || 'Testpass123');

  // Select role - click the Student button by its label
  await page.click('button:has-text("Student")');

  // Submit
  await Promise.all([
    page.waitForResponse((r) => r.url().includes('/auth/signup/') && r.request().method() === 'POST', { timeout: 10000 }),
    page.click('button:has-text("Create Account")'),
  ]).catch(() => null);

  // Wait a moment for capture
  await page.waitForTimeout(500);

  console.log('\n--- Network Capture ---');
  console.log('Request body:', captured.request ? captured.request.postData : 'not captured');
  console.log('Response status:', captured.response ? captured.response.status : 'not captured');
  console.log('Response body:', captured.response ? captured.response.body : 'not captured');

  await browser.close();
  // Exit non-zero if signup failed
  if (!captured.response || captured.response.status >= 400) process.exit(2);
  process.exit(0);
})();
