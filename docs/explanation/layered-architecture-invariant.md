---
type: explanation
title: fgOS's layered architecture is a live, tested invariant — not a diagram
tags: [architecture, layering, module-boundaries]
timestamp: 2026-07-22T00:00:00.000Z
source_capture_ids: []
---

# fgOS's layered architecture is a live, tested invariant — not a diagram

fgOS's source is organized into five layers — entry, use-case, infra, domain,
kernel — with one rule enforced by a real test rather than left as a diagram
convention: a module may only import from its own layer or a deeper one, never
from a shallower one. `kernel` is the deepest layer, importable by anyone;
`entry` is the shallowest. `docs/architecture-manifest.json` records every
module's layer, and a dedicated test enforces two things off that manifest:
every `.mjs` file under `src/` and `bin/` has exactly one registered row (a
one-to-one "đủ sổ" check), and no module's declared layer imports upward from
one that ranks shallower.

## New modules need the row on day one, not at review time

The failure shape that has recurred most often is a new module — including a
pure, zero-import, "obviously harmless" one — that ships without its manifest
row. The suite doesn't fail at write time; it fails the moment the test suite
next runs, which can be well after the module was written and reviewed,
because nothing at write time forces the check. This has now happened across
several unrelated features, including cases where the missing module really
was pure data with no logic in it at all — the "does it look risky" instinct
is not a reliable signal here, because the check is about the manifest's
completeness, not about the module's complexity. The registration itself is
simple: a pure, zero-import module belongs at the deepest layer (`kernel`,
importable by anyone), since it has no dependencies to violate the direction
rule in either direction.

## Cross-module reuse has to respect the same direction, computed up front

The same invariant also constrains refactors that share logic between two
existing modules. If module A (at a deeper rank) needs something that
currently lives in module B (at a shallower rank), a direct import from A to B
would be an upward import — exactly what the rule forbids, regardless of how
small or "just data" the shared piece is. The fix in that shape is to extract
the shared piece into a new module at the deepest layer (`kernel`), so both
sides can import it legally. The rank arithmetic is cheap and deterministic —
look up both modules' layers in the manifest, confirm the importer's rank does
not exceed the target's — and doing it before a plan is turned into cells is
strictly cheaper than discovering the violation after code is written.

---

**Source:** `docs/history/learnings/critical-patterns.md` —
[20260718] "Adding ANY new `.mjs` module under `repo/` obliges a
`docs/architecture-manifest.json` layer row in the SAME cell" (feature
entry-standardization, P37), with a fourth recurrence noted against
compound-learn-enduser-docs (bước-3, `enduser-index.mjs` itself);
[20260717] "New `src/**.mjs` module without its manifest row → guaranteed
suite-red" (feature worker-dispatch-log P32, first occurrence stage-intake
P20).
