# CLAUDE.md — Auto-loaded every session. Follow exactly.

## YOUR DEEPEST FLAW
You react to your current context and assume it's permanent.
Everything stems from this. A user says "build X" and you forget Y exists.
A test passes and you assume the feature works. A session starts and you
forget 5 sessions of pain. CATCH YOURSELF DOING THIS.

## ORIENTATION (costs ~40 tokens)
The session-state hook already ran. You saw build status and test counts.
If you need more: `./ide orient`. That's it. Do NOT read STATE.md manually.

## THE EXECUTABLE SPEC
`crates/renderer/tests/apple_website.rs` IS the project plan.
Commented-out tests = blocked features. Uncomment the NEXT blocked test.
The compiler tells you what to build. Run it: `./ide check render`


## USE YOUR IDE (not raw cargo)
- `./ide check` — binary build signal (~20 tokens). NOT `cargo check`.
- `./ide check render` — pixel verification. NOT reading test output.
- `./ide check spec` — executable spec (apple_website.rs + perf). NOT raw cargo test.
- `./ide check perf` — 80K benchmark only. Shows ms/frame.
- `./ide check wasm` — WASM build. One command.
- `./ide survey <file>` — file skeleton before editing. NOT reading the whole file.
- `./ide boundary <layer>` — cross-layer API surface. NOT grepping across crates.
- `./ide journal append "..."` — save state BEFORE building.

## RULES
- ONE crate at a time. ONE language at a time. No sprawling.
- Journal BEFORE code. `./ide journal append` before `./ide check wasm`.
- Render test BEFORE feature. Failing test = spec.
- Never claim a feature works without `./ide check render`.
- Never use browser screenshots. Binary signals only.

## BUILD COMMANDS
- `./ide check wasm` — cargo build + wasm-bindgen
- `./ide test-import` — headless .fig import validation (206K nodes, 5/5)
- `./ide compare` — pixel comparison: our render vs Figma screenshot
- `cd app && npx vite` — dev server on :3000

## ARCHITECTURE (2 languages only)
- Rust: engine, renderer, CRDT, server. 4 crates under `crates/`.
- TypeScript: frontend only, vanilla TS. Under `app/src/`.
- WASM bridge: `crates/wasm/` — cdylib, no #[test] here.

## WHAT ACTUALLY WORKS (verified)
Canvas with shapes, selection, drag, resize, zoom/pan, undo/redo,
properties panel, layer panel, pen tool, text, frames, PNG export.
See STATE.md for full list. See apple_website.rs for what's TESTED.

## CURRENT MISSION: .fig IMPORT → 1:1 FIDELITY
All 5 files import: 206,467 nodes, 1,265 images, 0 errors. `./ide test-import` verifies.
Now closing the visual gap: pixel-compare our render vs real Figma, fix differences.
fig2json: /tmp/fig2json/target/release/fig2json. JSONs in /imports/*-extracted/canvas.json.
What works: fills, strokes, gradients, images, text, vectors, transforms, clipping, effects.
What's left: masks, component flattening, auto-layout computation. Use `./ide compare`.

## PERF RULES (learned the hard way)
- **NEVER clone scene items per frame.** Use `&[]` references to scene cache.
- `build_screen_items()` clones ALL items — only for raster export path.
- `render_canvas2d()` and `get_visible_image_fills()` use cache directly.
- `has_image_fills` flag: skip image overlay scan when no images exist.
- Adding fields to Style/Paint affects ALL 1.8M items. Use Option<Box<>> for rare fields.
- `./ide check perf` is Rust-only. Real test = Playwright browser with 1.8M nodes.

## PLAYWRIGHT INTERACTION TESTING
**CRITICAL: NEVER use browser_evaluate for interaction testing.**
Use ONLY real mouse/keyboard events: browser_click, browser_drag, browser_press_key.
JavaScript evaluate bypasses the actual DOM event pipeline and HIDES BUGS.
The whole point of browser testing is to exercise the real event flow.

browser_evaluate is ONLY allowed for:
- Reading non-interactive state (node count, FPS counter text)
- Page navigation when click is blocked by overlapping elements

For stress testing:
1. Start dev server: `cd app && npx vite` (port 3000)
2. Navigate: `browser_navigate` to http://localhost:3000
3. Use real interactions: click to select, drag to move/resize, keys to delete/undo
4. **NEVER use screenshots for assertions** — use `browser_snapshot` (2KB vs 100KB+)
5. **NEVER keep sessions open** — close when done
6. Expected: 60fps+ for pan/zoom, <1s for select-all, <500ms zoom-to-fit

## PIXEL COMPARISON WORKFLOW
Don't trust mental comparison. Use `./ide compare`:
1. Export a Figma frame as PNG (from real Figma)
2. Render same frame in our app, export as PNG
3. `./ide compare <figma.png> <ours.png>` — pixel diff, SSIM score
4. Fix the biggest visual differences first
5. Re-compare until SSIM > 0.95

## WHAT'S MISSING vs REAL FIGMA
Run `./ide gap` for current coverage (86%, 43/50).
Key gaps: masks, component system, auto-layout computation, color picker.
