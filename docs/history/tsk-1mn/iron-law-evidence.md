# Iron Law evidence: tsk-1mn

`classifyIronLaw` result against the real committed diff (`fgw/tsk-25r...fgw/tsk-1mn`,
this item's actual parent-root trunk — a leaf diffs against its root, not `main`):

```json
{"required":true,"matchedFlags":["audit"],"matchedModules":["src/runner/claim-port.mjs","src/runner/worktree.mjs"]}
```

## Test command

```
node --test test/runner/worktree.test.mjs
```

## Failing-before (pre-fix `worktree.mjs`, no `beforeProvision` seam)

Temporarily swapped `src/runner/worktree.mjs` back to its content at commit
`12d770e9` (immediately before the implementation commit `53500093`) and
reran the test file — including the new ordering-contract test this item
added. One failure, exactly as expected: the callback this item introduces
does not exist yet in the pre-fix code, so it is never invoked:

```
✖ tsk-1mn: createWorktree calls opts.beforeProvision after all repoRoot-touching git setup completes, strictly BEFORE provisioning installs anything (180.733876ms)
  AssertionError [ERR_ASSERTION]: beforeProvision must fire exactly once

  0 !== 1

ℹ tests 63
ℹ suites 0
ℹ pass 62
ℹ fail 1
```

## Passing-after (post-fix `worktree.mjs` restored)

```
ℹ tests 63
ℹ suites 0
ℹ pass 63
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

The full 63-test `worktree.test.mjs` suite passes, including both new
tsk-1mn tests (the ordering-contract proof, and the no-callback
byte-identical regression guard) and every pre-existing test (including
`createDetachedMergeWorktree`'s own suite, proving that call site — which
never passes `beforeProvision` — is unaffected).

## Full item verify (both touched files, post-fix)

```
node --test test/runner/worktree.test.mjs test/runner/claim-port.test.mjs
```

```
ℹ tests 241
ℹ pass 241
ℹ fail 0
```

Includes the full pre-existing `claim-port.test.mjs` `isolate: true` suite
(concurrent reclaim, worker-slot ceiling, `createClaimWorktree`-failure
revert, branch-take, blocked→doing) passing unchanged against the new call
shape — `claimWork` now passes `beforeProvision` on every isolate claim, and
every one of those existing tests still passes because `lockResult.release()`
is idempotent and the callback default is a no-op when omitted.
