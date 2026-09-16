# Executor policy dispatch seams — direct implementation plan

This is a Work-independent implementation track. Execute each phase directly
from its phase file in a dedicated branch/worktree. Do not use `fgos-plan-loop`,
`fgos-code-panel`, executor dispatch, or any skill/harness wrapper. Account
rotation slice 1 is now handled by
`plans/260916-account-rotator/`; this track resumes above that layer.

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

- Worktree: create a dedicated branch/worktree for the phase being implemented;
  do not edit the shared checkout's source files directly.
- Branch convention: `executor-policy-dispatch-seams--phase-NN`.
- The implementing agent owns inspection, edits, tests, diff review, and the
  final evidence report. There is no delegated roster or coordination id.
- Full proof command: `npm test`
- Recorded baseline: recorded retroactively 2026-09-16 (should have preceded Phase 00; corrected before Phase 01/02). Command `npm test` on track branch commit `3bc87899` (node v24.18.0, package-lock sha256 `b097ecd8...`). Result: 6589 tests, 6527 pass, 53 fail, 9 skipped, ~499s.
  - 51 of 53 failures are `test/rust-host/{fgctl-init,fgctl-stage,fgctl-upgrade,release-tree}.test.mjs` — all fail the same precondition ("Compiled Rust binary must exist at target/release/fgctl|fgos" — `cargo build --release --workspace` was never run in this worktree). Category: **environmental-precondition**, unrelated to this track.
  - 2 remaining: `executeAssignment captures timeout with partial stdout and writes failed RunResult storage (P2)` (`test/runner/assignment-dispatch.test.mjs`) and `R5 concurrency: dispatchResearchFanOut fanning out to 2 branches CONCURRENTLY...` (`test/runner/coordination-research-fan-out.test.mjs`) — both are timing-sensitive assertions (subprocess-output-capture / concurrency-delay timing) that failed under this session's heavy concurrent load. Category: **environmental-transient**. Full failing-name list: `/tmp/baseline-failing-names-clean.txt` from this run (not committed; reproduce via the command above if needed for a later gate's triage).
  - The baseline list may only shrink from here; any of these 53 names still failing at a later full-suite gate is not a new failure to triage.
- Merge cadence to main: final-only unless a phase is marked full-suite gate and the Lead decides to checkpoint.
- Main→track sync point: before Phase 04, if main changed dispatch/session/schema files during earlier phases.

## Emergency takeover / hotfix note — 2026-09-16

Claude quota exhaustion exposed a real dispatch bottleneck while this track was
in flight: read-only assignments resolving to default `claude` were all
compatibility-redirected into the single `claude-reviewer` executor. During the
outage this track is being patched directly in this worktree, not through
`fgos-plan-loop`, `fgos-code-panel`, Work items, or executor dispatch.

Hotfix scope in this branch:

- keep the existing write-safety invariant for read-only assignments;
- replace the hardcoded `claude -> claude-reviewer` redirect with a configured,
  provider-aware read-only redirect pool;
- route this repo's read-only Claude fallbacks to `codex-bwrap` as a temporary
  bridge until PlacementPolicy owns provider/model/executor placement;
- rely on Provider Capacity Rotator for same-provider account capacity
  selection and structured capacity refusals;
- let `codex-bwrap` provision credentials from an ordered Codex home pool so it
  is not pinned to only `${HOME}/.codex-fgovn`;
- clear stale assignment `dispatch.claim` during dead-driver `resume-driver`
  recovery, using the same liveness basis that authorizes recovery.

This is not the final placement design. It is a production-stability bridge
that prevents the current Claude quota leak and unblocks paused workers when
quota returns. Proper provider/model/executor placement remains Phase 05/06+
work; same-provider account rotation is no longer owned by this track.

## Product Gates

| Phase | Cell | Capability | Exit |
|---|---|---|---|
| 00 | baseline snapshot harness | code:test | Golden snapshot captures current executor × work-size behavior and fails on unexpected model/argv/env/prompt-delivery drift. |
| 01 | provider adapter shadow | code:implement | ProviderAdapter renders current legacy argv equivalently in shadow mode; no dispatch behavior change. |
| 02 | persona prompt envelope | code:implement | Resolved persona is delivered through PromptEnvelope with delivery provenance and tests. |
| 03 | reasoning effort + alias seam | code:implement | Compatibility aliases expand at caller scope with `viaAlias`; `reasoningEffort` is canonical but legacy argv remains equivalent. |
| 04 | quality bridge | code:implement | Legacy tier maps into canonical quality with implied mode precedence; semantic-tier raise-only composition and derived/read-only minRigor are tested; no six-tier modelTier production wiring. **Full-suite gate.** |
| 05 | placement policy skeleton | code:implement | PlacementPolicy exists in shadow/read-only mode, consumes provider-capacity refusal facts, and reports divergence from legacy capability/executor sources without changing binding. |
| 06 | executor profile/invocation schema sketch | code:implement | Executor identity/invocation vocabulary is documented and validator/doctor warnings exist; account capacity stays in Provider Capacity Rotator; no destructive config migration yet. **Full-suite gate.** |
| 07 | placement production binder | code:implement | After shadow proof, PlacementPolicy becomes the production provider/model/executor binder; Provider Capacity Rotator remains the account-capacity oracle. **Full-suite gate.** |
| 08 | legacy placement retirement | code:implement | Retire `readOnlyExecutorRedirects` and other legacy placement bridges only after Phase 07 proof; config/executor id migration remains incremental. |

## Cell status

| Phase | Cell | Merge commit | Review/red-team verdict | Deferred findings | Evidence |
|---|---|---|---|---|---|
| 00 | executor-policy-dispatch-seams--cell-00 | `282fd62e` (integrated), tree-identical to tested `c6a2a57c` | Reviewer + red-team: ready to merge as-is (2 rounds; provider-quota retry substituted claude-bwrap for codex-bwrap) | 4 executors outside declared matrix (claude-bwrap/agy-bwrap/claude-herdr/codex-herdr); several cosmetic LOW items | `docs/architect/agent-coordination/verification/executor-policy-dispatch-seams/p00.md` |
| 01 | integrated into `executor-policy-dispatch-seams--implementation` (2026-09-16, single-owner takeover — cell-01's session had stopped with one unmerged commit) | `9ee52f9e` (merge of cell-01's `3bb4cf74` into the consolidated implementation branch) | Self-verified only (no separate reviewer/red-team round this session): 102/102 tests incl. the full 13-executor × 3-tier (39-pair) shadow-vs-legacy argv equivalence matrix; Phase 00 baseline snapshot re-run green (46/46) | None found in cell-01's own commit; not independently red-teamed | `test/runner/provider-adapter.test.mjs`, `test/runner/dispatch-policy-baseline-snapshot.test.mjs` |
| 04 | `executor-policy-dispatch-seams--implementation` (2026-09-16) | `09937553` (quality bridge), preceded by unrelated pre-existing-bug fix `05444595` | Self-verified only (no separate reviewer/red-team round this session): 38/38 targeted (`assignment-policy.test.mjs`, 11 new Phase 04 tests), 148/148 Phase 00/01 re-run, 2927/2929 across `test/runner/` (2 pre-existing failures independently confirmed present on vanilla `main`, unrelated), full `npm test` gate: 56 failures all triaged as pre-existing (54 rust-host Cargo-build-precondition, 2 import-graph boundary tests confirmed on `main`) — zero new | None found; implementation deliberately scoped to `assignment-policy.mjs` only (the one resolver every dispatch path shares), no schema.mjs/session-engine.mjs changes | `test/runner/assignment-policy.test.mjs`, commit messages `05444595`/`09937553` |
| 02 | `executor-policy-dispatch-seams--implementation` (2026-09-16) | `2277aea2` | Self-verified only: 48/48 targeted (`assignment.test.mjs`/`run-result-v2.test.mjs`/`effective-execution-contract.test.mjs`), 829/829 phase-mandated command, 2931/2933 `test/runner/` (same 2 pre-existing) | None found; delivery is a `# Persona` prompt section only (no native system-slot exists yet) plus `promptEnvelope.persona` evidence derived from the existing `policy` param, no new caller-supplied param | `test/runner/assignment.test.mjs`, `test/runner/run-result-v2.test.mjs`, commit `2277aea2` |
| 03 | `executor-policy-dispatch-seams--implementation` (2026-09-16) | `626f6da4` | Self-verified only: 47/47 targeted (`assignment-policy.test.mjs`, 9 new Phase 03 tests), 2940/2942 `test/runner/` (same 2 pre-existing) | None found; alias patches carry no permission contract (`codex-readonly`'s patch is deliberately empty — its real distinguishing behavior is a permission flag); an already-set opPolicy value still correctly outranks the alias (confirmed via a real collision, `validate-plan`'s own taskSpec default persona) | `test/runner/assignment-policy.test.mjs`, commit `626f6da4` |
| pre-05 gates | `executor-policy-dispatch-seams--implementation` (2026-09-16) | `63cf7e5e` | Self-verified only: H1/H2/H5 confirmed real via direct code inspection + regression test reproducing genuine refusal/quarantine/redirect scenarios end to end (not stubs); H3 verified already correct in slice-1 (`ec6a0745`) via existing green test, no change made; 486/486 across every account-rotator-related test file, 2945/2947 `test/runner/` (same 2 pre-existing) | None found | `test/runner/provider-capacity.test.mjs`, `test/runner/assignment-dispatch.test.mjs`, commit `63cf7e5e` |
| 05 | `executor-policy-dispatch-seams--implementation` (2026-09-16) | `fa34fa69` | Self-verified only: 12/12 targeted (`placement-policy.test.mjs`), including both real Phase 00 baseline proof cases (agy-cli/agy-herdr heavy, fgos-coding-implement heavy) reproduced exactly against a fixture mirroring the live `.fgos/config.json` shapes, 660/660 phase-mandated command, 2958/2960 `test/runner/` (same 2 pre-existing) | Two real bugs found and fixed while proving the shadow module against the real config (dual-source rigorOverrides precedence gap; invocations[]-shaped-executor provider-family gap) — both were caught BEFORE any test was written, by the equivalence proof itself, then each got a dedicated regression test | `test/runner/placement-policy.test.mjs`, commit `fa34fa69` |
| 06 | `executor-policy-dispatch-seams--implementation` (2026-09-16) | `3f7cdef8` | Self-verified only: 10/10 targeted (`executor-profile-warnings.test.mjs`), 590/590 `test/setup/`, full `npm test` gate: 56 failures, byte-identical failing-test-name set to Phase 04's own full-suite gate run — zero new, zero fixed (rust-host + the same 2 pre-existing) | None found; found a real, currently-true stale-config finding while proving the check against live config (`codex-bwrap` still declares the retired `FGOS_CODEX_CREDENTIAL_HOMES` env var) — left as a correctly-surfaced doctor warning, not fixed (config data, out of this track's scope) | `test/setup/executor-profile-warnings.test.mjs`, `docs/specs/runner.md`'s new ExecutorProfile/Invocation section, commit `3f7cdef8` |
| 07 | `executor-policy-dispatch-seams--implementation` (2026-09-16) | `3d64a6be` (matrix coverage proof), `aecf7d0a` (production binder) | Self-verified only, with an explicit user go-ahead obtained before implementing the production flip (the first phase in this track that changes real spawn behavior, not just shadow evidence). Matrix proof: 39/39 canonical executor×tier pairs agree exactly between PlacementPolicy and legacy, zero divergence. Binder design: self-verifying (`resolveVerifiedPlacementModel`) — the caller's own unchanged legacy formula is always computed first; PlacementPolicy's candidate is used ONLY when it agrees, so the real spawn decision cannot regress for any config, proven or not. Full `npm test` gate: failing-test-name set byte-identical to Phase 06's own gate run — zero new, zero fixed | None found; `resolveAssignmentDispatchPolicy`'s own separate model-resolution world (Phase 04's `lookupPolicyTier`, a different vocabulary from `modelForTier`'s work-tier world) deliberately left untouched — unifying it needs its own vocabulary-bridging design this phase did not scope | `test/runner/placement-policy-matrix-coverage.test.mjs`, commits `3d64a6be`/`aecf7d0a` |
| 08 | `executor-policy-dispatch-seams--implementation` (2026-09-16) | `<pending>` | Self-verified only, with an explicit user go-ahead obtained before implementing (the second production-behavior change in this track). New `resolveVerifiedRedirectExecutor`/`selectPlacementPolicyRedirectExecutor`/`stablePoolIndex` in `placement-policy.mjs`, same self-verifying pattern as Phase 07. Proof: `stablePoolIndex` agrees byte-for-byte with an independently-reproduced copy of the legacy `stableIndex` formula across many seeds/pool sizes; the real live single-candidate redirect (`claude -> codex-bwrap`) reproduces exactly; a synthetic 3-candidate pool distributes identically to legacy across 200 distinct seeds (not a trivial always-same-answer coincidence — genuinely touches multiple candidates); a synthetic divergence correctly falls back and is reported. Full `npm test` gate: pending | Compatibility decision (see below) | `test/runner/placement-policy-redirect-selection.test.mjs`, commit `<pending>` |

**Phase 08 compatibility decision** (its own exit criteria: "`readOnlyExecutorRedirects`
is retired or marked ignored with a removal warning, depending on compatibility
decision"): the config field is **not** retired or deprecated in this phase —
it remains the declared candidate-pool source, config schema unchanged
(consistent with design.md §9's explicit out-of-scope declaration for config
migration, which applies to the whole track, not just this phase). What is
retired is the standalone, unverified static *selection algorithm*:
`selectReadOnlyRedirectExecutor` no longer independently decides the executor
— it computes the legacy value only as the safety-net input to
PlacementPolicy's self-verified selection, which is now the real production
authority for picking among the declared pool. "No production path depends
on a static read-only redirect pool" is satisfied for the *selection* step;
the *pool declaration* step remains config-driven, honestly, pending a later
track's config-schema migration.

Phases 00–08 and all four pre-Phase-05 runtime gates (H1/H2/H3/H5) are done.
Phase 07 and Phase 08 both required an explicit user go-ahead before
implementation, since both change real production dispatch behavior rather
than add shadow-mode evidence — every phase before them was provably a no-op
for existing callers, verifiable by unit tests alone. Both used the same
self-verifying pattern: the legacy formula is always computed first and
never removed; PlacementPolicy's value is used only when it agrees, so
neither change can regress behavior for a config outside this track's own
proven matrix.

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
   sources rather than sit beside them forever. Same-provider account capacity
   is delegated to Provider Capacity Rotator and is not a PlacementPolicy
   config axis.
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
| W2 | Phase 04 quality bridge | No | Depends on Phase 00 and the required main-to-track sync. It establishes canonical `minRigor` for Phase 03; full-suite gate. |
| W3 | Phase 03 reasoningEffort + alias seam; Phase 06 doc-only warnings | Partly | Phase 03 depends on Phase 04 for effort defaults and on Phase 01/02 for its runtime evidence shape. Phase 06 doc-only work may proceed, but validator/config edits must respect the later placement/account seams. |
| W4 | Phase 05 PlacementPolicy shadow | No | Depends on Phase 04, Phase 01's adapter/shadow surfaces, the Provider Capacity Rotator refusal/evidence contract, and completion of the pre-Phase-05 runtime fixes below. |
| W5 | Phase 06 ExecutorProfile/invocation warnings | No | Depends on Phase 05 vocabulary if validator changes touch placement/account seams. |
| W6 | Phase 07 production binder | No | Depends on Phase 05 shadow proof and Phase 06 warnings. Full-suite gate. |
| W7 | Phase 08 legacy bridge retirement | No | Depends on Phase 07 production proof. |

Recommended fast path:

1. Land Phase 00.
2. Sync main into the track and run Phase 04 as a full-suite gate.
3. Run Phase 01/02 as their dependencies become available, then finish Phase
   03 against the Phase 04 quality contract.
4. Fix and prove the Provider Capacity Rotator quarantine, refusal settlement,
   and Codex credential fail-closed paths; add the legacy redirect governance
   regression before opening Phase 05.
5. Run Phase 05 in shadow mode against structured Provider Capacity Rotator
   refusal facts.
6. Run or finish Phase 06 warnings/schema work.
7. Only after shadow proof, run Phase 07 production binder.
8. Retire `readOnlyExecutorRedirects` in Phase 08, not before.

### Pre-Phase-05 runtime gates

These are implementation gates, not reasons to delay the independent Phase 04
quality bridge:

- Quota/auth classification must pass `quarantineKind`, `until`, and detail
  fields accepted by the rotator; temporary quarantine without an expiry must
  not be considered healthy or selectable.
- Quota reset evidence must produce a conservative future quarantine boundary;
  missing reset text must not silently create an immediately selectable
  account.
- Provider-capacity refusal after admission must settle the current attempt as
  `provider-capacity-refused` and use the existing
  `retryId`/`predecessorRunId`/`supersedesRunId` admission path for a bounded
  `settle-and-reattempt` flow. It must not leave an admitted Run in
  `running`/unsettled state or use an unclassified throw.
- The refusal must be represented in the result-ladder vocabulary and
  `result.json`; reconciliation must not treat a settled refusal as an
  admitted-unsettled blocker. One owner must define the retry cap; do not add
  a second counter beside the existing attempt history without an explicit
  decision.
- Codex credential materialization must fail closed before bwrap spawn when no
  selected credential exists or copying fails. The legacy
  `FGOS_CODEX_CREDENTIAL_HOMES` rotation path must not be silently revived.
- Add a regression test proving `readOnlyExecutorRedirects` cannot bypass
  `disallowedProviders` before Phase 05 production work.

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

## Direct phase execution contract

An agent implementing a phase must:

1. Read `AGENTS.md`, `docs/specs/reading-map.md`, the relevant area specs,
   `docs/routing-handoff-contract.md`, this plan, `design.md`, and the target
   phase file before editing.
2. Inspect the current worktree and preserve unrelated dirty changes. Never
   reset, checkout, clean, or overwrite files outside the phase scope.
3. Create or enter a dedicated phase branch/worktree and record its base SHA.
4. Inspect the named symbols and their callers before changing behavior. Use
   the repository's existing helpers and provenance conventions; do not create
   parallel policy or model abstractions.
5. Implement only the phase contract. If a required behavior belongs to a
   later phase, record it as a blocker or deferred finding instead of widening
   scope.
6. Add focused regression tests for every changed contract, then run the
   phase's targeted tests and the required full-suite gate.
7. Run `git diff --check`, inspect the final diff, and record commands, base
   SHA, tested SHA, outcome, snapshot impact, and any baseline failures.
8. Do not commit or merge unless the user explicitly asks for that operation.

The agent must not use skills, `fgos dispatch`, `fgos plan-loop`,
`fgos code-panel`, or any coordination harness.

## Close criteria

The track is complete when:

- legacy executor ids can be represented as aliases or profile invocations in
  shadow output;
- current behavior has golden snapshots before and after each phase;
- resolved persona, effort, quality, provider/model, invocation, and prompt
  delivery appear in DispatchPlan/runtime evidence with provenance;
- PlacementPolicy consumes structured provider-capacity refusals from
  Provider Capacity Rotator for fallback decisions instead of doing account
  rotation itself;
- config/doctor can identify policy-shaped flags in executor args;
- no production path has a fourth hidden placement source beside
  PlacementPolicy target semantics.
