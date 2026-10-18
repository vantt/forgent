# Owner machine: Git phase 01 Lane B is on main

Written 2026-10-18 20:05 (Asia/Saigon) by the big lead of the GIT and ES lanes (session `ac420727`, second machine). Follows [the 15:15 guide](guide-261018-1515-owner-machine-after-git-and-event-store-merge.md).

## What is on main now

- `3dc51f1e0`: Git phase 01 Lane B merged with main after terminal mode landed (no conflicts; `registrations.mjs` and `architecture-manifest.json` keep both sides).
- `8b015102e`: clippy fixes in `fgos-run-supervisor` (gate and three tests) that terminal mode left red on current Rust; behavior unchanged, 120 tests pass.
- Event Store phases 01-03 (on main since 16:08).

Gate on the second machine before pushing: Rust 643 pass (1 known failure: `fgos-process` `containment_terminal_gate_dies_with_a_killed_supervisor`, still failing after terminal mode); `npm test` 8011 pass, 3 known pre-existing failures (`fences-v1-tombstone` real v1 acquire, `holder-lock-checks` monitor/supervisor membership, `skill-wrappers` instruction-audit projection).

## Nothing to activate yet

Plain `fgos` keeps running the activated release. The next stop-everything landing is requested by the Git lane when phase 01 is complete (E3 measurements against the owner-set budgets remain).

## What the next landing will change at runtime

In addition to the 15:15 list (holder-lock cleanup rule, `lock-resource-replaced`, containment fast exit):

- **New release component:** the combined N-API addon (`fgos-git` + `fgos-event-store`) is staged in the payload; the manifest carries `components.nativeAddon` with its digest and ABI line. Releases without it still verify. A windows-x64 release does not claim `git-wal-v1`.
- **`fgctl` activation gate (C5):** a release without the Git WAL is refused when the workspace has a pending Git WAL; the first activation that carries the WAL places the fence that stops an older `fgctl`. The predecessor-writer check is scoped to the workspace being activated.
- **Lock registry:** new row `repo-config` (rank 80).
- **`fgos setup`** installs the events fetch refspecs (`refs/fgos/events/*` to `refs/fgos/remotes/<remote>/events/*`) through RepositoryConfig, preserving user config.
- **Doctor:** six new checks `git-component-compatible`, `git-trust-topology`, `git-operation-journal`, `git-native-locks`, `git-publication-refspecs`, `git-durability-capability`.
- **Fence status:** `fenceStatus` and `placeFences` use one fence set; the fgctl-owned `activation.lock` is reported separately as `controllerMissing`.
- **CI:** `cargo deny` with `.github/cargo-deny.toml`; one documented advisory ignore (RUSTSEC-2024-0449, `serde_yaml`/`unsafe-libyaml`, open item on the board).

## For sessions on the owner machine

1. Merge main before your next phase; expect overlaps in `src/setup/registrations.mjs`, `docs/architecture-manifest.json`, `CHANGELOG.md`, `src/holder-lock/fences.mjs`.
2. Terminal mode has landed, so the Git/ES lanes now do the deferred moves themselves: `packages/run-supervisor/rust/src/publish.rs` and `packages/terminal-control/rust/src/store.rs` onto `fgos-durable-file`, `packages/run-supervisor/rust/src/envelope.rs` onto `fgos-canonical-json`. Do not start them elsewhere.
3. Git phase 04 (the `dispatch-cwd` lease held across the runner commit) is now unblocked and belongs to the Git lane.
