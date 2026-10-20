# Review: Git typed-operation spawn reduction (e44e1d5bd..fdb4fdf59)

**Verdict: not merge-ready yet — one High regression, small fix.** All other safety properties the earlier reviews required are intact. Once the High finding is fixed with a regression test, the change is mergeable. The Medium item is a CI risk you can fix in the same pass.

Scope read: the full diff (11 files), the lead report, Git spec §8 addition, and the surrounding code in `scoped_commit.rs`, `land.rs`, `refs.rs` and `driver.rs` (invoke argv, config cache, `config()`, `validated_config`, `checkout_repository`). I changed nothing in the workspace. I ran `node --test test/git/e3-census.test.mjs` (2 pass, 0 fail) and a scratch Git experiment outside the repo (below). I did not rerun the Rust suites, because building writes to the target directory.

## High

**H1. The new commit-header read breaks under `log.showSignature=true` with signed commits.** `packages/git/rust/src/scoped_commit.rs:1154` replaces `rev-parse HEAD`, `rev-parse HEAD^{tree}` and `rev-list --parents` with `git show -s --format=%H%x00%T%x00%P%x00 HEAD`. Unlike `rev-parse` and `rev-list`, `git show` honours `log.showSignature`. The driver does not neutralise that setting: the invoke argv at `driver.rs:862-876` pins fsmonitor, gc, maintenance, rerere and autoStash but not this, and `command_config` does not refuse it. Signing itself is allowed: `commit.gpgSign` is accepted, and `gpg.format=ssh` uses the default `ssh-keygen`.

Reproduced in a scratch repository with an ssh-signed commit. `git -c log.showSignature=true show -s --format='%H%x00%T%x00%P%x00' HEAD` puts `Good "git" signature for … \n` on stdout before the OID. Under the same config, `rev-list --parents -n1 HEAD` and `rev-parse HEAD HEAD^{tree} HEAD^@` stay clean.

Failure: the user has `commit.gpgSign=true` and `log.showSignature=true` (a common pairing) in any config scope. The commit succeeds and HEAD moves. `observed` then holds the signature text plus the OID, so `observed == baseline.head` is false. The following `diff … baseline.head observed` fails with `checkout-command-failed`, so ScopedCommit returns an error for a commit that really landed. The WAL is left at TargetAttempt with no Outcome, and HEAD has moved, so no unstage happens. The operation now needs recovery. Recovery's own reflog walk at `scoped_commit.rs:399-410` (`log -g --format=…`) has the same latent defect (pre-existing, see L2), so recovery may also fail to match the candidate. Before this change the commit path was immune.

Fix (pick one, preferably both):
- Add `-c log.showSignature=false` to the base argv in `driver.rs:862-876`. This hardens every `show`/`log` call, including the pre-existing ones.
- Or read the header with `rev-parse HEAD HEAD^{tree} HEAD^@`. That is still one spawn and is newline-delimited. A root commit gives no parent lines, so it is still rejected.

Add a regression test: an ssh-signed commit with `log.showSignature=true` must commit cleanly.

## Medium

**M1. The ScopedCommit census test now silently depends on `strace`.** `test/git/scoped-commit.test.mjs:235` skips only off Linux. `scripts/git/e3-bench.mjs` `scopedCensus` now runs `strace -f`, where it used to use a PATH wrapper. `.github/workflows/ci.yml:40` installs `bubblewrap zsh` but not `strace`. Any Linux CI image or container without strace, or with ptrace denied by seccomp, fails `npm test`, and the failure looks like a regression.

Fix: install `strace` in ci.yml and register the dependency. Alternatively, keep a cheap Git-only exec count for this assertion (the old wrapper approach still works for Git execs) and use strace only for the lock census. Do not add a skip that hides the check.

## Low

- **L1. The fact-reuse identity check is narrower than the existing door's.** `refs.rs:455` reuses facts when `r.git_dir == repo.git_dir`. `checkout_repository` (`driver.rs:741-744`) treats a handle as the same checkout only if `git_dir`, `common_dir` and `work_tree` all match. Config and format depend only on `git_dir` and `common_dir`, so this is not unsafe today: a hand-made second checkout pointing at the same gitdir would still get the correct config. Comparing all three would keep a single definition of "same checkout". The reused cache is still stamp-revalidated on every `config()` call. An invalidated `Some(None)` cache clones to `None`, and `config()` then refuses with `checkout-facts-invalidated`, so it fails closed.
- **L2 (pre-existing, outside the diff, same root cause as H1).** The recovery reflog walk at `scoped_commit.rs:407` (`log -g --format=%H%x00…`) and Land's candidate-parent check at `land.rs:1274` (`show -s --format=%P`) are also exposed to `log.showSignature`. The global `-c` fix for H1 covers both.
- **L3. One spawn left on the table.** In the cutover branch, `scoped_commit.rs:968` still calls `self.dirty_paths(...)` again instead of using `dirty_paths`. This is correct but not reused. It is optional.

## Properties checked and intact

- **Dirty-path reuse is safe.** Between the first read (`scoped_commit.rs:939`) and the snapshot (`:1025`), the code runs only read-only Git/fs calls under custody. Hook-created dirt is still handled: the failure path re-reads `dirty_paths` and the untracked/ignored inventory fresh after `reset` (around `:1225`). The post-commit `diff`, the tree comparison and `sync_refs` still verify what was actually committed after hooks. In the old code the two reads were adjacent anyway, so no window closes or opens.
- **NUL parsing is correct, apart from H1's config-induced prefix.** `%H`, `%T` and `%P` cannot contain NUL or newline. `checkout_text` trims trailing `\n`, and `split_terminator('\0')` yields exactly three fields. The commit message is not in the format, so odd messages and paths do not matter. A root commit gives `P==""`, which differs from `[baseline.head]`, so it is a violation and still rejected. Two parents are also a violation. Header failure is classed as recovery and happens after the durable TargetAttempt.
- **The Land index digests are equivalent.** The old code read `ls-files --stage` for repo twice, under the same scope with no mutation in between, then built the next index from the first read and the old digest from the second. One read for both is the same evidence. `write-tree` before it does not change stage entries. The exact-old index digest, path fingerprints, `old_index_tree` and next digest are unchanged in meaning.
- **The format batch is sound.** `rev-parse --show-object-format --show-ref-format` emits the two values in argument order. The parser refuses missing or extra lines and unknown values. It has the same Git floor as before.
- **Per-child checks still run.** Foreign checkouts in enumeration still use `resolve_repo`, with their own config and formats. Post-hook `refresh_checkout_facts`, WAL barriers, pins, the clean gate, CAS observations and the holder-lock code are untouched by the diff.
- **The census contains no production branch.** The changes are confined to `scripts/git/e3-bench.mjs`, its new parser test and the scoped-commit test. The observer defaults to no-ops, and the `process.argv[1] === SELF` guard only makes the script importable. The `land_crash_matrix.rs` fixture change (a forced mtime plus explicit `update-index --refresh`) makes the test deterministic without weakening it: it still asserts that the index bytes changed and that recovery tolerates a stat refresh.

## Unresolved questions

- None blocking. Whether the GitHub `ubuntu-latest` image already ships `strace` should be confirmed in CI. Either way, declaring it explicitly is the right fix.
