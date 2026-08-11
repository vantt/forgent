---
type: plan
title: Revive gate-bypass — wire the `## Outstanding questions` convention into the artifact-writing skills
tags: []
timestamp: 2026-08-08T00:00:00.000Z
source_capture_ids: []
---

# Plan

Mode: tiny

Flag count: 0 of the 10 lane flags (auth, authorization, data model,
audit/security, external systems, public contracts, cross-platform,
existing covered behavior, weak proof around the area, multi-domain) apply.
This is a couple of files, one direct task, decided down to the exact
grep/verify commands already in `CONTEXT.md`'s D1-D3 — no gray areas left
for this step to resolve. `fgos graph --json` confirms `tsk-5hg` carries
`deps: []` and sits in its own isolated component (component size 1 once
`.fgos/state.json`'s edges are read) — nothing else needs to land first or
after it.

## Approach

Chosen path: add one instruction to each artifact-writing skill's own
"write the doc" step, teaching it to end `CONTEXT.md`/`plan.md` with a
literal `## Outstanding questions` section (`None` when nothing is
outstanding), per `CONTEXT.md` D1/D2. No alternative path was considered —
the fix is dictated entirely by what `hasOpenItems`' regex already requires
(`src/state/gate-bypass.mjs:116`), which this item is explicitly forbidden
from loosening.

Risk map:

| Component | Risk | Proof point |
|---|---|---|
| `.claude/skills/fgos-coding-exploring/SKILL.md` prose edit | Light — additive instruction, no existing step removed or reworded | `grep -q "^## Outstanding questions"` against the file itself (item's own `verify`) |
| `.claude/skills/fgos-coding-planning/SKILL.md` prose edit | Light — same shape, additive | same, against the other file |
| `src/state/gate-bypass.mjs` staying untouched | The one real risk this item could get wrong is scope creep into "loosening" the check | verify's own NEGATIVE clause: `! git diff --name-only main...HEAD | grep -q "^src/state/gate-bypass\.mjs$"` |
| `test/state/gate-bypass.test.mjs` regression coverage | Light — existing suite already covers `hasOpenItems`/`canAutoApprove`; this item adds no new code path to that file, only keeps it green | `npm test` (item's own `verify`, first clause) |

No proof point here leans on blast-radius/impact-analysis evidence — this
item changes prose instructions read by an LLM at skill-load time, not a
code symbol a call graph would trace, so `CLAUDE.md`'s impact-analysis gate
is not invoked for a proof point (already queried once, informationally, in
`CONTEXT.md`'s scout evidence: `gitnexus`, `status: present`, posture
`full`).

## Shape

Add one short instruction to each `SKILL.md`'s existing artifact-writing
step:

- **`fgos-coding-exploring/SKILL.md`**, in its "Write the decision doc" step
  (the step that already lists what `CONTEXT.md` must cover): append that
  the doc must end with a `## Outstanding questions` section — `None`
  (optionally with a short trailing clause, matching the existing
  convention already used by 128/197 `CONTEXT.md` files) when every
  candidate question was locked or deferred, otherwise a real list of what
  is still open for `fgos-coding-planning`.
- **`fgos-coding-planning/SKILL.md`**, in its "Shape" step (the step that already
  scales `plan.md`'s content to the mode): append the identical
  instruction for `plan.md` — same heading, same `None`-or-list body. Per
  `CONTEXT.md` D2, this will almost always read `None` since step 6
  (Mid-planning `CONTEXT.md` gap) already routes any material open
  question back into `CONTEXT.md` before this section is ever written.

Concrete cases worth proving, matching a `tiny` item's depth (no split, no
concurrency/partial-failure surface — this is a static prose file):

- A `CONTEXT.md`/`plan.md` written after this change, with nothing left
  open, ends with `## Outstanding questions` / `None` — `grep -q` passes.
- Neither `SKILL.md` file's own prose is otherwise altered — the instruction
  is additive, appended to an existing numbered step, not a rewrite.
- `src/state/gate-bypass.mjs` is untouched by this item's diff — the
  verify's NEGATIVE clause is the mechanical proof.

## Split

No split. One honest, already-minimal piece of work: two `SKILL.md`
prose edits plus keeping `test/state/gate-bypass.test.mjs` green — exactly
the item's own declared footprint, nothing more.

## Verify

The item's own `verify` field (tightened in `CONTEXT.md` D3, set via
`fgos edit`; the anchor was corrected during Implement to tolerate the
indented heading example each `SKILL.md` now carries — see D3's
implementation-time correction note):

```
npm test && grep -Eq "^[[:space:]]*## Outstanding questions[[:space:]]*$" .claude/skills/fgos-coding-exploring/SKILL.md && grep -Eq "^[[:space:]]*## Outstanding questions[[:space:]]*$" .claude/skills/fgos-coding-planning/SKILL.md && ! git diff --name-only main...HEAD | grep -q "^src/state/gate-bypass\.mjs$"
```

Per `docs/how-to/write-verify-for-a-skill-prose-change.md`: `npm test` is
the regression floor (already runs `test/state/gate-bypass.test.mjs` via
the repo's own `test/**/*.test.mjs` glob), the two heading-anchored greps
are the POSITIVE proof the new instruction actually landed in both files,
and the `git diff` clause is the NEGATIVE proof the one file this item must
never touch (`src/state/gate-bypass.mjs`) stayed untouched.

## Outstanding questions

None
