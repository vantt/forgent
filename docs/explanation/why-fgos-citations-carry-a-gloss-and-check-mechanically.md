---
authoritative_for: why fgOS's D-ID/RUL-ID/ADR citations must carry a one-line gloss alongside the bare id, why the enforcement extends the existing decision-citation-drift script rather than adding a new one, and why it ships as a checked-in baseline ratchet
---

# Why fgOS citations carry a gloss, checked mechanically

Docs and skill prose across fgOS routinely cited a bare ID — "7 locked
decisions", "0026, 0028-0031, 0033" — with no summary of what the decision
actually said or whether its scope was local to one item or global. A
reader (human or agent) hitting one of these had no way to understand or
decide without asking someone to re-explain it, and specs/skills were
laced with cross-references into work-item context that would go dangling
the moment fgOS deployed into a different project.

## The three-tier ID structure itself was validated, not the defect

> D1: fgOS's 3-tier citation ID structure (global-permanent /
> area-scoped-reset-per-file / feature-local) is validated, not the
> defect... beegog independently converged on the same 3-tier shape

A scan of an upstream project (`beegog`) found the identical three layers
— a global permanent decision log (~ADR), an area-scoped identifier that
resets per file (~`RUL<n>`), and a feature-local identifier (~`D<n>`).
Independent convergence on the same tier count is evidence the *shape*
itself is sound. The fix this item makes targets citation *format* (bare
id → id + gloss) and *enforcement* (a mechanical pointer-check plus a
reversal-sweep discipline), never a tier-count restructuring.

## Scope narrowed to avoid duplicating a sibling item's work

> D2: Scope tsk-37i narrowed to mảnh 1 (citation format convention) +
> mảnh 3 (retroactive cleanup) only. Mảnh 2 (ADR-supersede reversal sweep)
> and mảnh 4 (routing close-gate) are DROPPED — overlap tsk-1lv's broader
> decision-storage architecture work

Two of the four originally-scoped pieces were dropped once it became clear
`tsk-1lv` (canonical-decision-projection) had independently found the same
underlying mechanism (beegog's "doc-rot-doors") and had already locked its
own D5 covering the ADR-supersede reversal sweep and the close-gate
mechanism. `tsk-1lv` explicitly took ownership of both dropped pieces
rather than the two items building the same thing twice.

## Extending the existing citation-drift script, not writing a third one

> D3: Mảnh 1's citation-integrity check extends the EXISTING
> scripts/check-decision-citation-drift.mjs... rather than writing a 3rd
> sibling CLI script

Two new finding types (a bare id with no gloss; a `D`-local id cited
outside its own `CONTEXT.md`) were added to the script that already owned
the exact scan surface this item needed (`docs/backlog.md` +
`docs/specs/*.md`, ADR/bare-id extraction), reusing its file-walk and
id-extraction machinery. `check-decision-supersession.mjs` was
deliberately left untouched — confirmed by reading both scripts directly,
it checks a structurally different thing (internal ADR frontmatter
backward-pointer consistency, not prose citations).

## A found scope gap: `plugins/fgOS/skills/` was silently dropped from the original measurement

> D5: plugins/fgOS/skills/**/SKILL.md is IN SCOPE... a third,
> hand-maintained full copy (not a generated wrapper like .claude/skills)

An independent plan review found the original scope measurement had
silently excluded `plugins/fgOS/skills/` despite it being real, shipped
skill content with real citation violations (20 files). Confirmed
directly: a grep across `scripts/`/`src/` found zero writers targeting
that directory, only two readers (`src/runner/paths.mjs`,
`src/setup/registrations.mjs`) — it is a genuine third hand-maintained
copy, not a generated wrapper the way `.claude/skills` is, so leaving it
out would have defeated the item's own stated goal.

## The baseline ratchet, and a self-correction about its own precedent

> D4: New citation-integrity findings ship as a ratchet-against-checked-in-
> baseline... only a NEW violation fails npm test

The direct precedent cited was `tsk-3ch`'s `check-decision-codes.mjs`, to
avoid the exact risk this item faced (dozens of known pre-existing
violations). While implementing, that precedent's own history got
re-checked more carefully:

> D7: Correction to D4's cited evidence -- tsk-3ch never hard-blocked; it
> chose the ratchet from the outset... The 5 blocked merges belong to
> tsk-3wr, the cleanup item... not to any check going red

The original citation had conflated two different items: `tsk-3ch` chose
the ratchet-against-baseline design from the start (never hard-blocked
anything), while the "5 straight blocked merges" belonged to `tsk-3wr` (a
separate cleanup item), attributed in its own friction log to cross-root
integration drift, not to `check-decision-codes.mjs` going red. D4's
actual substantive choice (ratchet, not hard-block) was already correct —
only the narrative supporting it had the history wrong. Worth noting: the
original D4 text had cited "CONTEXT.md D1" — a D-local id, bare, cited
outside its own home file — which is exactly the violation class this
item exists to eliminate, corrected to name the section instead.

> D6: The checked-in baseline covers ALL finding kinds the extended check
> emits, not only the 2 new finding types... 3 pre-existing dead-framing
> findings... stay baselined, out of scope

Three findings that existed before this item touched anything (citations
of a since-superseded decision `0002`) were folded into the same baseline
rather than fixed — fixing them belongs to a separately-scoped concern
(`STR72`), and wiring the check into `npm test` without baselining them
would turn the suite red on debt this item never scoped to clean.

## What "done" means for a ratchet-shaped check

> D8: The completeness proof in verify checks the check against the FINAL
> checked-in baseline, not an empty baseline... Completion bar... is: the
> enforcement MECHANISM is real and wired... not that literally every
> historical file... got fixed in this one pass

A closer re-read of `tsk-3ch` during implementation corrected an
over-correction made earlier at validating time (`--baseline none` had
been chosen to fix an unrelated concern — a stale baseline being checked
forever — but that concern was about *staleness*, not about a baseline
existing at all). `tsk-3ch`'s own definition of done was never zero
violations; it was zero *new* violations against a checked-in baseline,
with existing debt staying visible but non-blocking, shrinking only as
follow-up cleanup lands. A baseline regenerated fresh as part of this
item's own final commit — showing real, git-diffable shrinkage from the
item's starting state — is not the earlier staleness failure mode.

## Source

`tsk-37i`. Verify: `npm test && test -f
.agents/skills/_shared/citation-format.md && grep -qE '<ID>.*one-line
gloss' .agents/skills/_shared/citation-format.md && node
scripts/check-decision-citation-drift.mjs --baseline <path>
--decisions-dir docs/decisions --backlog docs/backlog.md --specs-dir
docs/specs --skills-dir .agents/skills --skills-dir plugins/fgOS/skills`.
