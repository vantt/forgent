import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { openConflictGroups } from '../../scripts/check-doc-retirement.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'conflict-review-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: 'pipe' }).trim();
  git('init', '-q'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid');
  const items = [{ path: 'docs/a.md', blobSha: 'a'.repeat(40) }, { path: 'docs/b.md', blobSha: 'b'.repeat(40) }];
  const inventory = { items, duplicateContentGroups: [], semanticConflictGroups: [{ key: 'runner:contract', paths: items.map(item => item.path) }] };
  const entry = { kind: 'semantic', key: 'runner:contract', resolution: 'One complete maintained owner.', rule: 'Conflicting claims are reconciled without loss.', evidence: ['docs/a.md', 'docs/b.md'], members: items, authoredBy: 'fixture-session:author@2026-10-07', reviewedBy: 'reviewer:fixture-session:other@2026-10-07', reviewedAt: '2026-10-07', reviewReport: 'plans/fixture/reports/review-round/review-conflict-fixture.md' };
  const digest = createHash('sha256').update(JSON.stringify({ kind: entry.kind, key: entry.key, members: entry.members, resolution: entry.resolution, rule: entry.rule, evidence: entry.evidence })).digest('hex');
  const report = `Reviewer: ${entry.reviewedBy}\nConflict: ${entry.kind}:${entry.key}\nReceipt digest: ${digest}\n| conflict:${entry.kind}:${entry.key} | ok | Independently checked every conflicting member. |\n`;
  fs.mkdirSync(path.dirname(path.join(root, entry.reviewReport)), { recursive: true });
  fs.writeFileSync(path.join(root, entry.reviewReport), report);
  git('add', '--', entry.reviewReport); git('commit', '-qm', 'docs: record independent conflict fixture', '--', entry.reviewReport);
  entry.reviewReportCommit = git('rev-parse', 'HEAD'); inventory.commit = entry.reviewReportCommit;
  return { root, git, inventory, entry, records: { version: 1, groups: [entry] } };
}

test('a committed conflict receipt closes exactly the reviewed member set and blob versions', t => {
  const f = fixture(t);
  assert.equal(openConflictGroups(f.inventory, f.records, { repoRoot: f.root }).semantic, 0);
  const grown = structuredClone(f.inventory);
  grown.items.push({ path: 'docs/c.md', blobSha: 'c'.repeat(40) }); grown.semanticConflictGroups[0].paths.push('docs/c.md');
  assert.equal(openConflictGroups(grown, f.records, { repoRoot: f.root }).semantic, 1);
  const changed = structuredClone(f.inventory); changed.items[0].blobSha = 'd'.repeat(40);
  assert.equal(openConflictGroups(changed, f.records, { repoRoot: f.root }).semantic, 1);
});

test('uncommitted mismatched or self-reviewed conflict receipts cannot grant closure', t => {
  const f = fixture(t);
  for (const change of [{ reviewReportCommit: 'f'.repeat(40) }, { resolution: 'Changed after review.' }, { authoredBy: 'fixture-session:other@2026-10-08' }]) {
    assert.equal(openConflictGroups(f.inventory, { version: 1, groups: [{ ...f.entry, ...change }] }, { repoRoot: f.root }).semantic, 1);
  }
});
