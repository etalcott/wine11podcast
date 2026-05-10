/**
 * Renders the Wine One One favicon mark at exact pixel sizes using Playwright
 * and writes the PNGs directly into public/.
 *
 * Usage: pnpm exec tsx scripts/export-favicons.ts
 */

import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');

const FONTS = `
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,wght@0,700;0,900;1,700;1,900&display=swap" rel="stylesheet" />
`;

const BASE_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 100%; height: 100%; }
  .fav-mark {
    background: #5b1726;
    color: #f4ead8;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const favicons: Array<{
  name: string;
  size: number;
  html: string;
}> = [
  {
    name: 'favicon-32x32.png',
    size: 32,
    html: `
      <style>
        ${BASE_CSS}
        .stack { display: flex; flex-direction: column; align-items: center; line-height: 1; }
        .glyph-w {
          font-family: "Bodoni Moda", serif; font-style: italic; font-weight: 900;
          font-size: 22px; line-height: 0.9; margin-top: -1px; letter-spacing: -0.02em;
        }
        .glyph-ones {
          font-family: "Bodoni Moda", serif; font-style: italic; font-weight: 700;
          font-size: 7px; letter-spacing: 0.18em; margin-top: 1px;
        }
      </style>
      <div class="fav-mark">
        <div class="stack">
          <div class="glyph-w">W</div>
          <div class="glyph-ones">1·1</div>
        </div>
      </div>
    `,
  },
  {
    name: 'favicon-16x16.png',
    size: 16,
    html: `
      <style>
        ${BASE_CSS}
        .glyph {
          font-family: "Bodoni Moda", serif; font-style: normal; font-weight: 900;
          font-size: 12px; letter-spacing: 0; line-height: 1;
        }
      </style>
      <div class="fav-mark">
        <div class="glyph">W</div>
      </div>
    `,
  },
  {
    // Apple touch icon — scale up the 32×32 design to 180×180
    name: 'apple-touch-icon.png',
    size: 180,
    html: `
      <style>
        ${BASE_CSS}
        .stack { display: flex; flex-direction: column; align-items: center; line-height: 1; }
        .glyph-w {
          font-family: "Bodoni Moda", serif; font-style: italic; font-weight: 900;
          font-size: ${Math.round(22 * (180 / 32))}px; line-height: 0.9; margin-top: -6px; letter-spacing: -0.02em;
        }
        .glyph-ones {
          font-family: "Bodoni Moda", serif; font-style: italic; font-weight: 700;
          font-size: ${Math.round(7 * (180 / 32))}px; letter-spacing: 0.18em; margin-top: 6px;
        }
      </style>
      <div class="fav-mark">
        <div class="stack">
          <div class="glyph-w">W</div>
          <div class="glyph-ones">1·1</div>
        </div>
      </div>
    `,
  },
];

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ deviceScaleFactor: 1 });

  for (const fav of favicons) {
    const page = await context.newPage();
    await page.setViewportSize({ width: fav.size, height: fav.size });

    await page.setContent(`<!doctype html><html><head>${FONTS}${fav.html}</head><body>${fav.html}</body></html>`);

    // Wait for Bodoni Moda to load before screenshotting
    await page.evaluate(() =>
      document.fonts.ready
    );

    const outPath = path.join(publicDir, fav.name);
    await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: fav.size, height: fav.size } });
    console.log(`✓ ${fav.name} (${fav.size}×${fav.size})`);

    await page.close();
  }

  await browser.close();
}

main().catch((err) => { console.error(err); process.exit(1); });
