# Iron Law evidence — tsk-3bh

Classification (`classifyIronLaw`, `src/evolve/iron-law.mjs`, run against the
real committed diff `trunk...fgw/tsk-3bh` via `changedFiles('.', item)`):

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/runner/dispatch/cli.mjs","src/runner/worktree.mjs"]}
```

`required: true` because the change touches two modules on the Iron Law's
protected-module list (`src/runner/dispatch/cli.mjs`,
`src/runner/worktree.mjs`) — no keyword flag matched, the module list alone
tripped it.

## Test command

```
node --test test/runner/dispatch.test.mjs
```

(item's own recorded `verify`; the new coverage for this change also lives
in `test/runner/worktree.test.mjs`, run together below for the full
failing-before/passing-after proof.)

## Failing-before proof

The two new tests did not exist before this item's implementation commit
(`c1829235`); its parent (`6d35885`, the discovery+planning docs commit)
has neither `checkoutDirtyPaths` in `src/runner/worktree.mjs` nor the
`lostUncommittedPaths` field in `src/runner/dispatch/cli.mjs`. Proven by
checking out a detached worktree at `6d35885`, applying only the new test
diff (`git diff 6d35885 c1829235 -- test/runner/dispatch.test.mjs
test/runner/worktree.test.mjs`) on top of the OLD source, and running the
new tests there:

```
$ node --test --test-name-pattern="lostUncommittedPaths|checkoutDirtyPaths" test/runner/dispatch.test.mjs test/runner/worktree.test.mjs

✖ executeExecutorCli attaches lostUncommittedPaths and prints stderr warning when out-of-process dispatch reverts uncommitted changes (52.333332ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected

  + undefined
  - [
  -   'plan.md'
  - ]

file:///.../test/runner/worktree.test.mjs:22
  checkoutDirtyPaths,
  ^^^^^^^^^^^^^^^^^^
SyntaxError: The requested module '../../src/runner/worktree.mjs' does not provide an export named 'checkoutDirtyPaths'

ℹ tests 3
ℹ pass 1
ℹ fail 2
```

(The third new test, "omits lostUncommittedPaths when dispatch is clean or
adapter commits changes", passes even before the change — the absent field
is the pre-existing behavior too, so it is a non-regression assertion, not
a fail-before case; the count above reflects `dispatch.test.mjs`'s 2 new
tests running, plus `worktree.test.mjs` failing to even load as a whole
file over the missing export.)

## Passing-after proof

Same command, same test-name filter, run against the real, current,
committed implementation (`c1829235`):

```
$ node --test --test-name-pattern="lostUncommittedPaths|checkoutDirtyPaths" test/runner/dispatch.test.mjs test/runner/worktree.test.mjs

fgos: warning: uncommitted path(s) lost across out-of-process dispatch: plan.md
✔ executeExecutorCli attaches lostUncommittedPaths and prints stderr warning when out-of-process dispatch reverts uncommitted changes (51.04253ms)
✔ executeExecutorCli omits lostUncommittedPaths when dispatch is clean or adapter commits changes (110.127142ms)
✔ checkoutDirtyPaths returns relative dirty paths excluding .fgos artifacts (21.163463ms)
✔ checkoutDirtyPaths returns empty array on invalid directory or git error (2.009116ms)

ℹ tests 4
ℹ pass 4
ℹ fail 0
```

Full item verify command, independently re-run by the driver (not taken on
the dispatched worker's own say-so):

```
$ node --test test/runner/dispatch.test.mjs
ℹ tests 311
ℹ pass 311
ℹ fail 0
```

```
$ node --test test/runner/dispatch.test.mjs test/runner/worktree.test.mjs
ℹ tests 380
ℹ pass 380
ℹ fail 0
```
