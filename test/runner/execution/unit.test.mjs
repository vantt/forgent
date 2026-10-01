import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateUnit } from '../../../src/runner/execution/unit.mjs';
import { RunnerConfigError } from '../../../src/runner/dispatch/config.mjs';

test('validateUnit: accepts a minimal valid unit and returns frozen object', () => {
  const raw = {
    id: 'unit-1',
    objective: 'Implement feature X',
    capability: 'code:implement',
  };
  const unit = validateUnit(raw);
  assert.equal(unit.id, 'unit-1');
  assert.equal(unit.objective, 'Implement feature X');
  assert.equal(unit.capability, 'code:implement');
  assert.equal(unit.rigor, undefined);
  assert.deepEqual(unit.writes, []);
  assert.deepEqual(unit.dependsOn, []);
  assert.equal(unit.pattern, undefined);
  assert.deepEqual(unit.inputs, []);
  assert.deepEqual(unit.expectedOutputs, []);
  assert.ok(Object.isFrozen(unit));
  assert.ok(Object.isFrozen(unit.writes));
  assert.ok(Object.isFrozen(unit.dependsOn));
  assert.ok(Object.isFrozen(unit.inputs));
  assert.ok(Object.isFrozen(unit.expectedOutputs));
});

test('validateUnit: accepts full valid unit with optional fields and unit-run input', () => {
  const raw = {
    id: 'unit-2',
    objective: 'Review feature X',
    capability: 'review',
    rigor: 'high',
    writes: ['src/runner/execution/unit.mjs', 'test/runner/execution/unit.test.mjs'],
    dependsOn: ['unit-1'],
    pattern: 'reviewed',
    inputs: ['src/runner/execution/unit.mjs', 'unit-run:unit-1/worker'],
    expectedOutputs: ['findings.json'],
  };
  const unit = validateUnit(raw);
  assert.equal(unit.id, 'unit-2');
  assert.equal(unit.objective, 'Review feature X');
  assert.equal(unit.capability, 'review');
  assert.equal(unit.rigor, 'high');
  assert.deepEqual(unit.writes, ['src/runner/execution/unit.mjs', 'test/runner/execution/unit.test.mjs']);
  assert.deepEqual(unit.dependsOn, ['unit-1']);
  assert.equal(unit.pattern, 'reviewed');
  assert.deepEqual(unit.inputs, ['src/runner/execution/unit.mjs', 'unit-run:unit-1/worker']);
  assert.deepEqual(unit.expectedOutputs, ['findings.json']);
});

test('validateUnit: rejects non-object or null raw', () => {
  assert.throws(() => validateUnit(null), RunnerConfigError);
  assert.throws(() => validateUnit(undefined), RunnerConfigError);
  assert.throws(() => validateUnit('hello'), RunnerConfigError);
  assert.throws(() => validateUnit([]), RunnerConfigError);
});

test('validateUnit: G2 check rejects disallowed execution mechanics fields', () => {
  const disallowed = [
    'executor',
    'provider',
    'model',
    'tier',
    'invocation',
    'actors',
    'prefer',
    'overrides',
  ];
  for (const field of disallowed) {
    const raw = {
      id: 'unit-g2',
      objective: 'some objective',
      capability: 'code:implement',
      [field]: 'something',
    };
    assert.throws(
      () => validateUnit(raw),
      (err) => {
        assert.ok(err instanceof RunnerConfigError);
        assert.match(err.message, /G2 constraint/);
        assert.match(err.message, new RegExp(field));
        return true;
      },
    );
  }
});

test('validateUnit: rejects missing or empty id, objective, capability', () => {
  assert.throws(
    () => validateUnit({ objective: 'obj', capability: 'verb' }),
    /unit\.id must be a non-empty string/,
  );
  assert.throws(
    () => validateUnit({ id: '  ', objective: 'obj', capability: 'verb' }),
    /unit\.id must be a non-empty string/,
  );
  assert.throws(
    () => validateUnit({ id: 'u1', objective: '', capability: 'verb' }),
    /unit\.objective must be a non-empty string/,
  );
  assert.throws(
    () => validateUnit({ id: 'u1', objective: 'obj', capability: ' ' }),
    /unit\.capability must be a non-empty string/,
  );
});

test('validateUnit: validates rigor values', () => {
  assert.throws(
    () => validateUnit({ id: 'u1', objective: 'obj', capability: 'verb', rigor: 'ultra' }),
    /unit\.rigor must be one of/,
  );
  for (const r of ['low', 'standard', 'high', 'critical']) {
    const unit = validateUnit({ id: 'u1', objective: 'obj', capability: 'verb', rigor: r });
    assert.equal(unit.rigor, r);
  }
});

test('validateUnit: validates writes as safe repo-relative paths', () => {
  assert.throws(
    () => validateUnit({ id: 'u1', objective: 'obj', capability: 'verb', writes: 'not-array' }),
    /unit\.writes must be an array/,
  );
  assert.throws(
    () => validateUnit({ id: 'u1', objective: 'obj', capability: 'verb', writes: ['/etc/passwd'] }),
    /unit\.writes\[0\] must be a non-empty repo-relative path/,
  );
  assert.throws(
    () => validateUnit({ id: 'u1', objective: 'obj', capability: 'verb', writes: ['../foo'] }),
    /unit\.writes\[0\] must be a non-empty repo-relative path/,
  );
  assert.throws(
    () => validateUnit({ id: 'u1', objective: 'obj', capability: 'verb', writes: ['a/../b'] }),
    /unit\.writes\[0\] must be a non-empty repo-relative path/,
  );
  assert.throws(
    () => validateUnit({ id: 'u1', objective: 'obj', capability: 'verb', writes: [''] }),
    /unit\.writes\[0\] must be a non-empty repo-relative path/,
  );
});

test('validateUnit: validates inputs as repo-relative paths or unit-run refs', () => {
  assert.throws(
    () => validateUnit({ id: 'u1', objective: 'obj', capability: 'verb', inputs: ['/absolute/path'] }),
    /unit\.inputs\[0\] must be a repo-relative path/,
  );
  assert.throws(
    () => validateUnit({ id: 'u1', objective: 'obj', capability: 'verb', inputs: ['../outside'] }),
    /unit\.inputs\[0\] must be a repo-relative path/,
  );
  assert.throws(
    () => validateUnit({ id: 'u1', objective: 'obj', capability: 'verb', inputs: ['unit-run:malformed'] }),
    /unit\.inputs\[0\] must be a repo-relative path or "unit-run:<id>\/<role>" ref/,
  );

  const unit = validateUnit({
    id: 'u1',
    objective: 'obj',
    capability: 'verb',
    inputs: ['docs/readme.md', 'unit-run:u0/reviewer'],
  });
  assert.deepEqual(unit.inputs, ['docs/readme.md', 'unit-run:u0/reviewer']);
});

test('validateUnit: validates dependsOn and expectedOutputs', () => {
  assert.throws(
    () => validateUnit({ id: 'u1', objective: 'obj', capability: 'verb', dependsOn: [123] }),
    /unit\.dependsOn\[0\] must be a non-empty string unit id/,
  );
  assert.throws(
    () => validateUnit({ id: 'u1', objective: 'obj', capability: 'verb', expectedOutputs: [123] }),
    /unit\.expectedOutputs\[0\] must be a non-empty string/,
  );
});

test('architecture guard: src/runner/execution/unit.mjs does NOT import src/state/**', () => {
  const source = fs.readFileSync(new URL('../../../src/runner/execution/unit.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /from\s+['"][^'"]*\/state\//);
  assert.doesNotMatch(source, /from\s+['"][^'"]*\/runner\/coordination\//);
  assert.doesNotMatch(source, /from\s+['"][^'"]*\/runner\/worktree/);
  assert.doesNotMatch(source, /from\s+['"][^'"]*\/runner\/merge/);
});
