// dispatch-confinement-machine-private.test.mjs — machine-private roots (spec section 9.3): a
// directory listed in MACHINE_PRIVATE_ROOTS is masked for every confined dispatch, whatever its
// hostRead. The pure side: the list, the resolver, the refusal and the argv order. The proof that a
// real worker cannot read it is the harness probe `machine-private-hidden` (real bwrap), run below.

import '../helpers/process-tmp-root.mjs';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import cp from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { assessBwrap, prepareBwrap, CONFINED_MARKER_ENV } from '../../src/runner/dispatch/confinement/drivers/bwrap.mjs';
import { buildConfinementRequest } from '../../src/runner/dispatch/confinement/request.mjs';
import {
  MACHINE_PRIVATE_ROOTS,
  resolveConfinementResources,
  resolveMachinePrivateRoots,
} from '../../src/runner/dispatch/confinement/resources.mjs';
import { BUILTIN_POLICY_IDS, resolveConfinementPolicy } from '../../src/runner/dispatch/confinement/policies.mjs';
import { computeProbeFingerprint, probeMachinePrivateHidden } from '../../src/runner/dispatch/confinement/probes/harness.mjs';
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';

const HAS_WORKING_BWRAP = os.platform() === 'linux'
  && cp.spawnSync('/usr/bin/bwrap', ['--ro-bind', '/', '/', '--', 'true'], { stdio: 'ignore' }).status === 0;

const fixtures = [];
after(() => {
  for (const dir of fixtures) fs.rmSync(dir, { recursive: true, force: true });
});

/** A host home with (or without) the private directory, and a project with the run directory a dispatch needs. */
function makeHost({ withPrivate = true } = {}) {
  const root = fs.realpathSync(makeFixtureDir('fgos-machine-private-'));
  fixtures.push(root);
  const home = path.join(root, 'home');
  const privateDir = path.join(home, '.fgos', 'private');
  fs.mkdirSync(withPrivate ? privateDir : home, { recursive: true });
  const project = path.join(root, 'project');
  const fgosDir = path.join(project, '.fgos');
  const runDir = path.join(fgosDir, 'assignments', 'u1', 'self', '1', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  return { root, home, privateDir, project, fgosDir, runDir, tempRoot: path.join(root, 'confinement-temp') };
}

/** `os.homedir()` is what the driver resolves `{home}` from; point it at the fixture for one call. */
async function withHome(home, fn) {
  const previous = process.env.HOME;
  process.env.HOME = home;
  try {
    return await fn();
  } finally {
    if (previous === undefined) delete process.env.HOME;
    else process.env.HOME = previous;
  }
}

const backendFor = (host) => ({ id: 'bwrap', type: 'bwrap', config: { type: 'bwrap', executable: '/usr/bin/bwrap', tempRoot: host.tempRoot } });

function requestFor(host, { policyId = 'workspace-write', blind = false, cwd = host.project } = {}) {
  return buildConfinementRequest({
    capability: 'code:review',
    executorId: 'bwrap-exec',
    dispatchId: 'disp_self',
    requirement: { mode: 'required', policyId, policy: resolveConfinementPolicy(policyId) },
    ...(blind ? { blind: true } : {}),
    backendId: 'bwrap',
    invocation: { command: 'node', args: ['-e', 'process.exit(0)'], env: {}, adapter: 'herdr-spawn' },
    context: { cwd, repoRoot: cwd, runDir: host.runDir, fgosDir: host.fgosDir },
  });
}

async function prepared(host, options) {
  return withHome(host.home, async () => {
    const request = requestFor(host, options);
    const assessment = assessBwrap(request, backendFor(host));
    assert.deepEqual(assessment.mismatches, []);
    const out = await prepareBwrap({ resources: assessment.resources, coverage: assessment.coverage }, request, backendFor(host));
    const args = out.invocation.args;
    const head = args.slice(0, args.indexOf('--'));
    await out.cleanup();
    return { head, assessment };
  });
}

const indexOfFlag = (head, flag, target) => head.findIndex((arg, i) => arg === flag && head[i + 1] === target);

test('every confined launch sets the one marker variable the Config session class reads, under the same name', async () => {
  const host = makeHost({ withPrivate: false });
  const { head } = await prepared(host, {});
  assert.equal(indexOfFlag(head, '--setenv', CONFINED_MARKER_ENV) > 0 && head[indexOfFlag(head, '--setenv', CONFINED_MARKER_ENV) + 2], '1');
  const rustSource = fs.readFileSync(new URL('../../packages/config/rust/src/session.rs', import.meta.url), 'utf8');
  assert.match(rustSource, new RegExp(`pub const CONFINED_MARKER: &str = "${CONFINED_MARKER_ENV}";`), 'the crate and the driver name the same variable');
});

test('the machine-private roots are data in the contract, first entry the private directory of the host home', () => {
  assert.deepEqual([...MACHINE_PRIVATE_ROOTS], ['{home}/.fgos/private']);
});

test('a machine-private root resolves from the injected home and is skipped when absent or not a directory', () => {
  const host = makeHost();
  assert.deepEqual(resolveMachinePrivateRoots({ homeDir: host.home }), [host.privateDir]);

  const without = makeHost({ withPrivate: false });
  assert.deepEqual(resolveMachinePrivateRoots({ homeDir: without.home }), []);

  const asFile = makeHost({ withPrivate: false });
  fs.mkdirSync(path.join(asFile.home, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(asFile.home, '.fgos', 'private'), 'a file, not a directory');
  assert.deepEqual(resolveMachinePrivateRoots({ homeDir: asFile.home }), []);
});

test('the resolver yields a machine-private hidden-root for a non-blind request, and none when the host has no such directory', () => {
  const host = makeHost();
  const grants = [{ resource: 'run-output', access: 'write', scope: 'dispatch' }];
  const context = { cwd: host.project, repoRoot: host.project, runDir: host.runDir, fgosDir: host.fgosDir };
  const resolve = (homeDir, extra = {}) => resolveConfinementResources({ dispatchId: 'disp_self', context, grants, backendConfig: { tempRoot: host.tempRoot }, homeDir, ...extra });

  const hidden = resolve(host.home).filter((r) => r.resource === 'hidden-root');
  assert.equal(hidden.length, 1);
  assert.equal(hidden[0].hostTarget, host.privateDir);
  assert.equal(hidden[0].machinePrivate, true);
  assert.equal(hidden[0].delivery, 'mask');

  const without = makeHost({ withPrivate: false });
  assert.equal(resolve(without.home).some((r) => r.resource === 'hidden-root'), false);

  // A root that blind would hide too is listed once: here the confinement temp root is the private directory.
  const blind = resolveConfinementResources({
    dispatchId: 'disp_self', context, grants, backendConfig: { tempRoot: host.privateDir }, homeDir: host.home, blind: true,
  }).filter((r) => r.resource === 'hidden-root' && r.hostTarget === host.privateDir);
  assert.equal(blind.length, 1);
});

for (const policyId of BUILTIN_POLICY_IDS) {
  test(`${policyId}: the private directory is masked after the mounts and remounted read-only after the attempt binds, without a blind override`, async (t) => {
    if (!HAS_WORKING_BWRAP) return t.skip('working bwrap backend not available');
    const host = makeHost();
    const { head } = await prepared(host, { policyId });
    const mask = indexOfFlag(head, '--tmpfs', host.privateDir);
    const remount = indexOfFlag(head, '--remount-ro', host.privateDir);
    const lastMount = Math.max(...head.map((arg, i) => ((arg === '--bind' || arg === '--ro-bind') && i > 6 ? i : -1)));
    assert.ok(mask > 0 && remount > mask, 'masked, then remounted read-only');
    assert.ok(lastMount < mask, 'every mount comes before the mask');
    assert.deepEqual(head.slice(-2), ['--remount-ro', host.privateDir], 'the read-only remount is last');
    assert.equal(head.includes('--unshare-pid'), true, 'every launch has its pid namespace');
  });

  test(`${policyId}: with no private directory on the host the argv has no mask at all`, async (t) => {
    if (!HAS_WORKING_BWRAP) return t.skip('working bwrap backend not available');
    const host = makeHost({ withPrivate: false });
    const { head } = await prepared(host, { policyId });
    assert.equal(head.includes('--remount-ro'), false);
    assert.deepEqual(head.filter((arg, i) => head[i - 1] === '--tmpfs'), ['/tmp'], 'the only tmpfs is the private /tmp');
  });
}

test('a blind dispatch masks the private directory with its own roots and keeps the blind order', async (t) => {
  if (!HAS_WORKING_BWRAP) return t.skip('working bwrap backend not available');
  const host = makeHost();
  fs.mkdirSync(path.join(host.fgosDir, 'dispatch-runs'), { recursive: true });
  const { head } = await prepared(host, { blind: true });
  const own = path.join(host.fgosDir, 'assignments', 'u1', 'self', '1');
  const masks = [host.privateDir, path.join(host.fgosDir, 'dispatch-runs')].map((m) => indexOfFlag(head, '--tmpfs', m));
  assert.ok(masks.every((i) => i > 0), 'the private directory and the blind roots are all masked');
  assert.ok(Math.max(...masks) < indexOfFlag(head, '--ro-bind', own), 'masks come before the own directory');
  assert.ok(indexOfFlag(head, '--remount-ro', host.privateDir) > indexOfFlag(head, '--ro-bind', own), 'remount-ro comes last');
});

test('a workspace, cwd or repo root inside a machine-private root is refused before launch, blind or not', async () => {
  const host = makeHost();
  const inside = path.join(host.privateDir, 'worktree');
  fs.mkdirSync(inside, { recursive: true });
  for (const blind of [false, true]) {
    const mismatches = await withHome(host.home, () => assessBwrap(requestFor(host, { blind, cwd: inside }), backendFor(host)).mismatches);
    const codes = mismatches.map((m) => m.code);
    assert.ok(codes.includes('machine-private-hides-workspace'), `refused with blind=${blind}: ${JSON.stringify(mismatches)}`);
    assert.equal(codes.includes('blind-hides-workspace'), false, 'the blind refusal does not repeat the machine-private one');
  }
  const ok = await withHome(host.home, () => assessBwrap(requestFor(host), backendFor(host)).mismatches);
  assert.deepEqual(ok, []);
});

test('the probe fingerprint carries the digest of the list, so a changed list refreshes every proof', () => {
  const fingerprint = computeProbeFingerprint({ policy: { a: 1 } });
  assert.match(fingerprint.machinePrivate, /^[0-9a-f]{64}$/);
});

test('the machine-private probe passes on the real argv and its falsifier reads the planted files without the mask', (t) => {
  if (!HAS_WORKING_BWRAP) return t.skip('working bwrap backend not available');
  for (const blind of [false, true]) {
    const run = (brokenConfig) => {
      // The scratch directory sits under /tmp on purpose: the probe must not let the sandbox's empty /tmp hide the file for it.
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-mp-probe-'));
      try {
        return probeMachinePrivateHidden({ bwrapBin: '/usr/bin/bwrap', scratchDir: dir, blind, brokenConfig });
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    };
    const good = run(false);
    assert.equal(good.passed, true, good.detail);
    assert.equal(good.probe, 'machine-private-hidden');
    const broken = run(true);
    assert.equal(broken.passed, false, 'the falsifier must read the planted files');
    assert.match(broken.detail, /"accounts":"ok"/);
    assert.match(broken.detail, /"token":"ok"/);
    assert.match(broken.detail, /host-write-denied/);
    assert.match(broken.detail, /workspace-write/);
    if (blind) assert.match(broken.detail, /\+blind/);
  }
});
