---
id: p-6rkfzc5n6i
title: "Rerun the live head-mail suite when every head is idle (mailbox, test; source: lead of plan 261125-2313, 2026-11-26)"
status: proposed
priority: P2
area: mailbox
created: 2026-11-26
---

# Why

Plan 261125-2313 landed its phase 7 (036aa75d1), but its integration report records criterion 8 as not run to completion: on 2026-11-26 every head on the machine was working, so the four live runs proved the herdr pane-address fix, one real send from inside the cage and the draft erase, and did not prove all four send paths, the wake bound per persona, the half-typed composer gate (no idle recipient), the remote case (no second machine) or `npm test` on a machine whose HOME is writable. Evidence: `plans/261125-2313-head-communication-agent-to-agent/reports/integration.md`.

# Done when

At a quiet time, with idle claude, codex and agy heads of each persona, `FGOS_LIVE_HEADS=1 node --test test/live/mailbox-heads.live.mjs` (plus `FGOS_LIVE_HEADS_REMOTE_PEER` for a second machine) passes every persona send and read, each drained-CLI idle wake within the bound with focus unchanged, the half-typed composer refusal and the remote-recorded case, and `npm test` passes on a writable HOME. This closes the remainder of p-rchuoa2v3k, p-ia2v33b54u and p-bifjfd5rix.

# Notes

Proposed by the lead of plan 261125-2313 at the owner's request; landed by the supervisor. Run it only when no head is busy, or the idle-wake and composer cases have no recipient.
