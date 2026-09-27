# Unit I20 — Claude-only parallel execution report

Runbook: `runbook-claude-only-parallel-execution.md`. Branch `unit/I20`,
worktree `.claude/worktrees/coordination-skill-harness-i20-capability-match`,
base `main@03cc7245e`, integrated `main@09db1fad4`.

## Implementer (sonnet, fullstack-developer)

Built `matchCapability(demandFacts, catalog)` (stricter boundary than
required — zero imports from `dispatch/` at all, not just from the three
named modules), the `fgos capability match` verb, the `capability.unknown`
reason code, and the required rust-host artifact regeneration (74->75
verbs) applying the I18 lesson directly (derived counts instead of fresh
hardcoded literals).

Design fork flagged honestly: the phase text never pins an exact
`facade`/`protocol`/`inline` formula. Consulted an advisory session, found
textual support for a `hasPlanOrTrack && size==='heavy'` gate, documented
it as a judgment call in the module's own JSDoc, and asked for a second
look before Phase 6 depends on it.

Concern raised: `test/rust-host/release-tree.test.mjs` fails against the
shared `target/release/fgos` binary (predates this and every other verb
merged since) — correctly identified as outside this unit's authority to
fix from its own worktree, deferred to Lead.

## Lead independent verification (before dispositioning review)

Ran the phase's named focused suites directly: all green. Rebuilt the
shared Rust workspace once (updates the symlinked `target/` all worktrees
share) — this does not affect I20 pre-merge, since main's own
`command-routes.json` doesn't have the new verb until I20 merges; the
release-tree failure is expected pre-merge, exactly as I18 established.

## Independent review + test (opus, parallel)

Both independently found the same two MEDIUM issues:

- **M1 (form threshold)**: cross-checked the design record directly
  (`architecture-investigation-260927-1154-...decisions.md` §11.1/11.2)
  myself: "`hasPlanOrTrack` | bool | quyết plan mode" and "Hình thức từ
  `needsIndependentReview` (protocol), `hasPlanOrTrack` (plan mode),
  `size`" — three independent contributions, not a `hasPlanOrTrack AND
  size==='heavy'` gate. Ruled: `facade` triggers on `hasPlanOrTrack` alone.
- **M2 (override doesn't recompute form)**: a real inconsistency —
  overriding a miss kept the miss's forced `inline` form even though a real
  capability was now bound.

Plus five LOW findings (reason-without-override, alias canonicalization,
newline log injection, override log losing the natural match, miss log
omitting candidates) — the first three fixed as cheap/clear wins, the last
two deferred as named, non-blocking gaps.

## Fix round 1

Commit `027636e4e`: `facade` now triggers on `hasPlanOrTrack` alone;
`--override` recomputes `form` via an exported `deriveForm`; alias
overrides resolve to their canonical key; bare `--reason` without
`--override` is now a usage error; newlines are stripped from `--reason`
before logging. Also updated 3 assertions in the tester's own untracked
adversarial test files that had encoded the pre-fix bugs as expected
behavior, and — beyond what Lead asked — committed those two adversarial
files into the tracked suite as permanent regression coverage. Lead
reviewed the content (clean, isolated HOME usage, no plan/unit labels in
test names) and kept it rather than force a revert: real coverage for real
bugs just fixed.

Lead independently reverified: 43/43 + 24/24 + 413/413 pass; demo confirms
`form: "facade"` for a light-size plan/track unit; `git diff --check`
clean; full `npm test` at this candidate: 7883 tests, 1 fail (the expected
pre-merge release-tree case, not a real regression — see above).

## Merge

`git -C /home/vantt/projects/forgentX merge --no-ff unit/I20` from the main
checkout onto `main@03cc7245e` (post-I18), `ort` strategy, no conflicts.
`integratedSha = 09db1fad444a15a49efb4ee68537e3ac35a89b45`. Rebuilt the
shared Rust workspace immediately after merge; confirmed
`release-tree.test.mjs` 3/3 pass on the new baseline.
