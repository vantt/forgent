import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const readJson = (rel) => JSON.parse(readFileSync(join(root, rel), 'utf8'));

const registry = readJson('packages/holder-lock/contracts/lock-registry.v1.json');
const schema = readJson('packages/holder-lock/contracts/lock-registry.schema.v1.json');
const judge = readJson('packages/process/contracts/process-facts.judge.v1.json');

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

function typeOf(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (Number.isInteger(value)) return 'integer';
  return typeof value;
}

/** Validates the JSON Schema subset the registry schema uses; returns error strings. */
function validate(value, node, rootSchema, at = '$') {
  if (node.$ref) {
    const target = node.$ref.replace(/^#\//, '').split('/').reduce((acc, key) => acc[key], rootSchema);
    return validate(value, target, rootSchema, at);
  }
  const errors = [];
  if ('const' in node && value !== node.const) errors.push(`${at}: expected ${JSON.stringify(node.const)}`);
  if (node.enum && !node.enum.some((allowed) => allowed === value)) {
    errors.push(`${at}: ${JSON.stringify(value)} not in ${JSON.stringify(node.enum)}`);
  }
  if (node.type) {
    const allowed = [].concat(node.type);
    const actual = typeOf(value);
    const fits = allowed.includes(actual) || (actual === 'integer' && allowed.includes('number'));
    if (!fits) {
      errors.push(`${at}: type ${actual}, expected ${allowed.join('|')}`);
      return errors;
    }
  }
  if (typeof value === 'string' && node.pattern && !new RegExp(node.pattern).test(value)) {
    errors.push(`${at}: ${JSON.stringify(value)} does not match ${node.pattern}`);
  }
  if (typeof value === 'number' && node.minimum !== undefined && value < node.minimum) {
    errors.push(`${at}: ${value} < ${node.minimum}`);
  }
  if (Array.isArray(value)) {
    if (node.minItems !== undefined && value.length < node.minItems) errors.push(`${at}: fewer than ${node.minItems} items`);
    if (node.items) value.forEach((item, i) => errors.push(...validate(item, node.items, rootSchema, `${at}[${i}]`)));
  }
  if (isPlainObject(value)) {
    for (const key of node.required ?? []) {
      if (!(key in value)) errors.push(`${at}: missing ${key}`);
    }
    const props = node.properties ?? {};
    for (const [key, sub] of Object.entries(props)) {
      if (key in value) errors.push(...validate(value[key], sub, rootSchema, `${at}.${key}`));
    }
    if (node.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!(key in props)) errors.push(`${at}: unexpected ${key}`);
      }
    } else if (isPlainObject(node.additionalProperties)) {
      for (const [key, item] of Object.entries(value)) {
        if (!(key in props)) errors.push(...validate(item, node.additionalProperties, rootSchema, `${at}.${key}`));
      }
    }
  }
  for (const branch of node.allOf ?? []) {
    const conditionHolds = !branch.if || validate(value, branch.if, rootSchema, at).length === 0;
    if (conditionHolds && branch.then) errors.push(...validate(value, branch.then, rootSchema, at));
  }
  return errors;
}

test('registry validates against its schema', () => {
  assert.deepEqual(validate(registry, schema, schema), []);
});

test('the schema rejects a 4.2 lock without a fence', () => {
  const broken = structuredClone(registry);
  delete broken.locks.find((lock) => lock.owner === '4.2').fence;
  assert.notDeepEqual(validate(broken, schema, schema), []);
});

test('lock names are unique', () => {
  const names = registry.locks.map((lock) => lock.name);
  assert.deepEqual(names.filter((name, i) => names.indexOf(name) !== i), []);
});

test('every lock rank exists in the rank table and fits the lock kind', () => {
  for (const lock of registry.locks) {
    const entry = registry.ranks[String(lock.rank)];
    assert.ok(entry, `${lock.name}: rank ${lock.rank} is not in the rank table`);
    assert.ok(entry.kinds.includes(lock.kind), `${lock.name}: kind ${lock.kind} not allowed at rank ${lock.rank} (${entry.kinds.join('|')})`);
  }
});

test('ranks follow the documented ordering of the locks', () => {
  const rankOf = Object.fromEntries(registry.locks.map((lock) => [lock.name, lock.rank]));
  const strictlyIncreasing = ['gateway', 'attempt', 'merge-slot', 'dispatch-cwd', 'worktree-admin', 'main-checkout', 'state', 'sessions'];
  for (let i = 1; i < strictlyIncreasing.length; i += 1) {
    assert.ok(
      rankOf[strictlyIncreasing[i - 1]] < rankOf[strictlyIncreasing[i]],
      `${strictlyIncreasing[i - 1]} must rank below ${strictlyIncreasing[i]}`,
    );
  }
  assert.equal(rankOf.runner, rankOf.gateway);
  assert.equal(rankOf['porting-events'], rankOf.state);
});

test('every lock owned by 4.2 has a fence and a v1 shape that agrees with it', () => {
  const owned = registry.locks.filter((lock) => lock.owner === '4.2');
  assert.equal(owned.length, 10);
  for (const lock of owned) {
    assert.ok(['tombstone', 'blocking-generation', 'none'].includes(lock.fence), `${lock.name}: fence ${lock.fence}`);
    if (lock.v1Shape === 'ledger-dir') assert.equal(lock.fence, 'blocking-generation', `${lock.name}: a ledger needs a blocking generation`);
    else if (lock.fence !== 'none') assert.equal(lock.fence, 'tombstone', `${lock.name}: file locks are fenced by tombstone`);
    if (lock.fence === 'none') assert.ok(lock.fenceNote, `${lock.name}: an unfenced lock must say why`);
  }
  assert.deepEqual(owned.filter((lock) => lock.fence === 'none').map((lock) => lock.name), ['full-suite']);
});

test('a tombstoned lock never takes its v3 lock at the path its tombstone occupies', () => {
  for (const lock of registry.locks.filter((row) => row.fence === 'tombstone' && typeof row.v3Path === 'string')) {
    const v3Tail = lock.v3Path.replace(/^<[^>]+>/, '');
    for (const v1 of [lock.v1Path].flat().filter((value) => typeof value === 'string')) {
      assert.ok(!v1.endsWith(v3Tail), `${lock.name}: v3 ${lock.v3Path} lands on the tombstone at ${v1}`);
    }
  }
});

test('machine and run locks keep the scope the plan gives them', () => {
  const scopeOf = Object.fromEntries(registry.locks.map((lock) => [lock.name, lock.scope]));
  assert.equal(scopeOf['full-suite'], 'machine');
  assert.equal(scopeOf['provider-account'], 'machine');
  assert.equal(scopeOf['provider-state'], 'machine');
  assert.equal(scopeOf.advance, 'run');
  assert.equal(scopeOf.recovery, 'run');
  assert.equal(scopeOf.attempt, 'run');
  assert.equal(scopeOf['dispatch-cwd'], 'repo');
});

test('judge vectors cover every row of both judge tables', () => {
  const rows = judge.rules.map((rule) => rule.id);
  assert.equal(new Set(rows).size, rows.length);
  assert.equal(judge.rules.filter((rule) => rule.table === 1).length, 8);
  assert.equal(judge.rules.filter((rule) => rule.table === 2).length, 3);
  const covered = new Set(judge.vectors.map((vector) => vector.row));
  for (const row of rows) assert.ok(covered.has(row), `no vector for row ${row}`);
  for (const vector of judge.vectors) {
    assert.ok(rows.includes(vector.row), `${vector.name}: unknown row ${vector.row}`);
    assert.ok(['alive', 'dead', 'unknown'].includes(vector.expect), `${vector.name}: bad expectation`);
  }
});

test('judge vectors state the same result as the rule they exercise, except where a control says otherwise', () => {
  const resultOf = Object.fromEntries(judge.rules.map((rule) => [rule.id, rule.result]));
  for (const vector of judge.vectors) {
    if (vector.name.startsWith('control-')) continue;
    assert.equal(vector.expect, resultOf[vector.row], `${vector.name} disagrees with row ${vector.row}`);
  }
});

test('judge vectors include the observer-outside-init-namespace case and the zombie states', () => {
  const outside = judge.vectors.filter((v) => v.row === 't2.observer-outside-init-no-pidns');
  assert.ok(outside.length >= 1);
  for (const vector of outside) {
    assert.equal(vector.observer.inInitPidNs, false);
    assert.ok(!('pidNs' in vector.record));
    assert.equal(vector.expect, 'unknown');
  }
  const zombieStates = judge.vectors.filter((v) => v.row === 't1.zombie').map((v) => v.world.proc.state).sort();
  assert.deepEqual(zombieStates, ['X', 'Z']);
});

test('judge vector names are unique', () => {
  const names = judge.vectors.map((vector) => vector.name);
  assert.deepEqual(names.filter((name, i) => names.indexOf(name) !== i), []);
});

test('the Rust-owned activation, install and observe locks are leaf mutexes fenced by tombstone', () => {
  const rustOwned = registry.locks.filter((lock) => lock.owner === '4.4');
  assert.deepEqual(rustOwned.map((lock) => lock.name).sort(), ['activation', 'install', 'observe']);
  const expected = {
    activation: { scope: 'repo', v3Path: '<fgosDir>/locks/activation.lock', v1Shape: 'file-link', v1Path: '.fgos/installation/activation.lock' },
    install: { scope: 'machine', v3Path: '<lockRoot>/install.lock', v1Shape: 'file-wx', v1Path: '<stateRoot>/install.lock' },
    observe: { scope: 'repo', v3Path: '<fgosDir>/locks/observe.lock', v1Shape: 'file-wx', v1Path: '.fgos/observe/.lock' },
  };
  for (const lock of rustOwned) {
    assert.equal(lock.kind, 'mutex', `${lock.name}: kind`);
    assert.equal(lock.rank, 80, `${lock.name}: rank`);
    assert.equal(lock.fence, 'tombstone', `${lock.name}: fence`);
    const want = expected[lock.name];
    for (const key of Object.keys(want)) assert.equal(lock[key], want[key], `${lock.name}: ${key}`);
  }
});
