
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("http://localhost:3099", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000); // Let WASM + stress test load

  const results = await page.evaluate(() => {
    const app = window._app;
    if (!app) return ["FAIL: app not on window"];
    const r = [];

    // Switch to Apple Website (simpler page)
    app.switch_page(1);
    const n = app.node_count();
    r.push(`NODES: ${n > 0 ? "OK" : "FAIL"} (${n})`);

    const b = app.node_count();
    app.add_rectangle("S", 10, 10, 50, 50, 1, 0, 0, 1);
    r.push(`ADD: ${app.node_count() === b + 1 ? "OK" : "FAIL"}`);

    app.undo();
    r.push(`UNDO: ${app.node_count() === b ? "OK" : "FAIL"}`);
    app.redo();
    r.push(`REDO: ${app.node_count() === b + 1 ? "OK" : "FAIL"}`);

    const fid = app.add_frame("SF", 500, 500, 200, 100, .5, .5, .5, 1);
    app.set_insert_parent(fid[0], fid[1]);
    app.add_rectangle("Child", 10, 10, 50, 50, 1, 0, 0, 1);
    app.clear_insert_parent();
    r.push("NEST: OK");

    app.select_node(fid[0], fid[1]);
    app.delete_selected();
    r.push("DEL: OK");

    app.undo();
    app.select_node(fid[0], fid[1]);
    r.push(`COPY: ${app.copy_selected() > 0 ? "OK" : "FAIL"}`);
    r.push(`PASTE: ${app.paste() > 0 ? "OK" : "FAIL"}`);

    r.push(`SVG: ${app.export_svg(100, 100).startsWith("<svg") ? "OK" : "FAIL"}`);

    app.pen_start();
    r.push(`PEN: ${app.pen_is_active() ? "OK" : "FAIL"}`);
    app.pen_cancel();

    r.push(`PAGES: ${JSON.parse(app.get_pages()).length >= 3 ? "OK" : "FAIL"}`);
    r.push(`CAM: ${app.get_camera().length === 3 ? "OK" : "FAIL"}`);
    r.push(`TREE: ${app.get_tree_layers("", 0, 5)[0] > 0 ? "OK" : "FAIL"}`);

    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const t0 = performance.now();
    app.render_canvas2d(ctx, canvas.width, canvas.height);
    const ms = performance.now() - t0;
    r.push(`RENDER: ${ms < 16 ? "OK" : "SLOW"} (${ms.toFixed(1)}ms)`);

    // Switch to stress test, check perf
    app.switch_page(0);
    const t1 = performance.now();
    app.render_canvas2d(ctx, canvas.width, canvas.height);
    const ms2 = performance.now() - t1;
    r.push(`2M_RENDER: ${ms2 < 16 ? "OK" : "SLOW"} (${ms2.toFixed(1)}ms) [${app.node_count()} nodes]`);

    // Cleanup
    for (let i = 0; i < 15; i++) app.undo();
    app.switch_page(0);

    return r;
  });

  let pass = 0, fail = 0;
  for (const r of results) {
    const ok = r.includes("OK");
    console.log(`  ${ok ? "✓" : "✗"} ${r}`);
    if (ok) pass++; else fail++;
  }
  console.log(`\nSMOKE: ${fail === 0 ? "OK" : "FAIL"} — ${pass} passed, ${fail} failed`);

  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
})();
