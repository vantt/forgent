# Owner machine: landing Git phase 01 with 6.4 (fixes on main)

Written 2026-10-19 09:15 (Asia/Saigon) for the owner machine (workspaces forgentX, mdview, mcp-skill-hub; active release 6.3 `a6bcdc29…`). Replaces [the 07:05 guide](guide-261019-0659-owner-machine-git-01-landing.md), which was blocked. The second machine landed this release at 09:08 and kept it: [landing report](landing-261019-0914-git-01-relanding-this-machine.md).

## What changed since the blocked guide

- `fgos setup` installs the legacy fetch mapping in the glob form `+refs/fgos/legacy*:refs/fgos/remotes/origin/legacy*`. Plain `git fetch` keeps working while the remote has no `refs/fgos/legacy`. If a workspace still has the old exact line, setup (or `fgos doctor --fix`, check `git-publication-refspecs`) replaces it.
- Setup's `git-driver-directories` fix makes the driver directories current-user-owned and not group/other-writable, so a umask-002 state root no longer turns the Git rows red.
- `eventStore.remote` defaults to `origin` in `.fgos/config.json`.

## In this release, dormant

- **ES 06** (Event Store Node facade in the combined addon): no consumer yet, nothing to configure, nothing runs.
- **Git 02** (scope, inspect, Refs/Remote, `git-transport-config` doctor row) is **not** in this release: its branch did not pass its host gate at 08:55. When it lands it is also dormant except for the new doctor row, which may warn about repository-local `http.*`/`credential.*` keys (CI: `persist-credentials: false`).
- **Git phase 04** (custody lease across the runner commit) is **not** part of this landing. It lands later in its own stop-everything landing on both machines, at a time the owner sets.

## Steps

1. **Git ≥ 2.53 first.** `git --version` in a shell and inside a herdr pane. With git < 2.53, `git-component-compatible` fails and setup cannot initialize the Git WAL or the fetch mappings.
2. **Pane-home cleanup on 6.3 (still active).** Look in `/tmp/fgos-confinement`. A version-1 home has `paneId`/`binderPid` in `.fgos-confinement-owner.json`. Remove it only when its run is settled, its pane is gone, its binder pid is dead and no process uses the directory (`/proc/*/cwd` and `/proc/*/fd`). Compare its `auth.json` with the account store first, so a refreshed login is not lost. Close herdr panes whose cwd is a deleted worktree (`herdr pane list`, `herdr pane close <id>`), but only your own.
3. **Quiesce** all three workspaces: no `fgos`, `fgctl` or gateway process, no file open under `.fgos/` or `~/.local/state/fgos`, herdr rounds finished.
4. **Old open attempts on 6.3:** `fgos doctor --fix </dev/null` in each workspace until `run-attempts-stuck` is clean.
5. **Build** from current `origin/main` in a clean detached worktree with a Cargo cache owned by that worktree (or run `cargo clean --release` first; a cache shared with other worktrees can serve stale crates):
   - `cargo build --locked --release --workspace`;
   - `node scripts/build-rust-distribution.mjs --repo-root <wt> --out <empty dir>`; the tree must contain `libexec/native/fgos.node`;
   - keep the old `fgctl` as `fgctl.prev`, then `cargo install --locked --path <wt>/apps/fgctl --root ~/.local`.
6. **Back up** per workspace: `.fgos/distribution.json`, `git config --get-all remote.origin.fetch`, hashes of `.fgos/config.json`.
7. **Activate** in mdview, then mcp-skill-hub, then forgentX: `fgctl stage --from <tree>`, `fgctl upgrade --from <tree>`, restore `.fgos/distribution.json` if it changed.
8. **Fences:** `fixLockFences(root, {excludePids, hostBin})` from the new payload (exclude idle agent sessions by pid), or `fgos doctor --fix` after the stop check.
9. **Setup:** `fgos setup </dev/null`. It must report `git-driver-directories` safe and `Git WAL initialized and trusted`. If it regenerates `docs/decisions/index.md` from an event log that lacks a decision, restore the file.
10. **Verify git:** `git config --get-all remote.origin.fetch` shows the glob `refs/fgos/legacy*` line and no exact `refs/fgos/legacy:` line; `git fetch origin` exits 0; `git pull --ff-only` works.
11. **6.4 sweep on the new release:** `fgos doctor --fix </dev/null` per workspace. forgentX has about 2,100 old open attempts (adopt sweep, `run-attempts-stuck`) and six T8 runs (`legacy-attempts-stuck`). Do not prune old releases before this: `adopt` has no fallback when the envelope's `hostBin` release is gone.
12. **Doctor through the shim** per workspace. Must pass: `git-component-compatible`, `git-trust-topology`, `git-operation-journal`, `git-native-locks`, `git-publication-refspecs`, `git-durability-capability`; `run-attempts-stuck`, `legacy-attempts-stuck`, `cancel-wait`; the `lock-*` rows and `state-root`; `active-release-matches-checkout` in forgentX. `units-awaiting-resume` only warns. The rest should be the owner-config set.
13. **Smoke** in a trusted scratch clone: one read-only `fgos run` through herdr and one through a cli invocation; one run interrupted with Ctrl-C (exit 130, `chờ resume`); `fgos run --resume <unit>` writes `unit-summary.json` with `runs/02` superseding `runs/01`. Close the retained pane of attempt 01 by hand.

## Rollback runbook

1. With the new release active, `fgos doctor --fix` until `run-attempts-stuck` and `legacy-attempts-stuck` are clean.
2. Stop all writers.
3. `fgctl upgrade --from <6.3 tree>` (`sha256:a6bcdc29000d359ac9de82eeeaf325ef664db77a90fc59394958296882b96c08`) or `fgctl repair`; restore `.fgos/distribution.json`. Restore `fgctl` from `fgctl.prev` only if `fgctl` itself is the problem.
4. Remove each `+refs/fgos/…` fetch line: `git config --fixed-value --unset remote.origin.fetch '<line>'`; check `git fetch origin`.
5. Restore `.fgos/config.json` if the old release must not see the new defaults (they are description and default only).
6. What stays, safe for 6.3: closed attempts and settlements, `unit-control` ledgers, the initialized Git WAL (6.3 does not read it; a later activation refuses a release without the WAL only while it has pending records), `dispatch.cancelWaitMs`.
