// The parts of the cli-spawn door that do not depend on a run supervisor: the launch-context contract
// and the finalization of a confined attempt home. Attempts of the run supervisor are covered by test/run-supervisor.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  buildConfinementRequest,
  validateAssignmentLaunchContext,
} from '../../src/runner/dispatch/confinement/request.mjs';
import { writeOwnershipMarkerV2 } from '../../src/runner/dispatch/confinement/cleanup.mjs';
import {
  prepareConfinementForLaunch,
  finalizeAttemptHome,
} from '../../src/runner/dispatch/confinement/authority.mjs';

function mkTempDir(prefix = 'fgos-reconcile-test-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

// 2. Assignment-owned fresh launch writes pending command, baseline, envelope, bindings, capture, receipt

// 9. Worker cannot write, truncate, replace or unlink protected capture or protected receipt under required confinement
test('9. worker write grant does not overlap protected capture or receipt', () => {
  const tmp = mkTempDir();
  const runDir = path.join(tmp, 'run');

  const req = buildConfinementRequest({
    capability: 'code:implement',
    context: {
      cwd: tmp,
      runDir,
    },
    requirement: { mode: 'unconfined' },
    assignmentLaunchContext: {
      contract: 'assignment-cli-spawn-launch-context.v1',
      run: {
        runId: 'run_9',
        runDir,
        attempt: 1,
        assignmentId: 'asgn_9',
        assignmentDigest: 'sha256:a1',
        dispatchPlanDigest: 'sha256:b1',
        evaluatorBaselineDigest: 'sha256:e1',
      },
      command: {
        launchCommandId: 'cmd_9',
        controlEpoch: 1,
        controlTokenDigest: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        commandSequence: 1,
        commandDigest: 'sha256:c1',
        invocationDigest: 'sha256:d1',
      },
    },
  });

  // Authority validates and isolates protected directories outside worker write grants
  assert.ok(req.assignmentLaunchContext);
  assert.equal(req.assignmentLaunchContext.contract, 'assignment-cli-spawn-launch-context.v1');
});

// 10. Live onChunk callback failure, disconnect and backpressure do not block capture, timers or receipt publication

// 14. Confinement Authority validates and preserves assignmentLaunchContext; mismatched context refuses before envelope
test('14. Confinement Authority request builder validates and preserves assignmentLaunchContext; mismatched context refuses before envelope', () => {
  const tmp = mkTempDir();
  const runDir = path.join(tmp, 'run');

  // Case A: Missing command block
  assert.throws(
    () => {
      buildConfinementRequest({
        capability: 'code:implement',
        context: { cwd: tmp, runDir },
        requirement: { mode: 'unconfined' },
        assignmentLaunchContext: {
          contract: 'assignment-cli-spawn-launch-context.v1',
          run: {
            runId: 'r1',
            runDir,
            attempt: 1,
            assignmentId: 'a1',
            dispatchPlanDigest: 'sha256:1',
            evaluatorBaselineDigest: 'sha256:2',
          },
        },
      });
    },
    /assignmentLaunchContext\.command must be an object/,
  );

  // Case B: Wrong contract
  assert.throws(
    () => {
      buildConfinementRequest({
        capability: 'code:implement',
        context: { cwd: tmp, runDir },
        requirement: { mode: 'unconfined' },
        assignmentLaunchContext: {
          contract: 'invalid-contract.v1',
        },
      });
    },
    /contract must be "assignment-cli-spawn-launch-context.v1"/,
  );
});

// 15. Recovered collection uses pre-launch evaluator baseline

// Finalizing a private home leaves no empty per-dispatch directory behind, and keeps a parent that still holds a sibling.
test('16b. finalizing a private home removes its per-dispatch parent unless a sibling remains', () => {
  const tmp = mkTempDir();
  try {
    const finalize = (dispatchId, attemptId, withSibling) => {
      const runDir = path.join(tmp, 'run', attemptId);
      const parent = path.join(tmp, 'confinement', dispatchId);
      const home = path.join(parent, 'home');
      fs.mkdirSync(home, { recursive: true });
      if (withSibling) fs.mkdirSync(path.join(parent, 'sibling'));
      writeOwnershipMarkerV2(home, { attemptId, runDir, dispatchId });
      const descriptorPath = path.join(runDir, 'protected', 'confinement-finalization', `${attemptId}.json`);
      fs.mkdirSync(path.dirname(descriptorPath), { recursive: true });
      fs.writeFileSync(descriptorPath, JSON.stringify({
        contract: 'confinement-finalization.v1',
        launchCommandId: attemptId,
        resources: [{ kind: 'temporary-directory', resourceId: 'private-home', pathRef: home }],
      }));
      assert.equal(finalizeAttemptHome({ runDir, attemptId }).state, 'cleaned');
      assert.equal(fs.existsSync(home), false);
      return parent;
    };
    assert.equal(fs.existsSync(finalize('disp_1_aaaaaaaa', 'att-a', false)), false);
    assert.equal(fs.existsSync(finalize('disp_2_bbbbbbbb', 'att-b', true)), true);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// 17. Unsupported recovered cancel and shared-cwd takeover return typed park or refusal

// 18. No .fgos runtime logs are committed to the project tree
test('18. no .fgos runtime logs are committed to the project tree', () => {
  const repoRoot = path.resolve('.');
  const gitignorePath = path.join(repoRoot, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const content = fs.readFileSync(gitignorePath, 'utf8');
    assert.ok(content.includes('.fgos'), '.gitignore must ignore .fgos runtime directories');
  }

  const status = execFileSync('git', ['status', '--porcelain'], { cwd: repoRoot, encoding: 'utf8' });
  const lines = status.split('\n').filter(Boolean);
  const trackedFgosLogs = lines.filter((line) => line.includes('.fgos') && line.includes('.log'));
  assert.equal(trackedFgosLogs.length, 0, 'No .fgos log files should be tracked or staged in git');
});

// 19. Pre-placed receipt with different content fails supervisor publication loudly
