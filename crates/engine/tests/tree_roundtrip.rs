//! Round-trip tests for document tree operations.
//! Verifies that modifications can be reversed — the foundation for undo/redo.

use figma_engine::id::ClockGen;
use figma_engine::node::{Node, NodeKind};
use figma_engine::properties::*;
use figma_engine::tree::DocumentTree;

/// Insert a node, remove it, re-insert it — tree should be identical.
#[test]
fn insert_remove_roundtrip() {
    let mut tree = DocumentTree::new();
    let mut clock = ClockGen::new(0);
    let root = tree.root_id();

    let id = clock.next_node_id();
    let node = Node::rectangle(id, "rect", 100.0, 50.0);
    tree.insert(node.clone(), root, 0).unwrap();
    assert!(tree.get(&id).is_some());
    assert_eq!(tree.children_of(&root).unwrap().len(), 1);

    // Remove
    let removed = tree.remove(&id).unwrap();
    assert!(tree.get(&id).is_none());
    assert_eq!(tree.children_of(&root).unwrap().len(), 0);

    // Re-insert (simulates redo)
    tree.insert(removed[0].clone(), root, 0).unwrap();
    assert!(tree.get(&id).is_some());
    assert_eq!(tree.children_of(&root).unwrap().len(), 1);
}

/// Modify node position, then restore — values must match.
#[test]
fn move_roundtrip() {
    let mut tree = DocumentTree::new();
    let mut clock = ClockGen::new(0);
    let root = tree.root_id();

    let id = clock.next_node_id();
    let mut node = Node::rectangle(id, "rect", 80.0, 40.0);
    node.transform = Transform::translate(10.0, 20.0);
    tree.insert(node, root, 0).unwrap();

    // Save original position
    let orig_tx = tree.get(&id).unwrap().transform.tx;
    let orig_ty = tree.get(&id).unwrap().transform.ty;
    assert_eq!(orig_tx, 10.0);
    assert_eq!(orig_ty, 20.0);

    // Move
    tree.get_mut(&id).unwrap().transform.tx = 100.0;
    tree.get_mut(&id).unwrap().transform.ty = 200.0;
    assert_eq!(tree.get(&id).unwrap().transform.tx, 100.0);

    // Restore (undo)
    tree.get_mut(&id).unwrap().transform.tx = orig_tx;
    tree.get_mut(&id).unwrap().transform.ty = orig_ty;
    assert_eq!(tree.get(&id).unwrap().transform.tx, 10.0);
    assert_eq!(tree.get(&id).unwrap().transform.ty, 20.0);
}

/// Modify node size, then restore.
#[test]
fn resize_roundtrip() {
    let mut tree = DocumentTree::new();
    let mut clock = ClockGen::new(0);
    let root = tree.root_id();

    let id = clock.next_node_id();
    let node = Node::rectangle(id, "rect", 80.0, 40.0);
    tree.insert(node, root, 0).unwrap();

    let orig_w = tree.get(&id).unwrap().width;
    let orig_h = tree.get(&id).unwrap().height;

    // Resize
    let n = tree.get_mut(&id).unwrap();
    n.width = 200.0;
    n.height = 100.0;

    // Restore
    let n = tree.get_mut(&id).unwrap();
    n.width = orig_w;
    n.height = orig_h;
    assert_eq!(tree.get(&id).unwrap().width, 80.0);
    assert_eq!(tree.get(&id).unwrap().height, 40.0);
}

/// Change fill color, then restore.
#[test]
fn fill_roundtrip() {
    let mut tree = DocumentTree::new();
    let mut clock = ClockGen::new(0);
    let root = tree.root_id();

    let id = clock.next_node_id();
    let mut node = Node::rectangle(id, "rect", 50.0, 50.0);
    node.style.fills.push(Paint::Solid(Color::new(1.0, 0.0, 0.0, 1.0)));
    tree.insert(node, root, 0).unwrap();

    // Save original fills
    let orig_fills = tree.get(&id).unwrap().style.fills.clone();

    // Change fill
    tree.get_mut(&id).unwrap().style.fills = vec![Paint::Solid(Color::new(0.0, 0.0, 1.0, 1.0))];
    match &tree.get(&id).unwrap().style.fills[0] {
        Paint::Solid(c) => assert_eq!(c.b(), 1.0),
        _ => panic!("expected solid fill"),
    }

    // Restore
    tree.get_mut(&id).unwrap().style.fills = orig_fills;
    match &tree.get(&id).unwrap().style.fills[0] {
        Paint::Solid(c) => {
            assert_eq!(c.r(), 1.0);
            assert_eq!(c.b(), 0.0);
        }
        _ => panic!("expected solid fill"),
    }
}

/// Change text content, then restore.
#[test]
fn text_roundtrip() {
    let mut tree = DocumentTree::new();
    let mut clock = ClockGen::new(0);
    let root = tree.root_id();

    let id = clock.next_node_id();
    let node = Node::text(id, "label", "Hello", 24.0, Color::new(1.0, 1.0, 1.0, 1.0));
    tree.insert(node, root, 0).unwrap();

    // Save original text runs
    let orig_runs = match &tree.get(&id).unwrap().kind {
        NodeKind::Text { runs, .. } => runs.clone(),
        _ => panic!("expected text node"),
    };
    let orig_w = tree.get(&id).unwrap().width;
    let orig_h = tree.get(&id).unwrap().height;

    // Change text
    let n = tree.get_mut(&id).unwrap();
    if let NodeKind::Text { ref mut runs, .. } = n.kind {
        runs[0].text = "World".to_string();
        n.width = 100.0;
    }
    match &tree.get(&id).unwrap().kind {
        NodeKind::Text { runs, .. } => assert_eq!(runs[0].text, "World"),
        _ => panic!("expected text node"),
    }

    // Restore
    let n = tree.get_mut(&id).unwrap();
    if let NodeKind::Text { ref mut runs, .. } = n.kind {
        *runs = orig_runs;
    }
    n.width = orig_w;
    n.height = orig_h;
    match &tree.get(&id).unwrap().kind {
        NodeKind::Text { runs, .. } => assert_eq!(runs[0].text, "Hello"),
        _ => panic!("expected text node"),
    }
    assert_eq!(tree.get(&id).unwrap().width, orig_w);
}

/// Change node name, then restore.
#[test]
fn name_roundtrip() {
    let mut tree = DocumentTree::new();
    let mut clock = ClockGen::new(0);
    let root = tree.root_id();

    let id = clock.next_node_id();
    let node = Node::rectangle(id, "original-name", 50.0, 50.0);
    tree.insert(node, root, 0).unwrap();

    let orig_name = tree.get(&id).unwrap().name.clone();

    // Rename
    tree.get_mut(&id).unwrap().name = "new-name".to_string();
    assert_eq!(tree.get(&id).unwrap().name, "new-name");

    // Restore
    tree.get_mut(&id).unwrap().name = orig_name.clone();
    assert_eq!(tree.get(&id).unwrap().name, "original-name");
}

/// Text node color uses TextRun.color, not style.fills.
/// This test verifies the color path that caused a bug in session 5.
#[test]
fn text_color_roundtrip() {
    let mut tree = DocumentTree::new();
    let mut clock = ClockGen::new(0);
    let root = tree.root_id();

    let id = clock.next_node_id();
    let node = Node::text(id, "colored", "Hi", 16.0, Color::new(1.0, 0.0, 0.0, 1.0));
    tree.insert(node, root, 0).unwrap();

    // Save original runs (which contain color)
    let orig_runs = match &tree.get(&id).unwrap().kind {
        NodeKind::Text { runs, .. } => runs.clone(),
        _ => panic!("expected text node"),
    };
    assert_eq!(orig_runs[0].color.r(), 1.0);
    assert_eq!(orig_runs[0].color.g(), 0.0);

    // Change color via TextRun (the correct path for text nodes)
    let n = tree.get_mut(&id).unwrap();
    if let NodeKind::Text { ref mut runs, .. } = n.kind {
        for run in runs.iter_mut() {
            run.color = Color::new(0.0, 1.0, 0.0, 1.0);
        }
    }
    match &tree.get(&id).unwrap().kind {
        NodeKind::Text { runs, .. } => assert_eq!(runs[0].color.g(), 1.0),
        _ => panic!("expected text node"),
    }

    // Restore by replacing runs
    let n = tree.get_mut(&id).unwrap();
    if let NodeKind::Text { ref mut runs, .. } = n.kind {
        *runs = orig_runs;
    }
    match &tree.get(&id).unwrap().kind {
        NodeKind::Text { runs, .. } => {
            assert_eq!(runs[0].color.r(), 1.0);
            assert_eq!(runs[0].color.g(), 0.0);
        }
        _ => panic!("expected text node"),
    }
}

/// Multiple children — insert order preserved after remove + re-insert.
#[test]
fn child_order_preserved() {
    let mut tree = DocumentTree::new();
    let mut clock = ClockGen::new(0);
    let root = tree.root_id();

    let id_a = clock.next_node_id();
    let id_b = clock.next_node_id();
    let id_c = clock.next_node_id();

    tree.insert(Node::rectangle(id_a, "A", 10.0, 10.0), root, 0).unwrap();
    tree.insert(Node::rectangle(id_b, "B", 10.0, 10.0), root, 1).unwrap();
    tree.insert(Node::rectangle(id_c, "C", 10.0, 10.0), root, 2).unwrap();

    let children: Vec<_> = tree.children_of(&root).unwrap().iter().copied().collect();
    assert_eq!(children.len(), 3);
    assert_eq!(children[0], id_a);
    assert_eq!(children[1], id_b);
    assert_eq!(children[2], id_c);

    // Remove middle child
    tree.remove(&id_b).unwrap();
    let children: Vec<_> = tree.children_of(&root).unwrap().iter().copied().collect();
    assert_eq!(children.len(), 2);
    assert_eq!(children[0], id_a);
    assert_eq!(children[1], id_c);

    // Re-insert at position 1 (between A and C)
    tree.insert(Node::rectangle(id_b, "B", 10.0, 10.0), root, 1).unwrap();
    let children: Vec<_> = tree.children_of(&root).unwrap().iter().copied().collect();
    assert_eq!(children.len(), 3);
    assert_eq!(children[0], id_a);
    assert_eq!(children[1], id_b);
    assert_eq!(children[2], id_c);
}
