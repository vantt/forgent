# Track: step-09-mvp3-to-mvp5

Plan: `plans/260903-1049-step09-mvp3-to-mvp5/plan.md`
Branch: `step-09-mvp3-to-mvp5`
Base ref: `52a1db76` (HEAD of `main` at track start; `main` had just absorbed
the closed `step-09-group-thinking-mvp1-mvp2` track via merge commit
`52a1db76` itself)
Test command: `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'`

## Preservation

`git status` at track start (before branch creation) showed a dirty tree,
all pre-existing and unrelated to this plan (left untouched, not committed
by this track): `.agentkit/`, `.claude/agents/*.md` (AgentKit installation
files), `.fgos/events/*.jsonl` (runtime event log artifacts),
`docs/architect/component-boundary/tmp/` (scratch/working draft).

## Baseline

`FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'` run at
BASE_REF, exit code 1. Full log:
`/tmp/claude-1000/-home-vantt-projects-forgentX/c38dea78-cbe1-41cc-a3c8-53e1dbea5ee9/scratchpad/baseline-test-run.log`
(scratchpad, not committed — see proofs/ for the durable copy once made).
1 known baseline failure, unrelated to this track's surfaces
(`src/runner/coordination/**`, `src/runner/definitions/**`,
`core/coordination-protocols/**`, `src/verbs/coordination/**`):

| # | Test | File | Cause class |
|---|---|---|---|
| 1 | ask/answer round-trip on a genuinely legacy durable-doing item (no claim) | `test/cli/fgos-intake-4.test.mjs:318` | assertion, unrelated (fgos ask/answer, seq-count drift) |

This list may only shrink; any new failure beyond it blocks cell close.
5159 tests, 5152 pass, 1 fail, 6 skipped, duration ~155s.

Note: the predecessor track's baseline (`step-09-group-thinking-mvp1-mvp2/index.md`)
recorded 8 known failures; 7 of those (e2e pr-gate/self-improve wording,
4 intake/plan.test.mjs assertions, the herdr-spawn live-timeout item) are
absent from this run — either fixed upstream or environment-dependent
(the herdr-spawn live timeout in particular is expected to be intermittent,
not a permanent fix). Only the fgos-intake-4 seq-drift failure persisted.
This shrink is recorded as evidence per protocol; it is not this track's
own work.

## Phase / Requirement Matrix

| Phase | MVP | Requirements | Status |
|---|---|---|---|
| 00 | Intake | R1-R4 | done |
| 01 | MVP3 | R1-R8 (see phase file) | done |
| 02 | MVP4 | R1-R6 (see phase file; split P02.1 R1-R4 / P02.2 R5-R6) | done |
| 03 | Config | R1-R8 (see phase file) | done |
| 04 | MVP5 | R1-R8 (see phase file; split P04.1 R1-R7 / P04.2 R8) | done |

## Active Cell

None. **All cells closed — this plan's entire MVP3-MVP5 scope is done.**

## Next Action

None. Track complete. Any further work (the still-open limitations named
in `mvp6-dogfood-handoff.md`'s own "Still-open limitations" section, or
MVP6-9 future expansion) is a NEW track, not a continuation of this one.

## Cell Log

| Cell | Requirements | Status | Commit |
|---|---|---|---|
| P00.1 | Phase 00 R1, R2, R3, R4 (closes Phase 00) | done | `95f7971c` |
| P01.1 | Phase 01 R1-R8 (closes Phase 01) | done | `633da1f5` |
| P02.1 | Phase 02 R1-R4 | done | `fb18c372` |
| P02.2 | Phase 02 R5-R6 (closes Phase 02) | done | `c963f2a7` |
| P03.1 | Phase 03 R1-R8 (closes Phase 03) | done | `53a88522` |
| P04.1 | Phase 04 R1-R7 | done | `9435663a` |
| P04.2 | Phase 04 R8 (closes Phase 04 and this plan) | done | pending |

## Phase 04 Status

**CLOSED.** R1-R8 via P04.1 (R1-R7) + P04.2 (R8). P04.2 wrote
`docs/architect/agent-coordination/playbooks/mvp6-dogfood-handoff.md` —
the concrete, fully-cited MVP6+ dogfood handoff: input shape, command/
surface (`launch-master-loop` to start, `run --file` for authorize/
revise/recheck/disposition follow-up rounds against the same
coordinationId), expected roles/artifacts, the real resume mechanism plus
its hard writerId-identity constraint, what stays outside coordination
authority (explicit, citing the plan's own Non-Negotiable Boundaries), and
MVP6-9 named as future expansion, not hidden prerequisites. Also produced
a whole-plan Plan-Level Acceptance check (all 10 bullets, each cited to
the closed cell satisfying it) confirming nothing slipped through now
that every phase is done.

Reviewer round (APPROVE WITH CONCERNS, 1 MEDIUM — a miscount in the
trace's own summary sentence) ran in parallel with Red-Team round
(APPROVE WITH CONCERNS, 1 HIGH + 1 MEDIUM — the handoff's own
"Still-open limitations" section omitted the crash-bricked-coordinationId
window, directly relevant since the handoff recommends a fixed
coordinationId for resume; plus a false "zero diff to store.mjs in P01.1"
citation). Single Fixer pass, docs-only: added the missing limitation
bullet citing P00.1's Gap #15, corrected the store.mjs citation to P01.1's
real `assertDispositionRefOwnedBySession` change, fixed the bullet-count
miscount. Reviewer-recheck and Red-Team-recheck both ran in parallel
against the fix — both APPROVE, all findings CONFIRMED-RESOLVED, no new
issue found on a fresh end-to-end read of the whole handoff document.

No `src/`/`core/`/`test/` file touched anywhere in this phase's second
cell — docs-only throughout.

Full suite (final, whole-plan close): 5197 tests, 5190 pass, 1 fail —
exactly the track's recorded baseline (`test/cli/fgos-intake-4.test.mjs:318`);
no new failure across the entire plan's history.

**This closes Phase 04 (MVP5) and the entire step-09-mvp3-to-mvp5 plan's
scope.**

## Phase 04 Status (in progress)

**P04.1 CLOSED (Phase 04 R1-R7; R8 open as P04.2).** Built the plan's one
genuinely new capability: resume. `resumeSession()` in `session-engine.mjs`
turned out to be a read-only `replaySession` alias, not an attach-and-
continue door — the real fix was a small, surgical branch in
`src/verbs/coordination/run.mjs`'s `findExistingManifest()`: when a
request names an existing `coordinationId`, skip the open-and-refuse path
and dispatch straight into the SAME `dispatchDeclaredOperation`/
`authorizeDeclaredOperation`/`recordDriverDisposition` doors every
fresh-open request already uses. No `session-engine.mjs`/`store.mjs`/
`replay.mjs`/`schema.mjs` changes needed — confirmed by both independent
rounds. Live-proved with two real `fgos coordination run` CLI subprocess
invocations against the same coordinationId, split so the session was
provably still active between calls: no duplicate Assignment, no
reconsumed invocationKey, no lost disposition, no hidden-context leakage;
a third call against the now-terminal session correctly refused.

Reviewer round (initially APPROVE-leaning, revised) ran in parallel with
Red-Team round — Red-Team live-reproduced a real **HIGH**: a resumed
request carrying a foreign `writerId` could dispatch ordinary operation/
fan-out steps into someone else's session and silently consume the
original driver's already-issued authorization, a session-hijack
primitive that was categorically unreachable before this cell's resume
door existed (any second call used to die at the open-refusal guard
before any dispatch ran). The Reviewer independently re-derived the same
mechanism and concurred, revising their own initial LOW rating to BLOCK
in the same round — a clean example of the parallel-round process working
as designed even when the two roles' first passes disagreed. `authorize`/
`disposition` steps were already correctly identity-gated; only ordinary
dispatch through the resume door was exposed. Also 1 LOW (resume against
a broken/corrupted session lacked a direct regression test, though
Red-Team proved live in their own section it already failed closed).

Single Fixer pass: `findExistingManifest()` now asserts
`manifest.provenanceRoot.writerId === request.writerId` before any step
dispatches, at both call sites (agent-led and declared-protocol) — refuses
with a clear error on mismatch, mirroring `authorize`/`disposition`'s own
identity-gate shape. 3 new regression tests: the exact HIGH reproduction
with zero-side-effect assertions (Assignment/event counts unchanged by
the rejected attempt), plus the two broken-session LOW cases (malformed
`session.json`, missing `session.json`).

Reviewer-recheck and Red-Team-recheck both ran in parallel against the
combined fix — both APPROVE. Red-Team-recheck went further than a mere
retest: built an independent from-scratch attack script (real CLI
subprocesses, fresh workspaces) covering 5 scenarios/25 assertions,
attacked the OTHER call site the Fixer's own test didn't exercise
(agent-led, not just declared-protocol), confirmed a missing/null
`writerId` fails closed one layer upstream at schema validation (not
merely by the new equality check), and re-verified zero-side-effects
directly off disk rather than trusting test output. Reviewer-recheck
independently confirmed no `undefined !== undefined` false-negative path
exists (both `request.writerId` and `manifest.provenanceRoot.writerId`
are non-empty-string-required at their respective write points). No
further findings. HIGH and LOW both CONFIRMED-RESOLVED.

Full suite (final): 5197 tests, 5189 pass, 2 fail at first run — one
matched the recorded baseline (`fgos-intake-4.test.mjs:318`), the other
(`test/runner/dispatch.test.mjs`'s `spawnWorker` maxBuffer test) did not
reproduce in isolation (354/354), confirming this track's now
four-times-observed load-induced flake pattern, not a new failure.
Focused glob (`test/runner/coordination*.test.mjs test/verbs/coordination*.test.mjs`)
367/367 pass throughout.

Next: P04.2 (Phase 04 R8 — dogfood handoff docs; closes Phase 04 and this
plan's entire scope).

## Phase 03 Status

**CLOSED.** R1-R8 via P03.1, one cell. R1 audit found every one of the
fixture's 6 operations collapsed to identical `standard`-tier dispatch
resolution today, with `capabilities[]` inert for this fixture's
non-cohort dispatch path (confirmed independently by both Reviewer and
Red-Team via full-`src/` grep, not just cited). Added `policy.minTier` to
all 6 operations — the only portable field actually wired into
resolution: Doer/Fixer `standard`, Reviewer/Red-Team/Recheck `analytical`.
Deliberately did not add `capabilities[]` (inert) or `preferExecutor`
(barred at portable scope by `assertNoPortableExecutorPin`).

R4 (Red-Team critical escalation) and R5 (read-only-executor preference)
closed via existing, already-wired mechanisms rather than new fixture/
schema plumbing — assignment/CLI-scope PolicyPatch and the pre-existing
`executors.claude-reviewer` config entry. Red-Team's independent
verification found this is MORE usable today than the Doer's own trace
claimed: `fgos coordination run --file <request.json>` already accepts
per-actor tier overrides live, so escalation doesn't need to wait for
Phase 04 work.

Reviewer round (APPROVE, 2 LOW — cosmetic prose nits in the trace itself,
not the shipped code) ran in parallel with Red-Team round (APPROVE, 3 LOW
— documentation/completeness notes only). 7 Red-Team attacks all held:
fail-closed tier resolution proven to have no alternate silent-downgrade
path across every dispatch entry point (declared-operation, primary-task,
retry, fan-out); `capabilities[]` inertness re-confirmed independently;
tier monotonicity confirmed by-design, not an over-constraint; R8's 4 new
tests confirmed genuinely end-to-end (real fixture, real session-engine,
real child-process fake executor, no stub). No fix round required — 5 LOW
findings recorded as follow-up, non-blocking.

R7: nothing new needed setup/doctor registration — `policy.minTier` is a
pre-existing schema field, `claude-reviewer` executor already existed.

Full suite (final): 5191 tests, 5184 pass, 1 fail — exactly the track's
recorded baseline; no new failure. Focused glob
(`test/runner/dispatch*.test.mjs test/runner/flow-definition*.test.mjs`)
418/418 pass throughout.

**This closes Phase 03 (Config) entirely.**

Next: P04.1 (Phase 04 — MVP5, usable standalone live proof; the plan's
final phase).

## Phase 02 Status

**CLOSED.** R1-R6 via P02.1 (R1-R4) + P02.2 (R5-R6). P02.2 added: a
`nextAction` field on `launch-master-loop`'s output (coordination id +
concrete next step, plain-terms refusal explanation, never implying a
resume door that doesn't exist); `show.mjs` now renders `authorizations`,
`ignoredAuthorizations`, `dispositions`, and `pendingDriverAuthorizations`
sourced from `replaySession`'s existing reconstruction — closing P00.1's
Gap #18. Both P00.1-named rendering constraints honored: recheck lineage
never presented as a guaranteed original→recheck edge; disposition refs
gated by a verified-equivalent mirror of P01.1's
`assertDispositionRefOwnedBySession`, and post-terminal dispositions
marked (not hidden), using the same terminal-event-type list `replay.mjs`/
`store.mjs` already use. R6: nothing new needed setup/doctor registration
— verified by grep (only two `fs.existsSync` calls, both against an
already-established path convention), stated explicitly rather than
skipped.

Reviewer round (APPROVE, 0 findings) ran in parallel with Red-Team round
(APPROVE, 0 findings) — 7 attacks each, all held: `show`'s read-only
invariant confirmed intact (no write primitive anywhere in the new code,
`replaySession` itself is pure-read); the reimplemented ownership check
independently compared segment-by-segment against `store.mjs`'s original,
byte-for-byte equivalent logic; no recheck-lineage overclaim found
anywhere in the rendered output or docs; post-terminal-marking's
terminal-event-type list confirmed to exactly match both `replay.mjs`'s
and `store.mjs`'s internal lists; `describeNextAction` confirmed sane on
both the closed-successfully and refused branches, with no invented
resume command. No fix round required.

Full suite (final): 5185 tests, 5178 pass, 1 fail — exactly the track's
recorded baseline; no new failure. Focused glob
(`test/verbs/coordination*.test.mjs`) 47/47 pass throughout.

**This closes Phase 02 (MVP4) entirely.**

Next: P03.1 (Phase 03 — Config, role execution policy readiness).

## Phase 02 Status (in progress)

**P02.1 CLOSED (Phase 02 R1-R4; R5-R6 open as P02.2).** New thin launcher
surface: `src/verbs/coordination/launch-master-loop.mjs` +
`fgos coordination launch-master-loop` CLI wiring
(`bin/fgos.mjs`/`src/cli/command-registry.mjs`), targeting
`standalone-master-coordination-loop` exclusively. Confirmed by both
independent rounds: zero fork of engine logic — the launcher calls the
existing `runCoordinationUseCase` door and nothing else; no direct import
of `session-engine`/`store`/`replay`. All six R4 validation cases (bad file
path, unknown fixture id/version, Work fields, missing objective, invalid
bounds, forbidden context ref) covered with real actionable-error tests.
No skill/slash file created — command path only, per R1's own "prefer a
command/request-file helper first, a skill may wrap it later."

Reviewer round (APPROVE, 1 LOW — a `--plan` path-resolution edge case
under `--dir`, rated untested/non-blocking) ran in parallel with Red-Team
round (APPROVE WITH CONCERNS, 1 MEDIUM + 1 LOW) — the Red-Team live-
reproduced the SAME code fact the Reviewer had only read: a real `plan.md`
in the caller's cwd was falsely rejected as "does not exist" once `--dir`
was passed, because `--plan` resolved against `--dir`-derived
`repoRootForCoordination` instead of `process.cwd()` (the sibling
`run --file` branch's actual pattern). Coordinator accepted the MEDIUM
over the Reviewer's LOW rating on the strength of the live reproduction.
Single Fixer pass: one-line resolution fix in `bin/fgos.mjs` mirroring
`run --file` exactly, plus a regression test reproducing the two-directory
scenario. Reviewer-recheck and Red-Team-recheck both ran in parallel
against the fix — both APPROVE, MEDIUM CONFIRMED-RESOLVED (Red-Team-recheck
additionally live-tested absolute-path, `..`-traversal, and empty-`--plan`
edge cases against the fix, all held); Reviewer-recheck explicitly
reconciled its own original LOW against the Red-Team's more accurate
MEDIUM. 1 LOW (informational — the "unknown fixture id" negative test is
only reachable via direct object mutation, not the real CLI, since
`protocolRef.id` is a pinned constant with no override flag; not a
defect) recorded as follow-up, non-blocking.

Full suite (final): 5179 tests, 5171 pass, 2 fail at first run — one
matched the recorded baseline (`fgos-intake-4.test.mjs:318`), the other
(`test/runner/dispatch.test.mjs`'s `spawnWorker` maxBuffer test) did not
reproduce in isolation (354/354 pass on `test/runner/dispatch.test.mjs`
alone) and is recorded as a load-induced flake per this track's own
documented pattern for subprocess-timing tests, not a new failure. Focused
glob (`test/verbs/coordination*.test.mjs`) 41/41 pass throughout.

Next: P02.2 (Phase 02 R5-R6 — resume/show path rendering, setup/doctor
discipline; closes Phase 02).

## Phase 01 Status

**CLOSED.** R1-R8 via P01.1, one cell (no split needed). Handoff-first
review (R1) dispositioned each of R2-R8 individually against the closed
MVP1/MVP2 track's own proof (`P03.1.md`): R3, R5, R7, R2's
artifact-revision-link half, R6, and 3 of R8's 5 negative-semantics cases
(missing authorization, reused invocation key, terminal-session-at-engine-
level) accepted unchanged, no source touched, cited directly.

One genuine gap closed: `recordDriverDisposition` (`store.mjs`) had no
check that a disposition's `targetRef`/`evidenceRefs` resolve to a ref this
session actually owns (`P00.1.md`'s Carried-Forward Gap #9, and the phase
file's own named Tests-First bullet). Added `assertDispositionRefOwnedBySession`,
mirroring `session-engine.mjs`'s existing `assertRefsOwnedBySession`
pattern (existence-based, not naming-convention — the class of bug this
track's predecessor repeatedly found and fixed), with 4 new
mutation-verified tests.

Two more R8 negative cases (unknown target, stale/nonexistent artifact ref)
were already engine-proven but had no door-level (CLI/request) test; 2 new
tests added to `test/verbs/coordination-run-driver-steps.test.mjs` — outside
Phase 01's literal Files list, Coordinator-confirmed acceptable since
P03.2 itself established that file as the door-level test home for this
exact surface.

Deferred, with reasoning, not fixed: R2's prior-finding/verdict lineage
stays artifact-revision-scoped/best-effort (already ruled on by P03.1's own
Coordinator, MEDIUM-3 — not re-litigated, no new evidence); R8's
terminal-session case has no door-level test because it is structurally
unreachable through `run.mjs`'s current open-once/close-once control flow
without a resume door (Phase 04/MVP5's own future work, per `P00.1.md`
Gap #17).

Reviewer round (APPROVE, 1 LOW — stale line-number citations in the new
door-level test file, cosmetic, tests genuinely exist and cover the
claims) run in parallel with Red-Team round (APPROVE, 2 LOW — one
corroborating the same stale-citation finding independently, one noting
the trace's stated reasoning for closing gap #9 vs. deferring gap #8 was
asymmetric even though the underlying calls are both correct). 0 HIGH,
0 MEDIUM from either round; all 7 Red-Team attacks (bypass, over-refusal,
under-refusal/naming-convention-class, test vacuity, R2 re-litigation,
terminal-session reachability, scope escape, lock discipline) held. No fix
round required — 3 LOW findings recorded as follow-up, not blocking close.

Retry (`run-retried`) machinery untouched throughout — zero diff.
`group-cognition-framework.yaml` untouched. No Work/git/coding-domain
mutation path touched. Full suite: 5165 tests, 5158 pass, 1 fail — exactly
the track's recorded baseline (`test/cli/fgos-intake-4.test.mjs:318`); no
new failure. Focused glob (`test/runner/coordination*.test.mjs`) 314/314.

Next: P02.1 (Phase 02 — MVP4, thin surface launcher).

## Phase 00 Status

**CLOSED.** R1-R4 via P00.1. Froze the real, source-verified MVP1/MVP2 shape
(not the discussion proposal) into
`docs/architect/agent-coordination/verification/step-09-mvp3-to-mvp5/P00.1.md`:
fixture id/version, authorization event shape, assignment provenance shape,
context grant behavior, artifact ref behavior, and bounds behavior, each
cited to file+line and cross-checked against live source
(`standalone-master-coordination-loop.yaml`, `run.mjs`, `show.mjs`) rather
than trusting docs alone. All 18 predecessor "Forward Notes" entries plus 2
thin-launcher-readiness gaps classified by relevance to this plan's phases
(00/01-MVP3/02-MVP4/03-Config/04-MVP5) and severity (blocker /
design-decision-needed / pure-forward-note) — zero blockers. All 5 of
plan.md's Entry Conditions confirmed satisfied with direct evidence,
including git-log confirmation `group-cognition-framework.yaml` carries
exactly one commit (`833888ba`) since Step 08.

Went through 1 Reviewer round (APPROVE WITH CONCERNS: 1 MEDIUM + 4 LOW, all
citation-precision — a quote mis-attributed to `index.md` that was actually
the fixture's own header comment, plus off-by-one line citations and minor
quoting/rounding imprecisions) run in parallel with 1 Red-Team round
(APPROVE WITH CONCERNS: 1 MEDIUM + 2 LOW — Entry Condition 5's justification
overclaimed "every round ended in CONFIRMED-RESOLVED" when two predecessor
findings, Phase 01's `cohort-planner.mjs` HIGH and Phase 02's P02.1 MED-2,
were actually deliberately deferred and carried forward, not resolved; both
gaps were already correctly captured in the Carried-Forward Gaps table, so
this was a self-certification overclaim in the prose only, not a dropped
gap). No HIGH from either round. Both MEDIUMs + all 6 LOWs fixed by a single
Fixer pass (docs-only, single file); Reviewer-recheck and Red-Team-recheck
both ran in parallel against the combined post-fix text and independently
re-derived every corrected citation from live source — both APPROVE, all 8
findings CONFIRMED-RESOLVED, no new issue introduced.

No source under `src/`, `core/`, or `test/` touched. No predecessor
(`step-09-group-thinking-mvp1-mvp2`) verification file touched. Docs-only
cell throughout; full suite not required (Tests First: `git diff --check`
only, exit 0 before and after fix).

Next: P01.1 (Phase 01 — MVP3, recheck lineage and driver disposition
hardening/acceptance).
