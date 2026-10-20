// test/workflow/stale-approval-reapproval.test.mjs — an approval is bound to the digest of what was approved. When that
// content changes the gate asks again, and the re-approval of the new content is the authority that lets the
// next Unit read it; an edit nobody approved is still refused.

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';

import {
  validateWorkflow,
  startWorkflow,
  resumeWorkflow,
  answerWorkflow,
  readWorkflowEvents,
} from '../../src/workflow/index.mjs';
import { acquireAdvanceLock } from '../../src/workflow/case-lock.mjs';
import { projectCase } from '../../src/workflow/case-projection.mjs';
import { resolveUnitInputs } from '../../src/runner/execution/handoff-refs.mjs';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';
import { setupWorkflowFixtureRepo } from '../helpers/workflow-fixture-repo.mjs';

seedFileLocalBwrapRegistry();

// A worker that writes every file its brief names as WRITE:<path>.
const WORKER_BODY = `
  for (const m of prompt.matchAll(/WRITE:(\\S+)/g)) { fs.mkdirSync(path.dirname(m[1]), { recursive: true }); fs.writeFileSync(m[1], m[1] + ' written\\n'); }
  fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nThe assigned work was carried out and checked in full detail.\\n');
  fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Done' }));
`;

function setupRepo() {
  const tmp = setupWorkflowFixtureRepo({ prefix: 'fgos-reapprove-', readme: '# Reapprove', gitName: 'Reapprove Test', capabilities: ['docs:write'], workerBody: WORKER_BODY });
  fs.appendFileSync(path.join(tmp, '.gitignore'), '.fgos/\n*.mjs\n');
  return tmp;
}

const unit = (id, objective, extra = {}) => ({ id, template: { capability: 'docs:write', pattern: 'solo', objective, writes: [], ...extra } });
const opts = (tmp) => ({ repoRoot: tmp, cwd: tmp, worktree: tmp });
const eventsOf = (tmp, id) => readWorkflowEvents({ repoRoot: tmp, workflowRunId: id });

const GUIDE = {
  id: 'reapprove',
  milestones: [{ id: 'copy-approved', subject: 'the approved copy', evidence: 'gate answer', acceptedBy: 'owner', settledBy: 'approval' }],
  must: [{ id: 'consent', guard: 'human-consent', subject: 'copy-approved', reason: 'publishing approves nothing by itself' }],
  frameDefaults: { dispatches: 3, mutatingDispatches: 1, fallbackPerSeat: 2, deviationsBeforeAsk: 0, rigorFloor: 'standard' },
  steps: [
    { id: 'draft', units: [unit('draft-copy', 'Write the copy')] },
    { id: 'approval', dependsOn: ['draft'], gate: { kind: 'human', question: 'Approve the copy?' } },
    { id: 'publish', dependsOn: ['approval'], units: [unit('publish-copy', 'WRITE:pub/copy.txt', { writes: ['pub/**'] })] },
  ],
};

test('approve, edit the approved report, re-park, re-approve: the next step runs on the new content and passes', async () => {
  const tmp = setupRepo();
  const parked = await startWorkflow({ workflow: validateWorkflow(GUIDE), ...opts(tmp) });
  assert.equal(parked.status, 'parked');
  const id = parked.workflowRunId;

  // The approval is given while a live holder has advance, and the approved copy is edited before it is acted on.
  const held = acquireAdvanceLock(tmp, id);
  await answerWorkflow(id, { stepId: 'approval', answer: 'looks right', approved: true, ...opts(tmp) });
  held.release();
  const draftRun = parked.steps.draft.units['draft-copy'].unitRunId;
  const [report] = resolveUnitInputs([`unit-run:${draftRun}/producer`], tmp).refs;
  fs.appendFileSync(report, '\nEdited after approval.\n');

  const reparked = await resumeWorkflow(id, opts(tmp));
  assert.equal(reparked.status, 'parked', 'the gate asks again; nothing runs on the edited copy');
  assert.equal(eventsOf(tmp, id).filter((e) => e.type === 'gate.park').length, 2);

  // The re-approval is bound to the digest of the content as it is now, never the old one and never "unknown".
  const final = await answerWorkflow(id, { stepId: 'approval', answer: 'the edited copy is what I approve', approved: true, ...opts(tmp) });
  assert.equal(final.status, 'completed', JSON.stringify(final.steps));
  const events = eventsOf(tmp, id);
  const answers = events.filter((e) => e.type === 'gate.answer' && e.payload.approved === true);
  assert.equal(answers.length, 2);
  assert.ok(answers[1].payload.subjectDigest && answers[1].payload.subjectDigest !== answers[0].payload.subjectDigest, 're-approval carries the digest of the new content');
  assert.equal(final.steps.publish.units['publish-copy'].outcome, 'pass');
  const publishRun = final.steps.publish.units['publish-copy'].unitRunId;
  const record = JSON.parse(fs.readFileSync(path.join(tmp, '.fgos', 'assignments', publishRun, 'unit.json'), 'utf8'));
  assert.ok(record.resolvedInputs.includes(report), 'the publish Unit was handed the edited report, the one that was re-approved');
  assert.equal(projectCase(events).milestones['copy-approved'].consent, true);
});

test('an edit no approval covers is still refused: only the exact approved bytes are accepted, nothing else', async () => {
  const tmp = setupRepo();
  const parked = await startWorkflow({ workflow: validateWorkflow(GUIDE), ...opts(tmp) });
  const draftRun = parked.steps.draft.units['draft-copy'].unitRunId;
  const ref = `unit-run:${draftRun}/producer`;
  const [report] = resolveUnitInputs([ref], tmp).refs;
  const sha = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  const settled = sha(report);
  assert.deepEqual(resolveUnitInputs([ref], tmp).refs, [report], 'as settled, it is handed over');

  fs.appendFileSync(report, '\nEdited by nobody who was asked.\n');
  const edited = sha(report);
  for (const accept of [undefined, [], [settled], ['0'.repeat(64)]]) {
    assert.throws(() => resolveUnitInputs([ref], tmp, { accept }), /report-changed-after-settle/, JSON.stringify(accept));
  }
  assert.deepEqual(resolveUnitInputs([ref], tmp, { accept: [edited] }).refs, [report], 'the revision a person approved is handed over');

  // The run itself: nothing is approved for the edited copy, so the gate asks and no next Unit starts.
  const held = acquireAdvanceLock(tmp, parked.workflowRunId);
  await answerWorkflow(parked.workflowRunId, { stepId: 'approval', answer: 'ok', approved: true, ...opts(tmp) });
  held.release();
  fs.appendFileSync(report, 'And once more.\n');
  const state = await resumeWorkflow(parked.workflowRunId, opts(tmp));
  assert.equal(state.status, 'parked');
  assert.equal(eventsOf(tmp, parked.workflowRunId).some((e) => e.type === 'unit.scheduled' && e.payload.stepId === 'publish'), false);
});
