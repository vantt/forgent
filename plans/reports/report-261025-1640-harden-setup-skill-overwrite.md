# Setup overwrote project skill files with the release copy

## Write path and cause
`bin/fgos.mjs` setup calls `materializeSkillsIntoProject(PACKAGE_ROOT, repoRoot)` (`src/setup/skill-wrappers.mjs`). It had two unconditional writers into the project:
- `copyDirRecursive` -> `atomicCopyFileSync` into `.agents/skills` (documented as "source is canonical, a stale target copy is replaced").
- `generateAllSkillWrappers` -> `writeFileSync` of each `.claude/skills/<name>/SKILL.md` wrapper plus `copyDirRecursive`/`atomicCopyFileSync` of every sibling file (`references/`, `scripts/`, `CREATION-LOG.md`) from `.agents/skills/<name>` into `.claude/skills/<name>`.
A project's hand-kept `.claude/skills/distill/*` (v0.2) was therefore replaced by the release's v0.1 files. `registrations.mjs` only lists `distill` as a task-spec; not a write path. Prior art: the header/marker ownership checks (`isGeneratedAdapterTarget`, `GENERATED_WRAPPER_MARKER`) are used only for pruning orphans, never to gate overwrites.

## Rule chosen
In the external-project branch only (packageRoot != targetRoot), a target file is kept when it exists with different content and either:
1. the skill's target `SKILL.md` frontmatter `version` (`metadata.version` or top-level) is newer than the release's (dotted numeric compare), decided per skill before any of its files is rewritten; or
2. it is tracked and has uncommitted changes vs HEAD, asked through the existing Git Inspect door (`createGitInspect(gitPortOptions(..)).status({untracked:'none'})` via `inspectEntries`), no new git spawn. Without git, only rule 1 applies.
Untracked and clean tracked files still refresh (a previous setup's own output must keep refreshing). Identical content is never reported. Self-hosting regeneration (release's own source) is unguarded, as before. Kept files are returned as `skipped` (project-relative) and shown by setup as failed-check lines (`skillFilesKept` in the setup result), the existing channel; no new one.

## Commits (branch harden/setup-keeps-project-skills)
1. `c17f45f34` test: red proof (real temp git project: newer committed `.claude` skill with a reference file, edited-after-commit `.agents` file, older clean file refreshed).
2. fix commit: skill-wrappers.mjs, bin/fgos.mjs, docs/specs/distribution.md (Setup section), CHANGELOG.md, this report.

## Tests
- Added (owner `test/setup/skill-wrappers.test.mjs`): "materializeSkillsIntoProject keeps a project skill file that is newer ... and still refreshes an older clean one". Red before fix (assertion on kept content), green after. It covers the refresh control, so no existing assertion was changed.
- None changed or retired.

## Commands
- `runChosenTests([skill-wrappers, architecture, uninstall-wiring, fgos-mirror, fgos-preflight])`: all pass except two failures present on untouched main (verified by stash): "assembleSkills output matches the committed .agents/skills byte-for-byte" and "projection tests for Codex/OpenAI and Claude surfaces". Cause: committed `.agents/skills` lacks `instruction-audit` (core/skills has it). Not touched; needs `npm run build:skills` on main by its owner (not run here).

## Net lines
Source+bin: about +100/-12 (`skill-wrappers.mjs` +105/-9 incl. comments, `fgos.mjs` +5/-1); test +45; spec +7; CHANGELOG +1.

Status: DONE_WITH_CONCERNS
