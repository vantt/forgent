# Handoff: Git and Event Store lanes, second compaction (2026-10-19 17:01)

Session `ac420727` (second machine), big lead of GIT and ES. Previous handoff: [22:38](handoff-261018-2238-git-and-event-store-lanes-before-compact.md). Owner rules in force: self-land on this machine when gates pass (only this session works here); **pull main and read the owner machine's board lines before any new work or landing**; fix every bug found during landings; owner machine lands Git 04 at a time the owner chooses.

## State

| Item | State |
|---|---|
| Git 01 (+6.4), Git 02, Git 03, Git 04 | On main; **landed on this machine** (release `sha256:f4f505d9…`, main `d2442cfb4`, 15:39, [report](landing-261019-1539-git-03-04-stop-everything-this-machine.md)) |
| Owner machine | Release `4591f097…` (Git 01+02, 6.4, COOK, MP-B2, codex door). **Git 04 not landed there**: owner sets the time; guide [here](guide-261019-1539-owner-machine-git-04-stop-everything-landing.md). Any release from main at or after `d49800451` carries Git 04 |
| ES 01-07 | On main (dormant) |
| E3 | Green under owner-amended budgets (changing CAS p95 ≤150/p99 ≤250 ms, measurement condition) |
| Owner decisions today | Decision 1 (E3 budget) and 2 (Git 04 H2 best-effort handoff limitation documented) both per recommendation |

## Running at handoff

| Work | Where | Next |
|---|---|---|
| Git 05 unit 2 (handover reach provenance through Node→addon loan; release builder emits `git-wal-v1`; then the "Before DONE" list) | worktree `git-p05`, branch `git/p05-commit-sync` (unit 1 `0074f94ae`), `fgos run` pid 4073530, pane w6:p84, report `phase-lead-261019-1654-git-p05-u2-handover-reach-and-capability.md` | Rule: never fall back to Reach::Everyone per spawn. Then opus review → fix → host gate (fresh Cargo dir) → main. Git 05 unblocks Git 06, ES 08 commit step, ES cutover |
| ES 08 (migration, rollback export; commit step coded to Git 05's interface, its real-hook test waits for Git 05 on main) | worktree `es-p08`, branch `es/p08-migrate`, pid 353448, pane w6:p85, report `phase-lead-261019-1700-es-p08-migration-rollback.md` | Review → fix → host gate → main |
| Landing-bug integration (B1-B7 from [triage](debug-261019-1631-landing-bugs-triage.md): fix-b1 `f3bd2b342`, fix-b2b5b7 `f5974ff0d`, fix-b3b4 `f3698bf46`, fix-b6 `ea3b111a0`) | in-session agent, worktree `fix-integration`, branch `fix/landing-bugs` | Agent merges the four, runs the full host gate, closes or records the B6 hidden-parent race, finds the holder-lock-checks monitor/supervisor root cause, pushes to main, board line, removes worktrees. These fixes reach runtime at the next landing here |
| Git identity leak (`Test <test@example.com>` on ten owner-machine commits since 13:17) | in-session debugger agent, worktree `fix-identity-leak` | Finds the test writing identity into a real repo config, fixes + guard test, pushes, board line with the owner-machine cleanup command; no history rewrite |

## Done today (beyond the table)

Publication optimization + holder-lock release settle (kernel lock-table evidence, kongming counsel; `/proc/locks` not atomic → probe fallback), Git 01 landing defects fixed (glob legacy refspec, one mapping source; driver directory repair), Git 02 (3 review rounds: pushInsteadOf/http.* refusal, one WAL transfer shape, historical WAL digest compat), Git 03 (live-cwd unreadable = warning), Git 04 (merge with main, verify as custody borrower), custody lock-key fix (Rust used the old dev-ino name → missed live holders), custody reused-inode test (timestamp tick; `ce87c406c`), ES 06/07 with reviews.

## Lessons

- Each worktree gets its own Cargo target dir; a shared cache served stale crates.
- zsh does not word-split `$VAR`: use the bash script `/home/vantt/.claude/jobs/e1505f04/tmp/leads/wait.sh pid…` to wait for leads (ends on first exit or on a pending herdr question).
- `gate3/one.sh` takes `<worktree-name> <log> <tests…>`; a wrong argument order once ran the whole suite and overwrote a test file.
- Leads in codex panes sometimes ask questions: answer with `herdr pane send-keys <pane> shift+left`, then `send-text` + `enter`. A settled-blocked `fgos run` can keep working in its pane; commit its files afterwards.
- `fgos setup`/`doctor` rewrite `docs/decisions/index.md` lossy until B2 lands: restore it with git checkout.
- Lease file name is `dispatch-cwd--<dev>-<ino>-<birthtimeNs>.lock` (realpath); Rust and Node must derive it identically.

## Next after these

Git 06 (Land, SafeRestore, RepositoryConfig, Recovery) after Git 05; ES 09 after ES 08 (also needs 4.3-S landed); next landing here after Git 05 + bug fixes; owner-machine Git 04 landing when the owner says.
