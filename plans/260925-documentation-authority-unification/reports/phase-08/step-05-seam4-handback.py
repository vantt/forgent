"""Bind the records-only handback, all changed items and unreviewed Lead windows."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,collections,copy,hashlib,importlib.util,subprocess
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
def mod(n):
 s=importlib.util.spec_from_file_location(n,P/(n+'.py'));m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
rules=mod('step-05-admission-rules');sha=lambda v:hashlib.sha256(v.encode() if isinstance(v,str) else v).hexdigest()
def save(n,x):(P/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
pinfile=P/'step-05-seam4-rereview-list.json'
BASE=json.loads(pinfile.read_text()).get('inputCommit') if pinfile.exists() else None
BASE=BASE or subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
rs=[json.loads(l) for f in sorted((P/'step-05-records').glob('*.jsonl')) for l in f.read_text().splitlines()]
before=[]
for f in sorted((P/'step-05-records').glob('*.jsonl')):
 raw=subprocess.check_output(['git','show',BASE+':'+str(f.relative_to(ROOT))],cwd=ROOT,text=True);before.extend(json.loads(l) for l in raw.splitlines())
oldby={r['file']:r for r in before};by={r['file']:r for r in rs}
# Every original carry row remains intact; record only the changed final outcomes.
carry=json.loads((P/'step-05-seam4-inherited-carries.json').read_text());ds={d['id']:d for r in rs for d in r['dynamicTraces']}
changes=[{'id':x['id'],'from':[x['admission'],x['disposition']],'to':[ds[x['id']]['admission'],ds[x['id']]['disposition']],'ruling':'L12-72','reason':ds[x['id']]['reason']} for x in carry['pilotOriginal165'] if (x['admission'],x['disposition'])!=(ds[x['id']]['admission'],ds[x['id']]['disposition'])];save('step-05-seam4-carry-corrections.json',{'changes':changes})
canonical=[];changed=[];sourcefiles=set();generatedfiles=set();outcomes=[]
for r in rs:
 old=oldby[r['file']];a={rules.idof(e):e for e in rules.allitems(old)};b={rules.idof(e):e for e in rules.allitems(r)}
 delta=[{'id':key,'changedFields':sorted(k for k in set(a.get(key,{}))|set(e) if a.get(key,{}).get(k)!=e.get(k)),'from':None if key not in a else [a[key]['admission'],a[key]['disposition']],'to':[e['admission'],e['disposition']]} for key,e in b.items() if a.get(key)!=e]
 if delta:
  changed.append({'file':r['file'],'changes':delta});(generatedfiles if r.get('generated') else sourcefiles).add(r['file'])
  outcomes.extend({'file':r['file'],**d} for d in delta if d['from'] is None or d['from']!=d['to'])
 canonical.append({'file':r['file'],'generated':bool(r.get('generated')),'itemsChanged':bool(delta),'recordSha256':sha(json.dumps(r,ensure_ascii=False,separators=(',',':'))),'authorInputCommit':r['authorInputCommit'],'sourceSha256':r['sourceSha256']})
# The Lead's light JSON payloads were temporary, not committed. Replay the
# unchanged packer's partition algorithm against committed BEFORE records in
# scratch, stopping before its output loop; never repack current review payloads.
import re
scratch=pathlib.Path('/tmp/fgos-work/s4-baseline-records');scratch.mkdir(parents=True,exist_ok=True)
for f in sorted((P/'step-05-records').glob('generators-*.jsonl')):
 (scratch/f.name).write_bytes(subprocess.check_output(['git','show',BASE+':'+str(f.relative_to(ROOT))],cwd=ROOT))
code=(P/'step-05-seam4-window-review/pack.py').read_text();code=code[:code.index('for i,p in enumerate(parts,1):')];code=re.sub(r'^RD=.*$',"RD="+repr(str(scratch)+'/'),code,flags=re.M)
namespace={};saved=sys.argv;sys.argv=['pack.py','/tmp/fgos-work']
try:exec(compile(code,'Lead packer partition replay','exec'),namespace)
finally:sys.argv=saved
unreviewed=set();parts=[]
assert len(namespace['parts'])==29,len(namespace['parts'])
for i,items in enumerate(namespace['parts'],1):
 if i<12:continue
 paths=sorted({it['file'] for it in items});unreviewed.update(paths);parts.append({'part':i,'payload':f's4-src-p{i:02}.json','provenance':'Replayed original Lead packer partition against committed records before this turn; transient payload is not present in checkout.','files':paths})
sourcefiles.update(unreviewed)
source_records=sorted(sourcefiles)
composites={f:[c['path'] for c in by[f]['wholeFileReadEvidence']['constituents']] for f in sourcefiles if ';' in f}
for f,paths in composites.items():sourcefiles.remove(f);sourcefiles.update(paths)
listing={'inputCommit':BASE,'ruling':'L12-72 R1','method':'Lead repacks exact merged ±40-line source windows with step-05-seam4-window-review/pack.py; generated outputs checked per file. Historical streaming packets are retained with their original hashes; they are not current semantic acceptance.','reviewStatus':'pending Lead repack and independent semantic review','sourceRecords':source_records,'compositeLocators':composites,'files':sorted(sourcefiles),'sourceFiles':sorted(sourcefiles),'sourceFileCount':len(sourcefiles),'changedSourceFiles':sorted({e['file'] for e in changed if not by[e['file']].get('generated')}),'changedGeneratedFiles':sorted(generatedfiles),'unreviewedSourceFiles':sorted(unreviewed),'unreviewedParts':parts,'canonicalRecords':canonical,'changes':changed}
save('step-05-seam4-rereview-list.json',listing)
# Original records use final exact operation coordinates only to compare their
# prior outcomes; no prior admission or disposition is overwritten for counting.
baseline=copy.deepcopy(before)
for r in baseline:
 final={rules.idof(e):e for e in rules.allitems(by[r['file']])}
 for d in r['dynamicTraces']:
  if final[d['id']].get('operationWitness'):d['operationWitness']=final[d['id']]['operationWitness']
initial=rules.check(baseline);counter=collections.Counter(e['rule'] for e in initial['failures']);final=rules.check(rs)
metrics={'inputCommit':BASE,'initialHitCounts':{key:counter[key] for key in rules.RULES},'counting':'Initial structural violations, one check per tuple/reference, or all unordered overlapping-operation pairs for (a); dynamic operation coordinates come from verified final own-source witnesses. These counts are not unique files and not additive defects.','canonicalRecords':len(rs),'literalReferences':sum(len(r['references']) for r in rs),'dynamicTuples':sum(len(r['dynamicTraces']) for r in rs),'authorAddedReferences':sum(len(r.get('authorAddedReferences',[])) for r in rs),'changedItemCount':sum(len(e['changes']) for e in changed),'outcomeChangeCount':len(outcomes),'changedSourceFiles':len(listing['changedSourceFiles']),'changedGeneratedFiles':len(generatedfiles),'rereviewSourceFiles':len(sourcefiles),'unreviewedSourceFiles':len(unreviewed),'finalAdmissionFailureCount':final['failureCount'],'checks':final['checks'],'outcomeChanges':outcomes,'finalFailures':final['failures'],'reviewStatus':'pending Lead repack and independent semantic review'}
save('step-05-seam4-rulings-sweep.json',metrics);save('step-05-seam4-admission-check-result.json',final)
print(json.dumps({k:v for k,v in metrics.items() if k not in ['outcomeChanges','finalFailures']}));print(final['failures'][:8])
