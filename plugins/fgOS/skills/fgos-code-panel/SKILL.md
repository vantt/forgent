---
name: fgos-code-panel
user-invocable: false
description: >-
  Get a single, straightforward code change implemented and independently
  reviewed + red-teamed through the real `fgos coordination` CLI doors --
  no plan.md/phase-NN.md track required, no fgOS Work items, no lifecycle
  stage, no UI/dashboard. The coding-flavored use case built on the exact
  same core mechanism as `fgos-plan-loop`
  (`standalone-master-coordination-loop`), with a default doer/reviewer/
  red-team persona roster tuned for code implementation instead of generic
  work. Use when someone has one concrete code change in mind and wants
  it done with a real independent second/third opinion, not a whole
  multi-cell track. Examples: "implement this fix and get it
  reviewed+red-teamed", "run a code panel on this change", "get an
  independent review and red-team on this patch before I merge it".
---

# fgos-code-panel

The code-implementation use case built directly on top of
[`fgos-plan-loop`](../fgos-plan-loop/SKILL.md)'s own mechanism -- same
CoordinationSession runtime, same
[`standalone-master-coordination-loop`](../../../core/coordination-protocols/standalone-master-coordination-loop.yaml)
FlowDefinition, same `fgos coordination chain/run/show` CLI doors, same
five-kind request schema
([`src/verbs/coordination/schema.mjs`](../../../src/verbs/coordination/schema.mjs)).
Nothing about the underlying mechanism is re-implemented or forked here --
this skill only narrows the entry point and changes the default actor
roster. Read `fgos-plan-loop`'s own SKILL.md for the full, field-by-field
schema grounding (request shapes, the four-condition Mutation Rule,
`$ref:`/`contextRefs` semantics) -- it is not repeated below to avoid the
two copies drifting apart.

**The one real difference from `fgos-plan-loop`:** this skill never assumes
a `plans/<track>/plan.md` + `phase-NN-*.md` pair exists. One code change,
one cell, one worktree, one `coordinationId` -- close it and you are done.
Use `fgos-plan-loop` instead when the work is a multi-cell track that
itself needs a `plan.md`/multiple `phase-NN-*.md` files and cross-cell
sequencing; use this skill when someone just wants ONE change implemented
and independently checked.

## Non-Goals

Same as `fgos-plan-loop`'s own "Non-Goals" section (no Work items ever,
no git authority inside the session) -- not repeated here, same
drift-avoidance reason as the known-gap section above. One goal specific
to THIS skill, not `fgos-plan-loop`'s concern: it is deliberately NOT a
member of the `fgos-coding-*` stage-routed family
(`fgos-coding-discovering/planning/validating/...`) even though both
operate in the same repo -- this skill never reads or writes an item's
`stage`, never claims anything through the pull door.

## Known gap this skill inherits (`tsk-371`, not fixed yet)

Same gap as `fgos-plan-loop`'s own "Known gap this skill runs into today"
section -- read that section for the full description and the required
workaround (verify the doer/fixer's real commit + real test run yourself,
independently of the RunResult's own grading). Not repeated here to avoid
the two copies drifting apart.

## Default actor roster (the coding-flavored delta)

Same three-actor shape as `fgos-plan-loop`'s templates, same
executor/tier mapping already decided for this product line
(doer/fixer -> `agy-cli`, reviewer -> `claude`, red-team -> `codex-cli`),
different default personas -- tuned for reading/writing/attacking real
code rather than generic implementation work:

```json
"actors": [
  { "id": "doer", "executor": "agy-cli", "tier": "standard", "persona": "focused-code-implementer" },
  { "id": "reviewer", "executor": "claude", "tier": "analytical", "persona": "code-quality-reviewer" },
  { "id": "red-team", "executor": "codex-cli", "tier": "analytical", "persona": "edge-case-and-security-attacker" }
]
```

For a fix round, the fixer/recheck roster:

```json
"actors": [
  { "id": "fixer", "executor": "agy-cli", "tier": "standard", "persona": "surgical-fixer" },
  { "id": "reviewer", "executor": "claude", "tier": "analytical", "persona": "code-quality-rechecker" },
  { "id": "red-team", "executor": "codex-cli", "tier": "analytical", "persona": "relentless-code-attacker" }
]
```

`persona` is free-form prose the executor receives as framing, not a
closed vocabulary (`schema.mjs:133` `ACTOR_ALLOWED_KEYS`) -- swap any of
these strings for a more specific brief when the change calls for it (a
security-sensitive diff wants an even sharper red-team persona than the
default above), but keep the roster's shape (doer/fixer, reviewer,
red-team) and the executor/tier mapping unless there is a real reason to
diverge.

## Recipe: `fgos-plan-loop`'s sections 1-4, with two substitutions

Follow `fgos-plan-loop`'s own sections "1. Open a cell" through "4. Close
a cell" exactly as written there (worktree creation, `open.json`, reading
results/disposition, `fix-N.json`, `close.json`, the Lead's own merge) --
not restated here. Only two things differ for this skill, both naming
substitutions, nothing procedural:

1. Wherever that walkthrough names `<track>-<cell-id>` (worktree path)
   and `<track>--cell-01` (`coordinationId`), use `<change-slug>` and
   `code-panel--<change-slug>` instead -- there is no track, so there is
   no separate cell-id component.
2. Wherever `objective` would point at a `phase-NN-*.md` file, write the
   actual code change directly as plain text instead -- no phase file is
   required for a single-cell change.

Use the actor roster above (not `fgos-plan-loop`'s own generic personas)
in every `open.json`/`fix-N.json`/`close.json` you compose this way. No
`index.md`, no track directory, no cross-cell sequencing -- one change,
one cell, done.
