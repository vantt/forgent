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
  mirrorDevSkillsIntoPlugin,
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

test('materializeSkillsIntoProject never deletes packageRoot base skills it just copied in, even when targetRoot has its own domains/*/skills but no core/skills', () => {
  // Regression: an external project adopting fgOS (domain-pluggable, no
  // core/skills of its own) has a domains/ tree, which bypasses
  // assembleSkills's "neither core/skills nor domains/ exists" early
  // return -- its own prune pass would then treat every packageRoot base
  // skill just copied into targetRoot's .agents/skills as an orphan
  // (absent from targetRoot's own core/skills+domains/*/skills) and
  // delete it, since only packageRoot ever declared those names.
  const packageRoot = mkTempDir('skill-wrappers-mat-noprune-pkg-');
  writeSkill(path.join(packageRoot, '.agents', 'skills'), 'fgos-routing', SAMPLE_FRONTMATTER, '# base routing\n');
  writeSkill(path.join(packageRoot, '.agents', 'skills'), 'fgos-coding-implement', SAMPLE_FRONTMATTER, '# base implement\n');

  const targetRoot = mkTempDir('skill-wrappers-mat-noprune-target-');
  writeSkill(path.join(targetRoot, 'domains', 'myapp', 'skills'), 'myapp-custom-skill', SAMPLE_FRONTMATTER, '# custom\n');

  const { wrappersWritten } = materializeSkillsIntoProject(packageRoot, targetRoot);

  assert.ok(fs.existsSync(path.join(targetRoot, '.agents', 'skills', 'fgos-routing', 'SKILL.md')), 'packageRoot base skill fgos-routing must survive');
  assert.ok(fs.existsSync(path.join(targetRoot, '.agents', 'skills', 'fgos-coding-implement', 'SKILL.md')), 'packageRoot base skill fgos-coding-implement must survive');
  assert.ok(fs.existsSync(path.join(targetRoot, '.agents', 'skills', 'myapp-custom-skill', 'SKILL.md')), 'targetRoot own domain skill must also be assembled in');
  assert.deepEqual(
    wrappersWritten.map((p) => path.basename(path.dirname(p))).sort(),
    ['fgos-coding-implement', 'fgos-routing', 'myapp-custom-skill'],
  );
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

test('assembleSkills throws on duplicate skill name collision across core and domains', () => {
  const root = mkTempDir('skill-wrappers-collision-');
  writeSkill(path.join(root, 'core', 'skills'), 'skill-dup', SAMPLE_FRONTMATTER, '# Core Dup\n');
  writeSkill(path.join(root, 'domains', 'coding', 'skills'), 'skill-dup', SAMPLE_FRONTMATTER, '# Domain Dup\n');

  assert.throws(
    () => assembleSkills(root),
    (err) => {
      assert.match(err.message, /duplicate skill name "skill-dup" found in multiple files:/);
      assert.match(err.message, /core\/skills\/skill-dup/);
      assert.match(err.message, /domains\/coding\/skills\/skill-dup/);
      return true;
    },
  );
});

test('assembleSkills prunes orphaned skills from .agents/skills when removed from source', () => {
  const root = mkTempDir('skill-wrappers-prune-agents-');
  writeSkill(path.join(root, 'core', 'skills'), 'skill-active', SAMPLE_FRONTMATTER, '# Active\n');

  const targetAgentsSkills = path.join(root, '.agents', 'skills');
  writeSkill(targetAgentsSkills, 'skill-orphaned', SAMPLE_FRONTMATTER, '# Orphaned\n');

  assert.ok(fs.existsSync(path.join(targetAgentsSkills, 'skill-orphaned')));

  assembleSkills(root);

  assert.ok(fs.existsSync(path.join(targetAgentsSkills, 'skill-active')));
  assert.equal(fs.existsSync(path.join(targetAgentsSkills, 'skill-orphaned')), false);
});

test('generateAllSkillWrappers prunes orphaned wrappers from .claude/skills when source skill is gone', () => {
  const agentsSkillsRoot = mkTempDir('skill-wrappers-prune-claude-agents-');
  const claudeSkillsRoot = mkTempDir('skill-wrappers-prune-claude-target-');

  writeSkill(agentsSkillsRoot, 'skill-active', SAMPLE_FRONTMATTER, '# Active\n');

  // A previously-generated wrapper whose source has since disappeared --
  // its SKILL.md carries the real generated-wrapper marker, the only
  // proof the prune pass is allowed to act on.
  writeSkill(
    claudeSkillsRoot,
    'skill-orphaned',
    SAMPLE_FRONTMATTER,
    generateWrapperContent(`${SAMPLE_FRONTMATTER}\n# Orphaned\n`, '../../.agents/skills/skill-orphaned/SKILL.md'),
  );
  assert.ok(fs.existsSync(path.join(claudeSkillsRoot, 'skill-orphaned')));

  const written = generateAllSkillWrappers(agentsSkillsRoot, claudeSkillsRoot);

  assert.equal(written.length, 1);
  assert.ok(fs.existsSync(path.join(claudeSkillsRoot, 'skill-active', 'SKILL.md')));
  assert.equal(fs.existsSync(path.join(claudeSkillsRoot, 'skill-orphaned')), false);
});

test('generateAllSkillWrappers never prunes a standalone skill under .claude/skills that was never a generated wrapper (regression: pruning by name-absence alone previously deleted a hand-authored skill directory)', () => {
  const agentsSkillsRoot = mkTempDir('skill-wrappers-prune-standalone-agents-');
  const claudeSkillsRoot = mkTempDir('skill-wrappers-prune-standalone-target-');

  writeSkill(agentsSkillsRoot, 'skill-active', SAMPLE_FRONTMATTER, '# Active\n');

  // A real, hand-authored skill living directly under .claude/skills,
  // never routed through .agents/skills -- its SKILL.md carries no
  // generated-wrapper marker, so the prune pass must never touch it, no
  // matter that its name is absent from validWrapperNames.
  writeSkill(claudeSkillsRoot, 'standalone-skill', SAMPLE_FRONTMATTER, '# Real hand-authored content\n');
  fs.writeFileSync(path.join(claudeSkillsRoot, 'standalone-skill', 'tool.mjs'), 'export const real = true;\n');

  generateAllSkillWrappers(agentsSkillsRoot, claudeSkillsRoot);

  assert.ok(fs.existsSync(path.join(claudeSkillsRoot, 'standalone-skill', 'SKILL.md')), 'standalone skill must survive the prune pass');
  assert.ok(fs.existsSync(path.join(claudeSkillsRoot, 'standalone-skill', 'tool.mjs')), 'standalone skill\'s real files must survive the prune pass');
});

test('mirrorDevSkillsIntoPlugin mirrors _shared and fgos-* dev-skills into plugin directory, skipping non-fgos skills', () => {
  const agentsSkillsRoot = mkTempDir('skill-wrappers-mirror-agents-');
  const pluginSkillsRoot = mkTempDir('skill-wrappers-mirror-plugin-');

  writeSkill(agentsSkillsRoot, '_shared', '', 'shared fragment\n');
  writeSkill(agentsSkillsRoot, 'fgos-routing', SAMPLE_FRONTMATTER, '# Routing\n');
  writeSkill(agentsSkillsRoot, 'fgos-coding-implement', SAMPLE_FRONTMATTER, '# Implement\n');
  writeSkill(agentsSkillsRoot, 'distill', SAMPLE_FRONTMATTER, '# Distill\n');

  const mirrored = mirrorDevSkillsIntoPlugin(agentsSkillsRoot, pluginSkillsRoot);

  assert.equal(mirrored.length, 3);
  assert.ok(fs.existsSync(path.join(pluginSkillsRoot, '_shared', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(pluginSkillsRoot, 'fgos-routing', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(pluginSkillsRoot, 'fgos-coding-implement', 'SKILL.md')));
  assert.equal(fs.existsSync(path.join(pluginSkillsRoot, 'distill')), false, 'non-fgos skills like distill must not be mirrored into plugins/fgOS/skills');
});

test('mirrorDevSkillsIntoPlugin is a safe no-op returning [] when agentsSkillsRoot does not exist', () => {
  const pluginSkillsRoot = mkTempDir('skill-wrappers-mirror-noop-');
  const mirrored = mirrorDevSkillsIntoPlugin(path.join(mkTempDir('skill-wrappers-missing-'), 'does-not-exist'), pluginSkillsRoot);
  assert.deepEqual(mirrored, []);
});


