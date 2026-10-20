# Pane-close fix and latest main landed on the second machine

Date 2026-10-20, 15:28–16:52 (Asia/Saigon), second machine (`~/projects/forgent`, host fg-server2), session `e1505f04`. Same procedure as [the 09:00 landing](landing-261020-0901-latest-main-git-06-this-machine.md), with two pane-close smokes added and the activation moved into a short quiet window between Git 07 leads.

**Outcome: landed and kept.** Release `sha256:fde9e4e12b09f62b713a1fd67c542c0e86eda6f6b5b4223b764b1c3068270ea3` is active (previous `sha256:c423c48c…`). It was built from origin/main `0cef3e4c7`. No rollback.

## What is new against the previous release here

- **Pane-close fix** (`58c530e13`, `e1d5a4005`): release-slot closes a settled dead worker's pane when the receipt has a recognized gate exit and both capture digests; it records no final `retain` while a settlement step is still pending. The dev door (`scripts/run-rust-dev-host.mjs`) keeps a staged host while a detached supervisor still runs from it, and prunes it later.
- **The owner machine's work:** COOK P4 (`fgos worktree create` provisions `ak-*` skills, claude declares `ak:cook`, doctor `executor-skills-installed`), MP-B1 06 (`resolveTierModel` pool cells), the `debate` pattern and `judge` role, `fgos worktree remove`, mailbox and secrets docs, and the thehive/OpenRouter config.
- **Event Store** store layer and latency work (`a184db4cc`, `c3acb78f2`). Still dormant.

## Steps as run

1. **/tmp:** the safe command (`find /tmp -maxdepth 1 -name 'fgos-*' -mmin +120 -type d -exec sh -c 'git -C "$1" rev-parse --is-inside-work-tree >/dev/null 2>&1 || rm -rf "$1"' _ {} \;`) took the count from 1072 to 555 entries.
2. **Board check** after `git fetch`: no line says not to land.
3. **Identity:** only `file:/home/vantt/.gitconfig`. git 2.53.0.
4. **Build:** a clean detached worktree of `0cef3e4c7` at `/home/vantt/.claude/jobs/e1505f04/tmp/land-1530/wt`, with a private fresh `CARGO_TARGET_DIR` (`land-1530/tgt`, created 15:29). The release staged 788 files. The scripts are in `land-1530/`; the files copied from `land-0900/` keep their names. Three new scripts split the old `land.sh` so the activation step is short:
   - `preinstall.sh`: fgctl install and `fgctl stage`;
   - `activate.sh`: a strict quiet gate, then `fgctl upgrade`;
   - `go.sh`/`waitstop.sh`: poll, back up, then activate.
5. **git-wal-v1** is present in the staged manifest's capabilities.
6. **Pre-activation checks on the staged tree** (`precheck.sh`):
   - `borrow_deadline --ignored` passed (1 passed, 10.1 s, real bwrap).
   - `cargo test -p fgos-run-supervisor -p fgos-terminal-control`: 219 passed, 0 failed, 1 ignored.
   - The host-only Node tests that the pane-close lead could not run in its sandbox all passed here with `FGOS_HOST_BIN` set to the staged host: `terminal-fallback` 4/4, `terminal-cutover` + `run-rust-dev-host-staging` 11/11, 0 skipped.
7. **Waiting for a quiet window.** The Git 07 u12 lead was live. Unit 13 started within about a minute of u12 ending (15:53), and the first 60 s poll lost that race. The quiet gate refused, so nothing was activated then. fgctl was then installed (sha256 `b5efb57f…`, previous `d57a9698…` kept as `fgctl.prev`) and the release staged, because neither step activates anything. Polling moved to every 2 s.
8. **Activation:** stopcheck passed at **16:40:20** (no fgOS process and no open file under `.fgos/` or the state root). `backup.sh` then wrote `.fgos/runtime/tmp/landing-pane-close-this-machine/`:
   - `global-config.json` (mode 600) and `project-config.json`;
   - `distribution.json.main` and `fetch-refspecs.before`;
   - `before.sha`.

   `fgctl upgrade` ran 16:40:34–16:42:22. `.fgos/distribution.json` was restored. The hash check passed for `AGENTS.md`, `.claude/settings.json`, `CLAUDE.md` and both configs, so the other session's uncommitted edits are untouched. The old-release `doctor --fix` sweep was skipped, because it would have used up the quiet window.
9. **Leads started during the upgrade.** The coordinator's four Git 07 sub-lane leads started at 16:41:09, 16:41:49 and 16:42:09, while `fgctl upgrade` was still finishing. All of them run from the new release path. The coordinator was told and kept the activation.
10. **Fences:** `fence.mjs` placed 77 (434 already there). After the smokes, 11 new `.recovery.lock` paths of smoke run directories are unfenced. A second `fixLockFences` refused because a lead's worker is running `fgos` in `git-p07-scripts`, which is correct. This is a warning only.
11. **`fgos setup`:** exit 0, `configAddedKeys` and `globalConfigAddedKeys` both empty. The fetch refspecs match the backup, and `git fetch origin` exits 0.
12. **Main checkout not updated.** It is on local `main` `69cf65163`, 11 behind origin/main, with another session's uncommitted `AGENTS.md` and `.claude/settings.json`. Nothing was pulled, reset or stashed there.

## Doctor through the shim

144 checks, **10 failing**. Compared with the previous landing, `active-release-matches-checkout` now passes, and two rows are new failures.

| Row | Result |
|---|---|
| `active-release-matches-checkout` | **pass** (changed=0, missing=0, extra=0). No code differs between the release and the checkout. |
| `executor-skills-installed` (new row) | fails: `openai declares ak:cook but .agents/skills/ak-cook/SKILL.md is missing`. This is the owner's pending task to reinstall ak for codex/omp/pi/grok, not a landing problem. Origin/main `dee31595c` now declares ak:cook on every executor, so this row will list more executors once that config is pulled. |
| `run-attempts-stuck` (new failure) | `unit-run-1792482363495-797e4401` has no holder and no `closed.json`: it is the pane-close lead's dev-door smoke, whose staged host directory was deleted (the exit-66 cause fixed by `e1d5a4005`). It has a final `retain` from before the fix; the u2 report says a person must close its pane. It was left alone. |
| `model-policy-tier-coverage`, `tool-registry-configured`, `work-step-vocabulary` (`tsk-5db`), `doc-current-path-missing`, `doc-source-conservation`, `executor-profile-warnings`, `confined-pane-accounts` (`tetnu` has no `pi` source), `agent-cli-project-trusted` (default `~/.codex`) | same as before: owner config, not this landing |
| `git-component-compatible` (addon 0.2.0, napi 8; gitPort 1, receipt 1, walRecord 1, eventStore 4), `git-native-locks`, `git-operation-journal` (0 pending), `git-transport-config`, `git-trust-topology`, `git-publication-refspecs`, `git-durability-capability` | pass |
| `terminal-control`, `terminal-allocations` (no stuck slot, no retained pane past its time), `run-supervisor-route` | pass |
| `model-policy-pools` | warning: the tier cells name `@thehive`/`@openrouter` pools that the global `runner.llmAccounts` does not declare (owner config) |
| `units-awaiting-resume` | warning: three older units, none from this landing (both interrupted smoke units were resumed) |
| `lock-holders`, `lock-fences` | warnings: a live lead's `dispatch-cwd` record, and the 11 smoke-run paths in step 10 |

A rerun after the smokes gave the same 10 failing rows.

## Smokes on the new release

| Smoke | Unit | Result |
|---|---|---|
| a. read-only claude via herdr | `unit-run-1792489461843-216b08f7` | pass, `herdr-spawn`, tier `standard`, `sonnet` ("README.md has 205 lines") |
| e. codex via herdr | `unit-run-1792489477790-c919bf60` | pass, executor `openai`, `gpt-5.6-terra` ("205 lines") |
| **Pane close, clean** | `unit-run-1792489528255-7e3d13d6` | exit 0. Pane `w6:pC1` opened at 1 s. `release-slot.json` disposition **`close`**, and the pane is gone from `herdr pane list`. |
| **Pane close, cancelled** (SIGTERM to the `fgos run` controller 3 s after its pane appeared) | `unit-run-1792489546347-d0cfc1bd` | The controller exited 143 with `chờ resume`. The receipt is `cancelled`, `stoppedBy: cancel`, with both capture digests. `closed.json` lists settle-attempt, finalize-home, cleanup-trust and release-slot. `release-slot.json` disposition is **`close`**, and pane `w6:pC2` is gone. The resume ran `runs/02`, which passed and also closed its pane. |
| Throwaway worktree | `fgos worktree create .claude/worktrees/smoke-paneclose --branch smoke/paneclose-lease --base origin/main` | created at `a8050d2ad` (origin/main had moved on with docs) |
| b. writing run | `unit-run-1792489572974-06463d0d` | **pass, committed `e3e01874c`**; no `index.lock` in either place |
| c. second writing run, same worktree | `unit-run-1792489681152-cc76dd22` | **pass, committed `54b0733ae`**; no `index.lock`. It took three tries; the two earlier tries were not landing defects (see Findings). |
| d. Ctrl-C and resume (SIGINT at default) | `unit-run-1792489712433-9d2231fb` | SIGINT at 25 s gave exit 130 and `chờ resume`. Attempt 01's receipt is `cancelled`/`stoppedBy: cancel`, and pane `w6:pC7` **closed by itself** (release-slot `close`); on the old release this pane was retained. `fgos run --resume` gave exit 0: `runs/02` passed, with `supersedesRunId` = attempt 01. |
| GitHub adapter | `land-1530/gh-smoke.mjs` | The adapter loads with the timeout query and its four exports. One read-only `viewGitHubPRStatus(repo, 7)` returned `{"outcome":"viewed","state":"MERGED",…}`. No merge was attempted. |

**Lease monitor** (`lease-mon.sh` on `dispatch-cwd--66306-2921840-*`):

```
b:  16:46:13.059 kernel held, record absent, tip a8050d2ad -> 16:46:14.004 record present -> 16:46:27.395 tip e3e01874c, record absent, kernel free
c1: 16:46:27.663 kernel held -> 16:46:28.450 record present -> 16:47:09.519 kernel free (refused run; record gone by 16:47:30)
c3: 16:48:01.196 kernel held -> 16:48:02.138 record present -> 16:48:14.841 tip 54b0733ae (monitor stopped; no record or lock entry afterwards)
```

**Every pane a smoke opened was closed:** `w6:pC1`, `pC2`, `pC4`, `pC5`, `pC7`, and the resume panes. Afterwards `herdr pane list` shows only the sessions' own panes and the four Git 07 lead panes `pBV`–`pBY`, which this landing did not touch.

**Dormancy:** `fgos events` is still an unknown verb. The Git WAL operations directory has only worktree create/remove operations.

**Cleanup.** First, `fgos worktree remove .claude/worktrees/smoke-paneclose --delivered-to refs/heads/smoke/paneclose-lease` refused with `worktree-ignored-bytes-preserved`, which is the COOK × GIT gap that the 15:30 owner landing found. The only ignored bytes were the provisioned skill copies (103 `.claude/skills/ak-*`, plus `.grok`, `.omp` and `.pi` skills). After `git clean -fdX` in that throwaway worktree, the verb returned `{"removed":true}`. Branch `smoke/paneclose-lease` was then deleted (tip `54b0733ae`), and the build worktree `land-1530/wt` was removed with non-force `git worktree remove`.

## Findings

- No landing-caused bug. Pane close works on the real host for a clean run, a SIGTERM cancel and a SIGINT cancel, with the release run directly (not through the dev door).
- **Smoke c, first try** (`unit-run-1792489587582-19a805a7`): `policy-refusal` / `invalid-agent-result-claim`. Sonnet wrote a raw newline inside the JSON `summary` string of `result-1.json`. The file was written but not committed, and the pane still closed (`close`).
- **Smoke c, second try** (`unit-run-1792489650959-a585c6cf`): `verdict-inconclusive`. The file was left over from the first try, so it was dirty before launch and was excluded. The agent changed nothing, and the run was classified correctly.
- **The leads re-launch back to back.** A 60 s poll misses the gap between them; this landing needed a 2 s poll and staging done in advance. `fgctl upgrade` takes about 108 s, and new runs started during its second half on the new release. The activation pointer had already switched, so there was no mixed state, but a stop-everything landing should hold the leads, not race them.
- `fgos worktree remove` refuses on every worktree that `fgos worktree create` provisioned. This needs the COOK × GIT item from the owner board line of 15:30.

## Rollback (not used)

`/home/vantt/.claude/jobs/e1505f04/tmp/land-1530/rollback.sh` runs these steps:

1. Run the stop check.
2. `fgctl upgrade --from ~/.local/state/fgos/releases/sha256:c423c48c…`.
3. Restore `.fgos/distribution.json`.
4. `git checkout -- .fgos/config.json`.
5. Restore the global config backup.
6. Verify the hashes and `git fetch`.

Restore `fgctl` from `fgctl.prev` only if `fgctl` itself is the problem. Before rolling back, stop the Git 07 leads, which now run on this release, and tell the coordinator first.

No component-boundary change.
