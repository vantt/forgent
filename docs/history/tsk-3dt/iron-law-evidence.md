# Iron Law evidence: tsk-3dt

`classifyIronLaw` on this item's real diff (`fgw/tsk-3dt` vs its resolved root
branch, computed from the real main checkout via
`changedFiles(repoRoot, item)`):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["bin/fgos.mjs", "src/runner/claim-port.mjs"]
}
```

`matchedFlags` is empty — nothing in this item's title or description trips a
risk keyword. `matchedModules` are both real and both deliberate:
`src/runner/claim-port.mjs` gains the worker-slot ceiling gate (the whole
point of the item — it is the single choke point every claim path funnels
through), and `bin/fgos.mjs` gains the two new verbs `slots` and `report`.
Neither is incidental; the item cannot be built without touching both.

## Honest gap: this was not failing-test-first development

The pure module (`src/state/worker-slots.mjs`) and the gate were written
first, with `test/state/worker-slots.test.mjs` written alongside them in the
same pass and run afterwards. No test was written red, watched fail for the
feature's own reason, and then made green. This file does not claim
otherwise.

What the run DID produce is a real red-before-green transcript, but it is
honest about what those reds proved. Two rounds of genuine failures were
caught and fixed:

1. **Test-harness misuse (4 red).** The first run of the new test file failed
   because `assert.throws` returns `undefined`, so every assertion reading
   `err.code`/`err.category` threw a `TypeError`. Notably, the sibling test
   that only asserted the item stayed at `todo` PASSED in that same run —
   which is what proved the gate itself was already working and the failures
   were the harness's, not the feature's.
2. **Repo-invariant gaps the plan had not anticipated (4 red).** The full
   suite refused the new module until it was registered properly:
   - `test/architecture.test.mjs` — a new `.mjs` needs a row in
     `docs/architecture-manifest.json`; without it both the one-to-one
     ledger test and the downward-import test failed.
   - `test/cli/fgos-manifest.test.mjs` — `requiresExistingStore` may only be
     true when `touchesState` is true; `slots` is a pure read, so both are
     now false.
   - `test/setup/checks.test.mjs` — the `config-not-stale` fixture
     enumerates every registered config-default section, so registering
     `workerSlots` legitimately broke it until the fixture was extended.

Those reds are real and were fixed at the root cause, not worked around. But
they proved registration and harness correctness, not the ceiling's own
behavior — so they are not a substitute for failing-test-first practice on
the feature itself.

## What was actually proven

The item's own verify command, both halves, run from the implementation
branch with a clean tree immediately before this evidence file was written.

First half:

```
$ node --test test/state/worker-slots.test.mjs
...
ℹ tests 25
ℹ suites 0
ℹ pass 25
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1265.915625
```

Second half:

```
$ npm test
...
ℹ tests 2990
ℹ suites 0
ℹ pass 2985
ℹ fail 0
ℹ cancelled 0
ℹ skipped 5
ℹ todo 0
ℹ duration_ms 52270.1305
```

(The 5 skips pre-exist this item's work and are unrelated to it. The
pre-change baseline on this same branch was `tests 2965 / pass 2960 / fail 0
/ skipped 5`, so this item adds 25 tests and removes none.)

The 25 new tests cover, specifically:

- **The pure fold (D2).** Empty view; a missing view entirely; only items at
  `doing` counted and never any other status; `sessionId`/`claimRole`
  surfaced; an item with no `writer` leaving `sessionId` undefined rather
  than throwing; `excludeId` omitting exactly one item.
- **The whole-batch rule (D8).** A `batchSize` of 5 with only 1 free slot
  still grants all 5 — a pre-computed batch is never split. At the ceiling,
  `granted` is 0 and `allowed` is false, which is what makes the overshoot
  self-bounding. Past the ceiling, `free` clamps at 0 instead of going
  negative.
- **Inert when unconfigured.** An absent, zero, negative, fractional, string,
  `null` or `NaN` ceiling all read as no ceiling. A claim succeeds with 20
  items already running when no `workerSlots` config exists — behavior
  identical to before the gate existed.
- **The gate firing uniformly.** Refusal at the ceiling for `isolate: false`
  (`take`, runner) and `isolate: true` (`pick`) alike, and for all three
  actors (`session`, `runner`, `human`) — a worker holds a slot regardless of
  who launched it or whether it got a worktree.
- **Refusal safety.** The error is `ClaimError` with code
  `worker-slot-ceiling` and category `validation`, so the runner halts one
  item instead of crashing its whole drain-run. The refusal lands before
  `moveWork`, leaving the item at `todo` rather than orphaned at `doing`.
- **The CLI port (decision 0014).** `fgos slots` reporting occupancy, the
  admin reservation, and both the no-ceiling and ceiling-reached cases.
  `fgos report` landing a closing report readable through `fgos show`, and
  supplying its own rationale when no stop reason is given.
- **The install gate.** `workerSlots` is registered through
  `registerConfigDefault` with the expected key and shape, so `fgos setup`
  writes it and `fgos doctor` can see it.

## A note on four flaky failures seen along the way

Earlier full-suite runs showed up to 4 failures, all of them lock-timeout
assertions in concurrency tests (`concurrent editWork calls on DIFFERENT
ids`, `concurrent movePorting calls on DIFFERENT ids`, `appendEvent under
concurrent OS processes`). They were confirmed environmental, not a
regression, by an explicit A/B rather than by assumption:

- Each file passed on its own (`test/state/store.test.mjs` 52/52,
  `test/state/porting-store.test.mjs` 14/14).
- With `test/state/worker-slots.test.mjs` moved out of the tree entirely, the
  same two concurrency tests still failed (`tests 2965 / fail 2`) — so the
  failures reproduce on the pre-change tree and are not caused by this item's
  code or by the subprocess load of its new tests.
- Machine load average was 33 during the failing runs and ~20 during the
  green run above. The assertions time out on a 2000ms `events.lock`
  acquisition, which is exactly what saturation starves.

## Not yet accepted

This evidence file is written and committed on the item's own branch. The
`--acknowledge-iron-law` decision belongs to a human and has NOT been taken
here: `fgos approve` was deliberately not run by the implementing session.
