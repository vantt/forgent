---
id: p-5qpb7pas5b
title: "Four generic door names may make the door guard count unrelated code: `sync_due`, `version_row`, `curl_row` and `launcher_row` (component-authority, priority P3; source: closing note of plan 261121-2110-component-authority-doors)"
status: proposed
priority: P3
area: component-authority
created: 2026-11-24
---

# Why

The door guard in `test/architecture.test.mjs` counts how often each name in a door row's `names` field appears in code (whole word, comments and strings skipped). Four names are generic: `sync_due` in `event-store-maintain-policy.yaml` (it is also the name of a struct field), and `version_row`, `curl_row` and `launcher_row` in `packaging-doctor-judgments.yaml`. The guard is green today. If unrelated code later uses a variable or function with one of these names, the guard reports a false second copy of the door, or shifts the `count` of an allowed file, and the person fixing it loses time finding out why.

# Done when

The four names are replaced by more specific ones (the full name of the owning function) or by narrower primitives. Small; do it when the two rows are touched again, or fold it into `p-tvwy24txpj`'s neighbourhood of door work.
