import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { applyDecisions, buildConservationUnitLookup } from '../../scripts/check-doc-inventory-gates.mjs';
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

function ordinaryReport(f, reportPath = 'plans/260925-documentation-authority-unification/reports/phase-06/review-2-operation.md') {
  const reviewer = 'reviewer:fixture-session:other@2026-10-08';
  const inventory = JSON.parse(fs.readFileSync(path.join(f.root, 'inventory.json')));
  const shard = JSON.parse(fs.readFileSync(path.join(f.root, 'shard.json')));
  const unitsOf = buildConservationUnitLookup(f.root, inventory.commit);
  const text = `Reviewer: ${reviewer}\nReview mode: ordinary\n\n| Claim | Verdict | Note | Source digest | Target digest |\n|---|---|---|---|---|\n` + shard.claims.map(row => {
    const source = inventory.claimLedger.find(item => item.claimId === row.claimId);
    const target = unitsOf(row.targetOwner).find(unit => unit.anchor === row.targetAnchor);
    return `| ${row.claimId} | ok | Read the complete source and proposed target. | ${source.sourceUnitDigest} | ${target.textDigest} |`;
  }).join('\n') + '\n';
  fs.mkdirSync(path.dirname(path.join(f.root, reportPath)), { recursive: true });
  fs.writeFileSync(path.join(f.root, reportPath), text);
  const commit = () => {
    f.git('add', '--', reportPath);
    f.git('commit', '-qm', 'docs: record independent ordinary verdict', '--', reportPath);
    return f.git('rev-parse', 'HEAD');
  };
  const run = () => f.run('--apply-review', 'shard.json', '--inventory', 'inventory.json', '--verdicts', reportPath, '--reviewer', reviewer);
  return { inventory, shard, unitsOf, reviewer, reportPath, text, commit, run };
}

test('ordinary committed reviews approve seen text without a sensitivity pack and retain their report pin', (t) => {
  const f = fixture(t), review = ordinaryReport(f);
  assert.equal(review.run().status, 1, 'uncommitted verdict cannot approve');
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(f.root, 'shard.json'))), review.shard);
  const reportCommit = review.commit();
  const result = review.run();
  assert.equal(result.status, 0, result.stderr);
  const approved = JSON.parse(fs.readFileSync(path.join(f.root, 'shard.json')));
  const row = approved.claims[0];
  assert.equal(row.reviewStatus, 'reviewed');
  assert.equal(row.reviewMode, 'ordinary');
  assert.equal(row.reviewReportCommit, reportCommit);
  assert.equal(row.targetUnitDigest, review.unitsOf(row.targetOwner).find(unit => unit.anchor === row.targetAnchor).textDigest);
  assert.equal(row.seedScoreId, undefined);
  const vocabulary = JSON.parse(fs.readFileSync(new URL('../../plans/260925-documentation-authority-unification/claim-and-disposition-vocabulary.json', import.meta.url)));
  const options = { vocabulary, repoRoot: f.root, unitsOf: review.unitsOf, targetUnitDigestOf: (owner, anchor) => review.unitsOf(owner).find(unit => unit.anchor === anchor)?.textDigest };
  assert.deepEqual(applyDecisions({ ...review.inventory, commit: reportCommit }, [approved], options).findings, []);
  fs.writeFileSync(path.join(f.root, review.reportPath), 'Reviewer: changed-session\n');
  review.commit();
  assert.deepEqual(applyDecisions({ ...review.inventory, commit: f.git('rev-parse', 'HEAD') }, [approved], options).findings, []);
  const changed = structuredClone(approved); changed.claims[0].targetUnitDigest = 'c'.repeat(64);
  assert.ok(applyDecisions({ ...review.inventory, commit: reportCommit }, [changed], options).findings.some(finding => finding.type === 'decision-review-report-missing'));
});

test('ordinary reviews cannot approve a changed digest, an unauthored row or their own session', async (t) => {
  for (const defect of ['target-digest', 'source-digest', 'authoredBy', 'authorSession', 'same-session']) {
    await t.test(defect, sub => {
      const f = fixture(sub), review = ordinaryReport(f);
      if (defect.endsWith('-digest')) fs.writeFileSync(path.join(f.root, review.reportPath), review.text.replace(defect === 'target-digest' ? review.unitsOf(f.target).find(unit => unit.anchor === review.shard.claims[0].targetAnchor).textDigest : review.inventory.claimLedger[0].sourceUnitDigest, 'f'.repeat(64)));
      else {
        if (defect === 'same-session') review.shard.claims[0].authoredBy = 'fixture-session:other@2026-10-07';
        else if (defect === 'authorSession') delete review.shard.authorSession;
        else delete review.shard.claims[0].authoredBy;
        fs.writeFileSync(path.join(f.root, 'shard.json'), JSON.stringify(review.shard));
      }
      review.commit();
      const before = fs.readFileSync(path.join(f.root, 'shard.json'), 'utf8');
      const result = review.run();
      assert.equal(result.status, 1);
      assert.equal(fs.readFileSync(path.join(f.root, 'shard.json'), 'utf8'), before);
    });
  }
});

test('checkpoint reports cannot use the ordinary channel to omit sensitivity proof', async (t) => {
  for (const checkpoint of [3, 6, 10]) {
    await t.test(`checkpoint ${checkpoint}`, sub => {
      const f = fixture(sub), review = ordinaryReport(f, `plans/260925-documentation-authority-unification/reports/phase-06/review-${checkpoint}-checkpoint.md`);
      review.commit();
      const result = review.run();
      assert.equal(result.status, 1);
      assert.match(result.stderr, /checkpoint.*sensitivity/i);
      const vocabulary = JSON.parse(fs.readFileSync(new URL('../../plans/260925-documentation-authority-unification/claim-and-disposition-vocabulary.json', import.meta.url)));
      const forged = { ...review.shard, claims: review.shard.claims.map(row => ({ ...row, reviewMode: 'ordinary', reviewStatus: 'reviewed', reviewedBy: review.reviewer, reviewedAt: '2026-10-08', reviewReport: review.reportPath, reviewReportCommit: f.git('rev-parse', 'HEAD'), reviewNote: 'Read the complete source and proposed target.', targetUnitDigest: review.unitsOf(row.targetOwner).find(unit => unit.anchor === row.targetAnchor).textDigest })) };
      assert.ok(applyDecisions({ ...review.inventory, commit: f.git('rev-parse', 'HEAD') }, [forged], { vocabulary, repoRoot: f.root }).findings.some(finding => finding.type === 'decision-review-report-missing'));
    });
  }
});
