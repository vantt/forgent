#!/usr/bin/env python3
"""L12-34 differential probes; inherited 87 cases remain in step-03-probes.py.
Real records plus pinned-tree scanner fixtures, with no consumer writes.
"""
import sys
sys.dont_write_bytecode=True
import copy,importlib.util,json,pathlib
from unittest.mock import patch
P=pathlib.Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('check',P/'step-03-check.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
PIN='ae141550c2e022310de7a0efea757580c0b2479f'

def main():
    m.SETS=tuple([f'{i:03}' for i in range(1,34)]+['040','041']);rs=m.records();c=m.Checker(PIN);cases=[]
    retired=next(r for r in rs if r['file']=='docs/specs/runner.md')
    assert not c.check_record(retired)
    def probe(name,record,mutate,expected):
        r=copy.deepcopy(record);mutate(r);fail=c.check_record(r);names={f['check'] for f in fail}
        assert expected in names,(name,names)
        cases.append({'surfaceClass':3,'rule':'L12-34','probe':name,'expectedCheck':expected,'rejected':True,'observedChecks':sorted(names)})
    for f in ['docs/README.md','docs/specs/workflow.md','docs/specs/reading-map.md','docs/specs/work-state.md']:
        probe('retirement forbidden for '+f,retired,lambda r,f=f:r.update(file=f),'retirement-eligibility')
    assert not m.may_retire('docs/architect/agent-coordination/verification/team-dispatch-v1/index.md')
    cases.append({'surfaceClass':3,'rule':'L12-34(2)','probe':'relocated evidence payload cannot retire','expectedCheck':'retirement-eligibility','rejected':True})
    probe('retirement cannot carry a diff',retired,lambda r:r.update(diff='@@ executable @@'),'retirement-no-diff')
    probe('retirement cannot carry per-edge dispositions',retired,lambda r:r['edges'].append({'edgeId':r['edgeIds'][0],'disposition':'patch'}),'retirement-no-diff')
    def missing_inventory(r):
        key=r['inventoryEdgeIds'].pop();r['edgeIds'].remove(key)
    probe('retirement inventory id jointly omitted',retired,missing_inventory,'retirement-edge-coverage')
    def missing_added(r):
        key=r['authorAddedEdges'].pop()['edgeId'];r['edgeIds'].remove(key)
    probe('retirement supplemental id and declaration jointly omitted',retired,missing_added,'retirement-supplemental-coverage')
    probe('retirement duplicate id',retired,lambda r:r['edgeIds'].append(r['edgeIds'][0]),'retirement-edge-coverage')
    probe('retirement wrong source digest',retired,lambda r:r.update(digest='0'*64),'digest')
    probe('retirement false marker value',retired,lambda r:r.update(retiresWithTree='yes'),'retirement-schema')
    package=next(r for r in rs if r['file']=='docs/platform/packaging-distribution/README.md')
    probe('unit id omitted cannot hide a mixed computed unit',package,lambda r:(r['edges'][0].pop('unitId'),next(e for e in r['edges'] if e['edgeId']=='maps-j-07213').update(disposition='preserve')),'unit-consistency')
    probe('unit id invented per edge cannot hide a mixed computed unit',package,lambda r:(r['edges'][0].update(unitId='separate-edge'),next(e for e in r['edges'] if e['edgeId']=='maps-j-07213').update(disposition='preserve')),'unit-consistency')
    def mixed(r):
        e=next(e for e in r['edges'] if e['edgeId']=='maps-j-07213');e.update(disposition='preserve');e.pop('unitDispositionReason',None)
    probe('migration bullet siblings have mixed dispositions',package,mixed,'unit-consistency')
    allowed=copy.deepcopy(package);mixed(allowed)
    unit=next(e['unitId'] for e in allowed['edges'] if e['edgeId']=='maps-j-07213')
    for e in allowed['edges']:
        if e['unitId']==unit:e['unitDispositionReason']=e['edgeId']+' ['+e['matchedExpression']+'] Distinct claim: retained-root source lineage; sibling migration authority/status assertion is handled separately.'
    assert 'unit-consistency' not in {f['check'] for f in c.check_record(allowed)}
    roadmap=next(r for r in rs if r['file']=='docs/platform/system-architecture/architecture/roadmap.md')
    probe('Canonical current-source line cannot preserve',roadmap,lambda r:next(e for e in r['edges'] if e['edgeId']=='maps-j-07766').update(disposition='preserve'),'unit-consistency')
    runner=next(r for r in rs if r['file']=='docs/platform/runner/README.md')
    probe('Related retiring source incorrectly preserved',runner,lambda r:next(e for e in r['edges'] if e['edgeId']=='maps-j-07587').update(disposition='preserve'),'related-retiring-preserve')
    work=next(r for r in rs if r['file']=='docs/platform/work-state/README.md')
    provenance=next(e for e in work['edges'] if e['edgeId']=='maps-j-07881')
    assert not m.related_header(m.blob(PIN,work['file']).decode(),provenance['sourceSpans'][0]['line'])
    carrier=next(r for r in rs if r['file']=='docs/platform/proposals/component-authority-boundary-map.md')
    assert not m.related_header(m.blob(PIN,carrier['file']).decode(),32), 'original Related list inside carriage is not wrapper metadata'
    assert m.related_header(m.blob(PIN,runner['file']).decode(),18)
    real_blob=m.blob
    def scan_fixture(name,file,body,expected):
        with patch.object(m,'blob',side_effect=lambda pin,path:body.encode() if path==file else real_blob(pin,path)):
            found=m.scan_candidates(PIN,file,[])
        assert expected in [x['text'] for x in found],(name,found)
        cases.append({'surfaceClass':3,'rule':'L12-34(5)','probe':name,'expectedCheck':'author-added-search-coverage','rejected':True,'scannerFindsOmittedForm':expected})
    scan_fixture('tree-relative file cannot escape census coverage','docs/architect/roadmap.md','`proposals/step-09-group-thinking-substrate.md`\n','proposals/step-09-group-thinking-substrate.md')
    scan_fixture('tree-relative locator remains complete','docs/architect/roadmap.md','`proposals/step-09-group-thinking-substrate.md:26`\n','proposals/step-09-group-thinking-substrate.md:26')
    scan_fixture('backticked sibling directory cannot escape coverage','docs/architect/roadmap.md','`agent-coordination/`\n','agent-coordination/')
    scan_fixture('source-area relative path in carriage is still counted','docs/platform/system-architecture/architecture/roadmap.md','# Roadmap\n```txt\nProvenance: docs/architect/roadmap.md at pin\n```\n`proposals/step-10-coding-domain-adoption.md`\n','proposals/step-10-coding-domain-adoption.md')
    scan_fixture('relative Markdown link is one complete unit','docs/architect/roadmap.md','[Step 09](proposals/step-09-group-thinking-substrate.md)\n','[Step 09](proposals/step-09-group-thinking-substrate.md)')
    body='# Index\n```txt\nProvenance: docs/architect/agent-coordination/README.md at pin\n```\n`architecture/runtime-model.md`\n'
    f='docs/platform/agent-coordination/README.md'
    with patch.object(m,'blob',side_effect=lambda pin,path:body.encode() if path==f else real_blob(pin,path)):
        assert 'architecture/runtime-model.md' not in [x['text'] for x in m.scan_candidates(PIN,f,[])],'actual candidate-local target wins over source-area fallback'
    def omit_relative(r):
        e=next(e for e in r['edges'] if e['edgeId'].startswith('author-wave1-r2-') and e['matchedExpression'].startswith('proposals/'));key=e['edgeId'];r['edges'].remove(e);r['checks']['coverage']['authorAddedEdgeIds'].remove(key);r['checks']['coverage']['legacyScan']['candidates']=[x for x in r['checks']['coverage']['legacyScan']['candidates'] if x.get('edgeId')!=key]
    probe('relative edge and scan receipt jointly omitted',roadmap,omit_relative,'author-added-search-coverage')
    return {'pin':PIN,'negativeProbes':len(cases),'allRejected':True,'probes':cases,'positiveCases':['valid retirement record','mixed unit with reasons on every edge','Provenance is not Related','original Related in source carriage is not wrapper navigation','wrapper Related detected','native candidate-relative target takes precedence','complete Markdown link matched once'],'limits':'Negative probe rejection is mechanical evidence; context/holder/disposition truth remains independent reviewer work.'}
if __name__=='__main__':print(json.dumps(main(),ensure_ascii=False,indent=2))
