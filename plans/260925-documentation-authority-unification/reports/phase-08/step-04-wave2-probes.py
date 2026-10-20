#!/usr/bin/env python3
import sys
sys.dont_write_bytecode=True
import importlib.util,pathlib,copy,json
P=pathlib.Path(__file__).resolve().parent
s=importlib.util.spec_from_file_location('q',P/'step-04-check.py');q=importlib.util.module_from_spec(s);s.loader.exec_module(q)
q.PIN='d4a07d57c4d146b482d4a9e632dc02d8df42af79'
def main():
 rs=q.load();positive=q.read('step-04-wave2-check-result.json')
 assert positive['checkerSha256']==q.m.sha((P/'step-04-check.py').read_bytes())
 assert positive['recordFileHashes']=={f.name:q.m.sha(f.read_bytes()) for f in sorted((P/'step-04-records').glob('step04-*.jsonl'))}
 if positive['failureCount']:
  print(json.dumps(positive['failures'],ensure_ascii=False));return 1
 receipts=[]
 def probe(name,original,mutate,expected):
  r=copy.deepcopy(original);mutate(r);c=q.Checker();c.record(r);checks={x['check'] for x in c.failures};passed=expected in checks
  receipts.append({'probe':name,'expectedCheck':expected,'observedChecks':sorted(checks),'rejected':bool(c.failures),'pass':passed})
 source=next(r for r in rs if r['diff'] and r['sourceRenderProvenance'] and r['authorInputCommit']==q.PIN)
 probe('render-path diff rejected',source,lambda r:r.update(diff=r['diff'].replace('a/'+r['file'],'a/'+r['sourceRenderProvenance'][0]['renderFiles'][0]['path']).replace('b/'+r['file'],'b/'+r['sourceRenderProvenance'][0]['renderFiles'][0]['path'])),'render-path-diff-rejected')
 probe('missing census id rejected',source,lambda r:r['edges'][0]['inventoryRefs'][0].update(edgeId='not-a-census-id'),'multi-census-id')
 probe('provenance mismatch rejected',source,lambda r:r['sourceRenderProvenance'][0].update(sourceDigest='0'*64),'source-render-provenance')
 probe('missing original census alias rejected',source,lambda r:r['edges'][0].update(inventoryRefs=[]),'slot-join')
 probe('current digest mismatch rejected',source,lambda r:r.update(digest='0'*64),'author-pin-digest')
 render=next(r for r in rs if r['authorInputCommit']==q.PIN and any(e['renderOnly'] for e in r['edges']))
 probe('render occurrence hunk rejected',render,lambda r:next(e for e in r['edges'] if e['renderOnly']).update(diffHunk='@@ -1 +1 @@'),'render-path-diff-rejected')
 probe('Phase 8 apply-now rejected',source,lambda r:r['edges'][0].update(timing='now'),'zero-apply-now')
 probe('bad span rejected',source,lambda r:r['edges'][0]['sourceSpans'][0].update(text='not the source bytes'),'source-spans')
 gap=next(r for r in rs if r.get('censusAdmission'))
 probe('supplemental tuple may not acquire an invented census id',gap,lambda r:r['edges'][0].update(edgeId='invented-admitted-id'),'slot-join')
 probe('supplemental gap may not silently become a preserve',gap,lambda r:r['edges'][0].update(disposition='preserve'),'slot-join')
 headerless=next(r for r in rs if r['file'].startswith('plugins/') and not r['sourceRenderProvenance'])
 old=q.PIN;q.PIN=headerless['authorInputCommit'];c=q.Checker();c.record(headerless);q.PIN=old
 receipts.append({'probe':'L12-58(3) headerless plugin owns its source','pass':not c.failures,'failures':c.failures})
 body=q.m.blob(q.PIN,'docs/platform/platform-foundations.md').decode()
 receipts.append({'probe':'L12-54(2) candidate law body is live','pass':q.step4_carriage(body,222,'docs/platform/platform-foundations.md') is False})
 carriage=q.m.blob(q.PIN,'docs/platform/packaging-distribution/spec.md').decode()
 receipts.append({'probe':'other retained source detail remains carriage','pass':q.step4_carriage(carriage,644,'docs/platform/packaging-distribution/spec.md') is True})
 out={'authorInputCommit':q.PIN,'positiveFiles':positive['files'],'positiveSlots':positive['edges'],'positiveFailureCount':positive['failureCount'],'probes':receipts,'passed':sum(x['pass'] for x in receipts),'total':len(receipts),'allPassed':all(x['pass'] for x in receipts),'checkerSha256':q.m.sha((P/'step-04-check.py').read_bytes())}
 q.save('step-04-wave2-probes-result.json',out);print(json.dumps(out,ensure_ascii=False));return not out['allPassed']
if __name__=='__main__':raise SystemExit(main())
