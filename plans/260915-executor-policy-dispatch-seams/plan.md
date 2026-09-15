# Executor policy dispatch seams — plan-loop track

This is a Work-independent implementation track. Do not run it through fgOS
Work items. Use `fgos-plan-loop` for coordinated cells, or use `fgos-code-panel`
for one phase/cell at a time when a single change is small enough.

## Goal

Move dispatch policy selection out of executor identity without breaking current
behavior. The target is not to delete legacy executor ids in one jump; it is to
add auditable seams so persona, quality, reasoning effort, tool intent,
provider/model selection, and placement can move upward while existing argv/env
rendering stays snapshot-protected.

The plan is grounded by:

- `plans/260915-executor-policy-dispatch-seams/design.md`
- `plans/reports/executor-policy-baseline-260915.md`
- `docs/history/executor-identity-vs-execution-policy/DISCUSSION.md#design`
  once branch `fgw/tsk-5db` is integrated
- current implementation in `src/runner/dispatch/**`,
  `src/runner/definitions/schema.mjs`, and `src/verbs/coordination/run.mjs`

## Execution Inputs

- Track branch: `track/executor-policy-dispatch-seams`
- Cell branch/coordination-id convention:
  - branch: `executor-policy-dispatch-seams--cell-NN`
  - coordination id: `executor-policy-dispatch-seams--cell-NN`
- Roster: doer=`agy-cli` standard meticulous implementer; reviewer=`claude` analytical skeptical reviewer; red-team=`codex-bwrap` analytical adversarial tester, unless a cell explicitly overrides for provider-specific proof.
- Full proof command: `npm test`
- Recorded baseline: recorded retroactively 2026-09-16 (should have preceded Phase 00; corrected before Phase 01/02). Command `npm test` on track branch commit `3bc87899` (node v24.18.0, package-lock sha256 `b097ecd8...`). Result: 6589 tests, 6527 pass, 53 fail, 9 skipped, ~499s.
  - 51 of 53 failures are `test/rust-host/{fgctl-init,fgctl-stage,fgctl-upgrade,release-tree}.test.mjs` — all fail the same precondition ("Compiled Rust binary must exist at target/release/fgctl|fgos" — `cargo build --release --workspace` was never run in this worktree). Category: **environmental-precondition**, unrelated to this track.
  - 2 remaining: `executeAssignment captures timeout with partial stdout and writes failed RunResult storage (P2)` (`test/runner/assignment-dispatch.test.mjs`) and `R5 concurrency: dispatchResearchFanOut fanning out to 2 branches CONCURRENTLY...` (`test/runner/coordination-research-fan-out.test.mjs`) — both are timing-sensitive assertions (subprocess-output-capture / concurrency-delay timing) that failed under this session's heavy concurrent load. Category: **environmental-transient**. Full failing-name list: `/tmp/baseline-failing-names-clean.txt` from this run (not committed; reproduce via the command above if needed for a later gate's triage).
  - The baseline list may only shrink from here; any of these 53 names still failing at a later full-suite gate is not a new failure to triage.
- Merge cadence to main: final-only unless a phase is marked full-suite gate and the Lead decides to checkpoint.
- Main→track sync point: before Phase 04, if main changed dispatch/session/schema files during earlier phases.

## Product Gates

| Phase | Cell | Capability | Exit |
|---|---|---|---|
| 00 | baseline snapshot harness | code:test | Golden snapshot captures current executor × work-size behavior and fails on unexpected model/argv/env/prompt-delivery drift. |
| 01 | provider adapter shadow | code:implement | ProviderAdapter renders current legacy argv equivalently in shadow mode; no dispatch behavior change. |
| 02 | persona prompt envelope | code:implement | Resolved persona is delivered through PromptEnvelope with delivery provenance and tests. |
| 03 | reasoning effort + alias seam | code:implement | Compatibility aliases expand at caller scope with `viaAlias`; `reasoningEffort` is canonical but legacy argv remains equivalent. |
| 04 | quality bridge | code:implement | Legacy tier maps into canonical quality with implied mode precedence; minRigor-only raise semantics tested. **Full-suite gate.** |
| 05 | placement policy skeleton | code:implement | PlacementPolicy exists in shadow/read-only mode and reports divergence from legacy capability/executor sources without changing binding. |
| 06 | executor profile/invocation schema sketch | code:implement | Executor identity/invocation vocabulary is documented and validator/doctor warnings exist; no destructive config migration yet. **Full-suite gate.** |

## Cell status

| Phase | Cell | Merge commit | Review/red-team verdict | Deferred findings | Evidence |
|---|---|---|---|---|---|
| 00 | executor-policy-dispatch-seams--cell-00 | `282fd62e` (integrated), tree-identical to tested `c6a2a57c` | Reviewer + red-team: ready to merge as-is (2 rounds; provider-quota retry substituted claude-bwrap for codex-bwrap) | 4 executors outside declared matrix (claude-bwrap/agy-bwrap/claude-herdr/codex-herdr); several cosmetic LOW items | `docs/architect/agent-coordination/verification/executor-policy-dispatch-seams/p00.md` |

Mechanical-gate rule applies: any diff touching `src/runner/dispatch/**`,
`src/runner/coordination/**`, `src/verbs/coordination/**`,
`src/runner/definitions/schema.mjs`, or config validation may require full-suite
proof even if the phase file names targeted tests.

## Non-goals for this track

- Do not delete legacy executor ids.
- Do not migrate every config entry to a new schema in one change.
- Do not turn BusinessCasePreset and PlacementPolicy into production routing in
  the first phase.
- Do not make provider/model literal pins portable.
- Do not silently lower permission, rigor, effort, or confinement requirements.

## Design invariants to preserve

1. Executor identity is not created by argv flags such as `--effort`,
   `--model`, `--allowedTools`, `-s read-only`, or `--permission-mode`.
2. Confinement is normally an invocation envelope; it becomes identity only when
   it changes principal, backend trust, or egress boundary materially.
3. Permission/read-only is an operation/business-case contract checked during
   placement; compatibility aliases never carry permission contracts.
4. Quality has ordinal `minRigor` and nominal `mode`; raise-only applies only to
   `minRigor`.
5. Legacy tier bridge mode is implied. Mode precedence is:
   `explicit > implied-by-persona > implied-by-tier-bridge`.
6. `reasoningEffort` defaults from `minRigor`, not `mode`.
7. BusinessCasePreset owns semantic defaults; PlacementPolicy owns
   provider/model/executor ranking and must replace legacy scattered placement
   sources rather than sit beside them forever.
8. ProviderAdapter renders canonical runtime options; transport only spawns.
9. Persona must reach PromptEnvelope and DispatchPlan must record delivery mode.
10. Governance vetoes/refuses/asks for approval; it does not lower requirements
    and continue.
11. Every behavior-preservation claim must cite a snapshot.

## Evidence states for each cell

Each cell trace under
`docs/architect/agent-coordination/verification/executor-policy-dispatch-seams/`
must record:

```text
Proof: targeted | full-suite-gate | escalated-to-full
phase/cell id: <phase>/<cell>
command: <exact command>
baseline: <recorded baseline reference>
testedSha: <sha>
integratedSha: <sha or pending>
treeIdentical: true|false|n/a
outcome: pass|fail with triage
snapshot impact: unchanged | intentional-delta:<named decision>
```

## Suggested cell order

Sequential order remains valid, but the track may also run in bounded parallel
waves once dependencies are respected. Phase 00 is the only mandatory first
gate: every later behavior-preservation claim depends on its snapshot fixture.

### Parallelization schedule

| Wave | Cells | Can run in parallel? | Dependency / join condition |
|---|---|---:|---|
| W0 | Phase 00 baseline snapshot | No | Must land first. Establishes golden behavior fixture. |
| W1 | Phase 01 ProviderAdapter shadow; Phase 02 Persona PromptEnvelope | Yes | Both depend on Phase 00. They touch adjacent runtime/prompt surfaces; if both edit `assignment-runner`/DispatchPlan evidence, merge carefully and re-run both targeted suites. |
| W2 | Phase 03 reasoningEffort + alias seam; Phase 06 doctor/vocabulary warnings | Partly | Phase 03 depends on Phase 01 and should see Phase 02's prompt evidence shape. Phase 06 can start after Phase 00 as doc/doctor warnings, but any config-validator edits must rebase over Phase 01/03. |
| W3 | Phase 04 quality bridge | No | Depends on Phase 00 and should run after Phase 03 because effort defaults refer to canonical `minRigor`. Full-suite gate. |
| W4 | Phase 05 PlacementPolicy shadow | No | Depends on Phase 04's quality vocabulary and Phase 01's adapter/shadow snapshot surfaces. |

Recommended fast path:

1. Land Phase 00.
2. Run Phase 01 and Phase 02 in parallel code-panel/plan-loop cells.
3. After both land, run Phase 03. Phase 06 may run in parallel with Phase 03
   only if scoped to docs/doctor warnings and not hard config validation.
4. Run Phase 04 as a full-suite gate.
5. Run Phase 05.
6. Finish or extend Phase 06 if earlier parallel slice intentionally left
   config-validator pieces for after Phase 04/05.

### Parallel safety rules

- Do not run two mutating cells in the same worktree.
- Each cell gets its own branch/worktree:
  `executor-policy-dispatch-seams--cell-NN`.
- Each cell must record which baseline snapshot commit it used.
- If two cells both edit the same files under `src/runner/dispatch/**` or
  `src/verbs/coordination/**`, the second merge must re-run both cells'
  targeted verification commands.
- Phase 04 and any full-suite-gate cell must integrate all earlier parallel
  branches before running `npm test`.
- A parallel cell may not update the shared golden snapshot fixture unless it is
  Phase 00 or explicitly records an intentional delta approved by the Lead.

## How to hand a phase to code-panel

For `fgos-code-panel`, pass exactly one phase file plus
`plans/260915-executor-policy-dispatch-seams/design.md` and this `plan.md`.
The phase file is the implementation scope; `design.md` is the contract. If the
doer finds the phase cannot preserve Phase 00 snapshots, it must stop and report
the intentional delta instead of widening scope.

## Close criteria

The track is complete when:

- legacy executor ids can be represented as aliases or profile invocations in
  shadow output;
- current behavior has golden snapshots before and after each phase;
- resolved persona, effort, quality, provider/model, invocation, and prompt
  delivery appear in DispatchPlan/runtime evidence with provenance;
- config/doctor can identify policy-shaped flags in executor args;
- no production path has a fourth hidden placement source beside
  PlacementPolicy target semantics.
