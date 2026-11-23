# Phase 1: built, reviewed, parked on a foreign land recovery

## Outcome

Phase 1 is complete on branch `runner-recheck-replays-account-view/p01b` (tip `7d3b31a03`, three commits on top of
`679653af8`: `a9e1d56c2`, `ea01f0340`, `4f5030dad`, `7d3b31a03`). It has not landed. `fgos land` refused at
"fast-forward main" with `resource-recovery-required`. `fgos git status` shows a pending `Land` operation
`land-3689269-1795400075015143607-2` (writer `3689246`, started about 09:14) that is not this lead's. `fgos git recover`
settles a chain only for the writer that started it, so this lead cannot clear it. `main` is unchanged
(`104621244`), and the branch is not on it.

## What ran

| Ticket / unit | Provider | Result |
|---|---|---|
| c-1418 | (bound deepseek) | refused by the very bug this plan fixes: recheck recomputed gemini |
| c-2053 / unit-run-1795397475407 | claude | blocked: headless sandbox cannot run cargo; reverted its edits |
| c-3196 / unit-run-1795397599763 | deepseek | execution-failure (infra, nonzero exit after ~10 min, no edits) |
| c-5527 / unit-run-1795398259512 | glm | execution-failure (infra, nonzero exit, no edits) |
| c-7177 / unit-run-1795399361510 | claude (supervisor order 09:01) | blocked: wrote steps 1-4, 6, 7 uncommitted; no cargo |
| c-15753 / unit-run-1795399624536 | claude | pass, `a9e1d56c2` (Rust-owned vectors + driver, placeholder digests) |
| c-17064 / unit-run-1795399851614 | claude | pass, `ea01f0340` (driver reuses the gate's `replay_bind`; past timestamps) |
| c-21323 / unit-run-1795400016608 | claude | blocked: cannot read the sibling worktree |
| c-21769 / unit-run-1795400059508 | claude, worktree p01b | pass, `4f5030dad` (implementation + real digests + `unit.writes`) |
| c-52461 / unit-run-1795404630513 | claude | pass, `7d3b31a03` (review nits: refusal wording; digest check before a refused recompute) |
| c-54955 | land | failed `resource-recovery-required` |

Why p01b: files left dirty by the blocked claude round are `excluded` from every later commit in that worktree
(evidence `attribution.basis: pre-launch-git-status`). So p01 can never commit them. Its uncommitted copy is
byte-identical to what `4f5030dad` committed (checked with `cmp`). Worktree p01 still holds those dirty files and is
handed to the supervisor.

## Proof

- `cargo test -p fgos-execution-engine --test assignment_runner`: 28 passed, including the three `rust-owned:` cases.
  (a) is accepted with `quarantinedUntil` 1700000600000, which is earlier than the wall clock, so the recheck does
  not read the live clock. (b) is refused with `binding-replay-account-view-mismatch`, and (c) with
  `binding-replay-account-view-missing`.
- `cargo test -p fgos-execution-engine --test unit_run`: 44 passed (accountState recorded for a non-empty overlay,
  absent for an empty one).
- Digests came from the real bind. The driver's `assert_eq!` against `replay_bind` printed them, and they were never
  written by hand. The honest digest reproduced, as the risk note required.
- Review (code-reviewer subagent on `origin/main...HEAD`): no blocking findings. Nits 1-2 are fixed in `7d3b31a03`.
  Nits 3-5 are not acted on: top-level emptiness of the overlay, no end-to-end run-time digest proof beyond the
  shared facade, and `replay_bind` being `pub` for the driver.
- `cargo test --workspace` was **not** completed. Two attempts were killed: the first by OOM (SIGKILL in rustc/ld),
  the second stopped by the harness for low system memory (about 1 GB available). The land gate has to supply it.
  `npm test` was not run, for the same reason.

## Handed to the supervisor

- The foreign pending Land `land-3689269-1795400075015143607-2` blocks every land to `main`, including this plan's.
  Its writer, or the owner with `fgos git recover`, has to settle it.
- Worktree kept: `/home/vantt/projects/forgent-worktrees/261123-0821-runner-recheck-replays-account-view-p01`
  (dirty with the same 8 files already committed on p01b; safe to discard).
- Executor finding: the claude headless invocation cannot run cargo, python, perl or `git checkout` (approval
  required). deepseek and glm exited nonzero mid-run (infra). That limits every Rust writing unit until it is fixed.
- Resume: once main is free, `fgos land runner-recheck-replays-account-view/p01b`, then phase 2.
