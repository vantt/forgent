import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { checkOmpNativesPresent, ompExecutorsOf } from '../../src/setup/omp-natives-checks.mjs';
import { checkById } from './helpers/setup-checks-harness.mjs';

test('omp-natives-present finds the native addon where omp extracts it and fails only when an omp executor would start without it', () => {
  assert.notEqual(checkById('omp-natives-present'), undefined, 'registered in the doctor registry');
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'omp-natives-'));
  const bin = path.join(home, 'bin');
  fs.mkdirSync(bin);
  const env = { PATH: bin, HOME: home };
  const check = (over = {}) => checkOmpNativesPresent({ env, home, platform: 'linux', arch: 'x64', ...over });
  const users = ompExecutorsOf({ executors: { gemini: { invocations: [{ id: 'omp-herdr', command: 'omp' }] }, claude: { command: 'claude' } } });
  assert.deepEqual(users, ['gemini']);

  const missingOmp = check({ ompExecutors: users });
  assert.equal(missingOmp.passed, true);
  assert.match(missingOmp.message, /^warning: omp is not installed/);

  fs.writeFileSync(path.join(bin, 'omp'), '#!/bin/sh\necho omp/18.17.0\n', { mode: 0o755 });
  const natives = path.join(home, '.omp', 'natives', '18.17.0');

  const unused = check({ ompExecutors: [] });
  assert.equal(unused.passed, true);
  assert.match(unused.message, /^warning: .*18\.17\.0/);

  const used = check({ ompExecutors: users });
  assert.equal(used.passed, false);
  assert.ok(used.message.includes(natives), used.message);
  assert.match(used.message, /gemini/);
  assert.match(used.message, /run omp once outside the sandbox after every update/);

  fs.mkdirSync(natives, { recursive: true });
  fs.writeFileSync(path.join(natives, 'pi_natives.linux-x64-baseline.node'), '');
  const present = check({ ompExecutors: users });
  assert.equal(present.passed, true);
  assert.doesNotMatch(present.message, /^(warning|info):/);
  assert.ok(present.message.includes('pi_natives.linux-x64-baseline.node'), present.message);

  // omp's own order: PI_NATIVES_DIR, then $XDG_DATA_HOME/omp/natives once $XDG_DATA_HOME/omp exists, then ~/.omp/natives.
  const xdg = path.join(home, 'xdg');
  assert.equal(check({ ompExecutors: users, env: { ...env, XDG_DATA_HOME: xdg } }).passed, true, 'no $XDG_DATA_HOME/omp: ~/.omp/natives');
  fs.mkdirSync(path.join(xdg, 'omp'), { recursive: true });
  const underXdg = check({ ompExecutors: users, env: { ...env, XDG_DATA_HOME: xdg } });
  assert.equal(underXdg.passed, false);
  assert.ok(underXdg.message.includes(path.join(xdg, 'omp', 'natives', '18.17.0')), underXdg.message);
  const pinned = check({ ompExecutors: users, env: { ...env, XDG_DATA_HOME: xdg, PI_NATIVES_DIR: '~/.omp/natives' } });
  assert.equal(pinned.passed, true, pinned.message);
});
