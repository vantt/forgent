---
authoritative_for: runOpportunisticMainCheckoutChecks periodic-commit self-block on its own lock holder, catchup/approve staged-but-uncommitted events.jsonl self-collision, deliberate direct-on-main fix bypassing worktree/merge
---

# The checkpoint commit didn't recognize its own caller as the lock holder — so it staged and silently failed, poisoning the next real merge

`tsk-32v` fixed a real, deterministic (not timing-dependent) self-collision:
`fgos catchup`/`fgos approve` refusing their own merge with "local changes
would be overwritten," every single time, with no retry ever converging.

## The mechanism, found by direct reproduction after 7 identical failures in one night

`runOpportunisticMainCheckoutChecks` (`src/state/events-jsonl-truncation-guard.mjs`,
gated by `FGOS_DISABLE_OPPORTUNISTIC_CHECKS`, called from `merge.mjs`'s
`mergeRunnerItem`/`performCatchUp`) ran its own periodic-checkpoint
commit step *while the caller already held* `.fgos/main-checkout.lock` —
but never identified itself to `.githooks/pre-commit`'s own lock re-check
(`HOLDER_PID_ENV_VAR`). The hook therefore saw what looked like a foreign
identity and refused the commit. `git add` had already run — staging the
file — and the surrounding `try`/`catch` swallowed the hook's refusal
silently, leaving `.fgos/events.jsonl` staged-but-uncommitted.

A *staged* diff (not merely a working-tree change) on a path carrying
`.gitattributes merge=union` causes git's own pre-merge dirty check to
refuse **any** `git merge --no-commit --no-ff` that later touches that
path — confirmed via an isolated scratch-repo test: identical content
left only in the working tree (never `git add`ed) merges cleanly
(a no-op, since the branch's content is already an ancestor/subset); the
same content once staged always fails with "local changes would be
overwritten," regardless of the actual content relationship.

Compounding this: `approve`'s own `recordIronLawAcknowledge`
(`src/verbs/merge/approve.mjs`) writes a fresh, non-idempotent decision
event into `.fgos/events.jsonl` immediately *before* that same call's own
merge attempt. Combine both mechanisms — catchup finishes syncing the
branch, then approve writes-then-merges in the same call — and the result
is a deterministic self-collision structure, not a race: it reproduced
identically 7 times in a row that night, never converging on retry, and
stopped only once `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1` was set for both
catchup and approve (the same env var `npm test`'s own test script
already sets, for exactly this reason).

## A deliberate exception to the normal worktree/merge flow

Recorded directly in the item's own decision log: fixed straight on
`main`, bypassing the worktree/merge process entirely, *at the user's own
request* — because the very system a normal `fgos pick`/`return`/`approve`
cycle depends on (merge itself) was the thing broken. This is a
bootstrapping exception, not a shortcut of convenience: you cannot use a
broken merge path to land the fix for that same merge path. The item's
own status/stage fields reflect this directly — no `mergedSha`, stage
still `discovery`, moved `todo → doing → delivered` by a human role in
two commands 5 seconds apart, entirely outside the engine's normal
executing/awaiting-approval lifecycle.

## What shipped

`00aafe0c` — `runOpportunisticMainCheckoutChecks` now threads a
`commitEnv` (carrying `HOLDER_PID_ENV_VAR`) down from all three call
sites that already hold the lock before calling it (`merge.mjs`'s two
sites, `claim-port.mjs`'s own site), mirroring the same fix `merge.mjs`'s
own real merge commit already carried (`tsk-70l`) — this kernel-tier
module can't import the env-var constant itself (one-way-down layering),
so callers pass it as plain data. Also stops silently swallowing a
partial failure: if the commit fails after `add` succeeds, the stage is
rolled back before the error propagates — the function now either fully
commits or leaves the tree exactly as found, never a half-staged state.
Verified against a scratch repo with the real hook wired via
`core.hooksPath`: the old call shape reproduces the exact refusal and
leaves the file staged; the fixed shape commits cleanly.

A follow-up (`7e40066f`) fixed a related test-coverage gap: the new
merge/claim guard tests never actually exercised the truncation guard,
because `npm test` globally sets `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1`
and the worker's prompt only told it to override that in *new* test
files — missing two existing files that also gained new tests needing
the real check.

## A second, separate bug found and fixed the same night — not tracked further here

The item's own description also names a second, unrelated bug already
found, fixed, and merged that same night, deliberately not tracked as a
separate item: `tsk-1i3`'s content-precedence guard
(`.githooks/pre-commit`'s `stagedFgosModificationsRegressLineCount`)
called `execFileSync('git', ['show', ...])` against `.fgos/events.jsonl`
(10MB+) without setting `maxBuffer`, exceeding Node's 1MB default and
wrongly refusing every commit touching that file as "could not read
blob." Already covered as [`tsk-1i3`'s own same-day follow-up fix](pre-commit-fgos-content-precedence-guard.md)
(`e2affe8c`) — not duplicated here.

## Not a duplicate

[`tsk-2f6`](fgos-write-rejected-structural-deadlock.md) — a different bug
entirely: that one is about `fgos-write-rejected`'s unconditional
content-check firing on an already-cleanly-staged merge. This item's bug
never even reaches that point: git blocks the merge PRE-merge because the
working tree is dirty from the checkpoint's own leftover staged file.
