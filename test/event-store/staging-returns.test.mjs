import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../../src/state/store.mjs', import.meta.url), 'utf8');

test('the stream census covers literal append types, dynamic FSM types, topic/doc wrappers and runner audit', () => {
  const contract = JSON.parse(fs.readFileSync(new URL('../../packages/work-state/contracts/event-streams.v1.json', import.meta.url)));
  const expected = new Set([
    ...Array.from(source.matchAll(/type: '([\w.-]+)'/g), m => m[1]),
    ...Array.from(source.matchAll(/appendKnowledgeEvent\(dir, '([\w.-]+)'/g), m => m[1]),
    'executor.dispatch',
  ]);
  for (const file of ['status-fsm', 'step-fsm']) {
    const fsm = fs.readFileSync(new URL(`../../src/state/${file}.mjs`, import.meta.url), 'utf8');
    for (const m of fsm.matchAll(/return \{ type: '([\w.-]+)'/g)) expected.add(m[1]);
  }
  assert.deepEqual(contract.types.map(t => t.type).sort(), [...expected].sort());
  assert.ok(contract.types.every(t => t.scope === 'project' && t.schemaVersion === 1));
  assert.deepEqual(contract.types.filter(t => t.sealOnWrite).map(t => t.type).sort(), ['decision', 'work.gate-approve', 'work.move', 'work.outcome']);
});
