# HARDEN T9 P29 - `refused` has one meaning

Branch `harden/t9-p29-refused-one-meaning`. Phase file `plans/261109-1718-harden-t9-host-surface/phase-29-refused-one-meaning.md`.

## What changed

1. **Invariant (red first).** Per-attempt `infrastructure` was already false for a refused seat (every `refused` is set together with outcome `policy-refusal`). The unit-level fact was not: a unit whose seat was refused before any brief was delivered ends `not-started`, which `infrastructure()` read as infrastructure; Workflow's own `.some(result.refused)` hid it. Fixed in Execution's outcome module (`infrastructure()` is false when any result carries `refused`). `run.mjs` is untouched, so there is no clash with P30. Proof: `test/cli/execution-outcome-exit-codes.test.mjs` (red before the fix: not-started plus a refused seat read true).
2. **Rerun decision.** `isRerunnable` (`src/workflow/store.mjs`) reads `infrastructure` only, or the legacy reader's answer when the entry lacks it. No Workflow check of a seat's `refused` is left in the rerun path. A legacy entry with a refused seat and no `infrastructure` reads terminal (`test/workflow/legacy-ledger-read.test.mjs`).
3. **One meaning.** Workflow's step/run outcome `refused` (written by `refuseUnit` when admission refuses a Unit) is now `admission-refused`. Writer: `src/workflow/runner.mjs`. Readers: the `step.fail` and `workflow.fail` folds in `store.mjs` read through `legacyStepOutcomeOf` (`legacy-ledger-read.mjs`), so ledgers on disk that carry `refused` read as `admission-refused` (tests in `workflow-store-ledger.test.mjs` and `legacy-ledger-read.test.mjs`). No other reader of that value existed in `src`, tests, CLI or docs. `unitFailureReason` still reads the seat's `refused` for the failure text. The outcome-module comment and the contract `infrastructure` row are updated.
4. **P23 leftover.** `case-projection.mjs` reads `NOT_STARTED_OUTCOME` from the outcome module.

Test change: the ledger refused-seat case now carries what Execution writes (`infrastructure: false`) instead of `infrastructure: true` plus a Workflow-side refusal check. The Workflow check is retired; the outcome test above owns the behaviour. Census regenerated (0 undeclared sites).

## Left alone

`src/workflow/case-runtime.mjs:112` also spells `'not-started'` as a literal. It is outside the named file list; flagged for a later pass.

## Authority

"Whether a refused seat can be rerun" was held twice: Execution's `infrastructure` and Workflow's own refused check. Now Execution only; Workflow reads the fact. The word `refused` was held by two layers with two meanings; now it is a seat fact only (Execution), and Workflow's outcome is `admission-refused`.

## Lessons

- A Workflow-side guard sitting beside a lower-layer fact hides a hole in the lower layer. Dropping the guard and writing the red test showed the not-started case it had been covering.
- The brief placed the colliding value in `store.mjs`; there it was only a comment, and the writer was in `runner.mjs`. Grep the writer of a value before naming the files.
- A heredoc that contained a regex with `.**`-like text tripped the privacy hook; use the Write tool for report text.
