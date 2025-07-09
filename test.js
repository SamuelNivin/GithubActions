const { chromium, webkit } = require('playwright');
const cp = require('child_process');

const clientPlaywrightVersion = cp.execSync('npx playwright --version').toString().trim().split(' ')[1];
console.log(`Local Playwright version: ${clientPlaywrightVersion}`);

const TARGET_OS = 'mac';       // 'mac' or 'windows'
const BROWSER_TYPE = 'webkit'; // 'chromium' or 'webkit'

let caps;

if (TARGET_OS === 'windows') {
  caps = {
    os: 'Windows',
    osVersion: '10',
    name: 'Test on Windows',
    build: 'Sample Build',
    project: 'BrowserStack Playwright Sample',
    'browserstack.username': process.env.BROWSERSTACK_USERNAME,
    'browserstack.accessKey': process.env.BROWSERSTACK_ACCESS_KEY,
    'browserstack.networkLogs': 'true',
    'browserstack.debug': 'true',
    'browserstack.playwrightVersion': '1.50.1',
    'browserstack.console': 'verbose',
    'browserstack.local': 'false',
    'browserstack.performance': 'assert',
    'client.playwrightVersion': clientPlaywrightVersion
  };
} else if (TARGET_OS === 'mac') {
  caps = {
    os: 'osx',
    osVersion: 'Ventura',
    name: 'Test on macOS',
    build: 'Sample Build',
    project: 'BrowserStack Playwright Sample',
    'browserstack.username': process.env.BROWSERSTACK_USERNAME,
    'browserstack.accessKey': process.env.BROWSERSTACK_ACCESS_KEY,
    'browserstack.networkLogs': 'true',
    'browserstack.debug': 'true',
    'browserstack.playwrightVersion': '1.50.1',
    'browserstack.console': 'verbose',
    'browserstack.local': 'false',
    'browserstack.performance': 'assert',
    'client.playwrightVersion': clientPlaywrightVersion
  };
}

(async () => {
  let browser;

  if (BROWSER_TYPE === 'chromium') {
    browser = await chromium.connect({
      wsEndpoint: `wss://cdp-aps.browserstack.com/playwright?caps=${encodeURIComponent(JSON.stringify(caps))}`,
    });
  } else if (BROWSER_TYPE === 'webkit') {
    browser = await webkit.connect({
      wsEndpoint: `wss://cdp-aps.browserstack.com/playwright?caps=${encodeURIComponent(JSON.stringify(caps))}`,
    });
  } else {
    console.error("Invalid browser type specified. Use 'chromium' or 'webkit'.");
    process.exit(1);
  }

  const context = await browser.newContext();
  const page = await context.newPage({
    ignoreHTTPSErrors: true,
    viewport: null,
  });

  page.on('console', (message) => {
    console.log(`Console Message: ${message.text()}`);
  });

  await page.goto('https://www.google.com');
  const title = await page.title();
  console.log(`Page title: ${title}`);

  const resp = await JSON.parse(await page.evaluate(_ => { }, `browserstack_executor: ${JSON.stringify({ action: 'getSessionDetails' })}`));
  console.log(`Session Details:\n`, resp);

  await page.evaluate(() => {
    console.warn('This is a warning message from browser console');
    console.log('This is a log message from browser console');
  });

  await page.screenshot({ path: `screenshot-${TARGET_OS}-${BROWSER_TYPE}.png` });

  try {
    await page.evaluate(_ => { }, `browserstack_executor: ${JSON.stringify({
      action: 'setSessionStatus',
      arguments: { status: 'passed', reason: 'Page title fetched successfully' }
    })}`);
  } catch {
    await page.evaluate(_ => { }, `browserstack_executor: ${JSON.stringify({
      action: 'setSessionStatus',
      arguments: { status: 'failed', reason: 'Error fetching title' }
    })}`);
  }

  await context.close({ reason: "test ended" });
  await page.close();
  await browser.close();
})();
