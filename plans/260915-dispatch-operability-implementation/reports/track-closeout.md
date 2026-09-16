# Dispatch Operability Implementation Closeout

**Track:** `dispatch-operability-implementation`
**Branch:** `implementation-track--dispatch-operability-evidence-attribution`
**Closeout commit:** branch closeout commit carrying this report; pending merge
to `main`
**Date:** 2026-09-16

## Result

I01-I05 were already merged. I06 and C00 are complete in the closeout commit.
The track now has production-door proof for Dispatch operability behavior,
operator documentation, canonical spec/contract updates, and an Unreleased
changelog entry.

The shipped slice remains intentionally narrow:

- `RunResult` v2 is the immutable terminal Run truth.
- `RunObservation` is a read-only projection.
- `fgos dispatch inspect --run|--assignment|--cwd` is read-only.
- `fgos dispatch reconcile plan|apply` is limited to guard/projection repair:
  `clear-cwd-lock`, `collect-result`, `clear-assignment-claim`, and
  `repair-projection`.
- Reconciliation does not kill, signal, retry, relaunch, resume, reattach,
  reassign, take over, admit, or cancel execution.

## Proof

Focused I06:

```sh
node --test test/runner/dispatch-operability-production-door.test.mjs
```

Result: 4 tests passed.

Focused phase proof:

```sh
node --test test/runner/agent-result-claim-contract.test.mjs test/runner/assignment.test.mjs test/runner/dispatch-brief.test.mjs test/runner/effective-execution-contract.test.mjs test/runner/assignment-runresult.test.mjs test/runner/execution-contract.test.mjs test/runner/run-result-v2.test.mjs test/runner/evidence-attribution.test.mjs test/runner/operation-choice.test.mjs test/runner/dispatch-runtime-inspect.test.mjs test/cli/dispatch-inspect.test.mjs test/cli/command-registry.test.mjs test/runner/dispatch-reconciliation.test.mjs test/cli/dispatch-reconcile.test.mjs test/runner/dispatch-recovery.test.mjs test/runner/dispatch-operability-production-door.test.mjs
```

Result: 352 tests passed.

Code-panel collision regression proof after syncing `main`:

```sh
node --test test/setup/skill-wrappers.test.mjs
```

Result: 109 tests passed.

Rust release host prerequisite:

```sh
cargo build --release --workspace
```

Result: passed.

Full suite:

```sh
npm test
```

Result: 6728 tests, 6719 pass, 0 fail, 9 skipped.

Whitespace check:

```sh
git diff --check
```

Result: passed.

## Production-Door Coverage

`test/runner/dispatch-operability-production-door.test.mjs` proves:

- the production `executeAssignment` door writes RunResult v2, persists the
  effective execution contract, forwards adapter args/config, and is readable
  through public `fgos dispatch inspect --run`;
- reviewer findings, invalid claims, provider crash, and timeout families stay
  distinguishable instead of collapsing into one failure fiction;
- public inspect interprets historical legacy and replayed RunResults without
  rewriting bytes;
- reconciliation recovery semantics are refused through CLI, command
  registry/operation boundary, dynamic import, apply-plan tampering, and a
  subprocess path.

## GitNexus Gate

GitNexus could not run from this linked worktree because the runner script is
absent.

Command attempted:

```sh
node .gitnexus/run.cjs detect_changes
node .gitnexus/run.cjs detect-changes
```

Both failed with:

```text
Error: Cannot find module '/home/vantt/projects/dispatch-operability-implementation/.gitnexus/run.cjs'
code: 'MODULE_NOT_FOUND'
Node.js v24.18.0
```

Manual fallback audit:

| File | Runtime symbol impact | Callers / flows | Risk |
|---|---|---|---|
| `test/runner/dispatch-operability-production-door.test.mjs` | New test file only; imports and exercises `executeAssignment`, public dispatch inspect CLI, and reconcile operation surfaces. | Test-only coverage of Assignment dispatch, RunResult storage, inspect, and reconcile refusal paths. | Low: no production symbol edits. |
| `test/setup/skill-wrappers.test.mjs` | Test fixture string only; no classifier logic change. | Keeps CE1 live-session hook coverage after this branch introduced a real `dispatch-operability-implementation` plan. | Low: test-only fixture collision fix. |
| `docs/specs/runner.md` | Documentation/spec fact update only. | Runner spec readers and future agents. | Low: documents shipped behavior and negative capabilities. |
| `docs/architect/agent-coordination/contracts/assignment-run-runresult.md` | Contract prose update only. | Agent-coordination contract readers. | Low: records proof file and recovery boundary. |
| `docs/how-to/operate-dispatch-runtime-inspection-and-reconciliation.md` | New operator how-to only. | Operators using public dispatch inspect/reconcile doors. | Low: guidance only. |
| `docs/enduser-docs-index.json` | Generated docs index update. | Docs discovery. | Low: includes the new how-to entry. |
| `CHANGELOG.md` | Release note only. | User-visible changelog. | Low. |
| `plans/260915-dispatch-operability-implementation/*` | Track status/report only. | Track closeout evidence. | Low. |

Manual conclusion: no production function, class, or method was edited in I06/C00
closeout. The only code change is a new production-door test and a test fixture
rename after syncing `main`.

## Docs

Canonical updates:

- `docs/specs/runner.md`
- `docs/architect/agent-coordination/contracts/assignment-run-runresult.md`
- `docs/how-to/operate-dispatch-runtime-inspection-and-reconciliation.md`
- `CHANGELOG.md`
- `docs/enduser-docs-index.json`

Markdown preview for the how-to:

```text
http://design-lap:7701/s/0c203db13072
```

## Deferred

This track does not ship:

- account/profile rotator for logical executors;
- provider/OOM prevention;
- unified `fgos recover <subject>`;
- cross-session recovery authority;
- same-`taskKey` semantic replay changes;
- parallel review/red-team schema fan-out.
