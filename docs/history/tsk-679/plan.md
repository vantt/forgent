# plan.md — tsk-679

Mode: **small** (0 hard-gate flags; the only flag that applies is
"existing covered behavior" — `findWideCitationFindings`/
`collectWideSourceFiles` already have real test coverage in
`test/state/decision-relation.test.mjs` and `checkImpactDoor` in
`test/state/retrospective-doors.test.mjs` — a few files, no gray areas,
one mechanical fix applied consistently at two call sites of one shared
function).

No `CONTEXT.md` exists for this item — the discovery verdict was `clear`
(`docs/history/tsk-679/RESEARCH.md` round 1), which skips `exploring`
entirely per the domain's own edge table. `docsRef` was registered onto
the item at this skill's own Bootstrap step, pointing at this same
`docs/history/tsk-679/` folder (tsk-4sx convention).

## Approach

**Root cause** (confirmed by direct read, `RESEARCH.md` round 1):
`findWideCitationFindings` (`scripts/check-decision-citation-drift.mjs:371-392`)
does a whole-word literal match of `targetId` across every file
`collectWideSourceFiles` returns (`docs`, `src`, `plugins`,
`.agents/skills`), with no concept of a D-local id's own home document. A
D-local id (`D<n>`) is only meaningful within one specific CONTEXT.md
(decision 0017, already enforced by a *different* finding kind,
`findCitationFormatFindings`'s `isOwnContext` check,
`scripts/check-decision-citation-drift.mjs:108`) — treating it as a
repo-wide unique key is what produces the false-positive flood the item
reproduces.

**Second call site sharing the same defect (found this round, not named
in the item's own description but squarely inside its stated root
cause):** `findWideCitationFindings` has exactly two callers —
`bin/fgos.mjs:1992` (the write-time sweep the item describes, `fgos
decision --relation supersedes:<id>`) and
`src/state/retrospective-doors.mjs:112` (`checkImpactDoor`, the
close-time retrospective impact door). Both pass a D-local id through
unscoped today; both need the same fix, or the close-time door keeps
reproducing the exact bug this item exists to close. This is not scope
creep — it is the same root cause the item names ("`findWideCitationFindings`...
treats D-local IDs as globally unique"), which is a property of the
shared function, not of one call site.

**Fix shape:**

1. Add a pure helper to `scripts/check-decision-citation-drift.mjs` that
   recognizes a D-local id (the same `D` branch `CITATION_RE`
   (`scripts/check-decision-citation-drift.mjs:45-46`) already
   distinguishes from `ADR`/`RUL`).
2. `findWideCitationFindings` gains an optional 4th parameter (a `homeFile`
   path). When `targetId` is D-local AND `homeFile` is supplied, the scan
   is restricted to `sourceFiles` entries whose `file === homeFile` before
   matching — never touching the caller's own `sourceFiles` array. When
   `targetId` is D-local and no `homeFile` is supplied, return `[]` (skip
   the check rather than flood false positives — matches the item's own
   "non-blocking" framing; an unscopeable D-local check finding nothing is
   strictly better than the bug this item exists to fix). Non-D-local ids
   (`ADR<n>`, a `tsk-*` work-item id — genuinely globally unique) are
   completely unaffected: `homeFile` is ignored, behavior stays
   byte-identical to today. This keeps `findWideCitationFindings` pure
   (its own doc comment already calls it "Pure") — path resolution stays
   the caller's job, matching how `collectWideSourceFiles`'s own
   `excludeRelDirs` is already caller-supplied.
3. Both call sites already have everything needed to resolve their own
   `homeFile` without new state: `bin/fgos.mjs`'s `decision` case already
   computes `docsRefRaw`/`contextRelPath` for the CONTEXT.md path at
   `bin/fgos.mjs:2052-2054` (a few lines below the sweep call — reuse the
   same computation, don't invent a second one); `retrospective-doors.mjs`'s
   `checkImpactDoor` already has `docsRefDir(item)`
   (`src/state/retrospective-doors.mjs:46-48`). Each passes its own
   resolved `<docsRef>/CONTEXT.md` as `homeFile` when the relation id it is
   checking is D-local.

**Files likely touched** (one logical piece, no split — the fix is one
shared-function change plus wiring both existing callers to it):

- `scripts/check-decision-citation-drift.mjs` — D-local detection helper +
  `homeFile`-scoped `findWideCitationFindings`.
- `bin/fgos.mjs` — `decision` case: compute/pass `homeFile` when
  `relation.id` is D-local.
- `src/state/retrospective-doors.mjs` — `checkImpactDoor`: compute/pass
  `homeFile` when the superseded id is D-local.
- `test/state/decision-relation.test.mjs` — pure tests for the new
  `homeFile` scoping (matches home file → flagged; different file with its
  own local same-numbered D-id → not flagged; no `homeFile` supplied →
  `[]`; existing non-D-local tests must keep passing unchanged) + a
  CLI-level regression test reproducing the item's own bug report
  (`--id host-item --relation supersedes:D8` where `host-item`'s own
  CONTEXT.md dangles D8, and an unrelated file cites its own unrelated
  D8 — only the former is flagged).
- `test/state/retrospective-doors.test.mjs` — the same false-positive
  fixed at `checkImpactDoor`'s own close-time call site.

**Order:** the shared-function change (1) first (nothing else compiles
against the new signature otherwise), then the two call sites (2, can go
in either order — no dependency between `bin/fgos.mjs` and
`retrospective-doors.mjs`), tests alongside each. `fgos graph --json`
was not run for ordering purposes — this is one cohesive piece touching
already-known files with a known dependency shape (shared function before
its callers), not a multi-piece split where `criticalPath`/`topUnblock`
would inform which piece goes first.

**Risk map:**

| Component | How risky | Proof point |
|---|---|---|
| `findWideCitationFindings`'s new `homeFile` branch | Light — additive optional param, existing non-D-local call shape (`(sourceFiles, targetId, supersedingLabel)`, 3 args) stays valid and unaffected since `homeFile` defaults to not-supplied | Existing non-D-local tests in `test/state/decision-relation.test.mjs` must keep passing unmodified (regression guard) |
| Two call sites now must resolve and pass `homeFile` for a D-local id | Light — each site already computes the equivalent path for another purpose (`bin/fgos.mjs:2052-2054`, `docsRefDir`) | CLI-level regression test (the item's own reported scenario) + `checkImpactDoor` test |

**Impact-analysis posture (CLAUDE.md gate):** `fgos tool query
--capability impact-analysis --status present` returns GitNexus,
`status: present`, but `list_repos` shows the `forgentX` index is 564
commits behind HEAD — **degraded**: `mcp__gitnexus__impact` on
`findWideCitationFindings` returned "Target not found" (a genuinely stale
index missing this symbol, not a real zero-caller result). Cross-checked
manually per the gate's own instruction: `grep -rn
"findWideCitationFindings\|collectWideSourceFiles" src/ bin/` confirms
exactly the two callers named above and no others — this manual read is
the evidence backing the blast-radius claims in this plan, not the
(stale) GitNexus answer.

## Outstanding questions

None
