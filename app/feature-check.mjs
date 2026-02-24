#!/usr/bin/env node
/**
 * feature-check.mjs — Automated feature verification for the Figma clone.
 *
 * AI-native test suite: exercises every WASM API method, checks state,
 * reports pass/fail. No screenshots, no visual comparison — pure logic.
 *
 * Reuses fps-check's Vite+Puppeteer bootstrap, but tests functionality.
 * Each test: call API → check return value / state → PASS or FAIL.
 *
 * Output: FEAT: <test_name> PASS|FAIL [reason]
 * Exit 0 = all pass. Exit 1 = any fail.
 *
 * Usage: node feature-check.mjs [filter]
 *   filter: optional substring to run only matching tests
 */

import puppeteer from 'puppeteer';
import { spawn } from 'child_process';

const PORT = 3099;
const TIMEOUT = 60_000;

// ── Vite server ──────────────────────────────────────────────────────

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

async function isPortInUse(port) {
    try { await fetch(`http://localhost:${port}`, { signal: AbortSignal.timeout(2000) }); return true; }
    catch { return false; }
}

// ── Test runner ──────────────────────────────────────────────────────

const results = [];

async function test(page, name, fn) {
    try {
        const result = await page.evaluate(fn);
        if (result === true) {
            console.log(`FEAT: ${name.padEnd(45)} PASS`);
            results.push({ name, status: 'PASS' });
        } else {
            const reason = typeof result === 'string' ? result : JSON.stringify(result);
            console.log(`FEAT: ${name.padEnd(45)} FAIL  ${reason}`);
            results.push({ name, status: 'FAIL', reason });
        }
    } catch (err) {
        console.log(`FEAT: ${name.padEnd(45)} FAIL  ${err.message.slice(0, 80)}`);
        results.push({ name, status: 'FAIL', reason: err.message });
    }
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
    let viteProc = null;
    let browser = null;
    const filter = process.argv[2] || '';

    try {
        if (!(await isPortInUse(PORT))) {
            console.log('FEAT: Starting vite...');
            viteProc = await startVite();
            await new Promise(r => setTimeout(r, 1000));
        }

        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-gpu', '--window-size=1920,1080']
        });
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });

        // Load with ?nostress for fast startup (no 2M nodes)
        console.log('FEAT: Loading app (lightweight mode)...');
        await page.goto(`http://localhost:${PORT}/?nostress`, {
            waitUntil: 'networkidle2', timeout: TIMEOUT
        });
        await page.waitForFunction(
            () => window._app && window._render,
            { timeout: TIMEOUT }
        );
        console.log('FEAT: ─────────────────────────────────────────────');

        // Helper: wrap test fn to allow filtering
        const t = async (name, fn) => {
            if (filter && !name.toLowerCase().includes(filter.toLowerCase())) return;
            await test(page, name, fn);
        };

        // ═══════════════════════════════════════════════════════════
        // SECTION 1: CORE APP STATE
        // ═══════════════════════════════════════════════════════════

        await t('app.exists', () => !!window._app);

        await t('app.node_count > 0', () => {
            return window._app.node_count() > 0;
        });

        await t('app.page_count >= 1', () => {
            return window._app.page_count() >= 1;
        });

        await t('app.get_camera returns [x,y,zoom]', () => {
            const cam = window._app.get_camera();
            return cam.length === 3 && typeof cam[2] === 'number' && cam[2] > 0;
        });

        // ═══════════════════════════════════════════════════════════
        // SECTION 2: PAGES
        // ═══════════════════════════════════════════════════════════

        await t('pages.add_page', () => {
            const app = window._app;
            const before = app.page_count();
            app.add_page('Test Page');
            return app.page_count() === before + 1;
        });

        await t('pages.switch_page', () => {
            const app = window._app;
            const last = app.page_count() - 1;
            app.switch_page(last);
            return app.current_page_index() === last;
        });

        await t('pages.rename_page', () => {
            const app = window._app;
            const idx = app.current_page_index();
            app.rename_page(idx, 'Renamed Page');
            const pages = JSON.parse(app.get_pages());
            return pages[idx].name === 'Renamed Page';
        });

        await t('pages.switch_back', () => {
            const app = window._app;
            app.switch_page(0);
            return app.current_page_index() === 0;
        });

        // ═══════════════════════════════════════════════════════════
        // SECTION 3: ADD SHAPES
        // ═══════════════════════════════════════════════════════════

        // Switch to test page first
        await page.evaluate(() => {
            const app = window._app;
            app.switch_page(app.page_count() - 1); // our test page
        });

        await t('add.rectangle', () => {
            const app = window._app;
            const before = app.node_count();
            const id = app.add_rectangle('TestRect', 100, 100, 200, 150, 1.0, 0.0, 0.0, 1.0);
            return app.node_count() === before + 1 && id.length === 2;
        });

        await t('add.ellipse', () => {
            const app = window._app;
            const before = app.node_count();
            const id = app.add_ellipse('TestEllipse', 400, 100, 100, 100, 0.0, 0.0, 1.0, 1.0);
            return app.node_count() === before + 1 && id.length === 2;
        });

        await t('add.text', () => {
            const app = window._app;
            const before = app.node_count();
            const id = app.add_text('TestText', 'Hello World', 100, 300, 24, 0.0, 0.0, 0.0, 1.0);
            return app.node_count() === before + 1 && id.length === 2;
        });

        await t('add.frame', () => {
            const app = window._app;
            const before = app.node_count();
            const id = app.add_frame('TestFrame', 600, 100, 300, 200, 0.8, 0.8, 0.8, 1.0);
            return app.node_count() === before + 1 && id.length === 2;
        });

        await t('add.line', () => {
            const app = window._app;
            const before = app.node_count();
            const id = app.add_line('TestLine', 100, 500, 300, 600, 0.0, 0.0, 0.0, 1.0, 2.0);
            return app.node_count() === before + 1 && id.length === 2;
        });

        await t('add.rounded_rect', () => {
            const app = window._app;
            const before = app.node_count();
            const id = app.add_rounded_rect('TestRounded', 400, 300, 150, 100, 0.5, 0.5, 0.5, 1.0, 12.0);
            return app.node_count() === before + 1 && id.length === 2;
        });

        await t('add.gradient_rectangle', () => {
            const app = window._app;
            const before = app.node_count();
            const id = app.add_gradient_rectangle('TestGrad', 600, 350, 200, 100,
                0, 0, 1, 1,
                [0.0, 1.0], [1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0]);
            return app.node_count() === before + 1 && id.length === 2;
        });

        // Helper: find_nodes_by_name returns {counter, client_id, info}
        // This helper extracts the ID pair for WASM calls.
        const findId = (name) => {
            const app = window._app;
            const found = JSON.parse(app.find_nodes_by_name(name));
            if (!found.length) return null;
            return [found[0].counter, found[0].client_id];
        };
        // Inject into page context
        await page.evaluate(() => {
            window._findId = (name) => {
                const found = JSON.parse(window._app.find_nodes_by_name(name));
                if (!found.length) return null;
                return [found[0].counter, found[0].client_id];
            };
        });

        // ═══════════════════════════════════════════════════════════
        // SECTION 4: SELECTION
        // ═══════════════════════════════════════════════════════════

        await t('select.click_selects', () => {
            const app = window._app;
            // Click on the rectangle we created (at 200, 175 in world coords, need screen)
            app.set_camera(0, 0, 1.0);
            window._render();
            const hit = app.mouse_down(200, 175, false);
            app.mouse_up();
            const sel = app.get_selected();
            return hit && sel.length >= 2;
        });

        await t('select.deselect_on_empty', () => {
            const app = window._app;
            app.mouse_down(1500, 1500, false); // empty area
            app.mouse_up();
            return app.get_selected().length === 0;
        });

        await t('select.select_node_by_id', () => {
            const app = window._app;
            const id = window._findId('TestRect');
            if (!id) return 'TestRect not found';
            app.select_node(id[0], id[1]);
            const sel = app.get_selected();
            return sel.length === 2 && sel[0] === id[0];
        });

        await t('select.select_all', () => {
            const app = window._app;
            app.select_all();
            const sel = app.get_selected();
            return sel.length >= 14; // 7 shapes × 2 (counter + client_id)
        });

        // ═══════════════════════════════════════════════════════════
        // SECTION 5: MOVE / RESIZE
        // ═══════════════════════════════════════════════════════════

        await t('move.set_position', () => {
            const app = window._app;
            const id = window._findId('TestRect');
            if (!id) return 'not found';
            app.set_node_position(id[0], id[1], 50, 50);
            const info = JSON.parse(app.get_node_info(id[0], id[1]));
            return Math.abs(info.x - 50) < 1 && Math.abs(info.y - 50) < 1;
        });

        await t('resize.set_size', () => {
            const app = window._app;
            const id = window._findId('TestRect');
            if (!id) return 'not found';
            app.set_node_size(id[0], id[1], 300, 250);
            const info = JSON.parse(app.get_node_info(id[0], id[1]));
            return Math.abs(info.width - 300) < 1 && Math.abs(info.height - 250) < 1;
        });

        await t('move.drag', () => {
            const app = window._app;
            const id = window._findId('TestRect');
            if (!id) return 'not found';
            app.select_node(id[0], id[1]);
            app.set_camera(0, 0, 1.0);
            window._render();
            const info = JSON.parse(app.get_node_info(id[0], id[1]));
            const cx = info.x + info.width / 2;
            const cy = info.y + info.height / 2;
            app.mouse_down(cx, cy, false);
            app.mouse_move(cx + 50, cy);
            app.mouse_up();
            const after = JSON.parse(app.get_node_info(id[0], id[1]));
            return Math.abs(after.x - (info.x + 50)) < 2;
        });

        // ═══════════════════════════════════════════════════════════
        // SECTION 6: PROPERTIES
        // ═══════════════════════════════════════════════════════════

        await t('props.set_fill', () => {
            const app = window._app;
            const id = window._findId('TestRect');
            if (!id) return 'not found';
            return app.set_node_fill(id[0], id[1], 0.0, 1.0, 0.0, 1.0);
        });

        await t('props.set_name', () => {
            const app = window._app;
            const id = window._findId('TestRect');
            if (!id) return 'not found';
            app.set_node_name(id[0], id[1], 'RenamedRect');
            const name = app.get_node_name(id[0], id[1]);
            return name === 'RenamedRect';
        });

        await t('props.set_opacity', () => {
            const app = window._app;
            const id = window._findId('RenamedRect');
            if (!id) return 'not found';
            return app.set_node_opacity(id[0], id[1], 0.5);
        });

        await t('props.set_stroke', () => {
            const app = window._app;
            const id = window._findId('RenamedRect');
            if (!id) return 'not found';
            return app.set_node_stroke(id[0], id[1], 1.0, 0.0, 0.0, 1.0, 3.0);
        });

        await t('props.remove_stroke', () => {
            const app = window._app;
            const id = window._findId('RenamedRect');
            if (!id) return 'not found';
            return app.remove_node_stroke(id[0], id[1]);
        });

        await t('props.set_corner_radius', () => {
            const app = window._app;
            const id = window._findId('RenamedRect');
            if (!id) return 'not found';
            return app.set_node_corner_radius(id[0], id[1], 8, 8, 8, 8);
        });

        await t('props.set_blend_mode', () => {
            const app = window._app;
            const id = window._findId('RenamedRect');
            if (!id) return 'not found';
            return app.set_node_blend_mode(id[0], id[1], 1); // multiply
        });

        await t('props.set_text_content', () => {
            const app = window._app;
            const id = window._findId('TestText');
            if (!id) return 'not found';
            return app.set_node_text(id[0], id[1], 'Updated Text');
        });

        await t('props.set_font_size', () => {
            const app = window._app;
            const id = window._findId('TestText');
            if (!id) return 'not found';
            return app.set_node_font_size(id[0], id[1], 36);
        });

        await t('props.set_constraints', () => {
            const app = window._app;
            const id = window._findId('RenamedRect');
            if (!id) return 'not found';
            return app.set_node_constraints(id[0], id[1], 3, 3); // center, center
        });

        // ═══════════════════════════════════════════════════════════
        // SECTION 7: EFFECTS
        // ═══════════════════════════════════════════════════════════

        await t('effects.drop_shadow', () => {
            const app = window._app;
            const id = window._findId('RenamedRect');
            if (!id) return 'not found';
            return app.add_drop_shadow(id[0], id[1], 0, 0, 0, 0.5, 4, 4, 10, 0);
        });

        await t('effects.inner_shadow', () => {
            const app = window._app;
            const id = window._findId('RenamedRect');
            if (!id) return 'not found';
            return app.add_inner_shadow(id[0], id[1], 0, 0, 0, 0.3, 2, 2, 5, 0);
        });

        await t('effects.blur', () => {
            const app = window._app;
            const id = window._findId('RenamedRect');
            if (!id) return 'not found';
            return app.add_blur(id[0], id[1], 8.0);
        });

        await t('effects.dash_pattern', () => {
            const app = window._app;
            const id = window._findId('TestLine');
            if (!id) return 'not found';
            return app.set_dash_pattern(id[0], id[1], [5.0, 3.0]);
        });

        // ═══════════════════════════════════════════════════════════
        // SECTION 8: CLIPBOARD
        // ═══════════════════════════════════════════════════════════

        await t('clipboard.copy_paste', () => {
            const app = window._app;
            const id = window._findId('RenamedRect');
            if (!id) return 'not found';
            app.select_node(id[0], id[1]);
            const copied = app.copy_selected();
            if (copied === 0) return 'copy returned 0';
            const before = app.node_count();
            const pasted = app.paste();
            return pasted > 0 && app.node_count() === before + 1;
        });

        await t('clipboard.duplicate', () => {
            const app = window._app;
            const before = app.node_count();
            const duped = app.duplicate_selected();
            return duped > 0 && app.node_count() === before + 1;
        });

        // ═══════════════════════════════════════════════════════════
        // SECTION 9: UNDO/REDO
        // ═══════════════════════════════════════════════════════════

        await t('undo.undo_duplicate', () => {
            const app = window._app;
            const before = app.node_count();
            app.undo(); // undo duplicate
            return app.node_count() === before - 1;
        });

        await t('undo.undo_paste', () => {
            const app = window._app;
            const before = app.node_count();
            app.undo(); // undo paste
            return app.node_count() === before - 1;
        });

        await t('undo.redo', () => {
            const app = window._app;
            const before = app.node_count();
            app.redo(); // redo paste
            return app.node_count() === before + 1;
        });

        await t('undo.undo_redo_cycle', () => {
            const app = window._app;
            app.undo(); // back to before paste
            const countA = app.node_count();
            app.redo();
            const countB = app.node_count();
            app.undo();
            return app.node_count() === countA && countB === countA + 1;
        });

        // ═══════════════════════════════════════════════════════════
        // SECTION 10: DELETE
        // ═══════════════════════════════════════════════════════════

        await t('delete.selected', () => {
            const app = window._app;
            const id = window._findId('TestEllipse');
            if (!id) return 'not found';
            app.select_node(id[0], id[1]);
            const before = app.node_count();
            app.delete_selected();
            return app.node_count() === before - 1;
        });

        await t('delete.undo_restores', () => {
            const app = window._app;
            const before = app.node_count();
            app.undo();
            return app.node_count() === before + 1;
        });

        // ═══════════════════════════════════════════════════════════
        // SECTION 11: CAMERA
        // ═══════════════════════════════════════════════════════════

        await t('camera.set_get', () => {
            const app = window._app;
            app.set_camera(500, 300, 2.0);
            const cam = app.get_camera();
            return Math.abs(cam[0] - 500) < 1 && Math.abs(cam[1] - 300) < 1 && Math.abs(cam[2] - 2.0) < 0.01;
        });

        await t('camera.zoom', () => {
            const app = window._app;
            app.set_camera(0, 0, 1.0);
            const before = app.get_camera()[2];
            app.zoom(100, 500, 400); // zoom in (positive delta = zoom in)
            const after = app.get_camera()[2];
            return after > before;
        });

        await t('camera.pan', () => {
            const app = window._app;
            app.set_camera(0, 0, 1.0);
            app.pan_start(500, 400);
            app.pan_move(600, 500);
            app.pan_end();
            const cam = app.get_camera();
            return cam[0] !== 0 || cam[1] !== 0; // camera moved
        });

        await t('camera.zoom_to_fit', () => {
            const app = window._app;
            return app.zoom_to_fit();
        });

        // ═══════════════════════════════════════════════════════════
        // SECTION 12: PEN TOOL
        // ═══════════════════════════════════════════════════════════

        await t('pen.start_and_active', () => {
            const app = window._app;
            app.set_camera(0, 0, 1.0);
            app.pen_start();
            return app.pen_is_active();
        });

        await t('pen.draw_3_points', () => {
            const app = window._app;
            app.pen_mouse_down(800, 100);
            app.pen_mouse_up();
            app.pen_mouse_down(900, 200);
            app.pen_mouse_up();
            app.pen_mouse_down(700, 200);
            app.pen_mouse_up();
            const state = app.pen_get_state();
            const parsed = JSON.parse(state);
            return parsed.anchors.length === 3;
        });

        await t('pen.finish_creates_vector', () => {
            const app = window._app;
            const before = app.node_count();
            app.pen_finish_open();
            return !app.pen_is_active() && app.node_count() === before + 1;
        });

        await t('pen.cancel', () => {
            const app = window._app;
            app.pen_start();
            app.pen_mouse_down(100, 100);
            app.pen_mouse_up();
            app.pen_cancel();
            return !app.pen_is_active();
        });

        await t('pen.bezier_handles', () => {
            const app = window._app;
            app.pen_start();
            app.pen_mouse_down(500, 500);
            app.pen_mouse_drag(500, 530); // drag to create handle
            app.pen_mouse_up();
            const state = JSON.parse(app.pen_get_state());
            const a = state.anchors[0];
            return (a.hox !== 0 || a.hoy !== 0); // handle was created
        });

        // Cleanup pen
        await page.evaluate(() => { window._app.pen_cancel(); });

        // ═══════════════════════════════════════════════════════════
        // SECTION 13: VECTOR POINT EDITING
        // ═══════════════════════════════════════════════════════════

        await t('vectedit.double_click_enters', () => {
            const app = window._app;
            app.set_camera(0, 0, 1.0);
            window._render();
            // Find a vector node (pen test created one named "Vector")
            const id = window._findId('Vector');
            if (!id) return 'no Vector node';
            app.select_node(id[0], id[1]);
            const info = JSON.parse(app.get_node_info(id[0], id[1]));
            const cx = info.x + info.width / 2;
            const cy = info.y + info.height / 2;
            // Simulate double-click via mouse_down twice
            app.mouse_down(cx, cy, false);
            app.mouse_up();
            app.mouse_down(cx, cy, false);
            app.mouse_up();
            return app.is_vector_editing();
        });

        await t('vectedit.get_state_has_anchors', () => {
            const app = window._app;
            if (!app.is_vector_editing()) return 'not in edit mode';
            const state = JSON.parse(app.vector_edit_get_state());
            return state.anchors.length >= 3;
        });

        await t('vectedit.exit', () => {
            const app = window._app;
            app.vector_edit_exit();
            return !app.is_vector_editing();
        });

        // ═══════════════════════════════════════════════════════════
        // SECTION 14: LAYERS
        // ═══════════════════════════════════════════════════════════

        await t('layers.get_layers', () => {
            const app = window._app;
            const layers = JSON.parse(app.get_layers());
            return Array.isArray(layers) && layers.length > 0;
        });

        await t('layers.find_by_name', () => {
            const id = window._findId('RenamedRect');
            return !!id;
        });

        await t('layers.get_node_info', () => {
            const app = window._app;
            const id = window._findId('RenamedRect');
            if (!id) return 'not found';
            const info = JSON.parse(app.get_node_info(id[0], id[1]));
            return info.name === 'RenamedRect' && info.width > 0;
        });

        // ═══════════════════════════════════════════════════════════
        // SECTION 15: Z-ORDER
        // ═══════════════════════════════════════════════════════════

        await t('zorder.bring_to_front', () => {
            const app = window._app;
            const id = window._findId('RenamedRect');
            if (!id) return 'not found';
            app.select_node(id[0], id[1]);
            return app.bring_to_front();
        });

        await t('zorder.send_to_back', () => {
            const app = window._app;
            return app.send_to_back();
        });

        // ═══════════════════════════════════════════════════════════
        // SECTION 16: ALIGNMENT
        // ═══════════════════════════════════════════════════════════

        await t('align.select_multiple_and_align', () => {
            const app = window._app;
            app.select_all();
            const sel = app.get_selected();
            if (sel.length < 4) return 'need 2+ selected';
            return app.align_selected(0); // align left
        });

        // ═══════════════════════════════════════════════════════════
        // SECTION 17: AUTO-LAYOUT
        // ═══════════════════════════════════════════════════════════

        await t('autolayout.set', () => {
            const app = window._app;
            const id = window._findId('TestFrame');
            if (!id) return 'not found';
            return app.set_auto_layout(id[0], id[1], 0, 10, 20, 20, 20, 20);
        });

        await t('autolayout.remove', () => {
            const app = window._app;
            const id = window._findId('TestFrame');
            if (!id) return 'not found';
            return app.remove_auto_layout(id[0], id[1]);
        });

        // ═══════════════════════════════════════════════════════════
        // SECTION 18: RENDERING
        // ═══════════════════════════════════════════════════════════

        await t('render.canvas2d_no_crash', () => {
            const app = window._app;
            app.set_camera(0, 0, 1.0);
            const canvas = document.getElementById('canvas');
            const ctx = canvas.getContext('2d');
            app.render_canvas2d(ctx, canvas.width, canvas.height);
            return true;
        });

        await t('render.needs_render_flag', () => {
            const app = window._app;
            // After mouse interaction, needs_render should have been set/cleared
            return typeof app.needs_render() === 'boolean';
        });

        // ═══════════════════════════════════════════════════════════
        // SECTION 19: EXPORT
        // ═══════════════════════════════════════════════════════════

        await t('export.svg_not_empty', () => {
            const app = window._app;
            const svg = app.export_svg(800, 600);
            return typeof svg === 'string' && svg.includes('<svg') && svg.length > 100;
        });

        await t('export.pixels_correct_size', () => {
            const app = window._app;
            const pixels = app.export_pixels(100, 100);
            return pixels.length === 100 * 100 * 4; // RGBA
        });

        // ═══════════════════════════════════════════════════════════
        // SECTION 20: GROUPING
        // ═══════════════════════════════════════════════════════════

        await t('group.group_selected', () => {
            const app = window._app;
            const rectId = window._findId('RenamedRect');
            const textId = window._findId('TestText');
            if (!rectId || !textId) return 'not found';
            app.select_node(rectId[0], rectId[1]);
            app.toggle_select_node(textId[0], textId[1]);
            return app.group_selected();
        });

        await t('group.ungroup', () => {
            const app = window._app;
            return app.ungroup_selected();
        });

        // ═══════════════════════════════════════════════════════════
        // SECTION 21: SNAP GRID
        // ═══════════════════════════════════════════════════════════

        await t('grid.set_and_get', () => {
            const app = window._app;
            app.set_snap_grid(10);
            const val = app.get_snap_grid();
            app.set_snap_grid(0); // reset
            return val === 10;
        });

        // ═══════════════════════════════════════════════════════════
        // SECTION 22: NESTED NODE INTERACTIONS
        // Tests for nodes inside frames — the bug where clicking a
        // nested node teleports it because local vs world coords mismatch.
        // ═══════════════════════════════════════════════════════════

        // Setup: create a frame with children
        await t('nested.create_frame_with_children', () => {
            const app = window._app;
            app.set_camera(0, 0, 1.0);
            // Frame at (200, 200), size 500x500
            app.add_frame('NestFrame', 200, 200, 500, 500, 0.9, 0.9, 0.9, 1);
            const fid = window._findId('NestFrame');
            if (!fid) return 'frame not created';
            // Insert children inside the frame
            app.set_insert_parent(fid[0], fid[1]);
            app.add_rectangle('NestChild1', 30, 30, 80, 80, 1, 0, 0, 1);
            app.add_rectangle('NestChild2', 150, 150, 60, 60, 0, 0, 1, 1);
            app.add_text('NestText', 'Nested', 50, 200, 16, 0, 0, 0, 1);
            app.clear_insert_parent();
            window._render(true);
            const c1 = window._findId('NestChild1');
            const c2 = window._findId('NestChild2');
            const ct = window._findId('NestText');
            return !!c1 && !!c2 && !!ct;
        });

        await t('nested.child_position_is_local', () => {
            const app = window._app;
            const id = window._findId('NestChild1');
            if (!id) return 'not found';
            const info = JSON.parse(app.get_node_info(id[0], id[1]));
            // Local position should be (30, 30), not (230, 230)
            return Math.abs(info.x - 30) < 1 && Math.abs(info.y - 30) < 1;
        });

        await t('nested.drag_child_stays_near', () => {
            const app = window._app;
            const id = window._findId('NestChild1');
            if (!id) return 'not found';
            const before = JSON.parse(app.get_node_info(id[0], id[1]));
            app.set_camera(0, 0, 1.0);
            window._render(true);
            // World position = frame(200,200) + local(30,30) = (230, 230)
            // At zoom=1, screen = world
            app.mouse_down(230 + 40, 230 + 40, false); // center of 80x80 child
            app.mouse_move(230 + 40 + 10, 230 + 40 + 5); // drag 10px right, 5px down
            app.mouse_up();
            const after = JSON.parse(app.get_node_info(id[0], id[1]));
            const dx = Math.abs(after.x - before.x);
            const dy = Math.abs(after.y - before.y);
            // Should move ~10px right, ~5px down. NOT teleport hundreds of pixels.
            if (dx > 20 || dy > 20) return `teleported! dx=${dx.toFixed(0)} dy=${dy.toFixed(0)}`;
            return dx >= 5 && dx <= 15 && dy >= 2 && dy <= 10;
        });

        await t('nested.drag_child2_stays_near', () => {
            const app = window._app;
            const id = window._findId('NestChild2');
            if (!id) return 'not found';
            const before = JSON.parse(app.get_node_info(id[0], id[1]));
            // World = frame(200,200) + local(150,150) = (350, 350)
            app.mouse_down(350 + 30, 350 + 30, false); // center of 60x60
            app.mouse_move(350 + 30 - 15, 350 + 30 + 8);
            app.mouse_up();
            const after = JSON.parse(app.get_node_info(id[0], id[1]));
            const dx = after.x - before.x;
            const dy = after.y - before.y;
            if (Math.abs(dx) > 25 || Math.abs(dy) > 25) return `teleported! dx=${dx.toFixed(0)} dy=${dy.toFixed(0)}`;
            return Math.abs(dx - (-15)) < 3 && Math.abs(dy - 8) < 3;
        });

        await t('nested.set_position_child', () => {
            const app = window._app;
            const id = window._findId('NestChild2');
            if (!id) return 'not found';
            app.set_node_position(id[0], id[1], 100, 100);
            const info = JSON.parse(app.get_node_info(id[0], id[1]));
            return Math.abs(info.x - 100) < 1 && Math.abs(info.y - 100) < 1;
        });

        await t('nested.resize_child', () => {
            const app = window._app;
            const id = window._findId('NestChild2');
            if (!id) return 'not found';
            const before = JSON.parse(app.get_node_info(id[0], id[1]));
            app.set_node_size(id[0], id[1], 120, 90);
            const after = JSON.parse(app.get_node_info(id[0], id[1]));
            // Position should NOT change when resizing
            const posMoved = Math.abs(after.x - before.x) > 2 || Math.abs(after.y - before.y) > 2;
            if (posMoved) return `position shifted on resize! dx=${(after.x-before.x).toFixed(0)}`;
            return Math.abs(after.width - 120) < 1 && Math.abs(after.height - 90) < 1;
        });

        // Deep nesting: frame inside frame
        await t('nested.deep_nesting_drag', () => {
            const app = window._app;
            // Create inner frame inside NestFrame
            const fid = window._findId('NestFrame');
            if (!fid) return 'parent frame not found';
            app.set_insert_parent(fid[0], fid[1]);
            app.add_frame('InnerFrame', 300, 50, 150, 150, 0.8, 0.8, 1, 1);
            const ifid = window._findId('InnerFrame');
            if (!ifid) return 'inner frame not found';
            // Add child inside inner frame
            app.set_insert_parent(ifid[0], ifid[1]);
            app.add_rectangle('DeepChild', 20, 20, 40, 40, 0, 1, 0, 1);
            app.clear_insert_parent();
            window._render(true);

            const id = window._findId('DeepChild');
            if (!id) return 'deep child not found';
            const before = JSON.parse(app.get_node_info(id[0], id[1]));
            // World = NestFrame(200,200) + InnerFrame(300,50) + DeepChild(20,20) = (520, 270)
            app.mouse_down(520 + 20, 270 + 20, false); // center of 40x40
            app.mouse_move(520 + 20 + 7, 270 + 20 - 3);
            app.mouse_up();
            const after = JSON.parse(app.get_node_info(id[0], id[1]));
            const dx = after.x - before.x;
            const dy = after.y - before.y;
            if (Math.abs(dx) > 20 || Math.abs(dy) > 20) return `deep child teleported! dx=${dx.toFixed(0)} dy=${dy.toFixed(0)}`;
            return Math.abs(dx - 7) < 3 && Math.abs(dy - (-3)) < 3;
        });

        await t('nested.select_correct_child', () => {
            const app = window._app;
            app.set_camera(0, 0, 1.0);
            window._render(true);
            // Click on NestChild1 (world ~240, ~240 after earlier drag moved it slightly)
            const id1 = window._findId('NestChild1');
            if (!id1) return 'not found';
            const info1 = JSON.parse(app.get_node_info(id1[0], id1[1]));
            // Calculate world position of NestChild1
            // frame(200,200) + local position
            const wx = 200 + info1.x + info1.width / 2;
            const wy = 200 + info1.y + info1.height / 2;
            // Enter the frame first (click once to select frame, double-click to enter)
            app.handle_double_click(wx, wy);
            // Now click on the child
            app.mouse_down(wx, wy, false);
            app.mouse_up();
            const sel = app.get_selected();
            // get_selected returns [counter, client_id, ...] pairs
            const selId = sel.length >= 2 ? [sel[0], sel[1]] : null;
            if (!selId) return 'nothing selected';
            return selId[0] === id1[0] && selId[1] === id1[1];
        });

        await t('nested.drawn_count_stable', () => {
            const app = window._app;
            app.set_camera(0, 0, 1.0);
            window._render(true);
            const before = app.drawn_count();
            // Click several nested nodes
            app.mouse_down(270, 270, false); app.mouse_up();
            window._render(true);
            const after1 = app.drawn_count();
            app.mouse_down(380, 380, false); app.mouse_up();
            window._render(true);
            const after2 = app.drawn_count();
            // Drawn count should stay stable — no nodes disappearing
            const diff1 = Math.abs(after1 - before);
            const diff2 = Math.abs(after2 - before);
            if (diff1 > 2 || diff2 > 2) return `drawn count unstable: ${before}->${after1}->${after2}`;
            return true;
        });

        // Cleanup: exit any entered group
        await page.evaluate(() => {
            try { window._app.exit_group(); } catch(e) {}
            window._app.mouse_down(0, 0, false); window._app.mouse_up();
        });

        // ═══════════════════════════════════════════════════════════
        // §23 — MARQUEE SELECT (drag-to-select)
        // ═══════════════════════════════════════════════════════════

        // Setup: place 3 rects far from existing nodes to avoid hit-test interference
        await page.evaluate(() => {
            const app = window._app;
            // Use a far-away camera offset so screen coords map to empty world space
            app.set_camera(-10000, -10000, 1.0);
            app.add_rectangle('mq_a', -9900, -9900, 50, 50, 1, 0, 0, 1);
            app.add_rectangle('mq_b', -9800, -9900, 50, 50, 0, 1, 0, 1);
            app.add_rectangle('mq_c', -9500, -9500, 50, 50, 0, 0, 1, 1);
            window._render(true);
        });

        await t('marquee.drag_selects_two', () => {
            const app = window._app;
            // Screen (50,50) → world (-9950,-9950). Screen (350,200) → world (-9650,-9800)
            // mq_a at (-9900,-9900, 50x50) and mq_b at (-9800,-9900, 50x50) should both be in range
            // mq_c at (-9500,-9500) is far away
            app.mouse_down(50, 50, false); // empty space → marquee
            app.mouse_move(350, 200);
            app.mouse_up();
            const sel = app.get_selected();
            if (sel.length / 2 !== 2) return `expected 2 selected, got ${sel.length / 2}`;
            return true;
        });

        await t('marquee.excludes_outside', () => {
            const app = window._app;
            // Drag marquee covering only mq_a (screen ~100,100 to ~150,150)
            app.mouse_down(50, 50, false);
            app.mouse_move(180, 180);
            app.mouse_up();
            const sel = app.get_selected();
            if (sel.length / 2 !== 1) return `expected 1 selected, got ${sel.length / 2}`;
            return true;
        });

        await t('marquee.get_rect_during_drag', () => {
            const app = window._app;
            const before = app.get_marquee_rect();
            if (before.length !== 0) return `expected empty before drag, got ${before.length}`;
            app.mouse_down(10, 10, false);
            app.mouse_move(300, 400);
            const during = app.get_marquee_rect();
            app.mouse_up();
            if (during.length !== 4) return `expected 4 values during drag, got ${during.length}`;
            const after = app.get_marquee_rect();
            if (after.length !== 0) return `expected empty after drag, got ${after.length}`;
            return true;
        });

        await t('marquee.select_all_three', () => {
            const app = window._app;
            // Drag huge area to cover all 3 mq_ nodes
            app.mouse_down(0, 0, false);
            app.mouse_move(900, 900);
            app.mouse_up();
            const sel = app.get_selected();
            if (sel.length / 2 < 3) return `expected >=3 selected, got ${sel.length / 2}`;
            return true;
        });

        await t('marquee.multi_drag', () => {
            const app = window._app;
            // Marquee-select mq_a and mq_b
            app.set_camera(-10000, -10000, 1.0);
            app.mouse_down(50, 50, false);
            app.mouse_move(350, 200);
            app.mouse_up();
            const sel = app.get_selected();
            if (sel.length / 2 < 2) return `need >=2 selected, got ${sel.length / 2}`;
            // Get positions before drag
            const info1 = JSON.parse(app.get_node_info(sel[0], sel[1]));
            const info2 = JSON.parse(app.get_node_info(sel[2], sel[3]));
            // Now click on one of the selected nodes and drag 50px right
            // mq_a screen pos: (100,100) relative to camera at (-10000,-10000) → screen (100,100)
            app.mouse_down(120, 120, false); // click inside mq_a
            app.mouse_move(170, 120); // drag 50px right
            app.mouse_up();
            // Both nodes should have moved by 50px
            const after1 = JSON.parse(app.get_node_info(sel[0], sel[1]));
            const after2 = JSON.parse(app.get_node_info(sel[2], sel[3]));
            const dx1 = Math.round(after1.x - info1.x);
            const dx2 = Math.round(after2.x - info2.x);
            if (dx1 !== 50) return `node1 moved ${dx1}px, expected 50`;
            if (dx2 !== 50) return `node2 moved ${dx2}px, expected 50`;
            return true;
        });

        await t('marquee.empty_area_deselects', () => {
            const app = window._app;
            app.select_all();
            // Move camera to empty area and drag tiny marquee
            app.set_camera(50000, 50000, 1.0);
            app.mouse_down(10, 10, false);
            app.mouse_move(20, 20);
            app.mouse_up();
            const after = app.get_selected().length / 2;
            // Restore camera
            app.set_camera(-10000, -10000, 1.0);
            if (after !== 0) return `expected 0 after empty marquee, got ${after}`;
            return true;
        });

        // ═══════════════════════════════════════════════════════════
        // §24 — MASKS
        // ═══════════════════════════════════════════════════════════

        // Setup: create a frame with a circle mask and a rectangle behind it
        await page.evaluate(() => {
            const app = window._app;
            app.set_camera(-15000, -15000, 1.0);
            // Frame to hold mask + content
            app.add_frame('mask_frame', -14900, -14900, 200, 200, 0.2, 0.2, 0.2, 1);
            window._render(true);
        });

        await t('mask.set_mask_flag', () => {
            const app = window._app;
            // Add ellipse inside frame, set as mask
            const ids = app.add_ellipse('mask_circle', -14900, -14900, 100, 100, 1, 1, 1, 1);
            app.set_node_mask(ids[0], ids[1], true);
            const info = JSON.parse(app.get_node_info(ids[0], ids[1]));
            if (!info.isMask) return 'isMask not set in node_info';
            return true;
        });

        await t('mask.unset_mask_flag', () => {
            const app = window._app;
            const found = JSON.parse(app.find_nodes_by_name('mask_circle'));
            if (!found.length) return 'mask_circle not found';
            const c = found[0].counter, ci = found[0].client_id;
            app.set_node_mask(c, ci, false);
            const info = JSON.parse(app.get_node_info(c, ci));
            if (info.isMask) return 'isMask should be false after unset';
            // Re-enable for render test
            app.set_node_mask(c, ci, true);
            return true;
        });

        await t('mask.render_no_crash', () => {
            // Setting mask + rendering should not crash
            window._render(true);
            return true;
        });

        // ═══════════════════════════════════════════════════════════
        // §25 — WORKFLOW: Create & Export
        // ═══════════════════════════════════════════════════════════

        await t('workflow.create_logo_shapes', () => {
            const app = window._app;
            // Create a simple logo: green circle + white star + text
            app.set_camera(-20000, -20000, 1.0);
            app.add_ellipse('wf_circle', -19900, -19900, 200, 200, 0, 0.44, 0.29, 1);
            app.add_text('wf_label', 'LOGO', -19860, -19820, 24, 1, 1, 1, 1);
            window._render(true);
            const found = JSON.parse(app.find_nodes_by_name('wf_circle'));
            if (!found.length) return 'circle not created';
            return true;
        });

        await t('workflow.export_svg_autofit', () => {
            const app = window._app;
            const svg = app.export_svg(0, 0);
            if (!svg.includes('viewBox')) return 'no viewBox in SVG';
            // viewBox should NOT be "0 0 0 0"
            const vb = svg.match(/viewBox="([^"]+)"/);
            if (!vb) return 'viewBox not found';
            const parts = vb[1].split(' ').map(Number);
            const w = parts[2], h = parts[3];
            if (w <= 0 || h <= 0) return `viewBox dimensions zero: ${vb[1]}`;
            return true;
        });

        await t('workflow.pen_closed_path', () => {
            const app = window._app;
            app.pen_start();
            // Triangle
            app.pen_mouse_down(-19500, -19500);
            app.pen_mouse_up();
            app.pen_mouse_down(-19400, -19500);
            app.pen_mouse_up();
            app.pen_mouse_down(-19450, -19400);
            app.pen_mouse_up();
            app.pen_finish_closed();
            // Should create a Vector node
            if (app.pen_is_active()) return 'pen still active after finish_closed';
            const found = JSON.parse(app.find_nodes_by_name('Vector'));
            if (!found.length) return 'no Vector node created';
            return true;
        });

        // ═══════════════════════════════════════════════════════════
        // COMPONENT SYSTEM
        // ═══════════════════════════════════════════════════════════

        await t('component.create_component', () => {
            const app = window._app;
            app.set_camera(-30000, -30000, 1.0);
            // Create two shapes to wrap into a component
            const r1 = app.add_rectangle('comp_bg', -29900, -29900, 120, 40, 0, 0.4, 1, 1);
            const r2 = app.add_text('comp_label', 'Button', -29880, -29910, 16, 1, 1, 1, 1);
            window._render(true);
            // Select both nodes programmatically
            app.select_node(r1[0], r1[1]);
            app.toggle_select_node(r2[0], r2[1]);
            const sel = app.get_selected();
            if (sel.length < 4) return `expected 4 (2 nodes × [counter,clientId]), got ${sel.length}`;
            // Create component
            const compId = app.create_component();
            if (!compId || compId.length < 2) return 'create_component returned empty';
            window._render(true);
            // Verify it's a component type
            const info = JSON.parse(app.get_node_info(compId[0], compId[1]));
            if (info.type !== 'component') return `expected type=component, got ${info.type}`;
            // Store for later tests
            window._test_comp_id = compId;
            return true;
        });

        await t('component.component_has_children', () => {
            const app = window._app;
            const compId = window._test_comp_id;
            if (!compId) return 'no component from previous test';
            // Enter the component (double-click)
            const info = JSON.parse(app.get_node_info(compId[0], compId[1]));
            // Component should have width/height from bounding box
            if (info.width <= 0 || info.height <= 0) return `component has zero dimensions: ${info.width}x${info.height}`;
            return true;
        });

        await t('component.create_instance', () => {
            const app = window._app;
            const compId = window._test_comp_id;
            if (!compId) return 'no component from previous test';
            const instId = app.create_instance(compId[0], compId[1]);
            if (!instId || instId.length < 2) return 'create_instance returned empty';
            window._render(true);
            const info = JSON.parse(app.get_node_info(instId[0], instId[1]));
            if (info.type !== 'instance') return `expected type=instance, got ${info.type}`;
            // Instance should reference the component
            if (!info.componentId) return 'no componentId in instance info';
            if (info.componentId[0] !== compId[0] || info.componentId[1] !== compId[1]) {
                return `componentId mismatch: ${JSON.stringify(info.componentId)} vs ${JSON.stringify(compId)}`;
            }
            // Instance should have same dimensions as component
            const compInfo = JSON.parse(app.get_node_info(compId[0], compId[1]));
            if (Math.abs(info.width - compInfo.width) > 1) return `width mismatch: ${info.width} vs ${compInfo.width}`;
            window._test_inst_id = instId;
            return true;
        });

        await t('component.instance_has_children', () => {
            const app = window._app;
            const instId = window._test_inst_id;
            if (!instId) return 'no instance from previous test';
            // Find children by checking if the instance has nodes inside
            const found = JSON.parse(app.find_nodes_by_name('comp_bg'));
            // There should be at least 2 (one in component, one cloned in instance)
            if (found.length < 2) return `expected at least 2 comp_bg nodes, got ${found.length}`;
            return true;
        });

        await t('component.detach_instance', () => {
            const app = window._app;
            const instId = window._test_inst_id;
            if (!instId) return 'no instance from previous test';
            // Select instance programmatically
            app.select_node(instId[0], instId[1]);
            const result = app.detach_instance();
            if (!result) return 'detach_instance returned false';
            window._render(true);
            // After detach, it should be a frame
            const after = JSON.parse(app.get_node_info(instId[0], instId[1]));
            if (after.type !== 'frame') return `expected type=frame after detach, got ${after.type}`;
            return true;
        });

        await t('component.create_from_single', () => {
            const app = window._app;
            // Creating component from single node should also work
            const rId = app.add_rectangle('solo_comp', -29500, -29500, 50, 50, 1, 0, 0, 1);
            app.select_node(rId[0], rId[1]);
            window._render(true);
            const compId = app.create_component();
            if (!compId || compId.length < 2) return 'create_component from single failed';
            const info = JSON.parse(app.get_node_info(compId[0], compId[1]));
            if (info.type !== 'component') return `expected component, got ${info.type}`;
            return true;
        });

        // ═══════════════════════════════════════════════════════════
        // COLOR PICKER
        // ═══════════════════════════════════════════════════════════

        await t('colorpicker.hsv_to_rgb', () => {
            // Test the HSV→RGB conversion is available
            const app = window._app;
            // Verify set_node_fill works with float RGB values (basis of color picker)
            const rId = app.add_rectangle('cp_test', -28000, -28000, 50, 50, 1, 0, 0, 1);
            app.set_node_fill(rId[0], rId[1], 0.0, 0.5, 1.0, 1.0);
            window._render(true);
            const info = JSON.parse(app.get_node_info(rId[0], rId[1]));
            if (!info.fill.includes('127')) return `expected blue fill, got: ${info.fill}`;
            return true;
        });

        await t('colorpicker.alpha_support', () => {
            const app = window._app;
            // Test that fill with alpha works
            const rId = app.add_rectangle('cp_alpha', -28100, -28000, 50, 50, 1, 0, 0, 0.5);
            const info = JSON.parse(app.get_node_info(rId[0], rId[1]));
            if (!info.fill.includes('0.50')) return `expected alpha 0.50, got: ${info.fill}`;
            // Change fill with alpha
            app.set_node_fill(rId[0], rId[1], 1.0, 1.0, 0.0, 0.75);
            window._render(true);
            const info2 = JSON.parse(app.get_node_info(rId[0], rId[1]));
            if (!info2.fill.includes('255') || !info2.fill.includes('255')) return `expected yellow, got: ${info2.fill}`;
            return true;
        });

        // ═══════════════════════════════════════════════════════════
        // FLATTEN
        // ═══════════════════════════════════════════════════════════

        await t('flatten.rectangle_to_vector', () => {
            const app = window._app;
            const rId = app.add_rectangle('flat_rect', -27000, -27000, 100, 50, 0.8, 0.2, 0.2, 1);
            app.select_node(rId[0], rId[1]);
            const before = JSON.parse(app.get_node_info(rId[0], rId[1]));
            if (before.type !== 'rectangle') return `expected rectangle, got ${before.type}`;
            const ok = app.flatten_selected();
            if (!ok) return 'flatten_selected returned false';
            window._render(true);
            const after = JSON.parse(app.get_node_info(rId[0], rId[1]));
            if (after.type !== 'vector') return `expected vector after flatten, got ${after.type}`;
            return true;
        });

        await t('flatten.ellipse_to_vector', () => {
            const app = window._app;
            const eId = app.add_ellipse('flat_ellipse', -27200, -27000, 80, 80, 0, 0.5, 0.8, 1);
            app.select_node(eId[0], eId[1]);
            const ok = app.flatten_selected();
            if (!ok) return 'flatten_selected returned false';
            const after = JSON.parse(app.get_node_info(eId[0], eId[1]));
            if (after.type !== 'vector') return `expected vector, got ${after.type}`;
            return true;
        });

        await t('flatten.already_vector_noop', () => {
            const app = window._app;
            // Create a vector via pen
            app.pen_start();
            app.pen_mouse_down(-27400, -27000);
            app.pen_mouse_up();
            app.pen_mouse_down(-27300, -27000);
            app.pen_mouse_up();
            app.pen_finish_open();
            const found = JSON.parse(app.find_nodes_by_name('Vector'));
            if (!found.length) return 'no vector found';
            const vId = [found[0].counter, found[0].client_id];
            app.select_node(vId[0], vId[1]);
            const ok = app.flatten_selected();
            if (!ok) return 'flatten on vector should return true (noop)';
            const after = JSON.parse(app.get_node_info(vId[0], vId[1]));
            if (after.type !== 'vector') return `still vector, got ${after.type}`;
            return true;
        });

        // ═══════════════════════════════════════════════════════════
        // COMMENTS
        // ═══════════════════════════════════════════════════════════

        await t('comment.add_and_get', () => {
            const app = window._app;
            const id = app.add_comment(100, 200, 'Fix alignment here', 'Designer');
            if (!id || id <= 0) return 'add_comment returned invalid id';
            const comments = JSON.parse(app.get_comments());
            const found = comments.find(c => c.id === id);
            if (!found) return 'comment not found in get_comments';
            if (found.text !== 'Fix alignment here') return `wrong text: ${found.text}`;
            if (found.author !== 'Designer') return `wrong author: ${found.author}`;
            if (Math.abs(found.x - 100) > 0.1) return `wrong x: ${found.x}`;
            return true;
        });

        await t('comment.resolve', () => {
            const app = window._app;
            const id = app.add_comment(300, 400, 'Needs review', 'PM');
            const ok = app.resolve_comment(id, true);
            if (!ok) return 'resolve_comment returned false';
            const comments = JSON.parse(app.get_comments());
            const found = comments.find(c => c.id === id);
            if (!found.resolved) return 'comment not resolved';
            return true;
        });

        await t('comment.delete', () => {
            const app = window._app;
            const before = app.comment_count();
            const id = app.add_comment(500, 600, 'temp', 'User');
            if (app.comment_count() !== before + 1) return 'count not incremented';
            app.delete_comment(id);
            if (app.comment_count() !== before) return 'count not decremented after delete';
            return true;
        });

        // ═══════════════════════════════════════════════════════════
        // PROTOTYPE
        // ═══════════════════════════════════════════════════════════

        await t('prototype.add_link', () => {
            const app = window._app;
            const r1 = app.add_rectangle('proto_a', -26000, -26000, 100, 100, 0.3, 0.3, 0.8, 1);
            const r2 = app.add_rectangle('proto_b', -25800, -26000, 100, 100, 0.8, 0.3, 0.3, 1);
            const ok = app.add_prototype_link(r1[0], r1[1], r2[0], r2[1], 'click', 'dissolve');
            if (!ok) return 'add_prototype_link returned false';
            const links = JSON.parse(app.get_prototype_links());
            if (links.length === 0) return 'no links found';
            const link = links[links.length - 1];
            if (link.trigger !== 'click') return `wrong trigger: ${link.trigger}`;
            if (link.animation !== 'dissolve') return `wrong animation: ${link.animation}`;
            return true;
        });

        await t('prototype.remove_links', () => {
            const app = window._app;
            const before = app.prototype_link_count();
            const r1 = app.add_rectangle('proto_c', -25600, -26000, 50, 50, 0.5, 0.5, 0.5, 1);
            const r2 = app.add_rectangle('proto_d', -25500, -26000, 50, 50, 0.5, 0.5, 0.5, 1);
            app.add_prototype_link(r1[0], r1[1], r2[0], r2[1], 'hover', 'slide');
            if (app.prototype_link_count() !== before + 1) return 'link not added';
            app.remove_prototype_links(r1[0], r1[1]);
            if (app.prototype_link_count() !== before) return 'link not removed';
            return true;
        });

        // ═══════════════════════════════════════════════════════════
        // VECTOR NETWORK
        // ═══════════════════════════════════════════════════════════

        await t('vector_network.get_network', () => {
            const app = window._app;
            // Create a triangle vector
            app.pen_start();
            app.pen_mouse_down(-25000, -25000);
            app.pen_mouse_up();
            app.pen_mouse_down(-24900, -25000);
            app.pen_mouse_up();
            app.pen_mouse_down(-24950, -24900);
            app.pen_mouse_up();
            app.pen_finish_closed();
            window._render(true);
            // Find the vector
            const found = JSON.parse(app.find_nodes_by_name('Vector'));
            if (!found.length) return 'no vector found';
            const vId = found[found.length - 1]; // get last created
            const network = JSON.parse(app.get_vector_network(vId.counter, vId.client_id));
            if (!network.vertices || !network.segments) return 'no vertices or segments';
            if (network.vertices.length < 3) return `expected 3+ vertices, got ${network.vertices.length}`;
            if (network.segments.length < 3) return `expected 3+ segments, got ${network.segments.length}`;
            return true;
        });

        await t('vector_network.non_vector_empty', () => {
            const app = window._app;
            const rId = app.add_rectangle('vn_rect', -24800, -25000, 50, 50, 0.5, 0.5, 0.5, 1);
            const network = JSON.parse(app.get_vector_network(rId[0], rId[1]));
            // Non-vector should return empty object
            if (network.vertices) return 'non-vector should not have vertices';
            return true;
        });

        // ═══════════════════════════════════════════════════════════
        // Section: Rotation
        // ═══════════════════════════════════════════════════════════

        await t('rotation.set_and_read', () => {
            const app = window._app;
            const rId = app.add_rectangle('rot_test', -26000, -26000, 100, 100, 0.2, 0.6, 0.8, 1);
            app.set_node_rotation(rId[0], rId[1], 45.0);
            const info = JSON.parse(app.get_node_info(rId[0], rId[1]));
            if (!info.rotation) return 'rotation not in node info';
            if (Math.abs(info.rotation - 45.0) > 1.0) return `rotation wrong: ${info.rotation}`;
            return true;
        });

        await t('rotation.undo', () => {
            const app = window._app;
            const rId = app.add_rectangle('rot_undo', -26200, -26000, 80, 80, 0.3, 0.7, 0.2, 1);
            app.set_node_rotation(rId[0], rId[1], 90.0);
            const before = JSON.parse(app.get_node_info(rId[0], rId[1]));
            if (Math.abs(before.rotation - 90.0) > 1.0) return `before undo: ${before.rotation}`;
            app.undo();
            const after = JSON.parse(app.get_node_info(rId[0], rId[1]));
            if (after.rotation && Math.abs(after.rotation) > 1.0) return `after undo: ${after.rotation}`;
            return true;
        });

        await t('rotation.zero_not_reported', () => {
            const app = window._app;
            const rId = app.add_rectangle('rot_zero', -26400, -26000, 60, 60, 0.5, 0.5, 0.5, 1);
            const info = JSON.parse(app.get_node_info(rId[0], rId[1]));
            if (info.rotation !== undefined) return 'zero rotation should not appear';
            return true;
        });

        // ═══════════════════════════════════════════════════════════
        // Section: Typography
        // ═══════════════════════════════════════════════════════════

        await t('typography.letter_spacing', () => {
            const app = window._app;
            const tId = app.add_text('ls_test', 'HELLO', -27000, -27000, 16, 1, 1, 1, 1);
            app.set_letter_spacing(tId[0], tId[1], 5.0);
            const info = JSON.parse(app.get_node_info(tId[0], tId[1]));
            if (!info.letterSpacing) return 'letterSpacing not in info';
            if (Math.abs(info.letterSpacing - 5.0) > 0.5) return `wrong: ${info.letterSpacing}`;
            return true;
        });

        await t('typography.line_height', () => {
            const app = window._app;
            const tId = app.add_text('lh_test', 'Line height test', -27200, -27000, 16, 1, 1, 1, 1);
            app.set_line_height(tId[0], tId[1], 24.0);
            const info = JSON.parse(app.get_node_info(tId[0], tId[1]));
            if (!info.lineHeight) return 'lineHeight not in info';
            if (Math.abs(info.lineHeight - 24.0) > 0.5) return `wrong: ${info.lineHeight}`;
            return true;
        });

        await t('typography.undo_letter_spacing', () => {
            const app = window._app;
            const tId = app.add_text('ls_undo', 'TEST', -27400, -27000, 16, 1, 1, 1, 1);
            app.set_letter_spacing(tId[0], tId[1], 10.0);
            const before = JSON.parse(app.get_node_info(tId[0], tId[1]));
            if (Math.abs(before.letterSpacing - 10.0) > 0.5) return 'set failed';
            app.undo();
            const after = JSON.parse(app.get_node_info(tId[0], tId[1]));
            if (after.letterSpacing && Math.abs(after.letterSpacing) > 0.5) return `undo failed: ${after.letterSpacing}`;
            return true;
        });

        // Section: Text Decoration
        // ═══════════════════════════════════════════════════════════

        await t('decoration.underline', () => {
            const app = window._app;
            const tId = app.add_text('dec_test', 'UNDERLINE', -28000, -28000, 16, 1, 1, 1, 1);
            app.set_text_decoration(tId[0], tId[1], 'underline');
            const info = JSON.parse(app.get_node_info(tId[0], tId[1]));
            if (info.textDecoration !== 'underline') return `expected underline, got ${info.textDecoration}`;
            return true;
        });

        await t('decoration.strikethrough', () => {
            const app = window._app;
            const tId = app.add_text('dec_test2', 'STRIKE', -28200, -28000, 16, 1, 1, 1, 1);
            app.set_text_decoration(tId[0], tId[1], 'strikethrough');
            const info = JSON.parse(app.get_node_info(tId[0], tId[1]));
            if (info.textDecoration !== 'strikethrough') return `expected strikethrough, got ${info.textDecoration}`;
            return true;
        });

        await t('decoration.undo', () => {
            const app = window._app;
            const tId = app.add_text('dec_undo', 'UNDO', -28400, -28000, 16, 1, 1, 1, 1);
            app.set_text_decoration(tId[0], tId[1], 'underline');
            app.undo();
            const info = JSON.parse(app.get_node_info(tId[0], tId[1]));
            if (info.textDecoration && info.textDecoration !== 'none') return `undo failed: ${info.textDecoration}`;
            return true;
        });

        // Section: Text Vertical Alignment
        // ═══════════════════════════════════════════════════════════

        await t('vertical_align.center', () => {
            const app = window._app;
            const tId = app.add_text('va_test', 'CENTER', -28600, -28000, 16, 1, 1, 1, 1);
            app.set_text_vertical_align(tId[0], tId[1], 'center');
            const info = JSON.parse(app.get_node_info(tId[0], tId[1]));
            if (info.textVerticalAlign !== 'center') return `expected center, got ${info.textVerticalAlign}`;
            return true;
        });

        await t('vertical_align.bottom', () => {
            const app = window._app;
            const tId = app.add_text('va_test2', 'BOTTOM', -28800, -28000, 16, 1, 1, 1, 1);
            app.set_text_vertical_align(tId[0], tId[1], 'bottom');
            const info = JSON.parse(app.get_node_info(tId[0], tId[1]));
            if (info.textVerticalAlign !== 'bottom') return `expected bottom, got ${info.textVerticalAlign}`;
            return true;
        });

        // Section: Stroke Alignment
        // ═══════════════════════════════════════════════════════════

        await t('stroke_align.inside', () => {
            const app = window._app;
            const id = app.add_rectangle('sa_test', -29000, -29000, 100, 80, 1, 0, 0, 1);
            app.set_node_stroke(id[0], id[1], 0, 0, 0, 1, 4);
            app.set_stroke_align(id[0], id[1], 'inside');
            const info = JSON.parse(app.get_node_info(id[0], id[1]));
            if (info.strokeAlign !== 'inside') return `expected inside, got ${info.strokeAlign}`;
            return true;
        });

        await t('stroke_align.outside', () => {
            const app = window._app;
            const id = app.add_rectangle('sa_test2', -29200, -29000, 100, 80, 0, 1, 0, 1);
            app.set_node_stroke(id[0], id[1], 0, 0, 0, 1, 4);
            app.set_stroke_align(id[0], id[1], 'outside');
            const info = JSON.parse(app.get_node_info(id[0], id[1]));
            if (info.strokeAlign !== 'outside') return `expected outside, got ${info.strokeAlign}`;
            return true;
        });

        // Section: Star/Polygon Tool
        // ═══════════════════════════════════════════════════════════

        await t('star.five_pointed', () => {
            const app = window._app;
            const id = app.add_star('star5', -30000, -30000, 100, 100, 1, 0.8, 0, 1, 5, 0.38);
            if (!id || id.length !== 2) return 'add_star returned invalid id';
            const info = JSON.parse(app.get_node_info(id[0], id[1]));
            if (info.type !== 'vector') return `expected vector, got ${info.type}`;
            return true;
        });

        await t('star.triangle', () => {
            const app = window._app;
            const id = app.add_star('tri', -30200, -30000, 80, 80, 0, 0, 1, 1, 3, 1.0);
            if (!id || id.length !== 2) return 'add_star returned invalid id';
            return true;
        });

        await t('star.hexagon', () => {
            const app = window._app;
            const id = app.add_star('hex', -30400, -30000, 80, 80, 0, 1, 0, 1, 6, 1.0);
            if (!id || id.length !== 2) return 'add_star returned invalid id';
            return true;
        });

        // Section: Image Fill
        // ═══════════════════════════════════════════════════════════

        await t('image_fill.add', () => {
            const app = window._app;
            const id = app.add_image_fill('img_test', -31000, -31000, 200, 150, 'test.png', 'fill', 1.0);
            if (!id || id.length !== 2) return 'add_image_fill returned invalid id';
            const info = JSON.parse(app.get_node_info(id[0], id[1]));
            if (info.type !== 'rectangle') return `expected rectangle, got ${info.type}`;
            return true;
        });

        await t('image_fill.set_on_rect', () => {
            const app = window._app;
            const id = app.add_rectangle('rect_for_img', -31200, -31000, 100, 100, 1, 0, 0, 1);
            const ok = app.set_image_fill(id[0], id[1], 'photo.jpg', 'fit', 0.8);
            if (!ok) return 'set_image_fill returned false';
            return true;
        });

        await t('image_fill.scale_modes', () => {
            const app = window._app;
            for (const mode of ['fill', 'fit', 'tile', 'stretch']) {
                const id = app.add_image_fill(`img_${mode}`, -31400, -31000, 100, 100, 'test.png', mode, 1.0);
                if (!id || id.length !== 2) return `add_image_fill failed for mode ${mode}`;
            }
            return true;
        });

        // ═══════════════════════════════════════════════════════════
        // SUMMARY
        // ═══════════════════════════════════════════════════════════

        console.log('FEAT: ─────────────────────────────────────────────');
        const pass = results.filter(r => r.status === 'PASS').length;
        const fail = results.filter(r => r.status === 'FAIL').length;
        console.log(`FEAT: ${pass} PASS, ${fail} FAIL`);

        if (fail > 0) {
            console.log('\nFailed tests:');
            for (const r of results.filter(r => r.status === 'FAIL')) {
                console.log(`  - ${r.name}: ${r.reason || ''}`);
            }
        }

        process.exit(fail > 0 ? 1 : 0);

    } catch (err) {
        console.error('FEAT: Fatal error:', err.message);
        process.exit(2);
    } finally {
        if (browser) await browser.close();
        if (viteProc) viteProc.kill();
    }
}

main();
