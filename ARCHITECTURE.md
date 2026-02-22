# ARCHITECTURE

## Philosophy
Build the simplest thing that gives continuity. Layer up. No premature tooling.
Every tool must earn its existence by solving a real problem I hit while building.

## Layers (bottom up)

### Layer 0: Structured Files (NOW)
Plain files that encode project knowledge in machine-readable format.
- STATE.md — project orientation (what, where, why, what next)
- .decisions/ — one JSON file per decision (queryable log)
- .tasks/ — work queue as JSON files (dependencies, status)
- .modules/ — one file per module (contract, status, tests, known issues)

### Layer 1: Shell Scripts (NOW)
`./ide <command>` — thin scripts that read/write the structured files.
- orient: Parse state files, output structured summary
- decide: Record a decision
- task: Manage work queue
- verify: Run checks and return structured results
- module: Register/query module contracts

### Layer 2: Semantic Index (LATER — when I need it)
Only build this when grep/glob becomes a bottleneck on the Figma clone.
Will be a standalone binary or script that builds a symbol index.

### Layer 3: MCP Server (LATER — when Layer 1-2 prove the concepts)
Wrap everything in MCP so tools are native to my workflow.

## Key Insight
The IDE is not a product. It's a survival system. Every feature must pass:
"Would this have saved me the last time I lost context?"

## Module Contract Format (.modules/*.json)
```json
{
  "name": "module-name",
  "purpose": "one line",
  "status": "not-started|in-progress|complete|verified",
  "public_api": [
    { "name": "fnName", "signature": "(...) => ...", "purpose": "..." }
  ],
  "dependencies": ["other-module"],
  "files": ["src/path/file.ts"],
  "tests": "tests/path/",
  "known_issues": [],
  "decisions": ["decision-id-1"]
}
```

## Decision Format (.decisions/*.json)
```json
{
  "id": "decision-id",
  "timestamp": "ISO",
  "question": "What was the question?",
  "choice": "What was decided?",
  "why": "Why this choice?",
  "alternatives_rejected": [
    { "option": "...", "why_not": "..." }
  ],
  "affects": ["module-name"]
}
```

## Task Format (.tasks/*.json)
```json
{
  "id": "task-id",
  "title": "...",
  "status": "pending|active|done|blocked",
  "blocked_by": ["other-task-id"],
  "module": "module-name",
  "subtasks": [],
  "acceptance": ["criteria 1", "criteria 2"],
  "outcome": "what actually happened (filled when done)"
}
```
