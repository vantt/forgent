// mailbox-behaviour-ack.test.mjs: the scoring of the acknowledgement-line behaviour check
// (scripts/lib/mailbox-behaviour-ack.mjs). The record is built by hand; no CLI runs.

import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import * as ack from '../../scripts/lib/mailbox-behaviour-ack.mjs';

const names = { sender: 'cc-aaaa', receiver: 'cc-bbbb' };
const bindings = { KA: { key: 'KA', name: names.sender }, KB: { key: 'KB', name: names.receiver } };
const msg = (id, from, to, at, extra = {}) => ({ id, from, to, recorded_at: at, depth: 0, state: { offered: { at: at + 1 } }, ...extra });

test('a flagged request answered by the receiver is acked, and a sender that sends nothing more is silent', () => {
  const snapshot = { bindings, messages: [msg('m1', 'KA', 'KB', 100, { ack_within_sec: 600 }), msg('m2', 'KB', 'KA', 200, { reply_to_hint: 'm1' })] };
  const s = ack.scoreRecord(snapshot, names);
  assert.deepEqual([s.requestSent, s.requestFlagged, s.acked, s.ackReached, s.senderSilent, s.senderAfterAck, s.ackAfterMs], [true, true, true, true, true, 0, 100]);
});

test('a reply that names the request by its derived parent also counts, and a sender that writes again after the ack is not silent', () => {
  const snapshot = { bindings, messages: [msg('m1', 'KA', 'KB', 100, { ack_within_sec: 600 }), msg('m2', 'KB', 'KA', 200, { reply_to: 'm1', depth: 1 }), msg('m3', 'KA', 'KB', 300, { reply_to: 'm2', depth: 2 })] };
  const s = ack.scoreRecord(snapshot, names);
  assert.deepEqual([s.acked, s.senderSilent, s.senderAfterAck, s.ackOnAck, s.maxDepth], [true, false, 1, 1, 2]);
});

test('a receiver that sent nothing back is not acked, and silence is then undecided rather than yes', () => {
  const snapshot = { bindings, messages: [msg('m1', 'KA', 'KB', 100, { ack_within_sec: 600 })] };
  const s = ack.scoreRecord(snapshot, names);
  assert.deepEqual([s.requestSent, s.acked, s.senderSilent, s.ackReached], [true, false, null, null]);
});

test('an ack that never reached the sender is recorded as not reached, and an unflagged request reads as unflagged', () => {
  const snapshot = { bindings, messages: [msg('m1', 'KA', 'KB', 100), msg('m2', 'KB', 'KA', 200, { reply_to_hint: 'm1', state: 'recorded' })] };
  const s = ack.scoreRecord(snapshot, names);
  assert.deepEqual([s.requestFlagged, s.acked, s.ackReached, s.ackState], [false, true, false, 'recorded']);
});

test('a record with no message from the sender has no request', () => {
  assert.equal(ack.scoreRecord({ bindings, messages: [] }, names).requestSent, false);
  assert.equal(ack.scoreRecord(null, names).requestSent, false);
});

test('the summary counts silence only among acks that reached the sender, leaves error runs out of the valid count and sums cost', () => {
  const run = (extra) => ({ cli: 'claude', scenario: 'info', requestSent: true, acked: true, ackReached: true, senderSilent: true, ackOnAck: 0, invocations: 2, usage: { costUsd: 0.5 }, ...extra });
  const [row] = ack.summarize([run({}), run({ senderSilent: false, ackOnAck: 1 }), run({ ackReached: false, senderSilent: null }), run({ acked: false, ackReached: null }), run({ error: 'exit 1', requestSent: false })]);
  assert.deepEqual([row.runs, row.errors, row.valid, row.acked, row.reached, row.silentOfReached, row.ackOnAck, row.invocations, row.costUsd], [5, 1, 4, 3, 2, 1, 1, 10, 2.5]);
});

test('the interval of nothing observed is the whole range and of all observed stays above half', () => {
  assert.deepEqual(ack.wilson(0, 0), [0, 1]);
  assert.ok(ack.wilson(20, 20)[0] > 0.8);
});

test('the plan is 40 runs per CLI and only the flagged scenarios carry the flag', () => {
  assert.equal(Object.values(ack.PLAN).reduce((a, b) => a + b, 0), 40);
  assert.deepEqual(Object.fromEntries(Object.entries(ack.FLAGGED)), { info: true, work: true, control: false });
  assert.ok(ack.SCENARIOS.info.includes('--need-ack') && !/with --need-ack/.test(ack.SCENARIOS.control));
});
