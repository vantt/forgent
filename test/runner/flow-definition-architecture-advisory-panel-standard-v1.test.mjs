// flow-definition-architecture-advisory-panel-standard-v1.test.mjs -- Unit
// I27 (panel-depth experiment): proves
// `core/coordination-protocols/architecture-advisory-panel-standard-v1.yaml`
// diverges from `architecture-advisory-panel-v1.yaml` in EXACTLY the
// allowlisted delta the plan's own I27 unit block declares (removing
// `phase-redteam`'s node/actor/role/operation and the `post-redteam-open`
// window, re-pointing `phase-synthesis.transitions` and
// `phase-explanation`'s gate, and `metadata.id`), never more, never less --
// a byte-diff or a hand-read is not durable enough to catch silent drift on
// a future edit to either file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

import { loadCoordinationProtocol, discoverCoordinationProtocols } from '../../src/runner/definitions/protocol-loader.mjs';

const require = createRequire(import.meta.url);

const FULL_ID = 'core.coordination-protocol.architecture-advisory-panel-v1';
const STANDARD_ID = 'core.coordination-protocol.architecture-advisory-panel-standard-v1';
const PROTOCOLS_DIR = path.join(import.meta.dirname, '..', '..', 'core', 'coordination-protocols');
const FULL_PATH = path.join(PROTOCOLS_DIR, 'architecture-advisory-panel-v1.yaml');
const STANDARD_PATH = path.join(PROTOCOLS_DIR, 'architecture-advisory-panel-standard-v1.yaml');

function loadRawYaml(filePath) {
  const yaml = require('yaml');
  return yaml.parse(fs.readFileSync(filePath, 'utf8'));
}

function mkTempDir(prefix) {
  return fs.mkdtempSync(path.join(require('node:os').tmpdir(), prefix));
}

// Applies the exact allowlisted delta (Unit I27 unit block, "scope" §1) to a
// deep clone of the full protocol's raw parsed doc, so the result can be
// deep-equal-compared against the standard variant's own raw parsed doc.
function applyAllowlistedDelta(fullDoc) {
  const doc = structuredClone(fullDoc);

  doc.metadata.id = STANDARD_ID;

  doc.spec.roles = doc.spec.roles.filter((role) => role !== 'red-team');
  doc.spec.actors = doc.spec.actors.filter((actor) => actor.id !== 'red-team-actor');
  doc.spec.operations = doc.spec.operations.filter((op) => op.id !== 'red-team-packet');
  doc.spec.profile.topology.visibilityWindows = doc.spec.profile.topology.visibilityWindows.filter(
    (window) => window.id !== 'post-redteam-open',
  );

  doc.spec.graph.nodes = doc.spec.graph.nodes.filter((node) => node.id !== 'phase-redteam');
  const synthesisNode = doc.spec.graph.nodes.find((node) => node.id === 'phase-synthesis');
  synthesisNode.transitions = ['phase-explanation'];
  const explanationNode = doc.spec.graph.nodes.find((node) => node.id === 'phase-explanation');
  explanationNode.operations[0].contextAccess.visibilityWindowRef = 'post-synthesis-open';

  return doc;
}

test('architecture-advisory-panel-standard-v1 equals architecture-advisory-panel-v1 minus exactly the allowlisted delta', () => {
  const fullDoc = loadRawYaml(FULL_PATH);
  const standardDoc = loadRawYaml(STANDARD_PATH);
  const expectedStandardDoc = applyAllowlistedDelta(fullDoc);

  assert.deepEqual(
    standardDoc.spec,
    expectedStandardDoc.spec,
    'the standard variant must diverge from the full protocol in exactly the allowlisted delta -- no other node/operation/actor/role/window content may differ',
  );
  assert.equal(standardDoc.metadata.id, STANDARD_ID);
  assert.equal(standardDoc.metadata.version, fullDoc.metadata.version, 'the standard variant starts at the same version baseline as the full protocol');
});

test('architecture-advisory-panel-standard-v1 drops red-team from both spec.actors and spec.roles, not just the actor', () => {
  const standardDoc = loadRawYaml(STANDARD_PATH);
  assert.ok(!standardDoc.spec.roles.includes('red-team'), 'red-team must not remain a declared, unused role');
  assert.ok(!standardDoc.spec.actors.some((actor) => actor.role === 'red-team'), 'no actor may bind the red-team role');
});

test('architecture-advisory-panel-standard-v1 loads from the packaged protocol registry and validates as CoordinationProtocol', () => {
  const entries = discoverCoordinationProtocols({ cwd: mkTempDir('flow-definition-panel-standard-discovery-') });
  const entry = entries.find((e) => e.definition.metadata.id === STANDARD_ID);
  assert.ok(entry, 'architecture-advisory-panel-standard-v1 must be discoverable from the core tier');
  assert.equal(entry.tier, 'core');
  assert.equal(entry.definition.spec.profile.kind, 'CoordinationProtocol');
  assert.ok(Object.isFrozen(entry.definition));

  const def = loadCoordinationProtocol(STANDARD_ID, { cwd: mkTempDir('flow-definition-panel-standard-lookup-') });
  assert.equal(def.metadata.id, STANDARD_ID);
  assert.equal(def.metadata.version, '1.0.0');
});

test('architecture-advisory-panel-standard-v1 runs no red-team operation and gates explanation directly on synthesis settling', () => {
  const def = loadCoordinationProtocol(STANDARD_ID, { cwd: mkTempDir('flow-definition-panel-standard-graph-') });
  const opIds = def.spec.operations.map((op) => op.id);
  assert.ok(!opIds.includes('red-team-packet'), 'the standard variant must never dispatch red-team-packet');

  const nodeIds = def.spec.graph.nodes.map((node) => node.id);
  assert.ok(!nodeIds.includes('phase-redteam'), 'the standard variant must never declare a phase-redteam graph node');

  const synthesisNode = def.spec.graph.nodes.find((node) => node.id === 'phase-synthesis');
  assert.deepEqual(synthesisNode.transitions, ['phase-explanation']);

  const explanationNode = def.spec.graph.nodes.find((node) => node.id === 'phase-explanation');
  const explainOp = explanationNode.operations.find((op) => op.ref === 'explain-recommendation');
  assert.equal(explainOp.contextAccess.visibilityWindowRef, 'post-synthesis-open');

  const windowIds = def.spec.profile.topology.visibilityWindows.map((w) => w.id);
  assert.ok(!windowIds.includes('post-redteam-open'), 'the standard variant must never declare the post-redteam-open window');
});

test('architecture-advisory-panel-v1 (the full protocol) is byte-identical/untouched: still declares red-team and post-redteam-open', () => {
  // Guards against the delta being achieved by editing the FULL protocol
  // instead of authoring the new standard file -- the unit's own "stop"
  // condition forbids touching architecture-advisory-panel-v1.yaml at all.
  const def = loadCoordinationProtocol(FULL_ID, { cwd: mkTempDir('flow-definition-panel-full-untouched-') });
  const opIds = def.spec.operations.map((op) => op.id);
  assert.ok(opIds.includes('red-team-packet'), 'the full protocol must still declare red-team-packet');
  const nodeIds = def.spec.graph.nodes.map((node) => node.id);
  assert.ok(nodeIds.includes('phase-redteam'), 'the full protocol must still declare phase-redteam');
  const windowIds = def.spec.profile.topology.visibilityWindows.map((w) => w.id);
  assert.ok(windowIds.includes('post-redteam-open'), 'the full protocol must still declare post-redteam-open');
});
