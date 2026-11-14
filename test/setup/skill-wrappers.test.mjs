// skill-wrappers.test.mjs — the shared generator behind `npm run
// build:skills` and `fgos setup`'s external-project materialize path
// (tsk-1qi, D5/D7 of docs/history/install-setup-external-project-
// reliability/CONTEXT.md).
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  generateWrapperContent,
  generateAllSkillWrappers,
  assembleSkills,
  materializeSkillsIntoProject,
  mirrorDevSkillsIntoPlugin,
  renderSkillSurfaces,
  ownedSkillNames,
  discoverCanonicalSkills,
  discoverSharedFragments,
} from '../../src/setup/skill-wrappers.mjs';
import { ownedFileSet } from '../../scripts/lib/git-ports.mjs';

function mkTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function writeSkill(skillsRoot, name, frontmatter, body) {
  const dir = path.join(skillsRoot, name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'SKILL.md'), `${frontmatter}\n${body}`);
}

// Every directory of a fixture skill root counts as owned: the tests that call a render step
// directly are about what that step does with an owned name.
function everyNameIn(skillsRoot) {
  return new Set(fs.existsSync(skillsRoot) ? fs.readdirSync(skillsRoot) : []);
}

const SAMPLE_FRONTMATTER = '---\nname: sample-skill\ndescription: A sample skill for testing.\n---\n';

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

  const written = generateAllSkillWrappers(agentsSkillsRoot, claudeSkillsRoot, { owned: everyNameIn(agentsSkillsRoot) });

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

  const written = generateAllSkillWrappers(agentsSkillsRoot, claudeSkillsRoot, { owned: everyNameIn(agentsSkillsRoot) });

  assert.equal(written.length, 1);
  assert.equal(fs.existsSync(path.join(claudeSkillsRoot, '_shared')), false);
});

test('generateAllSkillWrappers skips a directory with no SKILL.md inside it', () => {
  const agentsSkillsRoot = mkTempDir('skill-wrappers-nofile-agents-');
  const claudeSkillsRoot = mkTempDir('skill-wrappers-nofile-claude-');
  fs.mkdirSync(path.join(agentsSkillsRoot, 'not-a-skill'), { recursive: true });
  fs.writeFileSync(path.join(agentsSkillsRoot, 'not-a-skill', 'README.md'), 'not a skill file\n');

  const written = generateAllSkillWrappers(agentsSkillsRoot, claudeSkillsRoot, { owned: everyNameIn(agentsSkillsRoot) });
  assert.equal(written.length, 0);
});

test('generateAllSkillWrappers is a no-op returning [] when agentsSkillsRoot does not exist at all', () => {
  const claudeSkillsRoot = mkTempDir('skill-wrappers-missing-claude-');
  const written = generateAllSkillWrappers(path.join(mkTempDir('skill-wrappers-missing-'), 'does-not-exist'), claudeSkillsRoot, { owned: new Set(['skill-a']) });
  assert.deepEqual(written, []);
});

test('materializeSkillsIntoProject copies .agents/skills into an external target project, then generates wrappers there', () => {
  const packageRoot = mkTempDir('skill-wrappers-materialize-pkg-');
  writeSkill(path.join(packageRoot, 'core', 'skills'), 'skill-a', SAMPLE_FRONTMATTER, '# Body A\n');
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
  writeSkill(path.join(root, 'core', 'skills'), 'skill-a', SAMPLE_FRONTMATTER, '# Body A\n');
  assembleSkills(root);

  const { copied, wrappersWritten } = materializeSkillsIntoProject(root, root);

  assert.equal(copied, false);
  assert.equal(wrappersWritten.length, 1);
  assert.ok(fs.existsSync(path.join(root, '.claude', 'skills', 'skill-a', 'SKILL.md')));
});

test('materializeSkillsIntoProject keeps a project skill file that is newer than the release copy or edited since HEAD, names it, and still refreshes an older clean one', () => {
  // The project's copies are ones an earlier setup wrote, so each carries its generated stamp.
  const skillMd = (version, body, stamp = '') => `---\nname: sample\ndescription: d\nmetadata:\n  version: "${version}"\n---\n${stamp}${body}\n`;
  const assembledStamp = '<!-- Generated by fgOS skill assembly from core/skills/x/SKILL.md (npm run build:skills in the fgOS source repo). Do not edit this copy; it is overwritten. -->\n';
  const wrapperStamp = '\nThis is a generated thin wrapper (tsk-1qi) -- do not edit directly, edit the source instead.\n';
  const packageRoot = mkTempDir('skill-wrappers-keep-pkg-');
  const releaseSkills = path.join(packageRoot, 'core', 'skills');
  for (const name of ['held', 'edited', 'stale']) {
    fs.mkdirSync(path.join(releaseSkills, name), { recursive: true });
    fs.writeFileSync(path.join(releaseSkills, name, 'SKILL.md'), skillMd('0.1', `release ${name}`));
  }
  fs.mkdirSync(path.join(releaseSkills, 'held', 'references'), { recursive: true });
  fs.writeFileSync(path.join(releaseSkills, 'held', 'references', 'guide.md'), 'release guide\n');

  const targetRoot = mkTempDir('skill-wrappers-keep-target-');
  const put = (rel, content) => {
    fs.mkdirSync(path.dirname(path.join(targetRoot, rel)), { recursive: true });
    fs.writeFileSync(path.join(targetRoot, rel), content);
  };
  put('.claude/skills/held/SKILL.md', skillMd('0.2', 'project held', wrapperStamp));
  put('.claude/skills/held/references/guide.md', 'project guide\n');
  put('.agents/skills/edited/SKILL.md', skillMd('0.1', 'project edited', assembledStamp));
  put('.agents/skills/stale/SKILL.md', skillMd('0.0.9', 'project stale', assembledStamp));
  const git = (...args) => execFileSync('git', args, {
    cwd: targetRoot,
    env: { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' },
    stdio: 'ignore',
  });
  git('init', '-q');
  git('add', '.');
  git('commit', '-q', '-m', 'project skills');
  put('.agents/skills/edited/SKILL.md', skillMd('0.1', 'edited after commit', assembledStamp));

  // Reached through a symlinked directory, as a symlinked home or macOS /tmp does.
  const linkedRoot = path.join(mkTempDir('skill-wrappers-keep-link-'), 'project');
  fs.symlinkSync(targetRoot, linkedRoot, 'dir');
  const { skipped } = materializeSkillsIntoProject(packageRoot, linkedRoot);

  const read = (rel) => fs.readFileSync(path.join(targetRoot, rel), 'utf8');
  assert.equal(read('.claude/skills/held/SKILL.md'), skillMd('0.2', 'project held', wrapperStamp));
  assert.equal(read('.claude/skills/held/references/guide.md'), 'project guide\n');
  assert.equal(read('.agents/skills/edited/SKILL.md'), skillMd('0.1', 'edited after commit', assembledStamp));
  assert.equal(
    read('.agents/skills/stale/SKILL.md'),
    fs.readFileSync(path.join(packageRoot, '.agents', 'skills', 'stale', 'SKILL.md'), 'utf8'),
    'an older clean tracked copy is still refreshed',
  );
  assert.match(read('.agents/skills/stale/SKILL.md'), /release stale/);
  assert.deepEqual([...skipped].sort(), [
    '.agents/skills/edited/SKILL.md',
    '.claude/skills/held/SKILL.md',
    '.claude/skills/held/references/guide.md',
  ]);
});

test('materializeSkillsIntoProject compares skill versions as dotted numbers (1.10 is after 1.9) and ignores an unquoted version', () => {
  const wrapperStamp = '\nThis is a generated thin wrapper (tsk-1qi) -- do not edit directly, edit the source instead.\n';
  const skillMd = (version, body, stamp = '') => `---\nname: sample\ndescription: d\nmetadata:\n  version: ${version}\n---\n${stamp}${body}\n`;
  const packageRoot = mkTempDir('skill-wrappers-version-pkg-');
  for (const name of ['tenth', 'unquoted']) {
    fs.mkdirSync(path.join(packageRoot, 'core', 'skills', name), { recursive: true });
    fs.writeFileSync(path.join(packageRoot, 'core', 'skills', name, 'SKILL.md'), skillMd('"1.9"', `release ${name}`));
  }
  const targetRoot = mkTempDir('skill-wrappers-version-target-');
  const put = (rel, content) => {
    fs.mkdirSync(path.dirname(path.join(targetRoot, rel)), { recursive: true });
    fs.writeFileSync(path.join(targetRoot, rel), content);
  };
  put('.claude/skills/tenth/SKILL.md', skillMd('"1.10"', 'project tenth', wrapperStamp));
  put('.claude/skills/unquoted/SKILL.md', skillMd('1.10', 'project unquoted', wrapperStamp));
  const { skipped } = materializeSkillsIntoProject(packageRoot, targetRoot);
  assert.deepEqual(skipped, ['.claude/skills/tenth/SKILL.md']);
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
  writeSkill(path.join(packageRoot, 'core', 'skills'), 'skill-a', SAMPLE_FRONTMATTER, '# Body A\n');
  fs.mkdirSync(path.join(packageRoot, 'core', 'skills', 'skill-a', 'assets'));
  fs.writeFileSync(path.join(packageRoot, 'core', 'skills', 'skill-a', 'assets', 'one.txt'), 'one\n');
  // The shipped render already holds the skill, with a plain file where the
  // source has a directory: assembling into packageRoot fails on it, the same
  // "block the path with a file" I/O-failure simulation test/runner/worker-log.test.mjs
  // uses, standing in for any real write failure (disk full, EACCES, read-only filesystem).
  writeSkill(path.join(packageRoot, '.agents', 'skills'), 'skill-a', SAMPLE_FRONTMATTER, '# Body A\n');
  fs.writeFileSync(path.join(packageRoot, '.agents', 'skills', 'skill-a', 'assets'), 'not a directory');
  const targetRoot = mkTempDir('skill-wrappers-materialize-readonly-target-');

  assert.throws(() => assembleSkills(packageRoot), /EEXIST|ENOTDIR/, 'the fixture really makes assembling fail');
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
  writeSkill(path.join(packageRoot, 'core', 'skills'), 'fgos-routing', SAMPLE_FRONTMATTER, '# base routing\n');
  writeSkill(path.join(packageRoot, 'core', 'skills'), 'fgos-coding-implement', SAMPLE_FRONTMATTER, '# base implement\n');

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
      if (/\.tmp-\d+/.test(entry.name)) continue;
      const relPath = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(path.join(d, entry.name), relPath);
      else out.push(relPath);
    }
  };
  walk(dir, '');
  return out.sort();
}

// Why a rendered file is missing from the committed tree: a path `.gitignore` swallows never
// reaches a clone, which no `build:skills` run can repair.
function driftRemedy(repoRoot, missing) {
  const ignored = missing.filter((rel) => {
    try {
      execFileSync('git', ['check-ignore', '-q', `.agents/skills/${rel}`], { cwd: repoRoot, stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  });
  return ignored.length > 0
    ? `.gitignore ignores ${ignored.join(', ')} (add a re-include for it; rendering again will not help)`
    : 'run `npm run build:skills`';
}

test('the drift guard names the .gitignore cause when a rendered file is ignored, and the render command otherwise', () => {
  const repo = mkTempDir('skill-wrappers-drift-remedy-');
  execFileSync('git', ['init', '-q'], { cwd: repo });
  fs.writeFileSync(path.join(repo, '.gitignore'), '/.agents/skills/*\n');

  assert.match(driftRemedy(repo, ['fgos-x/SKILL.md']), /\.gitignore ignores fgos-x\/SKILL\.md/);
  fs.writeFileSync(path.join(repo, '.gitignore'), '');
  assert.equal(driftRemedy(repo, ['fgos-x/SKILL.md']), 'run `npm run build:skills`');
});

test('assembleSkills output matches the committed .agents/skills byte-for-byte (drift guard, review finding H6) -- catches a hand-edit to the render target OR a source-only edit that never landed there', () => {
  const repoRoot = path.resolve(fileURLToPath(import.meta.url), '../../..');
  const committedAgentsSkills = path.join(repoRoot, '.agents', 'skills');
  const rendered = mkTempDir('skill-wrappers-drift-guard-');

  assembleSkills(repoRoot, rendered);

  // The guard judges what this repository owns: a file git ignores that the render did not produce
  // (an installed skill kit's directory) belongs to another tool.
  const renderedFiles = listFilesRecursiveSorted(rendered);
  const owned = ownedFileSet(repoRoot);
  const committedFiles = listFilesRecursiveSorted(committedAgentsSkills)
    .filter((relPath) => !owned || owned.has(`.agents/skills/${relPath}`) || renderedFiles.includes(relPath));
  const missing = renderedFiles.filter((relPath) => !committedFiles.includes(relPath));
  assert.deepEqual(renderedFiles, committedFiles, `committed .agents/skills/ has a different file set than core/skills+domains/*/skills would render -- ${driftRemedy(repoRoot, missing)}`);

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
  // Assembled once from a source that is then removed: fgOS wrote it, so it is stale.
  writeSkill(path.join(root, 'core', 'skills'), 'skill-orphaned', SAMPLE_FRONTMATTER, '# Orphaned\n');
  assembleSkills(root);
  fs.rmSync(path.join(root, 'core', 'skills', 'skill-orphaned'), { recursive: true, force: true });
  // Installed by another tool: no generated header, must survive.
  writeSkill(targetAgentsSkills, 'ak-cook', SAMPLE_FRONTMATTER, '# Third party\n');

  assert.ok(fs.existsSync(path.join(targetAgentsSkills, 'skill-orphaned')));

  assembleSkills(root);

  assert.ok(fs.existsSync(path.join(targetAgentsSkills, 'skill-active')));
  assert.equal(fs.existsSync(path.join(targetAgentsSkills, 'skill-orphaned')), false);
  assert.ok(fs.existsSync(path.join(targetAgentsSkills, 'ak-cook', 'SKILL.md')));
});

test('a wrapper dir holds only its SKILL.md: sibling files of the source are not copied and a copy an earlier render wrote is removed', () => {
  const root = mkTempDir('skill-wrappers-only-skill-md-');
  const agentsSkillsRoot = path.join(root, '.agents', 'skills');
  const claudeSkillsRoot = path.join(root, '.claude', 'skills');
  writeSkill(agentsSkillsRoot, 'fgos-sample', SAMPLE_FRONTMATTER, '# body\n');
  fs.mkdirSync(path.join(agentsSkillsRoot, 'fgos-sample', 'references'));
  fs.writeFileSync(path.join(agentsSkillsRoot, 'fgos-sample', 'references', 'guide.md'), 'guide\n');
  fs.mkdirSync(path.join(agentsSkillsRoot, 'fgos-sample', 'scripts'));
  fs.writeFileSync(path.join(agentsSkillsRoot, 'fgos-sample', 'scripts', 'run.mjs'), 'run\n');
  fs.mkdirSync(path.join(claudeSkillsRoot, 'fgos-sample', 'references'), { recursive: true });
  fs.writeFileSync(path.join(claudeSkillsRoot, 'fgos-sample', 'references', 'guide.md'), 'copy an earlier render wrote\n');

  generateAllSkillWrappers(agentsSkillsRoot, claudeSkillsRoot, { owned: everyNameIn(agentsSkillsRoot) });

  assert.deepEqual(fs.readdirSync(path.join(claudeSkillsRoot, 'fgos-sample')), ['SKILL.md']);
});

test('generateAllSkillWrappers prunes orphaned wrappers from .claude/skills when source skill is gone', () => {
  const agentsSkillsRoot = mkTempDir('skill-wrappers-prune-claude-agents-');
  const claudeSkillsRoot = mkTempDir('skill-wrappers-prune-claude-target-');

  writeSkill(agentsSkillsRoot, 'skill-active', SAMPLE_FRONTMATTER, '# Active\n');

  // A previously-generated wrapper whose source has since disappeared --
  // its SKILL.md carries the real generated-wrapper marker, the only
  // proof the prune pass is allowed to act on.
  fs.mkdirSync(path.join(claudeSkillsRoot, 'skill-orphaned'));
  fs.writeFileSync(
    path.join(claudeSkillsRoot, 'skill-orphaned', 'SKILL.md'),
    generateWrapperContent(`${SAMPLE_FRONTMATTER}\n# Orphaned\n`, '../../.agents/skills/skill-orphaned/SKILL.md'),
  );
  assert.ok(fs.existsSync(path.join(claudeSkillsRoot, 'skill-orphaned')));

  const written = generateAllSkillWrappers(agentsSkillsRoot, claudeSkillsRoot, { owned: everyNameIn(agentsSkillsRoot) });

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

  generateAllSkillWrappers(agentsSkillsRoot, claudeSkillsRoot, { owned: everyNameIn(agentsSkillsRoot) });

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

  const mirrored = mirrorDevSkillsIntoPlugin(agentsSkillsRoot, pluginSkillsRoot, everyNameIn(agentsSkillsRoot));

  assert.equal(mirrored.length, 3);
  assert.ok(fs.existsSync(path.join(pluginSkillsRoot, '_shared', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(pluginSkillsRoot, 'fgos-routing', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(pluginSkillsRoot, 'fgos-coding-implement', 'SKILL.md')));
  assert.equal(fs.existsSync(path.join(pluginSkillsRoot, 'distill')), false, 'non-fgos skills like distill must not be mirrored into plugins/fgOS/skills');
});

test('mirrorDevSkillsIntoPlugin is a safe no-op returning [] when agentsSkillsRoot does not exist', () => {
  const pluginSkillsRoot = mkTempDir('skill-wrappers-mirror-noop-');
  const mirrored = mirrorDevSkillsIntoPlugin(path.join(mkTempDir('skill-wrappers-missing-'), 'does-not-exist'), pluginSkillsRoot, new Set());
  assert.deepEqual(mirrored, []);
});

// ─── P2: Skill Source-of-Truth, Discovery, Collisions, and Projections ───

test('discoverCanonicalSkills discovers canonical skills across core/skills and domains/*/skills with authority and domain', () => {
  const repoRoot = path.resolve(fileURLToPath(import.meta.url), '../../..');
  const skills = discoverCanonicalSkills(repoRoot);

  assert.ok(skills.length >= 15, 'expected at least 15 canonical skills in repo');

  const coreSkill = skills.find((s) => s.name === 'fgos-routing');
  assert.ok(coreSkill, 'fgos-routing must be discovered');
  assert.equal(coreSkill.authority, 'core');
  assert.equal(coreSkill.domain, null);
  assert.equal(coreSkill.canonicalDir, 'core/skills/fgos-routing');

  const domainSkill = skills.find((s) => s.name === 'fgos-coding-driving');
  assert.ok(domainSkill, 'fgos-coding-driving must be discovered');
  assert.equal(domainSkill.authority, 'domain');
  assert.equal(domainSkill.domain, 'coding');
});

// ─── Unit I29: fgos-plan-loop / fgos-code-panel deprecated stubs ───

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

test('projection tests for Codex/OpenAI and Claude surfaces verify adapter projection invariants', () => {
  const repoRoot = path.resolve(fileURLToPath(import.meta.url), '../../..');
  const canonicalSkills = discoverCanonicalSkills(repoRoot);
  // .claude/skills is a gitignored setup output; project it from the tracked .agents/skills here.
  const claudeSkillsRoot = path.join(mkTempDir('claude-wrapper-projection-'), '.claude', 'skills');
  generateAllSkillWrappers(path.join(repoRoot, '.agents', 'skills'), claudeSkillsRoot, { owned: ownedSkillNames(repoRoot) });

  for (const skill of canonicalSkills) {
    const agentsPath = path.join(repoRoot, '.agents', 'skills', skill.name, 'SKILL.md');
    assert.ok(fs.existsSync(agentsPath), `portable Codex projection must exist at ${agentsPath}`);
    const agentsContent = fs.readFileSync(agentsPath, 'utf8');
    assert.ok(
      agentsContent.includes('# '),
      `portable Codex projection ${skill.name} must carry full skill instructions`,
    );

    const claudePath = path.join(claudeSkillsRoot, skill.name, 'SKILL.md');
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

test('discoverSharedFragments rejects backslash shared fragment names before Windows aliasing can occur', { skip: process.platform === 'win32' ? 'NTFS does not allow backslashes in filenames' : false }, () => {
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
});

// --- Ownership: fgOS writes only the skill names it assembles from its own sources ---

const FOREIGN_FILES = [
  ['SKILL.md', `---\nname: ak-x\ndescription: another kit\n---\nforeign body\n`],
  ['references/guide.md', 'foreign guide\n'],
];

function putForeignSkill(skillsRoot) {
  for (const [rel, content] of FOREIGN_FILES) {
    fs.mkdirSync(path.dirname(path.join(skillsRoot, 'ak-x', rel)), { recursive: true });
    fs.writeFileSync(path.join(skillsRoot, 'ak-x', rel), content);
  }
}

function assertForeignSkillUntouched(skillsRoot) {
  for (const [rel, content] of FOREIGN_FILES) {
    assert.equal(fs.readFileSync(path.join(skillsRoot, 'ak-x', rel), 'utf8'), content, `${skillsRoot}/ak-x/${rel}`);
  }
}

function writeInstruction(root, id = 'sample-law') {
  const dir = path.join(root, 'core', 'instructions');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${id}.md`), `---\nid: ${id}\nkind: law\ntitle: Sample\ndescription: d\n---\n\n# Sample\nText.\n`);
}

function snapshotTree(root) {
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else out.push(`${path.relative(root, full)}:${fs.readFileSync(full, 'utf8')}`);
    }
  };
  if (fs.existsSync(root)) walk(root);
  return out.sort();
}

test('rendering a checkout leaves a skill directory of another kit byte-identical under every skill root', () => {
  const root = mkTempDir('skill-wrappers-foreign-render-');
  writeSkill(path.join(root, 'core', 'skills'), 'fgos-own', SAMPLE_FRONTMATTER, '# own\n');
  writeInstruction(root);
  for (const skillsRoot of ['.agents/skills', '.claude/skills', 'plugins/fgOS/skills']) putForeignSkill(path.join(root, skillsRoot));
  // A foreign skill that also carries a source in .agents is still not fgOS's to wrap.
  const result = renderSkillSurfaces(root);

  assert.ok(result.written.some((file) => file.endsWith(path.join('fgos-own', 'SKILL.md'))));
  for (const skillsRoot of ['.agents/skills', '.claude/skills', 'plugins/fgOS/skills']) assertForeignSkillUntouched(path.join(root, skillsRoot));
  assert.ok(fs.existsSync(path.join(root, 'plugins', 'fgOS', 'skills', 'fgos-own', 'SKILL.md')), 'the owned skill is still rendered');
});

test('setup materialisation leaves another kit skill directory in the target byte-identical and never copies one from the package', () => {
  const packageRoot = mkTempDir('skill-wrappers-foreign-pkg-');
  writeSkill(path.join(packageRoot, 'core', 'skills'), 'fgos-own', SAMPLE_FRONTMATTER, '# own\n');
  putForeignSkill(path.join(packageRoot, '.agents', 'skills'));
  const targetRoot = mkTempDir('skill-wrappers-foreign-target-');
  putForeignSkill(path.join(targetRoot, '.agents', 'skills'));
  putForeignSkill(path.join(targetRoot, '.claude', 'skills'));
  // The package copy of ak-x differs, so a copy would show as a byte change.
  fs.writeFileSync(path.join(packageRoot, '.agents', 'skills', 'ak-x', 'SKILL.md'), '---\nname: ak-x\ndescription: dev checkout copy\n---\n');

  const { wrappersWritten } = materializeSkillsIntoProject(packageRoot, targetRoot);

  assert.deepEqual(wrappersWritten.map((file) => path.basename(path.dirname(file))), ['fgos-own']);
  assertForeignSkillUntouched(path.join(targetRoot, '.agents', 'skills'));
  assertForeignSkillUntouched(path.join(targetRoot, '.claude', 'skills'));
});

test('a refused instruction projection leaves every skill surface untouched', () => {
  const root = mkTempDir('skill-wrappers-refusal-');
  writeSkill(path.join(root, 'core', 'skills'), 'fgos-own', SAMPLE_FRONTMATTER, '# own\n');
  fs.mkdirSync(path.join(root, 'core', 'instructions'), { recursive: true });
  fs.writeFileSync(path.join(root, 'core', 'instructions', 'broken.md'), '---\nkind: law\n---\n\n# no id\n');
  const before = snapshotTree(root);

  assert.throws(() => renderSkillSurfaces(root), /id/i);

  assert.deepEqual(snapshotTree(root), before);
});

test('build:skills without a staged addon either completes or exits before its first write', () => {
  const scratch = mkTempDir('skill-wrappers-script-');
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  fs.mkdirSync(path.join(scratch, 'scripts'));
  fs.copyFileSync(path.join(repoRoot, 'scripts', 'build-skill-wrappers.mjs'), path.join(scratch, 'scripts', 'build-skill-wrappers.mjs'));
  // The script's imports resolve to the real modules; only the tree it renders is scratch.
  fs.symlinkSync(path.join(repoRoot, 'src'), path.join(scratch, 'src'), 'dir');
  fs.symlinkSync(path.join(repoRoot, 'scripts', 'lib'), path.join(scratch, 'scripts', 'lib'), 'dir');
  fs.symlinkSync(path.join(repoRoot, 'scripts', 'build-rust-distribution.mjs'), path.join(scratch, 'scripts', 'build-rust-distribution.mjs'));
  writeSkill(path.join(scratch, 'core', 'skills'), 'fgos-own', SAMPLE_FRONTMATTER, '# own\n');
  writeInstruction(scratch);
  const emptyPath = mkTempDir('skill-wrappers-script-path-');
  const env = { ...process.env, PATH: emptyPath };
  for (const key of Object.keys(env)) if (key.startsWith('FGOS_')) delete env[key];

  let completed = true;
  try {
    execFileSync(process.execPath, [path.join(scratch, 'scripts', 'build-skill-wrappers.mjs')], { cwd: scratch, env, stdio: 'pipe' });
  } catch {
    completed = false;
  }

  if (!completed) {
    for (const rendered of ['.agents', '.claude', 'plugins', '.fgos', 'AGENTS.md']) {
      assert.equal(fs.existsSync(path.join(scratch, rendered)), false, `${rendered} written before the script failed`);
    }
  }
});

// --- Correctness: links refused, the render is a fixed point, stamps are anchored, same-name dirs refused ---

const ASSEMBLED_STAMP = '<!-- Generated by fgOS skill assembly from core/skills/fgos-own/SKILL.md (npm run build:skills in the fgOS source repo). Do not edit this copy; it is overwritten. -->';
const WRAPPER_STAMPS = [
  'This is a generated thin wrapper (tsk-1qi) -- do not edit directly, edit the source instead.',
  'This is a generated thin wrapper (tsk-1qi D5/D7) -- do not edit directly, edit the source instead.',
];

function mtimes(root) {
  const out = {};
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else out[path.relative(root, full)] = fs.statSync(full).mtimeMs;
    }
  };
  walk(root);
  return out;
}

test('a link in a skill source or target is refused by name and never followed', () => {
  const outside = mkTempDir('skill-wrappers-link-outside-');
  fs.writeFileSync(path.join(outside, 'secret.md'), 'outside bytes\n');
  const sourceWith = (makeLink) => {
    const root = mkTempDir('skill-wrappers-link-src-');
    writeSkill(path.join(root, 'core', 'skills'), 'fgos-own', SAMPLE_FRONTMATTER, '# own\n');
    makeLink(path.join(root, 'core', 'skills', 'fgos-own'));
    return root;
  };
  const cases = {
    'a link to a file': (dir) => fs.symlinkSync(path.join(outside, 'secret.md'), path.join(dir, 'link.md')),
    'a link to a directory': (dir) => fs.symlinkSync(outside, path.join(dir, 'linked-dir'), 'dir'),
    'a dangling link': (dir) => fs.symlinkSync(path.join(outside, 'missing'), path.join(dir, 'dangling.md')),
  };
  for (const [label, makeLink] of Object.entries(cases)) {
    const root = sourceWith(makeLink);
    assert.throws(() => assembleSkills(root), /Symlink refused in a skill path/, label);
    assert.ok(!fs.existsSync(path.join(root, '.agents', 'skills', 'fgos-own', 'link.md')), label);
  }

  const root = mkTempDir('skill-wrappers-link-target-');
  writeSkill(path.join(root, 'core', 'skills'), 'fgos-own', SAMPLE_FRONTMATTER, '# own\n');
  writeInstruction(root);
  fs.mkdirSync(path.join(root, '.agents', 'skills'), { recursive: true });
  fs.symlinkSync(outside, path.join(root, '.agents', 'skills', 'fgos-own'), 'dir');
  assert.throws(() => assembleSkills(root), /Symlink refused in a skill path/);
  assert.throws(() => renderSkillSurfaces(root), /Symlink refused in a skill path/);
  assert.deepEqual(fs.readdirSync(outside), ['secret.md'], 'nothing is written through a link');
});

test('a second render after a source deletion is a fixed point and a third render writes nothing', () => {
  const root = mkTempDir('skill-wrappers-fixed-point-');
  writeSkill(path.join(root, 'core', 'skills'), 'fgos-own', SAMPLE_FRONTMATTER, '# own\n');
  writeSkill(path.join(root, 'core', 'skills'), 'fgos-gone', SAMPLE_FRONTMATTER, '# gone\n');
  fs.mkdirSync(path.join(root, 'core', 'skills', 'fgos-own', 'references'));
  fs.writeFileSync(path.join(root, 'core', 'skills', 'fgos-own', 'references', 'old.md'), 'old\n');
  fs.writeFileSync(path.join(root, 'core', 'skills', 'fgos-own', 'references', 'keep.md'), 'keep\n');
  writeSkill(path.join(root, 'core', 'skills', '_shared'), 'frag', '', 'fragment\n');
  writeInstruction(root);
  renderSkillSurfaces(root);

  fs.rmSync(path.join(root, 'core', 'skills', 'fgos-own', 'references', 'old.md'));
  fs.rmSync(path.join(root, 'core', 'skills', 'fgos-gone'), { recursive: true });
  fs.rmSync(path.join(root, 'core', 'skills', '_shared', 'frag'), { recursive: true });
  renderSkillSurfaces(root);

  for (const surface of ['.agents/skills', '.claude/skills', 'plugins/fgOS/skills']) {
    assert.equal(fs.existsSync(path.join(root, surface, 'fgos-gone')), false, `${surface} keeps a deleted skill`);
  }
  for (const surface of ['.agents/skills', 'plugins/fgOS/skills']) {
    assert.equal(fs.existsSync(path.join(root, surface, 'fgos-own', 'references', 'old.md')), false, `${surface} keeps a deleted file`);
    assert.ok(fs.existsSync(path.join(root, surface, 'fgos-own', 'references', 'keep.md')), surface);
  }
  assert.equal(fs.existsSync(path.join(root, '.agents', 'skills', '_shared', 'frag')), false);

  const before = mtimes(path.join(root, '.agents', 'skills'));
  const beforeClaude = mtimes(path.join(root, '.claude', 'skills'));
  const beforePlugin = mtimes(path.join(root, 'plugins', 'fgOS', 'skills'));
  renderSkillSurfaces(root);
  assert.deepEqual(mtimes(path.join(root, '.agents', 'skills')), before);
  assert.deepEqual(mtimes(path.join(root, '.claude', 'skills')), beforeClaude);
  assert.deepEqual(mtimes(path.join(root, 'plugins', 'fgOS', 'skills')), beforePlugin);
});

test('the plugin mirror removes only stamped fgos-* copies whose skill is gone and leaves hand-authored skills', () => {
  const root = mkTempDir('skill-wrappers-mirror-stale-');
  writeSkill(path.join(root, 'core', 'skills'), 'fgos-own', SAMPLE_FRONTMATTER, '# own\n');
  writeInstruction(root);
  const plugin = path.join(root, 'plugins', 'fgOS', 'skills');
  writeSkill(plugin, 'fgos-stale', SAMPLE_FRONTMATTER, `${ASSEMBLED_STAMP}\n# stale\n`);
  writeSkill(plugin, 'retro-next', SAMPLE_FRONTMATTER, '# hand-authored\n');
  writeSkill(plugin, 'fgos-by-hand', SAMPLE_FRONTMATTER, '# hand-authored with the mirror prefix\n');

  renderSkillSurfaces(root);

  assert.equal(fs.existsSync(path.join(plugin, 'fgos-stale')), false);
  assert.ok(fs.existsSync(path.join(plugin, 'retro-next', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(plugin, 'fgos-by-hand', 'SKILL.md')));
});

test('a foreign skill that quotes a generated stamp lower down is not pruned, for both stamps', () => {
  const agentsRoot = mkTempDir('skill-wrappers-quote-agents-');
  const claudeRoot = mkTempDir('skill-wrappers-quote-claude-');
  writeSkill(agentsRoot, 'fgos-own', SAMPLE_FRONTMATTER, '# own\n');
  writeSkill(claudeRoot, 'foreign-wrapper', SAMPLE_FRONTMATTER, `# docs\nQuoting: ${WRAPPER_STAMPS[0]}\n`);
  generateAllSkillWrappers(agentsRoot, claudeRoot, { owned: everyNameIn(agentsRoot) });
  assert.ok(fs.existsSync(path.join(claudeRoot, 'foreign-wrapper', 'SKILL.md')), 'wrapper stamp quoted in a body');

  const root = mkTempDir('skill-wrappers-quote-assemble-');
  writeSkill(path.join(root, 'core', 'skills'), 'fgos-own', SAMPLE_FRONTMATTER, '# own\n');
  writeSkill(path.join(root, '.agents', 'skills'), 'foreign-assembled', SAMPLE_FRONTMATTER, `# docs\n${ASSEMBLED_STAMP}\n`);
  assembleSkills(root);
  assert.ok(fs.existsSync(path.join(root, '.agents', 'skills', 'foreign-assembled', 'SKILL.md')), 'assembled header quoted in a body');
});

test('a same-name directory without a generated stamp is refused by name by render and by setup, and nothing else is written', () => {
  const root = mkTempDir('skill-wrappers-samename-render-');
  writeSkill(path.join(root, 'core', 'skills'), 'fgos-own', SAMPLE_FRONTMATTER, '# own\n');
  writeSkill(path.join(root, 'core', 'skills'), 'fgos-other', SAMPLE_FRONTMATTER, '# other\n');
  writeInstruction(root);
  writeSkill(path.join(root, '.claude', 'skills'), 'fgos-own', SAMPLE_FRONTMATTER, '# someone else\n');
  const before = snapshotTree(root);
  assert.throws(() => renderSkillSurfaces(root), /fgos-own.*no fgOS generated marker/);
  assert.deepEqual(snapshotTree(root), before);

  const packageRoot = mkTempDir('skill-wrappers-samename-pkg-');
  writeSkill(path.join(packageRoot, 'core', 'skills'), 'fgos-own', SAMPLE_FRONTMATTER, '# own\n');
  const targetRoot = mkTempDir('skill-wrappers-samename-target-');
  writeSkill(path.join(targetRoot, '.agents', 'skills'), 'fgos-own', SAMPLE_FRONTMATTER, '# someone else\n');
  const targetBefore = snapshotTree(targetRoot);
  assert.throws(() => materializeSkillsIntoProject(packageRoot, targetRoot), /fgos-own.*no fgOS generated marker/);
  assert.deepEqual(snapshotTree(targetRoot), targetBefore);
  assert.equal(fs.existsSync(path.join(targetRoot, '.claude')), false);
});

test('a skill directory carrying any form an earlier release wrote is overwritten, and an empty one is written into', () => {
  const packageRoot = mkTempDir('skill-wrappers-forms-pkg-');
  writeSkill(path.join(packageRoot, 'core', 'skills'), 'fgos-own', SAMPLE_FRONTMATTER, '# new\n');
  writeSkill(path.join(packageRoot, 'core', 'skills'), 'fgos-empty', SAMPLE_FRONTMATTER, '# new\n');
  const sources = {
    assembled: (target) => writeSkill(path.join(target, '.agents', 'skills'), 'fgos-own', SAMPLE_FRONTMATTER, `${ASSEMBLED_STAMP}\n# old\n`),
    'wrapper form with the release tag only': (target) => {
      writeSkill(path.join(target, '.agents', 'skills'), 'fgos-own', SAMPLE_FRONTMATTER, '# copied verbatim by an earlier release\n');
      writeSkill(path.join(target, '.claude', 'skills'), 'fgos-own', SAMPLE_FRONTMATTER, `\n${WRAPPER_STAMPS[0]}\nold\n`);
    },
    'wrapper form with the design tag': (target) => {
      writeSkill(path.join(target, '.agents', 'skills'), 'fgos-own', SAMPLE_FRONTMATTER, '# copied verbatim\n');
      writeSkill(path.join(target, '.claude', 'skills'), 'fgos-own', SAMPLE_FRONTMATTER, `\n${WRAPPER_STAMPS[1]}\nold\n`);
    },
  };
  for (const [label, seed] of Object.entries(sources)) {
    const targetRoot = mkTempDir('skill-wrappers-forms-target-');
    seed(targetRoot);
    fs.mkdirSync(path.join(targetRoot, '.claude', 'skills', 'fgos-empty'), { recursive: true });
    materializeSkillsIntoProject(packageRoot, targetRoot);
    assert.match(fs.readFileSync(path.join(targetRoot, '.agents', 'skills', 'fgos-own', 'SKILL.md'), 'utf8'), /# new/, label);
    assert.ok(fs.existsSync(path.join(targetRoot, '.claude', 'skills', 'fgos-empty', 'SKILL.md')), label);
  }
});

test('a package skill never overwrites a target own core skill: the copy step takes only the package own names', () => {
  const packageRoot = mkTempDir('skill-wrappers-ownfilter-pkg-');
  writeSkill(path.join(packageRoot, 'core', 'skills'), 'package-skill', SAMPLE_FRONTMATTER, '# package skill\n');
  // A render the package ships for a name its own sources no longer carry.
  writeSkill(path.join(packageRoot, '.agents', 'skills'), 'shared-name', SAMPLE_FRONTMATTER, '# stale package render\n');
  const targetRoot = mkTempDir('skill-wrappers-ownfilter-target-');
  writeSkill(path.join(targetRoot, 'core', 'skills'), 'shared-name', SAMPLE_FRONTMATTER, '# target own\n');
  // The target's own assembly stops at this link, after the copy step and before it reaches
  // shared-name, so the tree shows what the copy step alone wrote.
  writeSkill(path.join(targetRoot, 'core', 'skills'), 'other-own', SAMPLE_FRONTMATTER, '# other\n');
  fs.symlinkSync(packageRoot, path.join(targetRoot, 'core', 'skills', 'other-own', 'link'), 'dir');

  assert.throws(() => materializeSkillsIntoProject(packageRoot, targetRoot), /Symlink refused in a skill path/);

  assert.ok(fs.existsSync(path.join(targetRoot, '.agents', 'skills', 'package-skill', 'SKILL.md')), 'the package own skill is copied');
  assert.equal(fs.existsSync(path.join(targetRoot, '.agents', 'skills', 'shared-name')), false, 'the copy step wrote a skill the package does not own');
});
