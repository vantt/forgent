#!/usr/bin/env python3
"""Preserve all 192 earlier probes and add independent L12-26 real witnesses.
Earlier expectations that L12-26 supersedes are replayed against their immutable
02i checkpoint, not silently changed to bless incompatible successor semantics.
Current witnesses and current all-edge invariants enforce the new specification.
"""
import sys
sys.dont_write_bytecode=True
import importlib.util,json,re
from pathlib import Path
R=Path(__file__).resolve().parent

def module(name):
    s=importlib.util.spec_from_file_location(name,R/(name+'.py'));m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m

def run(c):
    packet=module('step-02j-packet');parser=module('step-02j-parser')
    baseline=json.loads((R/'step-02i-census-maps-portals-prose.json').read_text())
    inherited=module('step-02i-probes').run(baseline)
    old={e['edgeId']:e for e in baseline['entries']};joins=packet.source_join(baseline['entries'],c['entries']);probes=[]
    def probe(k,id,valid,label):
        b=old['maps-i-'+id];ns=joins[b['edgeId']]
        assert not valid(b),('02i unexpectedly passes',k,id,label)
        assert ns and all(valid(n) for n in ns),('02j fails',k,id,label,[(n['edgeId'],n['rule'],n['cutoverAction'],n.get('desiredOwner'),n.get('successorNote')) for n in ns])
        probes.append({'class':k,'beforeEdgeId':b['edgeId'],'afterEdgeIds':[n['edgeId'] for n in ns],'name':label,'oldRejected':True,'newPassed':True})
    probe(1,'02964',lambda e:e.get('desiredOwner')=='docs/platform/runner/decisions/h-aabefc85f0c9.md' and bool(e.get('desiredAnchor')),'CoordinationSession exact decision passage')
    probe(1,'01778',lambda e:e.get('desiredOwner')=='docs/platform/work-state/spec.md' and bool(e.get('desiredAnchor')),'RUL10 exact spec anchor')
    probe(1,'02289',lambda e:e.get('desiredOwner')=='docs/platform/runner/subcomponents/h-6979005beaf7/spec.md' and bool(e.get('desiredAnchor')),'RUL40 live business-rules subcomponent is valid')
    probe(1,'04505',lambda e:e.get('desiredOwner')=='docs/platform/packaging-distribution/contracts/setup-doctor-registry.md' and bool(e.get('desiredAnchor')),'Doctor read-only claim cites exact registry evidence')
    probe(1,'05100',lambda e:e['cutoverAction']=='preserve-pending-target' and 'CTR011' in e.get('semanticRowProposal',{}).get('new',''),'Contract id drift parks whole sentence with CTR011 proposal')
    probe(1,'01706',lambda e:e['cutoverAction']=='preserve-pending-target' and not e.get('cutoverPatch'),'Envelope/verb/identity multi-locator parks when no single exact passage resolves all locators')
    probe(1,'01835',lambda e:e.get('desiredOwner')=='docs/platform/work-state/spec.md' and bool(e.get('desiredAnchor')),'Data Dictionary row locator maps to the actual dictionary heading')
    probe(2,'05313',lambda e:bool(e.get('successorNote',{}).get('successor','').startswith('docs/platform/work-state/decisions/retired-decision-history.md#8-adr-0012')),'Deleted 0012 successor via committed history heading')
    probe(3,'01995',lambda e:e['cutoverAction']=='preserve' and e['desiredOwner']=='docs/distribution-vision.md' and not e.get('cutoverPatch'),'Retained root cannot patch into History copy')
    probe(4,'01232',lambda e:e['rule']!='generated' and e['role']!='generator' and e['sourcePath']=='docs/backlog.md','Hand-maintained backlog generator claim removed')
    probe(4,'01732',lambda e:e['role']=='reader' and e['sourcePath']=='docs/knowledge/decisions-index/decision-record.md' and e['cutoverAction']=='preserve','Frozen rename copy has no generator role or invented source')
    probe(5,'03883',lambda e:e['cutoverAction']=='preserve' and not e.get('cutoverPatch'),'History audit evidence preserves the past')
    probe(5,'02019',lambda e:e['cutoverAction']=='preserve' and not e.get('cutoverPatch'),'Completed rename paragraph preserves legacy spec witness')
    probe(6,'00007',lambda e:e['cutoverAction']=='phase9-row-flip' and not e.get('cutoverPatch'),'Legacy roots active-until-promotion is migration state')
    probe(6,'04831',lambda e:e['cutoverAction']=='phase9-row-flip','Migration header wins self-reference')
    probe(6,'02322',lambda e:e['cutoverAction']=='preserve-pending-target' and not e.get('cutoverPatch') and not e.get('semanticRowProposal'),'Legacy file changes only at Phase 9 is a semantic sentence; corrected CTR011 history stays intact')
    probe(7,'00719',lambda e:bool(e.get('cutoverPatch')) and 'component-boundary-advisory.md]' not in e['cutoverPatch']['new'],'Basename link label follows new component target')
    probe(8,'03043',lambda e:e['rule']!='provenance' and e['cutoverAction']=='cutover-patch-only','Related list is live outside Literal Snapshot')
    probe(9,'00517',lambda e:e['cutoverAction']=='cutover-patch-only' and e.get('desiredOwner')=='docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md','Retired checkpoint with live exact owner is patched')
    probe(10,'05313',lambda e:bool(e.get('brokenLinkCause')) and e.get('successorNote',{}).get('executable') is False,'Missing-link population records cause and findable successor')
    priorhelp=json.loads((R/'step-02-census-cli-help.json').read_text())['entries']
    for row in c['earlierClassHelpProposals']:
        before=next(x for x in priorhelp if x['edgeId']==row['edgeId'])
        assert before['cutoverAction']=='exact-cutover-patch' and row['cutoverAction']=='preserve-pending-behavioral-proof' and row['blockedStatus']=='blocked' and row['cutoverPatch'] is None
        probes.append({'class':9,'name':row['edgeId']+' free-form scope help is behavioral with candidate text only','oldRejected':True,'newPassed':True})
    sem=module('step-02j-semantics');shell='```\nfind docs/architect -type f\n```'
    assert sem.command_block(shell) and not re.search(r'^\s*```(?:sh|bash|shell)\s*$',shell,re.M)
    assert not sem.command_block('```\nTASK: Read these documents\nnode example\n```')
    probes.append({'class':7,'name':'Untyped shell fence is one command; pasted TASK prompt stays prose','oldRejected':True,'newPassed':True})
    naked='// docs/history/fgos-\n// example/CONTEXT.md'
    fresh,_=parser.units('docs/architect/a.md',naked);previous,_=module('step-02i-parser').units('docs/architect/a.md',naked)
    assert fresh and fresh[0]['references']==['docs/history/fgos-example/CONTEXT.md'] and [x['references'] for x in fresh]!=[x['references'] for x in previous]
    probes.append({'class':9,'name':'Bare wrapped // comment is one complete reference','oldRejected':True,'newPassed':True})
    oldread=module('step-02i-parser')
    for heading in ('ĐỌC TRƯỚC','SCOPE_DOCS'):
        block={'heading':heading,'text':'- docs/specs/runner.md','readLead':''}
        assert parser.operative_read('- docs/specs/runner.md','',block) and not oldread.operative_read('- docs/specs/runner.md','',block)
        probes.append({'class':9,'name':'Operative handoff read list under '+heading,'oldRejected':True,'newPassed':True})
    def retained_cut(e):
        base=re.sub(r':\d+(?:-\d+)?$','',e['normalizedReference'].split('#')[0])
        return parser.exists(base) and not base.startswith(('docs/specs/','docs/architect/')) and bool(e.get('cutoverPatch'))
    assert any(retained_cut(e) for e in baseline['entries']) and not any(retained_cut(e) for e in c['entries'])
    probes.append({'class':3,'name':'Existing retained targets stay preserved in every wrapper context','oldRejected':True,'newPassed':True})
    ctlby={x['controlId']:x for x in c['overlayControls']};effective={tuple(x['baseKey']):x['row'] for x in c['overlayEffectiveRows']}
    for id in ('overlay-004','overlay-005'):
        before=effective[tuple(ctlby[id]['baseKey'])];now=next(x for x in c['earlierClassProposals'] if x['controlId']==id)
        assert before['cutoverAction'].startswith('Step 5 parity-gated') and now['cutoverAction']=='preserve-pending-behavioral-proof' and now['blockedStatus']=='blocked' and now['cutoverPatch'] is None
        probes.append({'class':7,'name':id+' Step 5 parity is explicitly blocked with candidate text only','oldRejected':True,'newPassed':True})
    # Differential lexer execution for wrapped // comments.
    snippet='// `docs/specs/example-\n// continuation.md`'
    ns,_=parser.units('docs/architect/a.md',snippet);bs,_=module('step-02i-parser').units('docs/architect/a.md',snippet)
    assert ns and ns[0]['references']==['docs/specs/example-continuation.md']
    assert [e['references'] for e in ns]!=[e['references'] for e in bs]
    probes.append({'class':9,'name':'wrapped // comment lexer executed','oldRejected':True,'newPassed':True})
    assert all(e.get('blockedStatus')=='blocked' and not e.get('cutoverPatch') for e in c['entries'] if 'pending' in e['cutoverAction'])
    assert not any((e.get('cutoverPatch') or {}).get('old')!=e['matchedExpression'] for e in c['entries'] if e.get('cutoverPatch'))
    assert len({x['class'] for x in probes})==10
    return {'status':'PASS','inheritedRegressionCount':inherited['regressionCount'],'inheritedCheckpoint':'immutable step-02i; superseded semantic expectations remain historical evidence','inherited':inherited,'addedRegressionCount':len(probes),'regressionCount':inherited['regressionCount']+len(probes),'regressionProbes':probes,'currentInvariants':['Every pending row explicitly blocked, no patch','Every patch replaces complete unit','All ten L12-26 classes reject 02i behavior']}
if __name__=='__main__':print(json.dumps(run(json.loads((R/'step-02j-census-maps-portals-prose.json').read_text())),ensure_ascii=False,indent=2))
