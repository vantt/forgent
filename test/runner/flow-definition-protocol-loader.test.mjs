import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  discoverCoordinationProtocols,
  loadCoordinationProtocol,
} from '../../src/runner/definitions/protocol-loader.mjs';
import { API_VERSION, KIND, FlowDefinitionError } from '../../src/runner/definitions/schema.mjs';

function mkTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function minimalProtocolDoc(id, overrides = {}) {
  return {
    apiVersion: API_VERSION,
    kind: KIND,
    metadata: { id, version: '1.0.0' },
    spec: {
      profile: { kind: 'CoordinationProtocol', completion: { mode: 'all-required' } },
      roles: ['researcher'],
      actors: [{ id: 'actor-1', role: 'researcher' }],
      operations: [{ id: 'op-research', role: 'researcher', result: { kind: 'advisory' } }],
      graph: {
        entry: 'phase-1',
        nodes: [{ id: 'phase-1', operations: [{ ref: 'op-research', actor: 'actor-1' }], transitions: [] }],
      },
    },
    ...overrides,
  };
}

function writeYaml(dir, fileName, doc) {
  fs.mkdirSync(dir, { recursive: true });
  const yaml = require('yaml');
  fs.writeFileSync(path.join(dir, fileName), yaml.stringify(doc));
}

function writeJson(dir, fileName, doc) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, fileName), JSON.stringify(doc, null, 2));
}

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

// ---------------------------------------------------------------------------
// R7: the two shipped core fixtures discover and normalize cleanly.
// ---------------------------------------------------------------------------

test('discoverCoordinationProtocols finds all shipped core fixtures (declared-consult, independent-research fan-out/fan-in and its visibility-window-gated variant, group-cognition-framework, standalone-master-coordination-loop) and normalizes them', () => {
  const entries = discoverCoordinationProtocols({ cwd: mkTempDir('flow-definition-loader-empty-cwd-') });
  const ids = entries.map((e) => e.definition.metadata.id).sort();
  assert.deepEqual(ids, [
    'core.coordination-protocol.declared-consult',
    'core.coordination-protocol.group-cognition-framework',
    'core.coordination-protocol.independent-research-fan-out-fan-in',
    'core.coordination-protocol.independent-research-fan-out-fan-in-gated',
    'core.coordination-protocol.standalone-master-coordination-loop',
  ]);
  for (const entry of entries) {
    assert.equal(entry.tier, 'core');
    assert.equal(entry.definition.spec.profile.kind, 'CoordinationProtocol');
    assert.ok(Object.isFrozen(entry.definition));
  }
});

test('loadCoordinationProtocol resolves the declared-consult fixture by id and throws not-found for an unknown id', () => {
  const cwd = mkTempDir('flow-definition-loader-lookup-');
  const def = loadCoordinationProtocol('core.coordination-protocol.declared-consult', { cwd });
  assert.equal(def.spec.profile.completion.mode, 'synthesize');
  assert.throws(
    () => loadCoordinationProtocol('does-not-exist', { cwd }),
    (err) => err instanceof FlowDefinitionError && err.category === 'not-found',
  );
});

// ---------------------------------------------------------------------------
// R6: fail-closed registry-level rules.
// ---------------------------------------------------------------------------

test('discoverCoordinationProtocols fails closed on a duplicate metadata.id within the same tier', () => {
  const cwd = mkTempDir('flow-definition-loader-dup-');
  const dir = path.join(cwd, '.fgos', 'coordination-protocols');
  writeYaml(dir, 'a.yaml', minimalProtocolDoc('dup-id'));
  writeYaml(dir, 'b.yaml', minimalProtocolDoc('dup-id'));
  assert.throws(
    () => discoverCoordinationProtocols({ cwd, packageRoot: mkTempDir('flow-definition-loader-empty-pkg-') }),
    (err) => err instanceof FlowDefinitionError && err.category === 'duplicate-id' && /dup-id/.test(err.message),
  );
});

test('discoverCoordinationProtocols fails closed on a schema-version (apiVersion) mismatch', () => {
  const cwd = mkTempDir('flow-definition-loader-version-');
  const dir = path.join(cwd, '.fgos', 'coordination-protocols');
  writeYaml(dir, 'bad-version.yaml', minimalProtocolDoc('bad-version', { apiVersion: 'fgos.dev/v0' }));
  assert.throws(
    () => discoverCoordinationProtocols({ cwd, packageRoot: mkTempDir('flow-definition-loader-empty-pkg2-') }),
    (err) => err instanceof FlowDefinitionError && /apiVersion/.test(err.message) && /bad-version\.yaml/.test(err.message),
  );
});

test('discoverCoordinationProtocols fails closed on unknown fields (reused from validateFlowDefinition)', () => {
  const cwd = mkTempDir('flow-definition-loader-unknown-field-');
  const dir = path.join(cwd, '.fgos', 'coordination-protocols');
  const doc = minimalProtocolDoc('unknown-field-doc');
  doc.spec.operations[0].purpose = 'diverge'; // forbidden field, ADR-009 Decision 5
  writeYaml(dir, 'unknown-field.yaml', doc);
  assert.throws(
    () => discoverCoordinationProtocols({ cwd, packageRoot: mkTempDir('flow-definition-loader-empty-pkg3-') }),
    (err) => err instanceof FlowDefinitionError && /purpose/.test(err.message) && /unknown-field\.yaml/.test(err.message),
  );
});

test('discoverCoordinationProtocols fails closed on an invalid reference (dangling graph.entry)', () => {
  const cwd = mkTempDir('flow-definition-loader-invalid-ref-');
  const dir = path.join(cwd, '.fgos', 'coordination-protocols');
  const doc = minimalProtocolDoc('bad-ref-doc');
  doc.spec.graph.entry = 'no-such-node';
  writeYaml(dir, 'bad-ref.yaml', doc);
  assert.throws(
    () => discoverCoordinationProtocols({ cwd, packageRoot: mkTempDir('flow-definition-loader-empty-pkg4-') }),
    (err) => err instanceof FlowDefinitionError && /entry/.test(err.message) && /bad-ref\.yaml/.test(err.message),
  );
});

test('discoverCoordinationProtocols fails closed on a Workflow-profile document placed in the protocol registry', () => {
  const cwd = mkTempDir('flow-definition-loader-wrong-profile-');
  const dir = path.join(cwd, '.fgos', 'coordination-protocols');
  writeYaml(dir, 'wrong-profile.yaml', {
    apiVersion: API_VERSION,
    kind: KIND,
    metadata: { id: 'wrong-profile-doc' },
    spec: {
      profile: { kind: 'Workflow' },
      roles: ['implementer'],
      operations: [{ id: 'op-1', role: 'implementer' }],
      graph: { entry: 'stage-1', nodes: [{ id: 'stage-1', operations: [{ ref: 'op-1' }], transitions: [] }] },
    },
  });
  assert.throws(
    () => discoverCoordinationProtocols({ cwd, packageRoot: mkTempDir('flow-definition-loader-empty-pkg5-') }),
    (err) => err instanceof FlowDefinitionError && /only accepts "CoordinationProtocol"/.test(err.message),
  );
});

test('discoverCoordinationProtocols fails closed (path-escape) on a symlink inside a scanned tier that resolves outside its own root', () => {
  const cwd = mkTempDir('flow-definition-loader-escape-');
  const dir = path.join(cwd, '.fgos', 'coordination-protocols');
  fs.mkdirSync(dir, { recursive: true });
  const outsideDir = mkTempDir('flow-definition-loader-escape-target-');
  const outsideFile = path.join(outsideDir, 'outside.yaml');
  const yaml = require('yaml');
  fs.writeFileSync(outsideFile, yaml.stringify(minimalProtocolDoc('outside-doc')));
  const linkPath = path.join(dir, 'escape-link.yaml');
  try {
    fs.symlinkSync(outsideFile, linkPath);
  } catch {
    // Symlinks may be unavailable/unprivileged in some sandboxes -- skip
    // rather than fail the whole suite on an environment limitation.
    return;
  }
  assert.throws(
    () => discoverCoordinationProtocols({ cwd, packageRoot: mkTempDir('flow-definition-loader-empty-pkg6-') }),
    (err) => err instanceof FlowDefinitionError && err.category === 'path-escape',
  );
});

// ---------------------------------------------------------------------------
// Core/project/domain discovery + project-over-global precedence.
// ---------------------------------------------------------------------------

test('discoverCoordinationProtocols: project tier shadows a same-id definition from the core tier (project overrides global)', () => {
  const packageRoot = mkTempDir('flow-definition-loader-precedence-pkg-');
  const coreDir = path.join(packageRoot, 'core', 'coordination-protocols');
  writeYaml(coreDir, 'shared.yaml', minimalProtocolDoc('shared-id', { metadata: { id: 'shared-id', version: '1.0.0' } }));

  const cwd = mkTempDir('flow-definition-loader-precedence-cwd-');
  const projectDir = path.join(cwd, '.fgos', 'coordination-protocols');
  writeYaml(projectDir, 'shared.yaml', minimalProtocolDoc('shared-id', { metadata: { id: 'shared-id', version: '2.0.0-project-override' } }));

  const entries = discoverCoordinationProtocols({ cwd, packageRoot });
  assert.equal(entries.length, 1);
  assert.equal(entries[0].tier, 'project');
  assert.equal(entries[0].definition.metadata.version, '2.0.0-project-override');
});

test('discoverCoordinationProtocols: domain tier is discovered per domains/<name>/coordination-protocols/ and shadowed by project', () => {
  const packageRoot = mkTempDir('flow-definition-loader-domain-pkg-');
  const domainDir = path.join(packageRoot, 'domains', 'coding', 'coordination-protocols');
  writeYaml(domainDir, 'coding-only.yaml', minimalProtocolDoc('domain-only-id', { metadata: { id: 'domain-only-id', version: '1.0.0' } }));

  const cwd = mkTempDir('flow-definition-loader-domain-cwd-');
  const entries = discoverCoordinationProtocols({ cwd, packageRoot });
  assert.equal(entries.length, 1);
  assert.equal(entries[0].tier, 'domain');
  assert.equal(entries[0].source, 'coding');
});

test('discoverCoordinationProtocols returns [] tiers gracefully when project/domain directories are absent (no throw)', () => {
  const cwd = mkTempDir('flow-definition-loader-absent-tiers-');
  const packageRootWithNoDomains = mkTempDir('flow-definition-loader-absent-domains-pkg-');
  const entries = discoverCoordinationProtocols({ cwd, packageRoot: packageRootWithNoDomains });
  assert.deepEqual(entries, []);
});

test('discoverCoordinationProtocols is deterministic: two scans of the same fixture tree produce deep-equal results', () => {
  const cwd = mkTempDir('flow-definition-loader-determinism-cwd-');
  const packageRoot = mkTempDir('flow-definition-loader-determinism-pkg-');
  const coreDir = path.join(packageRoot, 'core', 'coordination-protocols');
  writeYaml(coreDir, 'z.yaml', minimalProtocolDoc('z-id'));
  writeYaml(coreDir, 'a.yaml', minimalProtocolDoc('a-id'));

  const first = discoverCoordinationProtocols({ cwd, packageRoot });
  const second = discoverCoordinationProtocols({ cwd, packageRoot });
  assert.deepEqual(first, second);
  // sorted filename order within the tier -- 'a.yaml' before 'z.yaml'
  assert.deepEqual(first.map((e) => e.definition.metadata.id), ['a-id', 'z-id']);
});

test('discoverCoordinationProtocols supports .json fixture files alongside .yaml', () => {
  const cwd = mkTempDir('flow-definition-loader-json-cwd-');
  const dir = path.join(cwd, '.fgos', 'coordination-protocols');
  writeJson(dir, 'json-doc.json', minimalProtocolDoc('json-doc-id'));
  const entries = discoverCoordinationProtocols({ cwd, packageRoot: mkTempDir('flow-definition-loader-json-pkg-') });
  assert.equal(entries.length, 1);
  assert.equal(entries[0].definition.metadata.id, 'json-doc-id');
});

// ---------------------------------------------------------------------------
// Malformed definition leaves files unchanged; discovery never writes.
// ---------------------------------------------------------------------------

test('discoverCoordinationProtocols never writes: a malformed fixture directory is byte-for-byte unchanged after a failed scan', () => {
  const cwd = mkTempDir('flow-definition-loader-readonly-');
  const dir = path.join(cwd, '.fgos', 'coordination-protocols');
  const doc = minimalProtocolDoc('malformed-doc');
  doc.spec.graph.entry = 'no-such-node';
  writeYaml(dir, 'malformed.yaml', doc);

  const filePath = path.join(dir, 'malformed.yaml');
  const before = fs.readFileSync(filePath, 'utf8');
  const statBefore = fs.statSync(filePath);

  assert.throws(() => discoverCoordinationProtocols({ cwd, packageRoot: mkTempDir('flow-definition-loader-readonly-pkg-') }));
  assert.throws(() => discoverCoordinationProtocols({ cwd, packageRoot: mkTempDir('flow-definition-loader-readonly-pkg2-') }));

  const after = fs.readFileSync(filePath, 'utf8');
  const statAfter = fs.statSync(filePath);
  assert.equal(before, after);
  assert.equal(statBefore.mtimeMs, statAfter.mtimeMs);
});
