// test/workflow/seat-evidence.test.mjs — what a --seats start pins and what status says ran

import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { digestContextRefs, seatsEcho } from '../../src/workflow/ref-digests.mjs';
import { seatProviders } from '../../src/workflow/seat-providers.mjs';

test('plain-path refs are digested, run refs skipped, a missing file marked unreadable', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-ref-digests-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(root, 'policy.md'), 'close in 6 days');

  const digests = digestContextRefs(['policy.md', 'unit-run:abc/producer', 'gate-answer:wf/close', 'gone.md'], root);
  assert.deepEqual(digests, [
    { ref: 'policy.md', sha256: crypto.createHash('sha256').update('close in 6 days').digest('hex'), bytes: 15 },
    { ref: 'gone.md', unreadable: true },
  ]);
});

test('the echo names the pinned personas and totals the refs without carrying persona text', () => {
  assert.equal(seatsEcho(null), undefined);
  const echo = seatsEcho({
    personas: [{ seat: 'panelist-1', name: 'x', tier: 'domain', source: 'domains/d/agents/x.yaml', text: 'SECRET TEXT', digest: 'd' }],
    refDigests: [{ ref: 'a.md', sha256: 's', bytes: 10 }, { ref: 'b.md', unreadable: true }],
  });
  assert.deepEqual(echo.personas, [{ seat: 'panelist-1', name: 'x', tier: 'domain', source: 'domains/d/agents/x.yaml' }]);
  assert.deepEqual(echo.refs, { count: 2, totalBytes: 10, unreadable: ['b.md'] });
  assert.ok(!JSON.stringify(echo).includes('SECRET TEXT'));
  assert.match(echo.note, /read them live/);
});

test('seat providers list who ran each seat and where a failover moved it from', () => {
  const rows = seatProviders({
    steps: {
      s1: {
        units: {
          u1: {
            results: [
              { role: 'panelist-1', round: 1, outcome: 'pass', binding: { executor: 'claude-herdr', invocation: 'i1', model: 'sonnet', persona: 'p' }, runResult: { policy: { providerModel: 'claude' } } },
              { role: 'panelist-2', round: 1, outcome: 'pass', binding: { executor: 'glm', invocation: 'i2', model: 'glm', persona: 'q', provenance: { fallbackFrom: { executor: 'xai', kind: 'next-candidate', reason: 'provider-limit' } } }, runResult: { policy: { providerModel: 'z-ai' } } },
            ],
          },
        },
      },
    },
  });
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], { step: 's1', unit: 'u1', role: 'panelist-1', round: 1, persona: 'p', executor: 'claude-herdr', invocation: 'i1', family: 'claude', model: 'sonnet', outcome: 'pass', movedFrom: null });
  assert.deepEqual(rows[1].movedFrom, { executor: 'xai', kind: 'next-candidate', reason: 'provider-limit' });
  assert.deepEqual(seatProviders({}), []);
});
