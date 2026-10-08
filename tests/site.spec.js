import { test, expect } from '@playwright/test';
import { PNG } from 'pngjs';
import jsQR from 'jsqr';

const languages = {
  en: { cta: 'I accept the throne', done: 'Pledge accepted ✅' },
  ro: { cta: 'Gata, mă așez', done: 'Așa da, civilizat ✅' },
  ru: { cta: 'Окей, сажусь', done: 'Вот это по-человечески ✅' },
  hu: { cta: 'Oké, leülök', done: 'Na, ez már kultúra ✅' },
};

for (const [lang, copy] of Object.entries(languages)) {
  test(`${lang}: branding, complete translations, pledge, slogans and layout`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const failures = [];
    page.on('response', response => { if (response.status() >= 400) failures.push(response.url()); });
    await page.goto(`/?lang=${lang}`);
    await expect(page).toHaveTitle('STFD — Sit the Fuck Down');
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.locator('h1')).toHaveText('STFD.');
    await expect(page.locator('.brand-tagline')).toHaveText('Sit the Fuck Down.');
    await expect(page.locator('#pledge')).toHaveText(copy.cta);
    expect(await page.evaluate(() => Array.from(document.querySelectorAll('[data-i18n]')).every(node => {
      const value = translations[currentLang][node.dataset.i18n];
      return typeof value === 'string' && node.textContent === value;
    }))).toBe(true);
    await page.locator('#pledge').click();
    await expect(page.locator('#pledge')).toHaveText(copy.done);
    expect(await page.evaluate(() => translations[currentLang].pledges.includes(document.querySelector('#microcopy').textContent))).toBe(true);
    const firstSlogan = await page.locator('#line').textContent();
    await page.locator('#more').click();
    await expect(page.locator('#line')).not.toHaveText(firstSlogan);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(errors).toEqual([]);
    expect(failures).toEqual([]);
  });
}

test('language picker persists choice, resets pledge, and URL takes priority', async ({ page }) => {
  await page.goto('/');
  await page.locator('#pledge').click();
  for (const [lang, copy] of Object.entries(languages)) {
    await page.locator('#language-toggle').click();
    await expect(page.locator('#language-toggle')).toHaveAttribute('aria-expanded', 'true');
    await page.locator(`[data-lang="${lang}"]`).click();
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.locator('#pledge')).toHaveText(copy.cta);
    await expect(page.locator('#language-toggle')).toHaveAttribute('aria-expanded', 'false');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
  }
  await page.goto('/?lang=ro');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ro');
});

test('unsupported language falls back to English', async ({ page }) => {
  await page.goto('/?lang=unsupported');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#pledge')).toHaveText(languages.en.cta);
});

test('storage restrictions do not break the site or language switching', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new DOMException('Blocked', 'SecurityError'); };
    Storage.prototype.setItem = () => { throw new DOMException('Blocked', 'SecurityError'); };
  });
  await page.goto('/');
  await page.locator('#language-toggle').click();
  await page.locator('[data-lang="ru"]').click();
  await expect(page.locator('#pledge')).toHaveText(languages.ru.cta);
  expect(errors).toEqual([]);
});

test('menu closes on Escape and outside click; hidden options are not focusable', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-lang="en"]')).not.toBeVisible();
  await page.locator('#language-toggle').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('#pledge')).toBeFocused();
  await page.locator('#language-toggle').click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#language-toggle')).toHaveAttribute('aria-expanded', 'false');
  await page.locator('#language-toggle').click();
  await page.locator('h1').click();
  await expect(page.locator('#language-toggle')).toHaveAttribute('aria-expanded', 'false');
});

test('QR image downloads and PNG/SVG encode the live site', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('.qr-frame img')).toBeVisible();
  const downloadEvent = page.waitForEvent('download');
  await page.locator('.qr-link').click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('stfd-qr.png');
  expect(await download.failure()).toBeNull();
  const response = await request.get('/stfd-qr.png');
  expect(response.ok()).toBe(true);
  const png = PNG.sync.read(await response.body());
  expect(jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data).toBe('http://168.119.226.28:8123/');
  const svgPixels = await page.evaluate(async () => {
    const image = new Image();
    image.src = './stfd-qr.svg';
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 740;
    const context = canvas.getContext('2d');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, 740, 740);
    context.drawImage(image, 0, 0, 740, 740);
    return Array.from(context.getImageData(0, 0, 740, 740).data);
  });
  expect(jsQR(new Uint8ClampedArray(svgPixels), 740, 740)?.data).toBe('http://168.119.226.28:8123/');
});

test('only deployment files are served', async ({ request }) => {
  for (const asset of ['/', '/script.js', '/styles.css', '/stfd-qr.png', '/stfd-qr.svg']) {
    expect((await request.get(asset)).status()).toBe(200);
  }
  for (const privatePath of ['/.git/config', '/README.MD', '/package.json', '/tests/site.spec.js']) {
    expect((await request.get(privatePath)).status()).toBe(404);
  }
});

test('all languages fit narrow 320px screens', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  for (const lang of Object.keys(languages)) {
    await page.goto(`/?lang=${lang}`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    for (const selector of ['h1', '.hero-top', '.qr-card', '#pledge']) {
      const box = await page.locator(selector).boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(321);
    }
  }
});

test('works under a project-site subpath', async ({ page }) => {
  await page.route('**/stfd/**', async route => {
    const url = new URL(route.request().url());
    url.pathname = url.pathname.replace(/^\/stfd\//, '/');
    const response = await route.fetch({ url: url.href });
    await route.fulfill({ response });
  });
  const failures = [];
  page.on('response', response => { if (response.status() >= 400) failures.push(response.url()); });
  await page.goto('/stfd/?lang=hu');
  await expect(page.locator('#pledge')).toHaveText(languages.hu.cta);
  await expect(page.locator('.qr-frame img')).toBeVisible();
  expect(await page.locator('.qr-frame img').evaluate(image => image.naturalWidth > 0)).toBe(true);
  expect(failures).toEqual([]);
});
