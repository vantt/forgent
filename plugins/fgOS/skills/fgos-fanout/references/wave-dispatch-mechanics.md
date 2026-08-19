# Wave dispatch mechanics

The exact step-by-step behind `fgos-fanout`'s Workflow section in
SKILL.md, including the slot-poll loop, batch trimming, and the
per-candidate dispatch sequence. This runs once per iteration; each
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

`scheduled = computeSchedule(view, openCandidates).waves[0]` — the
earliest wave over just this candidate set, never the whole frontier.

`ready = scheduled` candidates that also pass the pre-check: frontier
membership AND every dep already resolved. This pre-check is advisory
only — it never substitutes for the real claim in Step 3.

## Step 3: Fire batches of up to 5, slot-gated

For each batch of up to 5 ids from `ready` (5 is the max batch size):

1. Read slots fresh:

   ```bash
   root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
   node "$root/bin/fgos.mjs" slots --json --dir "$root"
   ```

2. While `slots.execution.hasRoom` is `false`: the engine is the
   authority and refusal is final — never work around it, never fire
   "just one to be sure". Report to the caller that the lane is full,
   naming the ids in `slots.execution.items` holding it, then wait ~60s
   and re-read `fgos slots --json`. After 10 consecutive refusals (~10
   min), STOP and hand back to the caller: a lane that never frees is an
   incident (an abandoned claim a person must clear with
   `/fgOS:stale`), not a queue to keep polling. Report the holding ids so
   the caller can act.

3. Trim, do not fire whole: the engine admits at most `execution.free`.
   A `null` `execution.free` is the unarmed default (`reason:
   "no-ceiling-configured"`), not a full lane — no ceiling exists to trim
   against, so the whole batch fires. Never confuse absent with zero free
   slots.

   - `execution.free` is `null`: `batch` = the first `batch.length` ids
     (i.e. all of them, already capped at 5).
   - `execution.free` is a real number: `batch` = the first
     `min(batch.length, execution.free)` ids.

   Any id trimmed off stays in `ready` for the next batch — it is
   deferred, never dropped and never reported as failed.

4. `firing = []` — ids this batch actually fires an Agent for. For each
   id in `batch`, serially (this is the same per-candidate step the
   pre-check already ran in — never a separate synchronous pass over the
   whole batch, which would risk turning the parallel fire step
   sequential):

   ```bash
   root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
   node "$root/src/runner/dispatch.mjs" decide --work "<id>" --has-live-task-access --dir "$root"
   ```

   - If `decided.mechanism` is `"out-of-process"`: it fires out-of-process directly via CLI subprocess execution without requiring a person. Print its announce line (`<id> - out-of-process - <executorId>`). Claim the candidate via CLI, read the worktree path from the claim's JSON output, and execute the worker out-of-process concurrently for the batch's out-of-process subset via bash job control (`( ... ) &` and `wait`):
     ```bash
     root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
     claimJson=$(node "$root/bin/fgos.mjs" pick "<id>" --json --dir "$root")
     worktreePath=$(node -e 'console.log(JSON.parse(process.argv[1]).worktreePath)' "$claimJson")
     node "$root/src/runner/dispatch.mjs" execute "<executorId>" --cwd "$worktreePath" --has-live-task-access && node "$root/bin/fgos.mjs" return "<id>" --dir "$root"
     ```
   - If `decided.mechanism` is `"unavailable"`: report `id` back to the caller as needing a person (no executor registered for this work item). Add `id` to `dispatchUnavailable` so it is never rescheduled or re-consulted again this run. Do not add it to `firing`. Continue to the next id.
   - Otherwise (`mechanism === "in-process"`): print its announce line
     (`<id> - native - <subagent_type> - <model>`), `<subagent_type>`
     from `decided.agentType` when present, else whatever Agent type this
     skill already uses by default to fire `/fgOS:pick`. Add `id` to
     `firing`.

5. Dispatch one Agent per id in `firing`, single message, running in
   parallel — each Agent's job is exactly `/fgOS:pick <id>` through to
   that item's own natural stop. Wait for the whole `firing` set to
   settle before reading state again. Skip this wait entirely when
   `firing` is empty (every candidate in the batch was reported instead).

## Step 4: Gather and approve

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

## Step 5: Loop

Go back to Step 1.
