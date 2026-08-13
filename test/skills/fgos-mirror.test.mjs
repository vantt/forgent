import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// docs/specs/runner.md D4: every `.claude/skills/fgos-*/` skill must stay a
// byte-identical mirror of its `.agents/skills/fgos-*/` counterpart. Nothing
// else in the suite checks this, so a divergence between the two trees would
// otherwise only surface as silent drift in agent-facing skill instructions.
//
// tsk-d3c: skills live flat, one per top-level directory
// (`.claude/skills/<name>/SKILL.md`), not nested under a shared `fgos/`
// parent — the generic project-skill scan only enumerates one level deep, so
// a shared parent silently hides every skill beneath it. This test compares
// by matching `fgos-*` directory names across the two roots, not by diffing
// one shared parent.
//
// tsk-32b: a third leg, `plugins/fgOS/skills/`, carries the SAME 14
// coding-domain dev-skills so a session outside this repo (fgOS installed
// only as a plugin) can still dispatch into fgos-coding-driving/fgos-routing/
// etc. — plugins/fgOS/skills/ also holds the ~35 CLI-wrapper skills
// (cook/discover/pick/...), which listFgosSkillDirs's own `fgos-` prefix
// filter naturally excludes, so the comparison below only ever touches the
// 14 dev-skill dirs, never the wrappers.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLAUDE_SKILLS_ROOT = path.resolve(__dirname, '../../.claude/skills');
const AGENTS_SKILLS_ROOT = path.resolve(__dirname, '../../.agents/skills');
const PLUGIN_SKILLS_ROOT = path.resolve(__dirname, '../../plugins/fgOS/skills');

function listFgosSkillDirs(root) {
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('fgos-'))
    .map((entry) => entry.name)
    .sort();
}

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

test('.claude/skills and .agents/skills declare the exact same set of fgos-* skill names', () => {
  const claudeNames = listFgosSkillDirs(CLAUDE_SKILLS_ROOT);
  const agentsNames = listFgosSkillDirs(AGENTS_SKILLS_ROOT);
  assert.ok(claudeNames.length > 0, 'expected at least one fgos-* skill under .claude/skills');
  assert.deepEqual(
    agentsNames,
    claudeNames,
    'the two roots declare different fgos-* skill names — a mirror must not add or drop a skill on either side',
  );
});

test('every mirrored fgos-* skill directory contains the exact same set of relative file paths', () => {
  for (const name of listFgosSkillDirs(CLAUDE_SKILLS_ROOT)) {
    const claudeFiles = listFilesRecursive(path.join(CLAUDE_SKILLS_ROOT, name));
    const agentsFiles = listFilesRecursive(path.join(AGENTS_SKILLS_ROOT, name));
    assert.deepEqual(
      agentsFiles,
      claudeFiles,
      `${name}: the two trees list different files — a mirror must not add or drop files on either side`,
    );
  }
});

test('every mirrored file pair is byte-identical', () => {
  for (const name of listFgosSkillDirs(CLAUDE_SKILLS_ROOT)) {
    const claudeDir = path.join(CLAUDE_SKILLS_ROOT, name);
    const agentsDir = path.join(AGENTS_SKILLS_ROOT, name);
    for (const relativePath of listFilesRecursive(claudeDir)) {
      const claudeBytes = fs.readFileSync(path.join(claudeDir, relativePath));
      const agentsBytes = fs.readFileSync(path.join(agentsDir, relativePath));
      assert.ok(
        claudeBytes.equals(agentsBytes),
        `${name}/${relativePath} differs between .claude/skills and .agents/skills`,
      );
    }
  }
});

test('.claude/skills and plugins/fgOS/skills declare the exact same set of fgos-* dev-skill names', () => {
  const claudeNames = listFgosSkillDirs(CLAUDE_SKILLS_ROOT);
  const pluginNames = listFgosSkillDirs(PLUGIN_SKILLS_ROOT);
  assert.deepEqual(
    pluginNames,
    claudeNames,
    'the two roots declare different fgos-* skill names — the plugin copy must not add or drop a dev-skill',
  );
});

test('every fgos-* dev-skill mirrored into plugins/fgOS/skills contains the exact same set of relative file paths', () => {
  for (const name of listFgosSkillDirs(CLAUDE_SKILLS_ROOT)) {
    const claudeFiles = listFilesRecursive(path.join(CLAUDE_SKILLS_ROOT, name));
    const pluginFiles = listFilesRecursive(path.join(PLUGIN_SKILLS_ROOT, name));
    assert.deepEqual(
      pluginFiles,
      claudeFiles,
      `${name}: .claude/skills and plugins/fgOS/skills list different files — a mirror must not add or drop files on either side`,
    );
  }
});

test('every fgos-* dev-skill file pair mirrored into plugins/fgOS/skills is byte-identical', () => {
  for (const name of listFgosSkillDirs(CLAUDE_SKILLS_ROOT)) {
    const claudeDir = path.join(CLAUDE_SKILLS_ROOT, name);
    const pluginDir = path.join(PLUGIN_SKILLS_ROOT, name);
    for (const relativePath of listFilesRecursive(claudeDir)) {
      const claudeBytes = fs.readFileSync(path.join(claudeDir, relativePath));
      const pluginBytes = fs.readFileSync(path.join(pluginDir, relativePath));
      assert.ok(
        claudeBytes.equals(pluginBytes),
        `${name}/${relativePath} differs between .claude/skills and plugins/fgOS/skills`,
      );
    }
  }
});

// tsk-53h: `_shared/` holds skill-facing fragments referenced by path from
// multiple `fgos-*` SKILL.md files (not itself `fgos-*`-prefixed, so the
// scan above never reaches it) — same drift risk as any other mirrored
// skill content, so it needs the same byte-identical enforcement.
//
// tsk-32b: 6 of the 14 dev-skills reference `../_shared/capacity-dispatch-
// fallback.md` by relative path, so plugins/fgOS/skills/_shared/ must exist
// too or those skills break when loaded from the plugin — same three-way
// check as the fgos-* dev-skills above.
const CLAUDE_SHARED = path.join(CLAUDE_SKILLS_ROOT, '_shared');
const AGENTS_SHARED = path.join(AGENTS_SKILLS_ROOT, '_shared');
const PLUGIN_SHARED = path.join(PLUGIN_SKILLS_ROOT, '_shared');

test('.claude/skills/_shared, .agents/skills/_shared, and plugins/fgOS/skills/_shared all mirror each other byte-identically', () => {
  const claudeExists = fs.existsSync(CLAUDE_SHARED);
  const agentsExists = fs.existsSync(AGENTS_SHARED);
  const pluginExists = fs.existsSync(PLUGIN_SHARED);
  assert.equal(agentsExists, claudeExists, '_shared must exist on both .claude/skills and .agents/skills, or neither');
  assert.equal(pluginExists, claudeExists, '_shared must exist on both .claude/skills and plugins/fgOS/skills, or neither');
  if (!claudeExists) return;

  const claudeFiles = listFilesRecursive(CLAUDE_SHARED);
  const agentsFiles = listFilesRecursive(AGENTS_SHARED);
  const pluginFiles = listFilesRecursive(PLUGIN_SHARED);
  assert.deepEqual(agentsFiles, claudeFiles, '_shared: .claude/skills and .agents/skills list different files — a mirror must not add or drop files on either side');
  assert.deepEqual(pluginFiles, claudeFiles, '_shared: .claude/skills and plugins/fgOS/skills list different files — a mirror must not add or drop files on either side');

  for (const relativePath of claudeFiles) {
    const claudeBytes = fs.readFileSync(path.join(CLAUDE_SHARED, relativePath));
    const agentsBytes = fs.readFileSync(path.join(AGENTS_SHARED, relativePath));
    const pluginBytes = fs.readFileSync(path.join(PLUGIN_SHARED, relativePath));
    assert.ok(
      claudeBytes.equals(agentsBytes),
      `_shared/${relativePath} differs between .claude/skills and .agents/skills`,
    );
    assert.ok(
      claudeBytes.equals(pluginBytes),
      `_shared/${relativePath} differs between .claude/skills and plugins/fgOS/skills`,
    );
  }
});
