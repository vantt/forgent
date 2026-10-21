// The `seat-binding-route` doctor row: it passes on a host that answers the
// route, fails on one that predates it, and probes the very binary the client
// resolves.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DOCTOR_CHECKS } from '../../src/setup/checks.mjs';
import { checkSeatBindingRoute } from '../../src/setup/registrations.mjs';
import { resolveSeatBindingHost } from '../../src/seat-binding/client.mjs';

const HOST_BIN = process.env.FGOS_HOST_BIN;

test('the row is registered in the doctor registry', () => {
  assert.ok(DOCTOR_CHECKS.some((check) => check.id === 'seat-binding-route'));
});

test('the row passes on a host that answers ladder at protocol 1', () => {
  assert.ok(HOST_BIN && fs.existsSync(HOST_BIN), `set FGOS_HOST_BIN to a host built from this checkout: ${HOST_BIN}`);
  const result = checkSeatBindingRoute(process.cwd(), { hostBin: HOST_BIN });
  assert.equal(result.passed, true, result.message);
  assert.match(result.message, /protocol 1, hostVersion \d/);
});

test('the row fails on a host that has no seat-binding route', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-seat-doctor-'));
  const old = path.join(dir, 'old-host');
  fs.writeFileSync(old, '#!/bin/sh\necho \'fgos: unknown verb "internal". Usage: fgos <command> [args...]\' >&2\nexit 4\n', { mode: 0o755 });
  const result = checkSeatBindingRoute(process.cwd(), { hostBin: old });
  assert.equal(result.passed, false);
  assert.match(result.message, /host-version-mismatch/);
});

test('without an injected host the row probes the binary the client resolves', () => {
  const resolved = resolveSeatBindingHost({ cwd: process.cwd() });
  const result = checkSeatBindingRoute(process.cwd());
  assert.equal(result.passed, true, result.message);
  assert.ok(result.message.startsWith(resolved.bin));
});
