// Fourth pass: for each absent line of residual3, attribute it to the source conservation unit that holds it.
// A line that lies in a different source unit (e.g. a child block of a heading section) which has its own
// population row is "accounted-by-sibling" (that row's disposition/target listed). Remaining lines belong to
// the row's own unit and are listed for human reading. Writes residual4.json / residual4.md.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const OUT = process.argv[process.argv.indexOf('--output-dir') + 1];
if (!OUT?.startsWith('/tmp/fgos-work/')) throw new Error('--output-dir');
const root = process.cwd();
const R = 'plans/260925-documentation-authority-unification/reports/phase-06/';
const g = await import(root + '/scripts/check-doc-inventory-gates.mjs');
const pop = JSON.parse(fs.readFileSync(R + 'checkpoint-10-source-population.json', 'utf8'));
const all = [...pop.reviewed, ...pop.pending];
const byId = new Map(all.map((r) => [r.claimId, r]));
const byAnchor = new Map(all.map((r) => [r.sourcePath + '#' + r.sourceAnchor, r]));
const unitsOf = g.buildConservationUnitLookup(root, pop.pin);
const blob = new Map();
const file = (p) => { if (!blob.has(p)) blob.set(p, execFileSync('git', ['show', `${pop.pin}:${p}`], { encoding: 'utf8', maxBuffer: 1 << 28 })); return blob.get(p); };
const col = (t) => t.replace(/\]\([^)]*\)/g, ']()').replace(/^\s*(#{1,6}|>|[-*]|\d+\.)\s+/gm, '').replace(/[`*_]/g, '').replace(/\s+/g, ' ').trim();
const norm = (t) => (t || '').split('\n').map((l) => l.replace(/\]\([^)]*\)/g, ']()').replace(/^#{1,6}\s+/, '# ').replace(/^\s*>\s?/, '').trim()).filter((l) => l !== '' && !/^(`{3,}|~{3,})\w*$/.test(l));
const encl = (units, u) => { if (u.unitKind === 'heading') return u.sectionText ?? u.text; const i = units.indexOf(u); for (let k = i - 1; k >= 0; k--) if (units[k].unitKind === 'heading') return units[k].sectionText; return units.filter((x) => x.unitKind !== 'heading').map((x) => x.text).join('\n'); };
const r3 = JSON.parse(fs.readFileSync(OUT + '/residual3.json', 'utf8')).filter((x) => x.absent);
const out = [], md = [];
for (const x of r3) {
  const r = byId.get(x.claimId);
  const su = unitsOf(r.sourcePath), tu = unitsOf(r.targetOwner);
  const s = su.find((u) => u.anchor === r.sourceAnchor), t = tu.find((u) => u.anchor === r.targetAnchor);
  const tgtSet = new Set(norm(encl(tu, t)));
  const sect = col(encl(tu, t)), whole = col(file(r.targetOwner));
  const absent = norm(s.unitKind === 'heading' ? s.sectionText : s.text).filter((l) => !tgtSet.has(l)).filter((l) => { const c = col(l); return c && !sect.includes(c) && !whole.includes(c); });
  const own = [], sib = [];
  for (const l of absent) {
    const holder = s.unitKind === 'heading' ? su.find((u) => u !== s && u.unitKind !== 'heading' && u.startLine > s.startLine && norm(u.text).includes(l)) : null;
    const hr = holder ? byAnchor.get(r.sourcePath + '#' + holder.anchor) : null;
    if (hr) sib.push({ line: l, unit: holder.anchor, claimId: hr.claimId, disposition: hr.disposition, target: hr.targetOwner ? hr.targetOwner + '#' + hr.targetAnchor : null, status: hr.reviewStatus });
    else own.push(l);
  }
  out.push({ claimId: x.claimId, disposition: r.disposition, kind: s.unitKind, ownAbsent: own.length, siblingAccounted: sib.length, siblings: sib });
  if (own.length) md.push(`## ${x.claimId} [${r.disposition}/${s.unitKind}] ${r.sourcePath}#${r.sourceAnchor} -> ${r.targetOwner}#${r.targetAnchor} ownAbsent=${own.length} sibling=${sib.length}`, 'rationale: ' + (r.rationale || '').replace(/\n/g, ' '), ...(r.remainder ? ['remainder: ' + String(r.remainder).replace(/\n/g, ' ')] : []), 'review note: ' + (r.reviewNote || '').replace(/\n/g, ' '), ...own.map((l) => '  OWN-ABSENT - ' + l), '');
}
fs.writeFileSync(OUT + '/residual4.json', JSON.stringify(out, null, 1) + '\n');
fs.writeFileSync(OUT + '/residual4.md', md.join('\n') + '\n');
const agg = {};
for (const x of out) { const k = x.disposition + '|' + (x.ownAbsent ? 'own-absent' : 'all-absent-lines-in-sibling-rows'); agg[k] = (agg[k] || 0) + 1; }
const sd = {};
for (const x of out) for (const s of x.siblings) { const k = s.disposition + '/' + s.status; sd[k] = (sd[k] || 0) + 1; }
console.log(JSON.stringify({ agg, siblingDispositions: sd }, null, 1));
