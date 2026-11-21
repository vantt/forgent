---
id: p-pif5xjrocn
title: "A stale `prefer` entry in a test config fails three test files away from its cause (test helpers, priority low; source: main red on 2026-11-17 in the workflow seats and CLI tests, fixed in `fix/workflow-red-after-p15`)"
status: proposed
priority: P3
area: test-helpers
created: 2026-11-17
---

# Why

`useDistinctFamilies` replaced the executors but left `runner.roles` and `runner.personas` naming `test-node`, so the failure surfaced in the seats and CLI tests, not at the helper that built the config.

# Done when

The config fixture helpers check once that every `prefer` entry (capability, role, persona) names a registered executor and fail at the helper, naming the entry, when it does not; no test file repeats the check.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
