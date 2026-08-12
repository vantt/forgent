# tsk-34y — plan

## Mode

Flags counted (auth / authorization / data model / audit-security /
external systems / public contracts / cross-platform / existing covered
behavior / weak proof / multi-domain): only **existing covered behavior**
applies (merging tests risks losing edge-case coverage). 0 hard-gate flags.

**Mode: small.** More than a couple files (touches `test/cli/fgos.test.mjs`
plus a scan pass over ~6 other test files) but no gray areas left — D1/D2
in `CONTEXT.md` already settle scope and acceptance bar.

No split: this is one honest piece of work (scan → merge → report), not
several independently workable items. `fgos graph --json` shows tsk-34y as
its own single-node component with one dependency (`tsk-3wr`) — no
multi-item shape to weigh.

## Approach

1. **Baseline.** Run `npm test` once before any edit; record total test
   count and wall-clock run time (D2's before-half of the report).
2. **Scan for duplicate assertion-shape clusters**, whole suite, starting
   with the files already scouted in `CONTEXT.md`
   (`test/cli/fgos.test.mjs` first — it holds the three clusters already
   measured: 54× exit-4-rejection shape, 53× no-event-written shape, 8×
   bare-flag shape — then `test/state/replay.test.mjs`, `test/runner/
   dispatch.test.mjs`, `test/runner/loop.test.mjs`, `test/intake/
   decompose.test.mjs`, `test/intake/discovery.test.mjs`, `test/state/
   store.test.mjs`). For each candidate cluster, read the actual assertion
   bodies (not just names) to confirm same invariant per D1's pinned term.
3. **Merge confirmed clusters** into one parameterized test per cluster
   (data-table + one test body), one cluster at a time, running the
   affected file's tests after each merge to catch a wrongly-collapsed
   edge case immediately rather than at the end.
4. **Skip** any candidate cluster where assertion bodies turn out to verify
   different invariants — leave those tests untouched, note why in the
   report.
5. **Final measurement.** Run `npm test` again; record total test count and
   run time. Write the before/after report (counts, run time, which
   clusters merged and why, which candidates were rejected and why) to
   `plans/reports/`.

Risk map:

| Component | Risk | Proof point (for `fgos-coding-validating` / execution) |
|---|---|---|
| Merging exit-4-rejection cluster (54 tests) | medium — largest cluster, most flags/verbs to preserve | each flag/verb still gets its own data-table row; `npm test` count for this cluster drops from 54 to 1 body + N rows, no assertion coverage lost |
| Merging no-event-written cluster (53 tests) | medium — overlaps with cluster above (same tests may satisfy both patterns) | check overlap before double-counting reduction; verify no test is deleted outright, only reshaped |
| Merging bare-flag cluster (8 tests) | low — small, single shape | straightforward table over flag list |
| Scan of other 6 files | low — may find nothing, that's a valid outcome | report explicitly states "no qualifying duplication found" if true, not silence |

Files likely touched: `test/cli/fgos.test.mjs` (primary), possibly
`test/state/replay.test.mjs`, `test/runner/dispatch.test.mjs`,
`test/runner/loop.test.mjs`, `test/intake/plan.test.mjs`,
`test/intake/discovery.test.mjs`, `test/state/store.test.mjs` (only if scan
confirms real duplication there — not guaranteed), plus one new report file
under `plans/reports/`.

## Verify

`npm test` (full suite) passes green, and the before/after report exists
under `plans/reports/` with test count + run time for both baseline and
final runs (D2).
