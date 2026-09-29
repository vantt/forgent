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
  generateInventory,
  buildIdentityRegistryIndex,
  bootstrapIdentityRegistry,
  carryForwardIdentityRegistry,
} from '../../scripts/generate-doc-inventory.mjs';
import {
  validateStructure,
  validateAgainstVocabulary,
  validateCommitBlobIntegrity,
  validateSourceUnitCoverage,
  deriveValidTargetOwnersFromSwitchboard,
  validateIdentityRegistry,
} from '../../scripts/check-doc-inventory-gates.mjs';
import {
  writeShardedJsonArtifact,
  loadShardedJsonArtifact,
} from '../../scripts/doc-inventory-artifact.mjs';

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
  const scaffold = buildInventoryRow('docs/platform/agent-coordination/README.md', { content, blobSha: 'a'.repeat(40), blobSize: content.length, switchboardIndex: index });
  const registry = { documents: [{ path: scaffold.path, sourceId: 'src_promoted_opaque' }], units: scaffold.claims.map((c, idx) => ({ sourcePath: scaffold.path, sourceAnchor: c.sourceAnchor, unitDigest: c.identityUnitDigest, claimId: `claim_promoted_opaque_${idx}` })) };
  const row = buildInventoryRow('docs/platform/agent-coordination/README.md', { content, blobSha: 'a'.repeat(40), blobSize: content.length, switchboardIndex: index, identityIndex: buildIdentityRegistryIndex(registry) });
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

test('buildInventoryRow: source and claim ids come from path-scoped registry entries, not content fallback', () => {
  const index = buildSwitchboardIndex(FIXTURE_SWITCHBOARD);
  const content = '# Portable\n\nPortable text with enough detail.';
  const scaffold = buildInventoryRow('docs/unmapped-a.md', { content, blobSha: 'e'.repeat(40), blobSize: content.length, switchboardIndex: index });
  const unitsFor = (sourcePath, sourceId, claimPrefix) => ({
    documents: [{ path: sourcePath, sourceId }],
    units: scaffold.claims.map((c, idx) => ({ sourcePath, sourceAnchor: c.sourceAnchor, unitDigest: c.identityUnitDigest, claimId: `${claimPrefix}_${idx}` })),
  });
  const registry = {
    documents: [...unitsFor('docs/unmapped-a.md', 'src_a_opaque', 'claim_a').documents, ...unitsFor('docs/unmapped-b.md', 'src_b_opaque', 'claim_b').documents],
    units: [...unitsFor('docs/unmapped-a.md', 'src_a_opaque', 'claim_a').units, ...unitsFor('docs/unmapped-b.md', 'src_b_opaque', 'claim_b').units],
  };
  const a = buildInventoryRow('docs/unmapped-a.md', { content, blobSha: 'e'.repeat(40), blobSize: content.length, switchboardIndex: index, identityIndex: buildIdentityRegistryIndex(registry) });
  const b = buildInventoryRow('docs/unmapped-b.md', { content, blobSha: 'e'.repeat(40), blobSize: content.length, switchboardIndex: index, identityIndex: buildIdentityRegistryIndex(registry) });
  assert.equal(a.sourceId, 'src_a_opaque');
  assert.equal(b.sourceId, 'src_b_opaque');
  assert.notDeepEqual(a.claimIds, b.claimIds);
});

test('generateInventory: exact duplicate files share semantic claim ids with explicit occurrence coverage', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-inventory-dups-'));
  try {
    execFileSync('git', ['init'], { cwd: tmp, stdio: 'ignore' });
    execFileSync('git', ['config', 'user.email', 't@example.test'], { cwd: tmp });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: tmp });
    fs.mkdirSync(path.join(tmp, 'plans/260925-documentation-authority-unification/reports'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'plans/260925-documentation-authority-unification/transitional-switchboard.json'), JSON.stringify(FIXTURE_SWITCHBOARD));
    fs.writeFileSync(path.join(tmp, 'plans/260925-documentation-authority-unification/shipped-path-conventions-inventory.json'), JSON.stringify({ entries: [] }));
    fs.mkdirSync(path.join(tmp, 'docs'), { recursive: true });
    const content = '# Same\n\nPortable duplicate payload with enough detail.';
    fs.writeFileSync(path.join(tmp, 'docs/a.md'), content);
    fs.writeFileSync(path.join(tmp, 'docs/b.md'), content);
    execFileSync('git', ['add', '.'], { cwd: tmp });
    execFileSync('git', ['commit', '-m', 'fixture'], { cwd: tmp, stdio: 'ignore' });
    const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: tmp, encoding: 'utf8' }).trim();
    const registryPath = path.join(tmp, 'plans/260925-documentation-authority-unification/reports/phase-02-identity-registry.json');
    fs.writeFileSync(registryPath, JSON.stringify(bootstrapIdentityRegistry(tmp, { commit }), null, 2));
    const inventory = generateInventory(tmp, { commit, identityRegistryPath: registryPath });
    const a = inventory.items.find((i) => i.path === 'docs/a.md');
    const b = inventory.items.find((i) => i.path === 'docs/b.md');
    assert.notDeepEqual(a.claimIds, b.claimIds);
    assert.equal(new Set(inventory.claimLedger.map((c) => c.claimId)).size, inventory.claimLedger.length);
    const claimA = inventory.claimLedger.find((c) => c.claimId === a.claimIds[0]);
    const claimB = inventory.claimLedger.find((c) => c.claimId === b.claimIds[0]);
    assert.equal(claimA.semanticClaimId, claimB.semanticClaimId);
    assert.equal(claimA.relations.some((r) => r.type === 'duplicate-content-member' && r.sourcePath === 'docs/a.md'), true);
    assert.equal(claimB.relations.some((r) => r.type === 'duplicate-content-member' && r.sourcePath === 'docs/b.md'), true);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('buildInventoryRow: identical claim content inside one source never silently collides', () => {
  const index = buildSwitchboardIndex(FIXTURE_SWITCHBOARD);
  const content = ['Repeated paragraph with enough detail to become a claim.', '', 'Repeated paragraph with enough detail to become a claim.'].join('\n');
  const row = buildInventoryRow('docs/repeated.md', { content, blobSha: 'f'.repeat(40), blobSize: content.length, switchboardIndex: index });
  assert.equal(new Set(row.claimIds).size, row.claimIds.length);
  assert.equal(row.claims.every((c) => c.identityStatus.includes('registry-gap') && c.disposition === 'unknown-blocking'), true);
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

test('buildInventoryRow: multi-claim-kind with only one concrete owner demotes instead of pretending split', () => {
  const index = buildSwitchboardIndex(FIXTURE_SWITCHBOARD);
  const content = ['# Agent coordination', '', 'Navigation map with enough detail.', '', '## Contract', '', 'CTR001 requires a durable contract with enough detail.'].join('\n');
  const row = buildInventoryRow('docs/platform/agent-coordination/README.md', { content, blobSha: 'c'.repeat(40), blobSize: content.length, switchboardIndex: index });
  assert.equal(row.proposedDisposition, 'unknown-blocking');
  assert.equal(row.proposedTargetOwner, null);
  assert.equal(row.claims.length >= 2, true);
  assert.equal(row.claims.every((c) => c.disposition === 'unknown-blocking' && c.targetOwner === null && c.targetAnchor === null), true);
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

test('validateStructure: accepts shared duplicate claim ids only with explicit coverage and rejects silent collisions', () => {
  const baseItem = { sourceId: 'src_same', sourceDigest: 'digest', area: 'A', authorityStatus: 'candidate', fileClass: 'maintained-authority', corpus: 'platform-authority', proposedDisposition: 'unknown-blocking', headings: [], claimIds: ['claim_same'], claimCount: 1, consumerEdgeIds: [], consumerEdgeCount: 0, consumerKinds: [], resolvedLinks: [], linkRecords: [] };
  const covered = validateStructure({
    items: [{ ...baseItem, path: 'docs/a.md' }, { ...baseItem, path: 'docs/b.md' }],
    scanGaps: [],
    claimLedger: [{ claimId: 'claim_same', sourceId: 'src_same', sourcePath: 'docs/a.md', sourceAnchor: 'x', sourceDigest: 'digest', sourceLocation: { start: 1, end: 1 }, targetOwner: null, targetAnchor: null, claimKind: 'navigation', authorityKind: 'candidate', status: 'future', disposition: 'unknown-blocking', reviewStatus: 'blocking', relations: [
      { type: 'duplicate-content-canonical', sourcePath: 'docs/a.md' },
      { type: 'duplicate-content-of', sourcePath: 'docs/b.md' },
    ], sourceOccurrences: [{ path: 'docs/a.md' }, { path: 'docs/b.md' }], decisionRefs: [], evidenceLinks: [] }],
    consumerEdges: [], inboundLinkEdges: [], immutableRefEdges: [], summary: { scannedFilesCount: 2 },
  });
  assert.equal(covered.some((f) => f.type === 'claim-shared-id-silent-collision' || f.type === 'claim-source-path-mismatch' || f.type === 'claim-ledger-mismatch'), false);

  const silent = validateStructure({
    items: [{ ...baseItem, path: 'docs/a.md' }, { ...baseItem, path: 'docs/b.md' }],
    scanGaps: [],
    claimLedger: [{ claimId: 'claim_same', sourceId: 'src_same', sourcePath: 'docs/a.md', sourceAnchor: 'x', sourceDigest: 'digest', sourceLocation: { start: 1, end: 1 }, targetOwner: null, targetAnchor: null, claimKind: 'navigation', authorityKind: 'candidate', status: 'future', disposition: 'unknown-blocking', reviewStatus: 'blocking', relations: [], decisionRefs: [], evidenceLinks: [] }],
    consumerEdges: [], inboundLinkEdges: [], immutableRefEdges: [], summary: { scannedFilesCount: 2 },
  });
  assert.equal(silent.some((f) => f.type === 'claim-shared-id-silent-collision'), true);

  const positional = validateStructure({
    items: [{ ...baseItem, path: 'docs/a.md', claimIds: ['claim_same_srcdup_deadbeef'] }],
    scanGaps: [],
    claimLedger: [{ claimId: 'claim_same_srcdup_deadbeef', sourceId: 'src_same', sourcePath: 'docs/a.md', sourceAnchor: 'x', sourceDigest: 'digest', sourceLocation: { start: 1, end: 1 }, targetOwner: null, targetAnchor: null, claimKind: 'navigation', authorityKind: 'candidate', status: 'future', disposition: 'unknown-blocking', reviewStatus: 'blocking', relations: [{ type: 'duplicate-content-of', sourcePath: 'docs/a.md', sourceOccurrenceOrdinal: 1 }], decisionRefs: [], evidenceLinks: [] }],
    consumerEdges: [], inboundLinkEdges: [], immutableRefEdges: [], summary: { scannedFilesCount: 1 },
  });
  assert.equal(positional.some((f) => f.type === 'path-dependent-duplicate-claim-id'), true);
});

test('validateStructure: accepts explicit unresolvedRoot dynamic consumer gaps without broad target fan-out', () => {
  const findings = validateStructure({
    items: [{ path: 'docs/x.md', sourceId: 'src_a', sourceDigest: 'digest', area: 'A', authorityStatus: 'candidate', fileClass: 'maintained-authority', corpus: 'platform-authority', proposedDisposition: 'unknown-blocking', headings: [], claimIds: [], claimCount: 0, consumerEdgeIds: [], consumerEdgeCount: 0, consumerKinds: [] }],
    claimLedger: [],
    consumerEdges: [{ edgeId: 'consumer_unresolved_alias', path: 'src/x.ts', line: 1, kind: 'dynamic', unresolvedDynamicPattern: 'DOCS_DIR/specs/runner.md', targetPath: null, targetPaths: [], unresolvedRoot: 'DOCS_DIR', identityStatus: 'unresolved-dynamic-pattern' }],
    inboundLinkEdges: [],
    immutableRefEdges: [],
    scanGaps: [],
    summary: { scannedFilesCount: 1 },
  });
  assert.equal(findings.some((f) => f.type === 'malformed-unresolved-consumer-edge'), false);
});

test('validateStructure: rejects missing plan §6.2 fields and invalid claim status', () => {
  const findings = validateStructure({
    items: [{ path: 'docs/x.md', sourceId: 'src_a', sourceDigest: 'digest', area: 'A', authorityStatus: 'candidate', fileClass: 'maintained-authority', corpus: 'platform-authority', proposedDisposition: 'unknown-blocking', headings: [], claimIds: ['claim_a'], claimCount: 1, consumerEdgeIds: [], consumerEdgeCount: 0, consumerKinds: [] }],
    claimLedger: [{ claimId: 'claim_a', sourceId: 'src_a', sourcePath: 'docs/x.md', sourceAnchor: 'x', sourceDigest: 'digest', claimKind: 'navigation', authorityKind: 'candidate', status: 'future-or-current', disposition: 'unknown-blocking', reviewStatus: 'open-blocking', relations: [], decisionRefs: [] }],
    consumerEdges: [],
    inboundLinkEdges: [],
    immutableRefEdges: [],
    scanGaps: [],
    summary: { scannedFilesCount: 1 },
  });
  assert.equal(findings.some((f) => f.type === 'malformed-claim' && f.message.includes('evidenceLinks')), true);
  assert.equal(findings.some((f) => f.type === 'invalid-claim-status'), true);
});

test('validateCommitBlobIntegrity: verifies sourceDigest and blobSha against commit tree', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-inventory-blob-'));
  try {
    execFileSync('git', ['init'], { cwd: tmp, stdio: 'ignore' });
    execFileSync('git', ['config', 'user.email', 't@example.test'], { cwd: tmp });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: tmp });
    fs.mkdirSync(path.join(tmp, 'docs'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'docs/x.md'), '# X\n');
    execFileSync('git', ['add', '.'], { cwd: tmp });
    execFileSync('git', ['commit', '-m', 'fixture'], { cwd: tmp, stdio: 'ignore' });
    const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: tmp, encoding: 'utf8' }).trim();
    const goodSha = execFileSync('git', ['rev-parse', `${commit}:docs/x.md`], { cwd: tmp, encoding: 'utf8' }).trim();
    const findings = validateCommitBlobIntegrity(tmp, { commit, items: [{ path: 'docs/x.md', blobSha: '0'.repeat(40), blobSize: 4, sourceDigest: 'bad' }] });
    assert.equal(findings.some((f) => f.type === 'source-blob-sha-mismatch' && f.message.includes(goodSha)), true);
    assert.equal(findings.some((f) => f.type === 'source-digest-mismatch'), true);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('sharded inventory artifact loader verifies hashes, sizes, order, and extra parts', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-inventory-shards-'));
  try {
    const manifestPath = path.join(tmp, 'phase-02-doc-inventory.json');
    writeShardedJsonArtifact(manifestPath, { z: [1, 2, 3], nested: { ok: true } }, { maxPartBytes: 20 });
    assert.deepEqual(loadShardedJsonArtifact(manifestPath), { z: [1, 2, 3], nested: { ok: true } });
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    fs.appendFileSync(path.join(tmp, manifest.parts[0].path), 'tamper');
    assert.throws(() => loadShardedJsonArtifact(manifestPath), /byte size mismatch|sha256 mismatch/);
    fs.writeFileSync(path.join(tmp, manifest.parts[0].path), '{}\n');
    assert.throws(() => loadShardedJsonArtifact(manifestPath), /byte size mismatch|sha256 mismatch/);
    writeShardedJsonArtifact(manifestPath, { ok: true }, { maxPartBytes: 20 });
    fs.writeFileSync(path.join(tmp, 'phase-02-doc-inventory.parts/extra.jsonl'), 'x');
    assert.throws(() => loadShardedJsonArtifact(manifestPath), /unexpected extra shard/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('identity registry reuses unaffected claim ids when unrelated text is inserted and headings reorder', () => {
  const index = buildSwitchboardIndex(FIXTURE_SWITCHBOARD);
  const original = '# A\n\nStable paragraph with enough detail.\n\n# B\n\nAnother stable paragraph with enough detail.';
  const scaffold = buildInventoryRow('docs/platform/agent-coordination/README.md', { content: original, blobSha: '1'.repeat(40), blobSize: original.length, switchboardIndex: index });
  const registry = {
    documents: [{ path: scaffold.path, sourceId: 'src_registry_opaque' }],
    units: scaffold.claims.map((c, idx) => ({ sourcePath: scaffold.path, sourceAnchor: c.sourceAnchor, unitDigest: c.identityUnitDigest, claimId: `claim_registry_opaque_${idx}` })),
  };
  const changed = '# B\n\nAnother stable paragraph with enough detail.\n\n# Inserted\n\nInserted unrelated paragraph with enough detail.\n\n# A\n\nStable paragraph with enough detail.';
  const second = buildInventoryRow('docs/platform/agent-coordination/README.md', { content: changed, blobSha: '2'.repeat(40), blobSize: changed.length, switchboardIndex: index, identityIndex: buildIdentityRegistryIndex(registry) });
  const carried = second.claims.filter((c) => c.identityStatus === 'carried-forward').map((c) => c.claimId);
  assert.equal(carried.includes(registry.units.find((u) => u.sourceAnchor === 'a').claimId), true);
  assert.equal(carried.includes(registry.units.find((u) => u.sourceAnchor === 'b').claimId), true);
});

test('missing or ambiguous identity registry entries become explicit blockers, never derived replacement ids', () => {
  const index = buildSwitchboardIndex(FIXTURE_SWITCHBOARD);
  const content = '# A\n\nStable paragraph with enough detail.';
  const missing = buildInventoryRow('docs/platform/agent-coordination/README.md', { content, blobSha: '1'.repeat(40), blobSize: content.length, switchboardIndex: index, identityIndex: buildIdentityRegistryIndex({ documents: [], units: [] }) });
  assert.equal(missing.claims.every((c) => c.disposition === 'unknown-blocking' && c.identityStatus.includes('registry-gap')), true);
  assert.equal(missing.claims.every((c) => c.targetOwner === null && c.claimId.includes('identity_gap')), true);

  const scaffold = buildInventoryRow('docs/platform/agent-coordination/README.md', { content, blobSha: '1'.repeat(40), blobSize: content.length, switchboardIndex: index });
  const ambiguousRegistry = {
    documents: [{ path: scaffold.path, sourceId: 'src_registry_opaque' }],
    units: scaffold.claims.flatMap((c) => [
      { sourcePath: scaffold.path, sourceAnchor: c.sourceAnchor, unitDigest: c.identityUnitDigest, claimId: `${c.sourceAnchor}_one` },
      { sourcePath: scaffold.path, sourceAnchor: c.sourceAnchor, unitDigest: c.identityUnitDigest, claimId: `${c.sourceAnchor}_two` },
    ]),
  };
  const ambiguous = buildInventoryRow(scaffold.path, { content, blobSha: '1'.repeat(40), blobSize: content.length, switchboardIndex: index, identityIndex: buildIdentityRegistryIndex(ambiguousRegistry) });
  assert.equal(ambiguous.claims.every((c) => c.identityStatus === 'ambiguous-registry-gap' && c.disposition === 'unknown-blocking' && c.targetOwner === null), true);
});

test('buildSwitchboardIndex: duplicate exact routes become blocking route-conflict gaps instead of last-write-wins', () => {
  const sw = { areas: [
    { area: 'A', entryPoint: 'docs/platform/a.md', currentRoutes: [{ route: 'docs/platform-foundations.md', authorityStatus: 'legacy-current', role: 'A' }] },
    { area: 'B', entryPoint: 'docs/platform/b.md', currentRoutes: [{ route: 'docs/platform-foundations.md', authorityStatus: 'legacy-current', role: 'B' }] },
  ] };
  const row = classifyDocPath('docs/platform-foundations.md', buildSwitchboardIndex(sw));
  assert.equal(row.gap, true);
  assert.equal(row.gapType, 'route-conflict');
  const inv = buildInventoryRow('docs/platform-foundations.md', { content: '# Laws\n', blobSha: '3'.repeat(40), blobSize: 7, switchboardIndex: buildSwitchboardIndex(sw) });
  assert.equal(inv.proposedDisposition, 'unknown-blocking');
  assert.equal(inv.proposedTargetOwner, null);
});

test('slugifyHeading: preserves underscores like GitHub anchors', () => {
  assert.equal(slugifyHeading('Foo_Bar Baz'), 'foo_bar-baz');
});

test('collectConsumers: path.join dynamic prefixes create standalone unresolved dynamic edges', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-inventory-dynamic-'));
  try {
    execFileSync('git', ['init'], { cwd: tmp, stdio: 'ignore' });
    execFileSync('git', ['config', 'user.email', 't@example.test'], { cwd: tmp });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: tmp });
    fs.mkdirSync(path.join(tmp, 'docs/specs'), { recursive: true });
    fs.mkdirSync(path.join(tmp, 'events'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'docs/specs/runner.md'), '# Runner\n');
    fs.writeFileSync(path.join(tmp, 'events/evidence.jsonl'), '{"p":"docs/specs/runner.md"}\n');
    fs.writeFileSync(path.join(tmp, 'events/app.log'), 'path.join("docs", "specs", name)\n');
    execFileSync('git', ['add', '.'], { cwd: tmp });
    execFileSync('git', ['commit', '-m', 'fixture'], { cwd: tmp, stdio: 'ignore' });
    const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: tmp, encoding: 'utf8' }).trim();
    const consumers = collectConsumers(tmp, commit, ['docs/specs/runner.md']);
    assert.equal(consumers.get('docs/specs/runner.md').some((e) => e.path === 'events/evidence.jsonl'), true);
    assert.equal(consumers.get('docs/specs/runner.md').some((e) => e.path === 'events/app.log' && e.kind === 'dynamic'), false);
    assert.equal(consumers.unresolvedConsumerEdges.some((e) => e.path === 'events/app.log' && e.kind === 'dynamic' && e.unresolvedDynamicPattern === 'docs/specs/**'), true);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('collectConsumers: dynamic parser skips comments, quotes, and Markdown prose but scans fenced code', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-inventory-dynamic-lexical-'));
  try {
    execFileSync('git', ['init'], { cwd: tmp, stdio: 'ignore' });
    execFileSync('git', ['config', 'user.email', 't@example.test'], { cwd: tmp });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: tmp });
    fs.mkdirSync(path.join(tmp, 'docs/specs'), { recursive: true });
    fs.mkdirSync(path.join(tmp, 'src'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'docs/specs/runner.md'), '# Runner\n');
    fs.writeFileSync(path.join(tmp, 'src/c.ts'), [
      '// path.join("docs", "specs", beforeCall)',
      '/* path.join("docs", "specs", blockComment) */',
      'const quoted = "path.join(\\"docs\\", \\"specs\\", quoteEffect)";',
      'path.join(path.resolve(root, "docs"), "specs", name);',
      'path.join(DOCS_DIR, "specs", "runner.md");',
    ].join('\n'));
    fs.writeFileSync(path.join(tmp, 'README.md'), [
      '# Readme',
      'Prose says path.join("docs", "specs", proseName) but is not code.',
      '```js',
      'path.join("docs", "specs", fencedName)',
      '```',
    ].join('\n'));
    execFileSync('git', ['add', '.'], { cwd: tmp });
    execFileSync('git', ['commit', '-m', 'fixture'], { cwd: tmp, stdio: 'ignore' });
    const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: tmp, encoding: 'utf8' }).trim();
    const consumers = collectConsumers(tmp, commit, ['docs/specs/runner.md']);
    const unresolved = consumers.unresolvedConsumerEdges;
    assert.equal(unresolved.some((e) => e.rawTarget?.includes('beforeCall')), false);
    assert.equal(unresolved.some((e) => e.rawTarget?.includes('blockComment')), false);
    assert.equal(unresolved.some((e) => e.rawTarget?.includes('quoteEffect')), false);
    assert.equal(unresolved.some((e) => e.path === 'src/c.ts' && e.rawTarget?.includes('path.resolve') && e.unresolvedDynamicPattern === 'docs/specs/**'), true);
    assert.equal(unresolved.some((e) => e.path === 'README.md' && e.rawTarget?.includes('proseName')), false);
    assert.equal(unresolved.some((e) => e.path === 'README.md' && e.rawTarget?.includes('fencedName') && e.unresolvedDynamicPattern === 'docs/specs/**'), true);
    const alias = unresolved.find((e) => e.path === 'src/c.ts' && e.unresolvedRoot === 'DOCS_DIR');
    assert.equal(alias?.targetPath, null);
    assert.deepEqual(alias?.targetPaths, []);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('validateSourceUnitCoverage: detects dropped, duplicate, and digest-mismatched immutable source-unit coverage', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-inventory-coverage-'));
  try {
    execFileSync('git', ['init'], { cwd: tmp, stdio: 'ignore' });
    execFileSync('git', ['config', 'user.email', 't@example.test'], { cwd: tmp });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: tmp });
    fs.mkdirSync(path.join(tmp, 'docs'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'docs/x.md'), '# X\n\nBody paragraph with enough detail.\n');
    execFileSync('git', ['add', '.'], { cwd: tmp });
    execFileSync('git', ['commit', '-m', 'fixture'], { cwd: tmp, stdio: 'ignore' });
    const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: tmp, encoding: 'utf8' }).trim();
    const units = extractMarkdownConservationUnits('# X\n\nBody paragraph with enough detail.\n');
    const baseClaim = (u, id) => ({ claimId: id, sourcePath: 'docs/x.md', sourceLocation: { start: u.startLine, end: u.endLine }, sourceUnitDigest: u.textDigest });
    assert.equal(validateSourceUnitCoverage(tmp, { commit, items: [{ path: 'docs/x.md', claimIds: ['c1', 'c2'] }], claimLedger: [baseClaim(units[0], 'c1'), baseClaim(units[1], 'c2')] }).length, 0);
    assert.equal(validateSourceUnitCoverage(tmp, { commit, items: [{ path: 'docs/x.md', claimIds: ['c1'] }], claimLedger: [baseClaim(units[0], 'c1')] }).some((f) => f.type === 'source-unit-dropped'), true);
    assert.equal(validateSourceUnitCoverage(tmp, { commit, items: [{ path: 'docs/x.md', claimIds: ['c1', 'c1b', 'c2'] }], claimLedger: [baseClaim(units[0], 'c1'), baseClaim(units[0], 'c1b'), baseClaim(units[1], 'c2')] }).some((f) => f.type === 'source-unit-duplicate-coverage'), true);
    assert.equal(validateSourceUnitCoverage(tmp, { commit, items: [{ path: 'docs/x.md', claimIds: ['c1', 'c2'] }], claimLedger: [{ ...baseClaim(units[0], 'c1'), sourceUnitDigest: 'bad' }, baseClaim(units[1], 'c2')] }).some((f) => f.type === 'source-unit-digest-mismatch'), true);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('deriveValidTargetOwnersFromSwitchboard reads target topology independently of inventory rows', () => {
  const owners = deriveValidTargetOwnersFromSwitchboard(FIXTURE_SWITCHBOARD);
  assert.equal(owners.has('docs/platform/agent-coordination/README.md'), true);
  assert.equal(owners.has('docs/specs/runner.md'), false);
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

test('identity registry unit lookup excludes claim kind, status, and classification changes', () => {
  const index = buildSwitchboardIndex(FIXTURE_SWITCHBOARD);
  const content = '# Durable\n\nStable payload with enough detail.';
  const scaffold = buildInventoryRow('docs/platform/agent-coordination/README.md', { content, blobSha: '1'.repeat(40), blobSize: content.length, switchboardIndex: index });
  const registry = {
    documents: [{ path: scaffold.path, sourceId: 'src_stable' }],
    units: scaffold.claims.map((c) => ({ sourcePath: scaffold.path, sourceAnchor: c.sourceAnchor, unitDigest: c.identityUnitDigest, identityFingerprint: c.identityFingerprint, claimId: c.claimId, claimKind: 'different-kind', status: 'historical' })),
  };
  const row = buildInventoryRow(scaffold.path, { content, blobSha: '2'.repeat(40), blobSize: content.length, switchboardIndex: index, identityIndex: buildIdentityRegistryIndex(registry) });
  assert.equal(row.claims.every((c) => c.identityStatus === 'carried-forward'), true);
  assert.deepEqual(row.claimIds, scaffold.claimIds);
});

test('repeated heading identity follows semantic fingerprint instead of ordinal anchor', () => {
  const index = buildSwitchboardIndex(FIXTURE_SWITCHBOARD);
  const original = ['# Same', '', 'Payload A with enough semantic detail.', '', '# Same', '', 'Payload B with enough semantic detail.'].join('\n');
  const scaffold = buildInventoryRow('docs/platform/agent-coordination/README.md', { content: original, blobSha: '1'.repeat(40), blobSize: original.length, switchboardIndex: index });
  const registry = { documents: [{ path: scaffold.path, sourceId: 'src_repeat' }], units: scaffold.claims.map((c) => ({ sourcePath: c.sourcePath, sourceAnchor: c.sourceAnchor, unitDigest: c.identityUnitDigest, identityFingerprint: c.identityFingerprint, sourceUnitDigest: c.sourceUnitDigest, claimId: c.claimId })) };
  const swapped = ['# Same', '', 'Payload B with enough semantic detail.', '', '# Inserted', '', 'New payload with enough semantic detail.', '', '# Same', '', 'Payload A with enough semantic detail.'].join('\n');
  const row = buildInventoryRow(scaffold.path, { content: swapped, blobSha: '2'.repeat(40), blobSize: swapped.length, switchboardIndex: index, identityIndex: buildIdentityRegistryIndex(registry) });
  const carried = row.claims.filter((c) => c.identityStatus === 'carried-forward').map((c) => c.claimId);
  for (const old of scaffold.claimIds) assert.equal(carried.includes(old), true);
});

test('indistinguishable repeated carried-forward units become explicit identity gaps', () => {
  const index = buildSwitchboardIndex(FIXTURE_SWITCHBOARD);
  const content = ['# Same', '', 'Identical payload with enough semantic detail.', '', '# Same', '', 'Identical payload with enough semantic detail.'].join('\n');
  const scaffold = buildInventoryRow('docs/platform/agent-coordination/README.md', { content, blobSha: '1'.repeat(40), blobSize: content.length, switchboardIndex: index });
  const firstHeading = scaffold.claims.find((c) => c.sourceAnchor === 'same');
  const registry = { documents: [{ path: scaffold.path, sourceId: 'src_ambig' }], units: [{ sourcePath: scaffold.path, sourceAnchor: 'same', unitDigest: firstHeading.identityUnitDigest, identityFingerprint: firstHeading.identityFingerprint, sourceUnitDigest: firstHeading.sourceUnitDigest, claimId: 'claim_only_one_distinct' }] };
  const row = buildInventoryRow(scaffold.path, { content, blobSha: '2'.repeat(40), blobSize: content.length, switchboardIndex: index, identityIndex: buildIdentityRegistryIndex(registry) });
  assert.equal(row.claims.some((c) => c.identityStatus === 'ambiguous-duplicate-registry-gap' && c.disposition === 'unknown-blocking'), true);
  assert.equal(row.claims.some((c) => c.claimId.includes('_dup_')), false);
});

test('collectConsumers: dynamic parser keeps nested, multiple, multiline calls as docs-rooted unresolved patterns', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-inventory-dynamic-new-url-'));
  try {
    execFileSync('git', ['init'], { cwd: tmp, stdio: 'ignore' });
    execFileSync('git', ['config', 'user.email', 't@example.test'], { cwd: tmp });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: tmp });
    fs.mkdirSync(path.join(tmp, 'docs/a'), { recursive: true });
    fs.mkdirSync(path.join(tmp, 'src'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'docs/a/README.md'), '# A\n');
    fs.writeFileSync(path.join(tmp, 'src/c.mjs'), [
      'path.join("docs", area, "README.md")',
      'path.join(repoRoot, "docs", "specs", name)',
      'path.join(root(), "docs", x)',
      'path.join("docs", pick("a", nested("b", c)), "README.md")',
      'path.join(path.resolve(root, "docs"), "specs", name)',
      'path.join("docs", maybeOne)',
      'path.resolve("docs", maybeTwo)',
      'new URL(',
      '  "../docs/a/README.md",',
      '  import.meta.url',
      ')',
      'new URL(`../docs/${section}.md`, import.meta.url)',
    ].join('\n'));
    execFileSync('git', ['add', '.'], { cwd: tmp });
    execFileSync('git', ['commit', '-m', 'fixture'], { cwd: tmp, stdio: 'ignore' });
    const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: tmp, encoding: 'utf8' }).trim();
    const consumers = collectConsumers(tmp, commit, ['docs/a/README.md']);
    const patterns = new Set(consumers.unresolvedConsumerEdges.map((e) => e.unresolvedDynamicPattern));
    assert.equal(consumers.get('docs/a/README.md').some((e) => e.path === 'src/c.mjs' && e.kind === 'dynamic' && e.resolvedTarget === 'docs/a/README.md'), true);
    assert.equal(patterns.has('docs/**/README.md'), true);
    assert.equal(patterns.has('docs/specs/**'), true);
    assert.equal(patterns.has('docs/**'), true);
    assert.equal([...patterns].some((p) => p.includes('**/**')), false);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('buildSwitchboardIndex marks tied equal-prefix routes as blocking conflicts', () => {
  const index = buildSwitchboardIndex({
    rootDocuments: [],
    areas: [
      { area: 'A', authorityStatus: 'legacy-current', entryPoint: 'docs/platform/a/README.md', currentRoutes: [{ route: 'docs/tie/**', authorityStatus: 'legacy-current', role: 'one' }] },
      { area: 'B', authorityStatus: 'legacy-current', entryPoint: 'docs/platform/b/README.md', currentRoutes: [{ route: 'docs/tie/**', authorityStatus: 'legacy-current', role: 'two' }] },
    ],
  });
  const row = buildInventoryRow('docs/tie/x.md', { content: '# X\n\nPayload with enough detail.\n', blobSha: '1'.repeat(40), blobSize: 32, switchboardIndex: index });
  assert.equal(row.gap, true);
  assert.equal(row.proposedDisposition, 'unknown-blocking');
  assert.equal(row.proposedTargetOwner, null);
});

test('carryForwardIdentityRegistry moves one source without reminting claim ids or unrelated opaque ids', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-inventory-carry-'));
  try {
    execFileSync('git', ['init'], { cwd: tmp, stdio: 'ignore' });
    execFileSync('git', ['config', 'user.email', 't@example.test'], { cwd: tmp });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: tmp });
    fs.mkdirSync(path.join(tmp, 'plans/260925-documentation-authority-unification/reports'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'plans/260925-documentation-authority-unification/transitional-switchboard.json'), JSON.stringify(FIXTURE_SWITCHBOARD));
    fs.mkdirSync(path.join(tmp, 'docs/old'), { recursive: true });
    fs.mkdirSync(path.join(tmp, 'docs/other'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'docs/old/a.md'), '# A\n\nPayload with enough detail.\n');
    fs.writeFileSync(path.join(tmp, 'docs/other/b.md'), '# B\n\nOther payload with enough detail.\n');
    execFileSync('git', ['add', '.'], { cwd: tmp });
    execFileSync('git', ['commit', '-m', 'old'], { cwd: tmp, stdio: 'ignore' });
    const oldCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: tmp, encoding: 'utf8' }).trim();
    const registry = bootstrapIdentityRegistry(tmp, { commit: oldCommit });
    const registryPath = path.join(tmp, 'plans/260925-documentation-authority-unification/reports/phase-02-identity-registry.json');
    fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
    fs.mkdirSync(path.join(tmp, 'docs/new'), { recursive: true });
    fs.renameSync(path.join(tmp, 'docs/old/a.md'), path.join(tmp, 'docs/new/a.md'));
    execFileSync('git', ['add', '.'], { cwd: tmp });
    execFileSync('git', ['commit', '-m', 'move'], { cwd: tmp, stdio: 'ignore' });
    const newCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: tmp, encoding: 'utf8' }).trim();
    const evolved = carryForwardIdentityRegistry(tmp, { commit: newCommit, identityRegistryPath: registryPath, sourcePath: 'docs/old/a.md', toSourcePath: 'docs/new/a.md' });
    const oldMovedIds = registry.units.filter((u) => u.sourcePath === 'docs/old/a.md').map((u) => u.claimId).sort();
    const newMovedIds = evolved.units.filter((u) => u.sourcePath === 'docs/new/a.md').map((u) => u.claimId).sort();
    assert.deepEqual(newMovedIds, oldMovedIds);
    assert.equal(evolved.documents.find((d) => d.path === 'docs/new/a.md').sourceId, registry.documents.find((d) => d.path === 'docs/old/a.md').sourceId);
    assert.equal(evolved.documents.find((d) => d.path === 'docs/other/b.md').sourceId, registry.documents.find((d) => d.path === 'docs/other/b.md').sourceId);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('carryForwardIdentityRegistry refuses existing destination registry entries', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-inventory-carry-existing-'));
  try {
    execFileSync('git', ['init'], { cwd: tmp, stdio: 'ignore' });
    execFileSync('git', ['config', 'user.email', 't@example.test'], { cwd: tmp });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: tmp });
    fs.mkdirSync(path.join(tmp, 'plans/260925-documentation-authority-unification/reports'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'plans/260925-documentation-authority-unification/transitional-switchboard.json'), JSON.stringify(FIXTURE_SWITCHBOARD));
    fs.mkdirSync(path.join(tmp, 'docs/old'), { recursive: true });
    fs.mkdirSync(path.join(tmp, 'docs/new'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'docs/old/a.md'), '# A\n\nPayload with enough detail.\n');
    fs.writeFileSync(path.join(tmp, 'docs/new/a.md'), '# Existing\n\nExisting payload with enough detail.\n');
    execFileSync('git', ['add', '.'], { cwd: tmp });
    execFileSync('git', ['commit', '-m', 'old'], { cwd: tmp, stdio: 'ignore' });
    const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: tmp, encoding: 'utf8' }).trim();
    const registry = bootstrapIdentityRegistry(tmp, { commit });
    const registryPath = path.join(tmp, 'plans/260925-documentation-authority-unification/reports/phase-02-identity-registry.json');
    fs.writeFileSync(registryPath, JSON.stringify(registry));
    assert.throws(() => carryForwardIdentityRegistry(tmp, { commit, identityRegistryPath: registryPath, sourcePath: 'docs/old/a.md', toSourcePath: 'docs/new/a.md' }), /destination already exists|destination units already exist/);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('carryForwardIdentityRegistry updates carried unit status from new classification', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-inventory-carry-status-'));
  try {
    execFileSync('git', ['init'], { cwd: tmp, stdio: 'ignore' });
    execFileSync('git', ['config', 'user.email', 't@example.test'], { cwd: tmp });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: tmp });
    fs.mkdirSync(path.join(tmp, 'plans/260925-documentation-authority-unification/reports'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'plans/260925-documentation-authority-unification/transitional-switchboard.json'), JSON.stringify(FIXTURE_SWITCHBOARD));
    fs.mkdirSync(path.join(tmp, 'docs/old'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'docs/old/a.md'), '# A\n\nPayload with enough detail.\n');
    execFileSync('git', ['add', '.'], { cwd: tmp });
    execFileSync('git', ['commit', '-m', 'old'], { cwd: tmp, stdio: 'ignore' });
    const oldCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: tmp, encoding: 'utf8' }).trim();
    const registry = bootstrapIdentityRegistry(tmp, { commit: oldCommit });
    for (const unit of registry.units) if (unit.sourcePath === 'docs/old/a.md') unit.status = 'historical';
    const registryPath = path.join(tmp, 'plans/260925-documentation-authority-unification/reports/phase-02-identity-registry.json');
    fs.writeFileSync(registryPath, JSON.stringify(registry));
    fs.mkdirSync(path.join(tmp, 'docs/new'), { recursive: true });
    fs.renameSync(path.join(tmp, 'docs/old/a.md'), path.join(tmp, 'docs/new/a.md'));
    execFileSync('git', ['add', '.'], { cwd: tmp });
    execFileSync('git', ['commit', '-m', 'move'], { cwd: tmp, stdio: 'ignore' });
    const newCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: tmp, encoding: 'utf8' }).trim();
    const evolved = carryForwardIdentityRegistry(tmp, { commit: newCommit, identityRegistryPath: registryPath, sourcePath: 'docs/old/a.md', toSourcePath: 'docs/new/a.md' });
    assert.equal(evolved.units.filter((u) => u.sourcePath === 'docs/new/a.md').every((u) => u.status === 'future'), true);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('carryForwardIdentityRegistry refuses ambiguous duplicate and edited units without guessing positional ids', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-inventory-carry-refuse-'));
  try {
    execFileSync('git', ['init'], { cwd: tmp, stdio: 'ignore' });
    execFileSync('git', ['config', 'user.email', 't@example.test'], { cwd: tmp });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: tmp });
    fs.mkdirSync(path.join(tmp, 'plans/260925-documentation-authority-unification/reports'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'plans/260925-documentation-authority-unification/transitional-switchboard.json'), JSON.stringify(FIXTURE_SWITCHBOARD));
    fs.mkdirSync(path.join(tmp, 'docs/old'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'docs/old/a.md'), ['# Same', '', 'Identical payload with enough detail.', '', '# Same', '', 'Identical payload with enough detail.'].join('\n'));
    execFileSync('git', ['add', '.'], { cwd: tmp });
    execFileSync('git', ['commit', '-m', 'old'], { cwd: tmp, stdio: 'ignore' });
    const oldCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: tmp, encoding: 'utf8' }).trim();
    const registry = bootstrapIdentityRegistry(tmp, { commit: oldCommit });
    const registryPath = path.join(tmp, 'plans/260925-documentation-authority-unification/reports/phase-02-identity-registry.json');
    fs.writeFileSync(registryPath, JSON.stringify(registry));
    fs.mkdirSync(path.join(tmp, 'docs/new'), { recursive: true });
    fs.renameSync(path.join(tmp, 'docs/old/a.md'), path.join(tmp, 'docs/new/a.md'));
    execFileSync('git', ['add', '.'], { cwd: tmp });
    execFileSync('git', ['commit', '-m', 'move'], { cwd: tmp, stdio: 'ignore' });
    const moveCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: tmp, encoding: 'utf8' }).trim();
    assert.throws(() => carryForwardIdentityRegistry(tmp, { commit: moveCommit, identityRegistryPath: registryPath, sourcePath: 'docs/old/a.md', toSourcePath: 'docs/new/a.md' }), /refused.*possible old units/);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }

  const editTmp = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-inventory-carry-edited-'));
  try {
    execFileSync('git', ['init'], { cwd: editTmp, stdio: 'ignore' });
    execFileSync('git', ['config', 'user.email', 't@example.test'], { cwd: editTmp });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: editTmp });
    fs.mkdirSync(path.join(editTmp, 'plans/260925-documentation-authority-unification/reports'), { recursive: true });
    fs.writeFileSync(path.join(editTmp, 'plans/260925-documentation-authority-unification/transitional-switchboard.json'), JSON.stringify(FIXTURE_SWITCHBOARD));
    fs.mkdirSync(path.join(editTmp, 'docs/old'), { recursive: true });
    fs.writeFileSync(path.join(editTmp, 'docs/old/a.md'), '# A\n\nPayload with enough detail.\n');
    execFileSync('git', ['add', '.'], { cwd: editTmp });
    execFileSync('git', ['commit', '-m', 'old'], { cwd: editTmp, stdio: 'ignore' });
    const oldCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: editTmp, encoding: 'utf8' }).trim();
    const registry = bootstrapIdentityRegistry(editTmp, { commit: oldCommit });
    const registryPath = path.join(editTmp, 'plans/260925-documentation-authority-unification/reports/phase-02-identity-registry.json');
    fs.writeFileSync(registryPath, JSON.stringify(registry));
    fs.mkdirSync(path.join(editTmp, 'docs/new'), { recursive: true });
    fs.writeFileSync(path.join(editTmp, 'docs/new/a.md'), '# A\n\nEdited payload with enough different detail.\n');
    fs.rmSync(path.join(editTmp, 'docs/old/a.md'));
    execFileSync('git', ['add', '.'], { cwd: editTmp });
    execFileSync('git', ['commit', '-m', 'edited move'], { cwd: editTmp, stdio: 'ignore' });
    const editCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: editTmp, encoding: 'utf8' }).trim();
    assert.throws(() => carryForwardIdentityRegistry(editTmp, { commit: editCommit, identityRegistryPath: registryPath, sourcePath: 'docs/old/a.md', toSourcePath: 'docs/new/a.md' }), /edited\/new unit|not uniquely preserved/);
  } finally { fs.rmSync(editTmp, { recursive: true, force: true }); }
});

test('validateIdentityRegistry detects exact equality and stale units', () => {
  const inventory = { commit: 'c', items: [{ path: 'docs/x.md', sourceId: 'src_x' }], identityRegistry: { documents: 1, units: 1 }, claimLedger: [{ sourcePath: 'docs/x.md', sourceAnchor: 'x', sourceUnitDigest: 'digest', identityUnitDigest: 'unit', identityFingerprint: 'fp', claimId: 'claim_x', identityStatus: 'carried-forward' }] };
  const registry = { commit: 'c', documents: [{ path: 'docs/x.md', sourceId: 'src_x' }], units: [{ sourcePath: 'docs/x.md', sourceAnchor: 'x', sourceUnitDigest: 'changed', unitDigest: 'unit', identityFingerprint: 'fp', claimId: 'claim_x' }, { sourcePath: 'docs/x.md', sourceAnchor: 'stale', sourceUnitDigest: 'stale', unitDigest: 'stale', claimId: 'claim_stale' }] };
  const findings = validateIdentityRegistry(inventory, registry);
  assert.equal(findings.some((f) => f.type === 'identity-registry-source-unit-digest-mismatch'), true);
  assert.equal(findings.some((f) => f.type === 'identity-registry-stale-unit'), true);
});
