# fgOS stage-skills Task-delegation audit (tsk-29i) — plan

## Mode

**Small.** Flag count: 0 of the 10 mode-gate flags apply — no auth,
authorization, data model, audit/security, external systems, public
contracts, cross-platform, existing covered *behavior* (the mirror
structure these edits touch is covered by `test/skills/fgos-mirror.test.mjs`,
but that test is the plan's own proof surface, not a pre-existing behavior
this change risks regressing), weak proof, or multi-domain concern. This
stays out of `tiny` only because 6 files move (3 skills × 2 mirrored
trees), not because any flag pushed it up — a few files, no gray areas, one
mechanical pattern repeated three times.

## Approach

Add one new hard rule to each of `fgos-coding-planning/SKILL.md`,
`fgos-coding-validating/SKILL.md`, `fgos-coding-implement/SKILL.md` (both
`.claude/skills/` and `.agents/skills/` — kept byte-identical, same
discipline `fgos-coding-exploring`'s own fix already followed), forbidding ad hoc
Agent/Task-tool delegation of that skill's own reasoning surface and
pointing a genuine different-backend need at
`../_shared/capacity-dispatch-fallback.md` — mirroring the rule already
committed to `fgos-coding-exploring/SKILL.md` (`2bc193d`, corrected `8c1dab1`),
never copy-pasted verbatim: each rule names *that skill's own* reasoning
surface, not `fgos-coding-exploring`'s.

**Alternative rejected:** rely on `fgos-coding-validating`'s existing D6
"no second reader/review pass" rule instead of adding a parallel one there
— rejected per `CONTEXT.md` D1 (locked with the user): D6 is scoped to a
different concern (review-pass ceremony, explicitly out of scope this
slice) and carries no capacity-dispatch escape valve, so leaning on it
alone would leave `fgos-coding-validating` inconsistent with the other two files.

**Alternative rejected:** add a matching rule to `fgos-coding-driving` too
— rejected per `CONTEXT.md`'s own audit finding: that skill has no
reasoning surface of its own to protect (pure mechanical stage-dispatch
loop; its own hard rules already forbid it from re-deriving anything a
stage-skill decides). Auditing it was in scope (`CONTEXT.md` D2); adding a
rule to it was not, because the audit found nothing to fix there.

### Files touched (all independent, no ordering constraint)

- `.claude/skills/fgos-coding-planning/SKILL.md` + `.agents/skills/fgos-coding-planning/SKILL.md`
- `.claude/skills/fgos-coding-validating/SKILL.md` + `.agents/skills/fgos-coding-validating/SKILL.md`
- `.claude/skills/fgos-coding-implement/SKILL.md` + `.agents/skills/fgos-coding-implement/SKILL.md`

`fgos graph --json` shows `tsk-29i` in neither `topUnblock` nor
`criticalPath` (no deps, no children) — confirms these 3 edits have no
real ordering constraint between them; each names a different skill's own
reasoning surface, so they don't even conflict on the same lines.

### Risk map

| Component | Risk | What proves it |
|---|---|---|
| Rule text drifts from what `CONTEXT.md`/this plan describes | low | `fgos-coding-validating`'s reality gate reads the actual diff against this plan |
| `.claude/`/`.agents/` mirrors go out of sync | low | `test/skills/fgos-mirror.test.mjs` (existing, unmodified) — the verify command below runs it |
| A rule only says "see the shared fragment" without actually stating the prohibition (the exact failure `tsk-29i`'s own `fgos discover` second-pass caught 3 times during clarify) | medium | verify command below greps for both the fragment pointer AND the "never delegate" prohibition phrase, not just one |

Impact-analysis posture: **not applicable** — this change touches no code
symbol (prose-only `SKILL.md` edits), so no proof point here leans on
blast-radius evidence; `CLAUDE.md`'s capability gate is not a dependency
of this plan. (For the record, `fgos tool query` reported GitNexus
`present` but the repo's own hook flagged the index stale right after the
prior commit — degraded, not full — noted here only because `fgos-coding-exploring`'s
own scout already recorded it in `CONTEXT.md`, not because this plan needs it.)

## Shape

One direct task, three repetitions of the same edit shape:

1. In each skill's `## Hard rules` list, add a bullet forbidding ad hoc
   Agent/Task-tool delegation of *that skill's own* reasoning surface:
   - `fgos-coding-planning` — step 3 "Approach" (risk map, ordering) and step 4
     "Shape" (the plan itself) are the reasoning this skill exists to do
     directly.
   - `fgos-coding-implement` — step 2 "Implement" (and, narrower, step 4's
     Iron Law classification) is the reasoning surface.
   - `fgos-coding-validating` — step 2 "Reality gate" and step 3 "Feasibility
     matrix" (the evidence-gathering judgment this skill exists to do
     directly) — worded as its own rule, parallel to (not replacing) the
     existing D6 "no second reader" rule.
   Each bullet: states the prohibition ("never delegate ... to the
   Agent/Task tool"), cites the same Native-First Dispatch Doctrine
   rationale (`docs/decisions/0026-...md` rule 2, the `tsk-1ni` waste
   class), and points a genuine different-backend need at
   `../_shared/capacity-dispatch-fallback.md` — same shape as
   `fgos-coding-exploring`'s own rule, reworded per skill.
2. Copy each edited `.claude/skills/<name>/SKILL.md` byte-for-byte onto
   `.agents/skills/<name>/SKILL.md` (the existing mirror discipline every
   `fgos-*` skill already follows).
3. Run `test/skills/fgos-mirror.test.mjs` to confirm the mirror still
   holds.

No split (step 5) — this is one honest piece of work; all three edits
land in a single commit, same as `fgos-coding-exploring`'s own fix did.

## Proof surface

```bash
for f in .claude/skills/fgos-coding-planning/SKILL.md .claude/skills/fgos-coding-validating/SKILL.md .claude/skills/fgos-coding-implement/SKILL.md .agents/skills/fgos-coding-planning/SKILL.md .agents/skills/fgos-coding-validating/SKILL.md .agents/skills/fgos-coding-implement/SKILL.md; do grep -q "capacity-dispatch-fallback.md" "$f" || exit 1; tr "\n" " " < "$f" | grep -qi "never delegate" || exit 1; done && node --test test/skills/fgos-mirror.test.mjs
```

This is the exact command already locked as `tsk-29i`'s own `verify` field
via `fgos discover --verdict clear` (recorded after 3 rounds of a live
second-pass dispute during `fgos-coding-exploring` — the earlier drafts accepted
a bare fragment-name mention or a fragile line-based regex; this one
requires both the fragment pointer and the prohibition phrase, per file,
newline-normalized).

## Assumptions

- Each new rule's exact wording is an implementation-only detail
  (`fgos-coding-implement`'s call, matching the pattern already proven on
  `fgos-coding-exploring`) — not material to `CONTEXT.md`'s locked decisions, so
  no mid-planning gap back to `fgos-coding-exploring` is needed (step 7).
