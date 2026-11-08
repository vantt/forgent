// test/workflow/workflow-runner-seats.test.mjs — `--seats` end to end: a lens per panel seat through the real CLI, the preflight that
// refuses a pool before any run exists, and named personas pinned at start, briefed to their own seat only and read from the pin,
// not the file, on every later round. Message-level cases of a seat list and of a persona lookup are owned by seats.test.mjs and
// agent-definitions.test.mjs; here one of each proves the door passes them on.

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { readWorkflowEvents } from '../../src/workflow/store.mjs';
import { startWorkflow, statusWorkflow, answerWorkflow, preflightWorkflowSeats } from '../../src/workflow/index.mjs';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';
import { writeProjectConfig, readProjectConfig } from '../helpers/config-fixture.mjs';
import { setupTestRepo, BIN_FGOS, STANCE_CLI_CALL_TIMEOUT_MS, memberSeats, useDistinctFamilies } from '../helpers/workflow-runner-fixture.mjs';

seedFileLocalBwrapRegistry();

// A base whose only panel is generic (no seat tasks) followed by a step that depends on it.
function writeSeatBase(tmp) {
  fs.mkdirSync(path.join(tmp, 'core', 'workflows'), { recursive: true });
  fs.mkdirSync(path.join(tmp, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'docs', 'note.md'), '# Domain note\n');
  execFileSync('git', ['add', 'docs/note.md'], { cwd: tmp, stdio: 'ignore' });
  execFileSync('git', ['commit', '-m', 'add note'], { cwd: tmp, stdio: 'ignore' });
  fs.writeFileSync(path.join(tmp, 'core', 'workflows', 'seat-base.json'), JSON.stringify({
    id: 'seat-base',
    steps: [
      { id: 'opinions', units: [{ id: 'panel', template: { capability: 'docs:write', pattern: 'panel', seats: memberSeats(), blind: true, objective: 'Weigh the question', writes: [] } }] },
      { id: 'decide', dependsOn: ['opinions'], units: [{ id: 'verdict', template: { capability: 'docs:write', pattern: 'solo', objective: 'Decide', writes: [] } }] },
    ],
  }));
}

test('workflow start --seats through the real CLI stores the expanded definition and provenance, seats the lenses and reaches downstream units', { timeout: 4 * STANCE_CLI_CALL_TIMEOUT_MS }, (t) => {
  const tmp = setupTestRepo();
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  useDistinctFamilies(tmp, ['alpha', 'beta', 'gamma', 'delta']);
  writeSeatBase(tmp);
  const runFgos = (args) => JSON.parse(execFileSync(process.execPath, [BIN_FGOS, ...args], { cwd: tmp, encoding: 'utf8', timeout: STANCE_CLI_CALL_TIMEOUT_MS })).data;
  const lenses = ['cash flow and payback', 'delivery capacity and lock-in', 'renewal leverage'];
  const state = runFgos(['workflow', 'start', 'seat-base', '--request', 'Which retainer?', '--seats', lenses.join('|'), '--context-ref', 'docs/note.md', '--dir', tmp, '--foreground']);
  assert.equal(state.status, 'completed', JSON.stringify(state.steps));
  assert.equal(state.seatsPreflight, undefined, 'four families serve three seats and a synthesizer: nothing to warn about');

  // The stored definition and provenance are what status and resume read back.
  const status = runFgos(['workflow', 'status', state.workflowRunId, '--dir', tmp]);
  const panel = status.workflow.steps[0].units[0].template;
  assert.deepEqual(panel.seats.filter((seat) => seat.role === 'producer').map((seat) => seat.seat), ['member-1', 'member-2', 'member-3']);
  assert.deepEqual(Object.keys(panel.params.roleTasks), ['member-1', 'member-2', 'member-3']);
  assert.equal(status.workflowId, 'seat-base');
  assert.deepEqual(status.seats.seats, lenses);
  assert.equal(status.seats.baseId, 'seat-base');
  assert.match(status.seats.baseDigest, /^[0-9a-f]{64}$/);
  assert.deepEqual(status.seats.refs, ['docs/note.md']);
  assert.deepEqual(status.seats.refDigests, [{ ref: 'docs/note.md', sha256: crypto.createHash('sha256').update('# Domain note\n').digest('hex'), bytes: 14 }], 'the document is digested at start');
  assert.deepEqual(state.seatsEcho.refs, { count: 1, totalBytes: 14, unreadable: [] }, 'the start echoes what it pinned');
  assert.deepEqual(state.seatsEcho.personas, [], 'lenses carry no persona');
  assert.ok(status.seatProviders.length >= 3 && status.seatProviders.every((row) => typeof row.executor === 'string'), 'status says which executor served each seat');
  assert.ok(status.seatProviders.every((row) => 'account' in row), 'status says which account each seat ran on, or null when no account was pinned');
  assert.deepEqual(status.workflow.steps[1].units[0].template.contextRefs, ['docs/note.md'], 'the shared ref is copied to the step run-level refs cannot reach');
  const startEvent = readWorkflowEvents({ repoRoot: tmp, workflowRunId: state.workflowRunId })[0];
  assert.deepEqual(startEvent.payload.workflow.steps[0].units[0].template.params, panel.params);
  assert.deepEqual(startEvent.payload.seats, status.seats);

  // Each seat was briefed with its own lens only, and the synthesizer got no lens.
  const unitDir = path.join(tmp, '.fgos', 'assignments', state.steps.opinions.units.panel.unitRunId);
  const prompt = (role) => {
    const envelope = JSON.parse(fs.readFileSync(path.join(unitDir, role, '1', 'runs', '01', 'envelope.json'), 'utf8'));
    return envelope.launch.args.find((arg) => arg.includes('Write structured JSON to'));
  };
  lenses.forEach((lens, i) => {
    const brief = prompt(`member-${i + 1}`);
    assert.match(brief, new RegExp(`Your analytic lens for this question: ${lens}\\.`));
    assert.match(brief, /Weigh the question/);
    for (const other of lenses.filter((l) => l !== lens)) assert.ok(!brief.includes(other), `seat ${i + 1} must not see "${other}"`);
  });
  assert.ok(!fs.existsSync(path.join(unitDir, 'member-4')));
  assert.doesNotMatch(prompt('synthesizer'), /analytic lens/);

  // The downstream unit received the shared ref.
  const verdict = JSON.parse(fs.readFileSync(path.join(tmp, '.fgos', 'assignments', state.steps.decide.units.verdict.unitRunId, 'producer', '1', 'assignment.json'), 'utf8'));
  assert.ok(JSON.stringify(verdict).includes('docs/note.md'), 'the downstream assignment lists the shared ref');

  // Resume refuses seats that differ from the stored ones and accepts the same ones.
  assert.throws(
    () => execFileSync(process.execPath, [BIN_FGOS, 'workflow', 'resume', state.workflowRunId, '--seats', 'other one|other two', '--dir', tmp, '--foreground'], { cwd: tmp, encoding: 'utf8', stdio: 'pipe', timeout: STANCE_CLI_CALL_TIMEOUT_MS }),
    (error) => error.status !== 0 && /resume refuses different --seats/.test(`${error.stdout}${error.stderr}`),
  );
  const same = runFgos(['workflow', 'resume', state.workflowRunId, '--seats', lenses.join('|'), '--dir', tmp, '--foreground']);
  assert.equal(same.status, 'completed');
});

test('six seats on a pool with fewer provider families need no waiver: the preflight reports the shared families and refuses nothing', async (t) => {
  const tmp = setupTestRepo();
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  useDistinctFamilies(tmp, ['alpha', 'beta']);
  writeSeatBase(tmp);
  const seats = Array.from({ length: 6 }, (_, i) => `perspective ${i + 1}`);
  const { warnings } = await preflightWorkflowSeats({ workflowId: 'seat-base', seats, repoRoot: tmp, cwd: tmp, worktree: tmp });
  assert.ok(warnings.length > 0 && warnings.every((w) => /shares a provider family with/.test(w)), warnings.join('\n'));
  assert.ok(!fs.existsSync(path.join(tmp, '.fgos', 'workflow-runs')), 'the preflight records nothing');
});

test('the preflight refuses a pool that cannot serve a panel role at all before any run exists, and does nothing without --seats', async (t) => {
  const tmp = setupTestRepo();
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  writeSeatBase(tmp);
  assert.deepEqual(await preflightWorkflowSeats({ workflowId: 'seat-base', repoRoot: tmp, cwd: tmp, worktree: tmp }), { warnings: [] });
  const cfg = readProjectConfig(tmp);
  // The only executor of the pool has no model at the tier the capability asks for, so no seat can be served.
  cfg.runner.capabilities['docs:write'] = { prefer: [{ executor: 'test-node' }], tier: 'frontier' };
  writeProjectConfig(tmp, cfg);
  await assert.rejects(() => preflightWorkflowSeats({ workflowId: 'seat-base', seats: ['one lens', 'two lens'], repoRoot: tmp, cwd: tmp, worktree: tmp }), /--seats cannot be served/);
  assert.ok(!fs.existsSync(path.join(tmp, '.fgos', 'workflow-runs')), 'the preflight records nothing');
});

function writeWorkspacePersona(tmp, name, text) {
  fs.mkdirSync(path.join(tmp, 'fgos', 'agents'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'fgos', 'agents', `${name}.yaml`), text);
}

// Two generic panels, the second behind a human gate, so a resume dispatches seats after the start.
function writeTwoRoundSeatBase(tmp) {
  fs.mkdirSync(path.join(tmp, 'core', 'workflows'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'core', 'workflows', 'two-round.json'), JSON.stringify({
    id: 'two-round',
    steps: [
      { id: 'opinions', units: [{ id: 'panel', template: { capability: 'docs:write', pattern: 'panel', seats: memberSeats(), persona: 'panelist', objective: 'Weigh the question', writes: [] } }] },
      {
        id: 'again',
        dependsOn: ['opinions'],
        gate: { kind: 'human', question: 'Run the second round?' },
        units: [{ id: 'panel-two', template: { capability: 'docs:write', pattern: 'panel', seats: memberSeats(), persona: 'panelist', objective: 'Weigh it again', writes: [] } }],
      },
    ],
  }));
}

function seatBrief(tmp, unitRunId, role) {
  const dir = path.join(tmp, '.fgos', 'assignments', unitRunId, role, '1');
  const envelope = JSON.parse(fs.readFileSync(path.join(dir, 'runs', '01', 'envelope.json'), 'utf8'));
  return envelope.launch.args.find((arg) => arg.includes('Write structured JSON to'));
}

function seatAssignment(tmp, unitRunId, role) {
  return JSON.parse(fs.readFileSync(path.join(tmp, '.fgos', 'assignments', unitRunId, role, '1', 'assignment.json'), 'utf8'));
}

function consumerWorkspace(t, { families = ['alpha', 'beta', 'gamma', 'delta'] } = {}) {
  const tmp = setupTestRepo();
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  useDistinctFamilies(tmp, families);
  writeTwoRoundSeatBase(tmp);
  return tmp;
}

// A customer workspace: a repository with no core/agents or domains of its own, so installed
// definitions come from the running package and `fgos/agents` is the customer's own folder.
const PERSONA = (name, { description, voice }, extra = '') => [
  `name: ${name}`,
  'version: 0.1.0',
  `description: ${description}`,
  'role: Panelist',
  'persona:',
  `  voice: ${voice}${extra}`,
  '  style: Numbers first',
  '  archetype: A cautious controller',
  'decision_boundary:',
  '  can_decide:',
  '    - Whether the cash impact is acceptable',
  '  must_escalate:',
  '    - Anything needing board approval',
  '',
].join('\n');
const FINANCE_PERSONA = (extra = '') => PERSONA('finance-controller', { description: 'Weighs the cash impact of {objective} before anything else', voice: 'Plain controller voice' }, extra);
const LEDGER_PERSONA = PERSONA('ledger-keeper', { description: 'Keeps the ledger straight for {objective}', voice: 'Plain ledger voice' });

const seatedParams = (tmp, seats) => ({ workflowId: 'two-round', seats, request: 'Which retainer?', repoRoot: tmp, cwd: tmp, worktree: tmp });
const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex');

test('a named persona lands on its own seat only, mixed with a lens and an installed persona, in a consumer workspace; a later round uses the text pinned at start whether its file was edited or deleted', { timeout: 6 * STANCE_CLI_CALL_TIMEOUT_MS }, async (t) => {
  const tmp = consumerWorkspace(t, { families: ['alpha', 'beta', 'gamma', 'delta', 'epsilon'] });
  const personaText = FINANCE_PERSONA();
  writeWorkspacePersona(tmp, 'finance-controller', personaText);
  writeWorkspacePersona(tmp, 'ledger-keeper', LEDGER_PERSONA);
  const seats = ['cash flow and payback', '@finance-controller', '@council-assumptions', '@ledger-keeper'];

  const state = await startWorkflow(seatedParams(tmp, seats));
  assert.equal(state.status, 'parked', JSON.stringify(state.steps));
  assert.equal(state.steps.opinions.status, 'completed');

  // Pinned at start, in the event and the projection, with the digest of the exact bytes.
  const installed = fs.readFileSync(path.resolve('core/agents/council-assumptions.yaml'), 'utf8');
  const expected = [
    { seat: 'member-2', name: 'finance-controller', tier: 'workspace', source: 'fgos/agents/finance-controller.yaml', identity: 'workspace:fgos/agents/finance-controller', digest: sha256(personaText), text: personaText },
    { seat: 'member-3', name: 'council-assumptions', tier: 'core', source: 'core/agents/council-assumptions.yaml', identity: 'core:core/agents/council-assumptions', digest: sha256(installed), text: installed },
    { seat: 'member-4', name: 'ledger-keeper', tier: 'workspace', source: 'fgos/agents/ledger-keeper.yaml', identity: 'workspace:fgos/agents/ledger-keeper', digest: sha256(LEDGER_PERSONA), text: LEDGER_PERSONA },
  ];
  assert.deepEqual(state.seats.seats, seats);
  assert.deepEqual(state.seats.personas, expected);
  const startEvent = readWorkflowEvents({ repoRoot: tmp, workflowRunId: state.workflowRunId })[0];
  assert.deepEqual(startEvent.payload.seats.personas, expected);
  assert.deepEqual(statusWorkflow(state.workflowRunId, { repoRoot: tmp, cwd: tmp }).seats.personas, expected);

  const unitRunId = state.steps.opinions.units.panel.unitRunId;
  // Only the named seats are overrides; the unit's own persona travels on the Unit and serves every other role.
  const unitRecord = JSON.parse(fs.readFileSync(path.join(tmp, '.fgos', 'assignments', unitRunId, 'unit.json'), 'utf8'));
  assert.deepEqual(unitRecord.overrides.map((o) => [o.scope.seat ?? null, o.persona]), [
    ['member-2', 'finance-controller'], ['member-3', 'council-assumptions'], ['member-4', 'ledger-keeper'],
  ]);
  assert.equal(unitRecord.unit.persona, 'panelist');
  const personaOf = (role) => seatAssignment(tmp, unitRunId, role).policy.preferPersona;
  assert.equal(personaOf('member-1'), 'panelist', 'a lens seat keeps the unit-wide persona');
  assert.equal(personaOf('member-2'), 'finance-controller');
  assert.equal(personaOf('member-3'), 'council-assumptions');
  assert.equal(personaOf('member-4'), 'ledger-keeper');
  assert.equal(personaOf('synthesizer'), 'panelist', 'the synthesizer never inherits a seat persona');
  assert.equal(seatAssignment(tmp, unitRunId, 'synthesizer').policy.personaPin, undefined);

  // What each seat was actually briefed with: the pinned text on its own seat, the lens on the lens seat.
  const second = seatBrief(tmp, unitRunId, 'member-2');
  assert.match(second, /resolved persona "finance-controller"/);
  assert.ok(second.includes('Description: Weighs the cash impact of {objective} before anything else'), 'persona text stays literal');
  assert.ok(second.includes('Voice: Plain controller voice') && second.includes('- Whether the cash impact is acceptable'));
  assert.doesNotMatch(second, /analytic lens/);
  assert.match(second, /Weigh the question/, 'a named seat keeps the unit objective as its task');
  const third = seatBrief(tmp, unitRunId, 'member-3');
  assert.match(third, /resolved persona "council-assumptions"/);
  assert.ok(third.includes('Description: Council task posture: assumption testing.'));
  assert.ok(!third.includes('finance-controller') && !third.includes('Plain controller voice'));
  const fourth = seatBrief(tmp, unitRunId, 'member-4');
  assert.match(fourth, /resolved persona "ledger-keeper"/);
  assert.ok(fourth.includes('Voice: Plain ledger voice') && !fourth.includes('Plain controller voice'));
  const first = seatBrief(tmp, unitRunId, 'member-1');
  assert.match(first, /Your analytic lens for this question: cash flow and payback\./);
  assert.match(first, /resolved persona "panelist"/);
  assert.ok(!first.includes('Plain controller voice') && !first.includes('assumption testing') && !first.includes('Plain ledger voice'));
  const synthesizer = seatBrief(tmp, unitRunId, 'synthesizer');
  assert.ok(!synthesizer.includes('Plain controller voice') && !synthesizer.includes('assumption testing') && !synthesizer.includes('Plain ledger voice'));
  assert.match(synthesizer, /resolved persona "panelist"/);

  // One persona file is edited and another deleted after the start: the later round reads neither.
  writeWorkspacePersona(tmp, 'finance-controller', FINANCE_PERSONA(' EDITED AFTER START'));
  fs.rmSync(path.join(tmp, 'fgos', 'agents', 'ledger-keeper.yaml'));
  const done = await answerWorkflow(state.workflowRunId, { stepId: 'again', answer: 'go', approved: true, repoRoot: tmp, cwd: tmp, worktree: tmp });
  assert.equal(done.status, 'completed', JSON.stringify(done.steps));
  const laterRun = done.steps.again.units['panel-two'].unitRunId;
  const edited = seatBrief(tmp, laterRun, 'member-2');
  assert.ok(edited.includes('Voice: Plain controller voice\n'), 'edited: the pinned voice reaches the later round');
  assert.ok(!edited.includes('EDITED AFTER START'), 'edited: the live file must not be re-read');
  assert.ok(edited.includes('Description: Weighs the cash impact of {objective}'), 'edited');
  const deleted = seatBrief(tmp, laterRun, 'member-4');
  assert.ok(deleted.includes('Voice: Plain ledger voice\n'), 'deleted: the pinned voice reaches the later round');
  assert.ok(deleted.includes('Description: Keeps the ledger straight for {objective}'), 'deleted');
  assert.deepEqual(done.seats.personas.map((p) => p.digest), state.seats.personas.map((p) => p.digest));
});

test('a persona entry the start cannot take is refused by the preflight and by the start, and creates no run: one not found, one repeated', async (t) => {
  const tmp = consumerWorkspace(t);
  writeWorkspacePersona(tmp, 'finance-controller', FINANCE_PERSONA());

  const refused = [
    [['good lens', '@nobody-here'], /persona "nobody-here" not found; searched fgos\/agents \(.*core\/agents \(/],
    [['@finance-controller', '@finance-controller'], /seat 2 repeats seat 1/],
  ];
  for (const [seats, pattern] of refused) {
    await assert.rejects(() => preflightWorkflowSeats(seatedParams(tmp, seats)), pattern, `preflight ${seats.join('|')}`);
    await assert.rejects(() => startWorkflow(seatedParams(tmp, seats)), pattern, `start ${seats.join('|')}`);
  }
  await assert.rejects(() => preflightWorkflowSeats({ ...seatedParams(tmp, ['good lens', 'second lens']), workflowId: 'no-such-base' }), /no-such-base/);
  assert.ok(!fs.existsSync(path.join(tmp, '.fgos', 'workflow-runs')) || fs.readdirSync(path.join(tmp, '.fgos', 'workflow-runs')).length === 0, 'a refused start creates no run');
  assert.ok(!fs.existsSync(path.join(tmp, '.fgos', 'assignments')) || fs.readdirSync(path.join(tmp, '.fgos', 'assignments')).length === 0, 'no pane was opened');
});

test('workflow start --seats with an unknown persona through the real CLI exits non-zero, names the tiers searched and creates no run', (t) => {
  const tmp = consumerWorkspace(t);
  assert.throws(
    () => execFileSync(process.execPath, [BIN_FGOS, 'workflow', 'start', 'two-round', '--seats', 'good lens|@finance-controller', '--dir', tmp, '--foreground'], { cwd: tmp, encoding: 'utf8', stdio: 'pipe', timeout: STANCE_CLI_CALL_TIMEOUT_MS }),
    (error) => error.status !== 0 && /persona "finance-controller" not found; searched fgos\/agents/.test(`${error.stdout}${error.stderr}`),
  );
  assert.ok(!fs.existsSync(path.join(tmp, '.fgos', 'workflow-runs')) || fs.readdirSync(path.join(tmp, '.fgos', 'workflow-runs')).length === 0);
});
