# Seat Binding doctor dry-bind row: phase lead report

Branch `seat-p09`, on top of phase 09 (`dc0af5da3`). Nothing pushed, merged or activated.

## 1. What changed

- **`seat-binding-dry-bind`** (`checkSeatBindingDryBind`, `src/setup/seat-binding-checks.mjs`): every registered Workflow (package roots and the project root, flat files and packaged directories), every unit with a capability, every seat the resolver yields, bound by `simulateUnitBindings` (the pattern code a run drives, ledger order, earlier seats published to later ones, no lease, nothing started). One crate exec per seat. The seat records now also carry `tier` and `loweredFrom`.
  - Session is fixed: `{ headless: true, herdrPresent: false }`. Chosen over reading the machine's herdr state so the row gives the same answer wherever it runs, and over binding twice (herdr and not) to keep it one exec per seat; the blind-steps row still binds both sessions.
  - A policy refusal fails the row (`tier-cell-missing` with the config line to change, `independence-unsatisfiable`, `pin-unsatisfiable`, `effort-unsupported`, and any refusal not listed below). Information: no pool configured (`no-candidate`, `headless-no-executor`), account state (`pool-unusable`, `pool-excluded`), a tool-executor capability (`not-an-agent-seat`), tiers lowered by `max-tier-cap` with the line that lowered them, and seats sharing a provider family.
  - Measured on this repo's committed config: 62 seats of 27 units, 408 ms in a debug host, passes with no info lines.
- **Deleted rows**: `model-policy-tier-coverage` (function, registration, two tests) and `workflow-pools-satisfy-independence` (function, evaluator, its tests moved onto the new row). Kept and adjusted: `tier-fallback` now also warns when a declared `tierFallback` lacks a tier of the six (`mini` included); `tier-vocabulary-dead-keys` already refuses the retired key on the project layer; `blind-steps-use-proven-pools` already runs on `explainSeat`; `executor-family-unique` untouched.
- **`workflow-pool-independence.mjs` was not unused**: the one Workflow definition reader, its roots and `withUnreadableDefinitions` live there and three checks use them. It is now `workflow-definition-files.mjs` with only those helpers plus `workflowUnitContract` (the one place a definition's unit becomes a unit contract, shared by the dry-bind and blind-steps rows). The reader now takes its file list from the loader's `workflowFilesIn` (exported), so packaged workflow directories are read; before this, a packaged workflow was invisible to every doctor check that read definitions.
- **Receipt audit, big-lead decision**: done at settle, in `run.mjs`, before the write gate. `auditLeaseReceipt` (provider-capacity) compares the receipt read from the attempt directory (worker-reachable) with the provider record of the lease it granted (`assignments["<provider>:<assignment>"]`, written under the lock in the same step as the receipt). A pass whose receipt the record does not back becomes a policy refusal `lease-receipt-mismatch`, nothing is committed, and the receipt is not persisted. Why here and not in the doctor row: the doctor binds without a lease, so it never sees a receipt; the gate runs before the attempt's own lease exists; settle is the one place that holds both, and it is also where the receipt first enters the durable record. One path, no second audit.

## 2. Tests retired or moved

- `model-policy-tier-coverage` (2 tests): behaviour removed with the row; "a seat with no allowed cell fails naming the line" in `seat-binding-dry-bind.test` now owns the missing-cell failure for the cells seats actually use.
- `workflow-pool-independence-check.test` became `seat-binding-dry-bind.test`: the panel, reviewed and debate independence cases keep their assertions on the new messages (`independence-unsatisfiable`, info for shared families); added no-pool as information, a missing cell, a `maxTier` lowering, a packaged directory, and the committed forgentX config passing.
- `yaml-parse-failures.test`: the independence row is now the dry-bind row; the "directory named dir.yaml cannot be read" case is replaced by an unreadable file (mode 000) plus a non-workflow directory that is ignored.
- `model-pool-checks.test` tier-fallback: now covers all six keys, a missing tier warning, and the existing skip warnings.
- New proofs: `auditLeaseReceipt` agrees, or differs by account, time or assignment (`provider-pool-lease.test`); a taken lease leaves a receipt the record agrees with (`run-provider-failover.test`).

## 3. Delta lines vs phase 09 end (`106a8abc8`)

| Part | Added | Removed | Net |
|---|---|---|---|
| Node src | 233 | 271 | -38 |
| Rust | 0 | 0 | 0 |
| Tests | 118 | 88 | +30 |

Cumulative since `22d02f15c`: Node src +470 / -319, tests +575 / -124.

## 4. Behaviour a reviewer must know

- `fgos doctor` row set: `-model-policy-tier-coverage`, `-workflow-pools-satisfy-independence`, `+seat-binding-dry-bind`. The registry doc is updated; the install how-to still names the old rows (docs phase).
- Expected refusals per workspace (to put in the landing report): mcp-skill-hub has no `prefer`, so its seats are information (no pool configured); mdview's `group-cognition:explore` is expected to be a capability with no usable pool or a single family, listed as information or an independence failure depending on its pool; neither is verifiable here without those configs.
- The receipt audit has unit proof and a run-level proof of the agreeing path only. A tampered receipt cannot be produced from the confined fixture worker (it cannot reach the attempt directory), so the refusal branch in `run.mjs` has no run-level test.
- Posture coverage (`executor-posture-coverage`) stays on `bind`: `bind` and `explainSeat` make the same crate call, and `explainSeat` only adds the walk's extra execs.

## 5. Verification

- 163 test files (`test/setup`, `test/seat-binding`, `test/runner/execution`, provider, dispatch and assignment-dispatch tests, `test/workflow`) each run alone: all pass except `active-release-drift-check.test` (1 fail, needs a release workspace build, red on the base). Architecture test green after the manifest rename.
- No Rust change. Full `npm test` not run. GitNexus not used (stale index).
