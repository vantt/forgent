import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repo = path.resolve(new URL('../..', import.meta.url).pathname);
function run(args) { return spawnSync(process.execPath, ['bin/fgos.mjs', ...args], { cwd: repo, encoding: 'utf8' }); }

test('dispatch inspect projects only its typed selector and rejects zero or multiple selectors', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-inspect-cli-'));
  const zero = run(['dispatch', 'inspect', '--dir', root]);
  assert.equal(zero.status, 4); assert.match(zero.stderr, /exactly one selector/);
  const many = run(['dispatch', 'inspect', '--dir', root, '--run', 'run_a', '--assignment', 'asgn_a']);
  assert.equal(many.status, 4); assert.match(many.stderr, /exactly one selector/);
  const one = run(['dispatch', 'inspect', '--dir', root, '--run', 'run_a']);
  assert.equal(one.status, 0); assert.equal(JSON.parse(one.stdout).data.inspectionStatus, 'not-found');
});
