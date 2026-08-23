---
name: cleanup-next
description: >-
  Use when the user wants the single next TTL-ready fgOS work item at
  status:cleanup cleaned up now — invoked as /fgOS:cleanup-next. Picks the
  item via pickNextCleanupItem (src/state/cleanup-pool.mjs, FIFO by
  cleanup-entry time, pre-filtered so only TTL-elapsed items are ever
  passed to the verb) and runs the existing fgos cleanup <id> verb on it,
  reporting the outcome. Example: "/fgOS:cleanup-next", "clean up the next
  ready item".
---

# fgOS cleanup-next

Wraps `pickNextCleanupItem` (`src/state/cleanup-pool.mjs`) plus the
existing `fgos cleanup <id>` verb so a person (or a `/fgOS:cleanup-loop`
iteration) can process the single next TTL-ready `status:cleanup` item
without hand-typing the CLI or re-deriving the pick order every time.
Never writes `.fgos/` state directly, and never re-implements `cleanup`
mechanics itself — `fgos cleanup <id>` and its harness
(`assessCleanupReadiness`, `src/state/cleanup-harness.mjs`) stay exactly
as they are (`docs/history/fgos-cleanup-loop/CONTEXT.md`'s own scope
boundary).

## Steps

1. **Ignore `$ARGUMENTS`.** This command takes no arguments — it always
   picks the single next TTL-ready item from the pool, the same way
   `/fgOS:discover-next` always picks the single next discovery/exploring
   item. Do not pass an id or let the user pick one for this command; that
   is what running `fgos cleanup <id>` directly is for.

2. **Pick the next item.** Resolve the main checkout root (every verb
   below is `requiresExistingStore: true`, same as every other fgOS skill)
   and run:

   ```bash
   root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
   node -e "
   Promise.all([
     import('./src/state/store.mjs'),
     import('./src/state/cleanup-pool.mjs'),
     import('./src/config/shared-config-file.mjs'),
     import('./src/setup/registrations.mjs'),
   ]).then(([{ listWork, readRawEvents }, { pickNextCleanupItem }, { readSharedConfig }, { DEFAULT_CLEANUP_TTL_DAYS, DEFAULT_CLEANUP_LEAF_TTL_DAYS }]) => {
     const repoRoot = process.argv[1];
     const fgosDir = repoRoot + '/.fgos';
     const view = listWork(fgosDir);
     const rawEvents = readRawEvents(fgosDir);
     const sharedConfig = readSharedConfig(repoRoot);
     const ttlDays = sharedConfig?.cleanup?.ttlDays ?? DEFAULT_CLEANUP_TTL_DAYS;
     const leafTtlDays = sharedConfig?.cleanup?.leafTtlDays ?? DEFAULT_CLEANUP_LEAF_TTL_DAYS;
     console.log(JSON.stringify(pickNextCleanupItem(view, rawEvents, { ttlDays, leafTtlDays })));
   });
   " -- "$root"
   ```

   run with `cwd` at `${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}`
   — always that literal substitution, never a relative path, since an
   installed plugin's files run from a copied cache location, not from
   this repo checkout. `ttlDays`/`leafTtlDays` are read the exact same way
   `bin/fgos.mjs`'s own `case 'cleanup'` reads them
   (`sharedConfig?.cleanup?.ttlDays ?? DEFAULT_CLEANUP_TTL_DAYS`,
   `sharedConfig?.cleanup?.leafTtlDays ?? DEFAULT_CLEANUP_LEAF_TTL_DAYS`,
   tsk-59x D2) so the picker's TTL window always matches what the verb
   itself is about to check — never a second, drifting source of truth for
   the same numbers.

3. **Pool empty — stop.** If the command printed `null`, report "pool
   empty — nothing to clean up" and stop. This is `/fgOS:cleanup-loop`'s
   own pool-empty stop signal; nothing else to do here.

4. **Run the verb.** Otherwise the output is `{"id": "<id>"}`. Run:

   See `../_shared/fgos-cli-fallback.md`, substituting `<verb-cmd>` with:

   ```
   cleanup <id> --dir "$root"
   ```

   substituting `<id>` from step 2's output. Capture both the command's
   stdout and its real process exit code (never just its stdout) — the
   exit code is what step 5 classifies on.

5. **Classify and report the result.** This verb runs as a real CLI
   subprocess, not a JS import — there is no JS `Error` object to inspect
   here, only the process's own exit code and JSON stdout (success) or
   plain-text stderr (failure). Classify by exit code, per the CLI's own
   contract (`EXIT_CODES`, `src/state/store.mjs:65-73`).

   The exit-code classification stays: this launcher runs a real subprocess
   — unlike `/fgOS:retro-next`, which invokes a skill in-session where no
   exit code exists and therefore reads its outcome off the driver's own
   relayed stop line instead. Do not "fix" this branch into a driver call.
   `cleanup` deliberately registers no skill in `skillMap` (decision record
   `0027` D5: "pure harness, no skill ever loads for it"), so a driver
   invoked here would resolve nothing and stop immediately — ceremony with
   no value. Adding a verb map so the driver could run `fgos cleanup`
   itself would add a mechanism, which is the opposite of what routing
   launchers through the driver is for (`docs/history/
   retro-next-shared-driving/CONTEXT.md` D4).

   Classify as:

   - **exit `0`** — success. Read the JSON envelope's `data.to` field:
     `'done'` — the item's worktree/branch was reclaimed and it closed to
     `done`; report that plainly. `'blocked'` — the picker already
     guaranteed TTL had elapsed, so this means one of the harness's other
     two checks failed (`data.reason` names which: retrospective content
     missing, or the merge no longer resolves on main) — report the id and
     `data.reason`; the item stays visibly parked `blocked` for a person
     to look at.
   - **exit `7`** (`'lock-timeout'`) — a genuine systemic condition:
     another process is holding `.fgos/events.lock` past its timeout.
     Report it carrying the shared marker line verbatim, on its own line:

     ```text
     stop-reason: lock-timeout
     ```

     the same channel `fgos-coding-driving` and every other launcher use
     for this one category (tsk-1c6 D2/D4), so a caller never has to infer
     it from prose. This is the one result `/fgOS:cleanup-loop` stops the
     whole loop on rather than skipping a single item — `.fgos/events.jsonl`'s
     lock is shared by every item, so the next pick would very likely hit
     the same stuck lock. Never emit the line for a failure that was not
     actually a lock-timeout.
   - **exit `3`** (`'conflict'`, a per-item CAS race) or any other non-zero
     exit — scoped to this one item (a different concurrent writer raced
     this specific id, or some other one-off failure). Report it as
     skipped; this never means a different item is at risk.
