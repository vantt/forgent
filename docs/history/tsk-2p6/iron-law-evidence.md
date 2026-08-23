# tsk-2p6 — Iron Law evidence

`classifyIronLaw` result (against the real committed diff, `e69af453`):

```json
{"required":true,"matchedFlags":[],"matchedModules":["bin/fgos.mjs","src/state/store.mjs"]}
```

## Test command

```
node --test test/state/store.test.mjs test/cli/fgos-approve.test.mjs
```

## Failing-before (old files, commit `13d863d2`, new tests already in place)

`test/state/store.test.mjs` fails to even load against the old `store.mjs`
(`assertPlanEvidence` is not exported yet — an import error, not a clean
test failure, itself proof the function didn't exist). The CLI-level
regression test isolates the real bug cleanly:

```
✖ approve on a risk:heavy runner-sourced item with no plan.md on its branch is refused BEFORE the real git merge: precondition, main HEAD unchanged, item stays awaiting-approval
  AssertionError: fgos: no runner config found ...
  0 !== 2
✔ approve on a risk:heavy runner-sourced item that DOES carry a plan.md on its branch succeeds normally
ℹ tests 66
ℹ pass 65
ℹ fail 1
```

`approve` returns exit 0 (success) against the old code for a risk:heavy
item with no plan.md at all — no refusal happens; the "succeeds normally"
sibling test passes against old code too (expected: old code never gated
on plan.md either way, so a plan.md-carrying item always succeeded).

## Passing-after (real fix restored)

```
ℹ tests 125
ℹ pass 125
ℹ fail 0
```

(Full scoped verify — the item's own `verify` command — confirmed clean
before `fgos return`. Also cross-checked `test/cli/fgos-post-merge.test.mjs`,
`test/cli/fgos-gate-approve.test.mjs`, `test/state/backward-compat.test.mjs`,
`test/state/gate-bypass.test.mjs`, `test/e2e/self-improve-loop.test.mjs`
— 123/123 pass — since this gate sits on the shared `delivered` transition
path many other tests also exercise.)
