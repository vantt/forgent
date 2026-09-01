// Ad-hoc live-proof driver for P03.2 R8 (never committed elsewhere; copied
// here verbatim as evidence). Imports and calls ONLY
// src/runner/coordination/session-engine.mjs's DECLARED-path exports --
// openDeclaredProtocolSession / dispatchDeclaredOperation /
// recordConsultDisposition -- the same import chain a real production caller
// would use. No child_process, no dispatch.mjs CLI door, no other spawn
// path. Every executor dispatch below goes through
// session-engine.mjs -> createAndExecuteSessionTask() -> executeAssignment(),
// the ONLY execution entry point this engine ever calls.

import {
  openDeclaredProtocolSession,
  dispatchDeclaredOperation,
  recordConsultDisposition,
} from '/home/vantt/projects/forgentX/src/runner/coordination/session-engine.mjs';

const REPO_ROOT = '/home/vantt/projects/forgentX';
const DEFINITION_ID = 'core.coordination-protocol.declared-consult';
const coordinationId = process.argv[2];
const executorId = process.argv[3] || 'glm-cli';
const step = process.argv[4]; // 'open' | 'request' | 'provide' | 'disposition'
const fromAssignmentId = process.argv[5];
const consultantAssignmentId = process.argv[6];
const requesterAssignmentId = process.argv[7];

if (!coordinationId || !step) {
  console.error('usage: node p032-live-proof-driver-script.mjs <coordinationId> <executorId> <open|request|provide|disposition> [fromAssignmentId] [consultantAssignmentId] [requesterAssignmentId]');
  process.exit(2);
}

const opts = { cwd: REPO_ROOT, repoRoot: REPO_ROOT, timeoutMs: 180000 };

async function main() {
  if (step === 'open') {
    console.log('=== openDeclaredProtocolSession ===');
    const manifest = openDeclaredProtocolSession(
      {
        definitionId: DEFINITION_ID,
        coordinationId,
        objective: "Should we widen the retry budget for the ingest worker? Confirm using this repo's real package.json name/version as a bounded, verifiable fact.",
        writerId: 'p03-2-live-proof-coordinator',
      },
      { cwd: REPO_ROOT, repoRoot: REPO_ROOT },
    );
    console.log(JSON.stringify(manifest, null, 2));
    return;
  }

  if (step === 'request') {
    console.log(`=== dispatchDeclaredOperation(request-consult) via ${executorId} ===`);
    const request = await dispatchDeclaredOperation(
      coordinationId,
      {
        operationId: 'request-consult',
        objective:
          "Read this repo's package.json at the repository root and report its exact \"name\" and \"version\" fields as the factual basis for the retry-budget question.",
        expectedOutputs: [
          'agent-result.json with status:"done" and a summary naming the package name and version',
          'agent-report.md: a short human-readable report stating the exact name and version found',
        ],
        writerId: 'p03-2-live-proof-coordinator',
        cliPolicy: { preferExecutor: executorId, minTier: 'lightweight' },
      },
      opts,
    );
    console.log('request.assignment.assignmentId =', request.assignment.assignmentId);
    console.log('request.resumed =', request.resumed);
    console.log('request.runResult.status =', request.runResult.status, 'confidence =', request.runResult.confidence);
    console.log(JSON.stringify(request.runResult, null, 2));
    return;
  }

  if (step === 'provide') {
    if (!fromAssignmentId) throw new Error('provide step requires fromAssignmentId');
    console.log(`=== dispatchDeclaredOperation(provide-consult) via ${executorId} ===`);
    const provide = await dispatchDeclaredOperation(
      coordinationId,
      {
        operationId: 'provide-consult',
        objective:
          "Independently re-read package.json and confirm or correct the requester's reported name/version string, then advise whether widening the retry budget is reasonable.",
        expectedOutputs: [
          'agent-result.json with status:"done" and a summary confirming or correcting the version string',
          'agent-report.md: a short human-readable report stating the confirmed/corrected version string and advice',
        ],
        writerId: 'p03-2-live-proof-coordinator',
        fromAssignmentId,
        cliPolicy: { preferExecutor: executorId },
      },
      opts,
    );
    console.log('provide.assignment.assignmentId =', provide.assignment.assignmentId);
    console.log('provide.resumed =', provide.resumed);
    console.log('provide.runResult.status =', provide.runResult.status, 'confidence =', provide.runResult.confidence);
    console.log(JSON.stringify(provide.runResult, null, 2));
    return;
  }

  if (step === 'disposition') {
    if (!requesterAssignmentId || !consultantAssignmentId) throw new Error('disposition step requires requesterAssignmentId and consultantAssignmentId');
    console.log('=== recordConsultDisposition ===');
    const disposition = await recordConsultDisposition(
      coordinationId,
      {
        requesterAssignmentId,
        consultantAssignmentId,
        disposition: 'accepted',
        rationale: 'The consultant independently confirmed the package name/version and the retry-budget advice; accepted as-is.',
        writerId: 'p03-2-live-proof-coordinator',
      },
      opts,
    );
    console.log('disposition.assignment.assignmentId =', disposition.assignment.assignmentId);
    console.log('disposition.disposition =', disposition.disposition);
    console.log(JSON.stringify(disposition.runResult, null, 2));
    return;
  }

  throw new Error(`unknown step "${step}"`);
}

main().catch((err) => {
  console.error('LIVE PROOF SCRIPT ERROR:', err && err.stack ? err.stack : err);
  console.error('errorCategory =', err && err.category);
  process.exitCode = 1;
});
