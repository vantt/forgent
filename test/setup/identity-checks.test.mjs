// identity-checks.test.mjs -- the doctor row and the setup fix of the machine
// id. The id's shape is owned by the Rust crate (packages/identity/rust/tests);
// this file proves only the wiring: warn when absent, mint once on --fix,
// pass with the id and handle afterwards, never replace. The project id row
// warns when absent, has no fix, and passes once `identity project --init` ran.
import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { checkIdentityIdsUnique, checkIdentityMachineId, checkIdentityMachineKey, checkIdentityPinnedMachines, checkIdentityProjectId, checkIdentitySharedDirectory, checkIdentitySshKeygen, fixIdentityMachineId, fixIdentityMachineKey } from '../../src/setup/identity-checks.mjs';

const HOST = process.env.FGOS_HOST_BIN;

function withStateRoot(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-identity-checks-'));
  const state = path.join(root, 'state');
  fs.mkdirSync(state, { mode: 0o700 });
  const saved = process.env.FGOS_STATE_ROOT;
  process.env.FGOS_STATE_ROOT = state;
  t.after(() => {
    if (saved === undefined) delete process.env.FGOS_STATE_ROOT; else process.env.FGOS_STATE_ROOT = saved;
    fs.rmSync(root, { recursive: true, force: true });
  });
  return { root, state };
}

test('warns while no machine id exists, mints once on fix, then passes without replacing it', (t) => {
  assert.ok(HOST && fs.existsSync(HOST), 'set FGOS_HOST_BIN to a host built from this checkout');
  const { root, state } = withStateRoot(t);
  const absent = checkIdentityMachineId(root, { hostBin: HOST });
  assert.equal(absent.passed, true);
  assert.match(absent.message, /^warning: no machine id minted yet; run `fgos doctor --fix`/);

  const first = fixIdentityMachineId(root, { stateRoot: state });
  assert.equal(first.changed, true);
  const id = fs.readFileSync(path.join(state, 'machine-id'), 'utf8').trim();
  const present = checkIdentityMachineId(root, { hostBin: HOST });
  assert.equal(present.passed, true);
  assert.match(present.message, new RegExp(`^machine ${id}, handle `));

  const second = fixIdentityMachineId(root, { stateRoot: state });
  assert.equal(second.changed, false);
  assert.equal(fs.readFileSync(path.join(state, 'machine-id'), 'utf8').trim(), id);
});

test('minting resolves a state root beneath symlinked ancestors to its canonical directory', (t) => {
  const { root, state } = withStateRoot(t);
  const linked = path.join(root, 'linked-state');
  fs.symlinkSync(state, linked);
  assert.equal(fixIdentityMachineId(root, { stateRoot: path.join(linked, 'nested') }).changed, true);
  assert.equal(fixIdentityMachineId(root, { stateRoot: path.join(linked, 'nested') }).changed, false);
  assert.match(fs.readFileSync(path.join(state, 'nested/machine-id'), 'utf8'), /^[a-z0-9-]+\n$/);
});

test('key row warns while no key exists, mints once on fix, then shows the fingerprint without replacing the key', (t) => {
  assert.ok(HOST && fs.existsSync(HOST), 'set FGOS_HOST_BIN to a host built from this checkout');
  const { root, state } = withStateRoot(t);
  assert.match(checkIdentityMachineKey(root, { hostBin: HOST }).message, /^warning: no machine id minted yet, so no machine signing key/);
  fixIdentityMachineId(root, { stateRoot: state });
  const absent = checkIdentityMachineKey(root, { hostBin: HOST });
  assert.equal(absent.passed, true);
  assert.match(absent.message, /^warning: no machine signing key can be read; run `fgos doctor --fix`/);

  const first = fixIdentityMachineKey(root, { stateRoot: state });
  assert.equal(first.changed, true, first.message);
  const present = checkIdentityMachineKey(root, { hostBin: HOST });
  assert.equal(present.passed, true);
  assert.match(present.message, /^machine signing key SHA256:/);

  const key = fs.readFileSync(path.join(state, 'identity', 'machine-key'), 'utf8');
  assert.equal(fixIdentityMachineKey(root, { stateRoot: state }).changed, false);
  assert.equal(fs.readFileSync(path.join(state, 'identity', 'machine-key'), 'utf8'), key);
});

test('ssh-keygen row passes on this machine and fails for a missing tool, an old OpenSSH or an unreadable version', () => {
  assert.equal(checkIdentitySshKeygen().passed, true);
  const probe = (keygen, versionText) => () => ({ keygen, versionText });
  assert.match(checkIdentitySshKeygen({ probe: probe(false, '') }).message, /^ssh-keygen is not installed/);
  assert.match(checkIdentitySshKeygen({ probe: probe(true, 'OpenSSH_8.0p1, OpenSSL 1.1.1') }).message, /^OpenSSH 8\.0 is older than 8\.1/);
  assert.deepEqual(checkIdentitySshKeygen({ probe: probe(true, 'OpenSSH_8.1p1, OpenSSL 1.1.1') }), { passed: true, message: 'OpenSSH 8.1' });
  assert.equal(checkIdentitySshKeygen({ probe: probe(true, 'OpenSSH_10.2p1 Ubuntu') }).passed, true);
  assert.match(checkIdentitySshKeygen({ probe: probe(true, 'something else') }).message, /cannot read the OpenSSH version/);
});

test('pinned-machines row lists what the host reports and always passes', (t) => {
  assert.ok(HOST && fs.existsSync(HOST), 'set FGOS_HOST_BIN to a host built from this checkout');
  const { root, state } = withStateRoot(t);
  assert.deepEqual(checkIdentityPinnedMachines(root, { hostBin: HOST }), { passed: true, message: 'no machine pinned yet' });
  fs.mkdirSync(path.join(state, 'identity', 'pins'), { recursive: true });
  fs.writeFileSync(path.join(state, 'identity', 'pins', 'peer-abc234'), JSON.stringify({
    v: 1, machineId: 'peer-abc234', publicKey: 'ssh-ed25519 AAAA', fingerprint: 'SHA256:abc', firstSeen: '2026-10-23T00:00:00.000Z',
  }));
  assert.deepEqual(checkIdentityPinnedMachines(root, { hostBin: HOST }), { passed: true, message: '1 pinned (1 seen, not yet confirmed: peer-abc234): peer-abc234 SHA256:abc' });
  fs.writeFileSync(path.join(state, 'identity', 'pins', 'peer-abc234'), JSON.stringify({
    v: 1, machineId: 'peer-abc234', publicKey: 'ssh-ed25519 AAAA', fingerprint: 'SHA256:abc', firstSeen: '2026-10-23T00:00:00.000Z', state: 'confirmed', confirmedAt: '2026-10-24T00:00:00.000Z',
  }));
  assert.deepEqual(checkIdentityPinnedMachines(root, { hostBin: HOST }), { passed: true, message: '1 pinned (all confirmed): peer-abc234 SHA256:abc' });
});

test('fails when the machine id file is not a valid id', (t) => {
  assert.ok(HOST && fs.existsSync(HOST), 'set FGOS_HOST_BIN to a host built from this checkout');
  const { root, state } = withStateRoot(t);
  fs.writeFileSync(path.join(state, 'machine-id'), 'NOT VALID\n');
  const result = checkIdentityMachineId(root, { hostBin: HOST });
  assert.equal(result.passed, false);
  assert.match(result.message, /machine-id-unreadable|invalid machine id/);
});

test('project id row warns while the repository has none, passes after the explicit mint, fails on a broken file', (t) => {
  assert.ok(HOST && fs.existsSync(HOST), 'set FGOS_HOST_BIN to a host built from this checkout');
  const { root } = withStateRoot(t);
  const repo = path.join(root, 'sample-app');
  fs.mkdirSync(repo);
  execFileSync('/usr/bin/git', ['init', '-q'], { cwd: repo });

  const absent = checkIdentityProjectId(repo, { hostBin: HOST });
  assert.equal(absent.passed, true);
  assert.match(absent.message, /^warning: no project id yet; run `fgos identity project --init` once on one machine, commit, pull elsewhere/);

  // boundary: the row reads what the host prints, so the mint it reads must come from the host's own verb (the crate tests own the mint rules)
  const minted = JSON.parse(execFileSync(HOST, ['identity', 'project', '--init', '--json'], { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })).data;
  const present = checkIdentityProjectId(repo, { hostBin: HOST });
  assert.equal(present.passed, true);
  assert.equal(present.message, `project ${minted.id}, handle sample-app`);

  fs.writeFileSync(path.join(repo, '.fgos', 'project.json'), 'not json');
  const broken = checkIdentityProjectId(repo, { hostBin: HOST });
  assert.equal(broken.passed, false);
  assert.match(broken.message, /project-id-unreadable|not a project file/);
});

test('shared-directory row reads only the cache: passes with counts, warns on dropped, foreign and shared-handle entries', (t) => {
  const { root } = withStateRoot(t);
  const repo = path.join(root, 'shared-dir');
  fs.mkdirSync(path.join(repo, '.fgos', 'cache'), { recursive: true });
  assert.deepEqual(checkIdentitySharedDirectory(repo), { passed: true, message: 'no shared directory yet' });
  fs.writeFileSync(path.join(repo, '.fgos', 'project.json'), JSON.stringify({ v: 1, projectId: 'p1', handle: 'demo' }));
  const cacheFile = path.join(repo, '.fgos', 'cache', 'identity-directory.json');
  assert.equal(checkIdentitySharedDirectory(repo).message, 'no shared directory yet', 'a clone with no cache yet');
  const entry = (id, projectId, handle) => ({ id: `${id}/s`, projectId, machine: { id, handle } });
  const write = (entries, dropped) => fs.writeFileSync(cacheFile, JSON.stringify({ v: 1, fetchedAt: '2026-10-24T03:00:00.000Z', entries, dropped, verified: [] }));

  write([entry('alpha-aaaaaa', 'p1', 'alpha'), entry('beta-bbbbbb', 'p1', 'beta')], []);
  assert.deepEqual(checkIdentitySharedDirectory(repo), { passed: true, message: '2 machine(s), 2 entries, fetched 2026-10-24T03:00:00.000Z' });

  write([entry('alpha-aaaaaa', 'p2', 'alpha'), entry('beta-bbbbbb', 'p1', 'beta-bbbbbb')], [{ reason: 'key-changed', machineId: 'gamma-cccccc' }]);
  const warned = checkIdentitySharedDirectory(repo);
  assert.equal(warned.passed, true);
  assert.match(warned.message, /^warning: 2 machine\(s\), 2 entries/);
  assert.match(warned.message, /1 dropped \(key-changed from gamma-cccccc\)/);
  assert.match(warned.message, /1 of another project \(p2\)/);
  assert.match(warned.message, /machine handle shared, shown by id: beta-bbbbbb/);

  fs.writeFileSync(cacheFile, 'not json');
  assert.equal(checkIdentitySharedDirectory(repo).message, 'no shared directory yet', 'an unreadable cache is rebuilt by the next read, not reported');
});

test('ids row passes on a clean registry and names each repeated id, title clash and file number', (t) => {
  const { root } = withStateRoot(t);
  const repo = path.join(root, 'registry');
  fs.mkdirSync(path.join(repo, 'docs/specs'), { recursive: true });
  fs.mkdirSync(path.join(repo, 'docs/decisions'));
  const backlog = (ids) => ['| ID | Story |', '|----|-------|', ...ids.map((id) => `| ${id} | a story |`)].join('\n');
  fs.writeFileSync(path.join(repo, 'docs/backlog.md'), backlog(['p-4f2a7qzb3x', 'STR27']));
  // The same decision recorded in two areas, under the same short title, is one decision.
  fs.writeFileSync(path.join(repo, 'docs/specs/a.md'), '### D-ADR0070 (guide and ledger) -- text\n');
  fs.writeFileSync(path.join(repo, 'docs/specs/b.md'), '### D-ADR0070 (guide and ledger) -- other words\n#### Not a decision: D-ADR0071\n');
  fs.writeFileSync(path.join(repo, 'docs/decisions/0001-one.md'), '# one\n');
  const clean = checkIdentityIdsUnique(repo);
  assert.deepEqual(clean, { passed: true, message: '2 backlog ids, 1 D-ADR numbers and 1 decision files, none repeated' });

  fs.writeFileSync(path.join(repo, 'docs/backlog.md'), backlog(['p-4f2a7qzb3x', 'p-4f2a7qzb3x']));
  fs.writeFileSync(path.join(repo, 'docs/specs/b.md'), '### D-ADR0070 (a different decision)\n');
  fs.writeFileSync(path.join(repo, 'docs/decisions/0001-two.md'), '# two\n');
  const broken = checkIdentityIdsUnique(repo);
  assert.equal(broken.passed, false);
  assert.match(broken.message, /backlog id p-4f2a7qzb3x is used by more than one row/);
  assert.match(broken.message, /D-ADR0070 is headed with different titles/);
  assert.match(broken.message, /decision file number 0001 is used by more than one file/);
  assert.match(broken.message, /fgos identity mint/);
});
