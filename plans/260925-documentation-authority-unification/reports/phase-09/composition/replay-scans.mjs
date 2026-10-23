// Records proof: existing parsers/generators over tracked scratch snapshots only.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import crypto from 'node:crypto';
const [current, candidate, exportFile] = process.argv.slice(2);
const load = (root, rel) => import(pathToFileURL(path.join(root, rel)).href);
const sha = text => crypto.createHash('sha256').update(text).digest('hex');
const walk = dir => !fs.existsSync(dir) ? [] : fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : e.isFile() ? [path.join(dir, e.name)] : []);
function sources(root, successor) {
  const files = [path.join(root, 'docs/backlog.md')];
  const specs = path.join(root, 'docs/specs');
  if (fs.existsSync(specs)) files.push(...fs.readdirSync(specs).filter(n => n.endsWith('.md')).map(n => path.join(specs, n)));
  if (successor) files.push(...walk(path.join(root, 'docs/platform')).filter(f => f.endsWith('/spec.md') || f.includes('/decisions/') && f.endsWith('.md') || f.endsWith('/platform/platform-foundations.md')));
  return [...new Set(files)].filter(f => fs.existsSync(f)).sort().map(f => ({ file: path.relative(root, f), lines: fs.readFileSync(f, 'utf8').split('\n') }));
}
const oldChecker = await load(current, 'scripts/check-decision-citation-drift.mjs');
const checker = await load(candidate, 'scripts/check-decision-citation-drift.mjs');
const beforeSources = sources(current, false), afterSources = sources(candidate, true);
const before = oldChecker.findCitationFormatFindings(beforeSources), after = checker.findCitationFormatFindings(afterSources);
// Strict line-content multiset: changed path/citation prose is NOT normalized
// into a false pass. This detects absent conserved units as well as rewrites.
const key = f => `${f.kind}:${f.id}:${f.text}`;
const counts = new Map();
for (const f of after) counts.set(key(f), (counts.get(key(f)) ?? 0) + 1);
const missing = [];
for (const f of before) {
  const n = counts.get(key(f)) ?? 0;
  if (n) counts.set(key(f), n - 1); else missing.push(f);
}
const beforeBaseline = fs.readFileSync(path.join(current, 'scripts/check-decision-citation-drift.baseline.json'));
const afterBaseline = fs.readFileSync(path.join(candidate, 'scripts/check-decision-citation-drift.baseline.json'));
if (!beforeBaseline.equals(afterBaseline)) throw Error('baseline changed');
const baseline = JSON.parse(afterBaseline);
const baselineNew = checker.findNewFindings(after, baseline);
// Every retained legacy file stays in the reader set, plus recursive child specs.
const retainedBefore = beforeSources.filter(s => fs.existsSync(path.join(candidate, s.file))).map(s => s.file);
const notScanned = retainedBefore.filter(f => !afterSources.some(s => s.file === f));
const { enumerateDocEntries } = await load(candidate, 'src/report/enduser-index-generate.mjs');
const { buildEnduserIndex } = await load(candidate, 'src/report/enduser-index.mjs');
const exp = JSON.parse(fs.readFileSync(exportFile, 'utf8'));
const view = { docs: Object.fromEntries(exp.docs.map(d => [d.docId, d])), topics: Object.fromEntries(exp.topics.map(t => [t.topicId, t])), outcomes: Object.fromEntries(exp.outcomes.map(o => [o.id, o])) };
const oldEntries = enumerateDocEntries(current), newEntries = enumerateDocEntries(candidate);
const oldIndex = buildEnduserIndex(oldEntries, view.outcomes, view), newIndex = buildEnduserIndex(newEntries, view.outcomes, view);
const classifyOld = (await load(current, 'scripts/generate-shipped-path-inventory.mjs')).classifyContractScope;
const classifyNew = (await load(candidate, 'scripts/generate-shipped-path-inventory.mjs')).classifyContractScope;
const classPaths = ['docs/specs', 'docs/specs/runner.md', 'docs/architect', 'docs/architect/component-boundary/README.md', 'docs/platform/runner/spec.md', 'docs/platform/runner/subcomponents/h-6979005beaf7/spec.md', 'docs/knowledge/example/guide.md'];
const classification = classPaths.map(p => ({ path: p, before: classifyOld(p), after: classifyNew(p) }));
let nearDuplicate;
try {
  const { DOCTOR_CHECKS } = await load(candidate, 'src/setup/checks.mjs');
  const check = DOCTOR_CHECKS.find(c => c.id === 'doc-near-duplicate');
  nearDuplicate = { before: await check.check(current), after: await check.check(candidate) };
} catch (error) { nearDuplicate = { error: String(error), status: 'infrastructure-or-import-blocked' }; }
const out = {
  citation: { beforeFiles: beforeSources.length, afterFiles: afterSources.length, beforeFindings: before.length, afterFindings: after.length, missingExactFindingOccurrences: missing, exactCoverageSuperset: missing.length === 0, retainedSourceFilesNotScanned: notScanned, baselineSha256: sha(beforeBaseline), baselineUnchanged: true, newUnbaselinedFindings: baselineNew.length, note: 'Strict finding-content coverage is not acceptance or a baseline rewrite; each miss needs source-unit carriage/rewrite review.' },
  enduser: { before: oldIndex.length, after: newIndex.length, beforeSha256: sha(JSON.stringify(oldIndex)), afterSha256: sha(JSON.stringify(newIndex)), removed: oldIndex.filter(e => !newIndex.some(n => n.docPath === e.docPath)), added: newIndex.filter(e => !oldIndex.some(n => n.docPath === e.docPath)), boundedExportSha256: sha(fs.readFileSync(exportFile)), noLiveStoreRead: true },
  shippedClassifier: { cases: classification, unchanged: classification.every(c => JSON.stringify(c.before) === JSON.stringify(c.after)) },
  nearDuplicate,
};
fs.writeFileSync(path.join(path.dirname(exportFile), 'scan-replay.json'), JSON.stringify(out, null, 2) + '\n');
console.log(JSON.stringify({ ...out, citation: { ...out.citation, missingExactFindingOccurrences: out.citation.missingExactFindingOccurrences.length }, enduser: { ...out.enduser, removed: out.enduser.removed.map(e => e.docPath), added: out.enduser.added.map(e => e.docPath) } }, null, 2));
process.exitCode = missing.length || notScanned.length || !out.shippedClassifier.unchanged || nearDuplicate.error ? 1 : 0;
