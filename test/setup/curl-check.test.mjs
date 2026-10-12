import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkCurlAvailable } from '../../src/setup/registrations.mjs';
import { checkById } from './helpers/setup-checks-harness.mjs';

test('curl-available doctor check is registered and passes when curl runs', () => {
  const checkObj = checkById('curl-available');
  assert.notEqual(checkObj, undefined);
  const result = checkObj.check();
  assert.equal(result.passed, true);
});

test('a missing curl is a warning that names the local --from way out, never a failure', () => {
  const result = checkCurlAvailable('fgos-no-such-curl-binary');
  assert.equal(result.passed, true);
  assert.match(result.message, /^warning: /);
  assert.match(result.message, /--from/);
});
