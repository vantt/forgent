# Iron Law evidence: tsk-1lv-1

`classifyIronLaw` (`src/evolve/iron-law.mjs`), run against the real
committed diff (`changedFiles`, `src/runner/merge.mjs`) after commit
`a36252ea`:

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": [
    "bin/fgos.mjs",
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
const item = listWork('/home/vantt/projects/forgentX/.fgos').work['tsk-1lv-1'];
const filesChanged = changedFiles('/home/vantt/projects/forgentX', item);
console.log(JSON.stringify(classifyIronLaw({ filesChanged, description: item.description }), null, 2));
"
```

## Verify command

```
node --test test/state/decision-relation.test.mjs
```

## Failing-before / passing-after transcript

**Before** (real transcript, obtained by checking out the pre-change
versions of `bin/fgos.mjs`, `src/state/store.mjs`, and
`scripts/check-decision-citation-drift.mjs` from the parent commit into
this worktree, with the new test file — which did not exist before this
item — already present, then running the verify command):

```
$ git checkout HEAD~1 -- bin/fgos.mjs src/state/store.mjs scripts/check-decision-citation-drift.mjs
$ node --test test/state/decision-relation.test.mjs

file:///.../test/state/decision-relation.test.mjs:30
  collectWideSourceFiles,
  ^^^^^^^^^^^^^^^^^^^^^^
SyntaxError: The requested module '../../scripts/check-decision-citation-drift.mjs' does not provide an export named 'collectWideSourceFiles'
    at #asyncInstantiate (node:internal/modules/esm/module_job:327:21)
    ...
✖ test/state/decision-relation.test.mjs (44.430787ms)
ℹ tests 1
ℹ pass 0
ℹ fail 1
```

**After** (real transcript, restoring the post-change files and
re-running the identical command):

```
$ git checkout HEAD -- bin/fgos.mjs src/state/store.mjs scripts/check-decision-citation-drift.mjs
$ node --test test/state/decision-relation.test.mjs

✔ parseDecisionRelation: "none" parses to {kind: "none"} (1.166186ms)
✔ parseDecisionRelation: "supersedes:<id>" parses to {kind, id} (0.147949ms)
✔ parseDecisionRelation: "touches:<id>" parses to {kind, id} (0.141584ms)
✔ parseDecisionRelation: undefined/empty throws StoreError validation (0.36329ms)
✔ parseDecisionRelation: an unrecognized shape throws StoreError validation (0.172432ms)
✔ decisionTextLooksLikeSupersession: true for prose that narrates a supersession (0.29557ms)
✔ decisionTextLooksLikeSupersession: false for an ordinary new decision (0.111216ms)
✔ collectWideSourceFiles: returns [] for roots that do not exist, never throws (0.319838ms)
✔ collectWideSourceFiles: finds .md files under docs/, excludes node_modules and .git (0.527184ms)
✔ findWideCitationFindings: flags a citation of the old id with no mention of the superseding label (0.390611ms)
✔ findWideCitationFindings: does not flag a line that also names the superseding label (0.149805ms)
✔ findWideCitationFindings: whole-word match only -- does not flag a substring hit (0.086995ms)
✔ CLI: decision without --relation is refused, exit 4 (141.607937ms)
✔ CLI: decision with --relation none and ordinary text succeeds, exit 0 (153.397185ms)
✔ CLI: decision with a malformed --relation value is refused, exit 4 (150.264033ms)
✔ CLI: text that reads like a supersession without --relation supersedes:<id> is refused, exit 4 (158.36923ms)
✔ CLI: the same supersession text passes once --relation supersedes:<id> is declared (156.549301ms)
✔ CLI: supersedes surfaces a dangling citation of the old id that does not also name the new one (229.309972ms)
✔ CLI: supersedes reports no dangling citations once every hit also names the new id (223.112362ms)
✔ CLI: touches does not run the dangling-citation sweep (156.722431ms)
ℹ tests 20
ℹ pass 20
ℹ fail 0
```

## Blast-radius note (footprint expansion beyond plan.md's declared set)

`plan.md`'s split-children footprint for this piece names only
`bin/fgos.mjs`, `src/state/store.mjs`,
`scripts/check-decision-citation-drift.mjs`,
`scripts/check-decision-supersession.mjs`,
`test/state/decision-relation.test.mjs`. Making `--relation` required on
`fgos decision` breaks every existing caller of that CLI verb, not just
`addDecision`'s own function callers — per
`docs/how-to/find-every-caller-before-requiring-a-cli-flag.md`'s own
playbook (written from the `tsk-63c` precedent for the exact same class of
change), a full-repo grep for the CLI invocation shape itself (not only
`addDecision(`) found real breakage beyond the declared footprint:

- 4 canonical skills that mint D-IDs and call `fgos decision` directly —
  `fgos-coding-exploring`, `fgos-coding-shaping`, `fgos-coding-validating`,
  `fgos-coding-planning` (each mirrored byte-identically into
  `plugins/fgOS/skills/`, per `test/skills/fgos-mirror.test.mjs`).
- `plugins/fgOS/skills/merge-loop/SKILL.md`'s own decision-trail call.
- `src/cli/command-registry.mjs`'s `decision` schema/example (introspection
  surface, `fgos --help`/manifest).
- 8 test files with real CLI-level assertions that expected exit `0` on a
  `decision` call with no `--relation`
  (`test/cli/fgos-intake.test.mjs`, `test/cli/fgos-read.test.mjs`,
  `test/e2e/rebuild-determinism.test.mjs`, `test/e2e/pr-gate.test.mjs`,
  `test/e2e/fixture-marketing-domain.test.mjs`,
  `test/e2e/synthetic-domain.test.mjs`,
  `test/e2e/self-improve-loop.test.mjs`).

All of these were updated in the same commit (mechanical fix — adding the
now-required flag, never a redesign) and the full `npm test` suite
(3502 tests) was re-run clean except two pre-existing, unrelated failures
in `test/runner/dispatch.test.mjs` caused by this worktree not carrying a
committed `.fgos/config.json` (ADR0020 — worktrees never carry `.fgos/`),
confirmed present on the parent branch before this item's own changes and
untouched by them.
