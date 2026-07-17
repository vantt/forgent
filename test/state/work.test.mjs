import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateWork,
  validateWorkShape,
  validateDeps,
  WorkValidationError,
  STATUSES,
  TIERS,
  STAGES,
  DEFAULTS,
  SCHEMA_VERSION,
} from '../../src/state/work.mjs';

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

test('STATUSES includes awaiting-human (per async-human-gate D1/D3)', () => {
  assert.ok(STATUSES.includes('awaiting-human'));
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

test('validateWork accepts a work item missing tier (optional, defaulted by the caller per D7b)', () => {
  const work = baseWork();
  assert.equal(work.tier, undefined);
  assert.doesNotThrow(() => validateWork(work));
});

test('validateWork accepts every tier in TIERS', () => {
  for (const tier of TIERS) {
    assert.doesNotThrow(() => validateWork(baseWork({ tier })));
  }
});

test('validateWork rejects a tier outside the TIERS domain', () => {
  assert.throws(
    () => validateWork(baseWork({ tier: 'ultra-heavy' })),
    (err) => err instanceof WorkValidationError && /tier/.test(err.message),
  );
});

test('DEFAULTS.tier is itself a member of TIERS, and SCHEMA_VERSION is a positive integer', () => {
  assert.ok(TIERS.includes(DEFAULTS.tier));
  assert.ok(Number.isInteger(SCHEMA_VERSION) && SCHEMA_VERSION > 0);
});

test('STAGES includes "decompose" between clarify and executing (per stage-decompose D2)', () => {
  assert.deepEqual(STAGES, ['clarify', 'decompose', 'executing']);
});

test('validateWork accepts every stage in STAGES', () => {
  for (const stage of STAGES) {
    assert.doesNotThrow(() => validateWork(baseWork({ stage })));
  }
});

test('validateWork rejects a stage outside the STAGES domain', () => {
  assert.throws(
    () => validateWork(baseWork({ stage: 'planning' })),
    (err) => err instanceof WorkValidationError && /stage/.test(err.message),
  );
});

// --- `domain` field (per base-workflow-model D1-D3): optional, lazy default
// 'coding', domain-aware stage-enum check ---

test('validateWork accepts a work item missing domain (optional, defaulted lazily to "coding" wherever consumed)', () => {
  const work = baseWork();
  assert.equal(work.domain, undefined);
  assert.doesNotThrow(() => validateWork(work));
});

test('validateWork accepts an explicit domain: "coding"', () => {
  assert.doesNotThrow(() => validateWork(baseWork({ domain: 'coding' })));
});

test('validateWork rejects a domain outside the DOMAINS registry', () => {
  assert.throws(
    () => validateWork(baseWork({ domain: 'marketing' })),
    (err) => err instanceof WorkValidationError && /domain/.test(err.message),
  );
});

test('validateWork accepts every stage in STAGES when domain is explicitly "coding" (same stage-enum as the default)', () => {
  for (const stage of STAGES) {
    assert.doesNotThrow(() => validateWork(baseWork({ domain: 'coding', stage })));
  }
});

// --- lineage field `parent` (per stage-decompose D5, inherited from stage-clarify D11) ---

test('validateWork accepts a work item missing parent (optional, additive lineage field)', () => {
  const work = baseWork();
  assert.equal(work.parent, undefined);
  assert.doesNotThrow(() => validateWork(work));
});

test('validateWork accepts parent as a non-empty string', () => {
  assert.doesNotThrow(() => validateWork(baseWork({ id: 'child-1', parent: 'setup-repo' })));
});

test('validateWork treats parent: null the same as absent', () => {
  assert.doesNotThrow(() => validateWork(baseWork({ parent: null })));
});

test('validateWork rejects a non-string, non-empty parent', () => {
  assert.throws(
    () => validateWork(baseWork({ parent: 42 })),
    (err) => err instanceof WorkValidationError && /parent/.test(err.message),
  );
  assert.throws(
    () => validateWork(baseWork({ parent: '' })),
    (err) => err instanceof WorkValidationError && /parent/.test(err.message),
  );
  assert.throws(
    () => validateWork(baseWork({ parent: '   ' })),
    (err) => err instanceof WorkValidationError && /parent/.test(err.message),
  );
});

test('validateWork rejects a work item that lists itself as its own parent', () => {
  assert.throws(
    () => validateWork(baseWork({ id: 'a', parent: 'a' })),
    (err) => err instanceof WorkValidationError && /own parent/.test(err.message),
  );
});

// --- full-text intake `description` (per discovery-context P30) ---

test('validateWork accepts a work item missing description (optional, additive intake field)', () => {
  const work = baseWork();
  assert.equal(work.description, undefined);
  assert.doesNotThrow(() => validateWork(work));
});

test('validateWork accepts description as a non-empty string', () => {
  assert.doesNotThrow(() => validateWork(baseWork({ description: 'Full text the submitter typed.' })));
});

test('validateWork treats description: null the same as absent', () => {
  assert.doesNotThrow(() => validateWork(baseWork({ description: null })));
});

test('validateWork rejects a non-string, non-empty description', () => {
  assert.throws(
    () => validateWork(baseWork({ description: 42 })),
    (err) => err instanceof WorkValidationError && /description/.test(err.message),
  );
  assert.throws(
    () => validateWork(baseWork({ description: '' })),
    (err) => err instanceof WorkValidationError && /description/.test(err.message),
  );
  assert.throws(
    () => validateWork(baseWork({ description: '   ' })),
    (err) => err instanceof WorkValidationError && /description/.test(err.message),
  );
});

test('validateWork does not require parent to point at an existing id (lineage existence is not deps existence)', () => {
  assert.doesNotThrow(() => validateWork(baseWork({ id: 'b', parent: 'ghost-parent' }), new Set(['a', 'b'])));
});
