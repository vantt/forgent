# Phase 4: Contract index

## Inputs
- Discussion §3 row 4a(i)-(ii) and §6, the contract row.
- `packages/*/contracts/` (118 top-level files, 406 below them), `docs/platform/*/contracts/*.md` (31), and `docs/platform/architecture-map.md` §7 (CTR001-CTR013).
- `packages/component-authority/model/components.json` (phase 3) and `contracts/model.v1.json`.

## Files it may write
packages/component-authority/model/contracts.json, test/component-authority/contracts.test.mjs

## Steps
1. One row per top-level file in each `packages/<pkg>/contracts/`. Files under subdirectories (fixtures, vectors,
   goldens) go into that contract's `evidence` globs and get no row of their own. One row per
   `docs/platform/<area>/contracts/*.md`.
2. Provider = the component that owns `packages/<pkg>` or `docs/platform/<area>`. If a different provider is right,
   say why in `reason`. Consumers come from the CTR "Ranh giới" column and from imports or callers you can see; do
   not guess them.
3. CTR rows: the CTR id becomes the row `id`, or an alias of the file row it describes. `planned` and `idea` CTRs
   keep their status with no `path`.
4. Write `test/component-authority/contracts.test.mjs`:
   - every top-level contract file and every prose contract has exactly one row;
   - every row has exactly one `provider`, and it exists in `components.json`;
   - every consumer exists;
   - `live` and `designed` rows name an existing `path`;
   - `id`, `canonical` and `aliases` are unique;
   - one synthetic case: a temp copy with a provider-less row and a missing file fails.

## Verify
`node --test test/component-authority/contracts.test.mjs` is green, and fails with a named file when you
temporarily add a new `packages/questions/contracts/x.v1.json` without a row (remove the file after).

## Rollback
Revert the phase commit.
