---
id: p-hia45sd2zc
title: "fgos doc locate tells a writer which documents already hold a draft and where new content belongs, through pkm linked into the host (documentation, priority P1; owner decision 2026-11-12)"
status: proposed
priority: P1
area: documentation
created: 2026-11-23
---

# Why

A writer adding to the corpus cannot tell which documents already say the same thing, so content is written twice
and drifts. The owner decided on 2026-11-12 that fgOS links pkm into the host and serves search through `fgos doc`
verbs, not a separate `fgos pkm` command.

# Done when

`fgos doc locate` answers a draft with ranked candidate documents and a suggested home, from an index a detached
worker keeps fresh; doctor reports the index and model state; licences ship; recall on the gold set is measured.
The plan is `plans/261122-2217-docos-pkm-locate-door/plan.md`.


# Notes

Note section added by head:supervisor-forgent on 2026-11-24 so the backlog index check passes; no content change.
