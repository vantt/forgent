# Plan: submit's dependency-candidate scan misses `delivered` items (tsk-68j)

Mode: tiny

## Approach

Apply D1 (`docs/history/tsk-68j/CONTEXT.md`) directly: change the
dependency-candidate scan command in both call sites from `list --json`
to `list --all --json`. No alternative approach considered beyond the
three options CONTEXT.md already weighed and settled (D1) — this step is
pure application of that locked decision, not a fresh design choice.

`fgos graph --json` shows tsk-68j with no deps and no children (isolated,
component size 1) — the two files below have no ordering dependency on
each other or on any other in-flight item; either can be edited first.

Impact-analysis posture: GitNexus registered and `present` (per
CONTEXT.md's own posture note) — not applicable here regardless, since
this proof point rests on grep/text evidence in two Markdown files, not a
code-graph blast radius.

**Files touched** (either order):
- `plugins/fgOS/skills/submit/SKILL.md:70` — step 2's scan command:
  `list --json` -> `list --all --json`.
- `plugins/fgOS/skills/cook/SKILL.md:97` — step 1's scan command,
  currently `scan \`fgos list --json\` for a textually-grounded dependency
  candidate` -> `scan \`fgos list --all --json\` for a textually-grounded
  dependency candidate`.

**Risk:** trivial (flag count 0 per `fgos-routing`'s Mode gate — no auth,
data model, audit/security, external system, public contract,
cross-platform, or multi-domain flag applies). One-word-argument change to
prose, no code path affected, no existing covered behavior touched.

## Shape

Direct note (tiny mode, no phased breakdown needed):

1. In `plugins/fgOS/skills/submit/SKILL.md`, change the fenced command on
   line 70 from `list --json` to `list --all --json`.
2. In `plugins/fgOS/skills/cook/SKILL.md`, change the inline command on
   line 97 the same way.

Concrete case this is meant to fix: a `delivered`-but-not-yet-`cleanup`
item (like tsk-17m in the item's own cited history) now appears in the
scan's candidate set for both `/fgOS:submit` and `/fgOS:cook`, instead of
being invisible to it.

No split — this is one honest, single-piece change; no child items are
warranted.

## Execute

**Verify** (per `docs/how-to/write-verify-for-a-skill-prose-change.md` —
both touched files are skill prose, `npm test` plus a POSITIVE/NEGATIVE
pair; confirmed both target strings are the ONLY occurrence of `list
--json` in their respective files, so a plain `grep -q` scoped to each
file is precise with no hidden-dir/glob-exclusion risk):

```
npm test && grep -q 'list --all --json' plugins/fgOS/skills/submit/SKILL.md && grep -q 'list --all --json' plugins/fgOS/skills/cook/SKILL.md && ! grep -q 'list --json' plugins/fgOS/skills/submit/SKILL.md && ! grep -q 'list --json' plugins/fgOS/skills/cook/SKILL.md
```

This does not, and is not asked to, prove that a wider candidate set
actually surfaces a real duplicate correctly, or that submit's own
confirm/reject gate still behaves right against a larger candidate pool —
that is prose comprehension/coherence, owned by merge review, not by
`verify`.

## Outstanding questions

None
