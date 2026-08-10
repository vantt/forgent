# Iron Law evidence — tsk-3ni

`classifyIronLaw` on this item's changed files returned `required: true`,
matched modules `["src/runner/claim-liveness.mjs", "src/runner/claim-port.mjs"]`
(no matched flags) — both are inside `claim-port.mjs`'s single choke-point
for every claim flow (`pick`/`take`/runner `claimItem`).

## Test command

```
node --test test/runner/claim-port.test.mjs test/runner/worktree.test.mjs test/runner/claim-liveness.test.mjs
```

## Failing-before transcript

Captured by temporarily restoring `src/runner/claim-port.mjs` to its
pre-fix version (`git show HEAD~1:src/runner/claim-port.mjs`, the commit
immediately before this item's implementation commit), keeping the new
tests and the new `claim-liveness.mjs` module as-is, then running the new
`claim-port.test.mjs` cases:

```
$ node --test --test-name-pattern="D2|D4|D5|tsk-2ec|no-op for a runner-claimed|never fires" test/runner/claim-port.test.mjs

✖ claimWork transparently reclaims a conclusively-quiet session doing claim via pick, reattaching to the existing branch (D2/D4/D5) (58.794834ms)
✔ claimWork still refuses a session doing claim with recent activity, unchanged (tsk-2ec regression) (40.42453ms)
✔ claimWork pre-check is a no-op for a runner-claimed doing item -- stays startupReap's domain alone (D2 scope) (27.920957ms)
✔ claimWork pre-check never fires for a runner CALLER, even against a conclusively-quiet session claim (validating finding: no back door around startupReap's human/session exclusion) (44.589462ms)
✔ claimWork pre-check never fires for take (isolate:false), even against a conclusively-quiet session claim (implementation finding: take's own branch-reuse gap is separately scoped, tsk-65n) (44.467811ms)
ℹ tests 5
ℹ suites 0
ℹ pass 4
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 283.898989

✖ failing tests:

test at test/runner/claim-port.test.mjs:288:1
✖ claimWork transparently reclaims a conclusively-quiet session doing claim via pick, reattaching to the existing branch (D2/D4/D5) (58.794834ms)
  Error [FsmError]: transitionWork: expected status "todo" for work "item-a" but found "doing" — refusing to overwrite blindly.
      at transitionWork (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-3ni-FgQPLU/src/state/status-fsm.mjs:205:11)
      at file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-3ni-FgQPLU/src/state/store.mjs:469:20
      at withEventsLock (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-3ni-FgQPLU/src/state/events.mjs:334:12)
      at moveWork (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-3ni-FgQPLU/src/state/store.mjs:457:17)
      at claimWork (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-3ni-FgQPLU/src/runner/claim-port.mjs:211:23)
      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-3ni-FgQPLU/test/runner/claim-port.test.mjs:297:18)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1325:25)
      at Test.start (node:internal/test_runner/test:1191:17)
      at startSubtestAfterBootstrap (node:internal/test_runner/harness:385:17) {
    category: 'conflict'
  }
```

The other four new cases already pass against the pre-fix code because
they assert "still refuses exactly as today" — the unmodified CAS is
already correct for those; only the one case asserting the NEW
transparent-reclaim behavior genuinely needs the fix.

## Passing-after transcript

Fix restored (`cp` of the real committed file back over the temporary
revert), full three-file run:

```
$ node --test test/runner/claim-port.test.mjs test/runner/worktree.test.mjs test/runner/claim-liveness.test.mjs

ℹ tests 64
ℹ suites 0
ℹ pass 64
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 3632.47885
```

All 64 (7 new `claim-liveness.test.mjs` cases, 5 new `claim-port.test.mjs`
cases, every pre-existing case in both files plus `worktree.test.mjs`
unmodified and still green) pass.
