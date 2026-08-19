# Wave dispatch mechanics

The exact step-by-step behind `fgos-fanout`'s Workflow section in
SKILL.md, including the slot-poll loop, batch trimming, and the
consolidated dispatch sequence. This runs once per iteration; each
iteration starts back at Step 1, until `openCandidates` is empty.

Track one thing across the whole invocation (not just one iteration):
`dispatchUnavailable`, the set of ids reported once for a non-`in-process`
decide result. Without this, a candidate whose resolved executor never
expects native dispatch would stay `todo` forever (it is never claimed),
re-enter the ready set every iteration, get re-consulted and re-reported
every time, and the outer loop would never terminate — this set is what
makes "report once" actually mean once.

## Step 1: Compute the open candidate set

```bash
root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
node "$root/bin/fgos.mjs" list --json --dir "$root"
```

`openCandidates` = every id in `candidateIds` whose status is NOT one of
`delivered`/`retrospective`/`cleanup`/`done`/`wontfix`, AND not already in
`dispatchUnavailable`.

If `openCandidates` is empty: stop. Report every terminal id and its
final status back to the caller, INCLUDING every id in
`dispatchUnavailable` (still `todo` in real state — reported, not
delivered, so say so plainly, not as if it reached a terminal status).

## Step 2: Schedule the earliest wave

```bash
root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
node "$root/bin/fgos.mjs" schedule --candidates "<openCandidates-comma-separated>" --dir "$root"
```

`scheduled` = first wave of `fgos schedule --candidates` — the earliest wave over just this candidate set, never the whole frontier.

`ready = scheduled` candidates that also pass the pre-check: frontier
membership AND every dep already resolved. This pre-check is advisory
only — it never substitutes for the real claim in Step 3.

## Step 3: Fire batches of up to 5 via fanout-batch

For each batch of up to 5 ids from `ready` (5 is the max batch size):

Run the consolidated `fanout-batch` verb:

```bash
root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
node "$root/src/runner/dispatch.mjs" fanout-batch "<batch-comma-separated>" --has-live-task-access --dir "$root"
```

This single call checks worker-slot capacity, trims the batch if needed, re-confirms each candidate's mechanism, and executes out-of-process candidates through the full `pick` -> `execute` -> `return` loop.

- If `slotsFull: true`: the lane is full — wait ~60s and retry. After 10 consecutive refusals (~10 min), STOP and hand back to the caller.
- `fired`: array of out-of-process candidates that were picked, executed out-of-process, and returned.
- `mechanismChanged`: candidates whose mechanism resolved to `in-process`. Add to `firing` for native Agent dispatch in Step 4.
- `unavailable`: candidates with no registered executor. Report back as needing a person and add to `dispatchUnavailable`.
- `deferred`: candidates deferred due to slot trimming. Retain in `ready` for the next batch.

## Step 4: Dispatch native Agents and wait

Dispatch one Agent per id in `firing` (from `mechanismChanged` or initial in-process resolution), single message, running in parallel — each Agent's job is exactly `/fgOS:pick <id>` through to that item's own natural stop. Wait for the whole `firing` set to settle before reading state again. Skip this wait entirely when `firing` is empty.

## Step 5: Gather and approve

Re-read state fresh:

```bash
root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
node "$root/bin/fgos.mjs" list --json --dir "$root"
```

For each id in this iteration's dispatched set now `awaiting-approval`,
in the `merge` verb's own ranking order (never an invented priority):

- If its title/description trips the risk-keyword floor: report it back
  as needing a person; do not approve it.
- Otherwise:

  ```bash
  root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
  node "$root/bin/fgos.mjs" approve "<id>" --dir "$root"
  ```

For each id now `blocked`: report it; take no further action on it — the
deps-not-merged guard already keeps its dependents from firing. A blocked
leaf is a real stop for that leaf only, never a cascade — independent
siblings keep running to completion regardless.

## Step 6: Loop

Go back to Step 1.
