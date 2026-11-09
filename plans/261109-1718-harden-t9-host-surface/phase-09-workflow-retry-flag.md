---
phase: 09
title: "PROPOSED - AWAITING OWNER APPROVAL: Workflow reads the Execution retry flag instead of its own INFRASTRUCTURE_OUTCOMES"
status: pending
depends_on: ["07 landed (the fields exist)", "owner approval of COOK's four-step split (decision 81)"]
parallel: "T6 (Workflow layer); beside P08 (file-disjoint: this phase owns store.mjs and its test)"
effort: ~0.5d
net_size: "Node about -10; Rust 0; tests about +10 (estimate)"
---

# Phase 09 - Workflow reads the retry flag (COOK step 2) - proposed - awaiting owner approval

**Not started and not gating** until P07 is on main and the owner approved. The flag's name and meaning come from COOK's `unit-run-result` text via P07's fixtures; this phase reads them and invents nothing.

## Context

`src/workflow/store.mjs:262-264` decides whether a failed unit may run again by its own knowledge of Execution's outcomes:

```
const INFRASTRUCTURE_OUTCOMES = new Set(['execution-failure', 'not-started']);
const reachedVerdict = ...;
const isRerunnable = (p) => INFRASTRUCTURE_OUTCOMES.has(p.outcome) && !p.outOfScope?.length && !(p.results ?? []).some(reachedVerdict);
```

`isRerunnable` is the only reader of the set (`rg INFRASTRUCTURE_OUTCOMES src bin scripts test`: two lines, both in `store.mjs`). If Execution adds an outcome, this list silently drifts. After P07 the flag is on the result.

## Requirements

1. `isRerunnable` reads the retry flag of the result (and whatever else the contract text says Workflow may read), and `INFRASTRUCTURE_OUTCOMES` plus the `reachedVerdict` re-derivation go if the text makes them redundant. A record settled **before** the flag existed (an older ledger entry) is read by the rule the contract text states for old records; if the text is silent, step 1 stops and asks (unresolved question).
2. No other behaviour change: the same units are rerunnable for the same inputs, proven by the fixtures of P07 replayed through the Workflow reader.

## Files

**Create:** none.

**Modify:** `src/workflow/store.mjs`, `test/workflow/store*.test.mjs` (the owner of `isRerunnable`: find by `rg -l "isRerunnable|rerunnable" test`).

**Delete:** `INFRASTRUCTURE_OUTCOMES`, and `reachedVerdict`/`isVerdictResult` use here if nothing else reads them.

**Tests to retire:** none; cases that built a record with only an `outcome` string are rebuilt from P07's fixtures and keep their assertions.

## Red tests first

Replay every P07 fixture through `isRerunnable`: for each outcome the answer must equal today's answer (this passes today) **and** a fixture whose outcome string is new but whose flag says retry must be rerunnable (fails today: the string is not in the set).

## Net size

Node about -10; tests about +10.

## Steps

1. Re-read the contract text and P07's fixtures; list every reader of the set with `rg`.
2. Red replay; switch the reader; delete the set.
3. Replay a recorded old ledger (a case from `.fgos` of a past run, copied into a fixture) to prove old records still resolve.

## Validation (focused)

FR `test/workflow` store and resume tests, `test/workflow/*resume*`; land gate. COOK reviews.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| Old ledgers lack the flag and become non-rerunnable | M x M | step 3 replay; fallback rule from the text; otherwise the phase stops |

## Rollback

Revert the merge commit; Workflow returns to its own list; P07's fields stay (additive).

## Done when

Red then green; the set is gone; replay of old and new records agrees with the pre-change answers.
