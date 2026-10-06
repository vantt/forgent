import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { DEFAULT_CONSTITUTION_PATH, governanceBaselineFields } from '../../scripts/check-doc-constitution.mjs';
import {
  DEFAULT_SWITCHBOARD_PATH,
  classifyDocumentStatus,
  checkCandidateMetadata,
  relativeLinkTargets,
  relatedPaths,
  runCli,
} from '../../scripts/check-doc-candidate-status.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const constitution = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, DEFAULT_CONSTITUTION_PATH), 'utf8'));
const realSwitchboard = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, DEFAULT_SWITCHBOARD_PATH), 'utf8'));

const switchboard = {
  areas: [
    { area: 'Laws', authorityStatus: 'candidate', entryPoint: 'docs/platform/laws.md', canonicalRoute: 'docs/laws.md', scopedRoutes: [{ route: 'docs/laws.md', authorityStatus: 'legacy-current' }, { route: 'docs/platform/laws.md', authorityStatus: 'candidate' }] },
    { area: 'Portal', authorityStatus: 'promoted', canonicalRoute: 'docs/platform/portal/README.md', scopedRoutes: [{ route: 'docs/platform/portal/README.md', authorityStatus: 'promoted' }, { route: 'docs/archive/**', authorityStatus: 'non-authority' }] },
  ],
  rootDocuments: [{ path: 'docs/README.md', authorityStatus: 'legacy-current' }],
};

const candidateFields = constitution.requiredMetadata.candidateCore;
function header(fields, related = []) {
  const lines = fields.map((f) => `${f}: x`);
  if (related.length) lines.push('Related:', ...related.map((r) => `- ${r}`));
  return `# Title\n\n\`\`\`txt\n${lines.join('\n')}\n\`\`\`\n\n## 1. Body\n`;
}
const withRelated = (fields) => (fields.includes('Related') ? fields.filter((f) => f !== 'Related') : fields);

function fixtureRoot(docs) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'candidate-status-'));
  fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
  fs.copyFileSync(path.join(REPO_ROOT, 'docs/doc-governance.md'), path.join(root, 'docs/doc-governance.md'));
  for (const [rel, text] of Object.entries(docs)) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  }
  return root;
}
function check(root, files) {
  return checkCandidateMetadata({ files, readFile: (f) => fs.readFileSync(path.join(root, f), 'utf8'), switchboard, constitution, repoRoot: root });
}

test('status comes only from the switchboard', () => {
  assert.equal(classifyDocumentStatus('docs/platform/laws.md', switchboard), 'candidate');
  assert.equal(classifyDocumentStatus('docs/laws.md', switchboard), 'legacy-current');
  assert.equal(classifyDocumentStatus('docs/platform/portal/README.md', switchboard), 'promoted');
  assert.equal(classifyDocumentStatus('docs/archive/deep/old.md', switchboard), 'non-authority');
  assert.equal(classifyDocumentStatus('docs/README.md', switchboard), 'legacy-current');
  assert.equal(classifyDocumentStatus('docs/platform/other.md', switchboard), 'unrouted');
});

test('a Design status header never changes the computed status', () => {
  const root = fixtureRoot({ 'docs/platform/laws.md': header(['Document type', 'Audience', 'Purpose', 'Design status', 'Last reviewed', 'Related']).replace('Design status: x', 'Design status: Canonical and accepted') });
  try {
    assert.equal(classifyDocumentStatus('docs/platform/laws.md', switchboard), 'candidate');
    const { findings, counts } = check(root, ['docs/platform/laws.md']);
    assert.equal(counts.byStatus.candidate, 1);
    assert.equal(counts.byStatus.promoted, 0);
    assert.deepEqual(findings, []);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('a candidate missing candidateCore fields is reported; a complete one is clean', () => {
  const root = fixtureRoot({
    'docs/platform/laws.md': header(candidateFields.filter((f) => f !== 'Purpose' && f !== 'Audience')),
    'docs/platform/other.md': '# Unrouted\n',
  });
  try {
    const { findings, counts } = check(root, ['docs/platform/laws.md', 'docs/platform/other.md']);
    assert.deepEqual(findings.map((f) => f.type), ['missing-candidate-fields']);
    assert.match(findings[0].message, /Audience, Purpose/);
    assert.equal(counts.checked, 1);
    assert.equal(counts.byStatus.unrouted, 1);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('a headerless candidate is reported', () => {
  const root = fixtureRoot({ 'docs/platform/laws.md': '# Laws\n\n## 1. Body\n' });
  try {
    assert.deepEqual(check(root, ['docs/platform/laws.md']).findings.map((f) => f.type), ['missing-candidate-fields']);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('a promoted document needs the governance baseline plus the promotion extras', () => {
  const baseline = governanceBaselineFields(REPO_ROOT);
  const extras = constitution.requiredMetadata.promotionFields.extra;
  const complete = header([...baseline, ...extras]);
  const partial = header(baseline);
  const root = fixtureRoot({ 'docs/platform/portal/README.md': partial });
  try {
    const gap = check(root, ['docs/platform/portal/README.md']);
    assert.deepEqual(gap.findings.map((f) => f.type), ['missing-promotion-fields']);
    assert.match(gap.findings[0].message, /Supersedes, Superseded by/);
    fs.writeFileSync(path.join(root, 'docs/platform/portal/README.md'), complete);
    assert.deepEqual(check(root, ['docs/platform/portal/README.md']).findings, []);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('unresolved relative links and Related paths are reported, resolved ones are not', () => {
  const body = `${header(candidateFields.filter((f) => f !== 'Related'), ['docs/platform/portal/README.md', 'docs/platform/missing.md'])}\n[ok](portal/README.md) [bad](nope.md#x) [web](https://example.com/a.md) [anchor](#top)\n\n\`\`\`\n[ignored](in-fence.md)\n\`\`\`\n`;
  const root = fixtureRoot({ 'docs/platform/laws.md': body, 'docs/platform/portal/README.md': '# P\n' });
  try {
    const { findings } = check(root, ['docs/platform/laws.md']);
    assert.deepEqual(findings.map((f) => `${f.type}`).sort(), ['unresolved-link', 'unresolved-related']);
    assert.match(findings.find((f) => f.type === 'unresolved-link').message, /nope\.md/);
    assert.match(findings.find((f) => f.type === 'unresolved-related').message, /missing\.md/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('link and Related extraction helpers', () => {
  assert.deepEqual(relativeLinkTargets('[a](x/y.md#h) [b](http://z) [c](#h) `[d](e.md)`'), ['x/y.md']);
  assert.deepEqual(relatedPaths(header(['Purpose'], ['docs/a.md', 'None', 'docs/*.md'])), ['docs/a.md']);
});

test('runCli is report-only by default and fatal under --strict', () => {
  const root = fixtureRoot({ 'docs/platform/laws.md': header(['Purpose']) });
  const board = path.join(root, 'switchboard.json');
  const consti = path.join(root, 'constitution.json');
  fs.writeFileSync(board, JSON.stringify(switchboard));
  fs.writeFileSync(consti, JSON.stringify(constitution));
  const git = (...args) => execFileSync('git', args, { cwd: root, stdio: 'ignore' });
  git('init', '-q');
  git('add', 'docs');
  const logs = [];
  const origLog = console.log;
  console.log = (...a) => logs.push(a.join(' '));
  try {
    const base = ['--repo-root', root, '--switchboard', board, '--constitution', consti];
    assert.equal(runCli(base, root), 0);
    assert.match(logs.join('\n'), /1 finding\(s\) \(report only\)/);
    assert.equal(runCli([...base, '--strict'], root), 1);
    logs.length = 0;
    assert.equal(runCli([...base, '--json'], root), 0);
    assert.equal(JSON.parse(logs.join('\n')).counts.byStatus.candidate, 1);
  } finally {
    console.log = origLog;
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('the real switchboard routes every promoted and candidate area entry point', () => {
  const statuses = realSwitchboard.areas.filter((a) => a.entryPoint).map((a) => classifyDocumentStatus(a.entryPoint, realSwitchboard));
  assert.ok(statuses.every((s) => s === 'candidate'));
  assert.equal(classifyDocumentStatus('docs/platform/packaging-distribution/README.md', realSwitchboard), 'promoted');
});
