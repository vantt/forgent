# Git 05 + ES 08 landed on the second machine (stop-everything)

Date 2026-10-19, 22:08–22:25 (Asia/Saigon), second machine (`~/projects/forgent`, host fg-server2), session `ac420727`. Same procedure as [the 15:39 landing](landing-261019-1539-git-03-04-stop-everything-this-machine.md), with the smoke set of [the owner machine's 18:41 landing](landing-261019-1841-git-04-stop-everything-owner-machine.md).

**Outcome: landed and kept.** Release `sha256:42baabb673800bcb44a772ada5465ced39ec23d8ae2ef9b3d3d35b9344e01446` is active (previous `sha256:f4f505d9…`). It was built from origin/main `8a8f7a80b`. `fgctl verify` passes. forgent is the only project on this machine with an activation, the same set as last time.

## What is new against the previous release here

- **Git 05:** ScopedCommit, Checkpoint main, Sync and the cutover grant. All are dormant: no production path calls them (checked below). Activation now requires the native addon to declare `git-wal-v1`. The staged manifest has `components.nativeAddon.capabilities = ["git-wal-v1"]`, target `linux-x64`, napi 8.
- **ES 08:** migrate legacy, parity and rollback. Dormant: `src/verbs/events/migrate.mjs` is not imported by any CLI entry.
- **B1–B7 fixes.** B1: an unreadable result file ends the round as `terminal:result-unreadable`. B2: the decision index keeps committed rows. B3: the cwd warning is printed once per pid. B4: a clean worktree with a tracked `.fgos` can be removed. B6: the gate sets parent-death, and `/proc/locks` is read to EOF. B7: the payload walker skips git-ignored files.
- **Test fixes:** temp-root signal exit, /tmp leak, git identity guard, fence host isolation.

## Steps as run

1. **/tmp:** `find /tmp -maxdepth 1 -name 'fgos-*' -mmin +120 -exec rm -rf {} +`.
2. **Board check:** origin/main board read after `git fetch`. No line says not to land, and no lane is mid-cutover. ES 08 says "Chưa activate release, chưa chạy migrate thật", and this landing does not run migrate.
3. **Quiesce:** no `fgos`, `fgctl`, supervisor, gate or gateway process, and no file open under `.fgos/` or the state root. The live processes were interactive Claude sessions, three codex app-server daemons and the herdr server. None held fgOS files, and none were touched.
4. **Predecessor records:** none on any `dispatch-cwd` lock in the workspace or in its four linked worktrees.
5. **Old-release `fgos doctor --fix`:** exit 0. It regenerated `docs/decisions/index.md` lossily once more (the old release does not have B2), so the file was restored with `git checkout -- docs/decisions/index.md`.
6. **Backups:** `.fgos/runtime/tmp/landing-git-05-es-08-this-machine/`. It holds `global-config.json` (mode 600), `project-config.json`, `distribution.json.main`, `before.sha`, `fetch-refspecs.before` and `fgctl.prev` (`4ff2f601…`). No config value was printed.
7. **Build:** a clean detached worktree of origin/main at `/home/vantt/.claude/jobs/e1505f04/tmp/land-2210/wt`, with a private fresh `CARGO_TARGET_DIR` (`land-2210/tgt`, every artifact newer than the run). `cargo build --locked --release --workspace`, then `scripts/build-rust-distribution.mjs`, staged 764 files. The scripts are in `land-2210/` (`prep.sh`, `land.sh`, `rollback.sh`, `stopcheck.sh`, `fence.mjs`, `lease-mon.sh`, `smoke-int.py`, `wt-remove.mjs`).
8. **git-wal-v1 check** on the staged `manifest.json`: present (see above).
9. **fgctl:** reinstalled from the same worktree (sha256 `bba90e8c…`).
10. **Activation** (22:12:39): `fgctl stage` and `fgctl upgrade --from <tree>`. `.fgos/distribution.json` was restored. The hash check passed for `AGENTS.md`, `.claude/settings.json`, `CLAUDE.md` and both configs, so the other session's uncommitted edits are untouched.
11. **Fences:** `fixLockFences` from the new payload, run from `/tmp`, placed 32 (363 already there). `lock-fences` reports all 399 paths fenced.
12. **`fgos setup`:** exit 0, no config keys added. `docs/decisions/index.md` was **not** touched (B2 holds).
13. **Git remote:** the fetch refspecs are identical to the backup, and `git fetch origin` exits 0.
14. **Main checkout not updated.** It sits on local `main`, 51 commits behind origin/main, with another session's local docs commits and uncommitted edits. The instruction for this landing was not to pull, reset or stash there. Plain `fgos` runs the activated release, so this affects only the drift row below.

## Doctor through the shim

140 checks, **9 failing** (the previous landing had 10 failing).

| Row | Result vs 15:39 |
|---|---|
| `decision-index-stale` | **now pass** (B2 fix) |
| `active-release-matches-checkout` | still fails, for a different reason: changed=29, missing=1, extra=6. The checkout is 51 commits behind the release (step 14). The old 4 "missing" files under the git-ignored `.agents/skills/instruction-audit/` are gone (B7). Expected; it clears when that checkout is fast-forwarded. |
| `model-policy-tier-coverage`, `tool-registry-configured`, `work-step-vocabulary` (`tsk-5db`), `doc-current-path-missing`, `doc-source-conservation`, `executor-profile-warnings`, `confined-pane-accounts` (`tetnu` has no `pi` source), `agent-cli-project-trusted` (default `~/.codex`) | same as before: owner config, not this landing |
| `git-component-compatible` | pass (addon 0.2.0, napi 8; gitPort 1, receipt 1, walRecord 1, eventStore 4) |
| `git-worktree-recovery` | pass, advisory only: `es-p08`, `es-p08-review`, `git-p05` and `git-p05-review` are `dirty-or-stale-checkout-preserved` |
| `git-transport-config`, `git-trust-topology`, `git-operation-journal` (0 pending), `git-native-locks`, `git-publication-refspecs`, `git-durability-capability` | pass |
| lock rows, `state-root`, `run-attempts-stuck` (279 open, none stuck), `legacy-attempts-stuck`, `cancel-wait`, `events-jsonl-not-truncated`, confinement rows | pass |
| `units-awaiting-resume` | warning: the old `unit-run-1792328096425-79e2470b` (unchanged) |

A rerun after the smokes gave the same 9 rows.

## Smokes on the new release

| Smoke | Unit | Result |
|---|---|---|
| a. read-only claude via herdr | `unit-run-1792422950571-ef11b2ef` | pass, adapter `herdr-spawn` ("README.md has 205 lines") |
| Throwaway worktree | `fgos worktree create .claude/worktrees/smoke-git05 --branch smoke/git05-lease --base origin/main` | created at `8a8f7a80b` |
| b. writing run | `unit-run-1792423026025-d407226a` | **pass, committed `ddf6d192b`** on `smoke/git05-lease` |
| c. second writing run, same worktree | `unit-run-1792423059535-f4d640d2` | **pass, admitted after the recorded handoff, committed `a7d3cc8b7`** |
| d. Ctrl-C and resume (SIGINT at default through Python `preexec_fn`) | `unit-run-1792423080395-b3eea1c9` | SIGINT at 25 s gave exit 130, `chờ resume`, and an attempt 01 receipt of `cancelled`. `fgos run --resume` gave exit 0: `runs/02` with outcome pass and `supersedesRunId` = attempt 01. Retained pane `w6:p91` closed. |
| e. codex via herdr | `unit-run-1792422969757-c4a0d143` | pass, invocation `codex-herdr`, account `tetnu` ("205 lines") |

**Lease monitor** (`land-2210/lease-mon.sh`, about 150 ms per sample), lock `dispatch-cwd--66306-2228306-1792423017471273034.lock`:

```
b: 22:17:06.072 kernel held, record absent, tip 8a8f7a80b   controller holds the lease
   22:17:08.157 record present (linux-gate)                 declared before the agent worked
   22:17:21.703 record present, kernel held, tip 8a8f7a80b  (closed.json 22:17:21.490)
   22:17:21.864 record absent, kernel free, tip ddf6d192b   commit, handoff, release in one sample
c: 22:17:39.598 kernel held -> 22:17:41.201 record present -> 22:17:54.161 tip a7d3cc8b7, record absent, kernel free
```

The commit and the release fell in the same sample in both runs, as in the owner machine's smoke b. Smoke c was admitted after b's recorded handoff and also committed.

**ScopedCommit, Checkpoint and Sync are dormant.**

- Code: `createGitScopedCommit` and `createGitSync` are only exported from `src/git/index.mjs`. Their only caller is `src/verbs/events/migrate.mjs`, which no CLI entry imports. `checkpointMainFgos` (claim, merge) is the older main-checkout checkpoint, not Git 05's Checkpoint.
- Runtime: after the landing and all smokes, the only new Git WAL operation under `.git/fgos/git/operations/` is the smoke `worktree` create. No operation directory mentions scoped commit, sync or checkpoint.

**Event read paths.** `fgos list --json` and `fgos show` read the event log normally. Doctor `events-jsonl-not-truncated` passes (90 per-writer files), `decision-index-stale` passes, and `observe-run-coverage` matches (325/325). The ES `fgos events sync|status|export|migrate` verbs are still not wired into the CLI: `fgos events` is an unknown verb on both the old and the new release, as expected until ES 09.

**Cleanup.** The smoke worktree was removed through the Worktree port (`remove`, non-force) with `{"removed":true}`, and branch `smoke/git05-lease` was deleted (tip `a7d3cc8b7`). The build worktree `land-2210/wt` was removed with non-force `git worktree remove`. The lease monitor was stopped. No fgOS process is left.

## Findings

- **A direct `node` script against the Git ports needs `FGOS_HOST_BIN`.** Running `wt-remove.mjs` without it fails with `git-addon-not-shipped` ("addon not shipped on this channel until M10"). `loadNativeAddon` finds the release manifest only through the host bin, and the old release behaved the same way. This is a recipe note, not a bug; the guide sets the variable.
- **Old-release `doctor --fix` still drops decision-index rows.** This is the last time, because the new release has B2 and its `setup` and `doctor` left the file alone.

## Rollback (not used)

`/home/vantt/.claude/jobs/e1505f04/tmp/land-2210/rollback.sh` runs these steps:

1. Run the stop check.
2. `fgctl upgrade --from ~/.local/state/fgos/releases/sha256:f4f505d9…`.
3. Restore `.fgos/distribution.json`.
4. `git checkout -- .fgos/config.json`.
5. Restore the global config backup.
6. Verify the hashes and `git fetch`.

The older release lacks Git 05's addon capability check but reads the same WAL and lease records. Nothing dormant ran, so there is no Git 05 or ES 08 state to undo.

No component-boundary change.
