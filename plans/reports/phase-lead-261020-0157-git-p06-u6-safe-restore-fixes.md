# Git phase 06 unit 6: SafeRestore review fixes

- C1: Protect incoming ancestors and replaced-directory descendants; ignored ancestor bytes survive default refusal and are snapshotted before explicitly authorized replacement.
- H1: Untracked ancestor collisions refuse with either reapply setting; only exact `allowedReplacements` paths permit replacement, including ignored descendants.
- H2: Capture local/absent/untracked/collision bytes and clean permission metadata; clean tracked content stays in Git objects. A clean tracked file larger than 32 MiB restores successfully.
- M1: Missing/corrupt original or post snapshots close observation with the exact named cause and retained WAL/evidence; operation-bound snapshots allow an identical fresh restore without overwriting damaged evidence.
- M2: Reapply retains incoming executable bits and local non-executable permissions; competing local executable changes refuse before reset.
- M3: Durable acknowledgement precedes byte release and terminal WAL compaction; interrupted byte cleanup retries, interrupted compaction remains admissible. Valid unreferenced snapshots/recognized temporaries expire after seven days; referenced, corrupt and unknown evidence remains protected.
- M4: Existing Restore port exposes `listSnapshot`, private/no-overwrite `extractPath` outside the checkout/main/admin paths, and `acknowledge`, with the same custody/writer checks through Rust/addon/Node.
- L1: Replace the checkout-root closure unwrap with propagated failure.
- L2: Compare full incoming blob identities and refuse overlapping content before effects, including patches Git could otherwise apply at offsets.
- L3: Preserve intent-to-add separately from staged and unstaged binary deltas.
- L4: Completed restores return `restored` with a named post-check warning when only verification fails.

Reused `SavedPath`, clean-permission metadata conventions, the existing WAL compaction ledger and Land's acknowledgement pattern. Prior art: `0c26f17c9`, `d2192042a`, `869e789d7`, `d66220926`. Empty replacement lists remain omitted from serialized requests to preserve historical WAL hashes. Git spec/port registry/WAL schema and changelog agree. The untracked review was kept unchanged; production migration remains dormant. Impact-analysis: inactive (zero providers).

Validation:

- `cargo test -p fgos-git --test safe_restore -- --test-threads=1 --nocapture`: 14 passed, one child entry ignored; 77 real SIGKILL boundaries.
- `cargo test -p fgos-git --test contracts --test scoped_commit_sync --test land --test publication --lib`: 104 passed, one child entry ignored.
- `cargo clippy -p fgos-git -p fgos-node-addon --all-targets -- -D warnings`: passed.
- `node --test test/git/safe-restore.test.mjs test/git/scoped-commit.test.mjs test/git/land.test.mjs test/architecture.test.mjs`: 79 passed.
- `node --test test/git/safe-restore.test.mjs test/architecture.test.mjs`: 33 passed; final `node --test test/git/safe-restore.test.mjs` rerun: four passed, including main/producer extraction-boundary checks.
- `git diff --check` and JSON contract parsing: passed. No full npm suite, E3, staging or commit.

Status: DONE_WITH_CONCERNS
Summary: All requested SafeRestore findings are addressed with real Git and crash/recovery coverage.
Concerns/Blockers: Program-board update requires out-of-scope `plans/261017-1313-fgos-platform-program-board/plan.md`; not written. MDView preview failed with a read-only database.
Context refs:
- (none)
