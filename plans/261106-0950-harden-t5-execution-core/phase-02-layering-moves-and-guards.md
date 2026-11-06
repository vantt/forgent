---
phase: 02
title: "Layering: the shared leaf modules leave Dispatch for the lowest layer that needs them, a guard keeps lower layers from importing Dispatch, and a no-undef pass joins the gate"
status: pending
depends_on: [01]
parallel: "none (wave 1 alone: import lines in about 35 production files and 60 tests)"
effort: ~0.5d
net_size: "Node +80 (no-undef script) / Rust 0 / tests +20 (guard +10, no-undef test +10); the moves are net 0"
---

# Phase 02 — Layering moves, A3 guard, A4 no-undef gate

## Context

Arbitration §2 received items O-1 and O-2 (settled), additions A3 and A4 (decision 62). Design principle 2: shared primitives live in the lowest layer that needs them; the manifest gives every one of these files class `infra`, so `test/architecture.test.mjs` cannot see the upward import (`docs/architecture-manifest.json`: all `infra`, `src/native/door.mjs` `kernel`). B-3 survived because nothing checks undeclared names (correctness P-3). Runs first among implementation phases so later phases start from the final paths.

Code read on `4b116c27e` (each module's own imports, then production importers):

| Module (lines) | Imports from dispatch | Production importers outside itself | Destination | Why there |
|---|---|---|---|---|
| `process-identity.mjs` (29) | none (`../../native/door.mjs`) | `run-supervisor/{cancel-registry,direct-launch}.mjs`, `state/hot-lock.mjs`, `holder-lock/hold-transport.mjs`, `setup/{holder-lock-checks,registrations}.mjs`, `runner/{lock-fence,gateway-control,session}.mjs`, `dispatch/{provider-capacity,run-lock,provider-credential-renewal,stop-processes-inside,assignment-runner}.mjs`, `scripts/run-rust-dev-host.mjs` | `src/native/process-identity.mjs` | T1 (`state`, `holder-lock`) needs it; client of the T0 door |
| `proof-helpers.mjs` (202) | none (`native/door.mjs`) | 16 files (run-supervisor 3, execution 2, dispatch 11) | `src/native/proof-helpers.mjs` | durable-file and agent-file door clients; T4 needs them |
| `dispatch-error.mjs` (24) | none | `run-supervisor/direct-launch.mjs`, `runner/work-dispatch.mjs`, `dispatch/{herdr-round,cwd-lock,transport,confinement/authority}.mjs` | `src/run-supervisor/dispatch-error.mjs` | lowest needer is T4 (`direct-launch`) |
| `cwd-lock.mjs` (99) | `dispatch-error` (moves) | `workflow/{case-runtime,case-bindings}.mjs`, `run-supervisor/direct-launch.mjs`, `execution/run.mjs`, `dispatch/{assignment-runner,reconciliation-planner}.mjs` | `src/run-supervisor/cwd-lock.mjs` | T4 `direct-launch` |
| `run-lock.mjs` (392) | `process-identity` (moves) | `run-supervisor/steps/settle-attempt.mjs`, `verbs/dispatch/recover.mjs`, `execution/{unit-control,run,unit-state}.mjs`, `dispatch/{settlement,assignment-runner}.mjs` | `src/run-supervisor/run-lock.mjs` | T4 settle step |
| `worker-artifacts.mjs` (76) | none | `steps/settle-attempt.mjs`, `dispatch/{settlement,visibility-session,assignment-runner}.mjs` | `src/run-supervisor/worker-artifacts.mjs` | T4 settle step |
| `stray-writes.mjs` (71) | none (`../worktree.mjs`) | `steps/settle-attempt.mjs`, `dispatch/{cli,assignment-runner}.mjs` | `src/run-supervisor/stray-writes.mjs` | T4 settle step |
| `trust-store.mjs` (639) | `proof-helpers` (moves) | `steps/cleanup-trust.mjs`, `dispatch/{herdr-round,worker-home,confinement/authority}.mjs`, `setup/{agent-cli-trust,registrations}.mjs` | `src/run-supervisor/trust-store.mjs` | T4 cleanup step |

All eight satisfy the arbitration condition ("imports nothing else from `src/runner/dispatch`") once the two with no dispatch import move first. "Below both layers" is read with principle 2: the two that T1 needs go to `src/native`; the six whose lowest needer is the run supervisor go to `src/run-supervisor`, which Dispatch already imports legally.

After the moves, `src/run-supervisor` still imports Dispatch at (plan fact 4): `steps/settle-attempt.mjs:8,9,12` (`settlement`, `run-result`, `provider-adapter`), `steps/finalize-home.mjs:6` (`confinement/authority`), `direct-launch.mjs:19` (`readSettledResult`, used at `:374,385,388`), `gate-kill-grace.mjs:9` (`RunnerConfigError`, thrown at `:58`).

## Requirements

- **Moves (O-1, O-2).** `git mv` each module to its destination; change every import line in `src`, `bin`, `scripts`, `test` in the same commit (L10: no re-export left at the old path); update `docs/architecture-manifest.json` rows, the census (`--write-census`; `process-identity.mjs` is hashed), `scripts/check-decision-citation-drift.baseline.json` if it names a path, and the doc lines that name the old paths (`docs/reading-map.md`, `docs/platform/component-boundary.md` Process Facts row, `docs/platform/process/spec.md`, `docs/platform/git/spec.md`; `rg -n "dispatch/(process-identity|proof-helpers|run-lock|cwd-lock|dispatch-error|stray-writes|worker-artifacts|trust-store)" docs` lists them all).
- **Two remaining upward imports resolved.** `direct-launch.mjs` takes the settled-result reader from its caller (the dispatch side passes `readSettledResult`; one parameter, no new module). `gate-kill-grace.mjs` throws the moved `DispatchError` with the same code `invalid-gate-kill-grace` (lead checks the doctor row and `test/run-supervisor` read the code, not the class; if a test asserts the class, it asserts the code instead and the commit says why).
- **A3 guard** in `test/architecture.test.mjs`: no file under `src/native`, `src/state`, `src/holder-lock`, `src/run-supervisor` imports `src/runner/dispatch/**`, except files under `src/run-supervisor/steps/` (named in the test with the reason: a step is Dispatch code the supervisor runs after the agent). About 10 lines next to the existing import scan (`:150-175`).
- **A4 no-undef pass.** One script in `scripts/` (name from `fgos convention name`) that parses every `.mjs` under `src` and `bin` with the acorn Node ships (`node --expose-internals`, `internal/deps/acorn/...`, acorn-walk alongside), builds scopes (imports, `var/let/const`, functions, classes, parameters, catch bindings, destructuring), and reports each read of a name that no scope or the Node/ES globals list declares, with `file:line`. One test in `test/scripts/` runs it and fails on any report; when the internal parser cannot be loaded it fails by name (`no-undef-parser-unavailable`, with the Node version), never passes. Every name it finds on today's tree is fixed in this phase (each a real defect like B-3, listed in the report) or, if a false positive, the scope rule is fixed.

## Files

**Create:** `src/native/process-identity.mjs`, `src/native/proof-helpers.mjs`, `src/run-supervisor/{dispatch-error,cwd-lock,run-lock,worker-artifacts,stray-writes,trust-store}.mjs` (all by `git mv`); the no-undef script and its test.

**Modify:** every importer listed above and the tests that import the old paths (about 60 files; `rg -l` per module); `src/run-supervisor/direct-launch.mjs` (`:19`, `:374-388`), its dispatch caller in `assignment-runner.mjs` (pass the reader); `src/run-supervisor/gate-kill-grace.mjs:9,58`; `test/architecture.test.mjs`; `docs/architecture-manifest.json`; the doc lines above; `packages/git/contracts/mutation-census.v1.json`.

**Delete:** the eight files at their old paths (moved, not copied).

**Tests to retire:** none. Tests that import the old paths are re-pointed, not retired.

## Net size

Node: moves 0, upward-import fixes ±5, no-undef script about +80. Rust 0. Tests: guard +10, no-undef test +10.

## Steps

1. Move in dependency order: `process-identity`, `proof-helpers`, `dispatch-error`, then `cwd-lock`, `run-lock`, `worker-artifacts`, `stray-writes`, `trust-store`; one commit per module or one for all, imports and manifest in the same commit as the move.
2. Fix the two upward imports; run the run-supervisor tests.
3. A3 guard; prove it red by re-adding one upward import locally (do not commit), then green.
4. A4 script and test; fix what it finds; record each in the report.
5. Census, doc lines, doc-health, citation drift.

## Validation (focused)

- FR `test/architecture.test.mjs test/scripts/doc-health.test.mjs test/scripts/check-decision-citation-drift.test.mjs` plus the new no-undef test.
- FR every test file that imports a moved module (`rg -l "native/process-identity|native/proof-helpers|run-supervisor/(dispatch-error|cwd-lock|run-lock|worker-artifacts|stray-writes|trust-store)" test`).
- `node scripts/git-one-door-scan.mjs --root .` → 0 undeclared.
- `rg -n "runner/dispatch/(process-identity|proof-helpers|run-lock|cwd-lock|dispatch-error|stray-writes|worker-artifacts|trust-store)" src bin scripts test docs` → nothing.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| A move breaks a dynamic import or a string path (e.g. a census row, a scripts allow-list, `test/process/one-door.test.mjs` lists) | M × M | `rg` the bare file names, not only import lines; the full gate runs before land. |
| No-undef finds many names on today's tree and the phase grows | M × M | Each find is either a real defect (fix, it is the point of A4) or a scope-rule gap (fix the script). If more than ~10 real defects appear, report them to the big lead before fixing; the gate test may land after them in the same phase. |
| Every other phase rebases on this one | H × L | It lands first and alone; it is mechanical. |

## Rollback

Revert the merge; re-activate the previous release. No on-disk format change.

## Done when

All eight modules at their destinations with no old path anywhere; A3 guard and no-undef test green in `npm test`; landed on fg-server2 with a direct-seat smoke; guide section written.

## Lead brief essentials

Moves by `git mv`, imports in the same commit, no re-exports. Guard exceptions only for `src/run-supervisor/steps/`. No-undef never passes silently. All plan.md lead rules apply.
