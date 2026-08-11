# Plan: link the skill-prose verify standard from fgos-coding-exploring/fgos-coding-planning

tsk-rlv

Mode: tiny

## Direct note

Two files, one added pointer paragraph each, no split (CONTEXT.md D2).

**Both** `fgos-coding-exploring/SKILL.md` and `fgos-coding-planning/SKILL.md` get the
pointer, not just one — CONTEXT.md's D2 said "and/or" and left the exact
placement to this step. Deciding here: `fgos-coding-exploring`'s own Handoff
section states a tiny item can go "straight to `executing`" without ever
reaching `fgos-coding-planning` — the skill that actually "designs" a verify
command per its own step 5. If the pointer only lived in `fgos-coding-planning`,
a tiny skill-prose item that skips straight from `clarify` to `executing`
(exactly tsk-1x7's own shape) would still never see it. Both files need
it independently; this is not redundant coverage, it is coverage for two
different real paths through the FSM.

## Files touched

- `.claude/skills/fgos-coding-exploring/SKILL.md`
- `.claude/skills/fgos-coding-planning/SKILL.md`

Add a short paragraph to each, near where each skill's own flow first
touches a verify command:

- `fgos-coding-exploring/SKILL.md`, step 1 ("Scope the gray areas"), right after
  the existing keyword-scout guidance: if the item touches a skill-prose
  path (`.claude/skills/**/SKILL.md`, `.agents/skills/**/SKILL.md`,
  `plugins/fgOS/skills/**/SKILL.md`), read
  `docs/how-to/write-verify-for-a-skill-prose-change.md` before proposing
  or approving this item's `verify` field — it documents the correct
  `npm test && POSITIVE && NEGATIVE` shape and the standing rebuttal for
  when the second-pass judge (`judgeVerifySemanticCorrectness`) demands
  proof of prose comprehension, a demand the doc says verify must never
  be asked to satisfy.
- `fgos-coding-planning/SKILL.md`, step 5 ("Leave execution alone" — the step
  that names, for each piece, the one command that proves it done): same
  pointer, phrased for the point where this skill is actually designing
  that command for a piece that touches a skill-prose path.

## Risk map

| Component | Risk | What would prove it |
|---|---|---|
| fgos-coding-exploring pointer | light | `verify` below: phrase present in fgos-coding-exploring/SKILL.md |
| fgos-coding-planning pointer | light | `verify` below: phrase present in fgos-coding-planning/SKILL.md |

No medium/high risk entries — two prose additions to skill docs already
fully scoped by CONTEXT.md D1/D2.

## Impact-analysis posture

`inactive` for this plan's own proof needs — documentation-only change,
no code edit, so no blast-radius evidence applies (recorded as `full`/
present in CONTEXT.md's scout evidence, for completeness only).

## Verify

```bash
npm test && grep -q "write-verify-for-a-skill-prose-change.md" .claude/skills/fgos-coding-exploring/SKILL.md && grep -q "write-verify-for-a-skill-prose-change.md" .claude/skills/fgos-coding-planning/SKILL.md
```

Broadens the item's own verify (set during `fgos-coding-exploring`, checked only
`fgos-coding-planning/SKILL.md`) to cover both files per this plan's own decision
above — the same `npm test && POSITIVE` shape the standard doc itself
prescribes, applied here to a skill-prose change about that exact standard.

## No split

One honest piece of work — two short prose additions to two files, same
change repeated. No `fgos add --parent` children created.
