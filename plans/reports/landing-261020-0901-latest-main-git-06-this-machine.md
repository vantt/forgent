# Git 06 + typed-operation spawn reduction landed on the second machine (stop-everything)

Date 2026-10-20, 08:50–09:00 (Asia/Saigon), second machine (`~/projects/forgent`, host fg-server2), session `ac420727`. Same procedure as [the 22:22 landing](landing-261019-2222-latest-main-git-05-es-08-this-machine.md), plus three new checks for Git 06.

**Outcome: landed and kept.** Release `sha256:c423c48c27775089695da010c7a7ca4c540cc949c1d0fd5d80c3b26d6bf5c536` is active (previous `sha256:42baabb6…`). It was built from origin/main `585044f19`. `fgctl verify` passes. forgent is still the only project on this machine with an activation.

Gates were already passed before this landing: the merge-gate section of [gate-261020-0653-git-p06b-typed-perf-e3.md](gate-261020-0653-git-p06b-typed-perf-e3.md) and [gate-261020-0526-git-p06-host-gate.md](gate-261020-0526-git-p06-host-gate.md).

## What is new against the previous release here

- **Git 06:** Land, SafeRestore, native index-lock inspection, cooperative SIGTERM termination of borrowed Git children (3 s grace on deadline), RepositoryConfig owning hooks, the Recovery door and the GitHub adapter result contract. Everything is dormant except one live change: `mergeGitHubPR` in `src/runner/github-adapter.mjs` now queries the PR state after an `unreachable` failure that is not a pre-connect error, and reports `merged` or `outcome-unknown` instead of plain `unreachable`.
- **Typed-operation spawn reduction** (`a08f5d4fa`): ScopedCommit and Land read config once per operation at the driver level. These are still dormant (no production caller until Git phase 07).
- **The owner machine's work on main since `8a8f7a80b`:** AGENT-WF phases 03–09 (case ledger, AdmissionPort, `fgos run --case/--activity`, `workflow close`, 2 `workflow-case-*` doctor rows) and MP-B1 phases 00–05 (`runner.tierFallback`, pool-keyed candidates, account order as declared, refusal `tier-cell-missing`).

## Steps as run

1. **/tmp:** `find /tmp -maxdepth 1 -name 'fgos-*' -mmin +120 -exec rm -rf {} +`. 205 younger entries were left alone.
2. **Board check:** read the origin/main board after `git fetch`. No line says not to land. The newest line (08:55, Land budget chosen) unblocks phase 07, and the MP-B1 03+04 line asks that no fallback attempt of an older writing unit is in flight; none was (no controller was running).
3. **Identity:** `git config --show-origin --get-all user.email` shows only `file:/home/vantt/.gitconfig`. git 2.53.0.
4. **Build:** a clean detached worktree of origin/main at `/home/vantt/.claude/jobs/e1505f04/tmp/land-0900/wt`, with a private fresh `CARGO_TARGET_DIR` (`land-0900/tgt`, created for this run). `cargo build --locked --release --workspace`, then `scripts/build-rust-distribution.mjs`, staged 782 files. The scripts are in `land-0900/` (`prep.sh`, `deadline.sh`, `land.sh`, `rollback.sh`, `stopcheck.sh`, `fence.mjs`, `lease-mon.sh`, `smoke-bc.sh`, `smoke-int.py`, `gh-smoke.mjs`, `wt-remove.mjs`).
5. **git-wal-v1 check** on the staged `manifest.json`: `linux-x64 8 [ 'git-wal-v1' ]`.
6. **Deadline test on the staged tree:** `cargo test -p fgos-git --test borrow_deadline -- --ignored` passed: `real_read_tree_deadline_as_namespace_init_cleans_its_native_lock ... ok` (1 passed, 10.05 s). The bwrap namespace test runs for real on this host.
7. **Quiesce:** no `fgos`, `fgctl`, supervisor, gate or gateway process, and no file open under `.fgos/` or the state root. No `dispatch-cwd` predecessor record in the workspace or in its linked worktrees. Three old herdr shell panes still sit with their cwd in `.fgos/assignments/` (units `…7136069`, `…8970065`, `…2348156` from 2026-10-19, before the previous landing). They hold no file under `.fgos/`, belong to earlier sessions, and were left alone.
8. **Old-release `fgos doctor --fix`:** exit 0, `run-attempts-stuck` adopted 0, `lock-holders` 0 held. `docs/decisions/index.md` was not touched (B2 is in the old release).
9. **Backups:** `.fgos/runtime/tmp/landing-git-06-this-machine/`. It holds `global-config.json` (mode 600), `project-config.json`, `distribution.json.main`, `before.sha`, `fetch-refspecs.before` and `fgctl.prev` (`bba90e8c…`). No config value was printed.
10. **fgctl:** reinstalled from the same worktree (sha256 `d57a9698…`).
11. **Activation** (08:54): `fgctl stage` and `fgctl upgrade --from <tree>`. `.fgos/distribution.json` was restored. The hash check passed for `AGENTS.md`, `.claude/settings.json`, `CLAUDE.md` and both configs, so the other session's uncommitted edits in the main checkout are untouched.
12. **Fences:** `fixLockFences` from the new payload, run from `/tmp`, placed 49 (388 already there). `lock-fences` reports all 441 paths fenced.
13. **`fgos setup`:** exit 0, `configAddedKeys` and `globalConfigAddedKeys` both empty.
14. **Git remote:** the fetch refspecs are identical to the backup, and `git fetch origin` exits 0.
15. **Main checkout not updated.** It sits on local `main` `aa9b87933`, 71 commits behind origin/main, with another session's local commits and uncommitted edits. As instructed, nothing was pulled, reset or stashed there.

## Doctor through the shim

143 checks, **9 failing**, the same set as the previous landing.

| Row | Result |
|---|---|
| `active-release-matches-checkout` | fails: changed=46, extra=8, because the main checkout is 71 commits behind the release (step 15). Expected; it clears when that checkout is fast-forwarded. |
| `model-policy-tier-coverage`, `tool-registry-configured`, `work-step-vocabulary` (`tsk-5db`), `doc-current-path-missing`, `doc-source-conservation`, `executor-profile-warnings`, `confined-pane-accounts` (`tetnu` has no `pi` source), `agent-cli-project-trusted` (default `~/.codex`) | same as before: owner config, not this landing |
| `git-component-compatible` | pass (addon 0.2.0, napi 8; gitPort 1, receipt 1, walRecord 1, eventStore 4) |
| `git-native-locks` | pass, no native Git locks |
| `git-operation-journal` | pass, 0 pending |
| `git-transport-config`, `git-trust-topology`, `git-publication-refspecs`, `git-durability-capability` | pass |
| `git-worktree-recovery` | pass, advisory only (`git-p06-review` is `dirty-or-stale-checkout-preserved`) |
| `decision-index-stale`, `lock-fences`, `lock-holders`, `run-attempts-stuck` (279 open, none stuck), `tier-fallback`, `tier-vocabulary-dead-keys`, `workflow-case-bindings`, `workflow-case-binding-sentinel`, `workflow-capabilities-configured`, `workflow-pools-satisfy-independence` | pass |
| `units-awaiting-resume` | warning: the old `unit-run-1792328096425-79e2470b` (unchanged) |

A rerun after the smokes gave the same 9 rows.

## Smokes on the new release

| Smoke | Unit | Result |
|---|---|---|
| a. read-only claude via herdr | `unit-run-1792461354465-fcc43a93` | pass, adapter `herdr-spawn`, tier `standard`, model `sonnet` ("README.md has 205 lines") |
| e. codex via herdr | `unit-run-1792461378010-ef89d0bc` | pass, executor `openai`, account `tetnu`, model `gpt-5.6-terra` ("205 lines") |
| Throwaway worktree | `fgos worktree create .claude/worktrees/smoke-git06 --branch smoke/git06-lease --base origin/main` | created at `585044f19` |
| b. writing run | `unit-run-1792461439654-d09d58d4` | **pass, committed `21eec5e15`**; no `index.lock` in the worktree or in the main git dir afterwards |
| c. second writing run, same worktree | `unit-run-1792461454385-a2562887` | **pass, admitted after b's handoff, committed `9fa8d403f`**; no `index.lock` afterwards |
| d. Ctrl-C and resume (SIGINT at default through Python `preexec_fn`) | `unit-run-1792461479400-24902a5a` | SIGINT at 25 s gave exit 130, `chờ resume`, and an attempt 01 receipt of `cancelled`. `fgos run --resume` gave exit 0: `runs/02` with outcome pass and `supersedesRunId` = attempt 01. Retained pane `w6:pAJ` closed. |
| GitHub adapter | `land-0900/gh-smoke.mjs` | the active release's `github-adapter.mjs` loads, contains the timeout query, exports `classifyGhFailure, createGitHubPR, mergeGitHubPR, viewGitHubPRStatus`. One read-only `viewGitHubPRStatus(repo, 7)`: `{"outcome":"viewed","state":"MERGED",…}`. No merge was attempted. |

**Lease monitor** (`land-0900/lease-mon.sh`), lock `dispatch-cwd--66306-2381103-1792461420784626270.lock`:

```
b: 08:57:19.700 kernel held, record absent, tip 585044f19   controller holds the lease
   08:57:21.639 record present (linux-gate)                 declared before the agent worked
   08:57:34.067 record absent, kernel free, tip 21eec5e15   commit, handoff, release in one sample
c: 08:57:34.487 kernel held -> 08:57:35.695 record present -> 08:57:47.912 tip 9fa8d403f -> 08:57:48.084 record absent, kernel free
```

**Cooperative termination.** Both writing runs completed within their deadline, so no borrowed Git child was signalled. Neither left an `index.lock`, and doctor `git-native-locks` reports none. The deadline path itself was proven by the `--ignored` bwrap test (step 6).

**Git 06 and typed operations are dormant.** After the landing and all smokes, the only new Git WAL operation under the common git dir's `fgos/git/operations/` is the smoke `worktree` create. There is nothing for Land, SafeRestore, Recovery, scoped commit, sync or checkpoint. `fgos list` works, and `fgos events` is still an unknown verb.

**Cleanup.** The smoke worktree was removed through the Worktree port (`remove`, non-force, with `FGOS_HOST_BIN` set) with `{"removed":true}`, and branch `smoke/git06-lease` was deleted (tip `9fa8d403f`). The build worktree `land-0900/wt` was removed with non-force `git worktree remove`. The lease monitor was stopped. No fgOS process is left.

## Findings

- No landing-caused bug.
- `wt-remove.mjs` prints `worktree-cwd-unreadable` warnings for `(sd-pam)` and `ssh-agent`. These are advisory only; the remove succeeded.

## Rollback (not used)

`/home/vantt/.claude/jobs/e1505f04/tmp/land-0900/rollback.sh` runs these steps:

1. Run the stop check.
2. `fgctl upgrade --from ~/.local/state/fgos/releases/sha256:42baabb6…`.
3. Restore `.fgos/distribution.json`.
4. `git checkout -- .fgos/config.json`.
5. Restore the global config backup.
6. Verify the hashes and `git fetch`.

Restore `fgctl` from `fgctl.prev` only if `fgctl` itself is the problem. Nothing dormant ran, so there is no Land, SafeRestore or Recovery state to undo; the WAL and lease records stay, and the older release reads them.

No component-boundary change.
