---
id: p-c6au2dlxpt
title: "Split runner by role when it is worth it: runner carries three orchestration-ring roles today (selection, routing, launching) (component-authority, priority P3; source: ds-zfqskcns7j, owner via Miu, 2026-11-28)"
status: proposed
priority: P3
area: component-authority
created: 2026-11-28
---

# Why

`runner` carries three ring roles (`loop.mjs` orchestrator, `operation-choice.mjs` router, `work-dispatch.mjs` launcher) through path exceptions. The component-authority discussion (`ds-zfqskcns7j`) says splitting is a separate item, done only when it is worth it.

# Done when

- A short measured case: how many path exceptions and cross-role imports `runner` has, and what splitting would remove.
- Either a split into role components with callers moved and the old paths removed, or a recorded decision not to split, with the numbers.

# Notes

Decide with the measurement first; the discussion says only when it is worth it.
