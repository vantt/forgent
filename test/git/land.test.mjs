import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { acquireSync, createLockScope } from '../../src/holder-lock/index.mjs';
import { fixture, evidence } from './land-fixture.mjs';
import { createGitLand } from '../../src/git/land.mjs';
test('Land binds actual consumer verification and returns an established receipt after an external ABA', async () => {
  const f = fixture(); try {
    const p = f.port(); const { candidate: c } = await p.prepare({ operationId: 'land', request: f.request });
    // Real consumer command, outside 40/50. The evidence remains the consumer's claim.
    execFileSync(process.execPath, ['-e', "if(require('fs').readFileSync('a','utf8')!=='incoming\\n')process.exit(1)"], { cwd: c.worktree });
    assert.deepEqual(execFileSync('git', ['-C', c.worktree, 'show', '-s', '--format=%P'], { encoding: 'utf8' }).trim().split(' '), [f.request.target, f.request.source]);
    const r = await p.publish(evidence(c)); assert.equal(r.operationId, 'land'); assert.equal(r.consumerSettlement, 'notOwnedByGit'); assert.equal(r.checkout, 'reconciled'); assert.equal(f.git('rev-parse', 'HEAD'), c.candidate);
    assert.deepEqual(await p.publish(evidence(c)), r); p.close();
    f.git('update-ref', f.request.destination, f.request.target);
    assert.deepEqual((await f.port().prepare({ operationId: 'land', request: f.request })).receipt, r);
    assert.equal(f.git('rev-parse', 'HEAD'), f.request.target);
  } finally { f.close(); }
});
test('missing or mismatched verification and dirty candidate never move the target', async () => {
  const f = fixture(); try {
    const p = f.port(); const { candidate: c } = await p.prepare({ operationId: 'verify', request: f.request });
    await assert.rejects(async () => p.publish({}), /missing field/);
    for (const field of ['source', 'target', 'candidate', 'treeDigest', 'evidenceDigest']) await assert.rejects(async () => p.publish({ ...evidence(c), [field]: '' }), /verification-mismatch/);
    fs.writeFileSync(path.join(c.worktree, 'a'), 'changed by verifier');
    await assert.rejects(async () => p.publish(evidence(c)), /candidate-dirty/);
    assert.equal(f.git('rev-parse', 'HEAD'), f.request.target);
  } finally { f.close(); }
});
test('dirty non-overlapping main is tolerated, preserved, and reported lagging', async () => {
  const f = fixture(); try {
    fs.writeFileSync(path.join(f.repo, 'b'), 'keep local');
    const p = f.port(); const { candidate: c } = await p.prepare({ operationId: 'dirty', request: f.request });
    const r = await p.publish(evidence(c)); assert.equal(r.checkout, 'pending'); assert.equal(f.git('rev-parse', 'HEAD'), c.candidate); assert.equal(fs.readFileSync(path.join(f.repo, 'b'), 'utf8'), 'keep local');
  } finally { f.close(); }
});
test('own paths dirtied during verification refuse publication; declared rename source counts', async () => {
  const f = fixture(); try {
    const p = f.port(); const request = { ...f.request, footprint: ['b'] }; const { candidate: c } = await p.prepare({ operationId: 'own', request });
    f.git('mv', 'b', 'renamed'); await assert.rejects(async () => p.publish(evidence(c)), /main-checkout-dirty-mid-merge/); assert.equal(f.git('rev-parse', 'HEAD'), request.target);
  } finally { f.close(); }
});
test('the same destination stays excluded across consumer verification', async () => {
  const f = fixture(); try {
    const p = f.port(); await p.prepare({ operationId: 'first', request: f.request });
    await assert.rejects(async () => f.port().prepare({ operationId: 'second', request: f.request }), /lock-acquire-unavailable/);
    // Lower locks are free throughout the consumer phase.
    const scope = createLockScope();
    const admin = acquireSync(scope, 'worktree-admin', { fgosDir: path.join(f.repo, '.fgos') }); assert.equal(admin.result, 'acquired');
    const main = acquireSync(scope, 'main-checkout', { fgosDir: path.join(f.repo, '.fgos') }); assert.equal(main.result, 'acquired'); main.handle.release(); admin.handle.release();
  } finally { f.close(); }
});
test('a held custody rank is refused before Land has any effect', async () => {
  const f = fixture(); const h = acquireSync(createLockScope(), 'dispatch-cwd', { fgosDir: path.join(f.repo, '.fgos'), cwd: f.repo }); assert.equal(h.result, 'acquired');
  try { await assert.rejects(async () => f.port().prepare({ operationId: 'order', request: f.request }, [h.handle]), /lock-order-violation/); assert.equal(fs.existsSync(path.join(f.repo, '.fgos/runtime/git-candidates')), false); }
  finally { h.handle.release(); f.close(); }
});
test('M4 consumer settlement identity survives an unknown append acknowledgement', async () => {
  const f = fixture(); try {
    const p = f.port(); const { candidate: c } = await p.prepare({ operationId: 'settle', request: f.request }); const r = await p.publish(evidence(c)); p.close();
    // Work/Event Store must enforce this unique tuple and query it before retry.
    const repoIdentity = JSON.parse(fs.readFileSync(path.join(f.repo, '.git/fgos/git/operations/settle/00000000.json'), 'utf8')).phase.data.repoIdentity;
    const ledger = new Map(); const key = operationId => JSON.stringify([repoIdentity, operationId, 'delivered']);
    ledger.set(key(r.operationId), { mergedSha: r.localEffect.publishedOid, mergedInto: f.request.destination }); // append happened, acknowledgement lost
    const replay = (await f.port().prepare({ operationId: 'settle', request: f.request })).receipt;
    const queried = ledger.get(key(replay.operationId)); assert.equal(queried.mergedSha, c.candidate); assert.equal(ledger.size, 1);
    // Negative control: a fresh settlement identity would duplicate business history.
    const withoutDedup = [queried, { ...queried }]; assert.equal(withoutDedup.length, 2);
  } finally { f.close(); }
});
test('ignored incoming collisions preserve bytes and block before CAS', async () => {
  const f = fixture(); try {
    // The source introduces b/new while main has an ignored untracked directory there.
    f.git('checkout', '-q', 'source'); fs.mkdirSync(path.join(f.repo, 'ignored-dir')); fs.writeFileSync(path.join(f.repo, 'ignored-dir/new'), 'incoming'); f.git('add', 'ignored-dir/new'); f.git('commit', '-qm', 'ignored incoming'); f.request.source = f.git('rev-parse', 'HEAD'); f.git('checkout', '-q', 'trunk');
    fs.writeFileSync(path.join(f.repo, '.git/info/exclude'), 'ignored-dir/\n'); fs.mkdirSync(path.join(f.repo, 'ignored-dir')); fs.writeFileSync(path.join(f.repo, 'ignored-dir/new'), 'keep ignored');
    await assert.rejects(async () => f.port().prepare({ operationId: 'ignored', request: f.request }), /main-checkout-dirty-mid-merge/);
    assert.equal(fs.readFileSync(path.join(f.repo, 'ignored-dir/new'), 'utf8'), 'keep ignored'); assert.equal(f.git('rev-parse', 'HEAD'), f.request.target);
  } finally { f.close(); }
});
test('unattached target lands without touching the main checkout; foreign attached targets refuse', async () => {
  const f = fixture(); try {
    f.git('branch', 'destination', f.request.target); const request = { ...f.request, destination: 'refs/heads/destination', squash: true };
    const p = f.port(); const { candidate: c } = await p.prepare({ operationId: 'unattached', request }); const r = await p.publish(evidence(c)); assert.equal(r.checkout, 'notApplicable'); assert.equal(f.git('rev-parse', 'HEAD'), request.target); assert.equal(f.git('rev-parse', request.destination), c.candidate);
    f.git('worktree', 'add', '-q', path.join(f.temp, 'foreign'), 'destination');
    await assert.rejects(async () => f.port().prepare({ operationId: 'foreign', request: { ...request, target: c.candidate } }), /foreign-target-checkout/);
  } finally { f.close(); }
});
test('candidate transforms are frozen before verification and staged tampering is refused', async () => {
  const f = fixture(); try {
    const p = f.port(); const request = { ...f.request, files: [{ path: 'decision.txt', bytes: [...Buffer.from('declared bytes')] }] };
    const { candidate: c } = await p.prepare({ operationId: 'bytes', request }); assert.equal(fs.readFileSync(path.join(c.worktree, 'decision.txt'), 'utf8'), 'declared bytes');
    fs.writeFileSync(path.join(c.worktree, 'decision.txt'), 'after verification'); execFileSync('git', ['-C', c.worktree, 'add', 'decision.txt']); await assert.rejects(async () => p.publish(evidence(c)), /candidate-dirty/); assert.equal(f.git('rev-parse', 'HEAD'), request.target);
  } finally { f.close(); }
});
test('unresolved target attempts never replay a CAS, even at the old tip', async () => {
  const f = fixture(); try {
    const p = f.port(); const { candidate: c } = await p.prepare({ operationId: 'unknown', request: f.request }); await p.publish(evidence(c)); p.close();
    // Drop only the terminal record to model a lost outcome acknowledgement.
    const wal = path.join(f.repo, '.git/fgos/git/operations/unknown'); const records = fs.readdirSync(wal).filter(n => /^\d{8}\.json$/.test(n)).sort(); assert.equal(JSON.parse(fs.readFileSync(path.join(wal, records.at(-1)), 'utf8')).phase.phase, 'outcome'); fs.unlinkSync(path.join(wal, records.at(-1)));
    f.git('update-ref', f.request.destination, f.request.target);
    await assert.rejects(async () => f.port().prepare({ operationId: 'unknown', request: f.request }), /land-recovery-required/); assert.equal(f.git('rev-parse', 'HEAD'), f.request.target);
  } finally { f.close(); }
});
test('Land materializes tracked non-event store bytes stripped by worker allocation before verification', async () => {
  const f = fixture(); try {
    fs.mkdirSync(path.join(f.repo, '.fgos'), { recursive: true }); fs.writeFileSync(path.join(f.repo, '.fgos/config.json'), '{"base":true}\n'); f.git('add', '.fgos/config.json'); f.git('commit', '-qm', 'non-event store config'); f.request.target = f.git('rev-parse', 'HEAD');
    const p = f.port(); const request = { ...f.request, files: [{ path: '.fgos/config.json', bytes: [...Buffer.from('{"candidate":true}\n')] }] }; const { candidate: c } = await p.prepare({ operationId: 'store-bytes', request });
    assert.equal(fs.readFileSync(path.join(c.worktree, '.fgos/config.json'), 'utf8'), '{"candidate":true}\n'); assert.equal((await p.publish(evidence(c))).checkout, 'reconciled');
  } finally { f.close(); }
});
test('a conflict aborts only the operation candidate and preserves both refs and main bytes', async () => {
  const f = fixture(); try {
    fs.writeFileSync(path.join(f.repo, 'a'), 'divergent main\n'); f.git('commit', '-qam', 'divergent target'); f.request.target = f.git('rev-parse', 'HEAD');
    await assert.rejects(async () => f.port().prepare({ operationId: 'conflict', request: f.request }), /land-conflict-aborted/);
    assert.equal(f.git('rev-parse', 'HEAD'), f.request.target); assert.equal(f.git('rev-parse', 'source'), f.request.source); assert.equal(fs.readFileSync(path.join(f.repo, 'a'), 'utf8'), 'divergent main\n'); assert.equal(fs.existsSync(path.join(f.repo, '.git/MERGE_HEAD')), false);
    const candidates = path.join(f.repo, '.fgos/runtime/git-candidates'); for (const name of fs.readdirSync(candidates)) assert.equal(execFileSync('git', ['-C', path.join(candidates, name), 'status', '--porcelain'], { encoding: 'utf8' }), '');
  } finally { f.close(); }
});
test('missing footprint fails safe while a return subtree leaves unrelated dirt alone', async () => {
  const f = fixture(); try {
    fs.writeFileSync(path.join(f.repo, 'b'), 'keep outside subtree');
    await assert.rejects(async () => f.port().prepare({ operationId: 'no-footprint', request: { ...f.request, footprint: null } }), /main-checkout-dirty-mid-merge/);
    const p = f.port(); const { candidate: c } = await p.prepare({ operationId: 'subtree', request: { ...f.request, footprint: null, subtree: 'a' } }); assert.equal((await p.publish(evidence(c))).checkout, 'pending'); assert.equal(fs.readFileSync(path.join(f.repo, 'b'), 'utf8'), 'keep outside subtree');
  } finally { f.close(); }
});
test('an ignored store collision publishes once with a pending checkout and preserves its local bytes', async () => {
  const f = fixture(); try {
    f.git('checkout', '-q', 'source'); fs.mkdirSync(path.join(f.repo, '.fgos'), { recursive: true }); fs.writeFileSync(path.join(f.repo, '.fgos/config.json'), '{"incoming":true}'); f.git('add', '.fgos/config.json'); f.git('commit', '-qm', 'incoming non-event config'); f.request.source = f.git('rev-parse', 'HEAD'); f.git('checkout', '-q', 'trunk');
    fs.writeFileSync(path.join(f.repo, '.git/info/exclude'), '.fgos/\n'); fs.writeFileSync(path.join(f.repo, '.fgos/config.json'), 'keep local config');
    const p = f.port(); const { candidate: c } = await p.prepare({ operationId: 'ignored-store', request: f.request }); assert.equal((await p.publish(evidence(c))).checkout, 'pending'); assert.equal(f.git('rev-parse', 'HEAD'), c.candidate); assert.equal(fs.readFileSync(path.join(f.repo, '.fgos/config.json'), 'utf8'), 'keep local config');
    const walDir = path.join(f.repo, '.git/fgos/git/operations/ignored-store');
    assert.match(fs.readFileSync(path.join(walDir, fs.readdirSync(walDir).filter(x => /^\d+\.json$/.test(x)).sort().at(-1)), 'utf8'), /pendingStoreCollision/);
  } finally { f.close(); }
});
test('a dirty file obstructing an incoming directory belongs to the clean gate', async () => {
  const f = fixture(); try {
    f.git('checkout', '-q', 'source'); fs.mkdirSync(path.join(f.repo, 'incoming-dir')); fs.writeFileSync(path.join(f.repo, 'incoming-dir/file'), 'incoming'); f.git('add', 'incoming-dir/file'); f.git('commit', '-qm', 'incoming directory'); f.request.source = f.git('rev-parse', 'HEAD'); f.git('checkout', '-q', 'trunk'); fs.writeFileSync(path.join(f.repo, 'incoming-dir'), 'keep obstructing bytes');
    await assert.rejects(async () => f.port().prepare({ operationId: 'obstruction', request: f.request }), /main-checkout-dirty-mid-merge/); assert.equal(f.git('rev-parse', 'HEAD'), f.request.target); assert.equal(fs.readFileSync(path.join(f.repo, 'incoming-dir'), 'utf8'), 'keep obstructing bytes');
  } finally { f.close(); }
});
test('staged modification and addition outside the footprint survive in index and worktree', async () => {
  const f = fixture(); try {
    fs.writeFileSync(path.join(f.repo, 'b'), 'staged b\n');
    fs.writeFileSync(path.join(f.repo, 'newstaged'), 'staged new\n');
    f.git('add', 'b', 'newstaged');
    const before = f.git('diff', '--cached', '--', 'b', 'newstaged');
    const p = f.port(); const { candidate: c } = await p.prepare({ operationId: 'staged', request: f.request });
    assert.equal((await p.publish(evidence(c))).checkout, 'pending');
    assert.equal(f.git('diff', '--cached', '--', 'b', 'newstaged'), before);
    assert.equal(fs.readFileSync(path.join(f.repo, 'b'), 'utf8'), 'staged b\n');
    assert.equal(fs.readFileSync(path.join(f.repo, 'newstaged'), 'utf8'), 'staged new\n');
  } finally { f.close(); }
});
test('staged overlap refuses before CAS', async () => {
  const f = fixture(); try {
    const p = f.port(); const { candidate: c } = await p.prepare({ operationId: 'overlap', request: f.request });
    fs.writeFileSync(path.join(f.repo, 'a'), 'local staged\n'); f.git('add', 'a');
    await assert.rejects(async () => p.publish(evidence(c)), /main-checkout-dirty-mid-merge/);
    assert.equal(f.git('rev-parse', 'HEAD'), f.request.target);
    assert.equal(f.git('show', ':a'), 'local staged');
  } finally { f.close(); }
});
test('abandoned prepare never blocks a fresh identity and remains recoverable', async () => {
  const f = fixture(); try {
    const first = f.port(); await first.prepare({ operationId: 'abandoned', request: f.request }); first.close();
    const second = f.port(); const { candidate: c } = await second.prepare({ operationId: 'fresh', request: f.request });
    assert.equal((await second.publish(evidence(c))).checkout, 'reconciled'); second.close();
    const records = fs.readdirSync(path.join(f.repo, '.git/fgos/git/operations/abandoned')).filter(x => /^\d+\.json$/.test(x)).sort();
    assert.match(fs.readFileSync(path.join(f.repo, '.git/fgos/git/operations/abandoned', records.at(-1)), 'utf8'), /abandonedBeforeAttempt/);
    assert.equal(f.port().recover({ operationId: 'abandoned' }).receipt.localEffect.publicationState, 'notPublished');
  } finally { f.close(); }
});
test('terminal replay bypasses a busy destination slot', async () => {
  const f = fixture(); try {
    const p = f.port(); const { candidate: c } = await p.prepare({ operationId: 'finished', request: f.request });
    const receipt = await p.publish(evidence(c)); p.close();
    f.git('reset', '--hard', f.request.target);
    await f.port().prepare({ operationId: 'holding', request: f.request });
    assert.deepEqual((await f.port().prepare({ operationId: 'finished', request: f.request })).receipt, receipt);
  } finally { f.close(); }
});

test('Land refuses a caller-owned merge slot before creating a candidate or moving either tip', async () => {
  const f = fixture();
  const acquired = acquireSync(createLockScope('legacy-land-caller'), 'merge-slot', {
    fgosDir: path.join(f.repo, '.fgos'), ref: encodeURIComponent('trunk'),
  });
  assert.equal(acquired.result, 'acquired');
  try {
    const sourceBefore = f.git('rev-parse', 'source');
    await assert.rejects(async () => f.port().prepare({ operationId: 'caller-slot', request: f.request }, [acquired.handle]), /land-slot-already-held/);
    assert.equal(f.git('rev-parse', 'trunk'), f.request.target);
    assert.equal(f.git('rev-parse', 'source'), sourceBefore);
    assert.equal(fs.existsSync(path.join(f.repo, '.fgos/runtime/git-candidates')), false);
  } finally { acquired.handle.release(); f.close(); }
});

test('Land refuses an ephemeral checkout as its repository handle before creating another candidate', async () => {
  const f = fixture();
  try {
    const ephemeral = path.join(f.temp, 'legacy-merge-checkout');
    f.git('worktree', 'add', '-q', '--detach', ephemeral, f.request.target);
    const p = createGitLand({ ...f.options, repoPath: ephemeral }, f.loader);
    try {
      await assert.rejects(async () => p.prepare({ operationId: 'ephemeral-caller', request: f.request }), /land-main-handle-required/);
      assert.equal(f.git('rev-parse', 'trunk'), f.request.target);
      assert.equal(fs.existsSync(path.join(f.repo, '.fgos/runtime/git-candidates')), false);
      assert.equal(execFileSync('git', ['-C', ephemeral, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), f.request.target);
    } finally { p.close(); }
  } finally { f.close(); }
});

test('prepare pins the current destination after source catchup and replay retains that binding', async () => {
  const f = fixture();
  try {
    // Catchup's target was the original request.target; a sibling lands before prepare.
    fs.writeFileSync(path.join(f.repo, 'b'), 'sibling landed\n');
    f.git('commit', '-qam', 'sibling');
    const currentTarget = f.git('rev-parse', 'HEAD');
    const { target: _catchupTarget, ...request } = f.request;
    const p = f.port();
    const { candidate: c } = await p.prepare({ operationId: 'current-target', request });
    assert.equal(c.target, currentTarget);
    assert.equal(fs.readFileSync(path.join(c.worktree, 'b'), 'utf8'), 'sibling landed\n');
    assert.equal(fs.readFileSync(path.join(c.worktree, 'a'), 'utf8'), 'incoming\n');
    assert.deepEqual(execFileSync('git', ['-C', c.worktree, 'show', '-s', '--format=%P'], { encoding: 'utf8' }).trim().split(' '), [currentTarget, request.source]);
    const receipt = await p.publish(evidence(c));
    p.close();
    f.git('update-ref', request.destination, f.request.target);
    assert.deepEqual((await f.port().prepare({ operationId: 'current-target', request })).receipt, receipt);
    assert.equal(f.git('rev-parse', 'HEAD'), f.request.target);
    await assert.rejects(async () => f.port().prepare({ operationId: 'current-target', request: { ...request, message: 'different request' } }), /operation-id-reused/);
  } finally { f.close(); }
});

test('declared candidate bytes resolve only the exact covered conflicts before verification', async () => {
  const f = fixture();
  try {
    fs.writeFileSync(path.join(f.repo, 'a'), 'target disagreement\n');
    f.git('commit', '-qam', 'divergent target');
    const request = { ...f.request, target: f.git('rev-parse', 'HEAD'), files: [{ path: 'a', bytes: [...Buffer.from('consumer resolved\n')] }] };
    const p = f.port();
    const { candidate: c } = await p.prepare({ operationId: 'declared-resolution', request });
    assert.equal(fs.readFileSync(path.join(c.worktree, 'a'), 'utf8'), 'consumer resolved\n');
    assert.equal(execFileSync('git', ['-C', c.worktree, 'diff', '--name-only', '--diff-filter=U'], { encoding: 'utf8' }), '');
    assert.equal(fs.existsSync(path.join(f.repo, '.git/MERGE_HEAD')), false);
    assert.equal(f.git('rev-parse', 'HEAD'), request.target);
    assert.equal(f.git('rev-parse', 'source'), request.source);
    assert.equal((await p.publish(evidence(c))).localEffect.publishedOid, c.candidate);
  } finally { f.close(); }
});

test('an uncovered conflict is aborted even when another path has declared resolution bytes', async () => {
  const f = fixture();
  try {
    fs.writeFileSync(path.join(f.repo, 'a'), 'target disagreement\n');
    f.git('commit', '-qam', 'divergent target');
    const request = { ...f.request, target: f.git('rev-parse', 'HEAD'), files: [{ path: 'b', bytes: [...Buffer.from('unrelated declaration\n')] }] };
    await assert.rejects(async () => f.port().prepare({ operationId: 'uncovered-resolution', request }), /land-conflict-aborted/);
    assert.equal(f.git('rev-parse', 'HEAD'), request.target);
    assert.equal(fs.readFileSync(path.join(f.repo, 'a'), 'utf8'), 'target disagreement\n');
    assert.equal(fs.readFileSync(path.join(f.repo, 'b'), 'utf8'), 'base\n');
    assert.equal(f.git('rev-parse', 'source'), request.source);
  } finally { f.close(); }
});


test('prepare waits only for its own full destination slot and pins the target after admission', async () => {
  const f = fixture();
  const holderModule = pathToFileURL(path.resolve('src/holder-lock/index.mjs')).href;
  const script = String.raw`
    import { acquireSync, createLockScope } from ${JSON.stringify(holderModule)};
    import { execFileSync } from 'node:child_process';
    import fs from 'node:fs';
    import path from 'node:path';
    const repo = process.argv[1];
    const acquired = acquireSync(createLockScope('land-wait-holder'), 'merge-slot', {
      fgosDir: path.join(repo, '.fgos'), ref: encodeURIComponent('refs/heads/trunk'),
    });
    if (acquired.result !== 'acquired') throw new Error('holder admission failed');
    process.stdout.write('held\n');
    process.stdin.once('data', () => setTimeout(() => {
      try {
        fs.writeFileSync(path.join(repo, 'b'), 'landed during admission\n');
        execFileSync('git', ['commit', '-qam', 'sibling under destination slot'], { cwd: repo, stdio: 'pipe' });
      } finally { acquired.handle.release(); process.stdin.destroy(); }
    }, 500));
  `;
  const child = spawn(process.execPath, ['--input-type=module', '-e', script, f.repo], { stdio: ['pipe', 'pipe', 'pipe'] });
  let errors = '';
  child.stderr.on('data', data => { errors += data; });
  const exited = new Promise(resolve => child.once('exit', (code, signal) => resolve({ code, signal })));
  try {
    await new Promise((resolve, reject) => {
      child.stdout.once('data', data => data.toString().includes('held') ? resolve() : reject(new Error(data.toString())));
      child.once('error', reject);
      child.once('exit', code => reject(new Error(`holder exited ${code}: ${errors}`)));
    });
    const { target: _oldTarget, ...request } = f.request;
    await assert.rejects(async () => f.port().prepare({ operationId: 'no-wait-held', request }), /lock-acquire-unavailable/);
    child.stdin.write('release after commit');
    const p = f.port();
    const { candidate: c } = await p.prepare({ operationId: 'wait-for-target', request, waitMs: 5000 });
    assert.equal(c.target, f.git('rev-parse', 'HEAD'));
    assert.notEqual(c.target, f.request.target);
    assert.equal(fs.readFileSync(path.join(c.worktree, 'b'), 'utf8'), 'landed during admission\n');
    assert.equal(fs.readFileSync(path.join(c.worktree, 'a'), 'utf8'), 'incoming\n');
    assert.equal((await exited).code, 0, errors);
  } finally {
    if (child.exitCode === null) child.kill('SIGKILL');
    await exited;
    f.close();
  }
});

test('untracked verification output never blocks publication of the frozen candidate', async () => {
  const f = fixture(); try {
    const p = f.port(); const { candidate: c } = await p.prepare({ operationId: 'untracked-output', request: f.request });
    fs.writeFileSync(path.join(c.worktree, 'build-artifact.txt'), 'built by setup\n');
    const receipt = await p.publish(evidence(c));
    assert.equal(receipt.localEffect.publishedOid, c.candidate);
    assert.equal(f.git('ls-tree', '--name-only', c.candidate, 'build-artifact.txt'), '');
  } finally { f.close(); }
});
test('a Land waiting for admission keeps its process running, so a session closed in the same process admits it within the budget', async () => {
  const f = fixture(); try {
    const first = f.port(); const { candidate: held } = await first.prepare({ operationId: 'in-process-holder', request: f.request });
    let ticks = 0; const ticker = setInterval(() => { ticks += 1; }, 20);
    setTimeout(() => first.close(), 300);
    try {
      const second = f.port(); const { candidate: c } = await second.prepare({ operationId: 'in-process-waiter', request: f.request, waitMs: 5000 });
      assert.equal(c.target, held.target);
      assert.ok(ticks >= 5, `the event loop ran while the Land waited (${ticks} ticks)`);
      second.close();
    } finally { clearInterval(ticker); }
  } finally { f.close(); }
});
