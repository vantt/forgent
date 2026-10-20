#!/usr/bin/env python3
"""Mutation probes against real current records, not alternate checker fixtures."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json,copy
P=pathlib.Path(__file__).resolve().parent
s=importlib.util.spec_from_file_location('q',P/'step-04-check.py');q=importlib.util.module_from_spec(s);s.loader.exec_module(q)
rs=q.load();positive=q.read('step-04-l12-60-check-result.json')
assert positive['failureCount']==0 and not positive['openLeadRulingEdges']
assert positive['checkerSha256']==q.m.sha((P/'step-04-check.py').read_bytes())
assert positive['recordFileHashes']=={p.name:q.m.sha(p.read_bytes()) for p in sorted((P/'step-04-records').glob('*.jsonl'))}
receipts=[]
def probe(name,r,mutate,expected):
 r=copy.deepcopy(r);mutate(r);c=q.Checker();c.record(r);checks={x['check'] for x in c.failures}
 receipts.append({'probe':name,'expectedCheck':expected,'observedChecks':sorted(checks),'pass':expected in checks,'rejected':bool(c.failures)})
source=next(r for r in rs if r['diff'] and r['sourceRenderProvenance'])
render=next(r for r in rs if any(e['renderOnly'] for e in r['edges']))
park=next(r for r in rs if any(e['disposition']=='parked' for e in r['edges']))
# Three L12-60 required guards, plus the inherited material adapter boundaries.
def copied(r):
 e=next(e for e in r['edges'] if e['disposition']=='parked');other='// unrelated file: registered-session merge-into-main exemption'
 old=e['parkSourceQuote'];e['parkSourceQuote']=other
 for field in ['reason','blockedReason','dependency']:e[field]=e[field].replace(repr(old),repr(other))
 e['searchWitness']['assessment']=e['searchWitness']['assessment'].replace(repr(old),repr(other))
probe('copied parked quote absent from own source span context',park,copied,'park-own-source-quote')
prose=next(r for r in rs if any(e['inventoryRefs'] and any(v['inventory'].startswith('step-02l') for v in e['inventoryRefs']) for e in r['edges']))
def missing(r):
 e=next(e for e in r['edges'] if any(v['inventory'].startswith('step-02l') for v in e['inventoryRefs']));r['edges'].remove(e)
probe('census prose edge neither slotted nor stepFiveExcluded',prose,missing,'census-edge-slot-or-step5')
probe('render join cannot be labelled patch with null target',render,lambda r:next(e for e in r['edges'] if e['renderOnly']).update(disposition='patch'),'render-join-not-patch')
probe('render diff cannot target generated path',source,lambda r:r.update(diff=r['diff'].replace('a/'+r['file'],'a/'+r['sourceRenderProvenance'][0]['renderFiles'][0]['path']).replace('b/'+r['file'],'b/'+r['sourceRenderProvenance'][0]['renderFiles'][0]['path'])),'render-path-diff-rejected')
probe('missing original census id',source,lambda r:r['edges'][0]['inventoryRefs'][0].update(edgeId='not-a-census-id'),'multi-census-id')
probe('source/render provenance digest mismatch',source,lambda r:r['sourceRenderProvenance'][0].update(sourceDigest='0'*64),'source-render-provenance')
probe('missing original census alias',source,lambda r:r['edges'][0].update(inventoryRefs=[]),'slot-join')
probe('wrong pinned source digest',source,lambda r:r.update(digest='0'*64),'author-pin-digest')
probe('render cannot carry its own hunk',render,lambda r:next(e for e in r['edges'] if e['renderOnly']).update(diffHunk='@@ -1 +1 @@'),'render-path-diff-rejected')
probe('Phase 8 apply-now forbidden',source,lambda r:r['edges'][0].update(timing='now'),'zero-apply-now')
probe('source span must match pinned bytes',source,lambda r:r['edges'][0]['sourceSpans'][0].update(text='not the source bytes'),'source-spans')
gap=next(r for r in rs if any(e.get('supplementalOccurrenceKey') for e in r['edges']))
probe('supplemental tuple cannot acquire invented census identity',gap,lambda r:next(e for e in r['edges'] if e.get('supplementalOccurrenceKey')).update(edgeId='invented-census-id'),'slot-join')
probe('explicit Step 5 exclusions required',source,lambda r:r.pop('stepFiveExcluded'),'census-edge-slot-or-step5')
# Positive ruling changes: first-class supplemental history is allowed; headerless source ownership remains.
for title,r in [('L12-60 supplemental history preserves without pending admission',next(r for r in rs if r['reviewSet']=='step04-033')),('L12-58 headerless plugin owns source',next(r for r in rs if r['file']=='plugins/fgOS/skills/cleanup-loop/SKILL.md'))]:
 c=q.Checker();c.record(r);receipts.append({'probe':title,'pass':not c.failures,'failures':c.failures})
body=q.m.blob(q.PIN,'docs/platform/platform-foundations.md').decode();receipts.append({'probe':'L12-54(2) law body stays live','pass':q.step4_carriage(body,222,'docs/platform/platform-foundations.md') is False})
body=q.m.blob(q.PIN,'docs/platform/packaging-distribution/spec.md').decode();receipts.append({'probe':'other retained source detail stays carriage','pass':q.step4_carriage(body,644,'docs/platform/packaging-distribution/spec.md') is True})
out={'authorPin':q.PIN,'positiveFailureCount':positive['failureCount'],'positiveSlots':positive['edges'],'positiveSourceRecords':positive['files'],'checkerSha256':positive['checkerSha256'],'recordFileHashes':positive['recordFileHashes'],'probes':receipts,'passed':sum(v['pass'] for v in receipts),'total':len(receipts),'allPassed':all(v['pass'] for v in receipts)}
q.save('step-04-l12-60-probes-result.json',out);print(json.dumps(out,ensure_ascii=False));raise SystemExit(not out['allPassed'])
