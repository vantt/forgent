import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { tmpCwdFast, run, envelopeData } from '../cli/helpers/fgos-cli-harness.mjs';
import { addWork, listWork } from '../../src/state/store.mjs';
import { editUseCase } from '../../src/verbs/state/edit.mjs';

function addTestWork(dir, id, extra = {}) {
  return addWork(dir, {
    id,
    title: extra.title ?? `Title ${id}`,
    kind: extra.kind ?? 'task',
    status: extra.status ?? 'todo',
    deps: extra.deps ?? [],
    risk: extra.risk ?? 'light',
    refs: extra.refs ?? [],
    verify: extra.verify ?? 'npm test',
    description: extra.description ?? 'fixture description',
    stage: extra.stage ?? 'executing',
    ...extra,
  });
}

test('parity: editUseCase result matches CLI edit output for representative inputs', () => {
  // 1. Direct call setup
  const cwdDirect = tmpCwdFast();
  const dirDirect = path.join(cwdDirect, '.fgos');
  addTestWork(dirDirect, 'parity-item', { risk: 'light', description: 'initial' });
  const directResult = editUseCase(
    { dir: dirDirect },
    { id: 'parity-item', patch: { risk: 'heavy', description: 'updated description' }, role: 'human' },
  );

  // 2. CLI call setup
  const cwdCli = tmpCwdFast();
  const dirCli = path.join(cwdCli, '.fgos');
  addTestWork(dirCli, 'parity-item', { risk: 'light', description: 'initial' });
  const cliRun = run(cwdCli, ['edit', 'parity-item', '--risk', 'heavy', '--description', 'updated description']);
  assert.equal(cliRun.status, 0, `CLI run failed: ${cliRun.stderr}`);
  const cliData = envelopeData(cliRun.stdout);

  // 3. Parity asserts
  assert.equal(directResult.id, cliData.id);
  assert.deepEqual(directResult.fields.sort(), cliData.fields.sort());
  assert.ok(directResult.seq >= 1);
  assert.ok(cliData.seq >= 1);

  const directItem = listWork(dirDirect).work['parity-item'];
  const cliItem = listWork(dirCli).work['parity-item'];
  assert.equal(directItem.risk, cliItem.risk);
  assert.equal(directItem.description, cliItem.description);
  assert.equal(directItem.status, cliItem.status);
  assert.equal(directItem.stage, cliItem.stage);
});
