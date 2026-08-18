# RESEARCH.md — tsk-679

Accumulating research log for tsk-679 (bug: `fgos decision --relation
supersedes:<D-ID>`'s write-time dangling-citation sweep treats D-local
IDs as globally unique). Each round is its own dated section, appended,
never overwritten.

## 2026-08-18 — Round 1 (discovery stage)

**Asked:** (1) Does this repo already implement a mechanism that resolves
a D-local id to its own "home document" (the CONTEXT.md it is locally
scoped to) that the write-time sweep could reuse instead of reinventing
scoping logic? (2) Does an existing test file/fixture already exercise
this exact false-positive scenario, that a fix's verify command would
need to run?

**Checked:** `scripts/check-decision-citation-drift.mjs` (full read),
`bin/fgos.mjs` (`decision` CLI case, ~line 1930-1994),
`src/state/store.mjs` (`parseDecisionRelation`), `src/state/work.mjs`
(`docsRef` field), `bin/fgos.mjs:2052-2054` (docsRef default-fallback
convention), repo search for callers of `findWideCitationFindings`/
`collectWideSourceFiles`, and `test/scripts/check-decision-citation-drift.test.mjs`.

**Found:**

1. **A home-document scoping precedent already exists, but for a
   different finding kind.** `findCitationFormatFindings`
   (`scripts/check-decision-citation-drift.mjs:105-160`) already
   distinguishes "own CONTEXT.md" from everywhere else via
   `isOwnContext = file.endsWith('/CONTEXT.md') || file === 'CONTEXT.md'`
   (line 108), and per decision 0017 (cited in the file's own header
   comment, lines 10-14) a D-local id is *never* valid to cite outside its
   own CONTEXT.md at all — "the only correct fix is inlining the content
   and deleting the id." This produces the `d-local-outside-home` finding
   kind (line 129), which is a *citation-format* check, not the
   *dangling-citation* check this bug is about.

2. **The buggy function, `findWideCitationFindings`
   (`scripts/check-decision-citation-drift.mjs:371-392`), has no
   home-document concept at all.** It does a whole-word literal match of
   `targetId` across every file `collectWideSourceFiles` returns
   (`docs`, `src`, `plugins`, `.agents/skills` — line 316), with the only
   suppression being "same line also mentions `supersedingLabel`" (line
   377). It is deliberately generic (its own doc comment, lines 364-370,
   says `targetId` can be "a `state.decisions` D-ID or work-item id") —
   correct for a globally-unique id (an ADR number, a `tsk-*` id) but
   wrong for a D-local id, which is only unique within one CONTEXT.md.

3. **The call site (`bin/fgos.mjs:1969-1994`, the `decision` case) already
   has the item id in scope.** `--relation supersedes:<D-ID>` is paired
   with `--id <item-id>` for an item-scoped decision (`id` at
   `bin/fgos.mjs:1934`); `relation.id` (from `parseDecisionRelation`,
   `src/state/store.mjs:1196`) is an opaque string with no structural
   marker distinguishing "D-local id" from "work-item id"/"ADR number" at
   the parse layer — the CLI case itself would need to recognize the
   `D\d+`-shaped case (mirroring `CITATION_RE`'s own `(ADR|RUL|D)(\d{1,4})`
   grouping, `scripts/check-decision-citation-drift.mjs:45-46`).

4. **A home CONTEXT.md path is resolvable for the superseding item.**
   `work.docsRef` (`src/state/work.mjs:600-602`, optional string field) is
   the item's own `docs/history/<feature>/` folder; when unset,
   `bin/fgos.mjs:2052` already establishes the repo's own default-fallback
   convention for this exact call site's neighborhood: `docs/history/${id}`.
   tsk-679 itself currently has no `docsRef` set, confirming the fallback
   path is the live convention, not a hypothetical.

5. **An existing test file already covers this script and would carry a
   fix's verify.** `test/scripts/check-decision-citation-drift.test.mjs`
   exists and exercises this file; `test/state/decision-relation.test.mjs`
   covers `parseDecisionRelation`. Repo test runner:
   `node --test 'test/**/*.test.mjs'` (`package.json`). No existing
   fixture in either file reproduces the cross-document D-local collision
   scenario itself (both files were read for imports/coverage shape, not
   exhaustively for every existing case — a fix would add a new case, not
   necessarily find one already there).

**Still open (for planning, not this stage):** the exact scoping rule a
fix should implement (e.g., "when `targetId` matches `/^D\d+$/`, restrict
`findWideCitationFindings`'s scan to the superseding item's own
`docsRef`/CONTEXT.md file, skip everywhere else" vs. some other shape) is
a design choice for `fgos-coding-planning`, not resolved here — this
round's evidence establishes the root cause, an existing scoping
precedent to model after, and a resolvable home-document path; it does
not itself write the fix.

**Verdict:** clear — root cause is pinpointed to `file:line`
(`scripts/check-decision-citation-drift.mjs:371-392`,
`bin/fgos.mjs:1969-1994`), a precedent scoping mechanism already exists
in the same file (`isOwnContext`, line 108) to model the fix after, a
home-document path is resolvable (`docsRef` + its documented fallback),
and an existing test file is available to extend for verify. No product
decision is blocked on a person — the fix direction is an implementation
design choice, not an ambiguous requirement.
