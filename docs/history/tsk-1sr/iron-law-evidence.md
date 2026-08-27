# Iron Law Evidence — tsk-1sr

## Matched Modules
- `src/state/store.mjs`

## Verification Command
`node --test test/state/runtime-coordination.test.mjs`

## Failing-test-first proof

Reverse-applied only the `src/state/store.mjs` half of commit `ea523f9c`
(keeping the new test), then ran the new test against the pre-fix code —
reproduces the exact real-world error tsk-1sr's own incident report
describes ("settleClaim: item ... durable revision changed from ... to
..."):

```
✖ settleClaim reconciles a same-writer drift caused by a post-claim work.add event (wipe+resubmit shape) (22.149632ms)
  Error [StoreError]: settleClaim: item "tsk-1" durable revision changed from "342f6df4f1b1a7be" to "3a17c140f7d93209".
      at file:///.../src/state/store.mjs:1196:19
...
ℹ tests 26
ℹ pass 25
ℹ fail 1
```

Re-applied the `store.mjs` change (tree returned to exactly the committed
state, confirmed via `git status --short`), reran the full suite:

```
ℹ tests 26
ℹ suites 0
ℹ pass 26
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 876.129698
```

All 26 cases pass, including the two tests whose fixtures depend on
CURRENT (unchanged) behavior — unstamped `decision`/`gate-approve` side-log
events still reconcile, and an unstamped `work.attempt` still fails
closed.
