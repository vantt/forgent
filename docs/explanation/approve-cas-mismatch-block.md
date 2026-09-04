---
authoritative_for: fgos approve's failure-to-block paths previously crashing with a raw transitionWork CAS mismatch error instead of returning a structured blocked result when another session or a prior retry had already moved the item off awaiting-approval
---

# `fgos approve` stopped crashing when the item it was about to block had already moved

`tsk-4p6` fixed a class of unclassified crash in `fgos approve`: several
failure paths (merge conflict, unclassified merge failure,
`fgos-write-rejected`, lock-lost-mid-merge, verify-fail/verify-timeout,
merge-blocked-by-other-item) called `moveWork(dir, { to: 'blocked',
expectedStatus: 'awaiting-approval' })` directly. If another session, a
prior retry, or an event-replay regression had already moved the item off
`awaiting-approval` (most commonly to `blocked` itself), `transitionWork`'s
CAS precondition check threw a raw error —

```
transitionWork: expected status "awaiting-approval" ... but found "blocked"
```

— which surfaced as an unclassified crash (exit 3 / raw throw) instead of
the same structured block envelope every other failure path already
returns.

## What shipped

A single shared helper, `moveBlockedOrConflict(dir, { id, reason, role })`
(`src/verbs/merge/approve.mjs:112`), wraps the failure-to-block `moveWork`
call: on success it returns `null` (unchanged behavior); on a CAS conflict
(`categoryOf(err) === 'conflict'`) it re-reads the item's live status via
`listWork` and returns a structured result instead of letting the error
propagate:

```js
{
  outcome: 'blocked',
  reason: 'state-changed-concurrently',
  expected: 'awaiting-approval',
  actual: <the item's real current status>,
}
```

Any non-conflict error (a `StoreError` from a legitimate precondition
refusal, e.g. missing-evidence) still propagates unchanged — the helper
narrows only the CAS-mismatch class, per the item's own acceptance
criterion 3 ("must not mask successful merges that already landed").

All 18 pre-existing failure-to-block call sites across `approve.mjs` —
covering conflict, `merge-failed-unclassified`, `merge-blocked-other-item`,
`lock-lost-mid-merge`, `fgos-write-rejected`, and `verify-fail`/
`verify-timeout` — were mechanically switched to call this one helper
instead of `moveWork` directly. No new branching logic per call site; the
fix is uniform.

## What the tests prove

`test/cli/fgos-approve-2.test.mjs` covers both required scenarios:

- **AC4** — approve reads an item as `awaiting-approval`, the merge fails,
  and before the failure-to-block write lands the item is already
  `blocked` (simulating a concurrent second session or retry). Approve
  returns the structured `{ outcome: 'blocked', reason:
  'state-changed-concurrently', ... }` result instead of throwing.
- **AC5** — the same structured result is asserted for a stale-actual-status
  scenario reached via event-replay regression, confirming the helper
  re-reads the live store rather than trusting a cached status.

## Scope and relation to adjacent items

This item deliberately scoped only the CAS-mismatch-catching fix — it does
not address the deeper root cause of *why* an item might already be
`blocked` when approve expects `awaiting-approval` in the first place.
That root-cause investigation is tracked separately (the item's own
description names `tsk-5rg`, which documents the same live crash text
observed on `tsk-3uc`, as the deeper investigation this item is
independent of). The success path's own diagnostic handling
(`recordApprovePostSuccessFault`, `src/verbs/merge/approve.mjs:90-109`) is
untouched — it already had its own structured handling for a different
failure class (the status write failing after a successful merge, not a
CAS mismatch on a failure-to-block write) and was never in scope here.
