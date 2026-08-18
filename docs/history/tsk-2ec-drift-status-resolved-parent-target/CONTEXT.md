# CONTEXT: drift-status targets a done root's dead branch

Item: `tsk-2ec`. Written retroactively (same structural gap as this scan's
other items).

## Locked decisions

- **D0.** Root cause confirmed by reading `src/state/drift-status.mjs:65`
  in full: `targetBranch = rootItem?.parent ? \`fgw/${rootItem.parent}\` :
  trunk` — picks the parent's own branch as the sync target whenever a
  `parent` field is set, with no check on the parent's own resolved
  status. Live evidence (`fgos doctor`): `tsk-4n7` (parent `tsk-19y`,
  itself `status: done`, fully merged into `main` and frozen since
  2026-08-07) computes `target: fgw/tsk-19y` — a branch that still exists
  on disk (worktrees/branches are never torn down promptly after merge,
  per this scan's own finding 19) but is permanently frozen, since nothing
  further is meant to land there. `git rev-list --left-right --count
  main...fgw/tsk-19y` → `340 0` (fully merged, `behind: 0`); the same
  check against `fgw/tsk-4n7` → `9 4` (nearly current with `main`
  directly). The diagnostic signature is exactly `behind: 0, ahead:
  N-large` against the parent branch — ordinary drift always has
  `behind > 0` (the real target kept moving).
- **D1.** Fix: when `rootItem.parent` resolves to an item whose own status
  `isResolvedStatus` (already imported, already used at :93 for
  `needsSync`) reports as resolved, target `trunk` directly instead of
  `fgw/<parentId>` — the parent's own branch is no longer a legitimate
  sync target once the parent itself is closed out. This is the same
  predicate the module already trusts for the analogous "is this branch
  still an active destination" question, applied one level earlier in the
  same computation, not a new concept.
- **D2.** Existing test `'driftStatus: a nested root targets fgw/<parentId>,
  not main'` (`:111-135`) is unaffected: its `grandroot` item uses the
  default `status: 'doing'` (unresolved), so `isResolvedStatus` stays
  false there and the target computation is byte-identical to before.
  This item's own new test is the first to exercise a root whose PARENT
  is itself resolved — the actual gap.

## Outstanding questions

None
