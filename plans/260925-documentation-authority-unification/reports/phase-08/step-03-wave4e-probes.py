#!/usr/bin/env python3
"""L12-41 elided title binding controls: real deleted names, no sibling evidence."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json,copy
P=pathlib.Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location('m',P/'step-03-check.py');m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
PIN='ae141550c2e022310de7a0efea757580c0b2479f'
def main():
 m.SETS=('073',);rs=m.records();c=m.Checker(PIN)
 r=next(r for r in rs if any(e['edgeId']=='maps-j-04444' for e in r['edges']));edge=next(e for e in r['edges'] if e['edgeId']=='maps-j-04444')
 assert not c.check_record(r,apply=False),c.check_record(r,apply=False)
 legacy=c.entries[edge['edgeId']]['normalizedReference']
 full=m.resolved_elided_decision(PIN,legacy)
 assert full=='docs/decisions/0032-cong-iron-law-chi-hoi-o-ranh-gioi-trunk-them-muc-warn.md'
 wanted=m.removed_decision_holders(PIN,edge,legacy)
 assert len(wanted)==1 and wanted[0].startswith('docs/platform/runner/decisions/h-36d872fbb0e5.md#0032-')
 sibling=next(e for e in r['edges'] if e['edgeId']=='maps-j-04445')
 siblings=m.removed_decision_holders(PIN,sibling,c.entries[sibling['edgeId']]['normalizedReference'])
 assert len(siblings)==1 and siblings!=wanted
 cases=[]
 for label,notes in [('missing-note',[]),('sibling-note',list(siblings)),('both-number-collisions',list(wanted+siblings))]:
  rec=copy.deepcopy(r);e=next(e for e in rec['edges'] if e['edgeId']==edge['edgeId'])
  e['reason']=e['reason'].split('Non-executable successor note:')[0]+''.join(' Non-executable successor note: '+x+'.' for x in notes)
  failures=c.check_record(rec,apply=False)
  assert any(f['check']=='removed-decision-narrative-successor' for f in failures),(label,failures)
  cases.append({'mutation':label,'rejected':True})
 assert m.resolved_elided_decision(PIN,'docs/decisions/0032-unmatched-fragment-...md') is None
 assert m.resolved_elided_decision(PIN,'docs/decisions/0032-...md') is None
 assert m.resolved_elided_decision(PIN,'docs/decisions/0026-...md')=='docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md'
 return {'pin':PIN,'negativeProbes':5,'allRejected':True,'resolvedDeletedName':full,'expectedSuccessor':wanted,'distinctSiblingSuccessor':siblings,'probes':cases+[{'mutation':'unmatched-fragment','rejected':True},{'mutation':'ambiguous-number-with-no-fragment','rejected':True}],'priorArt':'Extends removed_decision_holders; reuses git history, committed headings and existing narrative-successor check. L12-41 only.'}
if __name__=='__main__':print(json.dumps(main(),ensure_ascii=False,indent=2))
