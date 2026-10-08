import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeShardedJsonArtifact } from '../../scripts/doc-inventory-artifact.mjs';
import { execFileSync } from 'node:child_process';
import { bootstrapIdentityRegistry, generateInventory, IDENTITY_REGISTRY_PATH } from '../../scripts/generate-doc-inventory.mjs';
import {
  DEFAULT_VOCABULARY_PATH,
  DEFAULT_CONSTITUTION_PATH,
  DEFAULT_SCHEMA_PATH,
  validateVocabulary,
  validateConstitution,
  createRowValidator,
  summarizeLedger,
  summarizeItems,
  summarizeCutoverRows,
  classifyPath,
  checkPlacement,
  governanceBaselineFields,
  checkPromotion,
  runCli,
} from '../../scripts/check-doc-constitution.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8'));
const clone = (value) => JSON.parse(JSON.stringify(value));

const vocabulary = readJson(DEFAULT_VOCABULARY_PATH);
const constitution = readJson(DEFAULT_CONSTITUTION_PATH);
const schema = readJson(DEFAULT_SCHEMA_PATH);

function hex(char, len) {
  return char.repeat(len);
}

function validRow(overrides = {}) {
  return {
    claimId: `claim_${hex('a', 32)}`,
    sourceId: `src_${hex('b', 32)}`,
    sourcePath: 'docs/specs/runner.md',
    sourceAnchor: 'overview',
    sourceDigest: hex('c', 64),
    sourceUnitDigest: hex('d', 64),
    sourceLocation: { start: 1, end: 4 },
    targetOwner: null,
    targetAnchor: null,
    claimKind: 'unclassified',
    authorityKind: 'legacy-current',
    status: 'current',
    relations: [],
    decisionRefs: [],
    evidenceLinks: [],
    disposition: 'unknown-blocking',
    reviewStatus: 'blocking',
    rationale: 'No switchboard route yet.',
    identityUnitDigest: hex('e', 64),
    identityFingerprint: hex('f', 64),
    identityStatus: 'carried-forward',
    ...overrides,
  };
}

function types(findings) {
  return findings.map((f) => f.type);
}

test('committed vocabulary and constitution are internally consistent', () => {
  assert.deepEqual(validateVocabulary(vocabulary), []);
  assert.deepEqual(validateConstitution(constitution, vocabulary, { repoRoot: REPO_ROOT }), []);
});

test('vocabulary: a duplicate id inside a section is reported', () => {
  const broken = clone(vocabulary);
  broken.claimKinds.push({ ...broken.claimKinds[0] });
  assert.ok(types(validateVocabulary(broken)).includes('duplicate-id'));
});

test('vocabulary: a disposition naming an undefined file class is reported', () => {
  const broken = clone(vocabulary);
  broken.sourceDispositions.find((d) => d.id === 'promote').allowedFileClasses = ['no-such-class'];
  assert.ok(types(validateVocabulary(broken)).includes('unknown-file-class'));
});

test('vocabulary: a disposition without allowed file classes is reported', () => {
  const broken = clone(vocabulary);
  broken.sourceDispositions.find((d) => d.id === 'merge').allowedFileClasses = [];
  assert.ok(types(validateVocabulary(broken)).includes('missing-allowed-file-classes'));
});

test('vocabulary: a file class restricted to an unknown disposition is reported', () => {
  const broken = clone(vocabulary);
  broken.fileClasses.find((c) => c.id === 'unclassified').allowedDispositions = ['not-a-disposition'];
  assert.ok(types(validateVocabulary(broken)).includes('unknown-disposition'));
});

test('vocabulary: a change entry without evidence is reported', () => {
  const broken = clone(vocabulary);
  delete broken.changesFromV1[0].evidence;
  assert.ok(types(validateVocabulary(broken)).includes('change-missing-evidence'));
});

test('vocabulary: claim kinds that disagree on the ledger field list are reported', () => {
  const broken = clone(vocabulary);
  broken.claimKinds[1].minimumLedgerFields = broken.claimKinds[1].minimumLedgerFields.slice(1);
  assert.ok(types(validateVocabulary(broken)).includes('ledger-fields-differ'));
});

test('constitution: an unknown claim kind reference is reported', () => {
  const broken = clone(constitution);
  broken.documentKinds[0].claimKinds = ['no-such-kind'];
  assert.ok(types(validateConstitution(broken, vocabulary, { repoRoot: REPO_ROOT })).includes('unknown-claim-kind'));
});

test('constitution: a claim kind served by no document kind is reported', () => {
  const broken = clone(constitution);
  for (const kind of broken.documentKinds) kind.claimKinds = kind.claimKinds.filter((id) => id !== 'procedure');
  assert.ok(types(validateConstitution(broken, vocabulary, { repoRoot: REPO_ROOT })).includes('claim-kind-without-document-kind'));
});

test('constitution: a vocabulary document type with no document kind is reported', () => {
  const broken = clone(constitution);
  broken.documentKinds = broken.documentKinds.filter((k) => k.id !== 'reading-map');
  assert.ok(types(validateConstitution(broken, vocabulary, { repoRoot: REPO_ROOT })).includes('unresolved-document-type'));
});

test('constitution: duplicate document kind ids and duplicate placement patterns are reported', () => {
  const broken = clone(constitution);
  broken.documentKinds.push({ ...broken.documentKinds[0] });
  assert.ok(types(validateConstitution(broken, vocabulary, { repoRoot: REPO_ROOT })).includes('duplicate-id'));
  const rival = clone(constitution);
  rival.documentKinds.push({ ...rival.documentKinds[0], id: 'rival-portal', typeName: 'Rival portal' });
  assert.ok(types(validateConstitution(rival, vocabulary, { repoRoot: REPO_ROOT })).includes('duplicate-placement'));
});

test('constitution: an undeclared placeholder and a bad cardinality are reported', () => {
  const broken = clone(constitution);
  broken.documentKinds[1].placements[0].pattern = 'docs/platform/<unknown>/README.md';
  broken.documentKinds[1].placements[0].cardinality = 'several';
  const found = types(validateConstitution(broken, vocabulary, { repoRoot: REPO_ROOT }));
  assert.ok(found.includes('unknown-placeholder'));
  assert.ok(found.includes('invalid-cardinality'));
});

test('constitution: a canonical placement under a legacy root is reported', () => {
  const broken = clone(constitution);
  broken.documentKinds.find((k) => k.id === 'spec').placements.push({ pattern: 'docs/specs/<name>.md', cardinality: 'collection', per: 'area' });
  assert.ok(types(validateConstitution(broken, vocabulary, { repoRoot: REPO_ROOT })).includes('placement-in-forbidden-location'));
});

test('constitution: an alias to a missing kind and an alias that is also unmapped are reported', () => {
  const broken = clone(constitution);
  broken.documentTypeAliases.Zzz = 'no-such-kind';
  broken.unmappedObservedDocumentTypes.push({ value: 'Spec', files: 1, examplePath: 'x.md', reason: 'x' });
  const found = types(validateConstitution(broken, vocabulary, { repoRoot: REPO_ROOT }));
  assert.ok(found.includes('alias-to-unknown-kind'));
  assert.ok(found.includes('alias-also-unmapped'));
});

test('constitution: a gate that names a missing script is reported', () => {
  const broken = clone(constitution);
  broken.promotionGate.checks[0].enforcedBy = { kind: 'script', path: 'scripts/does-not-exist.mjs' };
  assert.ok(types(validateConstitution(broken, vocabulary, { repoRoot: REPO_ROOT })).includes('gate-script-missing'));
});

test('constitution: a planned gate without a deliverable is reported', () => {
  const broken = clone(constitution);
  broken.retirementGate.checks[1].enforcedBy = { kind: 'planned' };
  assert.ok(types(validateConstitution(broken, vocabulary, { repoRoot: REPO_ROOT })).includes('gate-missing-deliverable'));
});

test('constitution: a deferred item without a revisit trigger is reported', () => {
  const broken = clone(constitution);
  delete broken.deferredToEngine[0].revisitTrigger;
  assert.ok(types(validateConstitution(broken, vocabulary, { repoRoot: REPO_ROOT })).includes('deferred-missing-field'));
});

test('constitution: an outcome disposition outside the vocabulary and a class mismatch are reported', () => {
  const broken = clone(constitution);
  broken.authorityConflict.outcomeDispositions.push('keep-both');
  broken.classification.generated.disposition = 'promote';
  const found = types(validateConstitution(broken, vocabulary, { repoRoot: REPO_ROOT }));
  assert.ok(found.includes('unknown-disposition'));
  assert.ok(found.includes('disposition-not-allowed-for-class'));
});

test('constitution: a corpus that has no placement is reported', () => {
  const broken = clone(constitution);
  broken.corpusPlacement = broken.corpusPlacement.filter((c) => c.corpus !== 'user-knowledge');
  assert.ok(types(validateConstitution(broken, vocabulary, { repoRoot: REPO_ROOT })).includes('corpus-without-placement'));
});

test('row validator accepts a complete row and a row with typed relations', () => {
  const validate = createRowValidator(schema, vocabulary);
  assert.deepEqual(validate(validRow()), []);
  const related = validRow({
    relations: [{ type: 'duplicate-content-member', semanticClaimId: 'semantic_x', sourcePath: 'a.md', blobSha: 'abc' }],
    semanticClaimId: `semantic_${hex('1', 24)}`,
    sourceOccurrences: [{ sourceOccurrenceOrdinal: 0, path: 'a.md', role: 'canonical' }],
  });
  assert.deepEqual(validate(related), []);
});

test('row validator accepts identity gap claim ids and assigned targets', () => {
  const validate = createRowValidator(schema, vocabulary);
  assert.deepEqual(validate(validRow({ claimId: `claim_identity_gap_${hex('9', 24)}`, identityStatus: 'ambiguous-registry-gap' })), []);
  assert.deepEqual(validate(validRow({ targetOwner: 'docs/platform/x/README.md', targetAnchor: 'intro', disposition: 'promote', reviewStatus: 'pending' })), []);
});

test('row validator reports each defect with a stable reason code', () => {
  const validate = createRowValidator(schema, vocabulary);
  const missing = validRow();
  delete missing.sourceDigest;
  assert.deepEqual(validate(missing), ['missing-required:sourceDigest']);
  assert.deepEqual(validate(validRow({ sourcePath: 7 })), ['wrong-type:sourcePath']);
  assert.deepEqual(validate(validRow({ sourceId: 'src_nothex' })), ['pattern-mismatch:sourceId']);
  assert.deepEqual(validate(validRow({ claimKind: 'made-up' })), ['unknown-vocabulary-value:claimKind']);
  assert.deepEqual(validate(validRow({ disposition: 'keep-legacy' })), ['unknown-vocabulary-value:disposition']);
  assert.deepEqual(validate(validRow({ reviewStatus: 'maybe' })), ['unknown-vocabulary-value:reviewStatus']);
  assert.deepEqual(validate(validRow({ extra: true })), ['unexpected-property:extra']);
  assert.deepEqual(validate(validRow({ sourceLocation: { start: 0, end: 3 } })), ['below-minimum:sourceLocation.start']);
  assert.deepEqual(validate(validRow({ relations: [{ type: 'friends-with' }] })), ['unknown-vocabulary-value:relations[].type']);
  assert.deepEqual(validate(validRow({ decisionRefs: [''] })), ['too-short:decisionRefs[]']);
  assert.deepEqual(validate(validRow({ targetOwner: '' })), ['too-short:targetOwner']);
  assert.deepEqual(validate('not an object'), ['wrong-type:$']);
});

test('row validator requires a target owner when the disposition needs one', () => {
  const validate = createRowValidator(schema, vocabulary);
  assert.deepEqual(validate(validRow({ disposition: 'merge', reviewStatus: 'pending' })), ['missing-target-owner:merge']);
  assert.deepEqual(validate(validRow({ disposition: 'merge', reviewStatus: 'pending', targetOwner: 'docs/platform/x/README.md' })), []);
});

test('ledger summary counts valid and invalid rows, duplicate ids, usage and gaps', () => {
  const rows = [
    validRow(),
    validRow({ claimId: `claim_${hex('2', 32)}`, claimKind: 'contract', targetOwner: 'docs/platform/x/README.md', targetAnchor: 'a', disposition: 'promote', reviewStatus: 'reviewed' }),
    validRow({ claimId: `claim_${hex('3', 32)}`, claimKind: 'made-up' }),
    validRow({ claimId: `claim_${hex('2', 32)}` }),
  ];
  const summary = summarizeLedger(rows, schema, vocabulary);
  assert.equal(summary.rows, 4);
  assert.equal(summary.valid, 2);
  assert.equal(summary.invalid, 2);
  assert.deepEqual(summary.invalidByReason, { 'unknown-vocabulary-value:claimKind': 1, 'duplicate-claim-id': 1 });
  assert.equal(summary.usage.claimKinds.unclassified, 2);
  assert.equal(summary.usage.sourceDispositions.promote, 1);
  assert.deepEqual(summary.gaps, { targetOwnerEmpty: 3, targetAnchorEmpty: 3, claimKindUnclassified: 2, notReviewed: 3 });
});

test('ledger summary flags usage drift between the vocabulary and the rows', () => {
  const rows = [validRow({ disposition: 'promote', targetOwner: 'docs/platform/x/README.md', targetAnchor: 'a', reviewStatus: 'pending' })];
  const summary = summarizeLedger(rows, schema, vocabulary);
  const drift = summary.usageDrift.map((d) => `${d.section}:${d.id}:${d.declared}`);
  assert.ok(drift.includes('sourceDispositions:merge:in-use'));
  assert.ok(!drift.some((d) => d.startsWith('sourceDispositions:promote')));
  assert.ok(summary.neverUsed.sourceDispositions.includes('move'));
});

function validItem(overrides = {}) {
  return {
    path: 'docs/specs/runner.md',
    fileClass: 'maintained-authority',
    corpus: 'platform-authority',
    authorityStatus: 'legacy-current',
    proposedDisposition: 'unknown-blocking',
    claimKind: 'unclassified',
    documentType: null,
    ...overrides,
  };
}

test('item summary reports values the vocabulary or constitution does not define', () => {
  const items = [
    validItem(),
    validItem({ documentType: 'Spec' }),
    validItem({ documentType: 'Roadmap' }),
    validItem({ fileClass: 'mystery', documentType: 'Brand new type' }),
    validItem({ proposedDisposition: 'keep-legacy' }),
  ];
  const summary = summarizeItems(items, vocabulary, constitution);
  assert.equal(summary.items, 5);
  assert.deepEqual(summary.undefinedValues, {
    fileClass: { mystery: 1 },
    proposedDisposition: { 'keep-legacy': 1 },
    documentType: { 'Brand new type': 1 },
  });
  assert.equal(summary.undefinedTotal, 3);
  assert.deepEqual(summarizeItems([validItem()], vocabulary, constitution).undefinedValues, {});
});

function writeInventoryFixture(dir, rows, items = []) {
  const manifestPath = path.join(dir, 'inventory.json');
  writeShardedJsonArtifact(manifestPath, { claimLedger: rows, items });
  return manifestPath;
}

function captureCli(argv) {
  const out = [];
  const err = [];
  const origLog = console.log;
  const origErr = console.error;
  console.log = (...args) => out.push(args.join(' '));
  console.error = (...args) => err.push(args.join(' '));
  let code;
  try {
    code = runCli(argv, REPO_ROOT);
  } finally {
    console.log = origLog;
    console.error = origErr;
  }
  return { code, out: out.join('\n'), err: err.join('\n') };
}

test('cli: committed files without a ledger exit 0', () => {
  const { code, out } = captureCli(['--no-ledger']);
  assert.equal(code, 0);
  assert.match(out, /vocabulary and constitution are consistent/);
});

test('cli: invalid ledger rows are reported but exit 0; strict mode exits 1', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-constitution-'));
  try {
    const manifest = writeInventoryFixture(dir, [validRow(), validRow({ claimId: `claim_${hex('4', 32)}`, status: 'someday' })]);
    const normal = captureCli(['--inventory', manifest]);
    assert.equal(normal.code, 0);
    assert.match(normal.out, /rows: 2, valid: 1, invalid: 1/);
    assert.match(normal.out, /unknown-vocabulary-value:status/);
    const strict = captureCli(['--inventory', manifest, '--strict-rows']);
    assert.equal(strict.code, 1);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('cli: an undefined item value is reported, and fatal only in strict mode', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-constitution-'));
  try {
    const manifest = writeInventoryFixture(dir, [validRow()], [validItem({ fileClass: 'mystery' })]);
    const normal = captureCli(['--inventory', manifest]);
    assert.equal(normal.code, 0);
    assert.match(normal.out, /fileClass: mystery \(1\)/);
    assert.equal(captureCli(['--inventory', manifest, '--strict-rows']).code, 1);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('cli: --json prints one machine-readable summary', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-constitution-'));
  try {
    const manifest = writeInventoryFixture(dir, [validRow()]);
    const { code, out } = captureCli(['--inventory', manifest, '--json']);
    assert.equal(code, 0);
    const parsed = JSON.parse(out);
    assert.equal(parsed.ledger.rows, 1);
    assert.deepEqual(parsed.fatalFindings, []);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('cli: an unreadable inventory is fatal and prints how to regenerate it', () => {
  const { code, err } = captureCli(['--inventory', 'does/not/exist.json']);
  assert.equal(code, 1);
  assert.match(err, /generate-doc-inventory\.mjs/);
});

test('cli: a structurally broken vocabulary is fatal', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-constitution-'));
  try {
    const broken = clone(vocabulary);
    broken.sourceDispositions[0].allowedFileClasses = [];
    const vocabPath = path.join(dir, 'vocabulary.json');
    fs.writeFileSync(vocabPath, JSON.stringify(broken));
    const { code, err } = captureCli(['--no-ledger', '--vocabulary', vocabPath]);
    assert.equal(code, 1);
    assert.match(err, /missing-allowed-file-classes/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('row validator requires a rationale where the disposition needs one', () => {
  const validate = createRowValidator(schema, vocabulary);
  const noRationale = validRow();
  delete noRationale.rationale;
  assert.deepEqual(validate(noRationale), ['missing-rationale:unknown-blocking']);
  assert.deepEqual(validate(noRationale, { itemRationale: 'Item level reason.' }), []);
  assert.deepEqual(validate(validRow({ rationale: '' })), ['too-short:rationale', 'missing-rationale:unknown-blocking']);
  const merge = validRow({ disposition: 'merge', reviewStatus: 'pending', targetOwner: 'docs/platform/x/README.md' });
  delete merge.rationale;
  assert.deepEqual(validate(merge), []);
});

test('row validator checks the target owner against the placement rules', () => {
  const validate = createRowValidator(schema, vocabulary, constitution);
  const owned = (targetOwner) => validRow({ targetOwner, disposition: 'merge', reviewStatus: 'pending' });
  assert.deepEqual(validate(owned('docs/platform/x/README.md')), []);
  assert.deepEqual(validate(owned('docs/specs/runner.md')), ['target-owner-outside-platform:targetOwner']);
  assert.deepEqual(validate(owned('foo')), ['target-owner-outside-platform:targetOwner']);
  assert.deepEqual(validate(owned('docs/platform/nowhere.md')), ['target-owner-not-placeable:targetOwner']);
  assert.deepEqual(validate(validRow()), []);
});

test('row validator rejects a reviewed row that is still blocking', () => {
  const validate = createRowValidator(schema, vocabulary, constitution);
  assert.deepEqual(validate(validRow({ reviewStatus: 'reviewed' })), ['reviewed-while-blocking:reviewStatus']);
  const unclassified = validRow({ reviewStatus: 'reviewed', disposition: 'promote', targetOwner: 'docs/platform/x/README.md' });
  assert.deepEqual(validate(unclassified), ['reviewed-while-blocking:reviewStatus']);
  const partial = validRow({ reviewStatus: 'reviewed', disposition: 'partial-carry', claimKind: 'navigation', targetOwner: 'docs/platform/x/README.md' });
  assert.deepEqual(validate(partial), ['reviewed-while-blocking:reviewStatus']);
  const ok = validRow({ reviewStatus: 'reviewed', disposition: 'promote', claimKind: 'navigation', targetOwner: 'docs/platform/x/README.md' });
  assert.deepEqual(validate(ok), []);
});

test('placement: each path matches exactly one kind, most specific pattern first', () => {
  const kindOf = (p, header = '') => classifyPath(p, constitution, { header });
  assert.equal(kindOf('docs/platform/README.md').kind, 'platform-portal');
  assert.equal(kindOf('docs/platform/agent-coordination/README.md').kind, 'area-portal');
  assert.equal(kindOf('docs/platform/agent-coordination/verification/panel/P01/p01.md').kind, 'evidence-payload');
  assert.equal(kindOf('docs/platform/agent-coordination/verification/README.md').kind, 'collection-index');
  assert.equal(kindOf('docs/platform/agent-coordination/subcomponents/README.md').kind, 'collection-index');
  assert.equal(kindOf('docs/platform/agent-coordination/playbooks/prompts/a.md').kind, 'guide-runbook');
  assert.equal(kindOf('docs/platform/agent-coordination/roadmap/team/step-00.md').kind, 'roadmap');
  assert.equal(kindOf('docs/platform/packaging-distribution/code-panel-rollout-plan.md').kind, 'rollout-plan');
  assert.equal(kindOf('docs/platform/contracts/README.md').kind, 'contract');
  assert.equal(kindOf('docs/platform/contracts/a/b.md').kind, 'contract');
  assert.equal(kindOf('docs/history/two-layer/DISCUSSION.md').kind, 'discussion-scratchpad');
  assert.equal(kindOf('docs/history/two-layer/notes.md').kind, 'history');
  assert.equal(kindOf('docs/platform/x/r2-rollout-plan.md', 'Document type: Redirect\nAudience: x').kind, 'redirect-stub');
  assert.equal(kindOf('docs/platform/zzz.md').kind, null);
});

test('placement: equally specific patterns of different kinds are reported as ambiguous', () => {
  const rival = clone(constitution);
  rival.documentKinds.push({ id: 'rival', typeName: 'Rival', canonical: false, claimKinds: [], placements: [{ pattern: 'docs/platform/<area>/spec.md', cardinality: 'singleton', per: 'area' }] });
  const result = classifyPath('docs/platform/x/spec.md', rival);
  assert.equal(result.kind, null);
  assert.deepEqual(result.ambiguous.sort(), ['rival', 'spec']);
});

test('placement check lists leftovers and recorded exceptions', () => {
  const files = ['docs/platform/README.md', 'docs/platform/odd.md', 'docs/platform/migration-authoring-rules.md'];
  const result = checkPlacement(files, constitution, () => '');
  assert.equal(result.files, 3);
  assert.deepEqual(result.leftovers, ['docs/platform/odd.md']);
  assert.deepEqual(result.exceptions, ['docs/platform/migration-authoring-rules.md']);
  assert.deepEqual(result.ambiguous, []);
  assert.equal(result.byKind['platform-portal'], 1);
});

test('placement: every markdown file under docs/platform matches exactly one kind', () => {
  const out = captureCli(['--no-ledger', '--check-placement']);
  assert.equal(out.code, 0);
  assert.match(out.out, /placement: \d+ files, \d+ matched, 0 leftover, 0 ambiguous/);
});

test('constitution: a governance reference to a missing heading is reported', () => {
  const broken = clone(constitution);
  broken.documentKinds[0].governanceRef = '99. No Such Section';
  assert.ok(types(validateConstitution(broken, vocabulary, { repoRoot: REPO_ROOT })).includes('governance-anchor-missing'));
});

test('constitution: candidate marker, amendment rule and placement exceptions are required', () => {
  const broken = clone(constitution);
  broken.requiredMetadata.candidateMarker = 'Design status: Draft';
  delete broken.amendmentRule;
  broken.placementExceptions.push({ path: 'docs/platform/x.md' });
  const found = types(validateConstitution(broken, vocabulary, { repoRoot: REPO_ROOT }));
  assert.ok(found.includes('malformed-candidate-marker'));
  assert.ok(found.includes('missing-amendment-rule'));
  assert.ok(found.includes('malformed-exception'));
});

test('constitution: a kind with neither placements nor a marker is reported', () => {
  const broken = clone(constitution);
  broken.documentKinds.find((k) => k.id === 'redirect-stub').marker = undefined;
  assert.ok(types(validateConstitution(broken, vocabulary, { repoRoot: REPO_ROOT })).includes('missing-placement'));
});

test('constitution: retirement gate records the conservation requirements', () => {
  const ids = constitution.retirementGate.checks.map((c) => c.id);
  for (const id of ['row-set-conserved', 'one-owner-per-semantic-claim', 'cutover-mode']) assert.ok(ids.includes(id), id);
});

test('vocabulary: an amendment without evidence is reported', () => {
  const broken = clone(vocabulary);
  broken.amendments.push({ id: 'a-1', minor: 1, change: 'add a value' });
  assert.ok(types(validateVocabulary(broken)).includes('amendment-missing-evidence'));
});

test('item summary reports a disposition that its file class does not allow', () => {
  const summary = summarizeItems([validItem({ fileClass: 'unclassified', proposedDisposition: 'promote' }), validItem()], vocabulary, constitution);
  assert.equal(summary.dispositionClassMismatch.count, 1);
  assert.deepEqual(summary.dispositionClassMismatch.examples, ['docs/specs/runner.md: promote on unclassified']);
  assert.equal(summarizeItems([validItem()], vocabulary, constitution).dispositionClassMismatch.count, 0);
});

test('cli: strict mode fails on an item whose disposition its file class does not allow', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-constitution-'));
  try {
    const manifest = writeInventoryFixture(dir, [validRow()], [validItem({ fileClass: 'unclassified', proposedDisposition: 'promote' })]);
    assert.equal(captureCli(['--inventory', manifest]).code, 0);
    assert.equal(captureCli(['--inventory', manifest, '--strict-rows']).code, 1);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('cli: a row rationale may come from its inventory item', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-constitution-'));
  try {
    const row = validRow();
    delete row.rationale;
    const manifest = writeInventoryFixture(dir, [row], [validItem({ proposedRationale: 'Item level reason.' })]);
    assert.match(captureCli(['--inventory', manifest]).out, /valid: 1, invalid: 0/);
    const bare = writeInventoryFixture(dir, [row], [validItem()]);
    assert.match(captureCli(['--inventory', bare]).out, /missing-rationale:unknown-blocking/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('governance baseline fields are derived from doc-governance, not copied', () => {
  const fields = governanceBaselineFields(REPO_ROOT);
  assert.equal(fields.length, 12);
  assert.ok(fields.includes('Canonical for'));
  assert.deepEqual(constitution.requiredMetadata.promotionFields.extra, ['Supersedes', 'Superseded by']);
  assert.equal(constitution.requiredMetadata.promotionFields.governanceRef, '5. Metadata');
  assert.equal(constitution.requiredMetadata.governanceBaselineExtra, undefined);
});

test('constitution: candidate fields outside the governance baseline and bad promotion fields are reported', () => {
  const broken = clone(constitution);
  broken.requiredMetadata.candidateCore.push('Not A Governance Field');
  broken.requiredMetadata.promotionFields.extra.push('Purpose');
  const found = types(validateConstitution(broken, vocabulary, { repoRoot: REPO_ROOT }));
  assert.ok(found.includes('candidate-core-not-in-baseline'));
  assert.ok(found.includes('promotion-extra-duplicates-baseline'));
  const missing = clone(constitution);
  delete missing.requiredMetadata.promotionFields;
  assert.ok(types(validateConstitution(missing, vocabulary, { repoRoot: REPO_ROOT })).includes('malformed-promotion-fields'));
});

test('promotion report lists the fields each canonical document lacks', () => {
  const header = (fields) => `# Title\n\n\`\`\`txt\n${fields.map((f) => `${f}: x`).join('\n')}\n\`\`\`\n`;
  const all = [...governanceBaselineFields(REPO_ROOT), 'Supersedes', 'Superseded by'];
  const docs = {
    'docs/platform/README.md': header(all),
    'docs/platform/vision.md': header(constitution.requiredMetadata.candidateCore),
    'docs/platform/architecture-map.md': '# No header\n',
    'docs/platform/proposals/p.md': header(['Purpose']),
  };
  const result = checkPromotion(Object.keys(docs), constitution, (f) => docs[f], REPO_ROOT);
  assert.equal(result.canonicalDocuments, 3);
  assert.equal(result.complete, 1);
  assert.equal(result.headerless, 1);
  assert.equal(result.headeredIncomplete, 1);
  assert.equal(result.evidencePayloads, 0);
  assert.equal(result.missingByField['Canonical for'], 2);
  assert.equal(result.missingByField['Supersedes'], 2);
  assert.equal(result.missingByField['Purpose'], 1);
});

test('cli: the promotion report is informational and never fatal', () => {
  const { code, out } = captureCli(['--no-ledger', '--promotion', '--strict-rows']);
  assert.equal(code, 0);
  assert.match(out, /promotion: \d+ canonical documents, \d+ complete, \d+ headerless, \d+ headered with missing fields/);
});

test('constitution: the retirement gate requires an own reviewed rationale', () => {
  assert.ok(constitution.retirementGate.checks.map((c) => c.id).includes('reviewed-rationale'));
});

test('evidence payloads are classified by location, not by missing header', () => {
  const kindOf = (p) => classifyPath(p, constitution).kind;
  assert.equal(kindOf('docs/platform/agent-coordination/verification/panel/proofs/P01/p01.md'), 'evidence-payload');
  assert.equal(kindOf('docs/platform/agent-coordination/verification/panel/index.md'), 'evidence-payload');
  assert.equal(kindOf('docs/platform/agent-coordination/subcomponents/s/verification/run/a.md'), 'evidence-payload');
  assert.equal(kindOf('docs/platform/verification/run/a.md'), 'evidence-payload');
  assert.equal(kindOf('docs/platform/agent-coordination/verification/implementation-alignment.md'), 'verification');
  assert.equal(kindOf('docs/platform/agent-coordination/verification/README.md'), 'collection-index');
  assert.equal(kindOf('docs/platform/agent-coordination/architecture/deep/a.md'), 'architecture');
  const evidence = constitution.documentKinds.find((k) => k.id === 'evidence-payload');
  assert.equal(evidence.canonical, false);
  assert.equal(evidence.metadataExempt, true);
});

test('placement check reports evidence whose verification index is missing', () => {
  const evidence = 'docs/platform/a/verification/run/p.md';
  const owned = checkPlacement(['docs/platform/a/verification/README.md', evidence], constitution, () => '');
  assert.deepEqual(owned.evidenceWithoutOwner, []);
  const orphan = checkPlacement([evidence], constitution, () => '');
  assert.deepEqual(orphan.evidenceWithoutOwner, [evidence]);
});

test('promotion report skips evidence payloads but lists other headerless canonical files', () => {
  const docs = {
    'docs/platform/a/verification/run/p.md': '# Proof\n',
    'docs/platform/a/verification/README.md': '# Index\n',
    'docs/platform/a/architecture/x.md': '# Arch\n',
  };
  const result = checkPromotion(Object.keys(docs), constitution, (f) => docs[f], REPO_ROOT);
  assert.equal(result.canonicalDocuments, 2);
  assert.equal(result.evidencePayloads, 1);
  assert.deepEqual(result.headerlessPaths.sort(), ['docs/platform/a/architecture/x.md', 'docs/platform/a/verification/README.md']);
});

test('constitution: an evidence kind that is canonical or has no owner rule is reported', () => {
  const broken = clone(constitution);
  const evidence = broken.documentKinds.find((k) => k.id === 'evidence-payload');
  evidence.canonical = true;
  delete evidence.ownedBy;
  const found = types(validateConstitution(broken, vocabulary, { repoRoot: REPO_ROOT }));
  assert.ok(found.includes('exempt-kind-canonical'));
  assert.ok(found.includes('exempt-kind-missing-owner'));
});

test('reports are history and the verification kind is a verification record', () => {
  const kindOf = (p) => classifyPath(p, constitution).kind;
  assert.equal(kindOf('docs/platform/packaging-distribution/reports/track-closeout.md'), 'history');
  assert.equal(kindOf('docs/platform/agent-coordination/verification/implementation-alignment.md'), 'verification');
  const byId = (id) => constitution.documentKinds.find((k) => k.id === id);
  assert.equal(byId('verification').authorityClass, 'verification-record');
  assert.equal(byId('verification').canonical, true);
  assert.equal(byId('history').authorityClass, 'evidence');
  assert.equal(byId('evidence-payload').authorityClass, 'evidence');
  assert.equal(constitution.documentKinds.filter((k) => k.authorityClass === 'evidence').length, 2);
});

test('authority classes are a vocabulary section and every kind uses a defined one', () => {
  assert.ok(vocabulary.authorityClasses.some((c) => c.id === 'verification-record'));
  const broken = clone(constitution);
  broken.documentKinds[0].authorityClass = 'made-up';
  assert.ok(types(validateConstitution(broken, vocabulary, { repoRoot: REPO_ROOT })).includes('unknown-authority-class'));
});


test('the usage amendment rests on dispositions that the committed decision shards use', () => {
  const used = new Set();
  const statuses = new Set();
  for (const dir of ['pilot/decisions', 'pilot/first-round', 'pilot/second-round']) {
    const shardsDir = path.resolve(REPO_ROOT, `plans/260925-documentation-authority-unification/${dir}`);
    for (const name of fs.readdirSync(shardsDir).filter((n) => n.endsWith('.json'))) {
      for (const claim of JSON.parse(fs.readFileSync(path.join(shardsDir, name), 'utf8')).claims || []) { used.add(claim.disposition); statuses.add(claim.reviewStatus); }
    }
  }
  const inUse = vocabulary.sourceDispositions.filter((d) => d.usage === 'in-use').map((d) => d.id);
  for (const id of ['split', 'supersede', 'archive-with-reason', 'delete-as-obsolete']) assert.ok(inUse.includes(id) && used.has(id), id);
  assert.ok(statuses.has('reviewed'));
  assert.equal(vocabulary.reviewStatuses.find((r) => r.id === 'reviewed').usage, 'in-use');
});

test('the reading map stays outside docs/platform for a recorded reason', () => {
  const reading = constitution.documentKinds.find((k) => k.id === 'reading-map');
  assert.deepEqual(reading.placements.map((p) => p.pattern), ['docs/reading-map.md']);
  assert.match(reading.note, /docs\/specs\/reading-map\.md/);
});

test('cutover rows: a retained claim needs an owner, an anchor and a classified kind', () => {
  const retained = (overrides) => validRow({ disposition: 'promote', reviewStatus: 'reviewed', claimKind: 'navigation', targetOwner: 'docs/platform/x/README.md', targetAnchor: 'overview', ...overrides });
  assert.deepEqual(summarizeCutoverRows([retained()], vocabulary).byReason, {});
  assert.deepEqual(summarizeCutoverRows([retained({ targetOwner: null })], vocabulary).byReason, { 'retained-without-owner': 1 });
  assert.deepEqual(summarizeCutoverRows([retained({ targetAnchor: null })], vocabulary).byReason, { 'retained-without-anchor': 1 });
  assert.deepEqual(summarizeCutoverRows([retained({ claimKind: 'unclassified' })], vocabulary).byReason, { 'retained-with-unclassified-kind': 1 });
});

test('cutover rows: unreviewed, blocking and rationale-less rows are counted per reason', () => {
  const evidence = (overrides) => validRow({ disposition: 'retain-as-evidence', reviewStatus: 'reviewed', ...overrides });
  assert.deepEqual(summarizeCutoverRows([evidence()], vocabulary).byReason, {});
  const noRationale = evidence();
  delete noRationale.rationale;
  assert.deepEqual(summarizeCutoverRows([noRationale], vocabulary).byReason, { 'without-own-rationale': 1 });
  assert.deepEqual(summarizeCutoverRows([evidence({ reviewStatus: 'pending' })], vocabulary).byReason, { 'not-reviewed': 1 });
  const blocking = summarizeCutoverRows([validRow()], vocabulary);
  assert.deepEqual(blocking.byReason, { 'unknown-blocking': 1, 'not-reviewed': 1 });
  assert.equal(blocking.total, 2);
});

test('cli: --cutover is fatal while any row is blocking or unreviewed, and a reviewed ledger reports no cutover rows', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-constitution-'));
  try {
    const open = writeInventoryFixture(dir, [validRow()]);
    const normal = captureCli(['--inventory', open]);
    assert.equal(normal.code, 0);
    const cutover = captureCli(['--inventory', open, '--cutover']);
    assert.equal(cutover.code, 1);
    assert.match(cutover.out, /cutover rows: 2 violation\(s\)/);
    const reviewedRow = validRow({ disposition: 'retain-as-evidence', reviewStatus: 'reviewed', claimKind: 'navigation' });
    const closedDir = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-constitution-'));
    try {
      const closed = writeInventoryFixture(closedDir, [reviewedRow]);
      const result = captureCli(['--inventory', closed, '--cutover']);
      assert.match(result.out, /cutover rows: 0 violation/);
    } finally { fs.rmSync(closedDir, { recursive: true, force: true }); }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('constitution CLI merges every decision input and rejects a stale source proof', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'constitution-decisions-'));
  const write = (file, text) => {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), text);
  };
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  try {
    fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
    fs.copyFileSync(path.join(REPO_ROOT, 'docs/doc-governance.md'), path.join(root, 'docs/doc-governance.md'));
    for (const by of [...constitution.promotionGate.checks, ...constitution.retirementGate.checks].map((check) => check.enforcedBy).filter((by) => by.kind === 'script')) {
      fs.mkdirSync(path.dirname(path.join(root, by.path)), { recursive: true });
      fs.copyFileSync(path.join(REPO_ROOT, by.path), path.join(root, by.path));
    }
    const source = 'docs/specs/fixture.md';
    const target = 'docs/platform/fixture/spec.md';
    const text = '# Fixture\n\nThe consumer must preserve the documented protocol.\n\n## Errors\n\nThe consumer must report a failure rather than silently ignoring it.\n';
    write(source, text); write(target, text);
    const plan = 'plans/260925-documentation-authority-unification';
    write(plan + '/transitional-switchboard.json', JSON.stringify({ rootDocuments: [], areas: [{ area: 'Fixture', authorityStatus: 'legacy-current', entryPoint: target, canonicalRoute: source, scopedRoutes: [{ route: source, authorityStatus: 'legacy-current', fileClass: 'maintained-authority' }, { route: target, authorityStatus: 'candidate', fileClass: 'maintained-authority' }] }] }));
    git('init', '-q');
    git('config', 'user.name', 'Fixture');
    git('config', 'user.email', 'fixture@example.invalid');
    git('add', '--', 'docs', 'scripts', plan + '/transitional-switchboard.json');
    git('commit', '-qm', 'docs: add conservation fixture');
    const first = git('rev-parse', 'HEAD');
    write(IDENTITY_REGISTRY_PATH, JSON.stringify(bootstrapIdentityRegistry(root, { commit: first })));
    git('add', '--', IDENTITY_REGISTRY_PATH);
    git('commit', '-qm', 'docs: bind source identities', '--', IDENTITY_REGISTRY_PATH);
    const inventory = generateInventory(root, { commit: git('rev-parse', 'HEAD'), identityRegistryPath: path.join(root, IDENTITY_REGISTRY_PATH) });
    const rows = inventory.claimLedger.filter((row) => row.sourcePath === source);
    const manifest = path.join(root, 'inventory.json');
    writeShardedJsonArtifact(manifest, inventory);
    const base = ['--repo-root', root, '--inventory', manifest, '--json', '--cutover'];
    const before = JSON.parse(captureCli(base).out);
    const midpoint = Math.ceil(rows.length / 2);
    const files = [rows.slice(0, midpoint), rows.slice(midpoint)].map((part, i) => {
      const file = path.join(root, 'decision-' + i + '.json');
      fs.writeFileSync(file, JSON.stringify({ version: 1, shard: 'fixture-' + i, authorSession: 'fixture-session:author@2026-10-07', authorshipRequired: true, sources: [source], claims: part.map((row) => ({ claimId: row.claimId, sourceUnitDigest: row.sourceUnitDigest, targetOwner: target, targetAnchor: row.sourceAnchor, targetUnitDigest: row.sourceUnitDigest, claimKind: 'specification', disposition: 'promote', reviewStatus: 'pending', rationale: 'The target retains the entire protocol unit.', authoredBy: 'fixture-session:author@2026-10-07' })) }));
      return file;
    });
    const after = JSON.parse(captureCli([...base, ...files.flatMap((file) => ['--decisions', file])]).out);
    assert.deepEqual(after.fatalFindings, []);
    assert.equal(after.ledger.cutover.byReason['unknown-blocking'], before.ledger.cutover.byReason['unknown-blocking'] - rows.length);
    assert.equal(after.ledger.usage.sourceDispositions.promote, (before.ledger.usage.sourceDispositions.promote || 0) + rows.length);
    const stale = JSON.parse(fs.readFileSync(files[1], 'utf8'));
    stale.claims[0].sourceUnitDigest = 'f'.repeat(64);
    fs.writeFileSync(files[1], JSON.stringify(stale));
    const rejected = captureCli([...base, ...files.flatMap((file) => ['--decisions', file])]);
    assert.equal(rejected.code, 1);
    assert.ok(JSON.parse(rejected.out).fatalFindings.some((finding) => finding.type === 'decision-digest-stale'));
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
