# Plan: add the missing clean-tree gate to sync-root's no-parent merge

Item: `tsk-66t`. Mode: **high-risk** — no CONTEXT.md/`fgos-exploring` pass
exists for this item (its `clarify` verdict was clear, so the engine
(`resolveDiscovery`, `src/intake/discovery.mjs`) moved it straight from
`clarify` to `decompose`, the direct edge `DOMAINS.coding.transitions`
already carries — no gray area to lock, so no Socratic pass ran). Lane
decided here per `fgos-routing`'s own Mode-gate (direct-entry fallback:
neither a recorded `Mode:` line nor a handed-off lane existed yet). One
hard-gate flag applies: **data loss** — the bug this item fixes is a real
silent-data-loss path (another session's staged changes swept into a
merge commit on the shared main checkout). That alone forces `high-risk`
regardless of total flag count, per the Mode-gate's own rule.

## Evidence (verified directly against current code, not the item's
possibly-stale line numbers)

- `bin/fgos.mjs:39` imports `isWorkingTreeClean` from `src/runner/merge.mjs`
  aliased as `isMainTreeClean`; a local wrapper of the same name is defined
  at `bin/fgos.mjs:129-134` for `return`'s own subtree-scoped gate.
- `approve`'s local-merge branch gates on it before any git mutation
  (`bin/fgos.mjs:2907-2910`): `ownFileSet = buildOwnFileSet(runnerOwnDiff,
  item.footprint)` then `if (!isMainTreeClean(repoRoot, ownFileSet)) throw
  new StoreError('validation', ...)`. This one check covers BOTH of
  approve's own leaf-vs-root branches (it runs before the `if (rootId !==
  id)` split).
- `sync-root`'s case (`bin/fgos.mjs:3256` onward) has two branches:
  - `item.parent` truthy → `withMergeEphemeralWorktree(repoRoot,
    item.parent, ...)` — merges in a throwaway worktree, never touches the
    shared `repoRoot` directly. Out of this item's scope (item's own
    description already excludes this branch).
  - `item.parent` falsy (a root with no parent) → `return await
    runAndReport(repoRoot)` (`bin/fgos.mjs:3325`) — runs `git merge
    --no-commit --no-ff` and `git commit --no-edit` directly on the shared
    main checkout, with **no clean-tree check anywhere in this branch**.
    Confirmed by reading the full case body: the only pre-merge guards
    present are the branch-existence check and the Iron Law
    (`classifyIronLaw`) check — neither inspects working-tree cleanliness.
- `main-checkout-reset` (`bin/fgos.mjs:4108`) reuses the same whole-repo
  form, `isMainTreeClean(repoRoot)` with no `ownFileSet` — the third
  existing call site, confirming the whole-repo form (no ownFileSet) is
  already an established, reused shape for a verb with no meaningful "own
  file set" of its own — the same shape sync-root's no-parent branch needs
  (sync-root's own leaf branches, not the root, own any files; the root
  merge itself introduces nothing new to exempt).
- Live reproduction (already logged as a decision on this item,
  2026-08-09/10, from `tsk-3v2`'s own sync-root landing): `fgos sync-root`
  crashed with `Cannot read properties of undefined (reading 'output')`
  when the main checkout had uncommitted `.fgos/` changes —
  `mergeRunnerItem` returned `{outcome:'merge-failed-unclassified'}` (no
  `.check` field, `src/runner/merge.mjs:870`) and `runAndReport`'s success
  path unconditionally reads `result.check.output`, crashing instead of
  refusing cleanly. Adding the gate below prevents this crash too, by
  refusing before the merge is ever attempted — the same mechanism
  `approve` already relies on for this.

## Approach

1. `bin/fgos.mjs`, `case 'sync-root'`: immediately before `return await
   runAndReport(repoRoot);` (the no-parent branch only — the `item.parent`
   branch is untouched, per the evidence above), add the same gate
   `approve` already uses:
   ```js
   const ownFileSet = buildOwnFileSet(runnerOwnDiff, item.footprint);
   if (!isMainTreeClean(repoRoot, ownFileSet)) {
     throw new StoreError('validation', `sync-root: working tree at "${repoRoot}" is not clean — commit or stash pending changes before syncing "${id}".`);
   }
   ```
   `runnerOwnDiff` is already computed a few lines above (used for the
   Iron Law check) via `changedFiles(repoRoot, item, item.parent ? {
   trunk: targetBranch } : {})` — reused as-is, no new computation. This
   mirrors `approve`'s own gate byte-for-byte (same helper, same
   ownFileSet shape, same StoreError('validation') refusal), just
   attached to `sync-root`'s own no-parent branch instead.
2. No change to `merge.mjs`'s `mergeRunnerItem`/`runAndReport`'s own
   `merge-failed-unclassified` handling — out of scope (this item is
   about the missing gate, not the misclassification; the live
   reproduction above shows the gate alone prevents ever reaching that
   crash path for a dirty-tree cause).
3. `test/cli/fgos.test.mjs` (the item's own `verify` target), next to the
   existing sync-root suite (`bin/fgos.mjs:6108` onward, helpers
   `makeDriftedRoot`/`commitPendingBeforeApprove` already exist and are
   reused, not reinvented): one new test proving `sync-root` on a
   no-parent root refuses (exit 4, `StoreError('validation')`) when the
   shared main checkout carries an uncommitted foreign change — built with
   `makeDriftedRoot` but *without* calling `commitPendingBeforeApprove`
   (that helper is what every existing sync-root test uses to clear the
   tree first; skipping it is what leaves the tree dirty for this negative
   case) — then asserts the root's own `fgw/<id>` branch and `main`'s HEAD
   are both unchanged (no merge commit landed) and the foreign uncommitted
   file is still present untouched.

No split: this is one function-local gate plus one new regression test,
not independently workable pieces.

## Risk map

| Component | Risk | Proof |
|---|---|---|
| New gate on sync-root's no-parent branch | medium — every unattended `fgos merge next`/`merge-loop` root-sync now refuses instead of merging on a dirty shared checkout | New negative-path test (above), run against pre-fix code first to confirm it fails there (failing-test-first), then passes after the gate is added. Existing sync-root happy-path/nested-parent/decision tests (`bin/fgos.mjs:6151` onward) re-read and re-run unchanged — none of them leave the tree dirty going into the merge, so none should newly refuse. |
| Reused `buildOwnFileSet`/`isMainTreeClean` helpers | low — no change to either helper, only a new call site | `approve`'s own existing test coverage for these two helpers is untouched; this item adds a call, not a change, to shared code |
| `item.parent` (ephemeral-worktree) branch | none — explicitly out of scope, not touched | confirmed by direct code read (Evidence above): that branch never calls `runAndReport(repoRoot)` |

Impact-analysis posture: **degraded**. `fgos tool query --capability
impact-analysis --status present` reports GitNexus `present`. A direct
`impact({target:"isWorkingTreeClean", direction:"upstream"})` query against
the indexed `forgent` repo returned `not found` (0 impacted, `risk:
UNKNOWN`) — the index does not resolve this symbol (stale relative to
current `bin/fgos.mjs`, or a local-symbol indexing gap), a suspicious
zero-result per this repo's own impact-analysis gate, so it is not trusted
alone. Cross-checked directly instead: `grep -n "isMainTreeClean"
bin/fgos.mjs` plus a full read of the `sync-root` case body (Evidence
above) — this is the evidence this plan actually relies on.

## Outstanding questions

None
