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
    /duplicate shared fragment "same\.md" found in multiple sources:/,
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
