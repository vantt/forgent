---
phase: 4
title: "Git and Event Store doctor rows in Rust"
status: pending
effort: 2d
wave: B
blockedBy: [3]
q3: "answered (a)"
---

# Phase 04: Git and Event Store rows

Moves the Git and Event Store readiness rows and their fixes out of the bridge: each row's adapter in
`apps/fgos/src/wiring/doctor/{git.rs,event_store.rs}` calls the crate that already owns the fact. The final row
list is 00's table (F2); the rows below are the scout's.

Phase-lead rules: [plan.md](plan.md). Branch `rust-verb-migration-program/s4-p04`. Report slug `s4-p04-git-es-rows`.

## Rows and fixes (confirm against 00 F2)

- Git: `git-component-compatible`, `git-repository-config`, `git-operation-journal`, `git-incidents` (pointer, never
  fails; `setup-doctor-registry.md:183`), `node-version-and-git` (986; it shares `gitFacts` and `gitFloor` with the Git
  rows, `registrations.mjs:2, 392`, so it moves here; its Node half spawns `node --version`, marked volatile in parity),
  `main-checkout-hook-wired` (RepositoryConfig hooks path, `registrations.mjs:1126`;
  applies only to a project whose `.githooks/pre-commit` carries fgOS's own guard, every other project with a
  `.githooks/` never fails on it (plan.md Decision log 2026-11-15 18:00, report B2); message names
  `npm run setup:hooks`, never `fgos setup`, F15). Fixes
  `git-driver-directories`, `git-wal-dir`, `git-publication-refspecs` (`registrations.mjs:3790-3792`).
- Event Store: `event-store-open-root`, `event-store-machine-id`, `event-store-legacy-layout`, `event-store-incidents`
  (pointer; fails on integrity problems, skipped peer mirrors and their sync warnings, `setup-doctor-registry.md:71`),
  loop `registrations.mjs:3763-3766`. Fix `event-store-lock-dirs` (3762).
- Judges today: `src/setup/git-checks.mjs` (138; `gitFacts`, `readMergeHead` from `src/git/status.mjs`;
  `eventStoreDoctorOf` from `event-store-checks.mjs`), `git-retention-note.mjs`, `event-store-checks.mjs` (104),
  `event-store-fixes.mjs` (33; `fixEventStoreLockDirs`, also called by `init`), `git-hooks.mjs` (`mainCheckoutHookWired`).
  Rust owners: `packages/git/rust/src/{wal.rs,incidents.rs}` and RepositoryConfig; `apps/fgos/src/wiring/git_incidents.rs`;
  `packages/event-store/rust/src/diagnostics.rs`.

## Requirements

0. D17: `fgos-git`'s RepositoryConfig report gains `wired` (the resolved configured path equals the owned
   `.githooks`, Windows case-insensitive, as `git-hooks.mjs:16-22`); the Rust row reads it, and `git-hooks.mjs`'s
   `wired()` reads it through the existing Node client (`installGitHooks` for `scripts/install-git-hooks.mjs` and
   `mainCheckoutHookWired` for `uninstall` until 09).
1. Adapters call the crates' public functions; a fact the crate does not expose yet gets a public function in its
   crate (named in the report), never a copy in the adapter. The durability line and layout information of
   `git-component-compatible` keep their text.
2. The rows' `owner` becomes `rust:git` / `rust:event-store` in the registry; their bodies and registrations leave
   `registrations.mjs`.
3. Delete: `src/setup/git-checks.mjs` (after `scripts/event-store/forge-probe.sh:25` stops importing
   `fixGitFetchMapping`: it runs the host's `fgos doctor --fix` in its scratch repository, which runs
   `git-publication-refspecs`, as the S3 close moved its sync step onto the host), `git-retention-note.mjs` (if no
   other user), `event-store-checks.mjs`; the
   doctor's use of `mainCheckoutHookWired` (the function stays in `git-hooks.mjs` for `uninstall`'s plan until 09)
   and of `src/git/status.mjs` (the file stays for `init` until 10, D12); `event-store-fixes.mjs` stays for `init`
   until 10.
4. `doors`: remove the rows' Node modules from the "doctor readiness registry" debt; the `compose Git status and
   recovery` row keeps `src/git/status.mjs` until 10.
5. Parity: the doctor table's Git and Event Store rows (fresh project, this repository, a repository with an
   interrupted operation, a project with an obsolete fetch mapping) green against the base release.

## Test owners after the move

| Behaviour | Old proof | Owner now |
|---|---|---|
| Git rows and fixes | `test/setup/git-checks.test.mjs` | `wiring/doctor/git.rs` tests over the `fgos-git` fixtures (temp repositories) |
| Event Store rows | `test/setup/event-store-checks.test.mjs` | `wiring/doctor/event_store.rs` tests; diagnostics stay owned by `fgos-event-store` |
| lock-dirs fix | `test/setup/event-store-fixes.test.mjs` | moves in 10 with `init` (named in 10's owner table) |
| `node-version-and-git` | its `registrations.test.mjs` cases | `wiring/doctor/git.rs` tests |
| hooks path wired | `test/scripts/install-git-hooks.test.mjs` (judgment half) | `fgos-git` RepositoryConfig tests (`wired`); the script test keeps its wiring cases |

## Files

- Create: `apps/fgos/src/wiring/doctor/{git.rs,event_store.rs}`.
- Modify: `apps/fgos/src/wiring/doctor/mod.rs`, `packages/distribution/contracts/doctor-registry.v1.json`,
  `src/setup/{registrations,git-hooks,checks}.mjs`, `packages/git/rust` RepositoryConfig (`wired`), the addon's
  RepositoryConfig marshalling if the field crosses it, `scripts/event-store/forge-probe.sh`, `test/setup/helpers/setup-checks-harness.mjs`, crates only where a public function is missing, tests, baseline, manifest, census.
- Delete: as requirement 3.

## Gates

- fmt; clippy `-D warnings` on `fgos`, `fgos-git`, `fgos-event-store`; `cargo test -p fgos -p fgos-git -p fgos-event-store`; msvc and darwin.
- `node scripts/run-tests.mjs test/rust-host/verb-parity.test.mjs test/setup/registrations.test.mjs test/git/status.test.mjs test/event-store/door.test.mjs test/architecture.test.mjs test/setup/git-mutation-census.test.mjs`.

## Risk and rollback

- A row's text changes (M x M): parity per row, exact bytes. Rollback: revert; the rows return to the bridge.
