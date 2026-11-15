// `fgos wire-agents` parity table: every call the base release answers, on a fresh world per entry (a project, its
// own HOME holding the person's agent config, a `bin` directory with a fake `claude` that keeps its marketplace and
// plugin state and a log of every call, and optionally an `agy`). Each case compares the answers (exit status, text
// or envelope, stderr), the `claude` argv log, and everything the run left on disk (HOME, project and fake state),
// with the backup time and the world root replaced by tokens. The host starts no Node process for any case.
//
// `cwd`: `repo`, `sub` (a subdirectory of it), `outside` (a directory that is no repository), `linked` (a linked
// worktree of `repo`). `world` options of a case: `claude` (default true), `agy`, `mailbox` (the project opts in),
// `settings` (the Claude settings file exists), `plugins` (the plugin files exist), `failAdd`, `failInstall`,
// `installed` (the plugin is already installed), `lockPlugins` (the plugin directory refuses a write).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { strict as assert } from 'node:assert';

import { runCaseOnEntry } from '../harness.mjs';
import { initFixtureRepo } from '../../helpers/git-fixture.mjs';
import { writeProjectConfig } from '../../helpers/config-fixture.mjs';

export const cases = [];

const call = (args, extra = {}) => ({ args: ['wire-agents', ...args], ...extra });
const add = (id, steps, world = {}) => cases.push({ id: `wire-agents-${id}`, steps, world });

const FILES = { settings: true, plugins: true };

// Reading and planning.
add('plan-text', [call([])], FILES);
add('plan-json', [call(['--json'])], FILES);
add('plan-no-agent-config-files', [call([])]);
add('plan-claude-and-agy', [call([])], { ...FILES, agy: true });
add('plan-agy-only', [call(['--json'])], { claude: false, agy: true });
add('plan-no-agent-present', [call([])], { claude: false });
add('plan-no-agent-present-json', [call(['--json'])], { claude: false });
add('plan-mailbox-opt-in-lists-the-accept-setting', [call([])], { ...FILES, mailbox: true });
add('plan-mailbox-opt-in-json', [call(['--json'])], { ...FILES, mailbox: true });
add('plan-plugin-already-installed', [call([])], { ...FILES, installed: true });
add('plan-from-a-subdirectory', [call([], { cwd: 'sub' })], FILES);
add('plan-from-a-linked-worktree', [{ do: 'linkedWorktree' }, call([], { cwd: 'linked' })], FILES);
add('plan-outside-any-repository', [call([], { cwd: 'outside' })], FILES);
add('yes-with-an-empty-value-only-plans', [call(['--yes', ''])], FILES);
add('json-with-an-empty-value-prints-text', [call(['--json', ''])], FILES);

// `--dir` is accepted and ignored: the project is where the call runs.
add('dir-names-another-place', [call(['--dir', '/nonexistent/fgos-parity-project'])], FILES);
add('dir-names-a-file', [call(['--dir', '/etc/hostname'])], FILES);
add('dir-empty', [call(['--dir', ''])], FILES);
add('dir-bare', [call(['--dir'])], FILES);

// Writing.
add('yes', [call(['--yes'])], FILES);
add('yes-json', [call(['--yes', '--json'])], FILES);
add('yes-with-a-value-still-applies', [call(['--yes', 'x'])], FILES);
add('yes-without-agent-config-files', [call(['--yes'])]);
add('yes-claude-and-agy-writes-no-permission', [call(['--yes'])], { ...FILES, agy: true, mailbox: true });
add('yes-twice-the-second-has-nothing-to-change', [call(['--yes']), call(['--yes'])], FILES);
add('yes-with-the-plugin-already-installed', [call(['--yes'])], { ...FILES, installed: true });
add('yes-with-claude-absent', [call(['--yes'])], { claude: false });
add('yes-with-agy-only-writes-nothing', [call(['--yes'])], { claude: false, agy: true });
add('yes-with-a-failing-marketplace-add', [call(['--yes'])], { ...FILES, failAdd: true });
add('yes-with-a-failing-marketplace-add-json', [call(['--yes', '--json'])], { ...FILES, failAdd: true });
add('yes-with-a-failing-install', [call(['--yes'])], { ...FILES, failInstall: true });
add('yes-with-a-backup-that-cannot-be-written', [call(['--yes'])], { ...FILES, lockPlugins: true });
add('yes-from-a-subdirectory', [call(['--yes'], { cwd: 'sub' })], FILES);
add('yes-outside-any-repository', [call(['--yes'], { cwd: 'outside' })], FILES);

// Refused calls: the flag text is the registry's, and the call writes nothing.
add('unknown-flag', [call(['--bogus'])], FILES);
add('unknown-flag-after-known', [call(['--yes', '--zeta'])], FILES);
add('yes-with-equals', [call(['--yes=1'])], FILES);
add('json-with-equals', [call(['--json=1'])], FILES);
add('dir-with-equals', [call(['--dir=/tmp'])], FILES);

const STAMP = /\d{8}T\d{9}Z/g;
const ISO = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z/g;

function makeWorld(options) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'p08par-')));
  const dirs = Object.fromEntries(['repo', 'home', 'tmp', 'state', 'outside', 'bin', 'claude-state'].map((name) => [name, path.join(root, name)]));
  for (const dir of Object.values(dirs)) fs.mkdirSync(dir);
  fs.chmodSync(dirs.state, 0o700);
  initFixtureRepo(dirs.repo);
  fs.mkdirSync(path.join(dirs.repo, 'sub'));
  if (options.mailbox) writeProjectConfig(dirs.repo, { mailbox: { enabled: true } });
  const claudeDir = path.join(dirs.home, '.claude');
  if (options.settings) {
    fs.mkdirSync(claudeDir, { recursive: true });
    fs.writeFileSync(path.join(claudeDir, 'settings.json'), '{\n  "theme": "dark"\n}\n', { mode: 0o600 });
  }
  if (options.plugins) {
    fs.mkdirSync(path.join(claudeDir, 'plugins'), { recursive: true });
    fs.writeFileSync(path.join(claudeDir, 'plugins', 'known_marketplaces.json'), '{}\n');
  }
  const flag = (name, on) => on && fs.writeFileSync(path.join(dirs['claude-state'], name), '');
  flag('failAdd', options.failAdd);
  flag('failInstall', options.failInstall);
  flag('installed', options.installed);
  const log = path.join(root, 'calls.log');
  const state = dirs['claude-state'];
  const script = path.join(dirs.bin, 'fake-claude');
  fs.writeFileSync(script, `#!/bin/sh
echo "$*" >> '${log}'
case "$*" in
  '--version') echo '1.0.0 (fake)';;
  'plugin marketplace list --json') if [ -e '${state}/market' ] || [ -e '${state}/installed' ]; then printf '[{"name":"fgos-plugins"}]'; else printf '[]'; fi;;
  'plugin list --json') if [ -e '${state}/plugin' ] || [ -e '${state}/installed' ]; then printf '[{"id":"fgOS@fgos-plugins","enabled":true}]'; else printf '[]'; fi;;
  'plugin marketplace add '*) if [ -e '${state}/failAdd' ]; then echo 'fake add failure' >&2; exit 1; fi; : > '${state}/market';;
  'plugin install '*) if [ -e '${state}/failInstall' ]; then echo 'fake install failure' >&2; exit 1; fi; : > '${state}/plugin';;
  *) echo "fake-claude: unrecognized args $*" >&2; exit 1;;
esac
`, { mode: 0o755 });
  if (options.agy) fs.writeFileSync(path.join(dirs.bin, 'agy'), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  return { root, ...dirs, claude: options.claude !== false ? script : '/nonexistent/fgos-parity-claude', lock: options.lockPlugins, log };
}

function act(world, step) {
  assert.equal(step.do, 'linkedWorktree', `unknown action ${step.do}`);
  world.linked = path.join(world.root, 'linked');
  execFileSync('git', ['-C', world.repo, 'worktree', 'add', '-q', '--detach', world.linked, 'HEAD'], { stdio: 'ignore' });
}

const cwdOf = (world, name = 'repo') => ({ repo: world.repo, sub: path.join(world.repo, 'sub'), outside: world.outside, linked: world.linked })[name] ?? assert.fail(`unknown cwd ${name}`);

function normaliser(world) {
  return (text) => text.replaceAll(world.root, '<WORLD>').replace(STAMP, '<STAMP>').replace(ISO, '<TS>').replace(/"writer":\{"id":\d+/g, '"writer":{"id":<PID>').replace(/"(?:data_hash|generated_at)": "[^"]*",?\s*/g, '').replace(/(--[a-z-]+)=(?:<\d+>|1\b|\/tmp\b)/g, '$1=<V>');
}

/** What a run left under the world, relative to it: each file's path, mode and normalised text, the Git internals left out. */
function disk(world, norm) {
  const out = {};
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(dir, entry.name);
      const rel = norm(path.relative(world.root, full)).replace(STAMP, '<STAMP>');
      if (entry.name === '.git' || rel.includes('.fgos/runtime') || rel.startsWith('bin/') || rel.startsWith('state/git-')) continue;
      if (entry.isDirectory()) {
        out[`${rel}/`] = null;
        walk(full);
      } else if (entry.isFile()) {
        out[rel] = `${(fs.statSync(full).mode & 0o777).toString(8)} ${norm(fs.readFileSync(full, 'utf8'))}`;
      }
    }
  };
  walk(world.root);
  return out;
}

async function runScript(entry, testCase) {
  const options = { ...testCase.world, claude: testCase.world.claude !== false };
  const world = makeWorld(options);
  const norm = normaliser(world);
  const outputs = [];
  const children = [];
  const unlock = [];
  try {
    if (world.lock) {
      const plugins = path.join(world.home, '.claude', 'plugins');
      fs.chmodSync(plugins, 0o500);
      unlock.push(plugins);
    }
    for (const step of testCase.steps) {
      if (step.do) {
        act(world, step);
        continue;
      }
      const result = await runCaseOnEntry(entry, {
        id: testCase.id,
        args: step.args,
        cwd: cwdOf(world, step.cwd),
        env: {
          HOME: world.home,
          USERPROFILE: world.home,
          TMPDIR: world.tmp,
          FGOS_STATE_ROOT: world.state,
          FGOS_CLAUDE_COMMAND: world.claude,
          PATH: `${world.bin}${path.delimiter}${process.env.PATH}`,
          CLAUDE_CONFIG_DIR: '',
          NO_COLOR: '1',
        },
        timeoutMs: 120000,
        modes: ['exact-bytes'],
      });
      assert.equal(result.launchError, null, `${testCase.id}: ${JSON.stringify(result.launchError)}`);
      children.push(...result.spawnedChildren);
      outputs.push({ args: step.args, exit: result.exitCode, stdout: norm(result.stdoutText), stderr: norm(result.stderrText) });
    }
    // A run leaves no store above its own tree: a stray `.fgos` there would make a later fixture treat that directory as its project.
    for (let dir = path.dirname(world.root); ; dir = path.dirname(dir)) {
      assert.ok(!fs.existsSync(path.join(dir, '.fgos')), `${testCase.id}: a run left ${path.join(dir, '.fgos')} above its fixture`);
      if (dir === path.dirname(dir)) break;
    }
    assert.ok(!fs.existsSync(path.join(world.outside, '.fgos')), `${testCase.id}: a run created a store outside any repository`);
    return { outputs, disk: disk(world, norm), children };
  } finally {
    for (const dir of unlock) fs.chmodSync(dir, 0o755);
    fs.rmSync(world.root, { recursive: true, force: true });
  }
}

/** Runs one case on the base release (entry A) and the host (entry B), each on a fresh world, and compares them. */
export async function runPreparedCase(entryA, entryB, testCase) {
  const differences = [];
  try {
    const [base, host] = [await runScript(entryA, testCase), await runScript(entryB, testCase)];
    const same = (left, right, what) => {
      try { assert.deepEqual(left, right); } catch (error) { differences.push(`${what} differ: ${error.message.split('\n').slice(0, 60).join('\n')}`); }
    };
    same(host.outputs, base.outputs, 'the calls');
    same(host.disk, base.disk, 'what the run left on disk (HOME, project, claude calls and state)');
    const nodeStarts = host.children.filter((child) => path.basename(child.cmd) === 'node').length;
    if (nodeStarts > 0) differences.push(`the host started ${nodeStarts} node child(ren)`);
  } catch (error) {
    differences.push(String(error.message ?? error));
  }
  return { caseId: testCase.id, passed: differences.length === 0, differences };
}
