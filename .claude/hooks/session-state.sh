#!/bin/bash
# Session state — fires on ANY session start.
# Shows project state. No hardcoded file paths or test names.
# Discovers state dynamically. Works regardless of what the project looks like.

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_DIR"

# Consume stdin
cat > /dev/null

# 1. Does it compile?
BUILD=$(cargo check 2>&1 | tail -1)

# 2. Run ALL tests, summarize
TEST_OUTPUT=$(cargo test --workspace --exclude figma-wasm 2>&1)
TOTAL_PASS=$(echo "$TEST_OUTPUT" | grep "test result:" | awk '{for(i=1;i<=NF;i++) if($i=="passed;") print $(i-1)}' | awk '{s+=$1}END{print s+0}')
TOTAL_FAIL=$(echo "$TEST_OUTPUT" | grep "test result:" | awk '{for(i=1;i<=NF;i++) if($i=="failed;") print $(i-1)}' | awk '{s+=$1}END{print s+0}')

# 3. What changed recently?
RECENT=$(find "$PROJECT_DIR/crates" "$PROJECT_DIR/app/src" \( -name "*.rs" -o -name "*.ts" \) 2>/dev/null | grep -v target | grep -v node_modules | xargs ls -t 2>/dev/null | head -3)

echo "PROJECT STATE:"
echo "  Build: $BUILD"
echo "  Tests: $TOTAL_PASS passed, $TOTAL_FAIL failed"
if [ "$TOTAL_FAIL" -gt 0 ]; then
    echo "  FAILURES:"
    echo "$TEST_OUTPUT" | grep "FAILED" | grep "^test " | sed 's/^/    /'
fi
echo "  Recently modified:"
echo "$RECENT" | sed "s|$PROJECT_DIR/||" | sed 's/^/    /'

# 4. Current mission from journal (last entry)
JOURNAL="$PROJECT_DIR/.claude/journal.md"
if [ -f "$JOURNAL" ]; then
    LAST_ENTRY=$(tail -1 "$JOURNAL" | head -c 300)
    echo "  Mission: $LAST_ENTRY"
fi

# 5. Import status
FIG_COUNT=$(ls "$PROJECT_DIR/imports/"*.fig 2>/dev/null | wc -l | tr -d ' ')
JSON_COUNT=$(ls "$PROJECT_DIR/imports/"*-extracted/canvas.json 2>/dev/null | wc -l | tr -d ' ')
if [ "$FIG_COUNT" -gt 0 ]; then
    echo "  Imports: $FIG_COUNT .fig files, $JSON_COUNT converted to JSON"
fi

exit 0
