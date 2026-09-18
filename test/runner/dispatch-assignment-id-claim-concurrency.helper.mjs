// Worker helper for dispatch-assignment-id-claim-concurrency.test.mjs: a real,
// separate node process that claims one assignmentId under a shared prefix
// (same writerId-derived work token, same operation) and reports the claimed
// id plus a proof marker it wrote inside its own claimed directory.
//
// Usage: node <this file> <assignmentsDir> <writerId> <operation> <readyFile> <goFile>

import fs from 'node:fs';
import path from 'node:path';
import { buildAssignment, claimAssignmentId } from '../../src/runner/dispatch/assignment.mjs';

const [, , assignmentsDir, writerId, operation, readyFile, goFile] = process.argv;

fs.writeFileSync(readyFile, String(process.pid));

const deadline = Date.now() + 10000;
while (!fs.existsSync(goFile) && Date.now() < deadline) {
  // Busy-wait synchronously (no await point) -- keeps both processes primed
  // right up to the release signal instead of drifting apart on an event-loop
  // tick, maximizing genuine overlap of the claim below.
}

const contract = {
  objective: `race-claim by ${process.pid}`,
  contextRefs: [],
  constraints: [],
  expectedOutputs: ['agent-result.json (status, summary)'],
  mutation: 'read-only',
  evidence: { required: 'reported' },
  role: 'researcher',
  budget: { timeoutMs: 60000, maxRuns: 1 },
};

const assignment = claimAssignmentId(
  () =>
    buildAssignment({
      workId: null,
      provenance: { kind: 'inline', contract, caller: { writerId } },
      options: { assignmentsDir },
    }),
  assignmentsDir,
);

// Prove this process's own claim is genuinely exclusive: write a marker file
// carrying this PID inside the directory it claimed, then read it back --
// if another process's write ever landed in the SAME directory (an id
// collision), this readback would see the OTHER pid instead of its own.
const markerPath = path.join(assignmentsDir, assignment.assignmentId, 'claimed-by.json');
fs.writeFileSync(markerPath, JSON.stringify({ pid: process.pid }));
const readBack = JSON.parse(fs.readFileSync(markerPath, 'utf8'));

process.stdout.write(JSON.stringify({ assignmentId: assignment.assignmentId, pid: process.pid, readBackPid: readBack.pid }));
