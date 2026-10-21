"""Reject R26 retention witnesses, missing members and unbound shared decisions."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,copy,importlib.util
P=pathlib.Path(__file__).resolve().parent
s=importlib.util.spec_from_file_location('r26probes',P/'step-05-proposed-move-rules.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
rs=[json.loads(l) for f in sorted((P/'step-05-records').glob('*.jsonl')) for l in f.open()];manifest=m.read('step-05-proposed-move-read-units.json');base=m.check(rs,manifest);assert base['failureCount']==0,base['failures'];out=[]
def probe(name,edit):
 changed=list(rs);moved=copy.deepcopy(manifest);edit(changed,moved);r=m.check(changed,moved);out.append({'name':name,'rejected':r['failureCount']>0,'caught':r['failures'][:2]})
def slot(rows,file,id):
 i=next(i for i,r in enumerate(rows) if r['file']==file);rows[i]=copy.deepcopy(rows[i]);return next(e for e in m.items(rows[i]) if m.ident(e)==id)
f='test/scripts/check-doc-candidate-status.test.mjs';id='dynamic-031770'
def retain(rows,units):
 e=slot(rows,f,id);e['disposition']='preserve';e['resolverWitness']={'scope':'retained root document'}
probe('real governance copy cannot use retained preserve witness',retain)
def lose_dependency(rows,units):slot(rows,f,id)['dependency']='ordinary retained root'
probe('park must name exact retention-or-move decision',lose_dependency)
def lose_member(rows,units):
 u=next(u for u in units['units'] if u['path']=='docs/doc-governance.md');u['readers']=[e for e in u['readers'] if e['id']!=id];u['readerRecordIds']=[e['id'] for e in u['readers']];u['readerCount']=len(u['readers']);units['readerCount']-=1
probe('unit cannot silently omit an enumerated reader',lose_member)
def hide_read(rows,units):
 retain(rows,units);e=next(e for r in rows if r['file']==f for e in m.items(r) if m.ident(e)==id);e.pop('r26Unit');lose_member(rows,units)
probe('clearing both marker and member cannot hide a real read',hide_read)
probe('unit cannot omit the gate from its co-cut',lambda rows,units:next(u for u in units['units'] if u['path']=='docs/doc-governance.md')['coCutPaths'].remove('scripts/check-doc-constitution.mjs'))
probe('proposal cannot invent a decided retention outcome',lambda rows,units:next(u for u in units['units'] if u['path']=='docs/architecture-map.md').update(decisionDependency='already retained'))
probe('reader provenance must retain exact pin hash',lambda rows,units:next(u for u in units['units'] if u['path']=='docs/doc-governance.md')['readers'][0].update(sourceSha256='0'*64))
probe('proposed path with no reader cannot disappear from sweep',lambda rows,units:units.update(units=[u for u in units['units'] if u['path']!='docs/ui-spec/spec.config.yaml']))
# Exact patch/replay mutations remain owned by the existing R22/R25 probes;
# this family tests only the new R26 unit contract.
result={'baselineFailures':0,'passed':sum(e['rejected'] for e in out),'total':len(out),'probes':out,'failures':[e for e in out if not e['rejected']]};(P/'step-05-proposed-move-probes-result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result));sys.exit(bool(result['failures']))
