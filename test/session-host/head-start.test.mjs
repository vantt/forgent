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
import { bindHeadSeat, headKeyOf, headRoleOf, HeadStartError, lineageDirOf, openingText, startHeadSession } from '../../src/session-host/head-start.mjs';

seedFileLocalBwrapRegistry();
seedStubAgentClis('alpha-bin');

const PERSONA_TEXT = 'name: planner\ndescription: Plans the work in small verified steps.\npersona:\n  voice: calm\n';
const scratch = () => fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-head-start-'));

function fakes({ live = false, fronted = 'fronted', started = null } = {}) {
  const calls = { start: [], front: [], seat: [] };
  const host = {
    start: (request, opts) => { calls.start.push({ request, opts }); return started ?? { result: 'placed', placement: { host: 'terminal', key: request.key, display: request.display } }; },
    front: (placement) => { calls.front.push(placement); return fronted === 'fronted' ? { result: 'fronted' } : { result: 'unsupported', code: 'host-unsupported-here' }; },
  };
  const ports = {
    host,
    identity: () => ({ live }),
    pin: ({ persona }) => ({ name: persona, text: PERSONA_TEXT }),
    handoff: () => null,
    opening: ({ persona, name, pinned, handoff }) => openingText({ persona, name, personaLines: ['# Persona', `Description: ${pinned.text.split('\n')[1].slice('description: '.length)}`], handoff }),
    seat: (request) => { calls.seat.push(request); return { command: 'alpha-bin', args: ['--interactive'], env: { ALPHA_HOME: '/h' }, cli: 'claude' }; },
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

test('the opening is typed as the full persona text with the start ritual, never a pointer to a file', async () => {
  const projectRoot = scratch();
  const { calls, ports } = fakes();
  const out = await startHeadSession({ persona: 'planner', name: 'probe', projectRoot }, ports);
  assert.equal(out.already, false);
  const { request, opts } = calls.start[0];
  assert.equal(request.opening.delivery, 'typed');
  assert.match(request.opening.text, /Description: Plans the work in small verified steps\./);
  assert.match(request.opening.text, /# Start ritual/);
  assert.match(request.opening.text, /which pending question you resumed/);
  assert.doesNotMatch(request.opening.text, /\.fgos\/.*\.(md|txt)\b.*\b(read|open)\b this file/i);
  assert.equal(opts.cli, 'claude');
  assert.equal(request.role, 'head');
  assert.deepEqual(request.display, { id: 'probe', title: 'planner' });
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

test('the session is started with its role in the environment and its live key kept in the lineage folder', async () => {
  const projectRoot = scratch();
  const { calls, ports } = fakes();
  const out = await startHeadSession({ persona: 'planner', name: 'probe', projectRoot, gen: 2 }, ports);
  const { request } = calls.start[0];
  assert.equal(request.key, headKeyOf('planner', 'probe', 2));
  assert.equal(request.env.FGOS_HEAD_ROLE, headRoleOf('planner', 'probe'));
  assert.equal(request.env.FGOS_HEAD_GEN, '2');
  assert.equal(request.env.ALPHA_HOME, '/h');
  assert.equal(request.command, 'alpha-bin');
  assert.deepEqual(request.args, ['--interactive']);
  const kept = JSON.parse(fs.readFileSync(path.join(lineageDirOf(projectRoot, 'planner', 'probe'), 'placement.json'), 'utf8'));
  assert.equal(kept.placement.key, out.key);
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

test('a rotation successor opens beside the old session in its tab', async () => {
  const projectRoot = scratch();
  const { calls, ports } = fakes();
  await startHeadSession({ persona: 'planner', name: 'probe', projectRoot, gen: 2, beside: 'head-planner-probe-1' }, ports);
  assert.equal(calls.start[0].request.beside, 'head-planner-probe-1');
  assert.equal(calls.start[0].request.groupKey, 'head-planner-probe-1');
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

test('a role a live session holds is fronted and no second head is started', async () => {
  const projectRoot = scratch();
  const first = fakes();
  await startHeadSession({ persona: 'planner', name: 'probe', projectRoot }, first.ports);
  const { calls, ports } = fakes({ live: true });
  const out = await startHeadSession({ persona: 'planner', name: 'probe', projectRoot }, ports);
  assert.deepEqual(out, { already: true, role: 'head:planner-probe', key: 'head-planner-probe-1', fronted: true });
  assert.equal(calls.start.length, 0);
  assert.equal(calls.seat.length, 0);
  assert.equal(calls.front[0].key, 'head-planner-probe-1');
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

test('a live role whose placement is not recorded is refused by name, never started a second time', async () => {
  const projectRoot = scratch();
  const { calls, ports } = fakes({ live: true });
  await assert.rejects(startHeadSession({ persona: 'planner', name: 'probe', projectRoot }, ports), { code: 'placement-unknown' });
  assert.equal(calls.start.length, 0);
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

test('a screenless host, a bad name and a running rotation are refused before anything is placed', async () => {
  const projectRoot = scratch();
  const { calls, ports } = fakes();
  await assert.rejects(startHeadSession({ persona: 'planner', name: 'probe', projectRoot, hostKind: 'direct' }, ports), { code: 'head-needs-interactive-host' });
  await assert.rejects(startHeadSession({ persona: 'planner', name: 'Bad Name', projectRoot }, ports), (err) => err instanceof HeadStartError && err.code === 'bad-name');
  await assert.rejects(startHeadSession({ persona: 'planner', name: 'probe', projectRoot }, { ...ports, rotationHolds: () => true }), { code: 'rotation-in-progress' });
  assert.equal(calls.start.length + calls.seat.length, 0);
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

test('a start the host refuses leaves no placement record behind', async () => {
  const projectRoot = scratch();
  const { ports } = fakes({ started: { result: 'unsupported', code: 'pane-not-ready', detail: 'no prompt' } });
  await assert.rejects(startHeadSession({ persona: 'planner', name: 'probe', projectRoot }, ports), { code: 'start-refused' });
  assert.equal(fs.existsSync(path.join(lineageDirOf(projectRoot, 'planner', 'probe'), 'placement.json')), false);
  fs.rmSync(projectRoot, { recursive: true, force: true });
});
