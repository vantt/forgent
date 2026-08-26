import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  foldKnowledgeEvents,
  assertActiveDocCardinality,
  resolveDocId,
  KnowledgeValidationError,
} from '../../src/state/knowledge-registry.mjs';
import {
  initStore,
  registerTopicStore,
  registerDocStore,
  promoteDocStore,
  reserveDocStore,
  splitTopicStore,
  mergeTopicStore,
  retireTopicStore,
  markDocRenderedStore,
  rebuild,
} from '../../src/state/store.mjs';

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

test('topic.merge refuses a role collision atomically -- nothing mutates when it throws', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-knowledge-test-'));
  try {
    initStore(tmpDir);
    registerTopicStore(tmpDir, { topicId: 'target', purposeSlug: 'target-topic' });
    registerTopicStore(tmpDir, { topicId: 'source', purposeSlug: 'source-topic' });
    registerDocStore(tmpDir, { docId: 'dt', topicId: 'target', role: 'guide', currentPath: 'docs/t/guide.md', docLifecycle: 'active' });
    registerDocStore(tmpDir, { docId: 'ds', topicId: 'source', role: 'guide', currentPath: 'docs/s/guide.md', docLifecycle: 'active' });

    assert.throws(() => {
      mergeTopicStore(tmpDir, { sourceTopicIds: ['source'], targetTopicId: 'target' });
    }, /would have two live docs/);

    // Merge must fail whole -- neither topic's status nor either doc's topicId moved.
    const view = rebuild(tmpDir);
    assert.equal(view.topics.source.status, 'active');
    assert.equal(view.topics.target.lineage, null);
    assert.equal(view.docs.dt.topicId, 'target');
    assert.equal(view.docs.ds.topicId, 'source');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('topic.merge succeeds when the colliding source doc is already superseded', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-knowledge-test-'));
  try {
    initStore(tmpDir);
    registerTopicStore(tmpDir, { topicId: 'target', purposeSlug: 'target-topic' });
    registerTopicStore(tmpDir, { topicId: 'source', purposeSlug: 'source-topic' });
    registerDocStore(tmpDir, { docId: 'dt', topicId: 'target', role: 'guide', currentPath: 'docs/t/guide.md', docLifecycle: 'active' });
    registerDocStore(tmpDir, { docId: 'ds', topicId: 'source', role: 'guide', currentPath: 'docs/s/guide.md', docLifecycle: 'superseded' });

    mergeTopicStore(tmpDir, { sourceTopicIds: ['source'], targetTopicId: 'target' });

    const view = rebuild(tmpDir);
    assert.equal(view.topics.source.status, 'retired');
    assert.equal(view.docs.ds.topicId, 'target');
    assert.equal(view.docs.dt.docLifecycle, 'active');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('a retired topic refuses new doc writes (reserve, register, mark-rendered, promote)', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-knowledge-test-'));
  try {
    initStore(tmpDir);
    registerTopicStore(tmpDir, { topicId: 't1', purposeSlug: 'dead-topic' });
    reserveDocStore(tmpDir, { topicId: 't1', role: 'pitfall', currentPath: 'docs/t1/pitfall.md', docId: 'd-pitfall' });
    retireTopicStore(tmpDir, { topicId: 't1' });

    assert.throws(() => {
      reserveDocStore(tmpDir, { topicId: 't1', role: 'guide', currentPath: 'docs/t1/guide.md', docId: 'd-guide' });
    }, /is retired/);

    assert.throws(() => {
      registerDocStore(tmpDir, { topicId: 't1', role: 'guide', currentPath: 'docs/t1/guide.md', docId: 'd-guide2', docLifecycle: 'provisional' });
    }, /is retired/);

    assert.throws(() => {
      markDocRenderedStore(tmpDir, { docId: 'd-pitfall' });
    }, /is retired/);

    assert.throws(() => {
      promoteDocStore(tmpDir, { docId: 'd-pitfall' });
    }, /is retired/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('resolveDocId finds a doc by (topicId, role) after topic.split moved its topicId without renaming its docId', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-knowledge-test-'));
  try {
    initStore(tmpDir);
    registerTopicStore(tmpDir, { topicId: 't1', purposeSlug: 'worktree-all' });
    // Default docId, derived from the OLD topicId -- this is the common case
    // (no explicit --doc-id), and exactly what a split leaves stale.
    reserveDocStore(tmpDir, { topicId: 't1', role: 'guide', currentPath: 'docs/t1/guide.md' });
    splitTopicStore(tmpDir, {
      topicId: 't1',
      newTopics: [
        { topicId: 't2', purposeSlug: 'worktree-reclaim', rolesToMove: ['guide'] },
        { topicId: 't3', purposeSlug: 'worktree-cleanup' },
      ],
    });

    const view = rebuild(tmpDir);
    assert.equal(view.docs['t1:guide'].topicId, 't2', 'docId stays stable even though topicId moved');

    const found = resolveDocId(view, { topicId: 't2', role: 'guide' });
    assert.equal(found, 't1:guide');

    // The stale reconstruction a naive caller would build no longer resolves.
    assert.equal(view.docs['t2:guide'], undefined);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('framework/mode/role vocabulary - unknown framework, unknown mode, and role-vs-mode collisions are refused', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-knowledge-test-'));
  try {
    initStore(tmpDir);
    registerTopicStore(tmpDir, { topicId: 't1', purposeSlug: 'vocab-test' });

    assert.throws(() => {
      reserveDocStore(tmpDir, { topicId: 't1', role: 'guide', currentPath: 'docs/t1/a.md', framework: 'not-a-real-framework' });
    }, /Invalid framework/);

    assert.throws(() => {
      reserveDocStore(tmpDir, { topicId: 't1', role: 'guide', currentPath: 'docs/t1/b.md', mode: 'not-a-real-mode' });
    }, /Invalid mode/);

    // Rule 1 (docs/architect/knowledge-registry-redesign.md §7.2): a role
    // name must not equal a framework mode name.
    assert.throws(() => {
      reserveDocStore(tmpDir, { topicId: 't1', role: 'reference', currentPath: 'docs/t1/c.md' });
    }, /must not equal a Diataxis mode name/);

    // A real role, real mode, real framework -- must still succeed.
    reserveDocStore(tmpDir, { topicId: 't1', role: 'pitfall', currentPath: 'docs/t1/d.md', mode: 'explanation' });
    const view = rebuild(tmpDir);
    assert.equal(view.docs['t1:pitfall'].mode, 'explanation');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('topic.split refuses a self-referencing successor, a duplicate successor id, and an existing topicId -- atomically', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-knowledge-test-'));
  try {
    initStore(tmpDir);
    registerTopicStore(tmpDir, { topicId: 't1', purposeSlug: 'source-topic' });
    registerTopicStore(tmpDir, { topicId: 'existing-active', purposeSlug: 'already-here' });

    // Successor id equal to the source.
    assert.throws(() => {
      splitTopicStore(tmpDir, {
        topicId: 't1',
        newTopics: [{ topicId: 't1', purposeSlug: 'self' }, { topicId: 't2', purposeSlug: 'other' }],
      });
    }, /cannot equal the source topicId/);

    // Duplicate successor id within the same split call.
    assert.throws(() => {
      splitTopicStore(tmpDir, {
        topicId: 't1',
        newTopics: [{ topicId: 't2', purposeSlug: 'a' }, { topicId: 't2', purposeSlug: 'b' }],
      });
    }, /listed more than once/);

    // Successor id that already names an existing (active) topic.
    assert.throws(() => {
      splitTopicStore(tmpDir, {
        topicId: 't1',
        newTopics: [{ topicId: 'existing-active', purposeSlug: 'clobber' }, { topicId: 't3', purposeSlug: 'other' }],
      });
    }, /already exists/);

    // A single-successor split is a rename, not a split.
    assert.throws(() => {
      splitTopicStore(tmpDir, { topicId: 't1', newTopics: [{ topicId: 't2', purposeSlug: 'only-one' }] });
    }, /at least 2 successor/);

    // None of the above mutated anything -- source is still active, no
    // successor topics or docs exist.
    const view = rebuild(tmpDir);
    assert.equal(view.topics.t1.status, 'active');
    assert.equal(view.topics['existing-active'].purposeSlug, 'already-here');
    assert.equal(view.topics.t2, undefined);
    assert.equal(view.topics.t3, undefined);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('topic.merge refuses a self-merge, a missing source, and a duplicate source -- atomically', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-knowledge-test-'));
  try {
    initStore(tmpDir);
    registerTopicStore(tmpDir, { topicId: 'target', purposeSlug: 'target-topic' });
    registerTopicStore(tmpDir, { topicId: 'source', purposeSlug: 'source-topic' });

    // Source equal to target: would retire the target (srcTopic === targetTopic).
    assert.throws(() => {
      mergeTopicStore(tmpDir, { sourceTopicIds: ['target'], targetTopicId: 'target' });
    }, /cannot equal targetTopicId/);

    // Source that doesn't exist at all -- must not silently land in lineage.mergedFrom.
    assert.throws(() => {
      mergeTopicStore(tmpDir, { sourceTopicIds: ['does-not-exist'], targetTopicId: 'target' });
    }, /not found/);

    // Duplicate source in one merge call.
    assert.throws(() => {
      mergeTopicStore(tmpDir, { sourceTopicIds: ['source', 'source'], targetTopicId: 'target' });
    }, /listed more than once/);

    // A retired source is not mergeable.
    retireTopicStore(tmpDir, { topicId: 'source' });
    assert.throws(() => {
      mergeTopicStore(tmpDir, { sourceTopicIds: ['source'], targetTopicId: 'target' });
    }, /must be 'active'/);

    // None of the above mutated the target.
    const view = rebuild(tmpDir);
    assert.equal(view.topics.target.status, 'active');
    assert.equal(view.topics.target.lineage, null);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
