// Stage 1 of Seat Binding as the Node side sees it: the request it builds from a runner config, the digest of the
// semantic slice, the per-ask cache, and the two answers (a policy, or a refusal that is a decision).
// The decision itself is the crate's; its own cases are the shared golden vectors (test/seat-binding/golden.test.mjs).

import '../../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { seatConfigDigestOf, seatConfigOf, seatPolicy, resetSeatPolicyCache } from '../../../src/runner/execution/seat-policy.mjs';
import { resetSeatBindingClient } from '../../../src/seat-binding/client.mjs';

const runner = () => ({
  defaults: { tier: 'standard' },
  maxTier: 'flagship',
  tierFallback: { standard: ['claude'] },
  modelPolicies: { claude: { standard: 'sonnet', flagship: 'opus' } },
  capabilities: {
    'impact-analysis': { description: 'a tool capability', prefer: 'gitnexus', serves: ['impact'], confinement: { mode: 'required' } },
    'architecture:*': { tier: 'flagship', prefer: ['claude'], rigor: 'high', roles: { 'red-team': { prefer: ['xai'], $comment: 'ignored' } }, $comment: 'ignored' },
  },
  executors: { claude: { command: 'claude' } },
  timeoutMs: 5000,
});

const ask = (extra = {}) => ({ capability: 'architecture:shape', seat: 'system', role: 'producer', selectors: {}, raiseAuthorized: false, effectiveRigor: 'high', ...extra });

test('the request carries the slice of the runner config seat choice reads, with a string prefer as a list and no comment', () => {
  const config = seatConfigOf(runner());
  assert.deepEqual(Object.keys(config).sort(), ['capabilities', 'defaults', 'maxTier', 'modelPolicies', 'tierFallback']);
  assert.deepEqual(config.capabilities['impact-analysis'], { prefer: ['gitnexus'] }, 'catalog text and confinement are not seat choice');
  assert.deepEqual(config.capabilities['architecture:*'], { tier: 'flagship', prefer: ['claude'], roles: { 'red-team': { prefer: ['xai'] } } });
  assert.equal(JSON.stringify(seatConfigDigestOf(runner()).config).includes('$comment'), false);
});

test('the config digest ignores key order, comments and everything outside the slice, and changes with a tier', () => {
  const base = seatConfigDigestOf(runner()).digest;
  assert.match(base, /^sha256:[0-9a-f]{64}$/);
  const reordered = runner();
  reordered.capabilities = Object.fromEntries(Object.entries(reordered.capabilities).reverse());
  reordered.$comment = 'a ladder';
  reordered.timeoutMs = 1;
  reordered.executors.claude.command = 'other';
  assert.equal(seatConfigDigestOf(reordered).digest, base);
  const retiered = runner();
  retiered.capabilities['architecture:*'].tier = 'frontier';
  assert.notEqual(seatConfigDigestOf(retiered).digest, base);
  // A runner section handed over whole (`{ runner: {...} }`) digests like the section itself.
  assert.equal(seatConfigDigestOf({ runner: runner() }).digest, base);
});

test('a decided seat comes back as its policy: tier, where it came from, the executors in order', () => {
  resetSeatPolicyCache();
  const { policy, refused } = seatPolicy(ask(), runner());
  assert.equal(refused, undefined);
  assert.equal(policy.tier, 'flagship');
  assert.equal(policy.tierSource, 'capabilities."architecture:*".tier');
  assert.deepEqual(policy.prefer, ['claude'], 'prefer is the list the config declared');
  assert.equal(policy.preferSource, 'capabilities."architecture:*".prefer');
});

test('a refusal is a decision that comes back as a value, never as an exception', () => {
  resetSeatPolicyCache();
  const answer = seatPolicy(ask({ override: { tier: 'frontier' } }), runner());
  assert.equal(answer.policy, undefined);
  assert.equal(answer.refused.reason, 'tier-escalation-unauthorized');
});

test('an ask asked again with the same config costs no second exec; a changed config does', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'seat-policy-shim-'));
  const countFile = path.join(dir, 'count');
  const shim = path.join(dir, 'host-shim.sh');
  fs.writeFileSync(shim, `#!/bin/sh\necho x >> "${countFile}"\nexec "${process.env.FGOS_HOST_BIN}" "$@"\n`, { mode: 0o755 });
  const realHost = process.env.FGOS_HOST_BIN;
  assert.ok(realHost, 'the suite runs with a host binary');
  const execs = () => (fs.existsSync(countFile) ? fs.readFileSync(countFile, 'utf8').split('\n').filter(Boolean).length : 0);
  try {
    process.env.FGOS_HOST_BIN = shim;
    resetSeatBindingClient();
    resetSeatPolicyCache();
    seatPolicy(ask(), runner());
    seatPolicy(ask(), runner());
    seatPolicy(ask(), { ...runner(), timeoutMs: 1 });
    assert.equal(execs(), 1, 'the same ask over an equal slice of the config is answered from the cache');
    seatPolicy(ask({ seat: 'alternative' }), runner());
    assert.equal(execs(), 2, 'another seat is another question');
    const changed = runner();
    changed.maxTier = 'advanced';
    seatPolicy(ask(), changed);
    assert.equal(execs(), 3, 'a changed config is another question');
  } finally {
    process.env.FGOS_HOST_BIN = realHost;
    resetSeatBindingClient();
    resetSeatPolicyCache();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
