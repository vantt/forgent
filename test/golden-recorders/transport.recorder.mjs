// Records the golden vectors of the Rust transport base (packages/execution/engine/src/transport/) by running the
// live Node modules of src/runner/dispatch/ it still shares. Run: node test/golden-recorders/transport.recorder.mjs
// Each section writes one file under packages/execution/contracts/transport/.
// Dead sources (mechanism.mjs, adapters.mjs, visibility-session.mjs) were dropped; their fixtures stay and are
// owned by packages/execution/engine/tests/transport.rs.

import fs from 'node:fs';
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

const attempt = (call) => {
  try { return { ok: call() }; } catch (error) { return { error: { name: error.name, code: error.code ?? null } }; }
};

// SECTION: provider-adapter (live)
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

// SECTION: terminal-slot (live)
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

// SECTION: worker-session (live)
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

// worker-home.mjs is dead; fixture packages/execution/contracts/transport/worker-home.v1.json stays
// → packages/execution/engine/tests/transport.rs (`a_worker_home_is_provisioned_with_the_five_items_or_refused_leaving_nothing`).


// SECTION: worker-session-boot (live)
{
  const b = await dispatch('worker-session-boot.mjs');
  write('worker-session-boot.v1.json', { note: 'recorded from src/runner/dispatch/worker-session-boot.mjs (constants only; the boot is effectful and proven in the Rust test with fakes)', defaultWorkerSession: b.DEFAULT_WORKER_SESSION });
}
