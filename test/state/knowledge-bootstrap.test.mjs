import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { bootstrapRegistry } from '../../scripts/knowledge-bootstrap.mjs';
import { rebuild, initStore, registerTopicStore, registerDocStore, retireDocStore, supersedeDocStore, retireTopicStore } from '../../src/state/store.mjs';
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

test('knowledge-bootstrap - a drift refusal on a LATER row leaves NO partial write from earlier rows in the same run', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-bootstrap-test-'));
  try {
    const dataPath = path.join(tmpDir, 'inventory.json');

    // Bootstrap once so t1 already exists with a KNOWN purposeSlug.
    const first = [
      { oldPath: 'docs/how-to/one.md', topicId: 't1', purposeSlug: 't1-original', purposeTitle: 'T1', role: 'guide', framework: 'diataxis', mode: 'how-to', entities: [] },
    ];
    fs.writeFileSync(dataPath, JSON.stringify(first), 'utf8');
    bootstrapRegistry(tmpDir, dataPath);

    // A single run whose FIRST row is brand-new (t2, would normally get
    // created) and whose SECOND row re-touches t1 with drifted data. The
    // old interleaved-check shape would have durably created t2/t2:guide
    // before ever reaching t1's drift throw.
    const mixed = [
      { oldPath: 'docs/how-to/two.md', topicId: 't2', purposeSlug: 't2', purposeTitle: 'T2', role: 'guide', framework: 'diataxis', mode: 'how-to', entities: [] },
      { oldPath: 'docs/how-to/one.md', topicId: 't1', purposeSlug: 't1-drifted', purposeTitle: 'T1', role: 'guide', framework: 'diataxis', mode: 'how-to', entities: [] },
    ];
    fs.writeFileSync(dataPath, JSON.stringify(mixed), 'utf8');

    assert.throws(() => {
      bootstrapRegistry(tmpDir, dataPath);
    }, /topic 't1' already exists with purposeSlug 't1-original', but the inventory row wants 't1-drifted'/);

    const view = rebuild(tmpDir);
    assert.equal(view.topics.t2, undefined, 'a refused bootstrap must not have created t2 from an earlier row in the same run');
    assert.equal(view.docs['t2:guide'], undefined, 'a refused bootstrap must not have created t2:guide from an earlier row in the same run');
    assert.equal(view.topics.t1.purposeSlug, 't1-original', 't1 itself must also be untouched');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge-bootstrap - a later row that fails the REDUCER\'s own validation (e.g. invalid mode) leaves an earlier row\'s topic/doc uncreated too', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-bootstrap-test-'));
  try {
    const dataPath = path.join(tmpDir, 'inventory.json');
    // t1's row is entirely valid; t2's row has a mode the reducer's own
    // framework/mode vocabulary rejects. Neither row exists in the
    // registry yet -- the drift preflight has nothing to catch here, only
    // the simulated-apply preflight (replaying against the real reducer)
    // can.
    const inventory = [
      { oldPath: 'docs/how-to/one.md', topicId: 't1', purposeSlug: 't1', purposeTitle: 'T1', role: 'guide', framework: 'diataxis', mode: 'how-to', entities: [] },
      { oldPath: 'docs/how-to/two.md', topicId: 't2', purposeSlug: 't2', purposeTitle: 'T2', role: 'guide', framework: 'diataxis', mode: 'bad-mode', entities: [] },
    ];
    fs.writeFileSync(dataPath, JSON.stringify(inventory), 'utf8');

    assert.throws(() => {
      bootstrapRegistry(tmpDir, dataPath);
    }, /Invalid mode: 'bad-mode'/);

    const view = rebuild(tmpDir);
    assert.equal(view.topics, undefined, 't1 (the earlier, valid row) must not have been created either -- nothing durable until the whole batch validates');
    assert.equal(view.docs, undefined);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge-bootstrap - refuses (does not report idempotent success) a doc the registry already retired', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-bootstrap-test-'));
  try {
    const dataPath = path.join(tmpDir, 'inventory.json');
    const first = [
      { oldPath: 'docs/how-to/one.md', topicId: 't1', purposeSlug: 't1', purposeTitle: 'T1', role: 'guide', framework: 'diataxis', mode: 'how-to', entities: [] },
    ];
    fs.writeFileSync(dataPath, JSON.stringify(first), 'utf8');
    const res1 = bootstrapRegistry(tmpDir, dataPath);
    assert.equal(res1.docsCreated, 1);

    retireDocStore(tmpDir, { docId: 't1:guide' });

    // The classifier re-scans the same corpus and still finds this row --
    // as far as it knows, this is a live source. bootstrap must refuse,
    // not silently report "docsCreated: 0" as if nothing was wrong.
    assert.throws(() => {
      bootstrapRegistry(tmpDir, dataPath);
    }, /doc 't1:guide' already exists but is 'retired' \(not live\)/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge-bootstrap - refuses a doc the registry already superseded', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-bootstrap-test-'));
  try {
    const dataPath = path.join(tmpDir, 'inventory.json');
    const first = [
      { oldPath: 'docs/how-to/one.md', topicId: 't1', purposeSlug: 't1', purposeTitle: 'T1', role: 'guide', framework: 'diataxis', mode: 'how-to', entities: [] },
    ];
    fs.writeFileSync(dataPath, JSON.stringify(first), 'utf8');
    bootstrapRegistry(tmpDir, dataPath);
    supersedeDocStore(tmpDir, { docId: 't1:guide' });

    assert.throws(() => {
      bootstrapRegistry(tmpDir, dataPath);
    }, /doc 't1:guide' already exists but is 'superseded' \(not live\)/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge-bootstrap - refuses a topic the registry already retired', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-bootstrap-test-'));
  try {
    const dataPath = path.join(tmpDir, 'inventory.json');
    const first = [
      { oldPath: 'docs/how-to/one.md', topicId: 't1', purposeSlug: 't1', purposeTitle: 'T1', role: 'guide', framework: 'diataxis', mode: 'how-to', entities: [] },
    ];
    fs.writeFileSync(dataPath, JSON.stringify(first), 'utf8');
    bootstrapRegistry(tmpDir, dataPath);
    retireDocStore(tmpDir, { docId: 't1:guide' });
    retireTopicStore(tmpDir, { topicId: 't1' });

    let errOutput = '';
    try {
      bootstrapRegistry(tmpDir, dataPath);
    } catch (e) {
      errOutput = e.message;
    }
    assert.ok(errOutput.includes("topic 't1' already exists but is 'retired' (not active)"));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge-bootstrap - refuses a live doc whose framework or mode drifted from the registry', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-bootstrap-test-'));
  try {
    const dataPath = path.join(tmpDir, 'inventory.json');
    const first = [
      { oldPath: 'docs/how-to/one.md', topicId: 't1', purposeSlug: 't1', purposeTitle: 'T1', role: 'guide', framework: 'diataxis', mode: 'how-to', entities: [] },
    ];
    fs.writeFileSync(dataPath, JSON.stringify(first), 'utf8');
    bootstrapRegistry(tmpDir, dataPath);

    const driftedMode = [
      { oldPath: 'docs/how-to/one.md', topicId: 't1', purposeSlug: 't1', purposeTitle: 'T1', role: 'guide', framework: 'diataxis', mode: 'reference', entities: [] },
    ];
    fs.writeFileSync(dataPath, JSON.stringify(driftedMode), 'utf8');

    assert.throws(() => {
      bootstrapRegistry(tmpDir, dataPath);
    }, /doc 't1:guide' already exists with mode 'how-to', but the inventory row wants 'reference'/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('knowledge-bootstrap - refuses (does not report idempotent success) a doc whose sourceCaptureIds never recorded the inventory row\'s own oldPath', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-bootstrap-test-'));
  try {
    const dataPath = path.join(tmpDir, 'inventory.json');
    const inventory = [
      { oldPath: 'docs/how-to/one.md', topicId: 't1', purposeSlug: 't1', purposeTitle: 'T1', role: 'guide', framework: 'diataxis', mode: 'how-to', entities: [] },
    ];
    fs.writeFileSync(dataPath, JSON.stringify(inventory), 'utf8');

    initStore(tmpDir);
    registerTopicStore(tmpDir, { topicId: 't1', purposeSlug: 't1', purposeTitle: 'T1', entities: [] });
    // Identity/framework/mode/lifecycle all match the inventory row, but
    // the classifier's own source assignment for this doc was never
    // captured -- registerDocStore's own default (undefined
    // sourceCaptureIds) mirrors a doc created some other way than through
    // this bootstrap script's own seeding.
    registerDocStore(tmpDir, { docId: 't1:guide', topicId: 't1', role: 'guide', currentPath: 'docs/how-to/one.md', framework: 'diataxis', mode: 'how-to', docLifecycle: 'active', aliases: [], sourceCaptureIds: [] });

    assert.throws(() => {
      bootstrapRegistry(tmpDir, dataPath);
    }, /doc 't1:guide' already exists but its sourceCaptureIds \(\[\]\) does not include the inventory row's oldPath 'docs\/how-to\/one\.md'/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
