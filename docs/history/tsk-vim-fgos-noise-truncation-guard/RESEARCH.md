# Research: tsk-vim — FGOS_NOISE_ONLY_PATHS missing events-jsonl.truncation-guard.json

## Round 1 — 2026-08-24 (discovery stage)

**Asked:** Does `bin/fgos.mjs`'s `FGOS_NOISE_ONLY_PATHS` regex (used by
`excludeFgosPaths`) still miss `.fgos/events-jsonl.truncation-guard.json` as
the bug report claims? What is the file's exact real name on disk (the
report itself flagged this as possibly mistyped)? Do the three named
`test/cli/fgos-return.test.mjs` assertions actually fail today because of
this gap, and is there an existing exemption-test pattern to mirror for a
new regression test?

**Checked:**
- `bin/fgos.mjs:238-241` (`FGOS_NOISE_ONLY_PATHS`/`excludeFgosPaths`), read
  directly:
  ```js
  const FGOS_NOISE_ONLY_PATHS = /^\.fgos\/(events\.jsonl(\.backup-.*)?|events\/.*\.jsonl|events\/archive\/.*|entropy-history\.jsonl)$/;
  function excludeFgosPaths(files) {
    return files.filter((f) => !FGOS_NOISE_ONLY_PATHS.test(normalizePath(f)));
  }
  ```
  Confirmed: no alternative in the regex matches `truncation-guard.json` in
  any form.
- `ls .fgos/` on the real main checkout (`/home/vantt/projects/forgentX/.fgos/`)
  — the file exists there today, exact name confirmed:
  `.fgos/events-jsonl.truncation-guard.json` (hyphen before `jsonl`, dot
  before `truncation-guard.json` — matches the bug report's primary guess,
  not the "events-jsonl-truncation-guard.json" alternate spelling it also
  floated).
- Ran `node --test test/cli/fgos-return.test.mjs` on this branch (tsk-vim's
  worktree, unmodified `bin/fgos.mjs`) BEFORE any fix: 50 pass / 3 fail,
  reproducing exactly the three assertions the report named:
  1. line 238 test (tsk-x5r self-exempt) — `footprintDiffHits` unexpectedly
     contains `{ file: '.fgos/events-jsonl.truncation-guard.json' }` instead
     of `[]`.
  2. line 397 test ("ONLY .fgos/ is dirty") — sanity assertion
     `statusLines.length === 1` gets `3` instead — `git status --porcelain`
     now reports the truncation-guard file among other newly-untracked
     `.fgos/` paths as separate dirty lines instead of collapsing under a
     single `?? .fgos/` line.
  3. line 762 test (fresh-pick return, main-checkout-untouched assertion at
     line 789) — `gitHead(cwd)` after `return` no longer equals
     `mainHeadBefore`; the extra untracked/side-effect file changes what
     `git status`/HEAD comparison sees around the pick/return cycle.
  All three fixtures use `initGitCwd()`/`initGitCwdMain()` (isolated tmp
  repos, not the real main checkout) — the truncation-guard file is created
  as a real side effect of `fgos take`/`fgos pick` itself (post tsk-3ve
  event-log sharding), not something the tests fabricate, so this reproduces
  in any fixture that exercises take/pick, exactly as the bug report claims
  ("reproduces identically on main checkout and on multiple unrelated
  branches").
- Existing exemption-test pattern to mirror: `test/cli/fgos-return.test.mjs`
  lines 238-270 (`tsk-x5r self-exempt`, asserts `footprintDiffHits` stays
  `[]` when only exempted `.fgos/*` noise is dirty) and lines 279-301 (the
  sibling "does NOT exempt" test for `.fgos/gate-bypass.json`, proving the
  exemption stays narrow). A new case for
  `.fgos/events-jsonl.truncation-guard.json` fits the same shape as the
  first: write/commit the file alongside the item's own proof file, assert
  `footprintDiffHits` stays empty.

**Found:** the bug report's description and proposed fix are accurate as
stated, no correction needed. The exact real filename is
`.fgos/events-jsonl.truncation-guard.json` (confirmed on disk, not the
`events-jsonl-truncation-guard.json` alternate spelling). Fix is a single
regex-alternative addition in `bin/fgos.mjs`'s `FGOS_NOISE_ONLY_PATHS`,
narrowly scoped like the existing `entropy-history.jsonl` alternative (a
single top-level filename, not a directory glob) — same class of change as
the two prior precedents (tsk-4hl, tsk-x5r/tsk-5iv) this exemption regex
already carries.

**Decided:** append `events-jsonl\.truncation-guard\.json` as a new
top-level-filename alternative in `FGOS_NOISE_ONLY_PATHS`, matching the
existing `entropy-history\.jsonl` alternative's shape exactly (both are
flat filenames directly under `.fgos/`, never matched by the `events/`
subdirectory alternatives). Add one regression test mirroring the
`tsk-x5r self-exempt` test's shape for this specific file. tier/kind/risk
judged from this evidence: `kind: bug` (unchanged — already correct),
`risk: light` (single regex-alternative edit plus one test, same
blast-radius class as the tsk-x5r/tsk-4hl precedents, already-heavy default
was submission-time guess, not evidence-based), `tier: light` (mirrors
risk — small, well-scoped, already-reproduced fix).

**Remaining open:** none.

**Verify (real, runnable):**
```
node --test test/cli/fgos-return.test.mjs
```
(existing suite covering the three previously-failing assertions above,
plus one new case for `.fgos/events-jsonl.truncation-guard.json`; run the
full `node --test` suite once as a broader regression check since this
touches a shared exemption regex read by multiple call sites.)
