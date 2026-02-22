#!/usr/bin/env node
/**
 * FPS measurement tool — headless, automated.
 * Boots vite, loads the app, pans with 80K objects, measures real frame times.
 * Output: machine-readable FPS:key:value lines.
 * EXIT 0 = 60fps achieved, EXIT 1 = below target.
 */

import { spawn } from 'child_process';
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const puppeteer = (await import('puppeteer')).default;

const PORT = 3098;
const BASE_URL = `http://localhost:${PORT}`;

// Start vite
const vite = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
  cwd: __dirname,
  stdio: 'pipe',
});

// Wait for server
await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error('vite startup timeout')), 30000);
  const check = () => {
    http.get(BASE_URL, () => { clearTimeout(timeout); resolve(); })
      .on('error', () => setTimeout(check, 200));
  };
  check();
});

let exitCode = 0;
let browser;
try {
  browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--enable-webgl'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  // Capture errors
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 60000 });

  // Wait for initial render
  try {
    await page.waitForFunction(() => {
      const info = document.getElementById('info');
      return info && info.textContent.includes('nodes');
    }, { timeout: 30000 });
  } catch {
    const html = await page.evaluate(() => document.getElementById('info')?.textContent || 'NO INFO');
    console.log(`FPS:ERROR:page did not render: ${html}`);
    errors.slice(0, 3).forEach(e => console.log(`FPS:ERROR:${e}`));
    throw new Error('Page did not render');
  }

  // Read initial state
  const initialInfo = await page.evaluate(() => document.getElementById('info')?.textContent || '');
  console.log(`FPS:initial:${initialInfo.trim()}`);

  // Wait for scene cache to build (first render is cold)
  await new Promise(r => setTimeout(r, 500));

  // Measure: 30 pan events, read frame time from info bar after each
  const frameTimes = await page.evaluate(() => {
    return new Promise(resolve => {
      const canvas = document.querySelector('canvas');
      const info = document.getElementById('info');
      const times = [];
      let count = 0;
      const interval = setInterval(() => {
        // Simulate pan via wheel event
        canvas.dispatchEvent(new WheelEvent('wheel', {
          deltaX: 80, deltaY: 60, clientX: 640, clientY: 360, bubbles: true
        }));
        // Read frame time from info bar (format: "N nodes | X.Xms (~Yfps) [Vector]")
        const match = info?.textContent?.match(/([\d.]+)ms/);
        if (match) times.push(parseFloat(match[1]));
        count++;
        if (count >= 30) {
          clearInterval(interval);
          resolve(times);
        }
      }, 50); // 50ms between events = 20Hz input rate
    });
  });

  if (frameTimes.length === 0) {
    console.log('FPS:ERROR:no frame times captured');
    exitCode = 1;
  } else {
    // Compute stats
    frameTimes.sort((a, b) => a - b);
    const median = frameTimes[Math.floor(frameTimes.length / 2)];
    const p95 = frameTimes[Math.floor(frameTimes.length * 0.95)];
    const p99 = frameTimes[Math.floor(frameTimes.length * 0.99)];
    const min = frameTimes[0];
    const max = frameTimes[frameTimes.length - 1];
    const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;

    const medianFps = median > 0 ? Math.round(1000 / median) : 9999;
    const p95Fps = p95 > 0 ? Math.round(1000 / p95) : 9999;

    console.log(`FPS:samples:${frameTimes.length}`);
    console.log(`FPS:median_ms:${median.toFixed(1)}`);
    console.log(`FPS:avg_ms:${avg.toFixed(1)}`);
    console.log(`FPS:p95_ms:${p95.toFixed(1)}`);
    console.log(`FPS:p99_ms:${p99.toFixed(1)}`);
    console.log(`FPS:min_ms:${min.toFixed(1)}`);
    console.log(`FPS:max_ms:${max.toFixed(1)}`);
    console.log(`FPS:median_fps:${medianFps}`);
    console.log(`FPS:p95_fps:${p95Fps}`);

    if (median > 16.6) {
      console.log(`FPS:FAIL:median ${median.toFixed(1)}ms > 16.6ms (below 60fps)`);
      exitCode = 1;
    } else if (p95 > 16.6) {
      console.log(`FPS:WARN:p95 ${p95.toFixed(1)}ms > 16.6ms (occasional drops below 60fps)`);
      console.log(`FPS:PASS:median ${medianFps}fps`);
    } else {
      console.log(`FPS:PASS:${medianFps}fps median, ${p95Fps}fps p95`);
    }
  }

  // Measure edit operations (these trigger mark_dirty -> scene rebuild)
  // We'll click to select, then delete, then undo — each forces a full scene rebuild
  const editTimes = await page.evaluate(() => {
    return new Promise(resolve => {
      const canvas = document.querySelector('canvas');
      const info = document.getElementById('info');
      const times = [];

      // Simulate 5 click-select operations (each triggers mark_dirty)
      let count = 0;
      const interval = setInterval(() => {
        // Click different positions to select different nodes
        const x = 200 + count * 50;
        const y = 200 + count * 30;
        canvas.dispatchEvent(new MouseEvent('mousedown', {
          clientX: x, clientY: y, bubbles: true
        }));
        canvas.dispatchEvent(new MouseEvent('mouseup', {
          clientX: x, clientY: y, bubbles: true
        }));

        // Read the frame time
        const match = info?.textContent?.match(/([\d.]+)ms/);
        if (match) times.push(parseFloat(match[1]));
        count++;
        if (count >= 10) {
          clearInterval(interval);
          resolve(times);
        }
      }, 200); // 200ms between edits to let each complete
    });
  });

  if (editTimes.length > 0) {
    editTimes.sort((a, b) => a - b);
    const editMedian = editTimes[Math.floor(editTimes.length / 2)];
    const editP95 = editTimes[Math.floor(editTimes.length * 0.95)];
    const editMedianFps = editMedian > 0 ? Math.round(1000 / editMedian) : 9999;
    console.log(`FPS:edit_median_ms:${editMedian.toFixed(1)}`);
    console.log(`FPS:edit_p95_ms:${editP95.toFixed(1)}`);
    console.log(`FPS:edit_median_fps:${editMedianFps}`);
    if (editMedian > 16.6) {
      console.log(`FPS:EDIT_WARN:edit operations at ${editMedianFps}fps (${editMedian.toFixed(1)}ms)`);
    } else {
      console.log(`FPS:EDIT_PASS:${editMedianFps}fps`);
    }
  }

} catch (err) {
  console.log(`FPS:ERROR:${err.message}`);
  exitCode = 1;
} finally {
  if (browser) await browser.close();
  vite.kill();
  process.exit(exitCode);
}
