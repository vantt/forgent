// The shared golden contract through the real route: every case is fed to
// `fgos internal seat-binding bind` by the Node client and the answer must
// satisfy the case's expectations. The Rust suite owns the cases; this proves
// the wire (request shape, answer shape, ok/refused result) carries them intact.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createSeatBindingClient } from '../../src/seat-binding/client.mjs';
import { golden, caseInput } from './golden-cases.helper.mjs';

const HOST_BIN = process.env.FGOS_HOST_BIN;

/** `expected` is a subset of `actual`: object keys must match, arrays match over the expected
 * prefix, and an expected null also accepts an absent key. */
function subset(expected, actual, where, failures) {
  if (expected === null) {
    if (actual !== undefined && actual !== null) failures.push(`${where}: expected null, got ${JSON.stringify(actual)}`);
  } else if (actual === undefined) {
    failures.push(`${where}: missing, expected ${JSON.stringify(expected)}`);
  } else if (Array.isArray(expected)) {
    if (!Array.isArray(actual) || actual.length < expected.length) failures.push(`${where}: expected at least ${expected.length} elements`);
    else expected.forEach((value, index) => subset(value, actual[index], `${where}[${index}]`, failures));
  } else if (typeof expected === 'object') {
    for (const [key, value] of Object.entries(expected)) subset(value, actual?.[key], `${where}.${key}`, failures);
  } else if (expected !== actual) {
    failures.push(`${where}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

test('every golden case answers through the route exactly as the contract says', () => {
  assert.ok(HOST_BIN && fs.existsSync(HOST_BIN), `set FGOS_HOST_BIN to a host built from this checkout: ${HOST_BIN}`);
  assert.equal(golden.contract, 'seat-binding.golden.v1');
  assert.ok(golden.cases.length >= 70);
  const client = createSeatBindingClient({ hostBin: HOST_BIN });
  const failures = [];
  for (const testCase of golden.cases) {
    const local = [];
    const out = client.bindSeat(caseInput(testCase));
    subset(testCase.expected, out, '$', local);
    if (testCase.executors) {
      const actual = (out.ranked?.candidates ?? []).map((c) => c.executor);
      if (JSON.stringify(actual) !== JSON.stringify(testCase.executors)) local.push(`executors: expected ${testCase.executors}, got ${actual}`);
    }
    if (testCase.skippedReasons) {
      const actual = (out.ranked?.skipped ?? []).map((s) => s.reason);
      if (JSON.stringify(actual) !== JSON.stringify(testCase.skippedReasons)) local.push(`skippedReasons: expected ${testCase.skippedReasons}, got ${actual}`);
    }
    const text = (out.explain?.lines ?? []).join('\n');
    for (const part of testCase.explainContains ?? []) {
      if (!text.includes(part)) local.push(`explain lacks ${JSON.stringify(part)}`);
    }
    failures.push(...local.map((f) => `[${testCase.name}] ${f}`));
  }
  assert.deepEqual(failures, []);
});
