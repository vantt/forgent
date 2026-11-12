// `fgos init` gives the project and the machine their header-only config.yaml (docs/platform/config/spec.md
// section 6). These cases moved here from the `fgos setup` tests, which no longer write config files.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { initFixtureRepo } from '../helpers/git-fixture.mjs';
import { legacyProjectConfigPath, writeRawLegacyProjectConfig, projectConfigExists } from '../helpers/config-fixture.mjs';

const MODULE = new URL('../../src/verbs/state/init.mjs', import.meta.url).href;

const mkTemp = (prefix) => fs.mkdtempSync(path.join(os.tmpdir(), prefix));

/** Runs createConfigFiles in a child whose HOME is `home`, so the machine scope is a scratch directory. */
function createConfigFiles(cwd, home) {
  const script = `import { createConfigFiles } from ${JSON.stringify(MODULE)}; process.stdout.write(JSON.stringify(createConfigFiles(process.argv[1])));`;
  const run = spawnSync(process.execPath, ['--input-type=module', '-e', script, cwd], {
    cwd, encoding: 'utf8', env: { ...process.env, HOME: home, USERPROFILE: home },
  });
  assert.equal(run.status, 0, run.stderr);
  return JSON.parse(run.stdout);
}

test('init creates a header-only config.yaml for the project and for the machine, and rewrites neither on a second run', () => {
  const cwd = mkTemp('init-config-');
  const home = mkTemp('init-config-home-');
  initFixtureRepo(cwd);
  const first = createConfigFiles(cwd, home);
  assert.equal(first.project.created, true);
  assert.equal(first.global.created, true);
  const files = [path.join(cwd, '.fgos', 'config.yaml'), path.join(home, '.fgos', 'config.yaml')];
  for (const file of files) {
    const body = fs.readFileSync(file, 'utf8').split('\n').filter((line) => line.trim() !== '' && !line.startsWith('#'));
    assert.deepEqual(body, [], `${file} must hold the header only`);
  }
  const before = files.map((file) => fs.statSync(file).mtimeMs);
  const second = createConfigFiles(cwd, home);
  assert.equal(second.project.created, false);
  assert.equal(second.global.created, false);
  assert.deepEqual(files.map((file) => fs.statSync(file).mtimeMs), before);
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(home, { recursive: true, force: true });
});

test('init leaves an existing legacy config.json alone and creates no config.yaml beside it', () => {
  const cwd = mkTemp('init-config-legacy-');
  const home = mkTemp('init-config-legacy-home-');
  initFixtureRepo(cwd);
  writeRawLegacyProjectConfig(cwd, '{}\n');
  const result = createConfigFiles(cwd, home);
  assert.equal(result.project.created, false);
  assert.equal(result.project.file, path.basename(legacyProjectConfigPath(cwd)));
  assert.equal(projectConfigExists(cwd), false);
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(home, { recursive: true, force: true });
});
