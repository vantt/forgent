// Single wiring proof: declaration matching/drift cases belong to
// test/scripts/git-one-door-declarations.test.mjs, not a second matrix here.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { verifyCensus, MUTATION_CENSUS_PATH } from '../../scripts/git-one-door-scan.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
test('the generated mutation census lists no Git or hook spawn outside the driver and matches the payload it was built from', () => {
  const doc = JSON.parse(fs.readFileSync(new URL(`../../${MUTATION_CENSUS_PATH}`, import.meta.url), 'utf8'));
  const result = verifyCensus(doc, root);
  assert.equal(result.passed, true, result.message);
});
