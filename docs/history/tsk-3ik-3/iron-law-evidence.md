# Iron Law evidence — tsk-3ik-3

## Classification

```
node --input-type=module -e "
import { changedFiles } from './src/runner/merge.mjs';
import { classifyIronLaw } from './src/evolve/iron-law.mjs';
import { listWork } from './src/state/store.mjs';
const item = listWork(process.argv[1] + '/.fgos').work[process.argv[2]];
const filesChanged = changedFiles(process.argv[1], item);
console.log(JSON.stringify(classifyIronLaw({ filesChanged, description: item.description })));
" "$root" "tsk-3ik-3"
```

Result (post-commit, real diff against `main`): `{"required":true,"matchedFlags":[],"matchedModules":["src/runner/dispatch.mjs"]}`

`src/runner/dispatch.mjs` matches `MODULE_RULES`'s `src/runner/` prefix rule
— this item extends `decideCapacityCli` (added in `tsk-3ik-1`) to also
surface `agentType`, a small additive touch to the same Iron-Law-gated
file.

## Failing-test-first proof

**Red** (`src/runner/dispatch.mjs` temporarily reverted to its pre-this-item
state, `git checkout 8ef69b8 -- src/runner/dispatch.mjs` — the commit
immediately before this item's own — leaving the new/modified tests in
`test/runner/dispatch.test.mjs` in place):

```
$ node --test test/runner/dispatch.test.mjs
...
✖ decideCapacityCli resolves "native" for a kind:"task" capacity when hasLiveTaskAccess is passed true, alongside its agentType
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected
    {
      mechanism: 'native'
  -   agentType: 'judge'
    }
  actual: { mechanism: 'native' }
  expected: { mechanism: 'native', agentType: 'judge' }

✖ decideCapacityCli resolves "cli-spawn" for the same kind:"task" capacity when hasLiveTaskAccess is omitted (safe default), still reporting its agentType
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
    { agentType: 'judge', mechanism: 'cli-spawn' }
  actual: { mechanism: 'cli-spawn' }
  expected: { mechanism: 'cli-spawn', agentType: 'judge' }
```

**Green** (implementation restored, `git checkout HEAD -- src/runner/dispatch.mjs`):

```
$ node --test test/runner/dispatch.test.mjs
...
ℹ tests 127
ℹ suites 0
ℹ pass 127
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

## Prose-fragment change (no executable test for the branch logic itself)

The new Step B.5 in `_shared/capacity-dispatch-fallback.md` is markdown
prose a live agent session reads and follows — same gap `tsk-53h`'s own
`iron-law-evidence.md` already named ("no test in this repo unit-tests a
skill's runtime behavior"). Proof surface instead:

- `test/skills/fgos-mirror.test.mjs` (4/4 green) — structural: both
  `.claude/` and `.agents/` copies stay byte-identical.
- Live manual acceptance run against this repo's real committed config
  (from this item's own worktree, since `resolve`'s `kind:"cli"` presence
  check misresolves `.fgos/` from inside a linked worktree per ADR0020 —
  same caveat `tsk-53h` documented; `decide` needs no `fgosDir` so it is
  unaffected):

```
$ node src/runner/dispatch.mjs resolve submit-assist-classify --prompt "test prompt"
{"command":"agy","args":["-p","test prompt","--model","Gemini 3.5 Flash (Medium)"],"provider":"agy","model":"Gemini 3.5 Flash (Medium)"}

$ node src/runner/dispatch.mjs decide submit-assist-classify
{"mechanism":"cli-spawn"}

$ node src/runner/dispatch.mjs decide submit-assist-classify --has-live-task-access
{"mechanism":"cli-spawn"}
```

Confirms `resolve`'s pre-existing behavior is unaffected, and `decide`
correctly resolves `submit-assist-classify` (`kind:"cli"`, no `agentType`)
to `cli-spawn` regardless of `--has-live-task-access` — exactly rules 1/3
of the doctrine, and exactly what the 20 unit tests in
`docs/history/tsk-3ik-1/iron-law-evidence.md`'s own suite already assert.
No live `kind:"task"` capacity exists yet in this repo to exercise the
`native` branch end-to-end through the fragment itself — that branch's
correctness is proven by `decideCapacityCli`'s own unit tests
(`test/runner/dispatch.test.mjs`) instead, the same "resolve via the shared
helper, never a second implementation" discipline the fragment's own Step
C already follows for the `cli-spawn` branch.

## Item's own verify command

```
node --test test/skills/fgos-mirror.test.mjs
```

```
✔ .claude/skills and .agents/skills declare the exact same set of fgos-* skill names
✔ every mirrored fgos-* skill directory contains the exact same set of relative file paths
✔ every mirrored file pair is byte-identical
✔ .claude/skills/_shared and .agents/skills/_shared mirror each other byte-identically
ℹ tests 4
ℹ pass 4
ℹ fail 0
```

## Full suite (regression check)

```
node --test 'test/**/*.test.mjs'
```

(see commit for full transcript — run before `fgos return`)
