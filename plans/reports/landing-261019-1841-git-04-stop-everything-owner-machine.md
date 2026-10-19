# Owner machine: Git 04 stop-everything landing (with Git 03, ES 07, 6.4 fixes, MP-B2 p06, AGENT-WF 00–04)

Date 2026-10-19 18:22–18:41 (Asia/Saigon), session `forgentx-95`. The owner authorized the landing at 18:22 ("về git 04, em có thể land khi nào rảnh"). Followed [the second machine's guide](guide-261019-1539-owner-machine-git-04-stop-everything-landing.md).

## What is active now

- Release `sha256:14439416373970cd49a5b7af0aad5ae0d4061ff388b4a181ddc3380bce14302b`, built from main `9a2d111b5` in a clean detached worktree with its own Cargo dir; 760 staged files, `libexec/native/fgos.node` present.
- Active in mdview, mcp-skill-hub and forgentX.
- Contents beyond the previous release `4591f097…` (main `f85fc7d3f`): Git 03 (Worktree port, `fgos worktree create`, `git-worktree-recovery`), Git 04 (custody lease through commit/receipt/handoff), ES 07 (dormant), 6.4 follow-ups (`617b0fdbb`), MP-B2 phase 06, the B1–B7 landing fixes, the test identity-leak guard, AGENT-WF phases 00–04 (ledger hardening, `--plan` retired, guide schema).
- `fgctl` reinstalled from the same tree (`24349a4b…`); previous copy `.fgos/runtime/landing-git04/fgctl.prev` (`b461e9d1…`).
- Rollback target: `4591f097…` (still in `~/.local/state/fgos/releases`). Backups (`distribution.json`, fetch lines, config hashes, activation, `~/.fgos/config.json`): `.fgos/runtime/landing-git04/backup/`.

## Steps as run

1. Quiesce: no fgOS controller, supervisor, gate or gateway process; no fgOS agent pane; no process with a file open under any `.fgos/` or `~/.local/state/fgos`. Lead `wf-p05-06` paused its test runs; peer session `forgentx-5f` started nothing new (its 6 read-only reviewers in `forgentX-s8-review` do not use the release).
2. `/tmp/fgos-confinement`: 24 homes; doctor `confinement-orphaned-resources-reaped` passed before and after.
3. Old-release `doctor --fix`: `run-attempts-stuck` none stuck in all three, `lock-holders` 0 held. forgentX `docs/decisions/index.md` came back with only the old header line; restored.
4. No `.fgos/locks/*.predecessor.json` in any workspace or worktree.
5. Backups as above.
6. Build: `cargo build --locked --release --workspace`, `scripts/build-rust-distribution.mjs`, `cargo install` of `fgctl`.
7. `fgctl stage` + `fgctl upgrade` in mdview → mcp-skill-hub → forgentX; `distribution.json` restored; config hashes unchanged; `fgctl verify` ok.
8–10. New-release `doctor --fix` (fences) and `fgos setup` in each: exit 0, `Git WAL initialized and trusted`, no fetch mapping change; fetch lines identical to the backup; `git fetch origin` exit 0; `git pull --ff-only` ok; decisions index untouched.
11. Doctor through the shim: every required Git, 6.4 and lock row passes in all three, plus `state-root` and forgentX `active-release-matches-checkout`. One exception, below. Every other failing row is the same set that failed under the old release (owner config: model/tier coverage, provider capacity, executor profile, tool registry, doc conservation; forgentX also `work-step-vocabulary`, `root-drift`, `main-checkout-guard-warnings`, `doc-current-path-missing`).
12. Smokes in forgentX, all **pass**:
    - a. claude read-only through herdr: `unit-run-1792409635831-d4e24a28`.
    - b. Writing run in `fgos worktree create`d `.claude/worktrees/smoke-git04`: `unit-run-1792409674366-18bf89ab`, `commit.status` committed `f6d5e0e7f`. Monitor (100 ms): kernel lock held 18:34:34.4 → record present 18:34:35.1 (before the agent worked) → branch tip moved 18:34:51.1 while still held → record gone and kernel lock released 18:34:51.2.
    - c. Second writing run in the same worktree: `unit-run-1792409717164-ee490b64`, committed `1f19e7078`; record `domainKind: linux-gate`; ended with the record and kernel entry gone.
    - d. Ctrl-C/resume: `unit-run-1792409843820-1152b6d5` SIGINT at 25 s → exit 130, `chờ resume`, attempt 01 receipt `cancelled`; `fgos run --resume` → exit 0, `runs/02` outcome pass, `supersedesRunId` = attempt 01. Retained pane `wS:p5XD` closed.
    - e. codex read-only through herdr (account `tetnu`): `unit-run-1792409963048-817c996e`.
    - Cleanup: smoke worktree removed through the Worktree port (`remove` with `expectedTip` = `deliveredTo` = branch tip, `evidenceDigest` = sha256 of the smoke-c result) → `removed: true`; branch `smoke/git04-lease` deleted. Build worktree removed with non-force `git worktree remove`.

## Findings

- **`git-worktree-recovery` fails in forgentX on Claude Code's own worktree locks.** The three `locked-registration` issues are `.claude/worktrees/agent-*` locked by this Claude Code session (`locked claude agent … (pid 1087187 …)`): one running lead (`wf-p05-06`) and two finished leads. The other 21 issues are advisory `dirty-or-stale-checkout-preserved`. A harness lock with a live pid is not a broken registration; the row should probably treat a lock whose reason names a live process as advisory. Not a landing blocker. Owner of the row: lane GIT.
- **Smoke d needs SIGINT restored.** A background job in a non-interactive shell ignores SIGINT, so `kill -INT` on `fgos run … &` is never seen and the run finishes (first try `unit-run-1792409747094-19addbc3` passed uninterrupted). The working recipe spawns the shim with SIGINT reset to default (Python `preexec_fn`). Test-recipe note only.
- **Release order in smoke c.** One 100 ms sample saw the kernel entry gone while the record was still present (smoke b saw both go in one sample). Both runs ended clean and the successor was admitted. Recorded for lane GIT to confirm the intended order (record removal vs unlock); no behavior problem observed.
- `fgos worktree` exposes only `create`; removal needed a small script against the port (`.fgos/runtime/landing-git04/wt-remove.mjs`), as on the second machine. RUL104 idea for the owner list, not done: a `fgos worktree remove` verb.

## Unresolved

- Whether `git-worktree-recovery` should accept harness-held locks (lane GIT).
