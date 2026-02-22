//! Integration test that runs all built-in render verification tests.
//! `cargo test -p figma-renderer` → binary PASS/FAIL.

use figma_renderer::verify;

#[test]
fn render_smoke_tests() {
    let (passed, failed, new) = verify::run_all_tests();

    // New hashes are acceptable on first run — not a failure
    assert_eq!(failed, 0, "{} render tests failed", failed);

    // Print summary (captured by test runner, only shown on failure)
    eprintln!("Render tests: {} passed, {} new hashes", passed, new);
}
