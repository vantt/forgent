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

## Replay scenarios

`scenarios/` holds reusable, repeatable task descriptions for exercising
fgOS's own workflow against this fixture (submit → clarify → decompose →
executing → return → review), sized to reliably hit specific lifecycle
shapes without ballooning runtime. See `scenarios/expr-eval-chain.md` for
the current one (multi-child decompose with a `deps` chain, used for MVP2
interactive-vs-headless parity testing).

Each scenario documents its own reset step. Generic pattern:

```sh
npm run reset:<scenario-name>
```
