// Records the golden vectors of the Rust run-result module (packages/execution/engine/src/run_result/) by running
// the Node modules it ports: src/runner/dispatch/{run-result,evidence-attribution,agent-result-claim-contract}.mjs.
// Run: node test/golden-recorders/run-result.recorder.mjs
// Writes under packages/execution/contracts/run-result/: writer.json, readers.json, attribution.json, claim.json.
//
// The outcome derivation lives in the Run Result crate behind the native door, which a checkout does not ship. The
// recorder loads the addon of the activated release (the main checkout's activation) through the door's descriptor
// entry, so the vectors carry the derivation Node uses today.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const outDir = path.join(root, 'packages', 'execution', 'contracts', 'run-result');
fs.mkdirSync(outDir, { recursive: true });

const write = (name, body) => fs.writeFileSync(path.join(outDir, name), `${JSON.stringify(body, null, 2)}\n`);

// The native door: the installed release's addon, found through the main checkout's activation record.
const common = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { cwd: root, encoding: 'utf8' }).trim();
const activation = JSON.parse(fs.readFileSync(path.join(path.dirname(common), '.fgos', 'installation', 'activation.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(activation.releasePath, 'manifest.json'), 'utf8'));
const door = await import(path.join(root, 'src', 'native', 'door.mjs'));
door.loadNativeAddon({ descriptor: { manifest, releaseRoot: activation.releasePath } });

const rr = await import(path.join(root, 'src', 'runner', 'dispatch', 'run-result.mjs'));
const attribution = await import(path.join(root, 'src', 'runner', 'dispatch', 'evidence-attribution.mjs'));
const claim = await import(path.join(root, 'src', 'runner', 'dispatch', 'agent-result-claim-contract.mjs'));

const plain = (value) => JSON.parse(JSON.stringify(value === undefined ? null : value));
// A call's answer, or the error it threw (name and message), so a refusal is a vector too.
const attempt = (call) => {
  try { return { ok: plain(call()) }; } catch (error) { return { error: { name: error.name, message: error.message } }; }
};

// SECTION: vocabularies
const vocabularies = {
  contract: plain(rr.RUN_RESULT_CONTRACT),
  executionStatuses: rr.EXECUTION_STATUSES,
  assessmentVerdicts: rr.ASSESSMENT_VERDICTS,
  confidenceLevels: rr.CONFIDENCE_LEVELS,
  failureFamilies: rr.FAILURE_FAMILIES,
  policyDispositions: rr.POLICY_DISPOSITIONS,
  deliveryModes: rr.DELIVERY_MODES,
  provenanceValues: rr.PROVENANCE_VALUES,
  recognizedLegacyStatuses: rr.RECOGNIZED_LEGACY_STATUSES,
  leaseConflictFailureCode: rr.LEASE_CONFLICT_FAILURE_CODE,
  corruptClassification: plain(rr.CORRUPT_CLASSIFICATION),
  attributionLevels: attribution.ATTRIBUTION_LEVELS,
  claimContract: plain(claim.AGENT_RESULT_CLAIM_CONTRACT),
  claimStatuses: claim.ALLOWED_AGENT_CLAIM_STATUSES,
  frictionsMax: claim.CLAIM_FRICTIONS_MAX,
  frictionFieldMax: claim.CLAIM_FRICTION_FIELD_MAX,
};

// SECTION: writer
// One entry per outcome class the single writer can settle: the input, the written record, and the reading the
// previous Node release gives that record (the reverse-read the Rust writer's bytes must keep).
const SETTLED = '2026-11-19T00:00:00.000Z';
const persona = { role: 'reviewer', persona: 'code-reviewer', executorId: 'codex-cli', provenance: { persona: { value: 'code-reviewer', source: { scope: 'default', id: 'reviewer' } } } };
const writerInputs = [
  ['clean-pass', { runId: 'run_a_01', assignmentId: 'asgn_a', workId: 'w-1', controlEpoch: 1, controlToken: 'tok', executorId: 'claude', adapter: 'herdr-spawn', confinement: 'bwrap', role: 'producer', executorRedirected: false, settledAt: SETTLED, planContentHash: 'h1', inputDigests: [{ path: 'a', sha256: 'x' }], claimSha256: 'c1', runtime: { exitCode: 0, stdoutLog: 'stdout.log', stderrLog: 'stderr.log', settledAt: SETTLED }, agentClaim: { status: 'done', summary: 'ok', evidenceRefs: ['a.md'] }, confidenceLevel: 'reported', usage: { inputTokens: 1 } }],
  ['verified-with-changes', { runId: 'run_b_01', unitRunId: 'unit-1', round: 2, settledAt: SETTLED, runtime: { exitCode: 0, stdoutLog: 'o.log' }, agentClaim: { status: 'done', summary: 'edited' }, evidence: { changedFiles: ['src/a.mjs'], gitBefore: 'aaa', gitAfter: 'bbb', attribution: [{ path: 'src/a.mjs', level: 'proven' }] }, operation: 'edit' }],
  ['read-only-done', { runId: 'run_c_01', settledAt: SETTLED, runtime: { exitCode: 0, stdoutLog: 'o.log' }, agentClaim: { status: 'done', summary: 'looked' }, isReadOnlyOperation: true, evidence: { changedFiles: ['x'] } }],
  ['claim-blocked', { runId: 'run_d_01', settledAt: SETTLED, runtime: { exitCode: 0, stdoutLog: 'o.log' }, agentClaim: { status: 'blocked', summary: 's', blocker: 'b' } }],
  ['claim-failed-non-assessment', { runId: 'run_d2_01', settledAt: SETTLED, runtime: { exitCode: 0, stdoutLog: 'o.log' }, agentClaim: { status: 'failed', summary: 's', error: 'e' } }],
  ['reviewer-findings', { runId: 'run_e_01', role: 'reviewer', policy: persona, settledAt: SETTLED, runtime: { exitCode: 0, stdoutLog: 'o.log' }, agentClaim: { status: 'failed', summary: 'f', error: 'e', evidenceRefs: ['r.md'], assessment: { verdict: 'findings', severityFloor: 'high' } } }],
  ['reviewer-claim-without-assessment', { runId: 'run_e2_01', role: 'red-team', settledAt: SETTLED, runtime: { exitCode: 0, stdoutLog: 'o.log' }, agentClaim: { status: 'done', summary: 'f' } }],
  ['recheck-operation-no-claim', { runId: 'run_e3_01', operation: 'recheck-x', settledAt: SETTLED, runtime: { exitCode: 0, stdoutLog: 'o.log' } }],
  ['invalid-claim', { runId: 'run_f_01', settledAt: SETTLED, runtime: { exitCode: 0, stdoutLog: 'o.log' }, claimInvalid: true }],
  ['nonzero-exit', { runId: 'run_g_01', settledAt: SETTLED, runtime: { exitCode: 2, stdoutLog: 'o.log' } }],
  ['timeout', { runId: 'run_h_01', settledAt: SETTLED, runtime: { exitCode: null, isTimeout: true, stdoutLog: 'o.log' } }],
  ['exit-124', { runId: 'run_h2_01', settledAt: SETTLED, runtime: { exitCode: 124 } }],
  ['oom-killed', { runId: 'run_h3_01', settledAt: SETTLED, runtime: { exitCode: 137 } }],
  ['cancelled', { runId: 'run_i_01', settledAt: SETTLED, runtime: { exitCode: null, isCancelled: true } }],
  ['execution-error', { runId: 'run_j_01', settledAt: SETTLED, runtime: { executionError: { code: 'spawn-enoent', message: 'no such binary' } } }],
  ['execution-error-no-code', { runId: 'run_j2_01', settledAt: SETTLED, runtime: { executionError: { message: 'boom' } } }],
  ['completion-unknown', { runId: 'run_k_01', settledAt: SETTLED, runtime: {} }],
  ['completion-unknown-null-exit-with-log', { runId: 'run_k2_01', settledAt: SETTLED, runtime: { stdoutLog: 'o.log' } }],
  ['replayed', { runId: 'run_l_01', settledAt: SETTLED, deliveryMode: 'replayed', sourceRunId: 'run_src', runtime: { exitCode: 0, stdoutLog: 'o.log' }, agentClaim: { status: 'done', summary: 's' } }],
  ['recovered-with-sourceRunId-ignored', { runId: 'run_l2_01', settledAt: SETTLED, deliveryMode: 'recovered', sourceRunId: 'run_src', runtime: { exitCode: 0, stdoutLog: 'o.log' } }],
  ['overrides', { runId: 'run_m_01', settledAt: SETTLED, execStatusOverride: 'failed', failureOverride: { family: 'provider', code: 'provider-limit', cause: 'quota' }, policyOverride: { disposition: 'needs-input', code: 'provider-limit' }, assessmentOverride: { verdict: 'inconclusive' }, confidenceLevel: 'failed', runtime: { exitCode: 1, stdoutLog: 'o.log' }, runnerNote: 'limit hit' }],
  ['runner-note-object-and-warnings', { runId: 'run_n_01', settledAt: SETTLED, runtime: { exitCode: 0, stdoutLog: 'o.log' }, agentClaim: { status: 'done', summary: 's' }, runnerNote: { summary: 'custom', extra: 1 }, warnings: [{ code: 'w', level: 'correlated', basis: ['b'], paths: ['p'] }], reportDeclaration: { path: 'r.md' }, settleReports: ['r.md'] }],
  ['evidence-passthrough', { runId: 'run_o_01', settledAt: SETTLED, runtime: { exitCode: 0, stdoutLog: 'o.log' }, agentClaim: { status: 'done', summary: 's', evidenceRefs: ['x', 'y'] }, evidence: { extra: 1, gitBeforeSource: 'resume', tests: ['t'], artifacts: ['a'], mutatedDirtyBeforeFiles: ['m'], findingRefs: ['own'] } }],
  ['minimal', { runId: 'run_p_01', settledAt: SETTLED }],
  ['explicit-nulls', { runId: 'run_q_01', assignmentId: null, workId: null, executorId: null, adapter: null, confinement: null, role: null, settledAt: SETTLED, usage: null, runtime: { exitCode: 0, stdoutLog: 'o.log' } }],
];
const writer = writerInputs.map(([name, input]) => {
  const record = rr.normalizeRunResultV3(input);
  const reread = attempt(() => rr.runOutcome(JSON.parse(JSON.stringify(record))));
  const interpreted = rr.interpretRunResult(JSON.parse(JSON.stringify(record)));
  return {
    name,
    input,
    record: plain(record),
    status: record.status,
    confidence: record.confidence,
    // The previous Node release reads the written bytes back to this: the reverse-read of the format.
    nodeRead: { valid: !interpreted.corrupt, outcome: reread.ok, status: interpreted.status, confidence: interpreted.confidence },
  };
});

// SECTION: readers
const readerSource = JSON.parse(fs.readFileSync(path.join(root, 'test', 'fixtures', 'run-outcome', 'legacy-derivation.json'), 'utf8'));
const asV2 = (v3) => {
  const { outcome: _outcome, ...classification } = v3.classification;
  return { ...v3, contract: { id: 'assignment-run-result', version: 2 }, classification: { ...classification, provenance: 'native-v2' }, status: v3.status, confidence: v3.confidence };
};
const readerInputs = readerSource.map((c) => ({ name: c.id, record: c.record, expectedRunId: null }));
readerInputs.push(
  { name: 'null-input', record: null, expectedRunId: null },
  { name: 'array-input', record: [1], expectedRunId: null },
  { name: 'number-input', record: 7, expectedRunId: null },
  { name: 'expected-run-id-missing', record: { status: 'done', confidence: 'reported' }, expectedRunId: 'run_x' },
  { name: 'expected-run-id-mismatch', record: { runId: 'run_y', status: 'done' }, expectedRunId: 'run_x' },
  { name: 'expected-run-id-match-legacy', record: { runId: 'run_x', status: 'done', confidence: 'verified', runtime: { exitCode: 0 } }, expectedRunId: 'run_x' },
  { name: 'legacy-bare-status-only', record: { status: 'blocked' }, expectedRunId: null },
  { name: 'legacy-failed-timeout', record: { runId: 'r', status: 'failed', confidence: 'reported', runtime: { isTimeout: true } }, expectedRunId: null },
  { name: 'legacy-failed-findings', record: { runId: 'r', status: 'failed', confidence: 'reported', agentClaim: { assessment: { verdict: 'findings', severityFloor: 'high' } } }, expectedRunId: null },
  { name: 'legacy-done-no-confidence', record: { runId: 'r', status: 'done' }, expectedRunId: null },
  { name: 'legacy-failed-no-confidence-other', record: { runId: 'r', status: 'failed', confidence: 'inferred' }, expectedRunId: null },
  { name: 'legacy-no-evidence-no-exit', record: { runId: 'r', status: 'no-evidence' }, expectedRunId: null },
  { name: 'legacy-runid-only', record: { runId: 'r' }, expectedRunId: null },
  { name: 'legacy-with-extras', record: { runId: 'r', assignmentId: 'a', workId: 'w', controlEpoch: 2, controlToken: 't', executorId: 'e', executorRedirected: true, policy: { role: 'x' }, settledAt: 's', durationMs: 5, planContentHash: 'p', inputDigests: [1], claimSha256: 'c', settleReports: ['x'], reportDeclaration: { a: 1 }, status: 'done', confidence: 'verified', runtime: { exitCode: 3 }, agentClaim: { status: 'done' }, evidence: { z: 1 } }, expectedRunId: null },
  { name: 'v3-valid-for-expected-run-id', record: writer[0].record, expectedRunId: writer[0].record.runId },
  { name: 'v3-wrong-expected-run-id', record: writer[0].record, expectedRunId: 'other' },
);
for (const w of writer) readerInputs.push({ name: `v3-written-${w.name}`, record: w.record, expectedRunId: null });
for (const w of writer.slice(0, 12)) readerInputs.push({ name: `v2-of-written-${w.name}`, record: asV2(rr.interpretRunResult(JSON.parse(JSON.stringify(w.record)))), expectedRunId: null });
for (const w of writer.slice(0, 4)) {
  const v2 = asV2(rr.interpretRunResult(JSON.parse(JSON.stringify(w.record))));
  readerInputs.push({ name: `v2-tampered-status-${w.name}`, record: { ...v2, status: 'failed', confidence: 'verified' }, expectedRunId: null });
}
readerInputs.push(
  { name: 'v2-findings-without-evidence', record: { ...asV2(rr.interpretRunResult(JSON.parse(JSON.stringify(writer.find((w) => w.name === 'reviewer-findings').record)))), agentClaim: undefined, evidence: {} }, expectedRunId: null },
  { name: 'v2-replayed-without-source', record: { contract: { id: 'assignment-run-result', version: 2 }, runId: 'r', status: 'done', confidence: 'reported', classification: { execution: { status: 'completed', exitCode: 0 }, assessment: { verdict: 'pass' }, confidence: { level: 'reported', basis: [] }, failure: null, policy: { disposition: 'allow', code: null }, delivery: { mode: 'replayed' }, provenance: 'native-v2' } }, expectedRunId: null },
  { name: 'v2-provider-failure-completed', record: { contract: { id: 'assignment-run-result', version: 2 }, runId: 'r', status: 'failed', confidence: 'failed', classification: { execution: { status: 'completed', exitCode: 0 }, assessment: { verdict: 'pass' }, confidence: { level: 'failed', basis: [] }, failure: { family: 'provider', code: 'x' }, policy: { disposition: 'allow', code: null }, delivery: { mode: 'fresh' }, provenance: 'native-v2' } }, expectedRunId: null },
  { name: 'v2-bad-everything', record: { contract: { id: 'assignment-run-result', version: 2 }, runId: '  ', classification: { execution: { status: 'bogus', exitCode: 'x' }, assessment: { verdict: 'bogus' }, confidence: { level: 'bogus', basis: 'x' }, failure: { family: 'bogus', code: '' }, policy: { disposition: 'refuse' }, delivery: { mode: 'replayed' }, provenance: 'bogus' } }, expectedRunId: null },
  { name: 'v2-missing-sections', record: { contract: { id: 'assignment-run-result', version: 2 }, runId: 'r', classification: {} }, expectedRunId: null },
  { name: 'v2-failure-not-object', record: { contract: { id: 'assignment-run-result', version: 2 }, runId: 'r', status: 'failed', confidence: 'failed', classification: { execution: { status: 'failed', exitCode: null }, assessment: { verdict: 'not-applicable' }, confidence: { level: 'failed', basis: [] }, failure: 'x', policy: { disposition: 'allow' }, delivery: { mode: 'fresh' }, provenance: 'native-v2' } }, expectedRunId: null },
  { name: 'v2-no-classification', record: { contract: { id: 'assignment-run-result', version: 2 }, runId: 'r' }, expectedRunId: null },
  { name: 'v3-no-classification', record: { contract: { id: 'assignment-run-result', version: 3 }, runId: 'r' }, expectedRunId: null },
  { name: 'v3-no-outcome', record: { contract: { id: 'assignment-run-result', version: 3 }, runId: 'r', classification: { execution: { status: 'completed' }, assessment: { verdict: 'pass' }, confidence: { level: 'reported' } } }, expectedRunId: null },
  { name: 'v3-bad-contract-id', record: { contract: { id: 'other', version: 3 }, runId: 'r' }, expectedRunId: null },
  { name: 'v3-sections-not-objects', record: { contract: { id: 'assignment-run-result', version: 3 }, runId: 5, classification: { execution: 1, assessment: 2, confidence: 3, outcome: 'x' } }, expectedRunId: null },
  { name: 'contract-null', record: { contract: null, runId: 'r', status: 'done' }, expectedRunId: null },
  { name: 'contract-string', record: { contract: 'v3', runId: 'r' }, expectedRunId: null },
);
const view = (value) => {
  const interpreted = rr.interpretRunResult(JSON.parse(JSON.stringify(value.record)), value.expectedRunId ? { expectedRunId: value.expectedRunId } : {});
  const asRecord = JSON.parse(JSON.stringify(interpreted));
  return {
    record: asRecord,
    status: interpreted.status,
    confidence: interpreted.confidence,
    corrupt: interpreted.corrupt === true,
    contractCorrupt: interpreted.contractCorrupt === true,
    resultCorrupt: interpreted.resultCorrupt === true,
  };
};
const floors = [null,
  { status: 'failed', confidence: 'failed' },
  { status: 'no-evidence', confidence: 'no-evidence' },
  { status: 'done', confidence: 'verified' },
  { status: 'done', confidence: 'inferred' },
  { exitCode: 0, agentClaim: { status: 'done' }, changedFiles: ['a'] },
  { exitCode: 0, agentClaim: { status: 'done' }, isReadOnlyOperation: true, workerArtifacts: ['report.md'] },
  { exitCode: 0, agentClaim: { status: 'done' }, isReadOnlyOperation: true, workerArtifacts: ['agent-result.json', 'x/outbox/result-1.json'] },
  { exitCode: 0, agentClaim: { status: 'done' } },
  { exitCode: 1 },
  { exitCode: 0, signal: 'SIGKILL' },
  { exitCode: 0, isTimeout: true },
  { claimInvalid: true },
  { exitCode: 0, agentClaim: { status: 'failed', assessment: { verdict: 'findings' } }, workerArtifacts: ['report.md'] },
  { exitCode: 0, agentClaim: { status: 'failed' } },
  { exitCode: 0, agentClaim: { status: 'blocked' } },
  { exitCode: 0, changedFiles: ['a'] },
  { exitCode: 0, hasDirtyBeforeMutation: true },
  { exitCode: 0, isReadOnlyOperation: true, changedFiles: ['a'] },
  {},
];
const readers = {
  records: readerInputs.map((input) => ({
    name: input.name,
    record: input.record,
    expectedRunId: input.expectedRunId,
    read: view(input),
    ...(input.record !== null && typeof input.record === 'object' && !Array.isArray(input.record) ? { validateV2: plain(rr.validateRunResultV2(input.record, input.expectedRunId ? { expectedRunId: input.expectedRunId } : {})) } : {}),
    validateV3: plain((() => { const v = rr.validateRunResultV3(input.record, input.expectedRunId ? { expectedRunId: input.expectedRunId } : {}); return v; })()),
    outcomes: floors.map((floor) => plain(rr.runOutcome(JSON.parse(JSON.stringify(input.record)), floor === null ? {} : { evidenceFloor: floor }))),
  })),
  floors,
  deriveOutcomes: [{}, null, { provenance: 'contract-corrupt' }, { execution: { status: 'failed' } }, { execution: { status: 'completed' }, failure: { family: 'provider', code: 'blocked' } },
    { execution: { status: 'completed' }, failure: { family: 'provider', code: 'provider-limit', cause: 'quota' } },
    { execution: { status: 'completed' }, failure: { family: 'provider', code: 'paused-limit', cause: 'credential' } },
    { execution: { status: 'completed' }, failure: { family: 'provider', code: 'provider-limit', cause: 'provider' } },
    { execution: { status: 'completed' }, failure: { family: 'provider', code: 'provider-limit' } },
    { execution: { status: 'failed' }, failure: { family: 'contract', code: 'x' } },
    { execution: { status: 'completed' }, failure: { code: 'no-report' } },
    { execution: { status: 'completed' }, policy: { disposition: 'refuse', code: 'c' } },
    { execution: { status: 'completed' }, policy: { disposition: 'needs-input' } },
    { execution: { status: 'completed' }, assessment: { verdict: 'findings' } },
    { execution: { status: 'completed' }, assessment: { verdict: 'blocked' } },
    { execution: { status: 'completed' }, assessment: { verdict: 'pass' } },
    { execution: { status: 'failed' }, assessment: { verdict: 'pass' }, failure: { family: 'external-interference' } },
  ].map((classification) => ({ classification, outcome: plain(rr.deriveOutcome(classification)) })),
};

// SECTION: settled reads over the phase-00 corpus
const corpusResults = [
  'v3-solo-settled/producer/1/runs/01',
  'adopt-v3-envelope-attempt/runs/01',
  'pre-v3-layout-assignment/runs/01',
].map((dir) => {
  const runDir = path.join(root, 'packages', 'execution', 'contracts', 'corpus', dir);
  const file = path.join(runDir, 'result.json');
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  const interpreted = rr.interpretRunResult(file, { expectedRunId: parsed.runId });
  const settled = rr.readSettledResult(runDir, parsed.runId);
  return {
    dir,
    runId: parsed.runId,
    status: interpreted.status,
    confidence: interpreted.confidence,
    corrupt: interpreted.corrupt === true,
    category: rr.runOutcome(file).category,
    settledReadable: settled !== null,
    settledRead: settled === null ? null : plain(settled),
    settledWrongRunId: rr.readSettledResult(runDir, 'run_other') === null ? null : 'unexpected',
  };
});
readers.corpus = corpusResults;
// readSettledResult over a directory without result.json and over unreadable content.
{
  const tmp = fs.mkdtempSync(path.join((process.env.TMPDIR || '/tmp'), 'rr-rec-'));
  const none = rr.readSettledResult(tmp, 'r');
  fs.writeFileSync(path.join(tmp, 'result.json'), '{not json');
  const broken = rr.readSettledResult(tmp, 'r');
  fs.writeFileSync(path.join(tmp, 'result.json'), JSON.stringify({ contract: { id: 'assignment-run-result', version: 3 }, runId: 'r' }));
  const corrupt = rr.readSettledResult(tmp, 'r');
  fs.rmSync(tmp, { recursive: true, force: true });
  readers.settledEdges = { missingFile: none, invalidJson: broken, corruptRecord: plain(corrupt) };
}

// SECTION: attribution
const attrCases = [
  { name: 'empty', in: {} },
  { name: 'new-change-correlated', in: { postRunDirt: ['a.txt'] } },
  { name: 'new-change-proven', in: { postRunDirt: ['src/a.txt'], declaredCoverage: { paths: ['src'] }, adapterAttestation: { writtenPaths: ['src/a.txt'] } } },
  { name: 'new-change-attested-outside-coverage', in: { postRunDirt: ['lib/a.txt'], declaredCoverage: { writeScope: ['src'] }, adapterAttestation: { attestedPaths: ['lib/a.txt'] } } },
  { name: 'pre-existing-unchanged', in: { preLaunchDirt: ['p.txt'], postRunDirt: ['p.txt'], dirtyBeforeHashes: { 'p.txt': 'h' }, postRunHashes: { 'p.txt': 'h' } } },
  { name: 'pre-existing-mutated-correlated', in: { preLaunchDirt: ['p.txt'], postRunDirt: ['p.txt'], dirtyBeforeHashes: { 'p.txt': 'h' }, postRunHashes: { 'p.txt': 'g' } } },
  { name: 'pre-existing-mutated-proven', in: { preLaunchDirt: ['src/p.txt'], postRunDirt: ['src/p.txt'], dirtyBeforeHashes: { 'src/p.txt': 'h' }, postRunHashes: { 'src/p.txt': 'g' }, declaredCoverage: { paths: ['src/**'] }, adapterAttestation: { writtenPaths: ['src/p.txt'] } } },
  { name: 'pre-existing-no-hashes', in: { preLaunchDirt: ['p.txt'], postRunDirt: ['p.txt'] } },
  { name: 'pre-existing-one-hash', in: { preLaunchDirt: ['p.txt'], postRunDirt: ['p.txt'], dirtyBeforeHashes: { 'p.txt': 'h' } } },
  { name: 'pre-existing-cleared', in: { preLaunchDirt: ['p.txt'], postRunDirt: [] } },
  { name: 'sorted-mixed', in: { preLaunchDirt: ['z', 'm'], postRunDirt: ['a', 'm'], dirtyBeforeHashes: { m: '1' }, postRunHashes: { m: '1' } } },
  { name: 'null-lists', in: { preLaunchDirt: null, postRunDirt: null } },
  { name: 'attestation-not-array', in: { postRunDirt: ['a'], declaredCoverage: { paths: ['a'] }, adapterAttestation: { writtenPaths: 'a' } } },
  { name: 'coverage-not-array', in: { postRunDirt: ['a'], declaredCoverage: { paths: 'a' }, adapterAttestation: { writtenPaths: ['a'] } } },
  { name: 'coverage-glob', in: { postRunDirt: ['docs/x/y.md', 'docs/z.txt'], declaredCoverage: { paths: ['docs/**/*.md'] }, adapterAttestation: { writtenPaths: ['docs/x/y.md', 'docs/z.txt'] } } },
  { name: 'store-path-never-covered', in: { postRunDirt: ['.fgos/x'], declaredCoverage: { paths: ['**'] }, adapterAttestation: { writtenPaths: ['.fgos/x'] } } },
];
const claimRefCases = [null, {}, { evidenceRefs: [] }, { evidenceRefs: ['a', 'b'] }, { evidenceRefs: 'a' }, { status: 'done' }];
const proven = (p) => ({ path: p, firstObserved: 'post-run', level: 'proven', basis: ['x'], coverageMatched: true });
const correlated = (p) => ({ path: p, firstObserved: 'post-run', level: 'correlated', basis: ['x'], coverageMatched: false });
const pre = (p) => ({ path: p, firstObserved: 'pre-launch', level: 'excluded', basis: ['x'], coverageMatched: false });
const policyCases = [
  { name: 'empty', in: {} },
  { name: 'contradictory', in: { contradictoryClaim: true, attributions: [proven('a')], isReadOnly: true } },
  { name: 'read-only-proven', in: { isReadOnly: true, attributions: [proven('a'), proven('b'), correlated('c')] } },
  { name: 'read-only-correlated', in: { isReadOnly: true, attributions: [correlated('a'), correlated('b')] } },
  { name: 'proven-outside-scope', in: { writeScope: ['src'], attributions: [proven('src/a'), proven('lib/b'), proven('lib/c')] } },
  { name: 'proven-inside-scope', in: { writeScope: ['src'], attributions: [proven('src/a')] } },
  { name: 'correlated-outside-scope-warns', in: { writeScope: ['src'], attributions: [correlated('src/a'), correlated('lib/b')] } },
  { name: 'correlated-inside-scope-quiet', in: { writeScope: ['src'], attributions: [correlated('src/a')] } },
  { name: 'no-scope-correlated-quiet', in: { attributions: [correlated('a')] } },
  { name: 'empty-scope-array', in: { writeScope: [], attributions: [proven('a')] } },
  { name: 'mutated-dirty-before', in: { mutatedDirtyBeforeFiles: ['m1', 'm2'], attributions: [] } },
  { name: 'mutated-dirty-before-and-read-only', in: { isReadOnly: true, mutatedDirtyBeforeFiles: ['m'], attributions: [correlated('a')] } },
  { name: 'mutated-dirty-before-and-scope', in: { writeScope: ['src'], mutatedDirtyBeforeFiles: ['m'], attributions: [correlated('lib/x')] } },
  { name: 'pre-launch-ignored', in: { isReadOnly: true, writeScope: ['src'], attributions: [pre('lib/a')] } },
  { name: 'glob-scope', in: { writeScope: ['docs/**/*.md'], attributions: [proven('docs/a/b.md'), proven('docs/a/b.txt')] } },
  { name: 'empty-mutated', in: { mutatedDirtyBeforeFiles: [], attributions: [] } },
];
write('attribution.json', {
  workspace: attrCases.map((c) => ({ name: c.name, in: c.in, out: attempt(() => attribution.attributeWorkspaceChanges(c.in)) })),
  claimRefs: claimRefCases.map((claimInput) => ({ in: claimInput, out: plain(attribution.attributeClaimEvidenceRefs(claimInput)) })),
  policy: policyCases.map((c) => ({ name: c.name, in: c.in, out: attempt(() => attribution.evaluateAttributionPolicy(c.in)) })),
});

// SECTION: claim contract
const verdictsCtx = [{}, { role: 'reviewer' }, { role: 'red-team' }, { role: 'producer' }, { posture: { verdict: true } }, { posture: { verdict: false }, role: 'reviewer' }, { posture: {} , role: 'reviewer' }, { assignment: { role: 'reviewer' } }, { assignment: { posture: { verdict: true }, operation: 'x' } }, { operation: 'recheck-1' }, { operation: 7 }, { assignment: { operation: 'plan-recheck' } }];
const claimValues = [
  null, [], 'x', 7, {},
  { status: 'done', summary: 's' },
  { contract: { id: 'agent-result-claim', version: 2 }, status: 'done', summary: 's' },
  { contract: { id: 'agent-result-claim', version: 1 }, status: 'done', summary: 's' },
  { contract: null, status: 'done', summary: 's' },
  { contract: [], status: 'done', summary: 's' },
  { contract: { id: 'x', version: 2 }, status: 'done', summary: 's' },
  { status: 'settled', summary: 's' },
  { status: 'done' },
  { status: 'done', summary: '  ' },
  { status: 'blocked', summary: 's' },
  { status: 'blocked', summary: 's', blocker: ' ' },
  { status: 'blocked', summary: 's', blocker: 'b' },
  { status: 'failed', summary: 's' },
  { status: 'failed', summary: 's', error: 'e' },
  { status: 'failed', summary: 's', error: { code: 1 } },
  { status: 'failed', summary: 's', error: [] },
  { status: 'failed', summary: 's', error: null },
  { contract: { id: 'agent-result-claim', version: 2 }, status: 'failed', summary: 's', error: { code: 1 } },
  { contract: { id: 'agent-result-claim', version: 2 }, status: 'failed', summary: 's', error: [] },
  { contract: { id: 'agent-result-claim', version: 2 }, status: 'failed', summary: 's', error: '' },
  { status: 'no-evidence', summary: 's' },
  { status: 'done', summary: 's', evidenceRefs: ['a'] },
  { status: 'done', summary: 's', evidenceRefs: [] },
  { status: 'done', summary: 's', evidenceRefs: ['a', ' '] },
  { status: 'done', summary: 's', evidenceRefs: ['a', 1] },
  { status: 'done', summary: 's', evidenceRefs: 'a' },
  { status: 'done', summary: 's', evidenceRefs: null },
  { contract: { id: 'agent-result-claim', version: 2 }, status: 'done', summary: 's', assessment: { verdict: 'pass' } },
  { contract: { id: 'agent-result-claim', version: 2 }, status: 'done', summary: 's', assessment: { verdict: 'maybe' } },
  { contract: { id: 'agent-result-claim', version: 2 }, status: 'done', summary: 's', assessment: [] },
  { contract: { id: 'agent-result-claim', version: 2 }, status: 'done', summary: 's', assessment: null },
  { status: 'done', summary: 's', assessment: { verdict: 'maybe' }, stance: 'x', frictions: [], needsWrites: ['a'] },
];
write('claim.json', {
  validate: claimValues.flatMap((value) => verdictsCtx.map((context) => ({ value, context, out: plain(claim.validateAgentResultClaimContract(value, context)) }))),
  verdictSeat: verdictsCtx.map((context) => ({ context, verdictSeat: claim.isVerdictSeat(context), assessmentRequired: claim.isAssessmentRequired(context), requirement: plain(claim.assessmentRequirement(context)) })),
  render: verdictsCtx.map((context) => ({ context, text: claim.renderAgentResultClaimInstructions(context) })),
  reportPath: ['/a/b/result-1.json', '/a/b/result-12.json', '/a/b/result.json', 'result-3.json', '/a/b/x-result-2.json', '/a/b/result-2.json.tmp', '/a/b/agent-result.json'].map((p) => ({ in: p, out: claim.claimReportPath(p) })),
});

write('vocabularies.json', vocabularies);
write('writer.json', writer);
write('readers.json', readers);
console.log(`recorded ${writer.length} writer cases, ${readers.records.length} reader records, ${attrCases.length + policyCases.length} attribution cases`);
