#!/usr/bin/env python3
"""L12-40 paired controls on the real renamed-alias predicate; no consumer writes."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json,copy,unittest.mock
P=pathlib.Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location('m',P/'step-03-check.py');m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
PIN='ae141550c2e022310de7a0efea757580c0b2479f'
def main():
 m.SETS=('072',);rs=m.records();c=m.Checker(PIN)
 r=next(r for r in rs if any(e['edgeId']=='maps-j-04345' for e in r['edges']));e=next(e for e in r['edges'] if e['edgeId']=='maps-j-04345');original=m.blob
 assert not c.check_record(r,apply=False)
 cases=[]
 # Use the same real missing spelling and committed non-self alias; only source-region bytes vary.
 for name,body,line in [('fenced-code','```text\n'+e['matchedExpression']+'\n```\n',2),('blockquote-captured-output','> '+e['matchedExpression']+'\n',1),('explicit-history','## Document history\n'+e['matchedExpression']+'\n',2),('completed-grep-prose','The real run against tsk-63c surfaced hits:\n'+e['matchedExpression']+'\n',2)]:
  edge=copy.deepcopy(e);edge['sourceSpans']=[dict(line=line,columnStart=1,columnEndExclusive=2,text='x')]
  with unittest.mock.patch.object(m,'blob',side_effect=lambda pin,path:body.encode() if path==r['file'] else original(pin,path)):
   assert not c.renamed_alias_holders(r,edge),name
  plain='\n'*(line-1)+e['matchedExpression']+'\n'
  with unittest.mock.patch.object(m,'blob',side_effect=lambda pin,path:plain.encode() if path==r['file'] else original(pin,path)):
   holders=c.renamed_alias_holders(r,edge);assert holders,name
  cases.append({'rule':'L12-40 '+name,'positiveExempt':True,'negativeWithoutRegionRejected':True,'liveHolders':holders})
 # Region ends at closing fence / following heading and blockquotes do not leak to prose.
 for body,line in [('```\nx\n```\n'+e['matchedExpression'],4),('> x\n'+e['matchedExpression'],2),('## Document history\nx\n## Current reading\n'+e['matchedExpression'],4)]:
  edge=copy.deepcopy(e);edge['sourceSpans'][0]['line']=line
  with unittest.mock.patch.object(m,'blob',side_effect=lambda pin,path:body.encode() if path==r['file'] else original(pin,path)):
   assert c.renamed_alias_holders(r,edge)
 # Self exemption uses the actual registry, in live prose without evidence framing.
 edge=copy.deepcopy(e);edge['sourceSpans'][0]['line']=1;holder=holders[0];selfr=copy.deepcopy(r);selfr['file']=holder
 with unittest.mock.patch.object(m,'blob',side_effect=lambda pin,path:edge['matchedExpression'].encode() if path in (r['file'],holder) else original(pin,path)):
  assert not c.renamed_alias_holders(selfr,edge)
  assert c.renamed_alias_holders(r,edge)
 cases.append({'rule':'L12-40 self-alias','positiveExempt':True,'negativeDifferentConsumerRejected':True,'holder':holder})
 # All three actual edge outcomes are ordinary complete records, not merely predicate fixtures.
 for key in ('maps-j-04320','maps-j-04345','maps-j-04353'):
  rec=next(r for r in rs if any(e['edgeId']==key for e in r['edges']));ed=next(e for e in rec['edges'] if e['edgeId']==key)
  assert ed['disposition']=='preserve' and not c.check_record(rec,apply=False),(key,c.check_record(rec,apply=False))
 return {'pin':PIN,'pairedProbes':len(cases),'negativeProbes':len(cases)+3,'allRejected':True,'regionBoundaryNegatives':3,'probes':cases,'actualPreserves':['04320','04345','04353'],'priorArt':'Extends existing renamed_alias_holders (introduced 75ba6957a); reuses history_at and committed resolver aliases. No production mechanism.'}
if __name__=='__main__':print(json.dumps(main(),ensure_ascii=False,indent=2))
