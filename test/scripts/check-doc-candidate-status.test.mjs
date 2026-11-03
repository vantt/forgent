import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { DEFAULT_CONSTITUTION_PATH, governanceBaselineFields } from '../../scripts/check-doc-constitution.mjs';
import {
  DEFAULT_SWITCHBOARD_PATH,
  classifyDocumentStatus,
  checkCandidateMetadata,
  relativeLinkTargets,
  relatedPaths,
  checkPlatformLinks,
  runCli,
} from '../../scripts/check-doc-candidate-status.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const constitution = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, DEFAULT_CONSTITUTION_PATH), 'utf8'));
const realSwitchboard = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, DEFAULT_SWITCHBOARD_PATH), 'utf8'));

const switchboard = {
  areas: [
    { area: 'Laws', authorityStatus: 'candidate', entryPoint: 'docs/platform/laws/README.md', canonicalRoute: 'docs/laws.md', scopedRoutes: [{ route: 'docs/laws.md', authorityStatus: 'legacy-current' }, { route: 'docs/platform/laws/README.md', authorityStatus: 'candidate' }] },
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
  fs.mkdirSync(path.join(root, 'docs/platform'), { recursive: true });
  // Keep the real baseline fields, not the live document's unrelated links.
  fs.writeFileSync(path.join(root, 'docs/platform/governance.md'),
    '# Fixture governance\n\nRequired baseline:\n\n```txt\n' +
    governanceBaselineFields(REPO_ROOT).map((field) => `${field}:`).join('\n') + '\n```\n');
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
  assert.equal(classifyDocumentStatus('docs/platform/laws/README.md', switchboard), 'candidate');
  assert.equal(classifyDocumentStatus('docs/laws.md', switchboard), 'legacy-current');
  assert.equal(classifyDocumentStatus('docs/platform/portal/README.md', switchboard), 'promoted');
  assert.equal(classifyDocumentStatus('docs/archive/deep/old.md', switchboard), 'non-authority');
  assert.equal(classifyDocumentStatus('docs/README.md', switchboard), 'legacy-current');
  assert.equal(classifyDocumentStatus('docs/platform/other/README.md', switchboard), 'unrouted');
});

test('a Design status header never changes the computed status', () => {
  const root = fixtureRoot({ 'docs/platform/laws/README.md': header(['Document type', 'Audience', 'Purpose', 'Design status', 'Last reviewed', 'Related']).replace('Design status: x', 'Design status: Canonical and accepted') });
  try {
    assert.equal(classifyDocumentStatus('docs/platform/laws/README.md', switchboard), 'candidate');
    const { findings, counts } = check(root, ['docs/platform/laws/README.md']);
    assert.equal(counts.byStatus.candidate, 1);
    assert.equal(counts.byStatus.promoted, 0);
    assert.deepEqual(findings, []);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('a candidate missing candidateCore fields is reported; a complete one is clean', () => {
  const root = fixtureRoot({
    'docs/platform/laws/README.md': header(candidateFields.filter((f) => f !== 'Purpose' && f !== 'Audience')),
    'docs/platform/other/README.md': '# Unrouted\n',
  });
  try {
    const { findings, counts } = check(root, ['docs/platform/laws/README.md', 'docs/platform/other/README.md']);
    assert.deepEqual(findings.map((f) => f.type), ['missing-candidate-fields']);
    assert.match(findings[0].message, /Audience, Purpose/);
    assert.equal(counts.checked, 1);
    assert.equal(counts.byStatus.unrouted, 1);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('a headerless candidate is reported', () => {
  const root = fixtureRoot({ 'docs/platform/laws/README.md': '# Laws\n\n## 1. Body\n' });
  try {
    assert.deepEqual(check(root, ['docs/platform/laws/README.md']).findings.map((f) => f.type), ['missing-candidate-fields']);
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

// Owns guard 3: the former file-only test did not prove anchor resolution,
// code masking, reference/HTML links, or the status-independent whole population.
test('every platform link and anchor resolves, including Related and historical sources but not literal code', () => {
  const file = 'docs/platform/laws/README.md';
  const body = `${header(candidateFields.filter((f) => f !== 'Related'), ['docs/platform/portal/README.md#p', 'docs/platform/missing.md'])}
[ok](../portal/README.md#p) [bad](nope.md#x) [web](https://example.com/a.md) [self](#1-body)
[bad anchor](../portal/README.md#absent) [bad self](#absent)
Historical source: [missing](gone.md)
Historical source: \`literal-gone.md\`
[ref][used] ![image](image-missing.png) <a href="html-missing.md">html</a> <./auto-missing.md>
[used]: ref-missing.md
[unused]: unused-missing.md
\`[literal](inline-missing.md)\` \`\`[literal with tick \`](other-missing.md)\`\`
~~~md
[fenced](fence-missing.md)
~~~
> \`\`\`md
> [quoted](quote-missing.md)
> \`\`\`
<!-- [comment](comment-missing.md) -->
[directory](../portal/)
[encoded](../portal/README.md#%70) [query](../portal/README.md?q=1&amp;x=2#p)
`;
  const root = fixtureRoot({ [file]: body, 'docs/platform/portal/README.md': '# P\n' });
  try {
    const files = [file];
    const result = checkPlatformLinks({ files, readFile: (f) => fs.readFileSync(path.join(root, f), 'utf8'), exists: (f) => fs.existsSync(path.join(root, f)) });
    assert.deepEqual(result.findings.map((f) => f.target).sort(), [
      'docs/platform/missing.md', 'nope.md#x', '../portal/README.md#absent', '#absent',
      'gone.md', 'image-missing.png', 'html-missing.md', './auto-missing.md', 'ref-missing.md',
    ].sort());
    assert.equal(result.findings.filter((f) => f.type === 'unresolved-anchor').length, 2);
    assert.equal(result.population.find((e) => e.target === '../portal/').oldPath, 'docs/platform/portal');
    assert.ok(result.population.some((e) => e.related && e.fragment === 'p'));
    assert.deepEqual(check(root, files).findings.filter((f) => f.type.startsWith('unresolved-')), result.findings);
    // Non-authority, evidence and unrouted documents get no link exemptions.
    const board = { areas: [], rootDocuments: [{ path: file, authorityStatus: 'non-authority' }] };
    const nonAuthority = checkCandidateMetadata({ files, readFile: (f) => fs.readFileSync(path.join(root, f), 'utf8'), switchboard: board, constitution, repoRoot: root });
    assert.deepEqual(nonAuthority.findings, result.findings);
    const logs = [], original = console.log;
    console.log = (line) => logs.push(line);
    try {
      assert.equal(runCli(['--repo-root', root, '--links-only', '--json'], root), 1);
      assert.equal(JSON.parse(logs[0]).population.length, result.population.length);
    } finally { console.log = original; }
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

// One repository wiring proof: the synthetic owning case above already proves
// link grammar and anchor semantics; this proves the strict CLI guards real bytes.
test('live self-check: every repository platform link and anchor resolves', () => {
  const result = spawnSync(process.execPath, [
    path.join(REPO_ROOT, 'scripts/check-doc-candidate-status.mjs'),
    '--links-only', '--json', '--repo-root', REPO_ROOT,
  ], { cwd: REPO_ROOT, encoding: 'utf8', timeout: 120_000 });
  assert.equal(result.error, undefined);
  const report = JSON.parse(result.stdout);
  assert.equal(result.status, 0, JSON.stringify(report.findings));
  assert.ok(report.counts.files > 0, 'the repository platform population must not be empty');
  assert.deepEqual(report.findings, []);
});

test('link and Related extraction helpers', () => {
  assert.deepEqual(relativeLinkTargets('[a](x/y.md#h) [b](http://z) [c](#h) `[d](e.md)`'), ['x/y.md']);
  assert.deepEqual(relatedPaths(header(['Purpose'], ['docs/a.md', 'None', 'docs/*.md'])), ['docs/a.md']);
});

test('runCli is report-only by default and fatal under --strict', () => {
  const root = fixtureRoot({ 'docs/platform/laws/README.md': header(['Purpose']) });
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
    assert.equal(runCli([...base, '--strict'], root), 1);
    logs.length = 0;
    assert.equal(runCli([...base, '--json'], root), 0);
    assert.equal(JSON.parse(logs.join('\n')).counts.byStatus.candidate, 1);
  } finally {
    console.log = origLog;
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('the real switchboard routes every promoted and unpromoted area entry point', () => {
  const statuses = realSwitchboard.areas.filter((a) => a.entryPoint).map((a) => classifyDocumentStatus(a.entryPoint, realSwitchboard));
  assert.ok(statuses.every((s) => s === 'candidate'));
  assert.equal(classifyDocumentStatus('docs/platform/packaging-distribution/README.md', realSwitchboard), 'promoted');
});

test('a routed document that matches no placement pattern is reported, and an ambiguous switchboard route is surfaced', () => {
  const board = { areas: [{ area: 'Odd', authorityStatus: 'candidate', scopedRoutes: [{ route: 'docs/platform/zzz/**', authorityStatus: 'candidate' }] }], rootDocuments: [] };
  const root = fixtureRoot({ 'docs/platform/zzz/qq/ww/ee.md': header(candidateFields) });
  try {
    const { findings } = checkCandidateMetadata({ files: ['docs/platform/zzz/qq/ww/ee.md'], readFile: (f) => fs.readFileSync(path.join(root, f), 'utf8'), switchboard: board, constitution, repoRoot: root });
    assert.deepEqual(findings.map((f) => f.type), ['unplaced-document']);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
  const doubled = { areas: [{ area: 'A', authorityStatus: 'candidate', scopedRoutes: [{ route: 'docs/platform/a/README.md', authorityStatus: 'candidate' }] }, { area: 'B', authorityStatus: 'promoted', scopedRoutes: [{ route: 'docs/platform/a/README.md', authorityStatus: 'promoted' }] }], rootDocuments: [] };
  const conflicted = checkCandidateMetadata({ files: ['docs/platform/a/README.md'], readFile: () => '', switchboard: doubled, constitution, repoRoot: REPO_ROOT });
  assert.ok(conflicted.findings.some((f) => f.type === 'switchboard-route-conflict'));
});

test('strict proposal status includes untracked Markdown but not ignored draft files', () => {
  const untracked = 'docs/platform/laws/contracts/new.md';
  const ignored = 'docs/platform/laws/contracts/ignored.md';
  const root = fixtureRoot({ 'docs/platform/laws/README.md': header(candidateFields), [untracked]: '# Missing metadata\n', [ignored]: '# Ignored draft\n' });
  const board = path.join(root, 'switchboard.json');
  const consti = path.join(root, 'constitution.json');
  const routed = { ...switchboard, areas: switchboard.areas.map((area, i) => i ? area : { ...area, scopedRoutes: [...area.scopedRoutes, { route: 'docs/platform/laws/**', authorityStatus: 'candidate' }] }) };
  fs.writeFileSync(board, JSON.stringify(routed));
  fs.writeFileSync(consti, JSON.stringify(constitution));
  fs.writeFileSync(path.join(root, '.gitignore'), ignored + '\n');
  const git = (...args) => execFileSync('git', args, { cwd: root, stdio: 'ignore' });
  git('init', '-q');
  git('add', '--', 'docs/platform/laws/README.md');
  const logs = [];
  const original = console.log;
  console.log = (...args) => logs.push(args.join(' '));
  try {
    assert.equal(runCli(['--repo-root', root, '--switchboard', board, '--constitution', consti, '--strict', '--json'], root), 1);
    const report = JSON.parse(logs.join('\n'));
    assert.equal(report.counts.files, 3, 'tracked portal, untracked contract and the platform governance fixture');
    assert.ok(report.findings.some((finding) => finding.path === untracked && finding.type === 'missing-candidate-fields'));
    assert.equal(report.findings.some((finding) => finding.path === ignored), false);
  } finally {
    console.log = original;
    fs.rmSync(root, { recursive: true, force: true });
  }
});
