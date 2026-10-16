// Renders every manual (judgment) reviewed binding of checkpoint-10-source-population.json with a
// normalized residual diff, for full reading. Run from the worktree root (read only):
//   node --max-old-space-size=3072 row-reader.mjs --output-dir <OUT>
// Normalization removes only link destinations, heading-marker depth and trailing whitespace.
// Mechanical checks per row: source/target unit present at the pin with the recorded digest,
// population row equals its committed shard row on the binding fields, target multiplicity.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const OUT = process.argv[process.argv.indexOf('--output-dir') + 1];
if (!OUT?.startsWith('/tmp/fgos-work/')) throw new Error('--output-dir under /tmp/fgos-work required');
const root = process.cwd();
const P = 'plans/260925-documentation-authority-unification/';
const R = P + 'reports/phase-06/';
const g = await import(root + '/scripts/check-doc-inventory-gates.mjs');
const pop = JSON.parse(fs.readFileSync(R + 'checkpoint-10-source-population.json', 'utf8'));
const pin = pop.pin;
const unitsOf = g.buildConservationUnitLookup(root, pin);
const shardRow = new Map();
for (const d of [P + 'pilot/decisions', P + 'ledger/decisions']) for (const f of fs.readdirSync(d).filter((f) => f.endsWith('.json'))) {
  const j = JSON.parse(fs.readFileSync(d + '/' + f, 'utf8'));
  for (const r of j.claims || []) shardRow.set(r.claimId, { ...r, _shard: d + '/' + f });
}
const norm = (t) => (t || '').split('\n').map((l) => l.replace(/\]\([^)]*\)/g, ']()').replace(/^#{1,6}\s+/, '# ').replace(/\s+$/, '')).filter((l) => l.trim() !== '');
const manual = pop.reviewed.filter((r) => r.checkpointClass === 'manual');
const targetCount = new Map();
for (const r of pop.reviewed) if (r.targetOwner) { const k = r.targetOwner + '#' + r.targetAnchor; targetCount.set(k, (targetCount.get(k) || 0) + 1); }
const reportCache = new Map();
const reportHas = (p, c, id) => {
  const k = c + ':' + p;
  if (!reportCache.has(k)) { try { reportCache.set(k, execFileSync('git', ['show', k], { encoding: 'utf8', maxBuffer: 1 << 30 })); } catch { reportCache.set(k, null); } }
  const t = reportCache.get(k);
  return t === null ? 'report-missing' : t.includes(id) ? 'ok' : 'claim-not-in-report';
};
const out = [];
const summary = [];
const FIELDS = ['disposition', 'targetOwner', 'targetAnchor', 'targetUnitDigest', 'sourceUnitDigest', 'reviewStatus', 'reviewedBy', 'authoredBy', 'reviewReport', 'reviewReportCommit'];
for (const r of manual) {
  const sr = shardRow.get(r.claimId);
  const fieldDiff = sr ? FIELDS.filter((f) => (sr[f] ?? null) !== (r[f] ?? null) && !(f === 'sourceUnitDigest' && sr[f] && r[f]?.startsWith(sr[f])) && !(f === 'targetUnitDigest' && sr[f] && r[f]?.startsWith(sr[f]))) : ['no-shard-row'];
  const s = (unitsOf(r.sourcePath) || []).find((u) => u.anchor === r.sourceAnchor);
  const t = r.targetOwner ? (unitsOf(r.targetOwner) || []).find((u) => u.anchor === r.targetAnchor) : null;
  const mech = [];
  if (!s) mech.push('source-unit-absent'); else if (s.textDigest !== r.sourceUnitDigest) mech.push('source-digest-drift');
  if (r.targetOwner && !t) mech.push('target-unit-absent'); else if (t && r.targetUnitDigest && !t.textDigest.startsWith(r.targetUnitDigest)) mech.push('target-digest-drift');
  if (r.authoredBy && r.reviewedBy && r.reviewedBy.replace(/^reviewer:/, '').replace(/@.*/, '') === r.authoredBy.replace(/@.*/, '')) mech.push('self-review');
  const rep = r.reviewReport && r.reviewReportCommit ? reportHas(r.reviewReport, r.reviewReportCommit, r.claimId) : 'no-report-binding';
  if (rep !== 'ok') mech.push(rep);
  if (fieldDiff.length) mech.push('shard-field-diff:' + fieldDiff.join(','));
  let cls = 'no-target';
  let missing = [], added = [], secMissing = [], secAdded = [], inOrder = null;
  if (s && t) {
    const sl = norm(s.text), tl = norm(t.text);
    const ts = new Set(tl), ss = new Set(sl);
    missing = sl.filter((l) => !ts.has(l)); added = tl.filter((l) => !ss.has(l));
    let i = 0; for (const l of tl) if (l === sl[i]) i++; inOrder = i === sl.length;
    if (s.unitKind === 'heading' || t.unitKind === 'heading') {
      const a = norm(s.sectionText ?? s.text), b = norm(t.sectionText ?? t.text);
      const bs = new Set(b), as = new Set(a);
      secMissing = a.filter((l) => !bs.has(l)); secAdded = b.filter((l) => !as.has(l));
    }
    cls = s.text === t.text && (s.sectionText ?? '') === (t.sectionText ?? '') ? 'bytes-equal'
      : missing.length || secMissing.length ? 'MISSING'
      : added.length || secAdded.length ? 'added-only' : 'normalized-equal';
  }
  const row = { claimId: r.claimId, disposition: r.disposition, claimKind: r.claimKind, kind: s?.unitKind, cls, inOrder, missing: missing.length, added: added.length, secMissing: secMissing.length, secAdded: secAdded.length, mech, targetMultiplicity: r.targetOwner ? targetCount.get(r.targetOwner + '#' + r.targetAnchor) : null, source: `${r.sourcePath}#${r.sourceAnchor}`, target: r.targetOwner ? `${r.targetOwner}#${r.targetAnchor}` : null, shard: sr?._shard, authoredBy: r.authoredBy, reviewedBy: r.reviewedBy, reviewReport: r.reviewReport };
  summary.push(row);
  out.push(`## ${r.claimId} [${r.disposition}/${r.claimKind}/${s?.unitKind}] ${row.source} -> ${row.target} :: ${cls}${mech.length ? ' MECH ' + mech.join(' ') : ''}`);
  out.push('rationale: ' + (r.rationale || '').replace(/\n/g, ' '));
  if (r.remainder) out.push('remainder: ' + String(r.remainder).replace(/\n/g, ' '));
  out.push('review note: ' + (r.reviewNote || '').replace(/\n/g, ' '));
  if (cls === 'no-target' && s) out.push('source text:\n  | ' + s.text.split('\n').slice(0, 40).join('\n  | '));
  if (missing.length) out.push('missing-from-target:\n  - ' + missing.join('\n  - '));
  if (added.length) out.push('added-in-target:\n  + ' + added.join('\n  + '));
  if (secMissing.length) out.push('section-missing:\n  - ' + secMissing.join('\n  - '));
  if (secAdded.length) out.push('section-added:\n  + ' + secAdded.join('\n  + '));
  out.push('');
}
fs.writeFileSync(OUT + '/rows-read.md', out.join('\n') + '\n');
fs.writeFileSync(OUT + '/rows-summary.json', JSON.stringify(summary) + '\n');
const agg = {};
for (const x of summary) { const k = `${x.disposition}|${x.cls}`; agg[k] = (agg[k] || 0) + 1; }
const mechAgg = {};
for (const x of summary) for (const m of x.mech) { const k = m.replace(/:.*/, ''); mechAgg[k] = (mechAgg[k] || 0) + 1; }
console.log(JSON.stringify({ pin, rows: summary.length, agg, mechAgg, reports: reportCache.size }, null, 1));
