# Constraint-advocate: block-classify.ts architecture

Role: constraint-advocate. Objective: which architecture for terminal-detail's
wrap/pan block classification best survives real test-coverage, release-cadence,
R24 (no UI control), and R25 (fail-closed asymmetry) constraints.

## What exists today (verified by reading the files, not assumed)

`web/src/block-classify.ts`:
- `classifyBlocks` splits a screen into blocks at blank lines, calls
  `looksStructured` per block.
- `looksStructured` is an **ordered OR-chain of independent, pure, synchronous
  heuristics** (stable gutters, framing rules, box-char ratio, markdown pipe
  columns, numbered-menu cursor, "Review your answers" Q/A pairs). Any one
  firing true -> `pan`. None firing -> `wrap`.
- No DOM, no async, no state carried across calls. Input is `string[]`/
  `StyledLine[]`, output is a plain value.
- `web/src/terminal-render.ts` is the only caller (`buildScreenFragment`),
  itself DOM-building but classification stays outside that boundary.

`web/test/block-classify.test.ts`:
- Unit-tests each heuristic in isolation (gutters, each `looksStructured`
  branch, explicit "rejects a single stray box char / arrow / plain numbered
  list" negative cases) plus `classifyBlocks` integration, a stability-across-
  polls check, and a width-independence check. No DOM/jsdom needed anywhere in
  this file.

`docs/specs/terminal-detail.md`:
- R24: "no control for it anywhere: no switch, no per-block override, nothing
  to discover or configure."
- R25: uncertain -> treat as R22 (pan/structured) — wrong-as-pan is invisible,
  wrong-as-wrap is unrecoverable, so the system must never guess wrap.
- Open Gaps section already admits: "Real miss rates have not been measured
  against a corpus" — i.e. there is no evaluation harness, and none is
  planned.
- Recent commits (0.1.18, 0.1.19) each added exactly one new heuristic
  (menu-cursor, then summary-pairs) in response to one observed real-world
  false-negative, each with its own version bump and its own test additions —
  this is the actual release cadence this code ships under.

## Constraint analysis

**Test coverage.** The current design is maximally cheap to test: every
heuristic is a pure function over strings, no mocks, no timers, no DOM. A
regression in one heuristic cannot silently change another's behavior because
they don't share state — only the OR-composition. This is what let the last
two fixes each land as an isolated function + isolated test.

**Release cadence.** Evidence shows this file is patched reactively, in small
increments, whenever a specific real Claude Code / CLI screen shape is found
wrongly wrapped. An architecture that requires retraining, reweighting, or a
shared threshold across heuristics (any scored/weighted/ML model) turns each
future fix into a global re-tune with no evaluation corpus to tune against —
the Open Gaps section already flags that no such corpus exists. The OR-chain
lets a fix be additive and reviewed/shipped alone, matching the cadence
already observed.

**R24 (no UI control).** Rules out, categorically, any design that exposes a
per-block override, a "smart wrapping" toggle, a confidence threshold setting,
or a "was this wrong? tell us" affordance surfaced to the operator — any of
those would themselves be the forbidden control. This also rules out designs
that would make a knob *tempting to add later* to work around low confidence
(e.g. a scored model naturally invites "let the user set the threshold").
Committing to a boolean OR-chain removes that temptation structurally: there
is no threshold to expose because there isn't one to begin with.

**R25 (fail-closed asymmetry).** The current OR-chain is the correct shape for
this rule specifically because OR is monotonic: one true heuristic cannot be
out-voted by several false ones. A scored/weighted or ML-style classifier
would let strong prose signals *cancel* a weak-but-correct structure signal —
exactly the R23-direction wrong guess R25 forbids. Any architecture change
that moves toward "confidence" or "score" composition needs to prove it
preserves this monotonic guarantee before it can be considered; by default it
does not.

## Recommendation

Keep the existing architecture: an ordered chain of independent, pure,
synchronous, OR-composed heuristics, each documented with the false-
positive/false-negative case it exists to catch, each covered by its own
positive and negative unit test, with no shared scoring/weighting mechanism.

Concretely, for whatever new heuristic or refactor is on the table in this
panel:
- Reject any design introducing a numeric score, weight, or confidence value
  composed across heuristics — it breaks the monotonic fail-closed guarantee
  (R25) and turns every future one-heuristic fix into a global re-tune (release
  cadence).
- Reject any design that surfaces classification state, a toggle, or an
  override to the operator, even an internal/debug one reachable from the
  production UI — direct R24 violation.
- Reject moving classification behind async/backend/stateful evaluation
  (server-side model, cross-poll memory) — it would need mocking/DOM/timing
  infrastructure this file currently avoids entirely (test coverage cost) and
  risks violating R26/R27 (decision must depend only on the block's own
  content, not width, and must not change while that content is unchanged).
- Accept: adding new pure heuristic functions to the existing OR-chain, each
  with a dedicated positive test and at least one adjacent negative test (the
  "rejects a single stray X" pattern already used for the box-char and arrow
  heuristics) — this is the only change shape that has actually shipped
  successfully twice under this cadence.

## Unresolved questions

- Whether the specific alternative architecture under panel debate falls into
  one of the rejected categories above was not stated in this assignment's
  context (Context refs: none) — this report evaluates the constraint space
  itself; whoever compares it against a concrete proposal should map the
  proposal onto the "reject" list before proceeding.
