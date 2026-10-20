# Git typed-operation review fixes

Fixed H1/M1/L1/L2/L3 only. The driver forces signature display, decoration, abbreviated commit display and color off for every child. Signed-commit regressions cover ScopedCommit, recovery's reflog walk and Land recovery's candidate-parent check. Land's test seeds a signed candidate through the existing WAL API and verifies recovery; no production fault switch was added.

Reused the checkout identity comparison as one `same_checkout` predicate (gitdir/common-dir/worktree) for validation and fact reuse. Cutover reuses the existing dirty-path inventory. History checked: `5f29974d2` introduced operation-local fact reuse; `78429d1dd` introduced Land; no earlier signature-display override was found. Impact-analysis: inactive (zero providers).

The suite census uses the restored PATH-wrapper technique through `--observer wrapper`: direct Git launches only, no external tracer. Host mode still requires strace and fails loudly if unavailable; lock/internal-child census remains host-only. Spec and changelog updated. The original untracked review is preserved unchanged.

Validation (logs under `/tmp/fgos-work/`):

- `cargo test --locked -p fgos-git --test land --test scoped_commit_sync --test recovery_matrix`: 39 passed, 2 ignored child-harness entries; controllers exercised child processes (`git-p06b-u2-rust.log`).
- `node --test test/git/*.test.mjs`: 150 passed, one Windows-only skip (`git-p06b-u2-node.log`).
- `node --test test/git/scoped-commit.test.mjs`: 26 passed after final assertion cleanup (`git-p06b-u2-census-final.log`).
- `git diff --check`: clean.

No full npm test, E3, staging or commit. MDView could not preview the spec because its database is read-only. Report uses the exact assigned path; convention generated the current-minute equivalent.

Status: DONE
Summary: All five review findings are fixed and focused Rust/Node checks pass.
Context refs:
- (none)
