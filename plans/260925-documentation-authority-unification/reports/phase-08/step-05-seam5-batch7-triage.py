"""Re-evaluate R21/R20 before author judgments, preserving every prior closure."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json,collections
P=pathlib.Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location('r7',P/'step-05-seam5-root-rules.py');r=importlib.util.module_from_spec(sp);sp.loader.exec_module(r)
refs=collections.defaultdict(list);dyn=collections.defaultdict(list)
for x in r.b.rows('step-05-population-references.jsonl'):refs[x['file']].append(x)
for x in r.b.rows('step-05-population-dynamic.jsonl'):dyn[x['file']].append(x)
q=json.loads((P/'step-05-seam5-batch7-input.json').read_text());tri=[]
for e in q['remainingFilesInOrder']:
 f=e['file'];ctx=r.context(r.PIN,f);old=r.n.literal_hazards('\n'.join(x['expression'] for x in refs[f])+'\n'+'\n'.join(x['callSite'][4] for x in dyn[f]));tri.append({'file':f,'inputCommit':r.PIN,'context':ctx,'originalOperandHazards':old,'wholeFileNeutralClosure':r.safe(ctx) and not old})
(P/'step-05-seam5-batch7-neutrality-first.json').write_text(json.dumps({'files':len(tri),'neutralFiles':[x['file'] for x in tri if x['wholeFileNeutralClosure']],'triage':tri},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'files':len(tri),'neutral':sum(x['wholeFileNeutralClosure'] for x in tri),'hazards':dict(collections.Counter(k for t in tri for k in ['literalHazards','constantHazards','constructedHazards'] if t['context'][k]))}))
