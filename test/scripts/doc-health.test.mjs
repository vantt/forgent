import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { checkPlatformLinks, checkPlatformMetadata, governanceBaselineFields } from '../../scripts/doc-health.mjs';

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
  assert.ok(!classified.includes('docs/platform/ok/spec.md'), 'a complete header never needs classification');
});

// One wiring proof for both rules over the real repository and the real host.
test('live self-check: every repository platform doc passes link and metadata health', () => {
  const result = spawnSync(process.execPath, [
    path.join(REPO_ROOT, 'scripts/doc-health.mjs'), '--json', '--repo-root', REPO_ROOT,
  ], { cwd: REPO_ROOT, encoding: 'utf8', timeout: 120_000, env: { ...process.env, FGOS_HOST_BIN: BUILT_HOST } });
  assert.equal(result.error, undefined);
  const report = JSON.parse(result.stdout);
  assert.equal(result.status, 0, JSON.stringify(report.findings, null, 1));
  assert.ok(report.counts.files > 0, 'the repository platform population must not be empty');
  assert.deepEqual(report.findings, []);
});
