#!/usr/bin/env python3
"""Invoke the unchanged full checker, freeze new batches, and verify assigned write scope."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json,math,collections,argparse
P=pathlib.Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location('author',P/'step-03-wave5g-author.py');a=importlib.util.module_from_spec(sp);sp.loader.exec_module(a)
m=a.m;PIN=a.PIN;NEW=tuple(str(i) for i in range(122,113,-1))
def save(n,o):(P/('step-03-wave5g-'+n)).write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
def load(sets):return [json.loads(l) for b in sets for l in (P/'step-03-records'/f'batch-{b}.jsonl').read_text().splitlines()]
def freeze(rs):
 m.SETS=NEW;out=m.manifest_view(rs,PIN);out['unpatchedStrata']={}
 for b in NEW:
  selected=next(x['selected'] for x in out['sets'] if x['set']=='batch-'+b)
  pop=sorted(r['file'] for r in rs if r['reviewSet']=='batch-'+b and not r['diff'] and r['edges'] and r['file'] not in selected)
  seed='A51-step03-file-v1-unpatched\0'+PIN+'\0batch-'+b
  ranks=sorted([{'file':f,'rankHash':m.sha(seed+'\0'+f)} for f in pop],key=lambda x:(x['rankHash'],x['file']))
  out['unpatchedStrata'][b]={'seed':seed,'population':pop,'populationCount':len(pop),'ranks':ranks,'selected':[x['file'] for x in ranks[:math.ceil(.15*len(pop))]],'reviewedDenominator':0,'reworkNumerator':'pending','breachExpansion':'A >3% breach expands semantic review to every file of its own set; no pooling or reseeding.'}
 out['recordFiles']=[{'path':str(m.REL/'step-03-records'/f'batch-{b}.jsonl'),'sha256':m.sha((P/'step-03-records'/f'batch-{b}.jsonl').read_bytes())} for b in NEW]
 return out

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--freeze',action='store_true');ap.add_argument('--new-only',action='store_true');args=ap.parse_args()
 rs=load(NEW)
 if args.freeze:
  out=freeze(rs);save('manifest.json',out)
  save('population.json',{'pin':PIN,'completedBatches':list(NEW),'pendingAssignedBatches':[],'files':len(rs),'inventoryEdges':sum(len(r['inventoryEdgeIds']) for r in rs),'addedEdges':sum(len(r['edges'])-len(r['inventoryEdgeIds']) for r in rs),'edges':sum(len(r['edges']) for r in rs),'patchedFiles':sum(bool(r['diff']) for r in rs),'dispositions':dict(collections.Counter(e['disposition'] for r in rs for e in r['edges'])),'parks':dict(collections.Counter(e['blockedCategory'] for r in rs for e in r['edges'] if e['disposition']=='parked')),'openLeadRulingEdgesPerSet':{b:[e['edgeId'] for r in rs if r['reviewSet']=='batch-'+b for e in r['edges'] if e.get('blockedCategory')=='lead-ruling'] for b in NEW},'reviewAcceptance':'pending independent review; author does not close sets'})
  print('New-batch manifest and both A51 strata frozen');return
 sets=NEW if args.new_only else tuple(p.stem.removeprefix('batch-') for p in sorted((P/'step-03-records').glob('batch-[0-9][0-9][0-9].jsonl')))
 m.SETS=sets;allrs=load(sets);result=m.Checker(PIN).all(allrs)
 result.update(checkedBatches=list(sets),openLeadRulingEdgesPerSet={b:[e['edgeId'] for r in allrs if r['reviewSet']=='batch-'+b for e in r['edges'] if e.get('blockedCategory')=='lead-ruling'] for b in sets},checkerSourceSha256=m.sha((P/'step-03-check.py').read_bytes()),resolverSourceSha256=m.sha((P/'step-03-resolve.py').read_bytes()),scope='All canonical batches actually present in this isolated worktree; parallel Doer A 105–113 not fabricated or modified.',scratchRouting='Only fixed anchor-cache path and TemporaryDirectory dir are redirected to /tmp/fgos-work/wave5g; no checker/resolver predicates changed.')
 save('new-check-result.json' if args.new_only else 'check-result.json',result)
 print(json.dumps({k:result[k] for k in ('files','edges','failureCount','failures','notClosableSets')},ensure_ascii=False));return bool(result['failureCount'])
if __name__=='__main__':sys.exit(main())
