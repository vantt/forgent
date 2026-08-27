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

test('resolveDocPath - a lineage cycle reachable from an active topic does not crash (visited set breaks the recursion)', () => {
  // topic.split/merge refuse to create a cycle from the write side now, but
  // this stays defensive for lineage data that predates that guard -- a
  // RangeError here would crash every reader of this resolver. t2 and t3
  // cycle through each other (t2 -> splitFrom t3 -> mergedFrom t2 -> ...);
  // t4 is active and traces into that cycle but never actually reaches t1,
  // the doc's own retired topic, so the correct answer is "unresolvable",
  // not a crash.
  const view = {
    topics: {
      t1: { topicId: 't1', status: 'retired' },
      t2: { topicId: 't2', status: 'retired', lineage: { splitFrom: 't3' } },
      t3: { topicId: 't3', status: 'retired', lineage: { mergedFrom: ['t2'] } },
      t4: { topicId: 't4', status: 'active', lineage: { splitFrom: 't2' } }
    },
    docs: {
      d1: { docId: 'd1', topicId: 't1', role: 'guide', currentPath: 'docs/old/guide.md', docLifecycle: 'retired', aliases: [] }
    }
  };

  assert.doesNotThrow(() => resolveDocPath(view, 'docs/old/guide.md'));
  assert.equal(resolveDocPath(view, 'docs/old/guide.md'), null);
});

test('resolveDocPath - a live (non-retired) doc under a retired topic is unresolvable', () => {
  // docs/architect/knowledge-registry-redesign.md §14.3: attestation must
  // reject retired topics, not just retired documents. t1 was retired
  // directly (fgos topic retire) with its doc left in place -- unlike
  // split/merge, plain retire never moves the doc's topicId onto a
  // still-active successor, so there is no lineage to chase it through
  // either; it must become fully unresolvable, not still-attestable.
  const view = {
    topics: {
      t1: { topicId: 't1', status: 'retired' }
    },
    docs: {
      'd1': { docId: 'd1', topicId: 't1', role: 'guide', currentPath: 'docs/t1/guide.md', docLifecycle: 'active', aliases: [] }
    }
  };

  assert.equal(resolveDocPath(view, 'docs/t1/guide.md'), null);
});

test('resolveDocPath - a superseded doc\'s own currentPath redirects to its live successor, never to the dead doc itself', () => {
  // doc.supersede already moved "current" to supersededBy -- a superseded
  // doc is no longer the authoritative slot occupant even though it is not
  // retired, so step 1's direct-match must skip it. Because d1 and d2 share
  // the same still-active topic, the step-3 lineage-chase fallback's
  // self-loop (a topic trivially "leads from" itself) then correctly
  // re-routes the old path onto d2, the live occupant of that (topicId,
  // role) slot -- resolveDocPath must never hand back the stale d1 itself.
  const view = {
    topics: { t1: { topicId: 't1', status: 'active' } },
    docs: {
      d1: { docId: 'd1', topicId: 't1', role: 'guide', currentPath: 'docs/t1/guide.md', docLifecycle: 'superseded', aliases: [], supersededBy: 'd2' },
      d2: { docId: 'd2', topicId: 't1', role: 'guide', currentPath: 'docs/t1/guide-v2.md', docLifecycle: 'active', aliases: [] }
    }
  };

  assert.equal(resolveDocPath(view, 'docs/t1/guide.md').docId, 'd2');
  assert.equal(resolveDocPath(view, 'docs/t1/guide-v2.md').docId, 'd2');
});

test('resolveDocPath - a superseded doc with no live successor in its topic is fully unresolvable', () => {
  const view = {
    topics: { t1: { topicId: 't1', status: 'active' } },
    docs: {
      d1: { docId: 'd1', topicId: 't1', role: 'guide', currentPath: 'docs/t1/guide.md', docLifecycle: 'superseded', aliases: [] }
    }
  };

  assert.equal(resolveDocPath(view, 'docs/t1/guide.md'), null);
});

test('resolveDocPath - supersededBy resolves to the EXACT successor even when it has a different role and another unrelated live doc shares the topic', () => {
  // The lineage/role fallback alone is ambiguous here: d2 (the real
  // successor) has a DIFFERENT role than d1, so the exact-role match
  // finds nothing and the fallback would add every live doc in the topic
  // -- both d2 and the unrelated d3 -- even though the registry already
  // names d2 as the one true successor via supersededBy.
  const view = {
    topics: { t1: { topicId: 't1', status: 'active' } },
    docs: {
      d1: { docId: 'd1', topicId: 't1', role: 'pitfall', currentPath: 'docs/t1/pitfall.md', docLifecycle: 'superseded', aliases: [], supersededBy: 'd2' },
      d2: { docId: 'd2', topicId: 't1', role: 'guide', currentPath: 'docs/t1/guide.md', docLifecycle: 'active', aliases: [] },
      d3: { docId: 'd3', topicId: 't1', role: 'reference', currentPath: 'docs/t1/reference.md', docLifecycle: 'active', aliases: [] }
    }
  };

  const resolved = resolveDocPath(view, 'docs/t1/pitfall.md');
  assert.equal(Array.isArray(resolved), false, `expected the exact successor, got an ambiguous array: ${JSON.stringify(resolved)}`);
  assert.equal(resolved.docId, 'd2');
});

test('resolveDocPath - falls back to the lineage/role chase when supersededBy points at a doc that is itself no longer live', () => {
  // d1 -> d2 -> d3, a chain of supersessions. d2 is no longer live (it was
  // superseded again by d3), so following d1's pointer to d2 must not
  // stop there -- the lineage/role fallback (same topic, same role) is
  // what correctly finds d3.
  const view = {
    topics: { t1: { topicId: 't1', status: 'active' } },
    docs: {
      d1: { docId: 'd1', topicId: 't1', role: 'guide', currentPath: 'docs/t1/guide-v1.md', docLifecycle: 'superseded', aliases: [], supersededBy: 'd2' },
      d2: { docId: 'd2', topicId: 't1', role: 'guide', currentPath: 'docs/t1/guide-v2.md', docLifecycle: 'superseded', aliases: [], supersededBy: 'd3' },
      d3: { docId: 'd3', topicId: 't1', role: 'guide', currentPath: 'docs/t1/guide-v3.md', docLifecycle: 'active', aliases: [] }
    }
  };

  assert.equal(resolveDocPath(view, 'docs/t1/guide-v1.md').docId, 'd3');
});
