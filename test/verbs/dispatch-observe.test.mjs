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
// but that it CANNOT misbehave. Grepping the two verb files for forbidden
// words was not that guarantee: it stopped at the file boundary, so a verb
// that imported a writer and called it stayed green. What follows walks the
// import graph and asks what NAMES are actually in scope along it.

/** Every relative module the given entry points can reach, with the set of
 * names each import binds. Bare specifiers ('node:fs', packages) are recorded
 * as-is: reaching `node:child_process` anywhere on this path would matter as
 * much as binding a writer. */
function importClosure(entryFiles) {
  const modules = new Map();
  const bindings = new Set();
  const bareSpecifiers = new Set();
  const namespaceImports = [];
  const queue = entryFiles.map((f) => path.resolve(REPO, f));

  while (queue.length > 0) {
    const file = queue.pop();
    if (modules.has(file)) continue;
    const src = fs.readFileSync(file, 'utf8');
    modules.set(file, src);
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

    for (const m of code.matchAll(/^import\s+([^;]*?)\s*from\s*['"]([^'"]+)['"]/gm)) {
      const clause = m[1].trim();
      const specifier = m[2];

      if (/^\*\s+as\s+/.test(clause)) namespaceImports.push(`${file} -> ${specifier}`);
      const named = clause.match(/\{([^}]*)\}/);
      if (named) {
        for (const part of named[1].split(',')) {
          const name = part.trim().split(/\s+as\s+/)[0].trim();
          if (name) bindings.add(name);
        }
      }

      if (specifier.startsWith('.')) {
        queue.push(path.resolve(path.dirname(file), specifier));
      } else {
        bareSpecifiers.add(specifier);
      }
    }
  }
  return { modules, bindings, bareSpecifiers, namespaceImports };
}

test('no observe door binds a name that could write, anywhere on its import path', () => {
  const closure = importClosure(['src/verbs/dispatch/show-run.mjs', 'src/verbs/dispatch/watch.mjs']);

  // Writers of the very files an observer reads. Observing and contacting are
  // separate capabilities and this door grants only the first, so none of
  // these may be in scope on any module it can reach.
  const writers = [
    'writeVisibility', 'markDetached', 'markRunSettled', 'reconcileRun',
    'createHerdrClient', 'EXECUTOR_ADAPTERS', 'runHerdrRound', 'spawnWorker',
  ];
  for (const name of writers) {
    assert.ok(!closure.bindings.has(name),
      `an observe door reaches ${name}; observing must not be able to change what it watches`);
  }

  // No route to herdr, at any depth. This is the one that matters: contacting
  // a worker means going through a herdr client or a dispatch adapter, and
  // neither may be reachable from a door that only observes.
  const contactRoutes = ['herdr-agent.mjs', 'herdr-round.mjs', 'transport.mjs', 'dispatch/cli.mjs'];
  for (const file of closure.modules.keys()) {
    for (const route of contactRoutes) {
      assert.ok(!file.endsWith(route), `an observe door reaches ${route}`);
    }
  }

  // `node:child_process` is checked on the verb files THEMSELVES rather than
  // across the whole closure. Deeper in, `runner/paths.mjs` shells out to
  // `git rev-parse` -- read-only plumbing that answers "where is the repo",
  // not a way to reach a pane -- and failing on that would be asserting the
  // wrong thing. A contact would be written in the verb, so that is where the
  // absence has to hold.
  for (const file of ['src/verbs/dispatch/show-run.mjs', 'src/verbs/dispatch/watch.mjs']) {
    const src = fs.readFileSync(path.join(REPO, file), 'utf8');
    assert.doesNotMatch(src, /from\s*['"]node:child_process['"]/, `${file} imports node:child_process`);
  }

  // A namespace import would hand a module every export including the writers
  // above, which is exactly what the binding check cannot see through.
  assert.deepEqual(closure.namespaceImports, [],
    'a namespace import on this path would bind every export, writers included');

  // The walk has to have actually walked, or this test proves nothing.
  assert.ok(closure.modules.size >= 4, `expected a real import closure, saw ${closure.modules.size} modules`);
  assert.ok(closure.bindings.has('readVisibility'), 'the reader the verbs do use was seen');
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
