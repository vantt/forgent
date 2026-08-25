import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { buildEnduserIndex, findSourceCaptureId, findSourceCaptureIds, QUADRANT_META, QUADRANTS } from '../../src/report/enduser-index.mjs';
import { parseFrontmatter } from '../../src/report/frontmatter.mjs';

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

// tsk-63j: a fresh fgOS worktree deliberately strips `.fgos/` down to a
// lock file (worktree.mjs's own createSession/removeWorktree symlink
// discipline) — the real compound-learn history the demo assertion below
// checks (`doc-fgos-rollup-howto`) only exists in a checkout that actually
// carries `.fgos/state.json`'s real event history (the main checkout, or a
// worktree reclaiming it). Detecting that absence and skipping ONLY that
// one assertion — never fabricating the id as a fixture — keeps this
// test's own "not a fabricated id" intent (see the demo test's comment)
// intact while making it worktree-safe.
function hasRealCompoundHistory(outcomeId) {
  try {
    const statePath = path.join(REPO_ROOT, '.fgos', 'state.json');
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    return Boolean(state.outcomes?.[outcomeId]);
  } catch {
    return false;
  }
}

// tsk-2ce: `runDocsIndex()` above deliberately writes the REAL tracked
// MANIFEST_PATH (no proxy, see its own comment) -- run from a linked
// worktree (no `.fgos/`, ADR0020) the outcomes view it folds is empty, so
// every sourceCaptureId in the regenerated file comes back null and a
// plain `npm test` leaves the tracked file dirty with degraded content.
// Snapshotting the real content here and restoring it once the whole
// suite finishes keeps every assertion below reading the real freshly
// regenerated manifest during the run, while leaving no side effect on
// disk afterward -- npm test verifies, it does not regenerate (that is
// `fgos-indexing`'s own deliberate, separate action). Plain fs, no git,
// mirrors this file's own tutorialsDir/hiddenDir rename-then-restore
// precedent below.
let manifestSnapshot;

before(() => {
  try {
    manifestSnapshot = fs.readFileSync(MANIFEST_PATH, 'utf8');
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
    manifestSnapshot = undefined;
  }
});

after(() => {
  if (manifestSnapshot === undefined) {
    fs.rmSync(MANIFEST_PATH, { force: true });
  } else {
    fs.writeFileSync(MANIFEST_PATH, manifestSnapshot, 'utf8');
  }
});

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

test('findSourceCaptureIds returns ALL outcome ids whose docPath matches, in stable insertion order (no-loss gather)', () => {
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
  // Only asserted when this checkout actually carries that real history
  // (tsk-63j: a fresh worktree's `.fgos/` never does — see
  // hasRealCompoundHistory's comment above).
  if (hasRealCompoundHistory('doc-fgos-rollup-howto')) {
    assert.equal(demo.sourceCaptureId, 'doc-fgos-rollup-howto');
  }
});

test('fgos docs-index tolerates a missing quadrant dir (tutorials has no alias) with no crash and no entries from it', () => {
  // Every real Diataxis quadrant dir is now populated with real content
  // (explanation: str64-backfill-3; reference/tutorials: tsk-3wr-3/tsk-3wr's
  // own compound-learn captures) — this repo will likely never again have a
  // quadrant dir that is naturally absent on disk. Per this file's own rule
  // (no fake/temp-copy fixture), this test still exercises the REAL
  // docs/tutorials dir and the real generator — it just constructs the
  // missing-dir condition itself, renaming the real dir aside for the
  // test's duration and unconditionally restoring it afterward, rather than
  // depending on ambient repo state to happen to have an empty quadrant.
  // tutorials is picked because it has no alias (D2's alias is
  // explanation-only), so hiding its one real dir fully empties the
  // quadrant with no second source left to populate it.
  const tutorialsDir = path.join(REPO_ROOT, 'docs', 'tutorials');
  const hiddenDir = path.join(REPO_ROOT, 'docs', '.tutorials-hidden-for-test');
  assert.ok(fs.existsSync(tutorialsDir), 'expected docs/tutorials to exist today so this test can hide it');
  // tsk-f31: snapshot the manifest as it stood before this test's own
  // docs-index call, so it can be restored verbatim afterward — not just
  // the directory. Otherwise this test's own transient write (tutorials
  // genuinely absent) becomes the "previous" state a LATER store-unreachable
  // run reads back from, permanently losing a real sourceCaptureId that was
  // never actually lost, only hidden mid-suite.
  const manifestBefore = fs.existsSync(MANIFEST_PATH) ? fs.readFileSync(MANIFEST_PATH, 'utf8') : undefined;
  fs.renameSync(tutorialsDir, hiddenDir);
  try {
    const result = runDocsIndex();
    assert.equal(result.status, 0, result.stderr);
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    for (const entry of manifest) {
      assert.notEqual(entry.quadrant, 'tutorials');
    }
  } finally {
    if (manifestBefore !== undefined) fs.writeFileSync(MANIFEST_PATH, manifestBefore, 'utf8');
    else fs.rmSync(MANIFEST_PATH, { force: true });
    fs.renameSync(hiddenDir, tutorialsDir);
  }
});

// --- tsk-f31: docs-index on an unreachable store (no --dir, no REPO_ROOT --
// each test builds its own fully isolated tmpDir; dataDir()'s strict path
// (bin/fgos.mjs) returns cwd as-is with no git command run at all, so a
// plain, git-free temp dir works as both repoRoot and .fgos root) ----------

function tmpFixtureCwd() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-docs-index-fixture-'));
}

function runDocsIndexAt(cwd) {
  return spawnSync(process.execPath, [FGOS, 'docs-index'], { cwd, encoding: 'utf8' });
}

test('fgos docs-index on an unreachable store preserves an existing prior sourceCaptureId instead of nulling it', () => {
  const cwd = tmpFixtureCwd();
  fs.mkdirSync(path.join(cwd, 'docs', 'how-to'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'docs', 'how-to', 'hello.md'), '# Hello\n');
  fs.mkdirSync(path.join(cwd, '.fgos'));
  fs.writeFileSync(path.join(cwd, '.fgos', 'main-checkout.lock'), '');
  fs.writeFileSync(
    path.join(cwd, 'docs', 'enduser-docs-index.json'),
    `${JSON.stringify(
      [
        {
          quadrant: 'how-to',
          purpose: QUADRANT_META['how-to'].purpose,
          audience: QUADRANT_META['how-to'].audience,
          docPath: 'docs/how-to/hello.md',
          title: 'Hello',
          sourceCaptureId: 'tsk-real-capture',
        },
      ],
      null,
      2,
    )}\n`,
  );

  const result = runDocsIndexAt(cwd);
  assert.equal(result.status, 0, result.stderr);
  const manifest = JSON.parse(fs.readFileSync(path.join(cwd, 'docs', 'enduser-docs-index.json'), 'utf8'));
  assert.equal(manifest[0].sourceCaptureId, 'tsk-real-capture', 'an unreachable store must not regress a real prior id to null');
});

test('fgos docs-index on an unreachable store with no prior manifest value stays null (nothing to preserve)', () => {
  const cwd = tmpFixtureCwd();
  fs.mkdirSync(path.join(cwd, 'docs', 'how-to'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'docs', 'how-to', 'hello.md'), '# Hello\n');
  fs.mkdirSync(path.join(cwd, '.fgos'));
  fs.writeFileSync(path.join(cwd, '.fgos', 'main-checkout.lock'), '');
  assert.ok(!fs.existsSync(path.join(cwd, 'docs', 'enduser-docs-index.json')), 'first-ever run: no prior manifest');

  const result = runDocsIndexAt(cwd);
  assert.equal(result.status, 0, result.stderr);
  const manifest = JSON.parse(fs.readFileSync(path.join(cwd, 'docs', 'enduser-docs-index.json'), 'utf8'));
  assert.equal(manifest[0].sourceCaptureId, null);
});

test('fgos docs-index run twice in a row against the same unreachable store converges (R7 survives tsk-f31): no second write', () => {
  const cwd = tmpFixtureCwd();
  fs.mkdirSync(path.join(cwd, 'docs', 'how-to'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'docs', 'how-to', 'hello.md'), '# Hello\n');
  fs.mkdirSync(path.join(cwd, '.fgos'));
  fs.writeFileSync(path.join(cwd, '.fgos', 'main-checkout.lock'), '');
  fs.writeFileSync(
    path.join(cwd, 'docs', 'enduser-docs-index.json'),
    `${JSON.stringify(
      [
        {
          quadrant: 'how-to',
          purpose: QUADRANT_META['how-to'].purpose,
          audience: QUADRANT_META['how-to'].audience,
          docPath: 'docs/how-to/hello.md',
          title: 'Hello',
          sourceCaptureId: 'tsk-real-capture',
        },
      ],
      null,
      2,
    )}\n`,
  );
  const manifestPath = path.join(cwd, 'docs', 'enduser-docs-index.json');

  const run1 = runDocsIndexAt(cwd);
  assert.equal(run1.status, 0, run1.stderr);
  const afterRun1 = fs.readFileSync(manifestPath, 'utf8');
  const mtimeAfterRun1 = fs.statSync(manifestPath).mtimeMs;

  const run2 = runDocsIndexAt(cwd);
  assert.equal(run2.status, 0, run2.stderr);
  const afterRun2 = fs.readFileSync(manifestPath, 'utf8');
  const mtimeAfterRun2 = fs.statSync(manifestPath).mtimeMs;

  assert.equal(afterRun2, afterRun1, 'two consecutive unreachable-store runs must converge to byte-identical content');
  assert.equal(mtimeAfterRun2, mtimeAfterRun1, 'the second run must not rewrite the file (write-only-if-changed)');
});

test('fgos docs-index reads BOTH the docs/decisions/ alias and the primary docs/explanation/ dir into the explanation quadrant, tagged by quadrant name not source dir name', () => {
  const result = runDocsIndex();
  assert.equal(result.status, 0, result.stderr);
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

  const explanationEntries = manifest.filter((e) => e.quadrant === 'explanation');
  const decisionsCount = fs.readdirSync(path.join(REPO_ROOT, 'docs', 'decisions')).filter((f) => f.endsWith('.md')).length;
  const primaryExplanationCount = fs.readdirSync(path.join(REPO_ROOT, 'docs', 'explanation')).filter((f) => f.endsWith('.md')).length;
  assert.equal(
    explanationEntries.length,
    decisionsCount + primaryExplanationCount,
    'every .md file under docs/decisions/ (alias) plus every .md file under docs/explanation/ (primary dir) must appear as one explanation-quadrant entry each',
  );
  for (const entry of explanationEntries) {
    assert.ok(
      entry.docPath.startsWith('docs/decisions/') || entry.docPath.startsWith('docs/explanation/'),
      `docPath must stay under a real on-disk dir for this quadrant: ${entry.docPath}`,
    );
    assert.equal(entry.purpose, QUADRANT_META.explanation.purpose);
    assert.equal(entry.audience, QUADRANT_META.explanation.audience);
  }
  // tsk-1lv-4: the hand-authored ADR corpus (including 0001) was retired --
  // docs/decisions/ now holds only the generated index.md (fgos
  // decision-index, tsk-1lv-2), which is itself an explanation-quadrant doc
  // via the same alias (it carries `type: explanation` frontmatter for
  // exactly this reason -- see the next test below).
  const generatedIndex = explanationEntries.find((e) => e.docPath === 'docs/decisions/index.md');
  assert.ok(generatedIndex, 'the generated docs/decisions/index.md must appear in the manifest via the alias');
  const primaryDoc = explanationEntries.find((e) => e.docPath.startsWith('docs/explanation/'));
  assert.ok(primaryDoc, 'at least one backfilled docs/explanation/ doc must appear via the primary dir');
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

// --- retrofitted OKF frontmatter on the backfilled ADRs + the existing
// how-to demo doc (str64-backfill, CONTEXT.md D3) ---------------------------
// tsk-1lv-4: the hand-authored ADR corpus this section originally covered
// is retired -- docs/decisions/ now holds only the generated index.md
// (fgos decision-index), which keeps this same invariant alive under its
// own `type: explanation` frontmatter (src/report/decision-index.mjs).

test('every repo/docs/decisions/*.md file parses with parseFrontmatter to a non-empty meta.type', () => {
  const decisionsDir = path.join(REPO_ROOT, 'docs', 'decisions');
  const files = fs.readdirSync(decisionsDir).filter((f) => f.endsWith('.md'));
  assert.ok(files.length > 0, 'expected at least one .md file under docs/decisions/ (today: the generated index.md)');
  for (const file of files) {
    const content = fs.readFileSync(path.join(decisionsDir, file), 'utf8');
    const { meta } = parseFrontmatter(content);
    assert.ok(meta.type && meta.type.length > 0, `${file} must have a non-empty frontmatter type`);
    assert.equal(meta.type, 'explanation', `${file}'s frontmatter type must be 'explanation'`);
  }
});

test("docs/how-to/check-rollup-progress.md's frontmatter has a non-empty type and links source_capture_ids to doc-fgos-rollup-howto", () => {
  const content = fs.readFileSync(path.join(REPO_ROOT, 'docs', 'how-to', 'check-rollup-progress.md'), 'utf8');
  const { meta } = parseFrontmatter(content);
  assert.ok(meta.type && meta.type.length > 0);
  assert.equal(meta.type, 'how-to');
  assert.ok(Array.isArray(meta.source_capture_ids));
  assert.ok(meta.source_capture_ids.includes('doc-fgos-rollup-howto'));
});

test('findSourceCaptureIds resolves oldPath and currentPath through resolver stateView', () => {
  const outcomesView = {
    'item-1': { docPath: 'docs/old/guide.md' },
    'item-2': { docPath: 'docs/new/guide.md' },
  };

  const stateView = {
    topics: { t1: { topicId: 't1', status: 'active' } },
    docs: {
      't1:guide': {
        docId: 't1:guide',
        topicId: 't1',
        role: 'guide',
        currentPath: 'docs/new/guide.md',
        aliases: ['docs/old/guide.md'],
        docLifecycle: 'active',
      },
    },
  };

  const capturesOld = findSourceCaptureIds(outcomesView, 'docs/old/guide.md', stateView);
  const capturesNew = findSourceCaptureIds(outcomesView, 'docs/new/guide.md', stateView);

  assert.deepEqual(capturesOld.sort(), ['item-1', 'item-2']);
  assert.deepEqual(capturesNew.sort(), ['item-1', 'item-2']);
});

