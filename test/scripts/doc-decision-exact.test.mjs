import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { analyzeCounterpart, proposeExactDecisions, summarizeInventory } from '../../scripts/propose-doc-decisions.mjs';
import { applyDecisions, buildConservationUnitLookup } from '../../scripts/check-doc-inventory-gates.mjs';

const source = 'docs/architect/example/spec.md';
const target = 'docs/platform/example/spec.md';
const vocabulary = JSON.parse(fs.readFileSync(new URL('../../plans/260925-documentation-authority-unification/claim-and-disposition-vocabulary.json', import.meta.url), 'utf8'));
const body = 'The admitted request preserves every input and has exactly one terminal result.';
const unit = (text, anchor = 'block', ancestry = ['Example']) => ({ text, textDigest: text.padEnd(64, '0').slice(0, 64), anchor, ancestry, unitKind: 'block' });
const inventoryFor = (units) => ({ generatedAt: '2026-10-07T00:00:00Z', items: [{ path: source, authorityStatus: 'legacy-current', corpus: 'platform-authority', area: 'Example' }, { path: target, authorityStatus: 'candidate', corpus: 'platform-authority', area: 'Example' }], claimLedger: units.map((u, idx) => ({ claimId: `claim_${String(idx).padStart(32, '0')}`, sourcePath: source, sourceAnchor: u.anchor, sourceUnitDigest: u.textDigest, claimKind: 'specification', disposition: 'unknown-blocking', reviewStatus: 'blocking' })) });

test('exact proposals carry only unique long units with equal ancestors and a sufficient document share', () => {
  const long = unit(body);
  const short = unit('Small label', 'short');
  const inventory = inventoryFor([long, short]);
  const context = { inventory, unitsOf: (p) => p === source ? [long, short] : [long, short] };
  const analysis = analyzeCounterpart(context, source, target);
  assert.deepEqual(analysis.map((r) => r.class), ['Unit-exact', 'Weak-exact']);
  const shard = proposeExactDecisions(context, { source, target, shard: 'exact', author: 'codex-session:1@2026-10-07' });
  assert.equal(shard.exact[0].rows[0].claimId, inventory.claimLedger[0].claimId);
  assert.equal(shard.exact[0].rows.length, 1);
  assert.equal(shard.claims[0].reviewStatus, 'pending');
  assert.equal(shard.claims[0].authoredBy, 'codex-session:1@2026-10-07');
});

test('repeated digests, changed ancestors and low exact share cannot become script-reviewed', () => {
  const a = unit(body, 'a');
  const b = unit('The workspace identity remains confined to the selected activation.', 'b');
  const c = unit('The host refuses ambiguous routes without dispatching any operation.', 'c');
  for (const targets of [[a, { ...a, anchor: 'again' }], [{ ...a, ancestry: ['Another area'] }]]) {
    assert.equal(analyzeCounterpart({ inventory: inventoryFor([a]), unitsOf: (p) => p === source ? [a] : targets }, source, target)[0].class, 'Weak-exact');
  }
  const rows = analyzeCounterpart({ inventory: inventoryFor([a, b, c]), unitsOf: (p) => p === source ? [a, b, c] : [a] }, source, target);
  assert.equal(rows[0].class, 'Weak-exact');
  assert.equal(rows[1].class, 'Judgment');
});

test('the gate re-proves exact entries and binds current anchors by digest rather than position', () => {
  const a = unit(body, 'source-block');
  a.textDigest = 'a'.repeat(64);
  const current = { ...a, anchor: 'renumbered-block' };
  const inventory = inventoryFor([a]);
  const shard = { version: 1, shard: 'exact', sources: [source], claims: [], exact: [{ source, target, rows: [{ claimId: inventory.claimLedger[0].claimId, sourceUnitDigest: a.textDigest, targetUnitDigest: a.textDigest }] }] };
  const run = (unitsOf, input = shard) => applyDecisions(inventory, [input], { vocabulary, unitsOf, targetAnchorsOf: () => new Set([current.anchor]), targetUnitDigestOf: () => a.textDigest });
  const good = run((p) => p === source ? [a] : [current]);
  assert.deepEqual(good.findings, []);
  assert.equal(good.inventory.claimLedger[0].targetAnchor, 'renumbered-block');
  assert.equal(good.inventory.claimLedger[0].reviewStatus, 'reviewed');
  assert.equal(good.inventory.claimLedger[0].reviewedBy, 'script:check-doc-inventory-gates');
  const bad = structuredClone(shard);
  bad.exact[0].rows[0].targetUnitDigest = 'b'.repeat(64);
  assert.equal(run((p) => p === source ? [a] : [current], bad).findings.some((f) => f.type === 'decision-exact-invalid'), true);
  assert.equal(run(() => [{ ...a, text: 'short' }]).findings.some((f) => f.type === 'decision-exact-invalid'), true);
});

test('committed unit lookup retains full text and the ancestor chain for exact proof', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'exact-units-'));
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  try {
    git('init'); git('config', 'user.email', 'test@example.test'); git('config', 'user.name', 'Test');
    fs.mkdirSync(path.dirname(path.join(root, source)), { recursive: true });
    fs.writeFileSync(path.join(root, source), `# Example\n\n## Admission\n\n${body}\n`);
    git('add', '--', source); git('commit', '-m', 'source');
    const lookup = buildConservationUnitLookup(root, git('rev-parse', 'HEAD'));
    const block = lookup(source).find((u) => u.text === body);
    assert.deepEqual(block.ancestry, ['Example', 'Admission']);
    assert.ok(lookup(source).find((u) => u.unitKind === 'heading' && u.title === 'Admission').sectionText?.includes(body));
    fs.writeFileSync(path.join(root, source), '# Changed\n');
    assert.equal(lookup(source).find((u) => u.text === body).text, body);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('summary lists multi-legacy duplicate groups and required reconciliation sources', () => {
  const inv = inventoryFor([unit(body)]);
  inv.duplicateContentGroups = [{ blobSha: 'e'.repeat(40), paths: [source, 'docs/architect/example/other.md', target] }];
  inv.semanticConflictGroups = [];
  inv.consumerEdges = [{ path: 'plans/history.md', targetPath: source }];
  inv.items.push({ path: 'docs/backlog.md', corpus: 'platform-authority', authorityStatus: 'non-authority' });
  inv.claimLedger.push({ claimId: `claim_${'f'.repeat(32)}`, sourcePath: 'docs/backlog.md' });
  const report = summarizeInventory({ inventory: inv, unitsOf: (p) => p === source || p === target ? [unit(body)] : [] });
  assert.equal(report.duplicateGroupsMultipleLegacyMembers.length, 1);
  assert.deepEqual(report.legacyHistoricalPaths, [source]);
  assert.equal(report.reconciliationSources.find((r) => r.path === 'docs/backlog.md').rows, 1);
});
