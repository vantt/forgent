// Renders every reviewed binding as source/target with a normalized residual diff, for full reading.
// Normalization only removes link destinations and heading-marker depth; everything else is compared.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const S = path.dirname(new URL(import.meta.url).pathname);
const g = await import(path.join(root, 'scripts/check-doc-inventory-gates.mjs'));
const pin = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const R = 'plans/260925-documentation-authority-unification/reports/phase-06/';
const dir = 'plans/260925-documentation-authority-unification/ledger/decisions/';
const pop = JSON.parse(fs.readFileSync(R + 'checkpoint-6-reviewed-source-population.json', 'utf8'));
const rows = new Map(fs.readdirSync(dir).filter((f) => f.startsWith('s6-')).flatMap((f) => (JSON.parse(fs.readFileSync(dir + f, 'utf8')).claims || [])).map((r) => [r.claimId, r]));
const unitsOf = g.buildConservationUnitLookup(root, pin);
const norm = (t) => t.split('\n').map((l) => l.replace(/\]\([^)]*\)/g, ']()').replace(/^#{1,6}\s+/, '# ').replace(/\s+$/, '')).filter((l) => l.trim() !== '');
const out = [];
const summary = [];
for (const b of pop.reviewedBindings) {
  const r = rows.get(b.claimId);
  const s = (unitsOf(b.sourcePath) || []).find((u) => u.anchor === b.sourceAnchor);
  const t = (unitsOf(b.targetOwner) || []).find((u) => u.anchor === b.targetAnchor);
  // Own text for blocks; for headings the heading line itself plus its direct section (siblings are separate rows).
  const own = (u) => u.unitKind === 'heading' ? u.text : u.text;
  const sl = norm(own(s)), tl = norm(own(t));
  const tset = new Set(tl), sset = new Set(sl);
  const missing = sl.filter((l) => !tset.has(l));
  const added = tl.filter((l) => !sset.has(l));
  const cls = (r.rationale.match(/^([A-Za-z-]+):/) || [, 'none'])[1];
  const kind = s.unitKind;
  const headingSectionEqual = kind === 'heading' ? JSON.stringify(norm(s.sectionText)) === JSON.stringify(norm(t.sectionText)) : null;
  summary.push({ claimId: b.claimId, cls, kind, disposition: r.disposition, exactBytes: s.text === t.text, missing: missing.length, added: added.length, headingSectionEqual, source: `${b.sourcePath}#${b.sourceAnchor}`, target: `${b.targetOwner}#${b.targetAnchor}` });
  out.push(`## ${b.claimId} [${cls}/${kind}/${r.disposition}] ${b.sourcePath}#${b.sourceAnchor} -> ${b.targetOwner}#${b.targetAnchor}`);
  out.push(`rationale: ${r.rationale}`);
  if (r.remainder) out.push(`remainder: ${r.remainder}`);
  out.push(`review note: ${r.reviewNote}`);
  if (s.text === t.text) out.push('BYTES EQUAL (own unit text)');
  else {
    out.push('missing-from-target: ' + (missing.length ? '\n  - ' + missing.join('\n  - ') : 'none'));
    out.push('added-in-target: ' + (added.length ? '\n  + ' + added.join('\n  + ') : 'none'));
  }
  if (kind === 'heading' && !headingSectionEqual) {
    const ss = norm(s.sectionText), ts = norm(t.sectionText);
    const tS = new Set(ts), sS = new Set(ss);
    out.push('section-missing: ' + (ss.filter((l) => !tS.has(l)).map((l) => '\n  - ' + l).join('') || 'none'));
    out.push('section-added: ' + (ts.filter((l) => !sS.has(l)).map((l) => '\n  + ' + l).join('') || 'none'));
  }
  out.push('');
}
fs.writeFileSync(path.join(S, 'rows-read.md'), out.join('\n') + '\n');
fs.writeFileSync(path.join(S, 'rows-summary.json'), JSON.stringify(summary, null, 1) + '\n');
const agg = {};
for (const x of summary) { const k = `${x.cls}|${x.exactBytes ? 'bytes-equal' : x.missing ? 'MISSING' : x.added ? 'added-only' : 'normalized-equal'}`; agg[k] = (agg[k] || 0) + 1; }
console.log(agg);
