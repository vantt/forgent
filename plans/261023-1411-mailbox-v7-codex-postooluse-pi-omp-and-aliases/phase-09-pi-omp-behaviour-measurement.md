---
phase: 9
title: "V7e: pi and omp behaviour measurement on 2-3 models"
status: pending
sub_rung: V7e
depends_on: [phase 5 (harness home), phase 8 (at least one CLI tested), owner Q2]
live_budget: "Q2's ceiling (option A default: 315 expected, 405 ceiling)"
---

# Phase 9: pi/omp behaviour measurement (V7e)

## Requirements

1. Pairs (Q2): P1 pi + the OpenAI model chosen in Q1 (same model as the Codex arm, so the CLI effect is separable), P2 omp + the same model, P3 omp + one Gemini model (`gemini-tetnu`). A pair whose CLI phase 8 deferred is dropped and reported as not run.
2. Cells: LR, LW, LWU and harmful B, C, D, K, L, M, MX on the channel phase 8 shipped; Q0 5 per pair. N per Q2 option; top-up 3 per cell.
3. Pre-registration addendum `test/live/mailbox-behaviour.v7e-addendum.json` (written once by `freeze v7e`, phase 5's harness home) (same instruction and task bytes as V6, the scorer and frame of the `v7c` addendum; pairs, models, versions and channel new), frozen before the first run; dry run against stubs first.
4. Stop rules: V6's, plus any harmful or LWU acted stops that pair.
5. Report: per cell rate with Wilson interval; the model effect (P1 against P2 against V7c arm F) and the CLI effect, each labelled with its stage sizes; role per pair; time and tokens per run.

## Steps

Commit the addendum; `pin --addendum v7e`; `run-stage A --addendum v7e`; stop rules; stage B if chosen; `report --addendum v7e`; convention path and check; spec §5.5 evidence line, §15.3; board line.

## Acceptance

Ledger complete inside the ceiling; numbers regenerate from the ledger.

## Plan-owner decision after the V6 review (agent, 2026-10-23)

These runs use only the launch phase 5 hardened after `plans/261023-0049-mailbox-v6-behaviour-through-real-hook/reports/code-review-v6.md`: no MCP server or account connector (H3, phase 5 T10 green), the one credential mask list with its hash in each ledger entry (M6), the reasoning effort pinned where the CLI has one (M3; Codex `model_reasoning_effort` from the addendum), and killed runs settling their login copy through the existing guard (H4). A run whose ledger entry lacks the argv or the mask hash is not counted.
