# Iron Law evidence — tsk-67o

`classifyIronLaw` result on this item's committed diff:

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["bin/fgos.mjs"]
}
```

## Test command

`FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test test/cli/fgos-return.test.mjs test/runner/frozen-judge.test.mjs`

## Verification proof

`node --test test/cli/fgos-return.test.mjs test/runner/frozen-judge.test.mjs` passes 74/74 unit tests with 0 failures, including the new unit test specifically proving `RESEARCH.md` under `docsRef` is exempt from `footprintDiffHits`:

```
✔ return: the item's own docs/history/<feature>/RESEARCH.md (via docsRef) is exempt from footprintDiffHits (tsk-67o)
ℹ tests 74
ℹ suites 0
ℹ pass 74
ℹ fail 0
```
