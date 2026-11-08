// A case's run directory is built in one place, and an id that is not one case-id path segment is refused there.

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import { runsRoot, runDirOf, gateAnswerFile } from '../../../src/runner/execution/case-run-paths.mjs';

test('a case id names one directory under the runs root, and an id that is not a case id is refused by name', () => {
  const root = path.resolve('/main');
  assert.equal(runsRoot(root), path.join(root, '.fgos', 'workflow-runs'));
  assert.equal(runDirOf(root, 'wf-run-1700000000000-ab12cd34'), path.join(runsRoot(root), 'wf-run-1700000000000-ab12cd34'));
  for (const bad of ['../x', '..', '.', '.bindings', 'a/b', 'a\\b', '', ' x', 'x y', 'a'.repeat(129), undefined, 7]) {
    assert.throws(() => runDirOf(root, bad), (err) => err.code === 'invalid-case-id', `refused: ${String(bad)}`);
  }
});

test('a gate answer file sits in its case directory, and an id that names no file there gives null', () => {
  const root = path.resolve('/main');
  assert.equal(gateAnswerFile(root, 'wf1', 'gate'), path.join(runsRoot(root), 'wf1', 'gate-answers', 'gate.md'));
  assert.equal(gateAnswerFile(root, '../x', 'gate'), null);
  assert.equal(gateAnswerFile(root, 'wf1', '../gate'), null);
  assert.equal(gateAnswerFile(root, 'wf1', ''), null);
});
