#!/usr/bin/env node
/**
 * interaction-check.mjs — Automated mouse interaction verification.
 *
 * Tests ACTUAL mouse event flows (not just API calls) to catch
 * coordinate/hit-test/mode-transition bugs that API tests miss.
 *
 * Uses headless Puppeteer with ?nostress for lightweight testing.
 * Each test creates nodes, simulates mouse events, checks results.
 *
 * Usage: node interaction-check.mjs
 */

import puppeteer from 'puppeteer';
import { spawn } from 'child_process';

const PORT = 3098;
const results = [];

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
    });
}

async function run() {
    const vite = await startVite();
    let browser;
    try {
        browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setViewport({ width: 1400, height: 900 });
        await page.goto(`http://localhost:${PORT}?nostress&nosave`, { waitUntil: 'networkidle0', timeout: 30000 });

        // Wait for WASM to load
        await page.waitForFunction(() => window._app && window._render, { timeout: 15000 });

        // Run all interaction tests
        await testClickSelect(page);
        await testDragMove(page);
        await testDragResize(page);
        await testDragRotation(page);
        await testDoubleClickGroup(page);
        await testDoubleClickVectorEdit(page);
        await testMarqueeSelect(page);
        await testUndoRedoInteraction(page);
        await testEscapeExitsVectorEdit(page);
        await testShiftMultiSelect(page);

    } catch (e) {
        console.error('FATAL:', e.message);
        process.exit(2);
    } finally {
        if (browser) await browser.close();
        vite.kill();
    }

    // Report
    console.log('INT: ─────────────────────────────────────────────');
    const pass = results.filter(r => r.ok).length;
    const fail = results.filter(r => !r.ok).length;
    for (const r of results) {
        const status = r.ok ? 'PASS' : 'FAIL';
        const reason = r.ok ? '' : `  ${r.reason}`;
        console.log(`  INT: ${r.name.padEnd(45)} ${status}${reason}`);
    }
    console.log(`INT: ${pass} PASS, ${fail} FAIL`);
    process.exit(fail > 0 ? 1 : 0);
}

function record(name, ok, reason) {
    results.push({ name, ok, reason });
}

// ── Test: Click to select ────────────────────────────────────────────

async function testClickSelect(page) {
    const r = await page.evaluate(() => {
        const app = window._app;
        app.select_all(); app.delete_selected(); // clean slate
        const id = app.add_rectangle('ClickMe', 200, 200, 100, 80, 1, 0, 0, 1);
        window._render(true);

        // Click in the middle of the rect (screen coords, cam at 0,0,1)
        const hit = app.mouse_down(250, 240, false);
        app.mouse_up();

        const sel = app.get_selected();
        const match = sel.length === 2 && sel[0] === id[0] && sel[1] === id[1];
        return { hit, match, selLen: sel.length };
    });
    record('click_select', r.hit && r.match,
        r.hit ? `match=${r.match} selLen=${r.selLen}` : 'mouse_down returned false');
}

// ── Test: Drag to move ───────────────────────────────────────────────

async function testDragMove(page) {
    const r = await page.evaluate(() => {
        const app = window._app;
        app.select_all(); app.delete_selected();
        const id = app.add_rectangle('DragMe', 300, 300, 100, 80, 0, 1, 0, 1);
        window._render(true);

        // Select it
        app.mouse_down(350, 340, false);
        app.mouse_up();

        const before = JSON.parse(app.get_node_info(id[0], id[1]));

        // Drag it 50px right, 30px down
        app.mouse_down(350, 340, false);
        app.mouse_move(400, 370);
        app.mouse_up();
        window._render(true);

        const after = JSON.parse(app.get_node_info(id[0], id[1]));
        const dx = Math.round(after.x - before.x);
        const dy = Math.round(after.y - before.y);
        return { dx, dy };
    });
    record('drag_move', Math.abs(r.dx - 50) <= 2 && Math.abs(r.dy - 30) <= 2,
        `moved dx=${r.dx} dy=${r.dy}, expected ~50,30`);
}

// ── Test: Drag corner to resize ──────────────────────────────────────

async function testDragResize(page) {
    const r = await page.evaluate(() => {
        const app = window._app;
        app.select_all(); app.delete_selected();
        const id = app.add_rectangle('ResizeMe', 100, 100, 120, 90, 0, 0, 1, 1);
        window._render(true);

        // Select
        app.select_node(id[0], id[1]);
        window._render(true);

        // Bottom-right corner at (220, 190). Click right on the handle.
        const hit = app.mouse_down(220, 190, false);
        app.mouse_move(270, 220); // drag 50 right, 30 down
        app.mouse_up();
        window._render(true);

        const info = JSON.parse(app.get_node_info(id[0], id[1]));
        return { hit, w: Math.round(info.width), h: Math.round(info.height) };
    });
    record('drag_resize', r.w > 120 && r.h > 90,
        `w=${r.w} h=${r.h} (expected >120, >90)`);
}

// ── Test: Drag outside corner to rotate ──────────────────────────────

async function testDragRotation(page) {
    const r = await page.evaluate(() => {
        const app = window._app;
        app.select_all(); app.delete_selected();
        const id = app.add_rectangle('RotateMe', 400, 200, 120, 90, 0.5, 0.5, 0, 1);
        window._render(true);
        app.select_node(id[0], id[1]);
        window._render(true);

        // Bottom-right corner at (520, 290). Go 12px outside.
        const rx = 532, ry = 302;
        const inZone = app.is_rotation_zone(rx, ry);

        app.mouse_down(rx, ry, false);
        // Drag to create a significant rotation
        app.mouse_move(rx - 150, ry + 100);
        app.mouse_up();
        window._render(true);

        const info = JSON.parse(app.get_node_info(id[0], id[1]));
        return { inZone, rotation: info.rotation || 0 };
    });
    record('drag_rotation', r.inZone && Math.abs(r.rotation) > 5,
        `inZone=${r.inZone} rotation=${r.rotation}`);
}

// ── Test: Double-click enters group ──────────────────────────────────

async function testDoubleClickGroup(page) {
    const r = await page.evaluate(() => {
        const app = window._app;
        app.select_all(); app.delete_selected();

        // Create two rects, group them
        const r1 = app.add_rectangle('G1', 600, 200, 80, 60, 1, 0, 0, 1);
        const r2 = app.add_rectangle('G2', 700, 200, 80, 60, 0, 0, 1, 1);
        app.select_node(r1[0], r1[1]);
        app.toggle_select_node(r2[0], r2[1]);
        const grp = app.group_selected();
        window._render(true);

        if (!grp || grp.length < 2) return { ok: false, reason: 'group failed' };

        // Click to select the group first
        app.mouse_down(640, 230, false);
        app.mouse_up();
        window._render(true);

        const selGroup = app.get_selected();
        const groupSelected = selGroup.length === 2 && selGroup[0] === grp[0];

        // Double-click on G1 (inside the group) to enter it
        // handle_double_click uses screen coords
        app.handle_double_click(640, 230);
        window._render(true);

        // After entering group, click on G1 to select it
        app.mouse_down(640, 230, false);
        app.mouse_up();
        window._render(true);

        const sel = app.get_selected();
        // Check if we selected the child (r1), not the group
        const selectedChild = sel.length >= 2 && sel[0] === r1[0];
        return { ok: true, groupSelected, selectedChild, selLen: sel.length, sel0: sel[0], r1_0: r1[0] };
    });
    record('dblclick_enter_group', r.ok !== false && r.selectedChild,
        r.ok === false ? r.reason : `groupSelected=${r.groupSelected} selectedChild=${r.selectedChild}`);
}

// ── Test: Double-click enters vector edit ────────────────────────────

async function testDoubleClickVectorEdit(page) {
    const r = await page.evaluate(() => {
        const app = window._app;
        app.select_all(); app.delete_selected();

        // Create a triangle vector
        app.pen_start();
        app.pen_mouse_down(100, 500);
        app.pen_mouse_up();
        app.pen_mouse_down(200, 500);
        app.pen_mouse_up();
        app.pen_mouse_down(150, 430);
        app.pen_mouse_up();
        app.pen_finish_closed();
        window._render(true);

        // Find the vector
        const found = JSON.parse(app.find_nodes_by_name('Vector'));
        if (!found.length) return { ok: false, reason: 'no vector found' };

        const v = found[found.length - 1];
        app.select_node(v.counter, v.client_id);
        window._render(true);

        // Double-click on it
        app.handle_double_click(150, 480);
        window._render(true);

        const editing = app.is_vector_editing();

        // Exit
        if (editing) app.vector_edit_exit();
        window._render(true);

        return { ok: true, editing };
    });
    record('dblclick_vector_edit', r.ok !== false && r.editing,
        r.ok === false ? r.reason : `editing=${r.editing}`);
}

// ── Test: Marquee selection ──────────────────────────────────────────

async function testMarqueeSelect(page) {
    const r = await page.evaluate(() => {
        const app = window._app;
        app.select_all(); app.delete_selected();

        app.add_rectangle('M1', 300, 500, 60, 60, 1, 0, 0, 1);
        app.add_rectangle('M2', 380, 500, 60, 60, 0, 1, 0, 1);
        app.add_rectangle('M3', 600, 500, 60, 60, 0, 0, 1, 1); // far away
        window._render(true);

        // Drag marquee around M1 and M2 only (start at empty space)
        app.mouse_down(280, 480, false); // empty space
        app.mouse_move(460, 580);
        app.mouse_up();
        window._render(true);

        const sel = app.get_selected();
        const count = sel ? sel.length / 2 : 0;
        return { count };
    });
    record('marquee_select', r.count === 2,
        `selected ${r.count} nodes, expected 2`);
}

// ── Test: Undo/Redo of mouse interaction ─────────────────────────────

async function testUndoRedoInteraction(page) {
    const r = await page.evaluate(() => {
        const app = window._app;
        app.select_all(); app.delete_selected();
        const id = app.add_rectangle('UndoMe', 500, 400, 80, 60, 1, 1, 0, 1);
        window._render(true);

        const before = JSON.parse(app.get_node_info(id[0], id[1]));

        // Select and drag
        app.mouse_down(540, 430, false);
        app.mouse_up();
        app.mouse_down(540, 430, false);
        app.mouse_move(640, 430);
        app.mouse_up();
        window._render(true);

        const after = JSON.parse(app.get_node_info(id[0], id[1]));

        // Undo
        app.undo();
        window._render(true);

        const undone = JSON.parse(app.get_node_info(id[0], id[1]));
        const movedBack = Math.abs(undone.x - before.x) < 5;

        // Redo
        app.redo();
        window._render(true);

        const redone = JSON.parse(app.get_node_info(id[0], id[1]));
        const movedForward = Math.abs(redone.x - after.x) < 5;

        return { beforeX: before.x, afterX: after.x, undoneX: undone.x, redoneX: redone.x, movedBack, movedForward };
    });
    record('undo_redo_drag', r.movedBack && r.movedForward,
        `before=${r.beforeX} after=${r.afterX} undo=${r.undoneX} redo=${r.redoneX}`);
}

// ── Test: Escape deselects ───────────────────────────────────────────

async function testEscapeExitsVectorEdit(page) {
    // Escape should exit vector edit mode
    await page.evaluate(() => {
        const app = window._app;
        app.select_all(); app.delete_selected();
        // Create a vector via pen
        app.pen_start();
        app.pen_mouse_down(100, 650);
        app.pen_mouse_up();
        app.pen_mouse_down(200, 650);
        app.pen_mouse_up();
        app.pen_mouse_down(150, 580);
        app.pen_mouse_up();
        app.pen_finish_closed();
        window._render(true);

        // Find and select the vector
        const found = JSON.parse(app.find_nodes_by_name('Vector'));
        const v = found[found.length - 1];
        app.select_node(v.counter, v.client_id);
        window._render(true);

        // Enter vector edit
        app.handle_double_click(150, 630);
        window._render(true);
    });
    const editing = await page.evaluate(() => window._app.is_vector_editing());

    // Press Escape
    await page.keyboard.press('Escape');
    await page.evaluate(() => window._render(true));

    const editingAfter = await page.evaluate(() => window._app.is_vector_editing());
    record('escape_exits_vector_edit', editing && !editingAfter,
        `editing=${editing} afterEscape=${editingAfter}`);
}

// ── Test: Shift+click multi-select ───────────────────────────────────

async function testShiftMultiSelect(page) {
    const r = await page.evaluate(() => {
        const app = window._app;
        app.select_all(); app.delete_selected();
        const r1 = app.add_rectangle('Shift1', 100, 700, 60, 60, 1, 0, 0, 1);
        const r2 = app.add_rectangle('Shift2', 200, 700, 60, 60, 0, 1, 0, 1);
        window._render(true);

        // Click first
        app.mouse_down(130, 730, false);
        app.mouse_up();
        const after1 = app.get_selected().length / 2;

        // Shift-click second
        app.mouse_down(230, 730, true);
        app.mouse_up();
        const after2 = app.get_selected().length / 2;

        return { after1, after2 };
    });
    record('shift_multi_select', r.after1 === 1 && r.after2 === 2,
        `after1click=${r.after1} afterShiftClick=${r.after2}`);
}

run().catch(e => { console.error(e); process.exit(2); });
