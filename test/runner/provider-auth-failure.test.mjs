// test/runner/provider-auth-failure.test.mjs -- the dead-credential wordings shared by the pane
// liveness ladder, the provider capacity classifier and the run settlement.

import test from 'node:test';
import assert from 'node:assert/strict';

import { AUTH_FAILURE_TAIL_LINES, matchAuthFailureLine } from '../../src/runner/dispatch/provider-auth-failure.mjs';
import { classifyProviderCapacityFault } from '../../src/runner/dispatch/provider-capacity.mjs';

const PI_STDERR = 'No API key found for openrouter.\n\nUse /login to log into a provider via OAuth or API key.\n';

test('a missing key as pi prints it is a dead credential, whatever the provider is called', () => {
  assert.equal(matchAuthFailureLine(PI_STDERR), 'No API key found for openrouter.');
  assert.equal(matchAuthFailureLine('Error: No API key found for xai'), 'Error: No API key found for xai');
});

test('ordinary output that merely mentions keys or logins is not a dead credential', () => {
  for (const text of [
    'The test checks that "No API key found for x" is reported',
    'I set the API key and it works',
    'No API key found',
    'key rotation finished; logged in as the service account',
    '',
  ]) {
    assert.equal(matchAuthFailureLine(text), null, text);
  }
  assert.equal(matchAuthFailureLine(undefined), null);
});

test('with a tail window only the last lines of a process count, so an old log line does not', () => {
  const longLog = ['No API key found for openrouter.', ...Array.from({ length: 20 }, (_, i) => `step ${i} done`)].join('\n');
  assert.notEqual(matchAuthFailureLine(longLog), null, 'without a window the whole text is read');
  assert.equal(matchAuthFailureLine(longLog, { tailLines: AUTH_FAILURE_TAIL_LINES }), null);
  assert.equal(matchAuthFailureLine(`${longLog}\n${PI_STDERR}`, { tailLines: AUTH_FAILURE_TAIL_LINES }), 'No API key found for openrouter.');
});

test('a round that stopped on a missing key quarantines the account as an auth fault for any provider', () => {
  const fault = classifyProviderCapacityFault({ provider: 'openrouter', stderr: PI_STDERR, adapterOutcome: 'provider-limit' });
  assert.equal(fault.action, 'quarantine');
  assert.equal(fault.reasonCode, 'auth-token');
  assert.equal(fault.quarantineKind, 'manual-clear');
});

test('a stop on a quota keeps its quota classification when the text has no dead credential', () => {
  const fault = classifyProviderCapacityFault({ provider: 'openrouter', stderr: 'rate limit reached, try again later', adapterOutcome: 'provider-limit' });
  assert.equal(fault.reasonCode, 'quota-limit');
});
