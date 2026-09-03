---
framework: diataxis
mode: explanation
---
# Why `.fgos/main-checkout.lock` could report AMBIGUOUS with no real contention

`tryAcquireOnce()` (`src/runner/main-checkout-lock.mjs`) used to create a
fresh lock in two separate syscalls — `fs.openSync(lockPath, 'wx')` then a
later `fs.writeSync(fd, ...)` — leaving a real window where the file
exists on disk with zero or partial bytes. The self-recognition refresh
branch (a lock owner renewing its own lock) wrote non-atomically too:
`fs.writeFileSync` truncate-in-place, not write-then-publish.

A reader (`claimWork`) landing in either window saw unparseable content,
`parseLockContent()` returned `null`, and `acquireMainCheckoutLock`
fail-closed to `AMBIGUOUS` — even though no writer was genuinely
contending.

## Real production hit

> `/fgOS:pick tsk-3lx` (2026-08-03 08:37:42) hit AMBIGUOUS with no
> `lockAgeMs` suffix — matching the unparseable-content branch, not the
> missing-`ttlMs` branch (which does carry `lockAgeMs`) — 91s after an
> automated commit at 08:36:11 inside the 3-minute TTL window, where the
> correct outcome would have been `HELD`.

## The fix: single-syscall atomic writes

Two new helpers replace the torn two-step writes:

- **`writeAtomicCreate`** (fresh-lock path) — writes the full content to a
  uniquely-named temp file first, then `link(2)`s it onto `lockPath`.
  `link` is atomic and, like `open(wx)`, fails `EEXIST` if the target
  already exists — so two racing callers still produce exactly one
  `ACQUIRED`, never both. Mutual exclusion is preserved, not weakened.
- **`writeAtomicReplace`** (self-recognition refresh path) — writes to a
  temp file, then `rename(2)`s it onto `lockPath`. `rename` is an atomic
  replace on POSIX, so a concurrent reader sees either the old or the
  fully-written new content, never a partial one. No exclusivity check
  needed here — only a recognized owner refreshing its own lock reaches
  this path.

Both paths eliminate the read-sees-empty-or-partial-bytes window that
caused the false `AMBIGUOUS`.

## Scope

Fixed in `src/runner/main-checkout-lock.mjs` only. Three sibling locks
share the same `wx`-atomic-create lineage (`loop.mjs`'s
`acquireRunnerLock`, `session.mjs`'s `acquireSessionsLock`, `events.mjs`'s
`acquireEventsLock`) — if the same torn-read race exists there, it's a
separate future item, not silently bundled into this fix. No behavior
change to `parseLockContent`, `inspectMainCheckoutLock`,
`releaseMainCheckoutLock(IfOwn)`, or `forceReclaimAmbiguousLock` — their
existing `AMBIGUOUS`/`HELD`/stale semantics are correct and untouched;
only the window that produced a *false* `AMBIGUOUS` on a torn read closes.

## Related

- `docs/history/main-checkout-lock-toctou-race/CONTEXT.md` — full decision
  record and scout evidence.
- `docs/how-to/clear-a-stuck-main-checkout-lock.md` — the recovery path
  for a genuinely `AMBIGUOUS` lock (unparseable content that isn't a
  transient torn read); this fix reduces how often that state is ever
  reached for the wrong reason, but doesn't change the recovery verb
  itself.
- `docs/decisions/0021-wire-main-checkout-hook-qua-doctor-setup.md` — why
  the lock exists and the STR65 concurrent-writer race it guards against.
