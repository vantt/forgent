---
type: explanation
title: Why state.json's write became atomic while its lock-scope claim turned out already fixed
tags: [state, replay, store, atomic-write, events-lock]
source_capture_ids: [tsk-4mx]
framework: diataxis
mode: explanation
---
# Why `state.json`'s write became atomic while its lock-scope claim turned out already fixed

`state.json`'s `writeView` was a bare `fs.writeFileSync` straight onto the
file — a crash, or a concurrent read landing mid-write, could observe a
truncated file. The parent item (`tsk-5nj`) originally scoped two defects
together: an unlocked write and a non-atomic write, split into two
independently workable pieces — `tsk-4mx` (this item, the safety fixes)
and `tsk-49e` (a larger, higher-risk incremental-read snapshot mechanism
that depends on `tsk-4mx` landing first).

## The correction found while implementing

Re-reading `store.mjs` line by line during implementation overturned half
of the original scope. `withEventsLockAndRefresh` already wraps
`refreshView`'s call — including `writeView`'s write to `state.json` —
inside the same `withEventsLock` callback used for the append. A comment
already there, citing `tsk-1q5`, documents this was fixed once already:
folding `refreshView` into the same held lock closed the two-separate-
critical-sections race structurally. The original scout evidence had
mistaken that historical fix-description comment for a description of
still-broken current behavior — a misread, not a real gap. A direct grep
for every `refreshView(` call site in `store.mjs` found exactly 3:
every routine mutation (`moveWork`, `addWork`, `addDecision`,
`addOutcome`, `registerTool`, everything going through
`withEventsLockAndRefresh`) already writes under lock. Only `initStore`
(one-time bootstrap) and `rebuild` (an explicit, rare, operator-invoked
recovery command) genuinely bypass the lock — confirmed out of scope for
this item after the user was asked directly and confirmed narrowing.

## The real fix: atomic replace

`writeView` now writes to a uniquely-named temp path
(`${viewPath}.tmp-${pid}-${timestamp}-${random}`) and `rename`s it onto
`viewPath` — an atomic replace on POSIX, so a reader can never observe a
partial `state.json`. This reuses the exact same pattern
`main-checkout-lock.mjs`'s own `writeAtomicReplace` already established
in this codebase, rather than inventing a new one.

## Where this sits in the larger cluster

`tsk-4mx` is a leaf child of `tsk-5nj`, under this repo's nested
branch-tree merge topology: a leaf merges into its root's own integration
branch (`fgw/tsk-5nj`) and reaches its own `retrospective` status
independently of when the root itself closes into `main`. `tsk-5nj`
stays `status: todo` until both its children — this item and `tsk-49e`
(the incremental-read snapshot, deliberately scoped to depend on this
item landing first) — are done. A reader checking `main` directly for
this fix before `tsk-5nj` itself closes will not find it yet; that is
expected under the topology, not a sign the fix was lost.

## Related

- `docs/history/tsk-5nj-state-json-write-only-cost/CONTEXT.md` — the
  parent's own decision record (D1: real snapshot over deletion; D2: full
  byte-offset seeking scope; D3: the two-piece split; D4, on the branch:
  the lock-scope correction this item made).
- `plans/260810-2004-fgos-state-daemon-mcp-proposal/plan.md` — the larger,
  separately-captured performance initiative this item is one concrete
  step toward.
