# Track: step-09-group-thinking-mvp1-mvp2

Plan: `plans/260903-0004-step09-group-thinking-mvp1-mvp2/plan.md`
Branch: `step-09-group-thinking-mvp1-mvp2`
Base ref: `cd5ddeb9` (recorded after two preservation commits landed
pre-existing uncommitted prep work found in the working tree at track start —
see "Preservation Commits" below — not the literal commit the branch was cut
from, `cf63f28c`; this keeps every cell's `BASE_REF..HEAD` diff clean going
forward instead of always including the large pre-existing docs rewrite)
Test command: `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'`

## Preservation Commits

Before any cell work, `git status` on the inherited branch
(`step-08-standalone-coordination`, already closed) showed a dirty tree: a
prior architect-docs restructuring session had rewritten
`architecture-intent.md`, split the old step-09 proposal into
`step-09-group-thinking-substrate.md` (this track's own scope doc) and
`step-10-coding-domain-adoption.md`, added `component-authority-boundary-map.md`,
and updated cross-linking READMEs/AGENTS.md/CLAUDE.md/reading-map.md, plus this
plan's own `plan.md`/phase files — none of it committed yet. All of it is
directly this track's own prerequisite material (exactly the SCOPE_DOCS this
plan cites), not unrelated work, so it was preserved via two commits on the
new branch rather than discarded or left dangling:

- `b52e0165` — docs(architect): split step-09 into group-thinking substrate
  and step-10 coding-domain adoption
- `cd5ddeb9` — docs(plans): add step-09 group-thinking substrate MVP1/MVP2 plan

Left untouched (pre-existing, unrelated, not committed): `.agentkit/`,
`.claude/agents/*.md`, `.fgos/events/*.jsonl` (AgentKit installation/runtime
artifacts), `docs/architect/component-boundary/tmp/{CONTEXT,DISCUSSION}.md`
(scratch/working draft, not accepted content), leftover `plans/*/reports/*`
untracked report files from the already-closed step-07/step-08 plans.

## Baseline

`FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'` run at
BASE_REF, exit code 1. Full log: `proofs/baseline-full-test-run.log`. 8 known
baseline failures, none touching this track's surfaces
(`src/runner/coordination/**`, `src/runner/definitions/**`,
`core/coordination-protocols/**`, `src/verbs/coordination/**`):

| # | Test | File | Cause class |
|---|---|---|---|
| 1 | ask/answer round-trip on a genuinely legacy durable-doing item (no claim) | `test/cli/fgos-intake-4.test.mjs:318` | assertion, unrelated (fgos ask/answer) |
| 2 | e2e pr-gate (a) runner item full loop | `test/e2e/pr-gate.test.mjs:226` | assertion, unrelated (PR-gate e2e verify-skip wording) |
| 3 | e2e self-improve loop full contract (D1-D17) | `test/e2e/self-improve-loop.test.mjs:174` | assertion, unrelated (self-improve loop verify-skip wording) |
| 4 | resolvePlan skips the risk-heavy gate (tsk-wve D1) | `test/intake/plan.test.mjs:953` | assertion, unrelated (intake plan) |
| 5 | resolvePlan skips requiring a verdict, mode "tiny" | `test/intake/plan.test.mjs:1198` | assertion, unrelated (intake plan) |
| 6 | resolvePlan skips for mode "small" | `test/intake/plan.test.mjs:1215` | assertion, unrelated (intake plan) |
| 7 | resolvePlan caller-supplied decompose verdict (D1) | `test/intake/plan.test.mjs:1588` | assertion, unrelated (intake plan) |
| 8 | herdr-spawn adapter (LIVE) real agy-herdr binaries | `test/runner/herdr-spawn-adapter.test.mjs:562` | live-executor timeout (60s), environment-dependent |

This list may only shrink; any new failure beyond it blocks cell close.
5037 tests, 5024 pass, 8 fail, 5 skipped, duration ~184s.

## Phase / Requirement Matrix

| Phase | Requirements | Status |
|---|---|---|
| 00 | R1-R4 | done |
| 01 | R1-R6 | done |
| 02 | R1-R8 | done |
| 03 | R1-R7 | done |

## Active Cell

None. **All cells closed — this plan's entire MVP1/MVP2 scope is done.**

## Next Action

None. Any further work (the shipped-fixture fan-out HIGH, the pre-existing
session-wide-caps self-heal gap, the crash-bricked-`coordinationId` gap,
R8's driver-handoff limitation, or a genuine thin-launcher surface) is a
NEW track, not a continuation of this one — see "Forward Notes For Later
Phases" below for the full list this plan hands off.

## Cell Log

| Cell | Requirements | Status | Commit |
|---|---|---|---|
| P00.1 | Phase 00 R1, R2, R3, R4 (closes Phase 00) | done | `e579fc6a` |
| P01.1 | Phase 01 R1, R2, R3, R4, R5, R6 (closes Phase 01) | done | `bec5e7f8` |
| P02.1 | Phase 02 R1, R2, R3, R4 | done | `82610e7f` |
| P02.2 | Phase 02 R5, R6, R7, R8 (closes Phase 02) | done | `bc65df22` |
| P03.1 | Phase 03 R1, R2, R3, R4 | done | `6c41b561` |
| P03.2 | Phase 03 R5, R6, R7 (closes Phase 03) | done | (pending commit) |

## Phase 00 Status

**CLOSED.** R1-R4 via P00.1. Promoted the MVP1/MVP2 slice of the
discussion-status Step 09 substrate proposal into the two Accepted contracts
(`coordination-session.md`: `operation-authorized`/`driver-disposition-recorded`
events, `invocationKey` idempotency, context-grant enforcement, recheck-vs-
retry; `flow-definition.md`: binding-scoped `activation.mode`/
`maxInvocations`), plus a one-sentence prompt-boundary cross-reference in
`coordination-foundation-baseline.md` and a confirmed-correct (no-edit-needed)
read of `component-authority-boundary-map.md`.

Went through 1 Reviewer round (1 MEDIUM + 2 LOW — a self-contradictory MVP3+
scope disclaimer against the substrate's own MVP numbering, a silent
`targetArtifactRef`/`artifactRevision` naming divergence, a paraphrased
cross-reference — all fixed, re-confirmed resolved by the same Reviewer)
followed by 1 Red-Team round (1 HIGH + 3 MEDIUM + 2 LOW — most notably a
genuine recheck/taskKey-collision loophole: nothing required a recheck's
idempotent-claim key to differ from the original reviewing Assignment's own
key, so a future implementer faithfully reusing this contract's own cited
`wx`/taskKey precedent could have a "recheck" silently collapse into a retry
of the original Assignment — closed with a hard "MUST incorporate the new
revision/invocationKey" requirement; the 3 MEDIUMs were the same pattern,
outcome guarantees stated without the durability/scope qualifier already
modeled elsewhere in the same contracts, `invocationKey` scope,
`operation-authorized`-vs-terminal-transition atomicity, `maxInvocations`
resume counting — all fixed, re-confirmed resolved by the same Red-Team
re-attempting each named exploit against the post-fix text). No HIGH/MEDIUM
remains open. Docs-only cell throughout — `group-cognition-framework.yaml`
and `assignment-run-runresult.md` confirmed at zero diff by Doer, Reviewer,
Red-Team, and Coordinator independently.

## Phase 01 Status

**CLOSED.** R1-R6 via P01.1. Added
`core/coordination-protocols/standalone-master-coordination-loop.yaml` — a
static `CoordinationProtocol` FlowDefinition fixture: worker-only actors
(doer/reviewer/red-team/fixer, no coordinator), six operations, graph
`phase-produce -> phase-first-pass (review+red-team required) ->
phase-revision (revise-candidate) -> phase-recheck (reviewer-recheck +
red-team-recheck)`, no topology, no Work fields. Zero `src/` diff — the
existing unmodified schema/loader was already sufficient for the static
skeleton. `revise-candidate`/`reviewer-recheck`/`red-team-recheck`
currently materialize identically to the required first-pass operations
(schema has no `activation` field yet — that's Phase 02's job); this is the
honest, undecorated R4 state, documented in the fixture's own header
comment and this cell's Gaps section, not faked.

Went through 1 Reviewer round (CLEAN — 2 non-actionable LOW notes: an
actor-id naming style divergence that correctly matches the authoritative
substrate spec over sibling-fixture convention, and a wider-than-phase-file
protected-fixture list, both non-issues) followed by 1 Red-Team round (1
HIGH + 1 MEDIUM + 1 LOW). The HIGH was a genuine, independently-confirmed
forward-looking finding, not a defect in this cell's own deliverable: this
fixture is the first in the repo to bind one actor to two different
operations at two graph positions, and `src/runner/coordination/
cohort-planner.mjs:307`'s `resolveActorOperation` (already live, wired into
`dispatchResearchFanOut`) resolves by first-match-on-actorId with no
operation/node disambiguation — meaning it can never correctly resolve the
second binding once cohort allocation is ever pointed at this fixture.
Correctly kept out of scope to fix in this docs/fixture-only phase (see
"Forward Notes For Later Phases" below); recorded as a Gap instead. The
MEDIUM + LOW (missing actor-binding and graph-shape test assertions) were
fixed and Red-Team-recheck-confirmed resolved. Full suite not required for
this cell (docs/fixture+test only, zero shared loader/schema diff); focused
suite 49/49 pass throughout.

## Phase 02 Status

**P02.1 CLOSED** (Phase 02 R1-R4; R5-R8 open as P02.2): implemented the
`activation` schema field (`src/runner/definitions/schema.mjs`), the
`operation-authorized` event with lock-shared Recovery-Rule-point-5
atomicity (`src/runner/coordination/{schema,store,replay}.mjs`), extended
`assignment-created` provenance (additive, agent-led path byte-identical),
and the R4 dispatch gate in `session-engine.mjs`'s `dispatchDeclaredOperation`,
matched on the full `(nodeId, operationId, targetActorId)` triple —
explicitly avoiding the `cohort-planner.mjs`-class under-disambiguation bug
Phase 01's Red-Team found.

Reviewer round (opus): APPROVE WITH CONCERNS, 2 MEDIUM + 3 LOW. MED-1 (the
disambiguation triple's own test coverage was weaker than the Proof Matrix
claimed — mutation-tested, only the degenerate actor-only shape was caught)
and LOW-1/LOW-2 (replay double-consumption guard parity; refusal message
observability) fixed and confirmed. MED-2 (a pre-existing, Phase-04-R5-era
reachability gap where `nodeId` validates but never selects) correctly
deferred as a forward gap, not fixed here.

Red-Team round (opus): **BLOCK, 1 HIGH + 1 MEDIUM**, both found and
confirmed by real multi-process/SIGKILL empirical reproduction, not code
reading. HIGH-1: `createSessionAssignment`'s self-heal path (crash-recovery
branch) skipped the lock-held authorization-consumption check that the
genuinely-new-taskKey path had — a real crash (24 real `SIGKILL`s, 3 hit
the window) raced against a real concurrent second dispatcher let ONE
`operation-authorized` authorization materialize TWO Assignments (10/11/7
double-consumptions out of 20/20/12 trials), after which the session's
event log threw `duplicate-ref` on every future read, permanently. This is
exactly the class of concurrency bug this track's step-08 history
(P01.2/P03.1/P03.2) established requires real multi-process reproduction to
find — invisible to the cell's own 320/320-passing sequential suite.
MEDIUM-1 (companion finding): the same write path accepted a fabricated
`authorizationId` (bricking the session later, at replay time, instead of
refusing at write time) and accepted `assignment-created` provenance
fields with no `authorizationId` at all (an unverifiable context grant).
Both fixed: a single shared `assertAuthorizationSpendable` helper now gates
both the self-heal and genuinely-new-taskKey branches identically (checking
both "does the authorization event really exist" and "is it already
consumed by a DIFFERENT Assignment"), plus a schema-level rule that the
provenance field group travels together or not at all. Red-Team recheck
(opus): **CONFIRMED-RESOLVED** — 0 double-consumptions in 46 real
multi-process trials against the fix (vs. 10-11/20 before), with the
previously-fatal lock-ordering hit 18 times and refused cleanly every time;
genuine idempotent resume independently re-verified still works. Cell
safe to close.

Full suite: 5090 tests, 5078 pass, 7 fail — all match this track's recorded
baseline by name (the herdr-spawn live-timeout item, environment-dependent,
was simply absent that run); no new failure. Focused glob 324/324 pass.

**P02.2 CLOSED (Phase 02 R5-R8; closes Phase 02).** Implemented all four:
`invocationKey` consumed exactly once, session-wide, not per-binding;
context-grant enforcement as a real gate inside the dispatch path (not
advisory); `activation.maxInvocations` counted fresh from on-disk events,
binding caps narrowing but never widening the session-wide aggregate
bounds; and driver-authority identity pinned to the session's own
`provenanceRoot.writerId`.

Reviewer round (opus): APPROVE WITH CONCERNS, 4 MEDIUM + 4 LOW. MED-1
(provenance companion fields never checked against the authorization they
name — forgeable), MED-2 (binding cap enforced on only one of two writing
branches — P02.1's own HIGH-1 class recurring), and MED-4+L1 (grant-scope
check whole-string-prefix-anchored, missing path-form refs; duplicated
rather than shared with `validateConsultProposal`) all fixed and confirmed.
MED-3 (default taskKey makes a second invocation a silent no-op) given a
minimal non-recheck safety guard, full fix correctly deferred to Phase 03.
R7 and R8 rulings recorded (R7: issuance layer deliberately stricter than
the contract's literal "consumed" wording; R8: comparison accepted but NOT
recorded as closed — satisfied-modulo-a-named-follow-on, per the phase
text's own escape clause). Reviewer recheck: CONFIRMED-RESOLVED on all
four MEDIUMs, plus one coverage regression the fix round introduced (R5's
dispatch-side key check lost its only test when MED-1 started intercepting
the same forged shape one line earlier) closed with a dedicated forged-log
test reaching the check the one way MED-1 cannot.

Red-Team round (opus): **APPROVE WITH CONCERNS, 2 MEDIUM + 4 LOW**, no
BLOCK — ~260 real multi-process trials plus 30 genuine `SIGKILL`s against
every lock-held check this cell added or moved, all held (0
double-consumptions, 0 cap overruns, 0 bricked sessions). MEDIUM-1: the new
MED-3 guard could not fire on a FAN-OUT taskKey collision (one operation,
two actors) — worse than the original bug, silently substituting one
actor's Assignment/RunResult for another's. MEDIUM-2: the MED-4 fix checked
a `coord_` naming CONVENTION rather than disk existence, missing a real
foreign session named without that prefix. Both fixed (broadened guard
condition; existence-based scope check mirroring the `asgn_` half) and
Red-Team-recheck-confirmed resolved by re-running the ORIGINAL reproduction
scripts against the fixed tree, plus a fresh mutation-proof that all three
new regression tests discriminate. One LOW raised IN the recheck (the fixed
guard's own crash-recovery exemption term was mutation-silent/untested)
closed with a dedicated crash-state regression test, Coordinator
mutation-verified. Also surfaced, correctly out of this cell's scope: the
sibling session-wide-cap gap is worse than previously recorded (12/20 real
concurrent trials overran a cap of 1, not just a sequential gap — see
below), and a pre-existing HIGH-severity defect live in a shipped fixture
(see below).

Full suite (final): 5116 tests, 5104 pass, 7 fail — exactly this track's
recorded baseline by name; no new failure. Focused glob 350/350 pass.

## Phase 03 Status (in progress)

**P03.1 CLOSED (Phase 03 R1-R4; R5-R7 open as P03.2).** Artifact refs
linked (not re-stored) through the existing RunResult/evidence path;
recheck as a genuinely new Assignment via a ROOT-CAUSE fix to the default
`taskKey` derivation (`declared:<op>[:round-N]:auth:<authorizationId>`,
both taskKey branches), closing the gap P02.2 deliberately deferred;
`driver-disposition-recorded` as a new driver-identity-pinned ledger door
sharing R8's identity check (not a second copy); `replaySession`
reconstructing `assignments`/`results`/`dispositions` alongside the
pre-existing `authorizations`.

Reviewer round (opus): APPROVE WITH CONCERNS, 3 MEDIUM + 6 LOW. MEDIUM-1
(a keyless repeat with ≥2 consumed authorizations silently guessed the
most-recent one — a real regression this cell introduced, converting a
loud P02.2 refusal into a silent wrong-value substitution) and MEDIUM-2
(the topology-edge taskKey branch was entirely untested and mutation-silent
— third recurrence of "Proof Matrix claims coverage the tests don't have"
this phase alone) both fixed and confirmed. MEDIUM-3 (R4's "recheck
lineage" claim exceeded what replay actually reconstructs) resolved by
correcting the claim rather than extending the contract — ruled correctly
out of this cell's authority to add a predecessor-ref field unilaterally.
All five of the Doer's flagged interpretation items ruled on and adopted.
Recheck: APPROVE, both MEDIUMs independently re-verified and
mutation-proven; two cosmetic LOWs from the fix round itself (an audit-label
slip, a stale JSDoc) folded in.

Red-Team round (opus): **APPROVE WITH CONCERNS, 2 MEDIUM**, no BLOCK —
~330 real multi-process dispatches, 40 genuine `SIGKILL`s (16 confirmed
crash states), and a pre-cell (HEAD) comparison tree to separate new
defects from pre-existing ones by evidence. MEDIUM-1 (this cell's own
code): `recordDriverDisposition`'s idempotency was JSON key-order sensitive
on the caller-supplied `authorizedBy`, silently duplicating a disposition
record. MEDIUM-2 (pre-existing, fixed in-cell as a direct P03.2
prerequisite): `session.json` was written non-atomically, letting an
unlocked reader observe a torn file and throw `corrupt-log` against a
healthy session — reproduced up to ~2.45M read attempts, one realistic-rate
trial genuinely aborting a legitimate dispatch. Both fixed (canonicalized
idempotency compare; atomic temp-file+rename write, mirroring the pattern
`src/state/events.mjs` already uses). Red-Team's three handed-over
concurrency attack targets (a concurrent MEDIUM-1 variant, pre-lock
snapshot staleness, the residual unsuffixed-key edge) and the newly-in-scope
`edge.maxRounds` target were all attacked with real multi-process trials
and could NOT be broken as new defects — one genuine timing-dependent race
was found (Target 2) but proven identical on pre-cell HEAD, not introduced
by this cell. Recheck: APPROVE, both MEDIUMs independently re-verified
(MEDIUM-2: 0 corrupt-log errors in 7.27M reads across 27 real dispatches
and 25 genuine SIGKILLs, vs. 7 on the unfixed control); two more cosmetic
LOWs from the fix round (an unguarded property access reintroducing a
TypeError class, two more audit-label slips) fixed.

Full suite (final): 5134 tests, 5122 pass, 7 fail — exactly this track's
recorded baseline; no new failure. Focused glob 368/368 pass.

**P03.2 CLOSED (Phase 03 R5-R7; closes Phase 03 and this plan's entire
MVP1/MVP2 scope).** A real, live, synchronous no-Work run through the
actual public CLI/headless door (`fgos coordination run`) drove
`standalone-master-coordination-loop.yaml`'s full shape end to end:
produce → review + red-team (required) → authorize revision → revise →
rejecting disposition → authorize reviewer recheck → reviewer recheck →
authorize red-team recheck → red-team recheck → accepting disposition →
close. Six Assignments, six `result-linked`, three `operation-authorized`,
two `driver-disposition-recorded`, zero `run-retried` — the original
review's RunResult provably never superseded by its recheck. No Work
event, no Work item, no `.git` mutation, measured three ways including
inside a real git repo carrying a pre-existing Work item. The CLI's
request shape was extended with two new step types (`authorize`,
`disposition`) reaching P03.1's own lock-held engine doors — no new CLI
subcommand. All 17 bullets of the accepted contract's "Required Negative
Tests" list tabulated against a named covering test; 4 genuine door-level
gaps closed, the rest confirmed already covered at the engine level. A
Coordinator-approved, Reviewer/Red-Team-confirmed-sound edit gave the
shipped `standalone-master-coordination-loop.yaml` fixture real
`activation: {mode: driver-authorized}` bindings for the first time,
completing a deferral P01.1 recorded. `thin-launcher-surface-readiness.md`
documents the future surface shape without implementing one.

Reviewer round (opus): APPROVE WITH CONCERNS, 1 MEDIUM + 8 LOW. MEDIUM
(an idempotent `authorize` step echoed the repeat caller's own payload
instead of the persisted authorization — a real regression this cell
introduced) fixed and confirmed with an independently-designed
reproduction stronger than the original regression test. 6 of 7 original
LOWs fixed at source (one comment/rationale correction needed no code
change, one recorded as a documented limitation per the Reviewer's own
call); a fix-round LOW (stale header comment) fixed too.

Red-Team round (opus): **APPROVE, 0 HIGH, 0 MEDIUM, 4 LOW** — ~473 real
OS processes across 133 barrier-synchronised trials plus 40 genuine
`SIGKILL`s. Both handed-over concurrency targets (racing `openSession` on
one `coordinationId`; the `Promise.all`-vs-real-concurrency gap behind
contract bullet 1) empirically settled clean, plus two bonus targets
(MEDIUM-1's unlocked readback; P02.1's HIGH-1 shape against the newly
driver-authorized shipped fixture) also held. One real in-scope defect
(LOW-2: `resolveRef`'s label lookup resolved prototype-chain names instead
of refusing them — fixed, `Object.create(null)`) and two genuine
pre-existing/new-dependency gaps recorded as forward notes below
(LOW-1: a crash window that permanently bricks a `coordinationId`; LOW-3:
the shipped fixture's new bindings have no per-binding invocation cap).
One finding (the Reviewer's own LOW-7, "no git mutation" proof was
indirect) got EMPIRICALLY CLOSED in the cell's favor rather than merely
confirmed — Red-Team ran the live proof inside a real repo with a real
Work item and found zero changes outside `.fgos/`.

Full suite (final): 5159 tests, 5147 pass, 7 fail — exactly this track's
recorded baseline; no new failure. Focused glob 425/425 pass.

**This closes the entire step-09-group-thinking-mvp1-mvp2 track.** Six
cells (P00.1, P01.1, P02.1, P02.2, P03.1, P03.2), each through a full
Doer→Reviewer→Red-Team loop with empirical (not merely argued)
concurrency evidence throughout. Every finding across all six cells was
either fixed, or is recorded below as a named forward note for whichever
future track picks it up next.

## Forward Notes For Later Phases

**cohort-planner.mjs actor disambiguation (from Phase 01's Red-Team).**
`resolveActorOperation` (`src/runner/coordination/cohort-planner.mjs:307-316`)
resolves an actor's wired operation by first-match scan keyed on `actorId`
alone, with no `operationId`/`nodeId` disambiguation. `standalone-master-
coordination-loop.yaml` is the first fixture where one actor (`reviewer`,
`red-team`) is bound to two different operation ids at two different graph
nodes — `resolveActorOperation` structurally can never return the second
binding (`reviewer-recheck`/`red-team-recheck`), always the first
(`review-candidate`/`red-team-candidate`). Currently masked because the
paired operations share identical `role`/no `policy`/`capabilities`; breaks
silently (wrong-value substitution, not a crash) the moment a future cell
gives a recheck operation its own `policy`/`capabilities`. **Before any
future phase points `planCohort`/`resolveActorOperation` at this fixture,
re-key that function by `(nodeId, operationId, actorId)`, mirroring
`session-engine.mjs`'s already-correct `resolveDeclaredOperationActor`
(keyed by `operationId`).** Full detail: `P01.1.md`'s Red-Team HIGH-1 and
Gaps section. Not a blocker for Phase 01/02/03 as currently scoped (no
phase's Files list touches `cohort-planner.mjs`), but must be checked
before any phase introduces cohort allocation for this fixture.

**`resolveDeclaredOperationActor` node selection (from P02.1's Review
MED-2).** The same function family, a related but distinct gap:
`resolveDeclaredOperationActor` (`session-engine.mjs`, pre-existing Phase 04
R5) resolves an actor to the FIRST graph-order match with no `nodeId`-based
SELECTION (its `nodeId` parameter only validates a match already found) —
so the accepted contract's explicitly-blessed "same operation id, `required`
at one graph position and `driver-authorized` at another" pattern is
unreachable at runtime whenever both positions bind the SAME actor
(confirmed empirically: such a definition validates but the second
position's activation can never gate anything). Not a gate bypass, not
currently exploitable (no shipped fixture uses this shape). Before any
future phase relies on this pattern being reachable, thread `nodeId` into
`resolveDeclaredOperationActor` as a real third selector, or reject the
ambiguous shape at `validateGraph` time instead. Full detail: `P02.1.md`'s
Review MED-2 and Gaps section.

**`session.json` reads/writes need the same care `events.jsonl` already
gets — two distinct mechanisms, one now fixed, one still open.**

1. *Non-atomic write, unlocked reader sees a torn file (from P03.1's
   Red-Team MEDIUM-2) — RESOLVED.* `writeManifestRaw` (`store.mjs`) used a
   plain `writeFileSync` (O_TRUNC then write) while every reader
   (`readManifest`, the first statement of every dispatch; `replaySession`)
   reads outside the events lock by design. A concurrent reader could
   observe a truncated file mid-write and throw `corrupt-log "not valid
   JSON"` against a perfectly healthy session — reproduced end-to-end (up
   to ~2.45M read attempts across three probe shapes; one realistic-rate
   trial genuinely aborted a legitimate dispatch). Fixed in P03.1: writes
   now go to a same-directory temp file, then `fs.renameSync` — atomic on
   POSIX, so a reader always sees either the complete old file or the
   complete new one.
2. *Unlocked-replay-vs-concurrent-commit spurious `dangling-ref` (from
   P02.1's Red-Team LOW-1) — STILL OPEN, a different mechanism.*
   `replaySession` reads `session.json` before `events.jsonl` while
   `completeAssignmentRegistration` appends the event before writing the
   manifest — an unlocked reader straddling a concurrent commit can still
   throw a spurious `dangling-ref` even with MEDIUM-2's fix (measured 4-12
   per 3-second window against 2 concurrent dispatchers in 18/20 trials;
   final replay always clean). Predates this track entirely. Not fixed —
   would mean re-ordering a pre-existing read sequence, or holding a
   shared/read lock, neither owned by any cell so far. Full detail:
   `P02.1.md`'s Red-Team LOW-1.

**Pre-existing session-wide caps share the self-heal-branch gap MED-2 fixed
for the binding cap alone (from P02.2's Review; UPGRADED by Red-Team with
real-concurrency evidence).** `maxAssignmentsForSession`,
`maxRoundsForSession`, `maxConcurrencyForSession`, and `maxRoundsForActor`
(`store.mjs`'s `createSessionAssignment`) are all checked only on the
genuinely-new-taskKey path, below the same claim-file branch the binding
invocation cap used to skip too. This is not merely a sequential/theoretical
gap: Red-Team's real 2-process reproduction against `maxAssignmentsForSession:
1` materialized TWO Assignments in **12 of 20 genuine concurrent trials**
(every trial where the new-taskKey process won the lock), replay staying
clean each time — a silent overrun live on the declared dispatch path today
(`dispatchDeclaredOperation` forwards `maxAssignmentsForSession`
unconditionally). P02.2 fixed only the binding cap (its own R7 scope); these
four pre-existing siblings still share the gap, now demonstrated to be a
real-concurrency defect, not a hypothetical one. Before any future phase
relies on these caps holding under a crash/self-heal sequence, apply the
same fix (call each check on the self-heal branch too, using its own
exemption) — the MED-2 fix's own 0-overrun result under the identical race
shape is the proof this closes it.

**HIGH SEVERITY, PRE-EXISTING, LIVE IN A SHIPPED FIXTURE TODAY — flagged for
a separate tracked item (from P02.2's Red-Team round).**
`core/coordination-protocols/independent-research-fan-out-fan-in.yaml`'s
fan-out cohort (one operation wired to two actors via a declared topology
edge, `required` activation, no authorization involved) silently collapses
to ONE researcher: `dispatchDeclaredOperation`'s round-scoped default taskKey
for topology-edge dispatches (`declared:${operationId}:round-${round}`,
Phase 04 R5-era, predates this whole track) is `targetActorId`-blind, so
both actors' dispatches collide on one claim and the SECOND researcher never
runs — its result silently reported as the caller's own.
`cohort.distinctProviderFamilies: 2`/`independence: isolated-until-fan-in`
are unenforceable through this door as a result. This is the SAME root
cause as the MEDIUM-1 fan-out finding P02.2 fixed for the driver-authorized
branch, but in the `required`/topology-edge branch instead, on a SHIPPED,
already-used fixture, outside any current cell's Files list. Fix direction:
thread `targetActorId` into the topology-edge taskKey derivation too (same
shape as the driver-authorized fix). Independent of Phase 03's recheck-
semantics work — does not need to wait for it.

**RESOLVED by P03.1.** Default `taskKey` derivation for a driver-authorized
binding now carries `:auth:<authorizationId>` on both taskKey branches
(no-incoming-edge and the round-scoped topology-edge one), so a second
authorized invocation reaches a genuinely NEW Assignment instead of
colliding — the fix this note originally asked for. Superseded by two new
items below from P03.1's own Review (a real regression the fix introduced,
now fixed, plus a P03.2 precondition it surfaced).

**A keyless repeat dispatch must not guess which prior invocation the
caller means (from P03.1's Review, MEDIUM-1 — FIXED in P03.1, noted here
only so a future reader does not reintroduce it).**
`resolveTaskKeyAuthorization`'s fallback, when no fresh authorization is
pending and MORE THAN ONE has already been consumed at a binding, now
refuses (returns `null`, which cascades to the existing "no unconsumed
operation-authorized event" error) rather than guessing the most recent —
guessing would have silently handed a keyless caller a DIFFERENT
invocation's Assignment/RunResult under its own key.

**P03.2 precondition: recheck lineage in `replaySession`'s return shape is
artifact-revision-scoped and best-effort, not a guaranteed original→recheck
edge (from P03.1's Review, MEDIUM-3).** The `assignments[].authorizationId
→ authorizations[].targetArtifactRef` join is the only link replay
reconstructs, and `targetArtifactRef` is OPTIONAL on `operation-authorized`
— omit it and replay carries no link at all. There is no actual
original-Assignment → recheck-Assignment pointer in the shape. `show.mjs`
must not assume a stronger guarantee than this when rendering recheck
history; if a hard predecessor edge is genuinely needed, that is a new
contract decision, not something to add unilaterally.

**P03.2 precondition: a disposition's `targetRef`/`evidenceRefs` carry no
session-scope check yet (from P03.1's Review, ruling on the Doer's item
2).** Inert today (nothing reads them into a contract/prompt/gate), same
"close it when it is read" posture already applied to `targetArtifactRef`
in P03.1. If P03.2's `show.mjs` (or any future surface) renders a
disposition's refs into worker-visible context, the same
`assertRefsOwnedBySession` call belongs at that door first. Also noted: a
post-terminal disposition currently reads indistinguishably from a
legitimate one (no `ignoredDispositions` counterpart, deliberately —
Recovery Rule point 5's read-time neutralization is scoped to
`operation-authorized` specifically) — a renderer should mark it rather
than present it as authoritative.

**Handed to P03.2's Red-Team: two concrete concurrency targets (from
P03.1's Review, ruling on the Doer's item 4).** (a) A genuinely CONCURRENT
variant of the MEDIUM-1 shape above (P03.1's own regression test reproduces
it sequentially only) — two dispatchers deriving DIFFERENT keys from
DIFFERENT authorizations while racing the same claim directory. (b) The
pre-lock `replaySession` snapshot in `dispatchDeclaredOperation` now runs
earlier (ahead of the edge-branch checks) and is memoized for the gate, so
the advisory data the silent-discard guard reasons over is staler than when
P02.2's Red-Team measured that guard — the authoritative lock-held checks
are unchanged, which is why this is a target to attack rather than a
standing finding.

**Driver handoff is structurally impossible under R8's implemented identity
check (from P02.2's Review, R8 ruling; UPDATED by P03.2 — a shipped fixture
now declares `activation`).** `authorizedBy.id ===
manifest.provenanceRoot.writerId` means a session opened by writer A can
only ever be authorized by A — there is no `replaceDriver`/provenance-
transfer path (`replaceSessionActor` covers actors, not the driver). This
is now user-visible rather than latent: P03.2 gave
`standalone-master-coordination-loop.yaml` three `driver-authorized`
bindings, so a real live proof runs against it today, and a request file's
`writerId` is the only identity that can ever authorize or disposition in
the session it opens (recorded as R7 hole #4 in
`thin-launcher-surface-readiness.md`). Worth an explicit product decision
before this becomes load-bearing further: either accept
single-driver-for-session-lifetime as permanent, or give a future phase a
real writer-identity/handoff primitive.

**Provenance-vs-authorization consistency only checks fields that are
present, not that the descriptive companions are present at all (from
P02.2's Review recheck, MED-1 residual).** `assertAuthorizationSpendable`
(`store.mjs`) refuses any `operationId`/`nodeId`/`invocationKey`/
`contextGrant` that MISMATCHES the real issued event, but a provenance
naming only `authorizationId` (companions omitted entirely) still passes,
consuming a real authorization while recording no key and no grant. No
safety invariant is lost by this (one authorization still materializes at
most one Assignment; the binding cap still counts by `authorizationId`),
only R3's descriptive completeness. Same shape as P02.1's own MEDIUM-1b
rule (require the companion fields whenever `authorizationId` is present);
a future cell should apply that same rule here.

**Is the silent-discard guard a hard guarantee or advisory (from P03.1's
Red-Team, Target 2)?** `dispatchDeclaredOperation`'s guard against silently
discarding a fresher authorization reasons over a pre-lock, unlocked
`replaySession` snapshot — a real, reproduced 8/8 timing-dependent race
exists where the guard's decision can be stale (confirmed identical on
pre-cell HEAD, not introduced by P03.1). The guard's own comment reads as a
hard guarantee; its implementation is snapshot-dependent by construction.
A future cell should either move the check inside `createSessionAssignment`'s
lock (hard guarantee) or reword the comment to state it is advisory/
best-effort (matching what it actually is today) — not a defect either way,
but a documentation/design-intent gap.

**Residual unsuffixed-key edge in the P03.1 ambiguous-repeat guard (from
P03.1's Red-Team, Target 3) — P03.2 precondition.** When a prior dispatch
claimed the literal unsuffixed default key (`declared:<operationId>`) via
an explicit caller-supplied `taskKey`, a keyless ambiguous-repeat call can
still land on that claim and silently resume the wrong Assignment
(reproduced both sequentially and concurrently; identical on pre-cell HEAD
via the explicit-key route it already had, so not a P03.1 regression).
Reachable only when a caller deliberately supplies that exact string.
`src/verbs/coordination/run.mjs` forwards an optional `step.taskKey` —
P03.2 should be aware this specific string is not safe to reuse as a
"default" sentinel.

**A crash between `mkdirSync` and `writeManifestRaw` permanently bricks a
`coordinationId` (from P03.2's Red-Team, LOW-1, pre-existing).**
`openSession` (`store.mjs`) creates the session directory before writing
`session.json`; a crash in that narrow window (empirically reproduced: 12
of 40 genuine `SIGKILL`s) leaves a directory with no manifest —
unrecoverable, and self-contradictory across doors (`coordination run`
says the session "already exists"; `coordination show`/`replaySession` say
"no session found"). Fails closed, no corruption, but only a manual
`rm -rf` recovers it. Matters more now than when first possible: P03.2's
live proof ships a request file with a FIXED `coordinationId`, so one
badly-timed crash makes that exact file permanently unrunnable in that
workspace. Fix direction: write `session.json` (or at least a crash-safe
marker) before or atomically with the directory claim, mirroring the
temp-file-plus-rename discipline `writeManifestRaw` itself now uses
elsewhere in this same file (P03.1's MEDIUM-2 fix). Not owned by any cell
in this track; `store.mjs`'s `openSession` for whoever picks it up.

**The shipped fixture's three driver-authorized bindings declare no
`activation.maxInvocations` (from P03.2's Red-Team, LOW-3).**
`standalone-master-coordination-loop.yaml`'s `revise-candidate`/
`reviewer-recheck`/`red-team-recheck` bindings (added by P03.2) have no
per-binding cap — only the session-wide `maxRounds` default backstops
them (reproduced: 7 authorized-revision Assignments materialized from one
request before the session-wide default, not any binding cap, stopped an
8th). That session-wide cap family carries its OWN recorded gap (P02.2's
Red-Team: 12/20 real concurrent overruns via the self-heal branch) — so
this fixture's optional bindings now sit, for the first time, entirely
behind a cap family already known to be imperfect under concurrency. Not
exploitable through `fgos coordination run` today (one session per run,
no concurrent dispatchers can share it). Fix direction, if ever needed:
add `activation.maxInvocations` to the three bindings — a fixture
modeling decision, not a code fix, left for whoever next relies on bounded
round counts from this fixture under real concurrency.

Next: P03.1 (Phase 03 — recheck as a new Assignment, `driver-disposition-recorded`,
and a live no-Work standalone Master Coordination proof through the declared
fixture; closes this plan's MVP1/MVP2 scope).

## Phase 00 Audit Notes

- `coordination-session.md` and `flow-definition.md` are both `Design status:
  Accepted` today but contain zero MVP1/MVP2 vocabulary (`activation`,
  `operation-authorized`, `driver-disposition-recorded`, `invocationKey`,
  `grantedContextRefs`, recheck-vs-retry) — confirmed via full read, this is
  the real R1 gap.
- `architecture-intent.md` and `step-09-group-thinking-substrate.md` are both
  `Design status: Discussion` and already fully spell out the candidate MVP1/
  MVP2 shapes (substrate proposal §6-9). Phase 00's job is narrowing +
  promoting exactly the MVP1/MVP2 slice of that discussion text into the two
  accepted contracts above — not inventing new shape.
- `coordination-foundation-baseline.md` (Accepted) already points to Step 09
  for the group-thinking expansion (preservation commit `b52e0165`); no
  further edit required for R1 unless the Doer finds a gap.
- R2 (prompt boundary) is already satisfied by `master-coordinator.md`'s own
  pre-existing "Runtime Boundary" section (top of file) plus
  `architecture-intent.md` §18.4 — both state the playbook is manual-only and
  must not become runtime authority. No accepted-doc currently states this
  as canonical text; Doer should add one sentence to
  `coordination-foundation-baseline.md`'s "Deliberately Not Promoted" section
  cross-referencing the playbook's own boundary statement, rather than
  duplicating the prose.
- R3 (component authority) needs a read of `component-authority-boundary-map.md`
  against the placement claims in phase-00's R3 text; expected to already be
  correct (it was authored in the same prep session as this plan) — Doer
  confirms rather than assumes.
- R4 (no invariant reopening) is a negative constraint: Doer must not touch
  `group-cognition-framework.yaml`, `assignment-run-runresult.md`, or any
  budget/mutation-exclusivity language while writing R1-R3.
