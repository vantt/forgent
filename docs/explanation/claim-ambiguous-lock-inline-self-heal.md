---
authoritative_for: claimWork AMBIGUOUS main-checkout.lock requiring manual /fgOS:unlock, inline self-heal via forceReclaimAmbiguousLock retry-once, scope narrowed from a proposed beehive-style two-tier reclaim
---

# The one remaining lock state that still needed a human — closed with a one-line retry, not a new mechanism

`tsk-2l8` closed the last gap in `main-checkout.lock`'s self-healing
story: an `AMBIGUOUS` lock state (unparseable content, not a live holder
disagreeing) forced `pick`/`take` to fail closed and required a person to
run `/fgOS:unlock` manually before retrying — the one place a stuck lock
still needed human intervention, against the repo's own priority #2
("Release con người" — release people from having to sit and watch).

## What was already true, verified by code before any design work

The item's own description is explicit that this was verified against
real code, not assumed: `src/state/events.mjs` already had a proper
stale-pid-reclaim (dead holder pid → atomic reclaim, TOCTOU-safe) —
unrelated to this gap. `src/runner/main-checkout-lock.mjs` already
self-reclaimed a numeric pid holder too — but a holder carrying a
**string** identity (a session id, whose liveness can't be probed the
same way a pid can) fell through to `AMBIGUOUS`, `exit 7`, and a required
manual `/fgOS:unlock`.

## A much larger design was proposed, then deliberately narrowed

The item's own submitted description proposed learning from
upstream `beehive`'s `lock.mjs` (lines 172-352): a two-tier reclaim —
a soft window (stale mtime → candidate) plus a hard ceiling (takeover
regardless), an atomic rename to a `.stale-*` file, and a post-rename
content re-verify to guard the TOCTOU window against clobbering a lock
that came alive mid-takeover. The description even pre-computed the
adjustment fgOS would need over bee's own 30s soft window — fgOS's own
`approve` can legitimately hold `main-checkout.lock` for ~6 minutes
during staged verify, so a naive port would need ≥10 minutes or a
heartbeat-renew scheme instead of bee's raw 30 seconds.

Exploring/planning narrowed this dramatically (recorded directly:
"lock exploring decisions, narrow lock-self-heal scope to claimWork's
AMBIGUOUS reclaim," a locked D4 explicitly ruling out touching
`main-checkout-lock.mjs`/`merge.mjs`/`lock-wait.mjs`). None of the
beehive-style two-tier/soft-window/hard-ceiling machinery shipped.

## What shipped instead — reusing an existing mechanism, not building a new one

`claimWork` (`src/runner/claim-port.mjs`) already had a sibling: the
`unlock` verb's own `forceReclaimAmbiguousLock` (with its own
re-read-before-unlink TOCTOU guard, already live at
`main-checkout-lock.mjs:655-676`). Rather than a new soft/hard-window
mechanism, `claimWork`'s `AMBIGUOUS` branch now simply calls that same
existing function inline and retries `acquireMainCheckoutLock` exactly
once:

```js
if (lockResult.status === AMBIGUOUS) {
  forceReclaimAmbiguousLock(dir);
  lockResult = acquireMainCheckoutLock(dir, { identity: process.pid, ttlMs: DEFAULT_TTL_MS, releaseOnExit: true });
}
```

A transient race — a live holder writing a valid record between the
first read and this call — surfaces below as whatever that fresh content
actually is (`HELD`/`ACQUIRED`); only a **second** consecutive
`AMBIGUOUS` (content persistently unparseable) still fails closed. `pick`/
`take` now self-heals in the same call instead of requiring a person to
run `/fgOS:unlock` first — `/fgOS:unlock` itself stays as the fallback
path for a genuinely undecidable case, unchanged.

## A small unrelated fix bundled in the same commit

`check-locked-decisions-heading-drift` had a false positive on this
item's own `CONTEXT.md`: the checker's unanchored regex matched
`"## Locked decisions"` quoted in backtick prose earlier in the doc
instead of the real heading further down. Fixed in the same commit
(`05cfcaef`).

## Scope held to `events.lock`'s existing correctness

Explicitly not touched: `events.lock` (already correct, per the item's
own description) — this item's entire scope was the `AMBIGUOUS`/
string-identity branch of `main-checkout-lock.mjs` alone.
