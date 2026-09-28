// flow-definition-policy-patch-doc-drift.test.mjs -- Unit I30 (Phase 7 item
// 4b): proves the canonical docs/platform/agent-coordination/contracts/
// flow-definition.md's PolicyPatch section documents `capability` and
// `distinctProviderFrom` (the two fields this unit ported) matching
// schema.mjs's own POLICY_PATCH_FIELDS/DISTINCT_PROVIDER_STRENGTH_VALUES --
// schema.mjs is the source of truth, this doc is read as the artifact being
// checked against it, never the other way round.
//
// Scoped to only these two fields, not every POLICY_PATCH_FIELDS entry:
// `preferInvocation` and `repeatMode` are ALSO undocumented in this section
// (confirmed missing from both the canonical and the legacy doc copy) but
// that gap predates this unit and was never part of its charter (Phase 7
// item 4b named only `capability`/`distinctProviderFrom` as confirmed
// missing) -- a separate follow-up unit's scope, not silently absorbed here.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  POLICY_PATCH_FIELDS,
  DISTINCT_PROVIDER_STRENGTH_VALUES,
} from '../../src/runner/definitions/schema.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOC_PATH = path.join(__dirname, '../../docs/platform/agent-coordination/contracts/flow-definition.md');
const PORTED_FIELDS = ['capability', 'distinctProviderFrom'];

function readPolicyPatchSection() {
  const doc = fs.readFileSync(DOC_PATH, 'utf8');
  const start = doc.indexOf('\n## PolicyPatch\n');
  assert.ok(start !== -1, 'flow-definition.md must have a "## PolicyPatch" section');
  const end = doc.indexOf('\n## Forbidden Fields Summary\n', start);
  assert.ok(end !== -1, 'flow-definition.md must have a "## Forbidden Fields Summary" section after PolicyPatch');
  return doc.slice(start, end);
}

test('canonical flow-definition.md PolicyPatch section documents capability/distinctProviderFrom, both real schema.mjs POLICY_PATCH_FIELDS entries', () => {
  const section = readPolicyPatchSection();
  for (const field of PORTED_FIELDS) {
    assert.ok(
      POLICY_PATCH_FIELDS.has(field),
      `"${field}" must be real in schema.mjs's own POLICY_PATCH_FIELDS -- this test's own premise`,
    );
    assert.ok(
      section.includes(field),
      `PolicyPatch section is missing field "${field}" -- present in schema.mjs's POLICY_PATCH_FIELDS but not documented`,
    );
  }
});

test('canonical flow-definition.md documents every distinctProviderFrom.strength value schema.mjs accepts', () => {
  const section = readPolicyPatchSection();
  for (const strength of DISTINCT_PROVIDER_STRENGTH_VALUES) {
    assert.ok(
      section.includes(strength),
      `PolicyPatch section is missing distinctProviderFrom.strength value "${strength}"`,
    );
  }
});
