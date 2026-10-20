# Git phase 06 unit 14 — final review fixes

M1: The namespace-init test is explicitly ignored with the requested reason; an explicitly requested run fails on an unavailable bwrap probe. The exact host gate is in Git spec’s cooperative termination acceptance notes.

M2: Hooks ownership checks scope plus the exact repository config origin through the existing parser. Included values remain user-owned even with matching WAL history. Read-only hooks inspection reports includes without granting execution trust; the existing writer still refuses `repository-config-untrusted: include.path` when local removal encounters an include. Regression tests cover both origins together and include-only values with prior owned provenance.

L1: A synced guard-device/inode marker precedes exchange. Repair resumes both sides of the exchange interruption, removing only the recorded empty guard and retaining the owned artifact. Replaced/nonempty guards are preserved. Exchange changes ctime, so post-move verification uses the owned inode, matching the existing post-move check.

L2–L5: Removed the unreachable ETIMEDOUT branch; proven pre-connect failures retain unreachable, uncertain requests still query the server, and terminal PRs stop UNKNOWN polling. Missing registered worktree paths remain lexical extraction exclusions. Real Git deadline tests moved from holder-lock to Git, with wider readiness/deadline budgets. Only successful lock metadata lookup maps to native-index-lock-unowned; other metadata errors retain their actual cause.

Reused the existing config parser/writer, quarantine door, borrowed-I/O port and filesystem checkpoints. Prior art: 266b46b0f’s exchange guard and hooks scope handling, and 7c9662347’s shared config recovery. No new environment switches, dependencies or config defaults. Review file preserved unchanged. Impact-analysis: inactive (zero providers).

Passing focused verification (exact commands):

- `cargo test -p fgos-git --lib native_lock -- --test-threads=1` — 10 passed.
- `cargo test -p fgos-git --test repository_config --test safe_restore --test scoped_commit_sync -- --test-threads=1` — 8 + 17 + 21 passed; three existing subprocess entries ignored and exercised by parent tests.
- `cargo test -p fgos-git --test borrow_deadline -- --test-threads=1` — one passed, namespace-init explicitly ignored (not verified).
- `cargo test -p fgos-holder-lock --test borrow_io deadline_reports_cooperative_cleanup_or_forced_residue -- --exact --nocapture` — one passed, covering cooperative and forced cleanup.
- `node --test test/git/github-adapter-contract.test.mjs test/runner/github-adapter.test.mjs test/architecture.test.mjs` — 49 passed.
- `cargo clippy -p fgos-git -p fgos-holder-lock --all-targets -- -D warnings` and `git diff --check` — clean.

No full npm test, E3, staging or commit. Host gate:

```sh
cargo test -p fgos-git --test borrow_deadline real_read_tree_deadline_as_namespace_init_cleans_its_native_lock -- --exact --ignored --nocapture
```

Status: DONE_WITH_CONCERNS
Summary: Fixed M1, M2 and L1–L5 with passing focused verification and documented host acceptance.
Concerns/Blockers: Full npm test, E3 and the namespace-init gate still require the host. Existing include mutation admission remains fail-closed. MDView preview failed because its database is read-only. Program-board lane update is outside write scope and is left to the coordinator.
Context refs:
- (none)
