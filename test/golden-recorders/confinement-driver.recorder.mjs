// Records the golden vectors of the Rust confinement driver (packages/execution/engine/src/confinement/driver/) by
// running the Node modules it ports: drivers/bwrap.mjs, backend-registry.mjs and attestation-store.mjs.
// Run: node test/golden-recorders/confinement-driver.recorder.mjs
// Each section writes one file under packages/execution/contracts/confinement-driver/.
// Paths are fixed absolute strings that need not exist, so a vector is the same on every machine.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const outDir = path.join(root, 'packages', 'execution', 'contracts', 'confinement-driver');
fs.mkdirSync(outDir, { recursive: true });

// The native door and the process-identity leaf need an installed addon a checkout does not have. The recorder runs
// the real modules and swaps those two leaves for what they do (RFC 8785 text of a JSON value, a durable replace,
// "held" liveness) through a resolve hook, so the vectors do not depend on a built addon.
{
  const door = [
    'import fs from "node:fs"; import path from "node:path";',
    'const sort = (v) => Array.isArray(v) ? v.map(sort) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sort(v[k])])) : v;',
    'export const canonicalJson = (value) => JSON.stringify(sort(JSON.parse(JSON.stringify(value))));',
    'export function replaceDurably(dir, name, bytes, mode) { fs.mkdirSync(dir, { recursive: true }); const tmp = path.join(dir, `.tmp-${process.pid}-${Math.random()}`); fs.writeFileSync(tmp, bytes, { mode }); fs.renameSync(tmp, path.join(dir, name)); }',
    'export const installOnce = replaceDurably; export const nativeDoor = () => { throw new Error("no addon in the recorder"); };',
    'export const nativeHelperExe = () => null; export const nativeError = (e) => ({ cause: e.message, stderr: [] }); export const loadNativeAddon = () => { throw new Error("no addon in the recorder"); };',
    'export const abiShortfall = () => null; export const combinedAbiMatches = () => true; export const fromDoorJson = (t) => JSON.parse(t);',
  ].join('\n');
  const identity = 'export const selfRecord = () => ({ host: "recorder", pid: 1, startTime: "1" }); export const resolveHolderLiveness = () => "held"; export const judge = () => "alive"; export const observe = () => ({ kind: "absent" }); export const scan = () => []; export const signalByIdentity = () => false;';
  const swap = (url) => JSON.stringify('data:text/javascript,' + encodeURIComponent(url));
  const hooks = `export async function resolve(spec, ctx, next) { const r = await next(spec, ctx); if (r.url.endsWith("/src/native/door.mjs")) return { url: ${swap(door)}, shortCircuit: true }; if (r.url.endsWith("/src/native/process-identity.mjs")) return { url: ${swap(identity)}, shortCircuit: true }; return r; }`;
  (await import('node:module')).register(`data:text/javascript,${encodeURIComponent(hooks)}`);
}
const bwrap = await import('../../src/runner/dispatch/confinement/drivers/bwrap.mjs');
const registry = await import('../../src/runner/dispatch/confinement/backend-registry.mjs');
const attest = await import('../../src/runner/dispatch/confinement/attestation-store.mjs');

export function write(name, body) {
  fs.writeFileSync(path.join(outDir, name), `${JSON.stringify(body, null, 2)}\n`);
}

const attempt = (call) => {
  try {
    return { ok: call() };
  } catch (err) {
    return { error: err.message, ...(err.code ? { code: err.code } : {}) };
  }
};
const scratch = (prefix) => fs.mkdtempSync(path.join(os.tmpdir(), prefix));

// SECTION: registry
{
  const ok = { type: 'bwrap', enabled: true, executable: '/usr/bin/bwrap', tempRoot: '/srv/t', privateHomeRoot: '/srv/h' };
  const instanceCases = [
    ['bwrap-full', 'a', ok],
    ['bwrap-minimal', 'a', { type: 'bwrap' }],
    ['bwrap-unknown-key', 'a', { type: 'bwrap', shell: 'x' }],
    ['bwrap-blank-executable', 'a', { type: 'bwrap', executable: '  ' }],
    ['bwrap-enabled-not-bool', 'a', { type: 'bwrap', enabled: 'yes' }],
    ['bwrap-blank-temp-root', 'a', { type: 'bwrap', tempRoot: '' }],
    ['bwrap-numeric-home-root', 'a', { type: 'bwrap', privateHomeRoot: 3 }],
    ['container-ok', 'c', { type: 'container', runtime: 'podman', image: 'img', pullPolicy: 'never' }],
    ['container-bad-runtime', 'c', { type: 'container', runtime: 'lxc', image: 'img' }],
    ['container-missing-image', 'c', { type: 'container', runtime: 'docker' }],
    ['container-bad-pull', 'c', { type: 'container', runtime: 'docker', image: 'i', pullPolicy: 'sometimes' }],
    ['container-unknown-key', 'c', { type: 'container', runtime: 'docker', image: 'i', mount: 1 }],
    ['remote-ok', 'r', { type: 'remote', endpoint: 'https://x', credentialRef: 'ref' }],
    ['remote-missing-endpoint', 'r', { type: 'remote', credentialRef: 'ref' }],
    ['remote-missing-credential', 'r', { type: 'remote', endpoint: 'https://x' }],
    ['remote-unknown-key', 'r', { type: 'remote', endpoint: 'e', credentialRef: 'c', token: 't' }],
    ['unknown-type', 'u', { type: 'vm' }],
    ['not-an-object', 'u', ['bwrap']],
    ['null-config', 'u', null],
  ].map(([name, id, config]) => ({ name, id, config, out: attempt(() => { registry.validateBackendInstanceConfigShape(id, config); return true; }) }));

  const docCases = [
    ['valid', { contract: 'confinement-backend-registry.v1', confinementBackends: { bwrap: { type: 'bwrap' } } }],
    ['empty-backends', { contract: 'confinement-backend-registry.v1', confinementBackends: {} }],
    ['wrong-contract', { contract: 'x', confinementBackends: {} }],
    ['unknown-doc-key', { contract: 'confinement-backend-registry.v1', confinementBackends: {}, extra: 1 }],
    ['backends-array', { contract: 'confinement-backend-registry.v1', confinementBackends: [] }],
    ['backends-missing', { contract: 'confinement-backend-registry.v1' }],
    ['blank-instance-id', { contract: 'confinement-backend-registry.v1', confinementBackends: { ' ': { type: 'bwrap' } } }],
    ['bad-instance', { contract: 'confinement-backend-registry.v1', confinementBackends: { b: { type: 'bwrap', nope: 1 } } }],
    ['array-doc', []],
  ].map(([name, doc]) => ({ name, doc, out: attempt(() => { registry.validateBackendRegistryShape(doc, 'doc'); return true; }) }));

  const overrideCases = [
    ['none', {}],
    ['null', null],
    ['top-level', { confinementBackends: {} }],
    ['under-runner', { runner: { confinementBackends: {} } }],
    ['unrelated', { runner: { other: 1 } }],
  ].map(([name, cfg]) => ({ name, cfg, out: attempt(() => { registry.rejectProjectBackendOverride(cfg, 'project'); return true; }) }));

  const snapDoc = {
    contract: 'confinement-backend-registry.v1',
    confinementBackends: { on: { type: 'bwrap', executable: '/opt/bwrap' }, off: { type: 'bwrap', enabled: false }, imp: { type: 'bwrap', enabled: true } },
  };
  const snap = registry.createBackendRegistrySnapshot(snapDoc);
  const resolves = ['on', 'off', 'imp', 'missing', '', ' ', 7].map((id) => ({ id, out: snap.resolve(id) }));

  const dir = scratch('cd-registry-');
  const load = [];
  const loadFile = (name, text) => {
    const file = path.join(dir, `${name}.json`);
    if (text !== null) fs.writeFileSync(file, text);
    const out = attempt(() => registry.loadMachineBackendRegistry(file));
    if (out.error) out.error = out.error.replaceAll(dir, '<dir>').replace(/(is not valid JSON: ).*/, '$1<parse detail>');
    load.push({ name, text, out });
  };
  loadFile('absent', null);
  loadFile('valid', JSON.stringify(snapDoc));
  loadFile('not-json', '{nope');
  loadFile('wrong-shape', JSON.stringify({ contract: 'confinement-backend-registry.v1', confinementBackends: { a: { type: 'vm' } } }));

  const ensure = [];
  const ensureFile = (name, text) => {
    const file = path.join(dir, `ensure-${name}.json`);
    if (text !== null) fs.writeFileSync(file, text);
    const out = registry.ensureMachineBackendRegistryDefaults(file);
    const after = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
    ensure.push({ name, before: text, out: { ...out, path: '<file>', message: out.message.replaceAll(file, '<file>').replace(/(cannot parse machine backend registry at "<file>": ).*/, '$1<parse detail>') }, after });
  };
  ensureFile('absent', null);
  ensureFile('current', `${JSON.stringify(registry.DEFAULT_MACHINE_BACKEND_REGISTRY, null, 2)}\n`);
  ensureFile('empty-backends', JSON.stringify({ contract: 'confinement-backend-registry.v1', confinementBackends: {} }));
  ensureFile('custom-only', JSON.stringify({ contract: 'confinement-backend-registry.v1', confinementBackends: { mine: { type: 'bwrap', executable: '/x/bwrap' } } }));
  ensureFile('old-contract', JSON.stringify({ contract: 'old', confinementBackends: { mine: { type: 'bwrap' } } }));
  ensureFile('extra-key', JSON.stringify({ contract: 'confinement-backend-registry.v1', confinementBackends: { mine: { type: 'bwrap' } }, junk: 1 }));
  ensureFile('unparseable', '{nope');
  ensureFile('repair-invalid', JSON.stringify({ contract: 'confinement-backend-registry.v1', confinementBackends: { bad: { type: 'vm' } }, junk: 1 }));

  const drivers = ['bwrap', 'container', 'remote', 'vm', 7].map((t) => ({ type: t, out: attempt(() => registry.getBackendDriver(t).type) }));
  fs.rmSync(dir, { recursive: true, force: true });
  write('registry.v1.json', {
    note: 'recorded from src/runner/dispatch/confinement/backend-registry.mjs; the parse detail of invalid JSON is not pinned',
    allowedDriverTypes: registry.ALLOWED_DRIVER_TYPES,
    defaultRegistry: registry.DEFAULT_MACHINE_BACKEND_REGISTRY,
    instanceCases, docCases, overrideCases, snapDoc, resolves, load, ensure, drivers,
  });
}

// SECTION: attestation
{
  const channels = attest.REQUIRED_CHANNELS.map((name) => ({ name, state: 'x' }));
  const good = { contract: 'confinement-attestation.v1', dispatchId: 'd1', phase: 'completed', outcome: 'enforced', channels, coverage: { 'control:hostWrite': 'satisfied' }, effectiveControls: { hostWrite: 'deny' }, mismatches: [{ code: 'a', detail: 'b' }, 'plain'] };
  const variants = [
    ['good', good],
    ['not-object', []],
    ['wrong-contract', { ...good, contract: 'x' }],
    ['no-dispatch', { ...good, dispatchId: '' }],
    ['bad-phase', { ...good, phase: 'later' }],
    ['bad-outcome', { ...good, outcome: 'ok' }],
    ['channels-not-array', { ...good, channels: {} }],
    ['channel-missing', { ...good, channels: channels.filter((c) => c.name !== 'network') }],
  ].map(([name, a]) => ({ name, attestation: a, out: attempt(() => attest.validateAttestationCompleteness(a)) }));

  const res = (resource, access, hostTarget) => ({ resource, access, hostTarget });
  const isolation = [
    ['no-resources', '/srv/state/att', []],
    ['read-only-overlap', '/srv/state/att', [res('a', 'read', '/srv/state/att')]],
    ['writable-disjoint', '/srv/state/att', [res('w', 'write', '/srv/work')]],
    ['writable-same', '/srv/state/att', [res('w', 'write', '/srv/state/att')]],
    ['store-inside-writable', '/srv/state/att', [res('w', 'read-write', '/srv/state')]],
    ['writable-inside-store', '/srv/state/att', [res('w', 'write', '/srv/state/att/sub')]],
    ['sibling-prefix', '/srv/state/att', [res('w', 'write', '/srv/state/att2')]],
    ['no-host-target', '/srv/state/att', [{ resource: 'w', access: 'write' }]],
    ['execution-target-fallback', '/srv/state/att', [{ resource: 'w', access: 'write', executionTarget: { path: '/srv/state' } }]],
    ['blank-store', '', []],
  ].map(([name, store, resources]) => ({ name, store, resources, out: attempt(() => attest.verifyAttestationStoreIsolation(store, resources)) }));

  const refs = [['good', good], ['bad', { ...good, phase: 'x' }], ['no-mismatches', { ...good, mismatches: undefined }]]
    .map(([name, a]) => ({ name, attestation: a, out: attempt(() => attest.createRedactedAttestationReference(a)) }));

  const probeFp = { backend: 'bwrap', version: 1 };
  const storeDirs = [['context', { attestationStoreDir: '/srv/ctx/att' }], ['none', {}]]
    .map(([name, ctx]) => ({ name, context: ctx, dir: ctx.attestationStoreDir ? attest.resolveAttestationStoreDir(ctx) : null }));
  const dir = scratch('cd-attest-');
  const ctx = { attestationStoreDir: dir };
  const saved = attest.saveAttestationRecord(good, ctx);
  const loaded = attest.loadAttestationRecord('d1', 'completed', ctx);
  const missing = attest.loadAttestationRecord('d1', 'failed', ctx);
  const plan = attest.savePlanRecord({ dispatchId: 'd2', resources: [res('w', 'write', '/srv/work')] }, ctx);
  const planOverlap = attempt(() => attest.savePlanRecord({ dispatchId: 'd3', resources: [res('w', 'write', dir)] }, ctx));
  if (planOverlap.error) planOverlap.error = planOverlap.error.replaceAll(fs.realpathSync(dir), '<dir>');
  attest.clearProbeCache();
  const probeSaved = attest.saveProbeCacheRecord(probeFp, { passed: true, message: 'm', results: [1] }, ctx, { now: 1000 });
  const probeFile = fs.readdirSync(dir).filter((n) => n.startsWith('probe-'));
  attest.clearProbeCache();
  const probeFresh = attest.loadProbeCacheRecord(probeFp, ctx, { ttlMs: 500, now: 1400 });
  attest.clearProbeCache();
  const probeStale = attest.loadProbeCacheRecord(probeFp, ctx, { ttlMs: 500, now: 1600 });
  const probeNotPassed = attest.saveProbeCacheRecord(probeFp, { passed: false }, ctx);
  const files = fs.readdirSync(dir).filter((n) => !n.startsWith('probe-')).sort();
  fs.rmSync(dir, { recursive: true, force: true });
  write('attestation.v1.json', {
    note: 'recorded from src/runner/dispatch/confinement/attestation-store.mjs; store directories are fixed paths that need not exist',
    contract: attest.ATTESTATION_CONTRACT, refContract: attest.ATTESTATION_REF_CONTRACT, requiredChannels: attest.REQUIRED_CHANNELS,
    phases: attest.VALID_PHASES, outcomes: attest.ATTESTATION_OUTCOMES, defaultProbeTtlMs: attest.DEFAULT_PROBE_CACHE_TTL_MS,
    good, variants, isolation, refs, storeDirs,
    store: { saved: { dispatchId: saved.dispatchId, phase: saved.phase, file: path.basename(saved.path) }, loaded, missing, plan: { dispatchId: plan.dispatchId, file: path.basename(plan.path) }, planOverlap, files },
    probe: { fingerprint: probeFp, saved: probeSaved, fileCount: probeFile.length, fresh: probeFresh, stale: probeStale, notPassed: probeNotPassed },
  });
}

// SECTION: bwrap
{
  const ctl = (over = {}) => ({ hostWrite: 'deny', hostRead: 'allow', networkEgress: 'allow', process: 'host', home: 'host', session: 'shared', workspace: 'shared', ...over });
  const mkReq = (over = {}) => ({
    dispatchId: 'd1',
    requirement: { mode: 'required', policyId: 'host-write-denied', policy: { controls: ctl(), grants: [] } },
    context: { cwd: '/srv/ws', repoRoot: '/srv/ws' },
    invocation: { command: 'echo', args: ['hi'], env: {} },
    resourceNeeds: [],
    ...over,
  });
  const withPolicy = (policy, extra = {}) => mkReq({ requirement: { mode: 'required', policyId: 'host-write-denied', policy }, ...extra });
  const configCases = [
    ['minimal', { type: 'bwrap' }], ['full', { type: 'bwrap', enabled: false, executable: '/o/bwrap', tempRoot: '/t', privateHomeRoot: '/h' }],
    ['wrong-type', { type: 'x' }], ['unknown-key', { type: 'bwrap', extra: 1 }], ['blank-executable', { type: 'bwrap', executable: ' ' }],
    ['enabled-string', { type: 'bwrap', enabled: 'y' }], ['blank-temp-root', { type: 'bwrap', tempRoot: '' }], ['number-home-root', { type: 'bwrap', privateHomeRoot: 1 }],
    ['array', []], ['null', null],
  ].map(([name, config]) => ({ name, config, out: attempt(() => bwrap.validateBwrapConfig(config, 'cfg')) }));

  // The mismatches the resolver adds depend on the machine's config door; only the driver's own are pinned.
  const resolverDetail = / requires context\.| resource access must be /;
  const ownCodes = new Set(['confinement-unsupported', 'confinement-grant-invalid', 'confinement-need-unsatisfied']);
  const assessCases = [
    ['all-allow', mkReq()],
    ['preferred-mode', mkReq({ requirement: { mode: 'preferred', policyId: 'p', policy: { controls: ctl(), grants: [] } } })],
    ['unconfined-no-controls', mkReq({ requirement: { mode: 'unconfined', policyId: 'p', policy: {} } })],
    ['override-blind-only', mkReq({ override: { controls: { hostRead: 'blind' } } })],
    ['override-other', mkReq({ override: { controls: { hostRead: 'deny' } } })],
    ['override-extra-key', mkReq({ override: { controls: { hostRead: 'blind' }, grants: [] } })],
    ['host-read-deny', withPolicy({ controls: ctl({ hostRead: 'deny' }), grants: [] })],
    ['host-read-blind-policy', withPolicy({ controls: ctl({ hostRead: 'blind' }), grants: [] })],
    ['host-write-allow-required', withPolicy({ controls: ctl({ hostWrite: 'allow' }), grants: [] })],
    ['host-write-weird', withPolicy({ controls: ctl({ hostWrite: 'maybe' }), grants: [] })],
    ['network-deny', withPolicy({ controls: ctl({ networkEgress: 'deny' }), grants: [] })],
    ['process-isolated', withPolicy({ controls: ctl({ process: 'isolated' }), grants: [] })],
    ['home-private-session-isolated-workspace-own', withPolicy({ controls: ctl({ home: 'private', session: 'isolated', workspace: 'own' }), grants: [] })],
    ['home-session-workspace-unknown', withPolicy({ controls: ctl({ home: 'odd', workspace: 'odd' }), grants: [] })],
    ['control-missing', withPolicy({ controls: { hostWrite: 'deny' }, grants: [] })],
    ['control-unknown', withPolicy({ controls: ctl({ magic: 'on' }), grants: [] })],
    ['controls-array', withPolicy({ controls: [], grants: [] })],
    ['grants-run-output-private-home', withPolicy({ controls: ctl(), grants: [{ resource: 'run-output' }, { resource: 'private-home' }, { resource: 'executor-credentials', optional: true }, { resource: 'workspace-paths' }] })],
    ['grant-workspace-denied-policy', withPolicy({ controls: ctl(), grants: [{ resource: 'workspace' }, { resource: 'workspace-git-metadata' }] })],
    ['grant-workspace-write-policy', mkReq({ requirement: { mode: 'required', policyId: 'workspace-write', policy: { controls: ctl(), grants: [{ resource: 'workspace' }, { resource: 'workspace-git-metadata' }] } } })],
    ['grant-head-only-worker', withPolicy({ controls: ctl(), grants: [{ resource: 'mailbox-record' }, { resource: 'peer-sessions' }] })],
    ['grant-head-session', withPolicy({ controls: ctl(), grants: [{ resource: 'mailbox-record' }, { resource: 'peer-sessions' }] }, { assignmentLaunchContext: { kind: 'session' } })],
    ['store-without-private-home', mkReq({ invocation: { command: 'echo', args: [], env: {}, credentialStore: { use: 'codex', homeEnv: 'CODEX_HOME' } } })],
    ['required-credentials-unresolved', withPolicy({ controls: ctl(), grants: [{ resource: 'executor-credentials', optional: false }] })],
    ['need-unsatisfied', mkReq({ resourceNeeds: [{ resource: 'ghost' }] })],
  ].map(([name, request]) => {
    const out = bwrap.assessBwrap(request, { id: 'bwrap', config: { type: 'bwrap' } });
    return { name, request, out: { coverage: out.coverage, readiness: out.readiness, mismatches: out.mismatches.filter((m) => ownCodes.has(m.code) && !resolverDetail.test(m.detail)) } };
  });

  const R = (resource, hostTarget, executionTarget, over = {}) => ({ resource, access: 'read', hostTarget, executionTarget: { path: executionTarget }, ...over });
  const prepare = (name, plan, request, backend = { config: { executable: '/usr/bin/bwrap' } }) => {
    const out = attempt(() => {
      const r = bwrap.prepareBwrapSync(plan, request, backend);
      return { invocation: r.invocation, claims: r.claims, bwrapPrefix: r.bwrapPrefix ?? null, agentArgv: r.agentArgv ?? null, launchDigest: r.launchDigest ?? null, providerCapacity: r.providerCapacity ?? null, credentialWriteBack: r.credentialWriteBack ?? null };
    });
    return { name, plan, request, backend, out };
  };
  const baseInv = { command: 'agent', args: ['--go'], env: { A: '1' } };
  const baseReq = { dispatchId: 'd1', invocation: baseInv, context: { runDir: '/srv/run' }, launchMode: 'direct' };
  const plan1 = { coverage: { 'control:hostWrite': 'satisfied' }, resources: [R('workspace', '/srv/ws', '/srv/ws', { access: 'write' }), R('run-output', '/srv/out', '/srv/out', { access: 'read-write' }), R('docs', '/srv/docs', '/docs')] };
  const hidden = R('hidden-root', '/srv/fgos/assignments', '/srv/fgos/assignments', { access: 'none' });
  const own = R('own-assignment', '/srv/fgos/assignments/d1', '/srv/fgos/assignments/d1');
  const inHidden = R('outbox', '/srv/fgos/assignments/d1/out', '/srv/fgos/assignments/d1/out', { access: 'write' });
  const blindReq = { ...baseReq, requirement: { policy: { controls: { hostRead: 'blind' } } } };
  const head = { coverage: {}, resources: [R(bwrapMailbox(), '/srv/fgos/runtime/mailbox/rec', '/srv/fgos/runtime/mailbox/rec', { access: 'read-write' }), R('peer-sessions', '/run/user/1000/fgos/sessions', '/run/user/1000/fgos/sessions', { access: 'read-write', env: { CLAUDE_PEER: '/run/user/1000/fgos/sessions' } })] };
  function bwrapMailbox() { return 'mailbox-record'; }
  const attemptReq = { ...baseReq, attemptId: 'a1', gateCommand: ['/tmp/gate/bin/gate', '--flag'], attemptBinds: ['/srv/run/a1/exit.json', '/srv/run/a1/out.txt'], launchMode: 'direct', context: { runDir: '/tmp/run/r1' } };
  const savedXdg = process.env.XDG_RUNTIME_DIR;
  process.env.XDG_RUNTIME_DIR = '/run/user/1000';
  const prepareCases = [
    prepare('direct-plain', plan1, baseReq),
    prepare('terminal-die-with-parent', plan1, { ...baseReq, launchMode: 'terminal' }),
    prepare('custom-executable', plan1, baseReq, { config: { executable: '/opt/bwrap' } }),
    prepare('default-executable', plan1, baseReq, undefined),
    prepare('home-env-wins', { coverage: {}, resources: [R('private-home', '/srv/home', '/home/w', { access: 'none' })] }, { ...baseReq, invocation: { ...baseInv, env: { CODEX_HOME: '/real' }, credentialStore: { use: 'codex', homeEnv: 'CODEX_HOME' } } }),
    prepare('blind-masks-in-order', { coverage: {}, resources: [plan1.resources[0], hidden, own, inHidden] }, blindReq),
    prepare('blind-without-own-assignment', { coverage: {}, resources: [hidden] }, blindReq),
    prepare('head-keeps-host-pid-space', head, baseReq),
    prepare('attempt-binds-gate-and-run-dir', plan1, attemptReq),
    prepare('attempt-digest-with-gate', plan1, attemptReq),
    prepare('attempt-no-gate-command', plan1, { ...attemptReq, gateCommand: undefined }),
    prepare('attempt-gate-on-path', plan1, { ...attemptReq, gateCommand: ['gate'] }),
    prepare('terminal-go-socket', plan1, { ...attemptReq, launchMode: 'terminal', gateCommand: ['/usr/bin/gate', '--go-socket', '/run/user/1000/fgos/go.sock'] }),
    prepare('terminal-go-socket-outside-runtime-dir', plan1, { ...attemptReq, launchMode: 'terminal', gateCommand: ['/usr/bin/gate', '--go-socket', '/tmp/evil.sock'] }),
    prepare('terminal-request-socket', plan1, { ...attemptReq, launchMode: 'terminal', gateCommand: ['/usr/bin/gate'], requestSocket: '/run/user/1000/fgos/req.sock' }),
    prepare('terminal-request-socket-outside', plan1, { ...attemptReq, launchMode: 'terminal', gateCommand: ['/usr/bin/gate'], requestSocket: '/run/user/1000/other/req.sock' }),
    prepare('resource-env-merged', { coverage: {}, resources: [R('docs', '/srv/d', '/d', { env: { DOCS: '/d' } })] }, baseReq),
    prepare('resource-without-targets-skipped', { coverage: {}, resources: [{ resource: 'x', access: 'read' }, R('y', '/srv/y', '/y')] }, baseReq),
  ];
  if (savedXdg === undefined) delete process.env.XDG_RUNTIME_DIR; else process.env.XDG_RUNTIME_DIR = savedXdg;
  write('bwrap.v1.json', {
    note: 'recorded from src/runner/dispatch/confinement/drivers/bwrap.mjs with XDG_RUNTIME_DIR=/run/user/1000; assess pins only the mismatches the driver itself makes, not the resolver\'s',
    driver: { type: bwrap.BWRAP_DRIVER_TYPE, version: bwrap.BWRAP_DRIVER_VERSION, confinedMarkerEnv: bwrap.CONFINED_MARKER_ENV },
    runtimeSocketDirEnv: { XDG_RUNTIME_DIR: '/run/user/1000' },
    configCases, assessCases, prepareCases,
    digest: { bwrapPrefix: ['--ro-bind', '/', '/'], gateCommand: ['g'], agentArgv: ['a'], value: bwrap.computeLaunchDigest({ bwrapPrefix: ['--ro-bind', '/', '/'], gateCommand: ['g'], agentArgv: ['a'] }) },
  });
}
