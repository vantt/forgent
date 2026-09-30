# Unit I22 — Claude-only parallel execution report

Runbook: `runbook-claude-only-parallel-execution.md`. Branch `unit/I22`,
worktree `.claude/worktrees/coordination-skill-harness-i22-prompt-templates`,
base `main@81e1340ce` (post-I21), integrated `main@387570ed3`.

Migrates `fgos-architecture-panel`'s per-role "Task Packets" out of
`core/skills/fgos-architecture-panel/SKILL.md` into 12
`core/prompt-templates/architecture-advisory-panel-v1-*.md` files (11 new,
plus the pre-existing `scout-report.md`).

## Implementer (sonnet, fullstack-developer)

Built all 11 missing templates, trimmed SKILL.md's packet prose to a short
pointer table (970→736 lines, 9006→6866 words, -24%), resynced the 3 skill
mirrors. Correctly identified that the plan's "preserve the Task-spec: line"
requirement was moot: `buildInlineAssignment` never sets `taskSpec`, so the
legacy branch never rendered that line for these operations — verified by
both Lead and the independent reviewer separately.

## Independent test + review (round 1, opus, parallel)

Both agents independently found the same core defect and diverged on
severity in ways that combined to a complete picture:
- **H-1** (both): `architecture-advisory-panel-v1-scout-report.md` (a
  pre-existing template, unmodified by this unit) is only 22 lines of
  generic boilerplate — none of the deleted Context Investigator guidance
  (hypothesis-falsification hunting, counts-not-adjectives, looked-vs-
  did-not-look, absence-as-finding, never-recommend-an-architecture) landed
  anywhere. SKILL.md's own new pointer text claimed every template "carries
  this content directly", which was false for this one role. Lead
  independently confirmed by diffing all 11 new templates against the old
  SKILL.md and by line-counting: scout-report.md was the sole 22-line
  outlier against 10 siblings at 31-46 lines each.
- **M-1**: the Lead Advisor's lane rule ("never opens PROJECT_ROOT itself;
  reads intake/scout-report/synthesis/redteam, never a shaper's private
  notes") was dropped from both `interpretation.md` and `explanation.md`.
- **M-2**: `explanation.md` lost the "becoming the panel" avoid (writing
  the Lead's own architecture opinion instead of the synthesizer's).
- **M-3**: the test suite uses synthetic flat variables, not a real inline
  Assignment, and misses a live defect — real constraints render as
  `## Constraints\n- (none)` regardless of actual content.
- LOW-1..4: a wrong-reader instruction in `close-dialogue.md`, two smaller
  dropped prompts, a plan-ID citation in a test name/SKILL.md prose (repo
  convention precedent, not a defect), and pre-existing broken mirror
  links/dangling doc reference (predates this unit).

## Fix round 1 (1f4993f62, de05a94ec, 0076ba66f — all committed within round 1)

Iterative, with two Lead pushbacks after independent re-verification caught
gaps the fixer's own re-checks missed — this is the intended discipline, not
a process failure:

1. **H-1 fixed** (`1f4993f62`): condensed the deleted Context Investigator
   guidance into `scout-report.md`, matching the other 10 templates' prose
   pattern.
2. **M-3 — first pass wrongly closed, Lead caught it.** The fixer's first
   re-check used a hand-built flat `variables` object (the same mistake the
   test-i22/review-i22 finding described) and concluded "not a bug". Lead
   independently traced the real call path
   (`renderAssignmentPrompt`→`resolveAndRenderOperationPrompt`, then
   `assignment.mjs`'s `buildInlineAssignment`/`buildDeclaredAssignment`) and
   proved decisively that **no Assignment builder in this codebase ever
   puts a top-level `constraints` field on the returned object** — real
   values only live nested under `provenance.inline.contract.constraints`.
   `target.constraints ?? []` therefore always fell through to `[]` for
   every assignment ever built, meaning every templated operation prompt —
   not just architecture-panel's — rendered "no constraints" regardless of
   truth. Sent back with exact evidence; fixer confirmed, fixed with the
   same provenance-aware fallback chain `legality-facts.mjs`'s
   `assignmentServesOperation` already uses for the identical problem
   (`de05a94ec`), and rewrote the regression test to build a real inline
   Assignment via `buildAssignment()` and assert through both
   `resolveAndRenderOperationPrompt` and the real `renderAssignmentPrompt`
   dispatch path.
3. **Scope-wording fixed** (`de05a94ec`): `redteam.md` and
   `constraint-proposal.md` reworded to scope evidence explicitly within
   `{contextRefs}`; fixer proactively found and fixed the identical defect
   in `constraint-findings.md` too (not named in the original brief),
   flagging the extension explicitly rather than silently expanding scope.
4. **M-1/M-2 — first pass wrongly claimed complete, Lead caught it.** The
   fixer's "generalized audit" report claimed scout-report.md was the only
   casualty. Lead re-read `interpretation.md`/`explanation.md` against the
   exact old SKILL.md region and confirmed both M-1 and M-2 were still
   missing. Sent back with the exact quoted source text; fixer fixed both
   (`0076ba66f`) and re-diffed the full Lead Advisor section bullet-by-
   bullet, finding no further gaps.

## Lead final verification and merge

Independently re-read every commit's diff directly (not only the fixer's
self-reports) and re-ran the tests myself:
- `test/runner/operation-prompt-templates.test.mjs`: 34/34 pass, including
  the new real-Assignment constraints regression test (confirmed it fails
  against the pre-fix code, passes after).
- `operation-prompt-templates.test.mjs` +
  `coordination-architecture-advisory-panel-conformance.test.mjs`: 47/47
  pass.
- Full `env -u CLAUDE_CODE_SESSION_ID npm test` on the worktree: 7906 pass,
  1 fail (`test/runner/dispatch.test.mjs`'s `spawnWorker` maxBuffer-kill
  test — a file this unit never touched). Reran that file alone: 390/390
  pass. Confirmed a resource-contention flake from concurrent full-suite
  runs on the machine (I23's fix round found an equivalent flake in a
  different test in the same file at the same time), not a regression.

`git -C /home/vantt/projects/forgentX merge --no-ff unit/I22` from the main
checkout onto post-I21 `main@81e1340ce`, `ort` strategy, clean auto-merge.
`integratedSha = 387570ed30f7b482df1078772cf7e154209c69c1`. Reran the 3 key
suites (156/156 pass) on the merged tree to confirm the merge introduced
nothing unexpected.

No rust-host regeneration needed — this unit never touches
`COMMAND_REGISTRY`/`command-routes.json` (prompt-templates and SKILL.md
only).

## Process note

Both Lead pushbacks in this round followed the same pattern: the fixer's
own re-verification methodology missed exactly what the original
independent reviewer's methodology had caught (synthetic test inputs vs. a
real object graph; a partial diff vs. the full old-SKILL.md region). Lead
independently reproducing the reviewer's own technique — not just re-
reading the fixer's conclusion — was what caught both. This is the
established discipline from I21 (round-1/round-2 confinement gap) applied
again, successfully, within a single round this time.
