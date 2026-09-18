// Ad-hoc live-proof driver for P01.2 (never committed). Imports and calls
// ONLY src/runner/coordination/session-engine.mjs's exported functions --
// the same import chain a real production caller would use. No
// child_process, no dispatch.mjs CLI door, no other spawn path.

import {
  openStandaloneSession,
  dispatchPrimaryTask,
  proposeConsult,
  resumeSession,
} from '/home/vantt/projects/forgentX/src/runner/coordination/session-engine.mjs';

const REPO_ROOT = '/home/vantt/projects/forgentX';
const coordinationId = process.argv[2];
const executorId = process.argv[3] || 'codex-cli';
const mode = process.argv[4] || 'full'; // 'full' (open+primary+consult) | 'resume' (re-invoke only)
const modelOverride = process.argv[5]; // optional -- bypasses resolvePolicyTierModel's tier-table lookup (assignment-policy.mjs: `if (cliOverride.model)` short-circuits it)

if (!coordinationId) {
  console.error('usage: node p012-live-proof.mjs <coordinationId> <executorId> [full|resume] [modelOverride]');
  process.exit(2);
}

const execOpts = {
  cwd: REPO_ROOT,
  repoRoot: REPO_ROOT,
  cliOverride: { preferExecutor: executorId, ...(modelOverride ? { model: modelOverride } : {}) },
  timeoutMs: 180000,
};

async function main() {
  if (mode === 'full') {
    console.log('=== STEP 1: openStandaloneSession ===');
    const manifest = openStandaloneSession(
      {
        coordinationId,
        objective: "Read this repo's package.json and report its name and version.",
        writerId: 'p01-2-live-proof-coordinator',
        primaryRole: 'researcher',
      },
      { cwd: REPO_ROOT, repoRoot: REPO_ROOT },
    );
    console.log(JSON.stringify(manifest, null, 2));
  } else {
    console.log('=== STEP 1 (resume mode): session already open, skipping openStandaloneSession ===');
  }

  console.log(`\n=== STEP 2: dispatchPrimaryTask via ${executorId} ===`);
  const primary = await dispatchPrimaryTask(
    coordinationId,
    {
      objective: 'Read package.json at the repository root and report its exact "name" and "version" fields.',
      expectedOutputs: [
        'agent-result.json with status:"done" and a summary naming the package name and version',
        'agent-report.md: a short human-readable report stating the exact name and version found',
      ],
      evidenceRequired: 'reported',
      writerId: 'p01-2-live-proof-coordinator',
    },
    execOpts,
  );
  console.log('primary.assignment.assignmentId =', primary.assignment.assignmentId);
  console.log('primary.resumed =', primary.resumed);
  console.log('primary.runResult.status =', primary.runResult.status, 'confidence =', primary.runResult.confidence);
  console.log(JSON.stringify(primary.runResult, null, 2));

  if (primary.runResult.status !== 'done') {
    console.log('\nPRIMARY DID NOT COMPLETE -- stopping before consult (honest partial, not proceeding).');
    process.exitCode = 1;
    return;
  }

  console.log(`\n=== STEP 3: proposeConsult (reviewer) via ${executorId} ===`);
  const consult = await proposeConsult(
    coordinationId,
    {
      primaryAssignmentId: primary.assignment.assignmentId,
      role: 'reviewer',
      objective:
        "Independently re-read package.json and confirm or correct the primary investigator's reported name/version string.",
      contextRefs: [primary.assignment.assignmentId],
      expectedOutputs: [
        'agent-result.json with status:"done" and a summary confirming or correcting the version string',
        'agent-report.md: a short human-readable report stating the confirmed/corrected version string',
      ],
      evidenceRequired: 'reported',
      writerId: 'p01-2-live-proof-coordinator',
    },
    execOpts,
  );
  console.log('consult.assignment.assignmentId =', consult.assignment.assignmentId);
  console.log('consult.resumed =', consult.resumed);
  console.log('consult.runResult.status =', consult.runResult.status, 'confidence =', consult.runResult.confidence);
  console.log(JSON.stringify(consult.runResult, null, 2));

  console.log('\n=== STEP 4: resumeSession view (replaySession) ===');
  const view = resumeSession(coordinationId, { cwd: REPO_ROOT, repoRoot: REPO_ROOT });
  console.log(
    JSON.stringify(
      { manifest: view.manifest, assignmentRefs: view.assignmentRefs, eventTypes: view.events.map((e) => e.type) },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error('LIVE PROOF SCRIPT ERROR:', err && err.stack ? err.stack : err);
  process.exitCode = 1;
});
