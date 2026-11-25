---
id: p-yoec2tz5nf
title: "`packages/config/rust/tests/registry_defaults.rs:190` is red: the `@fgos:doc` line of `docLocate.yaml` differs from the schema description (tests, priority high; source: `plans/reports/triage-261124-0200-main-red-triage.md`)"
status: done
priority: P1
area: tests
created: 2026-11-24
---

# Why

The `@fgos:doc` line of `core/config-standard/docLocate.yaml` uses a colon where the `description` of `core/config-schema/docLocate.schema.yaml` uses a comma. The doc line must equal the schema source. Introduced by `7106dbf78` (2026-11-23, docos); owner is plan `261122-2217-docos-pkm-locate-door`, whose lane has landed. Fix size: one line.

# Done when

The doc line equals the schema description and the `registry_defaults` test passes.

# Notes


Done 2026-11-25: fixed by `a2a5934ef` (fix(config): docLocate model source doc line matches its schema render); the `@fgos:doc` line and the schema `description` now carry the same sentence.
