---
framework: diataxis
mode: how-to
---
# How to write a task-spec

Task-specs live at `domains/<domain>/task-specs/<id>.md` for a
domain-specific spec, or `core/task-specs/<id>.md` for a domain-agnostic
one (D7/D27). They are the
**contract** half of D6's task/skill split (tsk-2t9c) — what a piece of
work is, not how to do it. A-lite (D6): read-first material a soul reads
via `refs`, not yet enforced by the engine.

## Litmus test: does this content belong in the task-spec?

- Changes if you swap **who does the work** → belongs in the **skill**.
- Names **input/output/gates/verify** — true no matter who does it →
  belongs in the **task-spec**.
- Is a fact about **this repo/brand/project** → belongs in **context**
  (`refs`/`docs/`), cited from the spec, never duplicated into it.

## Required sections

1. `## Input` — what this task assumes already exists.
2. `## Output` — what "done" produces, concretely.
3. `## Gates` — any checkpoint this task's own output must pass, and
   whether it is hard (D5: side effect crosses the item/worktree
   boundary) or soft (re-crossable, reason recorded).
4. `## Verify-template` — the shape of proof this task's output must
   carry, or `N/A` when the task produces no code artifact.
5. `## Collaboration` (D9, mandatory) — a trigger-prose table: *when* to
   call, *which* reason (`advise`/`assist`/`review`/`consult`), *to which*
   position, *what the returning ball carries*. This is what lets a soul
   know when to hand off instead of guessing — never invent a trigger
   that has no real precedent; migrate it from wherever the behavior
   already lives (a skill's own prose, an existing filter/rule).

## Position header

Every spec names, right under the title, the domain and either a
`stage:` (for the five task-specs a workflow stage owns directly, see
`taskSpecMap` in `src/state/workflow-stage-graphs.mjs` — corrected count,
tsk-2t9c D16: `taskSpecMap` has always had five entries, one per
`discovery`/`exploring`/`planning`/`executing`/`retrospective`) or a
`position: <role> | reason: <call-reason>` pair (for a task-spec reached
only via a call). A spec may also carry `authority: <name>` when only
some agent-types/roles may exercise it (e.g. `hard-gate` for
`approve-merge`).

## Registering a new one

1. Write the file at `domains/<domain>/task-specs/<id>.md` (or
   `core/task-specs/<id>.md` for a domain-agnostic spec).
2. If the task owns a stage directly, add it to that domain's
   `taskSpecMap` in `src/state/workflow-stage-graphs.mjs`.
3. Run `fgos doctor` — the `task-specs-resolve` check confirms every
   `taskSpecMap` entry resolves to a real file, and `agent-claims-resolve`
   confirms every agent-type's `claims` (if any) name real specs.

## What NOT to do

- Don't copy prose from the skill that executes it — migrate, don't
  duplicate; a spec and its skill drifting apart is worse than neither
  existing.
- Don't invent a policy nobody has agreed to just to fill a section —
  stop and raise it instead (same discipline `fgos-coding-planning`
  applies to its own plan.md).
- Don't build engine enforcement (schema validation, verify-template
  matching) speculatively — climb that ladder only on its own real
  symptom (see `docs/history/fgos-marketing-domain-foundation/plan.md`'s
  own Assumptions section for the concrete signals).
