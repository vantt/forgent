# tsk-396 — Iron Law evidence

`classifyIronLaw` result on this item's committed diff (`changedFiles`,
`src/runner/merge.mjs`):

```json
{"required":true,"matchedFlags":["data loss"],"matchedModules":["bin/fgos.mjs","src/state/store.mjs"]}
```

`bin/fgos.mjs` and `src/state/store.mjs` are self-modifying-capable
modules per `src/evolve/iron-law.mjs`'s `MODULE_RULES` — required: true.

## Test command

`npm test` (`node --test 'test/**/*.test.mjs'`)

## Failing-test-first proof

The two new regression tests (`test/cli/fgos.test.mjs`) were run in
isolation (`--test-name-pattern="tsk-396|missing-evidence acceptance
clause is refused BEFORE"`) against the pre-fix versions of
`bin/fgos.mjs`/`src/state/store.mjs` (`git show bd2ee2a~1:<path>`, the
commit immediately before this item's implementation commit), with the
new test file left at its current (post-fix) content, to confirm they
genuinely fail without the fix — then against the fixed versions to
confirm they pass.

### Before the fix — fails as expected

```
✖ approve --github --pr on an item with a missing-evidence acceptance clause is refused BEFORE the real GitHub merge: precondition, exit 2, mergeGitHubPR/gh is never called (517.388919ms)
  AssertionError [ERR_ASSERTION]: {
    "contract": "fgos.v1",
    ...
    "data": {
      "id": "gh-approve-cos-missing",
      "mode": "github",
      "to": "blocked",
      "prNumber": "42",
      "reason": "gh-invocation-failed",
      "detail": "unparseable gh --json output: "
    }
  }
  0 !== 2

✖ approve on a runner-sourced item with a missing-evidence acceptance clause is refused BEFORE the real git merge: precondition, exit 2, main HEAD unchanged, item stays awaiting-approval (568.901125ms)
  AssertionError [ERR_ASSERTION]: fgos: no runner config found — detected "claude" on PATH; wrote a default (executor: claude) at /tmp/fgos-cli-jaqZmn/.fgos/config.json#runner; edit .fgos/config.json by hand to change.
  0 !== 2

ℹ tests 2
ℹ suites 0
ℹ pass 0
ℹ fail 2
```

Both fail with `0 !== 2` (approve did not refuse with the expected
precondition exit code) — confirming the pre-fix code genuinely lets the
merge proceed (or attempt to) before the acceptance-evidence gate has a
chance to refuse it, exactly the ordering bug this item fixes, not a
hypothetical.

### After the fix — passes

```
✔ approve --github --pr on an item with a missing-evidence acceptance clause is refused BEFORE the real GitHub merge: precondition, exit 2, mergeGitHubPR/gh is never called (497.700972ms)
✔ approve on a runner-sourced item with a missing-evidence acceptance clause is refused BEFORE the real git merge: precondition, exit 2, main HEAD unchanged, item stays awaiting-approval (473.03778ms)

ℹ tests 2
ℹ suites 0
ℹ pass 2
ℹ fail 0
```

## Broader regression check

Full repo test suite (`npm test`): 2153/2153 passing, exit 0 — includes
both new regression tests above, plus the pre-existing runner-sourced
approve/merge suites (`test/cli/fgos.test.mjs`, `test/runner/merge.test.mjs`,
51+ tests) unmodified and green.

Note: an earlier run (before syncing `fgw/tsk-396` with `main`) showed 2
unrelated pre-existing failures (`test/architecture.test.mjs`'s
manifest-parity check, `test/skills/fgos-mirror.test.mjs`'s mirror-parity
check) — confirmed caused by branch staleness (another session, `tsk-2eq`,
had already fixed both on `main` after this branch forked, commit
`2552db9`). Merging `main` into `fgw/tsk-396` picked up that fix; both
checks pass cleanly after the sync, unrelated to this item's own scope.
