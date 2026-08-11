# CONTEXT: return's blocked-friction hints at a .fgos/-dependent verify

Item: `tsk-4o9`. Feature boundary: when `return`'s own re-verify fails,
and the real captured output suggests the failure is caused by the
verify command depending on `.fgos/`'s presence (which a detached
worktree never has, per ADR0020), append an explanatory hint to the
`addFriction` call's `detail` field. Advisory only — never a new gate,
never blocks a currently-passing verify, never changes `return`'s pass/
fail outcome. Nothing else in this item's scope.

## Locked decisions

**D1 — Door determined: `fgos return`, not `fgos move`.** Per
RESEARCH.md: `branchHeadAtReturn` + the following `work.outcome.actual.
passed:true` event conclusively prove `tsk-3fj` went through `return`'s
own success path. Not a `tsk-280`-class bypass. This closes the item's
own original, primary question.

**D2 — Original red-verify symptom is stale, not live scope.** Per
RESEARCH.md: `44d5c4cc` (`tsk-49u`, 369 commits ahead of the scan's
`806ac1a` snapshot) already fixed `test/runner/dispatch.test.mjs` to
match the retired `coding-classify-intake` capacity. Currently green
(179/179). This item does not re-fix an already-fixed symptom.

**D3 — Real scope: an advisory hint on `return`'s blocked-friction
detail, keyed on the real failure OUTPUT, never the verify command
STRING.** User confirmed narrowing the item to this, after RESEARCH.md
found a verify-string pattern-match approach has real false positives
(4 of 6 items whose current verify contains `.fgos/` do not actually
depend on it: absolute paths, doc-content greps, exclusion globs).
Checking `runGoalCheck`'s already-captured `output` for `.fgos` +
`ENOENT`/`not found`/`no such file` — only ever evaluated on an ALREADY-
failing verify — has no equivalent false-positive risk: none of those 4
items' commands would ever produce that specific error text, since none
of them depend on `.fgos/`'s presence to succeed.

**D4 — Wiring point: both of `return`'s blocked paths in `bin/fgos.mjs`
(`:2472-2488` branch-source, `:2538-2551` main-source), each already
calling `addFriction` with a `detail` string.** A small pure helper
(e.g. `detachedWorktreeFgosHint(output)` in `src/runner/goal-check.mjs`,
the natural home next to `runGoalCheck`) returns a hint string or
`null`; `bin/fgos.mjs` appends it to `detail` when non-null. No new
event type, no new field on the item — the hint rides the same
`friction` record `addFriction` already writes.

## Scout evidence

- `tsk-3fj`'s own 24-event history (`readRawEvents`, filtered) — read in
  full, cited in RESEARCH.md.
- `tsk-5wz` (`tsk-3fj`'s parent) `seq 10387` — the human's own prior
  documentation of the ADR0020 constraint, cited verbatim in RESEARCH.md.
- `bin/fgos.mjs:2367-2557` (`return` case, both source paths) — read in
  full.
- `src/runner/goal-check.mjs:33-106` (`runGoalCheck`) — read in full,
  confirms `output` = combined stdout+stderr is already captured.
- `git log 806ac1a..HEAD -- test/runner/dispatch.test.mjs` — confirms
  `44d5c4cc` already fixed the specific symptom.
- `listWork` scan of every item's current `verify` field for the literal
  substring `.fgos/` — 6 hits, 4 confirmed false-positive-prone for a
  string-match approach (cited in RESEARCH.md).

## Canonical references

- `plans/reports/project-instability-scan-260809-1608-ship-faster-stability-report.md`
- `docs/decisions/0020-chan-fgos-khoi-worktree-worker.md` (ADR0020, the
  constraint this item's hint points readers at)

## Outstanding questions

None
