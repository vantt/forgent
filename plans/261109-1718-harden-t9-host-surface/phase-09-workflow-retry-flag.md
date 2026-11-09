---
phase: 09
title: "PROPOSED - AWAITING OWNER APPROVAL: Workflow reads infrastructure and evaluations from the unit-run-result instead of re-deriving them; one legacy reader for old records"
status: pending
depends_on: ["07 landed (the fields exist)", "owner approval of COOK's four-step split (decision 81)"]
parallel: "T6 (Workflow layer); beside P08 and P24 (file-disjoint: this phase owns store.mjs, case-projection.mjs, the admission-port acceptance test and definition.mjs)"
effort: ~1d
net_size: "Node about -25 (re-derivations -40, legacy reader +15); Rust 0; tests about +20 (estimate)"
---

# Phase 09 - Workflow reads Execution's facts (COOK step 4; authority audit AU-09, AU-11) - proposed - awaiting owner approval

**Not started and not gating** until P07 is on main and the owner approved. Field names and meanings come from COOK's `unit-run-result` text (§3, §5, §7) via P07's fixtures; this phase reads them and invents nothing.

**Authority read, not moved:** "rerun a failed step" stays Workflow's acceptance decision, but it reads `infrastructure` instead of deriving it; "which results are verdicts" is read from `evaluations[]`.

## Context

Workflow re-derives Execution's facts in four places (audit §1, AU-09, AU-11; COOK §7):

| Site | Re-derivation |
|---|---|
| `src/workflow/store.mjs:262-264` | `INFRASTRUCTURE_OUTCOMES = new Set(['execution-failure', 'not-started'])`, `reachedVerdict`, `isRerunnable` |
| `src/workflow/case-projection.mjs:290-303` | `receiptsFromResults` decides which results are verdicts (verify `pass` gives a verify receipt; a verdict seat with `pass`/`findings` gives a verdict receipt) |
| `src/workflow/case-admission-port.mjs:70-90` | `proposedAchievements`: only `pass`/`findings` produce |
| `src/workflow/definition.mjs:97` | only `pass`/`findings` may be accepted |

The gate's own exit-code classifier (`case-gate.mjs:114-115`) is P05's; `foldUnitOutcome` is P07's. If Execution adds an outcome, these lists drift silently.

## Requirements

1. **`isRerunnable` reads `infrastructure`.** `INFRASTRUCTURE_OUTCOMES`, `reachedVerdict` and the outcome-string test go. A verify that timed out or could not run (P05) is rerunnable through the same field (owner 83).
2. **Receipts from `evaluations[]`.** `receiptsFromResults` becomes a map from `evaluations[]` to receipts (binding them to milestones and subject digests stays Workflow's). `proposedAchievements` and `definition.mjs` read the verdict class from Execution's outcome module (P20) instead of the literal `['pass','findings']`.
3. **Old records (COOK §5, decision 1).** A ledger entry with no `infrastructure` or no `outOfScope` reads as **not known, never a pass**. One legacy function, in one legacy module (precedent `src/runner/execution/legacy-seat-read.mjs`), applies today's derivation to such entries; it is the only reader of the old shape and is deleted one release after this phase lands (all machines upgrade together). The deletion is filed as a backlog row (id from `fgos identity mint backlog`) when this lands.
4. No other behaviour change: the same units are rerunnable and the same receipts are produced for the same inputs, proven by P07's fixtures replayed through the Workflow readers.

## Files

**Create:** none if an existing legacy module can hold the reader; otherwise one `src/workflow/legacy-ledger-read.mjs` (manifest row).

**Modify:** `src/workflow/store.mjs`, `src/workflow/case-projection.mjs`, `src/workflow/case-admission-port.mjs` (`proposedAchievements` only; P06 already moved its depth check), `src/workflow/definition.mjs`, their owning tests (`rg -l "isRerunnable|receiptsFromResults|proposedAchievements" test`), `docs/architecture-manifest.json` (only if a file is created).

**Delete:** `INFRASTRUCTURE_OUTCOMES`, `reachedVerdict`, the `['pass','findings']` literals in the four sites, and the `isVerdictResult` use in Workflow if nothing else reads it.

**Tests to retire:** none; cases that built a record with only an `outcome` string are rebuilt from P07's fixtures and keep their assertions; the old-shape cases become the legacy reader's owning test.

## Red tests first

Replay every P07 fixture through `isRerunnable` and `receiptsFromResults`: for each outcome the answer must equal today's answer (passes today) **and** a fixture whose outcome string is new but whose `infrastructure` is true must be rerunnable (fails today: the string is not in the set). One old-shape entry with no `infrastructure` and outcome `pass` must not be read as a pass by any reader other than the legacy one.

## Steps

1. Re-read the contract text and P07's fixtures; list every reader of the four sites with `rg`.
2. Red replay; switch the readers; delete the lists.
3. Legacy reader; replay a recorded old ledger (copied from a past run's `.fgos` into a fixture) to prove old records still resolve.

## Validation (focused)

FR `test/workflow` store, projection, admission-port, definition and resume tests; land gate. COOK reviews.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| Old ledgers lack the field and become non-rerunnable | M x M | the legacy reader keeps today's answer; step 3 replay |
| The legacy reader outlives its release | M x L | backlog row filed at landing with the release id |

## Rollback

Revert the merge commit; Workflow returns to its own lists; P07's fields stay (additive).

## Done when

Red then green; `rg -n "INFRASTRUCTURE_OUTCOMES|reachedVerdict" src/workflow` nothing; replay of old and new records agrees with the pre-change answers.
