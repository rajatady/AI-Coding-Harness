#!/bin/bash
# Silent tool counter — runs after every tool call.
# Just increments a counter and logs touched files. No output.

HOOK_DIR="$(dirname "$0")"
COUNT_FILE="$HOOK_DIR/tool_count"
TOUCH_LOG="$HOOK_DIR/touched_files"

INPUT=$(cat)

# Initialize counter if missing
if [ ! -f "$COUNT_FILE" ]; then
    echo "0" > "$COUNT_FILE"
fi

# Increment
COUNT=$(cat "$COUNT_FILE")
COUNT=$((COUNT + 1))
echo "$COUNT" > "$COUNT_FILE"

# Log touched files
FILE_PATH=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('file_path',''))" 2>/dev/null)
if [ -n "$FILE_PATH" ] && [ "$FILE_PATH" != "" ]; then
    echo "$FILE_PATH" >> "$TOUCH_LOG" 2>/dev/null
fi

# Also log bash commands that reference files
COMMAND=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('command',''))" 2>/dev/null)
if [ -n "$COMMAND" ]; then
    # Extract file paths from cargo/edit commands
    echo "$COMMAND" | grep -oE 'crates/[^ ]+' >> "$TOUCH_LOG" 2>/dev/null
fi

exit 0
