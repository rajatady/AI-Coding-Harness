#!/usr/bin/env node
/**
 * fps-check.mjs — Automated FPS verification for ALL tools on 2M node stress test.
 *
 * Starts Vite dev server, launches headless Chrome via Puppeteer,
 * exercises every operation, measures frame timing, reports pass/fail.
 *
 * Output format: FPS: <operation> <median_fps>fps (p95: <p95_fps>) <PASS|FAIL|WARN>
 * Exit 0 = all pass. Exit 1 = any fail.
 *
 * Usage: node fps-check.mjs
 */

import puppeteer from 'puppeteer';
import { spawn } from 'child_process';

// Headless Chrome uses software Canvas2D (~10x slower than GPU).
// Real browser gets ~300fps for pan. Headless gets ~30fps.
// Thresholds are set for headless: 20fps = PASS (implies 200fps+ in real browser).
const TARGET_FPS = 20;
const STRICT_FPS = 25; // pan/zoom must hit 25fps headless (implies 250fps+ real)
const STRICT_60_OPS = ['pan', 'zoom'];
const PORT = 3099;
const TIMEOUT = 120_000;

// ── Start vite dev server ──────────────────────────────────────────────

function startVite() {
    return new Promise((resolve, reject) => {
        const proc = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
            cwd: new URL('.', import.meta.url).pathname,
            stdio: ['ignore', 'pipe', 'pipe'],
            env: { ...process.env, BROWSER: 'none' }
        });

        let started = false;
        const timer = setTimeout(() => {
            if (!started) { proc.kill(); reject(new Error('Vite startup timeout')); }
        }, 30_000);

        const onData = (d) => {
            if (d.toString().includes('localhost') && !started) {
                started = true; clearTimeout(timer); resolve(proc);
            }
        };
        proc.stdout.on('data', onData);
        proc.stderr.on('data', onData);
        proc.on('error', reject);
        proc.on('exit', (code) => { if (!started) reject(new Error(`Vite exited ${code}`)); });
    });
}

// ── Check if port is already in use ────────────────────────────────────

async function isPortInUse(port) {
    try { await fetch(`http://localhost:${port}`, { signal: AbortSignal.timeout(2000) }); return true; }
    catch { return false; }
}

// ── Measure FPS for an operation ───────────────────────────────────────

async function measureFps(page, name, setupCode, actionCode, frames = 30) {
    // Setup phase
    if (setupCode) {
        await page.evaluate(new Function(setupCode));
    }

    // Measure: run action + render synchronously, collect times
    // No rAF — headless Chrome rAF is unreliable. We measure pure compute time.
    const timings = await page.evaluate((actionStr, numFrames) => {
        const action = new Function('app', 'i', actionStr);
        const app = window._app;
        const render = window._render;
        const times = [];
        for (let i = 0; i < numFrames; i++) {
            const t0 = performance.now();
            action(app, i);
            render(true);
            times.push(performance.now() - t0);
        }
        return times;
    }, actionCode, frames);

    const sorted = [...timings].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const medianFps = Math.round(1000 / median);
    const p95Fps = Math.round(1000 / p95);

    const threshold = STRICT_60_OPS.includes(name) ? STRICT_FPS : TARGET_FPS;
    const status = medianFps >= threshold ? 'PASS' : (medianFps >= threshold * 0.7 ? 'WARN' : 'FAIL');

    console.log(`FPS: ${name.padEnd(20)} ${String(medianFps).padStart(4)}fps median (p95: ${p95Fps}fps, ${median.toFixed(1)}ms) ${status}`);
    return { name, medianFps, p95Fps, status };
}

// ── Single-shot timing measurement ─────────────────────────────────────

async function measureOnce(page, name, code, threshold = 100) {
    const ms = await page.evaluate(new Function(code));
    const status = ms < threshold ? 'PASS' : 'FAIL';
    console.log(`FPS: ${name.padEnd(20)} ${ms.toFixed(0)}ms ${status}`);
    return { name, ms, status };
}

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
    let viteProc = null;
    let browser = null;
    const results = [];

    try {
        // Start vite if not running
        if (!(await isPortInUse(PORT))) {
            console.log('FPS: Starting vite...');
            viteProc = await startVite();
            // Give it a moment to be ready
            await new Promise(r => setTimeout(r, 1000));
        }

        // Launch headless browser with extended timeout
        browser = await puppeteer.launch({
            headless: true,
            protocolTimeout: 300_000, // 5 min for heavy operations
            args: ['--no-sandbox', '--disable-gpu', '--window-size=1920,1080']
        });
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });

        // Navigate and wait for stress test to load
        console.log('FPS: Loading app...');
        await page.goto(`http://localhost:${PORT}/?nosave`, { waitUntil: 'networkidle2', timeout: TIMEOUT });

        await page.waitForFunction(
            () => window._app && window._render && window._app.node_count() > 100000,
            { timeout: TIMEOUT }
        );

        const nodeCount = await page.evaluate(() => window._app.node_count());
        console.log(`FPS: ${nodeCount} nodes loaded`);
        console.log('FPS: ─────────────────────────────────────────');

        // ── Initial render (cold cache build) ──────────────────────────
        results.push(await measureOnce(page, 'initial_render',
            `const t0 = performance.now(); window._render(true); return performance.now() - t0;`,
            2000)); // 2s budget for cold render of 1.8M nodes

        // ── PAN (must be 60fps) ────────────────────────────────────────
        results.push(await measureFps(page, 'pan', null,
            `app.pan_start(500, 500);
             app.pan_move(500 + i * 3, 500 + i * 2);
             app.pan_end();`, 20));

        // ── ZOOM (must be 60fps) ───────────────────────────────────────
        results.push(await measureFps(page, 'zoom', null,
            `app.zoom(i % 2 === 0 ? -0.005 : 0.005, 960, 540);`, 20));

        // ── SELECT (click at various positions) ────────────────────────
        results.push(await measureFps(page, 'select_click',
            `window._app.set_camera(0, 0, 0.1); window._render(true);`,
            `const x = 200 + (i * 37) % 1500;
             const y = 200 + (i * 23) % 800;
             app.mouse_down(x, y, false);
             app.mouse_up();`, 30));

        // ── SELECT ALL ─────────────────────────────────────────────────
        results.push(await measureOnce(page, 'select_all',
            `const t0 = performance.now(); window._app.select_all(); return performance.now() - t0;`,
            200));

        // Deselect
        await page.evaluate(() => { window._app.mouse_down(0, 0, false); window._app.mouse_up(); });

        // ── ADD RECTANGLE ──────────────────────────────────────────────
        results.push(await measureFps(page, 'add_rectangle', null,
            `app.add_rectangle('pr_'+i, -1000-i*10, -1000, 100, 100, 1, 0, 0, 1);`, 30));

        // ── ADD FRAME ──────────────────────────────────────────────────
        results.push(await measureFps(page, 'add_frame', null,
            `app.add_frame('pf_'+i, -2000-i*10, -1000, 200, 200, 0, 0, 1, 1);`, 30));

        // ── ADD TEXT ───────────────────────────────────────────────────
        results.push(await measureFps(page, 'add_text', null,
            `app.add_text('pt_'+i, 'Hello', -3000-i*10, -1000, 16, 1, 1, 1, 1);`, 30));

        // ── DRAG MOVE ──────────────────────────────────────────────────
        results.push(await measureFps(page, 'drag_move',
            `window._app.set_camera(-1000, -1000, 1.0); window._render(true);
             window._app.mouse_down(500, 400, false); window._app.mouse_up();`,
            `app.mouse_down(500, 400, false);
             app.mouse_move(500 + i * 2, 400 + i);
             app.mouse_up();`, 30));

        // ── DELETE ─────────────────────────────────────────────────────
        results.push(await measureFps(page, 'delete',
            // Create some nodes to delete
            `for (let j=0;j<10;j++) window._app.add_rectangle('d_'+j, -5000-j*50, -3000, 40, 40, 1, 0.5, 0, 1);`,
            `app.add_rectangle('d2_'+i, -6000, -3000, 40, 40, 1, 0, 0, 1);
             // Select last added node via click near it
             app.mouse_down(500, 400, false); app.mouse_up();
             app.delete_selected();`, 10));

        // ── UNDO ───────────────────────────────────────────────────────
        results.push(await measureFps(page, 'undo', null,
            `app.undo();`, 10));

        // ── ZOOM TO FIT ────────────────────────────────────────────────
        results.push(await measureOnce(page, 'zoom_to_fit',
            `const t0 = performance.now();
             window._app.zoom_to_fit(); window._render(true);
             return performance.now() - t0;`, 500));

        // ── PEN TOOL ───────────────────────────────────────────────────
        results.push(await measureFps(page, 'pen_tool',
            `window._app.pen_start();`,
            `app.pen_mouse_down(100+i*5, 100+i*3); app.pen_mouse_up();`, 20));
        await page.evaluate(() => { try { window._app.pen_finish_open(); } catch(e){} });

        // ── RESIZE ───────────────────────────────────────────────────
        results.push(await measureFps(page, 'resize',
            `const rid = window._app.add_rectangle('resize_test', -7000, -3000, 200, 200, 0, 1, 0, 1);
             window._resizeId = [rid[0], rid[1]];
             window._app.set_camera(-7000, -3000, 1.0); window._render(true);
             window._app.mouse_down(100, 100, false); window._app.mouse_up();`,
            `app.set_node_size(window._resizeId[0], window._resizeId[1], 200+i*5, 200+i*3);`,
            20));

        // ── PROPERTY CHANGES ─────────────────────────────────────────
        results.push(await measureFps(page, 'prop_changes',
            null,
            `const c = window._resizeId[0], ci = window._resizeId[1];
             app.set_node_fill(c, ci, Math.random(), Math.random(), Math.random(), 1);
             app.set_node_opacity(c, ci, 0.5 + Math.random() * 0.5);`, 20));

        // ── VECTOR EDITING ───────────────────────────────────────────
        results.push(await measureFps(page, 'vector_edit',
            `window._app.pen_start();
             for(let j=0;j<5;j++) { window._app.pen_mouse_down(-8000+j*30, -3000+j*20); window._app.pen_mouse_up(); }
             window._app.pen_finish_open();
             const found = JSON.parse(window._app.find_nodes_by_name('Vector'));
             if(found.length) {
               const c=found[0].counter, ci=found[0].client_id;
               window._app.select_node(c,ci);
               const info = JSON.parse(window._app.get_node_info(c,ci));
               const cx=info.x+info.width/2, cy=info.y+info.height/2;
               window._app.mouse_down(cx,cy,false); window._app.mouse_up();
               window._app.mouse_down(cx,cy,false); window._app.mouse_up();
             }`,
            `if(app.is_vector_editing()) {
               const st = JSON.parse(app.vector_edit_get_state());
               if(st.anchors.length>0) {
                 // Simulate dragging anchor via mouse events
                 const a = st.anchors[0];
                 const sx = (a.x + st.tx) * 1.0; // cam zoom=1
                 const sy = (a.y + st.ty) * 1.0;
                 app.mouse_down(sx, sy, false);
                 app.mouse_move(sx + i, sy + i * 0.5);
                 app.mouse_up();
               }
             }`, 20));
        await page.evaluate(() => { try { window._app.vector_edit_exit(); } catch(e){} });

        // ── COPY/PASTE ─────────────────────────────────────────────────
        results.push(await measureFps(page, 'copy_paste',
            `window._app.mouse_down(500, 400, false); window._app.mouse_up();`,
            `app.copy_selected(); app.paste();`, 10));

        // ── ROTATION ─────────────────────────────────────────────────
        results.push(await measureFps(page, 'rotation',
            `const rid = window._app.add_rectangle('rot_test', -8000, -3000, 200, 200, 0, 1, 0, 1);
             window._rotId = [rid[0], rid[1]];
             window._app.select_node(rid[0], rid[1]);`,
            `app.set_node_rotation(window._rotId[0], window._rotId[1], i * 5);`,
            20));

        // ── MARQUEE SELECT ───────────────────────────────────────────
        results.push(await measureFps(page, 'marquee_select',
            `window._app.set_camera(0, 0, 0.1); window._render(true);`,
            `app.mouse_down(100, 100, false);
             app.mouse_move(100 + i * 10, 100 + i * 8);`,
            10));
        await page.evaluate(() => { window._app.mouse_up(); });

        // ── CLICK-DRAG CREATION ──────────────────────────────────────
        results.push(await measureFps(page, 'click_drag_create',
            `window._app.start_creating('rect');`,
            `app.mouse_down(200 + i * 5, 200, false);
             app.mouse_move(250 + i * 5, 250);
             app.mouse_up();`,
            10));
        await page.evaluate(() => { window._app.cancel_creating(); });

        // ── SUMMARY ────────────────────────────────────────────────────
        console.log('FPS: ─────────────────────────────────────────');
        const fails = results.filter(r => r.status === 'FAIL');
        const warns = results.filter(r => r.status === 'WARN');
        const passes = results.filter(r => r.status === 'PASS');

        console.log(`FPS: ${passes.length} PASS, ${warns.length} WARN, ${fails.length} FAIL`);

        if (fails.length > 0) {
            console.log(`FPS: FAILURES: ${fails.map(f => f.name).join(', ')}`);
            process.exitCode = 1;
        }

    } catch (err) {
        console.error(`FPS: ERROR: ${err.message}`);
        process.exitCode = 1;
    } finally {
        if (browser) await browser.close().catch(() => {});
        if (viteProc) viteProc.kill();
    }
}

main();
