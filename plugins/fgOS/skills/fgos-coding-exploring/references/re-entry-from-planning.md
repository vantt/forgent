# Re-entry from `fgos-coding-planning` (mid-planning gap)

`fgos-coding-planning`'s own hand-back step invokes this skill directly
when `CONTEXT.md` turns out silent on something material to the plan.
That re-entry is **not** a fresh exploring pass, and treating it as one is
the failure this reference exists to prevent.

Recognize it by the `fgos decision` planning is required to write before
handing back: a `planning->exploring hand-back:` line naming the gap, and
a rationale naming which scout actions were already tried. Read it from
`fgos list --id <id> --json`'s `data.decisions`, most recent last.

When re-entering this way:

- **Handle only the recorded gap.** Do not re-run Step 1's scan and do
  not generate a fresh 2-4 question set — CONTEXT.md's existing decisions
  already cover everything else, and re-asking what a prior round settled
  is exactly what Step 1's own "already-asked ground" rule forbids. The
  scout actions named in that rationale were already run; do not repeat
  them either.
- **Append, never rewrite.** Lock the answer as a new D-ID appended to
  CONTEXT.md's existing decisions table, and leave `## Outstanding
  questions` reading `None`.
- **Do not run the Gate, and do not record a new `contextApprove`.** It
  already ran once for this CONTEXT.md; the re-entry adds one decision,
  and asking "Approve CONTEXT.md before planning?" immediately after a
  person has just answered the Socratic question is the empty gate this
  design removes. If the gap resolved without needing a person at all,
  the new decision still reaches one — the plan built on it goes through
  `fgos-coding-validating`'s single gate.
- **`item.stage` stays `planning` throughout.** There is no
  `planning -> exploring` edge — this is a skill invocation, never a
  stage move. Hand back to `fgos-coding-planning` when the gap is closed.

Everything in SKILL.md's Flow and Gate sections applies to a normal
`exploring`-stage entry — an item that arrived here because `fgos
discover` returned `unclear` — not to this re-entry path.
