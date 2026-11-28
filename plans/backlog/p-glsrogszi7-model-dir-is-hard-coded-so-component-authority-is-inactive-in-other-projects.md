---
id: p-glsrogszi7
title: "The component-authority model directory is hard-coded (MODEL_DIR in rust/src/model.rs:15), so in any other project component authority is always inactive; read it from the project's own configuration (component-authority, priority P2; source: ds-zfqskcns7j, owner via Miu, 2026-11-28)"
status: proposed
priority: P2
area: component-authority
created: 2026-11-28
---

# Why

`MODEL_DIR` is written in the Rust source at `rust/src/model.rs:15`. A project that is not this repository has no model at that path, so component authority is inactive there. Found in `ds-zfqskcns7j`, where the shaper does not edit the backlog and asked the secretary for this row.

# Done when

- The model directory comes from the project's configuration (one registered key), with this repository's path as the default.
- In a project that declares its own model, component authority is active and a test shows it.
- No other hard-coded copy of the path remains (L10).

# Notes

Linked with the row for other projects using component authority (this is its first dependency).
