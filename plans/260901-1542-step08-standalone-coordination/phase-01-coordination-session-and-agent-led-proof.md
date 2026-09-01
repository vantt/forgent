# Phase 01 - CoordinationSession Ledger And Agent-Led Proof

## Objective

Build the smallest persistent standalone CoordinationSession and prove that a
primary investigator can request one bounded specialist consult dynamically,
without selecting a protocol or depending on Work lifecycle concepts.

## Requirements

- **R1 Store and schemas.** Create `src/runner/coordination/` with a versioned,
  fail-closed manifest/event store rooted at
  `.fgos/coordination/<coordinationId>/`. Manifest includes id, objective,
  status, creation/provenance root, aggregate hard bounds, actor registry,
  intended task/edge set, Assignment/Run/RunResult refs, and timestamps. It
  forbids `missionId`, Stage, Workflow, and TaskSpec as universal fields.
- **R2 Atomic creation and membership.** Persist the manifest and intended
  actor/task/edge identity before the first Assignment. Claim each logical task
  id atomically, create the Assignment once, then atomically append its ref.
  The session is the authoritative one-way membership index; Assignment remains
  session-blind. No adoption API, timestamp heuristic, or copied Assignment/
  result JSON is allowed.
- **R3 Events and reconstruction.** Append versioned session events for actor,
  task, Assignment, Run, result, disposition, failure, and status transitions.
  Event writes are atomic/inter-process safe; replay reconstructs the same view
  as the manifest and detects corrupt, duplicate, dangling, foreign, and
  out-of-order refs rather than silently skipping them.
- **R4 Direct mission-lite cutover.** Replace `mission-lite.mjs` and its tests
  with CoordinationSession APIs/tests in this phase. Remove `.fgos/missions/`
  writer/reader/list/thread shapes, mission-specific flags/heuristics, and the
  prototype `missionId` parameter/field/id branch from Assignment construction.
  Add no migration, detection, reporting, compatibility alias, or legacy state
  path. Future Mission grouping must remain possible by referencing session ids
  without changing Assignment.
- **R5 Session engine.** Add one engine entry accepting a validated standalone
  request, creating/resuming a session, materializing bounded inline contracts,
  calling only `buildAssignment()` and `executeAssignment()`, and recording
  canonical refs/results. Inject an executor function in unit tests; production
  default is the governed Assignment runner, never direct spawn.
- **R6 Dynamic consult semantics.** A primary actor may propose exactly one
  specialist actor plus one consult task while running. Foundation validates
  role, objective, read-only mutation, evidence requirement, context visibility,
  aggregate bounds, parentAssignmentId, and one request/response round before
  creating it. No protocol id or predeclared graph is required.
- **R7 Resume/idempotency.** On restart, reconstruct pending/completed logical
  tasks from persisted refs; never duplicate a claimed Assignment or rerun a
  completed result. A created-without-ref crash is reconciled by exact claimed
  logical task/Assignment identity, not timestamp. Ambiguous foreign state fails
  closed with a recoverable diagnostic.
- **R8 Agent-led proof.** Through an interactive coordinator plus real
  `cli-spawn` workers, run a primary-investigator read-only session that requests
  one bounded reviewer/specialist consult. Record manifest/events/Assignment/
  Run/RunResult/evidence and prove no Work, Workflow, Stage, TaskSpec, protocol,
  Mission, direct executor call, or repository mutation exists.

## Files

Create `src/runner/coordination/{schema,store,replay,session-engine}.mjs` or an
equally small split matching current module conventions, plus
`test/runner/coordination-*.test.mjs` and verification proofs.

Modify `src/runner/dispatch.mjs` exports and the minimum Assignment runner seam
needed for injected execution. Delete/replace
`src/runner/dispatch/mission-lite.mjs` and
`test/runner/mission-lite.test.mjs`. Add `.fgos/coordination/` to `.gitignore`,
`CHANGELOG.md`, setup/doctor check registration, reading-map/runner pointers,
and architecture manifest entries required by repo doctrine.

Do not modify Workflow normalization, protocol schemas, Work FSM/stage/merge/
worktree modules, CLI command registry, or headless runner loops.

## Tests First

- Manifest rejects forbidden/dead lifecycle fields and unknown schema fields.
- Two creators racing one logical task produce one Assignment ref.
- Crash points: before Assignment, after Assignment claim/before ref, after
  result/before event, and restart after completion.
- Replay rejects dangling, foreign, duplicate, corrupt, and out-of-order refs.
- Engine spy proves every execution uses `buildAssignment`/`executeAssignment`
  and no direct spawn import exists.
- Dynamic consult rejects mutation, undeclared second round, excess Assignment
  count, sibling context leakage, and absent evidence requirement.
- Static negative verifies `src/runner/coordination/**` imports no Work lifecycle,
  merge, worktree, transport spawn, or mission-lite module.

Focused command:

```bash
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  'test/runner/coordination-*.test.mjs' \
  test/runner/assignment-provenance.test.mjs \
  test/runner/assignment-runresult.test.mjs
npm test
```

## Proofs And Exit

Persist the live proof under the track's `proofs/P01.2/`; redact credentials but
retain commands, ids, selected policy provenance, paths, hashes, and assertions.
A stranger must reconstruct the session and its dynamic consult from disk and a
second invocation must perform zero duplicate runs.

Close with AC-I001, AC-I002, AC-I006, AC-I007, AC-I008, and AC-I009 deferral
rows. Work-attached mutation remains deferred-preserved.

## Risks / Rollback

Atomicity is the principal risk. Reuse repository lock/`wx` claim patterns; do
not invent timestamp ownership. The direct cutover is safe because there is no
public mission-lite caller and no released customer state; Git is the rollback.
