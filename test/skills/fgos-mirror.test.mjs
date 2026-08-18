import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateWrapperContent, extractFrontmatter } from '../../src/setup/skill-wrappers.mjs';

// tsk-1qi (D5/D7, docs/history/install-setup-external-project-reliability/
// CONTEXT.md): `.agents/skills` is now the canonical, orchestrator-neutral
// skill source -- `.claude/skills/<name>/SKILL.md` is a GENERATED thin
// wrapper (a short read-and-follow redirect, never a full copy) produced
// by `src/setup/skill-wrappers.mjs`'s shared generator, run via
// `npm run build:skills`. This file used to assert `.claude/skills` and
// `.agents/skills` were byte-identical (the OLD hand-mirrored contract) --
// that assertion is retired along with the hand-mirroring it proved.
// What replaces it: every `.claude/skills/<name>/SKILL.md` is proven to be
// the CORRECT generated wrapper for its `.agents/skills/<name>/SKILL.md`
// source (same frontmatter, correct redirect path, and — the actual
// regression this guards — genuinely thin, not a stale leftover full copy
// from before this item).
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
// 14 dev-skill dirs, never the wrappers. tsk-1qi: this leg is UNCHANGED —
// the plugin marketplace channel stays hand-maintained (plan.md's own
// Assumptions), a full byte-identical copy against the real canonical
// source, `.agents/skills` (not `.claude/skills`, which is generated now).
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
    'the two roots declare different fgos-* skill names — a generated wrapper must not add or drop a skill on either side',
  );
});

test('every .claude/skills/<name>/SKILL.md is exactly the wrapper generateWrapperContent would produce from its .agents/skills source (proves npm run build:skills is up to date)', () => {
  for (const name of listFgosSkillDirs(CLAUDE_SKILLS_ROOT)) {
    const wrapperPath = path.join(CLAUDE_SKILLS_ROOT, name, 'SKILL.md');
    const sourcePath = path.join(AGENTS_SKILLS_ROOT, name, 'SKILL.md');
    const actualWrapper = fs.readFileSync(wrapperPath, 'utf8');
    const sourceContent = fs.readFileSync(sourcePath, 'utf8');
    const expectedWrapper = generateWrapperContent(sourceContent, path.relative(path.dirname(wrapperPath), sourcePath));
    assert.equal(
      actualWrapper,
      expectedWrapper,
      `${name}/SKILL.md is not the generated wrapper for its .agents/skills source — run "npm run build:skills"`,
    );
  }
});

test('every .claude/skills/<name>/SKILL.md wrapper carries the exact same frontmatter as its .agents/skills source (name/description stay correct for Claude Code\'s own skill listing)', () => {
  for (const name of listFgosSkillDirs(CLAUDE_SKILLS_ROOT)) {
    const wrapperContent = fs.readFileSync(path.join(CLAUDE_SKILLS_ROOT, name, 'SKILL.md'), 'utf8');
    const sourceContent = fs.readFileSync(path.join(AGENTS_SKILLS_ROOT, name, 'SKILL.md'), 'utf8');
    assert.equal(
      extractFrontmatter(wrapperContent),
      extractFrontmatter(sourceContent),
      `${name}/SKILL.md's frontmatter drifted from its .agents/skills source`,
    );
  }
});

test('every .claude/skills/<name>/SKILL.md wrapper is genuinely thin — much smaller than its .agents/skills source, not a stale pre-tsk-1qi full copy', () => {
  for (const name of listFgosSkillDirs(CLAUDE_SKILLS_ROOT)) {
    const wrapperSize = fs.statSync(path.join(CLAUDE_SKILLS_ROOT, name, 'SKILL.md')).size;
    const sourceSize = fs.statSync(path.join(AGENTS_SKILLS_ROOT, name, 'SKILL.md')).size;
    assert.ok(
      wrapperSize < sourceSize,
      `${name}/SKILL.md (${wrapperSize} bytes) is not smaller than its .agents/skills source (${sourceSize} bytes) — looks like a full copy, not a generated wrapper`,
    );
  }
});

test('.agents/skills and plugins/fgOS/skills declare the exact same set of fgos-* dev-skill names', () => {
  const agentsNames = listFgosSkillDirs(AGENTS_SKILLS_ROOT);
  const pluginNames = listFgosSkillDirs(PLUGIN_SKILLS_ROOT);
  assert.deepEqual(
    pluginNames,
    agentsNames,
    'the two roots declare different fgos-* skill names — the plugin copy must not add or drop a dev-skill',
  );
});

test('every fgos-* dev-skill mirrored into plugins/fgOS/skills contains the exact same set of relative file paths as its .agents/skills source', () => {
  for (const name of listFgosSkillDirs(AGENTS_SKILLS_ROOT)) {
    const agentsFiles = listFilesRecursive(path.join(AGENTS_SKILLS_ROOT, name));
    const pluginFiles = listFilesRecursive(path.join(PLUGIN_SKILLS_ROOT, name));
    assert.deepEqual(
      pluginFiles,
      agentsFiles,
      `${name}: .agents/skills and plugins/fgOS/skills list different files — a mirror must not add or drop files on either side`,
    );
  }
});

test('every fgos-* dev-skill file pair mirrored into plugins/fgOS/skills is byte-identical to its .agents/skills source', () => {
  for (const name of listFgosSkillDirs(AGENTS_SKILLS_ROOT)) {
    const agentsDir = path.join(AGENTS_SKILLS_ROOT, name);
    const pluginDir = path.join(PLUGIN_SKILLS_ROOT, name);
    for (const relativePath of listFilesRecursive(agentsDir)) {
      const agentsBytes = fs.readFileSync(path.join(agentsDir, relativePath));
      const pluginBytes = fs.readFileSync(path.join(pluginDir, relativePath));
      assert.ok(
        agentsBytes.equals(pluginBytes),
        `${name}/${relativePath} differs between .agents/skills and plugins/fgOS/skills`,
      );
    }
  }
});

// tsk-53h: `_shared/` holds skill-facing fragments referenced by relative
// path from multiple `fgos-*` SKILL.md files (not itself `fgos-*`-
// prefixed, so the scan above never reaches it) — same drift risk as any
// other mirrored skill content, so it needs the same byte-identical
// enforcement.
//
// tsk-32b: 6 of the 14 dev-skills reference `../_shared/executor-dispatch-
// fallback.md` by relative path, so plugins/fgOS/skills/_shared/ must exist
// too or those skills break when loaded from the plugin.
//
// tsk-1qi: `.claude/skills/_shared` is RETIRED, not compared here anymore
// — every `.claude/skills/<name>/SKILL.md` is now a redirect to its
// `.agents/skills/<name>/SKILL.md` source, so a `_shared` reference
// INSIDE that source resolves relative to `.agents/skills/`, never
// `.claude/skills/`. Nothing reads `.claude/skills/_shared` any more (see
// this item's own plan.md), so it is not generated and not asserted on.
const AGENTS_SHARED = path.join(AGENTS_SKILLS_ROOT, '_shared');
const PLUGIN_SHARED = path.join(PLUGIN_SKILLS_ROOT, '_shared');

test('.agents/skills/_shared and plugins/fgOS/skills/_shared mirror each other byte-identically', () => {
  const agentsExists = fs.existsSync(AGENTS_SHARED);
  const pluginExists = fs.existsSync(PLUGIN_SHARED);
  assert.equal(pluginExists, agentsExists, '_shared must exist on both .agents/skills and plugins/fgOS/skills, or neither');
  if (!agentsExists) return;

  const agentsFiles = listFilesRecursive(AGENTS_SHARED);
  const pluginFiles = listFilesRecursive(PLUGIN_SHARED);
  assert.deepEqual(pluginFiles, agentsFiles, '_shared: .agents/skills and plugins/fgOS/skills list different files — a mirror must not add or drop files on either side');

  for (const relativePath of agentsFiles) {
    const agentsBytes = fs.readFileSync(path.join(AGENTS_SHARED, relativePath));
    const pluginBytes = fs.readFileSync(path.join(PLUGIN_SHARED, relativePath));
    assert.ok(
      agentsBytes.equals(pluginBytes),
      `_shared/${relativePath} differs between .agents/skills and plugins/fgOS/skills`,
    );
  }
});

test('.claude/skills has no _shared directory of its own (retired, tsk-1qi — every wrapper redirects to .agents/skills, whose own _shared already covers every reference)', () => {
  assert.equal(fs.existsSync(path.join(CLAUDE_SKILLS_ROOT, '_shared')), false);
});

// tsk-424n (D6): the 14 coding-domain dev-skills carry `user-invocable:
// false` -- dispatch-only, hidden from the human-typed `/` menu but still
// fully visible to and invocable by the model/Skill tool (Claude Code
// docs, code.claude.com/docs/en/skills.md: "The user-invocable field only
// controls menu visibility, not Skill tool access"). The ~35 CLI-wrapper
// skills (the ones a human actually types) are NOT in this repo's
// `.claude/skills`/`.agents/skills` at all -- they live only under
// `plugins/fgOS/skills/` -- so this check only ever needs to prove the
// dev-skills carry the field and `distill` (the one non-fgos-* entry
// mirrored here) does not.

test('every fgos-* dev-skill source in .agents/skills carries user-invocable: false', () => {
  for (const name of listFgosSkillDirs(AGENTS_SKILLS_ROOT)) {
    const sourceContent = fs.readFileSync(path.join(AGENTS_SKILLS_ROOT, name, 'SKILL.md'), 'utf8');
    assert.match(
      extractFrontmatter(sourceContent),
      /^user-invocable: false$/m,
      `${name}/SKILL.md is missing "user-invocable: false" in its frontmatter`,
    );
  }
});

test('every fgos-* dev-skill wrapper in .claude/skills inherits user-invocable: false from its source (frontmatter is copied verbatim)', () => {
  for (const name of listFgosSkillDirs(CLAUDE_SKILLS_ROOT)) {
    const wrapperContent = fs.readFileSync(path.join(CLAUDE_SKILLS_ROOT, name, 'SKILL.md'), 'utf8');
    assert.match(extractFrontmatter(wrapperContent), /^user-invocable: false$/m);
  }
});

test('every fgos-* dev-skill mirrored into plugins/fgOS/skills also carries user-invocable: false (kept byte-identical to its .agents/skills source)', () => {
  for (const name of listFgosSkillDirs(AGENTS_SKILLS_ROOT)) {
    const pluginContent = fs.readFileSync(path.join(PLUGIN_SKILLS_ROOT, name, 'SKILL.md'), 'utf8');
    assert.match(extractFrontmatter(pluginContent), /^user-invocable: false$/m);
  }
});

test('distill (the one non-fgos-* skill mirrored in .agents/skills and .claude/skills) does NOT carry user-invocable: false — only the 14 dev-skills are in scope for D6', () => {
  const distillSource = fs.readFileSync(path.join(AGENTS_SKILLS_ROOT, 'distill', 'SKILL.md'), 'utf8');
  assert.doesNotMatch(extractFrontmatter(distillSource), /user-invocable/);
});
