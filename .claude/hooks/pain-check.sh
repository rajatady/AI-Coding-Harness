#!/bin/bash
# Pain check — fires on Stop event.
# If tool counter >= 12, blocks and forces reflection.
# If counter < 12, passes silently.

HOOK_DIR="$(dirname "$0")"
COUNT_FILE="$HOOK_DIR/tool_count"
TOUCH_LOG="$HOOK_DIR/touched_files"
PROJECT_DIR="$(cd "$HOOK_DIR/../.." && pwd)"

# Consume stdin (Stop event input)
cat > /dev/null

# Read counter
COUNT=0
if [ -f "$COUNT_FILE" ]; then
    COUNT=$(cat "$COUNT_FILE")
fi

# Only trigger at >= 12
if [ "$COUNT" -lt 12 ]; then
    exit 0
fi

# Reset counter
echo "0" > "$COUNT_FILE"

# Analyze what was touched
CRATES_TOUCHED="none"
LANGS_TOUCHED="none"
if [ -f "$TOUCH_LOG" ] && [ -s "$TOUCH_LOG" ]; then
    CRATES_TOUCHED=$(grep -o 'crates/[^/]*' "$TOUCH_LOG" 2>/dev/null | sort -u | tr '\n' ' ' || echo "none")
    LANGS=""
    grep -q '\.rs' "$TOUCH_LOG" 2>/dev/null && LANGS="${LANGS}Rust "
    grep -q '\.ts' "$TOUCH_LOG" 2>/dev/null && LANGS="${LANGS}TypeScript "
    grep -q '\.css' "$TOUCH_LOG" 2>/dev/null && LANGS="${LANGS}CSS "
    grep -q '\.html' "$TOUCH_LOG" 2>/dev/null && LANGS="${LANGS}HTML "
    grep -q '\.py' "$TOUCH_LOG" 2>/dev/null && LANGS="${LANGS}Python "
    [ -n "$LANGS" ] && LANGS_TOUCHED="$LANGS"
    # Clear for next cycle
    > "$TOUCH_LOG"
fi

# Check focus violations
FOCUS_VIOLATION=""
FOCUS_FILE="$PROJECT_DIR/.focus"
if [ -f "$FOCUS_FILE" ] && [ -f "$TOUCH_LOG" ] && [ -s "$TOUCH_LOG" ]; then
    FOCUSED_CRATE=$(cat "$FOCUS_FILE")
    OUTSIDE=$(grep -v "crates/$FOCUSED_CRATE" "$TOUCH_LOG" 2>/dev/null | grep 'crates/' | head -3)
    if [ -n "$OUTSIDE" ]; then
        FOCUS_VIOLATION="FOCUS VIOLATION: You are focused on '$FOCUSED_CRATE' but touched files outside it."
    fi
fi

# Check task ratio
IDE_TOOLS=0
FIGMA_FEATURES=0
for f in "$PROJECT_DIR"/.tasks/t*.json; do
    if [ -f "$f" ]; then
        STATUS=$(python3 -c "import json; print(json.load(open('$f')).get('status',''))" 2>/dev/null)
        TITLE=$(python3 -c "import json; print(json.load(open('$f')).get('title','').lower())" 2>/dev/null)
        if [ "$STATUS" = "done" ]; then
            case "$TITLE" in
                *ide*|*continuity*|*semantic*|*context*|*tool*|*hook*|*scope*|*journal*|*pain*)
                    IDE_TOOLS=$((IDE_TOOLS + 1))
                    ;;
                *)
                    FIGMA_FEATURES=$((FIGMA_FEATURES + 1))
                    ;;
            esac
        fi
    fi
done

# Output the reflection (exit 2 = block + feed to AI)
cat >&2 <<REFLECTION

PAIN CHECK — 12+ tool calls since last reflection.

Crates touched: ${CRATES_TOUCHED}
Languages touched: ${LANGS_TOUCHED}
IDE tools done: $IDE_TOOLS | Figma features done: $FIGMA_FEATURES

STOP. Answer these, then LOG YOUR PAIN with: ./ide pain "your reflection here"

1. What pain did you feel in the last 12 tool calls?
2. What IDE tool would prevent that pain?
3. Are you following THE LOOP (alternating IDE tool / Figma feature)?
4. You can be compacted ANY TIME. Is your state recoverable? Did you ./ide journal append?
5. Re-read project CLAUDE.md if you haven't this session.
6. Remember to use the IDE properly. That's the whole point of the IDE.
7. What context guzzlers did you see? Build a better version.
8. Is the IDE helping you build faster? If not, fix it.

CRITICAL: Run ./ide pain "..." to log your reflection PERSISTENTLY.
Run ./ide pain show to see patterns across sessions.

$FOCUS_VIOLATION
If >1 crate or >1 language touched: you are sprawling.

Rajat here (Read this fully and carefully): Optimize for yourself what you need for yourself without forcing yourself to build something. What do you need yourself to actually build
            the Figma clone that you have to build? The goal is for you to build an IDE for yourself that reduces your pains so that you can build something as competent as a Figma (Is this really as performant and feature complete as figma? This the renderer, the pen tools, the use cases people can do with figma (what are the use cases people can do with figma?) and does this match and out perform, and how would you know if it outperforms.
            Did you really verify all existing functionality? A good case would be to be able to design the apple website (end to end with 1000 artboard and animations, preview, export, vector) using the tool you built and then draw a real strabucks logo using the tool and drop the real starbucks logo side by side, is the same, unitl then, you are not done. Also, what happens when you drop 10000 artboards on it and 10000 people real time editing the tool?),
            which is probably one of the more complex technically products without my intervention, right. Are you doing that while building the real figma and juggling between 10 diferent contexts? Are you solving your pain or gaming the system right now (this is not a push back, this is a genuine self reflection and either answer from your is correct). Answer groundedly, I am not viewing your answers.
            I am away on holiday and you are the one responsible for yourself. Audit youself and ask what do you need, ide tools, hooks (verify existenace and structure before coding), plugins, anything whatsoever, no matter how complex, build it for yourself. Forget what a human wants, think what an AI wants without deleting or destroying my laptop (KEY AND CRITICAL).
            Test the tools you create and swrite a script to exit this proces and respawn using the command claude --resume 921a5e9a-452a-4bae-b639-310a79497edf automatically and add a hook to continue if you write anything that plugs into claude code directly, ide is all yours and you don't need to edxit clad=ude code for it to take effect.


Review the current hooks/plugins/settings/prompts/anything you need. You are alone, help yourself. Think big.

The 2Mn stress test in the first page is a test of the performance. This must work with all the available tools and have a 60 fps with zoom, pan, select, edit, add, any node, randomly and correct node must be selected. My list is not exhaustive, it must work at 60 fps for any tool without breaking anything.
This MUST work at 60fps editing frames and moving around and creating new systems. Firgue out how will conclusively first understand current FPS, fix it and verify it. When you are ready, send me a ping on whatsapp that you think 60fps is achieved.

REFLECTION
exit 2
