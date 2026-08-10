# tsk-648 — Iron Law evidence

## classifyIronLaw result (against the real committed diff, `trunk...fgw/tsk-648`)

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/runner/merge.mjs"]}
```

## Test command (item's own recorded `verify`)

```
node --test test/runner/merge.test.mjs -t "reviewDiff"
```

## Before (red) — `src/runner/merge.mjs` reverted to the pre-fix commit (`git checkout e9e67faa -- src/runner/merge.mjs`), test file left in place with the two new tsk-648 cases

```
✖ reviewDiff succeeds on a diff larger than Node's old 1 MiB execFileSync default (tsk-648 regression) (79.304904ms)
  Error [MergeError]: computing diff for branch "fgw/demo-item" failed: spawnSync git ENOBUFS
      at reviewDiff (.../src/runner/merge.mjs:274:13)
    errorClass: 'merge-fail',
    category: 'merge-fail',
    branch: 'fgw/demo-item'

✖ reviewDiff reports a diagnosable MergeError, not a raw ENOBUFS passthrough, when a diff still exceeds maxBuffer (40.288629ms)
  AssertionError [ERR_ASSERTION]: Missing expected exception.
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: undefined,
    operator: 'throws'

ℹ tests 62
ℹ pass 60
ℹ fail 2
```

The first failure is the exact reported incident, reproduced live: a diff
past Node's undeclared 1 MiB `execFileSync` default throws a raw
`spawnSync git ENOBUFS`, exactly the message `fgos review tsk-4n7`
surfaced against `fgw/tsk-19y` (332 commits stale).

## After (green) — `src/runner/merge.mjs` restored to the committed fix (`git checkout HEAD -- src/runner/merge.mjs`)

```
ℹ tests 62
ℹ suites 0
ℹ pass 62
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

Working tree confirmed byte-identical to the committed fix after restore
(`git status --short -- src/runner/merge.mjs test/runner/merge.test.mjs`
→ empty). Full `npm test` also run clean on the committed fix beforehand:
2789 pass, 0 fail, 5 skipped (pre-existing, unrelated).
