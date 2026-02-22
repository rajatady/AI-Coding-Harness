use fig_import::convert_fig;
use std::fs;

/// Test that the tree structure has the right shape for the WASM fig_import.rs converter.
/// Checks that pages have children, children have names, transforms exist, etc.
#[test]
fn test_tree_structure_coffee_shop() {
    let path = "../../imports/Coffee Shop Mobile App Design (Community).fig";
    if !std::path::Path::new(path).exists() { return; }
    let bytes = fs::read(path).unwrap();
    let result = convert_fig(&bytes).unwrap();

    let pages = result.document.get("children").unwrap().as_array().unwrap();
    assert!(pages.len() >= 1);

    // First page should have a name
    let page = &pages[0];
    assert!(page.get("name").and_then(|n| n.as_str()).is_some());

    // First page should have children (artboards/frames)
    let page_children = page.get("children").and_then(|c| c.as_array());
    assert!(page_children.is_some());
    let children = page_children.unwrap();
    assert!(!children.is_empty());

    // First child should have a type field (enum string)
    let first_child = &children[0];
    let node_type = first_child.get("type").and_then(|t| t.as_str());
    assert!(node_type.is_some(), "child should have a type field");
    println!("First child type: {:?}, name: {:?}",
        node_type, first_child.get("name").and_then(|n| n.as_str()));

    // Check transform format: should have x, y, rotation, scaleX, scaleY
    if let Some(t) = first_child.get("transform").and_then(|t| t.as_object()) {
        assert!(t.contains_key("x"), "transform should have x");
        assert!(t.contains_key("y"), "transform should have y");
        println!("Transform: x={:?}, y={:?}", t.get("x"), t.get("y"));
    }

    // Check that fillPaints colors are hex strings
    if let Some(fills) = first_child.get("fillPaints").and_then(|f| f.as_array()) {
        for fill in fills {
            if let Some(color) = fill.get("color").and_then(|c| c.as_str()) {
                assert!(color.starts_with('#'), "color should be hex: {}", color);
            }
        }
    }

    // Count total nodes recursively
    fn count_nodes(val: &serde_json::Value) -> usize {
        let mut count = 1;
        if let Some(children) = val.get("children").and_then(|c| c.as_array()) {
            for child in children {
                count += count_nodes(child);
            }
        }
        count
    }
    let total = count_nodes(&result.document);
    println!("Total nodes in tree: {}", total);
    assert!(total > 100, "should have many nodes");
}

#[test]
fn test_coffee_shop_fig() {
    let path = "../../imports/Coffee Shop Mobile App Design (Community).fig";
    if !std::path::Path::new(path).exists() {
        eprintln!("Skipping: {path} not found");
        return;
    }
    let bytes = fs::read(path).expect("read .fig file");
    let result = convert_fig(&bytes).expect("convert_fig should succeed");

    assert!(result.version > 0, "version should be > 0");

    // The tree should have children (pages)
    let children = result.document.get("children")
        .and_then(|c| c.as_array())
        .expect("document should have children (pages)");
    assert!(!children.is_empty(), "should have at least 1 page");

    println!("Coffee Shop: version={}, pages={}, images={}",
        result.version, children.len(), result.images.len());
}

#[test]
fn test_apple_fig() {
    let path = "../../imports/apple.fig";
    if !std::path::Path::new(path).exists() {
        eprintln!("Skipping: {path} not found");
        return;
    }
    let bytes = fs::read(path).expect("read .fig file");
    let result = convert_fig(&bytes).expect("convert_fig should succeed");

    let children = result.document.get("children")
        .and_then(|c| c.as_array())
        .expect("document should have children");
    assert!(!children.is_empty());

    println!("Apple: version={}, pages={}, images={}",
        result.version, children.len(), result.images.len());
}

#[test]
fn test_geeme_fig() {
    let path = "../../imports/GEE! ME 100 Characters Pack (Community).fig";
    if !std::path::Path::new(path).exists() {
        eprintln!("Skipping: {path} not found");
        return;
    }
    let bytes = fs::read(path).expect("read .fig file");
    let result = convert_fig(&bytes).expect("convert_fig should succeed");

    let children = result.document.get("children")
        .and_then(|c| c.as_array())
        .expect("document should have children");
    assert!(!children.is_empty());

    println!("GEE! ME: version={}, pages={}, images={}",
        result.version, children.len(), result.images.len());
}

#[test]
fn test_ios_kit_fig() {
    let path = "../../imports/iOS 16 UI Kit for Figma (Community).fig";
    if !std::path::Path::new(path).exists() {
        eprintln!("Skipping: {path} not found");
        return;
    }
    let bytes = fs::read(path).expect("read .fig file");
    let result = convert_fig(&bytes).expect("convert_fig should succeed");

    let children = result.document.get("children")
        .and_then(|c| c.as_array())
        .expect("document should have children");
    assert!(!children.is_empty());

    println!("iOS Kit: version={}, pages={}, images={}",
        result.version, children.len(), result.images.len());
}

#[test]
fn test_relume_fig() {
    let path = "../../imports/Relume Figma Kit (v3.7) (Community).fig";
    if !std::path::Path::new(path).exists() {
        eprintln!("Skipping: {path} not found");
        return;
    }
    let bytes = fs::read(path).expect("read .fig file");
    let result = convert_fig(&bytes).expect("convert_fig should succeed");

    let children = result.document.get("children")
        .and_then(|c| c.as_array())
        .expect("document should have children");
    assert!(!children.is_empty());

    println!("Relume: version={}, pages={}, images={}",
        result.version, children.len(), result.images.len());
}
