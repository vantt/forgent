// The verb list of each coordinating persona, asserted from one expected table (the source is head-grants.mjs).
import assert from 'node:assert/strict';
import test from 'node:test';

import { grantOf } from '../../src/session-host/head-grants.mjs';

const HEAD = ['session bind session', 'session rotate', 'session answered', 'session restore role'];
const QUESTIONS = ['questions list', 'questions ask', 'questions ack', 'questions cancel'];
const LAND = ['land', 'request result'];
const PORTFOLIO_READ = ['supervisor plans', 'supervisor queue', 'slots'];
const COORDINATION = ['supervisor raise', 'supervisor wake', 'run', 'metrics record'];

const EXPECTED = {
  secretary: {
    writes: ['plans', 'docs/backlog.md', 'docs/discussions'],
    verbs: ['session start', 'session stop', 'session write', ...HEAD, ...QUESTIONS, 'questions answer', ...LAND, ...PORTFOLIO_READ, ...COORDINATION],
    mailbox: true,
    peers: true,
  },
  supervisor: {
    writes: ['plans', 'docs/backlog.md'],
    verbs: ['session start', 'session stop', 'session write', ...HEAD, ...QUESTIONS, ...LAND, ...PORTFOLIO_READ, 'supervisor handled', 'supervisor done', 'session read', 'session type', 'watcher tune', ...COORDINATION, 'metrics prune'],
    mailbox: true,
    peers: true,
  },
};

for (const [persona, expected] of Object.entries(EXPECTED)) {
  test(`the ${persona} grant is exactly the settled table: writes, verbs, mailbox and peers`, () => {
    assert.deepEqual(grantOf(`head:${persona}-x`, persona), expected);
  });

  test(`no verb is named twice in the ${persona} grant`, () => {
    const { verbs } = grantOf(`head:${persona}-x`, persona);
    assert.equal(new Set(verbs).size, verbs.length);
  });
}

test('Miu never holds the supervisor-only verbs: handled, session type, session read, watcher tune (nor done or prune)', () => {
  const { verbs } = grantOf('head:secretary-miu', 'secretary');
  for (const verb of ['supervisor handled', 'supervisor done', 'session type', 'session read', 'watcher tune', 'metrics prune']) {
    assert.ok(!verbs.includes(verb), `${verb} is the supervisor's, not Miu's`);
  }
});

test('the supervisor never answers an owner question', () => {
  assert.ok(!grantOf('head:supervisor-x', 'supervisor').verbs.includes('questions answer'));
});
