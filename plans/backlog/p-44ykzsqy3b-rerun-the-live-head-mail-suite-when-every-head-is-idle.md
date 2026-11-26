---
id: p-44ykzsqy3b
title: Rerun the live head-mail suite when every head is idle, so the cases the four runs of 2026-11-26 could not reach get proven
status: proposed
priority: P2
area: communication
created: 2026-11-26
---

# Why

The plan 261125-2313 closed with its live criterion (head to head mail between real heads) not run to completion. Four runs on 2026-11-26 proved the herdr address fix, a real send to the secretary that answered `local-next-tool-call`, and that a draft left in a composer can be erased. They did not prove the four send paths for every persona, the wake within the bound for each drained CLI with the pane focus unchanged, the refusal to type into a half-typed composer, or the cross-machine `remote-recorded` answer. The suite drives the owner's real heads, which were working during every run, so a sender did not answer inside its window and the rest was skipped. Evidence: `plans/261125-2313-head-communication-agent-to-agent/reports/integration.md`.

# Done when

At a quiet time, with an idle claude, codex and agy head of each persona (and a second machine named in `FGOS_LIVE_HEADS_REMOTE_PEER`), `FGOS_LIVE_HEADS=1 node --test test/live/mailbox-heads.live.mjs` passes: every persona sends and its peer reads from its inbox, each drained CLI is woken within the bound with the focus unchanged, a half-typed composer is not typed into and the answer says so, and one cross-machine send answers `remote-recorded`. `npm test` also runs once on a writable HOME. The result is written into the integration report.

# Notes

Closes the rest of p-rchuoa2v3k, p-ia2v33b54u and p-bifjfd5rix. Proposed by the lead of plan 261125-2313 at the owner's request (owner chose to record the live criterion as not run to completion); landed by the unconfined supervisor session. The run types commands into the owner's live heads, so run it when the owner is away and the heads are idle.
