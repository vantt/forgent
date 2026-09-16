# Dispatch Operability Implementation Plan

**Track:** `dispatch-operability-implementation`
**Branch:** `implementation-track--dispatch-operability-evidence-attribution`
**Worktree:** `/home/vantt/projects/dispatch-operability-implementation`
**Base:** `main` at `57dfad49`
**Status:** I01-I05 merged. Next cell: I06 (Production-door and negative-route
proof matrix). See Product Gates below for per-cell merge commits and trace
links.

## Objective

Implement the accepted Dispatch Operability & Evidence Attribution design from
`plans/260914-dispatch-operability-evidence-attribution/` without adding a new
component and without broadening recovery authority.

The implementation must ship three committed capabilities:

- `agent-result-claim.v2`, effective execution contract persistence, and
  production-door proof for worker-result evidence.
- `RunResult` v2 plus `RunObservation` read projection, including deterministic
  legacy-v1 interpretation.
- Dispatch-owned `dispatch.runtime.inspect` and CAS-guarded
  `dispatch.runtime.reconcile`, with explicit negative-route proof that
  reconciliation cannot become recovery.

Deferred capabilities remain deferred: unified `fgos recover <subject>`,
provider/OOM prevention, cross-session authority, same-`taskKey` replay
semantic changes, BL1 auto-close, and arbitrary Git history protection.

## Read First

1. `docs/specs/reading-map.md`
2. `docs/specs/runner.md`
3. `docs/architect/agent-coordination/contracts/assignment-run-runresult.md`
4. `plans/260914-dispatch-operability-evidence-attribution/implementation-handoff.md`
5. `plans/260914-dispatch-operability-evidence-attribution/contracts/run-result-and-observation.md`
6. `plans/260914-dispatch-operability-evidence-attribution/phase-designs/inspection-surface-and-routing.md`
7. `plans/260914-dispatch-operability-evidence-attribution/phase-designs/evidence-attribution.md`
8. `plans/260914-dispatch-operability-evidence-attribution/phase-designs/guard-reconciliation.md`
9. `plans/260914-dispatch-operability-evidence-attribution/phase-designs/executor-contract-and-production-proof.md`
10. `plans/260914-dispatch-operability-evidence-attribution/requirements-traceability.md`

## Existing Source Map

| Area | Current files |
|---|---|
| Assignment contract, prompt, claim validation | `src/runner/dispatch/assignment.mjs`, `test/runner/assignment.test.mjs` |
| Run admission, dispatch execution, result writing | `src/runner/dispatch/assignment-runner.mjs`, `test/runner/assignment-runresult.test.mjs` |
| Worker artifact discovery | `src/runner/dispatch/worker-artifacts.mjs`, `src/runner/dispatch/brief.mjs` |
| DispatchPlan and effective policy | `src/runner/dispatch/plan.mjs`, `src/runner/dispatch/assignment-policy.mjs`, `test/runner/assignment-policy.test.mjs` |
| Inline execution contract and mutation gate | `src/runner/dispatch/execution-contract.mjs`, `src/runner/dispatch/assignment-normalizer.mjs`, `test/runner/execution-contract.test.mjs`, `test/runner/assignment-normalizer.test.mjs` |
| Standalone dispatch observation/recovery | `src/verbs/dispatch/show-run.mjs`, `src/verbs/dispatch/watch.mjs`, `src/verbs/dispatch/recover.mjs`, `src/runner/dispatch/recovery-planner.mjs`, `test/runner/dispatch-recovery.test.mjs` |
| Coordination recovery and read evaluators | `src/verbs/coordination/recover.mjs`, `src/runner/coordination/recovery-planner.mjs`, `src/runner/coordination/read-evaluators.mjs`, `test/runner/coordination-recovery-and-quorum.test.mjs` |
| CLI registry | `src/cli/command-registry.mjs`, `bin/fgos.mjs`, `test/cli/command-registry.test.mjs` |

## Execution Inputs

Use `fgos-plan-loop` on this track. Each cell must run in a private linked
worktree branch named `dispatch-operability-implementation--<cell-id>`.

Suggested actor policy for coordination request files:

| Actor | Executor | Tier | Persona |
|---|---|---|---|
| doer | `codex-cli` | `standard` | meticulous implementer |
| reviewer | `codex-cli` | `analytical` | skeptical reviewer |
| red-team | `codex-cli` | `analytical` | adversarial tester |
| fixer | `codex-cli` | `standard` | pragmatic fixer |

The D06 design review limitation must stay visible: design review evidence was
Codex-only role-separated, not cross-provider independent review. This
implementation plan does not claim provider diversity.

## GitNexus Gate

At plan-authoring time, `node .gitnexus/run.cjs analyze` failed with an
internal FTS index inconsistency. This plan is source-audited but not a
substitute for the repository's GitNexus rule.

Before a cell edits any function, class, or method, it must run GitNexus impact
for the target symbols and record direct callers, affected processes, and risk.
Before a cell commit, it must run GitNexus `detect_changes` and include the
result in the cell trace. If GitNexus remains unavailable, the cell cannot
claim the normal GitNexus gate passed; it must record the exact failure and add
a manual fallback audit listing touched symbols and callers.

## Product Gates

| Cell | Capability | Phase file | Status |
|---|---|---|---|
| I01 | `agent-result-claim.v2` single source for prompt and validation | `phase-01-agent-result-claim-v2.md` | merged `94d3d6fa` (2 fix rounds; reviewer/red-team clean after round 2; both rounds' contested findings independently re-verified and rejected — see [I01 trace](../../docs/architect/agent-coordination/verification/dispatch-operability-implementation/I01.md)) |
| I02 | Effective execution contract persisted pre-launch and inspectable | `phase-02-effective-execution-contract.md` | merged `f718d78b` (1 fix round; reviewer/red-team clean after fix — see [I02 trace](../../docs/architect/agent-coordination/verification/dispatch-operability-implementation/I02.md)) |
| I03 | RunResult v2, legacy-v1 interpretation, attribution dimensions | `phase-03-runresult-v2-and-attribution.md` | merged `8e8e7f65` (3 fix rounds, cap reached; production fixes independently proven, 2 documented non-blocking test-coverage residuals — see [I03 trace](../../docs/architect/agent-coordination/verification/dispatch-operability-implementation/I03.md)) |
| I04 | `dispatch.runtime.inspect` read model and CLI projection | `phase-04-dispatch-runtime-inspect.md` | merged `97c183cc` (3 fix rounds, cap reached; reviewer clean except 1 deferred label-consistency residual, red-team clean after round 3; Lead rejected a repeated host-routing/operation-catalog proof-gap escalation as out of this phase's declared scope — see [I04 trace](../../docs/architect/agent-coordination/verification/dispatch-operability-implementation/I04.md)) |
| I05 | `dispatch.runtime.reconcile` CAS guard/projection repair | `phase-05-dispatch-runtime-reconcile.md` | merged `36b97235` (2 full review/red-team cycles; cycle 1 fixed 5 HIGH incl. a fixture-only wrong-field bug and an unsafe liveness parser; cycle 2 (probe-based red-team) fixed a HIGH production-shape mismatch for the default action plus a path-traversal elevated to HIGH, resolved via architecture-advisor consult twice (TOCTOU design + wall-clock incarnation proof); 5 LOW/MEDIUM residuals documented, none blocking — see [I05 trace](../../docs/architect/agent-coordination/verification/dispatch-operability-implementation/I05.md)) |
| I06 | Production-door and negative-route proof matrix | `phase-06-production-door-proof.md` | planned |
| C00 | Integration docs, changelog, final review/red-team | `phase-07-integration-closeout.md` | planned |

## Capability Annotations

- I01: `code:implement`, `code:test`
- I02: `code:implement`, `code:test`
- I03: `code:implement`, `code:test`
- I04: `code:implement`, `code:test`, `docs:update`
- I05: `code:implement`, `code:test`, `docs:update`
- I06: `code:test`, `code:review`
- C00: `docs:update`, `code:review`

## Global Invariants

- `RunResult` is the only terminal Run truth.
- `RunObservation` is mutable, read-only, and never settles a Run.
- `ProviderOutcome` never competes with `RunResult`.
- `agent-result.json` is always a worker claim, not proof and not the
  normalized result.
- Git snapshots are correlation unless backed by declared positive coverage.
- Inspection never executes, forwards, or authorizes recovery.
- Reconciliation never kills, signals, retries, relaunches, resumes,
  reattaches, reassigns, admits, cancels, or takes over execution.
- Unit tests are required but cannot close a capability unless a
  production-door test proves the production path reaches it.

## Required Final Evidence

Before C00 can close:

- `npm test` passes.
- Focused test commands from every cell pass.
- `git diff --check` passes.
- GitNexus `detect_changes` has been run or its exact failure plus manual
  symbol/caller audit is recorded.
- `CHANGELOG.md` has an `Unreleased` entry for user-visible CLI/schema changes.
- `docs/specs/runner.md` and canonical agent-coordination contracts reflect
  only implemented, proven behavior.
- Negative production-route proofs cover forbidden reconciliation/recovery
  verbs through CLI, host operation catalog, callback/dynamic path, and
  subprocess/import attempts.
