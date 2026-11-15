import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { discoverTestFiles, REPO_ROOT } from '../../scripts/run-tests.mjs';
import { readSuiteBaseline } from '../../scripts/test-proof-inventory.mjs';
import { countXmlCases } from '../../scripts/write-test-marker.mjs';
import { mergeShards } from '../../scripts/merge-test-shards.mjs';
import { runCompare } from '../../scripts/test-select-compare.mjs';
import { checkShardSet, junitFiles, junitSeconds, measuredImbalance, mergeJunit, parseShard, partitionFiles, repoRelative, shardLoads } from '../../scripts/lib/test-shards.mjs';

const MERGE_CLI = fileURLToPath(new URL('../../scripts/merge-test-shards.mjs', import.meta.url));

function fixtureDir() {
  return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-shards-')));
}

// Runs node's own test runner with the junit reporter over `files` and returns the report text, as CI does
// (outside the surrounding run's context, which would make the child report to its parent instead).
function realJunit(dir, files) {
  const xml = path.join(dir, `report-${files.join('-').replaceAll(/\W/g, '')}.xml`);
  spawnSync(process.execPath, ['--test', '--test-reporter=junit', `--test-reporter-destination=${xml}`, ...files.map((f) => path.join(dir, f))], { cwd: dir, stdio: 'ignore', env: { ...process.env, NODE_TEST_CONTEXT: undefined } });
  return fs.readFileSync(xml, 'utf8');
}

const FIXTURES = {
  'ok.test.mjs': "import test from 'node:test';\ntest('passes', () => {});\n",
  'fails.test.mjs': "import test from 'node:test';\ntest('breaks', () => { throw new Error('x'); });\n",
  'throws-on-import.test.mjs': "import test from 'node:test';\nthrow new Error('boom');\n",
  'all-skipped.test.mjs': "import test from 'node:test';\ntest('skipped', { skip: true }, () => {});\n",
  'no-test-call.test.mjs': 'const unused = 1;\n',
};

function writeFixtures(dir) {
  for (const [name, text] of Object.entries(FIXTURES)) fs.writeFileSync(path.join(dir, name), text);
}

// Deterministic Fisher-Yates over a small LCG, so a failure reproduces.
function shuffled(list, seed) {
  const out = [...list];
  let state = seed * 2654435761 >>> 0;
  for (let i = out.length - 1; i > 0; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = state % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

test('every discovered test file lands in exactly one shard for 1 to 8 shards, whatever the input order', () => {
  const files = discoverTestFiles().map((f) => repoRelative(REPO_ROOT, f));
  const weights = readSuiteBaseline().fileCpu;
  assert.ok(files.length > 100);
  for (let total = 1; total <= 8; total++) {
    const shards = partitionFiles(files, total, weights);
    assert.equal(shards.length, total);
    assert.deepEqual(shards.flat().sort(), files);
    assert.equal(new Set(shards.flat()).size, files.length, `a file is in two of ${total} shards`);
    assert.deepEqual(partitionFiles(shuffled(files, total), total, weights), shards);
  }
});

test('a file without a recorded duration weighs the mean of the known ones, and no durations at all weigh every file the same', () => {
  const files = ['a', 'b', 'c', 'd'];
  // a and b weigh 10 each, so mean 10: c and d weigh 10 too and the four spread two and two.
  assert.deepEqual(shardLoads(files, 2, { a: 10, b: 10 }), [20, 20]);
  assert.deepEqual(partitionFiles(files, 2, { a: 10, b: 10 }), [['a', 'c'], ['b', 'd']]);
  assert.deepEqual(partitionFiles(files, 2), [['a', 'c'], ['b', 'd']]);
  assert.deepEqual(partitionFiles(['x'], 3), [['x'], [], []]);
  assert.throws(() => partitionFiles(files, 0), /integer >= 1/);
  assert.deepEqual(parseShard('2/5'), { index: 2, total: 5 });
  for (const bad of ['0/3', '4/3', 'x', '1/0', '1/2/3', '']) assert.throws(() => parseShard(bad), new RegExp(`invalid shard "${bad}"`));
});

test('the shard check names a missing file, a file in two shards, a missing shard, a repeated shard and disagreeing totals', () => {
  const shard = (index, total, ...files) => ({ index, total, files: new Set(files) });
  assert.deepEqual(checkShardSet(['a', 'b', 'c'], [shard(1, 2, 'a', 'b'), shard(2, 2, 'c')]), []);
  assert.deepEqual(checkShardSet(['a', 'b'], [shard(1, 2, 'a')]), ['shard 2/2 reported no result', 'b ran in no shard']);
  assert.deepEqual(checkShardSet(['a', 'b'], [shard(1, 2, 'a', 'b'), shard(2, 2, 'b')]), ['b ran in more than one shard: 1/2, 2/2']);
  assert.deepEqual(checkShardSet(['a'], [shard(1, 1, 'a', 'stray.test.mjs')]), ['stray.test.mjs ran in shard 1/1 but is not a discovered test file']);
  assert.deepEqual(checkShardSet(['a'], [shard(1, 2, 'a'), shard(1, 2)]), ['shard 2/2 reported no result', 'shard 1/2 reported 2 times']);
  assert.ok(checkShardSet(['a'], [shard(1, 2, 'a'), shard(2, 3)]).some((p) => p.startsWith('shards disagree on the total: 2, 3')));
  assert.deepEqual(checkShardSet(['a'], []), ['no shard result reported']);
});

test('a file that throws on import, has only skipped tests or has no test() call still reports under its own name in the real junit report, so the exact-set check neither misses nor invents a file', () => {
  const dir = fixtureDir();
  writeFixtures(dir);
  const names = Object.keys(FIXTURES).sort();
  const xml = realJunit(dir, names);
  assert.deepEqual([...junitFiles(xml, dir)].sort(), names);
  // Every file reports a case with a file attribute, a failing import included, so nothing needs an exemption.
  assert.match(xml, /file="[^"]*throws-on-import\.test\.mjs" failure="test failed"/);
  assert.match(xml, /file="[^"]*all-skipped\.test\.mjs"[^>]*>\s*<skipped/);
  assert.match(xml, /name="[^"]*no-test-call\.test\.mjs"[^>]*file="[^"]*no-test-call\.test\.mjs"/);
  assert.deepEqual(checkShardSet(names, [{ index: 1, total: 1, files: junitFiles(xml, dir) }]), []);

  // A file that never reported (its process died before any report) is named, not matched by accident.
  const without = names.filter((n) => n !== 'throws-on-import.test.mjs');
  const partial = junitFiles(realJunit(dir, without), dir);
  assert.deepEqual(checkShardSet(names, [{ index: 1, total: 1, files: partial }]), ['throws-on-import.test.mjs ran in no shard']);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('junit paths lose exactly the checkout prefix they were produced under, even when a test path holds /test/ twice or lies outside it', () => {
  const report = (...files) => `<testsuites>${files.map((f) => `<testcase name="n" file="${f}"/>`).join('')}</testsuites>`;
  const root = '/home/runner/work/forgent/forgent';
  assert.deepEqual([...junitFiles(report(`${root}/test/a/test/b.test.mjs`, `${root}/test/c.test.mjs`), root)].sort(), ['test/a/test/b.test.mjs', 'test/c.test.mjs']);
  // Another checkout location, and Windows separators with an XML-escaped name.
  assert.deepEqual([...junitFiles(report('C:\\w\\fg\\test\\a&amp;b.test.mjs'), 'C:\\w\\fg\\')], ['test/a&b.test.mjs']);
  // A path outside the root, or one that only shares a name prefix with it, is kept whole so the check names it.
  assert.deepEqual([...junitFiles(report('/elsewhere/test/x.test.mjs', `${root}-other/test/y.test.mjs`), root)].sort(), ['/elsewhere/test/x.test.mjs', `${root}-other/test/y.test.mjs`]);
});

test('merged junit is one flat testsuites root holding every case of every shard and none of their count comments', () => {
  const dir = fixtureDir();
  writeFixtures(dir);
  const first = realJunit(dir, ['ok.test.mjs', 'fails.test.mjs']);
  const second = realJunit(dir, ['throws-on-import.test.mjs', 'all-skipped.test.mjs', 'no-test-call.test.mjs']);
  const merged = mergeJunit([first, second]);
  const file = path.join(dir, 'merged.xml');
  fs.writeFileSync(file, merged);
  assert.equal(countXmlCases(file), 5);
  assert.equal(merged.match(/<testsuites\b/g).length, 1);
  assert.equal(merged.match(/<\/testsuites>/g).length, 1);
  assert.equal(merged.includes('<!--'), false);
  assert.deepEqual([...junitFiles(merged, dir)].sort(), Object.keys(FIXTURES).sort());
  assert.throws(() => mergeJunit(['<nope/>']), /no <testsuites> root/);
  assert.equal(mergeJunit(['<testsuites/>']).includes('<testcase'), false);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('the compare job reaches the same verdict from the merged shard reports as from one unsharded report of the same run', async () => {
  const dir = fixtureDir();
  writeFixtures(dir);
  const names = Object.keys(FIXTURES).sort();
  const whole = realJunit(dir, names);
  const merged = mergeJunit([realJunit(dir, names.slice(0, 2)), realJunit(dir, names.slice(2))]);
  const marker = path.join(dir, 'marker.json');
  fs.writeFileSync(marker, JSON.stringify({ completed: true, reportedCases: 5, exitCode: 1 }));
  const verdict = async (xml) => {
    const full = path.join(dir, `full-${xml.length}.xml`);
    fs.writeFileSync(full, xml);
    const { ledger } = await runCompare({
      plan: { decision: 'related', selectedFiles: ['fails.test.mjs'], matchedRules: [], changedPaths: [] },
      baseJunit: path.join(dir, 'absent-base.xml'),
      fullJunitUbuntu: full,
      fullJunitMacos: full,
      fullJunitWindows: full,
      relatedJunit: path.join(dir, 'absent-related.xml'),
      fullMarkerUbuntu: marker,
      fullMarkerMacos: marker,
      fullMarkerWindows: marker,
      ledgerOut: path.join(dir, 'ledger.json'),
      noExit: true,
    });
    return ledger.caseResults;
  };
  const expected = await verdict(whole);
  assert.ok(Object.keys(expected).includes('breaks'), 'the failing case is classified at all');
  assert.deepEqual(await verdict(merged), expected);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('the merge writes full.xml when the shards ran every file once, and fails by name when a shard result is missing or incomplete', () => {
  const dir = fixtureDir();
  writeFixtures(dir);
  const names = Object.keys(FIXTURES).sort();
  const shards = path.join(dir, 'shards');
  const put = (k, n, files, marker) => {
    const sub = path.join(shards, `test-shard-${k}`);
    fs.mkdirSync(sub, { recursive: true });
    fs.writeFileSync(path.join(sub, `shard-${k}-of-${n}.xml`), realJunit(dir, files));
    if (marker) fs.writeFileSync(path.join(sub, 'test-marker.json'), JSON.stringify(marker));
  };
  const done = { completed: true, exitCode: 0 };
  put(1, 2, names.slice(0, 2), { completed: true, exitCode: 1 });
  put(2, 2, names.slice(2), done);
  const out = path.join(dir, 'out');
  const ok = mergeShards({ dir: shards, out, repoRoot: dir, discovered: names });
  assert.deepEqual({ problems: ok.problems, exitCode: ok.exitCode }, { problems: [], exitCode: 1 }, 'a failing shard keeps its exit code');
  assert.equal(countXmlCases(path.join(out, 'full.xml')), 5);

  fs.rmSync(path.join(shards, 'test-shard-2'), { recursive: true });
  const missing = spawnSync(process.execPath, [MERGE_CLI, '--dir', shards, '--out', path.join(dir, 'out2')], { encoding: 'utf8' });
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /merge-test-shards: ERROR: shard 2\/2 reported no result/);

  put(2, 2, names.slice(2), null);
  const unvouched = mergeShards({ dir: shards, out, repoRoot: dir, discovered: names });
  assert.deepEqual(unvouched.problems, ['test-shard-2 has no completed test-marker.json']);
  assert.equal(unvouched.exitCode, 1);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('the merge reports the measured imbalance: the slowest shard\'s summed testcase time over the mean, and which shard it was', () => {
  const dir = fixtureDir();
  const xml = (...times) => `<testsuites>${times.map((t, i) => `<testsuite name="s" file="${dir}/t${i}.test.mjs"><testcase name="c" time="${t}" classname="c"/></testsuite>`).join('')}</testsuites>`;
  assert.equal(junitSeconds(xml(1.5, 2.5)), 4);
  const shards = path.join(dir, 'shards');
  for (const [k, body] of [[1, xml(10)], [2, xml(30)], [3, xml(20)]]) {
    const sub = path.join(shards, `test-shard-${k}`);
    fs.mkdirSync(sub, { recursive: true });
    fs.writeFileSync(path.join(sub, `shard-${k}-of-3.xml`), body);
    fs.writeFileSync(path.join(sub, 'test-marker.json'), JSON.stringify({ completed: true, exitCode: 0 }));
  }
  const { imbalance } = mergeShards({ dir: shards, out: path.join(dir, 'out'), repoRoot: dir, discovered: ['t0.test.mjs'] });
  assert.equal(imbalance.slowest, 2);
  assert.equal(imbalance.ratio.toFixed(2), '1.50');
  const cli = spawnSync(process.execPath, [MERGE_CLI, '--dir', shards, '--out', path.join(dir, 'out2')], { encoding: 'utf8' });
  assert.match(cli.stdout, /merge-test-shards: imbalance max\/mean = \d\.\d\d \(shard 2 slowest\)/);
  assert.equal(measuredImbalance([]), null);
  fs.rmSync(dir, { recursive: true, force: true });
});
