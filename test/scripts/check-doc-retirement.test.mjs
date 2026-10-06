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
  uncoveredImmutableTargets,
  unrewrittenConsumerEdges,
  runCli,
} from '../../scripts/check-doc-retirement.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const constitution = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'plans/260925-documentation-authority-unification/minimum-constitution.json'), 'utf8'));
const clone = (value) => JSON.parse(JSON.stringify(value));

function cleanInputs() {
  return {
    inventory: { items: [{ path: 'docs/platform/a/README.md', proposedDisposition: 'promote' }], immutableRefEdges: [], consumerEdges: [], duplicateContentGroups: [], semanticConflictGroups: [] },
    conservation: { invariant: [], open: [] },
    cutoverRows: { rows: 1, byReason: {}, total: 0 },
    usageDrift: [],
    aliasTable: { entries: [] },
    aliasFindings: [],
    ratchetResult: { findings: [] },
    promotion: { canonicalDocuments: 2, complete: 2, headerless: 0, headeredIncomplete: 0 },
    candidateStatus: { counts: { byStatus: { unrouted: 0 }, byType: {} }, findings: [] },
    evidenceManifestPresent: true,
  };
}

// The checks the constitution still marks planned stay blocked even when their computation is clean.
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
  ['file-disposition', (i) => { i.inventory.items.push({ path: 'docs/specs/x.md', proposedDisposition: 'unknown-blocking' }); }],
  ['claims-closed', (i) => { i.conservation.open.push({ type: 'claims-unknown-blocking', count: 3, message: 'm', examples: [] }); }],
  ['claims-reviewed', (i) => { i.conservation.open.push({ type: 'claims-not-reviewed', count: 3, message: 'm', examples: [] }); }],
  ['dropped-claims-resolved', (i) => { i.conservation.open.push({ type: 'dropped-claims-unreviewed', count: 1, message: 'm', examples: [] }); }],
  ['aliases-cover-immutable-refs', (i) => { i.inventory.immutableRefEdges.push({ ref: 'abc1234', sourcePaths: ['docs/history/x.md'], targetPaths: ['docs/specs/runner.md'] }); }],
  ['consumers-rewritten', (i) => { i.inventory.consumerEdges.push({ path: 'src/a.mjs', targetPath: 'docs/specs/runner.md', kind: 'literal' }); }],
  ['evidence-digests', (i) => { i.evidenceManifestPresent = false; }],
  ['no-new-legacy-growth', (i) => { i.ratchetResult = { findings: [{ type: 'new-file' }] }; }],
  ['row-set-conserved', (i) => { i.conservation.invariant.push({ type: 'claim-id-not-conserved', message: 'm' }); }],
  ['one-owner-per-semantic-claim', (i) => { i.conservation.invariant.push({ type: 'semantic-claim-multiple-owners', message: 'm' }); }],
  ['cutover-mode', (i) => { i.cutoverRows = { rows: 1, byReason: { 'not-reviewed': 1 }, total: 1 }; }],
  ['cutover-mode', (i) => { i.usageDrift = [{ section: 'x', id: 'y' }]; }],
  ['reviewed-rationale', (i) => { i.cutoverRows = { rows: 1, byReason: { 'without-own-rationale': 4 }, total: 4 }; }],
  ['canonical-metadata-complete', (i) => { i.promotion = { canonicalDocuments: 2, complete: 1, headerless: 1, headeredIncomplete: 0 }; }],
  ['metadata-and-structure', (i) => { i.candidateStatus = { counts: { byStatus: { unrouted: 2 }, byType: {} }, findings: [] }; }],
  ['links-resolve', (i) => { i.candidateStatus = { counts: { byStatus: { unrouted: 0 }, byType: { 'unresolved-link': 1 } }, findings: [] }; }],
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

test('with the manifest absent the evidence check says so; with it present the planned marker still blocks until the verifier is built', () => {
  const absent = cleanInputs();
  absent.evidenceManifestPresent = false;
  assert.match(evaluateRetirement(absent, constitution).find((r) => r.id === 'evidence-digests').measure, /no evidence relocation manifest/);
  assert.match(evaluateRetirement(cleanInputs(), constitution).find((r) => r.id === 'evidence-digests').measure, /still marks this check planned/);
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

test('immutable references resolve only through an alias on the exact legacy path', () => {
  const inventory = { immutableRefEdges: [
    { ref: 'a', sourcePaths: ['docs/history/x.md'], targetPaths: ['docs/specs/runner.md', 'docs/architect/x/y.md', 'docs/history/x.md'] },
    { ref: 'b', sourcePaths: ['docs/history/y.md'], targetPaths: ['docs/specs/runner.md'] },
  ] };
  assert.deepEqual(uncoveredImmutableTargets(inventory, { entries: [] }), { targets: 2, uncovered: ['docs/architect/x/y.md', 'docs/specs/runner.md'] });
  const table = { entries: [{ fromPath: 'docs/specs/runner.md#dispatch', toOwner: 'docs/platform/runner/README.md' }] };
  assert.deepEqual(uncoveredImmutableTargets(inventory, table).uncovered, ['docs/architect/x/y.md']);
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
  assert.deepEqual(unrewrittenConsumerEdges(inventory), { total: 3, byKind: { literal: 2, fixture: 1 } });
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
