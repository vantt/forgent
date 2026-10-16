// Compact human-reading view of every supersede/partial row with own-absent lines (residual4): the absent
// source text next to the target's enclosing section, both whitespace-collapsed. usage: node supersede-view.mjs --output-dir <OUT>
import fs from 'node:fs';
const OUT = process.argv[process.argv.indexOf('--output-dir') + 1];
const root = process.cwd();
const R = 'plans/260925-documentation-authority-unification/reports/phase-06/';
const g = await import(root + '/scripts/check-doc-inventory-gates.mjs');
const pop = JSON.parse(fs.readFileSync(R + 'checkpoint-10-source-population.json', 'utf8'));
const byId = new Map(pop.reviewed.map((r) => [r.claimId, r]));
const unitsOf = g.buildConservationUnitLookup(root, pop.pin);
const md = fs.readFileSync(OUT + '/residual4.md', 'utf8').split('\n## ').filter((b) => /\[(supersede|partial-carry)\//.test(b.split('\n')[0]));
const encl = (units, u) => { if (u.unitKind === 'heading') return u.sectionText ?? u.text; const i = units.indexOf(u); for (let k = i - 1; k >= 0; k--) if (units[k].unitKind === 'heading') return units[k].sectionText; return u.text; };
const c = (t) => t.replace(/\s+/g, ' ').trim();
const out = [];
let n = 0;
for (const b of md) {
  const id = b.match(/claim_[0-9a-f]{32}/)[0]; const r = byId.get(id);
  const tu = unitsOf(r.targetOwner); const t = tu.find((u) => u.anchor === r.targetAnchor);
  const absent = b.split('\n').filter((l) => l.includes('OWN-ABSENT - ')).map((l) => l.split('OWN-ABSENT - ')[1]).join(' / ');
  const why = (r.rationale || '').replace(/^Source: .*?Disposition supersede: /s, '').slice(0, 260);
  out.push(`${++n}. ${id} ${r.sourcePath.replace('docs/', '')}#${r.sourceAnchor} -> ${r.targetOwner.replace('docs/platform/', 'P/')}#${r.targetAnchor}`, `   WHY: ${c(why)}`, `   ABSENT: ${c(absent).slice(0, 700)}`, `   TARGET: ${c(encl(tu, t)).slice(0, 900)}`, '');
}
fs.writeFileSync(OUT + '/supersede-view.txt', out.join('\n') + '\n');
console.log(n);
