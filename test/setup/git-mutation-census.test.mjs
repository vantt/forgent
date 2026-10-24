// Single wiring proof: declaration matching/drift cases belong to
// test/scripts/git-one-door-declarations.test.mjs, not a second doctor test matrix.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { checkMutationOneDoor } from '../../src/setup/git-checks.mjs';
import { verifyCensus, MUTATION_CENSUS_PATH } from '../../scripts/git-one-door-scan.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
test('the Git doctor row reads the generated census through the shared verifier', () => {
  const doc = JSON.parse(fs.readFileSync(new URL(`../../${MUTATION_CENSUS_PATH}`, import.meta.url), 'utf8'));
  const result = checkMutationOneDoor(root);
  assert.deepEqual(result, verifyCensus(doc, root));
  assert.equal(result.passed, true, result.message);
});
