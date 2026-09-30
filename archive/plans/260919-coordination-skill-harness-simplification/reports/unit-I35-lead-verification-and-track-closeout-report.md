# Unit I35 — Lead verification and track closeout report

Runbook: `runbook-claude-only-parallel-execution.md`. Branch `unit/I35`,
worktree `.claude/worktrees/coordination-skill-harness-i35-track-closeout`,
base `main@ab7fe598d` (post-I34), integrated `main@9dfb5b8f4`.

**This is the final unit of the entire `coordination-skill-harness-simplification`
track.** This is Lead's own verification/closeout log, distinct from the
implementer's own execution report at
`unit-I35-claude-only-execution-report.md`.

## Scope

Phase 7 items 3, 6, 7: the last remaining doc gap (`/fgos:code-change`
distribution row), a before/after comparison report proving the track's
own thesis with real numbers, the replay-corpus comparison, and a
track-wide CHANGELOG close.

## A real coordination-tooling stall, twice

The implementer hit the same class of problem I33 hit earlier this track:
a background `npm test` run's completion notification never reached it,
leaving it "waiting" for roughly an hour with no progress. Lead caught this
via direct worktree inspection (unchanged git state across two checks ~38
minutes apart) and prompted a foreground rerun instead of continued
waiting.

Root cause, self-diagnosed by the implementer and independently plausible:
its monitor's grep pattern for the test-summary line never matched the
real reporter output, AND an earlier run had been piped through `tail -60`,
truncating before the actual pass/fail summary — so even finding the old
background process afterward didn't yield a trustworthy result. Fixed for
this unit by avoiding truncated pipes and appending an explicit exit-code
marker to the full log instead of pattern-matching mid-output.

Lead ran the full suite independently, in parallel with the implementer's
own corrected rerun, and relayed the result first so the implementer didn't
need to wait on its own run at all — this is now the second unit in a row
where this exact background-notification failure mode occurred; worth
carrying forward as a standing note for any future long-running unit.

## Deliverables, independently verified before merge

- **`/fgos:code-change` distribution row**: confirmed added to
  `skill-package-distribution.md`'s intent-mapping table, and confirmed it
  does not clobber or duplicate Unit I33's earlier `fgos:code-panel` label
  fix (read both rows directly).
- **Before/after word counts**: independently reproduced by running `wc -w`
  directly against the real `SKILL.md` files on disk — `fgos-code-change`
  2,314 words, `fgos-architecture-panel` 7,969 words — exact match with the
  report's claimed "after" numbers. The "before" numbers (12,209 combined,
  9,006) are correctly sourced from the real checked-in Phase-0 artifact
  (`phase-00-unit-0c-baseline-replay-measurement.json`, source commit
  `7853e4d7`) rather than reconstructed — matching the locked decision that
  reconstruction was already shown unworkable (`fgos-code-change` didn't
  exist at any pre-Phase-4 ref).
- **`distinctProviderFrom` doctor-check gap**: independently confirmed via
  direct grep of `src/setup/registrations.mjs` — zero hits, matching the
  report's claim exactly.
- **Token-count limitation**: confirmed the report states the
  `inputTokens: null` limitation explicitly and makes no token-reduction
  claim anywhere, per the unit's own stop condition.
- **Replay-corpus comparison**: reran `test/runner/coordination-baseline-measurement.test.mjs`
  myself on the merged tree — 10/10 pass, matching the report's claim.
- **CHANGELOG.md**: confirmed a genuine track-wide summary (Phase 0 through
  Phase 7's own shape and rationale), not just a one-line entry in the
  normal per-unit style — matches the explicit instruction this unit was
  given to treat this as the track's own closing entry.

## Full suite

Ran independently, in parallel with the implementer's own corrected
foreground run: 7982 tests, 7858 pass, 51 fail — all 51 confirmed (via
failure-file grep) to be the same pre-existing `test/rust-host/*`
binary-missing gap every worktree-based unit this track has hit (this
worktree never ran `cargo build --release --workspace`), zero overlap with
this unit's diff.

## Merge

`git -C /home/vantt/projects/forgentX merge --no-ff unit/I35` from the main
checkout onto post-I34 main, `ort` strategy, clean auto-merge, no
conflicts. `integratedSha = 9dfb5b8f4dde64e27c2d0599810f7fb3c0120649`.
Reran the replay-corpus test on the merged tree: 10/10 pass.

## Own mistake, caught and fixed same-turn

Lead's first attempt at writing this report used the Write tool against
`unit-I35-claude-only-execution-report.md` without checking whether that
exact filename already existed as the implementer's OWN deliverable (every
prior Phase 7 unit's implementer used a differently-named report file, so
no collision had occurred until this unit — a false pattern-match on past
behavior). This overwrote the implementer's real, already-merged 82-line
report with Lead's own content. Caught immediately via `git diff --stat`
showing unexpected changes to an already-clean, already-merged file.
Recovered the implementer's exact original content from git history
(`git show 71f490979:...`), restored it byte-for-byte (confirmed via empty
diff), and moved Lead's own report to this distinctly-named file instead.
No data was permanently lost; the fix landed in the same turn before any
commit made the overwrite durable.

## Track closure

Updated plan.md's top-level Status line to CLOSED and added a full
"Track Closure Summary" section (phase-by-phase breakdown, what shipped in
Phase 7, and all 7 real follow-up items explicitly named — none silently
dropped). This is the last plan.md edit of the track's own execution phase;
any further work on the 7 deferred items would be a new, separate
initiative, not a continuation of this plan.

## Process note — what actually kept this track's real defect rate low

Across all of Phase 7 (and really, the whole track from Phase 4 onward),
the pattern that mattered was never "implementers get everything right the
first time" — they didn't, consistently: I28 had a missing capability
allowlist, I30 missed a cross-doc port on the first pass, I33/I35 both hit
background-notification stalls, and Lead itself just made a real file-
collision mistake while writing this very report. What mattered was that
every gap was either self-flagged by the implementer (the overwhelming
majority of cases) or caught — by a peer, or by direct verification against
real source — before it became durable. This report is itself two
instances of that discipline in one place: every claim in the
implementer's own report was independently reproduced before being
accepted, and Lead's own mistake mid-report was caught and fixed before it
could compound.
