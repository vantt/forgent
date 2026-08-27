---
type: how-to
title: How to clear a stuck `.fgos/main-checkout.lock`
tags: []
timestamp: 2026-07-29T05:58:21.000Z
source_capture_ids: [tsk-3h4]
framework: diataxis
mode: how-to
---
# How to clear a stuck `.fgos/main-checkout.lock`

Use this when `fgos take`/`fgos pick` refuses with exit code 7 and a
`lock-held` or `lock-ambiguous` message — before assuming the lock is
broken, most of the time it is another live session working correctly.

## Before you start

- Never hand-`rm` or hand-edit `.fgos/main-checkout.lock` directly. That
  bypasses the exact staleness/liveness judgment the lock exists to
  enforce (STR65 concurrent-writer guard,
  `docs/decisions/0021-wire-main-checkout-hook-qua-doctor-setup.md`) and
  can delete a lock a live session genuinely still holds.
- You need `fgos unlock` (CLI) or `/fgOS:unlock` (Claude Code slash
  command) — both call the same verb.

## Steps

1. **Run `fgos unlock`** (or `/fgOS:unlock`). It never force-deletes; it
   reuses `acquireMainCheckoutLock`'s own judgment
   (`src/runner/main-checkout-lock.mjs`).

2. **Read the result.**
   - `{ "cleared": true, "reason": "stale-or-free" }` — the lock was free,
     or held by a dead/expired holder (this case actually self-heals on
     the very next `take`/`pick` attempt too — `fgos unlock` just makes
     the reclaim explicit instead of implicit).
   - `{ "cleared": true, "reason": "reclaimed" }` — the lock content was
     corrupt/unparseable (the one status the lock's own primitive
     deliberately never clears itself, D5 fail-closed). This is the case
     that previously had *zero* automatic recovery — the reason this verb
     exists.
   - Exit 7, `unlock: main checkout lock is held by a live session (<id>)
     -- refusing to clear it.` — **stop.** A different session genuinely
     holds it right now. This is the lock working as intended, not a bug.

3. **On a live-held refusal, don't force it — check the lock's actual
   age** before deciding whether to wait:

   ```js
   const fs = require('node:fs');
   const rec = JSON.parse(fs.readFileSync('.fgos/main-checkout.lock', 'utf8'));
   console.log('age (sec):', ((Date.now() - rec.ts) / 1000).toFixed(1));
   ```

   Compare against `DEFAULT_TTL_MS` in `src/runner/main-checkout-lock.mjs`
   (check its current value — it has already changed once, 5 min → 3
   min). A lock well under that age is genuinely fresh; retry later. One
   that somehow reads older than the TTL and still refuses is worth a
   second look (a live numeric pid can stay "held" past its timestamp
   window as long as the process itself is alive — that's expected, not a
   bug either).

4. **Retry the original `take`/`pick`** once cleared. `fgos unlock` only
   clears the lock — it never claims the item itself.

## Why this exists

`.fgos/main-checkout.lock` guards the STR65 concurrent-writer race: two
sessions racing `git commit` against the same main checkout's `.git/index`.
Before this verb, the *only* status with zero automatic recovery
(`AMBIGUOUS` — unparseable lock content) had no path back except a hand
`rm` of the lock file, which is exactly the blind-delete habit that could
reopen the race for a genuinely live holder. `fgos unlock` closes that gap
without weakening the guard: it refuses exactly the case (a live different
holder) a force-delete would have wrongly cleared.

## Real example

Item `tsk-3h4` hit this lock live, twice, while itself building the fix:

> `{"pid":"ae6b4da8-81d3-47b6-a75c-19c1a7f07e4d","ts":1785299973058}`
> — real `.fgos/main-checkout.lock` content read mid-session, held by a
> different concurrent session actively working `tsk-3wr`/`tsk-3wr-2`/
> `tsk-3wr-3`.

The refusal repeated across many `fgos take` retries spread over more
than two hours of wall-clock session time with the *same* identity —
genuinely suspicious at first glance — but checking the lock's own `ts`
field on each retry showed it was only 60-90 seconds old every time: the
other session was actively refreshing it (self-recognition), not stuck. `fgos unlock` itself,
run against that live lock, correctly refused rather than trusting a
verbal assurance that the other side was "probably done":

> `unlock: main checkout lock is held by a live session
> (ae6b4da8-81d3-47b6-a75c-19c1a7f07e4d) -- refusing to clear it.`
> — real CLI output, tsk-3h4's own worktree, 2026-07-29

The claim only succeeded once that session's own work genuinely finished
(`{"id":"tsk-3h4","from":"todo","to":"doing", ...}`, real `work.move`
event, seq 663, renumbered by tsk-n4i-1; was 647) — confirming the wait, not
a forced clear, was the correct call.

## Related

- `docs/decisions/0021-wire-main-checkout-hook-qua-doctor-setup.md` — why
  this lock exists and why it is wired at the git-hook layer, not just
  inside fgOS's own verbs.
- `docs/how-to/diagnose-a-blocked-return-from-an-unrelated-verify-failure.md`
  — a related "is this actually stuck, or just live and busy" diagnosis,
  for `return`'s verify step rather than `take`'s claim lock.
- `tsk-5z2` — tracks the friction this doc's step 3 works around by hand:
  `fgos take`'s `lock-held`/`lock-ambiguous` error doesn't surface the
  lock's own remaining TTL/age, forcing a manual read of the lock file to
  tell "genuinely stuck" apart from "just busy."
