# HARDEN T8 P02: render core correctness (lead report)

Code commit `f00e9de5e` on branch `harden/t8-p02-render-correctness`; files: `src/setup/skill-wrappers.mjs` (759 -> 779 lines, budget 780), `test/setup/skill-wrappers.test.mjs` (+232), `CHANGELOG.md`, census.

## Decisions
- Link predicate: `scripts/build-rust-distribution.mjs` `collectSourceFiles` is a payload collector and `src` may not import `scripts`, so `lstatPlain` is local to `skill-wrappers.mjs`. Item for Packaging (T9): do not copy the predicate a third time.
- Copy-leaf sites: `atomicCopyFileSync`, `copyDirRecursive` (target dir), `copyAssembledFile`, wrapper write (source, dir, file), shared-fragment dir, `ownedSkillDirs` (every owned name). `carriesAssembledHeader` uses `lstatSync` and treats a link as not stamped, so a dangling link never aborts the orphan prune.
- `copyDirRecursive` survivors: wrapper subdirs, the mirror, the setup copy, canonical-skill assembly (`_shared` fragments use `pruneExtras` directly).
- Historical stamps (`git log -S`): wrapper `(tsk-1qi D5/D7)` and `(tsk-1qi)`; assembled header one form since the first stamped release. v0.1.0 wrote unstamped `.agents/skills` copies: accepted when the sibling `.claude` wrapper is stamped.
- Same-name refusal sits in `ownedSkillDirs` (optional stamp predicate), run for every target root by `assertTargetsWritable` before the first write.
- Skipping identical bytes was needed for "a second render writes nothing"; `written` still lists the wrappers.

## Tests
- New (8): link refusal; fixed point plus a no-write third render; plugin mirror stale removal; quoted stamps kept; same-name refusal in render and setup; historical forms overwritten; package filter (red against the old union, verified); drift-guard `.gitignore` message.
- Edited: the keep-newer-project-file fixture seeds stamped project copies; the orphan-wrapper fixture no longer doubles its frontmatter. Nothing retired.
- Focused (5 files + citation drift): 153 pass. Full suite: 8573 pass, 1 fail = the known V7n addendum.

Function-length scan not run; no function was grown past about 70 lines.

Status: DONE
