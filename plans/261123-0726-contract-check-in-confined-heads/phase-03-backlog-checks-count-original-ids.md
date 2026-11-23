# Phase 3: Backlog checks count a migrated item's Original id

Capability: `code:implement`. Folds `p-mtqil2rpyy` into this plan (owner approval 2026-11-23, relayed by the
supervisor). The owner question named in plan.md "Owner questions" decides how much of the red run this phase clears.
Steps 1-4 hold under every option; step 5 depends on the answer.

## Inputs

- `plans/backlog/p-mtqil2rpyy-backlog-checks-count-a-migrated-item-s-original-id.md`.
- `scripts/check-backlog-reconciliation.mjs`, `scripts/identity-ids-unique.mjs`, `test/scripts/doc-health.test.mjs`
  (`checkIdentityIdsUnique` is its import).
- `packages/portfolio/item.mjs` (`parseBacklogItem`): the portfolio's one reader of a backlog item file.
- `docs/history/backlog-execution-reconciliation/RECONCILIATION.md`.
- Reference only, both rejected, never landed as is: commits `58d4899eb` and `ae83e60a5` (worktree
  `forgent-worktrees/backlog-original-id`) and `forgent-worktrees/patches/original-id-handling.patch`. Why they were
  rejected: `58d4899eb` replaced the independent line scan with `scanned = ids.length`, which can never disagree, and
  swallowed a missing addon in `identity-ids-unique.mjs`. `ae83e60a5` read 0 proposed items and failed 5 doc-health
  tests.

## Facts (measured on main 2026-11-23)

- `node scripts/check-backlog-reconciliation.mjs` reports 278 problems over 310 proposed items. 277 are proposed items
  with no section in RECONCILIATION.md, and 1 is the section `tsk-p7-shadow-binders` ("reconciled but not a proposed
  item").
- Exactly one proposed item carries an `Original id:` line. The item whose Original id is `tsk-p7-shadow-binders`
  (`p-kqoljdbtbf`) has `status: done`. So counting Original ids only among proposed items clears none of the 278.

## Files it may write

`scripts/check-backlog-reconciliation.mjs`, `scripts/identity-ids-unique.mjs`, `test/scripts/doc-health.test.mjs`.
With option 2 of the owner question, also `docs/history/backlog-execution-reconciliation/RECONCILIATION.md`.

## Steps

1. Both scripts read an item's id and its Original id through one shared function: `parseBacklogItem` if it already
   exposes the Original id, otherwise one small exported helper beside it that both scripts import. Do not leave two
   copies of the `Original id:` regex. Do not keep a second frontmatter-reader fallback: an item `parseBacklogItem`
   refuses is a finding, not a silent skip.
2. `identity-ids-unique.mjs` counts each item's Original id in the duplicate check, so a new item that reuses a migrated
   item's old id is reported.
3. `check-backlog-reconciliation.mjs` resolves each RECONCILIATION.md section to an item by id or by Original id,
   across all items (not only proposed ones). A section whose item exists but is no longer proposed is reported by
   name with the item's id and status, so it can be fixed. It is not reported as an unknown id.
4. Keep both safeguards that the rejected commits broke. The proposed-count cross-check stays an independent
   whole-file line scan (`/^status:\s*proposed\s*$/m`), never derived from the parsed list. A missing addon fails
   loudly through `ensureAddonForScript` in both scripts, never inside a `try/catch` that swallows it.
5. The answer to the owner question decides this step. Option 1 (recommended): keep the "every proposed item has a
   section" rule; the 277 unreconciled items go to a separate backlog row that the secretary files. Option 2: the
   check asserts only that each section names a known item and carries its evidence, and RECONCILIATION.md states
   that the per-item promise is retired. Option 3: out of this phase; a new phase gets planned.
6. One owning proof in `test/scripts/doc-health.test.mjs`, named for the behaviour, for example "backlog checks see a
   migrated item by its Original id". It uses a fixture backlog where a section names an Original id of a done item, a
   new item reuses an old id, and a line-scan/parse disagreement exists. It asserts the named finding, the duplicate,
   and the cross-check failure. Say why no existing test covers it.

## Verify

- `node scripts/run-tests.mjs test/scripts/doc-health.test.mjs` passes.
- `node scripts/check-backlog-reconciliation.mjs` no longer reports `tsk-p7-shadow-binders` as an unknown id. With
  option 1 it reports only the 277 unreconciled items (or fewer, if more items have been reconciled by then). With
  option 2 it exits 0.
- `rg -n "Original id" scripts` shows the pattern in one place.

## Rollback

Revert this phase's commit. Both scripts go back to their current behaviour.
