# Owner machine: stop-everything landing of Git 04 (with Git 03, ES 07)

Written 2026-10-19 15:39 (Asia/Saigon) for the owner machine, which has three workspaces: mdview, mcp-skill-hub and forgentX. Its active release is `sha256:4591f097ba7934bbde8263f36c0757d1f10526157abcb4bfc82ce1d6ef67f357` (main `f85fc7d3f`, Git 01 + 6.4). Run it at the time the owner sets (board 15:20). The second machine landed this content at 15:15 and kept it: [landing report](landing-261019-1539-git-03-04-stop-everything-this-machine.md), release `sha256:f4f505d9…` from main `d2442cfb4`.

**Any release built from main at or after `d49800451` contains Git 04.** A later main also brings the 6.4 fixes and AGENT-WF phases that landed after `f85fc7d3f`; build from the current origin/main.

## Why stop-everything

Git 04 makes the controller hold the custody lease (`dispatch-cwd`) from producer start through the runner commit, receipt and handoff. It also writes a predecessor record before the agent starts. A controller of the old release commits with no lease and leaves no record. A new successor would read that absence as a recorded handoff and start a second writer in the same worktree. The lease key also changed (it now includes the cwd birth time), so the old and new release do not even contend on the same lock file. No old-release controller, supervisor, gate or agent pane may be alive in any of the three workspaces while the new release is active.

## What arrives

- **Git 04:** the lease lifecycle above. Successor admission accepts only a recorded handoff or a provably empty `linux-gate`/`windows-job` domain. It refuses best-effort records (`linux-pgroup`, `macos-tree`) with `custody-predecessor-unknown` and redispatches the Workflow unit in a fresh worktree. Runner commit git children and verify borrow the lease. A writing run with `--force-shared-cwd` is refused with `custody-required`.
- **Git 03:** the Worktree port, `fgos worktree create <path> [--branch <n> | --detach] [--base <ref>]`, and the doctor row `git-worktree-recovery`. Preserved dirty or stale checkouts appear in that row as advisory issues; only pending operations, missing or locked registrations and partial admin entries fail it.
- **ES 07:** verbs and doctor checks, dormant (no row registered).

## Steps (in each of mdview, mcp-skill-hub, forgentX unless noted)

1. **Stop every fgOS controller and every herdr agent pane, in all three workspaces.**
   - `ps -eo pid,args | grep -E '(^| |/)(fgos|fgctl)( |$)|bin/fgos\.mjs|fgos-gateway|internal (supervise|gate)'` must list nothing: no `fgos run`, no `fgos workflow`, no `internal supervise`, no `internal gate`, no gateway.
   - Let running rounds finish, or interrupt each controller with Ctrl-C and resume it after activation (`fgos run --resume <unit>`).
   - `herdr pane list`: close every fgOS agent pane (cwd under `.fgos/assignments/…/runs/NN`) with `herdr pane close <id>`. Also close panes whose cwd is a deleted worktree, but only your own.
   - No process may have a file open under any workspace `.fgos/` or under `~/.local/state/fgos`. Scan `/proc/*/fd`; the second machine used `land4/stopcheck.sh`.
2. **Pane-home cleanup check.** Look in `/tmp/fgos-confinement`. A pane home may be removed only when all of these hold: its run is settled, its pane is gone, its binder pid is dead, and no process uses the directory (`/proc/*/cwd`, `/proc/*/fd`). Compare its `auth.json` with the account store first, so a refreshed login is not lost. `fgos doctor` row `confinement-orphaned-resources-reaped` must pass.
3. **Old-release sweep:** `fgos doctor --fix </dev/null` until `run-attempts-stuck` adopts 0. If it regenerates `docs/decisions/index.md` with fewer lines, restore the file (`git checkout -- docs/decisions/index.md`).
4. **Look for custody records before activation:** `ls .fgos/locks/*.predecessor.json` in each workspace and each of its worktrees. None should exist under the old release, because it never writes `dispatch-cwd` records. Note any you find. Do not delete one unless you follow holder-lock spec §19 "Stranded custody record: manual recovery": quiesced, recorded producer fenced, no writer left. Archive only the record, never the lock file.
5. **Back up** per workspace:
   - `.fgos/distribution.json`;
   - `git config --get-all remote.origin.fetch`;
   - hashes of `.fgos/config.json`, `AGENTS.md`, `CLAUDE.md`, `.claude/settings.json`.

   Also back up `~/.fgos/config.json` (mode 600) and the current `fgctl` as `fgctl.prev`.
6. **Build from current origin/main**, once:
   - Use a clean detached worktree (`git worktree add --detach <wt> origin/main`) with its **own fresh** `CARGO_TARGET_DIR`.
   - `cargo build --locked --release --workspace`.
   - `node scripts/build-rust-distribution.mjs --repo-root <wt> --out <empty dir>`; the tree must contain `libexec/native/fgos.node`.
   - `cargo install --locked --path <wt>/apps/fgctl --root ~/.local`.
7. **Activate** in mdview, then mcp-skill-hub, then forgentX:
   - `fgctl stage --from <tree>` and `fgctl upgrade --from <tree>`;
   - restore `.fgos/distribution.json`;
   - check the hashes from step 5;
   - `fgctl verify`.
8. **Fences:** `fixLockFences(root, {excludePids, hostBin})` from the new payload, run from `/tmp` and excluding idle agent sessions by pid (the second machine used `land4/fence.mjs`). Alternatively, run `fgos doctor --fix` after the stop check. The `lock-fences` row must pass.
9. **Setup:** `fgos setup </dev/null`: exit 0, `git-driver-directories` safe, Git WAL initialized and trusted, no fetch mapping change. Restore `docs/decisions/index.md` if setup rewrites it lossily.
10. **Verify git:** the fetch refspecs are unchanged (`+refs/heads/*`, `+refs/fgos/events/*`, the glob `+refs/fgos/legacy*` line); `git fetch origin` exits 0; `git pull --ff-only` works.
11. **Doctor through the shim** per workspace. These rows must pass:
    - Git: `git-component-compatible`, `git-transport-config`, `git-worktree-recovery`, `git-trust-topology`, `git-operation-journal` (0 pending), `git-native-locks`, `git-publication-refspecs`, `git-durability-capability`.
    - 6.4: `run-attempts-stuck`, `legacy-attempts-stuck`, `cancel-wait`.
    - Locks: `lock-kernel-semantics`, `lock-borrow-vectors`, `lock-holders` (0 held), `lock-fences`, `lock-record-unreadable`, `lock-predecessor-kill-wait`, plus `state-root`.
    - forgentX only: `active-release-matches-checkout`.

    `units-awaiting-resume` only warns. The rest should be the known owner-config set.
12. **Smokes** in forgentX (or a trusted scratch clone):
    - a. A read-only `fgos run "<prompt>" --provider claude` through herdr: outcome `pass`.
    - b. **Writing run with the lease check.**
      1. `fgos worktree create .claude/worktrees/smoke-git04 --branch smoke/git04-lease --base origin/main`.
      2. Start a watcher on `.fgos/locks/dispatch-cwd--<dev>-<ino>-*.lock` (`stat -c '%d-%i' <worktree>`). It polls `<lock>.predecessor.json`, the `/proc/locks` entry for the lock file's inode, and `git rev-parse smoke/git04-lease`. The second machine used `land4/lease-mon.sh`.
      3. Run `fgos run "Create plans/reports/smoke-a.txt with one line ... The summary in your result claim must be one single line." --provider claude --writes plans/reports/smoke-a.txt --worktree <wt>`. Ask for a single-line summary: a claim with a raw newline in its JSON string stalls the round until idle.
      4. Expected sequence: the kernel entry appears; the record appears (`linux-gate`) before the agent works; the branch tip moves while the kernel entry is still held; then the record disappears and the kernel entry goes (recorded handoff). The result's `commit.status` is `committed`.
    - c. A second writing run in the same worktree (another file): it is admitted, then commits and clears the record the same way.
    - d. Ctrl-C and resume: a read-only run with a ~60 s wait, SIGINT after 25 s → exit 130 with `chờ resume`, attempt 01 `cancelled`. `fgos run --resume <unit>` → `runs/02` with `supersedesRunId` = attempt 01, outcome `pass`. Close the retained pane of attempt 01.
    - e. One codex read-only run through herdr (`--provider openai --account <acct>`).
    - Cleanup: close our panes. Remove the throwaway worktree through the Worktree port (`remove` with `expectedTip`, `deliveredTo` = the branch tip, an `evidenceDigest`; non-force; the second machine used `land4/wt-remove.mjs`). A leftover untracked file makes it refuse `worktree-dirty-preserved`: delete that file, then retry. Never `rm -rf`. Delete the smoke branch afterwards.
13. Remove the temporary build worktree with non-force `git worktree remove` (keep the release). Write the landing report and the board line.

## Rollback runbook

1. With the new release still active, run `fgos doctor --fix` until `run-attempts-stuck` and `legacy-attempts-stuck` are clean.
2. **Stop everything again** (step 1). The old release commits without a lease, so it must never run beside a new-release controller.
3. `fgctl upgrade --from <release 4591f097… tree>` (`~/.local/state/fgos/releases/sha256:4591f097ba7934bbde8263f36c0757d1f10526157abcb4bfc82ce1d6ef67f357`), or `fgctl repair`. Restore `.fgos/distribution.json`, then `fgctl verify`. Restore `fgctl` from `fgctl.prev` only if `fgctl` itself is the problem.
4. `git checkout -- .fgos/config.json` if needed, restore `~/.fgos/config.json` from the backup, check the hashes and `git fetch origin`.
5. What stays:
   - `dispatch-cwd` predecessor records left by new-release runs. Holder-lock judges them as before, the older release too.
   - The Git WAL. A later activation refuses a release without the WAL only while it has pending records.
   - Closed attempts and settlements.
