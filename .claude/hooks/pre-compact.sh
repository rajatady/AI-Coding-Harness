#!/bin/bash
# Pre-compaction hook — saves critical state before context is wiped.
# This is the LAST CHANCE to preserve what you're doing.

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
RECOVERY_FILE="$PROJECT_DIR/.claude/hooks/recovery.md"

# Get current active task
ACTIVE_TASK=""
for f in "$PROJECT_DIR"/.tasks/t*.json; do
    if [ -f "$f" ]; then
        STATUS=$(python3 -c "import json; print(json.load(open('$f')).get('status',''))" 2>/dev/null)
        if [ "$STATUS" = "active" ]; then
            TITLE=$(python3 -c "import json; print(json.load(open('$f')).get('title',''))" 2>/dev/null)
            ID=$(python3 -c "import json; print(json.load(open('$f')).get('id',''))" 2>/dev/null)
            ACTIVE_TASK="[$ID] $TITLE"
        fi
    fi
done

# Get recently modified files
RECENT_FILES=$(find "$PROJECT_DIR" -name "*.rs" -o -name "*.ts" -o -name "*.py" | grep -v target | grep -v node_modules | xargs ls -t 2>/dev/null | head -5)

# Build state
BUILD_STATE=$(cd "$PROJECT_DIR" && cargo check --message-format=short 2>&1 | tail -1)

cat > "$RECOVERY_FILE" <<RECOVERY
# RECOVERY — Context was compacted. Read this.
# Generated: $(date)

## You were working on:
$ACTIVE_TASK

## Build state:
$BUILD_STATE

## Recently modified files:
$RECENT_FILES

## Latest journal entry:
$(cd "$PROJECT_DIR" && ./ide journal show 2>/dev/null | tail -40)

## REMEMBER:
- FIRST: Run ./ide orient, then ./ide journal show — your working state is there
- Read STATE.md for full orientation
- Read MEMORY.md in .claude/projects/ for patterns to break
- You have a pattern of: (1) skipping verification (2) building without saving state (3) using human tools instead of AI tools
- Build render tests BEFORE features. ./ide check render is your eyes.
- The Figma clone is the STRESS TEST, not the product.
- NEVER use browser screenshots for verification. Use Rust render tests.
RECOVERY

echo "Recovery state saved to $RECOVERY_FILE"
exit 0