---
id: p-rchuoa2v3k
title: "A confined head's mailbox read fails with lock-unavailable, so mail sent to a lead is never read by it (session-host, mailbox; source: the heads-operate lead, 2026-11-25)"
status: proposed
priority: P2
area: session-host
created: 2026-11-25
---

# Why

The lead of plan 261124-0004 reported twice on 2026-11-25 (evening) that its `fgos mailbox inbox` read failed with `the mailbox record failed (lock-unavailable) and nothing was changed`, so it never saw the secretary's reply about a probe. The mailbox itself is healthy at the same time: `fgos mailbox status` from the unconfined session reads the record as ok with 19 heads, no process holds a mailbox lock, and the last busy-lock and read-cap markers date from 24 November and 15:06 on 25 November. A read marks mail as taken, so it writes to the record and needs the record lock; that write path is the likely thing a confined head cannot reach, the same class as the read-only locks found for `git recover` and the full-suite lock. Mail typed to the lead by `fgos session type` arrives, so only the confined read side fails.

# Done when

A confined lead, planner or shaper reads its mailbox through its request socket or through a lock it can write inside its cage, and one test sends a message to a confined head and reads it back from there.

# Notes

Not proven: which lock path the confined read opens and why it is unavailable. A related row is the cage diagnosis of plan 261124-1853-confinement-to-rust (mail send from the secretary is one of the calls its phase 3 re-proves). Until fixed, leads receive instructions through `fgos session type` and answer through `fgos supervisor raise`.
