---
id: p-24dxhwq7zr
title: "Councils cost many tokens because they are unstable, not because they think much: seats fail, the run is resumed or reopened, and finished seats run again (workflow/runner, priority high; owner observation 2026-11-17, to be proven by measurement)"
status: proposed
priority: P1
area: workflow
created: 2026-11-17
---

# Why

One architecture-advisory council on 2026-11-17 (wf-run-1794890645429-10371a2f, its reopens wf-run-1794897734802-4f2b8336 and wf-run-1794898080160-96bfd8f5): the critique seat on codex hung 35 minutes on the 'Hooks need review' dialog and the step failed; a resume ran the critique again; the synthesis round-2 claude producer exited after about 20 s without a report (`needs-human`), the step ended blocked and could not be resumed; the first reopen was refused at once because a parent reference (the failed round's producer) had no report; a second reopen was needed. Each restart re-reads all context into fresh seats.

# Done when

Each council run records per seat: attempts, outcome class, tokens or a cost proxy, and how much was spent on retries vs first passes; a report shows the share of cost lost to instability; the top causes found are fixed at their source (seat trust and dialogs, early exits, reopen refs that point at a failed round, resume after a blocked step); a council on this machine completes with no manual resume.

# Notes

Migrated from the legacy backlog table. Original status: proposed (partly: the measurement landed with plan `plans/261118-0936-ops-metrics`, main `80d1349a1`, `725522d1e`, `36445e48f`: each council attempt is a `fgos.run.attempt` record with seat, outcome, fallback, account, duration and tokens or a named reason, ref'd to its unit and plan, so `fgos metrics query --kind fgos.run.attempt --ref unit:<unitRunId> --by fgos.seat.id,fgos.fallback --agg count --agg sum:gen_ai.usage.input_tokens` gives attempts and tokens per seat; still open: the report of cost lost to instability and the fixes at the source).
