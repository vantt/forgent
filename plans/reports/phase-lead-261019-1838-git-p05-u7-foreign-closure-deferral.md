# Git phase 05, unit 7 — final re-review fixes

M-1: Foreign closure propagates outcome-append errors only. Once durable, pin-release/compaction failures retain evidence and return `checkout-compaction-deferred` warnings on the new ScopedCommit/Sync receipt; later admissions retry cleanup. The real-Git regression covers dead pre-attempt and attempted chains with a stray `.durable-file-*.tmp`, successful commits in the recreated checkout, warnings, retained evidence, and cleanup retry.

L-1: Branch validation now runs only for unresolved SyncCommitAttempt observation. L-2: Both compacted replay paths use the receipt's recorded reference, with None for older receipts; new detached-HEAD Sync refuses as `sync-detached-head-refused`. Version-3 Sync compact receipts bind the reference in their digest; other new entries stay version 2, old entries remain readable, and the 512-byte bound remains enforced. Regressions cover retained and compacted terminal replay after branch switch/detach, older version-2 reference-free receipts, and changed-request rejection.

L-3: Git spec §12 now documents reflog-only candidate inspection, exact-entry removal under custody for unrelated candidates, observe-only recovery, and manual effect evidence for attributable candidates. Restored §8's guarantee that a durably closed foreign chain cannot block the current checkout even if its compaction is deferred. Updated Unreleased.

Reused existing WAL append/ledger, pin-release, checkout admission, warning receipts and fixture helpers. Prior art: `git log -G 'foreign-checkout|sync-reference' -- packages/git` (159c165a8, dd522f682, 869e789d7); review and unit-6 report read. Impact-analysis: inactive (zero registered providers). Convention queried; retained the assignment's exact report path. No new test file, env bypass, staging, commit, full npm suite or E3.

Validation (final commands, all passed):

```sh
cargo test -p fgos-git --lib --test scoped_commit_sync
cargo clippy -p fgos-git --all-targets -- -D warnings
TMPDIR=/tmp FGOS_HOST_BIN="$PWD/target/debug/fgos" node --test test/git/scoped-commit.test.mjs test/git/sync.test.mjs
git diff --check
```

Evidence: 37 Rust library tests, 20 Rust integration tests, 26 Node tests. Initial regression failures exposed a second compacted replay symbolic-ref lookup and detached refusal ordering; both corrected. MDView preview attempted for the spec and report; its database is read-only. Full suite/E3 and installed-release acceptance remain host gates.

Status: DONE_WITH_CONCERNS
Summary: Fixed M-1 and L-1/L-2/L-3 with focused real-behaviour regressions and matching Git documentation.
Concerns/Blockers: Host acceptance gates remain; MDView preview unavailable.
Context refs:
- (none)
