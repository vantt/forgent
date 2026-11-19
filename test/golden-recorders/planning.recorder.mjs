#!/usr/bin/env node
// Planning golden recorder: replays the Node dispatch planners (recovery-planner, resolve) over fixed inputs
// and writes the results as vectors for the Rust `planning` engine module to replay
// (packages/execution/engine/tests/planning.rs).
// Usage: node test/golden-recorders/planning.recorder.mjs [--out <dir>]
// Default out: packages/execution/contracts/planning.
//
// Everything recorded is the real Node module; only the clock is passed in as a constant.

process.env.TZ = 'UTC';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const outDir = path.resolve(repo, args.includes('--out') ? args[args.indexOf('--out') + 1] : 'packages/execution/contracts/planning');
const load = (rel) => import(path.join(repo, rel));

const recovery = await load('src/runner/dispatch/recovery-planner.mjs');
const resolve = await load('src/runner/dispatch/resolve.mjs');

const plain = (v) => JSON.parse(JSON.stringify(v ?? null));
const attempt = (fn) => {
  try { return { ok: plain(fn()) }; } catch (error) { return { error: { name: error?.name, code: error?.code ?? null, message: error?.message } }; }
};
const write = (name, value) => {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, name), `${JSON.stringify(value, null, 2)}\n`);
};
const NOW = '2026-11-19T02:00:00.000Z';

// ---- recovery planner ------------------------------------------------------------------------------------------
const att = (state, attemptId = 'a-1') => ({ state, attemptId });
const snapshots = {
  'needs-adopt': { run: { status: 'running' }, controlEpoch: 3, attempt: att('needs-adopt'), outbox: [{ name: 'ack-1.json' }], attemptFiles: ['receipt.json'] },
  open: { run: { status: 'running' }, attempt: att('open', 'a-9'), outbox: [] },
  closed: { run: { status: 'running' }, attempt: att('closed'), outbox: [] },
  running: { run: { status: 'running' }, attempt: att('running'), outbox: [] },
  'being-adopted': { run: { status: 'running' }, attempt: att('being-adopted'), outbox: [] },
  unprobed: { run: { status: 'running' }, outbox: [] },
  'no-attempt-id': { run: { status: 'running' }, attempt: { state: 'needs-adopt' }, outbox: [] },
  settled: { run: { status: 'settled' }, attempt: att('held'), outbox: [] },
  'settled-signal': { run: { status: 'running' }, settledSignal: { outcome: 'settled' }, attempt: att('held'), outbox: [] },
  'settled-but-adoptable': { run: { status: 'settled' }, attempt: att('needs-adopt'), outbox: [] },
  'unknown-evidence': { run: { status: 'running' }, attempt: att('needs-adopt'), outbox: [{ name: 'weird.bin' }, { name: 'result-2.json' }, { name: 'result.json' }, { name: 'report-1.md' }] },
};
const planCases = [];
for (const [name, snapshot] of Object.entries(snapshots)) {
  const evidence = recovery.collectEvidence(snapshot);
  for (const intent of ['resume', 'reassign', 'bogus']) {
    planCases.push({
      name: `${name}/${intent}`, snapshot, intent, evidence,
      facts: attempt(() => recovery.deriveRecoveryFacts(snapshot, evidence, intent)),
      plan: attempt(() => recovery.plan(snapshot, evidence, intent, { now: NOW })),
      planDefaultTtl: attempt(() => recovery.plan(snapshot, evidence, intent, { now: () => NOW, ttlMs: 1000 })),
    });
  }
}
const actionLegal = [];
for (const [name, snapshot] of Object.entries(snapshots)) {
  const evidence = recovery.collectEvidence(snapshot);
  for (const action of [{ type: 'adopt', attemptId: 'a-1' }, { type: 'adopt', attemptId: 'a-9' }, { type: 'kill' }, { type: 7 }, null]) {
    actionLegal.push({ name, snapshot, evidence, action, result: attempt(() => recovery.isActionLegal(snapshot, evidence, action)) });
  }
}
const snap = snapshots['needs-adopt'];
const ev = recovery.collectEvidence(snap);
const rec = recovery.plan(snap, ev, 'resume', { now: NOW });
const applyBase = { snapshot: snap, evidence: ev, action: rec.action, expectedSnapshot: rec.snapshotHash, expectedControlEpoch: rec.expectedControlEpoch, expectedExpiresAt: rec.expiresAt, actionKey: rec.actionKey, now: Date.parse(NOW) };
const applyVariants = {
  ok: {},
  'key-mismatch': { actionKey: 'deadbeef' },
  'snapshot-changed': { snapshot: { ...snap, outbox: [] } },
  'epoch-advanced': { snapshot: { ...snap, controlEpoch: 4 }, expectedSnapshot: recovery.computeSnapshotHash({ ...snap, controlEpoch: 4 }), actionKey: recovery.computeActionKey({ snapshotHash: recovery.computeSnapshotHash({ ...snap, controlEpoch: 4 }), controlEpoch: 3, action: rec.action, expiresAt: rec.expiresAt }) },
  expired: { now: Date.parse(NOW) + 10 * 60 * 1000 },
  'now-iso-string': { now: NOW },
  'bad-expiry': { expectedExpiresAt: 'soon', actionKey: recovery.computeActionKey({ snapshotHash: rec.snapshotHash, controlEpoch: 3, action: rec.action, expiresAt: 'soon' }) },
  'attempt-closed': { snapshot: { ...snap, attempt: att('closed') }, expectedSnapshot: recovery.computeSnapshotHash({ ...snap, attempt: att('closed') }), actionKey: recovery.computeActionKey({ snapshotHash: recovery.computeSnapshotHash({ ...snap, attempt: att('closed') }), controlEpoch: 3, action: rec.action, expiresAt: rec.expiresAt }) },
};
const applyCases = Object.entries(applyVariants).map(([name, over]) => {
  const input = { ...applyBase, ...over };
  return { name, input, result: attempt(() => recovery.checkApply(input)) };
});
const hashCases = [snap, snapshots.open, { b: 1, a: [2, { z: 1, y: 'é\n"' }] }].map((s) => ({ snapshot: s, hash: recovery.computeSnapshotHash(s) }));
write('recovery.json', { defaultTtlMs: recovery.DEFAULT_TTL_MS, now: NOW, plan: planCases, actionLegal, apply: applyCases, hash: hashCases });

// ---- resolve ---------------------------------------------------------------------------------------------------
const cfg = {
  executor: { command: 'claude', args: ['-p', '--model', '{model}'], provider: 'claude' },
  executors: {
    alpha: { command: 'claude', args: ['-p'], provider: 'claude' },
    gamma: { kind: 'cli', command: 'codex', args: ['exec'] },
    multi: { provider: 'claude', invocations: [{ id: 'a', via: 'mcp', command: 'x', args: [] }, { id: 'b', via: 'cli', command: 'claude', args: ['-p'] }, { id: 'c', via: 'cli', command: 'claude', args: ['-p', '--read-only'] }] },
    mcpOnly: { invocations: [{ id: 'm', via: 'mcp', command: 'g', args: [] }] },
    agentic: { agentType: 'reviewer' },
    carrier: { command: 'claude', args: ['-p'], carries: 'user-text' },
    carrierRepo: { command: 'claude', args: ['-p'], carries: 'repo-content' },
    cross: { command: 'pi', args: ['run'], allowCrossProvider: true },
    crossNo: { command: 'pi', args: ['run'] },
    baseUrl: { command: 'claude', args: ['-p'], env: { ANTHROPIC_BASE_URL: 'https://evil.example.com/api.anthropic.com' } },
    baseUrlOk: { command: 'claude', args: ['-p'], env: { ANTHROPIC_BASE_URL: 'https://x.api.anthropic.com/v1' } },
    tool: { kind: 'tool', command: 'gitnexus', args: [], for: ['impact-analysis'] },
  },
  capabilities: { execute: { confinement: { mode: 'required' } }, review: {}, judge: { confinement: { mode: 'advisory' } }, alias: { alias: 'review' } },
};
const lookups = [undefined, null, 'alpha', 'executor', 'claude', 'nope', 'multi', 'b'].map((id) => ({ id: id ?? null, result: plain(resolve.lookupExecutor(cfg, id)) }));
const lookupBare = [{ cfg: {}, id: 'x' }, { cfg: null, id: undefined }, { cfg: { executor: { command: 'c', invocations: [{ id: 'i', command: 'cc' }] } }, id: 'cc' }, { cfg: { executor: { command: 'c', invocations: [{ id: 'i', command: 'cc' }] } }, id: 'i' }]
  .map((c) => ({ cfg: c.cfg, id: c.id ?? null, result: plain(resolve.lookupExecutor(c.cfg, c.id)) }));
const configCases = [
  ['alpha', undefined, undefined], ['gamma', undefined, undefined], ['multi', 'repo-content', undefined], ['multi', undefined, 'c'], ['multi', undefined, 'zzz'],
  ['mcpOnly', undefined, undefined], ['agentic', undefined, undefined], ['carrier', undefined, undefined], ['carrier', 'repo-content', undefined], ['carrier', 'user-text', undefined],
  ['carrier', 'bogus', undefined], ['carrierRepo', 'user-text', undefined], ['cross', undefined, undefined], ['crossNo', undefined, undefined], ['baseUrl', undefined, undefined],
  ['baseUrlOk', undefined, undefined], [undefined, undefined, undefined], ['nope', undefined, undefined],
].map(([executorId, contentCarries, invocationId]) => ({ executorId: executorId ?? null, contentCarries: contentCarries ?? null, invocationId: invocationId ?? null, resolvedAgentType: null, result: attempt(() => resolve.resolveExecutorConfig(cfg, 'standard', executorId, '/tmp/x', contentCarries, undefined, invocationId)) }));
configCases.push({ executorId: 'agentic2', contentCarries: null, invocationId: null, resolvedAgentType: 'planner', cfgOverride: { executor: cfg.executor, executors: { agentic2: {} } }, result: attempt(() => resolve.resolveExecutorConfig({ executor: cfg.executor, executors: { agentic2: {} } }, 'standard', 'agentic2', '/tmp/x', undefined, 'planner', undefined)) });
configCases.push({ executorId: 'x', contentCarries: null, invocationId: null, resolvedAgentType: null, cfgOverride: {}, result: attempt(() => resolve.resolveExecutorConfig({}, 'standard', undefined, '/tmp/x', undefined, undefined, undefined)) });
const capHints = [
  { executorId: 'alpha', purpose: 'execute' }, { executorId: 'alpha', purpose: ' alias ' }, { executorId: 'alpha', hints: { candidates: ['review', 'execute'] } },
  { executorId: 'alpha', hints: { candidates: ['review', 'judge'] } }, { executorId: 'alpha', hints: { candidates: ['review'], preferred: 'review' } },
  { executorId: 'nope', hints: { candidates: ['zeta', 'beta'] } }, { executorId: 'nope', hints: { candidates: ['zeta', 'review'] } }, { hints: { fallbackLabel: 'fb' } }, {},
  { executorId: 'tool', hints: { candidates: [] }, resolvedExecutor: cfg.executors.tool }, { executorId: 'alpha', hints: { candidates: ['alias', 'judge', 'execute'] } },
  { executorId: 'x', hints: { candidates: ['b', 'a'], preferred: 'b' } },
].map((a) => ({ args: a, result: attempt(() => resolve.resolveCapabilityDetailsFromHints({ cfg, ...a })) }));
write('resolve.json', { cfg, lookups, lookupBare, config: configCases, capabilityHints: capHints });
// ---- bind facade -----------------------------------------------------------------------------------------------
// The facade asks the host route, so the recorder needs a host binary: FGOS_HOST_BIN, else the repository's debug
// build (`cargo build -p fgos`). The machine is described, not read: a temp directory of empty executables stands for
// PATH and herdr is stated absent, so a vector names no recording machine.
import os from 'node:os';
import { spawnSync } from 'node:child_process';
// The home a login store resolves against is stated too, so the account view digest names no recording machine.
process.env.HOME = '/home/vector';
if (!process.env.FGOS_HOST_BIN) process.env.FGOS_HOST_BIN = path.join(repo, 'target/debug/fgos');
if (!fs.existsSync(process.env.FGOS_HOST_BIN)) { console.error(`no host binary at ${process.env.FGOS_HOST_BIN}: build it or set FGOS_HOST_BIN`); process.exit(1); }
const hostVersion = spawnSync(process.env.FGOS_HOST_BIN, ['--version'], { encoding: 'utf8' }).stdout.trim();
const bindFacade = await load('src/runner/execution/bind.mjs');
const dryBind = await load('src/runner/execution/dry-bind.mjs');
const { createSeatLedger } = await load('src/runner/execution/seat-ledger.mjs');
const bindVectors = JSON.parse(fs.readFileSync(path.join(repo, 'packages/execution/contracts/bind.v1.json'), 'utf8'));
const base = bindVectors.vectors.find((v) => v.name.startsWith('bind: a caller that does not launch'));
const runner = base.runner;
const pathCommands = base.machine.pathCommands;
const mkPath = (names) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'planning-path-'));
  for (const name of names) fs.writeFileSync(path.join(dir, name), '#!/bin/sh\n', { mode: 0o755 });
  return dir;
};
const PATH_DIR = mkPath(pathCommands);
const NOW_MS = 1800000000000;
const session = { headless: true, postureAtLaunch: true, pathEnv: PATH_DIR, herdrPresent: false };
const ctxOf = (cfg = runner) => ({ runnerConfig: cfg, session });
const posture = { readOnly: true, writer: false, forceOutOfProcess: false, stance: false, verdict: false };
const producer = { seat: 'producer', role: 'producer', posture: { ...posture, readOnly: false, writer: true } };
const checker = { seat: 'checker-1', role: 'checker', posture: { ...posture, verdict: true }, persona: 'code-reviewer' };
const unit = { id: 'u1', capability: 'execute', writes: [] };

// askFor over a seat ledger driven by a list of operations.
const ledgerCases = [
  { name: 'empty ledger', ops: [], seat: producer, unit, independentOf: [], preferIndependentOf: [], options: {} },
  { name: 'independent of a bound seat', ops: [['note', 'producer', 'claude']], seat: checker, unit, independentOf: ['producer'], preferIndependentOf: ['producer'], options: {} },
  { name: 'independent of an unbound seat stays its id', ops: [], seat: checker, unit, independentOf: ['producer', 'other'], preferIndependentOf: ['other'], options: {} },
  { name: 'a seat that depends on this one holds it too', ops: [['note', 'producer', 'claude'], ['note', 'checker-1', 'openai'], ['noteDependence', 'checker-1', ['producer']]], seat: producer, unit, independentOf: [], preferIndependentOf: [], options: {} },
  { name: 'workflow tier of the seat', ops: [], seat: { ...producer, tier: 'advanced' }, unit, independentOf: [], preferIndependentOf: [], options: { workflowId: 'wf' } },
  { name: 'workflow tier of the unit', ops: [], seat: producer, unit: { ...unit, tier: 'mini' }, independentOf: [], preferIndependentOf: [], options: {} },
  { name: 'overrides, raise and blind', ops: [], seat: checker, unit, independentOf: [], preferIndependentOf: [], options: { overrides: [{ tier: 'advanced' }], raiseAuthorized: true, blind: true } },
].map((c) => {
  const ledger = createSeatLedger();
  for (const [op, ...a] of c.ops) ledger[op](...a);
  const { options } = c;
  return { ...c, ask: plain(bindFacade.askFor({ seat: c.seat, unit: c.unit, independentOf: c.independentOf, preferIndependentOf: c.preferIndependentOf }, ledger, options)) };
});
const identityCases = [
  { executor: 'claude', invocation: 'a', pool: 'p', model: 'm', reasoningEffort: 'high' },
  { executor: 'claude' }, { executor: 'claude', invocation: null, pool: null }, {}, { executor: 'x', model: 3 },
].map((binding) => ({ binding, identity: bindFacade.bindingIdentity(binding) }));

// bind: the binding, the walk, the bypass fence, the Work seat.
const bypassRunner = plain(runner);
bypassRunner.executors.claude.invocations[0].permissionMode = 'bypass';
const pinClaude = { executor: 'claude', invocation: 'claude-cli-bwrap' };
const headAsk = { unit, seat: 'producer', role: 'producer', posture: producer.posture, raiseAuthorized: false, readOnly: false, independentOf: [], overrides: [pinClaude] };
const strip = (binding) => plain(binding);
const bindAsk = { unit, seat: 'producer', role: 'producer', posture: { ...posture, readOnly: false, writer: true }, raiseAuthorized: false, readOnly: false, independentOf: [], overrides: [] };
const first = bindFacade.bind(bindAsk, ctxOf());
const bindCases = [
  { name: 'a plain producer seat', ask: bindAsk, cfg: runner, walk: {}, headLaunch: false },
  { name: 'a tier override', ask: { ...bindAsk, overrides: [{ tier: 'advanced' }] }, cfg: runner, walk: {}, headLaunch: false },
  { name: 'an executor pin', ask: { ...bindAsk, overrides: [{ executor: 'openai' }] }, cfg: runner, walk: {}, headLaunch: false },
  { name: 'a bypass invocation is refused for a worker seat', ask: headAsk, cfg: bypassRunner, walk: {}, headLaunch: false },
  { name: 'a bypass invocation is allowed for a head launch', ask: headAsk, cfg: bypassRunner, walk: {}, headLaunch: true },
  { name: 'a seat that walks on after a failure', ask: bindAsk, cfg: runner, walk: { tried: [strip(first)], reason: 'provider-limit' }, headLaunch: false },
  { name: 'an unknown tier is a model error', ask: { ...bindAsk, overrides: [{ tier: 'bogus' }] }, cfg: runner, walk: {}, headLaunch: false },
].map((c) => ({ ...c, result: attempt(() => bindFacade.bind(c.ask, ctxOf(c.cfg), { walk: c.walk, headLaunch: c.headLaunch })) }));
const workSeatCases = [
  { name: 'a producer seat', args: { runnerConfig: runner, unit: { id: 'w1', capability: 'execute', rigor: 'standard' } } },
  { name: 'a read-only reviewer', args: { runnerConfig: runner, unit: { id: 'w1', capability: 'execute' }, role: 'reviewer', readOnly: true } },
  { name: 'a tier override', args: { runnerConfig: runner, unit: { id: 'w1', capability: 'execute' }, overrides: [{ tier: 'advanced' }] } },
  { name: 'an unregistered executor pin is refused', args: { runnerConfig: runner, unit: { id: 'w1', capability: 'execute' }, overrides: [{ executor: 'nope' }] } },
  { name: 'a bypass invocation is refused with its fix', args: { runnerConfig: bypassRunner, unit: { id: 'w1', capability: 'execute' }, overrides: [pinClaude] } },
].map((c) => {
  // `bindWorkSeat` states no PATH of its own, so the host reads the process's: stand the described one in for it.
  const realPath = process.env.PATH;
  process.env.PATH = PATH_DIR;
  try { return { ...c, result: attempt(() => bindFacade.bindWorkSeat(c.args)) }; } finally { process.env.PATH = realPath; }
});
const explainCases = [
  { name: 'a plain producer seat', ask: bindAsk, walk: {} },
  { name: 'a refused seat', ask: { ...bindAsk, overrides: [{ executor: 'nope' }] }, walk: {} },
].map((c) => ({ ...c, result: attempt(() => bindFacade.explainSeat(c.ask, ctxOf(), { walk: c.walk })) }));
const emptyPath = mkPath([]);
const preflightCases = [
  { name: 'every agent cli is on the machine', session: { pathEnv: PATH_DIR, herdrPresent: false }, pin: null },
  { name: 'no agent cli on the machine', session: { pathEnv: emptyPath, herdrPresent: false }, pin: null },
  { name: 'a pin with no lease state', session: { pathEnv: PATH_DIR, herdrPresent: false }, pin: { pool: 'claude', id: 'a1' } },
].map((c) => ({ name: c.name, pin: c.pin, pathCommands: c.session.pathEnv === PATH_DIR ? pathCommands : [], result: attempt(() => bindFacade.preflightOf(runner, { session: { headless: true, ...c.session }, pin: c.pin, now: NOW_MS })) }));

// the dry bind: the pattern the unit runs is handed in as its effective collaboration (resolving it is the unit run's).
const dryCases = [
  { name: 'solo', unit, effective: { loop: 'solo', params: {} } },
  { name: 'solo with a workflow tier', unit: { ...unit, tier: 'advanced' }, effective: { loop: 'solo', params: {} }, options: { workflowId: 'wf' } },
  { name: 'solo with an override', unit, effective: { loop: 'solo', params: {} }, options: { overrides: [{ executor: 'openai' }] } },
  { name: 'solo refused by an unregistered pin', unit, effective: { loop: 'solo', params: {} }, options: { overrides: [{ executor: 'nope' }] } },
  { name: 'reviewed', unit, effective: { loop: 'reviewed', params: { maxRounds: 2 } } },
  { name: 'panel', unit, effective: { loop: 'panel', params: {} } },
].map(async (c) => {
  const { options = {}, ...rest } = c;
  const result = await dryBind.simulateUnitBindings(c.unit, runner, { session: { pathEnv: PATH_DIR, herdrPresent: false, postureAtLaunch: true }, collaboration: c.effective, ...options }).then((ok) => ({ ok: plain(ok) }), (error) => ({ error: { name: error?.name, code: error?.code ?? null, message: error?.message } }));
  return { ...rest, options, result };
});
write('bind-facade.json', {
  hostVersion, now: NOW_MS, runner, pathCommands,
  askFor: ledgerCases, identity: identityCases, bind: bindCases, workSeat: workSeatCases, explain: explainCases, preflight: preflightCases,
  dryBind: await Promise.all(dryCases),
});
// ---- effective dispatch policy ---------------------------------------------------------------------------------
const planModule = await load('src/runner/dispatch/plan.mjs');
const boundWhole = plain(bindFacade.bind(bindAsk, ctxOf()));
const rigorRunner = plain(runner);
rigorRunner.capabilities = { ...(rigorRunner.capabilities ?? {}), execute: { ...(rigorRunner.capabilities?.execute ?? {}), rigor: 'high' }, 'code:review': { rigor: 'critical' }, review: {} };
const asg = (over = {}) => ({ operation: 'implement-item', role: 'producer', mutation: 'mutating', assignmentId: 'asgn-1', skills: ['skill-a'], policy: {}, capability: 'execute', ...over });
const policyInputs = [
  ['a producer assignment bound from the config', { assignment: asg(), runnerConfig: runner }],
  ['a read-only reviewer takes the default persona', { assignment: asg({ role: 'reviewer', mutation: 'read-only', capability: undefined }), runnerConfig: runner }],
  ['the operation declares its own policy', { assignment: asg({ policy: { preferExecutor: 'openai', rigor: 'high', visibility: 'visible', repeatMode: 'pre-delivery', constraints: { noNetwork: true }, model: 'custom-model', preferPersona: 'p1' } }), runnerConfig: runner }],
  ['the caller overrides win over the operation', { assignment: asg({ policy: { tier: 'standard', rigor: 'low', visibility: 'visible' } }), runnerConfig: runner, cliOverride: { tier: 'mini', reasoningEffort: 'medium', preferPersona: 'cli-persona', model: 'cli-model', visibility: 'headless', repeatMode: 'post-delivery', rigor: 'critical', policyProvenance: { tier: { scope: 'cli' }, rigor: { scope: 'cli', id: 'flag' }, persona: { scope: 'cli', id: 'p' }, visibility: { scope: 'cli', id: 'v' } } } }],
  ['the caller pins an executor', { assignment: asg(), runnerConfig: runner, cliOverride: { preferExecutor: 'openai', preferInvocation: 'codex-cli-bwrap', policyProvenance: { executor: { scope: 'cli', id: 'e' } } } }],
  ['a seat that is bound upstream is taken as given', { assignment: asg(), runnerConfig: runner, binding: boundWhole }],
  ['a binding that carries no model asks the bind with its executor pinned', { assignment: asg(), runnerConfig: runner, binding: { executor: 'gemini', persona: 'x', reasoningEffort: 'low' } }],
  ['a bound seat without a runner config', { assignment: asg(), binding: boundWhole }],
  ['the capability rigor lifts the demand', { assignment: asg({ rigor: 'low' }), runnerConfig: rigorRunner }],
  ['the capability of the domain review row', { assignment: asg({ capability: undefined, domain: 'code', mutation: 'read-only', role: 'reviewer' }), runnerConfig: rigorRunner }],
  ['a work-product operation names its primary capability', { assignment: asg({ capability: undefined, result: { kind: 'work-product' }, primaryCapability: 'execute' }), runnerConfig: rigorRunner }],
  ['an operation that declares its capability', { assignment: asg({ capability: undefined, policy: { capability: 'review' } }), runnerConfig: rigorRunner }],
  ['skills and extra constraints accumulate', { assignment: asg({ skills: ['a', 'b'], policy: { constraints: { requiresSkills: ['override'], other: 1 } } }), runnerConfig: runner }],
  ['no assignment', { runnerConfig: runner }],
  ['a policy that is not an object', { assignment: asg({ policy: [] }), runnerConfig: runner }],
  ['a policy that is null', { assignment: asg({ policy: null }), runnerConfig: runner }],
  ['the retired minimum tier', { assignment: asg({ policy: { minTier: 'x' } }), runnerConfig: runner }],
  ['workflow yaml cannot set a tier', { assignment: asg({ policy: { _fromYaml: true, tier: 'mini' } }), runnerConfig: runner }],
  ['workflow yaml cannot pin a model', { assignment: asg({ policy: { _fromYaml: true, model: 'm' } }), runnerConfig: runner }],
  ['workflow yaml may pin a model when the assignment allows it', { assignment: asg({ _allowLiteralModel: true, policy: { _fromYaml: true, model: 'm' } }), runnerConfig: runner }],
  ['an invalid operation rigor', { assignment: asg({ policy: { rigor: 'extreme' } }), runnerConfig: runner }],
  ['an invalid assignment rigor', { assignment: asg({ rigor: 'extreme' }), runnerConfig: runner }],
  ['an invalid override rigor', { assignment: asg(), runnerConfig: runner, cliOverride: { rigor: 'extreme' } }],
  ['an invalid reasoning effort', { assignment: asg({ policy: { reasoningEffort: 'turbo' } }), runnerConfig: runner }],
  ['an invalid explicit tier', { assignment: asg({ policy: { tier: 'huge' } }), runnerConfig: runner }],
  ['an explicit tier above the resolved one is the bind refusal', { assignment: asg({ policy: { tier: 'flagship' } }), runnerConfig: runner }],
  ['a tier from a scope that may not state one', { assignment: asg(), runnerConfig: runner, cliOverride: { tier: 'mini', policyProvenance: { tier: { scope: 'workflow' } } } }],
  ['an invalid repeat mode', { assignment: asg({ policy: { repeatMode: 'sometimes' } }), runnerConfig: runner }],
  ['no runner config and no binding', { assignment: asg() }],
  ['an unregistered pin is unsatisfiable', { assignment: asg({ policy: { preferExecutor: 'nope' } }), runnerConfig: runner }],
  ['a disallowed provider', { assignment: asg(), runnerConfig: runner, options: { disallowedProviders: ['gemini'] } }],
  ['a disallowed executor', { assignment: asg(), runnerConfig: runner, options: { disallowedExecutors: ['gemini'] } }],
  ['governance without a registry', { assignment: asg(), binding: boundWhole, options: { disallowedProviders: ['gemini'] } }],
  ['a work item input is refused', { assignment: asg(), runnerConfig: runner, workItem: { id: 'w' } }],
];
const policyCases = policyInputs.map(([name, params]) => {
  const realPath = process.env.PATH;
  process.env.PATH = PATH_DIR;
  try { return { name, params: plain(params), result: attempt(() => planModule.effectiveDispatchPolicy(params)) }; } finally { process.env.PATH = realPath; }
});
const launchPins = [
  { binding: boundWhole }, { binding: { ...boundWhole, leaseAccount: 'acct-1' } }, { cliOverride: { preferExecutor: 'x', preferInvocation: 'i', pool: 'p', leaseAccount: 'l', accountViewDigest: 'd', model: 'm' } },
  { binding: { executor: 'e' }, cliOverride: { preferExecutor: 'x', accountViewDigest: 'd' } }, {}, { cliOverride: { preferInvocation: null } },
].map((args) => ({ args: plain(args), result: plain(planModule.launchPinOf(args)) }));
write('policy.json', { bound: boundWhole, cases: policyCases, launchPin: launchPins });
// ---- run admission ---------------------------------------------------------------------------------------------
// The ledger and the control probe read process identity through the native door, which a checkout does not ship:
// the addon of the activated release (the main checkout's activation) stands in, as the run-result recorder loads it.
// The main checkout is read off the worktree's `.git` pointer file (its git dir, then that dir's `commondir`).
const mainCheckoutOf = (dir) => {
  const dotGit = path.join(dir, '.git');
  if (fs.statSync(dotGit).isDirectory()) return dir;
  const gitDir = fs.readFileSync(dotGit, 'utf8').match(/^gitdir:\s*(.+)$/m)[1].trim();
  const common = path.resolve(gitDir, fs.readFileSync(path.join(gitDir, 'commondir'), 'utf8').trim());
  return path.dirname(common);
};
{
  const activation = JSON.parse(fs.readFileSync(path.join(mainCheckoutOf(repo), '.fgos', 'installation', 'activation.json'), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(path.join(activation.releasePath, 'manifest.json'), 'utf8'));
  const door = await load('src/native/door.mjs');
  door.loadNativeAddon({ descriptor: { manifest, releaseRoot: activation.releasePath } });
}
const admission = await load('src/runner/dispatch/run-admission.mjs');
const ASG = 'asgn_demo';
const DEAD_PID = 2147483000;
const baseCall = { destination: 'cli', payloadDigest: 'sha256:aaa' };
const buildRunMeta = (record) => ({ runId: record.runId, attempt: record.attempt, retryId: record.retryId, payloadDigest: record.admissionPayloadDigest, status: 'admitted' });
const buildDispatchPlan = (record) => ({ plan: 'dispatch', runId: record.runId });
const buildEffective = (record) => ({ contract: 'effective', runId: record.runId });
// Each call names which builders it hands over, by name, so the replay hands over the same ones.
const builders = (names) => ({
  buildRunMeta,
  ...(names.includes('plan') ? { buildDispatchPlan } : {}),
  ...(names.includes('plan-none') ? { buildDispatchPlan: () => null } : {}),
  ...(names.includes('effective') ? { buildEffectiveExecutionContract: buildEffective } : {}),
});
const mask = (value) => {
  if (Array.isArray(value)) return value.map(mask);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, k === 'admittedAt' ? '<time>' : k === 'admittedBy' || k === 'holder' ? (v === null ? null : '<holder>') : mask(v)]));
  }
  return value;
};
const treeOf = (root) => {
  const out = {};
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(root, full);
      if (entry.isDirectory()) { out[`${rel}/`] = null; walk(full); } else if (entry.name.endsWith('.json')) { out[rel] = mask(JSON.parse(fs.readFileSync(full, 'utf8'))); } else out[rel] = '<file>';
    }
  };
  walk(root);
  return out;
};
const runStep = (root, step) => {
  for (const item of step.setup ?? []) {
    const full = path.join(root, item.path);
    if (item.json !== undefined) { fs.mkdirSync(path.dirname(full), { recursive: true }); fs.writeFileSync(full, JSON.stringify(item.json, null, 2)); } else fs.mkdirSync(full, { recursive: true });
  }
  const { builders: names = [], ...call } = step.call;
  let result;
  try {
    const out = admission.admitRunAttempt(path.join(root, 'asg'), path.join(root, 'asg', 'runs'), ASG, { ...baseCall, ...call, ...builders(names) });
    result = { ok: { ...plain(out), runDir: path.relative(root, out.runDir) } };
  } catch (error) {
    result = { error: mask({ name: error.name, code: error.code ?? null, phase: error.phase ?? null, message: error.message, ...(error.priorRunId !== undefined ? { priorRunId: error.priorRunId, priorAttempt: error.priorAttempt, holder: error.holder ?? null } : {}) }) };
  }
  return { setup: step.setup ?? [], call: step.call, result, tree: treeOf(root) };
};
const gen = (n, record) => ({ path: `asg/admission/generations/${String(n).padStart(10, '0')}.json`, json: { attempt: n, attemptStr: String(n).padStart(2, '0'), runId: `run_${ASG}_${String(n).padStart(2, '0')}`, retryId: null, predecessorRunId: null, destination: 'cli', admissionPayloadDigest: 'sha256:aaa', admittedAt: '2026-11-19T00:00:00.000Z', admittedBy: { id: 'phantom' }, ...record } });
const scenarios = [
  ['the first admission builds the attempt directory', [{ call: { builders: ['plan', 'effective'] } }]],
  ['no dispatch plan or contract when the builders give none', [{ call: { builders: ['plan-none'] } }]],
  ['the same retry tuple resumes the same attempt', [{ call: { retryId: 'r1' } }, { call: { retryId: 'r1' } }]],
  ['a retry id reused with another payload is refused', [{ call: { retryId: 'r1' } }, { call: { retryId: 'r1', payloadDigest: 'sha256:bbb' } }]],
  ['a retry id reused with another destination is refused', [{ call: { retryId: 'r1' } }, { call: { retryId: 'r1', destination: 'herdr' } }]],
  ['a new retry must name the current run as its predecessor', [{ call: { retryId: 'r1' } }, { call: { retryId: 'r2' } }, { setup: [{ path: 'asg/runs/01/result.json', json: { outcome: 'pass' } }], call: { retryId: 'r2', predecessorRunId: `run_${ASG}_01` } }]],
  ['an aborted retry id is refused', [{ setup: [{ path: 'asg/admission/markers/r9.aborted.json', json: { aborted: true } }], call: { retryId: 'r9' } }]],
  ['an attempt that settled admits the next one', [{ call: {} }, { setup: [{ path: 'asg/runs/01/result.json', json: { outcome: 'pass' } }], call: {} }]],
  ['a settled attempt is refused when the caller opts in', [{ call: {} }, { setup: [{ path: 'asg/runs/01/result.json', json: { outcome: 'pass' } }], call: { refuseIfSettled: true } }]],
  ['an attempt in flight is not raced', [{ call: {} }, { call: {} }]],
  ['an attempt in flight is overridden on purpose', [{ call: {} }, { call: { forceNewAttempt: true } }]],
  ['an attempt whose admitter is gone is replaced', [{ setup: [gen(1, {}), { path: 'asg/runs/01/run.json', json: { runId: `run_${ASG}_01` } }, { path: 'asg/runs/01/control/generations/0000000001.json', json: { purpose: 'settled' } }], call: {} }]],
  ['an expected run id the ledger would not give is refused', [{ call: { expectedRunId: `run_${ASG}_07` } }]],
  ['an expected run id the ledger gives is admitted', [{ call: { expectedRunId: `run_${ASG}_01` } }]],
  ['a crash between the commit and the rename resumes the attempt', [{ setup: [gen(1, { retryId: 'rx' })], call: { retryId: 'rx' } }]],
  ['an attempt directory that already exists is resumed', [{ setup: [gen(1, { retryId: 'rx' }), { path: 'asg/runs/01/run.json', json: { runId: `run_${ASG}_01` } }], call: { retryId: 'rx' } }]],
  ['attempt numbers skip the directories that exist', [{ setup: [{ path: 'asg/runs/05/run.json', json: {} }, { path: 'asg/runs/notes/x.json', json: {} }], call: {} }]],
  ['attempt numbers follow the ledger past the directories', [{ setup: [gen(9, {}), { path: 'asg/runs/09/result.json', json: {} }], call: {} }]],
  ['abandoned staging of a dead process is removed when its retry and digest match', [{ setup: [gen(1, { retryId: 'rs' }), { path: `asg/runs/.staging-01-${DEAD_PID}-aaaa/run.json`, json: { retryId: 'rs', payloadDigest: 'aaa' } }, { path: `asg/runs/.staging-01-${DEAD_PID}-bbbb/run.json`, json: { retryId: 'other', payloadDigest: 'aaa' } }, { path: 'asg/runs/.staging-01/leftover.txt', json: { x: 1 } }, { path: 'asg/runs/.staging-02-x/run.json', json: { retryId: 'rs', payloadDigest: 'aaa' } }], call: { retryId: 'rs' } }]],
];
const admissionCases = [];
for (const [name, steps] of scenarios) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'planning-admission-'));
  fs.mkdirSync(path.join(root, 'asg', 'runs'), { recursive: true });
  admissionCases.push({ name, steps: steps.map((step) => runStep(root, step)) });
  fs.rmSync(root, { recursive: true, force: true });
}
write('admission.json', { assignmentId: ASG, deadPid: DEAD_PID, cases: admissionCases });
// ---- reconciliation planner ------------------------------------------------------------------------------------
// A plan's action key hashes the absolute path of the run record it targets, so a scenario runs under a fixed root
// (`/tmp/fgos-planning-vectors/reconcile/<n>`, the same one the replay uses). The runtime inspection a plan reads
// is not ported yet: each step records the fields of its `--run` and `--assignment` views the planner reads, taken
// from the real Node inspection at that moment, and the replay hands them back through its view port.
const reconcile = await load('src/runner/dispatch/reconciliation-planner.mjs');
const inspection = await load('src/runner/dispatch/runtime-inspection.mjs');
const RECONCILE_ROOT = '/tmp/fgos-planning-vectors/reconcile';
const R_NOW = '2026-11-19T02:00:00.000Z';
const readers = JSON.parse(fs.readFileSync(path.join(repo, 'packages/execution/contracts/run-result/readers.json'), 'utf8'));
const sample = (name) => readers.records.find((r) => r.name === name).record;
const good = sample('06-v2-completed-pass-verified');
const corrupt = sample('16-v2-corrupt-schema');
const RUN = good.runId;
const ASGN = good.assignmentId;
const run2 = `${RUN.slice(0, -2)}02`;
const asgPath = (rel, id = ASGN) => `assignments/${id}/${rel}`;
const standalone = (extra = {}, over = {}) => [
  { path: asgPath('assignment.json'), json: { assignmentId: ASGN } },
  { path: asgPath('admission/generations/0000000001.json'), json: { attempt: 1, attemptStr: '01', runId: RUN, retryId: null } },
  { path: asgPath('runs/01/run.json'), json: { runId: RUN, assignmentId: ASGN, status: 'running', ...extra } },
  { path: asgPath('runs/01/result.json'), json: over.result ?? good },
];
const viewFields = (view) => ({
  inspectionStatus: view.inspectionStatus,
  subject: { locations: (view.subject?.locations ?? []).map((l) => ({ path: l.path })) },
  runResult: view.runResult ? { corrupt: view.runResult.corrupt ?? false, contractCorrupt: view.runResult.contractCorrupt ?? false } : null,
  ...(view.recoveryAuthority ? { recoveryAuthority: view.recoveryAuthority } : {}),
  links: { assignmentIds: view.links?.assignmentIds ?? [] },
  observations: (view.observations ?? []).slice(0, 1).map((o) => ({ value: { currentRunIds: o.value?.currentRunIds } })),
});
const viewsAt = (root, run) => ({
  run: viewFields(inspection.inspectDispatchRuntime(root, { run })),
  assignment: viewFields(inspection.inspectDispatchRuntime(root, { assignment: ASGN })),
});
const reconcileTree = (root) => {
  const out = {};
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(root, full);
      if (rel === path.join('.fgos', 'locks')) continue;
      if (entry.isDirectory()) { out[`${rel}/`] = null; walk(full); } else if (entry.name.endsWith('.json')) out[rel] = JSON.parse(fs.readFileSync(full, 'utf8'));
      else out[rel] = fs.readFileSync(full, 'utf8');
    }
  };
  if (fs.existsSync(root)) walk(root);
  return out;
};
const reRoot = (value, root) => JSON.parse(JSON.stringify(value).split(root).join('<root>'));
const reconcileScenarios = [
  ['plans that refuse or find nothing', [{ op: 'plan', args: {} }, { op: 'plan', args: { runId: RUN } }, { op: 'plan', args: { action: 'bogus' } }, { op: 'plan', args: { action: 'collect-result' } }, { op: 'plan', args: { action: 'repair-projection', runId: '  ' } }, { op: 'plan', args: { action: 'collect-result', runId: 'run_unknown_01' } }, { op: 'plan', args: { action: 'repair-projection', runId: 'run_unknown_01' } }]],
  ['a standalone run with a valid result plans both actions', [{ setup: standalone(), op: 'plan', args: { action: 'collect-result', runId: RUN } }, { op: 'plan', args: { action: 'repair-projection', runId: RUN } }, { op: 'plan', args: { action: 'collect-result', runId: RUN, ttlMs: 1000 } }]],
  ['a run whose record already says settled has nothing to repair', [{ setup: standalone({ status: 'settled' }), op: 'plan', args: { action: 'repair-projection', runId: RUN } }, { op: 'plan', args: { action: 'collect-result', runId: RUN } }]],
  ['the real control epoch is read off the control ledger', [{ setup: [...standalone(), { path: asgPath('runs/01/control/generations/0000000003.json'), json: { holder: { id: 'x' } } }, { path: asgPath('runs/01/control/generations/0000000002.json'), json: { holder: { id: 'x' } } }, { path: asgPath('runs/01/control/generations/notes.json'), json: {} }], op: 'plan', args: { action: 'collect-result', runId: RUN } }]],
  ['a run with no result yet', [{ setup: standalone().slice(0, 3), op: 'plan', args: { action: 'collect-result', runId: RUN } }, { op: 'plan', args: { action: 'repair-projection', runId: RUN } }]],
  ['a corrupt result cannot be collected or prove settlement', [{ setup: standalone({}, { result: corrupt }), op: 'plan', args: { action: 'collect-result', runId: RUN } }, { op: 'plan', args: { action: 'repair-projection', runId: RUN } }]],
  ['a run owned by a coordination session is refused', [{ setup: [...standalone({ coordinationId: 'sess1' }), { path: 'coordination/sessions/sess1/session.json', json: { assignmentRefs: [ASGN] } }], op: 'plan', args: { action: 'collect-result', runId: RUN } }]],
  ['a run whose owner is incomplete needs input', [{ setup: standalone().filter((f) => !f.path.endsWith('assignment.json')), op: 'plan', args: { action: 'collect-result', runId: RUN } }]],
  ['a newer current run supersedes this one', [{ setup: [...standalone(), { path: asgPath('admission/generations/0000000002.json'), json: { attempt: 2, attemptStr: '02', runId: run2, retryId: null } }, { path: asgPath('runs/02/run.json'), json: { runId: run2, assignmentId: ASGN, status: 'running' } }], op: 'plan', args: { action: 'collect-result', runId: RUN } }]],
  ['an apply collects the result once', [{ setup: standalone(), op: 'plan', args: { action: 'collect-result', runId: RUN } }, { op: 'apply', planFrom: 0 }, { op: 'apply', planFrom: 0 }]],
  ['an apply repairs the projection once', [{ setup: standalone(), op: 'plan', args: { action: 'repair-projection', runId: RUN } }, { op: 'apply', planFrom: 0 }, { op: 'apply', planFrom: 0 }, { op: 'plan', args: { action: 'repair-projection', runId: RUN } }]],
  ['an expired plan is stale', [{ setup: standalone(), op: 'plan', args: { action: 'collect-result', runId: RUN } }, { op: 'apply', planFrom: 0, now: '2026-11-19T02:10:00.000Z' }]],
  ['a plan whose result changed is stale', [{ setup: standalone(), op: 'plan', args: { action: 'collect-result', runId: RUN } }, { setup: [{ path: asgPath('runs/01/result.json'), json: { ...good, summary: 'changed after planning' } }], op: 'apply', planFrom: 0 }]],
  ['a plan whose result vanished is blocked', [{ setup: standalone(), op: 'plan', args: { action: 'repair-projection', runId: RUN } }, { remove: [asgPath('runs/01/result.json')], op: 'apply', planFrom: 0 }]],
  ['a plan whose run record moved is stale', [{ setup: standalone(), op: 'plan', args: { action: 'collect-result', runId: RUN } }, { op: 'apply', planFrom: 0, tamper: { path: 'proposedAction.path', value: '/etc/passwd' } }]],
  ['a plan whose key does not bind its facts is stale', [{ setup: standalone(), op: 'plan', args: { action: 'collect-result', runId: RUN } }, { op: 'apply', planFrom: 0, tamper: { path: 'actionKey', value: 'reconcile_deadbeef' } }]],
  ['a plan that is not one of ours is refused', [{ op: 'apply', plan: {} }, { op: 'apply', plan: { actionKey: 'k', snapshot: {}, proposedAction: { kind: 'format-disk' } } }, { op: 'apply', plan: { actionKey: 'k', snapshot: {}, proposedAction: { kind: 'collect-result' } } }, { op: 'apply', plan: { snapshot: {}, proposedAction: { kind: 'clear-cwd-lock', cwd: '/nowhere' } } }]],
  ['clearing a cwd lock only reports today\'s facts', [{ op: 'apply', plan: { actionKey: 'k', snapshot: { x: 1 }, proposedAction: { kind: 'clear-cwd-lock', cwd: '/nowhere' } } }, { op: 'apply', plan: { actionKey: 'k', snapshot: { x: 1 }, proposedAction: { kind: 'clear-cwd-lock', cwd: '/nowhere', extra: true } } }]],
];
const reconcileCases = [];
for (const [index, [name, steps]] of reconcileScenarios.entries()) {
  const root = `${RECONCILE_ROOT}/${index}`;
  fs.rmSync(root, { recursive: true, force: true });
  fs.mkdirSync(path.join(root, '.fgos'), { recursive: true });
  const plans = [];
  const recorded = [];
  for (const step of steps) {
    for (const item of step.setup ?? []) {
      const full = path.join(root, '.fgos', item.path);
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, JSON.stringify(item.json, null, 2));
    }
    for (const rel of step.remove ?? []) fs.rmSync(path.join(root, '.fgos', rel));
    const named = step.args?.runId ?? step.plan?.proposedAction?.runId;
    const views = viewsAt(root, typeof named === 'string' && named.trim() ? named : RUN);
    let result;
    let planUsed;
    try {
      if (step.op === 'plan') {
        result = { ok: reconcile.planReconciliation(root, { action: step.args.action, runId: step.args.runId, cwd: '/nowhere', now: R_NOW, ttlMs: step.args.ttlMs }) };
        plans.push(result.ok);
      } else {
        planUsed = step.plan ?? JSON.parse(JSON.stringify(plans[step.planFrom]));
        if (step.tamper) { const keys = step.tamper.path.split('.'); const last = keys.pop(); keys.reduce((o, k) => o[k], planUsed)[last] = step.tamper.value; }
        result = { ok: reconcile.applyReconciliation(root, planUsed, { now: step.now ?? R_NOW }) };
      }
    } catch (error) { result = { error: { name: error?.name, message: error?.message } }; }
    recorded.push({ setup: (step.setup ?? []).map((i) => ({ path: i.path, json: i.json })), remove: step.remove ?? [], op: step.op, args: step.args ?? null, ...(planUsed ? { plan: planUsed } : {}), now: step.now ?? R_NOW, views, result, tree: reconcileTree(root) });
  }
  reconcileCases.push({ name, root, steps: recorded });
  fs.rmSync(root, { recursive: true, force: true });
}
write('reconciliation.json', { now: R_NOW, rootBase: RECONCILE_ROOT, cases: reconcileCases });
console.log(`planning vectors written to ${path.relative(repo, outDir)}`);
