// The owning proof of the head-start use case: what a head session is bound at, what its opening says, where
// it is placed, and when it is fronted or refused instead of started. The Session Host, Identity and the seat
// preparation are fakes; the binding runs the real crate over a small runner config.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ensureGitAddon } from '../helpers/git-addon.mjs';
import { seedStubAgentClis } from '../helpers/agent-clis.mjs';
import { readRawProjectConfig } from '../helpers/config-fixture.mjs';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';
import { bindHeadSeat, defaultEnsureWorktree, headKeyOf, headRoleOf, headStartRequest, HeadStartError, HEAD_HARD_CEILING_MS, lineageDirOf, personasHeadsFirst, placeHead, readHeadPlacement, startHeadSession } from '../../src/session-host/head-start.mjs';
import { grantOf } from '../../src/session-host/head-grants.mjs';
import { fgosDirFromRoot } from '../../src/util/fgos-file-registry.mjs';
import { headOf } from '../../src/native/execution-door.mjs';
import { resolveInvocationRoot } from '../../src/runner/paths.mjs';
import { parseYaml } from '../../src/util/yaml.mjs';
import { quarantineProviderAccount } from '../../src/runner/dispatch/provider-capacity.mjs';

ensureGitAddon();
process.env.FGOS_STATE_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-head-start-state-root-'));
seedFileLocalBwrapRegistry();
seedStubAgentClis('alpha-bin');

const PERSONA_TEXT = 'name: planner\ndescription: Plans the work in small verified steps.\npersona:\n  voice: calm\n';
/** A project root whose plans/discussions holds the `probe` feature, the discussion the planner and shaper heads of these tests are bound to. */
function scratch() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-head-start-'));
  fs.mkdirSync(path.join(root, 'plans', 'discussions', 'ds-aaaaaaaaaa-probe'), { recursive: true });
  fs.writeFileSync(path.join(root, 'plans', 'discussions', 'ds-aaaaaaaaaa-probe', 'DISCUSSION.md'), '# probe\n');
  return root;
}

function fakes({ live = false, record = null, fronted = 'fronted', launchFails = null } = {}) {
  const calls = { launch: [], front: [], ensure: [] };
  const host = {
    front: (placement) => { calls.front.push(placement); return fronted === 'fronted' ? { result: 'fronted' } : { result: 'unsupported', code: 'host-unsupported-here' }; },
  };
  const ports = {
    host,
    identity: () => (live ? { live, record } : { live }),
    pin: ({ persona }) => ({ name: persona, text: PERSONA_TEXT }),
    handoff: () => null,
    ensureWorktree: (wanted) => { calls.ensure.push(wanted); return { path: wanted.path }; },
    // The composer owns the words (packages/agent-start-context/rust/tests/goldens.rs); a head start owns the request.
    opening: ({ request }) => JSON.stringify(request),
    runnerConfig: () => ({ marker: 'config' }),
    bind: ({ key }) => ({ executor: 'alpha', key }),
    launch: (request) => {
      calls.launch.push(request);
      if (launchFails) throw Object.assign(new Error(launchFails), { refusal: { reason: 'x' } });
      return { placement: { host: 'terminal', key: `cmd_${request.key}` }, runDir: `/run/${request.key}` };
    },
  };
  return { calls, ports };
}

test('a head seat is bound at the persona\'s tier, not the default tier', async () => {
  seedStubAgentClis('alpha-bin');
  const cells = { nano: 'a-s', standard: 'a-m', advanced: 'a-m', flagship: 'a-l', frontier: 'a-l' };
  const runnerConfig = {
    defaults: { tier: 'nano' },
    patterns: { seatBinding: { schema: 1 } },
    modelPolicies: { alpha: cells },
    personas: { planner: { tier: 'standard' } },
    capabilities: { execute: { prefer: [{ executor: 'alpha' }] } },
    executors: { alpha: { kind: 'agent', providerModel: 'alpha', invocations: [{ id: 'alpha-cli', via: 'cli', adapter: 'cli-spawn', command: 'alpha-bin', confinement: { backend: 'bwrap' }, credentialStore: { use: 'alpha', homeEnv: 'ALPHA_HOME', files: ['login'] } }] } },
  };
  const binding = await bindHeadSeat({ persona: 'planner', key: 'head-planner-probe-1', runnerConfig });
  assert.equal(binding.tier, 'standard');
  assert.equal(binding.persona, 'planner');
});

test('a head seat takes the executor\'s pane invocation, not its headless one', async () => {
  seedStubAgentClis('alpha-bin');
  const store = { use: 'alpha', homeEnv: 'ALPHA_HOME', files: ['login'] };
  const runnerConfig = {
    defaults: { tier: 'standard' },
    patterns: { seatBinding: { schema: 1 } },
    modelPolicies: { alpha: { nano: 'a-s', standard: 'a-m', advanced: 'a-m', flagship: 'a-l', frontier: 'a-l' } },
    capabilities: { execute: { prefer: [{ executor: 'alpha' }] } },
    executors: { alpha: { kind: 'agent', providerModel: 'alpha', invocations: [
      { id: 'alpha-headless', via: 'cli', adapter: 'cli-spawn', command: 'alpha-bin', confinement: { backend: 'bwrap' }, credentialStore: store },
      { id: 'alpha-pane', via: 'cli', adapter: 'herdr-spawn', command: 'alpha-bin', confinement: { backend: 'bwrap' }, credentialStore: store },
    ] } },
  };
  const binding = await bindHeadSeat({ persona: 'planner', key: 'head-planner-probe-1', runnerConfig });
  assert.equal(binding.invocation, 'alpha-pane');
});

test('a head seat bind never ranks an account the lease state quarantines', async () => {
  seedStubAgentClis('alpha-bin');
  const runtimeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-head-bind-quarantine-'));
  const store = (f) => ({ use: f, homeEnv: `${f.toUpperCase()}_HOME`, files: ['login'] });
  const runnerConfig = {
    defaults: { tier: 'standard' },
    patterns: { seatBinding: { schema: 1 } },
    modelPolicies: { alpha: { standard: 'a-m' } },
    capabilities: { execute: { prefer: [{ executor: 'alpha' }] } },
    executors: {
      alpha: {
        kind: 'agent',
        providerModel: 'alpha',
        invocations: [
          { id: 'alpha-pane', via: 'cli', adapter: 'herdr-spawn', command: 'alpha-bin', confinement: { backend: 'bwrap' }, credentialStore: store('alpha') },
        ],
      },
    },
    llmAccounts: {
      alpha: {
        a1: { label: 'a1', credentialStore: { alpha: '/nonexistent/a1' } },
        a2: { label: 'a2', credentialStore: { alpha: '/nonexistent/a2' } },
      },
    },
  };

  quarantineProviderAccount({
    provider: 'alpha',
    accountId: 'a1',
    reasonCode: 'quota-limit',
    until: new Date(Date.now() + 3_600_000).toISOString(),
    runtimeDir,
  });

  const binding = await bindHeadSeat({ persona: 'planner', key: 'head-planner-probe-1', runnerConfig, runtimeDir });
  assert.equal(binding.leaseAccount, 'a2', 'the binding names the healthy account');

  const onlyQuarantinedConfig = {
    ...runnerConfig,
    llmAccounts: {
      alpha: {
        a1: { label: 'a1', credentialStore: { alpha: '/nonexistent/a1' } },
      },
    },
  };

  await assert.rejects(
    () => bindHeadSeat({ persona: 'planner', key: 'head-planner-probe-2', runnerConfig: onlyQuarantinedConfig, runtimeDir }),
    (err) => {
      assert.ok(err instanceof HeadStartError, 'error must be HeadStartError');
      assert.equal(err.code, 'bind-refused');
      assert.equal(err.reason ?? err.refusal?.reason, 'no-account-available');
      return true;
    },
  );
});

// Existing seat tests cover tier and invocation selection, not refusal when the pinned family's accounts are disabled.
test('starting each coordinating persona under prefer: claude with only a non-Claude free account is refused with bind-refused and never binds the other family', async (t) => {
  seedStubAgentClis('claude-bin', 'other-bin');
  const store = (f) => ({ use: f, homeEnv: `${f.toUpperCase()}_HOME`, files: ['login'] });
  const runnerConfig = {
    defaults: { tier: 'standard' },
    patterns: { seatBinding: { schema: 1 } },
    modelPolicies: {
      claude: { standard: 'c-sonnet', flagship: 'c-opus' },
      other: { standard: 'o-m', flagship: 'o-l' },
    },
    personas: {
      secretary: { tier: 'standard', pool: 'claude-miu', prefer: [{ executor: 'claude', invocation: 'claude-pane' }] },
      supervisor: { tier: 'flagship', prefer: [{ executor: 'claude', invocation: 'claude-pane' }] },
      lead: { tier: 'flagship', prefer: [{ executor: 'claude', invocation: 'claude-pane' }] },
      planner: { tier: 'flagship', prefer: [{ executor: 'claude', invocation: 'claude-pane' }] },
      shaper: { tier: 'flagship', prefer: [{ executor: 'claude', invocation: 'claude-pane' }] },
    },
    capabilities: { execute: { prefer: [{ executor: 'claude' }, { executor: 'other' }] } },
    executors: {
      claude: {
        kind: 'agent',
        providerModel: 'claude',
        invocations: [{ id: 'claude-pane', via: 'cli', adapter: 'herdr-spawn', command: 'claude-bin', confinement: { backend: 'bwrap' }, credentialStore: store('claude') }],
      },
      other: {
        kind: 'agent',
        providerModel: 'other',
        invocations: [{ id: 'other-pane', via: 'cli', adapter: 'herdr-spawn', command: 'other-bin', confinement: { backend: 'bwrap' }, credentialStore: store('other') }],
      },
    },
    llmAccounts: {
      claude: { c1: { label: 'c1', disabled: true, credentialStore: { claude: '/nonexistent/c1' } } },
      'claude-miu': {
        m1: { label: 'm1', disabled: true, credentialStore: { claude: '/nonexistent/m1' } },
        m2: { label: 'm2', credentialStore: { other: '/nonexistent/m2' } },
      },
      other: { o1: { label: 'o1', credentialStore: { other: '/nonexistent/o1' } } },
    },
  };

  // Prove the alternate family can actually serve both tiers; an unusable fixture would make refusal vacuous.
  for (const tier of ['standard', 'flagship']) {
    const availableConfig = { ...runnerConfig, personas: { available: { tier, prefer: [{ executor: 'other' }] } } };
    const binding = await bindHeadSeat({ persona: 'available', key: `head-available-${tier}-1`, runnerConfig: availableConfig });
    assert.equal(binding.executor, 'other');
    assert.equal(binding.tier, tier);
  }

  // Without its pin, the secretary's own pool can serve the other family too.
  const unpinnedConfig = { ...runnerConfig, personas: { secretary: { tier: 'standard', pool: 'claude-miu' } } };
  const unpinned = await bindHeadSeat({ persona: 'secretary', key: 'head-secretary-unpinned-1', runnerConfig: unpinnedConfig });
  assert.equal(unpinned.executor, 'other');

  const coordinating = ['secretary', 'supervisor', 'lead', 'planner', 'shaper'];
  const projectRoot = scratch();
  t.after(() => fs.rmSync(projectRoot, { recursive: true, force: true }));
  const { calls, ports } = fakes();
  delete ports.bind;
  const planOfHead = () => ({ dir: '261118-1045-project-supervisor', footprint: [] });
  for (const persona of coordinating) {
    const name = persona === 'secretary' ? 'miu' : persona === 'lead' ? 'sv-p09' : 'probe';
    await assert.rejects(
      () => startHeadSession({ persona, name, projectRoot }, { ...ports, planOfHead, runnerConfig: () => runnerConfig }),
      (err) => err instanceof HeadStartError && err.code === 'bind-refused' && /\bclaude\b/.test(err.message),
      `${persona} must be refused with bind-refused naming claude`,
    );
    assert.equal(readHeadPlacement(lineageDirOf(projectRoot, persona, name)), null, `${persona} leaves no placement`);
  }
  assert.equal(calls.launch.length, 0, 'never launched or bound to the other family');
});

// This is a repository-file rule, not binding behavior: effective pins come from project over standard only.
test('this repository\'s runner configuration pins every coordinating persona to claude', () => {
  // Read only .fgos/config.yaml and core/config-standard/runner.yaml, never home/global config.
  // A linked worktree reads the main checkout's project file (skip-worktree there); CI reads the committed file.
  const { root } = resolveInvocationRoot({ cwd: process.cwd(), policy: 'main-checkout' });
  const filename = path.join(root, '.fgos', 'config.yaml');
  const config = parseYaml(readRawProjectConfig(root), { filename });
  const standardFilename = path.join(root, 'core', 'config-standard', 'runner.yaml');
  const standard = parseYaml(fs.readFileSync(standardFilename, 'utf8'), { filename: standardFilename });
  const coordinating = ['secretary', 'supervisor', 'lead', 'planner', 'shaper'];
  for (const persona of coordinating) {
    const projectPersona = config.runner?.personas?.[persona];
    const prefer = projectPersona && Object.hasOwn(projectPersona, 'prefer')
      ? projectPersona.prefer
      : standard.runner?.personas?.[persona]?.prefer;
    const list = [].concat(prefer ?? []);
    assert.ok(list.length > 0, `${persona} must have an explicit prefer list`);
    assert.deepEqual(list.map((entry) => typeof entry === 'string' ? entry : entry.executor), ['claude'], `${persona} must pin claude only`);
    assert.ok(list.every((entry) => entry.crossProvider !== true), `${persona} must not allow crossing provider`);
  }
});

test('a head start request carries the bound item\'s domain as a fact, and no domain fact when the item names none', () => {
  const base = { persona: 'lead', name: 'p', projectRoot: '/tmp/proj', cli: 'claude' };
  const task = { kind: 'plan', path: 'plans/x/plan.md' };
  assert.equal(headStartRequest({ ...base, task: { ...task, domain: 'coding' } }).facts.domain, 'coding');
  assert.equal('domain' in headStartRequest({ ...base, task }).facts, false);
});

test('the session launches with its role, its grant and the opening composed from its head start request', async () => {
  const projectRoot = scratch();
  const { calls, ports } = fakes();
  const out = await startHeadSession({ persona: 'planner', name: 'probe', projectRoot }, ports);
  assert.equal(out.already, false);
  const request = calls.launch[0];
  const start = JSON.parse(request.opening);
  assert.equal(start.delivery, 'opening');
  assert.equal(start.facts.sessionType, 'head');
  assert.equal(start.facts.persona, 'planner');
  assert.deepEqual(start.payloads[0], { kind: 'session', name: 'probe' });
  assert.equal(request.role, 'head:planner-probe');
  assert.deepEqual(request.grant, grantOf('head:planner-probe'));
  assert.deepEqual(request.grant.writes, ['plans']);
  assert.equal(request.ceilingMs, HEAD_HARD_CEILING_MS);
  assert.deepEqual(request.display, { role: 'planner', title: 'ds-aaaaaaaaaa-probe' });
  assert.deepEqual(request.binding, { executor: 'alpha', key: 'head-planner-probe-1' });
  const invocation = request.runnerConfig.executors?.alpha?.invocations?.[0];
  assert.ok(!invocation?.args?.includes('--settings'), 'a non-Claude binding does not carry the setting');
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

test('a Claude binding carries statusLine on the launch invocation, a non-Claude binding does not', async () => {
  const projectRoot = scratch();
  const { calls, ports } = fakes();
  ports.runnerConfig = () => ({
    executors: {
      claude: {
        command: 'claude',
        invocations: [{ id: 'claude-pane', command: 'claude', args: [] }],
      },
      codex: {
        command: 'codex',
        invocations: [{ id: 'codex-pane', command: 'codex', args: [] }],
      },
    },
  });

  // Non-Claude (codex)
  ports.bind = ({ key }) => ({ executor: 'codex', cli: 'codex', invocation: 'codex-pane', key });
  await startHeadSession({ persona: 'planner', name: 'probe', projectRoot }, ports);
  const codexReq = calls.launch[0];
  const codexInv = codexReq.runnerConfig.executors.codex.invocations[0];
  assert.ok(!codexInv.args.includes('--settings'), 'a non-Claude binding does not carry the setting');

  // Claude
  ports.bind = ({ key }) => ({ executor: 'claude', cli: 'claude', invocation: 'claude-pane', key });
  await startHeadSession({ persona: 'planner', name: 'probe', projectRoot }, ports);
  const claudeReq = calls.launch[1];
  const claudeInv = claudeReq.runnerConfig.executors.claude.invocations[0];
  const settingsIdx = claudeInv.args.indexOf('--settings');
  assert.ok(settingsIdx >= 0, 'a Claude binding carries the setting');
  const settings = JSON.parse(claudeInv.args[settingsIdx + 1]);
  assert.deepEqual(settings.statusLine, {
    type: 'command',
    command: 'fgos hook session-rotation --event status-line',
  });
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

test('a head launch merges statusLine into an existing --settings object on the invocation', async () => {
  const projectRoot = scratch();
  const { calls, ports } = fakes();
  ports.runnerConfig = () => ({
    executors: {
      claude: {
        command: 'claude',
        invocations: [
          { id: 'claude-pane', command: 'claude', args: ['--settings', JSON.stringify({ enabledMcpjsonServers: ['test'] })] },
        ],
      },
    },
  });
  ports.bind = ({ key }) => ({ executor: 'claude', invocation: 'claude-pane', key });
  await startHeadSession({ persona: 'planner', name: 'probe', projectRoot }, ports);
  const request = calls.launch[0];
  const invocation = request.runnerConfig.executors.claude.invocations[0];
  const settingsIdx = invocation.args.indexOf('--settings');
  assert.ok(settingsIdx >= 0);
  const merged = JSON.parse(invocation.args[settingsIdx + 1]);
  assert.deepEqual(merged, {
    enabledMcpjsonServers: ['test'],
    statusLine: {
      type: 'command',
      command: 'fgos hook session-rotation --event status-line',
    },
  });
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

test('a head launch leaves an existing non-JSON --settings value unchanged and does not add statusLine', async () => {
  const projectRoot = scratch();
  const { calls, ports } = fakes();
  ports.runnerConfig = () => ({
    executors: {
      claude: {
        command: 'claude',
        invocations: [
          { id: 'claude-pane', command: 'claude', args: ['--settings', '/etc/claude/settings.json'] },
        ],
      },
    },
  });
  ports.bind = ({ key }) => ({ executor: 'claude', invocation: 'claude-pane', key });
  await startHeadSession({ persona: 'planner', name: 'probe', projectRoot }, ports);
  const request = calls.launch[0];
  const invocation = request.runnerConfig.executors.claude.invocations[0];
  assert.deepEqual(invocation.args, ['--settings', '/etc/claude/settings.json']);
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

test('withHeadSettings leaves runner config unchanged when executor has no invocations or no id matches', async () => {
  const { withHeadSettings } = await import('../../src/session-host/head-start.mjs');
  const baseConfig = {
    executors: {
      claude: { command: 'claude', invocations: [] },
    },
  };
  const resEmpty = withHeadSettings(baseConfig, { executor: 'claude', invocation: 'claude-pane' });
  assert.equal(resEmpty, baseConfig);

  const configWithInv = {
    executors: {
      claude: { command: 'claude', invocations: [{ id: 'other-pane', command: 'claude', args: [] }] },
    },
  };
  const resNoMatch = withHeadSettings(configWithInv, { executor: 'claude', invocation: 'claude-pane' });
  assert.equal(resNoMatch, configWithInv);
});

test('a secretary launches with the paths its grant names; the lineage keeps the live key', async () => {
  const projectRoot = scratch();
  const { calls, ports } = fakes();
  const out = await startHeadSession({ persona: 'secretary', name: 'miu', projectRoot, gen: 2 }, ports);
  const request = calls.launch[0];
  assert.equal(request.key, headKeyOf('secretary', 'miu', 2));
  assert.deepEqual(request.grant, grantOf('head:secretary-miu'));
  assert.deepEqual(request.grant.writes, ['plans', 'plans/backlog.md', 'plans/backlog/*']);
  assert.equal(request.grant.mailbox, true, 'the secretary sends and receives mail');
  assert.deepEqual(request.env, { TMPDIR: '/tmp', FGOS_HEAD_ROLE: headRoleOf('secretary', 'miu'), FGOS_HEAD_PROJECT_ROOT: path.resolve(projectRoot), FGOS_HEAD_PERSONA: 'secretary', FGOS_HEAD_NAME: 'miu', FGOS_HEAD_GEN: '2' });
  // The supervisor records this head in the session's Identity entry from the envelope's session fields.
  assert.deepEqual(headOf(request.env), { persona: 'secretary', name: 'miu', gen: 2 });
  assert.deepEqual(headOf({ FGOS_HEAD_PERSONA: 'secretary', FGOS_HEAD_NAME: 'miu' }), {}, 'no generation, no head fields');
  const kept = JSON.parse(fs.readFileSync(path.join(lineageDirOf(projectRoot, 'secretary', 'miu'), 'placement.json'), 'utf8'));
  assert.equal(kept.placement.key, out.key);
  assert.equal(out.key, 'cmd_head-secretary-miu-2');
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

test('the grant port: the persona matches a table persona exactly, an unnamed persona holds nothing, a non-head role is refused', () => {
  assert.equal(grantOf('head:secretary-miu').peers, true, 'only the secretary reaches the peer sessions of its machine');
  assert.deepEqual(grantOf('head:shaper-x'), { writes: ['plans/discussions'], mailbox: true, peers: false }, 'a shaper writes its discussions and reaches no peer session; it has a mailbox');
  assert.deepEqual(grantOf('head:planner-x'), { writes: ['plans'], mailbox: false, peers: false });
  const lead = grantOf('head:lead-sv-p09', 'lead', { planDir: '261118-1045-project-supervisor' });
  assert.deepEqual(lead, { writes: ['plans/261118-1045-project-supervisor'], mailbox: false, peers: false });
  assert.throws(() => grantOf('head:lead-sv-p09', 'lead'), { code: 'plan-not-found' });
  assert.throws(() => grantOf('head:lead-sv-p09'), { code: 'plan-not-found' });
  assert.deepEqual(grantOf('head:planner-x', 'planner', { planDir: 'ignored' }), grantOf('head:planner-x'), 'only a lead reads the plan directory');
  assert.deepEqual(grantOf('head:other-x'), { writes: [], mailbox: false, peers: false });
  assert.deepEqual(grantOf('head:secretary-miu', 'secretary'), grantOf('head:secretary-miu'));
  // `secretary-x` is another persona: asked by persona it is not the secretary, even though the role starts alike.
  assert.deepEqual(grantOf('head:secretary-x-y', 'secretary-x'), { writes: [], mailbox: false, peers: false });
  assert.throws(() => grantOf('head:secretary-miu', 'planner'), { code: 'role-invalid' });
  assert.throws(() => grantOf('lead:MAIL'), { code: 'role-invalid' });
  assert.throws(() => grantOf('head:secretary'), { code: 'role-invalid' });
  assert.throws(() => grantOf(undefined), { code: 'role-invalid' });
});

test('a lead launches with its plan dir as the only write, a rotation resolves the same grant, a resolver refusal is grant-invalid', async () => {
  const projectRoot = scratch();
  const { calls, ports } = fakes();
  const seen = [];
  const planOfHead = (root, persona, name) => { seen.push([persona, name]); return { dir: '261118-1045-project-supervisor', footprint: [] }; };
  await startHeadSession({ persona: 'lead', name: 'sv-p09', projectRoot }, { ...ports, planOfHead });
  assert.deepEqual(calls.launch[0].grant.writes, ['plans/261118-1045-project-supervisor']);
  assert.deepEqual(seen, [['lead', 'sv-p09']]);
  await placeHead({ persona: 'lead', name: 'sv-p09', projectRoot, gen: 2 }, { ...ports, planOfHead });
  assert.deepEqual(calls.launch[1].grant, calls.launch[0].grant, 'a rotation resolves the same lead grant');
  const refuse = () => { throw Object.assign(new Error('no plan'), { code: 'plan-not-found' }); };
  await assert.rejects(() => placeHead({ persona: 'lead', name: 'sv-none', projectRoot }, { ...ports, planOfHead: refuse }), { code: 'grant-invalid' });
  assert.equal(calls.launch.length, 2, 'a refused grant launches nothing');
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

test('a start without a generation takes the first one whose attempt directory is unused', async () => {
  const projectRoot = scratch();
  fs.mkdirSync(path.join(projectRoot, '.fgos', 'assignments', 'head-planner-probe-1'), { recursive: true });
  const { calls, ports } = fakes();
  await startHeadSession({ persona: 'planner', name: 'probe', projectRoot }, ports);
  assert.equal(calls.launch[0].key, 'head-planner-probe-2');
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

test('a rotation successor opens beside the old session in its tab', async () => {
  const projectRoot = scratch();
  const { calls, ports } = fakes();
  await startHeadSession({ persona: 'planner', name: 'probe', projectRoot, gen: 2, beside: 'head-planner-probe-1' }, ports);
  assert.equal(calls.launch[0].beside, 'head-planner-probe-1');
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

test('a role a live session holds is fronted by the slot its Identity record names and no second head is started', async () => {
  const projectRoot = scratch();
  const first = fakes();
  await startHeadSession({ persona: 'planner', name: 'probe', projectRoot }, first.ports);
  // The record is the authority: a slot other than the one placement.json kept is the one fronted.
  const record = { id: 'fg-abc234/uuid-1', roles: ['head:planner-probe'], ids: { terminal: { driver: 'herdr', key: 'cmd_live-slot', paneId: 'w1:p1' } } };
  const { calls, ports } = fakes({ live: true, record });
  const out = await startHeadSession({ persona: 'planner', name: 'probe', projectRoot }, ports);
  assert.deepEqual(out, { already: true, role: 'head:planner-probe', key: 'cmd_live-slot', fronted: true });
  assert.equal(calls.launch.length, 0);
  assert.deepEqual(calls.front[0], { host: 'terminal', key: 'cmd_live-slot' });
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

test('a live role whose Identity record names no slot is refused by name, never started a second time', async () => {
  const projectRoot = scratch();
  const first = fakes();
  await startHeadSession({ persona: 'planner', name: 'probe', projectRoot }, first.ports);
  const { calls, ports } = fakes({ live: true, record: { id: 'fg-abc234/uuid-1', roles: ['head:planner-probe'] } });
  await assert.rejects(startHeadSession({ persona: 'planner', name: 'probe', projectRoot }, ports), { code: 'placement-unknown' });
  assert.equal(calls.launch.length, 0);
  assert.equal(calls.front.length, 0);
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

test('a bad name and a running rotation are refused before anything is launched', async () => {
  const projectRoot = scratch();
  const { calls, ports } = fakes();
  await assert.rejects(startHeadSession({ persona: 'planner', name: 'Bad Name', projectRoot }, ports), (err) => err instanceof HeadStartError && err.code === 'bad-name');
  await assert.rejects(startHeadSession({ persona: 'planner', name: 'probe', projectRoot }, { ...ports, rotationHolds: () => true }), { code: 'rotation-in-progress' });
  assert.equal(calls.launch.length, 0);
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

test('a launch that is refused leaves no placement record behind', async () => {
  const projectRoot = scratch();
  const { ports } = fakes({ launchFails: 'no account could be leased' });
  await assert.rejects(startHeadSession({ persona: 'planner', name: 'probe', projectRoot }, ports), { code: 'start-refused' });
  assert.equal(fs.existsSync(path.join(lineageDirOf(projectRoot, 'planner', 'probe'), 'placement.json')), false);
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

test('a head whose supervisor could not bind its role is refused with the supervisor\'s own code, not a generic start refusal', async () => {
  const projectRoot = scratch();
  const { ports } = fakes({ launchFails: 'the supervisor did not bind head:planner-probe (exited, exit 0)' });
  const refusedRun = path.join(fgosDirFromRoot(projectRoot), 'assignments', headKeyOf('planner', 'probe', 1), 'runs', '01');
  fs.mkdirSync(refusedRun, { recursive: true });
  fs.writeFileSync(path.join(refusedRun, 'start-refused.json'), JSON.stringify({ v: 1, code: 'head-role-held', why: 'head:planner-probe was not bound: role-held: held by the live session x' }));
  await assert.rejects(startHeadSession({ persona: 'planner', name: 'probe', projectRoot, gen: 1 }, ports), (err) => err.code === 'head-role-held' && /held by the live session x/.test(err.message));
  fs.writeFileSync(path.join(refusedRun, 'start-refused.json'), JSON.stringify({ v: 1, code: 'terminal-gate-silent', why: 'no hello' }));
  await assert.rejects(startHeadSession({ persona: 'planner', name: 'probe', projectRoot, gen: 1 }, ports), { code: 'start-refused' });
  // The note of an earlier run is not the failed launch's: only the newest run is read.
  fs.writeFileSync(path.join(refusedRun, 'start-refused.json'), JSON.stringify({ v: 1, code: 'head-role-held', why: 'stale' }));
  fs.mkdirSync(path.join(path.dirname(refusedRun), '02'), { recursive: true });
  await assert.rejects(startHeadSession({ persona: 'planner', name: 'probe', projectRoot, gen: 1 }, ports), { code: 'start-refused' });
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

test('placeHead launches a head and leaves the holder check and the placement record to its caller', async () => {
  const projectRoot = scratch();
  const { calls, ports } = fakes({ live: true });
  const placed = await placeHead({ persona: 'planner', name: 'probe', projectRoot, beside: 'cmd_old', gen: 3 }, ports);
  assert.equal(placed.key, 'cmd_head-planner-probe-3');
  assert.equal(placed.gen, 3);
  assert.equal(calls.launch[0].beside, 'cmd_old');
  assert.equal(calls.front.length, 0, 'a live holder is not fronted: the successor starts beside it');
  assert.equal(readHeadPlacement(lineageDirOf(projectRoot, 'planner', 'probe')), null, 'the caller records where the head lives');
  await assert.rejects(placeHead({ persona: 'Bad', name: 'x', projectRoot }, ports), { code: 'bad-persona' });
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

// The private /tmp itself is proven at the lowest layer by the head sandbox argv (`--tmpfs /tmp`, apps/fgos/tests/questions_head.rs).
test('a head launch exports TMPDIR=/tmp, the sandbox private tmpfs, and makes no scratch directory', async () => {
  const projectRoot = scratch();
  const { calls, ports } = fakes();
  await startHeadSession({ persona: 'shaper', name: 'probe', projectRoot }, ports);
  assert.equal(calls.launch[0].env.TMPDIR, '/tmp');
  assert.ok(!fs.existsSync(path.join(fgosDirFromRoot(projectRoot), 'assignments', calls.launch[0].key)), 'nothing is created under the attempt before the launch');
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

test('the known personas list the ones that hold a head grant first, so a cut message keeps them', () => {
  const names = ['aaa-helper', 'zeta-tool', 'shaper', 'lead', 'secretary', 'planner', 'supervisor', 'bbb-other'];
  assert.deepEqual(personasHeadsFirst(names), ['lead', 'planner', 'secretary', 'shaper', 'supervisor', 'aaa-helper', 'bbb-other', 'zeta-tool']);
});

test('a persona with no definition is refused persona-not-found and the known personas are listed', async () => {
  const projectRoot = scratch();
  const { ports } = fakes();
  delete ports.pin;
  await assert.rejects(
    () => placeHead({ persona: 'no-such-persona', name: 'probe', projectRoot }, ports),
    (err) => err instanceof HeadStartError && err.code === 'persona-not-found' && /secretary/.test(err.message) && /shaper/.test(err.message) && err.known.includes('shaper'),
  );
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

test('a planner and a shaper head start with their discussion as the task, a lead with its plan', async () => {
  const projectRoot = scratch();
  const { calls, ports } = fakes();
  await startHeadSession({ persona: 'planner', name: 'probe', projectRoot }, ports);
  await startHeadSession({ persona: 'shaper', name: 'probe', projectRoot }, ports);
  const task = (r) => JSON.parse(r.opening).payloads.find((p) => p.kind === 'task');
  const [planner, shaper] = calls.launch.map(task);
  assert.deepEqual(planner, { kind: 'task', path: 'plans/discussions/ds-aaaaaaaaaa-probe/DISCUSSION.md', itemKind: 'discussion' });
  assert.deepEqual(shaper, { kind: 'task', path: 'plans/discussions/ds-aaaaaaaaaa-probe/DISCUSSION.md', itemKind: 'discussion' });
  const planOfHead = () => ({ dir: '261118-1045-project-supervisor', footprint: [] });
  await startHeadSession({ persona: 'lead', name: 'sv-p09', projectRoot }, { ...ports, planOfHead });
  assert.deepEqual(task(calls.launch[2]), { kind: 'task', path: 'plans/261118-1045-project-supervisor/plan.md', itemKind: 'plan' });
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

test('a planner or shaper head bound to no discussion is refused by name before anything is launched or recorded', async () => {
  const projectRoot = scratch();
  const { calls, ports } = fakes();
  for (const persona of ['planner', 'shaper']) {
    await assert.rejects(startHeadSession({ persona, name: 'nothing-here', projectRoot }, ports), { code: 'discussion-not-found' });
    assert.equal(readHeadPlacement(lineageDirOf(projectRoot, persona, 'nothing-here')), null);
  }
  assert.equal(calls.launch.length, 0);
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

test('a hand start and an automated start of the same head name type the same opening', async () => {
  const projectRoot = scratch();
  const { ports } = fakes();
  const openings = [];
  const record = (request) => { openings.push(request.opening); return { placement: { host: 'terminal', key: `cmd_${request.key}` }, runDir: `/run/${request.key}` }; };
  // Both doors call startHeadSession(persona, name); the second is a rotation-style placeHead of the same lineage.
  await startHeadSession({ persona: 'planner', name: 'probe', projectRoot }, { ...ports, launch: record });
  await placeHead({ persona: 'planner', name: 'probe', projectRoot, gen: 2 }, { ...ports, launch: record });
  assert.equal(openings[0], openings[1]);
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

test('a shaper start puts its discussion worktree on discussion/<dir> and launches there; a planner launches with no workdir', async () => {
  const projectRoot = scratch();
  const { calls, ports } = fakes();
  await placeHead({ persona: 'shaper', name: 'probe', projectRoot }, ports);
  await placeHead({ persona: 'planner', name: 'probe', projectRoot }, ports);
  const expectedPath = path.join(path.dirname(projectRoot), `${path.basename(projectRoot)}-worktrees`, 'ds-aaaaaaaaaa-probe');
  assert.deepEqual(calls.ensure, [{ projectRoot, path: expectedPath, branch: 'discussion/ds-aaaaaaaaaa-probe' }]);
  assert.equal(calls.launch[0].workdir, expectedPath);
  assert.equal('workdir' in calls.launch[1], false);
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

test('a registered discussion worktree is reused without a create call, and one on another branch is refused shaper-worktree-mismatch', async () => {
  const { execFileSync } = await import('node:child_process');
  const projectRoot = scratch();
  const git = (...args) => execFileSync('git', args, { cwd: projectRoot, stdio: 'pipe' });
  git('init', '-q', '-b', 'main');
  git('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '--allow-empty', '-m', 'init');
  const worktree = path.join(path.dirname(projectRoot), `${path.basename(projectRoot)}-worktrees`, 'ds-aaaaaaaaaa-probe');
  git('worktree', 'add', '-q', '-b', 'discussion/ds-aaaaaaaaaa-probe', worktree);
  const reused = await defaultEnsureWorktree({ projectRoot, path: worktree, branch: 'discussion/ds-aaaaaaaaaa-probe' });
  assert.equal(reused.created, false);
  await assert.rejects(defaultEnsureWorktree({ projectRoot, path: worktree, branch: 'discussion/other' }), { code: 'shaper-worktree-mismatch' });
  fs.rmSync(worktree, { recursive: true, force: true });
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

/** A real git project with one commit, an installation directory, and its discussion worktree path (not yet created). */
async function gitProject({ installation = true } = {}) {
  const { execFileSync } = await import('node:child_process');
  const projectRoot = scratch();
  const git = (...args) => execFileSync('git', args, { cwd: projectRoot, stdio: 'pipe' });
  git('init', '-q', '-b', 'main');
  git('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '--allow-empty', '-m', 'init');
  if (installation) fs.mkdirSync(path.join(projectRoot, '.fgos', 'installation', 'bin'), { recursive: true });
  // The worktree door requires the controller's activation fence in the project.
  const fence = path.join(projectRoot, '.fgos', 'locks', 'activation.lock');
  fs.mkdirSync(fence, { recursive: true });
  fs.writeFileSync(path.join(fence, 'TOMBSTONE'), JSON.stringify({ lock: 'activation', by: 'fgos git', at: 'fixture' }));
  const worktrees = path.join(path.dirname(projectRoot), `${path.basename(projectRoot)}-worktrees`);
  return { projectRoot, git, worktrees, worktree: path.join(worktrees, 'ds-aaaaaaaaaa-probe'), branch: 'discussion/ds-aaaaaaaaaa-probe' };
}
const cleanupProject = (p) => { fs.rmSync(p.worktrees, { recursive: true, force: true }); fs.rmSync(p.projectRoot, { recursive: true, force: true }); };

test('a shaper worktree on a project with no worktrees directory is created through the worktree door, and carries a link to the project installation', async () => {
  const p = await gitProject();
  assert.equal(fs.existsSync(p.worktrees), false);
  const first = await defaultEnsureWorktree({ projectRoot: p.projectRoot, path: p.worktree, branch: p.branch });
  assert.equal(first.created, true);
  const link = path.join(p.worktree, '.fgos', 'installation');
  assert.equal(fs.lstatSync(link).isSymbolicLink(), true);
  assert.equal(fs.realpathSync(link), fs.realpathSync(path.join(p.projectRoot, '.fgos', 'installation')));
  assert.deepEqual(fs.readdirSync(p.worktrees), ['ds-aaaaaaaaaa-probe'], 'nothing but the worktree is created in the worktrees directory');
  const again = await defaultEnsureWorktree({ projectRoot: p.projectRoot, path: p.worktree, branch: p.branch });
  assert.equal(again.created, false);
  assert.equal(fs.realpathSync(link), fs.realpathSync(path.join(p.projectRoot, '.fgos', 'installation')));
  cleanupProject(p);
});

test('a conflicting .fgos/installation in the shaper worktree is refused shaper-worktree-installation-conflict and left in place', async () => {
  const p = await gitProject();
  p.git('worktree', 'add', '-q', '-b', p.branch, p.worktree);
  const dir = path.join(p.worktree, '.fgos', 'installation');
  fs.mkdirSync(dir, { recursive: true });
  await assert.rejects(defaultEnsureWorktree({ projectRoot: p.projectRoot, path: p.worktree, branch: p.branch }), { code: 'shaper-worktree-installation-conflict' });
  assert.equal(fs.lstatSync(dir).isDirectory(), true);
  fs.rmSync(dir, { recursive: true });
  fs.symlinkSync(os.tmpdir(), dir, 'dir');
  await assert.rejects(defaultEnsureWorktree({ projectRoot: p.projectRoot, path: p.worktree, branch: p.branch }), { code: 'shaper-worktree-installation-conflict' });
  assert.equal(fs.readlinkSync(dir), os.tmpdir());
  cleanupProject(p);
});

test('a registered shaper worktree gets the installation link once and a second placement keeps it', async () => {
  const p = await gitProject();
  p.git('worktree', 'add', '-q', '-b', p.branch, p.worktree);
  const link = path.join(p.worktree, '.fgos', 'installation');
  await defaultEnsureWorktree({ projectRoot: p.projectRoot, path: p.worktree, branch: p.branch });
  const inode = fs.lstatSync(link).ino;
  await defaultEnsureWorktree({ projectRoot: p.projectRoot, path: p.worktree, branch: p.branch });
  assert.equal(fs.lstatSync(link).isSymbolicLink(), true);
  assert.equal(fs.lstatSync(link).ino, inode);
  assert.equal(fs.realpathSync(link), fs.realpathSync(path.join(p.projectRoot, '.fgos', 'installation')));
  cleanupProject(p);
});

test('a project without .fgos/installation gets no link in the shaper worktree', async () => {
  const p = await gitProject({ installation: false });
  p.git('worktree', 'add', '-q', '-b', p.branch, p.worktree);
  await defaultEnsureWorktree({ projectRoot: p.projectRoot, path: p.worktree, branch: p.branch });
  assert.equal(fs.existsSync(path.join(p.worktree, '.fgos', 'installation')), false);
  cleanupProject(p);
});
