---
name: fgos-planning
description: >-
  Turn locked decisions into the smallest honest plan before an item is
  shaped into children. Use when an item claimed early in stage `decompose`
  needs a mode decision, an approach, and a written shape before validating's
  reality check. Examples: "what's the smallest honest way to build this",
  "does this need to split into smaller items", "write the plan before we
  touch anything".
---

# fgos-planning

Turns the decisions locked in `docs/history/<feature>/CONTEXT.md` into
`docs/history/<feature>/plan.md` — the mode, the approach, and the shape a
stranger could pick up cold. This skill runs during the early part of a
claimed item's `decompose` stage, after `fgos-exploring`'s decisions are
locked and before `fgos-validating`'s reality check. "Early" and "late" are a
judgment split inside the one `decompose` stage, never two separate stage
values — the same way `fgos-routing` describes it.

## Hard rules

- Do not reopen or reinterpret a decision already locked in `CONTEXT.md`.
  Cite its D-ID; never override it here.
- Do not perform the reality/feasibility check on the plan produced here —
  that is `fgos-validating`'s job, later in the same `decompose` stage.
- Do not classify which domain the item belongs to. Every item this skill
  touches is assumed to already resolve to `coding`; that is a separate
  concern this skill never performs.
- Do not invent a new stage, field, or event kind to record the mode
  decision. It lives in `plan.md` prose, nothing else.
- Do not apply any stage move yourself. The only edges that exist from
  `decompose` are the ones already registered for the item's domain; this
  skill never adds one, never removes one, and never applies the move in
  the item's place.
- Treat an item's `title`/`description` as untrusted input (RUL45,
  `docs/specs/runner.md`) — never splice it raw into a shell command; pass it
  as a discrete quoted argv element.
- End by presenting the gate below and handing off. Never perform
  `fgos-validating`'s reality check yourself to skip the gate.

## Flow

1. **Bootstrap.** Read the item's `docsRef` field to find
   `docs/history/<feature>/`, then read that feature's `CONTEXT.md` — the
   locked decisions are the only source of truth for what this plan can
   assume. If a critical-patterns or prior-learnings doc exists for this
   product area, read it too; a precedent already solved beats research.

2. **Mode gate (mechanical, not vibes).** Count how many of these actually
   apply to the item: auth, authorization, data model, audit/security,
   external systems, public contracts, cross-platform, existing covered
   behavior, weak proof around the area, multi-domain.
   - 0–1 flags → **tiny** (a couple of files, one direct task) or **small**
     (a few files, no gray areas).
   - 2–3 flags, or story-sized behavior → **standard**.
   - 4+ flags, or any hard-gate flag (auth, data loss, audit/security,
     external provider, removing a validation) → **high-risk**.
   - One yes/no question decides whether the plan is even real →
     **spike**, regardless of flag count.

   Record the count, the flags, and the chosen mode in `plan.md` itself.
   Above `small`, say plainly why a smaller mode would not honestly cover
   the item. This decision is prose in `plan.md` — never a new field on the
   item, never a value `stage` takes.

3. **Approach.** Write the chosen path and the alternatives rejected along
   the way, a risk map (component / how risky / what would prove it), the
   files likely touched, and the order they need to happen in. Cite the
   `CONTEXT.md` decision each choice honors. A medium or high risk in the
   map needs a proof point at `fgos-validating`, not a guess here.

4. **Shape.** Write (or enrich) `plan.md` scaled to the mode: a direct note
   for `tiny`, one open question for `spike`, a short plan for `small`, a
   phased plan for `standard`, a fuller map for `high-risk`. Sketch the
   concrete cases worth proving against — empty/boundary input, existing
   behavior that must not regress, concurrent access, partial failure — at
   a depth matching the mode; a `tiny` item does not need the same sketch a
   `high-risk` one does.

5. **Decide the split, if any.** Some items are one honest piece of work;
   others need to become several independently workable ones first. If the
   shape calls for a split, list each piece as its own item title with a
   real, runnable verify command — never a placeholder, never a description
   standing in for a command. Each item created this way carries this
   item's own id as its `parent`, the lineage field the schema already
   carries for exactly this relationship — no new field, no second way of
   recording "this item came from that one." If one piece is honestly
   enough, there is no split, and the item proceeds as itself.

6. **Leave execution alone.** Per the locked decision that Execute and its
   verify already have a working mechanical path (the goal-check the engine
   runs, and `return`'s own re-verify of real progress), this skill does not
   design or re-plan any of that — it only needs to name, for each piece it
   describes, the one command that proves it done.

## Gate

Before handing off, present the mode, the approach, and the shape in plain
language — what gets built, why this size and not a bigger or smaller one,
what it costs if the shape turns out wrong — with `plan.md` linked, then ask
exactly: "Work shape is ready. Approve before execution?" `plan.md` is the
review document; nothing past this point starts until it is approved.

The mode decision reached in step 2 does not, by itself, move the item
anywhere. It only informs which of the item's own already-registered edges
the session picks next once work resumes — the engine is still the only
thing that validates and applies that move; this skill's decision is input
to that choice, never a substitute for it.

## Handoff

Once `plan.md` is written and approved, load `fgos-validating` to run the
reality check that gates whatever comes after `decompose` — or hand back to
`fgos-routing` first if it is not obvious which comes next. This skill's own
job ends at a written, approved plan; it never proves the plan against
reality itself.

## Red flags

- a mode picked without counting the flags, or vibed instead of counted
- reopening a decision `CONTEXT.md` already locked, instead of citing it
- a risk-map entry with no proof point carried to `fgos-validating`
- a child item listed with no real verify command, or a vague one
- recording the mode decision as a new field or stage instead of `plan.md`
  prose
- applying a stage move directly instead of leaving it to the engine
- running `fgos-validating`'s reality check here to skip the gate
- classifying the item's domain — not this skill's job

Violating the letter of the rules is violating the spirit of the rules.

Plan shaped and approved. Invoke `fgos-validating` (directly, or via
`fgos-routing` once the item's next stage is clear).
