# Git phase 03 review fixes

Fixed H1–H3 and M1–M4 in the existing Worktree/Refs/WAL doors. No commits or staging; no production environment switches or Cargo-target overrides.

- H1: Process scan exposes effective uid. Readable live cwds always protect the checkout; unreadable same-user or unknown-owner cwds remain fail-closed. Foreign unreadable processes are excluded; privileged actors/shared cross-user custody are outside the documented guarantee. The owner-policy vector does not depend on a private PID namespace.
- H2: Under the existing admin hold, record-only repair recognizes absent/empty-owned failed creates and unchanged remove/move registration, backlink, inode and expected tip. It writes terminal `Worktree(completed=false)` observations and releases the candidate pin. Immediate error paths use that reconciliation too; terminal replay refuses without repeating effects. Ambiguous residue stays pending. User locks and submodules refuse before attempt.
- H3: Ignored `.claude/worktrees` allocation inside main works. Main equality/ancestors, Git admin paths and nesting in linked checkouts remain refused.
- M1: Delivery must be reachable from a named non-`refs/fgos` ref; detached self-proof refuses.
- M2: Custody and live cwd are checked before TargetAttempt and again before the Git call. The remaining rank-30 acquisition window is documented in holder-lock §19; Git never acquires rank 30.
- M3: Ignored bytes remain protected, with collapsed directory enumeration and the existing bounded Inspect output. Preserved dirty/stale checkouts are advisory in doctor; pending operations and damaged/missing/locked registrations still fail. This adopts the review's minimum fix without authorizing deletion of ignored bytes.
- M4/L2: Reused Refs' checkout validation and branch/rebase/bisect membership; extracted shared admin acquisition and custody-path helpers. Removed duplicate WAL opens and centralized session-id validation and Worktree resource derivation in WAL.
- L1/L3/L4/L5: Restored the session comment's placement, removed the redundant Publication outcome guard, report non-directory admin entries without aborting the scan, and removed the unused prune parameter. Historical WAL-only rustfmt churn from the already committed phase is not reversed: that would add unrelated reverse-format changes to this fix; no whole-file WAL formatting was run.
- L6: Added coverage for main-nested allocation, locks/submodules, detached unreachable delivery, foreign admin files, advisory provisioned directories, same-user ownership judgment, real-permission strip failure/non-force rollback preservation, successful registered rollback settlement, and actual Git refusals after TargetAttempt. Existing real-Git SIGKILL syscall-barrier tests still cover all four crash residue shapes and preserve payload bytes.

Prior art: `8a8362712` introduced the reviewed port; the prior lead records `dd35a4b4e` admin/provisioning separation and `6e2e99093` force rollback superseded by G-033. This change extends the existing WAL terminal outcome and Refs helpers, adding no alternate writer. Impact-analysis: inactive (zero registered providers).

Validation (logs in `/tmp`):

```sh
cargo test -p fgos-git -p fgos-holder-lock -p fgos-node-addon
cargo clippy -p fgos-git -p fgos-holder-lock -p fgos-node-addon --all-targets -- -D warnings
node --test test/git/*.test.mjs test/verbs/*.test.mjs test/setup/*git*.test.mjs test/cli/subcommand-flag-drift.test.mjs test/architecture.test.mjs
cargo test -p fgos-process
cargo test -p fgos-git --test worktree
npm run build:skills
git diff --check
```

Requested Rust suite and clippy: green. Node: 124 passed, one Windows-only test skipped. Worktree integration: five passed, including real Git kill barriers and rollback settlement. Generated skills remain unchanged. Extra Process suite passed on rerun; its first concurrent run had a lock-table assertion failure, which passed in isolation and on full rerun. Full `npm test`, Windows and power-loss proofs were not run; the requested targeted gate is the proof scope. Logs: `/tmp/p03-{cargo-final,clippy-final,node-final,process-final,worktree-final,skills}.log`.

No out-of-scope edits. The mandatory program-board lane update is outside the enforced write scope and remains unwritten. Convention returned a 10:54 report name; this report retains the exact 10:52 path required by the assignment. MDView preview failed because its database is read-only.

Status: DONE_WITH_CONCERNS
Summary: Worktree review findings are fixed with targeted behavior and crash-recovery proof. No staging or commits performed.
Concerns/Blockers: Program-board lane update needs write scope; documented custody probe window remains; MDView database is read-only.
Context refs:
- (none)
