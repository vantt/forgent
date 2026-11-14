---
phase: 13
title: "The config facade owns the raw project-config read used by conversion"
status: pending
effort: 0.5d
leak: "census rank 10 (runner-config-conversion config reads)"
startAfter: ["F0 wave A on main", "F0 phase 06 on main (it edits src/config/facade.mjs and runner-config-conversion.mjs)"]
landAfter: []
---

# Phase 13: Raw config read through the facade

Rules: `phase-lead-rules.md`. pNN = `p13`; report slug `odd-p13-config-raw-read`; no Rust.
Facts: `phase-00-facts.md` "Leak 10".

## Outcome

`src/config/facade.mjs` is again the only Node module that locates and reads a project config file. Conversion of retired
keys keeps its raw read (the validating door refuses such files on purpose), but asks the facade for it.

## Requirements

1. `facade.mjs` gains one export, `readProjectConfigSource(dir)` -> `{ path, format: 'yaml'|'json', text } | null`, holding
   today's `findProjectConfigFile` rule (`src/setup/runner-config-conversion.mjs:14-24`).
2. `runner-config-conversion.mjs`: delete `findProjectConfigFile` and its raw reads (:55, :112); call the facade. The backup copy
   (:196-197) and the byte compare in `discardUnusedBackup` (:254-263) work on the facade's `path`/`text`. Writes keep going
   through `applyNativeConfigPatch` (already the Config write door).
3. `doors` row (new, `kind: door`): `{ job: "locate and read a project config file", patterns: ["['\"`]config\\.ya?ml['\"`]", "['\"`]config\\.json['\"`]"], allowed: [...], reason: "only fgos-config and its Node facade read config; other files only name the file in text" }`.
   `allowed` exactly as the check finds it, each non-reader with its reason (census 4.9: `src/runner/dispatch/config.mjs`
   display names, `src/setup/seat-binding-checks.mjs`, `src/verbs/merge/iron-law-level.mjs`, `src/verbs/state/settle-legacy-config.mjs`,
   `apps/fgctl/src/help.rs`, the `packages/config/rust/src` files, `scripts/ci-external-consumer.sh` CI). If a file other than
   these reads a config file, stop and report it (do not add debt silently). If the row would need both `.mjs` and `.rs` without
   being a twin, split it by language.

## Files

- Modify: `src/config/facade.mjs`, `src/setup/runner-config-conversion.mjs`, `docs/architecture-manifest.json`.
- Tests: the conversion tests (`rg -l "runner-config-conversion|pre-patterns-catalog" test`) stay owners; one facade case for
  `readProjectConfigSource` (yaml, json, none) in the facade's test.
- Net size: src about -10.

## Gates

`node scripts/run-tests.mjs` on the tests above plus `rg -l "config/facade" test`, `test/architecture.test.mjs`,
`test/scripts/doc-health.test.mjs`, `test/setup/git-mutation-census.test.mjs`.

## Risk and rollback

- Rollback: revert the phase.
