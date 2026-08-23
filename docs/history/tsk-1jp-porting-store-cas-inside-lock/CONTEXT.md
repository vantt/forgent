# CONTEXT: porting-store's read-check-append runs outside the events lock

Item: `tsk-1jp`. Written retroactively (same structural gap as this scan's
other items).

## Locked decisions

- **D0.** Root cause confirmed by reading `src/state/porting-store.mjs`
  in full: `addPorting` (:106-121) and `movePorting` (:128-140) each call
  `rebuildViewFromLog` (a fresh read), check a precondition against it,
  then call bare `appendEvent` — three separate steps, no lock spanning
  all three. `appendEvent` itself only locks its own single append.
  `store.mjs`'s `addWork`/`moveWork` (the pattern `addPorting`'s own
  comment at :103-104 claims to mirror) wrap the read-check-append in ONE
  `withEventsLock` scope (`store.mjs:142-228`, confirmed by reading in
  full), using `appendEventLocked` (not `appendEvent`) for the write
  inside that scope specifically to avoid re-acquiring the lock. The
  comment's claim of parity is false: two concurrent `addPorting` calls
  on the same id can both pass the existence check before either writes.
- **D1.** Fix: apply the exact same `withEventsLock`/`appendEventLocked`
  wrapping to both `addPorting` and `movePorting`, mirroring
  `store.mjs:140-231`'s own structure — `refreshView(dir)` stays OUTSIDE
  the lock scope in both, exactly where `store.mjs:229` already calls it
  (a plain `fs` read+write, no locking of its own; confirmed by reading
  `refreshView`, `porting-store.mjs:77-82`).
- **D2.** Correct the misleading comment at `:103-104` ("mirroring
  store.mjs's addWork dup-id guard") to state what's actually true after
  the fix, rather than removing the claim — the comment's INTENT was
  correct, its implementation just didn't match it yet.
- **D3.** Proof: `test/state/store.test.mjs`'s own `raceAcrossProcesses`
  helper (:34-75) spawns real, genuinely-concurrent child OS processes
  racing the same call — the same technique already proven for
  `addWork`/`moveWork`'s own dup-id/CAS races (`:567-624`). In-process
  concurrency (`Promise.all` without real processes) can never expose
  this class of bug — one event loop serializes calls for free, per that
  test file's own comment. Mirrored for `addPorting`/`movePorting`.

## Outstanding questions

None
