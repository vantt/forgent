// The wiring of the config doctor rows (src/setup/config-checks.mjs) onto the registry: every row and fix of the config crate's
// contract is registered, a finding maps to the registry's shape without a value, one door call serves a doctor run, and the
// token row creates its files. What each row finds is the crate's (packages/config/rust/tests/golden_doctor.rs); the registry's
// own mechanics are registrations.test.mjs.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { DOCTOR_CHECKS, FIX_REGISTRATIONS } from '../../src/setup/checks.mjs';
import { CONFIG_CHECKS } from '../../src/setup/config-checks.mjs';
import { nativeDoor } from '../../src/native/door.mjs';
import { legacyProjectConfigPath, writeProjectConfig, writeRawLegacyProjectConfig, writeRawProjectConfig } from '../helpers/config-fixture.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const contract = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'packages/config/contracts/doctor-rows.v1.json'), 'utf8'));
const SECRET = 'SENTINEL-9931';

process.env.FGOS_STATE_HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'config-checks-state-'));

/** A project directory and a machine home, each empty; `HOME` points at the home for the duration of `fn`. */
function withMachine(fn) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'config-checks-')));
  const machine = { project: path.join(root, 'project'), home: path.join(root, 'home') };
  fs.mkdirSync(path.join(machine.project, '.fgos'), { recursive: true });
  fs.mkdirSync(path.join(machine.home, '.fgos'), { recursive: true });
  const saved = process.env.HOME;
  process.env.HOME = machine.home;
  try { return fn(machine); } finally {
    if (saved === undefined) delete process.env.HOME; else process.env.HOME = saved;
    fs.rmSync(root, { recursive: true, force: true });
  }
}

const row = (id) => DOCTOR_CHECKS.find((entry) => entry.id === id);
/** One doctor run over the config rows, the way `fgos doctor` asks them: every row once, in registration order. */
const run = (project) => Object.fromEntries(CONFIG_CHECKS.map((entry) => [entry.id, entry.check(project)]));
const fix = (id) => FIX_REGISTRATIONS.find((entry) => entry.id === id);

test('every row of the config crate contract is a registered check and every fix id a registered fix; the machine-files row keeps the gateway token id', () => {
  for (const { id } of contract.rows) {
    assert.ok(row(id === 'config-machine-files' ? 'gateway-token-configured' : id), `row ${id} is not registered`);
  }
  assert.equal(row('config-machine-files'), undefined, 'the machine-files row is registered once, under the gateway token id');
  for (const id of contract.fixes) {
    assert.ok(fix(id === 'create-machine-files' ? 'gateway-token-configured' : `config-${id}`), `fix ${id} is not registered`);
  }
});

test('a warn finding passes with a warning prefix, a fail finding fails and names file, line, column and row', () => {
  withMachine(({ project }) => {
    writeRawLegacyProjectConfig(project, '{}\n');
    const legacy = run(project)['config-format-legacy-json'];
    assert.equal(legacy.passed, true);
    assert.match(legacy.message, /^warning: .*config\.json:\d+:\d+ config-format-legacy-json/);

    fs.rmSync(legacyProjectConfigPath(project));
    writeRawProjectConfig(project, '# @fgos:v1\nrunner: [\n');
    const broken = run(project)['config-parse'];
    assert.equal(broken.passed, false);
    assert.match(broken.message, /config\.yaml:\d+:\d+ config-parse/);
  });
});

test('no row message carries a value of a config file', () => {
  withMachine(({ project }) => {
    writeProjectConfig(project, { gateway: { token: SECRET }, unknownKey: SECRET });
    const results = Object.values(run(project));
    assert.ok(results.some((result) => result.passed === false), 'the fixture must trip a failing row');
    assert.equal(JSON.stringify(results).includes(SECRET), false);
  });
});

test('one door call serves every row of a doctor run, and a second run reads afresh', () => {
  withMachine(({ project }) => {
    const config = nativeDoor().config;
    const real = config.check;
    let calls = 0;
    config.check = (request) => { calls += 1; return real(request); };
    try {
      run(project);
      assert.equal(calls, 1);
      run(project);
      assert.equal(calls, 2);
    } finally { config.check = real; }
  });
});

test('the gateway token row fails with the fix named, the fix creates the private directory and token, a second fix changes nothing', () => {
  withMachine(({ project, home }) => {
    const missing = row('gateway-token-configured').check(project);
    assert.equal(missing.passed, false);
    assert.match(missing.message, /config-machine-files/);
    assert.match(missing.message, /fgos doctor --fix/);

    const first = fix('gateway-token-configured').fix(project);
    assert.equal(first.changed, true, first.message);
    assert.equal(fs.statSync(path.join(home, '.fgos/private')).mode & 0o777, 0o700);
    const token = path.join(home, '.fgos/private/gateway-token');
    assert.equal(fs.statSync(token).mode & 0o777, 0o600);
    assert.equal(row('gateway-token-configured').check(project).passed, true);

    const before = fs.readFileSync(token, 'utf8');
    assert.equal(fix('gateway-token-configured').fix(project).changed, false);
    assert.equal(fs.readFileSync(token, 'utf8'), before, 'an existing token is never rotated');
  });
});

test('a process that cannot load the addon fails the row and says what to run, instead of ending the doctor run', () => {
  withMachine(({ project, home }) => {
    const env = { ...process.env, HOME: home };
    delete env.FGOS_HOST_BIN;
    delete env.FGOS_ACTIVE_MANIFEST_PATH;
    const script = `const { DOCTOR_CHECKS } = await import(${JSON.stringify(path.join(REPO_ROOT, 'src/setup/checks.mjs'))});
      console.log(JSON.stringify(DOCTOR_CHECKS.find((c) => c.id === 'config-parse').check(${JSON.stringify(project)})));`;
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], { cwd: project, env, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    const answer = JSON.parse(result.stdout);
    assert.equal(answer.passed, false);
    assert.match(answer.message, /fgctl init/);
  });
});
