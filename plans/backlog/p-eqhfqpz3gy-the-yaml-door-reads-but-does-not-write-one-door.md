---
id: p-eqhfqpz3gy
title: The YAML door reads but does not write (one door, priority medium; owner approved 2026-11-15)
status: done
priority: P2
area: platform-foundations
created: 2026-11-15
---

# Why

YAML parsing goes through the one native door under RUL108 (YAML parses only through the native YAML door), but five files still hand-write YAML frontmatter by string building, so nothing guarantees what they write parses back the same. Found while moving frontmatter reads onto the door. Plan it after the capability-reads and one-door-debt plans close.

# Done when

The YAML door has a write function, the five hand-writers use it, a doors row allows only the door to emit YAML text, and each writer's output parses back to the same value. Landed on the integration branch at 1ec57277a: `writeFrontmatter` writes through the crate, the five writers use it, and the "write a YAML frontmatter fence" doors row allows only the door and the standalone distill script.

# Notes

Migrated from the legacy backlog table. Original status: done.
