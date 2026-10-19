#!/usr/bin/env python3
"""L12-35 wrong-record mutations; prior 87 + 23 cases remain in their suites."""
import sys
sys.dont_write_bytecode=True
import copy,importlib.util,json,pathlib
from unittest.mock import patch
P=pathlib.Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('check',P/'step-03-check.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
PIN='ae141550c2e022310de7a0efea757580c0b2479f'

def main():
    m.SETS=tuple([f'{i:03}' for i in range(1,34)]+['040','041']);rs=m.records();c=m.Checker(PIN);cases=[]
    by={r['file']:r for r in rs}
    def probe(name,record,mutate,expected,body=None):
        r=copy.deepcopy(record);mutate(r)
        real=m.blob
        if body is None:fail=c.check_record(r,apply=False)
        else:
            with patch.object(m,'blob',side_effect=lambda pin,path:body.encode() if path==r['file'] else real(pin,path)):
                fail=c.check_record(r,apply=False)
        checks={x['check'] for x in fail};assert expected in checks,(name,checks)
        cases.append({'probe':name,'expectedCheck':expected,'observedChecks':sorted(checks),'rejected':True})
    root=by['docs/reading-map.md'];specmap=by['docs/specs/reading-map.md']
    def edge(r,s):return next(e for e in r['edges'] if e['edgeId']=='maps-j-'+s)
    for r,s in [(root,'08020'),(specmap,'08195')]:
        def escape(rr,s=s):
            e=edge(rr,s);e.update(disposition='patch',unitId='author-invented-unit',unitDispositionReason='L12-34: independent source claim')
        probe(s+' cannot escape its computed list item with a declared id and boilerplate',r,escape,'unit-consistency')
    table=by['docs/README.md']
    probe('table-row siblings cannot split',table,lambda r:edge(r,'00009').update(disposition='preserve',unitId='separate-row'),'unit-consistency')
    # Wrapped and numbered items are tested through wrong complete records,
    # not merely through a helper returning the expected id.
    for title,body in [('wrapped list','- first docs/a.md\n  and docs/b.md\n'),('lazy continuation','1. first docs/a.md\nand docs/b.md\n'),('status wrapped list','## Migration\n- docs/a.md\n  docs/b.md\n')]:
        fixture=copy.deepcopy(table);fixture['edges']=copy.deepcopy(table['edges'][:2])
        for index,(e,n) in enumerate(zip(fixture['edges'],(2,3) if body.startswith('#') else (1,2))):
            token='docs/a.md' if index==0 else 'docs/b.md';line=body.splitlines()[n-1];start=line.index(token)
            e.update(sourceSpans=[{'line':n,'columnStart':start+1,'columnEndExclusive':start+1+len(token),'text':token}],matchedExpression=token,disposition='preserve' if index==0 else 'parked',unitId='line-L'+str(n));e.pop('unitDispositionReason',None)
        probe(title+' uses one computed source unit',fixture,lambda r:None,'unit-consistency',body)
    snapshot=by['docs/platform/agent-coordination/history/retired-engine/README.md']
    internal=next(e for e in snapshot['edges'] if e['sourceSpans'][0]['line']==147)
    for wording in ('target never existed','target is absent','target exists at the author pin','target removed at 1234567','target existed at the pin','target is missing','target is present'):
        probe('carriage forbids '+wording,snapshot,lambda r,wording=wording:next(e for e in r['edges'] if e['edgeId']==internal['edgeId']).update(reason=internal['reason']+'; '+wording),'carriage-no-existence-claims')
    probe('carriage forbids structured existence facts',snapshot,lambda r:next(e for e in r['edges'] if e['edgeId']==internal['edgeId']).update(targetFacts=[{'path':'docs/doc-governance.md','state':'exists'}]),'carriage-no-existence-claims')
    probe('carriage must name its actual declaration',snapshot,lambda r:next(e for e in r['edges'] if e['edgeId']==internal['edgeId']).update(reason='L12-35: inside literal carriage (L12-26(5)); unrelated heading'),'carriage-no-existence-claims')
    def omit(r,key):
        r['edges']=[e for e in r['edges'] if e['edgeId']!=key]
        cov=r['checks']['coverage'];cov['authorAddedEdgeIds'].remove(key)
        cov['legacyScan']['candidates']=[x for x in cov['legacyScan']['candidates'] if x.get('edgeId')!=key]
    for r,token,label in [(root,'contracts/','stated-parent directory'),(specmap,'contracts/','sibling-map directory'),(snapshot,'[../../doc-governance.md](../../doc-governance.md)','original-source snapshot link'),(by['docs/platform/proposals/README.md'],'[Coordination Capability Envelope](coordination-capability-envelope.md)','native candidate cannot hide retiring source-coordinate snapshot link')]:
        key=next(e['edgeId'] for e in r['edges'] if e['matchedExpression']==token)
        probe('joint omission of '+label,r,lambda rr,key=key:omit(rr,key),'author-added-search-coverage')
    def excluded_snapshot(r):
        key=internal['edgeId'];r['edges']=[e for e in r['edges'] if e['edgeId']!=key];r['checks']['coverage']['authorAddedEdgeIds'].remove(key)
        item=next(x for x in r['checks']['coverage']['legacyScan']['candidates'] if x.get('edgeId')==key);item.pop('edgeId');item['excludedReason']='claimed candidate local path'
    probe('resolving snapshot link cannot be hidden as an exclusion',snapshot,excluded_snapshot,'author-added-search-coverage')
    for r,key,note,label in [(root,'07953','docs/specs/reading-map.md','referenced path'),(root,'07953','docs/reading-map.md','consumer self'),(by['docs/platform/system-architecture/architecture/roadmap.md'],'07769','docs/specs','glob root')]:
        probe('successor cannot name '+label,r,lambda rr,key=key,note=note:edge(rr,key).update(reason=edge(rr,key)['reason']+' Non-executable successor note: '+note+'.'),'successor-not-self')
    probe('pathless migration status cannot be omitted',root,lambda r:r['checks']['coverage'].pop('statusRowFlips'),'migration-status-prose')
    probe('pathless migration status cannot preserve',root,lambda r:r['checks']['coverage']['statusRowFlips'][0].update(disposition='preserve'),'migration-status-prose')
    # Advisory metadata may be stale; identical source groups still enforce the rule.
    good=copy.deepcopy(root)
    for e in good['edges']:e['unitId']='advisory-only'
    assert 'unit-consistency' not in {x['check'] for x in c.check_record(good,apply=False)}
    assert m.unit_id('- a\n  b\n- c\n',[{'line':2}])=='item-L1'
    assert m.unit_id('- a\n  b\n- c\n',[{'line':3}])=='item-L3'
    return {'pin':PIN,'negativeProbes':len(cases),'allRejected':True,'probes':cases,'positiveCases':['advisory unit ids do not define groups','wrapped continuation binds to first item','sibling list item stays separate'],'limits':'Semantic truth of distinct-claim exceptions remains independent reviewer work.'}
if __name__=='__main__':print(json.dumps(main(),ensure_ascii=False,indent=2))
