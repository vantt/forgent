# HARDEN T9 P09: Workflow reads Execution's `infrastructure` and `evaluations[]`

Branch `harden/t9-p09-workflow-retry-flag`, from origin/main `a648b812b`, rebased onto `9854fda13`.

## What changed

- **Rerun reads the fact.** `isRerunnable` (`src/workflow/store.mjs`) takes the `unit.complete` entry's `infrastructure` (the fold now gets it because `runner.mjs` records what Execution handed up). `INFRASTRUCTURE_OUTCOMES` and `reachedVerdict` are deleted; `rg "INFRASTRUCTURE_OUTCOMES|reachedVerdict" src` finds nothing. A refused seat result stays terminal: `refused` is Workflow's own acceptance outcome, so that one case is carried explicitly in `isRerunnable`, not put in Execution's table.
- **Receipts from evaluations.** `receiptsFromResults` is replaced by `receiptsFromEvaluations` (`case-projection.mjs`): a map from `evaluations[]` to receipts, binding to milestone and subject digest stays Workflow's. A settle with no `evaluations` makes no receipt. The case gate (`case-gate.mjs`) settles with `evaluations: evaluationsOf([seatResult])`.
- **Verdict class from Execution.** `proposedAchievements` and `normalizeAcceptOutcomes` (`definition.mjs`) call `isVerdict` from `src/runner/execution/outcome.mjs`; the `['pass','findings']` literals are gone. `definition.mjs` is a kernel file, so `outcome.mjs` and its import `legacy-seat-read.mjs` (both pure, no I/O) moved from `domain` to `kernel` in `docs/architecture-manifest.json`, and the file header lists outcome.mjs as the third allowed leaf. The registry-load test copies the two extra files.
- **One legacy reader.** `src/workflow/legacy-ledger-read.mjs` (`legacyInfrastructureOf`) answers for entries with no `infrastructure`, using Execution's `infrastructure()`; nothing else reads the old shape. Backlog row `p-7y75kf54rh` files its deletion one release after landing.

## Behaviour

None changes for the same inputs. A unit whose entry says `infrastructure: true` is rerunnable whatever its outcome string is (new); an old entry with an outcome string only keeps today's answer.

## Proofs

- Red first (verified against origin/main sources): `workflow-store-ledger.test.mjs` (new outcome string rerunnable, `infrastructure: false` terminal, refused seat terminal) and `conductor-case.test.mjs` (a verifier result with no evaluation behind it proves nothing; with one it achieves the milestone).
- Old-shape replay: the existing `FAILED_ROWS` cases (no `infrastructure` field) pass through the legacy reader and keep their assertions; `legacy-ledger-read.test.mjs` owns the legacy answers. No test was retired. `case-admission-port.test.mjs` settle fixture now carries its evaluation.

## Gate

Focused: every workflow test plus every test that names a touched file (473 tests, 0 related fails after the registry list fix), architecture, doc-health. Census regenerated (0 undeclared). Full `npm test` (`/dev/shm/h9/full-122412.log`): 8787 tests, 3 fail: V7n addendum (known), document-identity citation drift (known, not ours), `commit-parent-death` (load flake, passes alone). No ERROR lines.

## Touched outside the phase's file list

- `src/workflow/runner.mjs`: two lines (emit `infrastructure` in `unit.complete`; the thrown-error fallback result says `infrastructure: true`). The ledger writer had to carry the fact; P08 does not own this file.
- `src/workflow/case-gate.mjs`: one import and one settle line.
- `test/state/domain-registry-compiled.test.mjs`: two files in the copied list.
- No Work code.

## Authority

- Which results are verdicts and which outcomes are infrastructure: held in Execution's outcome module; Workflow now reads both (store, projection, admission port, definition). Done.
- `refused` as an acceptance outcome stays Workflow's; the settle path and `isRerunnable` name it once each.
- `case-start.mjs:265` and `seat-binding-checks.mjs:146` still spell "pass/findings" in messages only; not a second list.
- The contract's "Today" column is stale for the fields now read (DOC/COOK, P16).

## Lessons

- A kernel file importing the outcome vocabulary tripped the layer test; reclassifying the two pure leaves was the honest fix, found by one architecture run before writing more code.
- A test that copies "only the files the registry imports" is a second inventory of the import closure; it failed on the first new import (a useful alarm).
- `nohup ... &` inside a background tool call returns at once; wait on the pid with `tail --pid`.
