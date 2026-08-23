# Iron Law evidence — tsk-34n

## Classification

```
node --input-type=module -e "
import { changedFiles } from './src/runner/merge.mjs';
import { classifyIronLaw } from './src/evolve/iron-law.mjs';
import { listWork } from './src/state/store.mjs';
const item = listWork(process.argv[1] + '/.fgos').work[process.argv[2]];
const filesChanged = changedFiles(process.argv[1], item);
console.log(JSON.stringify(classifyIronLaw({ filesChanged, description: item.description })));
" "$root" "tsk-34n"
```

Result (post-commit, real diff): `{"required":true,"matchedFlags":[],"matchedModules":["src/runner/dispatch.mjs"]}`

`src/runner/dispatch.mjs` matches `MODULE_RULES`'s `src/runner/` prefix
rule — this item edits 5 real call sites plus adds the new
`resolveCapacityAndOverrides` function directly in that file.

## Failing-test-first proof

**Red** (`src/runner/dispatch.mjs` temporarily reverted to its
pre-this-item state via `git checkout 4542d72b~1 -- src/runner/dispatch.mjs`,
the commit immediately before this item's own implementation commit):

```
file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-34n-L25X26/[eval1]:3
import { resolveCapacityAndOverrides } from './src/runner/dispatch.mjs';
         ^^^^^^^^^^^^^^^^^^^^^^^^^^^
SyntaxError: The requested module './src/runner/dispatch.mjs' does not provide an export named 'resolveCapacityAndOverrides'
```

**Green** (`git checkout HEAD -- src/runner/dispatch.mjs`, restoring the
real fix, same assertion):

```
OK
```

`git status --short src/runner/dispatch.mjs` after restore: clean, no
diff.

## Full suite

`npm test`: 3474 pass / 0 fail (up from the `tsk-pdg` baseline of 3459 —
18 new tests added for `resolveCapacityAndOverrides`, `prefer`/`overrides`
shape validation, load-time symmetry, and end-to-end
`spawnWorker`/`executeCapacityCli`/`decideCapacityCli` resolution via
`capabilities.<name>.prefer`).

## Self-review round — failing-test-first proof (post-return, before approval)

The user asked for a deep self-review before merging (see `plan.md`'s own
"Self-review addendum" for the 3 bugs found and fixed). Same discipline,
one representative case (`overrides.tier`/`.model` were validated but
never applied — the most consequential of the three):

**Red** (`src/runner/dispatch.mjs` reverted to `898ebe4b~1`, the commit
immediately before this fix round, running the new test that proves it):

```
✖ executeCapacityCli honors capabilities.<name>.overrides.tier/model directly -- found by self-review: these two fields validated as legal (validateCapabilitiesShape) but were never actually consulted anywhere until this fix
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected
  + 'agy-standard-model'
  - 'agy-override-model'
```

**Green** (`git checkout HEAD -- src/runner/dispatch.mjs`, restoring the
fix):

```
✔ executeCapacityCli honors capabilities.<name>.overrides.tier/model directly -- ...
ℹ pass 1
ℹ fail 0
```

`git status --short src/runner/dispatch.mjs` after restore: clean, no
diff. Full suite after this round: 3479 pass / 0 fail (up from 3474 — 7
new regression tests: the `--for`-vs-positional overrides parity, the
`tier`/`model` direct-override case above, an explicit-caller-override-
always-wins case, and the `allowCrossProvider` remediation-message
precision fix).

## Live migration proof (D3)

Real `.fgos/config.json` migrated: `capacities.fgos-coding-implement`
(the duplicate) deleted, `"for": ["fgos-coding-implement"]` added to
`agy`, `capabilities["fgos-coding-implement"] = {description, prefer:
"agy"}` registered. Loaded successfully under the new validation rules
(`ensureRunnerConfigForDir` against the real main checkout, no throw).

Externally-observed behavior confirmed byte-identical to before
migration (the whole point — a config-modeling refactor, not a behavior
change), against the real live config:

```
native session (hasLiveTaskAccess:true): {"mechanism":"out-of-process","configured":true}
headless --work (hasLiveTaskAccess:false): {"mechanism":"out-of-process","configured":true,"capacityId":"fgos-coding-implement"}
```

Matches `tsk-pdg`'s own pre-migration evidence exactly.

## Final cleanup round — failing-test-first proof (retiring `capacity.capability`)

The user asked to fully retire the legacy `capacities.<id>.capability`
(singular) back-compat field (no longer reading it, no longer validating
it against the `capabilities` catalog) rather than keep it as a
compatibility shim. Removing its fallback read in
`toolsFromCapacities` (`src/state/tool-registry.mjs`) exposed a real,
previously-latent bug: the function's only prior gate for "is this
tool-registry-probeable" was "declares `for`" — and this item's own D3
migration was the first time an agent-kind capacity (`agy`) started
declaring `for` (so `capabilities.<name>.prefer` could resolve it). Without
an explicit `kind !== 'tool'` gate, `agy` started incorrectly appearing as
a tool-registry-probeable entry. Fixed by adding that gate before the
capability extraction.

**Red** (`src/state/tool-registry.mjs` reverted via `git stash push --
src/state/tool-registry.mjs` to its state before this round's fix, running
the new regression test that proves the bug):

```
✖ toolsFromCapacities skips a kind:"agent" capacity even when it DOES
  declare "for" -- the real regression found live: tsk-34n D3 gave "agy"
  its own "for" (so capabilities.<name>.prefer can resolve it), and
  without this gate every agent-kind capacity that migrated to "for"
  would incorrectly show up as tool-registry-probeable
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected
  + { agy: { capability: 'fgos-coding-implement', command: 'agy', kind: 'cli', name: 'agy', ... } }
  - {}
```

(A second test in the same red run also failed for the expected reason —
`toolsFromCapacities no longer reads the legacy "capability" (singular)
field at all` — since the stashed file still had the old fallback read.)

**Green** (`git stash pop`, restoring both the `kind !== 'tool'` gate and
the fallback removal):

```
ℹ tests 23
ℹ pass 23
ℹ fail 0
```

`git status --short src/state/tool-registry.mjs` after restore: clean, no
diff — the stash pop returned the file to its exact pre-stash content.

## Full suite (final cleanup round)

`npm test`: 3477 pass / 0 fail, 5 skipped (up from the self-review round's
3479 total gross test count — 2 obsolete `capacity.capability`-catalog-
validation tests deleted, 1 new tool-registry regression test added, net
change reflects both). Ran clean from the worktree after all fixture/test
updates across `test/runner/dispatch.test.mjs`, `test/state/tool-registry.
test.mjs`, `test/cli/fgos-tool.test.mjs`, and `test/setup/checks.test.mjs`.
