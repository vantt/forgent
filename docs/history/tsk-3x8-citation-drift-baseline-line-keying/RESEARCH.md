# RESEARCH: check-decision-citation-drift.mjs line-keyed baseline

## Round 1 (tsk-3x8, stage discovery)

**Goal:** verify F1 (baseline keyed by line number, not content) and F2
(--write-baseline unconditionally overwrites, no diff protection) against
the real source, and find a concrete verify strategy.

**Checked:** `scripts/check-decision-citation-drift.mjs` (full read),
`scripts/check-decision-codes.mjs` (full read, for comparison),
`scripts/check-decision-citation-drift.baseline.json` (finding count),
`test/scripts/check-decision-citation-drift.test.mjs` (existing coverage).

**F1 confirmed, exact citation:** `baselineFromFindings`
(`scripts/check-decision-citation-drift.mjs:157-164`) keys every finding
as `` `${f.kind}:${f.line}:${f.id}` `` — `f.line` is the raw 1-indexed line
number computed at `:65` (`dead-framing`) and `:107` (citation-format
findings). Compare `check-decision-codes.mjs`'s own
`baselineFromFindings` (`:50-57`): it keys on `f.text` — the trimmed
source line content itself, never a line number. The sibling script this
item was supposed to follow is content-keyed; this one is line-keyed.
Confirms F1 exactly as claimed: any line inserted/deleted earlier in a
baselined file shifts every subsequent finding's `line`, so its key no
longer matches the baseline entry and it reports as "new."

**F2 confirmed, exact citation:** the `writeBaseline` branch
(`scripts/check-decision-citation-drift.mjs:315-327`) calls
`baselineFromFindings(findings)` on the FULL current findings list and
unconditionally `fs.writeFileSync`s it — no diff against the existing
baseline, no check for findings not already present, no refusal/warning.
Any real new violation present at the moment `--write-baseline` runs is
silently absorbed into "known" state with zero signal. (Same mechanical
shape exists in `check-decision-codes.mjs` too, but that script's
content-keying means it almost never needs a defensive re-baseline in the
first place — the *practical* risk is concentrated in the line-keyed
script, which line-shifts constantly.)

**Baseline size, confirmed:** `scripts/check-decision-citation-drift.baseline.json`
holds 1645 findings across 73 files (counted directly) — matches the
item's own F4 number exactly.

**Real, existing coverage gap found (new evidence, not assumed):**
`test/scripts/check-decision-citation-drift.test.mjs:512-566` ("a NEW
finding appended after --write-baseline still fails") only tests a line
**appended after** existing baselined content (`fs.appendFileSync`).
Appending never shifts any earlier finding's line number, so this test
cannot catch F1 — it exercises the one case where line-keying happens to
work by accident. No existing test inserts a line *before* an already-
baselined finding. This is the exact scenario the item's own hand-proof
(`docs/backlog.md`, one inserted comment line, 0 → 64 new findings) demonstrated.

**Verify strategy (concrete, runnable):**
- Unit-level: a new test asserting `baselineFromFindings`/`findNewFindings`
  key findings by line **content** (or a content-derived id), not raw line
  number — e.g. baseline one finding, insert an unrelated line before it in
  the fixture file, re-run, assert `findNewFindings` returns empty (today it
  would return non-empty — this is the regression test for F1).
- CLI-level: extend the existing `--write-baseline` test block
  (`test/scripts/check-decision-citation-drift.test.mjs:451+`) with a case
  that inserts a line *before* a baselined finding (not just appends after)
  and asserts a bare re-run still exits 0 with "no new findings."
- Runnable as-is today: `node --test test/scripts/check-decision-citation-drift.test.mjs`
  (confirms current red state pre-fix once the new tests are added, green
  post-fix).

**Still open (out of this item's fix scope, per the item's own Goal line):**
F3 (zero adoption of `_shared/citation-format.md`), F4/F6 (1645 orphaned
findings + tsk-1lv handoff-gap ownership), F7 (silent decay if tsk-1lv's D5
retires `docs/decisions/*.md`), F8 (wrapper-generation script's own bare
D-local citation, outside checker's scan surface), F9/F10 (minor heuristic
edges). These are triage/ownership questions, not technical ambiguity —
not re-opened here.
