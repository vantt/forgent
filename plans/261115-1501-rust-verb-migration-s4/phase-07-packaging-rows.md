---
phase: 7
title: "Packaging doctor rows in Rust: install, activation, hook wiring, agent-config reports"
status: pending
effort: 2.5d
wave: B
blockedBy: [1, 2, 3]
landsLast: true
q3: "answered (a)"
---

# Phase 07: Packaging rows

The rows of S4's own layer move onto the modules 01 and 02 built, and the Node packaging modules lose their last
users. This phase lands last in wave B (plan "Order and landing") and deletes every `src/setup` packaging module no
other code imports (D14).

Phase-lead rules: [plan.md](plan.md). Branch `rust-verb-migration-program/s4-p07`. Report slug `s4-p07-packaging-rows`.

## Rows and fixes (confirm against 00 F2)

- Install and runtime (`node-version-and-git` moved with the Git rows in 04): `cli-version-visible` (992; `src/setup/version-info.mjs`),
  `curl-available` (1266), `project-fgos-launcher` (1039) and its fix (1045) over `launcher.rs`,
  `rust-host-binary-present` (2862), `rust-host-target-supported` (2868), `legacy-node-payload-present` (2874),
  `active-release-matches-checkout` (2880; F18), `activation-matches-pin` (2925; `pin_drift` in `init.rs`, golden
  `packages/distribution/rust/tests/goldens/pin-drift-cases.json`).
- Hook wiring over `agent_hooks.rs`: `codex-hook-wired` (1145), `agy-hook-wired` (1159), `omp-hook-wired` (1173),
  `pi-hook-wired` (1187), each with its fix (1151, 1165, 1179, 1193); `dispatch-decide-hook-wired` (1131) and its fix
  (1137) (Claude Code hook; packaging layer per F2).
- Agent-config reports over `agent_config.rs` (report only, RUL111): `claude-plugin-marketplace` (1991),
  `agy-permissions-configured` (1207), `agy-sub-homes-configured` (1213), `mailbox-claude-accept` (1799).
- 00 F2 decides `bwrap-available` (1272), `omp-natives-present` (2328) and the `bin-discovery-cache` fix (2013):
  packaging if every fact they read is a machine tool or the release, else bridged with their step.

## Requirements

1. Adapters in `apps/fgos/src/wiring/doctor/packaging.rs` over `launcher.rs`, `agent_hooks.rs`, `agent_config.rs`,
   `verify.rs`, `init.rs` (`pin_drift`; the Node `checkActivationMatchesPin` and its separate golden reader go, so the
   golden has one reader); messages byte-equal (the `wire-agents` pointer texts, F13).
2. F18: `active-release-matches-checkout` reads `listLegacyNodeSourceFiles` (`scripts/build-rust-distribution.mjs:173`,
   imported at `registrations.mjs:34`): `package.json` `files` plus Git's tracked and non-ignored untracked paths
   through the Inspect port. Preferred: the walker moves into `fgos-distribution` as the one source-payload rule and
   the builder reads it from the host it has just built (a host route for the payload, the `fgos internal` namespace
   other payload callers use), the pair moving as one like the release-manifest pair (`doors` row "canonical JSON
   bytes" precedent); about +0.5 day here. If 00 finds that larger than one day, the row stays bridged with owner
   `bridge:release-builder` and an item for the big lead (it is then the one bridged row no step retires, so S7
   cannot delete the bridge until it moves); never a copy of the walker.
3. Delete (last importer, D14): `src/setup/{claude-code-hooks,agy-permissions,mailbox-claude-accept,project-launcher,agent-wiring}.mjs`,
   `version-info.mjs` and `mailbox-limits.mjs` and `omp-natives-checks.mjs` if 00 finds no other user; the rows'
   bodies and registrations; the doors rows' debt entries for these files (stale check). `src/setup/agent-hooks.mjs`
   is NOT deleted: it is frozen by the v7e, v7h and v7i file sets (MAIL 2026-11-15; a deleted or ported file is a new
   measurement). It stays with `test/setup/agent-hooks.test.mjs`, as does `scripts/lib/mailbox-live-confined.mjs`; both
   remain doors debt "moves to the Rust owner when V7e/h/i are re-measured (MAIL)". Its last importers
   (`registrations.mjs` rows, `claude-code-hooks.mjs`, `uninstall-project.mjs`) go; the tests and the mailbox tooling
   keep it reachable.
4. Registry owners `rust:packaging`; parity: the doctor table's packaging rows, plus `doctor --fix` on a fresh project
   and on a project with hooks of an older release (`fs-delta` of the project and HOME).

## Test owners after the move

| Behaviour | Old proof | Owner now |
|---|---|---|
| hook rows and fixes | `claude-code-hooks.test.mjs` (retired); `test/setup/agent-hooks.test.mjs` stays (frozen debt, twin) | `agent_hooks.rs` tests (vectors) + `wiring/doctor/packaging.rs` row tests |
| agent-config reports | `plugin-marketplace-doctor-check.test.mjs`, `agy-permissions.test.mjs`, `mailbox-claude-accept.test.mjs` | `agent_config.rs` tests |
| launcher row and fix | `test/setup/project-launcher.test.mjs` | `launcher.rs` tests |
| pin drift row | `test/setup/pin-drift-check.test.mjs` | `tests/pin_drift.rs` over the golden (one reader) |
| active release vs checkout | `test/setup/active-release-drift-check.test.mjs` | per F18 |
| version, host binary rows | their `registrations.test.mjs` cases | `packaging.rs` tests |
| `curl-available` | `test/setup/curl-check.test.mjs` | `packaging.rs` test |

## Files

- Create: `apps/fgos/src/wiring/doctor/packaging.rs`.
- Modify: `wiring/doctor/mod.rs`, the registry contract, `registrations.mjs`, `scripts/build-rust-distribution.mjs`
  only under F18's first branch, `.github/workflows/release-assets-check.yml` (101 and 115 run `curl-check.test.mjs` and
  `project-launcher.test.mjs`: they run the Rust owners' tests instead), (the MAIL experiment files and the frozen sets are not touched), the `doors` rows "installation shim and activation record location" and "writer and session id
  environment" (their `src/setup` entries leave), tests, baseline, manifest, census.
- Delete: as requirement 3.

## Gates

- fmt; clippy `-D warnings` on `fgos`, `fgos-distribution`; `cargo test -p fgos -p fgos-distribution`; msvc and darwin.
- `node scripts/run-tests.mjs test/rust-host/verb-parity.test.mjs test/setup/registrations.test.mjs test/git/main-checkout-delete-guard.test.mjs test/rust-host/release-tree.test.mjs test/architecture.test.mjs test/setup/git-mutation-census.test.mjs`
  plus `rg -l` users of every deleted module.

## Risk and rollback

- `doctor --fix` writes a hook file with different bytes and agents re-read it (M x M): vectors and `fs-delta` parity.
- A deleted module still has an importer (L x H): `rg` each name before the commit; the architecture test fails on a
  missing `files` entry. Rollback: revert; rows return to the bridge, modules return.
