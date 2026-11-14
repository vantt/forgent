---
phase: 16
title: "Doctor and setup readers use the persona, global-directory and activation doors"
status: pending
effort: 0.75d
leak: "census ranks 2, 4 and 10 (the parts in src/setup/registrations.mjs and src/setup/bin-discovery.mjs)"
startAfter: ["capability plan on main (rewrites registrations.mjs)", "F0 phase 06 on main (globalFgosDir; rewrites bin-discovery.mjs)", "phase 02 on main", "phase 12 on main"]
revertOrder: "revert 16 before 02 and 12; if F0 06 is reverted, revert 16 first"
landAfter: []
---

# Phase 16: Doctor and setup readers through their doors

Rules: `phase-lead-rules.md`. pNN = `p16`; report slug `odd-p16-doctor-readers`; no Rust.
Facts: `phase-00-facts.md` "Leak 2", "Leak 4 remainder", "Leak 10".

## Outcome

`src/setup/registrations.mjs` and `src/setup/bin-discovery.mjs` hold no second chooser: the debt entries phases 02 and 12 (and
F0 phase 08) left for them are removed. This is the last phase; after it every row this plan added has no debt.

## Requirements

1. Persona tiers (`registrations.mjs:809-863`): `allAgentYamlFiles` and `readAgentSkills` enumerate through `scanAgentTiers` in
   the door's order (first tier wins, as `listAgents`). The project's own `domains/` is no longer read (door rule,
   `agent-definitions.mjs:43`). A duplicate name across tiers is reported by the existing duplicate check (D33), not resolved
   last-wins. Doctor results change only for a project with its own `domains/` or with duplicates: list them in the report.
2. Global directory (`registrations.mjs:517`): `globalFgosDir()` from `src/config/facade.mjs` (F0 phase 06).
3. Activation reads (`registrations.mjs:2576,2767,2950,3703`, `bin-discovery.mjs:24`): `readActivationFile` /
   `resolveActiveHostBin` from `src/util/host-bin-path.mjs`. `registrations.mjs:2561,2794,2807` scope `FGOS_ACTIVE_MANIFEST_PATH`
   for a child process; if that is setting env (not choosing the manifest), allowed with that reason in phase 12's row; if it
   chooses, call `src/run-supervisor/payload-root.mjs`.
4. `doors`: remove the `registrations.mjs` debt from phase 02's tier row and phase 12's activation row, the `bin-discovery.mjs`
   debt from phase 12's row, and (if F0 phase 08's "global fgOS directory" row is on your base) the `registrations.mjs` entry there.
   Line numbers above are from 781537524; the capability plan moves them: re-grep.

## Files

- Modify: `src/setup/registrations.mjs` (those functions and lines only), `src/setup/bin-discovery.mjs` (:24 only), `docs/architecture-manifest.json` (debt entries).
- Tests: `test/setup/registrations.test.mjs` (claims/skills, duplicate, global label), `test/setup/checks-doctor-config.test.mjs`,
  bin-discovery tests: owners stay; cases that asserted the project-`domains/` read or last-wins are retired (behaviour removed,
  owner: the door's duplicate check in `test/runner/agent-definitions.test.mjs`).
- Net size: src about -50.

## Gates

`node scripts/run-tests.mjs` on `rg -l "setup/registrations|bin-discovery|checks-doctor" test`, `test/runner/agent-definitions.test.mjs`,
`test/architecture.test.mjs`, `test/scripts/doc-health.test.mjs`, `test/setup/git-mutation-census.test.mjs`; `fgos doctor --json`
through `npm run fgos:dev -- doctor --json` in this checkout shows the same rows and statuses as before except the ones
requirement 1 names.

## Risk and rollback

- Doctor answers change for unusual projects (L x M): listed in the report; propose the `## [Unreleased]` line.
- Rollback: revert the phase (the debt entries return with it).
