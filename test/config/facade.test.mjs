// The facade's own shape rules over the native `config` namespace: prototype-free results, defaults computed per call,
// one error type that names file and position and never a value, and no fallback without the addon. The meaning of a
// value belongs to the crate tests and the door's wiring proof is test/config/config-door.test.mjs.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { CONFINED_MARKER_ENV as DRIVER_MARKER } from '../../src/runner/dispatch/confinement/drivers/bwrap.mjs';
import {
  CONFINED_MARKER_ENV, ConfigDoorError, checkConfig, initConfigFile, isConfigRefusal, projectConfigPresent, readConfig, readMachineAccounts, readMachineConfig, readStandardValue,
} from '../../src/config/facade.mjs';

process.env.FGOS_STATE_HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'config-facade-state-'));
const SECRET = 'SENTINEL-4417';
const facade = pathToFileURL(path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../src/config/facade.mjs')).href;

const fixture = () => {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'config-facade-')));
  const dir = { root, project: path.join(root, 'project'), global: path.join(root, 'home/.fgos') };
  fs.mkdirSync(path.join(dir.project, '.fgos'), { recursive: true });
  fs.mkdirSync(dir.global, { recursive: true });
  return dir;
};
const lay = (file, text) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text); };

test('a result has no prototype on any object, so a config key can never name one', () => {
  const dir = fixture();
  lay(path.join(dir.project, '.fgos/config.yaml'), '# @fgos:v1\ninvariantChecks:\n  commands: [one]\n');
  const { value } = readConfig({ projectRoot: dir.project, globalDir: dir.global, sections: ['invariantChecks', 'runner'] });
  assert.equal(Object.getPrototypeOf(value), null);
  assert.equal(Object.getPrototypeOf(value.runner), null);
  assert.equal(Object.getPrototypeOf(value.runner.executors), null);
  assert.equal(Array.isArray(value.invariantChecks.commands), true);
  assert.deepEqual(value.invariantChecks.commands, ['one']);
});

test('a __proto__ key is refused by the profile and no prototype changes', () => {
  const dir = fixture();
  lay(path.join(dir.global, 'config.yaml'), '# @fgos:v1\n__proto__:\n  polluted: yes\n');
  assert.throws(() => readMachineConfig({ globalDir: dir.global }), (err) => err instanceof ConfigDoorError && err.code === 'config-parse');
  assert.equal({}.polluted, undefined);
  assert.equal(Object.prototype.polluted, undefined);
});

test('the global directory and the session class are read per call, never frozen at import', () => {
  const [one, two] = [fixture(), fixture()];
  lay(path.join(one.global, 'config.yaml'), '# @fgos:v1\ngateway:\n  port: 5001\n');
  lay(path.join(two.global, 'config.yaml'), '# @fgos:v1\ngateway:\n  port: 5002\n');
  const home = process.env.HOME;
  try {
    const port = (dir) => { process.env.HOME = path.dirname(dir.global); return readMachineConfig({ sections: ['gateway'] }).value.gateway.port; };
    assert.deepEqual([port(one), port(two), port(one)], [5001, 5002, 5001]);
  } finally { process.env.HOME = home; }
  lay(path.join(one.global, 'private/accounts.yaml'), 'runner:\n  llmAccounts:\n    main:\n      acc1: {login: ~/.one}\n');
  assert.equal(readMachineConfig({ globalDir: one.global, sections: [] }).accounts, 'present');
  process.env[CONFINED_MARKER_ENV] = '1';
  try { assert.equal(readMachineConfig({ globalDir: one.global, sections: [] }).accounts, 'unavailable-confined'); } finally { delete process.env[CONFINED_MARKER_ENV]; }
  assert.equal(readMachineConfig({ globalDir: one.global, class: 'confined', sections: [] }).accounts, 'unavailable-confined', 'an argument overrides the marker');
});

test('a broken file throws one error type naming file, line, column and path and never an input value', () => {
  const dir = fixture();
  lay(path.join(dir.project, '.fgos/config.yaml'), `# @fgos:v1\nrunner:\n  timeoutMs: ${SECRET}\n`);
  assert.throws(() => readConfig({ projectRoot: dir.project, globalDir: dir.global }), (err) => {
    assert.ok(err instanceof ConfigDoorError);
    assert.equal(err.code, 'config-schema');
    const [first] = err.refusals;
    assert.deepEqual([first.file.endsWith('config.yaml'), first.line, first.path], [true, 3, 'runner.timeoutMs']);
    assert.match(err.message, /^config-schema \S*config\.yaml:3:\d+ runner\.timeoutMs/);
    assert.equal(err.message.includes(SECRET), false);
    assert.equal(isConfigRefusal(err), true);
    return true;
  });
  lay(path.join(dir.project, '.fgos/config.yaml'), `runner: [${SECRET},\n`);
  assert.throws(() => readConfig({ projectRoot: dir.project, globalDir: dir.global }), (err) => err.code === 'config-parse' && !err.message.includes(SECRET));
});

test('only a refusal about a config file is a refusal: a door failure and a foreign error are not', () => {
  const dir = fixture();
  assert.throws(() => readConfig({ projectRoot: dir.project, globalDir: dir.global, class: 'maybe' }), (err) => err instanceof ConfigDoorError && err.code === 'config-request-invalid' && !isConfigRefusal(err));
  assert.equal(isConfigRefusal(new Error('config-parse something')), false);
  assert.throws(() => readConfig({ globalDir: dir.global }), TypeError, 'the project read names its project');
});

// A legacy config.json that still reads and a migration tombstone that is no source are owned by
// packages/config/rust/tests/files_select.rs (source choice), golden_migrate.rs (the legacy read) and golden_init.rs.
test('projectConfigPresent is false for an empty project and true once the project has a config file', () => {
  const dir = fixture();
  assert.equal(projectConfigPresent(dir.project, { globalDir: dir.global }), false);
  lay(path.join(dir.project, '.fgos/config.yaml'), '# @fgos:v1\n');
  assert.equal(projectConfigPresent(dir.project, { globalDir: dir.global }), true);
});

test('the accounts, check and init functions reach the door with their defaults', () => {
  const dir = fixture();
  assert.equal(readMachineAccounts({ globalDir: dir.global }).present, false);
  lay(path.join(dir.global, 'config.json'), '{}');
  const rows = checkConfig({ projectRoot: dir.project, globalDir: dir.global }).findings.map((f) => f.row);
  assert.equal(rows.includes('config-format-legacy-json'), true);
  assert.deepEqual(initConfigFile({ projectRoot: dir.project, globalDir: dir.global, target: 'project' }).created, true);
});

test('the standard value reaches the door by dotted path, reads no file, and says plainly when the standard has none', () => {
  const held = readStandardValue('runner.modelPolicies.claude');
  assert.equal(held.present, true);
  assert.equal(typeof held.value, 'object');
  const none = readStandardValue('runner.modelPolicies.no-such-family.standard');
  assert.deepEqual([none.present, none.value], [false, null]);
  assert.throws(() => readStandardValue('runner..x'), (err) => err instanceof ConfigDoorError && err.code === 'config-request-invalid');
});

test('the marker variable is the one the launch driver sets', () => {
  assert.equal(CONFINED_MARKER_ENV, DRIVER_MARKER);
});

test('a process that cannot load the addon fails every call with the door error and never falls back', () => {
  const { FGOS_HOST_BIN: _host, FGOS_ACTIVE_MANIFEST_PATH: _manifest, FGOS_ACTIVE_RELEASE_PATH: _release, ...env } = process.env;
  const probe = `import(${JSON.stringify(facade)}).then(({ readMachineConfig }) => { try { readMachineConfig({ globalDir: '/nonexistent/.fgos' }); console.log('read'); } catch (e) { console.log(e.name + ' ' + e.code); } });`;
  const res = spawnSync(process.execPath, ['--input-type=module', '-e', probe], { cwd: os.tmpdir(), env, encoding: 'utf8', timeout: 20_000 });
  assert.equal(res.status, 0, res.stderr);
  assert.equal(res.stdout.trim(), 'Error git-addon-not-shipped');
});

test('a platform that cannot read config files refuses by name and warns once that fail-closed readers use their default', async () => {
  const { nativeDoor } = await import('../../src/native/door.mjs');
  const config = nativeDoor().config;
  const real = config.snapshot;
  config.snapshot = () => { throw new Error(JSON.stringify({ id: 'config-platform-unsupported' })); };
  const warnings = [];
  const onWarning = (warning) => warnings.push(warning.code);
  process.on('warning', onWarning);
  try {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      assert.throws(() => readMachineConfig({}), (err) => err instanceof ConfigDoorError && err.code === 'config-platform-unsupported' && isConfigRefusal(err));
    }
    await new Promise((resolve) => setImmediate(resolve));
    assert.deepEqual(warnings, ['config-platform-unsupported']);
  } finally {
    process.off('warning', onWarning);
    config.snapshot = real;
  }
});
