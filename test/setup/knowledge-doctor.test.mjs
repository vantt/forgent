import '../helpers/process-tmp-root.mjs';
import { initFixtureRepo } from '../helpers/git-fixture.mjs';
import { initializeWorkRepository } from '../helpers/work-store-release.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { computeKnowledgeProjection } from '../../src/report/knowledge-projection.mjs';
import { DOCTOR_CHECKS, createDoctorRun } from '../../src/setup/checks.mjs';
import { initStore, registerTopicStore, registerDocStore, supersedeDocStore, moveDocPathStore } from '../../src/state/store.mjs';

test('knowledge-doctor - computeKnowledgeProjection generates expected structure', () => {
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

test('knowledge-doctor - doctor registry includes all 10 design-required checks (§14.6)', () => {
  const checkIds = DOCTOR_CHECKS.map(c => c.id);
  const expectedNewChecks = [
    'doc-registry-stale',
    'doc-alias-broken',
    'doc-active-duplicate',
    'doc-current-path-missing',
    'doc-source-unreachable',
    'doc-near-duplicate',
    'doc-provisional-aged',
    'doc-topic-oversized',
    'doc-role-underused',
    'doc-source-conservation',
  ];

  for (const id of expectedNewChecks) {
    assert.ok(checkIds.includes(id), `DOCTOR_CHECKS missing "${id}"`);
  }
});

test('knowledge-doctor - doc-registry-stale check passes when up to date', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-doctor-test-'));
  try {
    const fgosDir = initializeWorkRepository(tmpDir);
    initStore(fgosDir);
    registerTopicStore(fgosDir, { topicId: 't1', purposeSlug: 'test-topic' });
    registerDocStore(fgosDir, { docId: 't1:guide', topicId: 't1', role: 'guide', currentPath: 'docs/test/guide.md', docLifecycle: 'active' });

    const checkObj = DOCTOR_CHECKS.find(c => c.id === 'doc-registry-stale');
    assert.ok(checkObj);

    // Before the project adopts the registry there is nothing to keep fresh.
    const res1 = checkObj.check(tmpDir);
    assert.equal(res1.passed, true);
    assert.match(res1.message, /not applicable/);

    // Run fgos doc-registry
    const fgosBin = path.resolve('bin/fgos.mjs');
    execSync(`node "${fgosBin}" doc-registry`, { cwd: tmpDir });

    // Check again -> passes
    const res2 = checkObj.check(tmpDir);
    assert.equal(res2.passed, true);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

function setupGitRepoWithStore() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-doctor-git-test-'));
  initFixtureRepo(tmpDir);
  const fgosDir = path.join(tmpDir, '.fgos');
  initStore(fgosDir);
  return { tmpDir, fgosDir };
}

test('knowledge-doctor - doc-current-path-missing fails when a live doc\'s currentPath is not committed at HEAD', () => {
  const { tmpDir, fgosDir } = setupGitRepoWithStore();
  try {
    registerTopicStore(fgosDir, { topicId: 't1', purposeSlug: 'test-topic' });
    registerDocStore(fgosDir, { docId: 't1:guide', topicId: 't1', role: 'guide', currentPath: 'docs/test/guide.md', docLifecycle: 'active' });

    const checkObj = DOCTOR_CHECKS.find(c => c.id === 'doc-current-path-missing');
    const res1 = checkObj.check(tmpDir);
    assert.equal(res1.passed, false);
    assert.ok(res1.message.includes('t1:guide'));

    const docFile = path.join(tmpDir, 'docs/test/guide.md');
    fs.mkdirSync(path.dirname(docFile), { recursive: true });
    fs.writeFileSync(docFile, '# Guide\n', 'utf8');
    execSync('git add docs/test/guide.md && git commit -m "add guide"', { cwd: tmpDir, stdio: 'ignore' });

    const res2 = checkObj.check(tmpDir);
    assert.equal(res2.passed, true);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge-doctor - doc-source-unreachable fails when a path-shaped sourceCaptureIds entry resolves nowhere', () => {
  const { tmpDir, fgosDir } = setupGitRepoWithStore();
  try {
    registerTopicStore(fgosDir, { topicId: 't1', purposeSlug: 'test-topic' });
    registerDocStore(fgosDir, {
      docId: 't1:guide', topicId: 't1', role: 'guide', currentPath: 'docs/test/guide.md', docLifecycle: 'active',
      sourceCaptureIds: ['docs/test/guide.md', 'docs/gone/nowhere.md'],
    });

    const checkObj = DOCTOR_CHECKS.find(c => c.id === 'doc-source-unreachable');
    const res = checkObj.check(tmpDir);
    assert.equal(res.passed, false);
    assert.ok(res.message.includes('docs/gone/nowhere.md'));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge-doctor - doc-source-unreachable passes when every path-shaped source is the doc\'s own current or alias path', () => {
  const { tmpDir, fgosDir } = setupGitRepoWithStore();
  try {
    registerTopicStore(fgosDir, { topicId: 't1', purposeSlug: 'test-topic' });
    registerDocStore(fgosDir, {
      docId: 't1:guide', topicId: 't1', role: 'guide', currentPath: 'docs/test/guide.md', docLifecycle: 'active',
      sourceCaptureIds: ['docs/test/guide.md'], aliases: ['docs/test/guide-old.md'],
    });

    const checkObj = DOCTOR_CHECKS.find(c => c.id === 'doc-source-unreachable');
    assert.equal(checkObj.check(tmpDir).passed, true);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge-doctor - doc-source-conservation flags a target doc with no source (empty sourceCaptureIds)', () => {
  const { tmpDir, fgosDir } = setupGitRepoWithStore();
  try {
    registerTopicStore(fgosDir, { topicId: 't1', purposeSlug: 'test-topic' });
    registerDocStore(fgosDir, { docId: 't1:guide', topicId: 't1', role: 'guide', currentPath: 'docs/test/guide.md', docLifecycle: 'active', sourceCaptureIds: [] });

    const checkObj = DOCTOR_CHECKS.find(c => c.id === 'doc-source-conservation');
    const res = checkObj.check(tmpDir);
    assert.equal(res.passed, false);
    assert.ok(res.message.includes('target document has no source'));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge-doctor - doc-source-conservation flags a duplicate migration-inventory source and a lost one', () => {
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

    const checkObj = DOCTOR_CHECKS.find(c => c.id === 'doc-source-conservation');
    const res = checkObj.check(tmpDir);
    assert.equal(res.passed, false);
    assert.ok(res.message.includes("inventory source 'docs/dup.md' appears 2 times"));
    assert.ok(res.message.includes('docs/lost.md'));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge-doctor - doc-current-path-missing, doc-source-unreachable, and doc-source-conservation all treat a superseded doc as dead, not live', () => {
  // src/report/knowledge-resolver.mjs's own isLive excludes 'superseded' as
  // well as 'retired' -- a doc.supersede has already moved "current" to
  // supersededBy, so the superseded doc's own currentPath/sourceCaptureIds
  // are frozen history. None of these three checks should flag it just
  // because its old file is gone or its old source path is unreachable.
  const { tmpDir, fgosDir } = setupGitRepoWithStore();
  try {
    registerTopicStore(fgosDir, { topicId: 't1', purposeSlug: 'test-topic' });
    registerDocStore(fgosDir, { docId: 't1:guide', topicId: 't1', role: 'guide', currentPath: 'docs/test/guide-old.md', docLifecycle: 'active', sourceCaptureIds: ['docs/test/guide-old.md'] });
    supersedeDocStore(fgosDir, { docId: 't1:guide' });
    // Never commit docs/test/guide-old.md at HEAD, and never leave it
    // reachable through any live doc's alias -- exactly the state a real
    // supersede-then-content-merge leaves the old doc in.

    for (const id of ['doc-current-path-missing', 'doc-source-unreachable', 'doc-source-conservation']) {
      const res = DOCTOR_CHECKS.find(c => c.id === id).check(tmpDir);
      assert.equal(res.passed, true, `${id} must not flag a superseded doc: ${res.message}`);
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge-doctor - doc-source-conservation passes for a clean registry with no inventory file', () => {
  const { tmpDir, fgosDir } = setupGitRepoWithStore();
  try {
    registerTopicStore(fgosDir, { topicId: 't1', purposeSlug: 'test-topic' });
    registerDocStore(fgosDir, { docId: 't1:guide', topicId: 't1', role: 'guide', currentPath: 'docs/test/guide.md', docLifecycle: 'active', sourceCaptureIds: ['docs/test/guide.md'] });

    const checkObj = DOCTOR_CHECKS.find(c => c.id === 'doc-source-conservation');
    assert.equal(checkObj.check(tmpDir).passed, true);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge-doctor - doc-source-conservation does not crash (and just skips the inventory checks) when inventory-data.json is valid JSON but not an array', () => {
  const { tmpDir, fgosDir } = setupGitRepoWithStore();
  try {
    registerTopicStore(fgosDir, { topicId: 't1', purposeSlug: 'test-topic' });
    registerDocStore(fgosDir, { docId: 't1:guide', topicId: 't1', role: 'guide', currentPath: 'docs/test/guide.md', docLifecycle: 'active', sourceCaptureIds: ['docs/test/guide.md'] });

    const reportsDir = path.join(tmpDir, 'docs/history/compound-learn-artifact-registry/reports');
    fs.mkdirSync(reportsDir, { recursive: true });
    // A buggy classifier run writing a single object (or `null`) instead of
    // an array -- valid JSON, so the parse itself never throws.
    fs.writeFileSync(path.join(reportsDir, 'inventory-data.json'), JSON.stringify({ not: 'an array' }), 'utf8');

    const checkObj = DOCTOR_CHECKS.find(c => c.id === 'doc-source-conservation');
    assert.doesNotThrow(() => checkObj.check(tmpDir));
    assert.equal(checkObj.check(tmpDir).passed, true);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge-doctor - the doc rows of one doctor run read the Work view once, and a failed read is not retried', () => {
  const { tmpDir, fgosDir } = setupGitRepoWithStore();
  try {
    registerTopicStore(fgosDir, { topicId: 't1', purposeSlug: 'test-topic' });
    registerDocStore(fgosDir, { docId: 't1:guide', topicId: 't1', role: 'guide', currentPath: 'docs/test/guide.md', docLifecycle: 'active' });
    fs.mkdirSync(path.join(tmpDir, 'docs'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'docs', 'doc-registry.json'), '{}\n');

    const base = createDoctorRun();
    const computed = [];
    const run = { once: (key, compute) => base.once(key, () => { computed.push(key); return compute(); }) };
    const docRows = ['doc-registry-stale', 'doc-alias-broken', 'doc-active-duplicate', 'doc-current-path-missing', 'doc-source-unreachable',
      'doc-provisional-aged', 'doc-topic-oversized', 'doc-role-underused', 'doc-source-conservation']
      .map(id => DOCTOR_CHECKS.find(c => c.id === id));
    for (const row of docRows) row.check(tmpDir, run);
    assert.equal(computed.length, 1, 'nine doc rows, one read');

    const failing = createDoctorRun();
    let attempts = 0;
    const read = () => failing.once('view', () => { attempts += 1; throw new Error('store unreadable'); });
    assert.throws(read, /store unreadable/);
    assert.throws(read, /store unreadable/);
    assert.equal(attempts, 1);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge-doctor - doc-alias-broken judges the aliases a real Work store folded', () => {
  const { tmpDir, fgosDir } = setupGitRepoWithStore();
  try {
    registerTopicStore(fgosDir, { topicId: 't1', purposeSlug: 'test-topic' });
    registerDocStore(fgosDir, { docId: 't1:guide', topicId: 't1', role: 'guide', currentPath: 'docs/test/old-guide.md', docLifecycle: 'active' });
    moveDocPathStore(fgosDir, { docId: 't1:guide', topicId: 't1', role: 'guide', newPath: 'docs/test/guide.md' });

    const check = DOCTOR_CHECKS.find(c => c.id === 'doc-alias-broken');
    assert.deepEqual(check.check(tmpDir), { passed: true, message: 'no broken doc aliases' });

    // A second live doc taking over the alias string makes it ambiguous.
    registerDocStore(fgosDir, { docId: 't1:other', topicId: 't1', role: 'notes', currentPath: 'docs/test/old-guide.md', docLifecycle: 'active' });
    const res = check.check(tmpDir);
    assert.equal(res.passed, false);
    assert.match(res.message, /docs\/test\/old-guide\.md/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
