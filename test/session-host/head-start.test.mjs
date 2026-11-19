// The owning proof of the head-start use case: what a head session is bound at, what its opening says, where
// it is placed, and when it is fronted or refused instead of started. The Session Host, Identity and the seat
// preparation are fakes; the binding runs the real crate over a small runner config.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { seedStubAgentClis } from '../helpers/agent-clis.mjs';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';
import { bindHeadSeat, headKeyOf, headRoleOf, HeadStartError, HEAD_HARD_CEILING_MS, lineageDirOf, openingText, placeHead, readHeadPlacement, startHeadSession } from '../../src/session-host/head-start.mjs';
import { grantOf } from '../../src/session-host/head-grants.mjs';
import { headOf } from '../../src/runner/dispatch/session-attempt.mjs';

seedFileLocalBwrapRegistry();
seedStubAgentClis('alpha-bin');

const PERSONA_TEXT = 'name: planner\ndescription: Plans the work in small verified steps.\npersona:\n  voice: calm\n';
const scratch = () => fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-head-start-'));

function fakes({ live = false, record = null, fronted = 'fronted', launchFails = null } = {}) {
  const calls = { launch: [], front: [] };
  const host = {
    front: (placement) => { calls.front.push(placement); return fronted === 'fronted' ? { result: 'fronted' } : { result: 'unsupported', code: 'host-unsupported-here' }; },
  };
  const ports = {
    host,
    identity: () => (live ? { live, record } : { live }),
    pin: ({ persona }) => ({ name: persona, text: PERSONA_TEXT }),
    handoff: () => null,
    opening: ({ persona, name, pinned, handoff }) => openingText({ persona, name, personaLines: ['# Persona', `Description: ${pinned.text.split('\n')[1].slice('description: '.length)}`], handoff }),
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

test('the session launches with its role, its grant and the opening verbatim as the full persona text with the start ritual', async () => {
  const projectRoot = scratch();
  const { calls, ports } = fakes();
  const out = await startHeadSession({ persona: 'planner', name: 'probe', projectRoot }, ports);
  assert.equal(out.already, false);
  const request = calls.launch[0];
  assert.match(request.opening, /Description: Plans the work in small verified steps\./);
  assert.match(request.opening, /# Start ritual/);
  assert.match(request.opening, /which pending question you resumed/);
  assert.equal(request.role, 'head:planner-probe');
  assert.deepEqual(request.grant, grantOf('head:planner-probe'));
  assert.deepEqual(request.grant.writes, ['plans', 'docs/discussions']);
  assert.equal(request.ceilingMs, HEAD_HARD_CEILING_MS);
  assert.deepEqual(request.display, { id: 'probe', title: 'planner' });
  assert.deepEqual(request.binding, { executor: 'alpha', key: 'head-planner-probe-1' });
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

test('a secretary launches with the paths and the verb its grant names; the lineage keeps the live key', async () => {
  const projectRoot = scratch();
  const { calls, ports } = fakes();
  const out = await startHeadSession({ persona: 'secretary', name: 'miu', projectRoot, gen: 2 }, ports);
  const request = calls.launch[0];
  assert.equal(request.key, headKeyOf('secretary', 'miu', 2));
  assert.deepEqual(request.grant, grantOf('head:secretary-miu'));
  assert.deepEqual(request.grant.writes, ['plans', 'docs/backlog.md', 'docs/discussions']);
  assert.deepEqual(request.grant.verbs, ['session start', 'session write', 'session bind session', 'session rotate', 'session answered', 'session restore role', 'questions list', 'questions ask', 'questions ack', 'questions cancel', 'questions answer', 'land', 'request result']);
  assert.equal(request.grant.mailbox, true, 'the secretary sends and receives mail');
  assert.deepEqual(request.env, { FGOS_HEAD_ROLE: headRoleOf('secretary', 'miu'), FGOS_HEAD_PERSONA: 'secretary', FGOS_HEAD_NAME: 'miu', FGOS_HEAD_GEN: '2' });
  // The supervisor records this head in the session's Identity entry from the envelope's session fields.
  assert.deepEqual(headOf(request.env), { persona: 'secretary', name: 'miu', gen: 2 });
  assert.deepEqual(headOf({ FGOS_HEAD_PERSONA: 'secretary', FGOS_HEAD_NAME: 'miu' }), {}, 'no generation, no head fields');
  const kept = JSON.parse(fs.readFileSync(path.join(lineageDirOf(projectRoot, 'secretary', 'miu'), 'placement.json'), 'utf8'));
  assert.equal(kept.placement.key, out.key);
  assert.equal(out.key, 'cmd_head-secretary-miu-2');
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

test('the grant table: the persona matches a table key exactly, an unnamed persona holds nothing, a non-head role is refused', () => {
  assert.deepEqual(grantOf('head:secretary-miu').verbs, ['session start', 'session write', 'session bind session', 'session rotate', 'session answered', 'session restore role', 'questions list', 'questions ask', 'questions ack', 'questions cancel', 'questions answer', 'land', 'request result']);
  assert.equal(grantOf('head:secretary-miu').peers, true, 'only the secretary reaches the peer sessions of its machine');
  const base = ['session bind session', 'session rotate', 'session answered', 'session restore role', 'questions list', 'questions ask', 'questions ack', 'questions cancel'];
  assert.deepEqual(grantOf('head:shaper-x'), { writes: ['docs/discussions'], verbs: [...base, 'land', 'request result'], mailbox: false, peers: false }, 'a shaper writes its discussions and lands them but starts nothing, answers nothing, has no mailbox and reaches no peer session');
  assert.deepEqual(grantOf('head:planner-x'), { writes: ['plans', 'docs/discussions'], verbs: [...base, 'land', 'request result'], mailbox: false, peers: false });
  assert.deepEqual(grantOf('head:supervisor-x'), { writes: ['plans', 'docs/backlog.md'], verbs: ['session start', 'session stop', 'session write', ...base, 'land', 'request result', 'supervisor queue', 'supervisor plans', 'slots', 'supervisor handled', 'supervisor done'], mailbox: false, peers: false });
  assert.ok(!grantOf('head:supervisor-x').verbs.includes('run'), 'a supervisor never runs a unit');
  const lead = grantOf('head:lead-sv-p09', 'lead', { planDir: '261118-1045-project-supervisor' });
  assert.deepEqual(lead, { writes: ['plans/261118-1045-project-supervisor'], verbs: [...base, 'run', 'land', 'worktree create', 'request result'], mailbox: false, peers: false });
  assert.ok(!lead.verbs.includes('session start'), 'a lead starts no session');
  assert.throws(() => grantOf('head:lead-sv-p09', 'lead'), { code: 'plan-not-found' });
  assert.throws(() => grantOf('head:lead-sv-p09'), { code: 'plan-not-found' });
  assert.deepEqual(grantOf('head:planner-x', 'planner', { planDir: 'ignored' }), grantOf('head:planner-x'), 'only a lead reads the plan directory');
  assert.deepEqual(grantOf('head:other-x'), { writes: [], verbs: [], mailbox: false, peers: false });
  assert.deepEqual(grantOf('head:secretary-miu', 'secretary'), grantOf('head:secretary-miu'));
  // `secretary-x` is another persona: asked by persona it is not the secretary, even though the role starts alike.
  assert.deepEqual(grantOf('head:secretary-x-y', 'secretary-x'), { writes: [], verbs: [], mailbox: false, peers: false });
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
