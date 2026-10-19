# Git 03 + 04 landed on the second machine (stop-everything)

Date 2026-10-19, 15:11–15:39 (Asia/Saigon), second machine (`~/projects/forgent`), session `ac420727`. Follows [the 10:51 landing](landing-261019-1051-latest-main-this-machine.md) and the stop-everything rule of [Git phase 04](../261018-0914-git-component-fgos-git/phase-04-custody-lease-and-successor-admission.md) (an older controller commits with no lease and leaves no predecessor record).

**Outcome: landed and kept.** Release `sha256:f4f505d9a37f9659601be7302e1f18e0c46044c4af5e641bc7420ca989a3b977` is active (previous `8c096e8f…`); `fgctl verify` passes. Built from origin/main `d2442cfb4`.

## What is new against the previous release here

- **Git phase 04:** the custody lease (`dispatch-cwd`, rank 30) is held by the controller from producer start through the runner commit, receipt and handoff. Every writing envelope declares its domain in `<lock>.predecessor.json` before the agent starts. A successor is admitted only after a recorded handoff or over a provably empty `linux-gate`/`windows-job` domain. Runner commit git children borrow the lease.
- **Git phase 03:** the Worktree port, the `fgos worktree create` verb and the doctor row `git-worktree-recovery`.
- **ES phase 07:** sync/status/export verbs and doctor checks, all dormant (no doctor row is registered yet; phase 09 registers them).
- The custody lock-key fix `d2442cfb4` (the custody probe keys the lease exactly as the lock registry does).

## Steps as run

1. **Quiesce:** no `fgos`, `fgctl`, supervisor, gate or gateway process; no file open under `.fgos/` or the state root. No leftover pane of ours. The other herdr panes are interactive user sessions (mdview, skillhub, and three claude sessions in forgent), none holding fgOS files. They were left alone and excluded from fencing by cwd.
2. **Old-release `fgos doctor --fix`:** `run-attempts-stuck` adopted 0. It regenerated `docs/decisions/index.md` lossily, so the file was restored with `git checkout`.
3. **Predecessor records before activation:** none on any `dispatch-cwd` lock of this workspace or its worktrees (`.fgos/locks`, 22 `dispatch-cwd` lock files). The only `dispatch-cwd` records on the machine are four under `/var/tmp/fgos-test-fixtures-OCLI6X/` (test fixtures, not a workspace). The per-attempt `attempt.lock.predecessor.json` records of old units are attempt locks, not custody.
4. **Main checkout:** `git pull --ff-only` to `d2442cfb4` before activation, so the checkout matches the release. The other session's WIP (`.claude/settings.json`, `AGENTS.md`) was untouched.
5. **Build:** a clean detached worktree of origin/main at `/home/vantt/.claude/jobs/e1505f04/tmp/land4/wt` with its own fresh Cargo target dir (`land4/tgt`); `cargo build --locked --release --workspace`, then `scripts/build-rust-distribution.mjs`: 759 staged files with `libexec/native/fgos.node`. The scripts are in `land4/` (`prep.sh`, `land.sh`, `rollback.sh`, `stopcheck.sh`, `fence.mjs`, `lease-mon.sh`, `wt-remove.mjs`).
6. **fgctl:** reinstalled from the same worktree (sha256 `4ff2f601…`); previous hash in the backup.
7. **Activation:** `fgctl stage` and `fgctl upgrade --from <tree>`; `.fgos/distribution.json` restored. A hash check confirmed that `AGENTS.md`, `.claude/settings.json`, `CLAUDE.md` and both configs were not changed.
8. **Fences:** `fixLockFences` from the new payload, run from `/tmp`: 4 placed after activation, 8 more for the smoke units; `lock-fences` reports all paths fenced.
9. **`fgos setup`:** exit 0, no config keys added. It again regenerated `docs/decisions/index.md` lossily (6 lines dropped); restored.
10. **Git remote:** fetch refspecs unchanged (`+refs/heads/*`, `+refs/fgos/events/*`, glob `+refs/fgos/legacy*`); `git fetch origin` exits 0.

Backups: `.fgos/runtime/tmp/landing-git-03-04-this-machine/` (`global-config.json` mode 600, `project-config.json`, `distribution.json.main`, `before.sha`, `fetch-refspecs.before`, `fgctl.prev`, doctor and smoke outputs). No config value was printed.

## Doctor through the shim

| Check | Result |
|---|---|
| `git-component-compatible` | pass (addon 0.2.0, napi 8; gitPort 1, receipt 1, walRecord 1, eventStore 4) |
| `git-transport-config` | pass (no repository-local transport settings) |
| `git-worktree-recovery` (new) | pass, advisory issues only: `git-p03`, `git-p04` and the build worktrees reported `dirty-or-stale-checkout-preserved` |
| `git-trust-topology`, `git-operation-journal` (0 pending), `git-native-locks`, `git-publication-refspecs`, `git-durability-capability` | pass |
| `run-attempts-stuck` / `legacy-attempts-stuck` / `cancel-wait` | pass (279 open, none stuck / none / 15000 default) |
| `units-awaiting-resume` | warning: the old abandoned unit `unit-run-1792328096425-79e2470b` (unchanged) |
| `lock-kernel-semantics`, `lock-borrow-vectors`, `lock-holders` (0 held), `lock-fences`, `lock-record-unreadable`, `lock-predecessor-kill-wait`, `state-root` | pass |
| `confinement-orphaned-resources-reaped`, `credential-copies-retained` | pass |
| ES 07 rows | not registered (dormant until ES phase 09) |
| `active-release-matches-checkout` | fail: changed=0, 4 missing, all under the git-ignored `.agents/skills/instruction-audit/` (same as every landing here) |

Total 140 checks (139 plus `git-worktree-recovery`). The same 10 rows fail as at 10:51: the row above plus `model-policy-tier-coverage`, `tool-registry-configured`, `work-step-vocabulary`, `decision-index-stale`, `doc-current-path-missing`, `doc-source-conservation`, `executor-profile-warnings`, `confined-pane-accounts`, `agent-cli-project-trusted`. A rerun after the smokes gave the same result.

## Smokes on the new release

A monitor (`land4/lease-mon.sh`) polled the throwaway worktree's lease every 100 ms. It read the predecessor record, the kernel `flock` entry in `/proc/locks` and the branch tip. Lock file: `.fgos/locks/dispatch-cwd--66306-1464692-1792397960065454979.lock` (the key now carries the cwd birth time).

| Smoke | Unit | Result |
|---|---|---|
| a. read-only claude via herdr | `unit-run-1792397933768-2beb038a` | pass, adapter `herdr-spawn` ("README.md has 205 lines") |
| Throwaway worktree | `fgos worktree create .claude/worktrees/smoke-git04 --branch smoke/git04-lease --base origin/main` | created and registered; worker `.fgos` stripped |
| b0. writing run (first try) | `unit-run-1792397997923-577e7707` | Stalled. The agent wrote `result-1.json` with a raw newline inside `summary` (invalid JSON), so the terminal supervisor never saw a complete result. The lease stayed held and the record stayed present for the whole stall. SIGINT gave exit 130 and a `cancelled` receipt; the kernel lease was released and the `linux-gate` record kept. |
| d1. resume of b0 | same unit, `runs/02` (`supersedesRunId` = attempt 01) | The successor was **admitted over the dead-gate record** (15:31:33), declared its own record (15:31:35) and **cleared it at settle** (15:32:20). Outcome `verdict-inconclusive` (exit 11), no commit: attempt 01 had already written the file, so it was attributed as pre-launch. This is an artifact of the smoke design. |
| **b. writing run** | `unit-run-1792398764667-46a42fe4` | **pass, committed `88fd9a9d8` on `smoke/git04-lease`.** Timeline below. |
| **c. second writing run, same worktree** | `unit-run-1792398815411-f2eb0bbf` | **pass, admitted after the recorded handoff, committed `b3c6e14b8`.** Record declared at 15:33:37, new tip at 15:33:50.9, record cleared at 15:33:51.09. |
| d. 6.4 Ctrl-C and resume (read-only, 60 s wait) | `unit-run-1792398842213-dd80544c` | SIGINT after 25 s: exit 130, `chờ resume`, attempt 01 receipt `cancelled`. `fgos run --resume`: `runs/02` with `supersedesRunId` = attempt 01, outcome `pass`. |
| e. codex via herdr, account `tetnu` | `unit-run-1792398963486-fa4926f9` | pass, invocation `codex-herdr` ("README.md contains 205 lines") |

**Lease through commit and handoff (smoke b):**

```
15:32:44.652 rec=absent   kernel=[FLOCK/WRITE]  tip=d2442cfb4   controller acquired the lease
15:32:46.435 rec=present  linux-gate pid 3094680  kernel held   domain declared before the agent
15:33:21.609 gate-exit.json, 15:33:21.646 receipt.json, 15:33:21.839 result.json
15:33:22.516 rec=present  kernel held  tip=88fd9a9d8           runner commit landed under the lease
15:33:22.667 rec=absent   kernel=[]                             recorded handoff, then release
```

The gate exited (and the supervisor released its copy) about 0.9 s before the commit tip appeared, and the kernel lock was still held then, so the controller held custody through the runner commit. Smoke c shows one sample (15:33:50.949) with the record present and the kernel entry gone. That comes from the monitor's read order inside one tick (record first, then `/proc/locks`) and is consistent with clear-then-release.

**Cleanup:**

- The throwaway worktree was removed through the Worktree port (`remove`, non-force, under worktree-admin). The first try was refused with `worktree-dirty-preserved` because attempt 01's untracked file was still there. After that one file was deleted, `{"removed":true}`. The local branch `smoke/git04-lease` was deleted afterwards (tip `b3c6e14b8`).
- The retained panes of the two cancelled attempts (`w6:p7P`, `w6:p7T`) were closed.
- The build worktree `land4/wt` and the stale `land2/wt` from the 09:14 landing were removed with non-force `git worktree remove`; both were clean. The port refuses them with `worktree-worker-state-preserved` because plain `git worktree add` keeps the tracked `.fgos` state. The release stays in the state root.

## Findings

- **Invalid result JSON stalls a terminal round until idle.** `FsOutbox::newest_complete` (`packages/agent-protocol/rust/src/terminal/mod.rs`) treats an unparseable `result-N.json` as "not yet complete". A claude agent that put a commit-style two-line summary into the JSON string therefore stalled the round until SIGINT; otherwise it would have stalled until `idleMs` (90 min). The lease was held throughout, which is correct, but a writing worktree stays blocked that long. This predates Git 04. Candidate item: a result file that stays unparseable after the agent goes idle should end the round as a failed claim.
- **Resume after a writing attempt is cancelled.** Files written by the cancelled attempt count as pre-launch for the resumed attempt, so a resume that finds the work already done ends `verdict-inconclusive` without a commit.
- **Foreign commit during the landing:** `68b1496d8` "docs(plan): record the go-ahead for the next workflow case phases" (board only), authored and committed as `Test <test@example.com>` at 15:19:35 by another session on this machine, and pushed. It ran no fgOS process and does not affect the release, but the author identity looks like a test fixture's git config leaking into a real commit.

## Rollback (not used)

`/home/vantt/.claude/jobs/e1505f04/tmp/land4/rollback.sh` runs these steps:

1. Run the stop check.
2. `fgctl upgrade --from` the stored `8c096e8f…` release.
3. Restore `.fgos/distribution.json`.
4. `git checkout -- .fgos/config.json`.
5. Restore the global config backup.
6. Verify the hashes and `git fetch`.

A predecessor record left on a lease file is judged by holder-lock as before, by the older release too. An older release commits without a lease, so a rollback is also a stop-everything step.

No component-boundary change.
