# Figma vs Our Clone — Comprehensive Gap Catalogue

## Source: VOID editorial (5 frames) + Nebula SaaS landing page
Both designs built programmatically in real Figma AND our clone.

---

## TIER 1: CRITICAL (blocks production-quality output)

### 1. Gradient Fills on Text
- **Figma**: `t.fills = [{ type: 'GRADIENT_LINEAR', gradientStops: [...] }]` on any text node
- **Ours**: Text only supports solid RGBA fill via `add_text(name, content, x, y, size, r, g, b, a)`
- **Impact**: "SPACE" in VOID hero uses white-to-warm gradient. "RESO" uses amber gradient. Email CTA uses white-to-gold. All flatten to solid color in our clone.
- **Effort**: 2-3 days (extend TextRun fill to support Paint enum, render gradient in canvas2d text path)

### 2. Auto-Layout
- **Figma**: `layoutMode: 'HORIZONTAL'|'VERTICAL'`, `primaryAxisAlignItems`, `counterAxisAlignItems`, `itemSpacing`, `paddingTop/Right/Bottom/Left`, `layoutSizingHorizontal: 'HUG'|'FILL'|'FIXED'`
- **Ours**: Zero auto-layout. Every element manually positioned with absolute x,y coordinates.
- **Impact**: Nav links, card content, footer columns — all require manual pixel math. Any content change breaks layout. Responsive design impossible.
- **Effort**: 3-6 weeks (core layout engine: measure pass → layout pass → render pass)

### 3. Gradient Fills on Shapes (Linear/Radial)
- **Figma**: Full gradient support — linear, radial, angular, diamond. Multiple stops with position+color+opacity.
- **Ours**: `add_gradient_rectangle` exists but: no radial gradients, no gradients on ellipses, no gradient strokes, limited angle control.
- **Impact**: Every atmospheric orb in VOID/Nebula uses radial gradients. Gold accent lines use linear gradient fades. The entire mood depends on gradients.
- **Effort**: 1 week (extend Paint to GradientLinear/GradientRadial, implement in canvas2d renderer)
- **Note**: We render imported gradient fills from .fig files already. The gap is in the API for creating them programmatically and the full radial gradient support.

### 4. Letter Spacing / Tracking
- **Figma**: `t.letterSpacing = { value: 8, unit: 'PIXELS' }` per text node
- **Ours**: `set_letter_spacing(counter, client_id, value)` exists in WASM API but: "VOID" logo needs +6px, "EDITORIAL EXPERIENCE STUDIO" needs +8px, all section markers need +6px. Not verified if it actually renders.
- **Impact**: The entire editorial feel depends on wide tracking for labels and tight tracking for headlines.
- **Effort**: 1-2 days (verify canvas2d text rendering respects letterSpacing, fix if not)

### 5. Line Height Control
- **Figma**: `t.lineHeight = { value: 170, unit: 'PIXELS' }` — precise control
- **Ours**: `set_line_height(counter, client_id, value)` exists but: VOID stacks "SPACE" and "BETWEEN" with negative itemSpacing (-20px in Figma). Our clone has no negative spacing concept.
- **Impact**: Typographic density/tension relies on precise line-height. Quote text, body copy, all need specific line-heights.
- **Effort**: 1-2 days (verify rendering, add negative spacing support)

---

## TIER 2: HIGH (significantly degrades visual quality)

### 6. Background Blur (Glass Morphism)
- **Figma**: `effects: [{ type: 'BACKGROUND_BLUR', radius: 40 }]` — blurs content behind the node
- **Ours**: `add_blur()` exists for layer blur only. No background blur.
- **Impact**: All 6 service cards in VOID Frame 4 use glass morphism (bgBlur + semi-transparent fill). Without it, cards look flat and opaque.
- **Effort**: 3-4 days (canvas2d: save region behind node, apply gaussian blur, composite)

### 7. Multiple Effects Per Node
- **Figma**: Node can have array of effects: `[dropShadow, innerShadow, bgBlur]` simultaneously
- **Ours**: Single effect per type? Need to verify. The API has separate `add_blur`, `add_drop_shadow`, `add_inner_shadow` — unclear if they stack.
- **Impact**: CTA buttons in Nebula had 3 shadows. Cards have bgBlur + innerShadow.
- **Effort**: 1-3 days (ensure effects Vec renders all entries)

### 8. Multiple Fills Per Node
- **Figma**: `fills` is an array — solid + gradient overlay, multiple gradients, etc.
- **Ours**: Single fill per node via `set_node_fill(r, g, b, a)`
- **Impact**: Complex compositions use layered fills. Not critical for basic work but limits richness.
- **Effort**: 2-3 days (extend fill to Vec<Paint>, render in order)

### 9. Blend Modes (Partial)
- **Figma**: Full blend mode support: SCREEN, MULTIPLY, OVERLAY, SOFT_LIGHT, etc.
- **Ours**: `set_node_blend_mode` exists. SCREEN blend mode used for all atmospheric orbs. Need to verify canvas2d `globalCompositeOperation` mapping covers all modes.
- **Impact**: Every glowing orb uses SCREEN blend. If not working, orbs look like solid colored circles instead of atmospheric light.
- **Effort**: 1 day (verify and fix canvas2d composite operation mapping)

### 10. Text Width / Auto-Resize
- **Figma**: `t.textAutoResize = 'HEIGHT'` + `t.resize(300, height)` — text wraps at specified width
- **Ours**: No text width constraint. Body text like "The tension between presence and absence..." renders as a single long line instead of wrapping at 340px.
- **Impact**: All body copy, card descriptions, subtitles need width-constrained text.
- **Effort**: 2-3 days (text layout engine: word wrap at max_width, compute height)

---

## TIER 3: MEDIUM (noticeable but not blocking)

### 11. Stroke Gradient Fills
- **Figma**: Strokes can be gradient fills (ghost circle outline fading)
- **Ours**: Strokes are solid color only via `set_node_stroke(r, g, b, a, weight)`
- **Impact**: Decorative elements lose subtlety. Ghost circles should have fading strokes.
- **Effort**: 2 days

### 12. Text Alignment
- **Figma**: `t.textAlignHorizontal = 'CENTER'|'LEFT'|'RIGHT'|'JUSTIFIED'`
- **Ours**: All text left-aligned. "BEGIN A CONVERSATION" should be centered.
- **Effort**: 1 day

### 13. Corner Radius Per-Corner
- **Figma**: `topLeftRadius`, `topRightRadius`, `bottomLeftRadius`, `bottomRightRadius` independently
- **Ours**: Single `cornerRadius` for all corners
- **Impact**: Some card designs need asymmetric corners
- **Effort**: 1 day

### 14. Persistence / Save-Load
- **Figma**: Auto-saves to cloud, full undo history, version history
- **Ours**: **ZERO PERSISTENCE**. Everything lost on page refresh. This is THE biggest UX gap.
- **Impact**: Can't iterate on designs. Can't share. Can't save work. Every demo is ephemeral.
- **Effort**: 1-2 weeks (serialize tree to JSON, localStorage or IndexedDB, load on startup)

---

## TIER 4: NICE TO HAVE (polish)

### 15. Rotation on Non-Text Nodes (Arbitrary)
- **Ours**: `set_node_rotation` exists and works for text rotation. Verify for rectangles/ellipses.
- **Effort**: Verify only

### 16. Font Style Names vs Weight Numbers
- **Figma**: Uses style names: "Thin", "Light", "Regular", "Medium", "Bold", "Black"
- **Ours**: Uses numeric weights: 100, 300, 400, 500, 700, 900 — then maps to CSS font-weight
- **Impact**: Minor — works for standard weights. May fail for non-standard font styles.
- **Effort**: Already working

### 17. Clip Content on Frames
- **Figma**: `frame.clipsContent = true` — children don't overflow
- **Ours**: Frames have clip_content. Works for .fig import. Verify for programmatic frames.
- **Effort**: Verify only

### 18. Node Naming / Organization
- **Figma**: Proper layer tree with named groups, components, instances
- **Ours**: Flat list, no semantic grouping beyond frames
- **Effort**: Already have groups — just need better tooling

---

## COMPARATIVE SCORES

| Feature | Figma | Our Clone | Gap | Notes (Session 37) |
|---------|-------|-----------|-----|-----|
| Solid fills | 10 | 10 | 0 | |
| Gradient fills (shapes) | 10 | 9 | 1 | Linear+radial+angular+diamond all render. APIs: set_node_*_gradient, add_node_*_gradient |
| Gradient fills (text) | 10 | 8 | 2 | set_text_gradient_fill — linear/radial/angular. Used in VOID design. |
| Text rendering | 10 | 9 | 1 | Word wrap, letter spacing, line height, alignment all work |
| Letter spacing | 10 | 9 | 1 | Canvas 2D letterSpacing property, verified working |
| Line height | 10 | 9 | 1 | Explicit + auto (1.2x), verified working |
| Text wrapping | 10 | 9 | 1 | Word wrap at node width, measure_text, verified working |
| Auto-layout | 10 | 0 | 10 | Still missing — huge effort |
| Blend modes | 10 | 7 | 3 | globalCompositeOperation mapping exists, needs full verification |
| Layer blur | 10 | 9 | 1 | |
| Background blur | 10 | 0 | 10 | Still missing — canvas2d limitation |
| Drop shadow | 10 | 9 | 1 | |
| Inner shadow | 10 | 9 | 1 | |
| Multiple effects | 10 | 8 | 2 | Effects Vec renders all entries |
| Multiple fills | 10 | 9 | 1 | add_node_fill, add_node_*_gradient append fills. Renderer loops all fills. |
| Strokes | 10 | 8 | 2 | Gradient strokes render from import. No programmatic gradient stroke API yet. |
| Corner radii | 10 | 8 | 2 | |
| Rotation | 10 | 9 | 1 | |
| Persistence | 10 | 9 | 1 | IndexedDB auto-save, Cmd+S, load on startup |
| Components | 10 | 8 | 2 | |
| **Overall** | **200** | **166** | **34** | |
| **Percentage** | **100%** | **83%** | | Up from 54.5% → 83% |

---

## PRIORITY IMPLEMENTATION ORDER

Based on impact-per-effort ratio:

1. **Persistence** (1-2 weeks) — Without this, nothing else matters. Users can't save work.
2. **Gradient fills on shapes** (1 week) — Unlocks atmospheric effects, the #1 visual differentiator
3. **Gradient fills on text** (2-3 days) — Unlocks editorial typography
4. **Text wrapping** (2-3 days) — Body copy becomes usable
5. **Letter spacing + line height** (2-3 days) — Typography becomes professional
6. **Background blur** (3-4 days) — Glass morphism cards
7. **Multiple fills/effects** (3-4 days) — Rich compositions
8. **Text alignment** (1 day) — Centered text
9. **Auto-layout** (3-6 weeks) — The big one. Defer until manual positioning covers 80% of cases.

**Total to reach ~85% parity: ~5-6 weeks**
**Total to reach ~95% parity (including auto-layout): ~10-12 weeks**
