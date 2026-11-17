// The Node client of `fgos internal seat-binding --protocol 2` against the real host binary
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
import { withMachine } from '../helpers/executor-model-vectors.helper.mjs';
import { MODEL_POLICY_TIERS } from '../../src/runner/dispatch/config.mjs';
import { RunnerConfigError } from '../../src/runner/dispatch/runner-config-error.mjs';
import { enterHotLock } from '../../src/holder-lock/hot-guard.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const HOST_BIN = process.env.FGOS_HOST_BIN;
const BIND_VECTORS = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'packages/execution/contracts/bind.v1.json'), 'utf8')).vectors;
const vectorNamed = (prefix) => BIND_VECTORS.find((vector) => vector.name.startsWith(prefix));

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

/** The bind request of a bind vector, over the machine the vector describes (its PATH is the session's). */
function bindOverVector(vector, client) {
  return withMachine(vector.machine, (paths) => client.bind({
    runner: vector.runner,
    ask: vector.args.ask,
    session: { ...vector.args.session, pathEnv: paths.binDir },
    walk: vector.args.walk ?? {},
    now: vector.args.now,
  }));
}

const SEAT = { runner: {}, ask: { unit: { id: 'u1', capability: 'execute', writes: [] } }, session: {}, walk: {}, now: 0 };
const expectCode = (fn, code) => assert.throws(fn, (err) => err instanceof SeatBindingError && err.code === code, code);

test('a bind over protocol 2 answers the binding the crate gives, carrying the host version', () => {
  const vector = vectorNamed('bind: a producer seat whose capability names nothing');
  const out = bindOverVector(vector, createSeatBindingClient({ hostBin: HOST_BIN }));
  assert.match(out.hostVersion, /^\d+\.\d+\.\d+/);
  assert.equal(out.binding.bindingInput.hostVersion, out.hostVersion);
  delete out.binding.bindingInput.hostVersion;
  assert.deepEqual(out.binding, vector.expect);
});

test('a refused seat comes back as a result carrying its refusal, not as an exception', () => {
  const vector = vectorNamed('bind: a unit persona other than the locked one is refused');
  const out = bindOverVector(vector, createSeatBindingClient({ hostBin: HOST_BIN }));
  assert.deepEqual(out.binding, vector.expect);
  assert.ok(out.hostVersion);
});

test('a bind the decision cannot make throws the error class Node callers catch', () => {
  const vector = vectorNamed('bind: an override tier that is no tier is an error');
  assert.throws(() => bindOverVector(vector, createSeatBindingClient({ hostBin: HOST_BIN })), (err) => err instanceof RunnerConfigError && err.message === vector.expect.error.message);
});

test('the tier ladder the host answers is the one the Node config loader reads, six tiers weakest first', () => {
  const ladder = createSeatBindingClient({ hostBin: HOST_BIN }).tierLadder();
  assert.deepEqual(ladder.vocabulary, MODEL_POLICY_TIERS);
  assert.equal(MODEL_POLICY_TIERS.length, 6);
  assert.ok(ladder.hostVersion);
});

test('the seat config digest a replay compares comes from the host', () => {
  const vector = BIND_VECTORS.find((v) => v.fact === 'seatConfig');
  const out = createSeatBindingClient({ hostBin: HOST_BIN }).digest({ runner: vector.runner });
  assert.deepEqual({ config: out.config, digest: out.digest }, vector.expect);
});

test('a request the contract rejects throws seat-binding-route-rejected', () => {
  expectCode(() => createSeatBindingClient({ hostBin: HOST_BIN }).bind({ ask: 'not an ask' }), 'seat-binding-route-rejected');
});

test('an older host refuses protocol 2 or does not know the operation: host-version-mismatch', () => {
  const protocolOne = script('protocol-one.sh', `cat >/dev/null\necho '{"v":1,"protocol":1,"hostVersion":"1","op":"bind","result":"error","code":"host-version-mismatch","message":"needs --protocol 1"}'\nexit 3`);
  expectCode(() => createSeatBindingClient({ hostBin: protocolOne }).bind(SEAT), 'host-version-mismatch');
  const noOp = script('no-op.sh', `cat >/dev/null\necho '{"v":1,"protocol":1,"hostVersion":"1","op":"plan","result":"error","code":"usage","message":"unknown operation plan; expected bind or ladder"}'\nexit 2`);
  expectCode(() => createSeatBindingClient({ hostBin: noOp }).plan({ runner: {}, purpose: 'review' }), 'host-version-mismatch');
});

test('a host that does not know the route throws host-version-mismatch', () => {
  const old = script('old-host.sh', `echo 'fgos: unknown verb "internal". Usage: fgos <command> [args...]' >&2\nexit 4`);
  expectCode(() => createSeatBindingClient({ hostBin: old }).tierLadder(), 'host-version-mismatch');
  expectCode(() => createSeatBindingClient({ hostBin: old }).bind(SEAT), 'host-version-mismatch');
  // A request larger than the pipe buffer: the old host exits unread, so writing it fails with EPIPE.
  expectCode(() => createSeatBindingClient({ hostBin: old }).bind({ ...SEAT, padding: 'x'.repeat(1 << 20) }), 'host-version-mismatch');
});

test('a host speaking another protocol throws host-version-mismatch', () => {
  const other = script('other-protocol.sh', `cat >/dev/null\necho '{"v":1,"protocol":3,"hostVersion":"9.9.9","op":"ladder","result":"ok","ladder":{"vocabulary":[]}}'`);
  expectCode(() => createSeatBindingClient({ hostBin: other }).tierLadder(), 'host-version-mismatch');
});

test('output that is not the route contract throws seat-binding-route-bad-output', () => {
  const garbage = script('garbage.sh', `cat >/dev/null\necho 'not json at all'`);
  const silent = script('silent.sh', `cat >/dev/null\nexit 1`);
  const wrongOp = script('wrong-op.sh', `cat >/dev/null\necho '{"v":2,"protocol":2,"hostVersion":"1","op":"bind","result":"ok"}'`);
  const noDecision = script('no-decision.sh', `cat >/dev/null\necho '{"v":2,"protocol":2,"hostVersion":"1","op":"bind","result":"ok"}'`);
  for (const [bin, call] of [[garbage, 'tierLadder'], [silent, 'tierLadder'], [wrongOp, 'tierLadder']]) {
    expectCode(() => createSeatBindingClient({ hostBin: bin })[call](), 'seat-binding-route-bad-output');
  }
  expectCode(() => createSeatBindingClient({ hostBin: noDecision }).bind(SEAT), 'seat-binding-route-bad-output');
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
    expectCode(() => createSeatBindingClient({ hostBin: host }).bind(SEAT), 'seat-binding-in-lock');
  } finally {
    leaveHotLock();
  }
  assert.equal(fs.existsSync(marker), false);
});

test('every client call is exactly one host exec: a bind costs one, a refused bind costs one, a call in the hot mutex costs none', () => {
  const counter = path.join(scratch, 'exec-count');
  fs.rmSync(counter, { force: true });
  const host = script('counting-host.sh', `echo x >> '${counter}'\ncat >/dev/null\necho '{"v":2,"protocol":2,"hostVersion":"1","op":"ladder","result":"ok","ladder":{"vocabulary":[]}}'`);
  const client = createSeatBindingClient({ hostBin: host });
  const execs = () => (fs.existsSync(counter) ? fs.readFileSync(counter, 'utf8').trim().split('\n').length : 0);
  client.tierLadder();
  assert.equal(execs(), 1);
  client.tierLadder();
  assert.equal(execs(), 2);
  expectCode(() => client.bind(SEAT), 'seat-binding-route-bad-output');
  assert.equal(execs(), 3, 'a bind the host answers badly is still one exec, never retried');
  const leaveHotLock = enterHotLock();
  try {
    expectCode(() => client.tierLadder(), 'seat-binding-in-lock');
  } finally {
    leaveHotLock();
  }
  assert.equal(execs(), 3);
});

function activatedProject() {
  const project = fs.mkdtempSync(path.join(scratch, 'project-'));
  const release = path.join(project, 'release');
  fs.mkdirSync(path.join(release, 'bin'), { recursive: true });
  fs.writeFileSync(path.join(release, 'manifest.json'), JSON.stringify({ components: { legacyNode: { root: '.' } } }));
  const host = path.join(release, 'bin', 'fgos');
  fs.writeFileSync(host, `#!/bin/sh\ncat >/dev/null\necho '{"v":2,"protocol":2,"hostVersion":"activation-fixture","op":"ladder","result":"ok","ladder":{"vocabulary":["nano"]}}'\n`, { mode: 0o755 });
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

test('a host that has gone since it was resolved is looked up again once; a host the caller named is not replaced', () => {
  const { project, release, host } = activatedProject();
  const client = createSeatBindingClient({ cwd: project, fgosDir: path.join(project, '.fgos'), payloadRoot: release });
  assert.equal(client.tierLadder().hostVersion, 'activation-fixture');
  fs.rmSync(host);
  assert.notEqual(client.tierLadder().hostVersion, 'activation-fixture', 'the answer now comes from the host the lookup finds next (FGOS_HOST_BIN)');

  const gone = script('named-host.sh', 'exit 0');
  const named = createSeatBindingClient({ hostBin: gone });
  fs.rmSync(gone);
  expectCode(() => named.tierLadder(), 'seat-binding-no-host-binary');
});

test('outside an activated release (a checkout, the dev door) FGOS_HOST_BIN is honoured', () => {
  const { project } = activatedProject();
  const resolved = resolveSeatBindingHost({ cwd: project, fgosDir: path.join(project, '.fgos'), payloadRoot: REPO_ROOT });
  assert.equal(path.resolve(resolved.bin), path.resolve(HOST_BIN));
  assert.equal(resolved.activated, false);
});
