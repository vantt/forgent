// Seeded draws: 30 current-content units for truth, 50 stratified blocks for invented-claim check.
import { extractMarkdownConservationUnits } from '/home/vantt/projects/forgentX-phase00-documentation-authority-unification/scripts/generate-doc-inventory.mjs';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const W = '/home/vantt/projects/forgentX-phase00-documentation-authority-unification';
const ROOT = 'docs/platform/host-invocation-routing';
const SEED = process.argv[2];
const walk = (d) => readdirSync(`${W}/${d}`).flatMap((f) => statSync(`${W}/${d}/${f}`).isDirectory() ? walk(`${d}/${f}`) : f.endsWith('.md') ? [`${d}/${f}`] : []);
const files = walk(ROOT).filter((p) => !p.includes('/history/'));
const units = [];
for (const p of files) {
  const text = readFileSync(`${W}/${p}`, 'utf8');
  for (const u of extractMarkdownConservationUnits(text, p)) {
    const body = text.split(/\r?\n/).slice(u.startLine - 1, u.endLine).join("\n").trim();
    if (u.unitKind === 'heading' || body.length < 40) continue; // headings carry no assertion of their own
    units.push({ path: p, anchor: u.anchor, startLine: u.startLine, endLine: u.endLine, digest: u.textDigest, text: body });
  }
}
const rank = (u) => createHash('sha256').update(`${SEED}:${u.path}#${u.anchor}`).digest('hex');
const sorted = [...units].sort((a, b) => rank(a).localeCompare(rank(b)));
const pack = JSON.parse(readFileSync(`${W}/plans/260925-documentation-authority-unification/reports/phase-06/review-pack-261013-1528-host-invocation-checkpoint.md.json`, 'utf8'));
const targets = new Set(pack.rows.map((r) => `${r.decision.targetOwner}#${r.decision.targetAnchor}`));
const verbatimTargets = new Set(pack.rows.filter((r) => (r.target.text ?? '').includes((r.source.text ?? '').trim())).map((r) => `${r.decision.targetOwner}#${r.decision.targetAnchor}`));
const key = (u) => `${u.path}#${u.anchor}`;
const unnamed = sorted.filter((u) => !targets.has(key(u)));
const rewritten = sorted.filter((u) => targets.has(key(u)) && !verbatimTargets.has(key(u)));
const truth = sorted.slice(0, 30);
const used = new Set();
const take = (arr, n) => arr.filter((u) => !used.has(key(u))).slice(0, n).map((u) => (used.add(key(u)), u));
const blocks = { unnamed: take(unnamed, 20), rewritten: take(rewritten, 20), random: take(sorted, 10) };
writeFileSync(new URL('./draws.json', import.meta.url), JSON.stringify({ seed: SEED, population: { files: files.length, units: units.length, unnamed: unnamed.length, rewritten: rewritten.length }, truth, blocks }, null, 1));
console.log({ files: files.length, units: units.length, unnamed: unnamed.length, rewritten: rewritten.length, truth: truth.length, blocks: Object.fromEntries(Object.entries(blocks).map(([k, v]) => [k, v.length])) });
