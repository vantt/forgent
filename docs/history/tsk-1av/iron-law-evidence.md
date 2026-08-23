# tsk-1av — Iron Law evidence

`classifyIronLaw` returns `required: true` against the real committed diff
for `fgw/tsk-1av`, so this file records the failing-first / passing-after
proof for the change.

## Classification (real committed diff, not a prediction)

Computed the way the merge gate itself computes it — `changedFiles(root,
item)` (`src/runner/merge.mjs`, `trunk...branch`, committed history only)
fed straight into `classifyIronLaw` (`src/evolve/iron-law.mjs`):

```json
{
 "filesChanged": [
  "docs/history/tsk-5vs/iron-law-evidence.md",
  "docs/history/work-item-backlog-status/plan.md",
  "src/state/discover-pool.mjs",
  "src/state/status-fsm.mjs",
  "src/state/work.mjs",
  "src/state/workflow-stage-graphs.mjs",
  "test/e2e/fixture-marketing-domain.test.mjs",
  "test/state/discover-pool.test.mjs",
  "test/state/frontier.test.mjs",
  "test/state/fsm.test.mjs"
 ],
 "verdict": {
  "required": true,
  "matchedFlags": [],
  "matchedModules": [
   "src/state/status-fsm.mjs",
   "src/state/workflow-stage-graphs.mjs"
  ]
 }
}
```

**One honest qualification about what tripped the gate.** Neither matched
module is a file this item touched. `changedFiles` diffs against `trunk`
(`main`), and `fgw/tsk-1av` forked from the tip of `fgw/tsk-5vs`, so
sibling `tsk-5vs`'s already-merged schema commits (`status-fsm.mjs`,
`work.mjs`, `workflow-stage-graphs.mjs`, and their tests) are still part of
this branch's diff against `main` and are what matched. This item's own
footprint is exactly two files:

- `src/state/discover-pool.mjs`
- `test/state/discover-pool.test.mjs`

The gate fired on the aggregate, and the evidence below is for this item's
own change. `tsk-5vs`'s own proof lives in
`docs/history/tsk-5vs/iron-law-evidence.md`, already committed on the same
branch.

## The change

`isCandidate` (`src/state/discover-pool.mjs`) gated on a literal
`item.status === 'todo'`, so an item at the new `backlog` status could never
be picked for a discover loop. It now matches against
`CANDIDATE_STATUSES = new Set(['todo', 'backlog'])`.

The widening is confined to this pool, which has been clarify-shaped stages
only since `tsk-lya` D10/D11 moved the `decompose`/`planning` pool into
`plan-pool.mjs`. That module keeps its own strict `status === 'todo'` check
(`src/state/plan-pool.mjs:23-29`) and is outside this item's footprint, so a
not-yet-committed idea still cannot reach the pool that feeds real dispatch
— which is what `plan.md` Piece 3 means by "the decompose-stage candidate
stays `todo`-only, unchanged."

Decisions honored: `docs/history/work-item-backlog-status/CONTEXT.md` D3
(`backlog` carries its own `statusCategory`, so no domain-agnostic consumer
mistakes it for ready work), `plan.md` Piece 3.

## Failing first

Command (the item's own test file, run against the pre-change source
restored via `git checkout HEAD~1 -- src/state/discover-pool.mjs`, with the
new tests already in place):

```
node --test test/state/discover-pool.test.mjs
```

Real output (excerpt):

```
✔ a stage:decompose item is never picked here, even as the only candidate (0.083544ms)
✔ a stage:discovery item is picked into the clarify-shaped pool, with its own real stage returned (0.172137ms)
✔ a stage:exploring item is picked into the clarify-shaped pool, with its own real stage returned (0.104099ms)
✔ a stage:exploring candidate is picked regardless of a stage:decompose item present (0.10981ms)
✖ a stage:exploring item with status:backlog IS a candidate (0.807432ms)
✖ a stage:discovery item with status:backlog IS a candidate (0.186236ms)
✔ a stage:planning item with status:backlog is NOT a candidate here (0.061658ms)
✔ a stage:decompose item with status:backlog is NOT a candidate here (0.045877ms)
✔ a discoverable-stage item at a status other than todo/backlog is still never picked (0.057924ms)
ℹ tests 25
ℹ pass 23
ℹ fail 2
✖ failing tests:
✖ a stage:exploring item with status:backlog IS a candidate (0.807432ms)
✖ a stage:discovery item with status:backlog IS a candidate (0.186236ms)
```

**Which of the five new assertions are change-detectors, and which are
regression guards.** Only the two that fail above are change-detectors —
they are red on the old source and green on the new one, and they are the
behavior this item exists to add. The other three pass in BOTH states by
design and are regression guards, not proof of the change:

- `a stage:planning item with status:backlog is NOT a candidate here`
- `a stage:decompose item with status:backlog is NOT a candidate here`
- `a discoverable-stage item at a status other than todo/backlog is still
  never picked`

They exist because the risk map's own medium-risk row for this piece is
"getting the split condition backwards would let a not-yet-committed idea
leak into real dispatch." A guard that would have caught a wrong widening
is worth keeping even though the correct implementation never made it red.

## Passing after

Command (the item's recorded `verify`, run over this worktree's full suite):

```
node --test 'test/**/*.test.mjs'
```

Real output (tail):

```
ℹ tests 3146
ℹ suites 0
ℹ pass 3141
ℹ fail 0
ℹ cancelled 0
ℹ skipped 5
ℹ todo 0
ℹ duration_ms 48025.604308
```

`fgos return` re-runs the item's own `npm test` itself before it will move
the item to `awaiting-approval`, so that run — not this transcript — is the
binding gate; this is the same suite, recorded here for the evidence trail.

## Blast radius

`fgos tool query --capability impact-analysis --status present` returned
GitNexus registered and `present` → posture **full** (`CLAUDE.md`'s
capability gate), so this is real evidence rather than a weakened
placeholder.

`impact({target: "isCandidate", direction: "upstream", file_path:
"src/state/discover-pool.mjs", includeTests: true})`:

- `impactedCount: 2`, `risk: LOW`, `epistemic: exact`
- depth 1 — `pickNextDiscoverItem` (same module, its only caller)
- depth 2 — `test/state/discover-pool.test.mjs`
- modules affected: `State` (1 hit, direct)

`isCandidate` is module-private, so the blast radius is closed at the one
exported function and its own test file. The behavioral reach beyond that
is `/fgOS:discover-next`'s candidate pool — which is precisely the intended
change, not a side effect.
