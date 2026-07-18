# dogfood-fixture

This is a synthetic dogfood/testbed fixture for feature `fgos-sample-testbed`
(backlog P59). It is **not real forgent product code**.

It exists to be operated on by fgOS's own work-item workflow
(submit → clarify → decompose → dispatch → worker → verify) as a controlled,
repeatable proof of operational capability. It is version-tracked and durable
(kept, not throwaway) — see `docs/history/fgos-sample-testbed/CONTEXT.md`
decisions D2/D3.

It lives outside `repo/test/` deliberately, so it is never swept into
forgent's own `npm test` glob.

## Running

```sh
cd repo/dogfood-fixture
npm test
```
