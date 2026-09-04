# P10-KERNEL-FIX — Kernel fix for `classifySessionQuorum` (Phase 10)

Status: DONE | Cell owner: P10-KERNEL-FIX Doer | Last updated: 2026-09-04

Scope: user-authorized kernel change to `classifySessionQuorum`
(`src/runner/coordination/session-engine.mjs`), previously Do-Not-Touch for
every Phase 10 cell. Touches: `session-engine.mjs` (one new private helper,
`actorGatingOperationIds`, plus the classification body itself);
`test/runner/coordination-recovery-and-quorum.test.mjs` (one new
quorum-mechanism-level test); the three group-thinking-lite pack conformance
test files (each had exactly one test whose assertions encoded the bug as
expected behavior — inverted/extended, not deleted); and
`test/verbs/coordination-aggregation-surface.test.mjs` (two tests updated
after a genuine, previously-undocumented finding — see Gaps). No file under
`core/` was touched. `current-cell.md`/`index.md` untouched (Coordinator-owned).

## 1. Design Notes

### 1.1 The bug, precisely

`classifySessionQuorum` (session-engine.mjs) determined whether a required
`SessionActor` was "complete" by finding that actor's **first**
`assignment-created` event and checking only that one assignment's
settlement. `closeSessionByQuorum` — called unconditionally at the end of
every `runCoordinationUseCase` request (`run.mjs:526`) — transitioned the
session to terminal `completed` the instant every declared actor had one
completed assignment, regardless of how many more phases that actor (or the
protocol as a whole) still had declared. This is correct for a protocol
where every actor is bound to exactly one operation across the whole graph
(every mechanism built before Phase 10 has this shape). Phase 10's
group-thinking-lite protocols are the first mechanism to bind one actor to
**multiple** operations across **multiple** graph nodes, and that is where
the bug surfaced: P10.6 (RFC-Review-Lite), P10.7 (Nominal-Group-Lite), and
P10.8 (Delphi-Feedback-Lite) each independently found the same root cause
against a different protocol, and P10.7's own Red-Team escalated it to
CRITICAL by reproducing it live against the already-closed P10.6 protocol.

### 1.2 The naive fix, and why it is wrong — confirmed, not assumed

current-cell.md's own framing warned that "count every `required` binding,
ignore every `driver-authorized` one" might be the fix, but also warned it
might be wrong, and instructed investigating each protocol's real
`activation` fields rather than assuming. That investigation found the naive
framing insufficient in **both directions**, for real, concrete reasons:

- **It does not fix RFC-Review-Lite or Nominal-Group-Lite at all.**
  RFC-Review-Lite's blocking binding (`respond`) is `driver-authorized`, not
  `required` — `propose` (proposer-actor's only `required` binding) already
  settles on its own, so "wait for required only" reproduces the ORIGINAL
  bug unchanged (quorum still closes the instant `propose`+both `object`
  bindings settle, before `respond` is ever reachable). Nominal-Group-Lite is
  worse: facilitator-actor's **entire** binding set (`share`, `clarify`) is
  `driver-authorized` — under "ignore driver-authorized entirely," the
  facilitator would have **zero** gating bindings and count complete
  vacuously, closing the session even earlier than before the fix.
- **The opposite naive fix — "wait for every declared binding, required and
  driver-authorized alike" — regresses a REAL, already-shipped fixture.**
  `core/coordination-protocols/standalone-master-coordination-loop.yaml`
  declares `revise-candidate`/`reviewer-recheck`/`red-team-recheck` as
  `driver-authorized` with **no** `contextAccess.visibilityWindowRef` at
  all, and its own header comment says plainly: these are "the OPTIONAL
  positions of this loop... the driver decides whether a revision round is
  warranted at all." `test/verbs/coordination-launch-master-loop.test.mjs`'s
  own `coord_launcher_live` test already proves and depends on the session
  correctly staying open with `fixer` reported `missing` when the driver
  never authorizes a revision — an "always wait for driver-authorized too"
  rule would make `reviewer`/`red-team` ALSO block on their own
  never-invoked recheck bindings whenever a driver splits a real revision
  flow across two separate calls (traced concretely: a driver that
  authorizes+dispatches `revise-candidate` in one call, then
  `reviewer-recheck`/`red-team-recheck` in a later, separate call, would hit
  the identical "quorum closes before the second call" bug this fix exists
  to close — for a fixture where that would be a genuine regression, not a
  bug fix, since a first-pass approval with no revision is a real,
  documented completion path).

### 1.3 The actual rule

An actor's graph-declared operation bindings **gate** its own quorum
completion when either:

1. the binding is `activation.mode: required` (the pre-existing, unchanged
   semantics), **or**
2. the binding is `activation.mode: driver-authorized` **and** it ALSO
   declares `contextAccess.visibilityWindowRef`.

A `driver-authorized` binding with no visibility window does **not** gate —
it stays exactly as ungated/optional as it always was.

The distinguishing signal is real and machine-checkable, not invented for
this fix: every `driver-authorized` binding in RFC-Review-Lite
(`respond`) and Nominal-Group-Lite (`share`, `clarify`) declares
`contextAccess.visibilityWindowRef` — `driver-authorized` there is used
purely as MVP6's own access-control mechanism (the driver must explicitly
grant/authorize before the binding is legal to dispatch), on a FIXED,
always-reached pipeline position, never as a genuinely skippable branch.
`standalone-master-coordination-loop.yaml`'s three driver-authorized
bindings declare **no** visibility window at all — `driver-authorized`
there really does mean "the driver's own free-standing choice, may never
happen."

For an actor with **zero** gating bindings anywhere in the graph (every
binding it has, if any, is an ungated `driver-authorized` one — e.g.
`fixer`, whose only binding is `revise-candidate`), the classifier falls
back to the ORIGINAL "first assignment-created event for this actor,
anywhere" rule. This is what keeps `fixer` `missing` until its own sole
binding actually dispatches (`coord_launcher_live`).

**Correction (Fix Round 1, HIGH-3 — the fallback is NOT byte-identical for
a gating actor):** the original text here claimed this fallback was
"byte-for-byte unchanged" / "byte-identical to pre-fix behavior" for
"every single-op-per-actor fixture," reasoning that "a single-op actor's
one binding is always either the whole gating set or the whole fallback,
never both." That premise is true but the conclusion does not follow.
Gating-set semantics are not fallback semantics: the fallback accepts
**any** `assignment-created` event for the actor, however it arrived,
while the gating path (an actor with at least one gating binding) demands
an **operation-stamped, settled** Assignment (`resolveBindingOutcome` /
`assignmentServesOperation`). An actor with exactly one `required` binding
lands in the gating set, not the fallback, so its behavior genuinely
changes for one real, if currently unreached, shape: an Assignment created
through a non-stamping public door (`createSessionAssignment` in
`store.mjs`, `dispatchPrimaryTask`, `proposeConsult` —
`assertNoReservedOperationStamp` actively forbids a caller-supplied stamp
on any of those) can never satisfy a gating binding, so any
declared-protocol session whose work arrives through one of those doors
instead of `dispatchDeclaredOperation` is now permanently unclosable for
that actor. Confirmed currently **latent**: no `runCoordinationUseCase`
path reaches this today (the `agent-led` branch uses
`openStandaloneSession`, which carries no `definitionRef`, so it never
enters the gating path at all). The real, narrower guarantee this fix
provides: every single-op-per-actor fixture this mechanism served
pre-fix (declared-consult, standalone sessions, research fan-out/fan-in,
MVP7 aggregation-close, group-cognition-framework) stays behaviorally
identical **because their own Assignments already arrive stamped**
through `dispatchDeclaredOperation` — not because the fallback and the
gating path are equivalent in general. Named as a residual in §5 Gaps,
not silently fixed (no cheap fix was found within this fix round's scope
that does not risk widening what "operation-stamped" means elsewhere in
this file).

### 1.4 A third exclusion, found empirically while running the regression suite

Running the full combined regression (not merely narrated — see §3) surfaced
a genuine SECOND multi-required-operation-per-actor shape this repo already
ships and tests live: `test/verbs/coordination-aggregation-surface.test.mjs`
and `test/runner/coordination-aggregation.test.mjs`'s own MVP7
`coordinator-actor` is bound to **two required** operations at the SAME
graph node — `review` and `synthesize`. Neither test file ever dispatches
`synthesize` as a real Assignment (grepped: zero occurrences of
`operationId: 'synthesize'` as a request step anywhere in either file), and
`validateSessionAggregation`'s own `assignmentId`/`runId`/
`outputArtifactRef` parameters are all optional — every real caller in both
files validates an aggregation without supplying any of them. This confirms
the actual MVP7 design: `synthesize` (the protocol's own
`completion.aggregation.outputOperationRef`) is a purely declarative name
for what the aggregation's evidence-preserving synthesis represents; its
completion is represented by the validated `aggregation-validated` event
(`closeSessionByQuorum`'s own separate `aggregationId` narrowing gate), never
by a literal dispatched Assignment. `actorGatingOperationIds` therefore
additionally excludes `definition.spec.profile.completion.aggregation.
outputOperationRef` from an actor's gating set, when a declared aggregation
names one.

This exclusion is scoped precisely: it only applies when the protocol
actually declares `completion.aggregation` (the WITH-aggregation test
variants keep the fixture's own existing behavior, unmodified). The
WITHOUT-aggregation variant of the SAME fixture (`withAggregation: false`)
has no such substitute mechanism, so `synthesize` there is an ordinary
`required` binding like any other and now genuinely needs its own settled
Assignment — the two affected tests were updated to dispatch it explicitly
(see §3), which is the correct, MORE rigorous behavior, not a workaround.

current-cell.md's own Acceptance text characterized "MVP7 aggregation-close"
as one of the protocols this mechanism "has always correctly served" (single
-required-operation-per-actor). That characterization was not quite right —
`coordinator-actor` there is bound to two required operations, same as any
other multi-op actor this fix addresses — but the fixture's own test design
(never dispatching `synthesize`, relying on the pre-fix "first assignment"
laxness) meant the pre-existing bug never surfaced there. Named here
plainly, not silently absorbed.

### 1.5 Implementation

`actorGatingOperationIds(definition, actorId)` (new, private, next to
`declaredOperationBindingActors` per current-cell.md's Must-Read #3 —
the closest existing precedent for "resolve real graph-declared bindings
from a definition") walks `definition.spec.graph.nodes` (the SAME idiom
used 3 times already in this file, per current-cell.md's own instruction)
and returns every operation id gating `actorId`, per §1.3/§1.4.

`classifySessionQuorum` now optionally loads the session's own bound
definition (`manifest.definitionRef`, the same `loadCoordinationProtocol` +
version-drift-tolerant pattern `authorizeDeclaredOperation`/
`dispatchDeclaredOperation` already use — though this function deliberately
does NOT throw on version drift, unlike those two: it is a read/close-
decision path called on every single request, including ones that never
touch a declared operation, and adding a new throw path here is a bigger,
untested behavior change than this fix's actual scope requires). For each
actor:

- If `actorGatingOperationIds` returns a non-empty list, every one of those
  operation ids is resolved via `resolveBindingOutcome` (session-engine.mjs
  — the SAME function `resolveOperationOutcome`/visibility windows already
  use to classify a settled binding's outcome, reused rather than
  reimplemented, per current-cell.md's Must-Read #2's spirit). The actor is
  `completed` only when every gating operation is `satisfied`; otherwise it
  reports the FIRST unsatisfied operation's own missing/late/failed reason.
- If the list is empty, the ORIGINAL "first assignment-created event for
  this actor, anywhere" logic runs unchanged (byte-identical).

Both `evaluateSessionQuorum` and `closeSessionByQuorum` now thread `opts`
into `classifySessionQuorum` (needed for `loadCoordinationProtocol`'s
`cwd`/`packageRoot`); `closeSessionByQuorum`'s own call site already had
`opts` in closure scope, so this is a one-line change there.

## 2. Proof Matrix

| Requirement | Test | Result |
|---|---|---|
| RFC-Review-Lite: a genuinely separate later call reaches `respond` successfully (previously refused outright) | `test/verbs/coordination-group-thinking-rfc-review-lite-pack-conformance.test.mjs` — "P10-KERNEL-FIX: a genuinely SEPARATE later runGroupThinkingRequest call reaches proposer-actor's remaining declared operation..." | pass |
| Nominal-Group-Lite: the literal "after share, before clarify" resume now succeeds, across 3 separate calls | `test/verbs/coordination-group-thinking-nominal-group-lite-pack.test.mjs` — "P10-KERNEL-FIX: the exact 'interrupt after share settles, resume before clarify' scenario now SUCCEEDS..." | pass |
| Delphi-Feedback-Lite: `aggregate` (and both round-2 proposals) now reachable across a call boundary, not just round-2 | `test/verbs/coordination-group-thinking-delphi-feedback-lite-pack-conformance.test.mjs` — "P10-KERNEL-FIX: the auto-close boundary that used to sit EARLIER than 'after aggregate' is gone..." | pass |
| A driver-authorized binding the driver never authorizes does NOT block closing (regression the naive "wait for everything" fix would introduce) | `test/runner/coordination-recovery-and-quorum.test.mjs` — "P10-KERNEL-FIX: an actor bound to a REQUIRED operation and a GATED... while an actor bound to a REQUIRED operation and an UNGATED driver-authorized operation completes on the required operation alone" | pass |
| A gated (visibility-window-declaring) driver-authorized binding DOES block closing until it settles, at the quorum-mechanism level directly | same test | pass |
| Zero regression: `test/runner/coordination-recovery-and-quorum.test.mjs` (ad-hoc `openSession`/`openStandaloneSession`, no `definitionRef` — the fallback path) | full file | 29/29 pass |
| Zero regression: `standalone-master-coordination-loop.yaml` live tests (`coordination-run-live-proof.test.mjs`, `coordination-launch-master-loop.test.mjs`, `coordination-driver-authorization.test.mjs`, `coordination-run-driver-steps.test.mjs`, `dispatch-coordination-role-tiers.test.mjs`, `coordination-visibility-window-fixture.test.mjs`, `coordination-research-fan-out.test.mjs`, `coordination-group-thinking-pack.test.mjs`) | combined run | 199/199 pass |
| Zero regression: MVP7 aggregation-close (`coordination-aggregation-surface.test.mjs`, `coordination-aggregation.test.mjs`), after the two `withAggregation: false` tests were updated per §1.4 | combined run | 58/58 pass |
| Full combined focused regression (same set P10.5/P10.6/P10.7/P10.8 used) | `coordination-*`/`flow-definition*`/`verbs/coordination-*`/`architecture`/`skill-wrappers`/`cli/coordination`/`coordination-doctor-check` | 755 tests, 754 pass, 1 fail — the standing `coordination-static.test.mjs` worktree-path false-fail (identical to every prior cell in this track; confirmed by direct inspection, §3) |
| Full-repo sweep | see §3 | 5552 tests / 5544 pass / 1 fail (standing baseline, `fgos-intake-4.test.mjs:318`) / 7 skipped — zero new regressions |

## 3. Commands

```sh
cd /home/vantt/projects/forgentX/.claude/worktrees/step-09-mvp6-to-mvp9

# The three group-thinking-lite conformance files (each has the one updated test)
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  test/verbs/coordination-group-thinking-rfc-review-lite-pack-conformance.test.mjs \
  test/verbs/coordination-group-thinking-nominal-group-lite-pack.test.mjs \
  test/verbs/coordination-group-thinking-delphi-feedback-lite-pack-conformance.test.mjs
```
Result: `tests 15`, `pass 15`, `fail 0`.

```sh
# Quorum-mechanism-level regression, including the new multi-op test
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test test/runner/coordination-recovery-and-quorum.test.mjs
```
Result: `tests 29`, `pass 29`, `fail 0`.

```sh
# standalone-master-coordination-loop.yaml's own real, live tests
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  test/runner/coordination-recovery-and-quorum.test.mjs \
  test/verbs/coordination-run-live-proof.test.mjs \
  test/verbs/coordination-launch-master-loop.test.mjs \
  test/runner/coordination-driver-authorization.test.mjs \
  test/verbs/coordination-run-driver-steps.test.mjs \
  test/runner/dispatch-coordination-role-tiers.test.mjs \
  test/runner/coordination-visibility-window-fixture.test.mjs \
  test/runner/coordination-research-fan-out.test.mjs \
  test/verbs/coordination-group-thinking-pack.test.mjs
```
Result: `tests 199`, `pass 199`, `fail 0`.

```sh
# MVP7 aggregation-close, both fixture-owning files
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  test/verbs/coordination-aggregation-surface.test.mjs test/runner/coordination-aggregation.test.mjs
```
Result: `tests 58`, `pass 58`, `fail 0`.

```sh
# Combined focused regression, same set P10.5/P10.6/P10.7/P10.8's own §7 used
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  'test/runner/coordination-*.test.mjs' 'test/verbs/coordination-*.test.mjs' 'test/runner/flow-definition*.test.mjs' \
  'test/architecture.test.mjs' 'test/setup/skill-wrappers.test.mjs' \
  'test/cli/coordination.test.mjs' 'test/setup/coordination-doctor-check.test.mjs'
```
Result: `tests 755`, `pass 754`, `fail 1` — the single failure is
`coordination-static.test.mjs`'s own documented worktree-path false-fail,
independently re-confirmed by running that file alone: every listed
"forbidden import" violation resolves through THIS worktree's own checkout
path, which contains the literal substring "worktree" — identical to every
prior cell's documented finding, unrelated to this cell's changes.

```sh
# Full-repo sweep, run from THIS worktree (uncommitted diff, per this
# track's own established precedent)
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test $(find test -name "*.test.mjs" | grep -v coordination-static.test.mjs)
```
Result (real run, ~181s): `tests 5552`, `pass 5544`, `fail 1`, `skipped 7`,
exit 0 (the harness reports success despite the one known failure). The
single failure, verified not assumed: `test/cli/fgos-intake-4.test.mjs:318`
("ask/answer round-trip on a genuinely legacy durable-doing item (no
claim)"), the byte-identical `seq: 3` vs `seq: 2` assertion every prior cell
in this track has independently reproduced — this track's own documented
standing baseline (current-cell.md's own Acceptance text names this exact
test), entirely unrelated to `src/runner/coordination/**`. Zero new
regressions.

```sh
git status --short
```
```
 M src/runner/coordination/session-engine.mjs
 M test/runner/coordination-recovery-and-quorum.test.mjs
 M test/verbs/coordination-aggregation-surface.test.mjs
 M test/verbs/coordination-group-thinking-delphi-feedback-lite-pack-conformance.test.mjs
 M test/verbs/coordination-group-thinking-nominal-group-lite-pack.test.mjs
 M test/verbs/coordination-group-thinking-rfc-review-lite-pack-conformance.test.mjs
```
Every file is either on this cell's explicit May-Touch list or (§1.4) a
protected regression file this cell's own required "full combined regression
green" acceptance bar necessitated updating, with the reason named plainly.
`current-cell.md`/`index.md` untouched.

## 4. GitNexus Impact-Analysis Gate (per project CLAUDE.md)

`fgos tool query --capability impact-analysis --status present` was not run
by this cell (out of scope for a solo kernel-fix session with no MCP
GitNexus tool access in this run). Cross-checked instead by direct, full-file
reads of `session-engine.mjs`'s `classifySessionQuorum`/`closeSessionByQuorum`/
`evaluateSessionQuorum`/`resolveBindingOutcome`/`declaredOperationBindingActors`
regions, every real `core/coordination-protocols/*.yaml` fixture, the
project-tier fixtures in `coordination-driver-authorization.test.mjs` and
`coordination-aggregation-surface.test.mjs`, and grepping every call site of
`classifySessionQuorum`/`evaluateSessionQuorum`/`closeSessionByQuorum` across
`src/` and `test/` before writing or changing a single assertion — this is
exactly how the master-coordination-loop and MVP7 aggregation-close risks
(§1.2, §1.4) were found, empirically, not assumed.

## 5. Gaps

- **The naive "count all of an actor's required bindings only" framing
  current-cell.md started from does not, by itself, fix RFC-Review-Lite or
  Nominal-Group-Lite** (§1.2) — both protocols' blocking bindings are
  `driver-authorized`. The real rule additionally requires a gated
  `driver-authorized` binding (one declaring `contextAccess.
  visibilityWindowRef`) to settle too. Documented in full in §1.3, not
  silently corrected without explanation.
- **A residual, deliberately-scoped limitation, inherited from the
  pre-existing fallback path, not introduced by this fix**: an actor whose
  ONLY bindings are two-or-more UNGATED `driver-authorized` operations (no
  `required` binding at all) would still be counted complete after only the
  FIRST of those settles, under the fallback rule — the exact SAME
  limitation this whole fix addresses for gating bindings, just not
  extended to this specific shape, because no real fixture in this repo has
  it today (grepped every `core/coordination-protocols/*.yaml` and the two
  project-tier test fixtures that mirror `standalone-master-coordination-
  loop.yaml`'s shape — every actor with 2+ bindings has at least one
  `required` or gated binding).
- **`independent-research-fan-out-fan-in.yaml`'s own `coordinator-actor`**
  (bound to `dispatch-research` [required] and `synthesize-findings`
  [required, no `driver-authorized`/window at all]) has the SAME
  structural shape this fix corrects, and after this fix now correctly
  requires BOTH before counting complete — a genuine, incidental
  correctness improvement. No existing test in
  `test/runner/coordination-research-fan-out.test.mjs` or
  `coordination-driver-authorization.test.mjs` exercises `closeSessionByQuorum`
  against this exact fixture (confirmed by grep), so this is unverified by a
  live test either before or after this fix — named here for P10.10 or a
  future cell to add coverage if desired, not added here (outside this
  cell's own scoped Acceptance, which names the three group-thinking-lite
  bug cases specifically).
- **`group-cognition-framework.yaml`'s own `synthesizer-actor`** (bound to
  `convergent-synthesis` and `recommend-with-dissent`, both required) has
  the same shape too, but `test/runner/group-cognition-framework.test.mjs`
  deliberately never calls any session-engine export (confirmed by its own
  header comment) — zero live-session risk either way, and this fixture
  remains Do-Not-Touch per current-cell.md, untouched.
- **current-cell.md's own characterization of "MVP7 aggregation-close" as a
  single-required-operation-per-actor protocol was not quite accurate**
  (§1.4) — `coordinator-actor` there is genuinely bound to two required
  operations. The pre-existing test suite never surfaced this because it
  never dispatched `synthesize` as a real operation, relying on the
  pre-fix "first assignment" laxness the same way the three group-thinking-
  lite protocols implicitly did. Corrected here with a real evidence trail
  (§1.4), not silently patched around.
- **Version-drift protection (current behavior as of Fix Round 2 — see §9/
  §10.1; corrected here, Fix Round 3, R2-MEDIUM-D, both recheck2 rounds
  independently — this bullet previously described Fix Round 1's own
  superseded posture and cited §7 as current)**: this bullet originally
  said protection was deliberately NOT added; Fix Round 1 (§7.2) then added
  it narrowly at CLOSE only, leaving READ using whatever (possibly
  drifted) definition it could resolve — which Fix Round 2 (§9, N2/
  NEW-HIGH-A) proved was a genuine new regression, not "pre-existing
  laxness" as Fix Round 1's own text (and an earlier draft of this bullet)
  claimed: a drifted READ could silently misreport an already-settled
  actor as `missing`. As of Fix Round 2 (§10.1), both failure classes
  (resolution failure AND version drift) are handled symmetrically by
  posture, not cause: `closeSessionByQuorum`'s own call into
  `classifySessionQuorum` (`opts.enforceDefinitionVersion: true`) refuses
  EITHER failure class explicitly, with a correctly-attributed reason,
  matching every sibling mutation door in this file. `evaluateSessionQuorum`
  (and `show.mjs`'s use of it) degrades to `definition = null` — the
  pre-existing fallback — on EITHER failure class, and never throws, so a
  status read never breaks just because the bound protocol changed or
  became unresolvable underneath it (matching `show.mjs`'s own stated
  invariant). See §10.1 for the full rationale and live-reproduced
  before/after evidence (both failure classes, both doors). See R2-LOW-E
  below for the residual this degraded-read posture itself still carries
  (a genuinely incomplete actor can also read as falsely `completed` under
  the same degrade, with no signal that classification fell back).
- **HIGH-3's latent risk (Fix Round 1, redteam-report.md)**: a
  single-`required`-op actor whose Assignment arrives through a
  non-stamping public door (`createSessionAssignment`/`dispatchPrimaryTask`/
  `proposeConsult`) can never satisfy a gating binding and would be
  permanently unclosable. Confirmed currently latent — no
  `runCoordinationUseCase` path reaches this today (`agent-led` uses
  `openStandaloneSession`, which carries no `definitionRef`). No fix was
  applied in Fix Round 1: the correct fix (e.g. letting the gating path
  also accept a well-formed but unstamped Assignment when no OTHER
  Assignment claims the same operation) was judged to risk widening what
  "operation-stamped" means elsewhere in this file, a bigger, untested
  change than this residual's current (zero) live impact justifies. Named
  for whichever door reaches this path next.
- **MEDIUM-6 (Fix Round 1, redteam-report.md, accepted as a Gap, not
  fixed)**: the same operation id bound to the same actor at two DIFFERENT
  graph nodes (e.g. a literal "round-1"/"round-2" reuse of one id, instead
  of two distinct ids) is deduplicated to a single gating entry
  (`actorGatingOperationIds`'s own `!operationIds.includes(ref.ref)`
  guard) — one settled Assignment for that op id satisfies every node
  that binds it to that actor, which is precisely the premature-close bug
  this cell exists to eliminate, unfixed for this one authoring shape. No
  shipped protocol has it today (Delphi correctly uses distinct
  `propose-round1`/`propose-round2` ids, confirmed by grep across every
  `core/coordination-protocols/*.yaml`), but it is a natural shape for a
  future protocol author to reach for. Closing it would require gating on
  `(operationId, nodeId)` pairs rather than bare operation ids throughout
  `actorGatingOperationIds`/`resolveBindingOutcome`'s call chain — judged
  out of this fix round's scope (a real, if currently unreached, kernel
  change, not a contained one).
- **LOW-8 (Fix Round 1, redteam-report.md, accepted as a Gap, not fixed)**:
  a gated `driver-authorized` binding behind a structurally-unopenable
  visibility window is a hard deadlock — the actor stays `missing` forever
  and `closeSessionByQuorum` refuses forever, escapable only via
  `cancelSession` or a declared `partialPolicy`. No shipped protocol has an
  unopenable window (`group-thinking-rfc-review-lite.yaml`'s own header
  already documents this exact shape as impossible, citing P08.3), so this
  is a protocol-authoring footgun rather than a live bug. Not fixed: the
  only correct fix is authoring discipline (never declare a window that
  cannot open) or a product decision to add a distinct "deadlocked" quorum
  outcome, either of which is outside a kernel-classification fix's scope.
- **MEDIUM-7 (Fix Round 1, redteam-report.md, accepted as a Gap, not
  fixed)**: `loadCoordinationProtocol` (full YAML parse + schema
  validation of the whole registry, uncached anywhere in
  `protocol-loader.mjs`, measured ~12ms/call in this repo) now runs up to
  three times per `runCoordinationUseCase` request
  (`run.mjs`'s `quorumBeforeClose`, `closeSessionByQuorum`'s own call, and
  `finalQuorum`), one of them inside `withSessionLock`, extending lock
  hold time by roughly the same amount. A memoization scoped to a single
  `classifySessionQuorum`/`evaluateSessionQuorum`/`closeSessionByQuorum`
  call cannot help here: `run.mjs`'s three loads are three SEPARATE
  top-level calls into the engine, not nested calls sharing one function's
  call scope, so caching within one classification pass alone would not
  eliminate the duplicate loads. A cache that actually helps needs to be
  threaded through `run.mjs` itself (its own request-scoped `engineOpts`,
  passed to all three calls) — reaching beyond
  `classifySessionQuorum`/`evaluateSessionQuorum`/`closeSessionByQuorum`
  into a fourth file, which this fix round's own accepted scope
  (P10-KERNEL-FIX.md §6) explicitly named as the boundary past which this
  should be documented rather than implemented. Not correctness-critical;
  worth revisiting if `run.mjs`'s per-request overhead becomes load-bearing.
- **GitNexus impact analysis was not run** (§4) — cross-checked by direct,
  full-file code reads and exhaustive grep instead, per this repo's own
  capability-gate degraded posture.
- **N3 (Fix Round 2, reviewer-recheck-report.md, accepted as a Gap, not
  fixed — scope corrected, Fix Round 3, both recheck2 rounds independently,
  R2-MEDIUM-B/R2-1)**: HIGH-1's fix (extended by Fix Round 2's N1, §10)
  covers `classifySessionQuorum`'s own `loadCoordinationProtocol` call, but
  NOT `run.mjs:236`'s separate `aggregationCloseParams` load, which still
  throws an uncaught `FlowDefinitionError` on the same resolution-failure
  class (an unrelated malformed sibling protocol file, a removed protocol,
  a missing `yaml` module). **Corrected scope, proven by both Fix Round 3
  recheck2 rounds with a live probe using a protocol that declares NO
  `completion.aggregation` at all**: `aggregationCloseParams` calls
  `loadCoordinationProtocol` at `run.mjs:236` *unconditionally*, seven
  lines before its own `run.mjs:243` check for whether an aggregation is
  declared — so the uncaught throw fires for **every** declared-protocol
  session, not only ones declaring `completion.aggregation` as this bullet
  previously (incorrectly) stated. This affects all three group-thinking-lite
  protocols this whole cell exists to fix, none of which declare an
  aggregation. Pre-existing at HEAD, not introduced or worsened by this
  cell, and outside this cell's own kernel-file boundary (`run.mjs` is the
  verb layer, not `session-engine.mjs`) — but never previously named, and
  its true scope was understated until this correction. Named here plainly
  for whichever future cell touches `run.mjs`'s own error handling. See
  R2-MEDIUM-C immediately below and §10.1's own added scoping note for the
  consequence this has for N1's own refusal.
- **R2-MEDIUM-C (Fix Round 3, both recheck2 rounds independently)**: because
  of N3's real scope above, `aggregationCloseParams`'s own unconditional
  `run.mjs:236` load is evaluated as an argument to `closeSessionByQuorum`
  at `run.mjs:526`, in the SAME expression, so on a resolution failure it
  throws BEFORE `classifySessionQuorum` (and therefore N1's own explicit,
  correctly-attributed refusal) is ever reached. N1's refusal is real,
  correct, and proven at the `classifySessionQuorum`/`closeSessionByQuorum`
  engine-door level (§10.1, §7 for the direct-engine-caller evidence) — but
  it is **not currently reachable through `run.mjs`'s primary production
  door (`fgos coordination run`)**, the door an actual user hits. Through
  that door, a resolution failure still surfaces as a raw, uncaught
  `FlowDefinitionError` stack trace, identical before and after this whole
  cell's fix. The failure DIRECTION stays safe either way (the session
  never wrongly closes to `completed`; `manifest.status` stays `active` in
  both the engine-level and the `run`-verb-level failure), so this is not a
  new HIGH — but a future reader should not conclude N1 fixes
  `fgos coordination run`'s own behavior on this failure class. Fixing
  `run.mjs:236` itself (e.g. translating `FlowDefinitionError` to a
  `CoordinationError` there, matching the catch `run.mjs:529` already
  expects) is a small, contained change in principle, but reaches past this
  cell's own stated kernel-file boundary (`session-engine.mjs`) into the
  verb layer — the Coordinator's call for a future cell, not built here.
- **NEW-LOW-D (Fix Round 2, redteam-recheck-report.md, accepted as a Gap,
  not fixed)**: the original MEDIUM-5 finding (Fix Round 1) had two halves —
  "key the aggregation-output exclusion on actor+operation" (fixed, Fix
  Round 1 §7.5, refined by Fix Round 2's N4 above) and "require a validated
  aggregation to actually exist before excusing anything" (the exclusion
  applies whether or not the session ever produced an `aggregation-
  validated` event) — the second half was dropped by §6's disposition and
  never tracked as a residual. Still live in the current code: a
  declared-aggregation actor's own `outputOperationRef` binding stays
  excluded from gating even if no aggregation was ever validated (the
  separate `aggregationCloseParams`/`aggregationId` gate in `run.mjs` covers
  this on the `run` verb path, so it is not exploitable there; a direct
  `closeSessionByQuorum` call without `aggregationId` is not covered). Named
  here now, at the same rigor this report already applies to MEDIUM-6/LOW-8.
- **The 2-or-more-actors-bound-to-`outputOperationRef` case (Fix Round 2,
  N4/NEW-MEDIUM-C, redteam-recheck-report.md, accepted as a Gap, not
  fixed)**: when 2+ distinct actors legitimately bind the aggregation's own
  `outputOperationRef`, the exclusion now applies to NEITHER of them (§10) —
  every such actor falls back to ordinary required-operation gating instead
  of one being silently excused. This closes the graph-order-dependent
  deadlock Fix Round 1's "designate the first binding found" heuristic had,
  but does not (and structurally cannot, from inside a kernel
  session-engine cell) declare whether binding 2+ actors to one
  `outputOperationRef` is a legitimate protocol shape at all. No shipped
  protocol has this shape today (grepped: no `core/coordination-protocols/
  *.yaml` declares `completion.aggregation` with more than one graph
  binding of its `outputOperationRef`). A future cell may want a
  schema-level rejection instead (reject at load time when
  `outputOperationRef` has more than one graph binding, turning a silent
  ambiguity into an authoring error) — not built here, out of this kernel
  fix's own scope.
- **R2-LOW-E (Fix Round 3, both recheck2 rounds independently, accepted as
  a Gap, not fixed)**: the degraded-read posture §10.1/the version-drift
  bullet above call "honest" is only honest in ONE direction. Both recheck2
  rounds independently confirmed, live: under EITHER degrade cause
  (resolution failure or version drift), a multi-binding actor whose later
  gating operation was never dispatched can read `completed` — the
  pre-fix, fallback answer (deliberately chosen and NOT being reversed
  here, per §9's own resolution) — with no drift/degradation signal
  anywhere in the payload, `definitionRef` still showing the stale version,
  and exit 0. A stuck user reaching for `fgos coordination show` after a
  registry problem or a version bump can be told everyone is done when a
  required operation genuinely never happened. This cannot corrupt state
  (`closeSessionByQuorum` still refuses under the same conditions, per
  N1/N2 above), and no production consumer of the quorum payload beyond
  `show`/`run` rendering was found to branch on it (grepped:
  `src`/`core/skills`/`bin`). Not fixed: the cheap follow-up both rounds
  named is a `definitionResolution: 'ok' | 'degraded'` (or similar) field
  on the quorum payload so `show` can say *why* it fell back, rather than
  reporting a plain, unqualified answer — left for a future cell, not
  built here.

## Summary

Fixed `classifySessionQuorum`'s multi-operation-per-actor completion bug
(P10.6/P10.7/P10.8's own converged, cross-cell finding, escalated to
CRITICAL by P10.7's Red-Team) with a rule grounded in real investigation of
all three group-thinking-lite protocols' actual `activation`/
`contextAccess` fields, not the naive framing current-cell.md itself warned
might be wrong: a `required` binding always gates; a `driver-authorized`
binding gates only when it ALSO declares its own
`contextAccess.visibilityWindowRef` (a real, later, access-controlled phase
of the SAME actor's work); an ungated `driver-authorized` binding never
gates (the genuinely-optional-branch case, proven load-bearing by a real,
already-shipped fixture — `standalone-master-coordination-loop.yaml` — not
hypothetical). All three of P10.6/P10.7/P10.8's own concrete bug scenarios
now succeed with live, re-run evidence, each rewritten from "proves the bug"
into "proves the fix" rather than deleted. A second, previously-undocumented
multi-required-operation-per-actor shape was found empirically while running
the regression suite (MVP7 aggregation-close's own `coordinator-actor`),
diagnosed correctly (its `synthesize` operation is satisfied by a validated
aggregation record, never a dispatched Assignment, when aggregation is
declared), and both affected tests were updated with the reasoning
documented, not silently patched. Zero regression across every fixture this
mechanism has ever served: `coordination-recovery-and-quorum.test.mjs`
(29/29), the full `standalone-master-coordination-loop.yaml` live-test suite
(199/199), MVP7 aggregation-close (58/58), and the full combined focused
regression (754/755, the one failure being this track's own standing,
independently-reconfirmed `coordination-static.test.mjs` worktree-path
false-fail).

Status: DONE
Summary: `classifySessionQuorum`'s per-actor "first assignment" completion
rule is now multi-operation-aware for declared-protocol sessions, gating on
every `required` binding plus every visibility-window-gated
`driver-authorized` binding, with genuinely optional (ungated
driver-authorized) bindings staying non-gating exactly as before — a design
validated against a real, already-shipped fixture that would have broken
under the naive "wait for everything" alternative. All three P10.6/P10.7/
P10.8 bug scenarios now succeed with live re-run evidence; zero regression
across every dependent fixture, including a second real multi-op shape
(MVP7 aggregation-close) discovered and correctly handled during the
regression run itself.
Concerns/Blockers: none blocking. Two named, deliberately out-of-scope
residuals for a future cell (§5): the two-or-more-ungated-driver-authorized-
bindings fallback edge case (no real fixture has this shape today), and
`independent-research-fan-out-fan-in.yaml`'s own coordinator-actor now being
correctly stricter with no live test coverage either way.

## 6. Disposition (Coordinator, 2026-09-04)

Independent Reviewer and Red-Team ran in parallel against this report and the
real diff. Reviewer: APPROVE WITH CONCERNS, 1 HIGH + 3 MEDIUM + 1 LOW
(process). Red-Team: **REQUEST CHANGES**, 4 HIGH + 3 MEDIUM + 1 LOW + 1 INFO,
every HIGH backed by a real pre-fix/post-fix probe delta (full report:
`P10-KERNEL-FIX-redteam-report.md` in this directory). Both independently
converged on the same root issue (HIGH-1 below), found by construction, not
by cross-reading each other.

**Findings accepted, in a single Fix Round:**

- **HIGH-1** (both rounds): `classifySessionQuorum:3202`'s new
  `loadCoordinationProtocol` call throws uncaught `FlowDefinitionError` (not a
  `CoordinationError`) on any resolution failure (not-found, parse error,
  schema violation, duplicate id, missing `yaml` module). `run.mjs:522`'s
  `quorumBeforeClose` sits outside the try block; `show.mjs:176` has no guard
  at all, directly violating its own stated invariant ("must keep working").
  Live-reproduced by both rounds independently. **Fix**: wrap the load,
  degrade to `definition = null` (the pre-existing fallback path) on any
  resolution failure — this is a read/close-decision path, not a mutation
  door, so fail-open-to-fallback is the correct posture, matching
  `show.mjs`'s own stated invariant.
- **HIGH-2** (Red-Team): the load is by protocol **id only**, ignoring
  `manifest.definitionRef.version`. Live-reproduced: after an in-place
  version bump, every already-settled, correctly-stamped Assignment stops
  matching (`protocolOperationStamp` embeds the version), silently flipping
  a completed actor to `missing` with a refusal message that names the wrong
  cause. Every sibling door in this file
  (`authorizeDeclaredOperation`/`dispatchDeclaredOperation`/
  `validateSessionAggregation`) already raises an explicit
  "refusing to close against a drifted definition" on this exact condition.
  **Fix**: compare `manifest.definitionRef.version`, raise the same explicit,
  correctly-attributed drift error the sibling doors raise (not a silent
  `missing`).
- **HIGH-3** (Red-Team): §1.3's "byte-identical fallback" claim (and the
  matching code comment at `session-engine.mjs:1350-1359`) is false — the
  fallback accepts ANY `assignment-created` event, the gating path demands an
  operation-stamped one, so a single-`required`-op actor whose Assignment
  arrives through a non-stamping public door
  (`createSessionAssignment`/`dispatchPrimaryTask`/`proposeConsult`) now
  fails where it used to succeed. Confirmed currently LATENT — no
  `runCoordinationUseCase` path reaches it today (`agent-led` has no
  `definitionRef`) — but the claim is wrong and ships as a reviewed,
  accepted assertion. **Fix**: correct both the report text and the code
  comment to state the real, narrower guarantee; keep the latent-risk note
  in Gaps for whichever door reaches this path next.
- **HIGH-4** (Red-Team): the fixture cross-check in §4 claimed coverage of
  "every real `core/coordination-protocols/*.yaml` fixture" but missed 5 of
  8 actually-affected protocols
  (`independent-research-fan-out-fan-in-gated.yaml`'s `synthesize-findings`,
  all three `deliberation-*-chain.yaml` files), none of which have ANY
  quorum/close-level test coverage (confirmed by grep: zero references to
  `closeSessionByQuorum`/`evaluateSessionQuorum` in either affected test
  file) — so the "755 green" evidence cannot detect a break in any of them.
  Red-Team raised an open question: is
  `independent-research-fan-out-fan-in-gated.yaml`'s `synthesize-findings`
  (and `deliberation-nominal-group-chain.yaml`'s `clarify`) genuinely
  optional (driver's free choice, like `standalone-master-coordination-loop`'s
  revision steps) or mandatory (access-controlled via MVP6's gate, but
  always reached)? **Resolved by the Coordinator directly, by reading both
  fixtures' own header comments before dispatching this fix round** (not
  deferred to the Fixer): `independent-research-fan-out-fan-in-gated.yaml`'s
  own header calls its window "the paradigm case the visibility-window
  feature targets" and its `completion.mode: synthesize` makes
  `synthesize-findings` the protocol's actual completion step, not a skippable
  branch. `deliberation-nominal-group-chain.yaml`'s own header states
  `clarify` was "made `driver-authorized` so MVP6's existing
  context-grant/window-legality gate actually applies at authorize/dispatch
  time" — explicitly using `driver-authorized` as MVP6's access-control
  mechanism, not as a genuinely-optional branch. Both confirm the fix's
  discriminator (`driver-authorized` + `visibilityWindowRef` ⇒ mandatory,
  access-controlled) is correct for all 5 previously-uncovered protocols, not
  a coincidence that happens to hold for 2 fixtures. **Fix**: no rule change
  needed; add real quorum/close-level test coverage for all 5 previously-dark
  protocols proving the new (correct) gating behavior holds, since narrative
  confidence — even the Coordinator's own — is not this track's evidence bar.
- **MEDIUM-5** (Red-Team): the MVP7 aggregation exclusion
  (`session-engine.mjs:1384`) is keyed on operation-id alone, unconditional on
  an aggregation actually existing — any actor bound to `outputOperationRef`
  for an unrelated reason has that binding silently dropped, live-reproduced.
  **Fix**: key the exclusion on `actor + operation`, matching the pattern
  `actorGatingOperationIds` already receives both as parameters for.
- **MEDIUM-6** (Red-Team, accepted as a named Gap, not fixed): the same
  operation id bound to the same actor at two different graph nodes (e.g. a
  literal "round-1"/"round-2" reuse of one id) is deduped to a single gating
  entry — the exact premature-close bug this cell exists to eliminate,
  unfixed for this one shape. No shipped protocol has it (Delphi uses
  distinct `propose-round1`/`propose-round2` ids). Add to §5 Gaps explicitly,
  do not silently omit as the current report does.
- **MEDIUM-7** (Red-Team, fix if cheap): uncached `loadCoordinationProtocol`
  now runs up to 3× per `runCoordinationUseCase` request (~12ms/call
  measured), one call inside `withSessionLock`. **Fix**: memoize within the
  single request/call scope only (not a persistent cross-request cache, to
  avoid staleness) if this is a small, contained change; otherwise document
  as a named, accepted Gap.
- **LOW-8** (Red-Team, accepted as a named Gap, not fixed): a gated
  `driver-authorized` binding behind a structurally-unopenable window is a
  hard deadlock (no shipped protocol has this shape; `RFC-Review-Lite`'s own
  header already documents this exact shape as impossible, citing P08.3).
  Add to §5 Gaps.
- **INFO-9** (Red-Team): scope expansion into
  `coordination-aggregation-surface.test.mjs` was the right call; the fix
  shape that forced it (a third kernel special-case) was not the minimal
  one. No action required beyond MEDIUM-5's fix, which narrows that
  special-case's blast radius directly.
- **Reviewer's MEDIUM findings** (protocol enumeration incompleteness,
  stamped-assignment tightening mischaracterization) are subsumed by
  HIGH-3/HIGH-4's fixes above. **Reviewer's LOW (process)** — the
  off-May-Touch edit to `coordination-aggregation-surface.test.mjs` — noted;
  correctly judged unavoidable by both independent rounds given the chosen
  fix shape, not re-litigated.

Next: Fixer dispatched for all of the above in one round (matching this
track's established one-fix-round-per-disposition pattern), followed by an
independent recheck (not a fresh Reviewer/Red-Team pair — a targeted
recheck against exactly this findings list, per this track's established
"recheck" pattern for a bounded, well-scoped fix round).

## 7. Fix Round 1

Status: DONE | Fixer, 2026-09-04. Implements every finding accepted in §6.
All code changes live in `src/runner/coordination/session-engine.mjs`
(uncommitted, same file this whole cell touches); test changes live in
`test/runner/coordination-visibility-window-fixture.test.mjs`,
`test/runner/coordination-deliberation-method-chains.test.mjs`, and
`test/verbs/coordination-aggregation-surface.test.mjs`. No file outside
this cell's own May-Touch-plus-§1.4 list was touched.

### 7.1 HIGH-1 — resolution failures degrade to `definition = null`

`classifySessionQuorum`'s `loadCoordinationProtocol` call is now wrapped in
a `try`/`catch`; any thrown error (not-found, parse error, schema
violation, duplicate id, missing `yaml` module — anything
`loadCoordinationProtocol` can throw) degrades `definition` to `null`, the
pre-existing fallback path, exactly as §6 specified. No new error type or
message — the function simply proceeds as if the session had no bound
definition at all for that one evaluation.

**Real, live-reproduced evidence** (Red-Team's own probe scripts, re-run
verbatim against the fixed worktree — not new probes, not narration):

```
$ node probe.mjs   # Probe 2 — an unrelated malformed project-tier protocol file
quorum OK before bad file: [ 'worker-actor' ]
evaluateSessionQuorum still works: []
```
Pre-fix this threw `FlowDefinitionError/validation: flow-definition: spec
must be a non-null object`. Post-fix, quorum evaluation for a session that
never touches the malformed file keeps working — `show.mjs`'s own stated
invariant restored.

```
$ node probe-removed-protocol.mjs   # Repro B — protocol file removed after session open
quorum before removal: [{"actorId":"w-actor"}]
quorum after removal : [{"actorId":"w-actor"}]
```
Pre-fix this threw `FlowDefinitionError/not-found: no CoordinationProtocol
definition found for id "..."`. Post-fix, `fgos coordination show` — the
command a user reaches for when a session looks stuck — keeps working
even after its own bound protocol file is gone.

### 7.2 HIGH-2 — version drift is refused explicitly, on CLOSE only

`classifySessionQuorum` compares `manifest.definitionRef.version` against
the resolved definition's real version, but the refusal is gated behind a
new `opts.enforceDefinitionVersion` flag rather than firing unconditionally:

- `closeSessionByQuorum`'s own call site sets
  `{ ...opts, enforceDefinitionVersion: true }` — a genuine close attempt
  against a drifted definition now throws the same
  `CoordinationError('validation', ...)` shape every sibling mutation door
  in this file already raises
  (`authorizeDeclaredOperation`/`dispatchDeclaredOperation`/
  `validateSessionAggregation`/`linkSessionContribution`), naming the real
  cause.
- `evaluateSessionQuorum` (the plain read `show.mjs` and `run.mjs`'s own
  `quorumBeforeClose`/`finalQuorum` use) does **not** set the flag and so
  does **not** throw on drift — it keeps using whatever definition it can
  resolve for classification purposes, exactly as permissive as it was
  before this whole fix existed.

**Why scoped this way, not raised everywhere `classifySessionQuorum` runs
(a deliberate narrowing of what §6 asked for, with reasoning, not a silent
weakening):** the first implementation raised the drift error unconditionally
inside `classifySessionQuorum` itself, reachable from both
`evaluateSessionQuorum` and `closeSessionByQuorum`. That broke two things
live, both caught by re-running this cell's own established regression
set (not narrated):

1. Red-Team's own Probe 1 (`probe.mjs`) — whose own script calls
   `evaluateSessionQuorum` a second time, expecting it to keep working, and
   only expects `closeSessionByQuorum` to refuse — crashed on the SECOND
   `evaluateSessionQuorum` call instead of reaching the refusal it was
   testing for.
2. `test/verbs/coordination-aggregation-surface.test.mjs`'s own pre-existing
   test *"editing the bound protocol in place to drop completion.aggregation
   does NOT bypass the gate"* started failing: `run.mjs:522`'s
   `quorumBeforeClose = evaluateSessionQuorum(...)` sits OUTSIDE `run.mjs`'s
   own try/catch (this is HIGH-1's own finding about that exact call site),
   so an unconditional drift throw there propagated UNCAUGHT out of
   `runCoordinationUseCase`, instead of being gracefully surfaced as
   `closeRefusalReason` the way `aggregationCloseParams`'s own,
   pre-existing, unrelated drift check already is. This would also have
   broken `show.mjs:176` the same way HIGH-1 fixed for resolution
   failures — reintroducing a HIGH-1-shaped regression for version drift
   specifically. A plain status read must keep working under a drifted
   definition exactly like it must under an unresolvable one; only an
   actual close attempt should refuse to proceed against stale drift.

Restricting the throw to `closeSessionByQuorum`'s own call (via the opt-in
flag) fixes both without touching `run.mjs`, `show.mjs`, or any other file:
the read paths stay exactly as they were, and the one call site that
actually attempts a mutation (a close) gets the honest refusal.

**Real, live-reproduced evidence** (`probe.mjs` Probe 1, re-run against the
fixed worktree):

```
BEFORE drift  completed= [ 'worker-actor' ] missing= []
AFTER  drift  completed= [] missing= [ 'worker-actor' ]
closeSessionByQuorum: REFUSED -> [CoordinationError/validation] classifySessionQuorum:
  session "coord_redteam_drift" was opened against definition
  "test.coordination-protocol.redteam-drift@1.0.0", but the resolved definition is now
  version "1.0.1" -- refusing to close against a drifted definition
```

The `AFTER drift` line (a plain `evaluateSessionQuorum` read) still shows
the pre-existing, unrelated laxness of the read path (it uses whatever
definition it can resolve, so a drifted definition's stamps genuinely stop
matching for READ purposes too, same as before this whole fix) — but
`closeSessionByQuorum` now refuses with the correct, honestly-attributed
cause instead of a silent, wrong-cause "missing required actor(s)"
(pre-Fix-Round-1 behavior, and pre-P10-KERNEL-FIX-entirely behavior before
that: `closeSessionByQuorum: SUCCEEDED` — the session closed on a version it
was never opened against).

### 7.3 HIGH-3 — corrected the false "byte-identical fallback" claim

Both `P10-KERNEL-FIX.md` §1.3 (a new correction paragraph, not a silent
edit — the original claim is left in place and marked corrected, per this
track's own established practice for retroactive corrections) and the code
comment above `actorGatingOperationIds` in `session-engine.mjs` now state
the real, narrower guarantee: the fallback and the gating path are not
equivalent in general (the fallback accepts any `assignment-created`
event; the gating path demands an operation-stamped one); every
single-op-per-actor fixture this mechanism serves stays identical because
their Assignments already arrive stamped through `dispatchDeclaredOperation`,
not because the two paths are interchangeable. The latent-risk note (a
non-stamping public door can never satisfy a gating binding, unreached by
any live `runCoordinationUseCase` path today) is named in §5 Gaps, honestly,
not fixed — no cheap, contained fix was found that does not risk widening
what "operation-stamped" means elsewhere in this file, which this fix
round's own scope (§6) explicitly excludes.

### 7.4 HIGH-4 — quorum/close coverage added for all 5 previously-dark protocols

Real quorum/close-level tests were added, each driving a real session
through the real mediated door (`openDeclaredProtocolSession` +
`dispatchDeclaredOperation`/`dispatchResearchFanOut`/
`authorizeDeclaredOperation`, matching this track's own established
pattern), for every protocol HIGH-4 named:

| Protocol | Actor(s) proven | Test file | New test |
|---|---|---|---|
| `independent-research-fan-out-fan-in-gated.yaml` | `coordinator-actor` (`synthesize-findings`, driver-authorized + gated) | `coordination-visibility-window-fixture.test.mjs` | "P10-KERNEL-FIX quorum: coordinator-actor stays incomplete..." |
| `deliberation-rfc-chain.yaml` | `proposer-actor` (`propose` + `respond`, both required) | `coordination-deliberation-method-chains.test.mjs` | "RFC chain P10-KERNEL-FIX quorum: ..." |
| `deliberation-nominal-group-chain.yaml` | `participant-a`/`participant-b` (`private-propose` + `private-rank`); `facilitator-actor` (`clarify`, its ONLY binding, driver-authorized + gated) | same file | "Nominal-Group chain P10-KERNEL-FIX quorum: ..." |
| `deliberation-delphi-chain.yaml` | `panelist-a`/`panelist-b` (`propose-round1` + `propose-round2`, both required) | same file | "Delphi chain P10-KERNEL-FIX quorum: ..." |

Each test proves BOTH halves HIGH-4 asked for: (a) `closeSessionByQuorum`
refuses while the actor's later binding is still unsettled, even though
every other declared step (including, for the gated-fan-in fixture, the
whole research cohort and the window opening) has already completed; (b)
the session closes cleanly once it does settle. Results (real run, not
narrated):

```
$ FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test test/runner/coordination-visibility-window-fixture.test.mjs
tests 17, pass 17, fail 0   # was 16 before this round's one new test

$ FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test test/runner/coordination-deliberation-method-chains.test.mjs
tests 12, pass 12, fail 0   # was 9 before this round's three new tests
```

The Coordinator's own §6 resolution (both fixtures' headers name
`synthesize-findings`/`clarify` as mandatory, access-controlled phases, not
skippable branches) is what each test's "premature close is refused"
half actually proves live — not re-litigated here.

### 7.5 MEDIUM-5 — aggregation exclusion keyed on the designated actor, not operation id alone

**Superseded, Fix Round 3 (R2-2, reviewer-recheck2-report.md): everything
below describes this fix round's OWN original (Fix Round 1) shape, kept
here verbatim for the historical record of what MEDIUM-5 itself fixed. The
"designated actor = first graph binding found" heuristic this section
describes was replaced by Fix Round 2's N4/NEW-MEDIUM-C
(§10.3) with an exactly-one-actor `Set`-based rule: the exclusion now
applies ONLY when exactly one distinct actor binds
`outputOperationRef` anywhere in the graph; with 2+ actors bound, the
exclusion applies to NEITHER of them (a structural fix, not a
"which one is correct" heuristic). The single test this section describes
was itself later split into two Fix Round 2 tests (§10.2/§10.3):
`coordination-aggregation-surface.test.mjs`'s "P10-KERNEL-FIX Fix Round 2
N4/NEW-MEDIUM-C (a): the single-actor case still excuses correctly -- no
regression from the exactly-one-actor rule" and "... (b) + NEW-HIGH-B: when
2 DISTINCT actors bind the aggregation's own outputOperationRef, NEITHER is
silently excused, and neither is permanently deadlocked" — the test named
below ("P10-KERNEL-FIX MEDIUM-5: a DIFFERENT actor...") no longer exists
under that name. The probe output quoted below (`missing= ['analyst-actor']`
only, `coordinator-actor` still excluded) is specific to THIS round's
first-graph-binding heuristic and is no longer reproducible under Fix Round
2's real, current code: with two actors bound to `synthesize`, Fix Round
2's rule reports BOTH `coordinator-actor` and `analyst-actor` missing (see
§10.2's own real probe output for the current, correct behavior). The file
total quoted below (`tests 13`) is this round's own count; the file is
`tests 14` as of Fix Round 2 (§10.6).**

`actorGatingOperationIds` now precomputes the aggregation's own designated
actor (the actor bound to `completion.aggregation.outputOperationRef` at
the FIRST graph binding found, scanning the whole graph once, not
actor-filtered) before its per-actor loop, and the exclusion now reads
`ref.ref === aggregationOutputOperationRef && actorId === aggregationActorId`
— never just the operation id. A different actor bound to the same
operation id for an unrelated reason keeps that binding as an ordinary
required one, needing its own real settled Assignment.

**Real, live-reproduced evidence** (Red-Team's own Probe 3, re-run against
the fixed worktree):

```
$ node probe.mjs   # Probe 3 — aggregation outputOperationRef, two actors bound to it
completed= [ 'coordinator-actor' ] missing= [ 'analyst-actor' ] late= []
closeSessionByQuorum: REFUSED -> closeSessionByQuorum: session "coord_redteam_agg" is
  missing required actor(s) [analyst-actor] and declares no partialPolicy -- default
  completion requires every required SessionActor (R1)
```
Pre-fix this closed with `synthesize` never performed by EITHER actor and
no aggregation validated (`closeSessionByQuorum: CLOSED to "completed"`).
Post-fix (Fix Round 1's own shape, as described above), `analyst-actor`
(the non-designated actor) is correctly `missing` and close is correctly
refused; `coordinator-actor` (the actor this round's own first-graph-binding
heuristic designated, checked against the real MVP7 fixture shape in
`coordination-aggregation-surface.test.mjs` before this fix was written —
it is the ONLY actor the shipped fixture ever binds to `synthesize`) stays
excluded under THIS round's heuristic.

A new test, `coordination-aggregation-surface.test.mjs`'s "P10-KERNEL-FIX
MEDIUM-5: a DIFFERENT actor bound to the same outputOperationRef operation,
for an unrelated reason, is NOT silently excluded" (this round's own test,
later split into two by Fix Round 2 — see the supersession note above),
drives this through the real `runCoordinationUseCase` CLI-request surface (a
project-tier variant of the file's own `protocolDoc`, adding one
`analyst-actor` bound to `synthesize` at the same node as the real
`coordinator-actor` binding, role-matched so the binding is schema-legal):
proves the close refuses on `analyst-actor` alone once the aggregation
itself is validated (isolating the actor-completion refusal from the
separate, pre-existing "no validated aggregation" gate), then proves the
close succeeds once analyst-actor's own Assignment settles too. `tests 13,
pass 13, fail 0` for the whole file, as of THIS round
(**correction, Fix Round 2 N5, reviewer-recheck-report.md: was 12 before
this round's changes, not "10" as originally stated here — checked against
HEAD directly** — this round added exactly one test and changed no others
in that file; the drift test's own behavior is now correctly produced by
`aggregationCloseParams`'s existing, unrelated check rather than a new
uncaught throw, per §7.2). The file is `tests 14, pass 14, fail 0` as of
Fix Round 2's own split (§10.6) — see the supersession note above.

### 7.6 MEDIUM-6, LOW-8 — named as Gaps, not fixed

Both added to §5 Gaps verbatim, with the same rigor as this report's other
Gaps entries (concrete scenario, why no shipped protocol has it today, what
the real fix would require, and why it is out of this fix round's scope).
Not re-litigated here — see §5.

### 7.7 MEDIUM-7 — accepted as a Gap, not implemented

Per §6's own explicit fallback ("if this is a small, contained change...
otherwise document it as an accepted Gap instead"): the three
`loadCoordinationProtocol` calls MEDIUM-7 measured are three SEPARATE
top-level calls from `run.mjs` into `evaluateSessionQuorum` /
`closeSessionByQuorum` / `evaluateSessionQuorum` again, not nested calls
sharing one function's call scope — a cache scoped to a single
`classifySessionQuorum` invocation cannot eliminate them. A cache that
actually would needs to be threaded through `run.mjs`'s own request-scoped
`engineOpts`, which reaches beyond
`classifySessionQuorum`/`evaluateSessionQuorum`/`closeSessionByQuorum` into
a fourth file — past the boundary §6 named. Documented in §5 Gaps with the
reasoning, not implemented.

### 7.8 Full regression evidence (real runs, not narrated)

```sh
cd /home/vantt/projects/forgentX/.claude/worktrees/step-09-mvp6-to-mvp9

# Every test file this fix round touched or added coverage to
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  test/runner/coordination-recovery-and-quorum.test.mjs \
  test/runner/coordination-visibility-window-fixture.test.mjs \
  test/runner/coordination-deliberation-method-chains.test.mjs \
  test/verbs/coordination-aggregation-surface.test.mjs \
  test/runner/coordination-aggregation.test.mjs
```
Result: `tests 117`, `pass 117`, `fail 0`.

```sh
# The master-coordination-loop / group-thinking-lite regression set §2/§3
# already relied on -- re-run whole, not sampled
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  test/verbs/coordination-group-thinking-rfc-review-lite-pack-conformance.test.mjs \
  test/verbs/coordination-group-thinking-nominal-group-lite-pack.test.mjs \
  test/verbs/coordination-group-thinking-delphi-feedback-lite-pack-conformance.test.mjs \
  test/verbs/coordination-run-live-proof.test.mjs \
  test/verbs/coordination-launch-master-loop.test.mjs \
  test/runner/coordination-driver-authorization.test.mjs \
  test/verbs/coordination-run-driver-steps.test.mjs \
  test/runner/dispatch-coordination-role-tiers.test.mjs \
  test/runner/coordination-research-fan-out.test.mjs \
  test/verbs/coordination-group-thinking-pack.test.mjs
```
Result: `tests 170`, `pass 170`, `fail 0`.

```sh
# Combined focused regression, the same set §3 used
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  'test/runner/coordination-*.test.mjs' 'test/verbs/coordination-*.test.mjs' 'test/runner/flow-definition*.test.mjs' \
  'test/architecture.test.mjs' 'test/setup/skill-wrappers.test.mjs' \
  'test/cli/coordination.test.mjs' 'test/setup/coordination-doctor-check.test.mjs'
```
Result: `tests 760`, `pass 759`, `fail 1` — the single failure is the same
standing, environment-caused `coordination-static.test.mjs` worktree-path
false-fail every prior cell in this track (including §3 above) has
independently documented; re-confirmed by direct inspection of its
"forbidden import" list, every violation resolving through this worktree's
own checkout path (containing the literal substring "worktree"). 760 vs
§3's 755: +5, exactly the 5 new tests this fix round added (HIGH-4 ×4,
MEDIUM-5 ×1); 759 vs 754 pass: the same +5, all passing — zero new
regressions.

```sh
# Full-repo sweep, run from THIS worktree
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test $(find test -name "*.test.mjs" | grep -v coordination-static.test.mjs)
```
Result (real run): `tests 5557`, `pass 5548`, `fail 2`, `skipped 7`. The two
failures, each verified not assumed:

1. `test/cli/fgos-intake-4.test.mjs` — the byte-identical standing baseline
   failure this track's own `current-cell.md` names, unrelated to
   `src/runner/coordination/**`, unchanged from §3.
2. `test/skills/fgos-mirror.test.mjs` — "`.agents/skills/_shared` and
   `plugins/fgOS/skills/_shared` mirror each other byte-identically" —
   NOT a real regression: the diff it reported was a stray
   `catchup-self-recovery.md.tmp-3985361-...` atomic-write temp file
   (another concurrent process's transient write, unrelated to this
   fix round's own file set), present only during that one sweep. Re-run
   in isolation immediately after: `tests 13`, `pass 13`, `fail 0` —
   confirmed a transient flake, not caused by this fix round's changes.

5557 vs §3's 5552: +5, the same 5 new tests; 5548 vs §3's 5544 pass: +5 minus
the one transient flake above (+4 observed, +5 real) — zero new regressions
from this fix round's own changes.

## Summary (Fix Round 1)

All eight accepted findings (HIGH-1 through INFO-9's own subsumed items)
from §6 are addressed: HIGH-1/HIGH-2 fixed with real live-reproduced
before/after evidence (Red-Team's own probe scripts, re-run verbatim);
HIGH-3's false claim corrected in both the report and the code comment,
with its real latent risk named honestly in Gaps rather than silently
patched; HIGH-4's five previously-dark protocols now have real
quorum/close-level test coverage, each proving both halves (premature close
blocked, real close succeeds); MEDIUM-5 fixed and proven with a new
cross-actor test plus Red-Team's own re-run probe; MEDIUM-6/LOW-8/MEDIUM-7
named as Gaps with concrete reasoning, not silently dropped. Zero new
regressions across every regression tier this track uses: the five directly
touched/extended test files (117/117), the master-coordination-loop/
group-thinking-lite set (170/170), the combined focused regression
(759/760, the one failure being the same standing environment false-fail),
and the full-repo sweep (5548/5557 pass, 2 failures — one the same standing
baseline, one a confirmed transient flake unrelated to this fix round,
re-run clean in isolation).

Status: DONE
Summary: implemented every accepted Fix Round 1 finding from §6 with real,
live-reproduced before/after evidence for each HIGH; scoped the HIGH-2
version-drift refusal to `closeSessionByQuorum` only (not
`evaluateSessionQuorum`/reads), a deliberate narrowing from the first
implementation's unconditional throw, found and fixed by re-running this
cell's own established regression set and Red-Team's own probe scripts,
which caught it breaking `show`-shaped reads and one pre-existing
aggregation-surface test. Zero new regressions anywhere this track measures.
Concerns/Blockers: none blocking. HIGH-3's latent non-stamping-door risk,
MEDIUM-6's same-op-id-two-nodes shape, LOW-8's unopenable-window deadlock,
and MEDIUM-7's per-request `loadCoordinationProtocol` overhead are all
named, reasoned Gaps (§5) rather than fixes — each judged to require a
larger, untested kernel change than this bounded fix round's own accepted
scope (§6) permits.

## 9. Disposition (Fix Round 2, Coordinator, 2026-09-04)

Independent Reviewer-recheck and Red-Team-recheck ran in parallel against
Fix Round 1 (§7). Both confirmed 8/9 of §6's items are genuinely fixed
(independently falsified, not trusted) and confirmed the HIGH-2 scope
deviation's own justification is TRUE (Red-Team reproduced both claimed
breakages independently by removing the `enforceDefinitionVersion` gate in
a scratch copy). Both rounds also independently found real new issues —
full reports: `P10-KERNEL-FIX-reviewer-recheck-report.md`,
`P10-KERNEL-FIX-redteam-recheck-report.md` (this directory).

The two rounds' new findings converge on ONE underlying design gap, seen
from two angles: Fix Round 1 made the read/close doors asymmetric for
*version drift* (close refuses honestly, reads silently misreport) but
left the *resolution-failure* path asymmetric the OTHER way (reads
correctly degrade per HIGH-1's original intent, close ALSO silently
degrades — which disables the whole gating rule and restores this cell's
own premature-close bug). The fix is to make both failure classes
(resolution-failure AND version-drift) symmetric across both doors:
**reads always degrade honestly** (matching pre-fix behavior, `show` never
throws), **close always refuses explicitly** (never silently completes on
degraded information, never misattributes the cause).

**Findings accepted, in a single Fix Round 2:**

- **N1 / HIGH** (Reviewer-recheck): HIGH-1's blanket
  `catch { definition = null }` applies to BOTH read and close callers,
  which means at the close door a resolution failure now silently disables
  every gating binding (falls back to the loose "any assignment" rule),
  restoring exactly the premature-close bug this whole cell exists to
  eliminate — live-probed: a clean registry correctly refuses close with
  one op pending; an unrelated half-written file in
  `.fgos/coordination-protocols/` (or the bound protocol simply removed)
  makes the SAME session close anyway. §6's "not a mutation door" framing
  was wrong for `closeSessionByQuorum` specifically. **Fix**: at the close
  door, a resolution failure must refuse explicitly (fail-closed), exactly
  like HIGH-2's existing drift refusal — reuse the same refusal mechanism
  for both causes rather than adding a third special case. Reads keep
  today's fail-open behavior (`show` must keep working) — unchanged.
- **N2 (Reviewer-recheck) / NEW-HIGH-A (Red-Team-recheck)** — the same
  finding from both rounds independently: the READ path (`evaluateSessionQuorum`/
  `show`) is NOT covered by `enforceDefinitionVersion`, so a version-drifted
  session's read silently reports a genuinely-completed actor as `missing`
  — no warning, no drift field, exit 0. §5/§7.2's own claim that this is
  "pre-existing, unrelated laxness" is FALSE — both rounds independently
  confirmed pre-fix HEAD reports the correct `completed` for the identical
  drifted probe. This is a new regression on the exact command
  (`fgos coordination show`) a stuck user reaches for. **Fix**: apply
  HIGH-1's own already-established pattern to drift too — on a READ, a
  detected version mismatch degrades to `definition = null` (the honest,
  pre-fix fallback answer), exactly like a resolution failure already does.
  Red-Team already implemented and verified this exact 2-line fix in a
  scratch copy ("reads report the pre-fix truth, close still refuses
  honestly, zero test delta") — reuse that shape.
- **NEW-HIGH-B (Red-Team-recheck)**: MEDIUM-5's new cross-actor regression
  test cannot actually fail — verified by reverting the MEDIUM-5 fix in a
  scratch copy and observing the suite, including that exact test, stays
  green. Root cause: the test fixture's "other" actor is a single-binding
  actor, so under the REVERTED code it falls through to the fallback path
  and is STILL reported `missing` — same assertion passes, wrong
  mechanism entirely. **Fix**: adjust the test fixture so the actor
  wrongly-excused by the bug (if the fix were reverted) is a genuine
  multi-binding actor whose OTHER binding would settle even under the
  bug — Red-Team's own report names the one-line fixture change needed;
  read it directly rather than re-deriving.
- **N4 (Reviewer-recheck) / NEW-MEDIUM-C (Red-Team-recheck)** — the
  MEDIUM-5 fix designates "the" aggregation-owning actor as whichever
  binding comes first in `definition.spec.graph.nodes` order — silently
  ambiguous (two actors legitimately bound to the same
  `outputOperationRef` deadlock one of them permanently; swapping two
  sibling entries in one node's `operations[]`, a semantic no-op,
  silently flips who is excused). No shipped protocol has this shape
  (both rounds independently grepped `completion.aggregation` — none
  found). **Resolved by the Coordinator**: do not attempt to pick a
  "correct" designated actor via any heuristic (graph order or otherwise)
  — this is a kernel session-engine cell, not a schema cell, so the fix
  stays structural, not a new validation rule. **Fix**: only apply the
  aggregation-output exclusion when EXACTLY ONE actor's binding matches
  `outputOperationRef` anywhere in the graph. If more than one actor binds
  it, apply NO exclusion to any of them — every such actor falls back to
  ordinary required-operation gating (the safe, conservative default this
  whole fix already uses elsewhere). Document the two-or-more-actors case
  as a named Gap (a future cell may want a schema-level rejection instead,
  per Red-Team's own suggestion — not built here, out of scope).
- **N3 (Reviewer-recheck), accepted as a named Gap, not fixed**: HIGH-1's
  fix covers `classifySessionQuorum`'s own `loadCoordinationProtocol`
  call, not `run.mjs:236`'s separate `aggregationCloseParams` load, which
  still throws uncaught on the same resolution-failure class — pre-existing
  code, not introduced or worsened by this cell, but the surviving half
  was never named. Add to §5 Gaps explicitly, scoped to "pre-existing,
  outside this cell's own kernel-file boundary (`run.mjs` verb layer, not
  `session-engine.mjs`)."
- **NEW-LOW-D (Red-Team-recheck), accepted as a named Gap, not fixed**:
  the original MEDIUM-5 finding had two halves — "key on actor+operation"
  (fixed) and "require a validated aggregation to actually exist before
  excusing anything" (dropped by §6, never tracked). Add to §5 Gaps.
- **N5 (Reviewer-recheck)**: trivial test-count correction in §7 — fix
  directly, no Fixer round needed for this one line, the Fixer should just
  correct it while touching the surrounding section for the other items
  above.

Both rounds independently confirmed the rest of Fix Round 1 holds: HIGH-1's
core wrap (10 resolution-failure shapes probed clean by Red-Team-recheck),
HIGH-2's deviation reasoning (both legs independently reproduced),
HIGH-3's corrections (read directly in both places), HIGH-4's four new
tests (independently falsified — deliberate gating mutations caught by
both rounds), MEDIUM-6/LOW-8/MEDIUM-7/INFO-9 (Gaps content and reasoning
both verified substantive, not just present). No item from Fix Round 1
needs to be re-litigated beyond what's listed above.

Next: Fixer dispatched for N1/N2+NEW-HIGH-A/NEW-HIGH-B/N4+NEW-MEDIUM-C/N3/
NEW-LOW-D/N5 in one round (Fix Round 2), followed by another independent
recheck pair — this track's established pattern for a hard cell (P06.2
took four such rounds before both independent rounds converged on APPROVE
with no further findings).

## 10. Fix Round 2

Status: DONE | Fixer, 2026-09-04. Implements every finding accepted in §9.
All code changes live in `src/runner/coordination/session-engine.mjs`
(uncommitted, same file this whole cell touches); test changes live in
`test/verbs/coordination-aggregation-surface.test.mjs`. No file outside
this cell's own May-Touch-plus-§1.4 list was touched. `current-cell.md`/
`index.md` untouched (Coordinator-owned).

### 10.1 N1 + N2/NEW-HIGH-A — one unified resolution-failure/drift path, symmetric across READ and CLOSE

Both findings converge on the same code (`classifySessionQuorum`'s
definition-resolution block) and were fixed together, exactly as §9
directed ("reuse the SAME refusal mechanism HIGH-2 already built... unify
resolution-failure and version-drift into one path"):

```js
let definition = null;
if (manifest.definitionRef) {
  let resolved = null;
  try {
    resolved = loadCoordinationProtocol(manifest.definitionRef.id, { cwd: opts.cwd, packageRoot: opts.packageRoot });
  } catch {
    resolved = null;
  }
  const drifted = resolved !== null && resolved.metadata.version !== manifest.definitionRef.version;

  if (opts.enforceDefinitionVersion) {
    if (resolved === null) {
      throw new CoordinationError('validation', `...but the definition could not be resolved -- refusing to close against an unresolvable definition`);
    }
    if (drifted) {
      throw new CoordinationError('validation', `...but the resolved definition is now version "${resolved.metadata.version}" -- refusing to close against a drifted definition`);
    }
    definition = resolved;
  } else {
    definition = drifted ? null : resolved;
  }
}
```

- **CLOSE** (`closeSessionByQuorum`, `opts.enforceDefinitionVersion: true`)
  now requires a cleanly-resolved, version-matched definition for BOTH
  failure classes, or refuses explicitly with an honestly-attributed
  `CoordinationError` — a resolution failure and a version drift each get
  their own correctly-worded message, but through the exact same gate,
  never a silent fallback (N1). The drift message text is byte-identical to
  Fix Round 1's own (an existing test at
  `coordination-aggregation-surface.test.mjs:488` matches it verbatim, and
  still passes). **Scope, added Fix Round 3 (R2-MEDIUM-C, both recheck2
  rounds independently — see §5's N3/R2-MEDIUM-C bullets for the full
  finding)**: this refusal is proven and correct at
  `classifySessionQuorum`/`closeSessionByQuorum`'s own exported engine-door
  boundary (real probes above, and §7.1/§7.2's own direct-engine-caller
  evidence). It is **not currently reachable through `run.mjs`'s primary
  production door (`fgos coordination run`)** — on a resolution failure,
  `run.mjs:236`'s own separate, pre-existing, unconditional
  `aggregationCloseParams` load throws an uncaught `FlowDefinitionError`
  first (evaluated as an argument to the SAME `closeSessionByQuorum` call,
  `run.mjs:526`), before `classifySessionQuorum` is ever entered. The
  *safety* property still holds end-to-end either way (a crash never closes
  the session; `manifest.status` stays `active`), but a caller of `fgos
  coordination run` sees the same raw crash before and after this whole
  cell's fix, not N1's correctly-attributed refusal message.
- **READ** (`evaluateSessionQuorum`/`show.mjs`) degrades to
  `definition = null` — the pre-existing fallback — on EITHER failure
  class, and never throws. This is Fix Round 1's own HIGH-1 shape
  (resolution failure), now extended to drift too (N2/NEW-HIGH-A): a
  drifted read reports the same fallback answer pre-fix `HEAD` would, instead
  of silently misreporting a genuinely-completed actor as `missing` under
  stamps that embed a version the read can no longer match. **Qualification,
  added Fix Round 3 (R2-LOW-E, both recheck2 rounds independently — see §5's
  own R2-LOW-E bullet)**: calling this degrade simply "honest" overstates
  it in the OTHER direction too — the same fallback can also report a
  genuinely-INCOMPLETE multi-binding actor (a later gating operation never
  dispatched) as falsely `completed`, with no drift/degradation signal
  anywhere in the payload. It is the deliberate, pre-fix answer (not being
  reversed here, per §9), not a new regression, and CLOSE still refuses
  under the same conditions — but "honest" alone is not the precise word
  for it; see R2-LOW-E for the full residual and the named follow-up.

The module-level comment above `classifySessionQuorum` was rewritten to
describe this symmetric-by-posture design directly (not by patching the
old asymmetric description), and to correct the false "pre-existing
laxness" claim both Reviewer-recheck (N2) and Red-Team-recheck
(NEW-HIGH-A) independently flagged in the old §7.2 prose — a correction
noted here, not silently made: the drifted-read misreport Fix Round 1
shipped was a genuine new regression against pre-fix HEAD, not
pre-existing behavior, and Fix Round 2 removes it.

**Real, live-reproduced evidence** (before/after, using the SAME probe
fixtures §7.1/§7.2 established, reused rather than reinvented — see
`fixround2-probe.mjs` in this session's scratchpad). "Before" was captured
by temporarily reverting ONLY this round's `classifySessionQuorum`
resolution-block edit back to its exact Fix Round 1 shape in the real file,
running the probe, then restoring the real Fix Round 2 code and re-running
— not narrated, not assumed:

```
$ node fixround2-probe.mjs   # BEFORE (Fix Round 1 code, reverted in place)
============================================================
N1 -- close-side resolution failure (unrelated malformed sibling protocol file)
============================================================
clean registry, op-two pending: close REFUSED -> [CoordinationError/validation] ... missing required actor(s) [worker-actor] ...
+ malformed sibling file: close CLOSED to "completed" -- op-two never performed <-- BUG if this fires
read path (evaluateSessionQuorum) with malformed sibling present: still works, missing=[]

============================================================
N2/NEW-HIGH-A -- read-side version drift (fgos coordination show equivalent)
============================================================
BEFORE drift  read: completed= [ 'worker-actor' ] missing= []
AFTER  drift  read: completed= [] missing= [ 'worker-actor' ] <-- WRONG (misreport) if worker-actor genuinely completed
close under drift: REFUSED -> [CoordinationError/validation] ... refusing to close against a drifted definition
```

```
$ node fixround2-probe.mjs   # AFTER (real Fix Round 2 code, restored)
============================================================
N1 -- close-side resolution failure (unrelated malformed sibling protocol file)
============================================================
clean registry, op-two pending: close REFUSED -> [CoordinationError/validation] ... missing required actor(s) [worker-actor] ...
+ malformed sibling file: close REFUSED -> [CoordinationError/validation] classifySessionQuorum: session "coord_fr2_n1" was
  opened against definition "test.coordination-protocol.fr2-probe@1.0.0", but the definition could not be resolved --
  refusing to close against an unresolvable definition
read path (evaluateSessionQuorum) with malformed sibling present: still works, missing=[]

============================================================
N2/NEW-HIGH-A -- read-side version drift (fgos coordination show equivalent)
============================================================
BEFORE drift  read: completed= [ 'worker-actor' ] missing= []
AFTER  drift  read: completed= [ 'worker-actor' ] missing= [] <-- correct (honest pre-fix truth)
close under drift: REFUSED -> [CoordinationError/validation] ... refusing to close against a drifted definition
```

Every claim from §9 verified directly: N1's malformed-sibling close now
refuses with a correctly-attributed reason instead of silently closing with
`op-two` never performed; N2/NEW-HIGH-A's drifted read now reports the
honest pre-fix `completed`/`missing` split instead of the wrong-cause
`missing`; the READ path stays unaffected and working under a resolution
failure (unchanged from Fix Round 1); CLOSE's own drift refusal (Fix Round
1 HIGH-2) is unaffected, still correctly worded.

### 10.2 NEW-HIGH-B — the MEDIUM-5 regression test's fixture is now genuinely falsifiable

Red-Team-recheck's own diagnosis (redteam-recheck-report.md) was applied
directly: `protocolDocCrossActorSynthesize` now gives `analyst-actor` a
SECOND, ordinary, unrelated declared operation (`analyst-review`, role
`coordinator`, at the same graph node as the two `synthesize` bindings),
dispatched and settled in the test's own `dispatchRequestCrossActor` helper
BEFORE the first "missing" assertion. Without this second binding, a
wrongly-reverted exclusion would leave `analyst-actor`'s gating set empty,
falling through to the pre-existing "first assignment-created event, any
door" fallback — which, finding no event yet, would ALSO report `missing`,
passing the assertion for the wrong reason. With the second binding
settled, a wrongly-applied exclusion instead leaves the gating set
non-empty but ALREADY SATISFIED (that one binding alone), reading
`completed` — discriminating.

This fixture change landed together with N4/NEW-MEDIUM-C's own kernel
change (§10.3) because the two are inseparable: Fix Round 1's MEDIUM-5 fix
designated "the" aggregation actor via graph order, and
`protocolDocCrossActorSynthesize`'s own fixture (2 actors bound to
`synthesize`) is exactly the ambiguous shape N4 changes the behavior for.
The single test that previously covered MEDIUM-5 alone is now split into
two, matching N4's own (a)/(b) acceptance shape (§10.3).

**Falsifiability verified directly, as §9 required** — the MEDIUM-5 kernel
fix (the actor-aware exclusion, not N4's separate exactly-one-actor logic)
was temporarily reverted to its pre-Fix-Round-1 shape (operation-id-only
exclusion, ignoring actor identity entirely) in the real file, in place,
then restored — not a separate scratch copy of the whole tree, since the
change is a single line easily reversed and re-applied verbatim:

```
$ node --test test/verbs/coordination-aggregation-surface.test.mjs   # MEDIUM-5 fix REVERTED
✖ P10-KERNEL-FIX Fix Round 2 N4/NEW-MEDIUM-C (b) + NEW-HIGH-B: when 2 DISTINCT actors bind
  the aggregation's own outputOperationRef, NEITHER is silently excused, and neither is
  permanently deadlocked
  AssertionError: expected ['analyst-actor', 'coordinator-actor'], got []
tests 14   pass 13   fail 1        <-- genuinely fails, as required
```

```
$ node --test test/verbs/coordination-aggregation-surface.test.mjs   # real fix restored
tests 14   pass 14   fail 0        <-- passes again
```

Confirmed genuinely falsifiable: reverting the actor-aware exclusion now
produces a real, direct assertion failure (`missing` reads `[]` instead of
both actors), not a coincidental pass through the fallback path.

### 10.3 N4/NEW-MEDIUM-C — the aggregation exclusion applies only when EXACTLY ONE actor binds `outputOperationRef`

`actorGatingOperationIds` no longer designates "the" aggregation actor as
the first graph-order binding found. It now collects every DISTINCT actor
bound to `outputOperationRef` into a `Set`, and only sets `aggregationActorId`
when that set has exactly one member:

```js
const boundActorIds = new Set();
for (const node of definition.spec.graph.nodes) {
  for (const ref of node.operations) {
    if (ref.ref === aggregationOutputOperationRef && ref.actor) boundActorIds.add(ref.actor);
  }
}
if (boundActorIds.size === 1) {
  [aggregationActorId] = boundActorIds;
}
```

With 2+ distinct actors bound, `aggregationActorId` stays `undefined`, so
the exclusion (`ref.ref === aggregationOutputOperationRef && actorId ===
aggregationActorId`) never matches for any real actor id — every such
actor falls back to ordinary required-operation gating, the conservative
default per §9's own resolution. No heuristic picks a "correct" designated
actor; this is a kernel session-engine cell, not a schema cell, matching
the Coordinator's own explicit instruction.

Per §9's own acceptance criteria, both (a) and (b) are now proven by
dedicated tests in `coordination-aggregation-surface.test.mjs`:

- **(a) single-actor case, no regression**: "P10-KERNEL-FIX Fix Round 2
  N4/NEW-MEDIUM-C (a)" — the plain, single-actor `protocolDoc` fixture,
  asserting `first.quorum.missing` is empty (coordinator-actor's own
  `synthesize` binding stays excluded) and the session closes cleanly
  without ever dispatching `synthesize`.
- **(b) 2-actor case, no exclusion for either**: "P10-KERNEL-FIX Fix Round
  2 N4/NEW-MEDIUM-C (b) + NEW-HIGH-B" (§10.2) — asserts both
  `coordinator-actor` and `analyst-actor` read `missing` while `synthesize`
  is undispatched for both, then proves neither is permanently deadlocked
  by dispatching both and reaching `completed`.

```
$ FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test test/verbs/coordination-aggregation-surface.test.mjs
tests 14, pass 14, fail 0
```

The 2-or-more-actors shape is named as a Gap (§5, the bullet immediately
above `## Summary`), per §9's own instruction — a future cell may want
schema-level rejection instead; not built here.

### 10.4 N3, NEW-LOW-D — named as Gaps, not fixed

Both added to §5 Gaps verbatim, at the same rigor as this report's other
Gaps entries (concrete scenario, why it is out of this fix round's own
scope, what a real fix would require). Not re-litigated here — see §5.

### 10.5 N5 — trivial test-count correction

§7.5's "was 10 before this round's three drift/MEDIUM-5-related changes"
corrected in place to "12," per Reviewer-recheck's own direct HEAD check —
see the correction inline in §7.5 above.

### 10.6 Full regression evidence (real runs, not narrated)

```sh
cd /home/vantt/projects/forgentX/.claude/worktrees/step-09-mvp6-to-mvp9

# The touched/extended aggregation-surface file alone
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test test/verbs/coordination-aggregation-surface.test.mjs
```
Result: `tests 14`, `pass 14`, `fail 0` (was 13/13/0 before this round; +1
net test from splitting the old MEDIUM-5 test into (a) and (b)).

```sh
# The five files Fix Round 1's own §7.8 exercised, re-run whole
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  test/runner/coordination-recovery-and-quorum.test.mjs \
  test/runner/coordination-visibility-window-fixture.test.mjs \
  test/runner/coordination-deliberation-method-chains.test.mjs \
  test/verbs/coordination-aggregation-surface.test.mjs \
  test/runner/coordination-aggregation.test.mjs
```
Result: `tests 118`, `pass 118`, `fail 0` (117/117 in Fix Round 1, +1 net
new test, zero regressions).

```sh
# The master-coordination-loop / group-thinking-lite set, re-run whole
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  test/verbs/coordination-group-thinking-rfc-review-lite-pack-conformance.test.mjs \
  test/verbs/coordination-group-thinking-nominal-group-lite-pack.test.mjs \
  test/verbs/coordination-group-thinking-delphi-feedback-lite-pack-conformance.test.mjs \
  test/verbs/coordination-run-live-proof.test.mjs \
  test/verbs/coordination-launch-master-loop.test.mjs \
  test/runner/coordination-driver-authorization.test.mjs \
  test/verbs/coordination-run-driver-steps.test.mjs \
  test/runner/dispatch-coordination-role-tiers.test.mjs \
  test/runner/coordination-research-fan-out.test.mjs \
  test/verbs/coordination-group-thinking-pack.test.mjs
```
Result: `tests 170`, `pass 170`, `fail 0` (byte-identical to Fix Round 1 --
this set has no test touched by this round).

```sh
# Combined focused regression, the same set §3/§7.8 used
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  'test/runner/coordination-*.test.mjs' 'test/verbs/coordination-*.test.mjs' 'test/runner/flow-definition*.test.mjs' \
  'test/architecture.test.mjs' 'test/setup/skill-wrappers.test.mjs' \
  'test/cli/coordination.test.mjs' 'test/setup/coordination-doctor-check.test.mjs'
```
Result (real run): `tests 761`, `pass 760`, `fail 1` on a clean run --
`coordination-static.test.mjs`'s own standing worktree-path false-fail,
identical to every prior cell in this track, re-confirmed by direct
inspection (every "forbidden import" violation resolves through this
worktree's own checkout path, which contains the literal substring
"worktree"). 761 vs Fix Round 1's 760: +1, the same net new test. A
FIRST run of this exact command also surfaced one additional failure,
`test/runner/coordination-store.test.mjs`'s own "two concurrent creators
racing the SAME logical task under one session... real OS-thread race, not
simulated sequentially" test -- verified as a transient flake, not a
regression, by re-running that one file alone 3 times in isolation
immediately after: `tests 43`, `pass 43`, `fail 0` every time. That test
exercises `src/runner/coordination/store.mjs`'s OS-level file-lock race
handling, entirely unrelated to `classifySessionQuorum`/
`actorGatingOperationIds` (the only functions this round's diff touches),
and its own name states plainly that it is inherently racy.

```sh
# Full-repo sweep, run from THIS worktree (uncommitted diff)
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test $(find test -name "*.test.mjs" | grep -v coordination-static.test.mjs)
```
Result (real run, ~184s): `tests 5558`, `pass 5550`, `fail 1`, `skipped 7`,
exit 0. The single failure, verified not assumed:
`test/cli/fgos-intake-4.test.mjs:318` (`seq: 3` vs `seq: 2`), the
byte-identical standing baseline every prior cell in this track has
independently reproduced (Fix Round 1 §7.8, this cell's §3, and every
other Phase 10 cell), entirely unrelated to `src/runner/coordination/**`.
5558 vs Fix Round 1's 5557: +1, the same net new test; 5550 vs Fix Round
1's 5548 pass: +1 new test, +1 because the `fgos-mirror.test.mjs`
transient-flake Fix Round 1 documented (§7.8) did not reproduce on this
run either -- consistent with it being a genuine transient flake, not a
real regression, as Fix Round 1 already concluded. Zero new regressions
from this fix round's own changes.

```sh
git status --short
```
**Filtered to this round's own two touched paths (Fix Round 3, R2-3,
reviewer-recheck2-report.md) — the real command's raw output lists more
paths (Fix Round 1's own diff, plus `current-cell.md`, unrelated to this
round); see the prose immediately below for why those are excluded here:**
```
 M src/runner/coordination/session-engine.mjs
 M test/verbs/coordination-aggregation-surface.test.mjs
```
Every other file already modified in this worktree (the three
group-thinking-lite conformance files, `coordination-recovery-and-quorum.
test.mjs`, `coordination-visibility-window-fixture.test.mjs`,
`coordination-deliberation-method-chains.test.mjs`) is Fix Round 1's own
diff, untouched by this round. `current-cell.md`/`index.md` untouched.

## Summary (Fix Round 2)

All seven accepted findings from §9 (N1, N2/NEW-HIGH-A, NEW-HIGH-B,
N4/NEW-MEDIUM-C, N3, NEW-LOW-D, N5) are addressed: N1 and N2/NEW-HIGH-A
fixed together as one unified, symmetric resolution-failure/drift path
(CLOSE always refuses explicitly with a correctly-attributed reason, READ
always degrades to the pre-fix fallback answer), with real live-reproduced
before/after evidence for both. **Qualification, added Fix Round 3
(R2-MEDIUM-C/R2-LOW-E, both recheck2 rounds independently — see §5 and
§10.1's own added scoping notes)**: N1's refusal is proven and correct at
the `classifySessionQuorum`/`closeSessionByQuorum` engine-door level, but
does NOT currently reach `run.mjs`'s primary production door (`fgos
coordination run`) — a separate, pre-existing `run.mjs:236` resolution
crash pre-empts it there (N3's corrected scope, §5). READ's degrade is
honest in the direction it was built for (never misreports a settled actor
as missing under drift) but not in the other direction (it can also
misreport a genuinely incomplete actor as `completed`, with no signal) —
see R2-LOW-E in §5. NEW-HIGH-B's regression test fixture is now genuinely
falsifiable, verified by reverting the underlying kernel fix and observing
a real failure, then confirming the real fix passes again; N4/NEW-MEDIUM-C
replaces the ambiguous graph-order "designated actor" heuristic with an
exactly-one-actor rule, proven by two new tests covering both the
no-regression single-actor case and the no-exclusion-for-either 2-actor
case; N3 and NEW-LOW-D are named as honest Gaps, not silently dropped; N5's
wrong count is corrected in place. Zero new regressions across every
regression tier this track uses: the touched file alone (14/14), the five
files Fix Round 1 exercised (118/118), the master-coordination-loop/
group-thinking-lite set (170/170, byte-identical to Fix Round 1), the
combined focused regression (760/761, the one failure being the same
standing environment false-fail every prior cell has documented, plus one
independently-confirmed transient flake on a first run), and the full-repo
sweep (5550/5558 pass, 1 failure, the same standing baseline every prior
cell in this track has reproduced).

Status: DONE
Summary: implemented every accepted Fix Round 2 finding from §9. N1 and
N2/NEW-HIGH-A were fixed as a single unified change (the disposition's own
framing) rather than two independent patches, verified with real
live-reproduced before/after probe evidence for both the close-side refusal
and the read-side honesty restoration. NEW-HIGH-B's falsifiability was
verified directly by reverting the real kernel fix in place, confirming a
genuine test failure, and restoring it. N4/NEW-MEDIUM-C's exactly-one-actor
rule was proven with both required test cases. Zero new regressions
anywhere this track measures.
Concerns/Blockers: none blocking. Three items are named, reasoned Gaps
(§5) rather than fixes, per §9's own explicit instruction that they stay
Gap-only: N3 (`run.mjs:236`'s own separate, pre-existing
`aggregationCloseParams` resolution-failure throw, outside this cell's
kernel-file boundary), NEW-LOW-D (the dropped "require a validated
aggregation to exist" half of the original MEDIUM-5 finding), and the
2-or-more-actors-bound-to-`outputOperationRef` shape (no shipped protocol
has it; a future cell may want schema-level rejection instead).

## 11. Disposition (Fix Round 3, Coordinator, 2026-09-04)

A second independent recheck pair ran against Fix Round 2. Both converged
on the SAME verdict shape: **the Round 2 kernel logic itself is correct —
neither round found a single new code defect after genuinely attacking
it** (Red-Team-recheck2 explicitly: "No new code defect — the Round 2
kernel logic held everywhere I attacked it," including 7 deliberate
mutation shapes for N4's actor-counting rule). What both rounds found
instead is an **evidence-trail gap**: the two accepted HIGH fixes (N1,
N2/NEW-HIGH-A) have **zero committed test coverage** — Red-Team-recheck2
proved this by replacing the entire Round 2 resolution block with Fix
Round 1's exact (buggy) shape and re-running the full coordination suite:
**724/723/1, identical in both arms, zero delta**. The Fixer's own §10.1
evidence was a throwaway scratchpad probe, never committed, never
rerunnable. This is the exact same defect class NEW-HIGH-B was raised to
fix last round, now recurring for N1/N2 instead. Full reports:
`P10-KERNEL-FIX-reviewer-recheck2-report.md`,
`P10-KERNEL-FIX-redteam-recheck2-report.md`.

Both rounds also independently found the SAME documentation-accuracy
problem, from two angles (Reviewer-recheck2's "R2-1", Red-Team-recheck2's
"R2-MEDIUM-B/C/D"): §5's N3 Gap and §10's own narrative both misstate
`run.mjs:236`'s real scope and effect. Both rounds proved, independently,
with real probes: `run.mjs:236` loads the bound protocol
**unconditionally**, seven lines before its own `:243` aggregation check
— so the uncaught resolution-failure throw fires for **every**
declared-protocol session (including all three group-thinking-lite
protocols this whole cell exists for), not only aggregation-declaring
ones as §5 currently states. Consequence: on the primary production door
(`fgos coordination run`), `aggregationCloseParams` throws BEFORE
`classifySessionQuorum` is ever reached, so N1's carefully-worded refusal
message is correct and proven at the engine-door level but does **not**
currently reach that door — a pre-existing crash (not a regression this
cell introduced or worsened) pre-empts it. The failure direction is still
safe (a crash leaves the session `active`, never wrongly `completed`), so
this is not a new HIGH — but §10's Summary language ("honest," presented
without qualification) oversells what's actually proven on the real user
path, and needs correcting, not silently left to mislead a future reader.

**Findings accepted, in a bounded Fix Round 3 — this round is test +
documentation work, not kernel-logic work:**

- **R2-HIGH-A (blocking, both rounds independently)**: add REAL, COMMITTED
  tests directly exercising `classifySessionQuorum`/`closeSessionByQuorum`
  (not a scratchpad probe) that would fail if either N1's close-refusal or
  N2/NEW-HIGH-A's read-degradation were reverted to Fix Round 1's shape.
  Two tests minimum, one per fix, in
  `test/runner/coordination-recovery-and-quorum.test.mjs` (the file this
  whole cell's own quorum-mechanism-level tests already live in) —
  matching the pattern the original Doer used for the Fix Round 1
  driver-authorized-gating test. Verify genuine falsifiability yourself
  before reporting done: temporarily revert the Round 2 resolution block
  to Round 1's shape in a scratch copy, confirm both new tests fail, then
  confirm both pass again against the real code.
- **R2-MEDIUM-B / Reviewer-recheck2's R2-1 (documentation)**: correct §5's
  N3 Gap to state the TRUE scope — `run.mjs:236` loads unconditionally for
  every declared-protocol session (not only ones declaring
  `completion.aggregation`), proven by both rechecks with a probe using a
  protocol that declares no aggregation at all. Keep the existing,
  correct framing that this is pre-existing and outside this cell's
  kernel-file boundary.
- **R2-MEDIUM-C (documentation)**: add an explicit statement — to §5 Gaps
  and to §10's own Summary/§10.1, wherever N1 is currently described as a
  fix without this qualification — that N1's refusal is proven and correct
  at the `classifySessionQuorum`/`closeSessionByQuorum` engine-door level,
  but is NOT currently reachable through `run.mjs`'s primary production
  door (`fgos coordination run`), because the same pre-existing
  `run.mjs:236` crash (R2-MEDIUM-B) pre-empts it first. Name this plainly,
  not as a footnote.
- **R2-MEDIUM-D (documentation)**: §5's existing drift-related bullet
  (around lines 380-391 as of Fix Round 2) still describes Fix Round 1's
  superseded state and cites §7 as if current — update the citation and
  description to reflect Fix Round 2's actual, current behavior.
- **R2-LOW-E (documentation)**: stop describing the degraded read as
  simply "honest" in §10.1/Summary without qualification — independently
  confirmed by both rechecks that it can report a genuinely-incomplete
  actor as `completed` (the pre-fix answer, deliberately chosen per §9,
  not being reversed) with no drift signal, exit 0. Add a precise §5 Gaps
  bullet naming this exact behavior so a future reader isn't misled by
  the word "honest" alone.
- **Reviewer-recheck2's remaining items** (§7.5 stale in 4 ways — the
  superseded "first graph binding" heuristic described as current, a
  cited test name that no longer exists post-split, an unreproducible
  quoted probe, a stale "13" vs the real "14"; §10.6's quoted
  `git status --short` showing a filtered 2-line view without labeling it
  as filtered): correct both, same documentation pass.

No kernel code change is in scope for this round beyond the two new
tests in R2-HIGH-A (which exercise existing, already-correct logic — they
do not change `session-engine.mjs`'s behavior, only prove it).

Next: Fixer dispatched for R2-HIGH-A (test work) plus the five
documentation items in one bounded round (Fix Round 3), followed by
another independent recheck pair. Given both Fix Round 2 rechecks found
zero new code defects after genuinely attacking the logic, this round is
expected to be the converging one — but the recheck pair decides that,
not this disposition.

## 12. Fix Round 3

Status: DONE | Fixer, 2026-09-04. Implements every finding accepted in §11.
This round is test + documentation work only — no kernel code change.
`src/runner/coordination/session-engine.mjs` is byte-identical to Fix Round
2's own (verified by `md5sum` before and after this round's work:
`7aaccdd306b12959bd211a8fce66bcec`, unchanged). The only code-adjacent
change is two new committed tests in
`test/runner/coordination-recovery-and-quorum.test.mjs`. Every
documentation correction was made in place in the section it belongs to
(§5, §7.5, §10.1, §10's own Summary, §10.6) — not merely described here.
`current-cell.md`/`index.md` untouched (Coordinator-owned).

### 12.1 R2-HIGH-A — committed, falsifiable regression tests for N1 and N2/NEW-HIGH-A

Two new tests added to `test/runner/coordination-recovery-and-quorum.test.mjs`,
immediately after the existing Fix Round 1 multi-operation-per-actor test
(reusing its own `multiOpQuorumDefinition`/`setupMultiOpQuorumFixture`
fixture, per §11's own instruction to match that test's pattern):

- **"P10-KERNEL-FIX Fix Round 3 (N1): closeSessionByQuorum refuses
  explicitly when the bound protocol cannot be resolved at close time,
  never silently falling back and closing anyway"** — gated-actor settles
  only its REQUIRED operation (`op-required`), deliberately leaving its own
  GATED driver-authorized operation (`op-gated-driver-auth`) undispatched,
  so gated-actor is genuinely incomplete. An unrelated, malformed sibling
  file is then dropped into the SAME project-tier registry directory the
  bound protocol lives in (`discoverCoordinationProtocols` scans the whole
  directory, so this breaks resolution of the bound protocol id too,
  without touching or removing its own file). Asserts `closeSessionByQuorum`
  throws a `CoordinationError` matching
  `/could not be resolved -- refusing to close against an unresolvable definition/`,
  that the session's `status` stays `active` (never silently `completed`),
  and that the READ door (`evaluateSessionQuorum`) keeps working under the
  same broken registry (degrading to the loose pre-existing fallback, which
  reports gated-actor complete on its first assignment alone — the
  pre-existing, intentional READ-side laxness, not something this test
  reverses).
- **"P10-KERNEL-FIX Fix Round 3 (N2/NEW-HIGH-A): evaluateSessionQuorum (the
  read door) reports the honest pre-fix completion under a
  version-drifted bound protocol, never a false 'missing' for a
  genuinely-completed actor"** — both gated-actor and ungated-actor fully
  complete every one of their gating operations BEFORE the protocol
  drifts. The bound protocol's own version is then bumped in place (same
  file, same id — a real author edit, not a removal/corruption). Asserts
  the READ door still reports `missing: []` and both actors `completed`
  after the drift (their already-settled Assignments' own
  `protocol-operation:` stamps embed the OLD version and can no longer
  match the newly-resolved, drifted definition — this is exactly the
  regression N2/NEW-HIGH-A fixed), and that the CLOSE door still refuses
  explicitly under the same drift with the correctly-attributed "refusing
  to close against a drifted definition" message (Fix Round 1's own HIGH-2,
  unaffected by this round).

**Falsifiability verified directly, per §11's own instruction** — using a
throwaway, hardlink-based scratch copy of the whole worktree
(`cp -al`, one file's hardlink broken and replaced with a real copy before
editing, so the real worktree's `session-engine.mjs` was never opened for
write), NOT the real file:

```
$ md5sum src/runner/coordination/session-engine.mjs   # real file, before this check
7aaccdd306b12959bd211a8fce66bcec

# scratch copy's session-engine.mjs resolution block reverted to Fix Round 1's
# exact reconstructed shape (resolution failure silently degrades to
# `definition = null` on BOTH doors; version drift throws only at CLOSE,
# while READ keeps using the drifted, non-null resolved definition)

$ node --test test/runner/coordination-recovery-and-quorum.test.mjs   # MUTATED (scratch copy)
✖ P10-KERNEL-FIX Fix Round 3 (N1): ...
  AssertionError: Missing expected exception — close silently succeeded instead of refusing
✖ P10-KERNEL-FIX Fix Round 3 (N2/NEW-HIGH-A): ...
  AssertionError: actual: [{actorId:'gated-actor'},{actorId:'ungated-actor'}], expected: []
ℹ tests 31   ℹ pass 29   ℹ fail 2        <-- both new tests genuinely fail, nothing else does

$ md5sum src/runner/coordination/session-engine.mjs   # real file, after the check
7aaccdd306b12959bd211a8fce66bcec        <-- unchanged; the real file was never edited

$ node --test test/runner/coordination-recovery-and-quorum.test.mjs   # real, unmodified code
ℹ tests 31   ℹ pass 31   ℹ fail 0        <-- both pass again against the real code
```

Confirmed genuinely falsifiable and genuinely passing against the real,
unmodified code: reverting the resolution block to Fix Round 1's shape
produces exactly two real assertion failures (N1's close silently succeeds
instead of refusing; N2's read misreports both genuinely-completed actors
as `missing`, the exact regression class both accepted findings exist to
close), and nothing else in the file regresses under that mutation.

### 12.2 Documentation corrections — made in place, summarized here

Every item below was corrected directly in the section it belongs to, per
§11's own instruction, not merely narrated in this section:

- **R2-MEDIUM-B**: §5's N3 Gap bullet corrected in place — the uncaught
  `FlowDefinitionError` at `run.mjs:236` fires for **every**
  declared-protocol session (the load is unconditional, seven lines before
  `run.mjs:243`'s own aggregation check), not only ones declaring
  `completion.aggregation` as the bullet previously stated. The
  accept-as-Gap decision itself was NOT reopened (§11 left that the
  Coordinator's own call, not this round's) — only the scope statement was
  corrected.
- **R2-MEDIUM-C**: a new §5 Gap bullet added immediately after the
  corrected N3 bullet, naming plainly that N1's refusal is proven and
  correct at the `classifySessionQuorum`/`closeSessionByQuorum` engine-door
  level but is NOT currently reachable through `run.mjs`'s primary
  production door (`fgos coordination run`), because R2-MEDIUM-B's same
  pre-existing crash pre-empts it first. The same qualification was added
  to §10.1's own CLOSE bullet and to `## Summary (Fix Round 2)` — not left
  to imply a fully user-facing fix.
- **R2-MEDIUM-D**: §5's stale version-drift bullet (previously describing
  Fix Round 1's own superseded posture and citing §7 as current) rewritten
  in place to describe Fix Round 2's actual, current symmetric-by-posture
  behavior, citing §10.1 instead.
- **R2-LOW-E**: a new §5 Gap bullet added (after the 2-or-more-actors
  bullet) naming precisely that the degraded-read posture is honest in only
  one direction — it can also report a genuinely-incomplete multi-binding
  actor as falsely `completed`, with no drift/degradation signal anywhere
  in the payload. §10.1's own READ bullet and `## Summary (Fix Round 2)`
  were both softened from an unqualified "honest" to name this precisely,
  with a pointer to the Gap.
- **Reviewer-recheck2's §7.5 staleness (4 issues)**: §7.5 now opens with an
  explicit supersession note (added, not a silent rewrite of the historical
  section) stating plainly that everything below it describes THIS round's
  (Fix Round 1's) own original shape: (1) the "first graph binding found"
  designated-actor heuristic, superseded by Fix Round 2's N4/NEW-MEDIUM-C
  exactly-one-actor rule (§10.3); (2) the cited test name
  ("P10-KERNEL-FIX MEDIUM-5: a DIFFERENT actor...") no longer exists,
  split by Fix Round 2 into the two named, currently-real tests (§10.2/
  §10.3); (3) the quoted probe output (`missing=['analyst-actor']` only)
  is specific to this round's own heuristic and does not reproduce under
  Fix Round 2's real code, which reports both actors missing (§10.2's own
  probe output is the current, reproducible one); (4) the quoted file
  total (`tests 13`) is this round's own count — the file is `tests 14` as
  of Fix Round 2's split (§10.6).
- **Reviewer-recheck2's §10.6 staleness (R2-3)**: the quoted
  `git status --short` block labeled as filtered to this round's own two
  touched paths, rather than presented as unfiltered raw command output.

### 12.3 Regression evidence (real runs, not narrated)

```sh
cd /home/vantt/projects/forgentX/.claude/worktrees/step-09-mvp6-to-mvp9

# The directly touched file alone
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test test/runner/coordination-recovery-and-quorum.test.mjs
```
Result: `tests 31`, `pass 31`, `fail 0` (was 29/29/0 in Fix Round 2; +2 net
new tests, both passing).

```sh
# The five files Fix Round 1's own §7.8 / Fix Round 2's §10.6 exercised
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  test/runner/coordination-recovery-and-quorum.test.mjs \
  test/runner/coordination-visibility-window-fixture.test.mjs \
  test/runner/coordination-deliberation-method-chains.test.mjs \
  test/verbs/coordination-aggregation-surface.test.mjs \
  test/runner/coordination-aggregation.test.mjs
```
Result: `tests 120`, `pass 120`, `fail 0` (was 118/118/0 in Fix Round 2; +2,
zero regressions).

```sh
# The master-coordination-loop / group-thinking-lite set, re-run whole
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  test/verbs/coordination-group-thinking-rfc-review-lite-pack-conformance.test.mjs \
  test/verbs/coordination-group-thinking-nominal-group-lite-pack.test.mjs \
  test/verbs/coordination-group-thinking-delphi-feedback-lite-pack-conformance.test.mjs \
  test/verbs/coordination-run-live-proof.test.mjs \
  test/verbs/coordination-launch-master-loop.test.mjs \
  test/runner/coordination-driver-authorization.test.mjs \
  test/verbs/coordination-run-driver-steps.test.mjs \
  test/runner/dispatch-coordination-role-tiers.test.mjs \
  test/runner/coordination-research-fan-out.test.mjs \
  test/verbs/coordination-group-thinking-pack.test.mjs
```
Result: `tests 170`, `pass 170`, `fail 0` (byte-identical to Fix Round 2 --
this set has no test touched by this round).

```sh
# Combined focused regression, the same set §3/§7.8/§10.6 used
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  'test/runner/coordination-*.test.mjs' 'test/verbs/coordination-*.test.mjs' 'test/runner/flow-definition*.test.mjs' \
  'test/architecture.test.mjs' 'test/setup/skill-wrappers.test.mjs' \
  'test/cli/coordination.test.mjs' 'test/setup/coordination-doctor-check.test.mjs'
```
Result: `tests 763`, `pass 762`, `fail 1` -- the same standing
`coordination-static.test.mjs` worktree-path false-fail every prior cell in
this track has documented (every "forbidden import" violation resolves
through this worktree's own checkout path, containing the literal
substring "worktree"), re-confirmed by direct inspection. 763 vs Fix Round
2's 761: +2, the same net new tests; 762 vs 760 pass: the same +2, zero new
regressions.

```sh
# Full-repo sweep, run from THIS worktree (uncommitted diff)
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test $(find test -name "*.test.mjs" | grep -v coordination-static.test.mjs)
```
Result (real run, ~185s): `tests 5560`, `pass 5552`, `fail 1`, `skipped 7`,
exit 0. The single failure, verified not assumed:
`test/cli/fgos-intake-4.test.mjs:318` (`seq: 3` vs `seq: 2`), the
byte-identical standing baseline every prior cell in this track has
independently reproduced, entirely unrelated to
`src/runner/coordination/**`. 5560 vs Fix Round 2's 5558: +2, the same net
new tests; 5552 vs 5550 pass: the same +2. The `fgos-mirror.test.mjs`
transient flake Fix Round 1 documented and Fix Round 2 did not reproduce
also did not reproduce on this run. Zero new regressions from this fix
round's own changes.

```sh
git status --short
```
Filtered to this cell's own touched paths (the real command also lists
pre-existing, unrelated foreign worktree state this whole track has
always left untouched — see index.md's "Anomaly found and left
untouched" note):
```
 M src/runner/coordination/session-engine.mjs   (untouched by this round -- Fix Round 1/2's own diff; md5sum verified unchanged, §12.1)
 M test/runner/coordination-recovery-and-quorum.test.mjs   (this round's two new tests)
 M test/verbs/coordination-aggregation-surface.test.mjs   (Fix Round 2's own diff, untouched by this round)
```
`test/runner/coordination-visibility-window-fixture.test.mjs`,
`test/runner/coordination-deliberation-method-chains.test.mjs`, and the
three group-thinking-lite conformance files are all Fix Round 1's own
diff, untouched by this round. `P10-KERNEL-FIX.md` itself (this document)
is a new, currently-untracked file. `current-cell.md`/`index.md`
untouched.

## Summary (Fix Round 3)

Both accepted findings classes from §11 are addressed: R2-HIGH-A (the
blocking item) adds two real, committed, independently-verified-falsifiable
tests for N1 and N2/NEW-HIGH-A directly to
`test/runner/coordination-recovery-and-quorum.test.mjs` — reverting the
resolution block to Fix Round 1's shape in a throwaway scratch copy (never
the real file, confirmed by `md5sum` before/after) makes both tests fail
for the exact right reason, and the real code passes both again. The five
documentation items (R2-MEDIUM-B/C/D, R2-LOW-E, and Reviewer-recheck2's
§7.5/§10.6 staleness) are corrected in place in the sections they belong
to, not merely described here: N3's real scope (every declared-protocol
session, not only aggregation-declaring ones) is now stated correctly, with
its consequence (N1's refusal does not currently reach `run.mjs`'s
production door) named plainly wherever N1 was previously described without
that qualification; the stale drift-related Gap bullet now describes Fix
Round 2's real, current behavior; the degraded-read posture is no longer
called simply "honest" without the qualification that it can also
misreport an incomplete actor as complete; §7.5 carries an explicit
supersession note instead of silently describing deleted code and a dead
test name; §10.6's quoted `git status --short` is labeled as filtered. Zero
new regressions across every regression tier this track uses, each
increased by exactly the net two new tests this round added: the directly
touched file (31/31), the five Fix Round 1/2 files (120/120), the
master-coordination-loop/group-thinking-lite set (170/170, byte-identical),
the combined focused regression (762/763, the one failure being the same
standing environment false-fail every prior cell has documented), and the
full-repo sweep (5552/5560 pass, 1 failure, the same standing baseline
every prior cell in this track has reproduced).

Status: DONE
Summary: implemented every accepted Fix Round 3 finding from §11 -- two
real, committed, falsifiability-verified tests for N1/N2's previously
untested HIGH fixes, plus five documentation corrections made in place
(N3's real scope, N1's unreachability through `run.mjs`'s production door,
the stale drift Gap bullet, the degraded-read's honest-in-one-direction-only
residual, and §7.5/§10.6's staleness). No kernel code change: `session-engine.mjs`
is byte-identical to Fix Round 2's own, verified by md5sum. Zero new
regressions anywhere this track measures.
Concerns/Blockers: none blocking. R2-MEDIUM-C's own open question (whether
to actually fix `run.mjs:236` so N1's refusal reaches the production door)
is explicitly left to the Coordinator, per §11's own scoping -- not
reopened or decided by this round.

## 13. Final Disposition — CELL CLOSED (Coordinator, 2026-09-04)

A final, independent recheck (`P10-KERNEL-FIX-final-recheck-report.md`)
ran against Fix Round 3 and returned **APPROVE**, with two of its own
independent strengthenings beyond what was asked: it verified N1 and N2
are each individually falsifiable (not merely as a pair — a stronger bar
than §11 required), and it verified every documentation correction
against real source rather than the report's own narration. Two
non-blocking polish notes were named; the `git status --short` labeling
note is applied above, the other (N1's trailing read assertion being
documentary rather than falsifiable) is accepted as-is — it correctly
documents the intentional READ/CLOSE asymmetry and was never claimed to
be a regression guard.

**R2-MEDIUM-C's open question, resolved by the Coordinator, not reopened
for a further round**: `run.mjs:236`'s own separate, pre-existing
`aggregationCloseParams` resolution-failure crash — which pre-empts N1's
refusal from reaching `fgos coordination run`'s production door — stays a
named Gap, not a fix, for three concrete reasons: (1) it is genuinely
pre-existing, not introduced or worsened by any of this cell's three fix
rounds (confirmed independently by two separate rechecks); (2) its
failure direction is safe — a crash leaves the session `active`, it never
wrongly transitions to `completed`, so no correctness property this cell
was authorized to protect is actually at risk; (3) fixing it requires
editing `src/verbs/coordination/run.mjs`, outside this cell's own
authorized kernel-file boundary — the user's original "fix it now"
authorization (and `current-cell.md`'s own May-Touch list) scoped this
cell to `classifySessionQuorum`/`closeSessionByQuorum` in
`session-engine.mjs` specifically, not the verb layer. Named precisely
enough in §5 (exact line numbers, exact mechanism) for a future cell to
close cheaply — matches this track's own established pattern for
systemic/adjacent residuals found but correctly left out of scope (e.g.
the "definition pinned by id+version, never content" residual carried
since Phase 07).

**Summary of the whole cell, for a future reader who does not want to
read all 13 sections**: `classifySessionQuorum`'s per-actor completion
rule was extended from "first assignment for this actor, anywhere" to a
graph-aware, multi-operation-per-actor rule (`required` bindings always
gate; `driver-authorized` bindings gate only when they also declare a
`contextAccess.visibilityWindowRef`, i.e. when MVP6's access-control
mechanism is doing real work rather than marking a genuinely-skippable
driver's-choice branch) — closing the exact premature-close bug
P10.6/P10.7/P10.8 independently found and P10.7's Red-Team live-reproduced
against already-shipped, closed code. Three fix rounds were needed after
the initial implementation, each triggered by a genuinely independent
Reviewer+Red-Team (or recheck) pair finding real, evidence-backed defects
the prior round introduced or missed — not process overhead, real bugs:
Round 1 fixed the original three protocols' bug plus a second real
multi-op shape found empirically (MVP7 aggregation-close); Round 2 fixed
an uncaught-throw regression, a silent version-drift mis-resolution, a
false "byte-identical" claim, and extended fixture coverage from 3 to 8
affected protocols; Round 3 closed a real test-coverage gap on the two
HIGH fixes Round 2 itself introduced and corrected five documentation
inaccuracies. The pattern matches this track's own established discipline
(P06.2 took four rounds for a comparably hard cell) — convergence, not
drift, since each round's defect count and severity strictly decreased
(9 → 7 → 0 code defects, with round 3 finding zero) and the final
independent round found nothing beyond optional polish.

**Status: CLOSED.** Ready for the Coordinator to commit this cell's full
diff to the track branch and update `index.md`/`current-cell.md`.
