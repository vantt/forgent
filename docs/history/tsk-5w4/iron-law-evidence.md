# tsk-5w4 — Iron Law failing-test-first evidence

`classifyIronLaw` result: `required: true`, `matchedModules: ["bin/fgos.mjs"]`, `matchedFlags: []`.

## Test command

`npm test` (also run scoped: `node --test test/cli/fgos.test.mjs test/e2e/compound-learn-lifecycle.test.mjs test/e2e/pr-gate.test.mjs test/e2e/rebuild-determinism.test.mjs test/e2e/runner-loop.test.mjs test/e2e/self-improve-loop.test.mjs test/e2e/synthetic-domain.test.mjs`)

## Failing-before (real transcript excerpt, before this item's `bin/fgos.mjs` edit)

Full suite, before `case 'approve'`'s `to: 'delivered'` retarget (still `to: 'done'`, an edge `fsm.mjs` no longer declares since `tsk-5e9`):

```
✖ approve of a runner item (happy path): merges fgw/<id> into main, verifies, awaiting-approval -> done with role human, and cleans up the branch (451.360498ms)
✖ approve of a pull-door item (no merge, code already on main): re-verifies and closes awaiting-approval -> done with role human (426.205421ms)
✖ approve --github --pr on a fake gh merge success transitions the item awaiting-approval -> done with role human (450.989219ms)
✖ approve of the same self-modifying diff PROCEEDS with --acknowledge-iron-law: merges, verifies, awaiting-approval -> done, branch cleaned up (436.609642ms)
...
ℹ tests 464
ℹ pass 438
ℹ fail 26
```

Plus 6 e2e files failing for the same root cause (`bin/fgos.mjs`'s `approve` targeting a retired edge): `compound-learn-lifecycle` (2/2 fail), `pr-gate` (3/6 fail), `rebuild-determinism` (1/3 fail), `runner-loop` (1/14 fail), `self-improve-loop` (1/1 fail), `synthetic-domain` (1/3 fail) — 77 failures total across the full suite before this item's fix.

## Passing-after (real transcript excerpt, after the fix)

```
ℹ tests 493
ℹ suites 0
ℹ pass 493
ℹ fail 0
```

(`test/cli/fgos.test.mjs` + the 6 e2e files listed above, combined run.)

Full `npm test` after: `tests 2129 / pass 2124 / fail 0` (5 skipped, none failing).

## What changed

`bin/fgos.mjs`'s `case 'approve'` — all 4 close paths (GitHub merge, leaf merge into `fgw/<root>`, root merge into main, pull-door/legacy verify-only) retargeted from `moveWork(..., to: 'done', ...)` to `to: 'delivered'`, matching `fsm.mjs`'s new one-remaining-door-into-done shape (`cleanup -> done`) landed by `tsk-5e9`. `FINAL_STATUSES` (missing-outcome nag) extended with `delivered`/`retrospective`/`cleanup`.
