#!/usr/bin/env python3
"""L12-39 probes; inherited suites are replayed unchanged separately."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json,copy,unittest.mock
P=pathlib.Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location('m',P/'step-03-check.py');m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
PIN='ae141550c2e022310de7a0efea757580c0b2479f'
def main():
 m.SETS=tuple(f'{i:03}' for i in range(1,73));rs=m.records();c=m.Checker(PIN);cases=[]
 def record(key):return next(r for r in rs if any(e['edgeId']==key for e in r['edges']))
 def probe(name,r,mutate,expected):
  good=c.check_record(r,apply=False);assert not good,(name,good)
  bad=copy.deepcopy(r);mutate(bad);names=sorted({x['check'] for x in c.check_record(bad,apply=False)});assert expected in names,(name,names)
  cases.append({'rule':name,'expectedCheck':expected,'observedChecks':names,'rejected':True})
 def wrong_title(r):
  e=next(e for e in r['edges'] if e['edgeId']=='maps-j-04163');e['reason']+=' Non-executable successor note: '+m.decision_narrative_holders(PIN,'0035')[0]+'.'
 probe('L12-39(1): same number but wrong heading title rejected',record('maps-j-04163'),wrong_title,'removed-decision-narrative-successor')
 def wrong_0032(r):
  e=next(e for e in r['edges'] if e['edgeId']=='maps-j-04191');holder=next(h for h in m.decision_narrative_holders(PIN,'0032') if '/work-state/' in h);e['reason']+=' Non-executable successor note: '+holder+'.'
 probe('L12-39(1): Iron Law cannot acquire Team Harness successor',record('maps-j-04191'),wrong_0032,'removed-decision-narrative-successor')
 def retired_patch(r):
  e=next(e for e in r['edges'] if e['edgeId']=='maps-j-08355');e.update(target='docs/platform/decision-citation-drift/spec.md',disposition='patch')
 probe('L12-39(2): non-RUL10 work-state edge cannot carry a patch',record('maps-j-08355'),retired_patch,'retiring-edge-no-patch')
 def missing_retirement(r):
  e=next(e for e in r['edges'] if e['edgeId']=='maps-j-08355');e.pop('retiresWithTree');e.update({k:e.get(k) for k in m.EDGE_FIELDS});e.update(disposition='preserve',timing='none')
 probe('L12-39(2): non-RUL10 work-state edge must retire',record('maps-j-08355'),missing_retirement,'work-state-carried-passage')
 def invalid_retirement(r):
  r['edges'][0]['retiresWithTree']=True
 probe('L12-39(2): per-edge retirement is limited to the mixed work-state record',record('maps-j-04163'),invalid_retirement,'per-edge-retirement-eligibility')
 # Positive admitted lead-ruling category and the independent set-closure ceiling.
 # Current records may have resolved every ruling. Keep the original complete
 # committed positive park fixture, rather than dropping the category mutation.
 archived=[json.loads(line) for line in m.blob('c0c64372cbb98f842b8566860f7d786d95a8e57a',str(m.REL/'step-03-records/batch-072.jsonl')).decode().splitlines()]
 lead=next(r for r in archived if r['file']=='docs/knowledge/how-to-close-a-duplicate-superseded-or-admin-decided-work-it/handle-a-duplicate-work-item.md')
 assert not c.check_record(lead,apply=False)
 report=c.all([lead]);assert report['openLeadRulingEdgesBySet'][lead['reviewSet']] and lead['reviewSet'] in report['notClosableSets']
 def invalid_category(r):
  e=next(e for e in r['edges'] if e.get('blockedCategory')=='lead-ruling');e.update(blockedCategory='invented-lead-ruling',dependencyCategory='invented-lead-ruling')
 probe('L12-39(5): only admitted park categories commit',lead,invalid_category,'dependency-category')
 # A valid historical preserve must stop being exempt if its actual heading is removed.
 r=record('maps-j-04295');body=m.blob(PIN,r['file']).decode();assert m.history_at(body,next(e for e in r['edges'] if e['edgeId']=='maps-j-04295')['sourceSpans'][0]['line'],r['file'])
 # L12-40 also exempts self-aliases. Exercise the heading mutation in a
 # distinct live consumer fixture so that independent exemption cannot mask it.
 r=copy.deepcopy(r);source_file=r['file'];r['file']=record('maps-j-04163')['file']
 original=m.blob
 with unittest.mock.patch.object(m,'blob',side_effect=lambda pin,path:original(pin,source_file).replace(b'## Document history',b'## Current navigation') if path==r['file'] else original(pin,path)):
  names=sorted({x['check'] for x in c.check_record(r,apply=False)});assert 'renamed-alias-preserve' in names;cases.append({'rule':'L12-39(6): history exemption comes from actual heading','expectedCheck':'renamed-alias-preserve','observedChecks':names,'rejected':True})
 r=next(r for r in rs if any('0001-event-log-la-su-that.md' in e['matchedExpression'] and e.get('authorAddedEdge') for e in r['edges']))
 def omit_basename(r):
  e=next(e for e in r['edges'] if '0001-event-log-la-su-that.md' in e['matchedExpression']);key=e['edgeId'];r['edges'].remove(e);r['checks']['coverage']['authorAddedEdgeIds'].remove(key);r['checks']['coverage']['legacyScan']['candidates']=[x for x in r['checks']['coverage']['legacyScan']['candidates'] if x.get('edgeId')!=key];r['checks']['coverage'].get('extraLocatorSearches',{}).pop(key,None)
 probe('L12-39(7): deleted decision basename joins scan, cannot be omitted',r,omit_basename,'author-added-search-coverage')
 return {'pin':PIN,'negativeProbes':len(cases),'allRejected':True,'probes':cases,'positiveControls':['number-and-title successor notes accepted','minimal non-RUL10 retirement markers accepted','lead-ruling parks accepted with explicit notClosableSets','Document history capture identities preserve','manually added deleted basename joins extended scanner'],'inheritedSuites':'87 + 23 + 25 + 16 + 11 + 4; no probe deleted'}
if __name__=='__main__':print(json.dumps(main(),ensure_ascii=False,indent=2))
