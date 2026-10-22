import '../helpers/process-tmp-root.mjs';
// The state transaction: confined paths, revocation, async refusal, reentry,
// and the record the fast path writes. Real files in a temp .fgos; no host
// binary is needed because nothing here has to clean a dead holder.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { withStateTx, hotPaths, readHotRecord, HotLockError } from '../../src/state/hot-lock.mjs';
import { readEvents } from '../../src/state/events.mjs';

function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-hot-tx-'));
  const fgosDir = path.join(dir, '.fgos');
  fs.mkdirSync(fgosDir, { recursive: true });
  return { dir, fgosDir, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

const writer = { writer: 'tx-test' };

test('the record is the full process tuple while held, and the file is gone after release', () => {
  const f = fixture();
  try {
    const { record } = hotPaths(f.fgosDir);
    let seen;
    withStateTx(f.fgosDir, () => { seen = readHotRecord(record); }, { prefetched: writer });
    assert.equal(seen.state, 'ok');
    assert.equal(seen.record.v, 1);
    assert.equal(seen.record.pid, process.pid);
    assert.equal(seen.record.writer, 'tx-test');
    if (process.platform === 'linux') {
      for (const field of ['startTime', 'bootId', 'pidNs']) assert.ok(seen.record[field], `record.${field}`);
    }
    assert.equal(readHotRecord(record).state, 'absent');
  } finally {
    f.cleanup();
  }
});

test('bare transactions refuse appends without a consumer and revoke every write after release', async () => {
  const f = fixture();
  try {
    let kept;
    withStateTx(f.fgosDir, tx => {
      assert.throws(() => tx.append({ type: 'work.add' }), { code: 'state-tx-consumer-required' });
      kept = tx;
    }, { prefetched: writer });
    assert.throws(() => kept.append({ type: 'work.add' }), { code: 'state-tx-revoked' });
    assert.throws(() => kept.writeJson(path.join(f.fgosDir, 'late.json'), {}), { code: 'state-tx-revoked' });
    assert.equal(fs.existsSync(path.join(f.fgosDir, 'late.json')), false);
  } finally { f.cleanup(); }
});

test('the transaction refuses paths outside its .fgos and passes prefetched facts through', () => {
  const f = fixture();
  try {
    withStateTx(f.fgosDir, (tx) => {
      assert.equal(tx.mainFgosDir, '/main/.fgos');
      assert.equal(tx.head, 'abc123');
      assert.equal(tx.writer, 'tx-test');
      for (const outside of [path.join(f.dir, 'elsewhere.json'), path.join(f.fgosDir, '..', 'x.json'), f.fgosDir]) {
        assert.throws(() => tx.writeJson(outside, {}), (err) => err.code === 'state-tx-path-outside', outside);
        assert.throws(() => tx.readJson(outside), (err) => err.code === 'state-tx-path-outside', outside);
        assert.throws(() => tx.unlink(outside), (err) => err.code === 'state-tx-path-outside', outside);
      }
      const inside = path.join(f.fgosDir, 'runtime', 'a.json');
      tx.writeJson(inside, { ok: true });
      assert.deepEqual(tx.readJson(inside), { ok: true });
      assert.equal(tx.unlink(inside), true);
      assert.equal(tx.readJson(inside), null);
    }, { prefetched: { mainFgosDir: '/main/.fgos', head: 'abc123', writer: 'tx-test' } });
  } finally {
    f.cleanup();
  }
});

test('an async callback is refused after the lock is already released', () => {
  const f = fixture();
  try {
    const { record } = hotPaths(f.fgosDir);
    assert.throws(
      () => withStateTx(f.fgosDir, async () => 1, { prefetched: writer }),
      (err) => err instanceof HotLockError && err.code === 'state-tx-async',
    );
    assert.equal(readHotRecord(record).state, 'absent');
  } finally {
    f.cleanup();
  }
});

test('a nested transaction throws hot-lock-reentry at once, not after the wait', () => {
  const f = fixture();
  try {
    const { record } = hotPaths(f.fgosDir);
    const startedAt = Date.now();
    assert.throws(
      () => withStateTx(f.fgosDir, () => withStateTx(f.fgosDir, () => 1, { prefetched: writer }), { prefetched: writer }),
      (err) => err.code === 'hot-lock-reentry',
    );
    assert.ok(Date.now() - startedAt < 500, 'reentry must not wait out the lock timeout');
    assert.equal(readHotRecord(record).state, 'absent', 'the outer lock is released on the throw');

    // A different resource is a reentry too: one hot mutex at a time per process.
    assert.throws(
      () => withStateTx(f.fgosDir, () => withStateTx(f.fgosDir, () => 1, { resource: 'porting-events', prefetched: writer }), { prefetched: writer }),
      (err) => err.code === 'hot-lock-reentry',
    );
  } finally {
    f.cleanup();
  }
});

test('a thrown callback releases the lock and rethrows its own error', () => {
  const f = fixture();
  try {
    const { record } = hotPaths(f.fgosDir);
    assert.throws(() => withStateTx(f.fgosDir, () => { throw new RangeError('boom'); }, { prefetched: writer }), RangeError);
    assert.equal(readHotRecord(record).state, 'absent');
    assert.equal(withStateTx(f.fgosDir, () => 'again', { prefetched: writer }), 'again');
  } finally {
    f.cleanup();
  }
});

test('prefetched read roots allow gated reference reads without granting writes', () => {
  const f = fixture();
  const refs = path.join(f.dir, 'refs');
  fs.mkdirSync(refs);
  const head = path.join(refs, 'head');
  fs.writeFileSync(head, 'branch-tip');
  try {
    withStateTx(f.fgosDir, tx => {
      assert.equal(tx.readText(head), 'branch-tip');
      assert.throws(() => tx.writeText(head, 'changed'), { code: 'state-tx-path-outside' });
      assert.throws(() => tx.unlink(head), { code: 'state-tx-path-outside' });
    }, { prefetched: { readRoots: [refs] } });
  } finally { fs.rmSync(f.dir, { recursive: true, force: true }); }
});
