#!/usr/bin/env python3
"""Reuse Step 3 author/check/anchor doors with scratch confined to this assignment."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,types,tempfile,json
P=pathlib.Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location('prior',P/'step-03-wave5b-author.py');prior=importlib.util.module_from_spec(sp);sp.loader.exec_module(prior)
w=prior.w;a=w.a3;m=w.m;c=w.c;PIN=w.PIN
original_path=pathlib.Path
m.resolver.pathlib=types.SimpleNamespace(Path=lambda x:original_path('/tmp/fgos-work/wave5f/anchor-cache' if str(x)=='/tmp/fgos-work/step03-anchor-cache' else x))
original_tmp=tempfile.TemporaryDirectory
def scoped_tmp(*args,**kwargs):
 if str(kwargs.get('dir'))=='/tmp/fgos-work':kwargs['dir']='/tmp/fgos-work/wave5f'
 return original_tmp(*args,**kwargs)
m.tempfile.TemporaryDirectory=scoped_tmp

def save(name,value):(P/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
def load(b):return [json.loads(l) for l in (P/'step-03-records'/f'batch-{b}.jsonl').read_text().splitlines()]
def write(b,rs):(P/'step-03-records'/f'batch-{b}.jsonl').write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs))
def clean(r,e):
 key=e['edgeId']
 for section in ('anchors','relativeResolution','labelForm'):r['checks'][section].pop(key,None)
 for section in ('descriptionTruth','writerTrace','resolutionSearches','adjacentResolutionSearches','extraLocatorSearches'):r['checks']['coverage'].get(section,{}).pop(key,None)
 for field in ('searchWitness','targetFacts'):e.pop(field,None)
 e.update(target=None,anchor=None,diffHunk=None,blockedReason=None,dependency=None,blockedCategory=None,dependencyCategory=None,timing='none')
def path_for(e):return w.path_for(e)
finish=prior.finish
