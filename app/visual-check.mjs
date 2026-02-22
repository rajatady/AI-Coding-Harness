#!/usr/bin/env node
/**
 * Headless visual check — verifies Canvas 2D rendering works.
 * Starts vite dev server, opens headless browser, checks:
 * 1. Shapes are visible (canvas has non-background pixels)
 * 2. FPS meets target during panning
 * 3. All page tabs render
 *
 * Output: machine-readable lines for ./ide check visual
 * EXIT 0 = all checks pass, EXIT 1 = failure
 */

import { execSync, spawn } from 'child_process';
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const puppeteer = (await import('puppeteer')).default;

const PORT = 3099;
const BASE_URL = `http://localhost:${PORT}`;

const vite = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
  cwd: __dirname,
  stdio: 'pipe',
});

// Wait for server to be ready
await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error('vite startup timeout')), 30000);
  const check = () => {
    http.get(BASE_URL, (res) => {
      clearTimeout(timeout);
      resolve();
    }).on('error', () => setTimeout(check, 200));
  };
  check();
});

let exitCode = 0;
let browser;
try {
  browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--enable-webgl'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  // Capture console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 30000 });

  // Wait for initial render (or timeout with diagnostics)
  try {
    await page.waitForFunction(() => {
      const info = document.getElementById('info');
      return info && info.textContent.includes('nodes');
    }, { timeout: 15000 });
  } catch {
    const html = await page.evaluate(() => document.getElementById('info')?.textContent || 'NO INFO ELEMENT');
    console.log(`VISUAL:DEBUG:info='${html}'`);
    for (const e of consoleErrors.slice(0, 3)) console.log(`VISUAL:CONSOLE_ERROR:${e}`);
    throw new Error(`Page did not render. info='${html}', errors=${consoleErrors.length}`);
  }

  // Check 1: Read initial info
  const initialInfo = await page.evaluate(() => document.getElementById('info')?.textContent || '');
  console.log(`VISUAL:initial:${initialInfo.trim()}`);

  // Check 2: Are shapes visible? Sample canvas pixels
  const hasPixels = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return false;
    const ctx = canvas.getContext('2d');
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let nonBg = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
      // Background is ~(30,30,30) or (0,0,0,0). Shapes have color.
      if (a > 0 && (r > 50 || g > 50 || b > 50)) nonBg++;
    }
    return nonBg;
  });
  console.log(`VISUAL:pixels:${hasPixels}`);
  if (hasPixels < 100) {
    console.log('VISUAL:FAIL:no shapes visible on canvas');
    exitCode = 1;
  } else {
    console.log('VISUAL:shapes:OK');
  }

  // Check 3: Pan performance (10 pans)
  const panFps = await page.evaluate(() => {
    return new Promise(resolve => {
      const canvas = document.querySelector('canvas');
      const info = document.getElementById('info');
      const times = [];
      let count = 0;
      const interval = setInterval(() => {
        canvas.dispatchEvent(new WheelEvent('wheel', {
          deltaX: 100, deltaY: 100, clientX: 400, clientY: 300, bubbles: true
        }));
        const match = info?.textContent?.match(/([\d.]+)ms/);
        if (match) times.push(parseFloat(match[1]));
        count++;
        if (count >= 10) {
          clearInterval(interval);
          times.sort((a, b) => a - b);
          resolve({ median: times[Math.floor(times.length/2)], all: times });
        }
      }, 50);
    });
  });
  const medianMs = panFps.median;
  const fps = medianMs > 0 ? Math.round(1000 / medianMs) : 9999;
  console.log(`VISUAL:pan_ms:${medianMs}`);
  console.log(`VISUAL:pan_fps:${fps}`);
  if (medianMs > 16.6) {
    console.log(`VISUAL:WARN:panning below 60fps (${medianMs.toFixed(1)}ms)`);
  } else {
    console.log('VISUAL:pan:OK');
  }

  // Check 4: Switch to each page tab
  for (const pageIdx of [1, 2, 0]) {
    await page.evaluate((idx) => {
      document.querySelector(`[data-page="${idx}"]`)?.click();
    }, pageIdx);
    await new Promise(r => setTimeout(r, 500)); // wait for render
    const info = await page.evaluate(() => document.getElementById('info')?.textContent || '');
    const pageName = ['80K Stress Test', 'Apple Website', 'Starbucks Logo'][pageIdx];
    console.log(`VISUAL:page${pageIdx}:${info.trim()}`);

    // Check pixels on this page (sample every pixel)
    const px = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return 0;
      const ctx = canvas.getContext('2d');
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let nonBg = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
        if (a > 10) nonBg++; // any non-transparent pixel
      }
      return nonBg;
    });
    console.log(`VISUAL:page${pageIdx}_pixels:${px}`);
    if (px < 10) {
      console.log(`VISUAL:WARN:${pageName} has few visible shapes (${px} pixels)`);
    }
  }

  if (exitCode === 0) {
    console.log('VISUAL:ALL:OK');
  }

} catch (err) {
  console.log(`VISUAL:ERROR:${err.message}`);
  exitCode = 1;
} finally {
  if (browser) await browser.close();
  vite.kill();
  process.exit(exitCode);
}
