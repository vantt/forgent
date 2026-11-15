# Phase 06: the knowledge canary writes its sandbox document through the door

Start after: 02 landed on the integration branch. Parallel with 03, 04, 05, 07, 08. Rules: [phase-lead-rules.md](phase-lead-rules.md).
Facts: F3 row 4, F6. Worktree `ywd-p06`, report slug `ywd-p06-knowledge-canary`. Effort: 0.5h.

## Context

`runKnowledgeCanary` (`scripts/knowledge-canary.mjs:39`) writes a disposable sandbox guide with a hand-written
`---\nframework: diataxis\nmode: how-to\n---\n` block. It already imports from `src/` (`:9`) and runs only under the
staged test environment (`test/skills/knowledge-canary.test.mjs`), so the addon is present.

## Requirements

- `fs.writeFileSync(fullPath, writeFrontmatter({ framework: 'diataxis', mode: 'how-to' }, '# Worktree Reclaim Guide\n', docPath), 'utf8')`;
  import `writeFrontmatter` from `../src/util/yaml.mjs`.
- No test change: the end-to-end canary (`test/skills/knowledge-canary.test.mjs:26`) is the owning proof that the attest
  step reads the document; bytes are unchanged (F3).

## Files

- Modify: `scripts/knowledge-canary.mjs`.
- Create/Delete: none. Tests retired: none.
- Net size: +1 / -1 lines.

## Steps

1. Change the line and the import.
2. `node scripts/run-tests.mjs test/skills/knowledge-canary.test.mjs`.
3. Gates in phase-lead-rules.

## Acceptance

- No fence literal in `scripts/knowledge-canary.mjs`; the canary test green.

## Risks / rollback

- The script run outside the staged test environment would now need the addon (L x L): it has no main entry
  (`rg -n "isMainModule" scripts/knowledge-canary.mjs` finds none); if one appears, add `ensureAddonForScript` as
  `scripts/project-agents.mjs:35` does. Revert the commit.
