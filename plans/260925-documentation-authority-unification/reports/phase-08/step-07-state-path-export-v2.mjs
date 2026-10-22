// Bounded read-only export of path fields from folded fgOS state (owner L12-96 Q1=A).
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
const [,, codeRoot, fgosDir, repoRoot, out] = process.argv;
const { listWork } = await import(path.join(codeRoot, 'src/state/store.mjs'));
const { computeDecisionIndex } = await import(path.join(codeRoot, 'src/report/decision-index.mjs'));
const view = listWork(fgosDir);
const pick = (o, ks) => Object.fromEntries(ks.filter(k => o?.[k] !== undefined).map(k => [k, o[k]]));
const vals = x => Array.isArray(x) ? x : Object.values(x || {});
const docs = vals(view.docs).map(d => pick(d, ['docId','topicId','role','docLifecycle','currentPath','aliases','sourceCaptureIds']));
const topics = vals(view.topics).map(t => pick(t, ['topicId','purposeSlug','purposeTitle','status']));
const PATHRE=/(^|[\s(`'"])((?:docs\/|core\/skills\/|\.agents\/skills\/|plugins\/fgOS\/skills\/)[^\s`'")]+|AGENTS\.md|CLAUDE\.md)/g;
const pathy = o => { const out=[]; const walk=v=>{ if(typeof v==='string'){ for(const m of v.matchAll(PATHRE)) out.push(JSON.stringify(m[2])); } else if(v&&typeof v==='object') for(const x of Object.values(v)) walk(x); }; walk(o); return out; };
const decRows = Object.values(view.decisionsById || {}).flatMap(a => Array.isArray(a) ? a : [a]);
const decisions = (view.decisions || []).filter(d => d && d.kind !== 'engine' && typeof d.scope === 'string' && d.scope.trim()).map(d => pick(d, ['id','kind','scope','text','rationale','ts','relation','source']));
const decisionPathRows = decRows.map(d => ({ id: d?.id, ts: d?.ts, pathValues: [...new Set(pathy(d))].map(x => JSON.parse(x)) })).filter(d => d.pathValues.length);
const outcomes = Object.entries(view.outcomes || {}).map(([id, o]) => ({ id, ...pick(o, ['docPath','docType']), pathValues: [...new Set(pathy(o))].map(x => JSON.parse(x)) })).filter(o => o.docPath || o.pathValues.length);
const items = vals(view.work).map(w => {
  const o = pick(w, ['id','docsRef','refs','contentRoot','footprint','targets','holder','headAtTake','branchHeadAtTake','headAtReturn','branchHeadAtReturn','mergedInto','mergedSha']);
  if (w.outcome) o.outcome = pick(w.outcome, ['docPath','captureId','kind']);
  if (w.acceptance) o.acceptance = w.acceptance;
  return o;
}).filter(o => Object.keys(o).length > 1);
const invPath = path.join(repoRoot, 'docs/history/compound-learn-artifact-registry/reports/inventory-data.json');
let inventory = null;
if (fs.existsSync(invPath)) { const raw = fs.readFileSync(invPath); const j = JSON.parse(raw);
  const rows = (Array.isArray(j) ? j : (j.rows || j.items || j.artifacts || [])).map(r => pick(r, ['oldPath','targetPath','role','purposeSlug','topicId','framework','mode']));
  inventory = { path: 'docs/history/compound-learn-artifact-registry/reports/inventory-data.json', sha256: crypto.createHash('sha256').update(raw).digest('hex'), rows }; }
const di = computeDecisionIndex(repoRoot, fgosDir);
const decisionIndexParity = { indexPath: path.relative(repoRoot, di.indexPath), changed: di.changed, committedSha256: crypto.createHash('sha256').update(di.previousContent ?? '').digest('hex'), computedSha256: crypto.createHash('sha256').update(di.nextContent).digest('hex') };
const res = { contract: 'state-path-export.v2', takenAt: new Date().toISOString(), fgosDir, viewKeys: Object.keys(view).sort(),
  counts: { docs: docs.length, topics: topics.length, scopedDecisions: decisions.length, decisionsWithPaths: decisionPathRows.length, outcomesWithPaths: outcomes.length, workWithPaths: items.length, inventory: inventory?.rows.length ?? null },
  decisionIndexParity, docs, topics, decisions, decisionPathRows, outcomes, work: items, inventory };
fs.writeFileSync(out, JSON.stringify(res, null, 1) + '\n');
console.log(JSON.stringify(res.counts), JSON.stringify(decisionIndexParity), res.viewKeys.join(','));
