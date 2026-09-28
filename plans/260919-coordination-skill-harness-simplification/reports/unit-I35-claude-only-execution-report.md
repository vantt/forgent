# Unit I35 — Claude-only parallel execution report

Runbook: `runbook-claude-only-parallel-execution.md`. Branch `unit/I35`,
worktree `.claude/worktrees/coordination-skill-harness-i35-track-closeout`,
base `main@ab7fe598d` (post-I34, the last unit in the track). Assigned
directly (docs/report/CHANGELOG closeout unit, no separate
Tester/Reviewer round spawned for this unit).

Phase 7 item 3/6/7, final unit of the entire
`coordination-skill-harness-simplification` track.

## Implementer (this agent, sonnet)

1. Added the `/fgos:code-change` row to `skill-package-distribution.md`'s
   intent-mapping table, directly after the now-`deprecated` `fgos:code-panel`
   row. Confirmed I33 (merged earlier, `5f4ed37b8`) already fixed this same
   table's stale `fgos:code-panel` "implemented" label — no duplicate edit,
   this unit only adds the missing row.
2. Ran `scripts/measure-coordination-baseline.mjs --corpus
   test/fixtures/coordination-baseline/sessions` fresh at this worktree's
   `main` HEAD (`ab7fe598d`) — the exact reproducible command Phase 0's own
   artifact recorded, for an apples-to-apples comparison. Used the real
   checked-in Phase 0 artifact (`reports/phase-00-unit-0c-baseline-replay-
   measurement.json`, source commit `7853e4d7`) as "before" — no
   reconstruction, per this unit's decision text.
3. Confirmed `distinctProviderFrom` (Unit I21) has no dedicated `fgos
   doctor` check: grepped every `registerDoctorCheck` call and registered
   `id:` in `src/setup/registrations.mjs` (28 total), zero hits for
   `distinctProviderFrom`. Its sibling field `capability` does have one
   (`operation-capability-resolves`). Disposed as an accepted, documented
   gap (the limitation is already named in `binding.mjs`'s own source
   comments) rather than adding new scope to this closeout unit.
4. Ran the replay-corpus comparison explicitly: `node --test
   test/runner/coordination-baseline-measurement.test.mjs` — 10/10 pass,
   including the deterministic-digest and mutation-sensitivity tests that
   exercise `src/runner/coordination/replay.mjs` against the real,
   committed `test/fixtures/coordination-baseline/sessions` corpus. The
   fresh replay's `semanticDigest` matched the Phase 0 artifact's digest
   byte-for-byte, confirming the corpus/replay path itself is unaffected by
   the Phase 4-7 skill rewrites.
5. Published `unit-I35-before-after-comparison-report.md` with the full
   before/after numbers, exact commands, exact git refs for both
   measurements, and the `inputTokens: null` limitation stated explicitly
   (word/byte/line counts only — no token-reduction claim anywhere).
6. Added the final `[Unreleased]` CHANGELOG entry summarizing the whole
   track's shape (Phase 0 baseline -> Phase 4 driver-discipline extraction
   -> Phase 5 panel rewrite -> Phase 6 code-change merge -> Phase 7
   contract/closeout), not just this unit's own diff, per instruction.

## Self-caught error, corrected before commit

Two of the three deliverables (`skill-package-distribution.md`'s edit, and
the before/after report file) were initially written against the **main
checkout** instead of this worktree — a direct violation of this track's
own invariant #1 ("một worktree một unit... không bao giờ chạy git/write ở
path khác"). Caught by checking `git status` on the main checkout path
before commit. Reverted the accidental main-checkout edit
(`git checkout --`), moved the misplaced report file into the correct
worktree location, and reapplied the doc edit correctly inside the
worktree. Confirmed clean before proceeding: `git status --porcelain` on
the main checkout shows no trace of either file; the worktree's `git
status --porcelain` shows exactly the 3 expected files
(`CHANGELOG.md`, `skill-package-distribution.md` modified;
`unit-I35-before-after-comparison-report.md` new, untracked pending add).

## Verification run in this worktree

- `env -u CLAUDE_CODE_SESSION_ID npm test` — see result appended after this
  report is committed (ran once, see commit message / final message for the
  pass/fail counts; this worktree did not run
  `cargo build --release --workspace`, so any pre-existing
  `test/rust-host/*` binary-missing failures are expected, not a
  regression).

## Unresolved / follow-up

- `distinctProviderFrom` doctor-check gap: named, not fixed (see above) —
  candidate for a future unit, same status Unit I21's own review left it in.
- Track closeout: this is the last block for `coordination-skill-harness-
  simplification`. Lead still owns the actual `plan.md` unit-I35 block
  write-up, final merge into `main`, and worktree cleanup per the runbook
  (this agent only commits on `unit/I35`, does not merge).
