import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fixture } from '../git/land-fixture.mjs';
import { landRunnerItem } from '../../src/runner/merge.mjs';

function rootFixture() {
  const f = fixture();
  f.git('branch', '-m', 'trunk', 'main');
  return f;
}

test('root publication verifies the frozen Land candidate and returns its exact receipt', async () => {
  const f = rootFixture();
  try {
    const result = await landRunnerItem(f.repo, {
      id: 'source', verify: `node -e "if(require('fs').readFileSync('a','utf8')!=='incoming\\n')process.exit(1)"`,
    }, { branch: 'source', ownFileSet: new Set(['a']) });
    assert.equal(result.outcome, 'merged', JSON.stringify(result));
    assert.equal(result.check.passed, true);
    assert.equal(result.receipt.localEffect.publishedOid, f.git('rev-parse', 'main'));
    assert.equal(result.receipt.checkout, 'reconciled');
    assert.deepEqual(f.git('show', '-s', '--format=%P', 'main').split(' '), [f.request.target, f.request.source]);
    assert.equal(f.git('status', '--porcelain', '--untracked-files=no'), '');
    // Publication never fabricates a durable Work acknowledgement.
    assert.equal(result.receipt.consumerSettlement, 'notOwnedByGit');
    assert.equal(fs.existsSync(path.join(f.repo, '.git/fgos/git/operations', result.receipt.operationId)), true);
  } finally { f.close(); }
});

test('a red root candidate never changes the destination or source and retains operation evidence', async () => {
  const f = rootFixture();
  try {
    const result = await landRunnerItem(f.repo, { id: 'source', verify: 'exit 7' }, { branch: 'source' });
    assert.equal(result.outcome, 'verify-fail', JSON.stringify(result));
    assert.equal(result.check.status, 7);
    assert.equal(f.git('rev-parse', 'main'), f.request.target);
    assert.equal(f.git('rev-parse', 'source'), f.request.source);
    assert.equal(fs.existsSync(path.join(f.repo, '.git/MERGE_HEAD')), false);
    assert.equal(fs.readdirSync(path.join(f.repo, '.fgos/runtime/git-candidates')).length, 1);
  } finally { f.close(); }
});

test('root construction conflicts preserve both refs and translate the existing conflict outcome', async () => {
  const f = rootFixture();
  try {
    fs.writeFileSync(path.join(f.repo, 'a'), 'divergent main\n'); f.git('commit', '-qam', 'divergence');
    const before = f.git('rev-parse', 'main');
    const result = await landRunnerItem(f.repo, { id: 'source', verify: 'true' }, { branch: 'source' });
    assert.deepEqual(result, { outcome: 'conflict', branch: 'source' });
    assert.equal(f.git('rev-parse', 'main'), before);
    assert.equal(f.git('rev-parse', 'source'), f.request.source);
    assert.equal(fs.readFileSync(path.join(f.repo, 'a'), 'utf8'), 'divergent main\n');
  } finally { f.close(); }
});

test('root publication detects an external destination writer without rerunning verification', async () => {
  const f = rootFixture();
  try {
    // The command writes only the disposable fixture's destination, as a raw
    // external actor; Land must return its stale result and preserve that tip.
    const command = `git -C '${f.repo}' update-ref refs/heads/main ${f.request.source} ${f.request.target}`;
    await assert.rejects(landRunnerItem(f.repo, { id: 'source', verify: command }, { branch: 'source' }), /land-target-changed/);
    assert.equal(f.git('rev-parse', 'main'), f.request.source);
    assert.equal(f.git('rev-parse', 'source'), f.request.source);
  } finally { f.close(); }
});

test('root verification reuse requires the actual candidate tree to equal the returned source', async () => {
  const f = rootFixture();
  try {
    const result = await landRunnerItem(f.repo, {
      id: 'source', verify: 'exit 9', branchHeadAtReturn: f.request.source,
    }, { branch: 'source' });
    assert.equal(result.outcome, 'merged', JSON.stringify(result));
    assert.equal(result.check.skipped, true);
  } finally { f.close(); }
});

test('source catchup verifies before Sync commits and leaves the destination unchanged', async () => {
  const f = rootFixture();
  try {
    const { performCatchUp } = await import('../../src/runner/merge.mjs');
    f.git('branch', 'fgw/source', 'source');
    fs.writeFileSync(path.join(f.repo, 'later'), 'target advance\n'); f.git('add', 'later'); f.git('commit', '-qm', 'later target');
    const target = f.git('rev-parse', 'main');
    const result = await performCatchUp(f.repo, 'source', { id: 'source', verify: 'test -f later' }, 'main', 5000);
    assert.equal(result.outcome, 'merged', JSON.stringify(result));
    assert.equal(f.git('rev-parse', 'main'), target);
    assert.deepEqual(f.git('show', '-s', '--format=%P', 'fgw/source').split(' '), [f.request.source, target]);
    assert.equal(f.git('rev-parse', 'fgw/source'), result.catchupHead);
  } finally { f.close(); }
});

test('a red source catchup aborts Sync without moving source or destination', async () => {
  const f = rootFixture();
  try {
    const { performCatchUp } = await import('../../src/runner/merge.mjs');
    f.git('branch', 'fgw/source', 'source');
    fs.writeFileSync(path.join(f.repo, 'later'), 'target advance\n'); f.git('add', 'later'); f.git('commit', '-qm', 'later target');
    const target = f.git('rev-parse', 'main');
    const result = await performCatchUp(f.repo, 'source', { id: 'source', verify: 'exit 7' }, 'main', 5000);
    assert.equal(result.outcome, 'verify-fail', JSON.stringify(result));
    assert.equal(result.exitStatus, 7);
    assert.equal(f.git('rev-parse', 'main'), target);
    assert.equal(f.git('rev-parse', 'fgw/source'), f.request.source);
  } finally { f.close(); }
});

test('root verification reuse tolerates a pinned target that advanced only on paths the source never touched', async () => {
  const f = rootFixture();
  try {
    fs.writeFileSync(path.join(f.repo, 'disjoint'), 'target only\n'); f.git('add', 'disjoint'); f.git('commit', '-qm', 'disjoint target advance');
    const target = f.git('rev-parse', 'main');
    const result = await landRunnerItem(f.repo, {
      id: 'source', verify: 'exit 9', branchHeadAtReturn: f.request.source,
    }, { branch: 'source' });
    assert.equal(result.outcome, 'merged', JSON.stringify(result));
    assert.equal(result.check.skipped, true);
    assert.deepEqual(f.git('show', '-s', '--format=%P', 'main').split(' '), [target, f.request.source]);
  } finally { f.close(); }
});

function branchCommit(f, branch, from, files) {
  f.git('branch', branch, from);
  const wt = fs.mkdtempSync(path.join(fs.realpathSync(process.env.TMPDIR ?? '/tmp'), 'merge-land-wt-'));
  fs.rmSync(wt, { recursive: true });
  f.git('worktree', 'add', '-q', wt, branch);
  for (const [rel, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(wt, rel)), { recursive: true });
    fs.writeFileSync(path.join(wt, rel), text);
    f.git('-C', wt, 'add', '-f', '--', rel);
  }
  f.git('-C', wt, 'commit', '-qm', `${branch} change`);
  f.git('worktree', 'remove', '--force', wt);
}

test('a branch that writes under .fgos is refused before Land and leaves the destination unchanged', async () => {
  const f = rootFixture();
  try {
    branchCommit(f, 'stray', 'source', { '.fgos/stray.json': '{}\n' });
    const before = f.git('rev-parse', 'main');
    const result = await landRunnerItem(f.repo, { id: 'stray', verify: 'true' }, { branch: 'stray' });
    assert.deepEqual(result, { outcome: 'fgos-write-rejected', paths: ['.fgos/stray.json'], branch: 'stray' });
    assert.equal(f.git('rev-parse', 'main'), before);
    assert.equal(fs.existsSync(path.join(f.repo, '.fgos/runtime/git-candidates')), false);
  } finally { f.close(); }
});
