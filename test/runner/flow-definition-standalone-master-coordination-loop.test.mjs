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

// ─── Phase 03 (Step 09 P03.1) R2/R3/R4: role execution policy readiness ───

test('standalone-master-coordination-loop declares the intended cheap-by-default / analytical-by-default policy.minTier per role operation', () => {
  const def = loadCoordinationProtocol(FIXTURE_ID, { cwd: mkTempDir('flow-definition-master-loop-policy-') });
  const minTierByOp = Object.fromEntries(def.spec.operations.map((op) => [op.id, op.policy?.minTier]));

  // Doer/Fixer: cheap-by-default (R4).
  assert.equal(minTierByOp['produce-candidate'], 'standard');
  assert.equal(minTierByOp['revise-candidate'], 'standard');
  // Reviewer/Recheck: analytical read-only default (R4/R5).
  assert.equal(minTierByOp['review-candidate'], 'analytical');
  assert.equal(minTierByOp['reviewer-recheck'], 'analytical');
  // Red-Team/Recheck: analytical default, escalated to critical only via a
  // caller-supplied assignment/cli-scope PolicyPatch at dispatch time (see
  // test/runner/dispatch-coordination-role-tiers.test.mjs for the live
  // escalation proof) -- a portable operation/role/actor/definition scope
  // can never pin `critical` unconditionally without also raising the
  // floor for every OTHER round this operation dispatches, defeating "cheap
  // by default" (R6).
  assert.equal(minTierByOp['red-team-candidate'], 'analytical');
  assert.equal(minTierByOp['red-team-recheck'], 'analytical');

  // No operation declares `capabilities[]` (R1 audit finding: inert for
  // this fixture's non-cohort dispatch path -- see P03.1.md).
  for (const op of def.spec.operations) {
    assert.equal(op.capabilities, undefined, `operation "${op.id}" must not declare capabilities[] (inert on this dispatch path)`);
  }
});

test('standalone-master-coordination-loop declares no literal provider/model name anywhere (R3: capability/minTier only)', () => {
  // Comment lines (this fixture's own explanatory `#` prose, e.g. naming
  // `preferExecutor` as a concept it deliberately does NOT declare) are
  // stripped before scanning -- this test asserts no MACHINE-READABLE YAML
  // field carries a literal pin, not that the concept is never discussed in
  // prose.
  const machineReadableText = fs
    .readFileSync(FIXTURE_PATH, 'utf8')
    .split('\n')
    .filter((line) => !line.trim().startsWith('#'))
    .join('\n');
  // Every concrete model string this repo's own committed .fgos/config.json
  // modelPolicies table names for any provider (claude/gemini/openai-codex/
  // z-ai), plus the bare provider/CLI-command identifiers themselves -- a
  // portable protocol file must name NONE of them (flow-definition.md
  // PolicyPatch: "a portable ... definition expresses requirements ...
  // never literal executor/model pins").
  const forbiddenLiterals = [
    'haiku', 'sonnet', 'opus', 'claude-3', 'claude-4', 'claude-5',
    'gemini-', 'gpt-', 'glm-', 'z-ai',
    'preferExecutor',
  ];
  for (const literal of forbiddenLiterals) {
    assert.ok(!machineReadableText.toLowerCase().includes(literal.toLowerCase()), `fixture must not contain literal "${literal}" outside comments`);
  }

  // Same assertion, structurally: the VALIDATED/parsed definition (schema.mjs
  // strips nothing, but this proves the field is genuinely absent from the
  // normalized IR, not merely absent from this one raw-text scan) never
  // carries a `preferExecutor`/`preferPersona` key anywhere at any depth.
  const def = loadCoordinationProtocol(FIXTURE_ID, { cwd: mkTempDir('flow-definition-master-loop-no-pin-') });
  assert.ok(!JSON.stringify(def).includes('preferExecutor'), 'validated definition must not carry preferExecutor anywhere');
});
