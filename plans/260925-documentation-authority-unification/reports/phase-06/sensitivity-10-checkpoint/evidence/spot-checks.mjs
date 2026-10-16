// Exact spot check: seeded 100 distinct script-proven rows of checkpoint-10-source-population.json, each
// re-proven independently (blob lines, published digest formula, anchors, ancestry, ownership); and a seeded
// ceil(10%) independent digest recompute over all reviewed rows, plus a full mechanical sweep.
// Run from the worktree root (read only): node spot-checks.mjs <seed> --output-dir <OUT>
import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
const seed = process.argv[2];
const OUT = process.argv[process.argv.indexOf('--output-dir') + 1];
if (!seed || !OUT?.startsWith('/tmp/fgos-work/')) throw new Error('usage: spot-checks.mjs <seed> --output-dir /tmp/fgos-work/...');
const root = process.cwd();
const P = 'plans/260925-documentation-authority-unification/';
const R = P + 'reports/phase-06/';
const g = await import(root + '/scripts/check-doc-inventory-gates.mjs');
const pop = JSON.parse(fs.readFileSync(R + 'checkpoint-10-source-population.json', 'utf8'));
const pin = pop.pin;
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const rank = (salt, id) => sha(`${seed}:${salt}:${id}`);
const unitsOf = g.buildConservationUnitLookup(root, pin);
const blob = new Map();
const raw = new Map();
const rawOf = (p) => { if (!raw.has(p)) raw.set(p, execFileSync('git', ['show', `${pin}:${p}`], { encoding: 'utf8', maxBuffer: 1 << 30 })); return raw.get(p); };
const lines = (p) => { if (!blob.has(p)) blob.set(p, execFileSync('git', ['show', `${pin}:${p}`], { encoding: 'utf8', maxBuffer: 1 << 28 }).split(/\r?\n/)); return blob.get(p); };
const blobId = (p) => { try { return execFileSync('git', ['rev-parse', `${pin}:${p}`], { encoding: 'utf8' }).trim(); } catch { return null; } };
const exceptions = fs.readFileSync(R + 'identical-unit-exceptions.json', 'utf8');
const all = pop.reviewed;
const targetCount = new Map();
for (const r of all) if (r.targetOwner) { const k = `${r.targetOwner}#${r.targetAnchor}`; targetCount.set(k, (targetCount.get(k) || 0) + 1); }
function recompute(p, unit, units) {
  // Non-markdown files are one file-block unit whose digest is sha256 of the whole blob (extractMixedFileConservationUnit).
  if (unit.unitKind === 'file-block') return sha(rawOf(p));
  const L = lines(p);
  if (unit.unitKind !== 'heading') return sha(L.slice(unit.startLine - 1, unit.endLine).join('\n').trim());
  const i = units.indexOf(unit);
  const nextH = units.slice(i + 1).find((u) => u.unitKind === 'heading');
  const payload = L.slice(unit.startLine, nextH ? nextH.startLine - 1 : L.length).join('\n').trim();
  const nxt = units[i + 1] && units[i + 1].unitKind !== 'heading' ? recompute(p, units[i + 1], units) : '';
  return sha(`heading\n${unit.level}\n${unit.title}\n${sha(payload)}\n${nxt}`);
}
const anchorCheck = (p, a) => { if (!p.toLowerCase().endsWith('.md')) { try { execFileSync('git', ['cat-file', '-e', `${pin}:${p}`]); return a === 'file-block'; } catch { return false; } } try { execFileSync('node', ['scripts/list-doc-anchors.mjs', '--check', `${p}#${a}`], { stdio: 'pipe' }); return true; } catch { return false; } };
function check(b, { exact, anchors }) {
  const su = unitsOf(b.sourcePath) || [], tu = b.targetOwner ? unitsOf(b.targetOwner) || [] : [];
  const s = su.find((u) => u.anchor === b.sourceAnchor), t = b.targetOwner ? tu.find((u) => u.anchor === b.targetAnchor) : null;
  const out = { claimId: b.claimId, disposition: b.disposition, source: `${b.sourcePath}#${b.sourceAnchor}`, target: b.targetOwner ? `${b.targetOwner}#${b.targetAnchor}` : null, problems: [] };
  if (!s) out.problems.push('source unit missing');
  if (b.targetOwner && !t) out.problems.push('target unit missing');
  if (!s || (b.targetOwner && !t)) return out;
  const sd = recompute(b.sourcePath, s, su);
  out.sourceDigest = sd;
  if (sd !== s.textDigest || sd !== b.sourceUnitDigest) out.problems.push('source digest differs');
  if (t) {
    const td = recompute(b.targetOwner, t, tu);
    out.targetDigest = td;
    if (td !== t.textDigest || !b.targetUnitDigest || !td.startsWith(b.targetUnitDigest)) out.problems.push('target digest differs');
    if (b.targetAncestry && JSON.stringify(b.targetAncestry) !== JSON.stringify(t.ancestry)) out.problems.push('recorded target ancestry differs');
  }
  if (anchors) {
    if (!anchorCheck(b.sourcePath, b.sourceAnchor)) out.problems.push('source anchor check failed');
    if (t && !anchorCheck(b.targetOwner, b.targetAnchor)) out.problems.push('target anchor check failed');
  }
  if (b.reviewStatus !== 'reviewed' || (b.authoredBy || '').replace(/@.*/, '') === (b.reviewedBy || '').replace(/^reviewer:/, '').replace(/@.*/, '')) out.problems.push('review status/independence');
  if (exact) {
    out.fullUnitEqual = (s.sectionText ?? s.text) === (t.sectionText ?? t.text) && s.text === t.text;
    out.ancestryEqual = JSON.stringify(s.ancestry) === JSON.stringify(t.ancestry);
    out.sourceChars = s.text.trim().length;
    out.targetMultiplicity = targetCount.get(out.target);
    if (!out.fullUnitEqual) out.problems.push('full unit text differs');
    if (b.authoredBy !== 'script:propose-doc-decisions' || b.reviewedBy !== 'script:check-doc-inventory-gates') out.problems.push('not a script identity pair');
    if (b.disposition === 'delete-as-duplicate') {
      out.proof = 'mirror';
      const sb = blobId(b.sourcePath), tb = blobId(b.targetOwner);
      out.sourceBlob = sb; out.targetBlob = tb;
      if (!sb || sb !== tb) out.problems.push('mirror blobs differ');
      if (!b.rationale.includes(sb)) out.problems.push('rationale blob differs');
      if (s.anchor !== t.anchor) out.problems.push('mirror anchor differs');
      if (!out.ancestryEqual) out.problems.push('ancestry differs');
      if (out.targetMultiplicity !== 1) out.problems.push(`target named by ${out.targetMultiplicity} rows`);
    } else {
      out.proof = 'unit-exact';
      const c = g.classifyExactCarry(su, tu, { sourceAnchor: b.sourceAnchor, sourceUnitDigest: b.sourceUnitDigest });
      out.reproof = c.class; out.reproofReason = c.reason;
      if (c.class !== 'Unit-exact') out.problems.push(`re-proof ${c.class}: ${c.reason}`);
      if (c.targetUnit && c.targetUnit.anchor !== b.targetAnchor) out.problems.push('exact match is a different target anchor');
      if (out.sourceChars < 40) out.problems.push('source under 40 characters');
      if (!out.ancestryEqual) out.problems.push('ancestry differs');
      if (out.targetMultiplicity !== 1 && !exceptions.includes(b.targetUnitDigest)) out.problems.push(`target named by ${out.targetMultiplicity} rows, not an exception`);
    }
  }
  return out;
}
const scriptPop = all.filter((b) => b.checkpointClass === 'script-proven');
const exactDraw = [...scriptPop].sort((a, b) => rank('exact', a.claimId).localeCompare(rank('exact', b.claimId))).slice(0, 100);
const exactResults = exactDraw.map((b) => check(b, { exact: true, anchors: true }));
const n10 = Math.ceil(all.length * 0.1);
const recDraw = [...all].sort((a, b) => rank('recompute', a.claimId).localeCompare(rank('recompute', b.claimId))).slice(0, n10);
const recResults = recDraw.map((b) => check(b, { exact: false, anchors: true }));
const sweep = all.map((b) => { const r = check(b, { exact: false, anchors: false }); return { claimId: r.claimId, problems: r.problems }; });
const strata = (rows) => rows.reduce((a, r) => ((a[r.disposition] = (a[r.disposition] || 0) + 1), a), {});
const out = { pin, seed, populations: { reviewed: all.length, scriptProven: scriptPop.length, scriptProvenStrata: strata(scriptPop), exactDrawn: exactDraw.length, exactDrawStrata: strata(exactDraw), recomputeDrawn: recDraw.length, recomputeDrawStrata: strata(recDraw) },
  exact: { ids: exactDraw.map((b) => b.claimId), defects: exactResults.filter((r) => r.problems.length), results: exactResults },
  recompute: { ids: recDraw.map((b) => b.claimId), defects: recResults.filter((r) => r.problems.length), results: recResults.map((r) => ({ claimId: r.claimId, sourceDigest: r.sourceDigest, targetDigest: r.targetDigest, problems: r.problems })) },
  sweepDefects: sweep.filter((r) => r.problems.length) };
fs.writeFileSync(OUT + '/spot-checks.json', JSON.stringify(out, null, 1) + '\n');
console.log(JSON.stringify({ populations: out.populations, exactDefects: out.exact.defects.length, recomputeDefects: out.recompute.defects.length, sweepDefects: out.sweepDefects.length }));
