---
id: writes-to-main
kind: boundary
owner: core
scope: repo
mode: append
specificity: 10
title: Writes to Main
description: Land on main only what another session must rely on later; progress, waiting and review notes go to the event store or untracked files
lifecycle: live
valid_from: 2026-11-26
---

# Writes to Main

Land on main only what another session must rely on later: code, a settled decision, a plan status change (draft, ready, running, done) or a backlog row; never a wake or progress report, a "waiting" or "parked" note, a discussion round, a review note or an owner answer the question store already holds.
Every commit on main passes the land door's merge slot and gate, so each one makes every other head's land wait or rerun; on 2026-11-25 main took about 21 commits an hour, 88% of them not code, and lands starved.
Put the rest where it already lives: the event store (`fgos supervisor raise`, `fgos questions`), or a local file that stays untracked (wake reports are in `.gitignore`).
When a record must reach main, land it once at a checkpoint (a phase `done`, a discussion settled or paused), not once per step.
Never leave an edit uncommitted in the main checkout while you wait: land it or restore it, because a dirty tracked file there refuses other heads' lands.
