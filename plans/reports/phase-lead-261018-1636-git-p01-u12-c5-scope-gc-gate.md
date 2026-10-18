# Git phase 01, unit 12: scoped C5 and drained GC

C5 now calls the existing quiesce scan with an additive workspace-only mode. Membership uses cwd or resolved execution-root arguments (`--dir`, `--worktree`, `--cwd`, `-C`), including linked worktrees. A payload name or machine-wide pinned state root alone cannot block another workspace. An attributed candidate with unreadable argv increments the incomplete-scan count; unavailable host enumeration still refuses. The default stop-everything scan is unchanged. Git and activation contracts document the distinction.

The real controller test retains same-workspace writer refusal, adds refusal for a writer directed into the fixture from another cwd, and activates successfully while an unrelated long-lived Node `fgos.mjs run --dir <other>` process remains alive. The sandbox exercises the existing unavailable-host-scan refusal branch; the coordinator must rerun these live-writer branches on the host. A sandbox-executable unit test covers execution-root arguments and payload-name exclusion.

The GC gate now expects success under the refined holder-lock rule. Its real-Git vector keeps the lock inode for independent free-probe and empty-holder assertions, and Linux additionally asserts no live process remains in the GC repository. The vector no longer rejects successfully killed/drained GC leftovers; command-exit, free-probe, sibling and other vector assertions remain. No cleanup driver or kill/wait rule changed.

Reused the controller admission, process facts, linked-worktree discovery and borrow vectors. Prior-art history points to `d1d4ec7ee` and `af932e76c`; no removed mechanism was restored. Impact-analysis: inactive (zero providers). No new config default, dependency, environment switch, lifecycle mutation, staging or commit.

Verification: required four-crate locked Rust suite passes (191 passed, one existing ignored harness); all-target Clippy with `-D warnings` passes. `git diff --check` passes. Logs are under `/tmp/fgos-work/git-p01-u12/`. Markdown previews were attempted; MDView refuses writes to its read-only database. The explicit assignment report path takes precedence over the convention generator's current timestamp. The coordinator owns the out-of-scope CHANGELOG entry and program-board row.

Status: DONE_WITH_CONCERNS
Summary: Scoped C5 predecessor admission and aligned the GC gate with successful cleanup, with regression coverage.
Concerns/Blockers: Host live-writer branches require the coordinator rerun; CHANGELOG and program-board updates are outside this unit's write scope.
Context refs:
- (none)
