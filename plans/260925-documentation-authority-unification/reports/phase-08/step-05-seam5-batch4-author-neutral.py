import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json,collections,subprocess
P=pathlib.Path(__file__).resolve().parent
s=importlib.util.spec_from_file_location('r',P/'step-05-seam5-root-rules.py');r=importlib.util.module_from_spec(s);s.loader.exec_module(r)
q=json.loads((P/'step-05-seam5-batch4-input.json').read_text());refs=collections.defaultdict(list);dyn=collections.defaultdict(list)
for x in r.b.rows('step-05-population-references.jsonl'):refs[x['file']].append(x)
for x in r.b.rows('step-05-population-dynamic.jsonl'):dyn[x['file']].append(x)
tri=[];rs=[]
for e in q['remainingFilesInOrder']:
 f=e['file'];ctx=r.context(r.PIN,f);old=r.n.literal_hazards('\n'.join(x['expression'] for x in refs[f])+'\n'+'\n'.join(x['callSite'][4] for x in dyn[f]));ok=r.safe(ctx) and not old;tri.append({'file':f,'inputCommit':r.PIN,'context':ctx,'originalOperandHazards':old,'wholeFileNeutralClosure':ok})
 if ok:
  mode=subprocess.check_output(['git','ls-tree',r.PIN,'--',f],cwd=r.ROOT,text=True).split()[0];rs.append(r.record(f,ctx,refs[f],dyn[f],mode))
for fn,rows in [('step-05-seam5-root-triage.jsonl',tri),('step-05-records/tests-root-neutral.jsonl',rs)]:(P/fn).write_text(''.join(json.dumps(x,ensure_ascii=False,separators=(',',':'))+'\n' for x in rows))
print('neutral',len(rs),'refs',sum(len(r['references']) for r in rs),'tuples',sum(len(r['dynamicTraces']) for r in rs))
