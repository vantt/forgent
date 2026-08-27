Mode: tiny

## Approach

Chosen path: replace the stale `releaseClaimOnExecuting` prose in the two
locations `RESEARCH.md` Round 1 confirmed still assert the retired
behavior, with wording that states the current tsk-40m D5 fact (a runtime
claim stays active unbroken through `clarify → executing`, no
release/reclaim window) — modeled on `src/runner/worktree.mjs:1054-1060`,
which already documents both the old behavior and the retirement in one
place.

**Material scoping correction found during Approach (not a CONTEXT.md
gap — there is no CONTEXT.md; this item's discovery verdict was `clear`,
so this correction stays inside this same `planning` pass):**
`.agents/skills/**` is not hand-edited canonical prose. Per
`src/setup/skill-wrappers.mjs`'s `assembleSkills` (read directly,
confirmed live): canonical skill authoring lives under `core/skills/`
(domain-agnostic) and `domains/[domain]/skills/` (domain-specific);
`npm run build:skills` (`scripts/build-skill-wrappers.mjs`) assembles
those into `.agents/skills/*`, generates `.claude/skills/*` thin wrappers
from that, and mirrors `.agents/skills/*` byte-identical into
`plugins/fgOS/skills/*`. Confirmed live (`diff`, no output — byte-identical)
that BOTH stale files exist identically in all three real trees today:
`domains/coding/skills/**`, `.agents/skills/**`, `plugins/fgOS/skills/**`.
Editing only `.agents/skills/**` (the item's own literal citation) would
be silently overwritten the next time anyone runs `npm run build:skills`.
`.claude/skills/**` holds pointer-only thin wrappers (no embedded prose to
edit — confirmed by inspection of an existing wrapper file's content
earlier this session).

Alternatives rejected: deleting the stale paragraphs outright instead of
replacing them — rejected because both paragraphs also carry adjacent,
still-correct guidance (the reclaim-the-ball-if-not-yours mechanics, the
general "re-check live status on non-driven entry" caution) that should
stay; only the specific claim-release assertion is wrong.

Risk map: docs-only text edit, `risk: light` (already set on the item,
confirmed correct by this plan) — no proof point needed beyond a grep
that the retired sentence no longer appears in the source files (and their
generated mirrors) once `npm run build:skills` has run.

Files touched, in order:
1. `domains/coding/skills/fgos-coding-validating/SKILL.md` (source; mirrors
   at `.agents/skills/fgos-coding-validating/SKILL.md:192-201` and
   `plugins/fgOS/skills/fgos-coding-validating/SKILL.md`, under
   `## Handoff`) — the item's own primary target.
2. `domains/coding/skills/fgos-coding-implement/references/worker-contract-and-orient.md`
   (source; mirrors at `.agents/skills/fgos-coding-implement/references/...`
   and `plugins/fgOS/skills/fgos-coding-implement/references/...`, "Re-check
   claim status on a non-driven entry") — the second stale location
   `RESEARCH.md` Round 1 found beyond the item's own stated scope (the item
   said "check fgos-coding-implement/SKILL.md"; the actual stale text lives
   in that skill's reference file instead, not in SKILL.md itself, which
   reads neutral already).
3. Run `npm run build:skills` after both source edits, to regenerate
   `.agents/skills/**` and `plugins/fgOS/skills/**` from the corrected
   `domains/coding/skills/**` source — without this step the two edits
   above are invisible to any session reading the generated trees.

No dependency between the two content edits — either order is fine; the
`build:skills` run must come after both.

`fgos graph --json`'s `criticalPath`/`topUnblock` was not consulted:
neither file sits on any dependency edge for other work items (this is a
prose-only doc fix, not a code change with downstream callers), so
ordering by criticalPath does not apply here.

## Shape

Both content edits follow the same replacement shape: the paragraph
asserting "the claim may already be released" / "releases the item's
claim back to `todo`... this is expected and correct" is replaced with a
statement that a runtime claim now stays active unbroken through
`clarify → executing` (tsk-40m D5), with the pre-D5 behavior kept as
historical context (same two-sentence shape `worktree.mjs:1054-1060`
already uses) rather than erased — so a reader who remembers the old
behavior isn't left wondering if this doc is simply out of date on a
different axis.

Concrete case worth proving: a session driving stage-by-stage by hand
(the exact scenario both paragraphs warn about) reads a live claim status
that stays `doing` across the `planning → executing` edge — this is
already proven by `RESEARCH.md` Round 1's direct read of
`src/intake/plan.mjs:534-537` (`releaseClaimOnExecuting = () => {}`), not
something this plan needs to re-verify. The concrete case this plan DOES
need to prove is mechanical: that `npm run build:skills` actually
propagates the fix into all three real trees — covered by the verify
command's per-tree grep checks below, not left to trust.

## Outstanding questions

None
