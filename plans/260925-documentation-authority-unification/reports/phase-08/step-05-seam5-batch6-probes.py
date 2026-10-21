"""Exact-patch mutations; an R22 blocker never counts as a clean baseline."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,copy,importlib.util
P=pathlib.Path(__file__).resolve().parent;s=importlib.util.spec_from_file_location('j6',P/'step-05-seam5-batch6-check.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
rs=[json.loads(l) for fn in ['tests-judgment-batch5.jsonl','tests-judgment-batch6.jsonl'] for l in (P/'step-05-records'/fn).read_text().splitlines()];rcs=[x for fn in ['step-05-seam5-batch5-parity-receipts.json','step-05-seam5-batch6-parity-receipts.json'] for x in m.read(fn)['receipts']];results=[];positive=[]
for spec in m.read('step-05-seam5-batch6-cutover-specs.json')['patches']:
 r=next(r for r in rs if r['file']==spec['file']);rc=next(x for x in rcs if x['id']==spec['receiptId']);body=m.blob(r['authorInputCommit'],r['file']);assert m.assert_patch(r,rc,body);positive.append(r['file'])
 for field,value in [('sourceSha256','0'*64),('sourceMode','100755'),('rollbackDiff','invented'),('expectedAfterSha256','0'*64),('coCutPaths',[])]:
  bad=copy.deepcopy(r);bad[field]=value
  try:m.assert_patch(bad,rc,body)
  except Exception as e:results.append({'file':r['file'],'mutation':field,'rejected':True,'reason':type(e).__name__})
  else:results.append({'file':r['file'],'mutation':field,'rejected':False})
out={'passed':sum(x['rejected'] for x in results),'total':len(results),'positiveStructuralPatches':positive,'negativeProbes':results,'baseline':'R22 pending; no green full-baseline claim','failures':[x for x in results if not x['rejected']]};(P/'step-05-seam5-batch6-probes-result.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps(out));sys.exit(bool(out['failures']))
