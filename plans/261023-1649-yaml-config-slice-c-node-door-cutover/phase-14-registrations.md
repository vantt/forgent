# Phase 14: `src/setup/registrations.mjs`

Depends on 10 and 13. Suggested executor: sonnet; **independent sonnet review of the deletion list against phase 00**; opus after a failed attempt. Board shared file (HARDEN, SEAT, COOK, DOC): post first, merge `origin/main` at start and end; this phase edits the file alone. Impact analysis on `ensureSharedConfigDefaults`, `runFixes`, `registerConfigDefault`, `assembleRegistryDefaults`.

## Context

The file (about 6,600 lines) holds the old config path: about 45 reader sites (`readSharedConfig` at `:274,500,510,525,605,958,1212,2391,2472,2521,2581,2641,2657,2747,2804,2873,2884,3346,3395,3684,3874,5088,5648,5728`; `loadGlobalConfig` at `:506-526,605,2101,4536,5449`; `loadRunnerConfigFromDir` at `:1534,4498-4612`), `registerConfigDefault` (`:198`) with 13 remaining registrations (D removed `gateway`), `ensureSharedConfigDefaults` (`:273`), their per-section checks and fixes, three `writeSharedConfig` writers (`:2667,2894`, plus `:288` inside `ensureSharedConfigDefaults`), the orgPolicy check and fix (`:5775-5832`, the fix writes with `JSON.stringify` at `:5828`), the row `config-awareness` (`:2093`), the row "`.fgos/config.json` exists and has every current registered default key" (`:1300`).

## Design

- **Retire what the snapshot replaces.** A registered default existed to fill an absent key; the standard layer fills it. A section check plus fix that repaired an invalid or missing value existed because nothing validated the file; `config-schema` (D row) now does, and no fix writes a standard value (spec section 7). Each of the 13 registrations, its check, its fix and its default constant is either **deleted with the covering D row named** or **kept as a check over the effective value** when it enforces a cross-field rule the section owner keeps. The table `row id -> covered by / kept / deleted because` is in the commit message and was reviewed against phase 00.
- Deleted outright: `registerConfigDefault`, `assembleRegistryDefaults`, `ensureSharedConfigDefaults`, the `shared-config-defaults` row, `config-awareness` (C13), the orgPolicy fix and writer (the check stays only if `config-schema` does not cover `dischargeOn`; phase 00 decides), `DEFAULT_*` constants used only by the defaults, the `mergeConfigDefaults` import for config. `src/setup/checks.mjs` stops re-exporting `ensureSharedConfigDefaults`.
- Kept and moved: every check that validates something real over the effective value (capability catalog doctrine rows, executor kinds, confinement, trust stores, provider inventory `readDoctorProviderInventory(...)` over the machine view), now reading with `loadRunnerConfigForDir`/`readConfig`.
- `refreshGlobalBinCache` registration (`:3170`) is **not touched here**: its signature stays and phase 15 changes what it writes.
- Install/setup/doctor gate: no new row; the rows deleted are listed in `CHANGELOG` (phase 23) and in `docs/specs/distribution.md` row 7 text (phase 23), because that row says a module changing the registry updates it.

## Steps

1. Merge `origin/main`; produce the deletion table from phase 00's census before editing; `impact` on the symbols above.
2. Move readers first (one commit), then delete defaults, fixes and writers (second commit), then the retired rows (third), each followed by `node --test test/setup` through the launcher after `free -g`.
3. Tests: `test/setup/registrations.test.mjs`, `checks*.test.mjs`, `test/setup/helpers/setup-checks-harness.mjs` move to the fixture helper; tests that asserted a seeded default or a doctor fix writing config are retired with the behaviour (commit names the covering D row or "removed").
4. `rg -n "readSharedConfig|loadGlobalConfig|writeSharedConfig|registerConfigDefault|ensureSharedConfigDefaults|describeConfigAwareness|JSON.stringify\(config" src/setup/registrations.mjs` finds nothing.

## Owning proofs

Moved doctor tests; D's `golden_doctor.rs` owns every `config-*` row.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| A deleted fix was the only repair for a state the schema allows | M x M | table reviewed row by row; a state the schema allows needs no repair |
| `runFixes` in `fgos setup` stops creating something a later step expects | M x M | phase 15's setup flow test; `init` creates the file |
| Merge conflicts in a 6,600-line shared file | M x M | one lander at a time, board post, small commits |

## Rollback

Revert the three commits in reverse order; valid together with phase 18's deletion reverted.
