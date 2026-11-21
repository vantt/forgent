---
id: p-fllz2aajji
title: Fold `apps/fgos/src/wiring/questions.rs` confined routing (it keys on the socket variable) onto the host's one confined arm (supervision, host; priority low; follow-up from plan 261118-1045 phase 16, decision PS-20)
status: proposed
priority: P3
area: host
created: 2026-11-21
---

# Why

The host sends a confined call of a verb named in `head-request.v1.json` through `head_client::request_head`; the questions wiring still has its own confined routing.

# Done when

One confined arm in the host serves every confined verb, including `questions`, and the second routing in `questions.rs` is deleted with its callers moved.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
