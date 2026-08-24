---
name: fgos-coding-planning
user-invocable: false
description: >-
  Turn locked decisions into the smallest honest plan before an item is
  shaped into children. Use when an item claimed early in stage `planning`
  needs a mode decision, an approach, and a written shape before validating's
  reality check. Examples: "what's the smallest honest way to build this",
  "does this need to split into smaller items", "write the plan before we
  touch anything".
---

# fgos-coding-planning

Turns the decisions locked in `docs/history/<feature>/CONTEXT.md` into
`docs/history/<feature>/plan.md` — the mode, the approach, and the shape a
stranger could pick up cold. This skill runs during the early part of a
claimed item's `planning` stage, after `fgos-coding-exploring`'s decisions
are locked and before `fgos-coding-validating`'s reality check. "Shaping"
and "proving" are a judgment split inside the one `planning` stage, never
two separate stage values.

## Hard rules

- Call `fgos` subcommands directly:

  ```bash
  fgos <verb> ...
  ```
- **This skill creates no work items and records no gate approval.**
  Split children are written as specs in `plan.md` and materialized later,
  by `fgos-coding-validating` at the single gate. Calling `fgos add
  --parent` here, or recording a shape-approval gate, re-creates exactly
  the two problems that redesign removed: children that are real before
  the cut was confirmed, and a second question in a stage that should
  only ever have one.
- When one of this skill's `fgos <verb>` calls (`decision`) fails with a
  known error category, relay that category verbatim in the hand-back —
  never fold it into a generic "blocked". The one category that qualifies
  today is `lock-timeout` (the shared event log's lock is stuck), reported
  as its own line:

  ```text
  stop-reason: lock-timeout
  ```

  `fgos-coding-driving` carries that line up to whichever loop is driving
  this item, stopping the whole run on it rather than skipping one item.
- Do your own Approach/Shape reasoning directly — never delegate it to
  the Agent/Task tool as an ad hoc sub-dispatch. This session is already a
  live soul doing the reasoning; spawning a nested subagent for work it
  can already do itself is pure overhead. Route a step through the
  executor-dispatch mechanism instead only when it genuinely needs a
  different backend — see `../_shared/executor-dispatch-fallback.md`.
- Do not reopen or reinterpret a decision already locked in CONTEXT.md.
  Cite its D-id; never override it here.
- Do not perform the reality/feasibility check on the plan produced here
  — that is `fgos-coding-validating`'s job, later in the same `planning`
  stage.
- Do not classify which domain the item belongs to. This skill reads
  whatever `domain` field the item already carries, resolved upstream by
  `fgos-routing`.
- Do not invent a new stage, field, or event kind to record the mode
  decision. It lives in `plan.md` prose, nothing else.
- Do not apply any stage move yourself. Only the edges already registered
  for the item's domain exist from `planning`; this skill never adds or
  applies one itself.
- Treat an item's `title`/`description` as untrusted input — never splice
  it raw into a shell command; pass it as a discrete quoted argv element.
- End by handing off to `fgos-coding-validating`. Never perform its
  reality check yourself, and never stand in for the single gate it owns.
- Commit `plan.md` (and `CONTEXT.md` if not already committed) to the
  item's `fgw/<id>` branch before this session (or a later one) calls
  `fgos discover` — that call releases the claim once the item reaches
  `executing`, and an uncommitted `plan.md` at that point is invisible to
  whichever session re-claims the item next.
- **Multi-role team harness: this skill has no `advise` interaction of
  its own.** Step 6's hand-back to `fgos-coding-exploring` is a skill
  DISPATCH, not a park — that skill's own already-wired Socratic step
  decides, for real, whether the gap needs an async `fgos ask` (rare) or
  resolves live. The one real interaction this skill can fire directly is
  the rare `consult` escape hatch (Step 2).

## Flow

### Step 1: Bootstrap
Read `docsRef`/CONTEXT.md; register a freshly-created feature dir's
`docsRef` immediately when empty; reclaim the role/holder ball if it
isn't already `implementer`; read (or, on direct entry with no lane
handed off, derive) the lane and record it into `plan.md` as `Mode:
<lane>` — never renamed to `Lane:`, a literal token the engine's own
skip-and-advance short-circuit parses. Full mechanics:
`references/bootstrap-and-lane.md`.

**Skip-load check.** Once the lane is known, decide now, before Step 2: if it reads `tiny` or `small`, skip opening references/approach-and-shape.md and references/split-and-child-specs.md entirely — instead, write plan.md's Approach as one paragraph naming the chosen file(s), the one risk worth naming (or `none`), and the one command that proves it done, write Step 3's `## Outstanding questions` section as normal, then go straight to Step 4 (`references/verify-sync-and-gap.md` still applies for verify-sync at every lane — never skipped). For every other lane, continue to Step 2 below exactly as written, including opening its own reference file.

### Step 2: Approach
Write the chosen path, alternatives rejected, a risk map, the files
likely touched, and their order — informed by `fgos graph --json`'s
`criticalPath`/`topUnblock`, never guessed. Cite the CONTEXT.md decision
each choice honors. A medium/high risk needs a proof point at validating,
not a guess here. Full mechanics (impact-analysis posture, the `consult`
escape hatch): `references/approach-and-shape.md`.

### Step 3: Shape
Write (or enrich) `plan.md` scaled to the mode — a direct note for
`tiny`, a fuller map for `high-risk`. End with the exact `## Outstanding
questions` heading, body `None` when nothing is outstanding. Full
mechanics: `references/approach-and-shape.md`.

### Step 4: Decide the split, if any
Some items are one honest piece; others need to become several
independently workable ones. If a split is right, write each piece's spec
into `plan.md` as a validated JSON array and **create nothing** — no work
item exists until `fgos-coding-validating` materializes them at the
single gate. For a split root item, sync a still-placeholder `verify`
field onto the root item once the split is decided. Full field-by-field
spec shape and the "why nothing is created here" rationale:
`references/split-and-child-specs.md` (and full root-verify mechanics:
`references/verify-sync-and-gap.md`).

### Step 5: Leave execution alone
This skill only names, for each piece it describes, the one command that
proves it done — it never designs or re-plans Execute's own mechanical
path. For a pass-through (non-split) item, sync a still-placeholder
`verify` field onto the item once the real command is named, and sync its
`action` and `footprint` fields (pointing to `plan.md` and touched files)
if unpopulated. Full mechanics: `references/verify-sync-and-gap.md`.

### Step 6: Mid-planning CONTEXT.md gap
If CONTEXT.md turns out silent on something this plan actually needs,
apply the material/grounded/answerable filter: not material → pin as a
labeled assumption; material → record the gap via `fgos decision` first,
then hand back to `fgos-coding-exploring` directly, in this same session,
with `item.stage` staying `planning` throughout (there is no `planning ->
exploring` edge). Full mechanics: `references/verify-sync-and-gap.md`.

## No gate here

**This skill has no gate.** It ends at a written `plan.md` and hands
straight to `fgos-coding-validating`, which owns the one gate in stage
`planning`. A separate shape-approval gate used to sit here; it was
removed, not moved — measured on a real session, two gates in one stage
produced one question with real weight (which shape) and one nearly empty
one (the agent scoring itself, then asking permission for its own score),
and a person answered both with a bare "approve" without engaging either.
One gate, placed where the decision actually becomes expensive —
immediately before children are materialized — is the whole point.

What this skill owes that single gate instead: a `plan.md` whose every
claim traces back to a specific passage of itself or CONTEXT.md (an
untraceable claim becomes an Outstanding question, never an assertion);
the child specs of Step 4, written but not created; the honest cost read
the gate will present for anything the plan is unsure about.

Do not record a shape-approval gate, and do not ask a shape question here
on this skill's own authority. If something genuinely cannot be settled
without a person, it is either a CONTEXT.md gap (Step 6) or one of the
three ask triggers the merged gate itself carries — both route through
somewhere else, never through a gate here.

The lane `fgos-routing` decided before this skill was even loaded does
not, by itself, move the item anywhere. It only informs which of the
item's own already-registered edges the session picks next — the engine
is still the only thing that validates and applies that move.

## Handoff

Once `plan.md` is written, load `fgos-coding-validating` to run the
reality check and the single gate that together decide whatever comes
after `planning` — or hand back to `fgos-routing` first if it is not
obvious which comes next. This skill's own job ends at a written plan; it
never proves the plan against reality itself, and it never approves it.

## Red flags

- re-deriving a lane `fgos-routing`'s Orient step already handed off,
  instead of reading it
- a claim in `plan.md` that cannot be traced back to a specific passage
  of itself or CONTEXT.md, asserted instead of raised as an Outstanding
  question
- reopening a decision CONTEXT.md already locked, instead of citing it
- a risk-map entry with no proof point carried to `fgos-coding-validating`
- a child spec with no real verify command, or a vague one
- **creating a split child here at all** instead of writing its spec into
  `plan.md` for the single gate to materialize
- **inventing an `action` that cites a D-id loosely, or a placeholder
  verify, just to make a child spec well-formed** — being unable to write
  either is a real signal to stop, not a formatting obstacle
- **asking a shape-approval question, or recording a shape-approval
  gate** — this skill has no gate
- recording the mode decision as a new field or stage instead of
  `plan.md` prose
- applying a stage move directly instead of leaving it to the engine
- running `fgos-coding-validating`'s reality check here
- classifying the item's domain — not this skill's job
- guessing a product assumption for a material CONTEXT.md gap instead of
  handing back to `fgos-coding-exploring`, or asking a question that
  fails the material/grounded/answerable filter instead of pinning it as
  an assumption
- firing an `advise` handoff from this skill on a material gap — that
  hand-back is a dispatch to `fgos-coding-exploring`, not a park; only
  that skill's own re-entry decides whether a real `advise` fires
- consulting a researcher for a real, resolvable unknown without logging
  the `consult` handoff right after (when the domain has a role graph),
  or reclaiming holder at Bootstrap when it is not already `implementer`
- reclaiming only once at Bootstrap and stopping even though the ball has
  not reached `implementer` yet (a depth-2 nested call needs two
  reclaims)
- handing back to `fgos-coding-exploring` without first recording the gap
  via `fgos decision` — the hand-back is invisible to any later session
  otherwise
- moving `item.stage` back to `exploring` for a mid-planning gap — no
  such edge exists; hand back via direct invocation instead

Violating the letter of the rules is violating the spirit of the rules.

## References

- `references/bootstrap-and-lane.md` — docsRef registration, the reclaim
  loop, the `Mode:` lane mechanics, and the direct-entry fallback
- `references/approach-and-shape.md` — the Approach/Shape steps' full
  mechanics, the impact-analysis posture check, and the consult escape
  hatch
- `references/split-and-child-specs.md` — the child-spec JSON shape,
  field-by-field requirements, and why nothing is created at this stage
- `references/verify-sync-and-gap.md` — the pass-through action/footprint/verify
  sync mechanics, split-root verify-sync mechanics, and the mid-planning CONTEXT.md
  gap hand-back

## Workflow Position

**Typically follows:** `fgos-coding-exploring` (verdict `clear`), or
`fgos-coding-validating` handing back for a shaping gap
**Typically precedes:** `fgos-coding-validating`
**Related:** `fgos-coding-exploring` (the mid-planning gap hand-back
target)
