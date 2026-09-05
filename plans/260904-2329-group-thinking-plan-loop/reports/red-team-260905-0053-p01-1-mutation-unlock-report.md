# Red-Team Report — Cell P01.1 (Mutation Unlock)

Role: independent Red-Team, running in parallel, no access to Reviewer's findings.
Diff base: `86d0106c..8b24c8a2`.
Worktree: `/home/vantt/projects/forgentX/.claude/worktrees/agent-ab7ff2ac5eda7a106`

## Verdict: REJECT

## Method

Real throwaway attack scripts (never mocked/stubbed) run against this
worktree's own live source, attempting to falsify the "narrow, testable
four-condition rule" safety claim (R1-R3) and the R6a/R6b stamp/call-site
gate. Scripts preserved at
`/tmp/claude-1000/-home-vantt-projects-forgentX/a2984232-9072-4663-9d8a-440469a8964c/scratchpad/redteam-p01-1/`:
- `attack1-schema-scoping.mjs`
- `attack2to4-dispatch-gates.mjs`
- `attack5-stamp-forgery-direct-call.mjs`

Full findings, evidence, and per-attack detail are written into the
"## Red-Team" section of
`docs/architect/agent-coordination/verification/group-thinking-plan-loop/P01.1.md`
(append-only, per instructions — not duplicated here).

## Summary

**HIGH (1):** a self-forged `protocol-operation:` constraint string (using
the newly-`export`ed `PROTOCOL_OPERATION_STAMP_PREFIX` constant) passes
`execution-contract.mjs`'s and `assignment-normalizer.mjs`'s "engine-reserved
stamp" gate with no real engine session behind it. Calling `buildAssignment`
+ `executeAssignment` directly (bypassing `session-engine.mjs`/
`dispatchDeclaredOperation` entirely, so R1/R2/R3 are never reached) produced
a REAL file write against a simulated main checkout (confirmed via
`fs.existsSync` and `git status --short` showing the untracked file) — with
`opts.isReadOnlyMode` never even passed. This is new attack surface
introduced by this cell (before this diff, inline `mutation: 'mutating'` was
unconditionally refused, stamp or not), and it is exactly the risk the
plan's own R6(b) text names in the abstract but does not actually close: the
shipped mitigation (R6b's static `executeAssignment(` call-site enumeration
test) only covers call sites present in the repo at test-run time, not a new
module built on the already-exported `buildAssignment`/`executeAssignment`
primitives.

**Confirmed, no leak (8 attacks):** R1's step-type scoping (incl. a correctly
-shaped `contribution` step and case/whitespace variants the Doer's own test
didn't try), R2/R3's main-checkout and outside-git refusals (canary-file
checked absent in both, not merely inferred from the thrown error), R2's
`result.kind` forgery (including a spliced fake `result` claim on the
request), R6c's `operation-choice.mjs` non-reachability (independently
traced through `buildAssignment`'s branch logic, not re-trusted from either
prior claim), R7's committed-mutation grading (re-ran the Doer's own test in
isolation), R8's sibling-caller safety (grepped every real
`resolveCoordinationPaths`/`resolveSessionPaths` caller), the rollback claim
(`git revert --no-commit` in a scratch clone, clean, zero conflicts), and the
full regression sweep (659/660, matching the claimed count and the claimed
false-positive explanation for the 1 failure).

## Recommendation

Do not close this cell on the HIGH finding. Smallest fix direction: re-verify
R2 (`result.kind`) and R3 (worktree-vs-main-checkout) inside
`assignment-runner.mjs`'s own `validateAssignmentLegality`/`executeAssignment`
whenever `assignment.mutation === 'mutating'`, rather than trusting a
pre-check performed only by one caller (`session-engine.mjs`) and a
forgeable string-prefix convention. Alternatively, replace the string-prefix
stamp with a real capability (e.g. an unexported `Symbol` token only
`runExecutorAttempt` can produce) so a plain caller of the already-exported
`buildAssignment`/`executeAssignment` primitives cannot self-authorize.

Status: DONE
Verdict: REJECT
Findings: 1 HIGH, 0 MEDIUM, 0 LOW
Summary: A self-forged engine-reserved stamp bypasses R1/R2/R3 entirely via a direct `buildAssignment`+`executeAssignment` call, producing a real file write against a simulated main checkout with zero enforcement. All other attempted attacks (schema scoping, main-checkout/outside-git refusal, result.kind forgery, operation-choice.mjs reachability, R7 grading, R8 sibling callers, rollback) held.

## Recheck (post-HIGH-fix) — 2026-09-05

Fix commits `8883e0c9` (real fix) + `452f26fa` (wording only), same worktree.
Full detail in the "### Recheck (post-HIGH-fix)" subsection appended to
`docs/architect/agent-coordination/verification/group-thinking-plan-loop/P01.1.md`'s
own "## Red-Team" section. New scripts:
`recheck1-borrowed-real-ticket.mjs`, `recheck2-malformed-stamps-and-main-checkout.mjs`.

**Original HIGH: CLOSED, confirmed** — re-ran the exact original attack
script against the fixed code; now refused with no canary file written.

**New HIGH: confusion-of-authority / ticket reuse.** The fix's dispatch-layer
re-verification (`assertInlineMutatingAssignmentAuthorized`,
`assignment-runner.mjs`) confirms the CLAIMED `definitionId@version#operationId`
resolves to a real `CoordinationProtocol` operation declaring
`result.kind: 'work-product'` — but never binds the assignment's own actual
payload (objective, executor, constraints) to that operation, and never
checks any session/coordinationId relationship. Since `loadCoordinationProtocol`'s
`packageRoot` defaults to the real fgOS installation regardless of `cwd`,
every core-tier `CoordinationProtocol` shipped in this repo (e.g.
`core.coordination-protocol.standalone-master-coordination-loop@1.0.0#produce-candidate`)
is a universally valid, zero-privilege "ticket." Demonstrated: a fresh
unrelated repo + real worktree (no fixture written anywhere), an inline
contract with `objective: 'UNRELATED malicious payload'` and only that
borrowed real stamp, dispatched via direct `buildAssignment` +
`executeAssignment` (no session ever opened) — real worker ran, real file
written, graded `done`/`inferred`. Confirmed narrower than before: fully
fictitious operations, malformed/ambiguous/version-mismatched stamps, and
main-checkout `cwd` (even with this same real ticket) are all still
correctly refused (7/7 fuzz variants held). But the fix's own stated goal —
prevent "a real mutating write with none of R1/R2/R3 ever having run" for a
caller that bypasses `dispatchDeclaredOperation` — is not actually achieved:
R2/R3 hold in letter while completely disconnected from what is actually
executed. Notably, the Fixer's own 5th regression test in this diff encodes
this exact shape as intended/passing, not caught as a gap.

Legitimate path (`dispatchDeclaredOperation`, real definitionRef, real
worktree) reconfirmed unaffected — no false-positive regression. Full
regression sweep independently re-run: `tests 665 / pass 664 / fail 1` (same
pre-existing worktree-path false positive as before this fix). R9 smoke
independently re-run: passes.

**Smallest fix direction:** bind the re-verification to something the
caller cannot fabricate independent of a real session decision — e.g. a
session/assignment-scoped nonce cross-checked against a real on-disk
session record, or narrow eligible tickets to definitions actually opened
as a session for this dispatch, never any core-tier definition reachable by
id alone.

Status: DONE
Verdict: REJECT
Findings (recheck): 1 HIGH (new), 0 MEDIUM, 0 LOW — original HIGH confirmed closed
Summary: The original stamp-forgery bypass is closed, but a narrower confusion-of-authority bypass remains: any real, already-shipped work-product operation id is a zero-privilege "ticket" that authorizes an entirely unrelated mutating payload, since the fix never binds the assignment's actual content to the cited operation or to any real session.

## Recheck round 2 (post-confusion-of-authority-fix) — 2026-09-05

Fix commit `305338f0` (`assignmentIsMemberOfARealSession`), same worktree.
Full detail in the "### Recheck round 2 (post-confusion-of-authority-fix)"
subsection appended to the "## Red-Team" section of
`docs/architect/agent-coordination/verification/group-thinking-plan-loop/P01.1.md`
(not duplicated here). New scripts: `recheck3-a-original-attack.mjs`,
`recheck3-b-fabricated-session-record.mjs`, `recheck3-c-replay-real-id.mjs`.

**Round-2 attack: CLOSED, confirmed.** Re-ran the exact borrowed-real-ticket
attack; now refused with "is not a member of any real, on-disk coordination
session's own assignmentRefs."

**NEW HIGH (more severe than either prior finding): the new "session
membership" check trusts whatever JSON sits on disk — it never verifies
the session record was ever produced by a real registration flow.**
`assignmentIsMemberOfARealSession` (`assignment-runner.mjs`) is a plain
`fs.readdirSync` + `JSON.parse` + `Array.includes` scan of
`.fgos/coordination/sessions/*/session.json` — no signature, no lock, no
cross-check against the real event log. Demonstrated: computed my own
deterministic `assignmentId` (fully predictable —
`asgn_<writerId>_op_<seq>`), hand-wrote a fake
`.fgos/coordination/sessions/totally-fake-session/session.json` containing
`{"assignmentRefs": ["<my id>"]}` via plain `fs.writeFileSync` (never
calling `openDeclaredProtocolSession`/`createSessionAssignment`/
`completeAssignmentRegistration`, zero real coordination activity of any
kind), then called `executeAssignment` directly. Result: SUCCEEDED — real
worker ran, real file written, graded `done`/`inferred`. This requires no
pre-existing real session/assignment at all — two `fs` writes are the
entire "authorization."

**Related — replaying a genuinely real, legitimately-registered
assignmentId with a fresh, attacker-chosen executor also succeeds.**
Legitimately dispatched one real mutating assignment via
`dispatchDeclaredOperation` (grades `verified`), then called
`executeAssignment` a second time with the SAME real `assignmentId` but a
different `objective` and a fresh, attacker-controlled `runnerConfig`
(different executor script). Result: SUCCEEDED with the attacker's own
canary file written instead of the original output. Root cause: the
`runnerConfig`/executor identity is supplied fresh on every
`executeAssignment` call and is never pinned to the assignment — the
"assignment.json already exists, read back as immutable" guard protects
only stored metadata text, not which code actually runs. No race/timing
needed for either bypass — there is no legitimacy check to race against.

Malformed-stamp fuzzing spot-checked (still refuses); legitimate path
reconfirmed live inside the replay test itself (real dispatch → real
worktree → grades `verified`, exactly as before). Regression sweep
independently re-run: `tests 666 / pass 665 / fail 1` (same pre-existing
false positive). R9 smoke independently re-run: passes.

**Smallest fix direction:** cross-check the session manifest against the
real event log (`state/events.mjs`'s `readEvents`, the same source
`completeAssignmentRegistration` itself writes through) rather than trusting
a JSON file's mere presence/shape; and separately, refuse (or require a
matching, previously-recorded executor identity for) a second execution of
an assignmentId whose `assignment.json` already reflects a settled Run,
rather than accepting a fresh caller-supplied `runnerConfig` on every call.

Status: DONE
Verdict: REJECT
Findings (recheck round 2): 1 HIGH (new, more severe), 0 MEDIUM, 0 LOW — Round-2's confusion-of-authority finding confirmed closed
Summary: The borrowed-real-ticket bypass is closed, but the new session-membership check is a complete no-op against a hand-planted `session.json` requiring zero real coordination activity, and separately, any known assignmentId can be re-triggered with an attacker-chosen executor since executor identity is never pinned to the assignment.

## Recheck round 3 (post-trust-boundary-reframe) — 2026-09-05

Fix: revert of Round 2's target (`305338f0`, via `04d85670`) + `8996b44c`
(fail-closed gate requiring explicit `isReadOnlyMode: false`). Full detail
in "### Recheck round 3 (post-trust-boundary-reframe)" appended to the
"## Red-Team" section of P01.1.md. New script:
`recheck4-a-data-only-request-document.mjs`. Scope this round, per the
Coordinator's own instruction: only findings reachable via DATA-only input
(request document, FlowDefinition file, CLI flag) count — not custom JS
importing internal dispatch modules, not hand-written `.fgos/` files.

**Trust-boundary citations verified myself, not taken on faith.** Read
`docs/routing-handoff-contract.md` (lines 54-75) directly: the quoted
"containment is instructions + a throwaway branch, not a sandbox; do not
trust it to block an intentionally destructive worker" text is real,
verbatim. Independently confirmed `DEFAULT_RUNNER_CONFIG` really does spawn
every worker (including read-only-role ones) with
`--permission-mode acceptEdits`. No disagreement to escalate: the reframe
is sound and holds up under my own re-verification.

**No live data-only channel exists yet to reach a mutating dispatch at
all.** Traced `run.mjs`'s `runCoordinationUseCase` (the real CLI entry
point) and `dispatchResearchFanOut`'s own internal call: neither forwards
`step.mutation` to `dispatchDeclaredOperation` — the whole R1-R9 mechanism
is dormant on the real CLI/skill surface today (a known, honestly disclosed
wiring gap, not a hidden one). Confirmed empirically: submitted a real
data-only malicious request document (`mutation: 'mutating'` on an
operation step, real protocol fixture) through `runCoordinationUseCase`
exactly as the CLI would call it — the field is silently ignored, dispatch
runs read-only regardless.

**NEW finding, found while confirming the above (in scope — pure data-only
request document through the legitimate path): `rollbackReadOnlyMutations`
is dead code.** `grep -rn "rollbackReadOnlyMutations" src/` finds exactly
one match codebase-wide — its own definition, zero callers. In the same
data-only attack, the ignored `mutation:'mutating'` field meant the
dispatch ran as normal read-only, and the worker (full user permission per
the trust boundary, never OS-blocked) wrote a real file anyway. Result:
correctly graded `status:'failed', confidence:'failed'` (the existing
`isReadOnlyOperation && hasExternalEvidence` branch fired exactly as
designed) — but the file was never removed; `git status --short` confirmed
a real, permanent, untracked file survives the "failed" run. Confirmed via
`git show 86d0106c:...` this predates this cell's own diff entirely — not a
regression from any of the three fix rounds. But it directly falsifies this
cell's own R7 requirement ("continues to fail-and-rollback... unchanged")
and Tests First #5 ("reproduced... to prove nothing regressed") — every
round of this review so far, including my own Round-1 writeup, cited "the
existing rollbackReadOnlyMutations behavior" as working, trusting the
status field alone rather than checking file non-existence.

Explicit framing per the Coordinator's item 4: this is NOT another instance
of the confusion-of-authority class Rounds 1-2 found, and does NOT
contradict the trust-boundary reframe (a worker writing an unwanted file is
exactly the disposable-worktree scenario the reframe already accepts). What
remains wrong, independent of the trust-boundary question: the specific
claim "we grade it failed AND clean it up" is only half true for every
read-only dispatch in this codebase, and this cell's own R7/Tests-First-#5
claims the "clean it up" half was verified when it was not.

Regression sweep independently re-run: `tests 666 / pass 665 / fail 1`
(same pre-existing false positive). R9 smoke independently re-run: passes.

**Recommendation:** either wire `rollbackReadOnlyMutations` into
`executeAssignment`'s settlement path for real (matching what R7/Tests
First #5 already claim), or correct R7's/Tests First #5's own wording to
stop asserting "unchanged"/"reproduced" as a verified fact if the project
decides this is an accepted, out-of-scope gap. Leaving the claim uncorrected
while unverified is the part that should not stand.

Status: DONE
Verdict: REJECT
Findings (recheck round 3): 1 (new, pre-existing/orthogonal to the trust-boundary class — falsifies this cell's own R7 Acceptance claim), 0 confusion-of-authority-class findings (that class is now closed and out of scope per the accepted reframe)
Summary: No live data-only path exists yet to trigger a mutating dispatch — the mechanism is dormant on the CLI/skill surface. But while confirming that, found `rollbackReadOnlyMutations` is dead code (zero callers, pre-existing): a read-only dispatch that mutates is correctly graded "failed" but the file is never actually removed, falsifying this cell's own R7/Tests-First-#5 claim that rollback is "unchanged" and "reproduced."
