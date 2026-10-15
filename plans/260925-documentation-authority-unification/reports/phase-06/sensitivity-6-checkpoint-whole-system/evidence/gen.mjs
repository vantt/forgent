// Independent checkpoint reproduction: native inventory in memory, packs, D/E with both prior registries.
// Run from the worktree root (read only). Writes only into this scratch directory.
import fs from 'node:fs';
import v8 from 'node:v8';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const S = path.dirname(new URL(import.meta.url).pathname);
const P = 'plans/260925-documentation-authority-unification/';
const R = P + 'reports/phase-06/';
const log = (...a) => console.log(new Date().toISOString(), ...a);
const read = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const write = (f, x) => fs.writeFileSync(path.join(S, f), JSON.stringify(x, null, 1) + '\n');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const pin = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const status = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' });
if (status.trim()) throw new Error('worktree not clean: ' + status);
const gen = await import(path.join(root, 'scripts/generate-doc-inventory.mjs'));
const g = await import(path.join(root, 'scripts/check-doc-inventory-gates.mjs'));
const pd = await import(path.join(root, 'scripts/propose-doc-decisions.mjs'));

const regPath = path.join(S, 'identity-registry.json');
log('pin', pin, 'registry sha', sha(fs.readFileSync(regPath)));
let registry = read(regPath);
const binds = gen.registryBindsToCommit(registry.commit, pin, root);
log('registry commit', registry.commit, 'binds to pin', binds);
if (!binds) {
  registry = gen.carryForwardIdentityRegistryRepoWide(root, { commit: pin, identityRegistryPath: regPath });
  fs.writeFileSync(regPath, JSON.stringify(registry) + '\n');
  log('carried', JSON.stringify(registry.carryForward));
}
log('generate start');
const inv = gen.generateInventory(root, { commit: pin, identityRegistryPath: regPath });
log('generated items', inv.items.length, 'claims', inv.claimLedger.length, 'keys', Object.keys(inv).join(','));
const cache = v8.serialize(inv);
fs.writeFileSync(path.join(S, 'inv.v8'), cache);
log('v8 cache bytes', cache.length);
const regBytes = fs.readFileSync(regPath);

// Packs, per shard, in-process with the unchanged exported builder.
const pop = read(R + 'checkpoint-6-reviewed-source-population.json');
const popIds = new Map(pop.reviewedBindings.map((b) => [b.claimId, b]));
const context = { inventory: inv, repoRoot: root, unitsOf: g.buildConservationUnitLookup(root, inv.commit) };
const shardFiles = [...new Set(pop.reviewedBindings.map((b) => b.shard))].sort();
const packs = [];
for (const f of shardFiles) {
  const shard = read(f);
  const pack = pd.buildReviewPack(context, shard);
  fs.writeFileSync(path.join(S, 'packs', path.basename(f).replace('.json', '.pack.json')), JSON.stringify(pack, null, 2) + '\n');
  packs.push(pack);
  log('pack', shard.shard, 'rows', pack.rows.length, 'controls', pack.sensitivityControls.length, 'unmatched', pack.unmatchedCandidateUnits.length);
}
const controls = packs.flatMap((p) => p.sensitivityControls).filter((r) => popIds.has(r.claimId));
const notControl = [...popIds.keys()].filter((id) => !controls.some((r) => r.claimId === id));
const digestMismatch = controls.filter((r) => r.targetUnitDigest !== popIds.get(r.claimId).targetUnitDigest || r.sourceUnitDigest !== popIds.get(r.claimId).sourceUnitDigest).map((r) => r.claimId);
const authors = [...new Set(packs.map((p) => p.authorSession))];
const composite = { version: 1, commit: inv.commit, shard: 's6-whole-system-checkpoint', authorSession: authors.length === 1 ? authors[0] : authors.join(' | '), authorshipRequired: true, rows: [], sensitivityControls: controls, unmatchedCandidateUnits: [] };
fs.writeFileSync(path.join(S, 'packs', 'checkpoint-6-composite.pack.json'), JSON.stringify(composite, null, 2) + '\n');
write('pack-composition.json', { pin, authors, populationReviewed: popIds.size, controls: controls.length, populationNotControl: notControl, digestMismatch, byteEqualControls: controls.filter((r) => r.target && r.source.textDigest === r.target.textDigest).length });
log('composite controls', controls.length, 'not control', notControl.length, 'digest mismatch', digestMismatch.length);

// D and strict E: both priors together (as the author) and each prior alone (as the phase file prescribes).
const vocabulary = read(P + 'claim-and-disposition-vocabulary.json');
const droppedClaimsRegister = read(P + 'dropped-claims-register.json');
const decisions = [...g.loadDecisionShards(P + 'pilot/decisions'), ...g.loadDecisionShards(P + 'ledger/decisions')];
const ratchetResult = g.loadRatchetResult(root);
const priors = { a: [path.join(S, 'prior-identity-registry.json'), P + 'reports/identity-registry.json'], b: [path.join(S, 'prior-phase-02-identity-registry.json'), P + 'reports/phase-02-identity-registry.json'] };
const whole = ['docs/architect/architecture-intent.md', 'docs/architect/component-boundary/component-boundary-advisory.md', 'docs/architect/component-boundary/README.md', 'docs/architect/component-boundary/repo-layout-vision.md', 'docs/architect/README.md', 'docs/architect/roadmap.md', 'docs/architect/system-vision-trong-mem-ngoai-cung.md', 'docs/architect/workspace-topology-audit.md', 'docs/architect/workspace-topology-roadmap.md', 'docs/architect/workspace-topology.md', 'docs/architecture-map.md', 'docs/specs/system-overview.md'];
const summary = [];
for (const [label, sets] of [['both', ['a', 'b']], ['identity', ['a']], ['phase02', ['b']]]) {
  for (const strict of [false, true]) {
    log('check', strict ? 'E' : 'D', label);
    const result = g.checkInventory({ repoRoot: root, inventory: inv, vocabulary, identityRegistry: registry, droppedClaimsRegister, previousRegistries: sets.map((k) => ({ registry: read(priors[k][0]), label: priors[k][1] })), ratchetResult, strict, headCommit: pin, registryBytes: regBytes, missingInputs: [], decisions, scope: strict ? whole : null });
    write(`${strict ? 'E' : 'D'}-${label}.json`, result);
    const s = { check: strict ? 'E' : 'D', priors: label, fatal: result.fatalFindings.length, fatalTypes: [...new Set(result.fatalFindings.map((f) => f.type))], open: (result.conservationOpen || []).map((o) => [o.type, o.count]) };
    summary.push(s);
    log(JSON.stringify(s));
  }
}
write('de-summary.json', { pin, registrySha: sha(regBytes), scope: whole, summary });
log('done');
