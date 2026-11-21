# Phase 3: Component and decision-kind rows; layer and tier from components

## Inputs
- Discussion §3 rows 1, 1a, 1b, 3a(6), 3e, 4a(iii), and §6.
- The sources to merge: `docs/platform/proposals/component-authority-boundary-map.md` (Owns / Must not own, 14
  rows); `docs/platform/component-boundary.md` (about 37 rows with source links); `docs/platform/system-overview/spec.md`
  §Area Map and §Shared Entities; `docs/platform/governance.md` §"Decision scope to holder table" (scopes and
  aliases); `docs/platform/README.md` §2; `architecture-map.md` §6; the `owner` field of
  `packages/distribution/contracts/doctor-registry.v1.json`; the 12 subcomponent specs under
  `docs/platform/*/subcomponents/`; the ownership columns of area specs.
- `packages/component-authority/model/*` (phase 2).

## Files it may write
packages/component-authority/model/components.json, packages/component-authority/model/decision-kinds.json, packages/component-authority/model/files.json, packages/component-authority/model/tiers.json, test/architecture.test.mjs, src/setup/instruction-registry.mjs, test/setup/instruction-registry.test.mjs, test/component-authority/components.test.mjs

## Steps
1. Write one component row per area and component found in the sources. Subcomponents are rows with `parent`.
   Each row has a `meaning` sentence, `canonical` and `aliases`, Owns / Must not own, `spec` and `source` links.
   Put every synonym met in the sources into `aliases`, including a Vietnamese one where the docs use it. For
   example, `durable-file` carries "atomic file write" and "ghi file nguyên tử", which the sibling plan's `locate`
   verify depends on.
2. Settle each contradiction by recording what the code at HEAD shows, never what a ledger claims. Write a
   one-line `reason` in the row:
   - config: `src/config/facade.mjs` still exists.
   - canonical JSON: two different stated reasons.
   - process kill: `src/holder-lock/index.mjs:442` calls `process.kill`.
   - supervision: the crate and verbs exist.
   - `OccupancyPort`: not in code, so it gets no row.
   Where the code breaks a door's boundary, leave the existing door row's debt as it is (the sibling plan retires it).
3. Write `decision-kinds.json`: one row per governance holder scope, keeping its legacy aliases. Each row has one
   `owner` component and the `narrative` path. Add the `component-authority` decision kind.
4. Give every component `paths` (prefixes), and a `layer` and `tier` per path, chosen so that each file under
   `src/` and `bin/`, and each prefix in `tiers.json`, gets the same layer and tier as in phase 2. Where one prefix
   cannot express it, add an `exceptions[]` entry with a reason. Then delete `files.json` and `tiers.json`.
   `tierExceptions` moves into `layers.json` if it is non-empty.
5. In `test/architecture.test.mjs`, make the loader derive `files` (path to layer) and `tiers` from component paths
   by longest prefix. Replace the "đủ sổ" check with "every `.mjs` under `src/` and `bin/` resolves to exactly one
   component". Two components claiming the same longest prefix is red.
6. `discoverKnownOwners` reads top-level component ids (rows without `parent`). Update the fixtures.
7. Add `test/component-authority/components.test.mjs`. The model validates against `model.v1.json`. The first row is
   `component-authority`. Every `parent`, decision-kind `owner` and `spec`/`source` path exists. `canonical` and
   `aliases` are unique across components and decision kinds. Each decision kind has exactly one owner.

## Verify
- Before deleting `files.json` and `tiers.json`, a one-off script under `.fgos/runtime/tmp/` prints any file whose
  derived layer or tier differs from phase 2. It must print nothing.
- `node --test test/architecture.test.mjs test/component-authority/components.test.mjs test/setup/instruction-registry.test.mjs` is green.

## Rollback
Revert the phase commit. That restores `files.json`, `tiers.json` and the phase 2 loader.
