# P00-P03 Main Sync Proof

**Status:** accepted for main publication.

**Track branch:** `test-suite-feedback-cost`

**Synced with main:** merged `origin/main` at `85c904b9e1ed93c412d4b9a109ff8f92ddd9becf` into the track with no conflicts.

## Scope Audit

Compared to `origin/main` before publication, the track carries only the P00-P03 work:

- P02 timing/profiling support: `scripts/test-timing.mjs`, `test/scripts/test-timing.test.mjs`, retained baseline/profile artifacts, and `reports/green-baseline.md`.
- P03 docs-index pilot: `test/report/helpers/docs-index-state-fixture.mjs`, scoped edits to `test/report/enduser-index.test.mjs`, and `reports/docs-index-pilot.md`.
- Track status documentation: `plan.md` now marks P00-P03 complete on track and P04 next.

No production docs-index implementation files were touched by P03.

## Proof Run

- `node --test --test-name-pattern='genuinely legacy durable-doing item' test/cli/fgos-intake-4.test.mjs` — pass, 1/1.
- `CLAUDE_CODE_SESSION_ID=agent-session-probe node --test --test-name-pattern='genuinely legacy durable-doing item' test/cli/fgos-intake-4.test.mjs` — pass, 1/1.
- `FGOS_SESSION_ID=agent-session-probe node --test --test-name-pattern='genuinely legacy durable-doing item' test/cli/fgos-intake-4.test.mjs` — pass, 1/1.
- `node --test test/scripts/run-tests.test.mjs test/scripts/test-timing.test.mjs test/report/enduser-index.test.mjs` — pass, 70/70.
- `cargo build --release --workspace` — pass.
- `npm test` — pass, 6762 tests, 6753 pass, 9 skipped, 0 fail, duration 380282.598 ms.
- `git diff --check` — pass.

## GitNexus

`node .gitnexus/run.cjs detect_changes` could not run because this worktree has no `.gitnexus/` directory and no `.gitnexus/run.cjs` file:

```text
NO_GITNEXUS_RUN_CJS
ls: cannot access '.gitnexus': No such file or directory
ls: cannot access '.gitnexus/run.cjs': No such file or directory
```

Manual fallback audit used `git diff --name-status origin/main...HEAD` plus the working `plan.md` diff. The reviewed scope matches the P00-P03 file leases and does not overlap the unrelated dirty main-checkout user changes called out for this handoff.

## Next

P04 (`phase-04-external-claude-isolation-pilot.md`) remains the next unopened cell. P05-P08 remain planned.
