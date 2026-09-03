---
authoritative_for: fgos edit / general CLI verbs still appending to frozen events.jsonl baseline, verified already fixed by the time investigated, CLI-process-level regression test added
---

# A reported still-live baseline-append bug — closed as already fixed, with real proof instead of an assumption

`tsk-1t2` investigated a real historical incident (`tsk-26r`'s own
`work.move`/`work.outcome`/`work.edit` events, seq 24089-24092,
landing in `.fgos/events.jsonl` on `main` instead of a per-writer shard,
well after [Tầng A's migration](eventlog-tier-a-multifile-content-hash-redesign.md)
and [`tsk-3tp-1`'s dual-write cutover fix](eventlog-sweep-checkpoint-redesign.md)
— that cutover fix only covered `logExecutorDispatch` and the dispatch
audit append, not the general/default event-append path every verb like
`edit`/`pick`/`return` goes through). The item's own submission assumed
this was still a live bug and asked to find and fix the remaining
direct-write call site(s).

## Verified already fixed — three independent reproductions

Every `appendEvent`/`appendEventLocked` call site reachable from the
general verb path was audited (`store.mjs`'s `addWork`/`editWork`/
`moveWork`/`moveStage`/`addOutcome`/`addFriction`/`addDecision`/
`recordGateApprove`/`recordCall`/`recordCallReturn`/`setFocus`/
`resolveParkReason`, plus `dispatch/cli.mjs` and `loop.mjs`) — every one
already resolved through `resolveWriterLogPath`, not the frozen baseline
path. The full add → edit → move → edit lifecycle was reproduced three
separate ways: `store.mjs` functions called directly, a fresh fixture
repo driven through the real spawned `bin/fgos.mjs` binary, and — a
genuinely meta detail recorded directly in the fix commit — **this same
session's own live `fgos pick tsk-1t2` call**. All three landed
exclusively under `.fgos/events/`, never `events.jsonl`, which stayed
byte-for-byte unchanged throughout.

## What shipped — a regression test, not a code fix

**No production code changed.** A new CLI-process-level regression test
was added (`test/state/store.test.mjs`'s existing coverage only exercised
the in-process `store.mjs` functions, never the real spawned binary) that
drives add/edit/move/edit through the actual `fgos` CLI and asserts the
baseline file's content never changes. Verified failing-before by
temporarily reverting `editWork`'s append call to the pre-fix
`paths(dir).logPath` shape — the new test failed exactly as expected,
then passed again once reverted back. The historical `tsk-26r` baseline
growth is recorded as a closed incident, confirmed not reproducible
against current code — some intervening fix (not itself credited by name
in this investigation) had already closed the real call site before this
item was worked.

## Why the defensive `merge=union` restoration still made sense anyway

Even with the direct-write path confirmed closed, [`tsk-3tp`'s own
`836bd800` restoration](eventlog-sweep-checkpoint-redesign.md) of
`events.jsonl`'s `merge=union` safety net (undone by `tsk-3tp-2`'s
premature freeze assumption, restored once `fgos edit` was found still
appending — at the time believed live) remains a defensive layer: this
investigation didn't prove the append path could never regress again,
only that it wasn't currently broken. Keeping the union-merge safety net
costs nothing and catches exactly this class of regression should it ever
recur.

## Same pattern as adjacent verified-not-broken items

Matches the shape of [`tsk-5k1`/`tsk-4te`](opportunistic-checks-test-regression-fgos-oet.md)
elsewhere in this same investigation history — a reported symptom
verified, via direct reproduction rather than assumption, to already be
fixed by the time it was actually worked, closing with real
regression-test evidence instead of a redundant re-fix.
