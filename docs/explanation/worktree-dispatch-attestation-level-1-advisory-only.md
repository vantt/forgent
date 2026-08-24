# Worktree-dispatch attestation, level 1: advisory-only, never a gate

Two ready-to-pick items can run in parallel worktrees without stepping on
each other's declared `footprint` — that's what `computeSchedule`
(the sibling capability documented in `docs/how-to/compute-a-parallel-
dispatch-wave-schedule.md`) computes ahead of time. But nothing before
this recorded what a worktree *actually* touched once dispatch ran, or
flagged when the real diff drifted outside what was declared. `tsk-2ig`
adds that as a real capability — deliberately scoped to level 1,
advisory-only.

## The two halves

**Capture, not judgment: `baseCommit`/`headRef` before dispatch.**
`src/runner/dispatch.mjs` now snapshots `git rev-parse HEAD` and the
current branch name immediately before calling `resolveExecutorConfig`
for a cross-provider CLI target (`agy`/`opencode`), attaching
`{baseCommit, headRef}` to the dispatch result alongside the existing
`executorId`/`provider` fields. Either field folds to `null` rather than
throwing if it can't be read (e.g. detached HEAD has no `headRef`) — this
is a snapshot for later reference, never a precondition dispatch can
fail on.

**A second, separate diff check — not a rewrite of the first.**
`src/runner/frozen-judge.mjs` already had `frozenJudgeHits`, a narrow
check flagging changes to a fixed, hardcoded set of sensitive file
patterns (`FROZEN_JUDGE_PATTERNS`) that fall outside an item's declared
footprint. `tsk-2ig` adds `footprintDiffHits` beside it — a broadened
sibling that flags *any* changed file outside the declared footprint, not
just the sensitive-pattern subset — as a genuinely separate function,
never a modification of `frozenJudgeHits` itself. The existing narrow
check's behavior stays byte-for-byte unchanged, proven by a regression
test rather than just asserted.

## Why the two functions treat a missing footprint oppositely

This is the one place the two checks deliberately diverge, and it's not
an oversight:

- `frozenJudgeHits`, absent a footprint, treats it as "check everything"
  — reasonable for its own narrow pattern set, since a real hit there
  (touching a sensitive file with no declared baseline) stays a
  meaningful signal even across a typical, larger diff.
- `footprintDiffHits`, absent a footprint, returns `[]` — exempt
  entirely. Flagging *every* file in that case would be 100% of the
  diff, which isn't a signal at all; there's no declared baseline to
  diverge from, only guaranteed noise.

Same shape of function, opposite fallback, because the two checks answer
different-scoped questions with very different false-positive profiles
once the footprint itself is missing.

## Follow-up (`tsk-4hl`): the capture was pointed at the wrong ref, and neither half was actually wired in

An independent code review after `tsk-2ig` merged found the feature above
had shipped only partially connected:

- **`captureDispatchAttestation` snapshotted the wrong `HEAD`.**
  `loop.mjs` passes the *main checkout's* own `.fgos` into
  `spawnWorker`, so `git rev-parse HEAD` inside
  `captureDispatchAttestation` (`dispatch.mjs`) captured main's tip, not
  the tip of the worktree branch the worker was actually about to run on
  — the exact ref `loop.mjs:653`'s own `dispatchBaseline` had already
  correctly computed elsewhere, just never threaded through to the
  attestation capture itself. Fixed by wiring the capture to read
  `dispatchBaseline`'s already-correct ref instead of re-deriving its own
  (wrong) one.
- **The capture was computed and then discarded.** `baseCommit`/
  `headRef` were captured but never persisted anywhere — dropped after
  the function returned, sitting next to the existing
  `branchHeadAtTake` field on the event payload with nothing carrying
  them into it. Fixed by persisting both fields onto the event payload
  alongside `branchHeadAtTake`, so the attestation capture this doc
  describes is actually retrievable later, not just computed and thrown
  away.
- **`footprintDiffHits` was implemented but never called from the real
  `return` path.** The broadened diff check existed as a function with
  its own passing tests, but `bin/fgos.mjs`'s `return` verb only ever
  called the narrower `frozenJudgeHits`, never the new sibling — the
  advisory signal this doc describes never actually reached a real
  `fgos return` run. Wired in alongside the existing `frozenJudgeHits`
  call, with one added self-exclusion: the `iron-law-evidence.md` file
  that `return`'s own flow generates as part of the same run is excluded
  from `footprintDiffHits`'s scan, so the check doesn't flag its own
  generated evidence file as an unexpected out-of-footprint change.

The direction — wire the two halves in for real, rather than remove them
as dead code — was an explicit user choice, not a default. Verified with
real commands
(`node --test test/runner/dispatch.test.mjs test/runner/frozen-judge.test.mjs test/cli/fgos.test.mjs`),
not just code review. Level 1's advisory-only posture (never a gate,
above) is unchanged by this fix — this only makes the existing advisory
signal actually reach the right ref and the real `return` path, not a
scope change.

## Second follow-up (`tsk-x5r`): a real test failure on `main`, and `footprintDiffHits` flagging fgOS's own state files

A second independent review round, right after `tsk-4hl` merged, found
two more issues — one an active blocker, the other a real false-positive
in the newly-wired `footprintDiffHits`:

- **`test/runner/loop.test.mjs` was failing on `main` at the time this
  was found** — a genuine DoD violation (`npm test` must stay green).
  Its assertion still did a `deepEqual` against the *entire* executor-
  dispatch event payload as a fixed literal, unaware that `tsk-4hl` had
  just added `baseCommit`/`headRef` onto that same payload — the new
  fields broke the exact-equality check. Fixed by asserting shape
  instead of exact value: a sha-shaped regex for `baseCommit`, and the
  real current branch name for `headRef` — resilient to the payload
  gaining more fields later, the same way the rest of this attestation
  capture is meant to evolve without breaking every consumer.
- **`footprintDiffHits` (wired into the `return` verb by `tsk-4hl`) was
  flagging fgOS's own `.fgos/*` state files as unexpected out-of-
  footprint changes.** `.fgos/` is genuinely git-tracked, and a
  concurrent session's own commits to `.fgos/events.jsonl`/
  `.fgos/state.json` can land inside another item's `doing` window on
  the shared main-source path — a real, already-solved problem
  elsewhere: `isWorkingTreeClean` (`merge.mjs`) already exempts exactly
  this case via `isFgosOnlyStatusLine`, precisely because these files
  changing concurrently is expected, not a sign of scope creep.
  `footprintDiffHits` had no equivalent exclusion, so it flagged what
  `isWorkingTreeClean` already knew to ignore. Fixed by applying the same
  exclusion. Verified with a real two-direction repro: before the fix,
  `.fgos/events.jsonl` and `.fgos/state.json` were flagged; after,
  the same diff came back clean.

Both fixed and verified with real commands
(`node --test test/runner/loop.test.mjs test/runner/frozen-judge.test.mjs`
and `node --test test/cli/fgos.test.mjs`), not just code review.

## Third follow-up (`tsk-5iv`): the `.fgos/` exemption above was too broad, and hid real edits

A round-3 independent review found that `excludeFgosPaths`
(`bin/fgos.mjs`, added by the second follow-up above) had over-corrected:
it blanket-exempted **all** of `.fgos/**` from `footprintDiffHits`,
including hand-edited policy files — `.fgos/gate-bypass.json`,
`.fgos/config.json` — that real items genuinely DO edit as deliberate
work product, not just incidental concurrent-session noise. Verified via
`git log`: `.fgos/config.json` has real feature commits touching it
directly. An item whose declared footprint excludes `.fgos/` but that
quietly edits `gate-bypass.json` now produced zero `footprintDiffHits`
— the exact opposite of the safety this advisory check exists to
provide, reintroduced by the fix that was meant to remove a false
positive.

**The fix narrows the exemption** to only the genuinely append-only
lifecycle streams — `events.jsonl`, `state.json`,
`entropy-history.jsonl`, `sessions.json`, `invocation-faults.jsonl`,
`main-checkout.lock`, and `*.backup-*` files — never
`config.json`/`gate-bypass.json`/`coexistence.json`, which stay subject
to `footprintDiffHits` like any other file a session might edit outside
its declared footprint. The distinction that matters: concurrent-session
noise on the lifecycle streams is expected and should stay exempt (the
original reason the exemption existed at all); a deliberate edit to a
policy file is exactly the kind of out-of-footprint change this check
should still catch.

## Fourth follow-up (`tsk-34o5`): Attestation level 2 — enforcement halt at reap/return/approve

`tsk-34o5` elevates identity attestation from advisory-only (level 1) to mechanical enforcement (level 2). While `footprintDiffHits` remains advisory-only (diffs outside declared footprint flag scope creep without blocking), identity divergence (`baseCommit` ancestry mismatch or `headRef` mismatch) now triggers an immediate halt at all three chokepoints (`startupReap`, `fgos return`, `fgos approve`):

- **Shared Guard (`src/runner/attestation-guard.mjs`):** Reads the latest `executor.dispatch` event for an item ID from `.fgos/events.jsonl`.
- **Enforcement Rules:** Halts if `headRef` recorded at dispatch time does not match `fgw/<id>`, or if the branch's actual tip is not a git descendant of the recorded `baseCommit` (`git merge-base --is-ancestor`).
- **Typed Halt:** Divergent items are parked at `blocked` with the typed reason `attestation-mismatch`. No merge is attempted, main remains untouched, and friction evidence is logged.
- **Zero Friction on Green & In-Session:** Absent attestation events or `baseCommit: null` / `headRef: null` (in-session dispatches) return `{ ok: true, skipped: true }` without blocking. Legitimate retries on a branch reset to baseline remain green.

## Why level 1 vs level 2

Real breakage is already caught by `merge.mjs`'s existing staged
verify-gate — that's not level 1's job to duplicate. What level 1
targets is scope creep that still *passes* verify (advisory-only `footprintDiffHits`).
Level 2 targets identity divergence (e.g. `tsk-43z` worker committing straight to main or off-baseline ref rewrites) by enforcing a hard mechanical halt before any code is trusted or merged.

