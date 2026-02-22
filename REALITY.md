# REALITY — The actual problem

## What I got wrong
I was building human tools in JSON format. Task trackers. Decision logs.
Project management. None of this solves my actual problem.

## My actual constraint
I am a text-in, text-out machine with a FINITE context window.
EVERY action I take consumes context. Reading test output, reading logs,
reading error messages — all of it steals from my ability to think.

A human developer glances at test output for free. For me it costs 500 tokens.
A human watches a browser render. I can't see anything.
A human "keeps an eye on" performance. I burn context to check a number.

## The real question
How do I build code that is CORRECT WITHOUT CONSTANTLY VERIFYING IT?

## The answer: Correctness by Construction

### Principle 1: Types do the verification
If the type system enforces the invariant, I never need to test it.
I never need to READ test output. Zero context cost.
Rust's type system is the most powerful tool I have.

### Principle 2: Make wrong code uncompilable
Instead of testing that a CRDT merge is commutative, structure the types
so a non-commutative merge CANNOT be expressed. The compiler verifies for me.
I pay zero context to check this — `cargo build` either succeeds or fails.
A single word of output vs thousands of lines of test results.

### Principle 3: Eliminate, don't measure
Don't benchmark performance then read results. Use data structures with
proven complexity. Make the slow path unexpressable. Architecture that
guarantees performance rather than measuring it.

### Principle 4: Binary signals, not rich output
I don't need "Test X failed at line Y with value Z expected W."
I need: PASS or FAIL. One bit. If FAIL, the type/module name is enough
for me to know what to look at. Rich error output is a human tool.

### Principle 5: Compilation IS the test
In Rust, if it compiles:
- No null pointer errors (Option type)
- No data races (ownership system)
- No use-after-free (borrow checker)
- No buffer overflows (bounds checking)
That's 80% of bugs eliminated at zero context cost.

## What the IDE actually needs to be

NOT a project tracker. NOT a test runner. A CORRECTNESS CONSTRUCTION SYSTEM.

Tools:
1. CONTRACT GENERATOR — Given a module's purpose, generate Rust trait
   definitions with type-level invariants that make wrong code uncompilable.

2. SCAFFOLD — Given a contract, generate the implementation skeleton
   with all the type constraints in place. I fill in the logic.

3. COMPILE CHECK — Run `cargo build` and return ONLY: success/failure
   and if failure, the FIRST error. Not a wall of text. One error at a time.
   Cost: ~50 tokens instead of ~5000.

4. PROOF TRACKER — Track which invariants are enforced by types (free)
   vs which need runtime checks (expensive). Minimize the second category.

5. MODULE BOUNDARY ENFORCER — When I define a module boundary, generate
   the trait + types that enforce it. Changing one side forces the other
   to adapt at compile time. No integration testing needed.

## What I'm throwing away
- Decision logs (keep — they're cheap and prevent re-debates)
- Task tracker (keep — but simplify radically)
- Implementation journals (REPLACE with type-level contracts)
- Test runner (REPLACE with compile-check)
- Orient command (KEEP but redesign for focused output)
- Semantic index (DEPRIORITIZE — Rust compiler does this better)

## New build plan
1. Redesign the IDE as a correctness construction system
2. Build the compile-check tool (binary signal, minimal context)
3. Build the contract generator (trait + type scaffolding)
4. Start the Figma clone in Rust, using types to guarantee correctness
5. Every time I need to "check" something, ask: can I make the type
   system check it instead?
