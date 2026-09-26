import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import {
  buildSwitchboardIndex,
  lookupSwitchboard,
  classifyDocPath,
  classifyByDirectoryHeuristic,
  deriveFileClassFromAuthority,
  slugifyHeading,
  extractHeadings,
  extractDocumentType,
  deriveClaimKind,
  proposeDisposition,
  proposeRationale,
  buildInventoryRow,
  extractMarkdownConservationUnits,
  extractMixedFileConservationUnit,
  classifyConsumerKind,
  normalizeDocTarget,
  extractLinks,
  extractRefs,
  collectConsumers,
  parseLsTreeLong,
} from '../../scripts/generate-doc-inventory.mjs';
import {
  validateStructure,
  validateAgainstVocabulary,
} from '../../scripts/check-doc-inventory-gates.mjs';

// A minimal fixture modeled on the real
// plans/260925-documentation-authority-unification/transitional-switchboard.json
// shape, covering: a root document, an exact-route legacy-current spec, a
// promoted docs/platform/** portal, a glob-route retained legacy area, and
// the distinct non-authority end-user knowledge corpus.
const FIXTURE_SWITCHBOARD = {
  rootDocuments: [
    { path: 'docs/backlog.md', authorityStatus: 'non-authority', fileClass: 'generated', role: 'Product backlog projection from event-sourced PBI records.' },
  ],
  areas: [
    {
      area: 'Runner / dispatch / merge lifecycle',
      authorityStatus: 'legacy-current',
      currentRoutes: [
        { scope: 'runner-and-dispatch-lifecycle', route: 'docs/specs/runner.md', authorityStatus: 'legacy-current', role: 'Owns runner loop, dispatch, merge gate, and worker log' },
      ],
    },
    {
      area: 'Agent coordination',
      authorityStatus: 'promoted',
      entryPoint: 'docs/platform/agent-coordination/README.md',
      canonicalRoutes: ['docs/platform/agent-coordination/README.md'],
      currentRoutes: [
        { scope: 'promoted-portal-navigation-and-status', route: 'docs/platform/agent-coordination/README.md', authorityStatus: 'promoted', role: 'Target portal owns navigation and status summary' },
        { scope: 'retained-contracts-schemas-and-proofs', route: 'docs/architect/agent-coordination/**', authorityStatus: 'legacy-current', role: 'Exact accepted contracts, schemas, ADRs, and verification remain until explicitly superseded' },
      ],
    },
    {
      area: 'End-user authoring, index, and knowledge registry',
      authorityStatus: 'non-authority',
      currentRoutes: [
        { scope: 'knowledge-corpus', route: 'docs/knowledge/**', authorityStatus: 'non-authority', role: 'Distinct user/end-user knowledge corpus; does not own platform authority' },
      ],
    },
  ],
};

test('buildSwitchboardIndex + lookupSwitchboard: exact root document wins', () => {
  const index = buildSwitchboardIndex(FIXTURE_SWITCHBOARD);
  const hit = lookupSwitchboard(index, 'docs/backlog.md');
  assert.equal(hit.area, 'root:docs/backlog.md');
  assert.equal(hit.authorityStatus, 'non-authority');
  assert.equal(hit.fileClass, 'generated');
});

test('lookupSwitchboard: exact area route (non-glob) matches precisely', () => {
  const index = buildSwitchboardIndex(FIXTURE_SWITCHBOARD);
  const hit = lookupSwitchboard(index, 'docs/specs/runner.md');
  assert.equal(hit.area, 'Runner / dispatch / merge lifecycle');
  assert.equal(hit.authorityStatus, 'legacy-current');
  assert.equal(hit.switchboardSource, 'scopedRoute');
});

test('lookupSwitchboard: glob route (/**) matches every file under the prefix', () => {
  const index = buildSwitchboardIndex(FIXTURE_SWITCHBOARD);
  const hit = lookupSwitchboard(index, 'docs/architect/agent-coordination/decisions/ADR-001-work-lifecycle-authority.md');
  assert.equal(hit.area, 'Agent coordination');
  assert.equal(hit.authorityStatus, 'legacy-current');
  const miss = lookupSwitchboard(index, 'docs/architect/agent-coordination-other/file.md');
  assert.equal(miss, null, 'a sibling directory sharing only a name prefix must not match');
});

test('lookupSwitchboard: unmatched path returns null', () => {
  const index = buildSwitchboardIndex(FIXTURE_SWITCHBOARD);
  assert.equal(lookupSwitchboard(index, 'docs/architect/proposals/some-proposal.md'), null);
});

test('deriveFileClassFromAuthority: role text mentioning generated/projection wins regardless of status', () => {
  assert.equal(deriveFileClassFromAuthority('legacy-current', 'A generated projection of X'), 'generated');
  assert.equal(deriveFileClassFromAuthority('promoted', 'Portal owns active navigation'), 'maintained-authority');
});

test('deriveFileClassFromAuthority: non-authority defaults to maintained-authority, not generated', () => {
  // Regression: individually authored user/end-user knowledge docs are
  // non-authority (they do not own platform authority) but are NOT
  // machine-generated; defaulting them to "generated" would misclassify
  // the entire docs/knowledge/** and docs/how-to/** corpora.
  assert.equal(deriveFileClassFromAuthority('non-authority', 'Distinct user/end-user knowledge corpus; does not own platform authority'), 'maintained-authority');
});

test('deriveFileClassFromAuthority: historical/vision role text yields retained-source', () => {
  assert.equal(deriveFileClassFromAuthority('non-authority', 'Historical vision; superseded for active navigation'), 'retained-source');
});

test('classifyDocPath: AGENTS.md and CLAUDE.md are always-loaded instruction layer', () => {
  const index = buildSwitchboardIndex(FIXTURE_SWITCHBOARD);
  const a = classifyDocPath('AGENTS.md', index);
  assert.equal(a.area, 'Always-loaded instruction layer');
  assert.equal(a.authorityStatus, 'legacy-current');
  assert.equal(a.gap, false);
});

test('classifyDocPath: promoted docs/platform/** file classifies as platform-authority, maintained-authority', () => {
  const index = buildSwitchboardIndex(FIXTURE_SWITCHBOARD);
  const row = classifyDocPath('docs/platform/agent-coordination/README.md', index);
  assert.equal(row.area, 'Agent coordination');
  assert.equal(row.authorityStatus, 'promoted');
  assert.equal(row.fileClass, 'maintained-authority');
  assert.equal(row.corpus, 'platform-authority');
  assert.equal(row.gap, false);
});

test('classifyDocPath: docs/knowledge/** is switchboard-known but corpus is user-knowledge, not platform-authority', () => {
  const index = buildSwitchboardIndex(FIXTURE_SWITCHBOARD);
  const row = classifyDocPath('docs/knowledge/some-topic/some-topic.md', index);
  assert.equal(row.corpus, 'user-knowledge');
  assert.equal(row.fileClass, 'maintained-authority');
  assert.equal(row.gap, false);
});

test('classifyDocPath: unmatched docs/architect path falls to the legacy directory heuristic as an explicit gap', () => {
  const index = buildSwitchboardIndex(FIXTURE_SWITCHBOARD);
  const row = classifyDocPath('docs/architect/proposals/some-proposal.md', index);
  assert.equal(row.gap, true);
  assert.equal(row.fileClass, 'retained-source'); // classifyFile(): docs/architect + /proposals/ -> retained-source
  assert.equal(row.authorityStatus, 'legacy-current');
});

test('classifyDocPath: completely unmapped path (outside docs/architect and docs/specs) is an explicit unclassified gap', () => {
  const index = buildSwitchboardIndex(FIXTURE_SWITCHBOARD);
  const row = classifyDocPath('docs/some-new-root-file.md', index);
  assert.equal(row.gap, true);
  assert.equal(row.area, 'Unclassified');
  assert.equal(row.authorityStatus, 'unclassified');
});

test('classifyByDirectoryHeuristic: distillery is a consumer-project corpus, not platform authority', () => {
  const row = classifyByDirectoryHeuristic('docs/distillery/intake.md');
  assert.equal(row.corpus, 'consumer-project');
  assert.equal(row.gap, false);
});

test('slugifyHeading: lowercases, strips punctuation, collapses whitespace to GitHub-compatible hyphens', () => {
  assert.equal(slugifyHeading('Hello, World! #Test'), 'hello-world-test');
  assert.equal(slugifyHeading('Use <code>fgOS</code> & Runner'), 'use-fgos-runner');
});


test('normalizeDocTarget + extractLinks: resolves Markdown relative links against the source path', () => {
  assert.equal(normalizeDocTarget('../reference/thing.md#anchor', 'docs/how-to/run.md'), 'docs/reference/thing.md');
  const links = extractLinks('[Read](../reference/thing.md#anchor)', 'docs/how-to/run.md');
  assert.deepEqual(links.map((l) => l.targetPath), ['docs/reference/thing.md']);
});


test('extractRefs: preserves full tsk ids, avoids ADR inside D-ADR duplicates, and ignores pure date-like hex', () => {
  const refs = extractRefs('D-ADR0030 tsk-1lv-4 20260717 ecfd0d1a ADR-001');
  assert.equal(refs.includes('tsk-1lv-4'), true);
  assert.equal(refs.filter((r) => r === 'ADR0030').length, 0);
  assert.equal(refs.includes('20260717'), false);
  assert.equal(refs.includes('ecfd0d1a'), true);
});

test('extractHeadings: ignores headings inside fenced code blocks and dedupes repeated anchors', () => {
  const md = [
    '# Title',
    '',
    '## Section One',
    '',
    '```txt',
    '# not a heading',
    '```',
    '',
    '## Section One',
  ].join('\n');
  const headings = extractHeadings(md);
  assert.deepEqual(headings, [
    { level: 1, text: 'Title', anchor: 'title' },
    { level: 2, text: 'Section One', anchor: 'section-one' },
    { level: 2, text: 'Section One', anchor: 'section-one-1' },
  ]);
});


test('extractMarkdownConservationUnits: only closes fences with matching marker and sufficient length', () => {
  const md = ['````txt', '# not heading', '```', '# still not heading', '````', '# Real'].join('\n');
  const units = extractMarkdownConservationUnits(md);
  assert.equal(units.some((u) => u.title === 'still not heading'), false);
  assert.equal(units.some((u) => u.title === 'Real'), true);
});

test('extractHeadings: strips a trailing ATX closing sequence', () => {
  const headings = extractHeadings('## Section Two ##');
  assert.deepEqual(headings, [{ level: 2, text: 'Section Two', anchor: 'section-two' }]);
});

test('extractDocumentType: reads the conventional leading ```txt frontmatter block', () => {
  const content = ['```txt', 'Document type: Reading map', 'Audience: Human reviewer', '```', '', '# Title'].join('\n');
  assert.equal(extractDocumentType(content), 'Reading map');
});

test('extractDocumentType: returns null when no frontmatter block is present', () => {
  assert.equal(extractDocumentType('# Just a heading\n\nSome prose.'), null);
});

test('deriveClaimKind: maps known document types, falls back to unclassified', () => {
  assert.equal(deriveClaimKind('Reading map'), 'navigation');
  assert.equal(deriveClaimKind('Spec'), 'specification');
  assert.equal(deriveClaimKind(null), 'unclassified');
  assert.equal(deriveClaimKind('Something Unrecognized'), 'unclassified');
});

test('proposeDisposition: gap always wins as unknown-blocking regardless of other fields', () => {
  assert.equal(proposeDisposition({ corpus: 'platform-authority', fileClass: 'maintained-authority', gap: true }), 'unknown-blocking');
});

test('proposeDisposition: user-knowledge and consumer-project corpora reclassify out of platform scope', () => {
  assert.equal(proposeDisposition({ corpus: 'user-knowledge', fileClass: 'maintained-authority', gap: false }), 'reclassify-out-of-platform-scope');
  assert.equal(proposeDisposition({ corpus: 'consumer-project', fileClass: 'retained-source', gap: false }), 'reclassify-out-of-platform-scope');
});

test('proposeDisposition: history-evidence retains as evidence; generated regenerates from source', () => {
  assert.equal(proposeDisposition({ corpus: 'history-evidence', fileClass: 'history-evidence', gap: false }), 'retain-as-evidence');
  assert.equal(proposeDisposition({ corpus: 'platform-authority', fileClass: 'generated', gap: false }), 'regenerate-from-source');
});

test('proposeDisposition: already-promoted docs/platform/** canonical route proposes promote; legacy maintained files merge', () => {
  assert.equal(proposeDisposition({ corpus: 'platform-authority', fileClass: 'maintained-authority', gap: false, isPromotedCanonical: true }), 'promote');
  assert.equal(proposeDisposition({ corpus: 'platform-authority', authorityStatus: 'legacy-current', fileClass: 'maintained-authority', gap: false, isPromotedCanonical: false }), 'merge');
  assert.equal(proposeDisposition({ corpus: 'platform-authority', fileClass: 'retained-source', gap: false, isPromotedCanonical: false }), 'defer-with-owner');
});

test('proposeRationale: every disposition that requires one gets a non-empty string; others get null', () => {
  assert.equal(typeof proposeRationale('defer-with-owner', { area: 'Foo' }), 'string');
  assert.equal(typeof proposeRationale('retain-as-evidence'), 'string');
  assert.equal(typeof proposeRationale('reclassify-out-of-platform-scope'), 'string');
  assert.equal(typeof proposeRationale('unknown-blocking'), 'string');
  assert.equal(proposeRationale('promote'), null);
  assert.equal(proposeRationale('regenerate-from-source'), null);
});

test('buildInventoryRow: end-to-end row for a promoted portal file requires a target owner and needs no rationale', () => {
  const index = buildSwitchboardIndex(FIXTURE_SWITCHBOARD);
  const content = '```txt\nDocument type: Area portal\n```\n\n# Agent Coordination\n';
  const row = buildInventoryRow('docs/platform/agent-coordination/README.md', { content, blobSha: 'a'.repeat(40), blobSize: content.length, switchboardIndex: index });
  assert.equal(row.proposedDisposition, 'promote');
  assert.equal(row.proposedTargetOwner, 'docs/platform/agent-coordination/README.md');
  assert.equal(row.proposedRationale, null);
  assert.equal(row.claimKind, 'navigation');
  assert.equal(row.headingCount, 1);
  assert.equal(row.claims.length >= 1, true);
  assert.equal(row.claims[0].targetOwner, 'docs/platform/agent-coordination/README.md');
  assert.equal(row.claims[0].status, 'current');
});

test('buildInventoryRow: end-to-end row for an unmapped gap requires a rationale and no target owner', () => {
  const index = buildSwitchboardIndex(FIXTURE_SWITCHBOARD);
  const content = '# Some New Root File\n';
  const row = buildInventoryRow('docs/some-new-root-file.md', { content, blobSha: 'b'.repeat(40), blobSize: content.length, switchboardIndex: index });
  assert.equal(row.proposedDisposition, 'unknown-blocking');
  assert.equal(row.proposedTargetOwner, null);
  assert.equal(typeof row.proposedRationale, 'string');
});

test('buildInventoryRow: claim ledger rows carry every plan §6.2 field and enum status', () => {
  const index = buildSwitchboardIndex(FIXTURE_SWITCHBOARD);
  const content = '```txt\nDocument type: Area portal\n```\n\n# Agent Coordination\n';
  const row = buildInventoryRow('docs/platform/agent-coordination/README.md', { content, blobSha: 'd'.repeat(40), blobSize: content.length, switchboardIndex: index });
  const claim = row.claims[0];
  for (const field of ['claimId', 'sourceId', 'sourcePath', 'sourceAnchor', 'sourceDigest', 'targetOwner', 'targetAnchor', 'claimKind', 'authorityKind', 'status', 'relations', 'decisionRefs', 'evidenceLinks', 'disposition', 'reviewStatus']) {
    assert.equal(Object.hasOwn(claim, field), true, `missing ${field}`);
  }
  assert.match(claim.status, /^(current|future|historical)$/);
  assert.equal(claim.sourcePath, 'docs/platform/agent-coordination/README.md');
});

test('buildInventoryRow: source and claim ids are independent of source path for identical non-duplicate content', () => {
  const index = buildSwitchboardIndex(FIXTURE_SWITCHBOARD);
  const content = '# Portable\n\nPortable text with enough detail.';
  const a = buildInventoryRow('docs/unmapped-a.md', { content, blobSha: 'e'.repeat(40), blobSize: content.length, switchboardIndex: index });
  const b = buildInventoryRow('docs/unmapped-b.md', { content, blobSha: 'e'.repeat(40), blobSize: content.length, switchboardIndex: index });
  assert.equal(a.sourceId, b.sourceId);
  assert.deepEqual(a.claimIds, b.claimIds);
});

test('buildInventoryRow: identical claim content inside one source gets explicit duplicate lineage instead of silent collision', () => {
  const index = buildSwitchboardIndex(FIXTURE_SWITCHBOARD);
  const content = ['Repeated paragraph with enough detail to become a claim.', '', 'Repeated paragraph with enough detail to become a claim.'].join('\n');
  const row = buildInventoryRow('docs/repeated.md', { content, blobSha: 'f'.repeat(40), blobSize: content.length, switchboardIndex: index });
  assert.equal(new Set(row.claimIds).size, row.claimIds.length);
  assert.equal(row.claims[1].relations.some((r) => r.type === 'same-source-identical-content-duplicate'), true);
});

test('extractMarkdownConservationUnits: emits headings and unheaded blocks for conservation', () => {
  const md = ['Intro paragraph with enough claim text to be conserved.', '', '# Title', '', 'Unheaded section prose with enough text to count.'].join('\n');
  const units = extractMarkdownConservationUnits(md);
  assert.deepEqual(units.map((u) => u.unitKind), ['unheaded-preamble', 'heading', 'unheaded-block']);
  assert.equal(units[0].anchor, 'unheaded-block-1');
});


test('extractMarkdownConservationUnits: preserves short nonblank normative unheaded lines', () => {
  const units = extractMarkdownConservationUnits('MUST pass.\n\n# Title');
  assert.equal(units[0].unitKind, 'unheaded-preamble');
  assert.equal(units[0].sample, 'MUST pass.');
});

test('extractMarkdownConservationUnits: conserves fenced payloads without treating headings inside them as headings', () => {
  const md = ['# Contract', '', '```yaml', '# schema comment', 'authority: legacy-current', '```'].join('\n');
  const units = extractMarkdownConservationUnits(md);
  assert.deepEqual(units.map((u) => u.unitKind), ['heading', 'unheaded-block']);
  assert.equal(units[1].sample.includes('authority: legacy-current'), true);
  assert.equal(units.some((u) => u.title === 'schema comment'), false);
});

test('extractMixedFileConservationUnit: non-Markdown payloads get a file-block claim unit', () => {
  const units = extractMixedFileConservationUnit('docs/how-to/coordination-examples/request.json', '{"x":true}\n');
  assert.equal(units.length, 1);
  assert.equal(units[0].unitKind, 'file-block');
  assert.equal(units[0].anchor, 'file-block');
});

test('classifyConsumerKind: covers dynamic, glob, fixture, executable proof, and literal consumers without treating Markdown bold as glob', () => {
  assert.equal(classifyConsumerKind('src/x.mjs', 'const p = `${root}/docs/specs/runner.md`;'), 'dynamic');
  assert.equal(classifyConsumerKind('scripts/x.mjs', 'docs/architect/**'), 'glob');
  assert.equal(classifyConsumerKind('docs/x.md', '**bold docs/specs/runner.md**'), 'literal');
  assert.equal(classifyConsumerKind('test/fixtures/readme.md', 'docs/specs/runner.md'), 'fixture');
  assert.equal(classifyConsumerKind('test/foo.test.mjs', 'assert.match(out, /docs/);'), 'executable-proof');
  assert.equal(classifyConsumerKind('README.md', 'docs/specs/runner.md'), 'literal');
});


test('collectConsumers: scans source extensions, resolves relative links, globs, exact AGENTS segments, and immutable refs', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-inventory-consumers-'));
  try {
    execFileSync('git', ['init'], { cwd: tmp, stdio: 'ignore' });
    execFileSync('git', ['config', 'user.email', 't@example.test'], { cwd: tmp });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: tmp });
    fs.mkdirSync(path.join(tmp, 'docs/specs'), { recursive: true });
    fs.mkdirSync(path.join(tmp, 'docs/how-to'), { recursive: true });
    fs.mkdirSync(path.join(tmp, 'src'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'AGENTS.md'), '# Agents\n');
    fs.writeFileSync(path.join(tmp, 'docs/specs/runner.md'), '# Runner\n\nD-ADR0030 tsk-1lv-4 ecfd0d1a\n');
    fs.writeFileSync(path.join(tmp, 'docs/how-to/read.md'), '[Runner](../specs/runner.md)\n');
    fs.writeFileSync(path.join(tmp, 'src/consumer.ts'), [
      'const x = "docs/specs/*.md";',
      'const y = path.join("docs", "specs", name);',
      'const z = "AGENTS.md";',
      'const not = "NOTAGENTS.md";',
      '// tsk-1lv-4',
    ].join('\n'));
    execFileSync('git', ['add', '.'], { cwd: tmp });
    execFileSync('git', ['commit', '-m', 'fixture'], { cwd: tmp, stdio: 'ignore' });
    const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: tmp, encoding: 'utf8' }).trim();
    const consumers = collectConsumers(tmp, commit, ['AGENTS.md', 'docs/specs/runner.md'], new Map(), { targetRefs: new Map([['docs/specs/runner.md', ['tsk-1lv-4']]]) });
    assert.equal(consumers.get('docs/specs/runner.md').some((e) => e.path === 'docs/how-to/read.md' && e.resolvedTarget === 'docs/specs/runner.md'), true);
    assert.equal(consumers.get('docs/specs/runner.md').some((e) => e.kind === 'glob'), true);
    assert.equal(consumers.immutableRefEdges.some((e) => e.ref === 'tsk-1lv-4' && e.sourcePaths.includes('src/consumer.ts') && e.targetPaths.includes('docs/specs/runner.md')), true);
    assert.equal(consumers.get('AGENTS.md').some((e) => e.path === 'src/consumer.ts'), true);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('buildInventoryRow: current source route is not automatically its own target owner', () => {
  const index = buildSwitchboardIndex(FIXTURE_SWITCHBOARD);
  const row = buildInventoryRow('docs/specs/runner.md', { content: '# Runner\n\nContract text with enough detail.', blobSha: 'c'.repeat(40), blobSize: 40, switchboardIndex: index });
  assert.equal(row.proposedDisposition, 'unknown-blocking');
  assert.equal(row.proposedTargetOwner, null);
  assert.equal(row.claims.every((c) => c.targetOwner === null), true);
});

test('parseLsTreeLong: parses `git ls-tree -r -l` output and ignores non-blob entries', () => {
  const shaA = 'a'.repeat(40);
  const shaB = 'b'.repeat(40);
  const treeSha = 'c'.repeat(40);
  const output = [
    `100644 blob ${shaA}     123\tdocs/README.md`,
    `040000 tree ${treeSha}       -\tdocs/specs`,
    `100644 blob ${shaB}      45\tdocs/specs/runner.md`,
    '',
  ].join('\n');
  const entries = parseLsTreeLong(output);
  assert.deepEqual(entries, [
    { path: 'docs/README.md', mode: '100644', blobSha: shaA, size: 123 },
    { path: 'docs/specs/runner.md', mode: '100644', blobSha: shaB, size: 45 },
  ]);
});

test('validateStructure: rejects missing plan §6.2 fields and invalid claim status', () => {
  const findings = validateStructure({
    items: [{ path: 'docs/x.md', sourceId: 'src_a', sourceDigest: 'digest', area: 'A', authorityStatus: 'candidate', fileClass: 'maintained-authority', corpus: 'platform-authority', proposedDisposition: 'unknown-blocking', headings: [], claimIds: ['claim_a'], claimCount: 1, consumerEdgeIds: [], consumerEdgeCount: 0, consumerKinds: [] }],
    claimLedger: [{ claimId: 'claim_a', sourceId: 'src_a', sourcePath: 'docs/x.md', sourceAnchor: 'x', sourceDigest: 'digest', claimKind: 'navigation', authorityKind: 'candidate', status: 'future-or-current', disposition: 'unknown-blocking', reviewStatus: 'open-blocking', relations: [], decisionRefs: [] }],
    consumerEdges: [],
    summary: { scannedFilesCount: 1 },
  });
  assert.equal(findings.some((f) => f.type === 'malformed-claim' && f.message.includes('evidenceLinks')), true);
  assert.equal(findings.some((f) => f.type === 'invalid-claim-status'), true);
});

test('validateAgainstVocabulary: retained claim owner must be a real switchboard-backed target owner', () => {
  const vocabulary = {
    sourceDispositions: [{ id: 'merge', requiresTargetOwner: true, allowedFileClasses: ['maintained-authority'] }],
    claimKinds: [{ id: 'navigation' }],
  };
  const inventory = {
    items: [
      { path: 'docs/current.md', sourceId: 'src_a', sourceDigest: 'digest', area: 'A', authorityStatus: 'legacy-current', fileClass: 'maintained-authority', corpus: 'platform-authority', proposedDisposition: 'merge', proposedTargetOwner: 'docs/current.md', proposedRationale: null, switchboardSource: 'scopedRoute' },
      { path: 'docs/fallback.md', sourceId: 'src_b', sourceDigest: 'digest2', area: 'A', authorityStatus: 'legacy-current', fileClass: 'maintained-authority', corpus: 'platform-authority', proposedDisposition: 'merge', proposedTargetOwner: 'docs/current.md', proposedRationale: null, switchboardSource: 'directory-heuristic' },
    ],
    claimLedger: [
      { claimId: 'claim_ok', sourceId: 'src_a', sourcePath: 'docs/current.md', sourceAnchor: 'x', sourceDigest: 'digest', targetOwner: 'docs/current.md', targetAnchor: 'x', claimKind: 'navigation', authorityKind: 'legacy-current', status: 'current', relations: [], decisionRefs: [], evidenceLinks: [], disposition: 'merge', reviewStatus: 'pending-independent-review' },
      { claimId: 'claim_bad', sourceId: 'src_b', sourcePath: 'docs/fallback.md', sourceAnchor: 'x', sourceDigest: 'digest2', targetOwner: 'docs/fallback.md', targetAnchor: 'x', claimKind: 'navigation', authorityKind: 'legacy-current', status: 'current', relations: [], decisionRefs: [], evidenceLinks: [], disposition: 'merge', reviewStatus: 'pending-independent-review' },
    ],
  };
  const findings = validateAgainstVocabulary(inventory, vocabulary);
  assert.equal(findings.some((f) => f.type === 'retained-claim-owner-not-switchboard-backed' && f.message.includes('docs/fallback.md')), true);
});
