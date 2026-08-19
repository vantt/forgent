# plan.md — tsk-1mo

Mode: **tiny**

Flag count: 0 of {auth, authorization, data model, audit/security,
external systems, public contracts, cross-platform, existing covered
behavior, weak proof around the area, multi-domain} apply. This is a
two-location literal-string correction inside skill prose, no code path,
no schema, no external system. No `CONTEXT.md` exists — discovery's
verdict came back `clear` and skipped `exploring` — so this plan's lane
was decided directly from `fgos-routing`'s own Mode-gate subsection
(0–1 flags → tiny/small; this item has 0 flags and is a couple of files,
one direct task → **tiny**).

## Approach

Swap the wrong `--relation` verb in the `fgos decision` boilerplate that
`fgos-coding-validating`'s Gate step 2 prescribes for an auto-approved
`validateApprove` gate, at both mirrored copies of the file:

- `plugins/fgOS/skills/fgos-coding-validating/SKILL.md:364`
- `.agents/skills/fgos-coding-validating/SKILL.md:364`

Change `--relation supersedes:tsk-224` to `--relation touches:tsk-224`,
and correct the adjacent rationale wording from `"...as superseded by
tsk-224"` to `"...per tsk-224's own gate redesign"` so the prose matches
the corrected relation (RESEARCH.md round 1: the `--text` field is what
`decisionTextLooksLikeSupersession` actually checks, and it contains no
supersession language either way — the rationale-wording fix is for
honesty, not to satisfy that guard).

No alternative approach was considered: the item's own description
already names the exact fix, confirmed live against the repo
(RESEARCH.md round 1) and against `src/state/store.mjs`'s relation
vocabulary (`none|supersedes:<id>|touches:<id>` — `touches` is valid).

**Impact-analysis gate:** not applicable — this change touches only
prose inside two Markdown `SKILL.md` files, no code symbol. GitNexus's
`impact`/`detect_changes` tools operate over code symbols and have
nothing to assess here.

**Risk map:**

| Component | How risky | What proves it |
|---|---|---|
| Both `SKILL.md` mirrors edited identically | light — a literal find-replace at a cited line, confirmed present at both locations in RESEARCH.md round 1 | verify's two POSITIVE checks (one per file) |
| Rationale wording drift between the two mirrors | light — same edit applied to both files in one pass | verify's two POSITIVE checks catch a missed mirror |
| Any future auto-approved `validateApprove` gate reads the corrected boilerplate | light — this fix does not touch the 2 already-written bad decision events or the 25 flagged docs (explicitly out of scope per the item's own description) | out of scope, not this plan's proof burden |

No medium/high-risk entries — nothing here needs a proof point beyond
the verify command itself.

## Shape

Files touched:

- `plugins/fgOS/skills/fgos-coding-validating/SKILL.md` (line 364)
- `.agents/skills/fgos-coding-validating/SKILL.md` (line 364)

Both edits are the same two substitutions, applied once per file:

1. `--relation supersedes:tsk-224` → `--relation touches:tsk-224`
2. `"...as superseded by\n  tsk-224"` → `"...per tsk-224's own gate\n  redesign"` (the rationale prose immediately preceding the `--relation` flag in the same fenced boilerplate block)

Concrete cases worth proving against, at `tiny` depth:
- both files still say `supersedes:tsk-224` (pre-fix state) — verify's
  NEGATIVE clause catches an unfinished edit on either mirror;
- the two mirrors drift out of sync (one fixed, one not) — verify checks
  each file independently, so a partial edit fails.

No split: one honest piece of work, no children.

## Verify

Synced onto the item (`fgos edit --verify`, replacing the discovery-stage
placeholder-shaped check with the mandated skill-prose shape per
`docs/how-to/write-verify-for-a-skill-prose-change.md`):

```
npm test && grep -q 'relation touches:tsk-224' plugins/fgOS/skills/fgos-coding-validating/SKILL.md && grep -q 'relation touches:tsk-224' .agents/skills/fgos-coding-validating/SKILL.md && ! grep -q 'relation supersedes:tsk-224' plugins/fgOS/skills/fgos-coding-validating/SKILL.md && ! grep -q 'relation supersedes:tsk-224' .agents/skills/fgos-coding-validating/SKILL.md
```

POSITIVE: both mirrors now contain the corrected relation verb.
NEGATIVE: neither mirror still contains the wrong one. `npm test` guards
against an unrelated regression from the edit (unlikely for a prose-only
change, but the how-to's mandated shape includes it unconditionally).

## Outstanding questions

None
