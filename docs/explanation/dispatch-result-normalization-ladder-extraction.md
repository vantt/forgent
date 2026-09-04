---
authoritative_for: extracting the dispatch worker result-assembly block out of executeExecutorCli (src/runner/dispatch/cli.mjs) into a dedicated pure helper, src/runner/dispatch/result-ladder.mjs — same reported/legacy-signal/inferred confidence ladder, no behavior change, no new fields, proven via failing-test-first evidence under the Iron Law
---

# The result-confidence ladder had no seams — now it does

`tsk-2tr` extracted the result-assembly block inside `executeExecutorCli`
(`src/runner/dispatch/cli.mjs`, previously inline around lines 516-529) into
its own pure helper module, `src/runner/dispatch/result-ladder.mjs`.

## Why this mattered

Before this item, the logic that decides how much to trust a dispatched
worker's own claim of completion — the confidence ladder — lived inline,
mixed into the same function that spawns the CLI subprocess, streams
output, and manages the pane/process lifecycle. That ladder already had
three real rungs, discovered piecemeal over separate prior items rather
than designed as one shape:

- a structured/reported signal takes priority when the worker's own output
  carries it;
- failing that, the legacy `[DONE]`/`[BLOCKED]` token signal (matched
  carefully — quoted or backtick-wrapped occurrences must never
  false-positive);
- failing that, an `unsignaled` fallback inferred purely from
  `headBefore`/`headAfter` git state around the dispatch.

Being inline meant this ladder had no independent unit test surface — any
test had to spin up the full `executeExecutorCli` path (subprocess spawn,
streaming, pane management) just to exercise a pure string/state decision.

## What shipped

- New `src/runner/dispatch/result-ladder.mjs`: a pure helper holding
  exactly the same three-rung ladder, called from `cli.mjs` in place of
  the old inline block.
- `cli.mjs` calls the new helper; no change to its own external behavior.
- Direct unit tests added to `test/runner/dispatch.test.mjs` exercising the
  ladder in isolation, without needing a real subprocess.

## What explicitly did not change

- No new `confidence` field was added — the item's own acceptance criteria
  named this a hard boundary ("chưa thêm confidence field nếu chưa có
  reader"): the ladder's three-way behavior is preserved exactly, no new
  telemetry surface without a consumer.
- Quoted/backtick `[DONE]` still never false-positives.
- A no-token worker still returns `outcome: "unsignaled"` with
  `headBefore`/`headAfter` populated, exactly as before.
- Herdr's own sentinel token stays distinct from the worker's own
  `[DONE]`/`[BLOCKED]` signal — the two were never allowed to collide
  before this extraction, and the refactor preserved that separation.

## Verification

`node --test test/runner/dispatch.test.mjs test/runner/herdr-spawn-adapter.test.mjs`
— both suites green, confirming the herdr-spawn adapter (a separate
consumer of the same result path, see
[`herdr-spawn-adapter-fresh-pane`](herdr-spawn-adapter-fresh-pane.md))
still sees identical output shape after the extraction.

This item's `approve` gate required Iron Law failing-test-first proof
(`--acknowledge-iron-law`, matched module `src/runner/dispatch/cli.mjs` and
the new `result-ladder.mjs`) — acknowledged with real evidence, not
auto-skipped.

## Scope

Pure extraction, same module family (`src/runner/dispatch/`). No dispatch
decision logic changed — this item is a maintainability move, not a
behavior change.
