// Second-pass residual for every manual row with a target: source lines (own text; for headings the whole
// source section) that do not occur anywhere in the target's whole section (target heading section, or the
// enclosing heading section for a block), after the same normalization plus fence-marker removal.
// Writes residual2.json and residual2.md (only rows that still have missing lines).
// usage (worktree root, read only): node residual2.mjs --output-dir <OUT>
import fs from 'node:fs';
const OUT = process.argv[process.argv.indexOf('--output-dir') + 1];
if (!OUT?.startsWith('/tmp/fgos-work/')) throw new Error('--output-dir');
const root = process.cwd();
const R = 'plans/260925-documentation-authority-unification/reports/phase-06/';
const g = await import(root + '/scripts/check-doc-inventory-gates.mjs');
const pop = JSON.parse(fs.readFileSync(R + 'checkpoint-10-source-population.json', 'utf8'));
const unitsOf = g.buildConservationUnitLookup(root, pop.pin);
const norm = (t) => (t || '').split('\n').map((l) => l.replace(/\]\([^)]*\)/g, ']()').replace(/^#{1,6}\s+/, '# ').replace(/^\s*>\s?/, '').trim()).filter((l) => l !== '' && !/^(`{3,}|~{3,})\w*$/.test(l));
const encl = (units, u) => { if (u.unitKind === 'heading') return u.sectionText ?? u.text; const i = units.indexOf(u); for (let k = i - 1; k >= 0; k--) if (units[k].unitKind === 'heading') return units[k].sectionText; return units.filter((x) => x.unitKind !== 'heading').map((x) => x.text).join('\n'); };
const rows = [], md = [];
for (const r of pop.reviewed) {
  if (r.checkpointClass !== 'manual' || !r.targetOwner) continue;
  const su = unitsOf(r.sourcePath), tu = unitsOf(r.targetOwner);
  const s = su.find((u) => u.anchor === r.sourceAnchor), t = tu.find((u) => u.anchor === r.targetAnchor);
  const src = norm(s.unitKind === 'heading' ? s.sectionText : s.text);
  const tgt = new Set(norm(encl(tu, t)));
  const missing = src.filter((l) => !tgt.has(l));
  rows.push({ claimId: r.claimId, disposition: r.disposition, kind: s.unitKind, missing: missing.length, srcLines: src.length });
  if (missing.length) { md.push(`## ${r.claimId} [${r.disposition}/${s.unitKind}] ${r.sourcePath}#${r.sourceAnchor} -> ${r.targetOwner}#${r.targetAnchor} (${missing.length}/${src.length} missing)`, 'rationale: ' + (r.rationale || '').replace(/\n/g, ' '), ...(r.remainder ? ['remainder: ' + r.remainder] : []), 'review note: ' + (r.reviewNote || '').replace(/\n/g, ' '), 'missing:', ...missing.map((l) => '  - ' + l), 'target own text:', ...t.text.split('\n').slice(0, 30).map((l) => '  | ' + l), ''); }
}
fs.writeFileSync(OUT + '/residual2.json', JSON.stringify(rows) + '\n');
fs.writeFileSync(OUT + '/residual2.md', md.join('\n') + '\n');
const agg = {};
for (const x of rows) { const k = x.disposition + '|' + (x.missing ? 'MISSING' : 'all-source-lines-present'); agg[k] = (agg[k] || 0) + 1; }
console.log(JSON.stringify(agg, null, 1));
