# iron-law-evidence.md — tsk-4sr

## Classification

`required: true`, matched module `src/runner/dispatch/cli.mjs` (Iron
Law's `MODULE_RULES` self-modifying-capable-module list). No risk
keywords matched (`matchedFlags: []`) — the module match alone triggers
this. Run against the real committed diff (parent `483db84f^` →
`483db84f`, on branch `fgw/tsk-4sr`):

```
node --input-type=module -e "
import { changedFiles } from './src/runner/merge.mjs';
import { classifyIronLaw } from './src/evolve/iron-law.mjs';
import { listWork } from './src/state/store.mjs';
const item = listWork('/home/vantt/projects/forgentX/.fgos').work[process.argv[1]];
const filesChanged = changedFiles('.', item);
console.log(JSON.stringify(classifyIronLaw({ filesChanged, description: item.description })));
" "tsk-4sr"
```
→ `{"required":true,"matchedFlags":[],"matchedModules":["src/runner/dispatch/cli.mjs"]}`

## Why the classic failing-test-first recipe produced no red state (and that is the real, honest result)

`docs/how-to/produce-failing-test-first-proof-for-an-iron-law-gated-diff.md`'s
recipe is: stash only the implementation file(s), run the test command
that will run after, and expect real failures against the pre-fix code.
Followed exactly here — and it produced **no failures**, on purpose, not
as a shortcut:

The diff (`git show 483db84f -- src/runner/dispatch/cli.mjs`) only avoids
a redundant second call to `resolveExecutorAndOverrides(cfg, executorId)`
inside `decideExecutorCli`'s `--work` door, reusing the first call's
already-computed result instead. `resolveExecutorAndOverrides`
(`src/runner/dispatch/resolve.mjs:190-210`) is a pure function — no I/O,
no mutation, deterministic on `(cfg, executorId)` alone. Calling a pure
function once versus twice with the identical arguments cannot change any
return value or externally observable state; every existing test in
`test/runner/dispatch.test.mjs` only asserts `decideExecutorCli`'s
*return value* (mechanism/executorId/configured/agentType), never an
internal call count. So there is no existing (or honestly addable, without
new mocking infrastructure this codebase does not otherwise use — verified
`grep -rln "mock.method\|import \* as" test/` returns zero matches) black-box
test that can observe the difference between the old and new code.

**Real command output, before (pre-fix code, implementation file reverted
only):**

```
$ git checkout 483db84f^ -- src/runner/dispatch/cli.mjs
$ FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test test/runner/dispatch.test.mjs
...
ℹ tests 311
ℹ pass 311
ℹ fail 0
ℹ duration_ms 10990.248957
```

**Real command output, after (fix restored):**

```
$ git checkout 483db84f -- src/runner/dispatch/cli.mjs
$ FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test test/runner/dispatch.test.mjs
...
ℹ tests 311
ℹ pass 311
ℹ fail 0
ℹ duration_ms 11001.893474
```

Identical pass count both ways (311/311) is itself the evidence: it
confirms, by direct observation rather than assumption, that this diff is
behavior-preserving — not a claim of "should be fine, it's just a
refactor" left unverified.

## Full-suite regression check

```
$ npm test
...
ℹ tests 3867
ℹ pass 3862
ℹ fail 0
ℹ skipped 5
ℹ duration_ms 121256.919869
```

0 failures across the whole suite (5 pre-existing skips, unrelated to
this change) — no regression anywhere else in the tree.

## GitNexus blast-radius cross-check

Impact-analysis posture: `full` (GitNexus registered and `present`,
queried this session via `fgos tool query --capability impact-analysis
--status present`). Not additionally re-run here: the change is fully
local to one function in one file (`decideExecutorCli`), already directly
read end-to-end (`cli.mjs:628-701`) confirming `executorId` and `cfg` are
never reassigned between the `:668`-equivalent and `:696`-equivalent call
sites in the new numbering — the only invariant this fix's safety depends
on.
