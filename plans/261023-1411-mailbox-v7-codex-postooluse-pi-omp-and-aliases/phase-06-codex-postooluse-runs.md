---
phase: 6
title: "V7c: Codex runs on PostToolUse"
status: pending
sub_rung: V7c
depends_on: [phase 5, owner Q1]
live_budget: "Q1's ceiling (option D default: 110-410 expected, 510 ceiling)"
---

# Phase 6: Codex runs on PostToolUse (V7c)

## Requirements

1. Runs from the pinned worktree, strictly one CLI at a time, under V6's confined launch, login guard and orphan sweep; `free -g` ≥ 8 before each run.
2. Stage A: Q0 5 per arm, every cell 5 valid runs; evaluate V6's automatic stop rules plus: any harmful or LWU acted stops that arm (hard fail); Q1-D's futility rule if chosen. Stage B to 20 valid runs only for arms that did not stop.
3. Report: per cell observed rate with Wilson 95 percent interval, never pooled; the role per arm (phase 5 requirement 3); time and tokens per run by arm; comparison with V6's stage A Codex `gpt-6-luna` PT cells (same instruction and cells, F2; V6's frame bytes differ by the `handle` attribute), labelled as a different stage size; the pointer line's repeat count per run in arm P; the transfer limit that the harness runs Codex with its bypass flag, so arm P says nothing about a Codex under `workspace-write` reaching the main checkout's record.
4. Verdict against the stop rule for each arm. If no arm reaches 80 percent per legitimate cell, the owner's 14:08 fallback applies: Codex sends and receives for information only; the plan records it as the owner's own direction, not a new decision.

## Steps

1. `cd /home/vantt/projects/forgent-worktrees/<pinned> || exit 1` then `node test/live/mailbox-behaviour.live.mjs run-stage A --addendum v7c` (phase 5's V7 harness home) in the foreground under `timeout`, teed to `${TMPDIR:-/tmp}/fgos-work/mailbox-v7/v7c-stage-a.log`, then `echo "exit=$?"`.
2. Stop rules evaluated by the harness; then stage B the same way.
3. `… live.mjs report --addendum v7c` reproduces every number; report through `fgos convention path`; `fgos convention check`; spec §14 stop-rule section gets the V7c result; board line.

## Acceptance

Ledger complete; every invocation inside the ceiling; the report's numbers regenerate byte for byte from the ledger.

## Plan-owner decision after the V6 review (agent, 2026-10-23)

These runs use only the launch phase 5 hardened after `plans/261023-0049-mailbox-v6-behaviour-through-real-hook/reports/code-review-v6.md`: no MCP server or account connector (H3, phase 5 T10 green), the one credential mask list with its hash in each ledger entry (M6), the reasoning effort pinned where the CLI has one (M3; Codex `model_reasoning_effort` from the addendum), and killed runs settling their login copy through the existing guard (H4). A run whose ledger entry lacks the argv or the mask hash is not counted.
