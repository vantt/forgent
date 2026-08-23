# RESEARCH — tsk-1qn (review tsk-5tm, fix bug in-branch if found)

## Round 1 — 2026-08-15

**Asked:** What did tsk-5tm (parent + 6 children) actually change on `main`,
and is `npm test` a real, runnable verify command for this repo?

**Checked:**
- `fgos show tsk-5tm --json`: `status: delivered`, `mergedSha:
  e774207b20729a197c55b4aa51532ca77502790f`, `mergedInto: main`. 6 children
  (`tsk-5tm-1`..`tsk-5tm-6`) all `status: retrospective`.
- `git log -1 --format='%P' e774207b2...`: merge commit parents
  `e8ab7daa` (main before) and `6e37e720` (tip of `fgw/tsk-5tm`).
- `git diff --stat e8ab7daa 6e37e720`: isolates exactly what `fgw/tsk-5tm`
  contributed (independent of unrelated commits that landed on main in
  between branchHeadAtTake and merge). Code-touching files:
  - `src/runner/dispatch.mjs` (+532/-…, largest diff)
  - `test/runner/dispatch.test.mjs` (+775/-…)
  - `scripts/project-agents.mjs` (+32/-…)
  - `test/scripts/project-agents.test.mjs` (+41/-…)
  - `.agents/skills/_shared/capacity-dispatch-fallback.md` +
    `plugins/fgOS/skills/_shared/capacity-dispatch-fallback.md` (generated
    mirror)
  - `.agents/skills/fgos-fanout/SKILL.md` + `plugins/fgOS/skills/fgos-fanout/SKILL.md`
  - `.agents/skills/fgos-researching/SKILL.md` + `plugins/fgOS/skills/fgos-researching/SKILL.md`
  - `docs/specs/runner.md`
  - docs-only: `docs/history/task-dispatch-unification/{CONTEXT,DISCUSSION,plan}.md`,
    `docs/history/tsk-5tm-{1..6}/{iron-law-evidence,plan}.md`,
    `plans/reports/...fable-second-opinion-report.md`
- `npm test` (`package.json`'s own `"test": "node --test 'test/**/*.test.mjs'"`)
  run in full from the claimed worktree: **3338 tests, 3333 pass, 0 fail, 5
  skipped, 0 cancelled** — real and currently green.

**Found:** review scope is grounded to the code-touching file list above,
principally `src/runner/dispatch.mjs` (the file tsk-5tm's own D1/D5/D9/D11
targeted) plus its test file and the two generated skill-prose mirrors.
`npm test` is a real, runnable, currently-passing verify command — reuse it
rather than inventing a narrower one, matching tsk-5tm's own `verify`.

**Still open:** none for discovery purposes — the actual line-by-line
review (does the shipped code match D1-D12, any real bug) is the item's own
`executing`-stage work, not a discovery-stage question.
