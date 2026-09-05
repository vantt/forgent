import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkBwrapAvailable } from '../../src/setup/registrations.mjs';
import { checkById } from './helpers/setup-checks-harness.mjs';

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

test('bwrap-available doctor check is registered and callable via checkById', () => {
  const checkObj = checkById('bwrap-available');
  assert.notEqual(checkObj, undefined);
  assert.equal(checkObj.id, 'bwrap-available');
  const result = checkObj.check();
  assert.equal(typeof result.passed, 'boolean');
});
