---
id: p-mh6ogs34dn
title: "Eight old tests build door-row fixtures without the `severity` field and fail (tests, priority P2; source: supervisor, log `.fgos/runtime/tmp/suite1433-npm.log`, 2026-11-24)"
status: proposed
priority: P2
area: tests
created: 2026-11-24
---

# Why

A door row now needs a `severity` field, and these old tests still build rows without it: in `test/setup/instruction-registry.test.mjs`, `discoverInstructionSources` (5 cases), `discoverKnownOwners`, the `InstructionRegistry` query methods; and the `narrativeHolderResolver` test. Eight failures in all, seen in the full run of plan 1433 (log `.fgos/runtime/tmp/suite1433-npm.log`).

# Done when

The eight tests pass because their fixtures carry the field, or because the code reading the rows is fixed if the field should not be required there. A cause is proven first; no test is weakened.
