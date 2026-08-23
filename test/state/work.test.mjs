import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  validateWork,
  validateWorkShape,
  validateDeps,
  checkAcceptanceEvidenceTraceable,
  validateMergeAfter,
  validateSupersededBy,
  validateDuplicates,
  WorkValidationError,
  STATUSES,
  TIERS,
  STAGES,
  GOAL_TIERS,
  URGENCY_LEVELS,
  DEFAULTS,
  SCHEMA_VERSION,
} from '../../src/state/work.mjs';
import { DOMAINS, classificationVocabulary } from '../../src/state/workflow-stage-graphs.mjs';

function mkRepoRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-work-repo-'));
}

function baseWork(overrides = {}) {
  return {
    id: 'setup-repo',
    title: 'Set up repo scaffolding',
    kind: 'chore',
    status: 'todo',
    deps: [],
    risk: 'light',
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

// work-graph-intelligence S9: footprint is an OPTIONAL additive list.
test('validateWork accepts footprint absent, null, or an array of non-empty strings', () => {
  assert.doesNotThrow(() => validateWork(baseWork())); // absent
  assert.doesNotThrow(() => validateWork(baseWork({ footprint: null })));
  assert.doesNotThrow(() => validateWork(baseWork({ footprint: [] })));
  assert.doesNotThrow(() => validateWork(baseWork({ footprint: ['src/a.mjs', 'src/b.mjs'] })));
});

test('validateWork rejects a footprint that is not an array, or has an empty/non-string entry', () => {
  assert.throws(() => validateWork(baseWork({ footprint: 'src/a.mjs' })), WorkValidationError);
  assert.throws(() => validateWork(baseWork({ footprint: ['src/a.mjs', ''] })), WorkValidationError);
  assert.throws(() => validateWork(baseWork({ footprint: ['src/a.mjs', 42] })), WorkValidationError);
});

// str73-done-flip-cos-check cell 1: acceptance is an OPTIONAL additive array
// of {text, evidence} Condition-of-Satisfaction clauses, alongside `verify`.
test('validateWork accepts acceptance absent, null, or an array of {text, evidence} clauses', () => {
  assert.equal(baseWork().acceptance, undefined);
  assert.doesNotThrow(() => validateWork(baseWork())); // absent
  assert.doesNotThrow(() => validateWork(baseWork({ acceptance: null })));
  assert.doesNotThrow(() => validateWork(baseWork({ acceptance: [] })));
  assert.doesNotThrow(() => validateWork(baseWork({
    acceptance: [
      { text: 'CLI returns exit 0 on success' },
      { text: 'New field round-trips through fgos list', evidence: 'test/cli/fgos.test.mjs:123' },
    ],
  })));
});

test('validateWork accepts acceptance entries with evidence absent or null', () => {
  assert.doesNotThrow(() => validateWork(baseWork({ acceptance: [{ text: 'done' }] })));
  assert.doesNotThrow(() => validateWork(baseWork({ acceptance: [{ text: 'done', evidence: null }] })));
});

test('validateWork rejects acceptance that is not an array', () => {
  assert.throws(() => validateWork(baseWork({ acceptance: 'not-an-array' })), WorkValidationError);
  assert.throws(() => validateWork(baseWork({ acceptance: { text: 'x' } })), WorkValidationError);
});

test('validateWork rejects an acceptance entry that is not a plain object', () => {
  assert.throws(() => validateWork(baseWork({ acceptance: ['just a string'] })), WorkValidationError);
  assert.throws(() => validateWork(baseWork({ acceptance: [42] })), WorkValidationError);
  assert.throws(() => validateWork(baseWork({ acceptance: [['nested', 'array']] })), WorkValidationError);
});

test('validateWork rejects an acceptance entry missing text, or with an empty/non-string text', () => {
  assert.throws(() => validateWork(baseWork({ acceptance: [{ evidence: 'e' }] })), WorkValidationError);
  assert.throws(() => validateWork(baseWork({ acceptance: [{ text: '' }] })), WorkValidationError);
  assert.throws(() => validateWork(baseWork({ acceptance: [{ text: '   ' }] })), WorkValidationError);
  assert.throws(() => validateWork(baseWork({ acceptance: [{ text: 42 }] })), WorkValidationError);
});

test('validateWork rejects an acceptance entry with a non-string or empty evidence', () => {
  assert.throws(() => validateWork(baseWork({ acceptance: [{ text: 'done', evidence: '' }] })), WorkValidationError);
  assert.throws(() => validateWork(baseWork({ acceptance: [{ text: 'done', evidence: 42 }] })), WorkValidationError);
});

test('validateWork rejects an unstable id format', () => {
  assert.throws(() => validateWork(baseWork({ id: 'Not Valid!' })), WorkValidationError);
  assert.throws(() => validateWork(baseWork({ id: '' })), WorkValidationError);
  assert.throws(() => validateWork(baseWork({ id: '1-starts-with-digit' })), WorkValidationError);
});

test('validateWork accepts a stable kebab-case id', () => {
  assert.doesNotThrow(() => validateWork(baseWork({ id: 'add-login-form' })));
});

// long-work-item-ids D2: fgos add took a caller-typed id with no length
// bound, so callers slugified the whole title into it. 30 chars is the cap.
test('validateWork accepts an id at exactly the 30-character max length', () => {
  const id = 'a'.repeat(30);
  assert.equal(id.length, 30);
  assert.doesNotThrow(() => validateWork(baseWork({ id })));
});

test('validateWork rejects an id over the 30-character max length', () => {
  const id = 'a'.repeat(31);
  assert.equal(id.length, 31);
  assert.throws(
    () => validateWork(baseWork({ id })),
    (err) => err instanceof WorkValidationError
      && /work\.id must be at most 30 characters \(got 31\)/.test(err.message),
  );
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

test('STATUSES includes awaiting-human', () => {
  assert.ok(STATUSES.includes('awaiting-human'));
});

test('STATUSES includes wontfix', () => {
  assert.ok(STATUSES.includes('wontfix'));
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

// --- mergeAfter (D4/D5, docs/history/tsk-3bn-merge-conductor-harness-v2/) --

test('validateWork accepts a work item missing mergeAfter (optional, no default, stays absent)', () => {
  assert.doesNotThrow(() => validateWork(baseWork({})));
});

test('validateWork treats mergeAfter: null the same as absent', () => {
  assert.doesNotThrow(() => validateWork(baseWork({ mergeAfter: null })));
});

test('validateWork rejects a mergeAfter that is not an array', () => {
  assert.throws(() => validateWork(baseWork({ mergeAfter: 'a,b' })), WorkValidationError);
});

test('validateWork rejects a mergeAfter entry that is a non-string or empty string', () => {
  assert.throws(
    () => validateWork(baseWork({ mergeAfter: ['a', 42] })),
    (err) => err instanceof WorkValidationError && /non-empty strings/.test(err.message),
  );
  assert.throws(
    () => validateWork(baseWork({ mergeAfter: ['a', ''] })),
    (err) => err instanceof WorkValidationError && /non-empty strings/.test(err.message),
  );
});

test('validateWork rejects a work item that lists itself in its own mergeAfter', () => {
  assert.throws(
    () => validateWork(baseWork({ id: 'a', mergeAfter: ['a'] })),
    (err) => err instanceof WorkValidationError && /own mergeAfter/.test(err.message),
  );
});

test('validateWorkShape passes without checking mergeAfter existence', () => {
  const work = baseWork({ id: 'b', mergeAfter: ['ghost'] });
  assert.doesNotThrow(() => validateWorkShape(work));
});

test('validateMergeAfter rejects a target pointing at a non-existent id', () => {
  const work = baseWork({ id: 'b', mergeAfter: ['ghost'] });
  assert.throws(
    () => validateMergeAfter(work, new Set(['a'])),
    (err) => err instanceof WorkValidationError && /not a known id/.test(err.message),
  );
});

test('validateMergeAfter accepts a target that exists in existingIds (Set or array)', () => {
  const work = baseWork({ id: 'b', mergeAfter: ['a'] });
  assert.doesNotThrow(() => validateMergeAfter(work, new Set(['a', 'b'])));
  assert.doesNotThrow(() => validateMergeAfter(work, ['a', 'b']));
});

test('validateMergeAfter is a no-op when mergeAfter is absent', () => {
  assert.doesNotThrow(() => validateMergeAfter(baseWork({}), new Set()));
});

test('validateWork runs full mergeAfter-existence check when existingIds is passed (unlike targets, which deliberately skips this)', () => {
  assert.doesNotThrow(() => validateWork(baseWork({ id: 'b', mergeAfter: ['a'] }), new Set(['a', 'b'])));
  assert.throws(
    () => validateWork(baseWork({ id: 'b', mergeAfter: ['ghost'] }), new Set(['a', 'b'])),
    WorkValidationError,
  );
});

test('validateWork does not add mergeAfter to SCHEMA_VERSION or DEFAULTS (optional additive field, no schema bump)', () => {
  assert.equal(SCHEMA_VERSION, 3);
  assert.equal(Object.hasOwn(DEFAULTS, 'mergeAfter'), false);
});

// --- supersededBy / duplicates (tsk-2ie D1-D3, docs/history/
// tsk-2ie-duplicate-superseded-guard/) --------------------------------------

test('validateWork accepts a work item missing supersededBy/duplicates (optional, no default, stays absent)', () => {
  assert.doesNotThrow(() => validateWork(baseWork({})));
});

test('validateWork treats supersededBy: null and duplicates: null the same as absent', () => {
  assert.doesNotThrow(() => validateWork(baseWork({ supersededBy: null, duplicates: null })));
});

test('validateWork rejects a supersededBy that is not a non-empty string', () => {
  assert.throws(() => validateWork(baseWork({ supersededBy: 42 })), WorkValidationError);
  assert.throws(() => validateWork(baseWork({ supersededBy: '' })), WorkValidationError);
});

test('validateWork rejects a work item that lists itself as its own supersededBy', () => {
  assert.throws(
    () => validateWork(baseWork({ id: 'a', supersededBy: 'a' })),
    (err) => err instanceof WorkValidationError && /own supersededBy/.test(err.message),
  );
});

test('validateWork rejects a duplicates that is not an array', () => {
  assert.throws(() => validateWork(baseWork({ duplicates: 'a,b' })), WorkValidationError);
});

test('validateWork rejects a duplicates entry that is a non-string or empty string', () => {
  assert.throws(
    () => validateWork(baseWork({ duplicates: ['a', 42] })),
    (err) => err instanceof WorkValidationError && /non-empty strings/.test(err.message),
  );
  assert.throws(
    () => validateWork(baseWork({ duplicates: ['a', ''] })),
    (err) => err instanceof WorkValidationError && /non-empty strings/.test(err.message),
  );
});

test('validateWork rejects a work item that lists itself in its own duplicates', () => {
  assert.throws(
    () => validateWork(baseWork({ id: 'a', duplicates: ['a'] })),
    (err) => err instanceof WorkValidationError && /own duplicates/.test(err.message),
  );
});

test('validateWorkShape passes without checking supersededBy/duplicates existence', () => {
  const work = baseWork({ id: 'b', supersededBy: 'ghost', duplicates: ['ghost2'] });
  assert.doesNotThrow(() => validateWorkShape(work));
});

test('validateSupersededBy rejects a target pointing at a non-existent id', () => {
  const work = baseWork({ id: 'b', supersededBy: 'ghost' });
  assert.throws(
    () => validateSupersededBy(work, new Set(['a'])),
    (err) => err instanceof WorkValidationError && /not a known id/.test(err.message),
  );
});

test('validateSupersededBy accepts a target that exists in existingIds (Set or array)', () => {
  const work = baseWork({ id: 'b', supersededBy: 'a' });
  assert.doesNotThrow(() => validateSupersededBy(work, new Set(['a', 'b'])));
  assert.doesNotThrow(() => validateSupersededBy(work, ['a', 'b']));
});

test('validateSupersededBy is a no-op when supersededBy is absent', () => {
  assert.doesNotThrow(() => validateSupersededBy(baseWork({}), new Set()));
});

test('validateDuplicates rejects a target pointing at a non-existent id', () => {
  const work = baseWork({ id: 'b', duplicates: ['ghost'] });
  assert.throws(
    () => validateDuplicates(work, new Set(['a'])),
    (err) => err instanceof WorkValidationError && /not a known id/.test(err.message),
  );
});

test('validateDuplicates accepts targets that exist in existingIds (Set or array)', () => {
  const work = baseWork({ id: 'b', duplicates: ['a'] });
  assert.doesNotThrow(() => validateDuplicates(work, new Set(['a', 'b'])));
  assert.doesNotThrow(() => validateDuplicates(work, ['a', 'b']));
});

test('validateDuplicates is a no-op when duplicates is absent', () => {
  assert.doesNotThrow(() => validateDuplicates(baseWork({}), new Set()));
});

test('validateWork runs full supersededBy/duplicates-existence check when existingIds is passed', () => {
  assert.doesNotThrow(() => validateWork(baseWork({ id: 'b', supersededBy: 'a', duplicates: ['a'] }), new Set(['a', 'b'])));
  assert.throws(
    () => validateWork(baseWork({ id: 'b', supersededBy: 'ghost' }), new Set(['a', 'b'])),
    WorkValidationError,
  );
  assert.throws(
    () => validateWork(baseWork({ id: 'b', duplicates: ['ghost'] }), new Set(['a', 'b'])),
    WorkValidationError,
  );
});

test('validateWork does not add supersededBy/duplicates to SCHEMA_VERSION or DEFAULTS (optional additive fields, no schema bump)', () => {
  assert.equal(SCHEMA_VERSION, 3);
  assert.equal(Object.hasOwn(DEFAULTS, 'supersededBy'), false);
  assert.equal(Object.hasOwn(DEFAULTS, 'duplicates'), false);
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

// --- per-domain kind/risk vocabulary (DOMAINS.coding's `classification`) ---

test('validateWork accepts every kind and risk in coding\'s declared vocabulary', () => {
  for (const kind of classificationVocabulary(DOMAINS.coding, 'kind')) {
    assert.doesNotThrow(() => validateWork(baseWork({ kind })));
  }
  for (const risk of classificationVocabulary(DOMAINS.coding, 'risk')) {
    assert.doesNotThrow(() => validateWork(baseWork({ risk })));
  }
});

test('validateWork rejects a kind outside the coding vocabulary, naming the field', () => {
  for (const kind of ['feat', 'documentation', 'behavior_change', 'discovery']) {
    assert.throws(
      () => validateWork(baseWork({ kind })),
      (err) => err instanceof WorkValidationError && /work\.kind must be one of/.test(err.message),
      `kind "${kind}" must be rejected`,
    );
  }
});

// tsk-5wz's own live evidence, inverted: `low`/`medium`/`high` are the values
// that were silently degrading (decompose.mjs's heavy-risk gate never fired
// for them; priority-formula.mjs scored them all at its `standard` fallback).
// They now fail loudly at the write door instead.
test('validateWork rejects a risk outside the coding vocabulary, including the low/medium/high set', () => {
  for (const risk of ['low', 'medium', 'high', 'critical']) {
    assert.throws(
      () => validateWork(baseWork({ risk })),
      (err) => err instanceof WorkValidationError && /work\.risk must be one of/.test(err.message),
      `risk "${risk}" must be rejected`,
    );
  }
});

test('a domain declaring no classification vocabulary keeps the old any-non-empty-string rule', () => {
  assert.doesNotThrow(() => validateWork(baseWork({ domain: 'synthetic', kind: 'whatever', risk: 'anything' })));
  assert.throws(
    () => validateWork(baseWork({ domain: 'synthetic', risk: '' })),
    (err) => err instanceof WorkValidationError && /risk/.test(err.message),
  );
});

// tsk-1ne D1/D2 grandfathering: an item already stored with a now-invalid
// value stays editable, so long as the edit does not touch that field. This
// is what lets the 68 live items carrying low/medium/high keep moving without
// a data migration.
test('an untouched legacy kind/risk is grandfathered on edit, but a touched one is held to the vocabulary', () => {
  const legacy = baseWork({ risk: 'medium', kind: 'documentation' });
  assert.doesNotThrow(() => validateWork(legacy, [], new Set(['title'])));
  assert.throws(
    () => validateWork(legacy, [], new Set(['risk'])),
    (err) => err instanceof WorkValidationError && /work\.risk must be one of/.test(err.message),
  );
});

test('DEFAULTS.tier is itself a member of TIERS, and SCHEMA_VERSION is a positive integer', () => {
  assert.ok(TIERS.includes(DEFAULTS.tier));
  assert.ok(Number.isInteger(SCHEMA_VERSION) && SCHEMA_VERSION > 0);
});

test('STAGES: "clarify" is retired entirely (tsk-qod D1/D2) — "discovery" is stages[0], the domain\'s own entry point; "decompose" survives only as a legacy, drain-only alias (D18) ahead of "planning" (tsk-403 D11)', () => {
  assert.deepEqual(STAGES, ['discovery', 'exploring', 'decompose', 'planning', 'executing']);
});

test('validateWork accepts every stage in STAGES', () => {
  for (const stage of STAGES) {
    assert.doesNotThrow(() => validateWork(baseWork({ stage })));
  }
});

test('validateWork rejects a stage outside the STAGES domain', () => {
  assert.throws(
    () => validateWork(baseWork({ stage: 'bogus-stage' })),
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

// --- provenance field `discoveredFrom` (per work-graph-intelligence S2b,
// decision b5c0ba0c/0012 — mirrors the `parent` lineage block above) ---

test('validateWork accepts a work item missing discoveredFrom (optional, additive provenance field)', () => {
  const work = baseWork();
  assert.equal(work.discoveredFrom, undefined);
  assert.doesNotThrow(() => validateWork(work));
});

test('validateWork accepts discoveredFrom as a non-empty string', () => {
  assert.doesNotThrow(() => validateWork(baseWork({ id: 'child-1', discoveredFrom: 'setup-repo' })));
});

test('validateWork treats discoveredFrom: null the same as absent', () => {
  assert.doesNotThrow(() => validateWork(baseWork({ discoveredFrom: null })));
});

test('validateWork rejects a non-string, non-empty discoveredFrom', () => {
  assert.throws(
    () => validateWork(baseWork({ discoveredFrom: 42 })),
    (err) => err instanceof WorkValidationError && /discoveredFrom/.test(err.message),
  );
  assert.throws(
    () => validateWork(baseWork({ discoveredFrom: '' })),
    (err) => err instanceof WorkValidationError && /discoveredFrom/.test(err.message),
  );
  assert.throws(
    () => validateWork(baseWork({ discoveredFrom: '   ' })),
    (err) => err instanceof WorkValidationError && /discoveredFrom/.test(err.message),
  );
});

test('validateWork rejects a work item that lists itself as its own discoveredFrom', () => {
  assert.throws(
    () => validateWork(baseWork({ id: 'a', discoveredFrom: 'a' })),
    (err) => err instanceof WorkValidationError && /own discoveredFrom|discoveredFrom/.test(err.message),
  );
});

test('validateWork does not require discoveredFrom to point at an existing id (provenance existence is not deps existence, mirrors parent)', () => {
  assert.doesNotThrow(() => validateWork(baseWork({ id: 'b', discoveredFrom: 'ghost-item' }), new Set(['a', 'b'])));
});

test('validateWork does not add discoveredFrom to SCHEMA_VERSION or DEFAULTS (optional lazy field, no schema bump)', () => {
  assert.equal(SCHEMA_VERSION, 3);
  assert.equal(Object.hasOwn(DEFAULTS, 'discoveredFrom'), false);
});

// --- ceremony decision-doc pointer `docsRef` (per p50-workflow-induct D7 —
// same optional-additive validation shape as `description` above) ---

test('validateWork accepts a work item missing docsRef (optional, additive back-compat)', () => {
  const work = baseWork();
  assert.equal(work.docsRef, undefined);
  assert.doesNotThrow(() => validateWork(work));
});

test('validateWork accepts docsRef as a non-empty string', () => {
  assert.doesNotThrow(() => validateWork(baseWork({ docsRef: 'docs/history/p50-workflow-induct/' })));
});

test('validateWork treats docsRef: null the same as absent', () => {
  assert.doesNotThrow(() => validateWork(baseWork({ docsRef: null })));
});

test('validateWork rejects a non-string, non-empty docsRef', () => {
  assert.throws(
    () => validateWork(baseWork({ docsRef: 42 })),
    (err) => err instanceof WorkValidationError && /docsRef/.test(err.message),
  );
  assert.throws(
    () => validateWork(baseWork({ docsRef: '' })),
    (err) => err instanceof WorkValidationError && /docsRef/.test(err.message),
  );
  assert.throws(
    () => validateWork(baseWork({ docsRef: '   ' })),
    (err) => err instanceof WorkValidationError && /docsRef/.test(err.message),
  );
});

test('validateWork does not add docsRef to SCHEMA_VERSION or DEFAULTS (optional lazy field, no schema bump)', () => {
  assert.equal(SCHEMA_VERSION, 3);
  assert.equal(Object.hasOwn(DEFAULTS, 'docsRef'), false);
});

// --- `action` (tsk-3xd D1, docs/history/tsk-3xd-decompose-child-directive-
// prose/CONTEXT.md): optional additive directive-prose field, same
// optional-additive validation shape as description/docsRef above.

test('validateWork accepts a work item missing action (optional, additive back-compat)', () => {
  const work = baseWork();
  assert.equal(work.action, undefined);
  assert.doesNotThrow(() => validateWork(work));
});

test('validateWork accepts action as a non-empty string', () => {
  assert.doesNotThrow(() => validateWork(baseWork({ action: 'D1: implement the parser per the locked decision.' })));
});

test('validateWork treats action: null the same as absent', () => {
  assert.doesNotThrow(() => validateWork(baseWork({ action: null })));
});

test('validateWork rejects a non-string, non-empty action', () => {
  assert.throws(
    () => validateWork(baseWork({ action: 42 })),
    (err) => err instanceof WorkValidationError && /action/.test(err.message),
  );
  assert.throws(
    () => validateWork(baseWork({ action: '' })),
    (err) => err instanceof WorkValidationError && /action/.test(err.message),
  );
  assert.throws(
    () => validateWork(baseWork({ action: '   ' })),
    (err) => err instanceof WorkValidationError && /action/.test(err.message),
  );
});

test('validateWork does not add action to SCHEMA_VERSION or DEFAULTS (optional lazy field, no schema bump)', () => {
  assert.equal(SCHEMA_VERSION, 3);
  assert.equal(Object.hasOwn(DEFAULTS, 'action'), false);
});

// --- `priority`/`intent` fields (per str7-str8-priority-intent D1/D6):
// optional additive integers, absent-last, no schema bump. Same
// optional-additive validation shape as tier/domain/docsRef above.

test('validateWork accepts a work item missing priority or intent (optional, no default, stays absent)', () => {
  const work = baseWork();
  assert.equal(work.priority, undefined);
  assert.equal(work.intent, undefined);
  assert.doesNotThrow(() => validateWork(work));
});

test('validateWork accepts priority: 0 and any non-negative integer', () => {
  for (const priority of [0, 1, 42, 1000]) {
    assert.doesNotThrow(() => validateWork(baseWork({ priority })));
  }
});

test('validateWork rejects a negative or non-integer priority', () => {
  for (const priority of [-1, -100, 1.5, 'high', true, NaN]) {
    assert.throws(
      () => validateWork(baseWork({ priority })),
      (err) => err instanceof WorkValidationError && /priority/.test(err.message),
    );
  }
});

test('validateWork accepts intent as any integer, including negative (no sign constraint)', () => {
  for (const intent of [-100, -1, 0, 1, 999]) {
    assert.doesNotThrow(() => validateWork(baseWork({ intent })));
  }
});

test('validateWork rejects a non-integer intent', () => {
  for (const intent of [1.5, 'urgent', true, NaN]) {
    assert.throws(
      () => validateWork(baseWork({ intent })),
      (err) => err instanceof WorkValidationError && /intent/.test(err.message),
    );
  }
});

test('validateWork does not add priority or intent to SCHEMA_VERSION or DEFAULTS (optional additive fields, no schema bump)', () => {
  assert.equal(SCHEMA_VERSION, 3);
  assert.equal(Object.hasOwn(DEFAULTS, 'priority'), false);
  assert.equal(Object.hasOwn(DEFAULTS, 'intent'), false);
});

// --- `urgent`/`impact`/`effort` fields (per work-item-priority-matrix
// D2/D3/D5): optional additive fields feeding the calculated `priority`,
// no schema bump. Same optional-additive validation shape as
// priority/intent above.

test('validateWork accepts a work item missing urgent, impact, or effort (optional, no default, stays absent)', () => {
  const work = baseWork();
  assert.equal(work.urgent, undefined);
  assert.equal(work.impact, undefined);
  assert.equal(work.effort, undefined);
  assert.doesNotThrow(() => validateWork(work));
});

test('validateWork accepts urgent as any URGENCY_LEVELS value', () => {
  for (const urgent of URGENCY_LEVELS) {
    assert.doesNotThrow(() => validateWork(baseWork({ urgent })));
  }
});

test('validateWork rejects an out-of-domain urgent value', () => {
  for (const urgent of ['URGENT', 'extreme', '', 1, true]) {
    assert.throws(
      () => validateWork(baseWork({ urgent })),
      (err) => err instanceof WorkValidationError && /urgent/.test(err.message),
    );
  }
});

test('validateWork accepts impact/effort as 0 or any non-negative number, including fractional', () => {
  for (const value of [0, 1, 42.5, 1000]) {
    assert.doesNotThrow(() => validateWork(baseWork({ impact: value })));
    assert.doesNotThrow(() => validateWork(baseWork({ effort: value })));
  }
});

test('validateWork rejects a negative or non-numeric impact/effort', () => {
  for (const value of [-1, -0.5, 'high', true, NaN, Infinity]) {
    assert.throws(
      () => validateWork(baseWork({ impact: value })),
      (err) => err instanceof WorkValidationError && /impact/.test(err.message),
    );
    assert.throws(
      () => validateWork(baseWork({ effort: value })),
      (err) => err instanceof WorkValidationError && /effort/.test(err.message),
    );
  }
});

test('validateWork does not add urgent/impact/effort to SCHEMA_VERSION or DEFAULTS (optional additive fields, no schema bump)', () => {
  assert.equal(SCHEMA_VERSION, 3);
  assert.equal(Object.hasOwn(DEFAULTS, 'urgent'), false);
  assert.equal(Object.hasOwn(DEFAULTS, 'impact'), false);
  assert.equal(Object.hasOwn(DEFAULTS, 'effort'), false);
});

// --- `goalTier`/`targets` fields (per str67-goal-directed-planning D1/D2):
// goalTier is an optional additive allowlist field (mirrors tier/domain);
// targets is an optional additive array field (mirrors deps' shape check
// and parent/discoveredFrom's self-reference guard, null treated as absent) ---

test('validateWork accepts a work item missing goalTier or targets (optional, no default, stays absent)', () => {
  const work = baseWork();
  assert.equal(work.goalTier, undefined);
  assert.equal(work.targets, undefined);
  assert.doesNotThrow(() => validateWork(work));
});

test('validateWork accepts every goalTier in GOAL_TIERS', () => {
  for (const goalTier of GOAL_TIERS) {
    assert.doesNotThrow(() => validateWork(baseWork({ goalTier })));
  }
});

test('validateWork rejects a goalTier outside GOAL_TIERS', () => {
  assert.throws(
    () => validateWork(baseWork({ goalTier: 'epic' })),
    (err) => err instanceof WorkValidationError && /goalTier/.test(err.message),
  );
});

test('validateWork accepts targets as an array of non-empty strings that exclude the item\'s own id', () => {
  assert.doesNotThrow(() => validateWork(baseWork({ id: 'mvp-1', targets: ['milestone-1', 'milestone-2'] })));
  assert.doesNotThrow(() => validateWork(baseWork({ targets: [] })));
});

test('validateWork treats targets: null the same as absent', () => {
  assert.doesNotThrow(() => validateWork(baseWork({ targets: null })));
});

test('validateWork rejects a targets that is not an array', () => {
  assert.throws(
    () => validateWork(baseWork({ targets: 'milestone-1' })),
    (err) => err instanceof WorkValidationError && /targets/.test(err.message),
  );
});

test('validateWork rejects a targets entry that is a non-string or empty string', () => {
  assert.throws(
    () => validateWork(baseWork({ targets: ['milestone-1', 42] })),
    (err) => err instanceof WorkValidationError && /targets/.test(err.message),
  );
  assert.throws(
    () => validateWork(baseWork({ targets: ['milestone-1', ''] })),
    (err) => err instanceof WorkValidationError && /targets/.test(err.message),
  );
});

test('validateWork rejects a work item that lists itself in its own targets', () => {
  assert.throws(
    () => validateWork(baseWork({ id: 'mvp-1', targets: ['mvp-1'] })),
    (err) => err instanceof WorkValidationError && /own targets|targets/.test(err.message),
  );
});

test('validateWork does not require targets to point at existing ids (targets may name not-yet-created items)', () => {
  assert.doesNotThrow(() => validateWork(baseWork({ id: 'mvp-1', targets: ['not-yet-created'] }), new Set(['mvp-1'])));
});

test('validateWork does not add goalTier or targets to SCHEMA_VERSION or DEFAULTS (optional additive fields, no schema bump)', () => {
  assert.equal(SCHEMA_VERSION, 3);
  assert.equal(Object.hasOwn(DEFAULTS, 'goalTier'), false);
  assert.equal(Object.hasOwn(DEFAULTS, 'targets'), false);
});

// --- tsk-5q5-2 (D1/D3, docs/history/judge-verdict-evidence-discipline/):
// checkAcceptanceEvidenceTraceable's narrow write-time evidence check -----

test('checkAcceptanceEvidenceTraceable accepts a clause whose evidence resolves to a real path under repoRoot', () => {
  const repoRoot = mkRepoRoot();
  fs.mkdirSync(path.join(repoRoot, 'docs/history/foo'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, 'docs/history/foo/CONTEXT.md'), 'D3: real decision');

  const work = baseWork({
    acceptance: [{ text: 'root cause confirmed', evidence: 'docs/history/foo/CONTEXT.md D3: real decision' }],
  });
  assert.equal(checkAcceptanceEvidenceTraceable(work, repoRoot), true);
});

test('checkAcceptanceEvidenceTraceable rejects a clause whose evidence cites no real path (the confirmed tsk-d3c failure shape)', () => {
  const repoRoot = mkRepoRoot();
  const work = baseWork({
    acceptance: [{ text: 'root cause confirmed', evidence: 'trust me, this is definitely the real root cause' }],
  });
  assert.throws(() => checkAcceptanceEvidenceTraceable(work, repoRoot), WorkValidationError);
});

test('checkAcceptanceEvidenceTraceable rejects a clause whose evidence cites a path-like string that does not actually exist', () => {
  const repoRoot = mkRepoRoot();
  const work = baseWork({
    acceptance: [{ text: 'root cause confirmed', evidence: 'docs/history/does-not-exist/CONTEXT.md D3: made up' }],
  });
  assert.throws(() => checkAcceptanceEvidenceTraceable(work, repoRoot), WorkValidationError);
});

test('checkAcceptanceEvidenceTraceable leaves a text-only clause (no evidence yet) completely unaffected, preserving RUL58 D4', () => {
  const repoRoot = mkRepoRoot();
  const work = baseWork({ acceptance: [{ text: 'ship it' }] });
  assert.equal(checkAcceptanceEvidenceTraceable(work, repoRoot), true);
});

test('checkAcceptanceEvidenceTraceable is a no-op when work.acceptance is absent', () => {
  const repoRoot = mkRepoRoot();
  assert.equal(checkAcceptanceEvidenceTraceable(baseWork(), repoRoot), true);
});

test('checkAcceptanceEvidenceTraceable is a no-op when repoRoot is omitted (opt-in, callers without a real repo root are unaffected)', () => {
  const work = baseWork({
    acceptance: [{ text: 'root cause confirmed', evidence: 'trust me, no real citation here' }],
  });
  assert.equal(checkAcceptanceEvidenceTraceable(work, undefined), true);
});

// holder (tsk-2t9c D1): every existing item has no `holder` at all —
// that must stay valid, since coding declares a roleGraph but the field
// is optional/lazy-default, same as `stage` itself.
test('validateWorkShape accepts an item with no holder at all (every existing item)', () => {
  assert.doesNotThrow(() => validateWorkShape(baseWork()));
});

test('validateWorkShape accepts a holder that is one of coding\'s declared roles', () => {
  assert.doesNotThrow(() => validateWorkShape(baseWork({ holder: 'reviewer' })));
});

test('validateWorkShape rejects a holder outside coding\'s declared roles', () => {
  assert.throws(() => validateWorkShape(baseWork({ holder: 'project-manager' })), WorkValidationError);
});

test('validateWorkShape rejects any holder on a domain with no roleGraph (synthetic)', () => {
  assert.throws(
    () => validateWorkShape(baseWork({ domain: 'synthetic', stage: 'assembling', holder: 'implementer' })),
    WorkValidationError,
  );
});

test('validateWorkShape (touchedFields): an unchanged, already-invalid holder is grandfathered on edit', () => {
  // Mirrors the exact D1/D2 (tsk-1ne) precedent this file already documents
  // for legacy shape: a patch that never touches `holder` must not
  // re-validate whatever value the record already carries.
  const work = baseWork({ holder: 'some-legacy-role-no-longer-declared' });
  assert.doesNotThrow(() => validateWorkShape(work, new Set(['title'])));
});
