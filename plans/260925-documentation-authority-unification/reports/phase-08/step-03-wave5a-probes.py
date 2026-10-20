#!/usr/bin/env python3
"""L12-46 source-bound completed-action history-region controls."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json,copy
P=pathlib.Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location('m',P/'step-03-check.py');m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
PIN='ae141550c2e022310de7a0efea757580c0b2479f'
def main():
 m.SETS=('077',);c=m.Checker(PIN);r=next(r for r in m.records() if any(e['edgeId']=='maps-j-04741' for e in r['edges']))
 assert not c.check_record(r,apply=False),c.check_record(r,apply=False)
 cases=[]
 for label,mutation in [('heading-missing',lambda e:e['historyRegion'].update(heading='Invented completed task')),('heading-line-wrong',lambda e:e['historyRegion'].update(line=177)),('marker-missing',lambda e:e['historyRegion'].update(marker='This did not occur in the section')),('section-does-not-enclose-edge',lambda e:e['historyRegion'].update(heading='Two coverage gaps closed after the redesign (`tsk-blk`)',line=210)),('declaration-omitted',lambda e:e.pop('historyRegion')),('empty-marker',lambda e:e['historyRegion'].update(marker=''))]:
  rec=copy.deepcopy(r);edge=next(e for e in rec['edges'] if e['edgeId']=='maps-j-04741');mutation(edge)
  failures=c.check_record(rec,apply=False)
  expected='renamed-alias-preserve' if label=='declaration-omitted' else 'history-region'
  assert any(f['check']==expected for f in failures),(label,failures)
  cases.append({'mutation':label,'check':expected,'rejected':True})
 return {'pin':PIN,'positiveEdges':['maps-j-04741','maps-j-04742','maps-j-04743','maps-j-04744'],'positiveRecordFailures':0,'negativeProbes':len(cases),'allRejected':True,'probes':cases,'limits':'Checks source bindings, not whether a completion marker semantically proves history; independent reviewer judges that role.'}
if __name__=='__main__':print(json.dumps(main(),ensure_ascii=False,indent=2))
