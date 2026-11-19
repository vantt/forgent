#!/usr/bin/env node
// Provider accounts golden recorder: replays the Node account modules (provider-capacity, llm-accounts,
// provider-account-probe, provider-credential-probe, provider-session-probe, account-rotation, account-pin) over fixed
// inputs and writes the results as vectors for the Rust `accounts` engine module to replay
// (packages/execution/engine/tests/accounts.rs). Usage: node test/golden-recorders/accounts.recorder.mjs [--out <dir>]
// Default out: packages/execution/contracts/accounts.
//
// What is replaced, and why it does not weaken the vectors: the kernel locks, the process-identity facts and the
// native addon are not available to a plain `node` run from a checkout, and none of them decides what the lease state
// holds. Locks always acquire, the process identity is one fixed tuple (pid 4242, and pid 999 judged dead), the clock
// is fixed, and the durable write is a plain file write. Everything else is the real Node module: the state document
// the lease writes, the audit lines, the quarantine rules, the classifier and the probe judgments.
//
// Every key named pid, processStartTime or record is scrubbed in the vectors (they name the recording process).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { registerHooks } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const outDir = path.resolve(repo, args.includes('--out') ? args[args.indexOf('--out') + 1] : 'packages/execution/contracts/accounts');

// ---- the replaced doors ---------------------------------------------------------------------------------------------

const dataUrl = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const STUBS = {
  'src/holder-lock/index.mjs': dataUrl(`
    const held = { result: 'acquired', handle: { release() {} } };
    export const acquire = async () => held;
    export const acquireSync = () => held;
    export const createLockScope = () => ({});
    export const lockHolders = () => ({ kind: 'list', holders: [] });
    export const resolveLock = () => ({ v3Path: '/lock' });
    export const resolveLockRoot = () => '/lock-root';
    export const runBorrowed = () => { throw new Error('not recorded'); };
  `),
  'src/native/process-identity.mjs': dataUrl(`
    export const selfRecord = () => ({ host: 'h', bootId: 'b', pidNs: 'n', pid: 4242, startTime: '1' });
    export const resolveHolderLiveness = (record) => (record?.pid === 999 ? 'dead' : 'held');
  `),
  'src/native/door.mjs': dataUrl(`
    import fs from 'node:fs'; import path from 'node:path';
    export const replaceDurably = (dir, name, text) => fs.writeFileSync(path.join(dir, name), text);
    export const nativeDoor = () => { throw new Error('native door is not part of the vectors'); };
    export const nativeHelperExe = () => null;
  `),
  'src/config/facade.mjs': dataUrl(`
    export const globalFgosDir = () => '/global-fgos';
    export const readMachineAccounts = () => ({ state: 'ok' });
    export const readConfig = () => ({ value: {} });
    export const readMachineConfig = () => ({ value: {} });
  `),
  'src/runner/dispatch/config.mjs': dataUrl(`export const MODEL_POLICY_TIERS = ['nano', 'mini', 'standard', 'advanced', 'flagship', 'frontier'];`),
  'src/runner/dispatch/run-result.mjs': dataUrl(`export const LEASE_CONFLICT_FAILURE_CODE = 'provider-capacity-lease-conflict'; export const runOutcome = () => null;`),
  'src/runner/execution/bind.mjs': dataUrl(`
    const identityKey = (executor, invocation, pool, model, effort) => [executor, invocation ?? '', pool ?? '', model ?? '', effort ?? ''].join('\\u0000');
    export const bindingIdentity = (binding) => identityKey(binding?.executor, binding?.invocation, binding?.pool, binding?.model, binding?.reasoningEffort);
    export const preflightOf = () => { throw new Error('not recorded'); };
  `),
};
registerHooks({
  resolve(specifier, context, next) {
    const resolved = next(specifier, context);
    const rel = resolved.url.startsWith('file:') ? path.relative(repo, fileURLToPath(resolved.url)).split(path.sep).join('/') : null;
    if (rel && STUBS[rel]) return { url: STUBS[rel], shortCircuit: true };
    return resolved;
  },
});

// A fixed clock: `new Date()` and `Date.now()` answer `clock.ms`.
const clock = { ms: Date.UTC(2026, 10, 19, 5, 0, 0) };
const RealDate = Date;
globalThis.Date = class FixedDate extends RealDate {
  constructor(...a) { if (a.length === 0) super(clock.ms); else super(...a); }
  static now() { return clock.ms; }
};

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'accounts-recorder-'));
process.env.HOME = '/home/vector';
process.env.FGOS_STATE_ROOT = path.join(scratch, 'state');
process.env.USER = 'vector-user';

const dispatch = path.join(repo, 'src/runner/dispatch');
const cap = await import(pathToFileURL(path.join(dispatch, 'provider-capacity.mjs')));
const llm = await import(pathToFileURL(path.join(dispatch, 'llm-accounts.mjs')));
const credProbe = await import(pathToFileURL(path.join(dispatch, 'provider-credential-probe.mjs')));
const acctProbe = await import(pathToFileURL(path.join(dispatch, 'provider-account-probe.mjs')));
const sessionProbe = await import(pathToFileURL(path.join(dispatch, 'provider-session-probe.mjs')));
const rotation = await import(pathToFileURL(path.join(repo, 'src/runner/execution/account-rotation.mjs')));
const pin = await import(pathToFileURL(path.join(repo, 'src/runner/execution/account-pin.mjs')));

// ---- helpers --------------------------------------------------------------------------------------------------------

const SCRUB = new Set(['pid', 'processStartTime', 'record']);
const scrub = (value) => {
  if (Array.isArray(value)) return value.map(scrub);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, SCRUB.has(k) ? '<scrubbed>' : scrub(v)]));
  return value;
};
const write = (name, vector) => {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, name), `${JSON.stringify(vector, null, 2)}\n`);
};
const attempt = (fn) => {
  try { return { value: fn() }; } catch (error) { return { error: { message: error.message, code: error.code ?? null } }; }
};
const attemptAsync = async (fn) => {
  try { return { value: await fn() }; } catch (error) { return { error: { message: error.message, code: error.code ?? null } }; }
};

// ---- the account config the vectors share --------------------------------------------------------------------------

const CONFIG = {
  llmAccounts: {
    openai: {
      work: { label: 'Work', credentialStore: { codex: '/home/vector/.codex-work', pi: '/home/vector/.pi-work' } },
      spare: { credentialStore: { codex: '/home/vector/.codex-spare' } },
      off: { disabled: true, credentialStore: { codex: '/home/vector/.codex-off' } },
    },
    'z-ai': { main: { credentialStore: { pi: '/home/vector/.pi-glm' } } },
  },
  executors: {
    'pi-executor': {
      providerModel: 'openai',
      invocations: [
        { id: 'pi-work', via: 'cli', command: 'pi', confinement: { backend: 'bwrap' }, credentialStore: { use: 'pi', homeEnv: 'PI_CODING_AGENT_DIR', files: ['auth.json'], sessionDir: 'sessions' } },
        { id: 'pi-plain', via: 'cli', command: '/usr/bin/pi', env: { PI_CODING_AGENT_DIR: '/home/vector/.pi-work' } },
      ],
    },
    'codex-executor': {
      providerModel: 'openai',
      confinement: { backend: 'bwrap' },
      invocations: [
        { id: 'codex-main', via: 'cli', command: 'codex', credentialStore: { use: 'codex', homeEnv: 'CODEX_HOME' } },
        { id: 'codex-spare', via: 'cli', command: 'codex' },
        { id: 'codex-api', via: 'api', command: 'codex' },
      ],
    },
    'glm-executor': { providerModel: 'z-ai', invocations: [{ id: 'pi-glm', via: 'cli', command: 'pi' }] },
  },
  modelPolicies: {
    openai: { standard: 'gpt-5-mini', flagship: [{ model: 'gpt-5-pro', pool: 'openai' }, 'gpt-5@other'], advanced: { model: 'gpt-5', effort: 'high' } },
  },
};
const INVENTORY = cap.providerAccountInventory(CONFIG);

// ---- 1. quota reset parsing and fault classification ----------------------------------------------------------------

const offsetMin = () => -new RealDate(clock.ms).getTimezoneOffset();
const WINDOW_TEXTS = [
  'Resets in 2h', 'resets in 24m1s', 'reset in 1h 30m', 'Resets in 45s', 'resets in 0s', 'resets in 5 minutes', 'resets  in  3h', 'will reset in 90m now',
  'no window here', 'resets in', 'resets in 12', 'RESETS IN 1H', 'quota resets in 1h30m, try later', 12,
];
const CLOCK_TEXTS = ['try again at 6:02 PM.', 'Try again at 12:00 AM', 'try again at 12:30 pm', 'try again at 9:05am', 'try again at 7:00 PM', 'try again at 6:2 PM', 'nothing'];
const clockCases = [];
for (const tz of ['UTC', 'Asia/Ho_Chi_Minh', 'America/New_York']) {
  process.env.TZ = tz;
  for (const now of [Date.UTC(2026, 10, 19, 5, 0, 0), Date.UTC(2026, 10, 19, 23, 30, 0), Date.UTC(2026, 6, 1, 12, 0, 0)]) {
    clock.ms = now;
    for (const text of CLOCK_TEXTS) clockCases.push({ tz, utcOffsetMin: offsetMin(), now, text, ms: cap.parseQuotaResetClockTime(text, now) });
  }
}
process.env.TZ = 'UTC';
clock.ms = Date.UTC(2026, 10, 19, 5, 0, 0);

const FAULT_INPUTS = [
  { provider: 'openai', adapterOutcome: 'provider-limit', stopCause: 'quota', providerSignal: { requestedWaitMs: 30000 } },
  { provider: 'openai', adapterOutcome: 'paused-limit', providerSignal: { resetHint: 'resets in 2h' } },
  { provider: 'openai', adapterOutcome: 'provider-limit', providerSignal: { resetHint: 'try again at 6:02 PM.' } },
  { provider: 'openai', adapterOutcome: 'provider-limit', providerSignal: { requestedWaitMs: 99999999999 } },
  { provider: 'openai', adapterOutcome: 'provider-limit', providerSignal: null },
  { provider: 'openai', adapterOutcome: 'provider-limit', stopCause: 'credential' },
  { provider: 'openai', adapterOutcome: 'provider-limit', stopCause: 'provider' },
  { provider: 'openai', structuredAgent: { stopReason: 'paused-limit' }, stopCause: 'quota' },
  { provider: 'openai', structuredAgent: { stopReason: 'provider-limit' }, stopCause: 'credential' },
  { provider: 'openai', adapterOutcome: 'completed' },
  { provider: '', adapterOutcome: 'provider-limit' },
  { provider: null, adapterOutcome: 'provider-limit' },
];
const SIGNALS = [{ status: 429, statusWord: 'RESOURCE_EXHAUSTED', requestedWaitMs: 30500, resetHint: 'resets in 1h' }, { status: 503 }, { resetHint: 'x' }, {}, null, 'text'];

write('fault-classification.v1.json', {
  contract: 'accounts-fault-classification.v1',
  recordedBy: 'test/golden-recorders/accounts.recorder.mjs',
  windowTexts: WINDOW_TEXTS.map((text) => ({ text, ms: cap.parseQuotaResetWindowMs(text) })),
  clockTimes: clockCases,
  describeSignal: SIGNALS.map((signal) => ({ signal, text: cap.describeProviderSignal(signal) })),
  classify: FAULT_INPUTS.flatMap((input) => ['UTC', 'Asia/Ho_Chi_Minh'].map((tz) => {
    process.env.TZ = tz;
    return { tz, utcOffsetMin: offsetMin(), now: clock.ms, input, fault: cap.classifyProviderCapacityFault({ ...input, now: clock.ms }) };
  })),
});
process.env.TZ = 'UTC';

// ---- 2. credential helpers ---------------------------------------------------------------------------------------------

const CODEX = { kind: 'codex-home', home: '/home/vector/.codex-work', cli: 'codex' };
const SOURCES = {
  codex: CODEX,
  codexTilde: { kind: 'codex-home', home: '~/.codex', cli: 'codex' },
  codexDollarHome: { kind: 'codex-home', home: '$HOME/.codex', cli: 'codex' },
  codexBraceHome: { kind: 'codex-home', home: '${HOME}/c', cli: 'codex' },
  omp: { kind: 'home-files', home: '/h/omp', files: ['agent.db', 'auth.json'], cli: 'omp' },
  pi: { kind: 'home-files', home: '/h/pi', files: ['auth.json'], cli: 'pi' },
  claudeConfigDir: { kind: 'home-files', home: '/h/claude', files: ['.credentials.json'], cli: 'claude' },
  claudeUnderHome: { kind: 'home-files', home: '/h/claude2', files: [path.join('.claude', '.credentials.json')], cli: 'claude' },
  unknownFiles: { kind: 'home-files', home: '/h/x', files: ['other'] },
  relativeHome: { kind: 'codex-home', home: 'relative/home' },
  noHome: { kind: 'codex-home' },
  badKind: { kind: 'mystery', home: '/h/y' },
};
const STORE_DECLS = [
  { use: 'codex', homeEnv: 'CODEX_HOME' }, { use: 'pi', homeEnv: 'PI_CODING_AGENT_DIR', files: ['auth.json'], sessionDir: 'sessions' },
  null, 'text', [], { use: 'Codex', homeEnv: 'X' }, { use: 'codex', homeEnv: '1X' }, { use: 'codex', homeEnv: 'X', extra: 1 },
  { use: 'codex', homeEnv: 'X', files: [] }, { use: 'codex', homeEnv: 'X', files: ['/abs'] }, { use: 'codex', homeEnv: 'X', files: ['a/../b'] },
  { use: 'codex', homeEnv: 'X', files: ['a', 'a'] }, { use: 'codex', homeEnv: 'X', files: [' '] }, { use: 'codex', homeEnv: 'X', sessionDir: '/abs' },
  { use: 'codex', homeEnv: 'X', sessionDir: '..' }, { use: 'codex', homeEnv: 'X', sessionDir: '' }, { use: 'codex', homeEnv: 'X', files: 'a' },
];
const ACCOUNT_SHAPES = {
  single: { credentialSource: CODEX },
  perCli: { credentialSources: { codex: CODEX, pi: SOURCES.pi } },
  none: {},
  emptyPerCli: { credentialSources: {} },
};
const SELECTION = {
  contract: 'provider-capacity-selection.v1', status: 'selected', provider: 'openai', accountId: 'work', accountLabel: 'Work', selectedAt: 't',
  lease: { runId: 'r', assignmentId: null, pid: 7 }, leaseReceipt: { provider: 'openai', accountId: 'work', runId: 'r', acquiredAt: 't', accountViewDigest: null },
  credentialSource: CODEX, credentialSources: { codex: CODEX },
};
write('credential-helpers.v1.json', {
  contract: 'accounts-credential-helpers.v1',
  recordedBy: 'test/golden-recorders/accounts.recorder.mjs',
  home: '/home/vector',
  commandCli: ['codex', '/usr/bin/Pi', 'C:\\bin\\omp.EXE', '', null, undefined, '/'].map((command) => ({ command: command ?? null, cli: cap.commandCli(command) })),
  sourceForCli: Object.entries(ACCOUNT_SHAPES).flatMap(([name, account]) => ['codex', 'pi', 'agy', null].map((cli) => ({ account: name, cli, source: cap.credentialSourceForCli(account, cli) }))),
  sources: Object.entries(ACCOUNT_SHAPES).map(([name, account]) => ({ account: name, sources: cap.accountCredentialSources(account) })),
  accountShapes: ACCOUNT_SHAPES,
  expandHome: ['~', '~/x', '$HOME', '$HOME/x', '${HOME}', '${HOME}/x', '~x', '$HOMEx', '/abs', 'rel', '', '  ', null, 5].map((home) => ({ home, expanded: cap.expandCredentialHome(home) })),
  storeProblems: STORE_DECLS.map((store) => ({ store, problem: cap.credentialStoreProblem(store) })),
  forInvocation: [
    { selection: SELECTION, invocation: { credentialStore: { use: 'codex', homeEnv: 'CODEX_HOME' } } },
    { selection: { ...SELECTION, credentialSource: null, credentialSources: { codex: CODEX, pi: SOURCES.pi } }, invocation: { credentialStore: { use: 'pi', homeEnv: 'X' } } },
    { selection: { ...SELECTION, credentialSources: { codex: CODEX } }, invocation: { credentialStore: { use: 'agy', homeEnv: 'X' } } },
    { selection: SELECTION, invocation: {} },
  ].map(({ selection, invocation }) => ({ selection, invocation, result: cap.providerCapacityForInvocation(selection, invocation) })),
  redact: [SELECTION, { status: 'refused', reason: 'x' }, { ...SELECTION, leaseReceipt: undefined }, null].map((selection) => ({ selection: selection ?? null, result: cap.redactProviderCapacitySelection(selection) ?? null })),
  sourcesForProbe: SOURCES,
  probeCommands: Object.keys(SOURCES).flatMap((name) => [
    { source: name, noTools: false, model: null },
    { source: name, noTools: true, model: 'gpt-5' },
    { source: name, noTools: false, model: 'claude-x' },
  ].map((opts) => ({ ...opts, plan: credProbe.credentialProbeCommand(SOURCES[name], { noTools: opts.noTools, model: opts.model }) }))),
  accountDirs: [['openai', 'work', null], ['openai', 'work', 'pi'], ['../x', 'work', null], ['openai', '', null], ['openai', 'work', 'Bad Cli'], ['a.b', 'c-d_e', 'codex']]
    .map(([provider, accountId, cli]) => ({ provider, accountId, cli, dir: cap.providerAccountDir('/rt', provider, accountId), storeDir: cap.credentialStoreDir('/rt', provider, accountId, cli) })),
});

// ---- 3. the lease state lifecycle -----------------------------------------------------------------------------------

const runtimeDir = path.join(scratch, 'runtime');
const statePath = path.join(runtimeDir, 'state.json');
const listing = () => (fs.existsSync(runtimeDir) ? fs.readdirSync(runtimeDir).sort() : []);
const auditLines = () => {
  const file = path.join(runtimeDir, 'audit.jsonl');
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line)) : [];
};
const AT = Date.UTC(2026, 10, 19, 5, 0, 0);
const DEAD_LEASE_STATE = {
  contract: 'provider-capacity-state.v1',
  providers: { 'openai-codex': { accounts: { work: { leases: {
    'dead-run': { runId: 'dead-run', assignmentId: 'dead-asg', pid: 999, processStartTime: '5', acquiredAt: '2026-11-19T01:00:00.000Z' },
    'live-run': { runId: 'live-run', assignmentId: 'live-asg', pid: 4243, processStartTime: '6', record: { pid: 4243, startTime: '6' }, acquiredAt: '2026-11-19T01:00:00.000Z' },
    'proven-dead': { runId: 'proven-dead', pid: 4244, acquiredAt: '2026-11-19T01:00:00.000Z' },
  } } } } },
  assignments: { 'openai-codex:dead-asg': { accountId: 'work', selectedAt: '2026-11-19T01:00:00.000Z' } },
  futureField: { kept: true },
};
const OLD_RELEASE_STATE = {
  contract: 'provider-capacity-state.v1',
  providers: { 'openai-codex': { accounts: { spare: { leases: {}, lastFaultAt: '2026-11-18T00:00:00.000Z', quarantine: { kind: 'temporary', reasonCode: 'quota-limit', until: '2026-11-19T00:00:00.000Z', quarantinedAt: '2026-11-18T23:00:00.000Z' } } } } },
  assignments: {},
  audit: [{ contract: 'provider-capacity-audit.v1', action: 'fault', at: '2026-11-18T23:00:00.000Z', provider: 'openai-codex', accountId: 'spare', reasonCode: 'quota-limit' }],
};
const NO_END_STATE = {
  contract: 'provider-capacity-state.v1',
  providers: { 'openai-codex': { accounts: {
    work: { leases: {}, quarantine: { kind: 'temporary', reasonCode: 'quota-limit' } },
    spare: { leases: {}, quarantine: { kind: 'temporary', reasonCode: 'quota-limit', until: 'garbage' } },
    off: { leases: {}, quarantine: { kind: 'manual-clear', reasonCode: 'auth-token', probe: { attemptedAt: '2026-11-19T04:50:00.000Z', status: 'failed' } } },
  } } },
  assignments: {},
};
const QUOTA_GUESS_STATE = {
  contract: 'provider-capacity-state.v1',
  providers: { 'openai-codex': { accounts: {
    work: { leases: {}, quarantine: { kind: 'temporary', reasonCode: 'quota-limit', until: '2026-11-19T06:00:00.000Z', resetKnown: false, quarantinedAt: '2026-11-19T05:00:00.000Z' } },
    spare: { leases: {}, quarantine: { kind: 'manual-clear', reasonCode: 'auth-token', quarantinedAt: '2026-11-19T04:00:00.000Z' } },
  } } },
  assignments: { 'openai-codex:asg-1': { accountId: 'spare', selectedAt: '2026-11-19T04:30:00.000Z' }, 'z-ai:asg-1': { accountId: 'gone', selectedAt: 'x' } },
};

const runOp = async (op) => {
  const common = { runtimeDir };
  switch (op.op) {
    case 'clock': clock.ms = op.ms; return { value: null };
    case 'seed': fs.mkdirSync(runtimeDir, { recursive: true }); fs.writeFileSync(statePath, typeof op.text === 'string' ? op.text : JSON.stringify(op.seed)); return { value: null };
    case 'reset': fs.rmSync(runtimeDir, { recursive: true, force: true }); return { value: null };
    case 'lease': {
      const { dead = [], ...rest } = op.args;
      return attempt(() => cap.acquireNamedAccountLease({
        runnerConfig: CONFIG, ...common, ...rest,
        runIsDead: (runId) => dead.includes(runId),
        isRunWorkerAlive: (runId) => (op.workerAlive ?? []).includes(runId),
      }));
    }
    case 'readStates': return attempt(() => cap.readAccountStates({ ...op.args, ...common, now: clock.ms }));
    case 'overlay': return attempt(() => cap.readAccountStateOverlay({ ...op.args, ...common, now: clock.ms }));
    case 'fault': {
      const { classify, ...rest } = op.args;
      return attempt(() => cap.recordProviderAccountFault({ ...rest, ...common, fault: cap.classifyProviderCapacityFault({ ...classify, now: clock.ms }) }));
    }
    case 'quarantine': return attempt(() => cap.quarantineProviderAccount({ ...op.args, ...common }));
    case 'clear': return attempt(() => cap.clearProviderAccountQuarantine({ runnerConfig: CONFIG, ...op.args, ...common }));
    case 'probeRecord': return attempt(() => cap.recordAccountProbe({ ...op.args, ...common, now: clock.ms }));
    case 'probeQuarantined': return attemptAsync(async () => {
      const calls = [];
      const tried = await cap.probeQuarantinedAccounts({
        runnerConfig: CONFIG, ...op.args, ...common, now: clock.ms,
        probe: async (request) => { calls.push({ accountId: request.accountId, cli: request.cli, model: request.model }); return op.answer; },
      });
      return { tried, calls };
    });
    case 'release': return attempt(() => cap.releaseProviderAccountLease({ ...op.args, ...common }));
    case 'drop': return attempt(() => cap.dropAssignmentRecord({ ...op.args, ...common }));
    case 'audit': return attempt(() => cap.auditLeaseReceipt(op.receipt, { ...op.args, ...common }));
    case 'inspect': return attempt(() => cap.inspectProviderCapacity({ runnerConfig: CONFIG, ...op.args, ...common }));
    case 'rotation': return attempt(() => rotation.inspectAccountRotation({ runnerConfig: CONFIG, pool: op.pool, runtimeDir }));
    default: throw new Error(`unknown op ${op.op}`);
  }
};

const FAULT_QUOTA = { provider: 'openai-codex', adapterOutcome: 'provider-limit', stopCause: 'quota', providerSignal: { requestedWaitMs: 30000 } };
const FAULT_GUESS = { provider: 'openai-codex', adapterOutcome: 'provider-limit', providerSignal: null };
const FAULT_AUTH = { provider: 'openai-codex', adapterOutcome: 'provider-limit', stopCause: 'credential' };
const FAULT_PROVIDER = { provider: 'openai-codex', adapterOutcome: 'provider-limit', stopCause: 'provider' };
const DIRECT_OK = [{ cli: 'codex', ok: true, reason: null, providerSignal: null, exitCode: 0, elapsedMs: 120 }];
const DIRECT_LOGIN = [{ cli: 'codex', ok: false, reason: 'login', providerSignal: { status: 401 }, exitCode: 1, elapsedMs: 80 }];
const DIRECT_QUOTA = [{ cli: 'pi', ok: false, reason: 'usage-limit', providerSignal: { requestedWaitMs: 5000 }, exitCode: 2, elapsedMs: 90 }];
const DIRECT_TIMEOUT = [{ cli: 'codex', ok: false, reason: null, providerSignal: null, exitCode: null, elapsedMs: 90000 }];

const SCENARIOS = [
  { name: 'lease-release-and-sticky', ops: [
    { op: 'reset' },
    { op: 'lease', args: { provider: 'openai-codex', accountId: 'work', assignmentId: 'asg-1', runId: 'run-1', cli: 'codex', accountViewDigest: 'digest-1' } },
    { op: 'clock', ms: AT + 60_000 },
    { op: 'lease', args: { provider: 'openai-codex', accountId: 'work', runId: 'run-2', cli: 'pi' } },
    { op: 'lease', args: { provider: 'openai-codex', accountId: 'spare', assignmentId: 'asg-2', runId: 'run-3' } },
    { op: 'readStates', args: { provider: 'openai-codex', assignmentId: 'asg-1' } },
    { op: 'overlay', args: { assignmentId: 'asg-2' } },
    { op: 'audit', receipt: { provider: 'openai-codex', accountId: 'work', runId: 'run-1', acquiredAt: '2026-11-19T05:00:00.000Z' }, args: { assignmentId: 'asg-1' } },
    { op: 'audit', receipt: null, args: { assignmentId: 'asg-1' } },
    { op: 'audit', receipt: { provider: 'openai-codex', accountId: 'spare', runId: 'x', acquiredAt: 'later' }, args: { assignmentId: 'asg-1' } },
    { op: 'audit', receipt: { provider: 'z-ai', accountId: 'main', runId: 'x', acquiredAt: 'later' }, args: { assignmentId: 'asg-1' } },
    { op: 'audit', receipt: null, args: { assignmentId: 'nobody' } },
    { op: 'inspect', args: {} },
    { op: 'release', args: { provider: 'openai-codex', accountId: 'work', runId: 'run-1' } },
    { op: 'release', args: { provider: 'openai-codex', accountId: 'work', runId: 'run-1' } },
    { op: 'release', args: { provider: 'openai-codex', accountId: '', runId: 'run-1' } },
    { op: 'drop', args: { assignmentId: 'asg-1' } },
    { op: 'drop', args: { assignmentId: 'asg-1' } },
    { op: 'drop', args: { assignmentId: '' } },
    { op: 'inspect', args: { provider: 'openai-codex', accountId: 'work' } },
  ] },
  { name: 'lease-refusals', ops: [
    { op: 'reset' },
    { op: 'lease', args: { provider: 'openai-codex', accountId: 'nope', runId: 'r' } },
    { op: 'lease', args: { provider: 'openai-codex', runId: 'r' } },
    { op: 'lease', args: { provider: 'openai-codex', accountId: 'off', runId: 'r' } },
    { op: 'lease', args: { provider: 'openai-codex', accountId: 'spare', runId: 'r', cli: 'pi' } },
    { op: 'lease', args: { provider: 'unmanaged', accountId: 'work', runId: 'r' } },
    { op: 'lease', args: { provider: 'openai-codex', accountId: 'work' } },
    { op: 'lease', args: { provider: '', accountId: 'work', runId: 'r' } },
    { op: 'lease', args: { provider: 'z-ai', accountId: 'main', runId: 'r', cli: 'pi' } },
    { op: 'inspect', args: {} },
  ] },
  { name: 'quarantine-fault-and-clear', ops: [
    { op: 'reset' },
    { op: 'fault', args: { provider: 'openai-codex', accountId: 'work', classify: FAULT_QUOTA, providerSignal: { requestedWaitMs: 30000 }, runId: 'run-1', assignmentId: 'asg-1' } },
    { op: 'lease', args: { provider: 'openai-codex', accountId: 'work', runId: 'run-2' } },
    { op: 'readStates', args: { provider: 'openai-codex' } },
    { op: 'clock', ms: AT + 31_000 },
    { op: 'lease', args: { provider: 'openai-codex', accountId: 'work', runId: 'run-3' } },
    { op: 'fault', args: { provider: 'openai-codex', accountId: 'spare', classify: FAULT_GUESS, runId: 'run-4', assignmentId: null } },
    { op: 'readStates', args: { provider: 'openai-codex' } },
    { op: 'fault', args: { provider: 'openai-codex', accountId: 'spare', classify: FAULT_AUTH, runId: 'run-5', assignmentId: 'asg-5' } },
    { op: 'readStates', args: { provider: 'openai-codex' } },
    { op: 'fault', args: { provider: 'openai-codex', accountId: 'off', classify: FAULT_PROVIDER, runId: 'run-6', assignmentId: null } },
    { op: 'fault', args: { provider: 'openai-codex', accountId: 'off', classify: { provider: 'openai-codex', adapterOutcome: 'completed' }, runId: 'run-7' } },
    { op: 'quarantine', args: { provider: 'openai-codex', accountId: 'work', reasonCode: 'manual', quarantineKind: 'manual-clear', detail: { by: 'test' } } },
    { op: 'quarantine', args: { provider: 'openai-codex', accountId: 'off', reasonCode: 'x', until: '2026-11-19T07:00:00.000Z', resetKnown: true } },
    { op: 'inspect', args: {} },
    { op: 'clear', args: { provider: 'openai-codex', accountId: 'work', reason: 'logged in again', caller: 'someone' } },
    { op: 'clear', args: { provider: 'openai-codex', accountId: 'work' } },
    { op: 'clear', args: { provider: 'openai-codex', accountId: 'work', force: true, reason: '' } },
    { op: 'clear', args: { provider: 'openai-codex', accountId: 'ghost' } },
    { op: 'clear', args: { provider: 'nope', accountId: 'work', force: true } },
    { op: 'clear', args: { provider: 'openai-codex', accountId: 'off', force: true } },
    { op: 'rotation', pool: 'openai' },
    { op: 'rotation', pool: 'z-ai' },
    { op: 'rotation', pool: 'unmanaged' },
  ] },
  { name: 'account-probe-record', ops: [
    { op: 'reset' },
    { op: 'probeRecord', args: { provider: 'openai-codex', accountId: 'work', direct: DIRECT_LOGIN, verdict: 'account-fault', source: 'probe-account' } },
    { op: 'readStates', args: { provider: 'openai-codex' } },
    { op: 'probeRecord', args: { provider: 'openai-codex', accountId: 'work', direct: DIRECT_OK, verdict: 'healthy', source: 'probe-account' } },
    { op: 'probeRecord', args: { provider: 'openai-codex', accountId: 'work', direct: DIRECT_QUOTA, verdict: 'account-fault', source: 'self' } },
    { op: 'probeRecord', args: { provider: 'openai-codex', accountId: 'work', direct: DIRECT_TIMEOUT, verdict: null, source: 'self' } },
    { op: 'probeRecord', args: { provider: 'openai-codex', accountId: 'work', direct: DIRECT_OK.concat(DIRECT_QUOTA), verdict: 'mixed', source: 'self' } },
    { op: 'probeRecord', args: { provider: 'openai-codex', accountId: 'work', direct: [], verdict: 'nothing-to-probe', source: 'probe-account' } },
    { op: 'probeRecord', args: { provider: 'openai-codex', accountId: 'work', direct: DIRECT_OK, source: 'self' } },
    { op: 'probeRecord', args: { provider: 'openai-codex', accountId: 'work', direct: DIRECT_OK, source: 'bogus' } },
    { op: 'probeRecord', args: { provider: '', accountId: 'work', direct: DIRECT_OK } },
    { op: 'probeRecord', args: { provider: 'openai-codex', accountId: 'work' } },
    { op: 'inspect', args: { provider: 'openai-codex' } },
  ] },
  { name: 'dead-lease-reclaim', ops: [
    { op: 'reset' },
    { op: 'seed', seed: DEAD_LEASE_STATE },
    { op: 'lease', args: { provider: 'openai-codex', accountId: 'work', assignmentId: 'asg-9', runId: 'run-9', dead: ['proven-dead'] } },
    { op: 'seed', seed: DEAD_LEASE_STATE },
    { op: 'lease', args: { provider: 'openai-codex', accountId: 'work', runId: 'run-10' }, workerAlive: ['dead-run'] },
  ] },
  { name: 'older-generations-and-damage', ops: [
    { op: 'reset' },
    { op: 'seed', seed: OLD_RELEASE_STATE },
    { op: 'readStates', args: { provider: 'openai-codex' } },
    { op: 'lease', args: { provider: 'openai-codex', accountId: 'spare', runId: 'run-1' } },
    { op: 'clock', ms: AT + 3_600_000 },
    { op: 'lease', args: { provider: 'openai-codex', accountId: 'spare', runId: 'run-2' } },
    { op: 'seed', text: '{not json' },
    { op: 'readStates', args: { provider: 'openai-codex' } },
    { op: 'lease', args: { provider: 'openai-codex', accountId: 'work', runId: 'run-3' } },
    { op: 'seed', text: '[1,2]' },
    { op: 'lease', args: { provider: 'openai-codex', accountId: 'work', runId: 'run-4' } },
    { op: 'seed', text: '   \n' },
    { op: 'lease', args: { provider: 'openai-codex', accountId: 'work', runId: 'run-5' } },
    { op: 'seed', seed: { contract: 'provider-capacity-state.v1', providers: [], assignments: 'x', audit: 'x' } },
    { op: 'lease', args: { provider: 'openai-codex', accountId: 'work', runId: 'run-6' } },
    { op: 'seed', seed: NO_END_STATE },
    { op: 'readStates', args: { provider: 'openai-codex' } },
    { op: 'inspect', args: {} },
    { op: 'lease', args: { provider: 'openai-codex', accountId: 'work', runId: 'run-7' } },
    { op: 'lease', args: { provider: 'openai-codex', accountId: 'spare', runId: 'run-8' } },
  ] },
  { name: 'unlock-probe-of-quarantined-accounts', ops: [
    { op: 'reset' },
    { op: 'seed', seed: QUOTA_GUESS_STATE },
    { op: 'overlay', args: { assignmentId: 'asg-1' } },
    { op: 'probeQuarantined', args: { provider: 'openai-codex', cli: 'codex', model: 'gpt-5', accountId: 'work', runKey: 'run-a' }, answer: { ok: false, detail: 'the login is still rejected', reason: 'login', providerSignal: null, exitCode: 1, elapsedMs: 50 } },
    { op: 'readStates', args: { provider: 'openai-codex' } },
    { op: 'probeQuarantined', args: { provider: 'openai-codex', cli: 'codex', runKey: 'run-a' }, answer: { ok: true } },
    { op: 'clock', ms: AT + 31 * 60_000 },
    { op: 'probeQuarantined', args: { provider: 'openai-codex', cli: 'codex', runKey: 'run-b', accountId: 'work' }, answer: { ok: true, exitCode: 0, elapsedMs: 70 } },
    { op: 'inspect', args: {} },
    { op: 'probeQuarantined', args: { provider: 'unmanaged', runKey: 'x' }, answer: { ok: true } },
    { op: 'seed', seed: QUOTA_GUESS_STATE },
    { op: 'probeQuarantined', args: { provider: 'openai-codex', accountId: 'spare', runKey: 'run-c' }, answer: { ok: false, detail: 'x'.repeat(400), reason: 'usage-limit', providerSignal: { requestedWaitMs: 60000 }, exitCode: 3 } },
    { op: 'readStates', args: { provider: 'openai-codex' } },
  ] },
];

// state.json as parsed (pid, processStartTime and record scrubbed) and as bytes: the same scrubbed document written
// with two-space indent and a final newline, which is exactly what the lease writes; text that is not JSON stays as is.
const stateOf = () => {
  if (!fs.existsSync(statePath)) return { state: null, stateText: null };
  const raw = fs.readFileSync(statePath, 'utf8');
  try {
    const scrubbed = scrub(JSON.parse(raw));
    return { state: scrubbed, stateText: `${JSON.stringify(scrubbed, null, 2)}\n` };
  } catch { return { state: null, stateText: raw }; }
};

const scenarios = [];
for (const scenario of SCENARIOS) {
  const ops = [];
  clock.ms = AT;
  fs.rmSync(runtimeDir, { recursive: true, force: true });
  for (const op of scenario.ops) {
    const result = await runOp(op);
    ops.push({
      ...op,
      expect: scrub(result),
      ...stateOf(),
      audit: scrub(auditLines()),
      files: listing(),
    });
  }
  scenarios.push({ name: scenario.name, startMs: AT, ops });
}
write('lease-state.v1.json', {
  contract: 'accounts-lease-state.v1',
  recordedBy: 'test/golden-recorders/accounts.recorder.mjs',
  note: 'stateText is state.json byte for byte with pid, processStartTime and record scrubbed; replaying must end each op on the same bytes, audit lines and directory listing',
  config: CONFIG,
  inventory: INVENTORY,
  scenarios,
});

// ---- 4. probe outcome vectors --------------------------------------------------------------------------------------

const runDirs = path.join(scratch, 'run-dirs');
const mkRunDir = (name, files) => {
  const dir = path.join(runDirs, name);
  for (const [rel, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), typeof content === 'string' ? content : JSON.stringify(content));
  }
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};
const RUN_FILES = {
  none: {},
  trustScreen: { 'herdr-diagnosis.json': { detectionScreen: 'Do you trust the files in this folder?\nYes / No', explain: { matchedRule: 'codex-trust-dialog', promptText: 'trust this folder?' } }, 'visibility.json': { screen: 'screen text' } },
  trustRuleOnly: { 'herdr-diagnosis.json': { explain: { matchedRule: 'claude-trust-prompt' } } },
  visibilityOnly: { 'visibility.json': { screen: 'bwrap: no permissions to create new namespace' } },
  brokenJson: { 'herdr-diagnosis.json': '{nope' },
};
const classifyCases = [];
const CLASSIFY_BASE = [
  { ok: true, text: 'thinking\nOK\n' }, { ok: true, text: 'done without the word' }, { ok: true, text: '' },
  { ok: false, text: 'x', failureCode: 'provider-limit', cause: 'credential', providerSignal: { status: 401 } },
  { ok: false, text: 'x', failureCode: 'provider-limit', cause: 'credential', providerSignal: null },
  { ok: false, text: 'x', failureCode: 'provider-limit', cause: 'quota', providerSignal: { resetHint: 'resets in 1h' } },
  { ok: false, text: 'x', failureCode: 'provider-limit', cause: 'quota' },
  { ok: false, text: 'x', failureCode: 'provider-limit', cause: 'provider', providerSignal: { status: 503, statusWord: 'UNAVAILABLE' } },
  { ok: false, text: 'x', failureCode: 'provider-limit', cause: 'provider' },
  { ok: false, text: 'x\nEROFS: read-only file system\ny', failureCode: 'oops' },
  { ok: false, text: 'EROFSX nothing\nOperation not permitted here', failureCode: null },
  { ok: false, text: 'confinement refused by policy', failureCode: 'x' },
  { ok: false, text: 'the call timed out after 90s', failureCode: 'x' },
  { ok: false, text: 'ok', failureCode: 'run-timeout' }, { ok: false, text: 'ok', failureCode: 'timed_out' }, { ok: false, text: 'ok', failureCode: 'time-out' },
  { ok: false, text: 'ok', failureCode: 'times out' }, { ok: false, text: 'ok', failureCode: 'runtime outage' },
  { ok: false, text: '\n  \nsomething broke\nsecond', failureCode: 'x' }, { ok: false, text: '', failureCode: null }, { ok: false },
  { ok: false, text: 'a', failureCode: 'provider-limit', cause: null },
];
for (const dirName of Object.keys(RUN_FILES)) {
  const runDir = mkRunDir(dirName, RUN_FILES[dirName]);
  for (const base of CLASSIFY_BASE) {
    classifyCases.push({ runFiles: dirName, input: base, result: acctProbe.classifyAccountProbe({ ...base, runDir: dirName === 'none' ? null : runDir }) });
  }
}
const row = (leg, outcome, inVerdict) => ({ leg, outcome, ...(inVerdict === undefined ? {} : { inVerdict }) });
const VERDICT_ROWS = [
  [], [row('direct', 'no-probe')], [row('direct', 'ok')], [row('direct', 'ok'), row('harness', 'ok', true)], [row('direct', 'auth'), row('direct', 'quota')],
  [row('direct', 'auth'), row('harness', 'ok', true)], [row('direct', 'auth'), row('harness', 'ok', false)], [row('direct', 'auth'), row('harness', 'sandbox', true)],
  [row('direct', 'ok'), row('harness', 'blocked-trust-prompt', true)], [row('direct', 'ok'), row('harness', 'sandbox', false)],
  [row('harness', 'auth', true), row('harness', 'quota', true)], [row('harness', 'ok', true), row('harness', 'other', true)], [row('harness', 'auth', false)],
  [row('direct', 'ok'), row('direct', 'other')], [row('direct', 'other')], [row('direct', 'ok'), row('direct', 'auth')], [row('direct', 'no-probe'), row('harness', 'ok', true)],
  [row('direct', 'quota'), row('harness', 'quarantined', false)], [row('harness', 'quarantined', false)],
];
const HOME = '/home/vector';
const planFor = (provider, accountId, executorId = null) => acctProbe.accountInvocations(CONFIG, { provider, accountId, executorId });
const PLAN_ASKS = [['openai', 'work', null], ['openai', 'spare', null], ['codex', 'spare', null], ['openai', 'work', 'pi-executor'], ['openai', 'off', null], ['openai', 'ghost', null], ['z-ai', 'main', null], ['glm', 'main', null], ['unmanaged', 'x', null]];
const MODEL_ASKS = [['codex-executor', 'openai'], ['pi-executor', 'openai'], ['glm-executor', 'z-ai'], ['ghost', 'openai'], ['codex-executor', 'other']];
const PIN_VALUES = ['openai/work', ' openai/work ', 'openai', '/work', 'openai/', '', '   ', 'a/b/c', null, 7];
const PIN_ASKS = [['openai', 'work'], ['codex', 'spare'], ['z-ai', 'main'], ['openai', 'ghost'], ['glm', 'main']];
write('account-probe.v1.json', {
  contract: 'accounts-account-probe.v1',
  recordedBy: 'test/golden-recorders/accounts.recorder.mjs',
  home: HOME,
  config: CONFIG,
  inventory: INVENTORY,
  runFiles: RUN_FILES,
  classify: classifyCases,
  verdict: VERDICT_ROWS.map((rows) => ({ rows, verdict: acctProbe.accountProbeVerdict(rows) })),
  invocations: PLAN_ASKS.map(([provider, accountId, executorId]) => ({ provider, accountId, executorId, plan: planFor(provider, accountId, executorId) })),
  probeModel: MODEL_ASKS.map(([executorId, family]) => ({ executorId, family, result: acctProbe.probeModelFor(CONFIG, { executorId, family }) })),
  pinned: PIN_ASKS.map(([provider, accountId]) => ({ provider, accountId, config: acctProbe.configPinnedToAccount(CONFIG, { provider, accountId }) })),
  contractOf: acctProbe.probeContract({}),
  contractCustom: acctProbe.probeContract({ prompt: 'p', timeoutMs: 5 }),
  binding: acctProbe.withProbeBinding({ assignmentId: 'a', policy: { keep: 1 } }, { executorId: 'e', invocationId: 'i' }),
  bindingNoPolicy: acctProbe.withProbeBinding({ assignmentId: 'a' }, { executorId: 'e', invocationId: 'i' }),
  pins: PIN_VALUES.map((value) => ({ value, result: pin.parseAccountPin(value) })),
  runnerConfigForBinding: [{ account: { pool: 'openai', id: 'work' } }, { account: { pool: 'codex', id: 'spare' } }, {}, null].map((bound) => ({ bound, config: pin.runnerConfigForBinding(CONFIG, bound) })),
});

// ---- 5. login homes and the session probe -----------------------------------------------------------------------------

const homeRoot = path.join(scratch, 'homes');
fs.mkdirSync(path.join(homeRoot, '.codex'), { recursive: true });
fs.mkdirSync(path.join(homeRoot, 'real-pi'), { recursive: true });
fs.mkdirSync(path.join(homeRoot, '.pi'), { recursive: true });
fs.symlinkSync(path.join(homeRoot, 'real-pi'), path.join(homeRoot, '.pi', 'agent'));
const HOMES_RUNNER = {
  llmAccounts: { openai: { work: { credentialStore: { codex: path.join(homeRoot, '.codex'), pi: path.join(homeRoot, 'real-pi'), claude: '/elsewhere/claude' } }, spare: { credentialStore: { codex: '/elsewhere/codex', agy: '' } } } },
  executors: { e: { invocations: [{ id: 'i', credentialStore: { use: 'codex', homeEnv: 'CODEX_HOME' } }, { id: 'j', credentialStore: { use: 'pi', homeEnv: 'HOME' } }, { id: 'k', credentialStore: { use: 'x', homeEnv: 'EXTRA_HOME' } }] } },
};
const homeCases = [
  { env: {} }, { env: { CODEX_HOME: '/elsewhere/codex' } }, { env: { CODEX_HOME: path.join(homeRoot, '.codex') } }, { env: { EXTRA_HOME: '/extra', PI_CODING_AGENT_DIR: path.join(homeRoot, 'real-pi') } },
].map((c) => ({ homeDir: homeRoot, env: c.env }));
write('login-homes.v1.json', {
  contract: 'accounts-login-homes.v1',
  recordedBy: 'test/golden-recorders/accounts.recorder.mjs',
  note: 'paths are relative to a scratch home the test rebuilds: <HOME> stands for it; real-pi is a directory, .pi/agent a link to it',
  runner: JSON.parse(JSON.stringify(HOMES_RUNNER).replaceAll(homeRoot, '<HOME>')),
  defaultStores: homeCases.map((c) => ({ env: JSON.parse(JSON.stringify(c.env).replaceAll(homeRoot, '<HOME>')), hits: llm.defaultLoginHomeStores(HOMES_RUNNER, c) })),
  machineStores: [null, 'codex', 'pi'].flatMap((inPlaceCli) => homeCases.map((c) => ({
    env: JSON.parse(JSON.stringify(c.env).replaceAll(homeRoot, '<HOME>')),
    inPlaceCli,
    stores: JSON.parse(JSON.stringify((() => {
      // machineLoginStores reads the config through the config door; the vectors hand it the same runner value.
      const original = HOMES_RUNNER;
      const homeDir = c.homeDir;
      const request = { homeDir, env: c.env, inPlaceCli };
      return machineStoresOf(original, request);
    })()).replaceAll(homeRoot, '<HOME>')),
  }))),
});

function machineStoresOf(runner, { homeDir, env, inPlaceCli }) {
  // The body of llm-accounts.machineLoginStores with the config read replaced by the value it reads.
  const expand = cap.expandCredentialHome;
  const LOGIN = [['codex', 'CODEX_HOME', '.codex'], ['pi', 'PI_CODING_AGENT_DIR', path.join('.pi', 'agent')], ['omp', 'PI_CODING_AGENT_DIR', path.join('.omp', 'agent')], ['claude', 'CLAUDE_CONFIG_DIR', '.claude'], ['agy', null, '.gemini']];
  const real = (value) => { try { return fs.realpathSync(value); } catch { return path.resolve(value); } };
  const plain = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.values(v) : []);
  const own = new Set(LOGIN.filter(([cli]) => cli === inPlaceCli).flatMap(([, name, dir]) => [path.join(homeDir, dir), name && env[name]]).map((v) => expand(v)).filter(Boolean).map(real));
  const stores = new Set();
  const add = (value) => {
    if (typeof value !== 'string' || !value.trim()) return;
    const expanded = expand(value);
    if (!expanded || !own.has(real(expanded))) stores.add(expanded ?? value);
  };
  for (const pool of plain(runner.llmAccounts)) for (const account of plain(pool)) plain(account?.credentialStore).forEach(add);
  for (const [, name, dir] of LOGIN) { add(path.join(homeDir, dir)); if (name) add(env[name]); }
  for (const executor of plain(runner.executors)) {
    for (const invocation of Array.isArray(executor?.invocations) ? executor.invocations : []) {
      const store = cap.credentialStoreOf(invocation);
      if (typeof store?.homeEnv === 'string' && store.homeEnv !== 'HOME') add(env[store.homeEnv]);
    }
  }
  return [...stores];
}

const SESSION_RUNS = {
  kept: { 'steps/finalize-home.json': { detail: { homes: 1, transcriptPath: 'transcript', homeLayout: [{ path: 'auth.json', kind: 'file', files: 1, bytes: 10 }, { path: 'sessions', kind: 'dir', files: 2, bytes: 300 }, { path: 'bin', kind: 'dir', files: 1, bytes: 5 }], warnings: [{ code: 'w', message: 'm', extra: 1 }] } }, 'transcript/a.jsonl': 'abc', 'transcript/sub/b.jsonl': 'defgh' },
  mismatch: { 'steps/finalize-home.json': { detail: { homes: 1, homeLayout: [{ path: 'auth.json', kind: 'file', files: 1, bytes: 10 }, { path: 'agent-sessions', kind: 'dir', files: 3, bytes: 90 }, { path: 'logs', kind: 'dir', files: 0, bytes: 0 }], warnings: [] } } },
  copyFailed: { 'steps/finalize-home.json': { detail: { homes: 1, homeLayout: [], warnings: [{ code: 'session-copy-failed', message: 'denied' }] } } },
  noHome: { 'steps/finalize-home.json': { detail: { homes: 0, homeLayout: [] } } },
  noStep: {},
};
const SESSION_CFG = {
  executors: {
    pi: { invocations: [
      { id: 'plain', via: 'cli', credentialStore: { use: 'pi', homeEnv: 'X', files: ['auth.json', 'bin/fd'], sessionDir: 'sessions' } },
      { id: 'boxed', via: 'cli', confinement: { backend: 'bwrap' }, credentialStore: { use: 'pi', homeEnv: 'X', files: ['auth.json'] } },
      { id: 'api', via: 'api' },
    ] },
    inherits: { confinement: { backend: 'bwrap' }, invocations: [{ id: 'one', via: 'cli' }, { id: 'two', via: 'cli', confinement: { backend: 'bwrap' } }] },
    none: { invocations: [{ id: 'api', via: 'api' }] },
    tool: { kind: 'tool', invocations: [{ id: 't', via: 'cli' }] },
  },
};
const sessionKeep = [];
for (const [name, invocationName] of [['kept', 'plain'], ['kept', 'boxed'], ['mismatch', 'plain'], ['mismatch', 'boxed'], ['copyFailed', 'plain'], ['noHome', 'plain'], ['noStep', 'plain']]) {
  const runDir = mkRunDir(`session-${name}`, SESSION_RUNS[name]);
  const invocation = SESSION_CFG.executors.pi.invocations.find((i) => i.id === invocationName);
  const result = sessionProbe.describeSessionKeep({ runDir, invocation, executorId: 'pi' });
  sessionKeep.push({ runFiles: name, invocation: invocationName, result: JSON.parse(JSON.stringify(result).replaceAll(runDir, '<RUN-DIR>')) });
}
sessionKeep.push({ runFiles: null, invocation: 'plain', result: sessionProbe.describeSessionKeep({ runDir: null, invocation: SESSION_CFG.executors.pi.invocations[0], executorId: 'pi' }) });
const probeInvocations = [['pi', null], ['pi', 'api'], ['pi', 'boxed'], ['pi', 'ghost'], ['inherits', null], ['none', null], ['tool', null], ['absent', null]].map(([executorId, invocationId]) => {
  const result = attempt(() => sessionProbe.sessionProbeInvocation(SESSION_CFG, executorId, invocationId));
  return { executorId, invocationId, ...(result.error ? { error: result.error.message } : { id: result.value.id }) };
});
write('session-probe.v1.json', {
  contract: 'accounts-session-probe.v1',
  recordedBy: 'test/golden-recorders/accounts.recorder.mjs',
  config: SESSION_CFG,
  runFiles: SESSION_RUNS,
  keep: sessionKeep,
  invocations: probeInvocations,
  categories: sessionProbe.SESSION_PROBE_CATEGORIES,
  cheapestTier: sessionProbe.CHEAPEST_TIER,
});

// ---- 6. rotation and walk state ----------------------------------------------------------------------------------------

const binding = (pool, extra = {}) => ({ executor: 'e', invocation: 'i', pool, model: 'm', reasoningEffort: 'high', ...extra });
const UNIT = {
  bindings: {
    'producer/1': [
      { assignmentId: 'a1', boundAt: '2026-11-19T05:00:00.000Z', binding: binding('openai', { leaseAccount: 'work' }), outcome: 'provider-limit', failureCause: 'credential' },
      { assignmentId: 'a2', boundAt: '2026-11-19T05:01:00.000Z', fallbackFrom: { kind: 'next-candidate' }, binding: binding('z-ai', { leaseAccount: 'main' }), leaseConflict: true },
      { assignmentId: 'a3', boundAt: '2026-11-19T05:02:00.000Z', binding: binding('z-ai', { leaseAccount: 'main' }), outcome: 'provider-limit' },
      { assignmentId: 'a4', boundAt: '2026-11-19T05:03:00.000Z', binding: { executor: 'e', invocation: 'i', model: 'm' } },
      { assignmentId: 'a5', boundAt: '2026-11-19T05:04:00.000Z', binding: binding('openai', { leaseAccount: 'spare' }), outcome: 'provider-limit' },
      { assignmentId: 'a6', boundAt: 'garbage', binding: binding('openai', { leaseAccount: 'spare' }) },
    ],
    'producer/2': [{ assignmentId: 'b1', binding: binding('openai', { model: 'big' }) }, { assignmentId: 'b2', binding: { refused: true, executor: 'e' } }],
    'producer/3': [{ assignmentId: 'c1', binding: binding('z-ai') }],
    'reviewer/1': [{ assignmentId: 'd1', binding: binding('openai') }],
    'producer/x': [{ assignmentId: 'e1', binding: binding('openai') }],
    'producer/broken': 'nope',
  },
};
const ROTATIONS = [null, { total: 3, healthy: 0 }, { total: 3, healthy: 2 }, { total: 1, healthy: 1 }, { total: 2, healthy: 1 }];
const walkAsks = [['producer', 1, 'a1'], ['producer', 1, 'a2'], ['producer', 1, 'a3'], ['producer', 1, 'a4'], ['producer', 1, 'a5'], ['producer', 1, 'a6'], ['producer', 1, 'zz'], ['producer', 2, 'b1'], ['producer', 3, 'c1'], ['reviewer', 1, 'd1'], ['producer', 'x', 'e1'], ['ghost', 1, 'q']];
write('rotation-walk.v1.json', {
  contract: 'accounts-rotation-walk.v1',
  recordedBy: 'test/golden-recorders/accounts.recorder.mjs',
  unit: UNIT,
  mayRotate: ROTATIONS.flatMap((rotationValue) => [0, 1, 2, 3].map((spent) => ({ rotation: rotationValue, spent, result: rotation.mayRotateAccount(rotationValue, spent) }))),
  tried: UNIT.bindings['producer/1'] && [-1, 0, 1, 2, 3, 4, 5, 6, 9].map((at) => ({ at, result: rotation.triedBindingsOf(UNIT.bindings['producer/1'], at) })),
  triedNotArray: [rotation.triedBindingsOf(null, 2), rotation.triedBindingsOf('x', 2)],
  failed: [rotation.failedAccountsOf(UNIT.bindings['producer/1']), rotation.failedAccountsOf(UNIT.bindings['producer/1'].slice(0, 2)), rotation.failedAccountsOf([]), rotation.failedAccountsOf(null)],
  kept: [['producer', 1], ['producer', 2], ['producer', 3], ['producer', 4], ['reviewer', 1], ['reviewer', 2], ['ghost', 9]].map(([seat, round]) => ({ seat, round, result: rotation.keptBindingOf(UNIT, seat, round) })),
  faultPools: [null, 0, Date.parse('2026-11-19T05:01:00.000Z'), Date.parse('2026-11-19T05:00:30.000Z'), -Infinity].map((boundBefore) => ({
    boundBefore: boundBefore === -Infinity ? 'neg-infinity' : boundBefore, pools: [...rotation.credentialFaultPools(UNIT, { boundBefore: boundBefore === -Infinity ? -Infinity : boundBefore })],
  })),
  walkState: walkAsks.map(([seat, round, assignmentId]) => ({ seat, round, assignmentId, result: rotation.walkStateOf(UNIT, { seat, round, assignmentId }) })),
  walkStateNoUnit: rotation.walkStateOf(null, { seat: 'producer', round: 1, assignmentId: 'a1' }),
});

console.log(`wrote account vectors to ${path.relative(repo, outDir)}`);
fs.rmSync(scratch, { recursive: true, force: true });
