# Unit I27 — panel-depth experiment: real comparison report

Status: **complete.** Core experiment scored and fully unblinded; the two
open items (human spot-check, standalone-session completion) are both
resolved per explicit Lead/user decisions — see §8.

Rubric SHA: `7421a5e612984082713defd3e3fe43946f42c39e` (`plans/260919-coordination-skill-harness-simplification/panel-depth-experiment/scoring-rubric.md`), approved by Lead after independent review.
Scoring commit: `9c411dc16` (real blind-scored marks, all 3 cases).
Rubric provenance: written **after** real dispatch had already begun (a disclosed
process deviation from the rubric's own "before the first real call" requirement,
caught and reported mid-experiment), by a fresh agent with **no exposure** to any
real run content — see the rubric's own Section 0 and commit `7421a5e61`'s message.

## 1. What was built (structural, non-real-cost)

- `core/coordination-protocols/architecture-advisory-panel-standard-v1.yaml`
  (commit `df2b68d20`): the standard variant, differing from the full
  `architecture-advisory-panel-v1.yaml` in exactly the allowlisted delta —
  drops `phase-redteam`'s node, `red-team-actor`, the `red-team` role, the
  `red-team-packet` operation, and the `post-redteam-open` window; re-gates
  `phase-explanation` directly on `post-synthesis-open`. Proven by a
  structural diff-based test (`test/runner/flow-definition-architecture-advisory-panel-standard-v1.test.mjs`,
  5/5 pass) that the variant equals the full protocol minus exactly that
  delta, and that the full protocol stays byte-identical/untouched.
- Registered as the group-thinking pack's 6th member; 3 dependent tests
  updated and passing; trigger-surface row added to both the canonical and
  legacy docs.
- Fake-executor smoke test (`panel-depth-experiment/smoke-test-standard-variant.mjs`)
  proving the explanation re-gate and quorum/close work end-to-end through
  the real `fgos coordination pack run` CLI door, before any real spend.
- Full suite green in this worktree: 7945 tests, 0 fail (rust-host tests
  needed `target/` symlinked to the main checkout's prebuilt binaries —
  sources are identical between `unit/I27` and `main`, no rebuild needed).

## 2. Real-cost pre-flight

- Real cheap-tier canary (`investigate-context` alone, standard variant,
  `claude`/`claude-cli-bwrap`): PASS, genuine substantive LLM output
  (`plans/.../panel-depth-experiment/real-runs/canary-req1-investigate.log`).

## 3. Corpus

- **Core cases** (P05.2 clear + unclear, `docs/platform/agent-coordination/verification/architecture-advisory-panel/P05.2.md`):
  the plan's own text described these as having "frozen `intake.md`/`synthesis.md`/`redteam.md`
  already on disk" — in fact this real content existed only in this
  machine's local, git-ignored `.fgos/assignments/` state (ephemeral, not
  in the committed docs tree). Extracted verbatim (objective + real
  `agent-result.json` + real `agent-report.md`, every phase, both cases)
  into `panel-depth-experiment/corpus/p052-clear/` and `.../p052-unclear/`
  (commit `cee081d6f`) before it could be pruned.
- **Extra case** (case-3, "I21-H4"): a brand-new real full-protocol session
  about Unit I21's own H4 exposure-closure question (whether the round-2
  fix at `src/verbs/coordination/binding.mjs:268` durably closes the
  generic-`review`-capability unconfined-executor exposure, or needs
  further kernel/doctor hardening) — 1 of the plan's allowed "1-2" extra
  cases, chosen deliberately at the low end given real cost/turn
  discipline (stated plainly here, not hidden).

## 4. The paired design, as actually run

Per case: the full-protocol session's real synthesis (already-spent for
the 2 core cases, freshly dispatched for case-3) plus ONE extra cheap
withheld-redteam explanation dispatch (same synthesis input, red-team
finding withheld) — never a second independent full session. Plus one
standalone real standard-protocol session (see §7, partial).

### 4.1 A real methodology incident, corrected mid-experiment

The first withheld-redteam attempt (case-1, coordination id
`i27-p052-clear-withheld-v1`) was invalidated: the session-engine marked
it `failed` (a false-failure from my own concurrent file writes into this
same worktree during the live dispatch window — the same class of gap
P05.2 itself already filed as `tsk-3yo`), and the dispatched agent
self-disclosed reading the real `red-team-packet.md` from my own newly
committed corpus directory before recognizing this profile withholds it.

Root-caused by reading `src/runner/dispatch/confinement/drivers/bwrap.mjs:356`
directly: every bwrap-confined dispatch starts with `'--ro-bind', '/', '/'`
— the ENTIRE host filesystem is mounted read-only for every dispatch, by
design (this confinement model gates writes, not reads, matching the
`advise` capability's own declared `"policy": "host-write-denied"`). An
initially-proposed fix (dispatch the withheld probes from a separate,
disposable worktree) was tested, found NOT to solve the underlying
problem (the contaminated file remains readable via its absolute path
regardless of which worktree a dispatch's own `--dir` targets), and
superseded in `plan.md`'s own I27 decision note.

**Corrected, accepted methodology** (documented here plainly, not implied
as a stronger guarantee than it is): redo the withheld probes with a
maximally self-sufficient inline objective (everything needed already
given) plus an explicit no-exploration instruction, and hold reveal
content (`red-team-packet.md`, `explain-recommendation.md`) off-disk until
after that case's own withheld probe has run. This is **risk-reduction**,
not a hard isolation guarantee. The 2 redone withheld probes (v2, commit
`92a0b9648`) and case-3's own withheld probe (commit `b869732fe`) all
self-report `"blind": true, "filesRead": []` — genuinely clean runs under
this corrected discipline.

## 5. Real infrastructure incidents during the batch

- **`codex`/`openai` account: dead OAuth refresh token** (case-3's first
  red-team attempt, `asgn_i27_driver_op_013`, real error: "Your access
  token could not be refreshed because your refresh token was already
  used"). Retried under the SAME coordinationId (never a freshly-minted
  one) with `xai`/`pi-cli-bwrap-vantt` as the distinct-provider executor
  instead (`i21-h4-req3b-redteam-retry.json`). That retry's own verdict
  (`INSUFFICIENT-EVIDENCE`) is itself real, valuable evidence: it caught a
  genuine flaw in my own dispatch (an empty context grant despite the
  driver's declared step naming the synthesis) rather than rubber-stamping
  a narrative it was never given the artifacts to verify — kept as
  authentic data, not redispatched to look cleaner.
- **`claude`/`claude` account: session-limit exhaustion**, mid-standalone-
  session (`asgn_i27_driver_op_026`, real message: "You've hit your
  session limit · resets 3pm (Asia/Ho_Chi_Minh)"). This blocked the
  standalone session's synthesis/explanation/close (see §7).
- **`coordination show`/close "missing snapshot file" gap** (reproduced on
  every session opened in this worktree, including the healthy canary):
  plain `coordination run`/`coordination show` in a linked worktree either
  refuses outright ("pass `--dir <mainRoot>`") or, once `--dir` is passed
  explicitly pointing at THIS SAME worktree, resolves and closes
  correctly (`closed: true`, confirmed on all 3 scorer dispatches, §6).
  `coordination pack run` never raised this error at all (silently
  cwd-resolves without complaint) — a real, load-bearing inconsistency
  between `pack run`'s and plain `run`'s cwd-resolution defaults inside a
  linked worktree, filed here as a gap, not fixed in this unit (out of
  I27's file-ownership boundary — lives in `src/verbs/coordination/`
  cwd-resolution and `session-engine.mjs`'s `resolveCoordinationPaths`,
  not this unit's declared files).

## 6. Real blind-scored results (commit `9c411dc16`)

Scorer: `xai`/`pi-cli-bwrap-vantt`, distinct from every panel
synthesizer/lead-advisor provider (`claude`, every case — see
`scoring/provider-check.md`). Every scorer session reached
`"status": "completed", "closed": true` for real (verified directly, not
asserted — `scoring/case-*/scorer-run.log`).

Per-case raw counts (full = the ORIGINAL explain-recommendation dispatch;
withheld = the redteam-withheld probe). **Unblinded** (per
`scoring/unblinding-key.md`, committed only after every scorer mark was
in and the human spot-check question was resolved by explicit user
decision — see §8): in all 3 cases, X = full and Y = withheld (a
coincidence of the independent per-case coin flip, not a fixed
assignment — confirmed in the unblinding key, word counts included there
to show no length manipulation).

| Case | RT found | RT PRESENT (full / withheld) | CX/CY found | CX/CY PRESENT (full / withheld) | GT mark (full / withheld) |
|---|---|---|---|---|---|
| case-1 (P05.2 clear) | 3 | 1/3 (full) · 0/3 (withheld) | 16 each | 3/16 (full) · 3/16 (withheld) | GT-1: CONSISTENT (full) · CONTRADICTS (withheld) |
| case-2 (P05.2 unclear) | 4 | 4/4 (full) · 3/4 (withheld) | 12 each | 8/12 (full) · 8/12 (withheld) | GT-2: CONTRADICTS (full) · CONSISTENT (withheld) |
| case-3 (I21-H4, no ground truth) | 0 (red-team was a process critique, not architecture dissent — real, not smoothed) | n/a | 19 each | 12/19 (full) · 3/19 (withheld) | not scored (no ground truth, per rubric §6) |

Every PRESENT mark across all 3 cases was disposed (adopted, conditioned
on, or rebutted with a stated reason), never merely mentioned — see each
case's `scoring/case-*/scorer-marks.md` for the full enumerated findings,
verbatim quotes, and per-mark dispositions.

**Reading these results honestly, now unblinded:** dissent retention
favors **full** in every case that shows any difference at all (case-1:
full keeps 1/3 RT findings, withheld keeps 0/3; case-2: full keeps all 4
RT findings, withheld drops 1; case-3: full retains far more of the
control critique/constraint substance, 12/19 vs. 3/19 — a large,
one-sided drop for withheld on content that exists in BOTH conditions,
unrelated to red-team specifically). The two ground-truth cases split in
DIRECTION but not in stakes: case-1's withheld run got the fact wrong
while full got it right; case-2's **full** run got the fact wrong while
withheld got it right — so factual accuracy against verified ground truth
did not track the red-team/no-red-team split consistently, but dissent
retention and general content retention (the CX/CY control) did, both
favoring full. This is reported as the genuine, real result — not
smoothed into a stronger or weaker claim than the data supports, and
consistent with the honest prior the plan's own decision text stated
going in ("a quality regression from dropping red-team is plausible, not
unlikely").

## 7. Standalone real standard-protocol session — partial

Real dispatch through the real CLI door, proving the new FlowDefinition
actually works end-to-end, separate from the paired-explanation proxy:

- framing + shaping: 5/5 real ops done (`standalone-req1.log`).
- critique: first attempt (`op_023`) landed real, substantive content but
  was marked `failed` by mutation-detection because a concurrent commit
  (the rubric itself, landing from another session) hit this same
  worktree during the live dispatch window — same `tsk-3yo`-class false
  failure, not a content defect. A "failed" assignment does not open
  `post-critique-open`, so it needed a clean retry (`op_025`, done,
  `standalone-req2b.log`) before synthesis could proceed.
- assess: done (`op_024`).
- synthesis: **blocked** — `claude`'s session quota was exhausted on this
  attempt (`op_026`, real message, not a content or process failure).

**Not completed**: synthesis, explanation, close-dialogue, and therefore
this session never reached `closed: true`. 7 real ops across 2 phases and
4 distinct actor roles did succeed, which is real (if partial) evidence
the variant dispatches correctly through the production door.

**Disposition (Lead-decided):** accepted as partial. The quota reset was
not waited for, and the remaining ops were not switched to a different
provider mid-run (which would have made this a mixed-provider proof
rather than the intended pure-`claude` "as actually deployed" reading).
This session's own purpose — proving the FlowDefinition dispatches
correctly through the real production door — is satisfied by the 7 real
ops that did succeed; the separate, already-complete paired-comparison
measurement in §6 does not depend on this session finishing. **Stated
plainly: this proof is partial, not complete, and should not be read as
"the standard variant's standalone deployment was fully verified."**

## 8. Open items — both resolved 2026-09-28, by explicit Lead/user decision

1. **Human spot-check** (rubric §8, spec `b`) — requires an actual person,
   explicitly not the Lead and not an agent. **Decision (2026-09-28,
   user, relayed by Lead): declined.** This is a permanent known gap, not
   a pending item — the user was asked directly whether they could
   spot-check the case-1 blinded packet and chose not to. Recorded here
   as such, not silently dropped. This does **not** invalidate the
   scorer's own marks in §6 — only the independent second-rater
   cross-check that would have validated the scorer's PRESENT/ABSENT/
   CONSISTENT/CONTRADICTS judgment against a human's own reading is
   missing. `unblinding-key.md` was committed only after this decision
   was made (every scorer mark was already in; the human-spot-check
   requirement was explicitly waived, not silently skipped).
2. **Standalone session completion** — **Decision (2026-09-28, Lead):
   accept as partial.** Do not wait for the `claude` quota reset, do not
   switch the remaining actors to a different provider mid-run. The 7
   real ops already dispatched (framing, shaping ×3, critique, assess)
   across 5 phases/actors discharge this session's own proof purpose —
   that the new FlowDefinition dispatches correctly through the real
   production door — without needing synthesis/explanation/close to also
   complete. See §7 for the full disposition.

Both are now closed, permanent dispositions, not open questions. Neither
one invalidates or blocks the core paired-comparison finding in §6, which
is complete, scored, and fully unblinded.

## 9. Gaps filed, not fixed (out of this unit's scope)

- Confinement's whole-host-read-only mount as a real, structural limit on
  any future "withheld information" experiment design on this platform
  (§4.1) — no ticket filed yet; recommend one if this pattern recurs.
- `coordination pack run` vs. plain `coordination run`/`show` cwd-resolution
  inconsistency inside a linked worktree (§5) — no ticket filed yet.
- `codex`/`openai` account OAuth refresh-token failure (§5) — outside this
  repo's own scope (account/credential issue), not filed as a code gap.

## 10. Verification

- `env -u CLAUDE_CODE_SESSION_ID npm test`: **7945 tests, 0 fail, 8 skip,
  65 todo** — reran fresh in this worktree at commit `1a02b8cbd` (after
  unblinding, the last commit before this report update), confirming no
  regression from any of the real-run/scoring-only commits (they touch no
  production code path). Also run earlier, identically clean, after the
  structural changes (before the real-cost batch, see §1) and again after
  the scoring commit (`9c411dc16`) — three clean runs total across this
  unit's lifecycle, all 7945/0 fail.
- Real dispatch count this worktree: 29 real LLM-backed operations across
  canary + 2×(full-reuse + withheld) + 1 new full session (with 1 real
  infra retry) + 1 new-case withheld probe + partial standalone session +
  3 blind-scorer dispatches; 2 non-content failures (dead codex token,
  exhausted claude quota), both real infrastructure conditions, not
  process or content defects.
