# Phase 2d result: Node shell-rc detector retired

## Changes
- `scripts/fgos-session-start-hook.mjs`: dropped the `node:os` and `detectRcFiles` imports and the `shell profile(s)` line. The hook still has its try/catch and `process.exit(0)`.
- Deleted `src/setup/shell-rc.mjs`. Last SHA that had it: `12f8a187a5b462bdbd7bcaeb609eccba2acbdba9` (the last commit touching it; HEAD `20ad16de0` still has the file).
- Deleted `test/setup/shell-rc.test.mjs`.
- Door row `shell-rc-fgos-lines.yaml`: `debt` removed.
- `packages/git/contracts/mutation-census.v1.json`: removed the `src/setup/shell-rc.mjs` hash line by hand.
- `test/suite-baseline.json`: removed the `test/setup/shell-rc.test.mjs` entry.
- Survivor: `packages/distribution/rust/src/rc_lines.rs` (`detect_rc_files`).

## Owning tests of the retired behaviour (design principle 8)
Existing Rust tests in `rc_lines.rs` already cover every Node case, so nothing needed moving:
- `only_rc_files_that_exist_are_detected_bash_before_zsh`: only existing files are returned, bash before zsh, empty when none exist. It replaces three Node cases.
- `windows_detects_both_powershell_profiles_and_never_bash_files`: replaces the three win32 cases.
- The Node "defaults to process.platform" case has no Rust counterpart because `detect_rc_files` takes the platform explicitly. The behaviour was removed.

## Not run (cargo and node were refused)
The lead should run these:
- `node --test test/architecture.test.mjs test/setup/git-mutation-census.test.mjs`
- `node scripts/fgos-session-start-hook.mjs` (expect no shell-profile line, exit 0)
- `cargo test -p fgos-distribution`
- Regenerate the census if the test shows a drift beyond the one removed line. I edited it by hand because no generator could be run.
- `git add` of the two deletions: I removed the files with `rm` (`git rm` was refused), so stage the deletions.

## Spec decision-history line for phase 11
The shell-rc detector moved to Rust only (`rc_lines.rs`). The Node copy `src/setup/shell-rc.mjs` was deleted (last SHA 12f8a187a). The repository SessionStart hook no longer prints a shell-profile line, and no new verb was added. `fgctl uninstall` and doctor already name the profiles.

Status: DONE_WITH_CONCERNS
Summary: refactor(setup): retire the Node shell-rc detector in favour of rc_lines.rs
Concerns: the Verify commands were not run (node and cargo refused), and the census was edited by hand.
