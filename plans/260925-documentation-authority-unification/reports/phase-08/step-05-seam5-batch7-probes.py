"""R25 rejects every missing field, dishonest replay output and tampered pinned diff."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,copy,importlib.util
P=pathlib.Path(__file__).resolve().parent
s=importlib.util.spec_from_file_location('r25probe',P/'step-05-seam5-batch7-deferred.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
read=m.read;rs=[json.loads(l) for fn in ['tests-judgment-batch5.jsonl','tests-judgment-batch6.jsonl'] for l in (P/'step-05-records'/fn).read_text().splitlines()];rcs=[e for fn in ['step-05-seam5-batch5-parity-receipts.json','step-05-seam5-batch6-parity-receipts.json'] for e in read(fn)['receipts']];results=[];positives=[]
def probe(name,spec,r,rc):
 try:m.validate(spec,r,rc,spec['oldText'])
 except Exception as ex:results.append({'mutation':name,'file':r['file'],'rejected':True,'reason':str(ex) or type(ex).__name__})
 else:results.append({'mutation':name,'file':r['file'],'rejected':False})
for spec in read('step-05-seam5-batch6-cutover-specs.json')['patches']:
 r=next(x for x in rs if x['file']==spec['file']);rc=next(x for x in rcs if x['id']==spec['receiptId']);assert m.validate(spec,r,rc,spec['oldText']);positives.append(r['file'])
 for field in m.FIELDS:
  bad=copy.deepcopy(rc);del bad['deferredReplay'][field];probe('missing '+field,spec,r,bad)
 for field,value in [('status','pass'),('sourceSha256','0'*64),('owningTestCommand','node --test unrelated.mjs'),('assertionEffect',''),('expectedStrings',[]),('diff','invented'),('rollbackDiff','invented'),('coCutPaths',[]),('phase9Obligation','')]:
  bad=copy.deepcopy(rc);bad['deferredReplay'][field]=value;probe('corrupt '+field,spec,r,bad)
 bad=copy.deepcopy(rc);bad['comparison']['currentOutputSet']=bad['comparison']['candidateOutputSet']=[{'fake':'pass'}];probe('deferred replay fabricates outputs',spec,r,bad)
 bad=copy.deepcopy(rc);bad['proofs'][0].update(status='pass',exit=0);probe('deferred proof relabeled pass',spec,r,bad)
 if rc['deferredReplay']['assertedLines']:
  bad=copy.deepcopy(rc);bad['deferredReplay']['assertedLines']=[];probe('omitted changed assertions',spec,r,bad)
# The existing coverage owner checks removed occurrences against exact old
# lines and the real deletion diff, including repeated scalar operands.
s=importlib.util.spec_from_file_location('j4probe7',P/'step-05-seam5-batch4-judgment-check.py');j=importlib.util.module_from_spec(s);s.loader.exec_module(j)
newrs=[json.loads(l) for l in (P/'step-05-records/tests-judgment-batch7.jsonl').read_text().splitlines()];newrc=read('step-05-seam5-batch7-parity-receipts.json')['receipts'];r=next(r for r in newrs if any(e.get('historicalOnly',{}).get('removedOccurrence') for e in r['dynamicTraces']));rc=next(c for c in newrc if c['id']==r['receiptIds'][0]);selection={'files':[r['file']],'fileCount':1,'inputCommit':r['authorInputCommit']}
assert j.check(rs=[r],receipts=[rc],selection=selection,batch=7)['failureCount']==0
for field,value in [('text','invented original line'),('sha256','0'*64),('line',1)]:
 bad=copy.deepcopy(r);entry=next(e for e in bad['dynamicTraces'] if e.get('historicalOnly',{}).get('removedOccurrence'));entry['historicalOnly']['removedOccurrence'][field]=value
 out=j.check(rs=[bad],receipts=[rc],selection=selection,batch=7);caught=[e for e in out['failures'] if e['rule']=='j4-coverage'];results.append({'mutation':'forge removed occurrence '+field,'file':r['file'],'rejected':bool(caught),'reason':caught[:1]})
s=importlib.util.spec_from_file_location('ancestryProbe7',P/'step-05-seam5-batch7-relocation-audit.py');a=importlib.util.module_from_spec(s);s.loader.exec_module(a)
r=next(r for r in newrs if r['file']=='test/holder-lock/fences-v1-tombstone.test.mjs');bad=copy.deepcopy(r);e=next(e for e in bad['dynamicTraces'] if e['id']=='dynamic-020450');e['currentLine']=166
out=a.check([bad]);results.append({'mutation':'bind repeated scalar to wrong current occurrence','file':r['file'],'rejected':out['differenceCount']>0,'reason':out['differences']})
out={'passed':sum(e['rejected'] for e in results),'total':len(results),'positiveStructuralDeferrals':positives,'negativeProbes':results,'failures':[e for e in results if not e['rejected']],'scope':'R25 structural proof only; no owning test execution or full-suite readiness claim'}
(P/'step-05-seam5-batch7-probes-result.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps(out));sys.exit(bool(out['failures']))
