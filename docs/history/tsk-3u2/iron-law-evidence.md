# Iron Law evidence — tsk-3u2

## classifyIronLaw result

```json
{"required": true, "matchedFlags": [], "matchedModules": ["bin/fgos.mjs"]}
```

Genuine module match: `bin/fgos.mjs`'s `STORE_MISSING_WARNING_VERBS` set
changed. `src/state/graph-metrics.mjs` (also changed) is not itself on
the module list, but the whole diff lands in one commit.

Full changed-file set: `bin/fgos.mjs`, `src/state/graph-metrics.mjs`,
`test/cli/fgos.test.mjs`, `test/state/graph-metrics.test.mjs` —
implementation commit `cb91f63`, parent commit `ee58e62`.

## Test commands

```bash
node --test test/state/graph-metrics.test.mjs
node --test --test-name-pattern="schedule from a" test/cli/fgos.test.mjs
```

(The full `test/cli/fgos.test.mjs` suite takes ~150s; the name-pattern
scopes this evidence run to the one new test the fix actually touches.
The full suite was run once already, in-worktree, green: 541/541.)

## Failing before

Real execution: a temporary git worktree checked out at `ee58e62` (the
commit immediately before `cb91f63`), with only the NEW test files
(`git show cb91f63:test/{state/graph-metrics,cli/fgos}.test.mjs`) copied
in against the OLD `src/state/graph-metrics.mjs`/`bin/fgos.mjs`:

```
$ node --test test/state/graph-metrics.test.mjs
✖ detectCycles: a parent anchored by a child whose OWN deps points back at the parent is now caught (mixed parent-child + blocks cycle)
✖ detectCycles: a mergeAfter cycle (a deps on b, b mergeAfter a) is now caught (mixed blocks + waits-for cycle)
✖ detectCycles: a pure parent-child cycle (A parent B, B parent A -- never reachable via real fgos add, still checked) is caught
ℹ tests 64
ℹ pass 61
ℹ fail 3

$ node --test --test-name-pattern="schedule from a" test/cli/fgos.test.mjs
✖ schedule from a .fgos/-less linked worktree with no --dir warns on stderr, same as conflicts (tsk-3u2 regression guard)
ℹ tests 1
ℹ pass 0
ℹ fail 1
```

## Passing after

Same scratch worktree, `src/state/graph-metrics.mjs` and `bin/fgos.mjs`
replaced with the `cb91f63` versions (the real implementation):

```
$ node --test test/state/graph-metrics.test.mjs
ℹ tests 64
ℹ pass 64
ℹ fail 0

$ node --test --test-name-pattern="schedule from a" test/cli/fgos.test.mjs
✔ schedule from a .fgos/-less linked worktree with no --dir warns on stderr, same as conflicts (tsk-3u2 regression guard)
ℹ tests 1
ℹ pass 1
ℹ fail 0
```

The scratch worktree used to capture this was created and removed for
this evidence run only (`git worktree add`/`remove --force` against the
already-committed `ee58e62`/`cb91f63` commits) — no working-tree state
was altered.
