# Iron Law evidence — tsk-535

Per `docs/history/tsk-5t3-iron-law-evidence-contract/CONTEXT.md` D2: this
item's final diff, run through the same `classifyIronLaw` the `approve`
gate itself uses, comes back `required: true`.

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": [
    "bin/fgos.mjs",
    "src/runner/loop.mjs"
  ]
}
```

**Process note**: the pre-return check during `fgos-coding-implement` was run
BEFORE the source-code commit landed (against a stale/empty diff), and
incorrectly returned `required: false` — a mistake in this session's own
process, not a gap in `classifyIronLaw` itself. Caught at `approve` time,
which re-derives the same classification against the real committed diff.
This file is written after the fact, at `approve`, to correct that gap —
the evidence below is real, captured the same way it would have been had
the pre-return check run correctly the first time.

## Test command

```
node --test --test-name-pattern="missing required field \(--description\)" test/cli/fgos.test.mjs
node --test --test-name-pattern="tsk-535 D4" test/runner/loop.test.mjs
```

(two separate commands, one per matched module — `bin/fgos.mjs`'s new
`--description` requirement and `src/runner/loop.mjs`'s new discovered-work
fallback are independent changes with independent tests.)

## Failing-test-first proof (before the fix)

With `bin/fgos.mjs`'s `requireField(flags.description, ...)` temporarily
reverted to a bare `flags.description` passthrough, and `src/runner/
loop.mjs`'s fallback temporarily reverted to a bare `block.description`
passthrough:

```
✖ add with a missing required field (--description) is rejected as validation, exit 4, no event written (108.956726ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  0 !== 4
```

```
✖ tsk-535 D4: a fgos-discovered block with no description falls back to the block's own title, not undefined (123.899846ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected
  + undefined
  - 'Wire retry metrics into the dashboard'
```

## Passing proof (after the fix)

Restoring the real, committed `bin/fgos.mjs`/`src/runner/loop.mjs` (as
landed in commit `3d58ee3` on `fgw/tsk-535`), same two commands:

```
✔ add with a missing required field (--description) is rejected as validation, exit 4, no event written (109.198979ms)
```

```
✔ tsk-535 D4: a fgos-discovered block with no description falls back to the block's own title, not undefined (122.500156ms)
```

## Broader verify

The item's own recorded verify, `node --test test/cli/fgos.test.mjs
test/intake/plan.test.mjs test/runner/loop.test.mjs` (723 tests), is
green — confirmed at `fgos return` time.
