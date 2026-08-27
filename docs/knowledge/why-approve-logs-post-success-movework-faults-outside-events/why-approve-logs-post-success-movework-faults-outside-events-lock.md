---
framework: diataxis
mode: explanation
---
# Why `approve` logs post-success `moveWork` faults outside `events.lock`

`fgos approve`'s three success paths in `bin/fgos.mjs` (`case 'approve'`)
each call `moveWork(dir, { id, to: 'delivered', ... })` right after their
own precondition already succeeded — a real git merge landed, or a
verify-only re-check passed. None of the three used to catch a failure
from that call. When it threw, the precondition's real effect (a landed
merge, or a confirmed-green verify) was already permanent, but the
item's status never advanced past `awaiting-approval` — and unlike every
other failure branch in the same function (`conflict`,
`fgos-write-rejected`, `verify-fail`), no friction record was written.
The item looked stuck with zero diagnostic trail.

## The real incident that proved this

`tsk-3wr`'s own `approve`: commit `2766e60` "Merge branch fgw/tsk-3wr"
landed on `main`, but the item stayed `status:proposed` (pre-dating the
`delivered` status rename) for many subsequent minutes — discovered only
by manually diffing `git log` against `fgos list`. A merged-but-unrecorded
item is indistinguishable from one that simply hasn't been approved yet.

## Scope — all three unguarded success calls, not just the one named

The item's original description only named one call site with stale line
numbers. The real fix (D1) covers all three unguarded
`moveWork(...to:'delivered'...)` success calls in `case 'approve'`:
leaf-into-root merge (`bin/fgos.mjs:2223`), root-into-main merge
(`bin/fgos.mjs:2297`), and pull-door/legacy verify-only
(`bin/fgos.mjs:2327`). All three share the identical shape — success
path, unguarded write, no friction on throw — so fixing only the
merge-landing paths would have left an identical, known gap in the
third. (The `--github` transport's own equivalent call at line 2119 was
explicitly left out of scope — a materially different case, a
GitHub-side merge, not raised by the filed item.)

## Why the fallback can't reuse `events.jsonl`/`events.lock`

The obvious fix — reuse the existing `fgos-write-rejected` friction shape
via `addFriction` — doesn't work here, because `addFriction` is itself
another `events.jsonl` write guarded by the *same* `events.lock` that
just threw (`EventLogError('lock-timeout')`,
`src/state/events.mjs`). A same-lock retry can hit the identical
failure. D2 locks this requirement in: the diagnostic fallback must stay
visible even under **sustained** lock contention, not just a one-off
blip — it cannot depend solely on that same lock succeeding.

## The fix — a separate, lock-free fault log

`src/cli/approve-fault-log.mjs`'s `recordApprovePostSuccessFault`:

```js
// approve-fault-log.mjs — records a post-success `moveWork` failure inside
// `approve` (tsk-480), so a real, already-landed merge or already-passed
// verify is never left with zero trace just because the immediately
// following status write hits `events.lock` contention.
//
// Deliberately NOT `events.jsonl` — same reasoning as
// `invocation-fault-log.mjs`: that file is the FSM rebuild source, a pure
// diagnostic record has no business in it — and deliberately NOT sharing
// `events.lock` (CONTEXT.md D2): a plain `fs.appendFileSync` to its own
// file, so a record here can still succeed while `events.lock` stays
// contended. Never throws into its caller — a failure recording the
// failure must not mask (or replace) the original error.

export const APPROVE_FAULT_LOG_BASENAME = 'approve-post-success-faults.jsonl';

export function recordApprovePostSuccessFault(dir, { id, phase, detail }) {
  try {
    const logPath = path.join(dir, APPROVE_FAULT_LOG_BASENAME);
    const record = { ts: new Date().toISOString(), id, phase, detail };
    fs.appendFileSync(logPath, `${JSON.stringify(record)}\n`);
    return logPath;
  } catch {
    return null;
  }
}
```

Two deliberate choices baked into that one function: it writes to its
own file (`approve-post-success-faults.jsonl`, not `events.jsonl` — the
FSM rebuild source has no business holding a pure diagnostic record),
and it never throws into its caller — a failure while recording the
failure must never mask or replace the original error.

## How the call site distinguishes this from every other failure class

At the call site, only an `EventLogError` (the write itself failing —
e.g. `'lock-timeout'`) triggers this fallback path. A `StoreError` from
`transitionWork`'s own precondition/CAS check (e.g. a missing-evidence
acceptance clause) is a legitimate refusal that must keep propagating
exactly as before — swallowing it here would silently accept an item
`transitionWork` correctly refused. On the `EventLogError` path, a
warning is written to stderr naming the diagnostic log path (or noting
it went unrecorded), and the item's status is explicitly left at
`awaiting-approval` pending manual reconciliation rather than silently
disappearing.

## Verified with an injectable failure seam

D3 required verification via an automated test using an injectable
failure seam that forces `moveWork` to throw exactly at the success
point, asserting a diagnosable record appears instead of an unhandled
throw plus a permanently-stuck item — not manual repro alone.
