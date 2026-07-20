import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// docs/specs/runner.md D4: `.claude/skills/fgos/` and `.agents/skills/fgos/`
// must stay byte-identical mirrors of each other. Nothing else in the suite
// checks this, so a divergence between the two trees would otherwise only
// surface as silent drift in agent-facing skill instructions.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLAUDE_SKILLS_DIR = path.resolve(__dirname, '../../.claude/skills/fgos');
const AGENTS_SKILLS_DIR = path.resolve(__dirname, '../../.agents/skills/fgos');

function listFilesRecursive(dir, base = dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(full, base));
    } else {
      files.push(path.relative(base, full));
    }
  }
  return files.sort();
}

test('.claude/skills/fgos and .agents/skills/fgos both exist', () => {
  assert.ok(fs.existsSync(CLAUDE_SKILLS_DIR), `${CLAUDE_SKILLS_DIR} is missing`);
  assert.ok(fs.existsSync(AGENTS_SKILLS_DIR), `${AGENTS_SKILLS_DIR} is missing`);
});

test('.claude/skills/fgos and .agents/skills/fgos contain the exact same set of relative file paths', () => {
  const claudeFiles = listFilesRecursive(CLAUDE_SKILLS_DIR);
  const agentsFiles = listFilesRecursive(AGENTS_SKILLS_DIR);
  assert.ok(claudeFiles.length > 0, 'expected at least one file under .claude/skills/fgos');
  assert.deepEqual(agentsFiles, claudeFiles, 'the two trees list different files — a mirror must not add or drop files on either side');
});

test('every mirrored file pair is byte-identical', () => {
  const relativePaths = listFilesRecursive(CLAUDE_SKILLS_DIR);
  for (const relativePath of relativePaths) {
    const claudeBytes = fs.readFileSync(path.join(CLAUDE_SKILLS_DIR, relativePath));
    const agentsBytes = fs.readFileSync(path.join(AGENTS_SKILLS_DIR, relativePath));
    assert.ok(
      claudeBytes.equals(agentsBytes),
      `${relativePath} differs between .claude/skills/fgos and .agents/skills/fgos`,
    );
  }
});
