# plan.md — tsk-3i6

Mode: tiny

## Approach

**No CONTEXT.md exists for this item** — discovery's verdict was `clear`
(see `RESEARCH.md` Round 1), which skips `exploring` and therefore skips
CONTEXT.md creation. There are no locked decisions to cite; the approach
below traces to `RESEARCH.md`'s own citations instead.

**Chosen path.** Two edits, both docs-only, no code touched:

1. `docs/specs/runner.md`'s `### 0005 — Runner & cô lập worker` ADR entry
   (line ~1123, under `## Lịch sử quyết định retired từ docs/decisions/`):
   add the two fgOS-specific evidence citations
   (`docs/history/agy-cwd-fidelity/RESEARCH.md` — agy cwd bug;
   `.agents/skills/fgos-fanout/SKILL.md:159-166` — fanout worktree race) to
   the "Bối cảnh"/"Hệ quả" prose, replacing the implicit
   "don't-trust-self-report" framing with fgOS's own real threat model
   (unintentional worker drift, not adversarial swarm gaming), and correct
   the "a human always reviews before merge" assumption against the real
   unattended batch-approve loops (`/fgOS:merge-loop`,
   `/fgOS:cleanup-loop`) per `AGENTS.md`'s priority #2.
2. `docs/routing-handoff-contract.md:81`'s `## Tham chiếu` line: replace
   the dead `docs/history/phase-2-routing/CONTEXT.md D3/D4` citation with a
   pointer at `docs/specs/runner.md`'s ADR-0005 entry (the now-updated
   narrative from edit 1).

**Alternatives rejected.**
- *Restore `docs/history/phase-2-routing/CONTEXT.md`* — rejected: that file
  was deliberately untracked in `e9999863` ("chore: untrack workshop tree
  from product repo"), not lost by accident; resurrecting it fights that
  decision instead of following the retirement convention `AGENTS.md`
  already documents (narrative lives in `docs/specs/<area>.md`'s own
  "Lịch sử quyết định", tsk-1lv-4).
- *Give `docs/routing-handoff-contract.md` its own new `## Lịch sử quyết
  định` section* — rejected: `docs/specs/runner.md` already carries the
  substantively identical ADR-0005 decision this D3 traces to; adding a
  second narrative home for the same decision would fork the record
  instead of completing it.

**Risk map.**
| Component | How risky | What proves it |
|---|---|---|
| `docs/specs/runner.md` ADR-0005 edit | light — prose-only, no schema/behavior change | `verify` command greps for the two new citations landing in the file |
| `docs/routing-handoff-contract.md:81` edit | light — one dead citation swapped for a live one | `verify` command greps that the dead path is gone |

Both components are `light`; no proof point beyond the `verify` command is
needed (no medium/high-risk entry in this map).

**Impact-analysis posture:** not invoked — this plan touches no code (two
markdown files only), so no proof point here leans on blast-radius
evidence; the capability gate's trigger condition (`approach-and-shape.md`:
"Before writing a proof point that would lean on blast-radius evidence")
does not fire. `impact-analysis: not-applicable` (docs-only change, not a
skipped/degraded gate).

**Files touched, in order:**
1. `docs/specs/runner.md` (ADR-0005 section) — edited first, since edit 2
   points at it.
2. `docs/routing-handoff-contract.md` (line 81) — edited second, now that
   it has a live target to cite.

`fgos graph --json` was run; the graph carries 583 components across 1053
nodes but this item sits in its own singleton/small component with no
recorded dependents or blockers relevant to a two-file docs edit — ordering
above is decided by "edit the cited target before the citer", not by
`criticalPath`/`topUnblock` (the latter was skipped in this graph's own
output — too large a run to compute for this item's own signal).

## Shape

Direct note (tiny lane, no phased plan needed): edit ADR-0005's prose in
`docs/specs/runner.md` to add the two evidence citations and correct the
review-cadence assumption, then swap the dead citation at
`docs/routing-handoff-contract.md:81` for a pointer at that same ADR-0005
entry. No new files, no new sections beyond what already exists in
ADR-0005; no test changes (this repo's `npm test` suite does not assert on
this section's prose content — confirmed by `verify` being a targeted
`grep`, not a suite run).

Concrete cases worth checking: the edited ADR-0005 prose must still read
coherently as one entry (not two competing rationales bolted together);
the swapped citation at line 81 must not silently drop the still-valid
`D4` half of the old citation (D4 covers worktree isolation, which ADR-0005
also already documents in full).

## Outstanding questions

None
