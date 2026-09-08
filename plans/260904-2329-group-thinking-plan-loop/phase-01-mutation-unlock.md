# Phase 01 — Mutation Unlock

Depends on: Entry Conditions only. Runs in parallel with Phase 02.

## Objective

Let a declared `operation` step dispatch as a real, mutating worker —
producing an actual git delta the dispatch evidence ladder grades
`verified` — under a narrow, testable four-condition rule, without
weakening the existing read-only guarantee for every other role
(reviewer/red-team/consult/researcher/advisor). Fix the sessions-directory
cwd/root bug found during this plan's own design investigation.

This is the ONLY kernel-touching cell in this plan. Give it the same
rigor `step-09-mvp6-to-mvp9` required for every kernel change: independent
Reviewer + Red-Team, real fix rounds if either finds something, no
shortcut because the diff is small.

**Strict boundary with Phase 02, load-bearing for Wave 1's parallelism
claim**: this cell NEVER touches `bin/fgos.mjs`, `src/cli/command-registry.mjs`,
or any `test/cli/**` file. Every CLI-level flag/wiring this cell's own
mechanism needs (including a `--cwd` flag) is Phase 02's responsibility —
this cell is proven and tested entirely at the engine/dispatch level,
calling `runCoordinationUseCase`/`dispatchDeclaredOperation` directly with
explicit `ctx.cwd`/`ctx.repoRoot`, never through the CLI binary. If
implementing something here seems to require a CLI-layer edit, STOP and
route that requirement to Phase 02 instead of touching a leased file.

## Requirements

- **R1**: A request's `operation` step may declare `mutation: 'mutating'`.
  `src/verbs/coordination/schema.mjs`'s current `assertMutationReadOnly`
  (which unconditionally rejects anything but `'read-only'`) becomes
  `assertMutationAllowed`, permitting `'mutating'` ONLY on `operation`
  steps — `authorize`/`disposition`/`contribution`/`fan-out` steps stay
  hard-refused for anything but `'read-only'`, unchanged.
- **R2**: A `mutating` step is refused unless the bound FlowDefinition
  operation declares `result.kind: 'work-product'`. Read the operation's
  own declaration from the session's resolved definition at dispatch time
  (`session-engine.mjs`'s existing operation-resolution path already has
  this data in scope — `result.kind` survives FlowDefinition normalization,
  `src/runner/definitions/schema.mjs`, confirmed present) — do not trust a
  caller-supplied claim about the operation's own `result.kind`.
- **R3**: A `mutating` step is refused unless the dispatch `cwd` resolves
  to a linked git worktree — NEVER the main checkout. The exact
  comparison, confirmed by direct investigation (do not re-derive
  differently): `resolveMainCheckoutRoot(cwd)` (`src/runner/paths.mjs`)
  returns the main checkout root via `--git-common-dir` for ANY cwd
  (worktree or main), and returns `null` outside a git checkout entirely.
  The refusal condition is
  `resolveMainCheckoutRoot(cwd) === resolveRepoRoot(cwd)` (i.e. the
  toplevel of `cwd` IS the main checkout root) — **never**
  `resolveMainCheckoutRoot(cwd) === cwd` (cwd may legitimately be a
  subdirectory of either the main checkout or a worktree; comparing
  against raw `cwd` would wrongly refuse a subdirectory dispatch). A
  `null` result (cwd outside any git checkout) also refuses mutating
  dispatch — fail closed, never fail open on an unresolvable root.
- **R4**: `buildReadOnlyContract` (`session-engine.mjs`, real current line
  numbers — re-locate before editing, this plan's own investigation found
  them around 189-205 but do not trust that without re-checking) takes the
  step's own `mutation` field (default `'read-only'` when absent,
  preserving every existing caller's behavior byte-for-byte) and only
  sets `isReadOnlyMode: false` when R1-R3 all hold; otherwise the request
  is refused BEFORE dispatch, with an honest, attributable error naming
  which specific condition failed (not a generic validation message).
  **Rename this function to `buildSessionContract`** — "read-only" is no
  longer an accurate name once it can build either posture; update every
  call site's own name too. State explicitly in this cell's report that
  `dispatchPrimaryTask` (`session-engine.mjs`, confirmed ~441-443) and
  `proposeConsult` (confirmed ~527-548) keep their OWN, separate, hard
  read-only assertions completely unchanged — this unlock applies ONLY to
  `dispatchDeclaredOperation`'s own path, never to those two.
- **R5**: `runExecutorAttempt`'s single call site into `executeAssignment`
  (`session-engine.mjs`, confirmed ~280-282) stays the ONLY place inside
  `dispatchDeclaredOperation`'s own path that `isReadOnlyMode` is threaded
  through — do not add a second path there. Confirm the existing static
  test that pins this as the sole call site still passes with unmodified
  logic, only a widened input space.
- **R6 (three parts — the real choke point, corrected from an earlier
  draft of this plan that named the wrong mechanism)**:
  - **(a)** `src/runner/dispatch/execution-contract.mjs` and
    `assignment-normalizer.mjs`'s inline-contract paths accept `'mutating'`
    ONLY for an inline contract that carries the real, engine-reserved
    protocol operation stamp (`session-engine.mjs`'s
    `assertNoReservedOperationStamp`/stamp-append mechanism, confirmed
    ~line 162, 189-192 — re-verify the real current mechanism and its
    exact field/constant name before implementing); a bare inline contract
    with no such stamp stays refused for anything but read-only,
    unchanged. This closes the schema/normalizer-level door, but is NOT
    by itself sufficient — see (b).
  - **(b) — the real invariant, at execution, not construction.** A
    reserved-stamp check alone is forgeable by any direct `buildAssignment`
    caller with `provenance.kind: 'inline'`, since the stamp assertion
    lives only in the engine's own construction path, not universally
    enforced at every place an inline contract can originate. The
    invariant that actually matters: `runExecutorAttempt` (R5) must
    remain the ONLY code path anywhere in this codebase allowed to pass
    `isReadOnlyMode: false` into `executeAssignment`. Add a static/
    architecture-style test (matching whatever pattern
    `test/architecture.test.mjs` already uses for "only this module may
    call X," if such a pattern exists there — otherwise a straightforward
    grep-based test) that enumerates EVERY real call site of
    `executeAssignment(` in the codebase and asserts each one's own
    `isReadOnlyMode` posture. Confirmed call sites to include in that
    enumeration (verify this list is complete, do not trust it as final):
    `src/cli.mjs` (~957, inline path, must stay `true`), `src/cli.mjs`
    (~1129, must stay unconditionally `true`), and
    `src/runner/dispatch/operation-choice.mjs` (~2198 — **this one
    currently passes `opts` through with NO explicit `isReadOnlyMode`
    flag at all**, confirmed by direct investigation).
  - **(c)** Resolve the `operation-choice.mjs` gap from (b) one of two
    ways, and record which: EITHER prove (with a real test, not
    reasoning alone) that this call site can never receive an
    Assignment with `provenance.kind: 'inline'` and mutating intent — in
    which case record it in this cell's report as a verified non-issue,
    with the proof cited — OR give it the same explicit
    `provenance.kind === 'inline' → isReadOnlyMode: true` guard
    `src/cli.mjs:957` already has. If the fix is needed,
    `src/runner/dispatch/operation-choice.mjs` is added to this cell's own
    Files list (below) — it is not pre-authorized speculatively, only if
    (b)'s own investigation shows it is genuinely reachable.
- **R7**: The dispatch evidence ladder (`assignment-runner.mjs`) grades a
  mutating Assignment `verified` on a real git delta and continues to
  fail-and-rollback (existing `rollbackReadOnlyMutations` behavior) any
  Assignment still labeled read-only that produces a file change,
  unchanged. **Known, confirmed risk to design around, not assume away**:
  `dirtyBefore`/`dirtyAfter` are captured in `effectiveCwd`
  (`compiledPlan.invocation.cwd ?? cwd`, `assignment-runner.mjs`,
  confirmed ~768-827) while committed-file detection runs
  `computeChangedFiles(cwd, …)` (confirmed ~951) — if any dispatch plan on
  this path ever sets `invocation.cwd` to something different from
  `opts.cwd`, a worktree Doer's own delta could be partially invisible
  and grade `no-evidence` instead of `verified`. Before closing this
  requirement, determine (with a real test, not inspection alone) whether
  `compiledPlan.invocation.cwd` is EVER set to a different value than
  `opts.cwd` on the declared-protocol coordination path specifically — if
  it is genuinely never set differently on this path, record that as a
  verified non-issue with the proof cited; if it can differ, this
  requirement is not done until the mismatch is closed.
  **Decide and record the commit policy explicitly**: the default
  executor already permits `git add`/`git commit`
  (`src/runner/dispatch/config.mjs`, confirmed ~120-121) — a mutating
  Doer/Fixer MAY commit its own work on the cell's own worktree branch;
  the Lead still performs the final merge into the track branch, never
  the session itself. State this plainly in the report; Phase 03's own
  skill text depends on this decision being made here, not re-litigated
  there.
- **R8 (bug fix, same investigation surface)**: session-path resolution
  in `store.mjs` (the function computing `fgosDir` — confirmed the real
  bug: it computes `root` correctly but then keys `fgosDir` on raw `cwd`
  instead, confirmed ~48-59) uses the resolved main-checkout root, not
  the raw `cwd`. Grep every `fgosDirFromRoot(` call (and any sibling
  helper with the same class of bug — check assignments-dir and
  claim-file resolution too) under `src/runner/coordination/**` and
  `src/runner/dispatch/**` before considering this requirement done; fix
  every real instance found, not just the one already named. Paste the
  real grep output in this cell's own report, not a claim that it was
  done.
- **R9 (self-hosted dispatch-hook hazard — process requirement, not a
  code requirement)**: this cell touches `src/runner/dispatch/**`, and
  `scripts/dispatch-decide-hook.mjs` imports `src/runner/dispatch.mjs`.
  Per `master-coordinator.md`'s own "Self-Hosted Hook Hazard" section,
  this cell's Commands section MUST include, and keep passing throughout
  implementation:
  `node src/runner/dispatch.mjs decide --for smoke --needs-soul --has-live-task-access`
  (must print a real `mechanism` field). This cell cannot close while
  that smoke command fails, at any point.

## Files

May touch:
- `src/runner/coordination/session-engine.mjs` — `buildSessionContract`
  (renamed from `buildReadOnlyContract`), the mutating-dispatch refusal,
  R2's operation-resolution read, R3's worktree check.
- `src/runner/dispatch/execution-contract.mjs` — inline-contract
  mutation-mode acceptance (R6a).
- `src/runner/dispatch/assignment-normalizer.mjs` — same, normalizer side
  (R6a).
- `src/runner/dispatch/operation-choice.mjs` — ONLY if R6c's own
  investigation shows the guard is genuinely needed; not touched at all
  if R6c's non-issue proof holds.
- `src/verbs/coordination/schema.mjs` — `assertMutationReadOnly` →
  `assertMutationAllowed`, scoped to `operation` steps only (R1).
- `src/runner/coordination/store.mjs` — `fgosDir`/session-path resolution
  (R8), keyed on root not cwd.
- `docs/how-to/run-a-coordination-session.md` — correct the now-false
  "the whole CLI surface is read-only in V1" sentence to describe the
  real, narrower posture this cell establishes.
- `CHANGELOG.md` — one `## [Unreleased]` line for the mutation-unlock
  behavior change (a real, user-visible change per AGENTS.md's own gate).
- `test/runner/coordination-*.test.mjs`,
  `test/runner/dispatch-*.test.mjs`,
  `test/runner/assignment-dispatch.test.mjs`,
  `test/architecture.test.mjs` (R6b's static enumeration test, if that
  file is the right home for it) — new/extended tests per Tests below.
  **Never** `test/cli/coordination.test.mjs` (Phase 02's own lease).
- `docs/architect/agent-coordination/contracts/coordination-session.md` —
  document the four-condition mutation rule once proven (promote after
  close, not before).
- This cell's own report file under
  `docs/architect/agent-coordination/verification/group-thinking-plan-loop/`.

Do NOT touch:
- `bin/fgos.mjs`, `src/cli/command-registry.mjs`, any `test/cli/**` file
  — Phase 02's exclusive lease, no exception, including for a `--cwd`
  flag this cell's own mechanism needs (Phase 02 owns that).
- `core/coordination-protocols/**` (no fixture changes needed for this
  cell).
- `core/protocol-packs/group-thinking.json` (Phase 02's own lease).
- Anything under `src/verbs/coordination/chain.mjs`,
  `src/verbs/coordination/launch-master-loop.mjs`, or
  `.agents/skills/fgos-plan-loop/**` (Phase 02/03's own leases).
- `docs/specs/runner.md`'s stop-gate paragraph — read it, do not edit it
  in this cell; Phase 03 (after the live proof) is where that paragraph
  gets superseded, since only the live proof's own result can honestly
  close it.
- Any ADR file — supersede by reference in this cell's own report
  (`docs/architect/agent-coordination/contracts/coordination-session.md`'s
  promoted text names which ADR clause is superseded and why); do not
  edit an ADR's own historical text.

## Tests First

Write these as real, failing tests before implementing, per this repo's
own YAGNI/tests-first discipline where the cell's own Acceptance calls
for it. All of these are ENGINE-LEVEL tests (calling
`runCoordinationUseCase`/`dispatchDeclaredOperation` directly with
explicit `ctx.cwd`/`ctx.repoRoot`) — none of them go through
`bin/fgos.mjs` or any CLI surface, per this cell's own strict boundary
with Phase 02. Fixtures need a REAL temp git repo with a REAL linked
worktree (R3's check shells out to git; it cannot be stubbed).

1. A `mutating` `operation` step whose bound operation declares
   `result.kind: 'work-product'`, dispatched with `ctx.cwd` = a real
   linked worktree: (a) produces a real uncommitted file change and
   grades `verified` with non-empty `changedFiles`; (b) SEPARATELY, a
   Doer that commits its own change on the cell's own worktree branch
   (per R7's commit-policy decision) also grades `verified` with the
   committed files correctly attributed — both halves required, not just
   the uncommitted-delta case.
2. The SAME request, dispatched with `ctx.cwd` = the main checkout root,
   is refused before any dispatch, with an error naming "main checkout"
   as the reason. A SECOND variant: `ctx.cwd` = some path entirely
   outside any git checkout — also refused (R3's fail-closed-on-`null`
   case), not silently treated as acceptable.
3. A `mutating` step whose bound operation declares `result.kind:
   'advisory'` (not `work-product`) is refused, error naming the
   operation's own declared kind.
4. A step that does NOT declare `mutation` at all (omitted) behaves
   byte-identically to today — read-only, `isReadOnlyMode: true`. Prove
   this against at least one EXISTING test fixture unchanged (e.g. a
   `standalone-master-coordination-loop` reviewer/red-team dispatch)
   rather than only a new one.
5. A reviewer/red-team/consult role dispatched normally (unchanged
   request shape) still fails-and-rolls-back if its own worker script
   edits a file — the existing `rollbackReadOnlyMutations` behavior,
   reproduced against the SAME fixture pre-existing tests already use, to
   prove nothing regressed. Separately, confirm `dispatchPrimaryTask` and
   `proposeConsult` still hard-refuse mutating dispatch unconditionally
   (R4's own explicit carve-out), unaffected by this unlock.
6. R6b's static enumeration test: every real `executeAssignment(` call
   site in the codebase is enumerated and its own `isReadOnlyMode`
   posture is asserted — deliberately break one (in a scratch copy) to
   confirm the test actually catches a violation, not just passes
   trivially.
7. Every other `fgosDirFromRoot(`-class call site found during R8's own
   grep gets at least one matching regression test if it didn't already
   have one.

## Risks / Rollback

- **Risk**: R6's schema/normalizer-level gate (R6a) alone is insufficient
  — this was an actual mistake in an earlier draft of this plan, caught
  by adversarial review, not a hypothetical. Mitigation: R6b's static
  enumeration test is non-negotiable; do not consider R6 done from R6a
  alone.
- **Risk**: R7's `invocation.cwd` mismatch is live, not latent, on the
  declared-protocol path — would mean a real Doer's own committed work
  could grade `no-evidence` silently. Mitigation: R7's own investigation
  step is mandatory before closing, with a real test proving whichever
  way it resolves.
- **Risk**: R8's grep finds MORE cwd-keyed bugs than expected, expanding
  this cell's scope. If so, fix every real instance found (do not leave a
  known, named data-loss bug half-fixed) but do not expand into unrelated
  refactoring of those files beyond the root-vs-cwd fix itself.
- **Rollback**: this cell's entire diff is additive/narrowing (a stricter
  four-condition gate around a previously-absolute refusal) — reverting
  it via `git revert` restores the exact prior all-read-only behavior
  with no partial-state risk.

## Acceptance

- All 7 Tests First items pass, independently re-run by the Coordinator
  (not trusted from the Doer's own claim).
- R9's smoke command passes at close time (and is shown passing in the
  cell's own Commands section, not just claimed).
- Zero regression in the full `coordination-*`/`dispatch-*`/
  `assignment-dispatch`/`architecture` focused regression (exact
  pre-existing count preserved, only net-new tests added). This cell's
  own regression sweep never includes `test/cli/coordination.test.mjs`
  (Phase 02's own lease covers that file).
- Independent Reviewer AND Red-Team both return APPROVE (fix rounds as
  needed, matching this repo's own established kernel-change discipline —
  do not close on a first-pass APPROVE WITH CONCERNS without resolving
  every MEDIUM/HIGH).
- R6c's `operation-choice.mjs` resolution (fixed, or proven a non-issue)
  is shown with real evidence in the report, not asserted.
- R7's `invocation.cwd` investigation is shown with real evidence in the
  report, not asserted; the commit-policy decision is stated in plain
  text.
- R8's grep is shown in the cell's own report (not just claimed) —
  paste the real grep output and account for every hit.
