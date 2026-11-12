import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { checkDeadReferences, checkPlatformLinks, checkPlatformMetadata, governanceBaselineFields } from '../../scripts/doc-health.mjs';
import { checkIdentityIdsUnique } from '../../scripts/identity-ids-unique.mjs';
import { enumerateDocEntries, manifestPathFor } from '../../src/report/enduser-index-generate.mjs';
import { buildDecisionIndexMarkdown, indexPathFor, narrativeHolderResolver } from '../../src/report/decision-index.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BUILT_HOST = process.env.FGOS_HOST_BIN || path.join(REPO_ROOT, 'target', 'debug', 'fgos');
const baseline = governanceBaselineFields(REPO_ROOT);

function header(fields, related = []) {
  const lines = fields.map((f) => `${f}: x`);
  if (related.length) lines.push('Related:', ...related.map((r) => `- ${r}`));
  return `# Title\n\n\`\`\`txt\n${lines.join('\n')}\n\`\`\`\n\n## 1. Body\n`;
}

function fixtureRoot(docs) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-health-'));
  for (const [rel, text] of Object.entries(docs)) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  }
  return root;
}

// Owns the link grammar: anchor resolution, code masking, reference/HTML links
// and Related paths over the whole platform population.
test('every platform link and anchor resolves, including Related and historical sources but not literal code', () => {
  const file = 'docs/platform/laws/README.md';
  const body = `${header(baseline.filter((f) => f !== 'Related'), ['docs/platform/portal/README.md#p', 'docs/platform/missing.md'])}
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
    const result = checkPlatformLinks({ files: [file], readFile: (f) => fs.readFileSync(path.join(root, f), 'utf8'), exists: (f) => fs.existsSync(path.join(root, f)) });
    assert.deepEqual(result.findings.map((f) => f.target).sort(), [
      'docs/platform/missing.md', 'nope.md#x', '../portal/README.md#absent', '#absent',
      'gone.md', 'image-missing.png', 'html-missing.md', './auto-missing.md', 'ref-missing.md',
    ].sort());
    assert.equal(result.findings.filter((f) => f.type === 'unresolved-anchor').length, 2);
    assert.equal(result.population.find((e) => e.target === '../portal/').oldPath, 'docs/platform/portal');
    assert.ok(result.population.some((e) => e.related && e.fragment === 'p'));
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

// Owns the metadata rule: the exemption comes from classify, a header must sit
// directly under the H1, and every governance baseline field must be present.
test('metadata rule exempts classified evidence, and reports a missing field or a misplaced header', () => {
  const complete = header(baseline);
  const docs = {
    'docs/platform/ok/spec.md': complete,
    'docs/platform/ok/evidence.md': '# Evidence payload\n\nno header\n',
    'docs/platform/gap/spec.md': header(baseline.filter((f) => f !== 'Provenance' && f !== 'Writer type')),
    'docs/platform/late/spec.md': `# Late\n\nStatus: draft\n\n${complete.split('\n').slice(2).join('\n')}`,
    'docs/platform/none/spec.md': '# None\n\n## 1. Body\n',
  };
  const classified = [];
  const classify = (file) => { classified.push(file); return { metadataExempt: file.endsWith('/evidence.md') }; };
  const read = (f) => docs[f];
  const { findings, counts } = checkPlatformMetadata({ files: Object.keys(docs), readFile: read, baseline, classify });
  const byPath = Object.fromEntries(findings.map((f) => [f.path, f.message]));
  assert.deepEqual(Object.keys(byPath).sort(), ['docs/platform/gap/spec.md', 'docs/platform/late/spec.md', 'docs/platform/none/spec.md']);
  assert.match(byPath['docs/platform/gap/spec.md'], /^missing header fields: Provenance, Writer type$/);
  assert.match(byPath['docs/platform/late/spec.md'], /not directly under the H1/);
  assert.match(byPath['docs/platform/none/spec.md'], /^no header block/);
  assert.equal(counts.exempt, 1);
});

// Owns the dead-reference rule: a backticked repo-root path must exist unless the
// line pins a commit, and only canonical, current-state documents are held to it.
test('dead-reference rule reports a missing path, but not a pinned (real commit), fenced, pattern or past-state reference, and fails without the canonical flag', () => {
  const docs = {
    'docs/platform/a/spec.md': [
      'Exists: `src/alive.mjs` and `src/alive.mjs:10-20`.',
      'Dead: `src/gone.mjs` and `plans/gone/plan.md#top`.',
      'Pinned: `src/old.mjs` was deleted in 53523a917.',
      'Fake pin: `src/fake.mjs` per 2e92b7a5.',
      'Pattern: `src/**/*.mjs`, `src/<name>.mjs`, `~/.fgos/x`.',
      '```',
      '`src/fenced-gone.mjs`',
      '```',
    ].join('\n'),
    'docs/platform/a/decisions/d.md': 'Past: `src/gone.mjs`\n',
    'docs/platform/a/notes.md': 'Not canonical: `src/gone.mjs`\n',
  };
  const kinds = { 'docs/platform/a/spec.md': { canonical: true, kind: 'spec' },
    'docs/platform/a/decisions/d.md': { canonical: true, kind: 'decision' },
    'docs/platform/a/notes.md': { canonical: false, kind: 'unplaced-platform' } };
  const { findings } = checkDeadReferences({
    files: Object.keys(docs), readFile: (f) => docs[f], exists: (f) => f === 'src/alive.mjs',
    classify: (f) => kinds[f], isCommit: (token) => token === '53523a917',
  });
  assert.deepEqual(findings.map((f) => [f.path, f.line, f.target]), [
    ['docs/platform/a/spec.md', 2, 'src/gone.mjs'],
    ['docs/platform/a/spec.md', 2, 'plans/gone/plan.md'],
    ['docs/platform/a/spec.md', 4, 'src/fake.mjs'],
  ]);
  assert.throws(() => checkDeadReferences({ files: ['docs/platform/a/spec.md'], readFile: (f) => docs[f], exists: () => false,
    classify: () => ({ kind: 'spec' }), isCommit: () => false }), /no canonical flag/);
});

// One wiring proof for both rules over the real repository and the real host.
test('live self-check: every repository platform doc passes link, metadata and dead-reference health', () => {
  const result = spawnSync(process.execPath, [
    path.join(REPO_ROOT, 'scripts/doc-health.mjs'), '--json', '--repo-root', REPO_ROOT,
  ], { cwd: REPO_ROOT, encoding: 'utf8', timeout: 120_000, env: { ...process.env, FGOS_HOST_BIN: BUILT_HOST } });
  assert.equal(result.error, undefined);
  const report = JSON.parse(result.stdout);
  assert.equal(result.status, 0, JSON.stringify(report.findings, null, 1));
  assert.ok(report.counts.files > 0, 'the repository platform population must not be empty');
  assert.deepEqual(report.findings, []);
});

// Owns the committed end-user docs index: the doc path set it lists is the one on disk.
// Reads only the checkout (no Work history), so a clone without `.fgos` gives the same answer.
test('the committed end-user docs index lists exactly the end-user docs on disk', () => {
  const indexed = new Set(JSON.parse(fs.readFileSync(manifestPathFor(REPO_ROOT), 'utf8')).map((entry) => entry.docPath));
  const onDisk = new Set(enumerateDocEntries(REPO_ROOT).map((entry) => entry.docPath));
  assert.deepEqual({
    missingFromIndex: [...onDisk].filter((docPath) => !indexed.has(docPath)).sort(),
    orphanedInIndex: [...indexed].filter((docPath) => !onDisk.has(docPath)).sort(),
  }, { missingFromIndex: [], orphanedInIndex: [] }, 'run `fgos docs-index` and commit docs/enduser-docs-index.json');
});

// Owns the committed decisions index: it is a fixpoint of the renderer over its own rows
// (with no local state the generator reduces to the committed rows).
test('the committed decisions index is a fixpoint of the generator over its own rows', () => {
  const committed = fs.readFileSync(indexPathFor(REPO_ROOT), 'utf8');
  assert.equal(buildDecisionIndexMarkdown([], committed, { holderFor: narrativeHolderResolver(REPO_ROOT) }), committed,
    'run `fgos decision-index` and commit docs/decisions/index.md');
});

// Owns the id registries: ids that travel between machines come from `fgos identity mint <kind>`,
// so a repeat means one was written by hand.
test('id registry check passes on a clean registry and names each repeated id, title clash and file number', () => {
  const repo = fixtureRoot({
    'docs/platform/area-a/spec.md': '### D-ADR0070 (guide and ledger) -- text\n',
    // The same decision recorded in two areas, under the same short title, is one decision.
    'docs/platform/area-b/decisions/narrative.md': '### D-ADR0070 (guide and ledger) -- other words\n#### Not a decision: D-ADR0071\n',
    'docs/decisions/0001-one.md': '# one\n',
  });
  try {
    const backlog = (ids) => ['| ID | Story |', '|----|-------|', ...ids.map((id) => `| ${id} | a story |`)].join('\n');
    fs.writeFileSync(path.join(repo, 'docs/backlog.md'), backlog(['p-4f2a7qzb3x', 'STR27']));
    const clean = checkIdentityIdsUnique(repo);
    assert.deepEqual(clean, { passed: true, message: '2 backlog ids, 1 D-ADR numbers and 1 decision files, none repeated' });

    // Relocated history may repeat a decision under another title; it is not a second definition.
    fs.mkdirSync(path.join(repo, 'docs/platform/area-a/history'), { recursive: true });
    fs.writeFileSync(path.join(repo, 'docs/platform/area-a/history/old.md'), '### D-ADR0070 (an older title for the decision)\n');
    assert.deepEqual(checkIdentityIdsUnique(repo), clean);

    fs.writeFileSync(path.join(repo, 'docs/backlog.md'), backlog(['p-4f2a7qzb3x', 'p-4f2a7qzb3x']));
    fs.writeFileSync(path.join(repo, 'docs/platform/area-b/decisions/narrative.md'), '### D-ADR0070 (a different decision)\n');
    fs.writeFileSync(path.join(repo, 'docs/decisions/0001-two.md'), '# two\n');
    const broken = checkIdentityIdsUnique(repo);
    assert.equal(broken.passed, false);
    assert.match(broken.message, /backlog id p-4f2a7qzb3x is used by more than one row/);
    assert.match(broken.message, /D-ADR0070 is headed with different titles/);
    assert.match(broken.message, /decision file number 0001 is used by more than one file/);
    assert.match(broken.message, /fgos identity mint/);
  } finally { fs.rmSync(repo, { recursive: true, force: true }); }
});

test('no backlog id, D-ADR number title or decision file number is repeated in this repository', () => {
  const result = checkIdentityIdsUnique(REPO_ROOT);
  assert.equal(result.passed, true, result.message);
});
