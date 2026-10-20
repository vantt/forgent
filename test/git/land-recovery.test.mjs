import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fixture, evidence } from './land-fixture.mjs';
import { acquireSync, createLockScope } from '../../src/holder-lock/index.mjs';

test('recovery abandons an unattempted Land and a fresh identity can land', () => {
  const f = fixture(); try {
    const p = f.port(); const { candidate } = p.prepare({ operationId: 'abandoned', request: f.request }); p.close();
    const { receipt, warnings } = f.port().recover({ operationId: 'abandoned' });
    assert.equal(receipt.localEffect.publicationState, 'notPublished'); assert.deepEqual(warnings, []);
    assert.equal(f.git('rev-parse', 'HEAD'), f.request.target);
    assert.equal(fs.existsSync(candidate.worktree), true);
    const fresh = f.port(); const c = fresh.prepare({ operationId: 'fresh', request: f.request }).candidate;
    assert.equal(fresh.publish(evidence(c)).checkout, 'reconciled');
  } finally { f.close(); }
});
test('durable receipt recovery retains candidate and pins until explicit consumer acknowledgement', () => {
  const f = fixture(); try {
    const p = f.port(); const { candidate: c } = p.prepare({ operationId: 'settled', request: f.request });
    const receipt = p.publish(evidence(c)); p.close();
    const recovery = f.port(); assert.deepEqual(recovery.recover({ operationId: 'settled' }), { receipt, warnings: [] });
    assert.equal(fs.existsSync(c.worktree), true); assert.match(f.git('for-each-ref', '--format=%(refname)', 'refs/fgos/git-operations/settled'), /candidate/);
    assert.throws(() => recovery.recover({ operationId: 'settled', consumerAcknowledgement: '' }), /acknowledgement-required/);
    const result = recovery.recover({ operationId: 'settled', consumerAcknowledgement: 'durable-consumer-ledger-entry' });
    assert.deepEqual(result, { receipt, warnings: [] }); assert.equal(fs.existsSync(c.worktree), false);
    assert.equal(f.git('for-each-ref', '--format=%(refname)', 'refs/fgos/git-operations/settled'), '');
    assert.equal(fs.existsSync(path.join(f.repo, '.git/fgos/git/operations/settled')), false);
    assert.deepEqual(recovery.recover({ operationId: 'settled' }), { receipt, warnings: [] });
    assert.deepEqual(f.port().prepare({ operationId: 'settled', request: f.request }).receipt, receipt);
    assert.throws(() => f.port().prepare({ operationId: 'settled', request: { ...f.request, message: 'reused' } }), /operation-id-reused/);
  } finally { f.close(); }
});
test('dirty candidate cleanup is deferred with a warning and preserves successful Land', () => {
  const f = fixture(); try {
    const p = f.port(); const c = p.prepare({ operationId: 'dirty-cleanup', request: f.request }).candidate; const receipt = p.publish(evidence(c)); p.close();
    fs.writeFileSync(path.join(c.worktree, 'valuable'), 'preserve me');
    const result = f.port().recover({ operationId: 'dirty-cleanup', consumerAcknowledgement: 'durable-ledger' });
    assert.deepEqual(result.receipt, receipt); assert.match(result.warnings.join(), /cleanup-deferred/);
    assert.equal(fs.readFileSync(path.join(c.worktree, 'valuable'), 'utf8'), 'preserve me');
    assert.equal(f.git('rev-parse', 'HEAD'), c.candidate);
  } finally { f.close(); }
});
test('live session and higher held rank exclude recovery', () => {
  const f = fixture(); try {
    const p = f.port(); p.prepare({ operationId: 'live', request: f.request });
    assert.throws(() => f.port().recover({ operationId: 'live' }), /lock-acquire-unavailable/); p.close();
    const lease = acquireSync(createLockScope(), 'dispatch-cwd', { fgosDir: path.join(f.repo, '.fgos'), cwd: f.repo });
    try { assert.throws(() => f.port().recover({ operationId: 'live' }, [lease.handle]), /lock-order-violation/); }
    finally { lease.handle.release(); }
  } finally { f.close(); }
});

test('a SIGKILL during consumer verification releases authority; Node recovery and a fresh Land succeed', async () => {
  const { spawn } = await import('node:child_process');
  const { once } = await import('node:events');
  const f = fixture();
  const moduleUrl = new URL('../../src/git/index.mjs', import.meta.url).href;
  const child = spawn(process.execPath, ['--input-type=module', '-e', `
    import { createGitLand } from ${JSON.stringify(moduleUrl)};
    process.on('message', ({ options, loader, request }) => {
      try { const port = createGitLand(options, loader); globalThis.session = port;
        process.send(port.prepare({ operationId: 'killed-verifier', request }));
      } catch (error) { process.send({ error: String(error) }); }
    });
  `], { stdio: ['ignore', 'ignore', 'pipe', 'ipc'] });
  try {
    const ready = once(child, 'message'); child.send({ options: f.options, loader: f.loader, request: f.request });
    const [message] = await ready; assert.equal(message.error, undefined);
    const exited = once(child, 'exit'); child.kill('SIGKILL'); const [, signal] = await exited; assert.equal(signal, 'SIGKILL');
    const fresh = f.port(); const c = fresh.prepare({ operationId: 'after-kill', request: f.request }).candidate;

    assert.equal(fresh.publish(evidence(c)).checkout, 'reconciled');
    const receipt = f.port().recover({ operationId: 'killed-verifier' }).receipt;
    assert.equal(receipt.localEffect.publicationState, 'notPublished');
  } finally { if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL'); f.close(); }
});

test('a missing receipt at next is observed-only through Node and keeps that attribution after cleanup', () => {
  const f = fixture(); try {
    const p = f.port(); const c = p.prepare({ operationId: 'observed', request: f.request }).candidate;
    p.publish(evidence(c)); p.close();
    // Keep the real effect but model loss before its final receipt install.
    // Rust's SIGKILL matrix produces this same shape from the real performer.
    const wal = path.join(f.repo, '.git/fgos/git/operations/observed');
    const names = fs.readdirSync(wal).filter(n => /^\d{8}\.json$/.test(n)).sort();
    const last = path.join(wal, names.at(-1)); assert.equal(JSON.parse(fs.readFileSync(last)).phase.phase, 'outcome'); fs.unlinkSync(last);
    const recovery = f.port(); const { receipt } = recovery.recover({ operationId: 'observed' });
    assert.equal(receipt.attribution, 'effectObservedOnly'); assert.equal(receipt.localEffect.publicationState, 'currentlyAtCandidate'); assert.equal(receipt.localEffect.publishedOid, undefined);
    assert.deepEqual(recovery.recover({ operationId: 'observed', consumerAcknowledgement: 'durable-entry' }), { receipt, warnings: [] });
    assert.deepEqual(f.port().prepare({ operationId: 'observed', request: f.request }).receipt, receipt);
    assert.equal(f.git('rev-parse', 'HEAD'), c.candidate);
  } finally { f.close(); }
});

test('even a dangling native index lock names inspected repair before publication', () => {
  const f = fixture(); try {
    fs.symlinkSync('missing-owned-evidence', path.join(f.repo, '.git/index.lock'));
    assert.throws(() => f.port().prepare({ operationId: 'locked', request: f.request }), /native-index-lock-unowned: inspect with repairNativeIndexLock; follow Git spec §11 retained index.lock runbook/);
    assert.equal(f.git('rev-parse', 'HEAD'), f.request.target);
    assert.equal(fs.lstatSync(path.join(f.repo, '.git/index.lock')).isSymbolicLink(), true);
  } finally { f.close(); }
});
