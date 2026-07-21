import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { buildEnduserIndex, findSourceCaptureId, findSourceCaptureIds, QUADRANT_META, QUADRANTS } from '../../src/report/enduser-index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const FGOS = path.join(REPO_ROOT, 'bin', 'fgos.mjs');
const MANIFEST_PATH = path.join(REPO_ROOT, 'docs', 'enduser-docs-index.json');

function runDocsIndex() {
  // Deliberately run against the REAL repo cwd (never a temp fixture): this
  // cell's must_haves forbid a proxy test that would pass with the manifest
  // absent, so this exercises the actual generator over the actual
  // docs/<quadrant>/ tree and reads the actual produced manifest file.
  return spawnSync(process.execPath, [FGOS, 'docs-index'], { cwd: REPO_ROOT, encoding: 'utf8' });
}

// --- pure buildEnduserIndex/findSourceCaptureId (per entropy.test.mjs's own
// precedent: hand-built inputs, no fs, no real store) -----------------------

test('QUADRANT_META defines a non-empty purpose+audience for every Diataxis quadrant', () => {
  for (const quadrant of QUADRANTS) {
    const meta = QUADRANT_META[quadrant];
    assert.ok(meta, `${quadrant} missing from QUADRANT_META`);
    assert.ok(meta.purpose && meta.purpose.length > 0);
    assert.ok(meta.audience && meta.audience.length > 0);
  }
});

test('findSourceCaptureId returns the id whose outcome docPath matches, or null when none matches', () => {
  const outcomesView = {
    'work-a': { docPath: 'docs/how-to/foo.md' },
    'work-b': { predicted: { tier: 'standard' } },
  };
  assert.equal(findSourceCaptureId(outcomesView, 'docs/how-to/foo.md'), 'work-a');
  assert.equal(findSourceCaptureId(outcomesView, 'docs/how-to/bar.md'), null);
  assert.equal(findSourceCaptureId(undefined, 'docs/how-to/foo.md'), null);
});

test('findSourceCaptureIds returns ALL outcome ids whose docPath matches, in stable insertion order (D13 no-loss gather)', () => {
  const outcomesView = {
    'work-a': { docPath: 'docs/how-to/foo.md' },
    'work-b': { docPath: 'docs/how-to/bar.md' },
    'work-c': { docPath: 'docs/how-to/foo.md' },
  };
  assert.deepEqual(findSourceCaptureIds(outcomesView, 'docs/how-to/foo.md'), ['work-a', 'work-c']);
});

test('findSourceCaptureIds returns [] when no outcome matches the docPath, or the view is empty/absent', () => {
  const outcomesView = { 'work-a': { docPath: 'docs/how-to/foo.md' } };
  assert.deepEqual(findSourceCaptureIds(outcomesView, 'docs/how-to/nope.md'), []);
  assert.deepEqual(findSourceCaptureIds({}, 'docs/how-to/foo.md'), []);
  assert.deepEqual(findSourceCaptureIds(undefined, 'docs/how-to/foo.md'), []);
});

test('findSourceCaptureIds leaves the singular findSourceCaptureId behavior (first-match) unchanged', () => {
  const outcomesView = {
    'work-a': { docPath: 'docs/how-to/foo.md' },
    'work-b': { docPath: 'docs/how-to/foo.md' },
  };
  assert.equal(findSourceCaptureId(outcomesView, 'docs/how-to/foo.md'), 'work-a');
  assert.deepEqual(findSourceCaptureIds(outcomesView, 'docs/how-to/foo.md'), ['work-a', 'work-b']);
});

test('buildEnduserIndex seeds purpose/audience from the fixed quadrant mapping and resolves sourceCaptureId', () => {
  const docEntries = [{ quadrant: 'how-to', docPath: 'docs/how-to/foo.md', title: 'Foo' }];
  const outcomesView = { 'work-a': { docPath: 'docs/how-to/foo.md' } };
  const entries = buildEnduserIndex(docEntries, outcomesView);
  assert.equal(entries.length, 1);
  assert.deepEqual(entries[0], {
    quadrant: 'how-to',
    purpose: QUADRANT_META['how-to'].purpose,
    audience: QUADRANT_META['how-to'].audience,
    docPath: 'docs/how-to/foo.md',
    title: 'Foo',
    sourceCaptureId: 'work-a',
  });
});

test('buildEnduserIndex emits sourceCaptureId null for a doc with no recorded linkage (legacy doc)', () => {
  const docEntries = [{ quadrant: 'how-to', docPath: 'docs/how-to/legacy.md', title: 'Legacy' }];
  const entries = buildEnduserIndex(docEntries, {});
  assert.equal(entries[0].sourceCaptureId, null);
});

test('buildEnduserIndex dedupes by docPath — a repeated doc entry yields exactly one manifest row (idempotency)', () => {
  const docEntries = [
    { quadrant: 'how-to', docPath: 'docs/how-to/foo.md', title: 'Foo' },
    { quadrant: 'how-to', docPath: 'docs/how-to/foo.md', title: 'Foo' },
  ];
  const entries = buildEnduserIndex(docEntries, {});
  assert.equal(entries.length, 1);
});

test('buildEnduserIndex tolerates an empty/absent docEntries list (all quadrant dirs missing) and returns an empty array, no crash', () => {
  assert.deepEqual(buildEnduserIndex([], {}), []);
  assert.deepEqual(buildEnduserIndex(undefined, undefined), []);
});

// --- integration: `fgos docs-index` against the REAL docs/ tree -----------

test('fgos docs-index writes repo/docs/enduser-docs-index.json with the real how-to demo entry', () => {
  const result = runDocsIndex();
  assert.equal(result.status, 0, result.stderr);

  assert.ok(fs.existsSync(MANIFEST_PATH), 'enduser-docs-index.json must exist after docs-index runs');
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  assert.ok(Array.isArray(manifest));

  const demo = manifest.find((e) => e.docPath === 'docs/how-to/check-rollup-progress.md');
  assert.ok(demo, 'the how-to demo doc must appear in the manifest');
  assert.equal(demo.quadrant, 'how-to');
  assert.ok(demo.purpose && demo.purpose.length > 0);
  assert.ok(demo.audience && demo.audience.length > 0);
  assert.equal(demo.docPath, 'docs/how-to/check-rollup-progress.md');
  assert.equal(demo.title, "How to check a root item's progress with `fgos rollup`");
  // Slice ① gộp-sống (CONTEXT.md D13/D16/D17) links this demo doc to its
  // real compound-learn capture via `fgos compound doc-fgos-rollup-howto
  // --doc-type how-to --doc-path docs/how-to/check-rollup-progress.md` —
  // CoS-3 evidence, not a fabricated id (the real event log now carries it).
  assert.equal(demo.sourceCaptureId, 'doc-fgos-rollup-howto');
});

test('fgos docs-index tolerates missing quadrant dirs (tutorials/reference/explanation absent today) with no crash and no entries from them', () => {
  for (const quadrant of ['tutorials', 'reference', 'explanation']) {
    assert.ok(
      !fs.existsSync(path.join(REPO_ROOT, 'docs', quadrant)),
      `expected docs/${quadrant} to be absent today — validation constraint (a) assumes this`,
    );
  }
  const result = runDocsIndex();
  assert.equal(result.status, 0, result.stderr);
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  for (const entry of manifest) {
    assert.notEqual(entry.quadrant, 'tutorials');
    assert.notEqual(entry.quadrant, 'reference');
    assert.notEqual(entry.quadrant, 'explanation');
  }
});

test('fgos docs-index is idempotent — re-running yields the same entries, no duplicate docPath/sourceCaptureId pairs', () => {
  const first = runDocsIndex();
  assert.equal(first.status, 0, first.stderr);
  const manifestAfterFirst = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

  const second = runDocsIndex();
  assert.equal(second.status, 0, second.stderr);
  const manifestAfterSecond = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

  assert.equal(manifestAfterSecond.length, manifestAfterFirst.length);
  const keys = manifestAfterSecond.map((e) => `${e.docPath}::${e.sourceCaptureId}`);
  assert.equal(new Set(keys).size, keys.length, 'no duplicate docPath/sourceCaptureId pairs after a re-run');
  assert.deepEqual(manifestAfterSecond, manifestAfterFirst);
});
