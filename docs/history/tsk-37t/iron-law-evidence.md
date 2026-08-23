# tsk-37t — Iron Law evidence

`classifyIronLaw` result (against the real committed diff, `d719bb22`):

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/runner/claim-port.mjs","src/state/store.mjs"]}
```

## Test command

```
node --test test/state/store.test.mjs test/state/worker-slots.test.mjs test/runner/claim-port.test.mjs test/runner/claim-liveness.test.mjs
```

## Failing-before (old files, commit `b1e8e111`, new tests already in place)

```
✔ tsk-37t: a genuinely NEW claim still refuses when the repo is at ceiling, unchanged (the exemption never widens past reclaims)
✖ tsk-37t: a stale-claim reclaim succeeds even when the repo is already drifted past its worker-slot ceiling
✖ tsk-37t: addDecision throws "work <id> not found" for a nonexistent id, same shape editWork/moveWork already use
✔ tsk-37t: addDecision still succeeds when id names a real work item
✔ tsk-37t: addDecision with no id at all is still legitimate (a global decision not scoped to one item)
ℹ tests 75
ℹ pass 73
ℹ fail 2
```

Both regression tests fail against the old code, each in the exact
direction the bug predicts; the 3 tests that assert unrelated/unchanged
behavior (new claim still refused, valid id still works, no id still
works) stay green against the old code too, proving the two failing
tests isolate exactly these two bugs.

## Passing-after (real fix restored)

```
ℹ tests 111
ℹ pass 111
ℹ fail 0
```

(Full scoped verify — the item's own `verify` command — confirmed clean
before `fgos return`. Also cross-checked `test/intake/plan.test.mjs`
test/intake/discovery.test.mjs (128/128 pass) since `addDecision` is
called from `resolvePlan`/`resolveDiscovery` too.)
