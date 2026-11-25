---
id: ds-ayxhxswso6
title: "Claude worker units may run cargo, node and npm test through the standard runner config — DISCUSSION"
status: open
source: [p-ayxhxswso6]
created: 2026-11-24
---

# Claude worker units may run cargo, node and npm test through the standard runner config — DISCUSSION

discussion: settled

## Hand-off cho planner (2026-11-24 23:30)

**Outcome.** Phase 2, 3, 6 and 7 of plan 261124-0004-heads-operate-without-owner can run Rust units: a claude worker started through `claude-cli-bwrap` may run cargo, node and npm test without the approval prompt that nobody answers.

**Decision (owner, q-nog2h4wfjm and q-qzcq5xti2k, option 2, 2026-11-24).** Change the standard file `core/config-standard/runner.yaml`: add `--allowedTools 'Bash(cargo:*)' 'Bash(node:*)' 'Bash(npm test:*)'` to the `claude-cli-bwrap` args only. The project config cannot hold it (`runner.executors.claude.invocations` is global-only), and a global change would hit every project on the machine.

**Constraints.**
- No change to the bwrap posture, the declared-writes commit rule, other invocations or other executors.
- A config default goes through `core/config-standard` and `core/config-schema` only; check the schema of the args list and the `toolGating: allowedTools` field first.
- The activated release carries the standard files: the plan must say that the fix reaches workers only after a release, and who releases (the owner or the unconfined supervisor session).
- Done proof: config tests and `fgos config check` pass; a claude unit in a linked worktree runs cargo without the refusal.
- Add a line to `## [Unreleased]` in CHANGELOG.md.
- Keep the footprint to `core/config-standard/runner.yaml`, its schema if needed, its tests and the changelog; check overlaps with running plan 0004 and draft plan 261122-2108.

**Non-goals.** A per-unit allowed-tools field (separate, larger item). Syncing worktree p02 with main: the lead of plan 0004 does that before rerunning phase 2.

**Priority.** P1: it blocks four phases of a running plan. Leave the plan `ready` if the contract check passes and no footprint overlaps; otherwise `draft` with the reason.
