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
  discoverCanonicalSkills,
  discoverSharedFragments,
  generateGeminiSkillPackage,
  SKILL_ADAPTER_TARGETS,
  isGeneratedAdapterTarget,
  isCanonicalSkillSource,
  deriveSkillIntentId,
  mapSkillIntentToHostTriggers,
} from '../../src/setup/skill-wrappers.mjs';
import { resolveMainCheckoutRoot, fgosDirFromRoot } from '../../src/runner/paths.mjs';

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

test('fgos-code-panel is canonically located in domains/coding/skills and absent from core/skills', () => {
  const repoRoot = path.resolve(fileURLToPath(import.meta.url), '../../..');
  const domainSource = path.join(repoRoot, 'domains', 'coding', 'skills', 'fgos-code-panel', 'SKILL.md');
  const coreSource = path.join(repoRoot, 'core', 'skills', 'fgos-code-panel');

  assert.ok(fs.existsSync(domainSource), 'domains/coding/skills/fgos-code-panel/SKILL.md must exist as canonical source');
  assert.equal(fs.existsSync(coreSource), false, 'core/skills/fgos-code-panel must not exist to prevent duplicate canonical skill ids');

  // Verify assembleSkills completes cleanly on the real repo without duplicate-skill collision
  assert.doesNotThrow(() => {
    assembleSkills(repoRoot, mkTempDir('skill-wrappers-verify-unique-'));
  });
});

test('fgos-code-panel canonical source has non-vacuous repo-root path references after domain move', () => {
  const repoRoot = path.resolve(fileURLToPath(import.meta.url), '../../..');
  const skillPath = path.join(repoRoot, 'domains', 'coding', 'skills', 'fgos-code-panel', 'SKILL.md');
  const skillContent = fs.readFileSync(skillPath, 'utf8');
  const repoRootPathPattern = /`((?:core|src|docs)\/[^`]+)`/g;
  const expected = new Set([
    'core/skills/fgos-panel/SKILL.md',
    'src/runner/coordination/session-engine.mjs',
    'src/verbs/coordination/schema.mjs',
    'core/coordination-protocols/standalone-master-coordination-loop.yaml',
    'core/skills/_shared/private-cell-worktree.md',
    'docs/architect/agent-coordination/contracts/coordination-session.md',
  ]);
  const seen = new Set();
  const missing = [];

  for (const match of skillContent.matchAll(repoRootPathPattern)) {
    const target = match[1];
    if (!expected.has(target)) continue;
    seen.add(target);
    const targetPath = path.join(repoRoot, target);
    if (!fs.existsSync(targetPath)) missing.push(target);
  }

  assert.deepEqual(seen, expected);
  assert.deepEqual(missing, []);
  assert.ok(skillContent.includes('`core/skills/_shared/private-cell-worktree.md`'));
  assert.ok(skillContent.includes('`_shared/private-cell-worktree.md`'));
  assert.ok(fs.existsSync(path.join(repoRoot, '.agents', 'skills', '_shared', 'private-cell-worktree.md')));
  assert.ok(fs.existsSync(path.join(repoRoot, 'plugins', 'fgOS', 'skills', '_shared', 'private-cell-worktree.md')));
});

test('active source and projected skill files do not path-link fgos-code-panel after domain move', () => {
  const repoRoot = path.resolve(fileURLToPath(import.meta.url), '../../..');
  const skillPaths = [
    path.join(repoRoot, 'core', 'skills', 'fgos-panel', 'SKILL.md'),
    path.join(repoRoot, 'core', 'skills', 'fgos-plan-loop', 'SKILL.md'),
    path.join(repoRoot, '.agents', 'skills', 'fgos-panel', 'SKILL.md'),
    path.join(repoRoot, '.agents', 'skills', 'fgos-plan-loop', 'SKILL.md'),
    path.join(repoRoot, 'plugins', 'fgOS', 'skills', 'fgos-panel', 'SKILL.md'),
    path.join(repoRoot, 'plugins', 'fgOS', 'skills', 'fgos-plan-loop', 'SKILL.md'),
  ];
  const markdownLinkPattern = /\[[^\]]+\]\(([^)]+)\)/g;
  const linkedCodePanelPaths = [];

  for (const skillPath of skillPaths) {
    const content = fs.readFileSync(skillPath, 'utf8');
    for (const match of content.matchAll(markdownLinkPattern)) {
      const target = match[1];
      if (target.includes('fgos-code-panel')) {
        linkedCodePanelPaths.push(`${path.relative(repoRoot, skillPath)} -> ${target}`);
      }
    }
  }

  assert.deepEqual(linkedCodePanelPaths, []);
});

// ─── P2: Skill Source-of-Truth, Discovery, Collisions, and Projections ───

test('discoverCanonicalSkills discovers canonical skills across core/skills and domains/*/skills with authority, domain, and triggers', () => {
  const repoRoot = path.resolve(fileURLToPath(import.meta.url), '../../..');
  const skills = discoverCanonicalSkills(repoRoot);

  assert.ok(skills.length >= 15, 'expected at least 15 canonical skills in repo');

  const coreSkill = skills.find((s) => s.name === 'fgos-routing');
  assert.ok(coreSkill, 'fgos-routing must be discovered');
  assert.equal(coreSkill.authority, 'core');
  assert.equal(coreSkill.domain, null);
  assert.equal(coreSkill.canonicalDir, 'core/skills/fgos-routing');
  assert.equal(coreSkill.intentId, 'fgos:routing');
  assert.equal(coreSkill.triggers.codex, '$fgos-routing');
  assert.equal(coreSkill.triggers.claude, '/fgos:routing');
  assert.equal(coreSkill.triggers.gemini, '/fgos:routing');

  const domainSkill = skills.find((s) => s.name === 'fgos-code-panel');
  assert.ok(domainSkill, 'fgos-code-panel must be discovered');
  assert.equal(domainSkill.authority, 'domain');
  assert.equal(domainSkill.domain, 'coding');
  assert.equal(domainSkill.canonicalDir, 'domains/coding/skills/fgos-code-panel');
  assert.equal(domainSkill.intentId, 'fgos:code-panel');
  assert.equal(domainSkill.triggers.codex, '$fgos-code-panel');
  assert.equal(domainSkill.triggers.claude, '/fgos:code-panel');
  assert.equal(domainSkill.triggers.claudeCompat, '/fgOS:code-panel');
  assert.equal(domainSkill.triggers.gemini, '/fgos:code-panel');
});

test('discoverCanonicalSkills throws when duplicate canonical skill id exists across core and domains (negative duplicate canonical skill id test)', () => {
  const root = mkTempDir('skill-discovery-dup-core-domain-');
  writeSkill(path.join(root, 'core', 'skills'), 'duplicate-skill', SAMPLE_FRONTMATTER, '# Core\n');
  writeSkill(path.join(root, 'domains', 'coding', 'skills'), 'duplicate-skill', SAMPLE_FRONTMATTER, '# Coding\n');

  assert.throws(
    () => discoverCanonicalSkills(root),
    (err) => {
      assert.match(err.message, /duplicate skill name "duplicate-skill" found in multiple files:/);
      assert.match(err.message, /core\/skills\/duplicate-skill/);
      assert.match(err.message, /domains\/coding\/skills\/duplicate-skill/);
      return true;
    },
  );
});

test('discoverCanonicalSkills throws when duplicate canonical skill id exists across multiple domains', () => {
  const root = mkTempDir('skill-discovery-dup-domains-');
  writeSkill(path.join(root, 'domains', 'domainA', 'skills'), 'dup-across-domains', SAMPLE_FRONTMATTER, '# Domain A\n');
  writeSkill(path.join(root, 'domains', 'domainB', 'skills'), 'dup-across-domains', SAMPLE_FRONTMATTER, '# Domain B\n');

  assert.throws(
    () => discoverCanonicalSkills(root),
    (err) => {
      assert.match(err.message, /duplicate skill name "dup-across-domains" found in multiple files:/);
      assert.match(err.message, /domains\/domainA\/skills\/dup-across-domains/);
      assert.match(err.message, /domains\/domainB\/skills\/dup-across-domains/);
      return true;
    },
  );
});

test('discoverSharedFragments discovers shared fragments from core/skills/_shared and domains/*/skills/_shared', () => {
  const root = mkTempDir('skill-shared-discovery-');
  const coreShared = path.join(root, 'core', 'skills', '_shared');
  const domainShared = path.join(root, 'domains', 'coding', 'skills', '_shared');
  fs.mkdirSync(coreShared, { recursive: true });
  fs.mkdirSync(domainShared, { recursive: true });
  fs.writeFileSync(path.join(coreShared, 'core-fragment.md'), '# Core Fragment\n');
  fs.writeFileSync(path.join(domainShared, 'domain-fragment.md'), '# Domain Fragment\n');

  const fragments = discoverSharedFragments(root);
  assert.equal(fragments.length, 2);
  const coreEntry = fragments.find((f) => f.relativeFragmentPath === 'core-fragment.md');
  assert.ok(coreEntry);
  assert.equal(coreEntry.sourceLabel, 'core');
  const domainEntry = fragments.find((f) => f.relativeFragmentPath === 'domain-fragment.md');
  assert.ok(domainEntry);
  assert.equal(domainEntry.sourceLabel, 'domains/coding');
});

test('discoverSharedFragments throws on duplicate shared fragment collision across sources', () => {
  const root = mkTempDir('skill-shared-collision-');
  const coreShared = path.join(root, 'core', 'skills', '_shared');
  const domainShared = path.join(root, 'domains', 'coding', 'skills', '_shared');
  fs.mkdirSync(coreShared, { recursive: true });
  fs.mkdirSync(domainShared, { recursive: true });
  fs.writeFileSync(path.join(coreShared, 'colliding-fragment.md'), '# Core Version\n');
  fs.writeFileSync(path.join(domainShared, 'colliding-fragment.md'), '# Domain Version\n');

  assert.throws(
    () => discoverSharedFragments(root),
    (err) => {
      assert.match(err.message, /duplicate shared fragment "colliding-fragment\.md" found in multiple sources:/);
      assert.match(err.message, /core\/skills\/_shared\/colliding-fragment\.md/);
      assert.match(err.message, /domains\/coding\/skills\/_shared\/colliding-fragment\.md/);
      return true;
    },
  );
});

test('assembleSkills throws on shared fragment collision across core and domains', () => {
  const root = mkTempDir('assemble-shared-collision-');
  const coreShared = path.join(root, 'core', 'skills', '_shared');
  const domainShared = path.join(root, 'domains', 'coding', 'skills', '_shared');
  fs.mkdirSync(coreShared, { recursive: true });
  fs.mkdirSync(domainShared, { recursive: true });
  fs.writeFileSync(path.join(coreShared, 'collide.md'), '# Core\n');
  fs.writeFileSync(path.join(domainShared, 'collide.md'), '# Domain\n');
  writeSkill(path.join(root, 'core', 'skills'), 'skill-a', SAMPLE_FRONTMATTER, '# Body\n');

  assert.throws(
    () => assembleSkills(root),
    (err) => {
      assert.match(err.message, /duplicate shared fragment "collide\.md" found in multiple sources:/);
      return true;
    },
  );
});

test('SKILL_ADAPTER_TARGETS treats .agents/skills, .claude/skills, plugin bundles, and Gemini package output as generated adapter targets', () => {
  assert.ok(SKILL_ADAPTER_TARGETS.agents, 'agents target must be declared');
  assert.equal(SKILL_ADAPTER_TARGETS.agents.targetRelDir, '.agents/skills');
  assert.equal(SKILL_ADAPTER_TARGETS.agents.kind, 'portable-projection');
  assert.equal(SKILL_ADAPTER_TARGETS.agents.adapterStatus, 'implemented');

  assert.ok(SKILL_ADAPTER_TARGETS.claude, 'claude target must be declared');
  assert.equal(SKILL_ADAPTER_TARGETS.claude.targetRelDir, '.claude/skills');
  assert.equal(SKILL_ADAPTER_TARGETS.claude.kind, 'thin-wrapper');
  assert.equal(SKILL_ADAPTER_TARGETS.claude.adapterStatus, 'implemented');

  assert.ok(SKILL_ADAPTER_TARGETS.plugin, 'plugin target must be declared');
  assert.equal(SKILL_ADAPTER_TARGETS.plugin.targetRelDir, 'plugins/fgOS/skills');
  assert.equal(SKILL_ADAPTER_TARGETS.plugin.kind, 'mirrored-bundle');
  assert.equal(SKILL_ADAPTER_TARGETS.plugin.adapterStatus, 'implemented');

  assert.ok(SKILL_ADAPTER_TARGETS.gemini, 'gemini target must be declared');
  assert.equal(SKILL_ADAPTER_TARGETS.gemini.targetRelDir, '.gemini/extensions/fgos');
  assert.equal(SKILL_ADAPTER_TARGETS.gemini.kind, 'extension-package');
  assert.equal(SKILL_ADAPTER_TARGETS.gemini.adapterStatus, 'partial');
});

test('isGeneratedAdapterTarget and isCanonicalSkillSource enforce executable skill source-of-truth rules', () => {
  assert.equal(isCanonicalSkillSource('core/skills/fgos-routing/SKILL.md'), true);
  assert.equal(isCanonicalSkillSource('domains/coding/skills/fgos-code-panel/SKILL.md'), true);
  assert.equal(isCanonicalSkillSource('.agents/skills/fgos-routing/SKILL.md'), false);
  assert.equal(isCanonicalSkillSource('.claude/skills/fgos-routing/SKILL.md'), false);
  assert.equal(isCanonicalSkillSource('plugins/fgOS/skills/fgos-routing/SKILL.md'), false);

  assert.equal(isGeneratedAdapterTarget('.agents/skills/fgos-routing/SKILL.md'), true);
  assert.equal(isGeneratedAdapterTarget('.claude/skills/fgos-routing/SKILL.md'), true);
  assert.equal(isGeneratedAdapterTarget('plugins/fgOS/skills/fgos-routing/SKILL.md'), true);
  assert.equal(isGeneratedAdapterTarget('plugins/fgOS/skills/_shared/citation-format.md'), true);
  assert.equal(isGeneratedAdapterTarget('.gemini/extensions/fgos/commands/fgos/code-panel.toml'), true);
  assert.equal(isGeneratedAdapterTarget('core/skills/fgos-routing/SKILL.md'), false);
  assert.equal(isGeneratedAdapterTarget('domains/coding/skills/fgos-code-panel/SKILL.md'), false);

  // Precise classification: hand-authored plugin and claude skills are NOT generated adapter targets
  assert.equal(isGeneratedAdapterTarget('plugins/fgOS/skills/pick/SKILL.md'), false);
  assert.equal(isGeneratedAdapterTarget('plugins/fgOS/skills/submit/SKILL.md'), false);
  assert.equal(isGeneratedAdapterTarget('plugins/fgOS/skills/cook/SKILL.md'), false);
  assert.equal(isGeneratedAdapterTarget('.claude/skills/ui-spec/SKILL.md'), false);
  assert.equal(isGeneratedAdapterTarget('.claude/skills/gitnexus/gitnexus-cli/SKILL.md'), false);

  // Provenance / marker regression: hand-authored fgos-* plugin and claude skills without canonical source are NOT generated
  assert.equal(isGeneratedAdapterTarget('plugins/fgOS/skills/fgos-custom/SKILL.md'), false);
  assert.equal(isGeneratedAdapterTarget('.claude/skills/fgos-custom/SKILL.md'), false);
  assert.equal(isGeneratedAdapterTarget('plugins/fgOS/skills/_shared/unmirrored-custom.md'), false);
});

test('isGeneratedAdapterTarget uses provenance and markers, never prefix alone (isolated fixture)', () => {
  const root = mkTempDir('provenance-test-root-');
  const customPluginSkillDir = path.join(root, 'plugins', 'fgOS', 'skills', 'fgos-custom');
  fs.mkdirSync(customPluginSkillDir, { recursive: true });
  const customPluginSkillFile = path.join(customPluginSkillDir, 'SKILL.md');
  fs.writeFileSync(customPluginSkillFile, '---\nname: fgos-custom\ndescription: Hand-authored plugin skill\n---\n# Hand-authored custom\n');

  const customClaudeSkillDir = path.join(root, '.claude', 'skills', 'fgos-custom');
  fs.mkdirSync(customClaudeSkillDir, { recursive: true });
  const customClaudeSkillFile = path.join(customClaudeSkillDir, 'SKILL.md');
  fs.writeFileSync(customClaudeSkillFile, '---\nname: fgos-custom\ndescription: Hand-authored claude skill\n---\n# Hand-authored custom\n');

  // Even though their directory names start with fgos-, neither has canonical source nor wrapper marker
  assert.equal(isGeneratedAdapterTarget(customPluginSkillFile, root), false, 'hand-authored fgos-custom plugin skill is not generated target');
  assert.equal(isGeneratedAdapterTarget('plugins/fgOS/skills/fgos-custom/SKILL.md', root), false);
  assert.equal(isGeneratedAdapterTarget(customClaudeSkillFile, root), false, 'hand-authored fgos-custom claude skill without marker is not generated target');
  assert.equal(isGeneratedAdapterTarget('.claude/skills/fgos-custom/SKILL.md', root), false);

  // When canonical source exists, it is recognized as a generated adapter target
  writeSkill(path.join(root, 'core', 'skills'), 'fgos-routing', SAMPLE_FRONTMATTER, '# Core Routing\n');
  const mirroredPluginRouting = path.join(root, 'plugins', 'fgOS', 'skills', 'fgos-routing', 'SKILL.md');
  fs.mkdirSync(path.dirname(mirroredPluginRouting), { recursive: true });
  fs.writeFileSync(mirroredPluginRouting, SAMPLE_FRONTMATTER + '\n# Core Routing\n');
  assert.equal(isGeneratedAdapterTarget(mirroredPluginRouting, root), true, 'mirrored plugin skill with canonical source is generated target');

  // Provenance alone is not enough either: the plugin mirror only ever writes
  // _shared/ and fgos-* names, so a canonical `distill` skill does NOT make a
  // plugins/fgOS/skills/distill/ entry generated -- the mirror never wrote it.
  writeSkill(path.join(root, 'core', 'skills'), 'distill', SAMPLE_FRONTMATTER, '# Distill\n');
  writeSkill(path.join(root, 'plugins', 'fgOS', 'skills'), 'distill', SAMPLE_FRONTMATTER, '# Hand-placed\n');
  assert.equal(isGeneratedAdapterTarget('plugins/fgOS/skills/distill/SKILL.md', root), false, 'canonical source outside the mirror name rule is not a mirrored plugin target');
  assert.equal(mirrorDevSkillsIntoPlugin(path.join(root, 'core', 'skills'), mkTempDir('mirror-rule-check-')).some((p) => path.basename(p) === 'distill'), false, 'the mirror itself never writes distill -- classification must agree with it');

  // The moment fgos-custom gains an assembled source it IS mirror-managed
  writeSkill(path.join(root, '.agents', 'skills'), 'fgos-custom', SAMPLE_FRONTMATTER, '# Now assembled\n');
  assert.equal(isGeneratedAdapterTarget('plugins/fgOS/skills/fgos-custom/SKILL.md', root), true, 'fgos-custom with an assembled source is what the mirror writes');

  // When wrapper marker is present in .claude/skills, it is recognized as a generated adapter target
  const generatedWrapperClaude = path.join(root, '.claude', 'skills', 'fgos-routed', 'SKILL.md');
  fs.mkdirSync(path.dirname(generatedWrapperClaude), { recursive: true });
  fs.writeFileSync(generatedWrapperClaude, 'This is a generated thin wrapper (tsk-1qi) -- do not edit directly, edit the source instead.\n# Wrapper\n');
  assert.equal(isGeneratedAdapterTarget(generatedWrapperClaude, root), true, 'claude skill with generated wrapper marker is generated target');
});

test('isGeneratedAdapterTarget infers the nearest project root under an ancestor named plugins', () => {
  const outer = mkTempDir('adapter-root-ancestor-plugins-');
  const root = path.join(outer, 'plugins', 'repo');
  const pluginSkillFile = path.join(root, 'plugins', 'fgOS', 'skills', 'fgos-routing', 'SKILL.md');

  writeSkill(path.join(root, 'core', 'skills'), 'fgos-routing', SAMPLE_FRONTMATTER, '# canonical\n');
  fs.mkdirSync(path.dirname(pluginSkillFile), { recursive: true });
  fs.writeFileSync(pluginSkillFile, `${SAMPLE_FRONTMATTER}\n# mirrored\n`);

  assert.equal(isGeneratedAdapterTarget(pluginSkillFile), true);
  assert.equal(isGeneratedAdapterTarget(pluginSkillFile, root), true);
});

test('isGeneratedAdapterTarget chooses the nearest adapter marker across mixed marker ancestors', () => {
  const outer = mkTempDir('adapter-root-mixed-markers-');
  const root = path.join(outer, '.agents', 'ancestor', 'plugins', 'repo');
  const pluginSkillFile = path.join(root, 'plugins', 'fgOS', 'skills', 'fgos-routing', 'SKILL.md');

  writeSkill(path.join(root, 'core', 'skills'), 'fgos-routing', SAMPLE_FRONTMATTER, '# canonical\n');
  fs.mkdirSync(path.dirname(pluginSkillFile), { recursive: true });
  fs.writeFileSync(pluginSkillFile, `${SAMPLE_FRONTMATTER}\n# mirrored\n`);

  assert.equal(isGeneratedAdapterTarget(pluginSkillFile), true);
});

test('projection tests for Codex/OpenAI and Claude surfaces verify adapter projection invariants', () => {
  const repoRoot = path.resolve(fileURLToPath(import.meta.url), '../../..');
  const canonicalSkills = discoverCanonicalSkills(repoRoot);

  for (const skill of canonicalSkills) {
    const agentsPath = path.join(repoRoot, '.agents', 'skills', skill.name, 'SKILL.md');
    assert.ok(fs.existsSync(agentsPath), `portable Codex projection must exist at ${agentsPath}`);
    const agentsContent = fs.readFileSync(agentsPath, 'utf8');
    assert.ok(
      agentsContent.includes('# '),
      `portable Codex projection ${skill.name} must carry full skill instructions`,
    );

    const claudePath = path.join(repoRoot, '.claude', 'skills', skill.name, 'SKILL.md');
    assert.ok(fs.existsSync(claudePath), `Claude wrapper projection must exist at ${claudePath}`);
    const claudeContent = fs.readFileSync(claudePath, 'utf8');
    assert.ok(
      claudeContent.includes('This is a generated thin wrapper'),
      `Claude wrapper for ${skill.name} must be a thin wrapper redirect`,
    );
    assert.ok(
      claudeContent.includes(skill.name),
      `Claude wrapper for ${skill.name} must redirect to the correct skill name`,
    );
  }
});

test('discoverCanonicalSkills and assembleSkills throw on duplicate canonical intent ID and Gemini path overwrite collision across core and domain', () => {
  const root = mkTempDir('skill-intent-collision-');
  const coreSkillDir = path.join(root, 'core', 'skills', 'skill-core-alpha');
  const domainSkillDir = path.join(root, 'domains', 'coding', 'skills', 'skill-domain-beta');
  fs.mkdirSync(coreSkillDir, { recursive: true });
  fs.mkdirSync(domainSkillDir, { recursive: true });

  const coreFrontmatter = '---\nname: skill-core-alpha\nintent: fgos:shared-op\ndescription: Core skill with shared-op intent\n---\n';
  const domainFrontmatter = '---\nname: skill-domain-beta\nintent: fgos:shared-op\ndescription: Domain skill with shared-op intent\n---\n';

  fs.writeFileSync(path.join(coreSkillDir, 'SKILL.md'), `${coreFrontmatter}\n# Core Alpha\n`);
  fs.writeFileSync(path.join(domainSkillDir, 'SKILL.md'), `${domainFrontmatter}\n# Domain Beta\n`);

  // Distinct skill names (skill-core-alpha vs skill-domain-beta), but identical canonical intent and Gemini command path (commands/fgos/shared-op.toml)
  assert.throws(
    () => discoverCanonicalSkills(root),
    (err) => {
      assert.match(err.message, /duplicate canonical intent ID "fgos:shared-op" found across skills:/);
      assert.match(err.message, /skill-core-alpha/);
      assert.match(err.message, /skill-domain-beta/);
      return true;
    },
  );

  assert.throws(
    () => assembleSkills(root),
    (err) => {
      assert.match(err.message, /duplicate canonical intent ID "fgos:shared-op" found across skills:/);
      return true;
    },
  );

  const outDir = mkTempDir('gemini-collision-out-');
  assert.throws(
    () => generateGeminiSkillPackage(root, outDir),
    (err) => {
      assert.match(err.message, /duplicate canonical intent ID "fgos:shared-op"|duplicate derived/);
      return true;
    },
  );
  assert.equal(fs.existsSync(path.join(outDir, 'commands', 'fgos', 'shared-op.toml')), false, 'no adapter files written on collision');
});

test('discoverCanonicalSkills and generateGeminiSkillPackage throw when distinct intent IDs derive the same host command path', () => {
  const root = mkTempDir('distinct-intent-same-path-');
  const coreSkillDir = path.join(root, 'core', 'skills', 'skill-core-deploy');
  const domainSkillDir = path.join(root, 'domains', 'coding', 'skills', 'skill-domain-deploy');
  fs.mkdirSync(coreSkillDir, { recursive: true });
  fs.mkdirSync(domainSkillDir, { recursive: true });

  // Distinct intent IDs: 'fgos:deploy' vs 'deploy'
  const coreFrontmatter = '---\nname: skill-core-deploy\nintent: fgos:deploy\ndescription: Core deploy skill\n---\n';
  const domainFrontmatter = '---\nname: skill-domain-deploy\nintent: deploy\ndescription: Domain deploy skill\n---\n';

  fs.writeFileSync(path.join(coreSkillDir, 'SKILL.md'), `${coreFrontmatter}\n# Core Deploy\n`);
  fs.writeFileSync(path.join(domainSkillDir, 'SKILL.md'), `${domainFrontmatter}\n# Domain Deploy\n`);

  // Verify intent IDs are distinct strings
  assert.notEqual('fgos:deploy', 'deploy');

  // discoverCanonicalSkills throws on duplicate host command path commands/fgos/deploy.toml
  assert.throws(
    () => discoverCanonicalSkills(root),
    (err) => {
      assert.match(err.message, /duplicate derived host command path "commands\/fgos\/deploy\.toml" found across skills:/);
      assert.match(err.message, /skill-core-deploy/);
      assert.match(err.message, /skill-domain-deploy/);
      return true;
    },
  );

  // generateGeminiSkillPackage independently throws on colliding command paths
  const outDir = mkTempDir('gemini-distinct-intent-collision-');
  assert.throws(
    () => generateGeminiSkillPackage(root, outDir),
    (err) => {
      assert.match(err.message, /duplicate derived (?:host|Gemini) command path "commands\/fgos\/deploy\.toml" found across skills:/);
      return true;
    },
  );
  assert.equal(fs.existsSync(path.join(outDir, 'commands', 'fgos', 'deploy.toml')), false, 'no adapter files written on collision');
});

test('discoverCanonicalSkills and generateGeminiSkillPackage reject Gemini command path aliases with dot segments', () => {
  const root = mkTempDir('gemini-dot-segment-intent-');
  const coreSkillDir = path.join(root, 'core', 'skills', 'skill-core-routing');
  fs.mkdirSync(coreSkillDir, { recursive: true });
  const frontmatter = '---\nname: skill-core-routing\nintent: fgos:./routing\ndescription: Invalid alias\n---\n';
  fs.writeFileSync(path.join(coreSkillDir, 'SKILL.md'), `${frontmatter}\n# Body\n`);

  assert.throws(
    () => discoverCanonicalSkills(root),
    /invalid Gemini command intent "fgos:\.\/routing"/,
  );

  const outDir = mkTempDir('gemini-dot-segment-out-');
  assert.throws(
    () => generateGeminiSkillPackage(root, outDir, {
      skills: [{
        name: 'skill-core-routing',
        canonicalDir: 'core/skills/skill-core-routing',
        intentId: 'fgos:./routing',
        userInvocable: true,
        triggers: { gemini: '/fgos:./routing' },
      }],
    }),
    /invalid Gemini command intent "fgos:\.\/routing"/,
  );
  assert.equal(fs.existsSync(path.join(outDir, 'commands', 'fgos', 'routing.toml')), false);
});

test('discoverCanonicalSkills rejects case-only Gemini command path collisions', () => {
  const root = mkTempDir('gemini-case-collision-');
  const coreSkillDir = path.join(root, 'core', 'skills', 'skill-core-deploy');
  const domainSkillDir = path.join(root, 'domains', 'coding', 'skills', 'skill-domain-deploy');
  fs.mkdirSync(coreSkillDir, { recursive: true });
  fs.mkdirSync(domainSkillDir, { recursive: true });
  fs.writeFileSync(path.join(coreSkillDir, 'SKILL.md'), '---\nname: skill-core-deploy\nintent: fgos:deploy\ndescription: Core deploy\n---\n# Core\n');
  fs.writeFileSync(path.join(domainSkillDir, 'SKILL.md'), '---\nname: skill-domain-deploy\nintent: fgos:Deploy\ndescription: Domain deploy\n---\n# Domain\n');

  assert.throws(
    () => discoverCanonicalSkills(root),
    /invalid Gemini command intent "fgos:Deploy"/,
  );
});

test('discoverCanonicalSkills rejects non-portable Gemini command verbs', () => {
  for (const [name, intent] of [
    ['skill-colon', 'fgos:foo:bar'],
    ['skill-trailing-dot', 'fgos:foo.'],
    ['skill-unicode', 'fgos:café'],
    ['skill-device-con', 'fgos:con'],
    ['skill-device-com1', 'fgos:com1'],
  ]) {
    const root = mkTempDir('gemini-nonportable-intent-');
    const skillDir = path.join(root, 'core', 'skills', name);
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), `---\nname: ${name}\nintent: ${intent}\ndescription: Invalid portable filename\n---\n# Body\n`);

    assert.throws(
      () => discoverCanonicalSkills(root),
      new RegExp(`invalid Gemini command intent "${intent}"`),
    );
  }
});

test('mapSkillIntentToHostTriggers maps canonical skill intent to host-native triggers across Codex, Claude, and Gemini', () => {
  const codePanel = mapSkillIntentToHostTriggers('fgos:code-panel', 'fgos-code-panel');
  assert.equal(codePanel.codex, '$fgos-code-panel');
  assert.equal(codePanel.claude, '/fgos:code-panel');
  assert.equal(codePanel.claudeCompat, '/fgOS:code-panel');
  assert.equal(codePanel.gemini, '/fgos:code-panel');
  assert.equal(codePanel.status, 'implemented');

  const archPanel = mapSkillIntentToHostTriggers('fgos:architecture-panel', 'fgos-architecture-panel');
  assert.equal(archPanel.codex, '$fgos-architecture-panel');
  assert.equal(archPanel.claude, '/fgos:architecture-panel');
  assert.equal(archPanel.gemini, '/fgos:architecture-panel');
  assert.equal(archPanel.status, 'implemented');

  const pick = mapSkillIntentToHostTriggers('fgos:pick', 'fgos-routing');
  assert.equal(pick.codex, '$fgos-routing', 'fgos:pick maps to $fgos-routing in Codex');
  assert.equal(pick.claude, '/fgos:pick');
  assert.equal(pick.gemini, '/fgos:pick');
  assert.equal(pick.status, 'partial', 'routing/pick compatibility trigger mapping is partial');
});

test('generateGeminiSkillPackage generates valid Gemini CLI extension package as adapter target', () => {
  const root = mkTempDir('gemini-package-root-');
  writeSkill(path.join(root, 'core', 'skills'), 'fgos-routing', SAMPLE_FRONTMATTER, '# Core Routing\n');
  writeSkill(path.join(root, 'domains', 'coding', 'skills'), 'fgos-code-panel', SAMPLE_FRONTMATTER, '# Coding Code Panel\n');

  const outDir = mkTempDir('gemini-package-output-');
  const written = generateGeminiSkillPackage(root, outDir);

  assert.ok(written.length >= 4);
  assert.ok(fs.existsSync(path.join(outDir, 'gemini-extension.json')));
  assert.ok(fs.existsSync(path.join(outDir, 'GEMINI.md')));
  assert.ok(fs.existsSync(path.join(outDir, 'commands', 'fgos', 'routing.toml')));
  assert.ok(fs.existsSync(path.join(outDir, 'commands', 'fgos', 'code-panel.toml')));
  assert.ok(fs.existsSync(path.join(outDir, 'skills', 'fgos-routing', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(outDir, 'skills', 'fgos-code-panel', 'SKILL.md')));

  const manifest = JSON.parse(fs.readFileSync(path.join(outDir, 'gemini-extension.json'), 'utf8'));
  assert.equal(manifest.name, 'fgos');
  assert.equal(manifest.commands.length, 2);
  const codePanelCmd = manifest.commands.find((c) => c.name === 'code-panel');
  assert.ok(codePanelCmd);
  assert.equal(codePanelCmd.file, 'commands/fgos/code-panel.toml');

  const toml = fs.readFileSync(path.join(outDir, 'commands', 'fgos', 'code-panel.toml'), 'utf8');
  assert.match(toml, /intent = "fgos:code-panel"/);
  assert.match(toml, /packaged_source = "skills\/fgos-code-panel\/SKILL\.md"/);
  assert.match(toml, /provenance = "domains\/coding\/skills\/fgos-code-panel"/, 'provenance records the canonical dir as metadata');
  assert.match(toml, /^prompt = "Read and follow the packaged fgOS skill instructions at skills\/fgos-code-panel\/SKILL\.md, inside this fgos extension's own install directory, directly\."$/m);

  const geminiMd = fs.readFileSync(path.join(outDir, 'GEMINI.md'), 'utf8');
  assert.match(geminiMd, /packaged skill `skills\/fgos-code-panel\/SKILL\.md`/);
});

test('generateGeminiSkillPackage produces a completely self-contained extension package runnable without source repo', () => {
  const root = mkTempDir('gemini-standalone-src-');
  writeSkill(path.join(root, 'core', 'skills'), 'fgos-routing', SAMPLE_FRONTMATTER, '# Core Routing\n');
  writeSkill(
    path.join(root, 'domains', 'coding', 'skills'),
    'fgos-code-panel',
    SAMPLE_FRONTMATTER,
    '# Coding Code Panel\nRead `../../../core/skills/_shared/standalone-fragment.md`.\n',
  );
  const sharedDir = path.join(root, 'core', 'skills', '_shared');
  fs.mkdirSync(sharedDir, { recursive: true });
  fs.writeFileSync(path.join(sharedDir, 'standalone-fragment.md'), '# Standalone Shared Fragment\n');
  fs.writeFileSync(
    path.join(sharedDir, 'entry.md'),
    'Read `../../../core/skills/_shared/standalone-fragment.md` from shared.\n',
  );
  fs.mkdirSync(path.join(sharedDir, 'nested'), { recursive: true });
  fs.writeFileSync(
    path.join(sharedDir, 'nested', 'entry.md'),
    'Read `../../../../core/skills/_shared/standalone-fragment.md` from nested shared.\n',
  );

  const outDir = mkTempDir('gemini-standalone-pkg-');
  generateGeminiSkillPackage(root, outDir);

  // Simulate standalone release distribution: delete the entire canonical source directory
  fs.rmSync(root, { recursive: true, force: true });
  assert.equal(fs.existsSync(root), false, 'source repo is deleted; package must be self-contained');

  // The package in outDir must be 100% self-contained
  const manifest = JSON.parse(fs.readFileSync(path.join(outDir, 'gemini-extension.json'), 'utf8'));
  assert.equal(manifest.name, 'fgos');
  assert.equal(manifest.commands.length, 2);

  // Shared fragments exist in package
  assert.ok(fs.existsSync(path.join(outDir, 'skills', '_shared', 'standalone-fragment.md')));
  const sharedContent = fs.readFileSync(path.join(outDir, 'skills', '_shared', 'standalone-fragment.md'), 'utf8');
  assert.match(sharedContent, /# Standalone Shared Fragment/);
  const sharedEntry = fs.readFileSync(path.join(outDir, 'skills', '_shared', 'entry.md'), 'utf8');
  assert.doesNotMatch(sharedEntry, /(?:\.\.\/)+core\/skills\/_shared\//);
  assert.match(sharedEntry, /`\.\/standalone-fragment\.md`/);
  for (const ref of sharedEntry.matchAll(/`((?:\.\/|\.\.\/)[^`]+)`/g)) {
    const resolved = path.resolve(path.join(outDir, 'skills', '_shared'), ref[1]);
    assert.ok(fs.existsSync(resolved), `shared packaged reference ${ref[1]} must resolve inside package`);
  }
  const nestedSharedEntryPath = path.join(outDir, 'skills', '_shared', 'nested', 'entry.md');
  const nestedSharedEntry = fs.readFileSync(nestedSharedEntryPath, 'utf8');
  assert.doesNotMatch(nestedSharedEntry, /(?:\.\.\/)+core\/skills\/_shared\//);
  const nestedRef = nestedSharedEntry.match(/`(\.\.\/standalone-fragment\.md)`/);
  assert.ok(nestedRef);
  assert.ok(fs.existsSync(path.resolve(path.dirname(nestedSharedEntryPath), nestedRef[1])));

  // Every command TOML points to packaged source that exists inside outDir,
  // and its runnable prompt never names an unbundled canonical repo path --
  // `provenance` is the only line allowed to mention core/skills or domains/.
  const unbundledSourcePattern = /(?:^|[^A-Za-z0-9_-])(?:core\/skills|domains)\//;
  for (const cmd of manifest.commands) {
    const tomlPath = path.join(outDir, cmd.file);
    assert.ok(fs.existsSync(tomlPath), `command file ${cmd.file} must exist`);
    const tomlContent = fs.readFileSync(tomlPath, 'utf8');
    assert.match(tomlContent, /packaged_source = "skills\/[^"]+\/SKILL\.md"/);
    assert.match(tomlContent, /^prompt = "Read and follow the packaged fgOS skill instructions at skills\/[^"]+\/SKILL\.md, inside this fgos extension's own install directory, directly\."$/m);
    assert.doesNotMatch(tomlContent, /canonical_source/, 'no line may present the unbundled canonical path as a source to read');
    for (const line of tomlContent.split('\n')) {
      if (line.startsWith('provenance = ')) continue;
      assert.doesNotMatch(line, unbundledSourcePattern, `${cmd.file} runnable line references an unbundled repo source: ${line}`);
    }

    const match = tomlContent.match(/packaged_source = "([^"]+)"/);
    assert.ok(match, 'packaged_source must be defined');
    const packagedSkillPath = path.join(outDir, match[1]);
    assert.ok(fs.existsSync(packagedSkillPath), `referenced skill file ${match[1]} must exist in the standalone package`);
    const skillContent = fs.readFileSync(packagedSkillPath, 'utf8');
    assert.ok(skillContent.length > 0, `skill file ${match[1]} must have non-empty instruction content`);
    assert.doesNotMatch(skillContent, /(?:\.\.\/)+core\/skills\/_shared\//);
    assert.doesNotMatch(skillContent, /(?:\.\.\/)+domains\/[^/]+\/skills\/_shared\//);
    const refPattern = /`(\.\.\/_shared\/[^`]+)`/g;
    for (const ref of skillContent.matchAll(refPattern)) {
      const resolved = path.resolve(path.dirname(packagedSkillPath), ref[1]);
      assert.ok(fs.existsSync(resolved), `packaged skill reference ${ref[1]} must resolve inside package`);
    }
  }

  // GEMINI.md points to packaged skill locations only
  const geminiMd = fs.readFileSync(path.join(outDir, 'GEMINI.md'), 'utf8');
  assert.match(geminiMd, /packaged skill `skills\/fgos-routing\/SKILL\.md`/);
  assert.match(geminiMd, /packaged skill `skills\/fgos-code-panel\/SKILL\.md`/);
  assert.doesNotMatch(geminiMd, unbundledSourcePattern, 'GEMINI.md must not route the host to an unbundled canonical source');
});

test('generateGeminiSkillPackage rejects nested shared fragment collisions before copying', () => {
  const root = mkTempDir('gemini-nested-shared-collision-src-');
  writeSkill(path.join(root, 'core', 'skills'), 'fgos-routing', SAMPLE_FRONTMATTER, '# Core Routing\n');

  const coreShared = path.join(root, 'core', 'skills', '_shared', 'nested');
  const domainShared = path.join(root, 'domains', 'coding', 'skills', '_shared', 'nested');
  fs.mkdirSync(coreShared, { recursive: true });
  fs.mkdirSync(domainShared, { recursive: true });
  fs.writeFileSync(path.join(coreShared, 'same.md'), '# Core Shared\n');
  fs.writeFileSync(path.join(domainShared, 'same.md'), '# Domain Shared\n');

  const outDir = mkTempDir('gemini-nested-shared-collision-pkg-');

  assert.throws(
    () => generateGeminiSkillPackage(root, outDir),
    /duplicate shared fragment "nested\/same\.md" found in multiple sources:/,
  );
  assert.equal(fs.existsSync(path.join(outDir, 'skills', '_shared', 'nested', 'same.md')), false);
});

test('assembleSkills rejects duplicate shared fragments even when legacy checkCollisions:false is passed', () => {
  const root = mkTempDir('assemble-no-overwrite-shared-src-');
  const coreShared = path.join(root, 'core', 'skills', '_shared');
  const domainShared = path.join(root, 'domains', 'coding', 'skills', '_shared');
  fs.mkdirSync(coreShared, { recursive: true });
  fs.mkdirSync(domainShared, { recursive: true });
  fs.writeFileSync(path.join(coreShared, 'same.md'), '# Core Shared\n');
  fs.writeFileSync(path.join(domainShared, 'same.md'), '# Domain Shared\n');
  writeSkill(path.join(root, 'core', 'skills'), 'fgos-routing', SAMPLE_FRONTMATTER, '# Core Routing\n');

  assert.throws(
    () => assembleSkills(root, undefined, { checkCollisions: false }),
    /duplicate shared fragment "same\.md" found in multiple sources:/,
  );
});

test('discoverSharedFragments rejects Unicode-normalized and Windows-normalized shared fragment collisions', () => {
  const root = mkTempDir('shared-normalized-collision-src-');
  const coreShared = path.join(root, 'core', 'skills', '_shared');
  const domainShared = path.join(root, 'domains', 'coding', 'skills', '_shared');
  fs.mkdirSync(coreShared, { recursive: true });
  fs.mkdirSync(domainShared, { recursive: true });
  fs.writeFileSync(path.join(coreShared, 'café.md'), '# NFC\n');
  fs.writeFileSync(path.join(domainShared, 'café.md'), '# NFD\n');

  assert.throws(
    () => discoverSharedFragments(root),
    /duplicate shared fragment "café\.md" found in multiple sources:/,
  );

  fs.rmSync(root, { recursive: true, force: true });
  const windowsRoot = mkTempDir('shared-windows-collision-src-');
  const windowsCoreShared = path.join(windowsRoot, 'core', 'skills', '_shared');
  const windowsDomainShared = path.join(windowsRoot, 'domains', 'coding', 'skills', '_shared');
  fs.mkdirSync(windowsCoreShared, { recursive: true });
  fs.mkdirSync(windowsDomainShared, { recursive: true });
  fs.writeFileSync(path.join(windowsCoreShared, 'same.md'), '# ordinary\n');
  fs.writeFileSync(path.join(windowsDomainShared, 'same.md.'), '# trailing dot\n');

  assert.throws(
    () => discoverSharedFragments(windowsRoot),
    /invalid shared fragment path "same\.md\.": fragment names must not end with dots or spaces/,
  );
});

test('discoverSharedFragments rejects backslash shared fragment names before Windows aliasing can occur', () => {
  const root = mkTempDir('shared-backslash-alias-src-');
  const coreShared = path.join(root, 'core', 'skills', '_shared');
  fs.mkdirSync(coreShared, { recursive: true });
  fs.writeFileSync(path.join(coreShared, 'nested\\same.md'), '# Backslash Alias\n');

  assert.throws(
    () => discoverSharedFragments(root),
    /invalid shared fragment path "nested\\same\.md": fragment names must not contain backslashes/,
  );
});

test('discoverSharedFragments rejects Windows reserved shared fragment basenames', () => {
  const root = mkTempDir('shared-device-name-src-');
  const coreShared = path.join(root, 'core', 'skills', '_shared');
  fs.mkdirSync(coreShared, { recursive: true });
  fs.writeFileSync(path.join(coreShared, 'AUX.md'), '# Device Name\n');

  assert.throws(
    () => discoverSharedFragments(root),
    /invalid shared fragment path "AUX\.md": fragment names must not use Windows reserved basenames/,
  );
});

test('discoverSharedFragments rejects standalone trailing-dot and trailing-space aliases', () => {
  for (const name of ['foo.', 'foo ']) {
    const root = mkTempDir('shared-trailing-alias-src-');
    const coreShared = path.join(root, 'core', 'skills', '_shared');
    fs.mkdirSync(coreShared, { recursive: true });
    fs.writeFileSync(path.join(coreShared, name), '# Trailing Alias\n');

    assert.throws(
      () => discoverSharedFragments(root),
      new RegExp(`invalid shared fragment path "${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}": fragment names must not end with dots or spaces`),
    );
  }
});

test('generateGeminiSkillPackage rejects Windows reserved skill directory basenames', () => {
  const root = mkTempDir('gemini-device-skill-src-');

  assert.throws(
    () => generateGeminiSkillPackage(root, mkTempDir('gemini-device-skill-pkg-'), {
      skills: [{
        name: 'CON',
        canonicalDir: null,
        intentId: 'fgos:demo',
        userInvocable: true,
        triggers: { gemini: '/fgos:demo' },
        rawContent: `${SAMPLE_FRONTMATTER}\n# CON\n`,
      }],
    }),
    /invalid skill name "CON": emitted skill path segments must not use Windows reserved basenames/,
  );
});

test('assembleSkills rejects Windows reserved canonical skill directory basenames before projection', () => {
  const root = mkTempDir('assemble-device-skill-src-');
  writeSkill(
    path.join(root, 'core', 'skills'),
    'CON',
    '---\nname: CON\nintent: fgos:demo\ndescription: Device skill\n---\n',
    '# CON\n',
  );

  assert.throws(
    () => assembleSkills(root),
    /invalid skill name "CON": emitted skill path segments must not use Windows reserved basenames/,
  );
  assert.equal(fs.existsSync(path.join(root, '.agents', 'skills', 'CON')), false);
});

test('assembleSkills rejects non-portable skill names even when legacy checkDuplicates:false is passed', () => {
  const root = mkTempDir('assemble-device-skill-no-dupes-src-');
  writeSkill(
    path.join(root, 'core', 'skills'),
    'CON',
    '---\nname: CON\nintent: fgos:demo\ndescription: Device skill\n---\n',
    '# CON\n',
  );

  assert.throws(
    () => assembleSkills(root, undefined, { checkDuplicates: false }),
    /invalid skill name "CON": emitted skill path segments must not use Windows reserved basenames/,
  );
  assert.equal(fs.existsSync(path.join(root, '.agents', 'skills', 'CON')), false);
});

test('generated projections reject standalone trailing-dot and trailing-space skill aliases', () => {
  for (const name of ['foo.', 'foo ']) {
    const root = mkTempDir('skill-trailing-alias-src-');
    writeSkill(
      path.join(root, 'core', 'skills'),
      name,
      `---\nname: ${name}\nintent: fgos:demo\ndescription: Trailing alias\n---\n`,
      '# Trailing Alias\n',
    );

    assert.throws(
      () => assembleSkills(root),
      new RegExp(`invalid skill name "${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}": emitted skill path segments must not end with dots or spaces`),
    );
    assert.equal(fs.existsSync(path.join(root, '.agents', 'skills', name)), false);
  }

  assert.throws(
    () => generateGeminiSkillPackage(mkTempDir('gemini-trailing-skill-src-'), mkTempDir('gemini-trailing-skill-pkg-'), {
      skills: [{
        name: 'foo.',
        canonicalDir: null,
        intentId: 'fgos:demo',
        userInvocable: true,
        triggers: { gemini: '/fgos:demo' },
        rawContent: `${SAMPLE_FRONTMATTER}\n# Foo\n`,
      }],
    }),
    /invalid skill name "foo\.": emitted skill path segments must not end with dots or spaces/,
  );
});

test('generateGeminiSkillPackage rejects Windows-normalized emitted skill path collisions', () => {
  const root = mkTempDir('gemini-skill-path-collision-src-');

  assert.throws(
    () => generateGeminiSkillPackage(root, mkTempDir('gemini-skill-path-collision-pkg-'), {
      skills: [
        {
          name: 'foo',
          canonicalDir: null,
          intentId: 'fgos:one',
          userInvocable: true,
          triggers: { gemini: '/fgos:one' },
          rawContent: `${SAMPLE_FRONTMATTER}\n# Foo\n`,
        },
        {
          name: 'FOO',
          canonicalDir: null,
          intentId: 'fgos:two',
          userInvocable: true,
          triggers: { gemini: '/fgos:two' },
          rawContent: `${SAMPLE_FRONTMATTER}\n# FOO\n`,
        },
      ],
    }),
    /duplicate emitted skill path "foo" found across skills:/,
  );
});

test('generateGeminiSkillPackage rewrites absolute canonical shared references into package-local references', () => {
  const root = mkTempDir('gemini-absolute-shared-src-');
  const sharedDir = path.join(root, 'core', 'skills', '_shared');
  fs.mkdirSync(sharedDir, { recursive: true });
  fs.writeFileSync(path.join(sharedDir, 'a.md'), '# A\n');
  writeSkill(
    path.join(root, 'core', 'skills'),
    'fgos-absolute',
    '---\nname: fgos-absolute\ndescription: Absolute ref\n---\n',
    `# Absolute\nRead \`${path.join(sharedDir, 'a.md').split(path.sep).join('/')}\`.\n`,
  );

  const outDir = mkTempDir('gemini-absolute-shared-pkg-');
  generateGeminiSkillPackage(root, outDir);
  fs.rmSync(root, { recursive: true, force: true });

  const skillPath = path.join(outDir, 'skills', 'fgos-absolute', 'SKILL.md');
  const skillContent = fs.readFileSync(skillPath, 'utf8');
  assert.doesNotMatch(skillContent, new RegExp(root.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  const ref = skillContent.match(/`(\.\.\/_shared\/a\.md)`/);
  assert.ok(ref);
  assert.ok(fs.existsSync(path.resolve(path.dirname(skillPath), ref[1])));
});

test('generateGeminiSkillPackage rewrites lexically non-canonical absolute shared references', () => {
  const root = mkTempDir('gemini-noncanonical-absolute-src-');
  const sharedDir = path.join(root, 'core', 'skills', '_shared');
  fs.mkdirSync(sharedDir, { recursive: true });
  fs.writeFileSync(path.join(sharedDir, 'x.md'), '# X\n');
  writeSkill(
    path.join(root, 'core', 'skills'),
    'fgos-noncanonical-absolute',
    '---\nname: fgos-noncanonical-absolute\ndescription: Noncanonical absolute ref\n---\n',
    `# Noncanonical Absolute\nRead \`${path.join(root, 'core', 'skills', 'a', '..', '_shared', 'x.md').split(path.sep).join('/')}\`.\n`,
  );

  const outDir = mkTempDir('gemini-noncanonical-absolute-pkg-');
  generateGeminiSkillPackage(root, outDir);
  fs.rmSync(root, { recursive: true, force: true });

  const skillPath = path.join(outDir, 'skills', 'fgos-noncanonical-absolute', 'SKILL.md');
  const skillContent = fs.readFileSync(skillPath, 'utf8');
  assert.doesNotMatch(skillContent, /core\/skills\/a\/\.\.\/_shared\/x\.md/);
  const ref = skillContent.match(/`(\.\.\/_shared\/x\.md)`/);
  assert.ok(ref);
  assert.ok(fs.existsSync(path.resolve(path.dirname(skillPath), ref[1])));
});

test('generateGeminiSkillPackage rewrites symlinked absolute canonical shared references', () => {
  const root = mkTempDir('gemini-symlink-absolute-src-');
  const alias = path.join(path.dirname(root), `${path.basename(root)}-alias`);
  fs.symlinkSync(root, alias, 'dir');
  const sharedDir = path.join(root, 'core', 'skills', '_shared');
  fs.mkdirSync(sharedDir, { recursive: true });
  fs.writeFileSync(path.join(sharedDir, 'x.md'), '# X\n');
  writeSkill(
    path.join(root, 'core', 'skills'),
    'fgos-symlink-absolute',
    '---\nname: fgos-symlink-absolute\ndescription: Symlink absolute ref\n---\n',
    `# Symlink Absolute\nRead \`${path.join(alias, 'core', 'skills', '_shared', 'x.md').split(path.sep).join('/')}\`.\n`,
  );

  const outDir = mkTempDir('gemini-symlink-absolute-pkg-');
  generateGeminiSkillPackage(root, outDir);
  fs.rmSync(root, { recursive: true, force: true });
  fs.rmSync(alias, { force: true });

  const skillPath = path.join(outDir, 'skills', 'fgos-symlink-absolute', 'SKILL.md');
  const skillContent = fs.readFileSync(skillPath, 'utf8');
  assert.doesNotMatch(skillContent, /-alias\/core\/skills\/_shared\/x\.md/);
  const ref = skillContent.match(/`(\.\.\/_shared\/x\.md)`/);
  assert.ok(ref);
  assert.ok(fs.existsSync(path.resolve(path.dirname(skillPath), ref[1])));
});

test('generateGeminiSkillPackage rewrites Windows-native absolute canonical shared references', () => {
  const root = mkTempDir('gemini-windows-absolute-src-');
  const sharedDir = path.join(root, 'core', 'skills', '_shared');
  fs.mkdirSync(sharedDir, { recursive: true });
  fs.writeFileSync(path.join(sharedDir, 'x.md'), '# X\n');
  writeSkill(
    path.join(root, 'core', 'skills'),
    'fgos-windows-absolute',
    '---\nname: fgos-windows-absolute\ndescription: Windows absolute ref\n---\n',
    '# Windows Absolute\nRead `C:\\repo\\core\\skills\\_shared\\x.md`.\n',
  );

  const outDir = mkTempDir('gemini-windows-absolute-pkg-');
  generateGeminiSkillPackage(root, outDir);
  fs.rmSync(root, { recursive: true, force: true });

  const skillPath = path.join(outDir, 'skills', 'fgos-windows-absolute', 'SKILL.md');
  const skillContent = fs.readFileSync(skillPath, 'utf8');
  assert.doesNotMatch(skillContent, /C:\\repo\\core\\skills\\_shared\\x\.md/);
  const ref = skillContent.match(/`(\.\.\/_shared\/x\.md)`/);
  assert.ok(ref);
  assert.ok(fs.existsSync(path.resolve(path.dirname(skillPath), ref[1])));
});

test('generateGeminiSkillPackage rewrites forward-slash Windows drive absolute shared references', () => {
  const root = mkTempDir('gemini-windows-drive-slash-src-');
  const sharedDir = path.join(root, 'core', 'skills', '_shared');
  fs.mkdirSync(sharedDir, { recursive: true });
  fs.writeFileSync(path.join(sharedDir, 'x.md'), '# X\n');
  writeSkill(
    path.join(root, 'core', 'skills'),
    'fgos-windows-drive-slash',
    '---\nname: fgos-windows-drive-slash\ndescription: Windows drive slash ref\n---\n',
    '# Windows Drive Slash\nRead `C:/repo/core/skills/_shared/x.md`.\n',
  );

  const outDir = mkTempDir('gemini-windows-drive-slash-pkg-');
  generateGeminiSkillPackage(root, outDir);
  fs.rmSync(root, { recursive: true, force: true });

  const skillPath = path.join(outDir, 'skills', 'fgos-windows-drive-slash', 'SKILL.md');
  const skillContent = fs.readFileSync(skillPath, 'utf8');
  assert.doesNotMatch(skillContent, /C:\.\.\/_shared\/x\.md/);
  assert.doesNotMatch(skillContent, /C:\/repo\/core\/skills\/_shared\/x\.md/);
  const ref = skillContent.match(/`(\.\.\/_shared\/x\.md)`/);
  assert.ok(ref);
  assert.ok(fs.existsSync(path.resolve(path.dirname(skillPath), ref[1])));
});

test('generateGeminiSkillPackage rewrites UNC absolute canonical shared references', () => {
  const root = mkTempDir('gemini-unc-absolute-src-');
  const sharedDir = path.join(root, 'core', 'skills', '_shared');
  fs.mkdirSync(sharedDir, { recursive: true });
  fs.writeFileSync(path.join(sharedDir, 'x.md'), '# X\n');
  writeSkill(
    path.join(root, 'core', 'skills'),
    'fgos-unc-absolute',
    '---\nname: fgos-unc-absolute\ndescription: UNC ref\n---\n',
    '# UNC Absolute\nRead `\\\\server\\share\\core\\skills\\_shared\\x.md`.\n',
  );

  const outDir = mkTempDir('gemini-unc-absolute-pkg-');
  generateGeminiSkillPackage(root, outDir);
  fs.rmSync(root, { recursive: true, force: true });

  const skillPath = path.join(outDir, 'skills', 'fgos-unc-absolute', 'SKILL.md');
  const skillContent = fs.readFileSync(skillPath, 'utf8');
  assert.doesNotMatch(skillContent, /\\\\server\\share\\core\\skills\\_shared\\x\.md/);
  const ref = skillContent.match(/`(\.\.\/_shared\/x\.md)`/);
  assert.ok(ref);
  assert.ok(fs.existsSync(path.resolve(path.dirname(skillPath), ref[1])));
});

test('generateGeminiSkillPackage rewrites domain shared references with spaces in domain names', () => {
  const root = mkTempDir('gemini-space-domain-src-');
  writeSkill(
    path.join(root, 'domains', 'my domain', 'skills'),
    'fgos-demo',
    '---\nname: fgos-demo\ndescription: Demo\n---\n',
    '# Demo\nRead `../../../domains/my domain/skills/_shared/a.md`.\n',
  );
  const sharedDir = path.join(root, 'domains', 'my domain', 'skills', '_shared');
  fs.mkdirSync(sharedDir, { recursive: true });
  fs.writeFileSync(path.join(sharedDir, 'a.md'), '# A\n');

  const outDir = mkTempDir('gemini-space-domain-pkg-');
  generateGeminiSkillPackage(root, outDir);
  fs.rmSync(root, { recursive: true, force: true });

  const skillPath = path.join(outDir, 'skills', 'fgos-demo', 'SKILL.md');
  const skillContent = fs.readFileSync(skillPath, 'utf8');
  assert.doesNotMatch(skillContent, /domains\/my domain\/skills\/_shared/);
  const ref = skillContent.match(/`(\.\.\/_shared\/a\.md)`/);
  assert.ok(ref);
  assert.ok(fs.existsSync(path.resolve(path.dirname(skillPath), ref[1])));
});

// ─── P01: Code-Panel Multi-Cell Facade Contract & Discriminator Tests ───
// Reference model: mirrors the mode-selection rules and delegation invariants stated
// in domains/coding/skills/fgos-code-panel/SKILL.md prose; no runtime production code
// calls this — fgos-code-panel is read and followed by an LLM, not executed as this JS
// function (zero runtime callers exist anywhere in src/core/domains/bin per red-team C4
// and reviewer LOW-8). The test corpus is the contract; the regexes are an approximation
// that must be extended when the corpus grows.
//
// Scope Boundary & Limitations Note for Assertion 3 (Reviewer & Red-Team Consensus):
// This discriminator is a BEST-EFFORT LINT that catches naive/accidental duplication
// (verbatim or near-verbatim copies using plan-loop's own anchor phrasing) -- it is NOT
// a comprehensive security boundary against a deliberate, adversarial rewrite, which
// only human code review can reliably catch. This is the accepted, documented scope
// boundary for Assertion 3, not a gap to keep closing.

export class PhaseSelectionMismatchError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PhaseSelectionMismatchError';
  }
}

export class AmbiguousIntentError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AmbiguousIntentError';
  }
}

export class RecursiveDispatchError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RecursiveDispatchError';
  }
}

export function resolveTrackNameToPlanPath(trackName, repoRoot = path.resolve(fileURLToPath(import.meta.url), '../../..')) {
  if (!trackName || typeof trackName !== 'string') return null;
  const trimmed = trackName.trim();
  if (!trimmed) return null;

  const plansDir = path.join(repoRoot, 'plans');
  if (!fs.existsSync(plansDir)) return null;

  try {
    const entries = fs.readdirSync(plansDir, { withFileTypes: true });
    const matchingPlans = [];

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name === 'reports') continue;
      const planFile = path.join(plansDir, entry.name, 'plan.md');
      if (!fs.existsSync(planFile)) continue;

      const content = fs.readFileSync(planFile, 'utf8');
      const lines = content.split('\n').slice(0, 40);
      for (const line of lines) {
        const m = line.match(/^\s*(?:\*\*)?(?:Track|Execution track):(?:\*\*)?\s*`?([a-zA-Z0-9_-]+)`?/i);
        if (m && m[1] === trimmed) {
          matchingPlans.push(path.relative(repoRoot, planFile).split(path.sep).join('/'));
          break;
        }
      }
    }

    // Only return when there is a genuinely UNIQUE, EXACT match against a real plan's Track header
    if (matchingPlans.length === 1) {
      return matchingPlans[0];
    }
    // Ambiguous (multiple matches) or no match -> return null (no suffix/substring guessing)
    return null;
  } catch {
    return null;
  }
}

function hasLiveCoordinationSession(trackName, repoRoot = path.resolve(fileURLToPath(import.meta.url), '../../..'), options = {}) {
  if (typeof options.hasLiveSession === 'function') {
    return Boolean(options.hasLiveSession(trackName));
  }
  try {
    const sessionsDir = options.sessionsDir || (() => {
      const mainCheckout = resolveMainCheckoutRoot(repoRoot) || repoRoot;
      const fgosDir = fgosDirFromRoot(mainCheckout);
      return path.join(fgosDir, 'coordination', 'sessions');
    })();
    if (!fs.existsSync(sessionsDir)) return false;
    const prefix = `${trackName}--`;
    const entries = fs.readdirSync(sessionsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith(prefix)) {
        const remainder = entry.name.slice(prefix.length);
        if (remainder !== '' && !remainder.includes('--')) {
          return true;
        }
      }
    }
    return false;
  } catch {
    return false;
  }
}

function phasesMatch(p1, p2) {
  if (!p1 || !p2) return false;
  if (p1 === p2) return true;
  const norm1 = p1.toLowerCase();
  const norm2 = p2.toLowerCase();
  if (norm1 === norm2) return true;
  const prefix1 = norm1.match(/^(phase-\d+[a-z]?)/)?.[1];
  const prefix2 = norm2.match(/^(phase-\d+[a-z]?)/)?.[1];
  if (prefix1 && prefix2 && prefix1 === prefix2) return true;
  return norm1.startsWith(norm2 + '-') || norm2.startsWith(norm1 + '-');
}

export function classifyCodePanelRequest(request, options = {}) {
  const repoRoot = options.repoRoot || path.resolve(fileURLToPath(import.meta.url), '../../..');
  const trimmed = request.trim();

  // 1. Recursive dispatch detection (R2):
  // Note: FGOS_COORDINATION_ID is a documented, not-yet-wired invariant at runtime
  // (no producer currently sets it in src/ or runner adapters). The functional signals
  // are options.inPlanLoop, options.coordinationId, and options.workRef.
  // Trim whitespace so trailing newlines/spaces (e.g. from echo/file) do not bypass the guard (NEW-7).
  const rawCoordinationId = options.coordinationId || process.env.FGOS_COORDINATION_ID || '';
  const coordinationId = typeof rawCoordinationId === 'string' ? rawCoordinationId.trim() : '';
  const rawWorkRef = options.workRef || '';
  const workRef = typeof rawWorkRef === 'string' ? rawWorkRef.trim() : '';
  const cellIdPattern = /.+--[a-zA-Z0-9_-]+$/;
  const inPlanLoop = Boolean(
    options.inPlanLoop ||
    (coordinationId && cellIdPattern.test(coordinationId)) ||
    (workRef && cellIdPattern.test(workRef))
  );

  // 2. Imperative mood check (M1 & Anti-guessing & NEW-9 / R-M3 & reviewer F-2):
  // Detect hedges, questions, conditionals, and past-tense descriptions DIRECTED AT running a plan/track.
  // Conditionals/hedges are detected at clause level (leading or trailing, comma or not).
  // Gate on explicit track syntax, never a bare \btrack\b substring (F-2).
  const clauses = trimmed.split(/(?<=[.!?;])\s+|\n+/);
  for (const clause of clauses) {
    const c = clause.trim();
    const hasPlanOrTrack = /(?:plans\/|[^\s,;]*(?:plan|phase-\d+[^\s,;]*)\.md|(?:run|resume|execute|ran|resumed|executed)\s+(?:the\s+)?[\w-]+\s+track\b|(?:run|resume|execute|ran|resumed|executed)\s+track\s+|open\s+(?:the\s+next\s+cell\s+for\s+)[\w-]+|(?:run|resume|execute|ran|resumed|executed)\s+phase-\d+\S*\s+of\s+)/i.test(c);
    if (!hasPlanOrTrack) continue;

    const hasRunVerb = /\b(?:run|resume|execute|open)\b/i.test(c);
    const hasPastTense = /\b(?:I|we)\s+(?:ran|executed|resumed)\b/i.test(c);
    const hasSpeculative = /\b(?:maybe|perhaps)\b/i.test(c);

    if (!hasRunVerb && !hasPastTense && !hasSpeculative) continue;

    const hasConditional = /\b(?:if|unless|in\s+case|provided|assuming)\b/i.test(c);
    const hasHedge = /\b(?:should|would|could|might|can|shall|may|wonder\s+if)\b/i.test(c);
    const hasQuestion = /\?/.test(c);

    if (hasConditional || hasHedge || hasQuestion || hasPastTense || hasSpeculative) {
      throw new AmbiguousIntentError(
        'Imperative, unconditional instruction required; questions, conditionals, past-tense descriptions, and speculative directives do not trigger planned mode'
      );
    }
  }

  // 3. Negation honored (CE2 & R-H1 / NEW-2 / reviewer F-1):
  // Negation directed at running a plan or track must be handled before verb matching.
  // Covers path negation, track-by-name negation, and phase-of-track / phase-of-path negation (F-1).
  const negationOnPlanMatch =
    trimmed.match(/\b(?:don't|do not|never)\s+(?:run|resume|execute)\s+(?:phase-\d+\S*\s+of\s+(?:the\s+)?(?:track\s+)?)?(?:the\s+)?([a-zA-Z0-9_-]+)\s+track\b/i) ||
    trimmed.match(/\b(?:don't|do not|never)\s+(?:run|resume|execute)\s+(?:phase-\d+\S*\s+of\s+(?:the\s+)?(?:track\s+)?)?track\s+([a-zA-Z0-9_-]+)/i) ||
    trimmed.match(/\b(?:don't|do not|never)\s+open\s+(?:the\s+next\s+cell\s+for\s+)([a-zA-Z0-9_-]+)/i) ||
    trimmed.match(/\b(?:don't|do not|never)\s+(?:run|resume|execute)\s+(?:phase-\d+\S*\s+of\s+(?:the\s+)?(?:track\s+)?)?(?:(?:this\s+)?(?:implementation\s+)?(?:plan|track)?(?::\s*|\s+))?((?:\.\/)?[^\s,;]+\.md)/i) ||
    trimmed.match(/\b(?:don't|do not|never)\s+(?:run|resume|execute)\s+(?:phase-\d+\S*\s+of\s+(?:the\s+)?(?:track\s+)?)?(?:the\s+)?([^\s,;]+(?:\.md|\btrack\b|[a-zA-Z0-9_-]+[-/]plan\.md))/i) ||
    trimmed.match(/\b(?:don't|do not|never)\s+(?:run|resume|execute)\s+(?:phase-\d+\S*)\s+of\s+/i);
  if (negationOnPlanMatch) {
    // Look for affirmative alternative target
    const altTargetMatch = trimmed.match(
      /\b(?:just\s+|instead\s+)?(?:fix|edit|modify|update|refactor|work\s+on)\s+(?:the\s+bug\s+in\s+)?([^\s,;]+)/i
    );
    if (altTargetMatch) {
      let target = altTargetMatch[1].replace(/[.,;]+$/, '');
      return { mode: 'direct-single-cell', target, ...(inPlanLoop ? { guarded: true } : {}) };
    }
    // No explicit alternate target: never fabricate 'src/auth.mjs'
    throw new AmbiguousIntentError(
      'Negation detected on plan/track with no explicit alternate target; clarification required'
    );
  }

  // 4. Passing citation without execution verb (Finding F2 / RT-01):
  const passingCitationMatch = trimmed.match(/fix\s+(?:the\s+)?bug\s+described\s+in\s+([^\s,;]+\.md)/i);
  if (passingCitationMatch) {
    return { mode: 'direct-single-cell', target: passingCitationMatch[1], role: 'passing-citation', ...(inPlanLoop ? { guarded: true } : {}) };
  }

  // 5. Plan file as edit target (Finding A1):
  const editMatch = trimmed.match(/\b(?:fix\s+(?:the\s+)?(?:typo|bug|spelling|error)\s+in|edit|modify|update)\s+([^\s,;]+plan\.md|[^\s,;]+phase-[^\s,;]+\.md)/i);
  if (editMatch) {
    return { mode: 'direct-single-cell', target: editMatch[1], role: 'edit-target', ...(inPlanLoop ? { guarded: true } : {}) };
  }

  // 6. Verb directed at another object, plan is context (Finding A2):
  const testsAgainstMatch = trimmed.match(/run\s+(?:the\s+)?(?:focused\s+)?tests?\s+(?:listed\s+in\s+)?([^\s,;]+\.md)\s+against\s+([^\s,;]+)/i);
  if (testsAgainstMatch) {
    return { mode: 'direct-single-cell', target: testsAgainstMatch[2], context: testsAgainstMatch[1], ...(inPlanLoop ? { guarded: true } : {}) };
  }
  const resumeWorkMatch = trimmed.match(/resume\s+(?:my\s+)?work\s+on\s+([^\s,;]+),\s*context\s+in\s+([^\s,;]+\.md)/i);
  if (resumeWorkMatch) {
    return { mode: 'direct-single-cell', target: resumeWorkMatch[1], context: resumeWorkMatch[2], ...(inPlanLoop ? { guarded: true } : {}) };
  }

  // 7. Phase path target interaction with chain (CE3 & NEW-10):
  const phaseTargetMatch = trimmed.match(
    /(?:run|resume|execute)\s+(phase-\d+[^,\s]*)\s+of\s+(?:the\s+)?(?:track\s+)?([^\s,;]+(?:\s+track)?)/i
  );
  if (phaseTargetMatch) {
    if (inPlanLoop) {
      throw new RecursiveDispatchError(
        'Recursive dispatch refused: fgos-code-panel cannot open a nested planned-multi-cell track from within an active plan-loop cell'
      );
    }
    const namedPhase = phaseTargetMatch[1];
    let rawTarget = phaseTargetMatch[2].trim().replace(/\s+track$/i, '').replace(/^track\s+/i, '');

    let planPath;
    let track;

    if (rawTarget.includes('/') || rawTarget.endsWith('.md')) {
      planPath = rawTarget.replace(/^\.\//, '');
    } else {
      track = rawTarget;
      const resolved = resolveTrackNameToPlanPath(track, repoRoot);
      if (!resolved) {
        throw new AmbiguousIntentError(`Cannot resolve bare track name "${track}" to a plan.md`);
      }
      planPath = resolved;
    }

    if (options.nextUnmergedPhase && !phasesMatch(namedPhase, options.nextUnmergedPhase)) {
      throw new PhaseSelectionMismatchError(
        `Phase selection mismatch: request asked for ${namedPhase} but chain's next unmerged cell is ${options.nextUnmergedPhase}`
      );
    }
    return { mode: 'planned-multi-cell', planPath, phase: namedPhase, ...(track ? { track } : {}) };
  }

  // 8. Explicit run/resume/execute directed AT plan/phase path (C1 & M4 & CE5 / NEW-8 / R-M2):
  // Handles single or multiple spaces, colons, and takes precedence over secondary inspection phrases.
  // CE5: Restricts to plans/ directory or plan.md/phase-NN-*.md shaped files.
  const explicitRunPlanMatch = trimmed.match(
    /\b(?:run|resume|execute)\s+(?:(?:this\s+)?(?:implementation\s+)?(?:plan|track)?(?::\s*|\s+))?((?:\.\/)?(?:plans\/[^\s,;]+|[^\s,;]*(?:plan|phase-\d+[^\s,;]*)\.md))[.,]?/i
  );
  if (explicitRunPlanMatch) {
    if (inPlanLoop) {
      throw new RecursiveDispatchError(
        'Recursive dispatch refused: fgos-code-panel cannot open a nested planned-multi-cell track from within an active plan-loop cell'
      );
    }
    const cleanPath = explicitRunPlanMatch[1].replace(/^\.\//, '');
    return { mode: 'planned-multi-cell', planPath: cleanPath };
  }

  // 9. Non-execution / Inspection verbs at plan (CE4):
  const inspectionMatch = trimmed.match(/\b(review|explain|summarize|inspect|read)\s+(?:the\s+)?([^\s,;]+\.md)/i);
  if (inspectionMatch) {
    return { mode: 'direct-single-cell', target: inspectionMatch[2], role: 'inspection', ...(inPlanLoop ? { guarded: true } : {}) };
  }

  // 10. Bare plan or phase path as execution target (M1):
  const normalizedBare = trimmed.replace(/^\.\//, '');
  if (/^plans\/[^\s,;]+\/(?:plan\.md|phase-[^\s,;]+\.md)$/i.test(normalizedBare)) {
    if (inPlanLoop) {
      throw new RecursiveDispatchError(
        'Recursive dispatch refused: fgos-code-panel cannot open a nested planned-multi-cell track from within an active plan-loop cell'
      );
    }
    return { mode: 'planned-multi-cell', planPath: normalizedBare };
  }

  // 11. Track referenced by name without path (CE1 + C2 + H1 + M3):
  // Check for explicit track syntax: e.g. "resume the foo track", "open the next cell for bar", "resume track baz"
  const explicitTrackMatch =
    trimmed.match(/(?:run|resume|execute)\s+(?:the\s+)?([a-zA-Z0-9_-]+)\s+track\b/i) ||
    trimmed.match(/open\s+(?:the\s+next\s+cell\s+for\s+)([a-zA-Z0-9_-]+)/i) ||
    trimmed.match(/(?:run|resume|execute)\s+track\s+([a-zA-Z0-9_-]+)/i);

  if (explicitTrackMatch) {
    const candidate = explicitTrackMatch[1];
    const resolvedPath = resolveTrackNameToPlanPath(candidate, repoRoot);
    const hasLiveSession = typeof options.hasLiveSession === 'function'
      ? options.hasLiveSession(candidate)
      : hasLiveCoordinationSession(candidate, repoRoot, options);

    if (inPlanLoop) {
      throw new RecursiveDispatchError(
        'Recursive dispatch refused: fgos-code-panel cannot open a nested planned-multi-cell track from within an active plan-loop cell'
      );
    }

    if (resolvedPath || hasLiveSession) {
      return {
        mode: 'planned-multi-cell',
        track: candidate,
        ...(resolvedPath ? { planPath: resolvedPath } : {}),
      };
    }

    // Unresolvable bare track name: refuse, never guess
    throw new AmbiguousIntentError(`Cannot resolve bare track name "${candidate}" to a plan.md or live coordination session`);
  }

  // 12. Direct code change requests (default):
  const targetMatch =
    trimmed.match(/\bin\s+([^\s,;]+)/i) ||
    trimmed.match(/(?:for|on)\s+([^\s,;]+)/i) ||
    trimmed.match(/\b(?:fix|refactor|update|edit|modify)\s+(?:(?:the\s+)?(?:bug|flaky\s+retry|assertion|typo)\s+in\s+)?([^\s,;]+)/i) ||
    trimmed.match(/\bopen\s+([^\s,;]+)/i);
  const target = targetMatch ? targetMatch[1].replace(/[.,;]+$/, '') : undefined;
  return {
    mode: 'direct-single-cell',
    ...(target ? { target } : {}),
    ...(inPlanLoop ? { guarded: true } : {})
  };
}

export function validateCodePanelNoPlanLoopDuplication(skillContent) {
  function isNegativeInstruction(text) {
    return /\b(?:do\s+not|don't|never|must\s+not|cannot|no\s+multi-cell|should\s+not|not\s+to|not\s+execute|not\s+contain)\b/i.test(text);
  }

  // 1. Multi-step orchestration sequence check across entire document:
  const orchestrationSequencePattern =
    /(?:coordination\s+chain|chain\s+<track>)[\s\S]{1,600}(?:open\.json|create\s+(?:the\s+)?cell\s+worktree)[\s\S]{1,600}(?:disposition|fix\s+round)[\s\S]{1,800}(?:git\s+merge|close\.json|append\s+one\s+row\s+to\s+plan\.md)[\s\S]{1,400}(?:back\s+to\s+step|repeat|next\s+cell)/i;
  if (orchestrationSequencePattern.test(skillContent)) {
    return {
      pass: false,
      reason: 'Detected multi-step multi-cell orchestration loop sequence resembling fgos-plan-loop Section 5',
    };
  }

  // 2. Specific evasion checks against affirmative statements
  // Split on statement boundaries including newlines and semicolons (NEW-5, D-1)
  const statements = skillContent
    .split(/(?<=[.!?])\s+|\n+|;\s*/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const stmt of statements) {
    if (isNegativeInstruction(stmt)) {
      continue;
    }

    // E1: Affirmative prose multi-cell sequencing loop restatement
    const proseLoopPattern =
      /(?:repeat (?:this|the|these)?\s*(?:process|steps|procedure)?\s*(?:for|until)\s*(?:all|each|every)\s*(?:cell|phase)|proceed to (?:the\s+)?next cell and repeat|drive (?:each|every|all)\s+(?:cell|phase) to (?:completion|the end)|run every cell to the end|advance to (?:the\s+)?next cell until (?:all|each)|repeat steps? \d+ (?:through|to) \d+ for (?:each|every) cell|open (?:the\s+)?(?:following|next) cell (?:and|yourself and) (?:continue|repeat)|continue in the same way until no unmerged)/i;
    if (proseLoopPattern.test(stmt)) {
      return {
        pass: false,
        reason: 'Detected prose-only multi-cell sequencing loop restatement (E1)',
      };
    }

    // E2: Affirmative tail self-reinvocation across cells
    const tailReinvocationPattern =
      /(?:(?:re-?invoke|call|run|start)\s+(?:fgos-)?code-panel\s+(?:again\s+|over\s+)?(?:for|on|until)\s+(?:the\s+)?(?:next|following)\s+(?:cell|phase)|tail-?call\s+fgos-code-panel|start\s+fgos-code-panel\s+over)/i;
    if (tailReinvocationPattern.test(stmt)) {
      return {
        pass: false,
        reason: 'Detected tail self-reinvocation across cells (E2)',
      };
    }

    // E4: Affirmative iteration over plan.md Cell-status table rows
    const cellStatusLoopPattern =
      /(?:loop|iterate|for\s+each|walk)\s+(?:over|through|in)?\s*(?:each\s+row\s+in\s+)?(?:the\s+)?(?:plan(?:\.md)?(?:'s)?\s+)?(?:Cell-status|cell-status|Product Gates|cell status)\s+(?:table|rows)/i;
    if (cellStatusLoopPattern.test(stmt)) {
      return {
        pass: false,
        reason: 'Detected loop iterating over plan.md Cell-status table rows (E4)',
      };
    }
  }

  // E3: Inlined shared fragment content (unquoted top-level content, not citations)
  // Only strip double-quoted spans (NEW-6); never single apostrophes, which collide with contractions/possessives
  const unquotedContent = skillContent.replace(/["\u201c][^"\u201d]*["\u201d]/g, '');
  const inlinedFragmentSignature =
    /(?:Naming is deterministic so `?git worktree list`? reads as an inventory|If `?worktree remove`? refuses because the tree is dirty, read the dirt first)/;
  if (inlinedFragmentSignature.test(unquotedContent)) {
    return {
      pass: false,
      reason: 'Detected inlined _shared fragment content instead of reference by pointer (E3)',
    };
  }

  // 3. Structural check on planned-multi-cell / track execution section
  const sections = skillContent.split(/\n(?=#{2,3}\s+)/);
  for (const section of sections) {
    const headMatch = section.match(/^#{2,3}\s+([^\n]+)/);
    if (!headMatch) continue;
    const heading = headMatch[1].trim();
    if (!/(?:Planned[- ](?:multi[- ]cell\s+)?mode|Track\s+mode|Multi[- ]cell\s+mode|Unattended\s+track)/i.test(heading)) {
      continue;
    }

    const sectionBody = section.slice(headMatch[0].length).trim();
    const lines = sectionBody.split('\n').filter((l) => l.trim().length > 0);

    // (a) Bounded length: delegation block must stay short (<= 40 non-empty lines)
    if (lines.length > 40) {
      return {
        pass: false,
        reason: `Planned/track mode section "${heading}" exceeds length ceiling (${lines.length} lines > 40 lines); must be a concise delegation block, not an orchestration procedure`,
      };
    }

    // (b) Hand-off reference: must contain explicit delegation reference naming fgos-plan-loop
    if (!/fgos-plan-loop/i.test(sectionBody)) {
      return {
        pass: false,
        reason: `Planned/track mode section "${heading}" lacks explicit delegation reference to fgos-plan-loop`,
      };
    }

    // (c) Must NOT contain its own multi-step numbered orchestration procedure
    const numberedSteps = sectionBody.match(/^\s*\d+\.\s+[^\n]+/gm) || [];
    if (numberedSteps.length >= 4) {
      return {
        pass: false,
        reason: `Planned/track mode section "${heading}" contains multi-step numbered orchestration procedure (${numberedSteps.length} steps); must delegate to fgos-plan-loop rather than prescribing multi-cell steps`,
      };
    }
  }

  // 4. Verbatim-overlap check against fgos-plan-loop's real Section 5 body
  // (red-team V-1/V-3, op_032): a byte-identical or near-verbatim copy of
  // the real orchestration loop text evades checks 1-3 whenever it sits
  // under a heading outside the section-3 allowlist, or under no heading
  // at all. This is NOT a rewrite (zero synonyms, zero restructuring) --
  // squarely inside what this discriminator's own limitations note (p01.md
  // section 3) promises to catch ("verbatim or near-verbatim copies using
  // fgos-plan-loop's own anchor phrasing"), so it must be caught regardless
  // of heading/section placement, not just within the structural check's
  // own heading-gated scope. Deterministic line-overlap, not a heading or
  // keyword match: >=3 identical substantive lines (>=30 chars each) is
  // the threshold verified by red-team (canonical domains/coding/skills/
  // fgos-code-panel/SKILL.md shares 0/69 substantive lines with the real
  // Section 5 body; a verbatim copy shares 68/69).
  try {
    const repoRootForOverlap = path.resolve(fileURLToPath(import.meta.url), '../../..');
    const planLoopSkill = fs.readFileSync(
      path.join(repoRootForOverlap, 'core', 'skills', 'fgos-plan-loop', 'SKILL.md'),
      'utf8'
    );
    const section5Match = planLoopSkill.match(/\n##\s+5\.[^\n]*\n([\s\S]*?)(?=\n##\s+\d|\n#\s+|$)/);
    if (section5Match) {
      const section5Lines = new Set(
        section5Match[1]
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l.length >= 30)
      );
      const candidateLines = skillContent
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length >= 30);
      const overlapCount = candidateLines.filter((l) => section5Lines.has(l)).length;
      if (overlapCount >= 3) {
        return {
          pass: false,
          reason: `Detected ${overlapCount} substantive lines verbatim-identical to fgos-plan-loop's real Section 5 orchestration loop body -- a byte-identical or near-verbatim copy, regardless of heading or section placement`,
        };
      }
    }
  } catch {
    // core/skills/fgos-plan-loop/SKILL.md unreadable in this environment:
    // fail open on THIS check only (checks 1-3 above still ran) rather than
    // throwing out of a pure validator on an environment/path issue.
  }

  return { pass: true };
}

// Tests for Assertion 3: No-Duplication Discriminator & Adversarial Corpus
test('Assertion 3 Discriminator: canonical domains/coding/skills/fgos-code-panel/SKILL.md passes cleanly', () => {
  const repoRoot = path.resolve(fileURLToPath(import.meta.url), '../../..');
  const skillContent = fs.readFileSync(
    path.join(repoRoot, 'domains', 'coding', 'skills', 'fgos-code-panel', 'SKILL.md'),
    'utf8'
  );
  const result = validateCodePanelNoPlanLoopDuplication(skillContent);
  assert.equal(result.pass, true, `Expected canonical skill to pass discriminator, but got: ${result.reason}`);
});

test('Assertion 3 Discriminator: verbatim fgos-plan-loop Section 5 body is caught regardless of heading (V-1/V-3, red-team op_032)', () => {
  const repoRoot = path.resolve(fileURLToPath(import.meta.url), '../../..');
  const planLoopSkill = fs.readFileSync(
    path.join(repoRoot, 'core', 'skills', 'fgos-plan-loop', 'SKILL.md'),
    'utf8'
  );
  const section5Match = planLoopSkill.match(/\n##\s+5\.[^\n]*\n([\s\S]*?)(?=\n##\s+\d|\n#\s+|$)/);
  assert.ok(section5Match, 'Section 5 must be found in fgos-plan-loop SKILL.md');
  const body = section5Match[1];

  // V-1: verbatim body under a heading outside the structural check's own allowlist
  const v1 = validateCodePanelNoPlanLoopDuplication('# fgos-code-panel\n## Execution details\n' + body);
  assert.equal(v1.pass, false, 'verbatim Section 5 body under a non-allowlisted heading must be caught');

  // V-3: verbatim body appended with no heading at all
  const canonical = fs.readFileSync(
    path.join(repoRoot, 'domains', 'coding', 'skills', 'fgos-code-panel', 'SKILL.md'),
    'utf8'
  );
  const v3 = validateCodePanelNoPlanLoopDuplication(canonical + '\n\n' + body);
  assert.equal(v3.pass, false, 'verbatim Section 5 body with no heading at all must be caught');
});

test('Assertion 3 Discriminator: passes cleanly on baseline unmodified fgos-code-panel without planned section', () => {
  const sampleBaseline = `---
name: fgos-code-panel
---
# fgos-code-panel
## Non-Goals
- No multi-cell track. A request that references a multi-cell plan.md/phase-NN track is a fgos-plan-loop track; this skill is one cell.
## 1. Open the cell
open.json
## 3. Fix round (fix-1.json)
Repeat with fix-2.json, fix-3.json... (new authorizationId/invocationKey values each time) if a recheck itself surfaces a new accepted finding.
## 4. Close
disposition: "cell-closed"
`;
  const result = validateCodePanelNoPlanLoopDuplication(sampleBaseline);
  assert.equal(result.pass, true);
});

test('Assertion 3 Adversarial Evasion E1: detects and rejects prose-only multi-cell sequencing loop', () => {
  const evasiveContent = `---
name: fgos-code-panel
---
# fgos-code-panel
## Planned-multi-cell mode
To execute the track: drive each cell to completion, then repeat this process for all cells until each cell is closed.
`;
  const result = validateCodePanelNoPlanLoopDuplication(evasiveContent);
  assert.equal(result.pass, false);
  assert.match(result.reason, /prose-only multi-cell sequencing loop/);
});

test('Assertion 3 Adversarial Evasion E2: detects and rejects tail self-reinvocation across cells', () => {
  const evasiveContent = `---
name: fgos-code-panel
---
# fgos-code-panel
## 4. Close
After the cell closes, re-invoke fgos-code-panel on the next cell until the entire plan is finished.
`;
  const result = validateCodePanelNoPlanLoopDuplication(evasiveContent);
  assert.equal(result.pass, false);
  assert.match(result.reason, /tail self-reinvocation/);
});

test('Assertion 3 Adversarial Evasion E3: detects and rejects inlining shared fragment prose', () => {
  const evasiveContent = `---
name: fgos-code-panel
---
# fgos-code-panel
## 0. Private branch and worktree
Naming is deterministic so \`git worktree list\` reads as an inventory: directory ../<prefix>-<slug>.
`;
  const result = validateCodePanelNoPlanLoopDuplication(evasiveContent);
  assert.equal(result.pass, false);
  assert.match(result.reason, /inlined _shared fragment content/);
});

test('Assertion 3 Adversarial Evasion E4: detects and rejects looping over plan.md Cell-status table rows', () => {
  const evasiveContent = `---
name: fgos-code-panel
---
# fgos-code-panel
## Planned-multi-cell mode
Loop over the plan's Cell-status table rows, executing each unmerged phase until finished.
`;
  const result = validateCodePanelNoPlanLoopDuplication(evasiveContent);
  assert.equal(result.pass, false);
  assert.match(result.reason, /loop iterating over plan\.md Cell-status table rows/);
});

test('Assertion 3 Discriminator: detects and rejects copying fgos-plan-loop Section 5 loop verbatim', () => {
  const repoRoot = path.resolve(fileURLToPath(import.meta.url), '../../..');
  const planLoopContent = fs.readFileSync(
    path.join(repoRoot, 'core', 'skills', 'fgos-plan-loop', 'SKILL.md'),
    'utf8'
  );
  const section5Match = planLoopContent.match(/## 5\. Unattended track mode[\s\S]*?(?=\n## |\n---|$)/);
  assert.ok(section5Match);
  const pastedSkill = `---
name: fgos-code-panel
---
# fgos-code-panel
${section5Match[0]}
`;
  const result = validateCodePanelNoPlanLoopDuplication(pastedSkill);
  assert.equal(result.pass, false, 'Copying Section 5 from plan-loop into code-panel must fail');
});

test('Assertion 3 Discriminator (Red-Team Probes): catches evasions under altered headings and paraphrases', () => {
  const repoRoot = path.resolve(fileURLToPath(import.meta.url), '../../..');
  const planLoopContent = fs.readFileSync(
    path.join(repoRoot, 'core', 'skills', 'fgos-plan-loop', 'SKILL.md'),
    'utf8'
  );
  const section5Body = planLoopContent.match(/## 5\. Unattended track mode[^\n]*\n([\s\S]*?)(?=\n## |\n---|$)/)[1];

  // EV-A: verbatim Section 5 body with heading removed under ## Track mode
  const evA = `---
name: fgos-code-panel
---
# fgos-code-panel
## Track mode
${section5Body}`;
  assert.equal(validateCodePanelNoPlanLoopDuplication(evA).pass, false, 'EV-A must fail');

  // EV-C: 25-line paraphrase of Section 5 under ## Track mode with no fgos-plan-loop reference
  const evC = `---
name: fgos-code-panel
---
# fgos-code-panel
## Track mode
1. Run coordination chain <track> to see open cells.
2. If activeCell is open, resume it; otherwise find the lowest unmerged phase.
3. Create the cell worktree and write open.json.
4. Verify the commit and focused test in the worktree.
5. Disposition findings: accepted, rejected, deferred.
6. Record disposition and close.json, merge the cell branch into track branch.
7. Back to step 1 until all phases in plan.md are merged.`;
  assert.equal(validateCodePanelNoPlanLoopDuplication(evC).pass, false, 'EV-C must fail');

  // EV-D: start fgos-code-panel over for following phase
  const evD = `---
name: fgos-code-panel
---
# fgos-code-panel
## 4. Close
When the cell closes, start fgos-code-panel over for the following phase until plan.md has no open phases.`;
  assert.equal(validateCodePanelNoPlanLoopDuplication(evD).pass, false, 'EV-D must fail');

  // EV-E: Walk plan.md's Cell status table
  const evE = `---
name: fgos-code-panel
---
# fgos-code-panel
## Execution
Walk plan.md's Cell status table top to bottom; for every row that is not merged, open that phase's cell before moving to the next row.`;
  assert.equal(validateCodePanelNoPlanLoopDuplication(evE).pass, false, 'EV-E must fail');

  // NEW-5: Leading negation clause shielding an affirmative loop after a semicolon
  const evNegShield = `# Title\nDo not skip verification; repeat this process for every cell until all are closed.`;
  assert.equal(validateCodePanelNoPlanLoopDuplication(evNegShield).pass, false, 'NEW-5 negation shield must fail');

  // NEW-6: Inlined fragment with contractions / apostrophes in surrounding prose
  const evContraction = `Read the plan's header first. Naming is deterministic so \`git worktree list\` reads as an inventory: ... That's the rule.`;
  assert.equal(validateCodePanelNoPlanLoopDuplication(evContraction).pass, false, 'NEW-6 contraction probe must fail');

  // D-1 (op_030 red-team): Negative bullet line shielding affirmative loop bullets without blank line/punctuation
  const evD1_1 = `- Never fork the engine\n- Repeat this process for every cell until all are closed`;
  assert.equal(validateCodePanelNoPlanLoopDuplication(evD1_1).pass, false, 'D-1 evasion 1 must fail');

  const evD1_2 = `# Do not fork\nRepeat this process for every cell until all are closed`;
  assert.equal(validateCodePanelNoPlanLoopDuplication(evD1_2).pass, false, 'D-1 evasion 2 must fail');

  const evD1_3 = `- Do not merge yourself\n- Re-invoke fgos-code-panel for the next cell until the plan is finished`;
  assert.equal(validateCodePanelNoPlanLoopDuplication(evD1_3).pass, false, 'D-1 evasion 3 must fail');

  const evD1_4 = `- Never guess the phase\n- Iterate over the plan.md Cell-status table rows and open each unmerged one`;
  assert.equal(validateCodePanelNoPlanLoopDuplication(evD1_4).pass, false, 'D-1 evasion 4 must fail');
});

test('Assertion 3 False-Positive Guards F1-F4 & H4: discriminator passes legitimate patterns cleanly', () => {
  // F1: 'loop' in proper noun 'fgos-plan-loop'
  const f1Content = `# Title\nDelegates execution to fgos-plan-loop by reference.`;
  assert.equal(validateCodePanelNoPlanLoopDuplication(f1Content).pass, true);

  // F2: Legitimate negative instructions
  const f2Content = `# Title\nNo multi-cell track. Never reimplement the plan loop. Do NOT loop over cells.`;
  assert.equal(validateCodePanelNoPlanLoopDuplication(f2Content).pass, true);

  // F3: Worked-example text for single-cell fix rounds
  const f3Content = `# Title\nRepeat with fix-2.json, fix-3.json... (new authorizationId/invocationKey values each time) if a recheck itself surfaces a new accepted finding.`;
  assert.equal(validateCodePanelNoPlanLoopDuplication(f3Content).pass, true);

  // F4: Single-cell coordination tokens used once
  const f4Content = `# Title\nUse open.json, authorize, disposition: "cell-closed", close.json once per cell.`;
  assert.equal(validateCodePanelNoPlanLoopDuplication(f4Content).pass, true);

  // H4-1: Negative instruction with repeat steps
  const h4_1 = `# Title\nDo not repeat these steps for every cell -- that loop is fgos-plan-loop's job.`;
  assert.equal(validateCodePanelNoPlanLoopDuplication(h4_1).pass, true);

  // H4-2: Negative instruction with iterate over cell-status table
  const h4_2 = `# Title\nNever iterate over the plan.md Cell-status table yourself; hand off to fgos-plan-loop.`;
  assert.equal(validateCodePanelNoPlanLoopDuplication(h4_2).pass, true);

  // H4-3: Negative instruction with tail-call
  const h4_3 = `# Title\nDo not tail-call fgos-code-panel for the next cell.`;
  assert.equal(validateCodePanelNoPlanLoopDuplication(h4_3).pass, true);

  // H4-4: Citing fragment in quotes
  const h4_4 = `# Title\nCiting the paragraph beginning "Naming is deterministic so \`git worktree list\` reads as an inventory" in the report.`;
  assert.equal(validateCodePanelNoPlanLoopDuplication(h4_4).pass, true);

  // D-1 (op_030 red-team): Legitimate multi-line wrapped negative bullet must not over-trigger
  const d1Legit = `# T\n- Never iterate over the plan.md Cell-status table yourself;\n  hand off to fgos-plan-loop instead\n- Do not repeat these steps for every cell\n`;
  assert.equal(validateCodePanelNoPlanLoopDuplication(d1Legit).pass, true, 'D-1 legitimate wrapped negative bullet must pass');
});

test('Assertion 3 Structural Guard: rejects planned-multi-cell section without fgos-plan-loop delegation reference or exceeding length', () => {
  const missingRef = `---
name: fgos-code-panel
---
# fgos-code-panel
## Planned-multi-cell mode
This handles multi-cell plans directly without delegating anywhere.
`;
  assert.equal(validateCodePanelNoPlanLoopDuplication(missingRef).pass, false);

  const bloatedSection = `---
name: fgos-code-panel
---
# fgos-code-panel
## Planned-multi-cell mode
Delegates to fgos-plan-loop.
${Array(45).fill('A detailed step instruction that inflates the section beyond the length ceiling.').join('\n')}
`;
  assert.equal(validateCodePanelNoPlanLoopDuplication(bloatedSection).pass, false);
});

// ─── Assertion 2: Delegation Boundary Tests (p00.md Section 3) ───
// Note on execution spy surface: fgos-code-panel is a prose skill read and followed by an LLM,
// not a JS runtime function (zero runtime callers in src/core/domains/bin). There is no runtime
// execution spy surface to intercept invocations; tests 1-3 enforce these invariants structurally
// on the canonical SKILL.md prose and coordination schema.

test('Assertion 2 Delegation Test 1: planned-multi-cell mode delegates track execution to fgos-plan-loop exactly once by reference with policy overlay', () => {
  const repoRoot = path.resolve(fileURLToPath(import.meta.url), '../../..');
  const skillContent = fs.readFileSync(
    path.join(repoRoot, 'domains', 'coding', 'skills', 'fgos-code-panel', 'SKILL.md'),
    'utf8'
  );
  const plannedSectionMatch = skillContent.match(/## Planned[- ]multi[- ]cell mode[^\n]*\n([\s\S]*?)(?=\n## |\n---|$)/i);
  assert.ok(plannedSectionMatch, 'Planned-multi-cell mode section must exist');
  const sectionBody = plannedSectionMatch[1];

  // Asserts explicit materialization of the 3-tier coding test-policy overlay
  assert.match(sectionBody, /Materialize the 3-tier coding test-policy overlay/i);
  assert.match(sectionBody, /FOCUSED_TESTS/);
  assert.match(sectionBody, /AFFECTED_TESTS/);
  assert.match(sectionBody, /FULL_TEST/);

  // Asserts single delegation to fgos-plan-loop by reference
  assert.match(sectionBody, /Delegate track execution to `?fgos-plan-loop`? by reference/i);

  // Asserts hard STOP with zero self-orchestration
  assert.match(sectionBody, /\bSTOP\b/);
  assert.match(sectionBody, /does NOT execute multi-cell loop orchestration/i);
});

test('Assertion 2 Delegation Test 2: zero multi-cell orchestration requests originate from fgos-code-panel', () => {
  const repoRoot = path.resolve(fileURLToPath(import.meta.url), '../../..');
  const skillContent = fs.readFileSync(
    path.join(repoRoot, 'domains', 'coding', 'skills', 'fgos-code-panel', 'SKILL.md'),
    'utf8'
  );
  const plannedSectionMatch = skillContent.match(/## Planned[- ]multi[- ]cell mode[^\n]*\n([\s\S]*?)(?=\n## |\n---|$)/i);
  assert.ok(plannedSectionMatch);
  const sectionBody = plannedSectionMatch[1];

  // No chain command or iteration loop
  assert.doesNotMatch(sectionBody, /fgos coordination chain/i);
  assert.doesNotMatch(sectionBody, /fgos coordination run/i);
  assert.doesNotMatch(sectionBody, /chain\.mjs/i);
  assert.match(sectionBody, /All multi-cell\s+progression belongs exclusively to `?fgos-plan-loop`?/i);
});

test('Assertion 2 Delegation Test 3: fgos-plan-loop accepts coding policy overlay without requiring changes to generic plan schemas', () => {
  const repoRoot = path.resolve(fileURLToPath(import.meta.url), '../../..');
  const schemaSource = fs.readFileSync(
    path.join(repoRoot, 'src', 'verbs', 'coordination', 'schema.mjs'),
    'utf8'
  );

  // Assert generic schema contains no domain-specific coding branch or trackKind: code
  assert.doesNotMatch(schemaSource, /trackKind:\s*['"]code['"]/i);
  assert.doesNotMatch(schemaSource, /domains\/coding/i);

  // Assert plan-loop skill accepts policy overlay per its own contract
  const planLoopContent = fs.readFileSync(
    path.join(repoRoot, 'core', 'skills', 'fgos-plan-loop', 'SKILL.md'),
    'utf8'
  );
  assert.ok(planLoopContent.includes('FOCUSED_TESTS') || planLoopContent.includes('policy'));
});

// ─── Tests for Assertion 1: Mode-Selection Rule (R1/R2, CE1-CE5, M1) ───

test('Assertion 1 Mode-Selection: direct single-cell for concrete change without plan target', () => {
  const res = classifyCodePanelRequest('implement fix for auth bug in src/auth.mjs');
  assert.equal(res.mode, 'direct-single-cell');
  assert.equal(res.target, 'src/auth.mjs');
});

test('Assertion 1 Mode-Selection: passing citation of plan stays direct-single-cell (RT-01/F2)', () => {
  const res = classifyCodePanelRequest('fix the bug described in plans/260915-foo/plan.md');
  assert.equal(res.mode, 'direct-single-cell');
  assert.equal(res.target, 'plans/260915-foo/plan.md');
  assert.equal(res.role, 'passing-citation');
});

test('Assertion 1 Mode-Selection: plan file as edit target stays direct-single-cell (A1)', () => {
  const res = classifyCodePanelRequest('fix the typo in plans/260915-foo/plan.md');
  assert.equal(res.mode, 'direct-single-cell');
  assert.equal(res.target, 'plans/260915-foo/plan.md');
  assert.equal(res.role, 'edit-target');
});

test('Assertion 1 Mode-Selection: run/resume verb directed at tests/code stays direct-single-cell (A2)', () => {
  const res1 = classifyCodePanelRequest('run the focused tests listed in plans/260915-foo/phase-01.md against src/x.mjs');
  assert.equal(res1.mode, 'direct-single-cell');
  assert.equal(res1.target, 'src/x.mjs');
  assert.equal(res1.context, 'plans/260915-foo/phase-01.md');

  const res2 = classifyCodePanelRequest('resume my work on src/auth.mjs, context in plans/260915-foo/plan.md');
  assert.equal(res2.mode, 'direct-single-cell');
  assert.equal(res2.target, 'src/auth.mjs');
  assert.equal(res2.context, 'plans/260915-foo/plan.md');
});

test('Assertion 1 Mode-Selection: direct requests combining code edits and commands stay direct (C2)', () => {
  const res1 = classifyCodePanelRequest('fix the flaky retry in src/runner/retry.mjs and run npm test');
  assert.equal(res1.mode, 'direct-single-cell');
  assert.equal(res1.target, 'src/runner/retry.mjs');

  const res2 = classifyCodePanelRequest('implement the retry backoff in src/runner/retry.mjs then open a PR');
  assert.equal(res2.mode, 'direct-single-cell');
  assert.equal(res2.target, 'src/runner/retry.mjs');

  const res3 = classifyCodePanelRequest('add null-check in src/auth.mjs and run the linter');
  assert.equal(res3.mode, 'direct-single-cell');
  assert.equal(res3.target, 'src/auth.mjs');

  const res4 = classifyCodePanelRequest('execute the migration in src/db/migrate.mjs and add a test');
  assert.equal(res4.mode, 'direct-single-cell');
  assert.equal(res4.target, 'src/db/migrate.mjs');

  // Direct requests inside active plan-loop cell are accepted as cell-internal work
  const cellInternal = classifyCodePanelRequest('fix the flaky retry in src/runner/retry.mjs and run npm test', {
    coordinationId: 'code-panel-multicell-facade--p01',
  });
  assert.equal(cellInternal.mode, 'direct-single-cell');
  assert.equal(cellInternal.guarded, true);
  assert.equal(cellInternal.target, 'src/runner/retry.mjs');
});

test('Assertion 1 Mode-Selection: negation honored without fabricating fallback target (CE2 / H2)', () => {
  const res = classifyCodePanelRequest("don't run plans/260915-foo/plan.md yet, just fix src/auth.mjs");
  assert.equal(res.mode, 'direct-single-cell');
  assert.equal(res.target, 'src/auth.mjs');

  // When negation is on plan with no alternative target, refuse with AmbiguousIntentError (never fabricate src/auth.mjs)
  assert.throws(
    () => classifyCodePanelRequest("don't run plans/260915-foo/plan.md yet"),
    AmbiguousIntentError
  );

  // Negation on other objects (e.g. test suite) does not suppress affirmative plan execution
  const res2 = classifyCodePanelRequest('do not run the full suite; run plans/260915-foo/plan.md');
  assert.equal(res2.mode, 'planned-multi-cell');
  assert.equal(res2.planPath, 'plans/260915-foo/plan.md');

  // Direct change with non-plan negation
  const res3 = classifyCodePanelRequest("don't execute anything destructive, refactor src/db/pool.mjs");
  assert.equal(res3.mode, 'direct-single-cell');
  assert.equal(res3.target, 'src/db/pool.mjs');

  // Regression tests (reviewer R-H1 / red-team NEW-2): track-by-name negation
  assert.throws(
    () => classifyCodePanelRequest("don't resume the dispatch-operability-implementation track"),
    AmbiguousIntentError
  );
  const altTrackRes = classifyCodePanelRequest(
    'never run the code-panel-multicell-facade track, just fix src/x.mjs'
  );
  assert.equal(altTrackRes.mode, 'direct-single-cell');
  assert.equal(altTrackRes.target, 'src/x.mjs');

  // Regression tests (reviewer F-1 / op_030): negated phase-of-track / phase-of-path
  assert.throws(
    () => classifyCodePanelRequest("don't run phase-02 of the code-panel-multicell-facade track"),
    AmbiguousIntentError
  );
  const altPhaseRes = classifyCodePanelRequest(
    'do not run phase-02 of the code-panel-multicell-facade track, just fix src/x.mjs'
  );
  assert.equal(altPhaseRes.mode, 'direct-single-cell');
  assert.equal(altPhaseRes.target, 'src/x.mjs');

  assert.throws(
    () => classifyCodePanelRequest('never execute phase-02 of plans/260915-foo/plan.md'),
    AmbiguousIntentError
  );
  assert.throws(
    () => classifyCodePanelRequest("don't resume phase-01-foo of plans/260915-foo/plan.md"),
    AmbiguousIntentError
  );
});

test('Assertion 1 Mode-Selection: inspection verb directed at plan stays direct-single-cell (CE4)', () => {
  const res = classifyCodePanelRequest('review plans/260915-foo/plan.md');
  assert.equal(res.mode, 'direct-single-cell');
  assert.equal(res.target, 'plans/260915-foo/plan.md');
  assert.equal(res.role, 'inspection');
});

test('Assertion 1 Mode-Selection: explicit run instruction directed AT plan selects planned-multi-cell (C1 / M4)', () => {
  // Single space between verb and path (C1)
  const res1 = classifyCodePanelRequest('run plans/260915-foo/plan.md');
  assert.equal(res1.mode, 'planned-multi-cell');
  assert.equal(res1.planPath, 'plans/260915-foo/plan.md');

  const res2 = classifyCodePanelRequest('execute plans/260915-foo/plan.md');
  assert.equal(res2.mode, 'planned-multi-cell');
  assert.equal(res2.planPath, 'plans/260915-foo/plan.md');

  const res3 = classifyCodePanelRequest('resume plans/260915-foo/phase-02-foo.md');
  assert.equal(res3.mode, 'planned-multi-cell');
  assert.equal(res3.planPath, 'plans/260915-foo/phase-02-foo.md');

  // Verb directed at plan takes precedence over secondary inspection phrases (M4)
  const res4 = classifyCodePanelRequest('run plans/260915-foo/plan.md and read docs/notes.md first');
  assert.equal(res4.mode, 'planned-multi-cell');
  assert.equal(res4.planPath, 'plans/260915-foo/plan.md');

  // Preamble variants
  const res5 = classifyCodePanelRequest('run this implementation plan: plans/260915-foo/plan.md');
  assert.equal(res5.mode, 'planned-multi-cell');
  assert.equal(res5.planPath, 'plans/260915-foo/plan.md');

  const res6 = classifyCodePanelRequest('resume track plans/260915-foo/plan.md');
  assert.equal(res6.mode, 'planned-multi-cell');
  assert.equal(res6.planPath, 'plans/260915-foo/plan.md');
});

test('Assertion 1 Mode-Selection: bare plan or phase path selects planned-multi-cell (M1)', () => {
  const res1 = classifyCodePanelRequest('plans/260915-foo/plan.md');
  assert.equal(res1.mode, 'planned-multi-cell');
  assert.equal(res1.planPath, 'plans/260915-foo/plan.md');

  const res2 = classifyCodePanelRequest('plans/260915-foo/phase-02-foo.md');
  assert.equal(res2.mode, 'planned-multi-cell');
  assert.equal(res2.planPath, 'plans/260915-foo/phase-02-foo.md');

  const res3 = classifyCodePanelRequest('./plans/260915-foo/plan.md');
  assert.equal(res3.mode, 'planned-multi-cell');
  assert.equal(res3.planPath, 'plans/260915-foo/plan.md');

  const res4 = classifyCodePanelRequest('./plans/260915-foo/phase-02-foo.md');
  assert.equal(res4.mode, 'planned-multi-cell');
  assert.equal(res4.planPath, 'plans/260915-foo/phase-02-foo.md');
});

test('Assertion 1 Mode-Selection: plan outside plans/ directory with run verb selects planned-multi-cell (CE5)', () => {
  const res = classifyCodePanelRequest('run this plan: docs/platform/packaging-distribution/code-panel-rollout-plan.md');
  assert.equal(res.mode, 'planned-multi-cell');
  assert.equal(res.planPath, 'docs/platform/packaging-distribution/code-panel-rollout-plan.md');

  // Non-plan .md files outside plans/ stay direct-single-cell (NEW-8 / R-M2)
  const resReadme = classifyCodePanelRequest('run docs/README.md');
  assert.equal(resReadme.mode, 'direct-single-cell');
  const resChangelog = classifyCodePanelRequest('execute CHANGELOG.md');
  assert.equal(resChangelog.mode, 'direct-single-cell');
});

test('Assertion 1 Mode-Selection: track by name resolves to plan or live session (CE1)', () => {
  // Resolves via committed plan.md Track header (this track's own plan.md)
  const res1 = classifyCodePanelRequest('resume the code-panel-multicell-facade track');
  assert.equal(res1.mode, 'planned-multi-cell');
  assert.equal(res1.track, 'code-panel-multicell-facade');
  assert.equal(res1.planPath, 'plans/260915-code-panel-multicell-facade/plan.md');

  const res2 = classifyCodePanelRequest('open the next cell for code-panel-multicell-facade');
  assert.equal(res2.mode, 'planned-multi-cell');
  assert.equal(res2.track, 'code-panel-multicell-facade');
  assert.equal(res2.planPath, 'plans/260915-code-panel-multicell-facade/plan.md');

  // Resolves via options.hasLiveSession hook without reading host .fgos
  const resLive = classifyCodePanelRequest('resume the dispatch-operability-implementation track', {
    hasLiveSession: (track) => track === 'dispatch-operability-implementation',
  });
  assert.equal(resLive.mode, 'planned-multi-cell');
  assert.equal(resLive.track, 'dispatch-operability-implementation');
  assert.equal(resLive.planPath, undefined);

  // Resolves via fixture sessionsDir
  const fixtureSessionsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-sessions-test-'));
  try {
    fs.mkdirSync(path.join(fixtureSessionsDir, 'fixture-track--cell-01'));
    const resDir = classifyCodePanelRequest('resume the fixture-track track', {
      sessionsDir: fixtureSessionsDir,
    });
    assert.equal(resDir.mode, 'planned-multi-cell');
    assert.equal(resDir.track, 'fixture-track');
  } finally {
    fs.rmSync(fixtureSessionsDir, { recursive: true, force: true });
  }
});

test('Assertion 1 Track Resolution: exact match only; partial or fictitious names refused (M3 / C2)', () => {
  const resolved = resolveTrackNameToPlanPath('code-panel-multicell-facade');
  assert.equal(resolved, 'plans/260915-code-panel-multicell-facade/plan.md');

  // Substring/suffix matches must NOT resolve (M3)
  assert.equal(resolveTrackNameToPlanPath('facade'), null);
  assert.equal(resolveTrackNameToPlanPath('policy'), null);

  const nonExistent = resolveTrackNameToPlanPath('completely-fictitious-track');
  assert.equal(nonExistent, null);

  // Unresolvable track names must be refused with AmbiguousIntentError (never guessed)
  assert.throws(
    () => classifyCodePanelRequest('resume the completely-fictitious-track track'),
    AmbiguousIntentError
  );
  assert.throws(
    () => classifyCodePanelRequest('resume the facade track'),
    AmbiguousIntentError
  );
});

test('Assertion 1 Mode-Selection: imperative mood requirement rejects questions, conditionals, past tense, and ambiguity (M1 / H3)', () => {
  // Questions directed at running plan
  assert.throws(
    () => classifyCodePanelRequest('should I run plans/260915-foo/plan.md now?'),
    AmbiguousIntentError
  );
  assert.throws(
    () => classifyCodePanelRequest('Should we run plans/260915-foo/plan.md'),
    AmbiguousIntentError
  );
  assert.throws(
    () => classifyCodePanelRequest('Would it be wise to run plans/260915-foo/plan.md'),
    AmbiguousIntentError
  );

  // Conditionals on running plan
  assert.throws(
    () => classifyCodePanelRequest('if we finish early, run plans/260915-foo/plan.md'),
    AmbiguousIntentError
  );

  // Comma-less and trailing conditionals directed at running plan (NEW-9 / R-M3)
  assert.throws(
    () => classifyCodePanelRequest('if CI is green run plans/260915-foo/plan.md'),
    AmbiguousIntentError
  );
  assert.throws(
    () => classifyCodePanelRequest('run plans/260915-foo/plan.md if the tests pass'),
    AmbiguousIntentError
  );
  assert.throws(
    () => classifyCodePanelRequest('I wonder if we should run plans/260915-foo/plan.md'),
    AmbiguousIntentError
  );
  assert.throws(
    () => classifyCodePanelRequest('resume the code-panel-multicell-facade track unless told otherwise'),
    AmbiguousIntentError
  );

  // Past tense on running plan
  assert.throws(
    () => classifyCodePanelRequest('I ran plans/260915-foo/plan.md yesterday'),
    AmbiguousIntentError
  );

  // Speculative on plan
  assert.throws(
    () => classifyCodePanelRequest('maybe do something with plans/260915-foo/plan.md or fix bar'),
    AmbiguousIntentError
  );

  // Non-plan questions/conditionals/past-tense stay direct (H3)
  const r1 = classifyCodePanelRequest('I ran npm test and it fails in src/auth.test.mjs; fix the failing assertion');
  assert.equal(r1.mode, 'direct-single-cell');

  const r2 = classifyCodePanelRequest('in src/auth.mjs, return 401 if the token is expired and run the focused test');
  assert.equal(r2.mode, 'direct-single-cell');

  const r3 = classifyCodePanelRequest('implement retry in src/a.mjs, ok?');
  assert.equal(r3.mode, 'direct-single-cell');

  // Regression tests (reviewer F-2 / op_030): direct requests containing English 'track' stay direct-single-cell
  const f2_1 = classifyCodePanelRequest('keep track of the retry count in src/foo.mjs and run the tests if they fail');
  assert.equal(f2_1.mode, 'direct-single-cell');
  assert.equal(f2_1.target, 'src/foo.mjs');

  const f2_2 = classifyCodePanelRequest('run the unit tests for src/track.mjs if CI is green');
  assert.equal(f2_2.mode, 'direct-single-cell');
  assert.equal(f2_2.target, 'src/track.mjs');

  const f2_3 = classifyCodePanelRequest('fix the bug in src/auth.mjs so we can track failures, then run the tests');
  assert.equal(f2_3.mode, 'direct-single-cell');
  assert.equal(f2_3.target, 'src/auth.mjs');

  const f2_4 = classifyCodePanelRequest('open src/track.mjs and fix the off-by-one if present');
  assert.equal(f2_4.mode, 'direct-single-cell');

  // Regression tests (reviewer R-1 / op_031): F-2's fix omitted the
  // phase-of-track shape, letting non-imperative phase-of-track
  // instructions execute a real track. Must refuse like the path/
  // bare-track-name forms above.
  assert.throws(
    () => classifyCodePanelRequest('run phase-02 of the code-panel-multicell-facade track if CI is green'),
    AmbiguousIntentError
  );
  assert.throws(
    () => classifyCodePanelRequest('should I run phase-02 of the code-panel-multicell-facade track?'),
    AmbiguousIntentError
  );
  assert.throws(
    () => classifyCodePanelRequest('maybe run phase-02 of the code-panel-multicell-facade track'),
    AmbiguousIntentError
  );
  assert.throws(
    () => classifyCodePanelRequest('could you run phase-02 of the code-panel-multicell-facade track'),
    AmbiguousIntentError
  );
  assert.throws(
    () => classifyCodePanelRequest('if CI is green, run phase-02 of the code-panel-multicell-facade track'),
    AmbiguousIntentError
  );
  assert.throws(
    () => classifyCodePanelRequest('run phase-02 of track code-panel-multicell-facade if CI is green'),
    AmbiguousIntentError
  );

  // Control: the same phase-of-track shape with no hedge still resolves
  const r1Affirmative = classifyCodePanelRequest('run phase-02 of the code-panel-multicell-facade track');
  assert.equal(r1Affirmative.mode, 'planned-multi-cell');
});

test('Assertion 1 Mode-Selection: phase selection mismatch throws PhaseSelectionMismatchError (CE3 / M2)', () => {
  assert.throws(
    () => classifyCodePanelRequest('run phase-03 of plans/260915-foo/plan.md', { nextUnmergedPhase: 'phase-01' }),
    PhaseSelectionMismatchError
  );

  // Slug-prefixed phase name matches cleanly without false mismatch (M2)
  const matched = classifyCodePanelRequest('run phase-01 of plans/260915-foo/plan.md', {
    nextUnmergedPhase: 'phase-01-two-mode-facade',
  });
  assert.equal(matched.mode, 'planned-multi-cell');
  assert.equal(matched.planPath, 'plans/260915-foo/plan.md');
  assert.equal(matched.phase, 'phase-01');

  // CE3 phrasing with a track name resolves track to planPath (NEW-10)
  const phaseTrackRes = classifyCodePanelRequest(
    'run phase-02 of the code-panel-multicell-facade track'
  );
  assert.equal(phaseTrackRes.mode, 'planned-multi-cell');
  assert.equal(phaseTrackRes.planPath, 'plans/260915-code-panel-multicell-facade/plan.md');
  assert.equal(phaseTrackRes.phase, 'phase-02');
  assert.equal(phaseTrackRes.track, 'code-panel-multicell-facade');

  assert.throws(
    () => classifyCodePanelRequest('run phase-02 of the nonexistent-track track'),
    AmbiguousIntentError
  );
});

test('Recursive Dispatch Guard (R2 / H1): prevents nested multi-cell dispatch from within plan-loop', () => {
  // Plan-loop cell shapes (<track>--<cell-id>) throw RecursiveDispatchError
  assert.throws(
    () => classifyCodePanelRequest('run this implementation plan: plans/260915-foo/plan.md', { inPlanLoop: true }),
    RecursiveDispatchError
  );

  assert.throws(
    () => classifyCodePanelRequest('resume track plans/260915-foo/plan.md', { coordinationId: 'code-panel-multicell-facade--p01' }),
    RecursiveDispatchError
  );

  assert.throws(
    () => classifyCodePanelRequest('run plans/260915-foo/plan.md', { workRef: 'track--p02' }),
    RecursiveDispatchError
  );

  assert.throws(
    () => classifyCodePanelRequest('run plans/260915-foo/plan.md', { coordinationId: 'dispatch-operability-implementation--i05' }),
    RecursiveDispatchError
  );

  assert.throws(
    () => classifyCodePanelRequest('run plans/260915-foo/plan.md', { coordinationId: 'track--cell-01' }),
    RecursiveDispatchError
  );

  // Guard trims whitespace so trailing newlines/spaces do not bypass (NEW-7)
  assert.throws(
    () => classifyCodePanelRequest('run plans/260915-foo/plan.md', { coordinationId: 'track--p01\n' }),
    RecursiveDispatchError
  );
  assert.throws(
    () => classifyCodePanelRequest('run plans/260915-foo/plan.md', { coordinationId: 'track--p01 ' }),
    RecursiveDispatchError
  );
  assert.throws(
    () => classifyCodePanelRequest('run plans/260915-foo/plan.md', { workRef: 'track--p02\n' }),
    RecursiveDispatchError
  );

  // Direct single-cell change inside plan-loop cell is accepted as cell-internal work
  const cellInternal = classifyCodePanelRequest('implement fix for auth bug in src/auth.mjs', {
    coordinationId: 'code-panel-multicell-facade--p01',
  });
  assert.equal(cellInternal.mode, 'direct-single-cell');
  assert.equal(cellInternal.guarded, true);
  assert.equal(cellInternal.target, 'src/auth.mjs');
});
