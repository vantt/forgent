# Unit I31 — Claude-only parallel execution report

Runbook: `runbook-claude-only-parallel-execution.md`. Branch `unit/I31`,
worktree `.claude/worktrees/coordination-skill-harness-i31-plan-lint-hard-refusal`,
base `main@222110373` (post-I30), integrated `main@2dbc7c8de`.

Phase 7 item 4d, narrowed after decomposition review found the original
draft targeted the wrong emission site (`capability.unresolved` at ~L136
instead of the real `capability.undeclared` site at ~L324) and the wrong
scope (whole-plan hardening instead of `--cell`-only). File-disjoint from
I33, ran in parallel.

## Implementer (sonnet, fullstack-developer)

Promoted `capability.undeclared`'s severity from `warn` to `hard` at its
one real emission site (`capability-plan-lint.mjs:324-325`), leaving
`capability.unresolved` (~L136, a distinct, intentionally-warn convention)
untouched. Live-probed both the `--cell` miss (now `ok: false`, exit 1) and
a real `--cell` match (unchanged) plus the no-`--cell` path separately
(confirmed unaffected — out of scope by design, per the corrected unit
text). Checked the whole repo for other `--cell`-scoped test usage before
updating fixtures: only two test files exist, both updated correctly, no
production script or other test relies on the old warn-only loophole.

Simplified `fgos-code-change`'s Step 0 prose workaround (added in I28's
fix-round-1) rather than leaving it as redundant defense-in-depth — correct
judgment call: the old carve-out sentence explicitly described
`capability.undeclared` as warn-only, which became factually wrong once the
engine enforces it as hard, not merely redundant. Regenerated skill mirrors
via `npm run build:skills`.

Found and transparently flagged (not silently fixed, correctly out of this
unit's declared file ownership) a stale doc-string in
`src/cli/command-registry.mjs:724`'s `--cell` parameter description, still
saying "severity warn."

## Lead verification and one small fix

Independently reproduced both CLI probes exactly (the `--cell` miss and the
real match), confirmed `capability.unresolved`'s severity untouched via
direct read, confirmed the SKILL.md mirrors are byte-identical. Fixed the
flagged stale doc-string directly (`command-registry.mjs:724`, one line —
trivial enough not to warrant a second implementer round-trip), reran the
plan-lint test files after the fix (41/41, unaffected as expected), and
committed it onto `unit/I31` before merge.

Ran the full suite independently: 7971 tests, 7847 pass, 51 fail — all 51
confirmed (via failure-file grep) to be the same pre-existing
`test/rust-host/*` binary-missing gap every worktree-based unit this track
has hit, zero plan-lint-related failures.

## Merge

`git -C /home/vantt/projects/forgentX merge --no-ff unit/I31` from the main
checkout onto post-I30 main, `ort` strategy, clean auto-merge, no
conflicts. `integratedSha = 2dbc7c8de6b8b87ccb4011f8f1d44e123515f10b`.
Reran the 2 key suites on the merged tree: 41/41 pass.

## Process note

This is the second unit in a row (after I30/I32's canonical-doc gap) where
Lead independently verifying a "DONE" report caught a small, real,
worth-fixing gap that was correctly self-flagged by the implementer rather
than hidden — the pattern that's kept this track's real defect rate low
across 15+ units isn't that implementers never leave anything out, it's
that every gap gets surfaced (by the implementer, a reviewer, or Lead's own
direct check) before merge rather than after.
