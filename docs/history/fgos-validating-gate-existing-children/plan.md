# Plan: fgos-coding-validating Gate — third case for already-created children

tsk-1x7

Mode: tiny

## Direct note

One file, one prose addition, no split (D1, `CONTEXT.md`).

Edit `.claude/skills/fgos-coding-validating/SKILL.md`'s Gate section (the block
starting `## Gate`, currently lines 155-193 as read this session) to add a
third case alongside the existing two verdict-selection examples. The new
case:

- **Trigger:** `plan.md`'s step 4 already created the listed child pieces
  as real work items (via `fgos add --parent --footprint`, `fgos-coding-planning`
  step 4) — not a JSON blob still to be materialized.
- **Action:** use `--verdict pass-through`, citing the already-existing
  children by id, in the same command-example block that currently shows
  the two existing cases.
- **Explicit warning:** never `--verdict decompose --children [...]` in
  this case — that call is unconditional in `decompose.mjs`'s `addWork`
  loop (~929-945, confirmed by direct read) and would create duplicate
  positional-id children while orphaning the real ones.

Exact wording is this session's own to write during `fgos-coding-implement`;
`CONTEXT.md`'s scout evidence and D1 already fix everything material about
scope (doc-only) and location (the Gate section specifically).

## Files touched

- `.claude/skills/fgos-coding-validating/SKILL.md` (only)

## Risk map

| Component | Risk | What would prove it |
|---|---|---|
| Gate section prose | light | `verify` below: both required phrases present inside the `## Gate`...`## Handoff` span |

No medium/high risk entries — this is a documentation-only prose addition
to one file already fully scoped by `CONTEXT.md` D1. No proof point is
carried to `fgos-coding-validating` beyond the verify command itself.

## Impact-analysis posture

`inactive` for this plan's own proof needs — this is a documentation-only
change with no code edit, so no blast-radius evidence applies regardless
of GitNexus's actual posture (recorded as `full` and present in
`CONTEXT.md`'s scout evidence, for completeness only).

## Verify

```bash
S=$(awk "/^## Gate/,/^## Handoff/" .claude/skills/fgos-coding-validating/SKILL.md); echo "$S" | grep -q "already created as real work items" && echo "$S" | grep -q "never.*decompose --children"
```

Same command already set on the item and cleared through `fgos discover
--verdict clear --force` this session (the second-pass judge's objection —
that no mechanical check can prove stranger-comprehension of prose — is
unfalsifiable for any doc-only verify; documented and overridden live per
tsk-5cf D1b, not silently). This command checks two required elements
land inside the Gate section specifically: the trigger phrase and the
explicit warning against the wrong verdict.

## No split

One honest piece of work — a single prose addition to one file. No
`fgos add --parent` children created.
