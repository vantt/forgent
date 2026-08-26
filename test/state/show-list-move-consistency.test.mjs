// test/state/show-list-move-consistency.test.mjs — tsk-38i:
// Read-path consistency regression guard between show, list, and move's precondition read.
// Asserts that listWork (used by show and list) and rebuildViewFromDir (used by moveWork's precondition)
// report identical stage and status for an item during and immediately following an approve-like state transition.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  initStore,
  addWork,
  moveWork,
  recordGateApprove,
  listWork,
  currentEffectiveView,
  rebuild,
} from '../../src/state/store.mjs';
import { rebuildViewFromDir } from '../../src/state/replay.mjs';
import { getDomain, effectiveStage } from '../../src/state/workflow-stage-graphs.mjs';
import { acquireClaim, releaseClaim } from '../../src/state/runtime-coordination.mjs';

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-show-list-move-'));
}

function getShowRead(dir, id) {
  const rawView = listWork(dir);
  const item = rawView.work[id];
  if (!item) return null;
  const domain = getDomain(item.domain);
  return {
    status: item.status,
    stage: item.stage,
    stageEffective: effectiveStage(item, domain),
  };
}

function getListRead(dir, id) {
  const rawView = listWork(dir);
  const item = rawView.work[id];
  if (!item) return null;
  const domain = getDomain(item.domain);
  return {
    status: item.status,
    stage: item.stage,
    stageEffective: effectiveStage(item, domain),
  };
}

function getMovePreconditionRead(dir, id) {
  const durableView = rebuildViewFromDir(dir);
  const item = durableView.work[id];
  if (!item) return null;
  const domain = getDomain(item.domain);
  return {
    status: item.status,
    stage: item.stage,
    stageEffective: effectiveStage(item, domain),
  };
}

function assertReadPathsAgree(dir, id, label) {
  const showRead = getShowRead(dir, id);
  const listRead = getListRead(dir, id);
  const moveRead = getMovePreconditionRead(dir, id);

  assert.notEqual(showRead, null, `${label}: showRead should exist for ${id}`);
  assert.notEqual(listRead, null, `${label}: listRead should exist for ${id}`);
  assert.notEqual(moveRead, null, `${label}: moveRead should exist for ${id}`);

  assert.equal(
    showRead.status,
    listRead.status,
    `${label}: show status (${showRead.status}) does not match list status (${listRead.status})`,
  );
  assert.equal(
    listRead.status,
    moveRead.status,
    `${label}: list status (${listRead.status}) does not match move precondition status (${moveRead.status})`,
  );

  assert.equal(
    showRead.stage,
    listRead.stage,
    `${label}: show stage (${showRead.stage}) does not match list stage (${listRead.stage})`,
  );
  assert.equal(
    listRead.stage,
    moveRead.stage,
    `${label}: list stage (${listRead.stage}) does not match move precondition stage (${moveRead.stage})`,
  );

  assert.equal(
    showRead.stageEffective,
    listRead.stageEffective,
    `${label}: show stageEffective (${showRead.stageEffective}) does not match list stageEffective (${listRead.stageEffective})`,
  );
  assert.equal(
    listRead.stageEffective,
    moveRead.stageEffective,
    `${label}: list stageEffective (${listRead.stageEffective}) does not match move precondition stageEffective (${moveRead.stageEffective})`,
  );
}

test('show, list, and move precondition read paths report identical stage and status throughout approve transition', () => {
  const dir = tmpDir();
  initStore(dir);
  const id = 'tsk-test-38i';

  // 1. Initial state (todo)
  addWork(dir, {
    id,
    title: 'Test read path consistency',
    kind: 'feature',
    status: 'todo',
    stage: 'planning',
    deps: [],
    risk: 'light',
    refs: [],
    verify: 'npm test',
  });
  assertReadPathsAgree(dir, id, 'after addWork (todo)');

  // 2. Move to awaiting-approval
  moveWork(dir, {
    id,
    to: 'awaiting-approval',
    expectedStatus: 'todo',
  });
  assertReadPathsAgree(dir, id, 'after moveWork to awaiting-approval');

  // 3. Record gate approval
  recordGateApprove(dir, {
    id,
    gate: 'validateApprove',
    actor: 'human',
    verify: 'npm test',
  });
  assertReadPathsAgree(dir, id, 'after recordGateApprove');

  // 4. Drive through approve-like transition (moveWork to delivered + merge info)
  moveWork(dir, {
    id,
    to: 'delivered',
    expectedStatus: 'awaiting-approval',
    role: 'human',
    mergedSha: '0123456789abcdef0123456789abcdef01234567',
    mergedInto: 'main',
  });
  assertReadPathsAgree(dir, id, 'immediately after moveWork to delivered');

  // 5. Force store rebuild / refresh (simulating state refresh post merge)
  rebuild(dir);
  assertReadPathsAgree(dir, id, 'after store rebuild');
});

test('read path consistency holds when item is claimed then released prior to approve', () => {
  const dir = tmpDir();
  initStore(dir);
  const id = 'tsk-test-claim-38i';

  addWork(dir, {
    id,
    title: 'Test claim consistency',
    kind: 'feature',
    status: 'todo',
    deps: [],
    risk: 'light',
    refs: [],
    verify: 'npm test',
  });

  // Acquire claim (overlays 'doing' on listWork, durable state is 'todo')
  const claim = acquireClaim(dir, { id, actor: 'test-runner', claimRole: 'executor' });
  assert.equal(currentEffectiveView(dir).work[id].status, 'doing');

  // Move durable state from todo to awaiting-approval
  moveWork(dir, {
    id,
    to: 'awaiting-approval',
    expectedStatus: 'todo',
  });

  // Release claim
  releaseClaim(dir, { id, claimId: claim.claimId });
  assertReadPathsAgree(dir, id, 'after claim release in awaiting-approval');

  // Approve transition to delivered
  moveWork(dir, {
    id,
    to: 'delivered',
    expectedStatus: 'awaiting-approval',
    role: 'human',
    mergedSha: 'fedcba9876543210fedcba9876543210fedcba98',
    mergedInto: 'main',
  });
  assertReadPathsAgree(dir, id, 'after approve of released claim item');
});
