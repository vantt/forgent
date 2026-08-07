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
