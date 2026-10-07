import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { buildConservationUnitLookup } from '../../scripts/check-doc-inventory-gates.mjs';
const cli = new URL('../../scripts/propose-doc-decisions.mjs', import.meta.url).pathname;
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-review-format-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: 'pipe' }).trim();
  git('init', '-q'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid');
  const source = 'docs/specs/operation.md', target = 'docs/platform/operation.md';
  const text = '# Operation\n\n' + Array.from({ length: 36 }, (_, i) => `The operation MUST NOT exceed 12 requests; mode is required. Rule ${i} retains its own context.\n\n`).join('') + '- Retain the first item within the complete operation scope.\n- Retain the second item within the complete operation scope.\n\n## Payload\n\n```sh\nprintf "fixture"\n```\n';
  for (const [file, body] of [[source, text], [target, text.replace('12 requests', '13 requests')]]) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); fs.writeFileSync(path.join(root, file), body);
  }
  git('add', '--', source, target); git('commit', '-qm', 'docs: record review format fixture', '--', source, target);
  const commit = git('rev-parse', 'HEAD'), unitsOf = buildConservationUnitLookup(root, commit);
  const sources = unitsOf(source).filter(unit => unit.kind !== 'heading'), targets = unitsOf(target).filter(unit => unit.kind !== 'heading');
  const rows = sources.map((unit, i) => ({ claimId: 'claim_' + i.toString(16).padStart(32, '0'), sourcePath: source, sourceAnchor: unit.anchor, sourceUnitDigest: unit.textDigest, claimKind: 'contract' }));
  const author = 'fixture-session:author@2026-10-07';
  const shard = { version: 1, shard: 'operation', sources: [source], authorSession: author, authorshipRequired: true, claims: rows.map((row, i) => ({ claimId: row.claimId, sourceUnitDigest: row.sourceUnitDigest, targetOwner: target, targetAnchor: targets[i].anchor, claimKind: 'contract', disposition: 'promote', rationale: 'Retain the complete operation rule.', reviewStatus: 'pending', authoredBy: author })) };
  const inventory = { commit, generatedAt: '2026-10-07T00:00:00.000Z', items: [{ path: source, corpus: 'platform-authority', authorityStatus: 'legacy-current' }, { path: target, corpus: 'platform-authority', authorityStatus: 'candidate' }], claimLedger: rows };
  fs.writeFileSync(path.join(root, 'inventory.json'), JSON.stringify(inventory)); fs.writeFileSync(path.join(root, 'shard.json'), JSON.stringify(shard));
  const run = (...args) => spawnSync(process.execPath, [cli, ...args], { cwd: root, encoding: 'utf8' });
  return { root, run, source, target, author, git };
}
test('reviewers receive full text and a unified diff in Markdown with safely nested fences', (t) => {
  const f = fixture(t), out = path.join(f.root, 'review.md');
  const result = f.run('--pack', 'shard.json', '--inventory', 'inventory.json', '--out', out);
  assert.equal(result.status, 0, result.stderr);
  const markdown = fs.readFileSync(out, 'utf8');
  assert.match(markdown, /^# Review pack/m);
  assert.match(markdown, /^@@ /m);
  assert.match(markdown, /^-The operation MUST NOT exceed 12 requests; mode is required\./m);
  assert.match(markdown, /^\+The operation MUST NOT exceed 13 requests; mode is required\./m);
  assert.match(markdown, /^````text\n```sh\nprintf "fixture"\n```\n````/m);
  assert.match(markdown, /Unmatched candidate units/);
});
test('the public seeded Markdown can be scored without exposing the seed or private selection key', (t) => {
  const f = fixture(t);
  const normal = f.run('--pack', 'shard.json', '--inventory', 'inventory.json', '--out', 'review.md');
  assert.equal(normal.status, 0, normal.stderr);
  const seed = 'fixture-private-selection', reviewer = 'reviewer:fixture-session:other@2026-10-07';
  const collision = f.run('--seed-pack', 'review.md.json', '--out', 'shared.md', '--key', 'shared.md.json', '--seed', seed, '--reviewer', reviewer);
  assert.equal(collision.status, 1);
  assert.equal(fs.existsSync(path.join(f.root, 'shared.md')), false);
  assert.equal(fs.existsSync(path.join(f.root, 'shared.md.json')), false);
  const seeded = f.run('--seed-pack', 'review.md.json', '--out', 'seeded.md', '--key', 'key.json', '--seed', seed, '--reviewer', reviewer);
  assert.equal(seeded.status, 0, seeded.stderr);
  const publicText = fs.readFileSync(path.join(f.root, 'seeded.md'), 'utf8'), key = JSON.parse(fs.readFileSync(path.join(f.root, 'key.json'), 'utf8'));
  assert.match(publicText, /^# Review pack/m);
  for (const secret of [seed, key.nonce, 'mutationKind', 'mutated']) assert.equal(publicText.includes(secret), false);
  const verdicts = `Reviewer: ${reviewer}\n\n| Claim | Verdict | Note |\n|---|---|---|\n` + key.rows.map(row => `| ${row.claimId} | ${row.mutated ? 'rework' : 'ok'} | Compared the complete operation text. |`).join('\n');
  fs.writeFileSync(path.join(f.root, 'verdicts.md'), verdicts);
  const scored = f.run('--score-pack', 'key.json', '--verdicts', 'verdicts.md');
  assert.equal(scored.status, 0, scored.stderr);
  const score = JSON.parse(scored.stdout);
  assert.equal(score.caught, 6); assert.equal(score.falseFlags, 0); assert.equal(score.pass, true);
});

test('script-proven carries supply batch sensitivity controls without reopening accepted decisions', (t) => {
  const f = fixture(t);
  const proposed = f.run('--propose', '--source', f.source, '--target', f.target, '--shard', 'operation', '--author', f.author, '--inventory', 'inventory.json', '--out', 'proposed.json');
  assert.equal(proposed.status, 0, proposed.stderr);
  const normal = f.run('--pack', 'proposed.json', '--inventory', 'inventory.json', '--out', 'proposal-review.md');
  assert.equal(normal.status, 0, normal.stderr);
  const seeded = f.run('--seed-pack', 'proposal-review.md.json', '--out', 'proposal-seeded.md', '--key', 'proposal-key.json', '--seed', 'fixture-only-selection', '--reviewer', 'reviewer:fixture-session:other@2026-10-07');
  assert.equal(seeded.status, 0, seeded.stderr);
  const key = JSON.parse(fs.readFileSync(path.join(f.root, 'proposal-key.json'), 'utf8'));
  const shard = JSON.parse(fs.readFileSync(path.join(f.root, 'proposed.json'), 'utf8'));
  const exactIds = new Set(shard.exact.flatMap(entry => entry.rows.map(row => row.claimId)));
  assert.ok(key.rows.some(row => exactIds.has(row.claimId)), 'the seeded batch must include independently script-proven source units');
  assert.ok(shard.claims.every(row => row.reviewStatus !== 'reviewed'));
  const broken = structuredClone(shard);
  broken.exact[0].rows[0].sourceUnitDigest = 'f'.repeat(64);
  fs.writeFileSync(path.join(f.root, 'broken.json'), JSON.stringify(broken));
  const rejected = f.run('--pack', 'broken.json', '--inventory', 'inventory.json', '--out', 'broken.md');
  assert.equal(rejected.status, 1);
  assert.equal(fs.existsSync(path.join(f.root, 'broken.md')), false);
});

test('a new shard cannot claim legacy compatibility by deleting author fields', (t) => {
  const f = fixture(t);
  const shard = JSON.parse(fs.readFileSync(path.join(f.root, 'shard.json'), 'utf8'));
  delete shard.authorSession; delete shard.authorshipRequired;
  for (const row of shard.claims) delete row.authoredBy;
  fs.writeFileSync(path.join(f.root, 'shard.json'), JSON.stringify(shard));
  const result = f.run('--pack', 'shard.json', '--author', f.author, '--inventory', 'inventory.json', '--out', 'legacy.md');
  assert.equal(result.status, 1);
  assert.equal(fs.existsSync(path.join(f.root, 'legacy.md')), false);
});
