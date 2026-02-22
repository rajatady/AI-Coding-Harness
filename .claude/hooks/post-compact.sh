#!/bin/bash
# Post-compaction hook — fires when session resumes after compaction.
# Outputs critical recovery info that gets added to context.

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
RECOVERY_FILE="$PROJECT_DIR/.claude/hooks/recovery.md"

echo "CONTEXT WAS COMPACTED. You have lost your working memory."
echo ""
echo "IMMEDIATE ACTIONS:"
echo "1. Run: ./ide orient  (shows active task + journal)"
echo "2. Read the journal output carefully — it has your algorithmic state"
echo "3. Run: ./ide focus   (shows what crate you should be in)"
echo "4. Do NOT start coding until you understand where you were"
echo ""

if [ -f "$RECOVERY_FILE" ]; then
    cat "$RECOVERY_FILE"
fi

echo ""
echo "REMEMBER: Read project CLAUDE.md for THE LOOP rules."
echo "REMEMBER: IDE tools:Figma features ratio must be >= 1:1."

exit 0
