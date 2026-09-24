import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { collectPerFileCoverage } from '../../scripts/test-select-coverage-map.mjs';

function fixtureRepo(files) {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'coverage-map-fixture-'));
  for (const [rel, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(repoRoot, rel)), { recursive: true });
    fs.writeFileSync(path.join(repoRoot, rel), content);
  }
  return repoRoot;
}

const PASSING = "import { test } from 'node:test'; import { one } from '../src/one.mjs'; test('ok', () => { if (one() !== 1) throw new Error('x'); });\n";
const FAILING = "import { test } from 'node:test'; test('red', () => { throw new Error('red'); });\n";
// Hangs forever unless killed, and keeps a grandchild alive too -- a timeout
// must take down the whole process group, not just the direct child.
const HANGING = "import { spawn } from 'node:child_process'; spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' }); setInterval(() => {}, 1000);\n";

test('a file that hangs is recorded as coverage-collection-timeout and collection continues with the others', async () => {
  const repoRoot = fixtureRepo({
    'src/one.mjs': 'export function one() { return 1; }\n',
    'test/a-hang.test.mjs': HANGING,
    'test/b-pass.test.mjs': PASSING,
    'test/c-fail.test.mjs': FAILING,
  });
  const covRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'coverage-map-cov-'));
  try {
    const files = ['a-hang', 'b-pass', 'c-fail'].map((n) => path.join(repoRoot, 'test', `${n}.test.mjs`));
    const seen = [];
    const startedAt = Date.now();
    const { results } = await collectPerFileCoverage(files, {
      repoRoot, covRoot, timeoutMs: 1500, concurrency: 1,
      onResult: (r, done, total) => seen.push(`${done}/${total}`),
    });
    const byFile = Object.fromEntries(results.map((r) => [r.file, r.outcome]));
    assert.deepEqual(byFile, {
      'test/a-hang.test.mjs': 'coverage-collection-timeout',
      'test/b-pass.test.mjs': 'ok',
      'test/c-fail.test.mjs': 'test-failed',
    });
    assert.deepEqual(seen, ['1/3', '2/3', '3/3'], 'progress is reported once per file');
    assert.ok(Date.now() - startedAt < 20000, 'the hang cost roughly one timeout, not the whole run');

    const passCov = results.find((r) => r.file === 'test/b-pass.test.mjs').covDir;
    const profiles = fs.readdirSync(passCov).filter((f) => f.endsWith('.json'));
    assert.ok(profiles.length > 0, 'a finished file leaves its own V8 coverage profile');
    const urls = profiles.flatMap((f) => JSON.parse(fs.readFileSync(path.join(passCov, f), 'utf8')).result.map((r) => r.url));
    assert.ok(urls.some((u) => u.endsWith('/src/one.mjs')), 'the per-file profile names the source the test loaded');
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
    fs.rmSync(covRoot, { recursive: true, force: true });
  }
});

test('files run at most `concurrency` at a time, and more than one at a time when allowed', async () => {
  const markDir = fs.mkdtempSync(path.join(os.tmpdir(), 'coverage-map-marks-'));
  // Each file records when it started and ended; overlap is computed from
  // those real timestamps, not inferred from callback order.
  const slow = (n) => `import fs from 'node:fs'; import { test } from 'node:test';
test('slow', async () => {
  const start = Date.now();
  await new Promise((r) => setTimeout(r, 600));
  fs.writeFileSync(${JSON.stringify(markDir)} + '/${n}.json', JSON.stringify({ start, end: Date.now() }));
});
`;
  const repoRoot = fixtureRepo(Object.fromEntries([1, 2, 3, 4].map((n) => [`test/s${n}.test.mjs`, slow(n)])));
  const covRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'coverage-map-cov-'));
  try {
    const files = [1, 2, 3, 4].map((n) => path.join(repoRoot, 'test', `s${n}.test.mjs`));
    const { results } = await collectPerFileCoverage(files, { repoRoot, covRoot, timeoutMs: 30000, concurrency: 2 });
    assert.ok(results.every((r) => r.outcome === 'ok'), JSON.stringify(results));
    const spans = [1, 2, 3, 4].map((n) => JSON.parse(fs.readFileSync(path.join(markDir, `${n}.json`), 'utf8')));
    const peak = Math.max(...spans.map((a) => spans.filter((b) => b.start < a.end && a.start < b.end).length));
    assert.equal(peak, 2, `expected exactly 2 files overlapping at the peak, got ${peak}`);
  } finally {
    for (const d of [repoRoot, covRoot, markDir]) fs.rmSync(d, { recursive: true, force: true });
  }
});
