# Current Cell

Cell: P03.2
Status: done (closes Phase 03 and this plan's entire MVP1/MVP2 scope)
Owner: Coordinator
Last updated: 2026-09-03
Next action: none -- plan closed

## Goal

Implement Phase 03 R5-R7, the LAST cell of this plan's MVP1/MVP2 scope: a
real, synchronous, no-Work standalone Master Coordination proof through the
public CLI/headless door (R5); the consolidated negative-proof battery
across every accepted contract clause this track has implemented (R6); and
a surface-readiness doc for the future thin launcher, without building one
(R7).

**Concrete gap this cell must close first, discovered during cell prep:**
`src/verbs/coordination/run.mjs` (the R5 door) currently has NO way to call
`authorizeDeclaredOperation` or `recordDriverDisposition` — it only wires
`dispatchPrimaryTask`/`dispatchDeclaredOperation`/`dispatchResearchFanOut`.
Without a request-shape extension to reach those two P03.1 doors, R5's live
proof cannot exercise recheck or disposition at all. This is real
implementation work, not just a proof-writing exercise — read `run.mjs` and
`src/verbs/coordination/schema.mjs`'s step-type validation (`OPERATION_STEP_ALLOWED_KEYS`/
`FAN_OUT_STEP_ALLOWED_KEYS`/the `type` dispatch at line ~332) before
planning your approach.

## Non-Goals

- Do not implement a skill/slash-command surface, a thin launcher, or any
  new CLI subcommand beyond what's needed to reach `authorizeDeclaredOperation`/
  `recordDriverDisposition` from the existing `fgos coordination run`
  request shape. R7 is documentation only.
- Do not touch `core/coordination-protocols/group-cognition-framework.yaml`,
  `declared-consult.yaml`, or `independent-research-fan-out-fan-in.yaml`.
- Do not touch `src/runner/dispatch/**`.
- Do not touch any `docs/architect/agent-coordination/contracts/*.md` file.
- Do not fix the shipped-fixture fan-out taskKey collision, the four
  pre-existing session-wide caps' self-heal gap, the `dangling-ref`
  read-ordering race, the silent-discard guard's hard-guarantee-vs-advisory
  question, or the residual unsuffixed-key edge — all named forward gaps in
  `index.md`, none owned by this cell. If R6's negative-proof battery
  happens to exercise one of these paths, record the observation, don't fix
  it inline.
- Do not implement Work/git/repo mutation of any kind in the live proof —
  R5's own acceptance criterion is "no Work item, no repo/git mutation".

## Must Read

- `plans/260903-0004-step09-group-thinking-mvp1-mvp2/phase-03-recheck-disposition-live-proof.md`
  (full R1-R7; you implement R5-R7. R1-R4 are already closed — read their
  Proof Matrix in `P03.1.md` for what the engine doors you're calling
  actually do).
- `docs/architect/agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/index.md`
  — the WHOLE file. Phase 02 and Phase 03 (R1-R4) Status sections, and
  EVERY "Forward Notes For Later Phases" entry — several are explicitly
  named P03.2 preconditions (the disposition scope-check gap, the
  artifact-revision-scoped recheck-lineage limit, the residual
  unsuffixed-key edge, MEDIUM-2's atomic-write fix and its still-open
  `dangling-ref` sibling). Know these before writing the live proof so you
  don't rediscover them as "new" findings.
- `docs/architect/agent-coordination/verification/step-09-group-thinking-mvp1-mvp2/P03.1.md`
  — full Proof Matrix, Review, and Red-Team sections for what
  `authorizeDeclaredOperation`/`recordDriverDisposition`/`dispatchDeclaredOperation`'s
  recheck path/`replaySession`'s new return shape actually guarantee.
- `docs/architect/agent-coordination/contracts/coordination-session.md`'s
  full "Driver-Authorized Optional Operations And Recheck" section and
  "Required Negative Tests" list — R6's battery is graded against the
  latter literally; do not invent a different negative-test list.
- `plans/260903-0004-step09-group-thinking-mvp1-mvp2/phase-03-recheck-disposition-live-proof.md`'s
  own "Tests First" list (live request with no Work creates candidate,
  review, red-team, revision, recheck, and final close records; no session
  event or Assignment contains forbidden Work lifecycle mutation; fixture
  proof rejects hidden context and unauthorized optional operation).
- `src/verbs/coordination/run.mjs` (the R1/R5 CLI+headless door — read it
  fully, including its own header comment about why it is the ONLY place a
  coordination request becomes engine calls) and `src/verbs/coordination/schema.mjs`
  (the request-shape validator you will extend).
- `src/verbs/coordination/show.mjs` (read-only surface; P03.1's own Gaps
  note says its return shape is what should read `replaySession`'s new
  `assignments`/`results`/`dispositions` fields — decide whether R5's own
  acceptance needs this or whether it's a clean forward note).
- `core/coordination-protocols/standalone-master-coordination-loop.yaml`
  (Phase 01's own fixture — the graph shape R5's live proof runs against:
  worker-only actors, doer/reviewer/red-team, phase-produce ->
  phase-first-pass (review+red-team required) -> phase-revision
  (revise-candidate) -> phase-recheck (reviewer-recheck + red-team-recheck)).
  Check whether its `reviewer-recheck`/`red-team-recheck` operations already
  declare `activation: {mode: driver-authorized}` — if not, that is this
  cell's own concern (P01.1's Gaps section noted they "currently
  materialize identically to the required first-pass operations" pending
  Phase 02's activation field, which now exists).

## May Inspect

- `src/runner/coordination/{session-engine,store,replay,schema}.mjs`
  (read-only — these are P03.1's closed surface; call their existing
  exports, do not modify them unless R6's negative battery finds a genuine
  new defect, in which case STOP and report rather than fixing unilaterally).
- `test/runner/coordination-recheck-disposition.test.mjs`,
  `test/runner/coordination-driver-authorization.test.mjs` (existing
  coverage patterns to extend, not duplicate).

## Do Not Touch

- `core/coordination-protocols/group-cognition-framework.yaml`,
  `declared-consult.yaml`, `independent-research-fan-out-fan-in.yaml`
- `src/runner/dispatch/**`
- Any `docs/architect/agent-coordination/contracts/*.md`
- `src/runner/coordination/{session-engine,store,replay,schema}.mjs` (unless
  R6 finds a genuine defect — STOP and report first, per Non-Goals)

## Tests First

```bash
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  'test/runner/flow-definition*.test.mjs' 'test/runner/coordination*.test.mjs' \
  'test/verbs/coordination*.test.mjs'
```

Required coverage (from the phase file's Tests First list, scoped to
R5-R7):

- a live, synchronous request with NO Work creates candidate, review,
  red-team, revision, recheck, and a final close record, run through the
  REAL `runCoordinationUseCase` door (not a hand-rolled engine-call
  sequence);
- no session event or Assignment contains any forbidden Work lifecycle
  field (`FORBIDDEN_SESSION_FIELDS`) anywhere in that live run;
- the fixture proof rejects hidden context (a context ref outside a grant)
  and an unauthorized optional operation, through the CLI/request door,
  not just the engine door P03.1 already covered;
- the full "Required Negative Tests" list from `coordination-session.md`
  — cross-check each bullet against existing coverage first (most are
  already covered by P00-P03.1's own test suites); write NEW tests only
  for genuine gaps, and name explicitly in your report which bullets were
  already covered vs. newly closed here;
- a resumed run does not duplicate completed Assignments or reconsume an
  `invocationKey`, through the CLI door specifically (P03.1 proved this at
  the engine level; R5's own acceptance wants it proven at the door this
  cell opens).

Run the full suite before closing:

```bash
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'
```

Known baseline: 7 failures by name (index.md's Baseline table), plus
occasionally one extra load-induced live-subprocess timing flake (differs
run to run — re-run any extra failure in isolation before treating it as
new; this pattern has now been confirmed four times across P02.2 and
P03.1).

## Acceptance

- R5: `fgos coordination run` (or the headless adapter door) drives one
  live, synchronous, no-Work request through
  `standalone-master-coordination-loop.yaml`'s full shape — candidate,
  first-pass review+red-team, authorized revision, authorized recheck,
  disposition, and close — creating no Work item and performing no
  repo/git mutation. The verification directory records the live run:
  command output summaries, session id, assignment ids, result refs,
  artifact refs, disposition refs.
- R6: the accepted contract's "Required Negative Tests" list is covered,
  cross-referenced explicitly against what P00-P03.1 already proved (most
  of it), with new tests only for genuine gaps.
- R7: a short doc records the future thin-launcher surface shape without
  implementing one; no new skill/slash-command file created.
- A resumed run does not duplicate completed Assignments or reconsume an
  `invocationKey` — proven through the door this cell opens.
- No Work/git/repo mutation occurred anywhere in the standalone proof.
- Final docs point from the Step 09 proposal/baseline to this verification
  index (small doc-link check, not new content).
- Full test suite: no new failure beyond this track's recorded baseline.
- This cell's trace records anything genuinely deferred (there should be
  very little — this closes the plan).

## Bug Taxonomy

- A `show` command (or any read surface touched while wiring R5's request
  shape) gaining a mutation/external-effect side path — `show.mjs`'s own
  header comment states this as a hard invariant; do not weaken it while
  extending anything nearby.
- Silently accepting a request-shape field that has no real effect (the
  exact pattern `run.mjs` already refuses explicitly for fan-out actor
  policy overrides) — if you add a request field to reach
  `authorizeDeclaredOperation`/`recordDriverDisposition`, make sure every
  field you accept actually reaches the engine call, or refuse it loudly
  the same way.
- Writing a negative-proof battery that re-tests what P00-P03.1 already
  proved at the engine level as if it were new — cross-reference first,
  extend only genuine CLI-door-specific gaps.
- Letting the live proof create ANY Work item, git commit, or worktree
  mutation, even transiently — this is the one invariant every phase in
  this whole track has held, and the live proof is exactly where a mistake
  would be easiest to make and hardest to notice.
- Re-deriving or reinterpreting `coordination-session.md`'s contract text
  instead of implementing it literally — if the request-shape extension
  needed to reach `authorizeDeclaredOperation`/`recordDriverDisposition`
  seems to require a contract-level decision (a new field shape, a new
  event kind), STOP and report rather than inventing one — this cell's own
  Non-Goals forbid touching the contracts.

## Trace Update

Doer writes findings/evidence into `P03.2.md` (Proof Matrix, Commands,
Gaps). Coordinator writes Review/Red-Team disposition and close verdict.
Closing this cell closes Phase 03 and this plan's entire MVP1/MVP2 scope.
