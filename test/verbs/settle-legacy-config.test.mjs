// What an older release leaves behind (a global and a project config.json, the gateway token inside the global one) is
// moved by `fgos init` through the Config component's own migration, so an upgraded machine needs no manual step. What
// each step does to a file is the config crate's (relocate, migrate); these cases prove the order, the effective values
// that survive, the second run that changes nothing, and the refusal that never swaps a token.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { initFixtureRepo } from '../helpers/git-fixture.mjs';
import { writeRawLegacyGlobalConfig, writeRawLegacyProjectConfig, readRawLegacyGlobalConfig, gatewayTokenPath, readGatewayToken } from '../helpers/config-fixture.mjs';
import { readConfig, checkConfig } from '../../src/config/facade.mjs';
import { settleLegacyConfig } from '../../src/verbs/state/settle-legacy-config.mjs';

const FGOS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../bin/fgos.mjs');
const TOKEN = 'SENTINEL-4417';
const OTHER = 'SENTINEL-8820';

function machine() {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'settle-legacy-')));
  const [home, project] = [path.join(root, 'home'), path.join(root, 'project')];
  fs.mkdirSync(path.join(home, '.fgos'), { recursive: true, mode: 0o700 });
  fs.mkdirSync(project, { recursive: true });
  initFixtureRepo(project);
  writeRawLegacyGlobalConfig(home, JSON.stringify({ gateway: { port: 4001, token: TOKEN }, bin: { globalFgosPath: '/opt/fgos' } }));
  writeRawLegacyProjectConfig(project, JSON.stringify({ gateBypass: { level: 'light' }, ironLaw: { level: 'ask' } }));
  return { root, home, project, env: { ...process.env, HOME: home, USERPROFILE: home, FGOS_STATE_HOME: path.join(root, 'state') } };
}
const init = (m) => spawnSync(process.execPath, [FGOS, 'init'], { cwd: m.project, env: m.env, encoding: 'utf8' });
const legacyRows = (m) => withEnv(m, () => checkConfig({ projectRoot: m.project }).findings.filter((f) => f.row === 'config-format-legacy-json' || f.row === 'config-key-in-wrong-file'));
function withEnv(m, fn) {
  const saved = { HOME: process.env.HOME, FGOS_STATE_HOME: process.env.FGOS_STATE_HOME };
  Object.assign(process.env, { HOME: m.home, FGOS_STATE_HOME: m.env.FGOS_STATE_HOME });
  try { return fn(); } finally { for (const [k, v] of Object.entries(saved)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; } }
}

test('fgos init moves an older release\'s global and project config.json to the Config files, keeping the token and the effective values, and a second init changes nothing', () => {
  const m = machine();
  const first = init(m);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(first.stdout.includes(TOKEN) || first.stderr.includes(TOKEN), false, 'no output carries the token');
  assert.ok(readGatewayToken(path.join(m.home, '.fgos')).trim() === TOKEN, 'the token the user had is the machine token');
  assert.equal(fs.statSync(gatewayTokenPath(path.join(m.home, '.fgos'))).mode & 0o777, 0o600);
  assert.deepEqual(legacyRows(m), [], 'no legacy format or misplaced key is left');
  const after = withEnv(m, () => readConfig({ projectRoot: m.project, sections: ['gateBypass', 'ironLaw', 'gateway'] }));
  assert.equal(after.value.gateBypass.level, 'light');
  assert.equal(after.value.ironLaw.level, 'ask');
  assert.equal(after.value.gateway.port, 4001);

  const files = [path.join(m.home, '.fgos/config.yaml'), path.join(m.project, '.fgos/config.yaml'), path.join(m.home, '.fgos/config.json'), path.join(m.project, '.fgos/config.json')];
  const bytes = () => files.map((f) => fs.readFileSync(f));
  const settled = bytes();
  const second = init(m);
  assert.equal(second.status, 0, second.stderr);
  assert.deepEqual(bytes(), settled);
});

test('a private token that differs from the one in the old global file is never replaced: the settle refuses by name and writes nothing', () => {
  const m = machine();
  fs.mkdirSync(path.join(m.home, '.fgos/private'), { recursive: true, mode: 0o700 });
  fs.writeFileSync(gatewayTokenPath(path.join(m.home, '.fgos')), `${OTHER}\n`, { mode: 0o600 });
  const legacy = readRawLegacyGlobalConfig(m.home);
  assert.throws(() => withEnv(m, () => settleLegacyConfig(m.project)), { code: 'config-migrate-destination-differs' });
  assert.ok(readGatewayToken(path.join(m.home, '.fgos')).trim() === OTHER);
  assert.equal(readRawLegacyGlobalConfig(m.home), legacy);
});

