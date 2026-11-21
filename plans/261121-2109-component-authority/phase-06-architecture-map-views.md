# Phase 6: Architecture-map registries generated; proposal map retired

## Inputs
- `docs/platform/architecture-map.md` §6 (component registry) and §7 (contract registry, CTR, scope rule, mermaid).
- `packages/component-authority/model/contracts.json` (phase 4) and `scripts/component-authority-render.mjs` (phase 5).
- `docs/platform/proposals/component-authority-boundary-map.md`, to delete. Run `rg -l component-authority-boundary-map` to find who links to it.

## Files it may write
scripts/component-authority-render.mjs, test/component-authority/render.test.mjs, docs/platform/architecture-map.md, docs/platform/proposals/component-authority-boundary-map.md (delete), docs/platform/component-authority/spec.md

## Steps
1. Add two views to the renderer. `architecture-map-components` replaces the §6 tables. `architecture-map-contracts`
   replaces the §7 CTR table with a row per contract: id, boundary, provider, consumers, status and path. Keep the
   §7 scope rule paragraph and the mermaid hand-written, outside the markers.
2. Before deleting the proposal map, confirm that each of its 14 rows and its §7 contract matrix is present in the
   model (Owns / Must not own, providers and consumers). Then delete it, and repoint every live link to the
   component-authority spec. Record the retirement and the proposal's last SHA in the spec's settled facts.
3. Extend `render.test.mjs` to cover both new views.

## Verify
`node scripts/component-authority-render.mjs --check` exits 0. `node --test test/component-authority/render.test.mjs`
is green. `rg -l component-authority-boundary-map --glob '!archive/**' --glob '!plans/**' --glob '!docs/discussions/**'`
lists only the spec's history line.

## Rollback
Revert the phase commit. That restores the proposal file and the hand-written §6/§7.
