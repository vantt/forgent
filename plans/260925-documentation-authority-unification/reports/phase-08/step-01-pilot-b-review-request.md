# Independent review request: Pilot B original-edge joins

One logical request, one part, **47 entries (indexes 0–46)**. Authoring is complete; independent review has not started. Lead starts a fresh-context A38 reviewer with no author conversation or verdict hint, pins the actual runner commit, and supplies budget and the convention-resolved unique output path. Suggested unused report basename: `review-a38-step-01-pilot-b-joins-01.md` under this report directory; Lead resolves it before dispatch, without reusing any Step 0 report. This request does not start a reviewer.

## Inputs and boundary

Read the Phase 8 file's shared rules and Step 1, then owner-answers A49/L12-1..16. Step 0 is accepted under L12-16. Review **all 47** immutable queue-to-proposal joins in `step-01-pilot-b-proposals.json`, against `../phase-05/pilot-b-link-judgment-queue.json`. The proposal packet pins the original content commit `2d0d67838`, current input HEAD, current occurrence/context digests, original source lines, draft alias/preview inputs and actual target sections. Its Phase 6 correspondence records are prior classifications, never transferable acceptance. Production alias table remains empty.

The part payload consists of this request, the proposals JSON, `step-01-pilot-b-verification.json`, `step-01-pilot-b-light-tests.log`, and `step-01-pilot-b-ratchet.log`. Size/count receipt is recorded in progress. All five together must stay below **400,000 bytes** and this part below 60 entries; target/source documents are pinned repository inputs, not copied extra entries. There is no omitted second part.

Read-only review: no consumer, gate, checker, vocabulary, extractor, comparator, test, baseline, switchboard, skill, state or manifest edit. No fgOS CLI or git write. Scratch only `/tmp/fgos-work/`. Do not read secrets or `.fgos/`. Use portable Python/Node/git read commands below; no services, native/global sync, full suite or Rust build. The runner commits author files; a separate Lead-dispatched manifest-only accounting Unit follows the real author id (L12-11). These author receipts do not claim batch-end committed-byte acceptance.

## Acceptance contract

Mechanically inspect every original key `(index, consumerPath, referenceAsWritten, originalLine)`, original text, current occurrence, target existence and every non-null anchor using the unchanged APIs. Read each source context and the actual target passage/section, not just its hash or an alias destination. Shared target sections may be read once, but record an outcome for each join. Deep-read at least 10 entries plus every mismatch/high-risk entry; Step 1 still requires all 47 joins and target passages to be read. More than 3% rework expands the affected set to full review. One bounded re-review after fixes; unresolved findings return to Lead.

Confirm these independent concerns:

- Rows 3–5 and 31–39 carry L12-7 cutover-only timing. Row 5 is deliberately a no-op historical-baseline entry; do not force a historical citation rewrite merely because its timing bucket is cutover-only.
- Ten code/test/gate/fixture rows: inspect 0, 1–2, 40, 41–42, 43–45, 46 individually. Generator stays frozen in Phase 8. Synthetic conservation inputs, recorded fixture and frozen accounting keys preserve bytes; real-file retired-corpus reads require coherent assertion/heading parity at cutover. No approval to weaken gates.
- Rows 6–8 occur inside the OpenAPI document actually served at `/v1/contract`. Inspect proposed owner sections and deferred byte/schema/error parity requirements. Preserve Gateway CTR010 under A45; do not authorize renumbering or runtime changes.
- Rows 16 and 17 each park superseded wx/events.lock instructions. Compare Work-State RUL10 with Holder-lock §15 and L12-1. Lead A42 decides historical framing versus maintained guidance individually; do not infer parity from an existing anchor. Review these mappings and parking reasons without inventing an owner answer.
- Rows 9–15, 18–19, 21–28 preserve historical observations, metrics, quoted scope or dated sources. In particular 26 records old `statusAtAsk:doing` behavior, while today's candidate clamps `doing` to `todo`; 27 records the old liveness gap. Preservation must keep that historical meaning, not certify it as current guidance. Row 29 is a conditional example of legacy routing.
- Rows 20/30 propose operative-switchboard navigation; their future spec targets stay candidate. Both the route and referenced RUL/schema meanings must survive. No consumer rewrite is authorized until all 47 dispositions are reviewed and Lead parks resolved.
- Rows 36/37 have changed passage content since the queue: verify the unique state-core/registry prefixes and suffixes, never stale line-number matching. Row 36's one explicit path is the envelope citation, owned by the CLI contract; preserve updated hot-mutex prose. Other 45 rows retain original line content. Rows 44/45 are two original edges at one physical read; preserve both identities without fabricating different occurrences. Row 1 records both literals on its source line.

For each index report `ok`, `rework`, or `needs-Lead-judgment`, with source/target reference and concrete reason. Keep author parked rows individually visible. Report missing/extra joins, wrong target ownership, changed authority, failed proof, or unproved behavioral assumptions. A hash match is not a semantic approval. No readiness or migration acceptance is implied by this request.

## Portable mechanical replay

From repository root, this checks the 47 joins, source content, target bindings, planner records and protected input pins without writing files:

```sh
node --input-type=module <<'JS'
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {planLinkPass} from './scripts/doc-link-pass.mjs';
import {anchorExists} from './scripts/list-doc-anchors.mjs';
const P='plans/260925-documentation-authority-unification/';
const read=p=>fs.readFileSync(p,'utf8');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const d=JSON.parse(read(P+'reports/phase-08/step-01-pilot-b-proposals.json'));
const v=JSON.parse(read(P+'reports/phase-08/step-01-pilot-b-verification.json'));
const q=JSON.parse(read(d.queuePath));
assert.equal(q.length,47); assert.equal(d.rows.length,47);
assert.equal(new Set(d.rows.map(r=>JSON.stringify(r.key))).size,47);
assert.equal(hash(read(d.queuePath)),d.queueSha256);
assert.equal(hash(read(v.proposalsPath)),v.proposalsSha256);
const aliases=JSON.parse(read(P+'reports/phase-06/draft-alias-merged-step10.json')).entries;
const candidates=[...new Set(aliases.map(a=>a.toOwner))];
const sourceHeadings={'docs/specs/work-state.md':'spec-work-state-tầng-quản-việc-của-forgent'};
for(const [i,r] of d.rows.entries()){
 assert.equal(r.index,i); assert.deepEqual(r.originalQueueRow,q[i]);
 assert.deepEqual(r.key,{index:i,consumerPath:q[i].consumerPath,
  referenceAsWritten:q[i].referenceAsWritten,originalLine:q[i].line});
 const s=r.currentSource,t=read(s.path),lines=t.split('\n');
 assert.equal(hash(t),s.fileSha256);
 assert.equal(lines[s.line-1],s.lineText); assert.equal(hash(s.lineText),s.lineSha256);
 assert.equal(lines.slice(s.contextStartLine-1,s.contextEndLine).join('\n'),s.context);
 assert.equal(hash(s.context),s.contextSha256);
 for(const span of s.referenceSpans)assert.equal(
  s.lineText.slice(span.columnStart1-1,span.columnEndExclusive1-1),q[i].referenceAsWritten);
 const original=execFileSync('git',['show',d.originalContentCommit+':'+s.path],{encoding:'utf8',maxBuffer:64*1024*1024});
 assert.equal(original.split('\n')[r.originalOccurrence.resolvedLine-1],r.originalOccurrence.lineText);
 assert.equal(hash(r.originalOccurrence.lineText),r.originalOccurrence.sha256);
 for(const b of [r.targetEvidence,r.futureTargetEvidence,r.alternativeTargetEvidence].filter(Boolean)){
  const text=read(b.path); assert.equal(hash(text),b.fileSha256);
  if(b.anchor){assert.ok(anchorExists(text,b.anchor));
   assert.equal(hash(text.split('\n').slice(b.sectionStartLine-1,b.sectionEndLine).join('\n')),b.sectionSha256);}
 }
 const result=planLinkPass({file:s.path,text:t,aliases,candidates,sourceHeadings});
 const relevant=[...result.edits,...result.classified].filter(e=>e.line===s.line&&e.legacy===q[i].target);
 assert.deepEqual(relevant,r.planLinkPass.records);
}
for(const p of v.protectedPins){
 assert.equal(hash(fs.readFileSync(p.path)),p.sha256);
 assert.equal(hash(execFileSync('git',['show',d.inputHead+':'+p.path],{maxBuffer:64*1024*1024})),p.sha256);
}
for(const i of [3,4,5,31,32,33,34,35,36,37,38,39])assert.equal(d.rows[i].disposition,'cutover-patch-only');
const counts=Object.fromEntries(['rewrite','cutover-patch-only','preserve','parked'].map(k=>[k,d.rows.filter(r=>r.disposition===k).length]));
assert.deepEqual(counts,d.counts);
console.log(JSON.stringify({joins:47,counts,anchors:'all supplied anchors exist',protectedPins:v.protectedPins.length}));
JS
```

Run the unchanged light tests and ratchet; author outputs are the adjacent logs, not independent proof:

```sh
env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/doc-link-pass.test.mjs test/scripts/check-doc-candidate-status.test.mjs test/scripts/check-doc-constitution.test.mjs
node scripts/check-legacy-docs-ratchet.mjs
git diff --check
git diff --name-only HEAD
```

To read a bounded source/target orientation for a chosen entry, replace `16` below; then open the actual target file at the recorded complete section range:

```sh
python3 - 16 <<'PY'
import json,sys
p='plans/260925-documentation-authority-unification/reports/phase-08/'
r=json.load(open(p+'step-01-pilot-b-proposals.json'))['rows'][int(sys.argv[1])]
print(r['key']); print(r['currentSource']['context'])
for k in ['targetEvidence','futureTargetEvidence','alternativeTargetEvidence']:
 if r.get(k): print(k, json.dumps(r[k],ensure_ascii=False,indent=2))
PY
```

The two parked joins block completion of Step 1's settled matrix, not this bounded proposal handback or unrelated Step 2 work. Accounting and review are Lead follow-up actions; there is no self-acceptance here.
