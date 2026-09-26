import { test } from 'node:test';
import assert from 'node:assert/strict';

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
  parseLsTreeLong,
} from '../../scripts/generate-doc-inventory.mjs';

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

test('slugifyHeading: lowercases, strips punctuation, collapses whitespace to hyphens', () => {
  assert.equal(slugifyHeading('Hello, World! #Test'), 'hello-world-test');
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

test('proposeDisposition: already-promoted docs/platform/** canonical route proposes promote; other maintained files defer-with-owner', () => {
  assert.equal(proposeDisposition({ corpus: 'platform-authority', fileClass: 'maintained-authority', gap: false, isPromotedCanonical: true }), 'promote');
  assert.equal(proposeDisposition({ corpus: 'platform-authority', fileClass: 'maintained-authority', gap: false, isPromotedCanonical: false }), 'defer-with-owner');
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
});

test('buildInventoryRow: end-to-end row for an unmapped gap requires a rationale and no target owner', () => {
  const index = buildSwitchboardIndex(FIXTURE_SWITCHBOARD);
  const content = '# Some New Root File\n';
  const row = buildInventoryRow('docs/some-new-root-file.md', { content, blobSha: 'b'.repeat(40), blobSize: content.length, switchboardIndex: index });
  assert.equal(row.proposedDisposition, 'unknown-blocking');
  assert.equal(row.proposedTargetOwner, null);
  assert.equal(typeof row.proposedRationale, 'string');
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
