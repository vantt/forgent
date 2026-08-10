# RESEARCH: tsk-n2x — sync-root direct-test gap

## Round 1 — 2026-08-10

**Asked:** is there any unresolved question left before this item can move
past `discovery`, given the item's own description already names both
missing outcomes and points at a specific existing test block?

**Checked:**
- `bin/fgos.mjs:3226-3334` (the full `sync-root` verb body) — read directly,
  cited with line numbers in `CONTEXT.md`'s Scout evidence section.
- `test/cli/fgos.test.mjs:6108-6291` (existing direct `sync-root` tests) —
  read in full; confirms the exact 2 gaps the item names and rules out any
  third gap being silently missed.
- `test/cli/fgos.test.mjs:5753-5771` and `5914-6017` (`approve`'s own Iron
  Law + verify-fail tests) — the concrete pattern to mirror, already proven
  working against the same underlying `mergeRunnerItem` outcomes `sync-root`
  reuses.
- `docs/history/merge-next-auto-sync-root/plan.md:35` (tsk-173, the item
  that originally surfaced this gap) — confirms the gap is real and named
  independently by a second item, not just this one's own description.
- `docs/how-to/avoid-vacuous-pass-with-node-test-test-name-pattern.md` —
  read in full; used to shape the item's own `verify` field so it cannot
  report a false pass.

**Found:** every fact needed to lock scope, test shape, and a real `verify`
command was already available directly in this repo — no external lookup
needed, no library/concept/pattern outside what the codebase itself already
demonstrates via `approve`'s existing tests. No genuine open question
remains.

**Still open:** none.

**Verdict:** `clear: true` — see `CONTEXT.md` (same directory) for the full
locked-decisions record (D1-D4), already gate-approved.
