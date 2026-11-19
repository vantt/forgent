#!/usr/bin/env node
// Execution contract golden recorder: replays the Node modules operation-prompt-templates, execution-contract and
// effective-execution-contract over fixed inputs and writes the results as vectors for the Rust `contract` engine
// module to replay (packages/execution/engine/tests/contract.rs).
// Usage: node test/golden-recorders/execution-contract.recorder.mjs [--out <dir>]
// Default out: packages/execution/contracts/execution-contract.
//
// Everything recorded is the real Node module. Every path under the scratch root is written as `$TMP`, so no vector
// names the recording machine. The checkout facts the effective contract reads (main checkout, repo root) are
// recorded next to each case from the real repositories the recorder builds; the Rust replay injects them.

process.env.TZ = 'UTC';

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initFixtureRepo } from '../helpers/git-fixture.mjs';
import { sandboxGit } from '../../scripts/lib/sandbox-git.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const outDir = path.resolve(repo, args.includes('--out') ? args[args.indexOf('--out') + 1] : 'packages/execution/contracts/execution-contract');
const load = (rel) => import(path.join(repo, rel));

const tpl = await load('src/runner/dispatch/operation-prompt-templates.mjs');
const ec = await load('src/runner/dispatch/execution-contract.mjs');
const eec = await load('src/runner/dispatch/effective-execution-contract.mjs');
const config = await load('src/runner/dispatch/config.mjs');

const { ensureGitAddon } = await import('../helpers/git-addon.mjs');
ensureGitAddon();

const TMP = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'execution-contract-recorder-')));
const scrub = (value) => JSON.parse(JSON.stringify(value ?? null).replaceAll(JSON.stringify(TMP).slice(1, -1), '$TMP'));
const plain = (v) => scrub(v);
const failure = (error) => ({
  error: {
    name: error?.name, code: error?.code ?? null, message: error?.message,
    ...(error?.details !== undefined ? { details: error.details } : {}),
  },
});
const attempt = (fn) => {
  try { return scrub({ ok: fn() ?? null }); } catch (error) { return scrub(failure(error)); }
};
const write = (name, value) => {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, name), `${JSON.stringify(value, null, 2)}\n`);
};
const sha = (text) => `sha256:${crypto.createHash('sha256').update(text, 'utf8').digest('hex')}`;
const clone = (v) => JSON.parse(JSON.stringify(v));

// ---- prompt templates on disk -------------------------------------------------------------------------------------
const ALL_VARS = 'goal {objective}\nrole {role}\nctx:\n{contextRefs}\nart:\n{artifactRefs}\nout:\n{expectedOutputs}\ncon:\n{constraints}\nev {evidenceContract}\n';

function materialise(name, files, links = {}) {
  const base = path.join(TMP, name);
  fs.mkdirSync(base, { recursive: true });
  for (const [rel, content] of Object.entries(files)) {
    const file = path.join(base, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
  for (const [rel, target] of Object.entries(links)) {
    const file = path.join(base, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.symlinkSync(path.join(base, target), file);
  }
  return { cwd: path.join(base, 'project'), packageRoot: path.join(base, 'pkg') };
}

const scenarios = [
  {
    name: 'tiers',
    files: {
      'pkg/core/prompt-templates/B-x.md': 'core B {objective}\n',
      'pkg/core/prompt-templates/a1.md': 'core a1\n',
      'pkg/core/prompt-templates/a-1.md': 'core a-1\n',
      'pkg/core/prompt-templates/a_1.md': 'core a_1\n',
      'pkg/core/prompt-templates/a.1.md': 'core a.1\n',
      'pkg/core/prompt-templates/A2.md': 'core A2\n',
      'pkg/core/prompt-templates/a2.md': 'core a2\n',
      'pkg/core/prompt-templates/b.txt': 'core b txt {role}\r\n',
      'pkg/core/prompt-templates/UP.MD': 'core UP\n',
      'pkg/core/prompt-templates/skip.json': '{"not":"a template"}',
      'pkg/core/prompt-templates/shared.md': 'core shared\n',
      'pkg/core/prompt-templates/uni.md': 'héllo ✓ 😀 {objective}\n',
      'pkg/domains/coding/prompt-templates/c.md': 'coding c {constraints}\n',
      'pkg/domains/coding/prompt-templates/shared-domain.md': 'coding shared-domain\n',
      'pkg/domains/coding/prompt-templates/shared.md': 'coding shared\n',
      'pkg/domains/ops/prompt-templates/d.md': 'ops d\n',
      'pkg/domains/ops/other.txt': 'not a template dir\n',
      'pkg/domains/loose-file': 'not a domain\n',
      'project/.fgos/prompt-templates/p.md': 'project p\n',
      'project/.fgos/prompt-templates/shared.md': 'project shared\n',
    },
    calls: [
      { fn: 'discoverProject' }, { fn: 'discoverAll' },
      { fn: 'load', id: 'p' }, { fn: 'load', id: 'shared' }, { fn: 'load', id: 'shared', domain: 'coding' },
      { fn: 'load', id: 'c', domain: 'coding' }, { fn: 'load', id: 'c', domain: 'ops' }, { fn: 'load', id: 'c' },
      { fn: 'load', id: 'd' }, { fn: 'load', id: 'a1' }, { fn: 'load', id: 'UP' }, { fn: 'load', id: 'uni' },
      { fn: 'load', id: 'nope' }, { fn: 'load', id: 'bad id!' }, { fn: 'load', id: '' }, { fn: 'load', id: 'd', domain: 'missing' },
    ],
  },
  { name: 'empty', files: {}, calls: [{ fn: 'discoverProject' }, { fn: 'discoverAll' }, { fn: 'load', id: 'x' }] },
  {
    name: 'duplicate-in-dir',
    files: { 'pkg/core/prompt-templates/x.md': 'a\n', 'pkg/core/prompt-templates/x.txt': 'b\n' },
    calls: [{ fn: 'discoverAll' }, { fn: 'load', id: 'x' }],
  },
  {
    name: 'duplicate-in-project',
    files: { 'project/.fgos/prompt-templates/x.md': 'a\n', 'project/.fgos/prompt-templates/X.MD': 'b\n', 'project/.fgos/prompt-templates/x.txt': 'c\n' },
    calls: [{ fn: 'discoverProject' }, { fn: 'load', id: 'x' }],
  },
  {
    name: 'cross-domain',
    files: { 'pkg/domains/a/prompt-templates/t.md': 'a\n', 'pkg/domains/b/prompt-templates/t.md': 'b\n', 'pkg/domains/b/prompt-templates/u.md': 'u\n' },
    calls: [{ fn: 'discoverAll' }, { fn: 'load', id: 't' }, { fn: 'load', id: 't', domain: 'a' }, { fn: 'load', id: 'u' }],
  },
  {
    name: 'unknown-variable',
    files: { 'pkg/core/prompt-templates/bad.md': 'uses {nope} and {objective}\n', 'pkg/core/prompt-templates/good.md': '{objective}\n' },
    calls: [{ fn: 'discoverAll' }, { fn: 'load', id: 'good' }, { fn: 'load', id: 'bad' }],
  },
  {
    name: 'bad-file-name',
    files: { 'pkg/core/prompt-templates/we ird.md': 'x\n', 'pkg/core/prompt-templates/ok.md': 'x\n' },
    calls: [{ fn: 'discoverAll' }, { fn: 'load', id: 'ok' }],
  },
  {
    name: 'path-escape',
    files: { 'outside.md': 'outside\n', 'pkg/core/prompt-templates/ok.md': 'x\n' },
    links: { 'pkg/core/prompt-templates/link.md': 'outside.md' },
    calls: [{ fn: 'discoverAll' }, { fn: 'load', id: 'ok' }],
  },
  {
    name: 'project-only-dir',
    files: { 'project/.fgos/prompt-templates/only.md': 'only {role}\n' },
    calls: [{ fn: 'discoverProject' }, { fn: 'discoverAll' }, { fn: 'load', id: 'only' }, { fn: 'load', id: 'core-missing' }],
  },
  {
    name: 'render-fixtures',
    files: {
      'pkg/core/prompt-templates/impl-v1.md': ALL_VARS,
      'pkg/domains/coding/prompt-templates/coding-only.md': 'coding {objective} / {role}\n',
      'pkg/domains/ops/prompt-templates/coding-only.md': 'ops {objective}\n',
    },
    calls: [{ fn: 'load', id: 'impl-v1' }, { fn: 'discoverAll' }],
  },
];

function runTemplateCall(sc, call) {
  const opts = { cwd: sc.cwd, packageRoot: sc.packageRoot };
  if (call.fn === 'discoverProject') return attempt(() => tpl.discoverProjectPromptTemplates(opts));
  if (call.fn === 'discoverAll') return attempt(() => tpl.discoverOperationPromptTemplates(opts));
  return attempt(() => tpl.loadOperationPromptTemplate(call.id, { ...opts, ...(call.domain ? { domain: call.domain } : {}) }));
}
const templateScenarios = scenarios.map((sc) => {
  const roots = materialise(sc.name, sc.files, sc.links);
  const run = { ...sc, ...roots };
  return { name: sc.name, files: sc.files, symlinks: sc.links ?? {}, calls: sc.calls.map((call) => ({ call, result: runTemplateCall(run, call) })) };
});
write('templates.json', {
  coreDir: tpl.CORE_PROMPT_TEMPLATES_DIR.split(path.sep),
  fileRe: tpl.TEMPLATE_FILE_RE.source,
  idRe: tpl.TEMPLATE_ID_RE.source,
  boundedVariables: [...tpl.BOUNDED_TEMPLATE_VARIABLES],
  scenarios: templateScenarios,
});

// ---- pure template rendering -------------------------------------------------------------------------------------
const validateCases = [
  'plain text', '{objective}{role}', '{contextRefs} {artifactRefs} {expectedOutputs} {constraints} {evidenceContract}', '{nope}', '{ spaced }',
  '{a.b}', '{}', '{Objective}', '{objective', 'objective}', '{{objective}}', '{x-y} {x_y}', '', 'a {objective} b {objective}', '{1}', 'é {role}',
].map((content) => ({ content, templateId: 'tpl', result: attempt(() => [...tpl.validateOperationPromptTemplate(content, 'tpl')]) }));
for (const raw of [null, 7, { a: 1 }, ['x']]) {
  validateCases.push({ raw, templateId: 'tpl', result: attempt(() => [...tpl.validateOperationPromptTemplate(raw, 'tpl')]) });
}
validateCases.push({ raw: null, templateId: null, noId: true, result: attempt(() => [...tpl.validateOperationPromptTemplate(null)]) });

const STAMP = 'protocol-operation:flow@1#op';
const renderVars = [
  ['empty-variables', {}],
  ['strings', { objective: 'do it', role: 'reviewer', contextRefs: 'ctx text', artifactRefs: 'art text', expectedOutputs: 'out text', constraints: 'con text', evidenceContract: 'verified' }],
  ['arrays', { objective: 'o', role: 'r', contextRefs: ['a.md', 'b.md'], expectedOutputs: ['x', 'y'], constraints: ['c1', 'c2'], evidence: { required: 'verified' } }],
  ['empty-arrays', { contextRefs: [], expectedOutputs: [], constraints: [] }],
  ['artifact-falls-back-to-context', { contextRefs: ['only-context'] }],
  ['artifact-array-own', { contextRefs: ['c'], artifactRefs: ['art'] }],
  ['stamp-filtered', { constraints: ['keep', STAMP, 'protocol-operation:x@y#z', 'also keep'] }],
  ['stamp-only', { constraints: [STAMP] }],
  ['non-string-constraints', { constraints: [1, null, 'ok', { a: 1 }] }],
  ['constraints-null', { constraints: null }],
  ['numbers', { objective: 42, role: true, evidenceContract: 7 }],
  ['items-coerced', { contextRefs: [1, 'a', true, null], expectedOutputs: [[1, 2], { a: 1 }] }],
  ['reinjected-placeholder', { objective: 'see {role} and {constraints}', role: 'R {evidenceContract}', constraints: ['{objective}'], evidenceContract: 'E' }],
  ['dollar-signs', { objective: '$& $1 $$ $`', role: "$'" }],
  ['evidence-contract-wins', { evidenceContract: 'reported', evidence: { required: 'verified' } }],
  ['evidence-null-contract', { evidenceContract: null, evidence: { required: 'verified' } }],
];
const renderCases = [];
for (const [name, variables] of renderVars) {
  renderCases.push({ name, content: ALL_VARS, variables, result: attempt(() => tpl.renderOperationPromptTemplate(ALL_VARS, variables)) });
}
renderCases.push({ name: 'invalid-template', content: 'x {nope}', variables: {}, result: attempt(() => tpl.renderOperationPromptTemplate('x {nope}', {})) });
renderCases.push({ name: 'non-string-template', content: 5, variables: {}, result: attempt(() => tpl.renderOperationPromptTemplate(5, {})) });
renderCases.push({ name: 'repeated-placeholder', content: '{role}-{role}-{objective}', variables: { role: 'r', objective: 'o' }, result: attempt(() => tpl.renderOperationPromptTemplate('{role}-{role}-{objective}', { role: 'r', objective: 'o' })) });

// ---- resolve and render -------------------------------------------------------------------------------------------
const resolveScenario = scenarios.find((s) => s.name === 'render-fixtures');
const rs = { cwd: path.join(TMP, 'render-fixtures', 'project'), packageRoot: path.join(TMP, 'render-fixtures', 'pkg') };
const baseAssignment = {
  contractTemplate: 'impl-v1', objective: 'build it', role: 'implementer', contextRefs: ['a.md', 'b.md'], expectedOutputs: ['o1'],
  evidence: { required: 'verified' }, provenance: { inline: { contract: { constraints: ['k1', STAMP] } } },
};
const first = tpl.resolveAndRenderOperationPrompt(baseAssignment, rs);
const pinnedOk = clone(first.templateProvenance);
const resolveCases = [];
const resolve = (name, input, options = {}) => {
  const callOptions = { ...rs, ...options };
  resolveCases.push({ name, input, options, result: attempt(() => tpl.resolveAndRenderOperationPrompt(input, callOptions)) });
};
resolve('assignment', baseAssignment);
resolve('assignment-artifact-refs-only', { contractTemplate: 'impl-v1', artifactRefs: ['x'] });
resolve('assignment-bare', { contractTemplate: 'impl-v1' });
resolve('constraints-from-contract', { contractTemplate: 'impl-v1', contract: { constraints: ['c-top'] } });
resolve('constraints-from-provenance-contract', { contractTemplate: 'impl-v1', provenance: { contract: { constraints: ['c-prov'] } }, contract: { constraints: ['ignored'] } });
resolve('constraints-top-level', { contractTemplate: 'impl-v1', constraints: ['c-flat'] });
resolve('evidence-contract-field', { contractTemplate: 'impl-v1', evidenceContract: 'verified' });
resolve('string-id-with-variables', 'impl-v1', { variables: { objective: 'v', role: 'r' } });
resolve('string-id-with-assignment', 'impl-v1', { assignment: { objective: 'a' } });
resolve('string-id-bare', 'impl-v1');
resolve('domain-from-assignment', { contractTemplate: 'coding-only', domain: 'coding', objective: 'o', role: 'r' });
resolve('domain-from-options', { contractTemplate: 'coding-only', objective: 'o' }, { domain: 'ops' });
resolve('domain-ambiguous', { contractTemplate: 'coding-only', objective: 'o' });
resolve('not-found', { contractTemplate: 'absent' });
resolve('bad-id', { contractTemplate: 'no good' });
resolve('no-contract-template', { objective: 'x' });
resolve('contract-template-not-string', { contractTemplate: 7 });
resolve('null-input', null);
resolve('number-input', 5);
resolve('array-input', ['x']);
resolve('pinned-from-assignment', { ...baseAssignment, provenance: { ...baseAssignment.provenance, template: pinnedOk } });
resolve('pinned-from-options', baseAssignment, { templateProvenance: pinnedOk });
resolve('pinned-from-pinned-option', baseAssignment, { pinnedTemplate: pinnedOk });
resolve('pinned-id-only-string-input', 'impl-v1', { templateProvenance: pinnedOk, variables: baseAssignment });
resolve('pinned-wins-over-disk-change', { ...baseAssignment, contractTemplate: undefined, provenance: { ...baseAssignment.provenance, template: pinnedOk } });
const pin = (patch) => ({ ...pinnedOk, ...patch });
const pinCase = (name, pinned, extra = {}) => resolve(name, { ...baseAssignment, ...extra }, { templateProvenance: pinned });
pinCase('pinned-array', ['x']);
pinCase('pinned-string', 'x');
pinCase('pinned-no-snapshot', pin({ templateSnapshot: undefined }));
pinCase('pinned-blank-snapshot', pin({ templateSnapshot: '   ' }));
pinCase('pinned-snapshot-not-string', pin({ templateSnapshot: 5 }));
pinCase('pinned-no-id', pin({ id: undefined }));
pinCase('pinned-blank-id', pin({ id: ' ' }));
pinCase('pinned-id-mismatch', pin({ id: 'other' }));
pinCase('pinned-id-mismatch-no-template', pin({ id: 'other' }), { contractTemplate: undefined });
pinCase('pinned-tier-blank', pin({ tier: ' ' }));
pinCase('pinned-tier-number', pin({ tier: 3 }));
pinCase('pinned-source-blank', pin({ source: '' }));
pinCase('pinned-file-path-number', pin({ filePath: 4 }));
pinCase('pinned-file-path-blank', pin({ filePath: ' ' }));
pinCase('pinned-file-path-null', pin({ filePath: null }));
pinCase('pinned-no-content-digest', pin({ contentDigest: undefined }));
pinCase('pinned-content-digest-number', pin({ contentDigest: 5 }));
pinCase('pinned-content-digest-malformed', pin({ contentDigest: 'sha256:xyz' }));
pinCase('pinned-content-digest-upper', pin({ contentDigest: pinnedOk.contentDigest.toUpperCase().replace('SHA256', 'sha256') }));
pinCase('pinned-content-digest-wrong', pin({ contentDigest: `sha256:${'0'.repeat(64)}` }));
pinCase('pinned-no-rendered-digest', pin({ renderedPromptDigest: undefined }));
pinCase('pinned-rendered-digest-malformed', pin({ renderedPromptDigest: 'nope' }));
pinCase('pinned-rendered-digest-wrong', pin({ renderedPromptDigest: `sha256:${'1'.repeat(64)}` }));
{
  const snapshot = 'snap {nope}\n';
  pinCase('pinned-snapshot-bad-variable', pin({ templateSnapshot: snapshot, contentDigest: sha(snapshot) }));
  const good = 'pinned only {objective}\n';
  const rendered = tpl.renderOperationPromptTemplate(good, { objective: 'build it' });
  pinCase('pinned-defaults-tier-source', { id: 'impl-v1', templateSnapshot: good, contentDigest: sha(good), renderedPromptDigest: sha(rendered) });
  pinCase('pinned-file-path-kept', { id: 'impl-v1', tier: 't', source: 's', filePath: 'p/x.md', templateSnapshot: good, contentDigest: sha(good), renderedPromptDigest: sha(rendered) });
}
write('render.json', { validate: validateCases, render: renderCases, resolve: { scenario: resolveScenario.name, files: resolveScenario.files, cases: resolveCases } });

// ---- the inline execution contract --------------------------------------------------------------------------------
const goodContract = () => ({
  objective: 'do the thing', contextRefs: ['a.md'], constraints: ['be careful'], expectedOutputs: ['report'],
  mutation: 'read-only', evidence: { required: 'reported' }, role: 'reviewer', budget: { timeoutMs: 1000, maxRuns: 2 },
});
const goodCaller = () => ({ writerId: 'writer-1.a_b' });
const cases = [];
const vc = (name, mutate, callerMutate) => {
  const contract = goodContract();
  const caller = goodCaller();
  const c = mutate ? (mutate(contract) ?? contract) : contract;
  const k = callerMutate ? (callerMutate(caller) ?? caller) : caller;
  cases.push({ name, contract: clone(c), caller: clone(k), result: attempt(() => ec.validateExecutionContract({ contract: c, caller: k })) });
};
vc('good');
vc('good-with-optional', (c) => { c.supports = 'op'; c.contractTemplate = 'tpl'; c.capabilities = ['x']; c.policy = { tier: 'standard' }; c.budget.tokens = 5; });
vc('mutating-stamped', (c) => { c.mutation = 'mutating'; c.constraints = ['x', STAMP]; });
vc('mutating-unstamped', (c) => { c.mutation = 'mutating'; });
vc('mutation-other', (c) => { c.mutation = 'sometimes'; });
vc('mutation-missing', (c) => { delete c.mutation; });
vc('not-object', () => 5);
vc('array', () => []);
vc('null', () => null);
vc('unknown-field', (c) => { c.extra = 1; });
vc('forbidden-session-field', (c) => { c.sessionId = 's'; });
vc('forbidden-coordination-id', (c) => { c.coordinationId = 's'; c.extra = 1; });
vc('forbidden-thread', (c) => { c.threadId = 's'; });
vc('forbidden-ref', (c) => { c.coordinationRef = 's'; });
vc('objective-blank', (c) => { c.objective = '   '; });
vc('objective-number', (c) => { c.objective = 4; });
vc('context-refs-not-array', (c) => { c.contextRefs = 'a'; });
vc('context-refs-non-string', (c) => { c.contextRefs = ['a', 1]; });
vc('constraints-missing', (c) => { delete c.constraints; });
vc('expected-outputs-empty', (c) => { c.expectedOutputs = []; });
vc('expected-outputs-non-string', (c) => { c.expectedOutputs = [1]; });
vc('evidence-missing', (c) => { delete c.evidence; });
vc('evidence-array', (c) => { c.evidence = []; });
vc('evidence-unknown-field', (c) => { c.evidence.extra = 1; });
vc('evidence-bad-value', (c) => { c.evidence.required = 'maybe'; });
vc('evidence-verified', (c) => { c.evidence.required = 'verified'; });
vc('role-blank', (c) => { c.role = ''; });
vc('supports-blank', (c) => { c.supports = ' '; });
vc('supports-number', (c) => { c.supports = 3; });
vc('template-blank', (c) => { c.contractTemplate = ''; });
vc('capabilities-bad', (c) => { c.capabilities = 'x'; });
vc('capabilities-non-string', (c) => { c.capabilities = [1]; });
vc('policy-string', (c) => { c.policy = 'x'; });
vc('policy-unknown-field', (c) => { c.policy = { tier: 'standard', model: 'm' }; });
vc('policy-bad-tier', (c) => { c.policy = { tier: 'premium' }; });
vc('policy-no-tier', (c) => { c.policy = {}; });
vc('budget-missing', (c) => { delete c.budget; });
vc('budget-unknown-field', (c) => { c.budget.extra = 1; });
vc('budget-timeout-zero', (c) => { c.budget.timeoutMs = 0; });
vc('budget-timeout-fraction', (c) => { c.budget.timeoutMs = 1.5; });
vc('budget-timeout-whole-float', (c) => { c.budget.timeoutMs = 2e3; });
vc('budget-max-runs-negative', (c) => { c.budget.maxRuns = -1; });
vc('budget-max-runs-string', (c) => { c.budget.maxRuns = '2'; });
vc('budget-tokens-negative', (c) => { c.budget.tokens = -1; });
vc('budget-tokens-string', (c) => { c.budget.tokens = '5'; });
vc('budget-tokens-zero', (c) => { c.budget.tokens = 0; });
vc('caller-missing', null, () => null);
vc('caller-array', null, () => []);
vc('caller-forbidden', null, (k) => { k.sessionId = 's'; });
vc('caller-unknown', null, (k) => { k.extra = 1; });
vc('caller-writer-missing', null, (k) => { delete k.writerId; });
vc('caller-writer-blank', null, (k) => { k.writerId = ' '; });
vc('caller-writer-bad-chars', null, (k) => { k.writerId = 'a b'; });
vc('caller-writer-newline', null, (k) => { k.writerId = 'abc\n'; });
vc('caller-writer-non-ascii', null, (k) => { k.writerId = 'é'; });
vc('caller-writer-200', null, (k) => { k.writerId = 'a'.repeat(200); });
vc('caller-writer-201', null, (k) => { k.writerId = 'a'.repeat(201); });
vc('caller-parent-blank', null, (k) => { k.parentAssignmentId = ' '; });
vc('caller-parent-ok', null, (k) => { k.parentAssignmentId = 'p1'; });
vc('caller-coordination-not-object', null, (k) => { k.coordination = 1; });
vc('caller-coordination-unknown', null, (k) => { k.coordination = { x: 1 }; });
const fan = () => ({ actorId: 'a', objective: 'o', taskKey: 't', expectedOutputs: ['e'], constraints: [] });
vc('fan-out-ok', null, (k) => { k.coordination = { fanOutPayload: { ...fan(), capabilities: ['c'], fromAssignmentId: 'f', intent: 'i' } }; });
vc('fan-out-not-object', null, (k) => { k.coordination = { fanOutPayload: [] }; });
for (const field of ['actorId', 'objective', 'taskKey']) vc(`fan-out-${field}-blank`, null, (k) => { k.coordination = { fanOutPayload: { ...fan(), [field]: '' } }; });
vc('fan-out-outputs-empty', null, (k) => { k.coordination = { fanOutPayload: { ...fan(), expectedOutputs: [] } }; });
vc('fan-out-constraints-bad', null, (k) => { k.coordination = { fanOutPayload: { ...fan(), constraints: [1] } }; });
vc('fan-out-capabilities-bad', null, (k) => { k.coordination = { fanOutPayload: { ...fan(), capabilities: 'x' } }; });
vc('fan-out-from-blank', null, (k) => { k.coordination = { fanOutPayload: { ...fan(), fromAssignmentId: ' ' } }; });
vc('fan-out-intent-blank', null, (k) => { k.coordination = { fanOutPayload: { ...fan(), intent: '' } }; });
const inv = () => ({ actionKey: 'sha256:abc', kind: 'fan-out', normalizedSteps: [{ type: 'x', objective: 'o', omittedFields: ['a'] }] });
vc('invocation-ok', null, (k) => { k.coordination = { actionInvocation: inv() }; });
vc('invocation-not-object', null, (k) => { k.coordination = { actionInvocation: 'x' }; });
vc('invocation-unknown', null, (k) => { k.coordination = { actionInvocation: { ...inv(), extra: 1 } }; });
vc('invocation-key-not-sha', null, (k) => { k.coordination = { actionInvocation: { ...inv(), actionKey: 'abc' } }; });
vc('invocation-key-missing', null, (k) => { k.coordination = { actionInvocation: { ...inv(), actionKey: undefined } }; });
vc('invocation-kind-bad', null, (k) => { k.coordination = { actionInvocation: { ...inv(), kind: 'nope' } }; });
vc('invocation-steps-empty', null, (k) => { k.coordination = { actionInvocation: { ...inv(), normalizedSteps: [] } }; });
vc('invocation-steps-not-array', null, (k) => { k.coordination = { actionInvocation: { ...inv(), normalizedSteps: {} } }; });
vc('invocation-step-not-object', null, (k) => { k.coordination = { actionInvocation: { ...inv(), normalizedSteps: ['x'] } }; });
vc('invocation-step-unknown', null, (k) => { k.coordination = { actionInvocation: { ...inv(), normalizedSteps: [{ bogus: 1 }] } }; });
vc('invocation-step-omitted-bad', null, (k) => { k.coordination = { actionInvocation: { ...inv(), normalizedSteps: [{ omittedFields: 'x' }] } }; });
for (const kind of ['dispatch-operation', 'authorize-and-dispatch', 'record-disposition', 'record-human-turn', 'link-contribution', 'fan-out']) {
  vc(`invocation-kind-${kind}`, null, (k) => { k.coordination = { actionInvocation: { ...inv(), kind } }; });
}
const stepFields = ['type', 'as', 'operationId', 'targetActorId', 'nodeId', 'objective', 'expectedOutputs', 'contextRefs', 'constraints', 'capabilities', 'fromAssignmentId', 'intent', 'round', 'taskKey', 'mutation', 'authorizationId', 'invocationKey', 'reason', 'grantedContextRefs', 'targetArtifactRef', 'targetRef', 'disposition', 'rationale', 'evidenceRefs', 'turnId', 'turnOrdinal', 'channel', 'artifactRef', 'externalRef', 'attributedTo', 'respondsToRefs', 'contributionId', 'contributionType', 'assignmentId', 'roundKey', 'anchors', 'respondsTo', 'branches', 'omittedFields'];
vc('invocation-all-step-fields', null, (k) => { k.coordination = { actionInvocation: { ...inv(), normalizedSteps: [Object.fromEntries(stepFields.map((f) => [f, f === 'omittedFields' ? [] : 1]))] } }; });
vc('first-failure-wins-contract-before-caller', (c) => { c.objective = ''; }, (k) => { k.writerId = ''; });
vc('unknown-before-objective', (c) => { c.zzz = 1; c.objective = ''; });
vc('forbidden-before-unknown', (c) => { c.zzz = 1; c.sessionId = 's'; });
const noArgs = attempt(() => ec.validateExecutionContract());
const normalizeCases = [
  [{ tier: 'standard' }, false], [{ minTier: 'advanced' }, false], [{ minTier: 'advanced', tier: 'standard' }, false],
  [{ minTier: 'premium' }, false], [{ minTier: 'advanced', rigor: 'high' }, false], [{ minTier: 'advanced', rigor: 'high' }, true],
  [{ minTier: 'advanced', tier: 'standard', rigor: 'high' }, true], [null, false], [[], false], ['x', false], [{}, false],
  [{ minTier: 'nano' }, true], [{ minTier: 7 }, true],
].map(([policy, allow]) => ({ policy, allowAdditionalFields: allow, result: attempt(() => ec.normalizeSavedPolicyTier(policy, { allowAdditionalFields: allow })) }));
const constraintLists = [
  undefined, null, 'x', [], ['a'], [STAMP], ['a', STAMP], [STAMP, STAMP], [STAMP, 'protocol-operation:y@2#o2'], ['protocol-operation:'], ['protocol-operation:noat'],
  ['protocol-operation:a@b'], ['protocol-operation:a@b#'], ['protocol-operation:a@b#c'], ['protocol-operation:@b#c'], ['protocol-operation:a@#c'],
  ['protocol-operation:a@b@c#d#e'], ['protocol-operation:a@b#c\nmore'], [1, STAMP], ['x protocol-operation:a@b#c'],
].map((constraints) => ({
  constraints: constraints === undefined ? { absent: true } : constraints,
  carries: ec.carriesProtocolOperationStamp(constraints),
  extracted: plain(ec.extractProtocolOperationStamp(constraints)),
}));
write('contract.json', {
  constants: {
    repeatModeValues: [...ec.REPEAT_MODE_VALUES], policyPatchFields: [...ec.POLICY_PATCH_FIELDS], policyVersion: ec.CONTRACT_POLICY_VERSION,
    stampPrefix: ec.PROTOCOL_OPERATION_STAMP_PREFIX, writerIdRe: ec.WRITER_ID_RE.source, maxWriterIdLength: ec.MAX_WRITER_ID_LENGTH,
    modelPolicyTiers: [...config.MODEL_POLICY_TIERS],
  },
  noArguments: noArgs,
  validate: cases,
  normalizeSavedPolicyTier: normalizeCases,
  stamps: constraintLists,
});

// ---- the checkout facts and the effective contract ----------------------------------------------------------------
const reposRoot = path.join(TMP, 'repos');
fs.mkdirSync(reposRoot, { recursive: true });
const mainDir = path.join(reposRoot, 'main');
fs.mkdirSync(mainDir);
initFixtureRepo(mainDir);
const linkedDir = path.join(reposRoot, 'linked');
sandboxGit(reposRoot)(['-C', mainDir, 'worktree', 'add', '-q', '-b', 'linked-branch', linkedDir], { stdio: 'pipe' });
const unbornDir = path.join(reposRoot, 'unborn');
fs.mkdirSync(unbornDir);
sandboxGit(reposRoot)(['init', '-q', unbornDir], { stdio: 'pipe' });
const outsideDir = path.join(TMP, 'outside');
fs.mkdirSync(outsideDir);
fs.mkdirSync(path.join(mainDir, 'sub', 'deep'), { recursive: true });
fs.mkdirSync(path.join(linkedDir, 'sub'), { recursive: true });
const paths = {
  main: mainDir, 'main-sub': path.join(mainDir, 'sub', 'deep'), linked: linkedDir, 'linked-sub': path.join(linkedDir, 'sub'),
  unborn: unbornDir, outside: outsideDir, 'nowhere-invocation': '/nonexistent/fgos-contract-recorder/invocation', 'nowhere-plan': '/nonexistent/fgos-contract-recorder/plan',
};
const { resolveMainCheckoutRoot, resolveRepoRoot } = await load('src/runner/paths.mjs');
const factsOf = (cwd) => {
  let repoRoot;
  try { repoRoot = { ok: resolveRepoRoot(cwd) }; } catch (error) { repoRoot = { error: error.message }; }
  return { mainCheckoutRoot: resolveMainCheckoutRoot(cwd), repoRoot };
};
const factsByPath = Object.fromEntries(Object.values(paths).map((p) => [p, factsOf(p)]));
const posture = Object.entries(paths).map(([label, cwd]) => scrub({ label, cwd, result: (() => {
  const r = ec.resolveMutatingCwdPosture(cwd);
  return r.error ? { ...r, error: { message: r.error.message } } : r;
})() }));

const basePlan = () => ({ mechanism: 'out-of-process', executorId: 'ex1', invocation: { adapter: 'cli-spawn' } });
const baseParams = () => ({
  assignment: { assignmentId: 'asg-1', mutation: 'read-only' }, dispatchPlan: basePlan(), runId: 'run-1', runDir: '/runs/run-1', cwd: outsideDir,
});
const effective = [];
const effCase = (name, mutate) => {
  const params = baseParams();
  const next = mutate ? (mutate(params) ?? params) : params;
  const cwdForFacts = next.cwd ?? next.dispatchPlan?.invocation?.cwd ?? next.dispatchPlan?.cwd;
  effective.push({ name, params: scrub(next), cwd: scrub(cwdForFacts ?? null), result: attempt(() => eec.buildEffectiveExecutionContract(next)) });
};
effCase('read-only-outside-git');
effCase('mutating-linked-worktree', (p) => { p.assignment.mutation = 'mutating'; p.cwd = linkedDir; });
effCase('mutating-linked-subdir', (p) => { p.assignment.mutation = 'mutating'; p.cwd = paths['linked-sub']; });
effCase('mutating-main-checkout', (p) => { p.assignment.mutation = 'mutating'; p.cwd = mainDir; });
effCase('read-only-main-subdir', (p) => { p.cwd = paths['main-sub']; });
effCase('unresolvable-no-repo-root', (p) => { p.assignment.mutation = 'mutating'; p.cwd = unbornDir; });
effCase('unresolvable-with-repo-root', (p) => { p.assignment.mutation = 'mutating'; p.cwd = unbornDir; p.repoRoot = '/some/repo'; });
effCase('mutation-from-assignment-absent-reviewer', (p) => { delete p.assignment.mutation; p.assignment.role = 'reviewer'; });
effCase('mutation-absent-is-mutating', (p) => { delete p.assignment.mutation; });
effCase('mutation-bad', (p) => { p.assignment.mutation = 'sometimes'; });
effCase('cwd-from-invocation', (p) => { delete p.cwd; p.dispatchPlan.invocation.cwd = paths['nowhere-invocation']; p.assignment.mutation = 'mutating'; });
effCase('cwd-from-plan', (p) => { delete p.cwd; p.dispatchPlan.cwd = paths['nowhere-plan']; });
effCase('cwd-with-dot-segments', (p) => { p.cwd = `${linkedDir}/sub/../sub/./`; p.assignment.mutation = 'mutating'; });
effCase('executor-from-parameter', (p) => { p.executorId = 'param-ex'; p.adapter = 'param-adapter'; });
effCase('executor-from-plan', (p) => { delete p.dispatchPlan.executorId; p.dispatchPlan.executorId = 'plan-ex'; });
effCase('confinement-required-enforced', (p) => { p.confinement = { requirement: { mode: 'required', policyId: 'p1' }, backend: { id: 'bwrap' } }; });
effCase('confinement-requirement-only', (p) => { p.confinement = { mode: 'required' }; });
effCase('confinement-controls-enforced', (p) => { p.confinement = { requirement: { mode: 'advisory', controls: { fs: 'ro' } } }; });
effCase('confinement-backend-none-id', (p) => { p.confinement = { requirement: { mode: 'required', policyId: 'p' }, backend: { id: 'none' } }; });
effCase('confinement-backend-none-type', (p) => { p.confinement = { requirement: { mode: 'required', policyId: 'p' }, backend: { type: 'none', id: 'x' } }; });
effCase('confinement-unconfined', (p) => { p.confinement = { requirement: { mode: 'unconfined', policyId: 'p' } }; });
effCase('confinement-no-policy', (p) => { p.confinement = { requirement: { mode: 'advisory' } }; });
effCase('confinement-from-plan-policy', (p) => { p.dispatchPlan.policy = { confinement: { requirement: { mode: 'required', policyId: 'z' } } }; });
effCase('confinement-from-executor-config', (p) => { p.runnerConfig = { executors: { ex1: { confinement: { requirement: { mode: 'required', policyId: 'cfg' } } } } }; });
effCase('confinement-from-executor-default', (p) => { p.runnerConfig = { executor: { confinement: { requirement: { mode: 'required', policyId: 'dflt' } } } }; });
effCase('timeout-parameter', (p) => { p.timeoutMs = 1234; p.assignment.budget = { timeoutMs: 5 }; });
effCase('timeout-parameter-invalid', (p) => { p.timeoutMs = 1.5; p.assignment.budget = { timeoutMs: 77 }; });
effCase('timeout-from-assignment', (p) => { p.assignment.budget = { timeoutMs: 4321 }; p.runnerConfig = { timeoutMs: 9 }; });
effCase('timeout-from-config', (p) => { p.runnerConfig = { timeoutMs: 9999 }; });
effCase('timeout-config-invalid-default', (p) => { p.runnerConfig = { timeoutMs: -4 }; p.assignment.budget = { timeoutMs: 0 }; });
effCase('timeout-default');
effCase('session-wall-time', (p) => { p.sessionWallTimeExpiresAt = '2026-11-19T00:00:00.000Z'; });
effCase('result-claim-path', (p) => { p.resultClaimPath = '/custom/claim/result-9.json'; });
effCase('run-dir-with-dot-segments', (p) => { p.runDir = '/runs/a/../run-2/'; });
effCase('template-from-parameter', (p) => { p.templateProvenance = pinnedOk; });
effCase('template-from-assignment', (p) => { p.assignment.provenance = { template: pinnedOk }; });
effCase('template-parameter-wins', (p) => { p.templateProvenance = pinnedOk; p.assignment.provenance = { template: { id: 'ignored' } }; });
effCase('template-invalid-digest', (p) => { p.templateProvenance = { ...pinnedOk, contentDigest: 'sha256:xx' }; });
effCase('template-snapshot-mismatch', (p) => { p.templateProvenance = { ...pinnedOk, templateSnapshot: 'tampered' }; });
effCase('template-not-object', (p) => { p.templateProvenance = ['x']; });
effCase('template-minimal', (p) => { p.templateProvenance = { id: 't', contentDigest: `sha256:${'a'.repeat(64)}`, renderedPromptDigest: `sha256:${'b'.repeat(64)}` }; });
effCase('provider-capacity', (p) => { p.providerCapacity = { provider: 'codex', accountId: 'acct-1', credentialSource: '/secret', token: 't', label: 'x' }; });
effCase('provider-capacity-leaks-home', (p) => { p.providerCapacity = { provider: 'codex', accountId: 'a', home: '/h' }; });
effCase('provider-capacity-no-account', (p) => { p.providerCapacity = { provider: 'codex' }; });
effCase('provider-capacity-no-provider', (p) => { p.providerCapacity = { accountId: 'a' }; });
effCase('provider-capacity-array', (p) => { p.providerCapacity = ['x']; });
effCase('provider-capacity-sha', (p) => { p.providerCapacity = { provider: 'codex', accountId: 'a', sha256: 'x', authJsonDigest: 'y' }; });
effCase('runner-config-hashed-and-stripped', (p) => { p.runnerConfig = { timeoutMs: 1000, executors: { ex1: { env: { A: 'b' }, headers: { h: 1 }, apiKey: 'k', model: 'm', authentication: 'ok', credentialProvisioned: true } } }; });
effCase('dispatch-plan-secrets-stripped', (p) => { p.dispatchPlan.invocation.env = { TOKEN: 'x' }; p.dispatchPlan.cookie = 'c'; p.dispatchPlan.authorization = 'allowed'; p.dispatchPlan.authorizationId = 'dropped'; });
effCase('dispatch-plan-unicode-and-numbers', (p) => { p.dispatchPlan.zeta = { 'ä': 1, 'a': 1e21, '😀': 0.1, 'Z': -0, nested: [1, 2.5, 'é', null, true] }; });
effCase('no-assignment', (p) => { delete p.assignment; });
effCase('assignment-array', (p) => { p.assignment = []; });
effCase('no-assignment-id', (p) => { delete p.assignment.assignmentId; });
effCase('assignment-id-number', (p) => { p.assignment.assignmentId = 1; });
effCase('no-run-id', (p) => { delete p.runId; });
effCase('no-run-dir', (p) => { delete p.runDir; });
effCase('no-dispatch-plan', (p) => { delete p.dispatchPlan; });
effCase('plan-array', (p) => { p.dispatchPlan = []; });
effCase('no-mechanism', (p) => { delete p.dispatchPlan.mechanism; });
effCase('null-mechanism', (p) => { p.dispatchPlan.mechanism = null; });
effCase('no-executor', (p) => { delete p.dispatchPlan.executorId; });
effCase('no-adapter', (p) => { delete p.dispatchPlan.invocation; });
effCase('executor-blank-ok', (p) => { p.executorId = ' '; });
effCase('adapter-number', (p) => { p.adapter = 5; });

const okContract = effective.find((c) => c.name === 'mutating-linked-worktree').result.ok;
const mutateCases = [];
const mut = (name, fn) => {
  const value = clone(okContract);
  const next = fn(value) ?? value;
  mutateCases.push({ name, value: scrub(next), result: attempt(() => eec.validateEffectiveExecutionContract(next)) });
};
mut('valid', () => null);
mut('not-object', () => 5);
mut('array', () => []);
mut('null', () => null);
mut('secret-key', (v) => { v.workspace.token = 'x'; });
mut('secret-key-nested-array', (v) => { v.limits = { executorTimeoutMs: 1, list: [{ password: 'x' }] }; });
mut('credential-provisioned-allowed', (v) => { v.workspace.credentialProvisioned = true; });
mut('credential-provisioned-non-bool', (v) => { v.workspace.credentialProvisioned = 'yes'; });
mut('authentication-key-allowed', (v) => { v.workspace.authentication = 'x'; });
mut('authorization-key-allowed', (v) => { v.workspace.authorization = 'x'; });
mut('authorization-id-secret', (v) => { v.workspace.authorizationId = 'x'; });
mut('auth-secret', (v) => { v.workspace.Auth = 'x'; });
mut('contract-missing', (v) => { delete v.contract; });
mut('contract-array', (v) => { v.contract = []; });
mut('contract-wrong-id', (v) => { v.contract.id = 'x'; });
mut('contract-wrong-version', (v) => { v.contract.version = 2; });
mut('assignment-id-blank', (v) => { v.assignmentId = ' '; });
mut('run-id-missing', (v) => { delete v.runId; });
mut('mutation-bad', (v) => { v.mutation = 'x'; });
mut('workspace-missing', (v) => { delete v.workspace; });
mut('workspace-array', (v) => { v.workspace = []; });
mut('cwd-blank', (v) => { v.workspace.cwd = ' '; });
mut('write-scope-not-array', (v) => { v.workspace.writeScope = 'x'; });
mut('main-checkout-absent', (v) => { delete v.workspace.mainCheckout; });
mut('main-checkout-null', (v) => { v.workspace.mainCheckout = null; });
mut('main-checkout-blank', (v) => { v.workspace.mainCheckout = ' '; });
mut('main-checkout-number', (v) => { v.workspace.mainCheckout = 4; });
mut('tools-missing', (v) => { delete v.tools; });
mut('tools-shell-missing', (v) => { delete v.tools.shell; });
mut('tools-shell-enforced-string', (v) => { v.tools.shell.enforced = 'no'; });
mut('permissions-missing', (v) => { delete v.permissions; });
mut('permissions-fs-enforced-missing', (v) => { delete v.permissions.filesystem.enforced; });
mut('permissions-fs-missing', (v) => { delete v.permissions.filesystem; });
mut('posture-bad', (v) => { v.enforcementPosture = 'maybe'; });
mut('adapter-family-blank', (v) => { v.adapterFamily = ' '; });
mut('limits-missing', (v) => { delete v.limits; });
mut('timeout-zero', (v) => { v.limits.executorTimeoutMs = 0; });
mut('timeout-fraction', (v) => { v.limits.executorTimeoutMs = 1.5; });
mut('result-claim-missing', (v) => { delete v.resultClaim; });
mut('result-claim-contract-wrong', (v) => { v.resultClaim.contract.version = 1; });
mut('result-claim-contract-missing', (v) => { delete v.resultClaim.contract; });
mut('result-claim-path-blank', (v) => { v.resultClaim.path = ' '; });
mut('provenance-missing', (v) => { delete v.provenance; });
mut('plan-hash-not-sha', (v) => { v.provenance.dispatchPlanHash = 'abc'; });
mut('plan-hash-missing', (v) => { delete v.provenance.dispatchPlanHash; });
mut('executor-blank', (v) => { v.provenance.executorId = ''; });
mut('adapter-blank', (v) => { v.provenance.adapter = ''; });
const withTemplate = (fn) => (v) => { v.provenance.template = clone(pinnedOk); fn(v.provenance.template); };
mut('template-valid', withTemplate(() => {}));
mut('template-null', (v) => { v.provenance.template = null; });
mut('template-array', (v) => { v.provenance.template = []; });
mut('template-id-blank', withTemplate((t) => { t.id = ' '; }));
mut('template-content-digest-bad', withTemplate((t) => { t.contentDigest = 'sha256:x'; }));
mut('template-rendered-digest-bad', withTemplate((t) => { t.renderedPromptDigest = 'x'; }));
mut('template-tier-blank', withTemplate((t) => { t.tier = ''; }));
mut('template-source-blank', withTemplate((t) => { t.source = ''; }));
mut('template-file-path-number', withTemplate((t) => { t.filePath = 3; }));
mut('template-file-path-null', withTemplate((t) => { t.filePath = null; }));
mut('template-snapshot-blank', withTemplate((t) => { t.templateSnapshot = ' '; }));
mut('template-snapshot-digest-mismatch', withTemplate((t) => { t.templateSnapshot = 'other\n'; }));
mut('template-no-snapshot', withTemplate((t) => { delete t.templateSnapshot; }));
mut('capacity-null', (v) => { v.providerCapacity = null; });
mut('capacity-array', (v) => { v.providerCapacity = []; });
for (const forbidden of ['credentialSource', 'home', 'env', 'environment', 'authJsonDigest', 'sha256']) {
  mut(`capacity-${forbidden}`, (v) => { v.providerCapacity = { provider: 'p', accountId: 'a', [forbidden]: 'x' }; });
}
mut('capacity-ok', (v) => { v.providerCapacity = { provider: 'p', accountId: 'a' }; });
mut('capacity-provider-blank', (v) => { v.providerCapacity = { provider: ' ', accountId: 'a' }; });
mut('capacity-account-blank', (v) => { v.providerCapacity = { provider: 'p', accountId: '' }; });

const summaries = effective.filter((c) => c.result.ok).map((c) => ({ name: c.name, contract: c.result.ok, summary: eec.renderEffectiveContractSummary(c.result.ok) }));
{
  const noScope = clone(okContract); noScope.workspace.writeScope = []; noScope.workspace.mainCheckout = null; noScope.limits = { timeoutMs: 77 };
  summaries.push({ name: 'read-only-legacy-timeout', contract: scrub(noScope), summary: scrub(eec.renderEffectiveContractSummary(noScope)) });
  const two = clone(okContract); two.workspace.writeScope = ['/a', '/b'];
  summaries.push({ name: 'two-scopes', contract: scrub(two), summary: scrub(eec.renderEffectiveContractSummary(two)) });
}

const digestValues = [
  null, true, 'text', 7, 1.5, -0, 1e21, 1e-7, [], {}, [1, [2, { b: 1, a: 2 }]], { b: 1, a: { d: 1, c: [3, 2, 1] } }, { 'é': 1, e: 2, 'z': 3, '😀': 4, '￿': 5, '퟿': 6 },
  { quote: 'a"b\\c\n\t\u0001\u007f ' }, { '': 0, ' ': 1 }, { n: [0.1, 100, 1e300, 123456789012345680000, 5e-324] },
];
const stripValues = [
  { a: 1, token: 't', nested: { password: 'p', ok: 2, list: [{ secret: 1, keep: 2 }] } }, { env: {}, environment: {}, headers: {}, keep: 1 },
  { credentialProvisioned: true, credentialsFile: 'x' }, { credentialProvisioned: 'yes' }, { apiKey: 1, APIKEY: 2, api_key: 3, privateKey: 4, PrivateKey: 5 },
  { cookie: 1, Cookies: 2, authentication: 3, authorization: 4, authorizations: 5, authorizationId: 6, auth: 7, oauth: 8, author: 9, authority: 10, authenticationX: 11 },
  ['x', { token: 1 }], 'plain', 5, null, { 'authorization_x': 1, 'authorization-x': 2, 'authorization x': 3, 'authorizationé': 4 },
];
const digestCases = digestValues.map((value) => ({ value, canonical: eec.canonicalJson(value), digest: eec.computeSha256Digest(value) }));
digestCases.push({ value: 'raw string is hashed as text', canonical: null, digest: eec.computeSha256Digest('raw string is hashed as text'), asText: true });
const stripCases = stripValues.map((value) => ({ value, stripped: eec.stripSecrets(value), assert: attempt(() => eec.assertNoSecrets(value)) }));

const readCases = [];
{
  const dir = (name) => { const d = path.join(TMP, 'read', name); fs.mkdirSync(d, { recursive: true }); return d; };
  readCases.push({ name: 'absent', dir: scrub(dir('absent')), result: attempt(() => eec.readEffectiveExecutionContract(path.join(TMP, 'read', 'absent'))) });
  const ok = dir('ok'); fs.writeFileSync(path.join(ok, eec.EFFECTIVE_EXECUTION_CONTRACT_FILE), `${JSON.stringify(okContract)}\n`);
  readCases.push({ name: 'valid', file: okContract, dir: scrub(ok), result: attempt(() => eec.readEffectiveExecutionContract(ok)) });
  const bad = dir('invalid-contract'); const broken = clone(okContract); broken.mutation = 'x';
  fs.writeFileSync(path.join(bad, eec.EFFECTIVE_EXECUTION_CONTRACT_FILE), JSON.stringify(broken));
  readCases.push({ name: 'invalid-contract', file: broken, dir: scrub(bad), result: attempt(() => eec.readEffectiveExecutionContract(bad)) });
  const json = dir('invalid-json'); fs.writeFileSync(path.join(json, eec.EFFECTIVE_EXECUTION_CONTRACT_FILE), '{not json');
  const jsonResult = attempt(() => eec.readEffectiveExecutionContract(json));
  readCases.push({ name: 'invalid-json', raw: '{not json', dir: scrub(json), messagePrefix: `invalid JSON in effective execution contract at ${path.join(json, eec.EFFECTIVE_EXECUTION_CONTRACT_FILE)}: `.replaceAll(TMP, '$TMP'), result: { error: { name: jsonResult.error.name, code: jsonResult.error.code } } });
}
write('effective.json', {
  constants: { contract: { ...eec.EFFECTIVE_EXECUTION_CONTRACT }, file: eec.EFFECTIVE_EXECUTION_CONTRACT_FILE, defaultSeatTimeoutMs: (await load('src/runner/dispatch/confinement/resources.mjs')).DEFAULT_SEAT_TIMEOUT_MS },
  posture,
  facts: scrub(factsByPath),
  build: effective,
  validate: mutateCases,
  summaries,
  digests: digestCases,
  strip: stripCases,
  read: readCases,
});

fs.rmSync(TMP, { recursive: true, force: true });
console.log(`execution-contract vectors written to ${path.relative(repo, outDir)}`);
