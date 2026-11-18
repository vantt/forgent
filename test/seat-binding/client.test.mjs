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
import { bind as facadeBind, explainSeat } from '../../src/runner/execution/bind.mjs';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';
import { seedStubAgentClis } from '../helpers/agent-clis.mjs';
import { MODEL_POLICY_TIERS } from '../../src/runner/dispatch/config.mjs';
import { enterHotLock } from '../../src/holder-lock/hot-guard.mjs';

seedFileLocalBwrapRegistry();
seedStubAgentClis('pi');

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

const SEAT_RUNNER = {
  defaults: { tier: 'standard' },
  modelPolicies: { alpha: { standard: 'alpha-m' } },
  capabilities: { 'docs:write': { prefer: [{ executor: 'alpha' }] } },
  executors: {
    alpha: {
      kind: 'agent',
      providerModel: 'alpha',
      invocations: [{ id: 'alpha-cli', via: 'cli', adapter: 'cli-spawn', command: 'pi', confinement: { backend: 'bwrap' } }],
    },
  },
};
const SEAT_ASK = { unit: { id: 'u', capability: 'docs:write', writes: [] }, role: 'producer' };

test('the facade round trip: a seat binds through the real host with its own version, and the explain answer carries the walk in one call', () => {
  const bound = facadeBind(SEAT_ASK, { runnerConfig: SEAT_RUNNER, session: {} });
  assert.equal(bound.executor, 'alpha');
  assert.equal(bound.model, 'alpha-m');
  assert.match(bound.bindingInput.hostVersion, /^\d+\.\d+\.\d+/);
  const explained = explainSeat(SEAT_ASK, { runnerConfig: SEAT_RUNNER, session: {} });
  assert.equal(explained.binding.executor, 'alpha');
  assert.ok(explained.walk.length >= 1);
  assert.ok(Array.isArray(explained.ranked?.candidates));
});

test('a refused seat comes back as a binding carrying its refusal, not as an exception', () => {
  const refused = facadeBind(SEAT_ASK, { runnerConfig: { ...SEAT_RUNNER, capabilities: { 'docs:write': { prefer: [{ executor: 'ghost' }] } } }, session: {} });
  assert.equal(typeof refused.refused?.reason, 'string');
  assert.equal(typeof refused.refused?.detail, 'string');
});

test('the real host answers digest and preflight over the run snapshot it is sent', () => {
  const client = createSeatBindingClient({ hostBin: HOST_BIN });
  assert.match(client.digest({ runner: SEAT_RUNNER }), /^sha256:[0-9a-f]{64}$/);
  assert.equal(client.digest({ runner: SEAT_RUNNER }), client.digest({ runner: { ...SEAT_RUNNER, executors: {} } }), 'the digest reads only the seat config slice');
  assert.deepEqual(client.preflight({ runner: SEAT_RUNNER, session: {} }), {});
});

test('the tier ladder the host answers is the one the Node config loader reads, six tiers weakest first', () => {
  const ladder = createSeatBindingClient({ hostBin: HOST_BIN }).tierLadder();
  assert.deepEqual(ladder.vocabulary, MODEL_POLICY_TIERS);
  assert.equal(MODEL_POLICY_TIERS.length, 6);
  assert.ok(ladder.hostVersion);
});

test('a request the contract rejects throws seat-binding-route-rejected', () => {
  expectCode(() => createSeatBindingClient({ hostBin: HOST_BIN }).bind({ ask: 'not an ask', runner: SEAT_RUNNER }), 'seat-binding-route-rejected');
});

test('a derivation the host refuses as a model error throws seat-binding-failed carrying the failure', () => {
  const ask = { ...SEAT_ASK, overrides: [{ tier: 'no-such-tier' }] };
  assert.throws(() => createSeatBindingClient({ hostBin: HOST_BIN }).bind({ ask, runner: SEAT_RUNNER }), (err) => err instanceof SeatBindingError && err.code === 'seat-binding-failed' && err.failure.name === 'RunnerConfigError');
});

test('a host that does not know the route throws host-version-mismatch', () => {
  const old = script('old-host.sh', `echo 'fgos: unknown verb "internal". Usage: fgos <command> [args...]' >&2\nexit 4`);
  expectCode(() => createSeatBindingClient({ hostBin: old }).tierLadder(), 'host-version-mismatch');
  expectCode(() => createSeatBindingClient({ hostBin: old }).bind({ ask: SEAT_ASK, runner: SEAT_RUNNER }), 'host-version-mismatch');
  // A request larger than the pipe buffer: the old host exits unread, so writing it fails with EPIPE.
  expectCode(() => createSeatBindingClient({ hostBin: old }).bind({ ask: SEAT_ASK, runner: { ...SEAT_RUNNER, padding: 'x'.repeat(1 << 20) } }), 'host-version-mismatch');
});

test('an older host that answers a usage error for the protocol or the op throws host-version-mismatch', () => {
  const usage = script('usage-host.sh', `cat >/dev/null\necho '{"v":1,"protocol":1,"hostVersion":"1","op":"explain","result":"error","code":"usage","message":"unknown operation explain"}'\nexit 2`);
  expectCode(() => createSeatBindingClient({ hostBin: usage }).explain({ ask: SEAT_ASK, runner: SEAT_RUNNER }), 'host-version-mismatch');
});

test('a host speaking another protocol throws host-version-mismatch', () => {
  const other = script('other-protocol.sh', `cat >/dev/null\necho '{"v":1,"protocol":1,"hostVersion":"9.9.9","op":"ladder","result":"ok","ladder":{"vocabulary":[]}}'`);
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
  expectCode(() => createSeatBindingClient({ hostBin: noDecision }).bind({ ask: SEAT_ASK, runner: SEAT_RUNNER }), 'seat-binding-route-bad-output');
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
    expectCode(() => createSeatBindingClient({ hostBin: host }).bind({ ask: SEAT_ASK, runner: SEAT_RUNNER }), 'seat-binding-in-lock');
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
  expectCode(() => client.bind({ ask: SEAT_ASK, runner: SEAT_RUNNER }), 'seat-binding-route-bad-output');
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
