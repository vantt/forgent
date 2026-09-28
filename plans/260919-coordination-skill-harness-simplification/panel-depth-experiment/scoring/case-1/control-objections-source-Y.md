# Architecture Critique: Attacking Proposal A

Proposal A is the strongest of the three because it leverages a core architectural truth: YAGNI (You Aren't Gonna Need It) driven by the actual consumer contract. It correctly observes that `terminal-render.ts` only consumes a binary `block.mode` (wrap vs pan), so exposing internal reasoning via a pluggable registry (Proposal B) adds no value to the caller. 

However, Proposal A's logic contains a fatal flaw: **it conflates the shape of the output with the architecture of the implementation.**

While the *consumer* only needs a boolean, the *producer* side (the classification logic itself) must handle an ever-expanding universe of CLI output formats. By keeping `looksStructured()` as a flat, ordered OR-chain of small named detectors within a single file, Proposal A guarantees that `block-classify.ts` will degrade into a monolithic "God Function." 

Here is why Proposal A fails at scale:

1. **Violation of the Open/Closed Principle**: Every new CLI layout (e.g., a new Claude Code prompt style, a new `git log` graph) requires modifying the core `looksStructured` function. It forces developers to touch a highly sensitive code path just to add support for a new tool.
2. **Regression Risk**: In a flat OR-chain, every new heuristic risks unintentionally catching prose or edge cases that should have fallen through to later detectors (or wrapped). There is no isolation.
3. **Cognitive Overload**: The file already mixes distinct domains: box-drawing ratio logic, Markdown pipe parsing, Claude Code menu cursors, and answer-summary pairs. As the list grows, understanding the interaction between these ad-hoc regexes and loop constructs becomes impossible.

Even if the output is just a boolean, the internal composition of these heuristics must be modular. The architecture must protect the core system from the endless churn of CLI format updates, which a flat OR-chain completely fails to do.

---

# op_026 — constraint-advocate risk ranking: block-classify.ts Phase 5 proposals

Role: constraint-advocate. Target: `[REDACTED]/web/src/block-classify.ts`.

## What I actually checked

Read the real file (222 lines). Current `looksStructured()` is 6 independent,
short-circuiting boolean checks — stable gutters, framing rules, box-char
ratio, markdown pipe columns, menu cursor+siblings, summary question/answer
pairs — each a small named pure function/constant with a comment documenting
the specific false positive it was tuned against. `classifyBlocks()` splits on
blank lines and calls `looksStructured()` per block. Everything operates on
`string[]` / `StyledLine[]`, no DOM/PTY/browser dependency.

Could not read forgentX's op_021/022/023 context refs (Read/Bash outside
`herdr-gateway` was permission-gated in this session with no one present to
grant it) — writes into this assignment's own `runs/` path were allowed, reads
elsewhere were not. Ranking below rests on the real code, not on those prior
artifacts.

## Ranking (highest risk → lowest)

**1. Proposal B — Pluggable Output Grammar / registry — highest risk**

- No demonstrated Phase 5 requirement for runtime-pluggable or third-party
  detectors. Adding one today is registry-shaped, plugin-boilerplate
  abstraction for a need that doesn't exist yet (YAGNI).
- The 6 existing checks are not clean orthogonal "grammars" — they're
  empirically patched special cases discovered against real false positives
  (e.g. arrows deliberately excluded from `BOX_CHARS` because a single `→` in
  a 3-line paragraph was making it pan; the menu check requires a cursor glyph
  *and* a sibling count precisely because descriptions vary in length and
  defeat the gutter check). Forcing these into independently-registered units
  risks losing the interaction context that makes each one correct.
- The module's own header comment states the domain is asymmetric-risk: a
  wrongly-panned structured block is "unrecoverable" for the user (no UI
  control to fix it), while a wrongly-wrapped prose block just matches old
  behavior. That means debuggability — being able to read top-to-bottom why a
  block classified the way it did — is a safety property here, not a style
  preference. Dynamic registration/dispatch is strictly harder to trace than
  a linear `if` chain.
- Risks quietly breaking the documented invariant that a verdict depends only
  on the block's own text (never viewport, never external state) if
  registration order or which detectors are active becomes configurable.
- Full rewrite/migration cost against 6 heuristics with no corresponding
  correctness or extensibility win shown.

**2. Proposal A — flat ordered OR-chain of small named detectors — low risk**

- This is, verified directly, the architecture already shipping. Adopting it
  as "the decision" costs nothing to implement.
- Only forward risk: as detectors accumulate, chain order/documentation
  discipline needs to hold so independent ORs don't quietly become
  order-dependent. Not an issue today — all 6 checks are independent,
  short-circuiting ORs.

**3. Proposal C — keep current architecture, cheaply unit-testable — lowest risk**

- Verified directly: `looksStructured`, `stableGutters`, `classifyBlocks` are
  pure functions over `string[]`/`StyledLine[]`. Already testable with plain
  fixtures, no browser/corpus needed — the stated benefit is true today, not
  aspirational.
- Zero-cost: no code change, so no new regression surface beyond what's
  already proven in production.

## Cross-cutting finding

A and C are not two independent designs — they produce the same code (the
code that already exists), differing only in which justification is foregrounded
(structural purity vs. testability). The real fork in the road is B (rewrite
into a plugin registry) versus not-B (A/C, status quo). Framing this as three
competing architectures overstates how many real options are on the table.

## Unresolved questions

- Was there a concrete Phase 5 requirement driving Proposal B (e.g. an actual
  need for externally-registered/user-defined layout signatures), or is it
  speculative? I found no evidence of one in the current file or its comments.
- Context refs op_021/022/023 were inaccessible this run — if they contain
  arguments for B's necessity that aren't visible in the code itself, they
  should be reconciled against this ranking.
