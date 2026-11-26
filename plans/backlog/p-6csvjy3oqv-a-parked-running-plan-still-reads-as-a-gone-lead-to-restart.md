---
id: p-6csvjy3oqv
title: "A parked running plan still reads as a gone lead to restart: `supervisor plans` shows `leadLive: false` and nothing says the plan is parked (supervisor; source: supervisor wake 2026-11-26)"
status: proposed
priority: P1
area: supervisor
created: 2026-11-26
---

# Why

Plan `261125-1631-agent-context-engine` is `status: running` with phases 3-6 parked on this machine by an owner goal
(commit f72c3fee3, prose in plan.md). `fgos supervisor plans --json` reports it as `leadLive: false` with no park
marker, and the supervisor skill says to restart a running plan whose lead is gone. A fresh supervisor session
(after a hard rotation, whose handoff did not carry the park) restarted the lead on 2026-11-26 09:20; it was stopped
two minutes later with no unit and no commit. The park lives only in prose a stateless wake does not read before acting.

# Done when

A running plan whose remaining phases are all parked is reported by `fgos supervisor plans` as parked (with the
reason and who may lift it), read from the plan's own phase table or frontmatter, so the restart rule skips it.
One owning test: a running plan with parked phases and no live lead is not offered for restart. Reuse the phase
table status column (a `parked` status) rather than a new store.

Second occurrence: a supervisor wake restarted the same lead again at 2026-11-26 10:05 (+07); the lead ran nothing, asked to be stopped, and was stopped at 10:20.
