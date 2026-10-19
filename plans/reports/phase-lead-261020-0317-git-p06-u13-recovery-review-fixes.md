# Git phase 06 unit 13 — recovery review fixes

- M1: Removed the recovery leaf from Publication recovery: existing event-seal authority already serializes writers/recoverers (§5), so an unrelated recovery cannot alter live Event Store behaviour; regression holds that leaf across publish, recover, same-id publish and recover_publications.
- M2: Restored existing lock-free remote_scope for non-event transfers; the main-checkout-50 loan regression pushes successfully without creating worktree-admin. Only observe-only transfer recovery takes 40→80; §5 now states that distinction.
- M3: Production mergeGitHubPR queries after timeout/unreachable failure, retains outcome-unknown without confirmation, and short-circuits MERGED; contract calls it twice and proves exactly one request, with a broad executable-literal guard. This is passing production evidence, not a pending phase-07 contract.
- M4: Extraction skips NotFound registrations, still excludes every existing registered directory; real sibling-worktree deletion/prunable extraction regression passes.
- M5: Terminal ref recovery reuses release_pin (also on terminal replay); real ptrace/SIGKILL cases cover installed pin, TargetAttempt, observed ref CAS and remote effect, plus missing custody, dirty checkout and native ref lock. Unknown effects stay pending; terminal ref cases compact without pins; transfers never resend.
- L1: recover_hooks_config delegates to recover_config_change, then inspects.
- L2: ConfigChange reconciliation refuses caller loans explicitly; the matrix checks this before recovery in both orders.
- L3: ConfigChange's owning recovery in the matrix now uses recover_hooks_config(ID), not a successor operation.
- L4: Local hooks ownership reads --show-scope local through the existing config parser instead of matching origin path spellings.
- L5: Collision metadata is read once per path; tracked metadata is inspected only for case-folded-equal names, preserving distinct untracked hard-link refusal.
- L6: Compacted inspection derives kind from decoded typed outcomes when recoverable; generic receipts honestly return null rather than inventing their erased payload kind. Compacted Restore regression checks kind.
- L7: Updated Recovery heading, matrix evidence and phase-07 caller-move boundary in the spec.
- L8: E3 paired samples alternate execution order; 1.5×/1.2× p95 budgets remain explicitly unproven because E3 is prohibited in this sandbox.
- L9: Linux quarantine uses renameat2(RENAME_EXCHANGE) and a directory guard, following holder-lock's existing tombstone technique; late-substitution regression proves the guard excludes another creator. Unsupported kernels/filesystems keep the honest non-overwriting fallback; §11 documents fallback and interrupted guard evidence.
- Registry decision: Reused the one existing recovery entry with runDir=<common>/fgos/git; registry note and holder-lock/Git contracts agree.

Reuse/prior art: 8afafb6f3 introduced the reviewed leaf and remote lock drift; remote_scope and release_pin remain the existing doors. Config recovery reuses 3e0cc30af's writer. No new production layer, lock entry, environment switch or per-spawn reach policy.

Verification (exact commands):

- `cargo test -p fgos-git --test publication -- --test-threads=1`: 30 passed, one subprocess entry ignored; corrected the new fixture to initialize private WAL directories before taking its competing lock.
- `cargo test -p fgos-git --test recovery_matrix --test refs_remote --test repository_config --test safe_restore --test scoped_commit_sync --test worktree -- --test-threads=1`: 71 passed, four subprocess entries ignored (including the 24 pre-attempt + six later real SIGKILL cases).
- `cargo test -p fgos-git --lib native_lock -- --test-threads=1`: eight passed, including the Linux exchange guard/substitution test.
- `cargo clippy -p fgos-git -p fgos-node-addon --all-targets -- -D warnings`: clean.
- `node --test test/git/github-adapter-contract.test.mjs test/runner/github-adapter.test.mjs test/holder-lock/registry-contract.test.mjs test/architecture.test.mjs`: 71 passed; after the final timeout classification edit the two GitHub files were rerun, 19 passed.
- `node --check scripts/git/e3-bench.mjs` and `git diff --check`: clean.

The earlier `cargo test -p fgos-git -p fgos-event-store -- --test-threads=1` passed every Event Store suite, Git's 47 unit tests and all preceding Git suites (including Land's 15 crash tests), then failed only on the new fixture's missing directory; the complete Publication rerun above is green. Impact-analysis: inactive (zero registered providers). No full npm test or E3 run; no staging or commit. The original review is preserved unchanged.

Status: DONE_WITH_CONCERNS
Summary: Fixed M1–M5 and L1–L9 within the assigned scope, with real production behaviour and crash evidence. Performance budgets remain unmeasured.
Concerns/Blockers: E3 must run on the host; test/git/recovery.test.mjs was not run because its helper stages .fgos/runtime/git-addon outside the declared write scope. MDView preview failed with a read-only database.
Context refs:
- plans/reports/review-261020-0315-git-p06-u9-u11-recovery.md
- plans/reports/phase-lead-261020-0308-git-p06-u12-cooperative-termination.md
