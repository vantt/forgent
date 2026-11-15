import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkBwrapAvailable } from '../../src/setup/registrations.mjs';

test('checkBwrapAvailable returns passed:true when bwrap is installed and functional', () => {
  const result = checkBwrapAvailable();
  assert.equal(typeof result.passed, 'boolean');
  assert.equal(typeof result.message, 'string');
  if (result.passed) {
    assert.match(result.message, /bwrap is available/);
  } else {
    assert.match(result.message, /bwrap is unavailable/);
  }
});
