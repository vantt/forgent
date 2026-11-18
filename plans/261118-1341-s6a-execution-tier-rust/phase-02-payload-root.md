# Phase 02: payload-root to the shared leaf layer

Wave 3. Depends on: 0. Effort 0.5d. Lands on the integration branch.

## Context

`src/run-supervisor/payload-root.mjs` (52 lines; `OWN_PAYLOAD_ROOT`, `realpathOrNull`, `releasePayloadRoot`,
`releasePayloadManifest`) is tier 0 by its own manifest entry (`docs/architecture-manifest.json:55`) but lives in a
tier-4 directory that phase 20 deletes. Importers (scan §4): `src/native/door.mjs:7`, `src/event-store/consumers.mjs:5`,
`src/seat-binding/client.mjs:21`, `src/workflow/loader.mjs:12`, `src/run-supervisor/{direct-launch,attempt-step}.mjs`,
`src/runner/execution/unit-run-record.mjs`. P8: target `src/util/payload-root.mjs` (tier 0 shared leaves, beside
`src/util/host-bin-path.mjs`). Design principle 2.

## Requirements

- `git mv src/run-supervisor/payload-root.mjs src/util/payload-root.mjs`; content unchanged (`OWN_PAYLOAD_ROOT` stays
  `../..` relative to the file, same depth).
- Every importer imports the new path; no re-export left behind.
- Manifest: drop the `src/run-supervisor/payload-root.mjs` tier and layer entries (`src/util/` is tier 0 by prefix);
  any `doors` row path naming the old file updated.
- Wave 3 note: phase 04 (wave 2) edited `src/native/door.mjs`; rebase on it, change only the import line.

## Steps

1. `rg -n "payload-root" src bin scripts test docs apps packages` and list every hit.
2. Move, rewrite imports, update the manifest and any test path.
3. Gates: `test/architecture.test.mjs`, the tests importing any changed file, `test/setup/git-mutation-census.test.mjs`.

## Validation

`ls src/run-supervisor/payload-root.mjs` fails; `rg -n "run-supervisor/payload-root" src bin scripts test` empty;
architecture test green.

## Risk and rollback

Risk: a release-tree path list names the old file (packaging). Step 1 covers `packages/`. Rollback: revert the commit.
