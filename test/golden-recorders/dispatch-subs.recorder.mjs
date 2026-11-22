// Records the golden vectors the native `fgos dispatch` reads replay (apps/fgos/src/wiring/dispatch_subs/) by
// running the Node use cases they port (src/verbs/dispatch/{show-run,inspect,recover}.mjs, the reconciliation
// planner and the attention view) over a project whose `.fgos/assignments` holds the Node-era corpus
// (packages/execution/contracts/corpus/). Run: node test/golden-recorders/dispatch-subs.recorder.mjs
// Writes packages/execution/contracts/dispatch-subs/corpus.v1.json.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureAddonForScript } from '../../scripts/lib/git-addon-stage.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const corpus = path.join(root, 'packages', 'execution', 'contracts', 'corpus');
const outDir = path.join(root, 'packages', 'execution', 'contracts', 'dispatch-subs');
fs.mkdirSync(outDir, { recursive: true });

// The run-result reader and the outcome derivation live behind the native door, which loads only through a staged
// manifest: this checkout's addon and host are staged (one cargo build), and the adopt probe runs that host.
ensureAddonForScript();

// The corpus samples, at the ids their records name (the corpus README table).
export const SAMPLES = {
  'v3-solo-settled': 'unit-run-1795056603528-44eb3ca1',
  'v3-open-attempt': 'unit-run-1794987012087-5f3337a8',
  'adopt-v3-envelope-attempt': 'asgn_4f660b01_7ec3_48f3_89b5_8219ba811853_op_001',
  'pre-v3-layout-assignment': 'asgn_8e8e56bb_00a0_4158_ad04_ec29cabf8204_op_001',
};
// Every copied file gets this modification time, so a listing's `modifiedAt` is the same on both sides.
const MTIME = new Date('2026-11-19T00:00:00.000Z');
const NOW = '2026-11-22T12:00:00.000Z';
const SINCE = '2026-11-01';

function copyTree(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, entry.name);
    const b = path.join(to, entry.name);
    if (entry.isDirectory()) copyTree(a, b);
    else { fs.copyFileSync(a, b); fs.utimesSync(b, MTIME, MTIME); }
  }
}

const project = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-dispatch-subs-')));
for (const [sample, id] of Object.entries(SAMPLES)) copyTree(path.join(corpus, sample), path.join(project, '.fgos', 'assignments', id));

// A fixed clock for the use cases that stamp the observation with `new Date()`.
const RealDate = Date;
const fixed = RealDate.parse(NOW);
globalThis.Date = class extends RealDate {
  constructor(...args) { super(...(args.length ? args : [fixed])); }
  static now() { return fixed; }
};

const { showRunUseCase } = await import('../../src/verbs/dispatch/show-run.mjs');
const { readAttemptView } = await import('../../src/verbs/dispatch/show-run.mjs');
const { recoverObserveUseCase } = await import('../../src/verbs/dispatch/recover.mjs');
const { inspectDispatchUseCase } = await import('../../src/verbs/dispatch/inspect.mjs');
const { planReconciliation } = await import('../../src/runner/dispatch/reconciliation-planner.mjs');
const { attentionView } = await import('../../src/runner/dispatch/attention-view.mjs');

const normalize = (value) => JSON.parse(JSON.stringify(value ?? null).split(project).join('<ROOT>'));
const attempt = (call) => {
  try { return { ok: normalize(call()) }; } catch (error) {
    return { error: { name: error.name, code: error.code ?? null, category: error.category ?? null, message: normalize(error.message) } };
  }
};

const ctx = { cwd: project, repoRoot: project };
const runIds = Object.keys(SAMPLES).flatMap((sample) => {
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const child = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(child);
      else if (entry.name === 'run.json') out.push(JSON.parse(fs.readFileSync(child, 'utf8')).runId);
    }
  };
  walk(path.join(corpus, sample));
  return out;
}).sort();
const assignmentIds = [...new Set(runIds.map((id) => id.replace(/^run_/, '').replace(/_\d+$/, '')))].sort();

const cases = [];
for (const runId of [...runIds, 'run_absent']) {
  cases.push({ sub: 'show-run', runId, answer: attempt(() => showRunUseCase(ctx, { runId })) });
  cases.push({ sub: 'recover', runId, intent: 'resume', answer: attempt(() => recoverObserveUseCase(ctx, { runId, now: NOW })) });
  cases.push({ sub: 'recover', runId, intent: 'reassign', answer: attempt(() => recoverObserveUseCase(ctx, { runId, intent: 'reassign', now: NOW })) });
  cases.push({ sub: 'inspect', selector: { run: runId }, answer: attempt(() => inspectDispatchUseCase(ctx, { run: runId })) });
  for (const action of ['collect-result', 'repair-projection']) {
    cases.push({ sub: 'reconcile', action, runId, answer: attempt(() => planReconciliation(project, { action, runId, cwd: project, now: NOW })) });
  }
}
for (const assignmentId of assignmentIds) {
  cases.push({ sub: 'inspect', selector: { assignment: assignmentId }, answer: attempt(() => inspectDispatchUseCase(ctx, { assignment: assignmentId })) });
}
cases.push({ sub: 'reconcile', action: 'clear-cwd-lock', answer: attempt(() => planReconciliation(project, { cwd: project, now: NOW })) });
cases.push({
  sub: 'attention',
  since: SINCE,
  answer: attempt(() => attentionView(project, { since: SINCE }, {
    now: () => NOW,
    view: (runDir) => readAttemptView(runDir, { fgosDir: path.join(project, '.fgos') }),
  })),
});

fs.writeFileSync(path.join(outDir, 'corpus.v1.json'), `${JSON.stringify({ samples: SAMPLES, mtime: MTIME.toISOString(), now: NOW, cases }, null, 2)}\n`);
fs.rmSync(project, { recursive: true, force: true });
process.stdout.write(`recorded ${cases.length} cases\n`);
