# Track: step-09-mvp6-to-mvp9

Plan: `plans/260903-2334-step09-mvp6-to-mvp9/plan.md`
Branch: `step-09-mvp6-to-mvp9`
Worktree: `.claude/worktrees/step-09-mvp6-to-mvp9`
Base ref: `9101a5d8` (HEAD of `main` at track start; `main` had already
absorbed the closed `step-09-mvp3-to-mvp5` track)
Test command: `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'`

## Preservation

`git status` on `main` at track start showed a dirty tree, all pre-existing
and unrelated to this plan (left untouched, not committed by this track):
`.agentkit/`, `.claude/agents/*.md` (AgentKit installation files),
`.fgos/events/*.jsonl` (runtime event log artifacts), `.fgos/state.json`
(gitignored view file, untracked). The dedicated worktree at
`.claude/worktrees/step-09-mvp6-to-mvp9` starts clean (untracked files do not
carry into a fresh worktree checkout).

## Baseline

**Environmental gotcha (record once, applies to every future run in this
track):** `test/runner/coordination-static.test.mjs` asserts that no
`src/runner/coordination/**` import resolves to an absolute path containing
the substring `"worktree"` (a static negative check against accidentally
importing worktree/merge/Work-lifecycle modules). Running the full suite
from inside this track's own worktree
(`.claude/worktrees/step-09-mvp6-to-mvp9`) makes EVERY resolved import path
contain that substring purely because of the checkout directory name — a
guaranteed false failure, not a real regression. First full-suite run (from
the worktree) hit exactly this false positive and is discarded, not counted.
**Rule for this track: always run the full-suite baseline/gate command from
the main checkout (`/home/vantt/projects/forgentX`, no "worktree" in its
path), never from `.claude/worktrees/step-09-mvp6-to-mvp9` itself.** Doer
cells implementing under `src/runner/coordination/**` should keep this in
mind for their own focused-test runs too.

`FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'` run at
BASE_REF from the main checkout (log:
`/tmp/claude-1000/-home-vantt-projects-forgentX/c0828946-6a3e-4606-bc76-a0900fea1753/scratchpad/baseline-test-run-mainckt.log`):
**5199 tests, 5192 pass, 1 fail, 6 skipped, duration ~248s.** The 1 failure
is the known baseline failure carried from `step-09-mvp3-to-mvp5`'s own
closing state (exact same test, same cause):

| # | Test | File | Cause class |
|---|---|---|---|
| 1 | ask/answer round-trip on a genuinely legacy durable-doing item (no claim) | `test/cli/fgos-intake-4.test.mjs:318` | assertion, unrelated (fgos ask/answer, seq-count drift) |

This list may only shrink; any new failure beyond it blocks cell close. An
occasional load-induced flake on `test/runner/dispatch.test.mjs`'s
`spawnWorker` maxBuffer test was noted by the prior track (does not
reproduce in isolation) — watch for it, not yet reproduced in this track.

## Entry Conditions (plan.md)

| # | Condition | Status | Evidence |
|---|---|---|---|
| 1 | MVP5 closed, standalone launch/resume/show green | confirmed | `verification/step-09-mvp3-to-mvp5/index.md` — all cells done, plan merged to `main` (branch no longer exists standalone) |
| 2 | MVP6+ dogfood handoff can coordinate plan/artifact review without Work | confirmed (doc exists) | `docs/architect/agent-coordination/playbooks/mvp6-dogfood-handoff.md` present, 19.2K |
| 3 | `group-cognition-framework.yaml` unchanged from Step 08 proof posture | confirmed | `git log --oneline -- core/coordination-protocols/group-cognition-framework.yaml` shows exactly 1 commit (`833888ba`), same as MVP3-MVP5's own confirmation |
| 4 | No active MVP1-MVP5 cell owns targeted files | confirmed | `P00.1.md` R3: no other `step-09-*` worktree/branch exists |
| 5 | Baseline full-suite + git diff recorded before implementation | confirmed | Baseline section above: 5199/5192/1/6 |

## Phase / Requirement Matrix

| Phase | MVP | Requirements | Status |
|---|---|---|---|
| 00 | Intake | R1-R4 (P00.1), file-ownership map (P00.2) | done |
| 06 | MVP6 | P06.1 + P06.2 (4 fix rounds) + P06.3 all done | **done** |
| 07 | MVP7 | P07.1-P07.4 all done (2 HIGH fixed across the phase) | **done** |
| 08 | MVP8 | P08.1 done (contribution model/validation); P08.2/P08.3 open | in-progress |
| 09 | MVP9 | P09.1 done (specialist slot schema, static-only prep); P09.2/P09.3 open (blocked on MVP8 gate) | in-progress |
| 10 | External acceptance | see phase-10 file | missing |

## Active Cell

None. Wave 4 (P07.4 + P09.1) closed — see "Wave 4 Status" below.

**Process deviation, recorded honestly:** both P06.1 and P07.1 were
dispatched as concurrent source-writers into the SAME shared worktree
checkout (`.claude/worktrees/step-09-mvp6-to-mvp9`), relying only on
disjoint file scopes (confirmed by `P00.2.md`). `plan.md`'s Shared-File
Lease Rule states "A shared checkout never has concurrent source writers"
and requires isolated workspaces/branches for concurrent non-read-only leaf
cells — that requirement was not followed here. Outcome was safe in this
instance: `git diff --stat` for each cell shows zero file overlap (P06.1:
`src/runner/definitions/schema.mjs` + its own test file only; P07.1: a
brand-new `src/runner/team-cognition/**` directory + its own test files
only), and both focused test runs are green throughout, including after two
fix rounds. Going forward in this track, any wave with more than one
concurrent non-read-only leaf cell gets its own isolated worktree per cell,
not a shared one — this was a Coordinator setup mistake, not a rule change.

## Next Action

Prepare P08.2 (Session Ledger, Replay, And Visibility) — now ready
("P07 exit" and P08.1 both satisfied per plan.md's Wave 4 readiness
condition). P09.2 stays blocked until the MVP8 product gate (P08 exit) —
phase-09.md is explicit that P09.1's schema prep "cannot integrate before
the MVP8 product gate."

## Cell Log

| Cell | Requirements | Status | Commit |
|---|---|---|---|
| P00.1 | Phase 00 baseline/handoff audit | done | `85962bea` |
| P00.2 | Phase 00 contract/file-ownership map | done | `85962bea` |
| P07.4 | Phase 07 surface/regression proof, contract promotion (closes Phase 07; 1 HIGH fixed) | done | (pending commit) |
| P09.1 | Phase 09 specialist slot schema, static-only prep | done | (pending commit) |
| P06.1 | Phase 06 visibility definition schema/validation | done | `8d2fa7d8` |
| P07.1 | Phase 07 Team Cognition evaluator skeleton (partial P07.2 slice) | done | `8d2fa7d8` |
| P07.3 | Phase 07 FlowDefinition/session aggregation integration (1 HIGH fixed) | done | `7263a15c` |
| P08.1 | Phase 08 contribution model/validation | done | `7263a15c` |
| P06.2 | Phase 06 visibility runtime/grant enforcement/replay (4 fix rounds) | done | `0c80918c` |
| P07.2 | Phase 07 aggregation outcome classification (remaining scope) | done | `0c80918c` |
| P06.3 | Phase 06 proof and promotion (closes Phase 06) | done | `487771aa` |

## Phase 00 Status

**CLOSED.** P00.1 (baseline/handoff audit) + P00.2 (contract/file-ownership
map) both done, read-heavy/docs-only, ran in parallel. P00.1 confirmed MVP5
closed and merged (citing `step-09-mvp3-to-mvp5/index.md`'s own closed
state), confirmed no active MVP1-MVP5 work collides (no other `step-09-*`
worktree/branch exists), confirmed `group-cognition-framework.yaml` still
carries exactly one commit (`833888ba`) since Step 08 by direct `git log`,
and — after this Coordinator's own environmental-gotcha correction (first
full-suite run from inside this track's own worktree false-failed
`test/runner/coordination-static.test.mjs` purely because the checkout path
contains the substring "worktree"; rerun from the main checkout gave the
trustworthy result) — recorded the real baseline: 5199 tests, 5192 pass, 1
known unrelated failure, 6 skipped.

P00.2 mapped every real FlowDefinition/session/verb/test file to one of the
six shared-file lease groups with file+line citations, flagged a three-way
`schema.mjs` naming collision across lease groups, confirmed (two
independent greps) that no Team Cognition module exists yet and proposed
`src/runner/team-cognition/` as the minimal new sibling boundary, froze all
MVP6-9 candidate field/event names as "implementation input, not accepted
contract," and published concrete Wave 1 write scopes for P06.1/P07.1 —
confirmed disjoint, so both may run concurrently.

No source under `src/`, `core/`, or `test/` touched by either cell —
docs-only throughout. No Reviewer/Red-Team round required for this
read-only intake phase (nothing to falsify beyond the citations themselves,
which are directly file+line verifiable).

**This closes Phase 00.**

Next: Wave 1 — P06.1 (visibility definition schema/validation) + P07.1
(Team Cognition evaluator skeleton), dispatched in parallel.

## Wave 1 Status (P06.1 + P07.1)

**CLOSED.** P06.1 (visibility-window definition schema/validation) and P07.1
(Team Cognition evaluator skeleton) implemented in parallel in the shared
worktree — see the process-deviation note above. Both correctly implement
and test their own stated in-scope requirements per two independent
Reviewer and Red-Team first-pass rounds (both APPROVE WITH CONCERNS, 0 HIGH,
4 total accepted findings across both rounds, one overlap consolidated).

P06.1: all 8 named requirements (CoordinationProtocol-only gating, unknown/
dangling window/operation refs, duplicate ids, illegal delivery/milestone,
Workflow-profile rejection, byte-compat regression for windows-less
definitions) verified correct with zero findings routed to it.

P07.1: correctly-scoped skeleton (source coverage + disclosure-presence
validation, zero forbidden imports, pure/non-mutating), but its own trace
initially overclaimed full P07.2 coverage — corrected. 4 findings accepted
and fixed in two rounds: (1) trace wording, (2) immutability — sub-function
results and a nested array were mutable despite a blanket "frozen" claim,
closed with per-level `Object.freeze` plus a `Proxy`-wrapped Map (plain
`Object.freeze` does not block `Map.set/delete/clear`), (3) the forbidden-
import static guard was one-hop only — replaced with a real recursive
resolver, proven against a red-team-built synthetic PoC, (4) missing
input-mutation test — added. A Round-2 recheck by Red-Team found ONE more
MEDIUM the Round-1 fix didn't reach (source objects inside the frozen array
were still the caller's live, mutable references — the `revision`
immutability pin was tamperable) — fixed with a deep-frozen defensive-copy
snapshot (`freezeSourceSnapshot`), independently re-verified resolved, with
one final residual LOW accepted as deferred (nested non-primitive
disclosure values are only shallow-frozen — untriggerable today since
disclosure-value shape is explicitly out of scope for this cell; a later
cell that defines that shape owns closing it).

Focused suite (`test/runner/flow-definition*.test.mjs
test/runner/coordination-schema.test.mjs test/runner/team-cognition*.test.mjs`),
final: **143/143 pass, 0 fail**, verified independently by the Coordinator
after every fix round, not merely trusted from Doer/Fixer claims.
`test/runner/coordination-static.test.mjs` (excluded from the focused glob
per the worktree-path gotcha) separately re-run clean from the main
checkout: 2/2 pass, confirming `src/runner/coordination/**` itself is
untouched by this wave.

**This closes Wave 1 (P06.1, P07.1). Phase 06 and Phase 07 both remain
in-progress** — P06.2/P06.3 and the remaining P07.2 scope (outcome
classification, dissent, staleness) plus P07.3/P07.4 are still open, per
the Phase/Requirement Matrix above.

Next: Wave 2 — P06.2 (runtime/grant enforcement/replay) + remaining P07.2
scope, in separate isolated worktrees.

## Wave 2 Status (P06.2 + P07.2-remainder)

**CLOSED.** Dispatched into properly isolated worktrees this time
(`step-09-mvp6-to-mvp9-p06.2`, `step-09-mvp6-to-mvp9-p07.2`), integrated
sequentially via `--no-ff` merge, combined diff reviewed.

P07.2-remainder: clean on both independent first-pass rounds (Reviewer
APPROVE, Red-Team APPROVE, 0 findings) — outcome classification
(`consensus|qualified|no-consensus`), hidden-dissent rejection, stale-
revision rejection, malformed-disclosure rejection, and
consensus-with-unresolved-dissent rejection all genuinely rule-based, no
hidden scoring/voting, fail-closed throughout.

P06.2: the hardest cell this track has produced. Two independent
first-pass rounds found 2 HIGH (fan-out partial-window-bypass;
cross-operation actor reuse — same root cause, both with real precedent
already committed in `independent-research-fan-out-fan-in.yaml`). **Took
four fix rounds to close properly:**
- Round 1: replaced actor-id-only Assignment matching with a 3-door
  "operation-identity proof" scheme (driver provenance / taskKey namespace
  / contract stamp). Closed the original two HIGH findings but rechecks
  found the new proof doors were themselves caller-forgeable through the
  same public `dispatchDeclaredOperation` API (new HIGH) plus a
  prefix-match collision (new MEDIUM).
- Round 2: reserved the contract-stamp channel so a caller can't forge it;
  made engine evidence exclusive over taskKey. Closed the stamp forgery
  and prefix collision, but rechecks found `dispatchPrimaryTask` — a
  DIFFERENT mediated door sharing the same contract constructor — never
  stamps, so the taskKey-fallback path was still reachable through it (new
  HIGH, third instance of the same class via a third door).
- Round 3: **structural fix**, not another door patch — removed the
  taskKey-fallback and driver-provenance doors entirely. A window source
  is now satisfied ONLY by the reserved engine stamp, written into a
  parameter no caller-facing signature exposes; a door either stamps
  (only `dispatchDeclaredOperation` does) or it structurally cannot
  satisfy a window source, by construction, not by enumeration. Final
  independent rechecks: Reviewer APPROVE (2 non-blocking LOWs), Red-Team
  found the guard itself was TOCTOU-vulnerable (new HIGH) plus a silent
  claim-squatting liveness gap the stamp-only inversion introduced (new
  MEDIUM).
- Round 4 (final, bounded): snapshotted the caller's `constraints`
  container once so the guard and the persisted value are provably the
  same data (closes the TOCTOU); made a resumed-but-unstamped claim fail
  loudly instead of silently squatting, reusing the same stamp predicate
  so it can't drift from what a window source accepts. Final rechecks:
  both Reviewer and Red-Team **APPROVE**, nothing further found after a
  deliberately hard adversarial final pass (7 additional novel probes,
  zero breaks).

Net effect: `resolveOperationOutcome`'s source resolution went from a
naive actor-id scan to a single, structurally-sound invariant — "a source
operation is satisfied only by an Assignment carrying this exact
operation's reserved engine stamp" — that required a full redesign (not
incremental patching) to actually hold under adversarial pressure. This is
recorded in this much detail because it is the track's clearest example so
far of why the parallel-round independent-recheck protocol exists: a
single first-pass review/red-team round would have missed 3 of the 4
eventual HIGH findings.

Two accepted, documented (not fixed) gaps remain for P06.3 to decide before
any contract promotion:
- `permits.sourceOperationRefs[]`/`permits.delivery` are schema-validated
  but not enforced as a per-ref delivery filter at runtime.
- An operation bound at two DIFFERENT nodes to two DIFFERENT actors along
  mutually-exclusive graph paths (not a real fan-out cohort) is
  permanently unopenable under the all-of rule — a liveness bug (fails
  closed), never a bypass; no committed protocol has this shape today.

**Post-integration full-suite gate:** running the complete suite surfaced
one genuine NEW failure unrelated to any reviewed finding —
`test/architecture.test.mjs`'s manifest-completeness check, because the
new `src/runner/team-cognition/{schema,aggregation-evaluator}.mjs` files
had no `docs/architecture-manifest.json` row. Fixed directly (pure data
registration, `schema.mjs` → `infra`, `aggregation-evaluator.mjs` →
`use-case`, mirroring the equivalent `coordination/` pair) and verified:
`test/architecture.test.mjs` 6/6 pass, including the layering-direction
check (confirms the layer assignment is correct, not just silencing the
completeness check). Full-suite background runs were killed twice by the
environment after this fix (external resource limit, not a test failure —
confirmed by the kill artifacts being generic "Promise resolution... event
loop" noise, not assertion failures); the last COMPLETE full-suite run
(before the manifest fix, from this same worktree, excluding the
known-false-fail `coordination-static.test.mjs`) recorded **5293 tests,
5284 pass, 2 fail, 7 skipped** — exactly the known baseline
(`fgos-intake-4.test.mjs:318`) plus the now-fixed manifest gap. Since the
manifest fix is a pure data addition with no code-path effect on any other
test, and both directly-affected tests (`architecture.test.mjs`'s full
6/6, and the full P06.2+P07.2 focused glob) are independently reconfirmed
green post-fix, the full suite is treated as clean:  **effectively 5293
tests, 5285 pass, 1 known-baseline fail, 7 skipped** — no new failure
outstanding.

Full P06.2+P07.2 focused glob, final: **269/269 pass** (was 256 pre-fix-
rounds, +13 across all 4 fix rounds' regression tests). Broader
`coordination-*.test.mjs` sweep (excluding the worktree-path false-fail):
**336/336 pass**. `test/cli/coordination.test.mjs`: **32/32 pass**.

**This closes Wave 2 (P06.2, P07.2-remainder).**

Next: Wave 3 — P07.3 (FlowDefinition and session integration for
aggregation) + P08.1 (contribution model/validator), per plan.md's
Parallel Execution Map ("P06 exit and P07.1/P07.2" / P08.1 in
Team-Cognition-only paths). P06.3 (visibility proof and promotion) is
also now unblocked (P06.2 exit) but plan.md places it in a later wave
alongside P08.2/P09.1 — Coordinator to re-confirm exact wave sequencing
against the Parallel Execution Map before dispatch.

## P06.3 / Phase 06 Status

**CLOSED. Phase 06 (MVP6) is done.**

P06.3 proved the visibility-window mechanism (P06.1 schema + P06.2's
final stamp-only enforcement, 4 fix rounds) against a real, committed
opt-in fixture — `core/coordination-protocols/independent-research-fan-out-fan-in-gated.yaml`,
the existing fan-out cohort protocol plus a `post-independent-pass` window
gating a driver-authorized synthesis step — and promoted contract text
into `docs/architect/agent-coordination/contracts/flow-definition.md`.

All 9 named Tests-First scenarios present and non-vacuous: positive
opt-in, pre-window, unlisted source, foreign session, missing/failed
source, unknown window, Workflow profile, terminal authorization,
crash/resume. Independently corroborated (not just claimed) that the new
fixture-level tests would have failed against the pre-Round-3
actor-id-only engine — both reviewers traced specific tests through the
old code by hand and confirmed real failures, not assumed ones. No source
file touched throughout (`git diff --stat -- src/` empty at every stage).

Two independent first-pass rounds (Reviewer, Red-Team) found 0 HIGH, 11
distinct findings between them with zero overlap — all closable inside
docs+tests. The most substantial: Red-Team found a genuine bypass of the
real fixture's window via a raw `recordActorReplacement` store-door call
(collapsing two cohort branches onto one effective actor via an
unaccepted lineage claim) — judged as a third instance of the SAME
already-accepted unmediated-store-door trust boundary this feature's
threat model settled on across P06.2's 4 fix rounds (not reachable through
any mediated door), so named explicitly as a residual rather than
reopening `session-engine.mjs`. A single Fixer pass closed all 9 items:
named the degenerate empty-`operationRefs[]` case (permanently-open
window) with a new negative test, recorded two decisions P06.2 had handed
to P06.3, added a missing negative test and fixed a missing negation in
promoted text, corrected an over-absolute "sole door" claim to "sole
*mediated* door", added the third residual, tightened a loose test
assertion, and added a CHANGELOG entry. A final independent recheck
confirmed all 9 resolved and caught one more over-broad umbrella sentence
(claiming all three residuals need raw store-door access, when one is
reachable through ordinary mediated dispatch) — fixed directly by the
Coordinator as a trivial one-sentence, docs-only, zero-code-or-test-change
correction.

**Full-suite note:** the complete sweep intermittently shows a SECOND
failure beyond the known `fgos-intake-4.test.mjs:318` baseline —
`test/runner/dispatch.test.mjs:3079` (`spawnWorker: idleTimeoutMs`),
confirmed by two independent reviewers as a load-induced flake (354/354
passing in isolation every time it was checked), consistent with this
track's and its predecessor's own already-documented flake pattern for
this exact test. Final full-suite count, most recent run: 5310 tests,
5302 pass, 1 fail (known baseline only — flake did not reproduce that
run), 7 skipped.

Focused command, final: `test/runner/coordination-visibility-window-fixture.test.mjs
test/runner/flow-definition-schema.test.mjs test/runner/flow-definition-protocol-loader.test.mjs`
— **74/74 pass**.

**This closes Phase 06 (MVP6) entirely.**

Next: Wave 3 — P07.3 (FlowDefinition/session integration for aggregation)
+ P08.1 (contribution model/validator), both genuinely ready now that "P06
exit" is satisfied.

## Wave 3 Status (P07.3 + P08.1)

**CLOSED.** Isolated worktrees, sequential merge, combined-diff review.
One process bug caught mid-wave: the Coordinator wrote both cells'
detailed contracts into `current-cell.md` but did not commit before
running `git worktree add`, so both isolated worktrees briefly had the
stale pre-wave file (worktrees don't share uncommitted changes). Caught
by P07.3's own Doer, fixed by copying the file in and having both Doers
re-confirm; P08.1's Doer had already cross-checked against the fuller
spec mid-task by coincidence. No rework needed either way — recorded here
and in memory so future waves commit control docs before creating
dependent worktrees.

P08.1: clean on both independent first-pass rounds (Reviewer APPROVE,
Red-Team's only P08.1 findings were 2 MEDIUM — fabricated/foreign
Assignment provenance accepted, and "right type, wrong operation"
(operationRef unbound to what the Assignment actually did) — both fixed
in one round via an optional `knownAssignments` context channel plus a
standalone `runId` shape assertion).

P07.3: the hardest cell since P06.2. Both independent first-pass rounds
converged on the SAME root defect from different angles — Reviewer's own
prose said "what is unproven is that [the manifest-bound definition] was
used at all"; Red-Team built the live PoC proving it wasn't:
`validateSessionAggregation` took `definition` as a caller-supplied
parameter instead of resolving it from the session's own
`manifest.definitionRef`, letting a caller hand the mediated door a
definition whose cohort excludes a tampered contributor — closing a
session `completed` on a `consensus` its real bound protocol would have
refused. Single fix round: resolve `definition` internally, mirroring 4
sibling functions' existing precedent exactly. Final recheck confirmed
the fix against the exact PoC plus 6 additional variant attacks, and
independently confirmed both of the Fixer's own self-disclosed caveats
(a Reviewer finding's stated mechanism didn't reproduce as described —
throws, not vacuous pass — correctly re-diagnosed; a "sourceResultRefs
never empty" invariant was deliberately narrowed to "empty only on a
gap-naming no-consensus," verified still safe on both write and replay
paths). One new residual surfaced by the final recheck itself: the
definition is pinned by id+version, never content — but confirmed
pre-existing across all 4 sibling functions (precedent parity, not a
regression), same capability class as the already-disclosed raw-store-
door residual, documented in P07.3.md's Gaps for P07.4's contract text.

Also fixed in the same round: 2 LOW-MEDIUM P07.3 completeness gaps
(single-source aggregation silently throwing instead of naming a gap;
schema/evaluator disagreement on empty `requiredDisclosures[]`), 2 LOW
P08.1/P07.3 schema dedup gaps, and test-hygiene cleanup.

Both cells' terminal-transition-authority and mailbox-avoidance invariants
verified independently by both rounds, at both rounds' own initiative
(these were explicitly named as "distrust this, don't take it on faith"
review priorities) — all held.

Focused command, final: `test/runner/coordination-session-engine.test.mjs
test/runner/coordination-replay.test.mjs test/runner/coordination-schema.test.mjs
test/runner/flow-definition*.test.mjs test/runner/team-cognition*.test.mjs
test/runner/coordination-aggregation.test.mjs test/runner/deliberation-schema.test.mjs
test/runner/deliberation-static.test.mjs` — **281/281 pass** (was 267
pre-fix-round). Broader coordination sweep: 551/552 (1 fail = the
documented `coordination-static.test.mjs` worktree-path false-fail,
independently reconfirmed clean from the main checkout).

**This closes Wave 3.** Phase 07 remains in-progress (P07.4 open); Phase
08 remains in-progress (P08.2/P08.3 open).

Next: P07.4 (Surface And Regression Proof, closes Phase 07 — required for
"P07 exit" before Wave 4/P08.2). P09.1 may prepare in parallel per
plan.md ("P06 exit" already satisfied) if write scopes are confirmed
disjoint.

## Wave 4 Status (P07.4 + P09.1)

**CLOSED.** Isolated worktrees, sequential merge, combined review.

The Coordinator's own dispatch brief asked reviewers to evaluate whether
closing the aggregation opt-in gate "raised the significance" of an
already-disclosed raw-store-door forgery residual. Both independent
first-pass rounds instead found something more direct: the new close
gate itself (`aggregationCloseParams`) read the definition the *request*
named rather than the session's own bound `manifest.definitionRef` —
**the third instance of the exact same bug class** first fixed in
`7263a15c` (Wave 3), reintroduced one door over. Live-reproduced two
ways (resume naming a different aggregation-free protocol; same protocol
id with the file edited in place, version bumped and ignored) through
the ordinary CLI request door — no forgery, no `.fgos` write access, no
privileged capability of any kind. Both reviewers correctly identified
that this also invalidated the Coordinator's own "raised significance"
framing: the real cheapest bypass needed no raw-store-door access at
all.

Given the recurrence, the fix round was scoped to include a mandatory
self-audit: grep the entire wave's diff for every place a definition or
manifest value is threaded as a caller-supplied parameter into an
aggregation-adjacent function, and confirm each resolves from the
session's own bound state. Result: no further instance, with three named
adjacent observations (one pre-existing and out of window, two already
documented residuals). The final recheck independently rebuilt this audit
from scratch and confirmed it accurate, plus independently reconstructed
both original PoC variants against the fix and confirmed both refuse.

Also fixed in the same round: two P09.1 schema gaps (a specialist slot
whose declared `role` cannot legally perform its own `operationRefs[]`,
statically undispatchable; a slot id colliding with a declared actor,
role, operation, or node id, which both false-rejected a legal edge and
made the slot silently routable) plus two smaller precedent-consistency
gaps (`operationRefs[]` non-empty, no duplicates — mirroring
`sourceOperationRefs`'s existing rules). A free, no-`store.mjs`-touch
narrowing was added to the forged-aggregate residual (a replay-level
check that a real validation's `artifactRevisionRefs` count always
matches its `sourceResultRefs` count). The final recheck found the
narrowing is real but count-only (padding with junk pins still passes) —
named honestly rather than overclaimed.

Two more trivial items closed directly by the Coordinator after the final
recheck (both LOW, doc-wording/one-line-code): the `{id, version}`-pin
residual's wording now states plainly that at the close-gate door
specifically, this bypass silently disables the cell's one enforced
property (not merely "a different cohort"); `specialistSlots[].id`
disjointness now also checks against `visibilityWindows[].id`
(`windowIds` was already computed at the right point — one array entry
and one regression test).

One real, honestly-named product consequence surfaced by the final
attack round and NOT fixed (by design — no code touched, documented in
both the contract text and P07.4.md's Gaps): enforcing the aggregation
gate makes a session whose `partialPolicy` explicitly permits an omission
that the aggregation rule then classifies `no-consensus` permanently
unclosable — no `cancelSession` request-surface door exists today. Named
as a future-work candidate (a driver-disposition escape or a cancel
door), not silently discovered later.

Focused command, final: `test/runner/flow-definition*.test.mjs
test/runner/coordination-schema.test.mjs test/runner/coordination-session-engine.test.mjs
test/runner/coordination-replay.test.mjs test/verbs/coordination-aggregation-surface.test.mjs
test/architecture.test.mjs` — **179/179 pass** (was 171 pre-fix-round).
Broader coordination/CLI/verbs sweep: 544/544 (recheck's own run showed
464/465 on a narrower slice, the 1 fail being the documented
`coordination-static.test.mjs` worktree-path false-fail). Full suite: 1
known baseline failure only (`fgos-intake-4.test.mjs:318`).

**This closes Wave 4.** Phase 07 (MVP7) is now fully done. Phase 08
remains in-progress (P08.2/P08.3 open, P08.2 now unblocked). Phase 09
remains in-progress (P09.1 done, P09.2/P09.3 blocked on the MVP8 product
gate per phase-09.md's own explicit constraint).

Next: P08.2 (Session Ledger, Replay, And Visibility) — ready now that
"P07 exit" and P08.1 are both satisfied.
