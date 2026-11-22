// test/component-authority/components.test.mjs — Verification of component-authority model (Phase 3)
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const modelDir = path.join(root, 'packages/component-authority/model');
const schemaPath = path.join(root, 'packages/component-authority/contracts/model.v1.json');

const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const components = JSON.parse(fs.readFileSync(path.join(modelDir, 'components.json'), 'utf8'));
const decisionKinds = JSON.parse(fs.readFileSync(path.join(modelDir, 'decision-kinds.json'), 'utf8'));
const layers = JSON.parse(fs.readFileSync(path.join(modelDir, 'layers.json'), 'utf8'));

test('model: components.json, decision-kinds.json, doors/*.json, and layers.json validate against model.v1.json schema', () => {
  const componentDef = schema.$defs.component;
  const decisionKindDef = schema.$defs.decisionKind;
  const layersDef = schema.$defs.layers;
  const doorDef = schema.$defs.door;

  // Validate layers.json
  for (const req of layersDef.required) {
    assert.ok(req in layers, `layers.json missing required field "${req}"`);
  }
  for (const key of Object.keys(layers)) {
    assert.ok(key in layersDef.properties, `layers.json has unknown field "${key}"`);
  }

  // Validate each component
  const idPattern = new RegExp(componentDef.properties.id.pattern);
  const validLayers = new Set(componentDef.properties.layer.enum);
  const validStatuses = new Set(componentDef.properties.status.enum);

  for (const [idx, comp] of components.entries()) {
    for (const req of componentDef.required) {
      assert.ok(req in comp, `component[${idx}] (${comp.id}) missing required field "${req}"`);
    }
    for (const key of Object.keys(comp)) {
      assert.ok(key in componentDef.properties, `component[${idx}] (${comp.id}) has unknown field "${key}"`);
    }
    assert.ok(idPattern.test(comp.id), `component[${idx}] id "${comp.id}" does not match pattern`);
    assert.ok(typeof comp.canonical === 'string' && comp.canonical.length > 0);
    assert.ok(Array.isArray(comp.aliases));
    for (const a of comp.aliases) assert.ok(typeof a === 'string');
    assert.ok(typeof comp.meaning === 'string' && comp.meaning.length > 0);
    assert.ok(validLayers.has(comp.layer), `component[${idx}] invalid layer "${comp.layer}"`);
    assert.ok(Number.isInteger(comp.tier) && comp.tier >= 0 && comp.tier <= 9);
    assert.ok(Array.isArray(comp.paths));
    assert.ok(Array.isArray(comp.owns));
    assert.ok(Array.isArray(comp.mustNotOwn));
    assert.ok(typeof comp.spec === 'string');
    assert.ok(Array.isArray(comp.source));
    assert.ok(validStatuses.has(comp.status));

    if (comp.parent !== undefined) {
      assert.ok(typeof comp.parent === 'string' && comp.parent.length > 0);
    }

    if (comp.exceptions !== undefined) {
      assert.ok(Array.isArray(comp.exceptions));
      for (const exc of comp.exceptions) {
        assert.ok(typeof exc.path === 'string' && exc.path.length > 0);
        assert.ok(typeof exc.reason === 'string' && exc.reason.length > 0);
        if (exc.layer !== undefined) assert.ok(validLayers.has(exc.layer));
        if (exc.tier !== undefined) assert.ok(Number.isInteger(exc.tier) && exc.tier >= 0 && exc.tier <= 9);
        for (const k of Object.keys(exc)) {
          assert.ok(['path', 'layer', 'tier', 'reason'].includes(k), `Unknown exception property "${k}"`);
        }
      }
    }
  }

  // Validate each decision kind
  for (const [idx, dk] of decisionKinds.entries()) {
    for (const req of decisionKindDef.required) {
      assert.ok(req in dk, `decisionKind[${idx}] (${dk.id}) missing required field "${req}"`);
    }
    for (const key of Object.keys(dk)) {
      assert.ok(key in decisionKindDef.properties, `decisionKind[${idx}] (${dk.id}) has unknown field "${key}"`);
    }
    assert.ok(typeof dk.id === 'string' && dk.id.length > 0);
    assert.ok(typeof dk.canonical === 'string' && dk.canonical.length > 0);
    assert.ok(Array.isArray(dk.aliases));
    for (const a of dk.aliases) assert.ok(typeof a === 'string');
    assert.ok(typeof dk.meaning === 'string' && dk.meaning.length > 0);
    assert.ok(typeof dk.owner === 'string' && dk.owner.length > 0);
    assert.ok(typeof dk.narrative === 'string' && dk.narrative.length > 0);
  }

  // Validate each door in doors/*.json
  const doorsDir = path.join(modelDir, 'doors');
  const doorFiles = fs.readdirSync(doorsDir).filter((f) => f.endsWith('.json')).sort();
  assert.ok(doorFiles.length > 0, 'doors directory must contain door definitions');

  for (const file of doorFiles) {
    const door = JSON.parse(fs.readFileSync(path.join(doorsDir, file), 'utf8'));
    for (const req of doorDef.required) {
      assert.ok(req in door, `door "${file}" missing required field "${req}"`);
    }
    for (const key of Object.keys(door)) {
      assert.ok(key in doorDef.properties, `door "${file}" has unknown field "${key}"`);
    }
    assert.ok(typeof door.job === 'string' && door.job.length > 0, `door "${file}" invalid job`);
    assert.ok(typeof door.kind === 'string' && door.kind.length > 0, `door "${file}" invalid kind`);
    assert.ok(Array.isArray(door.patterns), `door "${file}" patterns must be an array`);
    for (const p of door.patterns) {
      assert.ok(typeof p === 'string', `door "${file}" pattern must be string`);
    }
    assert.ok(Array.isArray(door.allowed), `door "${file}" allowed must be an array`);
    for (const item of door.allowed) {
      if (typeof item === 'string') continue;
      assert.ok(typeof item === 'object' && item !== null, `door "${file}" allowed item invalid`);
      assert.ok(typeof item.path === 'string' && item.path.length > 0, `door "${file}" allowed item missing path`);
      if (item.reason !== undefined) assert.ok(typeof item.reason === 'string');
      for (const k of Object.keys(item)) {
        assert.ok(['path', 'reason'].includes(k), `door "${file}" allowed item has unknown property "${k}"`);
      }
    }
    if (door.debt !== undefined) {
      assert.ok(Array.isArray(door.debt), `door "${file}" debt must be an array`);
      for (const item of door.debt) {
        if (typeof item === 'string') continue;
        assert.ok(typeof item === 'object' && item !== null, `door "${file}" debt item invalid`);
        assert.ok(typeof item.path === 'string' && item.path.length > 0, `door "${file}" debt item missing path`);
        if (item.reason !== undefined) assert.ok(typeof item.reason === 'string');
        for (const k of Object.keys(item)) {
          assert.ok(['path', 'reason'].includes(k), `door "${file}" debt item has unknown property "${k}"`);
        }
      }
    }
    if (door.reason !== undefined) assert.ok(typeof door.reason === 'string');
    if (door.retiredBy !== undefined) assert.ok(typeof door.retiredBy === 'string');
    if (door.owner !== undefined) assert.ok(typeof door.owner === 'string');
  }
});

test('first row of components.json is component-authority', () => {
  assert.equal(components.length > 0, true);
  assert.equal(components[0].id, 'component-authority');
});

test('component ids are unique', () => {
  const seen = new Set();
  for (const comp of components) {
    assert.equal(seen.has(comp.id), false, `Duplicate component id "${comp.id}"`);
    seen.add(comp.id);
  }
});

test('every parent component reference exists in components.json', () => {
  const componentIds = new Set(components.map((c) => c.id));
  for (const comp of components) {
    if (comp.parent) {
      assert.ok(componentIds.has(comp.parent), `Component "${comp.id}" references non-existent parent "${comp.parent}"`);
    }
  }
});

test('every decision-kind owner exists in components.json and each decision kind has exactly one owner', () => {
  const componentIds = new Set(components.map((c) => c.id));
  for (const dk of decisionKinds) {
    assert.ok(typeof dk.owner === 'string' && dk.owner.length > 0, `Decision kind "${dk.id}" must have owner string`);
    assert.ok(componentIds.has(dk.owner), `Decision kind "${dk.id}" owner "${dk.owner}" does not exist in components.json`);
  }
});

test('every spec, source, and decision-kind narrative path exists on disk', () => {
  for (const comp of components) {
    const specPath = path.join(root, comp.spec);
    assert.ok(fs.existsSync(specPath), `Component "${comp.id}" spec file missing on disk: ${comp.spec}`);

    for (const src of comp.source) {
      const srcPath = path.join(root, src);
      assert.ok(fs.existsSync(srcPath), `Component "${comp.id}" source path missing on disk: ${src}`);
    }
  }

  for (const dk of decisionKinds) {
    const narrativePath = path.join(root, dk.narrative);
    assert.ok(fs.existsSync(narrativePath), `Decision kind "${dk.id}" narrative path missing on disk: ${dk.narrative}`);
  }
});

test('every component paths[] entry exists on disk', () => {
  for (const comp of components) {
    for (const p of comp.paths) {
      const full = path.join(root, p);
      if (p.endsWith('/')) {
        assert.ok(
          fs.existsSync(full) && fs.statSync(full).isDirectory(),
          `component "${comp.id}" paths[] directory missing on disk: ${p}`,
        );
      } else {
        assert.ok(
          fs.existsSync(full),
          `component "${comp.id}" paths[] entry missing on disk: ${p}`,
        );
      }
    }
  }
});

test('canonical and aliases are unique across components and decision kinds (case-insensitive)', () => {
  const names = new Map();

  for (const comp of components) {
    const cKey = comp.canonical.toLowerCase();
    assert.equal(names.has(cKey), false, `Collision on canonical "${comp.canonical}" from component "${comp.id}" (already claimed by ${names.get(cKey)})`);
    names.set(cKey, `component:${comp.id}`);

    for (const alias of comp.aliases) {
      const aKey = alias.toLowerCase();
      assert.equal(names.has(aKey), false, `Collision on alias "${alias}" from component "${comp.id}" (already claimed by ${names.get(aKey)})`);
      names.set(aKey, `component:${comp.id}`);
    }
  }

  for (const dk of decisionKinds) {
    const cKey = dk.canonical.toLowerCase();
    assert.equal(names.has(cKey), false, `Collision on canonical "${dk.canonical}" from decision-kind "${dk.id}" (already claimed by ${names.get(cKey)})`);
    names.set(cKey, `decisionKind:${dk.id}`);

    for (const alias of dk.aliases) {
      const aKey = alias.toLowerCase();
      assert.equal(names.has(aKey), false, `Collision on alias "${alias}" from decision-kind "${dk.id}" (already claimed by ${names.get(aKey)})`);
      names.set(aKey, `decisionKind:${dk.id}`);
    }
  }
});
