---
name: fgos-lock-fence
user-invocable: false
description: >-
  Recover from a registry lock a wedged process keeps, when fgos take/fgos
  pick/fgos approve fail with "lock-held" (exit 7) and the holder is not making
  progress. Use when a claim or merge is refused because another process
  holds the main checkout, a merge slot or the worktree-admin lock for
  longer than its work explains. Examples: "take failed with lock held",
  "claim refused: main checkout locked", "approve waits on a merge slot
  forever".
---

# fgos-lock-fence

A narrow recovery procedure, not a stage skill (contrast `fgos-routing`,
which orients on an item's `stage`). It triggers on one CLI failure:
`fgos take`/`pick`/`approve`/`sync-root` ending with `lock-held` (exit code 7,
category `lock-timeout`), whose message names the lock and the holder pid:
`main checkout (claim) is held by another process (pid 4242)`.

## What a held lock means

Every repo lock is a kernel lock on an open file of the holder. There is no
TTL, no heartbeat and no stale record: a holder that dies releases the lock
by dying. So a held lock always has a live holder, and the answer is almost
always to wait: `take`, `pick` and `approve` already wait up to a minute by
default (`--wait <ms>` raises it, `--no-wait` is one try).

## Hard rule

Never delete or edit the lock file (`.fgos/locks/*.lock`), never `kill` a
holder by hand. Removing the file does not release anything — the holder keeps
its lock on the old file while a contender locks the new one, which is exactly
the double-writer race the lock exists to prevent. The only sanctioned way to
stop a holder is `fgos lock fence`, which lists the holders, signals them by
identity (pid plus start time, never a recycled pid), and asks the kernel
whether the lock is free afterwards.

## Flow

1. Read the refusal. It names the lock (`main checkout`, `merge slot of
   "main"`, `worktree admin`) and the holder pid.
2. Look before you fence: `fgos lock-status` lists every repo and machine lock
   as `free` or `held` with the holder pids. Check what the holder is
   (`ps -o pid,etime,args -p <pid>`). A holder that is a real `fgos approve`,
   `claim` or `git` run that started minutes ago is working: wait and retry.
3. Fence only a holder that is wedged: a process that has held the lock far
   longer than its operation takes, with no CPU and no child. Run (the `name`
   is the registry name; a lock with a path parameter takes `--param`):
   ```bash
   fgos lock fence main-checkout
   fgos lock fence merge-slot --param ref=main
   ```
   Without a terminal the verb lists the holders and signals nothing; pass
   `--yes` only after you decided in step 3 that these holders are wedged.
4. Read the result:
   - `{ status: "free" }` — nobody held it; retry the original command.
   - `{ status: "fenced", terminated, killed }` — the holders ended (SIGTERM,
     then SIGKILL after 5 s) and the lock is free. Retry the original command.
   - `lock-fence-self` — the holder is this process or a parent of it; it is
     not fenced.
   - `lock-fence-unlistable` — this platform cannot list holders. Stop the
     holder yourself, then `fgos lock fence <name> --attest-stopped` only
     re-checks the lock; it never takes it from a live holder.
   - `lock-fence-still-held` — the holder survived SIGKILL (another user's
     process, or a process stuck in the kernel). Hand this to a person.
5. Retry the `take`/`pick`/`approve` that failed. `fence` never claims or
   merges anything itself.

## Red flags

- `rm`-ing a `.fgos/locks/*.lock` file, or `kill -9` on a holder pid
- `--yes` on a holder you did not look at
- fencing a holder that is a live `approve` or `claim` doing real work
- retrying `fence` in a loop against `lock-fence-still-held`
