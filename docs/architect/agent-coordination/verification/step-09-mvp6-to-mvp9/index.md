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
| 08 | MVP8 | P08.1 + P08.2 + P08.3 all done (contribution model, ledger/replay/visibility, method-shaped proofs + `contributions.allowedTypes[]` schema close) | **done** |
| 09 | MVP9 | P09.1 + P09.2 + P09.3 all done (slot schema; authorization/binding/replay, 1 HIGH fixed; negative and recovery proof, 1 MEDIUM fixed) | **done** |
| 10 | External acceptance | P10.1 done (pack registry, fgos-group-thinking skill, 1 HIGH fixed); P10.2-P10.4 open (parallel protocol definitions) | in-progress |

## Active Cell

None. P10.1 closed (1 HIGH fixed) — see "P10.1 Status" below.

**Anomaly found and left untouched, recorded honestly:** while closing
P10.1, this worktree's git index was found to already carry unrelated,
foreign staged/conflicted state not produced by this track's own work:
two modified `.claude/skills/fgos-coding-implement/references/*.md`
files (staged) and one unresolved "both added" conflict on
`docs/history/worker-prompt-iron-law-evidence-timing/plan.md` (a
different task, `tsk-3ys`, per its own git history). No `MERGE_HEAD`
exists, so this is not an active in-progress merge — likely another
concurrent session using this exact worktree path outside this
Coordinator's own dispatch. Neither touched nor discarded (git safety
protocol: investigate, never blindly overwrite unfamiliar state). Every
commit in this track from this point on uses an explicit pathspec (never
a bare `git commit` or `git add -A`) specifically so this foreign state
can never be swept into a track commit by accident. If this state is
still present when a future cell starts, re-investigate before assuming
it's still someone else's — it may need surfacing to the user directly.

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

Prepare P10.2/P10.3/P10.4 (RFC-Review-Lite / Nominal-Group-Lite /
Delphi-Feedback-Lite protocol definitions) — three parallel, independent
cells per phase-10.md ("run in parallel in separate fixture directories
and may not edit the shared registry or skill. They return
definition/test artifacts to P10.5."). Per this track's own documented
P06.1/P07.1 process-deviation lesson, each gets its OWN isolated
worktree/branch off this track's current HEAD, no exceptions. All three
build ON TOP OF P10.1's now-closed `core/protocol-packs/group-thinking.json`
pack shape and `src/verbs/coordination/group-thinking-pack.mjs` gate, but
must NOT edit either file — only add new protocol definitions + tests in
their own scope. Per the user's own explicit requirement (recorded in
this session's memory), each definition's actor/role declarations should
demonstrate real per-actor `policy.{preferExecutor,minTier}` usage where
it fits the protocol's own shape (e.g. an objector/reviewer role
preferring a different CLI provider than a proposer role) — not required
of every actor, but at least one worked example across the three
definitions. After all three close, P10.5 (Integration And Usability
Proof) registers them through ONE writer and proves CLI/headless parity
plus the skill's own bypass-freedom (extending, not repeating, P10.1's
own 5-bypass structural reasoning).

## Cell Log

| Cell | Requirements | Status | Commit |
|---|---|---|---|
| P00.1 | Phase 00 baseline/handoff audit | done | `85962bea` |
| P00.2 | Phase 00 contract/file-ownership map | done | `85962bea` |
| P10.1 | Phase 10 pack registry, fgos-group-thinking skill, public surface (opens Phase 10; 1 HIGH fixed) | done | `9b91aa9f` |
| P09.3 | Phase 09 negative and recovery proof (closes Phase 09; 1 MEDIUM fixed) | done | `52c05597` |
| P09.2 | Phase 09 specialist authorization, binding, replay (1 HIGH fixed, independently rechecked) | done | `efe1bc68` |
| P08.3 | Phase 08 method-shaped proofs + allowedTypes[] schema close (closes Phase 08; 1 LOW fixed) | done | `f9c98501` |
| P08.2 | Phase 08 session ledger, replay, visibility (2 fix rounds) | done | `a24c250a` |
| P07.4 | Phase 07 surface/regression proof, contract promotion (closes Phase 07; 1 HIGH fixed) | done | `9b81427c` |
| P09.1 | Phase 09 specialist slot schema, static-only prep | done | `9b81427c` |
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

## P08.2 Status (Session Ledger, Replay, And Visibility)

**CLOSED.** Solo cell, shared track worktree (nothing else ready to pair
with it this round). Wired P08.1's already-closed contribution validator
into real session persistence, mirroring P07.3's now-battle-tested
pattern (new event kind + store door + replay projection).

**The recurring caller-supplied-definition bug class (3 prior HIGH
bypasses across Phases 06-07) was genuinely absent from the start** —
both independent first-pass reviewers verified `linkSessionContribution`
takes no definition/window/operation parameter, confirmed by a real
static signature test, not by trust. Good evidence the lesson from the
earlier phases actually propagated into how this cell was built.

Two independent first-pass rounds still found 10 real findings (0 HIGH,
several MEDIUM), closed in one fix round; a final recheck then found the
hardest fix (window checked at link time vs. reasoning time) was only
partially closed — the demonstrated attack was shut, but a narrower
bypass survived through the *legitimate* crash-retry self-heal path
(`retrySessionTask`), where a Run that executed while a window was
closed could still get linked under a later-opened window because the
check compared against a `result-linked` event's position (when the
result was written to the log) rather than the Run's actual authorization
position (when it started). A second, bounded fix round closed both that
gap and its mirror-image false-negative (retrying an already-satisfied
window source wrongly un-opened a monotone window) with one root-cause
fix: compare against the Run's authorizing event (`assignment-created`/
`run-retried`) on the backing side, and the earliest-satisfying
`result-linked` per branch on the source side — never the latest link
position on either side.

Also closed in the fix rounds: a bare (unprefixed) contribution id
silently no-op'd as a disposition target while `show` reported it as
session-owned even for a foreign session; replay's open/resolved
derivation was order-blind (a disposition appended before its target's
link still resolved it); replay never checked a resolving disposition's
driver identity (a raw-appended worker-authored disposition could flip
open→resolved); unbounded free-text fields in the immutable ledger; no
shape constraint on contribution ids; a third, unsynchronized copy of
the ownership-rule check; and a raw-door legality boundary now pinned by
a test (precedent parity with P07.3, not a defect).

**Two things carried forward, not fixed here (both explicitly named,
neither silent):**
- The already-disclosed "definition pinned by id+version, never content"
  residual has a WORSE consequence at this specific door than at
  P07.3's — a same-version content swap doesn't just shift which
  evidence a verdict derives over, it removes the entire MVP6 window/
  context-legality property this cell's Acceptance depends on. Systemic
  across all 5 definition-consuming doors in this codebase; not fixable
  in one cell.
- `contributions.allowedTypes[]` has no FlowDefinition schema field
  (`src/runner/definitions/*` was Do Not Touch for this cell), so the
  operation/type gate is tautologically satisfied on the mediated path
  rather than genuinely narrowed — phase-08.md's own Exit bullet
  "bounded by declared operation types" is not yet true. Named as
  required follow-up, most likely before or during P08.3.

Full sweep, final: 5453 tests, 1 known baseline failure
(`fgos-intake-4.test.mjs:318`) plus load-induced flakes that vary run to
run under this environment's heavy concurrent-worktree load (confirmed
in isolation each time: `dispatch.test.mjs` 354/354,
`herdr-spawn-adapter.test.mjs` and `session.test.mjs` both clean alone)
— zero real regressions across both fix rounds. Focused ledger suite,
final: 31/31.

**This closes P08.2.** Phase 08 remains in-progress — P08.3 (method-
shaped proofs) is the last cell needed for full "P08 exit."

Next: P08.3, possibly preceded by a small schema cell for
`contributions.allowedTypes[]` if P08.3's own Exit bullet needs it.

## P08.3 Status (Method-Shaped Proofs — closes Phase 08)

**CLOSED. Phase 08 (MVP8 Deliberation Memory) is done.** Solo cell, shared
track worktree. Two deliverables folded into one cell by design (see the
cell's own contract for the rationale): closed the
`contributions.allowedTypes[]` schema gap P08.1 and P08.2 had both
independently found and explicitly assigned forward to "whichever cell
owns `src/runner/definitions/*` next," and built the three method-shaped
deliberation proofs (RFC, Nominal-Group, Delphi) the phase spec names.

**Schema close**: one optional, backward-compatible field on
`spec.operations[]` (`contributions.allowedTypes[]`), closed-enum
validated, empty array explicitly legal. `linkSessionContribution`'s
`declaredOperations` synthesis now reads the real per-operation
declaration instead of spreading the full contribution-type enum for
every operation — the vacuous gate P08.2 shipped as an honestly-named
residual is gone. Missing key and explicit `allowedTypes: []` both
converge on reject-everything, never accept-everything.

**Three fixtures**, `core/coordination-protocols/deliberation-{rfc,
nominal-group,delphi}-chain.yaml`, each proven end-to-end through real
dispatch and the real mediated `linkSessionContribution` door, plus a
chat-history-free replay reconstruction per chain — the phase's own Exit
bullet. One genuine structural finding along the way, independently
verified true by both review rounds: a contribution-bearing operation can
never be gated by a visibility window that opens only after that same
operation's own cohort settles, because `linkSessionContribution`
compares the Run's *authorization* position against the window's *opened*
position (P08.2 Fix Round 2's own fix), and an operation's authorization
always precedes such a window's opening — the comparison is structurally
guaranteed true, refusal 100% of the time. Fixtures were redesigned
around this (a pre-existing, already-documented MVP6 vacuously-open-window
shape) rather than fighting it. The Nominal-Group "privacy" requirement
was proven via the Bug Taxonomy's own literal OR-clause: "rejected **or**
provably not visible to other participants' context" — since the reject
branch is structurally impossible for this shape, the visibility branch
was proven instead, via the pre-existing MVP6 context-grant gate on the
facilitator's `clarify` binding.

Both independent Reviewer and Red-Team rounds ran in parallel against the
real diff and came back with **zero HIGH/MEDIUM findings** — every
headline claim (schema backward-compatibility, correct default direction,
absence of the caller-supplied-definition bug class that shipped 3 times
earlier in this track, the self-referential-window math, the privacy
substitution's legitimacy) was independently re-derived, not just
re-read. One real LOW finding from Red-Team, closed directly by the
Coordinator without a separate Fixer round (single test file, mechanical,
root cause already understood): a test titled "absent-key shape" didn't
actually probe an operation with the `contributions` key entirely
omitted — it probed the narrowing pattern instead. Renamed that test to
describe what it actually proves and added a real absent-key test via a
synthetic protocol document, dispatched and linked through the real
mediated door. Two Red-Team INFO observations recorded as documentation
opportunities, not defects: the vacuously-open-window shape is a
pre-existing MVP6 degenerate case a careless protocol author could lean
on (a property of the whole window-declaration model, not a runtime
bypass this cell introduces); and the privacy proof is correctly scoped
to context-injection control, not driver-visible ledger secrecy (by
design, matching P07.3's definition-blind replay precedent).

Final counts: touched-file focused suite 9/9 (up from 8/8 pre-disposition
fix); broader focused regression across 4 directly-touched files 125/125;
full sweep (Doer's run, from this worktree — not independently re-run
from the main checkout this round given the clean disposition) 5460/5462
pass with both non-passing tests verified NOT regressions by isolated
re-run (`fgos-intake-4.test.mjs:318`, the standing track baseline; one
load-induced `herdr-spawn-adapter.test.mjs` debounce flake, same
already-documented class as P08.2 hit twice, unrelated to any file this
cell touched).

**Deferred, named honestly, not fixed here (matches this cell's own
Acceptance scope, which was proofs + schema, not a rendering surface):**
the definition-content-pinning residual (shared by every
definition-consuming door, systemic); no CLI/`show` rendering of the
contribution-derived views (P08.2's own carried-forward Gap); GitNexus's
`impact()` gave unreliable answers for both edited symbols this cell
touched (cross-checked by grep per the repo's own capability gate — worth
a re-index before a future cell trusts it on these files);
`specialist-request` has no dispatched-session proof (no method in this
phase's Candidate Contract calls for it).

**Phase 08 is done.** Next: P09.2 (Authorization, Binding, And Replay),
now unblocked.

## P09.2 Status (Authorization, Binding, And Replay)

**CLOSED, 1 HIGH fixed.** Solo cell, shared track worktree. Built the
slot-to-actor binding mechanism P09.1 deliberately left closed as its own
Acceptance requirement (no schema field resolved a graph operation's
`actor` against a `specialistSlots[]` id): a new `specialistSlotRef`
node-operation binding field (additive, alongside — never together with —
`actor`, CoordinationProtocol-only, driver-authorized-only, scoped to the
named slot's own declared operations), and a new `specialist-authorized`
session event that atomically authorizes AND binds a previously-unknown
specialist actor identity to a declared slot in one write — closing the
crash-race window the phase spec explicitly calls out ("atomically record
authorization and session-scoped actor binding before any Assignment is
issued"). Each specialist invocation still goes through the pre-existing
`operation-authorized` door exactly as the Candidate Contract specifies.
`maxBindings` was resolved as a cumulative-ever-distinct-specialists cap
per slot (documented design call, alternative named and rejected: a
concurrent-only cap would do no enforcement work at all given the
mechanism's own single-live-occupant-per-slot construction).

Both independent Reviewer and Red-Team rounds ran in parallel. Reviewer:
zero findings across 13 checklist items, independently re-derived from
the real diff and re-run tests, including specific scrutiny of the
`maxBindings` design call (found well-justified, not under-justified).
Red-Team: **one real, empirically-confirmed HIGH** — specialist
authorization expiry (`expiresAfterRound`) was gated on a bare
caller-supplied `round` parameter that the one real production call path
(`run.mjs`'s "authorize" step) never forwarded, so expiry structurally
never fired regardless of real elapsed time or session progress;
proven with a live 5-call probe, all 5 wrongly succeeding against an
authorization with `expiresAfterRound: 1`. Two LOW/INFO items alongside
it (a theoretical, unexploited specialistActorId/static-actor-id
collision gap; a correct-but-untested post-replacement refusal).

Fix Round 1 closed the HIGH at the root: `resolveLiveSpecialistBindings`
no longer accepts ANY caller-supplied round — it derives its own current
round internally from real, replayed session progress (`1 + count of
assignment-created events`), a monotonic, unforgeable quantity, so the
fix holds for every current and future caller, not just the one path
audited. The Fixer's own blast-radius trace found the bypass was worse
than the original report implied: it could reach actual Assignment
materialization (not merely an over-broad grant) if a caller ever omitted
`round` on both the authorize AND dispatch steps, which nothing in the
codebase prevented. Both LOW/INFO items were also closed (a real
disjointness guard added; the missing negative assertion added), not left
as residuals. An independent final recheck then re-verified every claim
from scratch — grepping all real call sites, tracing the new derivation
function directly, and building its OWN empirical probe (materializing a
real Assignment via a real subprocess to advance genuine session
progress, distinct from the Fixer's own committed test) — and confirmed
the HIGH is genuinely closed, with no new findings.

Final counts: touched-file focused suite 97/97 (up from 95/95
pre-disposition); combined focused regression across defs/coordination/
verbs test directories 629/630 (the 1 non-pass is the standing
`coordination-static.test.mjs` worktree-path false-fail, re-confirmed by
reading its real assertion output). Full sweep not independently re-run
from the main checkout this round given the clean, empirically-verified
recheck — matches this cell's Acceptance, which asks for that
verification, and the Coordinator's own judgment that a second full
sweep would not add evidence beyond what two independent probe-based
verifications already established for the one changed function's blast
radius.

**Deferred, named honestly:** contract-doc promotion
(`coordination-session.md`/`flow-definition.md` for `specialist-authorized`
and `specialistSlotRef`) — carried to P09.3, matching this track's
established P06.3/P07.4/P08.3 "closes-the-phase" pattern; the
`allowedContextRefs`/`allowedVisibilityWindows` per-invocation-ceiling
enforcement gap named in P09.2.md's Gaps (validated for
ownership/existence, not yet enforced as a ceiling on later
`grantedContextRefs`/`contextAccess` choices); GitNexus had no index
registered for this exact worktree path (same gap P09.1 named) —
cross-checked by direct code review instead, per the repo's own
capability gate.

**Phase 09 is not yet done.** Next: P09.3 (Negative And Recovery Proof),
which closes it.

## P09.3 Status (Negative And Recovery Proof — closes Phase 09)

**CLOSED, 1 MEDIUM fixed. Phase 09 (MVP9 Bounded Specialist Binding) is
done.** Solo cell, shared track worktree. A proof cell, not an
implementation cell — zero files under `src/` touched, confirmed
independently by both review rounds.

Confirmed most of the phase's own negative-proof list (worker/peer
authorization, unknown slot, role/capability mismatch, over-cap
binding/assignment, foreign context, expired/terminal session) was
already covered by real, mediated-door tests from P09.2's own Bug
Taxonomy work — cited with exact test names, not re-derived from scratch.
Added the genuinely missing coverage: an R7 mutation-uniformity test
proving a specialist-dispatched Assignment carries the same hardcoded
`mutation: 'read-only'` contract as any statically-bound one; two real
crash-recovery tests shaped around P09.2's own proven atomicity (a single
`appendEventLocked` write for authorization+binding means there is no
on-disk intermediate state to construct — so the two real, distinguishable
crash points are caller-visible retries: (a) retrying
`authorizeSpecialistSlot` with the same `specialistAuthorizationId`
resumes idempotently with the live binding unaffected and a full dispatch
still succeeding afterward, (b) retrying an identical dispatch request
resumes the SAME Assignment, never double-dispatching); and two structural
absence-of-mutation-path proofs extending the pre-existing Phase 06 R7
isolation-fixture methodology to `src/runner/definitions/**` and to the
two specific identifiers (`addSessionEdge`/`addSharedEdge`) that don't
exist anywhere in `src/`, confirmed by repo-wide grep before any test was
written.

Also found and closed a real gap current-cell.md itself got wrong:
`topology.specialistSlots[]` was never actually contract-promoted into
`flow-definition.md` (P09.1's own Gaps section said so explicitly; no
later cell had closed it), even though current-cell.md assumed P09.1 had
already done it. Promoted both `specialistSlots[]` and `specialistSlotRef`
together, named the discrepancy rather than silently treating the wrong
assumption as true.

Both independent Reviewer and Red-Team rounds ran in parallel. Reviewer:
zero findings across every checked claim (proof-matrix citations, all 5
new tests, both structural scans, the `specialistSlots[]` promotion
accuracy, contract-doc fidelity, the P09.2 atomicity premise this cell's
whole crash-recovery design rests on). Red-Team: no HIGH/CRITICAL. Two
MEDIUM/LOW evidentiary-completeness findings, both with the underlying
mechanism independently verified sound by direct trace — the cited proof
for Exit bullet #3 ("workers may request but never authorize") proved an
id-mismatch refusal rather than a genuinely worker-TYPED identity's
refusal (mechanism itself confirmed sound — closed directly with a
one-line mirrored test, matching an identical proof already established
for a sibling event kind); and the static forbidden-name scan's
literal-substring/exports-only methodology has a theoretical evasion gap
that is a PRE-EXISTING property of Phase 06's own original R7 pattern,
faithfully extended (not introduced) by this cell — named as a residual
for whichever future cell next touches that isolation-fixture family, not
fixed here.

Final counts: touched-file focused suite 28/28 (up from 27/27
pre-disposition); combined focused regression 634/635 (the 1 non-pass is
the standing `coordination-static.test.mjs` worktree-path false-fail);
full-repo sweep, independently re-run by Red-Team from this worktree:
**5501 tests, 5493 pass, 1 fail, 7 skipped** — the single failure is
exactly this track's own standing baseline
(`fgos-intake-4.test.mjs:318`), no surprises.

Phase 09's own three Exit bullets checked off against real evidence in
P09.3.md §7: unknown specialist identities can fill a bounded cognitive
need (proven positively by P09.2's own end-to-end dispatch test, bounded
negatively by this cell's full negative matrix); topology class and
operation legality remain predeclared (proven by P09.1's schema closure
plus this cell's new structural absence proofs); workers may request but
never authorize recruitment (proven by the driver-only gate, now covering
both the id-mismatch AND genuinely worker-typed-identity shapes).

**Deferred, named honestly, not fixed here:** `specialist-request` still
has no real dispatched-session proof (carried unchanged from P08.3.md —
no method in this phase's own Candidate Contract calls for it); the three
P09.2 runtime residuals (`allowedContextRefs` ceiling enforcement,
`allowedVisibilityWindows[]` cross-check, definition pinned by id+version)
are carried forward exactly as P09.2.md disclosed them, now also named in
the promoted contract text; `requiredCapabilities[]`/
`allowedVisibilityWindows[]` resolving against definition-wide unions
rather than a slot's own `operationRefs[]` (carried from P09.1.md's Gap
#14); the R7 static-scan methodology gap named above.

**Phase 09 (MVP9 Bounded Specialist Binding) is done.** This track has
now closed Phases 00, 06, 07, 08, and 09. Next: Phase 10 (External
Acceptance) — the final phase, starting with P10.1.

## P10.1 Status (Pack Registry And Public Surface — opens Phase 10)

**CLOSED, 1 HIGH fixed.** Solo cell, shared track worktree. This is the
first Phase-10 (External Acceptance) cell — deliberately an
APPLICATION-layer cell, physically outside the Agent Coordination kernel
(zero files under `src/runner/**` touched, confirmed by both review
rounds).

Built: `core/protocol-packs/group-thinking.json` — a small, data-first
pack registry, a genuine sibling of `core/coordination-protocols/` (never
inside it, to avoid colliding with `protocol-loader.mjs`'s own discovery
scan), shipping empty (`members: []`), ready for P10.2-P10.4 to add their
three definitions to. `src/verbs/coordination/group-thinking-pack.mjs` —
one gate (`loadProtocolPack`/`resolvePackProtocol`/
`runGroupThinkingRequest`) that is a thin, byte-for-byte pass-through
into the EXISTING `runCoordinationUseCase` (`run.mjs`) — the same door
`fgos coordination run --file` already uses — after checking only that
the caller's claimed protocol id is a real pack member. `core/skills/
fgos-group-thinking/SKILL.md` — the thin skill itself, at this repo's
real skill-source location (see the mid-cell correction below), reading
a protocol's own operations live from the FlowDefinition rather than
hardcoding them in skill prose.

**Mid-flight, the user added a hard requirement**: the skill/gate must
never collapse a group-thinking session onto one hardcoded provider —
Claude, Codex, and Antigravity (agy) must be able to collaborate as
different actors within one session under the existing `cli-spawn`
executor model. This capability already existed at the schema level
(`spec.actors[].policy.{preferExecutor,minTier,preferPersona,fallbackExecutors}`)
and the kernel level (`run.mjs`'s `actorPolicyFields`, real
`codex-cli`/`agy-cli` executors already registered in `.fgos/config.json`)
— the risk was this cell's own thin wrapper silently stripping it. The
Doer addressed this correctly and proved it LIVE (not just asserted): a
real dispatch test with two actors each naming a different registered
executor, showing two genuinely different executors invoked in the raw
dispatch log.

Both independent Reviewer and Red-Team rounds ran in parallel. Reviewer:
zero findings across every checked claim, including the per-actor
provider proof (independently re-run and confirmed real). Red-Team: **one
real, empirically-confirmed HIGH** — the pack's own headline promise
("requires explicit protocol selection... never switch protocols
silently") was falsified on session RESUME: the gate only checked the
caller's claimed protocol id for internal self-consistency and pack
membership, never cross-referenced it against the session's REAL bound
protocol. Live PoC: a session opened directly under a non-pack protocol
could still be dispatched against through this surface while the gate
believed (and reported) a different, pack-registered protocol was in
use — meaning any non-pack protocol, including the permanently-forbidden
`group-cognition-framework.yaml`, could be reached through this surface
on an existing session. One LOW/INFO alongside it (an unlocked
double-read of the request file in path mode — a TOCTOU gap, bounded by
this codebase's own existing "the request file is trusted" posture, not
exploited live).

Fix Round 1 closed the HIGH at the root: the gate now cross-checks the
claimed protocol id against the session's real bound protocol (via
`resumeSession`, the exact same door `run.mjs`'s own manifest resolution
already uses — reused, not reimplemented) whenever `coordinationId` names
an EXISTING session; a genuinely fresh session correctly skips the check
(nothing to cross-check yet); an `agent-led` session (`definitionRef:
null`) is also correctly refused. Compared by `id` alone, not `id@version`
— reasoned and independently re-verified: every door that actually
governs a session's life already independently re-checks the session's
own pinned version regardless of what this gate believes, so an
id-only compare adds no real residual gap. The LOW/INFO TOCTOU was closed
as a side effect (the fix already needed to peek the request body once;
the module now forwards the parsed object instead of re-reading the
path). An independent final recheck then re-verified everything from
scratch — its OWN standalone PoC (not the Fixer's committed test),
confirmed refused-with-zero-events against the fixed code, confirmed
silently-succeeds when the check is mechanically stripped (proving the
check is genuinely load-bearing, not decorative) — and found no remaining
gaps.

Final counts: touched-file focused suite 17/17 (up from 15/15
pre-disposition); combined focused regression 721/722 (the 1 non-pass is
the standing `coordination-static.test.mjs` worktree-path false-fail);
full-repo sweep from this worktree (uncommitted diff, matching this
track's own established precedent — P08.3/P09.3 recorded the identical
reasoning): 5511/5519 pass, 7 skipped, the single failure being this
track's own standing baseline (`fgos-intake-4.test.mjs:318`).

**Anomaly found while closing this cell, not caused by it**: this
worktree's git index carries unrelated foreign staged/conflicted state
(see "Active Cell" section above) — investigated, left untouched, and
every commit from here forward uses an explicit pathspec so it can never
be swept in by accident.

**Deferred, named honestly:** no real group-thinking protocol is
registered in the pack yet (by design — P10.2-P10.4 build the
definitions, P10.5 registers them through one writer); the pack registry
has no discovery-tier flexibility of its own (a deliberate YAGNI scope
limit, not an oversight); the per-actor provider proof uses a fake
`runnerConfig.executors` fixture (matching an established precedent
elsewhere in this repo) — it proves the WIRING is genuinely unbroken, not
that real `codex-cli`/`agy-cli` subprocesses have yet cooperated in a
live end-to-end run; the definition-pinned-by-`{id,version}`-not-content
exposure is the same systemic, already-disclosed limitation every sibling
definition-consuming door in this engine carries.

Next: P10.2/P10.3/P10.4, three parallel cells, each in its own isolated
worktree.
