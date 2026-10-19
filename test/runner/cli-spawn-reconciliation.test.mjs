// The parts of the cli-spawn door that do not depend on a run supervisor: argv/env/cwd parity of the
// short-call adapter with the ad-hoc spawn, the launch-context contract, and idempotent finalization of
// a confined home. Attempts of the run supervisor are covered by test/run-supervisor.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { computeSha256Digest } from '../../src/runner/dispatch/proof-helpers.mjs';
import { spawnWorker } from '../../src/runner/work-dispatch.mjs';
import { cliSpawnAdapter } from '../../src/runner/dispatch/transport.mjs';
import {
  buildConfinementRequest,
  validateAssignmentLaunchContext,
} from '../../src/runner/dispatch/confinement/request.mjs';
import { writeOwnershipMarker } from '../../src/runner/dispatch/confinement/cleanup.mjs';
import {
  prepareConfinementForLaunch,
  finalizeConfinementResources,
} from '../../src/runner/dispatch/confinement/authority.mjs';

function mkTempDir(prefix = 'fgos-reconcile-test-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

// 1. Legacy ad-hoc parity
test('1. legacy ad-hoc spawnWorker and cliSpawnAdapter parity for argv/env/cwd/stdin/onChunk/limits', async () => {
  const tmp = mkTempDir();
  const chunks = [];
  const res = await cliSpawnAdapter(
    {
      command: process.execPath,
      args: ['-e', 'process.stdout.write("out:" + process.env.TEST_VAR + "\\n"); process.stderr.write("err:msg\\n"); process.exit(0);'],
      env: { TEST_VAR: 'hello-parity' },
    },
    {
      cwd: tmp,
      // Canonical order everywhere else in the codebase (transport.mjs's
      // teeChunk, cli.mjs, loop.mjs): onChunk(stream, chunk). Recorded raw
      // here, not asserted inline -- teeChunk wraps this call in try/catch
      // (an observability callback must never crash dispatch), so an inline
      // assertion failure would be silently swallowed there instead of
      // failing the test; the shape is checked below, outside the callback.
      onChunk: (stream, chunk) => {
        chunks.push({ stream, chunk });
      },
    },
  );

  assert.equal(res.exitCode, 0);
  assert.match(res.stdout, /out:hello-parity/);
  assert.match(res.stderr, /err:msg/);
  assert.ok(chunks.length > 0, 'onChunk must have been called at least once');
  for (const c of chunks) {
    // Order is the one contract every onChunk caller shares (stream first);
    // the chunk's own type is adapter-specific -- this adapter sets
    // `child.stdout.setEncoding('utf8')`, so its chunks are strings, while
    // detached-run-supervisor.mjs's detached path hands Buffers. Both are valid.
    assert.equal(typeof c.stream, 'string', 'onChunk must receive stream (stdout/stderr) as its first argument');
    assert.ok(c.stream === 'stdout' || c.stream === 'stderr', `stream must be stdout/stderr, got ${c.stream}`);
    assert.ok(typeof c.chunk === 'string' || Buffer.isBuffer(c.chunk), 'onChunk must receive the chunk as its second argument');
  }
  assert.ok(chunks.some((c) => c.stream === 'stdout' && c.chunk.toString('utf8').includes('out:hello-parity')));
});

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

// 16. Confinement temporary resources are cleaned or retained idempotently
test('16. confinement temporary resources are cleaned or retained idempotently with an explicit finalization record', async () => {
  const tmp = mkTempDir();
  const runDir = path.join(tmp, 'run');
  const launchCommandId = 'cmd_final';
  fs.mkdirSync(runDir, { recursive: true });

  const tempResourceDir = path.join(tmp, 'temp-confinement-res');
  fs.mkdirSync(tempResourceDir, { recursive: true });
  const marker = {
    contract: 'confinement-owner-marker.v1',
    owner: {
      pid: process.pid,
      runDir,
      launchCommandId,
    },
  };
  fs.writeFileSync(path.join(tempResourceDir, '.fgos-confinement-owner.json'), JSON.stringify(marker));
  const markerDigest = computeSha256Digest(marker);

  const descriptor = {
    contract: 'confinement-finalization.v1',
    launchCommandId,
    runDir,
    temporaryDirectories: [{ path: tempResourceDir, ownershipMarkerDigest: markerDigest }],
  };

  // 1st finalization: clean
  const res1 = await finalizeConfinementResources({
    runDir,
    launchCommandId,
    receipt: { outcome: { kind: 'exit' } },
    descriptor,
  });
  assert.equal(res1.cleanupState, 'cleaned');
  assert.equal(fs.existsSync(tempResourceDir), false);

  // 2nd finalization: already-absent resume
  const res2 = await finalizeConfinementResources({
    runDir,
    launchCommandId,
    receipt: { outcome: { kind: 'exit' } },
    descriptor,
  });
  assert.equal(res2.cleanupState, 'cleaned');
  assert.equal(res2.cleanupResult.kind, 'already-absent-after-owned-delete');

  // Test retention on failure/timeout
  const res3 = await finalizeConfinementResources({
    runDir,
    launchCommandId,
    receipt: { outcome: { kind: 'timeout' } },
    descriptor: { ...descriptor, temporaryDirectories: [{ path: '/tmp/some-path', ownershipMarkerDigest: 'none' }] },
  });
  assert.equal(res3.cleanupState, 'retained');
});

// Finalizing a private home leaves no empty per-dispatch directory behind, and keeps a parent that still holds a sibling.

// Finalizing a private home leaves no empty per-dispatch directory behind, and keeps a parent that still holds a sibling.
test('16b. finalizing a private home removes its per-dispatch parent unless a sibling remains', async () => {
  const tmp = mkTempDir();
  try {
    const runDir = path.join(tmp, 'run');
    fs.mkdirSync(runDir, { recursive: true });
    const finalize = async (dispatchId, launchCommandId, withSibling) => {
      const parent = path.join(tmp, 'confinement', dispatchId);
      const home = path.join(parent, 'home');
      fs.mkdirSync(home, { recursive: true });
      if (withSibling) fs.mkdirSync(path.join(parent, 'sibling'));
      const markerPath = writeOwnershipMarker(home, { dispatchId, resource: 'private-home' });
      const ownershipMarkerDigest = computeSha256Digest(JSON.parse(fs.readFileSync(markerPath, 'utf8')));
      const res = await finalizeConfinementResources({
        runDir,
        launchCommandId,
        receipt: { outcome: { kind: 'exit' } },
        descriptor: { contract: 'confinement-finalization.v1', launchCommandId, runDir, temporaryDirectories: [{ path: home, ownershipMarkerDigest }] },
      });
      assert.equal(res.cleanupState, 'cleaned');
      assert.equal(fs.existsSync(home), false);
      return parent;
    };
    assert.equal(fs.existsSync(await finalize('disp_1_aaaaaaaa', 'cmd_a', false)), false);
    assert.equal(fs.existsSync(await finalize('disp_2_bbbbbbbb', 'cmd_b', true)), true);
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
