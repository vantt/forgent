# Iron Law evidence — tsk-oet

Classified via `classifyIronLaw` against the real committed diff
(`8607438e`, `fix(state): add opt-out gate for opportunistic main
checkout checks (tsk-oet)`):

```json
{
  "required": true,
  "matchedFlags": ["delete"],
  "matchedModules": []
}
```

The `delete` flag matched on the literal `delete
process.env.FGOS_DISABLE_OPPORTUNISTIC_CHECKS` lines added to
`test/state/events-jsonl-truncation-guard.test.mjs` and
`test/runner/claim-port.test.mjs` (unsetting the new opt-out locally so
those two files keep exercising the real feature) — not a data-deletion
change; the guard fires on the keyword, not the semantics.

Test command: `npm test`

## Failing-before (captured this same session, before any fix — checkout
at `main`'s pre-fix `HEAD`, commit `b354b996`)

```
✖ recheck-blocked verb: a blocked item whose recorded commit is no longer reachable (force-pushed away) is reported stillBlocked, never resolvable
✖ return: a .fgos/* change bundled into the item's own commit (git add -A sweeping in take's own event-log write) is exempt from footprintDiffHits (tsk-x5r self-exempt)
  AssertionError [ERR_ASSERTION]: a .fgos/* change bundled into the item's own commit must never be flagged
  + [ { file: '.fgos/events-jsonl.truncation-guard.json' } ]
  - []
✖ return succeeds when ONLY .fgos/ (the live event log) is dirty — its own take/return writes are excluded from the clean-tree gate (no more manual events.jsonl commit before every return)
  AssertionError [ERR_ASSERTION]: sanity: .fgos/ must be the ONLY dirty path at this point
  3 !== 1
✖ return succeeds after a FIRST pick (todo -> doing, no prior blocked branch) ... a fresh pick claim records branchHeadAtTake exactly like a blocked reclaim does, so return recognizes the branch's own progress instead of checking the (unchanged) main checkout
  AssertionError [ERR_ASSERTION]: return never advances or touches the human's own main checkout
  + '58fb433cab65006553316f27ca445cd6458fb1c6'
  - '7426ccbb4e58309f897f2f649dda81f77308bbcd'
✖ e2e S2-pull: submit pass-throughs 2 stages via discover, a human takes the frontier head, a concurrent fgos-runner --once never stomps the human-held claim, then the human commits real progress and returns to proposed
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + 'b5ac5b333b705bfedb8e0811b1d888d4822c77c0'
  - '74415a63fda47de08a6f12c0c1999d5cb966ec80'
```

(7 failures total across `test/cli/fgos-take.test.mjs`,
`test/cli/fgos-read.test.mjs`, `test/cli/fgos-return.test.mjs`,
`test/e2e/runner-loop.test.mjs` — full command run:
`node --test test/cli/fgos-take.test.mjs test/cli/fgos-read.test.mjs
test/cli/fgos-return.test.mjs test/e2e/runner-loop.test.mjs`)

## Passing-after (independently re-run this session, post-fix, full suite)

```
ℹ tests 3777
ℹ suites 0
ℹ pass 3772
ℹ fail 0
ℹ cancelled 0
ℹ skipped 5
ℹ todo 0
ℹ duration_ms 178261.971829
```

Full `npm test` run, independent of the dispatched worker's own
self-reported result (which matched exactly: 3772 pass / 0 fail / 5
skipped) — re-run directly in this session against the worker's real
committed diff, not taken on the worker's say-so.
