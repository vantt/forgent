# plan: enduser-docs-index-stale doctor check + fix (tsk-1m0)

Mode: small

Flag count: 0 (auth: no, authorization: no, data model: no, audit/security:
no, external systems: no, public contracts: no — purely additive registry
entry, no existing behavior changed, cross-platform: no, existing covered
behavior: no — new check/fix, not a change to one already covered,
weak-proof area: no — mirrors a well-tested existing pattern
(`changelog-unreleased-stale`), multi-domain: no). 0-1 flags with a couple
of files and one direct, precedent-mirroring task lands this at `small`
rather than `tiny`, since it needs 4 distinct test branches (missing index,
drift, no drift, alias case) to cover CONTEXT.md's D2/D5/D6 boundaries
honestly — more ceremony than a pure one-liner, but no gray areas left to
resolve.

`fgos graph --json` (`tsk-1m0`): the item is its own isolated
component (no `deps`, no parent, no children) — no split candidate to
evaluate, no critical-path ordering question. Proceeds as one item.

`fgos tool query --capability impact-analysis --status present`: GitNexus
present → `impact-analysis: full` per `CLAUDE.md`'s gate. Not load-bearing
for this plan's own proof points below — every change here is additive
(new `registerCheck`/`registerFix` entries, new test cases) with no existing
symbol modified in a way that changes its behavior for existing callers, so
no proof point below leans on blast-radius evidence. Recorded for the
record per the Approach step's own instruction.

## Approach

**Chosen path**: add two new functions to `src/setup/registrations.mjs` —
`checkEnduserDocsIndexStale(cwd)` and `fixEnduserDocsIndexStale(cwd)` —
registered under the same id `enduser-docs-index-stale`, directly mirroring
`checkChangelogUnreleasedStale`/no-fix-needed-there shape but adding a real
fix (closer structurally to the `gate-bypass-configured` check+fix pair,
which is this file's only other check+fix combo). Both honor CONTEXT.md
D1-D7.

**Alternatives rejected**:
- Writing the check as a thin wrapper that shells out to `fgos docs-index`
  and diffs its exit — rejected: `docs-index` has `externalEffect` (it
  writes `docs/enduser-docs-index.json`), so calling it from the CHECK path
  violates D3/the doctor-is-read-only-by-construction discipline every
  other check in this file follows. Only the FIX (D4) may reach for that
  verb's generation path, never the check.
- A new standalone module — rejected: YAGNI, this is two functions plus two
  `registerCheck`/`registerFix` calls, well under the size that would
  justify a new file; every other check/fix pair in `registrations.mjs`
  lives inline in this same file.

**Risk map**:

| Component | Risk | Proof point |
|---|---|---|
| Check enumeration logic duplicating `docs-index`'s own quadrant/alias scan | low — same fixed `QUADRANTS`/`QUADRANT_DIR_ALIASES` constants imported from `enduser-index.mjs`, not re-derived | Test: alias case (`docs/decisions` counted as `explanation`) passes with the same fixture shape `bin/fgos.mjs`'s own scan uses |
| Fix reusing (not duplicating) `docs-index`'s generation path | low-medium — the generation logic today lives inline inside `bin/fgos.mjs`'s `case 'docs-index'` block, not yet an importable function | Test: after `fix`, re-running the check reports 0 drift; a second `fix` call reports `changed: false` (idempotent) |
| Missing-file / missing-quadrant-dir handling | low — same pattern `checkChangelogUnreleasedStale`/`checkDependenciesInstalled` already prove correct | Test: missing `docs/enduser-docs-index.json` passes with an explanatory message, not a crash |
| Count-only message (D1) vs a full path list | low — cosmetic contract, directly copied from `changelog-unreleased-stale`'s own count-style message | Test asserts message matches a count pattern (e.g. `/\d+\/\d+/`), not a specific path string |

**Files touched** (matches the item's own declared `footprint`):
- `src/setup/registrations.mjs` — add `checkEnduserDocsIndexStale`,
  `fixEnduserDocsIndexStale`, and their `registerCheck`/`registerFix` calls.
  Import `QUADRANTS`, `QUADRANT_DIR_ALIASES`, `buildEnduserIndex` from
  `../report/enduser-index.mjs` (already exported, no changes needed
  there). To satisfy D4 without duplicating `bin/fgos.mjs`'s inline
  generation logic, extract that logic (enumeration + `buildEnduserIndex`
  call + write-only-if-changed) into a small exported helper this file can
  import — the natural home is either `enduser-index.mjs` itself (kept
  free of `fs`/`path` today by design, so this would need a deliberate,
  explicit exception noted inline) or a new thin function in
  `bin/fgos.mjs` that both the `docs-index` case and this fix call. Final
  call on where the helper lives belongs to whoever implements this piece,
  scoped to "reuse, do not duplicate" (D4) — either location satisfies
  that constraint equally.
- `test/setup/checks.test.mjs` — extend the `DOCTOR_CHECKS` full-list
  assertion (line 51-69) with `enduser-docs-index-stale`; add a
  `FIX_REGISTRATIONS` case if one does not already assert against the full
  fix list; add 4 new test cases: missing index file, drift present, no
  drift, and the `docs/decisions` alias case — mirroring the existing
  `changelog-unreleased-stale` three-branch block (line 133-171) plus one
  more for the alias.

**Order**: no ordering question — one file pair, no dependencies, no split.

## Shape

Small mode — no phases, one direct implementation pass:

1. Add `checkEnduserDocsIndexStale`/`fixEnduserDocsIndexStale` to
   `registrations.mjs`, following the `changelog-unreleased-stale`
   check's structure (D1, D2, D3, D5, D6, D7) and reusing (not
   reimplementing) the `docs-index` verb's generation path for the fix
   (D4).
2. Register both via `registerCheck`/`registerFix` under
   `enduser-docs-index-stale`.
3. Extend `test/setup/checks.test.mjs`: update the full-registry-list
   assertion, add the 4 test branches named above.
4. Run `node --test test/setup/checks.test.mjs` — the item's own `verify`.

**Cases to prove** (small-mode depth — no concurrency/partial-failure
sketch needed, this is synchronous fs-only logic with no shared mutable
state):
- Boundary: `docs/enduser-docs-index.json` does not exist yet →
  `passed: true`, explanatory message (D5).
- Boundary: a quadrant dir (e.g. `docs/reference/`) does not exist yet →
  treated as zero docs for that quadrant, not a crash (D5, mirrors
  `docs-index`'s own `ENOENT`-is-skip handling).
- Drift present: a doc on disk with no matching index entry → `passed:
  false`, message reports a count (D1) not a path list.
- No drift: index already matches on-disk docs exactly → `passed: true`.
- Alias case: a `.md` file under `docs/decisions/` is counted toward
  `explanation`'s quadrant, both in the check's drift count and in what
  the fix regenerates (D6).
- Fix idempotency: running the fix twice in a row — second run reports
  `changed: false` (mirrors `fixGateBypassConfigured`'s own idempotency
  discipline).

## Outstanding questions

None
