---
id: p-2a39f940
title: Neither fgOS trigger path (interactive pick, headless runner) reaches an MVP2-equivalent outcome on
status: proposed
priority: P2
area: mvp2-scope-test-infra
created: 2026-11-21
---

# Why

Neither fgOS trigger path (interactive pick, headless runner) reaches an MVP2-equivalent outcome on its own terms — different failure shapes, not equivalent

# Done when

Case 1 (interactive /fgOS:pick, tsk-57u, docs/history/mvp2-scope-test-infra/reports/case-1-interactive.md) reaches all three literal artifacts -- green verify (23 pass/0 fail), a real commit (4f501f1) on the item's own fgw/tsk-57u branch, and a clean worktree teardown -- but fgos return's fresh-claim path measures only the ORIGINAL checkout's HEAD, never the fgw/<id> branch pick itself created, so return structurally refuses to register the completed work and the item is stuck at awaiting-human instead of proposed/done. Case 2 (headless fgos-runner --once, docs/history/mvp2-scope-test-infra/reports/case-2-headless.md) never reaches ANY of the three artifacts: fgos-runner.mjs resolves repoRoot via git rev-parse --show-toplevel with no override flag/env, dogfood-fixture is not its own git repo, so a real --once invocation would claim and dispatch real forgent work off the live repo/.fgos/state.json (8 real items) -- confirmed unsafe twice, never invoked for real. Fix scope: (a) fgos return's branch-aware path (bin/fgos.mjs:1306) must also accept a first, ordinary interactive pick's fgw/<id> branch, not only a re-claimed already-blocked item's branchHeadAtTake; (b) fgos-runner needs a cwd-rooted root override (e.g. --root/FGOS_ROOT) parallel to the fgos.mjs verbs' existing process.cwd()-derived isolation, so the headless trigger can be pointed at a testbed instead of always resolving through git toplevel. Done when both cases can independently reach green verify + commit on own branch + clean teardown AND the engine registers completion (proposed/done), proven by re-running this feature's two live cases.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
