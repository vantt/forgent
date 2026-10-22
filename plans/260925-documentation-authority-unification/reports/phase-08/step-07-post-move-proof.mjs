// Records proof only. Never execute a CLI, fold live state, or mutate the checkout.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { enumerateDocEntries } from '../../../../src/report/enduser-index-generate.mjs';
import { buildEnduserIndex } from '../../../../src/report/enduser-index.mjs';
import { computeKnowledgeProjection } from '../../../../src/report/knowledge-projection.mjs';
const root = process.cwd();
const here = path.join(root, 'plans/260925-documentation-authority-unification/reports/phase-08');
const pin = process.argv[2];
const scratch = '/tmp/fgos-work/integration-fix';
const sha = x => crypto.createHash('sha256').update(x).digest('hex');
const read = n => JSON.parse(fs.readFileSync(path.join(here, n), 'utf8'));
const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }).trim();
assert.match(pin ?? '', /^[0-9a-f]{40}$/);
assert.equal(git(['diff', '--name-only', pin, '--', 'docs', 'src/report', 'test/report']), '');
fs.mkdirSync(scratch, { recursive: true });
const tmp = fs.mkdtempSync(path.join(scratch, 'candidate-'));
const current = path.join(tmp, 'current'), candidate = path.join(tmp, 'candidate');
const retained = ['docs/decisions/index.md', 'docs/enduser-docs-index.json', 'docs/architecture-manifest.json'];
const moves = read('step-05-cutover-move-set.json').paths.filter(r => !retained.includes(r.oldPath));
const moving = new Set(moves.map(r => r.oldPath));
const tree = new Set(git(['ls-tree', '-r', '--name-only', pin, '--', 'docs']).split('\n'));
// Copy only tracked regular document payloads. Never traverse symlinks, state,
// env or secret files. Product docs are unchanged from the explicit source pin.
for (const file of tree) {
  if (/(?:^|\/)(?:\.fgos|secrets?[^/]*|[^/]*\.env)(?:$|[./])/i.test(file)) continue;
  if (!fs.lstatSync(path.join(root, file)).isFile()) continue;
  for (const dst of [current, candidate]) {
    fs.mkdirSync(path.dirname(path.join(dst, file)), { recursive: true });
    fs.copyFileSync(path.join(root, file), path.join(dst, file));
  }
}
const physicalMoves = [];
for (const row of moves) {
  const from = path.join(candidate, row.oldPath);
  if (!fs.existsSync(from) || !fs.statSync(from).isFile()) continue;
  const targets = [...new Set(row.moves.map(r => r.to).filter(Boolean))];
  const existingTargets = [];
  for (const target of targets) {
    assert.ok(target.startsWith('docs/') && !target.split('/').includes('..'));
    const to = path.join(candidate, target);
    if (fs.existsSync(to)) existingTargets.push({ path: target, identical: sha(fs.readFileSync(to)) === sha(fs.readFileSync(from)) });
    else {
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.copyFileSync(from, to);
    }
  }
  fs.unlinkSync(from);
  physicalMoves.push({ from: row.oldPath, targets, existingTargets });
}
const exp = read('step-07-state-path-export-v2.json');
const view = { docs: Object.fromEntries(exp.docs.map(d => [d.docId, d])), topics: Object.fromEntries(exp.topics.map(t => [t.topicId, t])), outcomes: Object.fromEntries(exp.outcomes.map(o => [o.id, o])) };
const beforeScan = enumerateDocEntries(current), afterScan = enumerateDocEntries(candidate);
const before = buildEnduserIndex(beforeScan, view.outcomes, view), after = buildEnduserIndex(afterScan, view.outcomes, view);
const beforeByPath = new Map(before.map(e => [e.docPath, e])), afterByPath = new Map(after.map(e => [e.docPath, e]));
const removed = before.filter(e => !afterByPath.has(e.docPath)).map(e => e.docPath);
const registry = computeKnowledgeProjection(view);
const matrix = read('step-07-consumer-cutover-matrix.json');
const records = new Map(matrix.recordCatalog.map(r => [r.id, fs.readFileSync(path.join(here, r.path), 'utf8').trim().split('\n').map(JSON.parse)]));
const baselineCommit = 'a0aa5a2acf49470e4b2bb9d21b7ae11a91842b47';
const baseline = JSON.parse(execFileSync('git', ['show', `${baselineCommit}:plans/260925-documentation-authority-unification/reports/phase-08/step-07-consumer-cutover-matrix.json`], { cwd: root, maxBuffer: 16 * 1024 * 1024 }));
const checks = [], overturns = [];
const agentRows = new Set(['r00764', 'r00732', 'r00761', 'r00762', 'r00731', 'r00733', 'r00737']);
const requiredPatches = new Set(['r01010', 'r01106', 'r01108', 'r01135', 'r01136', 'r00820', 'r01033', 'r01037', 'r04466', 'r14203']);
const moveByPath = new Map(moves.map(r => [r.oldPath, r]));
const sourceCache = new Map();
const pinnedFiles = new Set(git(['ls-tree', '-r', '--name-only', pin]).split('\n'));
const sourceOf = file => {
  assert.ok(!/(?:^|\/)(?:\.fgos|secrets?[^/]*|[^/]*\.env)(?:$|[./])/i.test(file));
  if (!sourceCache.has(file)) sourceCache.set(file, pinnedFiles.has(file) ? execFileSync('git', ['show', `${pin}:${file}`], { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }) : '');
  return sourceCache.get(file);
};
// A premise needs observable content, never a role label. Negative probes below
// exercise the same predicate used for every remaining moving-path preserve.
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
const manifest = fs.readFileSync(path.join(current, 'docs/enduser-docs-index.json'), 'utf8');
for (const row of baseline.consumerRows.filter(r => r[4] === 'preserved-history/fixture')) {
  const record = records.get(row[1])[row[2] - 1];
  const item = ['references', 'dynamicTraces', 'authorAddedReferences'].flatMap(f => record[f] ?? []).find(i => String(i.referenceId ?? i.id ?? i.edgeId) === row[3]);
  assert.ok(item, `missing owning record ${row[0]}`);
  const token = String(item.matchedExpression ?? item.pathOperand ?? item.targetSetOrConstruction ?? item.callSite?.[4] ?? '');
  const unwrappedToken = token.replace(/\r?\n\s*(?:\/\/|\*)?\s*/g, '');
  const hits = [...moving].filter(p => token.includes(p) || unwrappedToken.includes(p));
  const rootOperand = /docs\/(?:specs|architect)(?:\/|$)/.test(token);
  const statedReason = item.reason ?? record.mechanicalClosure?.reason;
  assert.ok(statedReason?.trim(), `preserve has no stated reason ${row[0]}`);
  if (!item.reason) {
    assert.equal(item.ruleId, record.mechanicalClosure.ruleId);
    assert.ok(!hits.length, `neutral proof intersects removed literal ${row[0]}`);
  }
  const source = sourceOf(record.file);
  const passage = item.passage ?? item.owningPassage ?? '';
  const candidatePaths = hits.map(p => ({ path: p, present: fs.existsSync(path.join(candidate, p)), targets: [...new Set(moveByPath.get(p).moves.map(m => m.to).filter(Boolean))] }));
  assert.ok(candidatePaths.every(p => !p.present), `moving target survived ${row[0]}`);
  let result = 'unchanged-operand-outside-move-set';
  let reason = 'The effective move simulation does not remove any literal target in this operand. This confirms only the existing reason’s operand-stability premise, not target existence or runtime parity.';
  let newDisposition = 'preserve';
  let remainingBlocker = null, owner = null, parkFamilyId = null;
  if (!pinnedFiles.has(record.file)) {
    assert.ok(!hits.length, `retired source needs individual moving-operand review ${row[0]}`);
    result = 'source-already-retired-at-pin'; reason = 'The physical source is already absent at the explicit pin; no live operand is retained or read in the simulated tree. Historical identity remains in its owning record.';
  } else if (row[6] === 'gen-enduser-index') {
    const line = (item.sourceSpans ?? [])[0]?.line;
    assert.ok(line, `missing generated span ${row[0]}`);
    const offset = manifest.split('\n').slice(0, line - 1).join('\n').length;
    const start = manifest.lastIndexOf('\n  {', offset) + 1;
    const end = manifest.indexOf('\n  }', offset) + 4;
    const entry = JSON.parse(manifest.slice(start, end));
    const next = afterByPath.get(entry.docPath);
    if (removed.includes(entry.docPath)) {
      newDisposition = 'patch'; result = 'generated-entry-physically-retires';
      reason = 'Legacy duplicate physically retires; enumerateDocEntries/buildEnduserIndex drops this entire entry, including its alias. Patch via existing generator, never a hand edit.';
    } else {
      assert.ok(next, `unregistered preserved slot ${row[0]}`);
      const field = item.projectionFieldAtSpan;
      assert.ok(field === 'aliases' ? next.aliases?.includes(token) : field === 'docPath' ? next.docPath === token : JSON.stringify(next).includes(token), `candidate operand changed ${row[0]}`);
      result = 'candidate-generated-slot-retains-operand'; reason = `Existing generator retains ${field} in surviving entry ${entry.docPath}.`;
    }
  } else if (row[6] === 'gen-doc-registry') {
    result = 'registry-input-and-projection-unchanged';
    reason = 'No registry currentPath moves; aliases/capture ids and topic free text are persisted historical identity. Physical retirement of another scanned duplicate does not mutate them.';
  } else if (row[6] === 'gen-decision-index') {
    result = 'state-wins-union-free-text-unchanged'; reason = 'Retained index plus unchanged exported decisions; free-text path mentions are not followed. See bounded union parity in export-v2-proof, not export-only parity.';
  } else if (hits.length && ['r26116', 'r26215', 'r26201'].includes(row[0])) {
    newDisposition = 'patch'; result = 'real-manifest-demo-moved'; reason = 'Regenerated manifest no longer has the old demo entry. Compose both assertions with the direct frontmatter hunk and REAL_DEMO_DOC_PATH.';
  } else if (token.includes('docs/contracts') && ['apps/fgos-gateway/src/gateway.rs', 'apps/fgos-gateway/src/mcp.rs'].includes(record.file) && (['fixture-writer', 'synthetic-fixture'].includes(item.role) || token === 'docs/contracts')) {
    newDisposition = 'patch'; result = 'gateway-fixture-co-cut'; reason = 'Existing prepared gateway-contract-reader-move already changes the real runtime contract path; fixture writers must co-change with it, including create_dir_all parent. Preserve is inconsistent with that co-cut.';
  } else if (hits.length && /(?:R26\/R28 pointer co-changes|L12-85\/R28: comment pointer co-changes)/.test(item.reason ?? '')) {
    newDisposition = 'patch'; result = 'conditional-r28-preserve-overturned'; reason = 'The member explicitly preserves only pending retention-or-move decision. Effective move set retires the operand; apply the recorded conditional pointer co-cut, without changing prose semantics.';
  } else if (!hits.length && rootOperand) {
    const reasonText = item.reason ?? statedReason;
    if (historicalPremise(reasonText, passage, source) || /(?:source-bound history|Measured dated proof|Original implementation\/proposal evidence|dated.*provenance)/i.test(reasonText) && source.includes(token)) {
      result = 'source-confirmed-historical-root-text'; reason = 'The root/glob is recorded historical design or proof text in the pinned source, not a claim that the retired root remains a live input.';
    } else if (record.file === 'scripts/check-legacy-docs-ratchet.mjs' && /Decision F owes retirement/.test(reasonText) && source.includes(token)) {
      assert.ok(read('step-07-integration-inputs.json').parkOwners.some(r => r.familyId === 'decision-f-ratchet-retirement'));
      result = 'source-confirmed-gate-retirement'; reason = 'This is the frozen ratchet’s old-root policy/comment; its named Decision F unit retires the script with the data, not just its directory operands.';
    } else if (/(?:test title is a baseline key|test title is a baseline|runtime-emitted test title is a baseline key)/i.test(reasonText) && source.split('\n').some(l => /test\(/.test(l) && l.includes(token))) {
      result = 'source-confirmed-test-title'; reason = 'The operand occurs in a test title, not a document reader; existing owning scan/co-cut obligations are unchanged.';
    } else if (/Frozen checker-read data/.test(reasonText) && /ONE retirement unit/.test(reasonText)) {
      assert.ok(source.includes(token)); result = 'frozen-data-retires-with-gate'; reason = 'The root/glob is frozen Decision F data and retires with its gate; no post-move root resolution is claimed.';
    } else if (/Synthetic refs input/.test(reasonText) && source.includes('docs/specs/widget.md') && !tree.has('docs/specs/widget.md')) {
      result = 'source-confirmed-synthetic-path'; reason = 'The widget path is a synthetic compared prompt string, absent in both trees; it is not a moved physical document.';
    } else if (/(?:legacy.*membership probe|fixed legacy-root identity|retirement-gate-identity|R13 frozen-gate identity|preserve exact gate identity|no moving target is constructed)/i.test(reasonText) && /(?:startsWith|LEGACY_ROOTS|replace|endsWith|prefix:|Forbidden edit)/.test(passage || source)) {
      result = 'source-confirmed-legacy-membership-token'; reason = 'The pinned migration gate compares inventory/path strings against the OLD root identity. Removing physical documents does not rename the old-root membership predicate; no retained-file claim is made.';
    } else if (/Frozen citation-checker scan description/.test(reasonText)) {
      newDisposition = 'parked'; result = 'unconfirmed-scan-description-parked'; owner = 'Citation-drift checker / area-spec owners (RULE follow-up is independent)'; parkFamilyId = 'citation-convention-and-scan'; remainingBlocker = 'Compose documented checker scan/defaults with the successor citation-convention-and-scan packet and prove at least current coverage.'; reason = 'The source comment describes a live scan of retiring roots, not dated text; conditional co-cut is still uncomposed.';
    } else {
      newDisposition = 'parked'; result = 'unconfirmed-root-premise-parked'; owner = 'Documentation consumer-composition owner'; parkFamilyId = 'readset-post-retirement-scan'; remainingBlocker = 'Confirm wrapped/root operand semantics and compose a conserved successor or historical-proof binding before cutover.'; reason = 'A root/wrapped operand needs its own source-confirmed premise; no role-based or outside-exact-file exemption is granted.';
    }
  } else if (agentRows.has(row[0])) {
    newDisposition = 'parked'; result = 'agents-cutover-packet'; owner = 'AGENTS.md cutover packet'; parkFamilyId = 'A34-AGENTS-root-pointers';
    remainingBlocker = 'AGENTS.md cutover packet (A34) rewrites root pointers to moved targets at cutover'; reason = 'L12-121 supersedes L12-60 for these seven root pointers only: the simulated move removes their current targets.';
  } else if (['r02200', 'r04182'].includes(row[0])) {
    const dependency = read('step-07-integration-inputs.json').parkOwners.find(r => r.rowId === 'r22947');
    assert.ok(dependency?.remainingBlocker && dependency.owner);
    newDisposition = 'parked'; result = 'architecture-map-dependent-park'; owner = dependency.owner; parkFamilyId = dependency.familyId; remainingBlocker = dependency.remainingBlocker;
    reason = 'Manifest map field is a live pointer to a removed target; it depends on the existing architecture-map content/heading-carriage park, not a retained-root premise.';
  } else if (requiredPatches.has(row[0])) {
    newDisposition = 'patch'; result = 'live-pointer-retention-premise-overturned'; reason = 'L12-121: present-tense pointer loses its literal target in the candidate tree; compose its exact successor replacement with every same-file hunk.';
  } else if (hits.length) {
    const frozenRatchet = ['scripts/check-legacy-docs-ratchet.baseline.json', 'scripts/check-legacy-docs-ratchet.exceptions.json'].includes(record.file);
    if (frozenRatchet && /ONE retirement unit/.test(item.reason) && /not survival after the cut/.test(item.reason)) {
      assert.ok(read('step-07-integration-inputs.json').parkOwners.some(r => r.familyId === 'decision-f-ratchet-retirement'));
      if (source.includes(token)) {
        result = 'frozen-data-retires-with-gate'; reason = 'Exact key remains in pinned frozen data; the named Decision F retirement park removes this data and its gate together. No claim that the key resolves after cutover.';
      } else {
        const origin = item.inventoryOrigins?.[0]?.pin;
        assert.match(origin ?? '', /^[0-9a-f]{40}$/);
        const prior = execFileSync('git', ['show', `${origin}:${record.file}`], { cwd: root, encoding: 'utf8' });
        assert.ok(prior.includes(token), `missing original frozen key ${row[0]}`);
        result = 'original-frozen-key-already-removed'; reason = 'Original frozen key is verified at its census pin and absent from current pinned bytes; no post-move lookup survives. This corrects the stale retained-key premise without rebasing or recreating data.';
      }
    } else if (source.includes('retiring `' + token + '`') && /list\/provenance carrier/.test(item.reason)) {
      result = 'source-confirmed-retirement-example'; reason = 'The literal is inside an example explicitly saying the old path retires in favor of docs/platform, not a surviving target claim.';
    } else if (historicalPremise(item.reason, passage, source) || (/dated design provenance/i.test(item.reason) && source.split('\n').some(l => l.includes(token) && /tsk-[a-z0-9]+/.test(l)))) {
      result = 'source-confirmed-historical-text'; reason = 'The pinned passage confirms the stated historical/capture premise; candidate target removal is expected for a historical coordinate, not an operative document read.';
    } else if (/explicit Document history|historical coordinates/i.test(item.reason) && /## Document history/i.test(source) && source.includes(token)) {
      result = 'source-confirmed-document-history'; reason = 'Original path is in the explicit Document history section, retained as capture identity after its physical duplicate retires.';
    } else if (record.file === 'dogfood-fixture/scenarios/expr-eval-chain.md' && /Immutable.*testbed fixture/s.test(item.reason) && source.includes(token)) {
      result = 'source-confirmed-immutable-fixture'; reason = 'Pinned immutable dogfood scenario records original MVP2 behavior; candidate removal changes no fixture input/read.';
    } else if (/literal performs no document read/.test(item.reason) && /RECONCILIATION/.test(source) && /rowsByPath/.test(source)) {
      result = 'source-confirmed-inventory-key'; reason = 'RECONCILIATION filters existing inventory rowsByPath; it does not dereference a candidate-tree document. The old inventory key is intentionally unchanged.';
    } else if (/test title is a baseline key/i.test(item.reason) && source.split('\n').some(l => /test\(/.test(l) && l.includes(token))) {
      result = 'source-confirmed-test-title'; reason = 'The exact operand occurs inside a test title, not a filesystem reader; the owning co-cut dependency remains separate.';
    } else if (/historical D1\/D4 proof/.test(item.reason) && source.includes(token) && /# Full suite.*D1/.test(source)) {
      result = 'source-confirmed-dated-proof'; reason = 'CI comment labels completed tsk-49r D1 proof rather than an input path; preserved as historical evidence.';
    } else if (/Document history/i.test(source) && record.file === 'docs/how-to/check-rollup-progress.md') {
      const history = source.slice(source.search(/## Document history/i));
      assert.ok(history.includes(token));
      result = 'source-confirmed-document-history'; reason = 'Correction to the old retained-path explanation: the operand is in explicit Document history and its surviving knowledge copy preserves capture identity, not a live path.';
    } else {
      // No untested role exemption. A live pointer patches only to one exact,
      // existing move destination; otherwise park with a concrete owner.
      const destinations = hits.flatMap(p => [...new Set(moveByPath.get(p).moves.map(m => m.to).filter(Boolean))]);
      const isGate = record.file.startsWith('scripts/generate-shipped-path-inventory.') || record.file.startsWith('scripts/verify-phase-') || record.file.endsWith('.baseline.json');
      const unique = hits.length === 1 && destinations.length === 1 && !destinations[0].includes('/proposals/') && fs.existsSync(path.join(candidate, destinations[0]));
      if (unique && !isGate && !record.file.startsWith('scripts/knowledge-migration.')) {
        newDisposition = 'patch'; result = 'additional-live-pointer-overturned'; reason = 'No historical/fixture premise is confirmed by source; the literal target disappears and has one exact existing successor. Compose the pointer patch, without semantic prose/schema changes.';
      } else {
        newDisposition = 'parked'; result = 'unconfirmed-preserve-premise-parked';
        owner = isGate ? 'Documentation-governance / successor-scan owner' : record.file.includes('knowledge') || record.file.includes('enduser') ? 'Knowledge-registry / documentation holder owner' : 'Documentation consumer-composition owner';
        parkFamilyId = isGate ? 'readset-post-retirement-scan' : 'post-move-holder-carriage';
        remainingBlocker = isGate ? 'Compose successor scan/classifier or frozen-data co-cut and prove coverage before retiring the named input paths; no rebaseline or gate bypass.' : 'Bind a conserved live holder and exact consumer co-cut before retiring the named source; a proposal or missing destination is not a live-pointer proof.';
        reason = 'The recorded preserve premise is not confirmed by the candidate tree/source. No unique eligible replacement is bound; preserve is overturned to an individually owned blocker.';
      }
    }
  }
  const check = { rowId: row[0], file: record.file, memberId: row[3], familyId: row[6], role: item.role, operandSha256: sha(token), statedReasonSha256: sha(statedReason), sourceSha256: sha(source), movingPaths: hits, candidatePaths, result, newDisposition, reason, remainingBlocker, owner, parkFamilyId };
  checks.push(check);
  if (newDisposition !== 'preserve') overturns.push({ ...check, token, sourceSpans: item.sourceSpans ?? [], record: matrix.recordCatalog.find(r => r.id === row[1]).path, recordLine: row[2] });
}
assert.equal(checks.length, 9650);
assert.equal(view.docs && exp.docs.filter(d => moving.has(d.currentPath)).length, 0);
const results = [...new Set(checks.map(r => r.result))].sort();
const digests = [...new Set(checks.flatMap(r => [r.statedReasonSha256, r.operandSha256, r.sourceSha256]))].sort();
const digestIds = new Map(digests.map((d, i) => [d, i]));
const out = { sourceCommit: pin, authority: 'L12-121', method: 'Physical tracked-doc scratch copy; remove effective oldPaths, retain existing destinations without invented carriage, then run the existing enumerator/pure generator. Rejoin ALL 9,650 preserves. Every member must state a reason; moving operands require source-confirmed history/fixture/key semantics or explicit whole-gate retirement. Role is diagnostic only, never an exemption. Any unconfirmed premise patches to an exact successor or parks with a named owner/blocker. No runtime/carriage parity claimed.', inputs: { baselineCommit, moveSetSha256: sha(fs.readFileSync(path.join(here, 'step-05-cutover-move-set.json'))), exportSha256: sha(fs.readFileSync(path.join(here, 'step-07-state-path-export-v2.json'))), baselineMatrixSha256: sha(JSON.stringify(baseline)) }, scan: { before: beforeScan.length, after: afterScan.length, beforeSha256: sha(JSON.stringify(before)), afterSha256: sha(JSON.stringify(after)), removed, added: after.filter(e => !beforeByPath.has(e.docPath)).map(e => e.docPath) }, registry: { currentPathMoves: 0, jsonSha256: sha(registry.jsonContent), mdSha256: sha(registry.mdContent) }, physicalMoveSchema: ['effectiveMoveIndex', 'existingDestinations: [uniqueTargetIndex, identicalBytes] (other targets copied)'], physicalMoves: physicalMoves.map(r => [moves.findIndex(m => m.oldPath === r.from), r.existingTargets.map(t => [r.targets.indexOf(t.path), t.identical])]), checkSchema: ['rowNumber (r + zero-pad to 5 digits)', 'resultIndex', 'statedReasonDigestIndex', 'operandDigestIndex', 'sourceDigestIndex'], digestCatalog: digests, resultCatalog: results, premiseDescriptions: Object.fromEntries(checks.map(r => [r.result, r.reason])), checks: checks.map(r => [Number(r.rowId.slice(1)), results.indexOf(r.result), digestIds.get(r.statedReasonSha256), digestIds.get(r.operandSha256), digestIds.get(r.sourceSha256)]), movingPreserveEvidence: checks.filter(r => r.newDisposition === 'preserve' && r.movingPaths.length && r.result !== 'frozen-data-retires-with-gate'), frozenRetirementEvidence: { family: 'decision-f-ratchet-retirement', rows: checks.filter(r => r.result === 'frozen-data-retires-with-gate').length, scope: 'Each row digest-joins its explicit whole-gate retirement reason, exact operand and pinned source; no per-role exemption or post-cut lookup guarantee.' }, negativePremiseProbes: 3, overturns, count: checks.length, remainingPreserves: checks.length - overturns.length, additionalOverturns: overturns.filter(r => !['r03739', 'r03718', 'r03900', 'r03806', 'r26116', 'r26215', 'r26201'].includes(r.rowId)).map(r => r.rowId), scope: 'No checkout move, live state, secrets, CLI, Git write, generator write or owning-test execution. Candidate conflicts remain carriage obligations; no overwrite of existing destination content.' };
fs.writeFileSync(path.join(here, 'step-07-post-move-proof.json'), JSON.stringify(out) + '\n');
fs.rmSync(tmp, { recursive: true });
console.log(JSON.stringify({ count: checks.length, removed, overturns: overturns.map(r => r.rowId), remainingPreserves: out.remainingPreserves }));
