# tsk-4zr — Iron Law evidence

## Classification

```
node --input-type=module -e "
import { changedFiles } from './src/runner/merge.mjs';
import { classifyIronLaw } from './src/evolve/iron-law.mjs';
import { listWork } from './src/state/store.mjs';
const item = listWork(process.argv[1] + '/.fgos').work[process.argv[2]];
const filesChanged = changedFiles(process.argv[1], item);
console.log(JSON.stringify(classifyIronLaw({ filesChanged, description: item.description })));
" "$root" "tsk-4zr"
```

Result: `{"required":true,"matchedFlags":[],"matchedModules":["bin/fgos.mjs"]}`

`matchedModules` correctly names `bin/fgos.mjs`, the one implementation
file this fix touches that sits on the Iron Law's self-modifying-capable
module list. No flags matched (this item's description never uses any
Iron Law keyword).

Run *after* `git add`/`git commit` — the implementation was dispatched
out-of-process (`fgos-coding-implement`'s worker branch, `agy`/gemini) and
already committed (`b6e352c1`) by the time this session ran the
classification, so `changedFiles` needed the real committed diff to see
`bin/fgos.mjs` at all — same shape as `tsk-5dnt`'s own retroactive capture.

## Test command

```
node --test --test-name-pattern="tsk-4zr" test/cli/fgos-read.test.mjs
```

(the item's own recorded `verify` runs the whole file — `node --test
test/cli/fgos-read.test.mjs` — this narrower pattern isolates just the
three new assertions for the red/green pair below; the full-file run is
also captured further down)

## Failing-before (implementation reverted in the working tree, new test assertions in place)

`bin/fgos.mjs` was temporarily checked out from the pre-fix commit
(`git checkout HEAD~1 -- bin/fgos.mjs`) while the already-committed test
extension in `test/cli/fgos-read.test.mjs` stayed exactly as it ships —
the same before/after test code both times, so the failure is real
behavior, not a difference in what's being tested.

```
✖ list --id --fields returns only named fields and omits all history side-log keys (tsk-4zr) (647.305898ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected

    [
  +   'deps',
  +   'description',
  +   'id',
  +   'kind',
  +   'refs',
  +   'risk',
      'stage',
  +   'stageEffective',
      'status',
  +   'statusCategory',
  +   'tier',
  +   'title',
  +   'verify'
    ]

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-4zr-kSrwWV/test/cli/fgos-read.test.mjs:347:10)
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: [
      'deps',   'description',
      'id',     'kind',
      'refs',   'risk',
      'stage',  'stageEffective',
      'status', 'statusCategory',
      'tier',   'title',
      'verify'
    ],
    expected: [ 'stage', 'status' ],
    operator: 'deepStrictEqual',
    diff: 'simple'
  }

test at test/cli/fgos-read.test.mjs:373:1
✖ list --id --fields with an invalid field name is rejected as validation error, exit 4 (tsk-4zr) (464.602806ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

  0 !== 4

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-4zr-kSrwWV/test/cli/fgos-read.test.mjs:378:10)
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: 0,
    expected: 4,
    operator: 'strictEqual',
    diff: 'simple'
  }

ℹ tests 3
ℹ pass 1
ℹ fail 2
```

The `--fields`-present test failed because the pre-fix `list --id` handler
has no `--fields` parsing at all — it silently ignored the flag and
returned every raw field (`deps`, `description`, `kind`, `refs`, `risk`,
`stageEffective`, `statusCategory`, `tier`, `title`, `verify` all leaked
through unfiltered) instead of just `stage`/`status`. The invalid-field
test failed because there was no validation path to reject an unknown
field name at all (exit 0, not 4). Both are exactly the gaps this item
exists to close. The third new test (`--fields` absent, unchanged
behavior) passed even pre-fix, as expected — that code path was never
touched.

## Passing-after (fix restored via `git checkout HEAD -- bin/fgos.mjs`)

```
✔ list --id --fields returns only named fields and omits all history side-log keys (tsk-4zr) (532.129577ms)
✔ list --id without --fields is unchanged from today behavior (tsk-4zr) (535.506542ms)
✔ list --id --fields with an invalid field name is rejected as validation error, exit 4 (tsk-4zr) (359.54156ms)
ℹ tests 3
ℹ pass 3
ℹ fail 0
```

Full `test/cli/fgos-read.test.mjs` suite also confirmed green post-fix (all
8 `list --id`-pattern tests, including the pre-existing `tsk-2u9`/`tsk-5dnt`
scoping tests, pass alongside the 3 new ones).

## Full suite (regression check)

```
node --test 'test/**/*.test.mjs'
```

`3756 pass / 0 fail / 5 skipped` (3761 total) — the 5 skips are the
pre-existing baseline, no new skips or failures introduced.

## GitNexus cross-check — skipped, no indexed entry for this worktree

`fgos tool query --capability impact-analysis --status present` reports
GitNexus `present`. `list_repos` was checked before trusting a `detect_changes`
result (per this repo's own impact-analysis capability-gate cross-check
rule) and found no indexed entry at this exact worktree path
(`/home/vantt/projects/forgentX/.claude/worktrees/tsk-4zr-kSrwWV`) — only
the main checkout (`/home/vantt/projects/forgentX`), itself 1030 commits
stale. Skipped rather than run against a mismatched/stale index; the
failing-test-first pair and full-suite regression run above already carry
the real proof for this additive, single-module change.

## Method note

Same recovery shape `tsk-5dnt` already used: `classifyIronLaw` run right
after the out-of-process worker's commit landed correctly saw the real
diff (unlike the too-early-check false negative `tsk-5cf` hit), but the
red/green pair itself still had to be captured retroactively since the
worker had already committed a fully green state. `git checkout HEAD~1 --
bin/fgos.mjs` reverts only the implementation file in the working tree
(the already-committed test file is untouched, so both runs exercise
identical test code), capture the real red transcript, then `git checkout
HEAD -- bin/fgos.mjs` restores the committed fix and the green transcript
is captured again to confirm nothing else changed in between.
