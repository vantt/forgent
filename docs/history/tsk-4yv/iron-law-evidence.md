# Iron Law evidence: tsk-4yv

`classifyIronLaw` result against the real committed diff (`fgw/tsk-25r...fgw/tsk-4yv`,
this item's parent-root trunk):

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/runner/worktree.mjs"]}
```

## Test command

```
node --test test/runner/worktree.test.mjs
```

## Failing-before (pre-fix `worktree.mjs`, no cleanup-on-failure wrap)

Temporarily swapped `src/runner/worktree.mjs` back to its content at commit
`76fda5a0` (immediately before the implementation commit `6e2e9909`) and
reran the test file — including the two new cases this item added. Both
fail, each showing the real leak: `git worktree list --porcelain` still
lists the checkout after `finishWorktreeSetup` threw.

**Detached merge-worktree case:**
```
✖ tsk-4yv: withMergeEphemeralWorktree removes the detached worktree it just registered when finishWorktreeSetup fails -- never leaks an unreclaimed detached checkout
  AssertionError: the detached merge worktree must not remain registered after finishWorktreeSetup failed
  actual: 'worktree /tmp/fgos-worktree-test-repo-BbtnF3\nHEAD fb26b66...\nbranch refs/heads/main\n\nworktree /tmp/fgos-worktrees/fgw-broken-dep-merge-item-merge-skgl0F\nHEAD fb26b66...\ndetached\n\n'
```

**Branch-attached case:**
```
✖ tsk-4yv: createWorktree removes the worktree it just registered when finishWorktreeSetup fails (malformed package.json throws inside provisionDependencies) — never leaks a registered checkout
  AssertionError: the worktree must be fully unregistered from git, not left dangling
  actual: 'worktree /tmp/fgos-worktree-test-repo-hv3PiI\nHEAD 8a6b12c...\nbranch refs/heads/master\n\nworktree /tmp/fgos-worktree-test-dir-VHxbXY/item-broken-dep-RUBmKT\nHEAD 8a6b12c...\nbranch refs/heads/fgw/item-broken-dep\n\n'
```

Both `actual` values are `git worktree list --porcelain` output taken right
after the throw — the leaked worktree stanza is right there in both, git's
own confirmation that the checkout stayed fully registered.

```
ℹ tests 65
ℹ pass 63
ℹ fail 2
```

## Passing-after (post-fix `worktree.mjs` restored)

```
ℹ tests 65
ℹ suites 0
ℹ pass 65
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

Full suite passes, including both new leak-proof tests and every
pre-existing `createWorktree`/`createDetachedMergeWorktree`/
`withMergeEphemeralWorktree` test (success path, `.fgos` strip, baseRef
forking, reuse/relocate) unchanged.

## Full item verify (post-fix)

```
node --test test/runner/worktree.test.mjs test/runner/merge.test.mjs test/runner/worktree-callsite-wrapper.test.mjs
```

163/163 pass (confirmed earlier in this same implementation pass).
