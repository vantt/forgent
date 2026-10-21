// What a Workflow run looks like from outside, reduced to its order: which steps ran in which order,
// which units each launched, with which pattern, blind or not, which roles ran in each round, and
// where a human gate parked and was answered. Timestamps, ids and event numbers are left out, and so
// is every event kind this projection does not know, so the projection survives later kinds.
//
// `runEveryPlaybook` runs each registered playbook, plus a units wave, against the fixture repo and
// the fake worker, and returns each run's projection. The committed baseline of that result is the
// guard that the order of every playbook stays the one it has today.

import fs from 'node:fs';
import path from 'node:path';
import { loadWorkflow, startWorkflow, answerWorkflow, readWorkflowEvents } from '../../src/workflow/index.mjs';
import { setupWorkflowFixtureRepo } from './workflow-fixture-repo.mjs';

export const PLAYBOOKS = [
  'council-lite',
  'delphi',
  'nominal-group',
  'group-cognition',
  'business-discussion',
  'architecture-advisory',
  'architecture-advisory-reopen',
  'marketing/content-publish',
];

const CAPABILITIES = [
  'delphi:propose', 'delphi:synthesize',
  'nominal-group:generate', 'nominal-group:share', 'nominal-group:vote', 'nominal-group:rank',
  'group-cognition:explore', 'group-cognition:critique', 'group-cognition:synthesize',
  'business:frame', 'business:perspectives', 'business:critique', 'business:synthesize', 'business:plan',
  'architecture:frame', 'architecture:shape', 'architecture:critique', 'architecture:synthesize', 'architecture:explain',
  'marketing:research', 'marketing:write', 'marketing:publish',
  'docs:write',
];

// One worker for every playbook: a JSON packet naming the missing expertise (the architecture
// playbooks park on it), a plain pass, and a file for every `WRITE:<path>` a producer is told to write
// (and the published post, for the one playbook that publishes).
const WORKER_BODY = `
  const producer = match[1].includes('/producer/');
  const wanted = [...prompt.matchAll(/WRITE:(\\S+)/g)].map((m) => m[1]);
  if (prompt.includes('Publish approved content artifact')) wanted.push('content/published/post.md');
  for (const rel of producer ? wanted : []) {
    fs.mkdirSync(path.dirname(rel), { recursive: true });
    fs.writeFileSync(rel, rel + ' written\\n');
  }
  fs.writeFileSync(path.join(runDir, 'agent-report.md'), JSON.stringify({
    verdict: 'Reversible recommendation with dissent preserved',
    evidence: ['fixed fixture report'],
    'missing expertise': ['authorization boundaries'],
  }));
  fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Settled', assessment: { verdict: 'pass' } }));
`;

function fixtureRepo() {
  return setupWorkflowFixtureRepo({
    prefix: 'fgos-order-guard-',
    readme: '# Playbook order guard',
    gitName: 'Order Guard',
    capabilities: CAPABILITIES,
    modelPolicies: { node: { standard: 'node-std', flagship: 'node-high', frontier: 'node-top' } },
    reviewed: { maxRounds: 1, checkersByRigor: { standard: ['reviewer'], high: ['reviewer', 'red-team'] } },
    workerBody: WORKER_BODY,
  });
}

/** Seats of a unit's runs, one list per round, each in seat-id order (seats of a round run together). */
function rolesByRound(results) {
  const rounds = new Map();
  for (const result of results ?? []) {
    const round = result.round ?? 1;
    if (!rounds.has(round)) rounds.set(round, []);
    rounds.get(round).push(result.seat ?? result.role);
  }
  return [...rounds.entries()].sort(([a], [b]) => a - b).map(([, roles]) => roles.sort());
}

/**
 * The observable order of one run: the steps in the order they started, each with its units (in
 * the order they were scheduled), its gate, and the run's last word.
 *
 * @param {Array<object>} events The run's ledger
 * @returns {{ steps: object[], status: string }}
 */
export function observableOrder(events) {
  const start = events.find((e) => e.type === 'workflow.start');
  const declared = new Map();
  for (const step of start.payload.workflow.steps) {
    for (const unit of step.units ?? []) {
      declared.set(`${step.id}/${unit.id}`, { pattern: unit.template?.pattern ?? 'solo', blind: unit.template?.blind === true });
    }
  }
  const steps = [];
  // A step enters the order with its first event (a gate-only step has no step.start).
  const stepOf = (id) => {
    let step = steps.find((s) => s.step === id);
    if (!step) {
      step = { step: id, units: [], gate: null, outcome: null };
      steps.push(step);
    }
    return step;
  };
  let status = 'running';
  for (const { type, payload: p } of events) {
    if (type === 'step.start') stepOf(p.stepId);
    else if (type === 'unit.scheduled') {
      const unit = { unit: p.unitId, ...declared.get(`${p.stepId}/${p.unitId}`), roles: [], outcome: null };
      stepOf(p.stepId).units.push(unit);
    } else if (type === 'unit.complete') {
      const unit = stepOf(p.stepId).units.find((u) => u.unit === p.unitId);
      unit.roles = rolesByRound(p.results);
      // Members of a panel are the seats whose posture measures a stance.
      unit.seats = (p.results ?? []).filter((result) => result.posture?.stance === true).length;
      unit.outcome = p.outcome;
    } else if (type === 'gate.park') stepOf(p.stepId).gate = 'parked';
    else if (type === 'gate.answer') stepOf(p.stepId).gate = p.approved === true ? 'approved' : 'answered';
    else if (type === 'step.complete' || type === 'step.fail') stepOf(p.stepId).outcome = type === 'step.fail' ? 'failed' : (p.outcome ?? 'pass');
    else if (type === 'workflow.complete') status = `completed:${p.outcome ?? 'pass'}`;
    else if (type === 'workflow.fail') status = `failed:${p.outcome ?? 'failed'}`;
  }
  return { steps, status };
}

async function runToEnd(repoRoot, begin) {
  let state = await begin();
  // Each gate is answered once; a clarification-only answer would leave the gate parked.
  while (state.status === 'parked') {
    const stepId = state.questions[0].stepId;
    state = await answerWorkflow(state.workflowRunId, { repoRoot, cwd: repoRoot, stepId, answer: 'Approved as proposed.', approved: true });
  }
  return { state, events: readWorkflowEvents({ repoRoot, workflowRunId: state.workflowRunId }) };
}

/** Run every playbook and a units wave; the projection of each run, keyed by workflow id. */
export async function runEveryPlaybook() {
  const projections = {};
  for (const id of PLAYBOOKS) {
    const repoRoot = fixtureRepo();
    const options = { repoRoot, cwd: repoRoot, worktree: repoRoot, request: 'Compare the options and keep dissent' };
    if (id === 'architecture-advisory-reopen') {
      fs.writeFileSync(path.join(repoRoot, 'parent-report.md'), 'Parent settled report\n');
      options.contextRefs = ['parent-report.md'];
    }
    const { events } = await runToEnd(repoRoot, () => startWorkflow({ ...options, workflow: loadWorkflow(id) }));
    projections[id] = observableOrder(events);
  }

  const repoRoot = fixtureRepo();
  const unitsPath = path.join(repoRoot, '.fgos', 'order-guard-units.json');
  fs.writeFileSync(unitsPath, JSON.stringify({ id: 'order-guard', units: [
    { id: 'w-a', objective: 'WRITE:a.txt', capability: 'docs:write', writes: ['a.txt'] },
    { id: 'read', objective: 'Read only', capability: 'docs:write', dependsOn: ['w-a'] },
    { id: 'w-b', objective: 'WRITE:b.txt', capability: 'docs:write', writes: ['b.txt'], dependsOn: ['read'] },
  ] }));
  const { events } = await runToEnd(repoRoot, () => startWorkflow({ repoRoot, cwd: repoRoot, worktree: repoRoot, unitsPath }));
  projections['units/order-guard'] = observableOrder(events);
  return projections;
}
