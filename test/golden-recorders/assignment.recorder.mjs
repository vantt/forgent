#!/usr/bin/env node
// Assignment golden recorder: replays the Node assignment modules (assignment, assignment-normalizer, brief,
// tier-cell, work-item-input, assignment-layout) over fixed inputs and the Node-era corpus, and writes the results as vectors for the Rust
// `assignment` engine module to replay (packages/execution/engine/tests/assignment.rs).
// Usage: node test/golden-recorders/assignment.recorder.mjs [--out <dir>]
// Default out: packages/execution/contracts/assignment.
//
// Everything recorded is the real Node module. Only the clock is fixed: the process runs in UTC, `createdAt` is
// passed in and the brief's `now` is a constant, so no vector names the recording machine or moment.

process.env.TZ = 'UTC';

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const outDir = path.resolve(repo, args.includes('--out') ? args[args.indexOf('--out') + 1] : 'packages/execution/contracts/assignment');
const load = (rel) => import(path.join(repo, rel));

const assignment = await load('src/runner/dispatch/assignment.mjs');
const normalizer = await load('src/runner/dispatch/assignment-normalizer.mjs');
const brief = await load('src/runner/dispatch/brief.mjs');
const tierCell = await load('src/runner/dispatch/tier-cell.mjs');
const workItemInput = await load('src/runner/dispatch/work-item-input.mjs');
const layout = await load('src/runner/dispatch/assignment-layout.mjs');
const contractModule = await load('src/runner/dispatch/execution-contract.mjs');

const plain = (v) => JSON.parse(JSON.stringify(v ?? null));
const attempt = (fn) => {
  try { return { ok: plain(fn()) }; } catch (error) { return { error: { name: error?.name, code: error?.code ?? null, message: error?.message } }; }
};
const build2 = (input, options) => assignment.buildAssignment({ ...input, options });
const CREATED_AT = '2026-11-19T00:00:00.000Z';
const NOW = Date.parse('2026-11-19T02:00:00.000Z');
const write = (name, value) => {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, name), `${JSON.stringify(value, null, 2)}\n`);
};

// ---- normalizer ------------------------------------------------------------------------------------------------
const declaredStamps = [
  ['reviewer', 'review-item'], ['reviewer', 'validate-plan'], ['implementer', 'implement-item'], ['implementer', 'validate-plan'],
  [undefined, 'implement-item'], ['researcher', 'scoped-subtask'], ['advisor', 'something-else'], ['planner', 'shape-plan'],
  ['implementer', 'compound-learn'], ['implementer', 'fix-verify-red'], ['implementer', 'unknown-op'], ['reviewer', 'scout-blast-radius'],
].map(([role, operation]) => ({ role: role ?? null, operation, stamp: plain(normalizer.stampDeclaredAssignment({ role, operation })) }));
const STAMP = 'protocol-operation:flow@1#op';
const inlineStampInputs = [
  { name: 'read-only-reported', contract: { mutation: 'read-only', evidence: { required: 'reported' } } },
  { name: 'read-only-verified', contract: { mutation: 'read-only', evidence: { required: 'verified' } } },
  { name: 'mutating-stamped', contract: { mutation: 'mutating', evidence: { required: 'verified' }, constraints: [STAMP] } },
  { name: 'mutating-unstamped', contract: { mutation: 'mutating', evidence: { required: 'verified' }, constraints: [] } },
  { name: 'bad-mutation', contract: { mutation: 'sometimes', evidence: { required: 'reported' } } },
  { name: 'bad-evidence', contract: { mutation: 'read-only', evidence: { required: 'maybe' } } },
  { name: 'no-evidence', contract: { mutation: 'read-only' } },
].map((c) => ({ ...c, carriesStamp: contractModule.carriesProtocolOperationStamp(c.contract.constraints), result: attempt(() => normalizer.stampInlineAssignment(c.contract)) }));
write('normalizer.json', {
  version: normalizer.NORMALIZER_VERSION,
  readOnlyRoles: [...normalizer.READ_ONLY_ROLES],
  knownMutatingOps: [...normalizer.KNOWN_MUTATING_OPS],
  readOnlyOps: [...normalizer.READ_ONLY_OPS],
  declared: declaredStamps,
  inline: inlineStampInputs,
});

// ---- ids, claim, builder ---------------------------------------------------------------------------------------
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'assignment-recorder-'));
const idCases = [];
{
  const dir = path.join(tmp, 'ids');
  fs.mkdirSync(dir);
  const mk = (input, label, setup) => {
    idCases.push({ label, input: { ...input, assignmentsDir: undefined, existingIds: input.existingIds ?? [] }, existingDirs: setup ?? [], id: assignment.createAssignmentId({ ...input, assignmentsDir: dir }) });
    for (const name of setup ?? []) fs.mkdirSync(path.join(dir, name), { recursive: true });
  };
  mk({ workId: 'tsk-abc', operation: 'validate-plan' }, 'first');
  mk({ workId: 'tsk-abc', operation: 'validate-plan' }, 'second-after-dirs', ['asgn_tsk_abc_validate_plan_001', 'asgn_tsk_abc_validate_plan_002']);
  mk({ workId: 'Tsk.ABC', operation: 'Validate Plan' }, 'sanitized-and-gap', ['asgn_tsk_abc_validate_plan_009']);
  mk({ caller: { writerId: 'wr.1' }, operation: 'x' }, 'writer-fallback');
  mk({ operation: 'x' }, 'nowork');
  mk({ workId: 'w', stage: 'planning' }, 'stage-as-op');
  mk({ workId: 'w' }, 'op-literal');
  mk({ workId: 'w', operation: 'o', existingIds: ['asgn_w_o_041', 'asgn_w_o_x'] }, 'existing-ids');
  mk({ workId: 'w', operation: 'o', existingIds: ['asgn_w_o_7abc'] }, 'parse-int-prefix');
}
const ops = [
  { id: 'validate-plan', taskSpec: 'validate-plan', role: 'reviewer', skills: ['s1'], task: { contractTemplate: 'validate-plan-v1' } },
  { id: 'implement-item', taskSpec: 'implement-item', dispatch: 'unit', policy: { model: 'm', tier: 'standard' } },
  { id: 'review-item', taskSpec: 'review-item.md', reason: 'second-look' },
  { id: 'no-spec' },
];
const declaredBase = { workId: 'tsk-1', domain: 'coding', workflow: 'feature', operations: ops };
const opt = { createdAt: CREATED_AT, allowSyntheticCompatibilityOperation: true };
const declaredInputs = [
  ['validate-plan-defaults', { ...declaredBase, stage: 'planning', operation: 'validate-plan' }],
  ['implement-with-policy', { ...declaredBase, stage: 'implementation', operation: 'implement-item', objective: 'do it', contextRefs: ['a.md'], expectedOutputs: ['out'], expectedFiles: ['src/a.mjs', '', '  ', 7], policy: { tier: 'advanced' }, createdBy: 'tester' }],
  ['yaml-model-policy', { ...declaredBase, stage: 'implementation', operation: 'implement-item', policy: { rigor: 'high' } }],
  ['review-item-defaults', { ...declaredBase, stage: 'review', operation: 'review-item', role: 'reviewer' }],
  ['no-workflow-no-work', { operations: ops, domain: ' coding ', stage: 'review', operation: 'review-item' }],
  ['role-and-template-override', { ...declaredBase, stage: 'planning', operation: 'validate-plan', role: 'advisor', contractTemplate: 'custom-v2' }],
  ['unknown-operation', { ...declaredBase, stage: 'planning', operation: 'nope' }],
  ['no-taskspec', { ...declaredBase, stage: 'planning', operation: 'no-spec' }],
  ['missing-stage', { ...declaredBase, operation: 'validate-plan' }],
  ['missing-operation', { ...declaredBase, stage: 'planning' }],
  ['missing-domain', { operations: ops, stage: 'p', operation: 'validate-plan' }],
  ['missing-operations', { domain: 'coding', stage: 'p', operation: 'validate-plan' }],
  ['work-item-input', { ...declaredBase, stage: 'planning', operation: 'validate-plan', work: { id: 'x' } }],
  ['work-item-input-workitem', { ...declaredBase, stage: 'planning', operation: 'validate-plan', workItem: {} }],
];
const declared = declaredInputs.map(([name, input]) => ({ name, input, options: opt, result: attempt(() => build2(input, { ...opt, assignmentsDir: path.join(tmp, 'none') })) }));
{
  // task-spec existence is checked on disk unless the compatibility switch is on.
  const root = path.join(tmp, 'repo');
  fs.mkdirSync(path.join(root, 'domains', 'coding', 'task-specs'), { recursive: true });
  fs.writeFileSync(path.join(root, 'domains', 'coding', 'task-specs', 'validate-plan.md'), '# spec\n');
  const input = { ...declaredBase, stage: 'planning', operation: 'validate-plan' };
  declared.push({ name: 'taskspec-present', input, taskSpecs: ['validate-plan'], options: { createdAt: CREATED_AT }, result: attempt(() => build2(input, { createdAt: CREATED_AT, repoRoot: root })) });
  const absent = { ...declaredBase, stage: 'implementation', operation: 'implement-item' };
  declared.push({ name: 'taskspec-absent', input: absent, taskSpecs: ['validate-plan'], options: { createdAt: CREATED_AT }, result: attempt(() => build2(absent, { createdAt: CREATED_AT, repoRoot: root })), rootToken: '<repo>' });
}
for (const d of declared) if (d.rootToken) d.result = JSON.parse(JSON.stringify(d.result).replaceAll(path.join(tmp, 'repo'), '<repo>'));

const goodContract = { objective: 'investigate x', contextRefs: ['a.md'], constraints: ['no network'], expectedOutputs: ['report'], mutation: 'read-only', evidence: { required: 'reported' }, role: 'researcher', capabilities: ['read'], budget: { timeoutMs: 120000, maxRuns: 1 } };
const inlineInputs = [
  ['read-only', { provenance: { kind: 'inline', contract: goodContract, caller: { writerId: 'wr.1' } }, workId: 'tsk-9', createdBy: 'me' }],
  ['no-work-uses-writer', { provenance: { kind: 'inline', contract: goodContract, caller: { writerId: 'Writer.7', parentAssignmentId: 'asgn_p_001' } } }],
  ['with-policy-tier', { provenance: { kind: 'inline', contract: { ...goodContract, policy: { tier: 'standard' }, supports: 'x', contractTemplate: 't' }, caller: { writerId: 'w' } } }],
  ['with-coordination', { provenance: { kind: 'inline', contract: goodContract, caller: { writerId: 'w', coordination: { fanOutPayload: { actorId: 'a1', objective: 'o', taskKey: 'k1', expectedOutputs: ['o'], constraints: ['c'], capabilities: ['k'] }, actionInvocation: { actionKey: 'sha256:ab', kind: 'fan-out', normalizedSteps: [{ type: 's1', omittedFields: ['a'] }, { type: 's2' }] } } } } }],
  ['declared-field-rides-along', { provenance: { kind: 'inline', contract: goodContract, caller: { writerId: 'w' } }, stage: 'planning' }],
  ['mutating-unstamped', { provenance: { kind: 'inline', contract: { ...goodContract, mutation: 'mutating', evidence: { required: 'verified' } }, caller: { writerId: 'w' } } }],
];
const inline = inlineInputs.map(([name, input]) => ({ name, input, validator: attempt(() => { contractModule.validateExecutionContract({ contract: input.provenance.contract, caller: input.provenance.caller }); return null; }), options: { createdAt: CREATED_AT }, result: attempt(() => build2(input, { createdAt: CREATED_AT, assignmentsDir: path.join(tmp, 'none') })) }));
// the claim loop reserves an id by making its directory, and does not create the directory for a refused build
const claim = [];
{
  const dir = path.join(tmp, 'claims');
  const build = () => build2(inlineInputs[0][1], { createdAt: CREATED_AT, assignmentsDir: dir });
  const refused = attempt(() => assignment.claimAssignmentId(() => build2(inlineInputs[5][1], { createdAt: CREATED_AT }), dir));
  claim.push({ step: 'refused-build', dirCreated: fs.existsSync(dir), result: refused });
  const a = assignment.claimAssignmentId(build, dir);
  const b = assignment.claimAssignmentId(build, dir);
  claim.push({ step: 'two-claims', ids: [a.assignmentId, b.assignmentId], dirs: fs.readdirSync(dir).sort() });
}
const tokenize = (v) => JSON.parse(JSON.stringify(v).replaceAll(tmp, '<tmp>'));
write('builder.json', tokenize({ ids: idCases, declared, inline, claim }));

// ---- prompt, read-only, unit-run assignment ---------------------------------------------------------------------
const promptSubjects = [];
const base = declared.find((d) => d.name === 'implement-with-policy').result.ok;
const reviewer = declared.find((d) => d.name === 'review-item-defaults').result.ok;
const inlineRO = inline[0].result.ok;
const unitRecord = { declared: { workId: 'w-1', title: 'T' }, sync: { status: 'conflicted', conflicts: ['a.mjs'] }, personaPin: { name: 'code-reviewer', text: 'pinned' }, overrides: [{ scope: { seat: 'seat-b' }, persona: 'p2', personaPin: { name: 'p2', text: 'q' } }] };
const bound = { tier: 'standard', executor: 'codex-cli', invocation: 'cli', persona: 'code-reviewer', model: 'm' };
const declaredOp = { role: 'implementer', domain: 'coding', workflow: 'feature', stage: 'implementation', operation: 'implement-item', dispatch: 'assignment', taskSpec: 'implement-item', skills: ['s'], evidence: { required: 'verified' }, resultKind: 'work-product', declared: { domain: 'coding', stage: 'implementation', operation: 'implement-item', taskSpec: 'implement-item', legalOperations: ['implement-item'] } };
const unitInputs = [
  ['writer-carrying-operation', { unitRecord, declaredOp, unit: { expectedOutputs: ['x'], rigor: 'high' } }, { seat: { seat: 'seat-a', role: 'producer', posture: { verdict: false } }, round: 1, readOnly: false }, { carriesOperation: true, writes: ['src/**'], contextRefs: ['c.md'], objective: 'obj' }],
  ['reviewer-plain', { unitRecord, declaredOp, unit: {} }, { seat: { seat: 'seat-b', role: 'reviewer', posture: { verdict: true } }, round: 2, readOnly: true }, { carriesOperation: false, writes: [], contextRefs: [], objective: 'review it' }],
  ['override-persona-pin', { unitRecord, declaredOp, unit: {} }, { seat: { seat: 'seat-b', role: 'reviewer', posture: {} }, round: 1, readOnly: true }, { carriesOperation: false, writes: [], contextRefs: [], objective: 'o', bound: { ...bound, persona: 'p2' } }],
  ['persona-pin-mismatch', { unitRecord, declaredOp, unit: {} }, { seat: { seat: 'seat-c', role: 'reviewer', posture: {} }, round: 1, readOnly: true }, { carriesOperation: false, writes: [], contextRefs: [], objective: 'o', bound: { ...bound, persona: 'other' } }],
];
const unitRun = unitInputs.map(([name, ctx, role, extra]) => {
  const { bound: b, ...rest } = extra;
  const result = assignment.buildUnitRunAssignment({ ...ctx, unitRunId: 'unit-run-1' }, role, { bound: b ?? bound, assignmentId: 'asgn_u_001', ...rest });
  return { name, ctx: { ...ctx, unitRunId: 'unit-run-1' }, role, extra: { bound: b ?? bound, assignmentId: 'asgn_u_001', ...rest }, assignment: plain(result), readOnly: assignment.isReadOnlyAssignment(result), prompts: {} };
});
const effectiveContract = { contract: { id: 'effective-execution-contract', version: 1 }, mutation: 'mutating', resultClaim: { path: '/runs/r1/outbox/result-1.json' }, limits: { executorTimeoutMs: 5400000 }, workspace: { writeScope: ['/wt'] }, enforcementPosture: 'enforced' };
const promptCases = [
  ['declared-plain', base, {}],
  ['declared-with-run-dir', base, { runDir: '/runs/r1' }],
  ['reviewer-read-only-run-dir', reviewer, { runDir: '/runs/r1', effectiveContract: { ...effectiveContract, mutation: 'read-only', workspace: { writeScope: [] } } }],
  ['inline-with-contract', inlineRO, { runDir: '/runs/r1', effectiveContract }],
  ['declared-with-task-spec-root', base, { cwd: '/proj' }],
];
const prompts = promptCases.map(([name, subject, options]) => ({ name, assignment: subject, options, result: attempt(() => assignment.renderAssignmentPrompt(subject, { ...options })) }));
for (const u of unitRun) {
  const input = { assignmentId: 'asgn_u_001', ...u.assignment };
  for (const [label, options] of [['plain', {}], ['run-dir-contract', { runDir: '/runs/u1', effectiveContract }], ['no-writes-contract', { runDir: '/runs/u1', effectiveContract: { ...effectiveContract, workspace: { writeScope: [] } } }]]) {
    prompts.push({ name: `unit-${u.name}-${label}`, assignment: input, options, result: attempt(() => assignment.renderAssignmentPrompt(input, { ...options })) });
  }
}
const readOnlySubjects = [reviewer, inlineRO, base, null, 'text', {}, { mutation: 'read-only' }, { mutation: 'mutating' }];
write('prompt.json', {
  prompts,
  readOnly: readOnlySubjects.map((s) => ({ assignment: s, readOnly: assignment.isReadOnlyAssignment(s) })),
  unitRun: unitRun.map(({ prompts: _p, ...rest }) => rest),
});

// ---- brief -----------------------------------------------------------------------------------------------------
const promptForBrief = assignment.renderAssignmentPrompt(unitRun[0].assignment, { runDir: '/runs/u1', effectiveContract });
const contractVariants = [
  ['none', undefined], ['full', effectiveContract],
  ['no-timeout', { mutation: 'read-only', resultClaim: {}, limits: {} }],
  ['timeout-ms-key', { mutation: 'mutating', limits: { timeoutMs: 60000 } }],
  ['other-claim-path', { ...effectiveContract, resultClaim: { path: '/elsewhere/result-3.json' } }],
  ['with-assignment-posture', { ...effectiveContract, assignment: { role: 'reviewer', operation: 'review-item', posture: { verdict: true } } }],
];
const briefs = contractVariants.flatMap(([name, ec]) => [
  { name: `${name}-round1`, prompt: promptForBrief, round: 1, runDir: '/runs/u1', agentName: 'fgos-run_x', effectiveContract: ec ?? null },
  { name: `${name}-round2-no-agent`, prompt: 'Plain prompt\n- Claim path: /stale/path\n- Write structured JSON to /x/y.json\n  - detail\n- Optional human-readable report: /old/report-1.md\nResult artifact:\n\n', round: 2, runDir: '/runs/../runs/u2/', agentName: null, effectiveContract: ec ?? null },
]).map((c) => ({ ...c, text: brief.renderBrief({ prompt: c.prompt, round: c.round, runDir: c.runDir, agentName: c.agentName ?? undefined, effectiveContract: c.effectiveContract ?? undefined, now: NOW }) }));
write('brief.json', {
  nowMs: NOW,
  paths: [['/runs/u1', 1], ['/a/b/../c/', 3]].map(([runDir, round]) => ({ runDir, round, paths: plain(brief.briefPaths(runDir, round)) })),
  deadlines: [[5400000, NOW], [0, NOW], [-1, NOW], [1.5, NOW], ['90', NOW], [null, NOW], [60000, NOW]].map(([timeoutMs, now]) => ({ timeoutMs, now, text: brief.deadlineText(timeoutMs, now) })),
  briefs,
  pointers: [['/runs/u1', 1], ['/runs/u1/', 4]].map(([runDir, round]) => ({ runDir, round, text: brief.renderPointer({ runDir, round }) })),
});

// ---- tier cell, work item input --------------------------------------------------------------------------------
const cells = [
  'gpt-5', ['a', 'b'], { model: 'm', pool: 'p', effort: 'high' }, [{ model: 'm' }, 'n'], [], '', ' ', { model: '' }, { model: 'm', pool: '' },
  { model: 'm', extra: 1 }, { model: 'm', effort: 'ultra' }, 7, null, [null], { pool: 'p' }, { model: 'm', effort: 'max', pool: 'q' },
].map((cell) => ({ cell, family: 'claude', result: attempt(() => tierCell.parseTierCell(cell, 'claude')) }));
write('tier-cell.json', { effortValues: [...tierCell.REASONING_EFFORT_VALUES], cells });
write('work-item-input.json', {
  keys: [...workItemInput.WORK_ITEM_KEYS],
  cases: [[{}, 'x()'], [{ work: 1 }, 'a()'], [{ workItem: 1, work: 2 }, 'b()'], [{ workExecutorId: 'e' }, 'c()'], [{ workExecutorId: 'e' }, 'c()', ['work', 'workItem']], [null, 'd()'], [{ stage: 's' }, 'e()']]
    .map(([params, where, keys]) => ({ params, where, keys: keys ?? null, result: attempt(() => (keys ? workItemInput.refuseWorkItemInput(params, where, keys) : workItemInput.refuseWorkItemInput(params, where)) ?? null) })),
});

// ---- layout ----------------------------------------------------------------------------------------------------
const lay = path.join(tmp, 'layout', '.fgos');
const mkrun = (...parts) => { fs.mkdirSync(path.join(lay, 'assignments', ...parts), { recursive: true }); return path.join(lay, 'assignments', ...parts); };
const treeFiles = [];
const put = (dir, name, doc) => { fs.writeFileSync(path.join(dir, name), JSON.stringify(doc)); treeFiles.push([path.relative(lay, path.join(dir, name)), doc]); };
const mkdirOnly = (...parts) => { mkrun(...parts); treeFiles.push([path.join('assignments', ...parts) + '/', null]); };
{
  put(mkrun('asgn_a_001'), 'assignment.json', { assignmentId: 'asgn_a_001' });
  put(mkrun('asgn_a_001', 'producer', '1', 'runs', '01'), 'run.json', { runId: 'run_a' });
  put(mkrun('asgn_a_001', 'producer', '1', 'runs', '02'), 'result.json', { runId: 'run_b' });
  mkdirOnly('asgn_b_001', 'reviewer', '1', 'runs', '01');
  put(mkrun('asgn_c_001', 'producer', '1', 'runs', '01'), 'run.json', { runId: 'dup' });
  put(mkrun('asgn_c_001', 'producer', '1', 'runs', '02'), 'run.json', { runId: 'dup' });
  mkdirOnly('asgn_d_001', 'producer', '1', 'runs', '01', 'worker-output', 'runs', '99');
}
const symlinkAt = path.join(lay, 'assignments', 'asgn_e_001');
fs.mkdirSync(path.join(tmp, 'elsewhere'), { recursive: true });
fs.symlinkSync(path.join(tmp, 'elsewhere'), symlinkAt);
const rel = (p) => path.relative(lay, p);
const scanned = layout.scanAssignmentLayout(lay);
const dups = attempt(() => layout.findRunDir(lay, 'dup'));
write('layout.json', tokenize({
  maxDepth: layout.ASSIGNMENT_LAYOUT_MAX_DEPTH,
  tree: treeFiles,
  symlinks: [['assignments/asgn_e_001', '../elsewhere']],
  scan: { runs: scanned.runs.map((r) => ({ assignmentId: r.assignmentId, attempt: r.attempt, runDir: rel(r.runDir), hasAssignmentJson: r.hasAssignmentJson })), skipped: plain(scanned.skipped), runDirsSeen: scanned.runDirsSeen },
  assignmentDir: ['asgn_a_001', '../x', '', 'a/b', 'asgn_ok'].map((id) => ({ id, dir: layout.assignmentDir(lay, id) ? rel(layout.assignmentDir(lay, id)) : null })),
  within: [['/a/b', '/a/b/c'], ['/a/b', '/a/b'], ['/a/b', '/a/bc'], ['/a/b', '/a'], ['/a/b', '/a/b/../c']].map(([parent, candidate]) => ({ parent, candidate, within: layout.isWithinDir(parent, candidate) })),
  findRunDir: ['run_a', 'run_b', 'run_zzz', ''].map((runId) => ({ runId, dir: (() => { const r = layout.findRunDir(lay, runId); return r ? rel(r) : null; })() }))
    .concat([{ runId: 'dup', error: dups.error ? { code: dups.error.code, message: dups.error.message.replaceAll(lay, '<fgos>') } : null }]),
}));

// ---- Node-era corpus -------------------------------------------------------------------------------------------
// Each sample of packages/execution/contracts/corpus/ is placed as one assignment (its directory name the id), so the
// layout readers meet records the Node tier really wrote.
const corpusRoot = path.join(repo, 'packages/execution/contracts/corpus');
const corpusFgos = path.join(tmp, 'corpus', '.fgos');
const samples = fs.readdirSync(corpusRoot, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort();
for (const sample of samples) fs.cpSync(path.join(corpusRoot, sample), path.join(corpusFgos, 'assignments', sample), { recursive: true });
const corpusScan = layout.scanAssignmentLayout(corpusFgos);
const crel = (p) => path.relative(corpusFgos, p);
const corpusRunIds = [...new Set(corpusScan.runs.flatMap(({ runDir }) => ['run.json', 'result.json']
  .map((name) => { try { return JSON.parse(fs.readFileSync(path.join(runDir, name), 'utf8')).runId; } catch { return undefined; } })
  .filter((id) => typeof id === 'string')))].sort();
write('corpus.json', {
  samples,
  scan: { runs: corpusScan.runs.map((r) => ({ assignmentId: r.assignmentId, attempt: r.attempt, runDir: crel(r.runDir), hasAssignmentJson: r.hasAssignmentJson })), skipped: plain(corpusScan.skipped), runDirsSeen: corpusScan.runDirsSeen },
  findRunDir: corpusRunIds.map((runId) => ({ runId, dir: (() => { const r = layout.findRunDir(corpusFgos, runId); return r ? crel(r) : null; })() })),
});

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`assignment vectors written to ${path.relative(repo, outDir)}`);
