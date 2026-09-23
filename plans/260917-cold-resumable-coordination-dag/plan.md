# Cold-Resumable Read-Only Coordination DAG

**Track:** `cold-resumable-coordination-dag`

**Status:** READY FOR IMPLEMENTATION

**Date:** 2026-09-17

**Design authority:** [DAG Request Scheduler proposal](../../docs/architect/agent-coordination/proposals/dag-request-scheduler.md)

## Objective

Make `fgos-plan-loop` and `fgos-code-panel` materially faster for their real
first-pass shape by supporting cold-resumable DAG scheduling of **read-only,
individual CoordinationProtocol operation nodes**. A fresh process must recover
the declared graph and its derived node outcomes through `coordination show` and
`coordination chain`, then continue only through an equivalent request or an
explicitly legal continuation.

The primary live proof is:

```txt
produce -> {review, red-team}
```

where review and red-team overlap after the producer settles, and a fresh
process can reconstruct every node and resume correctly after an interrupted
invocation.

## Locked Scope

Included:

- immutable DAG request declaration, fingerprint, and node identities;
- schema-versioned session persistence, replay, `show`, and `chain` projection;
- request equivalence/continuation gate on resume;
- complete request dependency extraction (`dependsOn`, `$ref`, ledger lineage,
  authorization pairing, and all supported step/branch fields);
- dynamic ready-frontier scheduling for read-only individual operation and
  required ledger nodes;
- typed scheduler outcomes distinct from RunResult and session state;
- capacity deferral, typed known refusal, integrity throw behavior, and
  read-only shared-cwd overlap attribution;
- planned-mode code-panel/plan-loop composition and cold-resume live proof.

Excluded from this track:

- mutating DAG nodes, per-node worktrees, mutation takeover, or cross-process
  mutation ownership; legacy sequential mutation remains unchanged;
- fan-out as a DAG node; existing `dispatchResearchFanOut` behavior remains
  outside DAG mode until it has typed branch outcomes and node-settlement
  semantics;
- a daemon, queue, priority/fairness policy, polling/backoff worker, or a new
  Work lifecycle;
- inferred DAG declaration/backfill for old sessions;
- automatic repair of dead claims or the unexplained multi-worktree incident.

## Architecture Invariants

1. DAG state is derived from immutable declaration plus existing
   Assignment/Run/RunResult/session evidence; it is not a new persisted task
   lifecycle.
2. A DAG session declaration is written atomically before any node
   materializes. A resume may not relabel, reorder, remove, add, or change the
   semantics of an already-declared node except through a separately declared
   continuation contract.
3. A dependency means `settled`: predecessor evidence is linked and readable;
   it does not mean RunResult success.
4. Every execution continues through existing Assignment -> DispatchPlan -> Run
   -> RunResult doors. The scheduler owns neither executor spawning nor result
   truth.
5. Only `concurrency-cap` is deferrable. Integrity/missing-definition/missing-
   session errors throw after invocation-owned work settles. Other allowed,
   typed node-door refusals preserve their original error evidence.
6. DAG mode rejects all mutating operations and all fan-out steps before any
   session mutation.
7. Concurrent read-only nodes sharing one cwd are allowed with explicit
   non-attributable-verdict caveats; caveated reviewer/red-team results require
   recheck by plan-loop/code-panel and are not trustworthy closure evidence.
8. Old sessions retain legacy sequential semantics. Old binaries fail clearly
   against newer DAG schema sessions and never append to them.

## Execution Through Code-Panel

This track **uses `fgos-code-panel` in planned multi-cell mode**. It is a
dogfood track, but bootstrap cells dispatch through the existing legacy
sequential request shape; they do not enable DAG mode while constructing its
schema/replay/admission foundation. Each cell uses the existing independent
Doer -> Reviewer + Red-Team -> Lead disposition loop. Only Phase 06 may use
the new DAG path to coordinate a live proof after all prior gates have merged.

Pure direct-agent/tool work is a recovery-only procedure if the legacy
code-panel cannot create or resume a cell with integrity. It is not a normal
execution route and must be recorded as an incident if used.

## Execution Inputs

- Plan root: `plans/260917-cold-resumable-coordination-dag/`
- Track branch: `implementation-track--cold-resumable-coordination-dag`
- Cell branch / coordination-id: `cold-resumable-coordination-dag--p<NN>`
- Protocol: `core.coordination-protocol.standalone-master-coordination-loop`
- Roster: Doer, independent Reviewer, independent Red-Team; Lead owns every
  disposition and merge.
- Full proof command: `npm test`
- Recorded baseline: Phase 00 records exact command, commit, and literal known
  failing-test names; the list may only shrink.
- Merge cadence: per cell into the track branch; Phase 06 is not opened until
  Phases 00-05 are integrated and checkpoint-verified.
- Main-to-track sync: before Phase 00 and before Phase 06; each sync replaces,
  rather than extends, the dated baseline record.

## Product Gates

Every phase touches coordination schema/replay/dispatch behavior and is a
mechanical full-suite gate under the plan-loop authoring contract. Each phase
also names focused tests; `npm test` runs against the cell tip and the
integrated track tip unless a tree-identical merge is proven and recorded.

| Phase | Cell | Capability | Exit |
| --- | --- | --- | --- |
| 00 | Baseline and migration lock | code:implement | Reproducible baseline, schema migration matrix, and no code behavior change. **Full-suite gate.** |
| 01 | DAG session declaration and replay | code:implement | New schema persists immutable declaration; old/new binary behavior is explicit. **Full-suite gate.** |
| 02 | Request compiler and identity gate | code:implement | Complete dependency extraction and resume equivalence reject semantic drift pre-mutation. **Full-suite gate.** |
| 03 | Projection and consumer contract | code:implement | `show`/`chain` expose derived nodes and unsupported/legacy state unambiguously. **Full-suite gate.** |
| 04 | Read-only admission and outcome taxonomy | code:implement | Read-only DAG admission/outcomes are typed, integrity-safe, and caveated. **Full-suite gate.** |
| 05 | Dynamic frontier scheduler | code:implement | Read-only individual nodes schedule/resume correctly with no close or recovery regression. **Full-suite gate.** |
| 06 | Code-panel and plan-loop dogfood | code:implement | Planned-mode consumer obtains measured overlap and cold resume through real public doors. **Full-suite gate.** |
| 07 | Migration and release proof | code:implement | Compatibility, adversarial recovery, and end-to-end evidence are complete. **Full-suite gate.** |

## Dependency Schedule

```txt
P00 -> P01 -> P02 -> P03 -> P04 -> P05 -> P06 -> P07
```

The phases are deliberately sequential. They share schema/replay contracts and
each later phase consumes a persisted shape established by its predecessor.
Parallel work would create merge-order-dependent migration semantics and would
not meaningfully shorten the critical path.

## Phase Files

1. [Phase 00](phase-00-baseline-and-migration-lock.md)
2. [Phase 01](phase-01-dag-session-declaration-and-replay.md)
3. [Phase 02](phase-02-request-compiler-and-identity-gate.md)
4. [Phase 03](phase-03-projection-and-consumer-contract.md)
5. [Phase 04](phase-04-read-only-admission-and-outcome-taxonomy.md)
6. [Phase 05](phase-05-dynamic-frontier-scheduler.md)
7. [Phase 06](phase-06-code-panel-and-plan-loop-dogfood.md)
8. [Phase 07](phase-07-migration-and-release-proof.md)

## Track Close Criteria

- Every product gate has a recorded baseline comparison and integrated-track
  proof.
- A schema-new DAG session is cold-resumable; a schema-old session remains
  explicitly legacy/non-DAG; an older binary fails safely against schema-new.
- No mutating or fan-out DAG request can materialize an Assignment.
- The live consumer proof shows real review/red-team overlap, a fresh-process
  `chain`/`show` reconstruction, and a correct resumed continuation.
- Shared-cwd caveated review/red-team outcomes cannot close or disposition a
  cell without recheck.
- No BLOCKER/HIGH reviewer or red-team finding remains unresolved.

## Integration Cross-Reference and Baseline Disposition

- **Unified Integration Plan:** `plans/260919-coordination-skill-harness-simplification/plan.md`
- **Date:** 2026-09-23
- **Prerequisite Baseline Status:** FULFILLED. The prerequisite dispatch-hardening, prompt-template, and result-truth baseline:
  - Units **I02** and **I03** (Phase 01 R1/R4/R5, RunResult v2 fail-closed verification, non-authoritative superseded preservation, immutable authoritative publication, and atomic settlement CAS across all production writers) integrated into local `main` at `4362bfec` (candidate branch tip `510f35f5`, code fix `f835c215` at `72894c98`).
  - Unit **I04** (operation prompt-template registry, resolver, and provenance) integrated into local `main` at `7472bd74` (candidate SHA `f0919405`).
  - Unit **I06** (dispatch-hardening Phase 05 remainder: cross-provider redirect governance contract, PlacementPolicy active binder reconciliation, and adapter registry leaf module cycle cut) integrated into local `main` at `3bab9b99` (evaluated candidate `d75d311d`, status-recording tip `dec142a5`, synchronized candidate `46ec45c5`).
  - Current local `main` is at `e11ad814` (ahead of `origin/main` at `15e40485` by 13 commits; not pushed pending track review).
  - Combined verification: 333 pass / 0 fail across combined rerun (45 template/contract, 88 placement/redirect/role-tier, 75 assignment-dispatch, 125 architecture/setup/checks; 548+ pass in full post-merge matrix).
- **DAG Forward-Port Schedule:** Forward-porting the cold-resumable coordination DAG track onto the unified baseline is scheduled as Unit **I09** in the unified integration plan (`plans/260919-coordination-skill-harness-simplification/plan.md`).
- **Unit I09 Implementation Status:** IMPLEMENTED. Candidate branch `coordination-skill-harness-i09-dag-forward-port` has completed implementation and verification (14 focused suites, 414+ tests pass / 0 fail, git diff --check clean). Pre-merge implementation is complete and ready for Unit **I10** test and Unit **I11** independent review.
