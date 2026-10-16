// For every manual carry row whose target own text has lines absent from the source own text (row-reader
// classes added-only/MISSING), list target lines not found anywhere in the whole collapsed source file and
// not carrying an "Added in candidate" label. usage: node added-lines.mjs --output-dir <OUT>
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const OUT = process.argv[process.argv.indexOf('--output-dir') + 1];
const root = process.cwd();
const R = 'plans/260925-documentation-authority-unification/reports/phase-06/';
const g = await import(root + '/scripts/check-doc-inventory-gates.mjs');
const pop = JSON.parse(fs.readFileSync(R + 'checkpoint-10-source-population.json', 'utf8'));
const byId = new Map(pop.reviewed.map((r) => [r.claimId, r]));
const sum = JSON.parse(fs.readFileSync(OUT + '/rows-summary.json', 'utf8')).filter((x) => x.added > 0);
const unitsOf = g.buildConservationUnitLookup(root, pop.pin);
const blob = new Map();
const file = (p) => { if (!blob.has(p)) blob.set(p, execFileSync('git', ['show', `${pop.pin}:${p}`], { encoding: 'utf8', maxBuffer: 1 << 28 })); return blob.get(p); };
const col = (t) => t.replace(/\]\([^)]*\)/g, ']()').replace(/^\s*(#{1,6}|>|[-*]|\d+\.)\s+/gm, '').replace(/[`*_]/g, '').replace(/\s+/g, ' ').trim();
const norm = (t) => (t || '').split('\n').map((l) => l.replace(/\]\([^)]*\)/g, ']()').replace(/^#{1,6}\s+/, '# ').trim()).filter((l) => l !== '' && !/^(`{3,}|~{3,})\w*$/.test(l));
const out = [], md = [];
for (const x of sum) {
  const r = byId.get(x.claimId);
  const s = unitsOf(r.sourcePath).find((u) => u.anchor === r.sourceAnchor), t = unitsOf(r.targetOwner).find((u) => u.anchor === r.targetAnchor);
  const sl = new Set(norm(s.text)); const whole = col(file(r.sourcePath));
  const added = norm(t.text).filter((l) => !sl.has(l));
  const novel = added.filter((l) => { const c = col(l); return c && !whole.includes(c) && !/added in candidate/i.test(l); });
  const labelled = added.filter((l) => /added in candidate/i.test(l));
  out.push({ claimId: x.claimId, disposition: r.disposition, added: added.length, labelled: labelled.length, novel: novel.length });
  if (novel.length) md.push(`## ${x.claimId} [${r.disposition}] ${r.sourcePath}#${r.sourceAnchor} -> ${r.targetOwner}#${r.targetAnchor}`, 'WHY: ' + (r.rationale || '').replace(/^Source: .*?Disposition \w+: /s, '').slice(0, 300), ...novel.map((l) => '  + ' + l.slice(0, 400)), '');
}
fs.writeFileSync(OUT + '/added-lines.json', JSON.stringify(out) + '\n');
fs.writeFileSync(OUT + '/added-lines.md', md.join('\n') + '\n');
const agg = {};
for (const x of out) { const k = x.disposition + '|' + (x.novel ? 'novel' : x.labelled ? 'labelled-or-sourced' : 'sourced-elsewhere-in-file'); agg[k] = (agg[k] || 0) + 1; }
console.log(JSON.stringify(agg, null, 1));
