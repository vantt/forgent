# Reading an `ak:plan` plan

Read for [`fgos-cook`](../SKILL.md). The plan is an artifact. Nothing here is a
parser and nothing translates the plan into configuration: slicing is judgment made
at run time, with the real code in view. `fgos plan-lint <plan.md>` may be run as a
read-only check of capability annotations; it never gives you the slices.

## What an ak plan is like

1. **Phase files may have no frontmatter** and their headings may be translated.
   Read by meaning.
2. **Real dependencies sit in `plan.md`'s tables and wave diagram.** Tell "needed to
   write the code" from "needed to accept it". `dependencies: []` does not mean
   independent.
3. **A phase is often 2-10 hours.** Cut it into slices at capability boundaries and
   file boundaries, when you can see the code, not before.
4. **A file list is not a write scope.** Expand brace patterns, add generated files
   (lockfiles, render targets such as `.agents/skills/`), and respect "shared file
   owner" notes. A generated target is written by running its generator, not by hand.
   Put the resulting paths in the slice's `writes`; `fgos workflow propose` then adds
   the tests that exercise the code the slice changes and shows them as expansions.
   A test the worker had to edit outside its writes stays uncommitted in the case
   worktree and no later dispatch can land it, so check that list.
5. **Verification in a plan is a list of commands.** For each slice pick one narrow
   pass/fail command as its `--verify`; keep the full suite for the end.
6. **The plan states no rigor.** The slice table sets it from the write paths. Raise a
   slice, with a reason, where the paths hide a risk (behaviour behind a plain file,
   something hard to reverse); never lower it. What tier a rigor buys is not yours to
   say.
7. **Ignore the plan's own branch, worktree and merge-order rules.** The case has
   one worktree and one branch; landing is the approve door.
8. **A "Lead" phase, or one touching real environments** (activate, many
   workspaces), is for the owner or a consent gate, not a slice.
9. **"After red-team" corrections at the end of a phase win over the older text.**
   Read to the end of every file.
10. **Owner decisions recorded in `plan.md`** (numbered answers or locked-decision
    lists) go into the `--input` of every slice they touch.

## Check the plan against the code first

Before opening the case: does each named file and symbol exist, did a later commit
change what a phase assumes (`git log` on the paths), is any phase already done?
Reuse fresh evidence rather than redoing it. A step that contradicts the real code
is an owner question, not something to patch around.

## The frame

The frame is set once, when the owner accepts the plan (RUL-WF-12), and a case may
only narrow it afterwards. You do not size it: `fgos workflow propose` computes it
from the slices and prints it in the owner's question (see
[`propose.md`](propose.md)). Your part is the judgment it cannot make: where to cut
the slices, what really depends on what, the narrow `verify` of each, the outcome,
scope and non-goals, and the consent points (the guide requires owner consent before
merge).
