// Wiring of the mint door: what Node adds on top of the Identity verb. The id rules (length,
// alphabet, uniqueness, sequence claims and their races) are proven where they live, in
// packages/identity/rust/tests/mint.rs.
import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { mintWorkId } from '../../src/util/identity-mint.mjs';
import { WriterIdentityError } from '../../src/util/session-identity.mjs';
import { noteLockHeld, noteLockReleased } from '../../src/util/state-lock-held.mjs';
import { addWork, listWork } from '../../src/state/store.mjs';

const HOST_BIN = process.env.FGOS_HOST_BIN;
const needsHost = { skip: HOST_BIN ? false : 'FGOS_HOST_BIN is not set' };

test('a minted work id is accepted by the store and differs from the next one', needsHost, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-mint-door-'));
  const [first, second] = [mintWorkId({ bin: HOST_BIN }), mintWorkId({ bin: HOST_BIN })];
  assert.match(first, /^tsk-[a-z2-7]{10}$/);
  assert.notEqual(first, second);
  addWork(path.join(dir, '.fgos'), {
    id: first, title: 'minted', description: 'minted', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true',
  });
  assert.equal(listWork(path.join(dir, '.fgos')).work[first].title, 'minted');
});

test('minting refuses while a state lock is held, before any host is run', () => {
  noteLockHeld();
  try {
    assert.throws(
      // A host that cannot exist: reaching it would be a different error than the refusal.
      () => mintWorkId({ bin: '/nonexistent/fgos' }),
      (err) => err instanceof WriterIdentityError && err.code === 'identity-in-lock',
    );
  } finally {
    noteLockReleased();
  }
});

test('a host that cannot be run is a host-missing error, never a guessed id', () => {
  assert.throws(
    // boundary: the mint door runs the host binary; this one does not exist.
    () => mintWorkId({ bin: '/nonexistent/fgos' }),
    (err) => err instanceof WriterIdentityError && err.code === 'host-missing',
  );
});

test('the verb claims consecutive D-ADR numbers on a repository without a remote', needsHost, () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-mint-adr-'));
  // boundary: a real repository is the only place the counter ref can be written.
  execFileSync('/usr/bin/git', ['init', '-q', '--initial-branch=main', repo], { stdio: 'ignore' });
  fs.mkdirSync(path.join(repo, 'docs/specs'), { recursive: true });
  fs.writeFileSync(path.join(repo, 'docs/specs/area.md'), '### D-ADR0072 (an existing decision)\n');
  // boundary: the verb is the unit under test and runs in the repository whose counter it writes.
  const claim = () => JSON.parse(execFileSync(HOST_BIN, ['identity', 'mint', 'd-adr', '--json'], {
    cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  })).data;
  assert.deepEqual(claim(), { kind: 'd-adr', id: 'D-ADR0073', number: 73 });
  assert.deepEqual(claim(), { kind: 'd-adr', id: 'D-ADR0074', number: 74 });
});
