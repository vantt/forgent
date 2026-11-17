# Regenerate the four stale agent files

Backlog row p-bazzipipk5. Owner confirmed 2026-11-17: regenerate.

## What ran
- `node scripts/project-agents.mjs` (whole run) refuses: `.claude/agents/code-reviewer.md` has no generated stamp (kit-owned file), and the script writes nothing when any target is refused.
- So the four were projected through the generator's own exported `projectAll`, passing only their definitions (council-assumptions, council-feedback-loops, council-ship-maintain, fgos-placeholder). No hand edits.
- Changed files: the four `.claude/agents/*.md` only (no companion rewritten by the generator), plus the backlog row note.

## Result
- Frontmatter of all four parses with `parseYaml` (src/util/yaml.mjs): keys name, description, tools (+ skills for placeholder); no `model`.
- Council descriptions are now quoted; placeholder skills now a block list and `fgos-unlock` became `fgos-lock-fence` (the source yaml's current value).
- Tests (one per run, via scripts/run-tests.mjs): project-agents 18/18, architecture 61/61, doc-health 8/8.
- CHANGELOG: not changed. Repo-local agent files for this checkout, not something fgOS users see.
- Backlog: row kept `proposed`; its done-condition also needs the model decision and a drift check, neither done. Row text updated with what landed.

## Separate items for the owner
- Generator ought to decide on writing a `model` (cost / seat-binding); not changed here.
- Generator fails the whole run when any `.claude/agents` file is not generator-owned; it should skip or scope to its own files. Likely a new backlog item.
- No test compares committed agent files with generator output (already in the row).

## Lessons
- A refusal in a batch generator blocks everything; exported per-file function lets you scope to the owned files without editing it.
- A bare worktree has no addon; `ensureAddonForScript()` builds it first when calling generator exports directly.
