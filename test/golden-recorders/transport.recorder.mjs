// Records the golden vectors of the Rust transport base (packages/execution/engine/src/transport/) by running the
// Node modules of src/runner/dispatch/ it ports. Run: node test/golden-recorders/transport.recorder.mjs
// Each section writes one file under packages/execution/contracts/transport/.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const outDir = path.join(root, 'packages', 'execution', 'contracts', 'transport');
fs.mkdirSync(outDir, { recursive: true });

function write(name, body) {
  fs.writeFileSync(path.join(outDir, name), `${JSON.stringify(body, null, 2)}\n`);
}

// The native door first: loading it from inside the config/yaml import cycle fails on a missing export.
await import('../../src/native/door.mjs');

// proof-helpers.mjs and stop-processes-inside.mjs reach the machine through src/native/ (an installed addon a
// checkout does not have). The recorder runs the real modules and swaps those two leaves for what they do (a
// plain write of the same bytes; no process lives inside a scratch home) through a resolve hook.
{
  const shim = {
    proof: `export * from ${JSON.stringify(new URL('../../src/native/proof-helpers.mjs?real', import.meta.url).href)}; import fs from "node:fs"; import path from "node:path"; export function publishMutableProjection(target, record) { fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, typeof record === "string" ? record : \`\${JSON.stringify(record, null, 2)}\\n\`); }`,
    stop: 'export const stopProcessesInside = () => ({ stopped: [], left: [] });',
  };
  const hooks = `export async function resolve(spec, ctx, next) { if (spec.endsWith("/native/proof-helpers.mjs") && !ctx.parentURL?.startsWith("data:")) return { url: ${JSON.stringify('data:text/javascript,' + encodeURIComponent(shim.proof))}, shortCircuit: true }; if (spec.endsWith("/native/stop-processes-inside.mjs")) return { url: ${JSON.stringify('data:text/javascript,' + encodeURIComponent(shim.stop))}, shortCircuit: true }; return next(spec, ctx); }`;
  const { register } = await import('node:module');
  register(`data:text/javascript,${encodeURIComponent(hooks)}`);
}

const dispatch = (name) => import(path.join(root, 'src', 'runner', 'dispatch', name));
const scratch = (prefix) => fs.mkdtempSync(path.join(os.tmpdir(), prefix));
const attempt = (call) => {
  try { return { ok: call() }; } catch (error) { return { error: { name: error.name, code: error.code ?? null } }; }
};

// SECTION: mechanism
{
  const { decideDispatchMechanism, decideExecutorDispatchMechanism } = await dispatch('mechanism.mjs');
  const bools = [false, true];
  const table = [];
  for (const hasNativeMechanism of bools) for (const hasLiveTaskAccess of bools) for (const forceCliSpawn of bools) {
    table.push({ in: { hasNativeMechanism, hasLiveTaskAccess, forceCliSpawn }, out: decideDispatchMechanism({ hasNativeMechanism, hasLiveTaskAccess, forceCliSpawn }) });
  }
  table.push({ in: null, out: decideDispatchMechanism() });
  const executors = {
    'agent-only': { kind: 'agent', agentType: 'judge' },
    'agent-forced': { kind: 'agent', agentType: 'judge', forceCliSpawn: true },
    'agent-command': { kind: 'agent', command: 'claude' },
    'agent-adapter': { kind: 'agent', adapter: 'herdr-spawn' },
    'agent-cli-invocation': { kind: 'agent', invocations: [{ via: 'cli', command: 'x' }] },
    'agent-task-invocation': { kind: 'agent', invocations: [{ via: 'task' }] },
    'tool-only': { kind: 'tool', mcpTool: 'a' },
    'bare': {},
  };
  const cfg = { executors };
  const executorCases = [];
  for (const executorId of [...Object.keys(executors), 'missing', undefined, null, '']) {
    for (const hasLiveTaskAccess of bools) {
      executorCases.push({ executorId: executorId ?? null, hasLiveTaskAccess, out: decideExecutorDispatchMechanism(cfg, executorId, { hasLiveTaskAccess }) });
    }
  }
  const lookups = [
    { executorId: 'executor', cfg: { executor: { kind: 'agent', command: 'claude' } } },
    { executorId: 'claude', cfg: { executor: { kind: 'agent', command: 'claude' } } },
    { executorId: 'other', cfg: { executor: { kind: 'agent', command: 'claude' } } },
    { executorId: 'inv-1', cfg: { executor: { kind: 'agent', invocations: [{ id: 'inv-1', via: 'task' }] } } },
    { executorId: undefined, cfg: { executor: { kind: 'agent', command: 'claude' } } },
  ].map((c) => ({ executorId: c.executorId ?? null, cfg: c.cfg, out: decideExecutorDispatchMechanism(c.cfg, c.executorId, { hasLiveTaskAccess: true }) }));
  write('mechanism.v1.json', { note: 'recorded from src/runner/dispatch/mechanism.mjs', table, cfg, executorCases, lookups });
}

// SECTION: adapters
{
  const a = await dispatch('adapters.mjs');
  const depth = ['', '0', '2', '3', '-1', 'x', '1.5', ' ', 'Infinity'].map((raw) => {
    const prev = process.env[a.DISPATCH_DEPTH_ENV];
    if (raw === '') delete process.env[a.DISPATCH_DEPTH_ENV]; else process.env[a.DISPATCH_DEPTH_ENV] = raw;
    const out = a.currentDispatchDepth();
    if (prev === undefined) delete process.env[a.DISPATCH_DEPTH_ENV]; else process.env[a.DISPATCH_DEPTH_ENV] = prev;
    return { raw: raw === '' ? null : raw, out };
  });
  const base = { HOME: '/h', PATH: '/bin', FGOS_CASE_ID: 'c', CLAUDE_CODE_X: '1', ANTHROPIC_API_KEY: 'k', HERDR_SOCKET_PATH: '/s', LANG: 'C', TERM: 'xterm', NOT_LISTED_ANYWHERE: 'v' };
  const executorEnv = [
    { raw: { A: 'x', B: '${HOME}/y', C: '${MISSING}z', D: 5, E: '${HOME}${PATH}' }, base },
    { raw: null, base }, { raw: 'str', base }, { raw: {}, base },
  ].map((c) => ({ ...c, out: a.resolveExecutorEnv(c.raw, c.base) }));
  write('adapters.v1.json', {
    note: 'recorded from src/runner/dispatch/adapters.mjs',
    defaultAdapter: a.DEFAULT_ADAPTER, names: a.EXECUTOR_ADAPTER_NAMES,
    registry: Object.fromEntries(Object.entries(a.ADAPTER_REGISTRY).map(([k, v]) => [k, v])),
    metadata: ['cli-spawn', 'herdr-spawn', 'other'].map((name) => ({ name, out: a.getAdapterMetadata(name) })),
    maxDispatchDepth: a.MAX_DISPATCH_DEPTH, depthEnv: a.DISPATCH_DEPTH_ENV,
    caseEnv: { id: a.CASE_ID_ENV, reservation: a.CASE_RESERVATION_ENV, out: a.caseContextEnv({ caseId: 'case-1', reservationId: 'res-1' }) },
    depth, executorEnv,
    workerEnvBase: base,
    workerEnvWithoutRoot: (() => { const out = a.workerBaseEnv(base); delete out.FGOS_STATE_ROOT; return out; })(),
  });
}

// SECTION: provider-adapter
{
  const p = await dispatch('provider-adapter.mjs');
  const argvs = [
    ['--model', 'x', '--effort', 'high', '-p', '{prompt}'],
    ['exec', '-s', 'read-only', '--skip-git-repo-check', '{prompt}'],
    ['-s', '--model', 'm'], ['-s'], ['--dangerously-skip-permissions', '--dangerously-skip-permissions'],
    ['--provider', 'p', '--tools', 't', '--approve', '--mode', 'auto', '--allowedTools', 'a', '--permission-mode', 'plan'],
    ['--dangerously-bypass-approvals-and-sandbox'], [], 'not-an-array',
  ];
  const effortCases = [
    { command: 'claude', args: ['-p', '{prompt}'], effort: 'high' },
    { command: '/usr/bin/claude', args: ['--effort', 'low', '-p'], effort: 'max' },
    { command: 'claude', args: ['--effort'], effort: 'high' },
    { command: 'pi', args: ['--thinking', 'low'], effort: 'xhigh' },
    { command: 'omp', args: [], effort: 'medium' },
    { command: 'agy', args: ['x'], effort: 'low' },
    { command: 'codex', args: ['exec', '{prompt}'], effort: 'max' },
    { command: 'codex', args: ['exec', '-c', 'model_reasoning_effort=low', '{prompt}'], effort: 'high' },
    { command: 'codex', args: ['{prompt}'], effort: 'low' },
    { command: 'codex', args: ['-c', 'model_reasoning_effort=high'], effort: 'medium' },
    { command: 'unknown', args: [], effort: 'high' },
    { command: undefined, args: [], effort: 'high' },
  ];
  const modelChecks = [
    { requested: 'a', launched: 'b', args: ['--model', 'b'] },
    { requested: 'a', launched: 'a', args: ['-p'] },
    { requested: 'a', launched: 'a', args: ['--model', 'a'] },
    { requested: null, launched: 'a', args: [] },
    { requested: 'a', launched: null, args: [] },
    { requested: 'a', launched: 'b' },
  ];
  const outputs = [
    { stdout: '', stderr: 'model agy-1 is not recognized as a known model' },
    { stdout: '', stderr: 'Model "foo" not found' },
    { stdout: '', stderr: 'Model metadata for `bar` not found' },
    { stdout: 'model: stdout-only', stderr: '' },
    { stdout: '', stderr: 'x\nmodel: other-model\ny' },
    { stdout: '', stderr: 'model: b' },
    { stdout: 'Model "q" not found', stderr: 'model: zzz' },
  ];
  write('provider-adapter.v1.json', {
    note: 'recorded from src/runner/dispatch/provider-adapter.mjs; familyOf has its owner in fgos-execution and is not recorded here',
    knownFlags: p.KNOWN_POLICY_SHAPED_FLAGS,
    extract: argvs.map((args) => ({ args, family: 'claude', out: p.extractPolicyShapedFlags(args, 'claude') })),
    policyFlagsFor: ['claude', 'openai', 'codex', 'glm', 'agy', 'pi', 'z-ai', 'gemini', 'nope', ''].map((family) => ({ family, out: p.getProviderPolicyShapedFlags(family) })),
    policyFlagsByCommand: [{ command: 'codex', out: p.getProviderPolicyShapedFlags(undefined, 'codex') }, { command: undefined, out: p.getProviderPolicyShapedFlags(undefined, undefined) }],
    disallowed: [
      { deny: ['codex', 'glm', ' ', 5, 'Claude'], candidate: 'openai', command: undefined },
      { deny: ['codex'], candidate: 'claude', command: undefined },
      { deny: ['pi'], candidate: undefined, command: 'pi' },
      { deny: [], candidate: 'claude', command: undefined },
      { deny: null, candidate: 'claude', command: undefined },
      { deny: ['claude'], candidate: '', command: '' },
    ].map((c) => ({ ...c, out: p.checkProviderDisallowed(c.deny, c.candidate, c.command) })),
    normalized: [['codex', 'openai', 'glm', '', '  agy  ', 7]].map((deny) => ({ deny, out: [...p.normalizeDisallowedProviders(deny)].sort() })),
    effortLevels: ['claude', '/x/y/pi', 'omp', 'agy', 'codex', 'zzz', '', null].map((command) => ({ command, out: p.renderedEffortLevels(command) })),
    effort: effortCases.map((c) => ({ ...c, out: p.renderReasoningEffortArgs(c) })),
    modelChecks: modelChecks.map((c) => ({ ...c, out: p.checkLaunchedModel(c) })),
    modelWarnings: outputs.map((o) => ({ output: o, check: { requested: 'a', launched: 'b', args: ['--model', 'b'] }, out: p.collectModelWarnings(p.checkLaunchedModel({ requested: 'a', launched: 'b', args: ['--model', 'b'] }), o) })),
    modelWarningsNoCheck: p.collectModelWarnings(null, {}),
  });
}

// SECTION: visibility
{
  const v = await dispatch('visibility-session.mjs');
  const mk = (files) => {
    const dir = scratch('transport-run-');
    for (const [name, body] of Object.entries(files)) {
      const file = path.join(dir, name);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, typeof body === 'string' ? body : JSON.stringify(body));
    }
    return dir;
  };
  const rel = (dir, p) => (p ? path.relative(dir, p) : null);
  const classes = [
    { name: 'claim-in-outbox', liveness: 'unknown', files: { 'run.json': { status: 'running' }, 'outbox/result-2.json': '{}', 'outbox/result-11.json': '{}' } },
    { name: 'claim-numeric-order', liveness: 'absent', files: { 'run.json': { status: 'running' }, 'worker-output/outbox/result-9.json': '{}', 'worker-output/outbox/result-11.json': '{}' } },
    { name: 'claim-legacy-name', liveness: 'unknown', files: { 'run.json': { status: 'running' }, 'worker-output/agent-result.json': '{}' } },
    { name: 'claim-leading-zero-ignored', liveness: 'absent', files: { 'run.json': { status: 'running' }, 'outbox/result-01.json': '{}' } },
    { name: 'collected-result', liveness: 'absent', files: { 'run.json': { status: 'running' }, 'result.json': '{}' } },
    { name: 'settled-already', liveness: 'unknown', files: { 'run.json': { status: 'settled' }, 'result.json': '{}' } },
    { name: 'died', liveness: 'absent', files: { 'run.json': { status: 'running' } } },
    { name: 'unknown-default', liveness: undefined, files: { 'run.json': { status: 'running' } } },
    { name: 'unknown-held', liveness: 'held', files: { 'run.json': { status: 'running' } } },
    { name: 'died-already', liveness: 'absent', files: { 'run.json': { status: 'died' } } },
    { name: 'missing-run', liveness: 'absent', files: {} },
    { name: 'corrupt-run', liveness: 'absent', files: { 'run.json': '{nope' } },
  ].map((c) => {
    const dir = mk(c.files);
    const out = attempt(() => { const r = v.classifyRunOutcome(dir, c.liveness === undefined ? {} : { liveness: c.liveness }); return { outcome: r.outcome, resultPath: rel(dir, r.resultPath), changed: r.changed }; });
    return { name: c.name, liveness: c.liveness ?? null, files: c.files, out };
  });
  const reconcile = [
    { name: 'settles', liveness: 'unknown', files: { 'run.json': { status: 'running', runId: 'r1' }, 'outbox/result-1.json': '{}', 'visibility.json': { status: 'working', pane: 'p' } } },
    { name: 'dies', liveness: 'absent', files: { 'run.json': { status: 'running' } } },
    { name: 'no-visibility', liveness: 'absent', files: { 'run.json': { status: 'running' } } },
  ].map((c) => {
    const dir = mk(c.files);
    const out = attempt(() => { const r = v.reconcileRun(dir, { liveness: c.liveness }); return { outcome: r.outcome, changed: r.changed, resultPath: rel(dir, r.resultPath) }; });
    const strip = (file) => { try { const j = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')); delete j.reconciledAt; delete j.lastSeenAt; return j; } catch { return null; } };
    return { name: c.name, liveness: c.liveness, files: c.files, out, run: strip('run.json'), visibility: strip('visibility.json') };
  });
  const settle = ['settled', 'died', 'unknown', 'running', 'bogus'].map((status) => {
    const dir = mk({ 'run.json': { status: 'running' } });
    const out = attempt(() => v.markRunSettled(dir, { status }));
    return { status, out };
  });
  const settleAgain = (() => { const dir = mk({ 'run.json': { status: 'settled' } }); return v.markRunSettled(dir); })();
  const settleMissing = (() => { const dir = mk({}); return v.markRunSettled(dir); })();
  const visibility = (() => {
    const dir = mk({});
    const steps = [];
    const stamp = () => '2026-01-01T00:00:00.000Z';
    steps.push({ patch: { status: 'pane-created', pane: 'p1' }, out: v.writeVisibility(dir, { status: 'pane-created', pane: 'p1' }, { now: stamp }) });
    steps.push({ patch: { agentSession: 's1' }, out: v.writeVisibility(dir, { agentSession: 's1' }, { now: stamp }) });
    steps.push({ patch: { status: 'bogus' }, out: attempt(() => v.writeVisibility(dir, { status: 'bogus' })) });
    steps.push({ patch: 'detached', out: v.markDetached(dir, { now: stamp }) });
    fs.writeFileSync(path.join(dir, 'visibility.json'), '{bad');
    steps.push({ patch: 'corrupt', out: attempt(() => v.readVisibility(dir)) });
    return { steps };
  })();
  write('visibility.v1.json', { note: 'recorded from src/runner/dispatch/visibility-session.mjs', states: v.VISIBILITY_STATES, runStatuses: v.RUN_STATUSES, classes, reconcile, settle, settleAgain, settleMissing, visibility });
}

// SECTION: terminal-slot
{
  const t = await dispatch('terminal-slot.mjs');
  write('terminal-slot.v1.json', {
    note: 'recorded from src/runner/dispatch/terminal-slot.mjs',
    herdrBin: [
      { opt: 'my-herdr', env: { FGOS_HERDR_BIN: 'e' } }, { opt: '  ', env: { FGOS_HERDR_BIN: ' e2 ' } },
      { opt: undefined, env: {} }, { opt: undefined, env: { FGOS_HERDR_BIN: '  ' } }, { opt: ' x ', env: {} },
    ].map((c) => ({ ...c, out: t.resolveHerdrBin(c.opt, c.env) })),
    endpointEnv: [{ HERDR_SESSION: 's', HERDR_SOCKET_PATH: '/p', HOME: '/h', HERDR_X: 5, FGOS_HERDR_BIN: 'b' }, {}].map((env) => ({ env, out: t.herdrEndpointEnv(env) })),
    portKey: [['abc'], ['a b/c'], ['--x'], ['.hidden'], [''], [null, 'fb'], ['x'.repeat(200)], ['é-ü'], ['___a']].map((args) => ({ args, out: t.portKey(...args) })),
    driverCode: [{ reason: 'herdr agent_blocked: nope' }, { detail: 'herdr pane_missing: x' }, { reason: 'other' }, {}, null, { reason: 'herdr Bad: x' }].map((refusal) => ({ refusal, out: t.driverCodeOf(refusal) })),
    refusal: [
      { refusal: { result: 'unsupported', detail: 'no', capability: 'cap' }, what: 'launch' },
      { refusal: { result: 'refused', reason: 'herdr agent_blocked: x' }, what: 'launch' },
      { refusal: { result: 'refused', detail: 'plain' }, what: 'send' },
      { refusal: { result: 'refused' }, what: 'send' },
    ].map((c) => { const e = t.refusalError(c.refusal, c.what); return { ...c, out: { code: e.code, message: e.message, capability: e.capability ?? null } }; }),
    workLabel: [
      { workId: 'w1', title: 'T' }, { workId: 'w1' }, { unitRunId: 'unit-run-1-0123abcd', objective: 'do it' },
      { provenance: { unitRunId: 'x-ffffffff' } }, { unitRunId: 'nohex' }, {}, null,
    ].map((assignment) => ({ assignment, out: t.workLabelOf(assignment) })),
    display: [
      { id: 7, title: 'T', agent: '/usr/bin/claude', model: 'm', role: 'producer' }, { id: 'i' }, {}, { agent: 'codex' },
    ].map((a) => ({ args: a, out: t.slotDisplay(a) })),
  });
}

// SECTION: worker-session
{
  const w = await dispatch('worker-session.mjs');
  const names = ['fgos-worker', 'default', 'a', 'A', '1a', '', 'a'.repeat(32), 'a'.repeat(33), 'a_b-c', 'a/b', null];
  write('worker-session.v1.json', {
    note: 'recorded from src/runner/dispatch/worker-session.mjs',
    assert: [{ target: 'fgos-worker', env: {} }, { target: 'default', env: {} }, { target: 'mine', env: { HERDR_SESSION: 'mine' } }, ...names.map((target) => ({ target, env: { HERDR_SESSION: 'cockpit' } }))]
      .map((c) => ({ ...c, out: attempt(() => w.assertNotOperatorSession(c.target, c.env)) })),
    forSession: [{ base: { HERDR_SOCKET_PATH: '/s', A: '1' }, name: 'w' }, { base: null, name: 'w' }].map((c) => ({ ...c, out: w.envForSession(c.base, c.name) })),
    isolated: [
      { caller: { HERDR_SESSION: 'cockpit', HERDR_SOCKET_PATH: '/s', HERDR_PANE_ID: 'p', HERDR_TAB_ID: 't', HERDR_WORKSPACE_ID: 'w', HOME: '/h' }, target: 'fgos-worker' },
      { caller: { HERDR_SESSION: 'cockpit' }, target: 'cockpit' },
      { caller: null, target: 'default' },
      { caller: undefined, target: 'ok' },
    ].map((c) => ({ ...c, caller: c.caller ?? null, out: attempt(() => w.isolatedSessionEnv(c.caller, c.target)) })),
  });
}

// SECTION: worker-home
{
  const h = await dispatch('worker-home.mjs');
  const mkSource = (trusted) => {
    const home = scratch('transport-src-');
    fs.mkdirSync(path.join(home, '.claude'), { recursive: true });
    fs.writeFileSync(path.join(home, '.claude', '.credentials.json'), '{"token":"t"}');
    fs.writeFileSync(path.join(home, '.claude.json'), JSON.stringify({ projects: trusted === null ? {} : { '/repo': { hasTrustDialogAccepted: trusted } } }));
    return home;
  };
  const tree = (dir) => {
    const files = {};
    const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else files[path.relative(dir, p)] = { mode: (fs.statSync(p).mode & 0o777).toString(8), content: fs.readFileSync(p, 'utf8') }; } };
    walk(dir);
    return Object.fromEntries(Object.entries(files).sort(([a], [b]) => (a < b ? -1 : 1)));
  };
  const create = (permissionMode, trusted, extra = {}) => {
    const base = scratch('transport-base-');
    const sourceHome = mkSource(trusted);
    const args = { runId: 'run-1', sourceHome, workspacePath: '/repo/wt', repoRoot: '/repo', permissionMode, ...extra };
    const out = attempt(() => { const r = h.createWorkerHome(base, args); return { provisioned: r.provisioned, tree: tree(r.homePath), name: path.basename(r.homePath).replace(/[A-Za-z0-9]{6}$/, '<rand>') }; });
    return { permissionMode, trusted, extra, out, leftover: fs.readdirSync(base).length };
  };
  const creations = [create('ask', true), create('bypass', true), create('ask', false), create('ask', null), create(undefined, true), create('nope', true), create('ask', true, { runId: '' }), create('ask', true, { workspacePath: 'rel' })];
  const noCredential = (() => {
    const base = scratch('transport-base-');
    const sourceHome = mkSource(true);
    fs.rmSync(path.join(sourceHome, '.claude', '.credentials.json'));
    return { out: attempt(() => h.createWorkerHome(base, { runId: 'r', sourceHome, workspacePath: '/repo/wt', repoRoot: '/repo' })), leftover: fs.readdirSync(base).length };
  })();
  const teardown = (() => {
    const base = scratch('transport-base-');
    const { homePath } = h.createWorkerHome(base, { runId: 'r', sourceHome: mkSource(true), workspacePath: '/repo/wt', repoRoot: '/repo', permissionMode: 'bypass' });
    const plain = scratch('transport-plain-');
    const steps = [];
    steps.push({ step: 'redact-plain', out: attempt(() => h.redactWorkerHome(plain)) });
    steps.push({ step: 'remove-plain', out: attempt(() => h.removeWorkerHome(plain)), stillThere: fs.existsSync(plain) });
    steps.push({ step: 'redact', out: attempt(() => h.redactWorkerHome(homePath)), credential: fs.existsSync(path.join(homePath, '.claude', '.credentials.json')) });
    steps.push({ step: 'redact-again', out: attempt(() => h.redactWorkerHome(homePath)) });
    steps.push({ step: 'remove', out: attempt(() => h.removeWorkerHome(homePath)), stillThere: fs.existsSync(homePath) });
    steps.push({ step: 'remove-again', out: attempt(() => h.removeWorkerHome(homePath)) });
    steps.push({ step: 'remove-empty', out: attempt(() => h.removeWorkerHome('')) });
    steps.push({ step: 'redact-empty', out: attempt(() => h.redactWorkerHome('')) });
    return steps;
  })();
  write('worker-home.v1.json', { note: 'recorded from src/runner/dispatch/worker-home.mjs; the source home holds a credential and a claude.json whose /repo trust is the case', bypassAcceptance: h.BYPASS_ACCEPTANCE_SETTINGS, creations, noCredential, teardown });
}

// SECTION: worker-session-boot
{
  const b = await dispatch('worker-session-boot.mjs');
  write('worker-session-boot.v1.json', { note: 'recorded from src/runner/dispatch/worker-session-boot.mjs (constants only; the boot is effectful and proven in the Rust test with fakes)', defaultWorkerSession: b.DEFAULT_WORKER_SESSION });
}
