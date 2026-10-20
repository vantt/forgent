"""Rebuild R20 triage/closures from pinned inputs, preserving the initial queue."""
import sys
sys.dont_write_bytecode=True
import importlib.util,pathlib,json,collections,subprocess
P=pathlib.Path(__file__).resolve().parent
s=importlib.util.spec_from_file_location('n',P/'step-05-seam5-neutral-rules.py');n=importlib.util.module_from_spec(s);s.loader.exec_module(n)
c=json.loads((P/'step-05-seam5-batch3-input.json').read_text());n.dump(P/'step-05-cutover-move-set.json',n.model())
refs=collections.defaultdict(list);dyn=collections.defaultdict(list)
for x in n.b.rows('step-05-population-references.jsonl'):refs[x['file']].append(x)
for x in n.b.rows('step-05-population-dynamic.jsonl'):dyn[x['file']].append(x)
tri=[];rs=[]
for e in c['remainingFilesInOrder']:
 f=e['file'];ctx=n.context(n.PIN,f);old=n.literal_hazards('\n'.join(x['expression'] for x in refs[f])+'\n'+'\n'.join(x['callSite'][4] for x in dyn[f]));safe=not old and not any(ctx[k] for k in ['literalHazards','constantHazards','constructedHazards']);tri.append({'file':f,'inputCommit':n.PIN,'context':ctx,'originalOperandHazards':old,'wholeFileNeutralClosure':safe})
 if safe:
  mode=subprocess.check_output(['git','ls-tree',n.PIN,'--',f],text=True,cwd=n.ROOT).split()[0];rs.append(n.record(f,ctx,refs[f],dyn[f],mode))
for fn,rows in [('step-05-seam5-neutral-triage.jsonl',tri),('step-05-records/tests-cutover-neutral.jsonl',rs)]:
 target=P/fn;temporary=target.with_name(target.name+'.tmp');temporary.write_text(''.join(json.dumps(x,ensure_ascii=False,separators=(',',':'))+'\n' for x in rows));temporary.replace(target)
print('move set',n.model()['pathCount'],'neutral',len(rs),'refs',sum(len(r['references']) for r in rs),'dyn',sum(len(r['dynamicTraces']) for r in rs))
