// The project half of an uninstall: what fgOS wrote into a project's agent configs and skill folders
// is taken out, and everything that is the person's stays. No other test proves the reversal of the
// hook table or of the generated skill stamps; the git-hook reversal keeps its owner in
// uninstall-wiring.test.mjs and the CLI round trip in uninstall-wiring-2/3.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { writeRawProjectConfig } from '../helpers/config-fixture.mjs';
import { initFixtureRepo } from '../helpers/git-fixture.mjs';
import { installAgyHook, installClaudeHook, installCodexHook, installOmpHook } from '../../src/setup/agent-hooks.mjs';
import { materializeSkillsIntoProject } from '../../src/setup/skill-wrappers.mjs';
import { uninstallProject } from '../../src/setup/uninstall-project.mjs';

const SKILL = '---\nname: alpha\ndescription: a skill\n---\n# alpha\n';

function mkTemp(prefix) {
  return fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
}

/** A package root with two skills and a shared fragment, as a release carries them. */
function makePackage() {
  const pkg = mkTemp('uninstall-pkg-');
  for (const name of ['alpha', 'beta']) {
    fs.mkdirSync(path.join(pkg, 'core', 'skills', name), { recursive: true });
    fs.writeFileSync(path.join(pkg, 'core', 'skills', name, 'SKILL.md'), SKILL.replace('alpha', name));
  }
  fs.mkdirSync(path.join(pkg, 'core', 'skills', '_shared'), { recursive: true });
  fs.writeFileSync(path.join(pkg, 'core', 'skills', '_shared', 'note.md'), '# shared\n');
  return pkg;
}

/** A project as `fgctl init` plus `doctor --fix` leaves it: hooks for every agent, generated skills,
 * `.fgos` data and config, and a hook entry and a skill of the person's own. */
function makeProject(pkg) {
  const project = mkTemp('uninstall-project-');
  initFixtureRepo(project);
  fs.mkdirSync(path.join(project, '.codex'));
  fs.mkdirSync(path.join(project, '.agents'), { recursive: true });
  fs.mkdirSync(path.join(project, '.omp'));
  fs.mkdirSync(path.join(project, '.claude'));
  fs.writeFileSync(path.join(project, '.claude', 'settings.json'), JSON.stringify({
    model: 'opus',
    hooks: { PreToolUse: [{ matcher: 'CustomTool', hooks: [{ type: 'command', command: 'node custom-audit.mjs' }] }] },
  }, null, 2));
  installClaudeHook(project);
  installCodexHook(project);
  installAgyHook(project);
  installOmpHook(project);
  materializeSkillsIntoProject(pkg, project);
  fs.mkdirSync(path.join(project, '.fgos', 'work'), { recursive: true });
  writeRawProjectConfig(project, '# config\n');
  fs.writeFileSync(path.join(project, '.fgos', 'distribution.json'), '{"pin":"v1"}\n');
  fs.writeFileSync(path.join(project, '.fgos', 'work', 'item.json'), '{}\n');
  fs.mkdirSync(path.join(project, '.claude', 'skills', 'mine'), { recursive: true });
  fs.writeFileSync(path.join(project, '.claude', 'skills', 'mine', 'SKILL.md'), '---\nname: mine\ndescription: x\n---\nmy own\n');
  return project;
}

const read = (project, rel) => fs.readFileSync(path.join(project, rel), 'utf8');
const exists = (project, rel) => fs.existsSync(path.join(project, rel));

test('without apply the plan lists changes and keep-paths and changes nothing', () => {
  const pkg = makePackage();
  const project = makeProject(pkg);
  const before = read(project, '.claude/settings.json');
  const result = uninstallProject(project, { packageRoot: pkg, home: mkTemp('uninstall-home-') });
  assert.equal(result.applied, false);
  assert.ok(result.changes.some((line) => line.includes('.claude/settings.json')), result.changes.join('\n'));
  assert.ok(result.changes.some((line) => line.startsWith('.claude/skills: remove 2 generated skill directories (alpha, beta)')), result.changes.join('\n'));
  assert.ok(result.keeps.some((line) => line.startsWith('.fgos:')) && result.keeps.some((line) => line.startsWith('.fgos/distribution.json:')));
  assert.equal(read(project, '.claude/settings.json'), before);
  assert.ok(exists(project, '.claude/skills/alpha/SKILL.md') && exists(project, '.agents/skills/alpha/SKILL.md'));
  assert.ok(exists(project, '.omp/extensions/fgos-hooks.ts'));
  assert.deepEqual(result.backups, []);
});

test('apply removes every fgOS hook entry and generated skill, and keeps what is the person\'s', () => {
  const pkg = makePackage();
  const project = makeProject(pkg);
  const result = uninstallProject(project, { apply: true, packageRoot: pkg, home: mkTemp('uninstall-home-') });
  assert.deepEqual(result.failed, []);

  const claude = JSON.parse(read(project, '.claude/settings.json'));
  assert.equal(claude.model, 'opus');
  assert.deepEqual(claude.hooks.PreToolUse, [{ matcher: 'CustomTool', hooks: [{ type: 'command', command: 'node custom-audit.mjs' }] }]);
  assert.ok(!read(project, '.claude/settings.json').includes('.fgos/installation/bin/fgos'));
  assert.deepEqual(JSON.parse(read(project, '.codex/hooks.json')), {});
  assert.deepEqual(JSON.parse(read(project, '.agents/hooks.json')), {});
  assert.equal(exists(project, '.omp/extensions/fgos-hooks.ts'), false);
  assert.deepEqual(fs.readdirSync(path.join(project, '.omp', 'extensions')).map((n) => n.replace(/\d{8}T\d+Z$/, '<time>')), ['fgos-hooks.ts.pre-uninstall-<time>'], 'only the backup is left beside it');

  for (const rel of ['.claude/skills/alpha', '.claude/skills/beta', '.agents/skills/alpha', '.agents/skills/beta', '.agents/skills/_shared']) {
    assert.equal(exists(project, rel), false, rel);
  }
  assert.ok(exists(project, '.claude/skills/mine/SKILL.md'), 'a skill without the fgOS mark stays');

  for (const rel of ['.fgos/config.yaml', '.fgos/distribution.json', '.fgos/work/item.json']) assert.ok(exists(project, rel), rel);
});

test('every file the run rewrites or deletes is copied beside itself first', () => {
  const pkg = makePackage();
  const project = makeProject(pkg);
  const before = read(project, '.claude/settings.json');
  const ext = read(project, '.omp/extensions/fgos-hooks.ts');
  const result = uninstallProject(project, { apply: true, packageRoot: pkg, home: mkTemp('uninstall-home-') });
  const byFile = Object.fromEntries(result.backups.map((b) => [path.relative(project, b.file), b.backup]));
  assert.equal(fs.readFileSync(byFile['.claude/settings.json'], 'utf8'), before);
  assert.equal(fs.readFileSync(byFile['.omp/extensions/fgos-hooks.ts'], 'utf8'), ext);
  assert.ok(byFile['.codex/hooks.json'] && byFile['.agents/hooks.json']);
});

test('a skill directory of the same name without the fgOS mark is reported and left', () => {
  const pkg = makePackage();
  const project = makeProject(pkg);
  fs.rmSync(path.join(project, '.claude', 'skills', 'alpha'), { recursive: true });
  fs.mkdirSync(path.join(project, '.claude', 'skills', 'alpha'));
  fs.writeFileSync(path.join(project, '.claude', 'skills', 'alpha', 'SKILL.md'), '---\nname: alpha\ndescription: another tool\n---\nforeign\n');
  const result = uninstallProject(project, { apply: true, packageRoot: pkg, home: mkTemp('uninstall-home-') });
  assert.equal(read(project, '.claude/skills/alpha/SKILL.md').includes('foreign'), true);
  assert.ok(result.keeps.some((line) => line.includes('.claude/skills/alpha') && line.includes('not generated by fgOS')), result.keeps.join('\n'));
});

test('a hook of the person\'s that only mentions the shim stays and is named', () => {
  const pkg = makePackage();
  const project = makeProject(pkg);
  const file = path.join(project, '.claude', 'settings.json');
  const config = JSON.parse(fs.readFileSync(file, 'utf8'));
  const lookalike = "bash -c 'echo hook dispatch-decide' # .fgos/installation/bin/fgos";
  config.hooks.PreToolUse.push({ matcher: 'Agent', hooks: [{ type: 'command', command: lookalike }] });
  fs.writeFileSync(file, JSON.stringify(config, null, 2));
  const result = uninstallProject(project, { apply: true, packageRoot: pkg, home: mkTemp('uninstall-home-') });
  assert.ok(read(project, '.claude/settings.json').includes(lookalike));
  assert.ok(result.keeps.some((line) => line.includes('names the fgOS shim and stays')));
});

test('a linked skill directory and a linked hook file are refused, not followed', () => {
  const pkg = makePackage();
  const project = makeProject(pkg);
  const outside = mkTemp('uninstall-outside-');
  fs.writeFileSync(path.join(outside, 'SKILL.md'), 'outside\n');
  fs.rmSync(path.join(project, '.claude', 'skills', 'beta'), { recursive: true });
  fs.symlinkSync(outside, path.join(project, '.claude', 'skills', 'beta'));
  const hooks = path.join(project, '.codex', 'hooks.json');
  const target = path.join(outside, 'hooks.json');
  fs.copyFileSync(hooks, target);
  fs.rmSync(hooks);
  fs.symlinkSync(target, hooks);
  const targetBefore = fs.readFileSync(target, 'utf8');
  const result = uninstallProject(project, { apply: true, packageRoot: pkg, home: mkTemp('uninstall-home-') });
  assert.equal(fs.readFileSync(path.join(outside, 'SKILL.md'), 'utf8'), 'outside\n');
  assert.equal(fs.readFileSync(target, 'utf8'), targetBefore);
  assert.ok(fs.lstatSync(path.join(project, '.claude', 'skills', 'beta')).isSymbolicLink());
  assert.ok(result.keeps.some((line) => line.includes('symbolic link')), result.keeps.join('\n'));
});

test('the fgOS source checkout keeps its skill surfaces', () => {
  const pkg = makePackage();
  materializeSkillsIntoProject(pkg, pkg);
  const result = uninstallProject(pkg, { apply: true, packageRoot: pkg, home: mkTemp('uninstall-home-') });
  assert.ok(fs.existsSync(path.join(pkg, '.claude', 'skills', 'alpha', 'SKILL.md')));
  assert.ok(result.keeps.some((line) => line.startsWith('skills:')));
});

test('the shell profile is only named, and global agent wiring is left with how to undo it', () => {
  const pkg = makePackage();
  const project = makeProject(pkg);
  const home = mkTemp('uninstall-home-');
  const script = '/opt/fgos/scripts/fgos-shell-integration.sh';
  const rc = path.join(home, '.bashrc');
  const rcBefore = `# mine\nsource "${script}"\n`;
  fs.writeFileSync(rc, rcBefore);
  const result = uninstallProject(project, { apply: true, packageRoot: pkg, home, shellIntegrationScript: script });
  assert.equal(fs.readFileSync(rc, 'utf8'), rcBefore, 'the rc file is never edited');
  assert.ok(result.leftToYou.some((line) => line.startsWith(rc) && line.includes('by hand')), result.leftToYou.join('\n'));
  const wiring = result.leftToYou.find((line) => line.includes('fgos wire-agents'));
  assert.ok(wiring && wiring.includes('claude plugin uninstall fgOS@fgos-plugins'), result.leftToYou.join('\n'));
});

test('a linked skills root, a linked agent directory and a linked extensions directory are never walked', () => {
  const pkg = makePackage();
  const project = makeProject(pkg);
  const outside = mkTemp('uninstall-outside-');
  // The whole .agents/skills tree and the omp extensions directory live elsewhere, behind links.
  fs.cpSync(path.join(project, '.agents', 'skills'), path.join(outside, 'skills'), { recursive: true });
  fs.rmSync(path.join(project, '.agents', 'skills'), { recursive: true });
  fs.symlinkSync(path.join(outside, 'skills'), path.join(project, '.agents', 'skills'));
  fs.cpSync(path.join(project, '.omp', 'extensions'), path.join(outside, 'extensions'), { recursive: true });
  fs.rmSync(path.join(project, '.omp', 'extensions'), { recursive: true });
  fs.symlinkSync(path.join(outside, 'extensions'), path.join(project, '.omp', 'extensions'));
  const outsideBefore = fs.readdirSync(path.join(outside, 'skills')).sort();

  const result = uninstallProject(project, { apply: true, packageRoot: pkg, home: mkTemp('uninstall-home-') });
  assert.deepEqual(fs.readdirSync(path.join(outside, 'skills')).sort(), outsideBefore, 'nothing behind the link is removed');
  assert.ok(fs.existsSync(path.join(outside, 'extensions', 'fgos-hooks.ts')));
  assert.ok(result.keeps.some((line) => line.includes('.agents/skills') && line.includes('symbolic link')), result.keeps.join('\n'));
  assert.ok(result.keeps.some((line) => line.includes('.omp/extensions/fgos-hooks.ts') && line.includes('symbolic link')), result.keeps.join('\n'));
  assert.equal(exists(project, '.claude/skills/alpha'), false, 'the unlinked part is still reversed');
});

test('an empty skills directory behind a linked parent is not removed', () => {
  const pkg = makePackage();
  const project = mkTemp('uninstall-project-');
  initFixtureRepo(project);
  const outside = mkTemp('uninstall-outside-');
  fs.mkdirSync(path.join(outside, 'agents', 'skills'), { recursive: true });
  fs.symlinkSync(path.join(outside, 'agents'), path.join(project, '.agents'));
  uninstallProject(project, { apply: true, packageRoot: pkg, home: mkTemp('uninstall-home-') });
  assert.ok(fs.existsSync(path.join(outside, 'agents', 'skills')), 'the directory behind the link stays');
});
