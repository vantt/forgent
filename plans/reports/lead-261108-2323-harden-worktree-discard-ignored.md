# Lead report: `fgos worktree remove --discard-ignored`

Owner decision B after the 2026-11-08 13:50 main-checkout wipe. The lead hand-rolled an ignored-file cleanup after a failed `cd`, so it ran in the main checkout. It happened because `fgos worktree remove` refused `worktree-ignored-bytes-preserved` and offered no safe way past that refusal.

## What landed

- The Git Worktree port (`packages/git/rust/src/worktree.rs`) now takes a typed choice, `IgnoredBytes::Preserve | Discard`. The return type is `DiscardedIgnored {files, bytes}`. Both are re-exported from `lib.rs`. Preserve is the default, so the refusal keeps its original intent from `8a8362712`: no ignored byte is lost silently. Land cleanup passes Preserve.
- Discard runs under the same worktree-admin hold, after identity, live cwd, custody, worker state, dirty tracked and untracked state, submodules, native state, delivery proof and reachability all pass. It then re-checks identity and lists the ignored paths. Each path must be reached through real directories (`worktree-ignored-path-refused`), and a nested repository refuses with `worktree-ignored-repository-preserved`. Every path is counted with lstat before anything is deleted. A symlink is removed as itself and never followed. Finally the checkout is judged again in full, before the WAL TargetAttempt.
- Addon `discardIgnored` (boolean only). Verb `src/verbs/worktree/remove.mjs`: the delivery statement `{path, expectedTip, deliveredTo, discardIgnored}` is hashed into the WAL evidence digest. CLI `--discard-ignored`, registry entry, `data.discardedIgnored` in the output.
- Guidance: `core/skills/_shared/private-cell-worktree.md` and `domains/coding/skills/_shared/coding-cell-policy.md` (rendered surfaces rebuilt) point at the flag and forbid hand cleanup. AGENTS.md already names the flag (`c66b5ed1b`).
- Git spec: Worktree port row, verb paragraph, dated decision entry with the accepted residual. CHANGELOG line.

## Proof

- Rust `packages/git/rust/tests/worktree.rs`, 5 new tests: discard plus report (nested untracked-only-ignored dir included; Preserve still refuses); main checkout, a dir inside main, a plain dir and a foreign repo all refused with bytes kept; tracked and untracked dirt refused; ignored symlinks to outside removed as themselves with the outside bytes kept; nested repository refused with nothing deleted.
- Node wiring: two existing tests in `test/verbs/worktree-remove.test.mjs` were extended (use case plus evidence digest; CLI flag plus output). No new Node test file.
- Gates: `cargo test -p fgos-git` green, fmt, clippy `-D warnings` (fgos-git, fgos-node-addon), msvc and aarch64-apple-darwin check, one-door scan 0 undeclared with the census regenerated, focused Node green (architecture, doc-health, worktree suites).
- Full `npm test` on `02f0ff749`: 8605 pass, 3 fail, no ERROR lines. The 3 failures are the known V7n addendum, plus the skills drift guard and the citation-drift CLI. The last two are also red on the untouched baseline inside any provisioned worktree, because of the ignored `ak-*` skill copies. The review fix (`a44bff8a8`) was re-proven with the focused set only.
- OPC review: CHANGES at 23:14 (bind the choice into the evidence; refuse nested repositories), MERGE at 23:39 on `a44bff8a8`.

## Residuals

- A writer outside the worktree that swaps a checked ancestor directory for a symlink between the check and the delete is not excluded. This is stated in the spec.
- The WAL remove record has no slot for the counts, which are reported to the caller only.
- The drift guard and citation-drift CLI read ignored `ak-*` copies in provisioned worktrees, so they are red there on any branch. They are worth a separate item.
