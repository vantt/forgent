# Iron Law evidence: tsk-f8f

`classifyIronLaw` result against the real committed diff (`fgw/tsk-25r...fgw/tsk-f8f`,
this item's parent-root trunk):

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/runner/claim-liveness.mjs"]}
```

## Test command

```
node --test test/runner/claim-liveness.test.mjs
```

## Failing-before (pre-fix `claim-liveness.mjs`, default porcelain + whitespace-split parse)

Temporarily swapped `src/runner/claim-liveness.mjs` back to its content at
commit `a7b35bde` (immediately before the implementation commit
`367a502c`) and reran the test file — including the two new cases this
item added. Both fail, each returning the OLDER backdated commit
timestamp instead of the real, newer file mtime — exactly the bug:

```
✖ tsk-f8f: lastActivityAt reflects an untracked file whose NAME CONTAINS A SPACE -- the exact Finding 9 scenario (git-quotes this path in default porcelain output)
  AssertionError: must reflect the spaced file's real mtime -- the old whitespace-split parse silently dropped it
  actual:   1786718205000  (the stale commit time)
  expected: 1786725345000  (the real, newer file mtime)

✖ tsk-f8f: lastActivityAt reflects a file RENAMED to a spaced name -- the porcelain -z rename record's extra origin-path token is correctly skipped, never mistaken for a path to stat
  AssertionError: must reflect the renamed (destination) file's real mtime, never fail on the origin-path token
  actual:   1786718205000  (the stale commit time)
  expected: 1786725375000  (the real, newer file mtime)

ℹ tests 9
ℹ pass 7
ℹ fail 2
```

Both failures show the actual production consequence, not just a code
mismatch: `lastActivityAt` silently fell back to the older, stale commit
time — exactly the "reclaim despite real activity" failure scenario the
finding describes.

## Passing-after (post-fix `claim-liveness.mjs` restored)

```
ℹ tests 9
ℹ suites 0
ℹ pass 9
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

Full suite passes, including both new tests and every pre-existing test
(no branch, no live worktree, plain uncommitted file, `.fgos` exclusion,
reclaim-threshold boundaries) unchanged.

## Full item verify (post-fix)

```
node --test test/runner/claim-liveness.test.mjs test/runner/claim-port.test.mjs
```

25/25 pass (confirmed earlier in this same implementation pass).
