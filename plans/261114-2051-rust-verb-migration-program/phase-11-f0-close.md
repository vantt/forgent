---
phase: 11
title: "F0 close: docs, proof consolidation, gates"
status: pending
effort: 1d
wave: E
blockedBy: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
---

# Phase 11: F0 close

Write down what F0 settled where a stranger agent will look for it, prune the CLI end-to-end cases
whose behaviour now has a Rust owner, run every gate on the integration head, and hand the branch to
the big lead for landing.

## Phase-lead rules (every F0 phase)

- Repo `/home/vantt/projects/forgent` on fg-server2. Read `AGENTS.md`, `docs/reading-map.md`, then this file.
- Worktree: `/usr/bin/git worktree add -b rust-verb-migration-program/f0-p11 /home/vantt/projects/forgent-worktrees/rvm-f0-p11 origin/rust-verb-migration-program/f0`. Assert it is in `git worktree list`.
- `export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/rvm-f0-p11-target` (ext4, never `/tmp`). Delete it when the phase lands.
- Tests: `node scripts/run-tests.mjs <file.test.mjs> ...` (focused). The full `npm test` and `cargo test --workspace` here need the F0 lead's go (shared machine).
- No plan ids, phase numbers or finding codes in code, test names or commits. No env switch or test-only branch.
- Before each commit: `/usr/bin/git diff --cached --stat`; explain any large deletion. Stage explicit paths. Never `git stash`.
- Push the phase branch at least every 30 minutes. Never push to `main`. Do not edit `CHANGELOG.md` or `Cargo.lock`.
- Report: `fgos convention path --kind report --type phase --slug f0-p11-close --plan 261114-2051-rust-verb-migration-program --json`. End with `Status / Summary / Concerns`.

## Requirements

1. **Docs** (read each before editing; resolve owners through `docs/platform/governance.md#decision-scope-to-holder-table`):
   - `docs/platform/host-invocation-routing/spec.md`: §2 rows (help answered by the host; "Native hook kind"
     row now names `native_subcommands` and the registry `native` field), §3/§6 counts (80 selectors, no help routes).
   - `.../contracts/command-route-descriptor.md`: field table (`native_subcommands`, `store`, `mutates_store`,
     `lands_work`, `event_store_child`; `native_kinds` gone; source of "native" is the registry); correction note recount.
   - `.../contracts/legacy-payload.md`: the payload no longer answers help.
   - `docs/platform/agent-mailbox/spec.md` lines naming `native_kinds` (166, 175, 524, 641): the new field name only.
   - `docs/platform/packaging-distribution/spec.md` 865-873 (the help paragraph): help is the host's, from the
     generated manifest; no help selectors in the route table.
   - Decision history ("Lịch sử quyết định") in the owning specs, one entry each: help door moved into the host
     (extends `3a479738c`); one native declaration field; store admission owned by Git; invocation-fault record
     owned by Observe; Event Store maintain policy owned by the Event Store. Mint any decision number with
     `fgos identity mint d-adr` only if the holder table asks for one.
   - `AGENTS.md` "Legacy-Node CLI Ownership Boundary": one sentence that help is served by the host only.
   - `docs/reading-map.md` row for `src/cli/command-registry.mjs` (line 144): mentions `native`, `publicManifest`, no `HELP_SELECTORS`.
2. **Proof consolidation:** in `test/cli/fgos-disconnected-worktree-guard.test.mjs`, retire the cases whose only
   claim is an admission rule now owned by `packages/git/rust/src/store_admission.rs` tests, keeping one CLI
   refusal case, one explicit `--dir` case and the session-worktree case as wiring. Name each retired test and its owner.
3. **Gates on the integration head** (all green, numbers in the report): `npm test`; `cargo test --workspace`;
   `cargo fmt --all --check`; `cargo clippy --workspace --all-targets -- -D warnings`;
   `cargo check -p fgos -p fgos-git -p fgos-observe -p fgos-event-store -p fgos-node-addon -p fgos-process -p fgos-holder-lock -p fgos-run-supervisor --target x86_64-pc-windows-msvc` and the same for `aarch64-apple-darwin`;
   `node scripts/run-tests.mjs test/scripts/doc-health.test.mjs test/scripts/check-decision-citation-drift.test.mjs`;
   `node scripts/git-one-door-scan.mjs --root .` (count not above phase 00's baseline; regenerate the census);
   `node scripts/export-command-selectors.mjs --check`.
4. **Measurements** against phase 00: `fgos --help --json`, `fgos add --help`, `fgos config show --json` medians.
5. **Hand-off:** the user-visible `CHANGELOG.md` lines (help served by the host and faster; direct `node bin/fgos.mjs --help`
   refused with a pointer; malformed calls to native verbs now recorded) go to the big lead in the report, not into the file.
   Confirm the F0 file set in `plan.md` matches `git diff --stat origin/main...HEAD` (add anything missing to plan.md).

## Files

- Modify: the docs listed above, `test/cli/fgos-disconnected-worktree-guard.test.mjs`, census,
  `scripts/check-decision-citation-drift.baseline.json` (only if the drift check asks), `plan.md` (status and file set).
- Delete: none. Net size: docs about ±80; tests about -60.

## Risk and rollback

- Doc citation drift (M x L): run the drift test after every doc edit.
- Rollback: revert the phase; F0 code stands.
