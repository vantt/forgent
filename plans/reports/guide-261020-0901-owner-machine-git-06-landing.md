# Owner machine: landing Git 05 + ES 08 + Git 06 (stop-everything)

Written 2026-10-20 09:01 (Asia/Saigon) for the owner machine. It has three workspaces: mdview, mcp-skill-hub and forgentX. Its active release is still `sha256:14439416…` (main `9a2d111b5`, Git 04; [landing](landing-261019-1841-git-04-stop-everything-owner-machine.md)). Run this guide at the time the owner sets.

The owner machine skipped the Git 05 + ES 08 landing, so this one landing brings everything since Git 04. The [Git 05 + ES 08 guide](guide-261019-2222-owner-machine-git-05-es-08-landing.md) lists what that part brings; this guide replaces its steps.

The second machine landed the same main at 08:54 and kept it: release `sha256:c423c48c27775089695da010c7a7ca4c540cc949c1d0fd5d80c3b26d6bf5c536` from main `585044f19` ([landing report](landing-261020-0901-latest-main-git-06-this-machine.md)). Build from the current origin/main, which is `585044f19` or later.

## What arrives

- **Git 05 + ES 08** (dormant), B1–B7 fixes. Activation refuses a release whose native addon does not declare `git-wal-v1` (step 6). Details are in the [Git 05 + ES 08 guide](guide-261019-2222-owner-machine-git-05-es-08-landing.md). Do **not** run any ES migration.
- **Git 06:** Land, SafeRestore, native index-lock inspection, cooperative SIGTERM termination of borrowed Git children (3 s grace on deadline), RepositoryConfig owning hooks, the Recovery door and the GitHub adapter result contract. All of it is dormant except one live change: `mergeGitHubPR` (`src/runner/github-adapter.mjs`) queries the PR state after a timeout, and reports `merged` or `outcome-unknown` instead of `unreachable`.
- **Typed-operation spawn reduction** for ScopedCommit and Land (dormant until Git phase 07).
- **`git-worktree-recovery` fix:** Claude Code's `locked … pid <N>` worktree locks whose process is alive become advisory (`locked-by-live-process`). The three `agent-*` locks in forgentX should stop failing this row.
- **The owner machine's own work, now activated:** AGENT-WF phases 03–09 and MP-B1 phases 00–05. MP-B1 refuses a missing tier cell with `tier-cell-missing`, so any config that still depends on `executor.model` or `default` stops working. Phase 00 found none on this machine; step 11 and the smokes confirm it. MP-B1 phase 06 (the config diff for the owner) comes after this landing.

Still stop-everything: no old-release controller may run beside a new one.

## Steps (in each of mdview, mcp-skill-hub, forgentX unless noted)

0. **Clean /tmp** while no suite is running: `find /tmp -maxdepth 1 -name 'fgos-*' -mmin +120 -exec rm -rf {} +`.
1. **Git identity:** `git -C ~/projects/forgentX config --show-origin --get-all user.email` must show only `file:/home/<user>/.gitconfig`. If `file:.git/config` appears, run `git config --local --unset-all user.email` and `git config --local --unset-all user.name`. For a linked worktree with `extensions.worktreeConfig`, also run `--worktree --unset-all`. Confirm with `git var GIT_COMMITTER_IDENT`. Do the same check in mdview and mcp-skill-hub. `git --version` must be 2.53 or later.
2. **Stop everything.**
   - `ps -eo pid,args | grep -E '(^| |/)(fgos|fgctl)( |$)|bin/fgos\.mjs|fgos-gateway|internal (supervise|gate)'` must list nothing.
   - Close every fgOS agent pane: `herdr pane list`, then `herdr pane close <id>` for each pane with a cwd under `.fgos/assignments/…`.
   - No process may hold a file under any `.fgos/` or under `~/.local/state/fgos`. The second machine's `land-0900/stopcheck.sh` checks both.
   - MP-B1 asks that no fallback attempt of a writing unit started on the old release is still in flight. With no controller running, there is none.
3. **Old-release sweep:** run `fgos doctor --fix </dev/null`. `run-attempts-stuck` must adopt 0 and `lock-holders` must show 0 held. The Git 04 release still drops rows from `docs/decisions/index.md` (B2 arrives with this landing); restore it with `git checkout -- docs/decisions/index.md`.
4. **Predecessor records:** `ls .fgos/locks/dispatch-cwd*.predecessor.json` in each workspace and in each of its worktrees. Any record found must belong to a settled run. Do not delete records by hand (holder-lock spec §19).
5. **Back up** per workspace:
   - `.fgos/distribution.json`;
   - `git config --get-all remote.origin.fetch`;
   - the hashes of `.fgos/config.json`, `AGENTS.md`, `CLAUDE.md` and `.claude/settings.json`.

   Also back up `~/.fgos/config.json` (mode 600), and `fgctl` as `fgctl.prev`.
6. **Compile once from origin/main**, with a clean detached worktree and its **own fresh** `CARGO_TARGET_DIR`:
   - `cargo build --locked --release --workspace`;
   - `node scripts/build-rust-distribution.mjs --repo-root <wt> --out <empty dir>`;
   - `cargo install --locked --path <wt>/apps/fgctl --root ~/.local`.

   **The git-wal-v1 check comes before activation:**

   ```
   node -e 'const m=require("<tree>/manifest.json").components.nativeAddon; console.log(m.target, m.napiVersion, m.capabilities)'
   ```

   It must print `linux-x64 8 [ 'git-wal-v1' ]`. If not, stop: the tree came from an old cache or an old main.
7. **Deadline test, once, on the same worktree and Cargo dir:** `cargo test -p fgos-git --test borrow_deadline -- --ignored`. It must report `real_read_tree_deadline_as_namespace_init_cleans_its_native_lock ... ok`. The test needs bwrap and user namespaces. If it fails, stop and report to lane GIT before activating.
8. **Activate** in mdview, then mcp-skill-hub, then forgentX:
   - `fgctl stage --from <tree>` and `fgctl upgrade --from <tree>`;
   - restore `.fgos/distribution.json`;
   - check the hashes from step 5;
   - `fgctl verify`.
9. **Fences:** `fgos doctor --fix </dev/null` after the stop check, or `fixLockFences` from the new payload (the second machine's `land-0900/fence.mjs` excludes idle sessions by cwd). `lock-fences` must pass.
10. **Setup and git:** `fgos setup </dev/null` must exit 0 with `configAddedKeys` and `globalConfigAddedKeys` empty. `docs/decisions/index.md` must stay untouched now. The fetch refspecs must match the backup, `git fetch origin` must exit 0, and `git pull --ff-only` must work in forgentX.
11. **Doctor through the shim** in each workspace. These rows must pass:
    - Git: `git-component-compatible`, `git-native-locks`, `git-operation-journal` (0 pending), `git-transport-config`, `git-trust-topology`, `git-publication-refspecs`, `git-durability-capability`, and `git-worktree-recovery` (advisory issues only).
    - Run and lock: `run-attempts-stuck`, `legacy-attempts-stuck`, `cancel-wait`, `lock-*`, `state-root`, `events-jsonl-not-truncated`, `decision-index-stale`.
    - New rows: `tier-fallback`, `tier-vocabulary-dead-keys`, `workflow-case-bindings`, `workflow-case-binding-sentinel`.
    - forgentX `active-release-matches-checkout` passes once it has pulled to the release commit.

    Every other failing row should be the same owner-config set as at 18:41. Note any new failing row, especially `model-policy-tier-coverage`, before the smokes.
12. **Smokes** in forgentX (scripts: the second machine's `land-0900/`):
    - a. A read-only claude run through herdr, outcome `pass`. Use a real reading task such as `wc -l README.md`, because a one-word report settles as `inconclusive`.
    - b. Create a throwaway worktree with `fgos worktree create .claude/worktrees/smoke-git06 --branch smoke/git06-lease --base origin/main`. Watch the lease with `lease-mon.sh` on `dispatch-cwd--<dev>-<ino>-*.lock` (`stat -c %d-%i <wt>`). Run a writing `fgos run … --writes <file> --worktree <wt> --json`. Expected: the kernel lock is held, the `linux-gate` record appears before the agent works, then the tip moves while the record and the kernel entry go. `commit.status` is `committed`. Then check that no `index.lock` is left: `ls "$(git -C <wt> rev-parse --path-format=absolute --git-path index.lock)"` must fail, and doctor `git-native-locks` must pass.
    - c. A second writing run in the same worktree is admitted after b's handoff, commits, and leaves no `index.lock`.
    - d. Ctrl-C and resume. Spawn the shim with SIGINT at default (`smoke-int.py`, Python `preexec_fn`), because a background `&` ignores SIGINT. Expect exit 130 and `chờ resume`; `fgos run --resume <unit>` then gives `runs/02` with outcome pass and `supersedesRunId` = attempt 01 in `runs/02/run.json`. Close the retained pane.
    - e. One codex read-only run through herdr.
    - **GitHub adapter:** run `gh-smoke.mjs` from `/tmp` with `node`. It loads the active release's `github-adapter.mjs`, confirms that the timeout query is present and makes one read-only `viewGitHubPRStatus` call. **Do not merge any real PR.**
    - **Dormancy check:** `ls "$(git rev-parse --path-format=absolute --git-common-dir)/fgos/git/operations/"` must show only worktree operations (and the older publication ones), with nothing for Land, SafeRestore, Recovery, scoped commit, sync or checkpoint. `fgos events` is still an unknown verb, and `fgos list` works.
    - **Cleanup:** remove the smoke worktree through the Worktree port. A direct `node` script must run with `FGOS_HOST_BIN=<release>/bin/fgos` (`wt-remove.mjs`); without it the addon loader refuses with `git-addon-not-shipped`. Warnings `worktree-cwd-unreadable` for `(sd-pam)` or `ssh-agent` are advisory. Then delete the smoke branch, and remove the build worktree with non-force `git worktree remove`.
13. Write the landing report and the board line.

## Rollback

1. Stop everything (step 2).
2. Run `fgctl upgrade --from ~/.local/state/fgos/releases/sha256:14439416…` in each workspace (in the reverse order is fine).
3. Restore `.fgos/distribution.json`, run `git checkout -- .fgos/config.json` if needed, and restore `~/.fgos/config.json`.
4. Check the hashes, run `fgctl verify` and `git fetch origin`.

Restore `fgctl` from `fgctl.prev` only if `fgctl` itself is the problem.

Nothing dormant ran, so there is no ScopedCommit, Land, Sync or migration state to undo. The Git WAL and the `dispatch-cwd` records stay, and the Git 04 release reads them. If a Workflow case was opened on the new release before the rollback, note its id for the AGENT-WF lane.
