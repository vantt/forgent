# tsk-1xx — Iron Law evidence

Per `docs/history/tsk-5t3-iron-law-evidence-contract/CONTEXT.md`: this
item's diff touches `bin/fgos.mjs` and `src/state/store.mjs` — both literal
`equals` entries in `classifyIronLaw`'s `MODULE_RULES` — and the item's own
description contains the word "audit" (from "STR92 (2026-07-23 audit)"),
matching a `HEAVY_KEYWORDS` entry.

## classifyIronLaw result

```json
{
  "required": true,
  "matchedFlags": ["audit"],
  "matchedModules": ["bin/fgos.mjs", "src/state/store.mjs"]
}
```

(`matchedModules` computed by inspection against `MODULE_RULES`'
literal-equals entries for both files, since `changedFiles` reads
committed branch history via `git diff main...fgw/tsk-1xx` — the fix is
committed in the same commit as this evidence file, per D3, so both are
real at commit time.)

## Test command

```
node --test --test-name-pattern="parent" test/state/store.test.mjs test/cli/fgos.test.mjs
```

(the 8 tests added by this fix; narrower than the item's full `npm test`
verify command, isolating exactly the new capability for this proof)

## Before (red) — production fix reverted via `git apply -R` on the uncommitted `bin/fgos.mjs`/`src/cli/command-registry.mjs`/`src/state/store.mjs` diff, test files left in place

```
✖ add --parent sets lineage; omitting --parent leaves it unset
✖ add --parent "" (bare, no value) is rejected as a valueless flag, same as add --discovered-from
✖ edit omitting --parent leaves it untouched; an explicit --parent sets it; --parent "" clears it
✖ edit --parent (bare, no value) is rejected as a valueless flag, distinct from --parent ""
✖ edit --parent closing a cycle is rejected at the CLI, same "graph cycle" message as the store-layer test
✖ a MIXED cycle closed by an editWork patch that changes ONLY parent (no deps involved) is rejected
  Error [StoreError]: edit cannot change "parent" — allowed fields are: title, kind, risk, verify, tier, refs, deps, acceptance, priority, intent, docsRef.
✖ editWork can set parent on an item that had none — accepted when it introduces no cycle
  Error [StoreError]: edit cannot change "parent" — allowed fields are: title, kind, risk, verify, tier, refs, deps, acceptance, priority, intent, docsRef.
✖ editWork patch { parent: null } clears an existing parent (edit --parent "" clear semantics, D2)
  Error [StoreError]: edit cannot change "parent" — allowed fields are: title, kind, risk, verify, tier, refs, deps, acceptance, priority, intent, docsRef.
...
ℹ tests 12
ℹ pass 4
ℹ fail 8
```

The 4 pre-existing `parent`-name-matched tests that stayed green in this
red run (`a MIXED cycle (deps edge + parent-child edge) is rejected at
addWork`, `a MIXED cycle closed by an editWork patch is rejected [...]`,
`a PURE parent-child cycle is rejected [...]`, `a valid parent chain (no
cycle) is still accepted [...]`) don't touch the new capability — they
exercise `addWork`'s pre-existing parent-cycle guard and a deps-patch
closing a cycle, both unaffected by `EDITABLE_FIELDS` gaining `parent`.

## After (green) — fix restored via `git apply` (the saved diff)

```
ℹ tests 12
ℹ pass 12
ℹ fail 0
```

Full `npm test` on the restored fix: 1922/1927 pass, 0 fail, 5 skipped
(pre-existing skips, unrelated to this item).

Full `test/cli/fgos.test.mjs` suite (450 tests, includes the 5 new
`--parent` CLI tests among the pre-existing `add`/`edit`/lock/worktree
coverage): 450/450 pass, 0 fail.
