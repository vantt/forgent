# Plan: test suite legibility & dedup (tsk-3wr)

## Mode

**Standard.**

Flag count: 1 of 10 (existing covered behavior — every touched test is
currently green and must stay green). No hard-gate flag applies (no auth,
data loss, audit/security, external provider, or validation removal).

By raw flag count alone this reads as tiny/small. Standard is chosen
instead under the rubric's own "story-sized behavior" clause: 48 of 72
files (67% of the suite) need auditing, the fix requires per-file
judgment (is this description merely mislabeled, or is the test itself a
true duplicate?), and D1 requires standing up a coverage-diff harness
(`node --experimental-test-coverage`) that does not exist in this repo
yet. A "small" plan (a few files, no gray areas) would not honestly cover
either the file count or the judgment calls involved.

## Graph context

`fgos graph --json`: tsk-3wr sits in a 4-node component
(`tsk-3wr`, `tsk-34y`, `tsk-3ch`, `tsk-4c0`) and is the top `topUnblock`
entry (`unblocks: 3, newlyUnblocks: 4`) — the highest-leverage item in the
current graph. `tsk-34y` and `tsk-3ch` both explicitly describe themselves
in their own titles as ongoing follow-on mechanisms building on top of
this item's one-time cleanup (duplication quantification/tracking, and
naming-rule enforcement, respectively) — not overlapping scope, no
conflict with D1/D2.

This is why the shape below stays a single item rather than a split:
splitting into children would delay unblocking all three dependents
behind however long the slowest child takes, for no parallelism gain —
rename and dedup judgment happen together, file by file.

## Approach

Work file-by-file across `test/**/*.test.mjs` (72 files; scope excludes
`dogfood-fixture/test/`, per CONTEXT.md pinned term). For each file:

1. Read every `test()`/`it()`/`describe()` description string. Where it
   embeds a decision code (`D<n>`, `str##-<slug>`, `STR##`, `RUL##`,
   `tsk-<id>`), rewrite it to state the invariant in plain language —
   citing the D-ID rule already locked, never re-deciding it.
2. While reading, check for real duplicate invariants at different
   granularity (the registry-frozen field-by-field pattern is the known
   concrete case). Merge/remove only where the *same* invariant is
   re-verified — favor the behavior-level assertion over the
   structure-level one when both exist. D2 sets no floor/ceiling; this
   step is skipped entirely for files with no such duplication.

Order: batch by directory (`test/cli/`, `test/e2e/`, `test/intake/`,
`test/state/`, `test/runner/`, `test/evolve/`, remaining top-level files),
heaviest decision-code density first (`test/cli/fgos.test.mjs` — 17+
matches per code — then `test/e2e/runner-loop.test.mjs`,
`test/intake/judge-executor.test.mjs`, `test/evolve/iron-law.test.mjs`, per
the scout counts in CONTEXT.md). This is an implementer-facing ordering
call, not a dependency-graph one — `fgos graph --what-if` doesn't apply
here since there's no split to compare candidates against.

### Risk map

| Component | Risk | Proof point (→ fgos-coding-validating) |
|---|---|---|
| Renamed test descriptions | Low — pure string change | Full suite stays green after each batch |
| Merged/removed duplicate tests | Medium — could silently drop a real invariant | Coverage-diff (D1) shows no line/branch regression after each batch, not just at the end |
| New coverage-diff harness (D1) | Medium — first time this repo runs `--experimental-test-coverage` as a gate | A dry run against current `main` before touching any test file, to confirm the tool works and produces a stable baseline |

### Files touched

- 48 of 72 files under `test/` (renames), subset of those for dedup merges
  (exact subset only known after per-file read — no dedup count is fixed
  by D2)
- No `src/` changes — this item touches test files only, never product
  code
- A baseline coverage report (transient, not committed) taken before any
  edit, and a final one after, per D1

## Shape

Single item, executed in ordered batches by directory (above). No split
into children — see Graph context.

Concrete cases to prove against, per D1/D2:
- Baseline coverage run on current `main` succeeds and produces a
  reportable number (proves the harness itself works before it's trusted
  as a gate)
- After each directory batch: full suite green, coverage number ≥
  baseline
- At least one real dedup case executed end-to-end (the registry-frozen
  example CONTEXT.md cites) — proves the "merge only real duplicates"
  judgment call actually happens once, not just in theory
- A file with decision-code names but zero real duplication — proves the
  two fixes (rename vs. dedup) are applied independently, not bundled by
  assumption

## Verify

Per D1: `node --experimental-test-coverage` run before the first edit and
after the last, diffed. Pass requires:
- Coverage percentage (line and branch) does not drop from baseline
- Full `npm test` green
- Zero remaining decision-code matches in `test/**/*.test.mjs` for the
  pattern scouted in CONTEXT.md (`\b(str\d{2,3}|D\d{1,2}\b|RUL\d{2,3}|STR\d{2,3}|tsk-[0-9a-z]{3})\b`)
