# Git review fixes (work/es-gitfix)

New commits on top of ae23ac134 (no rewrite of 790616298 / 4e566bc6d):

| Finding | Commit |
|---|---|
| High: historical WAL recovery with `legacyEvents` | feeafe643 |
| Medium x2: NUL-split shrink guard; fail-closed fence detection | 64f9163b3 |
| Census regenerated | 711107171 |

## Changes
1. `packages/git/rust/src/scoped_commit.rs`: recovery (`observe_checkout_commit`) decodes the stored request via
   `StoredCommitRequest { message }` (unknown fields ignored). `CommitRequest` still denies unknown fields, so new
   requests keep refusing `legacyEvents`. Proof: `recovery_reconciles_an_attempt_stored_with_the_retired_legacy_events_field`
   in `scoped_commit_sync.rs` (stored non-null `legacyEvents` at TargetAttempt, committed and not-committed; asserts the
   new request type rejects that JSON; fresh commit works afterwards).
2. `.githooks/pre-commit`: shrink guard uses `git diff --cached --diff-filter=M -z` and splits on NUL. Test: non-ASCII
   shard name `.fgos/events/shard-é.jsonl` refused.
3. `.githooks/pre-commit`: `ls-tree HEAD` failure refuses unless `rev-parse --verify --quiet HEAD` exits 1 with no output
   (unborn). Top-level handler prints the refusal. Tests: HEAD tree object deleted -> refusal asserted on the hook's own
   message (not on git failing earlier); first commit with no HEAD is not refused as unreadable fence.

## Verification
- `cargo test --locked -p fgos-git`: all green. `cargo clippy -p fgos-git --all-targets -- -D warnings`: clean.
- Hook tests need FGOS_HOST_BIN (host built from this tree). All event-log/fence tests pass, incl. the 3 new.
  7 lock-holder tests (`holdLockInChild`: child exits 1 without taking the lock; same-lock/FGOS_LOCK_FD/borrow cases) fail
  here with and without my hook change (baseline run with HEAD hook also fails them); environmental, unrelated.
  `test/githooks` does not exist in this tree.
- Census: `--write-census` then `--check` shows only main's 5 unresolved-binary sites (2 bin/fgos.mjs, 2 merge.mjs, worktree.mjs:146).
  The census also picked up a changed `bin/fgos.mjs` hash (not edited here; stale in the base).
