// The Node client of `fgos internal seat-binding` against the real host binary
// (FGOS_HOST_BIN, built from this checkout) and small stand-in hosts: every
// failure mode throws its named code, a refusal is a result, and the host an
// activated release runs wins over FGOS_HOST_BIN.
import '../helpers/process-tmp-root.mjs';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createSeatBindingClient,
  resolveSeatBindingHost,
  SeatBindingError,
  SEAT_BINDING_TIMEOUT_MS,
} from '../../src/seat-binding/client.mjs';
import { golden, caseInput } from './golden-cases.helper.mjs';
import { MODEL_POLICY_TIERS } from '../../src/runner/dispatch/config.mjs';
import { enterHotLock } from '../../src/holder-lock/hot-guard.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const HOST_BIN = process.env.FGOS_HOST_BIN;

let scratch;
before(() => {
  assert.ok(HOST_BIN && fs.existsSync(HOST_BIN), `set FGOS_HOST_BIN to a host built from this checkout: ${HOST_BIN}`);
  scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-seat-client-'));
});
after(() => fs.rmSync(scratch, { recursive: true, force: true }));

function script(name, body) {
  const file = path.join(scratch, name);
  fs.writeFileSync(file, `#!/bin/sh\n${body}\n`, { mode: 0o755 });
  return file;
}

const expectCode = (fn, code) => assert.throws(fn, (err) => err instanceof SeatBindingError && err.code === code, code);

test('the real host answers a bind with the decision and its own version', () => {
  const client = createSeatBindingClient({ hostBin: HOST_BIN });
  const out = client.bindSeat(golden.base);
  assert.equal(typeof out.ok, 'boolean');
  assert.equal(out.protocol, 1);
  assert.match(out.hostVersion, /^\d+\.\d+\.\d+/);
  assert.equal(out.bindingInput.protocol, 1);
});

test('a refused seat comes back as a result carrying its refusal, not as an exception', () => {
  const refusal = golden.cases.find((c) => c.name.startsWith('a hard pin on a family with no cell'));
  const out = createSeatBindingClient({ hostBin: HOST_BIN }).bindSeat(caseInput(refusal));
  assert.equal(out.ok, false);
  assert.equal(out.refusal.reason, 'tier-cell-missing');
  assert.ok(out.hostVersion);
});

test('the tier ladder the host answers is the one the Node config loader reads, six tiers weakest first', () => {
  const ladder = createSeatBindingClient({ hostBin: HOST_BIN }).tierLadder();
  assert.deepEqual(ladder.vocabulary, MODEL_POLICY_TIERS);
  assert.equal(MODEL_POLICY_TIERS.length, 6);
  assert.ok(ladder.hostVersion);
});

test('a request the contract rejects throws seat-binding-route-rejected', () => {
  expectCode(() => createSeatBindingClient({ hostBin: HOST_BIN }).bindSeat({ ask: 'not an ask' }), 'seat-binding-route-rejected');
});

test('a host that does not know the route throws host-version-mismatch', () => {
  const old = script('old-host.sh', `echo 'fgos: unknown verb "internal". Usage: fgos <command> [args...]' >&2\nexit 4`);
  expectCode(() => createSeatBindingClient({ hostBin: old }).tierLadder(), 'host-version-mismatch');
  expectCode(() => createSeatBindingClient({ hostBin: old }).bindSeat(golden.base), 'host-version-mismatch');
  // A request larger than the pipe buffer: the old host exits unread, so writing it fails with EPIPE.
  expectCode(() => createSeatBindingClient({ hostBin: old }).bindSeat({ ...golden.base, padding: 'x'.repeat(1 << 20) }), 'host-version-mismatch');
});

test('a host speaking another protocol throws host-version-mismatch', () => {
  const other = script('other-protocol.sh', `cat >/dev/null\necho '{"v":1,"protocol":2,"hostVersion":"9.9.9","op":"ladder","result":"ok","ladder":{"vocabulary":[]}}'`);
  expectCode(() => createSeatBindingClient({ hostBin: other }).tierLadder(), 'host-version-mismatch');
});

test('output that is not the route contract throws seat-binding-route-bad-output', () => {
  const garbage = script('garbage.sh', `cat >/dev/null\necho 'not json at all'`);
  const silent = script('silent.sh', `cat >/dev/null\nexit 1`);
  const wrongOp = script('wrong-op.sh', `cat >/dev/null\necho '{"v":1,"protocol":1,"hostVersion":"1","op":"bind","result":"ok"}'`);
  const noDecision = script('no-decision.sh', `cat >/dev/null\necho '{"v":1,"protocol":1,"hostVersion":"1","op":"bind","result":"ok"}'`);
  for (const [bin, call] of [[garbage, 'tierLadder'], [silent, 'tierLadder'], [wrongOp, 'tierLadder']]) {
    expectCode(() => createSeatBindingClient({ hostBin: bin })[call](), 'seat-binding-route-bad-output');
  }
  expectCode(() => createSeatBindingClient({ hostBin: noDecision }).bindSeat(golden.base), 'seat-binding-route-bad-output');
});

test('a host that does not answer in time is killed and throws seat-binding-route-timeout', () => {
  assert.equal(SEAT_BINDING_TIMEOUT_MS, 5000);
  const slow = script('slow.sh', 'exec sleep 5');
  const started = Date.now();
  expectCode(() => createSeatBindingClient({ hostBin: slow, timeoutMs: 200 }).tierLadder(), 'seat-binding-route-timeout');
  assert.ok(Date.now() - started < 3000);
});

test('a host path that cannot be run throws seat-binding-no-host-binary', () => {
  expectCode(() => createSeatBindingClient({ hostBin: path.join(scratch, 'missing') }).tierLadder(), 'seat-binding-no-host-binary');
});

test('no host in reach throws seat-binding-no-host-binary naming where it looked', () => {
  const bare = fs.mkdtempSync(path.join(scratch, 'bare-'));
  const saved = process.env.FGOS_HOST_BIN;
  delete process.env.FGOS_HOST_BIN;
  try {
    assert.throws(
      () => createSeatBindingClient({ cwd: bare, fgosDir: path.join(bare, '.fgos'), payloadRoot: bare }).tierLadder(),
      (err) => err.code === 'seat-binding-no-host-binary' && err.tried.length > 0,
    );
  } finally {
    process.env.FGOS_HOST_BIN = saved;
  }
});

test('a process inside the hot mutex never execs the host: seat-binding-in-lock', () => {
  const marker = path.join(scratch, 'exec-marker');
  const host = script('marker-host.sh', `touch '${marker}'\nexit 1`);
  const leaveHotLock = enterHotLock();
  try {
    expectCode(() => createSeatBindingClient({ hostBin: host }).tierLadder(), 'seat-binding-in-lock');
    expectCode(() => createSeatBindingClient({ hostBin: host }).bindSeat(golden.base), 'seat-binding-in-lock');
  } finally {
    leaveHotLock();
  }
  assert.equal(fs.existsSync(marker), false);
});

function activatedProject() {
  const project = fs.mkdtempSync(path.join(scratch, 'project-'));
  const release = path.join(project, 'release');
  fs.mkdirSync(path.join(release, 'bin'), { recursive: true });
  fs.writeFileSync(path.join(release, 'manifest.json'), JSON.stringify({ components: { legacyNode: { root: '.' } } }));
  const host = path.join(release, 'bin', 'fgos');
  fs.writeFileSync(host, `#!/bin/sh\ncat >/dev/null\necho '{"v":1,"protocol":1,"hostVersion":"activation-fixture","op":"ladder","result":"ok","ladder":{"vocabulary":["nano"]}}'\n`, { mode: 0o755 });
  fs.mkdirSync(path.join(project, '.fgos', 'installation'), { recursive: true });
  fs.writeFileSync(path.join(project, '.fgos', 'installation', 'activation.json'), JSON.stringify({ status: 'ready', releasePath: release }));
  return { project, release, host };
}

test('inside an activated release the activation host answers and FGOS_HOST_BIN is ignored', () => {
  const { project, release, host } = activatedProject();
  const resolved = resolveSeatBindingHost({ cwd: project, fgosDir: path.join(project, '.fgos'), payloadRoot: release });
  assert.equal(fs.realpathSync(resolved.bin), fs.realpathSync(host));
  assert.equal(resolved.activated, true);
  const client = createSeatBindingClient({ cwd: project, fgosDir: path.join(project, '.fgos'), payloadRoot: release });
  assert.equal(client.tierLadder().hostVersion, 'activation-fixture');
});

test('outside an activated release (a checkout, the dev door) FGOS_HOST_BIN is honoured', () => {
  const { project } = activatedProject();
  const resolved = resolveSeatBindingHost({ cwd: project, fgosDir: path.join(project, '.fgos'), payloadRoot: REPO_ROOT });
  assert.equal(path.resolve(resolved.bin), path.resolve(HOST_BIN));
  assert.equal(resolved.activated, false);
});
