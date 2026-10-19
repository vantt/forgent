"""L12-25 independent real-source witnesses; every predicate rejects step-02h.
Counts are witness populations, not claimed census-wide semantic acceptance.
The complete changed-row ledger supplements these explicit defect probes.
"""
import json,re
from pathlib import Path
R=Path(__file__).resolve().parent
patch=lambda e:bool(e.get('cutoverPatch'))
preserved=lambda e:e['cutoverAction']=='preserve' and not patch(e)
nav=lambda e:e['rule']=='navigation' and e['cutoverAction']=='cutover-patch-only'
CLASSES=[
 ('01-migration-state', ['04022','04002','04004','04016','03998','04026','04020','04956','04958','04960','04963','04950'],lambda e:e['cutoverAction']=='phase9-row-flip' and not patch(e)),
 ('02-verified-object-pins',['04805','05227','05226','05228','04804','04722','05096'],nav),
 ('03-wrapped-complete-references',['01336','04735','05262','01898','01852','04739','05266','01877','01878','01634'],lambda e:len(e['physicalSpans'])>1 and not re.search(r'\n\s*>',e['normalizedReference'])),
 ('03-wrapped-markdown-link',['01100'],lambda e:e['syntax']=='markdown-link' and len(e['physicalSpans'])==2),
 ('04-source-locator-and-proof-preserved',['04523','04527','04529','04531','04397','04467','04468','04470','04471','04472','04473','04474','04475','00622','00635','00656','00662','00664','02330','02362','03681','03701'],preserved),
 ('04-history-header-self-reference',['04862'],lambda e:preserved(e) and e['desiredOwner']==e['consumerPath']),
 ('05-source-carriage-heading',['04870','03827'],lambda e:preserved(e) and bool(e.get('carriagePolicy'))),
 ('06-operative-reading-list',['00715','00716'],lambda e:e['rule']=='operative-read' and not patch(e) and e['cutoverAction']=='preserve-pending-target'),
 ('07-section-bounded-line-locators',['04085','04086'],lambda e:not patch(e) and e['cutoverAction']=='preserve-pending-target'),
 ('08-generated-rows',['01232','01233'],lambda e:e['rule']=='generated' and e['role']=='generator' and e['cutoverAction']=='preserve-pending-behavioral-proof'),
 ('08-checker-scan-scope',['05109'],lambda e:e['rule']=='checker-scope' and e['cutoverAction']=='preserve-pending-behavioral-proof'),
 ('09-planning-list-is-reader',['00392','00395'],lambda e:e['role']=='reader' and e['cutoverAction']=='preserve'),
 ('09-retired-handoff-checkpoint',['00516'],lambda e:preserved(e) and e['rule']=='retired-checkpoint-write'),
 ('10-legacy-tree-semantics',['01266','04105','04351'],lambda e:e['rule']=='legacy-tree-semantic' and not patch(e) and e['cutoverAction']=='preserve-pending-target'),
 ('10-fragment-carriage-successor',['00240','00419','00585','00697'],lambda e:bool(e.get('successorNote',{}).get('successor','').endswith('#literal-snapshot')) and not e['successorNote']['executable'] and not e['successorNote']['mechanicalCheck']['failures']),
 ('settled-retired-read',['00030'],lambda e:preserved(e)),
 ('exact-retained-subfolder-file',['00912'],lambda e:e['desiredOwner']=='docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md'),
]
def measure(c,source_join):
    before=json.loads((R/'step-02h-census-maps-portals-prose.json').read_text())['entries'];by={e['edgeId']:e for e in before};joined=source_join(before,c['entries']);out=[]
    for name,ids,valid in CLASSES:
        bs=[by['maps-h-'+id] for id in ids]
        bad=[e for b in bs for e in joined[b['edgeId']] if not valid(e)]
        missing=[b['edgeId'] for b in bs if not joined[b['edgeId']]]
        assert all(not valid(b) for b in bs),('witness did not fail old behavior',name,[b['edgeId'] for b in bs if valid(b)])
        out.append({'defectClass':name,'baseline':'02h','beforeCount':len(bs),'afterCount':len(bad)+len(missing),'beforeRowIds':[b['edgeId'] for b in bs],'afterRowIds':[e['edgeId'] for e in bad],'missingJoins':missing,'measurement':'Independent expected outcome on all listed real defect witnesses; every witness rejects old behavior; full changed-row ledger and A50 remain mandatory','examples':[{'before':{k:b.get(k) for k in ('edgeId','consumerPath','line','normalizedReference','rule','cutoverAction','desiredOwner')},'after':[{k:e.get(k) for k in ('edgeId','normalizedReference','rule','cutoverAction','desiredOwner','successorNote')} for e in joined[b['edgeId']]]} for b in bs[:2]]})
    return out
