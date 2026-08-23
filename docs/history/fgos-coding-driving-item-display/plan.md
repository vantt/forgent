---
type: explanation
title: "tsk-23z — plan"
timestamp: 2026-08-11T05:35:00.000Z
---

# tsk-23z — plan

Mode: small — 1 flag applies from `fgos-routing`'s Mode-gate list
("existing covered behavior": this touches `/fgOS:pick`'s already-shipped,
tested step 3, tsk-62x/tsk-62x-2). Everything else on that list (auth,
authorization, data model, audit/security, external systems, public
contracts, cross-platform, weak proof, multi-domain) does not apply — this
is internal dev-skill prose, not a wire/API contract, and the change is a
plain, well-scoped display step with a concrete verify. Three files touched
across two skills (two of the three are a byte-identical mirror pair that
change together), no gray areas — no direct-entry Orient step ran before
this session reached `decompose` (this item was driven straight from
`/fgOS:cook`, never routed through `fgos-routing`'s own Orient), so this
lane was derived directly from the Mode-gate table per `fgos-coding-planning`'s
own direct-entry fallback, not re-derived past an existing hand-off.

Impact-analysis posture: `full` (`gitnexus` present) but not applicable in
practice — every file this item touches is `SKILL.md` prose, no code
symbols for GitNexus's own graph to cover.

## Approach

No split — one honest piece of work, per `CONTEXT.md`'s own D1-D4 (already
locked: single insertion point in the driver, once-per-invocation, display-
only/no capability fork, `retro-next` explicitly out of scope). `fgos
graph --what-if` does not apply here: there is nothing to compare topUnblock/
criticalPath against when there is no candidate split.

Rejected alternative (already recorded as CONTEXT.md D1): duplicating the
display into `discover`/`decompose`/`discover-next`'s own `SKILL.md` files
instead of centralizing it in the driver. Rejected for DRY — see D1's own
reasoning, not re-litigated here.

Edit order (two edits, sequenced so nothing is ever half-consistent):

1. **`.claude/skills/fgos-coding-driving/SKILL.md`** — add the display step
   to the `Loop` section: right after the anchor/ceiling checks pass and
   `skill` is resolved for the iteration, but BEFORE the claim/`EnterWorktree`
   branch (so the position is identical whether the first actionable stage
   is `clarify`/`decompose` or `executing`) — print the claimed item's
   `title`/`description` via `fgos list --id <id> --json`, the same
   mechanism `/fgOS:pick`'s own (pre-refactor) step 3 already uses, treating
   both fields as untrusted text (plain-text display only, never executed
   or interpreted — carried forward from `pick`'s own existing constraint).
   Gate it on a local flag scoped to this one loop invocation ("has this
   call already shown the item once?") so it fires exactly once per
   `fgos-coding-driving` call (D2), never once per iteration.
   Mirror the identical edit into `.agents/skills/fgos-coding-driving/SKILL.md`
   in the same pass — the two files are byte-identical today (verified),
   and must stay that way.

2. **`plugins/fgOS/skills/pick/SKILL.md`** — simplify step 3: remove the
   title/description print block (now redundant — every `pick` call already
   invokes `fgos-coding-driving` at step 5, which shows it once per D1/D2),
   keep the `/fgOS:terminal` pane-rename call exactly as-is (out of scope —
   this item is about title/description only, not pane-rename).

## Proof surface

One command proves the whole item (already set on the work record, no
split to give separate ones to):

```
npm test && grep -q 'once per fgos-coding-driving invocation' .claude/skills/fgos-coding-driving/SKILL.md && grep -q 'once per fgos-coding-driving invocation' .agents/skills/fgos-coding-driving/SKILL.md && grep -q 'Rename the pane via' plugins/fgOS/skills/pick/SKILL.md && ! grep -q 'Then show the task description: read the claimed' plugins/fgOS/skills/pick/SKILL.md && ! git diff --name-only main...HEAD | grep -q '^src/'
```

Shape per `docs/how-to/write-verify-for-a-skill-prose-change.md` (this item
touches `.claude/skills/**/SKILL.md`, `.agents/skills/**/SKILL.md`, and
`plugins/fgOS/skills/**/SKILL.md`, so that how-to's own scope applies):
`npm test` first, then POSITIVE (the new anchor phrase exists in EACH
driver mirror independently, `pick` still has its rename call), then
NEGATIVE (`pick`'s old duplicate print phrase is gone; no `src/` file was
touched by a prose-only item).

**Correction (`fgos-coding-validating`'s own reality-gate pass, repo-fit FAIL):**
the original verify also asserted `diff .claude/skills/fgos-coding-driving/
SKILL.md .agents/skills/fgos-coding-driving/SKILL.md` (whole-file
identity). That assumption was true when `CONTEXT.md`/this plan were
written, but a concurrent session updated `.claude/`'s copy's `/fgOS:cook`
fan-out row (an unrelated revert) without mirroring it into `.agents/`'s
copy before this item reached validating — the same dual-mirror drift risk
`tsk-11f` already flagged for `fgos-coding-exploring`. Fixing that pre-existing,
unrelated drift is out of this item's own footprint/scope (`CONTEXT.md`
never decided to take it on); the corrected verify above only proves what
this item is actually responsible for — its own new anchor phrase landing
in both copies — dropping the over-strict whole-file-identity assertion.

## Assumptions

- The exact anchor phrase `"once per fgos-coding-driving invocation"` is
  pinned now (verify depends on it literally) — the implementing session
  must use this exact phrase when writing the new step, not a paraphrase.
- `/fgOS:cook`, `/fgOS:discover`, `/fgOS:plan`, `/fgOS:discover-next`
  need no edits of their own — they inherit the display purely by already
  invoking `fgos-coding-driving` (CONTEXT.md D1). Not re-verified per-file
  here beyond the driver's own change, since none of those four files are
  in this item's footprint.

## Outstanding questions

None
