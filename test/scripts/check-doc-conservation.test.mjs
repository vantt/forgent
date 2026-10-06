import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

import * as gates from '../../scripts/check-doc-inventory-gates.mjs';
import * as generator from '../../scripts/generate-doc-inventory.mjs';
import { writeShardedJsonArtifact } from '../../scripts/doc-inventory-artifact.mjs';
import { checkRatchet, generateBaseline } from '../../scripts/check-legacy-docs-ratchet.mjs';

const PLAN_DIR = 'plans/260925-documentation-authority-unification';
const VOCABULARY = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, `../../${PLAN_DIR}/claim-and-disposition-vocabulary.json`), 'utf8'));

const SWITCHBOARD = {
  rootDocuments: [],
  areas: [
    {
      area: 'Runner / dispatch / merge lifecycle',
      authorityStatus: 'legacy-current',
      currentRoutes: [{ scope: 'runner', route: 'docs/specs/runner.md', authorityStatus: 'legacy-current', role: 'Owns the runner loop' }],
    },
    {
      area: 'Agent coordination',
      authorityStatus: 'promoted',
      entryPoint: 'docs/platform/agent-coordination/README.md',
      canonicalRoutes: ['docs/platform/agent-coordination/README.md'],
      currentRoutes: [{ scope: 'portal', route: 'docs/platform/agent-coordination/README.md', authorityStatus: 'promoted', role: 'Portal' }],
    },
  ],
};

const row = (overrides = {}) => ({
  claimId: 'claim_a',
  sourcePath: 'docs/specs/runner.md',
  sourceAnchor: 'a',
  targetOwner: null,
  disposition: 'retain-as-evidence',
  reviewStatus: 'pending',
  ...overrides,
});

// ---- rejections: one test per rule -----------------------------------------

test('row-set conservation rejects a previous claim id that is neither live, gap nor retired', () => {
  const previous = { units: [{ claimId: 'claim_a', sourcePath: 'docs/a.md', sourceAnchor: 'a' }, { claimId: 'claim_b', sourcePath: 'docs/a.md', sourceAnchor: 'b' }, { claimId: 'claim_c', sourcePath: 'docs/a.md', sourceAnchor: 'c' }, { claimId: 'claim_d', sourcePath: 'docs/a.md', sourceAnchor: 'd' }] };
  const current = { units: [{ claimId: 'claim_a' }], retiredUnits: [{ claimId: 'claim_b' }], identityGaps: [{ claimId: 'claim_c' }] };
  const findings = gates.validateRowSetConservation(current, previous);
  assert.deepEqual(findings.map((f) => f.type), ['claim-id-not-conserved']);
  assert.match(findings[0].message, /claim_d/);
  assert.deepEqual(gates.validateRowSetConservation(current, null), []);
});

test('two different target owners on one semantic claim are rejected, one shared owner is accepted', () => {
  const owners = (a, b) => [row({ claimId: 'c1', semanticClaimId: 'semantic_x', targetOwner: a }), row({ claimId: 'c2', semanticClaimId: 'semantic_x', targetOwner: b }), row({ claimId: 'c3', semanticClaimId: 'semantic_x', targetOwner: null })];
  const bad = gates.validateSemanticClaimOwners(owners('docs/platform/a/README.md', 'docs/platform/b/README.md'));
  assert.deepEqual(bad.map((f) => f.type), ['semantic-claim-multiple-owners']);
  assert.deepEqual(gates.validateSemanticClaimOwners(owners('docs/platform/a/README.md', 'docs/platform/a/README.md')), []);
});

test('a claim row without a disposition or with one outside the vocabulary is rejected', () => {
  const findings = gates.validateClaimDispositions([row({ claimId: 'c1', disposition: '' }), row({ claimId: 'c2', disposition: 'keep-legacy' }), row({ claimId: 'c3' })], VOCABULARY);
  assert.deepEqual(findings.map((f) => f.type).sort(), ['claim-disposition-missing', 'claim-disposition-unknown']);
});

test('a disposition that requires a target owner is rejected without one, for every such disposition', () => {
  const needing = VOCABULARY.sourceDispositions.filter((d) => d.requiresTargetOwner).map((d) => d.id);
  assert.ok(needing.includes('supersede') && needing.includes('promote'));
  for (const disposition of needing) {
    const findings = gates.validateClaimDispositions([row({ disposition, targetOwner: null })], VOCABULARY);
    assert.deepEqual(findings.map((f) => f.type), ['claim-target-owner-missing'], disposition);
    assert.deepEqual(gates.validateClaimDispositions([row({ disposition, targetOwner: 'docs/platform/a/README.md' })], VOCABULARY), [], disposition);
  }
  const notNeeding = VOCABULARY.sourceDispositions.filter((d) => !d.requiresTargetOwner).map((d) => d.id);
  for (const disposition of notNeeding) assert.deepEqual(gates.validateClaimDispositions([row({ disposition })], VOCABULARY), [], disposition);
});

test('legacy growth reported by the ratchet becomes a conservation finding', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'conservation-ratchet-'));
  try {
    fs.mkdirSync(path.join(tmp, 'docs/specs'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'docs/specs/a.md'), '# A\n\nBody.\n');
    const baseline = generateBaseline({ repoRoot: tmp });
    assert.deepEqual(gates.validateLegacyGrowth(checkRatchet({ repoRoot: tmp, baseline })), []);
    fs.writeFileSync(path.join(tmp, 'docs/specs/new.md'), '# New\n\nUnreviewed growth.\n');
    const findings = gates.validateLegacyGrowth(checkRatchet({ repoRoot: tmp, baseline }));
    assert.equal(findings.length, 1);
    assert.match(findings[0].type, /^legacy-growth-/);
    assert.equal(findings[0].path, 'docs/specs/new.md');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('checkConservation separates fatal invariants from open data', () => {
  const inventory = { items: [{ path: 'docs/specs/runner.md', proposedDisposition: 'unknown-blocking' }], claimLedger: [row({ disposition: 'unknown-blocking', reviewStatus: 'blocking' })] };
  const registry = { units: [{ claimId: 'claim_a' }], identityGaps: [{ claimId: 'g', sourcePath: 'docs/a.md', sourceAnchor: 'g' }], retiredUnits: [{ claimId: 'r', sourcePath: 'docs/a.md', sourceAnchor: 'r', disposition: 'delete-as-obsolete' }] };
  const dropped = { entries: [{ id: 'dropped-x' }] };
  assert.equal(gates.checkConservation({ inventory, registry: { units: [{ claimId: 'claim_a' }] }, previousRegistries: [{ registry: { units: [{ claimId: 'claim_gone', sourcePath: 'docs/a.md', sourceAnchor: 'x' }] }, label: 'the sealed registry' }], vocabulary: VOCABULARY }).invariant[0].type, 'claim-id-not-conserved');
  const result = gates.checkConservation({ inventory, registry, previousRegistries: [{ registry: { units: [{ claimId: 'claim_a' }] }, label: 'the sealed registry' }], vocabulary: VOCABULARY, droppedClaimsRegister: dropped });
  assert.deepEqual(result.invariant, []);
  assert.deepEqual(result.open.map((o) => o.type).sort(), ['claims-not-reviewed', 'claims-unknown-blocking', 'claims-without-own-rationale', 'dropped-claims-unreviewed', 'files-unknown-blocking', 'registry-gaps-without-disposition', 'retired-rows-incomplete']);
  const reviewed = { entries: [{ id: 'dropped-x', reviewedDisposition: { decision: 'restoration-owner-named', reviewer: 'owner', reviewedAt: '2026-10-06' } }] };
  const clean = gates.checkConservation({ inventory: { items: [], claimLedger: [row({ reviewStatus: 'reviewed', rationale: 'kept as evidence' })] }, registry: { units: [{ claimId: 'claim_a' }] }, vocabulary: VOCABULARY, droppedClaimsRegister: reviewed });
  assert.deepEqual(clean, { invariant: [], open: [] });
});

// ---- registry binding to a commit with an identical in-scope tree -----------

function makeRepo() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'conservation-repo-'));
  const git = (...args) => execFileSync('git', args, { cwd: tmp, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  git('init');
  git('config', 'user.email', 't@example.test');
  git('config', 'user.name', 'Test');
  const write = (rel, content) => { fs.mkdirSync(path.dirname(path.join(tmp, rel)), { recursive: true }); fs.writeFileSync(path.join(tmp, rel), content); };
  write(`${PLAN_DIR}/transitional-switchboard.json`, JSON.stringify(SWITCHBOARD));
  write(`${PLAN_DIR}/shipped-path-conventions-inventory.json`, JSON.stringify({ entries: [] }));
  write(`${PLAN_DIR}/claim-and-disposition-vocabulary.json`, JSON.stringify(VOCABULARY));
  return {
    tmp,
    write,
    commit(message) { git('add', '.'); git('commit', '-m', message); return git('rev-parse', 'HEAD'); },
    registryPath: path.join(tmp, generator.IDENTITY_REGISTRY_PATH),
    cleanup() { fs.rmSync(tmp, { recursive: true, force: true }); },
  };
}

const BODY = 'Payload with enough detail to be conserved by the inventory.';

test('a registry stays bound to later commits that change nothing in scope, and to none that do', () => {
  const repo = makeRepo();
  try {
    repo.write('docs/specs/runner.md', `# Runner\n\n${BODY}\n`);
    const base = repo.commit('base');
    repo.write(`${PLAN_DIR}/reports/anything.md`, 'out of scope\n');
    repo.write('src/other.mjs', 'export {};\n');
    const outOfScope = repo.commit('out of scope only');
    repo.write('docs/specs/runner.md', `# Runner\n\n${BODY}\n\nMore.\n`);
    const inScope = repo.commit('docs change');
    assert.equal(generator.registryBindsToCommit(base, base, repo.tmp), true);
    assert.equal(generator.registryBindsToCommit(base, outOfScope, repo.tmp), true);
    assert.equal(generator.registryBindsToCommit(base, inScope, repo.tmp), false);
    assert.equal(generator.registryBindsToCommit('0'.repeat(40), inScope, repo.tmp), false);
    assert.equal(generator.registryBindsToCommit(null, inScope, repo.tmp), false);
    repo.write(`${PLAN_DIR}/transitional-switchboard.json`, JSON.stringify({ ...SWITCHBOARD, rootDocuments: [{ path: 'docs/backlog.md', authorityStatus: 'non-authority', fileClass: 'generated', role: 'Backlog projection' }] }));
    const switchboardChange = repo.commit('switchboard change');
    assert.equal(generator.registryBindsToCommit(inScope, switchboardChange, repo.tmp), false);
  } finally { repo.cleanup(); }
});

test('generation and the gates accept a registry bound to an earlier commit with the same in-scope tree', () => {
  const repo = makeRepo();
  try {
    repo.write('docs/specs/runner.md', `# Runner\n\n${BODY}\n`);
    const base = repo.commit('base');
    const registry = generator.bootstrapIdentityRegistry(repo.tmp, { commit: base });
    fs.mkdirSync(path.dirname(repo.registryPath), { recursive: true });
    fs.writeFileSync(repo.registryPath, JSON.stringify(registry));
    const registryCommit = repo.commit('commit the registry');
    const inventory = generator.generateInventory(repo.tmp, { commit: registryCommit, identityRegistryPath: repo.registryPath });
    assert.equal(inventory.commit, registryCommit);
    assert.equal(inventory.identityRegistry.commit, base);
    assert.deepEqual(gates.validateIdentityRegistry(inventory, registry, { repoRoot: repo.tmp }), []);
    assert.equal(gates.validateIdentityRegistry(inventory, registry).some((f) => f.type === 'identity-registry-commit-mismatch'), true);

    repo.write('docs/specs/runner.md', `# Runner\n\n${BODY}\n\nEdited.\n`);
    const edited = repo.commit('docs change');
    assert.throws(() => generator.generateInventory(repo.tmp, { commit: edited, identityRegistryPath: repo.registryPath }), new RegExp(`--refresh --commit ${edited}`));
  } finally { repo.cleanup(); }
});

test('refresh reuses a bound registry and carries identity forward when the in-scope tree changed', () => {
  const repo = makeRepo();
  const log = console.log;
  console.log = () => {};
  try {
    repo.write('docs/specs/runner.md', `# Runner\n\n${BODY}\n`);
    const base = repo.commit('base');
    const registry = generator.bootstrapIdentityRegistry(repo.tmp, { commit: base });
    fs.mkdirSync(path.dirname(repo.registryPath), { recursive: true });
    fs.writeFileSync(repo.registryPath, JSON.stringify(registry));
    const registryCommit = repo.commit('commit the registry');
    const originalIds = registry.units.map((u) => u.claimId);

    assert.equal(generator.runCli(['--refresh', '--commit', registryCommit], repo.tmp), 0);
    assert.equal(JSON.parse(fs.readFileSync(repo.registryPath, 'utf8')).commit, base, 'a bound registry is not rewritten');
    assert.equal(fs.existsSync(path.join(repo.tmp, generator.INVENTORY_MANIFEST_PATH)), true);
    assert.equal(fs.existsSync(path.join(repo.tmp, generator.INVENTORY_MANIFEST_PATH.replace(/\.json$/, '.md'))), true);

    repo.write('docs/specs/other.md', `# Other\n\nUnrelated ${BODY}\n`);
    const added = repo.commit('add a document');
    assert.equal(generator.runCli(['--refresh', '--commit', added], repo.tmp), 0);
    const carried = JSON.parse(fs.readFileSync(repo.registryPath, 'utf8'));
    assert.equal(carried.commit, added);
    assert.equal(carried.carriedFromCommit, base);
    for (const id of originalIds) assert.ok(carried.units.some((u) => u.claimId === id), `claim id ${id} is kept`);
    assert.equal(carried.units.length, originalIds.length + carried.units.filter((u) => u.sourcePath === 'docs/specs/other.md').length);
    assert.ok(carried.units.some((u) => u.sourcePath === 'docs/specs/other.md'));
  } finally { console.log = log; repo.cleanup(); }
});

// ---- the gates CLI end to end ----------------------------------------------

test('gates CLI: open conservation data is reported by default and fatal in strict mode; a lost claim id is always fatal', () => {
  const repo = makeRepo();
  const log = console.log;
  const err = console.error;
  const out = [];
  const errs = [];
  try {
    repo.write('docs/specs/runner.md', `# Runner\n\n${BODY}\n`);
    const base = repo.commit('base');
    const registry = generator.bootstrapIdentityRegistry(repo.tmp, { commit: base });
    fs.mkdirSync(path.dirname(repo.registryPath), { recursive: true });
    fs.writeFileSync(repo.registryPath, JSON.stringify(registry));
    const registryCommit = repo.commit('commit the registry');
    assert.equal(generator.runCli(['--refresh', '--commit', registryCommit], repo.tmp), 0);

    console.log = (...a) => out.push(a.join(' '));
    console.error = (...a) => errs.push(a.join(' '));
    assert.equal(gates.runCli([], repo.tmp), 0, errs.join('\n'));
    assert.match(out.join('\n'), /open conservation data/);
    assert.match(out.join('\n'), /claims-not-reviewed/);

    errs.length = 0;
    assert.equal(gates.runCli(['--strict'], repo.tmp), 1);
    assert.match(errs.join('\n'), /\[claims-not-reviewed\]/);
    assert.equal(gates.runCli(['--cutover'], repo.tmp), 1);

    // A previous registry holding a claim id that the current registry lost.
    const previous = { ...registry, units: [...registry.units, { ...registry.units[0], claimId: 'claim_lost', sourceAnchor: 'lost' }] };
    const previousPath = path.join(repo.tmp, 'previous-registry.json');
    fs.writeFileSync(previousPath, JSON.stringify(previous));
    errs.length = 0;
    assert.equal(gates.runCli(['--previous-registry', previousPath], repo.tmp), 1);
    assert.match(errs.join('\n'), /\[claim-id-not-conserved\].*claim_lost/);
  } finally { console.log = log; console.error = err; repo.cleanup(); }
});

test('gates CLI names the refresh command with the current commit when the shards are missing', () => {
  const repo = makeRepo();
  const err = console.error;
  const errs = [];
  try {
    repo.write('docs/specs/runner.md', `# Runner\n\n${BODY}\n`);
    const head = repo.commit('base');
    const manifest = path.join(repo.tmp, generator.INVENTORY_MANIFEST_PATH);
    fs.mkdirSync(path.dirname(manifest), { recursive: true });
    writeShardedJsonArtifact(manifest, { items: [] });
    fs.rmSync(manifest.replace(/\.json$/, '.parts'), { recursive: true, force: true });
    console.error = (...a) => errs.push(a.join(' '));
    assert.equal(gates.runCli([], repo.tmp), 1);
    assert.match(errs.join('\n'), new RegExp(`generate-doc-inventory\\.mjs --refresh --commit ${head} `));
    assert.doesNotMatch(errs.join('\n'), /<commit>/);
  } finally { console.error = err; repo.cleanup(); }
});

// ---- review round: inputs, retired rows, identical units, anchors ----------

test('a retired row without a vocabulary disposition is not a recorded removal', () => {
  const registry = { units: [], retiredUnits: [{ claimId: 'r1', sourcePath: 'docs/a.md', sourceAnchor: 'a', status: 'removed-pending-disposition' }, { claimId: 'r2', sourcePath: 'docs/a.md', sourceAnchor: 'b', disposition: 'delete-as-obsolete' }] };
  const findings = gates.validateRetiredRowDispositions(registry, VOCABULARY);
  assert.deepEqual(findings.map((f) => f.type), ['retired-row-disposition-missing']);
  assert.match(findings[0].message, /r1/);
  assert.deepEqual(gates.checkConservation({ inventory: { claimLedger: [] }, registry, vocabulary: VOCABULARY }).invariant.map((f) => f.type), ['retired-row-disposition-missing']);
});

test('identical source units that name different owners are reported as open data', () => {
  const claims = [row({ claimId: 'c1', sourcePath: 'docs/a.md', sourceUnitDigest: 'd1', targetOwner: 'docs/platform/a/README.md' }), row({ claimId: 'c2', sourcePath: 'docs/b.md', sourceUnitDigest: 'd1', targetOwner: 'docs/platform/b/README.md' }), row({ claimId: 'c3', sourcePath: 'docs/c.md', sourceUnitDigest: 'd2', targetOwner: 'docs/platform/a/README.md' })];
  const open = gates.summarizeConservationCompleteness({ inventory: { items: [], claimLedger: claims }, registry: {}, vocabulary: VOCABULARY });
  assert.equal(open.find((o) => o.type === 'identical-units-multiple-owners').count, 1);
});

test('the inventory must describe the current tree and the registry on disk', () => {
  const repo = makeRepo();
  try {
    repo.write('docs/specs/runner.md', `# Runner\n\n${BODY}\n`);
    const base = repo.commit('base');
    repo.write('docs/specs/runner.md', `# Runner\n\n${BODY}\n\nEdited.\n`);
    const head = repo.commit('edit');
    const stale = gates.validateInventoryFreshness({ inventory: { commit: base }, headCommit: head, repoRoot: repo.tmp });
    assert.deepEqual(stale.map((f) => f.type), ['inventory-stale']);
    assert.match(stale[0].message, new RegExp(`--refresh --commit ${head}`));
    assert.deepEqual(gates.validateInventoryFreshness({ inventory: { commit: head }, headCommit: head, repoRoot: repo.tmp }), []);
    const bytes = Buffer.from('{"documents":[]}');
    const sha = crypto.createHash('sha256').update(bytes).digest('hex');
    assert.deepEqual(gates.validateInventoryFreshness({ inventory: { commit: head, identityRegistry: { sha256: sha } }, headCommit: head, repoRoot: repo.tmp, registryBytes: bytes }), []);
    assert.deepEqual(gates.validateInventoryFreshness({ inventory: { commit: head, identityRegistry: { sha256: sha } }, headCommit: head, repoRoot: repo.tmp, registryBytes: Buffer.from('{}') }).map((f) => f.type), ['identity-registry-digest-mismatch']);
  } finally { repo.cleanup(); }
});

test('a targetAnchor is checked against the headings of the target document at the inventory commit', () => {
  const repo = makeRepo();
  try {
    repo.write('docs/platform/agent-coordination/README.md', '# Agent Coordination\n\n## Real Section\n\nBody text that is long enough to count as a block.\n');
    const commit = repo.commit('target');
    const lookup = gates.buildTargetAnchorLookup(repo.tmp, commit);
    assert.equal(lookup('docs/platform/agent-coordination/README.md').has('real-section'), true);
    assert.equal(lookup('docs/platform/agent-coordination/README.md').has('missing-section'), false);
    assert.equal(lookup('docs/platform/no-such.md'), null);
    const inventory = { items: [{ path: 'docs/specs/runner.md', proposedDisposition: 'merge', proposedTargetOwner: 'docs/platform/agent-coordination/README.md', fileClass: 'maintained-authority' }], claimLedger: [row({ disposition: 'merge', targetOwner: 'docs/platform/agent-coordination/README.md', targetAnchor: 'real-section', sourceId: 's', sourceDigest: 'x', claimKind: 'specification', authorityKind: 'legacy-current', status: 'current', relations: [] })] };
    const owners = new Set(['docs/platform/agent-coordination/README.md']);
    assert.deepEqual(gates.validateAgainstVocabulary(inventory, VOCABULARY, owners, { targetAnchorsOf: lookup }).map((f) => f.type), []);
    inventory.claimLedger[0].targetAnchor = 'missing-section';
    assert.deepEqual(gates.validateAgainstVocabulary(inventory, VOCABULARY, owners, { targetAnchorsOf: lookup }).map((f) => f.type), ['retained-claim-target-anchor-missing']);
  } finally { repo.cleanup(); }
});

test('gates CLI strict mode refuses to run without its conservation inputs, and a stale inventory is always fatal', () => {
  const repo = makeRepo();
  const log = console.log;
  const err = console.error;
  const errs = [];
  try {
    repo.write('docs/specs/runner.md', `# Runner\n\n${BODY}\n`);
    const base = repo.commit('base');
    const registry = generator.bootstrapIdentityRegistry(repo.tmp, { commit: base });
    fs.mkdirSync(path.dirname(repo.registryPath), { recursive: true });
    fs.writeFileSync(repo.registryPath, JSON.stringify(registry));
    const registryCommit = repo.commit('commit the registry');
    console.log = () => {};
    assert.equal(generator.runCli(['--refresh', '--commit', registryCommit], repo.tmp), 0);
    console.error = (...a) => errs.push(a.join(' '));
    assert.equal(gates.runCli([], repo.tmp), 0, errs.join('\n'));
    errs.length = 0;
    assert.equal(gates.runCli(['--strict'], repo.tmp), 1);
    assert.match(errs.join('\n'), /\[conservation-input-missing\] strict mode needs the sealed registry/);
    assert.match(errs.join('\n'), /\[conservation-input-missing\] strict mode needs the legacy-docs ratchet/);
    errs.length = 0;
    assert.equal(gates.runCli(['--previous-registry', 'no-such-registry.json'], repo.tmp), 1);
    assert.match(errs.join('\n'), /error loading input/);

    repo.write('docs/specs/runner.md', `# Runner\n\n${BODY}\n\nEdited after the inventory.\n`);
    repo.commit('edit docs');
    errs.length = 0;
    assert.equal(gates.runCli([], repo.tmp), 1);
    assert.match(errs.join('\n'), /\[inventory-stale\]/);
  } finally { console.log = log; console.error = err; repo.cleanup(); }
});

// ---- reviewed decision shards ----------------------------------------------

const DECIDED_CLAIM_ID = `claim_${'a'.repeat(32)}`;
const OWNER = 'docs/platform/a/README.md';
const DIGEST = '0123456789abcdef'.repeat(4);

function decisionInventory() {
  return {
    commit: 'c0ffee',
    items: [
      { path: 'docs/specs/runner.md', proposedDisposition: 'unknown-blocking', proposedRationale: null, proposedTargetOwner: null, authorityStatus: 'legacy-current' },
      { path: OWNER, proposedDisposition: 'retain-as-evidence', authorityStatus: 'promoted' },
      { path: 'docs/platform/cand/README.md', proposedDisposition: 'retain-as-evidence', authorityStatus: 'candidate' },
    ],
    claimLedger: [
      { claimId: DECIDED_CLAIM_ID, sourcePath: 'docs/specs/runner.md', sourceAnchor: 'a', sourceUnitDigest: DIGEST, targetOwner: null, targetAnchor: null, claimKind: 'unclassified', disposition: 'unknown-blocking', reviewStatus: 'blocking' },
    ],
  };
}
const anchorsOf = (owner) => (owner === OWNER ? new Set(['intro']) : null);
const goodDecision = () => ({ claimId: DECIDED_CLAIM_ID, sourceUnitDigest: DIGEST.slice(0, 16), targetOwner: OWNER, targetAnchor: 'intro', claimKind: 'specification', disposition: 'move', reviewStatus: 'pending', rationale: 'moved to the platform owner' });
const goodShard = (claims = [goodDecision()], extra = {}) => ({ version: 1, shard: 'one', sources: ['docs/specs/runner.md'], claims, ...extra });
const decide = (shards, inventory = decisionInventory()) => gates.applyDecisions(inventory, shards, { vocabulary: VOCABULARY, targetAnchorsOf: anchorsOf });

test('a clean decision merges onto its claim row without mutating the input inventory', () => {
  const inventory = decisionInventory();
  const before = JSON.stringify(inventory);
  const shard = goodShard([{ ...goodDecision(), reviewStatus: 'reviewed', reviewedBy: 'rev', reviewedAt: '2026-10-06', searched: ['grep x'] }]);
  const result = decide([shard], inventory);
  assert.deepEqual(result.findings, []);
  assert.equal(JSON.stringify(inventory), before);
  const merged = result.inventory.claimLedger[0];
  assert.deepEqual({ ...merged }, { ...inventory.claimLedger[0], targetOwner: OWNER, targetAnchor: 'intro', claimKind: 'specification', disposition: 'move', reviewStatus: 'reviewed', rationale: 'moved to the platform owner', reviewedBy: 'rev', reviewedAt: '2026-10-06', searched: ['grep x'] });
  assert.notEqual(result.inventory.claimLedger[0], inventory.claimLedger[0]);
  assert.notEqual(result.inventory.items, inventory.items);
});

test('a decision on a claim that is a registry identity gap gives the gap row its disposition without touching the registry', () => {
  const registry = { identityGaps: [{ claimId: DECIDED_CLAIM_ID, sourcePath: 'docs/specs/runner.md', sourceAnchor: 'a' }, { claimId: `claim_${'c'.repeat(32)}`, sourcePath: 'docs/specs/runner.md', sourceAnchor: 'b' }] };
  const before = JSON.stringify(registry);
  const result = gates.applyDecisions(decisionInventory(), [goodShard()], { vocabulary: VOCABULARY, targetAnchorsOf: anchorsOf, registry });
  assert.deepEqual(result.findings, []);
  assert.equal(JSON.stringify(registry), before);
  assert.deepEqual(result.registry.identityGaps.map((row) => row.disposition), ['move', undefined]);
  assert.equal(gates.applyDecisions(decisionInventory(), [goodShard()], { vocabulary: VOCABULARY, targetAnchorsOf: anchorsOf }).registry, null);
});

test('a file decision replaces the proposed disposition, rationale and target owner of its item', () => {
  const inventory = decisionInventory();
  const files = [{ path: 'docs/specs/runner.md', disposition: 'move', rationale: 'carried by the platform owner', targets: [OWNER, 'docs/platform/cand/README.md'] }, { path: OWNER, disposition: 'retain-as-evidence', rationale: 'kept', targets: [] }];
  const result = decide([goodShard([], { files })], inventory);
  assert.deepEqual(result.findings, []);
  const item = result.inventory.items.find((i) => i.path === 'docs/specs/runner.md');
  assert.deepEqual([item.proposedDisposition, item.proposedRationale, item.proposedTargetOwner], ['move', 'carried by the platform owner', OWNER]);
  assert.equal(result.inventory.items.find((i) => i.path === OWNER).proposedTargetOwner, null);
  assert.equal(inventory.items[0].proposedDisposition, 'unknown-blocking');
});

const DECISION_FAULTS = [
  ['decision-claim-unknown', (d) => { d.claimId = `claim_${'b'.repeat(32)}`; }],
  ['decision-claim-outside-sources', (d, shard) => { shard.sources = ['docs/other.md']; }],
  ['decision-digest-stale', (d) => { d.sourceUnitDigest = 'f'.repeat(16); }],
  ['decision-digest-stale', (d) => { d.sourceUnitDigest = DIGEST.slice(0, 8); }],
  ['decision-disposition-invalid', (d) => { d.disposition = 'keep-legacy'; }],
  ['decision-claim-kind-invalid', (d) => { d.claimKind = 'musing'; }],
  ['decision-review-status-invalid', (d) => { d.reviewStatus = 'done'; }],
  ['decision-target-owner-missing', (d) => { d.targetOwner = null; d.targetAnchor = null; }],
  ['decision-target-owner-missing', (d) => { d.targetOwner = 'docs/nowhere.md'; }],
  ['decision-target-anchor-missing', (d) => { d.targetAnchor = null; }],
  ['decision-target-anchor-missing', (d) => { d.targetAnchor = 'nope'; }],
  ['decision-target-anchor-missing', (d) => { d.targetOwner = 'docs/specs/runner.md'; }],
  ['decision-reviewed-incomplete', (d) => { d.reviewStatus = 'reviewed'; d.reviewedAt = '2026-10-06'; }],
  ['decision-reviewed-incomplete', (d) => { d.reviewStatus = 'reviewed'; d.reviewedBy = 'rev'; }],
  ['decision-blocking-status-mismatch', (d) => { d.disposition = 'unknown-blocking'; d.targetOwner = null; d.targetAnchor = null; d.searched = ['grep x']; }],
  ['decision-searched-missing', (d) => { d.disposition = 'unknown-blocking'; d.reviewStatus = 'blocking'; d.targetOwner = null; d.targetAnchor = null; }],
  ['decision-searched-missing', (d) => { d.disposition = 'delete-as-obsolete'; d.targetOwner = null; d.targetAnchor = null; d.searched = []; }],
  ['decision-rationale-missing', (d) => { d.rationale = ''; }],
  ['decision-target-owner-missing', (d) => { d.disposition = 'retain-as-evidence'; d.targetOwner = 'docs/specs/runner.md'; d.targetAnchor = 'a'; }],
  ['decision-target-anchor-missing', (d) => { d.disposition = 'delete-as-obsolete'; d.targetOwner = null; d.targetAnchor = 'a'; d.searched = ['grep x']; }],
];

test('each rule violated by a claim decision is reported with its own finding type', () => {
  for (const [type, mutate] of DECISION_FAULTS) {
    const decision = goodDecision();
    const shard = goodShard([decision]);
    mutate(decision, shard);
    const findings = decide([shard]).findings;
    const hit = findings.find((f) => f.type === type);
    assert.ok(hit, `${type}: got ${JSON.stringify(findings.map((f) => f.type))}`);
    assert.match(hit.message, /claim_|docs\//, type);
  }
});

test('a claim decided twice, in one shard or across shards, is reported once as a duplicate', () => {
  const inOne = decide([goodShard([goodDecision(), goodDecision()])]).findings;
  assert.deepEqual(inOne.map((f) => f.type), ['decision-claim-duplicate']);
  const across = decide([goodShard(), { ...goodShard(), shard: 'two' }]).findings;
  assert.deepEqual(across.map((f) => f.type), ['decision-claim-duplicate']);
  assert.match(across[0].message, new RegExp(DECIDED_CLAIM_ID));
});

test('file decisions naming an unknown path or violating the vocabulary are reported', () => {
  const faults = [
    ['decision-file-unknown', { path: 'docs/nowhere.md', disposition: 'retain-as-evidence', rationale: 'kept', targets: [] }],
    ['decision-file-invalid', { path: OWNER, disposition: 'keep-legacy', rationale: 'kept', targets: [] }],
    ['decision-file-invalid', { path: OWNER, disposition: 'move', rationale: 'moved', targets: [] }],
    ['decision-file-invalid', { path: OWNER, disposition: 'retain-as-evidence', rationale: '', targets: [] }],
  ];
  for (const [type, file] of faults) {
    const findings = decide([goodShard([], { files: [file] })]).findings;
    assert.deepEqual(findings.map((f) => f.type), [type], JSON.stringify(file));
  }
});

test('with decisions, a decided owner that is a promoted or candidate platform document counts as a valid target owner', () => {
  const inventory = decisionInventory();
  inventory.commit = null;
  const decision = { ...goodDecision(), targetOwner: 'docs/platform/cand/README.md' };
  const merged = decide([goodShard([decision])], inventory).inventory;
  assert.ok(gates.validateAgainstVocabulary(merged, VOCABULARY, new Set()).some((f) => f.type === 'retained-claim-owner-not-switchboard-backed'));
  assert.equal(gates.decidedPlatformOwners(merged, [goodShard([decision])]).has('docs/platform/cand/README.md'), true);
  assert.equal(gates.decidedPlatformOwners(merged, [goodShard([{ ...decision, targetOwner: 'docs/specs/runner.md' }])]).size, 0);
});

test('loadDecisionShards reads one file or a directory in name order and rejects malformed input', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'decision-shards-'));
  try {
    const put = (name, value) => fs.writeFileSync(path.join(tmp, name), typeof value === 'string' ? value : JSON.stringify(value));
    put('b.json', goodShard([], { shard: 'b' }));
    put('a.json', goodShard([], { shard: 'a' }));
    put('notes.txt', 'ignored');
    assert.deepEqual(gates.loadDecisionShards(tmp).map((s) => s.shard), ['a', 'b']);
    assert.deepEqual(gates.loadDecisionShards(path.join(tmp, 'b.json')).map((s) => s.shard), ['b']);
    assert.throws(() => gates.loadDecisionShards(path.join(tmp, 'missing')), /missing/);
    const bad = (name, value, re) => { put(name, value); assert.throws(() => gates.loadDecisionShards(path.join(tmp, name)), re); };
    bad('c.json', '{ not json', /c\.json/);
    bad('d.json', { ...goodShard(), version: 2 }, /version/);
    for (const field of ['sources', 'claims', 'files']) bad(`g-${field}.json`, { ...goodShard(), [field]: {} }, new RegExp(`"${field}" must be an array`));
    const empty = fs.mkdtempSync(path.join(tmp, 'empty-'));
    assert.throws(() => gates.loadDecisionShards(empty), /holds no \*\.json shard/);
    for (const field of ['version', 'shard', 'sources', 'claims']) {
      const shard = goodShard();
      delete shard[field];
      bad(`e-${field}.json`, shard, new RegExp(field));
    }
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

// ---- scoped open data -------------------------------------------------------

function scopedFixture() {
  const claim = (sourcePath, extra = {}) => ({ claimId: `c_${sourcePath}_${Math.random()}`, sourcePath, sourceAnchor: 'a', sourceUnitDigest: 'd'.repeat(64), disposition: 'unknown-blocking', reviewStatus: 'blocking', targetOwner: null, ...extra });
  return {
    inventory: {
      items: [{ path: 'docs/in/a.md', proposedDisposition: 'unknown-blocking' }, { path: 'docs/out/b.md', proposedDisposition: 'unknown-blocking' }],
      claimLedger: [
        claim('docs/in/a.md'), claim('docs/out/b.md'),
        claim('docs/in/a.md', { disposition: 'retain-as-evidence', reviewStatus: 'pending', digestOwner: 1, sourceUnitDigest: '1'.repeat(64), targetOwner: 'docs/platform/x/README.md' }),
        claim('docs/out/b.md', { disposition: 'retain-as-evidence', reviewStatus: 'pending', sourceUnitDigest: '1'.repeat(64), targetOwner: 'docs/platform/y/README.md' }),
      ],
    },
    registry: {
      identityGaps: [{ sourcePath: 'docs/in/a.md', sourceAnchor: 'g', disposition: null }, { sourcePath: 'docs/out/b.md', sourceAnchor: 'g', disposition: null }],
      retiredUnits: [{ sourcePath: 'docs/in/a.md', sourceAnchor: 'r', disposition: 'delete-as-obsolete' }, { sourcePath: 'docs/out/b.md', sourceAnchor: 'r', disposition: 'delete-as-obsolete' }],
    },
    droppedClaimsRegister: { entries: [{ id: 'in', source: { path: 'docs/in/a.md' } }, { id: 'out', source: { path: 'docs/out/b.md' } }] },
  };
}
const counts = (open) => Object.fromEntries(open.map((o) => [o.type, o.count]));

test('a scope restricts every open conservation check to rows whose source path is in scope', () => {
  const fixture = scopedFixture();
  const all = counts(gates.summarizeConservationCompleteness({ ...fixture, vocabulary: VOCABULARY }));
  assert.deepEqual(all, { 'files-unknown-blocking': 2, 'claims-unknown-blocking': 2, 'claims-not-reviewed': 4, 'claims-without-own-rationale': 4, 'identical-units-multiple-owners': 1, 'registry-gaps-without-disposition': 2, 'retired-rows-incomplete': 2, 'dropped-claims-unreviewed': 2 });
  for (const scope of [['docs/in'], ['docs/in/'], ['docs/in/a.md']]) {
    const scoped = counts(gates.summarizeConservationCompleteness({ ...fixture, vocabulary: VOCABULARY, scope }));
    assert.deepEqual(scoped, { 'files-unknown-blocking': 1, 'claims-unknown-blocking': 1, 'claims-not-reviewed': 2, 'claims-without-own-rationale': 2, 'registry-gaps-without-disposition': 1, 'retired-rows-incomplete': 1, 'dropped-claims-unreviewed': 1 }, JSON.stringify(scope));
  }
  const both = counts(gates.summarizeConservationCompleteness({ ...fixture, vocabulary: VOCABULARY, scope: ['docs/in', 'docs/out/b.md'] }));
  assert.deepEqual(both, all);
});

test('a scope matches whole path segments and an empty scope changes nothing', () => {
  const fixture = scopedFixture();
  assert.deepEqual(gates.summarizeConservationCompleteness({ ...fixture, vocabulary: VOCABULARY, scope: ['docs/i'] }), []);
  const plain = gates.summarizeConservationCompleteness({ ...fixture, vocabulary: VOCABULARY });
  assert.deepEqual(gates.summarizeConservationCompleteness({ ...fixture, vocabulary: VOCABULARY, scope: [] }), plain);
});

test('checkConservation scopes the open data and leaves the invariants global', () => {
  const fixture = scopedFixture();
  fixture.inventory.claimLedger.push({ claimId: 'bad', sourcePath: 'docs/out/b.md', sourceAnchor: 'z', disposition: 'keep-legacy', reviewStatus: 'pending' });
  const result = gates.checkConservation({ ...fixture, vocabulary: VOCABULARY, scope: ['docs/in'] });
  assert.deepEqual(result.invariant.map((f) => f.type), ['claim-disposition-unknown']);
  assert.equal(counts(result.open)['files-unknown-blocking'], 1);
});
