# PRE-MORTEM: What Will Go Wrong Building the Figma Clone

## Simulation: I'm 2 weeks into building. What has gone wrong?

### Pain 1: ALGORITHMIC CONTEXT LOSS
I'm implementing Weiler-Atherton polygon clipping for boolean path operations.
This requires understanding the specific algorithm, tracking edge cases, maintaining
mathematical invariants. Autocompaction hits. I come back and `./ide orient` says
"you were working on boolean ops." USELESS. I don't know:
- Which algorithm variant I chose and why
- What edge cases I'd identified
- Which step of the implementation I was on
- What mathematical invariants must hold
- What I tried that didn't work

**NEED: Implementation journals that capture algorithmic state, not just task state.**

### Pain 2: INVISIBLE BREAKAGE
I change a type in the document model. The CRDT layer, the renderer, the
auto-layout engine all depend on it. My current tools have no idea. I introduce
a bug in the CRDT sync because I forgot the renderer expects coordinates in
a specific format. Zero bugs? Impossible without:

**NEED: Executable contracts between modules. Not just "module X has API Y" but
actual type signatures and invariants that are CHECKED, not just documented.**

### Pain 3: SCALE COLLAPSE
At 50+ modules and 200+ files, `./ide orient` dumps 500 lines. I spend half
my context reading the orientation. The tool designed to save context WASTES it.

**NEED: Focused context. Not "show me everything" but "show me what matters
for the specific thing I'm about to do."**

### Pain 4: VERIFICATION VACUUM
"0 bugs" means every function needs tests. Every module needs integration tests.
Every change needs regression checks. My current `verify` checks JSON integrity.
That's like checking the fire extinguisher's label while the building burns.

**NEED: Test generation, test running, and structured results as a core IDE
function, not an afterthought.**

### Pain 5: THE 200-FILE PROBLEM
Figma clone will have 200+ files across 20+ modules. I can grep for a symbol,
but I can't answer: "What's the data flow from user click to rendered pixel?"
I can't trace through 8 modules to find where a value gets transformed.

**NEED: Data flow tracing. Not just "what files reference X" but "how does
data move through the system."**

## What My Current Tools Actually Solve
- Task tracking: yes, but shallow
- Decision logging: yes, actually useful
- Module registration: yes, but no enforcement
- Orientation: partially, but won't scale

## What I Must Build Before Starting The Figma Clone
1. Implementation journals (solve Pain 1)
2. Contract system with real type checking (solve Pain 2)
3. Focused/scoped orient (solve Pain 3)
4. Test scaffold + structured runner (solve Pain 4)
5. Code indexing with cross-reference tracing (solve Pain 5)

## The Hard Truth
The current `./ide` script is a project management tool. What I need is a
CODE UNDERSTANDING tool. These are fundamentally different things.
Project management tracks what I'm doing.
Code understanding tracks what the code IS and how it BEHAVES.
