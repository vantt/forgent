---
id: p-nyhaakrsvz
title: "`fgos session stop` cannot end a head whose request socket is gone; it ends stop-not-ended and only a SIGTERM from the unconfined session ends the head (session-host, priority high; source: lead of plan 261124-0004 and owner report, 2026-11-25)"
status: proposed
priority: P1
area: session-host
created: 2026-11-25
---

# Why

`session stop` is `allow` for the supervisor in the head permission table, but when the stopped head's request socket is already gone the stop ends `stop-not-ended` (`src/session-host/head-stop.mjs:58`, "did not end within ... of its stop request"). The head then ends only by a SIGTERM sent by hand from the unconfined session (owner report, 2026-11-25, the probe heads; the supervisor's requests are `supervisor.log` lines 110, 137 and 145 of `head-supervisor-forgent-706`). A granted verb that cannot do its job makes the supervisor fall back on the owner, against "Release con người".

# Done when

`fgos session stop` run by the supervisor ends a head whose request socket is gone: it decides from OS state that the head is still running, ends it through the session host, and reports the end; a fixture with a removed request socket proves it.

# Notes

Evidence: `plans/261124-0004-heads-operate-without-owner/reports/integration.md`, section "Gaps between the permission table and real use", gap 2. Same report notes the sibling gap `p-o4juyw2ntg` (`git recover` is `allow` but settles a chain only for its own writer).
