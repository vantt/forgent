import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateUnit, normalizeWorkflowLink } from '../../../src/runner/execution/unit.mjs';
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

test('validateUnit: anonymizeInputs is an optional boolean, absent unless true', () => {
  const base = { id: 'u1', objective: 'obj', capability: 'verb' };
  assert.equal(validateUnit({ ...base, anonymizeInputs: true }).anonymizeInputs, true);
  assert.equal('anonymizeInputs' in validateUnit(base), false);
  assert.equal('anonymizeInputs' in validateUnit({ ...base, anonymizeInputs: false }), false);
  assert.throws(() => validateUnit({ ...base, anonymizeInputs: 'yes' }), RunnerConfigError);
});

test('validateUnit: blind is an optional boolean, absent unless true', () => {
  const base = { id: 'u1', objective: 'obj', capability: 'verb' };
  assert.equal(validateUnit({ ...base, blind: true }).blind, true);
  assert.equal('blind' in validateUnit(base), false);
  assert.equal('blind' in validateUnit({ ...base, blind: false }), false);
  assert.throws(() => validateUnit({ ...base, blind: 'yes' }), RunnerConfigError);
});

test('validateUnit: accepts gate-answer refs and rejects malformed ones', () => {
  const unit = validateUnit({ id: 'u1', objective: 'obj', capability: 'verb', inputs: ['gate-answer:wf-run-1/voting-ranking'] });
  assert.deepEqual(unit.inputs, ['gate-answer:wf-run-1/voting-ranking']);
  for (const bad of ['gate-answer:wf-run-1', 'gate-answer:wf-run-1/a/b', 'gate-answer:/step']) {
    assert.throws(() => validateUnit({ id: 'u1', objective: 'obj', capability: 'verb', inputs: [bad] }), /unit\.inputs\[0\] must be/);
  }
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

test('stanceOptions are frozen question-local labels; omitted options keep the prior Unit shape', () => {
  const raw = { id: 'question', objective: 'Choose a strategy', capability: 'docs:write' };
  assert.equal(Object.hasOwn(validateUnit(raw), 'stanceOptions'), false);
  const unit = validateUnit({ ...raw, stanceOptions: [' a ', 'b'] });
  assert.deepEqual(unit.stanceOptions, ['a', 'b']);
  assert.ok(Object.isFrozen(unit.stanceOptions));
  for (const stanceOptions of [null, 'a|b', [''], ['a', 'a'], ['other'], [7]]) {
    assert.throws(() => validateUnit({ ...raw, stanceOptions }), /stanceOptions/);
  }
});

test('workflow link is owner-provided normalized metadata, never guessed from unit ids', () => {
  assert.equal(normalizeWorkflowLink(undefined), null);
  assert.deepEqual(normalizeWorkflowLink({ runId: ' wf ', stepId: ' s ', unitId: ' u ', ignored: true }), { runId: 'wf', stepId: 's', unitId: 'u' });
  for (const value of ['wf', {}, { runId: 'wf', stepId: 's', unitId: '' }]) assert.throws(() => normalizeWorkflowLink(value), /workflow link/);
});

test('validateUnit: writes come back canonical, de-duplicated, in first-seen order', () => {
  const unit = validateUnit({ id: 'u1', objective: 'obj', capability: 'verb', writes: ['./docs', 'docs//', 'src/', 'app/[slug]/page.tsx'] });
  assert.deepEqual(unit.writes, ['docs', 'src', 'app/[slug]/page.tsx']);
});

test('validateUnit: writes refuse entries git and the matcher would read differently', () => {
  for (const bad of ['.', './', ':(top)x', ':!x', 'a\\b', 'a**']) {
    assert.throws(
      () => validateUnit({ id: 'u1', objective: 'obj', capability: 'verb', writes: [bad] }),
      (err) => err instanceof RunnerConfigError && /unit\.writes\[0\] must be a non-empty repo-relative path/.test(err.message),
      `bad=${JSON.stringify(bad)}`,
    );
  }
});

test('validateUnit: prefer accepts executor ids and {executor, invocation} entries, and is kept', () => {
  const unit = validateUnit({
    id: 'u1', objective: 'obj', capability: 'verb',
    prefer: ['codex', { executor: 'claude', invocation: 'herdr' }, { executor: 'pi' }],
  });
  assert.deepEqual(unit.prefer, ['codex', { executor: 'claude', invocation: 'herdr' }, { executor: 'pi' }]);
  assert.ok(Object.isFrozen(unit.prefer));
  assert.equal(validateUnit({ id: 'u1', objective: 'obj', capability: 'verb' }).prefer, undefined);
});

test('validateUnit: prefer refuses a malformed shape', () => {
  for (const prefer of ['codex', 42, [42], [{}], [{ executor: '' }], [{ executor: 'x', invocation: 3 }], [''], [{ executor: 'x', model: 'y' }]]) {
    assert.throws(
      () => validateUnit({ id: 'u1', objective: 'obj', capability: 'verb', prefer }),
      (err) => err instanceof RunnerConfigError && /unit\.prefer/.test(err.message),
      `prefer=${JSON.stringify(prefer)}`,
    );
  }
});

test('validateUnit: persona is a non-empty string and is kept', () => {
  assert.equal(validateUnit({ id: 'u1', objective: 'obj', capability: 'verb', persona: ' skeptic ' }).persona, 'skeptic');
  for (const persona of ['', '  ', 3, {}]) {
    assert.throws(
      () => validateUnit({ id: 'u1', objective: 'obj', capability: 'verb', persona }),
      (err) => err instanceof RunnerConfigError && /unit\.persona/.test(err.message),
    );
  }
});

test('validateUnit: the G2 message names the mechanics a unit still may not pin', () => {
  assert.throws(
    () => validateUnit({ id: 'u1', objective: 'obj', capability: 'verb', executor: 'codex' }),
    (err) => /executor, provider, model, tier, invocation, actors, overrides\)/.test(err.message) && !/prefer/.test(err.message),
  );
});

test('validateUnit: a unit may ask for its own run timeout, inside the ceiling', async () => {
  const { RUN_TIMEOUT_MAX_MS, RUN_TIMEOUT_MIN_MS } = await import('../../../src/runner/dispatch/config.mjs');
  const base = { id: 'u-heavy', objective: 'Port the parser', capability: 'code:implement' };
  assert.equal(validateUnit({ ...base, timeoutMs: 5400000 }).timeoutMs, 5400000);
  assert.equal('timeoutMs' in validateUnit(base), false);
  for (const bad of [0, -1, 1.5, '90m', RUN_TIMEOUT_MIN_MS - 1, RUN_TIMEOUT_MAX_MS + 1, null]) {
    assert.throws(() => validateUnit({ ...base, timeoutMs: bad }), (err) => err instanceof RunnerConfigError && /unit\.timeoutMs/.test(err.message), `timeoutMs ${bad}`);
  }
});
