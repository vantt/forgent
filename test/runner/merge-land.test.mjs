import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fixture } from '../git/land-fixture.mjs';
import { mergeRootIntoMainCas } from '../../src/runner/merge.mjs';

function rootFixture() {
  const f = fixture();
  f.git('branch', '-m', 'trunk', 'main');
  return f;
}

test('root publication verifies the frozen Land candidate and returns its exact receipt', async () => {
  const f = rootFixture();
  try {
    const result = await mergeRootIntoMainCas(f.repo, {
      id: 'source', verify: `node -e "if(require('fs').readFileSync('a','utf8')!=='incoming\\n')process.exit(1)"`,
    }, 'source', { ownFileSet: new Set(['a']) });
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
    const result = await mergeRootIntoMainCas(f.repo, { id: 'source', verify: 'exit 7' }, 'source');
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
    const result = await mergeRootIntoMainCas(f.repo, { id: 'source', verify: 'true' }, 'source');
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
    await assert.rejects(mergeRootIntoMainCas(f.repo, { id: 'source', verify: command }, 'source'), /land-target-changed/);
    assert.equal(f.git('rev-parse', 'main'), f.request.source);
    assert.equal(f.git('rev-parse', 'source'), f.request.source);
  } finally { f.close(); }
});

test('root verification reuse requires the actual candidate tree to equal the returned source', async () => {
  const f = rootFixture();
  try {
    const result = await mergeRootIntoMainCas(f.repo, {
      id: 'source', verify: 'exit 9', branchHeadAtReturn: f.request.source,
    }, 'source');
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
