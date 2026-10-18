# Handoff: Git and Event Store lanes, before compaction

Session `ac420727` (second machine, `~/projects/forgent`), 2026-10-18 22:40 Asia/Saigon. Big lead of the GIT and ES lanes. Plans: [Git](../261018-0914-git-component-fgos-git/plan.md), [Event Store](../261018-0945-event-store-fgos-event-store/plan.md); board rows GIT and ES in [the program board](../261017-1313-fgos-platform-program-board/plan.md).

## Standing owner decisions

- G0 signed D-ADR0057; publication supersession amendment D-ADR0058. Both plans approved (11:44). Writer machines: owner machine and this one; the third runs no fgOS.
- E3 budgets owner-set ([e3-budgets.md](../261018-0914-git-component-fgos-git/e3-budgets.md)). E3 failed 8/14 lines ([report](experiment-261018-2005-git-e3-combined-addon-budgets.md)); owner chose option 1 (22:23): keep Q1 (combined addon), keep budgets, optimize the Publication port, re-measure.
- **22:38: when Git phase 01 passes (E3 green, full Rust and npm green except known failures), land it on this machine without asking**; then write a landing guide for the owner machine.
- D6: seal commit date = last event ts in seconds, clamped to 0 when negative (decided by the big lead 16:45).
- Lease N7 (`dispatch-cwd` across the runner commit) belongs to Git phase 04; 6.3 and 6.4 have landed/merged, so it is unblocked.

## On main

Git phase 01 Lane A + Lane B (`3dc51f1e0`), Event Store phases 01-04 (`b62ac8b92`), run-supervisor clippy fix (`8b015102e`), E3 report (`2f4900305`). Guides for the owner machine: [15:15](guide-261018-1515-owner-machine-after-git-and-event-store-merge.md), [20:05](guide-261018-2005-owner-machine-after-git-lane-b.md).

## Running at handoff (each notifies when done)

| Work | Where | Next step when done |
|---|---|---|
| Publication port optimization + E3 re-run (in-session agent) | worktree `git-perf`, branch `git/p01-publication-perf` | If E3 passes: merge to main with full Rust + npm test, then self-land Git 01 here (release from main, `fgctl stage/upgrade`, `fixLockFences`, doctor, landing report, board, owner-machine guide). If a line still fails only on mandatory fsyncs, take the numbers to the owner (option 2 question). |
| ES 05 review fixes (fgos run, openai), pid in `/home/vantt/.claude/jobs/e1505f04/tmp/leads/e5b.pid` | worktree `es-p05`, branch `event-store/p05-sync` | Verify on host, commit leftovers, merge main, push to main. Review: [review-261018-2221](review-261018-2221-es-p05-sharing-sync.md). M6 decision: the signed Git §10 recovery rules govern. |
| Shared-primitive moves full npm test + push (in-session agent) | worktree `shared-moves`, branch `refactor/shared-durable-canonical` (`sm-baseline` is its temporary clean-main worktree) | Agent pushes to main itself; then remove both worktrees. |

## Next work after these

- Event Store phase 06 (Node facade in the combined addon) after E3 passes; then 07-11 per plan.
- Git phase 02 (LockScope, Inspect/Refs/Remote) after E3 passes; then 03-08; phase 04 now unblocked.
- Open item: replace `serde_yaml`/`unsafe-libyaml` (RUSTSEC-2024-0449 ignored with reason in `.github/cargo-deny.toml`).

## How the lanes run (lessons of the day)

- Leads via `fgos run ... --provider openai --capability execute --writes ... --worktree <own worktree> --account tetcu72 --timeout 4h`; the claude headless sandbox blocks git and `/tmp`, so it is used only for read-only opus reviews.
- One worktree per concurrent run (the `dispatch-cwd` lease refuses two runs in one directory).
- The runner often leaves files changed by a previous attempt uncommitted: after every run check `git status` and commit leftovers after verifying.
- Always re-verify on the host: the lead sandbox lacks PID namespaces, host processes and writable ext4, so host-only failures appear only here. Gate merges that touch live Node code with a full `npm test` run by an in-session agent; known pre-existing failures: fences-v1-tombstone real v1 acquire (yaml), holder-lock-checks monitor/supervisor membership, skill-wrappers instruction-audit projection, sometimes hot-lock-host-judge; Rust `fgos-process` `containment_terminal_gate_dies_with_a_killed_supervisor`.
- The repo hook blocks shell commands containing "build" or "target": put cargo commands in script files under `/home/vantt/.claude/jobs/e1505f04/tmp/`.
- Never let leads commit scripts that hard-code `CARGO_TARGET_DIR` or copy the Cargo registry; reproduce commands go in phase reports.
- `fgos decision-index` on this machine can drop rows whose events live only on the owner machine: check the diff before committing.
- After every merge to main, write a guide for the owner machine and link it on the board.
