# Plan: add the missing clean-tree gate to sync-root's no-parent merge

Item: `tsk-66t`. Mode: **high-risk** — no CONTEXT.md/`fgos-coding-exploring` pass
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
  (`bin/fgos.mjs:2914-2916`): `ownFileSet = buildOwnFileSet(runnerOwnDiff,
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
    runAndReport(repoRoot)` (`bin/fgos.mjs:3340`) — runs `git merge
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
- **fgos-coding-validating finding (this round):** `fgos merge next` never calls a
  separate sync-root implementation — it dispatches through the same verb
  (`const syncResult = await runVerb('sync-root', flags, [rootId], dir);`,
  `bin/fgos.mjs:2010`), wrapped in a `try { ... } catch (err) { if (err
  instanceof StoreError && err.message.includes('Iron Law')) { return {
  picked: rootId, blocked: 'iron-law', message: err.message, syncRoot: {
  id: rootId } }; } throw err; }` (`bin/fgos.mjs:2009,2033-2038`). Only an
  Iron Law `StoreError` is recognized; any other thrown `StoreError` —
  including the new dirty-tree gate below, thrown the same way — falls to
  `throw err`, propagating to the CLI's top-level handler as a generic
  exit-4 error envelope (`bin/fgos.mjs:4416`,
  `process.exitCode = EXIT_CODES[categoryOf(err)] ?? 1`) instead of the
  graceful `{picked, blocked, syncRoot}` shape. `plugins/fgOS/skills/merge-
  loop/SKILL.md:105-114` documents that shape (`iron-law` /
  `merge-conflict` / `fgos-write-rejected` / `verify-fail`, alongside an
  `approve`-reported block) as exactly what its own same-id-blocked-twice
  stop rule parses — an uncaught error here is a shape merge-loop's own
  driving logic has no rule for, undermining the unattended-loop scenario
  this item's own description names. This item's fix must also teach this
  one catch block the new failure, not just add the gate itself.

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
2. `bin/fgos.mjs`, `merge next`'s own `catch (err)` at line ~2033-2038
   (wrapping the `runVerb('sync-root', ...)` call at line 2010): add a
   branch recognizing the new gate's refusal the same way the existing
   branch already recognizes Iron Law, using a distinctive substring of
   the new gate's own message (`is not clean`, from step 1's exact
   message text) so the two branches never collide:
   ```js
   } catch (err) {
     if (err instanceof StoreError && err.message.includes('Iron Law')) {
       return { picked: rootId, blocked: 'iron-law', message: err.message, syncRoot: { id: rootId } };
     }
     if (err instanceof StoreError && err.message.includes('is not clean')) {
       return { picked: rootId, blocked: 'dirty-tree', message: err.message, syncRoot: { id: rootId } };
     }
     throw err;
   }
   ```
   `'dirty-tree'` is a new `blocked` reason value, additive only — every
   existing reason (`iron-law`/`merge-conflict`/`fgos-write-rejected`/
   `verify-fail`) is untouched, and `merge-loop/SKILL.md:105-114`'s own
   rule already treats "any other" reason on this shape as the same
   blocked-pick bucket, so the skill needs no doc change for this to be
   handled correctly today.
3. No change to `merge.mjs`'s `mergeRunnerItem`/`runAndReport`'s own
   `merge-failed-unclassified` handling — out of scope (this item is
   about the missing gate, not the misclassification; the live
   reproduction above shows the gate alone prevents ever reaching that
   crash path for a dirty-tree cause).
4. `test/cli/fgos.test.mjs` (the item's own `verify` target), next to the
   existing sync-root suite (`bin/fgos.mjs:6108` onward, helpers
   `makeDriftedRoot`/`commitPendingBeforeApprove` already exist and are
   reused, not reinvented):
   - one new test proving `sync-root` on a no-parent root refuses (exit 4,
     `StoreError('validation')`) when the shared main checkout carries an
     uncommitted foreign change — built with `makeDriftedRoot` but
     *without* calling `commitPendingBeforeApprove` (that helper is what
     every existing sync-root test uses to clear the tree first; skipping
     it is what leaves the tree dirty for this negative case) — then
     asserts the root's own `fgw/<id>` branch and `main`'s HEAD are both
     unchanged (no merge commit landed) and the foreign uncommitted file
     is still present untouched.
   - one new test, next to the existing `merge next` blockedOnSync suite
     (`test/cli/fgos.test.mjs:8551` onward, same `commitPendingBeforeApprove`-
     omission technique as above), proving `fgos merge next` on a
     blockedOnSync root with a dirty shared checkout exits 0 with
     `{picked: <rootId>, blocked: 'dirty-tree', syncRoot: {id: <rootId>}}`
     — not a bare non-zero crash — mirroring the existing
     `blocked: 'merge-conflict'` test's own assertion shape
     (`test/cli/fgos.test.mjs:8551-8581`) exactly.

No split: this is one function-local gate, one catch-block branch, and two
new regression tests — one honest piece, not independently workable ones.

## Risk map

| Component | Risk | Proof |
|---|---|---|
| New gate on sync-root's no-parent branch | medium — every unattended `fgos merge next`/`merge-loop` root-sync now refuses instead of merging on a dirty shared checkout | New negative-path test (above), run against pre-fix code first to confirm it fails there (failing-test-first), then passes after the gate is added. Existing sync-root happy-path/nested-parent/decision tests (`bin/fgos.mjs:6151` onward) re-read and re-run unchanged — none of them leave the tree dirty going into the merge, so none should newly refuse. `test/cli/fgos.test.mjs` baseline run this round (all 9 sync-root-family tests, `node --test --test-name-pattern="sync-root"`): 9 pass, 0 fail — confirms every existing test already calls `commitPendingBeforeApprove` before its own `sync-root`/`merge next` call, so none is dirty going in. |
| `merge next`'s catch block not recognizing the new refusal | medium — an unhandled shape breaks `merge-loop/SKILL.md`'s own same-id-blocked-twice parsing for exactly the unattended path this item's own description names | New `merge next` test (above), same failing-test-first discipline. `merge-loop/SKILL.md:105-114` read directly and cited above — the new `blocked: 'dirty-tree'` value needs no doc change since the skill's own rule already treats any reason on this shape as one bucket. |
| Reused `buildOwnFileSet`/`isMainTreeClean` helpers | low — no change to either helper, only two new call sites | `approve`'s own existing test coverage for these two helpers is untouched; this item adds calls, not changes, to shared code |
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

## Scope clarification found during execution (tsk-66t)

`buildOwnFileSet`/`isMainTreeClean`'s own `ownFileSet` filtering
(`src/runner/merge.mjs:129-154`, `isFgosOnlyStatusLine`) is **own-file-set
scoped, not a whole-tree gate** (tsk-598 D1/D2, proven directly by
`test/cli/fgos.test.mjs`'s existing "approve of a runner item succeeds
when a dirty file on main is UNRELATED to the item" test): a dirty path
NOT in the item's own committed-diff/footprint is explicitly tolerated,
by design, even by `approve`'s own existing gate — mirrored here exactly,
byte-for-byte. This means the new sync-root gate catches the *same-path*
conflict (`git merge` would otherwise fail with "local changes would be
overwritten", the exact scenario live-reproduced against `tsk-3v2` and
already recorded as a decision on this item) but does **not** block an
unrelated foreign session's dirty/staged file elsewhere in the repo — the
same accepted boundary `approve` already has. The two new regression
tests were corrected mid-execution to dirty the root's OWN produced path
(matching `approve`'s own "real conflict" test, `test/cli/fgos.test.mjs`)
after an initial version using an unrelated path failed by exposing this
exact scoping (proof the gate does what `approve`'s does, not more).

## Outstanding questions

None
