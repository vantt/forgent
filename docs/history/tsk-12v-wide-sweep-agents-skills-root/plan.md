# Plan: add `.agents/skills` to WIDE_SWEEP_ROOTS

Mode: **small** (1 flag per fgos-routing's Mode gate — "existing covered
behavior": `test/state/decision-relation.test.mjs` already covers
`collectWideSourceFiles`/`findWideCitationFindings` and must keep
passing). No `CONTEXT.md` — discovery's own verdict was `clear`; every
claim below traces to `RESEARCH.md`'s Round 1 (same dir).

## Approach

**The gap (RESEARCH.md Round 1):** `WIDE_SWEEP_ROOTS`
(`scripts/check-decision-citation-drift.mjs:296`) is `['docs', 'src',
'plugins']`. Neither `.agents/skills` (the canonical dev-skill source)
nor `.claude/skills` (its generated wrapper) is reached. Two real
callers — `bin/fgos.mjs`'s `fgos decision --relation supersedes:<id>`
write-time sweep, and `src/state/retrospective-doors.mjs`'s impact door
— are both blind to a stale citation living in a skill file today.

**Chosen fix:** add `.agents/skills` to `WIDE_SWEEP_ROOTS`. Confirmed
`.claude/skills` needs no separate entry — its wrapper content is
exactly the source's own frontmatter (byte-identical) plus a fixed
redirect sentence with no citation tokens (RESEARCH.md), so scanning
`.agents/skills` alone already sees everything a wrapper could ever
carry. `plugins` is already in the root list and already covers both the
byte-identical dev-skill mirrors AND the independent launcher-skill
prose there.

**Rejected alternative:** add both `.agents/skills` AND `.claude/skills`
"to be safe." Rejected — RESEARCH.md confirmed by direct read that
`.claude/skills` contributes zero new text; adding it would double scan
cost (every markdown file walked twice) for provably zero new coverage.

**Files touched:**
- `scripts/check-decision-citation-drift.mjs:296` — one array entry.
- `test/state/decision-relation.test.mjs` — one new regression test.

**Order:** one line, one test — no meaningful ordering decision (a
single-value config change, not a multi-piece build).

**Impact-analysis posture:** `degraded`. `fgos tool query --capability
impact-analysis --status present` reports gitnexus `present`, but
`impact({target:'collectWideSourceFiles', direction:'upstream'})`
returned "Target not found" — the live index remains stale (unchanged
staleness pattern from every prior item this session, the index predates
these recent merges). Cross-checked directly: `grep -rn
"collectWideSourceFiles\|WIDE_SWEEP_ROOTS"` across `src/`, `bin/`,
`scripts/` confirms exactly 2 real call sites (`bin/fgos.mjs:1976`,
`src/state/retrospective-doors.mjs:109`), both using the default roots —
blast radius small and confirmed by grep, not the stale tool.

## Risk map

| Component | How risky | What proves it |
|---|---|---|
| `WIDE_SWEEP_ROOTS` array edit | Low — a config-shaped constant, no logic touched | New regression test: a synthetic `.agents/skills/<name>/SKILL.md` with a stale citation, asserted caught by `collectWideSourceFiles`'s default roots (unfixed today, would fail; fixed, passes) |
| Two real callers picking up more files to scan | Low — both already handle an arbitrary/growing file set (that's the whole point of "wide" sweep); no callback assumes a fixed root count | Existing tests for both callers (`test/state/decision-relation.test.mjs`, any retrospective-doors tests) keep passing unmodified — the fix only adds files to walk, never changes the walking/filtering logic itself |

## Shape

One honest piece of work, no split (pass-through). Concrete case to
prove against:

- **Regression case for the actual gap:** temp dir shaped like the real
  tree (mirrors `test/state/decision-relation.test.mjs`'s own existing
  pattern) with `.agents/skills/<name>/SKILL.md` containing a bare
  citation of a superseded id, no acknowledgement on the same line.
  Assert `collectWideSourceFiles(tmpdir)` (default roots) includes that
  file, and `findWideCitationFindings` flags it.
- **Existing behavior preserved:** every existing
  `collectWideSourceFiles`/`findWideCitationFindings` test (roots that
  don't exist return `[]`, `.md` files under `docs/` found,
  `node_modules`/`.git` excluded, same-line acknowledgement suppresses
  the finding, whole-word match only) keeps passing unmodified.

## Verify

`node --test test/state/decision-relation.test.mjs` — already the
item's own real `verify` field (synced at discovery). Exercises exactly
the function this plan touches, including its own default-roots
behavior.

## Outstanding questions

None.
