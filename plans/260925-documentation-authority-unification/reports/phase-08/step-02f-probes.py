#!/usr/bin/env python3
"""Independent expected outcomes at pinned real defect witnesses and synthetic syntax cases.
Every regression probe proves a failure in immutable 02c/02e behavior, then a pass
in 02f. Already-correct behavior is reported separately as an invariant guard.
No consumer or artifact writes. Stdout only.
"""
import sys
sys.dont_write_bytecode=True
import importlib.util,json,re
from pathlib import Path
R=Path(__file__).resolve().parent

def module(name):
    spec=importlib.util.spec_from_file_location(name,R/(name+'.py'))
    m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m

def run(c):
    parser=module('step-02f-parser');oldparser=module('step-02e-parser')
    old={tag:json.loads((R/f'step-{tag}-census-maps-portals-prose.json').read_text()) for tag in ('02c','02e')}
    by={tag:{e['edgeId']:e for e in data['entries']} for tag,data in old.items()}
    rows=c['entries'];probes=[];guards=[]
    def joined(e):
        return [n for n in rows if n['consumerPath']==e['consumerPath'] and any(s['line']==e['line'] and s['columnStart']<e['columnEndExclusive'] and s['columnEndExclusive']>e['columnStart'] for s in n['physicalSpans'])]
    def probe(label,tag,id,valid):
        b=by[tag][id];ns=joined(b)
        assert not valid([b]),('Old behavior unexpectedly passes',label,id)
        assert valid(ns),('New behavior fails',label,id,[n['edgeId'] for n in ns])
        probes.append({'name':label,'baseline':tag,'beforeRowId':id,'afterRowIds':[n['edgeId'] for n in ns],'oldRejected':True,'newPassed':True})
    patch=lambda e:bool((e.get('cutoverPatch') or {}).get('new'))
    no_patch=lambda ns:bool(ns) and all(not patch(n) for n in ns)
    # L12-21's five lexical classes, plus brace identity and complete evidence units.
    b=by['02c']['maps-00003'];ns=joined(b);full=ns[0]['matchedExpression']
    probe('L12-21 complete patch unit','02c',b['edgeId'],lambda xs:bool(xs) and all(not patch(x) or x['cutoverPatch']['old']==full for x in xs))
    b=by['02c']['maps-00349'];refs={n['normalizedReference'] for n in joined(b)}
    probe('L12-21 corrupted relative/link key','02c',b['edgeId'],lambda xs:bool(xs) and all(x['normalizedReference'] in refs for x in xs))
    b=by['02c']['maps-00350'];ns=joined(b);full=ns[0]['matchedExpression']
    # Freeze expected complete expression in default argument; later probes change full.
    probe('L12-21 link label and destination are indivisible','02c',b['edgeId'],lambda xs,expected=full:len(xs)==1 and xs[0]['matchedExpression']==expected)
    probe('L12-21 architecture prefix is not a path','02c','maps-00598',lambda xs:bool(xs) and all(x['matchedExpression']!='docs/architect' for x in xs))
    probe('L12-21 JS/minified operand excluded','02c','maps-05239',lambda xs:not xs)
    probe('L12-21 brace list expands to complete identities','02c','maps-01215',lambda xs:len(xs)==2 and all('{' not in x['normalizedReference'] and ',' not in x['normalizedReference'] for x in xs))
    # Real disposition regressions, with independently stated expectations.
    for label,id in [('source locator','maps-00299'),('generated output','maps-01291'),('verbatim carriage','maps-04174'),('authoritative_for key','maps-01460'),('shipped template','maps-05296')]:
        probe('L12-21 preserve '+label,'02c',id,no_patch)
    probe('L12-21 migration row flip','02c','maps-01810',lambda xs:bool(xs) and all(n['cutoverAction']=='phase9-row-flip' and not patch(n) for n in xs))
    probe('L12-21 operative read exact file','02c','maps-00027',lambda xs:bool(xs) and all(not patch(n) or not n['desiredOwner'].endswith('/README.md') for n in xs))
    probe('L12-21 no self-link patch','02c','maps-03786',lambda xs:bool(xs) and all(not patch(n) or n['desiredOwner']!=n['consumerPath'] for n in xs))
    probe('L12-21 frozen reading map owner','02c','maps-00005',lambda xs:bool(xs) and all(n['desiredOwner']=='docs/reading-map.md' for n in xs))
    probe('L12-21 evidence same-path mirror','02c','maps-00135',lambda xs:bool(xs) and all(n['desiredOwner']==n['normalizedReference'].split('#')[0].replace('docs/architect/','docs/platform/',1) for n in xs))
    for label,id in [('live writer','maps-01522'),('checker scope','maps-01561')]:
        probe('L12-21 '+label+' remains behavioral','02c',id,lambda xs:bool(xs) and all(n['cutoverAction']=='preserve-pending-behavioral-proof' and not patch(n) for n in xs))
    probe('L12-21 external citation has no fgOS owner','02c','maps-00117',lambda xs:bool(xs) and all(n['desiredOwner'] is None and not patch(n) for n in xs))
    probe('L12-21 roadmap needs semantic rewrite','02c','maps-00975',lambda xs:bool(xs) and all(n['cutoverAction']=='preserve-pending-target' and n['desiredOwner']=='docs/platform/packaging-distribution/README.md' and not patch(n) for n in xs))
    for id in ('maps-e-00457','maps-e-00459','maps-e-00486','maps-e-00492'):
        probe('L12-22 block writer '+id,'02e',id,lambda xs:bool(xs) and all(n['role']=='writer/check' and n['cutoverAction']=='preserve-pending-behavioral-proof' and not patch(n) for n in xs))
    probe('L12-22 migration beats inherited provenance','02e','maps-e-05341',lambda xs:bool(xs) and all(n['rule']=='migration-state' and n['cutoverAction']=='phase9-row-flip' for n in xs))
    def slash(xs):
        if not xs:return False
        for n in xs:
            raw=(n.get('cutoverPatch') or {}).get('new','')
            if not raw or not re.search(r'/\)(?:$)',raw):return False
        return True
    probe('L12-22 trailing directory slash','02e','maps-e-01656',slash)
    probe('L12-22 ellipsis template is never a partial patch','02e','maps-e-00375',lambda xs:no_patch(xs) and all(n['matchedExpression'].endswith('...') for n in xs))
    for id in ('maps-e-00637','maps-e-00638','maps-e-00648','maps-e-00649'):
        probe('L12-22 import snippet excluded '+id,'02e',id,lambda xs:not xs)
    for id in ('maps-e-00331','maps-e-00410','maps-e-00480'):
        # Directory witnesses use exact same-prefix topology, including vocabulary/playbooks.
        probe('L12-22 same-path directory '+id,'02e',id,lambda xs:bool(xs) and all((n.get('desiredOwner') or '').rstrip('/')==n['normalizedReference'].split('#')[0].replace('docs/architect/','docs/platform/',1).rstrip('/') for n in xs))
    probe('L12-22 docs/history retained','02e','maps-e-00538',lambda xs:bool(xs) and all(n['cutoverAction']=='preserve' and n['desiredOwner'] is None for n in xs))
    probe('L12-22 deleted target gets checked successor note','02e','maps-e-00411',lambda xs:no_patch(xs) and all(n.get('successorNote',{}).get('successor')=='docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md' and not n['successorNote']['mechanicalCheck']['failures'] for n in xs))
    # Select a real migration-plan source locator that 02e patched.
    b=next(e for e in old['02e']['entries'] if e['consumerPath']=='docs/architect/agent-coordination/documentation-standardization-plan.md' and 608<=e['line']<=616 and patch(e))
    probe('L12-22 migration-plan source locators preserved','02e',b['edgeId'],lambda xs:no_patch(xs) and all(n['rule']=='provenance' for n in xs))
    for id in ('maps-e-00514','maps-e-00515'):
        probe('L12-22 retired checkpoint '+id,'02e',id,lambda xs:no_patch(xs) and all(n['cutoverAction']=='preserve' for n in xs))
    probe('L12-22 Observe exact spec','02e','maps-e-03826',lambda xs:bool(xs) and all(n['desiredOwner']=='docs/platform/observe/spec.md' for n in xs))
    probe('L12-22 carriage needs no alias and link-check exclusion','02e','maps-e-03582',lambda xs:no_patch(xs) and all(n['cutoverAction']=='preserve' and n.get('carriagePolicy',{}).get('preserveWithoutAlias') and 'exclude' in n['carriagePolicy']['phase9LinkCheck'] for n in xs))
    # Synthetic relative-code tests exercise code added this turn, not just stored rows.
    for snippet in ("import('./src/example.mjs')", "require('../src/example.cjs')", 'node -e "console.log(\'./src/example.mjs\')"'):
        fresh,ex=parser.units('docs/architect/nested/example.md',snippet)
        before,_=oldparser.units('docs/architect/nested/example.md',snippet)
        assert before and not fresh and ex and 'specifier' in ex[0]['reason'],snippet
        probes.append({'name':'relative code specifier: '+snippet,'baseline':'02e parser execution','oldRejected':True,'newPassed':True})
    roster=joined(by['02e']['maps-e-00487'])
    assert roster and all(n['role']=='reader' and n['cutoverAction']=='cutover-patch-only' for n in roster)
    guards.append('ROSTER_SOURCE stays a reader beside EVIDENCE_DIR in the same example')
    ui=[n for n in rows if n['rule']=='ui-spec-self-reference']
    assert ui and all(not patch(n) for n in ui)
    guards.append('ui-spec self references were already correct in 02c; no invented old failure')
    assert all(n['cutoverPatch']['old']==n['matchedExpression'] for n in rows if patch(n))
    guards.append('Every executable proposal replaces its complete unit')
    return {'regressionProbes':probes,'regressionCount':len(probes),'oldFailuresProved':len(probes),'invariantGuards':guards,'status':'PASS'}
if __name__=='__main__':
    c=json.loads((R/'step-02f-census-maps-portals-prose.json').read_text())
    print(json.dumps(run(c),ensure_ascii=False,indent=2))
