---
id: p-ayxhxswso6
title: "Claude worker units may run cargo, node and npm test: add allowedTools to the claude-cli-bwrap invocation in the standard runner config (runner; source: owner answer to q-qzcq5xti2k, 2026-11-24 23:16)"
status: proposed
priority: P1
area: runner
created: 2026-11-24
---

# Why

Phase 2 of plan 261124-0004-heads-operate-without-owner, and phases 3, 6 and 7 behind it, are blocked: the headless claude worker refuses every cargo command with "This command requires approval", because `claude-cli-bwrap` in `core/config-standard/runner.yaml` starts claude with only `--permission-mode acceptEdits` and no `--allowedTools`. Nobody answers the approval prompt.

The owner agreed to allow cargo and node for claude workers (q-nog2h4wfjm, q-qzcq5xti2k). The project config cannot hold the change: `runner.executors.claude.invocations` is a global-only key (`config-key-out-of-scope … belongs-in=global`), and a global change would apply to every project on the machine. The owner chose to change the standard file (option 2 of that discussion).

# Done when

1. The `claude-cli-bwrap` args in `core/config-standard/runner.yaml` carry `--allowedTools 'Bash(cargo:*)' 'Bash(node:*)' 'Bash(npm test:*)'` (check the `toolGating: allowedTools` field and any schema of the arg list first); no other invocation changes, and the bwrap posture and the declared-writes commit rule stay as they are.
2. The config tests and `fgos config check` pass, and the change is released (or the lead of plan 0004 is told when the activated release carries it).
3. A claude unit in a linked worktree runs `cargo --version` or a cargo test without the approval refusal.
4. Plan 0004's lead is told to sync worktree p02 (66 commits behind main) and rerun phase 2.

# Notes

Footprint: `core/config-standard/runner.yaml` and the tests that read it; check overlaps with the running plan 0004 and draft plan 261122-2108. The activated release carries the standard files, so the fix reaches workers only after a release. Plain `fgos` runs the activated release, not edited source.
