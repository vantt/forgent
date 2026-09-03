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
| 06 | MVP6 | P06.1 done; P06.2 (runtime/grant enforcement/replay), P06.3 (proof/promotion) open | in-progress |
| 07 | MVP7 | P07.1 done (covers source-coverage/disclosure-presence slice of P07.2 only); outcome classification, hidden-dissent rejection, stale-revision rejection, consensus-with-unresolved-dissent still open (remaining P07.2 scope) + P07.3/P07.4 | in-progress |
| 08 | MVP8 | see phase-08 file | missing |
| 09 | MVP9 | see phase-09 file | missing |
| 10 | External acceptance | see phase-10 file | missing |

## Active Cell

Wave 2: P06.2 (visibility runtime/grant enforcement/replay) + P07.2-remainder
(outcome classification/dissent/staleness), each dispatched into its OWN
isolated worktree this time (`step-09-mvp6-to-mvp9-p06.2`,
`step-09-mvp6-to-mvp9-p07.2`, both branched from `8d2fa7d8`). See
`current-cell.md`.

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

Prepare Wave 2: P06.2 (visibility runtime, grant enforcement, replay —
`src/runner/coordination/*`, session-runtime lease) and the remaining P07.2
scope (outcome classification/dissent/staleness — `src/runner/team-cognition/*`
+ its tests only, per `P00.2.md`'s original Wave-1-scoped write-scope split;
re-confirm P07.2's exact write scope stays disjoint from P06.2's before
dispatch). Per plan.md's Parallel Execution Map, both are "Ready after
P06.1 and P07.1 respectively" — both now satisfied. **Dispatch into
SEPARATE isolated worktrees this time**, not a shared checkout, per the
process-deviation note above.

## Cell Log

| Cell | Requirements | Status | Commit |
|---|---|---|---|
| P00.1 | Phase 00 baseline/handoff audit | done | `85962bea` |
| P00.2 | Phase 00 contract/file-ownership map | done | `85962bea` |
| P06.1 | Phase 06 visibility definition schema/validation | done | (pending Wave 1 commit) |
| P07.1 | Phase 07 Team Cognition evaluator skeleton (partial P07.2 slice) | done | (pending Wave 1 commit) |

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
