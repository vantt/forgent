# Git preflight review fixes

M1/L1: checkout and publication now share `validated_config`, the existing ConfigStamp mechanism and a single cache entry shape. Each checkout child stats cached global/system paths, common config, worktree config and origin files; changed stamps force config re-read and trust validation. Changes during a read refuse instead of caching an unstable decision. Publication entries are keyed by gitdir so linked worktree config cannot share another worktree's approval. Prior art reused: ConfigStamp/publication preflight, introduced and hardened in `634263504` and `6656b06d1`.

L2: `refresh_checkout_facts` owns invalidation, refresh and refill inside driver.rs, returning errors without expect/panic. Ports only call the method. L3: refreshed promisor status must match the operation handle; both successful and rejected hooks that change it are refused. Spec and changelog match. L4 was not implemented.

## Verification

- `cargo test --locked -p fgos-git`: 116 passed, one existing ignored helper, including an independent config writer between children; the next child refuses executable filter config and the invalidated operation remains fenced after repair.
- `cargo clippy --locked -p fgos-git --all-targets -- -D warnings`: passed.
- `node --test test/git/scoped-commit.test.mjs test/git/sync.test.mjs`: 33 passed, including post-hook promisor changes on success/rejection. Exact census: preflight 9 + commit 28 = **37 execs**; config/object-format/ref-format probes remain 1 at preflight and 2 during commit.
- `node --test test/git/commit-parent-death.test.mjs test/git/lock-handover.test.mjs test/git/cutover-grant.test.mjs`: 12 passed.
- `git diff --check`: passed. Impact-analysis: inactive (zero providers).

No E3 timing run, full npm test, git add or commit. No environment switches, test-only production branches, config defaults or dependencies added. MDView preview attempted; its database is read-only. Program-board changes remain with the coordinator outside this write scope.

Status: DONE
Summary: Addressed M1, L1, L2 and L3 with one stamp-validated config cache door, driver-owned refresh and promisor-change refusal; unchanged preflight/commit remains 37 execs.
Context refs:
- (none)
