const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  // Capture console logs to see React errors
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error' || type === 'warn') {
      console.log(`BROWSER ${type.toUpperCase()}: ${msg.text()}`);
    }
  });
  page.on('pageerror', err => console.log('BROWSER PAGE ERROR:', err.toString()));

  // -- 1. Test the landing page --
  console.log('\n=== Testing Landing Page ===');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
  const title = await page.title();
  console.log('Page title:', title);
  const bodyText = await page.$eval('body', el => el.innerText.slice(0, 200));
  console.log('Body preview:', bodyText.replace(/\n/g, ' '));

  // -- 2. Test the login page inputs --
  console.log('\n=== Testing Login Page ===');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
  const emailInput = await page.$('input[type="email"]');
  if (emailInput) {
    console.log('Found email input — typing...');
    await emailInput.type('test@example.com', { delay: 50 });
    const val = await page.$eval('input[type="email"]', el => el.value);
    console.log('Email input value after typing:', val);
    if (val === 'test@example.com') {
      console.log('✅ Login email input WORKS correctly!');
    } else {
      console.log('❌ Login email input is NOT working. Got:', val);
    }
  } else {
    console.log('❌ No email input found on /login');
  }

  // -- 3. Test the dashboard --
  console.log('\n=== Testing Dashboard Page ===');
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
  
  // Wait for textarea or redirect
  await new Promise(r => setTimeout(r, 2000));
  const currentUrl = page.url();
  console.log('Current URL after navigating to /dashboard:', currentUrl);

  const textarea = await page.$('textarea');
  if (textarea) {
    console.log('Found textarea — typing...');
    await textarea.type('Test HR message', { delay: 50 });
    const val = await page.$eval('textarea', el => el.value);
    console.log('Textarea value after typing:', val);
    if (val.includes('Test HR message')) {
      console.log('✅ Dashboard textarea WORKS correctly!');
    } else {
      console.log('❌ Dashboard textarea is NOT working. Got:', val);
    }
  } else {
    const inputs = await page.$$('input');
    console.log(`No textarea. Found ${inputs.length} input(s) instead.`);
    if (inputs.length > 0) {
      await inputs[0].type('test', { delay: 50 });
      const val = await inputs[0].evaluate(el => el.value);
      console.log('First input value after typing:', val);
      if (val === 'test') console.log('✅ Input WORKS correctly!');
      else console.log('❌ Input is NOT working. Got:', val);
    }
  }

  // -- 4. Check for React error overlay --
  const errorOverlay = await page.$('vite-error-overlay');
  if (errorOverlay) {
    console.log('\n❌ Vite/React ERROR OVERLAY is present! Page has a fatal error.');
  } else {
    console.log('\n✅ No Vite error overlay detected.');
  }

  await browser.close();
})();
