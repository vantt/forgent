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
import { loaderOptions } from '../event-store/phase07-fixture.mjs';
import { checkIdentityMachineId, checkIdentityProjectId, fixIdentityMachineId } from '../../src/setup/identity-checks.mjs';

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

  const first = fixIdentityMachineId(root, { stateRoot: state, loaderOptions });
  assert.equal(first.changed, true);
  const id = fs.readFileSync(path.join(state, 'machine-id'), 'utf8').trim();
  const present = checkIdentityMachineId(root, { hostBin: HOST });
  assert.equal(present.passed, true);
  assert.match(present.message, new RegExp(`^machine ${id}, handle `));

  const second = fixIdentityMachineId(root, { stateRoot: state, loaderOptions });
  assert.equal(second.changed, false);
  assert.equal(fs.readFileSync(path.join(state, 'machine-id'), 'utf8').trim(), id);
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

  const minted = JSON.parse(execFileSync(HOST, ['identity', 'project', '--init', '--json'], { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })).data;
  const present = checkIdentityProjectId(repo, { hostBin: HOST });
  assert.equal(present.passed, true);
  assert.equal(present.message, `project ${minted.id}, handle sample-app`);

  fs.writeFileSync(path.join(repo, '.fgos', 'project.json'), 'not json');
  const broken = checkIdentityProjectId(repo, { hostBin: HOST });
  assert.equal(broken.passed, false);
  assert.match(broken.message, /project-id-unreadable|not a project file/);
});
