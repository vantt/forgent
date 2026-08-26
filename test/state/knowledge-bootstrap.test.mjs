import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { bootstrapRegistry } from '../../scripts/knowledge-bootstrap.mjs';
import { rebuild, initStore } from '../../src/state/store.mjs';
import { assertActiveDocCardinality } from '../../src/state/knowledge-registry.mjs';

test('knowledge-bootstrap - missing field rejects before writing entries', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-bootstrap-test-'));
  try {
    initStore(tmpDir);
    const dataPath = path.join(tmpDir, 'bad-inventory.json');
    const badInventory = [
      { oldPath: 'docs/test/a.md', topicId: '', role: 'guide' }
    ];
    fs.writeFileSync(dataPath, JSON.stringify(badInventory), 'utf8');

    assert.throws(() => {
      bootstrapRegistry(tmpDir, dataPath);
    });

    const view = rebuild(tmpDir);
    assert.deepEqual(view.topics || {}, {});
    assert.deepEqual(view.docs || {}, {});
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge-bootstrap - idempotency and invariant check', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-bootstrap-test-'));
  try {
    const dataPath = path.join(tmpDir, 'valid-inventory.json');
    const inventory = [
      { oldPath: 'docs/how-to/one.md', topicId: 't1', purposeSlug: 't1', purposeTitle: 'T1', role: 'guide', framework: 'diataxis', mode: 'how-to', entities: [] },
      { oldPath: 'docs/how-to/two.md', topicId: 't2', purposeSlug: 't2', purposeTitle: 'T2', role: 'guide', framework: 'diataxis', mode: 'how-to', entities: [] },
    ];
    fs.writeFileSync(dataPath, JSON.stringify(inventory), 'utf8');

    const res1 = bootstrapRegistry(tmpDir, dataPath);
    const view1 = rebuild(tmpDir);

    assert.equal(res1.topicsCreated, 2);
    assert.equal(res1.docsCreated, 2);

    // Run a second time
    const res2 = bootstrapRegistry(tmpDir, dataPath);
    const view2 = rebuild(tmpDir);

    assert.equal(res2.topicsCreated, 0);
    assert.equal(res2.docsCreated, 0);
    assert.deepEqual(view1.topics, view2.topics);
    assert.deepEqual(view1.docs, view2.docs);

    // Assert cardinality
    for (const doc of Object.values(view2.docs)) {
      assert.equal(doc.docLifecycle, 'active');
      assertActiveDocCardinality(view2, doc.topicId, doc.role);
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge-bootstrap - refuses (does not silently skip) a topic whose purposeSlug drifted from the registry', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-bootstrap-test-'));
  try {
    const dataPath = path.join(tmpDir, 'inventory.json');
    const first = [
      { oldPath: 'docs/how-to/one.md', topicId: 't1', purposeSlug: 't1-original', purposeTitle: 'T1', role: 'guide', framework: 'diataxis', mode: 'how-to', entities: [] },
    ];
    fs.writeFileSync(dataPath, JSON.stringify(first), 'utf8');
    bootstrapRegistry(tmpDir, dataPath);

    // A later classifier run renamed t1's purpose without a real
    // "fgos topic rename" ever happening in the registry.
    const drifted = [
      { oldPath: 'docs/how-to/one.md', topicId: 't1', purposeSlug: 't1-renamed', purposeTitle: 'T1', role: 'guide', framework: 'diataxis', mode: 'how-to', entities: [] },
    ];
    fs.writeFileSync(dataPath, JSON.stringify(drifted), 'utf8');

    assert.throws(() => {
      bootstrapRegistry(tmpDir, dataPath);
    }, /topic 't1' already exists with purposeSlug 't1-original', but the inventory row wants 't1-renamed'/);

    const view = rebuild(tmpDir);
    assert.equal(view.topics.t1.purposeSlug, 't1-original', 'a refused bootstrap must not have mutated the topic');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge-bootstrap - refuses (does not silently skip) a doc whose currentPath drifted from the registry', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-bootstrap-test-'));
  try {
    const dataPath = path.join(tmpDir, 'inventory.json');
    const first = [
      { oldPath: 'docs/how-to/one.md', topicId: 't1', purposeSlug: 't1', purposeTitle: 'T1', role: 'guide', framework: 'diataxis', mode: 'how-to', entities: [] },
    ];
    fs.writeFileSync(dataPath, JSON.stringify(first), 'utf8');
    bootstrapRegistry(tmpDir, dataPath);

    // The doc's real path moved (e.g. a manual "fgos doc move-path") but
    // the classifier's inventory still names the old path.
    const drifted = [
      { oldPath: 'docs/how-to/moved.md', topicId: 't1', purposeSlug: 't1', purposeTitle: 'T1', role: 'guide', framework: 'diataxis', mode: 'how-to', entities: [] },
    ];
    fs.writeFileSync(dataPath, JSON.stringify(drifted), 'utf8');

    assert.throws(() => {
      bootstrapRegistry(tmpDir, dataPath);
    }, /doc 't1:guide' already exists with currentPath 'docs\/how-to\/one\.md', but the inventory row wants 'docs\/how-to\/moved\.md'/);

    const view = rebuild(tmpDir);
    assert.equal(view.docs['t1:guide'].currentPath, 'docs/how-to/one.md', 'a refused bootstrap must not have mutated the doc');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
