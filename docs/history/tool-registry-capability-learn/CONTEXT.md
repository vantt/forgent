# tool-registry-capability-learn — locked decisions

Item: `tsk-2br`. Source request (raw, untrusted per RUL45): "học cơ chế
harness tool-registery của repository-harness project dùng để làm gì, có
gì hay ho để học hỏi, cách nó intergrate vào flow như thế nào."

## Feature boundary

A pure learning/distill item, not a porting or implementation item. Its
job ends at producing a written synthesis of how `repository-harness` (and
projects that reuse its registry — symphony, beads, compound-engineering-
plugin) solve the "does this optional tool exist, and does anyone actually
check before relying on it" problem, and where the porting-log candidate
row for it stands.

**Out of scope** (belongs to sibling items, not this one):
- `tsk-1dj` — actually porting the `tool-registry-capability` idea into
  fgOS (verb-group, store, schema).
- `tsk-1e4` — rewriting fgos-coding-planning/fgos-coding-validating prose to consult a
  capability instead of hardcoding "GitNexus".
- `tsk-4ad` — registering gitnexus itself for this repo once the verb-group
  exists.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | The deep-dive already drafted at `docs/distillery/deep-dives/tool-registry.md` (topic: tool-registry, sources: repository-harness, beads, symphony, compound-engineering-plugin) fully answers this item's question — what the mechanism is for, what's interesting about it, how it actually integrates into a project's flow (bottom line: injection is a **prose contract**, not compiled logic — the registry only returns facts; whichever skill/AGENTS.md a project writes decides when to ask it). Closes by committing that doc as-is, no rewrite. |
| D2 | `docs/distillery/porting-log.md`'s `tool-registry-capability` candidate row (line 34) gets its score bumped R2→R3 as part of this item, per the deep-dive's own end-of-doc suggestion — a concrete blocking use-case now exists (`tsk-1e4`), which is exactly what separates a "hay ho để học" (interesting to know) candidate from an "R3, something is actually waiting on this" candidate. |

## Pinned terms

- **Capability** (as used throughout the deep-dive and this item): a
  free-text, kebab-case-normalized label a workflow step asks for (e.g.
  `impact-analysis`) — never a specific tool name. A tool *registers*
  against one or more capabilities; a step *consults* a capability, never a
  tool.

## Scout evidence cited

- `docs/distillery/deep-dives/tool-registry.md` — the full deep-dive
  (already written, this item's deliverable).
- `plans/reports/distill-consult-260730-2152-tool-registry-capability-vocab-report.md`
  — the consult report backing the deep-dive's Store design note (D-Trade-off#2).
- `docs/distillery/porting-log.md:34` — the candidate row this item scores.
- `fgos list --id tsk-1dj/tsk-1e4/tsk-4ad` — confirmed these three sibling
  items exist and cover porting/prose-rewrite/registration separately, so
  this item does not need to (re-)cover any of that ground.

## Outstanding questions

None — both material gray areas (deliverable scope, porting-log edit)
were locked by direct answer above. No deferred items, no assumption
markers.
