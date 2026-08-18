# Plan: fgos-coding-planning hand-back path for a material CONTEXT.md gap

## Mode

Flags counted (auth, authorization, data model, audit/security, external
systems, public contracts, cross-platform, existing covered behavior, weak
proof, multi-domain): **0**. No hard-gate flag, no yes/no spike question.

Mode: **small** — a few files, no gray areas left (CONTEXT.md's D1-D3 lock
everything this plan needs; nothing here is guessed). Not `tiny` because the
edit lands in 4 files, not "a couple," once the duplicate skill-copy fact
below is counted.

## Approach

Chosen path: pure documentation edit, no code, no schema/event change —
per D1/D3 this is a text-only fix to two skill docs' prose, nothing
mechanical to build.

**File-scope correction found during bootstrap** (not a new product
decision — a mechanical fact, diffed directly): `fgos-coding-planning/SKILL.md`
and `fgos-coding-exploring/SKILL.md` each exist as two byte-identical copies with
no sync script between them:

- `.claude/skills/fgos-coding-planning/SKILL.md` / `.agents/skills/fgos-coding-planning/SKILL.md`
  (verified identical via `diff`, no sync script found under
  `scripts/`/`package.json`)
- `.claude/skills/fgos-coding-exploring/SKILL.md` / `.agents/skills/fgos-coding-exploring/SKILL.md`
  (same)

So the real file list is 4 files, not 2 — both copies of both docs must be
edited identically or the two directories drift out of sync.

Alternatives rejected:
- Editing only `.claude/skills/*` and leaving `.agents/skills/*` stale —
  rejected, no sync mechanism exists, so this would silently reintroduce
  the exact "doc says one thing, real usage is another" gap D2 exists to
  close, just in the other copy.
- A code-level loop guard (anti-loop.mjs) for the hand-back path —
  rejected per D3, out of scope, deferred as a separate concern.

### Risk map

| Component | How risky | What would prove it |
|---|---|---|
| `fgos-coding-planning/SKILL.md` prose (both copies) | low — additive text, no existing flow step removed or reworded | re-read the Flow/Handoff sections after the edit: existing steps 1-6 and the Handoff paragraph must still read identically except for the new hand-back clause |
| `fgos-coding-exploring/SKILL.md` opening line (both copies) | low — one sentence corrected, no flow step touched | re-read the corrected line: it must state the path can also start mid-`decompose` via a direct `fgos-coding-planning` invocation, without weakening or removing the original clarify-stage description |
| Drift between `.claude/` and `.agents/` copies | low-medium if missed — silent doc divergence, no test catches it today (see below) | `diff` the two SKILL.md pairs after editing; must be byte-identical, same as verified pre-edit |

No proof point here leans on code blast-radius / call-graph evidence —
this is a prose-only change to two markdown files, not a symbol edit, so
`CLAUDE.md`'s impact-analysis capability gate is recorded for completeness
but does not gate anything in this plan: posture is **full** (`fgos tool
query --capability impact-analysis --status present` → `gitnexus`,
`status: "present"`, already recorded in `CONTEXT.md`'s scout evidence),
and GitNexus's code-symbol graph has no node for prose in a skill doc, so
there is nothing to run `impact()` against here.

No existing test covers `SKILL.md` prose content (these are agent-facing
instructions, not code under `test/`) — the only regression check
available is the `diff`-identical check on the two copies above, and a
plain read-through against the risk map. Recorded here rather than skipped
silently, per "weak proof" honesty.

## Shape

One direct piece of work, no split (see below). Two edits:

1. **`fgos-coding-planning/SKILL.md` — add hand-back route.** In the Flow section
   (after step 1 Bootstrap, or as its own short addition near step 4
   Shape/Handoff — exact placement is an editorial call, not locked by
   CONTEXT.md), add: when `CONTEXT.md`'s locked decisions are silent on
   something the plan needs and that gap is material (fails the same
   material/grounded/answerable filter `fgos-coding-exploring` already uses),
   invoke `fgos-coding-exploring`'s flow directly in this same session — no stage
   move, `item.stage` stays `decompose` (cite D1). If the gap is not
   material, pin it as a labeled assumption in this item's own `plan.md`
   Assumptions (cite the non-material path already documented in
   `CONTEXT.md`, container already checked by `fgos-coding-validating` line 75 —
   no new mechanism to build). Apply to both `.claude/` and `.agents/`
   copies (cite D2).

2. **`fgos-coding-exploring/SKILL.md` — correct opening line.** The current line
   "This skill runs while a claimed item's `stage` is `clarify`" is
   accurate for the normal entry path but no longer complete once (1)
   exists — `fgos-coding-planning` can invoke this flow directly while
   `item.stage` stays `decompose`. Correct it to say both: the normal
   entry (claimed item at stage `clarify`) and the direct-invocation entry
   (called by `fgos-coding-planning` mid-`decompose` for a material gap, no stage
   change). Apply to both copies (cite D2).

Concrete cases worth checking after the edit (small mode, lighter sketch
than standard/high-risk):
- A reader opening only `fgos-coding-planning/SKILL.md` cold can find the
  hand-back rule without needing to already know `fgos-coding-exploring`'s
  internals.
- A reader opening only `fgos-coding-exploring/SKILL.md` cold is not confused
  about why it might already be running against an item whose `stage`
  reads `decompose`, not `clarify`.
- Neither edit reopens or restates any of `fgos-coding-planning`'s or
  `fgos-coding-exploring`'s existing hard rules (e.g. "do not reopen a locked
  decision") — the new text only adds the missing exit path, cites
  `CONTEXT.md`'s D1, and does not relax anything already there.

## Split decision

No split. This is one honest piece of work — a two-doc, four-file text
correction with no independent sub-pieces; `fgos graph --what-if` is not
applicable since there is no candidate ordering between multiple pieces to
compare (see D-less note: only relevant when 2+ candidate pieces compete
for "goes first").

## Execution

Per the locked pattern that Execute/`return` already have a working
mechanical path, this plan names one proof point rather than designing new
machinery:

**Verify:** `diff .claude/skills/fgos-coding-planning/SKILL.md .agents/skills/fgos-coding-planning/SKILL.md && diff .claude/skills/fgos-coding-exploring/SKILL.md .agents/skills/fgos-coding-exploring/SKILL.md && grep -q "material" .claude/skills/fgos-coding-planning/SKILL.md && grep -q "fgos-coding-planning" .claude/skills/fgos-coding-exploring/SKILL.md`

(both copy-pairs stay identical after the edit; the new hand-back clause
exists in `fgos-coding-planning/SKILL.md`; the corrected opening line in
`fgos-coding-exploring/SKILL.md` mentions being invocable from `fgos-coding-planning`.)
