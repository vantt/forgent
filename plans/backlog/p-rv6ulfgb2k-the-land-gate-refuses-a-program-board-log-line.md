---
id: p-rv6ulfgb2k
title: "The land gate refuses a program board log line, so a head cannot record a lane close on the board (land/plans, priority P2; source: supervisor wake 2026-11-25 12:46)"
status: proposed
priority: P2
area: git
created: 2026-11-25
---

# Why

AGENTS.md asks a head that closes a lane to add one line at the top of
`plans/261017-1313-fgos-platform-program-board/log.md`. On 2026-11-25 the supervisor's
`fgos land --paths ...,plans/261017-1313-fgos-platform-program-board/log.md` failed `land-gate-failed`:
`node scripts/plan-contract-check.mjs --plan plans/261017-1313-fgos-platform-program-board` answers
"legacy plan: no `contract: plan-v1` marker". The board has no plan-v1 frontmatter and no footprint table, so every
land touching it is refused, while the same kind of land passed on 2026-11-24 (commit c99af30a3). The closing line for
plan 261124-2320-claude-worker-allowed-tools went to the wake report instead.

# Done when

A head can land one board log line through `fgos land --paths` (either the gate skips the board's log, or the board
carries a marker the check accepts), and the AGENTS.md board rule and the gate agree.

# Notes

Supervisor wake 2026-11-25 12:46 recorded the case; the board rule is in AGENTS.md.
