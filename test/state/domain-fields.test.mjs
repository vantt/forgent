// test/state/domain-fields.test.mjs — decision record 0027, D6 (docs/
// decisions/0027-domain-so-huu-status-doan-truoc-delivered-supersede-base-
// workflow-model-d1-d3.md's "Ngoài phạm vi supersede D1-D3" paragraph; full
// design in docs/history/phase-2-status-category-schema/DISCUSSION.md
// §task-domain-fields): the optional `domainFields` field on a work item —
// `{ [domainName]: {...} }`, optional-additive (RUL11), written only through
// `work.add`/`work.edit`, whole-object overwrite on edit (never a deep
// merge), and optionally validated per-domain via a `fieldSchema` a domain
// MAY declare in its own `DOMAINS[domain]` registry entry.
//
// This file proves: the write doors accept/patch it, edit overwrites the
// whole object rather than merging, an item with no domainFields at all
// replays byte-for-byte unchanged, validateWorkShape rejects a malformed
// domainFields, and validateDomainFields enforces a THROWAWAY test-only
// domain's fieldSchema without ever touching another domain's namespace.
// Per this item's own scope (see bin/fgos.mjs task instructions), no
// fieldSchema is added to the real `coding` domain — coding has no need for
// one today, this is purely infrastructure for a future domain.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { addWork, editWork, StoreError } from '../../src/state/store.mjs';
import { validateWorkShape, validateDomainFields, WorkValidationError } from '../../src/state/work.mjs';
import { foldEvents } from '../../src/state/replay.mjs';

// Every test gets its own mkdtemp dir — never touch the repo's .fgos/.
function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-domain-fields-'));
}

function sampleWork(id, overrides = {}) {
  return {
    id,
    title: `Title ${id}`,
    kind: 'task',
    status: 'todo',
    deps: [],
    risk: 'light',
    refs: [],
    verify: 'npm test',
    ...overrides,
  };
}

test('work.add with a valid domainFields succeeds and the field lands on the item', () => {
  const dir = tmpDir();
  const { event, view } = addWork(dir, sampleWork('df-add', { domainFields: { coding: { foo: 'bar' } } }));
  assert.deepEqual(event.payload.domainFields, { coding: { foo: 'bar' } });
  assert.deepEqual(view.work['df-add'].domainFields, { coding: { foo: 'bar' } });
});

test('work.edit --domain-fields overwrites the WHOLE object (latest-wins), not a deep merge', () => {
  const dir = tmpDir();
  addWork(dir, sampleWork('df-edit'));

  const first = editWork(dir, {
    id: 'df-edit',
    patch: { domainFields: { coding: { foo: 'bar', keep: 'me' } } },
  });
  assert.deepEqual(first.view.work['df-edit'].domainFields, { coding: { foo: 'bar', keep: 'me' } });

  // Second edit supplies a domainFields object that does NOT repeat `keep` —
  // a deep merge would still show `keep: 'me'` surviving; whole-object
  // overwrite must NOT.
  const second = editWork(dir, {
    id: 'df-edit',
    patch: { domainFields: { coding: { foo: 'baz' } } },
  });
  assert.deepEqual(second.view.work['df-edit'].domainFields, { coding: { foo: 'baz' } });
  assert.equal(second.view.work['df-edit'].domainFields.coding.keep, undefined);
});

test('an item with no domainFields at all still validates and replays exactly as before (RUL11 zero-migration)', () => {
  const dir = tmpDir();
  const { view } = addWork(dir, sampleWork('df-none'));
  assert.equal(view.work['df-none'].domainFields, undefined);
  assert.ok(!('domainFields' in view.work['df-none']));

  // Legacy-shaped replay: an event predating this field entirely must fold
  // without throwing and without inventing a domainFields value.
  const events = [
    {
      seq: 1,
      ts: '2026-07-14T00:00:00.000Z',
      type: 'work.add',
      payload: sampleWork('df-legacy'),
    },
  ];
  const replayed = foldEvents(events);
  assert.equal(replayed.work['df-legacy'].domainFields, undefined);
  assert.ok(!('domainFields' in replayed.work['df-legacy']));
});

test('validateWorkShape rejects domainFields that is an array', () => {
  assert.throws(
    () => validateWorkShape(sampleWork('df-bad-array', { domainFields: [] })),
    WorkValidationError,
  );
});

test('validateWorkShape rejects a domainFields domain key mapping to a non-object (string)', () => {
  assert.throws(
    () => validateWorkShape(sampleWork('df-bad-string', { domainFields: { coding: 'nope' } })),
    WorkValidationError,
  );
});

test('validateWorkShape rejects a domainFields domain key mapping to null', () => {
  assert.throws(
    () => validateWorkShape(sampleWork('df-bad-null', { domainFields: { coding: null } })),
    WorkValidationError,
  );
});

test('validateWorkShape rejects a domainFields domain key mapping to an array', () => {
  assert.throws(
    () => validateWorkShape(sampleWork('df-bad-array-value', { domainFields: { coding: ['nope'] } })),
    WorkValidationError,
  );
});

test('addWork rejects a malformed domainFields before any event is appended', () => {
  const dir = tmpDir();
  assert.throws(
    () => addWork(dir, sampleWork('df-store-bad', { domainFields: { coding: 'nope' } })),
    (err) => err instanceof WorkValidationError || err instanceof StoreError,
  );
});

// Throwaway test-only domain object (per this item's own instruction: do NOT
// add a fieldSchema to the real DOMAINS registry — coding has no need for
// one today). Mirrors the shape a real `DOMAINS[domain]` entry would carry:
// just enough (`fieldSchema`) for validateDomainFields to read.
const TEST_DOMAIN_WITH_SCHEMA = Object.freeze({
  fieldSchema: Object.freeze({ foo: 'string', count: 'number' }),
});

test('validateDomainFields accepts a domainFields[domain] value that matches the declared fieldSchema', () => {
  const work = sampleWork('df-schema-ok', { domainFields: { coding: { foo: 'bar', count: 3 } } });
  assert.equal(validateDomainFields(work, TEST_DOMAIN_WITH_SCHEMA), true);
});

test('validateDomainFields rejects a domainFields[domain] value that violates the declared fieldSchema (wrong type)', () => {
  const work = sampleWork('df-schema-bad', { domainFields: { coding: { foo: 123, count: 3 } } });
  assert.throws(() => validateDomainFields(work, TEST_DOMAIN_WITH_SCHEMA), WorkValidationError);
});

test('validateDomainFields is a no-op when the domain declares no fieldSchema (e.g. real "coding" today)', () => {
  const work = sampleWork('df-no-schema', { domainFields: { coding: { anything: 'goes', nested: { ok: true } } } });
  assert.equal(validateDomainFields(work, {}), true);
  assert.equal(validateDomainFields(work, undefined), true);
});

test('validateDomainFields is a no-op when the item has no domainFields at all', () => {
  const work = sampleWork('df-schema-absent');
  assert.equal(validateDomainFields(work, TEST_DOMAIN_WITH_SCHEMA), true);
});

test('validateDomainFields only reads the namespace matching the item\'s OWN work.domain — other namespaces are left untouched, never validated', () => {
  // work.domain defaults to 'coding' (DEFAULT_DOMAIN) when absent; the
  // schema-violating 'marketing' namespace must never be inspected, since
  // this item's own domain is 'coding', not 'marketing'.
  const work = sampleWork('df-other-namespace', {
    domainFields: {
      coding: { foo: 'bar', count: 1 },
      marketing: { foo: 12345, count: 'not-a-number' },
    },
  });
  assert.equal(validateDomainFields(work, TEST_DOMAIN_WITH_SCHEMA), true);
});

test('validateWorkShape leaves an other-domain namespace present but does not deep-validate it (shape-only, generic across every key)', () => {
  // Shape validation (validateWorkShape) checks EVERY domainFields key is a
  // plain object, regardless of which domain owns it — but never strips or
  // rejects a namespace just because it belongs to a different domain than
  // work.domain. Only a non-object VALUE is rejected, not the presence of an
  // extra domain key.
  const work = sampleWork('df-shape-multi', {
    domain: 'coding',
    domainFields: { coding: { foo: 'bar' }, synthetic: { anything: 'goes' } },
  });
  assert.equal(validateWorkShape(work), true);
});
