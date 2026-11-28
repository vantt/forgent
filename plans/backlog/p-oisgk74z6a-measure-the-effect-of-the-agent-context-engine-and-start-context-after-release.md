---
id: p-oisgk74z6a
title: "Measure the real effect of the Agent Context Engine and the start-context composer after they are released: real tokens per start, rules refused at write, and how often heads ask the owner for missing context (tests, priority P1; source: owner via Miu, 2026-11-27 23:3x)"
status: proposed
priority: P1
area: tests
created: 2026-11-27
---

# Why

Plans `261125-1631-agent-context-engine` and `261122-1946-agent-start-context` are `done` and their CHANGELOG lines sit under `[Unreleased]`. The only measurement so far is `plans/261122-1946-agent-start-context/reports/start-token-table.md`: an estimate (bytes / 4) made on fg-server before release, with no live head started. The Agent Context Engine has no result measure at all. Without a before and after, nobody can say whether either one helps.

# Done when

- A before value is recorded from the existing table: AGENTS.md 61,705 bytes before, 48,855 after; head opening about 14 to 15 KB.
- After the release runs, the same compose door is run on the activated release and real token counts are taken from live starts of one head of each persona and one worker, and compared with the table.
- For the Agent Context Engine: the count of rule writes refused by kind (duplicate id, conflict, near-duplicate above 0.93), and the count of refusals later judged wrong, over one week.
- For both: the number of owner questions and help requests that name missing context, one week before and one week after the release.
- One short report in `plans/reports/` with the four numbers and a verdict per component (keep, tune, revert), listing what could not be measured.

# Notes

Depends on the release that carries both plans (release recipe, `fgos release run`) and on plan `261127-1224-release-checks-clean-tip` finishing first. Needs one worker; no code change expected.
