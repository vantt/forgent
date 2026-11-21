---
id: p-3c9e7a15
title: Every third-party dependency gets an upgrade record and acceptance tests in its owning package
status: proposed
priority: P2
area: distribution
created: 2026-10-23
---

# Why

Two crates follow the pattern today: the YAML parser (`packages/yaml-doc/upgrade-record.md`, golden fixtures, integrity test) and the JSON Schema validator (`packages/config/upgrade-record.md`, the 2020-12 suite cases fgOS uses, regression tests for known defects). The rest (`tokio`, `serde`, `serde_json`, `rustix`, `sha2`, `libc` and the other `[workspace.dependencies]` pins, plus the gateway's own lock) have an exact pin but no record of why that version, what was reviewed, or which tests must stay green before a bump. Owner 2026-10-23: apply to every dependency when there is time.

# Done when

Each workspace and gateway dependency has a record (version, reason, review done, known defects and guards) next to the package that relies on it, and a named set of tests that decides a bump; the convention in `docs/platform/packaging-distribution/spec.md#dependency-upgrade-discipline` names where they live; a bump that skips the tests is visible in review.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
