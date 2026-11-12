// The Work store is built on the Event Store, which exists on Linux only; `fgos init` on any other platform
// settles the machine and the project and leaves the store out instead of refusing the whole init. The use case
// takes the platform's answer as its `workStore` argument (default: the Event Store facade's own answer).
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { initFixtureRepo } from '../helpers/git-fixture.mjs';
import { initStoreUseCase } from '../../src/verbs/state/init.mjs';

test('init without a Work store settles the project and builds no Work store', () => {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'init-no-event-store-')));
  const [home, project] = [path.join(root, 'home'), path.join(root, 'project')];
  fs.mkdirSync(path.join(home, '.fgos'), { recursive: true, mode: 0o700 });
  fs.mkdirSync(project, { recursive: true });
  initFixtureRepo(project);
  const saved = { HOME: process.env.HOME, FGOS_STATE_HOME: process.env.FGOS_STATE_HOME };
  Object.assign(process.env, { HOME: home, FGOS_STATE_HOME: path.join(root, 'state') });
  try {
    const dir = path.join(project, '.fgos');
    const result = initStoreUseCase({ dir, workStore: false });
    assert.equal(result.dir, dir);
    assert.equal(result.workStore, 'unsupported-platform');
    assert.match(result.workStoreNote, /Work is not available on this platform/);
    assert.equal(fs.existsSync(path.join(dir, 'cache', 'state.json')), false, 'no Work store view is built');
  } finally {
    for (const [k, v] of Object.entries(saved)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  }
});
