# Iron Law evidence — tsk-5fs

`classifyIronLaw({ filesChanged, description })` result:

```json
{
  "required": true,
  "matchedFlags": ["schema"],
  "matchedModules": ["bin/fgos.mjs", "src/state/store.mjs"]
}
```

Test command: `bash docs/history/submit-add-field-parity-goaltier-editable/verify.sh`

## Failing-before

Run against the pre-implementation codebase (during `fgos-coding-exploring`, before
either `bin/fgos.mjs` or `src/state/store.mjs` were touched):

```
$ bash docs/history/submit-add-field-parity-goaltier-editable/verify.sh; echo "exit: $?"
D1 FAIL: submit field refs got [] want ["a","b"]
exit: 1
```

## Passing-after

Run after the real implementation (D1: `submit`'s 6 new flags + `submitWork`
threading them, `refs: []` -> `opts.refs ?? []`; D2: `EDITABLE_FIELDS` gains
`goalTier`, `edit` case gains a `--goal-tier` one-off block):

```
$ bash docs/history/submit-add-field-parity-goaltier-editable/verify.sh; echo "exit: $?"
OK
exit: 0
```

Full regression suite also run clean after the implementation: `npm test`
— 2538 pass, 0 fail, 5 skip (pre-existing skips, unrelated to this item).
