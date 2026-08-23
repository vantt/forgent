# iron-law-evidence.md — tsk-34o

`classifyIronLaw` against the real committed diff (`trunk...branch`,
commits `2add8928`/`d81fd414` on `fgw/tsk-34o`):

```json
{
  "required": true,
  "matchedFlags": ["audit"],
  "matchedModules": ["bin/fgos.mjs"]
}
```

Files changed: `bin/fgos.mjs`, `docs/history/fgos-edit-role-flag/RESEARCH.md`,
`docs/history/fgos-edit-role-flag/plan.md`, `test/cli/fgos-edit.test.mjs`.

## Failing-test-first proof

Test command: `node --test --test-name-pattern="edit --role|edit omitting --role" test/cli/fgos-edit.test.mjs`

**Before** (`bin/fgos.mjs` at `HEAD`, `case 'edit'` still hardcoding
`role: 'human'`):

```
✖ edit --role session tags the stored event payload.role "session" instead of the default human (235.319983ms)
✔ edit omitting --role still stamps payload.role "human" -- unchanged default for every existing caller (237.733566ms)
✖ edit --role with an invalid value is rejected as validation, exit 4, no event written (228.274706ms)
ℹ tests 3
ℹ pass 1
ℹ fail 2

  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  'human' !== 'session'
  ...
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  0 !== 4
  ...
```

**After** (`bin/fgos.mjs` with the `--role` flag added, mirroring
`case 'take'`'s existing pattern):

```
✔ edit --role session tags the stored event payload.role "session" instead of the default human (234.86649ms)
✔ edit omitting --role still stamps payload.role "human" -- unchanged default for every existing caller (234.098042ms)
✔ edit --role with an invalid value is rejected as validation, exit 4, no event written (219.784895ms)
ℹ tests 3
ℹ pass 3
ℹ fail 0
```

Full suite after the fix: `npm test` → `3636 pass / 0 fail / 5 skipped`
(`tests 3641`).
