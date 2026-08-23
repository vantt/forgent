# RESEARCH.md — tsk-3rg

## Round 1 — 2026-08-13 (fgos-researching, stage discovery)

**Goal:** confirm both frictions the item describes and their real fix.

**Friction 1 — `fgos approve` refuses from a worktree, `pick/SKILL.md`
step 6 doesn't warn.** Read `plugins/fgOS/skills/pick/SKILL.md:161-168` —
confirmed the `awaiting-approval` branch tells the user to run `fgos
review`/`approve`/`reject` next but says nothing about leaving the
worktree first. Directly reproduced this exact friction in the parent
cook session earlier today (tsk-2tk/tsk-blk): had to call `ExitWorktree`
before `fgos approve` would run, exactly as the item's own repro
describes.

**Friction 2 — the isolation guard rejects the documented `root=$(...)`
+ `node .../fgos.mjs` two-line pattern.** Reproduced live, from inside
this item's own worktree:
- `root=$(git rev-parse ...)` alone: works.
- `root=$(git rev-parse ...)` then `node "$root/bin/fgos.mjs" ... --dir
  "$root"` in the SAME tool call (semicolon- or newline-separated):
  refused — "too complex to verify that it stays inside the worktree".
- `root=$(git rev-parse ...)` then `pwd` (a non-fgos second command) in
  the same call: works fine — confirms the trigger is specifically a
  `git`-rooted command chained with a `node .../fgos.mjs ... --dir`
  invocation, not multi-statement calls in general.
- The SAME two commands run as two SEPARATE tool calls, with the second
  substituting the literal resolved path instead of `$root`: works.
- Same result confirmed for the `node -e "..." -- "$root" ...` shape
  `fgos-coding-validating`'s gate-check snippet uses (tested standalone
  with a literal path arg — works fine as its own single call).

Found via full-repo grep: the pattern appears in 4 files (9 occurrences
total) — `fgos-coding-implement` (2), `fgos-coding-planning` (1),
`fgos-coding-validating` (2), `fgos-coding-exploring` (3), all 3-way
mirrored. `fgos-coding-driving/SKILL.md` never mentions
`approve`/`review`/`ExitWorktree` at all — it hands its stop back to
whichever caller invoked it (e.g. `pick`), so friction 1's fix belongs
entirely in `pick/SKILL.md`, nothing to add there.

## Decision: inline guidance, not a new `_shared/` file

The item's own text left open whether to centralize the fix into a
`_shared/` doc instead of repeating it. `.claude/skills/_shared/` today
holds one file (`capacity-dispatch-fallback.md`, 18.2K, a genuinely
complex multi-step dispatch protocol). This fix's content is a single
sentence repeated with minor wording differences — introducing a new
shared-fragment file and a cross-reference convention for something this
small is over-building (YAGNI) relative to duplicating one sentence in
4 already-mirrored files. Went with inline guidance at the first
occurrence per file (once per file, not once per occurrence — 9
occurrences would be noisy; the note in `fgos-coding-validating` also
states explicitly it covers the file's second occurrence too).

## Verify / classification

Real verify (ran, green): `node --test test/skills/fgos-mirror.test.mjs`
(7/7) plus a full `npm test` before return. Item's own risk/tier
(unchecked at discovery time — to be judged after this evidence, prose
only, same weight class as `tsk-2tk`).

**Clear.**
