import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  tmpCwdFast,
  tmpCwdFromTemplate,
  advanceThroughDiscoveryToPlanning,
  run,
  envelopeData,
} from '../cli/helpers/fgos-cli-harness.mjs';
import {
  addWork,
  listWork,
} from '../../src/state/store.mjs';
import {
  discoverUseCase,
  planUseCase,
} from '../../src/verbs/state/stage.mjs';

function addTestWork(dir, id, extra = {}) {
  const defaultVerify = extra.stage === 'discovery'
    ? 'chưa xác định — fixture verify'
    : 'npm test';
  return addWork(dir, {
    id,
    title: extra.title ?? `Title ${id}`,
    kind: extra.kind ?? 'task',
    status: extra.status ?? 'todo',
    deps: extra.deps ?? [],
    risk: extra.risk ?? 'light',
    refs: extra.refs ?? [],
    verify: extra.verify ?? defaultVerify,
    description: extra.description ?? 'fixture description',
    stage: extra.stage ?? 'discovery',
    ...extra,
  });
}

test('parity: discover clear verdict direct in-process vs CLI', () => {
  // 1. Direct in-process
  const cwdDirect = tmpCwdFast();
  const dirDirect = path.join(cwdDirect, '.fgos');
  addTestWork(dirDirect, 'item-disc-clear', { stage: 'discovery' });
  const directRes = discoverUseCase(
    { dir: dirDirect },
    {
      id: 'item-disc-clear',
      callerVerdict: {
        clear: true,
        verify: 'npm test -- parity-clear',
        tier: 'heavy',
        kind: 'bug',
        risk: 'heavy',
      },
    },
  );
  const directItem = listWork(dirDirect).work['item-disc-clear'];

  // 2. CLI subprocess
  const cwdCli = tmpCwdFromTemplate();
  const cliSubmit = JSON.parse(run(cwdCli, ['submit', 'Parity clear item']).stdout);
  const cliId = cliSubmit.data.id;
  const cliRes = run(cwdCli, [
    'discover',
    cliId,
    '--verdict',
    'clear',
    '--verify',
    'npm test -- parity-clear',
    '--tier',
    'heavy',
    '--kind',
    'bug',
    '--risk',
    'heavy',
  ]);
  assert.equal(cliRes.status, 0);
  const cliEnvelope = JSON.parse(cliRes.stdout);
  const cliItem = envelopeData(run(cwdCli, ['list']).stdout).work[cliId];

  // Parity checks
  assert.equal(directRes.outcome, cliEnvelope.data.outcome);
  assert.equal(directItem.stage, cliItem.stage);
  assert.equal(directItem.verify, cliItem.verify);
  assert.equal(directItem.tier, cliItem.tier);
  assert.equal(directItem.kind, cliItem.kind);
  assert.equal(directItem.risk, cliItem.risk);
  assert.equal(directItem.status, cliItem.status);
});

test('parity: discover unclear verdict direct in-process vs CLI', () => {
  const ask = '## Context\n\nNeed clarity on provider.\n\n## Why this matters\n\nDirect impact: Which auth provider?';

  // 1. Direct in-process
  const cwdDirect = tmpCwdFast();
  const dirDirect = path.join(cwdDirect, '.fgos');
  addTestWork(dirDirect, 'item-disc-unclear', { stage: 'discovery' });
  const directRes = discoverUseCase(
    { dir: dirDirect },
    {
      id: 'item-disc-unclear',
      callerVerdict: { clear: false, question: ask },
    },
  );
  const directView = listWork(dirDirect);

  // 2. CLI subprocess
  const cwdCli = tmpCwdFromTemplate();
  const cliSubmit = JSON.parse(run(cwdCli, ['submit', 'Parity unclear item']).stdout);
  const cliId = cliSubmit.data.id;
  const cliRes = run(cwdCli, [
    'discover',
    cliId,
    '--verdict',
    'unclear',
    '--question',
    ask,
  ]);
  assert.equal(cliRes.status, 0);
  const cliEnvelope = JSON.parse(cliRes.stdout);
  const cliView = envelopeData(run(cwdCli, ['list']).stdout);

  // Parity checks
  assert.equal(directRes.outcome, cliEnvelope.data.outcome);
  assert.equal(directView.work['item-disc-unclear'].stage, cliView.work[cliId].stage);
  assert.equal(directView.work['item-disc-unclear'].status, cliView.work[cliId].status);
  assert.equal(directView.gates['item-disc-unclear'].ask, cliView.gates[cliId].ask);
});

test('parity: plan pass-through verdict direct in-process vs CLI', async () => {
  // 1. Direct in-process
  const cwdDirect = tmpCwdFast();
  const dirDirect = path.join(cwdDirect, '.fgos');
  addTestWork(dirDirect, 'item-plan-pt', { stage: 'planning' });
  const directRes = await planUseCase(
    { dir: dirDirect },
    {
      id: 'item-plan-pt',
      direct: true,
      callerVerdict: { verdict: 'pass-through', reason: 'single change' },
    },
  );
  const directItem = listWork(dirDirect).work['item-plan-pt'];

  // 2. CLI subprocess
  const cwdCli = tmpCwdFromTemplate();
  const cliSubmit = JSON.parse(run(cwdCli, ['submit', 'Parity plan pass-through']).stdout);
  const cliId = cliSubmit.data.id;
  advanceThroughDiscoveryToPlanning(cwdCli, cliId);

  const cliRes = run(cwdCli, [
    'plan',
    cliId,
    '--verdict',
    'pass-through',
    '--reason',
    'single change',
  ]);
  assert.equal(cliRes.status, 0);
  const cliEnvelope = JSON.parse(cliRes.stdout);
  const cliItem = envelopeData(run(cwdCli, ['list']).stdout).work[cliId];

  // Parity checks
  assert.equal(directRes.outcome, cliEnvelope.data.outcome);
  assert.equal(directItem.stage, cliItem.stage);
  assert.equal(directItem.status, cliItem.status);
});

test('parity: plan need-human verdict direct in-process vs CLI', async () => {
  const reason = 'Which database engine to use?';

  // 1. Direct in-process
  const cwdDirect = tmpCwdFast();
  const dirDirect = path.join(cwdDirect, '.fgos');
  addTestWork(dirDirect, 'item-plan-human', { stage: 'planning' });
  const directRes = await planUseCase(
    { dir: dirDirect },
    {
      id: 'item-plan-human',
      direct: true,
      callerVerdict: { verdict: 'need-human', reason },
    },
  );
  const directView = listWork(dirDirect);

  // 2. CLI subprocess
  const cwdCli = tmpCwdFromTemplate();
  const cliSubmit = JSON.parse(run(cwdCli, ['submit', 'Parity plan human']).stdout);
  const cliId = cliSubmit.data.id;
  advanceThroughDiscoveryToPlanning(cwdCli, cliId);

  const cliRes = run(cwdCli, [
    'plan',
    cliId,
    '--verdict',
    'need-human',
    '--reason',
    reason,
  ]);
  assert.equal(cliRes.status, 0);
  const cliEnvelope = JSON.parse(cliRes.stdout);
  const cliView = envelopeData(run(cwdCli, ['list']).stdout);

  // Parity checks
  assert.equal(directRes.outcome, cliEnvelope.data.outcome);
  assert.equal(directView.work['item-plan-human'].status, cliView.work[cliId].status);
  assert.match(directView.gates['item-plan-human'].ask, new RegExp(reason));
  assert.match(cliView.gates[cliId].ask, new RegExp(reason));
});

test('parity: plan decompose verdict direct in-process vs CLI', async () => {
  const children = [
    { title: 'Subtask 1', verify: 'npm test -- sub1', action: 'action 1' },
    { title: 'Subtask 2', verify: 'npm test -- sub2', action: 'action 2' },
  ];

  // 1. Direct in-process
  const cwdDirect = tmpCwdFast();
  const dirDirect = path.join(cwdDirect, '.fgos');
  addTestWork(dirDirect, 'item-plan-decomp', { stage: 'planning' });
  const directRes = await planUseCase(
    { dir: dirDirect },
    {
      id: 'item-plan-decomp',
      direct: true,
      callerVerdict: {
        verdict: 'decompose',
        reason: 'two subtasks',
        children,
      },
    },
  );
  const directView = listWork(dirDirect);

  // 2. CLI subprocess
  const cwdCli = tmpCwdFromTemplate();
  const cliSubmit = JSON.parse(run(cwdCli, ['submit', 'Parity plan decomp']).stdout);
  const cliId = cliSubmit.data.id;
  advanceThroughDiscoveryToPlanning(cwdCli, cliId);

  const cliRes = run(cwdCli, [
    'plan',
    cliId,
    '--verdict',
    'decompose',
    '--reason',
    'two subtasks',
    '--children',
    JSON.stringify(children),
  ]);
  assert.equal(cliRes.status, 0);
  const cliEnvelope = JSON.parse(cliRes.stdout);
  const cliView = envelopeData(run(cwdCli, ['list', '--all']).stdout);

  // Parity checks
  assert.equal(directRes.outcome, cliEnvelope.data.outcome);
  assert.equal(directRes.childIds.length, cliEnvelope.data.childIds.length);
  assert.equal(directView.work['item-plan-decomp'].stage, cliView.work[cliId].stage);
  assert.equal(directView.work['item-plan-decomp-1'].title, cliView.work[`${cliId}-1`].title);
  assert.equal(directView.work['item-plan-decomp-2'].title, cliView.work[`${cliId}-2`].title);
});
