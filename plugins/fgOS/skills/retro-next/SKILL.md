---
name: retro-next
description: >-
  Use when the user wants the single next status:retrospective fgOS work
  item synthesized now — invoked as /fgOS:retro-next. First sweeps every
  delivered item to retrospective (fgos retrospective — cheap, mechanical,
  idempotent), then picks via pickNextRetrospectiveItem
  (src/state/retro-pool.mjs, FIFO by delivered->retrospective entry time),
  resolves the item's own domain's synthesis skill (decision record 0027
  D5 — fgos-compounding for coding today, never hardcoded) and runs it
  (settlement/decision/enduser-docs), and on success moves it to cleanup.
  Example: "/fgOS:retro-next", "synthesize the next retrospective item".
---

# fgOS retro-next

Wraps the `fgos retrospective` sweep, `pickNextRetrospectiveItem`
(`src/state/retro-pool.mjs`), the item's own domain-resolved synthesis
skill (decision record 0027 D5 — `fgos-compounding` for `coding` today),
and `fgos move <id> --to cleanup` so a person (or a `/fgOS:retro-loop`
iteration) can process the single next `status:retrospective` item
end to end without hand-typing each step or re-deriving the pick order
every time. Never writes `.fgos/` state directly beyond what the
resolved synthesis skill itself already does through its own producer
surface (`fgos compound`), and never re-implements that skill's synthesis
— this skill only sequences the existing pieces
(`docs/history/fgos-retro-loop/CONTEXT.md`'s own scope boundary).

## Steps

1. **Ignore `$ARGUMENTS`.** This command takes no arguments — it always
   sweeps and picks the single next item from the pool, the same way
   `/fgOS:cleanup-next` and `/fgOS:discover-next` always pick their own
   single next item.

2. **Sweep, then pick the next item.** Resolve the main checkout root
   (every verb below is `requiresExistingStore: true`, same as every other
   fgOS skill) and run the sweep first — cheap and idempotent
   (`docs/history/fgos-retro-loop/CONTEXT.md` D1: each item's own
   `delivered -> retrospective` move is its own durably-committed event,
   so calling this every iteration is safe even mid-interruption):

   ```bash
   root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
   node "$root/bin/fgos.mjs" retrospective --dir "$root"
   ```

   Then pick:

   ```bash
   node -e "
   Promise.all([
     import('./src/state/store.mjs'),
     import('./src/state/retro-pool.mjs'),
   ]).then(([{ listWork, readRawEvents }, { pickNextRetrospectiveItem }]) => {
     const repoRoot = process.argv[1];
     const fgosDir = repoRoot + '/.fgos';
     const view = listWork(fgosDir);
     const rawEvents = readRawEvents(fgosDir);
     console.log(JSON.stringify(pickNextRetrospectiveItem(view, rawEvents)));
   });
   " -- "$root"
   ```

   run with `cwd` at `${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}`
   — always that literal substitution, never a relative path, since an
   installed plugin's files run from a copied cache location, not from
   this repo checkout.

3. **Pool empty — stop.** If the picker printed `null`, report "pool
   empty — nothing to synthesize" and stop. This is `/fgOS:retro-loop`'s
   own pool-empty stop signal; nothing else to do here.

4. **Resolve the item's synthesis skill, then run it.** Otherwise the
   output is `{"id": "<id>"}`. Read the item's own `domain` field (`fgos
   list --id <id> --json`, or the `view.work[id].domain` the pick step
   already had in hand) and resolve which skill runs synthesis for it —
   never assume `fgos-compounding` unconditionally (decision record 0027
   D5: `retrospective` is a per-domain skillMap entry now, same lookup
   `fgos-routing`'s own `skillForStage` uses for `stage`, just keyed by
   the status `retrospective` instead of a stage name):

   ```bash
   node -e "
   import('./src/state/workflow-stage-graphs.mjs').then(({ getDomain, skillForStage }) => {
     console.log(skillForStage(getDomain(process.argv[1]), 'retrospective') ?? 'fgos-compounding');
   });
   " -- "$domain"
   ```

   substituting `<id>`'s own `domain` value (absent/unrecognized folds to
   `coding` automatically, `getDomain`'s own fail-safe). The explicit
   `?? 'fgos-compounding'` fallback mirrors `skillForStage`'s null-safe
   shape one level up: a domain that declares no `retrospective` entry at
   all still gets a real skill to run, never a missing-skill dead end.
   For `coding` today this always resolves to `fgos-compounding` — zero
   behavior change from before this lookup existed.

   Then invoke the resolved skill directly (in this same session, not a
   fresh dispatch) with `<id>` as its argument — `fgos-compounding`'s own
   flow (the resolution for every domain today) gathers the real capture
   (`fgos check <id>`), classifies the Diataxis quadrant, stores the tag
   via `fgos compound <id> --doc-type <quadrant> --doc-path <path>`, and
   grows-or-creates the end-user document. Trust the resolved skill's own
   hard rules and red flags exactly as written there — this skill never
   second-guesses the classification or the document it produces.

5. **On synthesis success, move to cleanup.** Once the resolved skill
   confirms the tag is stored and the document exists (`fgos-compounding`'s
   own step 5, for the resolution every domain uses today), run:

   ```
   # fgos CLI fallback (tsk-1no D3)
   FGOS_BIN="${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}/bin/fgos.mjs"
   if [ -f "$FGOS_BIN" ]; then
     node "$FGOS_BIN" move <id> --to cleanup --dir "$root"
   elif command -v fgos >/dev/null 2>&1; then
     fgos move <id> --to cleanup --dir "$root"
   else
     echo "fgos: no bin/fgos.mjs at ${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX} (not a forgent checkout) and no global fgos install on PATH" >&2
     exit 1
   fi
   ```

   substituting `<id>` from step 2's output. Capture both the command's
   stdout and its real process exit code.

6. **Classify and report the result.** `move` runs as a real CLI
   subprocess — classify by exit code, per the CLI's own contract
   (`EXIT_CODES`, `src/state/store.mjs:65-73`):

   - **exit `0`** — success. Report the item moved to `cleanup`, ready
     for `fgos cleanup <id>` (or `/fgOS:cleanup-loop`) to finish later,
     TTL permitting.
   - **exit `7`** (`'lock-timeout'`) — a genuine systemic condition:
     another process is holding `.fgos/events.lock` past its timeout.
     Report this plainly and distinctly from every other outcome — this is
     the one result `/fgOS:retro-loop` stops the whole loop on, never just
     skips.
   - **exit `3`** (`'conflict'`, a per-item CAS race) or any other
     non-zero exit — scoped to this one item. Report it as skipped; this
     never means a different item is at risk.
   - **the resolved synthesis skill itself fails to complete**
     (`fgos-compounding` for `coding` today — step 4 gets stuck, the tag or
     the document ends up missing per its own step 5 confirmation) — this
     is a real-session failure, not a clean `cleanup`-harness "blocked"
     verdict the way `fgos cleanup <id>` produces one. Report the item
     skipped with the concrete reason the resolved skill surfaced; never
     run `move --to cleanup` on an item whose synthesis did not actually
     confirm complete, and never treat this as a loop-stopping condition
     on its own (only lock-timeout does that).

7. **Optional: rename the herdr pane.** Before step 4, if the `id` is
   already known, calling `/fgOS:terminal <id>` for observability is a
   nice-to-have, never required — it always exits `0` and does nothing
   when the session isn't inside a herdr-managed pane. Skip it entirely if
   it adds friction; the core shape above works identically without it.
