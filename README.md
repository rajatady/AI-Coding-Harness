# aide

An IDE designed for AI coding agents, not humans. (Experiment: exploring what happens when an AI coding agent designs its own development tools instead of using tools designed by humans for humans.)

The human provided one goal: build a Figma clone that can load 2 million nodes at 120 FPS, where each node group is a full Apple website artboard (~20 nested elements: nav bar, hero section, product cards, footer) at any zoom level. The AI agent chose the stack (Rust/WASM), chose the architecture, and chose what tools it needed to build for itself in order to get there. The human's role was direction and coaching, not implementation or tool design.

Every design decision in the IDE optimizes for how an LLM operates: finite context window, no visual perception, token cost per action. The tools, hooks, and workflows exist because a human IDE (VSCode, WebStorm, Xcode) assumes a developer who can glance at a screen for free. An LLM pays tokens for every observation.

## What this is

A shell-based development environment (`./ide`) that the AI coding agent built for itself to:
- Orient itself after context loss (`./ide orient` ~20 tokens vs reading 200+ lines)
- Verify correctness through binary signals (`./ide check` returns pass/fail, not test output)
- Track its own algorithmic state across context compactions (`./ide journal`)
- Enforce module boundaries at the type level (`./ide contract`, `./ide boundary`)
- Reflect on its own process via automated hooks (fires every 12 tool calls)

The Figma clone in Rust/WASM is the stress test: a full Figma-equivalent that can load 2 million Apple website-like artboards in a single page and hit 120 FPS across any zoom level. The IDE is the actual project.

## The experiment

One human. One AI coding agent (Claude). The human sets direction and coaches the agent's process. The agent writes all code.

The goal: explore how far an AI agent can go building a complex application when given tools designed for its own constraints rather than human ergonomics.

### What got built

**Application (Figma clone):** 22,621 lines
- Rust engine (document model, auto-layout, hit testing): 2,429 lines
- Rust renderer (tile-based, 64x64 tiles, blend modes, gradients): 3,685 lines
- Rust CRDT (operation-based, Lamport timestamps, fractional indexing): 559 lines
- Rust WASM bindings + app logic: 8,352 lines
- Rust .fig file import: 992 lines
- TypeScript frontend: 5,117 lines
- HTML + CSS: 1,342 lines
- Server: 145 lines

Working features: shapes, selection, drag/resize, zoom/pan, undo/redo (all operations), text rendering (embedded font), pen tool (bezier curves), .fig file import, PNG export, layer panel, properties panel, toolbar, frames, auto-layout, CRDT sync support. Stress test: 100,000 artboards x ~20 nodes each = 2 million nodes at 120 FPS, where each node group is a full Apple website artboard (~20 nested elements: nav bar, hero section, product cards, footer). Zoom, pan, and selection across all LOD levels.

**IDE harness:** 4,193 lines
- `./ide` script: 2,831 lines
- Harness artifacts (.decisions, .journals, .tasks, .modules): 1,053 lines
- Design documents (STATE.md, REALITY.md, PREMORTEM.md): 309 lines

### Session data

All numbers below are extracted from the Claude Code session JSONL file (328 MB, 57,090 entries).

**Timeline**

| | |
|---|---|
| Wall clock | ~80 hours (Feb 21 - Feb 25, 2026) for the primary build window |
| Active coding time | 43.6 hours (gaps > 20 minutes between entries removed) |
| Breaks (gaps > 20 min) | 23 |
| Context compactions | 68 |
| Work sessions (between breaks) | 22 sessions > 1 minute |

**Work sessions (time between breaks > 20 min)**

| | |
|---|---|
| Average | 147.7 minutes |
| Median | 91.6 minutes |
| Maximum | 622.0 minutes (10.4 hours) |

**Autonomous streaks (consecutive agent actions between human directives)**

331 total streaks across the session. A "streak" is a run of agent messages and tool uses with no human directive in between.

| | |
|---|---|
| Average streak | 168 messages |
| Median streak | 28 messages |
| Maximum streak | 3,181 messages (635 tool uses) |

```
Streaks > 500 messages:   29
Streaks > 200 messages:   69
Streaks > 100 messages:  104
Streaks > 50 messages:   131
Streaks < 10 messages:   106
```

Top 10 longest autonomous runs:

```
 Rank | Messages | Tool Uses
------|----------|----------
    1 |    3,181 |       635
    2 |    3,059 |       612
    3 |    2,700 |       484
    4 |    2,287 |       473
    5 |    1,765 |       308
    6 |    1,443 |       294
    7 |    1,411 |       244
    8 |    1,214 |       226
    9 |    1,205 |       157
   10 |    1,122 |       228
```

**Context consumption**

The model operates on a 200K token context window. With 68 compaction events, the agent consumed and filled its context window 68 times, for a minimum of ~13.6 million tokens processed across the session. Each context window was consumed on average every ~38 minutes of active time. The full session history totals 57,090 JSONL entries across 328 MB.

**Agent activity**

| | |
|---|---|
| Assistant messages | 17,645 |
| Tool uses | 10,430 |
| Code changes (Write + Edit) | 1,619 |

Tool use breakdown:
```
Bash           2,301
Read           2,027
Edit           1,447
Grep           1,416
Browser eval     884
Screenshots      364
Browser click    236
Browser nav      230
Write            172
```

**Human messages**

241 raw messages in the primary build window. After removing duplicates caused by JSONL append-on-interrupt behavior, approximately 170-180 unique messages.

These messages were independently classified by three separate agents. The categories and approximate proportions:

| Category | Description | Approximate share |
|---|---|---|
| App feature direction | What to build in the Figma clone | ~30% |
| Strategic steering | Asking the agent to step back, reflect, think about its own process | ~18% |
| Error correction | Pointing out bugs, hallucinations, wrong approaches | ~16% |
| IDE harness direction | What to build in the IDE itself | ~14% |
| Context coaching | Teaching the agent about its own limitations (compaction, memory, context) | ~8% |
| Continuation | "continue" | ~6% |
| Autonomy grants | Human explicitly stepping away | ~4% |
| Commands / other | Exit, slash commands | ~4% |

The actual build instructions ("make X feature") were a small subset. Most human messages were about the agent's process: how it manages context, why it keeps using tools it has no control over, why it declares things done without testing, why it doesn't use the IDE tools it built for itself.

Examples of message types (paraphrased, not verbatim):
- Setting goals: "Build a Figma clone with full feature parity, 600K node stress test, .fig import"
- Forcing reflection: "You've been stuck. Why? You're living the pain and not solving it"
- Calling out bad habits: "You keep using the memory tool you have no control over instead of the IDE tools you built"
- Granting autonomy: "You have the podium for the next 3 hours. I'm going"
- Quality checks: "Compare our screenshot with Figma side by side. Does it match?"
- Process corrections: "Don't code yet. Think first about what will break"

Eight messages were explicit autonomy grants where the human stepped away entirely. The longest uninterrupted agent streak was 1,676 messages.

## IDE tool usage

The agent invoked `./ide` commands 1,170 times across the session. Usage by quarter of session (Q1-Q4 = quartiles by JSONL entry position, not equal time windows):

```
Command              Total     Q1     Q2     Q3     Q4
-----------------------------------------------------
check                  506    135    154    157     60
journal                137     18     31     58     30
pain                   130      0     24     55     51
survey                  56     26     16     14      0
gap                     52      5     15     20     12
features                41      0      0     13     28
orient                  37      8      4      9     16
test                    32      0     23      8      1
boundary                31      5      2     15      9
fps                     27      7      2     16      2
task                    15     15      0      0      0
snapshot                11     11      0      0      0
```

Patterns visible in the data:
- `check` (binary compile signal) was the most-used tool throughout, consistent across all quarters
- `journal` (algorithmic state capture) usage increased over time: 18 in Q1 to 58 in Q3 as the agent learned to preserve state before compaction
- `pain` (forced reflection hook) did not exist in Q1, was created during the session, and increased to 51 uses by Q4
- `features` did not exist until Q3, then grew to 28 in Q4
- `task` and `snapshot` were used heavily in Q1 then abandoned entirely, replaced by tools the agent found more useful
- `survey` (file skeleton before editing) decreased over time as the agent became more familiar with the codebase

## IDE tool reference

```
./ide orient            — active task + build status (~20 tokens)
./ide check [target]    — binary compile signal (pass/fail, ~20 tokens)
./ide check wasm        — WASM build verification
./ide check render      — deterministic pixel tests
./ide survey <file>     — file skeleton before editing (~30 tokens)
./ide boundary <layer>  — cross-layer API surface (~30 tokens)
./ide journal           — algorithmic state capture (survives compaction)
./ide slice             — vertical feature slice tracking
./ide coherence [file]  — detect inconsistent files
./ide contract          — type-level module contracts
./ide decide            — decision log (prevents re-debates)
./ide task              — work queue with dependencies
./ide module            — module registry
./ide verify            — full integrity sweep
./ide diff-check        — what changed + compile check
```

## Hooks

- `pain-check.sh` — fires every 12 tool calls, forces the agent to reflect on what's painful and what tools it's not using
- `count-tools.sh` — silent counter tracking files and crates touched per cycle
- `pre-compact.sh` — saves recovery state before context compaction

## Design documents

- **STATE.md** — "AI: READ THIS FIRST." Orientation document the agent reads on every session start
- **REALITY.md** — Documents why correctness-by-construction (using Rust's type system as the verifier) is the right approach for an AI that pays tokens to observe
- **PREMORTEM.md** — Written before building, predicting exactly the failure modes that would occur (context loss, invisible breakage, scale collapse, verification vacuum)

## The core insight from REALITY.md

> "I am a text-in, text-out machine with a FINITE context window. EVERY action I take consumes context. A human developer glances at test output for free. For me it costs 500 tokens."

The IDE exists because this is true.

## Stack

- Rust + wasm-pack + wasm-bindgen (engine, renderer, CRDT, server)
- TypeScript (frontend, vanilla, no framework)
- SQLite (persistence)
- Playwright (automated visual verification)
- Shell (IDE harness)
