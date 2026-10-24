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
import { combinedAbiMatches, fromDoorJson, nativeDoor } from '../../src/native/door.mjs';

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
  assert.equal(v.config, 1);
  assert.equal(combinedAbiMatches(v, v.napi), true);
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
  assert.equal(row('config-format-legacy-json').severity, 'warn');
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
