# How to declare `--footprint` when `fgos-coding-planning` splits an item

Use this when `fgos-coding-planning`'s own "Decide the split" step is creating
child items via `fgos add --parent <id>`, and you need those children's
footprints to actually feed the existing overlap advisory instead of
leaving it with nothing to compare.

## Before you start

`fgos-coding-planning`'s split step used to create children with no
`--footprint` at all — confirmed by grep, the word never appeared
anywhere in `fgos-coding-planning/SKILL.md`. This is a different gap from
`decompose.mjs`'s own automatic split (which already proposes a
`footprint` per child, even if that coverage isn't complete — see
`docs/explanation/auto-decompose-can-drop-a-locked-decision-from-every-
childs-footprint.md`): a manual split done via `fgos-coding-planning` produced
children with *no* footprint declared whatsoever, so the existing
pairwise overlap advisory (`footprintOverlapAmong`/`footprintConflicts`,
already used by `mergeReadiness` and `/fgOS:conflicts`) had nothing to
compare and was silently inert for every child created this way.

`--footprint` itself was never broken — it already worked, confirmed by
using it for real (`tsk-3c7`/`tsk-2ig`, children of `tsk-66o`). The gap
was purely that `fgos-coding-planning`'s own instructions never told a session
to fill it in.

## Steps

1. **Write down each split piece's files as part of the plan's own
   Approach/Shape section, before creating any child.** By the time
   you're deciding the split, you already know roughly which files each
   piece touches — this step just means writing that down explicitly
   instead of only carrying it in your head.

2. **Pass `--footprint` on the same `fgos add --parent` call that creates
   each child**, taken straight from the file list you just wrote down:

   ```bash
   root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
   fgos add --title "Build parser" --kind task --risk light \
     --verify "npm test -- parser" --description "Build parser" \
     --parent <id> --footprint "src/parser.mjs,test/parser.test.mjs" \
     --stage decompose --dir "$root"
   ```

   There is no reason to leave it blank — the files are already known at
   this point in the plan.

3. **Know what this buys you.** With every sibling's footprint declared,
   `footprintOverlapAmong` can actually catch a real collision between
   two split pieces before either one starts, instead of only surfacing
   it later at merge time (or never, if the advisory has nothing to
   compare against).

## What this fix didn't change

`--footprint` stays optional at the system level — this is a change to
`fgos-coding-planning`'s own instructions, not to `fgos add`'s schema or to
whether footprint is mandatory in general. It is purely a skill-prose
fix: no code path changed, because the footprint mechanism itself was
never the thing that was broken.
