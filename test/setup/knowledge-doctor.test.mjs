import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { computeKnowledgeProjection } from '../../src/report/knowledge-projection.mjs';
import { DOCTOR_CHECKS } from '../../src/setup/checks.mjs';
import { initStore, registerTopicStore, registerDocStore } from '../../src/state/store.mjs';

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

test('knowledge-doctor - doctor registry includes 8 new checks', () => {
  const checkIds = DOCTOR_CHECKS.map(c => c.id);
  const expectedNewChecks = [
    'doc-registry-stale',
    'doc-alias-broken',
    'doc-active-duplicate',
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
    const fgosDir = path.join(tmpDir, '.fgos');
    initStore(fgosDir);
    registerTopicStore(fgosDir, { topicId: 't1', purposeSlug: 'test-topic' });
    registerDocStore(fgosDir, { docId: 't1:guide', topicId: 't1', role: 'guide', currentPath: 'docs/test/guide.md', docLifecycle: 'active' });

    const checkObj = DOCTOR_CHECKS.find(c => c.id === 'doc-registry-stale');
    assert.ok(checkObj);

    // Initial check without generated files -> fails
    const res1 = checkObj.check(tmpDir);
    assert.equal(res1.passed, false);

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
