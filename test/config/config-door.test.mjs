// One wiring proof per entry of the addon's `config` namespace. What a value means (merge, scope, validation, the
// findings and repairs, the header file) is owned by the fgos-config crate tests: golden_snapshot, golden_doctor,
// golden_init, machine_view and detect_path. These cases prove only that each entry reaches the crate through the
// door, answers JSON text with no prototype on any object, and refuses by failure id without echoing a value.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { combinedAbiMatches, fromDoorJson, nativeDoor } from '../../src/native/door.mjs';
import { initFixtureRepo } from '../helpers/git-fixture.mjs';
import { readRawProjectConfig } from '../helpers/config-fixture.mjs';

// The door resolves the main checkout through a Git driver that keeps its directories under the state root.
process.env.FGOS_STATE_HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'config-door-state-'));
const SECRET = 'SENTINEL-7731';

const dirs = (name) => {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), `config-door-${name}-`)));
  const home = path.join(root, 'home');
  fs.mkdirSync(path.join(home, '.fgos'), { recursive: true });
  fs.mkdirSync(path.join(root, 'project/.fgos'), { recursive: true });
  return { root, project: path.join(root, 'project'), global: path.join(home, '.fgos') };
};
const lay = (file, text) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text); };
const call = (entry, args) => fromDoorJson(nativeDoor().config[entry](args), { nullPrototype: true });
const refusal = (entry, args) => {
  try { nativeDoor().config[entry](args); } catch (err) { return JSON.parse(err.message); }
  throw new assert.AssertionError({ message: `${entry} did not refuse` });
};
const mode = (file) => (fs.statSync(file).mode & 0o777).toString(8);

test('the addon marker names the config namespace at the version this payload calls', () => {
  const v = nativeDoor().versions();
  assert.equal(v.config, 3);
  assert.equal(combinedAbiMatches(v, v.napi), true);
  assert.equal(combinedAbiMatches({ ...v, config: 2 }, v.napi), false, 'an addon before standardValue');
  assert.equal(combinedAbiMatches({ ...v, config: undefined }, v.napi), false, 'an addon with no config namespace');
});

test('accounts reads the pools beside a broken project and global file, as objects with no prototype', () => {
  const d = dirs('accounts');
  lay(path.join(d.project, '.fgos/config.yaml'), 'runner: [broken\n');
  lay(path.join(d.global, 'config.yaml'), 'gateway: {broken\n');
  lay(path.join(d.global, 'private/accounts.yaml'), 'runner:\n  llmAccounts:\n    main:\n      acc1: {login: ~/.one}\n');
  const read = call('accounts', { globalDir: d.global, class: 'unconfined' });
  assert.deepEqual([read.present, read.state, read.revision.length], [true, 'present', 64]);
  assert.equal(read.runner.llmAccounts.main.acc1.login, '~/.one');
  for (const node of [read, read.runner, read.runner.llmAccounts, read.runner.llmAccounts.main]) assert.equal(Object.getPrototypeOf(node), null);
});

test('accounts has no pools for a missing file and never opens the file for a confined session', () => {
  const d = dirs('accounts-none');
  const missing = call('accounts', { globalDir: d.global, class: 'unconfined' });
  assert.deepEqual([missing.present, missing.state, missing.revision], [false, 'present', null]);
  // A directory where the file belongs: opening it as a file would fail, so an answer proves it was not opened.
  fs.mkdirSync(path.join(d.global, 'private/accounts.yaml'), { recursive: true });
  const confined = call('accounts', { globalDir: d.global, class: 'confined' });
  assert.deepEqual([confined.present, confined.state], [false, 'unavailable-confined']);
});

test('check lists the findings of a project and the machine with the doctor severity and never a value', () => {
  const d = dirs('check');
  lay(path.join(d.project, '.fgos/config.yaml'), `runner: [${SECRET},\n`);
  lay(path.join(d.global, 'config.json'), '{}');
  const { findings } = call('check', { projectRoot: d.project, globalDir: d.global, class: 'unconfined' });
  const row = (id) => findings.find((f) => f.row === id);
  assert.equal(row('config-parse').severity, 'fail');
  assert.equal(row('config-parse').file.endsWith('config.yaml'), true);
  assert.equal(Number.isInteger(row('config-parse').line), true);
  assert.equal(row('config-format-legacy-json').severity, 'fail');
  assert.equal(JSON.stringify(findings).includes(SECRET), false);
  assert.equal(Object.getPrototypeOf(findings[0]), null);
  const only = call('check', { projectRoot: d.project, globalDir: d.global, class: 'unconfined', rows: ['config-format-legacy-json'] });
  assert.deepEqual(only.findings.map((f) => f.row), ['config-format-legacy-json']);
});

test('fix creates the machine files once as the repair a check offered and refuses a confined session', () => {
  const d = dirs('fix');
  const args = { projectRoot: d.project, globalDir: d.global, class: 'unconfined', ids: ['create-machine-files', 'not-a-repair'] };
  const first = call('fix', args);
  assert.deepEqual(first.changed.map((c) => [c.fix, c.path]), [['create-machine-files', 'private/gateway-token']]);
  assert.deepEqual(first.skipped, ['not-a-repair']);
  assert.deepEqual([mode(path.join(d.global, 'private')), mode(path.join(d.global, 'private/gateway-token'))], ['700', '600']);
  assert.deepEqual(call('fix', args).changed, [], 'a second run changes nothing');
  assert.equal(refusal('fix', { ...args, class: 'confined' }).id, 'config-write-confined');
});

test('snapshot is the standard under a project value, narrowed to the sections asked for, with where each came from', () => {
  const d = dirs('snapshot');
  lay(path.join(d.project, '.fgos/config.yaml'), '# @fgos:v1\nrunner:\n  timeoutMs: 120000\n');
  const all = call('snapshot', { projectRoot: d.project, globalDir: d.global, class: 'unconfined' });
  assert.equal(all.value.runner.timeoutMs, 120000);
  assert.equal(all.value.gateBypass.level, 'off', 'a key no file sets is the standard');
  assert.equal(all.accounts, 'present');
  assert.equal(all.revisions.project.length, 64);
  assert.equal(Object.getPrototypeOf(all.value.runner), null);
  const part = call('snapshot', { projectRoot: d.project, globalDir: d.global, class: 'unconfined', sections: ['gateBypass'], origins: ['runner.timeoutMs'] });
  assert.deepEqual(Object.keys(part.value), ['gateBypass']);
  const [origin] = part.origins;
  assert.deepEqual([origin.path, origin.layer, origin.line], ['runner.timeoutMs', 'project', 3]);
  assert.equal(origin.file.endsWith('config.yaml'), true);
});

// The machine view (no project root, never a project file, no accounts layer when confined) is owned by
// packages/config/rust/tests/machine_view.rs.

test('a linked worktree takes command values from the main checkout and a plain directory is its own root', () => {
  const d = dirs('trusted');
  const main = path.join(d.root, 'main');
  fs.mkdirSync(main);
  initFixtureRepo(main);
  lay(path.join(main, '.fgos/config.yaml'), '# @fgos:v1\ninvariantChecks:\n  commands: [trusted-check]\n');
  const linked = path.join(d.root, 'linked');
  execFileSync('git', ['worktree', 'add', '-q', linked, '-b', 'linked'], { cwd: main });
  lay(path.join(linked, '.fgos/config.yaml'), '# @fgos:v1\ninvariantChecks:\n  commands: [planted-check]\n');
  const read = (project) => call('snapshot', { projectRoot: project, globalDir: d.global, class: 'unconfined', sections: ['invariantChecks'] }).value.invariantChecks.commands;
  assert.deepEqual(read(linked), ['trusted-check']);
  assert.deepEqual(read(linked), ['trusted-check'], 'the memoised root answers the same');
  assert.deepEqual(read(main), ['trusted-check']);
  lay(path.join(d.project, '.fgos/config.yaml'), '# @fgos:v1\ninvariantChecks:\n  commands: [own-check]\n');
  assert.deepEqual(read(d.project), ['own-check']);
});

test('snapshot refuses by failure id, listing every refusal with its position and no value', () => {
  const d = dirs('refused');
  lay(path.join(d.project, '.fgos/config.yaml'), `gateway:\n  port: ${SECRET}\n  bind: ${SECRET}\n`);
  const failure = refusal('snapshot', { projectRoot: d.project, globalDir: d.global, class: 'unconfined' });
  assert.equal(failure.id, failure.refusals[0].id);
  assert.deepEqual(failure.refusals.map((r) => [r.id, r.path, r.line]), [['config-key-out-of-scope', 'gateway.bind', 3], ['config-key-out-of-scope', 'gateway.port', 2]]);
  assert.equal(failure.refusals.every((r) => r.file.endsWith('config.yaml')), true);
  assert.equal(JSON.stringify(failure).includes(SECRET), false);
  assert.equal(refusal('snapshot', { globalDir: d.global, class: 'maybe' }).id, 'config-request-invalid');
  assert.equal(refusal('snapshot', { globalDir: 'relative', class: 'unconfined' }).keyword, 'globalDir');
  assert.equal(refusal('snapshot', { globalDir: d.global, class: 'unconfined', surprise: 1 }).id, 'config-request-invalid');
});

// The header-only file, keeping an existing yaml or legacy json file and the other refusals of init are owned by
// packages/config/rust/tests/golden_init.rs; this proves only the door's wiring: the entry, no prototype, one refusal by id.
test('init reaches the crate through the door, answers with no prototype and refuses a confined session by id', () => {
  const d = dirs('init');
  const args = { projectRoot: d.project, globalDir: d.global, class: 'unconfined', target: 'project' };
  const made = call('init', args);
  assert.deepEqual([made.created, made.file, Object.getPrototypeOf(made)], [true, 'config.yaml', null]);
  assert.match(readRawProjectConfig(d.project), /^# @fgos:v1\n/);
  assert.equal(refusal('init', { ...args, class: 'confined' }).id, 'config-write-confined');
});
