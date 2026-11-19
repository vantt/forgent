#!/usr/bin/env node
// Golden-vector recorder for the confinement request authority: runs the Node originals
// (src/runner/dispatch/confinement/{request,authority}.mjs) over fixed inputs and writes what they answer, so the
// Rust port (packages/execution/engine/src/confinement/request) is held to the same answers.
//
// Usage: node test/golden-recorders/confinement-request.recorder.mjs [--out <dir>]
// Default out: packages/execution/contracts/confinement-request. The vectors are committed; run this again only
// when the Node originals change on purpose.
//
// The native door and the process-identity leaf need an installed addon a checkout does not have. The recorder runs
// the real modules and swaps those two leaves for what they do (RFC 8785 text of a JSON value, a durable replace)
// through a resolve hook, so the vectors do not depend on a built addon.
//
// Every machine fact is passed in: the process environment a case runs under is written into the case, a driver is
// a recorded fake (its answers are data in the case), and a path under the case's temp directory is written as
// `$ROOT`, which the reader swaps for its own fixture root. Timestamps the originals take from the clock are
// recorded as `<now>`.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..');

{
  const door = [
    'import fs from "node:fs"; import path from "node:path";',
    'const sort = (v) => Array.isArray(v) ? v.map(sort) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sort(v[k])])) : v;',
    'export const canonicalJson = (value) => JSON.stringify(sort(JSON.parse(JSON.stringify(value))));',
    'export function replaceDurably(dir, name, bytes, mode) { fs.mkdirSync(dir, { recursive: true }); const tmp = path.join(dir, `.tmp-${process.pid}-${Math.random()}`); fs.writeFileSync(tmp, bytes, { mode }); fs.renameSync(tmp, path.join(dir, name)); }',
    'export function installOnce(dir, name, bytes, mode) { fs.mkdirSync(dir, { recursive: true }); const file = path.join(dir, name); if (fs.existsSync(file)) return "exists"; fs.writeFileSync(file, bytes, { mode }); return "created"; }',
    'export const nativeDoor = () => { throw new Error("no addon in the recorder"); };',
    'export const nativeHelperExe = () => null; export const nativeError = (e) => ({ cause: e.message, stderr: [] }); export const loadNativeAddon = () => { throw new Error("no addon in the recorder"); };',
    'export const abiShortfall = () => null; export const combinedAbiMatches = () => true; export const fromDoorJson = (t) => JSON.parse(t);',
  ].join('\n');
  const identity = 'export const selfRecord = () => ({ host: "recorder", pid: 1, startTime: "1" }); export const resolveHolderLiveness = () => "held"; export const judge = () => "alive"; export const observe = () => ({ kind: "absent" }); export const scan = () => []; export const signalByIdentity = () => false;';
  const swap = (url) => JSON.stringify('data:text/javascript,' + encodeURIComponent(url));
  const hooks = `export async function resolve(spec, ctx, next) { const r = await next(spec, ctx); if (r.url.endsWith("/src/native/door.mjs")) return { url: ${swap(door)}, shortCircuit: true }; if (r.url.endsWith("/src/native/process-identity.mjs")) return { url: ${swap(identity)}, shortCircuit: true }; return r; }`;
  (await import('node:module')).register(`data:text/javascript,${encodeURIComponent(hooks)}`);
}

// The clock is fixed so a digest over a record that carries a timestamp is the same on every run; the Rust reader
// is given the same instant.
const FIXED_NOW = '2026-01-02T03:04:05.000Z';
{
  const RealDate = Date;
  globalThis.Date = class extends RealDate {
    constructor(...args) { super(...(args.length ? args : [FIXED_NOW])); }
    static now() { return new RealDate(FIXED_NOW).getTime(); }
  };
}

const confinement = path.join(repo, 'src/runner/dispatch/confinement');
const request = await import(path.join(confinement, 'request.mjs'));
const authority = await import(path.join(confinement, 'authority.mjs'));
const registry = await import(path.join(confinement, 'backend-registry.mjs'));
const policies = await import(path.join(confinement, 'policies.mjs'));

let outDir = path.join(repo, 'packages/execution/contracts/confinement-request');
const argv = process.argv.slice(2);
if (argv[0] === '--out') outDir = path.resolve(argv[1]);

const clone = (value) => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));
const hostWriteDenied = clone(policies.BUILTIN_POLICIES['host-write-denied']);
const workspaceWrite = clone(policies.BUILTIN_POLICIES['workspace-write']);

/** Runs `fn`; the answer is `{ ok }` or `{ error, code?, errorClass? }`. */
function observe(fn) {
  try {
    const ok = fn();
    return { ok: ok === undefined ? null : clone(ok) };
  } catch (err) {
    return { error: err.message, ...(err.code ? { code: err.code } : {}), ...(err.errorClass ? { errorClass: err.errorClass } : {}) };
  }
}

const scrubText = (text, root) => text.split(root).join('$ROOT');
const scrub = (value, root) => (value === undefined ? undefined : JSON.parse(scrubText(JSON.stringify(value), root)));
const unscrub = (value, root) => JSON.parse(JSON.stringify(value).split('$ROOT').join(root));
const NOW = '<now>';
function scrubClock(value) {
  if (Array.isArray(value)) return value.map(scrubClock);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, (k === 'publishedAt' || k === 'updatedAt') && typeof v === 'string' ? NOW : scrubClock(v)]));
  }
  return value;
}

const fixtureRoot = (prefix) => fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));

/** Every regular file under `dir`, relative, with its text (JSON parsed when it is JSON), sorted. */
function tree(dir) {
  const out = [];
  const walk = (current) => {
    for (const name of fs.readdirSync(current).sort()) {
      const full = path.join(current, name);
      const stat = fs.lstatSync(full);
      if (stat.isDirectory()) walk(full);
      else if (stat.isFile()) {
        const text = fs.readFileSync(full, 'utf8');
        let body = text;
        try { body = JSON.parse(text); } catch { /* text stays */ }
        out.push({ path: path.relative(dir, full), mode: (stat.mode & 0o777).toString(8), body });
      }
    }
  };
  if (fs.existsSync(dir)) walk(dir);
  return out;
}

function writeFiles(root, files) {
  for (const [rel, content] of Object.entries(files ?? {})) {
    const target = path.join(root, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, typeof content === 'string' ? content : JSON.stringify(content));
  }
}

// ---------------------------------------------------------------- launch contexts

const assignmentContext = (over = {}) => ({
  contract: 'assignment-launch-context.v1',
  run: { runId: 'r1', assignmentId: 'a1', attempt: 1, dispatchPlanDigest: 'sha256:aa', evaluatorBaselineDigest: 'sha256:bb' },
  command: { launchCommandId: 'cmd1', controlEpoch: 1, controlTokenDigest: 'sha256:cc' },
  ...over,
});
const sessionContext = (over = {}) => ({
  contract: 'assignment-launch-context.v1',
  kind: 'session',
  run: { runId: 'r1', assignmentId: 'head-1', attempt: 1 },
  command: { launchCommandId: 'cmd1' },
  session: { role: 'secretary' },
  ...over,
});
const withRun = (over) => assignmentContext({ run: { ...assignmentContext().run, ...over } });
const withCommand = (over) => assignmentContext({ command: { ...assignmentContext().command, ...over } });
const sessionRun = (over) => sessionContext({ run: { ...sessionContext().run, ...over } });

const launchContextCases = [
  ['assignment context', assignmentContext()],
  ['cli-spawn contract', assignmentContext({ contract: 'assignment-cli-spawn-launch-context.v1' })],
  ['herdr-spawn contract', assignmentContext({ contract: 'assignment-herdr-spawn-launch-context.v1' })],
  ['unknown contract', assignmentContext({ contract: 'assignment-launch-context.v9' })],
  ['not an object', 'ctx'],
  ['an array', []],
  ['null', null],
  ['kind assignment spelled out', assignmentContext({ kind: 'assignment' })],
  ['unknown kind', assignmentContext({ kind: 'daemon' })],
  ['session carried by an assignment', assignmentContext({ session: { role: 'x' } })],
  ['run missing', { contract: 'assignment-launch-context.v1', command: assignmentContext().command }],
  ['run an array', assignmentContext({ run: [] })],
  ['runId blank', withRun({ runId: ' ' })],
  ['runId a number', withRun({ runId: 4 })],
  ['assignmentId missing', withRun({ assignmentId: undefined })],
  ['attempt zero', withRun({ attempt: 0 })],
  ['attempt fractional', withRun({ attempt: 1.5 })],
  ['attempt a string', withRun({ attempt: '1' })],
  ['dispatchPlanDigest without sha256', withRun({ dispatchPlanDigest: 'md5:aa' })],
  ['dispatchPlanDigest missing', withRun({ dispatchPlanDigest: undefined })],
  ['evaluatorBaselineDigest without sha256', withRun({ evaluatorBaselineDigest: 'x' })],
  ['command missing', { contract: 'assignment-launch-context.v1', run: assignmentContext().run }],
  ['command an array', assignmentContext({ command: [] })],
  ['launchCommandId blank', withCommand({ launchCommandId: '' })],
  ['controlEpoch zero', withCommand({ controlEpoch: 0 })],
  ['controlEpoch a string', withCommand({ controlEpoch: '1' })],
  ['controlTokenDigest without sha256', withCommand({ controlTokenDigest: 'abc' })],
  ['session context', sessionContext()],
  ['session without a command id', sessionContext({ command: {} })],
  ['session role blank', sessionContext({ session: { role: ' ' } })],
  ['session missing', sessionContext({ session: undefined })],
  ['session role not a string', sessionContext({ session: { role: 3 } })],
  ['session attempt zero', sessionRun({ attempt: 0 })],
  ['session runId blank', sessionRun({ runId: '' })],
  ['session carries dispatchPlanDigest', sessionRun({ dispatchPlanDigest: 'sha256:aa' })],
  ['session carries evaluatorBaselineDigest', sessionRun({ evaluatorBaselineDigest: 'sha256:aa' })],
  ['session carries controlEpoch', sessionContext({ command: { launchCommandId: 'cmd1', controlEpoch: 1 } })],
  ['session carries controlTokenDigest', sessionContext({ command: { launchCommandId: 'cmd1', controlTokenDigest: 'sha256:aa' } })],
  ['session run an array', sessionContext({ run: [] })],
].map(([name, context]) => ({ name, context, ...observe(() => request.validateAssignmentLaunchContext(context)) }));

// Cross-check against what is on disk under the run directory. A file that cannot be parsed is ignored.
const runJson = (over = {}) => ({ runId: 'r1', assignmentId: 'a1', attempt: 1, dispatchPlanDigest: 'sha256:aa', ...over });
const crossCases = [
  ['no files', {}, assignmentContext()],
  ['run.json agrees', { 'run.json': runJson() }, assignmentContext()],
  ['run.json runId differs', { 'run.json': runJson({ runId: 'r2' }) }, assignmentContext()],
  ['run.json assignmentId differs', { 'run.json': runJson({ assignmentId: 'a2' }) }, assignmentContext()],
  ['run.json attempt differs', { 'run.json': runJson({ attempt: 2 }) }, assignmentContext()],
  ['run.json plan digest differs', { 'run.json': runJson({ dispatchPlanDigest: 'sha256:zz' }) }, assignmentContext()],
  ['run.json holds fewer fields', { 'run.json': { runId: 'r1' } }, assignmentContext()],
  ['run.json is not JSON', { 'run.json': 'not json' }, assignmentContext()],
  ['baseline agrees', { 'controller/evaluator-baseline.json': { digest: 'sha256:bb' } }, assignmentContext()],
  ['baseline differs', { 'controller/evaluator-baseline.json': { digest: 'sha256:zz' } }, assignmentContext()],
  ['baseline is not JSON', { 'controller/evaluator-baseline.json': '{' }, assignmentContext()],
  ['command file agrees', { 'controller/commands/cmd1.json': { runId: 'r1', controlEpoch: 1, controlTokenDigest: 'sha256:cc' } }, assignmentContext()],
  ['command file runId differs', { 'controller/commands/cmd1.json': { runId: 'r9' } }, assignmentContext()],
  ['command file epoch differs', { 'controller/commands/cmd1.json': { controlEpoch: 2 } }, assignmentContext()],
  ['command file token differs', { 'controller/commands/cmd1.json': { controlTokenDigest: 'sha256:other' } }, assignmentContext()],
  ['command file of another command', { 'controller/commands/cmd2.json': { runId: 'r9' } }, assignmentContext()],
  ['session run.json differs', { 'run.json': runJson({ assignmentId: 'other' }) }, sessionContext()],
  ['session command file agrees', { 'controller/commands/cmd1.json': { runId: 'r1' } }, sessionContext()],
  ['session command file differs', { 'controller/commands/cmd1.json': { runId: 'r2' } }, sessionContext()],
].map(([name, files, launchContext]) => {
  const root = fixtureRoot('cr-cross-');
  try {
    writeFiles(root, files);
    return { name, files, launchContext, ...scrub(observe(() => request.validateAssignmentLaunchContext(launchContext, { runDir: root })), root) };
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------- request shape

const baseRequest = (over = {}) => ({
  contract: 'confinement-request.v1',
  dispatchId: 'disp_1',
  capability: 'code:implement',
  executorId: 'exec-a',
  invocation: { command: 'echo', args: ['a'], adapter: 'cli-spawn' },
  context: { cwd: '/work/repo', runDir: '/work/run' },
  requirement: { mode: 'required', policyId: 'host-write-denied', policy: clone(hostWriteDenied) },
  ...over,
});
const hostWriteOverride = { controls: { hostWrite: 'deny' } };

const requestShapeCases = [
  ['minimal required request', baseRequest()],
  ['not an object', 'x'],
  ['an array', []],
  ['unknown key', baseRequest({ extra: 1 })],
  ['every allowed key', baseRequest({ stageSkill: 's', override: hostWriteOverride, resourceNeeds: [], backendId: 'bwrap', authorityScope: 'x', assignmentLaunchContext: null, providerCapacity: null, attemptId: 'a', launchMode: 'direct', gateCommand: ['g'], attemptBinds: [], requestSocket: '/s' })],
  ['wrong contract', baseRequest({ contract: 'confinement-request.v2' })],
  ['dispatchId blank', baseRequest({ dispatchId: '' })],
  ['capability missing', baseRequest({ capability: undefined })],
  ['stageSkill empty', baseRequest({ stageSkill: '' })],
  ['stageSkill a number', baseRequest({ stageSkill: 3 })],
  ['executorId missing', baseRequest({ executorId: undefined })],
  ['invocation an array', baseRequest({ invocation: [] })],
  ['invocation missing', baseRequest({ invocation: undefined })],
  ['credentialStore valid', baseRequest({ invocation: { command: 'x', credentialStore: { use: 'codex', homeEnv: 'CODEX_HOME', files: ['auth.json'], sessionDir: 'sessions' } } })],
  ['credentialStore not an object', baseRequest({ invocation: { command: 'x', credentialStore: 'codex' } })],
  ['credentialStore unknown key', baseRequest({ invocation: { command: 'x', credentialStore: { use: 'codex', homeEnv: 'H', extra: 1 } } })],
  ['credentialStore use not lowercase', baseRequest({ invocation: { command: 'x', credentialStore: { use: 'Codex', homeEnv: 'H' } } })],
  ['credentialStore homeEnv bad', baseRequest({ invocation: { command: 'x', credentialStore: { use: 'codex', homeEnv: 'bad name' } } })],
  ['credentialStore files escaping', baseRequest({ invocation: { command: 'x', credentialStore: { use: 'codex', homeEnv: 'H', files: ['../x'] } } })],
  ['credentialStore files repeated', baseRequest({ invocation: { command: 'x', credentialStore: { use: 'codex', homeEnv: 'H', files: ['a', 'a'] } } })],
  ['credentialStore sessionDir absolute', baseRequest({ invocation: { command: 'x', credentialStore: { use: 'codex', homeEnv: 'H', sessionDir: '/abs' } } })],
  ['context an array', baseRequest({ context: [] })],
  ['context cwd missing', baseRequest({ context: { runDir: '/r' } })],
  ['context runDir missing', baseRequest({ context: { cwd: '/c' } })],
  ['context runDir blank', baseRequest({ context: { cwd: '/c', runDir: '  ' } })],
  ['requirement missing', baseRequest({ requirement: undefined })],
  ['requirement mode preferred', baseRequest({ requirement: { mode: 'preferred', policyId: 'host-write-denied', policy: clone(hostWriteDenied) } })],
  ['requirement mode unknown', baseRequest({ requirement: { mode: 'sometimes' } })],
  ['unconfined with nulls', baseRequest({ requirement: { mode: 'unconfined', policyId: null, policy: null } })],
  ['unconfined with a policy id', baseRequest({ requirement: { mode: 'unconfined', policyId: 'host-write-denied', policy: null } })],
  ['unconfined without nulls', baseRequest({ requirement: { mode: 'unconfined' } })],
  ['policy with unknown key', baseRequest({ requirement: { mode: 'required', policyId: 'p', policy: { ...clone(hostWriteDenied), backend: 'x' } } })],
  ['policy cidr canonicalised in place', baseRequest({ requirement: { mode: 'required', policyId: 'p', policy: { contract: 'confinement-policy.v1', controls: { ...hostWriteDenied.controls, networkEgress: 'filtered' }, grants: [{ resource: 'run-output', access: 'write', scope: 'dispatch' }], networkFilter: { defaultAction: 'deny', allow: [{ protocol: 'tcp', destination: { kind: 'cidr', value: '10.1.2.3/8' }, ports: [443] }] } } } })],
  ['override valid', baseRequest({ override: hostWriteOverride })],
  ['override null', baseRequest({ override: null })],
  ['override weakening', baseRequest({ override: { controls: { hostWrite: 'allow' } } })],
  ['override on unconfined', baseRequest({ requirement: { mode: 'unconfined', policyId: null, policy: null }, override: hostWriteOverride })],
  ['override not an object', baseRequest({ override: 'x' })],
  ['assignment launch context valid', baseRequest({ assignmentLaunchContext: assignmentContext() })],
  ['assignment launch context invalid', baseRequest({ assignmentLaunchContext: withRun({ attempt: 0 }) })],
  ['session launch context valid', baseRequest({ assignmentLaunchContext: sessionContext() })],
].map(([name, input]) => {
  const copy = clone(input);
  const answer = observe(() => request.validateConfinementRequest(copy));
  return { name, input, ...answer, after: copy };
});

// ---------------------------------------------------------------- request build

const cfgWith = (capabilities, extra = {}) => ({ capabilities, ...extra });
const buildCases = [
  ['explicit unconfined requirement', { capability: 'c', executorId: 'e', context: { cwd: '/c', runDir: '/r' }, requirement: { mode: 'unconfined' }, dispatchId: 'd1' }],
  ['explicit required requirement', { capability: 'c', executorId: 'e', context: { cwd: '/c', runDir: '/r' }, requirement: { mode: 'required', policyId: 'host-write-denied', policy: clone(hostWriteDenied) }, dispatchId: 'd1' }],
  ['capability without a name falls back to the executor', { executorId: 'e', context: { cwd: '/c', runDir: '/r' }, requirement: { mode: 'unconfined' }, dispatchId: 'd1' }],
  ['neither capability nor executor', { context: { cwd: '/c', runDir: '/r' }, requirement: { mode: 'unconfined' }, dispatchId: 'd1' }],
  ['runDir missing', { capability: 'c', executorId: 'e', context: { cwd: '/c' }, dispatchId: 'd1' }],
  ['runDir blank', { capability: 'c', executorId: 'e', context: { cwd: '/c', runDir: ' ' }, dispatchId: 'd1' }],
  ['no context at all', { capability: 'c', executorId: 'e', dispatchId: 'd1' }],
  ['capability declares required confinement', { capability: 'code:implement', executorId: 'e', context: { cwd: '/c', runDir: '/r' }, cfg: cfgWith({ 'code:implement': { confinement: { mode: 'required', policy: 'host-write-denied' } } }), dispatchId: 'd1' }],
  ['capability declares unconfined', { capability: 'code:implement', executorId: 'e', context: { cwd: '/c', runDir: '/r' }, cfg: cfgWith({ 'code:implement': { confinement: { mode: 'unconfined' } } }), dispatchId: 'd1' }],
  ['capability names a custom policy', { capability: 'code:implement', executorId: 'e', context: { cwd: '/c', runDir: '/r' }, cfg: cfgWith({ 'code:implement': { confinement: { mode: 'required', policy: 'mine' } } }, { confinementPolicies: { mine: clone(workspaceWrite) } }), dispatchId: 'd1' }],
  ['capability names an unknown policy', { capability: 'code:implement', executorId: 'e', context: { cwd: '/c', runDir: '/r' }, cfg: cfgWith({ 'code:implement': { confinement: { mode: 'required', policy: 'ghost' } } }), dispatchId: 'd1' }],
  ['capability confinement malformed', { capability: 'code:implement', executorId: 'e', context: { cwd: '/c', runDir: '/r' }, cfg: cfgWith({ 'code:implement': { confinement: { mode: 'maybe' } } }), dispatchId: 'd1' }],
  ['stage skill declares confinement', { capability: 'code:implement', stageSkill: 'skill-a', executorId: 'e', context: { cwd: '/c', runDir: '/r' }, cfg: cfgWith({ 'skill-a': { confinement: { mode: 'required', policy: 'host-write-denied' } } }), dispatchId: 'd1' }],
  ['capability and stage skill agree', { capability: 'code:implement', stageSkill: 'skill-a', executorId: 'e', context: { cwd: '/c', runDir: '/r' }, cfg: cfgWith({ 'code:implement': { confinement: { mode: 'required', policy: 'host-write-denied' } }, 'skill-a': { confinement: { mode: 'required', policy: 'host-write-denied' } } }), dispatchId: 'd1' }],
  ['capability and stage skill disagree on policy', { capability: 'code:implement', stageSkill: 'skill-a', executorId: 'e', context: { cwd: '/c', runDir: '/r' }, cfg: cfgWith({ 'code:implement': { confinement: { mode: 'required', policy: 'host-write-denied' } }, 'skill-a': { confinement: { mode: 'required', policy: 'workspace-write' } } }), dispatchId: 'd1' }],
  ['capability and stage skill disagree on mode', { capability: 'code:implement', stageSkill: 'skill-a', executorId: 'e', context: { cwd: '/c', runDir: '/r' }, cfg: cfgWith({ 'code:implement': { confinement: { mode: 'required', policy: 'host-write-denied' } }, 'skill-a': { confinement: { mode: 'unconfined' } } }), dispatchId: 'd1' }],
  ['stage skill equal to the capability is read once', { capability: 'code:implement', stageSkill: 'code:implement', executorId: 'e', context: { cwd: '/c', runDir: '/r' }, cfg: cfgWith({ 'code:implement': { confinement: { mode: 'required', policy: 'host-write-denied' } } }), dispatchId: 'd1' }],
  ['fallback anchor carries its policy', { capability: 'code:review', fallbackFrom: 'code:implement', executorId: 'e', context: { cwd: '/c', runDir: '/r' }, cfg: cfgWith({ 'code:implement': { confinement: { mode: 'required', policy: 'host-write-denied' } } }), dispatchId: 'd1' }],
  ['anchor capability carries its policy', { capability: 'code:review', anchorCapability: 'code:implement', executorId: 'e', context: { cwd: '/c', runDir: '/r' }, cfg: cfgWith({ 'code:implement': { confinement: { mode: 'required', policy: 'host-write-denied' } } }), dispatchId: 'd1' }],
  ['own declaration beats the fallback', { capability: 'code:review', fallbackFrom: 'code:implement', executorId: 'e', context: { cwd: '/c', runDir: '/r' }, cfg: cfgWith({ 'code:review': { confinement: { mode: 'unconfined' } }, 'code:implement': { confinement: { mode: 'required', policy: 'host-write-denied' } } }), dispatchId: 'd1' }],
  ['no declaration is unconfined and omitted', { capability: 'c', executorId: 'e', context: { cwd: '/c', runDir: '/r' }, cfg: cfgWith({}), dispatchId: 'd1' }],
  ['no config at all', { capability: 'c', executorId: 'e', context: { cwd: '/c', runDir: '/r' }, dispatchId: 'd1' }],
  ['strict mode refuses an undeclared capability', { capability: 'c', executorId: 'e', context: { cwd: '/c', runDir: '/r' }, cfg: { confinement: { strict: true }, capabilities: {} }, dispatchId: 'd1' }],
  ['strict false does not refuse', { capability: 'c', executorId: 'e', context: { cwd: '/c', runDir: '/r' }, cfg: { confinement: { strict: false } }, dispatchId: 'd1' }],
  ['legacy flags ride on an omitted declaration', { capability: 'c', executorId: 'e', context: { cwd: '/c', runDir: '/r' }, invocation: { command: 'x', confinement: { privateHome: true, isolatedSession: true, ownWorktree: true } }, dispatchId: 'd1' }],
  ['legacy flags are normalised on the invocation', { capability: 'c', executorId: 'e', context: { cwd: '/c', runDir: '/r' }, invocation: { command: 'x', confinement: { privateHome: true } }, requirement: { mode: 'unconfined' }, dispatchId: 'd1' }],
  ['blind with required policy hides the host', { capability: 'c', executorId: 'e', blind: true, context: { cwd: '/c', runDir: '/r', contextRefs: ['a', 'b'] }, requirement: { mode: 'required', policyId: 'host-write-denied', policy: clone(hostWriteDenied) }, dispatchId: 'd1' }],
  ['blind keeps a stricter hostRead deny', { capability: 'c', executorId: 'e', blind: true, context: { cwd: '/c', runDir: '/r' }, requirement: { mode: 'required', policyId: 'host-write-denied', policy: clone(hostWriteDenied) }, override: { controls: { hostRead: 'deny' } }, dispatchId: 'd1' }],
  ['blind takes the executor override', { capability: 'c', executorId: 'e', blind: true, context: { cwd: '/c', runDir: '/r' }, requirement: { mode: 'required', policyId: 'host-write-denied', policy: clone(hostWriteDenied) }, cfg: { executors: { e: { confinement: { override: { controls: { hostWrite: 'deny' } } } } } }, dispatchId: 'd1' }],
  ['blind in-process is refused', { capability: 'c', executorId: 'e', blind: true, authorityScope: 'external-harness', context: { cwd: '/c', runDir: '/r' }, requirement: { mode: 'required', policyId: 'host-write-denied', policy: clone(hostWriteDenied) }, dispatchId: 'd1' }],
  ['blind without required confinement is refused', { capability: 'c', executorId: 'e', blind: true, context: { cwd: '/c', runDir: '/r' }, requirement: { mode: 'unconfined' }, dispatchId: 'd1' }],
  ['context refs are dropped when not blind', { capability: 'c', executorId: 'e', context: { cwd: '/c', runDir: '/r', contextRefs: ['a'] }, requirement: { mode: 'unconfined' }, dispatchId: 'd1' }],
  ['context fields are carried', { capability: 'c', executorId: 'e', context: { cwd: '/c', repoRoot: '/repo', runDir: '/r', fgosDir: '/f', timeoutMs: 5, idleTimeoutMs: 6, maxBuffer: 7, workId: 'w', tier: 't', model: 'm', herdrBin: 'h', transportDeadlines: { a: 1 }, closeAlways: true, dispatchBatchKey: 'k', effectiveContract: { x: 1 } }, requirement: { mode: 'unconfined' }, dispatchId: 'd1' }],
  ['invocation fields are carried', { capability: 'c', executorId: 'e', context: { cwd: '/c', runDir: '/r' }, invocation: { command: 'x', args: ['1'], argsTemplate: ['{p}'], prompt: 'p', env: { A: 'b' }, liveOutput: true, interactiveMode: { trustStore: { kind: 'claude-json' } }, promptDelivery: 'stdin', permissionMode: 'bypass', adapter: 'herdr-spawn', providerKindOnly: false, workerCommandSeam: 'seam', transport: 't' }, requirement: { mode: 'unconfined' }, dispatchId: 'd1' }],
  ['invocation http fields ride together', { capability: 'c', executorId: 'e', context: { cwd: '/c', runDir: '/r' }, invocation: { method: 'POST', url: 'https://x', headers: { a: 'b' }, body: '{}' }, requirement: { mode: 'unconfined' }, dispatchId: 'd1' }],
  ['credential store rides along', { capability: 'c', executorId: 'e', context: { cwd: '/c', runDir: '/r' }, invocation: { command: 'x', credentialStore: { use: 'codex', homeEnv: 'CODEX_HOME' } }, requirement: { mode: 'unconfined' }, dispatchId: 'd1' }],
  ['credential store malformed is refused', { capability: 'c', executorId: 'e', context: { cwd: '/c', runDir: '/r' }, invocation: { command: 'x', credentialStore: { use: 'X' } }, requirement: { mode: 'unconfined' }, dispatchId: 'd1' }],
  ['backend from the registered executor', { capability: 'c', executorId: 'e', context: { cwd: '/c', runDir: '/r' }, cfg: { executors: { e: { confinement: { backend: 'bwrap' } } } }, requirement: { mode: 'unconfined' }, dispatchId: 'd1' }],
  ['backend named by the caller wins', { capability: 'c', executorId: 'e', backendId: 'mine', context: { cwd: '/c', runDir: '/r' }, cfg: { executors: { e: { confinement: { backend: 'bwrap' } } } }, requirement: { mode: 'unconfined' }, dispatchId: 'd1' }],
  ['executor override is the request override', { capability: 'c', executorId: 'e', context: { cwd: '/c', runDir: '/r' }, cfg: { executors: { e: { confinement: { override: hostWriteOverride } } } }, requirement: { mode: 'required', policyId: 'host-write-denied', policy: clone(hostWriteDenied) }, dispatchId: 'd1' }],
  ['invocation override beats the executor override', { capability: 'c', executorId: 'e', context: { cwd: '/c', runDir: '/r' }, invocation: { command: 'x', confinement: { override: { controls: { hostRead: 'deny' } } } }, cfg: { executors: { e: { confinement: { override: hostWriteOverride } } } }, requirement: { mode: 'required', policyId: 'host-write-denied', policy: clone(hostWriteDenied) }, dispatchId: 'd1' }],
  ['resource needs and scope are carried', { capability: 'c', executorId: 'e', context: { cwd: '/c', runDir: '/r' }, resourceNeeds: [{ resource: 'x' }], authorityScope: 'external-harness', requirement: { mode: 'unconfined' }, dispatchId: 'd1' }],
  ['resource needs that are not a list are dropped', { capability: 'c', executorId: 'e', context: { cwd: '/c', runDir: '/r' }, resourceNeeds: 'x', requirement: { mode: 'unconfined' }, dispatchId: 'd1' }],
  ['launch context is validated against the run directory', { capability: 'c', executorId: 'e', context: { cwd: '/c', runDir: '/r' }, assignmentLaunchContext: assignmentContext(), requirement: { mode: 'unconfined' }, dispatchId: 'd1' }],
  ['launch context invalid is refused', { capability: 'c', executorId: 'e', context: { cwd: '/c', runDir: '/r' }, assignmentLaunchContext: withRun({ attempt: 0 }), requirement: { mode: 'unconfined' }, dispatchId: 'd1' }],
  ['attempt carries launch mode gate binds and socket', { capability: 'c', executorId: 'e', context: { cwd: '/c', runDir: '/r' }, attemptId: 'att', gateCommand: ['g', '1'], attemptBinds: [['a', 'b']], requestSocket: '/s', requirement: { mode: 'unconfined' }, dispatchId: 'd1' }],
  ['attempt keeps the named launch mode', { capability: 'c', executorId: 'e', context: { cwd: '/c', runDir: '/r' }, attemptId: 'att', launchMode: 'gated', requirement: { mode: 'unconfined' }, dispatchId: 'd1' }],
  ['attempt drops a gate that is not a list and an empty socket', { capability: 'c', executorId: 'e', context: { cwd: '/c', runDir: '/r' }, attemptId: 'att', gateCommand: 'g', attemptBinds: 'b', requestSocket: '', requirement: { mode: 'unconfined' }, dispatchId: 'd1' }],
  ['launch fields without an attempt are dropped', { capability: 'c', executorId: 'e', context: { cwd: '/c', runDir: '/r' }, launchMode: 'gated', gateCommand: ['g'], requestSocket: '/s', requirement: { mode: 'unconfined' }, dispatchId: 'd1' }],
  ['provider capacity is made ready for the invocation', { capability: 'c', executorId: 'e', context: { cwd: '/c', runDir: '/r' }, invocation: { command: 'x', credentialStore: { use: 'codex', homeEnv: 'CODEX_HOME' } }, providerCapacity: { status: 'selected', provider: 'p', credentialSources: { codex: { home: '/h' } } }, requirement: { mode: 'unconfined' }, dispatchId: 'd1' }],
  ['provider capacity without a store reads none', { capability: 'c', executorId: 'e', context: { cwd: '/c', runDir: '/r' }, providerCapacity: { status: 'selected', provider: 'p' }, requirement: { mode: 'unconfined' }, dispatchId: 'd1' }],
].map(([name, input]) => {
  const { blind, ...rest } = input;
  const call = clone(input);
  return { name, input, ...observe(() => request.buildConfinementRequest(call)) };
});

// A request with no dispatch id gets `disp_<unix millis>_<8 hex>`; the reader checks the shape, not the value.
const mintedId = request.buildConfinementRequest({ capability: 'c', executorId: 'e', context: { cwd: '/c', runDir: '/r' }, requirement: { mode: 'unconfined' } }).dispatchId;
const dispatchIdShape = { pattern: '^disp_[0-9]+_[0-9a-f]{8}$', millis: Date.now(), matches: /^disp_[0-9]+_[0-9a-f]{8}$/.test(mintedId) };

// ---------------------------------------------------------------- attestation, delivery, worktree

const attReq = (over = {}) => baseRequest({ requirement: { mode: 'required', policyId: 'host-write-denied', policy: clone(hostWriteDenied) }, ...over });
const bwrapInvocation = (args, extra = {}) => ({ command: 'bwrap', args, adapter: 'cli-spawn', ...extra });
const bind = (flag, src, dest) => [flag, src, dest];
const strictBwrap = ['--ro-bind', '/', '/', '--unshare-pid', '--unshare-ipc', '--bind', '/r/home', '/home/w', '--setenv', 'HOME', '/home/w', '--bind', '/repo', '/work', '--', 'agent'];
const attestationCases = [
  ['required request, nothing observed', { request: attReq(), phase: 'prepared' }],
  ['refused', { request: attReq(), phase: 'refused' }],
  ['refused with an explicit outcome', { request: attReq(), phase: 'refused', outcome: 'refused' }],
  ['explicit unconfined', { request: baseRequest({ requirement: { mode: 'unconfined', policyId: null, policy: null } }), phase: 'prepared' }],
  ['omitted unconfined is unknown, never enforced', { request: baseRequest({ requirement: { mode: 'unconfined', policyId: null, policy: null, omitted: true } }), phase: 'prepared' }],
  ['unconfined with a given outcome', { request: baseRequest({ requirement: { mode: 'unconfined', policyId: null, policy: null } }), phase: 'prepared', outcome: 'unconfined' }],
  ['legacy flags on the requirement', { request: baseRequest({ requirement: { mode: 'unconfined', policyId: null, policy: null, omitted: true, legacy: { controls: { home: 'private', session: 'isolated', workspace: 'own' }, grants: [{ resource: 'private-home', access: 'read-write' }] } } }), phase: 'prepared' }],
  ['legacy flags on the invocation', { request: baseRequest({ invocation: { command: 'x', confinement: { privateHome: true, isolatedSession: true, ownWorktree: true } }, requirement: { mode: 'unconfined', policyId: null, policy: null, omitted: true } }), phase: 'prepared' }],
  ['legacy grant targets the home directory', { request: baseRequest({ context: { cwd: '/c', runDir: '/r', homeDir: '/home/x' }, requirement: { mode: 'unconfined', policyId: null, policy: null, omitted: true, legacy: { controls: {}, grants: [{ resource: 'private-home', access: 'read-write' }] } } }), phase: 'prepared' }],
  ['hand-written bwrap argv in full', { request: attReq({ invocation: bwrapInvocation(strictBwrap), context: { cwd: '/c', repoRoot: '/repo', runDir: '/r/run' } }), phase: 'prepared' }],
  ['bwrap argv with joined bind strings', { request: attReq({ invocation: bwrapInvocation(['--ro-bind / /', '--unshare-pid', '--bind /a /b', '--', 'x']), context: { cwd: '/c', runDir: '/r/run' } }), phase: 'prepared' }],
  ['bwrap argv with unshare-all', { request: attReq({ invocation: bwrapInvocation(['--ro-bind', '/', '/', '--unshare-all', '--', 'x']), context: { cwd: '/c', runDir: '/r/run' } }), phase: 'prepared' }],
  ['bwrap argv that rebinds the root writable', { request: attReq({ invocation: bwrapInvocation(['--ro-bind', '/', '/', '--bind', '/', '/', '--unshare-pid', '--', 'x']), context: { cwd: '/c', runDir: '/r/run' } }), phase: 'prepared' }],
  ['bwrap argv with an assignments bind', { request: attReq({ invocation: bwrapInvocation(['--ro-bind', '/', '/', '--unshare-pid', '--bind', '/h/.fgos/assignments', '/h/.fgos/assignments', '--bind', '/x', '/y/data', '--', 'x']), context: { cwd: '/c', runDir: '/r/run' } }), phase: 'prepared' }],
  ['bwrap argv without the root read-only', { request: attReq({ invocation: bwrapInvocation(['--unshare-pid', '--', 'x']), context: { cwd: '/c', runDir: '/r/run' } }), phase: 'prepared' }],
  ['bwrap named only by the executor', { request: attReq({ executorId: 'bwrap-exec', invocation: { command: 'x', args: ['y'] } }), phase: 'prepared' }],
  ['bwrap named only by an argument', { request: attReq({ invocation: { command: 'x', args: ['bwrap'] } }), phase: 'prepared' }],
  ['bwrap argv with an own workspace and private home', { request: attReq({ invocation: bwrapInvocation(['--ro-bind', '/', '/', '--unshare-pid', '--unshare-ipc', '--setenv', 'HOME', '/home/w', '--bind', '/priv', '/home/w', '--bind', '/repo', '/work', '--', 'x']), context: { cwd: '/c', repoRoot: '/repo', runDir: '/r/run' } }), phase: 'prepared' }],
  ['bwrap argv with legacy controls expecting more', { request: attReq({ invocation: bwrapInvocation(['--unshare-pid', '--', 'x'], { confinement: { privateHome: true, isolatedSession: true, ownWorktree: true } }), context: { cwd: '/c', runDir: '/r/run' } }), phase: 'prepared' }],
  ['bwrap argv that is not strings', { request: attReq({ invocation: bwrapInvocation(['--ro-bind', 3, '/', '--unshare-pid']), context: { cwd: '/c', runDir: '/r/run' } }), phase: 'prepared' }],
  ['herdr spawn', { request: attReq({ invocation: { command: 'herdr', args: [], adapter: 'herdr-spawn', confinement: { isolatedSession: true } } }), phase: 'prepared' }],
  ['herdr spawn with a verified bwrap', { request: attReq({ invocation: bwrapInvocation(strictBwrap, { adapter: 'herdr-spawn', confinement: { isolatedSession: true } }), context: { cwd: '/c', repoRoot: '/repo', runDir: '/r/run' } }), phase: 'prepared' }],
  ['driver claims all satisfied', { request: attReq(), phase: 'prepared', outcome: 'unknown', driverClaims: { 'control:hostWrite': 'satisfied', 'control:process': 'satisfied', 'control:session': 'satisfied', 'control:home': 'satisfied', 'control:workspace': 'satisfied', 'control:hostRead': 'satisfied', 'control:networkEgress': 'satisfied' } }],
  ['driver claims partly satisfied', { request: attReq(), phase: 'prepared', outcome: 'unknown', driverClaims: { 'control:hostWrite': 'satisfied', 'control:process': 'unsatisfied', 'control:home': 'unverified' } }],
  ['driver claims for a blind request', { request: attReq({ override: { controls: { hostRead: 'blind' } } }), phase: 'prepared', outcome: 'unknown', driverClaims: { 'control:hostWrite': 'satisfied', 'control:hostRead': 'satisfied' } }],
  ['driver claims that leave a blind request unsatisfied', { request: attReq({ override: { controls: { hostRead: 'blind' } } }), phase: 'prepared', outcome: 'unknown', driverClaims: { 'control:hostWrite': 'satisfied', 'control:hostRead': 'unsatisfied' } }],
  ['override rides along', { request: attReq({ override: hostWriteOverride }), phase: 'refused' }],
  ['permission mode is recorded', { request: attReq({ invocation: { command: 'x', permissionMode: 'bypass' } }), phase: 'refused' }],
  ['run output grant is not repeated', { request: attReq({ invocation: bwrapInvocation(['--ro-bind', '/', '/', '--unshare-pid', '--', 'x']), context: { cwd: '/c', runDir: '/r/run' } }), phase: 'prepared' }],
  ['run output grant targets the run directory', { request: attReq({ invocation: bwrapInvocation(['--ro-bind', '/', '/', '--unshare-pid', '--', 'x']), context: { cwd: '/c' } }), phase: 'prepared' }],
].map(([name, input]) => ({ name, input, ...observe(() => authority.buildConfinementAttestation(clone(input))) }));

const deliveryCases = [];
for (const kind of [undefined, 'assignment', 'session']) {
  for (const mode of ['required', 'unconfined', 'preferred']) {
    for (const hostWrite of ['deny', 'allow', undefined]) {
      for (const backendId of [undefined, null, 'bwrap', 'other']) {
        const policy = hostWrite === undefined ? null : { controls: { hostWrite } };
        const req = {
          ...(kind ? { assignmentLaunchContext: { kind } } : {}),
          requirement: { mode, policy },
          ...(backendId !== undefined ? { backendId } : {}),
        };
        deliveryCases.push({ name: `${kind ?? 'no context'} ${mode} hostWrite ${hostWrite ?? 'unset'} backend ${backendId === undefined ? 'absent' : backendId}`, request: req, ok: authority.controlDeliveryOf(clone(req)) });
      }
    }
  }
}

const worktreeCases = [];
for (const [cwd, repoRoot] of [['/repo', '/repo'], ['/repo/', '/repo'], ['/repo/sub/..', '/repo'], ['/repo/wt', '/repo'], ['/repo', undefined], [undefined, '/repo']]) {
  for (const ownWorktree of [true, false]) {
    for (const [label, requirement, kind, backendId] of [
      ['required deny session', { mode: 'required', policy: { controls: { hostWrite: 'deny' } } }, 'session', undefined],
      ['required deny assignment', { mode: 'required', policy: { controls: { hostWrite: 'deny' } } }, 'assignment', undefined],
      ['required allow session', { mode: 'required', policy: { controls: { hostWrite: 'allow' } } }, 'session', undefined],
      ['unconfined session', { mode: 'unconfined', policy: null }, 'session', undefined],
      ['required deny session on a named backend', { mode: 'required', policy: { controls: { hostWrite: 'deny' } } }, 'session', 'x'],
    ]) {
      const req = { context: { ...(cwd !== undefined ? { cwd } : {}), ...(repoRoot !== undefined ? { repoRoot } : {}) }, requirement, assignmentLaunchContext: { kind }, ...(backendId ? { backendId } : {}) };
      worktreeCases.push({ name: `cwd ${cwd} repoRoot ${repoRoot} own ${ownWorktree} ${label}`, request: req, hasOwnWorktree: ownWorktree, ...observe(() => authority.ownWorktreeUnavailable(clone(req), ownWorktree)) });
    }
  }
}

// ---------------------------------------------------------------- the seat's session folder

const finalizationFile = (over = {}) => ({ resources: [{ resourceId: 'private-home', pathRef: '$ROOT/home', sessionDir: '.codex/sessions' }], ...over });
const sessionDirCases = [
  ['a kept transcript wins', { 'protected/session/a.jsonl': 'x', 'protected/confinement-finalization/cmd1.json': finalizationFile() }, 'cmd1'],
  ['the private home while the run settles', { 'protected/confinement-finalization/cmd1.json': finalizationFile() }, 'cmd1'],
  ['an empty kept folder falls through to the home', { 'protected/session/.keep': null, 'protected/confinement-finalization/cmd1.json': finalizationFile() }, 'cmd1'],
  ['no launch command id', { 'protected/confinement-finalization/cmd1.json': finalizationFile() }, undefined],
  ['no descriptor', {}, 'cmd1'],
  ['descriptor is not JSON', { 'protected/confinement-finalization/cmd1.json': 'nope' }, 'cmd1'],
  ['descriptor names no private home', { 'protected/confinement-finalization/cmd1.json': { resources: [{ resourceId: 'run-output', pathRef: '$ROOT/x', sessionDir: 's' }] } }, 'cmd1'],
  ['home without a session directory', { 'protected/confinement-finalization/cmd1.json': { resources: [{ resourceId: 'private-home', pathRef: '$ROOT/home' }] } }, 'cmd1'],
  ['home with a numeric session directory', { 'protected/confinement-finalization/cmd1.json': { resources: [{ resourceId: 'private-home', pathRef: '$ROOT/home', sessionDir: 4 }] } }, 'cmd1'],
  ['home named by path instead of pathRef', { 'protected/confinement-finalization/cmd1.json': { resources: [{ resourceId: 'private-home', path: '$ROOT/home2', sessionDir: 's' }] } }, 'cmd1'],
  ['descriptor without resources', { 'protected/confinement-finalization/cmd1.json': {} }, 'cmd1'],
  ['the first private home is the one', { 'protected/confinement-finalization/cmd1.json': { resources: [{ resourceId: 'private-home', pathRef: '$ROOT/h1', sessionDir: 'a' }, { resourceId: 'private-home', pathRef: '$ROOT/h2', sessionDir: 'b' }] } }, 'cmd1'],
].map(([name, files, launchCommandId]) => {
  const root = fixtureRoot('cr-seat-');
  try {
    const resolved = {};
    for (const [rel, content] of Object.entries(files)) resolved[rel] = content === null ? '' : unscrub(content, root);
    writeFiles(root, Object.fromEntries(Object.entries(resolved).map(([rel, content]) => [rel, content])));
    return { name, files, launchCommandId: launchCommandId ?? null, ...scrub(observe(() => authority.seatSessionDir(root, launchCommandId)), root) };
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------- the launch pipeline

// A driver the recorder controls: `fake.assess` and `fake.prepare` are data in the case.
let activeFake = null;
registry.registerBackendDriver({
  type: 'container',
  version: 'fake-1',
  validateConfig() {},
  assess(req, instance) {
    activeFake.calls.push({ step: 'assess', request: clone(req), instance: clone(instance) });
    return clone(activeFake.assess);
  },
  async prepare(plan, req, instance) {
    activeFake.calls.push({ step: 'prepare', plan: clone(plan), request: clone(req), instance: clone(instance) });
    const prepared = clone(activeFake.prepare);
    if (activeFake.cleanupCalls !== undefined) prepared.cleanup = async () => { activeFake.cleanupCalls += 1; };
    return prepared;
  },
});

const WORKER_ENV = { PATH: '/usr/bin:/bin', HOME: '/home/seat', LANG: 'C.UTF-8', TERM: 'xterm', USER: 'seat', FGOS_CASE_ID: 'case-1', GITHUB_TOKEN: 'secret', CLAUDE_CODE_OAUTH_TOKEN: 'secret2', OPENAI_API_KEY: 'k' };
const launchRequest = (over = {}) => ({
  contract: 'confinement-request.v1',
  dispatchId: 'disp_9',
  capability: 'code:implement',
  executorId: 'exec-a',
  invocation: { command: 'agent', args: ['--go', 'now'], adapter: 'cli-spawn', env: {} },
  context: { cwd: '$ROOT/wt', repoRoot: '$ROOT/repo', runDir: '$ROOT/run' },
  requirement: { mode: 'unconfined', policyId: null, policy: null },
  attemptId: 'att-1',
  assignmentLaunchContext: assignmentContext(),
  ...over,
});
const requiredRequest = (over = {}) => launchRequest({ requirement: { mode: 'required', policyId: 'host-write-denied', policy: clone(hostWriteDenied) }, backendId: 'fake', ...over });
const fakeInstance = { fake: { type: 'container', runtime: 'podman', image: 'img' } };
const registryDoc = (instances = fakeInstance) => ({ contract: 'confinement-backend-registry.v1', confinementBackends: instances });
const okCoverage = { 'control:hostWrite': 'satisfied', 'control:hostRead': 'satisfied', 'control:networkEgress': 'satisfied', 'control:process': 'satisfied' };
const okAssess = (over = {}) => ({ coverage: clone(okCoverage), resources: [], readiness: {}, mismatches: [], ...over });
const tempResource = { resource: 'private-home', access: 'read-write', allocation: 'temporary', hostTarget: '$ROOT/priv/home', executionTarget: { path: '/home/w' } };

const pipelineCases = [];
function pipelineCase(name, spec) {
  pipelineCases.push({ name, processEnv: WORKER_ENV, registry: null, fake: null, files: {}, entry: 'prepare', ...spec });
}
// success, unconfined: the env a worker is launched with, per dispatch depth
pipelineCase('unconfined launch at depth zero', { request: launchRequest() });
pipelineCase('unconfined launch at depth one', { request: launchRequest(), processEnv: { ...WORKER_ENV, FGOS_DISPATCH_DEPTH: '1' } });
pipelineCase('unconfined launch at depth two', { request: launchRequest(), processEnv: { ...WORKER_ENV, FGOS_DISPATCH_DEPTH: '2' } });
pipelineCase('unconfined launch at the depth cap', { request: launchRequest(), processEnv: { ...WORKER_ENV, FGOS_DISPATCH_DEPTH: '3' } });
pipelineCase('unconfined launch at a fractional depth', { request: launchRequest(), processEnv: { ...WORKER_ENV, FGOS_DISPATCH_DEPTH: '1.5' } });
pipelineCase('a negative depth reads as zero', { request: launchRequest(), processEnv: { ...WORKER_ENV, FGOS_DISPATCH_DEPTH: '-4' } });
pipelineCase('a depth that is not a number reads as zero', { request: launchRequest(), processEnv: { ...WORKER_ENV, FGOS_DISPATCH_DEPTH: 'deep' } });
pipelineCase('the controller depth never leaks into the allowlist', { request: launchRequest(), processEnv: { ...WORKER_ENV, FGOS_DISPATCH_DEPTH: '1', FGOS_CASE_RESERVATION: 'res' } });
pipelineCase('executor env is expanded from the process env', { request: launchRequest({ invocation: { command: 'agent', args: [], adapter: 'cli-spawn', env: { A: 'x-${HOME}-y', B: '${MISSING}', C: 7, D: 'plain' } } }) });
pipelineCase('executor env overrides an allowlisted name', { request: launchRequest({ invocation: { command: 'agent', args: [], adapter: 'cli-spawn', env: { PATH: '/opt/bin', FGOS_DISPATCH_DEPTH: '99' } } }) });
pipelineCase('the state root pin is always the process pin', { request: launchRequest(), processEnv: { ...WORKER_ENV, FGOS_STATE_ROOT: '$ROOT/state-other' } });
pipelineCase('the invocation command and args are the worker', { request: launchRequest({ invocation: { command: 'codex', args: ['exec', '--json'], adapter: 'herdr-spawn', env: {} } }) });
pipelineCase('the invocation timeouts and buffer are carried', { request: launchRequest({ context: { cwd: '$ROOT/wt', repoRoot: '$ROOT/repo', runDir: '$ROOT/run', timeoutMs: 1234, idleTimeoutMs: 56, maxBuffer: 789 } }) });
pipelineCase('a published prepared invocation is kept on a resume', { request: launchRequest(), files: { 'run/protected/prepared-invocation/cmd1.json': { contract: 'authority-prepared-invocation.v1', digest: 'sha256:kept', workerInvocation: { args: ['--kept'] } } } });
pipelineCase('a session launch context', { request: launchRequest({ assignmentLaunchContext: sessionContext() }) });
// refusals before anything is prepared
pipelineCase('no launch context', { request: launchRequest({ assignmentLaunchContext: undefined }) });
pipelineCase('launch context invalid', { request: launchRequest({ assignmentLaunchContext: withRun({ attempt: 0 }) }) });
pipelineCase('launch context disagrees with the run directory', { request: launchRequest(), files: { 'run/run.json': runJson({ runId: 'other' }) } });
pipelineCase('no attempt id', { request: launchRequest({ attemptId: undefined }) });
pipelineCase('blank attempt id', { request: launchRequest({ attemptId: '' }) });
pipelineCase('request that is not a request', { request: { contract: 'x' } });
pipelineCase('preferred mode is refused', { request: launchRequest({ requirement: { mode: 'preferred', policyId: 'host-write-denied', policy: clone(hostWriteDenied) } }) });
pipelineCase('bypass without any confinement', { request: launchRequest({ invocation: { command: 'agent', args: [], adapter: 'cli-spawn', permissionMode: 'bypass' }, context: { cwd: '$ROOT/wt', repoRoot: '$ROOT/repo', runDir: '$ROOT/run', workId: 'w-7' } }) });
pipelineCase('bypass with the legacy flags only', { request: launchRequest({ invocation: { command: 'agent', args: [], adapter: 'cli-spawn', permissionMode: 'bypass', confinement: { privateHome: true, isolatedSession: true, ownWorktree: true } } }) });
pipelineCase('bypass half paired', { request: launchRequest({ invocation: { command: 'agent', args: [], adapter: 'cli-spawn', permissionMode: 'bypass', confinement: { privateHome: true } } }) });
pipelineCase('own worktree declared but running in the repo root', { request: launchRequest({ invocation: { command: 'agent', args: [], adapter: 'cli-spawn', confinement: { ownWorktree: true } }, context: { cwd: '$ROOT/repo', repoRoot: '$ROOT/repo', runDir: '$ROOT/run' } }) });
pipelineCase('own worktree declared in a worktree of its own', { request: launchRequest({ invocation: { command: 'agent', args: [], adapter: 'cli-spawn', confinement: { ownWorktree: true } } }) });
pipelineCase('own worktree in the root is fine for a head under a denying backend', {
  request: requiredRequest({ invocation: { command: 'agent', args: [], adapter: 'cli-spawn', confinement: { ownWorktree: true } }, context: { cwd: '$ROOT/repo', repoRoot: '$ROOT/repo', runDir: '$ROOT/run' }, assignmentLaunchContext: sessionContext() }),
  registry: registryDoc(), fake: { assess: okAssess(), prepare: { invocation: { command: 'agent', args: [] }, claims: clone(okCoverage) } },
});
// required launches through a recorded fake driver
pipelineCase('backend missing from the machine registry', { request: requiredRequest(), registry: registryDoc({}) });
pipelineCase('backend disabled in the machine registry', { request: requiredRequest(), registry: registryDoc({ fake: { ...fakeInstance.fake, enabled: false } }) });
pipelineCase('backend with no driver of its type', { request: requiredRequest({ backendId: 'far' }), registry: registryDoc({ far: { type: 'remote', endpoint: 'https://x', credentialRef: 'r' } }) });
pipelineCase('no backend named falls back to bwrap for required mode', { request: requiredRequest({ backendId: undefined }), registry: registryDoc({}) });
pipelineCase('assessment refuses with a mismatch', { request: requiredRequest(), registry: registryDoc(), fake: { assess: okAssess({ mismatches: [{ code: 'confinement-unsupported', detail: 'nothing to enforce with' }] }), prepare: null } });
pipelineCase('assessment refuses without a mismatch code', { request: requiredRequest(), registry: registryDoc(), fake: { assess: okAssess({ mismatches: [{ detail: 'no code' }] }), prepare: null } });
pipelineCase('required coverage unverified refuses', { request: requiredRequest(), registry: registryDoc(), fake: { assess: okAssess({ coverage: { 'control:hostWrite': 'unverified', 'control:hostRead': 'satisfied' } }), prepare: null } });
pipelineCase('required coverage missing refuses as unknown', { request: requiredRequest(), registry: registryDoc(), fake: { assess: okAssess({ coverage: {} }), prepare: null } });
pipelineCase('a non-optional grant needs satisfied coverage', { request: requiredRequest({ requirement: { mode: 'required', policyId: 'p', policy: { ...clone(hostWriteDenied), grants: [{ resource: 'run-output', access: 'write', scope: 'dispatch', optional: false }, { resource: 'executor-credentials', access: 'read', scope: 'dispatch' }] } } }), registry: registryDoc(), fake: { assess: okAssess(), prepare: null } });
pipelineCase('the driver sees the credential scan roots', { request: requiredRequest(), registry: registryDoc(), fake: { assess: okAssess({ mismatches: [{ code: 'confinement-unsupported', detail: 'x' }] }), prepare: null }, confinementRoots: ['$ROOT/priv', '/tmp/fgos-homes'] });
pipelineCase('a resource inside the attestation store is refused', { request: requiredRequest(), registry: registryDoc(), fake: { assess: okAssess({ resources: [{ resource: 'private-home', access: 'read-write', allocation: 'temporary', hostTarget: '$ROOT/state/attestations/x', executionTarget: { path: '/home/w' } }] }), prepare: null } });
pipelineCase('the probe of a backend with no probe profile fails', { request: requiredRequest(), registry: registryDoc(), fake: { assess: okAssess({ resources: [tempResource] }), prepare: null } });

// ---- the recorded runs

// The worker env carries the state root, so a digest over it holds the fixture path: the launch cases run under one fixed
// root, which a reader re-creates at the same path.
const PIPELINE_ROOT = '/tmp/fgos-request-vectors-root';
async function recordPipeline(spec) {
  fs.rmSync(PIPELINE_ROOT, { recursive: true, force: true });
  fs.mkdirSync(PIPELINE_ROOT, { recursive: true });
  const root = fs.realpathSync(PIPELINE_ROOT);
  const savedEnv = { ...process.env };
  // `process.env = …` does not replace what the modules read; the live environment is edited in place and put back.
  const setEnv = (env) => { for (const key of Object.keys(process.env)) delete process.env[key]; Object.assign(process.env, env); };
  try {
    const sub = (value) => (value === undefined ? undefined : unscrub(value, root));
    fs.mkdirSync(path.join(root, 'run'), { recursive: true });
    const files = {};
    for (const [rel, content] of Object.entries(spec.files ?? {})) files[rel] = sub(content);
    writeFiles(root, files);
    const registryPath = path.join(root, 'registry.json');
    if (spec.registry) fs.writeFileSync(registryPath, JSON.stringify(sub(spec.registry)));
    const processEnv = { ...sub(spec.processEnv), FGOS_STATE_ROOT: sub(spec.processEnv).FGOS_STATE_ROOT ?? path.join(root, 'state'), FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH: registryPath, HOME: sub(spec.processEnv).HOME };
    setEnv(processEnv);
    const request = sub(spec.request);
    activeFake = spec.fake ? { ...clone(sub(spec.fake)), calls: [] } : { assess: okAssess(), prepare: null, calls: [] };
    let outcome;
    const run = async () => {
      try {
        const result = await authority.prepareConfinementForLaunch(request);
        return { ok: { attempt: result.attempt, preparedInvocation: result.preparedInvocation, preparedInvocationDigest: result.preparedInvocationDigest, providerCapacity: result.providerCapacity, finalizationPath: result.finalizationPath, finalizationDescriptor: result.finalizationDescriptor, backendPlan: result.backendPlan } };
      } catch (err) {
        return { error: err.message, ...(err.code ? { code: err.code } : {}), ...(err.errorClass ? { errorClass: err.errorClass } : {}), ...(err.data ? { data: clone(err.data) } : {}) };
      }
    };
    {
      const answer = await run();
      outcome = answer;
      setEnv(savedEnv);
      const stateDir = path.join(root, 'state');
      const record = {
        name: spec.name,
        processEnv: spec.processEnv,
        request: spec.request,
        registry: spec.registry,
        fake: spec.fake,
        files: spec.files ?? {},
        confinementRoots: spec.confinementRoots ?? null,
        ...scrubClock(scrub(outcome, root)),
        driverCalls: scrub(activeFake.calls, root),
        tree: scrubClock(scrub(tree(root).filter((entry) => !entry.path.startsWith('registry.json') && !(spec.files && Object.keys(spec.files).includes(entry.path))), root)),
      };
      void stateDir;
      return record;
    }
  } finally {
    setEnv(savedEnv);
  }
}

const recorded = [];
for (const spec of pipelineCases) recorded.push(await recordPipeline(spec));
fs.rmSync(PIPELINE_ROOT, { recursive: true, force: true });

// ---------------------------------------------------------------- write

fs.mkdirSync(outDir, { recursive: true });
const write = (file, value) => fs.writeFileSync(path.join(outDir, file), `${JSON.stringify(value, null, 2)}\n`);
const requestVectors = {
  contract: 'confinement-request-vectors.v1',
  note: 'A case holds its input and what the Node original answered: `ok`, or `error` with `code` and `errorClass` where one was set. `after` is the document a validator leaves behind (a policy is canonicalised in place).',
  assignmentLaunchContext: launchContextCases,
  launchContextCrossCheck: crossCases,
  requestShape: requestShapeCases,
  build: buildCases,
  dispatchIdShape,
};
const authorityVectors = {
  contract: 'confinement-authority-vectors.v1',
  note: 'Paths under a case fixture are written with $ROOT; a clock reading is <now>. A driver is data: `fake.assess` and `fake.prepare` are what the recorded fake driver answered, `driverCalls` what it was asked.',
  attestation: attestationCases,
  controlDelivery: deliveryCases,
  ownWorktreeUnavailable: worktreeCases,
  seatSessionDir: sessionDirCases,
  launch: recorded,
};
write('request.v1.json', requestVectors);
write('authority.v1.json', authorityVectors);
const count = (v) => Object.values(v).reduce((n, x) => n + (Array.isArray(x) ? x.length : 0), 0);
console.log(`request.v1.json: ${count(requestVectors)} cases; authority.v1.json: ${count(authorityVectors)} cases -> ${outDir}`);
