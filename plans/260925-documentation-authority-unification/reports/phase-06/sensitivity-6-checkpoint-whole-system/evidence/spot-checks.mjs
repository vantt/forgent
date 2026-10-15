// Exact spot check (seeded 100 of the Unit-exact reviewed population) and seeded 10% digest recompute.
// Read only against the worktree; outputs into this scratch dir. Usage: node spot-checks.mjs <seed>
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const S = path.dirname(new URL(import.meta.url).pathname);
const seed = process.argv[2];
if (!seed) throw new Error('seed required');
const g = await import(path.join(root, 'scripts/check-doc-inventory-gates.mjs'));
const pin = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const R = 'plans/260925-documentation-authority-unification/reports/phase-06/';
const pop = JSON.parse(fs.readFileSync(R + 'checkpoint-6-reviewed-source-population.json', 'utf8'));
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const rank = (salt, id) => sha(`${seed}:${salt}:${id}`);
const unitsOf = g.buildConservationUnitLookup(root, pin);
const blob = new Map();
const lines = (p) => { if (!blob.has(p)) blob.set(p, execFileSync('git', ['show', `${pin}:${p}`], { encoding: 'utf8', maxBuffer: 1 << 28 }).split(/\r?\n/)); return blob.get(p); };

// Shard rows (rationale, ancestry) for every binding; every decision shard for target uniqueness.
const dir = 'plans/260925-documentation-authority-unification/ledger/decisions/';
const allRows = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).flatMap((f) => (JSON.parse(fs.readFileSync(dir + f, 'utf8')).claims || []).map((r) => ({ ...r, shardFile: f })));
const rowById = new Map(allRows.filter((r) => r.shardFile.startsWith('s6-')).map((r) => [r.claimId, r]));
const targetKeyCount = new Map();
for (const r of allRows) if (r.targetOwner) { const k = `${r.targetOwner}#${r.targetAnchor}`; targetKeyCount.set(k, (targetKeyCount.get(k) || 0) + 1); }

// Independent digest: recompute from blob lines with the extractor's published formula, not its stored digest.
function recompute(p, unit, units) {
  const L = lines(p);
  if (unit.unitKind !== 'heading') return sha(L.slice(unit.startLine - 1, unit.endLine).join('\n').trim());
  const i = units.indexOf(unit);
  const nextH = units.slice(i + 1).find((u) => u.unitKind === 'heading');
  const payload = L.slice(unit.startLine, nextH ? nextH.startLine - 1 : L.length).join('\n').trim();
  const nxt = units[i + 1] && units[i + 1].unitKind !== 'heading' ? recompute(p, units[i + 1], units) : '';
  return sha(`heading\n${unit.level}\n${unit.title}\n${sha(payload)}\n${nxt}`);
}
const anchorCheck = (p, a) => { try { execFileSync('node', ['scripts/list-doc-anchors.mjs', '--check', `${p}#${a}`], { stdio: 'pipe' }); return true; } catch { return false; } };

function check(b, { exact }) {
  const row = rowById.get(b.claimId);
  const su = unitsOf(b.sourcePath) || [], tu = unitsOf(b.targetOwner) || [];
  const s = su.find((u) => u.anchor === b.sourceAnchor), t = tu.find((u) => u.anchor === b.targetAnchor);
  const out = { claimId: b.claimId, source: `${b.sourcePath}#${b.sourceAnchor}`, target: `${b.targetOwner}#${b.targetAnchor}`, problems: [] };
  if (!s) out.problems.push('source unit missing'); if (!t) out.problems.push('target unit missing');
  if (!s || !t) return out;
  const sd = recompute(b.sourcePath, s, su), td = recompute(b.targetOwner, t, tu);
  out.sourceDigest = sd; out.targetDigest = td;
  if (sd !== s.textDigest || sd !== b.sourceUnitDigest || sd !== row.sourceUnitDigest) out.problems.push('source digest differs');
  if (td !== t.textDigest || td !== b.targetUnitDigest || td !== row.targetUnitDigest) out.problems.push('target digest differs');
  if (JSON.stringify(row.targetAncestry || []) !== JSON.stringify(t.ancestry)) out.problems.push('recorded target ancestry differs');
  if (!anchorCheck(b.sourcePath, b.sourceAnchor)) out.problems.push('source anchor check failed');
  if (!anchorCheck(b.targetOwner, b.targetAnchor)) out.problems.push('target anchor check failed');
  if ((targetKeyCount.get(out.target) || 0) !== 1) out.problems.push(`target named by ${targetKeyCount.get(out.target)} rows`);
  if (row.reviewStatus !== 'reviewed' || row.authoredBy === row.reviewedBy) out.problems.push('review status/independence');
  if (exact) {
    const c = g.classifyExactCarry(su, tu, { sourceAnchor: b.sourceAnchor, sourceUnitDigest: b.sourceUnitDigest });
    out.reproof = c.class; out.reproofReason = c.reason;
    out.fullUnitEqual = (s.sectionText ?? s.text) === (t.sectionText ?? t.text) && s.text === t.text;
    out.ancestryEqual = JSON.stringify(s.ancestry) === JSON.stringify(t.ancestry);
    out.sourceChars = s.text.trim().length;
    if (c.class !== 'Unit-exact') out.problems.push(`re-proof ${c.class}: ${c.reason}`);
    if (c.targetUnit && c.targetUnit.anchor !== b.targetAnchor) out.problems.push('exact match is a different target anchor');
    if (!out.fullUnitEqual) out.problems.push('full unit text differs');
  }
  return out;
}

const reviewed = pop.reviewedBindings;
const exactPop = reviewed.filter((b) => /^Unit-exact:/.test(rowById.get(b.claimId)?.rationale || ''));
const exactDraw = [...exactPop].sort((a, b) => rank('exact', a.claimId).localeCompare(rank('exact', b.claimId))).slice(0, 100);
const exactResults = exactDraw.map((b) => check(b, { exact: true }));
const n10 = Math.ceil(reviewed.length * 0.1);
const recDraw = [...reviewed].sort((a, b) => rank('recompute', a.claimId).localeCompare(rank('recompute', b.claimId))).slice(0, n10);
const recResults = recDraw.map((b) => check(b, { exact: false }));
// Also: full mechanical sweep of all 824 (digests, anchors excluded for time) to put every row on record.
const sweep = reviewed.map((b) => { const r = check(b, { exact: false }); return { claimId: r.claimId, problems: r.problems }; });
const out = { pin, seed, populations: { reviewed: reviewed.length, unitExactPrefixed: exactPop.length, exactDrawn: exactDraw.length, recomputeDrawn: recDraw.length },
  exact: { ids: exactDraw.map((b) => b.claimId), defects: exactResults.filter((r) => r.problems.length), results: exactResults },
  recompute: { ids: recDraw.map((b) => b.claimId), defects: recResults.filter((r) => r.problems.length), results: recResults },
  sweepDefects: sweep.filter((r) => r.problems.length) };
fs.writeFileSync(path.join(S, 'spot-checks.json'), JSON.stringify(out, null, 1) + '\n');
console.log(JSON.stringify({ populations: out.populations, exactDefects: out.exact.defects.length, recomputeDefects: out.recompute.defects.length, sweepDefects: out.sweepDefects.length }));
