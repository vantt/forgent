# Iron Law Evidence — tsk-uio

## Matched Modules
- `bin/fgos.mjs`

## Verification Command
`node --test test/runner/claim-port.test.mjs`

## Failing-test-first proof

Reverse-applied only the `bin/fgos.mjs` half of commit `62d2609f`
(keeping the new tests), then ran the two liveness-dependent new tests
against the pre-fix code — the verb doesn't exist yet, so the CLI refuses
with "unknown verb":

```
✖ fgos unclaim refuses with a clear error naming holder when durable status is doing and activity is fresh (tsk-uio)
  AssertionError: expected /unclaim: claim for "doing-item" is held by/
  actual: 'fgos: unknown verb "unclaim". Usage: fgos <version|init|...>'

✖ fgos unclaim clears stale claim with {released:true, reason:"stale-liveness"} when durable status is doing and activity is stale (tsk-uio)
  AssertionError: Expected values to be strictly equal: 4 !== 0
```

Re-applied the `bin/fgos.mjs` change (tree returned to exactly the
committed state, confirmed via `git status --short`), reran the full
file:

```
ℹ tests 26
ℹ suites 0
ℹ pass 26
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 2146.933118
```

All 26 cases pass, including every pre-existing `claimWork`/
`isReclaimEligible` test, unchanged by this addition.
