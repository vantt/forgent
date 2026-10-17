---
id: design-principles
kind: procedure
owner: core
scope: repo
mode: append
appliesTo: ["*"]
specificity: 10
title: Design Principles
description: The owner's seven design principles for every change - one door, bottom-up layering, hexagonal drivers, Rust-first foundations, correctness first, KISS/DRY, one authority per decision
---

# Design Principles

These apply to every change. Each line says what to do; where a mechanical
check exists it is named, otherwise the reviewer checks it.

1. **One door.** Before adding a function, module, helper or mechanism, search
   for one that already does the job (`rg` its name and the primitive it
   touches, such as `/proc/`, `renameSync` or `.fgos` path resolution) and
   reuse or extend it; say in the plan or commit what you reused. When you
   replace a mechanism, move every consumer and delete the old path in the
   same change; if you cannot, open an item for the rest (L10).
2. **Strict bottom-up layering.** A lower layer defines its own conventions and
   never knows the layers above it; upper layers adapt to it. Shared primitives
   (process identity, liveness, atomic writes, path resolution) live in the
   lowest layer that needs them, not in a feature or adapter module. When an
   import guard blocks you, import the shared leaf module it names; never copy
   the code. Checked by `test/architecture.test.mjs` against
   `docs/architecture-manifest.json`.
3. **Hexagonal and pluggable.** Keep shared logic independent of any one tool;
   the CLI, herdr, tmux and each agent CLI are thin, replaceable drivers behind
   a port.
4. **Independent foundation components, Rust first.** Platform-wide foundations
   (session identity, terminal control, and the like) are separate components,
   built in Rust and used across the whole system.
5. **Correctness and stability first.** Decide from the real OS and system
   state, not from an in-memory copy that can drift; control concurrency and
   guard every boundary.
6. **KISS and DRY.** Keep the algorithm small, remove duplicated code, and add
   no file or intermediate layer you do not need.
7. **One authority, one source of truth.** Each component owns exactly one kind
   of decision. Code and its documentation agree at one source; generated text
   is regenerated from its source, never copied by hand.

