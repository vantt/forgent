# Landing: terminal-control zombie foreground fix, second machine

Landed 2026-10-22 01:32 (Asia/Saigon) in workspace `/home/vantt/projects/forgent` by HARDEN big lead `forgent-a8`, as a self-landing under the owner's standing approval. GIT had finished its E3 push measurement and released the host; TEST was told before the window.

## Outcome

Release `sha256:79d2eed3828fbebd6c9f54f95558a5d5a2df7e658be2e818d9eb6d4333375f56` is active since 01:32:59. It was built from main `e679a2d4e` (816 files). The previous release, `sha256:9e4c2630…` (GIT durability fixes with HARDEN T0, [landing](landing-261022-0011-git-durability-and-t0-this-machine.md)), stays in the release store for rollback.

What it adds over `9e4c2630…`:
- **The fix, `359274c62`.** A run is no longer stopped with `terminal:foreground-not-agent` while its agent is working.
  - herdr lists a zombie in the pane's foreground group without `argv`.
  - Before the fix, `parse_process_info` (`packages/terminal-control/rust/src/driver/herdr.rs`) treated the whole answer as unreadable when it met one such entry. The send check added in `065cc620a` then refused to type the brief.
  - Zombies are now left out of the foreground. They hold nothing, so the fail-closed checks miss no live process.
  - It was reproduced with real herdr (`sh -c 'sleep 0 & exec sleep 300'`). That answer is kept as the fixture `pane-process-info-zombie.json`. The owning test `process_info_separates_shell_from_foreground` is red without the fix and green with it.
- Other commits on main between `9670da5ff` and `e679a2d4e`, which GIT's landing had not carried: the T0 store-leak fix `986680477` (dev launcher only) and documentation.

## Steps and checks

1. **Build and stage.**
   - Clean detached worktree `forgent-worktrees/land-tc-zombie` at `e679a2d4e`, with a private Cargo target on ext4.
   - `cargo build --locked --release --workspace`, then the distribution build.
   - `fgctl` reinstalled; the previous binary is kept as `fgctl.prev`.
   - `fgctl stage`.
2. **Quiet window.**
   - No fgOS process was running and no file under `.fgos` or `~/.local/state/fgos` was open.
   - Two processes from a test fixture under `/tmp/fgos-test-run-Tc67io` have been alive for 55 hours: a `git` and a `pre-commit` hook. They are not fgOS runs and HARDEN did not start them, so they were left alone.
3. **Activation.**
   - Backup to `.fgos/runtime/tmp/landing-harden-tc-zombie/`.
   - `fgctl upgrade` ran from 01:31:15 to 01:32:59.
   - `.fgos/distribution.json` was restored.
   - The hashes of `AGENTS.md`, `CLAUDE.md`, `.claude/settings.json` and both configs are unchanged.
   - `fgctl verify` passed.
4. **Setup and doctor.**
   - `fgos doctor --fix`: exit 0.
   - `fgos setup`: no keys added, and the fetch refspecs are unchanged.
   - `fgos doctor`: 145 checks, 11 not passed. That is the same set as GIT's landing: configuration rows, the old stuck attempt `unit-run-1792482363495-797e4401`, item `tsk-5db` at a retired step, docs rows, and `active-release-matches-checkout` (the main checkout has local edits).
   - Every `git-*`, `lock-*` and `terminal-*` row passes, and so do `process-containment`, `run-supervisor-route` and `state-root`.
5. **Smoke.**
   - Gateway `start`, `status` and `stop`: reachable.
   - `lock fence gateway --yes`: free, nothing signalled.
   - Two read-only `fgos run` attempts with `--provider gemini`, the executor that failed GIT's smoke: both `completed`, exit 0, answer `OK`.

## Rollback

Stop everything, then:
1. `fgctl upgrade --from ~/.local/state/fgos/releases/sha256:9e4c2630f82082ec7baa0e3e5c5060dae82fd3b871c13bbddbc506ab253fd351`.
2. Restore `.fgos/distribution.json` from the backup.
3. Copy `fgctl.prev` back to `~/.local/bin/fgctl`.

The fix is one parser change, so reverting `359274c62` on main is a clean option too.

## Owner machine

GIT's [owner-machine guide](guide-261022-0011-owner-machine-git-durability-and-t0.md) builds from main `9670da5ff` or newer, so this fix comes along when built from current main. GIT adds a line naming it.
