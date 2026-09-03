---
framework: diataxis
mode: explanation
---
# Why `resolveDiscovery` guards re-parking an already-parked item

`resolveDiscovery`'s `unclear` branch used to call `putInAwaiting`
unconditionally, without checking the item's current status first.
`putInAwaiting` always attempts a real `awaiting-human` status
transition (`moveWork`), and `fsm.mjs` has no self-transition edge for
`awaiting-human -> awaiting-human`. Calling `fgos discover <id>` directly
on an item that was *already* `awaiting-human` (parked by a prior
`discover` call, not yet answered) and getting another `unclear` verdict
would throw `StoreError` — the whole command died, losing that round's
verdict entirely.

## The real crash and its repro

```
transitionWork: no transition from "awaiting-human" to "awaiting-human" for work
```

Reproduced live on 2026-08-02 by running `fgos discover` directly on
three items already sitting `awaiting-human` from a prior park
(`tsk-2rp`, `tsk-42i`, `tsk-4op`) — all three crashed with this exact
error.

## Why the normal loop path never hit this

`discover-loop`/`discover-next`'s own picker
(`pickNextDiscoverItem`) only ever selects `status:todo` items — it
never re-selects an item that's already parked. The bug only surfaced
when calling the bare CLI verb `fgos discover <id>` directly on an
already-parked item — a legitimate use case (re-checking a parked item
after new context or code has landed, without first requiring a `fgos
answer`), just one the loop's own picker never exercises.

## The fix

```js
// tsk-wcl: `putInAwaiting` always attempts a real `awaiting-human` status
// transition (moveWork), and fsm.mjs has no self-transition edge for it —
// calling it on an item that is ALREADY `awaiting-human` (re-running
// `fgos discover <id>` directly on a still-parked item, bypassing the
// pool picker that normally never re-selects a parked item) throws
// StoreError and the whole call dies, losing this round's verdict
// entirely. `addDiscovery` above already recorded the fresh verdict
// unconditionally — only the redundant re-park is guarded here, so a
// second consecutive unclear call on an already-parked item still
// succeeds (with the item staying parked, its discovery history gaining
// the new entry) instead of throwing.
if (work.status !== 'awaiting-human') {
  putInAwaiting(dir, { id, ask: verdict.question, statusAtAsk: work.status });
}
return { outcome: 'unclear', id, verdict };
```

Only the redundant re-park call is guarded — `addDiscovery` (recording
the fresh verdict into the item's discovery history) still runs
unconditionally, exactly as before. A second consecutive `unclear` call
on an already-parked item now succeeds: the item stays parked (no
pointless self-transition attempted), but its discovery history genuinely
gains the new verdict entry instead of the whole call throwing and
losing it.

## Why `statusAtAsk` still reads at function entry

The comment on `statusAtAsk` clarifies a related but separate concern:
it's read from `work.status` at function entry, before this park —
`doing` when a pick claim is held through clarify, `todo` otherwise.
`answerAwaiting` later resumes the item to this same recorded status.
This detail doesn't change with the fix — it's documented here because
the guard sits directly next to it and a reader fixing this bug needs to
know which status field means what.
