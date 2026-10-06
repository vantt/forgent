import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
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
  const inventory = { claimLedger: [row({ disposition: 'unknown-blocking', reviewStatus: 'blocking' })] };
  const registry = { units: [{ claimId: 'claim_a' }], identityGaps: [{ claimId: 'g', sourcePath: 'docs/a.md', sourceAnchor: 'g' }], retiredUnits: [{ claimId: 'r', sourcePath: 'docs/a.md', sourceAnchor: 'r', disposition: 'delete-as-obsolete' }] };
  const dropped = { entries: [{ id: 'dropped-x' }] };
  const result = gates.checkConservation({ inventory, registry, previousRegistry: { units: [{ claimId: 'claim_a' }] }, vocabulary: VOCABULARY, droppedClaimsRegister: dropped });
  assert.deepEqual(result.invariant, []);
  assert.deepEqual(result.open.map((o) => o.type).sort(), ['claims-not-reviewed', 'claims-unknown-blocking', 'claims-without-own-rationale', 'dropped-claims-unreviewed', 'registry-gaps-without-disposition', 'retired-rows-incomplete']);
  const reviewed = { entries: [{ id: 'dropped-x', reviewedDisposition: { decision: 'restoration-owner-named', reviewer: 'owner', reviewedAt: '2026-10-06' } }] };
  const clean = gates.checkConservation({ inventory: { claimLedger: [row({ reviewStatus: 'reviewed', rationale: 'kept as evidence' })] }, registry: { units: [{ claimId: 'claim_a' }] }, vocabulary: VOCABULARY, droppedClaimsRegister: reviewed });
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
