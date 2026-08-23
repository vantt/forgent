# Iron Law evidence — tsk-3hks

## Classification

Run after commit `2001eac2`, against the real committed diff on
`fgw/tsk-3hks` (per `docs/how-to/produce-failing-test-first-proof-for-an-
iron-law-gated-diff.md`'s own "watch out for" — never before commit,
which gives a false `required: false` negative):

```
node --input-type=module -e "
import { changedFiles } from './src/runner/merge.mjs';
import { classifyIronLaw } from './src/evolve/iron-law.mjs';
import { listWork } from './src/state/store.mjs';
const item = listWork('/home/vantt/projects/forgentX/.fgos').work['tsk-3hks'];
const filesChanged = changedFiles('.', item);
console.log(JSON.stringify(classifyIronLaw({ filesChanged, description: item.description }), null, 2));
"
```

Result:

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["bin/fgos.mjs", "src/state/store.mjs"]
}
```

## Failing-test-first proof

Scoped test file: `test/cli/fgos-edit.test.mjs` (the only file this
item's tests touch or add — same command run before and after).

**Get to red honestly.** Checked out the pre-implementation version of
just the implementation files, keeping the shipped test file exactly as
committed:

```
git checkout f9f08323 -- bin/fgos.mjs src/cli/command-registry.mjs src/state/replay.mjs src/state/store.mjs
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test test/cli/fgos-edit.test.mjs
```

Real result: `65 tests, 61 pass, 4 fail` — the 4 new `resolve-park-reason`
tests that exercise the actual clearing behavior (the 3 pure-validation
`resolve-park-reason` tests — unknown id, missing `--note`, non-terminal
status refusal — happened to still pass pre-implementation, since an
unrecognized CLI verb also exits non-zero via the existing command-
registry fallback; only the tests that assert real clearing behavior
distinguish old from new code):

```
test at test/cli/fgos-edit.test.mjs:731:1
✖ resolve-park-reason on done item clears reason and parkReason and records note in parkResolutions
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  4 !== 0
  operator: 'strictEqual'

test at test/cli/fgos-edit.test.mjs:756:1
✖ resolve-park-reason on wontfix item clears reason
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  4 !== 0
  operator: 'strictEqual'

test at test/cli/fgos-edit.test.mjs:775:1
✖ resolve-park-reason on a done item without prior reason succeeds as a no-op clear and records note
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  4 !== 0
  operator: 'strictEqual'

test at test/cli/fgos-edit.test.mjs:793:1
✖ resolve-park-reason regression guard: ordinary work.move reason fold on active item is unaffected (RUL32)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected
  + 'parked reason A'
  - undefined
```

(`4 !== 0` is the CLI's own exit-code assertion: the pre-implementation
`resolve-park-reason` verb doesn't exist, so the command falls through to
the existing unknown-subcommand path and exits `4` instead of the `0` a
successful clear should produce.)

**Get back to green.** Restored the exact same files to their committed
(shipped) state:

```
git checkout HEAD -- bin/fgos.mjs src/cli/command-registry.mjs src/state/replay.mjs src/state/store.mjs
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test test/cli/fgos-edit.test.mjs
```

Real result: `65 tests, 65 pass, 0 fail` — full pass, tree clean
(`git status --short` empty), matching commit `2001eac2` exactly.

**Full suite, once more.** `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 npm test`:
`3784 tests, 3779 pass, 0 fail, 5 skipped` — no regression outside the
scoped file; the 5 skips match this repo's known pre-existing baseline.

## Impact-analysis posture: degraded, not trusted

`fgos tool query --capability impact-analysis --status present` reports
GitNexus `present`, but its index for this repo (main checkout and every
worktree, per `list_repos`) is hundreds to over a thousand commits behind
HEAD, and this item's own worktree is not indexed at all. Ran
`detect_changes(scope: "compare", base_ref: "main")` anyway as a
cross-check: it reported `risk_level: "critical"` but its `changed_symbols`
list named `composeLearning`, `setFocus`, `tryIncrementalRebuild`, and
`COMMAND_REGISTRY` (touched) — none of which this item's real diff
modifies (the real diff adds `resolveParkReason` to `store.mjs`, a new
`'work.resolve-park-reason'` case to `replay.mjs`, a new registry entry
+ CLI branch, none of the symbols GitNexus named). Per `CLAUDE.md`'s
impact-analysis gate, a stale index result that doesn't match the real
diff is a signal to cross-check with a plain diff, not to trust the tool's
label — treating this as `degraded`, not acting on the "critical" label,
and relying on the real failing-test-first proof and full-suite run above
instead.

## Files changed (commit `2001eac2`)

```
bin/fgos.mjs
docs/history/tsk-3hks-clear-stale-park-reason/plan.md
docs/specs/work-state.md
src/cli/command-registry.mjs
src/state/replay.mjs
src/state/store.mjs
test/cli/fgos-edit.test.mjs
```
