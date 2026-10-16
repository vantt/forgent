// Third pass over residual2 rows: each still-missing source line, whitespace-collapsed and with link
// destinations removed, is searched in the whole collapsed target file. Lines found elsewhere in the
// target file are "relocated"; lines found nowhere are "absent". Writes residual3.json / residual3.md.
// usage (worktree root, read only): node residual3.mjs --output-dir <OUT>
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const OUT = process.argv[process.argv.indexOf('--output-dir') + 1];
if (!OUT?.startsWith('/tmp/fgos-work/')) throw new Error('--output-dir');
const root = process.cwd();
const R = 'plans/260925-documentation-authority-unification/reports/phase-06/';
const g = await import(root + '/scripts/check-doc-inventory-gates.mjs');
const pop = JSON.parse(fs.readFileSync(R + 'checkpoint-10-source-population.json', 'utf8'));
const byId = new Map(pop.reviewed.map((r) => [r.claimId, r]));
const r2 = JSON.parse(fs.readFileSync(OUT + '/residual2.json', 'utf8')).filter((x) => x.missing);
const unitsOf = g.buildConservationUnitLookup(root, pop.pin);
const blob = new Map();
const file = (p) => { if (!blob.has(p)) blob.set(p, execFileSync('git', ['show', `${pop.pin}:${p}`], { encoding: 'utf8', maxBuffer: 1 << 28 })); return blob.get(p); };
const col = (t) => t.replace(/\]\([^)]*\)/g, ']()').replace(/^\s*(#{1,6}|>|[-*]|\d+\.)\s+/gm, '').replace(/[`*_]/g, '').replace(/\s+/g, ' ').trim();
const norm = (t) => (t || '').split('\n').map((l) => l.replace(/\]\([^)]*\)/g, ']()').replace(/^#{1,6}\s+/, '# ').replace(/^\s*>\s?/, '').trim()).filter((l) => l !== '' && !/^(`{3,}|~{3,})\w*$/.test(l));
const encl = (units, u) => { if (u.unitKind === 'heading') return u.sectionText ?? u.text; const i = units.indexOf(u); for (let k = i - 1; k >= 0; k--) if (units[k].unitKind === 'heading') return units[k].sectionText; return units.filter((x) => x.unitKind !== 'heading').map((x) => x.text).join('\n'); };
const out = [], md = [];
for (const x of r2) {
  const r = byId.get(x.claimId);
  const su = unitsOf(r.sourcePath), tu = unitsOf(r.targetOwner);
  const s = su.find((u) => u.anchor === r.sourceAnchor), t = tu.find((u) => u.anchor === r.targetAnchor);
  const tgtSet = new Set(norm(encl(tu, t)));
  const missing = norm(s.unitKind === 'heading' ? s.sectionText : s.text).filter((l) => !tgtSet.has(l));
  const whole = col(file(r.targetOwner)), sect = col(encl(tu, t));
  const cls = missing.map((l) => { const c = col(l); return !c ? 'trivial' : sect.includes(c) ? 'reflowed-in-section' : whole.includes(c) ? 'elsewhere-in-target-file' : 'absent'; });
  const absent = missing.filter((_, i) => cls[i] === 'absent');
  const elsewhere = missing.filter((_, i) => cls[i] === 'elsewhere-in-target-file');
  out.push({ claimId: x.claimId, disposition: r.disposition, kind: s.unitKind, missing: missing.length, absent: absent.length, elsewhere: elsewhere.length });
  if (absent.length || elsewhere.length) md.push(`## ${x.claimId} [${r.disposition}/${s.unitKind}] ${r.sourcePath}#${r.sourceAnchor} -> ${r.targetOwner}#${r.targetAnchor} absent=${absent.length} elsewhere=${elsewhere.length}`, 'rationale: ' + (r.rationale || '').replace(/\n/g, ' '), ...(r.remainder ? ['remainder: ' + String(r.remainder).replace(/\n/g, ' ')] : []), 'review note: ' + (r.reviewNote || '').replace(/\n/g, ' '), ...absent.map((l) => '  ABSENT - ' + l), ...elsewhere.map((l) => '  ELSEWHERE - ' + l), '');
}
fs.writeFileSync(OUT + '/residual3.json', JSON.stringify(out) + '\n');
fs.writeFileSync(OUT + '/residual3.md', md.join('\n') + '\n');
const agg = {};
for (const x of out) { const k = x.disposition + '|' + (x.absent ? 'absent' : x.elsewhere ? 'elsewhere-only' : 'reflow-only'); agg[k] = (agg[k] || 0) + 1; }
console.log(JSON.stringify(agg, null, 1));
