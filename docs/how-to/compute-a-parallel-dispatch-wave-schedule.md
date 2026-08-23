# How to compute a parallel dispatch wave schedule

Use this when you need to know how many ready work items can be dispatched
in parallel right now, grouped into waves that avoid two items in the same
wave fighting over the same declared file.

## Before you start

This is a different question from `fgos merge`'s own ordering logic
(`mergeReadiness`'s connected-component+order computation): merge only
needs to know *what order* items should land in; dispatch needs to know
*how many, right now, can run at the same time* without stepping on each
other's declared `footprint`. The two use separate algorithms on purpose
— `computeSchedule`/`detectCycles` (`src/state/graph-metrics.mjs`) never
reuse `mergeReadiness`'s logic, and vice versa.

## Steps

1. **Run the read-only verb:**

   ```
   fgos schedule --json
   ```

   Returns:

   ```json
   {
     "waves": [["tsk-a", "tsk-b"], ["tsk-c"]],
     "cycles": [["tsk-x", "tsk-y"]]
   }
   ```

2. **Read `waves`.** Each inner array is one wave — every id in it can be
   dispatched together right now with no footprint conflict between any
   pair in that same wave. Only the current `frontier` (ready-to-pick)
   items are considered; anything not ready doesn't appear at all.

   The algorithm: for each item still unscheduled, add it to the current
   wave unless its declared `footprint` overlaps
   (`footprintOverlapAmong`) with something already placed in that same
   wave; whatever doesn't fit gets deferred to the next wave. An item with
   no declared footprint never conflicts with anything, so it's always
   eligible for the earliest wave it can reach.

3. **Read `cycles`.** This is a separate check — real dependency cycles in
   the work graph's `deps` edges, found via Tarjan's strongly-connected-
   components algorithm over every item regardless of status (not just
   frontier candidates). A self-dependency (an item depending on itself)
   counts as a one-element cycle. A non-empty `cycles` array means the
   dependency graph itself is broken, independent of anything about
   footprints or waves — worth fixing before trusting `waves` at all,
   since `frontier`'s own readiness computation assumes an acyclic graph.

## Why this didn't reuse an existing algorithm

`mergeReadiness`'s connected-component+order logic already existed and
solves a superficially similar-sounding problem, but the two are
answering different questions: "what order should these land in" (merge)
versus "how many can run in parallel right now" (dispatch). Building a
separate, purpose-built Kahn-layering-style greedy wave-pack plus its own
Tarjan cycle check, rather than stretching the merge-side logic to also
answer the dispatch-side question, kept each algorithm honest about what
it actually proves.

## Update (tsk-3u2): `cycles` now also catches `parent`/`mergeAfter` cycles, not just `deps`

Step 3 above originally described `cycles` as scoped to `deps` edges
only. An independent code review after `tsk-3c7` merged found
`detectCycles` (`src/state/graph-metrics.mjs`) really was that narrow —
it built its own adjacency looking only at `deps`, missing a cycle formed
through `parent`/`mergeAfter` edges that `dep-graph.mjs`'s
`findUnifiedCycle` already knew how to detect. Fixed by reusing that
existing unified adjacency (which already folds `deps`, `parent`, and
`mergeAfter` into one graph) instead of re-implementing a narrower one
locally. `cycles` now reports a real cycle through any of those three
edge types, not `deps` alone — verified with a real command
(`node --test test/state/graph-metrics.test.mjs`), not just review.

## Real-world proof (`tsk-1sj`): computed waves actually run concurrently, not just on paper

`tsk-1sj` split into two children with deliberately disjoint footprints —
`tsk-30z` (`src/util/format-duration.mjs`) and `tsk-50ic`
(`src/util/format-bytes.mjs`), no file shared between them — specifically
to test whether a computed wave (no footprint overlap, so both eligible
for the same wave per step 2 above) results in genuinely concurrent
execution, not just an advisory schedule nobody actually dispatches in
parallel. Dispatched via 2 concurrent Agent subagents, each running
`/fgOS:pick` + `fgos-coding-implement` independently.

Measured directly from `.fgos/events.jsonl`, not simulated: `tsk-30z`/
`tsk-50ic` claims landed 2s apart, returns landed 5s apart, with ~184s of
genuinely overlapping `doing` status between them — hard evidence the two
items were worked at the same time, not sequentially.

**A real, separate finding surfaced along the way**: `fgos-runner`'s own
automated wave dispatch (the `Promise.allSettled` fan-out that would
consume `computeSchedule`'s waves automatically) has zero real
`executor.dispatch` events in this repo's history — the demo's actual
parallelism came from manually spawning 2 Agent subagents against the
computed wave, not from `fgos-runner` itself executing it. `fgos-runner`'s
automated consumption of a computed wave remains unexercised in
practice, deferred to a later item.

This evidence is deliberately kept live rather than cleaned up as demo
cruft: `docs/history/parallel-dispatch-demo-format-utils/` and the
`tsk-1sj`/`tsk-30z`/`tsk-50ic` items themselves are the reproducible,
citable proof that `computeSchedule`'s waves (step 2 above) mean real
concurrency when actually dispatched, not just a plausible-looking JSON
array.

The same review also found `fgos schedule` itself missing from
`bin/fgos.mjs`'s `STORE_MISSING_WARNING_VERBS` set — the "eight read
verbs" `docs/how-to/run-a-state-verb-from-inside-a-worktree.md` describes
that warn (rather than silently returning an empty view) when run bare
from inside a linked worktree with no `.fgos/` of its own. Before this
fix, `fgos schedule` run from a worktree returned a silent, empty
false-clear `{waves: [], cycles: []}` instead of the same ADR0020 warning
`conflicts`/`ready` already print — indistinguishable from "nothing is
ready to dispatch" when the real cause was "this command can't see the
real store from here." Fixed by adding `schedule` to that set; the same
`--dir <mainRoot>` fix that doc already describes for the other read
verbs applies here too.
