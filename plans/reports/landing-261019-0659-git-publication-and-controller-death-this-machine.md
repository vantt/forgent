# Git phase 01 and controller death (6.4): landing on the second machine, rolled back

Date 2026-10-19, 06:45–07:05 (Asia/Saigon), on the second machine (`~/projects/forgent`), under the owner's authorization to self-land once E3 passes. E3 passed under the [amended budgets](../261018-0914-git-component-fgos-git/e3-budgets.md) (2026-10-19), last run [experiment-261019-0247](experiment-261019-0247-git-e3-after-release-settle.md). 6.4 joins this landing ([merge report](landing-261018-2156-controller-death-merged-activation-with-git-landing.md)). The release also brings 6.3 (terminal mode) to this machine for the first time.

**Outcome: activated and verified green, then rolled back.** The new `fgos setup` installs the fetch refspec `+refs/fgos/legacy:refs/fgos/remotes/origin/legacy`. That ref does not exist on origin, because the Event Store cutover has not run. With the refspec installed, every plain `git fetch origin` / `git pull` fails with `fatal: couldn't find remote ref refs/fgos/legacy` (exit 128). Any project that activates this release and runs `fgos setup` would lose `git fetch` until its remote carries the ref. The active release here is the previous one again, and `git fetch` works.

## What ran

- **Quiesce:** no `fgos`, `fgctl` or gateway process, and no process with a file open under `.fgos/` or the state root, both before the activation and before the rollback.
  - The idle Claude sessions (cwd in the repo) were excluded from fencing by pid, as in earlier landings.
  - One process was ours and was stopped with SIGTERM: an orphaned `claude` agent (pid 127839, `FGOS_SESSION_ID` = this session) of the ES p04 review run `unit-run-1792328096425-79e2470b`. Its worktree had been deleted and its parent was pid 1. Doctor now lists that unit under `units-awaiting-resume` (warning only). Nobody needs to resume it.
- **Pre-activation (6.3 P09A step 2):** with the old release active, `run-attempts-stuck` was clean (271 open, none stuck).
  - One version-1 pane home was removed by hand: `/tmp/fgos-confinement/disp_1792350279436_8ea8ac2d`, codex account `tetcu72`.
  - Why it was safe to remove: its run `unit-run-1792350279033-117385f9` was settled, its pane `w6:p6N` was gone and its binder pid was dead. No process used the home, and its `auth.json` was byte-identical to `~/.codex-tetcu72/auth.json`, so there was nothing to write back.
  - Its owner marker is kept at `.fgos/runtime/tmp/landing-git-01-6.4-this-machine/removed-v1-home-owner.json`.
- **Release:** built from `origin/main` `66e485e91` in a clean detached worktree (`cargo build --locked --release --workspace`, then `scripts/build-rust-distribution.mjs`). The result is `sha256:ec7b751d3d6b6bf0d15b1e9371ba73c87bc59688aea34d62289759bee1e81aeb`, 731 files, and it carries `libexec/native/fgos.node`.
- **fgctl:** reinstalled from the same worktree. Its sha256 is now `38e4d884…`; the previous binary is at `.fgos/runtime/tmp/landing-git-01-6.4-this-machine/fgctl.prev`.
- **Activation:** `fgctl stage` and `fgctl upgrade --from <tree>` both exited 0, with `f88afb17…` as the previous release.
  - `.fgos/distribution.json` was restored.
  - The other sessions' files (`AGENTS.md`, `.claude/settings.json`, `CLAUDE.md`) have the same hashes before and after.
- **Git floor:** git 2.53.0 on this host.
- **`fgos setup` (first run):** exit 0, but both Git fixes were refused with `untrusted-driver-directory`.
  - Cause: the state root `~/.local/state/fgos` had mode 0775. With umask 002, the directory was created group-writable, and `packages/git/rust/src/driver.rs` `trusted_directory` refuses any mode with `& 0o022`.
  - I ran `chmod 0755 ~/.local/state/fgos` (the old mode is saved in `state-root-mode.before`). After that, the second `fgos setup` initialized the Git WAL and installed the two fetch mappings.
  - Nothing in setup or doctor creates or tightens the state root, so every machine with umask 002 hits this.
- **Fences:** `fixLockFences` from the new payload, run from `/tmp`: 63 placed, `lock-fences` 339/339.

## Doctor through the shim (new release)

| Check | Result |
|---|---|
| `git-component-compatible` | pass (napi 8; contracts gitPort 1, receipt 1, walRecord 1, eventStore 4; floor 2.53.0, all probes) |
| `git-trust-topology` | pass (files refs, no shallow, no alternates, no promisor) |
| `git-operation-journal` | pass (initialized, complete, 0 pending) |
| `git-native-locks` | pass |
| `git-publication-refspecs` | pass |
| `git-durability-capability` | pass (process-crash; file and parent sync) |
| `run-attempts-stuck` / `legacy-attempts-stuck` | pass (271 open, none stuck / none left) |
| `units-awaiting-resume` | warning: the abandoned ES review unit above |
| `cancel-wait` | pass (15000 default) |
| `lock-kernel-semantics`, `lock-borrow-vectors`, `lock-holders`, `lock-fences`, `lock-record-unreadable`, `lock-predecessor-kill-wait`, `state-root` | pass |
| `process-containment`, `run-supervisor-route`, `terminal-control`, `writer-identity-resolvable`, `confinement-orphaned-resources-reaped` | pass |
| `active-release-matches-checkout` | fail: changed=0, 4 missing, all under the git-ignored `.agents/skills/instruction-audit/` (same as earlier landings here) |

The other failing checks are the earlier owner-config set: `model-policy-tier-coverage`, `tool-registry-configured`, `work-step-vocabulary`, `decision-index-stale` (this machine's event log lacks D-ADR0056; the regenerated index was restored with `git checkout`), `doc-current-path-missing`, `doc-source-conservation`, `executor-profile-warnings`, `agent-cli-project-trusted`. One check is new to this machine: `confined-pane-accounts` (account `tetnu` declares no `pi` credential source; owner config).

`fgctl verify`: verified `ec7b751d…`.

## Smoke (this workspace, read-only units, no work item)

- **Read-only `fgos run --provider claude`:** `unit-run-1792367812638-9497d8d3`.
  - Outcome `pass` through adapter `herdr-spawn` (terminal mode); the attempt is closed with a receipt.
  - The pane was closed and the confinement home removed.
- **6.4 interrupt and resume:** `unit-run-1792367843337-b949a322`.
  - SIGINT to the controller after 25 s: exit 130, with the line `chờ resume: fgos run --resume …`, and receipt `cancelled` synthesized by the supervisor.
  - `fgos run --resume`: `runs/02` with `supersedesRunId` = attempt 01, outcome `pass`, and `unit-summary.json` written. The retained pane `w6:p6Q` of attempt 01 was closed by hand.
- **No writing smoke:** the earlier landings here ran none, and Git phase 01 does not change the runner commit path (that is phase 04).

## Defect found, and the rollback

- **Symptom:** `git fetch origin` fails with exit 128, `fatal: couldn't find remote ref refs/fgos/legacy`. `git fetch origin main` still works.
- **Reproduced on git 2.53** in a scratch repo (`/tmp/fgos-work/refspec-probe`):
  - The exact refspec fails while the ref is absent.
  - The glob form `+refs/fgos/legacy*:refs/fgos/remotes/origin/legacy*` fetches with the ref absent and also with it present.
  - The events wildcard is harmless.
- **Owner of the code:** `src/setup/git-checks.mjs` `FETCH_MAPPING` (installed by `fixGitFetchMapping`), and the doctor row `git-publication-refspecs`, which requires both lines. The ES spec §14 lists the exact refspec, and §18 pushes the ref only at the cutover. So installing the exact mapping before the cutover is a sequencing error between the Git setup and the ES cutover.
- **Rollback (6.4 P07A runbook, adapted to this machine's previous release):**
  1. `run-attempts-stuck` and `legacy-attempts-stuck` were clean on the new release.
  2. Writers were stopped.
  3. `fgctl upgrade --from .fgos/runtime/tmp/landing-6.5-6.2-this-machine/tree` (`f88afb17…`, the previous release). `fgctl verify` passes.
  4. The two fetch lines were removed with `git config --fixed-value --unset`. `remote.origin.fetch` is again only `+refs/heads/*:refs/remotes/origin/*`, and `git fetch origin` works.
  5. `.fgos/config.json` was restored. The new setup had added the description-only `runner.capabilities.docs:write`; the old release does not read it.
  6. 3 fences were placed for the smoke units' `.recovery.lock` paths. The doctor failing set is the same as before the landing.
- **What stays, safe for the old release:**
  - The new `fgctl` (it is not the problem).
  - State root mode 0755.
  - The initialized Git WAL in the common dir (0 pending; the old release does not read it).
  - The two closed smoke units, and the stopped ES review unit (awaiting resume, harmless).
- **Main:** no code was reverted (the defect is in setup, and fixing it is the Git lane's job).

## What has to happen before the next attempt

1. **Git lane:** stop `fgos setup` from installing an exact fetch mapping for a ref the remote may not have. One option is the glob form, proven above. The other is to install `refs/fgos/legacy` only at the cutover; in that case `git-publication-refspecs` must stop requiring it before the cutover. Add a test that a plain `git fetch` keeps working against a remote without `refs/fgos/*`.
2. **Git lane:** make the driver state root's mode part of setup/doctor: setup tightens it, and doctor names it with the fix. Today a umask-002 machine fails all six Git rows with `untrusted-driver-directory` and no hint.
3. Then re-run this landing (the scripts are in `/home/vantt/.claude/jobs/e1505f04/tmp/land/`: `prep.sh`, `land.sh`, `fence.mjs`, `rollback.sh`). The v1-home and stuck-attempt steps are already done.

Owner-machine guide: [guide-261019-0659](guide-261019-0659-owner-machine-git-01-landing.md).

No component-boundary change.
