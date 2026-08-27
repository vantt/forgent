---
framework: diataxis
mode: explanation
---
# Why `approve` checks acceptance evidence before merging, not after

`fgos approve`'s merge paths — local (leaf→root and root→main, both in
`bin/fgos.mjs`'s `approve` command, calling `mergeRunnerItem()` in
`src/runner/merge.mjs`) and the `--github` transport
(`mergeGitHubPR()`, same file) — used to perform the real merge first and
only *after* that succeeded call `moveWork(..., to: 'delivered')`
(`src/state/store.mjs`). If `moveWork` then refused the transition, the
merge had already landed (on the target branch, or on GitHub) while the
item's status stayed `awaiting-approval` — a state/reality mismatch.

## The real repro that surfaced it

`tsk-424`'s own `approve` (2026-07-28): the first `--acknowledge-iron-law`
call printed "Automatic merge went well; stopped before committing as
requested" then failed with "cannot move to done from stage executing —
must pass through compound-learn first" — but a real merge commit
(`20bfb95`, `Merge branch fgw/tsk-424`, parents `064e90d`+`0aa99ac`)
landed on `main` anyway. A second `approve` call after `fgos compound`
created a *second* merge commit (`d00be89`) on top. Harmless in that
specific case (no conflict, no data loss, the second merge superseded
cleanly), but the ordering itself was backwards.

## Scope was retargeted to the check that actually still exists

The original filing was written against the `compound-learn` stage-gate.
That mechanism was retired outright
(`docs/history/work-item-status-delivered-retrospective-cleanup/CONTEXT.md`
D9/D11) — `approve`/`return` now stop at `delivered`, never attempt
`done` inline. The fix retargeted scope to the structurally identical gap
that still exists in current code: the **RUL58 acceptance-evidence
check** inside `moveWork`'s `awaiting-approval -> delivered` door
(`src/state/store.mjs:485-520`), which still ran after the real merge
commit landed.

## Why the `--github` transport was in scope too, and mattered more

The `--github` transport (`mergeGitHubPR()` then
`moveWork(..., 'delivered')`) has the same merge-before-gate shape and no
existing decision doc covered it. It's higher-stakes than the local
paths: a GitHub-side merge cannot be `git merge --abort`ed the way a
local one can, so the window between "merge landed" and "`moveWork`
confirms delivered" carries real irreversible-merge risk the local paths
don't share.

## An already-shipped mitigation that didn't fix the ordering

`tsk-3yl` (`4dc4f8f`, 2026-07-29) made `mergeRunnerItem` idempotent
(`isAlreadyMerged()`): a retry after this failure re-verifies instead of
creating a second merge commit. That closed the original repro's
"second merge commit lands on top" symptom, but left the ordering itself
unchanged — a permanently-unmet acceptance clause would still leave
`main` holding a merge for an item stuck at `awaiting-approval`
indefinitely.

## The fix — extract the check, run it as a pre-flight

`assertAcceptanceEvidence(id, work)` was extracted out of `moveWork`'s
inline `to === 'delivered'` check so `approve` could call it directly, as
a pre-flight before any merge mutation:

```js
/**
 * RUL58 acceptance-evidence gate: throws if `work` has opted into
 * `acceptance` clauses ... and any populated clause still lacks evidence.
 * ... Extracted out of `moveWork`'s inline `to === 'delivered'` check
 * (tsk-396 D1) so `approve` (bin/fgos.mjs) can also call this directly,
 * as a pre-flight check before any merge mutation — the merge-then-gate
 * ordering gap tsk-396 exists to close. `moveWork` still calls this
 * itself below, unchanged, as the backstop for the doors into
 * `delivered` that don't go through that pre-flight (`return`'s
 * `doing -> delivered`, the mechanical `blocked -> delivered` retry).
 */
export function assertAcceptanceEvidence(id, work) { ... }
```

It's wired in at all three transports, each one commented with the exact
decision it satisfies:

- **local leaf→root / root→main** (`bin/fgos.mjs`, before
  `mergeRunnerItem`): *"Acceptance-evidence pre-flight (tsk-396 D1):
  covers both merge paths below ... checked BEFORE `mergeRunnerItem`'s
  real git merge, not caught after the fact inside `moveWork`'s own
  `to === 'delivered'` check. A merge that's about to be refused here
  never touches the target branch."*
- **`--github`** (`bin/fgos.mjs`, before `mergeGitHubPR`):
  *"Acceptance-evidence pre-flight (tsk-396 D2): checked BEFORE the real
  GitHub-side merge, not caught after the fact inside `moveWork`'s own
  `to === 'delivered'` check — a GitHub merge can't be `git merge
  --abort`ed the way a local one can, so this matters even more here
  than on the local paths above."*

`moveWork` still calls `assertAcceptanceEvidence` itself afterward,
unchanged — it stays the backstop for doors into `delivered` that don't
go through the new pre-flight (`return`'s `doing -> delivered`, the
mechanical `blocked -> delivered` retry).

## Scope boundary

Redesigning `mergeRunnerItem`/`moveWork`/`mergeGitHubPR` beyond closing
this one ordering gap was explicitly out of scope — the broader
merge-harness-v2 design (drift detection, sync-root, merge-set
clustering) is tracked separately.

## Decomposition call

`judgeDecompose` first returned `need-human` (item risk was `heavy`). A
person confirmed pass-through, no split: one cohesive fix across three
call sites sharing the same root cause, done as three ordered sequential
steps (extract the validator, wire the two local paths, wire the
`--github` path) — splitting into separate child items would have only
created a fake dependency chain without adding real independence.
