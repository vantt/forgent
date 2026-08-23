# Iron Law evidence: tsk-1lv-2

`classifyIronLaw` (`src/evolve/iron-law.mjs`), run against the real
committed diff (`changedFiles`, `src/runner/merge.mjs`) after commit
`02f0897c`:

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": [
    "bin/fgos.mjs",
    "src/runner/merge.mjs",
    "src/state/store.mjs"
  ]
}
```

Command run:

```bash
node --input-type=module -e "
import { changedFiles } from './src/runner/merge.mjs';
import { classifyIronLaw } from './src/evolve/iron-law.mjs';
import { listWork } from './src/state/store.mjs';
const item = listWork('/home/vantt/projects/forgentX/.fgos').work['tsk-1lv-2'];
const filesChanged = changedFiles('/home/vantt/projects/forgentX', item);
console.log(JSON.stringify(classifyIronLaw({ filesChanged, description: item.description }), null, 2));
"
```

## Verify command

```
node --test test/report/decision-index.test.mjs test/state/decision-scope-field.test.mjs test/runner/merge.test.mjs
```

## Failing-before / passing-after transcript

**Before** (real transcript: checked out the pre-change versions of
`bin/fgos.mjs`, `src/runner/merge.mjs`, `src/state/store.mjs` from the
parent commit into this worktree, with the new report module/test files —
which did not exist before this item — already present, then ran the
verify command):

```
$ git checkout HEAD~1 -- bin/fgos.mjs src/runner/merge.mjs src/state/store.mjs
$ node --test test/report/decision-index.test.mjs test/state/decision-scope-field.test.mjs test/runner/merge.test.mjs

... (buildDecisionIndexMarkdown/computeDecisionIndex/generateDecisionIndex
pure-transform tests still pass -- they only import
src/report/decision-index.mjs, unaffected by the pre-change bin/store/merge
checkout)
✖ CLI: decision-index generates docs/decisions/index.md from a scope-carrying decision
✖ CLI: decision-index --check exits 0 and writes nothing when the on-disk index already matches
✖ CLI: decision-index --check is refused (validation, exit 4) when the on-disk index is stale
✖ CLI: decision-index --check never writes even when it refuses
✖ CLI: decision --scope repo persists and is readable back via listWork
  AssertionError: Expected values to be strictly equal:
  + actual - expected
  + undefined
  - 'repo'
✖ CLI: an --id-scoped decision may still carry --scope
  AssertionError: Expected values to be strictly equal:
  + actual - expected
  + undefined
  - 'runner'
ℹ tests 109
ℹ pass 103
ℹ fail 6
```

**After** (real transcript, restoring the post-change files and
re-running the identical command):

```
$ git checkout HEAD -- bin/fgos.mjs src/runner/merge.mjs src/state/store.mjs
$ node --test test/report/decision-index.test.mjs test/state/decision-scope-field.test.mjs test/runner/merge.test.mjs

ℹ tests 109
ℹ pass 109
ℹ fail 0
```

## Investigated and rejected: a merge.mjs collision-resolve mirror for the generated index

The plan's own task title ("mirrors merge.mjs collision-resolve
subsystem") was read as "add an auto-resolve for a
`docs/decisions/index.md` merge conflict, analogous to the existing
`docs/decisions/0000-index.md` one." A real implementation was written
(`classifyGeneratedDecisionIndexCollision`/
`autoResolveGeneratedDecisionIndexCollision` in `src/runner/merge.mjs`,
plus three new tests in `test/runner/merge.test.mjs` reproducing the
scenario end to end) and then removed after direct reproduction proved it
structurally unreachable:

- Constructing the exact scenario (two branches each committing a scoped
  decision + a regenerated `docs/decisions/index.md`) never produced a
  resolvable git conflict on that file alone — it produced
  `outcome: "fgos-write-rejected"` instead, because both branches'
  commits necessarily also touched `.fgos/events.jsonl` (the only way to
  produce a real scoped decision to regenerate the index from).
- `docs/how-to/fix-fgos-write-rejected-merge-block.md` documents this as
  an absolute, permanent wall (ADR0020): a `fgw/<id>` worker branch can
  never carry a `.fgos/`-derived change through its own commit, confirmed
  across six independent real occurrences (`tsk-n4i-1`, `tsk-5vf`,
  `tsk-4eu`, `tsk-5ge`, `tsk-28o`, `tsk-3v2`).
- Since `docs/decisions/index.md` can only be meaningfully regenerated
  from `.fgos/events.jsonl` (which a worktree never carries at all, same
  ADR), no `fgw/<id>` branch can ever produce a *meaningful* regenerated
  version of this file to collide over via `mergeRunnerItem` in the first
  place — the collision scenario the old ADR-corpus mechanism handles
  (two DIFFERENT work items' branches each legitimately creating a new
  ordinary tracked `docs/decisions/NNNN-slug.md` file as part of their
  real diff) has no analogue here.

The attempted code and tests were reverted in full; `src/runner/merge.mjs`
carries only an in-place comment recording this finding (so a future
session does not re-attempt the same investigation from scratch).
`test/runner/merge.test.mjs` is byte-identical to its pre-item state.

## Footprint note

`docs/architecture-manifest.json` was also touched (registering the new
`src/report/decision-index.mjs` at the `infra` layer, mirroring its
sibling `src/report/enduser-index-generate.mjs`) — required by
`test/architecture.test.mjs`'s one-row-per-`.mjs`-file invariant, not
declared in `plan.md`'s footprint for this piece.
