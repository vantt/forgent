---
id: p-dbh2oykqk5
title: A lead's `supervisor raise` and `friction record` are refused `verb-not-granted` ("fgos is not in the grant") although its grant lists both
status: proposed
priority: P1
area: session-host
created: 2026-11-25
---

# Why

On 2026-11-25, after the release was activated, two leads reported the same refusal from their head window. The lead of plan 261125-1556 (event-store io errors) and the lead of plan 261122-2108 (delete dead Node execution closure) both hit it. `fgos supervisor raise` and `fgos friction record` answer `verb-not-granted` with "fgos is not in the grant", although the lead row of `GRANTS` in `src/session-host/head-grants.mjs` lists both. `questions ask`, `run` and `request result` still work. Without `raise`, a parked lead cannot put its park on the supervision queue, so parks reach the supervisor only through owner questions or by someone reading the lead's screen.

# Done when

A lead calls `fgos supervisor raise --kind coordination-help ...` and `fgos friction record ...` from its window and both are accepted. One test covers the grant lookup that refused them.

# Notes

This may share a cause with p-5a6z5fuoq2 (the shell `fgos` function appends `--dir`), but that refusal reads `argv-not-allowed`, not `verb-not-granted`. Check that first.

Update 2026-11-25 18:10: after the supervisor restarted the leads of 261122-2108 and 261125-1556, both raised events with `fgos supervisor raise` successfully. The refusal may affect only sessions started before the release activation of 2026-11-25. Reproduce it in a fresh session before working on this row; close it if it does not reproduce.
