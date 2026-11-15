# Phase 09: the doors row and close

Start after: 03, 04, 05, 06, 07 and 08 landed on the integration branch. Rules: [phase-lead-rules.md](phase-lead-rules.md).
Facts: F3, F5. Worktree `ywd-p09`, report slug `ywd-p09-door-row`. Effort: 1h.

## Context

The guard lands last so it carries no debt (every writer is already on the door). It is a new row in
`docs/architecture-manifest.json` `doors`, checked by the existing `checkDoors` (`test/architecture.test.mjs:1817`); no
test code changes. Per-line matching over code and string text (F5).

## Requirements

1. Red-first evidence, before adding the row: in a scratch copy of `test/architecture.test.mjs` logic (a node one-liner that
   imports `checkDoors`, `doorText` is internal, so call `checkDoors([row], files)` with `files` read the way `doorFiles()`
   does, or temporarily add the row and run the test), run the row against the integration branch's merge base with
   `origin/main` (writers not moved) and record the failures in the report. Expected hits:
   `src/report/knowledge-projection.mjs:17`, `src/report/decision-index.mjs:97`, `src/workflow/case-runtime.mjs:198`,
   `scripts/knowledge-canary.mjs:39`, `scripts/project-agents.mjs:133` (and `:137`), plus the allowed
   `core/skills/distill/scripts/distill.mjs:245`; nothing else. Planning-time dry run on `origin/main` `0b425a2f0` (the four patterns over the
   `doorFiles()` set, comments blanked by `lexSource`) found exactly these lines. A hit outside this list is either a sixth writer (stop,
   report to the plan lead) or a false positive (tighten the pattern, record why).
2. Row (append to `doors`):
   ```json
   {
     "job": "emit YAML text",
     "kind": "door",
     "patterns": [
       "(['\"`])---(?:\\\\r)?\\\\n",
       "`---$",
       "(['\"`])---\\1\\s*[,\\]]",
       "\\.push\\(\\s*(['\"`])---\\1\\s*\\)"
     ],
     "allowed": [
       "src/util/yaml.mjs",
       { "path": "core/skills/distill/scripts/distill.mjs", "reason": "standalone shipped skill script; runs in user projects without the fgOS addon" }
     ],
     "debt": [],
     "reason": "only src/util/yaml.mjs writeFrontmatter writes YAML text in Node, through the crate's emit (the addon's yaml.emit); a hand writer opens a block with a fence string: a quoted `---` followed by an escaped newline, a template line ending in `---`, a `---` array element, or a pushed `---`. Per-line match on code and string text: YAML built without a fence literal, or a fence assembled from parts, is not seen"
   }
   ```
   Verify each JSON string compiles to the regex the reason describes (print `new RegExp(source)` in the report).
3. Run the row on the integration head: `node scripts/run-tests.mjs test/architecture.test.mjs` green (no stale entry,
   no hit outside `allowed`).
4. `docs/backlog.md:22` row `p-eqhfqpz3gy`: status `done`, one clause with the integration head commit.
5. If Q1 was answered (b) or not answered: add one backlog row (id from `fgos identity mint backlog --json </dev/null`,
   never hand-made) for the agent-projection model question, text from plan.md Q1 option (b), status `proposed`.
6. Plan status through `ak plan` (run `ak plan --help` first; never edit status cells by hand).
7. CHANGELOG: name the `## [Unreleased]` line for the big lead in the report (the plan lead or big lead writes it):
   "Generated agent files and every fgOS-written frontmatter block now go through the native YAML door, so a value with
   `: ` or another special character is quoted and always reads back the same." Only if Q1 was answered yes (agent files
   regenerated) is the agent part user-visible; otherwise propose no line.

## Files

- Modify: `docs/architecture-manifest.json` (one row), `docs/backlog.md` (one row), `plans/261115-1731-yaml-write-door/plan.md` (status via `ak plan`).
- Create/Delete: none. Tests retired: none.
- Net size: +15 JSON lines.

## Acceptance

- `test/architecture.test.mjs` green with the row; the red-first run in the report lists exactly the five writers plus the
  allowed distill line.

## Risks / rollback

- Another plan (S4) lands rows in `docs/architecture-manifest.json` at the same time (H x L): additive; rebase and rerun
  the architecture test; never hand-merge. Revert: drop the row (no debt to restore, the writers are moved).
