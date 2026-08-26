# settle-claim-work-add-writer-stamp — plan.md

Mode: standard (3 flags: touches the core event-sourcing data model —
what gets written into a durable event payload; touches existing covered
behavior — `test/state/runtime-coordination.test.mjs` already has
dedicated, passing coverage for this exact reconcile mechanism that must
stay green; weak proof around the area — multiple real incidents already
happened here, per RESEARCH.md).

## Approach

RESEARCH.md Round 1 already pinned the fix to exactly one call site:
`addWork` (`src/state/store.mjs:246-333`) is the only `view.work[id]`-
mutating verb that never stamps `payload.writer`, unlike its siblings
`editWork`/`moveWork`/`resolveParkReason` (`store.mjs:469/502/728`), which
all set `payload.writer = resolveWriterIdentity(dir)` right before their
own `appendEventLocked` call. `resolveWriterIdentity` is already imported
in this file (`store.mjs:42`) — no new import needed.

`replay.mjs:69-74`'s `case 'work.add'` already spreads `event.payload`
wholesale into `view.work[item.id] = {...DEFAULTS, ...item}`, so once
`item.writer` is set before the event is appended, it folds through with
zero `replay.mjs` changes — confirmed by the same generic-spread mechanism
`work.move`'s own `item.writer = writer` line already relies on for that
event type.

Files touched: `src/state/store.mjs` (one line in `addWork`) and
`test/state/runtime-coordination.test.mjs` (one new test).

Risk map: standard. The change is a single additive field stamp on one
event type, following an established, already-tested pattern used by
three sibling verbs — no new branch, no behavior change for any existing
caller that doesn't hit this exact revisionDriftIsSelfCaused reconcile
path. Proof point: the FULL existing
`test/state/runtime-coordination.test.mjs` suite (not just the new test)
must stay green, including the two tests that depend on CURRENT
behavior not changing — the "unstamped side-log events" test (still
passes: `decision`/`gate-approve` stay in the denylist, untouched by this
fix) and the "no writer stamp at all... fails closed" test (still passes:
that test's own fixture is a raw `work.attempt` event, which this fix
does not touch — `work.attempt` deliberately stays unstamped, per
RESEARCH.md).

Alternative rejected: adding `work.add` to `SIDE_LOG_ONLY_EVENT_TYPES`
instead of stamping it. Rejected — `work.add` genuinely creates
`view.work[id]` (unlike `decision`/`gate-approve`, which only ever touch
side logs), so exempting it from the drift check would let a REAL
same-writer content mismatch on the item's own initial fields slip
through unnoticed, which is exactly the class of silent bug
`revisionDriftIsSelfCaused`'s own "require POSITIVE evidence, never a
vacuous pass" comment (`store.mjs:1035-1040`) warns against.

## Shape

1. In `src/state/store.mjs`'s `addWork` (around line 330-333), stamp
   `item.writer = resolveWriterIdentity(dir)` on the `item` object before
   the `return appendEventLocked(...)` call — same call, same shape, as
   `editWork`'s own `payload.writer = resolveWriterIdentity(dir)`
   (`store.mjs:465-469`).
2. Add one new test to `test/state/runtime-coordination.test.mjs`,
   directly after the existing "reconciles a same-writer drift even when
   unstamped side-log events" test (~line 576), following its exact
   structure: claim an item, then call `addWork` again for the SAME id
   under the SAME `FGOS_SESSION_ID` (simulating the wipe+resubmit shape
   tsk-1sr's own incident hit — a `work.add` event landing AFTER
   `claim.acquiredAt`), assert the durable revision actually drifted, then
   assert `settleClaim` reconciles (`status` reaches the target
   `finalStatus`) instead of throwing.
3. Run the full file, not just the new test, before considering this
   done.

## Outstanding questions

None.
