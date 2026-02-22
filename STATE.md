# STATE — AI: READ THIS FIRST
# Then run: ./ide orient

## What Is This
AI-native IDE + Figma clone built in Rust/WASM.
The IDE is a correctness construction system (./ide script).
The Figma clone is the stress test that drives IDE evolution.

## Core Principle: CORRECTNESS BY CONSTRUCTION
The Rust type system is the primary verification tool.
`./ide check` = binary compile signal (~20 tokens).
`./ide check render` = deterministic pixel tests (~15 tokens).
Never visually inspect. Never read test output. Binary signals only.

## How To Orient After Context Loss
1. Run: ./ide orient
2. Run: ./ide check
3. That's it. ~40 tokens total.
4. If working across layers: ./ide boundary <layer>

## EDITING WORKFLOW (NEVER skip this)
Before editing ANY file:
1. ./ide survey <file>    — know the shape (~30 tokens)
2. Make ONE correct edit  — not 5 small broken ones
3. ./ide check            — binary signal (~20 tokens)
If check fails: ./ide survey again, understand, fix in ONE edit.

## SCALING STRATEGY (Decision d015, d016)
Architecture: 2 languages only (Rust + TypeScript)
- Rust: engine, renderer, CRDT, server (axum), DB (SQLite), WebSocket
- TypeScript: frontend only, vanilla TS, no framework (no React/Next.js)
- Build: cargo + wasm-pack + tsc

Workflow: VERTICAL SLICES
- ./ide slice start <name> — start a feature that cuts through layers
- ./ide boundary <layer>   — see only the API surface you need
- Build ONE feature end-to-end, not all of one layer

## What Has Been Built

### IDE (./ide script)
- orient — focused state dump + journal if active task has one (~50 tokens)
- check [check|build|wasm|test|render|clippy|ts|all] — binary verification
- journal write|append|show|clear — algorithmic state capture (survives compaction)
- survey <file|dir> — file skeleton BEFORE editing (~30 tokens)
- coherence [file] — detect frankenstein'd files
- boundary <layer> — cross-layer API surface (~30 tokens)
- slice <sub> — vertical feature slice tracking
- diff-check — what changed + compile check
- contract — type-level module contracts
- decide — decision log (prevents re-debates)
- task — work queue with dependencies
- module — module registry
- verify — full integrity sweep

### Hooks (.claude/hooks/)
- pain-check.sh — fires every 12 tool calls, forces reflection on pain/sprawl/ratio
- count-tools.sh — silent counter, tracks files/crates touched per cycle
- pre-compact.sh — saves recovery state before context compaction

### Figma Clone (Rust/WASM, 4 crates)

#### figma-engine (core)
- Document model: nodes, tree, properties, IDs
- Node types: Frame, Rectangle, Ellipse, Line, Polygon, Vector, Text, BooleanOp, Component, Instance
- Affine transforms with inverse
- Hit testing (click → node selection)
- Auto-layout engine (horizontal/vertical, spacing, padding, hug/fill/fixed)

#### figma-renderer
- Tile-based software renderer (64x64 tiles, L1 cache friendly)
- Scene graph builder (tree → flat render items, viewport culling)
- Rasterizer: rectangles (rounded corners), ellipses, paths (bezier flattening + scanline fill), lines
- Color sampler: solid fills, linear gradients, radial gradients
- Stroke rendering (expand to filled outline, all cap/join styles)
- Compositing with all 16 blend modes
- Deterministic pixel verification (8 render tests)

#### figma-crdt
- Operation-based CRDT with Lamport timestamps
- Operations: InsertNode, DeleteNode, MoveNode, SetProperty, Reorder
- Fractional indexing for conflict-free ordering
- Apply function with commutativity/idempotency
- History with sync support (ops_after)

#### figma-wasm
- Interactive canvas: select, drag, resize (8 handles), add, delete
- Ellipse and gradient rectangle bindings
- Selection overlay rendering
- WASM-bindgen bindings for browser

## Current State (Session 5)
Full stack running E2E: Rust → WASM → TypeScript → Canvas (Vite on localhost:3000)

### What works now (all verified in-browser):
- Shapes: rectangles, ellipses with alpha blending
- Selection: click to select, blue handles (8 resize handles)
- Drag & resize: move shapes, resize from any handle
- Zoom/pan: scroll wheel zoom (cursor-centered), space+drag pan, middle-click pan
- Undo/redo: Cmd+Z / Cmd+Shift+Z — covers ALL operations:
  - Add/remove nodes, move, resize, fill color change, name change, text content change
- Editable properties panel: name, position, size, fill color (with native color picker)
- Text editing: properties panel shows textarea for text nodes, edit content + auto-resize
- Layer panel: shows all shapes, click-to-select
- Toolbar: Frame, Rectangle, Ellipse, Text, Pen, Delete, Export PNG
- Pen tool: click for straight lines, click+drag for bezier curves, close path by clicking first anchor, Enter to finish open path, Escape to cancel. Visual overlay with handles.
- Text rendering: embedded Roboto Mono font via fontdue, per-glyph rasterization
- Frames: container nodes (can hold children), dark gray default fill
- PNG export: renders at 1:1 without selection overlay, downloads via browser
- WASM bridge: wasm-bindgen 0.2.110, generated JS bindings in app/pkg/
- Node type info: get_node_info returns type field (rectangle/ellipse/text/vector/frame/etc)

### Session 5 changes:
- BUG FIX: set_node_fill and set_node_name had no undo support — Cmd+Z skipped color/name edits
- BUG FIX: Text color change had no visual effect — set_node_fill now updates TextRun.color for text nodes
- BUG FIX: get_node_info returned wrong color for text nodes (style.fills vs TextRun.color)
- Added ChangeFill, ChangeName, ChangeText undo variants with symmetric reverse actions
- Added set_node_text WASM method for editing text content via properties panel
- Added set_node_font_size WASM method for changing text size
- Properties panel shows textarea + font size input for text nodes
- get_node_info returns node type, text content, and fontSize
- Updated pre-compact hook to include journal entries in recovery

### Session 5 self-audit:
- IDE tools:Figma features ratio still below 1:1 (built 4 features, 0 IDE tools before pain check)
- Used Playwright screenshots for verification — should use Rust render tests instead
- NEXT: Add render test for text nodes, then undo round-trip tests in Rust

### Build commands:
- `./ide check wasm` — cargo build + wasm-bindgen in one step (USE THIS!)
- `cd app && npx vite` — dev server on port 3000

### What's missing vs real Figma (THE HARD STUFF):
1. **In-place text editing** — double-click to type directly on canvas (currently via properties panel)
2. **Boolean operations UI** — union/subtract/intersect (engine supports, no UI)
3. **Corner radius UI** — adjustable rounded corners (engine supports)
4. **Gradients UI** — linear/radial gradient editor (renderer supports)
5. **Shadows/blur** — drop shadow, inner shadow, blur effects
6. **Components/instances** — reusable components with overrides
7. **Auto-layout** — responsive layout engine (engine has, no UI)
8. **Multi-user sync** — CRDT + WebSocket (both exist, not wired)
9. **Performance at scale** — 10K+ objects, tile culling optimization
10. **SVG export** — vector export format
11. **Prototyping** — click interactions, transitions
12. **Constraints** — responsive resizing within frames
13. **Path editing** — double-click vector to edit anchors after commit

## Key Commands
- ./ide orient          — active task + build status (~20 tokens)
- ./ide check           — cargo check OK/FAIL (~20 tokens)
- ./ide check wasm      — WASM build OK/FAIL
- ./ide check render    — deterministic pixel tests
- ./ide survey <file>   — file skeleton before editing
- ./ide boundary <layer> — cross-layer API (~30 tokens)
- ./ide slice <sub>     — vertical slice tracking
- ./ide verify          — full sweep
