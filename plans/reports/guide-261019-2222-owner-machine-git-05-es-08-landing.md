# Owner machine: landing Git 05 + ES 08 (stop-everything)

Written 2026-10-19 22:22 (Asia/Saigon) for the owner machine. It has three workspaces: mdview, mcp-skill-hub and forgentX. Its active release is `sha256:14439416…` (main `9a2d111b5`, Git 04; [landing](landing-261019-1841-git-04-stop-everything-owner-machine.md)). Run this guide at the time the owner sets.

The second machine landed the same content at 22:12 and kept it: release `sha256:42baabb673800bcb44a772ada5465ced39ec23d8ae2ef9b3d3d35b9344e01446` from main `8a8f7a80b` ([landing report](landing-261019-2222-latest-main-git-05-es-08-this-machine.md)). Build from the current origin/main, which is `8a8f7a80b` or later.

## What arrives

- **Git 05:** ScopedCommit, Checkpoint main, Sync and the cutover grant. All are dormant: nothing calls them until ES phase 09 and Git phase 07. **Activation now refuses a release whose native addon does not declare `git-wal-v1`** for this target (step 6).
- **ES 08:** migrate legacy, parity and rollback. Dormant: the verb is not wired into the CLI. Do **not** run any migration.
- **B1–B7 fixes:**
  - B1: an unreadable `result-N.json` ends the round as `terminal:result-unreadable` instead of waiting for idle.
  - B2: the decision index keeps committed rows.
  - B3: the cwd warning is printed once per pid.
  - B4: a clean worktree with a tracked `.fgos` can be removed.
  - B6: the gate sets parent-death, and `/proc/locks` is read to EOF.
  - B7: the payload walker skips git-ignored files, so the release digest changed once.
- **Test fixes** (no effect on the release): temp-root signal exit, the /tmp leak guard, the git identity guard, fence host isolation.

Still stop-everything: the custody lease semantics of Git 04 are unchanged, and no old-release controller may run beside a new one.

## Steps (in each of mdview, mcp-skill-hub, forgentX unless noted)

0. **Clean /tmp** while no suite is running: `find /tmp -maxdepth 1 -name 'fgos-*' -mmin +120 -exec rm -rf {} +`.
1. **Git identity:** `git -C ~/projects/forgentX config --show-origin --get-all user.email` must show only `file:/home/<user>/.gitconfig`. If `file:.git/config` appears, run `git config --local --unset-all user.email` and `git config --local --unset-all user.name`. For a linked worktree with `extensions.worktreeConfig`, also run `--worktree --unset-all`. Confirm with `git var GIT_COMMITTER_IDENT`. Do the same check in mdview and mcp-skill-hub.
2. **Stop everything.** The commands are the same as step 1 of the [Git 04 guide](guide-261019-1539-owner-machine-git-04-stop-everything-landing.md).
   - `ps -eo pid,args | grep -E '(^| |/)(fgos|fgctl)( |$)|bin/fgos\.mjs|fgos-gateway|internal (supervise|gate)'` must list nothing.
   - Close every fgOS agent pane: `herdr pane list`, then `herdr pane close <id>` for each pane with a cwd under `.fgos/assignments/…`.
   - No process may hold a file under any `.fgos/` or under `~/.local/state/fgos`.
3. **Old-release sweep:** run `fgos doctor --fix </dev/null`. `run-attempts-stuck` must adopt 0 and `lock-holders` must show 0 held. The old release still drops rows from `docs/decisions/index.md`; restore it with `git checkout -- docs/decisions/index.md`.
4. **Predecessor records:** `ls .fgos/locks/dispatch-cwd*.predecessor.json` in each workspace and in each of its worktrees. Any record found must belong to a settled run. Do not delete records by hand (holder-lock spec §19).
5. **Back up** per workspace:
   - `.fgos/distribution.json`;
   - `git config --get-all remote.origin.fetch`;
   - the hashes of `.fgos/config.json`, `AGENTS.md`, `CLAUDE.md` and `.claude/settings.json`.

   Also back up `~/.fgos/config.json` (mode 600), and `fgctl` as `fgctl.prev`.
6. **Build once from origin/main**, with a clean detached worktree and its **own fresh** `CARGO_TARGET_DIR`:
   - `cargo build --locked --release --workspace`;
   - `node scripts/build-rust-distribution.mjs --repo-root <wt> --out <empty dir>`;
   - `cargo install --locked --path <wt>/apps/fgctl --root ~/.local`.

   **The git-wal-v1 check comes before activation:**

   ```
   node -e 'const m=require("<tree>/manifest.json").components.nativeAddon; console.log(m.target, m.napiVersion, m.capabilities)'
   ```

   It must print `linux-x64 8 [ 'git-wal-v1' ]`. If not, stop: the tree was built from an old cache or an old main.
7. **Activate** in mdview, then mcp-skill-hub, then forgentX:
   - `fgctl stage --from <tree>` and `fgctl upgrade --from <tree>`;
   - restore `.fgos/distribution.json`;
   - check the hashes from step 5;
   - `fgctl verify`.
8. **Fences:** `fgos doctor --fix </dev/null` after the stop check, or `fixLockFences` from the new payload. The second machine used `land-2210/fence.mjs`, which excludes idle sessions by cwd. `lock-fences` must pass.
9. **Setup:** `fgos setup </dev/null` must exit 0 with no config keys added. `docs/decisions/index.md` should now stay untouched (B2); if it changed, restore it and note it.
10. **Verify git:** the fetch refspecs are identical to the backup, `git fetch origin` exits 0, and `git pull --ff-only` works in forgentX.
11. **Doctor through the shim** in each workspace. These rows must pass:
    - Git: `git-component-compatible`, `git-transport-config`, `git-worktree-recovery`, `git-trust-topology`, `git-operation-journal` (0 pending), `git-native-locks`, `git-publication-refspecs`, `git-durability-capability`.
    - Run and lock: `run-attempts-stuck`, `legacy-attempts-stuck`, `cancel-wait`, `lock-*`, `state-root`, `events-jsonl-not-truncated`.
    - Expected to pass now: `decision-index-stale` (B2) and forgentX `active-release-matches-checkout`, once it has pulled to the release commit.

    Every other failing row should be the same owner-config set as at 18:41. `git-worktree-recovery` may still fail in forgentX on Claude Code's own `locked claude agent … pid` worktree locks; that is known and the row's owner is lane GIT.
12. **Smokes** in forgentX. The recipe is the same as [the 18:41 landing](landing-261019-1841-git-04-stop-everything-owner-machine.md), step 12:
    - a. A read-only claude run through herdr, outcome `pass`.
    - b. Create a throwaway worktree with `fgos worktree create .claude/worktrees/smoke-git05 --branch smoke/git05-lease --base origin/main`. Watch the lease with a lease monitor on `dispatch-cwd--<dev>-<ino>-*.lock`. Run a writing `fgos run … --writes <file> --worktree <wt>` and ask for a one-line summary. Expected: the kernel lock is held, then the `linux-gate` record appears before the agent works, then the tip moves, then the record and the kernel entry go. `commit.status` is `committed`.
    - c. A second writing run in the same worktree is admitted and commits.
    - d. Ctrl-C and resume. Spawn the shim with SIGINT at default (Python `preexec_fn`), because a background `&` ignores SIGINT. Expect exit 130 and `chờ resume`; `fgos run --resume <unit>` then gives `runs/02` with outcome pass and `supersedesRunId` = attempt 01. Close the retained pane.
    - e. One codex read-only run through herdr.
    - **Dormancy check:** `ls "$(git rev-parse --git-common-dir)/fgos/git/operations/"` must show only worktree operations (and the older publication ones), with nothing for scoped commit, sync or checkpoint. `fgos events` is still an unknown verb. `fgos list` and `fgos show <id>` work.
    - Cleanup: remove the smoke worktree through the Worktree port. A direct `node` script must run with `FGOS_HOST_BIN=<release>/bin/fgos` (`land-2210/wt-remove.mjs`); without it the addon loader refuses with `git-addon-not-shipped`. Then delete the smoke branch, and remove the build worktree with non-force `git worktree remove`.
13. Write the landing report and the board line.

## Rollback

1. Stop everything (step 2).
2. Run `fgctl upgrade --from ~/.local/state/fgos/releases/sha256:14439416…` in each workspace (in the reverse order is fine).
3. Restore `.fgos/distribution.json`, run `git checkout -- .fgos/config.json` if needed, and restore `~/.fgos/config.json`.
4. Check the hashes, run `fgctl verify` and `git fetch origin`.

Restore `fgctl` from `fgctl.prev` only if `fgctl` itself is the problem.

Nothing dormant ran, so there is no ScopedCommit, Sync or migration state to undo. The Git WAL and the `dispatch-cwd` records stay, and the older release reads them.
