# Landing: HARDEN T2, Git and terminal-control, on the second machine

Activated 2026-10-23 22:09 (Asia/Saigon) in workspace `/home/vantt/projects/forgent` (machine `fg-server2`) by `lead:HARDEN`. This was a self-landing under the owner's standing approval, in a quiet window agreed with WORK (`forgent-cd`), which held all its runs.

## Why now

T2's phase 17 gates passed on the track branch, and WORK's cutover waits for T2 (landing order agreed 11:20: T2 first, then WORK rebases). The closing report is [closing-261023-2228](closing-261023-2228-harden-t2-git-terminal-control.md). The owner machine follows the [guide](guide-261023-2228-harden-t2-owner-machine-landing.md) at a time the owner picks.

## Outcome

Release `sha256:ae20f16fcd7f45e16bfcf74262ebe332b875798bdd11ddac7edcdcdf794d72f5` has been active since 22:09:44 (`.fgos/installation/activation.json`). It was built from main `084da2df7` (858 files). The previous release, `sha256:c91242ea839639eda9ff435c7f1f6db62c91fcacd05c71847e3596f07c4147ff`, stays staged for rollback.

What main carries now:
- **T2.** Merge commit `a01f725bf` ("merge: HARDEN T2, Git and terminal-control hardened"). Its second parent is the track tip `158ba01bc`, which already contains the head-in-listing branch (`fa8f0b885`).
- **Newer main, merged in afterwards.** `4667c2d37` and `084da2df7`. They bring IDENT's machine signing key and CFG's native YAML door.

So this release is also the first one here with IDENT's signing key (row `identity-machine-key` passes) and the YAML door.

## Verification before the merge

- **Final full suite on the merge tree, private Cargo target.**
  - `cargo test --workspace`: exit 0.
  - `npm test`: 8 569 pass, 1 fail.
  - The failure is the integration case of `test/scripts/test-select-mutate.test.mjs`. It is an environment effect: the landing tree was a detached, unpushed merge commit, so the case answers `worktree-delivery-unreachable`. It also leaked a worktree registration, which run-tests' new leak check reported; the registration was pruned.
- **Earlier, from the same case.** It once poisoned the shared Cargo target (TEST F10). TEST fixed it: the checkout now builds into `<target>/mutation-checkout` (`50d6ae857`, on origin/main after this release's source commit, so not in this release).
- **A flake that is a product race.** The lock fence's final probe can report `lock-fence-still-held` for a lock that frees a moment later under load. It is recorded as R9 for HARDEN, not hidden.
- **Independent fresh-clone verify at `db5f19193`.**
  - Release build ok; `cargo test` 1 473 pass, 0 fail.
  - clippy clean, apart from third-party `arraydeque` warnings.
  - macOS compile check passes after `6de51d3e4` (it has never run on a Mac).
  - The one-door census has 5 sites, all CFG's.

## Steps and checks

1. **Build and stage.**
   - Clean detached worktree at `084da2df7`, fresh Cargo target on ext4, then the distribution build.
   - `fgctl` reinstalled from the release worktree, the previous one kept as `fgctl.prev`, then `fgctl stage`.
2. **Quiet window, backups, activation.**
   - Backups went to `.fgos/runtime/tmp/landing-harden-t2-here/`: `distribution.json`, `project-config.json`, `global-config.json` (mode 600), `refspecs.txt`, `instruction-hashes.txt`, `fgctl.prev`, `activation.json`. `doctor-fix.txt` and `doctor.json` were saved there after the upgrade.
   - `fgctl upgrade`, then `distribution.json` restored from the backup.
   - Instruction hashes unchanged: `AGENTS.md`, `CLAUDE.md`, `.claude/settings.json`.
   - `fgctl verify` passed.
3. **Setup and doctor.**
   - `fgos doctor --fix`: exit 0.
   - `fgos setup --json`: `configAddedKeys` and `globalConfigAddedKeys` are both empty, and the refspecs are unchanged.
   - `~/.fgos/config.json` line 482, `terminal.layout.policy`, was changed from `measured-split` to `even-split` by hand. It was the written old standard, not a choice (owner decisions 26 and 27). The repo `.fgos/config.json` took the same change in T2 (`aff7f2d54`). The global file was backed up first.
   - `fgos doctor --json` (22:17): 140 rows, 10 not passed. All ten are known and none is a T2 row except `git-mutation-one-door`, which is CFG's five `unresolved-binary` sites:
     - `executor-skills-installed`, `tool-registry-configured`, `executor-profile-warnings`, `confined-pane-accounts`, `agent-cli-project-trusted` (configuration);
     - `work-step-vocabulary` (item `tsk-5db`);
     - `run-attempts-stuck` (`unit-run-1792482363495-797e4401`);
     - `doc-current-path-missing`, `doc-source-conservation` (docs);
     - `git-mutation-one-door`.
   - The six Git rows and two terminal rows of the new shape are present and pass, except the one above:
     - `git-component-compatible`, `git-repository-config`, `git-operation-journal`, `git-native-locks`, `git-worktree-recovery`, `git-mutation-one-door`;
     - `terminal-control`, `terminal-allocations`.
   - `git-operation-journal` passes with a warning: 385 finished Git operations retained, 2 578 KiB, oldest 4.6 days. That is the signal of this row's new retention line, and the trigger for backlog item `p-djrgdijd2c` (compact finished Worktree and Refs chains off the hot path). It is expected, not a defect of the landing.
   - `active-release-matches-checkout` passes (changed 0, missing 0, extra 0), and so do `process-containment`, `lock-holders` and `identity-machine-key`.
4. **Smoke.**
   - `fgos dispatch decide`: answers `in-process`.
   - `fgos identity mint work`: minted `tsk-cdeeyn667u`.
   - `fgos identity`: source `env`.
   - `fgos worktree create --detach`: 3.1 s. `fgos worktree remove --delivered-to refs/heads/main`: 1.2 s. No prunable registration was left.
   - **Not done: a live herdr check of the new default layout.** Three panes as three columns on a wide terminal would open panes in the owner's session. The owner machine's guide carries this as an optional step.

## Not merged

- **`harden/t2-p08-census-slices`:** the legacy `worktree:{root}` acceptances and the v1 compact-ledger branch. It waits for a clean census on every machine: both the fg-server and the design-lap `TOTAL` lines must read zero, and no workspace may run a release built before `869e789d7`. This machine's own census (phase 8 run, 155 WALs) read zero; the records do not show it re-run at landing. It is its own merge, so it can be reverted alone.
- **Phase 10** (fewer fsyncs on a worktree add) was dropped by the owner (decision 23). Its branch stays as a record.
- **Phases 14 to 16** (A3, A4, A5) were not taken (decision 21).

## Rollback

Stop everything, then:
1. `fgctl upgrade --from ~/.local/state/fgos/releases/sha256:c91242ea839639eda9ff435c7f1f6db62c91fcacd05c71847e3596f07c4147ff`.
2. Restore `.fgos/distribution.json`, `.fgos/config.json` (from `project-config.json`) and `~/.fgos/config.json` (from `global-config.json`) from the backup folder. The `~/.fgos/config.json` restore matters: the previous release registers only `measured-split` and would refuse `even-split`.
3. `cp fgctl.prev ~/.local/bin/fgctl`.

On main, revert merge `a01f725bf` (`-m 1`) only while no lane has built on it; check the board first. After that, fix forward.

The previous release reads every on-disk format T2 leaves. T2 ships no Worktree or Refs compaction (it was tried and reverted), so no ledger receipt is new. Terminal group hint files are no longer written; the old release writes them and never reads them. A stored Event Store pin recorded as `ssh://[redacted]@host/...` asks for one `fgos setup` run.

## Follow-ups

- **R9**, the lock fence's final probe (HARDEN, next).
- **H30**, one `inspectGit` per doctor run, once WORK's `createDoctorRun` is on main. Today the Git rows make four calls (five with a non-origin remote).
- **Backlog `p-djrgdijd2c`** (compaction off the hot path). **`p-txiatvrts4`** (HEAD inside the tip listing) is implemented in this landing; its backlog row still reads `proposed` and needs flipping.
- **CFG decision 27:** config keeps every key, with a versioned standard; values equal to the previous standard move to the new one; git history holds the old values. T2 made only the one manual `terminal.layout.policy` change.
- **T4** H25 (worker session-server start) and **T5** H26, plus the D-T2-7 grace rule as T5's input.
- **TEST** H29, F9, F10, F11. **WORK** es-dedupe at its cutover.
- **IDENT key line for `fg-server2`:** the board asks every machine for one `IDENT key` line. The fingerprint is in the `identity-machine-key` row.
- The fan-out rule "one wave, one tab" is left as a policy question.
