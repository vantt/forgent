import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveDocPath } from '../../src/report/knowledge-resolver.mjs';

test('resolveDocPath - exact currentPath', () => {
  const view = {
    topics: { t1: { topicId: 't1', status: 'active' } },
    docs: {
      't1:guide': { docId: 't1:guide', topicId: 't1', role: 'guide', currentPath: 'docs/test/guide.md', docLifecycle: 'active', aliases: [] }
    }
  };

  const res = resolveDocPath(view, 'docs/test/guide.md');
  assert.equal(res.docId, 't1:guide');
});

test('resolveDocPath - alias oldPath', () => {
  const view = {
    topics: { t1: { topicId: 't1', status: 'active' } },
    docs: {
      't1:guide': { docId: 't1:guide', topicId: 't1', role: 'guide', currentPath: 'docs/test/guide-new.md', docLifecycle: 'active', aliases: ['docs/test/guide-old.md'] }
    }
  };

  const res = resolveDocPath(view, 'docs/test/guide-old.md');
  assert.equal(res.docId, 't1:guide');
});

test('resolveDocPath - unresolvable path returns null', () => {
  const view = { topics: {}, docs: {} };
  assert.equal(resolveDocPath(view, 'docs/nonexistent.md'), null);
});

test('resolveDocPath - split topic resolves to all current docs', () => {
  const view = {
    topics: {
      t1: { topicId: 't1', status: 'retired' },
      t2: { topicId: 't2', status: 'active', lineage: { splitFrom: 't1' } },
      t3: { topicId: 't3', status: 'active', lineage: { splitFrom: 't1' } }
    },
    docs: {
      d1: { docId: 'd1', topicId: 't1', role: 'guide', currentPath: 'docs/old/guide.md', docLifecycle: 'retired', aliases: [] },
      d2: { docId: 'd2', topicId: 't2', role: 'guide', currentPath: 'docs/part1/guide.md', docLifecycle: 'active', aliases: [] },
      d3: { docId: 'd3', topicId: 't3', role: 'guide', currentPath: 'docs/part2/guide.md', docLifecycle: 'active', aliases: [] }
    }
  };

  const res = resolveDocPath(view, 'docs/old/guide.md');
  assert.ok(Array.isArray(res));
  assert.equal(res.length, 2);
  const ids = res.map(d => d.docId).sort();
  assert.deepEqual(ids, ['d2', 'd3']);
});

test('resolveDocPath - merged topic resolves to target doc', () => {
  const view = {
    topics: {
      t1: { topicId: 't1', status: 'retired' },
      t2: { topicId: 't2', status: 'active', lineage: { mergedFrom: ['t1'] } }
    },
    docs: {
      d1: { docId: 'd1', topicId: 't1', role: 'guide', currentPath: 'docs/t1/guide.md', docLifecycle: 'retired', aliases: [] },
      d2: { docId: 'd2', topicId: 't2', role: 'guide', currentPath: 'docs/t2/guide.md', docLifecycle: 'active', aliases: [] }
    }
  };

  const res = resolveDocPath(view, 'docs/t1/guide.md');
  assert.equal(res.docId, 'd2');
});

test('resolveDocPath - multi-level lineage chain (split then merge)', () => {
  const view = {
    topics: {
      t1: { topicId: 't1', status: 'retired' },
      t2: { topicId: 't2', status: 'retired', lineage: { splitFrom: 't1' } },
      t3: { topicId: 't3', status: 'active', lineage: { mergedFrom: ['t2'] } }
    },
    docs: {
      d1: { docId: 'd1', topicId: 't1', role: 'guide', currentPath: 'docs/t1/guide.md', docLifecycle: 'retired', aliases: [] },
      d2: { docId: 'd2', topicId: 't2', role: 'guide', currentPath: 'docs/t2/guide.md', docLifecycle: 'retired', aliases: [] },
      d3: { docId: 'd3', topicId: 't3', role: 'guide', currentPath: 'docs/t3/guide.md', docLifecycle: 'active', aliases: [] }
    }
  };

  const res = resolveDocPath(view, 'docs/t1/guide.md');
  assert.equal(res.docId, 'd3');
});
