# Phase 09: the doors row and close

Start after: 03, 04, 05, 06, 07 and 08 landed on the integration branch. Rules: [phase-lead-rules.md](phase-lead-rules.md).
Facts: F3, F5. Worktree `ywd-p09`, report slug `ywd-p09-door-row`. Effort: 1h.

## Context

The guard lands last so it carries no debt (every writer is already on the door). It is a new row in
`docs/architecture-manifest.json` `doors`, checked by the existing `checkDoors` (`test/architecture.test.mjs:1817`); no
test code changes. Matching is per line over code and string text, in `DOOR_ROOTS` with `DOOR_EXTENSIONS` only (F5).
What it can see: a frontmatter fence written as a literal. What it cannot see: YAML built without a fence literal, a
fence assembled from parts, files outside the scanned roots and extensions (`plugins/`, `tools/`, `herdr-dashboard/`,
`.ts`/`.tsx`/`.py`). The census (F3) found no writer there; the row's job and reason say exactly this, no more.

## Requirements

1. Row (append to `doors`):
   ```json
   {
     "job": "write a YAML frontmatter fence",
     "kind": "door",
     "patterns": [
       "(['\"`])---(?:\\\\r)?\\\\n",
       "`---$",
       "(['\"`])---\\1\\s*[,\\];]",
       "\\.push\\(\\s*(['\"`])---\\1\\s*\\)"
     ],
     "allowed": [
       "src/util/yaml.mjs",
       { "path": "core/skills/distill/scripts/distill.mjs", "reason": "standalone shipped skill script; runs in user projects without the fgOS addon" }
     ],
     "debt": [],
     "reason": "only src/util/yaml.mjs writeFrontmatter writes a frontmatter block, through the crate's emit (the addon's yaml.emit), so quoting is the crate's and every block reads back to its value; a hand writer opens a block with a fence literal: a quoted `---` followed by an escaped newline, a template line ending in `---`, a `---` array element or constant, or a pushed `---`. Per-line match on code and string text in the scanned roots: YAML text built without a fence literal, or a fence assembled from parts, is not seen"
   }
   ```
   Planning-time dry run on `origin/main` `0b425a2f0` (these four patterns over the `doorFiles()` set, comments blanked by
   `lexSource`): hits exactly `src/report/knowledge-projection.mjs:17`, `src/report/decision-index.mjs:97,101`,
   `src/workflow/case-runtime.mjs:198,203`, `scripts/knowledge-canary.mjs:39`, `scripts/project-agents.mjs:133,137`, and the
   allowed `core/skills/distill/scripts/distill.mjs:245`. No separate red-first run: the row lands after the writers moved,
   and its proof is the existing test (stale `allowed` entry or an outside hit fails by name).
2. `node scripts/run-tests.mjs test/architecture.test.mjs` green on the integration head. If an outside hit appears, it is
   a writer the census missed: stop and report to the plan lead.
3. `docs/backlog.md`:
   - row `p-eqhfqpz3gy`: status `done`, one clause with the integration head commit;
   - two new rows, ids from `fgos identity mint backlog --json </dev/null` (never hand-made), status `proposed`:
     (a) the committed `.claude/agents/*.md` are stale against `scripts/project-agents.mjs` (model lines, invalid YAML in the
     three council files), with the owner's Q1 answer if given; (b) `distill.mjs` writes `url: ${url}` with a check that
     does not refuse a newline (`core/skills/distill/scripts/distill.mjs:245`, the url check near `:282-293`), so a crafted
     url can add frontmatter keys to its own index file.
4. Plan status through `ak plan` (run `ak plan --help` first; never edit status cells by hand).
5. CHANGELOG: propose no line in the report unless a user-visible output changed: rows 1-4 keep their bytes, and the agent
   files are not regenerated. The hidden-character escaping in the crate is visible only for values holding such characters;
   name it for the big lead as a candidate line: "YAML written by fgOS escapes invisible bidi and zero-width characters
   instead of writing them raw."

## Files

- Modify: `docs/architecture-manifest.json` (one row), `docs/backlog.md` (three rows), `plans/261115-1731-yaml-write-door/plan.md` (status via `ak plan`).
- Create/Delete: none. Tests retired: none.
- Net size: +15 JSON lines, +2 backlog rows.

## Acceptance

- `test/architecture.test.mjs` green with the row; the report prints `new RegExp(source)` for each pattern and the final
  `allowed` list; backlog row done and two new rows present.

## Risks / rollback

- S4 lands rows in `docs/architecture-manifest.json` at the same time (H x L): additive; rebase and rerun the
  architecture test; never hand-merge. Revert: drop the row (no debt to restore, the writers are moved).
