#!/usr/bin/env node
/** Quick diagnostic: how much time is WASM vs Canvas2D rendering? */
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
    headless: true,
    protocolTimeout: 60000,
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1920,1080']
});
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });
await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 120000 });
await page.waitForFunction(() => window._app && window._app.node_count() > 100000, { timeout: 120000 });

// Test 1: WASM pan only (no render)
const wasmTimes = await page.evaluate(() => {
    const app = window._app;
    const times = [];
    for (let i = 0; i < 20; i++) {
        const t0 = performance.now();
        app.pan_start(500, 500);
        app.pan_move(500 + i * 3, 500 + i * 2);
        app.pan_end();
        times.push(performance.now() - t0);
    }
    return times.sort((a, b) => a - b);
});

// Test 2: render only (cache already built)
const renderTimes = await page.evaluate(() => {
    const render = window._render;
    // Warm up - first render builds cache
    render(true);
    const times = [];
    for (let i = 0; i < 20; i++) {
        const t0 = performance.now();
        render(true);
        times.push(performance.now() - t0);
    }
    return times.sort((a, b) => a - b);
});

// Test 3: how many items are actually drawn?
const drawCount = await page.evaluate(() => {
    // Check the scene cache size
    return window._app.node_count();
});

const wm = wasmTimes[10];
const rm = renderTimes[10];
console.log(`Nodes: ${drawCount}`);
console.log(`WASM pan (no render): ${wm.toFixed(2)}ms`);
console.log(`Render only (cached): ${rm.toFixed(2)}ms`);
console.log(`Total frame budget:   ${(wm + rm).toFixed(2)}ms`);
console.log(`Render is ${((rm / (wm + rm)) * 100).toFixed(0)}% of total`);
console.log(`Estimated FPS: ${Math.round(1000 / (wm + rm))}`);

await browser.close();
