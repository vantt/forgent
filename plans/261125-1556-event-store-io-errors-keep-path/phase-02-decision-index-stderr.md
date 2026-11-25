# Phase 2: decision-index tests print the child's stderr

Capability: `code:implement`.

## Inputs

- `test/report/decision-index.test.mjs`, the `run` helper (line ~39) and the CLI tests from line ~162.
- Backlog row `plans/backlog/p-cg4w6nn5l6-event-store-io-errors-drop-the-path-and-the.md` ("Done when", second clause).

## Footprint

- `test/report/decision-index.test.mjs`

## Steps

1. Give every `assert.equal(<child>.status, N)` in the file the child's stderr as its message, for example
   `assert.equal(result.status, 0, result.stderr)`; for the inline `run(...).status` forms, bind the result first. Do
   not change what is asserted.
2. Keep the change to messages only; no new test.

## Verify

```bash
node --test test/report/decision-index.test.mjs
grep -nE "assert\.equal\(run\([^)]*\)\.status, [0-9]+\)" test/report/decision-index.test.mjs
```

Pass: the tests are green and the grep prints nothing.

## Rollback

Revert this phase's commit.
