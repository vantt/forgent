# decision-code-check-enforcement — plan

Mode: small

Item: `tsk-3ch`. `fgos graph --what-if tsk-3ch` shows `unblocksTransitive: 0`
and `newlyReady: []` — this item unblocks nothing else, confirming it is a
single, self-contained leaf with no ordering dependency on anything else in
the graph.

## Approach

Add `scripts/check-decision-codes.mjs`: a check script following this
repo's own existing convention for this shape
(`scripts/check-decision-citation-drift.mjs`,
`scripts/check-decision-supersession.mjs`, CONTEXT.md scout evidence) —
pure functions exported for unit testing, a CLI entry point that exits 1
on findings / 0 on none, proven through its own `test/scripts/*.test.mjs`
file (which `npm test`'s `'test/**/*.test.mjs'` glob already picks up
automatically — no pre-commit hook, no dedicated `package.json` script;
neither existing sibling check uses either).

Per CONTEXT.md D1, the check is a **ratchet against a checked-in
baseline**, not a zero-tolerance gate:

1. **Detection.** Reuse `tsk-3wr`'s own verify regex verbatim (already
   proven correct — it is the exact pattern that defined "decision code in
   a test name" for that item's own cleanup, and CONTEXT.md's scout
   evidence just re-ran it live):
   `^\s*(test|it|describe)\(\s*['"].*\b(str[0-9]{2,3}|D[0-9]{1,2}\b|RUL[0-9]{2,3}|STR[0-9]{2,3}|tsk-[0-9a-z]{3})\b`,
   scanned line-by-line (single-line match only, same limitation the
   original grep-based verify already had) over every `test/**/*.test.mjs`
   file except `next-doc-id.test.mjs` (confirmed still legitimate: that
   file's own tests assert its ID-pattern-matching logic against literal
   STR/RUL/ADR tokens as fixtures, not decision-code citations).
2. **Ratchet.** A checked-in `scripts/check-decision-codes.baseline.json`
   maps each already-known-violating file to the exact (trimmed) matched
   line text for every violation baselined at generation time. A finding
   is "new" (CONTEXT.md's pinned term) when its `(file, matched line
   text)` pair is absent from that file's baseline entry — a brand-new
   file has no baseline entry, so all its findings are new in full; an
   existing baselined file only flags lines not already recorded. Only
   new findings fail the CLI (exit 1); baselined ones are still printed
   in the report but do not fail it.
3. **Baseline maintenance.** A `--write-baseline` CLI flag regenerates the
   baseline file from the current live findings — used once now to
   snapshot today's known debt, and available to a future cleanup item to
   shrink the baseline without hand-editing JSON.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| Detection regex | Low — reused verbatim from `tsk-3wr`'s own already-used verify, no changes | `test/scripts/check-decision-codes.test.mjs` unit-tests it against str##/D#/RUL##/STR##/tsk-xxx matches and plain-English non-matches |
| Baseline self-consistency | Medium — the baseline must be generated with the exact same detection logic the checker itself uses at check time, or it goes red immediately | After `--write-baseline` generates the real baseline, `node scripts/check-decision-codes.mjs` (no args) against the live repo must exit 0 — this is one of the item's own verify legs, run for real, not simulated |
| Ratchet identity (file + line text, not line number) | Low, accepted simplification — reordering/reformatting an already-baselined file could read as a new "new" finding even with no real new violation | Pinned as an assumption (CONTEXT.md's "New violation" term); `test/scripts/check-decision-codes.test.mjs` covers the two cases that matter for the check's own job — a violation in a brand-new file, and a new violation appended to an already-baselined file — both via a tmp fixture, proving the ratchet mechanism itself is real and testable (not "rule exists but can't be checked", the exact trap tsk-3ch's own description names) |
| `next-doc-id.test.mjs` exclusion | Low — already verified this file's own STR/RUL/ADR literals are legitimate ID-pattern test fixtures, not decision-code citations | Exclusion preserved verbatim from `tsk-3wr`'s own verify command |

`impact-analysis: full` (GitNexus present, per CLAUDE.md's gate) — not
load-bearing here: this item adds new files and touches no existing
symbol, so no blast-radius proof point is needed beyond the tests above.

## Assumptions

- Ratchet identity is `(file, trimmed matched line text)`, not line
  number — tolerates unrelated reordering/reformatting of an already-
  baselined file without a false "new" alarm, at the cost of a rare false
  positive if a baselined line's own text is edited cosmetically. Not
  material to acceptance (CONTEXT.md's own pinned term already accepts
  this); not asked as a separate question.
- Detection stays scoped to test names only (the item's own verify
  command already names only test files; the wider rule text mentions
  "comment/migration-name/commit-message... nếu khả thi" — "if
  feasible" — read as explicit latitude to scope this item down, not a
  hard requirement). A follow-up item can extend detection to those other
  surfaces if wanted.
- No `CHANGELOG.md` entry: this is internal dev tooling (a `npm test`-time
  check), not a `fgos` CLI end-user-visible change — matches the fact
  that neither `check-decision-citation-drift` nor
  `check-decision-supersession` added one when they landed.
- No `docs/specs/<name>.md` spec file: matches the majority precedent
  (`check-decision-supersession`, `check-events-seq-contiguity` have
  none; only `check-decision-citation-drift` does). A one-line
  `docs/specs/reading-map.md` entry is enough, matching that same
  majority precedent's minimum.

## Files touched

- `scripts/check-decision-codes.mjs` — new: `findDecisionCodeFindings`,
  ratchet/baseline helpers, CLI (default + `--write-baseline`).
- `scripts/check-decision-codes.baseline.json` — new: generated snapshot
  of today's real findings (~254, run for real, not hand-written).
- `test/scripts/check-decision-codes.test.mjs` — new: unit tests for the
  pure functions + ratchet logic, plus CLI fixture tests (new-file case,
  new-line-in-baselined-file case, all-baselined-stays-green case).
- `docs/specs/reading-map.md` — one line pointing at the two files above,
  matching the existing `check-decision-citation-drift` entry's format.

## Order

1. `scripts/check-decision-codes.mjs` (detection + ratchet + CLI).
2. `test/scripts/check-decision-codes.test.mjs` (proves the mechanism,
   including the ratchet itself, before trusting it against the real
   repo).
3. Generate the real `scripts/check-decision-codes.baseline.json` via
   `--write-baseline`, then confirm `node scripts/check-decision-codes.mjs`
   (no args) exits 0 against the live repo — self-consistency proof.
4. `docs/specs/reading-map.md` one-line addition.
5. Full verify: `node --test test/scripts/check-decision-codes.test.mjs
   && node scripts/check-decision-codes.mjs && npm test`.

No split — one coherent piece; `fgos graph --what-if tsk-3ch` shows this
item unblocks nothing else, so there is no ordering benefit to splitting
it against sibling work either.

## Outstanding questions

None
