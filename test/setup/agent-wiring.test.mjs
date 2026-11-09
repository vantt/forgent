// agent-wiring.test.mjs -- fgOS writes a person's own agent config (~/.claude, ~/.gemini, ...)
// only through the opt-in `fgos wire-agents`: init, setup and doctor --fix leave HOME alone
// outside ~/.fgos, and the opt-in command acts only on agents present, prints every file it
// changes, backs each one up first and never sets a permission. Every case runs against a
// throwaway HOME and a fake `claude` (FGOS_CLAUDE_COMMAND) whose state lives outside that HOME.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { initFixtureRepo } from '../helpers/git-fixture.mjs';
import { writeProjectConfig } from '../helpers/config-fixture.mjs';
import { applyAgentWiring, planAgentWiring } from '../../src/setup/agent-wiring.mjs';

const FGOS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../bin/fgos.mjs');
const WINDOWS = process.platform === 'win32';

function mkTemp(prefix) {
  return fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
}

/** A fake `claude` keeping its marketplace/plugin state and a log of every call in `dir` (never in HOME).
 * `requireBackupsOf` names files whose `.pre-wire-agents-*` copy must already exist when a changing call runs. */
function fakeClaude(dir, state, { requireBackupsOf = [] } = {}) {
  const statePath = path.join(dir, 'state.json');
  const logPath = path.join(dir, 'calls.log');
  fs.writeFileSync(statePath, JSON.stringify(state));
  const script = path.join(dir, 'fake-claude.mjs');
  fs.writeFileSync(script, `#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(logPath)}, JSON.stringify(args) + '\\n');
const read = () => JSON.parse(fs.readFileSync(${JSON.stringify(statePath)}, 'utf8'));
const write = (s) => fs.writeFileSync(${JSON.stringify(statePath)}, JSON.stringify(s));
const backedUp = (file) => fs.readdirSync(path.dirname(file)).some((n) => n.startsWith(path.basename(file) + '.pre-wire-agents-'));
const requireBackups = () => {
  for (const file of ${JSON.stringify(requireBackupsOf)}) {
    if (!backedUp(file)) { process.stderr.write('no backup of ' + file); process.exit(3); }
  }
};
if (args[0] === '--version') { process.stdout.write('1.0.0 (fake)'); process.exit(0); }
if (args.join(' ') === 'plugin marketplace list --json') { process.stdout.write(JSON.stringify(read().marketplaces)); process.exit(0); }
if (args.join(' ') === 'plugin list --json') { process.stdout.write(JSON.stringify(read().plugins)); process.exit(0); }
if (args[0] === 'plugin' && args[1] === 'marketplace' && args[2] === 'add') {
  requireBackups();
  const s = read();
  if (s.failAdd) { process.stderr.write('fake add failure'); process.exit(1); }
  s.marketplaces.push({ name: 'fgos-plugins', source: 'github', repo: args[3] }); write(s); process.exit(0);
}
if (args[0] === 'plugin' && args[1] === 'install') {
  requireBackups();
  const s = read();
  if (s.failInstall) { process.stderr.write('fake install failure'); process.exit(1); }
  s.plugins.push({ id: args[2], enabled: true }); write(s); process.exit(0);
}
process.stderr.write('fake-claude: unrecognized args ' + JSON.stringify(args)); process.exit(1);
`);
  fs.chmodSync(script, 0o755);
  let command = script;
  if (WINDOWS) {
    command = path.join(dir, 'fake-claude.cmd');
    fs.writeFileSync(command, `@node "${script}" %*`);
  }
  const calls = () => (fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);
  return { command, statePath, calls, state: () => JSON.parse(fs.readFileSync(statePath, 'utf8')) };
}

/** A directory holding an executable `agy` that does nothing, to put agy on PATH. */
function fakeAgyBin(dir) {
  const bin = path.join(dir, 'bin');
  fs.mkdirSync(bin, { recursive: true });
  if (WINDOWS) fs.writeFileSync(path.join(bin, 'agy.cmd'), '@exit /b 0\r\n');
  else {
    fs.writeFileSync(path.join(bin, 'agy'), '#!/bin/sh\nexit 0\n');
    fs.chmodSync(path.join(bin, 'agy'), 0o755);
  }
  return bin;
}

/** Every file and directory under `root` except `.fgos`, with a content hash for files. */
function snapshotHome(root) {
  const out = {};
  const walk = (dir, rel) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const relPath = path.posix.join(rel, entry.name);
      if (relPath === '.fgos') continue;
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        out[`${relPath}/`] = 'dir';
        walk(abs, relPath);
      } else {
        out[relPath] = crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
      }
    }
  };
  walk(root, '');
  return out;
}

const CHANGING_CLAUDE_CALLS = (calls) => calls.filter((args) => args[0] === 'plugin' && ['add', 'install'].includes(args[args[1] === 'marketplace' ? 2 : 1]));

function runFgos(cwd, args, env) {
  return spawnSync(process.execPath, [FGOS, ...args], { cwd, encoding: 'utf8', env });
}

test('init, doctor --fix and setup write nothing in HOME outside ~/.fgos and change no Claude state, with claude and agy present and the mailbox on', () => {
  const work = mkTemp('agent-wiring-untouched-');
  const home = path.join(work, 'home');
  fs.mkdirSync(path.join(home, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(home, '.claude', 'settings.json'), '{\n  "theme": "dark"\n}\n');
  const repo = initFixtureRepo(fs.mkdirSync(path.join(work, 'repo'), { recursive: true }), { branch: 'main' });
  writeProjectConfig(repo, { mailbox: { enabled: true } });
  const claude = fakeClaude(work, { marketplaces: [], plugins: [] });
  const env = {
    ...process.env,
    HOME: home,
    USERPROFILE: home,
    FGOS_CLAUDE_COMMAND: claude.command,
    PATH: `${fakeAgyBin(work)}${path.delimiter}${process.env.PATH}`,
  };
  delete env.CLAUDE_CONFIG_DIR;
  const before = snapshotHome(home);

  for (const args of [['init'], ['doctor', '--fix'], ['setup']]) {
    const result = runFgos(repo, args, env);
    assert.equal(result.status, 0, `fgos ${args.join(' ')} failed: ${result.stderr}`);
  }

  assert.deepEqual(snapshotHome(home), before, 'HOME outside ~/.fgos must be byte-identical');
  assert.deepEqual(CHANGING_CLAUDE_CALLS(claude.calls()), [], 'no claude command that changes Claude state may run');
  fs.rmSync(work, { recursive: true, force: true });
});

test('wire-agents without --yes prints every file it would change and every permission it leaves to you, and changes nothing', () => {
  const work = mkTemp('agent-wiring-plan-');
  const home = path.join(work, 'home');
  fs.mkdirSync(path.join(home, '.claude'), { recursive: true });
  const claudeSettings = path.join(home, '.claude', 'settings.json');
  fs.writeFileSync(claudeSettings, '{}\n');
  const repo = initFixtureRepo(fs.mkdirSync(path.join(work, 'repo'), { recursive: true }), { branch: 'main' });
  writeProjectConfig(repo, { mailbox: { enabled: true } });
  const claude = fakeClaude(work, { marketplaces: [], plugins: [] });
  const env = { ...process.env, HOME: home, USERPROFILE: home, FGOS_CLAUDE_COMMAND: claude.command, PATH: `${fakeAgyBin(work)}${path.delimiter}${process.env.PATH}` };
  delete env.CLAUDE_CONFIG_DIR;
  const before = snapshotHome(home);

  const text = runFgos(repo, ['wire-agents'], env);
  assert.equal(text.status, 0, text.stderr);
  assert.ok(text.stdout.includes(claudeSettings), 'the plan names the Claude settings file');
  assert.ok(text.stdout.includes(path.join(home, '.claude', 'plugins', 'known_marketplaces.json')));
  assert.ok(text.stdout.includes(path.join(home, '.gemini', 'antigravity-cli', 'settings.json')), 'the agy permission names its file');
  assert.match(text.stdout, /--yes/);

  const json = runFgos(repo, ['wire-agents', '--json'], env);
  assert.equal(json.status, 0, json.stderr);
  const { data } = JSON.parse(json.stdout);
  assert.equal(data.applied, false);
  const byAgent = Object.fromEntries(data.agents.map((a) => [a.agent, a]));
  assert.deepEqual(Object.keys(byAgent).sort(), ['agy', 'claude']);
  assert.deepEqual(byAgent.claude.changes.map((c) => c.id), ['claude-plugin']);
  assert.deepEqual(byAgent.claude.permissions.map((p) => Object.keys(p.set)), [['crossSessionInbound']]);
  assert.deepEqual(byAgent.agy.changes, []);
  assert.equal(byAgent.agy.permissions[0].set.toolPermission, 'always-proceed', 'the edit is shown to the person, never written');

  assert.deepEqual(snapshotHome(home), before);
  assert.deepEqual(CHANGING_CLAUDE_CALLS(claude.calls()), []);
  fs.rmSync(work, { recursive: true, force: true });
});

test('wire-agents --yes backs up each existing file before the claude CLI changes it, then registers the plugin and never writes a permission', () => {
  const work = mkTemp('agent-wiring-apply-');
  const home = path.join(work, 'home');
  const claudeDir = path.join(home, '.claude');
  fs.mkdirSync(path.join(claudeDir, 'plugins'), { recursive: true });
  const claudeSettings = path.join(claudeDir, 'settings.json');
  const marketplaces = path.join(claudeDir, 'plugins', 'known_marketplaces.json');
  fs.writeFileSync(claudeSettings, '{"theme":"dark"}\n', { mode: 0o600 });
  fs.writeFileSync(marketplaces, '{}\n');
  const repo = initFixtureRepo(fs.mkdirSync(path.join(work, 'repo'), { recursive: true }), { branch: 'main' });
  writeProjectConfig(repo, { mailbox: { enabled: true } });
  const claude = fakeClaude(work, { marketplaces: [], plugins: [] }, { requireBackupsOf: [claudeSettings, marketplaces] });
  const env = { ...process.env, HOME: home, USERPROFILE: home, FGOS_CLAUDE_COMMAND: claude.command, PATH: `${fakeAgyBin(work)}${path.delimiter}${process.env.PATH}` };
  delete env.CLAUDE_CONFIG_DIR;

  const result = runFgos(repo, ['wire-agents', '--yes', '--json'], env);
  assert.equal(result.status, 0, result.stderr);
  const { data } = JSON.parse(result.stdout);
  assert.equal(data.applied, true);
  assert.deepEqual(data.failed, []);
  assert.deepEqual(data.backups.map((b) => b.file).sort(), [claudeSettings, marketplaces].sort(), 'only files that exist are backed up');
  for (const { file, backup } of data.backups) {
    assert.ok(path.basename(backup).startsWith(`${path.basename(file)}.pre-wire-agents-`));
    assert.equal(path.dirname(backup), path.dirname(file));
  }
  const settingsBackup = data.backups.find((b) => b.file === claudeSettings).backup;
  assert.equal(fs.readFileSync(settingsBackup, 'utf8'), '{"theme":"dark"}\n');
  if (!WINDOWS) assert.equal(fs.statSync(settingsBackup).mode & 0o777, 0o600, 'a backup keeps the private mode');

  assert.deepEqual(claude.state(), {
    marketplaces: [{ name: 'fgos-plugins', source: 'github', repo: 'vantt/forgent' }],
    plugins: [{ id: 'fgOS@fgos-plugins', enabled: true }],
  });
  assert.equal(fs.readFileSync(claudeSettings, 'utf8'), '{"theme":"dark"}\n', 'crossSessionInbound is left to the person');
  assert.equal(fs.existsSync(path.join(home, '.gemini')), false, 'always-proceed is never written');
  fs.rmSync(work, { recursive: true, force: true });
});

test('the plan holds only agents present on the machine: no claude and no agy means nothing to change', () => {
  const home = mkTemp('agent-wiring-absent-home-');
  const plan = planAgentWiring(home, { env: { HOME: home, PATH: '', FGOS_CLAUDE_COMMAND: path.join(home, 'no-claude-here') }, home });
  assert.deepEqual(plan.agents, []);
  assert.deepEqual(plan.absent.sort(), ['agy', 'claude']);
  const applied = applyAgentWiring(plan);
  assert.deepEqual(applied, { applied: true, backups: [], done: [], failed: [] });
  assert.deepEqual(fs.readdirSync(home), []);
  fs.rmSync(home, { recursive: true, force: true });
});

test('wire-agents has nothing to change once the plugin is installed, and reports a failing claude step instead of swallowing it', () => {
  const work = mkTemp('agent-wiring-claude-states-');
  const home = path.join(work, 'home');
  fs.mkdirSync(home);
  // The fake claude is a node script; agy stays off PATH.
  const env = { HOME: home, PATH: path.dirname(process.execPath) };
  const claudeOf = (plan) => plan.agents.find((a) => a.agent === 'claude');

  const done = fakeClaude(fs.mkdtempSync(path.join(work, 'done-')), {
    marketplaces: [{ name: 'fgos-plugins', source: 'directory', path: '/dev/checkout' }],
    plugins: [{ id: 'fgOS@fgos-plugins', enabled: true }],
  });
  const settled = planAgentWiring(home, { env: { ...env, FGOS_CLAUDE_COMMAND: done.command }, home });
  assert.deepEqual(claudeOf(settled).changes, []);

  const onlyInstall = fakeClaude(fs.mkdtempSync(path.join(work, 'install-')), {
    marketplaces: [{ name: 'fgos-plugins', source: 'directory', path: '/dev/checkout' }],
    plugins: [],
  });
  const installPlan = planAgentWiring(home, { env: { ...env, FGOS_CLAUDE_COMMAND: onlyInstall.command }, home });
  assert.deepEqual(claudeOf(installPlan).changes[0].commands, ['claude plugin install fgOS@fgos-plugins'], 'an existing marketplace is never re-added');

  const failing = fakeClaude(fs.mkdtempSync(path.join(work, 'fail-')), { marketplaces: [], plugins: [], failInstall: true });
  const failingEnv = { ...env, FGOS_CLAUDE_COMMAND: failing.command };
  const result = applyAgentWiring(planAgentWiring(home, { env: failingEnv, home }), { env: failingEnv });
  assert.equal(result.failed.length, 1);
  assert.match(result.failed[0].error, /claude plugin install fgOS@fgos-plugins.*failed/s);
  assert.deepEqual(failing.state().marketplaces, [{ name: 'fgos-plugins', source: 'github', repo: 'vantt/forgent' }], 'the step that ran is kept');
  fs.rmSync(work, { recursive: true, force: true });
});
