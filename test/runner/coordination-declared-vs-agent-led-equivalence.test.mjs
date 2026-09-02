// Phase 03 R7: run ONE bounded question once through the agent-led consult
// path (openStandaloneSession -> dispatchPrimaryTask -> proposeConsult,
// Phase 01) and once through the declared CoordinationProtocol path
// (openDeclaredProtocolSession -> dispatchDeclaredOperation against the real
// `core/coordination-protocols/declared-consult.yaml` fixture, Phase 03),
// using the same role-class/evidence requirements and the same trusted
// (`cliOverride`/`cliPolicy`) minTier preference for both. A deterministic
// comparator normalizes both resulting records, stripping every field this
// requirement itself names as EXPECTED and LEGITIMATE to differ (protocol
// provenance scope/id labels, topology-specific role vocabulary, real
// assignment ids/timestamps) and keeping only what must NOT differ: the
// Assignment/Run/RunResult/evidence CONFIDENCE RULES (mutation, evidence
// required, RunResult status/confidence, governance/tier resolved VALUES).
//
// Same real-subprocess fake-executor pattern every other coordination test
// file in this suite uses -- never a JS-level stub over executeAssignment.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  openStandaloneSession,
  dispatchPrimaryTask,
  proposeConsult,
  openDeclaredProtocolSession,
  dispatchDeclaredOperation,
} from '../../src/runner/coordination/session-engine.mjs';

const DEFINITION_ID = 'core.coordination-protocol.declared-consult';
const BOUNDED_QUESTION = 'Should we widen the retry budget for the ingest worker?';
const CONSULT_QUESTION = 'Review the proposed retry budget change.';
const EXPECTED_OUTPUTS = ['agent-result.json (status, summary)'];

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-coordination-equivalence-test-'));
}

// Same shape as every other coordination test file's own fakeExecutor(): a
// real subprocess that writes agent-report.md/agent-result.json into
// whichever run dir the real executeExecutorCli path created.
function fakeExecutor(tempDir) {
  const executorScript = path.join(tempDir, `fake-executor-${Math.random().toString(36).slice(2)}.mjs`);
  fs.writeFileSync(
    executorScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const cwd = process.cwd();
    const assignmentsRoot = path.join(cwd, '.fgos', 'assignments');
    if (fs.existsSync(assignmentsRoot)) {
      for (const asgn of fs.readdirSync(assignmentsRoot)) {
        const runsDir = path.join(assignmentsRoot, asgn, 'runs');
        if (!fs.existsSync(runsDir)) continue;
        for (const run of fs.readdirSync(runsDir)) {
          const runDir = path.join(runsDir, run);
          if (fs.existsSync(runDir) && !fs.existsSync(path.join(runDir, 'agent-result.json'))) {
            fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nValidated.\\n');
            fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Validated.' }));
          }
        }
      }
    }
    process.stdout.write('Validated.\\n');
    process.exit(0);
    `,
  );
  return {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    models: { standard: 'test-model', lightweight: 'test-model', creative: 'test-model', analytical: 'test-model', critical: 'test-model' },
    timeoutMs: 5000,
  };
}

/**
 * Strip everything R7 itself names as expected/legitimate to differ between
 * the two dispatch modes (real assignment id, real timestamps, protocol-
 * provenance scope/id labels, topology-specific role vocabulary, the
 * literal id of whichever upstream Assignment a contextRef points at) and
 * keep only the fields this requirement actually governs.
 */
function normalizeDispatchRecord({ assignment, runResult }) {
  const contract = assignment.provenance.inline.contract;
  return {
    assignment: {
      mutation: assignment.mutation,
      contractMutation: contract.mutation,
      evidenceRequired: contract.evidence.required,
      budgetMaxRuns: contract.budget.maxRuns,
      hasUpstreamContextRef: contract.contextRefs.length > 0,
    },
    runResult: {
      status: runResult.status,
      confidence: runResult.confidence,
      governanceValue: runResult.policy?.provenance?.governance?.value,
      tierValue: runResult.policy?.provenance?.tier?.value,
    },
  };
}

test('R7: one bounded question dispatched once agent-led and once declared produces IDENTICAL normalized Assignment/Run/RunResult/evidence confidence rules -- protocol-provenance/topology fields legitimately differ and are stripped before comparing', async () => {
  const tempDir = mkTempDir();
  const runnerConfig = fakeExecutor(tempDir);
  // Deliberately NOT the system default tier (R3's own precedent, this same
  // test file's cousin, uses "critical" for the identical reason): a tier
  // equal to the default never actually exercises the override mechanism,
  // since raising to an already-resolved value produces source "default"
  // regardless of whether a caller supplied it at all.
  const TRUSTED_TIER = 'critical';

  // ── Mode 1: agent-led (Phase 01) -- openStandaloneSession -> dispatchPrimaryTask -> proposeConsult
  openStandaloneSession(
    { coordinationId: 'coord_equiv_agent_led', objective: BOUNDED_QUESTION, writerId: 'coordinator-1', primaryRole: 'researcher' },
    { cwd: tempDir },
  );
  const agentPrimary = await dispatchPrimaryTask(
    'coord_equiv_agent_led',
    { objective: BOUNDED_QUESTION, expectedOutputs: EXPECTED_OUTPUTS, evidenceRequired: 'reported', writerId: 'coordinator-1' },
    { cwd: tempDir, repoRoot: tempDir, runnerConfig, cliOverride: { minTier: TRUSTED_TIER } },
  );
  const agentConsult = await proposeConsult(
    'coord_equiv_agent_led',
    {
      primaryAssignmentId: agentPrimary.assignment.assignmentId,
      role: 'reviewer',
      objective: CONSULT_QUESTION,
      contextRefs: [agentPrimary.assignment.assignmentId],
      expectedOutputs: EXPECTED_OUTPUTS,
      evidenceRequired: 'reported',
      writerId: 'coordinator-1',
    },
    { cwd: tempDir, repoRoot: tempDir, runnerConfig, cliOverride: { minTier: TRUSTED_TIER } },
  );

  // ── Mode 2: declared (Phase 03) -- openDeclaredProtocolSession -> request-consult -> provide-consult
  openDeclaredProtocolSession(
    { definitionId: DEFINITION_ID, coordinationId: 'coord_equiv_declared', objective: BOUNDED_QUESTION, writerId: 'coordinator-1' },
    { cwd: tempDir },
  );
  const declaredRequest = await dispatchDeclaredOperation(
    'coord_equiv_declared',
    {
      operationId: 'request-consult',
      objective: BOUNDED_QUESTION,
      expectedOutputs: EXPECTED_OUTPUTS,
      writerId: 'coordinator-1',
      cliPolicy: { minTier: TRUSTED_TIER },
    },
    { cwd: tempDir, repoRoot: tempDir, runnerConfig },
  );
  const declaredProvide = await dispatchDeclaredOperation(
    'coord_equiv_declared',
    {
      operationId: 'provide-consult',
      objective: CONSULT_QUESTION,
      expectedOutputs: EXPECTED_OUTPUTS,
      writerId: 'coordinator-1',
      fromAssignmentId: declaredRequest.assignment.assignmentId,
      cliPolicy: { minTier: TRUSTED_TIER },
    },
    { cwd: tempDir, repoRoot: tempDir, runnerConfig },
  );

  // Both modes actually ran through the shared execution core and settled.
  assert.equal(agentPrimary.resumed, false);
  assert.equal(agentConsult.resumed, false);
  assert.equal(declaredRequest.resumed, false);
  assert.equal(declaredProvide.resumed, false);

  // The comparator's own claim: normalized primary/request records match,
  // and normalized consult/provide records match -- despite one mode using
  // READ_ONLY_ROLES vocabulary ("researcher"/"reviewer") and the other using
  // protocol-declared vocabulary ("requester"/"consultant"), different real
  // assignment ids, and different policy-provenance scope labels.
  assert.deepEqual(normalizeDispatchRecord(agentPrimary), normalizeDispatchRecord(declaredRequest));
  assert.deepEqual(normalizeDispatchRecord(agentConsult), normalizeDispatchRecord(declaredProvide));

  // Explicit, named confidence-rule assertions (assignment-run-runresult.md's
  // own vocabulary) -- not merely a deep-equal-shaped coincidence: in BOTH
  // modes, mutation stays read-only, evidence required stays "reported" (the
  // bounded question never requires independently-checkable verification),
  // and settling never silently upgrades either result to "verified".
  for (const record of [agentPrimary, agentConsult, declaredRequest, declaredProvide]) {
    assert.equal(record.assignment.mutation, 'read-only');
    assert.equal(record.assignment.provenance.inline.contract.evidence.required, 'reported');
    assert.equal(record.runResult.status, 'done');
    assert.notEqual(record.runResult.confidence, 'verified');
    assert.equal(record.runResult.policy.provenance.governance.value, 'allowed');
    assert.equal(record.runResult.policy.provenance.tier.value, TRUSTED_TIER);
  }

  // Proves the comparator is not vacuously trivial: the fields it strips
  // really do differ between the two modes for the SAME logical consult
  // step, so the deepEqual above is a genuine, non-coincidental match on the
  // fields that remain.
  assert.notEqual(agentConsult.assignment.role, declaredProvide.assignment.role);
  assert.notEqual(agentConsult.assignment.assignmentId, declaredProvide.assignment.assignmentId);
  assert.notEqual(
    agentConsult.runResult.policy.provenance.tier.source.scope,
    declaredProvide.runResult.policy.provenance.tier.source.scope,
  );
});
