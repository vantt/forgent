import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { canonicalJson, computeSha256Digest } from '../../src/runner/dispatch/proof-helpers.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const readJson = (rel) => JSON.parse(readFileSync(join(root, rel), 'utf8'));

const envelopeContract = readJson('packages/run-supervisor/contracts/envelope.v3.json');
const gateGo = readJson('packages/run-supervisor/contracts/gate-go.v1.json');
const receipt = readJson('packages/run-supervisor/contracts/receipt.v1.json');
const gateExit = readJson('packages/run-supervisor/contracts/gate-exit.v1.json');
const writerIdContract = readJson('packages/identity/contracts/attempt-writer-id.v1.json');
const writerIdVectors = readJson('packages/identity/contracts/vectors/attempt-writer-id.v1.json');
const resolveContract = readJson('packages/identity/contracts/identity.writer.v1.json');
const outcomes = readJson('packages/agent-protocol/contracts/terminal-outcomes.v1.json');
const agentProtocol = readJson('packages/agent-protocol/contracts/agent-protocol.v1.json');
const envelopeCases = readJson('packages/run-supervisor/contracts/vectors/envelope-digest.v1.json').cases;
const terminalEnvelope = envelopeCases.find((c) => c.name === 'envelope-terminal-read-only').input;
const directEnvelope = envelopeCases.find((c) => c.name === 'envelope-direct-mutating').input;

// Reference form of mint_attempt_writer_id: the Rust function and the Node client reproduce this.
const ATTEMPT_ID = new RegExp(writerIdContract.constraints.attemptIdPattern);
function mintAttemptWriterId(attemptId) {
  const ok = typeof attemptId === 'string'
    && attemptId.length >= 1
    && attemptId.length <= writerIdContract.constraints.maxAttemptIdLength
    && ATTEMPT_ID.test(attemptId);
  if (!ok) throw Object.assign(new Error('invalid-attempt-id'), { code: 'invalid-attempt-id' });
  return `${writerIdContract.constraints.prefix}${attemptId}`;
}

test('terminal envelope vector carries every terminal field and the digest reproduces', () => {
  for (const field of Object.keys(envelopeContract.fields)) assert.ok(field in terminalEnvelope, `terminal vector carries ${field}`);
  assert.equal(terminalEnvelope.mode, 'terminal');
  assert.equal(terminalEnvelope.agentProtocol.mode, 'terminal');
  assert.equal(terminalEnvelope.slot.key, terminalEnvelope.attemptId);
  assert.equal(typeof terminalEnvelope.slot.groupKey, 'string');
  for (const field of ['socketPath', 'exitCommand', 'orphanSettleMs']) assert.ok(field in terminalEnvelope.terminal, field);
  assert.ok(Buffer.byteLength(terminalEnvelope.terminal.socketPath) <= 107, 'sun_path limit');
  assert.ok(terminalEnvelope.containment.bwrapPrefix.includes('--die-with-parent'));
  assert.ok(!directEnvelope.containment.bwrapPrefix.includes('--die-with-parent'), 'direct mode never dies with its parent');
  const { digest: _d, ...rest } = terminalEnvelope;
  const vector = envelopeCases.find((c) => c.name === 'envelope-terminal-read-only');
  assert.equal(canonicalJson(rest), vector.canonical);
  assert.equal(computeSha256Digest(rest), vector.digest);
});

test('direct and terminal envelopes follow the mode rules', () => {
  assert.ok(!('slot' in directEnvelope) && !('terminal' in directEnvelope));
  assert.ok(!directEnvelope.steps.some((s) => s.stepId === 'release-slot'));
  const last = terminalEnvelope.steps.at(-1);
  assert.equal(last.stepId, 'release-slot');
  assert.equal(last.builtin, true);
  assert.deepEqual(Object.keys(last).sort(), Object.keys(envelopeContract.fields.steps.builtinItem).sort());
  assert.deepEqual(last.disposition, { onSuccess: 'close', onFailure: 'retain' });
  for (const step of terminalEnvelope.steps.slice(0, -1)) {
    for (const field of Object.keys(envelopeContract.fields.steps.item).filter((f) => f !== 'note')) assert.ok(field in step, `process step ${step.stepId}.${field}`);
  }
  assert.deepEqual(envelopeContract.fields.steps.item.stepId.enum, ['settle-attempt', 'finalize-home', 'cleanup-trust']);
});

test('both envelopes carry identity equal to the minted attempt writer id', () => {
  for (const envelope of [directEnvelope, terminalEnvelope]) {
    assert.equal(envelope.identity.writerId, mintAttemptWriterId(envelope.attemptId));
    assert.equal(envelope.launch.env.FGOS_SESSION_ID, envelope.identity.writerId);
    assert.equal(envelope.launch.env.FGOS_PARENT_WRITER_ID, envelope.identity.parentWriterId);
  }
});

test('a minted writer id always passes the resolve rule and the length bound is tight', () => {
  const pattern = new RegExp(resolveContract['x-idPattern']);
  const max = resolveContract['x-maxIdLength'];
  assert.equal(writerIdContract.constraints.maxWriterIdLength, max);
  assert.equal(writerIdContract.constraints.attemptIdPattern, resolveContract['x-idPattern']);
  assert.equal(writerIdContract.constraints.maxAttemptIdLength + writerIdContract.constraints.prefix.length, max);
  const longest = mintAttemptWriterId('a'.repeat(writerIdContract.constraints.maxAttemptIdLength));
  assert.equal(longest.length, max);
  for (const c of writerIdVectors.cases.filter((v) => !v.error)) {
    const id = mintAttemptWriterId(c.expand ? c.expand.char.repeat(c.expand.count) : c.attemptId);
    assert.ok(pattern.test(id) && id.length <= max, c.name);
  }
  assert.deepEqual(writerIdContract.environment.scrubbed, ['CLAUDE_CODE_SESSION_ID', 'CODEX_THREAD_ID', 'PI_SESSION_ID', 'PI_SESSION_FILE', 'FGOS_PARENT_WRITER_ID']);
});

test('gate-go terminal section defines the socket, peer check, fd order and orphan reasons', () => {
  const t = gateGo.terminal;
  assert.match(t.peerCheck.rule, /SO_PEERCRED/);
  assert.match(t.peerCheck.rule, /Pids are never compared/);
  assert.deepEqual(Object.keys(t.fdOrder).filter((k) => /^\d$/.test(k)), ['0', '1']);
  assert.match(t.sequence.join(' '), /MSG_CMSG_CLOEXEC/);
  assert.deepEqual(Object.keys(t.orphan.reasons).sort(), ['abandoned-before-brief', 'orphan-result']);
  assert.ok('BRIEF_DELIVERED' in gateGo.frames);
  assert.equal(gateGo.frames.BRIEF_DELIVERED.direction, 'supervisor -> gate');
});

test('orphan reasons agree between gate-go, gate-exit and the receipt', () => {
  const reasons = Object.keys(gateGo.terminal.orphan.reasons);
  assert.ok(gateExit.fields.stoppedBy.enum.includes('orphan'));
  for (const reason of reasons) assert.match(gateExit.fields.cause, new RegExp(reason), `gate-exit names ${reason}`);
  assert.ok(receipt.fields.outcome.enum.includes('carrier-lost'));
  assert.ok(receipt.fields.outcome.enum.includes('abandoned-before-brief'));
  assert.ok(receipt.outcomeRule.some((rule) => /abandoned-before-brief/.test(rule)));
});

test('terminal outcomes are the interactive subset of the agent protocol results', () => {
  assert.deepEqual(Object.keys(outcomes.outcomes), ['ready', 'blocked', 'delivered', 'delivery-unknown', 'completed', 'needs-human']);
  for (const name of Object.keys(outcomes.outcomes)) assert.ok(name in agentProtocol.results, `${name} is an agent-protocol result`);
  assert.deepEqual(outcomes.outcomes.blocked.fields.reason.enum, ['trust-dialog', 'login', 'usage-limit']);
  for (const reason of outcomes.outcomes.blocked.fields.reason.enum) assert.ok(agentProtocol.results.blocked.reason.enum.includes(reason));
  assert.ok('resultPath' in outcomes.outcomes.completed.fields);
});
