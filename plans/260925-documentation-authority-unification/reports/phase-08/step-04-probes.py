#!/usr/bin/env python3
import sys
sys.dont_write_bytecode=True
import importlib.util,pathlib,copy,json
P=pathlib.Path(__file__).resolve().parent
s=importlib.util.spec_from_file_location('q',P/'step-04-check.py');q=importlib.util.module_from_spec(s);s.loader.exec_module(q)
def main():
 rs=q.load();positive=q.Checker().all(rs);q.save('step-04-wave1-check-result.json',positive)
 if positive['failureCount']:
  print(json.dumps(positive['failures'],ensure_ascii=False));return 1
 receipts=[]
 def probe(name,original,mutate,expected):
  r=copy.deepcopy(original);mutate(r);c=q.Checker();c.record(r);checks={x['check'] for x in c.failures};passed=expected in checks
  receipts.append({'probe':name,'expectedCheck':expected,'observedChecks':sorted(checks),'rejected':bool(c.failures),'pass':passed})
 source=next(r for r in rs if r['diff'] and r['sourceRenderProvenance'])
 probe('render-path diff rejected',source,lambda r:r.update(diff=r['diff'].replace('a/'+r['file'],'a/'+r['sourceRenderProvenance'][0]['renderFiles'][0]['path']).replace('b/'+r['file'],'b/'+r['sourceRenderProvenance'][0]['renderFiles'][0]['path'])),'render-path-diff-rejected')
 probe('missing census id rejected',source,lambda r:r['edges'][0]['inventoryRefs'][0].update(edgeId='not-a-census-id'),'multi-census-id')
 probe('provenance mismatch rejected',source,lambda r:r['sourceRenderProvenance'][0].update(sourceDigest='0'*64),'source-render-provenance')
 probe('missing original census alias rejected',source,lambda r:r['edges'][0].update(inventoryRefs=[]),'slot-join')
 probe('current digest mismatch rejected',source,lambda r:r.update(digest='0'*64),'author-pin-digest')
 render=next(r for r in rs if any(e['renderOnly'] for e in r['edges']))
 probe('render occurrence hunk rejected',render,lambda r:next(e for e in r['edges'] if e['renderOnly']).update(diffHunk='@@ -1 +1 @@'),'render-path-diff-rejected')
 probe('Phase 8 apply-now rejected',source,lambda r:r['edges'][0].update(timing='now'),'zero-apply-now')
 probe('bad span rejected',source,lambda r:r['edges'][0]['sourceSpans'][0].update(text='not the source bytes'),'source-spans')
 body=q.m.blob(q.PIN,'docs/platform/platform-foundations.md').decode()
 receipts.append({'probe':'L12-54(2) candidate law body is live','pass':q.step4_carriage(body,222,'docs/platform/platform-foundations.md') is False})
 carriage=q.m.blob(q.PIN,'docs/platform/packaging-distribution/spec.md').decode()
 receipts.append({'probe':'other retained source detail remains carriage','pass':q.step4_carriage(carriage,644,'docs/platform/packaging-distribution/spec.md') is True})
 out={'authorInputCommit':q.PIN,'positiveFiles':positive['files'],'positiveSlots':positive['edges'],'positiveFailureCount':positive['failureCount'],'probes':receipts,'passed':sum(x['pass'] for x in receipts),'total':len(receipts),'allPassed':all(x['pass'] for x in receipts),'checkerSha256':q.m.sha((P/'step-04-check.py').read_bytes())}
 q.save('step-04-wave1-probes-result.json',out);print(json.dumps(out,ensure_ascii=False));return not out['allPassed']
if __name__=='__main__':raise SystemExit(main())
