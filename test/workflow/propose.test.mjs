// test/workflow/propose.test.mjs — the proposal a plan's slices become: frame, rows, refusals, the owner's question
// and the commands after a yes. Reads are injected, so no repository is needed; one test runs the real reads.

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { readStandardValue } from '../../src/config/facade.mjs';
import { shippedCatalog } from '../../src/runner/dispatch/shipped-catalog.mjs';
import { loadSliceTable } from '../../src/workflow/propose-classify.mjs';
import { CASE_PLACEHOLDER, createProposePorts, planCaseSlug, proposeFromRequest, proposeFromSlices, readPassRigor, renderProposalText } from '../../src/workflow/propose.mjs';
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';

const runnerConfig = readStandardValue('runner').value;
const shipped = shippedCatalog();
const implement = runnerConfig.capabilities['code:implement'];
// The project declares the command the final gate runs; the standard config declares none.
const declaredGate = { ...runnerConfig, capabilities: { ...runnerConfig.capabilities, 'code:implement': { ...implement, verify: 'node gate.mjs' } } };

const guide = {
  id: 'coding/feature',
  frameDefaults: { dispatches: 'set-at-approval', mutatingDispatches: 'set-at-approval', seatLaunchesPerDispatch: 'set-at-approval', fallbackPerSeat: 2, deviationsBeforeAsk: 2, rigorFloor: 'set-at-approval' },
  activities: [
    { id: 'judge-ambiguity', effects: 'none', unit: { pattern: 'solo' } },
    { id: 'validate-plan', effects: 'none', unit: { pattern: 'reviewed' } },
    { id: 'implement-item', effects: 'writes', unit: { pattern: 'reviewed' } },
    { id: 'review-item', effects: 'none' },
  ],
};

const PLAN = 'plans/p/plan.md';
const FILES = [PLAN, 'docs/note.md', 'src/a.mjs', 'src/b.mjs', 'test/a.test.mjs', 'packages/x/contracts/c.schema.json', 'db/migrations/001.sql'];

/** Reads over an in-memory tree: a file list, the tests that mention a term, an optional case to continue. */
function fakePorts({ files = FILES, tests = {}, inherit = null } = {}) {
  const dirs = new Set(['.']);
  for (const file of files) for (let at = path.posix.dirname(file); at !== '.'; at = path.posix.dirname(at)) dirs.add(at);
  const under = (scope) => (scope === '.' ? files : files.filter((f) => f === scope || f.startsWith(`${scope}/`)));
  return {
    repo: {
      stat: (p) => (files.includes(p) ? 'file' : dirs.has(p) ? 'dir' : null),
      listFiles: under,
      findTests: (terms) => terms.flatMap((t) => tests[t] ?? []),
      crateOf: () => null,
    },
    headCommit: () => 'c0ffee0000000000000000000000000000000000',
    findInherit: () => inherit,
  };
}

const slice = (id, writes, extra = {}) => ({ id, objective: `Do ${id}`, writes, verify: `node check-${id}.mjs`, ...extra });
const propose = (slices, { ports = fakePorts(), manifest = {}, ...rest } = {}) => proposeFromSlices({ manifest: { slices, ...manifest }, plan: PLAN, guide, runnerConfig: declaredGate, shipped, ports, worktree: '/wt/case', branch: 'case/p', ...rest });
const idsOf = (p) => p.commands.map((c) => c.id);
const flagValue = (command, flag) => command.argv[command.argv.indexOf(flag) + 1];
const codes = (p) => p.refusals.map((r) => r.code);

test('a plan with a document, a code and a locked-contract slice gets a frame, a row per slice and the commands in running order', () => {
  const p = propose([
    slice('note', ['docs/note.md']),
    slice('code', ['src/a.mjs'], { dependsOn: ['note'], earlyReview: true }),
    slice('contract', ['packages/x/contracts/c.schema.json'], { dependsOn: ['code'] }),
  ]);
  assert.equal(p.ok, true, JSON.stringify(p.refusals));
  assert.deepEqual(p.slices.map((s) => [s.id, s.kind, s.rigor]), [['note', 'docs', 'low'], ['code', 'code', 'standard'], ['contract', 'contract', 'high']]);
  assert.equal(p.frame.rigorFloor, 'low');
  assert.equal(p.frame.mutatingDispatches, 3 + 1 + 1, 'three writing slices, one fix for the high one, one spare');
  assert.deepEqual(idsOf(p), ['worktree', 'start', 'judge', 'validate', 'slice-note', 'follow-up-note', 'slice-code', 'early-review-code', 'slice-contract', 'gate']);
  const start = p.commands.find((c) => c.id === 'start');
  assert.equal(flagValue(start, '--frame'), `dispatches=${p.frame.dispatches},mutatingDispatches=${p.frame.mutatingDispatches},seatLaunchesPerDispatch=${p.frame.seatLaunchesPerDispatch},rigorFloor=low`);
  assert.deepEqual(start.yields, { caseId: 'data.workflowRunId' });
  const doc = p.commands.find((c) => c.id === 'slice-note');
  assert.equal(flagValue(doc, '--pattern'), 'solo');
  assert.ok(doc.argv.includes('--reason'), 'a pattern other than the activity\'s is a swap and carries its reason');
  assert.equal(p.commands.find((c) => c.id === 'slice-code').argv.includes('--reason'), false, 'the activity\'s own pattern needs none');
  const gate = p.commands.find((c) => c.id === 'gate');
  assert.equal(flagValue(gate, '--capability'), 'code:implement');
  assert.equal(gate.argv.includes('--verify'), false, 'the final gate carries no command of its own');
});

test('the frame admits the plan validation: a plan of documents only still gets a ceiling for the reviewed pass that validates it', () => {
  const p = propose([slice('note', ['docs/note.md'])]);
  assert.equal(p.ok, true);
  assert.equal(p.frame.seatLaunchesPerDispatch, 8, 'a reviewed pass at standard plans four seat launches, twice with fallback');
  const validate = p.commands.find((c) => c.id === 'validate');
  assert.equal(flagValue(validate, '--rigor'), 'standard', 'the read passes never run below standard');
  assert.equal(readPassRigor('low'), 'standard');
  assert.equal(readPassRigor('high'), 'high');
});

test('a closed case of the same plan and base commit is continued: its lock and validation lines and dispatches are dropped', () => {
  const alone = propose([slice('code', ['src/a.mjs'])]);
  const ported = propose([slice('code', ['src/a.mjs'])], { ports: fakePorts({ inherit: { fromCase: 'wf-old', milestones: [{ milestone: 'decisions-locked' }, { milestone: 'plan-validated' }] } }) });
  assert.deepEqual(ported.inherit, { fromCase: 'wf-old', milestones: ['decisions-locked', 'plan-validated'] });
  assert.deepEqual(idsOf(ported), ['worktree', 'start', 'slice-code', 'gate']);
  assert.equal(flagValue(ported.commands.find((c) => c.id === 'start'), '--inherit'), 'wf-old');
  assert.equal(alone.frame.dispatches - ported.frame.dispatches, 2, 'the validation and the lock are not repeated');
  assert.match(ported.questions[0].cause, /wf-old/);
});

test('a slice that touches data asks the owner first: it is a question, never a dispatch, and the frame and commands leave it out', () => {
  const p = propose([slice('code', ['src/a.mjs']), slice('data', ['db/migrations/001.sql'])]);
  assert.equal(p.ok, true, JSON.stringify(p.refusals));
  assert.deepEqual(p.ownerFirst, ['data']);
  assert.equal(p.frame.mutatingDispatches, 2, 'one writing slice and the spare');
  assert.equal(p.commands.some((c) => c.id === 'slice-data'), false);
  assert.deepEqual(p.questions.map((q) => q.id), ['owner-first', 'frame']);
  assert.match(p.questions[0].what, /data \(db\/migrations\/001\.sql\)/);
});

test('when every slice asks the owner first there is no frame and no command, only the question', () => {
  const p = propose([slice('data', ['db/migrations/001.sql'])]);
  assert.equal(p.ok, true);
  assert.equal(p.frame, null);
  assert.deepEqual(p.commands, []);
  assert.deepEqual(p.questions.map((q) => q.id), ['owner-first']);
});

test('a proposal that does not match the repository is refused by name, with no frame and no commands', () => {
  const cases = [
    [[slice('a', ['src/a.mjs'], { verify: undefined })], 'slice-verify-missing'],
    [[slice('a', ['src/a.mjs'], { colour: 'red' })], 'slice-invalid'],
    [[slice('a', ['src/a.mjs'], { dependsOn: ['b'] }), slice('b', ['src/b.mjs'], { dependsOn: ['a'] })], 'slice-cycle'],
    [[slice('a', ['src/a.mjs']), slice('b', ['src/a.mjs'])], 'write-overlap'],
    [[slice('a', ['src/missing/new.mjs'])], 'write-path-missing'],
    [[slice('a', ['src/a.mjs'], { raise: { rigor: 'low', reason: 'cheap' } })], 'slice-rigor-below-table'],
    [[slice('a', ['src/a.mjs'], { followUp: { capability: 'no-such-capability', pattern: 'solo' } })], 'capability-unregistered'],
    [[slice('a', ['src/a.mjs'], { inputs: ['plans/p/absent.md'] })], 'input-missing'],
    [[slice('a', ['src/a.mjs'], { objective: '--sneaky' })], 'slice-invalid'],
    [[slice('a', ['src/a.mjs,src/b.mjs'])], 'slice-invalid'],
  ];
  for (const [slices, code] of cases) {
    const p = propose(slices);
    assert.equal(p.ok, false, code);
    assert.ok(codes(p).includes(code), `${code}: got ${codes(p)}`);
    assert.equal(p.frame, null, code);
    assert.deepEqual(p.commands, [], code);
    assert.deepEqual(p.questions.map((q) => q.id), ['refusals'], code);
  }
  assert.ok(codes(propose([slice('a', ['src/a.mjs'])], { runnerConfig })).includes('gate-command-missing'), 'a writing slice with no declared code:implement verify is refused');
  assert.ok(codes(propose([slice('a', ['src/a.mjs'])], { manifest: { gate: 'node gate.mjs' } })).includes('manifest-invalid'), 'a slice list can no longer carry its own gate command');
  assert.ok(codes(propose([slice('a', ['src/a.mjs'])], { plan: 'plans/absent.md' })).includes('plan-missing'));
});

test('a slice that writes the whole repository is refused with the owner\'s note, never classified low', () => {
  for (const whole of ['.', '**', './']) {
    const p = propose([slice('all', [whole])]);
    assert.equal(p.ok, false, whole);
    const refusal = p.refusals.find((r) => r.ownerNote);
    assert.ok(refusal, `${whole}: ${codes(p)}`);
    assert.match(refusal.ownerNote, /cả repo/);
    assert.match(p.questions[0].cause, /cả repo/);
  }
});

test('a raise lifts a slice above its table rigor, and the question names it with its reason', () => {
  const p = propose([slice('code', ['src/a.mjs'], { raise: { rigor: 'high', reason: 'every caller reads this' } })]);
  assert.equal(p.ok, true);
  assert.equal(p.slices[0].rigor, 'high');
  assert.equal(p.slices[0].tableRigor, 'standard');
  assert.match(p.questions.find((q) => q.id === 'frame').cause, /code lên high \(every caller reads this\)/);
  assert.equal(flagValue(p.commands.find((c) => c.id === 'slice-code'), '--rigor'), 'high');
});

test('the tests that exercise changed code are added to the slice writes visibly, in the commands and in the question', () => {
  const p = propose([slice('code', ['src/a.mjs'])], { ports: fakePorts({ tests: { 'src/a.mjs': ['test/a.test.mjs'] } }) });
  assert.equal(p.ok, true, JSON.stringify(p.refusals));
  assert.deepEqual(p.expansions.map((e) => e.add), [['test/a.test.mjs']]);
  assert.equal(flagValue(p.commands.find((c) => c.id === 'slice-code'), '--writes'), 'src/a.mjs,test/a.test.mjs');
  assert.match(p.questions.find((q) => q.id === 'frame').cause, /test\/a\.test\.mjs/);
});

test('the question carries the five parts of the decision template in Vietnamese, built from the proposal', () => {
  const p = propose([slice('code', ['src/a.mjs']), slice('data', ['db/migrations/001.sql'])]);
  for (const q of p.questions) {
    for (const part of ['what', 'cause', 'recommendation', 'scope']) assert.ok(typeof q[part] === 'string' && q[part].length > 0, `${q.id}.${part}`);
    assert.ok(q.options.length >= 2 && q.options.every((o) => o.label && o.cost), `${q.id} options carry a cost`);
  }
  const text = renderProposalText(p);
  for (const heading of ['1. Việc đang xảy ra:', '2. Nguyên nhân:', '3. Các lựa chọn và chi phí:', '4. Em khuyến nghị:', '5. Phạm vi của câu trả lời:']) assert.ok(text.includes(heading), heading);
  assert.match(text, /Câu hỏi 2\/2/);
  const frame = p.questions.find((q) => q.id === 'frame');
  assert.ok(frame.what.includes(`tối đa ${p.frame.dispatches} lượt`) && frame.what.includes(`${p.frame.mutatingDispatches} lượt ghi`));
});

test('every generated line survives the shell: flags stay bare, values arrive whole, and only the case slot is the shell variable', () => {
  const p = propose([slice('code', ['src/a.mjs'], { objective: 'Fix "quoting" in it\'s $HOME path; rm -rf *' }), slice('lit', ['src/b.mjs'], { objective: '$CASE', verify: '$CASE' })], { manifest: { request: '$CASE' } });
  assert.equal(p.ok, true, JSON.stringify(p.refusals));
  for (const c of p.commands) {
    const tokens = execFileSync('sh', ['-c', `CASE=wf-123; set -- ${c.line.replace(/^fgos /, '')}; printf '%s\\0' "$@"`], { encoding: 'utf8' }).split('\0').slice(0, -1);
    assert.deepEqual(tokens, c.argv.map((a, i) => ((c.caseSlots ?? []).includes(i) ? 'wf-123' : a)), c.id);
  }
  const literal = p.commands.find((c) => c.id === 'slice-lit');
  assert.equal(literal.argv[1], CASE_PLACEHOLDER, 'the objective is the text the agent wrote, even when it spells the placeholder');
  assert.deepEqual(literal.caseSlots, [3]);
});

test('without an explicit worktree the case is named after the plan directory, and two plans never share a name', () => {
  const named = 'plans/261101-1200-cool-thing/plan.md';
  const p = proposeFromSlices({ manifest: { slices: [slice('a', ['src/a.mjs'])] }, plan: named, guide, runnerConfig: declaredGate, shipped, ports: fakePorts({ files: [named, 'src/a.mjs'] }) });
  assert.equal(p.ok, true, JSON.stringify(p.refusals));
  assert.match(p.worktree, /^\.\.\/261101-1200-cool-thing-[0-9a-f]{6}-worktree$/);
  assert.match(p.branch, /^case\/261101-1200-cool-thing-[0-9a-f]{6}$/);
  const slugs = [
    'plans/team-a/auth/plan.md', 'plans/team-b/auth/plan.md', 'plans/Feature_A/plan.md', 'plans/feature-a/plan.md',
    'plans/very-long-name-that-exceeds-forty-characters-here/plan.md', 'plans/very-long-name-that-exceeds-forty-characters-herf/plan.md',
  ].map(planCaseSlug);
  assert.equal(new Set(slugs).size, slugs.length, slugs.join(' '));
  assert.equal(planCaseSlug('plans/team-a/auth/PLAN.md'), planCaseSlug('plans/team-a/auth/plan.md'), 'the file name is compared without case: both are the plan of that directory');
  assert.equal(planCaseSlug('plans/x//y/./plan.md'), planCaseSlug('plans/x/y/plan.md'), 'a path spelled differently is the same plan');
});

test('a read-only slice that asks for an early review or a follow-up gets those review lines too, as the frame counted them', () => {
  const audit = { id: 'audit', objective: 'Audit the plan', writes: [], earlyReview: true, followUp: { capability: 'review', pattern: 'solo' } };
  const p = propose([audit, slice('code', ['src/a.mjs'])]);
  assert.equal(p.ok, true, JSON.stringify(p.refusals));
  const ids = idsOf(p);
  assert.ok(ids.indexOf('slice-audit') < ids.indexOf('early-review-audit') && ids.indexOf('early-review-audit') < ids.indexOf('follow-up-audit'), ids.join(','));
  for (const id of ['early-review-audit', 'follow-up-audit']) {
    const line = p.commands.find((c) => c.id === id);
    assert.equal(flagValue(line, '--worktree'), '/wt/case', id);
    assert.match(line.argv[1], /findings of read-only slice "audit"/, id);
  }
  assert.equal(p.breakdown.reads.followUps, 1, 'the frame counts the follow-up it now emits');
});

test('a review or a read-only slice reads the case worktree, where the change it reviews is', () => {
  const p = propose([slice('note', ['docs/note.md']), slice('code', ['src/a.mjs'], { earlyReview: true }), { id: 'look', objective: 'Read it', writes: [] }]);
  assert.equal(p.ok, true, JSON.stringify(p.refusals));
  for (const id of ['follow-up-note', 'early-review-code', 'slice-look']) {
    assert.equal(flagValue(p.commands.find((c) => c.id === id), '--worktree'), '/wt/case', id);
  }
});

test('a slice that waits on one the owner must decide first is parked behind it, not offered as runnable work', () => {
  const p = propose([slice('data', ['db/migrations/001.sql']), slice('a', ['src/a.mjs'], { dependsOn: ['data'] }), slice('b', ['src/b.mjs'], { dependsOn: ['a'] }), slice('free', ['docs/note.md'])]);
  assert.equal(p.ok, true, JSON.stringify(p.refusals));
  assert.deepEqual(p.parked, [{ slice: 'a', behind: 'data' }, { slice: 'b', behind: 'data' }]);
  assert.deepEqual(idsOf(p).filter((id) => id.startsWith('slice-')), ['slice-free']);
  assert.match(p.questions.find((q) => q.id === 'owner-first').cause, /a \(chờ data\), b \(chờ data\)/);
});

test('a case is continued only when it reached both the lock and the validation, since both lines are dropped together', () => {
  const only = (...milestones) => fakePorts({ inherit: { fromCase: 'wf-part', milestones: milestones.map((milestone) => ({ milestone })) } });
  const partial = propose([slice('code', ['src/a.mjs'])], { ports: only('decisions-locked') });
  assert.equal(partial.inherit, null);
  assert.deepEqual(idsOf(partial).slice(0, 4), ['worktree', 'start', 'judge', 'validate'], 'the new case still locks and validates');
  assert.equal(propose([slice('code', ['src/a.mjs'])], { ports: only('plan-validated', 'decisions-locked') }).inherit.fromCase, 'wf-part');
});

test('a follow-up pattern nothing registers is refused, and a registered one counts toward the seat-launch ceiling', () => {
  const unknown = propose([slice('a', ['src/a.mjs'], { followUp: { capability: 'review', pattern: 'does-not-exist' } })]);
  assert.equal(unknown.ok, false);
  assert.ok(codes(unknown).some((code) => /pattern/.test(code)), codes(unknown).join(','));
  const heavy = propose([slice('note', ['docs/note.md'], { followUp: { capability: 'review', pattern: 'reviewed' } })]);
  assert.equal(heavy.ok, true, JSON.stringify(heavy.refusals));
  assert.equal(heavy.frame.seatLaunchesPerDispatch, 8);
});

test('a worktree or branch that would read as a flag is refused, and a dependency list of the wrong type is a refusal, not a crash', () => {
  assert.ok(codes(propose([slice('a', ['src/a.mjs'])], { worktree: '--oops' })).includes('option-invalid'));
  assert.ok(codes(propose([slice('a', ['src/a.mjs'])], { branch: '--bad' })).includes('option-invalid'));
  assert.ok(codes(proposeFromRequest({ request: 'Rename it', writes: ['src/a.mjs'], verify: 'true', ports: fakePorts(), runnerConfig, worktree: '--oops' })).includes('option-invalid'));
  const wrong = propose([slice('a', ['src/a.mjs'], { dependsOn: 42 })]);
  assert.equal(wrong.ok, false);
  assert.ok(codes(wrong).includes('slice-invalid'));
});

test('a request with no plan is sized from the paths it names, with thresholds from the table', () => {
  const ports = fakePorts();
  const size = (writes, extra = {}) => proposeFromRequest({ request: 'Rename the thing', writes, verify: 'node check.mjs', ports, runnerConfig, ...extra });
  const none = size([]);
  assert.equal(none.kind, 'shape-plan-first');
  assert.deepEqual(none.commands, []);
  const small = size(['src/a.mjs']);
  assert.equal(small.kind, 'single-run');
  assert.deepEqual(small.commands.map((c) => c.id), ['worktree', 'run']);
  assert.equal(flagValue(small.commands[1], '--verify'), 'node check.mjs');
  assert.equal(small.commands[1].argv.includes('--case'), false, 'a single run opens no case');
  assert.equal(size(['src/a.mjs', 'src/b.mjs', 'docs/note.md', 'test/a.test.mjs']).kind, 'manifest-needed', 'more paths than a single run takes');
  assert.equal(size(['packages/x/contracts/c.schema.json']).kind, 'manifest-needed', 'a locked contract is above a single run\'s rigor');
  assert.equal(size(['db/migrations/001.sql']).kind, 'manifest-needed');
  assert.ok(codes(size(['src/a.mjs'], { verify: undefined })).includes('slice-verify-missing'));

  const tight = { ...loadSliceTable(), request: { singleRunMaxPaths: 1, singleRunMaxRigor: 'standard' } };
  assert.equal(size(['src/a.mjs', 'src/b.mjs'], { table: tight }).kind, 'manifest-needed', 'the threshold is the table\'s, not the code\'s');
  assert.equal(size(['src/a.mjs', 'src/b.mjs']).kind, 'single-run');
});

test('proposing writes nothing: no case, no ledger event, nothing in the checkout', () => {
  const root = makeFixtureDir('fgos-propose-');
  const git = (...args) => execFileSync('git', args, { cwd: root, stdio: 'ignore' });
  git('init', '-b', 'main');
  fs.mkdirSync(path.join(root, 'src'));
  fs.writeFileSync(path.join(root, 'src', 'a.mjs'), 'export const a = 1;\n');
  fs.writeFileSync(path.join(root, 'plan.md'), '# plan\n');
  const snapshot = () => execFileSync('find', ['.', '-not', '-path', './.git/*'], { cwd: root, encoding: 'utf8' }).split('\n').sort().join('\n');
  const before = snapshot();
  const ports = createProposePorts({ checkoutRoot: root, mainRoot: root });
  const p = proposeFromSlices({ manifest: { slices: [slice('a', ['src/a.mjs'])] }, plan: 'plan.md', guide, runnerConfig: declaredGate, shipped, ports: { ...ports, headCommit: () => 'c0ffee' } });
  assert.equal(p.ok, true, JSON.stringify(p.refusals));
  assert.equal(p.inherit, null, 'a checkout with no closed case has nothing to continue');
  assert.equal(snapshot(), before);
  assert.equal(fs.existsSync(path.join(root, '.fgos')), false, 'no workflow run directory was created');
});
