---
framework: diataxis
mode: how-to
---
# How to process the next clarify/decompose item with `/fgOS:discover-next`

Use this when you want the single next `stage:clarify` or
`stage:decompose` backlog item processed now, without hand-typing the CLI
or re-deriving the pick order yourself — invoked as `/fgOS:discover-next`
(`tsk-3go-2`). It wraps `pickNextDiscoverItem`
(`src/state/discover-pool.mjs`) plus the existing `fgos discover`/
`fgos plan` verbs. It never writes `.fgos/` state directly, and never
re-implements `discover`/`decompose` mechanics — both verbs stay exactly
as they are. Takes no arguments — always picks the single next item, the
same way `/fgOS:merge-next` always picks the single top-ranked
ready-to-merge item.

## Step 1 — pick the next item

Resolve the main checkout root and run:

```bash
root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
node -e "
Promise.all([import('./src/state/store.mjs'), import('./src/state/discover-pool.mjs')]).then(([{ listWork }, { pickNextDiscoverItem }]) => {
  const view = listWork(process.argv[1] + '/.fgos');
  console.log(JSON.stringify(pickNextDiscoverItem(view)));
});
" -- "$root"
```

If the command prints `null`, the pool is empty — report "pool empty —
nothing to discover" and stop.

## Step 2 — run the matching verb

Otherwise the output is `{"id": "<id>", "stage": "clarify"|"decompose"}`.
Run:

```
node "$root/bin/fgos.mjs" discover <id> --dir "$root"
```

when `stage` is `clarify`, or the same with `decompose <id>` when `stage`
is `decompose`. Capture both the command's stdout and its real process
exit code — the exit code is what step 3 classifies on. These verbs run
as a real CLI subprocess, not a JS import — there is no JS `Error` object
to inspect here, only the process's own exit code and JSON stdout
(success) or plain-text stderr (failure).

## Step 3 — classify the result by exit code

Per the CLI's own contract (`EXIT_CODES`, `src/state/store.mjs:65-73`):

- **exit `0`** — success. Read the JSON envelope's `data.outcome` field:
  `'clear'`/`'pass-through'`/`'decompose'` means the item cleared or
  decomposed (for `'decompose'`, name the child ids from
  `data.childIds`). `'unclear'`/`'need-human'` means the item parked
  `awaiting-human` with its question (`data.verdict.question`) — this is
  normal, not a problem; a person needs to
  `fgos answer <id> --text "..."` before it can be picked again.
- **exit `7`** (`'lock-timeout'`) — a genuine systemic condition: another
  process is holding `.fgos/events.lock` past its timeout. Report this
  plainly and distinctly — this is the one result
  `/fgOS:discover-loop` stops the whole loop on, never just skips.
- **exit `3`** (`'conflict'`, a per-item CAS race) or any other non-zero
  exit — scoped to this one item (a different concurrent writer raced
  this specific id, or some other one-off failure). Report it as
  skipped; this never means a different item is at risk.

## Optional — rename the herdr pane

Before step 2, if the `id` and `stage` are already known, calling
`/fgOS:terminal <id>` for observability is a nice-to-have, never
required — it always exits `0` and does nothing when the session isn't
inside a herdr-managed pane. Skip it entirely if it adds friction; the
core shape above works identically without it.
