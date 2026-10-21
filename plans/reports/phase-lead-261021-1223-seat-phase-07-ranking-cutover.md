# Seat Binding ranking cutover: phase lead report

Branch `seat-p07` (from `seat-verify-06`, b858a9c5b). Nothing pushed, merged or activated.

## 1. Behaviour changes

- `bind(ask, ctx, { walk })` asks the crate once per seat per call (stage 1 and 2 in one exec) and builds the binding from its answer. Node no longer ranks, filters, spreads or orders candidates.
- Node collects only facts: `launchView` (per executor: family, mechanism, skills, governance verdict, the invocations that can carry the posture with the CLI each reads a login from and the effort levels its CLI renders, the default invocation, `unnamedCarries`) and `accountView` (per pool: declared accounts, the CLIs each holds a login for). Quarantine, leases and probes stay the lease's business until the next phase.
- Effort: a cell's effort and an override's effort are in the binding (`reasoningEffort`, source `cell` / `override[:origin]` / `invocation-default`), in `bindingIdentity` and in the write-gate comparison. `effort-below-cell` and `effort-unsupported` (names what the invocation renders) are refusals. Rigor sets no effort.
- A hard pin `{executor, invocation}` unavailable is `pin-unsatisfiable`; a pin is never swapped for herdr. A scope-less override that names an executor is run-wide (skipped by a seat it cannot serve).
- Independence, soft spread and the walk after a failure (remaining entries of the failed family, then `tierFallback`) are the crate's. A seat that runs a later round keeps the executor, model and effort of its earlier round (`keptBindingOf`); a failure then refuses it `seat-continuity-unavailable`. A rotation to another account of the same candidate is `walk: { continuity, from, rotation }`.
- The unit's own `prefer` (`fgos run --provider`) is a crate input (`ask.unitPrefer`), listed ahead of the seat's `prefer`, source `unit-prefer`.
- Inline lead: only when the unit configured no candidate at all (`refusal.configured === 0`). Every other refusal with a lead present is named, never run inline. A tool-only seat is `not-an-agent-seat`.
- `explainSeat(ask, ctx)` returns the crate's ranked list, skips, explanation text and the walk chain; `fgos dispatch explain` prints the crate's explanation under `explanation` and gains `effort`.
- Intentional behaviour changes owned by the spec and the crate: an account pin selects its pool's survivors and can move the seat to that pool's family; a pin naming a pool with no account list is `account-pin-no-inventory`; the tier-cell refusal names the config line (variant C); the independence refusal is `independence-unsatisfiable`.

## 2. Deleted

`bind.mjs`: `walkBindings`, `listCandidates`, `nextCandidate`, `retrySameCandidate`, `walkOrder`, `prepare` (candidate filtering), `normalizeCandidates`, `findHerdrInvocation`, `resolveLaunch` (decision part), `executorOfEntry`, `poolUnusableReason`, `rejectionOf`, soft-spread and inline-escape logic, `readInventory` as a ranking input. `resolve.mjs`: `resolveTierModel`, `resolveTierCandidates`, `tierFallbackOf`. `account-pin.mjs`: `resolveAccountPin`, `PIN_REFUSES_SEAT`. `bind.mjs` exports end as `bind`, `explainSeat`, `bindingIdentity`, `identityOf`, `getProviderFamily`, `BIND_CONTRACT_VERSION`, `canApplyPosture`.

Consumers moved: `explain.mjs`, `blind-steps-proven-pools.mjs` (`explainSeat`), `run.mjs` (walk through `bind`), `assignment-runner.mjs` and the doctor row (`{ walk }`), `account-rotation.mjs` (`keptBindingOf`, continuity in `walkStateOf`). New helper `renderedEffortLevels` in `provider-adapter.mjs`; `seatBinding` in `seat-policy.mjs`.

Crate (additive, golden-covered): `Ask.unitPrefer`, `ExecutorFacts.unnamedCarries`, `Skip.model/pool`, continuity refuses an already-tried candidate, `account-pin-no-inventory`. Four new golden cases.

## 3. Tests retired or moved (new owning proof)

- `resolveTierModel` / `resolveTierCandidates` tests in `dispatch.test`, `dead-vocabulary-guard.test`, `dispatch-plan-policy.test`, `tier-cell.test`: the JS resolver is gone. Cell-at-tier, missing cell and unknown tier are owned by the crate golden vectors and `tier-fallback.test` ("a missing tier cell refuses by name"), `bind-tier-composition.test`; the cell effort reaching the binding is owned by `tier-cell.test` (new) and `bind.test`.
- `tierFallbackOf` tests in `tier-fallback-config.test`: config loading is the proof (`cfg.tierFallback` read directly); the copy-on-read test is retired with the function.
- `walkBindings` / `nextCandidate` / `retrySameCandidate` use in `tier-fallback`, `bind`, `account-rotation`, `run-herdr` tests: rewritten onto `explainSeat` and `bind(..., { walk })`, same assertions.
- `account-pin.test`: "pin never steers the executor" and the `account-pin-unsupported` skip are replaced by the crate's pool-survivor semantics (two tests rewritten, one new); `parse` stays.
- `tool-executor-seats` golden: the four `bind` entries are the new refusal; plan entries unchanged.
- `run-verb`, `dispatch-execute-effort`: refusal texts now the crate's.
- New proofs: hard pin, cell effort, no-effort default, override below cell, unsupported effort (declared and CLI), no inline with a lead present, continuity (bind), `keptBindingOf` / `walkStateOf`, debate rebuttal keeps its candidate (run level).

## 4. Delta lines against b858a9c5b

| Part | Added | Removed | Net |
|---|---|---|---|
| Node src | 476 | 723 | -247 |
| Rust crate + contract | 156 | 16 | +140 |
| Tests (incl. fixtures) | 260 | 393 | -133 |

`bind.mjs` 782 -> 547 lines.

## 5. Verification

- `cargo test -p fgos-seat-binding`: 8 unit + 5 golden pass.
- 83 test files run alone (`test/runner/execution/**`, the files that import bind, explain, dry-bind, the doctor rows, `test/seat-binding`, architecture): all pass except `test/setup/registrations.test.mjs` "Data Dictionary #7 names exactly the registered doctor checks", which names `runner-coordination-orgPolicy-shape` and was already red on the base (nothing in this change registers or renames a check).
- Full `npm test` not run (the big lead does that). GitNexus not used: index stale, degraded posture.

## 6. Concerns

- Debug host build: a bind is one 5-9 ms exec on the committed config.
- CHANGELOG and spec status lines wait for the docs phase, per plan.
- The doctor row `mutating-assignment-binding-snapshot` still replays `bind`; it is retired in the next phase.
