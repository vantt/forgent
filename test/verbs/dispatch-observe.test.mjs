import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { showRunUseCase, findRunDir, readRunSnapshot, listOutbox } from '../../src/verbs/dispatch/show-run.mjs';
import { watchRunUseCase, tailLog } from '../../src/verbs/dispatch/watch.mjs';
import { writeVisibility, markRunSettled } from '../../src/runner/dispatch/visibility-session.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..');

function makeRepo({ runId = 'run_1', status = 'running', outbox = [], log = null } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-observe-'));
  const runDir = path.join(root, '.fgos', 'assignments', 'asgn_1', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'run.json'), JSON.stringify({ runId, assignmentId: 'asgn_1', status }, null, 2));
  if (outbox.length > 0) {
    fs.mkdirSync(path.join(runDir, 'outbox'), { recursive: true });
    for (const name of outbox) fs.writeFileSync(path.join(runDir, 'outbox', name), 'x');
  }
  if (log) fs.writeFileSync(path.join(runDir, 'stdout.log'), log);
  return { root, runDir };
}

const cleanup = (root) => fs.rmSync(root, { recursive: true, force: true });

// The guarantee that matters most for an observe door is not that it behaves,
// but that it CANNOT misbehave. Both modules are checked for any route to a
// write into somebody else's pane, including through what they import.

test('neither observe module can reach a pane -- no client, no adapter, no send', () => {
  const forbidden = [
    /agent\s+prompt/, /send-keys/, /send-text/, /pane\s+run/,
    /createHerdrClient/, /herdr-agent\.mjs/, /transport\.mjs/, /execFileSync/, /\bspawn\b/,
  ];
  for (const file of ['src/verbs/dispatch/show-run.mjs', 'src/verbs/dispatch/watch.mjs']) {
    const src = fs.readFileSync(path.join(REPO, file), 'utf8');
    // Strip comments: the header explains what these doors must never do, and
    // naming a thing in prose is not a code path to it.
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    for (const pattern of forbidden) {
      assert.doesNotMatch(code, pattern, `${file} must not be able to reach ${pattern}`);
    }
  }
});

test('show-run finds a run by its id and reports what is on disk', () => {
  const { root, runDir } = makeRepo({ outbox: ['ack-1.json', 'report-1.md'] });
  try {
    writeVisibility(runDir, { status: 'working', paneId: 'wS:p9', agentSession: { value: 'sess-1' } });
    const out = showRunUseCase({ repoRoot: root }, { runId: 'run_1' });
    assert.equal(out.runId, 'run_1');
    assert.equal(out.run.status, 'running');
    assert.equal(out.visibility.paneId, 'wS:p9');
    assert.deepEqual(out.outbox.map((f) => f.name), ['ack-1.json', 'report-1.md']);
    assert.ok(out.outbox[0].modifiedAt, 'names, sizes and times -- never the contents');
  } finally { cleanup(root); }
});

test('a run with no pane still reads cleanly -- visibility is optional, not missing', () => {
  const { root } = makeRepo();
  try {
    const out = showRunUseCase({ repoRoot: root }, { runId: 'run_1' });
    assert.equal(out.visibility, null, 'a cli-spawn dispatch never had a pane to record');
    assert.deepEqual(out.outbox, []);
  } finally { cleanup(root); }
});

test('a corrupt visibility file degrades to a stated error instead of taking the reading down', () => {
  const { root, runDir } = makeRepo();
  try {
    fs.writeFileSync(path.join(runDir, 'visibility.json'), 'not json');
    const out = readRunSnapshot(runDir);
    assert.equal(out.run.status, 'running');
    assert.match(out.visibilityError, /not valid JSON/);
  } finally { cleanup(root); }
});

test('an unknown run id says so rather than returning an empty reading', () => {
  const { root } = makeRepo();
  try {
    assert.throws(() => showRunUseCase({ repoRoot: root }, { runId: 'run_nope' }), (e) => e.code === 'run-not-found');
    assert.throws(() => showRunUseCase({ repoRoot: root }, {}), (e) => e.code === 'invalid-run-id');
    assert.equal(findRunDir(root, 'run_nope'), null);
  } finally { cleanup(root); }
});

test('watch follows a run driven by somebody else and stops when that run stops', async () => {
  const { root, runDir } = makeRepo({ log: 'first\nsecond\nthird\n' });
  try {
    const seen = [];
    // Another process settles the run between readings -- exactly the shape
    // this door exists for: the watcher never touches it, it just notices.
    const sleepFn = async () => {
      if (seen.length === 2) markRunSettled(runDir);
    };
    const out = await watchRunUseCase({ repoRoot: root }, {
      runId: 'run_1',
      maxTicks: 10,
      onTick: (t) => seen.push(t.run.status),
      sleepFn,
    });
    assert.deepEqual(seen, ['running', 'running', 'settled']);
    assert.equal(out.stoppedBecause, 'terminal');
    assert.equal(out.run.status, 'settled');
    assert.deepEqual(out.tail, ['first', 'second', 'third']);
  } finally { cleanup(root); }
});

test('a watcher that runs out of ticks says so, rather than implying the run ended', async () => {
  const { root } = makeRepo();
  try {
    const out = await watchRunUseCase({ repoRoot: root }, { runId: 'run_1', maxTicks: 3, sleepFn: async () => {}, onTick: () => {} });
    assert.equal(out.ticks, 3);
    assert.equal(out.stoppedBecause, 'tick-budget');
    assert.equal(out.run.status, 'running', 'the run is still going; the watching stopped');
  } finally { cleanup(root); }
});

test('an aborted watcher is distinguished from a finished run too', async () => {
  const { root } = makeRepo();
  try {
    const controller = new AbortController();
    const out = await watchRunUseCase({ repoRoot: root }, {
      runId: 'run_1',
      maxTicks: 10,
      signal: controller.signal,
      onTick: () => controller.abort(),
      sleepFn: async () => {},
    });
    assert.equal(out.stoppedBecause, 'aborted');
  } finally { cleanup(root); }
});

test('a run that reconciled to unknown is terminal for a watcher -- there is nothing more to see', async () => {
  const { root } = makeRepo({ status: 'unknown' });
  try {
    const out = await watchRunUseCase({ repoRoot: root }, { runId: 'run_1', maxTicks: 5, onTick: () => {}, sleepFn: async () => {} });
    assert.equal(out.ticks, 1);
    assert.equal(out.stoppedBecause, 'terminal');
  } finally { cleanup(root); }
});

test('reading a log or an outbox that does not exist yet is normal, not an error', () => {
  const { root, runDir } = makeRepo();
  try {
    assert.deepEqual(tailLog(runDir), []);
    assert.deepEqual(listOutbox(runDir), []);
  } finally { cleanup(root); }
});
