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
import { bindHeadSeat, headKeyOf, headRoleOf, HeadStartError, HEAD_HARD_CEILING_MS, lineageDirOf, openingText, startHeadSession } from '../../src/session-host/head-start.mjs';
import { grantOf } from '../../src/session-host/head-grants.mjs';

seedFileLocalBwrapRegistry();
seedStubAgentClis('alpha-bin');

const PERSONA_TEXT = 'name: planner\ndescription: Plans the work in small verified steps.\npersona:\n  voice: calm\n';
const scratch = () => fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-head-start-'));

function fakes({ live = false, fronted = 'fronted', launchFails = null } = {}) {
  const calls = { launch: [], front: [] };
  const host = {
    front: (placement) => { calls.front.push(placement); return fronted === 'fronted' ? { result: 'fronted' } : { result: 'unsupported', code: 'host-unsupported-here' }; },
  };
  const ports = {
    host,
    identity: () => ({ live }),
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
  assert.deepEqual(request.grant, { writes: [], verbs: [] });
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
  assert.deepEqual(request.grant.verbs, ['head start']);
  assert.deepEqual(request.env, { FGOS_HEAD_ROLE: headRoleOf('secretary', 'miu'), FGOS_HEAD_GEN: '2' });
  const kept = JSON.parse(fs.readFileSync(path.join(lineageDirOf(projectRoot, 'secretary', 'miu'), 'placement.json'), 'utf8'));
  assert.equal(kept.placement.key, out.key);
  assert.equal(out.key, 'cmd_head-secretary-miu-2');
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

test('the grant table: a persona it does not name holds nothing, and a role that is no head role is refused', () => {
  assert.deepEqual(grantOf('head:planner-probe'), { writes: [], verbs: [] });
  assert.throws(() => grantOf('lead:MAIL'), { code: 'role-invalid' });
  assert.throws(() => grantOf('head:secretary'), { code: 'role-invalid' });
  assert.throws(() => grantOf(undefined), { code: 'role-invalid' });
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

test('a role a live session holds is fronted and no second head is started', async () => {
  const projectRoot = scratch();
  const first = fakes();
  await startHeadSession({ persona: 'planner', name: 'probe', projectRoot }, first.ports);
  const { calls, ports } = fakes({ live: true });
  const out = await startHeadSession({ persona: 'planner', name: 'probe', projectRoot }, ports);
  assert.deepEqual(out, { already: true, role: 'head:planner-probe', key: 'cmd_head-planner-probe-1', fronted: true });
  assert.equal(calls.launch.length, 0);
  assert.equal(calls.front[0].key, 'cmd_head-planner-probe-1');
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

test('a live role whose placement is not recorded is refused by name, never started a second time', async () => {
  const projectRoot = scratch();
  const { calls, ports } = fakes({ live: true });
  await assert.rejects(startHeadSession({ persona: 'planner', name: 'probe', projectRoot }, ports), { code: 'placement-unknown' });
  assert.equal(calls.launch.length, 0);
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
