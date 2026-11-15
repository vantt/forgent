---
phase: 2
title: "Machine services in Rust: timers, rc lines, coexistence, skill stamp; fgctl root through the root door"
status: pending
effort: 2.5d
wave: A
blockedBy: []
q3: "(a) or (b)"
---

# Phase 02: Machine services and the fgctl root

The second half of the packaging layer: managed timers, the read-only shell-rc reader, the coexistence manifest and
the skill generated-stamp reader, each with one Rust owner in `fgos-distribution`; and `fgctl`'s own root walk
replaced by the root door (D13). Nothing flips; 06 (timer rows), 09 (`uninstall`) and 10 (`init`) switch to these.

Phase-lead rules: [plan.md](plan.md). Branch `rust-verb-migration-program/s4-p02`. Report slug `s4-p02-machine-services`.

## Context

- `src/setup/managed-timer.mjs` (375): systemd user units and launchd plists for the mailbox sync timer and the
  account probe timer; the timer names the project shim or the activated release's host, never a checkout script, a
  project-local install or `PATH`, and refuses a path, binary or remote holding `%` or a control character
  (`spec.md:800`; backlog `p-qqcf5lqqtn` is the older text). Users: rows `mailbox-sync-timer`, `account-probe-timer`
  and their fixes (`registrations.mjs:1805-1822`), `uninstall-project.mjs`. Platform branches: F10.
- `src/setup/shell-rc.mjs` (128): rc detection and source-line insertion. Insertion retires with `setup` (11);
  detection is what `uninstall` needs to name lines it never edits (`spec.md:187`). Other user:
  `scripts/fgos-session-start-hook.mjs:13` (F11).
- `src/install/coexist.mjs` (124): builds and writes `.fgos/coexistence.json` (detected harness markers, territory);
  read-only detection, fail-safe in `init` (`src/verbs/state/init.mjs:53-58`); spec `docs/platform/coexistence/spec.md`.
- Skill stamp: the render writes an anchored one-line generated-from header into every file it assembles
  (`contracts/skill-package-distribution.md` §3.1, lines 80-95); `uninstall` removes only stamped directories (D8, F12).
- `packages/distribution/rust/src/workspace.rs` (102): `fgctl`'s trusted main checkout read through
  `GitDriver::trusted_root_at`, debt of the `doors` row "resolve the invocation root" ("moves with packaging (S4)").
  Callers: `init.rs`, `uninstall.rs`, `fgctl_refresh.rs`, `lib.rs`, `apps/fgctl/src/main.rs`.

## Requirements

1. `timer.rs`: install, check and remove a managed timer with Node's rules and unit/plist bytes (vectors from Node).
   Units and plists are rendered from a platform value chosen at run time, as Node does (`managed-timer.mjs:78, 198-215`,
   `/opt/homebrew/bin` on darwin), so both are tested on Linux with vectors; only the `systemctl`/`launchctl` calls sit
   under `cfg`; elsewhere the same answer Node gives (`managed-timer.mjs:305`). Process calls go through the process
   door (`fgos-process`, D15 edge), no new `Command::new` site.
2. `rc_lines.rs`: read-only detection of fgOS source lines in the caller's bash and zsh rc files (Node's rules,
   `shell-rc.mjs:30` and the dead-line rules), matched against the payload's `scripts/fgos-shell-integration.sh`
   path taken from `components.legacyNode.root` (D18; Node's `integrationScriptPath`, `registrations.mjs:356`); no
   writer. The Node `detectRcFiles` stays for the repository's session-start hook as declared debt (D18).
3. `coexistence.rs`: build and write the manifest with Node's bytes (`JSON.stringify(_, null, 2)` + newline) through
   Durable File; same detection rules and the `agentsMdReadError` field.
4. `skill_stamp.rs` + `packages/distribution/contracts/skill-stamp.v1.json` (D8): both stamp forms (the `.claude`
   wrapper marker, `isGeneratedWrapper`, and the assembled header, `ASSEMBLED_HEADER_PREFIX` / `isOwnAgentsDir`,
   `skill-wrappers.mjs:752-778`) and the owned-name rule, with vectors (stamped, unstamped, stamp not on the first line, an unstamped directory with an
   owned name, a link, the render's temp file, `_shared`, a domain skill); read by the Rust reader and by the Node
   render's test (`test/setup/skill-wrappers.test.mjs`); the render (`src/setup/skill-wrappers.mjs`, repository
   tooling through `scripts/build-skill-wrappers.mjs`) stays the only writer.
5. D13: `workspace.rs`'s walk becomes a call to `fgos_git::invocation_root` with a `fgctl` policy (trusted main
   checkout, home exclusion, no `--dir`); the debt entry leaves the row; `fgctl init`, `upgrade`, `repair`,
   `uninstall`, `verify` and `status` answer as before (their tests, `apps/fgctl/tests/*`, `test/rust-host/fgctl-*.test.mjs`).
6. `doors` rows: "managed timer" (patterns `systemctl`, `launchctl`, unit and plist names; allowed `timer.rs`; debt
   `src/setup/managed-timer.mjs`, removed by 09), "skill generated stamp" (allowed `skill_stamp.rs` (reader),
   `src/setup/skill-wrappers.mjs` (writer, reason: the render is repository tooling); debt `src/setup/uninstall-project.mjs`
   until 09; the render's entry reason is "writer and reader: it prunes only stamped entries", `skill-wrappers.mjs:80-84`;
   the owned-name rule is a declared twin, `retiredBy` "the render moves to Rust"), "shell rc fgOS lines" (allowed
   `rc_lines.rs`; debt `src/setup/shell-rc.mjs`, reason "the repository's session-start hook prints the rc file names",
   `retiredBy` S7), "coexistence manifest" (allowed `coexistence.rs`; debt `src/install/coexist.mjs` until 10).

## Files

- Create: `packages/distribution/rust/src/{timer.rs,rc_lines.rs,coexistence.rs,skill_stamp.rs}`, `skill-stamp.v1.json`.
- Modify: `packages/distribution/rust/src/{lib.rs,workspace.rs,init.rs,uninstall.rs,fgctl_refresh.rs}` (the root
  call only), `apps/fgctl/src/main.rs` (the root call only), `packages/distribution/rust/Cargo.toml` (D15, if 01 has
  not landed it), `test/setup/skill-wrappers.test.mjs`, `test/rust-host/fixtures/invocation-root-table.json`,
  `docs/architecture-manifest.json`, census.
- Delete: none (Node modules go in 09, 10, 11).

## Gates

- `cargo fmt --all --check`; `cargo clippy -p fgos-distribution -p fgctl --all-targets -- -D warnings`;
  `cargo test -p fgos-distribution -p fgctl`; msvc and darwin `cargo check -p fgos-distribution -p fgctl`.
- `node scripts/run-tests.mjs test/setup/skill-wrappers.test.mjs test/setup/managed-timer.test.mjs test/rust-host/fgctl-init-preflight-tail.test.mjs test/rust-host/fgctl-upgrade.test.mjs test/architecture.test.mjs test/rust-host/invocation-root-table.test.mjs`.

## Risk and rollback

- The `fgctl` root changes for an edge case (a linked worktree, a home directory) (M x H): rows in
  `test/rust-host/fixtures/invocation-root-table.json` for the `fgctl` policy before the switch; `fgctl` tests green.
- Timer bytes differ (M x M): vectors from Node.
- Rollback: revert the phase; `workspace.rs` returns with its debt entry.
