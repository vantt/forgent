#!/usr/bin/env python3
"""Invoke the unchanged record checker; relocate scratch only, freeze new sets only."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,types,tempfile,json,math,collections,argparse
P=pathlib.Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location('existing_step03',P/'step-03-check.py');m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
PIN='ae141550c2e022310de7a0efea757580c0b2479f';NEW=tuple(str(i) for i in range(126,131))
# No checker/search predicate changes: only fixed scratch directory arguments move.
original_path=pathlib.Path
m.resolver.pathlib=types.SimpleNamespace(Path=lambda x:original_path('/tmp/fgos-work/wave5c/anchor-cache' if str(x)=='/tmp/fgos-work/step03-anchor-cache' else x))
original_tmp=tempfile.TemporaryDirectory
def scoped_tmp(*args,**kwargs):
 if str(kwargs.get('dir'))=='/tmp/fgos-work':kwargs['dir']='/tmp/fgos-work/wave5c'
 return original_tmp(*args,**kwargs)
m.tempfile.TemporaryDirectory=scoped_tmp

def load_records(sets):
 return [json.loads(l) for b in sets for l in (P/'step-03-records'/f'batch-{b}.jsonl').read_text().splitlines()]
def write(name,value):(P/('step-03-wave5c-'+name)).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
def freeze(rs):
 m.SETS=NEW;out=m.manifest_view(rs,PIN)
 out['unpatchedStrata']={}
 for b in NEW:
  selected=next(x['selected'] for x in out['sets'] if x['set']=='batch-'+b)
  population=sorted(r['file'] for r in rs if r['reviewSet']=='batch-'+b and not r['diff'] and r['edges'] and r['file'] not in selected)
  seed='A51-step03-file-v1-unpatched\0'+PIN+'\0batch-'+b
  ranks=sorted([{'file':f,'rankHash':m.sha(seed+'\0'+f)} for f in population],key=lambda x:(x['rankHash'],x['file']))
  out['unpatchedStrata'][b]={'seed':seed,'population':population,'populationCount':len(population),'ranks':ranks,'selected':[x['file'] for x in ranks[:math.ceil(.15*len(population))]],'reviewedDenominator':0,'reworkNumerator':'pending','acceptance':'Lead only; >3% expands the entire set, never pooled'}
 out['recordFiles']=[{'path':str(m.REL/'step-03-records'/f'batch-{b}.jsonl'),'sha256':m.sha((P/'step-03-records'/f'batch-{b}.jsonl').read_bytes())} for b in NEW]
 return out

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--freeze',action='store_true');ap.add_argument('--new-only',action='store_true');args=ap.parse_args()
 rs=load_records(NEW)
 if args.freeze:write('manifest.json',freeze(rs));print('New-set manifest frozen');return 0
 allsets=NEW if args.new_only else tuple(p.stem.removeprefix('batch-') for p in sorted((P/'step-03-records').glob('batch-[0-9][0-9][0-9].jsonl')))
 m.SETS=allsets;allrs=load_records(allsets);out=m.Checker(PIN).all(allrs)
 out['checkedBatches']=list(allsets);out['openLeadRulingEdgesPerSet']={b:[e['edgeId'] for r in allrs if r['reviewSet']=='batch-'+b for e in r['edges'] if e.get('blockedCategory')=='lead-ruling'] for b in allsets}
 out['checkerSourceSha256']=m.sha((P/'step-03-check.py').read_bytes());out['resolverSourceSha256']=m.sha((P/'step-03-resolve.py').read_bytes());out['scope']='All canonical record files actually present in this isolated worktree; 083–125 are another Doer lane and are not fabricated here.'
 out['scratchRouting']='Existing checker and resolver unchanged; only TemporaryDirectory dir and anchor-cache Path redirected inside /tmp/fgos-work/wave5c/'
 name='new-check-result.json' if args.new_only else 'check-result.json';write(name,out)
 print(json.dumps({'files':out['files'],'edges':out['edges'],'failureCount':out['failureCount'],'failures':out['failures'],'notClosableSets':out['notClosableSets']},ensure_ascii=False));return bool(out['failureCount'])
if __name__=='__main__':raise SystemExit(main())
