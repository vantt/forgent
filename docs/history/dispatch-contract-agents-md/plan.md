# Plan — tsk-2te

Mode: tiny

**Lane decided per `fgos-routing`'s Mode-gate (no lane was handed off by
`/fgOS:cook`, which does not run an Orient step of its own; applying the
gate directly, tsk-da1's direct-entry fallback branch 3).** Flag count: 0
of the 10 hard-gate flags apply — no auth, no authorization, no data
model, no audit/security surface, no external system, no public/API
contract, no cross-platform concern, no existing covered behavior at
risk, no weak-proof area, single domain (`coding`). 0 flags → **tiny**: a
single file touched, one direct task.

No `docsRef`/`CONTEXT.md` existed for this item — `tsk-2te`'s discovery
verdict was `clear` (see `RESEARCH.md` Round 1), which skips `exploring`
entirely per `fgos-coding-discovering` D2, so no `CONTEXT.md` was ever
written. This feature folder (`docs/history/dispatch-contract-agents-md/`)
was established at the discovery stage by the research round itself;
`plan.md`'s claims below trace back to that round's findings, not to a
locked-decisions table (none exists — nothing here needed a product
decision to material outside the research itself).

## Approach

**Chosen path:** write a short, new `## Dispatch` section into `AGENTS.md`
(the always-loaded project contract) that names the shipped
`decide`/`execute`/`--work` CLI surface of `src/runner/dispatch.mjs` and
points any new skill wanting to dispatch to a capacity at the existing
shared fragment `.agents/skills/_shared/capacity-dispatch-fallback.md`
(mirrored to `.claude/skills/_shared/`) instead of hand-rolling the
branch logic — this is exactly the write tsk-5tm's own decision **D7**
deferred until its precondition shipped (`RESEARCH.md` Round 1: `execute`
subcommand and `decide --work` are both confirmed live on `main`).

**Alternatives rejected:**
- *Do nothing (mechanism is already adopted everywhere it needs to be).*
  Rejected — `RESEARCH.md` Round 1 confirms `AGENTS.md` currently has zero
  mentions of `dispatch`, and D7 named this exact gap as deliberately
  deferred, not abandoned. Leaving it undone means the doctrine only lives
  in `docs/history/task-dispatch-unification/` and per-skill fragments,
  never in the one document every session in this repo reads
  unconditionally.
- *Write a full new `docs/how-to/` or `docs/explanation/` page instead of
  touching `AGENTS.md`.* Rejected — a new standalone doc was already
  written for wiring a *new skill* through the fragment
  (`docs/how-to/reuse-the-shared-capacity-dispatch-fallback-fragment.md`,
  `RESEARCH.md` Round 1) and does not need a duplicate. What is missing is
  specifically the always-loaded summary D7 asked for, not another
  standalone reference page.
- *Rewrite/expand the how-to doc instead.* Rejected — same reason: D7's
  gap is about `AGENTS.md` specifically (the doc every agent acts on
  immediately), not about improving an already-adequate how-to.

**Risk map:**

| Component | How risky | Proof point |
|---|---|---|
| `AGENTS.md` prose addition | light — pure documentation, no code/test/behavior change | `verify` command (below) confirms the section exists and names both the CLI surface and the shared fragment |

No component here leans on blast-radius/impact-analysis evidence (no code
is touched), so the `CLAUDE.md` impact-analysis capability gate does not
apply to this plan.

**Files touched:** `AGENTS.md` only.

**Order:** single piece, no ordering question — `fgos graph --what-if`
comparison across candidates only matters when more than one piece
competes for "goes first" (step 4); there is exactly one piece here.

## Shape

One direct task, no split. `AGENTS.md` gets one new section (working
title `## Dispatch — Applying a Capacity` or similar, exact heading left
to Execute's own editorial judgment) containing:

1. What `src/runner/dispatch.mjs`'s CLI surface is: `decide <capacityId>`
   / `decide --for <purpose>` / `decide --work <workId>` to resolve which
   executor a job should run under, and `execute` for the
   adapter-resolvable self-execute path (tsk-5tm-3 D5).
2. A pointer for any new skill that needs to dispatch to a capacity:
   consult `.agents/skills/_shared/capacity-dispatch-fallback.md`
   (mirrored at `.claude/skills/_shared/`) rather than re-deriving the
   branch logic — cite `docs/how-to/reuse-the-shared-capacity-dispatch-
   fallback-fragment.md` for the full wiring steps.

Concrete cases worth checking at Execute time (proportional to `tiny`):
the new section must not contradict the "Always Do"/"Never Do" GitNexus
rules already in `AGENTS.md` just above it, and must not duplicate
content already fully covered by the how-to doc (link to it instead of
re-explaining the wiring steps).

## Verify

Already synced onto the item at discovery (`fgos-coding-discovering` set
a real command, not a placeholder, so no `fgos edit --verify` sync is
needed here):

```
grep -q "dispatch.mjs" AGENTS.md && grep -q "capacity-dispatch-fallback" AGENTS.md && echo VERIFY_OK
```

## Outstanding questions

None
