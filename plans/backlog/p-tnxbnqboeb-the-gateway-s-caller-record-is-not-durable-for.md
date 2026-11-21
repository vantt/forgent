---
id: p-tnxbnqboeb
title: The gateway's caller record is not durable for most verbs (Work later)
status: proposed
priority: P2
area: work-state
created: 2026-11-21
---

# Why

Owner decision 81 Q2 wants every gateway request to record its caller. Only `ask`, `answer` and `decision` accept `--source` in `bin/fgos.mjs`; every other verb refuses an unknown flag, so `submit`, `move`, `approve`, `reject`, `take`, `return`, `edit` and the session verbs run with no caller stored. The gateway writes one stderr line per state-changing request and passes `--source gateway:<caller>` to `ask` and `answer`.

# Done when

One optional caller field shared by every state-changing verb, set by the gateway from the same caller identity, with one test in the Work verb suite; waits for the Work batch (decision 78)

# Notes

Migrated from the legacy backlog table. Original status: proposed.
