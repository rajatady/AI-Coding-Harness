//! EXECUTABLE SPECIFICATION: Build the Apple website homepage.
//!
//! This file IS the project plan. Every compiler error is a missing feature.
//! Every test failure is the next thing to build.
//!
//! Run: cargo test -p figma-renderer --test apple_website
//! The FIRST error tells you what to build next.
//!
//! When this file fully compiles and all tests pass,
//! the Figma clone can design a real website.

use figma_engine::id::ClockGen;
use figma_engine::node::Node;
use figma_engine::properties::*;
use figma_engine::tree::DocumentTree;

/// Helper: build a tree with a root frame (the artboard).
fn artboard(clock: &mut ClockGen, tree: &mut DocumentTree, name: &str, w: f32, h: f32) -> figma_engine::id::NodeId {
    let id = clock.next_node_id();
    let mut frame = Node::frame(id, name, w, h);
    frame.transform = Transform::translate(0.0, 0.0);
    frame.style.fills.push(Paint::Solid(Color::new(1.0, 1.0, 1.0, 1.0)));
    let root = tree.root_id();
    tree.insert(frame, root, 0).unwrap();
    id
}

// ═══════════════════════════════════════════════════════════════════════
// PHASE 1: Basic page structure (frames, text, nesting)
// ═══════════════════════════════════════════════════════════════════════

#[test]
fn p1_artboard_with_nested_frames() {
    let mut tree = DocumentTree::new();
    let mut clock = ClockGen::new(0);

    // Apple homepage: 1440x900 artboard
    let page = artboard(&mut clock, &mut tree, "Homepage", 1440.0, 900.0);

    // Navigation bar: full-width frame at top
    let nav_id = clock.next_node_id();
    let mut nav = Node::frame(nav_id, "Nav Bar", 1440.0, 48.0);
    nav.transform = Transform::translate(0.0, 0.0);
    nav.style.fills.push(Paint::Solid(Color::new(0.0, 0.0, 0.0, 0.9)));
    tree.insert(nav, page, 0).unwrap();

    // Hero section: large frame below nav
    let hero_id = clock.next_node_id();
    let mut hero = Node::frame(hero_id, "Hero Section", 1440.0, 600.0);
    hero.transform = Transform::translate(0.0, 48.0);
    hero.style.fills.push(Paint::Solid(Color::new(0.0, 0.0, 0.0, 1.0)));
    tree.insert(hero, page, 1).unwrap();

    // Footer
    let footer_id = clock.next_node_id();
    let mut footer = Node::frame(footer_id, "Footer", 1440.0, 252.0);
    footer.transform = Transform::translate(0.0, 648.0);
    footer.style.fills.push(Paint::Solid(Color::new(0.96, 0.96, 0.96, 1.0)));
    tree.insert(footer, page, 2).unwrap();

    // Verify structure
    assert_eq!(tree.children_of(&page).unwrap().len(), 3);
    assert_eq!(tree.children_of(&nav_id).unwrap().len(), 0);

    // Verify we can render it
    let viewport = figma_renderer::scene::AABB::new(
        glam::Vec2::ZERO,
        glam::Vec2::new(1440.0, 900.0),
    );
    let output = figma_renderer::pipeline::render(&tree, &tree.root_id(), viewport);
    assert!(output.item_count >= 4); // root + page + nav + hero + footer
}

#[test]
fn p1_text_in_frames() {
    let mut tree = DocumentTree::new();
    let mut clock = ClockGen::new(0);

    let page = artboard(&mut clock, &mut tree, "Homepage", 1440.0, 900.0);

    // Nav bar with text links
    let nav_id = clock.next_node_id();
    let nav = Node::frame(nav_id, "Nav", 1440.0, 48.0);
    tree.insert(nav, page, 0).unwrap();

    // "Mac" link in nav
    let mac_id = clock.next_node_id();
    let mut mac = Node::text(mac_id, "Mac Link", "Mac", 14.0, Color::new(1.0, 1.0, 1.0, 1.0));
    mac.transform = Transform::translate(200.0, 14.0);
    tree.insert(mac, nav_id, 0).unwrap();

    // "iPhone" link in nav
    let iphone_id = clock.next_node_id();
    let mut iphone = Node::text(iphone_id, "iPhone Link", "iPhone", 14.0, Color::new(1.0, 1.0, 1.0, 1.0));
    iphone.transform = Transform::translate(260.0, 14.0);
    tree.insert(iphone, nav_id, 1).unwrap();

    // Hero headline
    let hero_id = clock.next_node_id();
    let hero = Node::frame(hero_id, "Hero", 1440.0, 600.0);
    tree.insert(hero, page, 1).unwrap();

    let headline_id = clock.next_node_id();
    let mut headline = Node::text(
        headline_id, "Headline", "iPhone 16 Pro",
        56.0, Color::new(1.0, 1.0, 1.0, 1.0),
    );
    headline.transform = Transform::translate(500.0, 200.0);
    tree.insert(headline, hero_id, 0).unwrap();

    let subhead_id = clock.next_node_id();
    let mut subhead = Node::text(
        subhead_id, "Subheadline", "Hello, Apple Intelligence.",
        28.0, Color::new(0.6, 0.6, 0.6, 1.0),
    );
    subhead.transform = Transform::translate(480.0, 270.0);
    tree.insert(subhead, hero_id, 1).unwrap();

    // Verify nesting works
    assert_eq!(tree.children_of(&nav_id).unwrap().len(), 2);
    assert_eq!(tree.children_of(&hero_id).unwrap().len(), 2);

    // Render and check item count
    let viewport = figma_renderer::scene::AABB::new(
        glam::Vec2::ZERO,
        glam::Vec2::new(1440.0, 900.0),
    );
    let output = figma_renderer::pipeline::render(&tree, &tree.root_id(), viewport);
    // root + page + nav + 2 nav texts + hero + headline + subhead = 8
    assert!(output.item_count >= 7, "expected >=7 items, got {}", output.item_count);
}

#[test]
fn p1_white_text_on_black_frame_pixel() {
    // Reproduces the Apple Website page: black frame with white text
    let mut tree = DocumentTree::new();
    let mut clock = ClockGen::new(0);
    let root = tree.root_id();

    // Black frame at (0,0) 200x200
    let frame_id = clock.next_node_id();
    let mut frame = Node::frame(frame_id, "BG", 200.0, 200.0);
    frame.style.fills.push(Paint::Solid(Color::new(0.0, 0.0, 0.0, 1.0)));
    tree.insert(frame, root, 0).unwrap();

    // White text "Hi" at (20, 40), font_size 40
    let text_id = clock.next_node_id();
    let mut text = Node::text(text_id, "Label", "Hi", 40.0, Color::new(1.0, 1.0, 1.0, 1.0));
    text.transform = Transform::translate(20.0, 40.0);
    tree.insert(text, root, 1).unwrap();

    let viewport = figma_renderer::scene::AABB::new(
        glam::Vec2::ZERO,
        glam::Vec2::new(200.0, 200.0),
    );
    let output = figma_renderer::pipeline::render(&tree, &tree.root_id(), viewport);
    let pixels = output.to_pixels(200, 200);

    // The frame should make everything black. Text should paint white pixels on top.
    // Check a region where text glyphs should be: around (30, 70) for "H"
    let mut found_white = false;
    let mut found_black = false;
    for y in 40..100 {
        for x in 20..80 {
            let idx = (y * 200 + x) as usize * 4;
            let (r, g, b, a) = (pixels[idx], pixels[idx+1], pixels[idx+2], pixels[idx+3]);
            if a > 0 && r > 128 && g > 128 && b > 128 {
                found_white = true;
            }
            if a > 200 && r == 0 && g == 0 && b == 0 {
                found_black = true;
            }
        }
    }

    assert!(found_black, "Frame should paint black pixels");
    assert!(found_white, "Text should paint white pixels on top of black frame");
}

// ═══════════════════════════════════════════════════════════════════════
// PHASE 2: Multiple artboards (1000 artboard stress test)
// ═══════════════════════════════════════════════════════════════════════

#[test]
fn p2_hundred_artboards() {
    let mut tree = DocumentTree::new();
    let mut clock = ClockGen::new(0);
    let root = tree.root_id();

    // Create 100 artboards (1000 is the goal, start with 100)
    for i in 0..100u32 {
        let id = clock.next_node_id();
        let mut frame = Node::frame(id, &format!("Artboard {}", i), 1440.0, 900.0);
        frame.transform = Transform::translate((i % 10) as f32 * 1500.0, (i / 10) as f32 * 960.0);
        frame.style.fills.push(Paint::Solid(Color::new(1.0, 1.0, 1.0, 1.0)));
        tree.insert(frame, root, i as usize).unwrap();

        // Each artboard gets 5 child rectangles
        for j in 0..5u32 {
            let cid = clock.next_node_id();
            let mut rect = Node::rectangle(cid, &format!("Rect {}:{}", i, j), 200.0, 100.0);
            rect.transform = Transform::translate(j as f32 * 250.0 + 50.0, 100.0);
            rect.style.fills.push(Paint::Solid(Color::new(0.2, 0.4, 0.8, 1.0)));
            tree.insert(rect, id, j as usize).unwrap();
        }
    }

    // 100 artboards + 500 rects + root = 601 nodes
    assert_eq!(tree.node_count(), 601);

    // Render just the visible viewport (first 2 artboards)
    let viewport = figma_renderer::scene::AABB::new(
        glam::Vec2::ZERO,
        glam::Vec2::new(3000.0, 960.0),
    );
    let start = std::time::Instant::now();
    let output = figma_renderer::pipeline::render(&tree, &root, viewport);
    let elapsed = start.elapsed();

    // Viewport should cull most artboards — only ~2 visible
    // Render time should be reasonable (< 500ms for 2 artboards)
    eprintln!("100 artboards: {} items rendered in {:?}", output.item_count, elapsed);
    assert!(elapsed.as_millis() < 500, "rendering too slow: {:?}", elapsed);
}

// ═══════════════════════════════════════════════════════════════════════
// PHASE 3: Components (reusable headers, footers, buttons)
// These tests will fail until the component system is built.
// ═══════════════════════════════════════════════════════════════════════

#[test]
fn p3_component_definition() {
    let mut tree = DocumentTree::new();
    let mut clock = ClockGen::new(0);
    let root = tree.root_id();

    // Define a "Button" component
    let btn_id = clock.next_node_id();
    let mut btn = Node::component(btn_id, "Button", 120.0, 40.0);
    btn.style.fills.push(Paint::Solid(Color::new(0.0, 0.4, 1.0, 1.0)));
    tree.insert(btn, root, 0).unwrap();

    // Button has a text child
    let label_id = clock.next_node_id();
    let mut label = Node::text(label_id, "Label", "Buy Now", 16.0, Color::new(1.0, 1.0, 1.0, 1.0));
    label.transform = Transform::translate(20.0, 10.0);
    tree.insert(label, btn_id, 0).unwrap();

    assert!(tree.get(&btn_id).is_some());
    assert_eq!(tree.children_of(&btn_id).unwrap().len(), 1);
}

#[test]
fn p3_component_instance() {
    let mut tree = DocumentTree::new();
    let mut clock = ClockGen::new(0);
    let root = tree.root_id();

    // Define component
    let btn_id = clock.next_node_id();
    let mut btn = Node::component(btn_id, "Button", 120.0, 40.0);
    btn.style.fills.push(Paint::Solid(Color::new(0.0, 0.4, 1.0, 1.0)));
    tree.insert(btn, root, 0).unwrap();

    let label_id = clock.next_node_id();
    let label = Node::text(label_id, "Label", "Buy", 16.0, Color::new(1.0, 1.0, 1.0, 1.0));
    tree.insert(label, btn_id, 0).unwrap();

    // Create an instance of the button
    let inst_id = clock.next_node_id();
    let mut inst = Node::instance(inst_id, "Button Instance", btn_id, 120.0, 40.0);
    inst.transform = Transform::translate(100.0, 100.0);
    tree.insert(inst, root, 1).unwrap();

    // Instance should exist and reference the component
    let inst_node = tree.get(&inst_id).unwrap();
    match &inst_node.kind {
        figma_engine::node::NodeKind::Instance { component_id, .. } => {
            assert_eq!(*component_id, btn_id);
        }
        _ => panic!("expected instance node"),
    }
}

// ═══════════════════════════════════════════════════════════════════════
// PHASE 4: Images (Apple website is 80% images)
// These will fail until image support is added.
// ═══════════════════════════════════════════════════════════════════════

// Phase 4: Image nodes — the Apple website is 80% images.
#[test]
fn p4_image_node() {
    let mut tree = DocumentTree::new();
    let mut clock = ClockGen::new(0);
    let root = tree.root_id();

    // A 2x2 red pixel as test image data (RGBA)
    let pixel_data: Vec<u8> = vec![255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 0, 255];

    let img_id = clock.next_node_id();
    let img = Node::image(img_id, "Hero Image", 1440.0, 600.0, 2, 2, pixel_data);
    tree.insert(img, root, 0).unwrap();

    // Verify it exists and is the right type
    let node = tree.get(&img_id).unwrap();
    assert_eq!(node.width, 1440.0);
    match &node.kind {
        figma_engine::node::NodeKind::Image { .. } => {}
        _ => panic!("expected image node"),
    }
}

// ═══════════════════════════════════════════════════════════════════════
// PHASE 5: Effects (shadows on cards, blur on nav)
// ═══════════════════════════════════════════════════════════════════════

// Phase 5: Drop shadow rendering.
#[test]
fn p5_drop_shadow_renders() {
    // A white card at (100,100) size 200x150 with a drop shadow.
    // The shadow is offset (8,8) with blur_radius=16, black color.
    // Pixels OUTSIDE the card but within shadow range must have alpha > 0.
    let mut tree = DocumentTree::new();
    let mut clock = ClockGen::new(0);
    let root = tree.root_id();

    let card_id = clock.next_node_id();
    let mut card = Node::rectangle(card_id, "Card", 200.0, 150.0);
    card.transform = Transform::translate(100.0, 100.0);
    card.style.fills.push(Paint::Solid(Color::new(1.0, 1.0, 1.0, 1.0)));
    card.style.effects.push(Effect::DropShadow {
        color: Color::new(0.0, 0.0, 0.0, 0.5),
        offset: glam::Vec2::new(8.0, 8.0),
        blur_radius: 16.0,
        spread: 0.0,
    });
    tree.insert(card, root, 0).unwrap();

    let viewport = figma_renderer::scene::AABB::new(
        glam::Vec2::ZERO,
        glam::Vec2::new(400.0, 350.0),
    );
    let output = figma_renderer::pipeline::render(&tree, &root, viewport);
    let pixels = output.to_pixels(400, 350);

    // Helper to read alpha at (x,y)
    let alpha_at = |x: u32, y: u32| -> u8 {
        pixels[((y * 400 + x) * 4 + 3) as usize]
    };

    // Inside the card: must be opaque white
    assert!(alpha_at(200, 175) > 200, "card center must be opaque");

    // Shadow pixel: below-right of the card, within blur range.
    // Card ends at (300, 250). Shadow offset (8,8) → shadow center at (308, 258).
    // With blur_radius=16, shadow extends ~16px beyond the shadow rect.
    // Check (310, 260) — outside card but in shadow region.
    let shadow_alpha = alpha_at(310, 260);
    assert!(shadow_alpha > 0, "shadow pixel at (310,260) must have alpha > 0, got {}", shadow_alpha);

    // Well outside shadow range: must be transparent.
    // Shadow max extent ~= card_end + offset + blur = 300+8+16=324, 250+8+16=274.
    // Check (350, 300) — well beyond shadow.
    let outside_alpha = alpha_at(350, 300);
    assert_eq!(outside_alpha, 0, "pixel at (350,300) must be transparent, got {}", outside_alpha);
}

// ═══════════════════════════════════════════════════════════════════════
// PHASE 6: Auto-layout (responsive nav bar, card grids)
// ═══════════════════════════════════════════════════════════════════════

// Phase 6: Auto-layout positions children correctly.
#[test]
fn p6_horizontal_nav_layout() {
    use figma_engine::layout::compute_layout;

    let mut tree = DocumentTree::new();
    let mut clock = ClockGen::new(0);
    let root = tree.root_id();

    // Create nav bar frame with horizontal auto-layout
    let nav_id = clock.next_node_id();
    let mut nav = Node::frame(nav_id, "Nav", 800.0, 48.0);
    nav.transform = Transform::translate(0.0, 0.0);
    nav.style.fills.push(Paint::Solid(Color::new(0.1, 0.1, 0.1, 1.0)));
    nav.kind = figma_engine::node::NodeKind::Frame {
        clip_content: true,
        auto_layout: Some(AutoLayout {
            direction: LayoutDirection::Horizontal,
            spacing: 20.0,
            padding_top: 12.0,
            padding_right: 24.0,
            padding_bottom: 12.0,
            padding_left: 24.0,
            primary_sizing: SizingMode::Fixed,
            counter_sizing: SizingMode::Fixed,
            align: LayoutAlign::Center,
        }),
        corner_radii: figma_engine::node::CornerRadii::default(),
    };
    tree.insert(nav, root, 0).unwrap();

    // Add 5 nav items as text children (each ~50px wide)
    let items = ["Store", "Mac", "iPad", "iPhone", "Watch"];
    for name in &items {
        let id = clock.next_node_id();
        let item = Node::text(id, *name, name, 14.0, Color::new(1.0, 1.0, 1.0, 1.0));
        tree.insert(item, nav_id, tree.children_of(&nav_id).map(|c| c.len()).unwrap_or(0)).unwrap();
    }

    // Run auto-layout
    compute_layout(&mut tree, &root);

    // Verify: children should be positioned sequentially along x-axis
    // First child: x = padding_left = 24.0
    // Each subsequent: x = prev_x + prev_width + spacing(20)
    let child_list = tree.children_of(&nav_id).unwrap();
    let mut expected_x = 24.0; // padding_left
    let mut prev_x = None;
    for (i, child_id) in child_list.iter().enumerate() {
        let child = tree.get(child_id).unwrap();
        let tx = child.transform.tx;

        // Each child should be further right than the previous
        if let Some(prev) = prev_x {
            assert!(tx > prev, "Child {} (x={}) should be right of child {} (x={})", i, tx, i-1, prev);
        }
        // First child should be at padding_left
        if i == 0 {
            assert!((tx - 24.0).abs() < 1.0,
                "First child should be at x~24 (padding_left), got {}", tx);
        }
        prev_x = Some(tx);
    }

    // Also verify the last child is within the frame bounds
    let last_id = child_list.iter().last().unwrap();
    let last = tree.get(last_id).unwrap();
    assert!(last.transform.tx + last.width <= 800.0,
        "Last child at x={} w={} should fit in 800px frame",
        last.transform.tx, last.width);
}

// ═══════════════════════════════════════════════════════════════════════
// PHASE 7: Export (the design needs to GO somewhere)
// ═══════════════════════════════════════════════════════════════════════

// Phase 7: SVG export.
#[test]
fn p7_svg_export() {
    let mut tree = DocumentTree::new();
    let mut clock = ClockGen::new(0);
    let root = tree.root_id();

    // Red rectangle
    let rect_id = clock.next_node_id();
    let mut rect = Node::rectangle(rect_id, "RedBox", 200.0, 100.0);
    rect.transform = Transform::translate(50.0, 30.0);
    rect.style.fills.push(Paint::Solid(Color::new(1.0, 0.0, 0.0, 1.0)));
    tree.insert(rect, root, 0).unwrap();

    // Green ellipse
    let ellipse_id = clock.next_node_id();
    let mut ell = Node::ellipse(ellipse_id, "GreenCircle", 80.0, 80.0);
    ell.transform = Transform::translate(300.0, 50.0);
    ell.style.fills.push(Paint::Solid(Color::new(0.0, 1.0, 0.0, 1.0)));
    tree.insert(ell, root, 1).unwrap();

    let viewport = figma_renderer::scene::AABB::new(
        glam::Vec2::ZERO,
        glam::Vec2::new(500.0, 200.0),
    );
    let svg = figma_renderer::svg::export_svg(&tree, &root, viewport);

    // Must be valid SVG
    assert!(svg.starts_with("<svg"), "SVG must start with <svg>, got: {}", &svg[..50.min(svg.len())]);
    assert!(svg.contains("</svg>"), "SVG must end with </svg>");

    // Must contain a rect element
    assert!(svg.contains("<rect"), "SVG must contain <rect> for the rectangle");
    assert!(svg.contains("fill=\"rgb(255,0,0)\"") || svg.contains("fill=\"#ff0000\""),
        "SVG rect must have red fill");

    // Must contain an ellipse element
    assert!(svg.contains("<ellipse") || svg.contains("<circle"),
        "SVG must contain <ellipse> or <circle> for the ellipse");
}

// ═══════════════════════════════════════════════════════════════════════
// PHASE 8: Performance (1000 artboards, 10K objects)
// ═══════════════════════════════════════════════════════════════════════

#[test]
fn p8_thousand_artboards_creation() {
    let mut tree = DocumentTree::new();
    let mut clock = ClockGen::new(0);
    let root = tree.root_id();

    let start = std::time::Instant::now();
    for i in 0..1000u32 {
        let id = clock.next_node_id();
        let mut frame = Node::frame(id, &format!("A{}", i), 1440.0, 900.0);
        frame.transform = Transform::translate((i % 20) as f32 * 1500.0, (i / 20) as f32 * 960.0);
        tree.insert(frame, root, i as usize).unwrap();
    }
    let elapsed = start.elapsed();

    assert_eq!(tree.node_count(), 1001); // 1000 + root
    eprintln!("1000 artboards created in {:?}", elapsed);
    assert!(elapsed.as_millis() < 1000, "tree creation too slow: {:?}", elapsed);
}

/// 80K objects matching main.ts layout. Measures ms/frame for a 1920x1080 viewport.
/// Target: <16.6ms (60fps).
#[test]
fn p8_80k_objects_render_time() {
    use std::time::Instant;

    let mut tree = DocumentTree::new();
    let mut clock = ClockGen::new(0);
    let root = tree.root_id();

    // Match main.ts: 20K iterations × 4 shapes = 80K objects
    let t_insert = Instant::now();
    for i in 1..=20_000u32 {
        let r_id = clock.next_node_id();
        let mut r = Node::rectangle(r_id, "Red", 200.0, 150.0);
        r.transform = Transform::translate(100.0 * i as f32, 80.0 * i as f32);
        r.style.fills.push(Paint::Solid(Color::new(0.9, 0.2, 0.2, 1.0)));
        tree.insert(r, root, ((i - 1) * 4) as usize).unwrap();

        let b_id = clock.next_node_id();
        let mut b = Node::rectangle(b_id, "Blue", 180.0, 120.0);
        b.transform = Transform::translate(250.0 * i as f32, 160.0 * i as f32);
        b.style.fills.push(Paint::Solid(Color::new(0.2, 0.4, 0.9, 0.9)));
        tree.insert(b, root, ((i - 1) * 4 + 1) as usize).unwrap();

        let e_id = clock.next_node_id();
        let mut e = Node::ellipse(e_id, "Green", 160.0, 160.0);
        e.transform = Transform::translate(400.0 * i as f32, 100.0 * i as f32);
        e.style.fills.push(Paint::Solid(Color::new(0.2, 0.8, 0.3, 1.0)));
        tree.insert(e, root, ((i - 1) * 4 + 2) as usize).unwrap();

        let y_id = clock.next_node_id();
        let mut y = Node::rectangle(y_id, "Yellow", 280.0, 80.0);
        y.transform = Transform::translate(150.0 * i as f32, 320.0 * i as f32);
        y.style.fills.push(Paint::Solid(Color::new(0.95, 0.85, 0.2, 1.0)));
        tree.insert(y, root, ((i - 1) * 4 + 3) as usize).unwrap();
    }
    let insert_ms = t_insert.elapsed().as_millis();
    eprintln!("80K objects inserted in {}ms", insert_ms);
    assert_eq!(tree.node_count(), 80_001); // 80K + root

    // Viewport at origin (where first objects are) — 1920×1080
    let viewport = figma_renderer::scene::AABB::new(
        glam::Vec2::ZERO,
        glam::Vec2::new(1920.0, 1080.0),
    );

    // Warm up
    let _ = figma_renderer::pipeline::render(&tree, &tree.root_id(), viewport);

    // Measure breakdown: scene build vs rasterize vs pixel copy
    let mut scene_us = Vec::new();
    let mut raster_us = Vec::new();
    let mut pixel_us = Vec::new();
    let mut total_us = Vec::new();
    let mut visible_count = 0usize;

    for _ in 0..5 {
        let t0 = Instant::now();
        let items = figma_renderer::scene::build_scene(&tree, &tree.root_id(), &viewport);
        let t1 = Instant::now();
        visible_count = items.len();
        let output = figma_renderer::pipeline::render_items(&items, viewport);
        let t2 = Instant::now();
        let _pixels = output.to_pixels(1920, 1080);
        let t3 = Instant::now();

        scene_us.push((t1 - t0).as_micros());
        raster_us.push((t2 - t1).as_micros());
        pixel_us.push((t3 - t2).as_micros());
        total_us.push((t3 - t0).as_micros());
    }
    scene_us.sort();
    raster_us.sort();
    pixel_us.sort();
    total_us.sort();

    let median_ms = total_us[2] as f64 / 1000.0;

    eprintln!("80K objects render breakdown (median of 5):");
    eprintln!("  scene build: {:.1}ms ({} visible of 80K)", scene_us[2] as f64 / 1000.0, visible_count);
    eprintln!("  rasterize:   {:.1}ms", raster_us[2] as f64 / 1000.0);
    eprintln!("  to_pixels:   {:.1}ms", pixel_us[2] as f64 / 1000.0);
    eprintln!("  TOTAL:       {:.1}ms/frame", median_ms);
    eprintln!("  all totals:  {:?}us", total_us);

    // Target: <16.6ms for 60fps (only meaningful in release mode)
    if cfg!(not(debug_assertions)) {
        assert!(
            median_ms < 16.6,
            "RENDER TOO SLOW: {:.1}ms/frame (need <16.6ms for 60fps)",
            median_ms
        );
    } else {
        eprintln!("  (skipping assert in debug mode — run with --release for accurate perf)");
    }
}

// ═══════════════════════════════════════════════════════════════════════
// PHASE 9: Vector paths (pen tool, Starbucks logo complexity)
// ═══════════════════════════════════════════════════════════════════════

#[test]
fn p9_vector_path_with_bezier_curves() {
    use figma_engine::node::{NodeKind, PathCommand, VectorPath};
    use figma_engine::properties::FillRule;
    use glam::Vec2;
    let mut tree = DocumentTree::new();
    let mut clock = ClockGen::new(0);
    let root = tree.root_id();

    // Create a vector node with bezier curves (simplified logo shape)
    let vec_id = clock.next_node_id();
    let commands = vec![
        PathCommand::MoveTo(Vec2::new(60.0, 0.0)),
        PathCommand::CubicTo { control1: Vec2::new(80.0, 20.0), control2: Vec2::new(100.0, 40.0), to: Vec2::new(120.0, 20.0) },
        PathCommand::CubicTo { control1: Vec2::new(100.0, 60.0), control2: Vec2::new(80.0, 80.0), to: Vec2::new(60.0, 100.0) },
        PathCommand::CubicTo { control1: Vec2::new(40.0, 80.0), control2: Vec2::new(20.0, 60.0), to: Vec2::new(0.0, 20.0) },
        PathCommand::CubicTo { control1: Vec2::new(20.0, 40.0), control2: Vec2::new(40.0, 20.0), to: Vec2::new(60.0, 0.0) },
        PathCommand::Close,
    ];
    let path = VectorPath { commands: commands.clone(), fill_rule: FillRule::NonZero };

    let mut vec_node = Node::rectangle(vec_id, "LogoShape", 120.0, 100.0);
    vec_node.kind = NodeKind::Vector { paths: vec![path] };
    vec_node.style.fills.push(Paint::Solid(Color::new(0.0, 0.4, 0.2, 1.0)));
    tree.insert(vec_node, root, 0).unwrap();

    // Verify path commands stored correctly
    let node = tree.get(&vec_id).unwrap();
    match &node.kind {
        NodeKind::Vector { paths } => {
            assert_eq!(paths[0].commands.len(), 6, "path commands count mismatch");
        }
        _ => panic!("expected vector node"),
    }

    // Render and verify green pixels appear
    let viewport = figma_renderer::scene::AABB::new(
        glam::Vec2::ZERO,
        glam::Vec2::new(200.0, 200.0),
    );
    let output = figma_renderer::pipeline::render(&tree, &root, viewport);
    let pixels = output.to_pixels(200, 200);

    // Check center of shape for green fill
    let mut found_green = false;
    for y in 30..70 {
        for x in 40..80 {
            let idx = (y * 200 + x) as usize * 4;
            let (r, g, b, a) = (pixels[idx], pixels[idx+1], pixels[idx+2], pixels[idx+3]);
            if a > 128 && g > r && g > b {
                found_green = true;
            }
        }
    }
    assert!(found_green, "Vector shape with green fill should have green pixels in center region");
}

// ═══════════════════════════════════════════════════════════════════════
// PHASE 10: Gradient fills (linear + radial)
// ═══════════════════════════════════════════════════════════════════════

#[test]
fn p10_linear_gradient_fill() {
    let mut tree = DocumentTree::new();
    let mut clock = ClockGen::new(0);
    let root = tree.root_id();

    let rect_id = clock.next_node_id();
    let mut rect = Node::rectangle(rect_id, "GradientRect", 200.0, 100.0);
    rect.transform = Transform::translate(0.0, 0.0);

    // Linear gradient: red on left, blue on right
    // Gradient start/end are in normalized 0-1 space (Figma convention)
    rect.style.fills.push(Paint::LinearGradient {
        stops: vec![
            GradientStop::new(0.0, Color::new(1.0, 0.0, 0.0, 1.0)),
            GradientStop::new(1.0, Color::new(0.0, 0.0, 1.0, 1.0)),
        ],
        start: glam::Vec2::new(0.0, 0.5),
        end: glam::Vec2::new(1.0, 0.5),
    });
    tree.insert(rect, root, 0).unwrap();

    let viewport = figma_renderer::scene::AABB::new(
        glam::Vec2::ZERO,
        glam::Vec2::new(200.0, 100.0),
    );
    let output = figma_renderer::pipeline::render(&tree, &root, viewport);
    let pixels = output.to_pixels(200, 100);

    // Left side (x=10) should be red-ish
    let left_idx = (50 * 200 + 10) as usize * 4;
    assert!(pixels[left_idx] > 128, "Left side should have high red, got r={}", pixels[left_idx]);

    // Right side (x=190) should be blue-ish
    let right_idx = (50 * 200 + 190) as usize * 4;
    assert!(pixels[right_idx + 2] > 128, "Right side should have high blue, got b={}", pixels[right_idx + 2]);
}

// ═══════════════════════════════════════════════════════════════════════
// PHASE 11: 10,000 artboards (Rajat's bar)
// ═══════════════════════════════════════════════════════════════════════

#[test]
fn p11_ten_thousand_artboards() {
    let mut tree = DocumentTree::new();
    let mut clock = ClockGen::new(0);
    let root = tree.root_id();

    let start = std::time::Instant::now();
    for i in 0..10_000u32 {
        let id = clock.next_node_id();
        let mut frame = Node::frame(id, &format!("A{}", i), 1440.0, 900.0);
        frame.transform = Transform::translate((i % 50) as f32 * 1500.0, (i / 50) as f32 * 960.0);
        frame.style.fills.push(Paint::Solid(Color::new(1.0, 1.0, 1.0, 1.0)));
        tree.insert(frame, root, i as usize).unwrap();
    }
    let create_ms = start.elapsed().as_millis();
    eprintln!("10K artboards created in {}ms", create_ms);
    assert_eq!(tree.node_count(), 10_001);

    // Render a small viewport — should be fast due to viewport culling
    let viewport = figma_renderer::scene::AABB::new(
        glam::Vec2::ZERO,
        glam::Vec2::new(3000.0, 1920.0),
    );
    let start = std::time::Instant::now();
    let output = figma_renderer::pipeline::render(&tree, &root, viewport);
    let render_ms = start.elapsed().as_millis();
    eprintln!("10K artboards render: {} items in {}ms", output.item_count, render_ms);

    // Must create in <5s and render viewport in <500ms
    assert!(create_ms < 5000, "10K artboard creation too slow: {}ms", create_ms);
    assert!(render_ms < 500, "10K artboard render too slow: {}ms", render_ms);
}

// ═══════════════════════════════════════════════════════════════════════
// PHASE 12: Masks (essential for Apple website hero images)
// ═══════════════════════════════════════════════════════════════════════

// #[test]
// fn p12_mask_clips_child_to_shape() {
//     // A circle mask that clips a rectangular image to a circle.
//     // Pixels outside the circle should be transparent.
//     // This is how Apple renders product images with rounded masks.
//     //
//     // BLOCKED: mask system not yet implemented.
//     // Uncomment when NodeKind::BooleanGroup or mask properties are ready.
// }

// ═══════════════════════════════════════════════════════════════════════
// PHASE 13: Boolean operations (union, subtract, intersect)
// ═══════════════════════════════════════════════════════════════════════

// #[test]
// fn p13_boolean_subtract() {
//     // Subtract a circle from a rectangle to create a cutout shape.
//     // The Apple website uses boolean ops for icons and decorative shapes.
//     //
//     // BLOCKED: boolean operations not yet implemented.
//     // Uncomment when boolean_subtract(tree, shape_a, shape_b) is ready.
// }
