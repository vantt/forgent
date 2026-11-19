// Records the golden vectors of the Rust transport round (packages/execution/engine/src/transport_round/) by
// running the Node modules of src/runner/dispatch/ it ports (transport, herdr-round, session-attempt,
// runtime-inspection, attention-view). Run: node test/golden-recorders/transport-round.recorder.mjs
// Each section writes one file under packages/execution/contracts/transport-round/.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const outDir = path.join(root, 'packages', 'execution', 'contracts', 'transport-round');
fs.mkdirSync(outDir, { recursive: true });

function write(name, body) {
  fs.writeFileSync(path.join(outDir, name), `${JSON.stringify(body, null, 2)}\n`);
}

// The native door first: loading it from inside the config/yaml import cycle fails on a missing export. The outcome
// derivation (attention rows) lives behind it; a checkout does not ship the addon, so the recorder loads the one of
// the activated release (the main checkout's activation record), as the run-result recorder does.
const door = await import('../../src/native/door.mjs');
{
  const common = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { cwd: root, encoding: 'utf8' }).trim();
  const activation = JSON.parse(fs.readFileSync(path.join(path.dirname(common), '.fgos', 'installation', 'activation.json'), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(path.join(activation.releasePath, 'manifest.json'), 'utf8'));
  door.loadNativeAddon({ descriptor: { manifest, releaseRoot: activation.releasePath } });
}

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
  try { return { ok: call() }; } catch (error) { return { error: { name: error.name, code: error.code ?? null, errorClass: error.errorClass ?? null, reason: error.reason ?? null, message: error.message ?? null } }; }
};

// SECTION: executor-command
{
  const { resolveExecutorCommand, agentArgsWithoutPrompt } = await dispatch('transport.mjs');
  const { resolveExecutorConfig } = await dispatch('resolve.mjs');
  const { assertReasoningEffort } = await dispatch('config.mjs');
  const cfg = {
    executor: { kind: 'agent', command: 'claude', args: ['-p', '{prompt}', '--model', '{model}'], supports: { reasoningEffort: ['low', 'high'] }, env: { A: '1' }, provider: 'anthropic' },
    executors: {
      plain: { kind: 'agent', command: 'my-agent', allowCrossProvider: true, args: ['run', '--model={model}', '{prompt}', '{prompt}'] },
      herdr: { kind: 'agent', command: 'claude', adapter: 'herdr-spawn', args: ['{prompt}'], promptDelivery: 'file-pointer', permissionMode: 'ask' },
    },
  };
  const requests = [
    { executorId: 'executor', prompt: 'hello; rm -rf / $(whoami) "q" \'s\'', model: 'opus' },
    { executorId: 'plain', prompt: 'p {model}', model: 'm1' },
    { executorId: 'herdr', prompt: 'x', model: 'sonnet' },
    { executorId: 'executor', prompt: 'x', model: 'opus', reasoningEffort: 'high', requestedModel: 'sonnet' },
    { executorId: 'executor', prompt: 'x', model: 'opus', reasoningEffort: 'max' },
    { executorId: 'executor', prompt: 'x', model: 'opus', reasoningEffort: 'turbo' },
    { executorId: 'plain', prompt: 'x', model: 'm', reasoningEffort: 'low' },
  ];
  const commands = requests.map((req) => {
    const resolved = attempt(() => resolveExecutorConfig(cfg, undefined, req.executorId, undefined));
    const out = attempt(() => resolveExecutorCommand(cfg, { ...req, tier: undefined }));
    return { request: req, executor: resolved.ok ?? null, out };
  });
  const argvCases = [
    { argsTemplate: ['-p', '{prompt}', '--model', '{model}', 'x{prompt}y'], args: [], prompt: 'P', model: 'M' },
    { argsTemplate: null, args: ['a', 'the prompt text', 'b'], prompt: 'the prompt text', model: 'M' },
    { argsTemplate: null, args: ['a', 'b'], prompt: '', model: 'M' },
    { argsTemplate: ['--m={model}'], args: [], prompt: 'P', model: undefined },
  ].map((c) => ({ ...c, model: c.model ?? null, out: agentArgsWithoutPrompt({ argsTemplate: c.argsTemplate ?? undefined, args: c.args, prompt: c.prompt, model: c.model }) }));
  const efforts = [
    ['high', ['low', 'high'], 'ex'], ['max', ['low', 'high'], 'ex'], ['turbo', undefined, 'ex'], ['low', undefined, 'ex'], ['low', [], 'ex'],
  ].map(([value, supported, executorId]) => ({ value, supported: supported ?? null, executorId, out: attempt(() => assertReasoningEffort(value, { supported, executorId })) }));
  write('executor-command.v1.json', { note: 'recorded from src/runner/dispatch/transport.mjs and config.mjs; `executor` is resolveExecutorConfig of the same request, the input of the Rust function', cfg, commands, argvCases, efforts });
}

// SECTION: session-attempt
{
  const { requirementOf, headOf } = await dispatch('session-attempt.mjs');
  const grants = [];
  for (const writes of [[], ['a/b', 'c']]) for (const mailbox of [false, true]) for (const peers of [false, true]) {
    grants.push({ in: { verbs: [], writes, mailbox, peers }, out: requirementOf({ verbs: [], writes, mailbox, peers }) });
  }
  const envs = [
    {}, { FGOS_HEAD_PERSONA: 'p', FGOS_HEAD_NAME: 'n', FGOS_HEAD_GEN: '3' }, { FGOS_HEAD_PERSONA: 'p', FGOS_HEAD_NAME: 'n', FGOS_HEAD_GEN: '0' },
    { FGOS_HEAD_PERSONA: 'p', FGOS_HEAD_NAME: 'n', FGOS_HEAD_GEN: '1.5' }, { FGOS_HEAD_PERSONA: 'p', FGOS_HEAD_GEN: '1' },
    { FGOS_HEAD_PERSONA: 'p', FGOS_HEAD_NAME: 'n', FGOS_HEAD_GEN: 'x' }, { FGOS_HEAD_PERSONA: 'p', FGOS_HEAD_NAME: 'n', FGOS_HEAD_GEN: ' 2 ' },
  ].map((env) => ({ env, out: headOf(env) }));
  write('session-attempt.v1.json', { note: 'recorded from src/runner/dispatch/session-attempt.mjs', grants, envs });
}

// SECTION: round
{
  const h = await dispatch('herdr-round.mjs');
  const { normalizeAgentName } = await import(path.join(root, 'src', 'native', 'proof-helpers.mjs'));
  const withoutPaneEnv = [
    {}, { TERM: 'x', PATH: '/bin', HERDR_SOCKET_PATH: '/s', HERDR_SESSION: 'a', COLORTERM: 'c', TERM_PROGRAM: 'p', TERM_PROGRAM_VERSION: '1', KEEP: 'k', term: 'lower' },
  ].map((env) => ({ env, out: h.withoutPaneEnv(env) }));
  const screens = [
    ['', ''], ['a\nb\nc', 'b\nc\nd'], ['a\nb', 'a\nb'], ['a\nb', 'x\ny'], ['one', 'one\ntwo'], ['a\nb\nc\nd', 'c\nd\ne\nf'], ['a\na\na', 'a\na\nb'], [undefined, 'x'],
  ].map(([previous, next]) => ({ previous: previous ?? null, next, out: h.screenDelta(previous, next) }));
  const names = ['fgos-run_1-cmd_1795081120288_abcdef12', 'Short Name!', '', '---', 'a'.repeat(32), 'a'.repeat(33), 'fgos-' + 'x'.repeat(60), 'ÜÑí cödé', 'a  b__c--d'].map((raw) => ({ raw, out: normalizeAgentName(raw) }));
  const trustCases = [];
  const home = '/home/u';
  const envs = [
    { kind: 'claude-json', env: {}, worker: null }, { kind: 'claude-json', env: { CLAUDE_CONFIG_DIR: '/cfg' }, worker: null },
    { kind: 'claude-json', env: { CLAUDE_CONFIG_DIR: '/cfg' }, worker: { CLAUDE_CONFIG_DIR: '/priv/.claude' } },
    { kind: 'claude-json', env: {}, worker: { CLAUDE_CONFIG_DIR: '/priv/.claude' }, path: '/declared/.claude.json' },
    { kind: 'codex-toml', env: {}, worker: null }, { kind: 'codex-toml', env: { CODEX_HOME: '/cx' }, worker: { CODEX_HOME: '/priv/cx' } },
    { kind: 'codex-toml', env: { CODEX_HOME: '/cx' }, worker: { CODEX_HOME: '/cx' } },
    { kind: 'codex-toml', env: { CODEX_HOME: '/cx' }, worker: { CODEX_HOME: '/priv/cx' }, source: { kind: 'codex-home', home: '/acct/cx' } },
    { kind: 'codex-toml', env: { CODEX_HOME: '/cx' }, worker: { CODEX_HOME: '/priv/cx' }, source: { kind: 'codex-home', home: '~/acct' } },
    { kind: 'agy', env: {}, worker: null }, { kind: 'agy-json', env: { HOME: '/h1' }, worker: { HOME: '/priv/h' } },
    { kind: 'agy', env: { HOME: '/h1' }, worker: { HOME: '/priv/h' }, source: { kind: 'home-files', home: '/acct/h' } },
    { kind: 'agy', env: { HOME: '/h1' }, worker: { HOME: '/priv/h' }, path: '/declared/settings.json' },
  ];
  // The recorder's HOME is fixed so a default under the home is recorded stably.
  const realHome = process.env.HOME; const realHomedir = os.homedir;
  process.env.HOME = home; os.homedir = () => home;
  for (const c of envs) {
    const trustStore = { kind: c.kind, ...(c.path ? { path: c.path } : {}) };
    trustCases.push({ trustStore, fullEnv: c.env, workerEnv: c.worker, accountSource: c.source ?? null, out: attempt(() => h.trustStorePaths({ trustStore, fullEnv: c.env, workerEnv: c.worker, accountSource: c.source })) });
  }
  process.env.HOME = realHome; os.homedir = realHomedir;
  const round = (workId = 'w1') => ({ workId, agentName: 'agent-a', note() {}, fail(errorClass, reason, message) { const e = new Error(message); e.errorClass = errorClass; e.reason = reason; return e; } });
  const cwd = '/repo/wt'; const repoRoot = '/repo/root';
  const confinementCases = [
    { confinement: { privateHome: true, isolatedSession: true, ownWorktree: true }, permissionMode: 'bypass', cwd: repoRoot, delivery: null },
    { confinement: { privateHome: true }, permissionMode: 'bypass', cwd, delivery: null },
    { confinement: { ownWorktree: true }, permissionMode: 'bypass', cwd, delivery: null },
    { confinement: { controls: { home: 'private', session: 'isolated', workspace: 'own' } }, permissionMode: 'bypass', cwd: repoRoot, delivery: null },
    { confinement: { ownWorktree: true }, permissionMode: 'ask', cwd: repoRoot, delivery: null },
    { confinement: { ownWorktree: true }, permissionMode: 'ask', cwd: repoRoot, delivery: { rootWorkspaceAllowed: true } },
    { confinement: { ownWorktree: true }, permissionMode: 'ask', cwd, delivery: null },
    { confinement: { ownWorktree: true }, permissionMode: 'ask', cwd, delivery: { backendDelivers: true } },
    { confinement: { privateHome: true, isolatedSession: true, ownWorktree: true }, permissionMode: 'bypass', cwd, delivery: { backendDelivers: true } },
    { confinement: null, permissionMode: 'ask', cwd, delivery: null },
    { confinement: {}, permissionMode: undefined, cwd, delivery: null },
  ].map((c) => ({
    ...c, permissionMode: c.permissionMode ?? null, repoRoot,
    out: attempt(() => h.establishConfinement({ confinement: c.confinement ?? undefined, round: round(), fullEnv: { HOME: '/nonexistent-home-for-vectors' }, cwd: c.cwd, repoRoot, permissionMode: c.permissionMode, herdrBin: 'herdr', delivery: c.delivery })),
  }));
  // The async function rejects rather than throws: settle every case.
  for (const c of confinementCases) {
    if (c.out.ok && typeof c.out.ok.then === 'function') {
      const caseIn = c;
      try { caseIn.out = { ok: await c.out.ok }; } catch (error) { caseIn.out = { error: { name: error.name, code: error.code ?? null, errorClass: error.errorClass ?? null, reason: error.reason ?? null, message: error.message ?? null } }; }
    }
  }
  const staleWritable = { PANE_IDLE_TIMEOUT_MS: h.PANE_IDLE_TIMEOUT_MS, ORPHAN_SETTLE_MS: h.ORPHAN_SETTLE_MS };
  write('round.v1.json', { note: 'recorded from src/runner/dispatch/herdr-round.mjs and normalizeAgentName of src/native/proof-helpers.mjs; HOME of the trust cases is /home/u', home, constants: staleWritable, withoutPaneEnv, screens, names, trustCases, confinementCases });
}

// SECTION: inspection and attention
{
  const ri = await dispatch('runtime-inspection.mjs');
  const av = await dispatch('attention-view.mjs');
  const { outcomeOfRunResult } = await import(path.join(root, 'src', 'runner', 'execution', 'unit-run-history.mjs'));
  const NOW = '2026-11-19T10:00:00.000Z';
  const now = () => NOW;
  const j = (value) => `${JSON.stringify(value)}\n`;
  const run = (runId, assignmentId, extra = {}) => j({ runId, assignmentId, status: 'bound', cwd: '/vec/ws-a', startedAt: '2026-11-19T09:00:00.000Z', timeoutMs: 600000, ...extra });
  const gen = (n, runId, attempt = 1, extra = {}) => [`.fgos/assignments/${n.a}/admission/generations/${String(n.n).padStart(10, '0')}.json`, j({ runId, attempt, ...extra })];
  const dir = (a) => `.fgos/assignments/${a}`;
  const files = {
    // a1: one admitted run, bound, no result, supervised.
    [`${dir('a1')}/assignment.json`]: j({ assignmentId: 'a1' }),
    [`${dir('a1')}/runs/01/run.json`]: run('r1', 'a1'),
    [`${dir('a1')}/runs/01/supervisor-binding.json`]: j({ bound: true }),
    [`${dir('a1')}/runs/01/visibility.json`]: j({ status: 'working' }),
    [`${dir('a1')}/runs/01/workspace-evidence.json`]: j({ dirt: 'clean' }),
    ...Object.fromEntries([gen({ a: 'a1', n: 1 }, 'r1')]),
    // a2: settled with a legacy done result, owned by a coordination session.
    [`${dir('a2')}/assignment.json`]: j({ assignmentId: 'a2' }),
    [`${dir('a2')}/runs/01/run.json`]: run('r2', 'a2', { status: 'settled', coordinationId: 's1' }),
    [`${dir('a2')}/runs/01/result.json`]: j({ runId: 'r2', status: 'done', confidence: 'high', summary: 'ok' }),
    ...Object.fromEntries([gen({ a: 'a2', n: 1 }, 'r2')]),
    '.fgos/coordination/sessions/s1/session.json': j({ assignmentRefs: ['a2'] }),
    // a3: a corrupt result and a launched run.
    [`${dir('a3')}/assignment.json`]: j({ assignmentId: 'a3' }),
    [`${dir('a3')}/runs/01/run.json`]: run('r3', 'a3', { status: 'running', launchedAt: '2026-11-19T09:00:01.000Z', cwd: '/vec/ws-b' }),
    [`${dir('a3')}/runs/01/result.json`]: '{ not json',
    ...Object.fromEntries([gen({ a: 'a3', n: 1 }, 'r3')]),
    // a4: a malformed run record.
    [`${dir('a4')}/assignment.json`]: j({ assignmentId: 'a4' }),
    [`${dir('a4')}/runs/01/run.json`]: '[]',
    ...Object.fromEntries([gen({ a: 'a4', n: 1 }, 'r4')]),
    // a5 and a6: one run id claimed by two assignments.
    [`${dir('a5')}/assignment.json`]: j({ assignmentId: 'a5' }),
    [`${dir('a5')}/runs/01/run.json`]: run('dup', 'a5'),
    ...Object.fromEntries([gen({ a: 'a5', n: 1 }, 'dup')]),
    [`${dir('a6')}/assignment.json`]: j({ assignmentId: 'a6' }),
    [`${dir('a6')}/runs/01/run.json`]: run('dup', 'a6'),
    ...Object.fromEntries([gen({ a: 'a6', n: 1 }, 'dup')]),
    // a7: a retry whose first generation was aborted, one run unadmitted.
    [`${dir('a7')}/assignment.json`]: j({ assignmentId: 'a7' }),
    [`${dir('a7')}/runs/01/run.json`]: run('r7a', 'a7', { status: 'admitted' }),
    [`${dir('a7')}/runs/02/run.json`]: run('r7b', 'a7', { status: 'delivered', delivery: 'delivered' }),
    [`${dir('a7')}/runs/03/run.json`]: run('r7x', 'a7', { status: 'admitted' }),
    ...Object.fromEntries([gen({ a: 'a7', n: 1 }, 'r7old', 1, { retryId: 'rt1' }), gen({ a: 'a7', n: 2 }, 'r7a', 1), gen({ a: 'a7', n: 3 }, 'r7b', 1)]),
    [`${dir('a7')}/admission/markers/rt1.aborted.json`]: j({ aborted: true }),
    // a8: no assignment record at all; a9: an assignment with no admitted run.
    [`${dir('a8')}/runs/01/run.json`]: run('r8', 'a8'),
    [`${dir('a9')}/assignment.json`]: j({ assignmentId: 'a9' }),
  };
  const build = (extra = {}) => {
    const projectRoot = scratch('fgos-round-inspect-');
    for (const [rel, body] of Object.entries({ ...files, ...extra })) {
      const file = path.join(projectRoot, rel);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, body);
    }
    return projectRoot;
  };
  const projectRoot = build();
  const norm = (value) => JSON.parse(JSON.stringify(value).split(projectRoot).join('<root>'));
  const inspect = (options, root2 = projectRoot) => {
    try { return { ok: norm(ri.inspectDispatchRuntime(root2, options, { now })) }; } catch (error) { return { error: { message: error.message } }; }
  };
  const selectors = [
    { run: 'r1' }, { run: 'r2' }, { run: 'r3' }, { run: 'dup' }, { run: 'nope' }, { run: 'r4' }, { run: 'r8' }, { run: 'r7b' },
    { assignment: 'a1' }, { assignment: 'a2' }, { assignment: 'a3' }, { assignment: 'a4' }, { assignment: 'a5' }, { assignment: 'a7' }, { assignment: 'a8' }, { assignment: 'a9' }, { assignment: 'nope' }, { assignment: '../x' },
    { cwd: '/vec/ws-a' }, { cwd: '/vec/ws-b' }, { cwd: '/vec/ws-none' },
    {}, { run: 'r1', assignment: 'a1' }, { run: ' ' }, { run: 'r1', since: '2026-01-01' }, { attention: true }, { attention: true, since: '2026-02-30' },
  ].map((options) => ({ options, out: inspect(options) }));
  // A workspace with the evidence files the cwd view reads, and one with a conflicting projection.
  const evidence = {
    [`.fgos/dispatch.lock`]: j({ holder: 'x' }), [`.fgos/workspace-evidence.json`]: j({ dirt: 'clean' }), [`.fgos/dispatch/projection-conflicts.json`]: j([]),
  };
  const withEvidence = build(evidence);
  const normE = (value) => JSON.parse(JSON.stringify(value).split(withEvidence).join('<root>'));
  const cwdEvidence = ['/vec/ws-a', '/vec/ws-b'].map((cwd) => ({ cwd, files: evidence, out: (() => { try { return { ok: normE(ri.inspectDispatchRuntime(withEvidence, { cwd }, { now })) }; } catch (e) { return { error: { message: e.message } }; } })() }));
  const conflicting = build({ ...evidence, '.fgos/dispatch/projection-conflicts.json': j([{ a: 1 }]) });
  const normC = (value) => JSON.parse(JSON.stringify(value).split(conflicting).join('<root>'));
  const cwdConflict = { cwd: '/vec/ws-b', files: { ...evidence, '.fgos/dispatch/projection-conflicts.json': j([{ a: 1 }]) }, out: { ok: normC(ri.inspectDispatchRuntime(conflicting, { cwd: '/vec/ws-b' }, { now })) } };
  const sinceCases = ['2026-11-19', '2026-11-19T10:00:00Z', '2026-11-19T10:00:00.5+07:00', '2026-11-19T10:00:00-05:30', '2026-02-30', '2026-11-19T10:00:00', '2026-11-19T25:00:00Z', '2026-11-19T10:00:00+24:00', '999-01-01', '', 'tomorrow', '2026-11-19T10:00Z', '0999-12-31', '2026-13-01', '2024-02-29', '2026-11-19t10:00:00z'].map((since) => ({ since, out: attempt(() => ({ ms: ri.parseAttentionSince(since) })) }));
  write('inspection.v1.json', { note: 'recorded from src/runner/dispatch/runtime-inspection.mjs; every case reads the same fixture tree (`files`, relative to the project root, `<root>` stands for it in the output) at observedAt', files, observedAt: NOW, selectors, cwdEvidence, cwdConflict, sinceCases });

  // Attention: a settled failure, a blocked run, a dead controller, a recovered failure, and the detections the host measures.
  const att = {
    ...files,
    [`${dir('f1')}/assignment.json`]: j({ assignmentId: 'f1' }),
    [`${dir('f1')}/runs/01/run.json`]: run('rf1', 'f1', { status: 'settled', startedAt: '2026-11-19T09:10:00.000Z' }),
    [`${dir('f1')}/runs/01/result.json`]: j({ runId: 'rf1', status: 'failed', confidence: 'failed', summary: 'boom' }),
    ...Object.fromEntries([gen({ a: 'f1', n: 1 }, 'rf1')]),
    [`${dir('b1')}/assignment.json`]: j({ assignmentId: 'b1' }),
    [`${dir('b1')}/runs/01/run.json`]: run('rb1', 'b1', { status: 'settled', startedAt: '2026-11-19T09:20:00.000Z' }),
    [`${dir('b1')}/runs/01/result.json`]: j({ runId: 'rb1', status: 'blocked', confidence: 'high', summary: 'stuck' }),
    [`${dir('b1')}/runs/01/receipt.json`]: j({ reason: 'terminal:needs-owner' }),
    ...Object.fromEntries([gen({ a: 'b1', n: 1 }, 'rb1')]),
    [`${dir('b2')}/assignment.json`]: j({ assignmentId: 'b2' }),
    [`${dir('b2')}/runs/01/run.json`]: run('rb2', 'b2', { status: 'settled', startedAt: '2026-11-19T09:21:00.000Z' }),
    [`${dir('b2')}/runs/01/result.json`]: j({ runId: 'rb2', status: 'blocked', confidence: 'high', summary: 'stuck' }),
    ...Object.fromEntries([gen({ a: 'b2', n: 1 }, 'rb2')]),
    [`${dir('s1-fb1')}/assignment.json`]: j({ assignmentId: 's1-fb1' }),
    [`${dir('s1-fb1')}/runs/01/run.json`]: run('rs1', 's1-fb1', { status: 'settled', startedAt: '2026-11-19T09:30:00.000Z' }),
    [`${dir('s1-fb1')}/runs/01/result.json`]: j({ runId: 'rs1', status: 'failed', confidence: 'failed', summary: 'first seat failed' }),
    ...Object.fromEntries([gen({ a: 's1-fb1', n: 1 }, 'rs1')]),
    [`${dir('s1')}/assignment.json`]: j({ assignmentId: 's1' }),
    [`${dir('s1')}/runs/01/run.json`]: run('rs2', 's1', { status: 'settled', startedAt: '2026-11-19T09:40:00.000Z' }),
    [`${dir('s1')}/runs/01/result.json`]: j({ runId: 'rs2', status: 'done', confidence: 'high', summary: 'passed' }),
    ...Object.fromEntries([gen({ a: 's1', n: 1 }, 'rs2')]),
    [`${dir('d1')}/assignment.json`]: j({ assignmentId: 'd1' }),
    [`${dir('d1')}/runs/01/run.json`]: run('rd1', 'd1', { status: 'running', startedAt: '2026-11-19T09:50:00.000Z', cwd: '/vec/ws-d' }),
    ...Object.fromEntries([gen({ a: 'd1', n: 1 }, 'rd1')]),
    [`${dir('d2')}/assignment.json`]: j({ assignmentId: 'd2' }),
    [`${dir('d2')}/runs/01/run.json`]: run('rd2', 'd2', { status: 'running', startedAt: '2026-11-19T09:51:00.000Z' }),
    ...Object.fromEntries([gen({ a: 'd2', n: 1 }, 'rd2')]),
    [`${dir('d3')}/assignment.json`]: j({ assignmentId: 'd3' }),
    [`${dir('d3')}/runs/01/run.json`]: run('rd3', 'd3', { status: 'running', startedAt: '2026-11-19T09:52:00.000Z', settlement: 'abandoned-legacy' }),
    ...Object.fromEntries([gen({ a: 'd3', n: 1 }, 'rd3')]),
  };
  const attRoot = scratch('fgos-round-attention-');
  // A result with no `settledAt` is timed by its file's modification time: pin it so the vectors do not depend on
  // when they were recorded.
  const mtimes = Object.fromEntries(Object.keys(att).filter((k) => k.endsWith('/result.json')).sort().map((k, i) => [k, new Date(Date.UTC(2026, 10, 19, 9, 10 + i)).toISOString()]));
  for (const [rel, body] of Object.entries(att)) {
    const file = path.join(attRoot, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, body);
    if (mtimes[rel]) fs.utimesSync(file, new Date(mtimes[rel]), new Date(mtimes[rel]));
  }
  const normA = (value) => JSON.parse(JSON.stringify(value).split(attRoot).join('<root>'));
  const resumeOf = { rd1: 'fgos run resume rd1' };
  const views = Object.fromEntries(Object.keys(att).filter((k) => k.endsWith('/run.json')).map((k) => [path.dirname(k), null]));
  const view = (runDir) => {
    const id = JSON.parse(fs.readFileSync(path.join(runDir, 'run.json'), 'utf8')).runId;
    return id === 'rd1' ? { attemptState: 'live', unitState: 'running', resumeCommand: resumeOf.rd1 } : id === 'rd2' ? { attemptState: 'superseded' } : {};
  };
  const answer = {
    definitions: [
      { name: 'plan-late', row: { kind: 'blocked', reason: 'late', nextCommand: 'fgos plan show' }, rows: [{ group: { 'subject.id': 'plan-1' } }, { group: { 'subject.id': 'plan-2' }, insufficient: true }, { group: {} }] },
      { name: 'head-quiet', unmeasured: 'no metric', row: { kind: 'needs-human', reason: 'quiet', nextCommand: 'x' }, rows: [] },
      { name: 'broken', error: 'host said no' },
      { name: 'rowless', rows: [{ group: { 'subject.id': 'z' } }] },
    ],
  };
  const calls = [];
  const definitions = (args) => { calls.push(args); return answer; };
  const cases = ['2026-11-19', '2026-11-19T09:35:00Z', '2026-11-20', '2026-11-19T09:00:00+00:00'].map((since) => {
    const withDefs = norm2(av.attentionView(attRoot, { since }, { now, view, definitions }));
    const without = norm2(av.attentionView(attRoot, { since }, { now, view }));
    return { since, withDefinitions: withDefs, withoutDefinitions: without };
  });
  function norm2(value) { return JSON.parse(JSON.stringify(value).split(attRoot).join('<root>')); }
  const results = Object.fromEntries(Object.entries(att).filter(([k]) => k.endsWith('/result.json')).map(([k, v]) => [k, outcomeOfRunResult(JSON.parse(v.startsWith('{ not') ? 'null' : v))]));
  write('attention.v1.json', { note: 'recorded from src/runner/dispatch/attention-view.mjs; mtimes pins the modification time of each result file (the time of a result with no settledAt); viewOf maps a run id to the attempt view its caller injects; definitionsCalls are what the host call was asked', files: att, mtimes, observedAt: NOW, viewOf: { rd1: { attemptState: 'live', unitState: 'running', resumeCommand: resumeOf.rd1 }, rd2: { attemptState: 'superseded' } }, definitions: answer, definitionsCalls: calls, cases, outcomes: results });
}
