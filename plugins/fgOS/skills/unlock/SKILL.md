---
name: unlock
description: >-
  Use when the user wants to clear a stuck .fgos/main-checkout.lock — most
  often right after fgos take/fgos pick fails with a "lock-held" or
  "lock-ambiguous" error (exit 7) — from inside a Claude Code session,
  invoked as /fgOS:unlock. Never force-deletes: refuses and reports the
  holder identity when a different session genuinely still holds the lock
  live. Clears through fgOS's own unlock verb (one-door-write), never
  writing .fgos/ state directly. Examples: "/fgOS:unlock", "take failed
  with lock held, clear it", "main checkout lock stuck".
---

# fgOS unlock

Wraps `fgos unlock` so a person working inside Claude Code can clear a
stuck main-checkout lock without hand-typing the CLI and, above all,
without hand-deleting `.fgos/main-checkout.lock` directly. Never writes
`.fgos/` state directly — every write goes through the `unlock` verb
(one-door-write, CTR001), which already encodes the same staleness/
liveness judgment `acquireMainCheckoutLock`
(`src/runner/main-checkout-lock.mjs`) uses everywhere else in fgOS.

## Steps

1. **Ignore `$ARGUMENTS`.** `unlock` takes no arguments — there is nothing
   to parse or pass through.

2. **Clear the lock.** Run:

   See `../_shared/fgos-cli-fallback.md`, substituting `<verb-cmd>` with:

   ```
   unlock --dir "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"
   ```

   `--dir` (tsk-56t): the `take`/`pick` that just failed may have been a
   tsk-424 chained pick from inside an existing linked worktree, which
   never carries its own `.fgos/` by design (ADR0020) —
   `${CLAUDE_PROJECT_DIR}` still resolves to the main checkout even from
   inside that worktree (it survives an `EnterWorktree` switch), so
   passing it as `--dir` here targets the one real lock/store explicitly.

3. **Read the result.**
   - Success (`{ cleared: true, reason: "stale-or-free" | "reclaimed" }`) —
     the lock was free, held by a dead/expired holder, or corrupt, and is
     now cleared. Tell the user, and suggest retrying whatever `take`/
     `pick` originally failed.
   - Failure, exit 7, `unlock: main checkout lock is held by a live
     session (<id>) -- refusing to clear it.` — this is **not** a bug and
     not a stuck lock; a different session genuinely holds it right now,
     within its own TTL window. Show the real error to the user and stop —
     do not retry in a tight loop hoping it changes on its own, and do not
     fall back to hand-deleting the lock file to force past this refusal.
     If the user is certain the other session is actually done and wants
     to proceed anyway, say plainly that this verb has no force-override
     by design (the whole point is never trusting an unverifiable claim
     over the lock's own liveness/TTL judgment) and wait for them to
     decide how to proceed, rather than improvising a workaround yourself.

4. **Report and stop.** Do not chain into `take`/`pick` automatically —
   relay the result and let the user (or their next explicit command)
   decide what to claim next.
