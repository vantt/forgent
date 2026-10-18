# Bounded ordinary re-review: runner citation repairs and reproduction accounting

Author: `codex-session:fgos-run_unit-run-1792311894f50c@2026-10-18`. Independent reviewer required. Every entry is mandatory deep-read and pending; no approval, author verdict, seed or Phase 7 closure is supplied.

ONE logical N1 request under A46: `plans/260925-documentation-authority-unification/reports/phase-07/review-input-step-09-runner-n1-01/index.json` — **65 entries / 3 parts**, split 36 / 18 / 11. Each part is ≤60 entries and ≤400 KB, with a unique report name recorded in the index. Review exactly these entries. Do not reopen the deferred main-import accounting sets, run inventory/carry/full-suite jobs, or edit candidate content.

## 1. Exact scope

Content pin: `b919e2b9b53b2425cafef51d16f1327c81ecc68f`; prior pin: `e6b7efeece3d28f3bc9b47ecd3b748f54a8d90ed`. Full native identity-source diff contains ONLY `docs/platform/runner/architecture/h-7af1f0242611.md` and `docs/platform/runner/operations/h-51f5cd7279fd.md`. The Lead corrected citations at `7f7ae1ed0` and `b919e2b9b`. No candidate or Phase 7 plan byte changes in this package.

Part 01: eight native transitions; eight current occurrence/context bindings (five changed digests and three neighboring contexts); five displaced successor bindings; seven target decisions; three positional-gap supersessions; two document hashes; two cross-area citation bindings; one boundary/reader receipt. Stable heading identities keep native lineage. Three positional predecessors retain their own identities in gaps; their successors receive new native IDs. No identity transplant or approval carry. Candidate lists, A34 rows and identical-owner groups stay unchanged. Runner headings/anchors and the sealed reader key stay unchanged; citation-only edits change no reader answer or route.

Part 02: eighteen exact reproduction-pair rows. Sixteen previously reviewed pairs receive refreshed live manifest hashes. Two new rows bind `(9ac0f42fb4322880d3a6c4c3f57b8535fe25f25f, phase-07-cross-area-integrity-and-fresh-reader-review.md)`, one in each manifest. A first-parent non-merge scan through the content pin found no further tracked plan-file pair. Every earlier exception remains; no allowlist or baseline is enlarged. Check the new exact pairs and all refreshed live hashes.

Part 03: D/strict E against both priors and each prior separately; ratchet; unchanged comparator; the exact three doc-tooling tests; exact open-set comparison under A46. `step-09-runner-n1-open-sets.json` enumerates full current tuples. The comparison receipt explicitly rebinds the five previously recorded open runner occurrences to their N1 successors/digests, then compares every other tuple unchanged. This correspondence is not a new disposition, exception or carry category. No extra open or comparator error is allowed.

The earlier 143-part delivery and its three independent reviewer reports remain historical evidence. This request supersedes only affected current/displaced/native/document/decision/citation bindings, the sixteen reproduction live hashes and old assertions of the registry's entire pre-N1 hash. It carries no semantic approval to a new unit. Read original metadata at its original pin; the new boundary receipt proves the bounded registry delta. The old whole-index auth command is not a current-tree assertion after N1.

## 2. Light portable commands

From the repository root, authenticate parts, rows, committed native units, live files and exact reproduction pairs. This command writes nothing and runs no global generator. It proves mechanical binding only.

```sh
node --max-old-space-size=768 --input-type=module - plans/260925-documentation-authority-unification/reports/phase-07/review-input-step-09-runner-n1-01/index.json <<'JS'
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {execFileSync as x} from 'node:child_process';
const indexPath=process.argv[2],read=p=>JSON.parse(fs.readFileSync(p)),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),index=read(indexPath),gen=await import(path.join(process.cwd(),'scripts/generate-doc-inventory.mjs'));
const R='plans/260925-documentation-authority-unification/reports/phase-07',reg=read('plans/260925-documentation-authority-unification/reports/phase-06/working-identity-registry.json'),cache=new Map(),at=b=>b.keys.reduce((v,k)=>v[k],read(b.path));
function unit(pin,row){const key=pin+':'+row.sourcePath;if(!cache.has(key))cache.set(key,gen.extractMarkdownConservationUnits(x('git',['show',key],{encoding:'utf8'})));const hits=cache.get(key).filter(u=>u.anchor===row.sourceAnchor&&u.textDigest===row.sourceUnitDigest);assert.equal(hits.length,1);if(row.unitDigest)assert.equal(sha(hits[0].unitKind+'\n'+hits[0].textDigest),row.unitDigest);}
let checked=0;for(const part of index.parts){const p=path.join(path.dirname(indexPath),part.path);assert.equal(sha(fs.readFileSync(p)),part.sha256);assert(fs.statSync(p).size<=400000);const rows=read(p).entries;assert(rows.length<=60);for(const e of rows){const value=at(e.dataBinding);assert.equal(sha(JSON.stringify(value)),e.dataBinding.sha256,e.entry);if(e.snapshot)assert.deepEqual(value,e.snapshot);if(e.liveBinding)assert.deepEqual(at(e.liveBinding),e.liveBinding.snapshot);if(e.liveFile)assert.equal(sha(fs.readFileSync(e.liveFile.path)),e.liveFile.sha256);for(const p of e.unitPins||[])unit(p.commit,p.row);if(e.kind==='native-transition'){const c=e.snapshot;assert.deepEqual(reg[c.afterCollection].find(u=>u.claimId===c.claimId),c.after);if(c.before)unit(index.priorContentCommit,c.before);}if(e.kind==='reproduction-pair'){const p=e.snapshot;assert.equal(x('git',['merge-base','--is-ancestor',p.commit,index.contentCommit]).length,0);assert(x('git',['diff-tree','--no-commit-id','--name-only','-r',p.commit],{encoding:'utf8'}).split('\n').includes(p.path));const src=read(e.liveFile.path)[e.manifestKey]['checks.mjs'];const pairs=JSON.parse(src.match(/const exceptions=(\[.*?\]);\n/)[1]);assert(pairs.some(q=>JSON.stringify(q)===JSON.stringify(p)));}assert(e.mandatoryDeepRead);assert.equal(e.reviewStatus,'pending');checked++;}}
const carry=read(R+'/step-09-runner-n1-carry.json'),allowed=new Set(carry.changes.map(c=>c.claimId)),old=JSON.parse(x('git',['show',index.contentCommit+':plans/260925-documentation-authority-unification/reports/phase-06/working-identity-registry.json'],{maxBuffer:100*1024*1024}));
const oldIDs=new Set(),newIDs=new Set();for(const c of ['units','identityGaps','retiredUnits']){const after=new Map(reg[c].map(u=>[u.claimId,u]));for(const u of old[c]){oldIDs.add(u.claimId);if(!allowed.has(u.claimId))assert.deepEqual(after.get(u.claimId),u);}for(const u of reg[c])newIDs.add(u.claimId);}for(const id of oldIDs)assert(newIDs.has(id));for(const id of newIDs)assert(oldIDs.has(id)||allowed.has(id));
for(const c of ['documents','retiredDocuments']){const after=new Map(reg[c].map(u=>[u.path,u]));for(const u of old[c])if(!carry.identitySourceChanges.includes(u.path))assert.deepEqual(after.get(u.path),u);}
const q=read(R+'/step-09-rebind-units.json'),bindings=read(R+'/step-09-runner-n1-rebindings.json');for(const b of bindings.current){const us=cache.get(index.contentCommit+':'+b.path)||gen.extractMarkdownConservationUnits(x('git',['show',index.contentCommit+':'+b.path],{encoding:'utf8'})),t=b.after,i=us.findIndex(u=>u.unitKind===t[1]&&u.anchor===t[2]&&u.textDigest===t[5]);assert(i>=0);const ctx={previous:us[i-1]?.textDigest??null,next:us[i+1]?.textDigest??null,occurrence:t[6]};assert.deepEqual(ctx,b.context);assert.equal(sha(JSON.stringify([b.path,t[1],t[2],t[5],ctx])),t[7]);}
if(index.comparatorInputs){const {actual,expected,gate}=index.comparatorInputs;for(const p of [actual,expected,gate])assert.equal(sha(fs.readFileSync(p.path)),p.sha256);const zlib=await import('node:zlib'),hash=crypto.createHash('sha256');let bytes=0;for await(const chunk of fs.createReadStream(actual.path).pipe(zlib.createGunzip())){hash.update(chunk);bytes+=chunk.length;}assert.equal(hash.digest('hex'),actual.uncompressedSHA256);assert.equal(bytes,actual.uncompressedBytes);}
assert.equal(checked,index.entries);console.log(JSON.stringify({checked,parts:index.parts.length,mechanicalOnly:true,independentSemanticReview:'pending'}));
JS
```

Read the entire bounded content delta in both directions:

```sh
git diff e6b7efeec b919e2b9b -- docs/platform/runner/architecture/h-7af1f0242611.md docs/platform/runner/operations/h-51f5cd7279fd.md
```

Inspect runner decision headings at 2354/2416/2590/2897, role-grid text at 2477/2609, and CLI unknown-verb lines at 4426/4514 against the corrected citations. Read all three changed table/note blocks and both derived heading digests. The seven target decisions retain prior rationale as history and explicitly identify their current N1 rebind.

Reproduce the unchanged comparator from compressed complete applied rows (no projection or field dropping):

```sh
mkdir -p /tmp/fgos-work
S=$(mktemp -d /tmp/fgos-work/p7-runner-review-XXXXXX)
python3 - plans/260925-documentation-authority-unification/reports/phase-07/step-09-runner-n1-comparator-actual.json.gz "$S/actual.json" <<'PY'
import gzip, shutil, sys
with gzip.open(sys.argv[1], 'rb') as source, open(sys.argv[2], 'wb') as target:
    shutil.copyfileobj(source, target)
PY
node scripts/compare-doc-global-closure.mjs --gate plans/260925-documentation-authority-unification/reports/phase-07/step-09-runner-n1-E-both.json --actual "$S/actual.json" --expected plans/260925-documentation-authority-unification/reports/phase-07/step-09-runner-n1-expected.json
```

Expected: exit 1, `ok=false`, exactly the 24 errors in `step-09-accounting-comparison.json`. Do not report green comparison. The exact optional targeted-test command is in `step-09-runner-n1-doc-tests.json`; its fresh output directories are created under `/tmp/fgos-work/`. Full D/E reruns are producer receipts, not independent approval.

## 3. Reviewer outcome and remaining boundaries

For every entry record `ok`, `rework` or `hold` with evidence in the unique report path named by its part. Deep-read all entries; no sample or seed is needed. Verify content/context, retained predecessor identity, successor continuity and current digests. Reject any unexplained extra tuple or comparator error. Candidate-content defect: report and STOP under N1; do not repair it here. Ledger-only rework needs no re-carry.

A46 defers the recorded main-import sets to one Phase 9 accounting step: 35 file dispositions; 2,436 unknown/rationale-less claims (324 in the three declared post-B0 sources plus 2,112 others); 233 registry gaps; the existing holds, partial carries, identical-owner groups and unreferenced candidates; and fifteen non-candidate classification contexts behind the comparator errors. Current full tuple lists and the five N1 correspondences are explicit in the comparison receipts. No new open set is authorized. `P7-DOC-GAP-05` remains a Phase 9 pre-landing blocker, outside this request. No guard, carriage section, production file, test, gate, checker, vocabulary, baseline, extractor, comparator or generator changes.

The Lead owns independent review application, later checkpoint/truth sample, formal protected-file disposition and full-suite evidence. This request does not close Step 9 or Phase 7.
