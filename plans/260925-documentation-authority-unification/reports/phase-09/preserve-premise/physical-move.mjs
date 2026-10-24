// Records-only adaptation of L12-121 step-07-post-move-proof.mjs.
// Reuses its retained exceptions, non-overwriting physical move and owning pure generators.
// Does NOT import that script: its top level writes phase-08 records, outside this brief.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { enumerateDocEntries } from '../../../../../src/report/enduser-index-generate.mjs';
import { buildEnduserIndex } from '../../../../../src/report/enduser-index.mjs';
import { computeKnowledgeProjection } from '../../../../../src/report/knowledge-projection.mjs';
const root = process.cwd();
const old = path.join(root, 'plans/260925-documentation-authority-unification/reports/phase-08');
const [pin, tmp] = process.argv.slice(2);
assert.match(pin, /^[0-9a-f]{40}$/);
assert.ok(tmp.startsWith('/tmp/fgos-work/w4-misc-fix-brief/'));
const sha = x => crypto.createHash('sha256').update(x).digest('hex');
const read = n => JSON.parse(fs.readFileSync(path.join(old,n), 'utf8'));
const git = args => execFileSync('git', args, { cwd: root, maxBuffer: 32 * 1024 * 1024 });
// Imports above are owning generators, not copies. Refuse a historical --pin
// whose source modules differ from these bytes instead of silently using HEAD.
assert.equal(git(['diff','--name-only',pin,'--','src']).toString(), '', 'generator source differs from --pin');
const current = path.join(tmp, 'current'), candidate = path.join(tmp, 'candidate');
const retained = ['docs/decisions/index.md', 'docs/enduser-docs-index.json', 'docs/architecture-manifest.json'];
const moves = read('step-05-cutover-move-set.json').paths.filter(r => !retained.includes(r.oldPath));
const tree = git(['ls-tree','-r',pin,'--','docs']).toString().trim().split('\n').map(l => { const [meta,file] = l.split('\t'); return {mode:meta.split(' ')[0],file}; });
for (const {mode,file} of tree) {
  if (mode !== '100644' && mode !== '100755') continue;
  if (/(?:^|\/)(?:\.fgos|secrets?[^/]*|[^/]*\.env)(?:$|[./])/i.test(file)) continue;
  const bytes = git(['show', `${pin}:${file}`]);
  for (const dst of [current,candidate]) {
    fs.mkdirSync(path.dirname(path.join(dst,file)), {recursive:true});
    fs.writeFileSync(path.join(dst,file),bytes);
  }
}
const physicalMoves = [];
for (const row of moves) {
  const from = path.join(candidate,row.oldPath);
  if (!fs.existsSync(from) || !fs.statSync(from).isFile()) continue;
  const targets = [...new Set(row.moves.map(r => r.to).filter(Boolean))];
  const existingTargets = [];
  for (const target of targets) {
    assert.ok(target.startsWith('docs/') && !target.split('/').includes('..'));
    const to = path.join(candidate,target);
    if (fs.existsSync(to)) existingTargets.push({path:target,identical:sha(fs.readFileSync(to)) === sha(fs.readFileSync(from))});
    else { fs.mkdirSync(path.dirname(to),{recursive:true}); fs.copyFileSync(from,to); }
  }
  fs.unlinkSync(from);
  physicalMoves.push({from:row.oldPath, targets, existingTargets});
}
// The older frozen move set predates newly imported area docs. Step 6 retires the
// whole roots, so test those physical removals too, without inventing destinations.
const additionalStep6Removals = [];
for (const {file} of tree) {
  if (!file.startsWith('docs/specs/') && !file.startsWith('docs/architect/')) continue;
  const from = path.join(candidate,file);
  if (fs.existsSync(from) && fs.statSync(from).isFile()) { fs.unlinkSync(from); additionalStep6Removals.push(file); }
}
const exp = read('step-07-state-path-export-v2.json');
const view = { docs:Object.fromEntries(exp.docs.map(d => [d.docId,d])), topics:Object.fromEntries(exp.topics.map(t => [t.topicId,t])), outcomes:Object.fromEntries(exp.outcomes.map(o => [o.id,o])) };
const beforeScan = enumerateDocEntries(current), afterScan = enumerateDocEntries(candidate);
const before = buildEnduserIndex(beforeScan,view.outcomes,view), after = buildEnduserIndex(afterScan,view.outcomes,view);
const registry = computeKnowledgeProjection(view);
// Copied unchanged from L12-121. Kept here as an explicit negative-probe control,
// not broadened to accept an entire file simply because it has a history label.
function historicalPremise(reason, passage, source) {
  const normalize = s => s.replace(/\s+/g, ' ').trim();
  if (!passage || !normalize(source).includes(normalize(passage))) return false;
  return /(?:dated|original implementation\/proposal evidence|explicit completed drift\/guard evidence|verbatim commit-message capture|historical coordinates|Document history|historical D1\/D4 proof|captured output|capture provenance|historical spelling|dated backlog provenance)/i.test(reason)
    && /(?:tsk-|D1|D4|D13|D16|D17|capture|commit|history|documented-only|prototype|proposal|design|compound|Before this item|— done|Phase 0[0-9])/i.test(passage);
}
assert.equal(historicalPremise('Retained native path stays literal', '// see docs/specs/x.md', '// see docs/specs/x.md'), false);
assert.equal(historicalPremise('dated design provenance; tree retires', '// tsk-40m design', '// tsk-40m design'), true);
assert.equal(historicalPremise('dated design provenance; tree retires', '// tsk-40m design', '// a different passage'), false);
assert.equal(historicalPremise('navigation', '// tsk-40m design', '// tsk-40m design'), false);
console.log(JSON.stringify({sourceCommit:pin, physicalMoves, additionalStep6Removals,
  scan:{before:beforeScan.length, after:afterScan.length, beforeSha256:sha(JSON.stringify(before)), afterSha256:sha(JSON.stringify(after)), removed:before.filter(e => !after.some(a => a.docPath === e.docPath)).map(e => e.docPath)},
  registry:{jsonSha256:sha(registry.jsonContent),mdSha256:sha(registry.mdContent)},
  negativePremiseProbes:[{case:'false retained-pointer reason',rejected:true},{case:'mismatching historical passage',rejected:true},{case:'navigation reason over historical-looking text',rejected:true}],
  reusedProofSha256:sha(fs.readFileSync(path.join(old,'step-07-post-move-proof.mjs')))}));
