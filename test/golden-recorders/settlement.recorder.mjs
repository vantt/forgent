// Records the golden vectors of the Rust settlement and steps modules (packages/execution/engine/src/{settlement,steps}/)
// by running the Node modules they port: src/runner/dispatch/settlement.mjs and src/run-supervisor/{attempt-step,
// stray-writes,worker-artifacts}.mjs with steps/{settle-attempt,cleanup-trust}.mjs.
// Run: node test/golden-recorders/settlement.recorder.mjs [--check]
// Writes under packages/execution/contracts/settlement/: pure.json, settle.json, steps.json.
//   --check  write nothing: lay every recorded run directory (the bytes tests/settlement.rs proves the Rust
//            settlement writes) and read it back with this release's Node readers, so a Node release that meets a
//            run Rust settled still reads its result.json, exit.json, evidence.json and run.json.
//
// Run Result derivation, the usage parser and the run control ledger live behind the native door, which a checkout
// does not ship. Like the run-result recorder, this loads the addon of the activated release (the main checkout's
// activation) through the door's descriptor entry, so the vectors carry the behaviour Node has today.
//
// Every scenario is a run directory built from a few fixture files. The recorder keeps the fixtures and the files
// settlement wrote from them (exit.json, evidence.json, result.json, run.json); the Rust test builds the same
// directory, settles it and compares bytes. The run control token is random, so it is replaced by `<token>` in the
// text of every recorded file.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const outDir = path.join(root, 'packages', 'execution', 'contracts', 'settlement');
fs.mkdirSync(outDir, { recursive: true });
const write = (name, body) => fs.writeFileSync(path.join(outDir, name), `${JSON.stringify(body, null, 2)}\n`);

const common = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { cwd: root, encoding: 'utf8' }).trim();
const activation = JSON.parse(fs.readFileSync(path.join(path.dirname(common), '.fgos', 'installation', 'activation.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(activation.releasePath, 'manifest.json'), 'utf8'));
const door = await import(path.join(root, 'src', 'native', 'door.mjs'));
door.loadNativeAddon({ descriptor: { manifest, releaseRoot: activation.releasePath } });

const settlement = await import(path.join(root, 'src', 'runner', 'dispatch', 'settlement.mjs'));
const artifacts = await import(path.join(root, 'src', 'run-supervisor', 'worker-artifacts.mjs'));
const settleStep = await import(path.join(root, 'src', 'run-supervisor', 'steps', 'settle-attempt.mjs'));
const cleanupStep = await import(path.join(root, 'src', 'run-supervisor', 'steps', 'cleanup-trust.mjs'));
const attemptStep = await import(path.join(root, 'src', 'run-supervisor', 'attempt-step.mjs'));
const runLock = await import(path.join(root, 'src', 'run-supervisor', 'run-lock.mjs'));

const runResult = await import(path.join(root, 'src', 'runner', 'dispatch', 'run-result.mjs'));

if (process.argv.includes('--check')) {
  const vectors = (name) => JSON.parse(fs.readFileSync(path.join(outDir, name), 'utf8'));
  const cases = [
    ...vectors('settle.json').settle.map((c) => ({ name: `settle/${c.name}`, runId: c.runMeta.runId, written: c.written })),
    ...vectors('steps.json').settleAttempt.map((c) => ({ name: `settle-attempt/${c.name}`, runId: c.runMeta.runId, written: c.written })),
  ];
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-settlement-check-'));
  const failures = [];
  let read = 0;
  try {
    for (const c of cases) {
      const runDir = fs.mkdtempSync(path.join(dir, 'run-'));
      for (const [file, text] of Object.entries(c.written)) fs.writeFileSync(path.join(runDir, file), text.split('<token>').join('check-token'));
      for (const file of ['exit.json', 'evidence.json', 'run.json']) {
        if (c.written[file] === undefined) continue;
        try { JSON.parse(c.written[file]); } catch (error) { failures.push(`${c.name}: ${file} does not parse: ${error.message}`); }
      }
      if (c.written['result.json'] === undefined) continue;
      const settled = runResult.readSettledResult(runDir, c.runId);
      if (!settled) failures.push(`${c.name}: Node reads no settled result from result.json`);
      else if (settled.runId !== c.runId) failures.push(`${c.name}: Node reads run ${settled.runId}, not ${c.runId}`);
      else read += 1;
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  if (failures.length > 0) {
    console.error(failures.join('\n'));
    process.exit(1);
  }
  console.log(`checked ${cases.length} recorded run directories; Node read ${read} settled results`);
  process.exit(0);
}

const plain = (value) => JSON.parse(JSON.stringify(value === undefined ? null : value));
const scratch = path.join(process.env.TMPDIR || '/tmp', 'fgos-work', `settlement-recorder-${process.pid}`);
fs.rmSync(scratch, { recursive: true, force: true });
fs.mkdirSync(scratch, { recursive: true });
let counter = 0;
const freshDir = () => {
  const dir = path.join(scratch, `s${counter++}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};
const SETTLED = '2026-11-19T00:00:00.000Z';

// A file tree: { relative/path: string | object }; objects are written as JSON.
const lay = (dir, files) => {
  for (const [rel, body] of Object.entries(files ?? {})) {
    const file = path.join(dir, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, typeof body === 'string' ? body : `${JSON.stringify(body, null, 2)}\n`);
  }
};
// Every file under `dir` the vector keeps, relative path to text, with the run control token masked.
const harvest = (dir, names, token) => {
  const out = {};
  for (const name of names) {
    const file = path.join(dir, name);
    if (fs.existsSync(file)) out[name] = fs.readFileSync(file, 'utf8').split(token).join('<token>');
  }
  return out;
};
const KEPT = ['exit.json', 'evidence.json', 'result.json', 'run.json', 'stdout.log', 'stderr.log'];

// --- pure helpers -----------------------------------------------------------------------------------------------
const reportTexts = ['', '   ', 'TODO', 'tbd.', 'N/A', 'n/a - nothing', 'None', 'OK', 'YES', 'done', '# Summary', '# Report\n\nStatus: PASSED', 'The loop terminates because the counter only grows.', 'todo: write this up properly today', 'none of the files matched the pattern we looked for', 'null', 'undefined behaviour in the parser', '###', '--', 'findings: 3 high, 2 low'];
const pure = {
  substantiveReport: reportTexts.map((text) => ({ text, out: settlement.isSubstantiveReportText(text) })),
  providerStop: [
    ['terminal:blocked:usage-limit', { providerSignal: { status: 429 } }],
    ['terminal:blocked:login', {}],
    ['direct:blocked:provider-error', { providerSignal: { statusWord: 'overloaded' } }],
    ['terminal:blocked:trust-dialog', {}],
    ['terminal:needs-human', {}],
    ['terminal:needs-setup', {}],
    ['direct:blocked:', {}],
    ['finished', {}],
    [undefined, {}],
  ].flatMap(([reason, extra]) => [false, true].map((claimed) => {
    const receipt = { ...(reason === undefined ? {} : { reason }), ...extra };
    return { receipt, claimed, out: plain(settleStep.providerStopOf(receipt, claimed)) };
  })),
  terminalStopMessage: [
    [{ reason: 'terminal:blocked:usage-limit' }, 'line one\nline two\n'],
    [{ reason: 'terminal:blocked:login' }, ''],
    [{ reason: 'terminal:blocked:trust-dialog' }, 'a\n\nb\nc\nd\ne\nf\ng\nh\n'],
    [{ reason: 'terminal:blocked:something-new' }, 'x'],
    [{ reason: 'terminal:needs-setup' }, '  spaced  \n'],
    [{ reason: 'terminal:needs-human' }, 'prompt?'],
    [{ reason: 'terminal:cancelled-for-other' }, 'x'],
  ].map(([receipt, screen]) => ({ receipt, screen, out: settleStep.terminalStopMessage(receipt, screen) })),
};

// Worker artifact lookup: round numbers by value, directory order, legacy names, planted links.
const artifactCases = [
  ['outbox-highest-round', { 'worker-output/outbox/result-2.json': '{}', 'worker-output/outbox/result-11.json': '{}', 'worker-output/outbox/result-9.json': '{}' }],
  ['leading-zero-ignored', { 'worker-output/outbox/result-01.json': '{}', 'worker-output/outbox/result-0.json': '{}' }],
  ['flat-outbox-only', { 'outbox/result-3.json': '{}' }],
  ['worker-output-before-outbox', { 'worker-output/result-1.json': '{}', 'outbox/result-5.json': '{}' }],
  ['legacy-name-in-outbox', { 'worker-output/outbox/agent-result.json': '{}' }],
  ['legacy-flat', { 'agent-result.json': '{}' }],
  ['nothing', {}],
  ['round-beats-legacy', { 'worker-output/outbox/agent-result.json': '{}', 'worker-output/outbox/result-1.json': '{}' }],
];
const artifactVectors = artifactCases.map(([name, files]) => {
  const dir = freshDir();
  lay(dir, files);
  const rel = (p) => path.relative(dir, p);
  return {
    name, files: Object.keys(files),
    result: rel(artifacts.resolveWorkerArtifactPath(dir, /^result-(\d+)\.json$/, 'agent-result.json')),
    report: rel(artifacts.resolveWorkerArtifactPath(dir, /^report-(\d+)\.md$/, 'agent-report.md')),
    claim: (() => { const c = artifacts.findWorkerClaim(dir); return c === null ? null : rel(c); })(),
  };
});
pure.workerArtifacts = artifactVectors;

// Changed files: dirty after, minus dirty before; commits need a repository and are covered by the Rust adapter's own test.
pure.changedFiles = [
  [[], []],
  [['a.txt'], ['a.txt', 'b.txt']],
  [['a.txt'], []],
  [[], ['z', 'a', 'm']],
].map(([before, after]) => ({ before, after, out: plain(settlement.computeChangedFiles(freshDir(), 'same', 'same', before, after)) }));

// Mutated pre-launch dirt: a snapshot is {exists, sha256}; a file that cannot be read counts as absent.
{
  const dir = freshDir();
  lay(dir, { 'kept.txt': 'one', 'changed.txt': 'two' });
  const sha = (text) => execFileSync('sha256sum', { input: text, encoding: 'utf8' }).split(' ')[0];
  const snapshots = {
    'kept.txt': { exists: true, sha256: sha('one') },
    'changed.txt': { exists: true, sha256: sha('different') },
    'gone.txt': { exists: true, sha256: sha('x') },
    'never.txt': { exists: false, sha256: null },
  };
  pure.mutatedDirtyBefore = { files: { 'kept.txt': 'one', 'changed.txt': 'two' }, snapshots, out: settlement.findMutatedDirtyBeforeFiles(dir, snapshots) };
}

// --- settlement scenarios ---------------------------------------------------------------------------------------
const CLAIM_DONE = { contract: { id: 'agent-result-claim', version: 2 }, status: 'done', summary: 'did it', evidenceRefs: ['report-1.md'] };
const REPORT = '# Report\n\nThe parser rejects empty input because the length check runs first.\n';
const producer = { assignmentId: 'asgn_a', workId: 'w-1', role: 'producer', operation: 'edit', mutation: 'mutates-repo', writes: ['src/**'] };
const reader = { assignmentId: 'asgn_b', workId: 'w-1', role: 'researcher', operation: 'research', mutation: 'read-only' };
const reviewer = { assignmentId: 'asgn_c', workId: 'w-1', role: 'reviewer', operation: 'review', mutation: 'read-only' };
const baseArgs = { exitCode: 0, signal: null, isTimeout: false, durationMs: null, settledAt: SETTLED, stdoutText: 'out', stderrText: '', gitBefore: 'aaa', gitAfter: 'aaa', dirtyBefore: [], dirtyAfter: [], launchCommandId: 'attempt-1', adapter: 'cli-spawn' };
const policy = { persona: 'code-reviewer', seat: 'doer' };

const settleCases = [
  ['clean-pass-with-changes', { assignment: producer, files: { 'worker-output/outbox/result-1.json': CLAIM_DONE, 'worker-output/outbox/report-1.md': REPORT }, args: { dirtyAfter: ['src/a.mjs'] } }],
  ['producer-no-change', { assignment: producer, files: { 'worker-output/outbox/result-1.json': CLAIM_DONE }, args: {} }],
  ['reader-with-report', { assignment: reader, files: { 'worker-output/outbox/result-1.json': CLAIM_DONE, 'worker-output/outbox/report-1.md': REPORT }, args: {} }],
  ['reader-placeholder-report', { assignment: reader, files: { 'worker-output/outbox/result-1.json': CLAIM_DONE, 'worker-output/outbox/report-1.md': 'TODO\n' }, args: {} }],
  ['no-claim-no-report', { assignment: producer, files: {}, args: {} }],
  ['report-without-claim', { assignment: reader, files: { 'worker-output/outbox/report-1.md': REPORT }, args: {} }],
  ['invalid-claim', { assignment: producer, files: { 'worker-output/outbox/result-1.json': { status: 'done' } }, args: {} }],
  ['claim-not-json', { assignment: producer, files: { 'worker-output/outbox/result-1.json': 'not json' }, args: {} }],
  ['claim-blocked', { assignment: producer, files: { 'worker-output/outbox/result-1.json': { contract: { id: 'agent-result-claim', version: 2 }, status: 'blocked', summary: 's', blocker: 'needs a key' } }, args: {} }],
  ['claim-failed', { assignment: producer, files: { 'worker-output/outbox/result-1.json': { contract: { id: 'agent-result-claim', version: 2 }, status: 'failed', summary: 's', error: 'broke' } }, args: {} }],
  ['reviewer-findings', { assignment: reviewer, files: { 'worker-output/outbox/result-1.json': { contract: { id: 'agent-result-claim', version: 2 }, status: 'failed', summary: 'f', error: 'e', evidenceRefs: ['report-1.md'], assessment: { verdict: 'findings', severityFloor: 'high' } }, 'worker-output/outbox/report-1.md': REPORT }, args: {} }],
  ['reviewer-pass', { assignment: reviewer, files: { 'worker-output/outbox/result-1.json': { contract: { id: 'agent-result-claim', version: 2 }, status: 'done', summary: 's', assessment: { verdict: 'pass' } }, 'worker-output/outbox/report-1.md': REPORT }, args: {} }],
  ['nonzero-exit', { assignment: producer, files: {}, args: { exitCode: 2 } }],
  ['timeout', { assignment: producer, files: {}, args: { exitCode: 124, signal: 'SIGTERM', isTimeout: true } }],
  ['killed-by-signal', { assignment: producer, files: { 'worker-output/outbox/result-1.json': CLAIM_DONE }, args: { exitCode: null, signal: 'SIGKILL' } }],
  ['execution-error', { assignment: producer, files: {}, args: { exitCode: 1, executionError: { message: 'abandoned-not-started: the agent never received its brief', code: undefined }, stderrText: '' } }],
  ['provider-limit-quota', { assignment: producer, files: {}, args: { exitCode: 1, adapterOutcome: 'provider-limit', providerStopCause: 'quota', providerSignal: { status: 429, requestedWait: '2h' } } }],
  ['provider-limit-credential', { assignment: producer, files: {}, args: { exitCode: 1, adapterOutcome: 'provider-limit', providerStopCause: 'credential' } }],
  ['blocked-on-person', { assignment: producer, files: {}, args: { exitCode: 1, adapterOutcome: 'blocked' } }],
  ['lost-uncommitted-path', { assignment: producer, files: {}, args: { dirtyBefore: ['src/lost.mjs'], dirtyAfter: [] } }],
  ['dirty-outside-scope', { assignment: producer, files: { 'worker-output/outbox/result-1.json': CLAIM_DONE }, args: { dirtyAfter: ['docs/x.md', 'src/y.mjs'] } }],
  ['pre-existing-dirt-kept', { assignment: producer, files: { 'worker-output/outbox/result-1.json': CLAIM_DONE }, args: { dirtyBefore: ['old.txt'], dirtyAfter: ['old.txt', 'src/new.mjs'] } }],
  ['frictions-cut-at-limit', { assignment: producer, files: { 'worker-output/outbox/result-1.json': { ...CLAIM_DONE, frictions: Array.from({ length: 7 }, (_, i) => ({ kind: 'awkward', layer: 'cli', errorClass: `class-${i}`, detail: `d${i}` })) } }, args: { dirtyAfter: ['src/a.mjs'] } }],
  ['legacy-flat-claim', { assignment: producer, files: { 'agent-result.json': { status: 'done', summary: 'old' } }, args: { dirtyAfter: ['src/a.mjs'] }, givenResultPath: undefined }],
  ['with-policy-and-digests', { assignment: producer, files: { 'worker-output/outbox/result-1.json': CLAIM_DONE }, args: { dirtyAfter: ['src/a.mjs'], effectivePolicy: policy, executorRedirected: true, reasoningEffort: 'high', modelWarnings: [{ code: 'model-drift', requested: 'a', ran: 'b' }], inputDigests: [{ path: 'brief.md', sha256: 'abc' }], resolvedExecutorId: 'codex-cli' } }],
  ['herdr-adapter', { assignment: reader, files: { 'worker-output/outbox/result-1.json': CLAIM_DONE, 'worker-output/outbox/report-1.md': REPORT }, args: { adapter: 'herdr-spawn' } }],
  ['prepared-confinement-backend', { assignment: producer, files: { 'worker-output/outbox/result-1.json': CLAIM_DONE, 'protected/prepared-invocation/attempt-1.json': { backend: { type: 'bwrap' }, workerInvocation: { command: '/usr/bin/codex', args: ['exec'], env: { HOME: '/h' }, cwd: '/w' } } }, args: { dirtyAfter: ['src/a.mjs'] } }],
];

const buildRunDir = ({ assignment, files }) => {
  const repoRoot = freshDir();
  const runDir = path.join(repoRoot, 'run');
  fs.mkdirSync(runDir, { recursive: true });
  lay(runDir, files);
  const runMeta = { runId: 'run_a_01', assignmentId: assignment.assignmentId, workId: assignment.workId, executorId: 'claude', status: 'running' };
  fs.writeFileSync(path.join(runDir, 'run.json'), `${JSON.stringify(runMeta, null, 2)}\n`);
  return { repoRoot, runDir, runMeta };
};

const settleVectors = [];
for (const [name, c] of settleCases) {
  const { repoRoot, runDir, runMeta } = buildRunDir(c);
  const control = runLock.acquireRunControl(runDir, { holder: runLock.buildRunControlHolder('recorder'), purpose: 'recorder' });
  const args = { ...baseArgs, ...c.args };
  const given = 'givenResultPath' in c ? {} : { agentResultPath: fs.existsSync(path.join(runDir, 'worker-output/outbox/result-1.json')) ? path.join(runDir, 'worker-output/outbox/result-1.json') : null };
  let outcome;
  try {
    const settled = await settlement.settleRunOutcome({
      runDir, runMeta, assignment: c.assignment, controlEpoch: control.controlEpoch, controlToken: control.controlToken,
      effectiveCwd: repoRoot, ...args, ...given,
      opts: { adapter: args.adapter, repoRoot, cwd: repoRoot, updateRunJson: 'settled' },
    });
    outcome = { status: settled.status };
  } catch (error) { outcome = { error: { name: error.name, code: error.code ?? null } }; }
  settleVectors.push({
    name, assignment: c.assignment, files: c.files, runMeta,
    args: { ...args, agentResultPath: 'agentResultPath' in given ? (given.agentResultPath === null ? null : path.relative(runDir, given.agentResultPath)) : undefined },
    outcome, written: harvest(runDir, KEPT, control.controlToken),
  });
}

// Recovery: the control ledger is already settled by the same token (a crash between the two publishes).
{
  const c = { assignment: producer, files: { 'worker-output/outbox/result-1.json': CLAIM_DONE } };
  const { repoRoot, runDir, runMeta } = buildRunDir(c);
  const control = runLock.acquireRunControl(runDir, { holder: runLock.buildRunControlHolder('recorder'), purpose: 'recorder' });
  runLock.settleRunControl(runDir, { controlEpoch: control.controlEpoch, controlToken: control.controlToken });
  const settled = await settlement.settleRunOutcome({ runDir, runMeta, assignment: producer, controlEpoch: control.controlEpoch, controlToken: control.controlToken, effectiveCwd: repoRoot, ...baseArgs, opts: { adapter: 'cli-spawn', repoRoot, cwd: repoRoot, updateRunJson: 'settled' } });
  settleVectors.push({ name: 'recover-after-control-settled', assignment: producer, files: c.files, runMeta, args: baseArgs, preSettled: true, outcome: { status: settled.status }, written: harvest(runDir, KEPT, control.controlToken) });
}
// A superseded controller: its token is not current, the result is kept aside and nothing is committed.
{
  const c = { assignment: producer, files: { 'worker-output/outbox/result-1.json': CLAIM_DONE } };
  const { repoRoot, runDir, runMeta } = buildRunDir(c);
  runLock.acquireRunControl(runDir, { holder: runLock.buildRunControlHolder('recorder'), purpose: 'recorder' });
  let outcome;
  try {
    await settlement.settleRunOutcome({ runDir, runMeta, assignment: producer, controlEpoch: 99, controlToken: 'stale-token', effectiveCwd: repoRoot, ...baseArgs, opts: { adapter: 'cli-spawn', repoRoot, cwd: repoRoot, updateRunJson: 'settled' } });
  } catch (error) { outcome = { error: { name: error.name, code: error.code ?? null, message: error.message } }; }
  settleVectors.push({ name: 'superseded-controller', assignment: producer, files: c.files, runMeta, args: { ...baseArgs, controlEpoch: 99, controlToken: 'stale-token' }, outcome, written: harvest(runDir, [...KEPT, 'result.superseded.json'], 'stale-token') });
}
// A refused provider lease settles as a provider failure under a control of its own.
const refusals = [
  ['capacity-refused', { reason: 'provider-capacity.no-account', detail: 'all quarantined' }],
  ['lease-conflict', { reason: 'provider-capacity.lease-conflict' }],
];
const refusedVectors = [];
for (const [name, refusal] of refusals) {
  const repoRoot = freshDir();
  const runDir = path.join(repoRoot, 'run');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'run.json'), `${JSON.stringify({ runId: 'run_a_01', status: 'running' }, null, 2)}\n`);
  const result = settlement.settleRefusedLease({ refusal, provider: 'codex', runDir, runId: 'run_a_01', repoRoot, assignment: producer, executorId: 'codex-cli', policy });
  const text = fs.readFileSync(path.join(runDir, 'result.json'), 'utf8');
  const record = JSON.parse(text);
  refusedVectors.push({ name, refusal, assignment: producer, policy, stderr: fs.readFileSync(path.join(runDir, 'stderr.log'), 'utf8'), evidence: fs.readFileSync(path.join(runDir, 'evidence.json'), 'utf8'), result: plain(result).classification ?? null, resultFields: Object.fromEntries(['runId', 'assignmentId', 'workId', 'executorId', 'role', 'operation', 'runtime', 'classification'].map((k) => [k, record[k] ?? null])), settledAtShape: typeof record.settledAt });
}

// --- steps --------------------------------------------------------------------------------------------------------
const stepCases = [];
const trustCases = [
  ['none-written', null],
  ['context-unusable', { kind: 'codex-toml' }],
  ['claude-never-removed', { kind: 'claude', target: '/x', projectPath: '/p' }],
  ['unknown-kind', { kind: 'other', target: '/x', projectPath: '/p' }],
  ['codex-removed', { kind: 'codex-toml', target: 'store/config.toml', projectPath: '/work/p', store: '[projects."/work/p"]\ntrust_level = "trusted"\n' }],
  ['codex-already-gone', { kind: 'codex-toml', target: 'store/config.toml', projectPath: '/work/other', store: '[projects."/work/p"]\ntrust_level = "trusted"\n' }],
  ['agy-removed', { kind: 'agy-json', target: 'store/settings.json', projectPath: '/work/p', store: '{"trustedWorkspaces":["/work/p","/work/q"]}\n' }],
  ['agy-already-gone', { kind: 'agy', target: 'store/settings.json', projectPath: '/work/z', store: '{"trustedWorkspaces":["/work/p"]}\n' }],
];
const trustVectors = [];
for (const [name, context] of trustCases) {
  const runDir = freshDir();
  const storeFiles = {};
  let ctxOut = null;
  if (context) {
    const { store, ...rest } = context;
    ctxOut = { ...rest, target: rest.target?.startsWith('store/') ? path.join(runDir, rest.target) : rest.target };
    if (store !== undefined) storeFiles[rest.target] = store;
    lay(runDir, { 'controller/trust-context.json': ctxOut });
  }
  lay(runDir, storeFiles);
  const result = await cleanupStep.cleanupTrust({ runDir });
  trustVectors.push({ name, context: context ? { ...context, target: context.target?.startsWith('store/') ? `<run>/${context.target}` : context.target } : null, result: plain(result), storeAfter: Object.fromEntries(Object.keys(storeFiles).map((k) => [k, fs.readFileSync(path.join(runDir, k), 'utf8')])) });
}

// The settle-attempt step end to end: an envelope, a receipt and a baseline in, the one result line and the files out.
const attemptCases = [
  ['exited-with-claim', { receipt: { outcome: 'exited', outboxResult: 'result-1.json', gateExit: { exitCode: 0, exitedAt: SETTLED } }, outbox: { 'result-1.json': CLAIM_DONE, 'report-1.md': REPORT } }],
  ['exited-no-claim', { receipt: { outcome: 'exited', gateExit: { exitCode: 0, exitedAt: SETTLED } }, outbox: {} }],
  ['timeout', { receipt: { outcome: 'timeout', gateExit: { exitedAt: SETTLED } }, outbox: {} }],
  ['cancelled-by-terminal-stop', { receipt: { outcome: 'cancelled', reason: 'terminal:blocked:usage-limit', publishedAt: SETTLED, providerSignal: { status: 429 } }, outbox: {} }],
  ['abandoned-not-started', { receipt: { outcome: 'abandoned-not-started', reason: 'no-slot', publishedAt: SETTLED }, outbox: {}, noBaseline: true }],
  ['claim-after-stop', { receipt: { outcome: 'cancelled', outboxResult: 'result-2.json', publishedAt: SETTLED, gateExit: { stoppedBy: 'orphan', cause: 'orphan-result', signal: 'SIGTERM', exitedAt: SETTLED } }, outbox: { 'result-2.json': CLAIM_DONE, 'report-2.md': REPORT } }],
  ['outbox-name-outside-outbox', { receipt: { outcome: 'exited', outboxResult: '../x.json', gateExit: { exitCode: 0, exitedAt: SETTLED } }, outbox: {} }],
  ['baseline-missing', { receipt: { outcome: 'exited', gateExit: { exitCode: 0, exitedAt: SETTLED } }, outbox: {}, noBaseline: true }],
  ['receipt-of-other-attempt', { receipt: { attemptId: 'other', outcome: 'exited' }, outbox: {} }],
];
const attemptVectors = [];
for (const [name, c] of attemptCases) {
  const repoRoot = freshDir();
  const runDir = path.join(repoRoot, 'attempt');
  const outboxDir = path.join(runDir, 'outbox');
  const sideFile = path.join(runDir, 'side.json');
  fs.mkdirSync(runDir, { recursive: true });
  lay(outboxDir, c.outbox);
  const runMeta = { runId: 'run_a_01', assignmentId: 'asgn_a', workId: 'w-1', executorId: 'claude', status: 'running' };
  const control = runLock.acquireRunControl(runDir, { holder: runLock.buildRunControlHolder('recorder'), purpose: 'recorder' });
  lay(runDir, {
    'run.json': runMeta,
    'assignment.json': producer,
    'receipt.json': { attemptId: 'attempt-1', ...c.receipt },
    'side.json': { v: 1, attemptId: 'attempt-1', controlEpoch: control.controlEpoch, controlToken: control.controlToken },
    ...(c.noBaseline ? {} : { 'controller/evaluator-baseline.json': { gitBefore: 'aaa', gitBeforeSource: 'pre-launch', dirtyBefore: [] } }),
    'controller/settle-context.json': { repoRoot, resolvedExecutorId: 'claude' },
  });
  fs.writeFileSync(path.join(runDir, 'cap-out.log'), 'captured stdout\n');
  fs.writeFileSync(path.join(runDir, 'cap-err.log'), '');
  const envelope = { v: 3, attemptId: 'attempt-1', runDir, cwd: repoRoot, host: 'direct', sideFile, launch: { outboxDir, capture: { stdout: path.join(runDir, 'cap-out.log'), stderr: path.join(runDir, 'cap-err.log') } }, steps: [{ stepId: 'settle-attempt' }] };
  const runOnce = async () => {
    try { return plain(await settleStep.settleAttempt({ runDir, envelope })); } catch (error) { return { error: { name: error.name, code: error.code ?? null, message: error.message } }; }
  };
  const first = await runOnce();
  const second = await runOnce();
  attemptVectors.push({
    name, receipt: c.receipt, outbox: c.outbox, noBaseline: Boolean(c.noBaseline), runMeta,
    first: JSON.parse(JSON.stringify(first).split(control.controlToken).join('<token>').split(scratch).join('<scratch>')), second: JSON.parse(JSON.stringify(second).split(scratch).join('<scratch>')),
    written: harvest(runDir, KEPT, control.controlToken),
  });
}

// The entry: unknown steps and a missing step environment are envelope errors, never a crash.
const entryVectors = [];
{
  const runDir = freshDir();
  lay(runDir, { 'envelope.json': { v: 3, attemptId: 'a', steps: [{ stepId: 'cleanup-trust' }] } });
  const lines = [];
  const realWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = (chunk) => { lines.push(String(chunk)); return true; };
  const results = [];
  for (const [stepId, env] of [['nope', { FGOS_STATE_ROOT: '/s', HOME: '/h' }], ['cleanup-trust', { HOME: '/h' }], ['cleanup-trust', { FGOS_STATE_ROOT: '/s', HOME: '/h' }]]) {
    const exit = await attemptStep.runAttemptStep(stepId, runDir, { env });
    results.push({ stepId, env, exit, line: JSON.parse(lines.pop()) });
  }
  process.stdout.write = realWrite;
  entryVectors.push(...results);
  const missing = freshDir();
  process.stdout.write = (chunk) => { lines.push(String(chunk)); return true; };
  const exit = await attemptStep.runAttemptStep('cleanup-trust', missing, { env: { FGOS_STATE_ROOT: '/s', HOME: '/h' } });
  process.stdout.write = realWrite;
  entryVectors.push({ stepId: 'cleanup-trust', noEnvelope: true, exit, line: JSON.parse(lines.pop()) });
}

write('pure.json', pure);
write('settle.json', { settle: settleVectors, refused: refusedVectors });
write('steps.json', { cleanupTrust: trustVectors, settleAttempt: attemptVectors, entry: entryVectors });
fs.rmSync(scratch, { recursive: true, force: true });
console.log(`recorded ${settleVectors.length} settle cases, ${refusedVectors.length} refused, ${trustVectors.length} trust cases, ${attemptVectors.length} attempt cases`);
