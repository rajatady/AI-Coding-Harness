/**
 * Main entry point — wires WASM engine to DOM.
 * Vanilla TypeScript, no framework.
 */

import init, {FigmaApp} from '../pkg/figma_wasm.js';

await init();

const app = new FigmaApp("Untitled", 1);
// Expose app globally for headless/AI control (DaVinci Resolve-style)
(window as any)._app = app;
(window as any)._updatePageTabs = () => updatePageTabs();
(window as any)._render = (force?: boolean) => render(force ?? true);

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const info = document.getElementById('info')!;
const layersList = document.getElementById('layers-list')!;
const pageTabs = document.getElementById('page-tabs')!;
const propertiesContent = document.getElementById('properties-content')!;

// ─── Canvas sizing (DPR-aware for crisp Retina rendering) ───────────

const dpr = window.devicePixelRatio || 1;
let cssW = 0;
let cssH = 0;

function resize(): void {
    const workspace = document.getElementById('workspace')!;
    cssW = workspace.clientWidth - 480; // minus two panels
    cssH = workspace.clientHeight;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    app.set_viewport(cssW, cssH);
}

resize();
window.addEventListener('resize', () => {
    resize();
    render();
});

// ─── Project setup: 3 pages ──────────────────────────────────────────

// Page 1: 2M Node Stress Test — Apple Website artboards replicated
app.rename_page(0, "2M Stress Test");

// Each artboard template: ~20 nodes (frame + nav + hero + cards + footer)
// 100,000 artboards × 20 nodes = 2,000,000 nodes
const skipStress = new URLSearchParams(window.location.search).has('nostress');
const STRESS_COLS = skipStress ? 0 : 200;
const STRESS_ROWS = skipStress ? 0 : 500;
const AW = 1440, AH = 900, AG = 100;
const stressProducts = [
    { name: "iPhone 16 Pro Max", tc: [0.85,0.75,0.55], bg: [0,0,0] },
    { name: "MacBook Air", tc: [0.07,0.07,0.07], bg: [0.96,0.97,0.98] },
    { name: "iPad Pro", tc: [1,1,1], bg: [0,0,0] },
    { name: "Apple Watch Ultra", tc: [0.9,0.6,0.2], bg: [0,0,0] },
    { name: "AirPods Pro", tc: [1,1,1], bg: [0.96,0.96,0.96] },
    { name: "Apple Vision Pro", tc: [0.85,0.85,0.87], bg: [0,0,0] },
    { name: "iMac 24\"", tc: [0.2,0.5,0.9], bg: [1,1,1] },
    { name: "Mac Studio", tc: [0.5,0.5,0.5], bg: [0,0,0] },
    { name: "MacBook Pro 16\"", tc: [1,1,1], bg: [0.07,0.07,0.07] },
    { name: "iPad Air", tc: [0.3,0.4,0.8], bg: [1,1,1] },
];
const t0stress = performance.now();
let stressIdx = 0;
for (let row = 0; row < STRESS_ROWS; row++) {
    for (let col = 0; col < STRESS_COLS; col++) {
        const p = stressProducts[stressIdx % stressProducts.length];
        const x = col * (AW + AG);
        const y = row * (AH + AG);
        const [br,bg,bb] = p.bg;
        const [tr,tg,tb] = p.tc;
        const dark = br + bg + bb < 1.5;
        const s = dark ? 0.7 : 0.3;
        // Frame (1) — children nested inside for hierarchical culling
        const frameId = app.add_frame(`A${stressIdx}-${p.name}`, x, y, AW, AH, br, bg, bb, 1.0);
        app.set_insert_parent(frameId[0], frameId[1]);
        // Nav bar (7) — positions relative to frame origin
        app.add_rectangle(`A${stressIdx}-Nav`, 0, 0, AW, 52, 0.1, 0.1, 0.1, 0.92);
        app.add_text(`A${stressIdx}-Logo`, "Apple", 80, 14, 20.0, 1, 1, 1, 1);
        app.add_text(`A${stressIdx}-NStore`, "Store", 180, 18, 13.0, 0.85, 0.85, 0.85, 1);
        app.add_text(`A${stressIdx}-NMac`, "Mac", 260, 18, 13.0, 0.85, 0.85, 0.85, 1);
        app.add_text(`A${stressIdx}-NiPad`, "iPad", 330, 18, 13.0, 0.85, 0.85, 0.85, 1);
        app.add_text(`A${stressIdx}-NiPhn`, "iPhone", 400, 18, 13.0, 0.85, 0.85, 0.85, 1);
        app.add_text(`A${stressIdx}-NWatch`, "Watch", 490, 18, 13.0, 0.85, 0.85, 0.85, 1);
        // Hero (4)
        app.add_text(`A${stressIdx}-Title`, p.name, 400, 200, 56.0, tr, tg, tb, 1);
        app.add_text(`A${stressIdx}-Sub`, `The all-new ${p.name}. Designed for you.`, 300, 290, 24.0, s, s, s, 1);
        app.add_text(`A${stressIdx}-CTA1`, "Learn more >", 560, 350, 18.0, 0.25, 0.55, 1, 1);
        app.add_text(`A${stressIdx}-CTA2`, "Buy >", 760, 350, 18.0, 0.25, 0.55, 1, 1);
        // Product image placeholder (3)
        app.add_rounded_rect(`A${stressIdx}-Prod`, 500, 420, 440, 340, tr*0.3+0.1, tg*0.3+0.1, tb*0.3+0.1, 1, 24);
        app.add_rectangle(`A${stressIdx}-Badge`, 520, 430, 100, 30, 0.25, 0.55, 1.0, 1);
        app.add_text(`A${stressIdx}-Price`, `From $${999 + (col % 10) * 100}`, 650, 780, 16.0, s, s, s, 1);
        // Footer (3)
        app.add_rectangle(`A${stressIdx}-Foot`, 0, AH-80, AW, 80, 0.96, 0.96, 0.96, 1);
        app.add_text(`A${stressIdx}-Copy`, "Copyright 2025 Apple Inc.", 550, AH-50, 12.0, 0.5, 0.5, 0.5, 1);
        app.add_ellipse(`A${stressIdx}-Dot`, AW-60, AH-55, 20, 20, 0.8, 0.8, 0.8, 1);
        app.clear_insert_parent();
        stressIdx++;
    }
}
const stressMs = performance.now() - t0stress;
console.log(`Stress test: ${stressIdx} artboards, ${stressIdx * 20} nodes created in ${stressMs.toFixed(0)}ms`);

// Page 2: Apple Website — Multi-artboard design
const applePage = app.add_page("Apple Website - Ours, not imported");
app.switch_page(applePage);

// ── Artboard 1: Homepage Hero (iPhone 16 Pro) ──
app.add_frame("01-Hero", 0, 0, 1440, 900, 0.0, 0.0, 0.0, 1.0);
// Nav bar
app.add_rectangle("Nav-Bar", 0, 0, 1440, 52, 0.1, 0.1, 0.1, 0.92);
app.add_text("Nav-Logo", "Apple", 80, 14, 20.0, 1.0, 1.0, 1.0, 1.0);
app.add_text("Nav-Store", "Store", 180, 18, 13.0, 0.85, 0.85, 0.85, 1.0);
app.add_text("Nav-Mac", "Mac", 260, 18, 13.0, 0.85, 0.85, 0.85, 1.0);
app.add_text("Nav-iPad", "iPad", 330, 18, 13.0, 0.85, 0.85, 0.85, 1.0);
app.add_text("Nav-iPhone", "iPhone", 400, 18, 13.0, 0.85, 0.85, 0.85, 1.0);
app.add_text("Nav-Watch", "Watch", 490, 18, 13.0, 0.85, 0.85, 0.85, 1.0);
app.add_text("Nav-AirPods", "AirPods", 570, 18, 13.0, 0.85, 0.85, 0.85, 1.0);
// Hero content
app.add_text("Hero-Title", "iPhone 16 Pro", 440, 200, 64.0, 1.0, 1.0, 1.0, 1.0);
app.add_text("Hero-Subtitle", "Built for Apple Intelligence.", 450, 290, 28.0, 0.6, 0.6, 0.6, 1.0);
app.add_text("Hero-CTA-Learn", "Learn more >", 560, 350, 21.0, 0.25, 0.55, 1.0, 1.0);
app.add_text("Hero-CTA-Buy", "Buy >", 760, 350, 21.0, 0.25, 0.55, 1.0, 1.0);
// Phone silhouette placeholder
app.add_rectangle("Hero-Phone", 560, 420, 320, 440, 0.12, 0.12, 0.12, 1.0);
app.add_rectangle("Hero-Phone-Screen", 575, 438, 290, 400, 0.06, 0.06, 0.15, 1.0);
app.add_rectangle("Hero-Phone-Notch", 665, 420, 110, 28, 0.0, 0.0, 0.0, 1.0);

// ── Artboard 2: Product Grid ──
app.add_frame("02-Products", 1540, 0, 1440, 1200, 0.96, 0.96, 0.96, 1.0);
app.add_text("Products-Title", "Explore the lineup.", 1640, 40, 40.0, 0.07, 0.07, 0.07, 1.0);
// Card 1: MacBook Air
app.add_rounded_rect("Card-MBA", 1580, 110, 680, 520, 1.0, 1.0, 1.0, 1.0, 18);
app.add_text("Card-MBA-Title", "MacBook Air", 1790, 180, 40.0, 0.07, 0.07, 0.07, 1.0);
app.add_text("Card-MBA-Sub", "Lean. Mean. M4 machine.", 1750, 240, 22.0, 0.07, 0.07, 0.07, 1.0);
app.add_text("Card-MBA-Price", "From $1,099", 1830, 280, 16.0, 0.4, 0.4, 0.4, 1.0);
app.add_rectangle("Card-MBA-Img", 1680, 330, 480, 260, 0.92, 0.92, 0.94, 1.0);
// Card 2: MacBook Pro (dark)
app.add_rounded_rect("Card-MBP", 2300, 110, 680, 520, 0.07, 0.07, 0.07, 1.0, 18);
app.add_text("Card-MBP-Title", "MacBook Pro", 2510, 180, 40.0, 1.0, 1.0, 1.0, 1.0);
app.add_text("Card-MBP-Sub", "More power for your ideas.", 2480, 240, 22.0, 0.7, 0.7, 0.7, 1.0);
app.add_rectangle("Card-MBP-Img", 2400, 330, 480, 260, 0.15, 0.15, 0.17, 1.0);
// Card 3: iPhone
app.add_rounded_rect("Card-iPhone", 1580, 660, 680, 520, 0.0, 0.0, 0.0, 1.0, 18);
app.add_text("Card-iPhone-Title", "iPhone 16 Pro", 1780, 700, 40.0, 0.85, 0.75, 0.55, 1.0);
app.add_text("Card-iPhone-Sub", "Hello, Apple Intelligence.", 1760, 760, 22.0, 0.7, 0.7, 0.7, 1.0);
app.add_rectangle("Card-iPhone-Img", 1800, 820, 260, 340, 0.15, 0.12, 0.1, 1.0);
// Card 4: iPad
app.add_rounded_rect("Card-iPad", 2300, 660, 680, 520, 0.96, 0.97, 0.98, 1.0, 18);
app.add_text("Card-iPad-Title", "iPad Pro", 2540, 700, 40.0, 0.07, 0.07, 0.07, 1.0);
app.add_text("Card-iPad-Sub", "Impossibly thin. Incredibly powerful.", 2420, 760, 22.0, 0.07, 0.07, 0.07, 1.0);
app.add_rectangle("Card-iPad-Img", 2480, 820, 320, 340, 0.85, 0.87, 0.9, 1.0);

// ── Artboard 3: Services ──
app.add_frame("03-Services", 3080, 0, 1440, 800, 1.0, 1.0, 1.0, 1.0);
app.add_text("Services-Title", "Services", 3700, 40, 40.0, 0.07, 0.07, 0.07, 1.0);
app.add_rounded_rect("ATV-Card", 3120, 120, 450, 340, 0.0, 0.0, 0.0, 1.0, 18);
app.add_text("ATV-Title", "Apple TV+", 3260, 160, 32.0, 1.0, 1.0, 1.0, 1.0);
app.add_text("ATV-Sub", "New originals every month.", 3200, 210, 18.0, 0.7, 0.7, 0.7, 1.0);
app.add_rectangle("ATV-Img", 3140, 260, 410, 180, 0.15, 0.1, 0.2, 1.0);
app.add_rounded_rect("Music-Card", 3590, 120, 450, 340, 0.98, 0.22, 0.27, 1.0, 18);
app.add_text("Music-Title", "Apple Music", 3710, 160, 32.0, 1.0, 1.0, 1.0, 1.0);
app.add_text("Music-Sub", "100 million songs.", 3720, 210, 18.0, 1.0, 0.85, 0.85, 1.0);
app.add_rounded_rect("Arcade-Card", 4060, 120, 450, 340, 0.12, 0.12, 0.45, 1.0, 18);
app.add_text("Arcade-Title", "Apple Arcade", 4170, 160, 32.0, 1.0, 1.0, 1.0, 1.0);
// Footer
app.add_rectangle("Footer-BG", 3080, 500, 1440, 300, 0.96, 0.96, 0.96, 1.0);
app.add_text("Footer-Copyright", "Copyright 2025 Apple Inc. All rights reserved.", 3550, 570, 12.0, 0.5, 0.5, 0.5, 1.0);

// ── Artboards 4-103: Product Detail Pages (100 products) ──
const products = [
    { name: "iPhone 16 Pro Max", color: [0.85,0.75,0.55], bg: [0,0,0] },
    { name: "iPhone 16 Pro", color: [0.7,0.7,0.75], bg: [0,0,0] },
    { name: "iPhone 16", color: [0.3,0.5,0.8], bg: [0.96,0.96,0.96] },
    { name: "iPhone 16 Plus", color: [0.4,0.7,0.5], bg: [0.96,0.96,0.96] },
    { name: "iPhone SE", color: [0.9,0.2,0.2], bg: [1,1,1] },
    { name: "MacBook Air 13\"", color: [0.07,0.07,0.07], bg: [0.96,0.97,0.98] },
    { name: "MacBook Air 15\"", color: [0.07,0.07,0.07], bg: [0.96,0.97,0.98] },
    { name: "MacBook Pro 14\"", color: [1,1,1], bg: [0.07,0.07,0.07] },
    { name: "MacBook Pro 16\"", color: [1,1,1], bg: [0.07,0.07,0.07] },
    { name: "iMac 24\"", color: [0.2,0.5,0.9], bg: [1,1,1] },
    { name: "Mac Studio", color: [0.5,0.5,0.5], bg: [0,0,0] },
    { name: "Mac Pro", color: [0.7,0.7,0.7], bg: [0,0,0] },
    { name: "Mac mini", color: [0.6,0.6,0.6], bg: [0.96,0.96,0.96] },
    { name: "iPad Pro 13\"", color: [1,1,1], bg: [0,0,0] },
    { name: "iPad Pro 11\"", color: [1,1,1], bg: [0,0,0] },
    { name: "iPad Air", color: [0.3,0.4,0.8], bg: [1,1,1] },
    { name: "iPad mini", color: [0.8,0.6,0.9], bg: [1,1,1] },
    { name: "iPad 10th gen", color: [0.3,0.6,0.8], bg: [0.96,0.96,0.96] },
    { name: "Apple Watch Ultra 2", color: [0.9,0.6,0.2], bg: [0,0,0] },
    { name: "Apple Watch Series 10", color: [0.8,0.75,0.65], bg: [0,0,0] },
    { name: "Apple Watch SE", color: [0.85,0.85,0.87], bg: [1,1,1] },
    { name: "AirPods Pro 2", color: [1,1,1], bg: [0,0,0] },
    { name: "AirPods 4", color: [1,1,1], bg: [0.96,0.96,0.96] },
    { name: "AirPods Max", color: [0.2,0.3,0.5], bg: [1,1,1] },
    { name: "Apple Vision Pro", color: [0.85,0.85,0.87], bg: [0,0,0] },
];
const artboardW = 1440, artboardH = 900, artboardGap = 100;
let artboardIdx = 4;
for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 25; col++) {
        const prod = products[(row * 25 + col) % products.length];
        const x = (artboardIdx - 1) * (artboardW + artboardGap);
        const y = 1100 + row * (artboardH + artboardGap);
        const num = String(artboardIdx).padStart(2, '0');
        const [br,bg,bb] = prod.bg;
        app.add_frame(`${num}-${prod.name}`, x, y, artboardW, artboardH, br, bg, bb, 1.0);
        // Title
        const [cr,cg,cb] = prod.color;
        app.add_text(`${num}-Title`, prod.name, x + 400, y + 200, 56.0, cr, cg, cb, 1.0);
        // Subtitle
        const isDark = br + bg + bb < 1.5;
        const sub = isDark ? 0.7 : 0.3;
        app.add_text(`${num}-Sub`, `The all-new ${prod.name}. Designed to amaze.`, x + 300, y + 290, 24.0, sub, sub, sub, 1.0);
        // CTA buttons
        app.add_text(`${num}-CTA`, "Learn more >", x + 600, y + 350, 18.0, 0.25, 0.55, 1.0, 1.0);
        // Product placeholder
        app.add_rounded_rect(`${num}-Product`, x + 520, y + 420, 400, 400, cr * 0.3 + 0.1, cg * 0.3 + 0.1, cb * 0.3 + 0.1, 1.0, 24);
        // Price tag
        app.add_text(`${num}-Price`, `From $${999 + col * 100}`, x + 650, y + 850, 16.0, sub, sub, sub, 1.0);
        artboardIdx++;
    }
}

// Page 3: Starbucks Logo — Vector paths
const starbucksPage = app.add_page("Starbucks Logo");
app.switch_page(starbucksPage);

// Logo centered at (400, 400), outer radius 200
const CX = 400, CY = 400, R = 200;

// Outer green circle
app.add_ellipse("Outer-Circle", CX - R, CY - R, R * 2, R * 2, 0.0, 0.39, 0.22, 1.0);
// White ring band
app.add_ellipse("Ring-White", CX - R + 18, CY - R + 18, (R - 18) * 2, (R - 18) * 2, 1.0, 1.0, 1.0, 1.0);
// Green inner circle
app.add_ellipse("Ring-Inner", CX - R + 42, CY - R + 42, (R - 42) * 2, (R - 42) * 2, 0.0, 0.39, 0.22, 1.0);
// Brand text
app.add_text("Brand-Top", "STARBUCKS", CX - 50, CY - R + 26, 16.0, 1.0, 1.0, 1.0, 1.0);
app.add_text("Brand-Bottom", "COFFEE", CX - 32, CY + R - 44, 16.0, 1.0, 1.0, 1.0, 1.0);
// Stars (small diamonds)
app.add_star("Star-Left", CX - R + 30, CY - 9, 18, 18, 1.0, 1.0, 1.0, 1.0, 5, 0.38);
app.add_star("Star-Right", CX + R - 48, CY - 9, 18, 18, 1.0, 1.0, 1.0, 1.0, 5, 0.38);
// Siren — head
app.add_ellipse("Siren-Head", CX - 28, CY - 80, 56, 56, 1.0, 1.0, 1.0, 1.0);
// Siren — crown (5-pointed crown using vector path)
app.add_vector("Siren-Crown", CX - 24, CY - 118, 48, 30, 1.0, 1.0, 1.0, 1.0,
    [
        0, 0, 30,    // MoveTo bottom-left of crown
        1, 6, 10,    // LineTo first point up
        1, 12, 24,   // LineTo valley
        1, 18, 4,    // LineTo second point
        1, 24, 24,   // LineTo center valley
        1, 30, 4,    // LineTo third point
        1, 36, 24,   // LineTo valley
        1, 42, 10,   // LineTo fourth point
        1, 48, 30,   // LineTo bottom-right
        3             // Close
    ]);
// Siren — body (tapered using vector path)
app.add_vector("Siren-Body", CX - 26, CY - 26, 52, 92, 1.0, 1.0, 1.0, 1.0,
    [
        0, 2, 0,       // MoveTo top-left
        1, 50, 0,      // LineTo top-right
        2, 50, 30, 44, 60, 38, 92, // CubicTo curve right side down
        1, 14, 92,     // LineTo bottom-left
        2, 8, 60, 2, 30, 2, 0,     // CubicTo curve left side up
        3              // Close
    ]);
// Tail fins (vector curves)
app.add_vector("Tail-Left", CX - 90, CY + 20, 80, 70, 1.0, 1.0, 1.0, 1.0,
    [
        0, 80, 0,      // Start from center
        2, 40, 10, 0, 30, 10, 70,  // Curve outward-left
        2, 20, 50, 60, 20, 80, 0,  // Curve back
        3
    ]);
app.add_vector("Tail-Right", CX + 10, CY + 20, 80, 70, 1.0, 1.0, 1.0, 1.0,
    [
        0, 0, 0,       // Start from center
        2, 40, 10, 80, 30, 70, 70, // Curve outward-right
        2, 60, 50, 20, 20, 0, 0,   // Curve back
        3
    ]);
// Inner green mask circle (clips tail overflow)
app.add_ellipse("Inner-Mask", CX - R + 48, CY - R + 48, (R - 48) * 2, (R - 48) * 2, 0.0, 0.39, 0.22, 0.0);

// ─── Reference: Real Starbucks logo side-by-side ─────────────────────
// Label for our version
app.add_text("Label-Ours", "Our Version", CX - 60, CY + R + 30, 18.0, 1.0, 1.0, 1.0, 0.7);
// Reference image from imports/starbucks.png
app.add_image_fill("Starbucks-Reference", CX + R + 80, CY - R, R * 2, R * 2, "starbucks.png", "fit", 1.0);
app.add_text("Label-Reference", "Reference (starbucks.png)", CX + R + 100, CY + R + 30, 18.0, 1.0, 1.0, 1.0, 0.7);

// Page 4: Apple iPad "Explore the lineup" — built from scratch to match Figma 1:1
const appleIPadPage = app.add_page("Apple iPad - Built from Scratch");
app.switch_page(appleIPadPage);

// Colors (Apple Design System)
const cBg = [0.96, 0.96, 0.97] as const;        // #f5f5f7 section background
const cBlack = [0.11, 0.11, 0.12] as const;      // #1d1d1f heading/body text
const cGray = [0.43, 0.43, 0.45] as const;       // #6e6e73 description text
const cBlue = [0.0, 0.44, 0.89] as const;        // #0071e3 button/link blue
const cLinkBlue = [0.0, 0.4, 0.8] as const;      // #0066cc "Compare" link
const cWhite = [1.0, 1.0, 1.0] as const;         // #ffffff

// Layout constants
const ART_W = 1440, ART_H = 1050;
const SECTION_PAD_X = 80, SECTION_PAD_TOP = 70;
const CARD_W = 310, CARD_H = 720, CARD_GAP = 24;
const CARD_START_X = SECTION_PAD_X;
const CARD_START_Y = 200;
const IMG_H = 340, IMG_W = CARD_W;
const DOT_Y = CARD_START_Y + IMG_H + 25;
const DOT_R = 7;
const NAME_Y = DOT_Y + 35;
const DESC_Y = NAME_Y + 50;
const PRICE_Y = DESC_Y + 50;
const BTN_Y = PRICE_Y + 50;

// ── Main artboard ──
const artId = app.add_frame("iPad-Explore-Lineup", 0, 0, ART_W, ART_H, ...cBg, 1.0);
app.set_insert_parent(artId[0], artId[1]);

// ── Section Header ──
app.add_text("Heading", "Explore the lineup.", SECTION_PAD_X, SECTION_PAD_TOP + 20, 48.0, ...cBlack, 1.0);
app.add_text("Compare-Link", "Compare all models >", ART_W - 280, SECTION_PAD_TOP + 40, 17.0, ...cLinkBlue, 1.0);

// ── Separator line below header ──
app.add_rectangle("Header-Sep", SECTION_PAD_X, CARD_START_Y - 10, ART_W - 2 * SECTION_PAD_X, 1, 0.85, 0.85, 0.85, 1.0);

// ── Product Cards ──
interface CardData {
    name: string;
    desc: string;
    price: string;
    priceMo: string;
    imgBg: readonly [number, number, number];
    dots: readonly (readonly [number, number, number])[];
}

const cards: CardData[] = [
    {
        name: "iPad Pro",
        desc: "The ultimate iPad experience\nwith the most advanced\ntechnology.",
        price: "From $999",
        priceMo: "or $83.25/mo.\nfor 12 mo.*",
        imgBg: [0.0, 0.0, 0.0],  // black
        dots: [[0.2,0.2,0.2], [0.75,0.75,0.75]],  // space black, silver
    },
    {
        name: "iPad Air",
        desc: "Serious performance in a\nthin and light design.",
        price: "From $599",
        priceMo: "or $49.91/mo.\nfor 12 mo.*",
        imgBg: [0.12, 0.12, 0.14],  // dark
        dots: [[0.55,0.55,0.6], [0.3,0.35,0.7], [0.75,0.65,0.85], [0.8,0.75,0.6]],
    },
    {
        name: "iPad",
        desc: "The colorful, all-screen\niPad for the things you\ndo every day.",
        price: "From $349",
        priceMo: "or $29.08/mo.\nfor 12 mo.*",
        imgBg: [0.96, 0.96, 0.97],  // light
        dots: [[0.2,0.25,0.55], [0.8,0.2,0.3], [0.85,0.75,0.2], [0.75,0.75,0.75]],
    },
    {
        name: "iPad mini",
        desc: "The full iPad experience\nin an ultraportable design.",
        price: "From $499",
        priceMo: "or $41.58/mo.\nfor 12 mo.*",
        imgBg: [0.95, 0.93, 0.9],  // warm light
        dots: [[0.2,0.2,0.2], [0.7,0.65,0.8], [0.3,0.35,0.7], [0.75,0.72,0.6]],
    },
];

for (let i = 0; i < cards.length; i++) {
    const c = cards[i];
    const cx = CARD_START_X + i * (CARD_W + CARD_GAP);

    // Product image background
    app.add_rounded_rect(`Card${i}-ImgBg`, cx, CARD_START_Y, IMG_W, IMG_H, ...c.imgBg, 1.0, 16);

    // Placeholder product silhouette (dark rectangle suggesting device shape)
    const devW = 140, devH = 200;
    const devX = cx + (IMG_W - devW) / 2;
    const devY = CARD_START_Y + (IMG_H - devH) / 2 - 10;
    const silR = c.imgBg[0] < 0.5 ? 0.15 : 0.75;
    const silG = c.imgBg[1] < 0.5 ? 0.15 : 0.75;
    const silB = c.imgBg[2] < 0.5 ? 0.17 : 0.77;
    app.add_rounded_rect(`Card${i}-Device`, devX, devY, devW, devH, silR, silG, silB, 1.0, 12);
    // Screen area inside device
    app.add_rounded_rect(`Card${i}-Screen`, devX + 5, devY + 5, devW - 10, devH - 10, silR * 0.4, silG * 0.4, silB * 0.5, 1.0, 8);

    // Color dots
    const dotsW = c.dots.length * (DOT_R * 2 + 6) - 6;
    const dotsStartX = cx + (CARD_W - dotsW) / 2;
    for (let d = 0; d < c.dots.length; d++) {
        const dx = dotsStartX + d * (DOT_R * 2 + 6);
        app.add_ellipse(`Card${i}-Dot${d}`, dx, DOT_Y, DOT_R * 2, DOT_R * 2, ...c.dots[d], 1.0);
    }

    // Product name (bold, centered — approximate centering)
    const nameW = c.name.length * 14;
    app.add_text(`Card${i}-Name`, c.name, cx + (CARD_W - nameW) / 2, NAME_Y, 28.0, ...cBlack, 1.0);

    // Description (smaller, gray, centered)
    const descLines = c.desc.split('\n');
    for (let li = 0; li < descLines.length; li++) {
        const lineW = descLines[li].length * 7.5;
        app.add_text(`Card${i}-Desc${li}`, descLines[li], cx + (CARD_W - lineW) / 2, DESC_Y + li * 20, 14.0, ...cGray, 1.0);
    }

    // Price (semibold)
    const priceW = c.price.length * 8;
    app.add_text(`Card${i}-Price`, c.price, cx + (CARD_W - priceW) / 2 - 30, PRICE_Y, 14.0, ...cBlack, 1.0);
    // Price monthly
    const moLines = c.priceMo.split('\n');
    for (let li = 0; li < moLines.length; li++) {
        app.add_text(`Card${i}-PriceMo${li}`, moLines[li], cx + (CARD_W - priceW) / 2 + priceW * 0.6, PRICE_Y + li * 18, 14.0, ...cBlack, 1.0);
    }

    // "Learn more" button — blue pill
    const btnW = 140, btnH = 40;
    const btnX = cx + (CARD_W / 2) - btnW - 10;
    app.add_rounded_rect(`Card${i}-LearnBtn`, btnX, BTN_Y, btnW, btnH, ...cBlue, 1.0, 20);
    app.add_text(`Card${i}-LearnTxt`, "Learn more", btnX + 22, BTN_Y + 10, 15.0, ...cWhite, 1.0);

    // "Buy >" link text
    app.add_text(`Card${i}-Buy`, "Buy >", cx + CARD_W / 2 + 20, BTN_Y + 10, 15.0, ...cBlue, 1.0);
}

// ── Spec Comparison Section (below cards) ──
const specY = BTN_Y + 80;
app.add_rectangle("Spec-Sep", SECTION_PAD_X, specY, ART_W - 2 * SECTION_PAD_X, 1, 0.85, 0.85, 0.85, 1.0);

// Screen sizes
const specSizes = ['13" or 11"', '13" or 11"', '10.9"', '8.3"'];
const specDisplays = ['Ultra Retina XDR\ndisplay', 'Liquid Retina\ndisplay', 'Liquid Retina\ndisplay', 'Liquid Retina\ndisplay'];
const specChips = ['M4 chip', 'M2 chip', 'A16 Bionic\nchip', 'A17 Pro\nchip'];

for (let i = 0; i < 4; i++) {
    const cx = CARD_START_X + i * (CARD_W + CARD_GAP);
    const szW = specSizes[i].length * 12;
    app.add_text(`Spec${i}-Size`, specSizes[i], cx + (CARD_W - szW) / 2, specY + 25, 22.0, ...cBlack, 1.0);

    const dispLines = specDisplays[i].split('\n');
    for (let li = 0; li < dispLines.length; li++) {
        const lw = dispLines[li].length * 7;
        app.add_text(`Spec${i}-Disp${li}`, dispLines[li], cx + (CARD_W - lw) / 2, specY + 60 + li * 18, 14.0, ...cGray, 1.0);
    }

    // Separator
    app.add_rectangle(`Spec${i}-Sep2`, cx, specY + 110, CARD_W, 1, 0.85, 0.85, 0.85, 1.0);

    const chipLines = specChips[i].split('\n');
    for (let li = 0; li < chipLines.length; li++) {
        const lw = chipLines[li].length * 7;
        app.add_text(`Spec${i}-Chip${li}`, chipLines[li], cx + (CARD_W - lw) / 2, specY + 130 + li * 18, 14.0, ...cGray, 1.0);
    }
}

// ── Navigation arrows at bottom ──
app.add_text("Nav-Left", "<", ART_W / 2 - 30, ART_H - 40, 24.0, 0.7, 0.7, 0.7, 1.0);
app.add_text("Nav-Right", ">", ART_W / 2 + 10, ART_H - 40, 24.0, 0.7, 0.7, 0.7, 1.0);

app.clear_insert_parent();

// ─── Page 5: Feature Showcase — Every Supported Feature ─────────────
const showcasePage = app.add_page("Feature Showcase");
app.switch_page(showcasePage);

// Helper: get ID parts from add_* return value
const id = (arr: Uint32Array) => [arr[0], arr[1]] as const;

// ── Section 1: Primitive Shapes ──────────────────────────────────────
const shapesFrame = id(app.add_frame("1. Shapes", 0, 0, 900, 200, 0.96, 0.96, 0.97, 1.0));
app.set_insert_parent(shapesFrame[0], shapesFrame[1]);
app.add_text("Shapes-Title", "Primitive Shapes", 20, 10, 18.0, 0.1, 0.1, 0.1, 1.0);
app.add_rectangle("Rectangle", 20, 50, 120, 100, 0.2, 0.5, 1.0, 1.0);
app.add_rounded_rect("Rounded Rect", 160, 50, 120, 100, 0.95, 0.3, 0.2, 1.0, 16);
app.add_ellipse("Ellipse", 300, 50, 120, 100, 0.3, 0.8, 0.4, 1.0);
app.add_line("Line", 440, 100, 560, 50, 0.9, 0.1, 0.3, 1.0, 3.0);
// Star primitive (5-pointed)
app.add_star("Star", 580, 50, 100, 100, 1.0, 0.8, 0.0, 1.0, 5, 0.38);
app.add_text("Text Node", "Hello, Figma!", 710, 70, 24.0, 0.1, 0.1, 0.1, 1.0);
app.clear_insert_parent();

// ── Section 2: Fills & Strokes ───────────────────────────────────────
const fillsFrame = id(app.add_frame("2. Fills & Strokes", 0, 220, 900, 200, 0.96, 0.96, 0.97, 1.0));
app.set_insert_parent(fillsFrame[0], fillsFrame[1]);
app.add_text("Fills-Title", "Fills, Gradients & Strokes", 20, 10, 18.0, 0.1, 0.1, 0.1, 1.0);
// Solid fill
app.add_rectangle("Solid Fill", 20, 50, 100, 100, 0.0, 0.44, 0.89, 1.0);
// Gradient fill
app.add_gradient_rectangle("Linear Gradient", 140, 50, 100, 100,
    0.0, 0.0, 1.0, 1.0,
    new Float32Array([0.0, 1.0]),
    new Float32Array([0.93, 0.2, 0.3, 1.0, 0.2, 0.3, 0.93, 1.0])
);
// Semi-transparent fill
const semiId = id(app.add_rectangle("50% Opacity", 260, 50, 100, 100, 0.8, 0.2, 0.9, 1.0));
app.set_node_opacity(semiId[0], semiId[1], 0.5);
// Stroke
const strokeId = id(app.add_rectangle("Stroked", 380, 50, 100, 100, 1.0, 1.0, 1.0, 1.0));
app.set_node_stroke(strokeId[0], strokeId[1], 0.0, 0.0, 0.0, 1.0, 3.0);
// Dashed stroke
const dashedId = id(app.add_rectangle("Dashed", 500, 50, 100, 100, 1.0, 1.0, 1.0, 1.0));
app.set_node_stroke(dashedId[0], dashedId[1], 0.9, 0.2, 0.2, 1.0, 2.0);
app.set_dash_pattern(dashedId[0], dashedId[1], new Float32Array([8, 4]));
// Per-corner radius
const cornerId = id(app.add_rectangle("Per-Corner Radius", 620, 50, 100, 100, 0.2, 0.7, 0.5, 1.0));
app.set_node_corner_radius(cornerId[0], cornerId[1], 0, 24, 0, 24);
app.clear_insert_parent();

// ── Section 3: Effects ───────────────────────────────────────────────
const fxFrame = id(app.add_frame("3. Effects", 0, 440, 900, 200, 0.96, 0.96, 0.97, 1.0));
app.set_insert_parent(fxFrame[0], fxFrame[1]);
app.add_text("FX-Title", "Drop Shadow, Inner Shadow, Blur", 20, 10, 18.0, 0.1, 0.1, 0.1, 1.0);
// Drop shadow
const shadowId = id(app.add_rounded_rect("Drop Shadow", 20, 50, 120, 100, 1.0, 1.0, 1.0, 1.0, 12));
app.add_drop_shadow(shadowId[0], shadowId[1], 0.0, 0.0, 0.0, 0.3, 4, 6, 12, 0);
// Inner shadow
const innerShadId = id(app.add_rounded_rect("Inner Shadow", 180, 50, 120, 100, 0.9, 0.9, 0.95, 1.0, 12));
app.add_inner_shadow(innerShadId[0], innerShadId[1], 0.0, 0.0, 0.0, 0.4, 2, 3, 8, 0);
// Blur
const blurId = id(app.add_rectangle("Layer Blur", 340, 50, 120, 100, 0.0, 0.44, 0.89, 1.0));
app.add_blur(blurId[0], blurId[1], 4.0);
// Blend modes
const blendBg = id(app.add_rectangle("Blend-BG", 500, 50, 140, 100, 0.9, 0.2, 0.2, 1.0));
const blendFg = id(app.add_rectangle("Blend-Multiply", 540, 70, 100, 80, 0.2, 0.5, 0.9, 1.0));
app.set_node_blend_mode(blendFg[0], blendFg[1], 2); // 2 = Multiply
app.add_text("Blend-Label", "Multiply", 540, 160, 12.0, 0.4, 0.4, 0.4, 1.0);
app.clear_insert_parent();

// ── Section 4: Frames, Clipping & Auto-Layout ────────────────────────
const layoutFrame = id(app.add_frame("4. Layout", 0, 660, 900, 240, 0.96, 0.96, 0.97, 1.0));
app.set_insert_parent(layoutFrame[0], layoutFrame[1]);
app.add_text("Layout-Title", "Frames, Clipping & Auto-Layout", 20, 10, 18.0, 0.1, 0.1, 0.1, 1.0);
// Clipping frame — child overflows but is clipped
const clipFrame = id(app.add_frame("Clip Frame", 20, 50, 120, 100, 0.85, 0.85, 0.9, 1.0));
app.set_insert_parent(clipFrame[0], clipFrame[1]);
app.add_ellipse("Overflows", -20, -20, 160, 140, 0.9, 0.3, 0.5, 1.0);
app.clear_insert_parent();
app.set_insert_parent(layoutFrame[0], layoutFrame[1]);
// Auto-layout (horizontal)
const autoH = id(app.add_frame("Auto H", 180, 50, 300, 60, 0.95, 0.95, 1.0, 1.0));
app.set_auto_layout(autoH[0], autoH[1], 0, 12, 10, 10, 10, 10); // horizontal, 12px gap, 10px padding
app.set_insert_parent(autoH[0], autoH[1]);
app.add_rounded_rect("Chip-1", 0, 0, 80, 36, 0.0, 0.44, 0.89, 1.0, 18);
app.add_rounded_rect("Chip-2", 0, 0, 80, 36, 0.3, 0.7, 0.3, 1.0, 18);
app.add_rounded_rect("Chip-3", 0, 0, 80, 36, 0.9, 0.5, 0.1, 1.0, 18);
app.clear_insert_parent();
app.set_insert_parent(layoutFrame[0], layoutFrame[1]);
// Auto-layout (vertical)
const autoV = id(app.add_frame("Auto V", 500, 50, 150, 180, 1.0, 1.0, 1.0, 1.0));
app.set_node_stroke(autoV[0], autoV[1], 0.8, 0.8, 0.8, 1.0, 1.0);
app.set_auto_layout(autoV[0], autoV[1], 1, 8, 12, 12, 12, 12); // vertical, 8px gap
app.set_insert_parent(autoV[0], autoV[1]);
app.add_rectangle("Row-1", 0, 0, 126, 30, 0.95, 0.95, 0.97, 1.0);
app.add_rectangle("Row-2", 0, 0, 126, 30, 0.9, 0.92, 0.97, 1.0);
app.add_rectangle("Row-3", 0, 0, 126, 30, 0.85, 0.88, 0.95, 1.0);
app.add_rectangle("Row-4", 0, 0, 126, 30, 0.8, 0.85, 0.93, 1.0);
app.clear_insert_parent();
app.clear_insert_parent();

// ── Section 5: Groups & Boolean Ops ──────────────────────────────────
const groupFrame = id(app.add_frame("5. Groups & Booleans", 0, 920, 900, 200, 0.96, 0.96, 0.97, 1.0));
app.set_insert_parent(groupFrame[0], groupFrame[1]);
app.add_text("Group-Title", "Groups, Boolean Ops", 20, 10, 18.0, 0.1, 0.1, 0.1, 1.0);
app.add_text("Group-Info", "Select shapes → Cmd+G to group. Double-click to enter group.", 20, 160, 12.0, 0.5, 0.5, 0.5, 1.0);
// Pre-made group
app.add_rectangle("G-Rect1", 20, 50, 60, 80, 0.2, 0.6, 0.9, 1.0);
app.add_rectangle("G-Rect2", 50, 70, 60, 80, 0.9, 0.4, 0.2, 1.0);
// Boolean ops demo shapes (user can select + apply)
app.add_text("Bool-Label", "Select two → Boolean Op:", 180, 55, 14.0, 0.3, 0.3, 0.3, 1.0);
app.add_ellipse("Bool-A", 180, 80, 80, 80, 0.3, 0.3, 0.8, 0.7);
app.add_ellipse("Bool-B", 220, 80, 80, 80, 0.8, 0.3, 0.3, 0.7);
app.clear_insert_parent();

// ── Section 6: Text Styles ───────────────────────────────────────────
const textFrame = id(app.add_frame("6. Text", 0, 1140, 900, 200, 0.96, 0.96, 0.97, 1.0));
app.set_insert_parent(textFrame[0], textFrame[1]);
app.add_text("Text-Title", "Text Rendering", 20, 10, 18.0, 0.1, 0.1, 0.1, 1.0);
app.add_text("Text-H1", "Heading 1", 20, 50, 48.0, 0.1, 0.1, 0.1, 1.0);
app.add_text("Text-H2", "Heading 2", 20, 110, 32.0, 0.3, 0.3, 0.3, 1.0);
app.add_text("Text-Body", "Body text at 16px with a longer paragraph that wraps.", 20, 155, 16.0, 0.4, 0.4, 0.4, 1.0);
app.add_text("Text-Small", "Small caption • 12px", 400, 155, 12.0, 0.6, 0.6, 0.6, 1.0);
const colorText = id(app.add_text("Text-Blue", "Colored text", 400, 60, 36.0, 0.0, 0.44, 0.89, 1.0));
app.clear_insert_parent();

// ── Section 7: Image (generated pixel data) ──────────────────────────
const imgFrame = id(app.add_frame("7. Images", 0, 1360, 900, 220, 0.96, 0.96, 0.97, 1.0));
app.set_insert_parent(imgFrame[0], imgFrame[1]);
app.add_text("Img-Title", "Image Nodes (raw RGBA pixel data)", 20, 10, 18.0, 0.1, 0.1, 0.1, 1.0);
// Generate a 64x64 gradient image in RGBA
const imgW = 64, imgH = 64;
const pixels = new Uint8Array(imgW * imgH * 4);
for (let y = 0; y < imgH; y++) {
    for (let x = 0; x < imgW; x++) {
        const i = (y * imgW + x) * 4;
        pixels[i]     = Math.floor(x / imgW * 255); // R: left-right gradient
        pixels[i + 1] = Math.floor(y / imgH * 255); // G: top-bottom gradient
        pixels[i + 2] = 128;                         // B: constant
        pixels[i + 3] = 255;                         // A: opaque
    }
}
app.add_image("Gradient Image", 20, 50, 150, 150, pixels, imgW, imgH);
// Generate a checkerboard pattern
const chkW = 64, chkH = 64;
const chkPixels = new Uint8Array(chkW * chkH * 4);
for (let y = 0; y < chkH; y++) {
    for (let x = 0; x < chkW; x++) {
        const i = (y * chkW + x) * 4;
        const isWhite = ((Math.floor(x / 8) + Math.floor(y / 8)) % 2) === 0;
        const v = isWhite ? 255 : 50;
        chkPixels[i] = v; chkPixels[i+1] = v; chkPixels[i+2] = v; chkPixels[i+3] = 255;
    }
}
app.add_image("Checkerboard", 200, 50, 150, 150, chkPixels, chkW, chkH);
app.add_text("Img-Note", "Images are raw RGBA pixels passed to WASM. .fig import loads images from ZIP.", 380, 80, 13.0, 0.5, 0.5, 0.5, 1.0);
app.clear_insert_parent();

// ── Section 8: Interactive Features ──────────────────────────────────
const interFrame = id(app.add_frame("8. Interactive", 0, 1600, 900, 180, 0.96, 0.96, 0.97, 1.0));
app.set_insert_parent(interFrame[0], interFrame[1]);
app.add_text("Inter-Title", "Interactive Features", 20, 10, 18.0, 0.1, 0.1, 0.1, 1.0);
app.add_text("Inter-1", "• Click to select, Shift+click for multi-select", 20, 45, 14.0, 0.3, 0.3, 0.3, 1.0);
app.add_text("Inter-2", "• Drag to move, corner handles to resize", 20, 65, 14.0, 0.3, 0.3, 0.3, 1.0);
app.add_text("Inter-3", "• Cmd+Z undo, Cmd+Shift+Z redo", 20, 85, 14.0, 0.3, 0.3, 0.3, 1.0);
app.add_text("Inter-4", "• Cmd+G group, Cmd+Shift+G ungroup", 20, 105, 14.0, 0.3, 0.3, 0.3, 1.0);
app.add_text("Inter-5", "• Cmd+C copy, Cmd+V paste, Cmd+D duplicate", 20, 125, 14.0, 0.3, 0.3, 0.3, 1.0);
app.add_text("Inter-6", "• Scroll to pan, Ctrl+scroll to zoom, Cmd+1 zoom to fit", 20, 145, 14.0, 0.3, 0.3, 0.3, 1.0);
app.clear_insert_parent();

// Default view: stress test page unless skipped
if (!skipStress) {
    app.switch_page(0); // back to stress test
}

// ─── Rendering ───────────────────────────────────────────────────────

let lastSelCounter = -1;
let lastSelClient = -1;
let layersDirty = true;
let panelUpdateTimer = 0;

let useCanvas2d = true; // Vector rendering (Canvas 2D) by default
let showRulers = true; // Show rulers along canvas edges

function render(forceLayerUpdate = false): void {
    const t0 = performance.now();

    if (useCanvas2d) {
        // Vector: GPU-accelerated Canvas 2D drawing from WASM
        // WASM handles DPR internally for crisp Retina rendering
        app.render_canvas2d(ctx, cssW, cssH, dpr);
        // Restore DPR scale for JS overlays (WASM leaves transform in unknown state)
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        // Overlay loaded images on top of WASM render
        drawImageFills();
    } else {
        // Raster: CPU tile-based pixel buffer (fallback, uses backing store size)
        const pixels = app.render(canvas.width, canvas.height);
        const imageData = new ImageData(new Uint8ClampedArray(pixels), canvas.width, canvas.height);
        ctx.putImageData(imageData, 0, 0);
    }

    // Ensure DPR scale for JS overlays
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Draw rulers
    if (showRulers) drawRulers();

    // Overlays
    if (app.pen_is_active()) drawPenOverlay();
    else if (app.is_vector_editing()) drawVectorEditOverlay();

    // Creation preview (click-drag shape placement)
    if (app.is_creating()) {
        const preview = app.get_creation_preview();
        if (preview.length === 4) {
            const cam = app.get_camera();
            const cx = cam[0], cy = cam[1], z = cam[2];
            const sx = (preview[0] + cx) * z * dpr;
            const sy = (preview[1] + cy) * z * dpr;
            const sw = preview[2] * z * dpr;
            const sh = preview[3] * z * dpr;
            ctx.save();
            ctx.strokeStyle = '#4285f4';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.strokeRect(sx, sy, sw, sh);
            ctx.restore();
        }
    }

    // Marquee selection rectangle
    drawMarqueeOverlay();

    const ms = performance.now() - t0;
    const fps = ms > 0 ? Math.round(1000 / ms) : 999;

    const sel = app.get_selected();
    const selCount = sel.length / 2;
    const selCounter = sel.length ? sel[0] : -1;
    const selClient = sel.length ? sel[1] : -1;
    const selText = selCount > 1 ? ` | ${selCount} selected` : selCount === 1 ? ` | Selected: node ${sel[0]}` : '';
    const renderer = useCanvas2d ? 'Vector' : 'Raster';
    const snapText = app.get_snap_grid() > 0 ? ` | Grid:${app.get_snap_grid()}` : '';
    const eg = app.get_entered_group();
    const groupText = eg[0] >= 0 ? ' | Inside Group (Esc to exit)' : '';
    info.textContent = `${app.node_count()} nodes | ${ms.toFixed(1)}ms (~${fps}fps) [${renderer}]${selText}${snapText}${groupText}`;

    // Defer panel updates to avoid blocking render loop.
    // Panels are expensive with large trees (100K+ nodes) — update after render settles.
    const selChanged = selCounter !== lastSelCounter || selClient !== lastSelClient;
    if (selChanged || forceLayerUpdate || layersDirty) {
        lastSelCounter = selCounter;
        lastSelClient = selClient;
        if (panelUpdateTimer) cancelAnimationFrame(panelUpdateTimer);
        panelUpdateTimer = requestAnimationFrame(() => {
            updateLayersPanel();
            updatePropertiesPanel();
            layersDirty = false;
            panelUpdateTimer = 0;
        });
    }
    flushOps();
}

// ─── Marquee selection overlay ───────────────────────────────────────

function drawMarqueeOverlay(): void {
    const rect = app.get_marquee_rect();
    if (rect.length < 4) return;
    const [minWx, minWy, maxWx, maxWy] = rect;
    const cam = app.get_camera();
    const cx = cam[0], cy = cam[1], zoom = cam[2];
    // World → screen
    const sx = (minWx - cx) * zoom;
    const sy = (minWy - cy) * zoom;
    const sw = (maxWx - minWx) * zoom;
    const sh = (maxWy - minWy) * zoom;
    if (sw < 1 && sh < 1) return;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = 'rgba(59, 130, 246, 0.08)';
    ctx.fillRect(sx, sy, sw, sh);
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.strokeRect(sx, sy, sw, sh);
    ctx.restore();
}

// ─── Pen tool overlay ────────────────────────────────────────────────

function drawPenOverlay(): void {
    const json = app.pen_get_state();
    if (!json) return;

    const state = JSON.parse(json) as {
        anchors: Array<{ x: number; y: number; hox: number; hoy: number; hix: number; hiy: number }>;
        cx: number; cy: number;
    };
    const cam = app.get_camera(); // [cam_x, cam_y, zoom]
    const camX = cam[0], camY = cam[1], zoom = cam[2];

    // World to screen conversion
    const toSx = (wx: number) => (wx - camX) * zoom;
    const toSy = (wy: number) => (wy - camY) * zoom;

    ctx.save();
    ctx.strokeStyle = '#4285f4';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#4285f4';

    const anchors = state.anchors;

    // Draw path segments
    if (anchors.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(toSx(anchors[0].x), toSy(anchors[0].y));
        for (let i = 1; i < anchors.length; i++) {
            const prev = anchors[i - 1];
            const curr = anchors[i];
            const hasHandles = (prev.hox !== 0 || prev.hoy !== 0 || curr.hix !== 0 || curr.hiy !== 0);
            if (hasHandles) {
                ctx.bezierCurveTo(
                    toSx(prev.x + prev.hox), toSy(prev.y + prev.hoy),
                    toSx(curr.x + curr.hix), toSy(curr.y + curr.hiy),
                    toSx(curr.x), toSy(curr.y)
                );
            } else {
                ctx.lineTo(toSx(curr.x), toSy(curr.y));
            }
        }
        ctx.stroke();
    }

    // Draw preview line from last anchor to cursor
    if (anchors.length >= 1) {
        const last = anchors[anchors.length - 1];
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.moveTo(toSx(last.x), toSy(last.y));
        ctx.lineTo(toSx(state.cx), toSy(state.cy));
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Draw anchor points
    for (let i = 0; i < anchors.length; i++) {
        const a = anchors[i];
        const sx = toSx(a.x), sy = toSy(a.y);

        // Anchor square
        ctx.fillStyle = i === 0 ? '#ff4444' : '#4285f4';
        ctx.fillRect(sx - 4, sy - 4, 8, 8);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(sx - 4, sy - 4, 8, 8);

        // Handle lines and dots
        ctx.strokeStyle = '#4285f4';
        ctx.lineWidth = 1;
        if (a.hox !== 0 || a.hoy !== 0) {
            const hx = toSx(a.x + a.hox), hy = toSy(a.y + a.hoy);
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(hx, hy);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(hx, hy, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#4285f4';
            ctx.fill();
        }
        if (a.hix !== 0 || a.hiy !== 0) {
            const hx = toSx(a.x + a.hix), hy = toSy(a.y + a.hiy);
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(hx, hy);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(hx, hy, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#4285f4';
            ctx.fill();
        }
    }

    ctx.restore();
}

// ─── Vector edit overlay ─────────────────────────────────────────────

function drawVectorEditOverlay(): void {
    const json = app.vector_edit_get_state();
    if (!json) return;

    const state = JSON.parse(json) as {
        anchors: Array<{ x: number; y: number; hox: number; hoy: number; hix: number; hiy: number }>;
        selected: number;
        closed: boolean;
        tx: number;
        ty: number;
    };
    const cam = app.get_camera();
    const camX = cam[0], camY = cam[1], zoom = cam[2];
    const tx = state.tx, ty = state.ty;

    // Local to screen conversion (anchors are in local space, tx/ty is world offset)
    const toSx = (lx: number) => (lx + tx - camX) * zoom;
    const toSy = (ly: number) => (ly + ty - camY) * zoom;

    ctx.save();
    const anchors = state.anchors;

    // Draw path segments
    if (anchors.length >= 2) {
        ctx.beginPath();
        ctx.strokeStyle = '#4285f4';
        ctx.lineWidth = 2;
        ctx.moveTo(toSx(anchors[0].x), toSy(anchors[0].y));
        for (let i = 1; i < anchors.length; i++) {
            const prev = anchors[i - 1];
            const curr = anchors[i];
            const hasHandles = (prev.hox !== 0 || prev.hoy !== 0 || curr.hix !== 0 || curr.hiy !== 0);
            if (hasHandles) {
                ctx.bezierCurveTo(
                    toSx(prev.x + prev.hox), toSy(prev.y + prev.hoy),
                    toSx(curr.x + curr.hix), toSy(curr.y + curr.hiy),
                    toSx(curr.x), toSy(curr.y)
                );
            } else {
                ctx.lineTo(toSx(curr.x), toSy(curr.y));
            }
        }
        // Close path if closed
        if (state.closed && anchors.length >= 3) {
            const last = anchors[anchors.length - 1];
            const first = anchors[0];
            const hasHandles = (last.hox !== 0 || last.hoy !== 0 || first.hix !== 0 || first.hiy !== 0);
            if (hasHandles) {
                ctx.bezierCurveTo(
                    toSx(last.x + last.hox), toSy(last.y + last.hoy),
                    toSx(first.x + first.hix), toSy(first.y + first.hiy),
                    toSx(first.x), toSy(first.y)
                );
            } else {
                ctx.lineTo(toSx(first.x), toSy(first.y));
            }
        }
        ctx.stroke();
    }

    // Draw handle lines and dots
    for (let i = 0; i < anchors.length; i++) {
        const a = anchors[i];
        const sx = toSx(a.x), sy = toSy(a.y);

        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        if (a.hox !== 0 || a.hoy !== 0) {
            const hx = toSx(a.x + a.hox), hy = toSy(a.y + a.hoy);
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(hx, hy);
            ctx.stroke();
        }
        if (a.hix !== 0 || a.hiy !== 0) {
            const hx = toSx(a.x + a.hix), hy = toSy(a.y + a.hiy);
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(hx, hy);
            ctx.stroke();
        }
        ctx.setLineDash([]);

        // Handle dots (blue circles)
        ctx.fillStyle = '#4285f4';
        if (a.hox !== 0 || a.hoy !== 0) {
            const hx = toSx(a.x + a.hox), hy = toSy(a.y + a.hoy);
            ctx.beginPath();
            ctx.arc(hx, hy, 3.5, 0, Math.PI * 2);
            ctx.fill();
        }
        if (a.hix !== 0 || a.hiy !== 0) {
            const hx = toSx(a.x + a.hix), hy = toSy(a.y + a.hiy);
            ctx.beginPath();
            ctx.arc(hx, hy, 3.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Draw anchor points (on top of handles)
    for (let i = 0; i < anchors.length; i++) {
        const a = anchors[i];
        const sx = toSx(a.x), sy = toSy(a.y);
        const isSelected = i === state.selected;

        ctx.fillStyle = isSelected ? '#ff8800' : '#fff';
        ctx.fillRect(sx - 4, sy - 4, 8, 8);
        ctx.strokeStyle = '#4285f4';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(sx - 4, sy - 4, 8, 8);
    }

    ctx.restore();
}

// ─── Rulers ─────────────────────────────────────────────────────────

const RULER_SIZE = 20;
const RULER_BG = '#2a2a2a';
const RULER_FG = '#888';
const RULER_TICK = '#555';

function drawRulers(): void {
    const cam = app.get_camera();
    const camX = cam[0], camY = cam[1], zoom = cam[2];
    const w = cssW, h = cssH;

    // Choose tick interval based on zoom level
    let step = 100;
    if (zoom > 4) step = 10;
    else if (zoom > 1.5) step = 25;
    else if (zoom > 0.5) step = 50;
    else if (zoom < 0.1) step = 500;
    else if (zoom < 0.25) step = 200;

    ctx.save();

    // Horizontal ruler
    ctx.fillStyle = RULER_BG;
    ctx.fillRect(0, 0, w, RULER_SIZE);
    ctx.fillStyle = RULER_FG;
    ctx.font = '9px monospace';
    ctx.textBaseline = 'top';

    const startX = Math.floor(camX / step) * step;
    for (let wx = startX; wx < camX + w / zoom; wx += step) {
        const sx = (wx - camX) * zoom;
        if (sx < RULER_SIZE || sx > w) continue;
        ctx.fillStyle = RULER_TICK;
        ctx.fillRect(sx, RULER_SIZE - 6, 1, 6);
        ctx.fillStyle = RULER_FG;
        ctx.fillText(String(Math.round(wx)), sx + 2, 3);
    }
    // Sub-ticks
    const subStep = step / 5;
    for (let wx = startX; wx < camX + w / zoom; wx += subStep) {
        const sx = (wx - camX) * zoom;
        if (sx < RULER_SIZE || sx > w) continue;
        ctx.fillStyle = RULER_TICK;
        ctx.fillRect(sx, RULER_SIZE - 3, 1, 3);
    }

    // Vertical ruler
    ctx.fillStyle = RULER_BG;
    ctx.fillRect(0, 0, RULER_SIZE, h);
    ctx.fillStyle = RULER_FG;

    const startY = Math.floor(camY / step) * step;
    for (let wy = startY; wy < camY + h / zoom; wy += step) {
        const sy = (wy - camY) * zoom;
        if (sy < RULER_SIZE || sy > h) continue;
        ctx.fillStyle = RULER_TICK;
        ctx.fillRect(RULER_SIZE - 6, sy, 6, 1);
        ctx.fillStyle = RULER_FG;
        ctx.save();
        ctx.translate(3, sy + 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(String(Math.round(wy)), 0, 0);
        ctx.restore();
    }
    // Vertical sub-ticks
    for (let wy = startY; wy < camY + h / zoom; wy += subStep) {
        const sy = (wy - camY) * zoom;
        if (sy < RULER_SIZE || sy > h) continue;
        ctx.fillStyle = RULER_TICK;
        ctx.fillRect(RULER_SIZE - 3, sy, 3, 1);
    }

    // Corner square
    ctx.fillStyle = RULER_BG;
    ctx.fillRect(0, 0, RULER_SIZE, RULER_SIZE);

    ctx.restore();
}

// ─── Mouse interaction ───────────────────────────────────────────────

let spaceHeld = false;

canvas.addEventListener('mousedown', (e: MouseEvent) => {
    // Middle-click or space+click = pan
    if (e.button === 1 || spaceHeld) {
        app.pan_start(e.offsetX, e.offsetY);
        canvas.style.cursor = 'grabbing';
        e.preventDefault();
        return;
    }

    // Pen tool intercept
    if (app.pen_is_active()) {
        app.pen_mouse_down(e.offsetX, e.offsetY);
        render();
        drawPenOverlay();
        return;
    }

    const hit = app.mouse_down(e.offsetX, e.offsetY, e.shiftKey);
    canvas.style.cursor = hit ? 'move' : 'default';
    render();
    if (app.is_vector_editing()) drawVectorEditOverlay();
});

const coordsEl = document.getElementById('coords')!;
canvas.addEventListener('mousemove', (e: MouseEvent) => {
    // Show world coordinates at cursor position
    const cam = app.get_camera();
    const wx = (e.offsetX / cam[2] + cam[0]).toFixed(0);
    const wy = (e.offsetY / cam[2] + cam[1]).toFixed(0);
    coordsEl.textContent = `X:${wx} Y:${wy}`;

    // Check if panning (any button held during pan)
    if (e.buttons > 0) {
        app.pan_move(e.offsetX, e.offsetY);
    }

    // Pen tool
    if (app.pen_is_active()) {
        if (e.buttons === 1) {
            app.pen_mouse_drag(e.offsetX, e.offsetY);
        } else {
            app.pen_mouse_move(e.offsetX, e.offsetY);
        }
        if (app.needs_render()) {
            render();
            drawPenOverlay();
        }
        return;
    }

    if (e.buttons === 1 && !spaceHeld) {
        app.mouse_move(e.offsetX, e.offsetY);
        if (app.is_creating()) render(); // live preview during shape creation drag
    }
    // Rotation cursor hint when hovering near corners
    if (e.buttons === 0 && !spaceHeld && !app.pen_is_active()) {
        if (app.is_rotation_zone(e.offsetX, e.offsetY)) {
            canvas.style.cursor = 'crosshair';
        } else {
            canvas.style.cursor = 'default';
        }
    }
    if (app.needs_render()) {
        render();
    }
    if (app.is_vector_editing()) drawVectorEditOverlay();
});

canvas.addEventListener('mouseup', (e: MouseEvent) => {
    if (app.pen_is_active()) {
        app.pen_mouse_up();
        render();
        drawPenOverlay();
        return;
    }
    app.pan_end();
    const wasCreating = app.is_creating();
    app.mouse_up();
    canvas.style.cursor = spaceHeld ? 'grab' : 'default';
    render();
    if (wasCreating) {
        requestAnimationFrame(() => { updateLayersPanel(); });
    }
    updatePropertiesPanel();
    if (app.is_vector_editing()) drawVectorEditOverlay();
});

canvas.addEventListener('dblclick', (e: MouseEvent) => {
    if (app.pen_is_active()) {
        app.pen_finish_open();
        render();
        return;
    }
    // Trigger double-click on the selected node (enters group or vector edit)
    app.handle_double_click(e.offsetX, e.offsetY);
    render();
    if (app.is_vector_editing()) drawVectorEditOverlay();
});

// ─── Zoom (scroll wheel) ────────────────────────────────────────────

canvas.addEventListener('wheel', (e: WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
        // Pinch-to-zoom (trackpad) or Ctrl+scroll (mouse)
        const delta = e.deltaY < 0 ? 1.0 : -1.0;
        app.zoom(delta, e.offsetX, e.offsetY);
    } else {
        // Two-finger scroll = pan (Figma convention)
        app.pan_start(e.offsetX, e.offsetY);
        app.pan_move(e.offsetX - e.deltaX, e.offsetY - e.deltaY);
        app.pan_end();
    }
    render();
}, {passive: false});

// ─── Keyboard ────────────────────────────────────────────────────────

window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
        app.delete_selected();
        render();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        app.undo();
        layersDirty = true;
        render();
    }
    if ((e.metaKey || e.ctrlKey) && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        app.redo();
        layersDirty = true;
        render();
    }
    if (e.key === 'Escape') {
        if (app.is_creating()) {
            app.cancel_creating();
            canvas.style.cursor = 'default';
            render();
        } else if (app.pen_is_active()) {
            app.pen_cancel();
            canvas.style.cursor = 'default';
        } else if (app.is_vector_editing()) {
            app.vector_edit_exit();
        } else {
            // Exit entered group (if any) — Escape pops up one level
            app.exit_group();
        }
        render();
    }
    if (e.key === 'Enter' && app.pen_is_active()) {
        app.pen_finish_open();
        canvas.style.cursor = 'default';
        render();
    }
    if (e.key === ' ' || e.code === 'Space') {
        spaceHeld = true;
        canvas.style.cursor = 'grab';
        e.preventDefault();
    }
    // Toggle renderer (Ctrl/Cmd+Shift+V)
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        useCanvas2d = !useCanvas2d;
        render();
    }
    // Toggle rulers (Ctrl/Cmd+Shift+R)
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        showRulers = !showRulers;
        render();
    }
    // Tool shortcuts (only when not typing in an input)
    const tag = (e.target as HTMLElement).tagName;
    if (tag !== 'INPUT' && tag !== 'TEXTAREA' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const toolKey = e.key.toLowerCase();
        if (toolKey === 'r') { app.start_creating('rect'); canvas.style.cursor = 'crosshair'; render(); }
        if (toolKey === 'o') { app.start_creating('ellipse'); canvas.style.cursor = 'crosshair'; render(); }
        if (toolKey === 'f') { app.start_creating('frame'); canvas.style.cursor = 'crosshair'; render(); }
        if (toolKey === 't') { app.start_creating('text'); canvas.style.cursor = 'crosshair'; render(); }
        if (toolKey === 's' && !e.shiftKey) { app.start_creating('star'); canvas.style.cursor = 'crosshair'; render(); }
        if (toolKey === 'p') { app.pen_start(); canvas.style.cursor = 'crosshair'; render(); }
        if (toolKey === 'v') { canvas.style.cursor = 'default'; render(); }
    }
    // Copy/paste/duplicate
    if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
        app.copy_selected();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
        e.preventDefault();
        app.paste();
        layersDirty = true;
        render();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        app.duplicate_selected();
        layersDirty = true;
        render();
    }
    // Boolean operations (Ctrl/Cmd + Shift + U/S/I/E)
    if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
        const boolOp = { 'u': 0, 's': 1, 'i': 2, 'e': 3 }[e.key.toLowerCase()];
        if (boolOp !== undefined) {
            e.preventDefault();
            app.boolean_op(boolOp);
            layersDirty = true;
            render();
        }
    }
    // Group/Ungroup (Ctrl/Cmd + G / Ctrl/Cmd + Shift + G)
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        if (e.shiftKey) {
            app.ungroup_selected();
        } else {
            app.group_selected();
        }
        layersDirty = true;
        render();
    }
    // Zoom to fit (Ctrl/Cmd + 0)
    if ((e.metaKey || e.ctrlKey) && e.key === '0') {
        e.preventDefault();
        app.zoom_to_fit();
        render();
    }
    // Align shortcuts (Alt + A/H/D/W/V/S for left/center-h/right/top/center-v/bottom)
    if (e.altKey && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        const alignOp = { 'a': 0, 'h': 1, 'd': 2, 'w': 3, 'v': 4, 's': 5 }[e.key.toLowerCase()];
        if (alignOp !== undefined) {
            e.preventDefault();
            app.align_selected(alignOp);
            render();
        }
    }
    // Distribute shortcuts (Alt+Shift + H/V for horizontal/vertical)
    if (e.altKey && e.shiftKey && !e.metaKey && !e.ctrlKey) {
        const distOp = { 'h': 0, 'v': 1 }[e.key.toLowerCase()];
        if (distOp !== undefined) {
            e.preventDefault();
            app.distribute_selected(distOp);
            render();
        }
    }
    // Snap-to-grid toggle (Ctrl/Cmd + ')
    if ((e.metaKey || e.ctrlKey) && e.key === "'") {
        e.preventDefault();
        const current = app.get_snap_grid();
        app.set_snap_grid(current > 0 ? 0 : 8);
        render();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === ']') {
        e.preventDefault();
        app.bring_to_front();
        render();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === '[') {
        e.preventDefault();
        app.send_to_back();
        render();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault();
        app.select_all();
        render();
    }
});

window.addEventListener('keyup', (e: KeyboardEvent) => {
    if (e.key === ' ' || e.code === 'Space') {
        spaceHeld = false;
        canvas.style.cursor = 'default';
    }
});

// ─── Context Menu ────────────────────────────────────────────────────

const ctxMenu = document.createElement('div');
ctxMenu.id = 'context-menu';
ctxMenu.style.cssText = 'display:none;position:fixed;z-index:1000;background:#2d2d2d;border:1px solid #444;border-radius:6px;padding:4px 0;min-width:180px;box-shadow:0 4px 12px rgba(0,0,0,0.4);font-size:13px;color:#eee';
document.body.appendChild(ctxMenu);

function showContextMenu(x: number, y: number): void {
    const sel = app.get_selected();
    const hasSel = sel.length > 0;
    const items: Array<{ label: string; action: string; enabled: boolean; separator?: boolean }> = [
        { label: 'Copy', action: 'copy', enabled: hasSel },
        { label: 'Paste', action: 'paste', enabled: true },
        { label: 'Duplicate', action: 'duplicate', enabled: hasSel },
        { label: 'Delete', action: 'delete', enabled: hasSel },
        { label: '', action: '', enabled: false, separator: true },
        { label: 'Group Selection', action: 'group', enabled: sel.length > 2 },
        { label: 'Ungroup', action: 'ungroup', enabled: hasSel },
        { label: '', action: '', enabled: false, separator: true },
        { label: 'Bring to Front', action: 'front', enabled: hasSel },
        { label: 'Send to Back', action: 'back', enabled: hasSel },
        { label: '', action: '', enabled: false, separator: true },
        { label: 'Select All', action: 'selectall', enabled: true },
        { label: 'Zoom to Fit', action: 'zoomfit', enabled: true },
    ];

    let html = '';
    for (const item of items) {
        if (item.separator) {
            html += '<div style="height:1px;background:#444;margin:4px 0"></div>';
        } else {
            html += `<div class="ctx-item" data-ctx="${item.action}" style="padding:6px 16px;cursor:${item.enabled ? 'pointer' : 'default'};opacity:${item.enabled ? 1 : 0.4}">${item.label}</div>`;
        }
    }
    ctxMenu.innerHTML = html;
    ctxMenu.style.display = 'block';
    ctxMenu.style.left = `${x}px`;
    ctxMenu.style.top = `${y}px`;

    // Hover effect
    ctxMenu.querySelectorAll('.ctx-item').forEach(el => {
        (el as HTMLElement).addEventListener('mouseenter', () => {
            if ((el as HTMLElement).style.opacity !== '0.4') (el as HTMLElement).style.background = '#3a3a3a';
        });
        (el as HTMLElement).addEventListener('mouseleave', () => {
            (el as HTMLElement).style.background = 'transparent';
        });
    });
}

function hideContextMenu(): void {
    ctxMenu.style.display = 'none';
}

ctxMenu.addEventListener('click', (e: Event) => {
    const target = (e.target as HTMLElement).closest('.ctx-item') as HTMLElement | null;
    if (!target || target.style.opacity === '0.4') return;
    const action = target.dataset['ctx'];
    hideContextMenu();
    switch (action) {
        case 'copy': app.copy_selected(); break;
        case 'paste': app.paste(); layersDirty = true; break;
        case 'duplicate': app.duplicate_selected(); layersDirty = true; break;
        case 'delete': app.delete_selected(); layersDirty = true; break;
        case 'group': app.group_selected(); layersDirty = true; break;
        case 'ungroup': app.ungroup_selected(); layersDirty = true; break;
        case 'front': app.bring_to_front(); layersDirty = true; break;
        case 'back': app.send_to_back(); layersDirty = true; break;
        case 'selectall': app.select_all(); layersDirty = true; break;
        case 'zoomfit': app.zoom_to_fit(); break;
    }
    render();
});

canvas.addEventListener('contextmenu', (e: MouseEvent) => {
    e.preventDefault();
    // Try to select what's under the cursor first
    const hit = app.mouse_down(e.offsetX, e.offsetY, false);
    app.mouse_up();
    showContextMenu(e.clientX, e.clientY);
});

// Dismiss context menu on any left click
document.addEventListener('mousedown', (e: MouseEvent) => {
    if (e.button === 0 && ctxMenu.style.display !== 'none' && !ctxMenu.contains(e.target as Node)) {
        hideContextMenu();
    }
});

// ─── Toolbar ─────────────────────────────────────────────────────────

document.getElementById('toolbar')!.addEventListener('click', (e: Event) => {
    const target = e.target as HTMLElement;
    const action = target.dataset['action'];
    if (!action) return;

    switch (action) {
        case 'add-rect':
            app.start_creating('rect');
            canvas.style.cursor = 'crosshair';
            render();
            return;
        case 'add-ellipse':
            app.start_creating('ellipse');
            canvas.style.cursor = 'crosshair';
            render();
            return;
        case 'add-text':
            app.start_creating('text');
            canvas.style.cursor = 'crosshair';
            render();
            return;
        case 'add-star':
            app.start_creating('star');
            canvas.style.cursor = 'crosshair';
            render();
            return;
        case 'add-polygon':
            app.start_creating('rect'); // polygon uses star with inner_ratio=1.0, but start_creating doesn't support it yet — fallback to rect
            canvas.style.cursor = 'crosshair';
            render();
            return;
        case 'add-frame':
            app.start_creating('frame');
            canvas.style.cursor = 'crosshair';
            render();
            return;
        case 'pen':
            app.pen_start();
            canvas.style.cursor = 'crosshair';
            render();
            return; // don't render twice
        case 'delete':
            app.delete_selected();
            layersDirty = true;
            break;
        case 'export-png': {
            const w = canvas.width;
            const h = canvas.height;
            const rgba = app.export_pixels(w, h);
            const offscreen = document.createElement('canvas');
            offscreen.width = w;
            offscreen.height = h;
            const octx = offscreen.getContext('2d')!;
            const imgData = new ImageData(new Uint8ClampedArray(rgba), w, h);
            octx.putImageData(imgData, 0, 0);
            const link = document.createElement('a');
            link.download = 'figma-export.png';
            link.href = offscreen.toDataURL('image/png');
            link.click();
            return; // don't re-render
        }
        case 'add-image': {
            (document.getElementById('image-file-input') as HTMLInputElement).click();
            return;
        }
        case 'export-svg': {
            const svgStr = app.export_svg(canvas.width, canvas.height);
            const blob = new Blob([svgStr], { type: 'image/svg+xml' });
            const link = document.createElement('a');
            link.download = 'figma-export.svg';
            link.href = URL.createObjectURL(blob);
            link.click();
            URL.revokeObjectURL(link.href);
            return;
        }
        case 'import-fig': {
            (document.getElementById('fig-file-input') as HTMLInputElement).click();
            return;
        }
    }
    render();
});

// ─── Image import (file input + drag & drop) ────────────────────────

function loadImageToCanvas(file: File, x: number, y: number) {
    const reader = new FileReader();
    reader.onload = () => {
        const img = new Image();
        img.onload = () => {
            // Draw image to temp canvas to get RGBA pixels
            const tmp = document.createElement('canvas');
            tmp.width = img.width;
            tmp.height = img.height;
            const tctx = tmp.getContext('2d')!;
            tctx.drawImage(img, 0, 0);
            const imgData = tctx.getImageData(0, 0, img.width, img.height);
            const rgba = new Uint8Array(imgData.data.buffer);

            // Scale to reasonable size if too large
            let w = img.width;
            let h = img.height;
            if (w > 800) { const s = 800 / w; w = 800; h = Math.round(h * s); }

            app.add_image(file.name.replace(/\.[^.]+$/, ''), x, y, w, h, rgba, img.width, img.height);
            layersDirty = true;
            render();
        };
        img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
}

(document.getElementById('image-file-input') as HTMLInputElement).addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
        loadImageToCanvas(file, 100 + Math.random() * 200, 100 + Math.random() * 200);
        (e.target as HTMLInputElement).value = '';
    }
});

function importFigFile(file: File): void {
    info.textContent = `Importing ${file.name}...`;
    const reader = new FileReader();
    reader.onload = () => {
        const bytes = new Uint8Array(reader.result as ArrayBuffer);
        const t0 = performance.now();
        const resultJson = app.import_fig_binary(bytes);
        const ms = (performance.now() - t0).toFixed(0);
        console.log(`[fig-import] ${file.name}: ${ms}ms`, resultJson);
        const result = JSON.parse(resultJson);

        // Load images from WASM memory into imageCache as Blob URLs
        let imgLoaded = 0;
        let imgTotal = result.images?.length || 0;
        for (const imgPath of (result.images || [])) {
            const imgBytes: Uint8Array = app.get_imported_image(imgPath);
            if (imgBytes && imgBytes.length > 0) {
                // Detect MIME type from magic bytes
                const mime = (imgBytes[0] === 0x89 && imgBytes[1] === 0x50) ? 'image/png' : 'image/jpeg';
                const blob = new Blob([imgBytes], { type: mime });
                const url = URL.createObjectURL(blob);
                const img = new Image();
                img.onload = () => {
                    imageCache.set(imgPath, img);
                    // Store under multiple keys so renderer can find images regardless of extension
                    // ZIP has "images/hash.jpg" but fig_import.rs may reference "images/hash.png"
                    const stem = imgPath.replace(/\.(png|jpg)$/, '');
                    if (stem !== imgPath) {
                        imageCache.set(stem, img);
                        imageCache.set(stem + '.png', img);
                        imageCache.set(stem + '.jpg', img);
                    } else if (!imgPath.includes('.')) {
                        imageCache.set(imgPath + '.png', img);
                        imageCache.set(imgPath + '.jpg', img);
                    }
                    imgLoaded++;
                    if (imgLoaded === imgTotal) {
                        console.log(`[fig-import] All ${imgTotal} images loaded`);
                        render(true);
                    }
                };
                img.src = url;
            }
        }

        info.textContent = `Imported ${result.nodes} nodes, ${imgTotal} images in ${ms}ms`;
        updatePageTabs();
        layersDirty = true;
        render(true);
    };
    reader.readAsArrayBuffer(file);
}

(document.getElementById('fig-file-input') as HTMLInputElement).addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    (e.target as HTMLInputElement).value = '';

    if (file.name.endsWith('.json')) {
        info.textContent = `Importing ${file.name}...`;
        const reader = new FileReader();
        reader.onload = () => {
            const jsonStr = reader.result as string;
            const t0 = performance.now();
            const result = app.import_fig_json(jsonStr, '');
            const ms = (performance.now() - t0).toFixed(0);
            console.log(`[import] ${file.name}: ${ms}ms`, result);
            updatePageTabs();
            layersDirty = true;
            render(true);
        };
        reader.readAsText(file);
    } else if (file.name.endsWith('.fig')) {
        importFigFile(file);
    }
});

// Drag & drop images onto canvas
canvas.addEventListener('dragover', (e) => { e.preventDefault(); });
canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    canvas.classList.remove('drop-active');
    const file = e.dataTransfer?.files[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
        const rect = canvas.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const cam = app.get_camera();
        const wx = (sx - cam[0]) / cam[2];
        const wy = (sy - cam[1]) / cam[2];
        loadImageToCanvas(file, wx, wy);
    } else if (file.name.endsWith('.json')) {
        // Import fig2json canvas.json directly
        const reader = new FileReader();
        reader.onload = () => {
            const jsonStr = reader.result as string;
            const t0 = performance.now();
            const result = app.import_fig_json(jsonStr, '');
            const ms = (performance.now() - t0).toFixed(0);
            console.log(`[import] Dropped JSON: ${ms}ms`, result);
            updatePageTabs();
            layersDirty = true;
            render(true);
        };
        reader.readAsText(file);
    } else if (file.name.endsWith('.fig')) {
        importFigFile(file);
    }
});
canvas.addEventListener('dragenter', (e) => { e.preventDefault(); canvas.classList.add('drop-active'); });
canvas.addEventListener('dragleave', () => { canvas.classList.remove('drop-active'); });

// ─── Image fill overlay (for .fig imports) ──────────────────────────

// Cache loaded images by path to avoid re-fetching
const imageCache = new Map<string, HTMLImageElement>();
(window as any)._imageCache = imageCache;
const imageLoadingSet = new Set<string>(); // currently loading

function drawImageFills(): void {
    const fillsJson = app.get_visible_image_fills(cssW, cssH);
    let fills: [string, number, number, number, number, number, number|null, number|null, number|null, number|null, string?][];
    try { fills = JSON.parse(fillsJson); } catch { return; }
    if (fills.length === 0) return;

    for (const [path, sx, sy, sw, sh, opacity, clipX, clipY, clipW, clipH, scaleMode] of fills) {
        const img = imageCache.get(path);
        if (img) {
            ctx.save();
            ctx.globalAlpha = opacity;
            if (clipX != null && clipY != null && clipW != null && clipH != null) {
                ctx.beginPath();
                ctx.rect(clipX, clipY, clipW, clipH);
                ctx.clip();
            }
            const mode = scaleMode || 'fill';
            if (mode === 'stretch') {
                // Stretch: ignore aspect ratio, fill dest exactly
                ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, sx, sy, sw, sh);
            } else if (mode === 'fit') {
                // Fit: contain image within dest, preserving aspect ratio
                const imgAspect = img.naturalWidth / img.naturalHeight;
                const destAspect = sw / sh;
                let dw: number, dh: number, dx: number, dy: number;
                if (imgAspect > destAspect) {
                    dw = sw; dh = sw / imgAspect;
                    dx = sx; dy = sy + (sh - dh) / 2;
                } else {
                    dh = sh; dw = sh * imgAspect;
                    dx = sx + (sw - dw) / 2; dy = sy;
                }
                ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, dx, dy, dw, dh);
            } else if (mode === 'tile') {
                // Tile: repeat image at natural size
                const pat = ctx.createPattern(img, 'repeat');
                if (pat) {
                    ctx.fillStyle = pat;
                    ctx.fillRect(sx, sy, sw, sh);
                }
            } else {
                // Fill (default): cover dest, crop excess, maintain aspect ratio
                const imgAspect = img.naturalWidth / img.naturalHeight;
                const destAspect = sw / sh;
                let srcX = 0, srcY = 0, srcW = img.naturalWidth, srcH = img.naturalHeight;
                if (imgAspect > destAspect) {
                    srcW = img.naturalHeight * destAspect;
                    srcX = (img.naturalWidth - srcW) / 2;
                } else {
                    srcH = img.naturalWidth / destAspect;
                    srcY = (img.naturalHeight - srcH) / 2;
                }
                ctx.drawImage(img, srcX, srcY, srcW, srcH, sx, sy, sw, sh);
            }
            ctx.restore();
        } else if (!imageLoadingSet.has(path) && !path.startsWith('user-image-')) {
            // Load from /imports/ for file-based paths (not user-uploaded images)
            imageLoadingSet.add(path);
            const newImg = new Image();
            newImg.crossOrigin = 'anonymous';
            newImg.onload = () => {
                imageCache.set(path, newImg);
                imageLoadingSet.delete(path);
                render(); // re-render once loaded
            };
            newImg.onerror = () => {
                imageLoadingSet.delete(path);
            };
            newImg.src = `/imports/${path}`;
        }
    }
}

// ─── .fig JSON import ────────────────────────────────────────────────

async function importFigJson(url: string) {
    console.log(`[import] Fetching ${url}...`);
    // Extract base path for images: /imports/Foo-extracted/canvas.json → Foo-extracted
    const imageBase = url.split('/').slice(0, -1).join('/').replace(/^\/imports\//, '');
    console.log(`[import] Image base path: ${imageBase}`);

    const resp = await fetch(url);
    if (!resp.ok) { console.error(`[import] Fetch failed: ${resp.status}`); return; }
    const jsonStr = await resp.text();
    const sizeMB = jsonStr.length / 1024 / 1024;
    console.log(`[import] Got ${sizeMB.toFixed(1)}MB JSON`);

    const t0 = performance.now();

    if (sizeMB > 200) {
        // Large file: parse in JS, import page-by-page to avoid WASM OOM
        console.log(`[import] Large file — importing page-by-page...`);
        const doc = JSON.parse(jsonStr);
        const pages = doc?.document?.children || [];
        let totalNodes = 0;
        for (let i = 0; i < pages.length; i++) {
            const pageJson = JSON.stringify(pages[i]);
            const result = JSON.parse(app.import_fig_page_json(pageJson, imageBase));
            totalNodes += result.nodes;
            if (i % 10 === 0) console.log(`[import] Page ${i+1}/${pages.length}: +${result.nodes} nodes`);
        }
        const ms = (performance.now() - t0).toFixed(0);
        console.log(`[import] Done in ${ms}ms: ${pages.length} pages, ${totalNodes} nodes`);
    } else {
        // Small/medium file: pass entire JSON to WASM
        const result = app.import_fig_json(jsonStr, imageBase);
        const ms = (performance.now() - t0).toFixed(0);
        console.log(`[import] Done in ${ms}ms:`, result);
    }

    updatePageTabs();
    layersDirty = true;
    render();
}

// Expose for console use: importFigJson('/imports/Coffee Shop-extracted/canvas.json')
(window as any).importFigJson = importFigJson;
(window as any).importFigFile = importFigFile;
(window as any).setCamera = (x: number, y: number, zoom: number) => {
    app.set_camera(x, y, zoom);
    render();
};

// ─── Virtualized layers panel ────────────────────────────────────────

const LAYER_ROW_HEIGHT = 28; // px per row
const LAYER_OVERSCAN = 10;   // extra rows above/below viewport
const LAYER_INDENT = 16;     // px indent per depth level

// Node type icons (compact)
const KIND_ICONS = ['▣', '■', '●', 'T', '✎', '🖼', '⊕', '◇']; // frame, rect, ellipse, text, vector, image, boolean, other

// Create virtual scroll structure: spacer + visible container
const layersSpacer = document.createElement('div');
layersSpacer.style.position = 'relative';
layersSpacer.style.width = '100%';
layersList.appendChild(layersSpacer);

const layersViewport = document.createElement('div');
layersViewport.style.position = 'absolute';
layersViewport.style.left = '0';
layersViewport.style.right = '0';
layersSpacer.appendChild(layersViewport);

let lastLayerScrollTop = -1;
let lastLayerCount = -1;

// Expanded nodes in the tree (counter:client keys)
const expandedNodes = new Set<string>();

function getExpandedString(): string {
    return Array.from(expandedNodes).join(',');
}

function updateLayersPanel(): void {
    // Get total visible rows (respecting expanded state)
    const data = app.get_tree_layers(getExpandedString(), 0, 1) as Uint32Array;
    const total = data[0];
    lastLayerCount = total;
    layersSpacer.style.height = `${total * LAYER_ROW_HEIGHT}px`;
    renderVisibleLayers();
}

function renderVisibleLayers(): void {
    const total = lastLayerCount;
    if (total <= 0) {
        layersViewport.innerHTML = '';
        return;
    }

    const scrollTop = layersList.scrollTop;
    const viewHeight = layersList.clientHeight;

    const firstVisible = Math.floor(scrollTop / LAYER_ROW_HEIGHT);
    const visibleCount = Math.ceil(viewHeight / LAYER_ROW_HEIGHT);

    const start = Math.max(0, firstVisible - LAYER_OVERSCAN);
    const count = Math.min(total - start, visibleCount + LAYER_OVERSCAN * 2);

    if (count <= 0) {
        layersViewport.innerHTML = '';
        return;
    }

    const sel = app.get_selected();
    const selectedSet = new Set<string>();
    for (let s = 0; s < sel.length; s += 2) {
        selectedSet.add(`${sel[s]}:${sel[s + 1]}`);
    }

    // get_tree_layers returns: [total, counter, client, packed, counter, client, packed, ...]
    const data = app.get_tree_layers(getExpandedString(), start, count) as Uint32Array;
    const rowCount = (data.length - 1) / 3;

    let html = '';
    for (let i = 0; i < rowCount; i++) {
        const counter = data[1 + i * 3];
        const client = data[1 + i * 3 + 1];
        const packed = data[1 + i * 3 + 2];
        const depth = (packed >> 16) & 0xFFFF;
        const hasChildren = ((packed >> 8) & 0xFF) !== 0;
        const kind = packed & 0xFF;

        const key = `${counter}:${client}`;
        const isSelected = selectedSet.has(key);
        const isExpanded = expandedNodes.has(key);
        const top = (start + i) * LAYER_ROW_HEIGHT;
        const indent = depth * LAYER_INDENT + 4;
        const icon = KIND_ICONS[kind] || '◇';
        const arrow = hasChildren ? (isExpanded ? '▾' : '▸') : '  ';
        const name = app.get_node_name(counter, client);

        html += `<div class="layer-item${isSelected ? ' selected' : ''}" data-counter="${counter}" data-client="${client}" data-has-children="${hasChildren ? 1 : 0}" style="position:absolute;top:${top}px;left:0;right:0;height:${LAYER_ROW_HEIGHT}px;line-height:${LAYER_ROW_HEIGHT}px;padding-left:${indent}px"><span class="layer-arrow" style="cursor:pointer;width:14px;display:inline-block;opacity:${hasChildren ? 1 : 0.3}">${arrow}</span><span class="layer-icon" style="margin-right:4px;opacity:0.6">${icon}</span>${name}</div>`;
    }
    layersViewport.innerHTML = html;
    lastLayerScrollTop = scrollTop;
}

layersList.addEventListener('scroll', () => {
    const delta = Math.abs(layersList.scrollTop - lastLayerScrollTop);
    if (delta >= LAYER_ROW_HEIGHT) {
        renderVisibleLayers();
    }
});

layersList.addEventListener('click', (e: Event) => {
    const me = e as MouseEvent;
    const clickedEl = me.target as HTMLElement;
    const target = clickedEl.closest('.layer-item') as HTMLElement | null;
    if (!target) return;
    const counter = parseInt(target.dataset['counter']!);
    const client = parseInt(target.dataset['client']!);
    const key = `${counter}:${client}`;

    // Click on arrow → toggle expand/collapse
    if (clickedEl.classList.contains('layer-arrow') && target.dataset['hasChildren'] === '1') {
        if (expandedNodes.has(key)) {
            expandedNodes.delete(key);
        } else {
            expandedNodes.add(key);
        }
        updateLayersPanel();
        return;
    }

    // Click on row → select and pan to node
    if (me.shiftKey) {
        app.toggle_select_node(counter, client);
    } else {
        app.select_node(counter, client);
        // Pan viewport to center on the selected node (keep current zoom)
        const wb = app.get_node_world_bounds(counter, client);
        const cam = app.get_camera();
        const zoom = cam[2];
        const viewW = canvas.width / (window.devicePixelRatio || 1);
        const viewH = canvas.height / (window.devicePixelRatio || 1);
        // Center of the node in world coords
        const nodeCx = wb[0] + wb[2] / 2;
        const nodeCy = wb[1] + wb[3] / 2;
        // Camera position so node center is at viewport center
        const newCamX = nodeCx - (viewW / 2) / zoom;
        const newCamY = nodeCy - (viewH / 2) / zoom;
        app.set_camera(newCamX, newCamY, zoom);
    }
    render();
});

// ─── Page tabs ──────────────────────────────────────────────────────

function updatePageTabs(): void {
    const pages = JSON.parse(app.get_pages()) as Array<{ index: number; name: string }>;
    const current = app.current_page_index();
    let html = '';
    for (const p of pages) {
        html += `<div class="page-tab${p.index === current ? ' active' : ''}" data-page="${p.index}">${p.name}</div>`;
    }
    html += `<div class="page-tab-add" data-action="add-page">+</div>`;
    pageTabs.innerHTML = html;
}

pageTabs.addEventListener('click', (e: Event) => {
    const target = e.target as HTMLElement;
    if (target.dataset['action'] === 'add-page') {
        const idx = app.add_page(`Page ${app.page_count() + 1}`);
        app.switch_page(idx);
        layersDirty = true;
        updatePageTabs();
        render(true);
        return;
    }
    const pageIdx = target.dataset['page'];
    if (pageIdx !== undefined) {
        app.switch_page(parseInt(pageIdx));
        layersDirty = true;
        updatePageTabs();
        render(true);
    }
});

updatePageTabs();

// ─── Color Picker (color_picker UI) ──────────────────────────────────

// HSV ↔ RGB conversion helpers
function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r1 = 0, g1 = 0, b1 = 0;
    if (h < 60) { r1 = c; g1 = x; }
    else if (h < 120) { r1 = x; g1 = c; }
    else if (h < 180) { g1 = c; b1 = x; }
    else if (h < 240) { g1 = x; b1 = c; }
    else if (h < 300) { r1 = x; b1 = c; }
    else { r1 = c; b1 = x; }
    return [r1 + m, g1 + m, b1 + m];
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const d = max - min;
    const v = max;
    const s = max === 0 ? 0 : d / max;
    let h = 0;
    if (d !== 0) {
        if (max === r) h = 60 * (((g - b) / d) % 6);
        else if (max === g) h = 60 * ((b - r) / d + 2);
        else h = 60 * ((r - g) / d + 4);
        if (h < 0) h += 360;
    }
    return [h, s, v];
}

function rgbToHex(r: number, g: number, b: number): string {
    const h = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
    return `#${h(r)}${h(g)}${h(b)}`;
}

function hexToRgb(hex: string): [number, number, number] {
    const m = hex.replace('#', '');
    return [parseInt(m.slice(0, 2), 16) / 255, parseInt(m.slice(2, 4), 16) / 255, parseInt(m.slice(4, 6), 16) / 255];
}

let activeColorPicker: HTMLElement | null = null;

function closeColorPicker(): void {
    if (activeColorPicker) {
        activeColorPicker.remove();
        activeColorPicker = null;
    }
}

function openColorPicker(
    anchorEl: HTMLElement,
    initialR: number, initialG: number, initialB: number, initialA: number,
    onChange: (r: number, g: number, b: number, a: number) => void
): void {
    closeColorPicker();

    let [h, s, v] = rgbToHsv(initialR, initialG, initialB);
    let alpha = initialA;

    const popup = document.createElement('div');
    popup.className = 'color-picker-popup';
    popup.style.cssText = 'position:fixed;z-index:9999;background:#2a2a2a;border:1px solid #555;border-radius:8px;padding:12px;box-shadow:0 8px 32px rgba(0,0,0,0.5);width:220px;display:flex;flex-direction:column;gap:8px';

    // Position near anchor
    const rect = anchorEl.getBoundingClientRect();
    popup.style.left = `${rect.left}px`;
    popup.style.top = `${rect.bottom + 4}px`;

    // SV gradient canvas (200x140)
    const svCanvas = document.createElement('canvas');
    svCanvas.width = 200; svCanvas.height = 140;
    svCanvas.style.cssText = 'width:200px;height:140px;border-radius:4px;cursor:crosshair';

    // Hue slider canvas
    const hueCanvas = document.createElement('canvas');
    hueCanvas.width = 200; hueCanvas.height = 14;
    hueCanvas.style.cssText = 'width:200px;height:14px;border-radius:7px;cursor:pointer';

    // Alpha slider canvas
    const alphaCanvas = document.createElement('canvas');
    alphaCanvas.width = 200; alphaCanvas.height = 14;
    alphaCanvas.style.cssText = 'width:200px;height:14px;border-radius:7px;cursor:pointer';

    // Hex input row
    const inputRow = document.createElement('div');
    inputRow.style.cssText = 'display:flex;gap:6px;align-items:center';
    const hexInput = document.createElement('input');
    hexInput.style.cssText = 'flex:1;background:#333;color:#ddd;border:1px solid #555;padding:3px 6px;border-radius:3px;font-size:12px;font-family:monospace';
    const alphaInput = document.createElement('input');
    alphaInput.type = 'number'; alphaInput.min = '0'; alphaInput.max = '100'; alphaInput.step = '1';
    alphaInput.style.cssText = 'width:48px;background:#333;color:#ddd;border:1px solid #555;padding:3px 4px;border-radius:3px;font-size:12px';
    const pctLabel = document.createElement('span');
    pctLabel.textContent = '%';
    pctLabel.style.cssText = 'font-size:11px;color:#888';
    inputRow.appendChild(hexInput);
    inputRow.appendChild(alphaInput);
    inputRow.appendChild(pctLabel);

    popup.appendChild(svCanvas);
    popup.appendChild(hueCanvas);
    popup.appendChild(alphaCanvas);
    popup.appendChild(inputRow);
    document.body.appendChild(popup);
    activeColorPicker = popup;

    // Keep popup on screen
    const popupRect = popup.getBoundingClientRect();
    if (popupRect.right > window.innerWidth) popup.style.left = `${window.innerWidth - popupRect.width - 8}px`;
    if (popupRect.bottom > window.innerHeight) popup.style.top = `${rect.top - popupRect.height - 4}px`;

    function drawSV(): void {
        const ctx = svCanvas.getContext('2d')!;
        // Base hue color
        const [hr, hg, hb] = hsvToRgb(h, 1, 1);
        // White → hue (left to right = saturation)
        const gradH = ctx.createLinearGradient(0, 0, 200, 0);
        gradH.addColorStop(0, '#ffffff');
        gradH.addColorStop(1, rgbToHex(hr, hg, hb));
        ctx.fillStyle = gradH;
        ctx.fillRect(0, 0, 200, 140);
        // Black overlay (top to bottom = value)
        const gradV = ctx.createLinearGradient(0, 0, 0, 140);
        gradV.addColorStop(0, 'rgba(0,0,0,0)');
        gradV.addColorStop(1, 'rgba(0,0,0,1)');
        ctx.fillStyle = gradV;
        ctx.fillRect(0, 0, 200, 140);
        // Indicator circle
        const ix = s * 200, iy = (1 - v) * 140;
        ctx.beginPath();
        ctx.arc(ix, iy, 6, 0, Math.PI * 2);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(ix, iy, 5, 0, Math.PI * 2);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    function drawHue(): void {
        const ctx = hueCanvas.getContext('2d')!;
        const grad = ctx.createLinearGradient(0, 0, 200, 0);
        for (let i = 0; i <= 6; i++) {
            const [r, g, b] = hsvToRgb(i * 60, 1, 1);
            grad.addColorStop(i / 6, rgbToHex(r, g, b));
        }
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(0, 0, 200, 14, 7);
        ctx.fill();
        // Indicator
        const hx = (h / 360) * 200;
        ctx.beginPath();
        ctx.arc(Math.max(7, Math.min(193, hx)), 7, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    function drawAlpha(): void {
        const ctx = alphaCanvas.getContext('2d')!;
        // Checkerboard background
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, 200, 14);
        ctx.fillStyle = '#ccc';
        for (let x = 0; x < 200; x += 7) {
            for (let y = 0; y < 14; y += 7) {
                if ((Math.floor(x / 7) + Math.floor(y / 7)) % 2 === 0) {
                    ctx.fillRect(x, y, 7, 7);
                }
            }
        }
        const [r, g, b] = hsvToRgb(h, s, v);
        const grad = ctx.createLinearGradient(0, 0, 200, 0);
        grad.addColorStop(0, `rgba(${Math.round(r*255)},${Math.round(g*255)},${Math.round(b*255)},0)`);
        grad.addColorStop(1, `rgba(${Math.round(r*255)},${Math.round(g*255)},${Math.round(b*255)},1)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(0, 0, 200, 14, 7);
        ctx.fill();
        // Indicator
        const ax = alpha * 200;
        ctx.beginPath();
        ctx.arc(Math.max(7, Math.min(193, ax)), 7, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    function updateInputs(): void {
        const [r, g, b] = hsvToRgb(h, s, v);
        hexInput.value = rgbToHex(r, g, b).toUpperCase();
        alphaInput.value = String(Math.round(alpha * 100));
    }

    function emitChange(): void {
        const [r, g, b] = hsvToRgb(h, s, v);
        onChange(r, g, b, alpha);
    }

    function redraw(): void { drawSV(); drawHue(); drawAlpha(); updateInputs(); }

    // SV drag
    function handleSV(e: MouseEvent): void {
        const r = svCanvas.getBoundingClientRect();
        s = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
        v = Math.max(0, Math.min(1, 1 - (e.clientY - r.top) / r.height));
        redraw(); emitChange();
    }
    svCanvas.addEventListener('mousedown', (e) => {
        handleSV(e);
        const move = (e2: MouseEvent) => handleSV(e2);
        const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
    });

    // Hue drag
    function handleHue(e: MouseEvent): void {
        const r = hueCanvas.getBoundingClientRect();
        h = Math.max(0, Math.min(360, ((e.clientX - r.left) / r.width) * 360));
        redraw(); emitChange();
    }
    hueCanvas.addEventListener('mousedown', (e) => {
        handleHue(e);
        const move = (e2: MouseEvent) => handleHue(e2);
        const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
    });

    // Alpha drag
    function handleAlpha(e: MouseEvent): void {
        const r = alphaCanvas.getBoundingClientRect();
        alpha = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
        redraw(); emitChange();
    }
    alphaCanvas.addEventListener('mousedown', (e) => {
        handleAlpha(e);
        const move = (e2: MouseEvent) => handleAlpha(e2);
        const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
    });

    // Hex input
    hexInput.addEventListener('change', () => {
        const val = hexInput.value.replace('#', '');
        if (/^[0-9a-fA-F]{6}$/.test(val)) {
            const [r, g, b] = hexToRgb(val);
            [h, s, v] = rgbToHsv(r, g, b);
            redraw(); emitChange();
        }
    });

    // Alpha input
    alphaInput.addEventListener('change', () => {
        alpha = Math.max(0, Math.min(1, parseInt(alphaInput.value) / 100));
        redraw(); emitChange();
    });

    // Close on click outside
    setTimeout(() => {
        const closer = (e: MouseEvent) => {
            if (!popup.contains(e.target as Node) && !anchorEl.contains(e.target as Node)) {
                closeColorPicker();
                document.removeEventListener('mousedown', closer);
            }
        };
        document.addEventListener('mousedown', closer);
    }, 0);

    redraw();
}

// ─── Properties panel ────────────────────────────────────────────────

function updatePropertiesPanel(): void {
    const sel = app.get_selected();
    if (sel.length === 0) {
        propertiesContent.innerHTML = '<div class="prop-group"><span class="prop-label">No selection</span></div>';
        return;
    }

    const counter = sel[0];
    const clientId = sel[1];
    const json = app.get_node_info(counter, clientId);
    if (!json) {
        propertiesContent.innerHTML = '<div class="prop-group"><span class="prop-label">Node not found</span></div>';
        return;
    }

    const nodeInfo = JSON.parse(json) as {
        name: string;
        x: number;
        y: number;
        width: number;
        height: number;
        fill: string;
        type: string;
        text: string;
        fontSize: number;
        fontFamily?: string;
        fontWeight?: number;
        opacity: number;
        blendMode: string;
        stroke: string;
        strokeWeight: number;
        constraintH: string;
        constraintV: string;
        autoLayout?: { direction: string; spacing: number; padTop: number; padRight: number; padBottom: number; padLeft: number };
    };

    // Parse rgba fill to hex for color input
    const toHex = (n: string) => parseInt(n).toString(16).padStart(2, '0');
    let fillHex = '#888888';
    const rgbaMatch = nodeInfo.fill.match(/rgba?\((\d+),(\d+),(\d+)/);
    if (rgbaMatch) {
        fillHex = `#${toHex(rgbaMatch[1])}${toHex(rgbaMatch[2])}${toHex(rgbaMatch[3])}`;
    }
    let strokeHex = '#000000';
    const strokeMatch = nodeInfo.stroke.match(/rgba?\((\d+),(\d+),(\d+)/);
    if (strokeMatch) {
        strokeHex = `#${toHex(strokeMatch[1])}${toHex(strokeMatch[2])}${toHex(strokeMatch[3])}`;
    }
    const hasStroke = nodeInfo.strokeWeight > 0 && nodeInfo.stroke !== '';

    propertiesContent.innerHTML = `
        <div class="prop-group">
            <div class="prop-label">Name</div>
            <input class="prop-input" id="prop-name" value="${nodeInfo.name}" />
        </div>
        <div class="prop-group">
            <div class="prop-label">Position</div>
            <div style="display:flex;gap:6px">
                <label style="font-size:10px;color:#666">X<input class="prop-input" id="prop-x" type="number" value="${Math.round(nodeInfo.x)}" style="width:60px;margin-left:4px" /></label>
                <label style="font-size:10px;color:#666">Y<input class="prop-input" id="prop-y" type="number" value="${Math.round(nodeInfo.y)}" style="width:60px;margin-left:4px" /></label>
            </div>
        </div>
        <div class="prop-group">
            <div class="prop-label">Size</div>
            <div style="display:flex;gap:6px">
                <label style="font-size:10px;color:#666">W<input class="prop-input" id="prop-w" type="number" value="${Math.round(nodeInfo.width)}" style="width:60px;margin-left:4px" /></label>
                <label style="font-size:10px;color:#666">H<input class="prop-input" id="prop-h" type="number" value="${Math.round(nodeInfo.height)}" style="width:60px;margin-left:4px" /></label>
            </div>
        </div>
        <div class="prop-group">
            <div class="prop-label">Rotation</div>
            <div style="display:flex;align-items:center;gap:4px">
                <input class="prop-input" id="prop-rotation" type="number" value="${Math.round(nodeInfo.rotation || 0)}" style="width:60px" step="1" />
                <span style="font-size:10px;color:#666">°</span>
            </div>
        </div>
        <div class="prop-group">
            <div class="prop-label">Fill</div>
            <div style="display:flex;align-items:center;gap:8px">
                <div id="prop-fill-swatch" style="width:32px;height:24px;border:1px solid #555;border-radius:3px;background:${fillHex};cursor:pointer" data-hex="${fillHex}"></div>
                <input id="prop-fill-hex" class="prop-input" value="${fillHex}" style="width:80px;font-family:monospace;font-size:12px" />
                <button id="prop-fill-image" style="background:#444;color:#ddd;border:1px solid #555;border-radius:3px;padding:2px 8px;cursor:pointer;font-size:11px" title="Set image fill">Img</button>
                <input type="file" id="prop-fill-image-input" accept="image/*" style="display:none" />
            </div>
        </div>
        <div class="prop-group">
            <div class="prop-label">Stroke</div>
            <div style="display:flex;align-items:center;gap:8px">
                <input type="color" id="prop-stroke" value="${strokeHex}" style="width:32px;height:24px;border:1px solid #555;border-radius:3px;background:none;cursor:pointer" />
                <input class="prop-input" id="prop-stroke-weight" type="number" value="${nodeInfo.strokeWeight}" style="width:50px" min="0" step="0.5" />
                <span style="font-size:10px;color:#666">px</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;margin-top:4px">
                <span style="font-size:10px;color:#666">Align</span>
                <select id="prop-stroke-align" class="prop-input" style="flex:1;background:#333;color:#ddd;border:1px solid #555;padding:3px;border-radius:3px;font-size:11px">
                    <option value="center"${nodeInfo.strokeAlign === 'center' ? ' selected' : ''}>Center</option>
                    <option value="inside"${nodeInfo.strokeAlign === 'inside' ? ' selected' : ''}>Inside</option>
                    <option value="outside"${nodeInfo.strokeAlign === 'outside' ? ' selected' : ''}>Outside</option>
                </select>
            </div>
        </div>
        <div class="prop-group">
            <div class="prop-label">Opacity</div>
            <input class="prop-input" id="prop-opacity" type="range" min="0" max="100" value="${Math.round(nodeInfo.opacity * 100)}" style="width:100%" />
        </div>
        <div class="prop-group">
            <div class="prop-label">Blend Mode</div>
            <select id="prop-blend" class="prop-input" style="width:100%;background:#333;color:#ddd;border:1px solid #555;padding:4px;border-radius:3px">
                ${['normal','multiply','screen','overlay','darken','lighten','color-dodge','color-burn','hard-light','soft-light','difference','exclusion','hue','saturation','color','luminosity'].map(m =>
                    `<option value="${m}"${nodeInfo.blendMode === m ? ' selected' : ''}>${m}</option>`
                ).join('')}
            </select>
        </div>
        <div class="prop-group">
            <div class="prop-label">Constraints</div>
            <div style="display:flex;gap:6px">
                <label style="font-size:10px;color:#666">H
                <select id="prop-ch" class="prop-input" style="flex:1;background:#333;color:#ddd;border:1px solid #555;padding:3px;border-radius:3px;font-size:11px">
                    ${['left','right','leftRight','center','scale'].map(v =>
                        `<option value="${v}"${nodeInfo.constraintH === v ? ' selected' : ''}>${v}</option>`
                    ).join('')}
                </select></label>
                <label style="font-size:10px;color:#666">V
                <select id="prop-cv" class="prop-input" style="flex:1;background:#333;color:#ddd;border:1px solid #555;padding:3px;border-radius:3px;font-size:11px">
                    ${['top','bottom','topBottom','center','scale'].map(v =>
                        `<option value="${v}"${nodeInfo.constraintV === v ? ' selected' : ''}>${v}</option>`
                    ).join('')}
                </select></label>
            </div>
        </div>
        ${nodeInfo.type === 'frame' ? `
        <div class="prop-group">
            <div class="prop-label">Auto Layout</div>
            ${nodeInfo.autoLayout ? `
            <div style="display:flex;flex-direction:column;gap:4px">
                <div style="display:flex;gap:4px;align-items:center">
                    <select id="prop-al-dir" class="prop-input" style="flex:1;background:#333;color:#ddd;border:1px solid #555;padding:3px;border-radius:3px;font-size:11px">
                        <option value="horizontal"${nodeInfo.autoLayout.direction === 'horizontal' ? ' selected' : ''}>Horizontal</option>
                        <option value="vertical"${nodeInfo.autoLayout.direction === 'vertical' ? ' selected' : ''}>Vertical</option>
                    </select>
                    <label style="font-size:10px;color:#666">Gap<input class="prop-input" id="prop-al-spacing" type="number" value="${nodeInfo.autoLayout.spacing}" style="width:40px;margin-left:2px" min="0" /></label>
                </div>
                <div style="display:flex;gap:4px">
                    <label style="font-size:10px;color:#666">T<input class="prop-input" id="prop-al-pt" type="number" value="${nodeInfo.autoLayout.padTop}" style="width:36px;margin-left:2px" min="0" /></label>
                    <label style="font-size:10px;color:#666">R<input class="prop-input" id="prop-al-pr" type="number" value="${nodeInfo.autoLayout.padRight}" style="width:36px;margin-left:2px" min="0" /></label>
                    <label style="font-size:10px;color:#666">B<input class="prop-input" id="prop-al-pb" type="number" value="${nodeInfo.autoLayout.padBottom}" style="width:36px;margin-left:2px" min="0" /></label>
                    <label style="font-size:10px;color:#666">L<input class="prop-input" id="prop-al-pl" type="number" value="${nodeInfo.autoLayout.padLeft}" style="width:36px;margin-left:2px" min="0" /></label>
                </div>
                <button id="prop-al-remove" style="background:#553;color:#daa;border:1px solid #664;padding:3px 8px;border-radius:3px;cursor:pointer;font-size:11px">Remove Auto Layout</button>
            </div>
            ` : `
            <button id="prop-al-add" style="background:#335;color:#aad;border:1px solid #446;padding:4px 12px;border-radius:3px;cursor:pointer;font-size:11px">+ Add Auto Layout</button>
            `}
        </div>
        ` : ''}
        ${nodeInfo.type === 'text' ? `
        <div class="prop-group">
            <div class="prop-label">Font</div>
            <div style="display:flex;gap:6px;align-items:center">
                <select class="prop-input" id="prop-font-family" style="flex:1;background:#333;color:#ddd;border:1px solid #555;padding:3px 4px;border-radius:3px;font-size:12px">
                    ${['Inter', 'Roboto', 'Poppins', 'Material Symbols Outlined', 'system-ui', 'sans-serif', 'serif', 'monospace'].map(f =>
                        `<option value="${f}" ${(nodeInfo.fontFamily || 'Inter') === f ? 'selected' : ''} style="font-family:'${f}'">${f}</option>`
                    ).join('')}
                </select>
                <select class="prop-input" id="prop-font-weight" style="width:70px;background:#333;color:#ddd;border:1px solid #555;padding:3px 4px;border-radius:3px;font-size:12px">
                    ${[{v:300,l:'Light'},{v:400,l:'Regular'},{v:500,l:'Medium'},{v:600,l:'Semi'},{v:700,l:'Bold'}].map(w =>
                        `<option value="${w.v}" ${(nodeInfo.fontWeight || 400) === w.v ? 'selected' : ''}>${w.l}</option>`
                    ).join('')}
                </select>
            </div>
        </div>
        <div class="prop-group">
            <div class="prop-label">Font Size</div>
            <input class="prop-input" id="prop-font-size" type="number" value="${Math.round(nodeInfo.fontSize)}" style="width:60px" min="1" />
        </div>
        <div class="prop-group">
            <div class="prop-label">Typography</div>
            <div style="display:flex;gap:6px">
                <label style="font-size:10px;color:#666">Spacing<input class="prop-input" id="prop-letter-spacing" type="number" value="${nodeInfo.letterSpacing || 0}" style="width:50px;margin-left:4px" step="0.5" /></label>
                <label style="font-size:10px;color:#666">Line H<input class="prop-input" id="prop-line-height" type="number" value="${nodeInfo.lineHeight || 0}" style="width:50px;margin-left:4px" step="1" min="0" /></label>
            </div>
        </div>
        <div class="prop-group">
            <div class="prop-label">Decoration</div>
            <div style="display:flex;gap:4px">
                <button id="prop-dec-none" style="flex:1;padding:3px 6px;border:1px solid ${(nodeInfo.textDecoration || 'none') === 'none' ? '#4285f4' : '#555'};background:${(nodeInfo.textDecoration || 'none') === 'none' ? '#335' : '#2a2a2a'};color:#ddd;border-radius:3px;cursor:pointer;font-size:11px">None</button>
                <button id="prop-dec-underline" style="flex:1;padding:3px 6px;border:1px solid ${nodeInfo.textDecoration === 'underline' ? '#4285f4' : '#555'};background:${nodeInfo.textDecoration === 'underline' ? '#335' : '#2a2a2a'};color:#ddd;border-radius:3px;cursor:pointer;font-size:11px;text-decoration:underline">U</button>
                <button id="prop-dec-strike" style="flex:1;padding:3px 6px;border:1px solid ${nodeInfo.textDecoration === 'strikethrough' ? '#4285f4' : '#555'};background:${nodeInfo.textDecoration === 'strikethrough' ? '#335' : '#2a2a2a'};color:#ddd;border-radius:3px;cursor:pointer;font-size:11px;text-decoration:line-through">S</button>
            </div>
        </div>
        <div class="prop-group">
            <div class="prop-label">Vertical Align</div>
            <div style="display:flex;gap:4px">
                <button id="prop-va-top" style="flex:1;padding:3px 6px;border:1px solid ${(nodeInfo.textVerticalAlign || 'top') === 'top' ? '#4285f4' : '#555'};background:${(nodeInfo.textVerticalAlign || 'top') === 'top' ? '#335' : '#2a2a2a'};color:#ddd;border-radius:3px;cursor:pointer;font-size:11px">Top</button>
                <button id="prop-va-center" style="flex:1;padding:3px 6px;border:1px solid ${nodeInfo.textVerticalAlign === 'center' ? '#4285f4' : '#555'};background:${nodeInfo.textVerticalAlign === 'center' ? '#335' : '#2a2a2a'};color:#ddd;border-radius:3px;cursor:pointer;font-size:11px">Mid</button>
                <button id="prop-va-bottom" style="flex:1;padding:3px 6px;border:1px solid ${nodeInfo.textVerticalAlign === 'bottom' ? '#4285f4' : '#555'};background:${nodeInfo.textVerticalAlign === 'bottom' ? '#335' : '#2a2a2a'};color:#ddd;border-radius:3px;cursor:pointer;font-size:11px">Bot</button>
            </div>
        </div>
        <div class="prop-group">
            <div class="prop-label">Text</div>
            <textarea id="prop-text" class="prop-input" style="width:100%;min-height:48px;resize:vertical;font-family:monospace;font-size:12px">${nodeInfo.text}</textarea>
        </div>
        ` : ''}
    `;

    // Wire up change handlers
    const commitProp = (inputId: string, handler: (val: string) => void) => {
        const el = document.getElementById(inputId) as HTMLInputElement;
        if (!el) return;
        el.addEventListener('change', () => {
            handler(el.value);
            render();
        });
    };

    commitProp('prop-name', (v) => app.set_node_name(counter, clientId, v));
    commitProp('prop-x', (v) => app.set_node_position(counter, clientId, parseFloat(v), parseFloat((document.getElementById('prop-y') as HTMLInputElement).value)));
    commitProp('prop-y', (v) => app.set_node_position(counter, clientId, parseFloat((document.getElementById('prop-x') as HTMLInputElement).value), parseFloat(v)));
    commitProp('prop-w', (v) => app.set_node_size(counter, clientId, parseFloat(v), parseFloat((document.getElementById('prop-h') as HTMLInputElement).value)));
    commitProp('prop-h', (v) => app.set_node_size(counter, clientId, parseFloat((document.getElementById('prop-w') as HTMLInputElement).value), parseFloat(v)));
    commitProp('prop-rotation', (v) => app.set_node_rotation(counter, clientId, parseFloat(v)));
    // Fill color: swatch opens color picker, hex input for direct entry
    const fillSwatch = document.getElementById('prop-fill-swatch');
    if (fillSwatch) {
        // Parse initial color from fill info
        const initMatch = nodeInfo.fill.match(/rgba?\((\d+),(\d+),(\d+),?([\d.]*)/);
        const ir = initMatch ? parseInt(initMatch[1]) / 255 : 0.5;
        const ig = initMatch ? parseInt(initMatch[2]) / 255 : 0.5;
        const ib = initMatch ? parseInt(initMatch[3]) / 255 : 0.5;
        const ia = initMatch && initMatch[4] ? parseFloat(initMatch[4]) : 1.0;
        fillSwatch.addEventListener('click', () => {
            openColorPicker(fillSwatch, ir, ig, ib, ia, (r, g, b, a) => {
                app.set_node_fill(counter, clientId, r, g, b, a);
                fillSwatch.style.background = rgbToHex(r, g, b);
                const hexIn = document.getElementById('prop-fill-hex') as HTMLInputElement;
                if (hexIn) hexIn.value = rgbToHex(r, g, b).toUpperCase();
                render();
            });
        });
    }
    commitProp('prop-fill-hex', (v) => {
        const hex = v.replace('#', '');
        if (/^[0-9a-fA-F]{6}$/.test(hex)) {
            const [r, g, b] = hexToRgb(hex);
            app.set_node_fill(counter, clientId, r, g, b, 1.0);
            const swatch = document.getElementById('prop-fill-swatch');
            if (swatch) swatch.style.background = `#${hex}`;
        }
    });
    // Image fill button
    const imgFillBtn = document.getElementById('prop-fill-image');
    const imgFillInput = document.getElementById('prop-fill-image-input') as HTMLInputElement;
    if (imgFillBtn && imgFillInput) {
        imgFillBtn.addEventListener('click', () => imgFillInput.click());
        imgFillInput.addEventListener('change', () => {
            const file = imgFillInput.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                const dataUrl = reader.result as string;
                // Use a unique key for this image
                const key = `user-image-${Date.now()}-${file.name}`;
                // Pre-cache the image in our image cache
                const img = new Image();
                img.onload = () => {
                    imageCache.set(key, img);
                    app.set_image_fill(counter, clientId, key, 'fill', 1.0);
                    render();
                    updatePropertiesPanel();
                };
                img.src = dataUrl;
            };
            reader.readAsDataURL(file);
            imgFillInput.value = '';
        });
    }

    commitProp('prop-stroke', (v) => {
        const r = parseInt(v.slice(1, 3), 16) / 255;
        const g = parseInt(v.slice(3, 5), 16) / 255;
        const b = parseInt(v.slice(5, 7), 16) / 255;
        const w = parseFloat((document.getElementById('prop-stroke-weight') as HTMLInputElement).value) || 1;
        app.set_node_stroke(counter, clientId, r, g, b, 1.0, w);
    });
    commitProp('prop-stroke-weight', (v) => {
        const w = parseFloat(v);
        if (w <= 0) {
            app.remove_node_stroke(counter, clientId);
        } else {
            // Get current stroke color or default to black
            const sc = (document.getElementById('prop-stroke') as HTMLInputElement).value;
            const r = parseInt(sc.slice(1, 3), 16) / 255;
            const g = parseInt(sc.slice(3, 5), 16) / 255;
            const b = parseInt(sc.slice(5, 7), 16) / 255;
            app.set_node_stroke(counter, clientId, r, g, b, 1.0, w);
        }
    });
    commitProp('prop-stroke-align', (v) => {
        app.set_stroke_align(counter, clientId, v);
    });
    commitProp('prop-text', (v) => {
        app.set_node_text(counter, clientId, v);
    });
    commitProp('prop-font-family', (v) => {
        app.set_node_font_family(counter, clientId, v);
    });
    commitProp('prop-font-weight', (v) => {
        app.set_node_font_weight(counter, clientId, parseInt(v));
    });
    commitProp('prop-font-size', (v) => {
        app.set_node_font_size(counter, clientId, parseFloat(v));
    });
    commitProp('prop-letter-spacing', (v) => {
        app.set_letter_spacing(counter, clientId, parseFloat(v));
    });
    commitProp('prop-line-height', (v) => {
        app.set_line_height(counter, clientId, parseFloat(v));
    });

    // Text decoration buttons
    for (const [btnId, val] of [['prop-dec-none', 'none'], ['prop-dec-underline', 'underline'], ['prop-dec-strike', 'strikethrough']] as const) {
        const btn = document.getElementById(btnId);
        if (btn) btn.addEventListener('click', () => {
            app.set_text_decoration(counter, clientId, val);
            render();
            updatePropertiesPanel();
        });
    }

    // Text vertical align buttons
    for (const [btnId, val] of [['prop-va-top', 'top'], ['prop-va-center', 'center'], ['prop-va-bottom', 'bottom']] as const) {
        const btn = document.getElementById(btnId);
        if (btn) btn.addEventListener('click', () => {
            app.set_text_vertical_align(counter, clientId, val);
            render();
            updatePropertiesPanel();
        });
    }

    // Opacity slider — use 'input' for live feedback
    const opacityEl = document.getElementById('prop-opacity') as HTMLInputElement;
    if (opacityEl) {
        opacityEl.addEventListener('input', () => {
            app.set_node_opacity(counter, clientId, parseInt(opacityEl.value) / 100);
            render();
        });
    }

    // Blend mode dropdown
    const blendModes = ['normal','multiply','screen','overlay','darken','lighten','color-dodge','color-burn','hard-light','soft-light','difference','exclusion','hue','saturation','color','luminosity'];
    commitProp('prop-blend', (v) => {
        const idx = blendModes.indexOf(v);
        if (idx >= 0) app.set_node_blend_mode(counter, clientId, idx);
    });

    // Constraint dropdowns
    const hMap: Record<string, number> = { left: 0, right: 1, leftRight: 2, center: 3, scale: 4 };
    const vMap: Record<string, number> = { top: 0, bottom: 1, topBottom: 2, center: 3, scale: 4 };
    const applyConstraints = () => {
        const hVal = (document.getElementById('prop-ch') as HTMLSelectElement)?.value || 'left';
        const vVal = (document.getElementById('prop-cv') as HTMLSelectElement)?.value || 'top';
        app.set_node_constraints(counter, clientId, hMap[hVal] ?? 0, vMap[vVal] ?? 0);
        render();
    };
    commitProp('prop-ch', applyConstraints);
    commitProp('prop-cv', applyConstraints);

    // Auto-layout controls
    const applyAutoLayout = () => {
        const dir = (document.getElementById('prop-al-dir') as HTMLSelectElement)?.value === 'horizontal' ? 0 : 1;
        const spacing = parseFloat((document.getElementById('prop-al-spacing') as HTMLInputElement)?.value) || 0;
        const pt = parseFloat((document.getElementById('prop-al-pt') as HTMLInputElement)?.value) || 0;
        const pr = parseFloat((document.getElementById('prop-al-pr') as HTMLInputElement)?.value) || 0;
        const pb = parseFloat((document.getElementById('prop-al-pb') as HTMLInputElement)?.value) || 0;
        const pl = parseFloat((document.getElementById('prop-al-pl') as HTMLInputElement)?.value) || 0;
        app.set_auto_layout(counter, clientId, dir, spacing, pt, pr, pb, pl);
        render(true);
    };
    commitProp('prop-al-dir', applyAutoLayout);
    commitProp('prop-al-spacing', applyAutoLayout);
    commitProp('prop-al-pt', applyAutoLayout);
    commitProp('prop-al-pr', applyAutoLayout);
    commitProp('prop-al-pb', applyAutoLayout);
    commitProp('prop-al-pl', applyAutoLayout);

    const addBtn = document.getElementById('prop-al-add');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            app.set_auto_layout(counter, clientId, 1, 10, 10, 10, 10, 10);
            render(true);
        });
    }
    const removeBtn = document.getElementById('prop-al-remove');
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            app.remove_auto_layout(counter, clientId);
            render(true);
        });
    }
}

// ─── WebSocket sync ─────────────────────────────────────────────────

const DOC_ID = 'default';
let ws: WebSocket | null = null;

function connectSync(): void {
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${proto}//${location.host}/api/ws/${DOC_ID}`);

    ws.addEventListener('open', () => {
        info.textContent += ' | Connected';
        flushOps();
    });

    ws.addEventListener('message', (e: MessageEvent) => {
        try {
            const msg = JSON.parse(e.data as string) as { ops: unknown[] };
            if (msg.ops && Array.isArray(msg.ops)) {
                const applied = app.apply_remote_ops(JSON.stringify(msg.ops));
                if (applied > 0) {
                    render();
                }
            }
        } catch {
            // Ignore malformed messages
        }
    });

    ws.addEventListener('close', () => {
        setTimeout(connectSync, 2000);
    });
}

function flushOps(): void {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const opsJson = app.get_pending_ops();
    if (opsJson !== '[]') {
        ws.send(opsJson);
    }
}

connectSync();

// ─── Initial render ──────────────────────────────────────────────────

render();
