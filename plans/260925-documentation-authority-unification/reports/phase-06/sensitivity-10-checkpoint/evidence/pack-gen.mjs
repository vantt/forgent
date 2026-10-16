// Composite checkpoint sensitivity pack. Run from the worktree root (read only):
//   node --max-old-space-size=4096 --max-semi-space-size=16 pack-gen.mjs --output-dir <OUT>
// Reads the producer-portable native inventory transport <OUT>/step10-native-inventory.bin (built by the
// committed inventory-readonly.mjs from step10-package-reproduction.json), calls the unchanged exported
// buildReviewPack once per decision shard holding a manual (judgment) population row, and keeps only the
// controls whose claim is a reviewed manual row of checkpoint-10-source-population.json. No row is edited.
import fs from 'node:fs';
import v8 from 'node:v8';
import path from 'node:path';
import crypto from 'node:crypto';
const OUT = process.argv[process.argv.indexOf('--output-dir') + 1];
if (!OUT?.startsWith('/tmp/fgos-work/')) throw new Error('--output-dir under /tmp/fgos-work required');
const root = process.cwd();
const P = 'plans/260925-documentation-authority-unification/';
const R = P + 'reports/phase-06/';
const log = (...a) => console.log(new Date().toISOString(), ...a);
const read = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const g = await import(root + '/scripts/check-doc-inventory-gates.mjs');
const pd = await import(root + '/scripts/propose-doc-decisions.mjs');
const bin = OUT + '/step10-native-inventory.bin';
let buf = Buffer.allocUnsafe(fs.statSync(bin).size);
const fd = fs.openSync(bin, 'r');
for (let o = 0; o < buf.length;) o += fs.readSync(fd, buf, o, Math.min(16 << 20, buf.length - o), o);
fs.closeSync(fd);
const inv = v8.deserialize(buf); buf = null;
log('inventory', inv.commit, inv.items.length, inv.claimLedger.length);
const pop = read(R + 'checkpoint-10-source-population.json');
const popManual = new Map(pop.reviewed.filter((r) => r.checkpointClass === 'manual').map((r) => [r.claimId, r]));
const shardOf = new Map();
for (const d of [P + 'pilot/decisions', P + 'ledger/decisions']) for (const f of fs.readdirSync(d).filter((f) => f.endsWith('.json')).sort()) {
  const j = read(d + '/' + f);
  for (const r of j.claims || []) if (popManual.has(r.claimId)) shardOf.set(r.claimId, d + '/' + f);
}
const shardFiles = [...new Set(shardOf.values())].sort();
const context = { inventory: inv, repoRoot: root, unitsOf: g.buildConservationUnitLookup(root, inv.commit) };
const controls = [];
const perShard = [];
for (const f of shardFiles) {
  const shard = read(f);
  let pack;
  try { pack = pd.buildReviewPack(context, shard); } catch (e) { perShard.push({ shard: f, error: e.message }); log('ERR', f, e.message); continue; }
  const kept = pack.sensitivityControls.filter((r) => popManual.has(r.claimId));
  controls.push(...kept);
  perShard.push({ shard: f, authorSession: pack.authorSession, rows: pack.rows.length, controls: pack.sensitivityControls.length, kept: kept.length });
  log('pack', f, 'controls', pack.sensitivityControls.length, 'kept', kept.length);
}
const ids = new Set(controls.map((r) => r.claimId));
const notControl = [...popManual.keys()].filter((id) => !ids.has(id));
const digestMismatch = controls.filter((r) => r.targetUnitDigest !== popManual.get(r.claimId).targetUnitDigest || r.sourceUnitDigest !== popManual.get(r.claimId).sourceUnitDigest).map((r) => r.claimId);
const authors = [...new Set(perShard.map((p) => p.authorSession).filter(Boolean))];
const composite = { version: 1, commit: inv.commit, shard: 's10-whole-corpus-checkpoint', authorSession: 'codex-session:unit-run-1792176628519-ac852ba4@2026-10-17', authorshipRequired: true, rows: [], sensitivityControls: controls, unmatchedCandidateUnits: [] };
const packText = JSON.stringify(composite, null, 2) + '\n';
fs.writeFileSync(OUT + '/pack.json', packText);
const reasons = {};
for (const id of notControl) { const r = popManual.get(id); const k = !r.targetOwner ? 'no-target (' + r.disposition + ')' : 'target present: control filter excluded'; reasons[k] = (reasons[k] || 0) + 1; }
const byteEqual = controls.filter((r) => r.target && r.source.textDigest === r.target.textDigest && (r.source.sectionText || r.source.text) === (r.target.sectionText || r.target.text)).length;
fs.writeFileSync(OUT + '/pack-composition.json', JSON.stringify({ pin: inv.commit, populationSha256: sha(fs.readFileSync(R + 'checkpoint-10-source-population.json')), manualReviewed: popManual.size, shards: shardFiles.length, shardErrors: perShard.filter((p) => p.error), authors, controls: controls.length, populationNotControl: notControl.length, notControlReasons: reasons, notControlTargeted: notControl.filter((id) => popManual.get(id).targetOwner), digestMismatch, byteEqualSeedEligible: byteEqual, packSha256: sha(packText), packBytes: Buffer.byteLength(packText), perShard }, null, 1) + '\n');
log('done controls', controls.length, 'notControl', notControl.length, 'mismatch', digestMismatch.length, 'eligible', byteEqual);
