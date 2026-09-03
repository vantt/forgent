---
authoritative_for: npm test wall-clock dominated by fgos.test.mjs/checks.test.mjs, mechanical per-file test split, D5 wall-clock ceiling recalibration under real contention, atomic skill-wrapper copy race exposed by increased parallelism
---

# `node --test` parallelizes per file — so one slow file sets the whole suite's floor

`tsk-25b` closed a real, precisely measured cost: `node --test`
parallelizes across files, so the suite's total wall-clock is
approximately the cost of its single slowest file — every other file
runs essentially free, hidden behind it.

## Measured, not assumed

Real numbers from an isolated worktree (2026-08-11, each run alone and
sequential to avoid CPU contention): full suite, 118 files, 163.1s/2827
tests/0 fail; `test/cli/fgos.test.mjs` alone, 171.0s; `test/setup/checks.test.mjs`
alone, 109.0s; `test/runner/merge.test.mjs`, 2.0s; `test/architecture.test.mjs`,
0.14s. The other 117 files ran essentially for free behind
`fgos.test.mjs`. The measured consequence: any item touching code
`fgos.test.mjs` covers (i.e. `bin/fgos.mjs`) paid ~171s per verify
regardless of how narrow its own diff was — a companion item (`tsk-516`)
measured a narrowed 4-file subset covering the exact changed code at
172.6s, *slower* than the full suite despite covering 2095 fewer tests.
Narrowing verify scope could not rescue this cost; only splitting the
dominant files could. Each item pays this cost at least twice per pass
(return, then post-merge), so lowering it once lowers it for the entire
backlog.

## What shipped — a mechanical split, twice

`tsk-25b`'s own children (`tsk-3um`, `tsk-67g`, both already `done`) did
the first round of splitting. A second round (`99e1b913`) was needed
directly within this item's own drive: `main` had grown a large number
of new CLI verb tests in the same 9 files the first round had already
split (`fgos-intake`, `fgos-approve`, `fgos-read`, `fgos-post-merge`,
`fgos-return`, `fgos-edit`, `fgos-stage`, `fgos-merge`, `fgos-claim`),
pushing them back over the ~30s per-file ceiling — up to 164s for
`fgos-intake` alone. Same invariant both times (D2): test bodies moved
verbatim via a character-level scanner (respects strings/template
literals/comments, not a line-regex), any top-level helper function/const
a test needs following it to its new file.

## A latent race the split itself exposed — fixed inline, not deferred

Splitting `test/cli/*.test.mjs` from ~26 files to ~55 sharply increased
how many `fgos setup` CLI e2e subprocess tests could run concurrently —
each sharing the same `PACKAGE_ROOT` (the running `fgos` binary's own
checkout). `assembleSkills()`'s `fs.copyFileSync` calls into that shared
tree were never atomic (truncate-then-write), leaving a window where a
sibling process reading `.agents/skills/*` mid-write could observe a
momentarily-empty or partially-written `SKILL.md` — surfacing as
`"generateWrapperContent: source has no YAML frontmatter block to
copy"`, a different test losing the race each run. This was already
latently possible before the split; far fewer concurrent `fgos setup`
subprocesses existed to hit the window before parallelism increased.
Rather than deferring it to a separate item, `tsk-25b` fixed it inline
(`689124ed`/`79c7cfa8`): every single-file copy in `skill-wrappers.mjs`
(`copyDirRecursive`, `assembleSkills`, `generateAllSkillWrappers`'s
sub-file copy) now copies through a temp file in the same directory,
then renames — POSIX rename is atomic, so a concurrent reader always
sees either the complete old file or the complete new one, never a
partial write.

## The verify command's own ceiling needed real recalibration

The item's own `verify` command evolved through several widenings as
real machine contention (concurrent sessions on the same box, load
15-25 sustained for over an hour) pushed measured times above earlier
thresholds: the suite-wide margin widened to 220s (from an initial
tighter figure, after a contended-load run hit 160.56s), and the
per-file ceiling widened twice — to 40s, then to 90s after two different
files spiked under sustained load. Each widening is recorded directly in
the item's own `verify` command comments as D5, with the quiet-machine
baseline for every split file staying under 22s — the margin exists for
real observed contention on a shared machine, not because the split
itself became less effective.

## Living reproduction case for an unrelated bug

`tsk-3um` (this item's own child) later became the confirmed live
reproduction case for [`tsk-2jz`'s rebase-rehash blind spot](cleanup-harness-checkmerge-blind-spots.md)
in `checkMergeStillResolves` — a rebase on `tsk-25b`'s own branch (to
absorb the drift documented above) rewrote `tsk-3um`'s already-merged
commit to an identical-content new hash, which the merge-checker's frozen
`branchHeadAtReturn` couldn't recognize. Not a defect in this item's own
work — a downstream blind spot in a different subsystem, confirmed and
fixed separately.
