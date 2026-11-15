---
phase: 12
title: "S4 close: docs, proof consolidation, parity re-run, retired-code row, gates"
status: pending
effort: 1.5d
wave: C
blockedBy: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
---

# Phase 12: S4 close

Write down what S4 settled where a stranger agent looks for it, rerun every parity table against the base release,
delete the transitional runner and tables, add the step's retired-code row, run every gate, and hand the branch to
the step lead for landing.

Phase-lead rules: [plan.md](plan.md). Branch `rust-verb-migration-program/s4-p12`. Report slug `s4-p12-close`.

## Requirements

1. **Parity re-run, then deletion.** Run `test/rust-host/verb-parity.test.mjs` with the `doctor`, `init`,
   `uninstall` and `wire-agents` tables on the integration head against the base release; record cases, passes and
   accepted differences per verb. Then delete the runner and the tables, remove the base worktree (after asserting it
   is a registered linked worktree) and delete `rvm-s4-base-target`.
2. **Retired-code row** "retired Node S4 verb code" (allowed none): `setupUseCase`, `materializeSkillsIntoProject`,
   `createProjectSkillGuard`, `insertSourceLine`, `convertRunnerPatternsConfig`, `wireAgentsUseCase`, the Node
   uninstall use case's name (F8), `initStoreUseCase`, `settleLegacyConfig`, `writeCoexistenceManifest`, `runDoctor`,
   `installAgentHooks`, `uninstallAgentHooks`, `deleteGuardPrefilter` (as a function); each with a seeded-file case.
   A name still used elsewhere stays out (say which).
3. **Bridge bound.** The registry's bridge set equals 00's table minus the rows S4 moved; no row is labelled
   `bridge:S4`; the D4 import-closure test passes; the report lists the set per step (S5, S6a, S6b, S7) with counts and
   the bridge-call count of a `doctor --fix` run, for the program plan's rows. 00's doctor fixtures are kept in the
   report (paths and setup) for S5-S7.
4. **Docs** (read each before editing; owners through `docs/platform/governance.md#decision-scope-to-holder-table`):
   - `docs/platform/packaging-distribution/spec.md`: §2 entry points (`fgos setup` row removed; `init`, `doctor`,
     `uninstall`, `wire-agents` native), §6 (doctor in the host, one registry, the bridge and its bound, no `setup`),
     §6.1 (uninstall in the host), "Lịch sử quyết định" one dated entry (S4: setup retired, packaging layer in Rust,
     one registry, bridge until S7, Q2 and Q3 answers), the "Legacy Setup Scenario" pointer and the retained Setup
     scenario text.
   - `contracts/setup-doctor-registry.md`: §1, §2 (registry is `doctor-registry.v1.json`; bodies of bridged rows in
     Node), §3 (the child-process clause, D6 of Outcome), §4 removed (setup) or reduced to a history line, §7 evidence,
     "Registered inventory" (generated list or the registry contract as the inventory).
   - `contracts/skill-package-distribution.md` (stamp contract, `setup` gone from §3.1), `verification/implementation-alignment.md`,
     `vision.md` §5 if a line names Node doctor, `docs/platform/coexistence/spec.md` (writer moved).
   - `docs/platform/host-invocation-routing/spec.md` §2 counts (recomputed from the generated table), §5/§9 (the
     bridge as the one native-to-Node path, bounded and retired by S7), `contracts/command-route-descriptor.md` recount;
     the older count paragraphs F3 lists stay as dated history.
   - `docs/reading-map.md` rows 137 (`src/setup/`), 149 (`src/git/status.mjs` gone), 159 (the runbook no longer runs
     `setup`), and rows for the new source paths.
   - `AGENTS.md` "Install/setup/doctor gate": "a readiness row in doctor (`src/setup/registrations.mjs`)" becomes "a
     row in `packages/distribution/contracts/doctor-registry.v1.json`, judged by its owning crate (a row of a layer
     still in Node is bridged with its step's label)"; the "`fgos setup` is deprecated" clause goes. Only these lines.
   - `README.md` (setup and uninstall lines), `docs/how-to/install-fgos-in-a-project-and-use-doctor.md`,
     `docs/how-to/recover-main-checkout-after-ignored-files-wipe.md` (its `fgos setup` step).
   - `docs/backlog.md`: close `p-bkmh4egqlv`, `p-tgqxcemygh`, `p-wheblpunzi` (moot); note `p-pvs4go2qei` can now
     generate the how-to tables from the registry contract; `p-eiwz6yypdg` gets the measured doctor numbers.
5. **Proof consolidation.** Every owner test named in reports 01-11 exists and asserts its behaviour (grep each name).
6. **Gates on the integration head** (numbers in the report): plan.md exit criteria 1-8 in full, including `fgctl init`
   on a fresh project, the external-consumer proofs on Linux and windows-latest, and the `doctor --fix` median.
7. **File-set check:** `git diff --name-only origin/main...HEAD` against plan.md's file set; add what is missing to
   plan.md under "Added during execution".
8. **Hand-off:** the `## [Unreleased]` lines of 03-11 to the step lead; the program-plan items (S5-S7 bridged rows).

## Files

- Modify: the docs above, `docs/architecture-manifest.json` (retired-code row), plan.md (file set), census,
  `scripts/check-decision-citation-drift.baseline.json` (only if the drift check asks), render surfaces (`npm run build:skills`).
- Delete: `test/rust-host/verb-parity.test.mjs`, `test/rust-host/parity-cases/{doctor,init,uninstall,wire-agents}.cases.mjs`.

## Risk and rollback

- Drift between a spec claim and the code (M x L): doc-health and decision-citation drift after every doc edit.
- Rollback: revert the phase; S4's code stands.
