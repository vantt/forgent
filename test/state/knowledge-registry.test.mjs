import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  foldKnowledgeEvents,
  assertActiveDocCardinality,
  KnowledgeValidationError,
} from '../../src/state/knowledge-registry.mjs';
import { initStore, registerTopicStore, registerDocStore, promoteDocStore, reserveDocStore, splitTopicStore } from '../../src/state/store.mjs';

test('foldKnowledgeEvents - basic topic and doc fold', () => {
  const events = [
    {
      type: 'topic.register',
      ts: 1000,
      payload: { topicId: 't1', purposeSlug: 'worktree-reclaim', purposeTitle: 'Worktree Reclaim' },
    },
    {
      type: 'doc.register',
      ts: 1001,
      payload: { topicId: 't1', role: 'guide', currentPath: 'docs/worktree-reclaim/guide.md', docLifecycle: 'active' },
    },
  ];

  const view = foldKnowledgeEvents(events);
  assert.equal(view.topics.t1.purposeSlug, 'worktree-reclaim');
  assert.equal(view.topics.t1.status, 'active');
  assert.equal(view.docs['t1:guide'].docLifecycle, 'active');
  assert.equal(view.docs['t1:guide'].currentPath, 'docs/worktree-reclaim/guide.md');
});

test('activeDoc(topicId, role) <= 1 - second active doc throws', () => {
  const events = [
    {
      type: 'topic.register',
      ts: 1000,
      payload: { topicId: 't1', purposeSlug: 'worktree-reclaim' },
    },
    {
      type: 'doc.register',
      ts: 1001,
      payload: { docId: 'd1', topicId: 't1', role: 'guide', currentPath: 'docs/worktree-reclaim/guide1.md', docLifecycle: 'active' },
    },
  ];

  const view = foldKnowledgeEvents(events);
  assert.throws(() => {
    foldKnowledgeEvents([
      ...events,
      {
        type: 'doc.register',
        ts: 1002,
        payload: { docId: 'd2', topicId: 't1', role: 'guide', currentPath: 'docs/worktree-reclaim/guide2.md', docLifecycle: 'active' },
      },
    ]);
  }, KnowledgeValidationError);
});

test('topic.split keeps lineage and source capture ids', () => {
  const events = [
    {
      type: 'topic.register',
      ts: 1000,
      payload: { topicId: 't1', purposeSlug: 'worktree-all', entities: ['e1', 'e2'] },
    },
    {
      type: 'doc.register',
      ts: 1001,
      payload: {
        docId: 'd1',
        topicId: 't1',
        role: 'guide',
        currentPath: 'docs/worktree-all/guide.md',
        docLifecycle: 'active',
        sourceCaptureIds: ['cap1', 'cap2'],
      },
    },
    {
      type: 'topic.split',
      ts: 1002,
      payload: {
        topicId: 't1',
        newTopics: [
          { topicId: 't2', purposeSlug: 'worktree-reclaim', rolesToMove: ['guide'] },
          { topicId: 't3', purposeSlug: 'worktree-cleanup' },
        ],
      },
    },
  ];

  const view = foldKnowledgeEvents(events);
  assert.equal(view.topics.t1.status, 'retired');
  assert.equal(view.topics.t2.status, 'active');
  assert.equal(view.topics.t2.lineage.splitFrom, 't1');
  assert.equal(view.docs.d1.topicId, 't2');
  assert.deepEqual(view.docs.d1.sourceCaptureIds, ['cap1', 'cap2']);
});

test('doc.promote from reserved is rejected', () => {
  const events = [
    {
      type: 'topic.register',
      ts: 1000,
      payload: { topicId: 't1', purposeSlug: 'test-topic' },
    },
    {
      type: 'doc.reserve',
      ts: 1001,
      payload: { topicId: 't1', role: 'concept', currentPath: 'docs/test/concept.md' },
    },
  ];

  assert.throws(() => {
    foldKnowledgeEvents([
      ...events,
      {
        type: 'doc.promote',
        ts: 1002,
        payload: { topicId: 't1', role: 'concept' },
      },
    ]);
  }, KnowledgeValidationError);
});

test('docLifecycle rejects draft', () => {
  assert.throws(() => {
    foldKnowledgeEvents([
      {
        type: 'doc.register',
        ts: 1000,
        payload: { topicId: 't1', role: 'guide', currentPath: 'docs/test/guide.md', docLifecycle: 'draft' },
      },
    ]);
  }, KnowledgeValidationError);
});

test('concurrent registerDocStore enforces lock serialization', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-knowledge-test-'));
  try {
    initStore(tmpDir);
    registerTopicStore(tmpDir, { topicId: 't1', purposeSlug: 'concurrent-test' });

    // Attempt two active registrations for same (topicId, role)
    registerDocStore(tmpDir, {
      docId: 'd1',
      topicId: 't1',
      role: 'guide',
      currentPath: 'docs/test/guide1.md',
      docLifecycle: 'active',
    });

    assert.throws(() => {
      registerDocStore(tmpDir, {
        docId: 'd2',
        topicId: 't1',
        role: 'guide',
        currentPath: 'docs/test/guide2.md',
        docLifecycle: 'active',
      });
    }, KnowledgeValidationError);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('doc slot cardinality - a second non-retired/non-superseded doc for the same (topicId, role) is refused even below active', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-knowledge-test-'));
  try {
    initStore(tmpDir);
    registerTopicStore(tmpDir, { topicId: 't1', purposeSlug: 'slot-test' });

    reserveDocStore(tmpDir, { topicId: 't1', role: 'guide', currentPath: 'docs/test/guide1.md', docId: 'd1' });

    // Different docId, same (topicId, role), both still 'reserved'/'provisional' -- neither
    // is 'active' so assertActiveDocCardinality alone would miss this.
    assert.throws(() => {
      registerDocStore(tmpDir, {
        docId: 'd2',
        topicId: 't1',
        role: 'guide',
        currentPath: 'docs/test/guide2.md',
        docLifecycle: 'provisional',
      });
    }, /already occupied/);

    assert.throws(() => {
      reserveDocStore(tmpDir, { topicId: 't1', role: 'guide', currentPath: 'docs/test/guide3.md', docId: 'd3' });
    }, /already occupied/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('doc.reserve is create-only - reserving an existing docId again is refused', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-knowledge-test-'));
  try {
    initStore(tmpDir);
    registerTopicStore(tmpDir, { topicId: 't1', purposeSlug: 'reserve-test' });
    reserveDocStore(tmpDir, { topicId: 't1', role: 'guide', currentPath: 'docs/test/guide.md', docId: 'd1' });

    assert.throws(() => {
      reserveDocStore(tmpDir, { topicId: 't1', role: 'guide', currentPath: 'docs/test/guide.md', docId: 'd1' });
    }, /create-only/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('topic.register is create-only - re-registering an existing topicId is refused and does not wipe lineage', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-knowledge-test-'));
  try {
    initStore(tmpDir);
    registerTopicStore(tmpDir, { topicId: 't1', purposeSlug: 'topic-test' });

    assert.throws(() => {
      registerTopicStore(tmpDir, { topicId: 't1', purposeSlug: 'topic-test-overwritten' });
    }, /create-only/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
