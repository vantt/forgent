# tsk-63jf — Iron Law evidence

`classifyIronLaw` result (against the real committed diff, `6eabb321`):

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/state/status-fsm.mjs"]}
```

Text-only comment change, but `src/state/status-fsm.mjs` matches the
Iron Law's `equals` module rule regardless of what changed inside it —
the item's own description already named this.

## Test command

```
node --test test/state/fsm.test.mjs && grep -q 'isResolvedStatus' plugins/fgOS/skills/merge-loop/SKILL.md && ! grep -q 'TAIL_RESOLVED_STATUSES' plugins/fgOS/skills/merge-loop/SKILL.md && grep -q 'awaiting-approval. directly' src/state/status-fsm.mjs && ! grep -q 'proposed. directly' src/state/status-fsm.mjs
```

## Failing-before (old `status-fsm.mjs`, commit `171ffc8e`)

The POSITIVE half of the verify fails directly:

```
$ grep -q 'awaiting-approval. directly' src/state/status-fsm.mjs
exit 1
```

(the old comment still reads `...needs to return to\n// \`proposed\`
directly...` — the exact stale text the item was filed against).

## Passing-after (real fix restored)

```
ℹ tests 48
ℹ pass 48
ℹ fail 0
exit: 0
```

Full verify command (test run + both grep checks) confirmed clean before
`fgos return`.
