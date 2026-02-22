
SESSION 5 — HUMAN INTERVENTIONS AND SELF-CORRECTIONS

INTERVENTION 1 (from session 4, carried forward):
  What: 'You claim victory on the pen tool when it does not work'
  Root cause: I assumed rendering worked without verifying. I have no eyes.
  Fix needed: Never claim a feature works without binary verification.
  Guardrail: MUST run ./ide check render after any rendering change. Need text render tests.

INTERVENTION 2 (this session):
  What: 'You are building a script wrapper, not an IDE. How does that remove the human?'
  Root cause: I was about to wrap Playwright (a human tool) in a shell script and call it an IDE tool.
  Real insight: The IDE must solve AI-specific problems (no eyes, no memory, context limits, sprawl).
  What AI needs that humans dont:
    - Deterministic pixel verification (I cant see — need binary signal from render tests)
    - State encoding in failing tests (I lose memory — failing test tells next-me what to build)
    - Constraint enforcement (I sprawl — need something that prevents editing outside current slice)
    - Property round-trip tests in Rust (verify undo/property changes without browser)

INTERVENTION 3 (this session):
  What: 'You are progressing without updating your states'
  Root cause: About to get compacted with unsaved working state.
  Fix needed: Save state BEFORE building. Journal before code.

BUGS FOUND AND FIXED THIS SESSION:
  1. set_node_fill/set_node_name had no undo support — added ChangeFill, ChangeName, ChangeText undo variants
  2. Text color change didnt render — set_node_fill only changed style.fills, not TextRun.color
  3. get_node_info returned wrong color for text nodes — was reading style.fills instead of TextRun.color

FEATURES ADDED:
  1. Text content editing (set_node_text + textarea in properties panel)
  2. Font size editing (set_node_font_size + number input)
  3. Text color now actually works (set_node_fill updates TextRun.color for text nodes)
  4. get_node_info returns node type and text content

NEXT (what to build when resumed):
  1. FIRST: Add Rust render tests for text nodes (catches silent rendering failures)
  2. FIRST: Add Rust unit tests for undo round-trips (catches missing undo support)
  3. THEN: Whatever Figma feature, verified by those tests
  4. Do NOT use browser screenshots for verification — use ./ide check render

PATTERN TO BREAK:
  - I built 4 Figma features before any IDE tool this session
  - I used Playwright screenshots (500-1000 tokens each) instead of binary render tests (20 tokens)
  - I forgot to save state before building
  - I was about to build a script wrapper instead of solving my real problem
