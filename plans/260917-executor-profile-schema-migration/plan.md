# Executor profile schema migration — plan

Status: Phase A and B merged to main. Phase C/D/E designed below, not
started -- each needs its own dedicated implementation pass and explicit
go-ahead before touching live `.fgos/config.json` schema or removing an
executor id anything still references.

This is the deferred "later track" design.md §9 of
`plans/260915-executor-policy-dispatch-seams/` named but never scoped:
"Removing legacy executor ids... Rewriting `.fgos/config.json` to the final
ExecutorProfile schema... Moving account inventory or credential
provisioning into PlacementPolicy" (that last one stays Provider Capacity
Rotator's job, out of scope here too -- see below).

## Why this is its own track, not a phase of the seams track

Every phase in `plans/260915-executor-policy-dispatch-seams/` was additive
and self-verifying: a legacy code path stayed untouched and a new path was
trusted only when it provably agreed, so nothing could regress for any
config outside the proven matrix. Two of the four items here have no legacy
path to agree with at all (cross-provider fallback is net-new behavior;
config schema migration changes the very shape callers read) -- the safety
argument that made the previous track's 9 phases low-risk does not carry
over automatically. Each phase below states its own safety argument
explicitly instead of inheriting one.

## Execution inputs

- Worktree: dedicated branch/worktree per phase, same discipline as the
  seams track. Do not edit the shared main checkout's source files
  directly for code; `.fgos/config.json` edits go through main directly
  (git-tracked config, not runner state) but ARE subject to
  `.githooks/pre-commit`'s no-regression-line-count guard on `.fgos/*` --
  see Phase A's own note on this.
- Full proof command: `npm test`.
- Baseline: the executor-policy-dispatch-seams track's own final full-suite
  gate (commit `a1a966ff` on main) -- 2 pre-existing import-graph failures,
  independently confirmed unrelated since the start of that track.

## Phase status

| Phase | Scope | Status | Evidence |
|---|---|---|---|
| A | Remove genuinely dormant, zero-reference executor ids (`claude-herdr`, `pi-herdr`) | Done | commit `5bbd066c` (branch `executor-profile-schema-migration`) |
| B | Real cross-provider PlacementPolicy fallback in production dispatch | Done | commit `eb78cc0c` (branch `executor-profile-fallback-dispatch`), merged `7dd8ac3d` |
| C | ExecutorProfile JSON Schema + additive dual-shape config support | Not started | -- |
| D | Migrate `readOnlyExecutorRedirects`' one live pool onto the new surface, retire the field | Not started, depends on C | -- |
| E | Consolidate remaining executor ids into ExecutorProfiles (`claude`+`claude-reviewer`+`claude-reviewer-herdr` etc.), retire flat `executors.<id>` shape | Not started, depends on C/D, largest blast radius | -- |

## Phase A — remove genuinely dormant executor ids

### Scope

Remove `claude-herdr` and `pi-herdr` from `.fgos/config.json` and their
Phase 00 baseline-matrix rows. Both are self-described in their own
`description` field as `DORMANT ... Not wired to any capability yet`.
`codex-readonly` stays -- confirmed load-bearing (Phase 03's
`LEGACY_EXECUTOR_ALIASES`, Phase 00's matrix, Phase 01/05 test fixtures all
reference it by name), matching design.md's own "kept registered only so
existing references resolve" framing for exactly this id.

A first `grep` pass found zero references outside their own config block;
a second, broader pass while landing the change turned up two more real
(but non-blocking) references missed the first time, both fixed as part of
this phase:
- `test/runner/provider-adapter.test.mjs`'s own independent 13-executor ×
  3-tier equivalence matrix (`expectedExecutors` list) resolves each id
  against live config directly, not via `BASELINE_SNAPSHOT_FIXTURE` --
  `pi-herdr` had to be dropped from that list too (12×3 = 36 pairs).
- `src/setup/registrations.mjs`'s `findWorkflowStageOperationProblems`
  `knownExecutors` allowlist hardcoded both ids as a permissive fallback
  superset (harmless to leave, since nothing ever names them in a
  workflow-stage operation) -- removed anyway to satisfy this phase's own
  "zero other reference remains" close criterion.
`test/setup/visibility-checks.test.mjs` uses the literal string
`'claude-herdr'` only as arbitrary fixture data for a generic
`checkHerdrExecutorKinds` unit test, unrelated to the real config entry --
left unchanged.

### Safety argument

Deletion of something with zero live references and an explicit
self-description as unwired is as close to risk-free as a config removal
gets. The only real risk is a stale test asserting the old 13-executor/
39-pair matrix count, caught immediately by the Phase 00 baseline snapshot
test itself.

### `.fgos/*` pre-commit guard note

`.githooks/pre-commit`'s `stagedFgosModificationsRegressLineCount` refuses
any `.fgos/*` commit on main whose line count is lower than HEAD, with no
exception for a legitimate config removal (it does not distinguish config
data from append-only runtime logs, and no sanctioned override exists in
this checkout -- confirmed during the seams track's own config cleanup,
commit `a1a966ff`). This phase's commit will need `--no-verify` on
explicit user instruction, same as that precedent.

## Phase B — real cross-provider PlacementPolicy fallback

Status: Done. Implemented in worktree/branch
`executor-profile-fallback-dispatch`, `src/runner/dispatch/assignment-runner.mjs`
(+ new helper `attemptProviderCapacityFallback`), commit `eb78cc0c`,
merged to main as `7dd8ac3d`. Full `npm test` gate on main post-merge:
7037 tests, 4 pre-existing failures (byte-identical to the pre-Phase-B
baseline set), zero new regressions.

### Scope (as actually implemented -- revised from the original design below)

The original design (kept below for the record) proposed wiring Phase 05's
`evaluatePlacementPolicyShadow`'s `fallbackCandidates`/`admitFallbackCandidate`
machinery (`placement-policy.mjs`, unexported, provider/model-ranking only,
zero production callers) into the H2 settlement path. Before implementing,
a design review (kongming, full transcript context in-session) surfaced a
**better-fitting, already-built primitive from an unrelated earlier track**:
`src/runner/dispatch/recovery.mjs`'s `resolveFallback(originalPlan,
candidateId, {compilePlan})` -- built for exactly "may this Assignment
substitute a different executor", already tested
(`test/runner/dispatch-recovery.test.mjs`), zero real callers anywhere in
`src/`. It is a strict superset of the placement-policy.mjs mechanism: it
re-runs the real `compileDispatchPlan()` with `cliOverride.preferExecutor`
forced to the candidate (so disallowed-provider/disallowed-executor
governance checks inside `resolveAssignmentDispatchPolicy` run for free),
verifies the scoped plan's governance verdict is `'allowed'` and its
tier/visibility provenance agrees with the original (never silently
downgrades), and hands back a FULLY recompiled invocation/confinement
policy for the candidate -- not just a provider/model tuple. This phase
uses `resolveFallback`, not `placement-policy.mjs`'s fallback mechanism.

Implementation, in `assignment-runner.mjs`'s `executeAssignment()`:

- On `acquireProviderAccountLease` refusal for the primary, the new
  `attemptProviderCapacityFallback()` helper iterates
  `compiledPlan.policy.executorPreference.slice(1)` (assignment-policy.mjs's
  own `fallbackExecutors`/`executorPreference` list, previously
  "reserved-not-executed" per Phase 00 R10), calling `resolveFallback` for
  each until one reaches `status: 'scoped'` AND passes the same
  out-of-process/non-tool/non-human-only guards the primary's own
  `shouldSelectProviderAccount` already applies. Every candidate skipped
  before that point (never-declared, compiler-refused, wrong
  tier/visibility, unsupported mechanism) is recorded in
  `skippedCandidates`.
- Exactly ONE provider-capacity lease attempt is made, against that single
  scoped candidate. A provider the rotator doesn't manage at all
  (`hasProviderAccounts` false) is treated as immediately usable, matching
  the primary's own existing rule. On lease refusal, the function returns
  unadopted -- no second candidate's capacity is ever tried.
- On adoption, the caller commits the switch to disk BEFORE reassigning any
  in-memory variable (`dispatch-plan.json` rewritten, then `run.json`
  patched in one write: `executorId`, `dispatchPlanDigest` (recomputed with
  the SAME formula used everywhere else in this file --
  `sha256:${sha256(JSON.stringify(plan))}`), and a `fallback` evidence
  block), THEN reassigns `compiledPlan`/`effectivePolicy`/
  `resolvedExecutorId`/`resolvedAdapter`/`effectiveCwd`/
  `providerCapacitySelection` so every downstream consumer for the rest of
  the (very long) function -- confinement prep, effective-execution-context
  building, the actual out-of-process spawn, evidence/result recording --
  naturally dispatches against the fallback. `run.json.dispatchPlanDigest`
  MUST move together with `dispatch-plan.json`:
  `confinement/request.mjs`'s `crossCheckAssignmentLaunchContext` throws on
  any disagreement between them, and the in-memory
  `assignmentLaunchContext.run.dispatchPlanDigest` built later in the same
  function is always derived from whatever `compiledPlan` holds at that
  point.
- If the disk commit itself fails, the fallback's lease (if any) is
  released and the code falls through to the existing terminal settlement
  exactly as if the fallback were never attempted -- never a half-switched
  state.
- Resume rehydration: if a prior attempt at this exact Run already
  committed a fallback (`run.json.fallback.resolved` present) before
  crashing, a resume reads that back and re-derives the same five
  variables from the persisted `dispatch-plan.json`, rather than
  recompiling the (refused) primary. The existing `!admitted.resumed` guard
  on `shouldSelectProviderAccount` means resume never re-attempts a lease.
- `run.json`/`evidence.json` gain an OPTIONAL `fallback` field (present
  only when a fallback was actually attempted); absent entirely for any
  dispatch with no declared `fallbackExecutors` -- verified byte-identical
  to the pre-Phase-B shape in that case.

### Safety argument (no legacy path to self-verify against)

This is net-new production behavior -- there is no prior "legacy fallback"
computation to compare against, so the self-verifying pattern from every
other binder in the seams track does not apply directly. Safety instead
comes from:

- **Opt-in by construction**: fallback only ever activates when a caller
  supplies a non-empty `fallbackExecutors` (today: nothing in this repo's
  own live config does). Every existing dispatch with no declared fallback
  list takes the exact same code branch and produces byte-identical
  output (verified by test, see below).
- **Governance re-admission is the real compiler, not a re-derived copy**:
  `resolveFallback`'s `compilePlan` closure is the SAME
  `compileDispatchPlan()` every other dispatch path calls -- a disallowed
  provider/executor is refused by the SAME code that refuses it for the
  primary, not a parallel copy that could drift out of sync.
- **Bounded**: exactly one provider-capacity lease attempt (the first
  scoped, mechanism-compatible candidate), never a retry loop of its own --
  matches design.md §3.6 ("Fallback admission... A provider lacking the
  required runtime/invocation class is skipped, never silently
  downgraded") and the seams track's own non-goal ("no retry loop owned by
  the rotator").
- **Atomic-enough commit ordering**: disk (dispatch-plan.json + run.json)
  is written before any in-memory reassignment, and a write failure
  releases the lease and falls back to the pre-existing terminal path --
  no code path can leave disk and memory disagreeing about which executor
  is authoritative for this Run.

### Required tests (all implemented, `test/runner/assignment-dispatch.test.mjs`)

- No declared fallback list -> byte-identical to current
  `provider-capacity-refused` settlement (regression guard) -- also
  independently confirmed by the pre-existing H2 test in the same file,
  unmodified and still passing.
- A declared fallback list where the first candidate is governance-admitted
  and has real capacity -> dispatch proceeds against it (worker actually
  spawns), `run.json`/`dispatch-plan.json`/`evidence.json` all agree on the
  new executor, `dispatchPlanDigest` verified to match the persisted plan,
  primary account's lease list verified untouched.
- A declared fallback list where every candidate is governance-refused ->
  falls through to the existing terminal `provider-capacity-refused`
  settlement, never a bare throw, `skippedCandidates` names the refused
  candidate and why.
- Bounded: two declared candidates, the first's capacity also refused ->
  terminal settlement; the second candidate is verified to never spawn and
  never receive a lease (proves the "at most one attempt" bound, not just
  "no fallback ever tried").
- Resume: a Run that already committed a fallback before a simulated
  crash rehydrates that same fallback on resume, never recompiling/
  re-dispatching the refused primary.
- NOT implemented this pass (documented gap): an end-to-end proof through
  the coordination store's schema-2 retry path (`session-engine.mjs`'s
  `retrySessionTask`/`linkResult`) that a fallback-dispatched Run's
  `runId` still agrees with the ledger's declared `nextRunId`. The
  function-level tests above prove `executeAssignment`'s own contract;
  this integration edge was flagged by the design review as a real risk
  (a fresh-Run-per-fallback alternative was rejected specifically because
  of it) but exercising it needs a session-engine harness beyond this
  pass's scope.

### Original design (superseded by the above, kept for the record)

Phase 05 of the seams track already built `evaluatePlacementPolicyShadow`'s
`fallbackCandidates`/governance-re-admission machinery, but it has never
had a real caller -- Phase 07's H2 fix settles a provider-capacity refusal
as a terminal `provider-capacity-refused` failure unconditionally, never
attempting a declared fallback. The original plan was to wire a real
attempt through THAT machinery. Superseded because `recovery.mjs`'s
`resolveFallback` (discovered during implementation) does the same job
more completely, reusing the real compiler instead of a parallel
provider/model-only re-derivation -- see "Scope" above.

## Phase C — ExecutorProfile JSON Schema + additive dual-shape support

### Scope

Write an actual machine-checkable schema (not just prose in design.md/
runner.md) for the target `ExecutorProfile` shape (`identity.principalRef`/
`runtimeBackendRef`/`trustDomain`/`egressClass`, `supports`, `invocations[]`
per design.md §3.7). Add it as a NEW, additive config surface --
`runner.executorProfiles.<id>` or equivalent -- that `resolveExecutorAndOverrides`
prefers when present, falling back to the existing flat `runner.executors.<id>`
shape unchanged when absent. No existing executor entry is touched by this
phase; it only makes the new shape expressible and resolvable.

### Why this needs its own go-ahead before starting

This touches the read path of every dispatch call site
(`resolveExecutorAndOverrides`, `resolveExecutorConfig`,
`resolveExecutorCommand`, the confinement drivers, PlacementPolicy's own
`buildPlacementPolicyCandidate`) -- a much larger blast radius than any
single phase in the seams track, and the first schema-shape decision here
constrains every later phase (D, E). Not started.

## Phase D — retire `readOnlyExecutorRedirects`

### Scope

Once C lands, express the one live redirect pool
(`claude -> default:[codex-bwrap], operations:{review-candidate:[...],
red-team-candidate:[...]}`) on the new ExecutorProfile/PlacementPolicy
config surface, prove `resolveVerifiedRedirectExecutor` (Phase 08) resolves
identically from the new source, then delete the
`runner.readOnlyExecutorRedirects` field and
`readOnlyRedirectCandidates`'s legacy-config-reading branch.

Not started -- depends on C.

## Phase E — consolidate remaining executor ids

### Scope

Map `claude` + `claude-reviewer` + `claude-reviewer-herdr` (and similarly
for `agy-cli`/`agy-herdr`, `codex-cli`/`codex-bwrap`/`codex-herdr`) into one
ExecutorProfile each with multiple invocations, per design.md §3.7's own
worked example. Retire the flat `runner.executors.<id>` shape only after
every consumer reads the new surface exclusively and a real deprecation
window has passed for anything outside this repo that references the old
flat ids by name.

Not started -- largest blast radius, depends on C and D, needs its own
migration-contract decision (design.md's own non-goal: "deleting legacy
executor ids wholesale" without one) before any destructive step.

## Close criteria

- Phase A: `claude-herdr`/`pi-herdr` gone from config and the baseline
  matrix; zero other reference remains.
- Phase B: a real Provider Capacity Rotator refusal with a declared
  fallback pool results in a real dispatch attempt against an admitted
  fallback, evidenced; the no-fallback-declared case is unchanged.
- Phase C: ExecutorProfile shape is schema-validated and resolvable
  end-to-end for at least one real executor, dual-shape, zero behavior
  change for every executor still on the flat shape.
- Phase D: `readOnlyExecutorRedirects` field no longer exists in code or
  config; PlacementPolicy is the only redirect-pool source.
- Phase E: a real migration contract exists and is followed; no
  currently-referenced executor id disappears without one.
