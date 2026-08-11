# Plan — tsk-107

Mode: tiny

## Approach

`CONTEXT.md` D1 already establishes the fix and its regression test are
both committed and present on this branch (commit `42eef0fa8`, an ancestor
of `branchHeadAtTake` `725c292a`). There is no code left to write. The
lane-decision flags (auth, authorization, data model, audit/security,
external systems, public contracts, cross-platform, existing covered
behavior, weak proof, multi-domain) score exactly one — "existing covered
behavior" (`test/runner/merge.test.mjs`'s pre-existing tsk-107 regression
test) — which lands this at `tiny`, not `small`/`standard`: a couple of
files, one direct task (confirm + verify, no edit).

Rejected alternative: re-implement `branchContentMismatch` from the item's
own description as if starting fresh. Rejected because it would either
produce a no-op diff (the logic already matches) or, worse, risk
regressing the already-passing fix/test pair for no benefit — `CONTEXT.md`
D1 already forecloses this path.

Impact-analysis posture (`CLAUDE.md`'s gate, `fgos tool query --capability
impact-analysis --status present`, checked fresh in `fgos-exploring`'s
CONTEXT.md step): **full** (`gitnexus`, `status: present`). No edit is
planned, so this is recorded for the audit trail only — GitNexus's own
`branchContentMismatch` lookup already confirmed its only caller is
`mergeRunnerItemLocked` and its only callee is the local `git` shell-out
helper, matching the direct source read.

## Files touched

None. This item's own scope, per `CONTEXT.md` D1, is confirm-and-verify —
no edit to `src/runner/merge.mjs`, `test/runner/merge.test.mjs`, or any
other file.

## Proof point

Run the full suite and confirm the tsk-107 regression test specifically
passes:

```bash
npm test
```

Expect `test/runner/merge.test.mjs`'s "mergeRunnerItem does not
false-flag an already-merged branch just because a later unrelated
already-merged branch also touched the same file" to pass, along with the
rest of the suite. A green run here is this item's own done-signal —
nothing else is required.

## Split

None. This is one honest piece of work (confirm-only), not a candidate
for decomposition into children.

## Outstanding questions

None
