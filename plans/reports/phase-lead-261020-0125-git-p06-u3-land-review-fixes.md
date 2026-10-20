# Git phase 06 unit 3 — Land review fixes

- H1: two-tree `read-tree -m -u <target> <candidate>` preserves unrelated staged modifications/additions; staged overlap refuses before CAS. Recovery records the expected index stage-entry digest and preserves the same staged state before/after interrupted reconciliation; legacy clean proofs remain readable.
- H2: destination-slot admission closes same-writer/authority pre-attempt chains as `abandonedBeforeAttempt`, retaining evidence. Both normal session close and real verifier SIGKILL allow a fresh prepare without explicit recovery first; different-writer abandonment has a named recovery refusal.
- M1: Land and Refs use the existing Refs post-attempt classification through one extracted helper, including checkout-facts comparison. Real ref-lock failures at old/candidate tips remain unresolved; only a third-party tip records Loss.
- M2: publish inspects WAL phase before live ref/candidate checks; retry after a ref-moving interrupted attempt reports recovery-required. Fresh identities refuse already-merged sources.
- L1: literal file paths validate before candidate allocation; subsequent failures carry the retained candidate path and deterministic Worktree operation id in bounded diagnostics.
- L2: WAL `pendingStoreCollision` distinguishes an untouched checkout from reconciled checkout with unrelated dirt (`pending`); both retain the public pending receipt.
- L3: lost same-id prepare/publish replay returns the same stale error and receipt.
- L4: established receipt replay occurs before destination-slot acquisition, including while another session holds that destination.

Reused Refs CAS classification, existing destination slot/WAL abandonment transition, no-follow checkout fingerprints and the Worktree candidate operation id. Prior art: `78429d1dd`, `d66220926`, Git spec §9/§10 and D-ADR0042. Updated Git spec, WAL schema and changelog. `impact-analysis: inactive` (zero providers); callers checked with source searches. No production callers, new infrastructure, full npm suite, E3, lifecycle verbs, sub-agents, git add or git commit.

Focused verification commands:

```sh
cargo test --locked -p fgos-git --lib --test land --test land_crash_matrix --test refs_remote --test scoped_commit_sync
cargo clippy --locked -p fgos-git -p fgos-node-addon --all-targets -- -D warnings
node --test test/git/land.test.mjs test/git/land-recovery.test.mjs test/git/refs.test.mjs test/git/scoped-commit.test.mjs test/git/sync.test.mjs test/architecture.test.mjs
rustfmt --edition 2021 --check packages/git/rust/src/land.rs packages/git/rust/src/refs.rs packages/git/rust/tests/land.rs packages/git/rust/tests/land_crash_matrix.rs
git diff --check
```

Results: 39 Rust library tests, 13 Land tests, 16 Refs/remote tests, 20 ScopedCommit/Sync tests; crash matrix 9 passed with 2 child/controller helpers intentionally ignored at top level (57 Land checkpoints, 34 cleanup checkpoints, four native read-tree syscall boundaries). Node/architecture: 91 passed. An early overlapping rebuild removed a running crash harness's executable; the matrix was rerun with its executable stable. Two initial Node fixture mistakes were corrected before the passing run. Convention lookup returned this exact report path. MDView preview failed because its database is read-only.

Status: DONE_WITH_CONCERNS
Summary: All eight review findings are addressed with real Git regression coverage, including staged-data preservation, abandoned-prepare admission and consistent recovery/replay behavior.
Concerns/Blockers: The coordinator must update the shared program-board lane row (outside the authorized write scope). MDView preview unavailable (read-only database); Land remains dormant pending the existing later-phase adoption work.
Context refs:
- (none)
