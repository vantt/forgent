import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { lexSource } from '../../scripts/lib/js-source-lexer.mjs';

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

test('every Work append site returns a staged handle without reading assigned identity inside its gate', () => {
  const { code, shape } = lexSource(source);
  let inspected = 0;
  for (const match of code.matchAll(/withStateAndRefresh\(dir,\s*\(tx\)\s*=>\s*/g)) {
    const start = match.index + match[0].length;
    let depth = 0, end = start;
    if (shape[start] === '{') {
      do { if (shape[end] === '{') depth += 1; else if (shape[end] === '}') depth -= 1; end += 1; } while (depth && end < code.length);
    } else {
      // Expression callbacks end at the balanced append call.
      end = code.indexOf('));', start) + 2;
    }
    const body = code.slice(start, end);
    inspected += [...body.matchAll(/tx\.append\(/g)].length;
    assert.doesNotMatch(body, /\.(?:seq|origin|h)\b/);
    assert.doesNotMatch(body, /\b(?:readRawEvents|currentView|readAllEvents|resolveWriterLogPath)\s*\(/);
  }
  const all = [...code.matchAll(/tx\.append\(/g)].length;
  assert.equal(all, 17, '17 executable Work sites on this checkout; the runner audit is the 18th legacy site');
  assert.equal(inspected, all, 'every append belongs to an inspected gate');
  const claim = lexSource(fs.readFileSync(new URL('../../src/runner/claim-port.mjs', import.meta.url), 'utf8')).code;
  const gatedClaim = claim.slice(claim.indexOf('const runtimeClaim = withMainState'), claim.indexOf('if (!skipOutcome)'));
  assert.doesNotMatch(gatedClaim, /\b(?:readRawEvents|currentView)\s*\(/);
  assert.match(gatedClaim, /const freshDurableView = tx\.view/);
});
