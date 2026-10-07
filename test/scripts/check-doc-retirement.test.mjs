import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  evaluateRetirement,
  summarizeResults,
  exitCodeFor,
  uncoveredHistoryReferences,
  openConflictGroups,
  unrewrittenConsumerEdges,
  runCli,
} from '../../scripts/check-doc-retirement.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const constitution = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'plans/260925-documentation-authority-unification/minimum-constitution.json'), 'utf8'));
const clone = (value) => JSON.parse(JSON.stringify(value));

function cleanInputs() {
  return {
    inventory: { items: [{ path: 'docs/platform/a/README.md', proposedDisposition: 'promote' }], consumerEdges: [], duplicateContentGroups: [], semanticConflictGroups: [] },
    previousRegistries: [{ registry: { units: [] }, label: 'the sealed registry' }],
    reviewRecords: {},
    conservation: { invariant: [], open: [] },
    cutoverRows: { rows: 1, byReason: {}, total: 0 },
    usageDrift: [],
    aliasTable: { entries: [] },
    aliasFindings: [],
    ratchetResult: { findings: [] },
    promotion: { canonicalDocuments: 2, complete: 2, headerless: 0, headeredIncomplete: 0 },
    candidateStatus: { counts: { byStatus: { unrouted: 0 }, byType: {}, exemptUnrouted: 0 }, findings: [] },
  };
}

// These checks have no implementation yet, so they stay blocked whatever the inputs say.
const STILL_PLANNED = new Set(['evidence-digests', 'write-lease']);

function statusById(results) {
  return Object.fromEntries(results.map((r) => [`${r.gate}/${r.id}`, r.status]));
}

test('every check of both gates gets a result; clean inputs leave only the planned checks blocked and the review check owed', () => {
  const results = evaluateRetirement(cleanInputs(), constitution);
  const expected = [...constitution.promotionGate.checks, ...constitution.retirementGate.checks].length + 1;
  assert.equal(results.length, expected);
  for (const r of results) {
    if (r.enforcedBy === 'review') assert.equal(r.status, 'review', r.id);
    else if (STILL_PLANNED.has(r.id)) assert.equal(r.status, 'blocked', r.id);
    else assert.equal(r.status, 'pass', `${r.gate}/${r.id}: ${r.measure}`);
  }
});

const defects = [
  ['file-disposition', (i) => { i.conservation.open.push({ type: 'files-unknown-blocking', count: 2, message: 'm', examples: [] }); }],
  ['claims-closed', (i) => { i.conservation.open.push({ type: 'claims-unknown-blocking', count: 3, message: 'm', examples: [] }); }],
  ['claims-closed', (i) => { i.conservation.open.push({ type: 'claims-partial-carry', count: 2, message: 'm', examples: [] }); }],
  ['claims-reviewed', (i) => { i.conservation.open.push({ type: 'claims-not-reviewed', count: 3, message: 'm', examples: [] }); }],
  ['dropped-claims-resolved', (i) => { i.conservation.open.push({ type: 'dropped-claims-unreviewed', count: 1, message: 'm', examples: [] }); }],
  ['aliases-cover-immutable-refs', (i) => { i.inventory.consumerEdges.push({ path: 'archive/plans/p.md', targetPath: 'docs/specs/runner.md', kind: 'literal' }); }],
  ['consumers-rewritten', (i) => { i.inventory.consumerEdges.push({ path: 'src/a.mjs', targetPath: 'docs/specs/runner.md', kind: 'literal' }); }],
  ['no-new-legacy-growth', (i) => { i.ratchetResult = { findings: [{ type: 'new-file' }] }; }],
  ['row-set-conserved', (i) => { i.conservation.invariant.push({ type: 'claim-id-not-conserved', message: 'm' }); }],
  ['row-set-conserved', (i) => { i.previousRegistries = []; }],
  ['one-owner-per-semantic-claim', (i) => { i.conservation.invariant.push({ type: 'semantic-claim-multiple-owners', message: 'm' }); }],
  ['cutover-mode', (i) => { i.cutoverRows = { rows: 1, byReason: { 'not-reviewed': 1 }, total: 1 }; }],
  ['cutover-mode', (i) => { i.usageDrift = [{ section: 'x', id: 'y' }]; }],
  ['reviewed-rationale', (i) => { i.cutoverRows = { rows: 1, byReason: { 'without-own-rationale': 4 }, total: 4 }; }],
  ['canonical-metadata-complete', (i) => { i.promotion = { canonicalDocuments: 2, complete: 1, headerless: 1, headeredIncomplete: 0 }; }],
  ['metadata-and-structure', (i) => { i.candidateStatus = { counts: { byStatus: { unrouted: 2 }, byType: {}, exemptUnrouted: 0 }, findings: [] }; }],
  ['links-resolve', (i) => { i.candidateStatus = { counts: { byStatus: { unrouted: 0 }, byType: { 'unresolved-link': 1 }, exemptUnrouted: 0 }, findings: [] }; }],
  ['owner-per-claim', (i) => { i.cutoverRows = { rows: 1, byReason: { 'retained-without-owner': 2 }, total: 2 }; }],
];

for (const [id, mutate] of defects) {
  test(`a defect in ${id} blocks exactly that check`, () => {
    const inputs = cleanInputs();
    mutate(inputs);
    const results = evaluateRetirement(inputs, constitution);
    const blockedIds = results.filter((r) => r.status === 'blocked').map((r) => r.id);
    assert.ok(blockedIds.includes(id), `${id} blocked, got ${blockedIds}`);
    // Checks that read the same counts block together.
    const sharedCounts = ['cutover-mode', 'reviewed-rationale', 'owner-per-claim', 'claims-closed', 'claims-reviewed'];
    const other = results.filter((r) => r.id !== id && r.status === 'blocked' && !STILL_PLANNED.has(r.id) && !sharedCounts.includes(r.id));
    assert.deepEqual(other.map((r) => r.id), [], 'no unrelated check is blocked');
  });
}

test('the evidence check stays blocked until a verifier exists, whatever the inputs say', () => {
  assert.match(evaluateRetirement(cleanInputs(), constitution).find((r) => r.id === 'evidence-digests').measure, /no evidence relocation manifest and no verifier/);
});

test('a review check stays owed until a record names reviewer, date and evidence, and cutover mode counts it', () => {
  const owed = evaluateRetirement(cleanInputs(), constitution).find((r) => r.id === 'intent-and-boundary');
  assert.equal(owed.status, 'review');
  const partial = cleanInputs();
  partial.reviewRecords = { 'intent-and-boundary': { reviewer: 'owner' } };
  assert.equal(evaluateRetirement(partial, constitution).find((r) => r.id === 'intent-and-boundary').status, 'review');
  const recorded = cleanInputs();
  recorded.reviewRecords = { 'intent-and-boundary': { reviewer: 'owner', reviewedAt: '2026-10-06', evidence: 'plans/x/review.md' } };
  assert.equal(evaluateRetirement(recorded, constitution).find((r) => r.id === 'intent-and-boundary').status, 'pass');
  assert.equal(exitCodeFor({ cutover: true, counts: { pass: 3, blocked: 0, review: 1 }, invariantFailures: [] }), 1);
});

test('a check dropped from the constitution is reported as blocked', () => {
  const copy = clone(constitution);
  copy.retirementGate.checks = copy.retirementGate.checks.filter((c) => c.id !== 'write-lease');
  const dropped = evaluateRetirement(cleanInputs(), copy).find((r) => r.gate === 'constitution' && r.id === 'write-lease');
  assert.equal(dropped.status, 'blocked');
  assert.match(dropped.measure, /no longer lists this check/);
});

test('an unresolved conflict group blocks the plan acceptance check', () => {
  const inputs = cleanInputs();
  inputs.inventory.duplicateContentGroups = [{ key: 'k', paths: ['a', 'b'] }];
  const result = evaluateRetirement(inputs, constitution).find((r) => r.id === 'no-unresolved-conflicts');
  assert.equal(result.status, 'blocked');
});

test('a check the constitution marks planned is blocked even when its computed measure is clean, and a check with no evaluator is blocked as unevaluated', () => {
  const copy = clone(constitution);
  copy.retirementGate.checks.find((c) => c.id === 'row-set-conserved').enforcedBy = { kind: 'planned', deliverable: 'conservation checker' };
  copy.retirementGate.checks.push({ id: 'brand-new-check', rule: 'r', enforcedBy: { kind: 'script', path: 'scripts/x.mjs' } });
  const results = evaluateRetirement(cleanInputs(), copy);
  const planned = results.find((r) => r.id === 'row-set-conserved');
  assert.equal(planned.status, 'blocked');
  assert.match(planned.measure, /still marks this check planned/);
  const unevaluated = results.find((r) => r.id === 'brand-new-check');
  assert.equal(unevaluated.status, 'blocked');
  assert.match(unevaluated.measure, /unevaluated/);
});

test('legacy paths that history reads by path are covered only by a bare-path alias', () => {
  const inventory = { consumerEdges: [
    { path: 'archive/plans/a.md', targetPath: 'docs/specs/runner.md', kind: 'literal' },
    { path: 'docs/history/x/y.md', targetPath: 'docs/architect/x/y.md', kind: 'literal' },
    { path: '.fgos/events/e.jsonl', targetPath: 'docs/architect/x/y.md', kind: 'literal' },
    { path: 'src/a.mjs', targetPath: 'docs/specs/other.md', kind: 'literal' },
    { path: 'archive/plans/b.md', targetPath: 'docs/platform/a.md', kind: 'literal' },
  ] };
  assert.deepEqual(uncoveredHistoryReferences(inventory, { entries: [] }), { targets: 2, uncovered: ['docs/architect/x/y.md', 'docs/specs/runner.md'] });
  const anchorOnly = { entries: [{ fromPath: 'docs/specs/runner.md#dispatch', toOwner: 'docs/platform/runner/README.md' }] };
  assert.deepEqual(uncoveredHistoryReferences(inventory, anchorOnly).uncovered, ['docs/architect/x/y.md', 'docs/specs/runner.md'], 'an anchor alias does not cover the document');
  const bare = { entries: [{ fromPath: 'docs/specs/runner.md', toOwner: 'docs/platform/runner/README.md' }] };
  assert.deepEqual(uncoveredHistoryReferences(inventory, bare).uncovered, ['docs/architect/x/y.md']);
});

test('duplicate groups made only of evidence mirrors resolve by deduplication and do not count as conflicts', () => {
  const mirror = { key: 'm', paths: ['docs/architect/agent-coordination/verification/panel/P01/a.md', 'docs/platform/agent-coordination/verification/panel/P01/a.md'] };
  const real = { key: 'r', paths: ['docs/specs/runner.md', 'docs/architect/runner.md'] };
  assert.deepEqual(openConflictGroups({ duplicateContentGroups: [mirror, mirror, real], semanticConflictGroups: [{ key: 's' }] }), { duplicates: 1, mirrors: 2, semantic: 1 });
});

test('consumer edges count only authority readers of legacy paths', () => {
  const inventory = { consumerEdges: [
    { path: 'src/a.mjs', targetPath: 'docs/specs/runner.md', kind: 'literal' },
    { path: 'src/b.mjs', targetPath: 'docs/specs/runner.md', kind: 'literal' },
    { path: 'test/c.test.mjs', targetPath: 'docs/architect/x.md', kind: 'fixture' },
    { path: 'archive/plans/p.md', targetPath: 'docs/specs/runner.md', kind: 'literal' },
    { path: 'docs/history/h.md', targetPath: 'docs/specs/runner.md', kind: 'literal' },
    { path: 'docs/specs/other.md', targetPath: 'docs/specs/runner.md', kind: 'literal' },
    { path: 'src/d.mjs', targetPath: 'docs/platform/a.md', kind: 'literal' },
  ] };
  assert.deepEqual(unrewrittenConsumerEdges(inventory), { total: 3, byKind: { literal: 2, fixture: 1 }, unresolvedDynamic: 0 });
});

test('the dry run fails only on a conservation invariant; cutover mode also fails while a check is blocked', () => {
  const counts = (blocked) => ({ pass: 1, blocked, review: 0 });
  assert.equal(exitCodeFor({ cutover: false, counts: counts(5), invariantFailures: [] }), 0);
  assert.equal(exitCodeFor({ cutover: false, counts: counts(0), invariantFailures: [{ type: 'claim-id-not-conserved' }] }), 1);
  assert.equal(exitCodeFor({ cutover: true, counts: counts(1), invariantFailures: [] }), 1);
  assert.equal(exitCodeFor({ cutover: true, counts: counts(0), invariantFailures: [] }), 0);
  assert.deepEqual(summarizeResults([{ status: 'pass' }, { status: 'blocked' }, { status: 'blocked' }, { status: 'review' }]), { pass: 1, blocked: 2, review: 1 });
});

test('cli: an unreadable inventory is fatal and names the regenerate command', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-retirement-'));
  const errors = [];
  const original = console.error;
  console.error = (...args) => errors.push(args.join(' '));
  try {
    for (const file of ['claim-and-disposition-vocabulary.json', 'minimum-constitution.json', 'claim-ledger.schema.json', 'transitional-switchboard.json', 'alias-table.json']) {
      fs.mkdirSync(path.join(dir, 'plans/260925-documentation-authority-unification'), { recursive: true });
      fs.copyFileSync(path.join(REPO_ROOT, 'plans/260925-documentation-authority-unification', file), path.join(dir, 'plans/260925-documentation-authority-unification', file));
    }
    assert.equal(runCli([], dir), 1);
    assert.match(errors.join('\n'), /check-doc-retirement error loading input/);
    assert.match(errors.join('\n'), /generate-doc-inventory\.mjs --refresh --commit/);
  } finally { console.error = original; fs.rmSync(dir, { recursive: true, force: true }); }
});

const duplicateKey = 'a'.repeat(40);
const conflictInventory = {
  duplicateContentGroups: [{ blobSha: duplicateKey, paths: ['docs/specs/a.md', 'docs/platform/a.md'] }],
  semanticConflictGroups: [{ key: 'runner:contract', paths: ['docs/specs/a.md', 'docs/specs/b.md'] }],
};
const resolution = (kind, key) => ({ kind, key, resolution: 'One maintained owner carries the contract.', rule: 'Other sources retain no maintained authority.', evidence: ['reports/owner-review.md'] });

test('recorded duplicate and semantic resolutions close only their named conflict groups', () => {
  const records = { version: 1, groups: [resolution('duplicate', duplicateKey), resolution('semantic', 'runner:contract')] };
  assert.deepEqual(openConflictGroups(conflictInventory, records), { duplicates: 0, mirrors: 0, semantic: 0 });
  const more = { duplicateContentGroups: [...conflictInventory.duplicateContentGroups, { blobSha: 'b'.repeat(40), paths: ['docs/specs/c.md', 'docs/platform/c.md'] }], semanticConflictGroups: [...conflictInventory.semanticConflictGroups, { key: 'runner:state', paths: ['docs/specs/c.md', 'docs/specs/d.md'] }] };
  assert.deepEqual(openConflictGroups(more, records), { duplicates: 1, mirrors: 0, semantic: 1 });
});

test('the retirement acceptance gate consumes conflict decisions without removing any remaining conflict', () => {
  const inputs = { ...cleanInputs(), inventory: conflictInventory, conflictResolutions: { version: 1, groups: [resolution('duplicate', duplicateKey)] } };
  assert.equal(evaluateRetirement(inputs, constitution).find((result) => result.id === 'no-unresolved-conflicts').status, 'blocked');
  inputs.conflictResolutions.groups.push(resolution('semantic', 'runner:contract'));
  assert.equal(evaluateRetirement(inputs, constitution).find((result) => result.id === 'no-unresolved-conflicts').status, 'pass');
});

test('malformed and duplicate conflict decisions fail instead of granting closure', () => {
  const valid = resolution('duplicate', duplicateKey);
  const invalid = [
    { version: 2, groups: [valid] },
    { version: 1, groups: {} },
    ...[{ ...valid, kind: 'other' }, { ...valid, key: '' }, { ...valid, resolution: '' }, { ...valid, rule: '' }, { ...valid, evidence: [] }, { ...valid, evidence: [''] }].map((entry) => ({ version: 1, groups: [entry] })),
    { version: 1, groups: [valid, valid] },
  ];
  for (const records of invalid) assert.throws(() => openConflictGroups(conflictInventory, records), /conflict resolution/i);
  assert.deepEqual(openConflictGroups(conflictInventory), { duplicates: 1, mirrors: 0, semantic: 1 });
});

test('historical decisions remain recordable after a group disappears and never close another group', () => {
  const records = { version: 1, groups: [resolution('duplicate', 'c'.repeat(40)), resolution('semantic', 'retired:old-contract')] };
  assert.deepEqual(openConflictGroups(conflictInventory, records), { duplicates: 1, mirrors: 0, semantic: 1 });
});

test('named retiring files participate in history alias coverage without swallowing neighboring paths or kept projections', () => {
  const inventory = { consumerEdges: [
    { path: 'plans/history.md', targetPath: 'docs/io-contract.md', kind: 'markdown-link' },
    { path: 'plans/history.md', targetPath: 'docs/io-contract.md.bak', kind: 'markdown-link' },
    { path: 'plans/history.md', targetPath: 'docs/decisions/index.md', kind: 'markdown-link' },
    { path: 'plans/history.md', targetPath: 'docs/specs/runner.md', kind: 'markdown-link' },
  ] };
  const roots = { version: 1, documents: ['docs/io-contract.md'] };
  const aliasTable = { entries: [{ fromPath: 'docs/specs/runner.md' }, { fromPath: 'docs/io-contract.md#contract' }] };
  assert.deepEqual(uncoveredHistoryReferences(inventory, aliasTable, roots), { targets: 2, uncovered: ['docs/io-contract.md'] });
  aliasTable.entries.push({ fromPath: 'docs/io-contract.md' });
  assert.deepEqual(uncoveredHistoryReferences(inventory, aliasTable, roots), { targets: 2, uncovered: [] });
});

test('root-file consumers are counted while both fixed legacy directories and retiring-file readers remain legacy', () => {
  const inventory = { consumerEdges: [
    { path: 'src/io.mjs', targetPath: 'docs/io-contract.md', kind: 'code-string' },
    { path: 'docs/io-contract.md', targetPath: 'docs/specs/runner.md', kind: 'markdown-link' },
    { path: 'src/runner.mjs', targetPath: 'docs/specs/runner.md', kind: 'code-string' },
    { path: 'src/architecture.mjs', targetPath: 'docs/architect/runner.md', kind: 'code-string' },
    { path: 'src/project.mjs', targetPath: 'docs/decisions/index.md', kind: 'code-string' },
  ] };
  const roots = { version: 1, documents: ['docs/io-contract.md'] };
  assert.deepEqual(unrewrittenConsumerEdges(inventory, roots), { total: 3, byKind: { 'code-string': 3 }, unresolvedDynamic: 0 });
  const inputs = { ...cleanInputs(), inventory, retiringRoots: roots };
  assert.equal(evaluateRetirement(inputs, constitution).find((result) => result.id === 'consumers-rewritten').status, 'blocked');
});

test('retiring-file data cannot redefine directory roots, retire instruction files, candidates or the kept decision projection', () => {
  const invalid = [
    { version: 2, documents: [] },
    { version: 1, documents: {} },
    { version: 1, roots: ['docs/'], documents: [] },
    ...['docs/', 'AGENTS.md', 'CLAUDE.md', 'docs/../AGENTS.md', 'docs/platform/candidate.md', 'docs/decisions/index.md'].map((value) => ({ version: 1, documents: [value] })),
  ];
  for (const roots of invalid) {
    assert.throws(() => uncoveredHistoryReferences({ consumerEdges: [] }, { entries: [] }, roots), /retiring/i);
    assert.throws(() => unrewrittenConsumerEdges({ consumerEdges: [] }, roots), /retiring/i);
  }
});
