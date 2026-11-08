import '../helpers/process-tmp-root.mjs';
import { initFixtureRepo } from '../helpers/git-fixture.mjs';
import { initializeWorkRepository } from '../helpers/work-store-release.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { computeKnowledgeProjection } from '../../src/report/knowledge-projection.mjs';
import { knowledgeFindings } from '../../src/report/knowledge-lints.mjs';
import { listWork } from '../../src/state/store.mjs';
import { initStore, registerTopicStore, registerDocStore, supersedeDocStore, moveDocPathStore } from '../../src/state/store.mjs';

const fgosBin = path.resolve('bin/fgos.mjs');

function setupGitRepoWithStore() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-knowledge-lints-'));
  initFixtureRepo(tmpDir);
  const fgosDir = path.join(tmpDir, '.fgos');
  initStore(fgosDir);
  return { tmpDir, fgosDir };
}

const findingsOf = (tmpDir, fgosDir, options = {}) => knowledgeFindings(listWork(fgosDir), { root: tmpDir, ...options });
const lint = (findings, id) => findings.find((f) => f.lint === id);

test('knowledge projection - computeKnowledgeProjection generates expected structure', () => {
  const view = {
    topics: {
      t1: { topicId: 't1', purposeTitle: 'Test Topic', purposeSlug: 'test-topic', status: 'active' }
    },
    docs: {
      't1:guide': { docId: 't1:guide', topicId: 't1', role: 'guide', currentPath: 'docs/test/guide.md', docLifecycle: 'active', aliases: ['docs/test/old-guide.md'] }
    }
  };

  const { jsonContent, mdContent } = computeKnowledgeProjection(view);
  const parsed = JSON.parse(jsonContent);
  assert.equal(parsed.topics.length, 1);
  assert.equal(parsed.docs.length, 1);
  assert.ok(mdContent.includes('generated: true'));
  assert.ok(mdContent.includes('Test Topic'));
  assert.ok(mdContent.includes('docs/test/guide.md'));
  assert.ok(mdContent.includes('docs/test/old-guide.md'));
});

// boundary: the verb's own wiring (flag parsing, exit code, nothing written) is the thing proved, so the CLI is spawned.
test('doc-registry --check refuses a missing or stale projection, passes a fresh one, and never writes', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-doc-registry-check-'));
  try {
    const fgosDir = initializeWorkRepository(tmpDir);
    initStore(fgosDir);
    registerTopicStore(fgosDir, { topicId: 't1', purposeSlug: 'test-topic' });
    registerDocStore(fgosDir, { docId: 't1:guide', topicId: 't1', role: 'guide', currentPath: 'docs/test/guide.md', docLifecycle: 'active' });
    const check = () => spawnSync('node', [fgosBin, 'doc-registry', '--check', '--json'], { cwd: tmpDir, encoding: 'utf8' });

    const absent = check();
    assert.equal(absent.status, 4, absent.stderr); // validation refusal, as decision-index --check
    assert.match(absent.stderr + absent.stdout, /stale/);
    assert.equal(fs.existsSync(path.join(tmpDir, 'docs/doc-registry.md')), false, '--check must not write');

    execFileSync('node', [fgosBin, 'doc-registry'], { cwd: tmpDir });
    const fresh = check();
    assert.equal(fresh.status, 0, fresh.stderr);

    fs.appendFileSync(path.join(tmpDir, 'docs/doc-registry.md'), 'hand edit\n');
    assert.equal(check().status, 4);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

// boundary: proves `knowledge status` carries the lint answer next to its counts, through the real verb.
test('knowledge status reports the lint findings next to the unchanged counts and exits 0', () => {
  const { tmpDir, fgosDir } = setupGitRepoWithStore();
  try {
    registerTopicStore(fgosDir, { topicId: 't1', purposeSlug: 'test-topic' });
    registerDocStore(fgosDir, { docId: 't1:guide', topicId: 't1', role: 'guide', currentPath: 'docs/test/guide.md', docLifecycle: 'active' });
    const res = spawnSync('node', [fgosBin, 'knowledge', 'status', '--json'], { cwd: tmpDir, encoding: 'utf8' });
    assert.equal(res.status, 0, res.stderr);
    const out = JSON.parse(res.stdout);
    const data = out.data ?? out;
    assert.equal(data.totalDocs, 1);
    assert.equal(data.docs.active, 1);
    assert.ok(lint(data.findings, 'doc-current-path-missing'), 'a live doc not committed at HEAD is a finding');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge lints - a clean registry has no findings', () => {
  const { tmpDir, fgosDir } = setupGitRepoWithStore();
  try {
    registerTopicStore(fgosDir, { topicId: 't1', purposeSlug: 'test-topic' });
    registerDocStore(fgosDir, { docId: 't1:guide', topicId: 't1', role: 'guide', currentPath: 'docs/test/guide.md', docLifecycle: 'active', sourceCaptureIds: ['docs/test/guide.md'] });
    const docFile = path.join(tmpDir, 'docs/test/guide.md');
    fs.mkdirSync(path.dirname(docFile), { recursive: true });
    fs.writeFileSync(docFile, '# Guide\n', 'utf8');
    execFileSync('git', ['add', 'docs/test/guide.md'], { cwd: tmpDir });
    execFileSync('git', ['commit', '-m', 'add guide'], { cwd: tmpDir, stdio: 'ignore' });
    const findings = findingsOf(tmpDir, fgosDir);
    assert.deepEqual(findings.filter((f) => f.lint !== 'doc-role-underused'), []);
    assert.equal(lint(findings, 'doc-role-underused').level, 'warn', 'underused roles inform, they do not fail');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge lints - doc-current-path-missing fails when a live doc\'s currentPath is not committed at HEAD', () => {
  const { tmpDir, fgosDir } = setupGitRepoWithStore();
  try {
    registerTopicStore(fgosDir, { topicId: 't1', purposeSlug: 'test-topic' });
    registerDocStore(fgosDir, { docId: 't1:guide', topicId: 't1', role: 'guide', currentPath: 'docs/test/guide.md', docLifecycle: 'active' });

    const res1 = lint(findingsOf(tmpDir, fgosDir), 'doc-current-path-missing');
    assert.equal(res1.level, 'fail');
    assert.ok(res1.items.some((item) => item.includes('t1:guide')));

    const docFile = path.join(tmpDir, 'docs/test/guide.md');
    fs.mkdirSync(path.dirname(docFile), { recursive: true });
    fs.writeFileSync(docFile, '# Guide\n', 'utf8');
    execFileSync('git', ['add', 'docs/test/guide.md'], { cwd: tmpDir });
    execFileSync('git', ['commit', '-m', 'add guide'], { cwd: tmpDir, stdio: 'ignore' });

    assert.equal(lint(findingsOf(tmpDir, fgosDir), 'doc-current-path-missing'), undefined);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge lints - doc-source-unreachable fails when a path-shaped sourceCaptureIds entry resolves nowhere', () => {
  const { tmpDir, fgosDir } = setupGitRepoWithStore();
  try {
    registerTopicStore(fgosDir, { topicId: 't1', purposeSlug: 'test-topic' });
    registerDocStore(fgosDir, {
      docId: 't1:guide', topicId: 't1', role: 'guide', currentPath: 'docs/test/guide.md', docLifecycle: 'active',
      sourceCaptureIds: ['docs/test/guide.md', 'docs/gone/nowhere.md'],
    });

    const res = lint(findingsOf(tmpDir, fgosDir), 'doc-source-unreachable');
    assert.equal(res.level, 'fail');
    assert.ok(res.items.some((item) => item.includes('docs/gone/nowhere.md')));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge lints - doc-source-unreachable passes when every path-shaped source is the doc\'s own current or alias path', () => {
  const { tmpDir, fgosDir } = setupGitRepoWithStore();
  try {
    registerTopicStore(fgosDir, { topicId: 't1', purposeSlug: 'test-topic' });
    registerDocStore(fgosDir, {
      docId: 't1:guide', topicId: 't1', role: 'guide', currentPath: 'docs/test/guide.md', docLifecycle: 'active',
      sourceCaptureIds: ['docs/test/guide.md'], aliases: ['docs/test/guide-old.md'],
    });

    assert.equal(lint(findingsOf(tmpDir, fgosDir), 'doc-source-unreachable'), undefined);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge lints - doc-source-conservation flags a target doc with no source (empty sourceCaptureIds)', () => {
  const { tmpDir, fgosDir } = setupGitRepoWithStore();
  try {
    registerTopicStore(fgosDir, { topicId: 't1', purposeSlug: 'test-topic' });
    registerDocStore(fgosDir, { docId: 't1:guide', topicId: 't1', role: 'guide', currentPath: 'docs/test/guide.md', docLifecycle: 'active', sourceCaptureIds: [] });

    const res = lint(findingsOf(tmpDir, fgosDir), 'doc-source-conservation');
    assert.equal(res.level, 'fail');
    assert.ok(res.items.some((item) => item.includes('target document has no source')));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge lints - doc-source-conservation flags a duplicate migration-inventory source and a lost one', () => {
  const { tmpDir, fgosDir } = setupGitRepoWithStore();
  try {
    registerTopicStore(fgosDir, { topicId: 't1', purposeSlug: 'test-topic' });
    registerDocStore(fgosDir, { docId: 't1:guide', topicId: 't1', role: 'guide', currentPath: 'docs/test/guide.md', docLifecycle: 'active', sourceCaptureIds: ['docs/test/guide.md'] });

    const reportsDir = path.join(tmpDir, 'docs/history/compound-learn-artifact-registry/reports');
    fs.mkdirSync(reportsDir, { recursive: true });
    const inventory = [
      // duplicate: same oldPath claimed by two rows
      { topicId: 't1', role: 'guide', oldPath: 'docs/dup.md' },
      { topicId: 't2', role: 'guide', oldPath: 'docs/dup.md' },
      // lost: neither on disk nor reachable through the registry
      { topicId: 't3', role: 'guide', oldPath: 'docs/lost.md' },
    ];
    fs.writeFileSync(path.join(reportsDir, 'inventory-data.json'), JSON.stringify(inventory), 'utf8');

    const res = lint(findingsOf(tmpDir, fgosDir), 'doc-source-conservation');
    assert.equal(res.level, 'fail');
    assert.ok(res.items.some((item) => item.includes("inventory source 'docs/dup.md' appears 2 times")));
    assert.ok(res.items.some((item) => item.includes('docs/lost.md')));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge lints - current path, source reachability and conservation all treat a superseded doc as dead, not live', () => {
  // src/report/knowledge-resolver.mjs's own isLive excludes 'superseded' as well as 'retired': a doc.supersede
  // has already moved "current" to supersededBy, so the superseded doc's own currentPath/sourceCaptureIds are
  // frozen history. None of these three lints should flag it because its old file is gone or its old source
  // path is unreachable.
  const { tmpDir, fgosDir } = setupGitRepoWithStore();
  try {
    registerTopicStore(fgosDir, { topicId: 't1', purposeSlug: 'test-topic' });
    registerDocStore(fgosDir, { docId: 't1:guide', topicId: 't1', role: 'guide', currentPath: 'docs/test/guide-old.md', docLifecycle: 'active', sourceCaptureIds: ['docs/test/guide-old.md'] });
    supersedeDocStore(fgosDir, { docId: 't1:guide' });
    // Never commit docs/test/guide-old.md at HEAD, and never leave it reachable through any live doc's alias:
    // exactly the state a real supersede-then-content-merge leaves the old doc in.

    const findings = findingsOf(tmpDir, fgosDir);
    for (const id of ['doc-current-path-missing', 'doc-source-unreachable', 'doc-source-conservation']) {
      assert.equal(lint(findings, id), undefined, `${id} must not flag a superseded doc`);
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge lints - doc-source-conservation does not crash (and just skips the inventory checks) when inventory-data.json is valid JSON but not an array', () => {
  const { tmpDir, fgosDir } = setupGitRepoWithStore();
  try {
    registerTopicStore(fgosDir, { topicId: 't1', purposeSlug: 'test-topic' });
    registerDocStore(fgosDir, { docId: 't1:guide', topicId: 't1', role: 'guide', currentPath: 'docs/test/guide.md', docLifecycle: 'active', sourceCaptureIds: ['docs/test/guide.md'] });

    const reportsDir = path.join(tmpDir, 'docs/history/compound-learn-artifact-registry/reports');
    fs.mkdirSync(reportsDir, { recursive: true });
    // A buggy classifier run writing a single object (or `null`) instead of an array: valid JSON, so the parse
    // itself never throws.
    fs.writeFileSync(path.join(reportsDir, 'inventory-data.json'), JSON.stringify({ not: 'an array' }), 'utf8');

    assert.doesNotThrow(() => findingsOf(tmpDir, fgosDir));
    assert.equal(lint(findingsOf(tmpDir, fgosDir), 'doc-source-conservation'), undefined);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge lints - doc-alias-broken judges the aliases a real Work store folded', () => {
  const { tmpDir, fgosDir } = setupGitRepoWithStore();
  try {
    registerTopicStore(fgosDir, { topicId: 't1', purposeSlug: 'test-topic' });
    registerDocStore(fgosDir, { docId: 't1:guide', topicId: 't1', role: 'guide', currentPath: 'docs/test/old-guide.md', docLifecycle: 'active' });
    moveDocPathStore(fgosDir, { docId: 't1:guide', topicId: 't1', role: 'guide', newPath: 'docs/test/guide.md' });

    assert.equal(lint(findingsOf(tmpDir, fgosDir), 'doc-alias-broken'), undefined);

    // A second live doc taking over the alias string makes it ambiguous.
    registerDocStore(fgosDir, { docId: 't1:other', topicId: 't1', role: 'notes', currentPath: 'docs/test/old-guide.md', docLifecycle: 'active' });
    const res = lint(findingsOf(tmpDir, fgosDir), 'doc-alias-broken');
    assert.equal(res.level, 'fail');
    assert.ok(res.items.some((item) => /docs\/test\/old-guide\.md/.test(item)));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
