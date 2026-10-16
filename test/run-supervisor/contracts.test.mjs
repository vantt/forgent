import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { canonicalJson, computeSha256Digest } from '../../src/runner/dispatch/proof-helpers.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const readJson = (rel) => JSON.parse(readFileSync(join(root, rel), 'utf8'));

const contractFiles = [
  ...readdirSync(join(root, 'packages/run-supervisor/contracts'))
    .filter((name) => name.endsWith('.json'))
    .map((name) => `packages/run-supervisor/contracts/${name}`),
  'packages/process/contracts/containment.port.v1.json',
  'packages/agent-protocol/contracts/agent-protocol.v1.json',
];

const DOMAIN_KINDS = ['linux-gate', 'linux-pgroup', 'windows-job', 'macos-tree'];

test('every run-supervisor contract parses and names its id and version', () => {
  for (const rel of contractFiles) {
    const doc = readJson(rel);
    assert.equal(typeof doc.contract?.id, 'string', rel);
    assert.ok(Number.isInteger(doc.contract?.version), rel);
    const suffix = rel.match(/\.v(\d+)\.json$/)?.[1];
    assert.equal(String(doc.contract.version), suffix, `${rel}: file suffix matches contract version`);
  }
});

test('envelope digest vectors reproduce through the Node canonical JSON', () => {
  const vectors = readJson('packages/run-supervisor/contracts/vectors/envelope-digest.v1.json');
  assert.ok(vectors.cases.length >= 4);
  for (const { name, input, canonical, digest } of vectors.cases) {
    const { digest: _excluded, ...rest } = input;
    assert.equal(canonicalJson(rest), canonical, name);
    assert.equal(computeSha256Digest(rest), digest, name);
  }
});

test('the envelope vector is a complete v3 direct envelope', () => {
  const envelope = readJson('packages/run-supervisor/contracts/vectors/envelope-digest.v1.json').cases
    .find((c) => c.name === 'envelope-direct-mutating').input;
  const contract = readJson('packages/run-supervisor/contracts/envelope.v3.json');
  for (const field of Object.keys(contract.fields).filter((f) => f !== 'slot')) {
    assert.ok(field in envelope, `vector carries ${field}`);
  }
  assert.equal(envelope.v, 3);
  for (const field of Object.keys(contract.fields.launch)) assert.ok(field in envelope.launch, `launch.${field}`);
  for (const field of Object.keys(contract.fields.steps.item)) assert.ok(field in envelope.steps[0], `steps[].${field}`);
});

test('containment kinds agree across the port, the binding and the predecessor record', () => {
  const port = readJson('packages/process/contracts/containment.port.v1.json');
  const binding = readJson('packages/run-supervisor/contracts/supervisor-binding.v1.json');
  const predecessor = readJson('packages/holder-lock/contracts/predecessor.v1.json');
  const envelope = readJson('packages/run-supervisor/contracts/envelope.v3.json');
  assert.deepEqual(port.domain.kind.enum, DOMAIN_KINDS);
  assert.deepEqual(binding.fields.domain.kind.enum, DOMAIN_KINDS);
  assert.deepEqual(predecessor.record.domainKind.enum, DOMAIN_KINDS);
  assert.deepEqual(envelope.fields.containment.preferred.enum, DOMAIN_KINDS);
  for (const kind of DOMAIN_KINDS) {
    assert.ok(predecessor.record.domainId[kind], `predecessor domainId shape for ${kind}`);
    assert.ok(port.operations.is_empty.drivers[kind], `is_empty rule for ${kind}`);
    assert.ok(port.operations.guarantee.drivers[kind], `guarantee for ${kind}`);
  }
});

test('the attempt lock path follows the lock registry row', () => {
  const registry = readJson('packages/holder-lock/contracts/lock-registry.v1.json');
  const row = registry.locks.find((lock) => lock.name === 'attempt');
  assert.equal(row.rank, 15);
  assert.equal(row.kind, 'lease');
  assert.equal(row.v3Path, '<runDir>/runs/<NN>/attempt.lock');
  const envelope = readJson('packages/run-supervisor/contracts/envelope.v3.json');
  assert.match(envelope.layout.attemptDir, /^<assignmentDir>\/runs\/<NN>/);
  assert.equal(envelope.layout.lockFile.split(' ')[0], '<attemptDir>/attempt.lock');
});

test('receipt outcomes and step ids are shared by every contract that names them', () => {
  const receipt = readJson('packages/run-supervisor/contracts/receipt.v1.json');
  const route = readJson('packages/run-supervisor/contracts/internal-route.run-supervisor.v1.json');
  const step = readJson('packages/run-supervisor/contracts/step-receipt.v1.json');
  const envelope = readJson('packages/run-supervisor/contracts/envelope.v3.json');
  assert.deepEqual(step.fields.stepId.enum, envelope.fields.steps.item.stepId.enum);
  assert.deepEqual(receipt.fields.outcome.enum, ['exited', 'timeout', 'cancelled', 'gate-lost', 'carrier-lost', 'abandoned-not-started']);
  assert.equal(route.common.exitCodes['3'], 'host-version-mismatch');
  for (const name of ['supervise', 'gate', 'adopt', 'attempt-step', 'lock-scan']) {
    assert.match(route.routes[name].argv, /--protocol 1/, `${name} requires the protocol flag`);
    assert.doesNotMatch(route.routes[name].argv, /--[a-z-]+=/, `${name} uses --name value syntax`);
  }
});
