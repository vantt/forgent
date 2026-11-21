---
id: p-wgbzcazoak
title: Fold `fgos ask`, Workflow gates and the five-part checker into the owner-question store (Work layer, owner questions; priority medium; when the Work layer resumes)
status: proposed
priority: P2
area: owner-questions
created: 2026-11-21
---

# Why

The question store plan (`plans/261118-1159-owner-question-store`) gives every owner question one door, `fgos questions`, on an Event Store consumer. Three other ways to ask the owner remain, by design, while the Work layer is on hold. `fgos ask` puts a Work item in `awaiting-human` (`bin/fgos.mjs:1631`). A Workflow gate keeps its question in the case projection (`src/workflow/case-projection.mjs:283`). The `AskUserQuestion` hook and `fgos ask` check the five parts in Node (`src/state/decision-question.mjs`). The list shows gates and ask items next to the store's questions only through one doctor-bridge request (`work-questions`), and S04 cannot answer gates.

# Done when

`fgos ask` and a Workflow gate record their question through the store's ask door, so they get an id, an asker and events. Their answers go through `fgos questions answer`. `decision-question.mjs` and the bridge request `work-questions` are deleted, and the five-part rules live only in `questions-input.v1.json` (L10). `npm test` and `cargo test --workspace` are green.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
