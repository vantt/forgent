import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { tmpCwdFast, run, envelopeData, moveToDurableDoingForTest } from '../cli/helpers/fgos-cli-harness.mjs';
import { addWork, addDecision } from '../../src/state/store.mjs';
import { listUseCase, graphUseCase, staleUseCase } from '../../src/verbs/state/read.mjs';

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

test('parity: listUseCase default matches CLI list output', () => {
  const cwdDirect = tmpCwdFast();
  const dirDirect = path.join(cwdDirect, '.fgos');
  addTestWork(dirDirect, 'open-item', { title: 'Open Item' });
  addTestWork(dirDirect, 'done-item', { title: 'Done Item', status: 'done' });
  addDecision(dirDirect, { id: 'open-item', text: 'decision text', rationale: 'rat', relation: 'none' });

  const directResult = listUseCase({ dir: dirDirect });

  const cwdCli = tmpCwdFast();
  const dirCli = path.join(cwdCli, '.fgos');
  addTestWork(dirCli, 'open-item', { title: 'Open Item' });
  addTestWork(dirCli, 'done-item', { title: 'Done Item', status: 'done' });
  addDecision(dirCli, { id: 'open-item', text: 'decision text', rationale: 'rat', relation: 'none' });

  const cliRun = run(cwdCli, ['list', '--json']);
  assert.equal(cliRun.status, 0, `CLI run failed: ${cliRun.stderr}`);
  const cliData = envelopeData(cliRun.stdout);

  assert.deepEqual(Object.keys(directResult.work), Object.keys(cliData.work));
  assert.equal(directResult.work['open-item'].id, cliData.work['open-item'].id);
  assert.equal(directResult.work['open-item'].title, cliData.work['open-item'].title);
  assert.equal(directResult.work['open-item'].status, cliData.work['open-item'].status);
  assert.equal(directResult.work['done-item'], undefined);
  assert.equal(cliData.work['done-item'], undefined);
});

test('parity: listUseCase --all matches CLI list --all output', () => {
  const cwdDirect = tmpCwdFast();
  const dirDirect = path.join(cwdDirect, '.fgos');
  addTestWork(dirDirect, 'open-item', { title: 'Open Item' });
  addTestWork(dirDirect, 'done-item', { title: 'Done Item', status: 'done' });

  const directResult = listUseCase({ dir: dirDirect }, { all: true });

  const cwdCli = tmpCwdFast();
  const dirCli = path.join(cwdCli, '.fgos');
  addTestWork(dirCli, 'open-item', { title: 'Open Item' });
  addTestWork(dirCli, 'done-item', { title: 'Done Item', status: 'done' });

  const cliRun = run(cwdCli, ['list', '--all', '--json']);
  assert.equal(cliRun.status, 0, `CLI run failed: ${cliRun.stderr}`);
  const cliData = envelopeData(cliRun.stdout);

  assert.deepEqual(Object.keys(directResult.work).sort(), Object.keys(cliData.work).sort());
  assert.equal(directResult.work['done-item'].status, cliData.work['done-item'].status);
});

test('parity: listUseCase --id and --fields matches CLI list output', () => {
  const cwdDirect = tmpCwdFast();
  const dirDirect = path.join(cwdDirect, '.fgos');
  addTestWork(dirDirect, 'target-item', { title: 'Target Item', stage: 'executing' });

  const directResult = listUseCase({ dir: dirDirect }, { id: 'target-item', fields: 'stage,status' });

  const cwdCli = tmpCwdFast();
  const dirCli = path.join(cwdCli, '.fgos');
  addTestWork(dirCli, 'target-item', { title: 'Target Item', stage: 'executing' });

  const cliRun = run(cwdCli, ['list', '--id', 'target-item', '--fields', 'stage,status', '--json']);
  assert.equal(cliRun.status, 0, `CLI run failed: ${cliRun.stderr}`);
  const cliData = envelopeData(cliRun.stdout);

  assert.deepEqual(directResult.work, cliData.work);
});

test('parity: graphUseCase matches CLI graph output', () => {
  const cwdDirect = tmpCwdFast();
  const dirDirect = path.join(cwdDirect, '.fgos');
  addTestWork(dirDirect, 'a');
  addTestWork(dirDirect, 'b', { deps: ['a'], stage: 'discovery' });
  const directResult = graphUseCase({ dir: dirDirect });

  const cwdCli = tmpCwdFast();
  const dirCli = path.join(cwdCli, '.fgos');
  addTestWork(dirCli, 'a');
  addTestWork(dirCli, 'b', { deps: ['a'], stage: 'discovery' });
  const cliRun = run(cwdCli, ['graph', '--json']);
  assert.equal(cliRun.status, 0, `CLI run failed: ${cliRun.stderr}`);
  const cliData = envelopeData(cliRun.stdout);

  assert.equal(directResult.componentCount, cliData.componentCount);
  assert.deepEqual(directResult.components, cliData.components);
  assert.deepEqual(directResult.criticalPath, cliData.criticalPath);
  assert.deepEqual(directResult.stageByItem, cliData.stageByItem);
});

test('parity: staleUseCase matches CLI stale output', () => {
  const cwdDirect = tmpCwdFast();
  const dirDirect = path.join(cwdDirect, '.fgos');
  addTestWork(dirDirect, 'item-doing');
  moveToDurableDoingForTest(cwdDirect, 'item-doing');
  const directResult = staleUseCase({ dir: dirDirect, repoRoot: cwdDirect, cleanupTtlDays: 7 });

  const cwdCli = tmpCwdFast();
  const dirCli = path.join(cwdCli, '.fgos');
  addTestWork(dirCli, 'item-doing');
  moveToDurableDoingForTest(cwdCli, 'item-doing');
  const cliRun = run(cwdCli, ['stale', '--json']);
  assert.equal(cliRun.status, 0, `CLI run failed: ${cliRun.stderr}`);
  const cliData = envelopeData(cliRun.stdout);

  assert.deepEqual(directResult.stale, cliData.stale);
  assert.equal(directResult.thresholds.agentMs, cliData.thresholds.agentMs);
  assert.deepEqual(directResult.postDelivery.stale, cliData.postDelivery.stale);
});
