import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateWork, validateWorkShape, validateDeps, WorkValidationError, STATUSES } from '../../src/state/work.mjs';

function baseWork(overrides = {}) {
  return {
    id: 'setup-repo',
    title: 'Set up repo scaffolding',
    kind: 'chore',
    status: 'todo',
    deps: [],
    risk: 'low',
    refs: [],
    verify: 'npm test',
    ...overrides,
  };
}

test('validateWork accepts a well-formed work item with no deps', () => {
  assert.doesNotThrow(() => validateWork(baseWork()));
});

test('validateWork accepts learn as optional (absent, null, or a string)', () => {
  assert.doesNotThrow(() => validateWork(baseWork()));
  assert.doesNotThrow(() => validateWork(baseWork({ learn: null })));
  assert.doesNotThrow(() => validateWork(baseWork({ learn: 'docs/history/x/reports/y.md' })));
});

test('validateWork rejects a non-object work item', () => {
  assert.throws(() => validateWork(null), WorkValidationError);
  assert.throws(() => validateWork('nope'), WorkValidationError);
});

for (const field of ['title', 'kind', 'status', 'risk', 'verify']) {
  test(`validateWork rejects a missing required field: ${field}`, () => {
    const work = baseWork();
    delete work[field];
    assert.throws(() => validateWork(work), WorkValidationError);
  });
}

test('validateWork rejects deps that is not an array', () => {
  assert.throws(() => validateWork(baseWork({ deps: 'a,b' })), WorkValidationError);
});

test('validateWork rejects refs that is not an array', () => {
  assert.throws(() => validateWork(baseWork({ refs: 'readme' })), WorkValidationError);
});

test('validateWork rejects an unstable id format', () => {
  assert.throws(() => validateWork(baseWork({ id: 'Not Valid!' })), WorkValidationError);
  assert.throws(() => validateWork(baseWork({ id: '' })), WorkValidationError);
  assert.throws(() => validateWork(baseWork({ id: '1-starts-with-digit' })), WorkValidationError);
});

test('validateWork accepts a stable kebab-case id', () => {
  assert.doesNotThrow(() => validateWork(baseWork({ id: 'add-login-form' })));
});

test('validateWork rejects a status outside the STATUSES domain', () => {
  assert.throws(
    () => validateWork(baseWork({ status: 'archived' })),
    (err) => err instanceof WorkValidationError && /STATUSES|status/.test(err.message),
  );
});

test('validateWork accepts every status in STATUSES', () => {
  for (const status of STATUSES) {
    assert.doesNotThrow(() => validateWork(baseWork({ status })));
  }
});

test('validateWork rejects a work item that lists itself as a dep', () => {
  assert.throws(
    () => validateWork(baseWork({ id: 'a', deps: ['a'] })),
    (err) => err instanceof WorkValidationError && /itself/.test(err.message),
  );
});

test('validateWorkShape passes without checking dep existence', () => {
  const work = baseWork({ id: 'b', deps: ['ghost'] });
  assert.doesNotThrow(() => validateWorkShape(work));
});

test('validateDeps rejects a dep pointing at a non-existent id', () => {
  const work = baseWork({ id: 'b', deps: ['ghost'] });
  assert.throws(
    () => validateDeps(work, new Set(['a'])),
    (err) => err instanceof WorkValidationError && /unknown id/.test(err.message),
  );
});

test('validateDeps accepts a dep that exists in existingIds (Set or array)', () => {
  const work = baseWork({ id: 'b', deps: ['a'] });
  assert.doesNotThrow(() => validateDeps(work, new Set(['a', 'b'])));
  assert.doesNotThrow(() => validateDeps(work, ['a', 'b']));
});

test('validateWork runs full dep-existence check when existingIds is passed', () => {
  assert.doesNotThrow(() => validateWork(baseWork({ id: 'b', deps: ['a'] }), new Set(['a', 'b'])));
  assert.throws(
    () => validateWork(baseWork({ id: 'b', deps: ['ghost'] }), new Set(['a', 'b'])),
    WorkValidationError,
  );
});
