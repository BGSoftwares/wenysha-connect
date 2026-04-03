const puppeteer = require('puppeteer');

(async () => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
  const signupUrl = `${baseUrl}/signup`;
  const captured = { request: null, response: null };

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (req.method() === 'POST' && req.url().includes('/auth/signup/')) {
      captured.request = {
        url: req.url(),
        method: req.method(),
        headers: req.headers(),
        postData: req.postData(),
      };
      console.log('Captured request URL:', captured.request.url);
    }
    req.continue().catch(() => {});
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
        console.log('Captured response status:', captured.response.status);
      }
    } catch (e) {
      console.error('response capture error', e);
    }
  });

  await page.goto(signupUrl, { waitUntil: 'domcontentloaded' });

  await page.type('input[placeholder="Enter your full name"]', process.env.FULL_NAME || 'UI Puppeteer Tester');
  const email = process.env.EMAIL || `ui_puppeteer_${Date.now()}@example.com`;
  await page.type('input[placeholder="you@example.com"]', email);
  await page.type('input[placeholder="Create a password"]', process.env.PASSWORD || 'Testpass123');
  await page.type('input[placeholder="Confirm your password"]', process.env.PASSWORD || 'Testpass123');

  // Click role button
  await page.click('button:has-text("Student")').catch(async () => {
    // fallback: click first role button
    const btns = await page.$$('button');
    if (btns.length) await btns[0].click();
  });

  // Submit and wait for the network response
  await Promise.all([
    page.waitForResponse((r) => r.url().includes('/auth/signup/') && r.request().method() === 'POST', { timeout: 10000 }).catch(() => null),
    page.click('button:has-text("Create Account")'),
  ]);

  await page.waitForTimeout(500);

  console.log('\n--- Network Capture ---');
  console.log('Request body:', captured.request ? captured.request.postData : 'not captured');
  console.log('Response status:', captured.response ? captured.response.status : 'not captured');
  console.log('Response body:', captured.response ? captured.response.body : 'not captured');

  await browser.close();
  if (!captured.response || captured.response.status >= 400) process.exit(2);
  process.exit(0);
})();
