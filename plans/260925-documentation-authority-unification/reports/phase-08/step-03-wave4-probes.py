#!/usr/bin/env python3
"""L12-38 differential probes on current real records; all inherited suites remain."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json,copy,re
P=pathlib.Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location('w4',P/'step-03-wave4-check.py');w4=importlib.util.module_from_spec(sp);sp.loader.exec_module(w4)
m=w4.m;PIN=w4.PIN

def main():
 m.SETS=w4.PRIOR+w4.WAVE4;rs=m.records();c=m.Checker(PIN);cases=[]
 def record(eid):return next(r for r in rs if any(e['edgeId']==eid for e in r['edges']))
 def probe(name,original,mutate,expected):
  assert not c.check_record(original,apply=False),(name,c.check_record(original,apply=False))
  r=copy.deepcopy(original);mutate(r);names=sorted({x['check'] for x in c.check_record(r,apply=False)});assert expected in names,(name,names)
  cases.append({'rule':name,'expectedCheck':expected,'observedChecks':names,'rejected':True})
 def restore_live(r):
  e=next(e for e in r['edges'] if e['edgeId']=='maps-j-04514');e.update(disposition='preserve',target=None,anchor=None,timing='none',diffHunk=None,reason='L12-38: historical label cannot override live file class')
 probe('L12-38(1) undated decision citation in knowledge cannot preserve',record('maps-j-04514'),restore_live,'live-decision-citation-preserve')
 def remove_note(r):
  e=next(e for e in r['edges'] if e['edgeId']=='maps-j-01258');e['reason']=re.sub(r' Non-executable successor note: [^\s]+','',e['reason'])
 probe('L12-38(3) computed narrative successor cannot be omitted',record('maps-j-01258'),remove_note,'removed-decision-narrative-successor')
 r=record('maps-j-03751')
 def false_exclusion(rr):
  x=next(x for x in rr['checks']['coverage']['legacyScan']['candidates'] if x['span']['line']==32);assert not x.get('edgeId');x['excludedReason']='An unrelated same-name file; not a legacy reference.'
 probe('L12-38(5) dated shorthand exemption cannot falsely claim unrelatedness',r,false_exclusion,'author-added-search-coverage')
 participant=next(r for r in rs if r['file'].endswith('/fgos-participant-contract.md'))
 def omit_moved_link(r):
  e=next(e for e in r['edges'] if e.get('authorAddedEdge') and '0011' in e['matchedExpression']);key=e['edgeId'];r['edges'].remove(e);r['checks']['coverage']['authorAddedEdgeIds'].remove(key)
  r['checks']['coverage']['legacyScan']['candidates']=[x for x in r['checks']['coverage']['legacyScan']['candidates'] if x.get('edgeId')!=key]
 probe('Moved numeric decision link cannot escape coverage after registry rename',participant,omit_moved_link,'author-added-search-coverage')
 work=record('maps-j-08367');body=m.blob(PIN,work['file']).decode()
 assert all(not c.renamed_alias_holders(work,e) for e in work['edges'] if e['edgeId'] in ('maps-j-08367','maps-j-08368'))
 assert m.coverage_exemption('docs/explanation/test.md','# Dated\n`work-state.md`\n',{'line':2,'text':'work-state.md'})
 assert not m.coverage_exemption('docs/explanation/test.md','# Dated\n`specs/work-state.md`\n',{'line':2,'text':'specs/work-state.md'})
 assert not m.coverage_exemption('docs/explanation/test.md','# Dated\n[x](work-state.md)\n',{'line':2,'text':'[x](work-state.md)'})
 assert not m.coverage_exemption('docs/knowledge/test/test.md','# Live\n`work-state.md`\n',{'line':2,'text':'work-state.md'})
 return {'pin':PIN,'negativeProbes':len(cases),'allRejected':True,'probes':cases,'positiveControls':['current complete records pass all predicates before mutation','verbatim retired-decision region exempts aliases','bare dated shorthand exempt; Markdown link and explicit partial legacy root not exempt','knowledge remains live'],'inheritedSuites':'87 + 23 + 25 + 16 + 11 retained; replayed separately, no deletion or weakened expected assertion'}
if __name__=='__main__':print(json.dumps(main(),ensure_ascii=False,indent=2))
