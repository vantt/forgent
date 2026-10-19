# Git phase 01 with 6.4: re-landing on the second machine

Date 2026-10-19, 08:58–09:15 (Asia/Saigon), second machine (`~/projects/forgent`), session `ac420727`. Follows the [rolled-back landing at 06:59](landing-261019-0659-git-publication-and-controller-death-this-machine.md). Both blocking defects are fixed on main by `8573c8b34` (fetch mapping in the glob form `+refs/fgos/legacy*:…`, from one Rust source; setup repairs an obsolete exact line and tightens the driver directories), plus the `eventStore.remote` default.

**Outcome: landed and kept.** Release `sha256:8d4b216e4d8807035d015370d075c14a489faf89f23b9b2bb571576f90849046` is active; `fgctl verify` passes. Plain `git fetch origin` and `git pull --ff-only` work afterwards.

## What ran

- **Quiesce:** no `fgos`, `fgctl` or gateway process and no file open under `.fgos/` or the state root. Our own leftovers were stopped:
  - herdr pane `w6:p68`, whose cwd was the deleted worktree `es-p04-review` (closed with `herdr pane close`);
  - orphaned test processes from an aborted test rerun of this session (SIGTERM).
  - Idle Claude sessions of other panes were left alone and excluded from fencing by pid.
- **Old release (`f88afb17…`) before activation:** `run-attempts-stuck` clean (279 open, none stuck). No version-1 pane home left; `/tmp/fgos-confinement` held only three version-2 homes with no user, which the new doctor reports as reaped.
- **Release:** `origin/main` `af1f2db2b` (carries Git 01 with its landing fixes, 6.4, 6.3, and the dormant ES 06 facade; not Git 02, not Git 04), detached worktree `/home/vantt/.claude/jobs/e1505f04/tmp/land2/wt`, `cargo build --locked --release --workspace` then `scripts/build-rust-distribution.mjs`: 744 files with `libexec/native/fgos.node`. A clean rebuild of the whole release profile produced the same digest.
- **fgctl:** reinstalled from the same worktree (sha256 `ed821504…`); the previous binary is `.fgos/runtime/tmp/landing-git-01-relanding-this-machine/fgctl.prev`.
- **Activation:** `fgctl stage` and `fgctl upgrade --from <tree>` exit 0, previous release `f88afb17…`. `.fgos/distribution.json` restored; `AGENTS.md`, `.claude/settings.json`, `CLAUDE.md`, `.fgos/config.json` unchanged by the activation (hash check).
- **Fences:** `fixLockFences` from the new payload, run from `/tmp`: 11 placed after activation, 3 more for the smoke units; `lock-fences` 354/354.
- **`fgos setup`:** exit 0, first run. `git-driver-directories`: "current-user-owned and safely permissioned" (state root already 0755 from the earlier landing; the fix now tightens it itself). `git-wal-dir`: "Git WAL initialized and trusted". Setup also wrote two config defaults to `.fgos/config.json` (`runner.capabilities.docs:write`, `eventStore.remote: "origin"`), committed with this report. It regenerated `docs/decisions/index.md` from this machine's event log, which lacks D-ADR0056; restored with `git checkout`, as before.
- **Git remote after setup:**

  ```text
  +refs/heads/*:refs/remotes/origin/*
  +refs/fgos/events/*:refs/fgos/remotes/origin/events/*
  +refs/fgos/legacy*:refs/fgos/remotes/origin/legacy*
  ```

  No exact `refs/fgos/legacy` line. `git fetch origin` exit 0; `git pull --ff-only` fast-forwarded main `9d1352bfd..af1f2db2b`.

## Doctor through the shim (new release)

| Check | Result |
|---|---|
| `git-component-compatible` | pass (napi 8; gitPort 1, receipt 1, walRecord 1, eventStore 4; floor 2.53.0, all probes) |
| `git-trust-topology` | pass (files refs, no shallow, alternates or promisor) |
| `git-operation-journal` | pass (initialized, complete, 0 pending) |
| `git-native-locks` | pass |
| `git-publication-refspecs` | pass (the three lines above) |
| `git-durability-capability` | pass (process-crash; file and parent sync) |
| `git-driver-directories` | setup fix row, unchanged (already safe); no doctor row of its own, the six Git rows would fail with `untrusted-driver-directory` otherwise |
| `run-attempts-stuck` / `legacy-attempts-stuck` | pass (279 open, none stuck / none left) |
| `units-awaiting-resume` | warning: the abandoned ES review unit `unit-run-1792328096425-79e2470b` (from 06:59, harmless) |
| `cancel-wait` | pass (15000 default) |
| `lock-kernel-semantics`, `lock-borrow-vectors`, `lock-holders`, `lock-fences`, `lock-record-unreadable`, `lock-predecessor-kill-wait`, `state-root` | pass |
| `confinement-orphaned-resources-reaped` | pass |
| `active-release-matches-checkout` | fail: changed=0, 4 missing, all under the git-ignored `.agents/skills/instruction-audit/` (same as every landing here) |

Total 138 checks, 10 failing. The others are the known owner-config set: `model-policy-tier-coverage`, `tool-registry-configured`, `work-step-vocabulary`, `decision-index-stale`, `doc-current-path-missing`, `doc-source-conservation`, `executor-profile-warnings`, `agent-cli-project-trusted`, `confined-pane-accounts`.

## Smoke (this workspace, read-only, no work item)

- **Read-only `fgos run --provider claude`:** `unit-run-1792375876430-02f296df`, adapter `herdr-spawn`, unit outcome `pass` ("README.md has 205 lines"), pane closed.
- **6.4 interrupt and resume:** `unit-run-1792375899401-2e641716`. SIGINT to the controller after 25 s: exit 130 with `chờ resume: fgos run --resume …`, receipt `cancelled`. `fgos run --resume`: `runs/02` with `supersedesRunId` = attempt 01, `unit-summary.json` outcome `pass`. The retained pane `w6:p77` of attempt 01 was closed by hand, as at 06:59.

## Rollback (not used)

`/home/vantt/.claude/jobs/e1505f04/tmp/land2/rollback.sh`: stop check, `fgctl upgrade --from .fgos/runtime/tmp/landing-6.5-6.2-this-machine/tree` (`f88afb17…`), restore `.fgos/distribution.json`, remove every `+refs/fgos/…` fetch line, `git checkout -- .fgos/config.json`, verify hashes and `git fetch`. Backups: `.fgos/runtime/tmp/landing-git-01-relanding-this-machine/`.

## Notes

- Git phase 02 (`git/p02-scope-refs`) did not pass its host gate this morning and is not on main or in this release (see the board log).
- Shared Cargo caches across worktrees can serve stale crates: Cargo hashes workspace path crates by their relative path, so two worktrees of different content share artifact names. The phase 02 gate first failed to compile its release profile because of this. For landings, either use a cache owned by the release worktree or `cargo clean --release` first; this release was verified by a clean rebuild with an identical digest.

Owner-machine guide: [guide-261019-0914](guide-261019-0914-owner-machine-git-01-landing-after-fixes.md).

No component-boundary change.
