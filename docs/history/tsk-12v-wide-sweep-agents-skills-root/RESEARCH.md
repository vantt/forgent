# RESEARCH: widen WIDE_SWEEP_ROOTS to cover .agents/skills

## Round 1 (tsk-12v, stage discovery)

**Goal:** confirm exactly which root(s) the wide sweep needs added --
`.agents/skills` alone, or also `.claude/skills`/`plugins/fgOS/skills` --
by checking real content, not assuming.

**Checked:** `src/setup/skill-wrappers.mjs`'s `generateWrapperContent`
(current, post tsk-352f fix), a real `.claude/skills/fgos-coding-discovering/SKILL.md`
wrapper's full content, `plugins/fgOS/skills/` structure (from earlier
this session's own grep — dev-skills are byte-identical mirrors of
`.agents/skills`, confirmed via `test/skills/fgos-mirror.test.mjs`; the
~35 launcher/CLI-wrapper skills like `cook`/`submit`/`pick` carry
independent real prose, no `.agents/skills` counterpart), real
`state.decisions` records (`docs/decisions/index.md`) for an authentic
supersession relation to test against.

**Confirmed: `.claude/skills` contributes zero independent scan
surface.** Read a real generated wrapper
(`.claude/skills/fgos-coding-discovering/SKILL.md`) in full: it is
exactly the source's own YAML frontmatter (copied verbatim by
`generateWrapperContent`, byte-identical to `.agents/skills`'s own
frontmatter) plus a fixed 3-line redirect sentence containing no
citation tokens at all (confirmed post tsk-352f: no `D<n>` pattern
survives). Any citation text that could ever appear in a wrapper's
frontmatter (`description` field) is, by construction, the exact same
text already present in its `.agents/skills` source. Scanning
`.agents/skills` alone already sees everything `.claude/skills` could
ever carry — adding `.claude/skills` to `WIDE_SWEEP_ROOTS` would be pure
redundant work, doubling scan cost for zero new coverage.

**`plugins/fgOS/skills` already covered:** `WIDE_SWEEP_ROOTS` already
includes `'plugins'`, so both the byte-identical dev-skill mirrors AND
the ~35 independent launcher-skill files (`cook`/`submit`/`pick`/etc.,
which have no `.agents/skills` counterpart and DO carry real, independent
prose) are already in scope today. No change needed there.

**The one real, currently-uncovered root: `.agents/skills` itself** — the
canonical skill source. Neither `docs`, `src`, nor `plugins` reaches it;
today a stale citation living in an `.agents/skills/*/SKILL.md` file
(the canonical dev-skill prose, not a wrapper) goes completely undetected
by the write-time sweep (`fgos decision --relation supersedes:<id>`) and
by `retrospective-doors.mjs`'s own impact door.

**Checked for a live (not just synthetic) repro:** found a real
supersession relation in `state.decisions`
(`docs/decisions/index.md`: "D-ADR0012 ... Supersede tách deps-và-parent
của ADR0002", `ADR0002` retired). Grepped `.agents/skills/` for any
citation of `ADR0002`/bare `0002` — **zero hits**. No live bug hides
there today; the gap is real but currently dormant. Verify will use a
synthetic fixture instead, matching `test/state/decision-relation.test.mjs`'s
own established pattern (temp dir shaped like the real tree, not a
mutation of real files).

**Fix approach:** change `WIDE_SWEEP_ROOTS` from `['docs', 'src',
'plugins']` to `['docs', 'src', 'plugins', '.agents/skills']`. One-line
change; `collectWideSourceFiles` already walks arbitrary roots and
already filters to `.md`/`.mjs`/`.js` extensions (SKILL.md already
matches `.md`), so no other code changes needed.

**Verify strategy:** a new test in `test/state/decision-relation.test.mjs`
(mirrors its own existing `collectWideSourceFiles`/`findWideCitationFindings`
tests): build a temp dir with an `.agents/skills/<name>/SKILL.md`
containing a bare superseded-id citation with no acknowledgement, assert
`collectWideSourceFiles`'s default roots now find it and
`findWideCitationFindings` flags it — the regression test for the
default-roots gap itself, not just the pure functions' own logic (already
covered by existing tests).

## Round 2 (tsk-12v, self-review before merge)

**Found in own diff, real but low-severity:** ~15 of `.agents/skills`'s
16 entries (all `fgos-*` dev-skills + `_shared`) are ALSO byte-identical
mirrors under `plugins/fgOS/skills` (CI-enforced,
`test/skills/fgos-mirror.test.mjs`). Adding `.agents/skills` to
`WIDE_SWEEP_ROOTS` alongside the existing `plugins` root means a stale
citation living in one of those mirrored files gets reported TWICE (once
per root) — proven directly: a synthetic fixture with the same content
under both `.agents/skills/sample-skill/` and
`plugins/fgOS/skills/sample-skill/` produces 2 findings for one real
issue.

**Not the same failure class as the original gap:** the original bug
(pre-fix) was a false NEGATIVE — a real violation silently invisible.
This is a false-positive DUPLICATE — the same real violation reported
twice, never zero times, since the mirror's own byte-identity is itself
CI-enforced (a drift there would already fail `npm test` independently).
Cosmetic noise, not a missed detection.

**Decision: document, don't add exclusion complexity.** Excluding the
mirrored subset would need either a hardcoded list of the 15 mirrored
skill names (fragile — breaks silently the moment a new skill is added
to one side and not yet mirrored to the other) or cross-root exclusion
logic neither real caller (`bin/fgos.mjs`, `retrospective-doors.mjs`)
asks for today. Disproportionate for a cosmetic double-count. Documented
directly in the `WIDE_SWEEP_ROOTS` comment instead — a future session
revisiting this has the real tradeoff on record, not a silent gap.

`plugins/fgOS/skills` itself is NOT purely redundant, corrected from
Round 1's own imprecise claim: only its dev-skill subset overlaps
`.agents/skills`; its ~35 launcher/orchestrator skills
(`cook`/`submit`/`pick`/etc.) have no `.agents/skills` counterpart at all
and still need `plugins` in the roots to be reached.
