---
name: fgos-unlock
user-invocable: false
description: >-
  Recover from a stuck .fgos/main-checkout.lock when fgos take/fgos pick
  fails with "lock-held" or "lock-ambiguous" (exit 7). Use when a claim is
  refused because the main checkout lock looks stuck. Examples: "take failed
  with lock held", "claim refused: main checkout locked", "lock-ambiguous
  error on pick".
---

# fgos-unlock

A narrow recovery procedure, not a stage skill (contrast `fgos-routing`,
which orients on an item's `stage`). This triggers on one specific CLI
failure: `fgos take`/`fgos pick` throwing `ClaimError('lock-held', ...)` or
`ClaimError('lock-ambiguous', ...)` (surfaced as exit code 7, category
`lock-timeout`) from `claimWork` (`src/runner/claim-port.mjs`).

## Hard rule

Never hand-delete `.fgos/main-checkout.lock` (no raw `rm`, no editing it,
no scripting around it). That is exactly the habit this skill exists to
replace — a blind delete can remove a lock a live concurrent session
genuinely still holds, reopening the `.git/index` clobbering race the lock
lineage exists to prevent (STR65, `docs/decisions/0021-wire-main-checkout-hook-qua-doctor-setup.md`).
The only sanctioned path is the `fgos unlock` verb below, which already
encodes the same staleness/liveness judgment `acquireMainCheckoutLock`
(`src/runner/main-checkout-lock.mjs`) uses everywhere else.

## Flow

1. Read the CLI's own refusal message first — it already names which of
   the two cases applies (`lock-held: main checkout locked by pid <id>` vs
   `lock-ambiguous: main checkout lock state ambiguous`). Do not guess or
   second-guess it.
2. Run — `unlock` is `requiresExistingStore: true`, and the `take`/`pick`
   that just failed may have been a tsk-424 chained pick from inside an
   existing linked worktree (which never carries its own `.fgos/` by
   design, ADR0020), so resolve the main checkout root and pass it
   explicitly rather than running bare (tsk-56t D1):
   ```bash
   fgos unlock
   ```
3. Read the result:
   - `{ cleared: true, reason: "stale-or-free" }` — the lock was free or
     held by a dead/expired holder; already cleared. Retry the original
     `take`/`pick`.
   - `{ cleared: true, reason: "reclaimed" }` — the lock content was
     corrupt/unparseable and has been removed. Retry the original
     `take`/`pick`.
   - Exit code 7, `unlock: main checkout lock is held by a live session
     (<id>) -- refusing to clear it.` — a different session genuinely holds
     the lock right now. This is **not** a stuck lock; it is the lock
     working as intended. Do not retry `fgos unlock` in a tight loop hoping
     it changes state on its own. Either wait briefly and retry once the
     other session's work finishes, or hand this back to a person if it
     persists longer than the lock's own TTL window (`DEFAULT_TTL_MS` in
     `src/runner/main-checkout-lock.mjs` — check its current value; it has
     already changed once) would explain.
4. Once cleared, retry the `take`/`pick` that originally failed. `fgos
   unlock` only clears the lock — it never claims the item itself.

## Red flags

- hand-`rm`-ing or hand-editing `.fgos/main-checkout.lock` instead of
  running `fgos unlock`
- retrying `fgos unlock` in a tight loop against a live-held refusal instead
  of waiting or escalating to a person
- treating a live-held refusal as a bug in the lock itself, rather than the
  lock correctly blocking a real concurrent writer
