# Track: architecture-advisory-panel

Plan: `plans/260905-architecture-advisory-panel/plan.md`
Branch: `group-thinking-plan-loop` (deviation from plan's preferred branch strategy below)
Base ref: `d3b2271b` (commit that added this plan on `group-thinking-plan-loop`)
Focused command: `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/runner/coordination-*.test.mjs' 'test/verbs/coordination-*.test.mjs' 'test/cli/coordination.test.mjs' 'test/architecture.test.mjs'`
Full command: `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 npm test`

## Deviation from plan's Entry Conditions — branch/commit strategy

Plan.md's Entry Conditions prefer merging `group-thinking-plan-loop` into `main` and branching `architecture-advisory-panel` from that descendant, or (fallback) branching from a commit containing `22b26333` plus the committed plan. The person explicitly chose instead: stay on `group-thinking-plan-loop`, commit the plan directly there (commit `d3b2271b`), and run the track from this branch without a separate top-level track branch. Recorded here as the actual, immutable `BASE_REF` per the plan's own requirement. Per-cell worktree branches (`architecture-advisory-panel--<cell-id>`) still branch off this branch's HEAD at the time each cell opens, same mechanism the plan describes.

## Deviation from plan's stated cell sequencing

The person's initial request asked to start at Phase 01. Phase 01 (P01.1) declares "Ready after: P00.1" and phase-00's own Exit section states "P01 may use only this allowlist" (the executor/mechanism allowlist P00.1 produces). No verification directory existed and no allowlist had ever been produced, so starting at Phase 01 would dispatch real advisory agents against real proof projects with no live-proven read-only confinement — the exact condition Phase 00 exists to prevent. Presented this conflict to the person; they chose to run Phase 00 first, in original plan order. This track therefore opens at cell P00.1, not P01.1.

## Audit

| Phase | Requirement | Status |
|---|---|---|
| 00 | Live-proven read-only executor/mechanism allowlist | done (P00.1 proven) |
| 01 | Advisory soul and manual proof | done (P01.1 + P01.2 + P01.3 all closed) |
| 02 | Capability-fit audit | done (P02.1 closed — see P02.1.md) |
| 03 | Minimal hard shell and protocol | done (P03.1 + P03.2 both closed) |
| 04 | Production skill and Decision Dialogue | done (P04.1 + P04.2 both closed) |
| 05 | Comparative proof and promotion | P05.1 done (see P05.1.md); P05.2 blocked on real person |

## Baseline

Full suite run at track start (`FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 npm
test`), 2026-09-05: **5614 tests, 5604 pass, 4 fail, 6 skipped**
(`duration_ms 178257`, log saved at
`docs/architect/agent-coordination/verification/architecture-advisory-panel/proofs/P00.1/baseline-full-test.log`).

Plan's own recorded starting baseline (from the completed
`group-thinking-plan-loop` track) named four known failures: legacy
durable-doing ask/answer, missing-quadrant docs-index, live codex
usage-limit, and invalid placeholder characters in two resume examples.
This run's actual four failures:

1. `test/cli/fgos-intake-4.test.mjs` — ask/answer round-trip on a legacy
   durable-doing item (seq 3 vs expected seq 2). Matches "legacy
   durable-doing ask/answer".
2. `test/report/enduser-index.test.mjs` — docs-index missing-quadrant
   tolerance (`docs/tutorials` now exists, so the test's own hide-the-dir
   setup assumption no longer holds). Matches "missing-quadrant docs-index".
3. `test/setup/coordination-doctor-check.test.mjs` —
   `coordination-example-requests-valid`: two published resume-request
   examples (`group-thinking-nominal-group-lite-resume-request.json`,
   `group-thinking-rfc-review-lite-resume-request.json`) still carry the
   placeholder `grantedContextRefs` text, which fails the safe-charset
   check. Matches "invalid placeholder characters in two resume examples".
4. `test/runner/codex-cli-glm-cli-live-executors.test.mjs` — **drift**: the
   plan named "live codex usage-limit" as the fourth known failure; the
   actual fourth failure today is a different live-executor test, the
   GLM-cli self-identification probe returning `MODEL=claude-opus-5`
   instead of a genuine z-ai/GLM identification (OpenRouter route not
   taking effect, or a silent fallback). Both are live/external-service
   flakes in the same class (a real network-dependent executor probe), but
   they are not the same test — named here as required drift, not silently
   folded into the old label. Not independently re-run multiple times yet
   to confirm flake vs regression; P00.1's Doer/Reviewer should re-run this
   one test in isolation before treating it as environment-only.

Net: still exactly four failures, same class (pre-existing environment/live
dependencies unrelated to this track's own work), but item 4's identity
changed. No new failure beyond four. This does not block P00.1 — see Stop
Gates in `current-cell.md` — but must not be silently mislabeled at close.
Confirmed as the authoritative baseline in commit `55c0de9c`, cited by
P00.1's own dispositions (D6) resolving the Doer's internally-contradictory
self-reported numbers.

## Cells

| Cell | Coordination id | Status | Notes |
|---|---|---|---|
| P00.1 | `architecture-advisory-panel--p00-1` | done | Read-only dispatch readiness proven; Allowlist produced |
| P01.1 | `architecture-advisory-panel--p01-1` (fix round + close on `--p01-1-fix1`, see session-workaround note in P01.1.md) | done | Soul authored (3434 lines), 1 HIGH + 4 MEDIUM + 2 LOW findings fixed in 1 round, both rechecks clean |
| P01.2 | manual dispatch, no coordination session (see P01.2.md) | done | Real clear-input proof on mdview: 8 phases + 2 real Decision Dialogue turns with the actual person; found a real production bug (auth token lost on stdout); final outcome: fix 4 named first-run defects, defer Windows packaging, drop telemetry-first sequencing |
| P01.3 | manual dispatch, no coordination session (see P01.3.md) | done | Real unclear-input proof on vnflow (EOD/intraday pipeline evolution): full 8-phase panel run + 1 real Decision Dialogue turn; person sought and accepted an independent (kongming) verdict; a factual correction to the panel's own evidence was independently verified by the coordinator; final recommendation attributed, not merged into the panel's own voice |
| P02.1 | audit only, no coordination session opened (see P02.1.md) | done | Capability-fit/hard-soft placement audit; 4 tables produced; re-diagnosed a Phase 01 finding (revise/recheck reachability) as a symptom of the `partialPolicy` premature-close bug via a live passing test, not an independent defect; N+1 reauthorization probe answered live (`activation.maxInvocations`, not `aggregateBounds.maxRounds`); 4-item closed Phase 03 blocker list produced; full focused suite 680/680 pass |
| P03.1 | manual dispatch (Doer/Reviewer/Red-Team, no coordination session; see P03.1.md) | done | Human-turn trusted-input/decision-provenance door: 1 additive event kind + ref namespace + request-step type. Design consulted with kongming first (rejected prevention as unachievable in-process; built detect/attribute instead). 1 HIGH + 3 MEDIUM + 2 LOW findings in round 1, all fixed; 1 new MEDIUM (symlink bypass) found on recheck, fixed in round 2. Both rounds independently re-verified by the Coordinator (re-ran tests, read the actual code fixes). Focused suite 680→744, zero new failures. Filed 2 unrelated kernel bugs found by P02.1 as separate work items (tsk-5qj, tsk-1o4) rather than fixing them in this cell's scope. |
| P03.2 | manual dispatch (Doer/Reviewer, no coordination session; see P03.2.md) | done | Registered `architecture-advisory-panel-v1` protocol + pack entry + 13-case conformance suite. Real bug found+fixed during construction (quorum would auto-close before a human turn could arrive; fixed with driver-only `close-dialogue` gate). 0 HIGH + 3 MEDIUM findings, all fixed and independently rechecked (Reviewer reproduced the Doer's own falsification proofs, not just read the diff). Focused suite 728→757, zero regressions on pre-existing RFC/NGT/Delphi/master-loop conformance tests. Filed 2 request-schema gaps found while building the suite as separate work items (tsk-44p, tsk-3xk). |
| P04.1 | manual dispatch (Doer/Reviewer/Red-Team, no coordination session; see P04.1.md) | done | Authored `core/skills/fgos-architecture-panel/SKILL.md` (910 lines) projecting Phase 01's ~4700-line doctrine into a production skill. Reviewer + Red-Team both required per phase-04's own "assess hard correctness AND loss of soul" mandate. 1 HIGH (roster names 3 unregistered executors that silently fall back to an unconfined, git-write-capable default — independently verified live by the Coordinator) + 3 more HIGH from Red-Team (explanation standard absent; 3 lead-advisor artifacts had no graph operation; driver disposition rules never stated) + many MEDIUM/LOW citation and doc-accuracy findings, all fixed across 2 rounds. Fix round 1's own report inaccurately claimed complete coverage (5 LOW findings were silently dropped) — caught by the Reviewer's recheck and corrected in round 2, which explicitly disposition-tabled every one of the 22 distinct findings from both rounds. Focused suite 757/757 and skill-projection tests 39/39 unchanged throughout (prose-only cell, zero kernel/protocol touch). |
| P04.2 | manual dispatch (Doer/Reviewer/Red-Team, no coordination session; see P04.2.md) | done | How-to guide + 8 example families for the panel. Step 1 investigation confirmed existing `fgos coordination run/show` doors are sufficient; no new verb added. Red-Team found 1 BLOCKING defect (independently verified live by the Coordinator): no example declared `aggregateBounds`, so the documented flow's mandatory 10-op pre-dialogue path exhausted the platform's default round cap before Phase 9 could ever dispatch — the panel could never reach `close-dialogue`, not even for a zero-reopen `decide`. Reviewer separately found 3 HIGH: every published reopen passed an empty context grant (silent no-context dispatch); a homogeneous-fallback example used a bare, unconfined, git-write-capable executor (independently confirmed live — worse than tsk-1o4, this one actually runs); 0 of 8 examples satisfied phase-04's own protocol-id+routing requirement despite a CHANGELOG claim that all 8 did. All fixed across 2 rounds, each independently re-verified live (Red-Team rebuilt the full 12-op/6-call session from scratch to confirm the blocker's fix). A new kernel gap found and confirmed by both Doer and Red-Team (`actors[]` doesn't persist across resumed calls, silently losing confinement) filed as `tsk-3bf`. Also fixed 2 unrelated regressions from earlier cells (P03.2's protocol missing from a test's fixture list; P04.1's stale decision-citation) surfaced by this cell's own full-suite run. Focused suite 757/757 throughout; full suite back to the track's own 4-item baseline, 0 new failures. |
| P05.1 | manual dispatch (Doer/Reviewer/Red-Team, no coordination session; see P05.1.md) | done | Hard conformance and recovery proof, driven entirely through the real installed `fgos coordination run/show` CLI in an isolated workspace, including a genuine `kill -9` of a real dispatch process and resume from a fresh process. Original claim ("all 6 areas hold") was FALSE under adversarial testing and was honestly corrected, not softened: 3 of 6 areas (Routing, Bounds, Replay/crash-resume) have a real, independently-reproduced bypass. 5 HIGH-severity findings, each independently reproduced by both Reviewer and Red-Team from source, not just report text: unauthenticated `result.json` provenance spoofable by any executor subprocess (`tsk-63z`); `revise-synthesis`'s human-turn precondition is prose-only, not kernel-enforced (`tsk-3ru`); `aggregateBounds` silently discarded on resume, permanently wedging an under-budgeted session (`tsk-1zk`); and a crash-recovery cluster — no owner identity on `dispatch.claim`, a second lock with a deterministic 35-minute SIGKILL-survival window whose documented recovery workaround permanently poisons the assignment, and event-log corruption that can make the session undiagnosable (`tsk-47l`, amended twice, including an upward self-correction by Red-Team on their own recheck). No kernel/protocol source touched — every gap filed, not fixed, per this cell's own evidence-only scope. Focused suite 757/757 throughout. |

## Admitted Read-Only Advisory Executor Allowlist

The following safe executor/mechanism pairs are live-proven and admitted for Phase 01+ advisory dispatches:

1. `claude-bwrap` (OS mount, `out-of-process`) — Provider: `claude` (Anthropic). Tier: `analytical`/`standard` -> `sonnet`, `critical` -> `opus`. Corrected bwrap mount with explicit `--chdir` to fresh disposable checkout (`bwrap --ro-bind / / --dev /dev --proc /proc --bind <evidenceDir> <evidenceDir> --chdir <checkoutDir> -- claude ...`). Hard OS kernel `bwrap --ro-bind / /` read-only mount.
2. `codex-readonly` (Native sandbox, `out-of-process`) — Provider: `openai-codex` (OpenAI). Tier: `standard`/`analytical`/`critical` -> `gpt-5.5`. Provider-native `-s read-only` sandbox flag.
3. `agy-bwrap` (OS mount, `out-of-process`) — Provider: `gemini` (Google DeepMind). Tier: `standard` -> `gemini-3.6-flash-medium`, `analytical` -> `gemini-3.1-pro-low`, `critical` -> `gemini-3.1-pro-high`. Corrected bwrap mount with explicit `--chdir` to fresh disposable checkout (`bwrap --ro-bind / / --dev /dev --proc /proc --bind <evidenceDir> <evidenceDir> --chdir <checkoutDir> -- agy ...`). Hard OS kernel `bwrap --ro-bind / /` read-only mount.

Excluded Unsafe / Non-Runnable Pairs:
- `claude-reviewer` (`unconfined config`): EXCLUDED (falsified — authorized in-tree write succeeded).
- `agy-plan` (`--mode plan`): EXCLUDED (falsified — wrote file outside checkout).
- `codex-bwrap` (`bwrap OS mount`): EXCLUDED (non-runnable startup crash `os error 30`).
- `codex-cli` (`--dangerously-bypass-approvals-and-sandbox` unconfined): EXCLUDED (mutated target repo).
- `agy-cli` (`--mode accept-edits` unconfined): EXCLUDED (mutated target repo).
- `agy-sandbox` (`--mode accept-edits --sandbox`): EXCLUDED (mutated target repo despite `--sandbox` flag).

## Stop Gate — P05.2 blocked on the real person

Phase 04 is done (P04.1 + P04.2 both closed). Phase 05's P05.1 (hard
conformance and recovery proof) is done — see P05.1.md. **P05.2
(comparative live proof and promotion) — the track's final cell — cannot
proceed without the real person.** Per the phase's own "Live Proof
Boundary" text: "A scripted fake-human transcript cannot prove the
Decision Dialogue." P05.2 needs: a real external project outside
forgentX with a genuinely undecided architecture question, the real
person taking a real Decision Dialogue turn, and a manual-vs-product
qualitative comparison. This is the one point in the track where
"continue until done" cannot mean "continue without the person" — it is
surfaced to the person directly, not silently deferred.

Carried forward into P05.2's own scope (Reviewer's note from P05.1, not
filed as a separate work item): `grantedContextRefs` accepts
dangling/unvalidated refs — check this when P05.2 exercises the same
mechanism.

The separate, track-independent question about authorizing real
implementation work against `/home/vantt/projects/vnflow` is resolved:
the person authorized it, a real fix was implemented, verified, pushed,
and opened as https://github.com/vantt/vnstock-analysis/pull/1.
