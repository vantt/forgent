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
`capacityId`/`provider` fields. Either field folds to `null` rather than
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

## Why level 1, and why advisory rather than a gate

Real breakage is already caught by `merge.mjs`'s existing staged
verify-gate — that's not this feature's job to duplicate. What this
targets is narrower: scope creep that still *passes* verify — a change
that works, but touched files nobody declared it would. STR63 already
established advisory (flag, never block) as the right posture for exactly
this class of risk, and this item follows that precedent rather than
inventing a new enforcement mode. Both halves — the attestation capture
and the broadened diff check — never throw and never change a
merge/dispatch outcome on their own; they exist to be looked at, not to
stop anything.
