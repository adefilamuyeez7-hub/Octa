const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173/dashboard');
  console.log('Page loaded');
  
  await page.waitForSelector('textarea');
  console.log('Textarea found, typing...');
  
  const start = Date.now();
  await page.type('textarea', 'testing lag');
  console.log('Typed in', Date.now() - start, 'ms');
  
  await browser.close();
})();
