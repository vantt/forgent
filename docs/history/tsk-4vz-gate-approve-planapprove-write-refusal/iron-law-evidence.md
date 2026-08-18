# Iron Law evidence — tsk-4vz

`classifyIronLaw` on this item's final committed diff returns:

```json
{
  "required": true,
  "matchedFlags": ["audit"],
  "matchedModules": ["bin/fgos.mjs"]
}
```

Unlike `tsk-2tk`/`tsk-3rg`, this one is a REAL trigger, not only a
description-keyword false positive: `bin/fgos.mjs` is on
`MODULE_RULES`'s self-modifying-capable list (`src/evolve/iron-law.mjs:23`,
`{ kind: 'equals', value: 'bin/fgos.mjs' }`) — the entire CLI entry file
deliberately stands in for "the evolve verb" per that file's own header
comment (D13, over-reporting is the safe direction). So `matchedModules`
is correct on its own; `matchedFlags: ["audit"]` is the same
description-keyword shape `tsk-2tk`'s evidence already documented (the
word appears in this item's own description, "đã audit trong tsk-2tk",
not describing a real audit of this diff) — both together still mean
`required: true`, and this item owes a real failing-test-first proof.

## Failing-test-first proof

Verify command: `node --test test/cli/fgos-gate-approve.test.mjs`

**Before** (the guard clause temporarily removed from `bin/fgos.mjs`'s
`case 'gate-approve':`, real transcript):

```
✔ gate-approve still accepts "contextApprove", the live exploring gate, exit 0 (159.768996ms)
ℹ tests 3
ℹ pass 2
ℹ fail 1

✖ failing tests:

test at test/cli/fgos-gate-approve.test.mjs:7:1
✖ gate-approve rejects the retired "planApprove" gate name, exit 4 (validation), no event written (tsk-4vz) (170.966103ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

  0 !== 4

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-4vz-jflVcc/test/cli/fgos-gate-approve.test.mjs:12:10)
```

**After** (the guard clause restored, real transcript):

```
✔ gate-approve rejects the retired "planApprove" gate name, exit 4 (validation), no event written (tsk-4vz) (159.344829ms)
✔ gate-approve still accepts "validateApprove", the live merged gate, exit 0 (169.772426ms)
✔ gate-approve still accepts "contextApprove", the live exploring gate, exit 0 (157.311548ms)
ℹ tests 3
ℹ pass 3
ℹ fail 0
```

`git diff bin/fgos.mjs` after restoring confirmed byte-identical to the
already-committed version — the revert-and-restore cycle introduced no
drift.

## Blast radius (why `bin/fgos.mjs` module-rule hit is expected, not alarming)

The only change inside `bin/fgos.mjs` is the new `if (gate ===
'planApprove') throw ...` guard, placed before the existing
`recordGateApprove` call — no other branch of the `gate-approve` case, and
no other verb, is touched. `node --test test/state/store.test.mjs
test/intake/plan.test.mjs` (138/138, unchanged counts from before this
item) confirms the storage layer and every existing fixture using
`recordGateApprove` with `gate: 'planApprove'` still work exactly as
before — this diff narrows only the CLI verb's own accepted input, not
`recordGateApprove`'s real signature or behavior.

## Verification source

- `src/evolve/iron-law.mjs:23` read directly — confirms `bin/fgos.mjs` is
  on `MODULE_RULES` by design (D13), not a bug in the classifier.
- Real `node --test` transcripts above, captured by temporarily removing
  and restoring the guard clause in this same worktree.
- `test/state/store.test.mjs`, `test/intake/plan.test.mjs` — 138/138
  unchanged, confirms no collateral blast radius beyond the one guard
  clause.
