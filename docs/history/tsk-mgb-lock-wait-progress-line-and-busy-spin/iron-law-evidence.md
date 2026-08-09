# Iron Law evidence — tsk-mgb

`classifyIronLaw` on this item's final diff returns:

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["src/runner/lock-wait.mjs"]
}
```

`src/runner/lock-wait.mjs` is on `MODULE_RULES` (`src/evolve/iron-law.mjs`)
as a self-modifying-capable module — the file this item's own diff
genuinely changes, not a description-keyword false positive.

## Failing-test-first proof

Two new tests:

- `withLockRetry: prints a progress line on the default (no explicit
  waitMs) path (tsk-mgb)`
- `withLockRetry: does not busy-spin in the BOUNDARY_GRACE_MS tail --
  bounded call count even for a tiny budget (tsk-mgb)`

### RED — run against the pre-fix code

Pre-fix `src/runner/lock-wait.mjs` restored from `git show
963debe^:<path>` (the parent of this item's own implementation commit):

```
$ node --test --test-name-pattern="tsk-mgb" test/runner/lock-wait.test.mjs

✖ withLockRetry: prints a progress line on the default (no explicit waitMs) path (tsk-mgb)
  AssertionError: the default (no --wait) path must still print at least one progress line during a real backoff wait

✖ withLockRetry: does not busy-spin in the BOUNDARY_GRACE_MS tail -- bounded call count even for a tiny budget (tsk-mgb)
  AssertionError: must not busy-spin in the grace-window tail (made 210 calls for a 10ms budget)

ℹ tests 2
ℹ pass 0
ℹ fail 2
```

Both failures are real and match the report's own live measurements: zero
progress lines on the default path, and the busy-spin test reproduced
**210 calls** for a 10ms budget (report's own live measurement: 233 calls
for a 3-second budget — same magnitude, same mechanism).

### GREEN — run against the fixed code

Restored `src/runner/lock-wait.mjs` to its post-fix state (`git diff
--stat` against the working tree was empty first, confirming
byte-identical recovery):

```
$ node --test --test-name-pattern="tsk-mgb" test/runner/lock-wait.test.mjs

still waiting on main-checkout lock (holder pid undefined, 0s elapsed)
✔ withLockRetry: prints a progress line on the default (no explicit waitMs) path (tsk-mgb)
still waiting on main-checkout lock (holder pid undefined, 0s elapsed)
✔ withLockRetry: does not busy-spin in the BOUNDARY_GRACE_MS tail -- bounded call count even for a tiny budget (tsk-mgb)

ℹ tests 2
ℹ pass 2
ℹ fail 0
```

The progress line is visible directly in the test's own stderr passthrough
above — live proof, not just an assertion pass.

### Full suite, post-fix

```
$ node --test test/runner/lock-wait.test.mjs
ℹ tests 10
ℹ pass 10
ℹ fail 0

$ npm test
ℹ tests 2745
ℹ pass 2740
ℹ fail 0
ℹ skipped 5
```

(One unrelated flake observed once during this item's own work session in
`test/state/events.test.mjs`'s concurrency stress test — an isolated
temp-dir test spawning 20×40 rapid file-lock operations, sensitive to this
machine's current load; did not reproduce on a clean re-run, and this
item never touches `src/state/events.mjs`.)

## Verification source

- `src/evolve/iron-law.mjs` — `classifyIronLaw`'s `MODULE_RULES` list,
  confirming `src/runner/` is self-modifying-capable and triggers
  `required: true` on a real files-changed match.
- The RED/GREEN transcripts above — both real command runs against real
  file contents swapped in/out on disk (`git show 963debe^:<path>` to
  `/tmp`, then restored from the working tree's own already-committed
  post-fix state), not paraphrased or fabricated.
- `docs/history/tsk-mgb-lock-wait-progress-line-and-busy-spin/CONTEXT.md`
  D0-D3 and `plan.md`'s risk map — the decisions and proof points this
  evidence satisfies.
