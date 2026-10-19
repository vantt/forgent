# Owner machine: landing Git phase 01 with 6.4 (do not start yet)

Written 2026-10-19 07:05 (Asia/Saigon) for the owner machine (workspaces forgentX, mdview, mcp-skill-hub; active release 6.3 `a6bcdc29…`). Follows [the 04:15 guide](guide-261019-0410-owner-machine-after-publication-port-optimization.md). What happened on the second machine: [landing report](landing-261019-0659-git-publication-and-controller-death-this-machine.md).

## Status: blocked, wait for the Git lane fix

On the second machine, the release from main `66e485e91` passed doctor and both smokes, and was then rolled back. Its `fgos setup` adds the fetch refspec `+refs/fgos/legacy:refs/fgos/remotes/origin/legacy`. Until the Event Store cutover pushes that ref, every plain `git fetch` / `git pull` of that repository fails with `fatal: couldn't find remote ref refs/fgos/legacy`. In each of the three workspaces this would break `git pull` right after the landing.

Start these steps only after the Git lane has put the fix on main and the board says so. If you already ran a setup from a main build: check `git config --get-all remote.origin.fetch` in each workspace, and remove the legacy line with `git config --fixed-value --unset remote.origin.fetch '+refs/fgos/legacy:refs/fgos/remotes/origin/legacy'`.

## Not part of this landing

Git phase 04 (custody lease across the runner commit) is still on branch `git/p04-custody`. It lands later, in its own stop-everything landing on both machines, at a time the owner sets. A release built from main does not carry it.

## Steps (after the fix is on main)

1. **Upgrade git to ≥ 2.53 first.** This machine had git 2.34.1, below the Git floor 2.53, and the native-load tests failed there. With git < 2.53:
   - `git-component-compatible` fails;
   - the floor probe refuses, so `fgos setup` cannot initialize the Git WAL or the fetch mappings, and the Git rows stay red.
   
   Check with `git --version`, and make sure the `git` on PATH for the shell and for herdr panes is the new one.
2. **Driver state root mode.** Run `stat -c %a ~/.local/state/fgos`. If the group or other bits include write (for example 775, created under umask 002), run `chmod 0755 ~/.local/state/fgos`. Otherwise every Git row fails with `untrusted-driver-directory`. Skip this step if the Git lane's fix makes setup tighten the directory itself.
3. **Stop everything** in all three workspaces: no `fgos`, `fgctl` or gateway process, no file open under `.fgos/` or the state root, herdr rounds finished, idle fgOS panes closed.
4. **Old open attempts, on release 6.3 (still active):** `fgos doctor --fix </dev/null` in each workspace until `run-attempts-stuck` is clean. 6.3 already made pane homes version 2. If `/tmp/fgos-confinement` still holds a version-1 home (its `.fgos-confinement-owner.json` has `paneId`/`binderPid`) and no process uses it, apply the 6.3 rule:
   - remove it once its run is settled, its pane is gone and its binder pid is dead;
   - first compare its `auth.json` with the account store, so a refreshed login is not lost.
5. **Build from main** in a clean detached worktree with a private `CARGO_TARGET_DIR`:
   - `cargo build --locked --release --workspace`, then `node scripts/build-rust-distribution.mjs --repo-root <wt> --out <empty dir>`;
   - the staged tree must contain `libexec/native/fgos.node`;
   - reinstall `fgctl`: `cargo install --locked --path <wt>/apps/fgctl --root ~/.local`, keeping the old binary as `fgctl.prev`.
6. **Activate** in mdview, then mcp-skill-hub, then forgentX: `fgctl upgrade --from <tree>`, restore `.fgos/distribution.json` if it changed, then `fgos setup </dev/null`. Setup must report `Git WAL initialized and trusted` and the fetch-mapping line. Then confirm that a plain `git fetch origin` still exits 0.
7. **Fences:** `fixLockFences(root, {excludePids, hostBin})` from the new payload, or `fgos doctor --fix` after the stop check.
8. **6.4 sweep with the new release:** `fgos doctor --fix </dev/null` in each workspace. forgentX has about 2,100 old open attempts, handled by the `run-attempts-stuck` adopt sweep; the six T8 runs are handled by `legacy-attempts-stuck`. Do not prune old releases before this step: `adopt` has no fallback when the envelope's `hostBin` release is gone.
9. **Doctor through the shim** in each workspace. These must pass:
   - the six Git checks: `git-component-compatible`, `git-trust-topology`, `git-operation-journal`, `git-native-locks`, `git-publication-refspecs`, `git-durability-capability`;
   - `run-attempts-stuck`, `legacy-attempts-stuck`, `cancel-wait`;
   - the lock checks;
   - `active-release-matches-checkout` in forgentX.
   
   `units-awaiting-resume` only warns. The rest of the failing set should be the owner-config set from the 6.3 landing.
10. **Smoke** in a trusted scratch clone:
    - one read-only `fgos run` on a herdr invocation and one on a cli invocation;
    - then one run interrupted with Ctrl-C, which must exit 130 with `chờ resume`;
    - then `fgos run --resume <unit>`, which must write `unit-summary.json`.

## Rollback runbook

1. With the new release still active, run `fgos doctor --fix` until `run-attempts-stuck` and `legacy-attempts-stuck` are clean.
2. Stop all writers.
3. Activate 6.3 `sha256:a6bcdc29000d359ac9de82eeeaf325ef664db77a90fc59394958296882b96c08` with `fgctl upgrade --from <6.3 tree>` (or `fgctl repair`). Restore `fgctl` from `fgctl.prev` only if the new `fgctl` is the problem.
4. Remove the fetch lines the new setup added: `git config --fixed-value --unset remote.origin.fetch '<line>'`, once for each `refs/fgos/...` line.
5. What stays, all safe for 6.3:
   - closed attempts, `abandoned-legacy` settlements, `unit-control` ledgers;
   - the initialized Git WAL (6.3 does not read it; a later activation refuses a release without the WAL only while the WAL has pending records);
   - `dispatch.cancelWaitMs`, which only the new release reads.
