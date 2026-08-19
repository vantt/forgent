// skill-wrappers.test.mjs — the shared generator behind `npm run
// build:skills` and `fgos setup`'s external-project materialize path
// (tsk-1qi, D5/D7 of docs/history/install-setup-external-project-
// reliability/CONTEXT.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  extractFrontmatter,
  generateWrapperContent,
  generateAllSkillWrappers,
  assembleSkills,
  materializeSkillsIntoProject,
} from '../../src/setup/skill-wrappers.mjs';

function mkTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function writeSkill(skillsRoot, name, frontmatter, body) {
  const dir = path.join(skillsRoot, name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'SKILL.md'), `${frontmatter}\n${body}`);
}

const SAMPLE_FRONTMATTER = '---\nname: sample-skill\ndescription: A sample skill for testing.\n---\n';

test('extractFrontmatter returns the --- fenced block verbatim, including both fences', () => {
  const content = `${SAMPLE_FRONTMATTER}\n# Body\nSome instructions.\n`;
  assert.equal(extractFrontmatter(content), SAMPLE_FRONTMATTER);
});

test('extractFrontmatter returns an empty string when the content has no frontmatter block', () => {
  assert.equal(extractFrontmatter('# Just a heading\nNo frontmatter here.\n'), '');
});

test('generateWrapperContent keeps the source frontmatter byte-identical', () => {
  const sourceContent = `${SAMPLE_FRONTMATTER}\n# Body\nSome real instructions here.\n`;
  const wrapper = generateWrapperContent(sourceContent, '../../../.agents/skills/sample-skill/SKILL.md');
  assert.ok(wrapper.startsWith(SAMPLE_FRONTMATTER));
});

test('generateWrapperContent names the given relative path in its redirect body', () => {
  const sourceContent = `${SAMPLE_FRONTMATTER}\n# Body\n`;
  const wrapper = generateWrapperContent(sourceContent, '../../../.agents/skills/sample-skill/SKILL.md');
  assert.match(wrapper, /\.agents\/skills\/sample-skill\/SKILL\.md/);
});

test('generateWrapperContent never includes the source body content — genuinely thin, not a copy', () => {
  const sourceContent = `${SAMPLE_FRONTMATTER}\n# Body\nA VERY DISTINCTIVE SENTENCE THAT MUST NOT LEAK INTO THE WRAPPER.\n`;
  const wrapper = generateWrapperContent(sourceContent, 'x.md');
  assert.doesNotMatch(wrapper, /VERY DISTINCTIVE SENTENCE/);
});

test('generateWrapperContent throws when the source has no frontmatter to copy', () => {
  assert.throws(() => generateWrapperContent('# No frontmatter\n', 'x.md'), /frontmatter/);
});

test(
  'generateWrapperContent never cites a bare D-local id outside its own ' +
    'CONTEXT.md (tsk-352f: decision 0017), but keeps the tsk-1qi item id',
  () => {
    const sourceContent = `${SAMPLE_FRONTMATTER}\n# Body\n`;
    const wrapper = generateWrapperContent(sourceContent, 'x.md');
    assert.doesNotMatch(wrapper, /\bD\d{1,2}\b/);
    assert.match(wrapper, /tsk-1qi/);
  },
);

test('generateAllSkillWrappers writes one wrapper per skill directory under agentsSkillsRoot', () => {
  const agentsSkillsRoot = mkTempDir('skill-wrappers-agents-');
  const claudeSkillsRoot = mkTempDir('skill-wrappers-claude-');
  writeSkill(agentsSkillsRoot, 'skill-a', SAMPLE_FRONTMATTER, '# Body A\n');
  writeSkill(agentsSkillsRoot, 'skill-b', SAMPLE_FRONTMATTER, '# Body B\n');

  const written = generateAllSkillWrappers(agentsSkillsRoot, claudeSkillsRoot);

  assert.equal(written.length, 2);
  assert.ok(fs.existsSync(path.join(claudeSkillsRoot, 'skill-a', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(claudeSkillsRoot, 'skill-b', 'SKILL.md')));
});

test('generateAllSkillWrappers skips _shared (a fragment folder, not a dispatchable skill with its own frontmatter)', () => {
  const agentsSkillsRoot = mkTempDir('skill-wrappers-shared-agents-');
  const claudeSkillsRoot = mkTempDir('skill-wrappers-shared-claude-');
  writeSkill(agentsSkillsRoot, 'skill-a', SAMPLE_FRONTMATTER, '# Body A\n');
  fs.mkdirSync(path.join(agentsSkillsRoot, '_shared'), { recursive: true });
  fs.writeFileSync(path.join(agentsSkillsRoot, '_shared', 'fragment.md'), 'referenced content\n');

  const written = generateAllSkillWrappers(agentsSkillsRoot, claudeSkillsRoot);

  assert.equal(written.length, 1);
  assert.equal(fs.existsSync(path.join(claudeSkillsRoot, '_shared')), false);
});

test('generateAllSkillWrappers skips a directory with no SKILL.md inside it', () => {
  const agentsSkillsRoot = mkTempDir('skill-wrappers-nofile-agents-');
  const claudeSkillsRoot = mkTempDir('skill-wrappers-nofile-claude-');
  fs.mkdirSync(path.join(agentsSkillsRoot, 'not-a-skill'), { recursive: true });
  fs.writeFileSync(path.join(agentsSkillsRoot, 'not-a-skill', 'README.md'), 'not a skill file\n');

  const written = generateAllSkillWrappers(agentsSkillsRoot, claudeSkillsRoot);
  assert.equal(written.length, 0);
});

test('generateAllSkillWrappers is a no-op returning [] when agentsSkillsRoot does not exist at all', () => {
  const claudeSkillsRoot = mkTempDir('skill-wrappers-missing-claude-');
  const written = generateAllSkillWrappers(path.join(mkTempDir('skill-wrappers-missing-'), 'does-not-exist'), claudeSkillsRoot);
  assert.deepEqual(written, []);
});

test('materializeSkillsIntoProject copies .agents/skills into an external target project, then generates wrappers there', () => {
  const packageRoot = mkTempDir('skill-wrappers-materialize-pkg-');
  writeSkill(path.join(packageRoot, '.agents', 'skills'), 'skill-a', SAMPLE_FRONTMATTER, '# Body A\n');
  const targetRoot = mkTempDir('skill-wrappers-materialize-target-');

  const { copied, wrappersWritten } = materializeSkillsIntoProject(packageRoot, targetRoot);

  assert.equal(copied, true);
  assert.equal(wrappersWritten.length, 1);
  assert.ok(fs.existsSync(path.join(targetRoot, '.agents', 'skills', 'skill-a', 'SKILL.md')), 'source must be copied into the target project');
  assert.ok(fs.existsSync(path.join(targetRoot, '.claude', 'skills', 'skill-a', 'SKILL.md')), 'wrapper must be generated in the target project');
  // Sibling-relative, D7: the generated wrapper must point at the TARGET
  // project's own copy, never back at packageRoot.
  const wrapperContent = fs.readFileSync(path.join(targetRoot, '.claude', 'skills', 'skill-a', 'SKILL.md'), 'utf8');
  assert.doesNotMatch(wrapperContent, new RegExp(packageRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), 'wrapper must never point back at the global package install location');
});

test('materializeSkillsIntoProject self-hosting: when packageRoot equals targetRoot, it regenerates wrappers in place without copying', () => {
  const root = mkTempDir('skill-wrappers-materialize-selfhost-');
  writeSkill(path.join(root, '.agents', 'skills'), 'skill-a', SAMPLE_FRONTMATTER, '# Body A\n');

  const { copied, wrappersWritten } = materializeSkillsIntoProject(root, root);

  assert.equal(copied, false);
  assert.equal(wrappersWritten.length, 1);
  assert.ok(fs.existsSync(path.join(root, '.claude', 'skills', 'skill-a', 'SKILL.md')));
});

test('materializeSkillsIntoProject is a no-op when packageRoot has no .agents/skills at all', () => {
  const packageRoot = mkTempDir('skill-wrappers-materialize-none-pkg-');
  const targetRoot = mkTempDir('skill-wrappers-materialize-none-target-');
  const { copied, wrappersWritten } = materializeSkillsIntoProject(packageRoot, targetRoot);
  assert.equal(copied, false);
  assert.deepEqual(wrappersWritten, []);
  assert.equal(fs.existsSync(path.join(targetRoot, '.agents')), false);
});

test('materializeSkillsIntoProject never throws when assembling into packageRoot fails (round-2 review finding, tsk-397) -- a real global npm install can be root-owned/read-only; the already-shipped .agents/skills still materializes into the target project', () => {
  const packageRoot = mkTempDir('skill-wrappers-materialize-readonly-pkg-');
  writeSkill(path.join(packageRoot, '.agents', 'skills'), 'skill-a', SAMPLE_FRONTMATTER, '# Body A\n');
  // Block core/skills with a plain file so assembleSkills' own
  // fs.readdirSync(coreSkillsRoot, {withFileTypes:true}) throws ENOTDIR --
  // the same "block the path with a file" I/O-failure simulation
  // test/runner/worker-log.test.mjs already uses, standing in for any
  // real write failure (disk full, EACCES, read-only filesystem).
  fs.writeFileSync(path.join(packageRoot, 'core'), 'not a directory');
  const targetRoot = mkTempDir('skill-wrappers-materialize-readonly-target-');

  let result;
  assert.doesNotThrow(() => {
    result = materializeSkillsIntoProject(packageRoot, targetRoot);
  });
  assert.equal(result.copied, true);
  assert.equal(result.wrappersWritten.length, 1);
  assert.ok(fs.existsSync(path.join(targetRoot, '.agents', 'skills', 'skill-a', 'SKILL.md')), 'the already-shipped .agents/skills still copies into the target project');
});

test('assembleSkills assembles skills from core/skills/ and domains/*/skills/ into .agents/skills/', () => {
  const root = mkTempDir('skill-wrappers-assemble-');
  writeSkill(path.join(root, 'core', 'skills'), 'fgos-routing', SAMPLE_FRONTMATTER, '# Core Routing\n');
  writeSkill(path.join(root, 'domains', 'coding', 'skills'), 'fgos-coding-implement', SAMPLE_FRONTMATTER, '# Coding Implement\n');

  const assembled = assembleSkills(root);

  assert.equal(assembled.length, 2);
  assert.ok(fs.existsSync(path.join(root, '.agents', 'skills', 'fgos-routing', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(root, '.agents', 'skills', 'fgos-coding-implement', 'SKILL.md')));
});

test('assembleSkills is a safe no-op returning [] when neither core/skills nor domains/ exist', () => {
  const root = mkTempDir('skill-wrappers-assemble-noop-');
  const assembled = assembleSkills(root);
  assert.deepEqual(assembled, []);
});

test('materializeSkillsIntoProject runs assembly first so core/skills and domains/*/skills materialize into target project', () => {
  const packageRoot = mkTempDir('skill-wrappers-mat-assemble-pkg-');
  writeSkill(path.join(packageRoot, 'core', 'skills'), 'fgos-routing', SAMPLE_FRONTMATTER, '# Core Routing\n');
  writeSkill(path.join(packageRoot, 'domains', 'coding', 'skills'), 'fgos-coding-implement', SAMPLE_FRONTMATTER, '# Coding Implement\n');
  const targetRoot = mkTempDir('skill-wrappers-mat-assemble-target-');

  const { copied, wrappersWritten } = materializeSkillsIntoProject(packageRoot, targetRoot);

  assert.equal(copied, true);
  assert.equal(wrappersWritten.length, 2);
  assert.ok(fs.existsSync(path.join(targetRoot, '.agents', 'skills', 'fgos-routing', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(targetRoot, '.agents', 'skills', 'fgos-coding-implement', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(targetRoot, '.claude', 'skills', 'fgos-routing', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(targetRoot, '.claude', 'skills', 'fgos-coding-implement', 'SKILL.md')));
});

// --- Drift guard: committed .agents/skills vs core/skills+domains/*/skills (review finding H6) ---
//
// D7 makes core/skills/ + domains/<name>/skills/ the canonical AUTHORING
// source and commits .agents/skills/ (and its own mirrors) as real render
// targets -- both committed is the intended shape, not a mistake. But
// nothing enforced the two ever actually agree: a hand-edit to
// .agents/skills/ would pass every other test and get silently reverted
// by the next `npm run build:skills`, or a source-only edit could ship
// without ever landing in the committed render target. This test is that
// missing enforcement -- it renders core/+domains/ into a throwaway temp
// dir (never touching the real committed .agents/skills) and asserts the
// two are set-identical and byte-identical.
function listFilesRecursiveSorted(dir) {
  const out = [];
  const walk = (d, rel) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const relPath = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(path.join(d, entry.name), relPath);
      else out.push(relPath);
    }
  };
  walk(dir, '');
  return out.sort();
}

test('assembleSkills output matches the committed .agents/skills byte-for-byte (drift guard, review finding H6) -- catches a hand-edit to the render target OR a source-only edit that never landed there', () => {
  const repoRoot = path.resolve(fileURLToPath(import.meta.url), '../../..');
  const committedAgentsSkills = path.join(repoRoot, '.agents', 'skills');
  const rendered = mkTempDir('skill-wrappers-drift-guard-');

  assembleSkills(repoRoot, rendered);

  const committedFiles = listFilesRecursiveSorted(committedAgentsSkills);
  const renderedFiles = listFilesRecursiveSorted(rendered);
  assert.deepEqual(renderedFiles, committedFiles, 'committed .agents/skills/ has a different file set than core/skills+domains/*/skills would render -- run `npm run build:skills`');

  for (const relPath of committedFiles) {
    const committedContent = fs.readFileSync(path.join(committedAgentsSkills, relPath), 'utf8');
    const renderedContent = fs.readFileSync(path.join(rendered, relPath), 'utf8');
    assert.equal(renderedContent, committedContent, `.agents/skills/${relPath} is out of sync with core/skills+domains/*/skills -- run \`npm run build:skills\``);
  }
});

