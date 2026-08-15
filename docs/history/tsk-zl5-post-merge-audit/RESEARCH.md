# RESEARCH — tsk-zl5 (post-merge review of tsk-1y6 and tsk-3xog)

## Round 1 — 2026-08-15 — Discovery stage, scope-grounding pass

**Asked:** Are the merge commits, diff ranges, design context, and every
file the review task names actually real and readable — before treating the
task's checklist as a valid plan input?

**Checked:**

- `git cat-file -t 210a4a61` / `f8cf7e36` / `6bfb149c` — all resolve to real
  commits. `git merge-base --is-ancestor 210a4a61 HEAD` → true.
  `git log --oneline --all | grep` confirms `210a4a61` = "Merge branch
  'fgw/tsk-1y6'", `f8cf7e36` = "Merge branch 'fgw/tsk-3xog'".
- All 22 files named across the task's checklist (bin/fgos.mjs,
  src/setup/registrations.mjs, src/evolve/iron-law.mjs, the 6 new/changed
  test files, docs/history/tsk-1y6-1/iron-law-evidence.md,
  plugins/fgOS/skills/approve/SKILL.md, merge-loop/SKILL.md,
  merge-next/SKILL.md, docs/specs/runner.md, docs/decisions/0032-*.md,
  docs/decisions/0000-index.md, CHANGELOG.md, both fgos-coding-exploring
  SKILL.md mirrors, scripts/check-locked-decisions-heading-drift.mjs +
  its test, docs/history/tsk-3xog/plan.md, test/skills/fgos-mirror.test.mjs,
  scripts/check-decision-citation-drift.mjs) exist on disk (`ls -la`, all
  hit, none missing).
- `docs/history/iron-law-gate-human-ux/CONTEXT.md` read in full: contains
  exactly D1-D9 as a `## Locked decisions` table, matching the task's
  description of each decision verbatim (trunk-only boundary, D2 human-
  decides/agent-acts, D3 ask/warn levels, D4 no bypass field, D5 blocked-
  item-doesn't-stall, D6 keyword-half out of scope, D7 config key shape,
  D8 kind:'engine' record, D9 one /fgOS:approve skill with blast-radius-
  first). The task's own "do not re-litigate D1-D9" instruction is grounded
  in a real, existing locked-decisions table, not a fabricated citation.

**Found:** Every artifact the review task names is real, present, and
matches its own description. No fabricated file paths, no fabricated
decision IDs, no fabricated commit SHAs. The task is a well-grounded,
fully-specified review checklist against real merged code.

**Still open:** None at the scope-grounding level. The actual technical
verification (does the code match D1-D9, does A1b/D6/D7/D8 hold, does the
heading-drift guard have false-negative gaps, is npm test currently green)
is the review's own substance — that's executing-stage work, not a
discovery-stage ambiguity.
