# Phase 2d: Retire the Node shell-rc detector (door row `shell-rc-fgos-lines`)

## Inputs
- Row `packages/component-authority/model/doors/shell-rc-fgos-lines.yaml`. Survivor: `packages/distribution/rust/src/rc_lines.rs` (`detect_rc_files`). Debt: `src/setup/shell-rc.mjs`.
- Only caller: `scripts/fgos-session-start-hook.mjs:13` (`detectRcFiles`), the repository's own SessionStart hook (`.claude/settings.json`). It prints the rc file names as one convenience context line. No verb exposes `detect_rc_files`, and adding one would be a new door (RUL104). The shell profiles a user needs are already named by `fgctl uninstall` and doctor through `rc_lines.rs`.
- Shape choice settled here: the hook drops the `shell profile(s)` line instead of gaining a new verb.

## Files it may write
src/setup/shell-rc.mjs, scripts/fgos-session-start-hook.mjs, test/setup/shell-rc.test.mjs, test/suite-baseline.json, packages/git/contracts/mutation-census.v1.json, packages/component-authority/model/doors/shell-rc-fgos-lines.yaml

## Rules every retirement step follows
- No twin (CA-D2, discussion §3 row 3d): every caller moves to the survivor and the copy is deleted in the same commit. The commit message names the survivor, the deleted path and the last SHA that still had it. The owning area spec's "Lịch sử quyết định" line goes in the phase report for phase 11 to place.
- Before deleting, find the test that owns the behaviour the copy gave its callers. If none does, record vectors from the copy and replay them on the survivor, in the survivor's own test file (design principle 8; the 488d3ab28 pattern).
- A caller outside this phase's files: stop, write Status BLOCKED with the file named, and change nothing. Do not widen.
- Re-read the door row first. A running plan may already have removed some debt; a row with no `debt` left needs only the check below.

## Execution
Every writing unit runs with `--provider claude` (owner order, D6 step 0). If claude is unavailable the unit parks and reports. It never falls back to another provider.

## Steps
1. Remove the import and the profile line from the hook; it still never throws and always exits 0.
2. Move any `test/setup/shell-rc.test.mjs` case that `rc_lines.rs`'s tests do not cover into those tests, then delete the Node file and its test.
3. Remove the debt entry, regenerate the census, drop the retired test from `test/suite-baseline.json`.

## Verify
`node --test test/architecture.test.mjs test/setup/git-mutation-census.test.mjs` green, no `debt` in the row; `node scripts/fgos-session-start-hook.mjs` prints the paths and exits 0; `cargo test -p fgos-distribution` green.

## Rollback
Revert the phase commit.
