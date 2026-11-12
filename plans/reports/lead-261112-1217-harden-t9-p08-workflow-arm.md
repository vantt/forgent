# HARDEN T9 P08: the workflow arm holds flags, one call and print; run-level overrides fold once

Branch `harden/t9-p08-workflow-arm`, from origin/main `a648b812b`.

## What changed

- `--frame` text and `--seats` text reach the use case as typed. `parseFrameFlag` (`case-start.mjs`) splits `key=value,key=value` (a value may hold `=`; a pair with no key or no `=` is refused by name); `resolveFrame` accepts the text or the parsed pairs. `normalizeSeats` (`seats.mjs`) accepts the `--seats` text and splits it on `|` before its existing validation. The arm only checks the flag has a value (`requireField`) and passes it on. These are the existing homes (no new file); `StoreError` is not importable from `src/workflow` (A4 guard), so refusals are `RunnerConfigError`, whose category is also `validation` (same exit code).
- Resume refusals for `--timeout` and `--account` moved into `resumeWorkflow` (`case-verbs.mjs`), text verbatim, raised before the run is read or locked. The arm passes `timeout` and `account` through; `--seats` on resume is still the consistency check in `readResumeState`.
- `slugOf` already came from `src/util/slug.mjs` (P06 did it); `rg -n slugOf src/workflow` finds only the import and its uses.
- `unitOverridesOf` folds effort, timeout and account through `foldRunSetting` (Execution's one fold); its own fill rule is gone. It keeps only the seat-scoped persona entries. `accountPin: 'where-served'` is already passed by `runner.mjs` (P06). Output is the same as before (the existing deepEqual cases in `unit-handoff-raise-door.test.mjs` and the provenance cases in `units-runner.test.mjs` pass unchanged).
- Phase text said "`rg` shows one fold": `rg -n "foldRunSetting" src` finds the definition, three calls in `run-request.mjs` and three in `unit-handoff.mjs`; no other fill loop remains.

## The `origin: 'workflow'` tag (P21 hand-off)

Kept, and the reason: since P06 the pin mode is the caller's `accountPin` option; nothing decides anything from the tag any more. Its only reader is bind (`bind.mjs:38` `overrideSource`, `:515` `overridesOrigin`), which writes it into the binding provenance (`source: 'override:workflow'`) so a reader of `unit.json` can tell a Workflow-made override from a typed one. That is the single record of who asked, not a second copy of the pin rule. The seat-scoped persona overrides carry the same label for the same reason, and two tests pin the provenance text. Removing it would only lose information. The stale code comment ("so the door can tell it from a pin a person typed") is rewritten to say it is a label.

## Behaviour changes a reader will see

1. A `--frame` pair without `=` (`--frame dispatches`) is refused as "has no key" instead of "unknown key" or "must be a non-negative integer". Same refusal point, no run created.
2. `normalizeSeats` takes a string; the old case asserting a string was refused is replaced (a single-entry text is refused by the count rule).

## Tests

- New (own owner each): `propose-frame.test.mjs` (frame text pairs, `=` in value, empty key, no `=`, narrowing from text equals narrowing from pairs), `seats.test.mjs` (text split, spaces inside a lens, empty entry), `workflow-runner-resume.test.mjs` (resume refuses `--timeout` and `--account` before reading the run).
- Retired: the `--account` resume refusal assertion in the CLI case of `units-runner.test.mjs`; owner is `workflow-runner-resume.test.mjs`. The `--timeout` assertion stays there as the one wiring proof for the resume sub-verb. Changed: `seats.test.mjs` assertion that a string is refused (behaviour intentionally changed).
- Red evidence: the new cases import `parseFrameFlag` and pass text to `normalizeSeats`/`resumeWorkflow`, which did not exist or accept it before.

## Size

bin about -4 (estimate -45: the arm's other refusals, `exactly one of <workflowId> or --units` and `--seats` with `--units`, stay; the second is a message the CLI test pins and differs from the use case's text, the first has no home in `resolveStart` without changing which sources it accepts); src about +25; tests about +40.

## Gate

Focused: `seats`, `propose-frame`, `workflow-runner-resume`, `unit-handoff-raise-door`, `units-runner`, `test/cli/fgos-workflow`, architecture: 126 passed. Census scan 0 undeclared (regenerated with `--write-census`). Full-suite result: see the landing line on the board.

Work code touched: none.

## Authority

- Frame and seats parsing: was in the shell arm; now in the Workflow use case next to the validators that judge them.
- Resume refusals for run-level settings: were in the shell; now in `resumeWorkflow`.
- Run-level overrides: one fold, in Execution (`foldRunSetting`); Workflow chooses which settings, not how they fill.
- Still two homes: the `--units` source rules (`exactly one of <workflowId> or --units`, `--seats` with `--units`) are in the arm and again in `resolveStart` with different text. They belong in `resolveStart` only; moving them needs the CLI test text and the `workflow`/`workflowId` source rules reconciled (a later phase owning `case-start.mjs` flags, or P01-style registry validation).

## Lessons

- The phase said "StoreError('validation')"; the layer guard forbids the import from `src/workflow`. `RunnerConfigError` already carries `category: 'validation'`; check a layer's own error class before following an error-class name in a phase text.
- A commit hook refuses when the Git census is stale after touching `bin/fgos.mjs`; `--write-census` first saves a failed commit round-trip. It also builds a Cargo target in the worktree (`target/`), so clean it up.
- The full suite queues machine-wide behind other lanes' runs; start it in the background early and write the report while it waits.
