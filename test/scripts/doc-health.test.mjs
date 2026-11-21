import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { checkDeadReferences, checkDocuments, checkPlatformLinks, checkPlatformMetadata, checkRuleClaims, checkVerbReferences, governanceBaselineFields } from '../../scripts/doc-health.mjs';
import { checkIdentityIdsUnique } from '../../scripts/identity-ids-unique.mjs';
import { enumerateDocEntries, manifestPathFor } from '../../src/report/enduser-index-generate.mjs';
import { buildDecisionIndexMarkdown, indexPathFor, narrativeHolderResolver } from '../../src/report/decision-index.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BUILT_HOST = process.env.FGOS_HOST_BIN || path.join(REPO_ROOT, 'target', 'debug', 'fgos');
const baseline = governanceBaselineFields(fs.readFileSync(path.join(REPO_ROOT, 'docs/platform/governance.md'), 'utf8'));

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
test('dead-reference rule reports a missing path, but not a pinned (real commit), fenced, pattern, past-state or Canonical: No reference, and fails without the canonical flag', () => {
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
    'docs/platform/b/spec.md': '# Draft\n\n```txt\nCanonical: No; unsigned draft\n```\n\nPlanned: `src/gone.mjs`\n',
  };
  const kinds = { 'docs/platform/a/spec.md': { canonical: true, kind: 'spec' },
    'docs/platform/a/decisions/d.md': { canonical: true, kind: 'decision' },
    'docs/platform/a/notes.md': { canonical: false, kind: 'unplaced-platform' },
    'docs/platform/b/spec.md': { canonical: true, kind: 'spec' } };
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

// Owns the verb reference rule: a code span naming `fgos <verb>` in a document that holds current
// claims must name a verb of the listing; the exemptions are the dead-reference rule's.
test('verb reference rule reports an unknown verb, but not a listed or hidden verb, a pinned line, prose, a fence, a past-state or a Canonical: No document', () => {
  const docs = {
    'docs/platform/a/spec.md': [
      'Live: `fgos run "x"`, `fgos doctor --fix` and `fgos internal terminal-control`.',
      'Dead: `fgos setup` and `fgos evolve --pick <id>`; prose fgos setup is not a span.',
      'Pinned: `fgos setup` was retired in 53523a917.',
      'Not a verb: `fgos.v1`, `fgos-coding-knowledge`, `fgos <verb>`, `npm run fgos:dev -- run`.',
      '```',
      '`fgos fenced`',
      '```',
    ].join('\n'),
    'docs/platform/a/history/h.md': 'Past: `fgos setup`\n',
    'docs/platform/b/spec.md': '# Draft\n\n```txt\nCanonical: No\n```\n\nPlanned: `fgos secrets`\n',
  };
  const kinds = { 'docs/platform/a/spec.md': { canonical: true, kind: 'spec' },
    'docs/platform/a/history/h.md': { canonical: true, kind: 'history' },
    'docs/platform/b/spec.md': { canonical: true, kind: 'spec' } };
  let listed = 0;
  const { findings } = checkVerbReferences({
    files: Object.keys(docs), readFile: (f) => docs[f], classify: (f) => kinds[f],
    isCommit: (token) => token === '53523a917',
    verbs: () => { listed += 1; return new Set(['run', 'doctor', 'internal']); },
  });
  assert.deepEqual(findings.map((f) => [f.path, f.line, f.target, f.type]), [
    ['docs/platform/a/spec.md', 2, 'setup', 'unknown-verb'],
    ['docs/platform/a/spec.md', 2, 'evolve', 'unknown-verb'],
  ]);
  assert.equal(listed, 1, 'the listing is read once, and only because a mention exists');
});

// Owns the rule-claim owner rule: the key is (holder, id) with the title, so a repeat of the same
// id and title in a second holder is a finding and the same id under another title is not.
test('rule-claim rule reports the same id and title defined in two holders, not a holder-local id with another title or a plain citation', () => {
  const docs = {
    'docs/platform/work/spec.md': '- **RUL1 (one write door).** Every write.\n- **RUL2 (one log (append-only)).** Truth.\n- **D-ADR0055 (sealed events) — text.**\n',
    'docs/platform/runner/spec.md': '- **RUL1 (one write door).** Again.\n- **RUL2 (runner owns the batch).** Other.\n- **RUL1 (one write door) note 2.** Same holder twice is not a second holder.\nRUL2 (one log (append-only)) of work is cited, not bold.\n',
    'docs/platform/event/spec.md': '**D-ADR0055 (sealed events) — repeated.**\n```\n**RUL2 (one log (append-only)).** fenced\n```\n',
  };
  const all = checkRuleClaims({ files: Object.keys(docs), readFile: (f) => docs[f] });
  assert.deepEqual(all.findings.map((f) => [f.path, f.line, f.target]), [
    ['docs/platform/event/spec.md', 1, 'D-ADR0055'],
    ['docs/platform/runner/spec.md', 1, 'RUL1'],
    ['docs/platform/work/spec.md', 1, 'RUL1'],
    ['docs/platform/work/spec.md', 3, 'D-ADR0055'],
  ]);
  assert.match(all.findings[1].message, /RUL1 \(one write door\) is also defined in docs\/platform\/work\/spec\.md/);
  // Under path input a repeat still counts against an unchecked holder, but only checked paths are reported.
  const scoped = checkRuleClaims({ files: Object.keys(docs), readFile: (f) => docs[f], report: new Set(['docs/platform/runner/spec.md']) });
  assert.deepEqual(scoped.findings.map((f) => f.path), ['docs/platform/runner/spec.md']);
});

// Owns path input: only the named paths are checked, a deleted one is never read, placement runs
// once over the paths that exist, and each document is classified at most once across rules.
test('path input checks only the named paths, never reads a deleted one, asks placement once and classifies each document once', () => {
  const docs = {
    'docs/platform/governance.md': 'Required baseline:\n```txt\nDocument type:\n```\n',
    'docs/platform/a/spec.md': '# A\n\n[gone](b.md) `src/gone.mjs` `fgos setup`\n',
    'docs/platform/c/spec.md': '# C\n\n[also broken](nope.md)\n',
  };
  const read = [];
  const source = {
    files: ['docs/platform/governance.md', 'docs/platform/a/spec.md', 'docs/platform/c/spec.md'],
    readFile: (f) => { read.push(f); if (!(f in docs)) throw new Error(`read a path that is not there: ${f}`); return docs[f]; },
    exists: (f) => f in docs,
  };
  const classified = [], placed = [];
  const result = checkDocuments({
    source, paths: ['./docs/platform/a/spec.md', 'docs/platform/b.md', 'plans/reports/x.md'],
    classify: (f) => { classified.push(f); return { canonical: true, kind: 'spec', metadataExempt: true }; },
    isCommit: () => false,
    verbs: () => new Set(['run']),
    placement: (paths) => { placed.push(paths); return { violations: [
      { path: 'docs/platform/a/spec.md', code: 'wrong-location', message: 'blocked', posture: 'block' },
      { path: 'docs/platform/a/spec.md', code: 'pattern-mismatch', message: 'only a warning' },
    ] }; },
  });
  assert.deepEqual(placed, [['docs/platform/a/spec.md']]);
  assert.deepEqual(result.findings.map((f) => [f.path, f.type]), [
    ['docs/platform/a/spec.md', 'convention-wrong-location'],
    ['docs/platform/a/spec.md', 'unresolved-link'],
    ['docs/platform/a/spec.md', 'dead-reference'],
    ['docs/platform/a/spec.md', 'unknown-verb'],
  ]);
  assert.deepEqual(result.warnings.map((w) => w.type), ['convention-pattern-mismatch']);
  assert.deepEqual(classified, ['docs/platform/a/spec.md']);
  assert.equal(read.includes('docs/platform/b.md'), false);
  assert.equal(result.counts.files, 1);
  assert.throws(() => checkDocuments({ source, paths: ['../outside.md'], classify: () => ({}), isCommit: () => false, placement: () => ({}) }), /not a repository-relative path/);
});

// One wiring proof for every rule over the real repository and the real host.
test('live self-check: every repository platform doc passes every doc-health rule', () => {
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
    const backlog = (ids) => {
      fs.rmSync(path.join(repo, 'plans/backlog'), { recursive: true, force: true });
      fs.mkdirSync(path.join(repo, 'plans/backlog'), { recursive: true });
      ids.forEach((id, index) => fs.writeFileSync(path.join(repo, 'plans/backlog', `item-${index}.md`), `---\nid: ${id}\nstatus: proposed\n---\n# a story\n`));
    };
    backlog(['p-4f2a7qzb3x', 'STR27']);
    const clean = checkIdentityIdsUnique(repo);
    assert.deepEqual(clean, { passed: true, message: '2 backlog ids, 1 D-ADR numbers and 1 decision files, none repeated' });

    // Relocated history may repeat a decision under another title; it is not a second definition.
    fs.mkdirSync(path.join(repo, 'docs/platform/area-a/history'), { recursive: true });
    fs.writeFileSync(path.join(repo, 'docs/platform/area-a/history/old.md'), '### D-ADR0070 (an older title for the decision)\n');
    assert.deepEqual(checkIdentityIdsUnique(repo), clean);

    backlog(['p-4f2a7qzb3x', 'p-4f2a7qzb3x']);
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
