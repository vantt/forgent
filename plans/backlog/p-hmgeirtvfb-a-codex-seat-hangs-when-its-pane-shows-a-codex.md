---
id: p-hmgeirtvfb
title: "A codex seat hangs when its pane shows a \"codex update available\" banner, and nothing stops the one run (runner, priority high; source: `plans/261117-1435-solo-driving-trial/reports/measures-template.md` (phase 1 baseline))"
status: proposed
priority: P1
area: runner
created: 2026-11-17
---

# Why

In the solo-driving trial baseline on 2026-11-17 one codex probe seat (openai/tetnu, `run_asgn_8e8e56bb_00a0_4158_ad04_ec29cabf8204_op_018_01`) sat with an empty composer under codex's update banner: the prompt was never delivered, the 600 s step timeout never fired, and no verb stops a single run, so it was ended by SIGTERM and then `fgos dispatch recover` (adopt, cancelled). Friction: `codex-prompt-not-delivered-step-timeout-not-enforced`.

# Done when

The codex screen profile recognises the update banner and either dismisses it before the brief or ends the seat as needs-setup naming the banner; a step timeout fires whatever the delivery state; one verb stops a single run and settles it; a live `fgos run --provider openai` through codex reaches an end state with the banner present.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
