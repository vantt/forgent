# Iron Law evidence — tsk-lya

## Classification

Result: `{"required":true,"matchedModules":["bin/fgos.mjs",
"src/runner/claim-port.mjs","src/runner/dispatch.mjs","src/runner/loop.mjs",
"src/runner/worktree.mjs","src/state/status-fsm.mjs","src/state/store.mjs",
"src/state/workflow-stage-graphs.mjs"],"matchedFlags":[]}`

Same false-positive shape as `docs/history/tsk-3ik-2/iron-law-evidence.md`:
this item's branch (`fgw/tsk-lya`) forked from a tip that already includes
`tsk-403`'s own delivered plan-family rename (a real, large change
touching `bin/fgos.mjs`, `src/state/workflow-stage-graphs.mjs`,
`src/state/store.mjs`, and other runner/state modules), and the trunk ref
`changedFiles` diffs against has not yet absorbed that merge. `changedFiles`
diffs `trunk...fgw/tsk-lya`, so it picks up that already-delivered sibling
item's files too, not only what this item's own commit touches.

**None of this item's own commit files intersect the matched list.** This
item's own commit (`8678a286`) touches exactly:

```
docs/architecture-manifest.json
plugins/fgOS/skills/discover-next/SKILL.md
plugins/fgOS/skills/discover/SKILL.md
plugins/fgOS/skills/plan-loop/SKILL.md      (new)
plugins/fgOS/skills/plan-next/SKILL.md      (new)
src/state/discover-pool.mjs
src/state/plan-pool.mjs                     (new)
test/state/discover-pool.test.mjs
test/state/plan-pool.test.mjs               (new)
```

None of these appear in `matchedModules` above.

## Test command

Item's own verify: `npm test && test -d plugins/fgOS/skills/plan-next &&
grep -q "fgOS:discover" plugins/fgOS/skills/discover-next/SKILL.md && !
grep -q "Socratic reasoning" plugins/fgOS/skills/discover/SKILL.md`

## Failing-before (real transcript, captured live during this item's own
`fgos-researching`/`fgos-exploring` passes, before any edit)

```
$ grep -n "Socratic" plugins/fgOS/skills/discover/SKILL.md
7:  live session does its own real Socratic reasoning (fgos-coding-exploring)
21:(`fgos-coding-exploring`'s own Socratic flow), and supplies that verdict to
127:   CONTEXT.md` D1, D6). The live session doing the real Socratic reasoning
```

Three live hits — the item's own `! grep -q "Socratic reasoning"` clause
of `verify` fails against this text (non-zero exit), so the full
conjunctive `verify` command was red before implementation, confirmed live
this session (also recorded in `docs/history/discover-stage-graph-and-
skill-layering/RESEARCH.md`'s Round 1 scout evidence).

## Passing-after (real transcript, captured post-implementation)

```
$ npm test && test -d plugins/fgOS/skills/plan-next && grep -q "fgOS:discover" plugins/fgOS/skills/discover-next/SKILL.md && ! grep -q "Socratic reasoning" plugins/fgOS/skills/discover/SKILL.md
...
ℹ tests 2961
ℹ suites 0
ℹ pass 2956
ℹ fail 0
ℹ cancelled 0
ℹ skipped 5
ℹ todo 0
$ echo $?
0
```

Full command exits `0`. `grep -n "Socratic" plugins/fgOS/skills/discover/
SKILL.md` after the edit finds no hit for the literal phrase "Socratic
reasoning" (the file still discusses each stage's real Socratic
collaboration accurately, just never misattributes it to the wrong skill
or the wrong single-pass shape).

## What changed

- `src/state/discover-pool.mjs`: narrowed `CANDIDATE_STAGES` to
  clarify-shaped stages only (`clarify`/`discovery`/`exploring`); removed
  the decompose-pool branch and `compareDecomposeOrder` (moved out).
- `src/state/plan-pool.mjs` (new): `pickNextPlanItem`, extracted
  decompose/planning pooling logic, its own dedicated pick function for
  the `planning` pool (D11).
- `plugins/fgOS/skills/discover-next/SKILL.md`: drops self-claim +
  self-dispatch + self-computed ceiling; delegates to `/fgOS:discover
  <id>` after picking from the now-narrowed clarify-shaped pool (D10).
- `plugins/fgOS/skills/plan-next/SKILL.md`, `plan-loop/SKILL.md` (new):
  mirror the `discover-next`/`discover-loop` template pair, wired to
  `plan-pool.mjs`, delegating to `/fgOS:plan <id>` (D11).
- `plugins/fgOS/skills/discover/SKILL.md`: four prose fixes (D8) — the
  three sentences wrongly attributing Socratic reasoning to
  `fgos-coding-exploring` alone are corrected to name each stage's real
  skill (`fgos-clarifying` at `clarify`, `fgos-researching` at
  `discovery`, `fgos-coding-exploring` at `exploring`); the false "errors
  outside stage clarify" claim is corrected against `nextDiscoveryEdge`'s
  real three-stage handling; step 4 now re-reads live state before
  relaying a stop reason; a new `## Layer` section documents `discover` as
  a launcher and names its real callers.
- `test/state/discover-pool.test.mjs`: updated for the narrowed pool (12
  of 16 tests unchanged; 4 updated so a `decompose`-stage item is proven
  to never be picked here, rather than merely "loses to clarify").
- `test/state/plan-pool.test.mjs` (new): 10 tests covering the extracted
  `planning` pool, incl. the `decompose`/`planning` dual-stage candidacy
  (D18's drain-only alias).
- `docs/architecture-manifest.json`: registered `src/state/plan-pool.mjs`
  at the `domain` layer, alongside its siblings `discover-pool.mjs`/
  `cleanup-pool.mjs`/`retro-pool.mjs`.
