---
authoritative_for: why fgOS's D-ID/RUL-ID/ADR citations must carry a one-line gloss alongside the bare id, why the enforcement extends the existing decision-citation-drift script rather than adding a new one, and why it ships as a checked-in baseline ratchet
framework: diataxis
mode: explanation
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

## A real follow-up bug: the baseline was keyed by line number, not content

A hand-verified audit (`tsk-3x8`) found the checker's baseline
(`check-decision-citation-drift.baseline.json`) keyed each finding as
`kind:line:id` rather than by content, unlike its sibling
`check-decision-codes.mjs` it was supposed to follow. Inserting or
deleting a single line anywhere earlier in a baselined file shifts every
finding below it — each one then reads as "new," turning `npm test` red.
Proven directly: one inserted comment line in `docs/backlog.md` flipped
"0 new findings" to 64. `docs/backlog.md` alone is touched in 152 of 200
recent commits — this was near-certain to trigger soon, not a remote edge
case.

The dangerous part is the obvious fix for a red `npm test`: rerunning
`--write-baseline`. That snapshots *every* current finding, including real
newly-introduced violations, silently wiping them from tracking — with
1,645 findings, nobody reads the full JSON diff to notice. This meant D4's
"blocks new violations" guarantee from `tsk-37i` was not actually true of
what had shipped.

The fix re-keyed the baseline from `kind:line:id` to
`kind:id:<line-text>`, preserving the same 1645/73 finding count on
regeneration, and added regression coverage for line-*insertion* (the
existing suite had only ever tested appending new findings after existing
ones, never inserting before them).

Several other real findings from the same audit were explicitly scoped
out of this item and left as open follow-up, not silently dropped: the
`--write-baseline` no-diff-protection gap itself (rerunning it still masks
new violations the same way, just less easily triggered); the shared
citation-format convention doc (`_shared/citation-format.md`) being cited
by zero files including its own intended flagship consumer
(`fgos-coding-shaping/SKILL.md`); the 1,645 pre-existing findings having no
tracked cleanup item, with `tsk-1lv` and `tsk-37i` separately believing
different things about what had already been cleaned; and the fact that if
`tsk-1lv` D5 (retiring `docs/decisions/*.md`) ships, this check quietly
stops catching anything at all, with no error.

## A second-order bug the re-keying fix itself introduced (`tsk-6at`)

A dedicated review round over `tsk-3x8`'s own content-keyed baseline
change found a real regression it had introduced: `findNewFindings`'
membership check used a plain `.includes()` test, which under-detects new
occurrences once a file has two or more findings that share the exact
same key — a real, live shape (7 files/64 duplicate-key groups already
existed in the actual baseline). Confirmed as a genuine regression against
the old line-keyed formula, not a pre-existing gap. Fixed with
count-based consumption instead of membership testing, no baseline format
change needed. Two further review passes (requested explicitly, looking
for anything still missed) confirmed multi-occurrence correctness (2
baselined + 2 new correctly reports 2, not just the single-extra case the
first regression test covered) and baseline-regeneration determinism, and
surfaced one further out-of-scope edge case (a source path literally named
`__proto__` would break the baseline object) — flagged, not fixed, since
it was never in this item's own scope.

## The wrapper generator's own boilerplate was violating the rule it lives next to (`tsk-352f`)

Every generated skill wrapper (`.claude/skills/**/SKILL.md`,
`plugins/fgOS/skills/**/SKILL.md`) carries a boilerplate line —
`src/setup/skill-wrappers.mjs`'s `generateWrapperContent` — that used to
self-embed the literal string "This is a generated thin wrapper (`tsk-1qi`
D5/D7) -- do not edit directly, edit the source instead." `D5/D7` is a
bare `D`-local citation cited outside its own home `CONTEXT.md` —
precisely the pattern this whole citation contract exists to catch,
except no checker had ever actually scanned `.claude/skills/` for it: the
generator's own template string was never treated as a citation-format
target in the first place, so the bug shipped invisibly into fifteen
generated files at once, on every regeneration, unnoticed.

The fix followed decision `0017`'s own rule directly: a `D`-local id is
never cited outside its home — the correct move is inlining the content or
dropping the id, never adding a gloss to a `D`-local citation living
outside `CONTEXT.md`. Since the `tsk-1qi` item id alone already identifies
the source sufficiently on its own, the `D5/D7` suffix was simply dropped,
confirmed (by reading the real content of D5/D7) to lose no information a
reader actually needed. All fifteen affected wrapper files were
regenerated and the full suite re-verified green.

## The two flagged-but-deferred findings finally closed (`tsk-1pf`)

`tsk-6at`'s own review had flagged two real bugs as explicitly out of its
own scope, left unpicked-up until this item: (1) `check-decision-codes.mjs`
— a sibling script, not the citation-drift checker itself — had the
architecturally identical membership-only `.includes()` bug `tsk-6at`
already fixed in `check-decision-citation-drift.mjs`, dormant only because
its own real baseline happened to contain zero duplicate-key entries at
the time, not because the underlying logic differed; ported the same
count-consumption fix, plus a mirrored regression test. (2) Both checker
scripts' `baselineFromFindings` used a plain `{}` object keyed by file-path
strings — a source path literally named `__proto__` would reassign the
object's own prototype instead of creating a normal property, throwing on
the following `.push()`. Confirmed pre-existing, predating even `tsk-3x8`.
Not realistically exploitable (file paths only ever come from trusted
local repo traversal, never external input) but cheap to close regardless.
Deliberately left out of this item's own scope: the 1,645 orphaned
baseline findings with no cleanup owner, and the `tsk-37i`/`tsk-1lv`
handoff-gap communication mismatch — both ownership/triage decisions for a
person, not bugs a code pass can resolve.

## Source

`tsk-37i`. Verify: `npm test && test -f
.agents/skills/_shared/citation-format.md && grep -qE '<ID>.*one-line
gloss' .agents/skills/_shared/citation-format.md && node
scripts/check-decision-citation-drift.mjs --baseline <path>
--decisions-dir docs/decisions --backlog docs/backlog.md --specs-dir
docs/specs --skills-dir .agents/skills --skills-dir plugins/fgOS/skills`.
