# I06 - Production Door Proof

**Capability:** `code:test`, `code:review`
**Status:** complete in branch closeout commit; pending merge to `main`

## Goal

Prove every committed capability through the real production path, and add
negative production-route proof that unsupported recovery semantics cannot be
reached through public doors or indirection.

## File Lease

Primary lease:

- `test/runner/assignment-runresult.test.mjs`
- `test/runner/dispatch-runtime-inspect.test.mjs`
- `test/runner/dispatch-reconciliation.test.mjs`
- `test/runner/coordination-*.test.mjs` only where required by ownership
  evidence
- `test/cli/dispatch-inspect.test.mjs`
- `test/cli/dispatch-reconcile.test.mjs`
- `test/cli/command-registry.test.mjs`

Expected new file:

- `test/runner/dispatch-operability-production-door.test.mjs`

## Required Positive Scenarios

| Scenario | Starting door | Required observation |
|---|---|---|
| Reviewer reports HIGH findings | Coordination operation | completed execution plus findings assessment; no provider crash fiction |
| Invalid blocked claim | Assignment dispatch | typed contract failure and preserved artifacts |
| Executor timeout/crash | Dispatch production door | distinct provider/resource/unknown failure family |
| Same task replay | Coordination run | `delivery.mode = replayed`; no claimed new execution |
| Concurrent outside dirt | isolated worktree dispatch | correlation without false attribution; substantive result preserved |
| Dead guard | inspect then reconcile apply | CAS single winner and no TTL-only deletion |
| Config field forwarding | config through selected adapter | test fails if field is dropped before adapter |
| Historical RunResult | inspect legacy result | `legacy-derived`; bytes unchanged |
| Effective permissions | real launched run | worker brief and inspect expose same effective contract |

## Required Negative Production-Route Scenarios

For every forbidden route below, test both CLI-facing projection and the
operation-catalog/host path where present.

- kill/signal worker, pane, or process;
- retry or relaunch a Run;
- resume or reattach execution;
- reassign or takeover work;
- admit a new Run;
- cancel semantic execution;
- alternate operation id aliases a forbidden recovery verb;
- callback, dynamic import, subprocess, or adapter path reaches semantic
  recovery from reconcile.

## Acceptance

- Direct evaluator tests alone are never cited as final proof.
- Production-door tests fail if a required field is dropped between
  DispatchPlan, effective execution contract, adapter launch, RunResult
  normalizer, and inspect output.
- Static no-import tests are supported by real public-boundary refusal tests.
- The D06 Codex-only review limitation remains documented.

## Required Tests

- `node --test test/runner/dispatch-operability-production-door.test.mjs`
- `node --test test/runner/dispatch-runtime-inspect.test.mjs`
- `node --test test/runner/dispatch-reconciliation.test.mjs`
- `node --test test/cli/dispatch-inspect.test.mjs`
- `node --test test/cli/dispatch-reconcile.test.mjs`
