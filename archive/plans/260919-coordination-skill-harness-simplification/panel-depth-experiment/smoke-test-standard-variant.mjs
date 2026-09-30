// smoke-test-standard-variant.mjs -- Unit I27 pre-flight step 6 (BEFORE any
// real-cost dispatch): a fake-executor smoke run of
// `core.coordination-protocol.architecture-advisory-panel-standard-v1`
// through the SAME public door the real experiment uses
// (`fgos coordination pack run`, via bin/fgos.mjs -- never a direct engine
// call), proving the explanation re-gate (post-synthesis-open, not
// post-redteam-open) and quorum/close actually work end-to-end for the new
// FlowDefinition. Fake/node executors only -- no real cost here. Run with:
//   node plans/260919-coordination-skill-harness-simplification/panel-depth-experiment/smoke-test-standard-variant.mjs
import fs from 'node:fs';
import path from 'node:path';
import {
  run,
  tmpCwdFromTemplate,
  envelopeData,
} from '../../../test/cli/helpers/fgos-cli-harness.mjs';

const PROTOCOL_ID = 'core.coordination-protocol.architecture-advisory-panel-standard-v1';
const OUTPUTS = ['agent-result.json (status, summary)'];

function opStep(as, operationId, targetActorId, overrides = {}) {
  return {
    type: 'operation',
    as,
    operationId,
    targetActorId,
    objective: `${operationId} pass for ${targetActorId}, dispatched through the pack gate (smoke test).`,
    expectedOutputs: OUTPUTS,
    ...overrides,
  };
}

function authorizeStep(as, operationId, targetActorId, { authorizationId, invocationKey, reason, grantedContextRefs = [] }) {
  return { type: 'authorize', as, operationId, targetActorId, authorizationId, invocationKey, reason, grantedContextRefs };
}

function contributionStep(as, overrides = {}) {
  return { type: 'contribution', as, roundKey: 'round-1', ...overrides };
}

function writeFakeExecutorConfig(cwd) {
  const script = path.join(cwd, 'fake-standard-variant-executor.mjs');
  fs.writeFileSync(
    script,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const assignmentsRoot = path.join(process.cwd(), '.fgos', 'assignments');
    if (fs.existsSync(assignmentsRoot)) {
      for (const asgn of fs.readdirSync(assignmentsRoot)) {
        const runsDir = path.join(assignmentsRoot, asgn, 'runs');
        if (!fs.existsSync(runsDir)) continue;
        for (const runId of fs.readdirSync(runsDir)) {
          const runDir = path.join(runsDir, runId);
          if (fs.existsSync(runDir) && !fs.existsSync(path.join(runDir, 'agent-result.json'))) {
            fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nSettled by smoke-test fake executor.\\n');
            fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Settled by smoke-test fake executor.' }));
          }
        }
      }
    }
    process.stdout.write('done\\n');
    `,
  );
  const configPath = path.join(cwd, '.fgos', 'config.json');
  const existing = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
  const config = {
    ...existing,
    runner: {
      ...(existing.runner ?? {}),
      executor: { allowCrossProvider: true, command: process.execPath, args: [script, '{prompt}'] },
      timeoutMs: 20000,
    },
  };
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function writeRequest(cwd, name, obj) {
  const requestPath = path.join(cwd, name);
  fs.writeFileSync(requestPath, JSON.stringify(obj, null, 2));
  return requestPath;
}

function packRun(cwd, requestPath, log) {
  const result = run(cwd, ['coordination', 'pack', 'run', '--protocol', PROTOCOL_ID, '--file', requestPath]);
  log.push(`\n$ fgos coordination pack run --protocol ${PROTOCOL_ID} --file ${path.basename(requestPath)}\nexit: ${result.status}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}\n`);
  if (result.status !== 0) {
    throw new Error(`pack run failed (exit ${result.status}): ${result.stderr}`);
  }
  return envelopeData(result.stdout);
}

function assignmentIdFor(data, as) {
  const step = data.steps.find((s) => s.as === as);
  if (!step || !step.assignmentId) throw new Error(`expected step "${as}" to carry an assignmentId`);
  return step.assignmentId;
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message} -- expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

async function main() {
  const log = [];
  const outDir = path.dirname(new URL(import.meta.url).pathname);
  try {
    await runScenario(log, outDir);
  } finally {
    fs.writeFileSync(path.join(outDir, 'smoke-test-standard-variant.log'), log.join('\n'));
  }
}

async function runScenario(log, outDir) {
  const cwd = tmpCwdFromTemplate();
  writeFakeExecutorConfig(cwd);
  const coordinationId = 'smoke_standard_variant_v1';
  const writerId = 'smoke-driver';

  // Call 1: framing + shaping (all "required"/unrestricted per the graph --
  // no authorize step needed).
  const req1 = writeRequest(cwd, 'req1-framing-shaping.json', {
    kind: 'declared-protocol',
    objective: 'Smoke test: framing + shaping.',
    writerId,
    coordinationId,
    protocolRef: { id: PROTOCOL_ID },
    close: true,
    aggregateBounds: { maxRounds: 20 },
    steps: [
      opStep('interpret', 'interpret-request', 'lead-advisor-actor'),
      opStep('investigate', 'investigate-context', 'context-investigator-actor'),
      opStep('shapeSystem', 'shape-system-proposal', 'system-shaper-actor'),
      contributionStep('linkSystem', { contributionId: 'p_system', contributionType: 'proposal', assignmentId: '$ref:shapeSystem' }),
      opStep('shapeAlt', 'shape-alternative-proposal', 'alternative-shaper-actor'),
      contributionStep('linkAlt', { contributionId: 'p_alt', contributionType: 'proposal', assignmentId: '$ref:shapeAlt' }),
      opStep('shapeConstraint', 'shape-constraint-proposal', 'constraint-advocate-actor'),
      contributionStep('linkConstraint', { contributionId: 'p_constraint', contributionType: 'proposal', assignmentId: '$ref:shapeConstraint' }),
    ],
  });
  const data1 = packRun(cwd, req1, log);
  assertEqual(data1.closed, false, 'call 1: session must stay open (critique/synthesis/explanation/close-dialogue all still owed)');
  const interpretId = assignmentIdFor(data1, 'interpret');
  const investigateId = assignmentIdFor(data1, 'investigate');
  const shapeSystemId = assignmentIdFor(data1, 'shapeSystem');
  const shapeAltId = assignmentIdFor(data1, 'shapeAlt');
  const shapeConstraintId = assignmentIdFor(data1, 'shapeConstraint');

  // Call 2: critique + assess-constraints (driver-authorized, gated on
  // post-shaping-open).
  const req2 = writeRequest(cwd, 'req2-critique.json', {
    kind: 'declared-protocol',
    objective: 'Smoke test: critique.',
    writerId,
    coordinationId,
    protocolRef: { id: PROTOCOL_ID },
    close: true,
    steps: [
      authorizeStep('authCritique', 'critique-proposals', 'architecture-critic-actor', {
        authorizationId: 'auth_critique', invocationKey: 'ik_critique_1',
        reason: 'post-shaping-open is open.',
        grantedContextRefs: [interpretId, investigateId, shapeSystemId, shapeAltId, shapeConstraintId],
      }),
      opStep('critique', 'critique-proposals', 'architecture-critic-actor'),
      contributionStep('linkCritique', { contributionId: 'o_critique', contributionType: 'objection', assignmentId: '$ref:critique', anchors: ['p_system', 'p_alt', 'p_constraint'] }),
      authorizeStep('authAssess', 'assess-constraints', 'constraint-advocate-actor', {
        authorizationId: 'auth_assess', invocationKey: 'ik_assess_1',
        reason: 'post-shaping-open is open.',
        grantedContextRefs: [shapeSystemId, shapeAltId, shapeConstraintId],
      }),
      opStep('assess', 'assess-constraints', 'constraint-advocate-actor'),
      contributionStep('linkAssess', { contributionId: 'o_assess', contributionType: 'objection', assignmentId: '$ref:assess', anchors: ['p_system', 'p_alt', 'p_constraint'] }),
    ],
  });
  const data2 = packRun(cwd, req2, log);
  assertEqual(data2.closed, false, 'call 2: session must stay open');
  const critiqueId = assignmentIdFor(data2, 'critique');
  const assessId = assignmentIdFor(data2, 'assess');

  // Call 3: synthesis, gated on post-critique-open. THE KEY DIVERGENCE: no
  // red-team call exists in this variant at all.
  const req3 = writeRequest(cwd, 'req3-synthesis.json', {
    kind: 'declared-protocol',
    objective: 'Smoke test: synthesis (no red-team in this variant).',
    writerId,
    coordinationId,
    protocolRef: { id: PROTOCOL_ID },
    close: true,
    steps: [
      authorizeStep('authSynth', 'synthesize-recommendation', 'synthesizer-actor', {
        authorizationId: 'auth_synth', invocationKey: 'ik_synth_1',
        reason: 'post-critique-open is open.',
        grantedContextRefs: [interpretId, investigateId, shapeSystemId, shapeAltId, shapeConstraintId, critiqueId, assessId],
      }),
      opStep('synth', 'synthesize-recommendation', 'synthesizer-actor'),
      contributionStep('linkSynth', { contributionId: 'r_synth', contributionType: 'response', assignmentId: '$ref:synth', respondsTo: 'o_critique', anchors: ['o_critique', 'o_assess'] }),
    ],
  });
  const data3 = packRun(cwd, req3, log);
  assertEqual(data3.closed, false, 'call 3: session must stay open (explanation/close-dialogue still owed)');
  const synthId = assignmentIdFor(data3, 'synth');

  // Call 4: explanation, gated DIRECTLY on post-synthesis-open (the
  // explanation re-gate this unit's whole scope depends on -- never
  // post-redteam-open, which does not exist in this variant).
  const req4 = writeRequest(cwd, 'req4-explanation.json', {
    kind: 'declared-protocol',
    objective: 'Smoke test: explanation re-gated on post-synthesis-open.',
    writerId,
    coordinationId,
    protocolRef: { id: PROTOCOL_ID },
    close: true,
    steps: [
      authorizeStep('authExplain', 'explain-recommendation', 'lead-advisor-actor', {
        authorizationId: 'auth_explain', invocationKey: 'ik_explain_1',
        reason: 'post-synthesis-open is open (this variant re-gates explanation directly on synthesis, skipping red-team).',
        grantedContextRefs: [synthId],
      }),
      opStep('explain', 'explain-recommendation', 'lead-advisor-actor'),
    ],
  });
  const data4 = packRun(cwd, req4, log);
  assertEqual(data4.closed, false, 'call 4: lead-advisor-actor still owes close-dialogue');
  const explainId = assignmentIdFor(data4, 'explain');

  // Call 5: driver's own explicit close-dialogue -- the only thing that can
  // bring quorum, and therefore the session, to completion.
  const req5 = writeRequest(cwd, 'req5-close.json', {
    kind: 'declared-protocol',
    objective: 'Smoke test: close-dialogue.',
    writerId,
    coordinationId,
    protocolRef: { id: PROTOCOL_ID },
    close: true,
    steps: [
      authorizeStep('authClose', 'close-dialogue', 'lead-advisor-actor', {
        authorizationId: 'auth_close', invocationKey: 'ik_close_1',
        reason: 'post-explanation-open is open and no further reopen is needed.',
        grantedContextRefs: [explainId],
      }),
      opStep('closeDialogue', 'close-dialogue', 'lead-advisor-actor'),
    ],
  });
  const data5 = packRun(cwd, req5, log);
  assertEqual(data5.closed, true, 'call 5: every gating binding, including close-dialogue, is now settled');

  // Structural proof: no red-team actor ever appears in this session's own
  // quorum, at any point -- the variant's whole point.
  const quorumActorIds = data5.quorum ? data5.quorum.requiredActorIds ?? [] : [];
  if (quorumActorIds.includes('red-team-actor')) {
    throw new Error('FAIL: red-team-actor must never appear in the standard variant\'s own quorum');
  }
  assertEqual(quorumActorIds.length, 7, 'exactly 7 required actors (no red-team-actor, no specialist -- optional slot)');

  const summary = `# Smoke test: architecture-advisory-panel-standard-v1

Fake-executor end-to-end run through the real public door
(\`fgos coordination pack run\`), proving:

- The explanation re-gate works: \`explain-recommendation\` dispatches
  directly off \`post-synthesis-open\` with no \`post-redteam-open\` window
  and no red-team dispatch anywhere in the chain.
- Quorum/close works: 5 separate CLI calls (park/resume across each),
  session reaches \`closed: true\` only once \`close-dialogue\` settles.
- Required actors at close: ${JSON.stringify(quorumActorIds)} (7, no red-team-actor).

Coordination id: \`${coordinationId}\`
Temp cwd: \`${cwd}\`

Result: PASS. See smoke-test-standard-variant.log for the full raw CLI
transcript (every request/response pair).
`;
  fs.writeFileSync(path.join(outDir, 'smoke-test-standard-variant-result.md'), summary);
  process.stdout.write(summary);
}

main().catch((err) => {
  process.stderr.write(`SMOKE TEST FAILED: ${err.stack || err.message}\n`);
  process.exitCode = 1;
});
