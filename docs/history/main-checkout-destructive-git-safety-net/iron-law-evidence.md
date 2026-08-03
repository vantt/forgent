# tsk-3au — Iron Law evidence

`classifyIronLaw` result on this item's diff (`changedFiles`,
`src/runner/merge.mjs`):

```json
{"required":true,"matchedFlags":["sự cố"],"matchedModules":[]}
```

Required: true — the item's own description matched the `"sự cố"`
(incident) flag `src/evolve/iron-law.mjs`'s `TITLE_FLAGS` scans for.

## Test command

`node --test test/runner/main-checkout-reset-guard.test.mjs`

## Failing-test-first proof

The test file was committed during `clarify` (D2's gate note,
`CONTEXT.md`), before `src/runner/main-checkout-reset-guard.mjs` existed —
run then, real output:

### Before the fix — fails as expected

```
node:internal/modules/esm/resolve:275
    throw new ERR_MODULE_NOT_FOUND(...)
...
code: 'ERR_MODULE_NOT_FOUND',
  url: 'file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-3au-ff81xl/src/runner/main-checkout-reset-guard.mjs'
}

Node.js v24.18.0
✖ test/runner/main-checkout-reset-guard.test.mjs (35.041838ms)
ℹ tests 1
ℹ pass 0
ℹ fail 1
```

### After the fix — passes

```
✔ refuses a destructive main-checkout reset when the tree is dirty and unconfirmed (0.949802ms)
✔ allows the reset once the caller has confirmed after seeing full git status (0.275741ms)
✔ allows the reset outright when the tree is already clean (0.10672ms)
ℹ tests 3
ℹ pass 3
ℹ fail 0
```

## End-to-end proof (CLI verb, not just the pure guard function)

Real subprocess run against a scratch git repo (not the guard's unit test —
the actual `fgos main-checkout-reset` CLI verb, `bin/fgos.mjs`):

```
--- expect REFUSE (dirty, no confirm) ---
fgos: main-checkout-reset: Main checkout has uncommitted changes (full git status, not just the files you meant to touch) — refusing to reset --hard without --confirm. Review the status output, then re-run with --confirm once you are sure none of it belongs to another in-flight session.

Full git status (main checkout, whole repo):
?? .fgos/
?? untracked.txt
--- expect SUCCEED with --confirm ---
{
  "data": { "sha": "f44a00e...", "wasDirty": true, "confirmed": true }
}
--- verify HEAD really reset ---
f44a00e56575afbb03adf5a3565950d1ebe1caf9
expected: f44a00e56575afbb03adf5a3565950d1ebe1caf9
```

## Regression check

`node --test test/cli/fgos.test.mjs` — 517/517 pass, no regression from the
new `main-checkout-reset` dispatch case added to `bin/fgos.mjs`'s existing
switch.
