# HARDEN T8 landing unit: doctrine text, distill, render and census

Landed on main as `adb9cc204`, `c8325c203`, `1e14daec0`, one fast-forward, 2026-11-09 17:5x.

## What landed
- Source text and doctrine (domain doctrine read from the fgOS payload, dead skill name replaced, two unused shared fragments deleted).
- distill: refuses a source name or url that escapes the learning area.
- Render: one `npm run build:skills` over the three trees; `.claude/skills/instruction-audit/SKILL.md` newly tracked; census regenerated; one mirror assertion (every owned skill has a tracked `.agents` and `.claude` render).

## Evidence
- Render output: 14 tracked paths changed in the first build, matching the prediction (4 deleted fragment copies in `.agents` and plugin mirror, text edits in `fgos-coding-implement`, `fgos-coding-shaping`, `fgos-indexing`, `fgos-routing` across `.agents` and plugin mirror, `.claude/skills/fgos-indexing` wrapper, `distill.mjs`, `instruction-audit` new). No `ak-*` or foreign dir touched (files newer than the build stamp checked). Source deletions in the diff: 2 core/domain fragments plus 4 renders, 604 lines.
- A second build left `git status` and the diff byte-identical; a third after each rebase likewise.
- The census conflicted on every cherry-pick and rebase step; each time it was taken from origin/main and regenerated with `--write-census` (0 undeclared). The P09 script deletion commit was already on main, so only the distill commit was brought in.
- Doors scans from the plan's acceptance criterion 3: all return the stated result (nothing, or only `domain-registry.mjs:72` and `domain-dirs.mjs:13`).
- Focused set (skill-wrappers, fgos-mirror, citation drift, doc-health, architecture, dead-vocabulary, assignment-enumerator): 166 pass, 0 fail on the final tip.
- Full suite on the tip before the last rebase (log `/dev/shm/t8p12-full-172316.log`): 8609 tests, 2 fail: the known V7n addendum, and the two-tier cap test of the loop runner, which failed at load average 24 and passed 99/99 alone (`/dev/shm/t8p12-twotier.log`). No run-tests ERROR lines. The last rebase (config door commits, docs) was followed by the focused set only, per the land rules.

## Not done
- Release build, stage and activate on fg-server2 and the smoke after it: not run by this lead; the machine operator does it from the guide.

## Lessons
- A cherry-pick of a branch whose base is older than main conflicts in the census on every commit; keep a three-line loop (take origin's file, `--write-census`, `git add`, continue) instead of hand-merging.
- The first scan run builds Rust in the worktree's own `target/` when `CARGO_TARGET_DIR` is unset; export it before the first command, not after.
- Main moved twice during a 25 minute gate; rebase costs a minute but the full suite cannot follow each move, so the rule "focused set after the final rebase" needs saying in the brief.
- A branch can carry commits already on main under other SHAs (the script deletion); check the diff of an apparently empty cherry-pick before aborting.
