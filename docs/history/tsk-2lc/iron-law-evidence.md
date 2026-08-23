# tsk-2lc — Iron Law evidence

`classifyIronLaw` result (against the real committed diff, `d403d28b`):

```json
{"required":true,"matchedFlags":["audit"],"matchedModules":["bin/fgos.mjs"]}
```

## Test command

```
node --test test/cli/fgos-move.test.mjs
```

## Failing-before (old `bin/fgos.mjs`, commit `4e32e953`, new tests already in place)

```
✖ move --to wontfix from awaiting-human succeeds when --answer is supplied, closing a moot question without fabricating a resume
  AssertionError: fgos: transitionWork: "answer" is required and must be a non-empty string when resuming work "move-wontfix-from-ask" from awaiting-human.
  4 !== 0
✔ move --to wontfix from awaiting-human still refuses with no --answer, same validation shape as before this item
ℹ tests 12
ℹ pass 11
ℹ fail 1
```

## Passing-after (real fix restored)

```
ℹ tests 12
ℹ pass 12
ℹ fail 0
```
