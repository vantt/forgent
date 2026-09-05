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

## Non-Goals (inherited from `fgos-plan-loop`, restated because they
still apply here)

- No fgOS Work items, claims, `fgos pick/cook/submit`, or a fgos-runner
  loop, ever -- enforced at the schema boundary
  (`WORK_LIFECYCLE_KEYS`/`assertNoWorkLifecycleKeys`,
  `schema.mjs:46-50,98-114`), not merely by this skill's own discipline.
- No lifecycle stage, no `fgos-routing` involvement, no dashboard/UI of
  any kind. This is deliberately NOT a member of the `fgos-coding-*`
  stage-routed family (`fgos-coding-discovering/planning/validating/...`)
  even though both operate in the same repo -- this skill never reads or
  writes an item's `stage`, never claims anything through the pull door.
- No git authority inside the session -- the Lead merges the cell's
  worktree branch by hand, outside any coordination request, exactly as
  `fgos-plan-loop` requires.

## Known gap this skill inherits (`tsk-371`, not fixed yet)

`src/verbs/coordination/run.mjs`'s operation-step dispatch does not yet
forward a step's own declared `mutation: "mutating"` field into the
engine -- confirmed live during `group-thinking-plan-loop`'s own R5 proof.
Every mutating dispatch through `fgos coordination run` today is silently
graded `status: "failed"` regardless of whether the real work landed
correctly. **Until `tsk-371` lands, verify the doer/fixer's real outcome
yourself**, independently of the RunResult's own grading: check `git
log`/`git diff` in the cell's own worktree for the expected commit, and
run this project's real test command there. If the real commit and real
tests both check out, treat the step as genuinely successful for your own
disposition/close decisions, and note in the disposition rationale that
the `"failed"` grading is this known gap, not a real defect.

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

## Quick recipe

1. **Create the worktree** (plain git, outside any request -- Mutation
   Rule condition 3):

   ```sh
   git worktree add ../<change-slug> -b code-panel--<change-slug> <base-branch>
   ```

2. **Open the cell** -- one `open.json` with `coordinationId:
   "code-panel--<change-slug>"`, the roster above, and the three
   required-first-pass steps (`produce-candidate` for `doer`,
   `review-candidate` for `reviewer`, `red-team-candidate` for
   `red-team`) exactly as `fgos-plan-loop`'s own section 1 shows --
   `objective` on the `produce` step names the actual code change in
   plain text (a one-paragraph task description is enough; no
   `phase-NN.md` file is required for a single-cell change). Dispatch:

   ```sh
   fgos coordination run --cwd ../<change-slug> --file open.json
   ```

3. **Read results, disposition findings** -- `fgos coordination show
   <coordinationId> --json`, map Reviewer/Red-Team findings to
   accept/reject/deferred exactly as `fgos-plan-loop`'s own section 2
   describes (verifying the doer's real outcome yourself first, per the
   known gap above).

4. **Authorize + dispatch a fix round if needed** (`fix-1.json`,
   `fix-2.json`, ...) -- same shape as `fgos-plan-loop`'s own section 3,
   fixer/reviewer/red-team roster from above.

5. **Close** -- a `disposition` step with `disposition: "cell-closed"`,
   same as `fgos-plan-loop`'s own section 4. Then, outside the session:

   ```sh
   git -C <main checkout> merge --no-ff code-panel--<change-slug>
   git worktree remove ../<change-slug>
   ```

No `index.md`, no track directory, no cross-cell sequencing -- one
change, one cell, done.
