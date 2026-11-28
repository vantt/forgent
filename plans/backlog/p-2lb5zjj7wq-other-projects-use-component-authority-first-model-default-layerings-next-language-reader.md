---
id: p-2lb5zjj7wq
title: "Other projects use component authority: how a project builds its first model, the default layerings for a new project, and the reader for the next language after Node and Rust (component-authority, priority P1; source: owner via Miu, 2026-11-28)"
status: proposed
priority: P1
area: component-authority
created: 2026-11-28
---

# Why

Component authority works only on this repository today. A project that adopts fgOS has no way to start its model, no default layerings, and no reader for code in a language other than Node or Rust. Step B of the layering work leaves the next language open until a real project needs it.

# Done when

- A documented way for a project to create its first model, with a command or a checked starting template.
- Default layerings for a new project (the four named layerings with sensible values), overridable.
- A reader for the next language after Node and Rust, chosen with a real project that needs it, behind the same port as the existing readers.
- One test builds a model for a scratch project and shows the checks run on it.

# Notes

Depends on `p-glsrogszi7` (MODEL_DIR hard-coded). Needs a shaper discussion for the language choice.
