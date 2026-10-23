# Phase 8 lead report: census-gated deletes, Q3 sentence, Q4 Node arms

Date 2026-10-23 (Asia/Saigon). Status: DONE_WITH_CONCERNS (owner-machine census pending for the second branch).

## Census, this machine
`find $HOME -xdev`, the phase script, run 16:2x:
`TOTAL {"wals":155,"legacyScopedOrSync":0,"ledgerV1":0,"unreadable":0}` (no per-WAL lines, nothing to mark scratch/real).
Activated release: one workspace (forgent), activated 2026-10-23, after `869e789d7` (2026-10-19 18:15 +07). Clean for slices A and C here. Owner machine: pending; slices A and C must not merge until it reads zero.

## Branch `harden/t2-p08-census-deletes` (merge-ready after OPC)
- `f80dcaadb` Q4 Node arms. Removed: Remote `fetchRefs` + `inspectRemote`, Publication Node `fetchRefs` arm, RepositoryConfig facade `recover`, worktree create `sessionId` read. Proofs (rg, 2026-10-23): `\.fetchRefs\(|\.inspectRemote\(` in src bin scripts: none; `createGitRepositoryConfig` only in `src/setup/git-hooks.mjs`, which calls inspectHooks/ensureHooks/removeOwnedHooksConfig; no `src/runner|src/git` site sets `sessionId` on create. Rust kept: `Publication::fetch_refs` (event store), `recover_hooks_config`/`recover_config_change` (Recovery, Rust tests), driver `fetch_refs`/`inspect_remote` (now called only by Rust tests `refs_remote.rs`, `ssh_transport.rs`; no production caller, named here, not deleted), `WorktreeCreate.session_id` (WAL field). Also edited `ports.v1.json` (pinned by native-load) and the spec Remote row (line 122): not in the Files list, needed so contract and addon agree.
  - Proofs moved or retired: fetch destination-outside-remote-tracking and symbolic-destination refusals moved to Rust `fetch_refuses_destinations_outside_remote_tracking_and_symbolic_destinations`; config `recover` Node line retired (owner: `repository_config.rs` recover_hooks_config tests); invalid sessionId on `create` retired (behaviour removed; createDetached keeps its check); native-load `inspectRemote` probe retired (the trusted-helper rule is asserted by the `git-repository-config` check right above it).
- `bf9c6f284` Q3 spec sentence (spec §2). No ResultCode added.
- Slice B dropped, kept by evidence: `CheckoutProof.old_index` is written as null into every Land record and the struct is `deny_unknown_fields`, so removing it breaks retained chains (writer `d66220926`/`5e8090cf7`, always present); the Restore `Snapshot` `#[serde(default)]` attributes only admit snapshots from before `bcec8ad3b` (2026-10-20), the fields themselves are read, and retained snapshots are not censused.
- `299adc4b5` census regenerated: exactly 5 unresolved sites (the CFG readSharedConfig ones).

## Branch `harden/t2-p08-census-slices` (do not merge before owner census; rebased on `299adc4b5`)
- `452eefcbb` slice C: ledger reader 2..=3, v1 digest arm, `publication.rs` legacy-receipt refusal removed; retired wal.rs `legacy_compact_entries_keep_their_binding_and_exact_request_replay` and the old-entries block in `tests/publication.rs` (behaviour removed). Operation-record `"version":1` untouched.
- `131accd62` slice A: only `checkout_resources` accepted; `compact_matches`, `legacy_resource` removed; `in_checkout` and foreign-checkout comparison custody-only. `wal.rs checkout_resource_valid` untouched (shared with Restore/Land, uncensused). Test `legacy_chains_from_a_dead_checkout...` converted to seed the custody form (renamed `chains_from_a_dead_checkout_are_abandoned_without_replay`), fixture `legacy` flag removed.
- `6eca360c8` census regenerated, 5 sites.
- rg checks: `format!\("worktree:\{\}"` in src: none; `c\.v == 1`: none.

## Verification
- Branch 1 (target `t2-p08-target`): `cargo test --no-fail-fast -p fgos-git -p fgos-event-store -p fgos-identity` 502 passed, 0 failed; clippy `-D warnings` incl. fgos-node-addon clean; addon crate builds (`--no-run`; its own unit binary cannot load napi symbols outside Node, pre-existing); Node one-file run (remote, scoped-commit, sync, land, safe-restore, repository-config, worktree, native-load) 94 pass, 0 fail, 1 skipped; after census: one-door, e3-census, remote, native-load, scoped-commit, sync 60 pass, 0 fail, 1 skipped.
- Branch 2 (target `t2-p08b-target`): cargo 501 passed, 0 failed; clippy clean; Node same 8 files 94 pass, 0 fail, 1 skipped; post-census set 60 pass, 0 fail, 1 skipped. No `run-tests: ERROR` lines.

## Delta (lines, +/-)
- Branch 1: Rust src -37/+8 (addon) and tests +54 (one new Rust test); Node src -9/+7; Node tests -16/+3; json -6/+2; spec +1/-1.
- Branch 2: Rust src -81/+14; Rust tests -25/+7.
Test cost: 1 added (Rust, moved down from Node), retired 7 assertions/cases (5 on branch 1, 2 on branch 2), 0 new spawns.

## Notes / ideas for the owner (not done)
- `createDetached` with `parent` + `sessionId` has no caller in `src` (tests only): deletion candidate.
- Driver `fetch_refs`/`inspect_remote` are test-only in production code now.
- A verification command run mid-task failed its `cd` and executed in the main checkout read-only (tests only; `git status` there unchanged); no write to tracked files.
