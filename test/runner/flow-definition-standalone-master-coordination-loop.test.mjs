import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

import { validateFlowDefinition, FlowDefinitionError } from '../../src/runner/definitions/schema.mjs';
import { loadCoordinationProtocol, discoverCoordinationProtocols } from '../../src/runner/definitions/protocol-loader.mjs';

const require = createRequire(import.meta.url);

const FIXTURE_ID = 'core.coordination-protocol.standalone-master-coordination-loop';
const FIXTURE_PATH = path.join(import.meta.dirname, '..', '..', 'core', 'coordination-protocols', 'standalone-master-coordination-loop.yaml');

function loadRawFixture() {
  const yaml = require('yaml');
  return yaml.parse(fs.readFileSync(FIXTURE_PATH, 'utf8'));
}

function mkTempDir(prefix) {
  return fs.mkdtempSync(path.join(require('node:os').tmpdir(), prefix));
}

test('standalone-master-coordination-loop loads from the packaged protocol registry and validates as CoordinationProtocol', () => {
  const entries = discoverCoordinationProtocols({ cwd: mkTempDir('flow-definition-master-loop-discovery-') });
  const entry = entries.find((e) => e.definition.metadata.id === FIXTURE_ID);
  assert.ok(entry, 'standalone-master-coordination-loop must be discoverable from the core tier');
  assert.equal(entry.tier, 'core');
  assert.equal(entry.definition.spec.profile.kind, 'CoordinationProtocol');
  assert.ok(Object.isFrozen(entry.definition));

  const def = loadCoordinationProtocol(FIXTURE_ID, { cwd: mkTempDir('flow-definition-master-loop-lookup-') });
  assert.equal(def.metadata.id, FIXTURE_ID);
  assert.equal(def.metadata.version, '1.0.0');
});

test('standalone-master-coordination-loop declares worker actors only -- no coordinator-role actor', () => {
  // There is no generic schema-level "coordinator" concept to test against
  // -- spec.actors[].role is a free-form string checked only against
  // spec.roles (src/runner/definitions/schema.mjs). This is a content
  // assertion on this specific fixture's own declared actors, not a
  // schema mechanism.
  const def = loadCoordinationProtocol(FIXTURE_ID, { cwd: mkTempDir('flow-definition-master-loop-actors-') });
  const roleIds = def.spec.actors.map((actor) => actor.role).sort();
  assert.deepEqual(roleIds, ['doer', 'fixer', 'red-team', 'reviewer']);
  assert.ok(!roleIds.includes('coordinator'), 'no actor may declare a coordinator/driver role');
  assert.ok(!roleIds.includes('driver'), 'no actor may declare a coordinator/driver role');
});

test('standalone-master-coordination-loop declares the required first-pass and declared revision/recheck operations', () => {
  const def = loadCoordinationProtocol(FIXTURE_ID, { cwd: mkTempDir('flow-definition-master-loop-ops-') });
  const opIds = def.spec.operations.map((op) => op.id).sort();
  assert.deepEqual(opIds, [
    'produce-candidate',
    'red-team-candidate',
    'red-team-recheck',
    'review-candidate',
    'reviewer-recheck',
    'revise-candidate',
  ]);

  const nodesByOp = new Map();
  const actorByOp = new Map();
  for (const node of def.spec.graph.nodes) {
    for (const opRef of node.operations) {
      nodesByOp.set(opRef.ref, node.id);
      actorByOp.set(opRef.ref, opRef.actor);
    }
  }
  // Required first pass (candidate -> review + red-team) resolves before
  // the declared revision/recheck positions, in dependency order.
  assert.equal(nodesByOp.get('produce-candidate'), 'phase-produce');
  assert.equal(nodesByOp.get('review-candidate'), 'phase-first-pass');
  assert.equal(nodesByOp.get('red-team-candidate'), 'phase-first-pass');
  assert.equal(nodesByOp.get('revise-candidate'), 'phase-revision');
  assert.equal(nodesByOp.get('reviewer-recheck'), 'phase-recheck');
  assert.equal(nodesByOp.get('red-team-recheck'), 'phase-recheck');

  // Each operation must be wired to the actor its role implies -- a
  // swapped actor binding would otherwise pass every check above silently.
  assert.equal(actorByOp.get('produce-candidate'), 'doer');
  assert.equal(actorByOp.get('review-candidate'), 'reviewer');
  assert.equal(actorByOp.get('red-team-candidate'), 'red-team');
  assert.equal(actorByOp.get('revise-candidate'), 'fixer');
  assert.equal(actorByOp.get('reviewer-recheck'), 'reviewer');
  assert.equal(actorByOp.get('red-team-recheck'), 'red-team');

  // Graph shape: single entry node and exactly the four declared phases --
  // an orphan node or wrong entry would otherwise validate unnoticed.
  assert.equal(def.spec.graph.entry, 'phase-produce');
  assert.deepEqual(
    def.spec.graph.nodes.map((n) => n.id).sort(),
    ['phase-first-pass', 'phase-produce', 'phase-recheck', 'phase-revision'],
  );
});

test('standalone-master-coordination-loop declares no topology and no profile.completion/cohort fields', () => {
  const def = loadCoordinationProtocol(FIXTURE_ID, { cwd: mkTempDir('flow-definition-master-loop-profile-') });
  assert.equal(def.spec.profile.topology, undefined);
  assert.equal(def.spec.profile.completion, undefined);
  assert.equal(def.spec.profile.cohort, undefined);
});

test('standalone-master-coordination-loop rejects a mutated copy that injects spec.profile.work', () => {
  const raw = loadRawFixture();
  raw.spec.profile = { ...raw.spec.profile, work: { baseStepMap: { 'phase-produce': 'Execute' } } };
  assert.throws(
    () => validateFlowDefinition(raw),
    (err) => err instanceof FlowDefinitionError && /spec\.profile has unknown field "work"/.test(err.message),
  );
});

test('standalone-master-coordination-loop rejects a mutated copy that injects baseStepMap directly on spec.profile', () => {
  const raw = loadRawFixture();
  raw.spec.profile = { ...raw.spec.profile, baseStepMap: { 'phase-produce': 'Execute' } };
  assert.throws(
    () => validateFlowDefinition(raw),
    (err) => err instanceof FlowDefinitionError && /spec\.profile has unknown field "baseStepMap"/.test(err.message),
  );
});
