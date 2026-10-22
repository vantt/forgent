# Landing: SEAT and GIT's fence row on the second machine

Landed 2026-10-22 08:57 (Asia/Saigon) in workspace `/home/vantt/projects/forgent` by HARDEN big lead `forgent-a8`. This was a self-landing under the owner's standing approval. GIT/ES and TEST confirmed that nothing of theirs was running.

## Why now

SEAT merged to main at 02:48. That merge also put the repository's `.fgos/config.json` in SEAT's format (`tier` keys on capabilities). The release running here, `79d2eed3…` built from `e679a2d4e`, predates SEAT, so every verb that validates the runner config refused with `unknown key "tier"`, among them `fgos dispatch decide`.

At 08:51 the old release's config merge (`fgos setup`) also added `runner.rigorToTier` back to the project config. The new release's setup removed it again (step 3).

## Outcome

Release `sha256:d241ec95d06e4a01056a14f5be3fefaf1a994a07d19d68c788f4e3e618ef4c22` has been active since 08:57:13. It was built from main `ef273d860` (827 files). The previous release, `sha256:79d2eed3…`, stays for rollback.

What it adds over `79d2eed3…`:
- SEAT, phases −01 to 11, including the one-door census fix `a4db2b947`/`f315b99c7`;
- GIT's `git-fence-missing` condition on `git-operation-journal` (`96dd8fb29`), and the three Land WAL doors that now require the fence (`e23e34688`);
- documentation commits.

## Steps and checks

1. **Build and stage.** Clean detached worktree `forgent-worktrees/land-seat-here` at `ef273d860`, Cargo target on ext4, `cargo build --locked --release --workspace`, then the distribution build. `fgctl` was reinstalled, with the previous one kept as `fgctl.prev`, and then `fgctl stage`.
2. **Quiet window and activation.**
   - Nothing fgOS was running, and no file under `.fgos` or the state root was open.
   - Backups went to `.fgos/runtime/tmp/landing-harden-seat-here/`: `distribution.json`, both configs (global with mode 600), refspecs and instruction hashes.
   - `fgctl upgrade` ran from 08:54:28 to 08:57:13.
   - `distribution.json` was restored, and the instruction hashes are unchanged.
   - `fgctl verify` passed.
3. **Setup and doctor.**
   - `fgos doctor --fix`: exit 0.
   - `fgos setup`: no keys added, and the refspecs are unchanged.
   - The seat-binding conversion reported `converted`: it deleted `runner.rigorToTier`, and its backup is `.fgos/config.json.pre-seat-binding-20261022T015850445Z`. The project config now equals main's.
   - The global `~/.fgos/config.json` was left as it is: the new release ignores its `rigorToTier` with a stderr note, because older releases on this machine still read it.
   - `fgos doctor`: 144 checks, 10 not passed. All 10 were already failing at the previous landing; `model-policy-tier-coverage` now passes. The 10 are:
     - configuration rows;
     - the old stuck attempt `unit-run-1792482363495-797e4401`;
     - item `tsk-5db` at a retired step;
     - docs rows;
     - `active-release-matches-checkout`, which fails because of local edits.
   - `git-operation-journal` passes with the fence present, and so do `git-mutation-one-door` (964 files) and `process-containment` (bwrap-pidns). The four `seat-binding-*` rows pass, as does every other `git-*`, `lock-*` and `terminal-*` row.
   - `lock-fences` passes with a warning: 54 of 425 legacy lock paths are not fenced, all of them `workflow-runs/*` advance locks. This matters for HARDEN T1, which deletes this row; see the T1 sub-plan.
4. **Smoke.**
   - `fgos dispatch decide`: answers again.
   - Gateway `start`, `status` and `stop`: reachable.
   - `lock fence gateway --yes`: free, nothing signalled.
   - A read-only `fgos run` on gemini: completed.
   - A writing `fgos run` on claude at rigor low, in a scratch worktree on `smoke/harden-seat-here`: committed `6a6a9b4fc` through ScopedCommit. The worktree was removed with `fgos worktree remove --delivered-to` and the branch deleted.

## Rollback

Stop everything, then:
1. `fgctl upgrade --from ~/.local/state/fgos/releases/sha256:79d2eed3828fbebd6c9f54f95558a5d5a2df7e658be2e818d9eb6d4333375f56`.
2. Restore `.fgos/distribution.json` from the backup, and `.fgos/config.json` from `project-config.json` in the backup folder: the old release refuses the converted config.
3. `cp fgctl.prev ~/.local/bin/fgctl`.

## Owner machine

The owner machine already runs SEAT (`a2b19d78…`, from `f315b99c7`). GIT's guide for the fence row builds from current main, which now carries SEAT as well; GIT adds that line.
